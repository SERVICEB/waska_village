const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');

// Route de connexion
router.post('/login', login);

module.exports = router;