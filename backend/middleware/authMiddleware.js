const jwt = require('jsonwebtoken'); 
const User = require('../models/User');

// verifie si l'utilisateur est connecté
const protect = async (req, res, next) => {
    let token;

    // on cherche le token dans les headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // on récupère le token
            token = req.headers.authorization.split(' ')[1];

            // on vérifie le token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // on récupère l'utilisateur associé au token avaec son mot de passe
            req.user = await User.findById(decoded.id).select('-password');

            next(); // on passe au middleware suivant
        } catch (error) {
            console.error("Erreur Token:", error);
            res.status(401).json({ message: 'Token invalide' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Aucun token, accès refusé' });
    }
}; 

// verifie si l'utilisateur a le role requis
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `le role ${req.user?.role || 'inconnu'} n'est pas autorisé à accéder à cette ressource`
            }); 
        }
        next();
    }; 
}; 

module.exports = { protect, authorize };
