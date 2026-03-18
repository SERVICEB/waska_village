const mongoose = require('mongoose');

const depenseSchema = new mongoose.Schema({
    type: { type: String, required: true },
    beneficiaire: { type: String, required: true },
    montant: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    statut: { type: String, default: 'En attente' },
    justificatif: String,
    fileName: String,
    motif: String
}, { timestamps: true });

// LA LIGNE CI-DESSOUS EST CRUCIALE
module.exports = mongoose.model('Depense', depenseSchema);