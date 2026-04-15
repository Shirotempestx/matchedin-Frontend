import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/axios";
import { normalizeLocale } from "@/i18n/config";
import {
  UserIcon,
  Briefcase02Icon,
  Mail01Icon,
  Tick01Icon,
  Cancel01Icon,
  Target01Icon,
  Message01Icon,
  Search01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "hugeicons-react";

interface Application {
  id: number;
  status: string;
  message: string;
  created_at: string;
  user: {
    id: number;
    slug?: string;
    name: string;
    email: string;
    profile_picture: string | null;
  };
  offre: {
    id: number;
    title: string;
  };
  match_percentage?: number;
}

interface PaginatedApplications {
  data: Application[];
  current_page: number;
  last_page: number;
}

export default function ExploreCandidates() {
  const [filter, setFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedApplications | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const location = useLocation();
  const routeLocale = normalizeLocale(
    location.pathname.split("/").filter(Boolean)[0] ||
      localStorage.getItem("preferred_language") ||
      "fr",
  );
  const navigate = useNavigate();

  const buildStudentProfilePath = (user: Application["user"]) => {
    const fallbackSlug = user.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    const slug = user.slug || fallbackSlug || String(user.id);
    return `/${routeLocale}/students/${encodeURIComponent(slug)}`;
  };

  useEffect(() => {
    let cancelled = false;

    const fetchCandidates = async () => {
      setIsLoading(true);
      setIsError(false);

      try {
        const res = await api.get<PaginatedApplications>("/my-candidates", {
          params: { page, status: filter !== "all" ? filter : undefined },
        });

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

    fetchCandidates();

    return () => {
      cancelled = true;
    };
  }, [filter, page, refreshTick]);

  const applications = data?.data || [];

  const handleAction = async (appId: number, status: string) => {
    setIsActionLoading(true);

    try {
      await api.put(`/applications/${appId}/status`, { status });
      setRefreshTick((prev) => prev + 1);
    } finally {
      setIsActionLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-[#09090b] text-white pt-24 pb-12 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter font-syne">
              Gestion des <span className="text-emerald-500">Candidatures</span>
            </h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 italic">
              Prenez des décisions éclairées et trouvez votre futur talent.
            </p>
          </div>

          <div className="flex gap-2 bg-white/[0.03] p-1.5 rounded-2xl border border-white/5">
            {["pending", "accepted", "rejected", "all"].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setFilter(s);
                  setPage(1);
                }}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === s ? "bg-emerald-600 text-white" : "text-slate-500 hover:text-white"}`}
              >
                {s === "pending"
                  ? "En attente"
                  : s === "accepted"
                    ? "Acceptés"
                    : s === "rejected"
                      ? "Refusés"
                      : "Tout"}
              </button>
            ))}
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isError || applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white/[0.01] border border-white/5 border-dashed rounded-[40px]">
            <Search01Icon size={48} className="text-white/10 mb-6" />
            <h3 className="font-syne font-black uppercase text-xl text-white/50">
              {isError ? "Erreur de chargement" : "Aucun candidat"}
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mt-2">
              Aucune candidature ne correspond à ce filtre.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6">
              <AnimatePresence mode="popLayout">
                {applications.map((app: Application, i: number) => (
                  <motion.div
                    key={app.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{
                      duration: 0.4,
                      delay: i * 0.05,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="p-8 bg-white/[0.02] border border-white/5 rounded-[40px] flex flex-col lg:flex-row lg:items-center justify-between gap-8 group hover:border-emerald-500/20 transition-all relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[50px] -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex items-center gap-6 relative z-10">
                      <div className="w-16 h-16 rounded-[24px] bg-white/[0.03] border border-white/10 flex items-center justify-center overflow-hidden">
                        <Link to={buildStudentProfilePath(app.user)}>
                          {app.user.profile_picture ? (
                            <img
                              src={app.user.profile_picture}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserIcon
                              size={32}
                              className="text-slate-700 hover:text-emerald-500 transition-colors"
                            />
                          )}
                        </Link>
                      </div>
                      <div>
                        <Link
                          to={buildStudentProfilePath(app.user)}
                          className="hover:text-emerald-500 transition-colors"
                        >
                          <h3 className="text-xl font-black italic uppercase tracking-tight font-syne">
                            {app.user.name}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-500">
                            <Mail01Icon size={12} /> {app.user.email}
                          </span>
                          <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-emerald-500">
                            <Briefcase02Icon size={12} /> Candidat pour:{" "}
                            {app.offre.title}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      {app.match_percentage !== undefined && (
                        <div
                          className={`px-4 py-2 rounded-2xl border flex items-center gap-2 text-[10px] font-black uppercase tracking-widest w-fit ${
                            app.match_percentage >= 80
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                              : app.match_percentage >= 50
                                ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                : "bg-red-500/10 text-red-500 border-red-500/20"
                          }`}
                        >
                          <Target01Icon size={14} />
                          {app.match_percentage}% MATCH
                        </div>
                      )}
                      {app.message && (
                        <div className="lg:max-w-md bg-white/[0.02] p-4 rounded-2xl border border-white/5 relative z-10 w-full">
                          <p className="text-[10px] text-slate-400 leading-relaxed italic">
                            <Message01Icon
                              size={12}
                              className="inline mr-2 text-emerald-500/50"
                            />
                            "{app.message}"
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 relative z-10">
                      {app.status === "pending" ? (
                        <>
                          <button
                            onClick={() => handleAction(app.id, "accepted")}
                            disabled={isActionLoading}
                            className="px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
                          >
                            <Tick01Icon size={14} /> Accepter
                          </button>
                          <button
                            onClick={() => handleAction(app.id, "rejected")}
                            disabled={isActionLoading}
                            className="px-6 py-4 bg-white/[0.03] hover:bg-red-500/10 hover:text-red-500 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
                          >
                            <Cancel01Icon size={14} /> Refuser
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div
                            className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${app.status === "accepted" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}`}
                          >
                            {app.status === "accepted" ? (
                              <Tick01Icon size={14} />
                            ) : (
                              <Cancel01Icon size={14} />
                            )}
                            {app.status === "accepted"
                              ? "Candidat Accepté"
                              : "Candidature Refusée"}
                          </div>
                          
                          {app.status === "accepted" && (
                            <button
                              onClick={() => handleContact(app.user.id)}
                              disabled={isActionLoading}
                              className="px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                              title="Message"
                            >
                              <Message01Icon size={14} /> Contacter
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {data && data.last_page > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-slate-500 hover:text-white disabled:opacity-30 transition-all"
                >
                  <ArrowLeft01Icon size={18} />
                </button>
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Page <span className="text-emerald-500">{page}</span> sur{" "}
                  {data.last_page}
                </span>
                <button
                  disabled={page === data.last_page}
                  onClick={() =>
                    setPage((p) => Math.min(data.last_page, p + 1))
                  }
                  className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-slate-500 hover:text-white disabled:opacity-30 transition-all"
                >
                  <ArrowRight01Icon size={18} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
