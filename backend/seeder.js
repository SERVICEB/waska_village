require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Room = require('./models/Room');
const Product = require('./models/Product'); // Modèle importé (Majuscule)
const connectDB = require('./config/db');

/**
 * seedData : Réinitialise les utilisateurs, les chambres et les produits de Waska Village
 */
const seedData = async () => {
  try {
    // 1. Connexion à la base de données
    await connectDB();
    console.log("🚀 Connexion établie pour le seeding...");

    // 2. Nettoyage complet de la base
    await User.deleteMany();
    await Room.deleteMany();
    await Product.deleteMany(); // On vide aussi les produits
    console.log("🗑️  Anciens utilisateurs, chambres et produits supprimés.");

    // 3. Préparation des comptes Utilisateurs
    const users = [
      { username: 'admin', password: 'adminWaska123', role: 'admin' },
      { username: 'reception', password: 'recepWaska456', role: 'reception' },
      { username: 'raf', password: 'rafWaska789', role: 'raf' },
      { username: 'caisse-resto', password: 'caisseWaska321', role: 'caisse-resto' }, 
    ];

    // 4. Préparation des Chambres (20 chambres)
    const rooms = [];
    for (let i = 1; i <= 20; i++) {
      const isVIP = i % 3 === 0;
      rooms.push({
        number: 100 + i,
        type: isVIP ? 'VIP' : 'Standard',
        price: isVIP ? 45000 : 25000,
        status: 'Libre'
      });
    }

    // 5. Préparation des Produits (Actualisé pour la Caisse)
    const productsData = [
      { name: 'Coca-Cola', price: 1500, category: 'SUCRERIES', type: 'bar' },
      { name: 'Fanta', price: 1500, category: 'SUCRERIES', type: 'bar' },
      { name: 'Bière Flag', price: 1500, category: 'BIÈRES', type: 'bar' }, 
      { name: 'Eau 1.5L', price: 600, category: 'EAU', type: 'bar' },
      { name: 'Pizza Royale', price: 8000, category: 'PLATS', type: 'resto' },
      { name: 'Pâtes Bolo', price: 7000, category: 'PLATS', type: 'resto' },
      { name: 'Poisson Braisé', price: 12000, category: 'PLATS', type: 'resto' },
      { name: 'Salade César', price: 5000, category: 'ENTRÉES', type: 'resto' },
      { name: 'Alloco', price: 1000, category: 'ENTRÉES', type: 'resto' },
    ];

    // 6. Insertion dans la base de données
    await User.create(users); 
    console.log("✅ Comptes Waska Village créés !");

    await Room.create(rooms);
    console.log(`✅ ${rooms.length} chambres ont été installées !`);

    // Utilisation du modèle Product (Majuscule) pour insérer le tableau productsData
    await Product.create(productsData);
    console.log("✅ Les produits (Bar & Resto) ont été créés avec succès !");

    // 7. Sortie propre
    console.log("--- SEEDING TERMINÉ AVEC SUCCÈS ---");
    mongoose.connection.close();
    process.exit();

  } catch (error) {
    console.error(`❌ Erreur lors du seeding : ${error.message}`);
    if (mongoose.connection) mongoose.connection.close();
    process.exit(1);
  }
};

seedData();