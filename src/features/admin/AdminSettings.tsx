import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/axios';
import { Settings01Icon, PlusSignIcon, Delete02Icon } from 'hugeicons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAlert } from '@/components/alerts/useAlert';

export default function AdminSettings() {
    const { i18n } = useTranslation();
    const isFr = (i18n.resolvedLanguage || 'fr').startsWith('fr');
    const [data, setData] = useState({ skills: [], cities: [], education_levels: [] });
    const [loading, setLoading] = useState(true);

    const [newSkill, setNewSkill] = useState({ nom_competence: '', category: '', weight: 1 });
    const { error: showError, confirm } = useAlert();

    const fetchReferences = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/references');
            setData(res.data);
        } catch (error) {
            console.error('Failed to fetch references', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReferences();
    }, [fetchReferences]);

    // --- Handlers ---
    const handleAddSkill = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/references/skills', newSkill);
            setNewSkill({ nom_competence: '', category: '', weight: 1 });
            fetchReferences();
        } catch (error) {
            console.error('Failed to add skill', error);
            showError(isFr ? "Erreur lors de l'ajout." : 'Failed to add skill.');
        }
    };

    const handleDeleteSkill = async (id: number) => {
        confirm({
            title: isFr ? 'Supprimer cette compétence' : 'Delete this skill',
            message: isFr ? 'Supprimer cette competence ?' : 'Delete this skill?',
            confirmText: isFr ? 'Supprimer' : 'Delete',
            cancelText: isFr ? 'Annuler' : 'Cancel',
            tone: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/references/skills/${id}`);
                    fetchReferences();
                } catch (error) {
                    console.error('Failed to delete skill', error);
                    showError(isFr ? 'Suppression impossible.' : 'Delete failed.');
                }
            }
        });
    };

    if (loading) return (
        <div className="flex h-[80vh] items-center justify-center">
            <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8"
        >
            <div className="flex items-center gap-4 mb-10 border-b border-white/10 pb-6">
                <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-2xl flex items-center justify-center">
                    <Settings01Icon size={24} />
                </div>
                <div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter font-syne text-white">Référentiels</h2>
                    <p className="text-slate-400 text-sm mt-1">
                        {isFr
                            ? "Gerez les donnees globales de la plateforme (competences, villes, niveaux d'etude)"
                            : 'Manage global platform data (skills, cities, education levels)'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* SKILLS */}
                <div className="bg-[#09090b] border border-white/5 p-6 rounded-3xl">
                    <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-widest text-[12px]">{isFr ? 'Competences' : 'Skills'} ({data.skills.length})</h3>
                    
                    <form onSubmit={handleAddSkill} className="mb-6 space-y-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <input required type="text" placeholder={isFr ? 'Nom competence...' : 'Skill name...'} value={newSkill.nom_competence} onChange={e => setNewSkill({...newSkill, nom_competence: e.target.value})} className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-blue-500 outline-none" />
                        <div className="flex gap-2">
                            <input type="text" placeholder={isFr ? 'Categorie (option)' : 'Category (optional)'} value={newSkill.category} onChange={e => setNewSkill({...newSkill, category: e.target.value})} className="w-1/2 bg-[#09090b] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-blue-500 outline-none" />
                            <input type="number" min="1" max="10" placeholder={isFr ? 'Poids' : 'Weight'} value={newSkill.weight} onChange={e => setNewSkill({...newSkill, weight: parseInt(e.target.value)})} className="w-1/2 bg-[#09090b] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-blue-500 outline-none" />
                        </div>
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all">
                            <PlusSignIcon size={14} /> {isFr ? 'Ajouter' : 'Add'}
                        </button>
                    </form>

                    <div className="max-h-96 overflow-y-auto pr-2 space-y-2">
                        <AnimatePresence>
                            {data.skills.map((s: { id_competence: number; nom_competence: string; category?: string; weight: number; }) => (
                                <motion.div key={s.id_competence} exit={{opacity: 0, scale: 0.9}} className="flex justify-between items-center p-3 border border-white/5 rounded-xl hover:bg-white/[0.02]">
                                    <div>
                                        <p className="text-sm font-semibold text-white">{s.nom_competence}</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{s.category || (isFr ? 'General' : 'General')} • {isFr ? 'Poids' : 'Weight'}: {s.weight}</p>
                                    </div>
                                    <button onClick={() => handleDeleteSkill(s.id_competence)} className="text-red-500 hover:text-red-400 p-2"><Delete02Icon size={14} /></button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* CITIES */}
                <div className="bg-[#09090b] border border-white/5 p-6 rounded-3xl relative overflow-hidden group min-h-[300px] flex flex-col items-center justify-center">
                    <div className="absolute top-4 right-4 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        {isFr ? 'Bientot' : 'Soon'}
                    </div>
                    <div className="text-center opacity-50 group-hover:opacity-100 transition-opacity">
                        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-widest text-[12px]">{isFr ? "Secteurs d'activite" : 'Activity sectors'}</h3>
                        <p className="text-xs text-slate-400">{isFr ? "Section a venir. Vous pourrez y ajouter d'autres referentiels (ex: secteurs, langues parlees, etc.)." : 'Coming soon. You will be able to add more reference lists (e.g. sectors, spoken languages, etc.).'}</p>
                    </div>
                </div>

                {/* EDUCATION LEVELS */}
                <div className="bg-[#09090b] border border-white/5 p-6 rounded-3xl relative overflow-hidden group min-h-[300px] flex flex-col items-center justify-center">
                    <div className="absolute top-4 right-4 bg-purple-500/10 text-purple-500 border border-purple-500/20 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        {isFr ? 'Bientot' : 'Soon'}
                    </div>
                    <div className="text-center opacity-50 group-hover:opacity-100 transition-opacity">
                        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-widest text-[12px]">{isFr ? 'Types de contrats' : 'Contract types'}</h3>
                        <p className="text-xs text-slate-400">{isFr ? 'Section a venir. Gerer les types de contrats (CDI, CDD, Stage, Alternance).' : 'Coming soon. Manage contract types (full-time, fixed-term, internship, apprenticeship).'}</p>
                    </div>
                </div>

            </div>
        </motion.div>
    );
}
