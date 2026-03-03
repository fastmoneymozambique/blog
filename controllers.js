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
    res.status(400).json({ error: 'Erro ao criar categoria. Pode já existir.' });
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
// 3. POSTS (CRUD E SEO)
// ==========================================
exports.createPost = async (req, res) => {
  try {
    const { title, summary, content, category, metaTitle, metaDescription, keywords } = req.body;
    const slug = generateSlug(title);
    
    let mediaData = { url: '', public_id: '', resource_type: 'none' };

    // Se um arquivo foi enviado pelo Multer/Cloudinary
    if (req.file) {
      mediaData = {
        url: req.file.path,
        public_id: req.file.filename,
        resource_type: req.file.mimetype.startsWith('video') ? 'video' : 'image'
      };
    }

    const post = await Post.create({
      title, slug, summary, content, category,
      media: mediaData,
      seo: { metaTitle, metaDescription, keywords: keywords ? keywords.split(',') : [] }
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar post.', details: error.message });
  }
};

// Busca todos os posts (com paginação e filtros de pesquisa/categoria)
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

// ==========================================
// 4. MÉTRICAS E DASHBOARD
// ==========================================
// Busca um post específico e INCREMENTA a visualização (Views)
exports.getPostBySlug = async (req, res) => {
  try {
    const post = await Post.findOneAndUpdate(
      { slug: req.params.slug, published: true },
      { $inc: { 'metrics.views': 1 } }, // Incrementa 1 view automaticamente
      { new: true }
    ).populate('category', 'name slug');

    if (!post) return res.status(404).json({ error: 'Post não encontrado.' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar post.' });
  }
};

// Rota para o front-end disparar quando houver uma impressão ou clique em anúncio
exports.registerInteraction = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'clicks' ou 'impressions'

    if (!['clicks', 'impressions'].includes(type)) {
      return res.status(400).json({ error: 'Tipo de interação inválida.' });
    }

    // O hook no models.js vai recalcular a receita (revenue) automaticamente ao salvar
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: 'Post não encontrado.' });

    post.metrics[type] += 1;
    await post.save(); // Dispara o recalculo de CPC/CPM

    res.json({ message: `${type} incrementado com sucesso.`, metrics: post.metrics });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar interação.' });
  }
};

// ==========================================
// 5. EXCLUSÃO COM LIMPEZA NO CLOUDINARY
// ==========================================
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post não encontrado.' });

    // Se tem mídia no Cloudinary, deleta lá também para não gastar espaço
    if (post.media && post.media.public_id) {
      await cloudinary.uploader.destroy(post.media.public_id, { resource_type: post.media.resource_type });
    }

    await post.deleteOne();
    res.json({ message: 'Post deletado com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar post.' });
  }
};