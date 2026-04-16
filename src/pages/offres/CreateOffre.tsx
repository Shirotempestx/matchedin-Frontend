import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/axios';
import { useAuth } from '@/lib/auth';
import { useAlert } from '@/components/alerts/useAlert';
import { hasBadWord } from '@/lib/profanity';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { normalizeLocale } from '@/i18n/config';
import {
    Briefcase02Icon, TextAlignLeftIcon, Location01Icon,
    ArrowRight01Icon, ArrowLeft01Icon, MoneyBag02Icon,
    CrownIcon, Download04Icon, Pen01Icon
} from 'hugeicons-react';
import SkillSelector from '@/components/shared/SkillSelector';

const offreSchema = z.object({
    title: z.string().min(3, "validation_title_min").refine((value) => !hasBadWord(value), "validation_bad_word"),
    description: z.string().min(20, "validation_description_min").refine((value) => !hasBadWord(value), "validation_bad_word"),
    location: z.string().optional().refine((value) => !value || !hasBadWord(value), "validation_bad_word"),
    work_mode: z.enum(['Remote', 'Hybrid', 'On-site']),
    salary_min: z.string().optional(),
    salary_max: z.string().optional(),
    contract_type: z.enum(['CDI', 'CDD', 'Stage', 'Freelance']),
    skills_required: z.array(z.object({
        id: z.number(),
        level: z.number()
    })).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    internship_period: z.string().optional(),
    niveau_etude: z.string().optional().refine((value) => !value || !hasBadWord(value), "validation_bad_word"),
    places_demanded: z.string().min(1, "validation_places_demanded"),
});

type SkillPrefill = {
    id: number;
    level: number;
    name: string;
    category: string;
};

type GeneratedOffer = {
    title: string | null;
    description: string | null;
    skills: string[] | null;
    location: string | null;
    work_mode: 'Remote' | 'Hybrid' | 'On-site' | null;
    contract_type: 'CDI' | 'CDD' | 'Stage' | 'Freelance' | null;
    salary_min: number | null;
    salary_max: number | null;
    internship_period: number | null;
    niveau_etude: 'Bac' | 'Bac+2' | 'Bac+3' | 'Bac+5' | 'Bac+8' | null;
    places_demanded: number | null;
    start_date: string | null;
    end_date: string | null;
};

