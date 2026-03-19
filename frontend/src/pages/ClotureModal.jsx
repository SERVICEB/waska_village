import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldAlert, RefreshCw, TrendingUp, Banknote, Wallet, Home, 
  ChevronRight, CheckCircle2, Clock, X, Loader2, Package, AlertTriangle,
  Info, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import axios from 'axios';

const AdminDashboard = () => {
  // --- ÉTATS ---
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

  // --- CONFIG AUTH ---
  const getAuthConfig = () => ({
    headers: { 'Authorization': `Bearer ${localStorage.getItem('userToken')}` }
  });

  // --- CHARGEMENT DES DONNÉES (SYNCHRO LIVE) ---
  const loadLiveStatus = useCallback(async () => {
    try {
      const config = getAuthConfig();
      
      // On appelle les endpoints (Assure-toi que /clotures pointe vers getCloturesLive au backend)
      const [resClotures, resVentes, resDecharges, resStock, resActivities] = await Promise.all([
        axios.get(`${API_URL}/clotures`, config),
        axios.get(`${API_URL}/stats/ventes-globales`, config),
        axios.get(`${API_URL}/decharges`, config),
        axios.get(`${API_URL}/stocks/alerts`, config),
        axios.get(`${API_URL}/activities/recent`, config)
      ]);

      // Calcul des stats locales
      const caTotal = resVentes.data?.total || 0;
      const depensesTotal = Array.isArray(resDecharges.data) 
        ? resDecharges.data.reduce((sum, item) => sum + (item.montant || 0), 0) 
        : 0;

      setData({
        clotures: resClotures.data || [],
        stats: {
          caTotal,
          depensesTotal,
          soldeNet: caTotal - depensesTotal,
          tauxOccupation: resVentes.data?.tauxOccupation || 0,
          chambresDispos: resVentes.data?.chambresDispos || 0
        },
        alertesStock: resStock.data || [],
        activites: resActivities.data || []
      });
    } catch (err) {
      console.error("Erreur Sync Live:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLiveStatus();
    const timer = setInterval(loadLiveStatus, 60000); // Auto-refresh chaque minute
    return () => clearInterval(timer);
  }, [loadLiveStatus]);

  // --- ACTION D'AUDIT (VALIDATION) ---
  const handleAuditAction = async (id, status) => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      const config = getAuthConfig();
      
      // On envoie les noms de champs exacts du Schema
      const payload = { 
        statusAudit: status, // 'Valide' ou 'Ecart'
        noteEcart: ecartNote || (status === 'Valide' ? "Validé par RAF" : "Écart signalé")
      };

      const response = await axios.patch(`${API_URL}/clotures/${id}/audit`, payload, config);

      if (response.status === 200) {
        // MISE À JOUR LOCALE IMMÉDIATE (Pour le passage au VERT)
        setData(prev => ({
          ...prev,
          clotures: prev.clotures.map(c => 
            c._id === id ? { ...c, audite: true, statusAudit: status } : c
          )
        }));
        
        setSelectedReport(null);
        setEcartNote("");
        // On relance un fetch discret pour synchroniser les stats
        loadLiveStatus();
      }
    } catch (err) {
      console.error("Erreur Audit:", err.response?.data || err.message);
      alert(`Erreur : ${err.response?.data?.message || "Impossible de valider"}`);
    } finally {
      setRefreshing(false);
    }
  };

  // Filtrage par point de vente
  const filtrés = filter === 'tous' ? data.clotures : data.clotures.filter(r => r.pointDeVente === filter);

  if (loading) return <LoadingScreen />;

  return (
    <div className="p-4 md:p-8 bg-[#FDFBF9] min-h-screen font-sans text-slate-900">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic flex items-center gap-3">
            <div className="p-2 bg-[#386D7F] rounded-xl text-white shadow-lg"><ShieldAlert size={24}/></div>
            RAF <span className="text-[#386D7F]">Control Hub</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1 italic">
            Supervision Live • {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button 
          onClick={() => { setRefreshing(true); loadLiveStatus(); }} 
          className={`p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all ${refreshing ? 'opacity-50' : 'hover:shadow-md'}`}
        >
          <RefreshCw size={20} className={`text-[#386D7F] ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Recettes Brutes" value={data.stats.caTotal} color="text-slate-900" icon={<TrendingUp />} />
        <StatCard label="Décaissements" value={data.stats.depensesTotal} color="text-[#D17A61]" icon={<Banknote />} />
        <StatCard label="Trésorerie Nette" value={data.stats.soldeNet} color="text-emerald-600" icon={<Wallet />} />
        <div className="bg-[#386D7F] p-6 rounded-[2rem] text-white relative overflow-hidden shadow-lg shadow-[#386D7F]/20">
            <p className="text-[9px] font-black uppercase mb-1 opacity-60">Occupation Hôtel</p>
            <h2 className="text-2xl font-black italic">{data.stats.tauxOccupation}%</h2>
            <div className="mt-4 h-1 w-full bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white transition-all duration-1000" style={{ width: `${data.stats.tauxOccupation}%` }}></div>
            </div>
            <Home size={40} className="absolute -bottom-2 -right-2 opacity-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LISTE DES CLÔTURES */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Flux Live (48h)</h3>
                <select className="text-[10px] font-black uppercase outline-none text-[#386D7F] bg-white px-3 py-1 rounded-lg border border-slate-200" onChange={(e) => setFilter(e.target.value)}>
                  <option value="tous">Tous les points</option>
                  <option value="bar">Bar Lounge</option>
                  <option value="resto">Restaurant</option>
                  <option value="Réception">Réception / Hôtel</option>
                </select>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                <tbody className="divide-y divide-slate-50">
                    {filtrés.length === 0 ? (
                    <tr><td className="p-10 text-center text-slate-300 font-bold uppercase text-[10px]">Aucune clôture récente à auditer</td></tr>
                    ) : filtrés.map((report) => (
                    <tr key={report._id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-6">
                            <p className="font-black text-sm text-slate-700">#{report._id.slice(-5).toUpperCase()}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">{new Date(report.createdAt).toLocaleTimeString()}</p>
                        </td>
                        <td className="p-6">
                            <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-lg ${
                            report.pointDeVente === 'bar' ? 'bg-purple-50 text-purple-600' : 
                            report.pointDeVente === 'resto' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                            {report.pointDeVente}
                            </span>
                        </td>
                        <td className="p-6">
                            {report.audite ? (
                            <div className="flex items-center gap-2 text-emerald-500 font-black text-[9px] uppercase">
                                <CheckCircle2 size={14} /> Audité
                            </div>
                            ) : (
                            <div className="flex items-center gap-2 text-amber-500 font-black text-[9px] uppercase animate-pulse">
                                <Clock size={14} /> En attente
                            </div>
                            )}
                        </td>
                        <td className="p-6 text-right font-black text-slate-900 italic">
                            {(report.stats?.declare?.total || report.totalVentes || 0).toLocaleString()} <span className="text-[10px] opacity-30">F</span>
                        </td>
                        <td className="p-6 text-right">
                            <button onClick={() => setSelectedReport(report)} className="p-2 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-[#386D7F] group-hover:text-white transition-all transform group-hover:translate-x-1">
                            <ChevronRight size={18} />
                            </button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          </div>
        </div>

        {/* ALERTES STOCKS & JOURNAL */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#D17A61] mb-6 flex items-center justify-between">
              Alertes Stocks <AlertTriangle size={16} className="animate-bounce" />
            </h3>
            <div className="space-y-3">
              {data.alertesStock.length > 0 ? data.alertesStock.slice(0, 4).map((s, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-red-50/50 rounded-2xl border border-red-100">
                  <span className="text-[10px] font-black uppercase text-red-600">{s.name}</span>
                  <span className="bg-red-600 text-white px-3 py-1 rounded-lg text-[10px] font-black">{s.quantity}</span>
                </div>
              )) : (
                <div className="flex flex-col items-center py-4 opacity-20">
                    <Package size={30} />
                    <p className="text-[9px] font-black uppercase mt-2">Stocks OK</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Journal d'Audit</h3>
            <div className="space-y-4">
              {data.activites.slice(0, 4).map((act, i) => (
                <div key={i} className="flex gap-3 items-start border-l-2 border-slate-50 pl-4">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-800">{act.action}</p>
                    <p className="text-[8px] font-bold text-slate-400">{new Date(act.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODALE D'AUDIT */}
      {selectedReport && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl p-10 max-w-md w-full relative animate-in zoom-in duration-300">
            <button onClick={() => setSelectedReport(null)} className="absolute top-8 right-8 text-slate-300 hover:text-red-500 transition-colors">
              <X />
            </button>
            <div className="flex flex-col items-center text-center mb-8">
                <div className="p-4 bg-slate-50 rounded-full text-[#386D7F] mb-4"><ShieldAlert size={32}/></div>
                <h2 className="text-2xl font-black uppercase italic">Audit <span className="text-[#386D7F]">Caisse</span></h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Point : {selectedReport.pointDeVente}</p>
            </div>
            
            <div className="space-y-4 mb-8">
                <div className="flex justify-between text-xs font-black uppercase p-5 bg-[#FDFBF9] rounded-2xl border border-slate-100">
                  <span className="text-slate-400">Déclaré</span>
                  <span className="text-[#386D7F] text-lg">{(selectedReport.stats?.declare?.total || 0).toLocaleString()} F</span>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Observation RAF</label>
                  <textarea 
                    placeholder="Ajouter une note si besoin..."
                    className="w-full p-5 bg-slate-50 border-none rounded-2xl text-[11px] font-bold outline-none focus:ring-2 ring-[#386D7F]/10 min-h-[100px]"
                    value={ecartNote}
                    onChange={(e) => setEcartNote(e.target.value)}
                  />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                disabled={refreshing}
                onClick={() => handleAuditAction(selectedReport._id, 'Ecart')} 
                className="bg-amber-100 hover:bg-amber-200 text-amber-600 font-black py-5 rounded-2xl uppercase text-[10px] transition-all disabled:opacity-50"
              >
                Signaler Écart
              </button>
              <button 
                disabled={refreshing}
                onClick={() => handleAuditAction(selectedReport._id, 'Valide')} 
                className="bg-[#386D7F] hover:bg-[#2c5665] text-white font-black py-5 rounded-2xl uppercase text-[10px] shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {refreshing ? <Loader2 className="animate-spin" size={16} /> : "Valider"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- SOUS-COMPOSANTS ---
const StatCard = ({ label, value, color, icon }) => (
  <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-[#386D7F]/20 transition-all">
    <div className="absolute -top-2 -right-2 p-6 text-slate-50 transform group-hover:scale-110 group-hover:rotate-12 transition-all">
      {React.cloneElement(icon, { size: 60 })}
    </div>
    <div className="relative z-10">
        <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest italic">{label}</p>
        <h2 className={`text-2xl font-black italic ${color}`}>
          {value?.toLocaleString()} <span className="text-[10px] opacity-30 not-italic ml-1 font-bold">F</span>
        </h2>
    </div>
  </div>
);

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#FDFBF9]">
    <div className="flex flex-col items-center gap-6">
      <RefreshCw size={48} className="animate-spin text-[#386D7F]" />
      <span className="font-black uppercase text-[11px] tracking-[0.3em] text-[#386D7F]">Synchro RAF Control...</span>
    </div>
  </div>
);

export default AdminDashboard;