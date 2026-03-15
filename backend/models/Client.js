const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  phone: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String 
  },
  idCard: { 
    type: String // Pour le numéro de CNI/Passeport
  }
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);