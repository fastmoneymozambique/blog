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
  deletePost
} = require('./controllers');

// Importando os middlewares de segurança e upload
const { authenticateAdmin, upload } = require('./utils');

// ==========================================
// 1. ROTAS DE AUTENTICAÇÃO
// ==========================================
router.post('/admin/login', adminLogin);

// ==========================================
// 2. ROTAS PÚBLICAS
// ==========================================
// Listar categorias
router.get('/categories', getCategories);

// Listar posts (Home)
router.get('/posts', getPosts);

// Abrir um post completo pelo Slug
router.get('/posts/:slug', getPostBySlug);

// ==========================================
// 3. ROTAS PROTEGIDAS (PAINEL ADMIN)
// ==========================================
// Criar categoria
router.post('/categories', authenticateAdmin, createCategory);

// CRIAR POST (Configuração para 3 campos de mídia diferentes)
router.post('/posts', 
  authenticateAdmin, 
  upload.fields([
    { name: 'mediaPrincipal', maxCount: 1 },
    { name: 'mediaMeio', maxCount: 1 },
    { name: 'mediaFim', maxCount: 1 }
  ]), 
  createPost
);

// Deletar post
router.delete('/posts/:id', authenticateAdmin, deletePost);

module.exports = router;