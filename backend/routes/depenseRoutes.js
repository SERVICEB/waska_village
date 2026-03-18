const express = require('express');
const router = express.Router();
const Depense = require('../models/Depense');
const Activity = require('../models/Activity');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, async (req, res) => {
    try {
        // 1. Extraction des données envoyées par le modal
        const { 
            type, 
            beneficiaire, 
            montant, 
            date, 
            statut, 
            justificatif, 
            fileName 
        } = req.body;

        // 2. Création de la dépense détaillée
        const depense = await Depense.create({
            type,
            beneficiaire,
            montant,
            date: date || new Date(),
            statut: statut || 'En attente',
            justificatif, // La chaîne Base64 de l'image
            fileName,
            motif: `${type} - ${beneficiaire}`, // On combine pour garder une trace textuelle
            creePar: req.user._id // Optionnel : lie la dépense à l'utilisateur connecté
        });

        // 3. Journal d'activité (Log)
        // On rend le log plus précis pour le RAF
        await Activity.create({
            action: "SORTIE DE CAISSE",
            details: `${type.toUpperCase()} : ${beneficiaire}`,
            montant: montant,
            type: 'sortie',
            statut: statut,
            utilisateur: req.user.name // Si ton middleware protect ajoute l'utilisateur
        });

        res.status(201).json({
            success: true,
            data: depense
        });

    } catch (error) {
        console.error("Erreur Depense:", error);
        res.status(400).json({ 
            success: false, 
            message: "Erreur lors de l'enregistrement de la décharge",
            error: error.message 
        });
    }
});

module.exports = router;