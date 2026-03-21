/*require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// 1. Connexion à la base de données
connectDB();

const app = express();

// --- 2. MIDDLEWARES ---
app.use(cors()); 
app.use(express.json()); 

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// --- 3. IMPORT DES ROUTES ---
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const clientRoutes = require('./routes/clientRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const clotureRoutes = require('./routes/clotureRoutes');
const activityRoutes = require('./routes/activityRoutes');
const depenseRoutes = require('./routes/depenseRoutes');
const statsRoutes = require('./routes/statsRoutes');
const saleRoutes = require('./routes/saleRoutes');
const stockRoutes = require('./routes/stockRoutes'); 
const dechargeRoutes = require('./routes/dechargeRoute');
const reportRoutes = require('./routes/reportRoutes');

// --- 4. UTILISATION DES ROUTES ---

app.use(express.json({ limit: '5mb' })); // Augmente la limite de taille pour les payloads JSON (utile pour les justificatifs encodés en base64)
app.use(express.urlencoded({ limit: '5mb', extended: true })); // Augmente la limite pour les données encodées en URL (formulaires)
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/clotures', clotureRoutes);
app.use('/api/depenses', depenseRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api', saleRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/decharges', dechargeRoutes);
app.use('/api/reports', reportRoutes);

// On fait pointer les deux URLs vers le même fichier de routes
// Cela permet de gérer le stock (Alertes) et les produits (Caisse) au même endroit
app.use('/api/stocks', stockRoutes);
app.use('/api/products', stockRoutes); 

// --- 5. GESTION DES ERREURS ---

app.get('/', (req, res) => res.send('🚀 API Waska Village v2 - Système Opérationnel'));

app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: `La route ${req.originalUrl} n'existe pas.` 
  });
});

app.use((err, req, res, next) => {
  console.error("ERREUR SERVEUR:", err.stack);
  res.status(500).json({ 
    success: false, 
    message: "Une erreur interne est survenue." 
  });
});

// --- 6. DÉMARRAGE ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`-------------------------------------------`);
    console.log(`✅ Serveur Waska Village : Port ${PORT}`);
    console.log(`-------------------------------------------`);
}); */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// 1. Connexion à la base de données
connectDB();

// ── ENREGISTREMENT DES MODÈLES MONGOOSE ───────────────────────────────────────
// Doit être fait AVANT les routes pour que mongoose.model('X') fonctionne partout
// et éviter les erreurs "Schema hasn't been registered for model X"
require('./models/Activity');
require('./models/Cloture');
require('./models/Decharge');
require('./models/Reservation');
require('./models/Room');
// ─────────────────────────────────────────────────────────────────────────────

const app = express();

// --- 2. MIDDLEWARES ---
app.use(cors()); 
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// --- 3. IMPORT DES ROUTES ---
const authRoutes        = require('./routes/authRoutes');
const roomRoutes        = require('./routes/roomRoutes');
const clientRoutes      = require('./routes/clientRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const clotureRoutes     = require('./routes/clotureRoutes');
const activityRoutes    = require('./routes/activityRoutes');
const depenseRoutes     = require('./routes/depenseRoutes');
const statsRoutes       = require('./routes/statsRoutes');
const saleRoutes        = require('./routes/saleRoutes');
const stockRoutes       = require('./routes/stockRoutes');
const dechargeRoutes    = require('./routes/dechargeRoute');
const reportRoutes      = require('./routes/reportRoutes');

// --- 4. UTILISATION DES ROUTES ---
app.use('/api/auth',         authRoutes);
app.use('/api/rooms',        roomRoutes);
app.use('/api/clients',      clientRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/clotures',     clotureRoutes);
app.use('/api/depenses',     depenseRoutes);
app.use('/api/stats',        statsRoutes);
app.use('/api',              saleRoutes);
app.use('/api/activities',   activityRoutes);
app.use('/api/decharges',    dechargeRoutes);
app.use('/api/reports',      reportRoutes);
app.use('/api/stocks',       stockRoutes);
app.use('/api/products',     stockRoutes);

// --- 5. GESTION DES ERREURS ---
app.get('/', (req, res) => res.send('🚀 API Waska Village v2 - Système Opérationnel'));

app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: `La route ${req.originalUrl} n'existe pas.` 
  });
});

app.use((err, req, res, next) => {
  console.error("ERREUR SERVEUR:", err.stack);
  res.status(500).json({ 
    success: false, 
    message: "Une erreur interne est survenue." 
  });
});

// --- 6. DÉMARRAGE ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`-------------------------------------------`);
    console.log(`✅ Serveur Waska Village : Port ${PORT}`);
    console.log(`-------------------------------------------`);
});