import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('userToken');
    const rawRole = localStorage.getItem('userRole');
    
    // Normalisation du rôle utilisateur : " RAF " -> "raf"
    const userRole = rawRole ? String(rawRole).toLowerCase().trim() : null;

    if (!token) return <Navigate to="/login" replace />;

    if (allowedRoles) {
        // Normalisation de la liste des rôles autorisés
        const normalizedAllowed = allowedRoles.map(r => String(r).toLowerCase().trim());

        // Test de présence
        const isAuthorized = normalizedAllowed.includes(userRole);

        if (!isAuthorized) {
            console.error(`Blocage Sécurité - Rôle détecté: "${userRole}" | Autorisé:`, normalizedAllowed);
            return <Navigate to="/login" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;