import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Layout01Icon,
  ArrowRight01Icon,
  Search01Icon,
  Activity01Icon,
  Cursor01Icon,
  StarIcon,
  CheckListIcon,
  AiMagicIcon,
  ChartAverageIcon,
  ShieldKeyIcon,
  Globe02Icon,
} from "hugeicons-react";

type FeatureColor = "blue" | "violet" | "emerald" | "amber" | "rose" | "cyan";

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────
const INITIAL_STUDENTS = [
  { id: "s1", name: "Yassine A.", skill: "Laravel / React", match: "98%" },
  { id: "s2", name: "Sofia M.", skill: "Next.js / TypeScript", match: "94%" },
  { id: "s3", name: "Omar K.", skill: "Node.js / Vue.js", match: "89%" },
  { id: "s4", name: "Lina B.", skill: "Python / Django", match: "91%" },
];

const INITIAL_JOBS = [
  { id: "j1", co: "TechNova", role: "Fullstack Eng", pay: "14k $" },
  { id: "j2", co: "DataSync", role: "Backend Architect", pay: "18k $" },
  { id: "j3", co: "InnoWeb", role: "Frontend Lead", pay: "12k $" },
  { id: "j4", co: "CloudNet", role: "DevOps", pay: "16k $" },
];

// ─────────────────────────────────────────────
// HERO DEMO (preserved, restyled)
// ─────────────────────────────────────────────
function HeroDemo() {
  const { i18n } = useTranslation();
  const isFr = (i18n.resolvedLanguage || "fr").startsWith("fr");
  const [view, setView] = useState("enterprise");
  const [cursorPos, setCursorPos] = useState({ x: 500, y: 300 });
  const [pressingId, setPressingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<
    Array<{ id: number; msg: string; type: string }>
  >([]);
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [jobs, setJobs] = useState(INITIAL_JOBS);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (students.length === 0) {
      const t = setTimeout(() => setStudents(INITIAL_STUDENTS), 1000);
      return () => clearTimeout(t);
    }
  }, [students]);

  useEffect(() => {
    if (jobs.length === 0) {
      const t = setTimeout(() => setJobs(INITIAL_JOBS), 1000);
      return () => clearTimeout(t);
    }
  }, [jobs]);

  const addToast = (msg: string, type: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      2000,
    );
  };

  const triggerAction = useCallback(
    (id: string, type: "apply" | "accept" | "reject", name: string) => {
      setPressingId(id);
      setTimeout(() => {
        setPressingId(null);
        if (type === "apply") {
          addToast(
            isFr ? `Postule a ${name}` : `Applied to ${name}`,
            "success",
          );
          setJobs((prev) => prev.filter((j) => `job-${j.id}` !== id));
        } else {
          addToast(
            type === "accept"
              ? isFr
                ? `${name} accepte`
                : `${name} accepted`
              : isFr
                ? `${name} refuse`
                : `${name} declined`,
            type === "accept" ? "success" : "error",
          );
          setStudents((prev) => prev.filter((s) => s.id !== id.split("-")[0]));
        }
      }, 400);
    },
    [],
  );

  const runSequence = useCallback(() => {
    if (!containerRef.current) return;
    const selector =
      view === "enterprise" ? ".recruiter-action" : ".student-action";
    const targets = document.querySelectorAll(selector);
    if (targets.length > 0) {
      const target = targets[Math.floor(Math.random() * targets.length)];
      const rect = target.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      setCursorPos({
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top + rect.height / 2,
      });
      setTimeout(() => {
        const id = target.getAttribute("data-id") || "";
        const name = target.getAttribute("data-name") || "";
        const type = target.classList.contains("accept")
          ? "accept"
          : target.classList.contains("reject")
            ? "reject"
            : "apply";
        triggerAction(id, type, name);
      }, 2300);
    }
  }, [view, triggerAction]);

  useEffect(() => {
    const init = setTimeout(runSequence, 100);
    const loop = setInterval(runSequence, 3000);
    const swap = setInterval(
      () => setView((v) => (v === "enterprise" ? "student" : "enterprise")),
      7000,
    );
    return () => {
      clearTimeout(init);
      clearInterval(loop);
      clearInterval(swap);
    };
  }, [runSequence]);

  return (
    <div className="relative flex flex-col items-center justify-center gap-8 w-full overflow-hidden p-10">
      {/* Tab switcher - Now part of the flex flow, bigger and more refined */}
      <div className="z-30 flex items-center gap-2 p-1.5 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-200/80">
        <button
          onClick={() => setView("enterprise")}
          className={`px-8 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all duration-300 ${
            view === "enterprise"
              ? "bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.3)]"
              : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          {isFr ? "Recruteur" : "Recruiter"}
        </button>
        <button
          onClick={() => setView("student")}
          className={`px-8 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all duration-300 ${
            view === "student"
              ? "bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.3)]"
              : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          {isFr ? "Etudiant" : "Student"}
        </button>
      </div>

      {/* Main Container - Scaled Up */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[1024px] h-[640px] bg-white rounded-[40px] border border-slate-200 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #ffffff 0%, #f8faff 100%)",
        }}
      >
        {/* Cursor */}
        <div
          className="absolute z-[100] pointer-events-none transition-all duration-[2200ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            transform: `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0)`,
          }}
        >
          <Cursor01Icon
            size={22}
            className="text-slate-800 -translate-x-1 -translate-y-1 drop-shadow-md fill-white"
          />
          <div className="mt-2 px-3 py-1.5 bg-blue-600 backdrop-blur-md rounded-full shadow-xl flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white text-[9px] font-black">
              U
            </div>
            <span className="text-white text-[11px] font-bold">User</span>
          </div>
        </div>

        {/* Toast notifications */}
        <div className="absolute bottom-6 right-6 z-[200] flex flex-col gap-2">
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 40, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg border bg-white ${t.type === "success" ? "border-emerald-100 text-emerald-600" : "border-red-100 text-red-500"}`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${t.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}
                />
                <span className="text-[11px] font-black uppercase tracking-tight">
                  {t.msg}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ENTERPRISE VIEW */}
        <div
          className={`absolute inset-0 p-8 pt-12 transition-all duration-700 ${view === "enterprise" ? "opacity-100" : "opacity-0 pointer-events-none translate-y-2"}`}
          style={{
            background: "linear-gradient(160deg, #0f172a 0%, #1e293b 100%)",
          }}
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Candidatures reçues
              </div>
              <h4 className="text-lg font-black text-white tracking-tight">
                {isFr ? "4 profils matches" : "4 matched profiles"}
              </h4>
            </div>
            <div className="flex items-center gap-2 h-7 px-3 bg-blue-500/15 border border-blue-500/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-tight">
                {isFr ? "IA active" : "AI active"}
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {students.map((s) => (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -24, filter: "blur(8px)" }}
                  className="flex items-center justify-between px-5 py-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.04] backdrop-blur-sm hover:bg-white/[0.07] transition-colors"
                >
                  <div className="flex gap-3.5 items-center">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-600/20 text-blue-300 flex items-center justify-center font-black text-xs border border-white/10">
                      {s.name[0]}
                    </div>
                    <div>
                      <p className="text-[13px] font-black text-white leading-tight">
                        {s.name}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mt-0.5">
                        {s.skill}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                      <span className="text-blue-400 text-[11px] font-black">
                        {s.match}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        data-id={`${s.id}-acc`}
                        data-name={s.name}
                        className={`recruiter-action accept w-8 h-8 rounded-xl flex items-center justify-center transition-all ${pressingId === `${s.id}-acc` ? "bg-emerald-500 scale-90 text-white" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"}`}
                      >
                        <CheckmarkCircle01Icon size={16} />
                      </button>
                      <button
                        data-id={`${s.id}-rej`}
                        data-name={s.name}
                        className={`recruiter-action reject w-8 h-8 rounded-xl flex items-center justify-center transition-all ${pressingId === `${s.id}-rej` ? "bg-red-500 scale-90 text-white" : "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"}`}
                      >
                        <Cancel01Icon size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* STUDENT VIEW */}
        <div
          className={`absolute inset-0 p-8 pt-12 transition-all duration-700 bg-white ${view === "student" ? "opacity-100" : "opacity-0 pointer-events-none -translate-y-2"}`}
        >
          <div className="flex h-full gap-7">
            {/* Sidebar */}
            <div className="w-14 bg-slate-50 rounded-[22px] border border-slate-100/80 flex flex-col items-center py-7 gap-7 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
                <Layout01Icon className="text-white" size={16} />
              </div>
              <Search01Icon className="text-slate-300" size={20} />
              <Activity01Icon className="text-slate-300" size={20} />
              <div className="mt-auto w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-100 border border-slate-200" />
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    {isFr ? "Tableau de bord" : "Dashboard"}
                  </div>
                  <h3 className="text-xl font-black text-slate-950 tracking-tight">
                    {isFr ? "Opportunites" : "Opportunities"}
                  </h3>
                </div>
                <div className="flex items-center gap-2 h-8 px-3 bg-blue-50 border border-blue-100 rounded-full">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-tight">
                    {isFr ? "4 nouveaux matchs" : "4 new matches"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 flex-1">
                <AnimatePresence mode="popLayout">
                  {jobs.map((job) => (
                    <motion.div
                      key={job.id}
                      layout
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92, filter: "blur(8px)" }}
                      className="p-5 rounded-[22px] bg-slate-50 border border-slate-100 flex flex-col justify-between group hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200"
                    >
                      <div className="flex justify-between items-start">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-blue-600 font-black text-sm shadow-sm">
                          {job.co[0]}
                        </div>
                        <span className="text-[11px] font-black text-slate-400">
                          {job.pay} MAD
                        </span>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">
                          {job.co}
                        </p>
                        <h5 className="text-[13px] font-black text-slate-900 leading-tight">
                          {job.role}
                        </h5>
                      </div>
                      <button
                        data-id={`job-${job.id}`}
                        data-name={job.co}
                        className={`student-action w-full h-8 font-black rounded-xl text-[10px] uppercase tracking-tight transition-all flex items-center justify-between px-3 ${pressingId === `job-${job.id}` ? "bg-blue-600 text-white scale-95" : "bg-white text-slate-700 border border-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600"}`}
                      >
                        {isFr ? "Postuler" : "Apply"}
                        <ArrowRight01Icon size={14} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ANIMATED COUNTER
// ─────────────────────────────────────────────
function useCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return { count, ref };
}

// ─────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────
function HeroSection() {
  const { i18n } = useTranslation();
  const isFr = (i18n.resolvedLanguage || "fr").startsWith("fr");
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center pt-28 pb-24 overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, #0f172a 0%, #1e3a5f 50%, #1e293b 100%)",
      }}
    >
      {/* Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:48px_48px]" />
      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />
      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-6 mb-20 max-w-5xl mx-auto">
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-6xl md:text-8xl font-black text-white uppercase italic tracking-tighter leading-[0.88] mb-8"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          {isFr ? "Le Recrutement" : "Hiring"}
          <br />
          <span
            style={{
              background:
                "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {isFr ? "Reinvente." : "Reimagined."}
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="text-slate-300/80 text-lg max-w-xl font-medium leading-relaxed"
        >
          {isFr
            ? "Connectez les talents tech du Maroc aux meilleures opportunites en quelques secondes. Notre agent IA analyse, filtre et matche automatiquement."
            : "Connect Moroccan tech talent to top opportunities in seconds. Our AI agent analyzes, filters, and matches automatically."}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-10 flex gap-3 flex-wrap justify-center"
        >
          <button
            className="h-13 px-8 bg-blue-600 hover:bg-blue-500 text-white text-sm font-black uppercase tracking-tight rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-3"
            style={{
              height: "52px",
              boxShadow:
                "0 0 48px rgba(59,130,246,0.4), 0 4px 16px rgba(59,130,246,0.2)",
            }}
          >
            {isFr ? "Trouver un talent" : "Find talent"}
            <ArrowRight01Icon size={17} />
          </button>
          <button
            className="h-13 px-8 bg-white/8 hover:bg-white/12 border border-white/15 text-white text-sm font-black uppercase tracking-tight rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-3 backdrop-blur-sm"
            style={{ height: "52px" }}
          >
            {isFr ? "Trouver un emploi" : "Find a job"}
            <ArrowRight01Icon size={17} />
          </button>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-10 flex items-center gap-3"
        >
          <div className="flex -space-x-2">
            {["A", "B", "C", "D", "E"].map((l, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-[#1e3a5f] flex items-center justify-center text-[10px] font-black text-white"
                style={{
                  background: `hsl(${215 + i * 12}, 70%, ${35 + i * 5}%)`,
                }}
              >
                {l}
              </div>
            ))}
          </div>
          <p className="text-slate-400 text-sm font-medium">
            <span className="text-white font-bold">4 800+</span>{" "}
            {isFr ? "talents inscrits" : "registered talents"}
          </p>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <StarIcon
                key={i}
                size={13}
                className="text-amber-400 fill-amber-400"
              />
            ))}
          </div>
          <span className="text-slate-400 text-sm font-medium">4.5/5</span>
        </motion.div>
      </div>

      {/* Demo widget */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[1020px] px-6 mt-4"
      >
        <HeroDemo />
      </motion.div>
    </section>
  );
}

