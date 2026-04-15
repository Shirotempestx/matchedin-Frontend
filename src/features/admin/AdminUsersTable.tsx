import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/axios';
import { UserBlock01Icon, CheckmarkCircle01Icon, Delete02Icon, Search01Icon, Download04Icon } from 'hugeicons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadCSV } from '../../lib/csvExport';
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

export default function AdminUsersTable() {
    const { i18n } = useTranslation();
    const isFr = (i18n.resolvedLanguage || 'fr').startsWith('fr');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchQuery, setSearchQuery] = useState(''); // debounced
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isExporting, setIsExporting] = useState(false);
    const { error: showError, confirm } = useAlert();

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setSearchQuery(searchTerm);
            setPage(1); // reset to page 1 on search
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/users`, {
                params: {
                    page,
                    search: searchQuery,
                    role: roleFilter,
                    status: statusFilter
                }
            });
            setUsers(res.data.data || res.data); // depending on pagination response format
            setTotalPages(res.data.last_page || 1);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    }, [page, searchQuery, roleFilter, statusFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const res = await api.get(`/admin/users`, {
                params: {
                    search: searchQuery,
                    role: roleFilter,
                    status: statusFilter,
                    export: 'true'
                }
            });

            downloadCSV(res.data, 'users_export');
        } catch (e) {
            console.error("Export failed", e);
            showError(isFr ? "Erreur lors de l'exportation." : 'Export failed.');
        } finally {
            setIsExporting(false);
        }
    }

    const handleSuspend = async (userId: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
            await api.put(`/admin/users/${userId}/suspend`, { status: newStatus });
            fetchUsers();
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    const handleDelete = async (userId: string) => {
        confirm({
            title: isFr ? 'Supprimer cet utilisateur' : 'Delete this user',
            message: isFr ? 'Voulez-vous vraiment supprimer cet utilisateur ?' : 'Do you really want to delete this user?',
            confirmText: isFr ? 'Supprimer' : 'Delete',
            cancelText: isFr ? 'Annuler' : 'Cancel',
            tone: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/users/${userId}`);
                    fetchUsers();
                } catch (error) {
                    console.error('Failed to delete user', error);
                    showError(isFr ? 'Suppression impossible.' : 'Delete failed.');
                }
            }
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/2 border border-white/5 rounded-4xl p-8"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter font-syne text-white">Utilisateurs</h2>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Search Input */}
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

                    {/* Role Filter */}
                    <select
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                        className="bg-[#09090b] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                    >
                        <option value="all">{isFr ? 'Tous les roles' : 'All roles'}</option>
                        <option value="student">{isFr ? 'Etudiant' : 'Student'}</option>
                        <option value="enterprise">{isFr ? 'Entreprise' : 'Company'}</option>
                    </select>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="bg-[#09090b] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                    >
                        <option value="all">{isFr ? 'Tous les statuts' : 'All statuses'}</option>
                        <option value="active">{isFr ? 'Actif' : 'Active'}</option>
                        <option value="suspended">{isFr ? 'Suspendu' : 'Suspended'}</option>
                        <option value="pending">{isFr ? 'En attente' : 'Pending'}</option>
                        <option value="rejected">{isFr ? 'Rejeté' : 'Rejected'}</option>
                    </select>

                    {/* Export BTN */}
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                        <Download04Icon size={16} /> {isExporting ? (isFr ? 'Exportation...' : 'Exporting...') : (isFr ? 'Exporter CSV' : 'Export CSV')}
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-white/5 bg-[#09090b] relative min-h-100">
                {loading && (
                    <div className="absolute inset-0 bg-[#09090b]/50 backdrop-blur-sm z-10 flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                    </div>
                )}
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/2">
                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">{isFr ? 'Nom / entreprise' : 'Name / company'}</th>
                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Email</th>
                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">{isFr ? 'Role' : 'Role'}</th>
                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">{isFr ? 'Statut' : 'Status'}</th>
                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">{isFr ? 'Actions' : 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {users.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-slate-500 text-sm">Aucun utilisateur trouvé.</td>
                                </tr>
                            )}
                            {users.map((user, idx) => (
                                <motion.tr
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={user.id || idx}
                                    className="border-b border-white/5 hover:bg-white/3 transition-colors"
                                >
                                    <td className="py-5 px-6 font-bold text-sm text-white">
                                        {user.name || user.company_name}
                                    </td>
                                    <td className="py-5 px-6 text-xs text-slate-400 font-medium">{user.email}</td>
                                    <td className="py-5 px-6">
                                        <span className="px-3 py-1 bg-white/5 text-slate-300 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white/10">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-5 px-6">
                                        <span className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest border shadow-[0_0_10px_rgba(0,0,0,0.1)] ${user.status === 'active'
                                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                : user.status === 'suspended'
                                                    ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                    : user.status === 'pending'
                                                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                        : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                            }`}>
                                            {user.status === 'active' && (isFr ? 'Actif' : 'Active')}
                                            {user.status === 'suspended' && (isFr ? 'Suspendu' : 'Suspended')}
                                            {user.status === 'pending' && (isFr ? 'En attente' : 'Pending')}
                                            {user.status === 'rejected' && (isFr ? 'Rejeté' : 'Rejected')}
                                            {!['active', 'suspended', 'pending', 'rejected'].includes(user.status) && user.status}
                                        </span>
                                    </td>
                                    <td className="py-5 px-6 flex justify-end gap-3">
                                        <button
                                            onClick={() => handleSuspend(user.id as string, user.status)}
                                            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${user.status === 'active'
                                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500 hover:text-[#09090b]'
                                                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-[#09090b]'
                                                }`}
                                            title={user.status === 'active' ? 'Suspendre' : 'Réactiver'}
                                        >
                                            {user.status === 'active' ? <UserBlock01Icon size={16} /> : <CheckmarkCircle01Icon size={16} />}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id as string)}
                                            className="w-9 h-9 rounded-xl border bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-[#09090b] flex items-center justify-center transition-all"
                                            title={isFr ? 'Supprimer' : 'Delete'}
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-8">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="px-6 py-3 border border-white/10 bg-white/3 hover:bg-white/8 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all text-white"
                    >
                        {isFr ? 'Precedent' : 'Previous'}
                    </button>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{isFr ? 'Page' : 'Page'} {page} / {totalPages}</span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                        className="px-6 py-3 border border-white/10 bg-white/3 hover:bg-white/8 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all text-white"
                    >
                        {isFr ? 'Suivant' : 'Next'}
                    </button>
                </div>
            )}
        </motion.div>
    );
}
