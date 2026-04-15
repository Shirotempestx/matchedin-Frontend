import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/axios';
import { ViewOffIcon, CheckmarkCircle01Icon, Search01Icon, EyeIcon } from 'hugeicons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function AdminReportsTable() {
    const { i18n } = useTranslation();
    const isFr = (i18n.resolvedLanguage || 'fr').startsWith('fr');
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('pending'); // pending, resolved, dismissed, all
    const [searchTerm, setSearchTerm] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedReport, setSelectedReport] = useState<any | null>(null);

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setSearchQuery(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/reports`, {
                params: {
                    page,
                    status: statusFilter,
                    search: searchQuery
                }
            });
            setReports(res.data.data || res.data);
            setTotalPages(res.data.last_page || 1);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, searchQuery]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleUpdateStatus = async (reportId: string, newStatus: string) => {
        try {
            await api.put(`/admin/reports/${reportId}`, { status: newStatus });
            setSelectedReport(null);
            fetchReports();
        } catch (error) {
            console.error('Failed to update report status', error);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 relative"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter font-syne text-white">Signalements</h2>
                
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search Input */}
                    <div className="relative">
                        <Search01Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder={isFr ? 'Rechercher nom/raison...' : 'Search name/reason...'} 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-[#09090b] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 w-full md:w-56 transition-all"
                        />
                    </div>

                    <div className="flex bg-[#09090b] border border-white/10 p-1 rounded-xl">
                        {['all', 'pending', 'resolved', 'dismissed'].map(filter => (
                            <button
                                key={filter}
                                onClick={() => { setStatusFilter(filter); setPage(1); }}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${
                                    statusFilter === filter 
                                    ? 'bg-white/[0.05] text-white border border-white/10' 
                                    : 'text-slate-500 hover:text-white border border-transparent'
                                }`}
                            >
                                {filter === 'all' ? (isFr ? 'Tous' : 'All') : filter}
                            </button>
                        ))}
                    </div>
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
                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">{isFr ? 'Signale par' : 'Reported by'}</th>
                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">{isFr ? 'Cible (type / id)' : 'Target (type / id)'}</th>
                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">{isFr ? 'Date' : 'Date'}</th>
                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">{isFr ? 'Statut' : 'Status'}</th>
                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">{isFr ? 'Actions' : 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {reports.length === 0 && !loading && (
                                <tr><td colSpan={5} className="text-center py-10 text-[10px] font-black uppercase tracking-widest text-slate-600">{isFr ? 'Aucun signalement.' : 'No reports.'}</td></tr>
                            )}
                            {reports.map((report, idx) => (
                                <motion.tr 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={report.id || idx} 
                                    className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                                >
                                    <td className="py-5 px-6 font-bold text-sm text-white">
                                        {report.reporter?.name || (isFr ? 'Inconnu' : 'Unknown')}
                                    </td>
                                    <td className="py-5 px-6">
                                        <p className="text-xs font-semibold text-slate-300">{report.reportable_type}</p>
                                        <p className="text-[10px] text-slate-500 font-mono tracking-widest w-32 truncate">{report.reported_id}</p>
                                    </td>
                                    <td className="py-5 px-6 text-xs text-slate-400 font-medium">
                                        {new Date(report.created_at).toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}
                                    </td>
                                    <td className="py-5 px-6">
                                        <span className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest border shadow-[0_0_10px_rgba(0,0,0,0.1)] ${
                                            report.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                            report.status === 'dismissed' ? 'bg-slate-500/10 text-slate-500 border-slate-500/20' :
                                            'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                        }`}>
                                            {report.status}
                                        </span>
                                    </td>
                                    <td className="py-5 px-6 flex justify-end gap-2">
                                        <button 
                                            onClick={() => setSelectedReport(report)}
                                            className="w-9 h-9 rounded-xl border bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all"
                                            title={isFr ? 'Voir details' : 'View details'}
                                        >
                                            <EyeIcon size={16} />
                                        </button>
                                        
                                        {report.status === 'pending' && (
                                            <>
                                                <button 
                                                    onClick={() => handleUpdateStatus(report.id, 'resolved')}
                                                    className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-[#09090b]"
                                                    title={isFr ? 'Resoudre' : 'Resolve'}
                                                >
                                                    <CheckmarkCircle01Icon size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                                                    className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500 hover:text-[#09090b]"
                                                    title={isFr ? 'Ignorer' : 'Dismiss'}
                                                >
                                                    <ViewOffIcon size={16} />
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

            {/* MODAL */}
            <AnimatePresence>
                {selectedReport && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/80 backdrop-blur-sm"
                        onClick={() => setSelectedReport(null)}
                    >
                        <motion.div 
                            initial={{ y: 50, scale: 0.95 }}
                            animate={{ y: 0, scale: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[#09090b] border border-white/10 p-8 rounded-3xl max-w-lg w-full shadow-2xl"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xl font-black">{isFr ? 'Details du signalement' : 'Report details'}</h3>
                                    <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mt-1">
                                        {(isFr ? 'Par' : 'By')}: {selectedReport.reporter?.name || (isFr ? 'Inconnu' : 'Unknown')}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 rounded-xl text-[9px] font-bold uppercase tracking-widest border ${
                                    selectedReport.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                    selectedReport.status === 'dismissed' ? 'bg-slate-500/10 text-slate-500 border-slate-500/20' :
                                    'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                }`}>
                                    {selectedReport.status}
                                </span>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{isFr ? 'Type cible' : 'Target type'}</span>
                                    <span className="text-sm font-semibold">{selectedReport.reportable_type}</span>
                                </div>
                                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{isFr ? 'ID cible' : 'Target ID'}</span>
                                    <span className="text-xs font-mono text-slate-300">{selectedReport.reported_id}</span>
                                </div>
                                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-2">{isFr ? 'Raison / message' : 'Reason / message'}</span>
                                    <p className="text-sm text-slate-300 leading-relaxed bg-[#09090b] p-3 rounded-xl border border-white/5 whitespace-pre-line">
                                        {selectedReport.reason}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
                                <button 
                                    onClick={() => setSelectedReport(null)}
                                    className="px-6 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
                                >
                                    {isFr ? 'Fermer' : 'Close'}
                                </button>
                                {selectedReport.status === 'pending' && (
                                    <>
                                        <button 
                                            onClick={() => handleUpdateStatus(selectedReport.id, 'dismissed')}
                                            className="px-6 py-2.5 bg-slate-600 hover:bg-slate-500 text-white rounded-xl transition-all text-xs font-bold uppercase tracking-widest"
                                        >
                                            {isFr ? 'Ignorer' : 'Dismiss'}
                                        </button>
                                        <button 
                                            onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
                                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all text-xs font-bold uppercase tracking-widest"
                                        >
                                            {isFr ? 'Resoudre' : 'Resolve'}
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
