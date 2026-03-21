import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bed, Users, Search, Plus, Trash2, Printer, Brush, 
  X, Save, Wallet, CalendarDays, Landmark, FileCheck, 
  History, MinusCircle, CheckCircle, Activity, Clock, RefreshCw, Percent
} from 'lucide-react';

import StatsCards from './StatsCards';
import ClotureForm from './ClotureForm';

const API_BASE = 'http://localhost:5000/api';

const Reception = () => {
  const [activeTab, setActiveTab] = useState('planning'); 
  const [showModal, setShowModal] = useState(null); 
  const [loading, setLoading] = useState(true);

  const [clients, setClients]       = useState([]);
  const [chambres, setChambres]     = useState([]);
  const [reservations, setReservations] = useState([]);
  const [journal, setJournal]       = useState([]);
  const [soldeCaisseSession, setSoldeCaisseSession] = useState(0);

  const [form, setForm] = useState({ clientId: '', roomId: '', nights: 1, deposit: 0, dateArrivee: '' });
  const [isAddingNewClient, setIsAddingNewClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '' });
  const [formDepense, setFormDepense] = useState({ motif: '', montant: '', type: '', beneficiaire: '' });
  const [newRoomId, setNewRoomId] = useState('');
  const [selectedResForMove, setSelectedResForMove] = useState(null);
  const [selectedResForCheckout, setSelectedResForCheckout] = useState(null);
  const [discount, setDiscount] = useState(0);

  // ── Auth header ────────────────────────────────────────────────────────────
  const authH = () => ({
    'Authorization': `Bearer ${localStorage.getItem('userToken')}`,
    'Content-Type': 'application/json'
  });
  const authHGet = () => ({ 'Authorization': `Bearer ${localStorage.getItem('userToken')}` });

  // ── Chargement et calcul solde ─────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [resR, resC, resResa, resLog] = await Promise.all([
        fetch(`${API_BASE}/rooms`,        { headers: authHGet() }),
        fetch(`${API_BASE}/clients`,      { headers: authHGet() }),
        fetch(`${API_BASE}/reservations`, { headers: authHGet() }),
        fetch(`${API_BASE}/activities`,   { headers: authHGet() })
      ]);

      if (resR.ok)    setChambres(await resR.json());
      if (resC.ok)    setClients(await resC.json());
      if (resResa.ok) setReservations(await resResa.json());

      if (resLog.ok) {
        const logs = await resLog.json();
        setJournal(logs);

        // ── SOLDE CAISSE : activités NON archivées de la Réception ──
        // Normalise les accents avant comparaison pour éviter 'réception' ≠ 'recep'
        const normPDV = s => (s || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim();

        const currentLogs = logs.filter(l => {
          if (l.archived) return false;
          // Pas de PDV = Réception par défaut (schéma Activity)
          if (!l.pointDeVente) return true;
          const pdv = normPDV(l.pointDeVente);
          // 'Réception' → 'reception' → contient 'recep' ✓
          return pdv === '' || pdv.includes('recep');
        });

        const totalE = currentLogs
          .filter(l => l.type === 'entree')
          .reduce((s, l) => s + (Number(l.montant) || 0), 0);

        const totalS = currentLogs
          .filter(l => l.type === 'sortie')
          .reduce((s, l) => s + (Number(l.montant) || 0), 0);

        setSoldeCaisseSession(totalE - totalS);
      }
    } catch (error) {
      console.error('Erreur de synchronisation', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Polling toutes les 10s — caisse doit refléter les paiements rapidement
  useEffect(() => {
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const resetForm = () => {
    setForm({ clientId: '', roomId: '', nights: 1, deposit: 0, dateArrivee: '' });
    setIsAddingNewClient(false);
    setNewClient({ name: '', phone: '' });
    setDiscount(0);
  };

  // ── Impression ticket ──────────────────────────────────────────────────────
  const handlePrintTicket = (data, typeLabel = 'REÇU DE PAIEMENT') => {
    const printWindow = window.open('', '_blank', 'width=600,height=600');
    if (!printWindow) return;
    const date = new Date().toLocaleString('fr-FR');
    const montantTicket = data.deposit || data.montant || (data.roomPriceTotal - (Number(discount) || 0));
    const nomClient = data.client?.name || data.clientName || 'Client Passant';
    const numChambre = data.room?.number || data.roomId || 'N/A';

    printWindow.document.write(`
      <html>
        <head><title>Ticket Waska</title>
        <style>
          body { font-family: Courier, monospace; width: 70mm; font-size: 11px; margin: 0; padding: 8px; }
          .row { display: flex; justify-content: space-between; margin: 2px 0; }
          .bold { font-weight: bold; }
          .line { border-bottom: 1px dashed black; margin: 5px 0; }
          .center { text-align: center; }
        </style></head>
        <body>
          <div class="center bold" style="font-size:14px;">WASKA VILLAGE</div>
          <div class="center">${typeLabel}</div>
          <div class="line"></div>
          <div class="row"><span>Date:</span><span>${date}</span></div>
          <div class="row"><span>Client:</span><span class="bold">${nomClient}</span></div>
          <div class="row"><span>Chambre:</span><span class="bold">CH ${numChambre}</span></div>
          <div class="line"></div>
          <div class="row bold" style="font-size:14px;"><span>TOTAL:</span><span>${Number(montantTicket).toLocaleString('fr-FR')} F</span></div>
          <div class="line"></div>
          <div class="center" style="font-size:9px;margin-top:8px;">Merci de votre visite · Jacqueville</div>
          <script>window.onload = () => { window.print(); window.close(); };<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ── Réservation / Arrivée directe ──────────────────────────────────────────
  const handleSaveAction = async (e, type) => {
    e.preventDefault();
    const token = localStorage.getItem('userToken');
    let finalClientId = form.clientId;

    if (isAddingNewClient) {
      const resC = await fetch(`${API_BASE}/clients`, {
        method: 'POST',
        headers: authH(),
        body: JSON.stringify(newClient)
      });
      const savedClient = await resC.json();
      finalClientId = savedClient._id;
    }

    const payload = {
      client:       finalClientId,
      room:         form.roomId,
      nights:       Number(form.nights),
      deposit:      Number(form.deposit),
      status:       type === 'walkin' ? 'Occupé' : 'Réservé',
      dateArrivee:  type === 'walkin' ? new Date() : form.dateArrivee,
      pointDeVente: 'Réception'
    };

    const response = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: authH(),
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

  // ── Check-out final ────────────────────────────────────────────────────────
  const handleFinalCheckout = async (e) => {
    e.preventDefault();
    const response = await fetch(`${API_BASE}/reservations/${selectedResForCheckout._id}/checkout`, {
      method: 'PATCH',
      headers: authH(),
      body: JSON.stringify({ discount: Number(discount), pointDeVente: 'Réception' })
    });
    if (response.ok) {
      handlePrintTicket(selectedResForCheckout, 'SOLDE FINAL & SORTIE');
      setShowModal(null);
      await fetchData();
    }
  };

  // ── Dépense interne ────────────────────────────────────────────────────────
  const handleAddDepense = async (e) => {
    e.preventDefault();
    const response = await fetch(`${API_BASE}/depenses`, {
      method: 'POST',
      headers: authH(),
      body: JSON.stringify({ ...formDepense, pointDeVente: 'Réception' })
    });
    if (response.ok) {
      handlePrintTicket(
        { montant: formDepense.montant, clientName: 'Dépense Interne', roomId: formDepense.motif },
        'BON DE SORTIE'
      );
      setShowModal(null);
      setFormDepense({ motif: '', montant: '', type: '', beneficiaire: '' });
      await fetchData();
    }
  };

  // ── Clôture caisse réception ──────────────────────────────────────────────
  // Appelé par ClotureForm via onSuccess — fetchData remet le solde à 0
  const handleClotureSuccess = async () => {
    setShowModal(null);
    await fetchData(); // Les activités sont maintenant archived=true → solde = 0
  };

  // ── Check-in ───────────────────────────────────────────────────────────────
  const handleCheckIn = async (resaId) => {
    const response = await fetch(`${API_BASE}/reservations/${resaId}/checkin`, {
      method: 'PATCH',
      headers: authHGet()
    });
    if (response.ok) await fetchData();
  };

  // ── Délogement ────────────────────────────────────────────────────────────
  const handleRoomMove = async (e) => {
    e.preventDefault();
    const response = await fetch(`${API_BASE}/reservations/${selectedResForMove._id}/move`, {
      method: 'PATCH',
      headers: authH(),
      body: JSON.stringify({ newRoomId })
    });
    if (response.ok) { setShowModal(null); await fetchData(); }
  };

  // ── Nettoyage chambre ──────────────────────────────────────────────────────
  const handleCleanRoom = async (roomId) => {
    await fetch(`${API_BASE}/rooms/${roomId}/clean`, {
      method: 'PATCH',
      headers: authHGet()
    });
    await fetchData();
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white space-y-4">
      <div className="w-12 h-12 border-4 border-[#0F4C3A] border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-[#0F4C3A] uppercase tracking-widest text-sm">Synchronisation Caisse...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-[#F8F9FA] min-h-screen font-sans text-[#2D3436]">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black italic uppercase leading-none tracking-tighter text-[#0F4C3A]">
            Waska <span className="text-[#C5A059] underline decoration-4">Village</span>
          </h1>
          <div className="flex gap-3 mt-6 flex-wrap">
            <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Caisse Réception (Session)</p>
              <div className="flex items-center gap-2">
                <p className={`text-2xl font-black ${soldeCaisseSession >= 0 ? 'text-[#0F4C3A]' : 'text-red-500'}`}>
                  {soldeCaisseSession.toLocaleString('fr-FR')} F
                </p>
                <RefreshCw
                  size={14}
                  className="text-slate-300 cursor-pointer hover:rotate-180 transition-all"
                  onClick={fetchData}
                />
              </div>
            </div>
            <button
              onClick={() => setShowModal('cloture')}
              className="bg-[#0F4C3A] text-white px-6 py-3 rounded-2xl font-black text-[11px] uppercase shadow-lg hover:bg-black transition-all flex items-center gap-2"
            >
              <FileCheck size={16}/> Clôturer & Remettre à Zéro
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowModal('depense')}
            className="bg-white text-red-600 border border-red-100 px-5 py-3 rounded-xl font-bold text-[11px] uppercase flex items-center gap-2 hover:bg-red-50 transition-colors"
          >
            <MinusCircle size={16}/> Sortie
          </button>
          <button
            onClick={() => { resetForm(); setShowModal('reservation'); }}
            className="bg-[#2D3436] text-white px-5 py-3 rounded-xl font-bold text-[11px] uppercase flex items-center gap-2 hover:bg-black transition-colors"
          >
            <CalendarDays size={16}/> Réserver
          </button>
          <button
            onClick={() => { resetForm(); setShowModal('walkin'); }}
            className="bg-[#C5A059] text-white px-5 py-3 rounded-xl font-bold text-[11px] uppercase flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"
          >
            <Plus size={16}/> Arrivée Directe
          </button>
        </div>
      </div>

      <StatsCards />

      {/* ── TABS ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-8 bg-white p-1.5 rounded-2xl w-fit shadow-sm border border-slate-100">
        {['planning', 'reservations', 'chambres', 'journal'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${
              activeTab === tab ? 'bg-[#0F4C3A] text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── PLANNING ───────────────────────────────────────────────────────── */}
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
              {reservations.filter(r => r.status === 'Occupé').length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-16 text-center text-slate-300 font-black text-[10px] uppercase">Aucun client en séjour</td></tr>
              ) : reservations.filter(r => r.status === 'Occupé').map(res => (
                <tr key={res._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 font-black uppercase text-slate-700">{res.client?.name || res.clientName}</td>
                  <td className="px-8 py-5">
                    <span className="bg-[#0F4C3A] text-white px-3 py-1.5 rounded-lg font-black text-[10px]">
                      CH {res.room?.number || res.roomId}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-slate-500 font-bold">{res.nights} Nuit{res.nights > 1 ? 's' : ''}</td>
                  <td className="px-8 py-5 font-black text-red-500">
                    {((res.roomPriceTotal || 0) - (res.deposit || 0)).toLocaleString('fr-FR')} F
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handlePrintTicket(res, 'DUPLICATA')} className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200"><Printer size={16}/></button>
                      <button onClick={() => { setSelectedResForMove(res); setShowModal('move'); }} className="px-3 py-2 bg-blue-50 text-blue-600 rounded-xl font-black uppercase text-[10px]">Déloger</button>
                      <button onClick={() => { setSelectedResForCheckout(res); setShowModal('final_checkout'); }} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-black uppercase text-[10px]">Check-out</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── RÉSERVATIONS ───────────────────────────────────────────────────── */}
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
                  <td className="px-8 py-5 font-bold text-blue-600">
                    {res.dateArrivee ? new Date(res.dateArrivee).toLocaleDateString('fr-FR') : 'N/A'}
                  </td>
                  <td className="px-8 py-5 font-black text-[#0F4C3A]">{(res.deposit || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handlePrintTicket(res, 'REÇU ACOMPTE')} className="p-2 bg-slate-100 text-slate-500 rounded-lg"><Printer size={16}/></button>
                      <button onClick={() => handleCheckIn(res._id)} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black uppercase text-[10px]">Arrivée</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── CHAMBRES ───────────────────────────────────────────────────────── */}
      {activeTab === 'chambres' && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {chambres.map(ch => (
            <div key={ch._id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative group">
              <div className={`absolute top-0 right-0 px-3 py-1.5 rounded-bl-2xl text-[9px] font-black uppercase text-white ${
                ch.status === 'Occupée' ? 'bg-red-500' : ch.status === 'Sale' ? 'bg-[#C5A059]' : 'bg-[#0F4C3A]'
              }`}>
                {ch.status}
              </div>
              <h3 className="text-2xl font-black text-[#0F4C3A] mb-1">{ch.number}</h3>
              <p className="text-[11px] font-bold text-slate-500 mb-4">{ch.type}</p>
              {ch.status === 'Sale' && (
                <button onClick={() => handleCleanRoom(ch._id)}
                  className="w-full py-3 bg-black text-white text-[10px] font-black uppercase rounded-xl flex items-center justify-center gap-2">
                  <Brush size={14}/> Nettoyée
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── JOURNAL ────────────────────────────────────────────────────────── */}
      {activeTab === 'journal' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden text-[11px]">
          <table className="w-full text-left">
            <tbody className="divide-y divide-slate-50">
              {journal.map(log => (
                <tr key={log._id} className={`hover:bg-slate-50 transition-colors ${log.archived ? 'opacity-30' : ''}`}>
                  <td className="px-8 py-4 text-slate-400 font-bold">{new Date(log.createdAt).toLocaleTimeString('fr-FR')}</td>
                  <td className="px-8 py-4">
                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${
                      log.archived ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {log.archived ? 'Clôturé' : 'Session'}
                    </span>
                  </td>
                  <td className="px-8 py-4 font-black uppercase text-[10px]">{log.action}</td>
                  <td className="px-8 py-4 text-slate-600">{log.details}</td>
                  <td className={`px-8 py-4 text-right font-black ${log.type === 'entree' ? 'text-[#0F4C3A]' : 'text-red-500'}`}>
                    {log.montant > 0
                      ? `${log.type === 'sortie' ? '−' : '+'}${log.montant.toLocaleString('fr-FR')} F`
                      : '—'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ══ MODALE CLÔTURE ══════════════════════════════════════════════════ */}
      {showModal === 'cloture' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md relative">
            <button
              onClick={() => setShowModal(null)}
              className="absolute -top-12 right-0 text-white font-black uppercase text-[10px] flex items-center gap-2"
            >
              <X size={20}/> Fermer
            </button>
            <ClotureForm
              soldeTheorique={soldeCaisseSession}
              type="Réception"
              onSuccess={handleClotureSuccess}  // ← fetchData() après clôture → solde = 0
            />
          </div>
        </div>
      )}

      {/* ══ MODALE RÉSERVATION / ARRIVÉE ════════════════════════════════════ */}
      {(showModal === 'walkin' || showModal === 'reservation') && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden">
            <div className={`py-6 px-8 text-white flex justify-between items-center ${showModal === 'walkin' ? 'bg-[#C5A059]' : 'bg-[#0F4C3A]'}`}>
              <h2 className="text-sm font-black uppercase tracking-widest">
                {showModal === 'walkin' ? 'Arrivée Directe' : 'Nouvelle Réservation'}
              </h2>
              <X className="cursor-pointer" onClick={() => setShowModal(null)}/>
            </div>
            <form onSubmit={(e) => handleSaveAction(e, showModal)} className="p-8 space-y-5">
              <div>
                <button type="button" onClick={() => setIsAddingNewClient(!isAddingNewClient)}
                  className="text-[10px] font-black text-[#C5A059] uppercase underline mb-2 block">
                  {isAddingNewClient ? '← Retour liste' : '+ Nouveau Client'}
                </button>
                {isAddingNewClient ? (
                  <div className="space-y-3">
                    <input required placeholder="Nom et Prénom" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none"
                      onChange={e => setNewClient({ ...newClient, name: e.target.value })}/>
                    <input required placeholder="Téléphone" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none"
                      onChange={e => setNewClient({ ...newClient, phone: e.target.value })}/>
                  </div>
                ) : (
                  <select required className="w-full p-4 bg-slate-50 rounded-2xl font-black outline-none"
                    onChange={e => setForm({ ...form, clientId: e.target.value })}>
                    <option value="">Choisir un client...</option>
                    {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {showModal === 'reservation' && (
                  <div className="col-span-2">
                    <input required type="date" className="w-full p-4 bg-slate-50 rounded-2xl font-black outline-none"
                      onChange={e => setForm({ ...form, dateArrivee: e.target.value })}/>
                  </div>
                )}
                <select required className="w-full p-4 bg-slate-50 rounded-2xl font-black outline-none"
                  onChange={e => setForm({ ...form, roomId: e.target.value })}>
                  <option value="">Chambre</option>
                  {chambres.filter(c => c.status === 'Libre').map(c => (
                    <option key={c._id} value={c._id}>{c.number}</option>
                  ))}
                </select>
                <input type="number" min="1" className="w-full p-4 bg-slate-50 rounded-2xl font-black outline-none"
                  defaultValue="1" placeholder="Nuits"
                  onChange={e => setForm({ ...form, nights: e.target.value })}/>
              </div>
              <div className="bg-slate-900 p-6 rounded-[1.5rem]">
                <p className="text-[10px] font-black text-[#C5A059] uppercase mb-1">Montant Versement (F)</p>
                <input required type="number" min="0"
                  className="w-full bg-transparent text-white text-3xl font-black outline-none"
                  placeholder="0"
                  onChange={e => setForm({ ...form, deposit: e.target.value })}/>
              </div>
              <button type="submit"
                className={`w-full py-5 text-white rounded-2xl font-black uppercase tracking-widest ${
                  showModal === 'walkin' ? 'bg-[#C5A059]' : 'bg-[#0F4C3A]'
                }`}>
                Valider le séjour
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODALE CHECK-OUT ════════════════════════════════════════════════ */}
      {showModal === 'final_checkout' && selectedResForCheckout && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl">
            <h2 className="text-lg font-black uppercase text-[#0F4C3A] mb-2 flex items-center gap-2">
              <Wallet size={24}/> Règlement Final
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase mb-6">
              {selectedResForCheckout.client?.name || selectedResForCheckout.clientName} · CH {selectedResForCheckout.room?.number}
            </p>
            <div className="bg-red-50 p-6 rounded-2xl mb-6">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Reste à payer</p>
              <p className="text-red-600 text-2xl font-black">
                {((selectedResForCheckout.roomPriceTotal || 0) - (selectedResForCheckout.deposit || 0)).toLocaleString('fr-FR')} F
              </p>
            </div>
            <form onSubmit={handleFinalCheckout} className="space-y-4">
              <input type="number" min="0" className="w-full p-4 bg-amber-50 rounded-2xl font-black outline-none"
                placeholder="Remise éventuelle (F)"
                onChange={e => setDiscount(e.target.value)}/>
              <button type="submit" className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase">
                Encaisser & Check-out
              </button>
              <button type="button" onClick={() => setShowModal(null)}
                className="w-full text-slate-400 font-bold uppercase text-[10px]">
                Annuler
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODALE DÉPENSE ══════════════════════════════════════════════════ */}
      {showModal === 'depense' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-xs rounded-[2rem] p-8 shadow-2xl">
            <h2 className="text-lg font-black uppercase text-red-600 mb-6 flex items-center gap-2">
              <MinusCircle size={20}/> Sortie Caisse
            </h2>
            <form onSubmit={handleAddDepense} className="space-y-4">
              <input required placeholder="Type (ex: Achat fournitures)" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none"
                onChange={e => setFormDepense({ ...formDepense, type: e.target.value, motif: e.target.value })}/>
              <input required placeholder="Bénéficiaire" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none"
                onChange={e => setFormDepense({ ...formDepense, beneficiaire: e.target.value })}/>
              <input required type="number" min="0" placeholder="Montant (F)"
                className="w-full p-4 bg-slate-50 rounded-2xl font-black text-xl outline-none"
                onChange={e => setFormDepense({ ...formDepense, montant: e.target.value })}/>
              <button type="submit" className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase shadow-lg">
                Valider Sortie
              </button>
              <button type="button" onClick={() => setShowModal(null)}
                className="w-full text-slate-400 font-bold uppercase text-[10px]">
                Annuler
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODALE DÉLOGEMENT ═══════════════════════════════════════════════ */}
      {showModal === 'move' && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl p-8 shadow-2xl">
            <h2 className="text-lg font-black uppercase text-blue-600 mb-6 flex items-center gap-2">
              <RefreshCw size={20}/> Changer de chambre
            </h2>
            <form onSubmit={handleRoomMove} className="space-y-4">
              <select required className="w-full p-4 bg-slate-50 rounded-2xl font-black outline-none"
                onChange={e => setNewRoomId(e.target.value)}>
                <option value="">Nouvelle chambre...</option>
                {chambres.filter(c => c.status === 'Libre').map(c => (
                  <option key={c._id} value={c._id}>CH {c.number}</option>
                ))}
              </select>
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase">
                Confirmer le transfert
              </button>
              <button type="button" onClick={() => setShowModal(null)}
                className="w-full text-slate-400 font-bold uppercase text-[10px]">
                Annuler
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reception;