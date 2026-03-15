import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Hotel, Package, 
  FileText, LogOut, UserCircle, Settings, Utensils, 
  Beer, Banknote, ShieldCheck, ClipboardList, Wallet
} from 'lucide-react';

// --- 1. ANIMATIONS CSS MISES À JOUR (Plus rapides et fluides) ---
const animationStyles = `
  @keyframes windSway {
    0%, 100% { transform: rotate(0deg) translateX(0px); }
    50% { transform: rotate(4deg) translateX(1.5px); }
  }

  @keyframes leafWave {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(-6deg); }
  }

  .animate-palmier {
    transform-origin: bottom center;
    /* Animation plus rapide : 2.5s au lieu de 4s */
    animation: windSway 2.5s ease-in-out infinite;
  }

  .animate-feuille {
    transform-origin: center;
    /* Animation plus rapide : 2s au lieu de 3s */
    animation: leafWave 2s ease-in-out infinite;
  }
`;

// --- 2. COMPOSANT BOSQUET DE 3 PALMIERS ANIMÉS (SVG) ---
const WaskaPalmGroveLogo = () => (
  <svg viewBox="0 0 120 80" className="h-16 w-20" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Style d'animation intégré au SVG */}
    <style>{animationStyles}</style>

    {/* Le Sol Organique */}
    <path d="M10 75C40 70 80 70 110 75" stroke="#D17A61" strokeWidth="2.5" strokeLinecap="round"/>
    
    {/* --- PALMIER 1 : Moyen à Gauche (Légèrement décalé) --- */}
    <g className="animate-palmier" style={{ animationDelay: '0.2s', transform: 'scale(0.8) translate(15px, 15px)' }}>
      <path d="M30 73C28 60 30 50 35 40" stroke="#D17A61" strokeWidth="3" strokeLinecap="round"/>
      <g className="animate-feuille" style={{ animationDelay: '0s' }}><path d="M35 40C25 35 10 35 5 45" stroke="#386D7F" strokeWidth="3" strokeLinecap="round"/></g>
      <g className="animate-feuille" style={{ animationDelay: '0.2s' }}><path d="M35 40C30 30 20 15 30 10" stroke="#386D7F" strokeWidth="3" strokeLinecap="round"/></g>
      <g className="animate-feuille" style={{ animationDelay: '0.4s' }}><path d="M35 40C40 30 50 15 60 15" stroke="#386D7F" strokeWidth="3" strokeLinecap="round"/></g>
      <g className="animate-feuille" style={{ animationDelay: '0.6s' }}><path d="M35 40C45 35 60 35 70 45" stroke="#386D7F" strokeWidth="3" strokeLinecap="round"/></g>
    </g>

    {/* --- PALMIER 2 : Grand Central (Le plus rapide) --- */}
    <g className="animate-palmier" style={{ animationDelay: '0s' }}>
      <path d="M60 73C58 55 60 40 65 30" stroke="#D17A61" strokeWidth="4" strokeLinecap="round"/>
      <g className="animate-feuille" style={{ animationDelay: '0.1s' }}><path d="M65 30C55 25 35 25 30 35" stroke="#386D7F" strokeWidth="3.5" strokeLinecap="round"/></g>
      <g className="animate-feuille" style={{ animationDelay: '0.3s' }}><path d="M65 30C60 20 50 5 60 0" stroke="#386D7F" strokeWidth="3.5" strokeLinecap="round"/></g>
      <g className="animate-feuille" style={{ animationDelay: '0.5s' }}><path d="M65 30C70 20 80 5 90 5" stroke="#386D7F" strokeWidth="3.5" strokeLinecap="round"/></g>
      <g className="animate-feuille" style={{ animationDelay: '0.7s' }}><path d="M65 30C75 25 95 25 100 35" stroke="#386D7F" strokeWidth="3.5" strokeLinecap="round"/></g>
    </g>

    {/* --- PALMIER 3 : Petit à Droite (Plus lent) --- */}
    <g className="animate-palmier" style={{ animationDelay: '0.4s', transform: 'scale(0.7) translate(130px, 35px)' }}>
      <path d="M40 73C38 65 40 58 45 50" stroke="#D17A61" strokeWidth="3" strokeLinecap="round"/>
      <g className="animate-feuille" style={{ animationDelay: '0.1s' }}><path d="M45 50C35 45 20 45 15 55" stroke="#386D7F" strokeWidth="2.5" strokeLinecap="round"/></g>
      <g className="animate-feuille" style={{ animationDelay: '0.3s' }}><path d="M45 50C40 40 30 25 40 20" stroke="#386D7F" strokeWidth="2.5" strokeLinecap="round"/></g>
      <g className="animate-feuille" style={{ animationDelay: '0.5s' }}><path d="M45 50C50 40 60 25 70 25" stroke="#386D7F" strokeWidth="2.5" strokeLinecap="round"/></g>
      <g className="animate-feuille" style={{ animationDelay: '0.7s' }}><path d="M45 50C55 45 70 45 80 55" stroke="#386D7F" strokeWidth="2.5" strokeLinecap="round"/></g>
    </g>
  </svg>
);

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const role = (localStorage.getItem('userRole') || 'invite').toLowerCase().trim();
  const chambresANettoyer = 3;

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const menuConfig = {
    gerant: [
      { name: 'Tableau de Bord', path: '/admin', icon: <LayoutDashboard size={20} /> },
      { name: 'Suivi Trésorerie', path: '/finance', icon: <Wallet size={20} /> },
      { name: 'Rapports PDF', path: '/rapports', icon: <FileText size={20} /> },
      { name: 'Paramètres', path: '/settings', icon: <Settings size={20} /> },
    ],
    raf: [
      { name: 'Supervision Live', path: '/DashboardRAF', icon: <LayoutDashboard size={20} /> },
      { name: 'Décharges & Paies', path: '/finance', icon: <Banknote size={20} /> },
      { name: 'Audit & Clôture', path: '/cloture-finale', icon: <ShieldCheck size={20} /> },
      { name: 'Stocks (Lecture)', path: '/stock', icon: <Package size={20} /> },
      { name: 'Rapports PDF', path: '/rapports', icon: <FileText size={20} /> },
    ],
    reception: [
      {/*--- name: 'Tableau de Bord', path: '/admin', icon: <LayoutDashboard size={20} /> ---*/}, 
      { name: 'Réception & Planning', path: '/reception', icon: <ClipboardList size={20} />, badge: chambresANettoyer },
    ],
    'caisse-bar': [
      { name: 'Caisse Bar', path: '/caisse-bar', icon: <Beer size={20} /> },
    ],
    'caisse-resto': [
      { name: 'Caisse Resto', path: '/caisse-resto', icon: <Utensils size={20} /> },
    ],
    stock: [
      { name: 'État Global', path: '/stock', icon: <Package size={20} /> },
      { name: 'Cuisine', path: '/stock-cuisine', icon: <Utensils size={20} /> },
      { name: 'Bar', path: '/stock-bar', icon: <Beer size={20} /> },
      { name: 'Hôtel', path: '/stock-hotel', icon: <Hotel size={20} /> },
    ],
  };

  const currentMenus = menuConfig[role] || [];

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-[#1a1412] to-[#0a0908] text-white flex flex-col shadow-2xl z-50 border-r border-orange-900/10">
      
      {/* BRANDING avec BOSQUET DE 3 PALMIERS ANIMÉS */}
      <div className="p-8 border-b border-orange-900/10 bg-black/20 flex flex-col items-center">
        
        {/* Intégration du Nouveau Logo Animé */}
        <div className="mb-4">
          <WaskaPalmGroveLogo />
        </div>

        <h1 className="text-2xl font-black text-white tracking-tighter italic flex items-center gap-2">
          <span className="text-[#D17A61]">WASKA</span>
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span>
        </h1>
        <p className="text-[8px] uppercase font-bold text-slate-500 tracking-[0.3em] mt-1.5">Village Jacqueville</p>
        
        <div className="flex items-center gap-3 mt-5 bg-[#386D7F]/10 p-2.5 rounded-2xl border border-[#386D7F]/20 w-full">
          <div className="bg-[#D17A61] p-2 rounded-xl shadow-lg shadow-orange-900/30">
            <UserCircle size={18} className="text-white" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[9px] uppercase font-black text-[#386D7F] tracking-[0.2em] leading-none">Session active</p>
            <p className="text-xs font-bold text-slate-200 truncate uppercase mt-1.5 italic tracking-tight">
              {role.replace('-', ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* NAVIGATION DYNAMIQUE */}
      <nav className="flex-1 p-4 mt-4 space-y-2 overflow-y-auto custom-scrollbar">
        {currentMenus.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={`${item.path}-${index}`} 
              to={item.path}
              className={`group relative flex items-center gap-3 px-4 py-4 rounded-2xl transition-all duration-300 ${
                isActive 
                ? 'bg-gradient-to-r from-[#D17A61] to-orange-600 text-white shadow-xl shadow-orange-950/40 scale-[1.02] z-10' 
                : 'hover:bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <span className={`${isActive ? 'text-white' : 'text-slate-600 group-hover:text-[#D17A61]'} transition-colors`}>
                {item.icon}
              </span>
              <span className={`font-bold text-sm italic flex-1 ${isActive ? 'tracking-normal' : 'tracking-tight opacity-80'}`}>
                {item.name}
              </span>

              {item.badge > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#386D7F] text-[10px] font-black text-white shadow-lg ring-2 ring-black/20 animate-pulse">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* FOOTER : DÉCONNEXION */}
      <div className="p-4 border-t border-orange-900/10 bg-black/30">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-red-500/5 text-red-400 border border-red-500/10 hover:bg-red-500 hover:text-white hover:border-transparent transition-all duration-500 font-black text-[10px] uppercase tracking-[0.2em] group"
        >
          <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
          Fermer Session
        </button>
      </div>
    </div>
  );
};

export default Sidebar;