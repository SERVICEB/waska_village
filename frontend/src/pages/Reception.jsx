import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bed, Users, Search, Plus, Trash2, Printer, Brush, 
  X, Save, Wallet, CalendarDays, Landmark, FileCheck, 
  History, MinusCircle, CheckCircle, Activity, Clock, RefreshCw, Percent
} from 'lucide-react';

import StatsCards from './StatsCards';
import ClotureForm from './ClotureForm';

const Reception = () => {
  const [activeTab, setActiveTab] = useState('planning'); 
  const [showModal, setShowModal] = useState(null); 
  const [loading, setLoading] = useState(true);

  // --- DONNÉES ---
  const [clients, setClients] = useState([]);
  const [chambres, setChambres] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [journal, setJournal] = useState([]);
  const [soldeCaisseSession, setSoldeCaisseSession] = useState(0);

  // --- FORMULAIRES ---
  const [form, setForm] = useState({ clientId: '', roomId: '', nights: 1, deposit: 0, dateArrivee: '' });
  const [isAddingNewClient, setIsAddingNewClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '' });
  const [formDepense, setFormDepense] = useState({ motif: '', montant: '' });
  const [newRoomId, setNewRoomId] = useState('');
  const [selectedResForMove, setSelectedResForMove] = useState(null);
  const [selectedResForCheckout, setSelectedResForCheckout] = useState(null);
  const [discount, setDiscount] = useState(0);

  // ==========================================
  // LOGIQUE D'IMPRESSION
  // ==========================================
  const handlePrintTicket = (data, typeLabel = 'REÇU DE PAIEMENT') => {
    const printWindow = window.open('', '_blank', 'width=600,height=600');
    if (!printWindow) return;
    const date = new Date().toLocaleString('fr-FR');
    
    const montantTicket = data.deposit || data.montant || (data.roomPriceTotal - (Number(discount) || 0));
    const nomClient = data.client?.name || data.clientName || 'Client Passant';
    const numChambre = data.room?.number || data.roomId || 'N/A';

    printWindow.document.write(`
      <html>
        <head>
          <title>Waska Village - Ticket</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { font-family: 'Courier New', monospace; width: 70mm; padding: 2mm; font-size: 11px; line-height: 1.2; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-bottom: 1px dashed black; margin: 5px 0; }
            .row { display: flex; justify-content: space-between; margin: 2px 0; }
            .header { font-size: 14px; margin-bottom: 2px; }
          </style>
        </head>
        <body>
          <div class="center">
            <div class="bold header">WASKA VILLAGE</div>
            <div>Hôtel & Restaurant</div>
            <div>Tél: (+225) XX XX XX XX</div>
          </div>
          <div class="line"></div>
          <div class="center bold">${typeLabel}</div>
          <div class="line"></div>
          <div class="row"><span>Date:</span> <span>${date}</span></div>
          <div class="row"><span>Client:</span> <span class="bold">${nomClient}</span></div>
          <div class="row"><span>Chambre:</span> <span class="bold">CH ${numChambre}</span></div>
          <div class="line"></div>
          <div class="row bold" style="font-size: 13px;">
            <span>TOTAL:</span>
            <span>${Number(montantTicket).toLocaleString()} F</span>
          </div>
          <div class="line"></div>
          <div class="center" style="margin-top: 10px; font-size: 9px;">
            Logiciel Waska - Merci de votre visite !
          </div>
          <script>window.onload = () => { window.print(); window.close(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ==========================================
  // CHARGEMENT ET CALCUL DE CAISSE (MODIFIÉ)
  // ==========================================
  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('userToken');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [resR, resC, resResa, resLog] = await Promise.all([
        fetch('http://localhost:5000/api/rooms', { headers }),
        fetch('http://localhost:5000/api/clients', { headers }),
        fetch('http://localhost:5000/api/reservations', { headers }),
        fetch('http://localhost:5000/api/activities', { headers })
      ]);

      if (resR.ok) setChambres(await resR.json());
      if (resC.ok) setClients(await resC.json());
      if (resResa.ok) setReservations(await resResa.json());
      
      if (resLog.ok) {
        const logs = await resLog.json();
        setJournal(logs);

        // --- CALCUL DU SOLDE AVEC FILTRE SOUPLE ---
        // On accepte 'Réception', 'reception' ou vide pour ne rien rater
        const currentLogs = logs.filter(l => 
          !l.archived && 
          (l.pointDeVente?.toLowerCase().includes('recep') || !l.pointDeVente)
        );
        
        const totalE = currentLogs
          .filter(l => l.type === 'entree')
          .reduce((s, l) => s + (Number(l.montant) || 0), 0);

        const totalS = currentLogs
          .filter(l => l.type === 'sortie')
          .reduce((s, l) => s + (Number(l.montant) || 0), 0);

        setSoldeCaisseSession(totalE - totalS);
      }
      setLoading(false);
    } catch (error) {
      console.error("Erreur de synchronisation", error);
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setForm({ clientId: '', roomId: '', nights: 1, deposit: 0, dateArrivee: '' });
    setIsAddingNewClient(false);
    setNewClient({ name: '', phone: '' });
    setDiscount(0);
  };

  // ==========================================
  // ACTIONS API (POINT DE VENTE NORMALISÉ)
  // ==========================================
  const handleSaveAction = async (e, type) => {
    e.preventDefault();
    const token = localStorage.getItem('userToken');
    let finalClientId = form.clientId;

    if (isAddingNewClient) {
      const resC = await fetch('http://localhost:5000/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newClient)
      });
      const savedClient = await resC.json();
      finalClientId = savedClient._id;
    }

    const payload = {
      client: finalClientId,
      room: form.roomId,
      nights: Number(form.nights),
      deposit: Number(form.deposit),
      status: type === 'walkin' ? 'Occupé' : 'Réservé',
      dateArrivee: type === 'walkin' ? new Date() : form.dateArrivee,
      pointDeVente: 'Réception' // Toujours envoyer avec accent pour le backend
    };

    const response = await fetch('http://localhost:5000/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      handlePrintTicket(data, type === 'walkin' ? 'ENCAISSEMENT DIRECT' : 'ACOMPTE RÉSERVATION');
      setShowModal(null); 
      resetForm(); 
      await fetchData(); 
    }
  };

  const handleFinalCheckout = async (e) => {
    e.preventDefault();
    const response = await fetch(`http://localhost:5000/api/reservations/${selectedResForCheckout._id}/checkout`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('userToken')}` },
        body: JSON.stringify({ 
          discount: Number(discount),
          pointDeVente: 'Réception' // Préciser le PDV pour l'activité de sortie
        })
    });
    if (response.ok) { 
      handlePrintTicket(selectedResForCheckout, 'SOLDE FINAL & SORTIE');
      setShowModal(null); 
      await fetchData(); 
    }
  };

  const handleAddDepense = async (e) => {
    e.preventDefault();
    const response = await fetch('http://localhost:5000/api/depenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('userToken')}` },
        body: JSON.stringify({ ...formDepense, pointDeVente: 'Réception' })
    });
    if(response.ok) {
        handlePrintTicket({montant: formDepense.montant, clientName: 'Dépense Interne', roomId: formDepense.motif}, 'BON DE SORTIE');
        setShowModal(null); 
        setFormDepense({ motif: '', montant: '' });
        await fetchData(); 
    }
  };

  const handleCheckIn = async (resaId) => {
    const response = await fetch(`http://localhost:5000/api/reservations/${resaId}/checkin`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('userToken')}` }
    });
    if (response.ok) await fetchData();
  };

  const handleRoomMove = async (e) => {
    e.preventDefault();
    const response = await fetch(`http://localhost:5000/api/reservations/${selectedResForMove._id}/move`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('userToken')}` },
      body: JSON.stringify({ newRoomId })
    });
    if (response.ok) { setShowModal(null); await fetchData(); }
  };

  const handleCleanRoom = async (roomId) => {
    await fetch(`http://localhost:5000/api/rooms/${roomId}/clean`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('userToken')}` }
    });
    await fetchData();
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white space-y-4">
      <div className="w-12 h-12 border-4 border-[#0F4C3A] border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-[#0F4C3A] uppercase tracking-widest text-sm animate-pulse">Initialisation Waska...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-[#F8F9FA] min-h-screen font-sans text-[#2D3436]">
      
      {/* HEADER : TITRE ET SOLDE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black italic uppercase leading-none tracking-tighter text-[#0F4C3A]">
            Waska <span className="text-[#C5A059] underline decoration-4">Village</span>
          </h1>
          <div className="flex gap-3 mt-6">
             <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm group">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Caisse Réception</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-black text-[#0F4C3A]">{soldeCaisseSession.toLocaleString()} F</p>
                  <RefreshCw 
                    size={14} 
                    className="text-slate-300 cursor-pointer hover:rotate-180 transition-all duration-500 hover:text-[#0F4C3A]" 
                    onClick={fetchData} 
                  />
                </div>
             </div>
             <button 
                onClick={() => setShowModal('cloture')} 
                className="bg-[#0F4C3A] text-white px-6 py-3 rounded-2xl font-black text-[11px] uppercase shadow-lg hover:bg-black transition-all flex items-center gap-2"
              >
                <FileCheck size={16}/> Clôturer Session
              </button>
          </div>
        </div>
        
        {/* BOUTONS D'ACTION RAPIDE */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowModal('depense')} className="bg-white text-red-600 border border-red-100 px-5 py-3 rounded-xl font-bold text-[11px] uppercase flex items-center gap-2 hover:bg-red-50 transition-colors">
            <MinusCircle size={16}/> Sortie
          </button>
          <button onClick={() => {resetForm(); setShowModal('reservation');}} className="bg-[#2D3436] text-white px-5 py-3 rounded-xl font-bold text-[11px] uppercase flex items-center gap-2 hover:bg-black transition-colors">
            <CalendarDays size={16}/> Réserver
          </button>
          <button onClick={() => {resetForm(); setShowModal('walkin');}} className="bg-[#C5A059] text-white px-5 py-3 rounded-xl font-bold text-[11px] uppercase flex items-center gap-2 shadow-lg hover:scale-105 transition-transform">
            <Plus size={16}/> Arrivée Directe
          </button>
        </div>
      </div>

      <StatsCards />

      {/* TABS NAVIGATION */}
      <div className="flex gap-1 mb-8 bg-white p-1.5 rounded-2xl w-fit shadow-sm border border-slate-100">
        {['planning', 'reservations', 'chambres', 'journal'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${activeTab === tab ? 'bg-[#0F4C3A] text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* VUE PLANNING */}
      {activeTab === 'planning' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[#0F4C3A] text-[9px] font-black uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-5">Occupant</th>
                <th className="px-8 py-5">Chambre</th>
                <th className="px-8 py-5">Séjour</th>
                <th className="px-8 py-5">Reste à payer</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {reservations.filter(r => r.status === 'Occupé').map(res => (
                  <tr key={res._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 font-black uppercase text-slate-700">{res.client?.name || res.clientName}</td>
                    <td className="px-8 py-5"><span className="bg-[#0F4C3A] text-white px-3 py-1.5 rounded-lg font-black text-[10px]">CH {res.room?.number || res.roomId}</span></td>
                    <td className="px-8 py-5 text-slate-500 font-bold">{res.nights} Nuits</td>
                    <td className="px-8 py-5 font-black text-red-500">{(res.roomPriceTotal - res.deposit).toLocaleString()} F</td>
                    <td className="px-8 py-5 text-right flex justify-end gap-2">
                      <button onClick={() => handlePrintTicket(res, 'DUPLICATA')} className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200"><Printer size={16}/></button>
                      <button onClick={() => { setSelectedResForMove(res); setShowModal('move'); }} className="px-3 py-2 bg-blue-50 text-blue-600 rounded-xl font-black uppercase text-[10px]">Déloger</button>
                      <button onClick={() => { setSelectedResForCheckout(res); setShowModal('final_checkout'); }} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-black uppercase text-[10px]">Check-out</button>
                    </td>
                  </tr>
                ))}
                {reservations.filter(r => r.status === 'Occupé').length === 0 && (
                  <tr><td colSpan="5" className="px-8 py-10 text-center text-slate-400 font-bold uppercase text-[10px]">Aucune chambre occupée actuellement</td></tr>
                )}
            </tbody>
          </table>
        </div>
      )}

      {/* VUE RÉSERVATIONS */}
      {activeTab === 'reservations' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-blue-600 text-[9px] font-black uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-5">Futur Client</th>
                <th className="px-8 py-5">Chambre</th>
                <th className="px-8 py-5">Arrivée Prévue</th>
                <th className="px-8 py-5">Acompte</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {reservations.filter(r => r.status === 'Réservé').map(res => (
                  <tr key={res._id} className="hover:bg-slate-50/50">
                    <td className="px-8 py-5 font-black uppercase text-slate-700">{res.client?.name || res.clientName}</td>
                    <td className="px-8 py-5 font-bold text-slate-500">CH {res.room?.number || res.roomId}</td>
                    <td className="px-8 py-5 font-bold text-blue-600">{res.dateArrivee ? new Date(res.dateArrivee).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-8 py-5 font-black text-[#0F4C3A]">{res.deposit.toLocaleString()} F</td>
                    <td className="px-8 py-5 text-right flex justify-end gap-2">
                      <button onClick={() => handlePrintTicket(res, 'REÇU ACOMPTE')} className="p-2 bg-slate-100 text-slate-500 rounded-lg"><Printer size={16}/></button>
                      <button onClick={() => handleCheckIn(res._id)} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black uppercase text-[10px]">Arrivée</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VUE CHAMBRES */}
      {activeTab === 'chambres' && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {chambres.map(ch => (
            <div key={ch._id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className={`absolute top-0 right-0 px-3 py-1.5 rounded-bl-2xl text-[9px] font-black uppercase text-white ${ch.status === 'Occupée' ? 'bg-red-500' : ch.status === 'Sale' ? 'bg-[#C5A059]' : 'bg-[#0F4C3A]'}`}>
                {ch.status}
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Chambre</p>
              <h3 className="text-2xl font-black text-[#0F4C3A] mb-1">{ch.number}</h3>
              <p className="text-[11px] font-bold text-slate-500 mb-2">{ch.type}</p>
              <div className="flex items-center gap-1.5 mb-6 text-[#C5A059]">
                <Landmark size={12} />
                <span className="text-xs font-black italic">{ch.price?.toLocaleString()} F</span>
              </div>
              {ch.status === 'Sale' && (
                <button onClick={() => handleCleanRoom(ch._id)} className="w-full py-3 bg-black text-white text-[10px] font-black uppercase rounded-xl flex items-center justify-center gap-2 hover:bg-[#0F4C3A] transition-colors">
                  <Brush size={14}/> Nettoyée
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* VUE JOURNAL */}
      {activeTab === 'journal' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden text-[11px]">
          <table className="w-full text-left">
            <tbody className="divide-y divide-slate-50">
              {journal.map(log => (
                <tr key={log._id} className={`hover:bg-slate-50 transition-colors ${log.archived ? 'opacity-30' : ''}`}>
                  <td className="px-8 py-4 text-slate-400 font-bold">{new Date(log.createdAt).toLocaleTimeString()}</td>
                  <td className="px-8 py-4">
                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${log.archived ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                      {log.archived ? 'Archivé' : 'Session'}
                    </span>
                  </td>
                  <td className="px-8 py-4 font-black uppercase text-[10px]">{log.action}</td>
                  <td className="px-8 py-4 text-slate-600">{log.details}</td>
                  <td className={`px-8 py-4 text-right font-black ${log.type === 'entree' ? 'text-[#0F4C3A]' : 'text-red-500'}`}>
                    {log.montant > 0 ? `${log.type === 'sortie' ? '-' : ''}${log.montant.toLocaleString()} F` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODALE DE CLÔTURE (NOM NORMALISÉ) */}
      {showModal === 'cloture' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md relative">
            <button onClick={() => setShowModal(null)} className="absolute -top-12 right-0 text-white font-black uppercase text-[10px] flex items-center gap-2 hover:text-[#C5A059]">
              <X size={20}/> Fermer
            </button>
            <ClotureForm 
              soldeTheorique={soldeCaisseSession} 
              type="Réception" // <--- Doit correspondre à l'énumération du Backend
              onSuccess={() => { 
                setShowModal(null); 
                fetchData(); 
              }} 
            />
          </div>
        </div>
      )}

      {/* FORMULAIRES DE RÉSERVATION */}
      {(showModal === 'walkin' || showModal === 'reservation') && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10">
            <div className={`py-6 px-8 text-white flex justify-between items-center ${showModal === 'walkin' ? 'bg-[#C5A059]' : 'bg-[#0F4C3A]'}`}>
              <h2 className="text-sm font-black uppercase tracking-widest">{showModal === 'walkin' ? "Arrivée Directe" : "Nouvelle Réservation"}</h2>
              <X className="cursor-pointer" onClick={() => setShowModal(null)}/>
            </div>
            <form onSubmit={(e) => handleSaveAction(e, showModal)} className="p-8 space-y-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Client</label>
                  <button type="button" onClick={() => setIsAddingNewClient(!isAddingNewClient)} className="text-[10px] font-black text-[#C5A059] uppercase underline">
                    {isAddingNewClient ? "Annuler" : "+ Créer Client"}
                  </button>
                </div>
                {isAddingNewClient ? (
                  <div className="space-y-3">
                    <input required placeholder="Nom et Prénom" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border border-slate-100 outline-none" onChange={e => setNewClient({...newClient, name: e.target.value})}/>
                    <input required placeholder="Numéro de téléphone" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border border-slate-100 outline-none" onChange={e => setNewClient({...newClient, phone: e.target.value})}/>
                  </div>
                ) : (
                  <select required className="w-full p-4 bg-slate-50 rounded-2xl font-black border border-slate-100 outline-none" onChange={e => setForm({...form, clientId: e.target.value})}>
                    <option value="">Choisir un client...</option>
                    {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {showModal === 'reservation' && (
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Date de début de séjour</label>
                    <input required type="date" className="w-full p-4 bg-slate-50 rounded-2xl font-black border border-slate-100" onChange={e => setForm({...form, dateArrivee: e.target.value})}/>
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">Chambre</label>
                  <select required className="w-full p-4 bg-slate-50 rounded-2xl font-black border border-slate-100" onChange={e => setForm({...form, roomId: e.target.value})}>
                    <option value="">N°</option>
                    {chambres.filter(c => c.status === 'Libre').map(c => <option key={c._id} value={c._id}>{c.number} - {c.type}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">Nuits</label>
                  <input type="number" min="1" className="w-full p-4 bg-slate-50 rounded-2xl font-black border border-slate-100" defaultValue="1" onChange={e => setForm({...form, nights: e.target.value})}/>
                </div>
              </div>
              <div className="bg-slate-900 p-6 rounded-[1.5rem] text-right">
                <label className="text-[10px] font-black text-[#C5A059] uppercase block mb-1">Montant Encaissé (F)</label>
                <input required type="number" className="w-full bg-transparent text-white text-3xl font-black outline-none text-right" placeholder="0" onChange={e => setForm({...form, deposit: e.target.value})}/>
              </div>
              <button type="submit" className={`w-full py-5 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg ${showModal === 'walkin' ? 'bg-[#C5A059]' : 'bg-[#0F4C3A]'}`}>
                Enregistrer le séjour
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODALE CHECK-OUT */}
      {showModal === 'final_checkout' && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl text-xs">
            <h2 className="text-lg font-black uppercase text-[#0F4C3A] mb-8 flex items-center gap-2"><Wallet size={24}/> Règlement Final</h2>
            <div className="bg-slate-50 p-6 rounded-2xl mb-6 border border-dashed border-slate-300">
                <div className="flex justify-between font-black uppercase text-red-600">
                  <span>Reste à payer</span>
                  <span className="text-xl">{(selectedResForCheckout.roomPriceTotal - selectedResForCheckout.deposit).toLocaleString()} F</span>
                </div>
            </div>
            <form onSubmit={handleFinalCheckout} className="space-y-6">
              <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
                <label className="text-[10px] font-black text-amber-600 uppercase block mb-1">Remise (F)</label>
                <input type="number" className="w-full bg-transparent text-2xl font-black text-amber-700 outline-none" placeholder="0" onChange={(e) => setDiscount(e.target.value)} />
              </div>
              <button type="submit" className="w-full py-5 bg-[#2D3436] text-white rounded-2xl font-black uppercase shadow-xl hover:bg-black">
                Encaisser & Libérer
              </button>
              <button type="button" onClick={() => setShowModal(null)} className="w-full text-slate-400 font-bold uppercase text-[10px]">Annuler</button>
            </form>
          </div>
        </div>
      )}

      
      {/* MODALE DÉPENSE CORRIGÉE */}
{showModal === 'depense' && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
    <div className="bg-white w-full max-w-xs rounded-[2rem] p-8 shadow-2xl text-xs">
      <h2 className="text-lg font-black uppercase text-red-600 mb-6 flex items-center gap-2">
        <MinusCircle size={20}/> Sortie de Caisse
      </h2>
      <form onSubmit={handleAddDepense} className="space-y-4">
        {/* CHAMP TYPE (Ex: Achat, Transport, Salaire) */}
        <input 
          required 
          type="text" 
          placeholder="Type (ex: Transport, Achat...)" 
          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" 
          onChange={e => setFormDepense({...formDepense, type: e.target.value})}
        />
        {/* CHAMP BÉNÉFICIAIRE */}
        <input 
          required 
          type="text" 
          placeholder="Bénéficiaire (Nom de la personne)" 
          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" 
          onChange={e => setFormDepense({...formDepense, beneficiaire: e.target.value})}
        />
        {/* CHAMP MONTANT */}
        <input 
          required 
          type="number" 
          placeholder="Montant" 
          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xl" 
          onChange={e => setFormDepense({...formDepense, montant: e.target.value})}
        />
        
        <button type="submit" className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase shadow-lg">Valider</button>
        <button type="button" onClick={() => setShowModal(null)} className="w-full text-slate-400 font-bold uppercase text-[10px]">Annuler</button>
      </form>
    </div>
  </div>
)}

      
      {/* MODALE DÉLOGEMENT */}
      {showModal === 'move' && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl p-8 shadow-2xl">
            <h2 className="text-lg font-black uppercase text-blue-600 mb-6 flex items-center gap-2"><RefreshCw size={20}/> Déloger</h2>
            <form onSubmit={handleRoomMove} className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-400">Nouvelle Chambre</label>
              <select required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none" onChange={(e) => setNewRoomId(e.target.value)}>
                <option value="">Choisir...</option>
                {chambres.filter(c => c.status === 'Libre').map(c => <option key={c._id} value={c._id}>CH {c.number}</option>)}
              </select>
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase">Changer</button>
              <button type="button" onClick={() => setShowModal(null)} className="w-full text-slate-400 font-bold uppercase py-2 text-[10px]">Annuler</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Reception;