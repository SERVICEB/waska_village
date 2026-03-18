const jwt = require('jsonwebtoken'); 
const User = require('../models/User');

/**
 * PROTECT : Vérifie si l'utilisateur est authentifié via son Token JWT
 */
const protect = async (req, res, next) => {
    let token;

    // 1. On cherche le token dans les headers (format: Bearer <token>)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extraction du token
            token = req.headers.authorization.split(' ')[1];

            // Vérification du token avec la clé secrète
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // On récupère l'utilisateur (sans le mot de passe) et on l'attache à la requête
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'Utilisateur introuvable' });
            }

            return next(); // On passe à la suite de la requête
        } catch (error) {
            console.error("Erreur Token:", error);
            return res.status(401).json({ message: 'Token invalide ou expiré' });
        }
    }

    // 2. Si aucun token n'est trouvé
    if (!token) {
        return res.status(401).json({ message: 'Accès refusé : Aucun token fourni' });
    }
}; 

/**
 * AUTHORIZE : Vérifie si l'utilisateur a les permissions nécessaires (ex: 'admin', 'raf')
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Le rôle ${req.user?.role || 'inconnu'} n'est pas autorisé à accéder à cette ressource`
            }); 
        }
        next();
    }; 
}; 

// On exporte un objet contenant les deux fonctions
module.exports = { protect, authorize };