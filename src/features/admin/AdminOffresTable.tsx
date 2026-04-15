import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/axios';
import { CheckmarkCircle01Icon, CancelCircleHalfDotIcon, Search01Icon, Download04Icon, EyeIcon } from 'hugeicons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadCSV } from '../../lib/csvExport';
import { useTranslation } from 'react-i18next';
import { useAlert } from '@/components/alerts/useAlert';

export default function AdminOffresTable() {
    const { i18n } = useTranslation();
    const isFr = (i18n.resolvedLanguage || 'fr').startsWith('fr');
    const [offres, setOffres] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('pending'); // pending, approved, rejected, all
    const [searchTerm, setSearchTerm] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    // Selected Offer for Modal
    const [selectedOffre, setSelectedOffre] = useState<any | null>(null);
    const { error: showError } = useAlert();

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setSearchQuery(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const fetchOffres = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/offres`, {
                params: {
                    page,
                    validation_status: statusFilter,
                    search: searchQuery
                }
            });
            setOffres(res.data.data || res.data);
            setTotalPages(res.data.last_page || 1);
        } catch (error) {
            console.error('Failed to fetch offres:', error);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, searchQuery]);

    useEffect(() => {
        fetchOffres();
    }, [fetchOffres]);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const res = await api.get(`/admin/offres`, {
                params: {
                    validation_status: statusFilter,
                    search: searchQuery,
                    export: 'true'
                }
            });
            
            // Format before export
            const exportData = res.data.map((o: any) => ({
                ID: o.id,
                [isFr ? 'Titre' : 'Title']: o.title,
                [isFr ? 'Entreprise' : 'Company']: o.user?.company_name || 'N/A',
                [isFr ? 'Type' : 'Type']: o.type,
                [isFr ? 'Contrat' : 'Contract']: o.contract_type,
                [isFr ? 'Mode' : 'Mode']: o.work_mode,
                [isFr ? 'Salaire' : 'Salary']: o.salary_range || 'N/R',
                [isFr ? 'Statut' : 'Status']: o.validation_status,
                [isFr ? 'Date' : 'Date']: o.created_at
            }));

            downloadCSV(exportData, 'offres_export');
        } catch(e) {
            console.error("Export failed", e);
            showError(isFr ? "Erreur lors de l'exportation." : 'Export failed.');
        } finally {
            setIsExporting(false);
        }
    }

    const handleValidate = async (offreId: string, newStatus: string) => {
        try {
            await api.put(`/admin/offres/${offreId}/validate`, { status: newStatus });
            setSelectedOffre(null);
            fetchOffres();
        } catch (error) {
            console.error('Failed to update offre status', error);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 relative"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter font-syne text-white">Modération</h2>
                
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search Input */}
                    <div className="relative">
                        <Search01Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder={isFr ? 'Rechercher titre/entr...' : 'Search title/company...'} 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-[#09090b] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 w-full md:w-56 transition-all"
                        />
                    </div>

                    <div className="flex bg-[#09090b] border border-white/10 p-1 rounded-xl">
                        {['all', 'pending', 'approved', 'rejected'].map(filter => (
                            <button
                                key={filter}
                                onClick={() => { setStatusFilter(filter); setPage(1); }}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${
                                    statusFilter === filter 
                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                    : 'text-slate-500 hover:text-white border border-transparent'
                                }`}
                            >
                                {filter === 'all' ? (isFr ? 'Toutes' : 'All') : filter}
                            </button>
                        ))}
                    </div>

                    {/* Export BTN */}
                    <button 
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                        <Download04Icon size={16} /> {isExporting ? (isFr ? 'Export...' : 'Export...') : (isFr ? 'CSV' : 'CSV')}
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto rounded-3xl border border-white/5 bg-[#09090b] relative min-h-[400px]">
                {loading && (
                    <div className="absolute inset-0 bg-[#09090b]/50 backdrop-blur-sm z-10 flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                    </div>
                )}
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">{isFr ? 'Titre / entr.' : 'Title / company'}</th>
                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">{isFr ? 'Contrat' : 'Contract'}</th>
                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">{isFr ? 'Publication' : 'Published'}</th>
                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">{isFr ? 'Statut' : 'Status'}</th>
                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">{isFr ? 'Actions' : 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {offres.length === 0 && !loading && (
                                <tr><td colSpan={5} className="text-center py-10 text-[10px] font-black uppercase tracking-widest text-slate-600">{isFr ? 'Aucune offre.' : 'No offers.'}</td></tr>
                            )}
                            {offres.map((offre, idx) => (
                                <motion.tr 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={offre.id || idx} 
                                    className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                                >
                                    <td className="py-5 px-6">
                                        <p className="font-bold text-sm text-white mb-1 truncate max-w-[200px]">{offre.title}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">{offre.user?.company_name || 'N/A'}</p>
                                    </td>
                                    <td className="py-5 px-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-semibold text-slate-300">{offre.contract_type}</span>
                                            <span className="text-xs text-slate-500">{offre.work_mode}</span>
                                        </div>
                                    </td>
                                    <td className="py-5 px-6 text-xs text-slate-400 font-medium">
                                        {new Date(offre.created_at).toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}
                                    </td>
                                    <td className="py-5 px-6">
                                        <span className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest border shadow-[0_0_10px_rgba(0,0,0,0.1)] ${
                                            offre.validation_status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                            offre.validation_status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                            'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                        }`}>
                                            {offre.validation_status}
                                        </span>
                                    </td>
                                    <td className="py-5 px-6 flex justify-end gap-2">
                                        <button 
                                            onClick={() => setSelectedOffre(offre)}
                                            className="w-9 h-9 rounded-xl border bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all"
                                            title={isFr ? 'Voir details' : 'View details'}
                                        >
                                            <EyeIcon size={16} />
                                        </button>
                                        
                                        {offre.validation_status === 'pending' && (
                                            <>
                                                <button 
                                                    onClick={() => handleValidate(offre.id, 'approved')}
                                                    className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-[#09090b]"
                                                    title={isFr ? 'Approuver' : 'Approve'}
                                                >
                                                    <CheckmarkCircle01Icon size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleValidate(offre.id, 'rejected')}
                                                    className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-[#09090b]"
                                                    title={isFr ? 'Rejeter' : 'Reject'}
                                                >
                                                    <CancelCircleHalfDotIcon size={16} />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-8">
                    <button 
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="px-6 py-3 border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all text-white"
                    >
                        {isFr ? 'Precedent' : 'Previous'}
                    </button>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{isFr ? 'Page' : 'Page'} {page} / {totalPages}</span>
                    <button 
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                        className="px-6 py-3 border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all text-white"
                    >
                        {isFr ? 'Suivant' : 'Next'}
                    </button>
                </div>
            )}

            {/* MODAL / SLIDEOVER FOR DETAILS */}
            <AnimatePresence>
                {selectedOffre && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/80 backdrop-blur-sm"
                        onClick={() => setSelectedOffre(null)}
                    >
                        <motion.div 
                            initial={{ y: 50, scale: 0.95 }}
                            animate={{ y: 0, scale: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[#09090b] border border-white/10 p-8 rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-black">{selectedOffre.title}</h3>
                                    <p className="text-blue-400 text-sm font-bold uppercase tracking-widest mt-1">{selectedOffre.user?.company_name}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${
                                    selectedOffre.validation_status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                    selectedOffre.validation_status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                    'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                }`}>
                                    {selectedOffre.validation_status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">{isFr ? 'Contrat' : 'Contract'}</p>
                                    <p className="text-sm font-semibold">{selectedOffre.contract_type}</p>
                                </div>
                                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">{isFr ? 'Lieu / mode' : 'Location / mode'}</p>
                                    <p className="text-sm font-semibold">{selectedOffre.location} ({selectedOffre.work_mode})</p>
                                </div>
                            </div>

                            <div className="mb-8">
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">{isFr ? 'Description' : 'Description'}</p>
                                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                                    {selectedOffre.description}
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
                                <button 
                                    onClick={() => setSelectedOffre(null)}
                                    className="px-6 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
                                >
                                    {isFr ? 'Fermer' : 'Close'}
                                </button>
                                {selectedOffre.validation_status === 'pending' && (
                                    <>
                                        <button 
                                            onClick={() => handleValidate(selectedOffre.id, 'rejected')}
                                            className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all text-xs font-bold uppercase tracking-widest"
                                        >
                                            {isFr ? 'Rejeter' : 'Reject'}
                                        </button>
                                        <button 
                                            onClick={() => handleValidate(selectedOffre.id, 'approved')}
                                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all text-xs font-bold uppercase tracking-widest"
                                        >
                                            {isFr ? 'Approuver' : 'Approve'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
