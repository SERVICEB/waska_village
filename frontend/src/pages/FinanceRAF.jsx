import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { 
  Plus, Trash2, Eye, X, User, Banknote, 
  Calendar, Receipt, Loader2, AlertCircle, Printer // Ajout de Printer
} from 'lucide-react';

// --- CONFIGURATION API ---
const API_URL = "http://localhost:5000/api";

const getAuthConfig = () => {
  const token = localStorage.getItem('userToken');
  return {
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

// --- COMPOSANT MODAL : AJOUT DE DÉCHARGE ---
const AddDechargeModal = ({ isOpen, onClose, onRefresh }) => {
  const fileInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Facture',
    beneficiaire: '',
    montant: '',
    date: new Date().toISOString().split('T')[0],
    statut: 'Payé',
    justificatif: null,
    fileName: ''
  });

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image trop lourde (Max 2Mo)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ 
        ...formData, 
        justificatif: reader.result, 
        fileName: file.name 
      });
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = { ...formData, montant: Number(formData.montant) };
      await axios.post(`${API_URL}/decharges`, payload, getAuthConfig());
      setFormData({ type: 'Facture', beneficiaire: '', montant: '', date: new Date().toISOString().split('T')[0], statut: 'Payé', justificatif: null, fileName: '' });
      onRefresh();
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Erreur lors de l'enregistrement";
      alert(`⚠️ Échec : ${errorMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4">
      <div className="bg-[#FDFBF9] w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20">
        <div className="bg-[#386D7F] p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-black uppercase italic tracking-tight">Nouvelle Sortie Cash</h2>
          <button onClick={onClose} className="hover:rotate-90 transition-transform"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Type</label>
              <select className="w-full p-3 rounded-xl border-2 border-slate-100 font-bold outline-none" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option>Facture</option>
                <option>Salaire / Prime</option>
                <option>Achat Stock</option>
                <option>Maintenance</option>
                <option>Divers</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Date</label>
              <input type="date" className="w-full p-3 rounded-xl border-2 border-slate-100 font-bold outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Bénéficiaire / Motif</label>
            <input required className="w-full p-3 rounded-xl border-2 border-slate-100 font-bold outline-none" value={formData.beneficiaire} onChange={e => setFormData({...formData, beneficiaire: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Montant</label>
            <div className="relative">
              <input required type="number" className="w-full p-4 rounded-xl border-2 border-[#D17A61]/20 font-black text-[#D17A61] text-3xl outline-none" value={formData.montant} onChange={e => setFormData({...formData, montant: e.target.value})} />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300">FCFA</span>
            </div>
          </div>
          <div onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-slate-200 p-6 rounded-xl text-center cursor-pointer hover:bg-slate-50 transition-colors">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            {formData.justificatif ? <span className="text-emerald-600 font-bold">Justificatif joint</span> : <p className="text-[10px] font-black text-slate-400 uppercase">Prendre photo reçu</p>}
          </div>
          <button type="submit" disabled={submitting} className="w-full bg-[#386D7F] text-white py-4 rounded-2xl font-black uppercase shadow-lg disabled:opacity-50">
            {submitting ? "Validation..." : "Valider le décaissement"}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- COMPOSANT PRINCIPAL ---
const FinanceRAF = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [depenses, setDepenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDepenses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/decharges`, getAuthConfig());
      setDepenses(res.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDepenses(); }, [fetchDepenses]);

  const handleDelete = async (id) => {
    if (!window.confirm("🗑️ Supprimer cette dépense ?")) return;
    try { await axios.delete(`${API_URL}/decharges/${id}`, getAuthConfig()); fetchDepenses(); } catch (err) { alert("Erreur suppression"); }
  };

  const totalGlobal = depenses.reduce((acc, curr) => acc + (Number(curr.montant) || 0), 0);

  // --- FONCTION D'IMPRESSION ---
  const handlePrintWeekEnd = () => {
    const printContents = document.getElementById('printable-table').innerHTML;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif; color: #333;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #386D7F; margin: 0; font-size: 28px;">WASKA VILLAGE</h1>
          <p style="text-transform: uppercase; font-weight: bold; font-size: 12px; letter-spacing: 2px;">Rapport de Caisse - Récapitulatif Hebdomadaire</p>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px;">
          <span>Date du rapport : ${new Date().toLocaleDateString('fr-FR')}</span>
          <span>Responsable : RAF Waska</span>
        </div>
        <style>
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f8fafc; text-align: left; padding: 12px; border: 1px solid #e2e8f0; font-size: 10px; text-transform: uppercase; }
          td { padding: 12px; border: 1px solid #e2e8f0; font-size: 11px; }
          .no-print { display: none !important; }
        </style>
        ${printContents}
        <div style="margin-top: 30px; text-align: right; font-size: 18px;">
          <p><strong>TOTAL GÉNÉRAL : ${totalGlobal.toLocaleString()} FCFA</strong></p>
        </div>
        <div style="margin-top: 50px; display: flex; justify-content: space-between;">
          <div style="border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 5px;">Signature RAF</div>
          <div style="border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 5px;">Signature Gérance</div>
        </div>
      </div>
    `;

    window.print();
    window.location.reload(); // Restaure l'état de React
  };

  return (
    <div className="p-4 md:p-10 bg-[#FDFBF9] min-h-screen font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase italic flex items-center gap-3">
            <div className="p-2 bg-[#D17A61] rounded-xl text-white shadow-lg"><Banknote size={28}/></div>
            Finance <span className="text-[#386D7F]">Hub</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2 border-l-2 border-[#D17A61] pl-3">
            Contrôle des Sorties de Caisse • Waska Village
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handlePrintWeekEnd}
            className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-4 rounded-2xl flex items-center gap-3 shadow-xl transition-all font-black uppercase text-xs tracking-widest"
          >
            <Printer size={20} /> Imprimer Rapport
          </button>
          
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase">Cumul Sorties</p>
            <p className="text-xl font-black text-[#D17A61]">{totalGlobal.toLocaleString()} <span className="text-xs">F</span></p>
          </div>
          
          <button onClick={() => setIsModalOpen(true)} className="bg-[#386D7F] hover:bg-[#2c5665] text-white px-6 py-4 rounded-2xl flex items-center gap-3 shadow-xl transition-all font-black uppercase text-xs tracking-widest">
            <Plus size={20} /> Décaissement
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4"><Loader2 className="animate-spin text-[#386D7F]" size={40} /></div>
        ) : (
          <div id="printable-table" className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-50">
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400">Bénéficiaire & Date</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400">Montant</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400">Statut</th>
                  <th className="p-6 text-right text-[10px] font-black uppercase text-slate-400 no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {depenses.map(item => (
                  <tr key={item._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6">
                      <p className="font-black text-slate-700 uppercase text-sm">{item.beneficiaire}</p>
                      <span className="text-[9px] font-bold text-slate-400">{new Date(item.date).toLocaleDateString('fr-FR')} - {item.type}</span>
                    </td>
                    <td className="p-6 font-black text-[#D17A61] text-lg">
                      {item.montant?.toLocaleString()} F
                    </td>
                    <td className="p-6"><span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase">Payé</span></td>
                    <td className="p-6 text-right no-print">
                      <div className="flex justify-end gap-2">
                        {item.justificatif && <button onClick={() => setSelectedImage(item.justificatif)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#386D7F] hover:text-white"><Eye size={18}/></button>}
                        <button onClick={() => handleDelete(item._id)} className="p-2.5 bg-red-50 text-red-300 rounded-xl hover:bg-red-500 hover:text-white"><Trash2 size={18}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddDechargeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onRefresh={fetchDepenses} />
      {selectedImage && (
        <div className="fixed inset-0 z-[3000] bg-slate-900/95 flex flex-col items-center justify-center p-6" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-[80vh]">
            <img src={selectedImage} className="w-full h-full object-contain rounded-2xl" alt="Justificatif" />
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceRAF;