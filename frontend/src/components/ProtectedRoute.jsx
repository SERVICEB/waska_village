import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    // 1. UTILISER LES MÊMES CLÉS QUE DANS LOGIN.JSX
    const token = localStorage.getItem('userToken');
    const role  = localStorage.getItem('userRole');

    // 2. SI PAS DE TOKEN, REDIRIGE VERS /LOGIN
    // Attention : Rediriger vers "/" peut causer une boucle si "/" redirige vers /login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // 3. SI LE RÔLE N'EST PAS AUTORISÉ
    if (allowedRoles && !allowedRoles.includes(role)) {
        // Tu peux rediriger vers une page spécifique ou par défaut vers le login
        return <Navigate to="/login" replace />;
    }

    // 4. TOUT EST OK : ON AFFICHE LA PAGE
    return children;
}; 

export default ProtectedRoute;