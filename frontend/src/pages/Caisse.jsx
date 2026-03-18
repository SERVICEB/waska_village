import React, { useState, useMemo, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, Plus, Minus, CreditCard, Banknote, 
  Utensils, Beer, History, LogOut, Printer, 
  Undo2, LayoutGrid, X, AlertCircle, Tag, CheckCircle 
} from 'lucide-react';

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

  const getAuthConfig = () => {
    const token = localStorage.getItem('userToken');
    return { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } };
  };

  // --- CHARGEMENT INITIAL FILTRÉ ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const config = getAuthConfig();
        const prodRes = await axios.get(`${API_URL}/products?type=${type}`, config);
        setProducts(prodRes.data);
        
        const salesRes = await axios.get(`${API_URL}/sales/today?type=${type}`, config);
        // CRUCIAL: On ne charge que les ventes qui n'ont pas encore de clotureId
        const ventesOuvertes = salesRes.data.filter(v => !v.clotureId && v.status === 'VALIDÉ');
        setSessionJournal(ventesOuvertes);
      } catch (err) {
        console.error("Erreur chargement:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [type]);

  const statsCloture = useMemo(() => {
    const valid = sessionJournal.filter(v => v.status === 'VALIDÉ');
    return {
      total: valid.reduce((acc, v) => acc + v.total, 0),
      cash: valid.filter(v => v.mode === 'CASH').reduce((acc, v) => acc + v.total, 0),
      mobile: valid.filter(v => v.mode === 'MOBILE').reduce((acc, v) => acc + v.total, 0),
      totalRemises: valid.reduce((acc, v) => acc + (v.remise || 0), 0),
      nb: valid.length
    };
  }, [sessionJournal]);

  const favoriteIds = useMemo(() => {
    const counts = {};
    sessionJournal.forEach(v => {
      v.items.forEach(item => { 
          const id = item.product?._id || item.product || item.id;
          if (id) counts[id] = (counts[id] || 0) + item.qty; 
      });
    });
    return Object.keys(counts).filter(id => counts[id] >= 2);
  }, [sessionJournal]);

  const categories = ["⭐ FAVORIS", "TOUS", ...new Set(products.map(p => p.category || p.categorie))];

  const filteredProducts = useMemo(() => {
    if (activeCategory === "⭐ FAVORIS") {
      const favs = products.filter(p => favoriteIds.includes(p._id));
      return favs.length > 0 ? favs : products.slice(0, 6); 
    }
    return products.filter(p => 
      (activeCategory === "TOUS" || (p.category || p.categorie) === activeCategory) && 
      (p.name || p.nom).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activeCategory, searchTerm, products, favoriteIds]);

  const addToCart = (product) => {
    const productId = product._id;
    const existing = cart.find(item => item._id === productId);
    if (existing) {
      setCart(cart.map(item => item._id === productId ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, name: product.name || product.nom, price: product.price || product.prixVente, qty: 1 }]);
    }
  };

  const subTotal = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
  const discountAmount = (subTotal * discount) / 100;
  const netTotal = subTotal - discountAmount;

  const handleValidateVente = async (mode) => {
    if (cart.length === 0) return;
    if (type === 'resto' && !selectedTable) return alert("Sélectionnez une table.");

    const nouvelleVente = {
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      items: cart.map(item => ({ product: item._id, name: item.name, qty: item.qty, price: item.price })),
      subTotal, remise: discountAmount, total: netTotal, table: selectedTable, mode, type, status: 'VALIDÉ'
    };

    try {
        const res = await axios.post(`${API_URL}/sales`, nouvelleVente, getAuthConfig());
        setSessionJournal([res.data, ...sessionJournal]);
        setLastVente(res.data);
        setShowSuccess(true);
        setCart([]); setDiscount(0);
        if (type === 'resto') setSelectedTable(null);
        
        setTimeout(() => {
          setShowSuccess(false);
          window.print();
        }, 600);
    } catch (err) { alert("Erreur lors de l'envoi."); }
  };

  // --- CLÔTURE CORRIGÉE POUR LA RAF ---
  const finaliserCloture = async () => {
    const rapport = {
      pointDeVente: type,
      totalVentes: Number(statsCloture.total), // Champ direct pour le Dashboard
      stats: {
        theorique: {
          total: Number(statsCloture.total),
          cash: Number(statsCloture.cash),
          mobile: Number(statsCloture.mobile)
        }
      },
      ventesIds: sessionJournal.map(v => v._id)
    };

    try {
      await axios.post(`${API_URL}/clotures`, rapport, getAuthConfig());
      
      // RESET COMPLET
      setSessionJournal([]); 
      setCart([]);
      setLastVente(null);
      setShowClotureReport(false);
      setShowJournal(false);

      alert("✅ Session clôturée. Données envoyées à la RAF.");
      window.location.reload(); // Force la remise à zéro propre
    } catch (err) { alert("❌ Erreur clôture."); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-[#386D7F]">WASKA ENGINE...</div>;

  return (
    <div className="flex h-screen bg-[#FDFBF9] font-sans overflow-hidden relative text-slate-900">
      <TicketClient ref={ticketRef} vente={lastVente} type={type} />

      {/* --- MODALE ANNULATION --- */}
      {refundingItem && (
        <div className="absolute inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl">
            <h3 className="font-black uppercase text-[10px] text-center mb-4">Annuler la vente</h3>
            <textarea className="w-full border rounded-xl p-3 text-[10px] mb-4 h-20 outline-none" placeholder="Motif..." value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={() => setRefundingItem(null)} className="flex-1 py-3 bg-slate-100 rounded-xl text-[9px] font-black">RETOUR</button>
              <button onClick={async () => {
                try {
                  await axios.patch(`${API_URL}/sales/${refundingItem._id}`, { status: 'REMBOURSÉ', motif: refundReason }, getAuthConfig());
                  setSessionJournal(sessionJournal.filter(v => v._id !== refundingItem._id));
                  setRefundingItem(null); setRefundReason("");
                } catch(e) { alert("Erreur"); }
              }} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-[9px] font-black">CONFIRMER</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODALE CLÔTURE --- */}
      {showClotureReport && (
        <div className="absolute inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-xs font-black uppercase text-[#386D7F]">Rapport de Fin de Service</h2>
              <button onClick={() => setShowClotureReport(false)} className="text-slate-400 hover:text-red-500"><X size={20}/></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#386D7F] p-5 rounded-3xl text-white shadow-lg">
                  <p className="text-[8px] font-black uppercase opacity-60">Recette Net</p>
                  <p className="text-2xl font-black">{statsCloture.total.toLocaleString()} F</p>
                </div>
                <div className="bg-slate-50 p-5 rounded-3xl border text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase">Tickets</p>
                  <p className="text-2xl font-black text-slate-800">{statsCloture.nb}</p>
                </div>
              </div>
              <div className="space-y-3 border-t pt-6 text-[11px] font-bold uppercase tracking-widest">
                <div className="flex justify-between text-slate-500"><span>💰 Espèces</span><span className="text-slate-900">{statsCloture.cash.toLocaleString()} F</span></div>
                <div className="flex justify-between text-slate-500"><span>📱 Mobile Money</span><span className="text-slate-900">{statsCloture.mobile.toLocaleString()} F</span></div>
                <div className="flex justify-between text-red-400"><span>🎁 Remises</span><span>-{statsCloture.totalRemises.toLocaleString()} F</span></div>
              </div>
            </div>
            <div className="p-8 border-t bg-slate-50 flex gap-3">
              <button onClick={finaliserCloture} className="flex-1 py-4 bg-[#D17A61] text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-[#D17A61]/30 hover:bg-slate-900 transition-all">Valider & Réinitialiser</button>
            </div>
          </div>
        </div>
      )}

      {/* --- COLONNE PRINCIPALE --- */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl text-white shadow-md ${type === 'bar' ? 'bg-[#386D7F]' : 'bg-[#D17A61]'}`}>
              {type === 'bar' ? <Beer size={18} /> : <Utensils size={18} />}
            </div>
            <div>
              <h1 className="text-[11px] font-black uppercase italic tracking-tighter">WASKA <span className="text-[#D17A61]">VILLAGE</span></h1>
              <p className="text-[8px] font-bold text-slate-400 uppercase">{type === 'bar' ? 'Espace Bar' : 'Cuisine & Resto'}</p>
            </div>
            <div className="flex gap-1 ml-6 border-l pl-6">
              <button onClick={() => setShowJournal(!showJournal)} className={`text-[9px] font-black px-4 py-2 rounded-xl uppercase flex items-center gap-2 transition-all ${showJournal ? 'bg-[#386D7F] text-white' : 'bg-slate-50 text-slate-500'}`}>
                {showJournal ? <LayoutGrid size={14}/> : <History size={14}/>} {showJournal ? "Vendre" : "Journal"}
              </button>
              <button onClick={() => setShowClotureReport(true)} className="text-[9px] font-black bg-red-50 text-red-600 px-4 py-2 rounded-xl uppercase flex items-center gap-2 hover:bg-red-600 hover:text-white transition-all"><LogOut size={14}/> Clôturer</button>
            </div>
          </div>
          <div className="relative">
             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
             <input type="text" placeholder="Rechercher un produit..." className="w-64 pl-9 pr-4 py-2 rounded-xl border-none bg-slate-50 text-[10px] outline-none font-bold focus:ring-2 focus:ring-[#386D7F]/20" onChange={(e)=>setSearchTerm(e.target.value)} />
          </div>
        </div>

        {!showJournal ? (
          <>
            {type === 'resto' && (
              <div className="flex flex-wrap gap-2 mb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 'VIP'].map(t => (
                  <button key={t} onClick={() => setSelectedTable(t)} className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${selectedTable === t ? 'bg-[#D17A61] border-[#D17A61] text-white shadow-lg' : 'bg-white text-slate-400'}`}>Table {t}</button>
                ))}
              </div>
            )}
            <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-2">
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2 rounded-full text-[9px] font-black border uppercase whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-[#386D7F] border-[#386D7F] text-white shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>{cat}</button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pb-10">
                {filteredProducts.map(p => (
                  <button key={p._id} onClick={() => addToCart(p)} className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-50 hover:border-[#D17A61] hover:shadow-xl transition-all relative group overflow-hidden">
                    {favoriteIds.includes(p._id) && <div className="absolute top-0 right-0 bg-[#386D7F] text-[7px] font-black px-3 py-1 text-white rounded-bl-xl">TOP</div>}
                    <p className="text-[8px] font-black text-slate-300 uppercase mb-1">{p.category || p.categorie}</p>
                    <p className="font-bold text-slate-700 text-[11px] h-8 line-clamp-2 uppercase leading-tight group-hover:text-[#386D7F]">{p.name || p.nom}</p>
                    <p className="text-[#D17A61] font-black text-[12px] mt-2">{(p.price || p.prixVente).toLocaleString()} F</p>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-[2.5rem] p-6 h-full border border-slate-100 flex flex-col overflow-hidden shadow-inner">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-[11px] font-black uppercase text-[#386D7F] flex items-center gap-2">
                  <History size={16}/> Activité du service en cours
                </h2>
                <span className="text-[10px] font-black bg-[#386D7F]/10 text-[#386D7F] px-4 py-1 rounded-full uppercase">Caisse: {statsCloture.total.toLocaleString()} F</span>
              </div>
              
              <div className="grid grid-cols-4 gap-3 mb-8">
                <div className="bg-[#386D7F] p-4 rounded-[2rem] text-white">
                  <p className="text-[7px] font-black uppercase opacity-60">Net Encaissé</p>
                  <p className="text-lg font-black">{statsCloture.total.toLocaleString()} F</p>
                </div>
                <div className="bg-white p-4 rounded-[2rem] border text-center">
                  <p className="text-[7px] font-black text-slate-400 uppercase">💰 Cash</p>
                  <p className="text-lg font-black text-slate-700">{statsCloture.cash.toLocaleString()} F</p>
                </div>
                <div className="bg-white p-4 rounded-[2rem] border text-center">
                  <p className="text-[7px] font-black text-slate-400 uppercase">📱 Mobile</p>
                  <p className="text-lg font-black text-slate-700">{statsCloture.mobile.toLocaleString()} F</p>
                </div>
                <div className="bg-red-50 p-4 rounded-[2rem] border-red-100 border text-center">
                  <p className="text-[7px] font-black text-red-400 uppercase">🎁 Remises</p>
                  <p className="text-lg font-black text-red-600">-{statsCloture.totalRemises.toLocaleString()} F</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {sessionJournal.length === 0 && <p className="text-center text-slate-300 py-10 font-bold uppercase text-[10px]">Aucune vente pour le moment</p>}
                {sessionJournal.map(v => (
                  <div key={v._id} className="p-4 rounded-[1.5rem] border bg-[#FDFBF9] hover:border-[#386D7F] transition-all group">
                     <div className="flex justify-between items-center">
                       <div>
                         <p className="text-[10px] font-black text-[#386D7F]">TICKET #{v._id.toString().slice(-4).toUpperCase()}</p>
                         <p className="text-[9px] text-slate-400 font-bold uppercase">{v.heure} {v.table ? `• Table ${v.table}` : '• Comptoir'}</p>
                       </div>
                       <div className="flex items-center gap-4">
                         <div className="text-right">
                            <p className="font-black text-[13px] text-slate-800">{v.total.toLocaleString()} F</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase">{v.mode}</p>
                         </div>
                         <button onClick={() => setRefundingItem(v)} className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Undo2 size={18}/></button>
                       </div>
                     </div>
                  </div>
                ))}
              </div>
          </div>
        )}
      </div>

      {/* --- PANIER DROIT --- */}
      <div className="w-[320px] bg-white border-l flex flex-col relative shadow-2xl">
        {showSuccess && (
          <div className="absolute inset-0 bg-white/95 z-[250] flex flex-col items-center justify-center animate-in zoom-in duration-300">
            <div className="bg-[#386D7F] text-white p-4 rounded-full mb-4 shadow-xl animate-bounce"><CheckCircle size={40} /></div>
            <h3 className="font-black text-slate-800 uppercase text-[12px] tracking-[0.2em]">Vente Enregistrée</h3>
          </div>
        )}
        
        <div className="p-5 border-b bg-slate-50/50 flex justify-between items-center text-[10px] font-black uppercase text-slate-500 tracking-widest">
          <span>Panier Actuel</span>
          {selectedTable && <span className="bg-[#D17A61] text-white px-3 py-1 rounded-full shadow-sm animate-pulse">Table {selectedTable}</span>}
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto space-y-2 bg-[#FDFBF9]/50 custom-scrollbar">
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
              <LayoutGrid size={60} className="mb-4"/>
              <p className="text-[10px] font-black uppercase tracking-widest text-center">Sélectionnez<br/>un article</p>
            </div>
          )}
          {cart.map(item => (
            <div key={item._id} className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-sm group hover:border-[#386D7F] transition-all">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-[10px] font-black truncate uppercase text-slate-700">{item.name}</p>
                <p className="text-[11px] text-[#D17A61] font-black">{(item.price * item.qty).toLocaleString()} F</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border">
                <button onClick={() => { if(item.qty > 1) setCart(cart.map(it => it._id === item._id ? {...it, qty: it.qty - 1} : it)); else setCart(cart.filter(it => it._id !== item._id)); }} className="p-1 text-slate-400 hover:text-red-500"><Minus size={12}/></button>
                <span className="text-[11px] font-black w-5 text-center">{item.qty}</span>
                <button onClick={() => addToCart(item)} className="p-1 text-slate-400 hover:text-[#386D7F]"><Plus size={12}/></button>
              </div>
            </div>
          ))}
        </div>

        {/* SECTION PAIEMENT --- */}
        <div className="p-6 bg-slate-900 text-white rounded-t-[3rem] shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-1">
              {[0, 5, 10, 15].map(val => (
                <button key={val} onClick={() => setDiscount(val)} className={`px-3 py-1.5 rounded-xl text-[9px] font-black border transition-all ${discount === val ? 'bg-[#D17A61] border-[#D17A61]' : 'border-slate-700 text-slate-500'}`}>{val}%</button>
              ))}
            </div>
            <button onClick={() => setCart([])} className="text-slate-600 hover:text-red-400"><X size={18}/></button>
          </div>
          
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest"><span>Sous-total</span><span>{subTotal.toLocaleString()} F</span></div>
            <div className="flex justify-between items-end pt-3 border-t border-slate-800">
              <span className="text-[#386D7F] text-[9px] font-black uppercase tracking-widest">NET A PAYER</span>
              <div className="text-right">
                <span className="block text-3xl font-black text-[#D17A61] tracking-tighter leading-none">{netTotal.toLocaleString()}</span>
                <span className="text-[8px] font-bold text-slate-600 uppercase">Francs CFA</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button onClick={() => handleValidateVente('CASH')} className="py-3.5 bg-slate-800 rounded-2xl text-[9px] font-black flex flex-col items-center gap-2 border border-slate-700 active:scale-95 uppercase hover:bg-slate-700 transition-all">
              <Banknote size={20} className="text-emerald-400"/> Espèces
            </button>
            <button onClick={() => handleValidateVente('MOBILE')} className="py-3.5 bg-slate-800 rounded-2xl text-[9px] font-black flex flex-col items-center gap-2 border border-slate-700 active:scale-95 uppercase hover:bg-slate-700 transition-all">
              <CreditCard size={20} className="text-blue-400"/> Mobile
            </button>
          </div>
          
          <button disabled={cart.length === 0} onClick={() => handleValidateVente('CASH')} className="w-full bg-[#D17A61] disabled:bg-slate-800 disabled:opacity-50 py-4 rounded-2xl font-black text-[10px] text-white uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-3 transition-all hover:brightness-110 active:scale-[0.98]">
            <Printer size={16}/> Encaisser & Ticket
          </button>
        </div>
      </div>
    </div>
  );
};

export default Caisse;