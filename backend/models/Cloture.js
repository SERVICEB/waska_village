const mongoose = require('mongoose');

const clotureSchema = new mongoose.Schema({
    pointDeVente: {
        type: String,
        required: true, 
        enum: ['Réception', 'bar', 'resto'], 
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
    // Champ crucial pour l'affichage rapide sur le Dashboard RAF
    totalVentes: { 
        type: Number, 
        default: 0 
    },
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
    details: {
        type: Array,
        default: []
    },
    audite: {
        type: Boolean,
        default: false
    }, 
    statusAudit: { // Ajouté pour matcher ta fonction handleAuditAction
        type: String,
        enum: ['Valide', 'Ecart', 'Attente'],
        default: 'Attente'
    },
    dateAudite: {
        type: Date
    },
    auditeurNom: { 
        type: String 
    },
    noteEcart: { // Harmonisé avec ton frontend
        type: String,
        default: ""
    }
}, { timestamps: true });

clotureSchema.index({ createdAt: -1, pointDeVente: 1 });

module.exports = mongoose.model('Cloture', clotureSchema);