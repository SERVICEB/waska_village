import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Download, 
  CheckCircle2, 
  Coins, 
  Scale, 
  ArrowUpRight, 
  FileText,
  Lock
} from 'lucide-react';

const ClotureFinale = () => {
  const [isSigned, setIsSigned] = useState(false);

  // Simulation des données consolidées
  const dataAudit = {
    barResto: 450000,
    reception: 220000,
    depenses: 197000,
    benefice: 473000
  };

  return (
    <div className="p-8 bg-[#FDFBF9] min-h-screen font-sans">
      {/* HEADER D'AUDIT */}
      <div className="mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#386D7F]/10 pb-8">
        <div className="text-center lg:text-left">
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic">
            Audit & <span className="text-[#386D7F]">Clôture</span>
          </h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">
            Validation finale de la journée • <span className="text-[#D17A61]">WASKA VILLAGE</span>
          </p>
        </div>
        
        <div className="flex items-center justify-center gap-2 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100">
          <div className={`w-3 h-3 rounded-full animate-pulse ${isSigned ? 'bg-green-500' : 'bg-[#D17A61]'}`}></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
            {isSigned ? 'Journée Archivée' : 'Session Ouverte'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          {/* CARTE RECETTES CONSOLIDÉES */}
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 text-[#386D7F]">
                <Scale size={120} />
            </div>
            
            <h3 className="text-[11px] font-black text-slate-400 uppercase mb-8 flex items-center gap-2 tracking-widest">
                <Coins size={18} className="text-[#386D7F]"/> Flux de revenus consolidés
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="bg-[#FDFBF9] p-8 rounded-[2rem] border border-[#386D7F]/5 group hover:border-[#386D7F]/20 transition-all">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Caisse Bar & Resto</p>
                    <ArrowUpRight size={14} className="text-green-500" />
                </div>
                <p className="text-3xl font-black text-slate-800 italic">{dataAudit.barResto.toLocaleString()} <span className="text-sm font-normal not-italic ml-1">F</span></p>
              </div>

              <div className="bg-[#FDFBF9] p-8 rounded-[2rem] border border-[#386D7F]/5 group hover:border-[#386D7F]/20 transition-all">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Réception Hôtel</p>
                    <ArrowUpRight size={14} className="text-green-500" />
                </div>
                <p className="text-3xl font-black text-slate-800 italic">{dataAudit.reception.toLocaleString()} <span className="text-sm font-normal not-italic ml-1">F</span></p>
              </div>
            </div>

            {/* BARRE DE PERFORMANCE */}
            <div className="mt-8 p-6 bg-slate-900 rounded-[2rem] flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                    <div className="bg-[#386D7F] p-3 rounded-xl"><FileText size={20}/></div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">Total Dépenses Service</p>
                        <p className="font-bold">-{dataAudit.depenses.toLocaleString()} F</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Ratio Performance</p>
                    <p className="text-[#D17A61] font-black text-xl">74%</p>
                </div>
            </div>
          </div>
        </div>

        {/* PANNEAU DE VALIDATION FINALE */}
        <div className={`p-10 rounded-[3.5rem] text-white shadow-2xl flex flex-col justify-between transition-all duration-700 ${isSigned ? 'bg-[#386D7F]' : 'bg-slate-900'}`}>
          <div className="text-center space-y-4">
            <div className="bg-white/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto backdrop-blur-md mb-6">
                {isSigned ? <CheckCircle2 size={40} className="text-white" /> : <Lock size={40} className="text-[#D17A61]" />}
            </div>
            <div>
                <p className="text-[11px] font-black text-[#D17A61] uppercase tracking-[0.3em] mb-1">Bénéfice Net Global</p>
                <h2 className="text-5xl font-black italic tracking-tighter">{dataAudit.benefice.toLocaleString()} F</h2>
                <p className="text-slate-400 text-[10px] mt-4 leading-relaxed italic">
                    {isSigned 
                        ? "Cette journée est désormais verrouillée et certifiée. Les rapports ont été transmis à la direction générale."
                        : "Veuillez certifier l'exactitude des comptes avant de clôturer définitivement la journée."}
                </p>
            </div>
          </div>
          
          <div className="space-y-4 mt-12">
            {!isSigned ? (
                <button 
                onClick={() => setIsSigned(true)}
                className="w-full bg-[#D17A61] py-6 rounded-3xl font-black uppercase text-xs tracking-[0.2em] hover:bg-[#b96952] transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3 group"
                >
                <ShieldCheck size={18} className="group-hover:scale-110 transition-transform"/> Signer la journée
                </button>
            ) : (
                <>
                <button className="w-full bg-white text-slate-900 py-6 rounded-3xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-xl">
                    <Download size={20} /> Télécharger Rapport PDF
                </button>
                <p className="text-center text-[9px] font-black text-white/40 uppercase tracking-widest italic">Archivé le {new Date().toLocaleDateString()}</p>
                </>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER AUDIT */}
      <div className="mt-8 flex justify-center lg:justify-start">
         <div className="flex gap-8 opacity-30 italic font-black text-slate-400 text-[10px] uppercase">
            <span>Audit No: #WV-2024-001</span>
            <span>Système: WASKA v3.0</span>
         </div>
      </div>
    </div>
  );
};

export default ClotureFinale;