const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');

// ─── SOLUTION CIRCULAIRE ──────────────────────────────────────────────────────
// On utilise mongoose.model('Activity') au lieu de require('../models/Activity')
// mongoose.model() lit depuis le registre interne de Mongoose — zéro circulaire possible
// Condition : models/Activity.js doit être chargé UNE FOIS au démarrage du serveur
// (il l'est déjà via les controllers qui l'importent directement)

const getActivity = () => mongoose.model('Activity');

// ─── GET /api/activities/recent ───────────────────────────────────────────────
router.get('/recent', protect, async (req, res) => {
    try {
        const activities = await getActivity().find({
            $or: [{ archived: false }, { archived: { $exists: false } }]
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

        res.status(200).json(activities || []);
    } catch (error) {
        console.error('[ACTIVITIES] /recent:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── GET /api/activities ──────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
    try {
        const filter = req.query.all === 'true'
            ? {}
            : { $or: [
                { archived: false },
                { archived: { $exists: false } },
                { archived: null }
              ]};

        if (req.query.pointDeVente) {
            filter.pointDeVente = req.query.pointDeVente;
        }

        const activities = await getActivity().find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(req.query.limit) || 200)
            .lean();

        res.status(200).json(activities || []);
    } catch (error) {
        console.error('[ACTIVITIES] GET /:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── POST /api/activities ─────────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
    try {
        const activity = await getActivity().create({
            ...req.body,
            archived: false
        });
        res.status(201).json(activity);
    } catch (error) {
        console.error('[ACTIVITIES] POST:', error.message);
        res.status(400).json({ success: false, message: error.message });
    }
});

module.exports = router;