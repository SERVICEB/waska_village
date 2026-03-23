const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  client:        { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  room:          { type: mongoose.Schema.Types.ObjectId, ref: 'Room',   required: true },
  nights:        { type: Number, required: true },
  deposit:       { type: Number, default: 0 },
  roomPriceTotal:{ type: Number },
  discount:      { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['Réservé', 'Occupé', 'Terminé', 'Annulé'], 
    default: 'Réservé' 
  },
  dateArrivee:   { type: Date, required: true },
  // Champ obligatoire pour le filtrage caisse et l'archivage
  pointDeVente:  { type: String, default: 'Réception' }
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);