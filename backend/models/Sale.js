const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    // --- INFOS DE VENTE ---
    heure: { 
        type: String, 
        required: true 
    },
    type: { 
        type: String, 
        required: true, 
        enum: ['bar', 'resto', 'boutique'] 
    },
    table: { 
        type: String, 
        default: null 
    },
    
    // --- CONTENU DU PANIER ---
    items: [{
        product: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Product' 
        },
        name: String,
        qty: Number,
        price: Number
    }],

    // --- FINANCES ---
    subTotal: { type: Number, required: true },
    remise: { type: Number, default: 0 },
    total: { type: Number, required: true },
    mode: { 
        type: String, 
        enum: ['CASH', 'MOBILE', 'CARTE'], 
        default: 'CASH' 
    },

    // --- STATUT ET TRAÇABILITÉ ---
    status: { 
        type: String, 
        enum: ['VALIDÉ', 'REMBOURSÉ', 'ANNULÉ'], 
        default: 'VALIDÉ' 
    },
    motifAnnulation: { type: String, default: "" },
    
    caissierId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },

    /**
     * LE CHAMP CORRECTIF : clotureId
     * Si ce champ est null, la vente apparaît dans la caisse.
     * Dès qu'il contient l'ID d'une clôture, elle disparaît de la caisse 
     * mais reste consultable dans les archives de la RAF.
     */
    clotureId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cloture',
        default: null
    }

}, { timestamps: true });

// Index pour accélérer le chargement du journal de caisse
saleSchema.index({ createdAt: -1, status: 1, clotureId: 1 });

module.exports = mongoose.model('Sale', saleSchema);