const mongoose = require('mongoose');

// 1. Schema do Usuário (Painel Admin)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' }
}, { timestamps: true });

// 2. Schema de Categorias
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true }
}, { timestamps: true });

// 3. Schema de Posts (Estrutura com 3 posições de mídia)
const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  summary: { type: String, required: true },
  content: { type: String, required: true },
  
  // Mídia do Topo (Principal)
  mediaPrincipal: {
    url: { type: String, default: '' },
    public_id: { type: String, default: '' },
    resource_type: { type: String, enum: ['image', 'video', 'none'], default: 'none' }
  },

  // Mídia do Meio (Entre parágrafos)
  mediaMeio: {
    url: { type: String, default: '' },
    public_id: { type: String, default: '' },
    resource_type: { type: String, enum: ['image', 'video', 'none'], default: 'none' }
  },

  // Mídia do Fim (Encerramento)
  mediaFim: {
    url: { type: String, default: '' },
    public_id: { type: String, default: '' },
    resource_type: { type: String, enum: ['image', 'video', 'none'], default: 'none' }
  },
  
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  
  seo: {
    metaTitle: { type: String },
    metaDescription: { type: String },
    keywords: { type: [String] }
  },

  metrics: {
    views: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 } // Receita manual ou simplificada
  },
  
  published: { type: Boolean, default: true }
}, { timestamps: true });

// Exportando os modelos
const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const Post = mongoose.model('Post', postSchema);

module.exports = { User, Category, Post };