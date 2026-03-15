import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Package, AlertCircle, Eye, 
  History, BarChart3, Receipt, Wallet, ArrowRightCircle,
  CheckCircle2, XCircle, Download, Calendar, Clock, ChevronRight
} from 'lucide-react';

const AdminDashboard = () => {
  // --- ÉTAT ---
  const [cloturesRecues, setCloturesRecues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('tous');
  const [selectedReport, setSelectedReport] = useState(null);
  const [error, setError] = useState(null);

  // --- CHARGEMENT DES DONNÉES DEPUIS L'API ---
  const fetchRapports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      
      const response = await fetch('http://localhost:5000/api/clotures', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Erreur lors de la récupération des rapports');
      
      const data = await response.json();
      setCloturesRecues(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRapports();
  }, []);

  // --- ACTION : VALIDER UN AUDIT EN BDD ---
  const handleValidateReport = async (id) => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`http://localhost:5000/api/clotures/${id}/audit`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ audite: true })
      });

      if (response.ok) {
        // Rafraîchir la liste après validation
        fetchRapports();
        setSelectedReport(null);
      }
    } catch (err) {
      alert("Erreur lors de la validation : " + err.message);
    }
  };

  // --- CALCULS ---
  const filtrés = filter === 'tous' 
    ? cloturesRecues 
    : cloturesRecues.filter(r => r.pointDeVente === filter);
  
  const totalRecette = filtrés.reduce((acc, curr) => acc + (curr.stats?.total || 0), 0);
  const totalCash = filtrés.reduce((acc, curr) => acc + (curr.stats?.cash || 0), 0);
  const totalMobile = filtrés.reduce((acc, curr) => acc + (curr.stats?.mobile || 0), 0);

  if (loading) return <div className="p-10 text-center font-black uppercase text-slate-400 animate-pulse">Chargement des données Waska...</div>;

  return (
    <div className="p-4 md:p-8 bg-[#FDFBF9] min-h-screen font-sans text-slate-900">
      
      {/* HEADER (Identique au précédent) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-3">
            <div className="p-2 bg-[#386D7F] rounded-xl text-white"><BarChart3 size={24}/></div>
            Supervision <span className="text-[#386D7F]">RAF</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-1 italic">Waska Village • Audit & Validation</p>
        </div>
        
        <div className="flex gap-2">
           {error && <span className="text-red-500 text-[10px] font-bold uppercase">{error}</span>}
           <div className="bg-[#386D7F] text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2">
            <Eye size={16} /> Mode Audit Live
          </div>
        </div>
      </div>

      {/* KPI CARDS (Calculés dynamiquement sur la BDD) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm border-b-4 border-b-[#386D7F]/20">
           <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">Recette Totale</p>
           <h2 className="text-2xl font-black text-slate-900 italic">{totalRecette.toLocaleString()} <span className="text-xs opacity-40 not-italic">F</span></h2>
        </div>
        {/* ... Autres cards identiques ... */}
      </div>

      {/* TABLEAU ET MODALE (Utilisent les données API) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
           {/* ... Logique de la table avec {filtrés.map(...)} ... */}
           {/* Note: assurez-vous que les clés correspondent aux noms dans votre BDD (ex: rep.caissier ou rep.user.username) */}
        </div>
      </div>

      {/* MODALE D'AUDIT (Identique, mais appelle handleValidateReport sur l'API) */}
      {selectedReport && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            {/* ... Contenu modale ... */}
            <button onClick={() => handleValidateReport(selectedReport._id)}>Approuver l'Audit</button>
         </div>
      )}
    </div>
  );
};

export default AdminDashboard;