const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const clotureController = require('../controllers/clotureController');

// ─── POST /api/clotures ───────────────────────────────────────────────────────
// Crée la clôture ET archive les activités du PDV → caisse revient à 0
router.post('/', protect, clotureController.createCloture);

// ─── GET /api/clotures ────────────────────────────────────────────────────────
// ?audite=false → non auditées seulement | ?pdv=Réception → filtrer par PDV
router.get('/', protect, clotureController.getClotures);

// ─── PATCH /api/clotures/:id/audit ───────────────────────────────────────────
// Validation individuelle RAF
router.patch('/:id/audit', protect, clotureController.auditCloture);

// ─── PATCH /api/clotures/audit-all ───────────────────────────────────────────
// Audit global toutes caisses (clôture générale RAF)
router.patch('/audit-all', protect, clotureController.auditAllClotures);

module.exports = router;