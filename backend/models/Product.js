const mongoose = require('mongoose');

// ─── SOUS-SCHÉMA : Ingrédient/Article lié au Stock ───────────────────────────
// Chaque produit (plat, boisson) peut consommer plusieurs articles de stock
const ingredientSchema = new mongoose.Schema({
    stockItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'Stock',
        required: true
    },
    // Quantité consommée dans le stock à chaque vente de ce produit
    // Ex: 1 Bière Flag → déduit 1 bouteille du stock
    // Ex: 1 Pizza → déduit 200g farine + 100g fromage
    quantiteConsommee: {
        type:    Number,
        default: 1,
        min:     0
    }
}, { _id: false });

const productSchema = new mongoose.Schema({
    // ── Infos produit ────────────────────────────────────────────────────────
    name: {
        type:     String,
        required: true
    },
    // Catégorie d'affichage dans la caisse (ex: Bières, Plats, Cocktails)
    category: {
        type:    String,
        default: 'Divers'
    },
    // Type de caisse où ce produit apparaît
    type: {
        type: String,
        enum: ['bar', 'resto', 'boutique'],
        required: true
    },
    // Prix de vente affiché en caisse
    price: {
        type:     Number,
        required: true,
        min:      0
    },
    // Description optionnelle (affichée en tooltip dans la caisse)
    description: {
        type: String,
        default: ''
    },
    // Produit disponible ou archivé
    actif: {
        type:    Boolean,
        default: true
    },

    // ── Lien Stock (déduction automatique) ──────────────────────────────────
    // Liste des articles de stock consommés à chaque vente de ce produit
    // Vide = pas de déduction stock (ex: prestation, service)
    ingredients: {
        type:    [ingredientSchema],
        default: []
    }

}, { timestamps: true });

// Index pour le chargement caisse (type + actif)
productSchema.index({ type: 1, actif: 1 });
productSchema.index({ category: 1 });

module.exports = mongoose.model('Product', productSchema);