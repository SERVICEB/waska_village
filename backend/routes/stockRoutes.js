const express = require('express');
const router  = express.Router();
const Stock   = require('../models/Stock');
const { protect } = require('../middleware/authMiddleware');

// ─── IMPORTANT : routes fixes AVANT /:id ─────────────────────────────────────

// @route   GET /api/stocks/alerts
// @desc    Produits en seuil critique (Dashboard RAF)
router.get('/alerts', protect, async (req, res) => {
    try {
        const alertes = await Stock.find({
            $expr: { $lte: ['$quantite', '$seuilAlerte'] }
        }).sort({ quantite: 1 });
        res.json(alertes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   GET /api/stocks/movements
// @desc    Historique des mouvements (stocké dans chaque produit)
router.get('/movements', protect, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        // On récupère les mouvements embarqués dans chaque document Stock
        const stocks = await Stock.find({}, { mouvements: 1, nom: 1 }).lean();
        const all = [];
        stocks.forEach(s => {
            (s.mouvements || []).forEach(m => {
                all.push({ ...m, art: s.nom });
            });
        });
        // Trier par date décroissante
        all.sort((a, b) => new Date(b.date) - new Date(a.date));
        res.json(all.slice(0, limit));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   PATCH /api/stocks/bulk-update
// @desc    Mise à jour en masse (inventaire physique)
// @body    { updates: [{ id, quantite }] }
router.patch('/bulk-update', protect, async (req, res) => {
    try {
        const { updates } = req.body;
        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({ message: 'Aucune mise à jour fournie.' });
        }

        const results = await Promise.all(
            updates.map(({ id, quantite }) =>
                Stock.findByIdAndUpdate(
                    id,
                    {
                        $set: { quantite: Number(quantite) },
                        $push: {
                            mouvements: {
                                $each: [{
                                    type:    'INVENTAIRE',
                                    qty:     Number(quantite),
                                    date:    new Date().toLocaleString('fr-FR'),
                                    person:  'Gestionnaire',
                                    reason:  'Inventaire physique'
                                }],
                                $slice: -200 // garde les 200 derniers mouvements max
                            }
                        }
                    },
                    { new: true }
                )
            )
        );

        res.json({ success: true, updated: results.length });
    } catch (err) {
        console.error('[STOCK] bulk-update:', err.message);
        res.status(500).json({ message: err.message });
    }
});

// ─── ROUTES GÉNÉRIQUES ────────────────────────────────────────────────────────

// @route   GET /api/stocks
// @desc    Liste des articles de stock
//          ?vendable=true → articles avec prixVente > 0 OU dans une caisse assignée
//          ?caisse=bar|resto → filtre par caisse (OU sans caisse assignée si prixVente > 0)
//          ?type=bar|boisson → filtre par catégorie
router.get('/', protect, async (req, res) => {
    try {
        const { type, vendable, caisse } = req.query;
        const query = {};

        if (type) query.categorie = { $regex: new RegExp(type, 'i') };

        if (vendable === 'true' && caisse) {
            // Vendable en caisse = prixVente > 0 ET (caisse dans le tableau caisses OU caisses vide/absent)
            query.$and = [
                { prixVente: { $gt: 0 } },
                {
                    $or: [
                        { caisses: caisse },           // caisse explicitement assignée
                        { caisses: { $size: 0 } },      // tableau vide = toutes les caisses
                        { caisses: { $exists: false } } // ancien article sans le champ
                    ]
                }
            ];
        } else if (vendable === 'true') {
            query.prixVente = { $gt: 0 };
        } else if (caisse) {
            query.caisses = caisse;
        }

        const produits = await Stock.find(query).sort({ nom: 1 });
        res.json(produits);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/stocks
// @desc    Créer un nouveau produit/article
router.post('/', protect, async (req, res) => {
    try {
        const { nom, categorie, quantite, unite, seuilAlerte, prixAchat, prixVente, caisses } = req.body;
        const stock = await Stock.create({ nom, categorie, quantite, unite, seuilAlerte, prixAchat, prixVente: prixVente || 0, caisses: caisses || [] });
        res.status(201).json(stock);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   PATCH /api/stocks/:id/movement
// @desc    Enregistrer une entrée ou sortie de stock
// @body    { type: 'ENTRÉE'|'SORTIE', qty, person, note }
router.patch('/:id/movement', protect, async (req, res) => {
    try {
        const { type: mType, qty, person, note } = req.body;
        const quantite = parseInt(qty) || 0;

        if (!['ENTRÉE', 'SORTIE'].includes(mType)) {
            return res.status(400).json({ message: 'Type invalide. Utiliser ENTRÉE ou SORTIE.' });
        }

        const stock = await Stock.findById(req.params.id);
        if (!stock) return res.status(404).json({ message: 'Article non trouvé.' });

        // Calcul nouvelle quantité
        const delta       = mType === 'ENTRÉE' ? quantite : -quantite;
        const newQuantite = Math.max(0, stock.quantite + delta);

        const updated = await Stock.findByIdAndUpdate(
            req.params.id,
            {
                $set: { quantite: newQuantite },
                $push: {
                    mouvements: {
                        $each: [{
                            type:   mType,
                            qty:    quantite,
                            date:   new Date().toLocaleString('fr-FR'),
                            person: person || 'Anonyme',
                            reason: note   || 'Mouvement manuel'
                        }],
                        $slice: -200
                    }
                }
            },
            { new: true }
        );

        res.json({ success: true, data: updated });
    } catch (err) {
        console.error('[STOCK] movement:', err.message);
        res.status(500).json({ message: err.message });
    }
});

// @route   PUT /api/stocks/:id
// @desc    Modifier un article (nom, prix, seuil…)
router.put('/:id', protect, async (req, res) => {
    try {
        const updated = await Stock.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ message: 'Article non trouvé.' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   DELETE /api/stocks/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        await Stock.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;