import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useTranslation } from 'react-i18next';
import { normalizeLocale } from '@/i18n/config';
import {
    Briefcase02Icon, Building04Icon, Calendar03Icon,
    Tick01Icon, Clock01Icon, Cancel01Icon,
    ArrowRight01Icon, ArrowLeft01Icon
} from 'hugeicons-react';

interface Application {
    id: number;
    status: string;
    message: string;
    created_at: string;
    offre: {
        id: number;
        title: string;
        user: {
            company_name: string;
            industry: string;
        }
    }
}

interface PaginatedApplications {
    data: Application[];
    current_page: number;
    last_page: number;
    total: number;
}

export default function MyApplications() {
    const navigate = useNavigate();
    const location = useLocation();
    const { i18n } = useTranslation();
    const locale = normalizeLocale(location.pathname.split('/').filter(Boolean)[0] || i18n.language);
    const withLocale = (path: string) => `/${locale}${path}`;
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery<PaginatedApplications>({
        queryKey: ['my-applications', page],
        queryFn: async () => {
            const res = await api.get('/my-applications', { params: { page } });
            return res.data;
        },
    });

    const applications = data?.data || [];

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'accepted': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'accepted': return <Tick01Icon size={14} />;
            case 'rejected': return <Cancel01Icon size={14} />;
            default: return <Clock01Icon size={14} />;
        }
    };

    return (
        <div className="app-page pt-24 pb-12 px-6 overflow-hidden">
            <div className="max-w-5xl mx-auto space-y-10 relative z-10">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter font-syne">
                        {locale === 'fr' ? 'Mes ' : 'My '}<span className="text-blue-500">{locale === 'fr' ? 'Candidatures' : 'Applications'}</span>
                    </h1>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">{locale === 'fr' ? "Suivez l'etat de vos postulations en temps reel." : 'Track your applications in real time.'}</p>
                </motion.div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : applications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 app-card border app-border border-dashed rounded-[40px]">
                        <Briefcase02Icon size={48} className="text-white/10 mb-6" />
                        <h3 className="font-syne font-black uppercase text-xl text-white/50">{locale === 'fr' ? 'Aucune candidature' : 'No applications'}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mt-2">{locale === 'fr' ? "Vous n'avez pas encore postule a des offres." : 'You have not applied to any offers yet.'}</p>
                        <button onClick={() => navigate(withLocale('/offres'))} className="mt-8 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                            {locale === 'fr' ? 'Explorer les opportunites' : 'Explore opportunities'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-10">
                        <div className="grid grid-cols-1 gap-4">
                            {applications.map((app, i) => (
                                <motion.div
                                    key={app.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    onClick={() => navigate(withLocale(`/offres/${app.offre.id}`))}
                                    className="p-6 app-card border app-border rounded-[24px] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/30 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <Building04Icon size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black italic uppercase tracking-tight font-syne">{app.offre.title}</h3>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">
                                                {app.offre.user.company_name} • {app.offre.user.industry}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-6">
                                        <div className="flex flex-col items-end">
                                            <div className={`px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${getStatusStyle(app.status)}`}>
                                                {getStatusIcon(app.status)}
                                                {app.status === 'pending' ? (locale === 'fr' ? 'En attente' : 'Pending') : app.status === 'accepted' ? (locale === 'fr' ? 'Acceptee' : 'Accepted') : (locale === 'fr' ? 'Refusee' : 'Rejected')}
                                            </div>
                                            <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-2 flex items-center gap-1">
                                                <Calendar03Icon size={10} /> {new Date(app.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <ArrowRight01Icon size={18} className="text-white/10 group-hover:text-white transition-colors hidden md:block" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {data && data.last_page > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-12">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className="p-4 app-soft border app-border rounded-2xl text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ArrowLeft01Icon size={18} />
                                </button>
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    {locale === 'fr' ? 'Page' : 'Page'} <span className="text-blue-500">{page}</span> {locale === 'fr' ? 'sur' : 'of'} {data.last_page}
                                </span>
                                <button
                                    disabled={page === data.last_page}
                                    onClick={() => setPage(p => Math.min(data.last_page, p + 1))}
                                    className="p-4 app-soft border app-border rounded-2xl text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ArrowRight01Icon size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="fixed top-[10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
        </div>
    );
}
