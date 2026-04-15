import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/axios';
import { normalizeLocale } from '@/i18n/config';
import { useTranslation } from 'react-i18next';
import {
    UserIcon, Search01Icon, GlobalIcon, Location01Icon,
    Briefcase02Icon, Mail01Icon, MoneyBag02Icon,
    ArrowRight01Icon, Target01Icon, FilterIcon, Book02Icon,
    ArrowLeft01Icon, Message01Icon
} from 'hugeicons-react';

interface Student {
    id: number;
    slug?: string;
    name: string;
    email: string;
    country: string;
    work_mode: string;
    profile_type: string;
    skill_ids: unknown[];
    match_percentage?: number;
}

interface PaginatedResponse {
    data: Student[];
    current_page: number;
    last_page: number;
    total: number;
}

import SkillSelector from '@/components/shared/SkillSelector';

export default function ExploreStudents() {
    const location = useLocation();
    const { i18n } = useTranslation();
    const routeLocale = normalizeLocale(location.pathname.split('/').filter(Boolean)[0] || localStorage.getItem('preferred_language') || i18n.language || 'fr');
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [locSearch, setLocSearch] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [appliedLocSearch, setAppliedLocSearch] = useState('');
    const [profileTypeSearch, setProfileTypeSearch] = useState('');
    const [appliedProfileTypeSearch, setAppliedProfileTypeSearch] = useState('');
    const [educationLevelSearch, setEducationLevelSearch] = useState('');
    const [appliedEducationLevelSearch, setAppliedEducationLevelSearch] = useState('');
    const [salaryMax, setSalaryMax] = useState<number | ''>('');
    const [appliedSalaryMax, setAppliedSalaryMax] = useState<number | ''>('');
    const [workModeFilter, setWorkModeFilter] = useState('');
    const [selectedSkills, setSelectedSkills] = useState<{ id: number, level: number }[]>([]);
    const [appliedSelectedSkills, setAppliedSelectedSkills] = useState<{ id: number, level: number }[]>([]);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [responseData, setResponseData] = useState<PaginatedResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const handleContact = async (userId: number) => {
        setIsActionLoading(true);
        try {
            const res = await api.post("/conversations", { target_user_id: userId });
            navigate(`/${routeLocale}/messages/${res.data.conversation.id}`);
        } catch (e) {
            console.error("Failed to start conversation", e);
        } finally {
            setIsActionLoading(false);
        }
    };

    const buildStudentProfilePath = (student: Student) => {
        const fallbackSlug = student.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');

        const slug = student.slug || fallbackSlug || String(student.id);
        return `/${routeLocale}/students/${encodeURIComponent(slug)}`;
    };

    useEffect(() => {
        let cancelled = false;

        const fetchStudents = async () => {
            setIsLoading(true);
            setIsError(false);

            try {
                const params: Record<string, string | number> = { page };
                if (appliedSearch) params.search = appliedSearch;
                if (appliedLocSearch) params.location = appliedLocSearch;
                if (appliedProfileTypeSearch) params.profile_type = appliedProfileTypeSearch;
                if (appliedEducationLevelSearch) params.education_level = appliedEducationLevelSearch;
                if (appliedSalaryMax) params.salary_max = appliedSalaryMax;
                if (workModeFilter) params.work_mode = workModeFilter;
                if (appliedSelectedSkills && appliedSelectedSkills.length > 0) {
                    params.skills = appliedSelectedSkills.map(s => s.id).join(',');
                }

                const res = await api.get<PaginatedResponse>('/students', { params });
                if (!cancelled) {
                    setResponseData(res.data);
                }
            } catch {
                if (!cancelled) {
                    setIsError(true);
                    setResponseData(null);
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        fetchStudents();

        return () => {
            cancelled = true;
        };
    }, [
        appliedSearch,
        appliedLocSearch,
        appliedProfileTypeSearch,
        appliedEducationLevelSearch,
        appliedSalaryMax,
        appliedSelectedSkills,
        workModeFilter,
        page,
    ]);

    const students = responseData?.data || [];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setAppliedSearch(search);
        setAppliedLocSearch(locSearch);
        setAppliedProfileTypeSearch(profileTypeSearch);
        setAppliedEducationLevelSearch(educationLevelSearch);
        setAppliedSalaryMax(salaryMax);
        setAppliedSelectedSkills(selectedSkills);
        setPage(1);
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-white pt-24 pb-12 px-6 overflow-hidden">
            <div className="max-w-7xl mx-auto space-y-12 relative z-10">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-3">
                        <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter font-syne leading-none">
                            {routeLocale === 'fr' ? 'Decouvrir les ' : 'Discover '}<span className="text-emerald-500">Talents</span>
                        </h1>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">
                            {routeLocale === 'fr' ? "Explorez notre reseau d'etudiants d'elite." : 'Explore our elite student network.'}
                        </p>
                    </div>
                </header>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-white/[0.02] border border-white/5 rounded-[32px] p-6 space-y-4">
                    <form onSubmit={handleSearch} className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row gap-4 w-full">
                            <div className="flex-1 relative group">
                                <Search01Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                <input type="text" placeholder={routeLocale === 'fr' ? 'Rechercher un nom ou un profil...' : 'Search name or profile...'} value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-2xl text-[13px] font-medium text-white focus:outline-none focus:border-emerald-500 focus:bg-white/[0.05] transition-all placeholder:text-slate-500 placeholder:font-normal"
                                />
                            </div>
                            <button type="button" onClick={() => setIsFiltersOpen(!isFiltersOpen)} className="px-4 py-3 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-2xl text-[13px] font-semibold tracking-wide transition-all flex items-center justify-center gap-2">
                                <FilterIcon size={18} className={isFiltersOpen ? 'text-emerald-500' : 'text-slate-400'} />
                                <span>{routeLocale === 'fr' ? 'Filtres' : 'Filters'}</span>
                            </button>
                            <button type="submit" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-[13px] font-semibold tracking-wide transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2">
                                <Search01Icon size={18} />
                                <span className="hidden md:inline">{routeLocale === 'fr' ? 'Rechercher' : 'Search'}</span>
                            </button>
                        </div>

                        {isFiltersOpen && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex-1 flex flex-col gap-4 pt-2">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1 relative group">
                                        <Location01Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <input type="text" placeholder={routeLocale === 'fr' ? 'Ville / Pays' : 'City / Country'} value={locSearch}
                                            onChange={e => setLocSearch(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-2xl text-[13px] font-medium text-white focus:outline-none focus:border-emerald-500 focus:bg-white/[0.05] transition-all placeholder:text-slate-500 placeholder:font-normal"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-[2] relative group">
                                        <Briefcase02Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <select
                                            value={profileTypeSearch}
                                            onChange={e => setProfileTypeSearch(e.target.value)}
                                            className="w-full pl-11 pr-10 py-3 bg-[#0f172a] hover:bg-white/[0.05] border border-white/10 rounded-2xl text-[13px] font-medium text-white focus:outline-none focus:border-emerald-500 focus:bg-[#0f172a] transition-all appearance-none cursor-pointer [&>option]:text-slate-900 [&>option]:bg-white"
                                        >
                                            <option value="">{routeLocale === 'fr' ? 'Type de profil...' : 'Profile type...'}</option>
                                            <option value="IT">IT / Tech</option>
                                            <option value="NON_IT">Non-IT / Business</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                        </div>
                                    </div>

                                    <div className="flex-[2] relative group">
                                        <Book02Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <select
                                            value={educationLevelSearch}
                                            onChange={e => setEducationLevelSearch(e.target.value)}
                                            className="w-full pl-11 pr-10 py-3 bg-[#0f172a] hover:bg-white/[0.05] border border-white/10 rounded-2xl text-[13px] font-medium text-white focus:outline-none focus:border-emerald-500 focus:bg-[#0f172a] transition-all appearance-none cursor-pointer [&>option]:text-slate-900 [&>option]:bg-white"
                                        >
                                            <option value="">{routeLocale === 'fr' ? "Niveau d'etudes..." : 'Education level...'}</option>
                                            <option value="Bac+2">Bac+2</option>
                                            <option value="Bac+3">Bac+3 / Licence</option>
                                            <option value="Bac+5">Bac+5 / Master</option>
                                            <option value="Doctorat">Doctorat / Ph.D</option>
                                            <option value="Bootcamp">Bootcamp / Certification</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                        </div>
                                    </div>

                                    <div className="flex-[1] relative group">
                                        <MoneyBag02Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <input type="number" placeholder={routeLocale === 'fr' ? 'Salaire max' : 'Max salary'} value={salaryMax}
                                            onChange={e => setSalaryMax(e.target.value ? Number(e.target.value) : '')}
                                            className="w-full pl-11 pr-4 py-3 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-2xl text-[13px] font-medium text-white focus:outline-none focus:border-emerald-500 focus:bg-white/[0.05] transition-all placeholder:text-slate-500 placeholder:font-normal"
                                        />
                                    </div>
                                </div>

                                <div className="relative z-[60] mt-2">
                                    <SkillSelector 
                                        onUpdate={setSelectedSkills} 
                                        defaultProfileType="ALL"
                                        showDomainCards={false}
                                        hideEmptyState={true}
                                        accentColor="emerald"
                                    />
                                </div>

                                <div className="flex gap-3 items-center flex-wrap pb-1">
                                    {['', 'Remote', 'Hybrid', 'On-site'].map(mode => (
                                        <button type="button" key={mode} onClick={() => { setWorkModeFilter(mode); setPage(1); }}
                                            className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${workModeFilter === mode ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white/[0.03] text-slate-500 border-white/10 hover:text-white hover:border-white/30'}`}>
                                            {mode || (routeLocale === 'fr' ? 'Tous Modes' : 'All Modes')}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </form>
                </motion.div>

                {isLoading ? (
                    <div className="flex justify-center py-32">
                        <div className="w-10 h-10 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : isError || students.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-20 bg-white/[0.01] border border-white/5 border-dashed rounded-[32px]">
                        <UserIcon size={48} className="text-white/20 mb-4" />
                        <h3 className="font-syne font-black uppercase text-xl text-white/50">{isError ? (routeLocale === 'fr' ? 'Erreur de chargement' : 'Loading error') : (routeLocale === 'fr' ? 'Aucun talent trouve' : 'No talents found')}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mt-2">{routeLocale === 'fr' ? "Essayez d'ajuster vos filtres ou revenez plus tard." : 'Try adjusting filters or come back later.'}</p>
                    </motion.div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {students.map((student, i) => (
                                <motion.div
                                    key={student.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="p-8 bg-white/[0.02] border border-white/5 rounded-[40px] group hover:border-emerald-500/20 transition-all relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-600/5 rounded-full blur-[60px] -mr-20 -mt-20 group-hover:bg-emerald-600/10 transition-colors" />

                                    <div className="flex items-center gap-5 mb-8 relative z-10">
                                        <div className="w-16 h-16 rounded-[24px] bg-white/[0.05] border border-white/10 flex items-center justify-center">
                                            <UserIcon size={32} className="text-slate-700 group-hover:text-emerald-500 transition-colors" />
                                        </div>
                                        <div className="flex items-start justify-between w-full">
                                            <div>
                                                <h3 className="text-xl font-black italic uppercase tracking-tight font-syne">{student.name}</h3>
                                                <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mt-1">
                                                    {student.profile_type || 'PROFIL ETUDIANT'}
                                                </p>
                                            </div>
                                            {student.match_percentage !== undefined && student.match_percentage > 0 && (
                                                <div className={`px-2 py-1 rounded-xl border flex items-center gap-1 text-[8px] font-black uppercase tracking-widest ${student.match_percentage >= 80
                                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                                                    : student.match_percentage >= 50
                                                        ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                    }`}>
                                                    <Target01Icon size={10} />
                                                    {student.match_percentage}% MATCH
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-8 relative z-10">
                                        <div className="flex items-center gap-3 text-slate-500">
                                            <GlobalIcon size={16} />
                                            <span className="text-[11px] font-bold uppercase tracking-widest">{student.country || 'Non specifie'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-500">
                                            <Briefcase02Icon size={16} />
                                            <span className="text-[11px] font-bold uppercase tracking-widest">{student.work_mode || 'Flexible'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-500">
                                            <Mail01Icon size={16} />
                                            <span className="text-[11px] font-bold uppercase tracking-widest truncate">{student.email}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 relative z-10 w-full mt-4">
                                        <button
                                            onClick={(e) => { e.preventDefault(); handleContact(student.id); }}
                                            disabled={isActionLoading}
                                            className="px-4 py-3.5 bg-emerald-600 hover:bg-emerald-500 rounded-[20px] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                            title="Message"
                                        >
                                            <Message01Icon size={16} />
                                        </button>
                                        <Link
                                            to={buildStudentProfilePath(student)}
                                            className="flex-1 py-4 bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 hover:border-emerald-500/30 rounded-[20px] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all group/btn"
                                        >
                                            {routeLocale === 'fr' ? 'VOIR LE PROFIL' : 'VIEW PROFILE'}
                                            <ArrowRight01Icon size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {responseData && responseData.last_page > 1 && (
                            <div className="flex justify-center items-center gap-4 py-8">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ArrowLeft01Icon size={18} />
                                </button>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    {routeLocale === 'fr' ? 'Page' : 'Page'} <span className="text-emerald-500">{page}</span> {routeLocale === 'fr' ? 'sur' : 'of'} {responseData.last_page}
                                </span>
                                <button
                                    disabled={page === responseData.last_page}
                                    onClick={() => setPage(p => Math.min(responseData.last_page, p + 1))}
                                    className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ArrowRight01Icon size={18} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}





