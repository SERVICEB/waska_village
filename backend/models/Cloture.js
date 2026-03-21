const mongoose = require('mongoose');

const clotureSchema = new mongoose.Schema({
    pointDeVente: {
        type: String,
        required: true,
        // Accepte les deux graphies + les caisses secondaires
        enum: ['Réception', 'Reception', 'bar', 'resto'],
        default: 'Réception'
    },
    caissier:    { type: String, required: true },
    caissierId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    totalVentes: { type: Number, default: 0 },
    stats: {
        theorique: {
            total:   { type: Number, default: 0 },
            entrees: { type: Number, default: 0 },
            sorties: { type: Number, default: 0 }
        },
        declare: {
            total:  { type: Number, default: 0 },
            cash:   { type: Number, default: 0 },
            mobile: { type: Number, default: 0 }
        },
        ecart: { type: Number, default: 0 }
    },
    notes: { type: String, default: '' },

    // Audit RAF
    audite:      { type: Boolean, default: false },
    statutAudit: {
        type: String,
        enum: ['Valide', 'Ecart', 'Attente', 'Validé'],
        default: 'Attente'
    },
    dateAudit:   { type: Date },
    auditeurNom: { type: String },
    notesAudit:  { type: String, default: '' }

}, { timestamps: true });

clotureSchema.index({ audite: 1 });
clotureSchema.index({ audite: 1, pointDeVente: 1 });
clotureSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Cloture', clotureSchema);