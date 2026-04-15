import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/lib/axios";
import { useAuth } from "@/lib/auth";
import { z } from "zod";
import { normalizeLocale } from "@/i18n/config";
import { useTranslation } from "react-i18next";
import {
    Building04Icon, UserIcon, Mail01Icon, ShieldKeyIcon,
    GlobalIcon, Tag01Icon, UserGroupIcon, ArrowRight01Icon,
    CheckmarkCircle02Icon
} from "hugeicons-react";

type Step = 1 | 2;

export default function RegisterEnterprise() {
    const { locale } = useParams();
    const activeLocale = normalizeLocale(locale);
    const { t } = useTranslation();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            navigate(`/${activeLocale}/dashboard`);
        }
    }, [isAuthenticated, authLoading, navigate, activeLocale]);

    const [step, setStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        company_name: "",
        industry: "",
        company_size: "1-10",
        website: "",
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        role: "enterprise",
        preferred_language: activeLocale,
    });

    const step1Schema = z.object({
        company_name: z.string().min(2, t("auth.validation.companyNameTooShort")),
        industry: z.string().min(2, t("auth.validation.industryRequired")),
        website: z.string().url(t("auth.validation.websiteInvalid")).or(z.literal('')),
        company_size: z.string(),
    });

    const step2Schema = z.object({
        name: z.string().min(2, t("auth.validation.nameTooShort")),
        email: z.string().email(t("auth.validation.invalidEmail")),
        password: z.string().min(8, t("auth.validation.passwordMin")),
        password_confirmation: z.string().min(8, t("auth.validation.passwordMin")),
    }).refine((data) => data.password === data.password_confirmation, {
        message: "Les mots de passe ne correspondent pas",
        path: ["password_confirmation"],
    });

    const next = () => {
        try {
            if (step === 1) step1Schema.parse(formData);
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
        try {
            step2Schema.parse(formData);
        } catch (e: any) {
            if (e?.errors && e.errors.length > 0) {
                setError(e.errors[0].message);
            } else {
                setError(e.message || "Please fill all required fields correctly.");
            }
            return;
        }

        setLoading(true);
        setError("");
        try {
            await api.post('/register', formData);
            localStorage.setItem('preferred_language', formData.preferred_language);
            navigate(`/${formData.preferred_language}/login`);
        } catch (err: any) {
            console.error("Enterprise Registration failed", err);
            setError(err.response?.data?.message || t("auth.registrationFailed"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-6 selection:bg-emerald-600/30">
            <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

                {/* Left Side: Visual Progress & Branding */}
                <div className="lg:col-span-5 hidden lg:block space-y-12 pr-8">
                    <div className="space-y-4">
                        <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none font-syne">
                            {t("auth.recruit")} <br /> <span className="text-emerald-500">{t("auth.elite")}</span> <br /> {t("auth.worldwide")}.
                        </h1>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] leading-relaxed">
                            {t("auth.enterprisePlatform")}
                        </p>
                    </div>

                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                        {[
                            { num: 1, label: t("auth.enterprise") },
                            { num: 2, label: t("auth.recruiterAccount") }
                        ].map((item) => (
                            <div key={item.num} className="relative flex items-center gap-6">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold border transition-all duration-500 z-10 bg-[#09090b] ${step >= item.num ? 'border-emerald-500 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-white/10 text-slate-600'}`}>
                                    {step > item.num ? <CheckmarkCircle02Icon size={16} className="text-emerald-500" /> : item.num}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${step >= item.num ? 'text-white' : 'text-slate-600'}`}>
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Dynamic Form Content */}
                <div className="lg:col-span-7 bg-white/[0.02] border border-white/5 p-8 md:p-12 rounded-[40px] shadow-2xl backdrop-blur-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 rounded-full blur-[100px] pointer-events-none" />

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-3 rounded-[16px] text-xs font-bold uppercase tracking-wider mb-6 relative z-10"
                            >
                                {error}
                            </motion.div>
                        )}

                    <form onSubmit={step === 2 ? handleFinalSubmit : (e) => e.preventDefault()}>
                        <AnimatePresence mode="wait">
                            {/* STEP 1: Company Info */}
                            {step === 1 && (
                                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 relative z-10">
                                    <header className="mb-8">
                                        <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2 font-syne">{t("auth.enterpriseSectionTitle")}</h2>
                                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{t("auth.enterpriseInfo")}</p>
                                    </header>
                                    <div className="space-y-4">
                                        <InputGroup icon={<Building04Icon size={20} />} name="company_name" placeholder={t("auth.companyNamePlaceholder")} value={formData.company_name} onChange={setFormData} />
                                        <InputGroup icon={<Tag01Icon size={20} />} name="industry" placeholder={t("auth.industryPlaceholder")} value={formData.industry} onChange={setFormData} />
                                        <InputGroup icon={<GlobalIcon size={20} />} name="website" placeholder={t("auth.websitePlaceholder")} value={formData.website} onChange={setFormData} />

                                        <div className="relative group">
                                            <UserGroupIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
                                            <select
                                                className="w-full pl-16 pr-6 py-5 bg-white/[0.03] border border-white/10 rounded-[24px] text-[11px] font-black tracking-widest text-white appearance-none focus:border-emerald-500/50 outline-none uppercase"
                                                value={formData.company_size}
                                                onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
                                            >
                                                <option value="1-10" className="bg-slate-900">{t("auth.companySizeOption1")}</option>
                                                <option value="11-50" className="bg-slate-900">{t("auth.companySizeOption2")}</option>
                                                <option value="51-200" className="bg-slate-900">{t("auth.companySizeOption3")}</option>
                                                <option value="201-500" className="bg-slate-900">{t("auth.companySizeOption4")}</option>
                                                <option value="500+" className="bg-slate-900">{t("auth.companySizeOption5")}</option>
                                            </select>
                                        </div>

                                        <div className="relative group">
                                            <GlobalIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
                                            <select
                                                className="w-full pl-16 pr-6 py-5 bg-white/[0.03] border border-white/10 rounded-[24px] text-[11px] font-black tracking-widest text-white appearance-none focus:border-emerald-500/50 outline-none uppercase"
                                                value={formData.preferred_language}
                                                onChange={(e) => setFormData({ ...formData, preferred_language: normalizeLocale(e.target.value) })}
                                            >
                                                <option value="fr" className="bg-slate-900">{t("auth.languageOptionFrench")}</option>
                                                <option value="en" className="bg-slate-900">{t("auth.languageOptionEnglish")}</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button type="button" onClick={next} className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 rounded-[22px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all mt-4">
                                        {t("auth.continue")} <ArrowRight01Icon size={18} />
                                    </button>
                                </motion.div>
                            )}

                            {/* STEP 2: Recruiter Info */}
                            {step === 2 && (
                                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 relative z-10">
                                    <header className="mb-8">
                                        <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2 font-syne">{t("auth.recruiter")}</h2>
                                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{t("auth.createPersonalAccess")}</p>
                                    </header>
                                    <div className="space-y-4">
                                        <InputGroup icon={<UserIcon size={20} />} name="name" placeholder={t("auth.fullNamePlaceholder")} value={formData.name} onChange={setFormData} />
                                        <InputGroup icon={<Mail01Icon size={20} />} name="email" type="email" placeholder={t("auth.businessEmailPlaceholder")} value={formData.email} onChange={setFormData} />
                                        <InputGroup icon={<ShieldKeyIcon size={20} />} name="password" type="password" placeholder={t("auth.passwordPlaceholder")} value={formData.password} onChange={setFormData} />
                                        <InputGroup icon={<ShieldKeyIcon size={20} />} name="password_confirmation" type="password" placeholder="CONFIRMER LE MOT DE PASSE" value={formData.password_confirmation} onChange={setFormData} />
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button type="button" onClick={back} className="flex-1 py-5 border border-white/10 hover:bg-white/5 transition-colors rounded-[22px] font-black uppercase text-[11px] tracking-widest">{t("auth.back")}</button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-[2] py-5 bg-emerald-600 hover:bg-emerald-500 transition-colors rounded-[22px] font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {loading ? t("auth.creating") : t("auth.finish")}
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
// HELPER COMPONENTS
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
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                {icon}
            </div>
            <input
                type={currentType}
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange((prev: any) => ({ ...prev, [name]: e.target.value }))}
                className={`w-full pl-16 py-5 bg-white/[0.03] border border-white/10 rounded-[24px] text-[11px] font-black tracking-widest text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.07] transition-all placeholder:text-slate-600 uppercase ${isPassword ? "pr-14" : "pr-6"}`}
                required
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
