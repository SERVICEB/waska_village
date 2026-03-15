import React from 'react';
import { 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  FileBarChart, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight,
  BellRing
} from 'lucide-react';

const ClotureGeneraleRAF = () => {
  const checkList = [
    { label: "Clôture Caisse Bar/Resto", status: true, user: "Caisse-Central", time: "18:45" },
    { label: "Inventaire de Stock Sortie", status: true, user: "Magasinier", time: "17:30" },
    { label: "Rapport Occupation Réception", status: false, user: "Réception", time: "En attente" }, 
  ];

  return (
    <div className="p-8 bg-[#FDFBF9] min-h-screen text-slate-800 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER RAF CORRIGÉ */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h2 className="text-4xl font-black italic mb-2 tracking-tighter uppercase">
              Clôture <span className="text-[#386D7F]">Financière</span>
            </h2>
            <p className="text-slate-400 uppercase text-[10px] font-black tracking-[0.4em]">
              Validation Finale RAF • <span className="text-[#D17A61]">Waska Village</span>
            </p>
          </div>
          <div className="bg-[#386D7F]/10 border border-[#386D7F]/20 px-6 py-3 rounded-2xl flex items-center gap-3">
            <ShieldCheck className="text-[#386D7F]" size={24} />
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase text-[#386D7F] tracking-widest leading-none">
                  Espace Auditeur
              </span>
              <span className="text-[9px] font-bold opacity-70 uppercase tracking-tighter">Certifié WASKA</span>
            </div>
          </div>
        </div>

        {/* CHECKLIST DE CONTRÔLE */}
        <div className="grid grid-cols-1 gap-4 mb-12">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 italic">
            Statut des Opérations Journalières
          </h3>
          {checkList.map((item, i) => (
            <div 
              key={i} 
              className={`bg-white border-2 p-6 rounded-[2.5rem] flex justify-between items-center transition-all shadow-sm ${
                item.status ? 'border-slate-50' : 'border-[#D17A61]/20 bg-[#D17A61]/5'
              }`}
            >
              <div className="flex items-center gap-6">
                <div className={`p-4 rounded-full ${
                  item.status ? 'bg-green-50 text-green-500' : 'bg-[#D17A61]/10 text-[#D17A61] animate-pulse'
                }`}>
                  {item.status ? <CheckCircle size={28} /> : <BellRing size={28} />}
                </div>
                <div>
                  <p className="font-black text-xl tracking-tight text-slate-800 uppercase italic">
                    {item.label}
                  </p>
                  <div className="flex gap-4 mt-1 text-[9px] text-slate-400 uppercase tracking-widest font-black">
                    <p>Agent : <span className="text-slate-600">{item.user}</span></p>
                    <p className="font-mono">Heure : {item.time}</p>
                  </div>
                </div>
              </div>
              {!item.status ? (
                <button className="bg-[#D17A61] text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#D17A61]/20 hover:scale-105 transition-transform active:scale-95">
                  Relancer l'agent
                </button>
              ) : (
                <span className="text-[10px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-4 py-2 rounded-xl">
                  Prêt
                </span>
              )}
            </div>
          ))}
        </div>

        {/* RÉSUMÉ CONSOLIDÉ */}
        <div className="bg-slate-900 text-white rounded-[4rem] p-12 shadow-[0_35px_60px_-15px_rgba(56,109,127,0.3)] relative overflow-hidden">
          {/* Décoration de fond */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#386D7F] opacity-10 rounded-full blur-3xl"></div>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-8 relative z-10">
            <div>
              <p className="text-[11px] font-black text-[#D17A61] uppercase tracking-[0.4em] mb-2">
                Résultat Net Journalier
              </p>
              <h3 className="text-7xl font-black italic tracking-tighter">
                + 315,500 <span className="text-2xl not-italic text-[#386D7F]">FCFA</span>
              </h3>
            </div>
            <button className="flex items-center gap-3 bg-white text-[#386D7F] px-8 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl hover:bg-[#D17A61] hover:text-white transition-all group active:scale-95">
              <Download size={22} className="group-hover:-translate-y-1 transition-transform" /> 
              Générer Rapport Certifié (PDF)
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-white/10 pt-10 relative z-10">
            <div className="space-y-3 p-6 border-b md:border-b-0 md:border-r border-white/10">
              <div className="flex items-center gap-2 text-green-400">
                <ArrowUpRight size={18} />
                <p className="text-[10px] font-black uppercase tracking-widest">Entrées (Total Ventes)</p>
              </div>
              <p className="text-4xl font-black italic">
                650,000 <span className="text-sm opacity-50 font-normal">F</span>
              </p>
            </div>
            
            <div className="space-y-3 p-6 md:pl-12 text-right md:text-left">
              <div className="flex items-center gap-2 text-[#D17A61] md:justify-start justify-end">
                <ArrowDownRight size={18} />
                <p className="text-[10px] font-black uppercase tracking-widest">Sorties (Charges & Dépenses)</p>
              </div>
              <p className="text-4xl font-black italic">
                334,500 <span className="text-sm opacity-50 font-normal">F</span>
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER AUDIT CORRIGÉ */}
        <div className="mt-12 text-center">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">
                Certifié conforme aux règles de gestion de Waska Village • 2026
            </p>
        </div>
      </div>
    </div>
  );
};

export default ClotureGeneraleRAF;