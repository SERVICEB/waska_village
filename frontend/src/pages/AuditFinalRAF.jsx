// src/pages/AuditFinalRAF.jsx
import React from 'react';
import { ShieldCheck, FileText, Download, CheckCircle2, AlertTriangle } from 'lucide-react';

const AuditFinalRAF = () => {
  const reports = [
    { entite: "Caisse Bar/Resto", status: "Clôturé", amount: "245,000 F", alert: false },
    { entite: "Réception/Hôtel", status: "Clôturé", amount: "120,000 F", alert: false },
    { entite: "Mouvements Stock", status: "Vérifié", amount: "-14,500 F", alert: true }, // Alerte stock bas
  ];

  return (
    <div className="p-8 bg-[#F8F9FA] min-h-screen text-[#2D3436]">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER AUX COULEURS WASKA */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase text-[#0F4C3A]">
              Bilan <span className="text-[#C5A059]">Journalier</span>
            </h1>
            <p className="text-[#C5A059] font-bold uppercase text-[10px] tracking-[0.3em]">Waska Village • Dashboard de Validation RAF</p>
          </div>
          <button className="bg-[#0F4C3A] hover:bg-black text-white px-10 py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl transition-all flex items-center gap-3">
            <Download size={20} /> Télécharger le Rapport PDF
          </button>
        </div>

        {/* CARTES DE RÉSUMÉ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {reports.map((r, i) => (
            <div key={i} className="bg-white border border-slate-200 p-8 rounded-[2.5rem] relative overflow-hidden group shadow-sm">
              <div className="absolute top-0 right-0 p-4">
                {r.alert ? <AlertTriangle className="text-orange-500" /> : <CheckCircle2 className="text-[#0F4C3A]" />}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{r.entite}</p>
              <h3 className="text-2xl font-black mb-4 text-[#0F4C3A]">{r.amount}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-tighter">Statut: {r.status}</p>
              {/* Petite barre décorative dorée */}
              <div className="absolute bottom-0 left-0 h-1 bg-[#C5A059] w-0 group-hover:w-full transition-all duration-500"></div>
            </div>
          ))}
        </div>

        {/* RÉCAPITULATIF COMPTABLE FINAL */}
        <div className="bg-white text-slate-900 rounded-[3rem] p-12 shadow-2xl border border-slate-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-xs">
            <div>
              <h4 className="font-black uppercase text-xs text-[#C5A059] tracking-widest mb-6 italic">Flux de Trésorerie Final</h4>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-slate-100 pb-2 font-bold italic">
                  <span className="text-slate-500 uppercase text-[10px]">Recettes Totales (Caisse + Hôtel)</span>
                  <span className="text-[#0F4C3A] font-black text-sm">+ 365,000 F</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2 font-bold italic">
                  <span className="text-slate-500 uppercase text-[10px]">Total Décharges (Dépenses/Salaires)</span>
                  <span className="text-red-600 font-black text-sm">- 115,000 F</span>
                </div>
                <div className="flex justify-between pt-6">
                  <span className="text-xl font-black text-[#0F4C3A] uppercase tracking-tighter">SOLDE NET DU JOUR</span>
                  <span className="text-3xl font-black text-[#C5A059] underline decoration-[#0F4C3A] decoration-4 underline-offset-8">250,000 F</span>
                </div>
              </div>
            </div>
            
            <div className="bg-[#F8F9FA] p-8 rounded-[2rem] border-2 border-dashed border-[#C5A059]/30 flex flex-col items-center justify-center text-center">
              <ShieldCheck size={48} className="text-[#0F4C3A] mb-4" />
              <p className="text-[11px] font-bold text-slate-600 italic leading-relaxed">
                "En qualité de Responsable Administratif et Financier, je certifie la conformité des fonds de caisse et des mouvements de stocks pour la journée d'exploitation du {new Date().toLocaleDateString()}."
              </p>
              <button className="mt-8 bg-[#C5A059] hover:bg-[#B38F4D] text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-transform active:scale-95">
                Apposer Signature & Sceller
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.5em]">Authentifié par Waska System v2.0</p>
        </div>
      </div>
    </div>
  );
};

export default AuditFinalRAF;