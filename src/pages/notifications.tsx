import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useLocation } from 'react-router-dom';
import { normalizeLocale } from '@/i18n/config';
import { CheckmarkCircle01Icon, Search01Icon } from 'hugeicons-react';
import { useNotifications } from '@/lib/notifications';

type NotificationItem = {
    id: string;
    type: string;
    title: string;
    body: string;
    action_url?: string | null;
    severity: 'info' | 'warning' | 'critical';
    read_at?: string | null;
    created_at: string;
};

type PaginatedNotifications = {
    data: NotificationItem[];
    current_page: number;
    last_page: number;
};

export default function NotificationsPage() {
    const location = useLocation();
    const routeLocale = normalizeLocale(location.pathname.split('/').filter(Boolean)[0] || localStorage.getItem('preferred_language') || 'fr');
    const withLocale = (path: string) => `/${routeLocale}${path.startsWith('/') ? path : `/${path}`}`;
    const { markAsRead, markAllAsRead } = useNotifications();

    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [type, setType] = useState('');
    const [severity, setSeverity] = useState('');
    const [isRead, setIsRead] = useState('');

    const { data: meta } = useQuery<{ types: string[]; severities: string[] }>({
        queryKey: ['notifications-meta'],
        queryFn: async () => {
            const res = await api.get('/notifications/filters-meta');
            return res.data;
        },
    });

    const { data, isLoading } = useQuery<PaginatedNotifications>({
        queryKey: ['notifications', page, search, type, severity, isRead],
        queryFn: async () => {
            const res = await api.get('/notifications', {
                params: {
                    page,
                    q: search || undefined,
                    type: type || undefined,
                    severity: severity || undefined,
                    is_read: isRead || undefined,
                    limit: 12,
                },
            });
            return res.data;
        },
    });

    const items = data?.data ?? [];
    const unreadCount = items.filter((n) => !n.read_at).length;

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
        void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    const handleMarkAsRead = async (id: string) => {
        await markAsRead([id]);
        void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-white pt-24 pb-12 px-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight">{routeLocale === 'fr' ? 'Notifications' : 'Notifications'}</h1>
                        <p className="text-slate-400 text-sm">{routeLocale === 'fr' ? 'Restez a jour de vos evenements importants.' : 'Stay up to date with important events.'}</p>
                    </div>
                    <button
                        onClick={() => { void handleMarkAllAsRead(); }}
                        className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-[11px] font-black uppercase tracking-widest disabled:opacity-50"
                    >
                        {routeLocale === 'fr' ? 'Tout marquer comme lu' : 'Mark all as read'}
                    </button>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="relative md:col-span-2">
                        <Search01Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder={routeLocale === 'fr' ? 'Rechercher...' : 'Search...'}
                            className="w-full h-11 pl-9 pr-3 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="h-11 rounded-xl border border-white/10 bg-slate-900 px-3 text-sm">
                        <option value="">{routeLocale === 'fr' ? 'Tous les types' : 'All types'}</option>
                        {(meta?.types ?? []).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1); }} className="h-11 rounded-xl border border-white/10 bg-slate-900 px-3 text-sm">
                        <option value="">{routeLocale === 'fr' ? 'Toutes severites' : 'All severities'}</option>
                        {(meta?.severities ?? []).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={isRead} onChange={(e) => { setIsRead(e.target.value); setPage(1); }} className="h-11 rounded-xl border border-white/10 bg-slate-900 px-3 text-sm">
                        <option value="">{routeLocale === 'fr' ? 'Tous' : 'All'}</option>
                        <option value="0">{routeLocale === 'fr' ? 'Non lus' : 'Unread'}</option>
                        <option value="1">{routeLocale === 'fr' ? 'Lus' : 'Read'}</option>
                    </select>
                </div>

                <div className="text-xs text-slate-400">{routeLocale === 'fr' ? 'Non lus sur cette page' : 'Unread on this page'}: {unreadCount}</div>

                <div className="space-y-3">
                    {isLoading && <div className="text-slate-400">{routeLocale === 'fr' ? 'Chargement...' : 'Loading...'}</div>}
                    {!isLoading && items.length === 0 && (
                        <div className="px-4 py-6 rounded-2xl border border-white/10 bg-white/[0.02] text-slate-400">
                            {routeLocale === 'fr' ? 'Aucune notification pour les filtres choisis.' : 'No notifications for selected filters.'}
                        </div>
                    )}
                    {items.map(item => (
                        <div key={item.id} className={`px-4 py-4 rounded-2xl border ${item.read_at ? 'border-white/10 bg-white/[0.02]' : 'border-blue-500/30 bg-blue-500/5'}`}>
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-bold text-white">{item.title}</p>
                                    <p className="text-xs text-slate-300 mt-1">{item.body}</p>
                                    <p className="text-[11px] text-slate-500 mt-2">{new Date(item.created_at).toLocaleString(routeLocale === 'fr' ? 'fr-FR' : 'en-US')}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {!item.read_at && (
                                        <button
                                            onClick={() => { void handleMarkAsRead(item.id); }}
                                            className="h-9 px-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-bold flex items-center gap-1"
                                        >
                                            <CheckmarkCircle01Icon size={14} />
                                            {routeLocale === 'fr' ? 'Lu' : 'Read'}
                                        </button>
                                    )}
                                    {item.action_url && (
                                        <a href={withLocale(item.action_url)} className="h-9 px-3 rounded-xl border border-white/15 bg-white/[0.04] text-xs font-bold flex items-center">
                                            {routeLocale === 'fr' ? 'Ouvrir' : 'Open'}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {data && data.last_page > 1 && (
                    <div className="flex items-center justify-center gap-3">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-10 px-4 rounded-xl border border-white/10 disabled:opacity-40">{routeLocale === 'fr' ? 'Precedent' : 'Previous'}</button>
                        <span className="text-sm text-slate-300">{page} / {data.last_page}</span>
                        <button disabled={page === data.last_page} onClick={() => setPage(p => p + 1)} className="h-10 px-4 rounded-xl border border-white/10 disabled:opacity-40">{routeLocale === 'fr' ? 'Suivant' : 'Next'}</button>
                    </div>
                )}
            </div>
        </div>
    );
}
