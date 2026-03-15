const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const { protect } = require('../middleware/authMiddleware');

// Récupérer tous les clients
router.get('/', protect, async (req, res) => {
    try {
        const clients = await Client.find().sort({ name: 1 });
        res.json(clients);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Créer un nouveau client
router.post('/', protect, async (req, res) => {
    try {
        const newClient = await Client.create(req.body);
        res.status(201).json(newClient);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;