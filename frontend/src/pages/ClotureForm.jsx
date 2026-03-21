import React, { useState } from 'react';
import { Banknote, CheckCircle2, Loader2, AlertTriangle, TrendingUp } from 'lucide-react';
import axios from 'axios';

const ClotureForm = ({ soldeTheorique = 0, type = 'Réception', onSuccess }) => {
  const [montantReel, setMontantReel] = useState('');
  const [loading, setLoading]         = useState(false);

  const montant  = Number(montantReel) || 0;
  const ecart    = montant - soldeTheorique;
  const hasEcart = montantReel !== '' && Math.abs(ecart) > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('userToken');

      // Le backend createCloture attend :
      // pointDeVente (string), totalVentes, cash, mobile, notes
      // NE PAS envoyer "type" comme pointDeVente — ça crée un conflit avec le champ type de Mongoose
      const payload = {
        pointDeVente: type,        // 'Réception' | 'bar' | 'resto'
        totalVentes:  montant,
        cash:         montant,     // tout en espèces par défaut
        mobile:       0,
        notes:        ecart !== 0
          ? `Écart de ${ecart > 0 ? '+' : ''}${ecart.toLocaleString('fr-FR')} F constaté`
          : 'RAS'
      };

      const res = await axios.post(
        'http://localhost:5000/api/clotures',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Le backend retourne { success: true, data: cloture, archived: N }
      if (!res.data?.success) {
        const msg = res.data?.message || 'Clôture échouée côté serveur';
        alert(`Erreur : ${msg}`);
        return;
      }

      // Délai court pour laisser MongoDB propager l'archivage
      await new Promise(r => setTimeout(r, 400));
      onSuccess(); // → fetchData() → solde revient à 0

    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message;
      console.error('[ClotureForm] Erreur:', serverMsg);
      alert(`Erreur lors de la clôture : ${serverMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-2xl">

      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-[#0F4C3A]/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <Banknote className="text-[#0F4C3A]" size={28} />
        </div>
        <h2 className="text-xl font-black uppercase tracking-tighter">Clôturer la Caisse</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          Point de vente : {type}
        </p>
      </div>

      {/* Solde théorique */}
      <div className="bg-[#0F4C3A]/5 p-5 rounded-2xl mb-4 border-2 border-dashed border-[#0F4C3A]/20">
        <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Solde Théorique (Logiciel)</p>
        <p className="text-2xl font-black text-[#0F4C3A] italic">
          {soldeTheorique.toLocaleString('fr-FR')}{' '}
          <span className="text-sm font-bold not-italic opacity-60">F</span>
        </p>
      </div>

      {/* Écart en temps réel */}
      {hasEcart && (
        <div className={`p-4 rounded-2xl mb-4 flex items-center gap-3 ${
          ecart > 0
            ? 'bg-emerald-50 border border-emerald-100'
            : 'bg-red-50 border border-red-100'
        }`}>
          {ecart > 0
            ? <TrendingUp size={16} className="text-emerald-600 shrink-0" />
            : <AlertTriangle size={16} className="text-red-500 shrink-0" />
          }
          <div>
            <p className="text-[9px] font-black uppercase text-slate-500">Écart détecté</p>
            <p className={`text-sm font-black ${ecart > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {ecart > 0 ? '+' : ''}{ecart.toLocaleString('fr-FR')} F
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[9px] font-black uppercase text-slate-400 ml-2 mb-1.5 block">
            Montant physique compté (F)
          </label>
          <input
            required
            type="number"
            min="0"
            placeholder="0"
            className="w-full p-5 bg-slate-100 rounded-2xl text-2xl font-black outline-none focus:ring-2 focus:ring-[#0F4C3A]/20 transition-all"
            value={montantReel}
            onChange={e => setMontantReel(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !montantReel}
          className="w-full py-5 bg-[#0F4C3A] hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-[#0F4C3A]/20"
        >
          {loading
            ? <><Loader2 size={18} className="animate-spin" /> Clôture en cours...</>
            : <><CheckCircle2 size={18} /> Valider la clôture</>
          }
        </button>
      </form>
    </div>
  );
};

export default ClotureForm;