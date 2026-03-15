const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  type: { 
    type: String, 
    enum: ['bar', 'resto'], 
    required: true 
  },
  status: { type: String, default: 'disponible' }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);