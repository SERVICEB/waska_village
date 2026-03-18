import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Receipt, Wallet, Calendar, ArrowRight, Loader2, Search, Filter } from 'lucide-react';
import AddDechargeModal from './AddDechargeModal'; // On l'importe bien ici

const DechargesPage = () => {
    const [decharges, setDecharges] = useState([]);
    const [filteredDecharges, setFilteredDecharges] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('Tous');

    const fetchDecharges = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('userToken'); 
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get('http://localhost:5000/api/decharges', config);
            setDecharges(res.data);
            setFilteredDecharges(res.data);
        } catch (err) {
            console.error("Erreur chargement décharges:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDecharges();
    }, []);

    useEffect(() => {
        let results = decharges.filter(item => 
            item.beneficiaire.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filterType !== 'Tous') {
            results = results.filter(item => item.type === filterType);
        }
        setFilteredDecharges(results);
    }, [searchTerm, filterType, decharges]);

    const totalSorties = filteredDecharges.reduce((sum, item) => sum + item.montant, 0);

    return (
        <div className="min-h-screen bg-[#FDFBF9] p-4 md:p-8">
            <div className="max-w-6xl mx-auto mb-8">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-black text-[#386D7F] italic tracking-tighter uppercase">
                                Registre des Sorties
                            </h1>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1 italic">
                                Waska Village • Jacqueville
                            </p>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Affiché</p>
                                <p className="text-2xl font-black text-[#D17A61] italic">
                                    {totalSorties.toLocaleString()} <span className="text-sm">FCFA</span>
                                </p>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="bg-[#386D7F] hover:bg-[#D17A61] text-white p-4 rounded-2xl shadow-lg transition-all flex items-center gap-3 group"
                            >
                                <Plus size={20} />
                                <span className="font-black uppercase text-[10px] tracking-widest">Nouvelle Sortie</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-50">
                        <div className="md:col-span-2 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input 
                                type="text"
                                placeholder="Rechercher..."
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-[#386D7F] focus:bg-white outline-none transition-all text-sm font-bold text-slate-700"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <select 
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-[#386D7F] focus:bg-white outline-none transition-all text-sm font-bold text-slate-700 appearance-none"
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

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Loader2 size={40} className="animate-spin mb-4 text-[#386D7F]" />
                        <p className="font-black uppercase text-[10px] tracking-widest">Mise à jour...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDecharges.map((item) => (
                            <div key={item._id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all relative overflow-hidden group">
                                <div className={`absolute top-0 right-8 px-4 py-1 text-[8px] font-black uppercase text-white rounded-b-lg ${item.statut === 'Payé' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                                    {item.statut}
                                </div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-[#386D7F] group-hover:text-white transition-all">
                                        <Receipt size={20} />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">{new Date(item.date).toLocaleDateString()}</p>
                                </div>
                                <h3 className="font-black text-slate-800 uppercase text-sm mb-1">{item.beneficiaire}</h3>
                                <p className="text-[10px] font-bold text-[#386D7F] italic mb-4">{item.type}</p>
                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <p className="text-xl font-black text-[#D17A61] italic">{item.montant.toLocaleString()} <span className="text-[10px] not-italic">FCFA</span></p>
                                    <ArrowRight size={16} className="text-slate-200 group-hover:text-[#D17A61] transition-all" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <AddDechargeModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onRefresh={fetchDecharges} 
            />
        </div>
    );
};

// --- LA CORRECTION EST ICI ---
export default DechargesPage;