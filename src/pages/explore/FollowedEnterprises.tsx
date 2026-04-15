import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building04Icon, Location01Icon, ArrowRight01Icon } from 'hugeicons-react';
import { useTranslation } from 'react-i18next';
import { normalizeLocale } from '@/i18n/config';

interface Enterprise {
    id: number;
    name?: string; // AppModels/User has name
    company_name: string;
    industry: string;
    country?: string; // the backend returns country
    location?: string;
    description: string;
    logo_url: string;
    banner_url?: string;
    slug: string;
}

export default function FollowedEnterprises() {
    const navigate = useNavigate();
    const location = useLocation();
    const { i18n } = useTranslation();
    const routeLocale = normalizeLocale(location.pathname.split('/').filter(Boolean)[0] || localStorage.getItem('preferred_language') || i18n.language || 'fr');

    const getEnterpriseSlug = (enterprise: Enterprise) => {
        if (enterprise.slug) return enterprise.slug;
        const companyName = enterprise.company_name || enterprise.name || 'entreprise';
        return companyName.toLowerCase().replace(/\s+/g, '-').replace(/-+/g, '-');
    };

    const { data: enterprises = [], isLoading } = useQuery<Enterprise[]>({
        queryKey: ['followedEnterprises'],
        queryFn: async () => {
            const res = await api.get('/enterprises/followed');
            return res.data.enterprises || [];
        }
    });

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div></div>;
    }

    return (
        <div className="min-h-screen bg-[#07080a] py-24 px-4 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]">
            <div className="max-w-[1400px] mx-auto">
                <div className="mb-8 border-b border-white/10 pb-5">
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                        Mes Entreprises Suivies
                    </h1>
                    <p className="mt-2 text-[13px] font-bold text-slate-400 uppercase tracking-wide">
                        Retrouvez ici toutes les entreprises que vous avez sauvegardÃ©es.
                    </p>
                </div>
                
                {enterprises.length === 0 ? (
                    <div className="text-center py-32 bg-[#0f1014]/50 rounded-3xl border border-white/5 backdrop-blur-xl">
                        <Building04Icon className="mx-auto h-16 w-16 text-slate-600 mb-6" strokeWidth={1} />
                        <h3 className="text-lg font-black uppercase tracking-tight text-white mb-2">Aucune entreprise suivie</h3>
                        <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto">Vous ne suivez encore aucune entreprise. Explorez les offres et abonnez-vous aux entreprises qui vous intÃ©ressent.</p>
                        <button 
                            onClick={() => navigate(`/${routeLocale}/explore-offres`)}
                            className="mt-6 px-6 py-3 bg-white text-black text-[12px] font-black uppercase tracking-wider rounded-xl hover:scale-105 transition-all"
                        >
                            Explorer
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {enterprises.map((enterprise) => (
                            <motion.div 
                                key={enterprise.id}
                                whileHover={{ y: -4 }}
                                className="p-8 bg-white/[0.02] border border-white/5 rounded-[40px] group hover:border-[#1464da]/20 transition-all relative overflow-hidden flex flex-col h-full hover:shadow-[0_0_30px_rgba(20,100,218,0.05)] cursor-pointer"
                                onClick={() => {
                                    const slug = getEnterpriseSlug(enterprise);
                                    navigate(`/${routeLocale}/enterprises/${encodeURIComponent(slug)}`);
                                }}
                            >
                                {/* Glow effect */}
                                <div className="absolute top-0 right-0 w-40 h-40 bg-[#1464da]/5 rounded-full blur-[60px] -mr-20 -mt-20 group-hover:bg-[#1464da]/10 transition-colors pointer-events-none" />

                                <div className="flex items-center gap-5 mb-8 relative z-10">
                                        <div className="w-16 h-16 rounded-[24px] bg-white/[0.05] border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-[inset_0_2px_10px_rgba(255,255,255,0.05)] font-black text-white text-xl relative">
                                            {enterprise.logo_url ? (
                                                <img src={enterprise.logo_url} alt={enterprise.company_name || enterprise.name || ''} className="h-full w-full object-cover relative z-10" />
                                            ) : (
                                                (enterprise.company_name || enterprise.name || '?').charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="flex-1 mt-1">
                                            <h3 className="text-xl font-black tracking-tight text-white group-hover:text-[#1464da] transition-colors uppercase leading-tight line-clamp-2">{enterprise.company_name || enterprise.name || 'Entreprise sans nom'}</h3>
                                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2">
                                                <Location01Icon size={14} className="text-[#1464da]" />
                                                <span className="truncate">{enterprise.location || enterprise.country || 'Localisation non définie'}</span>
                                            </div>
                                        </div>
                                    </div>
                                <p className="text-[13px] text-slate-400 font-medium line-clamp-3 leading-relaxed mt-4 relative z-10 flex-1">
                                    {enterprise.description || 'Aucune description disponible pour cette entreprise.'}
                                </p>
                                <div className="flex items-center gap-3 relative z-10 w-full mt-8">
                                    <span className="px-4 py-3.5 bg-[#1464da]/10 border border-[#1464da]/20 rounded-[20px] text-[10px] font-black uppercase tracking-widest text-[#1464da] shadow-sm flex items-center justify-center">
                                        {enterprise.industry || 'Secteur non défini'}
                                    </span>
                                    <button
                                        className="flex-1 py-3.5 bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 hover:border-[#1464da]/30 rounded-[20px] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all group/btn text-white"
                                    >
                                        "VOIR L'ENTREPRISE"
                                        <ArrowRight01Icon size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

