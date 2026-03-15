const mongoose = require('mongoose');

const clotureSchema = new mongoose.Schema({
    // Harmonisé avec le frontend (bar/resto)
    pointDeVente: {
        type: String,
        required: true, 
        enum: ['Réception', 'bar', 'resto'], // Ajout des minuscules pour matcher ta caisse
        default: 'Réception'
    }, 
    caissier: {
        type: String, 
        required: true,
        default: "Anonyme"
    },
    caissierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // On aplatit un peu pour plus de flexibilité avec les envois Axios
    stats: {
        theorique: { 
            total: { type: Number, default: 0 },
            entrees: { type: Number, default: 0 },
            sorties: { type: Number, default: 0 },
            cash: { type: Number, default: 0 },
            mobile: { type: Number, default: 0 }
        },
        declare: { 
            total: { type: Number, default: 0 },
            cash: { type: Number, default: 0 },
            mobile: { type: Number, default: 0 }
        },
        ecart: { 
            type: Number, 
            default: 0 
        }
    },
    // Pour stocker le détail des ventes (ton tableau de produits)
    details: {
        type: Array,
        default: []
    },
    audite: {
        type: Boolean,
        default: false
    }, 
    dateAudite: {
        type: Date
    },
    auditeurNom: { 
        type: String 
    },
    notes: {
        type: String,
        default: ""
    }
}, { timestamps: true });

// Indexation pour des recherches rapides
clotureSchema.index({ createdAt: -1, pointDeVente: 1 });

module.exports = mongoose.model('Cloture', clotureSchema);