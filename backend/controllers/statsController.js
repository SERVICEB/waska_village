const mongoose = require('mongoose');

// ─── Chargement via registre Mongoose — zéro circulaire possible ──────────────
// Les modèles sont enregistrés au démarrage par leurs propres fichiers models/
const getReservation = () => mongoose.model('Reservation');
const getDecharge    = () => mongoose.model('Decharge');
const getRoom        = () => mongoose.model('Room');
const getCloture     = () => mongoose.model('Cloture');
const getActivity    = () => mongoose.model('Activity');

// ─── 1. STATS DU DASHBOARD PRINCIPAL ─────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
    try {
        const Cloture  = getCloture();
        const Decharge = getDecharge();
        const Room     = getRoom();

        // CA : clôtures non encore auditées par le RAF
        const revenuClotures = await Cloture.aggregate([
            { $match: { audite: false } },
            { $group: { _id: null, totalGlobal: { $sum: '$totalVentes' } } }
        ]);
        const caReel = revenuClotures[0]?.totalGlobal || 0;

        // Dépenses : décharges non archivées
        const depenseStats = await Decharge.aggregate([
            { $match: { archived: { $ne: true } } },
            { $group: { _id: null, total: { $sum: '$montant' } } }
        ]);
        const depensesTotal = depenseStats[0]?.total || 0;

        // Chambres
        const allRooms    = await Room.find({});
        const totalRooms  = allRooms.length;
        const occupiedRooms = allRooms.filter(r => {
            const s = (r.status || '').toLowerCase().trim();
            return ['occupée', 'occupe', 'reservée', 'reserved'].includes(s);
        }).length;

        res.status(200).json({
            success: true,
            data: {
                caTotal:         caReel,
                depensesTotal:   depensesTotal,
                soldeNet:        caReel - depensesTotal,
                tauxOccupation:  parseFloat((totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0).toFixed(1)),
                chambresDispos:  totalRooms - occupiedRooms,
                totalRooms,
                occupiedRooms
            }
        });
    } catch (error) {
        console.error('[STATS] getDashboardStats:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── 2. VENTES GLOBALES LIVE (monitoring par PDV) ────────────────────────────
exports.getVentesGlobales = async (req, res) => {
    try {
        const Cloture = getCloture();
        const Room    = getRoom();

        const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay   = new Date(); endOfDay.setHours(23, 59, 59, 999);

        // Clôtures du jour non encore auditées, groupées par PDV
        const statsParPoint = await Cloture.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfDay, $lte: endOfDay },
                    audite: false
                }
            },
            {
                $group: {
                    _id:   '$pointDeVente',
                    total: { $sum: '$totalVentes' }
                }
            }
        ]);

        const totalGeneral = statsParPoint.reduce((s, i) => s + i.total, 0);

        const allRooms = await Room.find({});
        const totalRooms = allRooms.length;
        const occupied   = allRooms.filter(r =>
            ['occupée', 'occupe', 'reservée', 'reserved'].includes((r.status || '').toLowerCase().trim())
        ).length;

        res.status(200).json({
            success:         true,
            total:           totalGeneral,
            parPointDeVente: statsParPoint,
            tauxOccupation:  parseFloat((totalRooms > 0 ? (occupied / totalRooms) * 100 : 0).toFixed(1)),
            chambresDispos:  totalRooms - occupied
        });
    } catch (error) {
        console.error('[STATS] getVentesGlobales:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};