import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useAlert } from "@/components/alerts/useAlert";
import api from "@/lib/axios";
import {
  UserGroupIcon,
  Briefcase02Icon,
  EyeIcon,
  ArrowRight01Icon,
  PlusSignIcon,
  Search01Icon,
  Tag01Icon,
  GlobalIcon,
  Location01Icon,
  MoneyBag02Icon,
  PencilEdit02Icon,
  Delete02Icon,
  Settings01Icon,
} from "hugeicons-react";

interface Offer {
  id: number;
  title: string;
  description: string;
  location: string;
  work_mode: string;
  salary_min: number;
  salary_max: number;
  contract_type: string;
  created_at: string;
}

export default function EnterpriseDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isFr = (i18n.resolvedLanguage || "fr").startsWith("fr");
  const locale = isFr ? "fr" : "en";
  const withLocale = (path: string) =>
    `/${locale}${path.startsWith("/") ? path : `/${path}`}`;
  const queryClient = useQueryClient();
  const { error: showError, confirm } = useAlert();

  const { data: offres = [], isLoading } = useQuery<Offer[]>({
    queryKey: ["my-offres"],
    queryFn: async () => {
      const res = await api.get("/my-offres");
      return res.data.data; // Paginated response, but for now we take the data
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/offres/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-offres"] });
    },
    onError: (err) => {
      console.error("Failed to delete offer", err);
      showError(
        isFr ? "Erreur lors de la suppression." : "Failed to delete offer.",
      );
    },
  });

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    confirm({
      title: isFr ? "Supprimer cette offre" : "Delete this offer",
      message: isFr
        ? "Etes-vous sur de vouloir supprimer cette offre ?"
        : "Are you sure you want to delete this offer?",
      confirmText: isFr ? "Supprimer" : "Delete",
      cancelText: isFr ? "Annuler" : "Cancel",
      tone: "danger",
      onConfirm: () => deleteMutation.mutate(id),
    });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white pt-24 pb-12 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter font-syne">
              {isFr ? "Bienvenue," : "Welcome,"}{" "}
              <span className="text-emerald-500">
                {user?.company_name ||
                  user?.name ||
                  (isFr ? "Recruteur" : "Recruiter")}
              </span>
            </h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2">
              <Tag01Icon size={14} className="text-emerald-500" />
              {user?.industry ||
                (isFr ? "ENTREPRISE NON CATEGORISEE" : "UNCATEGORIZED COMPANY")}
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => navigate(withLocale("/enterprise-profile"))}
              className="flex items-center gap-2 px-6 py-3 bg-white/3 hover:bg-white/8 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              <Settings01Icon size={16} />
              {isFr ? "Mon profil" : "My profile"}
            </button>
            <button
              onClick={() => navigate(withLocale("/explore-students"))}
              className="flex items-center gap-2 px-6 py-3 bg-white/3 hover:bg-white/8 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              <Search01Icon size={16} />
              {isFr ? "Talents" : "Talent pool"}
            </button>
            {user?.status === "active" && (
              <button
                onClick={() => navigate(withLocale("/offres/create"))}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20"
              >
                <PlusSignIcon size={16} />
                {isFr ? "Creer une offre" : "Create offer"}
              </button>
            )}
          </div>
        </motion.div>

        {/* Real Data File Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            title={isFr ? "Taille de l'entreprise" : "Company size"}
            value={user?.company_size || "N/A"}
            trend={isFr ? "Collaborateurs" : "Employees"}
            icon={<UserGroupIcon size={24} className="text-emerald-500" />}
            delay={0.1}
          />
          <MetricCard
            title={isFr ? "Site web" : "Website"}
            value={
              user?.website
                ? isFr
                  ? "Connecte"
                  : "Connected"
                : isFr
                  ? "Non defini"
                  : "Not set"
            }
            trend={user?.website || ""}
            icon={<GlobalIcon size={24} className="text-blue-500" />}
            delay={0.2}
          />
          <MetricCard
            title={isFr ? "Recruteur" : "Recruiter"}
            value={user?.name || ""}
            trend={user?.email}
            icon={<Briefcase02Icon size={24} className="text-purple-500" />}
            delay={0.3}
          />
          <MetricCard
            title={isFr ? "Statut compte" : "Account status"}
            value={
              user?.status === "active"
                ? isFr
                  ? "Actif"
                  : "Active"
                : isFr
                  ? "En attente"
                  : "Pending"
            }
            trend={
              user?.status === "active"
                ? isFr
                  ? "Pret a recruter"
                  : "Ready to hire"
                : isFr
                  ? "En cours d'examen"
                  : "Under review"
            }
            icon={
              <EyeIcon
                size={24}
                className={
                  user?.status === "active"
                    ? "text-emerald-500"
                    : "text-amber-500"
                }
              />
            }
            delay={0.4}
          />
        </div>

        {/* Engagement Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/2 border border-white/5 rounded-4xl p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter font-syne">
                Vos Offres d'Emploi
              </h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                {offres.length > 0
                  ? isFr
                    ? `Vous avez ${offres.length} offre(s) active(s).`
                    : `You have ${offres.length} active offer(s).`
                  : isFr
                    ? "Creez votre premiere annonce pour commencer a matcher."
                    : "Create your first listing to start matching."}
              </p>
            </div>
            <button
              onClick={() => navigate(withLocale("/offres"))}
              className="text-emerald-500 hover:text-emerald-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
            >
              {isFr ? "Gerer les offres" : "Manage offers"}{" "}
              <ArrowRight01Icon size={14} />
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : offres.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offres.map((offre, i) => (
                <motion.div
                  key={offre.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="p-6 bg-white/3 border border-white/10 rounded-3xl group hover:border-emerald-500/30 transition-all cursor-pointer"
                >
                  <h3 className="text-lg font-black italic uppercase tracking-tighter font-syne group-hover:text-emerald-500 transition-colors mb-2">
                    {offre.title}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 bg-white/5 rounded-md text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                      {offre.contract_type}
                    </span>
                    <span className="px-2 py-1 bg-white/5 rounded-md text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                      {offre.work_mode}
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Location01Icon size={12} />
                      <span className="text-[9px] font-bold uppercase tracking-widest">
                        {offre.location || (isFr ? "Distanciel" : "Remote")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-500/80">
                      <MoneyBag02Icon size={12} />
                      <span className="text-[9px] font-bold uppercase tracking-widest">
                        {offre.salary_min && offre.salary_max
                          ? `$${offre.salary_min} - $${offre.salary_max}`
                          : isFr
                            ? "$ A negocier"
                            : "$ Negotiable"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(withLocale(`/offres/${offre.id}/edit`));
                        }}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-blue-500 hover:border-blue-500/30 transition-all"
                        title={isFr ? "Modifier" : "Edit"}
                      >
                        <PencilEdit02Icon size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, offre.id)}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-red-500 hover:border-red-500/30 transition-all"
                        title={isFr ? "Supprimer" : "Delete"}
                      >
                        <Delete02Icon size={14} />
                      </button>
                    </div>
                    <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">
                      {isFr ? "Publie le" : "Posted on"}{" "}
                      {new Date(offre.created_at).toLocaleDateString(
                        isFr ? "fr-FR" : "en-US",
                      )}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 bg-white/1 border border-white/5 border-dashed rounded-3xl">
              <Briefcase02Icon size={48} className="text-white/20 mb-4" />
              <h3 className="font-syne font-black uppercase text-xl text-white/50">
                {isFr ? "Aucune offre active" : "No active offers"}
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mt-2 text-center max-w-sm">
                {isFr
                  ? "Vous n'avez pas encore publie d'offres d'emploi. Attirez l'elite mondiale des aujourd'hui."
                  : "You haven't published job offers yet. Start attracting top talent today."}
              </p>
              {user?.status === "active" ? (
                <button
                  onClick={() => navigate(withLocale("/offres/create"))}
                  className="mt-8 px-8 py-3 bg-emerald-600/20 text-emerald-500 border border-emerald-500/30 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all"
                >
                  {isFr
                    ? "Publier votre premiere offre"
                    : "Post your first offer"}
                </button>
              ) : (
                <div className="mt-8 px-8 py-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                  {isFr ? "En attente d'approbation" : "Awaiting approval"}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Background Effects */}
      <div className="fixed top-[20%] right-[-10%] w-125 h-125 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-150 h-150 bg-blue-600/10 rounded-full blur-[150px] pointer-events-none z-0" />
    </div>
  );
}

function MetricCard({
  title,
  value,
  trend,
  icon,
  delay,
}: {
  title: string;
  value: string;
  trend?: string;
  icon: ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white/2 border border-white/5 rounded-4xl p-8 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[50px] -mr-16 -mt-16 transition-all duration-500 group-hover:bg-emerald-500/10" />
      <div className="flex items-start justify-between mb-8 relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="relative z-10">
        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">
          {title}
        </h3>
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-black font-syne truncate max-w-full">
            {value}
          </span>
        </div>
        {trend && (
          <div className="text-[10px] font-bold text-emerald-500 mt-2 truncate max-w-full">
            {trend}
          </div>
        )}
      </div>
    </motion.div>
  );
}
