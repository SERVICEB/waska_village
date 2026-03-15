const Cloture = require('../models/Cloture');
const Activity = require('../models/Activity');

// @desc    Créer une clôture complète avec archivage des transactions
exports.createCloture = async (req, res) => {
    try {
        // 1. Extraction des données (on adapte le langage Frontend -> Backend)
        const { 
            type,           // 'bar' ou 'resto'
            montantEspeces, // d_cash
            montantMobile,  // d_mobile
            totalVentes,    // d_total
            notes 
        } = req.body;

        const pdv = type || 'Réception';

        // 2. Calcul du Théorique (basé sur les activités non archivées)
        const activities = await Activity.find({ archived: false, pointDeVente: pdv });
        
        const totalEntrees = activities
            .filter(a => a.type === 'entree')
            .reduce((sum, a) => sum + (Number(a.montant) || 0), 0);

        const totalSorties = activities
            .filter(a => a.type === 'sortie')
            .reduce((sum, a) => sum + (Number(a.montant) || 0), 0);

        const totalTheorique = totalEntrees - totalSorties;

        // 3. Préparation de l'objet de clôture selon ton Modèle imbriqué
        const newCloture = new Cloture({
            pointDeVente: pdv,
            // req.user vient du middleware 'protect'
            caissier: req.user ? req.user.username : 'Caissier Auto',
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
                    total: Number(totalVentes) || 0,
                    cash: Number(montantEspeces) || 0,
                    mobile: Number(montantMobile) || 0
                },
                ecart: (Number(totalVentes) || 0) - totalTheorique,
                notes: notes || ""
            }
        });

        // 4. Sauvegarde
        await newCloture.save();

        // 5. ARCHIVAGE : On marque les activités comme traitées
        await Activity.updateMany(
            { archived: false, pointDeVente: pdv }, 
            { $set: { archived: true } }
        );

        // 6. Log de l'arrêt de caisse dans les activités
        await Activity.create({
            action: `CLÔTURE CAISSE - ${pdv.toUpperCase()}`,
            details: `Validée par ${req.user ? req.user.username : 'Système'}. Écart: ${(Number(totalVentes) || 0) - totalTheorique} F`,
            montant: totalVentes,
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

// @desc    Récupérer l'historique des clôtures
exports.getClotures = async (req, res) => {
    try {
        const { pdv } = req.query;
        const query = pdv ? { pointDeVente: pdv } : {};
        const clotures = await Cloture.find(query).sort({ createdAt: -1 });
        res.status(200).json(clotures);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération" });
    }
};

// @desc    Audit (Validation par le Manager)
exports.auditCloture = async (req, res) => {
    try {
        const { id } = req.params;
        const { notes, auditeurNom } = req.body;

        const updatedCloture = await Cloture.findByIdAndUpdate(
            id, 
            { 
                $set: {
                    audite: true, 
                    dateAudite: new Date(),
                    auditeurNom: auditeurNom || "Manager",
                    notes: notes 
                }
            },
            { new: true }
        );

        res.status(200).json(updatedCloture);
    } catch (error) {
        res.status(400).json({ message: "Échec de l'audit" });
    }
};