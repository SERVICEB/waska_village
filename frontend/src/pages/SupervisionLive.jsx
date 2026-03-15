import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, CreditCard, Bed, Utensils, AlertTriangle } from 'lucide-react';

const SupervisionLive = () => {
  // Simulation de données en temps réel
  const [logs, setLogs] = useState([
    { id: 1, time: '14:20', user: 'Réception', action: 'Check-in Chambre 104', amount: '45.000 FCFA', type: 'hotel' },
    { id: 2, time: '14:15', user: 'Bar', action: 'Commande Table 4', amount: '12.500 FCFA', type: 'bar' },
    { id: 3, time: '14:10', user: 'Resto', action: 'Note payée par CB', amount: '28.000 FCFA', type: 'resto' },
  ]);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
            <Activity className="text-red-500 animate-pulse" />
            Supervision Live RAF
          </h1>
          <p className="text-slate-500 text-sm italic">Flux d'activités en temps réel de Waska Village</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 text-xs font-bold text-slate-400">
           {new Date().toLocaleDateString()} • LIVE
        </div>
      </div>

      {/* --- STATS RAPIDES --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Ventes Jour" value="85.500 FCFA" icon={<CreditCard size={20}/>} color="bg-emerald-500" />
        <StatCard title="Occupation" value="65%" icon={<Bed size={20}/>} color="bg-blue-500" />
        <StatCard title="Alertes Stock" value="3" icon={<AlertTriangle size={20}/>} color="bg-orange-500" />
      </div>

      {/* --- FLUX D'ACTIVITÉS --- */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50">
          <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-400">Dernières opérations</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {logs.map((log) => (
            <div key={log.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${getTypeColor(log.type)} text-white`}>
                  {getIcon(log.type)}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{log.action}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{log.user} • {log.time}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-slate-900">{log.amount}</p>
                <p className="text-[10px] text-emerald-500 font-black uppercase">Validé</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Composants internes utilitaires
const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4">
    <div className={`${color} p-4 rounded-2xl text-white`}>{icon}</div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
      <p className="text-xl font-black text-slate-800">{value}</p>
    </div>
  </div>
);

const getIcon = (type) => {
  if (type === 'hotel') return <Bed size={18} />;
  if (type === 'bar') return <Utensils size={18} />;
  return <CreditCard size={18} />;
};

const getTypeColor = (type) => {
  if (type === 'hotel') return 'bg-blue-500';
  if (type === 'bar') return 'bg-orange-500';
  return 'bg-emerald-500';
};

export default SupervisionLive;