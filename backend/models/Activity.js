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
  // --- CHAMP CRUCIAL POUR LA RÉINITIALISATION ---
  archived: {
    type: Boolean,
    default: false // Par défaut, une nouvelle activité est "active"
  },
  pointDeVente: {
    type: String,
    default: 'Réception'
  }
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);