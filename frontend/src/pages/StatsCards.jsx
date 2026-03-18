import React, { useState, useEffect } from 'react';
import { TrendingUp, Wallet, DoorOpen, AlertCircle } from 'lucide-react';

const StatsCards = () => {
  const [stats, setStats] = useState({
    caTotal: 0,
    depensesTotal: 0,
    soldeNet: 0,
    tauxOccupation: 0,
    chambresDispos: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/stats/dashboard', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('userToken')}` }
        });
        
        if (res.ok) {
          const result = await res.json();
          
          // Sécurité : Si le backend renvoie { data: { ... } } au lieu de { ... }
          const data = result.data || result;
          
          setStats({
            caTotal: data.caTotal ?? 0,
            depensesTotal: data.depensesTotal ?? 0,
            soldeNet: data.soldeNet ?? 0,
            tauxOccupation: data.tauxOccupation ?? 0,
            chambresDispos: data.chambresDispos ?? 0
          });
        }
      } catch (error) {
        console.error("Erreur récupération stats:", error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // On prépare les étiquettes avec des fallback au cas où
  const cards = [
    { 
      label: "Chiffre d'Affaires", 
      value: `${(stats.caTotal || 0).toLocaleString()} F`, 
      icon: <TrendingUp className="text-emerald-600" size={20} />, 
      bg: "bg-emerald-50",
      textColor: "text-emerald-700"
    },
    { 
      label: "Solde Net Caisse", 
      value: `${(stats.soldeNet || 0).toLocaleString()} F`, 
      icon: <Wallet className="text-blue-600" size={20} />, 
      bg: "bg-blue-50",
      textColor: "text-blue-700"
    },
    { 
      label: "Taux d'Occupation", 
      value: `${Math.round(stats.tauxOccupation || 0)}%`, 
      icon: <DoorOpen className="text-amber-600" size={20} />, 
      bg: "bg-amber-50",
      textColor: "text-amber-700"
    },
    { 
      label: "Chambres Libres", 
      value: stats.chambresDispos ?? 0, 
      icon: <AlertCircle className="text-slate-600" size={20} />, 
      bg: "bg-slate-50",
      textColor: "text-slate-700"
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {cards.map((card, i) => (
        <div key={i} className={`${card.bg} p-5 rounded-3xl border border-white shadow-sm transition-all hover:shadow-md`}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              {card.icon}
            </div>
          </div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
          <p className={`text-xl font-black ${card.textColor}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;