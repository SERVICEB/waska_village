const mongoose = require('mongoose');

const dechargeSchema = new mongoose.Schema({
    type:          { type: String, required: true },
    montant:       { type: Number, required: true },
    date:          { type: Date, default: Date.now },
    beneficiaire:  { type: String, required: true },
    justificatif:  { type: String },
    fileName:      { type: String },
    auteur:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // ── Archivage journalier ──────────────────────────────────────────────────
    archived:      { type: Boolean, default: false },
    dateArchive:   { type: Date, default: null },

}, { timestamps: true });

// Index pour accélérer les requêtes de clôture
dechargeSchema.index({ archived: 1 });
dechargeSchema.index({ archived: 1, createdAt: -1 });

module.exports = mongoose.model('Decharge', dechargeSchema);