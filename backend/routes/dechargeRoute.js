const express = require('express');
const router = express.Router();
const { 
    createDecharge, 
    getDecharges, 
    deleteDecharge 
} = require('../controllers/dechargeController');
const { protect } = require('../middleware/authMiddleware');

// Sécurité : Vérifier si les fonctions sont bien chargées
if (!createDecharge || !getDecharges || !deleteDecharge) {
    console.log("❌ ERREUR : Une fonction du contrôleur Decharge est undefined !");
    console.log("createDecharge:", !!createDecharge);
    console.log("getDecharges:", !!getDecharges);
    console.log("deleteDecharge:", !!deleteDecharge);
}

// Routes
router.post('/', protect, createDecharge);
router.get('/', protect, getDecharges);
router.delete('/:id', protect, deleteDecharge);

module.exports = router;