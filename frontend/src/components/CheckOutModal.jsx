// src/components/CheckOutModal.jsx
const CheckOutModal = ({ room, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl">
        <h2 className="text-2xl font-black text-slate-800 mb-2">Facturation Chambre {room.id}</h2>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8 italic">Clôture du séjour de {room.guest}</p>
        
        <div className="space-y-4 mb-8">
          <div className="flex justify-between text-sm font-bold p-4 bg-slate-50 rounded-2xl">
            <span className="text-slate-500 italic">Nuitées (2 nuits x 35,000 F)</span>
            <span className="text-slate-800">70,000 F</span>
          </div>
          <div className="flex justify-between text-sm font-bold p-4 bg-slate-50 rounded-2xl">
            <span className="text-slate-500 italic">Extras (Restaurant/Bar)</span>
            <span className="text-slate-800">12,500 F</span>
          </div>
          <div className="flex justify-between p-4 border-t-2 border-slate-900 mt-6 font-black text-xl">
            <span className="uppercase tracking-tighter italic">Total à Payer</span>
            <span className="text-blue-600">82,500 F</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button className="py-4 rounded-2xl font-black uppercase text-[10px] text-slate-400 hover:bg-slate-100 transition-all">Annuler</button>
          <button className="bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-green-600 transition-all">
            Valider le Paiement
          </button>
        </div>
      </div>
    </div>
  );
};