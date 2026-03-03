const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Category, Post } = require('./models');
const { generateSlug, cloudinary } = require('./utils');

// ==========================================
// 1. AUTENTICAÇÃO (ADMIN)
// ==========================================
exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Senha incorreta.' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Erro no login.' });
  }
};

// ==========================================
// 2. CATEGORIAS
// ==========================================
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const slug = generateSlug(name);
    const category = await Category.create({ name, slug });
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar categoria.' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar categorias.' });
  }
};

// ==========================================
// 3. POSTS (CRUD COM 3 MÍDIAS)
// ==========================================
exports.createPost = async (req, res) => {
  try {
    const { title, summary, content, category, metaTitle, metaDescription, keywords } = req.body;
    const slug = generateSlug(title);
    
    // Função auxiliar para processar cada arquivo enviado
    const formatMedia = (files, fieldName) => {
      if (files && files[fieldName] && files[fieldName][0]) {
        const file = files[fieldName][0];
        return {
          url: file.path,
          public_id: file.filename,
          resource_type: file.mimetype.startsWith('video') ? 'video' : 'image'
        };
      }
      return { url: '', public_id: '', resource_type: 'none' };
    };

    const post = await Post.create({
      title, 
      slug, 
      summary, 
      content, 
      category,
      mediaPrincipal: formatMedia(req.files, 'mediaPrincipal'),
      mediaMeio: formatMedia(req.files, 'mediaMeio'),
      mediaFim: formatMedia(req.files, 'mediaFim'),
      seo: { 
        metaTitle, 
        metaDescription, 
        keywords: keywords ? keywords.split(',') : [] 
      }
    });

    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Erro ao criar post.', details: error.message });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 10 } = req.query;
    let query = { published: true };

    if (search) query.title = { $regex: search, $options: 'i' };
    if (category) query.category = category;

    const posts = await Post.find(query)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
    const count = await Post.countDocuments(query);
    res.json({ posts, totalPages: Math.ceil(count / limit), currentPage: page });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar posts.' });
  }
};

exports.getPostBySlug = async (req, res) => {
  try {
    const post = await Post.findOneAndUpdate(
      { slug: req.params.slug, published: true },
      { $inc: { 'metrics.views': 1 } },
      { new: true }
    ).populate('category', 'name slug');

    if (!post) return res.status(404).json({ error: 'Post não encontrado.' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar post.' });
  }
};

// ==========================================
// 4. EXCLUSÃO (LIMPA ATÉ 3 MÍDIAS NO CLOUDINARY)
// ==========================================
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post não encontrado.' });

    // Lista de campos de mídia para verificar e deletar
    const mediaFields = ['mediaPrincipal', 'mediaMeio', 'mediaFim'];

    for (const field of mediaFields) {
      if (post[field] && post[field].public_id) {
        await cloudinary.uploader.destroy(post[field].public_id, { 
          resource_type: post[field].resource_type 
        });
      }
    }

    await post.deleteOne();
    res.json({ message: 'Post deletado com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar post.' });
  }
};