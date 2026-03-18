const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');
const { protect } = require('../middleware/authMiddleware');

// @desc    Récupérer les produits pour la Caisse (Filtrables par type)
// @route   GET /api/stocks  OU  GET /api/products
router.get('/', protect, async (req, res) => {
    try {
        const { type } = req.query; // Récupère le ?type=resto
        let query = {};

        if (type) {
            // Filtre par catégorie (ex: resto, bar, boisson)
            // L'option 'i' rend la recherche insensible à la casse
            query.categorie = { $regex: new RegExp(type, 'i') };
        }

        const produits = await Stock.find(query).sort({ nom: 1 });
        res.json(produits);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des produits" });
    }
});

// @desc    Obtenir les produits en seuil critique (Dashboard)
// @route   GET /api/stocks/alerts
router.get('/alerts', protect, async (req, res) => {
    try {
        const alertes = await Stock.find({
            $expr: { $lte: ["$quantite", "$seuilAlerte"] }
        }).sort({ quantite: 1 });

        res.json(alertes);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des alertes stock" });
    }
});

module.exports = router;