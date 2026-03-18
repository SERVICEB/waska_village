const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');

// --- ROUTE 1 : Les produits ---
// URL: http://localhost:5000/api/products?type=resto
router.get('/products', protect, async (req, res) => {
  try {
    const { type } = req.query;
    const query = type ? { type: type } : {};
    const products = await Product.find(query);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Erreur produits", error: err.message });
  }
});

// --- ROUTE 2 : Le Journal du jour (CRITIQUE : DOIT ÊTRE AVANT /sales/:id) ---
// URL: http://localhost:5000/api/sales/today?type=resto
router.get('/sales/today', protect, async (req, res) => {
  try {
    const { type } = req.query;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const filter = {
      createdAt: { $gte: start, $lte: end }
    };
    if (type) filter.type = type;

    const sales = await Sale.find(filter).sort({ createdAt: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: "Erreur journal", error: err.message });
  }
});

// --- ROUTE 3 : Enregistrer une vente ---
// URL: http://localhost:5000/api/sales
router.post('/sales', protect, async (req, res) => {
  try {
    const newSale = new Sale(req.body);
    const savedSale = await newSale.save();
    res.status(201).json(savedSale);
  } catch (err) {
    res.status(400).json({ message: "Erreur vente", error: err.message });
  }
});

// --- ROUTE 4 : Annuler une vente (AVEC :id à la fin) ---
// URL: http://localhost:5000/api/sales/:id
router.patch('/sales/:id', protect, async (req, res) => {
  try {
    const updatedSale = await Sale.findByIdAndUpdate(
      req.params.id, 
      { 
        status: req.body.status, 
        motif: req.body.motif,
        total: req.body.status === 'REMBOURSÉ' ? 0 : undefined 
      },
      { new: true }
    );
    if (!updatedSale) return res.status(404).json({ message: "Vente introuvable" });
    res.json(updatedSale);
  } catch (err) {
    res.status(400).json({ message: "Erreur mise à jour", error: err.message });
  }
});

module.exports = router;