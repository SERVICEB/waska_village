const express = require('express');
const router = express.Router();
const Cloture = require('../models/Cloture');
const Sale = require('../models/Sale');
const { protect } = require('../middleware/authMiddleware'); 

// --- POST : Créer une clôture ---
router.post('/', protect, async (req, res) => {
    try {
        const { pointDeVente, totalVentes, stats, ventesIds } = req.body;

        const nouvelleCloture = new Cloture({
            pointDeVente,
            totalVentes,
            stats,
            caissier: req.user ? (req.user.nom || req.user.username) : "Anonyme",
            caissierId: req.user ? req.user._id : null
        });

        const savedCloture = await nouvelleCloture.save();

        if (ventesIds && ventesIds.length > 0) {
            await Sale.updateMany(
                { _id: { $in: ventesIds } },
                { $set: { clotureId: savedCloture._id, isClotured: true } }
            );
        }

        res.status(201).json(savedCloture);
    } catch (err) {
        console.error("Erreur POST Cloture:", err);
        res.status(400).json({ message: err.message });
    }
});

// --- GET : Récupérer les dernières clôtures pour la RAF ---
router.get('/', protect, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20; // Augmenté à 20 par défaut pour plus de visibilité
        const clotures = await Cloture.find()
            .sort({ createdAt: -1 })
            .limit(limit);
        res.json(clotures);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- PATCH : AUDIT (Validation par la RAF) ---
// C'est cette route qui manquait et causait l'erreur 404
router.patch('/:id/audit', protect, async (req, res) => {
    try {
        const { statutAudit, notesAudit } = req.body;
        
        const clotureAujournee = await Cloture.findByIdAndUpdate(
            req.params.id,
            { 
                statutAudit, 
                notesAudit,
                dateAudit: Date.now(),
                auditeurId: req.user._id,
                auditeurNom: req.user.nom || req.user.username
            },
            { new: true } // Retourne le document modifié
        );

        if (!clotureAujournee) {
            return res.status(404).json({ message: "Clôture introuvable" });
        }

        res.json(clotureAujournee);
    } catch (err) {
        console.error("Erreur PATCH Audit:", err);
        res.status(400).json({ message: err.message });
    }
});

// --- GET : Détail des ventes d'une clôture (Optionnel mais recommandé) ---
router.get('/:id/ventes', protect, async (req, res) => {
    try {
        const ventes = await Sale.find({ clotureId: req.params.id });
        res.json(ventes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;