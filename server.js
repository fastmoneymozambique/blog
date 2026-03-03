require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');

// Importando as rotas e o modelo de Usuário
const apiRoutes = require('./routes');
const { User } = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares essenciais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(express.static(path.join(__dirname)));

// Definição das rotas da API
app.use('/api', apiRoutes);

// Conexão com o MongoDB e criação segura do Admin
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('🔥 MongoDB conectado com sucesso!');
    
    // --- SCRIPT SEGURO PARA CRIAR O PRIMEIRO ADMIN ---
    try {
      const initialUser = process.env.ADMIN_USERNAME;
      const initialPass = process.env.ADMIN_PASSWORD;

      // Só tenta criar se as variáveis existirem no Render
      if (initialUser && initialPass) {
        const adminExists = await User.findOne({ username: initialUser });
        if (!adminExists) {
          const hashedPassword = await bcrypt.hash(initialPass, 10); 
          await User.create({
            username: initialUser,
            password: hashedPassword,
            role: 'admin'
          });
          console.log('✅ Admin inicial criado com sucesso via Variáveis de Ambiente!');
        }
      }
    } catch (err) {
      console.error('Erro ao verificar/criar admin:', err);
    }
    // ------------------------------------------------

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando perfeitamente na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Erro crítico ao conectar no MongoDB:', err);
    process.exit(1);
  });

// ==========================================
// TRATAMENTO DE ERROS GLOBAIS (ATUALIZADO)
// ==========================================
app.use((err, req, res, next) => {
  // Mostra o erro detalhado nos logs do Render
  console.error('ERRO DETECTADO NO SERVIDOR:', err.stack);
  
  // Devolve a mensagem exata do erro para o alerta do Front-end
  res.status(500).json({ 
    error: err.message || 'Erro desconhecido no servidor. Verifique os logs do Render.' 
  }); 
});