import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  Lock, Printer, Banknote, CreditCard, 
  ChevronRight, CheckCircle, Loader2, AlertTriangle 
} from 'lucide-react';

// --- SUPPORT DE POINT CAISSIER (FORMAT TICKET 80mm) ---
const TicketPointCaissier = React.forwardRef(({ data, type }, ref) => {
  if (!data) return null;
  const totalSession = data.enEspeces + data.enMobileMoney;

  return (
    <div ref={ref} className="print-only p-4 w-[80mm] bg-white text-black font-mono text-[11px] leading-tight">
      <div className="text-center border-b-2 border-black pb-2 mb-4">
        <h2 className="text-lg font-black uppercase">WASKA VILLAGE</h2>
        <p className="font-bold uppercase text-[9px]">Point de Clôture - {type}</p>
        <p className="text-[8px]">{new Date().toLocaleString()}</p>
      </div>

      <div className="mb-4">
        <p className="font-black border-b border-black mb-1 uppercase text-[9px]">DÉTAIL DES VENTES</p>
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-dotted border-black">
              <th className="text-left">Désignation</th>
              <th className="text-right">Montant</th>
            </tr>
          </thead>
          <tbody>
            {data.ventesParProduit.map((item, i) => (
              <tr key={i}>
                <td className="py-1 uppercase">{item.nom || item.name}</td>
                <td className="text-right">{(item.total || 0).toLocaleString()} F</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 border-t-2 border-black pt-2">
        <div className="flex justify-between">
          <span className="font-bold">TOTAL ESPÈCES :</span>
          <span className="font-black">{data.enEspeces.toLocaleString()} F</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">TOTAL MOBILE :</span>
          <span className="font-black">{data.enMobileMoney.toLocaleString()} F</span>
        </div>
        <div className="flex justify-between text-[13px] font-black border-t border-black pt-1 mt-2">
          <span>TOTAL SESSION :</span>
          <span>{totalSession.toLocaleString()} F</span>
        </div>
      </div>

      <div className="mt-10">
        <div className="flex justify-between mb-8 text-[9px]">
          <div className="text-center border-t border-black w-24 pt-1">Visa Caissier</div>
          <div className="text-center border-t border-black w-24 pt-1">Visa Contrôle</div>
        </div>
        <p className="text-center text-[7px] italic font-bold uppercase tracking-widest opacity-50">Document de pointage - Archive Interne</p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media screen { .print-only { display: none; } }
        @media print { 
          body * { visibility: hidden; }
          .print-only, .print-only * { visibility: visible; }
          .print-only { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}} />
    </div>
  );
});

const Cloture = ({ type = "resto" }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const printRef = useRef();

  // Données de session (À l'avenir, ces données viendront d'un appel API GET /api/sales/stats)
  const sessionStats = {
    enEspeces: 125500,
    enMobileMoney: 45000,
    ventesParProduit: [
      { nom: "Bière Beaufort (66cl)", total: 45000 },
      { nom: "Bouteille Gin Lord's", total: 60000 },
      { nom: "Soda Coke (Can)", total: 15000 },
      { nom: "Pizza Royale", total: 50500 }
    ]
  };

  const totalFinal = sessionStats.enEspeces + sessionStats.enMobileMoney;

  // --- LOGIQUE DE CLÔTURE VIA API ---
  const handleFinalizeCloture = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token'); // Récupération du token pour le 401
      
      const payload = {
        type: type,
        caissier: "Session Actuelle",
        montantEspeces: sessionStats.enEspeces,
        montantMobile: sessionStats.enMobileMoney,
        totalVentes: totalFinal,
        details: sessionStats.ventesParProduit,
        dateCloture: new Date()
      };

      // Appel au backend
      await axios.post('http://localhost:5000/api/clotures', payload, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setStep(2);
    } catch (err) {
      console.error("Erreur API Clôture:", err);
      const msg = err.response?.status === 401 
        ? "Session expirée. Reconnectez-vous." 
        : "Erreur serveur lors de la clôture.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-[#FDFBF9] min-h-screen flex items-center justify-center font-sans">
      {/* TICKET MASQUÉ (UNIQUEMENT POUR IMPRESSION) */}
      <TicketPointCaissier ref={printRef} data={sessionStats} type={type} />

      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-[#386D7F]/10">
        
        {/* HEADER */}
        <div className={`p-8 text-white flex justify-between items-center transition-colors duration-500 ${step === 2 ? 'bg-[#386D7F]' : 'bg-slate-900'}`}>
          <div>
            <h1 className="text-xl font-black uppercase italic tracking-tighter">Point de Session</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">{type} • Waska Village</p>
          </div>
          <div className="bg-white/10 p-3 rounded-xl"><Lock size={24} /></div>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Récapitulatif financier</h2>
              
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-[10px] font-bold flex items-center gap-2 border border-red-100">
                  <AlertTriangle size={14} /> {error}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Banknote className="text-[#386D7F]" size={20} />
                    <span className="text-sm font-bold text-slate-600">Total Espèces</span>
                  </div>
                  <span className="font-black text-slate-800">{sessionStats.enEspeces.toLocaleString()} F</span>
                </div>

                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <CreditCard className="text-[#D17A61]" size={20} />
                    <span className="text-sm font-bold text-slate-600">Total Mobile</span>
                  </div>
                  <span className="font-black text-slate-800">{sessionStats.enMobileMoney.toLocaleString()} F</span>
                </div>

                <div className="flex justify-between items-center p-5 bg-[#386D7F]/5 rounded-2xl border-2 border-dashed border-[#386D7F]/20">
                  <span className="text-sm font-black text-[#386D7F] uppercase italic">Total de la Session</span>
                  <span className="text-xl font-black text-[#386D7F]">{totalFinal.toLocaleString()} F</span>
                </div>
              </div>

              <button 
                disabled={loading}
                onClick={handleFinalizeCloture} 
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest flex justify-center items-center gap-2 hover:bg-[#386D7F] transition-all disabled:opacity-50 active:scale-95"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>Confirmer & Clôturer la Caisse <ChevronRight size={18} /></>
                )}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="text-center space-y-6 animate-in zoom-in duration-500">
              <div className="mx-auto bg-green-50 text-green-600 w-20 h-20 rounded-full flex items-center justify-center shadow-inner">
                <CheckCircle size={40} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase italic">Session Archivée</h3>
                <p className="text-slate-500 text-xs mt-1">Le rapport de clôture a été transmis au serveur.</p>
              </div>

              <button 
                onClick={() => window.print()}
                className="w-full bg-[#386D7F] text-white py-5 rounded-2xl font-black uppercase tracking-widest flex justify-center items-center gap-3 shadow-lg shadow-[#386D7F]/20 hover:bg-[#2d5a69] transition-all"
              >
                <Printer size={20} /> Imprimer le Support (80mm)
              </button>
              
              <button 
                onClick={() => window.location.reload()} 
                className="text-xs font-black text-slate-400 uppercase hover:text-slate-800 transition-colors pt-4"
              >
                Démarrer une nouvelle session
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cloture;