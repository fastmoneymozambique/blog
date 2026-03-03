const express = require('express');
const router = express.Router();

// Importando as funções do Controller
const {
  adminLogin,
  createCategory,
  getCategories,
  createPost,
  getPosts,
  getPostBySlug,
  registerInteraction,
  deletePost
} = require('./controllers');

// Importando os middlewares de segurança e upload
const { authenticateAdmin, upload } = require('./utils');

// ==========================================
// 1. ROTAS DE AUTENTICAÇÃO
// ==========================================
// Rota para o Admin fazer login e receber o Token JWT
router.post('/admin/login', adminLogin);

// ==========================================
// 2. ROTAS PÚBLICAS (Visitantes e SEO)
// ==========================================
// Listar todas as categorias no menu do blog
router.get('/categories', getCategories);

// Listar posts na página inicial (suporta ?search= e ?category=)
router.get('/posts', getPosts);

// Abrir um post completo pela URL amigável (já incrementa a "view" automaticamente)
router.get('/posts/:slug', getPostBySlug);

// Rota crucial para o Dashboard: O front-end chama essa rota via fetch() 
// toda vez que um banner for clicado ou gerado na tela (impressão)
router.post('/posts/:id/interaction', registerInteraction);

// ==========================================
// 3. ROTAS PROTEGIDAS (Painel Admin)
// ==========================================
// Criar uma nova categoria (Exige Token Admin)
router.post('/categories', authenticateAdmin, createCategory);

// Criar um novo post. 
// Nota: O upload.single('media') intercepta o arquivo de vídeo ou imagem,
// manda pro Cloudinary, e só depois passa para a função createPost.
router.post('/posts', authenticateAdmin, upload.single('media'), createPost);

// Deletar um post e limpar a mídia do Cloudinary para economizar espaço
router.delete('/posts/:id', authenticateAdmin, deletePost);

module.exports = router;