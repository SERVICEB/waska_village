const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

// Vérification au démarrage
const required = ['getGlobalStats', 'generateDailyReport', 'forceResetData', 'getArchivedReports', 'downloadArchivedReport', 'deleteArchivedReport'];
required.forEach(fn => {
    if (!reportController[fn]) {
        console.error(`❌ ERREUR reportController : fonction manquante → ${fn}`);
    }
});

/**
 * @route   GET /api/reports/stats-globales
 * @desc    Stats KPI pour le Dashboard RAF (CA, dépenses, bénéfice, top produits)
 * @access  Privé
 */
router.get('/stats-globales', protect, reportController.getGlobalStats);

/**
 * @route   GET /api/reports/daily-audit
 * @desc    Génère et télécharge le rapport PDF du jour, puis archive toutes les données
 * @access  Privé
 */
router.get('/daily-audit', protect, reportController.generateDailyReport);

/**
 * @route   POST /api/reports/force-reset
 * @desc    Clôture manuelle de journée : archive clôtures + activités + décharges
 * @body    { fullReset: boolean, note?: string }
 * @access  Privé
 */
router.post('/force-reset', protect, reportController.forceResetData);

/**
 * @route   GET /api/reports/archives
 * @desc    Liste des rapports PDF archivés avec métadonnées (date, taille, nom)
 * @access  Privé
 */
router.get('/archives', protect, reportController.getArchivedReports);

/**
 * @route   GET /api/reports/archives/:filename
 * @desc    Télécharger un rapport PDF archivé spécifique
 * @access  Privé
 */
router.get('/archives/:filename', protect, reportController.downloadArchivedReport);

/**
 * @route   DELETE /api/reports/archives/:filename
 * @desc    Supprimer un rapport PDF archivé (RAF uniquement)
 * @access  Privé (RAF)
 */
router.delete('/archives/:filename', protect, reportController.deleteArchivedReport);

// ─── Routes legacy /history conservées pour rétrocompatibilité ───────────────
// Redirigent vers les nouvelles routes /archives
router.get('/history', protect, reportController.getArchivedReports);
router.get('/history/:filename', protect, reportController.downloadArchivedReport);

module.exports = router;