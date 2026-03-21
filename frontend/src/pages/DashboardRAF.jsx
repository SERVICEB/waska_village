import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldAlert, RefreshCw, TrendingUp, Banknote, Wallet, Home, 
  ChevronRight, CheckCircle2, Clock, X, Loader2, Package, AlertTriangle,
  Utensils, Coffee, Hotel
} from 'lucide-react';
import axios from 'axios';

const AdminDashboard = () => {
  const [data, setData] = useState({
    clotures: [],
    stats: { 
      caTotal: 0, 
      depensesTotal: 0, 
      soldeNet: 0, 
      tauxOccupation: 0, 
      chambresDispos: 0,
      caParPoint: [] // Nouveau : pour le suivi par caisse
    },
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

      const caTotal = resVentes.data?.total || 0;
      const depenses = resDecharges.data?.reduce((sum, item) => sum + (item.montant || 0), 0) || 0;

      setData({
        clotures: resClotures.data || [],
        stats: {
          caTotal,
          depensesTotal: depenses,
          soldeNet: caTotal - depenses,
          tauxOccupation: resVentes.data?.tauxOccupation || 0,
          chambresDispos: resVentes.data?.chambresDispos || 0,
          caParPoint: resVentes.data?.parPointDeVente || [] // Données réelles du backend
        },
        alertesStock: resStock.data || [],
        activites: resActivities.data || []
      });
    } catch (err) {
      console.error("Erreur Sync Admin:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLiveStatus();
    const interval = setInterval(loadLiveStatus, 30000); // Rafraîchissement toutes les 30s pour le "Temps Réel"
    return () => clearInterval(interval);
  }, [loadLiveStatus]);

  const handleAuditAction = async (id, status) => {
    setRefreshing(true);
    try {
      const config = getAuthConfig();
      await axios.patch(`${API_URL}/clotures/${id}/audit`, {
        statusAudit: status,
        noteEcart: ecartNote || (status === 'Valide' ? "Validé par RAF" : "Écart constaté")
      }, config);

      setData(prev => ({
        ...prev,
        clotures: prev.clotures.map(item => 
          item._id === id ? { ...item, audite: true, statusAudit: status } : item
        )
      }));
      setSelectedReport(null);
      setEcartNote("");
    } catch (err) {
      alert("Erreur serveur lors de la validation.");
    } finally {
      setRefreshing(false);
    }
  };

  const filtrés = filter === 'tous' ? data.clotures : data.clotures.filter(r => r.pointDeVente === filter);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#FDFBF9]">
      <RefreshCw size={40} className="text-[#386D7F] animate-spin mb-4" />
      <p className="font-black text-[#386D7F] uppercase tracking-[0.3em] text-xs">Connexion Hub RAF...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-[#FDFBF9] min-h-screen text-slate-900 font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter flex items-center gap-3">
            <div className="p-2 bg-[#386D7F] rounded-xl text-white shadow-lg shadow-[#386D7F]/20"><ShieldAlert size={24}/></div>
            RAF <span className="text-[#386D7F]">SUPERVISION</span>
          </h1>
          <p className="text-[10px] font-black uppercase text-slate-400 mt-1 tracking-widest">Live Control Center</p>
        </div>
        <button 
          onClick={() => { setRefreshing(true); loadLiveStatus(); }} 
          className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-[#386D7F] hover:shadow-md transition-all active:scale-95"
        >
          <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Recettes Brutes" value={data.stats.caTotal} color="text-slate-900" icon={<TrendingUp />} />
        <StatCard label="Sorties Caisse" value={data.stats.depensesTotal} color="text-red-500" icon={<Banknote />} />
        <StatCard label="Trésorerie Net" value={data.stats.soldeNet} color="text-emerald-600" icon={<Wallet />} />
        <div className="bg-[#386D7F] p-6 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl shadow-[#386D7F]/20">
          <p className="text-[10px] font-black uppercase opacity-60">Occupation Hôtel</p>
          <h2 className="text-2xl font-black italic">{data.stats.tauxOccupation}%</h2>
          <div className="mt-4 h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white transition-all duration-700" style={{ width: `${data.stats.tauxOccupation}%` }}></div>
          </div>
          <Home size={60} className="absolute -right-4 -bottom-4 opacity-10" />
        </div>
      </div>

      {/* LIVE MONITORING PAR CAISSE */}
      <div className="mb-10">
          <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-[0.2em] flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div> 
              Flux Direct par Caisse
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'Réception', label: 'Réception / Hôtel', icon: <Hotel size={18}/>, color: 'blue' },
                { id: 'resto', label: 'Restaurant', icon: <Utensils size={18}/>, color: 'orange' },
                { id: 'bar', label: 'Bar Lounge', icon: <Coffee size={18}/>, color: 'purple' }
              ].map((pvd) => {
                  const statsPvd = data.stats.caParPoint.find(p => p._id === pvd.id);
                  return (
                      <div key={pvd.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                          <div className="flex items-center gap-3">
                              <div className={`p-3 rounded-2xl bg-${pvd.color}-50 text-${pvd.color}-600`}>
                                  {pvd.icon}
                              </div>
                              <div>
                                  <p className="text-[9px] font-black uppercase text-slate-400">{pvd.label}</p>
                                  <p className="text-lg font-black italic">{(statsPvd?.total || 0).toLocaleString()} F</p>
                              </div>
                          </div>
                          <div className="text-[8px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md">EN LIGNE</div>
                      </div>
                  )
              })}
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* TABLEAU DES CLÔTURES */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest text-[10px]">Historique Récent (Audit)</h3>
                <select 
                  className="text-[10px] font-black uppercase border-none bg-white shadow-sm ring-1 ring-slate-100 rounded-lg px-3 py-2 outline-none text-[#386D7F]"
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="tous">Tous les points</option>
                  <option value="Réception">Réception / Hôtel</option>
                  <option value="bar">Bar Lounge</option>
                  <option value="resto">Restaurant</option>
                </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <tbody className="divide-y divide-slate-50">
                  {filtrés.length === 0 ? (
                    <tr><td className="p-20 text-center font-black uppercase text-slate-300 text-xs">Aucune clôture en attente</td></tr>
                  ) : filtrés.map((report) => (
                    <tr key={report._id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="p-6">
                        <p className="font-black text-sm text-slate-700">#{report._id.slice(-5).toUpperCase()}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(report.createdAt).toLocaleString()}</p>
                      </td>
                      <td className="p-6">
                        <span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full shadow-sm text-white ${
                          report.pointDeVente === 'Réception' ? 'bg-blue-600' : 
                          report.pointDeVente === 'bar' ? 'bg-purple-500' : 'bg-orange-500'
                        }`}>
                          {report.pointDeVente}
                        </span>
                      </td>
                      <td className="p-6">
                        {report.audite ? (
                            <div className="flex items-center gap-2 text-emerald-500 font-black text-[9px] uppercase"><CheckCircle2 size={14} /> Audité</div>
                        ) : (
                          <div className="flex items-center gap-2 text-amber-500 font-black text-[9px] uppercase animate-pulse"><Clock size={14} /> En attente</div>
                        )}
                      </td>
                      <td className="p-6 text-right font-black italic text-slate-800 text-sm">
                        {(report.totalVentes || report.stats?.declare?.total || 0).toLocaleString()} <span className="text-[10px] opacity-30 not-italic ml-1">F</span>
                      </td>
                      <td className="p-6 text-right">
                        <button onClick={() => setSelectedReport(report)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-[#386D7F] group-hover:text-white transition-all transform group-hover:translate-x-1">
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

        {/* SIDEBAR : ALERTES ET JOURNAL */}
        <div className="space-y-6">
            <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm border-t-4 border-t-red-500">
                <h3 className="text-[11px] font-black uppercase text-red-500 mb-6 flex items-center justify-between">
                  Stocks Critiques <AlertTriangle size={16} className="animate-bounce" />
                </h3>
                {data.alertesStock.length === 0 ? (
                  <div className="py-4 text-center opacity-20"><Package size={30} className="mx-auto" /><p className="text-[9px] font-black mt-2 uppercase">Stock OK</p></div>
                ) : data.alertesStock.map((s, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-red-50/50 rounded-2xl mb-3 border border-red-100/50">
                        <span className="text-[10px] font-black text-red-700 uppercase">{s.name}</span>
                        <span className="bg-red-600 text-white px-3 py-1 rounded-lg text-[10px] font-black shadow-sm">{s.quantity}</span>
                    </div>
                ))}
            </div>

            <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="text-[11px] font-black uppercase text-slate-400 mb-6">Journal d'activité</h3>
                <div className="space-y-4">
                  {data.activites.slice(0, 5).map((act, i) => (
                    <div key={i} className="flex gap-4 items-start border-l-2 border-slate-100 pl-4 py-1">
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-800">{act.action}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase italic">{new Date(act.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
            </div>
        </div>
      </div>

      {/* MODALE D'AUDIT RAF */}
      {selectedReport && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-[3.5rem] p-10 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setSelectedReport(null)} className="absolute top-8 right-8 text-slate-300 hover:text-red-500"><X /></button>
            
            <div className="flex flex-col items-center text-center mb-8">
                <div className="p-5 bg-slate-50 rounded-full text-[#386D7F] mb-4"><ShieldAlert size={36}/></div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800">Audit <span className="text-[#386D7F]">Versements</span></h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Caisse : {selectedReport.pointDeVente} • Caissier : {selectedReport.caissier}</p>
            </div>
            
            <div className="space-y-5 mb-8">
                <div className="flex justify-between items-center p-6 bg-[#FDFBF9] rounded-[2rem] border border-slate-100">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Net Déclaré</span>
                  <span className="text-[#386D7F] text-2xl font-black italic">
                    {(selectedReport.totalVentes || selectedReport.stats?.declare?.total || 0).toLocaleString()} F
                  </span>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Observations du RAF</label>
                  <textarea 
                    placeholder="Précisez la nature de l'écart ou validez..."
                    className="w-full p-6 bg-slate-50 rounded-[2rem] text-xs font-bold outline-none ring-2 ring-transparent focus:ring-[#386D7F]/10 h-32 transition-all"
                    value={ecartNote}
                    onChange={(e) => setEcartNote(e.target.value)}
                  />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                disabled={refreshing} 
                onClick={() => handleAuditAction(selectedReport._id, 'Ecart')} 
                className="bg-amber-100 hover:bg-amber-200 text-amber-600 font-black py-5 rounded-3xl uppercase text-[10px] tracking-widest transition-all active:scale-95 disabled:opacity-50"
              >
                Signal Écart
              </button>
              <button 
                disabled={refreshing} 
                onClick={() => handleAuditAction(selectedReport._id, 'Valide')} 
                className="bg-[#386D7F] hover:bg-[#2c5665] text-white font-black py-5 rounded-3xl uppercase text-[10px] tracking-widest shadow-lg shadow-[#386D7F]/30 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
              >
                {refreshing ? <Loader2 size={18} className="animate-spin" /> : "Valider Flux"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, color, icon }) => (
  <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm relative group overflow-hidden hover:border-[#386D7F]/20 transition-all">
    <div className="absolute -right-4 -top-4 text-slate-100 transform group-hover:scale-110 group-hover:rotate-12 transition-all">
        {React.cloneElement(icon, { size: 100 })}
    </div>
    <div className="relative z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase mb-2 italic tracking-widest">{label}</p>
        <h2 className={`text-2xl font-black italic ${color}`}>{value?.toLocaleString()} <span className="text-[10px] font-bold opacity-30 not-italic">F</span></h2>
    </div>
  </div>
);

export default AdminDashboard;