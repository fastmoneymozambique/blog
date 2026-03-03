// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes'); // Será criado nos próximos passos

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares essenciais
app.use(cors());
app.use(express.json()); // Para parsear JSON no body das requisições
app.use(express.urlencoded({ extended: true })); 

// Servir os arquivos estáticos do front-end (HTML, CSS, JS) futuramente
app.use(express.static(path.join(__dirname)));

// Definição das rotas da API
app.use('/api', apiRoutes);

// Conexão com o MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('🔥 MongoDB conectado com sucesso!');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando perfeitamente na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Erro crítico ao conectar no MongoDB:', err);
    process.exit(1);
  });

// Tratamento de erros globais
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
});