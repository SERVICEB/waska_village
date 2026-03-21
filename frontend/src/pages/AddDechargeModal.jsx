import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Plus, Receipt, ArrowRight, Loader2, Search, Filter,
  Archive, RotateCcw, History, Eye, EyeOff, Trash2,
  AlertTriangle, CheckCircle2, X, ChevronDown
} from 'lucide-react';
import AddDechargeModal from './AddDechargeModal';

const API_URL = 'http://localhost:5000/api';
const authConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('userToken')}` }
});

// ─── BADGE TYPE ───────────────────────────────────────────────────────────────
const TYPE_COLORS = {
  'Facture':         { bg: 'bg-blue-50',   text: 'text-blue-600',   dot: 'bg-blue-400'   },
  'Salaire / Prime': { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-400' },
  'Achat Stock':     { bg: 'bg-emerald-50',text: 'text-emerald-600',dot: 'bg-emerald-400'},
  'Maintenance':     { bg: 'bg-amber-50',  text: 'text-amber-600',  dot: 'bg-amber-400'  },
  'Divers':          { bg: 'bg-slate-50',  text: 'text-slate-500',  dot: 'bg-slate-300'  },
};
const getTypeStyle = (type) => TYPE_COLORS[type] || TYPE_COLORS['Divers'];

// ─── COMPOSANT CARTE DÉCHARGE ─────────────────────────────────────────────────
const DechargeCard = ({ item, onArchive, onDelete, showArchived }) => {
  const typeStyle = getTypeStyle(item.type);
  return (
    <div className={`bg-white p-6 rounded-[2rem] border transition-all
      ${item.archived
        ? 'border-slate-100 opacity-60 shadow-none'
        : 'border-slate-100 shadow-sm hover:shadow-xl'
      }`}
    >
      {/* Bandeau archivé */}
      {item.archived && (
        <div className="w-full h-1 bg-slate-200 rounded-full mb-3" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${typeStyle.bg} ${typeStyle.text}`}>
            <Receipt size={18} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              {new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${typeStyle.bg} ${typeStyle.text}`}>
              {item.type}
            </span>
          </div>
        </div>

        {/* Actions — toujours visibles */}
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          {item.archived !== true && (
            <button
              onClick={(e) => { e.stopPropagation(); onArchive(item._id); }}
              title="Archiver"
              style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#e2e8f0', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Archive size={16} color="#386D7F" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item._id); }}
            title="Supprimer"
            style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#fee2e2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Trash2 size={16} color="#ef4444" />
          </button>
        </div>
      </div>

      <h3 className="font-black text-slate-800 uppercase text-sm mb-1 truncate">{item.beneficiaire}</h3>
      {item.justificatif && (
        <p className="text-[9px] text-slate-400 italic mb-3 truncate">{item.justificatif}</p>
      )}

      <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
        <p className="text-xl font-black text-[#D17A61] italic">
          {item.montant.toLocaleString('fr-FR')} <span className="text-[10px] not-italic text-slate-300">FCFA</span>
        </p>
        {item.archived
          ? <span className="text-[8px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-lg uppercase">Archivé</span>
          : <ArrowRight size={15} className="text-slate-200 group-hover:text-[#D17A61] transition-all" />
        }
      </div>
    </div>
  );
};

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────
const DechargesPage = () => {
  const [decharges, setDecharges]               = useState([]);
  const [filteredDecharges, setFilteredDecharges] = useState([]);
  const [isModalOpen, setIsModalOpen]           = useState(false);
  const [loading, setLoading]                   = useState(true);
  const [showArchived, setShowArchived]         = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isResetting, setIsResetting]           = useState(false);
  const [resetSuccess, setResetSuccess]         = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Tous');

  // ── Chargement ───────────────────────────────────────────────────────────
  const fetchDecharges = useCallback(async () => {
    try {
      setLoading(true);
      // ?all=true pour avoir archivées + actives quand on est en mode historique
      const endpoint = showArchived
        ? `${API_URL}/decharges?all=true`
        : `${API_URL}/decharges`;
      const res = await axios.get(endpoint, authConfig());
      setDecharges(res.data);
    } catch (err) {
      console.error('Erreur chargement décharges:', err);
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => { fetchDecharges(); }, [fetchDecharges]);

  // ── Filtres ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let results = decharges.filter(item =>
      (item.beneficiaire || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.type         || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filterType !== 'Tous') {
      results = results.filter(item => item.type === filterType);
    }
    setFilteredDecharges(results);
  }, [searchTerm, filterType, decharges]);

  // ── Archiver une décharge ────────────────────────────────────────────────
  const handleArchive = async (id) => {
    try {
      await axios.patch(`${API_URL}/decharges/${id}/archive`, {}, authConfig());
      setDecharges(prev => prev.map(d =>
        d._id === id ? { ...d, archived: true, dateArchive: new Date() } : d
      ));
    } catch (err) {
      alert('Erreur lors de l\'archivage.');
    }
  };

  // ── Supprimer une décharge ───────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette décharge définitivement ?')) return;
    try {
      await axios.delete(`${API_URL}/decharges/${id}`, authConfig());
      setDecharges(prev => prev.filter(d => d._id !== id));
    } catch (err) {
      alert('Erreur lors de la suppression.');
    }
  };

  // ── Archiver TOUTES (nouvelle journée) ────────────────────────────────────
  const handleNouvelleJournee = async () => {
    setIsResetting(true);
    try {
      const res = await axios.post(
        `${API_URL}/reports/force-reset`,
        { fullReset: true, note: 'Nouvelle journée décharges' },
        authConfig()
      );
      if (res.data?.success) {
        setShowConfirmReset(false);
        setResetSuccess(true);
        setTimeout(async () => {
          await fetchDecharges();
          setResetSuccess(false);
        }, 2500);
      } else {
        alert('Erreur : ' + (res.data?.message || 'Réinitialisation échouée'));
      }
    } catch (err) {
      alert('Erreur serveur.');
    } finally {
      setIsResetting(false);
    }
  };

  // ── Calculs ──────────────────────────────────────────────────────────────
  const actives   = filteredDecharges.filter(d => !d.archived);
  const archivees = filteredDecharges.filter(d => d.archived);
  const totalActif   = actives.reduce((s, d) => s + (d.montant || 0), 0);
  const totalArchive = archivees.reduce((s, d) => s + (d.montant || 0), 0);
  const displayed = showArchived ? filteredDecharges : actives;

  // ── Écran succès ─────────────────────────────────────────────────────────
  if (resetSuccess) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#FDFBF9] gap-5">
      <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
        <CheckCircle2 size={44} className="text-emerald-500" />
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Journée Clôturée</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
          Toutes les décharges ont été archivées
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF9] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">

        {/* ══ HEADER ════════════════════════════════════════════════════════ */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-[#386D7F] italic tracking-tighter uppercase">
                Registre des Sorties
              </h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1 italic">
                Waska Village · Jacqueville
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Toggle historique */}
              <button
                onClick={() => setShowArchived(v => !v)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all
                  ${showArchived
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                  }`}
              >
                {showArchived ? <EyeOff size={14} /> : <History size={14} />}
                {showArchived ? 'Journée en cours' : 'Voir historique'}
              </button>

              {/* Nouvelle journée */}
              {!showArchived && actives.length > 0 && (
                <button
                  onClick={() => setShowConfirmReset(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-[#D17A61]/30 text-[#D17A61] bg-white hover:bg-[#D17A61] hover:text-white transition-all"
                >
                  <Archive size={14} /> Nouvelle Journée
                </button>
              )}

              {/* Nouveau */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-[#386D7F] hover:bg-[#2c5665] text-white px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#386D7F]/20 transition-all"
              >
                <Plus size={16} /> Nouvelle Sortie
              </button>
            </div>
          </div>

          {/* KPIs rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-50">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Journée en cours</p>
              <p className="text-xl font-black text-[#D17A61] italic">{totalActif.toLocaleString('fr-FR')} <span className="text-xs font-bold text-slate-300 not-italic">F</span></p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lignes actives</p>
              <p className="text-xl font-black text-slate-700 italic">{actives.length}</p>
            </div>
            {showArchived && (
              <>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total archivé</p>
                  <p className="text-xl font-black text-slate-400 italic">{totalArchive.toLocaleString('fr-FR')} <span className="text-xs font-bold text-slate-300 not-italic">F</span></p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lignes archivées</p>
                  <p className="text-xl font-black text-slate-400 italic">{archivees.length}</p>
                </div>
              </>
            )}
          </div>

          {/* Filtres */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input
                type="text"
                placeholder="Rechercher bénéficiaire ou type..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-[#386D7F] focus:bg-white outline-none transition-all text-sm font-bold text-slate-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <select
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-[#386D7F] focus:bg-white outline-none transition-all text-sm font-bold text-slate-700 appearance-none"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="Tous">Tous les types</option>
                <option value="Facture">Factures</option>
                <option value="Salaire / Prime">Salaires</option>
                <option value="Achat Stock">Stocks</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Divers">Divers</option>
              </select>
            </div>
          </div>
        </div>

        {/* ══ CONTENU ════════════════════════════════════════════════════════ */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 size={36} className="animate-spin mb-4 text-[#386D7F]" />
            <p className="font-black uppercase text-[10px] tracking-widest">Chargement...</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-300">
            <Receipt size={48} className="mb-4 opacity-30" />
            <p className="font-black uppercase text-[10px] tracking-widest">
              {showArchived ? 'Aucune décharge dans l\'historique' : 'Aucune décharge pour cette journée'}
            </p>
          </div>
        ) : (
          <>
            {/* Séparateur si historique mixte */}
            {showArchived && actives.length > 0 && archivees.length > 0 && (
              <div className="mb-4">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                  Journée en cours — {actives.length} décharge{actives.length > 1 ? 's' : ''}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
              {/* Actives en premier */}
              {actives.map(item => (
                <DechargeCard
                  key={item._id}
                  item={item}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                  showArchived={showArchived}
                />
              ))}
            </div>

            {/* Section archivées */}
            {showArchived && archivees.length > 0 && (
              <>
                <div className="mb-4 mt-8">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <Archive size={12} className="text-slate-300" />
                    Archives — {archivees.length} décharge{archivees.length > 1 ? 's' : ''} · {totalArchive.toLocaleString('fr-FR')} F
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {archivees.map(item => (
                    <DechargeCard
                      key={item._id}
                      item={item}
                      onArchive={handleArchive}
                      onDelete={handleDelete}
                      showArchived={showArchived}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ══ MODALE NOUVELLE JOURNÉE ════════════════════════════════════════ */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4">
          <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowConfirmReset(false)}
              className="absolute top-6 right-6 text-slate-300 hover:text-slate-500 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 bg-[#D17A61]/10 rounded-full flex items-center justify-center mb-4">
                <Archive size={26} className="text-[#D17A61]" />
              </div>
              <h2 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900">
                Nouvelle Journée
              </h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                Archivage de toutes les décharges actives
              </p>
            </div>

            <div className="bg-[#FDFBF9] rounded-[2rem] p-5 mb-6 border border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase">Décharges à archiver</span>
                <span className="text-sm font-black text-slate-700">{actives.length} ligne{actives.length > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase">Montant total</span>
                <span className="text-lg font-black text-[#D17A61] italic">{totalActif.toLocaleString('fr-FR')} F</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6 flex items-start gap-3">
              <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-[9px] font-bold text-amber-700 uppercase leading-relaxed">
                Les données seront conservées en base et consultables via "Voir historique". Les compteurs seront remis à zéro.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-black rounded-3xl uppercase text-[10px] tracking-widest transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleNouvelleJournee}
                disabled={isResetting}
                className="py-4 bg-[#D17A61] hover:bg-[#b8623f] text-white font-black rounded-3xl uppercase text-[10px] tracking-widest shadow-lg shadow-[#D17A61]/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isResetting
                  ? <><Loader2 size={15} className="animate-spin" /> Archivage...</>
                  : <><Archive size={15} /> Confirmer</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <AddDechargeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={fetchDecharges}
      />
    </div>
  );
};

export default DechargesPage;
