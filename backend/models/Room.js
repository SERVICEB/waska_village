const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  number: { 
    type: String, // String est préférable pour des numéros comme "101A"
    required: true, 
    unique: true 
  },
  type: { 
    type: String, 
    enum: ['Standard', 'VIP'], 
    default: 'Standard' 
  },
  price: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Libre', 'Occupée', 'Sale'], 
    default: 'Libre' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);