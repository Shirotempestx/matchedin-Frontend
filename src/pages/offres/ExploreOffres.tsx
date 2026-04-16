import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/axios';
import { useTranslation } from 'react-i18next';
import { normalizeLocale } from '@/i18n/config';
import {
    Search01Icon, Location01Icon, Briefcase02Icon,
    ArrowRight01Icon, Building04Icon, MoneyBag02Icon, FilterIcon,
    ArrowLeft01Icon, Target01Icon, FavouriteIcon
} from 'hugeicons-react';
import { useAuth } from '@/lib/auth';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';


interface Offre {
    id: number;
    title: string;
    description: string;
    location: string | null;
    work_mode: string;
    salary_min: number | null;
    salary_max: number | null;
    contract_type: string;

    skills_required: Array<string | { id: number; level?: number; name?: string }> | null;
    skills_details?: {
        id: number;
        level: number;
        name: string;
        category: string;
    }[];

    // skills_required: Array<string | { id: number; level?: number; name?: string }> | null;
    // skills_details?: Array<{ id: number; name?: string }>;

    created_at: string;
    user: {
        id: number;
        name: string;
        company_name: string | null;
        industry: string | null;
        company_size: string | null;
        slug?: string;
    };
    match_percentage?: number;
}

interface PaginatedResponse {
    data: Offre[];
    current_page: number;
    last_page: number;
    total: number;
}

