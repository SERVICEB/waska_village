import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Eye, FileText, X, Save, User, Banknote, Tag, Calendar, Camera, CheckCircle2, Clock } from 'lucide-react';

// --- COMPOSANT MODAL (Intégré pour éviter l'erreur d'import) ---
const AddDechargeModal = ({ isOpen, onClose, onAdd }) => {
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    type: 'Facture', beneficiaire: '', montant: '',
    date: new Date().toISOString().split('T')[0],
    statut: 'En attente', justificatif: null, fileName: ''
  });

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size < 1.5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({...formData, justificatif: reader.result, fileName: file.name});
      reader.readAsDataURL(file);
    } else if (file) { alert("Image trop lourde (Max 1.5Mo)"); }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({ ...formData, montant: parseFloat(formData.montant) || 0 });
    setFormData({ type: 'Facture', beneficiaire: '', montant: '', date: new Date().toISOString().split('T')[0], statut: 'En attente', justificatif: null, fileName: '' });
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4">
      <div className="bg-[#FDFBF9] w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20">
        <div className="bg-[#386D7F] p-6 text-white flex justify-between">
          <h2 className="text-xl font-black uppercase italic">Nouvelle Sortie</h2>
          <button onClick={onClose}><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <select className="p-3 rounded-xl border-2 border-slate-100 font-bold" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
              <option>Facture</option><option>Salaire / Prime</option><option>Achat Stock</option><option>Maintenance</option>
            </select>
            <input type="date" className="p-3 rounded-xl border-2 border-slate-100 font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          </div>
          <input required placeholder="Bénéficiaire" className="w-full p-3 rounded-xl border-2 border-slate-100 font-bold" value={formData.beneficiaire} onChange={e => setFormData({...formData, beneficiaire: e.target.value})} />
          <input required type="number" placeholder="Montant FCFA" className="w-full p-4 rounded-xl border-2 border-[#D17A61]/20 font-black text-[#D17A61] text-2xl" value={formData.montant} onChange={e => setFormData({...formData, montant: e.target.value})} />
          <div onClick={() => fileInputRef.current.click()} className="border-2 border-dashed p-4 rounded-xl text-center cursor-pointer hover:bg-slate-50">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            {formData.justificatif ? <img src={formData.justificatif} className="h-16 mx-auto rounded-lg" /> : <p className="text-[10px] font-bold text-slate-400 uppercase">Joindre un justificatif</p>}
          </div>
          <button type="submit" className="w-full bg-[#386D7F] text-white py-4 rounded-xl font-black uppercase tracking-widest">Enregistrer la dépense</button>
        </form>
      </div>
    </div>
  );
};

// --- COMPOSANT PRINCIPAL ---
const FinanceRAF = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [depenses, setDepenses] = useState(() => {
    const saved = localStorage.getItem('waska_depenses');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { localStorage.setItem('waska_depenses', JSON.stringify(depenses)); }, [depenses]);

  const handleAddDepense = (newEntry) => {
    setDepenses([{ ...newEntry, id: Date.now() }, ...depenses]);
    setIsModalOpen(false);
  };

  return (
    <div className="p-8 bg-[#FDFBF9] min-h-screen">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-black text-slate-900 italic uppercase">Finance <span className="text-[#386D7F]">&</span> RAF</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-[#386D7F] text-white px-8 py-4 rounded-2xl flex items-center gap-3 shadow-xl font-black uppercase text-xs tracking-widest">
          <Plus size={20} /> Nouvelle Sortie
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden text-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest">
            <tr><th className="p-6">Détails</th><th className="p-6">Montant</th><th className="p-6">Statut</th><th className="p-6 text-right">Action</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {depenses.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-6">
                  <div className="font-black text-slate-700 uppercase">{item.beneficiaire}</div>
                  <div className="text-[10px] text-slate-400">{item.type} • {item.date}</div>
                </td>
                <td className="p-6 font-black text-[#D17A61] italic">{item.montant.toLocaleString()} F</td>
                <td className="p-6"><span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[9px] font-black uppercase">{item.statut}</span></td>
                <td className="p-6 text-right">
                  {item.justificatif && <button onClick={() => setSelectedImage(item.justificatif)} className="p-2 text-slate-400"><Eye size={18}/></button>}
                  <button onClick={() => setDepenses(depenses.filter(d => d.id !== item.id))} className="p-2 text-red-300 hover:text-red-500"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddDechargeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddDepense} />

      {selectedImage && (
        <div className="fixed inset-0 z-[3000] bg-black/90 flex items-center justify-center p-6" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} className="max-w-full max-h-full rounded-2xl border-4 border-white/20" />
        </div>
      )}
    </div>
  );
};

export default FinanceRAF;