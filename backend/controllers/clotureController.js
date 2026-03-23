const mongoose = require('mongoose');
const getCloture  = () => mongoose.model('Cloture');
const getActivity = () => mongoose.model('Activity');
const getSale     = () => { try { return mongoose.model('Sale'); } catch(e) { return null; } }
// ─── CRÉER UNE CLÔTURE + ARCHIVER LES ACTIVITÉS DU PDV ───────────────────────
// C'est ici que la caisse retombe à zéro côté frontend
exports.createCloture = async (req, res) => {
    try {
        const Cloture  = getCloture();
        const Activity = getActivity();
        const { type, pointDeVente, cash, mobile, totalVentes, notes } = req.body;

        const pdv = type || pointDeVente || 'Réception';
        const finalCash  = Number(cash  || 0);
        const finalMobile = Number(mobile || 0);
        const finalTotal  = Number(totalVentes || (finalCash + finalMobile));

        // Helper : normalise les accents pour comparaison robuste
        // 'Réception' → 'reception', 'réception' → 'reception'
        const norm = s => (s || '').toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

        const isReception = norm(pdv).includes('recep');

        // Filtre MongoDB pour trouver les activités du PDV
        // Pour la Réception, on inclut aussi les activités sans pointDeVente (défaut schéma)
        const pdvFilter = isReception
            ? { $or: [
                { pointDeVente: pdv },           // 'Réception' exact
                { pointDeVente: 'Réception' },    // fallback accent
                { pointDeVente: 'Reception' },    // fallback sans accent
                { pointDeVente: { $exists: false } },
                { pointDeVente: null },
                { pointDeVente: '' }
              ]}
            : { pointDeVente: pdv };

        // 1. Calcul du solde théorique avant archivage
        const activities = await Activity.find({ archived: false, ...pdvFilter });

        const totalEntrees   = activities.filter(a => a.type === 'entree').reduce((s, a) => s + (Number(a.montant) || 0), 0);
        const totalSorties   = activities.filter(a => a.type === 'sortie').reduce((s, a) => s + (Number(a.montant) || 0), 0);
        const totalTheorique = totalEntrees - totalSorties;

        // 2. Création de la clôture
        const newCloture = new Cloture({
            pointDeVente: pdv,
            caissier:    req.user ? (req.user.nom || req.user.username) : 'Caissier Auto',
            caissierId:  req.user?._id,
            totalVentes: finalTotal,
            stats: {
                theorique: { total: totalTheorique, entrees: totalEntrees, sorties: totalSorties },
                declare:   { total: finalTotal, cash: finalCash, mobile: finalMobile },
                ecart:     finalTotal - totalTheorique
            },
            notes: notes || ''
        });

        await newCloture.save();

        // 3. ARCHIVAGE → toutes les activités du PDV passent à archived: true → caisse = 0
        const archiveResult = await Activity.updateMany(
            { archived: false, ...pdvFilter },
            { $set: { archived: true, clotureId: newCloture._id } }
        );

        // 3b. ARCHIVAGE des ventes Sale → clotureId positionné
        // Deux cas : ventesIds envoyés par la caisse bar/resto, OU toutes les ventes du PDV
        const Sale = getSale();
        if (Sale) {
            const ventesIds = req.body.ventesIds || [];
            if (ventesIds.length > 0) {
                // La caisse a envoyé explicitement les IDs des ventes de la session
                await Sale.updateMany(
                    { _id: { $in: ventesIds }, clotureId: null },
                    { $set: { clotureId: newCloture._id } }
                );
            } else {
                // Pas d'IDs → on marque toutes les ventes non clôturées du PDV du jour
                const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
                await Sale.updateMany(
                    {
                        clotureId:  null,
                        status:     'VALIDÉ',
                        type:       pdv.toLowerCase(), // 'bar', 'resto'
                        createdAt:  { $gte: startOfDay }
                    },
                    { $set: { clotureId: newCloture._id } }
                );
            }
        }

        // 4. Log de clôture
        await Activity.create({
            action:       'CLÔTURE EFFECTUÉE',
            details:      `Caisse ${pdv} fermée par ${newCloture.caissier}. Déclaré: ${finalTotal.toLocaleString('fr-FR')} F | Théorique: ${totalTheorique.toLocaleString('fr-FR')} F | Écart: ${(finalTotal - totalTheorique).toLocaleString('fr-FR')} F`,
            montant:      finalTotal,
            type:         'info',
            pointDeVente: pdv,
            archived:     true
        });

        res.status(201).json({
            success: true,
            data: newCloture,
            archived: archiveResult.modifiedCount
        });

    } catch (error) {
        console.error('[CLOTURE] Erreur createCloture:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// ─── RÉCUPÉRER LES CLÔTURES ───────────────────────────────────────────────────
exports.getClotures = async (req, res) => {
    try {
        const Cloture  = getCloture();
        const Activity = getActivity();
        const limit = parseInt(req.query.limit) || 50;

        // Filtre optionnel : ?audite=false pour récupérer uniquement les non auditées
        const filter = {};
        if (req.query.audite === 'false') filter.audite = false;
        if (req.query.audite === 'true')  filter.audite = true;
        if (req.query.pdv)                filter.pointDeVente = req.query.pdv;

        const clotures = await Cloture.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit);

        res.status(200).json(clotures);
    } catch (err) {
        console.error('[CLOTURE] Erreur getClotures:', err);
        res.status(500).json({ message: err.message });
    }
};

// ─── AUDIT INDIVIDUEL (bouton "Signer" RAF) ───────────────────────────────────
exports.auditCloture = async (req, res) => {
    try {
        const Cloture  = getCloture();
        const Activity = getActivity();
        const { statusAudit, noteEcart } = req.body;

        const updated = await Cloture.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    audite:      true,
                    statutAudit: statusAudit || 'Valide',
                    notesAudit:  noteEcart   || '',
                    dateAudit:   new Date(),
                    auditeurNom: req.user?.nom || req.user?.username
                }
            },
            { new: true }
        );

        if (!updated) return res.status(404).json({ message: 'Clôture introuvable' });
        res.status(200).json({ success: true, data: updated });

    } catch (error) {
        console.error('[CLOTURE] Erreur auditCloture:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};

// ─── AUDIT DE TOUTES LES CLÔTURES (Clôture générale RAF) ─────────────────────
exports.auditAllClotures = async (req, res) => {
    try {
        const Cloture  = getCloture();
        const Activity = getActivity();
        const { notesAudit } = req.body;
        const auteur = req.user?.nom || req.user?.username || 'RAF';

        await Cloture.updateMany(
            { audite: false },
            {
                $set: {
                    audite:      true,
                    dateAudit:   new Date(),
                    auditeurNom: auteur,
                    notesAudit:  notesAudit || 'Clôture générale RAF'
                }
            }
        );

        res.status(200).json({ success: true, message: 'Toutes les caisses ont été auditées.' });
    } catch (error) {
        console.error('[CLOTURE] Erreur auditAllClotures:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};