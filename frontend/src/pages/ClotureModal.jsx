import React, { useState } from 'react';
import { X, Wallet, Smartphone, Landmark, AlertTriangle, CheckCircle2, Printer } from 'lucide-react';

const ClotureModal = ({ soldeTheorique, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    cash: 0,
    mobile: 0,
    notes: ''
  });

  const safeTheorique = Number(soldeTheorique) || 0;
  const totalDeclare = Number(formData.cash) + Number(formData.mobile);
  const ecart = totalDeclare - safeTheorique;

  // ==========================================
  // FONCTION D'IMPRESSION DU RAPPORT DE CLÔTURE
  // ==========================================
  const handlePrintZReport = () => {
    const printWindow = window.open('', '_blank', 'width=600,height=600');
    const date = new Date().toLocaleString('fr-FR');

    printWindow.document.write(`
      <html>
        <head>
          <title>Waska Village - Rapport Z</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { font-family: 'Courier New', monospace; width: 75mm; padding: 3mm; font-size: 11px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-bottom: 1px dashed black; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 4px 0; }
            .header { font-size: 14px; margin-bottom: 5px; }
          </style>
        </head>
        <body>
          <div class="center bold header">WASKA VILLAGE</div>
          <div class="center">RAPPORT DE CLÔTURE (Z)</div>
          <div class="center">${date}</div>
          <div class="line"></div>
          <div class="row"><span>Caissier:</span> <span class="bold">${localStorage.getItem('userName') || 'Réception'}</span></div>
          <div class="line"></div>
          <div class="row"><span>SOLDE ATTENDU:</span> <span class="bold">${safeTheorique.toLocaleString()} F</span></div>
          <div class="row"><span>TOTAL DÉCLARÉ:</span> <span class="bold">${totalDeclare.toLocaleString()} F</span></div>
          <div class="row"><span>- Espèces:</span> <span>${Number(formData.cash).toLocaleString()} F</span></div>
          <div class="row"><span>- Mobile:</span> <span>${Number(formData.mobile).toLocaleString()} F</span></div>
          <div class="line"></div>
          <div class="row bold" style="font-size: 13px;">
            <span>ÉCART FINAL:</span>
            <span>${ecart.toLocaleString()} F</span>
          </div>
          <div class="line"></div>
          <div style="margin-top: 10px;">
            <span class="bold">Notes:</span><br/>
            ${formData.notes || 'Aucune note.'}
          </div>
          <div class="center" style="margin-top: 20px;">--- Fin de Session ---</div>
          <script>window.onload = () => { window.print(); window.close(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('userToken');
      
      // On aplatit le payload pour correspondre aux attentes du Backend
      const payload = {
        type: 'reception', // Point de vente
        montantEspeces: Number(formData.cash), // Le backend attend 'montantEspeces'
        montantMobile: Number(formData.mobile), // Le backend attend 'montantMobile'
        totalVentes: Number(totalDeclare),      // Le backend attend 'totalVentes'
        notes: formData.notes || "Clôture normale"
      };

      console.log("🚀 Envoi de la clôture :", payload);

      const response = await fetch('http://localhost:5000/api/clotures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        handlePrintZReport();
        setStep(3);
        // On attend un peu pour que l'utilisateur voit le succès
        setTimeout(() => {
          onSuccess(); 
        }, 2500);
      } else {
        // Affiche l'erreur précise venant du backend (ex: validation Mongoose)
        alert(`Erreur validation: ${result.message || result.details || "Vérifiez les données"}`);
      }
    } catch (err) {
      console.error("Erreur Fetch:", err);
      alert("Impossible de contacter le serveur. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 w-full">
      <div className="bg-[#0F4C3A] p-6 text-white">
        <h2 className="text-lg font-black uppercase flex items-center gap-2">
          <Landmark size={20} className="text-[#C5A059]"/> Arrêté de Caisse
        </h2>
      </div>

      <div className="p-8">
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Attendu en caisse</p>
              <p className="text-2xl font-black text-slate-800">{safeTheorique.toLocaleString()} F</p>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-100 rounded-2xl p-4 border border-transparent focus-within:border-[#C5A059] transition-all">
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Espèces Physique</label>
                <div className="flex items-center gap-2">
                    <Wallet size={16} className="text-slate-400"/>
                    <input 
                      type="number" 
                      className="bg-transparent w-full outline-none font-black text-lg"
                      placeholder="0"
                      onChange={(e) => setFormData({...formData, cash: e.target.value})}
                    />
                </div>
              </div>

              <div className="bg-slate-100 rounded-2xl p-4 border border-transparent focus-within:border-[#C5A059] transition-all">
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Mobile Money</label>
                <div className="flex items-center gap-2">
                    <Smartphone size={16} className="text-slate-400"/>
                    <input 
                      type="number" 
                      className="bg-transparent w-full outline-none font-black text-lg"
                      placeholder="0"
                      onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                    />
                </div>
              </div>
            </div>

            <button 
              onClick={() => setStep(2)}
              className="w-full py-4 bg-[#2D3436] text-white rounded-2xl font-black uppercase text-[11px] shadow-lg hover:bg-black transition-all"
            >
              Vérifier l'écart
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className={`p-6 rounded-3xl ${ecart === 0 ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
               <div className="flex justify-between font-bold text-xs uppercase text-slate-500 mb-1"><span>Déclaré :</span><span>{totalDeclare.toLocaleString()} F</span></div>
               <div className={`flex justify-between text-xl font-black pt-3 border-t border-dashed mt-2 ${ecart === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                 <span>{ecart >= 0 ? 'SURPLUS :' : 'MANQUANT :'}</span>
                 <span>{ecart.toLocaleString()} F</span>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Justification / Notes</label>
                <textarea 
                  placeholder={ecart !== 0 ? "Expliquez l'écart ici..." : "Notes de fin de session..."}
                  className="w-full p-4 bg-slate-50 border rounded-2xl text-xs font-bold outline-none focus:bg-white transition-all"
                  rows="3"
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 py-4 font-black uppercase text-[10px] text-slate-400">Retour</button>
              <button 
                onClick={handleSubmit} 
                disabled={loading}
                className="flex-[2] py-4 bg-[#0F4C3A] text-white rounded-2xl font-black uppercase text-[10px] shadow-xl hover:shadow-[#0f4c3a61] transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Archivage...' : (
                    <><Printer size={14}/> Valider & Imprimer Z</>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="py-12 text-center space-y-4">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={40} className="text-emerald-600" />
            </div>
            <h3 className="text-xl font-black text-[#0F4C3A] uppercase tracking-tighter">Session Clôturée</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase italic px-8 leading-relaxed">
              Toutes les transactions ont été archivées. La caisse est maintenant à 0 F.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClotureModal;