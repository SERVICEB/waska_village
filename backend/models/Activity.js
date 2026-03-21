const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
  },
  details: {
    type: String
  },
  montant: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    enum: ['entree', 'sortie', 'info'],
    default: 'info'
  },
  archived: {
    type: Boolean,
    default: false
  },
  pointDeVente: {
    type: String,
    default: 'Réception'
  },
  clotureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cloture',
    default: null
  }
}, { timestamps: true });

activitySchema.index({ archived: 1 });
activitySchema.index({ archived: 1, pointDeVente: 1 });
activitySchema.index({ archived: 1, type: 1 });

module.exports = mongoose.model('Activity', activitySchema);