export default function ExploreOffres() {
    const navigate = useNavigate();
    const location = useLocation();
    const { i18n } = useTranslation();
    const locale = normalizeLocale(location.pathname.split('/').filter(Boolean)[0] || i18n.language);
    const withLocale = (path: string) => `/${locale}${path}`;
    const [search, setSearch] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [locSearch, setLocSearch] = useState('');
    const [appliedLocSearch, setAppliedLocSearch] = useState('');
    const [companySearch, setCompanySearch] = useState('');
    const [appliedCompanySearch, setAppliedCompanySearch] = useState('');
    const [salaryMin, setSalaryMin] = useState<number | ''>('');
    const [appliedSalaryMin, setAppliedSalaryMin] = useState<number | ''>('');
    const [minMatch, setMinMatch] = useState<number | ''>('');
    const [appliedMinMatch, setAppliedMinMatch] = useState<number | ''>('');
    const [workModeFilter, setWorkModeFilter] = useState('');
    const [contractFilter, setContractFilter] = useState('');
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [nowTs, setNowTs] = useState(() => Date.now());
    const [data, setData] = useState<PaginatedResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const { isAuthenticated, user } = useAuth();
    const queryClient = useQueryClient();

    const { data: favorites = [] } = useQuery<any[]>({
        queryKey: ['favorites'],
        queryFn: async () => {
            const res = await api.get('/favorites');
            return res.data;
        },
        enabled: isAuthenticated && user?.role === 'student',
    });

    const isFavorited = (offreId: number) => favorites.some((f: any) => f.id === offreId);

    const toggleFavoriteMutation = useMutation({
        mutationFn: async (offreId: number) => {
            const res = await api.post(`/favorites/${offreId}`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
        },
    });

    const handleToggleFavorite = (e: React.MouseEvent, offreId: number) => {
        e.stopPropagation();
        if (!isAuthenticated) {
            navigate(withLocale('/login'));
            return;
        }
        toggleFavoriteMutation.mutate(offreId);
    };

    useEffect(() => {
        const id = window.setInterval(() => setNowTs(Date.now()), 60000);
        return () => window.clearInterval(id);
    }, []);

    // Handle company filter from URL params
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const companyFromUrl = params.get('company');
        if (companyFromUrl) {
            setCompanySearch(companyFromUrl);
            setAppliedCompanySearch(companyFromUrl);
            setIsFiltersOpen(true);
        }
    }, [location.search]);

    useEffect(() => {
        let cancelled = false;

        const fetchOffres = async () => {
            setIsLoading(true);
            setIsError(false);

            try {
                const params: Record<string, string | number> = { page };
                if (appliedSearch) params.search = appliedSearch;
                if (appliedLocSearch) params.location = appliedLocSearch;
                if (appliedCompanySearch) params.company = appliedCompanySearch;
                if (appliedSalaryMin) params.salary_min = appliedSalaryMin;
                if (appliedMinMatch) params.min_match = appliedMinMatch;
                if (workModeFilter) params.work_mode = workModeFilter;
                if (contractFilter) params.contract_type = contractFilter;

                const res = await api.get<PaginatedResponse>('/offres', { params });
                if (!cancelled) {
                    setData(res.data);
                }
            } catch {
                if (!cancelled) {
                    setIsError(true);
                    setData(null);
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        fetchOffres();

        return () => {
            cancelled = true;
        };
    }, [
        appliedSearch,
        appliedLocSearch,
        appliedCompanySearch,
        appliedSalaryMin,
        appliedMinMatch,
        workModeFilter,
        contractFilter,
        page,
    ]);

    const offres: Offre[] = data?.data ?? [];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setAppliedSearch(search);
        setAppliedLocSearch(locSearch);
        setAppliedCompanySearch(companySearch);
        setAppliedSalaryMin(salaryMin);
        setAppliedMinMatch(minMatch);
        setPage(1);
    };

    const formatSalary = (min?: number | null, max?: number | null) => {
        if (!min && !max) return null;
        if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
        if (min) return locale === 'fr' ? `A partir de $${min.toLocaleString()}` : `From $${min.toLocaleString()}`;
        return locale === 'fr' ? `Jusqu'a $${max!.toLocaleString()}` : `Up to $${max!.toLocaleString()}`;
    };

    const timeAgo = (date: string) => {
        const diff = Math.floor((nowTs - new Date(date).getTime()) / 1000);
        if (diff < 60) return locale === 'fr' ? "A l'instant" : 'Just now';
        if (diff < 3600) return locale === 'fr' ? `Il y a ${Math.floor(diff / 60)} min` : `${Math.floor(diff / 60)} min ago`;
        if (diff < 86400) return locale === 'fr' ? `Il y a ${Math.floor(diff / 3600)}h` : `${Math.floor(diff / 3600)}h ago`;
        return locale === 'fr' ? `Il y a ${Math.floor(diff / 86400)}j` : `${Math.floor(diff / 86400)}d ago`;
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-white pt-24 pb-12 px-6 overflow-hidden">
            <div className="max-w-7xl mx-auto space-y-10 relative z-10">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                    {appliedCompanySearch ? (
                        <>
                            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter font-syne">
                                {locale === 'fr' ? 'Offres de ' : 'Offers from '}<span className="text-blue-500">{appliedCompanySearch}</span>
                            </h1>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
                                {locale === 'fr' ? "Toutes les opportunites en attente" : 'All pending opportunities'}
                            </p>
                        </>
                    ) : (
                        <>
                            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter font-syne">
                                {locale === 'fr' ? 'Explorer les ' : 'Explore '}<span className="text-blue-500">{locale === 'fr' ? 'Opportunites' : 'Opportunities'}</span>
                            </h1>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
                                {locale === 'fr' ? "Trouvez l'offre qui correspond a vos competences et ambitions." : 'Find the offer that matches your skills and goals.'}
                            </p>
                        </>
                    )}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-white/[0.02] border border-white/5 rounded-[32px] p-6 space-y-4">
                    <form onSubmit={handleSearch} className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row gap-4 w-full">
                            <div className="flex-1 relative group">
                                <Search01Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input type="text" placeholder={locale === 'fr' ? 'Rechercher par titre...' : 'Search by title...'} value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-2xl text-[13px] font-medium text-white focus:outline-none focus:border-blue-500 focus:bg-white/[0.05] transition-all placeholder:text-slate-500 placeholder:font-normal"
                                />
                            </div>
                            <button type="button" onClick={() => setIsFiltersOpen(!isFiltersOpen)} className="px-4 py-3 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-2xl text-[13px] font-semibold tracking-wide transition-all flex items-center justify-center gap-2">
                                <FilterIcon size={18} className={isFiltersOpen ? "text-blue-500" : "text-slate-400"} />
                                <span>{locale === 'fr' ? 'Filtres' : 'Filters'}</span>
                            </button>
                            <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-2xl text-[13px] font-semibold tracking-wide transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2">
                                <Search01Icon size={18} />
                                <span className="hidden md:inline">{locale === 'fr' ? 'Rechercher' : 'Search'}</span>
                            </button>
                        </div>
                        {isFiltersOpen && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex-1 flex flex-col gap-4 pt-2">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1 relative group">
                                        <Location01Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input type="text" placeholder={locale === 'fr' ? 'Ville / Pays' : 'City / Country'} value={locSearch}
                                            onChange={e => setLocSearch(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-2xl text-[13px] font-medium text-white focus:outline-none focus:border-blue-500 focus:bg-white/[0.05] transition-all placeholder:text-slate-500 placeholder:font-normal"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-[2] relative group">
                                        <Building04Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input type="text" placeholder={locale === 'fr' ? 'Entreprise...' : 'Company...'} value={companySearch}
                                            onChange={e => setCompanySearch(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-2xl text-[13px] font-medium text-white focus:outline-none focus:border-blue-500 focus:bg-white/[0.05] transition-all placeholder:text-slate-500 placeholder:font-normal"
                                        />
                                    </div>
                                    <div className="flex-[1] relative group">
                                        <MoneyBag02Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input type="number" placeholder={locale === 'fr' ? 'Salaire min' : 'Min salary'} value={salaryMin}
                                            onChange={e => setSalaryMin(e.target.value ? Number(e.target.value) : '')}
                                            className="w-full pl-11 pr-4 py-3 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-2xl text-[13px] font-medium text-white focus:outline-none focus:border-blue-500 focus:bg-white/[0.05] transition-all placeholder:text-slate-500 placeholder:font-normal"
                                        />
                                    </div>
                                    <div className="flex-[1] relative group bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-2 flex flex-col justify-center transition-all">
                                        <div className="flex justify-between items-center py-1">
                                            <div className="flex items-center gap-2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                                <Target01Icon size={14} />
                                                <span className="text-[11px] font-medium">{locale === 'fr' ? 'Matching min' : 'Min matching'}</span>
                                            </div>
                                            <span className="text-[12px] font-bold text-white">{minMatch || 0}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" value={minMatch === '' ? 0 : minMatch}
                                            onChange={e => setMinMatch(Number(e.target.value))}
                                            onMouseUp={e => { setAppliedMinMatch(Number((e.target as HTMLInputElement).value)); setPage(1); }}
                                            onTouchEnd={e => { setAppliedMinMatch(Number((e.target as HTMLInputElement).value)); setPage(1); }}
                                            className="w-full accent-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 items-center flex-wrap pb-1">
                                    {['', 'Remote', 'Hybrid', 'On-site'].map(mode => (
                                        <button type="button" key={mode} onClick={() => { setWorkModeFilter(mode); setPage(1); }}
                                            className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${workModeFilter === mode ? 'bg-blue-600 text-white border-blue-600' : 'bg-white/[0.03] text-slate-500 border-white/10 hover:text-white hover:border-white/30'}`}>
                                            {mode || (locale === 'fr' ? 'Tous Modes' : 'All Modes')}
                                        </button>
                                    ))}
                                    <div className="w-px h-4 bg-white/10 mx-1" />
                                    {['', 'CDI', 'CDD', 'Stage', 'Freelance'].map(type => (
                                        <button type="button" key={type} onClick={() => { setContractFilter(type); setPage(1); }}
                                            className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${contractFilter === type ? 'bg-blue-600 text-white border-blue-600' : 'bg-white/[0.03] text-slate-500 border-white/10 hover:text-white hover:border-white/30'}`}>
                                            {type || (locale === 'fr' ? 'Tous Contrats' : 'All Contracts')}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </form>
                </motion.div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : isError || offres.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-20 bg-white/[0.01] border border-white/5 border-dashed rounded-[32px]">
                        <Briefcase02Icon size={48} className="text-white/20 mb-4" />
                        <h3 className="font-syne font-black uppercase text-xl text-white/50">{isError ? (locale === 'fr' ? 'Erreur de chargement' : 'Loading error') : (locale === 'fr' ? 'Aucune offre trouvee' : 'No offers found')}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mt-2">{locale === 'fr' ? "Essayez d'ajuster vos filtres ou revenez plus tard." : 'Try adjusting filters or come back later.'}</p>
                    </motion.div>
                ) : (
                    <div className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {offres.map((offre: Offre, i: number) => (
                                <motion.div key={offre.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => navigate(withLocale(`/offres/${offre.id}`))}
                                    className="p-6 bg-white/[0.02] border border-white/5 rounded-[32px] group hover:bg-white/[0.04] hover:border-blue-500/30 transition-all cursor-pointer relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-[50px] -mr-10 -mt-10 group-hover:bg-blue-600/10 transition-colors" />

                                    <div className="flex items-start justify-between mb-6 relative z-10">
                                        <div className="w-12 h-12 rounded-[18px] bg-white/[0.05] border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Briefcase02Icon size={24} className="text-slate-500 group-hover:text-blue-500 transition-colors" />
                                        </div>
                                        {offre.match_percentage !== undefined && offre.match_percentage > 0 && (
                                            <div className={`px-2 py-1 rounded-xl border flex items-center gap-1 text-[8px] font-black uppercase tracking-widest ${offre.match_percentage >= 80 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                offre.match_percentage >= 50 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                    'bg-red-500/10 text-red-500 border-red-500/20'
                                                }`}>
                                                <Target01Icon size={10} />
                                                {offre.match_percentage}% MATCH
                                            </div>
                                        )}
                                        {user?.role === 'student' && (
                                            <button
                                                onClick={(e) => handleToggleFavorite(e, offre.id)}
                                                className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${isFavorited(offre.id)
                                                    ? 'bg-red-500/10 border-red-500/20 text-red-500'
                                                    : 'bg-white/5 border-white/10 text-slate-500 hover:text-red-500 hover:border-red-500/30'
                                                    }`}
                                            >
                                                <FavouriteIcon size={16} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-4 mb-6 relative z-10">
                                        <div>
                                            <h3 className="text-lg font-black italic uppercase tracking-tight text-white group-hover:text-blue-500 transition-colors line-clamp-1">{offre.title}</h3>
                                            <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mt-1 flex items-center gap-1">
                                                <Building04Icon size={12} />
                                                {offre.user.company_name || offre.user.name}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <span className="px-2 py-1 bg-white/[0.05] rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 border border-white/5">{offre.contract_type}</span>
                                            <span className="px-2 py-1 bg-blue-600/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-blue-500 border border-blue-600/20">{offre.work_mode}</span>
                                        </div>

                                        {(offre.location || formatSalary(offre.salary_min, offre.salary_max)) && (
                                            <div className="space-y-1.5 pt-2 border-t border-white/5">
                                                {offre.location && (
                                                    <div className="flex items-center gap-2 text-slate-500">
                                                        <Location01Icon size={12} />
                                                        <span className="text-[9px] font-bold uppercase tracking-widest">{offre.location}</span>
                                                    </div>
                                                )}
                                                {formatSalary(offre.salary_min, offre.salary_max) && (
                                                    <div className="flex items-center gap-2 text-emerald-500/80">
                                                        <MoneyBag02Icon size={12} />
                                                        <span className="text-[9px] font-bold uppercase tracking-widest">
                                                            {formatSalary(offre.salary_min, offre.salary_max)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5 relative z-10">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">
                                            {timeAgo(offre.created_at)}
                                        </span>
                                        <ArrowRight01Icon size={16} className="text-slate-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {data && data.last_page > 1 && (
                            <div className="flex justify-center items-center gap-4 py-8">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className="p-4 app-soft border app-border rounded-2xl text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ArrowLeft01Icon size={18} />
                                </button>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
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

            <div className="fixed top-[20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none z-0" />
        </div>
    );
}
