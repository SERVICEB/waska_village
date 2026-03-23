const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const Sale     = require('../models/Sale');
const Product  = require('../models/Product');
const Stock    = require('../models/Stock');
const { protect } = require('../middleware/authMiddleware');

// ─── RÈGLE MÉTIER ─────────────────────────────────────────────────────────────
// À chaque vente validée → pour chaque item du panier :
//   1. Charger le Product et ses ingredients (liens vers Stock)
//   2. Pour chaque ingrédient : déduire (qty vendue × quantiteConsommee) du stock
//   3. Enregistrer le mouvement dans l'historique embarqué du Stock
// Si un stock est insuffisant → on laisse passer (quantite peut être négative)
//   mais on retourne un avertissement dans la réponse pour la caisse

// ─── HELPER : déduction stock ────────────────────────────────────────────────
// Gère deux cas :
//   source='stock'   → l'item EST un article de stock → déduire directement
//   source='product' → l'item est un plat avec ingrédients → déduire les ingrédients
const deduireStock = async (item, caissier = 'Caisse') => {
    const warnings = [];
    const now = new Date().toLocaleString('fr-FR');

    try {
        // ── CAS 1 : Article de stock vendu directement ────────────────────
        if (item.source === 'stock') {
            const stockDoc = await Stock.findById(item.product);
            if (!stockDoc) return warnings;

            const qtyADeduire = item.qty;
            if (stockDoc.quantite < qtyADeduire) {
                warnings.push({
                    article:    stockDoc.nom,
                    disponible: stockDoc.quantite,
                    necessaire: qtyADeduire
                });
            }

            await Stock.findByIdAndUpdate(stockDoc._id, {
                $set: { quantite: Math.max(0, stockDoc.quantite - qtyADeduire) },
                $push: {
                    mouvements: {
                        $each: [{ type: 'SORTIE', qty: qtyADeduire, date: now, person: caissier, reason: `Vente caisse : ${item.name} × ${item.qty}` }],
                        $slice: -200
                    }
                }
            });
            return warnings;
        }

        // ── CAS 2 : Plat/Produit avec ingrédients liés au stock ───────────
        const product = await Product.findById(item.product).populate('ingredients.stockItem');
        if (!product?.ingredients?.length) return warnings;

        for (const ing of product.ingredients) {
            if (!ing.stockItem?._id) continue;

            const qtyADeduire = ing.quantiteConsommee * item.qty;
            const stockAvant  = ing.stockItem.quantite;

            if (stockAvant < qtyADeduire) {
                warnings.push({
                    article:    ing.stockItem.nom,
                    disponible: stockAvant,
                    necessaire: qtyADeduire
                });
            }

            await Stock.findByIdAndUpdate(ing.stockItem._id, {
                $set: { quantite: Math.max(0, stockAvant - qtyADeduire) },
                $push: {
                    mouvements: {
                        $each: [{ type: 'SORTIE', qty: qtyADeduire, date: now, person: caissier, reason: `Vente : ${product.name} × ${item.qty}` }],
                        $slice: -200
                    }
                }
            });
        }
    } catch (err) {
        console.error('[STOCK] Erreur déduction:', err.message);
    }
    return warnings;
};

// ─── GET /api/products ────────────────────────────────────────────────────────
// Produits actifs pour la caisse, filtrables par ?type=bar|resto|boutique
router.get('/products', protect, async (req, res) => {
    try {
        const { type } = req.query;
        const query = { actif: true };
        if (type) query.type = type;
        const products = await Product.find(query)
            .populate('ingredients.stockItem', 'nom quantite seuilAlerte unite')
            .sort({ category: 1, name: 1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'Erreur produits', error: err.message });
    }
});

// ─── GET /api/sales/today ─────────────────────────────────────────────────────
// Journal du jour — par défaut n'inclut PAS les ventes clôturées
// ?all=true → inclut toutes (pour les archives RAF)
router.get('/sales/today', protect, async (req, res) => {
    try {
        const { type, all } = req.query;
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const end   = new Date(); end.setHours(23, 59, 59, 999);

        const filter = { createdAt: { $gte: start, $lte: end } };
        if (type) filter.type = type;

        // Par défaut : exclure les ventes déjà clôturées (clotureId != null)
        // Cela évite qu'elles réapparaissent après reconnexion
        if (all !== 'true') {
            filter.clotureId = null;
            filter.status    = 'VALIDÉ';
        }

        const sales = await Sale.find(filter).sort({ createdAt: -1 });
        res.json(sales);
    } catch (err) {
        res.status(500).json({ message: 'Erreur journal', error: err.message });
    }
});

