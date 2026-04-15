import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/axios';
import { CheckmarkCircle01Icon, Delete02Icon, Search01Icon } from 'hugeicons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAlert } from '@/components/alerts/useAlert';

interface User {
    id: string | number;
    name: string;
    company_name: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
}

export default function AdminEnterpriseRequests() {
    const { i18n } = useTranslation();
    const isFr = (i18n.resolvedLanguage || 'fr').startsWith('fr');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const { confirm, error: showError } = useAlert();

    useEffect(() => {
        const handler = setTimeout(() => {
            setSearchQuery(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/users`, {
                params: {
                    page,
                    search: searchQuery,
                    role: 'enterprise',
                    status: 'pending'
                }
            });
            setUsers(res.data.data || res.data);
            setTotalPages(res.data.last_page || 1);
        } catch (error) {
            console.error('Failed to fetch enterprise requests:', error);
        } finally {
            setLoading(false);
        }
    }, [page, searchQuery]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleAccept = async (userId: string | number) => {
        confirm({
            title: isFr ? 'Accepter cette entreprise' : 'Approve this company',
            message: isFr ? 'Accepter cette entreprise ?' : 'Approve this company?',
            confirmText: isFr ? 'Accepter' : 'Approve',
            cancelText: isFr ? 'Annuler' : 'Cancel',
            onConfirm: async () => {
                try {
                    await api.put(`/admin/users/${userId}/suspend`, { status: 'active' });
                    fetchRequests();
                } catch (error) {
                    console.error('Failed to accept request', error);
                    showError(isFr ? 'Action impossible.' : 'Action failed.');
                }
            }
        });
    };

    const handleReject = async (userId: string | number) => {
        confirm({
            title: isFr ? 'Rejeter cette demande' : 'Reject this request',
            message: isFr ? 'Rejeter cette demande ?' : 'Reject this request?',
            confirmText: isFr ? 'Rejeter' : 'Reject',
            cancelText: isFr ? 'Annuler' : 'Cancel',
            tone: 'danger',
            onConfirm: async () => {
                try {
                    await api.put(`/admin/users/${userId}/suspend`, { status: 'rejected' });
                    fetchRequests();
                } catch (error) {
                    console.error('Failed to reject request', error);
                    showError(isFr ? 'Action impossible.' : 'Action failed.');
                }
            }
        });
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter font-syne text-white">Demandes d'Entreprises</h2>
                    <p className="text-slate-400 text-sm mt-1">{isFr ? "Gerez les demandes d'inscription des entreprises (en attente)." : 'Manage pending company signup requests.'}</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search01Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder={isFr ? 'Rechercher...' : 'Search...'} 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-[#09090b] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 w-full md:w-64 transition-all"
                        />
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
                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">{isFr ? 'Nom / entreprise' : 'Name / company'}</th>
                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Email</th>
                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">{isFr ? 'Date' : 'Date'}</th>
                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {users.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className="text-center py-12 text-slate-500 text-sm">{isFr ? 'Aucune demande en attente.' : 'No pending requests.'}</td>
                                </tr>
                            )}
                            {users.map((user, idx) => (
                                <motion.tr 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={user.id || idx} 
                                    className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                                >
                                    <td className="py-5 px-6 font-bold text-sm text-white">
                                        {user.name || user.company_name}
                                    </td>
                                    <td className="py-5 px-6 text-xs text-slate-400 font-medium">{user.email}</td>
                                    <td className="py-5 px-6 text-xs text-slate-400 font-medium">
                                        {new Date(user.created_at).toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}
                                    </td>
                                    <td className="py-5 px-6 flex justify-end gap-3">
                                        <button 
                                            onClick={() => handleAccept(user.id)}
                                            className="w-9 h-9 rounded-xl border bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-[#09090b] flex items-center justify-center transition-all"
                                            title={isFr ? 'Accepter' : 'Approve'}
                                        >
                                            <CheckmarkCircle01Icon size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleReject(user.id)}
                                            className="w-9 h-9 rounded-xl border bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-[#09090b] flex items-center justify-center transition-all"
                                            title={isFr ? 'Rejeter' : 'Reject'}
                                        >
                                            <Delete02Icon size={16} />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

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
        </motion.div>
    );
}
