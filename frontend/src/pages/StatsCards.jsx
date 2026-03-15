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
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Erreur stats:", error);
      }
    };
    fetchStats();
    // Optionnel: rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const cards = [
    { 
      label: "Chiffre d'Affaires", 
      value: `${stats.caTotal?.toLocaleString()} F`, 
      icon: <TrendingUp className="text-emerald-600" />, 
      bg: "bg-emerald-50" 
    },
    { 
      label: "Solde Net Caisse", 
      value: `${stats.soldeNet?.toLocaleString()} F`, 
      icon: <Wallet className="text-blue-600" />, 
      bg: "bg-blue-50" 
    },
    { 
      label: "Occupation", 
      value: `${stats.tauxOccupation}%`, 
      icon: <DoorOpen className="text-amber-600" />, 
      bg: "bg-amber-50" 
    },
    { 
      label: "Chambres Libres", 
      value: stats.chambresDispos, 
      icon: <AlertCircle className="text-slate-600" />, 
      bg: "bg-slate-50" 
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {cards.map((card, i) => (
        <div key={i} className={`${card.bg} p-5 rounded-2xl border border-white shadow-sm transition-transform hover:scale-[1.02]`}>
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              {card.icon}
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{card.label}</p>
          <p className="text-xl font-black text-slate-800">{card.value}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;