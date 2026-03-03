const bcrypt = require('bcryptjs');
const { User } = require('./models');

// Conexão com o MongoDB
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
    // ------------------------------------------

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando perfeitamente na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Erro crítico ao conectar no MongoDB:', err);
    process.exit(1);
  });