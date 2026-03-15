require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connexion à la base de données
connectDB();

const app = express();

// --- MIDDLEWARES ---
app.use(cors()); // Accepte les requêtes du Frontend
app.use(express.json()); // Indispensable pour lire req.body (doit être AVANT les routes)

// --- IMPORT DES ROUTES ---
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const clientRoutes = require('./routes/clientRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const clotureRoutes = require('./routes/clotureRoutes');
const activityRoutes = require('./routes/activityRoutes');
const depenseRoutes = require('./routes/depenseRoutes');
const statsRoutes = require('./routes/statsRoutes');
const saleRoutes = require('./routes/saleRoutes');

// --- UTILISATION DES ROUTES ---

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/clotures', clotureRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/depenses', depenseRoutes);
app.use('/api/stats', statsRoutes);

// ATTENTION : Si tes routes dans saleRoutes sont déjà préfixées par /sales, 
// utilise /api comme base, sinon utilise /api/sales.
app.use('/api/sales', saleRoutes); 

// --- GESTION DES ERREURS ---
app.get('/', (req, res) => res.send('API Waska Village en ligne...'));

app.use((req, res) => {
  res.status(404).json({ message: `La route ${req.originalUrl} n'existe pas.` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));