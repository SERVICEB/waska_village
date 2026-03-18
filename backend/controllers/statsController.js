const Reservation = require('../models/Reservation');
const Decharge = require('../models/Decharge'); // Modèle actualisé pour les sorties cash
const Room = require('../models/Room');
const Cloture = require('../models/Cloture'); // Importé pour les ventes globales

// --- 1. STATS DU DASHBOARD PRINCIPAL ---
exports.getDashboardStats = async (req, res) => {
    try {
        // --- A. CALCUL DU REVENU (Réservations Hôtel) ---
        // On calcule les acomptes encaissés + les soldes des réservations terminées
        const revenuStats = await Reservation.aggregate([
            {
                $group: {
                    _id: null,
                    totalAcomptes: { $sum: "$deposit" },
                    totalSoldesTermines: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "Terminé"] },
                                { $subtract: [{ $subtract: ["$roomPriceTotal", "$deposit"] }, "$discount"] },
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        let caHotel = revenuStats.length > 0 
            ? (revenuStats[0].totalAcomptes + revenuStats[0].totalSoldesTermines) 
            : 0;

        // --- B. CALCUL DES DÉPENSES (Sorties Cash FinanceRAF) ---
        const depenseStats = await Decharge.aggregate([
            { 
                $group: { 
                    _id: null, 
                    total: { $sum: "$montant" } 
                } 
            }
        ]);
        const depensesTotal = depenseStats.length > 0 ? depenseStats[0].total : 0;

        // --- C. ÉTAT DES CHAMBRES ---
        const allRooms = await Room.find({});
        const totalRooms = allRooms.length;
        
        const occupiedRooms = allRooms.filter(room => {
            const status = room.status ? room.status.toLowerCase().trim() : '';
            return status === 'occupée' || status === 'occupe' || status === 'reservée' || status === 'reserved';
        }).length;

        const availableRoomsCount = totalRooms - occupiedRooms;
        const occupationRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

        // --- D. RÉPONSE SYNCHRONISÉE ---
        res.status(200).json({
            success: true,
            data: {
                caTotal: caHotel,
                depensesTotal: depensesTotal,
                soldeNet: caHotel - depensesTotal,
                tauxOccupation: parseFloat(occupationRate.toFixed(1)),
                chambresDispos: availableRoomsCount,
                totalRooms: totalRooms,
                occupiedRooms: occupiedRooms
            }
        });

    } catch (error) {
        console.error("Erreur Stats Dashboard détaillée:", error);
        res.status(500).json({ 
            success: false, 
            message: "Erreur serveur lors du calcul des statistiques",
            error: error.message 
        });
    }
};

// --- 2. CALCUL DES VENTES GLOBALES (Pour Finance Hub / Admin Hub) ---
// Cette fonction corrige l'erreur 404 rencontrée précédemment
exports.getVentesGlobales = async (req, res) => {
    try {
        // On récupère le cumul de CA de toutes les clôtures (Bar, Resto, Réception)
        const result = await Cloture.aggregate([
            { $group: { _id: null, total: { $sum: "$totalVentes" } } }
        ]);

        const totalVentes = result.length > 0 ? result[0].total : 0;

        res.status(200).json({
            success: true,
            total: totalVentes
        });
    } catch (error) {
        console.error("Erreur Ventes Globales:", error);
        res.status(500).json({ 
            success: false, 
            message: "Erreur lors de la récupération des ventes globales" 
        });
    }
};