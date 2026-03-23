const Reservation = require('../models/Reservation');
const Room = require('../models/Room');
const Activity = require('../models/Activity');

// ─── CRÉER UNE RÉSERVATION / WALK-IN ─────────────────────────────────────────
exports.createReservation = async (req, res) => {
    try {
        const { client, room, nights, deposit, status, dateArrivee, pointDeVente } = req.body;

        const selectedRoom = await Room.findById(room);
        if (!selectedRoom) return res.status(404).json({ message: 'Chambre non trouvée' });

        const roomPriceTotal = selectedRoom.price * Number(nights || 1);
        const finalDeposit   = Number(deposit || 0);
        const pdv            = pointDeVente || 'Réception';

        const reservation = await Reservation.create({
            client,
            room,
            nights:       Number(nights || 1),
            deposit:      finalDeposit,
            status,
            dateArrivee,
            roomPriceTotal,
            pointDeVente: pdv
        });

        // Bloquer la chambre si arrivée directe
        if (status === 'Occupé') {
            await Room.findByIdAndUpdate(room, { status: 'Occupée' });
        }

        // ── Activité : encaissement du dépôt/acompte ──────────────────────
        // Seulement si un montant est versé — type 'entree' pour entrer dans le solde
        if (finalDeposit > 0) {
            await Activity.create({
                action:       status === 'Occupé' ? 'ARRIVÉE DIRECTE' : 'ACOMPTE RÉSERVATION',
                details:      `${status === 'Occupé' ? 'Walk-in' : 'Acompte'} CH ${selectedRoom.number} — ${finalDeposit.toLocaleString('fr-FR')} F`,
                montant:      finalDeposit,
                type:         'entree',      // ← clé : compté dans le solde caisse
                pointDeVente: pdv,           // ← clé : 'Réception' pour le filtre frontend
                archived:     false
            });
        }

        res.status(201).json(reservation);
    } catch (error) {
        console.error('[RESA] createReservation:', error);
        res.status(400).json({ message: error.message });
    }
};

// ─── RÉCUPÉRER TOUTES LES RÉSERVATIONS ───────────────────────────────────────
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

// ─── CHECK-IN ─────────────────────────────────────────────────────────────────
exports.checkIn = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id).populate('room');
        if (!reservation) return res.status(404).json({ message: 'Réservation introuvable' });

        reservation.status = 'Occupé';
        await reservation.save();
        await Room.findByIdAndUpdate(reservation.room._id, { status: 'Occupée' });

        // type 'info' → non compté dans le solde caisse
        await Activity.create({
            action:       'CHECK-IN',
            details:      `Arrivée confirmée CH ${reservation.room.number}`,
            montant:      0,
            type:         'info',
            pointDeVente: reservation.pointDeVente || 'Réception',
            archived:     false
        });

        res.status(200).json(reservation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// ─── CHECK-OUT ────────────────────────────────────────────────────────────────
exports.checkOut = async (req, res) => {
    try {
        const { discount, pointDeVente } = req.body;
        const reservation = await Reservation.findById(req.params.id).populate('room');
        if (!reservation) return res.status(404).json({ message: 'Réservation introuvable' });

        const remise      = Number(discount || 0);
        const resteAPayer = Math.max(0, (reservation.roomPriceTotal || 0) - (reservation.deposit || 0) - remise);
        const pdv         = pointDeVente || reservation.pointDeVente || 'Réception';

        // Utiliser updateOne pour éviter les erreurs de champs non définis dans le schéma
        await Reservation.findByIdAndUpdate(
            req.params.id,
            { $set: { status: 'Terminé', ...(remise > 0 ? { discount: remise } : {}) } },
            { strict: false } // accepte les champs non déclarés dans le schéma
        );

        await Room.findByIdAndUpdate(reservation.room._id, { status: 'Sale' });

        // Encaissement du solde final → type 'entree' → compté dans le solde
        if (resteAPayer > 0) {
            await Activity.create({
                action:       'ENCAISSEMENT FINAL',
                details:      `Check-out CH ${reservation.room.number}${remise > 0 ? ` — remise ${remise.toLocaleString('fr-FR')} F` : ''}`,
                montant:      resteAPayer,
                type:         'entree',
                pointDeVente: pdv,
                archived:     false
            });
        } else {
            await Activity.create({
                action:       'CHECK-OUT',
                details:      `CH ${reservation.room.number} libérée — solde soldé`,
                montant:      0,
                type:         'info',
                pointDeVente: pdv,
                archived:     false
            });
        }

        res.status(200).json({ success: true, message: 'Check-out réussi', resteAPayer });
    } catch (error) {
        console.error('[RESA] checkOut:', error);
        res.status(400).json({ message: error.message });
    }
};

// ─── DÉLOGER ──────────────────────────────────────────────────────────────────
exports.moveRoom = async (req, res) => {
    try {
        const { newRoomId } = req.body;
        const resa = await Reservation.findById(req.params.id).populate('room');
        if (!resa) return res.status(404).json({ message: 'Réservation introuvable' });

        const oldNumber = resa.room.number;
        await Room.findByIdAndUpdate(resa.room._id, { status: 'Sale' });
        const newRoom = await Room.findByIdAndUpdate(newRoomId, { status: 'Occupée' }, { new: true });

        // Utiliser findByIdAndUpdate pour éviter les erreurs strict mode Mongoose
        await Reservation.findByIdAndUpdate(
            resa._id,
            { $set: { room: newRoomId, roomPriceTotal: newRoom.price * resa.nights } },
            { strict: false }
        );

        await Activity.create({
            action:       'CHANGEMENT CHAMBRE',
            details:      `CH ${oldNumber} → CH ${newRoom.number}`,
            montant:      0,
            type:         'info',
            pointDeVente: resa.pointDeVente || 'Réception',
            archived:     false
        });

        res.status(200).json(resa);
    } catch (error) {
        console.error('[RESA] moveRoom:', error);
        res.status(400).json({ message: error.message });
    }
};