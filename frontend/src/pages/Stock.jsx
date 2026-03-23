import React, { useState, useMemo, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Package, AlertTriangle, Search, Plus, X, 
  History, ClipboardCheck, Save, Printer,
  ShoppingCart, RefreshCcw, Truck, TrendingUp, TrendingDown, Loader2
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const StockWaska = ({ type = 'Tous' }) => {

  // ── State ──────────────────────────────────────────────────────────────────
  const [inventory, setInventory]           = useState([]);
  const [movements, setMovements]           = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [activeView, setActiveView]         = useState('catalogue');
  const [searchTerm, setSearchTerm]         = useState('');

  const [traceModal, setTraceModal] = useState({ open: false, product: null, type: null });
  const [traceData, setTraceData]   = useState({ qty: 1, person: '', note: '' });
  const [countedStock, setCountedStock] = useState({});
  const [orderModal, setOrderModal] = useState({ open: false, product: null });
  const [orderData, setOrderData]   = useState({ qty: 0, supplier: '' });

  // ── Modale ajout article ───────────────────────────────────────────────────
  const EMPTY_ARTICLE = { nom: '', categorie: 'Divers', quantite: 0, unite: 'pcs', seuilAlerte: 5, prixAchat: 0, prixVente: 0, caisses: [] };
  const [addModal, setAddModal]     = useState(false);
  const [newArticle, setNewArticle] = useState(EMPTY_ARTICLE);

  // ── Auth ───────────────────────────────────────────────────────────────────
  const authConfig = useCallback(() => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('userToken')}` }
  }), []);

  // ── Normalise un article MongoDB → format attendu par le composant ─────────
  const normalize = (item) => ({
    id:    item._id,
    _id:   item._id,
    name:  item.nom,
    cat:   item.categorie,
    qty:   item.quantite,
    alert: item.seuilAlerte,
    unit:  item.unite,
    price: item.prixAchat
  });

  // ── Charger le stock depuis MongoDB ───────────────────────────────────────
  const fetchStock = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/stocks`, authConfig());
      setInventory(res.data.map(normalize));
    } catch (err) {
      console.error('[Stock] fetchStock:', err.message);
    } finally {
      setLoading(false);
    }
  }, [authConfig]);

  // ── Charger l'historique des mouvements ───────────────────────────────────
  const fetchMovements = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/stocks/movements`, authConfig());
      setMovements(res.data || []);
    } catch (err) {
      console.warn('[Stock] fetchMovements:', err.message);
    }
  }, [authConfig]);

  useEffect(() => {
    fetchStock();
    fetchMovements();
  }, [fetchStock, fetchMovements]);

  // ── Filtrage local (type + recherche) ──────────────────────────────────────
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchType   = type === 'Tous' || (item.cat || '').toLowerCase() === type.toLowerCase();
      const matchSearch = (item.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchType && matchSearch;
    });
  }, [inventory, type, searchTerm]);

  const stockAlerts     = useMemo(() => inventory.filter(i => i.qty <= i.alert), [inventory]);
  const totalStockValue = useMemo(() => inventory.reduce((acc, i) => acc + (i.qty * i.price), 0), [inventory]);

  // ── Imprimer fiche de comptage ─────────────────────────────────────────────
  const printInventorySheet = () => {
    const win  = window.open('', '_blank');
    const rows = filteredInventory.map(item => `
      <tr style="border-bottom:1px solid #eee">
        <td style="padding:12px;font-weight:bold;text-transform:uppercase">${item.name}</td>
        <td style="padding:12px;text-align:center;color:#666">${item.qty} ${item.unit}</td>
        <td style="padding:12px;border:2px solid #333;width:80px"></td>
        <td style="padding:12px"></td>
      </tr>`).join('');
    win.document.write(`
      <html><head><title>Fiche Comptage - Waska</title></head>
      <body style="font-family:sans-serif;padding:40px">
        <h1 style="text-align:center;color:#386D7F">WASKA VILLAGE</h1>
        <h3 style="text-align:center;text-transform:uppercase;border-bottom:2px solid #D17A61;padding-bottom:10px">
          Fiche de Comptage (${type})
        </h3>
        <p>Date: ___________________ &nbsp;&nbsp; Responsable: ___________________</p>
        <table style="width:100%;border-collapse:collapse;margin-top:20px">
          <thead style="background:#f4f4f4">
            <tr>
              <th style="padding:12px;text-align:left">Article</th>
              <th style="padding:12px">Stock Logiciel</th>
              <th style="padding:12px">Réel</th>
              <th style="padding:12px">Observations</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top:50px;display:flex;justify-content:space-between">
          <div>Signature Gestionnaire</div><div>Signature Contrôleur</div>
        </div>
      </body></html>`);
    win.document.close();
    win.print();
  };

  // ── Inventaire physique → PATCH /stocks/bulk-update ───────────────────────
  const submitPhysicalInventory = async () => {
    if (Object.keys(countedStock).length === 0) { alert('Aucune quantité saisie.'); return; }
    setSaving(true);
    try {
      const updates = Object.entries(countedStock).map(([id, quantite]) => ({ id, quantite }));
      await axios.patch(`${API_URL}/stocks/bulk-update`, { updates }, authConfig());
      await fetchStock();
      await fetchMovements();
      setCountedStock({});
      setActiveView('catalogue');
      alert('✅ Inventaire mis à jour !');
    } catch (err) {
      alert('Erreur : ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Mouvement unitaire → PATCH /stocks/:id/movement ───────────────────────
  const confirmMovement = async () => {
    const { product, type: mType } = traceModal;
    if (!traceData.qty || traceData.qty <= 0) { alert('Quantité invalide.'); return; }
    setSaving(true);
    try {
      await axios.patch(
        `${API_URL}/stocks/${product._id}/movement`,
        { type: mType, qty: traceData.qty, person: traceData.person, note: traceData.note },
        authConfig()
      );
      const delta = mType === 'ENTRÉE' ? traceData.qty : -traceData.qty;
      setInventory(prev => prev.map(i => i._id === product._id ? { ...i, qty: Math.max(0, i.qty + delta) } : i));
      setMovements(prev => [{
        id: Date.now(), date: new Date().toLocaleString('fr-FR'),
        art: product.name, type: mType, qty: traceData.qty,
        person: traceData.person || 'Anonyme', reason: traceData.note || 'Mouvement manuel'
      }, ...prev]);
      setTraceModal({ open: false, product: null, type: null });
      setTraceData({ qty: 1, person: '', note: '' });
    } catch (err) {
      alert('Erreur : ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Bon de commande (local) ────────────────────────────────────────────────
  const finalizeOrder = () => {
    setPurchaseOrders(prev => [{ id: `BC-${Date.now().toString().slice(-4)}`, date: new Date().toLocaleDateString('fr-FR'), product: orderModal.product.name, productId: orderModal.product._id, qty: orderData.qty, status: 'EN ATTENTE', supplier: orderData.supplier }, ...prev]);
    setOrderModal({ open: false, product: null });
    setOrderData({ qty: 0, supplier: '' });
    setActiveView('mouvements');
  };

  const handleReceiveOrder = async (order) => {
    try {
      await axios.patch(`${API_URL}/stocks/${order.productId}/movement`, { type: 'ENTRÉE', qty: order.qty, person: 'RAF', note: `BC ${order.id}` }, authConfig());
      setInventory(prev => prev.map(i => i._id === order.productId ? { ...i, qty: i.qty + order.qty } : i));
      setMovements(prev => [{ id: Date.now(), date: new Date().toLocaleString('fr-FR'), art: order.product, type: 'ENTRÉE', qty: order.qty, person: 'RAF', reason: `BC ${order.id}` }, ...prev]);
      setPurchaseOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'LIVRÉ' } : o));
    } catch (err) { alert('Erreur réception : ' + err.message); }
  };

  // ── Ajouter un nouvel article → POST /stocks ──────────────────────────────
  const addArticle = async () => {
    if (!newArticle.nom.trim()) { alert('Le nom est obligatoire.'); return; }
    setSaving(true);
    try {
      const res = await axios.post(`${API_URL}/stocks`, newArticle, authConfig());
      setInventory(prev => [normalize(res.data), ...prev]);
      setAddModal(false);
      setNewArticle(EMPTY_ARTICLE);
    } catch (err) {
      alert('Erreur : ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#fdfcfb]">
      <Loader2 size={36} className="animate-spin text-[#386D7F] mb-3" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chargement du stock...</p>
    </div>
  );

  return (
    <div className="p-6 bg-[#fdfcfb] min-h-screen font-sans text-slate-900">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <h1 className="text-3xl font-black uppercase italic tracking-tighter">
          <span className="text-[#D17A61]">Waska</span>{' '}<span className="text-[#386D7F]">Stock</span>
        </h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
            <input type="text" placeholder="Rechercher un article..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white rounded-xl border border-slate-100 text-[10px] font-bold outline-none focus:ring-2 focus:ring-[#386D7F]/20 w-52" />
          </div>
          <button onClick={() => { fetchStock(); fetchMovements(); }} className="p-2.5 bg-white rounded-xl border border-slate-100 text-[#386D7F] hover:shadow-md transition-all" title="Rafraîchir">
            <RefreshCcw size={16} />
          </button>
          <button
            onClick={() => { setNewArticle(EMPTY_ARTICLE); setAddModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#386D7F] text-white rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-slate-900 transition-all"
          >
            <Plus size={14}/> Nouvel Article
          </button>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
          {[
            { id: 'catalogue',  label: 'Stock',     icon: <Package size={14}/>        },
            { id: 'mouvements', label: 'Flux',       icon: <History size={14}/>        },
            { id: 'alertes',    label: 'Alertes',    icon: <AlertTriangle size={14}/>  },
            { id: 'inventaire', label: 'Inventaire', icon: <ClipboardCheck size={14}/> }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveView(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeView === tab.id ? 'bg-[#386D7F] text-white shadow-lg' : 'text-slate-400 hover:text-[#386D7F]'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPIs ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-[2rem] border-b-4 border-[#386D7F] shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase">Valeur Stock</p>
          <p className="text-2xl font-black">{totalStockValue.toLocaleString()} CFA</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border-b-4 border-[#D17A61] shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase">Alertes Critiques</p>
          <p className="text-2xl font-black text-[#D17A61]">{stockAlerts.length}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase opacity-50">Références</p>
            <p className="text-2xl font-black">{inventory.length}</p>
          </div>
          <Package size={28} className="opacity-20" />
        </div>
      </div>

      {/* ── VUE : CATALOGUE ────────────────────────────────────────────────── */}
      {activeView === 'catalogue' && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#386D7F] text-white text-[9px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">Article</th>
                <th className="px-8 py-5">Catégorie</th>
                <th className="px-8 py-5 text-center">Quantité</th>
                <th className="px-8 py-5 text-center">Seuil</th>
                <th className="px-8 py-5 text-right">Mouvements</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-bold">
              {filteredInventory.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-16 text-center text-slate-300 text-[10px] font-black uppercase">
                  Aucun article{type !== 'Tous' ? ` pour "${type}"` : ''} en base
                </td></tr>
              ) : filteredInventory.map(item => (
                <tr key={item.id} className={`hover:bg-slate-50 ${item.qty <= item.alert ? 'bg-red-50/40' : ''}`}>
                  <td className="px-8 py-4 text-xs font-black uppercase">
                    {item.name}
                    {item.qty <= item.alert && <span className="ml-2 text-[8px] text-red-500 font-black bg-red-50 px-2 py-0.5 rounded-md">⚠ ALERTE</span>}
                  </td>
                  <td className="px-8 py-4 text-[10px] text-slate-400">{item.cat}</td>
                  <td className="px-8 py-4 text-center font-black text-lg">
                    <span className={item.qty <= item.alert ? 'text-[#D17A61]' : 'text-slate-800'}>{item.qty}</span>
                    <span className="text-[9px] text-slate-300 ml-1 font-bold">{item.unit}</span>
                  </td>
                  <td className="px-8 py-4 text-center text-[10px] text-slate-400 font-bold">{item.alert}</td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setTraceModal({ open: true, product: item, type: 'ENTRÉE' }); setTraceData({ qty: 1, person: '', note: '' }); }}
                        className="p-2 text-[#386D7F] hover:bg-[#386D7F] hover:text-white rounded-lg transition-colors" title="Entrée"><TrendingUp size={16}/></button>
                      <button onClick={() => { setTraceModal({ open: true, product: item, type: 'SORTIE' }); setTraceData({ qty: 1, person: '', note: '' }); }}
                        className="p-2 text-[#D17A61] hover:bg-[#D17A61] hover:text-white rounded-lg transition-colors" title="Sortie"><TrendingDown size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── VUE : FLUX ─────────────────────────────────────────────────────── */}
      {activeView === 'mouvements' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-[10px] font-black uppercase text-[#386D7F] tracking-widest px-2 flex items-center gap-2"><Truck size={16}/> Commandes en cours</h3>
            {purchaseOrders.length === 0 ? <p className="text-xs italic text-slate-400 p-4">Aucun bon de commande.</p>
              : purchaseOrders.map(order => (
                <div key={order.id} className="p-4 bg-white rounded-2xl border-l-4 border-[#386D7F] shadow-sm flex justify-between items-center">
                  <div className="text-[10px] font-bold">
                    <p className="uppercase font-black">{order.product}</p>
                    <p className="text-slate-400">{order.qty} unités · {order.supplier || 'N/A'}</p>
                    <p className={`text-[9px] font-black ${order.status === 'LIVRÉ' ? 'text-emerald-500' : 'text-amber-500'}`}>{order.status}</p>
                  </div>
                  {order.status !== 'LIVRÉ' && (
                    <button onClick={() => handleReceiveOrder(order)} className="p-2 bg-[#D17A61] text-white rounded-lg hover:bg-slate-900 transition-all" title="Marquer livré"><Save size={14}/></button>
                  )}
                </div>
              ))}
          </div>
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2 flex items-center gap-2"><History size={16}/> Historique des mouvements</h3>
            <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full text-left text-[10px]">
                <thead className="bg-slate-50 text-slate-400 font-black uppercase">
                  <tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Article</th><th className="px-6 py-4">Type</th><th className="px-6 py-4 text-center">Qté</th><th className="px-6 py-4">Agent / Motif</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-bold uppercase">
                  {movements.length === 0
                    ? <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-300 text-[9px]">Aucun mouvement enregistré</td></tr>
                    : movements.map((m, i) => (
                      <tr key={m.id || i}>
                        <td className="px-6 py-3 text-slate-400">{m.date}</td>
                        <td className="px-6 py-3">{m.art || m.article}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-1 rounded-md text-[9px] ${m.type === 'ENTRÉE' ? 'bg-[#386D7F]/10 text-[#386D7F]' : m.type === 'INVENTAIRE' ? 'bg-slate-100 text-slate-500' : 'bg-[#D17A61]/10 text-[#D17A61]'}`}>{m.type}</span>
                        </td>
                        <td className="px-6 py-3 text-center font-black">{m.qty}</td>
                        <td className="px-6 py-3 text-slate-400">{m.person}<span className="block text-[8px] italic font-normal normal-case">{m.reason}</span></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── VUE : ALERTES ──────────────────────────────────────────────────── */}
      {activeView === 'alertes' && (
        <div>
          {stockAlerts.length === 0 ? (
            <div className="text-center py-20 text-slate-300">
              <Package size={48} className="mx-auto mb-4 opacity-30"/>
              <p className="font-black uppercase text-[10px] tracking-widest">Tous les stocks sont OK</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stockAlerts.map(item => (
                <div key={item.id} className="bg-white p-8 rounded-[2.5rem] border-2 border-[#D17A61]/10 shadow-lg relative">
                  <div className="absolute top-4 right-6 text-[#D17A61]"><AlertTriangle size={24}/></div>
                  <h4 className="font-black text-slate-800 text-lg uppercase mb-1">{item.name}</h4>
                  <p className="text-xs font-bold text-[#D17A61] mb-2 tracking-widest">STOCK CRITIQUE : {item.qty} {item.unit}</p>
                  <p className="text-[9px] text-slate-400 mb-6">Seuil minimum : {item.alert} {item.unit}</p>
                  <button onClick={() => { setOrderModal({ open: true, product: item }); setOrderData({ qty: item.alert * 2, supplier: '' }); }}
                    className="w-full bg-[#386D7F] text-white py-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-slate-900 transition-all">
                    <ShoppingCart size={16}/> Lancer Commande
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── VUE : INVENTAIRE ───────────────────────────────────────────────── */}
      {activeView === 'inventaire' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Comptage physique</h2>
            <div className="flex gap-3">
              <button onClick={printInventorySheet} className="bg-white border-2 border-slate-200 text-slate-600 px-6 py-4 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-slate-50 transition-all">
                <Printer size={18}/> Imprimer Fiche
              </button>
              <button onClick={submitPhysicalInventory} disabled={saving || Object.keys(countedStock).length === 0}
                className="bg-[#D17A61] text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                {saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={18}/>} Valider l'inventaire
              </button>
            </div>
          </div>
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left font-bold uppercase">
              <thead className="bg-slate-900 text-slate-400 text-[9px] font-black tracking-widest">
                <tr><th className="px-8 py-6">Article</th><th className="px-8 py-6 text-center">Logiciel</th><th className="px-8 py-6 text-center">Réel (saisir)</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredInventory.map(item => (
                  <tr key={item.id} className={countedStock[item._id] !== undefined ? 'bg-emerald-50/30' : ''}>
                    <td className="px-8 py-5 text-xs">{item.name}</td>
                    <td className="px-8 py-5 text-center text-slate-400 font-black">{item.qty} <span className="text-[9px] font-bold text-slate-300">{item.unit}</span></td>
                    <td className="px-8 py-5 text-center">
                      <input type="number" autoComplete="off"
                        value={countedStock[item._id] ?? ''}
                        onChange={e => setCountedStock({ ...countedStock, [item._id]: parseInt(e.target.value) || 0 })}
                        className="w-24 text-center py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-[#386D7F] outline-none focus:ring-2 focus:ring-[#386D7F]/20"
                        placeholder="0" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {Object.keys(countedStock).length > 0 && (
            <p className="text-[10px] font-black text-[#386D7F] text-center uppercase tracking-widest">
              {Object.keys(countedStock).length} article{Object.keys(countedStock).length > 1 ? 's' : ''} modifié{Object.keys(countedStock).length > 1 ? 's' : ''} — cliquez "Valider" pour sauvegarder
            </p>
          )}
        </div>
      )}

      {/* ── MODALE MOUVEMENT ───────────────────────────────────────────────── */}
      {traceModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setTraceModal({ open: false })} className="absolute top-8 right-8 text-slate-300 hover:text-slate-500"><X size={24}/></button>
            <h2 className={`text-xl font-black mb-1 uppercase tracking-tighter ${traceModal.type === 'ENTRÉE' ? 'text-[#386D7F]' : 'text-[#D17A61]'}`}>
              {traceModal.type === 'ENTRÉE' ? '+ Entrée Stock' : '− Sortie Stock'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-6">{traceModal.product?.name}</p>
            <div className="space-y-4">
              <div className="bg-slate-50 p-5 rounded-2xl">
                <p className="text-[10px] font-black text-[#386D7F] uppercase mb-1">Quantité</p>
                <input type="number" min="1" autoComplete="off" className="w-full bg-transparent outline-none font-black text-3xl"
                  value={traceData.qty} onChange={e => setTraceData({ ...traceData, qty: parseInt(e.target.value) || 0 })} />
              </div>
              <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm"
                placeholder="Agent responsable" value={traceData.person} onChange={e => setTraceData({ ...traceData, person: e.target.value })} />
              <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm italic"
                placeholder="Motif / note..." value={traceData.note} onChange={e => setTraceData({ ...traceData, note: e.target.value })} />
              <button onClick={confirmMovement} disabled={saving}
                className={`w-full py-5 rounded-[2rem] font-black uppercase text-xs text-white flex items-center justify-center gap-2 disabled:opacity-50 ${traceModal.type === 'ENTRÉE' ? 'bg-[#386D7F]' : 'bg-[#D17A61]'}`}>
                {saving ? <Loader2 size={16} className="animate-spin"/> : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALE BON DE COMMANDE ─────────────────────────────────────────── */}
      {orderModal.open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setOrderModal({ open: false })} className="absolute top-8 right-8 text-slate-300 hover:text-slate-500"><X size={24}/></button>
            <h2 className="text-xl font-black text-[#D17A61] mb-1 uppercase tracking-tighter">Bon de Commande</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-6">{orderModal.product?.name}</p>
            <div className="space-y-4">
              <div className="bg-slate-50 p-5 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Quantité à commander</p>
                <input type="number" min="1" className="w-full bg-transparent outline-none font-black text-3xl text-[#D17A61]"
                  value={orderData.qty} onChange={e => setOrderData({ ...orderData, qty: parseInt(e.target.value) || 0 })} />
              </div>
              <input type="text" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none"
                placeholder="Fournisseur" value={orderData.supplier} onChange={e => setOrderData({ ...orderData, supplier: e.target.value })} />
              <button onClick={finalizeOrder} className="w-full py-6 bg-[#386D7F] text-white rounded-[2rem] font-black uppercase text-xs flex items-center justify-center gap-2 shadow-xl hover:bg-slate-900 transition-all">
                <ShoppingCart size={18}/> Envoyer à la RAF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALE AJOUT ARTICLE ───────────────────────────────────────────── */}
      {addModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/50">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-lg shadow-2xl relative">
            <button onClick={() => setAddModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-500">
              <X size={24}/>
            </button>
            <h2 className="text-xl font-black text-[#386D7F] mb-1 uppercase tracking-tighter flex items-center gap-3">
              <Plus size={20}/> Nouvel Article
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-8">Ajouter une référence au stock</p>

            <div className="space-y-4">
              {/* Nom */}
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1 mb-1.5 block">Nom de l'article *</label>
                <input
                  type="text" autoFocus
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-sm focus:ring-2 focus:ring-[#386D7F]/20"
                  placeholder="Ex : Bière Flag 65cl, Savon invité..."
                  value={newArticle.nom}
                  onChange={e => setNewArticle({ ...newArticle, nom: e.target.value })}
                />
              </div>

              {/* Catégorie + Unité */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1 mb-1.5 block">Catégorie</label>
                  <select
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-sm focus:ring-2 focus:ring-[#386D7F]/20"
                    value={newArticle.categorie}
                    onChange={e => setNewArticle({ ...newArticle, categorie: e.target.value })}
                  >
                    {['Boisson', 'Nourriture', 'Entretien', 'Bar', 'Cuisine', 'Hôtel', 'Divers'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1 mb-1.5 block">Unité</label>
                  <select
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-sm focus:ring-2 focus:ring-[#386D7F]/20"
                    value={newArticle.unite}
                    onChange={e => setNewArticle({ ...newArticle, unite: e.target.value })}
                  >
                    {['pcs', 'Bouteilles', 'Portions', 'Boîtes', 'kg', 'L', 'Sacs', 'Unités', 'Cartons'].map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantité initiale + Seuil alerte */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-5 rounded-2xl">
                  <label className="text-[9px] font-black uppercase text-[#386D7F] mb-1 block">Quantité initiale</label>
                  <input
                    type="number" min="0"
                    className="w-full bg-transparent outline-none font-black text-2xl"
                    value={newArticle.quantite}
                    onChange={e => setNewArticle({ ...newArticle, quantite: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl">
                  <label className="text-[9px] font-black uppercase text-[#D17A61] mb-1 block">Seuil d'alerte</label>
                  <input
                    type="number" min="0"
                    className="w-full bg-transparent outline-none font-black text-2xl"
                    value={newArticle.seuilAlerte}
                    onChange={e => setNewArticle({ ...newArticle, seuilAlerte: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Prix d'achat */}
              <div className="bg-slate-900 p-5 rounded-2xl">
                <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Prix d'achat unitaire (CFA)</label>
                <input
                  type="number" min="0"
                  className="w-full bg-transparent outline-none font-black text-2xl text-white"
                  placeholder="0"
                  value={newArticle.prixAchat || ''}
                  onChange={e => setNewArticle({ ...newArticle, prixAchat: parseInt(e.target.value) || 0 })}
                />
              </div>

              {/* Prix de vente + Caisses */}
              <div className="bg-[#386D7F]/10 p-5 rounded-2xl border border-[#386D7F]/20">
                <label className="text-[9px] font-black uppercase text-[#386D7F] mb-3 block flex items-center gap-1">
                  Vente en Caisse (optionnel)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block">Prix de vente (CFA)</label>
                    <input
                      type="number" min="0"
                      className="w-full p-3 bg-white rounded-xl font-black text-lg outline-none border border-slate-200"
                      placeholder="0 = non vendable"
                      value={newArticle.prixVente || ''}
                      onChange={e => setNewArticle({ ...newArticle, prixVente: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block">Visible dans</label>
                    <div className="space-y-1">
                      {['bar', 'resto'].map(caisse => (
                        <label key={caisse} className="flex items-center gap-2 text-[10px] font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(newArticle.caisses || []).includes(caisse)}
                            onChange={e => {
                              const caisses = newArticle.caisses || [];
                              setNewArticle({
                                ...newArticle,
                                caisses: e.target.checked
                                  ? [...caisses, caisse]
                                  : caisses.filter(c => c !== caisse)
                              });
                            }}
                            className="rounded"
                          />
                          {caisse === 'bar' ? '🍺 Bar' : '🍽 Resto'}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                {newArticle.prixVente > 0 && newArticle.caisses?.length === 0 && (
                  <p className="text-[8px] text-amber-500 font-bold mt-2">⚠ Sélectionnez au moins une caisse</p>
                )}
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setAddModal(false)}
                  className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={addArticle}
                  disabled={saving || !newArticle.nom.trim()}
                  className="flex-1 py-4 bg-[#386D7F] hover:bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StockWaska;