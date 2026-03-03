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
  slug: { type: String, required: true, unique: true } // Para URLs amigáveis
}, { timestamps: true });

// 3. Schema de Posts (Conteúdo, SEO, Mídia e Métricas)
const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true }, // URL amigável (ex: meu-primeiro-post)
  summary: { type: String, required: true },
  content: { type: String, required: true },
  
  // Cloudinary Mídia
  media: {
    url: { type: String, default: '' },
    public_id: { type: String, default: '' },
    resource_type: { type: String, enum: ['image', 'video', 'none'], default: 'none' }
  },
  
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  
  // SEO Avançado
  seo: {
    metaTitle: { type: String },
    metaDescription: { type: String },
    keywords: { type: [String] }
  },

  // Sistema de Métricas e Monetização
  metrics: {
    views: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 }, // Impressões de anúncios/banners
    clicks: { type: Number, default: 0 },      // Cliques gerados no post
    cpc: { type: Number, default: 0.15 },      // Custo Por Clique (padrão)
    cpm: { type: Number, default: 1.50 },      // Custo Por Mil Impressões (padrão)
    revenue: { type: Number, default: 0 }      // Receita gerada pelo post
  },
  
  published: { type: Boolean, default: true }
}, { timestamps: true });

// Middleware do Mongoose: Calcula a receita automaticamente antes de salvar no banco
// Receita = (Cliques * CPC) + ((Impressões / 1000) * CPM)
postSchema.pre('save', function(next) {
  if (this.isModified('metrics.clicks') || this.isModified('metrics.impressions') || this.isModified('metrics.cpc') || this.isModified('metrics.cpm')) {
    const revenueFromClicks = this.metrics.clicks * this.metrics.cpc;
    const revenueFromImpressions = (this.metrics.impressions / 1000) * this.metrics.cpm;
    this.metrics.revenue = revenueFromClicks + revenueFromImpressions;
  }
  next();
});

// Exportando os modelos
const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const Post = mongoose.model('Post', postSchema);

module.exports = { User, Category, Post };