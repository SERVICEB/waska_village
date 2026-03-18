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
import ProtectedRoute from './components/ProtectedRoute';
import AddDechargeModal from './pages/AddDechargeModal';

/**
 * AppLayout : Gère la structure visuelle (Sidebar + Contenu)
 */
const AppLayout = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem('userToken');
  const isLoginPage = location.pathname === '/login' || location.pathname === '/';

  // Routes qui déclenchent le mode "Admin/RAF" dans la Sidebar
  const adminRoutes = ['/admin-dashboard', '/finance', '/cloture-finale', '/rapports', '/stock'];
  const isAdminSession = adminRoutes.some(route => location.pathname.startsWith(route));

  return (
    <div className="flex bg-[#FDFBF9] min-h-screen font-sans">
      {!isLoginPage && token && <Sidebar isAdminView={isAdminSession} />}
      
      <main className={`flex-1 transition-all duration-300 ${(!isLoginPage && token) ? 'md:ml-64' : ''}`}>
        {children}
      </main>
    </div>
  );
};

function App() {
  const [session, setSession] = useState(localStorage.getItem('userToken'));

  useEffect(() => {
    const syncLogout = (e) => {
      if (e.key === 'userToken') setSession(e.newValue);
    };
    window.addEventListener('storage', syncLogout);
    return () => window.removeEventListener('storage', syncLogout);
  }, []);

  // Fonction pour obtenir le rôle actuel proprement
  const getUserRole = () => (localStorage.getItem('userRole') || '').toLowerCase().trim();

  return (
    <Router>
      <AppLayout authTicket={session}>
        <Routes>
          {/* --- AUTHENTIFICATION --- */}
          <Route path="/login" element={
            <Login onLoginSuccess={() => setSession(localStorage.getItem('userToken'))} />
          } />
          
          {/* REDIRECTION INTELLIGENTE SELON LE RÔLE */}
          <Route path="/" element={
            session ? (
              getUserRole() === 'raf' 
                ? <Navigate to="/admin-dashboard" replace /> 
                : <Navigate to="/reception" replace />
            ) : <Navigate to="/login" replace />
          } />

          {/* --- ESPACE RÉCEPTION --- */}
          {/* Ajout de 'raf' ici pour éviter le blocage de sécurité au login */}
          <Route path="/reception" element={
            <ProtectedRoute allowedRoles={['reception', 'admin', 'gerant', 'raf']}>
              <Reception />
            </ProtectedRoute>
          } />

          {/* --- ESPACE CAISSE --- */}
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

          {/* --- ESPACE STOCK --- */}
          <Route path="/stock" element={
            <ProtectedRoute allowedRoles={['stock', 'magasinier', 'admin', 'raf', 'gerant']}>
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
          
          <Route path="/add-dechargeModal" element={
            <ProtectedRoute allowedRoles={['admin', 'raf']}>
              <AddDechargeModal />
            </ProtectedRoute>
          } />

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
          <Route path="*" element={
            session 
              ? (getUserRole() === 'raf' ? <Navigate to="/admin-dashboard" replace /> : <Navigate to="/reception" replace />) 
              : <Navigate to="/login" replace />
          } />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;