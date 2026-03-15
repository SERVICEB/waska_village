const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  items: [{
    product: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product',
      required: true 
    },
    name: { type: String, required: true },
    qty: { type: Number, required: true, default: 1 },
    price: { type: Number, required: true }
  }],
  subTotal: { type: Number, required: true },
  remise: { type: Number, default: 0 },
  total: { type: Number, required: true },
  table: { type: String }, // Optionnel (pour le resto)
  mode: { 
    type: String, 
    enum: ['CASH', 'MOBILE'], 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['bar', 'resto'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['VALIDÉ', 'REMBOURSÉ'], 
    default: 'VALIDÉ' 
  },
  motif: { type: String }, // Motif d'annulation
  heure: { type: String }  // Format "14:30" pour affichage rapide
}, { 
  timestamps: true // Crée automatiquement createdAt et updatedAt
});

// Index pour accélérer la recherche par date dans le journal
SaleSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Sale', SaleSchema);