const Cloture = require('../models/Cloture');
const Activity = require('../models/Activity');

/**
 * @desc    Créer une clôture complète avec archivage des transactions
 * @route   POST /api/clotures
 */
exports.createCloture = async (req, res) => {
    try {
        // 1. Extraction des données (Flexibilité sur les noms de champs Front-end)
        const { 
            type,           // 'bar', 'resto' ou 'reception'
            pointDeVente,   // Alternative pour type
            montantEspeces, cash,  // Accepte les deux variantes
            montantMobile, mobile, // Accepte les deux variantes
            totalVentes,           // Total déclaré
            notes 
        } = req.body;

        // Harmonisation des données
        const pdv = type || pointDeVente || 'Réception';
        const finalCash = Number(cash || montantEspeces || 0);
        const finalMobile = Number(mobile || montantMobile || 0);
        const finalTotal = Number(totalVentes || (finalCash + finalMobile));

        // 2. Calcul du Théorique (activités non archivées pour ce PDV spécifique)
        const activities = await Activity.find({ archived: false, pointDeVente: pdv });
        
        const totalEntrees = activities
            .filter(a => a.type === 'entree')
            .reduce((sum, a) => sum + (Number(a.montant) || 0), 0);

        const totalSorties = activities
            .filter(a => a.type === 'sortie')
            .reduce((sum, a) => sum + (Number(a.montant) || 0), 0);

        const totalTheorique = totalEntrees - totalSorties;

        // 3. Préparation de l'objet de clôture
        const newCloture = new Cloture({
            pointDeVente: pdv,
            caissier: req.user ? (req.user.nom || req.user.username) : 'Caissier Auto',
            caissierId: req.user ? req.user._id : null,
            stats: {
                theorique: { 
                    total: totalTheorique,
                    entrees: totalEntrees,
                    sorties: totalSorties,
                    cash: totalTheorique, 
                    mobile: 0
                },
                declare: { 
                    total: finalTotal,
                    cash: finalCash,
                    mobile: finalMobile
                },
                ecart: finalTotal - totalTheorique,
                notes: notes || ""
            }
        });

        // 4. Sauvegarde de la clôture
        await newCloture.save();

        // 5. ARCHIVAGE : Marquer les activités consommées comme traitées
        // On les lie à l'ID de la clôture pour la traçabilité
        await Activity.updateMany(
            { archived: false, pointDeVente: pdv }, 
            { $set: { archived: true, clotureId: newCloture._id } }
        );

        // 6. Création d'un log système pour l'historique (déjà archivé)
        await Activity.create({
            action: `CLÔTURE CAISSE - ${pdv.toUpperCase()}`,
            details: `Validée par ${req.user ? (req.user.nom || req.user.username) : 'Système'}. Écart: ${finalTotal - totalTheorique} F`,
            montant: finalTotal,
            type: 'info',
            pointDeVente: pdv,
            archived: true 
        });

        res.status(201).json({
            success: true,
            message: "Clôture réussie et activités archivées",
            data: newCloture
        });
        
    } catch (error) {
        console.error("ERREUR CLOTURE:", error);
        res.status(400).json({ 
            success: false,
            message: "Erreur lors de la création de la clôture", 
            details: error.message 
        });
    }
};

/**
 * @desc    Récupérer l'historique des clôtures (Audit RAF)
 * @route   GET /api/clotures
 */
exports.getClotures = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const clotures = await Cloture.find()
            .sort({ createdAt: -1 })
            .limit(limit);
        res.status(200).json(clotures);
    } catch (error) {
        res.status(500).json({ success: false, message: "Erreur lors de la récupération" });
    }
};

/**
 * @desc    Audit (Validation par le Manager / RAF)
 * @route   PATCH /api/clotures/:id/audit
 */
exports.auditCloture = async (req, res) => {
    try {
        const { id } = req.params;
        const { statutAudit, notesAudit } = req.body;

        // Mise à jour avec les options modernes pour éviter les warnings
        const updatedCloture = await Cloture.findByIdAndUpdate(
            id, 
            { 
                $set: {
                    audite: true, 
                    statutAudit: statutAudit || 'Validé', 
                    notesAudit: notesAudit || '',
                    dateAudit: new Date(),
                    auditeurNom: req.user ? (req.user.nom || req.user.username) : "RAF Waska"
                }
            },
            { returnDocument: 'after' } // Remplace new: true
        );

        if (!updatedCloture) {
            return res.status(404).json({ success: false, message: "Clôture introuvable" });
        }

        res.status(200).json({
            success: true,
            message: "Audit enregistré avec succès",
            data: updatedCloture
        });
    } catch (error) {
        console.error("ERREUR AUDIT:", error);
        res.status(400).json({ success: false, message: "Échec de l'audit", error: error.message });
    }
};