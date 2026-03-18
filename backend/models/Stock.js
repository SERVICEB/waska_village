const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    categorie: { type: String, enum: ['Boisson', 'Nourriture', 'Entretien', 'Divers'], default: 'Divers' },
    quantite: { type: Number, default: 0 },
    unite: { type: String, default: 'pcs' }, // ex: bouteilles, kg, sacs
    seuilAlerte: { type: Number, default: 5 }, // Le dashboard s'allume en rouge si quantite <= seuilAlerte
    prixAchat: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Stock', stockSchema);