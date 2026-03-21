const Decharge = require('../models/Decharge');

// ─── 1. CRÉER ─────────────────────────────────────────────────────────────────
exports.createDecharge = async (req, res) => {
    try {
        const { type, montant, date, beneficiaire, justificatif, fileName } = req.body;

        const nouvelleDecharge = new Decharge({
            type,
            montant:      Number(montant),
            date:         date || new Date(),
            beneficiaire,
            justificatif,
            fileName,
            auteur:       req.user.id,
            archived:     false,   // toujours actif à la création
            dateArchive:  null,
        });

        await nouvelleDecharge.save();
        res.status(201).json(nouvelleDecharge);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// ─── 2. RÉCUPÉRER (journée en cours uniquement — non archivées) ───────────────
exports.getDecharges = async (req, res) => {
    try {
        // Par défaut on retourne les décharges actives (non archivées)
        // Le frontend peut passer ?all=true pour tout récupérer (historique)
        const filter = req.query.all === 'true' ? {} : { archived: false };

        const decharges = await Decharge
            .find(filter)
            .sort({ date: -1 });

        res.status(200).json(decharges);
    } catch (err) {
        res.status(500).json({ message: 'Erreur de récupération' });
    }
};

// ─── 3. RÉCUPÉRER TOUTES (archivées incluses, pour historique RAF) ────────────
exports.getAllDecharges = async (req, res) => {
    try {
        const decharges = await Decharge
            .find()
            .sort({ date: -1 });

        res.status(200).json(decharges);
    } catch (err) {
        res.status(500).json({ message: 'Erreur de récupération' });
    }
};

// ─── 4. SUPPRIMER ────────────────────────────────────────────────────────────
exports.deleteDecharge = async (req, res) => {
    try {
        const decharge = await Decharge.findByIdAndDelete(req.params.id);
        if (!decharge) return res.status(404).json({ message: 'Décharge introuvable' });
        res.status(200).json({ message: 'Décharge supprimée' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur de suppression' });
    }
};

// ─── 5. FILTRER PAR PÉRIODE ───────────────────────────────────────────────────
exports.getDechargesByDate = async (req, res) => {
    try {
        const { start, end } = req.query;

        if (!start || !end) {
            return res.status(400).json({ message: 'Paramètres start et end requis.' });
        }

        const filter = {
            date: {
                $gte: new Date(start),
                $lte: new Date(end),
            }
        };

        // Optionnel : inclure les archivées dans le filtre par date
        if (req.query.archived !== 'true') {
            filter.archived = false;
        }

        const decharges = await Decharge.find(filter).sort({ date: 1 });
        res.status(200).json(decharges);
    } catch (err) {
        res.status(500).json({ message: 'Erreur de filtrage' });
    }
};

// ─── 6. STATS JOURNÉE (total + répartition par type) ─────────────────────────
// Utilisé par le dashboard RAF pour les KPIs dépenses
exports.getStatsJournee = async (req, res) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const decharges = await Decharge.find({
            archived: false,
            createdAt: { $gte: startOfDay },
        });

        const total = decharges.reduce((s, d) => s + (d.montant || 0), 0);

        const parType = decharges.reduce((acc, d) => {
            const k = d.type || 'Divers';
            acc[k] = (acc[k] || 0) + (d.montant || 0);
            return acc;
        }, {});

        res.status(200).json({
            total,
            count: decharges.length,
            parType,
        });
    } catch (err) {
        res.status(500).json({ message: 'Erreur stats journée' });
    }
};

// ─── 7. ARCHIVER MANUELLEMENT UNE DÉCHARGE ───────────────────────────────────
// (cas rare : forcer l'archivage d'une ligne sans faire la clôture globale)
exports.archiveDecharge = async (req, res) => {
    try {
        const decharge = await Decharge.findByIdAndUpdate(
            req.params.id,
            { $set: { archived: true, dateArchive: new Date() } },
            { new: true }
        );
        if (!decharge) return res.status(404).json({ message: 'Décharge introuvable' });
        res.status(200).json({ success: true, data: decharge });
    } catch (err) {
        res.status(500).json({ message: 'Erreur archivage' });
    }
};