const express = require('express');
const router = express.Router();
const {
    createDecharge,
    getDecharges,
    getAllDecharges,
    deleteDecharge,
    getDechargesByDate,
    getStatsJournee,
    archiveDecharge,
} = require('../controllers/dechargeController');
const { protect } = require('../middleware/authMiddleware');

// Vérification au démarrage
const fns = { createDecharge, getDecharges, getAllDecharges, deleteDecharge, getDechargesByDate, getStatsJournee, archiveDecharge };
Object.entries(fns).forEach(([name, fn]) => {
    if (!fn) console.error(`❌ ERREUR dechargeController : fonction manquante → ${name}`);
});

// ─── ROUTES ────────────────────────────────────────────────────────────────────

// GET  /api/decharges           → journée en cours (archived: false)
// GET  /api/decharges?all=true  → tout l'historique
router.get('/', protect, getDecharges);

// GET  /api/decharges/all       → alias historique complet
router.get('/all', protect, getAllDecharges);

// GET  /api/decharges/stats     → KPIs journée (total + répartition par type)
router.get('/stats', protect, getStatsJournee);

// GET  /api/decharges/by-date?start=...&end=...
router.get('/by-date', protect, getDechargesByDate);

// POST /api/decharges           → créer une décharge
router.post('/', protect, createDecharge);

// PATCH /api/decharges/:id/archive  → archiver une décharge individuelle
// ⚠️ DOIT être avant /:id pour qu'Express ne confonde pas "archive" avec un id
router.patch('/:id/archive', protect, archiveDecharge);

// DELETE /api/decharges/:id     → supprimer
router.delete('/:id', protect, deleteDecharge);

module.exports = router;