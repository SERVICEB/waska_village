const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const { protect } = require('../middleware/authMiddleware');

// --- 1. ROUTES FIXES (Toujours en premier pour éviter les conflits) ---

// @desc    Récupérer les 10 dernières activités pour le Dashboard
// @route   GET /api/activities/recent
router.get('/recent', protect, async (req, res) => {
    try {
        // Utilisation de $ne (not equal) pour inclure les docs sans le champ archived
        const activities = await Activity.find({ 
            archived: { $ne: true } 
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(); // .lean() améliore les performances et évite les erreurs de structure Mongoose

        res.status(200).json(activities || []);
    } catch (error) {
        console.error("ERREUR CRITIQUE /activities/recent :", error.message);
        res.status(500).json({ 
            success: false, 
            message: "Erreur lors du chargement des activités récentes",
            error: error.message 
        });
    }
});

// --- 2. ROUTES GÉNÉRIQUES ---

// @desc    Récupérer le journal d'activité complet
// @route   GET /api/activities
router.get('/', protect, async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 50;

        const activities = await Activity.find({ 
            archived: { $ne: true } 
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

        res.status(200).json(activities || []);
    } catch (error) {
        console.error("ERREUR /activities :", error.message);
        res.status(500).json({ 
            success: false, 
            message: "Erreur serveur lors de la récupération du journal" 
        });
    }
});

module.exports = router;