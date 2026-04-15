import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/axios";
import { useAuth } from "@/lib/auth";
import { z } from "zod";
import { normalizeLocale } from "@/i18n/config";
import { useTranslation } from "react-i18next";
import SkillSelector from "@/components/shared/SkillSelector";
import {
  UserIcon, Mail01Icon, ShieldKeyIcon,
  Globe02Icon, ArrowRight01Icon,
  CodeIcon, PresentationBarChart01Icon, CheckmarkCircle02Icon
} from "hugeicons-react";

type Step = 1 | 2 | 3 | 4;
type ProfileType = "IT" | "NON_IT" | null;

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const { locale } = useParams();
  const navigate = useNavigate();
  const activeLocale = normalizeLocale(locale);
  const role = searchParams.get("role") || "student";
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(`/${activeLocale}/dashboard`);
    }
  }, [isAuthenticated, authLoading, navigate, activeLocale]);

  const [step, setStep] = useState<Step>(1);
  const [profileType, setProfileType] = useState<ProfileType>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // The Master Data Object
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    country: "Morocco", // Defaulting to local timezone alignment
    work_mode: "Remote",
    salary_min: "",
    skill_ids: [] as { id: number, level: number }[],
    preferred_language: activeLocale,
    education_level: "",
  });

  const step1Schema = z.object({
    name: z.string().min(2, t("auth.validation.fullNameTooShort")),
    email: z.string().email(t("auth.validation.invalidEmail")),
    password: z.string().min(8, t("auth.validation.passwordMin")),
    password_confirmation: z.string().min(8, t("auth.validation.passwordMin")),
    country: z.string(),
  }).refine((data) => data.password === data.password_confirmation, {
    message: "Les mots de passe ne correspondent pas",
    path: ["password_confirmation"],
  });

  const next = () => {
    try {
      if (step === 1) step1Schema.parse(formData);
      // step 2 and 3 are structural/clicks, no need for heavy zod parsing unless needed
      setError("");
      setStep((s) => (s + 1) as Step);
    } catch (e: any) {
      if (e?.errors && e.errors.length > 0) {
        setError(e.errors[0].message);
      } else {
        setError(e.message || "Please fill all required fields correctly.");
      }
    }
  };

  const back = () => {
    setError("");
    setStep((s) => (s - 1) as Step);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.work_mode) {
      setError(t("auth.validation.selectWorkMode"));
      return;
    }

    setLoading(true);
    setError("");
    try {
      const payload = { ...formData, profile_type: profileType, role, preferred_language: formData.preferred_language };
      await api.post('/register', payload);
      localStorage.setItem('preferred_language', formData.preferred_language);
      navigate(`/${formData.preferred_language}/login`);
    } catch (err: any) {
      console.error("Registration failed", err);
      setError(err.response?.data?.message || t("auth.registrationFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-6 selection:bg-blue-600/30">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

        {/* Left Side: Visual Progress & Branding */}
        <div className="lg:col-span-5 hidden lg:block space-y-12 pr-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none font-syne">
              {role === 'enterprise' ? t("auth.recruit") : t("auth.join")} <br /> <span className="text-blue-600">{t("auth.elite")}</span> <br /> {t("auth.worldwide")}.
            </h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] leading-relaxed">
              {role === 'enterprise' ? t("auth.enterprisePlatform") : t("auth.talentPlatform")}
            </p>
          </div>

          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
            {[
              { num: 1, label: 'Identité' },
              { num: 2, label: 'Vocation' },
              { num: 3, label: 'Expertise' },
              { num: 4, label: t("auth.preferences") }
            ].map((item) => (
              <div key={item.num} className="relative flex items-center gap-6">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold border transition-all duration-500 z-10 bg-[#09090b] ${step >= item.num ? 'border-blue-600 text-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.2)]' : 'border-white/10 text-slate-600'}`}>
                  {step > item.num ? <CheckmarkCircle02Icon size={16} className="text-blue-600" /> : item.num}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${step >= item.num ? 'text-white' : 'text-slate-600'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Dynamic Form Content */}
        <div className="lg:col-span-7 bg-white/[0.02] border border-white/5 p-8 md:p-12 rounded-[40px] shadow-2xl backdrop-blur-3xl relative">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-3 rounded-[16px] text-xs font-bold uppercase tracking-wider mb-6 relative z-10"
                >
                  {error}
                </motion.div>
              )}

          <form onSubmit={step === 4 ? handleFinalSubmit : (e) => e.preventDefault()}>
            <AnimatePresence mode="wait">
              {/* STEP 1: Basic Info */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 relative z-10">
                  <header className="mb-8">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2 font-syne">Vos Informations</h2>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{t("auth.createSecureAccess")}</p>
                  </header>
                  <div className="space-y-4">
                    <InputGroup icon={<UserIcon size={20} />} name="name" placeholder="NOM COMPLET" value={formData.name} onChange={setFormData} />
                    <InputGroup icon={<Mail01Icon size={20} />} name="email" type="email" placeholder="ADRESSE EMAIL" value={formData.email} onChange={setFormData} />
                    <InputGroup icon={<ShieldKeyIcon size={20} />} name="password" type="password" placeholder="MOT DE PASSE" value={formData.password} onChange={setFormData} />
                    <InputGroup icon={<ShieldKeyIcon size={20} />} name="password_confirmation" type="password" placeholder="CONFIRMER LE MOT DE PASSE" value={formData.password_confirmation} onChange={setFormData} />

                    <div className="relative group">
                      <PresentationBarChart01Icon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                      <select
                        className="w-full pl-16 pr-6 py-5 bg-white/[0.03] border border-white/10 rounded-[24px] text-[11px] font-black tracking-widest text-white appearance-none focus:border-blue-600/50 outline-none uppercase"
                        value={formData.education_level}
                        onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
                      >
                        <option value="" disabled className="bg-slate-900">{t("auth.educationLevel")}</option>
                        <option value="Bac" className="bg-slate-900">BAC</option>
                        <option value="Bac+2" className="bg-slate-900">BAC+2</option>
                        <option value="Bac+3" className="bg-slate-900">BAC+3 (LICENCE)</option>
                        <option value="Bac+5" className="bg-slate-900">BAC+5 (MASTER/INGÉNIEUR)</option>
                        <option value="Doctorat" className="bg-slate-900">DOCTORAT</option>
                      </select>
                    </div>

                    <div className="relative group">
                      <Globe02Icon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                      <select
                        className="w-full pl-16 pr-6 py-5 bg-white/[0.03] border border-white/10 rounded-[24px] text-[11px] font-black tracking-widest text-white appearance-none focus:border-blue-600/50 outline-none uppercase"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      >
                        <option value="Morocco" className="bg-slate-900">MAROC</option>
                        <option value="France" className="bg-slate-900">FRANCE</option>
                        <option value="Canada" className="bg-slate-900">CANADA</option>
                        <option value="USA" className="bg-slate-900">ÉTATS-UNIS</option>
                      </select>
                    </div>

                    <div className="relative group">
                      <Globe02Icon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                      <select
                        className="w-full pl-16 pr-6 py-5 bg-white/[0.03] border border-white/10 rounded-[24px] text-[11px] font-black tracking-widest text-white appearance-none focus:border-blue-600/50 outline-none uppercase"
                        value={formData.preferred_language}
                        onChange={(e) => setFormData({ ...formData, preferred_language: normalizeLocale(e.target.value) })}
                      >
                        <option value="fr" className="bg-slate-900">LANGUE: FRANCAIS</option>
                        <option value="en" className="bg-slate-900">LANGUAGE: ENGLISH</option>
                      </select>
                    </div>
                  </div>
                  <button type="button" onClick={next} className="w-full py-5 bg-blue-600 hover:bg-blue-500 rounded-[22px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all mt-4">
                    {t("auth.continue")} <ArrowRight01Icon size={18} />
                  </button>
                </motion.div>
              )}

              {/* STEP 2: Profile Branching */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 relative z-10">
                  <header className="mb-8">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2 font-syne">{t("auth.yourDomain")}</h2>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{t("auth.personalizeExperience")}</p>
                  </header>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DomainCard
                      selected={profileType === "IT"}
                      onClick={() => { setProfileType("IT"); next(); }}
                      icon={<CodeIcon size={32} />}
                      title={t("auth.techProfile")}
                      desc="Développeurs, Data, DevOps, Infra..."
                    />
                    <DomainCard
                      selected={profileType === "NON_IT"}
                      onClick={() => { setProfileType("NON_IT"); next(); }}
                      icon={<PresentationBarChart01Icon size={32} />}
                      title={t("auth.businessProfile")}
                      desc="Marketing, RH, Sales, Design..."
                    />
                  </div>
                  <button type="button" onClick={back} className="w-full py-4 text-slate-500 hover:text-white transition-colors font-black uppercase text-[10px] tracking-widest">{t("auth.back")}</button>
                </motion.div>
              )}

              {/* STEP 3: Competencies */}
              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 relative z-10">
                  <header>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2 font-syne">
                      {profileType === "IT" ? t("auth.techStack") : t("auth.skills")}
                    </h2>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                      {t("auth.addMainTools")}
                    </p>
                  </header>

                  <SkillSelector
                    accentColor="blue"
                    allowDomainChange={false}
                    defaultProfileType={profileType}
                    onUpdate={(skills: { id: number, level: number }[]) => setFormData({ ...formData, skill_ids: skills })}
                  />

                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={back} className="flex-1 py-5 border border-white/10 hover:bg-white/5 transition-colors rounded-[22px] font-black uppercase text-[11px] tracking-widest">{t("auth.back")}</button>
                    <button type="button" onClick={next} className="flex-[2] py-5 bg-blue-600 hover:bg-blue-500 transition-colors rounded-[22px] font-black uppercase text-[11px] tracking-widest">{t("auth.nextStep")}</button>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Work Preferences */}
              {step === 4 && (
                <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 relative z-10">
                  <header>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2 font-syne">{t("auth.preferences")}</h2>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{t("auth.refineCriteria")}</p>
                  </header>

                  <div className="space-y-8">
                    {/* Work Mode Toggle */}
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2">{t("auth.workMode")}</label>
                      <div className="grid grid-cols-3 gap-2 bg-white/[0.03] p-2 rounded-[24px] border border-white/10">
                        {['Remote', 'Hybrid', 'On-site'].map((mode) => (
                          <button
                            type="button"
                            key={mode}
                            onClick={() => setFormData({ ...formData, work_mode: mode })}
                            className={`py-4 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${formData.work_mode === mode ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white'}`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>

                    <InputGroup icon={<Globe02Icon size={20} />} name="salary_min" type="number" placeholder="RÉMUNÉRATION MIN. SOUHAITÉE (USD)" value={formData.salary_min} onChange={setFormData} />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={back} className="flex-1 py-5 border border-white/10 hover:bg-white/5 transition-colors rounded-[22px] font-black uppercase text-[11px] tracking-widest">{t("auth.back")}</button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-[2] py-5 bg-blue-600 hover:bg-blue-500 transition-colors rounded-[22px] font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {loading ? t("auth.serverConnecting") : t("auth.finish")}
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </form>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// HELPER COMPONENTS (Keep at bottom of file)
// ==========================================

interface InputGroupProps {
  icon: React.ReactNode;
  name: string;
  placeholder: string;
  value: string;
  type?: string;
  onChange: React.Dispatch<React.SetStateAction<any>>;
}

function InputGroup({ icon, name, placeholder, value, type = "text", onChange }: InputGroupProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const currentType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="relative group">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
        {icon}
      </div>
      <input
        type={currentType}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange((prev: any) => ({ ...prev, [name]: e.target.value }))}
        className={`w-full pl-16 py-5 bg-white/[0.03] border border-white/10 rounded-[24px] text-[11px] font-black tracking-widest text-white focus:outline-none focus:border-blue-600/50 focus:bg-white/[0.07] transition-all placeholder:text-slate-600 uppercase ${isPassword ? "pr-14" : "pr-6"}`}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white focus:outline-none transition-colors"
        >
          {showPassword ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
              <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
              <line x1="2" y1="2" x2="22" y2="22" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

interface DomainCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
  selected: boolean;
}

function DomainCard({ icon, title, desc, onClick, selected }: DomainCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-8 rounded-[32px] border transition-all duration-500 text-left group relative overflow-hidden ${selected
        ? 'bg-blue-600 border-blue-600 shadow-2xl shadow-blue-600/20'
        : 'bg-white/[0.03] border-white/10 hover:border-blue-600/40 hover:bg-white/[0.05]'
        }`}
    >
      <div className={`mb-6 transition-transform duration-500 group-hover:scale-110 ${selected ? 'text-white' : 'text-blue-500'}`}>
        {icon}
      </div>
      <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2 font-syne">
        {title}
      </h3>
      <p className={`text-[10px] font-bold uppercase tracking-widest leading-relaxed ${selected ? 'text-blue-100' : 'text-slate-500'}`}>
        {desc}
      </p>
    </button>
  );
}