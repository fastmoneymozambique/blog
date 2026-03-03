require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');

const apiRoutes = require('./routes');
const { User } = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(express.static(path.join(__dirname)));

// Rotas
app.use('/api', apiRoutes);

// Conexão MongoDB e Criação de Admin
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('🔥 MongoDB conectado com sucesso!');
    
    try {
      const initialUser = process.env.ADMIN_USERNAME;
      const initialPass = process.env.ADMIN_PASSWORD;

      if (initialUser && initialPass) {
        const adminExists = await User.findOne({ username: initialUser });
        if (!adminExists) {
          const hashedPassword = await bcrypt.hash(initialPass, 10); 
          await User.create({
            username: initialUser,
            password: hashedPassword,
            role: 'admin'
          });
          console.log('✅ Admin inicial criado com sucesso!');
        }
      }
    } catch (err) {
      console.error('Erro ao verificar admin:', err);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Erro crítico ao conectar no MongoDB:', err);
    process.exit(1);
  });

// ==========================================
// TRATAMENTO DE ERROS GLOBAIS (MELHORADO)
// ==========================================
app.use((err, req, res, next) => {
  // Isso imprime o erro detalhado nos logs do Render (Dashboard do Render > Logs)
  console.error('=======================================');
  console.error('DETALHE DO ERRO NO SERVIDOR:', err);
  console.error('=======================================');
  
  // Envia a mensagem real do erro para o alerta do navegador
  res.status(500).json({ 
    error: err.message || 'Erro interno no servidor.' 
  }); 
});