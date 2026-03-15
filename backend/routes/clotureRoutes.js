const express = require('express');
const router = express.Router();
const { 
    getClotures, 
    createCloture, 
    auditCloture 
} = require('../controllers/clotureController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Route racine : /api/clotures
router.route('/')
    // GET : Seuls les admins, gérants et RAF voient l'historique
    .get(protect, authorize('admin', 'gerant', 'raf'), getClotures)
    
    // POST : Tout utilisateur connecté (caissier, admin, etc.) peut clôturer
    // Si tu as toujours une 401, vérifie que le token est bien passé dans Axios
    .post(protect, createCloture); 

// Route Audit : /api/clotures/:id/audit
router.route('/:id/audit')
    .patch(protect, authorize('admin', 'gerant', 'raf'), auditCloture);

module.exports = router;