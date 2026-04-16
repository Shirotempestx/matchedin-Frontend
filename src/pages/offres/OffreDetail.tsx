import { useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import api from '@/lib/axios';
import { useAlert } from '@/components/alerts/useAlert';
import { useTranslation } from 'react-i18next';
import { normalizeLocale } from '@/i18n/config';
import {
    Briefcase02Icon, Location01Icon, MoneyBag02Icon,
    Calendar03Icon, Building04Icon, ArrowLeft01Icon,
    Tick01Icon, InformationCircleIcon, Tag01Icon, Target01Icon,
    FavouriteIcon
} from 'hugeicons-react';

interface Offre {
    id: number;
    title: string;
    description: string;
    location: string;
    work_mode: string;
    salary_min: number;
    salary_max: number;
    contract_type: string;
    skills_required: any[];
    skills_details: {
        id: number;
        level: number;
        name: string;
        category: string;
    }[];
    created_at: string;
    user: {
        id: number;
        slug?: string;
        company_name: string;
        industry: string;
        company_size: string;
        website: string;
    };
    match_percentage?: number;
}

export default function OffreDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { i18n } = useTranslation();
    const locale = normalizeLocale(location.pathname.split('/').filter(Boolean)[0] || i18n.language);
    const withLocale = (path: string) => `/${locale}${path}`;
    const buildEnterpriseProfilePath = (company: Offre['user']) => {
        const baseName = company.company_name || '';
        const fallbackSlug = baseName
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');

        const slug = company.slug || fallbackSlug || String(company.id);
        return withLocale(`/enterprises/${encodeURIComponent(slug)}`);
    };
    const { user, isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const { confirm, error: showError, notify } = useAlert();

    const [error, setError] = useState('');

    const { data: offre, isLoading } = useQuery<Offre>({
        queryKey: ['offre', id],
        queryFn: async () => {
            const res = await api.get(`/offres/${id}`);
            return res.data;
        },
    });

    const { data: applied = false } = useQuery({
        queryKey: ['has-applied', id, user?.id],
        queryFn: async () => {
            if (user?.role !== 'student') return false;
            const res = await api.get('/my-applications');
            // Backend returns paginated response, so we check res.data.data
            const applications = res.data.data || [];
            return applications.some((a: any) => a.offre_id === parseInt(id!));
        },
        enabled: !!user && user.role === 'student',
    });

    const applyMutation = useMutation({
        mutationFn: async (applicationMessage?: string) => {
            await api.post('/postulate', {
                offre_id: id,
                message: applicationMessage || ''
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['has-applied', id, user?.id] });
            notify({
                severity: 'success',
                title: locale === 'fr' ? 'Candidature envoyee' : 'Application sent',
                message: locale === 'fr' ? 'Votre candidature a bien ete enregistree.' : 'Your application has been submitted successfully.',
            });
        },
        onError: (err: any) => {
            const message = err.response?.data?.message || (locale === 'fr' ? 'Une erreur est survenue.' : 'An error occurred.');
            setError(message);
            showError(message);
        }
    });

    const { data: favorites = [] } = useQuery<any[]>({
        queryKey: ['favorites'],
        queryFn: async () => {
            const res = await api.get('/favorites');
            return res.data;
        },
        enabled: isAuthenticated && user?.role === 'student',
    });

    const isFavorited = favorites.some((f: any) => f.id === parseInt(id!));

    const toggleFavoriteMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post(`/favorites/${id}`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
        },
    });

    const handleToggleFavorite = () => {
        if (!isAuthenticated) {
            navigate(withLocale('/login'));
            return;
        }
        toggleFavoriteMutation.mutate();
    };

    const handleApply = () => {
        if (!isAuthenticated) {
            navigate(withLocale('/login'));
            return;
        }

        confirm({
            title: locale === 'fr' ? 'Confirmer ta Candidature' : 'Confirm your Application',
            message: locale === 'fr' ? 'Matchons ton talent avec cette opportunite.' : 'Match your talent with this opportunity.',
            inputLabel: locale === 'fr' ? 'Message (Optionnel)' : 'Message (Optional)',
            inputPlaceholder: locale === 'fr' ? 'Pourquoi etes-vous le candidat ideal ?' : 'Why are you the ideal candidate?',
            confirmText: locale === 'fr' ? 'Envoyer ma Candidature' : 'Send my Application',
            cancelText: locale === 'fr' ? 'Annuler' : 'Cancel',
            onConfirm: async (messageValue) => {
                await applyMutation.mutateAsync(messageValue);
            },
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!offre) {
        return (
            <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-white">
                <h1 className="text-4xl font-black font-syne italic uppercase mb-4 text-white/50">Offre non trouvée</h1>
                <Link to={withLocale('/offres')} className="text-emerald-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                    <ArrowLeft01Icon size={16} /> {locale === 'fr' ? 'Retour aux offres' : 'Back to offers'}
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090b] text-white pt-24 pb-20 px-6 relative overflow-hidden selection:bg-emerald-600/30">
            {/* Ambient glows */}
            <div className="fixed top-[-10%] right-[-5%] w-150 h-150 bg-emerald-600/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="fixed bottom-[-10%] left-[-5%] w-150 h-150 bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Back button */}
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-3 text-slate-500 hover:text-white transition-colors mb-12 group"
                >
                    <div className="w-10 h-10 rounded-full bg-white/3 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ArrowLeft01Icon size={18} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{locale === 'fr' ? 'Retour' : 'Back'}</span>
                </motion.button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                                <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter font-syne leading-[0.9]">
                                    {offre.title}
                                </h1>
                                {offre.match_percentage !== undefined && (
                                    <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 text-xs font-black uppercase tracking-widest w-fit shrink-0 ${offre.match_percentage >= 80
                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                        : offre.match_percentage >= 50
                                            ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                                        }`}>
                                        <Target01Icon size={16} />
                                        {offre.match_percentage}% MATCH
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-4 items-center">
                                <div className="px-4 py-2 bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 rounded-xl flex items-center gap-2">
                                    <Tag01Icon size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{offre.contract_type}</span>
                                </div>
                                <div className="px-4 py-2 bg-blue-600/10 border border-blue-500/20 text-blue-500 rounded-xl flex items-center gap-2">
                                    <Globe02Icon size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{offre.work_mode}</span>
                                </div>
                                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                    <Calendar03Icon size={14} />
                                    {locale === 'fr' ? 'Publie le' : 'Published on'} {new Date(offre.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="p-8 bg-white/2 border border-white/5 rounded-4xl space-y-8"
                        >
                            <div className="space-y-4">
                                <h2 className="text-xl font-black italic uppercase tracking-tight font-syne flex items-center gap-3">
                                    <InformationCircleIcon size={20} className="text-emerald-500" />
                                    {locale === 'fr' ? 'Description du Poste' : 'Job Description'}
                                </h2>
                                <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                                    {offre.description}
                                </p>
                            </div>

                            <div className="space-y-4 pt-8 border-t border-white/5">
                                <h2 className="text-xl font-black italic uppercase tracking-tight font-syne flex items-center gap-3">
                                    <Briefcase02Icon size={20} className="text-purple-500" />
                                    {locale === 'fr' ? 'Competences Requises' : 'Required Skills'}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    {(offre.skills_details || []).map((skill) => (
                                        <div
                                            key={skill.id}
                                            className="flex items-center justify-between p-4 bg-white/3 border border-white/10 rounded-[22px] group hover:bg-white/6 transition-all"
                                        >
                                            <div className="flex flex-col gap-1">
                                                <span className="text-white text-[11px] font-black uppercase tracking-widest">
                                                    {skill.name}
                                                </span>
                                                <span className="text-slate-500 text-[8px] font-bold uppercase tracking-tighter">
                                                    {skill.category}
                                                </span>
                                            </div>

                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map((lvl) => (
                                                    <div
                                                        key={lvl}
                                                        className={`w-2 h-2 rounded-full border transition-all ${skill.level >= lvl
                                                            ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                                                            : 'border-white/10'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Company & Apply */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-6"
                    >
                        {/* Company Card */}
                        <div className="p-8 bg-white/2 border border-white/5 rounded-4xl space-y-6">
                            <div className="flex items-center gap-4">
                                <Link to={buildEnterpriseProfilePath(offre.user)} className="w-16 h-16 rounded-3xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center hover:scale-105 transition-transform">
                                    <Building04Icon size={32} className="text-emerald-500" />
                                </Link>
                                <div>
                                    <Link to={buildEnterpriseProfilePath(offre.user)} className="hover:text-emerald-500 transition-colors">
                                        <h3 className="text-lg font-black italic uppercase tracking-tight font-syne">{offre.user.company_name}</h3>
                                    </Link>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{offre.user.industry}</p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-6 border-t border-white/5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Location01Icon size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none">{locale === 'fr' ? 'Localisation' : 'Location'}</span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">{offre.location || (locale === 'fr' ? 'Distanciel' : 'Remote')}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <MoneyBag02Icon size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none">{locale === 'fr' ? 'Salaire' : 'Salary'}</span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                                        {offre.salary_min && offre.salary_max ? `${offre.salary_min}€ - ${offre.salary_max}€` : (locale === 'fr' ? 'A negocier' : 'Negotiable')}
                                    </span>
                                </div>
                            </div>

                            {offre.user.website && (
                                <a
                                    href={offre.user.website.startsWith('http') ? offre.user.website : `https://${offre.user.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full text-center py-4 bg-white/3 hover:bg-white/8 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    {locale === 'fr' ? 'Visiter le Site Web' : 'Visit Website'}
                                </a>
                            )}
                        </div>

                        {/* Apply Action */}
                        <div className="p-8 bg-white/2 border border-white/5 rounded-4xl space-y-6 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[50px] -mr-16 -mt-16" />

                            <div className="relative z-10">
                                <h4 className="text-sm font-black italic uppercase tracking-tighter font-syne mb-2">{locale === 'fr' ? 'Pret a relever le defi ?' : 'Ready for the challenge?'}</h4>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-6">{locale === 'fr' ? "Match avec cette offre et commencez l'aventure." : 'Match this offer and start your journey.'}</p>

                                {applied ? (
                                    <div className="w-full py-5 bg-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center gap-3 border border-emerald-500/30">
                                        <Tick01Icon size={18} />
                                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">{locale === 'fr' ? 'Candidature Envoyee' : 'Application Sent'}</span>
                                    </div>
                                ) : user?.role === 'enterprise' ? (
                                    <div className="w-full py-5 bg-white/3 text-slate-500 rounded-2xl flex items-center justify-center gap-3 border border-white/10 italic">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{locale === 'fr' ? 'Mode Recruteur' : 'Recruiter Mode'}</span>
                                    </div>
                                ) : (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleApply}
                                            className="flex-1 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-500/20 group-hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <span className="text-[11px] font-black uppercase tracking-[0.2em]">{locale === 'fr' ? 'Postuler Maintenant' : 'Apply Now'}</span>
                                        </button>
                                        <button
                                            onClick={handleToggleFavorite}
                                            className={`w-16 h-full py-5 rounded-2xl border flex items-center justify-center transition-all ${isFavorited
                                                ? 'bg-red-500/10 border-red-500/20 text-red-500'
                                                : 'bg-white/5 border-white/10 text-slate-500 hover:text-red-500 hover:border-red-500/30'
                                                }`}
                                        >
                                            <FavouriteIcon size={20} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {error && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-120 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest">
                    {error}
                </div>
            )}
        </div>
    );
}

function Globe02Icon({ size = 24, ...props }: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    )
}
