const Decharge = require('../models/Decharge');

// --- 1. CRÉER ---
exports.createDecharge = async (req, res) => {
    try {
        const { type, montant, date, beneficiaire, justificatif, fileName } = req.body;
        const nouvelleDecharge = new Decharge({
            type,
            montant: Number(montant),
            date: date || new Date(),
            beneficiaire,
            justificatif,
            fileName,
            auteur: req.user.id 
        });
        await nouvelleDecharge.save();
        res.status(201).json(nouvelleDecharge);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// --- 2. RÉCUPÉRER (C'est ici que ça bloquait) ---
exports.getDecharges = async (req, res) => {
    try {
        const decharges = await Decharge.find().sort({ date: -1 });
        res.status(200).json(decharges);
    } catch (err) {
        res.status(500).json({ message: "Erreur de récupération" });
    }
};

// --- 3. SUPPRIMER (C'est ici aussi que ça bloquait) ---
exports.deleteDecharge = async (req, res) => {
    try {
        await Decharge.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Décharge supprimée" });
    } catch (err) {
        res.status(500).json({ message: "Erreur de suppression" });
    }
};

// @desc    Récupérer les dépenses par période (Week-end)
exports.getDechargesByDate = async (req, res) => {
    try {
        const { start, end } = req.query; // Dates envoyées depuis le front
        const decharges = await Decharge.find({
            date: {
                $gte: new Date(start),
                $lte: new Date(end)
            }
        }).sort({ date: 1 });
        
        res.status(200).json(decharges);
    } catch (err) {
        res.status(500).json({ message: "Erreur de filtrage" });
    }
};