import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldAlert, RefreshCw, TrendingUp, Banknote, Wallet, Home, 
  ChevronRight, CheckCircle2, Clock, X, Loader2, Package, AlertTriangle
} from 'lucide-react';
import axios from 'axios';

const AdminDashboard = () => {
  const [data, setData] = useState({
    clotures: [],
    stats: { caTotal: 0, depensesTotal: 0, soldeNet: 0, tauxOccupation: 0, chambresDispos: 0 },
    alertesStock: [],
    activites: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('tous');
  const [selectedReport, setSelectedReport] = useState(null);
  const [ecartNote, setEcartNote] = useState("");

  const API_URL = "http://localhost:5000/api";

  const getAuthConfig = () => ({
    headers: { 'Authorization': `Bearer ${localStorage.getItem('userToken')}` }
  });

  const loadLiveStatus = useCallback(async () => {
    try {
      const config = getAuthConfig();
      const [resClotures, resVentes, resDecharges, resStock, resActivities] = await Promise.all([
        axios.get(`${API_URL}/clotures`, config),
        axios.get(`${API_URL}/stats/ventes-globales`, config),
        axios.get(`${API_URL}/decharges`, config),
        axios.get(`${API_URL}/stocks/alerts`, config),
        axios.get(`${API_URL}/activities/recent`, config)
      ]);

      setData({
        clotures: resClotures.data,
        stats: {
          caTotal: resVentes.data.total || 0,
          depensesTotal: resDecharges.data?.reduce((sum, item) => sum + (item.montant || 0), 0) || 0,
          soldeNet: (resVentes.data.total || 0) - (resDecharges.data?.reduce((sum, item) => sum + (item.montant || 0), 0) || 0),
          tauxOccupation: resVentes.data.tauxOccupation || 0,
          chambresDispos: resVentes.data.chambresDispos || 0
        },
        alertesStock: resStock.data || [],
        activites: resActivities.data || []
      });
    } catch (err) {
      console.error("Erreur Sync:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLiveStatus();
  }, [loadLiveStatus]);

  // --- FONCTION DE VALIDATION CORRIGÉE ---
  const handleAuditAction = async (id, status) => {
    setRefreshing(true);
    try {
      const config = getAuthConfig();
      const response = await axios.patch(`${API_URL}/clotures/${id}/audit`, {
        audite: true,
        statusAudit: status,
        noteEcart: ecartNote || (status === 'Valide' ? "Validé sans réserve" : "Écart constaté")
      }, config);

      if (response.status === 200) {
        // MISE À JOUR LOCALE DU TABLEAU (Passage au vert immédiat)
        setData(prev => ({
          ...prev,
          clotures: prev.clotures.map(item => 
            item._id === id ? { ...item, audite: true, statusAudit: status } : item
          )
        }));
        setSelectedReport(null);
        setEcartNote("");
      }
    } catch (err) {
      alert("Erreur lors de la validation. Vérifiez la connexion au serveur.");
    } finally {
      setRefreshing(false);
    }
  };

  const filtrés = filter === 'tous' ? data.clotures : data.clotures.filter(r => r.pointDeVente === filter);

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-[#386D7F] animate-pulse uppercase tracking-widest">Initialisation RAF...</div>;

  return (
    <div className="p-4 md:p-8 bg-[#FDFBF9] min-h-screen text-slate-900">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black italic flex items-center gap-3">
            <div className="p-2 bg-[#386D7F] rounded-xl text-white"><ShieldAlert size={24}/></div>
            RAF <span className="text-[#386D7F]">SUPERVISION</span>
          </h1>
        </div>
        <button onClick={() => { setRefreshing(true); loadLiveStatus(); }} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-[#386D7F]">
          <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Recettes" value={data.stats.caTotal} color="text-slate-900" icon={<TrendingUp />} />
        <StatCard label="Dépenses" value={data.stats.depensesTotal} color="text-red-500" icon={<Banknote />} />
        <StatCard label="Net en Caisse" value={data.stats.soldeNet} color="text-emerald-600" icon={<Wallet />} />
        <div className="bg-[#386D7F] p-6 rounded-[2rem] text-white">
          <p className="text-[10px] font-black uppercase opacity-60">Occupation</p>
          <h2 className="text-2xl font-black italic">{data.stats.tauxOccupation}%</h2>
          <div className="mt-4 h-1 w-full bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white transition-all" style={{ width: `${data.stats.tauxOccupation}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-xs font-black uppercase text-slate-400">Flux de clôtures</h3>
                <select className="text-[10px] font-black border-none bg-slate-50 rounded-lg p-2" onChange={(e) => setFilter(e.target.value)}>
                  <option value="tous">Tous les points</option>
                  <option value="Réception">Hôtel</option>
                  <option value="bar">Bar</option>
                  <option value="resto">Resto</option>
                </select>
            </div>
            <table className="w-full">
              <tbody className="divide-y divide-slate-50">
                {filtrés.map((report) => (
                  <tr key={report._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-6">
                      <p className="font-black text-sm">#{report._id.slice(-5).toUpperCase()}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">{new Date(report.createdAt).toLocaleTimeString()}</p>
                    </td>
                    <td className="p-6">
                      <span className="text-[8px] font-black uppercase px-3 py-1 bg-slate-100 rounded-lg">{report.pointDeVente}</span>
                    </td>
                    <td className="p-6">
                      {report.audite ? (
                         <div className="flex items-center gap-2 text-emerald-500 font-black text-[9px] uppercase"><CheckCircle2 size={14} /> Audité</div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-500 font-black text-[9px] uppercase animate-pulse"><Clock size={14} /> En attente</div>
                      )}
                    </td>
                    <td className="p-6 text-right font-black italic">
                      {/* Utilisation de stats.declare.total comme dans ton schéma */}
                      {(report.stats?.declare?.total || 0).toLocaleString()} F
                    </td>
                    <td className="p-6 text-right">
                      <button onClick={() => setSelectedReport(report)} className="p-2 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-[#386D7F] group-hover:text-white transition-all">
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ALERTES & JOURNAL */}
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <h3 className="text-[10px] font-black uppercase text-red-400 mb-4 flex items-center justify-between">Stocks Critiques <AlertTriangle size={14}/></h3>
                {data.alertesStock.length === 0 && <p className="text-[9px] font-bold text-slate-300 uppercase">Aucune alerte</p>}
                {data.alertesStock.map((s, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-red-50 rounded-xl mb-2">
                        <span className="text-[10px] font-black text-red-600 uppercase">{s.name}</span>
                        <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">{s.quantity}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* MODALE D'AUDIT */}
      {selectedReport && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-[3rem] p-10 max-w-md w-full animate-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center mb-8">
                <div className="p-4 bg-slate-50 rounded-full text-[#386D7F] mb-4"><ShieldAlert size={32}/></div>
                <h2 className="text-2xl font-black uppercase italic">Audit Versement</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Caissier: {selectedReport.caissier}</p>
            </div>
            
            <div className="space-y-4 mb-8">
                <div className="flex justify-between p-5 bg-[#FDFBF9] rounded-2xl border border-slate-100 font-black uppercase text-[10px]">
                  <span className="text-slate-400">Montant Déclaré</span>
                  <span className="text-[#386D7F] text-lg">{(selectedReport.stats?.declare?.total || 0).toLocaleString()} F</span>
                </div>
                <textarea 
                  placeholder="Note d'audit (facultatif)..."
                  className="w-full p-5 bg-slate-50 rounded-2xl text-[11px] font-bold outline-none h-24"
                  value={ecartNote}
                  onChange={(e) => setEcartNote(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button disabled={refreshing} onClick={() => handleAuditAction(selectedReport._id, 'Ecart')} className="bg-amber-100 text-amber-600 font-black py-4 rounded-2xl uppercase text-[10px]">Signal Écart</button>
              <button disabled={refreshing} onClick={() => handleAuditAction(selectedReport._id, 'Valide')} className="bg-[#386D7F] text-white font-black py-4 rounded-2xl uppercase text-[10px] flex items-center justify-center gap-2">
                {refreshing ? <Loader2 size={16} className="animate-spin" /> : "Valider"}
              </button>
            </div>
            <button onClick={() => setSelectedReport(null)} className="w-full mt-4 text-[10px] font-black text-slate-300 uppercase">Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, color, icon }) => (
  <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm relative group overflow-hidden">
    <div className="absolute -right-2 -top-2 text-slate-50 opacity-10 transform group-hover:scale-110 transition-transform">
        {React.cloneElement(icon, { size: 80 })}
    </div>
    <p className="text-[9px] font-black text-slate-400 uppercase mb-2 italic">{label}</p>
    <h2 className={`text-2xl font-black italic ${color}`}>{value?.toLocaleString()} F</h2>
  </div>
);

export default AdminDashboard;