export default function CreateOffre() {
    const navigate = useNavigate();
    const location = useLocation();
    const { i18n } = useTranslation();
    const isFr = (i18n.resolvedLanguage || 'fr').startsWith('fr');
    const routeLocale = normalizeLocale(location.pathname.split('/').filter(Boolean)[0] || localStorage.getItem('preferred_language') || 'fr');
    const withLocale = (path: string) => `/${routeLocale}${path.startsWith('/') ? path : `/${path}`}`;
    const { user, isAuthenticated, isLoading } = useAuth();
    const { error: showError, notify, premiumGate } = useAlert();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showAiModal, setShowAiModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [translateLoading, setTranslateLoading] = useState(false);
    const [importMode, setImportMode] = useState<'document' | 'website'>('document');
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importUrl, setImportUrl] = useState('');
    const [prefilledSkills, setPrefilledSkills] = useState<SkillPrefill[]>([]);
    const [reviewData, setReviewData] = useState<GeneratedOffer | null>(null);
    const [targetLanguage, setTargetLanguage] = useState<'fr' | 'en'>(isFr ? 'fr' : 'en');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        work_mode: 'Remote',
        salary_min: '',
        salary_max: '',
        contract_type: 'CDI',
        skills_required: [] as { id: number, level: number }[],
        start_date: '',
        end_date: '',
        internship_period: '',
        niveau_etude: '',
        places_demanded: '1',
    });
    // Redirect non-enterprise users via useEffect
    useEffect(() => {
        const normalizedRole = (user?.role || '').toLowerCase();
        const isEnterpriseRole = normalizedRole === 'enterprise' || normalizedRole === 'entreprise';

        if (!isLoading && (!isAuthenticated || !isEnterpriseRole)) {
            navigate(withLocale('/dashboard'));
        }
    }, [isLoading, isAuthenticated, user, navigate, routeLocale]);

    useEffect(() => {
        setTargetLanguage(isFr ? 'fr' : 'en');
    }, [isFr]);

    // Show loading spinner while auth resolves
    if (isLoading) {
        return (
            <div className="app-page flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            offreSchema.parse(formData);
        } catch (e: any) {
            if (e instanceof z.ZodError) {
                const code = e.issues[0].message;
                if (code === 'validation_title_min') setError(isFr ? 'Le titre doit contenir au moins 3 caracteres.' : 'Title must be at least 3 characters.');
                else if (code === 'validation_description_min') setError(isFr ? 'La description doit contenir au moins 20 caracteres.' : 'Description must be at least 20 characters.');
                else if (code === 'validation_bad_word') setError(isFr ? 'Veuillez retirer les mots injurieux de votre texte.' : 'Please remove offensive words from your text.');
                else setError(code);
            }
            return;
        }

        setLoading(true);
        setError('');
        try {
            const payload = {
                ...formData,
                salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
                salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
            };
            await api.post('/offres', payload);
            navigate(withLocale('/dashboard'));
        } catch (err: any) {
            setError(err.response?.data?.message || (isFr ? "Erreur lors de la creation de l'offre." : 'Failed to create offer.'));
        } finally {
            setLoading(false);
        }
    };

    const set = (name: string, value: string) => setFormData(prev => ({ ...prev, [name]: value }));

    const openPremiumGate = () => {
        premiumGate({
            title: isFr ? 'Fonctionnalite Premium' : 'Premium Feature',
            message: isFr
                ? 'Passez au niveau superieur pour debloquer l\'Assistant IA, l\'importation de donnees et un nombre de places illimite pour vos offres.'
                : 'Upgrade to unlock the AI Assistant, data importing, and unlimited places for your offers.',
            laterText: isFr ? 'Plus tard' : 'Later',
            discoverText: isFr ? 'Decouvrir' : 'Discover',
            onDiscover: () => navigate(withLocale('/pricing')),
        });
    };

    const mapSkillNamesToIds = async (skills: string[]) => {
        const unique = Array.from(new Set(skills.map((skill) => skill.trim()).filter(Boolean))).slice(0, 8);
        if (unique.length === 0) {
            return {
                payloadSkills: [] as { id: number; level: number }[],
                selectorSkills: [] as SkillPrefill[],
            };
        }

        const resolved = await Promise.all(unique.map(async (name) => {
            try {
                const res = await api.get('/skills/search', { params: { q: name } });
                const first = Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : null;
                if (!first?.id) return null;
                return {
                    id: Number(first.id),
                    level: 3,
                    name: String(first.name || name),
                    category: String(first.category || 'GENERAL'),
                };
            } catch {
                return null;
            }
        }));

        const selectorSkills = resolved.filter((skill): skill is SkillPrefill => Boolean(skill));
        const payloadSkills = selectorSkills.map((skill) => ({ id: skill.id, level: skill.level }));

        return {
            payloadSkills,
            selectorSkills,
        };
    };

    const normalizeGeneratedOffer = (raw: any): GeneratedOffer => {
        const parseNumber = (value: unknown): number | null => {
            if (typeof value === 'number' && Number.isFinite(value)) return value;
            if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value);
            return null;
        };

        const parseString = (value: unknown): string | null => {
            if (typeof value !== 'string') return null;
            const trimmed = value.trim();
            return trimmed === '' ? null : trimmed;
        };

        const parseEnum = <T extends string>(value: unknown, allowed: T[]): T | null => {
            if (typeof value !== 'string') return null;
            const found = allowed.find((item) => item.toLowerCase() === value.trim().toLowerCase());
            return found || null;
        };

        const parseDate = (value: unknown): string | null => {
            if (typeof value !== 'string') return null;
            const trimmed = value.trim();
            return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
        };

        const parsedSkills = Array.isArray(raw?.skills)
            ? raw.skills.map((item: unknown) => String(item || '').trim()).filter(Boolean)
            : null;

        return {
            title: parseString(raw?.title),
            description: parseString(raw?.description),
            skills: parsedSkills,
            location: parseString(raw?.location),
            work_mode: parseEnum(raw?.work_mode, ['Remote', 'Hybrid', 'On-site']),
            contract_type: parseEnum(raw?.contract_type, ['CDI', 'CDD', 'Stage', 'Freelance']),
            salary_min: parseNumber(raw?.salary_min),
            salary_max: parseNumber(raw?.salary_max),
            internship_period: parseNumber(raw?.internship_period),
            niveau_etude: parseEnum(raw?.niveau_etude, ['Bac', 'Bac+2', 'Bac+3', 'Bac+5', 'Bac+8']),
            places_demanded: parseNumber(raw?.places_demanded),
            start_date: parseDate(raw?.start_date),
            end_date: parseDate(raw?.end_date),
        };
    };

    const resolveOfferPayload = (data: any): GeneratedOffer => {
        if (data?.parsed_offer && typeof data.parsed_offer === 'object') {
            return normalizeGeneratedOffer(data.parsed_offer);
        }

        return normalizeGeneratedOffer({
            title: data?.title,
            description: data?.description,
            skills: data?.skills,
        });
    };

    const applyGeneratedValues = async (generated: GeneratedOffer) => {
        const mappedSkills = generated.skills ? await mapSkillNamesToIds(generated.skills) : null;

        if (mappedSkills) {
            setPrefilledSkills(mappedSkills.selectorSkills);
        }

        setFormData((prev) => ({
            ...prev,
            title: generated.title ?? prev.title,
            description: generated.description ?? prev.description,
            location: generated.location ?? prev.location,
            work_mode: generated.work_mode ?? prev.work_mode,
            contract_type: generated.contract_type ?? prev.contract_type,
            salary_min: generated.salary_min !== null ? String(generated.salary_min) : prev.salary_min,
            salary_max: generated.salary_max !== null ? String(generated.salary_max) : prev.salary_max,
            internship_period: generated.internship_period !== null ? String(generated.internship_period) : prev.internship_period,
            niveau_etude: generated.niveau_etude ?? prev.niveau_etude,
            places_demanded: generated.places_demanded !== null ? String(generated.places_demanded) : prev.places_demanded,
            start_date: generated.start_date ?? prev.start_date,
            end_date: generated.end_date ?? prev.end_date,
            skills_required: mappedSkills ? mappedSkills.payloadSkills : prev.skills_required,
        }));
    };

    const openImportReview = (payload: any) => {
        const next = resolveOfferPayload(payload);
        setReviewData(next);
        setShowReviewModal(true);
    };

    const handleApplyReviewedData = async () => {
        if (!reviewData) return;
        await applyGeneratedValues(reviewData);
        setShowReviewModal(false);
        notify({
            severity: 'success',
            title: isFr ? 'Donnees appliquees' : 'Data applied',
            message: isFr ? 'Les informations analysees ont ete ajoutees au formulaire.' : 'Analyzed information was applied to the form.',
        });
    };

    const handleTranslateReviewText = async () => {
        if (!reviewData) return;

        const translateOne = async (text: string | null) => {
            if (!text) return text;
            const res = await api.post('/premium/translate', {
                text,
                target_language: targetLanguage,
            });
            return typeof res.data?.text === 'string' ? res.data.text.trim() : text;
        };

        setTranslateLoading(true);
        try {
            const [title, description, location] = await Promise.all([
                translateOne(reviewData.title),
                translateOne(reviewData.description),
                translateOne(reviewData.location),
            ]);

            setReviewData((prev) => prev ? ({ ...prev, title, description, location }) : prev);
            notify({
                severity: 'success',
                title: isFr ? 'Traduction terminee' : 'Translation completed',
                message: isFr ? 'Les champs texte ont ete traduits.' : 'Text fields were translated.',
            });
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.response?.data?.error || (isFr ? 'Traduction impossible.' : 'Translation failed.');
            showError(message);
        } finally {
            setTranslateLoading(false);
        }
    };

    const handleAiGenerate = async () => {
        if (!aiPrompt.trim()) {
            showError(isFr ? 'Ajoutez des instructions pour l\'IA.' : 'Please add instructions for AI.');
            return;
        }

        setAiLoading(true);
        try {
            const res = await api.post('/premium/ai-write', {
                prompt: aiPrompt,
                title: formData.title,
                description: formData.description,
                location: formData.location,
                contract_type: formData.contract_type,
                work_mode: formData.work_mode,
                skills_required: formData.skills_required,
                salary_min: formData.salary_min ? Number(formData.salary_min) : null,
                salary_max: formData.salary_max ? Number(formData.salary_max) : null,
                internship_period: formData.internship_period ? Number(formData.internship_period) : null,
                niveau_etude: formData.niveau_etude || null,
                places_demanded: formData.places_demanded ? Number(formData.places_demanded) : null,
                start_date: formData.start_date || null,
                end_date: formData.end_date || null,
            });

            await applyGeneratedValues(resolveOfferPayload(res.data));

            notify({
                severity: 'success',
                title: isFr ? 'Contenu genere' : 'Content generated',
                message: isFr ? 'Les suggestions IA ont ete appliquees.' : 'AI suggestions have been applied.',
            });
            setShowAiModal(false);
            setAiPrompt('');
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.response?.data?.error || (isFr ? 'Generation IA impossible.' : 'AI generation failed.');
            showError(message);
        } finally {
            setAiLoading(false);
        }
    };

    const extractFromDocument = async () => {
        if (!importFile) {
            showError(isFr ? 'Ajoutez un document a importer.' : 'Please select a file to import.');
            return;
        }

        setImportLoading(true);
        try {
            const payload = new FormData();
            payload.append('files', importFile);
            const res = await api.post('/premium/extract', payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setShowImportModal(false);
            setImportFile(null);
            openImportReview(res.data);
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.response?.data?.error || (isFr ? 'Import impossible.' : 'Import failed.');
            showError(message);
        } finally {
            setImportLoading(false);
        }
    };

    const extractFromWebsite = async () => {
        if (!importUrl.trim()) {
            showError(isFr ? 'Ajoutez une URL valide.' : 'Please provide a valid URL.');
            return;
        }

        setImportLoading(true);
        try {
            const res = await api.post('/premium/extract-url', { url: importUrl.trim() });
            setShowImportModal(false);
            setImportUrl('');
            openImportReview(res.data);
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.response?.data?.error || (isFr ? 'Extraction web impossible.' : 'Website extraction failed.');
            showError(message);
        } finally {
            setImportLoading(false);
        }
    };

    return (
        <div className="app-page pt-24 pb-12 px-6 overflow-hidden">
            <div className="max-w-3xl mx-auto relative z-10">
                <button onClick={() => navigate(withLocale('/dashboard'))} className="mb-8 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
                    <ArrowLeft01Icon size={16} /> {isFr ? 'Retour au dashboard' : 'Back to dashboard'}
                </button>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <header className="mb-10 space-y-2">
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter font-syne">
                            {isFr ? 'Nouvelle' : 'New'} <span className="text-emerald-500">{isFr ? 'Offre' : 'Offer'}</span>
                        </h1>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
                            {isFr ? "Publiez une opportunite et attirez l'elite mondiale." : 'Publish an opportunity and attract top talent.'}
                        </p>
                    </header>

                    <form onSubmit={handleSubmit} className="app-card border app-border rounded-[40px] p-8 md:p-12 space-y-8 relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 rounded-full blur-[100px] pointer-events-none" />

                        {error && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-3 rounded-[16px] text-xs font-bold uppercase tracking-wider relative z-10">
                                {error}
                            </motion.div>
                        )}

                        {/* Premium Tools Row */}
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <button
                                type="button"
                                onClick={() => !user?.subscription_tier ? openPremiumGate() : setShowAiModal(true)}
                                className="w-full flex items-center justify-center gap-2 py-4 app-soft hover:bg-emerald-500/10 border app-border hover:border-emerald-500/30 rounded-[20px] text-xs font-black uppercase tracking-widest text-emerald-400 transition-all group">
                                {!user?.subscription_tier ? <CrownIcon size={18} className="text-amber-400 group-hover:scale-110 transition-transform" /> : <Pen01Icon size={18} />}
                                <span className="truncate">{isFr ? 'Rédiger avec l\'IA' : 'Write with AI'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => !user?.subscription_tier ? openPremiumGate() : setShowImportModal(true)}
                                className="w-full flex items-center justify-center gap-2 py-4 app-soft hover:bg-blue-500/10 border app-border hover:border-blue-500/30 rounded-[20px] text-xs font-black uppercase tracking-widest text-blue-400 transition-all group">
                                {!user?.subscription_tier ? <CrownIcon size={18} className="text-amber-400 group-hover:scale-110 transition-transform" /> : <Download04Icon size={18} />}
                                <span className="truncate">{isFr ? 'Importer externe' : 'Import external'}</span>
                            </button>
                        </div>

                        {/* Title */}
                        <InputGroup icon={<Briefcase02Icon size={20} />} placeholder={isFr ? 'TITRE DU POSTE (Ex: Developpeur Full-Stack Senior)' : 'ROLE TITLE (e.g. Senior Full-Stack Developer)'}
                            value={formData.title} onChange={v => set('title', v)} />

                        {/* Description */}
                        <div className="relative group">
                            <div className="absolute left-6 top-6 text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                                <TextAlignLeftIcon size={20} />
                            </div>
                            <textarea
                                placeholder={isFr ? 'DESCRIPTION DU POSTE...' : 'ROLE DESCRIPTION...'}
                                value={formData.description}
                                onChange={e => set('description', e.target.value)}
                                rows={5}
                                className="w-full pl-16 pr-6 py-5 app-input border app-border rounded-[24px] text-[11px] font-black tracking-widest focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.07] transition-all placeholder:text-slate-600 uppercase resize-none"
                            />
                        </div>

                        {/* Location */}
                        <InputGroup icon={<Location01Icon size={20} />} placeholder={isFr ? 'LOCALISATION (Ex: Paris, France)' : 'LOCATION (e.g. Paris, France)'}
                            value={formData.location} onChange={v => set('location', v)} />

                        {/* Work Mode */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2">{isFr ? 'Format de travail' : 'Work mode'}</label>
                            <div className="grid grid-cols-3 gap-2 app-soft p-2 rounded-[24px] border app-border">
                                {['Remote', 'Hybrid', 'On-site'].map(mode => (
                                    <button type="button" key={mode} onClick={() => set('work_mode', mode)}
                                        className={`py-4 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${formData.work_mode === mode ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-500 hover:text-white'}`}>
                                        {mode === 'On-site' ? (isFr ? 'Presentiel' : 'On-site') : mode === 'Hybrid' ? (isFr ? 'Hybride' : 'Hybrid') : 'Remote'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Contract Type */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2">{isFr ? 'Type de contrat' : 'Contract type'}</label>
                            <div className="grid grid-cols-4 gap-2 app-soft p-2 rounded-[24px] border app-border">
                                {['CDI', 'CDD', 'Stage', 'Freelance'].map(type => (
                                    <button type="button" key={type} onClick={() => set('contract_type', type)}
                                        className={`py-4 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${formData.contract_type === type ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-500 hover:text-white'}`}>
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Conditional Internship Period */}
                        {formData.contract_type === 'Stage' && (
                            <div className="relative group">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2">{isFr ? 'Période de stage (en mois)' : 'Internship period (months)'}</label>
                                <input type="number" min="1" placeholder={isFr ? 'Ex: 6' : 'Ex: 6'} value={formData.internship_period}
                                    onChange={e => set('internship_period', e.target.value)}
                                    className="w-full px-6 py-5 mt-2 app-input border app-border rounded-[24px] text-[11px] font-black tracking-widest focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.07] transition-all placeholder:text-slate-600 uppercase"
                                />
                            </div>
                        )}

                        {/* Niveau d'etude & Places */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2">{isFr ? "Niveau d'étude" : 'Education Level'}</label>
                                <select 
                                    value={formData.niveau_etude} 
                                    onChange={e => set('niveau_etude', e.target.value)}
                                    className="w-full px-6 py-5 app-input border app-border rounded-[24px] text-[11px] font-black tracking-widest focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.07] transition-all uppercase"
                                >
                                    <option value="" className="bg-[#09090b]">{isFr ? 'Non spécifié' : 'Not specified'}</option>
                                    {['Bac', 'Bac+2', 'Bac+3', 'Bac+5', 'Bac+8'].map(lvl => (
                                        <option key={lvl} value={lvl} className="bg-[#09090b]">{lvl}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2 flex items-center justify-between">
                                    <span>{isFr ? 'Places demandées' : 'Places demanded'}</span>
                                    {!user?.subscription_tier && <span className="text-amber-500 text-[8px] bg-amber-500/10 px-2 py-0.5 rounded-full">{isFr ? 'Max 5 (Gratuit)' : 'Max 5 (Free)'}</span>}
                                </label>
                                <input type="number" min="1" max={!user?.subscription_tier ? 5 : 999} value={formData.places_demanded} onChange={e => set('places_demanded', e.target.value)}
                                    className="w-full px-6 py-5 app-input border app-border rounded-[24px] text-[11px] font-black tracking-widest focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.07] transition-all placeholder:text-slate-600 uppercase"
                                />
                            </div>
                        </div>

                        {/* Validity Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2">{isFr ? 'Date de début (optionnel)' : 'Start date (optional)'}</label>
                                <input type="date" value={formData.start_date} onChange={e => set('start_date', e.target.value)}
                                    className="w-full px-6 py-5 app-input border app-border rounded-[24px] text-[11px] font-black tracking-widest focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.07] transition-all placeholder:text-slate-600 uppercase"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2">{isFr ? 'Date de fin (optionnel)' : 'End date (optional)'}</label>
                                <input type="date" value={formData.end_date} onChange={e => set('end_date', e.target.value)}
                                    className="w-full px-6 py-5 app-input border app-border rounded-[24px] text-[11px] font-black tracking-widest focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.07] transition-all placeholder:text-slate-600 uppercase"
                                />
                            </div>
                        </div>

                        {/* Salary Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup icon={<MoneyBag02Icon size={20} />} placeholder={isFr ? 'SALAIRE MIN (USD)' : 'MIN SALARY (USD)'} type="number"
                                value={formData.salary_min} onChange={v => set('salary_min', v)} />
                            <InputGroup icon={<MoneyBag02Icon size={20} />} placeholder={isFr ? 'SALAIRE MAX (USD)' : 'MAX SALARY (USD)'} type="number"
                                value={formData.salary_max} onChange={v => set('salary_max', v)} />
                        </div>

                        {/* Skills Selection */}
                        <SkillSelector
                            accentColor="emerald"
                            defaultProfileType="ALL"
                            showDomainCards={false}
                            allowDomainChange={false}
                            initialSkills={prefilledSkills}
                            onUpdate={(skills) => {
                                setFormData(prev => ({ ...prev, skills_required: skills }));
                                const refreshedPrefill = skills.map((skill) => {
                                    const found = prefilledSkills.find((existing) => existing.id === skill.id);
                                    return {
                                        id: skill.id,
                                        level: skill.level,
                                        name: found?.name || `Skill ${skill.id}`,
                                        category: found?.category || 'GENERAL',
                                    };
                                });
                                setPrefilledSkills(refreshedPrefill);
                            }}
                            title={isFr ? 'Expertises requises' : 'Required expertise'}
                            description={isFr ? 'Selectionnez les competences tech ou business attendues.' : 'Select the technical or business skills expected.'}
                        />

                        {/* Submit */}
                        <button type="submit" disabled={loading}
                            className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 rounded-[22px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20 mt-4 relative z-10">
                            {loading ? (isFr ? 'Publication...' : 'Publishing...') : (isFr ? "Publier l'offre" : 'Publish offer')} <ArrowRight01Icon size={18} />
                        </button>
                    </form>
                </motion.div>
            </div>

            <div className="fixed top-[20%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

            {/* AI Modal */}
            <AnimatePresence>
                {showAiModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => !aiLoading && setShowAiModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="app-panel border app-border rounded-[32px] p-8 md:p-10 max-w-2xl w-full text-left relative overflow-hidden"
                        >
                            <h2 className="text-2xl font-black uppercase tracking-widest mb-4">
                                {isFr ? 'Assistant IA' : 'AI Assistant'}
                            </h2>
                            <p className="text-slate-400 text-sm font-bold tracking-wider leading-relaxed mb-6">
                                {isFr
                                    ? 'Donnez vos instructions et nous generons une proposition de titre, description et competences.'
                                    : 'Provide your instructions and we will generate title, description, and skill suggestions.'}
                            </p>

                            <textarea
                                value={aiPrompt}
                                onChange={(event) => setAiPrompt(event.target.value)}
                                rows={6}
                                placeholder={isFr
                                    ? 'Ex: Offre stage 6 mois pour developpeur full-stack React/Laravel a Casablanca...'
                                    : 'Ex: 6-month internship for React/Laravel full-stack developer in Casablanca...'}
                                className="w-full px-6 py-4 app-input border app-border rounded-[24px] text-[12px] font-bold tracking-wide focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.07] transition-all placeholder:text-slate-600"
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    disabled={aiLoading}
                                    onClick={() => setShowAiModal(false)}
                                    className="py-4 bg-white/5 hover:bg-white/10 rounded-full text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                                >
                                    {isFr ? 'Annuler' : 'Cancel'}
                                </button>
                                <button
                                    type="button"
                                    disabled={aiLoading}
                                    onClick={handleAiGenerate}
                                    className="py-4 bg-emerald-500 hover:bg-emerald-400 text-black rounded-full text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                                >
                                    {aiLoading ? (isFr ? 'Generation...' : 'Generating...') : (isFr ? 'Generer' : 'Generate')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Import Modal */}
            <AnimatePresence>
                {showImportModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => !importLoading && setShowImportModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="app-panel border app-border rounded-[32px] p-8 md:p-10 max-w-2xl w-full text-left relative overflow-hidden"
                        >
                            <h2 className="text-2xl font-black uppercase tracking-widest mb-4">
                                {isFr ? 'Importation externe' : 'External import'}
                            </h2>

                            <div className="grid grid-cols-2 gap-2 app-soft p-2 rounded-[18px] border app-border mb-6">
                                <button
                                    type="button"
                                    onClick={() => setImportMode('document')}
                                    className={`py-3 rounded-[12px] text-[10px] font-black uppercase tracking-widest transition-all ${importMode === 'document' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
                                >
                                    {isFr ? 'Document' : 'Document'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setImportMode('website')}
                                    className={`py-3 rounded-[12px] text-[10px] font-black uppercase tracking-widest transition-all ${importMode === 'website' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
                                >
                                    {isFr ? 'Site web' : 'Website'}
                                </button>
                            </div>

                            {importMode === 'document' ? (
                                <div className="space-y-4">
                                    <p className="text-slate-400 text-sm font-bold tracking-wide">
                                        {isFr
                                            ? 'Formats acceptes: PDF, Word, Excel, CSV, PowerPoint, HTML, images.'
                                            : 'Accepted formats: PDF, Word, Excel, CSV, PowerPoint, HTML, images.'}
                                    </p>
                                    <input
                                        type="file"
                                        onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
                                        className="w-full app-input border app-border rounded-[16px] p-4 text-sm"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-slate-400 text-sm font-bold tracking-wide">
                                        {isFr
                                            ? 'Collez l\'URL d\'une page offre ou d\'une annonce a extraire.'
                                            : 'Paste a job page URL to extract content from.'}
                                    </p>
                                    <input
                                        type="url"
                                        value={importUrl}
                                        onChange={(event) => setImportUrl(event.target.value)}
                                        placeholder="https://example.com/job-offer"
                                        className="w-full px-6 py-4 app-input border app-border rounded-[16px] text-sm font-bold tracking-wide"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <button
                                    type="button"
                                    disabled={importLoading}
                                    onClick={() => setShowImportModal(false)}
                                    className="py-4 bg-white/5 hover:bg-white/10 rounded-full text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                                >
                                    {isFr ? 'Annuler' : 'Cancel'}
                                </button>
                                <button
                                    type="button"
                                    disabled={importLoading}
                                    onClick={importMode === 'document' ? extractFromDocument : extractFromWebsite}
                                    className="py-4 bg-blue-500 hover:bg-blue-400 text-black rounded-full text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                >
                                    {importLoading ? (isFr ? 'Import...' : 'Importing...') : (isFr ? 'Importer' : 'Import')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Review Modal */}
            <AnimatePresence>
                {showReviewModal && reviewData && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => !translateLoading && setShowReviewModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="app-panel border app-border rounded-[32px] p-6 md:p-8 max-w-4xl w-full text-left relative overflow-hidden max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-widest">{isFr ? 'Verifier les donnees importees' : 'Review imported data'}</h2>
                                    <p className="text-slate-400 text-sm font-bold tracking-wide mt-1">
                                        {isFr ? 'Modifiez les suggestions avant de les appliquer au formulaire.' : 'Edit suggestions before applying to the form.'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={targetLanguage}
                                        onChange={(event) => setTargetLanguage(event.target.value as 'fr' | 'en')}
                                        className="px-4 py-2 app-input border app-border rounded-[12px] text-xs font-black uppercase tracking-wider"
                                    >
                                        <option value="fr">FR</option>
                                        <option value="en">EN</option>
                                    </select>
                                    <button
                                        type="button"
                                        disabled={translateLoading}
                                        onClick={handleTranslateReviewText}
                                        className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-[12px] text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                                    >
                                        {translateLoading ? (isFr ? 'Traduction...' : 'Translating...') : (isFr ? 'Traduire le texte' : 'Translate text')}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    value={reviewData.title || ''}
                                    onChange={(event) => setReviewData((prev) => prev ? ({ ...prev, title: event.target.value || null }) : prev)}
                                    placeholder={isFr ? 'Titre' : 'Title'}
                                    className="w-full px-4 py-3 app-input border app-border rounded-[14px] text-xs font-bold tracking-wide"
                                />
                                <input
                                    type="text"
                                    value={reviewData.location || ''}
                                    onChange={(event) => setReviewData((prev) => prev ? ({ ...prev, location: event.target.value || null }) : prev)}
                                    placeholder={isFr ? 'Localisation' : 'Location'}
                                    className="w-full px-4 py-3 app-input border app-border rounded-[14px] text-xs font-bold tracking-wide"
                                />
                                <select
                                    value={reviewData.work_mode || ''}
                                    onChange={(event) => setReviewData((prev) => prev ? ({ ...prev, work_mode: (event.target.value || null) as GeneratedOffer['work_mode'] }) : prev)}
                                    className="w-full px-4 py-3 app-input border app-border rounded-[14px] text-xs font-bold tracking-wide"
                                >
                                    <option value="">{isFr ? 'Format de travail' : 'Work mode'}</option>
                                    <option value="Remote">Remote</option>
                                    <option value="Hybrid">Hybrid</option>
                                    <option value="On-site">On-site</option>
                                </select>
                                <select
                                    value={reviewData.contract_type || ''}
                                    onChange={(event) => setReviewData((prev) => prev ? ({ ...prev, contract_type: (event.target.value || null) as GeneratedOffer['contract_type'] }) : prev)}
                                    className="w-full px-4 py-3 app-input border app-border rounded-[14px] text-xs font-bold tracking-wide"
                                >
                                    <option value="">{isFr ? 'Type de contrat' : 'Contract type'}</option>
                                    <option value="CDI">CDI</option>
                                    <option value="CDD">CDD</option>
                                    <option value="Stage">Stage</option>
                                    <option value="Freelance">Freelance</option>
                                </select>
                                <input
                                    type="number"
                                    value={reviewData.salary_min ?? ''}
                                    onChange={(event) => setReviewData((prev) => prev ? ({ ...prev, salary_min: event.target.value ? Number(event.target.value) : null }) : prev)}
                                    placeholder={isFr ? 'Salaire min' : 'Min salary'}
                                    className="w-full px-4 py-3 app-input border app-border rounded-[14px] text-xs font-bold tracking-wide"
                                />
                                <input
                                    type="number"
                                    value={reviewData.salary_max ?? ''}
                                    onChange={(event) => setReviewData((prev) => prev ? ({ ...prev, salary_max: event.target.value ? Number(event.target.value) : null }) : prev)}
                                    placeholder={isFr ? 'Salaire max' : 'Max salary'}
                                    className="w-full px-4 py-3 app-input border app-border rounded-[14px] text-xs font-bold tracking-wide"
                                />
                                <input
                                    type="number"
                                    min="1"
                                    value={reviewData.internship_period ?? ''}
                                    onChange={(event) => setReviewData((prev) => prev ? ({ ...prev, internship_period: event.target.value ? Number(event.target.value) : null }) : prev)}
                                    placeholder={isFr ? 'Periode de stage (mois)' : 'Internship period (months)'}
                                    className="w-full px-4 py-3 app-input border app-border rounded-[14px] text-xs font-bold tracking-wide"
                                />
                                <select
                                    value={reviewData.niveau_etude || ''}
                                    onChange={(event) => setReviewData((prev) => prev ? ({ ...prev, niveau_etude: (event.target.value || null) as GeneratedOffer['niveau_etude'] }) : prev)}
                                    className="w-full px-4 py-3 app-input border app-border rounded-[14px] text-xs font-bold tracking-wide"
                                >
                                    <option value="">{isFr ? "Niveau d'etude" : 'Education level'}</option>
                                    <option value="Bac">Bac</option>
                                    <option value="Bac+2">Bac+2</option>
                                    <option value="Bac+3">Bac+3</option>
                                    <option value="Bac+5">Bac+5</option>
                                    <option value="Bac+8">Bac+8</option>
                                </select>
                                <input
                                    type="number"
                                    min="1"
                                    value={reviewData.places_demanded ?? ''}
                                    onChange={(event) => setReviewData((prev) => prev ? ({ ...prev, places_demanded: event.target.value ? Number(event.target.value) : null }) : prev)}
                                    placeholder={isFr ? 'Places demandees' : 'Places demanded'}
                                    className="w-full px-4 py-3 app-input border app-border rounded-[14px] text-xs font-bold tracking-wide"
                                />
                                <input
                                    type="date"
                                    value={reviewData.start_date || ''}
                                    onChange={(event) => setReviewData((prev) => prev ? ({ ...prev, start_date: event.target.value || null }) : prev)}
                                    className="w-full px-4 py-3 app-input border app-border rounded-[14px] text-xs font-bold tracking-wide"
                                />
                                <input
                                    type="date"
                                    value={reviewData.end_date || ''}
                                    onChange={(event) => setReviewData((prev) => prev ? ({ ...prev, end_date: event.target.value || null }) : prev)}
                                    className="w-full px-4 py-3 app-input border app-border rounded-[14px] text-xs font-bold tracking-wide"
                                />
                            </div>

                            <textarea
                                value={reviewData.description || ''}
                                onChange={(event) => setReviewData((prev) => prev ? ({ ...prev, description: event.target.value || null }) : prev)}
                                rows={5}
                                placeholder={isFr ? 'Description' : 'Description'}
                                className="w-full mt-4 px-4 py-3 app-input border app-border rounded-[14px] text-xs font-bold tracking-wide"
                            />

                            <input
                                type="text"
                                value={Array.isArray(reviewData.skills) ? reviewData.skills.join(', ') : ''}
                                onChange={(event) => setReviewData((prev) => prev ? ({
                                    ...prev,
                                    skills: event.target.value
                                        .split(',')
                                        .map((item) => item.trim())
                                        .filter(Boolean),
                                }) : prev)}
                                placeholder={isFr ? 'Competences (separees par des virgules)' : 'Skills (comma separated)'}
                                className="w-full mt-4 px-4 py-3 app-input border app-border rounded-[14px] text-xs font-bold tracking-wide"
                            />

                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <button
                                    type="button"
                                    disabled={translateLoading}
                                    onClick={() => setShowReviewModal(false)}
                                    className="py-4 bg-white/5 hover:bg-white/10 rounded-full text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                                >
                                    {isFr ? 'Annuler' : 'Cancel'}
                                </button>
                                <button
                                    type="button"
                                    disabled={translateLoading}
                                    onClick={handleApplyReviewedData}
                                    className="py-4 bg-emerald-500 hover:bg-emerald-400 text-black rounded-full text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                                >
                                    {isFr ? 'Appliquer au formulaire' : 'Apply to form'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function InputGroup({ icon, placeholder, value, onChange, type = 'text' }: {
    icon: React.ReactNode; placeholder: string; value: string; onChange: (v: string) => void; type?: string;
}) {
    return (
        <div className="relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                {icon}
            </div>
            <input type={type} placeholder={placeholder} value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full pl-16 pr-6 py-5 app-input border app-border rounded-[24px] text-[11px] font-black tracking-widest focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.07] transition-all placeholder:text-slate-600 uppercase"
            />
        </div>
    );
}
