import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, PieChart, Download, Target, Crown,
  Waves, Loader2, RefreshCw, FileText, Hotel, Utensils, Coffee,
  AlertTriangle, Receipt, Users, Wrench, ShoppingCart, Archive,
  CheckCircle2, X, ShieldCheck, ChevronDown, ChevronUp, Search,
  Calendar, Filter
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('userToken')}` });

// ─── ICÔNE TYPE DÉCHARGE ──────────────────────────────────────────────────────
const TypeIcon = ({ type, size = 14 }) => {
  const map = {
    'Facture':         <Receipt size={size} />,
    'Salaire / Prime': <Users size={size} />,
    'Achat Stock':     <ShoppingCart size={size} />,
    'Maintenance':     <Wrench size={size} />,
    'Divers':          <FileText size={size} />,
  };
  return map[type] || <FileText size={size} />;
};

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
const Rapport = () => {
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [lastSync, setLastSync]             = useState(null);

  const [reportData, setReportData]         = useState(null);
  const [liveStats, setLiveStats]           = useState(null);
  const [clotures, setClotures]             = useState([]);
  const [decharges, setDecharges]           = useState([]);
  const [history, setHistory]               = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [alertesStock, setAlertesStock]     = useState([]);

  const [showCloture, setShowCloture]       = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [isClosing, setIsClosing]           = useState(false);
  const [clotureSuccess, setClotureSuccess] = useState(false);
  const [rafNote, setRafNote]               = useState('');

  // ── Recherche archives ────────────────────────────────────────────────────
  const [archiveSearch, setArchiveSearch]   = useState('');
  const [archiveDateFrom, setArchiveDateFrom] = useState('');
  const [archiveDateTo, setArchiveDateTo]   = useState('');
  const [downloadingFile, setDownloadingFile] = useState(null); // nom du fichier en cours

  // ── Fetches ────────────────────────────────────────────────────────────────
  const fetchReportStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/reports/stats-globales`, { headers: authHeaders() });
      setReportData(await res.json());
    } catch (e) { console.error('stats-globales:', e); }
  }, []);

  const fetchLive = useCallback(async () => {
    try {
      const [resVentes, resDecharges, resStock, resClotures] = await Promise.allSettled([
        fetch(`${API_URL}/stats/ventes-globales`, { headers: authHeaders() }),
        fetch(`${API_URL}/decharges`,              { headers: authHeaders() }),
        fetch(`${API_URL}/stocks/alerts`,           { headers: authHeaders() }),
        fetch(`${API_URL}/clotures`,                { headers: authHeaders() }),
      ]);

      const ventesData   = resVentes.status    === 'fulfilled' ? await resVentes.value.json()    : {};
      const dechargesRaw = resDecharges.status === 'fulfilled' ? await resDecharges.value.json() : [];
      const stockRaw     = resStock.status     === 'fulfilled' ? await resStock.value.json()     : [];
      const cloturesRaw  = resClotures.status  === 'fulfilled' ? await resClotures.value.json()  : [];

      const dep = Array.isArray(dechargesRaw)
        ? dechargesRaw.reduce((s, d) => s + (d.montant || 0), 0) : 0;

      setLiveStats({
        caTotal:        ventesData?.total || 0,
        depensesTotal:  dep,
        soldeNet:       (ventesData?.total || 0) - dep,
        tauxOccupation: ventesData?.tauxOccupation || 0,
        caParPoint:     ventesData?.parPointDeVente || [],
      });

      setDecharges(Array.isArray(dechargesRaw) ? dechargesRaw : []);
      setAlertesStock(Array.isArray(stockRaw) ? stockRaw : []);
      setClotures(Array.isArray(cloturesRaw) ? cloturesRaw : []);
      setLastSync(new Date());
    } catch (e) { console.error('fetchLive:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/reports/archives`, { headers: authHeaders() });
      const r = await res.json();
      const list = Array.isArray(r) ? r : [];
      setHistory(list);
      setFilteredHistory(list);
    } catch (e) { console.error('history:', e); }
  }, []);

  useEffect(() => {
    Promise.all([fetchReportStats(), fetchLive(), fetchHistory()]);
    const i1 = setInterval(fetchLive, 30000);
    const i2 = setInterval(fetchReportStats, 120000);
    return () => { clearInterval(i1); clearInterval(i2); };
  }, [fetchReportStats, fetchLive, fetchHistory]);

  // ── Filtre archives par date/recherche ────────────────────────────────────
  useEffect(() => {
    let results = [...history];

    if (archiveSearch.trim()) {
      results = results.filter(f => {
        const filename = typeof f === 'string' ? f : f.filename;
        const label    = typeof f === 'string' ? f : (f.dateFormatted || f.filename);
        return (filename + label).toLowerCase().includes(archiveSearch.toLowerCase());
      });
    }

    if (archiveDateFrom) {
      results = results.filter(f => {
        const dateStr = typeof f === 'string'
          ? f.match(/(\d{4}-\d{2}-\d{2})/)?.[1]
          : f.date;
        return dateStr && dateStr >= archiveDateFrom;
      });
    }

    if (archiveDateTo) {
      results = results.filter(f => {
        const dateStr = typeof f === 'string'
          ? f.match(/(\d{4}-\d{2}-\d{2})/)?.[1]
          : f.date;
        return dateStr && dateStr <= archiveDateTo;
      });
    }

    setFilteredHistory(results);
  }, [archiveSearch, archiveDateFrom, archiveDateTo, history]);

  // ── Téléchargement authentifié (résout le 401) ────────────────────────────
  const handleDownloadArchive = async (filename) => {
    setDownloadingFile(filename);
    try {
      const res = await fetch(`${API_URL}/reports/archives/${filename}`, {
        headers: authHeaders(),
      });

      if (!res.ok) {
        alert(`Erreur ${res.status} : impossible de télécharger le rapport.`);
        return;
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), {
        href: url,
        download: filename,
      });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Erreur réseau lors du téléchargement.');
    } finally {
      setDownloadingFile(null);
    }
  };

  // ── Export PDF du jour ────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const res = await fetch(`${API_URL}/reports/daily-audit`, { headers: authHeaders() });
      if (res.ok) {
        const blob = await res.blob();
        const a = Object.assign(document.createElement('a'), {
          href: URL.createObjectURL(blob),
          download: `RAPPORT_WASKA_${new Date().toISOString().split('T')[0]}.pdf`,
        });
        a.click();
        fetchHistory();
      }
    } catch { alert('Erreur export PDF'); }
  };

  // ── Clôture journée ────────────────────────────────────────────────────────
  const handleCloture = async () => {
    setIsClosing(true);
    try {
      const res = await fetch(`${API_URL}/reports/force-reset`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullReset: true, note: rafNote || 'Clôture journalière RAF' }),
      });
      const result = await res.json();
      if (result.success) {
        setShowConfirm(false);
        setRafNote('');
        setClotureSuccess(true);
        setTimeout(async () => {
          await Promise.all([fetchReportStats(), fetchLive(), fetchHistory()]);
          setClotureSuccess(false);
        }, 3000);
      } else {
        alert('Erreur : ' + (result.message || 'Clôture échouée'));
      }
    } catch { alert('Erreur serveur lors de la clôture.'); }
    finally { setIsClosing(false); }
  };

  // ── Calculs ────────────────────────────────────────────────────────────────
  const PDV = [
    { id: 'Réception', label: 'Réception / Hôtel', icon: <Hotel size={16}/>,    color: '#386D7F' },
    { id: 'resto',     label: 'Restaurant',         icon: <Utensils size={16}/>, color: '#D17A61' },
    { id: 'bar',       label: 'Bar Lounge',          icon: <Coffee size={16}/>,   color: '#7C6D8F' },
  ];

  // On filtre sur archived (pas audite) — seul force-reset archive, pas les audits de supervision
  const cloturesJour  = clotures.filter(c => c.archived !== true);
  const dechargesJour = decharges.filter(d => d.archived !== true);
  const paiesJour     = [];

  const recetteParPDV = PDV.map(p => ({
    ...p,
    montant: cloturesJour.filter(c => c.pointDeVente === p.id).reduce((s, c) => s + (c.totalVentes || 0), 0),
    nb:      cloturesJour.filter(c => c.pointDeVente === p.id).length,
  }));

  const totalDecharges   = dechargesJour.reduce((s, d) => s + (d.montant || 0), 0);
  const totalSorties     = totalDecharges;

  const dechargesParType = dechargesJour.reduce((acc, d) => {
    const k = d.type || 'Divers';
    acc[k] = (acc[k] || 0) + (d.montant || 0);
    return acc;
  }, {});

  const caTotal   = liveStats?.caTotal       ?? reportData?.caTotal  ?? 0;
  const depenses  = liveStats?.depensesTotal ?? reportData?.depenses ?? 0;
  const benefice  = liveStats?.soldeNet      ?? reportData?.benefice ?? 0;
  const isPositif = benefice >= 0;
  const marge     = caTotal > 0 ? Math.min((benefice / caTotal) * 100, 100) : 0;

  const ventesParEntite = reportData?.ventesParEntite ?? [];
  const topProduits     = reportData?.topProduits     ?? [];

  // ── Écrans spéciaux ────────────────────────────────────────────────────────
  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#FDFBF9]">
      <Loader2 size={40} className="animate-spin text-[#386D7F] mb-4" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronisation Waska...</p>
    </div>
  );

  if (clotureSuccess) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#FDFBF9] gap-6">
      <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center">
        <CheckCircle2 size={52} className="text-emerald-500" />
      </div>
      <div className="text-center">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Journée Clôturée</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
          Toutes les données ont été archivées · Compteurs remis à zéro
        </p>
      </div>
      <div className="flex gap-4 mt-2">
        <div className="bg-white px-8 py-4 rounded-[2rem] border border-slate-100 shadow-sm text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase">Recettes archivées</p>
          <p className="text-xl font-black text-[#386D7F] italic">{caTotal.toLocaleString()} F</p>
        </div>
        <div className="bg-white px-8 py-4 rounded-[2rem] border border-slate-100 shadow-sm text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase">Sorties archivées</p>
          <p className="text-xl font-black text-[#D17A61] italic">{totalSorties.toLocaleString()} F</p>
        </div>
      </div>
    </div>
  );

  // ── RENDU ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-8 bg-[#FDFBF9] min-h-screen font-sans">

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Waves className="text-[#386D7F]" size={16} />
            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-[#386D7F]">Intelligence Business · RAF</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
            Dashboard <span className="text-[#386D7F]">Décisionnel</span>
          </h1>
          {lastSync && (
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              <p className="text-[9px] font-bold text-slate-400">
                Live · {lastSync.toLocaleTimeString('fr-FR')} ·{' '}
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => { setRefreshing(true); fetchLive(); }}
            className="p-3.5 bg-white rounded-2xl border border-slate-100 text-[#386D7F] shadow-sm hover:shadow-md transition-all">
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={handleExport}
            className="flex items-center gap-2 bg-white border border-slate-100 text-slate-700 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-md transition-all shadow-sm">
            <Download size={16} /> Export PDF
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={cloturesJour.length === 0 && dechargesJour.length === 0}
            className="flex items-center gap-2 bg-[#386D7F] text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#2c5665] transition-all shadow-xl shadow-[#386D7F]/20 disabled:opacity-40 disabled:cursor-not-allowed">
            <Archive size={16} /> Nouvelle Journée
          </button>
        </div>
      </div>

      {/* ══ ALERTES STOCK ═══════════════════════════════════════════════════ */}
      {alertesStock.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-100 p-5 rounded-[2rem] flex items-start gap-4">
          <AlertTriangle className="text-red-500 mt-0.5 shrink-0 animate-bounce" size={18} />
          <div>
            <p className="text-[10px] font-black uppercase text-red-500 mb-2 tracking-widest">Stocks Critiques</p>
            <div className="flex flex-wrap gap-2">
              {alertesStock.map((s, i) => (
                <span key={i} className="bg-red-500 text-white px-3 py-1 rounded-lg text-[10px] font-black">
                  {s.name} — {s.quantity}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ HERO SOLDE NET ═══════════════════════════════════════════════════ */}
      <div className={`rounded-[2.5rem] p-7 mb-8 text-white relative overflow-hidden shadow-2xl ${isPositif ? 'bg-[#386D7F]' : 'bg-[#D17A61]'}`}>
        <div className="absolute -right-8 -top-8 opacity-5"><Crown size={180} /></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">Solde Net Journée</p>
            <h2 className="text-5xl font-black italic tracking-tighter">
              {isPositif ? '+' : ''}{benefice.toLocaleString()}
              <span className="text-xl font-bold opacity-50 not-italic ml-2">F</span>
            </h2>
            <div className="mt-3 flex items-center gap-2 opacity-70 text-[10px] font-black uppercase tracking-widest">
              {isPositif ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
              {isPositif ? 'Exercice excédentaire' : 'Exercice déficitaire'} — Marge {Math.abs(marge).toFixed(1)}%
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 min-w-[300px]">
            <div className="bg-white/10 backdrop-blur p-4 rounded-2xl">
              <p className="text-[8px] font-black uppercase opacity-60 mb-1">Recettes</p>
              <p className="text-lg font-black italic">{caTotal.toLocaleString()} F</p>
            </div>
            <div className="bg-white/10 backdrop-blur p-4 rounded-2xl">
              <p className="text-[8px] font-black uppercase opacity-60 mb-1">Dépenses</p>
              <p className="text-lg font-black italic">{depenses.toLocaleString()} F</p>
            </div>
            <div className="bg-white/10 backdrop-blur p-4 rounded-2xl">
              <p className="text-[8px] font-black uppercase opacity-60 mb-1">Occupation</p>
              <p className="text-lg font-black italic">{liveStats?.tauxOccupation || 0}%</p>
            </div>
          </div>
        </div>
        <div className="relative z-10 mt-5 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-white/50 rounded-full transition-all duration-1000" style={{ width: `${Math.abs(marge)}%` }} />
        </div>
      </div>

      {/* ══ FLUX LIVE PAR CAISSE ════════════════════════════════════════════ */}
      <div className="mb-8">
        <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          Flux Direct par Caisse · {cloturesJour.length} clôture{cloturesJour.length > 1 ? 's' : ''} en attente
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PDV.map(p => {
            const live    = liveStats?.caParPoint?.find(x => x._id === p.id);
            const cloture = recetteParPDV.find(x => x.id === p.id);
            return (
              <div key={p.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl" style={{ background: p.color + '18', color: p.color }}>{p.icon}</div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-400">{p.label}</p>
                      <p className="text-lg font-black italic text-slate-900">
                        {(live?.total || 0).toLocaleString()} <span className="text-xs font-bold text-slate-300 not-italic">F</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-[8px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md">EN LIGNE</span>
                </div>
                {cloture?.nb > 0 && (
                  <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-[8px] font-black text-slate-400 uppercase">{cloture.nb} clôture{cloture.nb > 1 ? 's' : ''} versées</span>
                    <span className="text-[10px] font-black" style={{ color: p.color }}>{cloture.montant.toLocaleString()} F</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ KPI ANALYTIQUES ═════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-xl">
          <h3 className="text-sm font-black text-slate-900 mb-8 flex items-center gap-3 uppercase italic tracking-tighter">
            <PieChart className="text-[#386D7F]" size={20}/> Répartition par Secteur
          </h3>
          <div className="space-y-6">
            {ventesParEntite.length > 0 ? ventesParEntite.map((e, i) => (
              <div key={i}>
                <div className="flex justify-between font-black text-xs uppercase tracking-widest mb-2">
                  <span className="text-slate-500">{e.name}</span>
                  <span className="text-[#386D7F] italic">{e.value.toLocaleString()} F</span>
                </div>
                <div className="w-full bg-[#FDFBF9] h-4 rounded-2xl border border-slate-50 overflow-hidden p-0.5">
                  <div className={`${e.color} h-full rounded-xl transition-all duration-1000`}
                    style={{ width: `${caTotal > 0 ? (e.value / caTotal) * 100 : 0}%` }} />
                </div>
              </div>
            )) : (
              <p className="text-[10px] font-black text-slate-300 uppercase italic text-center py-6">
                Aucune donnée — Nouvelle journée initialisée
              </p>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-xl">
          <h3 className="text-sm font-black text-slate-900 mb-8 flex items-center gap-3 uppercase italic tracking-tighter">
            <Target className="text-[#D17A61]" size={20}/> Top Performances
          </h3>
          <table className="w-full">
            <tbody className="divide-y divide-slate-50">
              {topProduits.length > 0 ? topProduits.map((p, i) => (
                <tr key={i}>
                  <td className="py-5 font-black text-slate-700 uppercase text-xs italic">{p.name}</td>
                  <td className="py-5 text-center">
                    <span className="bg-[#386D7F]/10 text-[#386D7F] px-3 py-1 rounded-xl text-[10px] font-black">{p.qty} flux</span>
                  </td>
                  <td className="py-5 text-right font-black text-slate-900 text-sm">
                    {p.rev.toLocaleString()} <span className="text-[10px] text-slate-300 font-bold">F</span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={3} className="py-12 text-center text-[10px] font-black text-slate-300 uppercase italic">
                  Aucune donnée pour cette journée
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ PANNEAU CLÔTURE RAF ══════════════════════════════════════════════ */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm mb-8 overflow-hidden">
        <button onClick={() => setShowCloture(v => !v)}
          className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#386D7F]/10 rounded-xl text-[#386D7F]"><ShieldCheck size={18} /></div>
            <div className="text-left">
              <p className="text-xs font-black uppercase tracking-widest text-slate-700">Détail Clôture RAF</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                {cloturesJour.length} versements · {dechargesJour.length} décharges
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-black italic ${isPositif ? 'text-emerald-600' : 'text-red-500'}`}>
              {isPositif ? '+' : ''}{benefice.toLocaleString()} F
            </span>
            {showCloture ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
          </div>
        </button>

        {showCloture && (
          <div className="border-t border-slate-50 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-[#FDFBF9] rounded-[2rem] overflow-hidden border border-slate-100">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Receipt size={13} className="text-[#D17A61]" /> Décharges & Dépenses
                  </h4>
                  <span className="text-[11px] font-black text-[#D17A61]">−{totalDecharges.toLocaleString()} F</span>
                </div>
                {Object.entries(dechargesParType).length > 0 && (
                  <div className="px-5 py-3 border-b border-slate-100 space-y-1.5 bg-white/60">
                    {Object.entries(dechargesParType).map(([type, mt]) => (
                      <div key={type} className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-slate-400">
                          <TypeIcon type={type} />
                          <span className="text-[9px] font-black uppercase">{type}</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-600">{mt.toLocaleString()} F</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                  {dechargesJour.length > 0 ? dechargesJour.map(d => (
                    <div key={d._id} className="px-5 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-[#D17A61]/10 text-[#D17A61]"><TypeIcon type={d.type} /></div>
                        <div>
                          <p className="text-[10px] font-black text-slate-700 uppercase">{d.beneficiaire}</p>
                          <p className="text-[8px] text-slate-400 italic">{d.type}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-black text-[#D17A61]">−{(d.montant || 0).toLocaleString()} F</span>
                    </div>
                  )) : (
                    <p className="py-8 text-center text-[9px] font-black text-slate-300 uppercase">Aucune décharge</p>
                  )}
                </div>
              </div>

              {/* Récap final */}
              <div className="bg-slate-900 text-white rounded-[2rem] p-6 flex flex-col justify-between">
                <h4 className="text-[10px] font-black uppercase text-[#386D7F] mb-4 flex items-center gap-2">
                  <ShieldCheck size={13} /> Récap RAF — {new Date().toLocaleDateString('fr-FR')}
                </h4>
                <div className="space-y-2 flex-1">
                  {recetteParPDV.map(p => p.montant > 0 && (
                    <div key={p.id} className="flex justify-between items-center py-1.5 border-b border-white/5">
                      <div className="flex items-center gap-2 text-slate-400">
                        <span style={{ color: p.color }}>{p.icon}</span>
                        <span className="text-[9px] font-black uppercase">{p.label}</span>
                      </div>
                      <span className="text-sm font-black" style={{ color: p.color }}>+{p.montant.toLocaleString()} F</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Receipt size={13} className="text-[#D17A61]" />
                      <span className="text-[9px] font-black uppercase">Décharges</span>
                    </div>
                    <span className="text-sm font-black text-[#D17A61]">−{totalDecharges.toLocaleString()} F</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 mt-4 border-t border-white/10">
                  <span className="text-[11px] font-black uppercase text-white">Solde Net</span>
                  <span className={`text-2xl font-black italic ${isPositif ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPositif ? '+' : ''}{benefice.toLocaleString()} F
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ ARCHIVES PDF ════════════════════════════════════════════════════ */}
      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h3 className="text-sm font-black flex items-center gap-3 uppercase italic tracking-tighter text-[#386D7F]">
            <FileText size={18}/> Archives des Rapports PDF
            <span className="text-[10px] font-bold text-slate-500 not-italic normal-case">
              {filteredHistory.length}/{history.length}
            </span>
          </h3>
          {/* Bouton reset filtres */}
          {(archiveSearch || archiveDateFrom || archiveDateTo) && (
            <button
              onClick={() => { setArchiveSearch(''); setArchiveDateFrom(''); setArchiveDateTo(''); }}
              className="text-[9px] font-black uppercase text-slate-500 hover:text-white transition-colors flex items-center gap-1"
            >
              <X size={12} /> Effacer filtres
            </button>
          )}
        </div>

        {/* ── Barre de recherche + dates ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
            <input
              type="text"
              placeholder="Rechercher un rapport..."
              value={archiveSearch}
              onChange={e => setArchiveSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white placeholder-slate-600 outline-none focus:border-[#386D7F] transition-colors"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
            <input
              type="date"
              value={archiveDateFrom}
              onChange={e => setArchiveDateFrom(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 outline-none focus:border-[#386D7F] transition-colors"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
            <input
              type="date"
              value={archiveDateTo}
              onChange={e => setArchiveDateTo(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 outline-none focus:border-[#386D7F] transition-colors"
            />
          </div>
        </div>

        {/* ── Liste des rapports ── */}
        {filteredHistory.length === 0 ? (
          <p className="text-xs text-slate-500 italic uppercase tracking-widest text-center py-8">
            {history.length === 0 ? 'Aucune archive disponible' : 'Aucun rapport trouvé pour ces critères'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHistory.map((file, i) => {
              const filename  = typeof file === 'string' ? file : file.filename;
              const dateLabel = typeof file === 'string' ? filename : (file.dateFormatted || filename);
              const sizeLabel = file.sizeKo ? `${file.sizeKo} Ko` : '';
              const isLoading = downloadingFile === filename;
              return (
                <button
                  key={i}
                  onClick={() => handleDownloadArchive(filename)}
                  disabled={isLoading}
                  className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-left w-full disabled:opacity-50"
                >
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase text-slate-500">Rapport d'Audit</p>
                    <p className="text-xs font-bold mt-0.5 truncate text-white">{dateLabel}</p>
                    {sizeLabel && <p className="text-[8px] text-slate-600 mt-0.5">{sizeLabel}</p>}
                  </div>
                  {isLoading
                    ? <Loader2 size={16} className="text-[#386D7F] animate-spin shrink-0 ml-2" />
                    : <Download size={16} className="text-[#386D7F] shrink-0 ml-2" />
                  }
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ MODALE CLÔTURE ══════════════════════════════════════════════════ */}
      {showConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4">
          <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl relative">
            <button onClick={() => setShowConfirm(false)}
              className="absolute top-6 right-6 text-slate-300 hover:text-slate-500 transition-colors">
              <X size={20} />
            </button>
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 bg-[#386D7F]/10 rounded-full flex items-center justify-center mb-4">
                <Archive size={28} className="text-[#386D7F]" />
              </div>
              <h2 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900">Clôturer la Journée</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                Archivage & remise à zéro des compteurs
              </p>
            </div>

            <div className="bg-[#FDFBF9] rounded-[2rem] p-6 mb-5 space-y-2.5 border border-slate-100">
              {recetteParPDV.map(p => p.montant > 0 && (
                <div key={p.id} className="flex justify-between text-[10px] font-black uppercase">
                  <span className="text-slate-400">{p.label}</span>
                  <span style={{ color: p.color }}>+{p.montant.toLocaleString()} F</span>
                </div>
              ))}
              <div className="flex justify-between text-[10px] font-black uppercase">
                <span className="text-slate-400">Décharges</span>
                <span className="text-[#D17A61]">−{totalDecharges.toLocaleString()} F</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between">
                <span className="text-[11px] font-black uppercase text-slate-700">Solde Net</span>
                <span className={`text-lg font-black italic ${isPositif ? 'text-emerald-600' : 'text-red-500'}`}>
                  {isPositif ? '+' : ''}{benefice.toLocaleString()} F
                </span>
              </div>
            </div>

            <div className="mb-5">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-2 mb-1.5 block">Observations RAF</label>
              <textarea value={rafNote} onChange={e => setRafNote(e.target.value)}
                placeholder="RAS — Aucun écart constaté..."
                className="w-full p-5 bg-slate-50 rounded-[1.5rem] text-xs font-bold text-slate-700 outline-none h-20 resize-none" />
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-5 flex items-start gap-3">
              <AlertTriangle size={13} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-[9px] font-bold text-amber-700 uppercase leading-relaxed">
                Toutes les clôtures et décharges seront archivées. Les compteurs seront remis à zéro.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setShowConfirm(false)}
                className="py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-black rounded-3xl uppercase text-[10px] tracking-widest transition-all">
                Annuler
              </button>
              <button onClick={handleCloture} disabled={isClosing}
                className="py-4 bg-[#386D7F] hover:bg-[#2c5665] text-white font-black rounded-3xl uppercase text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {isClosing ? <><Loader2 size={15} className="animate-spin" /> Archivage...</> : <><Archive size={15} /> Confirmer</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rapport;