import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import {
  Location01Icon,
  Briefcase02Icon,
  ArrowRight01Icon,
  Building04Icon,
  MoneyBag02Icon,
  Delete01Icon,
} from "hugeicons-react";

interface Offre {
  id: number;
  title: string;
  description: string;
  location: string | null;
  work_mode: string;
  salary_min: number | null;
  salary_max: number | null;
  contract_type: string;
  skills_required: string[] | null;
  created_at: string;
  user: {
    id: number;
    name: string;
    company_name: string | null;
    industry: string | null;
    company_size: string | null;
  };
}

export default function FavoritesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: offres = [],
    isLoading,
    isError,
  } = useQuery<Offre[]>({
    queryKey: ["favorites"],
    queryFn: async () => {
      const res = await api.get("/favorites");
      return res.data;
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (offreId: number) => {
      const res = await api.post(`/favorites/${offreId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const removeFavorite = (e: React.MouseEvent, offreId: number) => {
    e.stopPropagation();
    toggleFavoriteMutation.mutate(offreId);
  };

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max)
      return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
    if (min) return `À partir de $${min.toLocaleString()}`;
    return `Jusqu'à $${max!.toLocaleString()}`;
  };

  const timeAgo = (date: string) => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
    return `Il y a ${Math.floor(diff / 86400)}j`;
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white pt-24 pb-12 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter font-syne">
            Mes <span className="text-blue-500">Favoris</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
            Vos opportunités enregistrées pour une consultation ultérieure.
          </p>
        </motion.div>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isError || offres.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 bg-white/[0.01] border border-white/5 border-dashed rounded-[32px]"
          >
            <Briefcase02Icon size={48} className="text-white/20 mb-4" />
            <h3 className="font-syne font-black uppercase text-xl text-white/50">
              {isError ? "Erreur de chargement" : "Aucun favori"}
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mt-2">
              {isError
                ? "Impossible de charger vos favoris pour le moment."
                : "Vous n'avez pas encore enregistré d'offres."}
            </p>
            <button
              onClick={() => navigate("/offres")}
              className="mt-8 px-8 py-3 bg-blue-600/20 text-blue-500 border border-blue-500/30 rounded-[16px] text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
            >
              Explorer les opportunités
            </button>
          </motion.div>
        ) : (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offres.map((offre, i) => (
                <motion.div
                  key={offre.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/offres/${offre.id}`)}
                  className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-500 cursor-pointer"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[50px] -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-all duration-500" />

                  {/* Company and Delete button */}
                  <div className="flex items-start justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                        <Building04Icon size={18} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider">
                          {offre.user?.company_name || offre.user?.name}
                        </p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                          {offre.user?.industry || "Entreprise"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => removeFavorite(e, offre.id)}
                      className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                      title="Retirer des favoris"
                    >
                      <Delete01Icon size={16} />
                    </button>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-black italic uppercase tracking-tighter font-syne mb-3 relative z-10 group-hover:text-blue-400 transition-colors">
                    {offre.title}
                  </h3>

                  {/* Description preview */}
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-6 relative z-10 line-clamp-3">
                    {offre.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-6 relative z-10">
                    {offre.location && (
                      <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400 bg-white/[0.03] border border-white/10 px-3 py-1.5 rounded-full">
                        <Location01Icon size={10} /> {offre.location}
                      </span>
                    )}
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-600/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                      {offre.work_mode}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-purple-400 bg-purple-600/10 border border-purple-500/20 px-3 py-1.5 rounded-full">
                      {offre.contract_type}
                    </span>
                  </div>

                  {/* Skills */}
                  {offre.skills_required &&
                    offre.skills_required.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-6 relative z-10">
                        {offre.skills_required.slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className="text-[8px] font-black uppercase tracking-widest text-blue-400 bg-blue-600/10 border border-blue-500/20 px-2.5 py-1 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {offre.skills_required.length > 4 && (
                          <span className="text-[8px] font-black text-slate-500">
                            +{offre.skills_required.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                  {/* Footer */}
                  <div className="flex items-center justify-between relative z-10 pt-4 border-t border-white/5">
                    <div>
                      {formatSalary(offre.salary_min, offre.salary_max) ? (
                        <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500">
                          <MoneyBag02Icon size={12} />{" "}
                          {formatSalary(offre.salary_min, offre.salary_max)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-bold">
                          Salaire non précisé
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                      {timeAgo(offre.created_at)}
                    </span>
                  </div>

                  {/* Hover action */}
                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <div className="flex items-center gap-2 text-[10px] font-black italic uppercase tracking-tighter text-blue-500 pointer-events-none">
                      Voir Détails <ArrowRight01Icon size={16} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Background Effects */}
      <div className="fixed top-[20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none z-0" />
    </div>
  );
}
