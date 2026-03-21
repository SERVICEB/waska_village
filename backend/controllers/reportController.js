const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Cloture = require('../models/Cloture');
const Activity = require('../models/Activity');
const Decharge = require('../models/Decharge');

// ─── UTILITAIRE : ARCHIVAGE COMPLET ──────────────────────────────────────────
const archiveAll = async (auteur = 'Système') => {
    const [cloturesResult, activitiesResult, dechargesResult] = await Promise.all([
        Cloture.updateMany(
            { audite: false },
            { $set: { audite: true, dateAudit: new Date() } }
        ),
        Activity.updateMany(
            { archived: false },
            { $set: { archived: true } }
        ),
        Decharge.updateMany(
            { archived: false },
            { $set: { archived: true, dateArchive: new Date() } }
        )
    ]);
    return { cloturesResult, activitiesResult, dechargesResult };
};

// ─── 1. STATISTIQUES POUR DASHBOARD ─────────────────────────────────────────
exports.getGlobalStats = async (req, res) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const salesByPDV = await Cloture.aggregate([
            { $match: { audite: false, createdAt: { $gte: startOfDay } } },
            { $group: { _id: "$pointDeVente", total: { $sum: "$totalVentes" } } }
        ]);
        const totalCA = salesByPDV.reduce((sum, item) => sum + item.total, 0);

        const depActiv = await Activity.find({ type: 'sortie', archived: false });
        const totalDepActiv = depActiv.reduce((s, i) => s + (i.montant || 0), 0);

        const depDecharge = await Decharge.find({ archived: false });
        const totalDepDecharge = depDecharge.reduce((s, i) => s + (i.montant || 0), 0);

        const totalDepenses = totalDepActiv + totalDepDecharge;

        const topProduits = await Activity.aggregate([
            { $match: { type: 'entree', archived: false } },
            { $group: { _id: "$details", qty: { $sum: 1 }, rev: { $sum: "$montant" } } },
            { $sort: { rev: -1 } },
            { $limit: 5 }
        ]);

        res.status(200).json({
            caTotal: totalCA,
            depenses: totalDepenses,
            benefice: totalCA - totalDepenses,
            ventesParEntite: salesByPDV.map(s => ({
                name: s._id || 'Autres',
                value: s.total,
                color: s._id?.toLowerCase() === 'réception' ? 'bg-slate-400' :
                       s._id?.toLowerCase() === 'bar'        ? 'bg-[#D17A61]' : 'bg-[#386D7F]'
            })),
            topProduits: topProduits.map(p => ({
                name: p._id || 'Prestation',
                qty: p.qty,
                rev: p.rev
            }))
        });
    } catch (error) {
        console.error('[REPORT] Erreur Stats:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques.' });
    }
};

