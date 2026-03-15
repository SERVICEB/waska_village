const Reservation = require('../models/Reservation');
const Depense = require('../models/Depense');
const Room = require('../models/Room');

exports.getDashboardStats = async (req, res) => {
    try {
        // 1. Calcul du chiffre d'affaires (Acomptes + Restes payés des résas terminées)
        const reservations = await Reservation.find();
        const totalRevenu = reservations.reduce((sum, r) => {
            const acompte = r.deposit || 0;
            const solde = r.status === 'Terminé' ? (r.roomPriceTotal - r.deposit - r.discount) : 0;
            return sum + acompte + solde;
        }, 0);

        // 2. Calcul des dépenses totales
        const depenses = await Depense.find();
        const totalDepenses = depenses.reduce((sum, d) => sum + d.montant, 0);

        // 3. Taux d'occupation
        const totalRooms = await Room.countDocuments();
        const occupiedRooms = await Room.countDocuments({ status: 'Occupée' });
        const occupationRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

        res.status(200).json({
            caTotal: totalRevenu,
            depensesTotal: totalDepenses,
            soldeNet: totalRevenu - totalDepenses,
            tauxOccupation: occupationRate.toFixed(1),
            chambresDispos: totalRooms - occupiedRooms
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};