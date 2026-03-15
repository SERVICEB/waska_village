import React, { useState, useMemo, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, Plus, Minus, CreditCard, Banknote, 
  Utensils, Beer, History, LogOut, Printer, 
  Undo2, LayoutGrid, X, AlertCircle, Tag, CheckCircle 
} from 'lucide-react';

// --- CONFIGURATION API ---
const API_URL = "http://localhost:5000/api"; 

// --- COMPOSANT REÇU IMPRIMABLE ---
const TicketClient = React.forwardRef(({ vente, type }, ref) => {
  if (!vente) return null;
  return (
    <div ref={ref} className="print-only p-4 w-[80mm] bg-white text-black font-mono text-[12px] leading-tight">
      <div className="text-center border-b border-dashed border-black pb-2 mb-2">
        <h2 className="text-lg font-black uppercase">WASKA VILLAGE</h2>
        <p className="text-[10px]">Merci d'être passé !</p>
        <p className="text-[9px] mt-1">{new Date().toLocaleDateString()} - {vente.heure || new Date().toLocaleTimeString()}</p>
        <p className="font-bold mt-1 text-[11px]">
          {vente.table ? `TABLE: ${vente.table}` : 'VENTE COMPTOIR'}
        </p>
        <p className="text-[9px]">Ticket: #{vente._id ? vente._id.toString().slice(-4) : 'TEMP'}</p>
      </div>

      <div className="space-y-1 mb-2">
        <div className="flex justify-between font-bold border-b border-black pb-1 mb-1 uppercase text-[9px]">
          <span>Désignation</span>
          <span>Total</span>
        </div>
        {vente.items.map((item, i) => (
          <div key={i} className="flex justify-between items-start">
            <span className="flex-1 pr-2 uppercase">{item.qty}x {item.name}</span>
            <span className="font-bold">{(item.qty * item.price).toLocaleString()} F</span>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-black pt-2 space-y-1">
        <div className="flex justify-between">
          <span>Sous-Total:</span>
          <span>{vente.subTotal.toLocaleString()} F</span>
        </div>
        {vente.remise > 0 && (
          <div className="flex justify-between font-bold">
            <span>Remise:</span>
            <span>-{vente.remise.toLocaleString()} F</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-black border-t border-black pt-1 mt-1">
          <span>NET A PAYER:</span>
          <span>{vente.total.toLocaleString()} F</span>
        </div>
        <p className="text-[9px] italic mt-2 text-center uppercase">Mode de paiement: {vente.mode}</p>
      </div>

      <div className="text-center mt-6 border-t border-black pt-2 italic text-[10px]">
        À bientôt à Waska Village !
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @media screen { .print-only { display: none; } }
        @media print { 
          body * { visibility: hidden; }
          .print-only, .print-only * { visibility: visible; }
          .print-only { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}} />
    </div>
  );
});

const Caisse = ({ type }) => {
  // --- ÉTATS ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]); 
  const [selectedTable, setSelectedTable] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("⭐ FAVORIS");
  const [sessionJournal, setSessionJournal] = useState([]);
  const [showJournal, setShowJournal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showClotureReport, setShowClotureReport] = useState(false);
  const [discount, setDiscount] = useState(0); 
  const [lastVente, setLastVente] = useState(null);
  const ticketRef = useRef();
  const [refundingItem, setRefundingItem] = useState(null);
  const [refundReason, setRefundReason] = useState("");

  // --- CHARGEMENT DES DONNÉES DEPUIS LE BACKEND ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Charger les produits par type
        const prodRes = await axios.get(`${API_URL}/products?type=${type}`);
        setProducts(prodRes.data);
        
        // Charger les ventes du jour pour le journal
        const salesRes = await axios.get(`${API_URL}/sales/today?type=${type}`);
        setSessionJournal(salesRes.data);
      } catch (err) {
        console.error("Erreur de chargement:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [type]);

  // --- LOGIQUE DES FAVORIS ---
  const favoriteIds = useMemo(() => {
    const counts = {};
    sessionJournal.forEach(v => {
      if (v.status === 'VALIDÉ') {
        v.items.forEach(item => { 
            const id = item.product || item.id;
            counts[id] = (counts[id] || 0) + item.qty; 
        });
      }
    });
    return Object.keys(counts).filter(id => counts[id] >= 2);
  }, [sessionJournal]);

  const categories = ["⭐ FAVORIS", "TOUS", ...new Set(products.map(p => p.category))];

  const filteredProducts = useMemo(() => {
    if (activeCategory === "⭐ FAVORIS") {
      const favs = products.filter(p => favoriteIds.includes(p._id || p.id));
      return favs.length > 0 ? favs : products.slice(0, 4); 
    }
    return products.filter(p => 
      (activeCategory === "TOUS" || p.category === activeCategory) && 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activeCategory, searchTerm, products, favoriteIds]);

  const statsCloture = useMemo(() => {
    const valid = sessionJournal.filter(v => v.status === 'VALIDÉ');
    return {
      total: valid.reduce((acc, v) => acc + v.total, 0),
      cash: valid.filter(v => v.mode === 'CASH').reduce((acc, v) => acc + v.total, 0),
      mobile: valid.filter(v => v.mode === 'MOBILE').reduce((acc, v) => acc + v.total, 0),
      totalRemises: valid.reduce((acc, v) => acc + (v.remise || 0), 0),
      nb: sessionJournal.length
    };
  }, [sessionJournal]);

  const addToCart = (product) => {
    const existing = cart.find(item => (item._id || item.id) === (product._id || product.id));
    if (existing) {
      setCart(cart.map(item => (item._id || item.id) === (product._id || product.id) ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const subTotal = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
  const discountAmount = (subTotal * discount) / 100;
  const netTotal = subTotal - discountAmount;

  // --- VALIDATION ET ENVOI AU BACKEND ---
  const handleValidateVente = async (mode) => {
    if (cart.length === 0) return;
    if (type === 'resto' && !selectedTable) return alert("Sélectionnez une table.");

    const nouvelleVente = {
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      items: cart.map(item => ({
        product: item._id, 
        name: item.name,
        qty: item.qty,
        price: item.price
      })),
      subTotal: subTotal,
      remise: discountAmount,
      total: netTotal,
      table: selectedTable,
      mode: mode,
      type: type,
      status: 'VALIDÉ'
    };

    try {
        const res = await axios.post(`${API_URL}/sales`, nouvelleVente);
        setSessionJournal([res.data, ...sessionJournal]);
        setLastVente(res.data);
        setShowSuccess(true);

        setTimeout(() => {
          window.print();
          setShowSuccess(false);
          setCart([]);
          setDiscount(0);
          if (type === 'resto') setSelectedTable(null);
        }, 500);
    } catch (err) {
        alert("Erreur lors de l'enregistrement de la vente.");
    }
  };

  const processRefund = async () => {
    if (!refundReason) return alert("Motif requis.");
    try {
        await axios.patch(`${API_URL}/sales/${refundingItem._id}`, {
            status: 'REMBOURSÉ',
            motif: refundReason
        });
        setSessionJournal(sessionJournal.map(v => 
          v._id === refundingItem._id ? { ...v, status: 'REMBOURSÉ', motif: refundReason, total: 0 } : v
        ));
        setRefundingItem(null);
        setRefundReason("");
    } catch (err) {
        alert("Erreur lors de l'annulation.");
    }
  };

   /**
   * Finalise la session de vente et transmet le rapport au serveur
   */
  const finaliserCloture = async () => {
    // 1. Préparation de la configuration (Auth)
    const token = localStorage.getItem('userToken');
    
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    // 2. Construction du rapport (harmonisé avec ton backend)
    const rapportCloture = {
      type: type, // 'bar' ou 'resto'
      montantEspeces: statsCloture.cash,
      montantMobile: statsCloture.mobile,
      totalVentes: statsCloture.total,
      nbTickets: statsCloture.nb,
      dateCloture: new Date().toISOString()
    };

    try {
      // 3. Envoi au serveur
      await axios.post(`${API_URL}/clotures`, rapportCloture, config);

      // 4. Mise à jour de l'interface en cas de succès
      setSessionJournal([]);
      setShowClotureReport(false);
      
      alert("✅ Session clôturée et transmise avec succès.");
      
      // Optionnel : Rediriger ou rafraîchir pour repartir à zéro
      // window.location.reload();

    } catch (err) {
      // 5. Gestion des erreurs spécifique
      console.error("Détails erreur clôture:", err.response?.data);
      
      const status = err.response?.status;
      if (status === 401) {
        alert("⚠️ Session expirée. Veuillez vous reconnecter.");
      } else if (status === 403) {
        alert("🚫 Vous n'avez pas les droits nécessaires pour clôturer.");
      } else {
        alert("❌ Erreur lors de la clôture. Vérifiez votre connexion serveur.");
      }
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#FDFBF9]">
        <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#D17A61] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Waska Village...</p>
        </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#FDFBF9] font-sans overflow-hidden relative text-slate-900">
      
      {/* COMPOSANT REÇU */}
      <TicketClient ref={ticketRef} vente={lastVente} type={type} />

      {/* MODALE REMBOURSEMENT */}
      {refundingItem && (
        <div className="absolute inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl">
            <div className="text-center mb-4 text-red-600 flex flex-col items-center">
              <AlertCircle size={40} className="mb-2" />
              <h3 className="font-black uppercase text-[10px]">Remboursement</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1 italic">{refundingItem.subTotal.toLocaleString()} F à annuler</p>
            </div>
            <textarea className="w-full border border-slate-200 rounded-xl p-3 text-[10px] outline-none mb-4 h-20 resize-none font-bold" placeholder="Motif de l'annulation..." value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={() => setRefundingItem(null)} className="flex-1 py-3 bg-slate-100 text-slate-400 rounded-xl font-black text-[9px] uppercase">Retour</button>
              <button onClick={processRefund} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black text-[9px] uppercase">Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE CLÔTURE */}
      {showClotureReport && (
        <div className="absolute inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 bg-slate-50 border-b flex justify-between items-center">
              <h2 className="text-xs font-black uppercase tracking-tighter text-[#386D7F]">Fin de Service</h2>
              <button onClick={() => setShowClotureReport(false)}><X size={18}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase">Recette Nette</p>
                  <p className="text-xl font-black text-[#386D7F]">{statsCloture.total.toLocaleString()} F</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase">Total Ventes</p>
                  <p className="text-xl font-black text-[#D17A61]">{statsCloture.nb}</p>
                </div>
              </div>
              <div className="space-y-2 border-t pt-4 text-[10px] font-bold text-slate-500 uppercase">
                <div className="flex justify-between"><span>💰 ESPÈCES</span><span className="text-slate-900">{statsCloture.cash.toLocaleString()} F</span></div>
                <div className="flex justify-between"><span>📱 MOBILE MONEY</span><span className="text-slate-900">{statsCloture.mobile.toLocaleString()} F</span></div>
                <div className="flex justify-between text-red-500 font-black"><span>🎁 REMISES TOTALES</span><span>-{statsCloture.totalRemises.toLocaleString()} F</span></div>
              </div>
            </div>
            <div className="p-6 bg-white border-t flex gap-3">
              <button onClick={() => window.print()} className="flex-1 py-3 bg-slate-100 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 transition-all active:scale-95"><Printer size={14}/> Imprimer Rapport</button>
              <button onClick={finaliserCloture} className="flex-1 py-3 bg-[#D17A61] text-white rounded-xl text-[9px] font-black uppercase shadow-lg active:scale-95">Valider Clôture</button>
            </div>
          </div>
        </div>
      )}

      {/* --- COLONNE GAUCHE --- */}
      <div className="flex-1 flex flex-col p-3 overflow-hidden">
        <div className="flex justify-between items-center mb-2 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg text-white ${type === 'bar' ? 'bg-[#386D7F]' : 'bg-[#D17A61]'}`}>
              {type === 'bar' ? <Beer size={14} /> : <Utensils size={14} />}
            </div>
            <div>
              <h1 className="text-[10px] font-black uppercase italic leading-none">
                <span className="text-[#D17A61]">WASKA</span> VILLAGE
              </h1>
              <p className="text-[8px] font-bold text-slate-400 uppercase">Gestion {type}</p>
            </div>
            <div className="flex gap-1 ml-4 border-l pl-4">
              <button onClick={() => setShowJournal(!showJournal)} className={`text-[8px] font-black px-2 py-1 rounded uppercase flex items-center gap-1 transition-all ${showJournal ? 'bg-[#386D7F] text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}>
                {showJournal ? <LayoutGrid size={12}/> : <History size={12}/>} {showJournal ? "Vendre" : "Journal"}
              </button>
              <button onClick={() => setShowClotureReport(true)} className="text-[8px] font-black bg-red-50 text-red-600 px-2 py-1 rounded uppercase flex items-center gap-1 transition-all hover:bg-red-600 hover:text-white shadow-sm"><LogOut size={12}/> Clôturer</button>
            </div>
          </div>
          <div className="relative w-40">
            <Search className="absolute left-2 top-1.5 text-slate-400" size={12} />
            <input type="text" placeholder="Recherche..." className="w-full pl-7 pr-3 py-1 rounded-lg border border-slate-200 text-[10px] outline-none font-bold focus:border-[#386D7F]" onChange={(e)=>setSearchTerm(e.target.value)} />
          </div>
        </div>

        {!showJournal ? (
          <>
            {type === 'resto' && (
              <div className="flex flex-wrap gap-1 mb-2 bg-white/50 p-1 rounded-xl">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 'VIP'].map(t => (
                  <button key={t} onClick={() => setSelectedTable(t)} className={`px-3 py-1 rounded-lg text-[9px] font-black border transition-all ${selectedTable === t ? 'bg-[#D17A61] border-[#D17A61] text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400'}`}>T-{t}</button>
                ))}
              </div>
            )}
            <div className="flex gap-1 mb-3 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-1.5 rounded-full text-[8px] font-black border uppercase transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-[#386D7F] text-white border-[#386D7F] shadow-md' : 'bg-white text-slate-400 border-slate-200'}`}>{cat}</button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pb-10">
                {filteredProducts.map(p => (
                  <button key={p._id || p.id} onClick={() => addToCart(p)} className="bg-white p-2.5 rounded-2xl shadow-sm border-2 border-transparent hover:border-[#D17A61] text-left transition-all active:scale-95 relative overflow-hidden group">
                    {favoriteIds.includes(p._id || p.id) && <div className="absolute top-0 right-0 bg-[#386D7F] text-[6px] font-black px-1.5 py-0.5 rounded-bl-lg text-white uppercase">TOP</div>}
                    <p className="text-[7px] font-black text-slate-300 uppercase mb-1">{p.category}</p>
                    <p className="font-bold text-slate-700 text-[10px] leading-tight h-7 line-clamp-2 uppercase">{p.name}</p>
                    <p className="text-[#D17A61] font-black text-[10px] mt-1">{p.price.toLocaleString()} F</p>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl p-4 h-full border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-2 duration-300 shadow-sm">
             <h2 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest flex items-center gap-2 border-b pb-2">
               <History size={14} className="text-[#386D7F]"/> Activité de session
             </h2>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
               <div className="bg-[#386D7F] p-3 rounded-2xl border border-[#386D7F]/20 shadow-inner">
                 <p className="text-[7px] font-black text-white/60 uppercase mb-1">Recette Net</p>
                 <p className="text-sm font-black text-white">{statsCloture.total.toLocaleString()} F</p>
               </div>
               <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-center">
                 <p className="text-[7px] font-black text-slate-400 uppercase mb-1 flex items-center justify-center gap-1"><Banknote size={8} className="text-green-500"/> Cash</p>
                 <p className="text-sm font-black text-slate-800">{statsCloture.cash.toLocaleString()} F</p>
               </div>
               <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-center">
                 <p className="text-[7px] font-black text-slate-400 uppercase mb-1 flex items-center justify-center gap-1"><CreditCard size={8} className="text-blue-400"/> Mobile</p>
                 <p className="text-sm font-black text-slate-800">{statsCloture.mobile.toLocaleString()} F</p>
               </div>
               <div className="bg-red-50 p-3 rounded-2xl border border-red-100 shadow-sm text-center">
                 <p className="text-[7px] font-black text-red-400 uppercase mb-1 flex items-center justify-center gap-1"><Tag size={8}/> Remises</p>
                 <p className="text-sm font-black text-red-600">-{statsCloture.totalRemises.toLocaleString()} F</p>
               </div>
             </div>
             <div className="flex-1 overflow-y-auto space-y-3 pr-1">
               {sessionJournal.map(v => (
                 <div key={v._id || v.id} className={`p-3 rounded-2xl border transition-all ${v.status === 'REMBOURSÉ' ? 'bg-red-50 border-red-100 opacity-60' : 'bg-[#FDFBF9] border-slate-100 shadow-sm'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-black text-[#386D7F] uppercase">Ticket #{(v._id || v.id).toString().slice(-4)}</p>
                          {v.status === 'REMBOURSÉ' ? <span className="text-[7px] bg-red-600 text-white px-1.5 rounded font-black uppercase">Annulé</span> : <span className={`text-[7px] px-1.5 rounded font-black uppercase ${v.mode === 'CASH' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{v.mode}</span>}
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">{v.heure} {v.table ? `• Table ${v.table}` : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-[12px] ${v.status === 'REMBOURSÉ' ? 'line-through text-slate-400' : 'text-slate-900'}`}>{v.total.toLocaleString()} F</p>
                        {v.remise > 0 && v.status !== 'REMBOURSÉ' && <p className="text-[8px] text-[#D17A61] font-bold italic">Remise -{v.remise.toLocaleString()} F</p>}
                      </div>
                      {v.status !== 'REMBOURSÉ' && <button onClick={() => setRefundingItem(v)} className="ml-3 p-2 text-slate-300 hover:text-red-600 transition-all"><Undo2 size={16}/></button>}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200/50 space-y-1">
                      {v.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-[9px] text-slate-500 font-bold uppercase italic"><span>{item.qty}x {item.name}</span><span>{(item.price * item.qty).toLocaleString()} F</span></div>
                      ))}
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>

      {/* --- COLONNE DROITE : PANIER --- */}
      <div className="w-[280px] bg-white border-l border-slate-200 flex flex-col shadow-2xl relative">
        {showSuccess && (
          <div className="absolute inset-0 bg-white/95 z-[250] flex flex-col items-center justify-center p-4 animate-in zoom-in duration-150">
            <div className="bg-[#386D7F] text-white p-3 rounded-full mb-3 shadow-lg animate-bounce">
              <CheckCircle size={30} />
            </div>
            <h3 className="font-black text-slate-800 uppercase text-[10px]">Vente Enregistrée</h3>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">Impression du ticket...</p>
          </div>
        )}
        
        <div className="p-3 border-b bg-slate-50 flex justify-between items-center text-[9px] font-black uppercase text-slate-400">
          <span>Panier Client</span>
          {selectedTable && <span className="bg-[#D17A61] text-white px-2 py-0.5 rounded shadow-sm">Table {selectedTable}</span>}
        </div>
        
        <div className="flex-1 p-2 overflow-y-auto space-y-1 bg-[#FDFBF9]">
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-slate-400">
              <LayoutGrid size={40} className="mb-2"/>
              <p className="text-[9px] font-black uppercase">Sélectionnez des articles</p>
            </div>
          )}
          {cart.map(item => (
            <div key={item._id || item.id} className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-100 shadow-sm animate-in fade-in duration-150">
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-[9px] font-black text-slate-800 truncate leading-none mb-1 uppercase tracking-tight">{item.name}</p>
                <p className="text-[9px] text-[#D17A61] font-black">{(item.price * item.qty).toLocaleString()} F</p>
              </div>
              <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded border border-slate-200 shadow-sm">
                <button onClick={() => addToCart(item)} className="p-0.5 text-slate-400 hover:text-[#386D7F]"><Plus size={10}/></button>
                <span className="text-[9px] font-black w-4 text-center">{item.qty}</span>
                <button onClick={() => { if(item.qty > 1) setCart(cart.map(it => (it._id || it.id) === (item._id || item.id) ? {...it, qty: it.qty - 1} : it)); else setCart(cart.filter(it => (it._id || it.id) !== (item._id || item.id))); }} className="p-0.5 text-slate-400 hover:text-red-500"><Minus size={10}/></button>
              </div>
            </div>
          ))}
        </div>

        {/* SECTION PAIEMENT */}
        <div className="p-4 bg-slate-900 text-white rounded-t-[2rem] shadow-2xl">
          <div className="flex gap-1 mb-4 overflow-x-auto scrollbar-hide pb-1">
            <span className="text-[7px] font-black uppercase text-slate-500 mr-2 self-center">Remise</span>
            {[0, 5, 10, 15, 20].map(val => (
              <button key={val} onClick={() => setDiscount(val)} className={`px-3 py-1 rounded-full text-[8px] font-black border transition-all ${discount === val ? 'bg-[#D17A61] border-[#D17A61] text-white shadow-lg' : 'border-slate-700 text-slate-500'}`}>{val === 0 ? 'FIXE' : `${val}%`}</button>
            ))}
          </div>
          <div className="space-y-1 mb-4">
            <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest"><span>Sous-total</span><span>{subTotal.toLocaleString()} F</span></div>
            {discount > 0 && <div className="flex justify-between text-[9px] font-bold text-[#D17A61] uppercase"><span>Remise ({discount}%)</span><span>-{discountAmount.toLocaleString()} F</span></div>}
            <div className="flex justify-between items-end pt-1 border-t border-slate-800">
              <span className="text-[#386D7F] text-[8px] font-black uppercase tracking-widest leading-none">Net à Payer</span>
              <div className="text-right">
                <span className="block text-2xl font-black text-[#D17A61] tracking-tighter leading-none">{netTotal.toLocaleString()}</span>
                <span className="text-[7px] font-bold text-slate-500 uppercase">FCFA</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button onClick={() => handleValidateVente('CASH')} className="py-2.5 bg-slate-800 rounded-xl text-[8px] font-black flex flex-col items-center justify-center gap-1 border border-slate-700 active:scale-95 uppercase hover:bg-slate-700 transition-all shadow-md">
              <Banknote size={14} className="text-green-500"/> Espèces
            </button>
            <button onClick={() => handleValidateVente('MOBILE')} className="py-2.5 bg-slate-800 rounded-xl text-[8px] font-black flex flex-col items-center justify-center gap-1 border border-slate-700 active:scale-95 uppercase hover:bg-slate-700 transition-all shadow-md">
              <CreditCard size={14} className="text-blue-400"/> Mobile
            </button>
          </div>
          <button 
            disabled={cart.length === 0} 
            onClick={() => handleValidateVente('CASH')} 
            className="w-full bg-[#D17A61] disabled:bg-slate-800 py-3 rounded-xl font-black text-[9px] text-white uppercase tracking-[0.2em] shadow-lg active:scale-95 flex items-center justify-center gap-2 transition-all hover:bg-[#b96952]"
          >
            <Printer size={12}/> Encaisser & Reçu
          </button>
        </div>
      </div>
    </div>
  );
};

export default Caisse;