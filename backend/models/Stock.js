const mongoose = require('mongoose');

// Sous-schéma pour l'historique des mouvements embarqué dans chaque article
const mouvementSchema = new mongoose.Schema({
    type:   { type: String, enum: ['ENTRÉE', 'SORTIE', 'INVENTAIRE'], required: true },
    qty:    { type: Number, required: true },
    date:   { type: String },           // stocké en chaîne formatée fr-FR
    person: { type: String, default: 'Anonyme' },
    reason: { type: String, default: '' }
}, { _id: false });

const stockSchema = new mongoose.Schema({
    nom:          { type: String, required: true },
    categorie:    {
        type: String,
        enum: ['Boisson', 'Nourriture', 'Entretien', 'Divers', 'Bar', 'Cuisine', 'Hôtel'],
        default: 'Divers'
    },
    quantite:     { type: Number, default: 0 },
    unite:        { type: String, default: 'pcs' },
    seuilAlerte:  { type: Number, default: 5 },
    prixAchat:    { type: Number, default: 0 },

    // ── Vente en caisse ──────────────────────────────────────────────────────
    // Si prixVente > 0, l'article apparaît dans la caisse et peut être vendu
    prixVente:    { type: Number, default: 0 },

    // Caisses où cet article est visible (ex: ['bar', 'resto'])
    // Vide = non vendable en caisse
    caisses:      { type: [String], default: [] },

    // Historique embarqué — 200 derniers mouvements max par article
    mouvements:   { type: [mouvementSchema], default: [] }
}, { timestamps: true });

// Index pour les alertes (route /alerts)
stockSchema.index({ quantite: 1, seuilAlerte: 1 });
stockSchema.index({ categorie: 1 });

module.exports = mongoose.model('Stock', stockSchema);