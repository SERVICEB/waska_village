const express = require('express');
const router = express.Router();
// 1. BIEN VÉRIFIER QUE LES DEUX SONT ICI :
const { getDashboardStats, getVentesGlobales } = require('../controllers/statsController');
const { protect } = require('../middleware/authMiddleware');

// 2. Vérifie qu'aucune de ces variables n'est vide
if (!getDashboardStats || !getVentesGlobales) {
    console.error("ERREUR : Une des fonctions du contrôleur est undefined !");
}

router.get('/dashboard', protect, getDashboardStats);

// C'est probablement cette ligne qui plantait si getVentesGlobales était undefined
router.get('/ventes-globales', protect, getVentesGlobales);

module.exports = router;