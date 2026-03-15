import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  Calendar, 
  Download, 
  ArrowUpRight, 
  Target,
  Crown,
  Waves
} from 'lucide-react';

const Rapport = () => {
  // --- DONNÉES SIMULÉES (Waska Context) ---
  const stats = {
    caTotal: 1250000,
    depenses: 450000,
    benefice: 800000,
    croissance: "+12.5%",
    ventesParEntite: [
      { name: 'Bar', value: 650000, color: 'bg-[#D17A61]' }, // Terracotta
      { name: 'Restaurant', value: 400000, color: 'bg-[#386D7F]' }, // Teal
      { name: 'Hôtel', value: 200000, color: 'bg-slate-400' }
    ],
    topProduits: [
      { name: 'Bière Flag', qty: 142, rev: 213000 },
      { name: 'Kedjenou Poulet', qty: 45, rev: 225000 },
      { name: 'Chambres VIP', qty: 3, rev: 150000 }
    ]
  };

  return (
    <div className="p-8 bg-[#FDFBF9] min-h-screen font-sans">
      
      {/* HEADER : Identité Waska */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Waves className="text-[#386D7F]" size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#386D7F]">Intelligence Business</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
            Tableau de <span className="text-[#386D7F]">Bord RAF</span>
          </h1>
          <p className="text-slate-400 font-bold text-xs mt-1">Analyse des performances • Waska Village</p>
        </div>
        
        <div className="flex gap-4">
          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm text-slate-600 font-black text-[11px] uppercase tracking-widest italic">
            <Calendar size={18} className="text-[#386D7F]" /> Février 2026
          </div>
          <button className="flex items-center gap-2 bg-[#386D7F] text-white px-7 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#2d5867] transition-all shadow-xl shadow-[#386D7F]/20 group">
            <Download size={18} className="group-hover:-translate-y-1 transition-transform" /> Exporter Rapport
          </button>
        </div>
      </div>

      {/* CARTES KPI : Terracotta & Teal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        
        {/* CA TOTAL */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-[#386D7F] group-hover:scale-110 transition-transform duration-500">
            <TrendingUp size={100} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3">Chiffre d'Affaires</p>
          <h2 className="text-5xl font-black text-slate-900 italic mb-4 tracking-tighter">
            {stats.caTotal.toLocaleString()} <span className="text-xl font-bold not-italic text-[#386D7F]">F</span>
          </h2>
          <div className="flex items-center gap-2 text-[#386D7F] font-black text-xs uppercase tracking-tighter">
            <ArrowUpRight size={18} /> {stats.croissance} <span className="text-slate-300 font-bold ml-1">vs mois précédent</span>
          </div>
        </div>

        {/* DÉPENSES */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-xl shadow-slate-200/50 group">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3">Dépenses Opérationnelles</p>
          <h2 className="text-5xl font-black text-slate-900 italic mb-4 tracking-tighter">
            {stats.depenses.toLocaleString()} <span className="text-xl font-bold not-italic text-[#D17A61]">F</span>
          </h2>
          <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">
            <Target size={16} className="text-[#D17A61]" /> Ratio de charge : 36%
          </div>
        </div>

        {/* BÉNÉFICE : Focus Terracotta */}
        <div className="bg-[#D17A61] p-8 rounded-[3rem] shadow-2xl shadow-[#D17A61]/30 text-white relative overflow-hidden">
          <div className="absolute bottom-0 right-0 p-6 opacity-20">
            <Crown size={60} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-3 opacity-80">Bénéfice Net Estimé</p>
          <h2 className="text-5xl font-black italic mb-6 tracking-tighter">
            {stats.benefice.toLocaleString()} <span className="text-xl font-bold not-italic opacity-60">F</span>
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
              <span>Performance</span>
              <span>64% de marge</span>
            </div>
            <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
              <div className="bg-white h-full w-[64%] shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* ANALYSE PAR ENTITÉ */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-50 shadow-xl shadow-slate-200/50">
          <h3 className="text-xl font-black text-slate-900 mb-10 flex items-center gap-4 uppercase italic tracking-tighter">
            <PieChart className="text-[#386D7F]" /> Répartition par Secteur
          </h3>
          <div className="space-y-8">
            {stats.ventesParEntite.map((entite, i) => (
              <div key={i} className="group">
                <div className="flex justify-between font-black text-xs uppercase tracking-widest mb-3">
                  <span className="text-slate-500">{entite.name}</span>
                  <span className="text-[#386D7F] italic">{entite.value.toLocaleString()} F</span>
                </div>
                <div className="w-full bg-[#FDFBF9] h-5 rounded-2xl border border-slate-50 overflow-hidden p-1">
                  <div 
                    className={`${entite.color} h-full rounded-xl transition-all duration-1000 ease-out shadow-sm`} 
                    style={{ width: `${(entite.value / stats.caTotal) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BEST SELLERS */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-50 shadow-xl shadow-slate-200/50">
          <h3 className="text-xl font-black text-slate-900 mb-10 flex items-center gap-4 uppercase italic tracking-tighter">
            <Target className="text-[#D17A61]" /> Top Performances (Volume)
          </h3>
          <div className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                  <th className="text-left pb-5">Produit</th>
                  <th className="text-center pb-5">Quantité</th>
                  <th className="text-right pb-5">Revenu Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.topProduits.map((prod, i) => (
                  <tr key={i} className="group hover:bg-[#FDFBF9] transition-all">
                    <td className="py-6 font-black text-slate-700 uppercase text-xs tracking-tight italic">{prod.name}</td>
                    <td className="py-6 text-center">
                      <span className="bg-[#386D7F]/10 text-[#386D7F] px-4 py-1.5 rounded-xl text-[10px] font-black uppercase">
                        {prod.qty} units
                      </span>
                    </td>
                    <td className="py-6 text-right font-black text-slate-900 text-sm">
                      {prod.rev.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold">F</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FOOTER AUDIT */}
      <div className="mt-12 flex justify-center opacity-30">
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#386D7F]">
            Waska Village • Management System • Certification RAF 2026
        </p>
      </div>
    </div>
  );
};

export default Rapport;