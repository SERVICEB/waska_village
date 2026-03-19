// Fichier : ClotureForm.jsx
import React, { useState } from 'react';
import { Banknote, CheckCircle2, Loader2 } from 'lucide-react';
import axios from 'axios';

const ClotureForm = ({ soldeTheorique, type, onSuccess }) => {
  const [montantReel, setMontantReel] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('userToken');
      await axios.post('http://localhost:5000/api/clotures', {
        pointDeVente: type,
        totalVentes: Number(montantReel),
        ecart: Number(montantReel) - soldeTheorique
      }, { headers: { Authorization: `Bearer ${token}` } });
      onSuccess();
    } catch (err) { alert("Erreur de clôture"); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-2xl">
      <div className="text-center mb-6">
        <Banknote className="mx-auto text-[#0F4C3A] mb-2" size={40} />
        <h2 className="text-xl font-black uppercase">Clôturer la Caisse</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase">Caisse : {type}</p>
      </div>

      <div className="bg-slate-50 p-4 rounded-2xl mb-6 border-dashed border-2 border-slate-200">
        <span className="text-[10px] font-black uppercase text-slate-400">Attendu (Logiciel)</span>
        <p className="text-xl font-black text-[#0F4C3A]">{soldeTheorique.toLocaleString()} F</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          required type="number" placeholder="Montant physique réel..."
          className="w-full p-5 bg-slate-100 rounded-2xl text-xl font-black outline-none"
          value={montantReel} onChange={(e) => setMontantReel(e.target.value)}
        />
        <button type="submit" disabled={loading} className="w-full py-5 bg-[#0F4C3A] text-white rounded-2xl font-black uppercase flex items-center justify-center gap-2">
          {loading ? <Loader2 className="animate-spin"/> : <CheckCircle2 size={18}/>}
          Valider la clôture
        </button>
      </form>
    </div>
  );
};

export default ClotureForm;