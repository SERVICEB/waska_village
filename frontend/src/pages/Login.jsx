import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';

/**
 * Login.jsx
 * Page d'authentification de Waska Village connectée au Backend.
 */
const Login = () => {
  // --- 1. ÉTATS (STATES) ---
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // --- 2. LOGIQUE DE CONNEXION ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Appel à l'API Backend
      const response = await axios.post('http://localhost:5000/api/auth/login', credentials);

      // Extraction des données
      const { token, role, username } = response.data;

      // Stockage local pour la persistance
      localStorage.setItem('userToken', token);
      localStorage.setItem('userRole', role);
      localStorage.setItem('userName', username);

      // Redirection intelligente selon le rôle
      if (['admin', 'raf', 'gerant'].includes(role)) {
        navigate('/admin-dashboard');
      } else if (role === 'reception') {
        navigate('/reception');
      } else if (role === 'caisse-bar') {
        navigate('/caisse-bar');
      } else if (role === 'caisse-resto') {
        navigate('/caisse-resto');
      } else if (role === 'stock') {
        navigate('/stock');
      }
    } catch (err) {
      // Gestion des erreurs serveurs ou identifiants
      setError(err.response?.data?.message || 'Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  // --- 3. COMPOSANT INTERNE : LOGO LETTER ---
  const LogoLetter = ({ children, color, patternType }) => {
    const baseClass = "font-black text-6xl uppercase tracking-tighter relative inline-block";
    const colorClass = color === 'teal' ? 'text-[#386D7F]' : 'text-[#D17A61]';
    
    const patterns = {
      geometric: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23D17A61' fill-opacity='0.2'%3E%3Cpath d='M0 0h10v10H0V0zm10 10h10v10H10V10z'/%3E%3C/g%3E%3C/svg%3E")`,
      wave: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10c2.5 0 2.5-5 5-5s2.5 5 5 5' stroke='%23386D7F' stroke-opacity='0.2' fill='none'/%3E%3C/svg%3E")`,
      triangles: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20L10 0l10 20H0z' fill='%23D17A61' fill-opacity='0.1'/%3E%3C/svg%3E")`,
    };

    return (
      <span className={`${baseClass} ${colorClass} mx-[-2px]`} style={{ fontFamily: "'Abril Fatface', serif" }}>
        {children}
        {patternType && (
          <span 
            className="absolute inset-0 z-[-1] opacity-40" 
            style={{ backgroundImage: patterns[patternType], backgroundSize: 'cover' }}
          />
        )}
      </span>
    );
  };

  // --- 4. RENDU (JSX) ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 font-sans relative overflow-hidden">
      
      {/* Background avec flou */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: 'url(https://images.unsplash.com/photo-1509660933844-6910e12765a0?q=80&w=1920&auto=format&fit=crop)',
          opacity: 0.45,
          filter: 'blur(3px)'
        }}
      />
      
      <div className="absolute inset-0 z-10 bg-white/20" />

      <div 
        className="max-w-md w-full rounded-[3rem] shadow-2xl p-12 border border-white/50 relative z-20 backdrop-blur-md overflow-hidden"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)' }}
      >
        
        {/* Logo Section */}
        <div className="text-center mb-10 relative flex flex-col items-center">
          <div className="flex leading-none">
            <LogoLetter color="terracotta" patternType="geometric">W</LogoLetter>
            <LogoLetter color="teal" patternType="wave">A</LogoLetter>
            <LogoLetter color="terracotta" patternType="geometric">S</LogoLetter>
            <LogoLetter color="teal" patternType="wave">K</LogoLetter>
            <LogoLetter color="terracotta" patternType="geometric">A</LogoLetter>
          </div>
          <div className="flex leading-none -mt-3">
            <LogoLetter color="terracotta" patternType="triangles">V</LogoLetter>
            <LogoLetter color="teal">I</LogoLetter>
            <LogoLetter color="terracotta" patternType="triangles">L</LogoLetter>
            <LogoLetter color="terracotta" patternType="triangles">L</LogoLetter>
            <LogoLetter color="teal">A</LogoLetter>
            <LogoLetter color="terracotta" patternType="triangles">G</LogoLetter>
            <LogoLetter color="teal">E</LogoLetter>
          </div>
          <p className="text-slate-600 font-serif text-[13px] mt-3 italic tracking-wide">Jacqueville • Côte d'Ivoire</p>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-3 rounded-2xl text-[11px] font-bold uppercase text-red-600 animate-pulse">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identifiant Poste</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="text"
                required
                autoComplete="username"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-[#386D7F] focus:bg-white outline-none transition-all font-bold text-slate-800"
                placeholder="Ex: admin, reception..."
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="password"
                required
                autoComplete="current-password"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-[#386D7F] focus:bg-white outline-none transition-all font-bold"
                placeholder="••••••••"
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-[#D17A61] text-white font-black py-5 rounded-3xl transition-all shadow-lg flex items-center justify-center gap-3 uppercase text-xs tracking-widest disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Vérification...
              </>
            ) : (
              "Accéder au Dashboard"
            )}
          </button>
        </form>
        
        <p className="text-center text-slate-400 text-[10px] mt-10 uppercase tracking-widest">Waska System v1.0 • Tous droits réservés</p>
      </div>
    </div>
  );
};

export default Login;