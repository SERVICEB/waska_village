const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // 1. Chercher l'utilisateur
        const user = await User.findOne({ username }); 
        
        if (!user) {
            console.log(`[AUTH] Échec : Utilisateur "${username}" non trouvé.`);
            return res.status(401).json({ message: 'Identifiants invalides' });
        }

        // 2. Comparer les mots de passe
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (isMatch) {
            console.log(`[AUTH] Succès : "${username}" est connecté.`);
            // 3. Envoyer la réponse avec le Token
            return res.json({
                _id: user._id,
                username: user.username, 
                role: user.role,
                token: jwt.sign(
                    { id: user._id, role: user.role }, 
                    process.env.JWT_SECRET, 
                    { expiresIn: '30d' }
                )
            }); 
        } else {
            console.log(`[AUTH] Échec : Mauvais mot de passe pour "${username}".`);
            return res.status(401).json({ message: 'Identifiants invalides' });
        }
    } catch (error) {
        console.error("[AUTH] Erreur Serveur:", error);
        res.status(500).json({ message: 'Erreur du serveur' });
    }
};