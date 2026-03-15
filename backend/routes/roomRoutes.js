const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { protect, authorize } = require('../middleware/authMiddleware');

// GET /api/rooms - Récupérer toutes les chambres
router.get('/', protect, async (req, res) => {
    try {
        const rooms = await Room.find(); 
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Marquer une chambre comme propre (Libre)
router.patch('/:id/clean', protect, async (req, res) => {
    try {
        const room = await Room.findByIdAndUpdate(
            req.params.id, 
            { status: 'Libre' }, 
            { new: true }
        );
        res.json(room);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;