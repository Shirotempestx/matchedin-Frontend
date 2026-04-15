import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/axios";
import {
  Briefcase02Icon,
  CodeIcon,
  Building04Icon,
  ArrowRight01Icon,
  Search01Icon,
  Settings01Icon,
  Globe02Icon,
  Note01Icon,
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
    match_percentage?: number;
    user: {
        company_name: string;
        industry: string;
    }
}

type MetricCardProps = {
  title: string;
  value: string;
  trend: string;
  icon: ReactNode;
  delay: number;
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isFr = (i18n.resolvedLanguage || "fr").startsWith("fr");
  const locale = isFr ? "fr" : "en";
  const withLocale = (path: string) =>
    `/${locale}${path.startsWith("/") ? path : `/${path}`}`;

  const { data: matches = [], isLoading } = useQuery<Offer[]>({
    queryKey: ["suggested-offres"],
    queryFn: async () => {
      const res = await api.get("/offres");
      const allOffers: Offer[] = res.data.data;
      return allOffers
        .filter((o) => o.match_percentage === undefined || o.match_percentage >= 50)
        .slice(0, 3);
    },
  });

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
              {isFr ? "Bonjour," : "Hello,"}{" "}
              <span className="text-blue-500">{user?.name}</span>
            </h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2">
              <Globe02Icon size={14} className="text-blue-500" />
              {user?.country ||
                (isFr ? "Localisation non definie" : "Location not set")}{" "}
              • {user?.email}
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => navigate(withLocale("/profile"))}
              className="flex items-center gap-2 px-6 py-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              <Settings01Icon size={16} />
              {isFr ? "Completer mon profil" : "Complete my profile"}
            </button>
            <button
              onClick={() => navigate(withLocale("/offres"))}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-blue-500/20"
            >
              <Search01Icon size={16} />
              {isFr ? "Explorer les entreprises" : "Explore companies"}
            </button>
          </div>
        </motion.div>

        {/* Real Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            title={isFr ? "Domaine / profil" : "Domain / profile"}
            value={
              user?.profile_type === "IT"
                ? "Tech"
                : user?.profile_type === "NON_IT"
                  ? "Business"
                  : isFr
                    ? "Non defini"
                    : "Not set"
            }
            trend={isFr ? "Categorie principale" : "Primary category"}
            icon={<CodeIcon size={24} className="text-blue-500" />}
            delay={0.1}
          />
          <MetricCard
            title={isFr ? "Format de travail" : "Work format"}
            value={user?.work_mode || (isFr ? "N/A" : "N/A")}
            trend={isFr ? "Preference actuelle" : "Current preference"}
            icon={<Briefcase02Icon size={24} className="text-emerald-500" />}
            delay={0.2}
          />
          <MetricCard
            title={isFr ? "Salaire souhaite" : "Desired salary"}
            value={
              user?.salary_min
                ? `$${user.salary_min}`
                : isFr
                  ? "Non declare"
                  : "Not specified"
            }
            trend={
              user?.salary_min
                ? isFr
                  ? "Par an minimum"
                  : "Minimum per year"
                : ""
            }
            icon={<Note01Icon size={24} className="text-purple-500" />}
            delay={0.3}
          />
          <MetricCard
            title={isFr ? "Competences" : "Skills"}
            value={user?.skill_ids?.length ? `${user.skill_ids.length}` : "0"}
            trend={isFr ? "Technologies / outils" : "Technologies / tools"}
            icon={<Building04Icon size={24} className="text-amber-500" />}
            delay={0.4}
          />
        </div>

        {/* Engagement Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter font-syne">
                Correspondances "Match"
              </h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                {matches.length > 0
                  ? isFr
                    ? "Offres basees sur vos preferences et competences"
                    : "Offers based on your preferences and skills"
                  : isFr
                    ? "Aucune offre suggeree pour le moment"
                    : "No suggested offers yet"}
              </p>
            </div>
            <button
              onClick={() => navigate(withLocale("/offres"))}
              className="text-blue-500 hover:text-blue-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
            >
              {isFr ? "Voir tout" : "View all"} <ArrowRight01Icon size={14} />
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : matches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {matches.map((match, i) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * i }}
                  onClick={() => navigate(withLocale(`/offres/${match.id}`))}
                  className="p-6 bg-white/[0.03] border border-white/10 rounded-[24px] group hover:border-blue-500/30 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                      <Building04Icon size={14} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider">
                        {match.user.company_name}
                      </p>
                      <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">
                        {match.user.industry}
                      </p>
                    </div>
                  </div>
                  <h3 className="text-md font-black italic uppercase tracking-tighter font-syne mb-4 group-hover:text-blue-400 transition-colors">
                    {match.title}
                  </h3>
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                    <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest">
                      {match.contract_type}
                    </span>
                    <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">
                      {match.work_mode}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 bg-white/[0.01] border border-white/5 border-dashed rounded-[24px]">
              <Building04Icon size={48} className="text-white/20 mb-4" />
              <h3 className="font-syne font-black uppercase text-xl text-white/50">
                {isFr
                  ? "Aucune offre suggeree pour le moment"
                  : "No suggested offers yet"}
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mt-2 text-center max-w-sm">
                {isFr
                  ? "Notre algorithme analyse actuellement votre profil. Ajoutez plus de competences pour obtenir des resultats."
                  : "Our matching engine is analyzing your profile. Add more skills to unlock better results."}
              </p>
              <button
                onClick={() => navigate(withLocale("/offres"))}
                className="mt-8 px-8 py-3 bg-blue-600/20 text-blue-500 border border-blue-500/30 rounded-[16px] text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
              >
                {isFr ? "Explorer les offres" : "Explore offers"}
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Background Effects */}
      <div className="fixed top-[20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none z-0" />
    </div>
  );
}

function MetricCard({ title, value, trend, icon, delay }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[50px] -mr-16 -mt-16 transition-all duration-500 group-hover:bg-blue-500/10" />
      <div className="flex items-start justify-between mb-8 relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
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
          <div className="text-[10px] font-bold text-blue-500 mt-2 truncate max-w-full">
            {trend}
          </div>
        )}
      </div>
    </motion.div>
  );
}
