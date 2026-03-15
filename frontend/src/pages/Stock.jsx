import React, { useState, useMemo } from 'react';
import { 
  Package, AlertTriangle, Search, Plus, X, 
  History, ClipboardCheck, Save, Printer,
  ShoppingCart, RefreshCcw, Truck, TrendingUp, TrendingDown
} from 'lucide-react';

const StockWaska = ({ type = 'Tous' }) => {
  // --- 1. ÉTATS (STATE) ---
  const [inventory, setInventory] = useState([
    { id: 1, name: 'Bière Flag', cat: 'Bar', qty: 12, alert: 24, unit: 'Bouteilles', price: 1000 },
    { id: 2, name: 'Kedjenou Poulet', cat: 'Cuisine', qty: 15, alert: 10, unit: 'Portions', price: 4500 },
    { id: 3, name: 'Savon Invité', cat: 'Hôtel', qty: 5, alert: 50, unit: 'Unités', price: 300 },
  ]);

  const [movements, setMovements] = useState([
    { id: 101, date: '08/03/2026 14:20', art: 'Bière Flag', type: 'SORTIE', qty: 6, destination: 'Table 4', person: 'Jean', reason: 'Vente' },
    { id: 102, date: '08/03/2026 10:00', art: 'Savon Invité', type: 'ENTRÉE', qty: 20, destination: 'Magasin', person: 'Marie', reason: 'Achat' },
  ]); 
  
  const [purchaseOrders, setPurchaseOrders] = useState([]); 
  const [activeView, setActiveView] = useState("catalogue"); 
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [traceModal, setTraceModal] = useState({ open: false, product: null, type: null });
  const [traceData, setTraceData] = useState({ qty: 1, destination: 'Magasin', person: '', note: '' });
  const [countedStock, setCountedStock] = useState({});

  const [orderModal, setOrderModal] = useState({ open: false, product: null });
  const [orderData, setOrderData] = useState({ qty: 0, supplier: '' });

  // --- 2. LOGIQUE ---
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchType = type === 'Tous' || item.cat.toLowerCase() === type.toLowerCase();
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchType && matchSearch;
    });
  }, [inventory, type, searchTerm]);

  const stockAlerts = useMemo(() => inventory.filter(item => item.qty <= item.alert), [inventory]);
  const totalStockValue = useMemo(() => inventory.reduce((acc, item) => acc + (item.qty * item.price), 0), [inventory]);

  // --- 3. ACTIONS ---

  // FONCTION D'IMPRESSION AJOUTÉE
  const printInventorySheet = () => {
    const win = window.open('', '_blank');
    const rows = filteredInventory.map(item => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px; font-weight: bold; text-transform: uppercase;">${item.name}</td>
        <td style="padding: 12px; text-align: center; color: #666;">${item.qty}</td>
        <td style="padding: 12px; border: 2px solid #333; width: 80px;"></td>
        <td style="padding: 12px; border-bottom: 1px solid #eee;"></td>
      </tr>
    `).join('');

    win.document.write(`
      <html>
        <head><title>Fiche de Comptage - Waska</title></head>
        <body style="font-family: sans-serif; padding: 40px;">
          <h1 style="text-align: center; color: #386D7F;">WASKA VILLAGE</h1>
          <h3 style="text-align: center; text-transform: uppercase; border-bottom: 2px solid #D17A61; padding-bottom: 10px;">
            Fiche de Comptage Physique (${type})
          </h3>
          <p>Date: ____________________ &nbsp;&nbsp;&nbsp; Responsable: ____________________</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead style="background: #f4f4f4;">
              <tr>
                <th style="padding: 12px; text-align: left;">Article</th>
                <th style="padding: 12px;">Stock Logiciat</th>
                <th style="padding: 12px;">Réel</th>
                <th style="padding: 12px;">Observations</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div style="margin-top: 50px; display: flex; justify-content: space-between;">
            <div>Signature Gestionnaire</div>
            <div>Signature Contrôleur</div>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  const submitPhysicalInventory = () => {
    const newInventory = inventory.map(item => ({
      ...item,
      qty: countedStock[item.id] !== undefined ? countedStock[item.id] : item.qty
    }));
    setInventory(newInventory);
    setCountedStock({});
    setActiveView("catalogue");
    alert("✅ Inventaire mis à jour !");
  };

  const confirmMovement = () => {
    const { product, type: mType } = traceModal;
    const amount = mType === 'ENTRÉE' ? traceData.qty : -traceData.qty;
    setInventory(prev => prev.map(item => item.id === product.id ? { ...item, qty: item.qty + amount } : item));
    const newMove = { id: Date.now(), date: new Date().toLocaleString('fr-FR'), art: product.name, type: mType, qty: traceData.qty, person: traceData.person || 'Anonyme', reason: traceData.note || 'Mouvement manuel' };
    setMovements([newMove, ...movements]);
    setTraceModal({ open: false, product: null, type: null });
  };

  const handleReceiveOrder = (order) => {
    setInventory(prev => prev.map(item => item.id === order.productId ? { ...item, qty: item.qty + order.qty } : item));
    setMovements([{ id: Date.now(), date: new Date().toLocaleString(), art: order.product, type: 'ENTRÉE', qty: order.qty, person: 'RAF', reason: `BC ${order.id}` }, ...movements]);
    setPurchaseOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: "LIVRÉ" } : o));
  };

  const finalizeOrder = () => {
    const newOrder = { id: `BC-${Date.now().toString().slice(-4)}`, date: new Date().toLocaleDateString(), product: orderModal.product.name, productId: orderModal.product.id, qty: orderData.qty, status: "EN ATTENTE", supplier: orderData.supplier };
    setPurchaseOrders([newOrder, ...purchaseOrders]);
    setOrderModal({ open: false, product: null });
    setActiveView('mouvements');
  };

  return (
    <div className="p-6 bg-[#fdfcfb] min-h-screen font-sans text-slate-900">
      
      {/* MENU */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <h1 className="text-3xl font-black uppercase italic tracking-tighter">
            <span className="text-[#D17A61]">Waska</span> <span className="text-[#386D7F]">Stock</span>
        </h1>
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
          {[
            { id: 'catalogue', label: 'Stock', icon: <Package size={14}/> }, 
            { id: 'mouvements', label: 'Flux', icon: <History size={14}/> }, 
            { id: 'alertes', label: 'Alertes', icon: <AlertTriangle size={14}/> }, 
            { id: 'inventaire', label: 'Inventaire', icon: <ClipboardCheck size={14}/> }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveView(tab.id)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeView === tab.id ? 'bg-[#386D7F] text-white shadow-lg' : 'text-slate-400 hover:text-[#386D7F]'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* DASHBOARD SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-[2rem] border-b-4 border-[#386D7F] shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase">Valeur</p><p className="text-2xl font-black">{totalStockValue.toLocaleString()} CFA</p></div>
        <div className="bg-white p-6 rounded-[2rem] border-b-4 border-[#D17A61] shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase">Alertes</p><p className="text-2xl font-black text-[#D17A61]">{stockAlerts.length}</p></div>
        <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex items-center justify-between"><span className="font-black uppercase text-xs">Vue : {activeView}</span><RefreshCcw size={20} /></div>
      </div>

      {/* VUE : CATALOGUE STOCK */}
      {activeView === 'catalogue' && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#386D7F] text-white text-[9px] font-black uppercase tracking-widest">
              <tr><th className="px-8 py-5">Article</th><th className="px-8 py-5 text-center">Quantité</th><th className="px-8 py-5 text-right">Mouvements</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-bold">
              {filteredInventory.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 group">
                  <td className="px-8 py-4 text-xs font-black uppercase">{item.name}</td>
                  <td className="px-8 py-4 text-center font-black text-lg">{item.qty}</td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setTraceModal({open: true, product: item, type: 'ENTRÉE'})} className="p-2 text-[#386D7F] hover:bg-[#386D7F] hover:text-white rounded-lg transition-colors"><TrendingUp size={16}/></button>
                        <button onClick={() => setTraceModal({open: true, product: item, type: 'SORTIE'})} className="p-2 text-[#D17A61] hover:bg-[#D17A61] hover:text-white rounded-lg transition-colors"><TrendingDown size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VUE : FLUX */}
      {activeView === 'mouvements' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-[10px] font-black uppercase text-[#386D7F] tracking-widest px-2 flex items-center gap-2"><Truck size={16}/> Commandes en cours</h3>
            {purchaseOrders.length === 0 ? <p className="text-xs italic text-slate-400 p-4">Aucun bon de commande.</p> : 
              purchaseOrders.map(order => (
                <div key={order.id} className="p-4 bg-white rounded-2xl border-l-4 border-[#386D7F] shadow-sm flex justify-between items-center">
                   <div className="text-[10px] font-bold"><p className="uppercase">{order.product}</p><p className="text-slate-400">{order.status}</p></div>
                   {order.status !== 'LIVRÉ' && <button onClick={()=>handleReceiveOrder(order)} className="p-2 bg-[#D17A61] text-white rounded-lg"><Save size={14}/></button>}
                </div>
              ))
            }
          </div>
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2 flex items-center gap-2"><History size={16}/> Historique</h3>
            <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left text-[10px]">
                    <thead className="bg-slate-50 text-slate-400 font-black uppercase">
                        <tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Article</th><th className="px-6 py-4">Type</th><th className="px-6 py-4 text-center">Qté</th><th className="px-6 py-4">Agent/Motif</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-bold uppercase">
                        {movements.map(m => (
                            <tr key={m.id}>
                                <td className="px-6 py-3 text-slate-400">{m.date}</td>
                                <td className="px-6 py-3">{m.art}</td>
                                <td className="px-6 py-3">
                                    <span className={`px-2 py-1 rounded-md ${m.type === 'ENTRÉE' ? 'bg-[#386D7F]/10 text-[#386D7F]' : 'bg-[#D17A61]/10 text-[#D17A61]'}`}>{m.type}</span>
                                </td>
                                <td className="px-6 py-3 text-center font-black">{m.qty}</td>
                                <td className="px-6 py-3 text-slate-400">{m.person} <span className="block text-[8px] italic">{m.reason}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        </div>
      )}

      {/* VUE : ALERTES */}
      {activeView === 'alertes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stockAlerts.map(item => (
            <div key={item.id} className="bg-white p-8 rounded-[2.5rem] border-2 border-[#D17A61]/10 shadow-lg relative">
              <div className="absolute top-4 right-6 text-[#D17A61]"><AlertTriangle size={24}/></div>
              <h4 className="font-black text-slate-800 text-lg uppercase mb-1">{item.name}</h4>
              <p className="text-xs font-bold text-[#D17A61] mb-6 tracking-widest">STOCK CRITIQUE : {item.qty} {item.unit}</p>
              <button onClick={() => {setOrderModal({open: true, product: item}); setOrderData({qty: item.alert * 2, supplier: ''});}} className="w-full bg-[#386D7F] text-white py-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-slate-900 transition-all">
                  <ShoppingCart size={16}/> Lancer Commande
              </button>
            </div>
          ))}
        </div>
      )}

      {/* VUE : INVENTAIRE (AVEC BOUTON IMPRESSION) */}
      {activeView === 'inventaire' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Comptage physique</h2>
            
            <div className="flex gap-3">
              {/* NOUVEAU BOUTON IMPRESSION */}
              <button 
                onClick={printInventorySheet} 
                className="bg-white border-2 border-slate-200 text-slate-600 px-6 py-4 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-slate-50 transition-all"
              >
                <Printer size={18}/> Imprimer Fiche
              </button>

              <button 
                onClick={submitPhysicalInventory} 
                className="bg-[#D17A61] text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-[#D17A61]/20 flex items-center gap-2"
              >
                <Save size={18}/> Valider l'inventaire
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left font-bold uppercase">
              <thead className="bg-slate-900 text-slate-400 text-[9px] font-black tracking-widest">
                <tr><th className="px-8 py-6">Article</th><th className="px-8 py-6 text-center">Logiciel</th><th className="px-8 py-6 text-center">Réel</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredInventory.map(item => (
                  <tr key={item.id}>
                    <td className="px-8 py-5 text-xs">{item.name}</td>
                    <td className="px-8 py-5 text-center text-slate-300">{item.qty}</td>
                    <td className="px-8 py-5 text-center">
                      <input 
                        type="number" autoComplete="off"
                        value={countedStock[item.id] || ''} 
                        onChange={(e) => setCountedStock({...countedStock, [item.id]: parseInt(e.target.value) || 0})}
                        className="w-24 text-center py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-[#386D7F] outline-none"
                        placeholder="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALES RESTE IDENTIQUE... */}
      {traceModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setTraceModal({open: false})} className="absolute top-8 right-8 text-slate-300"><X size={24}/></button>
            <h2 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tighter">{traceModal.type}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-6">{traceModal.product?.name}</p>
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-[#386D7F] uppercase mb-1">Quantité</p>
                <input type="number" autoComplete="off" className="w-full bg-transparent outline-none font-black text-3xl" value={traceData.qty} onChange={(e)=>setTraceData({...traceData, qty: parseInt(e.target.value) || 0})} />
              </div>
              <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" placeholder="Agent responsable" value={traceData.person} onChange={(e)=>setTraceData({...traceData, person: e.target.value})}/>
              <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm italic" placeholder="Motif..." value={traceData.note} onChange={(e)=>setTraceData({...traceData, note: e.target.value})}/>
              <button onClick={confirmMovement} className={`w-full py-5 rounded-[2rem] font-black uppercase text-xs text-white ${traceModal.type === 'ENTRÉE' ? 'bg-[#386D7F]' : 'bg-[#D17A61]'}`}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {orderModal.open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setOrderModal({open: false})} className="absolute top-8 right-8 text-slate-300"><X size={24}/></button>
            <h2 className="text-xl font-black text-[#D17A61] mb-6 uppercase tracking-tighter">Nouveau Bon de Commande</h2>
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Quantité</p>
                <input type="number" className="w-full bg-transparent outline-none font-black text-3xl text-[#D17A61]" value={orderData.qty} onChange={(e)=>setOrderData({...orderData, qty: parseInt(e.target.value) || 0})}/>
              </div>
              <input type="text" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm" placeholder="Fournisseur" onChange={(e)=>setOrderData({...orderData, supplier: e.target.value})}/>
              <button onClick={finalizeOrder} className="w-full py-6 bg-[#386D7F] text-white rounded-[2rem] font-black uppercase text-xs flex items-center justify-center gap-2 shadow-xl"><ShoppingCart size={18}/> Envoyer à la RAF</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StockWaska;