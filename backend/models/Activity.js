const mongoose = require('mongoose'); // <--- IL MANQUAIT CETTE LIGNE !

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
  }
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);