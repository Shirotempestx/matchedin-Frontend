import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CheckmarkBadge01Icon, CrownIcon, StarIcon, ArrowRight01Icon, ZapIcon } from 'hugeicons-react';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { normalizeLocale } from '@/i18n/config';
import { useAlert } from '@/components/alerts/useAlert';

export default function PricingPage() {
    const { i18n } = useTranslation();
    const isFr = (i18n.resolvedLanguage || 'fr').startsWith('fr');
    const { user } = useAuth();
    const navigate = useNavigate();
    const { notify } = useAlert();
    
    // Determine default tab based on user role (default to enterprise if not authenticated or not student)
    const [activeTab, setActiveTab] = useState<'enterprise' | 'student'>(
        user?.role === 'student' ? 'student' : 'enterprise'
    );

    const withLocale = (path: string) => `/${normalizeLocale(i18n.language)}${path.startsWith('/') ? path : `/${path}`}`;
    const showStripePending = () => notify({
        severity: 'warning',
        title: isFr ? 'Paiement bientôt disponible' : 'Payment coming soon',
        message: isFr ? 'L\'intégration Stripe arrive bientôt. Contactez-nous pour activer ce plan.' : 'Stripe integration is coming soon. Contact us to activate this plan.',
    });

    const studentPlans = [
        {
            name: isFr ? 'Gratuit' : 'Free',
            price: '0$',
            description: isFr ? 'Pour découvrir la plateforme' : 'To discover the platform',
            features: [
                isFr ? 'Profil basique' : 'Basic profile',
                isFr ? 'Candidatures limitées' : 'Limited applications',
                isFr ? 'Recherche standard' : 'Standard search',
            ],
            icon: <StarIcon size={24} />,
            color: 'text-slate-400',
            bg: 'bg-slate-400/10',
            border: 'border-slate-400/20',
            buttonAction: () => navigate(withLocale('/register')),
            buttonText: isFr ? 'Commencer' : 'Get Started',
        },
        {
            name: 'Career Plus',
            price: '19$',
            period: '/mo',
            description: isFr ? 'Pour accélérer votre carrière' : 'To accelerate your career',
            features: [
                isFr ? 'Profil mis en avant' : 'Highlighted profile',
                isFr ? 'Candidatures illimitées' : 'Unlimited applications',
                isFr ? 'Voir qui consulte votre profil' : 'See who views your profile',
                isFr ? 'Badge exclusif' : 'Exclusive badge',
            ],
            icon: <ZapIcon size={24} />,
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10',
            border: 'border-emerald-500',
            popular: true,
            buttonAction: showStripePending,
            buttonText: isFr ? "S'abonner" : 'Subscribe',
        },
        {
            name: 'Professional Prime',
            price: '39$',
            period: '/mo',
            description: isFr ? 'Accès total à l\'élite' : 'Total access to the elite',
            features: [
                isFr ? 'Toutes les options Career Plus' : 'All Career Plus options',
                isFr ? 'Coaching CV par IA' : 'AI Resume Coaching',
                isFr ? 'Contact direct avec les recruteurs' : 'Direct contact with recruiters',
                isFr ? 'Invitations exclusives' : 'Exclusive invitations',
            ],
            icon: <CrownIcon size={24} />,
            color: 'text-amber-400',
            bg: 'bg-amber-400/10',
            border: 'border-amber-400/20',
            buttonAction: showStripePending,
            buttonText: isFr ? "S'abonner" : 'Subscribe',
        }
    ];

    const enterprisePlans = [
        {
            name: isFr ? 'Gratuit' : 'Free',
            price: '0$',
            description: isFr ? 'Idéal pour démarrer' : 'Ideal for starting',
            features: [
                isFr ? 'Publication d\'offres (max 5 places)' : 'Publish offers (max 5 places)',
                isFr ? 'Recherche de candidats basique' : 'Basic candidate search',
                isFr ? 'Profil d\'entreprise standard' : 'Standard company profile',
            ],
            icon: <StarIcon size={24} />,
            color: 'text-slate-400',
            bg: 'bg-slate-400/10',
            border: 'border-slate-400/20',
            buttonAction: () => navigate(withLocale('/register-enterprise')),
            buttonText: isFr ? 'Commencer' : 'Get Started',
        },
        {
            name: 'Business Plus',
            price: '99$',
            period: '/mo',
            description: isFr ? 'Pour les entreprises en croissance' : 'For growing companies',
            features: [
                isFr ? 'Offres sans limites de places' : 'Unlimited places per offer',
                isFr ? 'Assistant IA pour descriptions' : 'AI Assistant for job descriptions',
                isFr ? 'Filtres de recherche avancés' : 'Advanced search filters',
                isFr ? 'Marque employeur premium' : 'Premium employer branding',
            ],
            icon: <ZapIcon size={24} />,
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10',
            border: 'border-emerald-500',
            popular: true,
            buttonAction: showStripePending,
            buttonText: isFr ? "S'abonner" : 'Subscribe',
        },
        {
            name: 'Enterprise Infinite',
            price: '169$',
            period: '/mo',
            description: isFr ? 'La solution ultime de recrutement' : 'The ultimate recruitment solution',
            features: [
                isFr ? 'Toutes les options Business Plus' : 'All Business Plus options',
                isFr ? 'Import d\'offres via API/Site web' : 'Import offers via API/Website',
                isFr ? 'Extraction de données CV (IA)' : 'CV data extraction (AI)',
                isFr ? 'Gestionnaire de compte dédié' : 'Dedicated account manager',
            ],
            icon: <CrownIcon size={24} />,
            color: 'text-amber-400',
            bg: 'bg-amber-400/10',
            border: 'border-amber-400/20',
            buttonAction: showStripePending,
            buttonText: isFr ? "S'abonner" : 'Subscribe',
        }
    ];

    const currentPlans = activeTab === 'student' ? studentPlans : enterprisePlans;

    return (
        <div className="min-h-screen bg-[#09090b] text-white pt-32 pb-24 px-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] bg-emerald-800/10 rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10 flex flex-col items-center">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
                    <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter font-syne mb-4">
                        {isFr ? 'Passez au niveau ' : 'Unlock the '}
                        <span className="text-emerald-500">Supérieur</span>
                    </h1>
                    <p className="text-slate-400 text-sm md:text-base font-bold uppercase tracking-[0.2em] max-w-2xl mx-auto">
                        {isFr ? 'Choisissez le plan qui correspond à vos ambitions. Accédez à des outils exclusifs propulsés par l\'IA.' 
                              : 'Choose the plan that fits your ambitions. Access exclusive AI-powered tools.'}
                    </p>
                </motion.div>

                {/* Toggle Student / Enterprise */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex p-1 bg-white/[0.03] rounded-full border border-white/10 mb-16 relative">
                    <div className="absolute inset-0 select-none pointer-events-none rounded-full" />
                    <button
                        onClick={() => setActiveTab('student')}
                        className={`relative z-10 px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                            activeTab === 'student' ? 'text-white' : 'text-slate-500 hover:text-white'
                        }`}
                    >
                        {isFr ? 'Pour Étudiants' : 'For Students'}
                        {activeTab === 'student' && (
                            <motion.div layoutId="activeTab" className="absolute inset-0 bg-emerald-600 rounded-full -z-10 shadow-[0_0_20px_rgba(5,150,105,0.3)]" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('enterprise')}
                        className={`relative z-10 px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                            activeTab === 'enterprise' ? 'text-white' : 'text-slate-500 hover:text-white'
                        }`}
                    >
                        {isFr ? 'Pour Entreprises' : 'For Enterprises'}
                        {activeTab === 'enterprise' && (
                            <motion.div layoutId="activeTab" className="absolute inset-0 bg-emerald-600 rounded-full -z-10 shadow-[0_0_20px_rgba(5,150,105,0.3)]" />
                        )}
                    </button>
                </motion.div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8 w-full max-w-5xl mx-auto">
                    <AnimatePresence mode="wait">
                        {currentPlans.map((plan, i) => (
                            <motion.div
                                key={plan.name + activeTab}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.4, delay: i * 0.1 }}
                                className={`relative p-8 rounded-[32px] border ${plan.border} bg-white/[0.02] backdrop-blur-xl flex flex-col items-center text-center overflow-hidden group`}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 inset-x-0 mx-auto w-fit px-4 py-1.5 bg-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-b-xl shadow-lg shadow-emerald-500/30">
                                        {isFr ? 'Recommandé' : 'Popular'}
                                    </div>
                                )}
                                
                                <div className={`w-16 h-16 rounded-full ${plan.bg} ${plan.color} flex items-center justify-center mb-6 mt-4 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500`}>
                                    {plan.icon}
                                </div>

                                <h3 className="text-xl font-black uppercase tracking-widest mb-2">{plan.name}</h3>
                                <div className="flex items-end gap-1 mb-4">
                                    <span className="text-5xl font-syne font-black italic">{plan.price}</span>
                                    {plan.period && <span className="text-slate-500 tracking-wider font-bold mb-2">{plan.period}</span>}
                                </div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-8 h-8">{plan.description}</p>

                                <div className="w-full space-y-4 mb-10 flex-1 flex flex-col text-left">
                                    {plan.features.map((feature, j) => (
                                        <div key={j} className="flex items-center gap-3">
                                            <div className={`p-1 rounded-full ${plan.bg} ${plan.color}`}>
                                                <CheckmarkBadge01Icon size={14} />
                                            </div>
                                            <span className="text-sm font-bold text-slate-300">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={plan.buttonAction}
                                    className={`w-full py-4 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                                        plan.popular 
                                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20' 
                                        : 'bg-white/5 hover:bg-white/10 border border-white/10'
                                    }`}
                                >
                                    {plan.buttonText}
                                    <ArrowRight01Icon size={16} />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