// ─── POST /api/sales ──────────────────────────────────────────────────────────
// Enregistrer une vente ET déduire automatiquement le stock
router.post('/sales', protect, async (req, res) => {
    try {
        // 1. Créer la vente
        const newSale   = new Sale(req.body);
        const savedSale = await newSale.save();

        // 2. Déduire le stock pour chaque item vendu (en parallèle)
        const caissier = req.user?.nom || req.user?.username || 'Caisse';
        const allWarnings = [];

        await Promise.all(
            (req.body.items || []).map(async (item) => {
                if (!item.product) return;
                const warns = await deduireStock(item, caissier);
                allWarnings.push(...warns);
            })
        );

        // 3. Répondre avec la vente + éventuels avertissements stock
        res.status(201).json({
            ...savedSale.toObject(),
            // Si des stocks étaient insuffisants, la caisse peut afficher un warning
            stockWarnings: allWarnings.length > 0 ? allWarnings : undefined
        });

    } catch (err) {
        console.error('[SALES] POST:', err.message);
        res.status(400).json({ message: 'Erreur vente', error: err.message });
    }
});

// ─── PATCH /api/sales/:id ─────────────────────────────────────────────────────
// Annuler / rembourser une vente (et remettre le stock si REMBOURSÉ)
router.patch('/sales/:id', protect, async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id);
        if (!sale) return res.status(404).json({ message: 'Vente introuvable' });

        const newStatus = req.body.status;

        const updatedSale = await Sale.findByIdAndUpdate(
            req.params.id,
            {
                status:  newStatus,
                motif:   req.body.motif,
                ...(newStatus === 'REMBOURSÉ' ? { total: 0 } : {})
            },
            { new: true }
        );

        // Si remboursé → recréditer le stock (annulation de la déduction)
        if (newStatus === 'REMBOURSÉ') {
            const caissier = req.user?.nom || req.user?.username || 'Caisse';
            await Promise.all(
                (sale.items || []).map(async (item) => {
                    if (!item.product) return;
                    const product = await Product.findById(item.product)
                        .populate('ingredients.stockItem', 'nom quantite');
                    if (!product?.ingredients?.length) return;

                    const now = new Date().toLocaleString('fr-FR');
                    for (const ing of product.ingredients) {
                        if (!ing.stockItem?._id) continue;
                        const qtyARecréditer = ing.quantiteConsommee * item.qty;
                        await Stock.findByIdAndUpdate(
                            ing.stockItem._id,
                            {
                                $inc: { quantite: qtyARecréditer },
                                $push: {
                                    mouvements: {
                                        $each: [{
                                            type:   'ENTRÉE',
                                            qty:    qtyARecréditer,
                                            date:   now,
                                            person: caissier,
                                            reason: `Remboursement : ${product.name} × ${item.qty}`
                                        }],
                                        $slice: -200
                                    }
                                }
                            }
                        );
                    }
                })
            );
        }

        res.json(updatedSale);
    } catch (err) {
        console.error('[SALES] PATCH:', err.message);
        res.status(400).json({ message: 'Erreur mise à jour', error: err.message });
    }
});

// ─── GET /api/products/:id/stock ─────────────────────────────────────────────
// Vérifier la disponibilité stock d'un produit (optionnel — pour la caisse)
router.get('/products/:id/stock', protect, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('ingredients.stockItem', 'nom quantite seuilAlerte unite');
        if (!product) return res.status(404).json({ message: 'Produit introuvable' });

        const dispo = product.ingredients.map(ing => ({
            article:        ing.stockItem?.nom || '?',
            stockDisponible: ing.stockItem?.quantite ?? 0,
            seuilAlerte:    ing.stockItem?.seuilAlerte ?? 0,
            unite:          ing.stockItem?.unite || 'pcs',
            consommation:   ing.quantiteConsommee,
            // Nombre de portions possibles avec le stock actuel
            portionsPossibles: ing.quantiteConsommee > 0
                ? Math.floor((ing.stockItem?.quantite || 0) / ing.quantiteConsommee)
                : null
        }));

        res.json({
            produit:     product.name,
            disponible:  dispo.every(d => d.stockDisponible >= d.consommation),
            ingredients: dispo
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;