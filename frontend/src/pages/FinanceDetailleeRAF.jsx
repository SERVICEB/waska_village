// src/pages/FinanceDetailleeRAF.jsx
import React, { useState, useMemo } from 'react';
import { 
  Banknote, Plus, Download, Filter, Trash2, 
  Calendar, ArrowRight, Search, X 
} from 'lucide-react';

const FinanceDetailleeRAF = () => {
  // --- ÉTATS ---
  const [expenses, setExpenses] = useState([
    { id: 1, category: 'Énergie', label: 'Carburant Groupe', amount: 45000, date: '2026-02-25' },
    { id: 2, category: 'Cuisine', label: 'Recharge Gaz B12', amount: 15000, date: '2026-02-25' },
    { id: 3, category: 'Maintenance', label: 'Chlore Piscine', amount: 25000, date: '2026-02-24' },
    { id: 4, category: 'Salaires', label: 'Acompte Réception', amount: 30000, date: '2026-02-20' },
  ]);

  // États pour le filtrage par date
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // --- LOGIQUE DE FILTRAGE (Mémorisée pour la performance) ---
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const expDate = new Date(exp.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && expDate < start) return false;
      if (end && expDate > end) return false;
      return true;
    });
  }, [expenses, startDate, endDate]);

  const totalFiltered = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="p-8 bg-[#FDFBF9] min-h-screen font-sans text-slate-800">
      
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-3">
            <div className="p-2 bg-[#386D7F] rounded-xl text-white shadow-lg shadow-[#386D7F]/20">
              <Banknote size={24} />
            </div>
            Décharges <span className="text-[#386D7F]">Financières</span>
          </h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mt-1 italic italic">
            Validation RAF • <span className="text-[#D17A61]">Waska Village</span>
          </p>
        </div>
        
        <button className="bg-[#D17A61] text-white px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl hover:scale-105 transition-all">
          <Plus size={20} /> Enregistrer
        </button>
      </div>

      {/* 2. BARRE DE FILTRES AVANCÉE (Nouveau) */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm mb-8 flex flex-col lg:flex-row items-center gap-6">
        <div className="flex items-center gap-3 text-[#386D7F]">
          <Calendar size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest">Période d'Audit</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 flex-1">
          {/* Date de début */}
          <div className="relative group flex-1 min-w-[180px]">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-[#FDFBF9] border-2 border-slate-50 p-3 rounded-2xl outline-none focus:border-[#386D7F]/30 transition-all font-bold text-xs text-slate-600 uppercase"
            />
            <span className="absolute -top-2 left-4 bg-white px-2 text-[8px] font-black text-slate-400 uppercase tracking-tighter">Depuis le</span>
          </div>

          <ArrowRight size={16} className="text-slate-300 hidden md:block" />

          {/* Date de fin */}
          <div className="relative group flex-1 min-w-[180px]">
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-[#FDFBF9] border-2 border-slate-50 p-3 rounded-2xl outline-none focus:border-[#386D7F]/30 transition-all font-bold text-xs text-slate-600 uppercase"
            />
            <span className="absolute -top-2 left-4 bg-white px-2 text-[8px] font-black text-slate-400 uppercase tracking-tighter">Jusqu'au</span>
          </div>

          {/* Bouton de réinitialisation rapide */}
          {(startDate || endDate) && (
            <button 
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
              title="Réinitialiser les dates"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Indicateur de résultats */}
        <div className="lg:border-l lg:pl-8 flex flex-col items-end">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Résultats trouvés</p>
            <p className="text-xl font-black text-[#386D7F] italic">{filteredExpenses.length} <span className="text-[10px] not-italic">lignes</span></p>
        </div>
      </div>

      {/* 3. TABLEAU DES DÉPENSES */}
      <div className="bg-white rounded-[3rem] shadow-xl shadow-[#386D7F]/5 border border-slate-100 overflow-hidden">
        
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-[#FDFBF9]/50">
          <h3 className="font-black text-slate-900 uppercase text-[11px] tracking-widest flex items-center gap-3">
            <Filter size={16} className="text-[#386D7F]" /> 
            Flux Financier Filtré
          </h3>
          <button className="text-[#386D7F] text-[10px] font-black uppercase flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm hover:bg-[#386D7F] hover:text-white transition-all">
            <Download size={14} /> Exporter Excel
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#FDFBF9] text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-10 py-6">Date</th>
                <th className="px-10 py-6">Catégorie</th>
                <th className="px-10 py-6">Libellé</th>
                <th className="px-10 py-6 text-right">Montant (FCFA)</th>
                <th className="px-10 py-6 text-right w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 italic font-bold">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-[#FDFBF9] transition-colors group">
                  <td className="px-10 py-5 text-[11px] font-black text-slate-400 uppercase tracking-tighter not-italic">{exp.date}</td>
                  <td className="px-10 py-5">
                    <span className="bg-[#386D7F]/5 text-[#386D7F] px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-[#386D7F]/10">
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-10 py-5 text-sm font-black text-slate-700 uppercase tracking-tight">{exp.label}</td>
                  <td className="px-10 py-5 text-right font-black text-[#D17A61] text-lg tracking-tighter">
                    -{exp.amount.toLocaleString()}
                  </td>
                  <td className="px-10 py-5 text-right">
                    <button className="p-2 text-slate-200 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-20 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest italic">
                    Aucune décharge trouvée pour cette période
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 4. FOOTER RÉCAPITULATIF (Dynamique) */}
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
            {/* Effet visuel de fond */}
            <div className="absolute top-0 right-0 w-32 h-full bg-[#D17A61] skew-x-[-20deg] translate-x-16 opacity-20"></div>
            
            <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 italic mb-1">Total décaissements période</p>
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#D17A61] animate-pulse"></div>
                    <span className="text-[9px] font-bold uppercase text-slate-400">Période sélectionnée active</span>
                </div>
            </div>
            <p className="text-3xl font-black italic text-[#D17A61] relative z-10">
                -{totalFiltered.toLocaleString()} <span className="text-sm not-italic opacity-50 font-normal">FCFA</span>
            </p>
        </div>
      </div>

      <div className="mt-8 text-center opacity-30">
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#386D7F]">
            Audit Financier WASKA • 2026
        </p>
      </div>
    </div>
  );
};

export default FinanceDetailleeRAF;