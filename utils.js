const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const jwt = require('jsonwebtoken');

// 1. Configuração do Cloudinary
// As credenciais virão do arquivo .env que criaremos no final
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Configuração do Multer para upload no Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'blog_media',
    // 'auto' é essencial aqui para que o Cloudinary aceite tanto imagens (jpg/png) quanto vídeos (mp4/webm)
    resource_type: 'auto', 
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'webm']
  },
});

// Middleware que usaremos nas rotas para interceptar o upload
const upload = multer({ storage: storage });

// 3. Middleware de Segurança (Autenticação JWT para o Admin)
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Salva os dados do usuário na requisição
    
    // Garante que apenas o admin acesse
    if (req.user.role !== 'admin') {
       return res.status(403).json({ error: 'Acesso restrito. Privilégios de administrador necessários.' });
    }
    
    next(); // Passa para o próximo passo da rota
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

// 4. Utilitário de SEO: Gerador de Slugs (URLs amigáveis)
// Transforma "Meu Novo Post!" em "meu-novo-post"
const generateSlug = (text) => {
  return text.toString().toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Substitui espaços por hífen
    .replace(/[^\w\-]+/g, '')       // Remove caracteres especiais
    .replace(/\-\-+/g, '-');        // Evita hifens duplicados
};

module.exports = { cloudinary, upload, authenticateAdmin, generateSlug };