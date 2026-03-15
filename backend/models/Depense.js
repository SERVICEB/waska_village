const mongoose = require('mongoose');

const depenseSchema = new mongoose.Schema({
  motif: { type: String, required: true },
  montant: { type: Number, required: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Depense', depenseSchema);