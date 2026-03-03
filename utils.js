const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const jwt = require('jsonwebtoken');

// 1. Configuração do Cloudinary usando a URL única
// O Cloudinary detecta automaticamente a variável CLOUDINARY_URL no seu arquivo .env ou no Render
cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL
});

// 2. Configuração do Multer para upload no Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'blog_media',
    // 'auto' permite que o Cloudinary aceite tanto imagens quanto vídeos (mp4, mov, etc)
    resource_type: 'auto', 
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'webm']
  },
});

// Middleware que intercepta o arquivo enviado pelo formulário (admin.html)
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
    
    // Garante que apenas o admin acesse rotas de criação/exclusão
    if (req.user.role !== 'admin') {
       return res.status(403).json({ error: 'Acesso restrito. Privilégios de administrador necessários.' });
    }
    
    next(); 
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

// 4. Utilitário de SEO: Gerador de Slugs (URLs amigáveis)
// Transforma "Como Criar um Blog!" em "como-criar-um-blog"
const generateSlug = (text) => {
  if (!text) return '';
  return text.toString().toLowerCase()
    .trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, '-')           // Substitui espaços por hífen
    .replace(/[^\w\-]+/g, '')       // Remove caracteres especiais
    .replace(/\-\-+/g, '-');        // Evita hifens duplicados
};

module.exports = { cloudinary, upload, authenticateAdmin, generateSlug };