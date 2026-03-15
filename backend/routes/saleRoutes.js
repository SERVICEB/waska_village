const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');

// 1. Récupérer les produits par type (Bar ou Resto)
// URL: http://localhost:5000/api/products?type=bar
router.get('/products', async (req, res) => {
  try {
    const { type } = req.query;
    // Si un type est fourni, on filtre. Sinon, on renvoie tout.
    const query = type ? { type: type } : {};
    const products = await Product.find(query);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des produits", error: err.message });
  }
});

// 2. Enregistrer une nouvelle vente
// URL: http://localhost:5000/api/sales
router.post('/sales', async (req, res) => {
  try {
    const newSale = new Sale(req.body);
    const savedSale = await newSale.save();
    res.status(201).json(savedSale);
  } catch (err) {
    res.status(400).json({ message: "Impossible d'enregistrer la vente", error: err.message });
  }
});

// 3. Récupérer les ventes du jour (Journal)
// URL: http://localhost:5000/api/sales/today?type=bar
router.get('/sales/today', async (req, res) => {
  try {
    const { type } = req.query;
    
    // Définir le début et la fin de la journée actuelle
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    
    // Construction du filtre
    const filter = {
      createdAt: { $gte: start, $lte: end }
    };
    if (type) filter.type = type;

    const sales = await Sale.find(filter).sort({ createdAt: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération du journal", error: err.message });
  }
});

// 4. Annuler/Rembourser une vente
// URL: http://localhost:5000/api/sales/:id
router.patch('/sales/:id', async (req, res) => {
  try {
    const updatedSale = await Sale.findByIdAndUpdate(
      req.params.id, 
      { 
        status: req.body.status, 
        motif: req.body.motif,
        total: req.body.status === 'REMBOURSÉ' ? 0 : undefined // On met le total à 0 si annulé
      },
      { new: true }
    );
    
    if (!updatedSale) return res.status(404).json({ message: "Vente introuvable" });
    
    res.json(updatedSale);
  } catch (err) {
    res.status(400).json({ message: "Erreur lors de la mise à jour", error: err.message });
  }
});

module.exports = router;