import { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { useLocation } from 'react-router-dom';
import { normalizeLocale } from '@/i18n/config';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { UserGroupIcon, Briefcase02Icon, Activity01Icon, Clock01Icon } from 'hugeicons-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types representing the new unified stats API from AdminDashboardController
interface TopOffer {
    id: number;
    title: string;
    views_count: number;
    user?: { company_name?: string };
}

interface RegistrationPoint {
    date: string;
    count: number;
}

interface SectorPoint {
    sector: string;
    count: number;
}

interface ActivityItem {
    id: number;
    type: 'user_registration' | 'offer_created';
    title: string;
    description: string;
    date: string;
    time: string;
}

interface DashboardStats {
    users: { total: number; students: number; enterprises: number };
    offers: { active: number; pending: number; top_consulted: TopOffer[] };
    platform: { average_match_score: number };
    registrations_evolution: RegistrationPoint[];
    offers_by_sector: SectorPoint[];
    activity_feed: ActivityItem[];
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#14b8a6', '#6366f1'];

export default function AdminDashboard() {
    const location = useLocation();
    const locale = normalizeLocale(location.pathname.split('/').filter(Boolean)[0] || 'fr');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/dashboard/stats');
                setStats(res.data as DashboardStats);
            } catch (err: unknown) {
                const axiosErr = err as { response?: { data?: { message?: string }; status?: number } };
                const msg = axiosErr?.response?.data?.message ?? (locale === 'fr' ? 'Erreur de chargement des statistiques.' : 'Error loading statistics.');
                setError(msg);
                console.error('Admin dashboard error:', axiosErr?.response?.status, msg);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [locale]);

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="flex flex-col h-[80vh] items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <span className="text-red-500 text-2xl">!</span>
                </div>
                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{error ?? (locale === 'fr' ? 'Donnees indisponibles.' : 'Data unavailable.')}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/[0.08] transition-all"
                >
                    {locale === 'fr' ? 'Reessayer' : 'Retry'}
                </button>
            </div>
        );
    }

    const kpiCards = [
        { title: locale === 'fr' ? 'Utilisateurs' : 'Users', value: stats.users.total, icon: <UserGroupIcon size={24} className="text-blue-500" /> },
        { title: locale === 'fr' ? 'Offres Actives' : 'Active Offers', value: stats.offers.active, icon: <Briefcase02Icon size={24} className="text-emerald-500" /> },
        { title: locale === 'fr' ? 'Offres En Attente' : 'Pending Offers', value: stats.offers.pending, icon: <Clock01Icon size={24} className="text-amber-500" /> },
        { title: locale === 'fr' ? 'Candidatures (Avg)' : 'Applications (Avg)', value: `${Math.round(stats.platform.average_match_score || 0)}%`, icon: <Activity01Icon size={24} className="text-purple-500" /> },
    ];

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="mb-10">
                <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter font-syne text-white">
                    {locale === 'fr' ? 'Tableau de bord' : 'Dashboard'}
                </h1>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">
                    {locale === 'fr' ? 'Vue globale des performances de la plateforme.' : 'Global view of platform performance.'}
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiCards.map((kpi, index) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        key={index} 
                        className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 relative overflow-hidden group hover:border-emerald-500/30 transition-colors"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[50px] -mr-16 -mt-16 transition-all duration-500 group-hover:bg-emerald-500/10" />
                        <div className="flex items-start justify-between mb-8 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
                                {kpi.icon}
                            </div>
                        </div>
                        <div className="relative z-10">
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">{kpi.title}</p>
                            <h3 className="text-2xl font-black font-syne text-white">{kpi.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Evolution Chart */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 lg:col-span-2 relative group"
                >
                    <h3 className="text-lg font-black italic uppercase tracking-tighter font-syne text-white mb-6">{locale === 'fr' ? 'Evolution des Inscriptions' : 'Registrations Trend'}</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.registrations_evolution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} dx={-10} />
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: '#09090b', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                />
                                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#09090b', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#10b981', stroke: '#09090b' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Top Opportunities */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 relative overflow-hidden"
                >
                    <h3 className="text-lg font-black italic uppercase tracking-tighter font-syne text-white mb-6">{locale === 'fr' ? 'Offres Populaires' : 'Popular Offers'}</h3>
                    <div className="space-y-4 relative z-10">
                        {stats.offers.top_consulted.length === 0 ? (
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest text-center mt-10">{locale === 'fr' ? 'Aucune donnee.' : 'No data.'}</p>
                        ) : (
                            stats.offers.top_consulted.map((offer) => (
                                <div key={offer.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-blue-500/30 transition-all cursor-default">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-white line-clamp-1 truncate max-w-[150px]">{offer.title}</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 truncate max-w-[150px]">{offer.user?.company_name}</span>
                                    </div>
                                    <div className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                                        {offer.views_count} {locale === 'fr' ? 'vues' : 'views'}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* Offers by Sector (PieChart) */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 lg:col-span-1 relative group"
                >
                    <h3 className="text-lg font-black italic uppercase tracking-tighter font-syne text-white mb-6">{locale === 'fr' ? 'Offres par Secteur' : 'Offers by Sector'}</h3>
                    <div className="h-64 w-full">
                        {stats.offers_by_sector.length === 0 ? (
                             <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest text-center mt-20">{locale === 'fr' ? 'Aucune donnee.' : 'No data.'}</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.offers_by_sector}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="count"
                                        labelLine={false}
                                        nameKey="sector"
                                    >
                                        {stats.offers_by_sector.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip 
                                        contentStyle={{ backgroundColor: '#09090b', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.div>

                {/* Live Activity Feed */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 lg:col-span-2 relative overflow-hidden"
                >
                    <h3 className="text-lg font-black italic uppercase tracking-tighter font-syne text-white mb-6">{locale === 'fr' ? "Flux d'Activites (Live)" : 'Activity Feed (Live)'}</h3>
                    <div className="space-y-4 relative z-10 max-h-80 overflow-y-auto pr-2">
                        {stats.activity_feed.length === 0 ? (
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest text-center mt-10">{locale === 'fr' ? 'Aucune activite recente.' : 'No recent activity.'}</p>
                        ) : (
                            <AnimatePresence>
                                {stats.activity_feed.map((activity, idx) => (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={`${activity.type}-${activity.id}`} 
                                        className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 relative"
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                            activity.type === 'user_registration' 
                                            ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' 
                                            : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                        }`}>
                                            {activity.type === 'user_registration' ? <UserGroupIcon size={16} /> : <Briefcase02Icon size={16} />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-white mb-1">{activity.title}</p>
                                            <p className="text-xs text-slate-400">{activity.description}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{activity.date}</p>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">{activity.time}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
