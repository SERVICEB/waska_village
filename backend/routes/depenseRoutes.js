const express = require('express');
const router = express.Router();
const Depense = require('../models/Depense');
const Activity = require('../models/Activity'); // Pour loguer la dépense dans le journal
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, async (req, res) => {
    try {
        const { motif, montant } = req.body;
        const depense = await Depense.create({ motif, montant });

        // On ajoute AUTOMATIQUEMENT la dépense dans le journal d'activité
        await Activity.create({
            action: "SORTIE DE CAISSE",
            details: motif,
            montant: montant,
            type: 'sortie'
        });

        res.status(201).json(depense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;