// ─── 2. GÉNÉRATION DU RAPPORT PDF ────────────────────────────────────────────
exports.generateDailyReport = async (req, res) => {
    try {
        const dateISO = new Date().toISOString().split('T')[0];
        const filename = `Rapport_Audit_${dateISO}_${Date.now()}.pdf`;
        const directoryPath = path.join(__dirname, '../storage/reports');

        if (!fs.existsSync(directoryPath)) fs.mkdirSync(directoryPath, { recursive: true });

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        let clotures = await Cloture.find({ audite: false }).lean();
        if (clotures.length === 0) {
            clotures = await Cloture.find({ createdAt: { $gte: startOfDay } }).lean();
        }

        const depActivites = await Activity.find({ type: 'sortie', archived: false }).lean();
        const depDecharges = await Decharge.find({ archived: false }).lean();

        if (clotures.length === 0 && depActivites.length === 0 && depDecharges.length === 0) {
            return res.status(200).json({ success: false, message: 'Aucune donnée à imprimer.' });
        }

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

        const fileStream = fs.createWriteStream(path.join(directoryPath, filename));
        doc.pipe(fileStream);
        doc.pipe(res);

        doc.fillColor('#0F4C3A').fontSize(28).font('Helvetica-Bold').text('WASKA VILLAGE', { align: 'center' });
        doc.fillColor('#386D7F').fontSize(11).font('Helvetica')
           .text(`Rapport d'Audit — ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke();
        doc.moveDown(1.5);

        let totalRecettes = 0;
        doc.fillColor('#0F4C3A').fontSize(13).font('Helvetica-Bold').text('RECETTES PAR CAISSE');
        doc.moveDown(0.5);
        if (clotures.length > 0) {
            clotures.forEach(c => {
                totalRecettes += (c.totalVentes || 0);
                doc.fillColor('#334155').fontSize(10).font('Helvetica')
                   .text(`  ${(c.pointDeVente || 'Réception').toUpperCase()} (${c.caissier || 'N/A'})`, { continued: true })
                   .fillColor('#386D7F').font('Helvetica-Bold')
                   .text(`  +${(c.totalVentes || 0).toLocaleString('fr-FR')} F`, { align: 'right' });
            });
        } else {
            doc.fillColor('#94a3b8').fontSize(10).text('  Aucune clôture enregistrée.');
        }
        doc.moveDown(0.5);
        doc.fillColor('#0F4C3A').font('Helvetica-Bold').fontSize(11)
           .text(`  TOTAL RECETTES : +${totalRecettes.toLocaleString('fr-FR')} F`, { align: 'right' });

        doc.moveDown(1.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
        doc.moveDown(1);

        let totalDep = 0;

        if (depActivites.length > 0) {
            doc.fillColor('#C0392B').fontSize(13).font('Helvetica-Bold').text('DÉPENSES OPÉRATIONNELLES');
            doc.moveDown(0.5);
            depActivites.forEach(d => {
                totalDep += (d.montant || 0);
                doc.fillColor('#334155').fontSize(10).font('Helvetica')
                   .text(`  ${d.details || 'Sortie'}`, { continued: true })
                   .fillColor('#C0392B').font('Helvetica-Bold')
                   .text(`  −${(d.montant || 0).toLocaleString('fr-FR')} F`, { align: 'right' });
            });
            doc.moveDown(1);
        }

        if (depDecharges.length > 0) {
            doc.fillColor('#C0392B').fontSize(13).font('Helvetica-Bold').text('DÉCHARGES & SORTIES DE CAISSE');
            doc.moveDown(0.5);
            const parType = depDecharges.reduce((acc, d) => {
                const k = d.type || 'Divers';
                if (!acc[k]) acc[k] = [];
                acc[k].push(d);
                return acc;
            }, {});
            Object.entries(parType).forEach(([type, items]) => {
                const sousTotal = items.reduce((s, d) => s + (d.montant || 0), 0);
                doc.fillColor('#64748b').fontSize(9).font('Helvetica-Bold')
                   .text(`  [${type.toUpperCase()}]  Sous-total : ${sousTotal.toLocaleString('fr-FR')} F`);
                items.forEach(d => {
                    totalDep += (d.montant || 0);
                    doc.fillColor('#334155').fontSize(10).font('Helvetica')
                       .text(`    • ${d.beneficiaire || 'Bénéficiaire'}`, { continued: true })
                       .fillColor('#C0392B').font('Helvetica-Bold')
                       .text(`  −${(d.montant || 0).toLocaleString('fr-FR')} F`, { align: 'right' });
                });
                doc.moveDown(0.5);
            });
        }

        doc.fillColor('#C0392B').font('Helvetica-Bold').fontSize(11)
           .text(`  TOTAL DÉPENSES : −${totalDep.toLocaleString('fr-FR')} F`, { align: 'right' });

        doc.moveDown(1.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#0F4C3A').lineWidth(1).stroke();
        doc.moveDown(1);

        const solde = totalRecettes - totalDep;
        doc.fillColor(solde >= 0 ? '#0F4C3A' : '#C0392B').fontSize(22).font('Helvetica-Bold')
           .text(`SOLDE NET : ${solde >= 0 ? '+' : ''}${solde.toLocaleString('fr-FR')} F`, { align: 'center' });
        doc.moveDown(2);
        doc.fillColor('#94a3b8').fontSize(8).font('Helvetica')
           .text(`Généré le ${new Date().toLocaleString('fr-FR')} — Waska Village · Jacqueville`, { align: 'center' });

        doc.end();

        fileStream.on('finish', async () => {
            try { await archiveAll(req.user?.nom || req.user?.username); }
            catch (e) { console.error('[REPORT] Erreur archivage post-PDF:', e); }
        });

    } catch (error) {
        console.error('[REPORT] Erreur PDF:', error);
        if (!res.headersSent) res.status(500).json({ message: 'Erreur génération PDF' });
    }
};

// ─── 3. RESET MANUEL / NOUVELLE JOURNÉE ──────────────────────────────────────
exports.forceResetData = async (req, res) => {
    try {
        const { fullReset, note } = req.body || {};
        const auteur = req.user?.nom || req.user?.username || 'RAF';

        if (fullReset) {
            const { cloturesResult, activitiesResult, dechargesResult } = await archiveAll(auteur);

            await Activity.create({
                action: 'RÉINITIALISATION JOURNÉE',
                details: `Nouvelle journée par ${auteur}. ${cloturesResult.modifiedCount} clôtures, ${activitiesResult.modifiedCount} activités, ${dechargesResult.modifiedCount} décharges archivées. Note: ${note || 'RAS'}`,
                montant: 0,
                type: 'info',
                pointDeVente: 'Système',
                archived: true
            });

            return res.status(200).json({
                success: true,
                message: 'Nouvelle journée initialisée.',
                details: {
                    cloturesArchivees:  cloturesResult.modifiedCount,
                    activitesArchivees: activitiesResult.modifiedCount,
                    dechargesArchivees: dechargesResult.modifiedCount
                }
            });
        }

        await archiveAll(auteur);
        res.status(200).json({ success: true, message: 'Données archivées.' });

    } catch (error) {
        console.error('[REPORT] Erreur Reset:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── 4. LISTE DES RAPPORTS ARCHIVÉS ──────────────────────────────────────────
exports.getArchivedReports = async (req, res) => {
    try {
        const directoryPath = path.join(__dirname, '../storage/reports');
        if (!fs.existsSync(directoryPath)) return res.json([]);

        // Filtre optionnel par date : ?from=2025-01-01&to=2025-12-31
        const { from, to } = req.query;

        const files = fs.readdirSync(directoryPath)
            .filter(f => f.endsWith('.pdf'))
            .sort((a, b) => b.localeCompare(a));

        const reports = files.map(filename => {
            const filePath = path.join(directoryPath, filename);
            const stats = fs.statSync(filePath);
            const match = filename.match(/(\d{4}-\d{2}-\d{2})/);
            const dateStr = match ? match[1] : null;
            return {
                filename,
                date: dateStr,
                dateFormatted: dateStr
                    ? new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Date inconnue',
                sizeKo: Math.round(stats.size / 1024),
                createdAt: stats.birthtime || stats.mtime,
            };
        }).filter(r => {
            if (from && r.date && r.date < from) return false;
            if (to   && r.date && r.date > to)   return false;
            return true;
        });

        res.status(200).json(reports);
    } catch (error) {
        console.error('[REPORT] Erreur liste archives:', error);
        res.status(500).json({ message: 'Erreur lecture des archives.' });
    }
};

// ─── 5. TÉLÉCHARGEMENT D'UN RAPPORT ARCHIVÉ ──────────────────────────────────
// Utilise un ReadStream + headers explicites pour éviter le 401 des <a href> directs
// Le middleware protect() sur la route gère déjà l'auth via header Authorization
exports.downloadArchivedReport = async (req, res) => {
    try {
        const filename = path.basename(req.params.filename); // anti path-traversal
        const filePath = path.join(__dirname, '../storage/reports', filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Rapport introuvable.' });
        }

        const stat = fs.statSync(filePath);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length');

        // Stream direct → pas de chargement en mémoire, supporte les gros fichiers
        const fileStream = fs.createReadStream(filePath);
        fileStream.on('error', (err) => {
            console.error('[REPORT] Stream error:', err);
            if (!res.headersSent) res.status(500).json({ message: 'Erreur lecture fichier.' });
        });
        fileStream.pipe(res);

    } catch (error) {
        console.error('[REPORT] Erreur téléchargement:', error);
        if (!res.headersSent) res.status(500).json({ message: 'Erreur téléchargement.' });
    }
};

// ─── 6. SUPPRESSION D'UN RAPPORT ─────────────────────────────────────────────
exports.deleteArchivedReport = async (req, res) => {
    try {
        const filename = path.basename(req.params.filename);
        const filePath = path.join(__dirname, '../storage/reports', filename);
        if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'Rapport introuvable.' });
        fs.unlinkSync(filePath);
        res.status(200).json({ success: true, message: `${filename} supprimé.` });
    } catch (error) {
        console.error('[REPORT] Erreur suppression:', error);
        res.status(500).json({ message: 'Erreur suppression.' });
    }
};