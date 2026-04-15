import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import api from '@/lib/axios';
import { useTranslation } from 'react-i18next';
import { normalizeLocale } from '@/i18n/config';
import {
    ArrowLeft01Icon,
    Tick01Icon, AlertCircleIcon
} from 'hugeicons-react';
import SkillSelector from '@/components/shared/SkillSelector';

export default function EditOffre() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { i18n } = useTranslation();
    const isFr = (i18n.resolvedLanguage || 'fr').startsWith('fr');
    const routeLocale = normalizeLocale(location.pathname.split('/').filter(Boolean)[0] || localStorage.getItem('preferred_language') || 'fr');
    const withLocale = (path: string) => `/${routeLocale}${path.startsWith('/') ? path : `/${path}`}`;
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        work_mode: 'On-site',
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

    useEffect(() => {
        if (authLoading) {
            return;
        }

        const normalizedRole = (user?.role || '').toLowerCase();
        const isEnterpriseRole = normalizedRole === 'enterprise' || normalizedRole === 'entreprise';

        if (!isAuthenticated || !user || !isEnterpriseRole) {
            navigate(withLocale('/dashboard'));
            return;
        }

        const fetchOffre = async () => {
            try {
                const res = await api.get(`/offres/${id}`);
                const data = res.data;

                // Ensure the user owns this offer
                if (data.user_id !== user.id) {
                    navigate(withLocale('/dashboard'));
                    return;
                }

                setFormData({
                    title: data.title,
                    description: data.description,
                    location: data.location || '',
                    work_mode: data.work_mode,
                    salary_min: data.salary_min?.toString() || '',
                    salary_max: data.salary_max?.toString() || '',
                    contract_type: data.contract_type,
                    skills_required: data.skills_details || [],
                    start_date: data.start_date ? String(data.start_date).slice(0, 10) : '',
                    end_date: data.end_date ? String(data.end_date).slice(0, 10) : '',
                    internship_period: data.internship_period?.toString() || '',
                    niveau_etude: data.niveau_etude || '',
                    places_demanded: data.places_demanded?.toString() || '1',
                });
            } catch (err) {
                console.error("Failed to fetch offer", err);
                navigate(withLocale('/dashboard'));
            } finally {
                setLoading(false);
            }
        };

        fetchOffre();
    }, [id, isAuthenticated, user, authLoading, navigate, routeLocale]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                location: formData.location || null,
                work_mode: formData.work_mode,
                salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
                salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
                contract_type: formData.contract_type,
                start_date: formData.start_date || null,
                end_date: formData.end_date || null,
                internship_period: formData.internship_period ? parseInt(formData.internship_period) : null,
                niveau_etude: formData.niveau_etude || null,
                places_demanded: parseInt(formData.places_demanded || '1'),
                skills_required: formData.skills_required.map(s => ({
                    id: s.id,
                    level: s.level
                }))
            };
            await api.put(`/offres/${id}`, payload);
            setSuccess(true);
            setTimeout(() => navigate(withLocale('/dashboard')), 2000);
        } catch (err: any) {
            console.error("Update error detail:", err.response?.data);
            const msg = err.response?.data?.message || (isFr ? 'Une erreur est survenue.' : 'An error occurred.');
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090b] text-white pt-24 pb-32 px-6 relative overflow-x-hidden">
            <div className="fixed top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-4xl mx-auto relative z-10">
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-3 text-slate-500 hover:text-white transition-colors mb-12 group"
                >
                    <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ArrowLeft01Icon size={18} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isFr ? 'Retour' : 'Back'}</span>
                </motion.button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-2 mb-10"
                        >
                            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter font-syne leading-none">
                                {isFr ? "Modifier l'" : 'Edit'} <span className="text-blue-500">{isFr ? 'Offre' : 'Offer'}</span>
                            </h1>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">{isFr ? 'Mettez a jour les details de votre opportunite.' : 'Update your opportunity details.'}</p>
                        </motion.div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 gap-6 p-8 bg-white/[0.02] border border-white/5 rounded-[32px]">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">{isFr ? "Titre de l'offre" : 'Offer title'}</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-sm focus:border-blue-500/50 outline-none transition-all font-medium uppercase placeholder:text-white/10"
                                        placeholder="Ex: Senior Full Stack Developer"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">{isFr ? 'Description' : 'Description'}</label>
                                    <textarea
                                        required
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full h-48 bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-sm focus:border-blue-500/50 outline-none transition-all font-medium resize-none placeholder:text-white/10"
                                        placeholder={isFr ? "Decrivez les responsabilites et l'environnement de travail..." : 'Describe responsibilities and work environment...'}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">{isFr ? 'Localisation' : 'Location'}</label>
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-sm focus:border-blue-500/50 outline-none transition-all font-medium uppercase"
                                            placeholder="Ex: Paris, France"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">{isFr ? 'Mode de travail' : 'Work mode'}</label>
                                        <select
                                            value={formData.work_mode}
                                            onChange={e => setFormData({ ...formData, work_mode: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-sm focus:border-blue-500/50 outline-none transition-all font-medium"
                                        >
                                            <option value="On-site">{isFr ? 'Presentiel' : 'On-site'}</option>
                                            <option value="Hybrid">{isFr ? 'Hybride' : 'Hybrid'}</option>
                                            <option value="Remote">Remote</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 p-8 bg-white/[0.02] border border-white/5 rounded-[32px]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">{isFr ? 'Type de contrat' : 'Contract type'}</label>
                                        <select
                                            value={formData.contract_type}
                                            onChange={e => setFormData({ ...formData, contract_type: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-sm focus:border-blue-500/50 outline-none transition-all font-medium"
                                        >
                                            <option value="CDI">CDI</option>
                                            <option value="CDD">CDD</option>
                                            <option value="Stage">Stage</option>
                                            <option value="Freelance">Freelance</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">{isFr ? 'Salaire annuel (K€)' : 'Annual salary (K€)'}</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                placeholder={isFr ? 'Min' : 'Min'}
                                                value={formData.salary_min}
                                                onChange={e => setFormData({ ...formData, salary_min: e.target.value })}
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-4 text-sm focus:border-blue-500/50 outline-none transition-all font-medium"
                                            />
                                            <span className="text-slate-600">-</span>
                                            <input
                                                type="number"
                                                placeholder={isFr ? 'Max' : 'Max'}
                                                value={formData.salary_max}
                                                onChange={e => setFormData({ ...formData, salary_max: e.target.value })}
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-4 text-sm focus:border-blue-500/50 outline-none transition-all font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">{isFr ? 'Date de debut' : 'Start date'}</label>
                                        <input
                                            type="date"
                                            value={formData.start_date}
                                            onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-sm focus:border-blue-500/50 outline-none transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">{isFr ? 'Date de fin' : 'End date'}</label>
                                        <input
                                            type="date"
                                            value={formData.end_date}
                                            onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-sm focus:border-blue-500/50 outline-none transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">{isFr ? 'Periode stage (mois)' : 'Internship period (months)'}</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={formData.internship_period}
                                            onChange={e => setFormData({ ...formData, internship_period: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-sm focus:border-blue-500/50 outline-none transition-all font-medium"
                                            placeholder="6"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">{isFr ? "Niveau d'etude" : 'Education level'}</label>
                                        <select
                                            value={formData.niveau_etude}
                                            onChange={e => setFormData({ ...formData, niveau_etude: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-sm focus:border-blue-500/50 outline-none transition-all font-medium"
                                        >
                                            <option value="">{isFr ? 'Selectionner' : 'Select'}</option>
                                            <option value="Bac">Bac</option>
                                            <option value="Bac+2">Bac+2</option>
                                            <option value="Bac+3">Bac+3</option>
                                            <option value="Bac+5">Bac+5</option>
                                            <option value="Bac+8">Bac+8</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">{isFr ? 'Places demandees' : 'Places demanded'}</label>
                                        <input
                                            type="number"
                                            min={1}
                                            required
                                            value={formData.places_demanded}
                                            onChange={e => setFormData({ ...formData, places_demanded: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-sm focus:border-blue-500/50 outline-none transition-all font-medium"
                                            placeholder="1"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[32px] space-y-6">
                                <SkillSelector
                                    accentColor="blue"
                                    defaultProfileType="ALL"
                                    showDomainCards={false}
                                    allowDomainChange={false}
                                    initialSkills={formData.skills_required as any}
                                    onUpdate={(skills) => setFormData(prev => ({ ...prev, skills_required: skills }))}
                                    title={isFr ? 'Competences recherchees' : 'Required skills'}
                                    description={isFr ? 'Ajustez les expertises tech ou business attendues.' : 'Adjust the expected technical or business expertise.'}
                                />
                            </div>

                            <div className="pt-6">
                                {error && (
                                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500">
                                        <AlertCircleIcon size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
                                    </div>
                                )}

                                {success && (
                                    <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-500 animate-pulse">
                                        <Tick01Icon size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{isFr ? 'Offre mise a jour avec succes !' : 'Offer updated successfully!'}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50 shadow-xl shadow-blue-500/20 active:scale-[0.98]"
                                >
                                    {submitting ? (isFr ? 'Mise a jour...' : 'Updating...') : (isFr ? 'Sauvegarder les modifications' : 'Save changes')}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <div className="p-8 bg-blue-600/10 border border-blue-500/20 rounded-[32px] space-y-4">
                            <h3 className="text-sm font-black italic uppercase tracking-tighter font-syne text-blue-400 leading-tight">{isFr ? 'Pourquoi garder ses offres a jour ?' : 'Why keep offers updated?'}</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-relaxed">
                                {isFr ? "Les offres regulierement mises a jour beneficient d'une meilleure visibilite aupres des etudiants et montrent le dynamisme de votre entreprise." : 'Regularly updated offers gain better visibility and reflect your company momentum.'}
                            </p>
                        </div>

                        <div className="p-8 bg-white/[0.02] border border-white/10 rounded-[32px] space-y-4">
                            <h3 className="text-sm font-black italic uppercase tracking-tighter font-syne text-slate-300">{isFr ? "Besoin d'aide ?" : 'Need help?'}</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-relaxed">
                                {isFr ? "Notre equipe support est disponible pour vous aider a optimiser vos descriptions d'offres." : 'Our support team can help you optimize your offer descriptions.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
