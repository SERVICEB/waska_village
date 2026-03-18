const mongoose = require('mongoose');

const dechargeSchema = new mongoose.Schema({
    type: { type: String, required: true }, 
    montant: { type: Number, required: true },
    date: { type: Date, required: true, default: Date.now },
    beneficiaire: { type: String, required: true }, 
    justificatif: { type: String }, 
    fileName: { type: String }, // Corrigé de filName à fileName
    auteur: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    }, // Corrigé de createdbId à auteur pour matcher ton contrôleur
}, {
    timestamps: true
}); 

module.exports = mongoose.model('Decharge', dechargeSchema);