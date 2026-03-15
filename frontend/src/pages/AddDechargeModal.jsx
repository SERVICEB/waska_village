import React, { useState, useRef } from 'react';
import { 
  X, Save, User, Banknote, Tag, Calendar, 
  Camera, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';

const AddDechargeModal = ({ isOpen, onClose, onAdd }) => {
  const fileInputRef = useRef(null);
  
  const initialFormState = {
    type: 'Facture',
    beneficiaire: '',
    montant: '',
    date: new Date().toISOString().split('T')[0],
    statut: 'En attente',
    justificatif: null,
    fileName: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  if (!isOpen) return null;

  // --- LOGIQUE DE FICHIER ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        alert("⚠️ Photo trop lourde ! Max 1.5 Mo pour garantir la sauvegarde.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ 
          ...prev, 
          justificatif: reader.result, 
          fileName: file.name 
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- SOUMISSION ---
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.montant || !formData.beneficiaire) {
        alert("Veuillez remplir le bénéficiaire et le montant.");
        return;
    }

    onAdd({ 
      ...formData, 
      montant: parseFloat(formData.montant) 
    });

    setFormData(initialFormState);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-[#FDFBF9] w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95">
        
        {/* HEADER */}
        <div className="bg-[#386D7F] p-6 text-white flex justify-between items-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-xl font-black uppercase italic tracking-tighter">Nouvelle Sortie</h2>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-70 italic">Registre Financier • Waska</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all relative z-10">
            <X size={20} />
          </button>
          {/* Motif de fond subtil */}
          <div className="absolute right-[-10%] top-[-20%] text-white/5 rotate-12 scale-150">
             <Banknote size={120} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          
          {/* STATUT RAPIDE */}
          <div className="flex justify-center gap-3 p-1 bg-slate-100 rounded-2xl">
            {['En attente', 'Payé'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFormData({...formData, statut: s})}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  formData.statut === s 
                  ? (s === 'Payé' ? 'bg-emerald-500 text-white shadow-md' : 'bg-amber-500 text-white shadow-md')
                  : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {s === 'Payé' ? <CheckCircle2 size={14}/> : <Clock size={14}/>} {s}
              </button>
            ))}
          </div>

          {/* GRID: TYPE & DATE */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Type</label>
              <select 
                className="w-full bg-white border-2 border-slate-100 p-3 rounded-xl outline-none focus:border-[#386D7F] font-bold text-slate-700 text-sm shadow-sm transition-all"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option>Facture</option>
                <option>Salaire / Prime</option>
                <option>Achat Stock</option>
                <option>Maintenance</option>
                <option>Divers</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Date</label>
              <input 
                type="date" 
                className="w-full bg-white border-2 border-slate-100 p-3 rounded-xl outline-none focus:border-[#386D7F] font-bold text-slate-700 text-sm shadow-sm uppercase transition-all"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
          </div>

          {/* BÉNÉFICIAIRE */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Bénéficiaire</label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input 
                required
                type="text" 
                placeholder="Ex: Nom du fournisseur ou employé"
                className="w-full bg-white border-2 border-slate-100 p-3 pl-12 rounded-xl outline-none focus:border-[#386D7F] font-bold text-slate-800 italic shadow-sm transition-all"
                value={formData.beneficiaire}
                onChange={(e) => setFormData({...formData, beneficiaire: e.target.value})}
              />
            </div>
          </div>

          {/* MONTANT */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-[#D17A61] tracking-widest ml-1">Montant (FCFA)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#D17A61]">F</span>
              <input 
                required
                type="number" 
                placeholder="0"
                className="w-full bg-white border-2 border-[#D17A61]/20 p-4 pl-10 rounded-xl outline-none focus:border-[#D17A61] font-black text-2xl text-[#D17A61] italic tracking-tighter shadow-inner transition-all"
                value={formData.montant}
                onChange={(e) => setFormData({...formData, montant: e.target.value})}
              />
            </div>
          </div>

          {/* JUSTIFICATIF */}
          <div className="space-y-1.5">
            <div 
              onClick={() => fileInputRef.current.click()}
              className={`border-2 border-dashed rounded-[1.5rem] p-5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group ${
                formData.justificatif ? 'border-[#386D7F] bg-[#386D7F]/5' : 'border-slate-200 hover:border-[#386D7F]/40 hover:bg-slate-50'
              }`}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              
              {formData.justificatif ? (
                <div className="flex flex-col items-center">
                  <img src={formData.justificatif} alt="Preview" className="w-20 h-20 object-cover rounded-xl shadow-lg border-2 border-white" />
                  <p className="text-[8px] font-black text-[#386D7F] mt-2 uppercase italic max-w-[200px] truncate">{formData.fileName}</p>
                </div>
              ) : (
                <>
                  <Camera size={20} className="text-[#386D7F] group-hover:scale-110 transition-transform" />
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Prendre une photo du reçu</p>
                </>
              )}
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex gap-4 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-xl transition-all"
            >
              Annuler
            </button>
            <button 
              type="submit"
              className="flex-[2] bg-[#386D7F] text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-[#386D7F]/20 hover:bg-[#2d5867] transition-all flex items-center justify-center gap-3"
            >
              Enregistrer <Save size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDechargeModal;