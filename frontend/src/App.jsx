// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';

// --- IMPORT DES PAGES ---
import Login from './pages/Login';
import Reception from './pages/Reception'; 
import Caisse from './pages/Caisse'; 
import Stock from './pages/Stock';
import Rapport from './pages/Rapport';
import DashboardRAF from './pages/DashboardRAF'; 
import FinanceRAF from './pages/FinanceRAF'; 
import ClotureFinale from './pages/ClotureFinale'; 
/*--import SupervisionLive from './pages/SupervisionLive'; // La vue live pour la RAF--*/
import ProtectedRoute from './components/ProtectedRoute';

/**
 * AppLayout : Gère la structure visuelle (Sidebar + Contenu)
 * Il se rafraîchit dès que "authTicket" change.
 */
const AppLayout = ({ children, authTicket }) => {
  const location = useLocation();
  const token = localStorage.getItem('userToken');
  const isLoginPage = location.pathname === '/login' || location.pathname === '/';

  // Détection du mode Admin pour adapter la Sidebar
  const adminRoutes = ['/admin', '/finance', '/cloture-finale', '/rapports', '/admin-dashboard', '/Supervision'];
  const isAdminSession = adminRoutes.some(route => location.pathname.startsWith(route));

  return (
    <div className="flex bg-[#FDFBF9] min-h-screen font-sans">
      {/* Sidebar affichée uniquement si connecté et hors page login */}
      {!isLoginPage && token && <Sidebar isAdminView={isAdminSession} />}
      
      <main className={`flex-1 transition-all duration-300 ${(!isLoginPage && token) ? 'md:ml-64' : ''}`}>
        {children}
      </main>
    </div>
  );
};

function App() {
  // État de session pour forcer React à redessiner l'app au Login/Logout
  const [session, setSession] = useState(localStorage.getItem('userToken'));

  // Synchronisation avec le localStorage (utile si l'utilisateur ouvre plusieurs onglets)
  useEffect(() => {
    const syncLogout = (e) => {
      if (e.key === 'userToken') setSession(e.newValue);
    };
    window.addEventListener('storage', syncLogout);
    return () => window.removeEventListener('storage', syncLogout);
  }, []);

  return (
    <Router>
      <AppLayout authTicket={session}>
        <Routes>
          {/* --- AUTHENTIFICATION --- */}
          <Route path="/login" element={
            <Login onLoginSuccess={() => setSession(localStorage.getItem('userToken'))} />
          } />
          
          <Route path="/" element={
            session ? <Navigate to="/reception" replace /> : <Navigate to="/login" replace />
          } />

          {/* --- ESPACE RÉCEPTION (Staff & Admin) --- */}
          <Route path="/reception" element={
            <ProtectedRoute allowedRoles={['reception', 'admin', 'gerant']}>
              <Reception />
            </ProtectedRoute>
          } />
          <Route path="/reservation" element={<Navigate to="/reception" replace />} />

          {/* --- ESPACE CAISSE (Caissiers & Admin) --- */}
          <Route path="/caisse-resto" element={
            <ProtectedRoute allowedRoles={['caisse-resto', 'admin', 'gerant']}>
              <Caisse type="resto" />
            </ProtectedRoute>
          } />
          <Route path="/caisse-bar" element={
            <ProtectedRoute allowedRoles={['caisse-bar', 'admin', 'gerant']}>
              <Caisse type="bar" />
            </ProtectedRoute>
          } />

          {/* --- ESPACE STOCK (Magasiniers & Admin) --- */}
          <Route path="/stock" element={
            <ProtectedRoute allowedRoles={['stock', 'magasinier', 'admin', `raf`, 'gerant']}>
              <Stock type="Tous" />
            </ProtectedRoute>
          } />
          <Route path="/stock-cuisine" element={<ProtectedRoute allowedRoles={['stock', 'admin']}><Stock type="Cuisine" /></ProtectedRoute>} />
          <Route path="/stock-bar" element={<ProtectedRoute allowedRoles={['stock', 'admin']}><Stock type="Bar" /></ProtectedRoute>} />
          <Route path="/stock-hotel" element={<ProtectedRoute allowedRoles={['stock', 'admin']}><Stock type="Hôtel" /></ProtectedRoute>} />

          {/* --- ESPACE RAF & ADMINISTRATION --- */}
          <Route path="/admin-dashboard" element={
            <ProtectedRoute allowedRoles={['admin', 'raf', 'gerant']}>
              <DashboardRAF />
            </ProtectedRoute>
          } /> 

          {/* <Route path="/Supervision" element={
            <ProtectedRoute allowedRoles={['admin', 'raf', 'gerant']}>
              <SupervisionLive />
            </ProtectedRoute>
          } /> */}

          <Route path="/rapports" element={
            <ProtectedRoute allowedRoles={['admin', 'raf', 'gerant']}>
              <Rapport />
            </ProtectedRoute>
          } />

          <Route path="/finance" element={
            <ProtectedRoute allowedRoles={['admin', 'raf']}>
              <FinanceRAF />
            </ProtectedRoute>
          } />

          <Route path="/cloture-finale" element={
            <ProtectedRoute allowedRoles={['admin', 'raf']}>
              <ClotureFinale />
            </ProtectedRoute>
          } />

          {/* --- REDIRECTION 404 --- */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;