// ─────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────
function StatsSection() {
  const { i18n } = useTranslation();
  const isFr = (i18n.resolvedLanguage || "fr").startsWith("fr");
  const stats = [
    {
      value: 4800,
      suffix: "+",
      label: isFr ? "Talents inscrits" : "Registered talents",
      desc: isFr
        ? "Profils verifies et actifs"
        : "Verified and active profiles",
    },
    {
      value: 320,
      suffix: "+",
      label: isFr ? "Entreprises" : "Companies",
      desc: isFr
        ? "Startups, PME et grands groupes"
        : "Startups, SMEs, and enterprises",
    },
    {
      value: 94,
      suffix: "%",
      label: isFr ? "Taux de placement" : "Placement rate",
      desc: isFr
        ? "Matching en moins de 30 jours"
        : "Matching in under 30 days",
    },
    {
      value: 12,
      suffix: "s",
      label: isFr ? "Temps de matching" : "Matching time",
      desc: isFr ? "Grace a notre moteur IA" : "Powered by our AI engine",
    },
  ];

  const containerRef = useRef(null);
  const inView = useInView(containerRef, { once: true, amount: 0.2 });

  return (
    <section className="bg-white py-20 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-8">
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-0 rounded-3xl overflow-hidden border border-slate-200/60"
          style={{ boxShadow: "0 8px 40px -8px rgba(37,99,235,0.06)" }}
        >
          {stats.map((s, i) => {
            const { count, ref } = useCounter(s.value);
            return (
              <div
                key={i}
                ref={ref}
                className={`p-10 flex flex-col gap-1.5 bg-white hover:bg-blue-50/40 transition-colors duration-300 group ${i < 3 ? "border-r border-slate-200/60" : ""} ${i >= 2 ? "border-t border-t-slate-200/60 md:border-t-0" : ""}`}
              >
                <div className="text-5xl font-black text-slate-950 tracking-tighter">
                  {count.toLocaleString()}
                  <span className="text-blue-600">{s.suffix}</span>
                </div>
                <div className="text-[13px] font-black text-slate-800 uppercase tracking-tight mt-1">
                  {s.label}
                </div>
                <div className="text-[12px] text-slate-400 font-medium">
                  {s.desc}
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// LOGOS STRIP
// ─────────────────────────────────────────────
function LogosSection() {
  const { i18n } = useTranslation();
  const isFr = (i18n.resolvedLanguage || "fr").startsWith("fr");
  const logos = [
    "TechNova",
    "DataSync",
    "InnoWeb",
    "CloudNet",
    "Agora Tech",
    "Nexus Digital",
    "DevMorocco",
    "TalentHub",
  ];
  return (
    <section className="bg-slate-50/60 border-b border-slate-100 py-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-8 mb-6">
        <p className="text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">
          {isFr ? "Ils nous font confiance" : "Trusted by teams"}
        </p>
      </div>
      <div className="relative flex overflow-hidden">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 22, ease: "linear", repeat: Infinity }}
          className="flex gap-12 items-center whitespace-nowrap"
        >
          {[...logos, ...logos].map((logo, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200/60 shadow-sm"
            >
              <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white text-[10px] font-black">
                {logo[0]}
              </div>
              <span className="text-[13px] font-black text-slate-600 uppercase tracking-tight">
                {logo}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// FEATURES
// ─────────────────────────────────────────────
function FeaturesSection() {
  const { i18n } = useTranslation();
  const isFr = (i18n.resolvedLanguage || "fr").startsWith("fr");
  const features = [
    {
      icon: AiMagicIcon,
      tag: isFr ? "IA autonome" : "Autonomous AI",
      title: isFr ? "Matching instantane" : "Instant matching",
      body: isFr
        ? "Notre algorithme analyse les competences techniques, les preferences et la culture d'entreprise pour proposer le match parfait en quelques secondes."
        : "Our engine analyzes technical skills, preferences, and company culture to deliver the best match in seconds.",
      color: "blue" as FeatureColor,
    },
    {
      icon: ChartAverageIcon,
      tag: isFr ? "Precision" : "Precision",
      title: isFr ? "Score de compatibilite" : "Compatibility score",
      body: isFr
        ? "Chaque candidature recoit un score base sur 47 criteres, de l'experience a la disponibilite."
        : "Each application receives a score based on 47 criteria, from experience to availability.",
      color: "violet" as FeatureColor,
    },
    {
      icon: CheckListIcon,
      tag: isFr ? "Automatisation" : "Automation",
      title: isFr ? "Workflow intelligent" : "Smart workflow",
      body: isFr
        ? "Acceptez, rejetez ou planifiez des entretiens depuis la plateforme. L'agent IA gere les relances automatiquement."
        : "Accept, reject, or schedule interviews from one place. The AI agent handles follow-ups.",
      color: "emerald" as FeatureColor,
    },
    {
      icon: Activity01Icon,
      tag: "Analytics",
      title: isFr ? "Tableau de bord avance" : "Advanced dashboard",
      body: isFr
        ? "Visualisez vos metriques en temps reel: funnel, delais de reponse, taux de conversion."
        : "Track real-time metrics: funnel health, response times, and conversion rates.",
      color: "amber" as FeatureColor,
    },
    {
      icon: ShieldKeyIcon,
      tag: isFr ? "Confiance" : "Trust",
      title: isFr ? "Profils verifies" : "Verified profiles",
      body: isFr
        ? "Chaque etudiant est verifie via son etablissement. Portfolios, projets GitHub et references sont valides."
        : "Each student is institution-verified. Portfolios, GitHub projects, and references are validated.",
      color: "rose" as FeatureColor,
    },
    {
      icon: Globe02Icon,
      tag: "Local & Global",
      title: isFr ? "Ancre au Maroc" : "Rooted in Morocco",
      body: isFr
        ? "Concu pour l'ecosysteme tech marocain, avec une portee internationale."
        : "Built for the Moroccan tech ecosystem with international reach.",
      color: "cyan" as FeatureColor,
    },
  ];

  const colorMap = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-100",
      icon: "bg-blue-600",
      tag: "text-blue-600 bg-blue-50 border-blue-100",
    },
    violet: {
      bg: "bg-violet-50",
      border: "border-violet-100",
      icon: "bg-violet-600",
      tag: "text-violet-600 bg-violet-50 border-violet-100",
    },
    emerald: {
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      icon: "bg-emerald-600",
      tag: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-100",
      icon: "bg-amber-500",
      tag: "text-amber-600 bg-amber-50 border-amber-100",
    },
    rose: {
      bg: "bg-rose-50",
      border: "border-rose-100",
      icon: "bg-rose-600",
      tag: "text-rose-600 bg-rose-50 border-rose-100",
    },
    cyan: {
      bg: "bg-cyan-50",
      border: "border-cyan-100",
      icon: "bg-cyan-600",
      tag: "text-cyan-600 bg-cyan-50 border-cyan-100",
    },
  };

  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section id="features" ref={ref} className="bg-white py-32">
      <div className="max-w-7xl mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8"
        >
          <div>
            <div className="text-blue-600 text-[11px] font-black uppercase tracking-[0.3em] mb-4">
              {isFr ? "Fonctionnalites" : "Features"}
            </div>
            <h2
              className="text-5xl md:text-6xl font-black text-slate-950 uppercase tracking-tighter leading-[0.9]"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {isFr ? "Tout ce dont vous" : "Everything you"}
              <br />
              <span className="text-blue-600">avez besoin.</span>
            </h2>
          </div>
          <p className="text-slate-500 max-w-sm font-medium leading-relaxed md:text-right text-[15px]">
            {isFr
              ? "Une plateforme pour les deux cotes du recrutement. Puissante pour les entreprises, intuitive pour les talents."
              : "One platform for both sides of hiring. Powerful for companies, intuitive for talent."}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => {
            const c = colorMap[f.color];
            const Icon = f.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 32 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.6,
                  delay: i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="group p-7 rounded-[24px] bg-white border border-slate-200/60 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 cursor-default"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className={`w-10 h-10 rounded-xl ${c.icon} flex items-center justify-center shadow-sm`}
                  >
                    <Icon size={18} className="text-white" />
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase tracking-tight px-2.5 py-1 rounded-full border ${c.tag}`}
                  >
                    {f.tag}
                  </span>
                </div>
                <h3 className="text-[17px] font-black text-slate-950 tracking-tight mb-2.5">
                  {f.title}
                </h3>
                <p className="text-slate-500 text-[13px] font-medium leading-relaxed">
                  {f.body}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// PROCESS
// ─────────────────────────────────────────────
function ProcessSection() {
  const { i18n } = useTranslation();
  const isFr = (i18n.resolvedLanguage || "fr").startsWith("fr");
  const steps = [
    {
      num: "01",
      role: isFr ? "Etudiant" : "Student",
      title: isFr ? "Creez votre profil" : "Create your profile",
      body: isFr
        ? "Renseignez vos competences, projets et preferences. Notre IA construit votre profil automatiquement."
        : "Add your skills, projects, and preferences. Our AI builds your profile automatically.",
      accent: "bg-blue-600",
    },
    {
      num: "02",
      role: isFr ? "Systeme IA" : "AI system",
      title: isFr ? "L'IA analyse et matche" : "AI analyzes and matches",
      body: isFr
        ? "Notre moteur compare en continu les profils et les offres actives."
        : "Our engine continuously compares profiles and active opportunities.",
      accent: "bg-violet-600",
    },
    {
      num: "03",
      role: isFr ? "Entreprise" : "Company",
      title: isFr ? "Vous recevez les matchs" : "Receive your matches",
      body: isFr
        ? "Les recruteurs recoivent une selection qualifiee. Acceptez ou rejetez en un clic."
        : "Recruiters receive qualified shortlists. Accept or reject in one click.",
      accent: "bg-emerald-600",
    },
    {
      num: "04",
      role: isFr ? "Les deux" : "Both",
      title: isFr ? "Entretien et placement" : "Interview and hire",
      body: isFr
        ? "La plateforme facilite la prise de contact et le suivi."
        : "The platform streamlines outreach and follow-up until placement.",
      accent: "bg-amber-500",
    },
  ];

  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section
      id="process"
      ref={ref}
      className="py-32 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #f8faff 0%, #ffffff 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-20"
        >
          <div className="text-blue-600 text-[11px] font-black uppercase tracking-[0.3em] mb-4">
            {isFr ? "Comment ca marche" : "How it works"}
          </div>
          <h2
            className="text-5xl md:text-6xl font-black text-slate-950 uppercase tracking-tighter"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {isFr ? "Quatre etapes." : "Four steps."}
            <br />
            <span className="text-blue-600">
              {isFr ? "Un resultat." : "One outcome."}
            </span>
          </h2>
        </motion.div>

        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Connector line desktop */}
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-blue-200 via-blue-100 to-blue-200 z-0" />

          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.7,
                delay: i * 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative z-10"
            >
              <div className="p-7 rounded-[24px] bg-white border border-slate-200/60 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50 transition-all duration-400 h-full group">
                <div
                  className={`w-10 h-10 rounded-2xl ${s.accent} flex items-center justify-center mb-5 shadow-sm`}
                >
                  <span className="text-white text-[13px] font-black">
                    {s.num}
                  </span>
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  {s.role}
                </div>
                <h3 className="text-[16px] font-black text-slate-950 tracking-tight mb-3">
                  {s.title}
                </h3>
                <p className="text-slate-500 text-[13px] font-medium leading-relaxed">
                  {s.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// TESTIMONIALS
// ─────────────────────────────────────────────
function TestimonialsSection() {
  const { i18n } = useTranslation();
  const isFr = (i18n.resolvedLanguage || "fr").startsWith("fr");
  const testimonials = [
    {
      name: "Karim Benali",
      role: "CTO · TechNova",
      avatar: "K",
      quote:
        "En 48h nous avions 3 profils ultra-qualifiés. Notre ingénieur backend a été embauché en 6 jours.",
      stars: 5,
      tag: "Recruteur",
      color: "from-blue-600 to-blue-700",
    },
    {
      name: "Hind Mansouri",
      role: "Fullstack Dev · EMSI",
      avatar: "H",
      quote:
        "J'ai trouvé mon stage via MatchendIN. Le matching était parfait — ils cherchaient exactement React + Laravel.",
      stars: 5,
      tag: "Étudiant",
      color: "from-violet-600 to-violet-700",
    },
    {
      name: "Youssef Tazi",
      role: "Head of HR · DataSync",
      avatar: "Y",
      quote:
        "Nous avons réduit notre cycle de recrutement de 6 semaines à 10 jours. Le ROI est immédiat.",
      stars: 5,
      tag: "Recruteur",
      color: "from-slate-700 to-slate-800",
    },
    {
      name: "Meriam Farouk",
      role: "Dev Backend · ENSA Rabat",
      avatar: "M",
      quote:
        "La plateforme m'a recommandé des offres auxquelles je n'aurais jamais pensé postuler. Parfaitement adapté.",
      stars: 5,
      tag: "Étudiant",
      color: "from-emerald-600 to-emerald-700",
    },
    {
      name: "Anas Chraibi",
      role: "Founder · InnoWeb",
      avatar: "A",
      quote:
        "MatchendIN n'est pas un simple job board — c'est un vrai partenaire de recrutement. L'IA gère tout.",
      stars: 5,
      tag: "Recruteur",
      color: "from-blue-700 to-indigo-700",
    },
    {
      name: "Nadia El Ouali",
      role: "Frontend Lead · CloudNet",
      avatar: "N",
      quote:
        "Embauchée via MatchendIN il y a 8 mois. Aujourd'hui je recrute mes propres équipes via la même plateforme.",
      stars: 5,
      tag: "Alumni",
      color: "from-rose-600 to-rose-700",
    },
  ];

  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section id="testimonials" ref={ref} className="bg-white py-32">
      <div className="max-w-7xl mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8"
        >
          <div>
            <div className="text-blue-600 text-[11px] font-black uppercase tracking-[0.3em] mb-4">
              {isFr ? "Temoignages" : "Testimonials"}
            </div>
            <h2
              className="text-5xl md:text-6xl font-black text-slate-950 uppercase tracking-tighter leading-[0.9]"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {isFr ? "Ils nous font" : "Teams"}
              <br />
              <span className="text-blue-600">
                {isFr ? "confiance." : "trust us."}
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-blue-50 border border-blue-100">
            <div className="text-center">
              <div className="text-3xl font-black text-slate-950">4.9</div>
              <div className="flex gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <StarIcon
                    key={i}
                    size={12}
                    className="text-amber-400 fill-amber-400"
                  />
                ))}
              </div>
              <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase">
                {isFr ? "Note moyenne" : "Average rating"}
              </div>
            </div>
            <div className="w-px h-12 bg-blue-200" />
            <div className="text-center">
              <div className="text-3xl font-black text-slate-950">1.2k</div>
              <div className="text-[10px] text-slate-500 font-bold mt-1.5 uppercase">
                {isFr ? "Avis verifies" : "Verified reviews"}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="p-7 rounded-[24px] bg-white border border-slate-200/60 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100 transition-all duration-300 flex flex-col justify-between gap-6"
            >
              <div>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <StarIcon
                      key={j}
                      size={14}
                      className="text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>
                <p className="text-slate-700 text-[15px] font-medium leading-relaxed">
                  "{t.quote}"
                </p>
              </div>
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-black text-sm shadow-sm`}
                >
                  {t.avatar}
                </div>
                <div className="flex-1">
                  <div className="text-slate-900 text-[13px] font-black">
                    {t.name}
                  </div>
                  <div className="text-slate-400 text-[11px] font-bold uppercase tracking-tight">
                    {t.role}
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-black uppercase tracking-tight">
                  {t.tag}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// CTA
// ─────────────────────────────────────────────
function CTASection() {
  const { i18n } = useTranslation();
  const isFr = (i18n.resolvedLanguage || "fr").startsWith("fr");
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="bg-slate-50 py-32">
      <div className="max-w-7xl mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-[36px] overflow-hidden p-16 text-center"
          style={{
            background:
              "linear-gradient(145deg, #0f172a 0%, #1e3a5f 60%, #1e293b 100%)",
          }}
        >
          {/* Glows */}
          <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />
          {/* Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:36px_36px]" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-400/25 bg-blue-500/10 mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-blue-300 text-[11px] font-black uppercase tracking-widest">
                {isFr ? "Inscription gratuite" : "Free signup"}
              </span>
            </div>

            <h2
              className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.88] mb-6"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {isFr ? "Pret a recruter" : "Ready to hire"}
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #93c5fd 0%, #60a5fa 50%, #3b82f6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {isFr ? "autrement ?" : "differently?"}
              </span>
            </h2>

            <p className="text-slate-300/80 text-lg max-w-lg mx-auto font-medium leading-relaxed mb-12">
              {isFr
                ? "Rejoignez plus de 4 800 talents et 320 entreprises qui font confiance a MatchendIN."
                : "Join over 4,800 talents and 320 companies already trusting MatchendIN."}
            </p>

            <div className="flex gap-4 flex-wrap justify-center">
              <button
                className="h-[52px] px-10 bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-black uppercase tracking-tight rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-3"
                style={{ boxShadow: "0 0 60px rgba(59,130,246,0.5)" }}
              >
                {isFr ? "Je suis une entreprise" : "I am a company"}{" "}
                <ArrowRight01Icon size={17} />
              </button>
              <button className="h-[52px] px-10 bg-white/8 hover:bg-white/14 border border-white/15 text-white text-[13px] font-black uppercase tracking-tight rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-3 backdrop-blur-sm">
                {isFr ? "Je suis un etudiant" : "I am a student"}{" "}
                <ArrowRight01Icon size={17} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────
export default function Home() {
  return (
    <main className="bg-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400;1,700&family=Syne:wght@700;800;900&display=swap');
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
      `}</style>

      <HeroSection />
      <LogosSection />
      <StatsSection />
      <FeaturesSection />
      <ProcessSection />
      <TestimonialsSection />
      <CTASection />
    </main>
  );
}
