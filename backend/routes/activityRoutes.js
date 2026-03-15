const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const { protect } = require('../middleware/authMiddleware');

// @desc    Récupérer tout le journal d'activité
// @route   GET /api/activities
router.get('/', protect, async (req, res) => {
    try {
        // On récupère les 50 dernières activités, de la plus récente à la plus ancienne
        const activities = await Activity.find()
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;