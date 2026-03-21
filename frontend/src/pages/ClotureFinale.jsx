import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, Download, CheckCircle2, Coins, FileText, Lock,
  AlertTriangle, Loader2, Printer, History, Search, Calendar, RefreshCw
} from 'lucide-react';

const ClotureFinale = () => {
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [archives, setArchives] = useState([]); 
  const [searchTerm, setSearchTerm] = useState("");

  const [stats, setStats] = useState({
    barResto: 0,
    reception: 0,
    depenses: 0,
    theoriqueTotal: 0,
    declareTotal: 0,
    ecartGlobal: 0,
    cloturesIds: [],
    nbClotures: 0
  });

  // ==========================================
  // 1. CHARGEMENT ET CONSOLIDATION
  // ==========================================
  const fetchAllData = useCallback(async () => {
    try {
      const token = localStorage.getItem('userToken');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [resClotures, resDep, resArch] = await Promise.all([
        fetch('http://localhost:5000/api/clotures?audite=false', { headers }),
        fetch('http://localhost:5000/api/activities?type=sortie&archived=false', { headers }),
        fetch('http://localhost:5000/api/reports/history', { headers })
      ]);

      const clotures = await resClotures.json();
      const activities = await resDep.json();
      
      if (resArch.ok) {
        const historyFiles = await resArch.json();
        setArchives(Array.isArray(historyFiles) ? historyFiles : []);
      }

      // Calculs sécurisés
      const barRestoTotal = (Array.isArray(clotures) ? clotures : [])
        .filter(c => c.pointDeVente?.toLowerCase() !== 'réception')
        .reduce((sum, c) => sum + (Number(c.totalVentes) || 0), 0);

      const receptionTotal = (Array.isArray(clotures) ? clotures : [])
        .filter(c => c.pointDeVente?.toLowerCase() === 'réception')
        .reduce((sum, c) => sum + (Number(c.totalVentes) || 0), 0);

      const totalTheorique = (Array.isArray(clotures) ? clotures : [])
        .reduce((sum, c) => sum + (Number(c.stats?.theorique?.total) || Number(c.totalTheorique) || 0), 0);
      
      const totalDeclare = barRestoTotal + receptionTotal;
      const totalDepenses = (Array.isArray(activities) ? activities : [])
        .reduce((sum, a) => sum + (Number(a.montant) || 0), 0);

      setStats({
        barResto: barRestoTotal,
        reception: receptionTotal,
        depenses: totalDepenses,
        theoriqueTotal: totalTheorique,
        declareTotal: totalDeclare,
        ecartGlobal: totalDeclare - totalTheorique,
        cloturesIds: (Array.isArray(clotures) ? clotures : []).map(c => c._id),
        nbClotures: (Array.isArray(clotures) ? clotures : []).length
      });

    } catch (error) {
      console.error("Erreur de chargement:", error);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ==========================================
  // 2. ACTIONS (RESET, SIGNATURE, RAPPORT)
  // ==========================================

  const handleManualReset = async () => {
    if (!window.confirm("Voulez-vous réinitialiser les compteurs à zéro sans rapport ?")) return;
    
    // Reset visuel immédiat
    setStats(prev => ({ ...prev, barResto: 0, reception: 0, depenses: 0, declareTotal: 0, nbClotures: 0 }));
    setIsSigned(false);

    try {
      setIsSyncing(true);
      const token = localStorage.getItem('userToken');
      const res = await fetch('http://localhost:5000/api/reports/force-reset', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setTimeout(() => fetchAllData(), 2500); // Latence pour MongoDB
      } else {
        alert("Erreur serveur lors de la réinitialisation.");
        fetchAllData();
      }
    } catch (e) {
      alert("Erreur de connexion.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFinalSignature = async () => {
    if (!window.confirm("Certifier les comptes pour cette journée ?")) return;
    try {
      setIsSyncing(true);
      const token = localStorage.getItem('userToken');
      const responses = await Promise.all(stats.cloturesIds.map(id => 
        fetch(`http://localhost:5000/api/clotures/${id}/audit`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ statutAudit: 'Valide' })
        })
      ));

      if (responses.every(r => r.ok)) {
        setIsSigned(true);
        alert("Comptes certifiés. Générez maintenant le rapport PDF.");
      }
    } catch (error) {
      alert("Erreur de signature.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadReport = async (filename = null) => {
    try {
      setIsDownloading(true);
      const token = localStorage.getItem('userToken');
      const isNew = !filename;

      const url = isNew 
        ? 'http://localhost:5000/api/reports/daily-audit' 
        : `http://localhost:5000/api/reports/history/${filename}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const contentType = response.headers.get('content-type');

      if (response.ok && contentType && contentType.includes('application/pdf')) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename || `RAPPORT_WASKA_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        if (isNew) {
          // Vidage immédiat pour éviter le "re-clic"
          setStats(prev => ({ ...prev, barResto: 0, reception: 0, depenses: 0, nbClotures: 0 }));
          setIsSigned(false);
          setTimeout(() => fetchAllData(), 2500);
        }
      } else {
        const errData = await response.json();
        alert(`Erreur: ${errData.message || "Aucune donnée à traiter."}`);
        if (isNew) fetchAllData();
      }
    } catch (error) {
      alert("Erreur lors du téléchargement.");
    } finally {
      setIsDownloading(false);
    }
  };

  const filteredArchives = archives.filter(file => file.toLowerCase().includes(searchTerm.toLowerCase()));
  const beneficeNet = stats.declareTotal - stats.depenses;

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#FDFBF9] space-y-4">
      <Loader2 className="animate-spin text-[#386D7F]" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Consolidation WASKA...</p>
    </div>
  );

  return (
    <div className="p-8 bg-[#FDFBF9] min-h-screen font-sans text-slate-800">
      
      {/* HEADER */}
      <div className="mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#386D7F]/10 pb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic">
            Audit & <span className="text-[#386D7F]">Clôture</span>
          </h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">
            WASKA VILLAGE • Intelligence de Gestion
          </p>
        </div>
        
        <div className="flex gap-4 items-center">
            {stats.nbClotures > 0 && (
                <button 
                    onClick={handleManualReset}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-100"
                >
                    <RefreshCw size={12} /> Réinitialiser
                </button>
            )}
            
            <div className="flex gap-2 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 items-center">
                <div className={`w-3 h-3 rounded-full ${isSyncing ? 'bg-orange-400 animate-ping' : (stats.nbClotures > 0 ? (isSigned ? 'bg-green-500' : 'bg-[#D17A61] animate-pulse') : 'bg-slate-200')}`}></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                    {isSyncing ? 'Synchronisation...' : isSigned ? 'Prêt à l\'export' : `${stats.nbClotures} Ouvertures`}
                </span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          {/* CAISSE CONSOLIDÉE */}
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden">
            <h3 className="text-[11px] font-black text-slate-400 uppercase mb-8 flex items-center gap-2 tracking-widest">
              <Coins size={18} className="text-[#386D7F]"/> Situation de Caisse Consolidée
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="bg-[#FDFBF9] p-8 rounded-[2rem] border border-[#386D7F]/5">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Bar & Restaurant</p>
                <p className="text-3xl font-black text-slate-800 tracking-tighter italic">{stats.barResto.toLocaleString()} <span className="text-sm font-normal not-italic">F</span></p>
              </div>
              <div className="bg-[#FDFBF9] p-8 rounded-[2rem] border border-[#386D7F]/5">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Réception Hôtel</p>
                <p className="text-3xl font-black text-slate-800 tracking-tighter italic">{stats.reception.toLocaleString()} <span className="text-sm font-normal not-italic">F</span></p>
              </div>
            </div>

            <div className={`mt-8 p-6 rounded-[2rem] flex items-center justify-between text-white transition-all duration-500 ${stats.ecartGlobal !== 0 && stats.nbClotures > 0 ? 'bg-red-600' : 'bg-slate-900'}`}>
                <div className="flex items-center gap-4">
                  <div className="bg-white/10 p-2 rounded-lg">
                    {stats.ecartGlobal !== 0 ? <AlertTriangle size={20}/> : <CheckCircle2 size={20}/>}
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-white/50 uppercase">Écart Global</p>
                    <p className="font-bold">{stats.ecartGlobal.toLocaleString()} F</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-white/50 uppercase">Dépenses Sorties</p>
                  <p className="font-bold">-{stats.depenses.toLocaleString()} F</p>
                </div>
            </div>
          </div>

          {/* ARCHIVES */}
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <h3 className="text-[11px] font-black text-slate-400 uppercase flex items-center gap-2 tracking-widest">
                <History size={18} className="text-[#386D7F]"/> Historique des rapports
              </h3>
              <div className="relative">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Rechercher un PDF..." 
                  className="bg-[#FDFBF9] border border-slate-100 rounded-full py-2 pl-10 pr-4 text-xs font-bold focus:outline-none focus:border-[#386D7F] w-full md:w-64"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredArchives.length > 0 ? filteredArchives.map((file, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-[#FDFBF9] rounded-2xl border border-slate-50 group hover:border-[#386D7F]/30 transition-all">
                  <div className="flex items-center gap-3">
                    <Calendar size={15} className="text-[#386D7F]" />
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">{file}</span>
                  </div>
                  <button onClick={() => handleDownloadReport(file)} className="p-2 text-slate-400 hover:text-[#386D7F] transition-all">
                    <Download size={18} />
                  </button>
                </div>
              )) : (
                <p className="text-center py-10 text-slate-300 text-xs italic">Aucun rapport archivé.</p>
              )}
            </div>
          </div>
        </div>

        {/* VALIDATION FINALE */}
        <div className={`p-10 rounded-[3.5rem] text-white shadow-2xl flex flex-col justify-between transition-all duration-700 ${isSigned ? 'bg-[#386D7F]' : 'bg-slate-900'}`}>
          <div className="text-center space-y-6">
            <div className="bg-white/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto backdrop-blur-md">
                {isSigned ? <CheckCircle2 size={40} className="animate-bounce" /> : <Lock size={40} className="text-[#D17A61]" />}
            </div>
            <div>
                <p className="text-[11px] font-black text-[#D17A61] uppercase tracking-[0.2em] mb-2">Bénéfice Net Global</p>
                <h2 className="text-6xl font-black italic tracking-tighter">{beneficeNet.toLocaleString()} <span className="text-lg not-italic opacity-50">F</span></h2>
                <p className="text-slate-400 text-[10px] mt-6 leading-relaxed italic">
                    {stats.nbClotures === 0 ? "La journée est clôturée. Les registres sont à jour." : (isSigned ? "Audit validé. Vous pouvez extraire le rapport officiel." : "La signature est requise avant l'archivage.")}
                </p>
            </div>
          </div>
          
          <div className="space-y-4 mt-12">
            {!isSigned ? (
                <button 
                  onClick={handleFinalSignature} 
                  disabled={stats.nbClotures === 0 || isSyncing} 
                  className="w-full bg-[#D17A61] py-6 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-[#b96952] transition-all shadow-xl disabled:opacity-30 flex items-center justify-center gap-3"
                >
                  {isSyncing ? <Loader2 className="animate-spin" size={18}/> : <ShieldCheck size={18}/>}
                  Signer l'Audit
                </button>
            ) : (
                <button 
                  onClick={() => handleDownloadReport()} 
                  disabled={isDownloading || stats.nbClotures === 0} 
                  className="w-full bg-white text-slate-900 py-6 rounded-3xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-2xl hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  {isDownloading ? <Loader2 className="animate-spin" size={20} /> : <Printer size={20} />}
                  Imprimer le Rapport
                </button>
            )}
            <p className="text-center text-[7px] font-black text-white/20 uppercase tracking-widest">Waska Intelligence System v3.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClotureFinale;