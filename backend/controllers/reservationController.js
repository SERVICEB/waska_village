const Reservation = require('../models/Reservation');
const Room = require('../models/Room');
const Activity = require('../models/Activity'); // Pour le journal

// @desc    Créer une réservation ou un Walk-in
exports.createReservation = async (req, res) => {
    try {
        const { client, room, nights, deposit, status, dateArrivee } = req.body;

        // 1. Calculer le prix total basé sur la chambre
        const selectedRoom = await Room.findById(room);
        if (!selectedRoom) return res.status(404).json({ message: "Chambre non trouvée" });
        
        const roomPriceTotal = selectedRoom.price * nights;

        // 2. Créer la réservation
        const reservation = await Reservation.create({
            client,
            room,
            nights,
            deposit,
            status,
            dateArrivee,
            roomPriceTotal
        });

        // 3. Si c'est une arrivée directe (Occupé), on bloque la chambre
        if (status === 'Occupé') {
            await Room.findByIdAndUpdate(room, { status: 'Occupée' });
        }

        // 4. Ajouter au journal d'activité
        await Activity.create({
            action: status === 'Occupé' ? "ARRIVÉE DIRECTE" : "RÉSERVATION",
            details: `Client ID: ${client} - CH ${selectedRoom.number}`,
            montant: deposit,
            type: 'entree'
        });

        res.status(201).json(reservation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Récupérer toutes les réservations avec détails (Populate)
exports.getReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find()
            .populate('client', 'name phone')
            .populate('room', 'number type price')
            .sort({ createdAt: -1 });
        res.status(200).json(reservations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Valider une arrivée (Check-in)
exports.checkIn = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id).populate('room');
        if (!reservation) return res.status(404).json({ message: "Introuvable" });

        reservation.status = 'Occupé';
        await reservation.save();

        // Bloquer la chambre
        await Room.findByIdAndUpdate(reservation.room._id, { status: 'Occupée' });

        await Activity.create({
            action: "CHECK-IN",
            details: `Validation arrivée CH ${reservation.room.number}`,
            type: 'info'
        });

        res.status(200).json(reservation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Check-out final (Encaisser et libérer)
exports.checkOut = async (req, res) => {
    try {
        const { discount } = req.body;
        const reservation = await Reservation.findById(req.params.id).populate('room');

        const resteAPayer = reservation.roomPriceTotal - reservation.deposit - (discount || 0);

        reservation.status = 'Terminé';
        reservation.discount = discount || 0;
        await reservation.save();

        // Libérer la chambre (elle passe en Sale pour le ménage)
        await Room.findByIdAndUpdate(reservation.room._id, { status: 'Sale' });

        // Journaliser l'encaissement final
        await Activity.create({
            action: "ENCAISSEMENT FINAL",
            details: `Check-out CH ${reservation.room.number}`,
            montant: resteAPayer,
            type: 'entree'
        });

        res.status(200).json({ message: "Check-out réussi" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Déloger (Changer de chambre)
exports.moveRoom = async (req, res) => {
    try {
        const { newRoomId } = req.body;
        const resa = await Reservation.findById(req.params.id);
        const oldRoomId = resa.room;

        // 1. Libérer l'ancienne (Sale) et occuper la nouvelle
        await Room.findByIdAndUpdate(oldRoomId, { status: 'Sale' });
        const newRoom = await Room.findByIdAndUpdate(newRoomId, { status: 'Occupée' });

        // 2. Mettre à jour la résa et le prix
        resa.room = newRoomId;
        resa.roomPriceTotal = newRoom.price * resa.nights;
        await resa.save();

        res.status(200).json(resa);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};