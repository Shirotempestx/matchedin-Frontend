import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { UserIcon, Building04Icon, ArrowLeft01Icon } from "hugeicons-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { normalizeLocale } from "@/i18n/config";
import { useTranslation } from "react-i18next";

export default function SelectRole() {
    const [searchParams] = useSearchParams();
    const { locale } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const activeLocale = normalizeLocale(locale);
    const { isAuthenticated, isLoading } = useAuth();
    const action = searchParams.get("action") || "register"; // "login" or "register"

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            navigate(`/${activeLocale}/dashboard`);
        }
    }, [isAuthenticated, isLoading, navigate, activeLocale]);

    const handleSelect = (role: "student" | "enterprise") => {
        if (action === "login") {
            navigate(`/${activeLocale}/login`);
        } else {
            if (role === "enterprise") {
                navigate(`/${activeLocale}/register-enterprise`);
            } else {
                navigate(`/${activeLocale}/register?role=${role}`);
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-6">
            <div className="max-w-4xl w-full">
                <button
                    onClick={() => navigate(`/${activeLocale}`)}
                    className="mb-8 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
                >
                    <ArrowLeft01Icon size={16} /> {t("auth.backToHome")}
                </button>

                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-5xl font-black italic uppercase tracking-tighter font-syne">
                        {action === "login" ? t("auth.loginTitle") : t("auth.registerTitle")}
                    </h1>
                    <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.3em]">
                        {t("auth.selectRoleSubtitle")}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mx-auto">
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => handleSelect("student")}
                        className="p-10 rounded-[32px] bg-white/[0.02] border border-white/5 hover:border-blue-500/50 hover:bg-white/[0.05] transition-all text-left group"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center mb-8 group-hover:bg-blue-600 transition-colors">
                            <UserIcon size={32} className="text-blue-500 group-hover:text-white transition-colors" />
                        </div>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-3 font-syne">{t("auth.studentRoleTitle")}</h2>
                        <p className="text-slate-500 text-xs font-medium leading-relaxed">
                            {t("auth.studentRoleDesc")}
                        </p>
                    </motion.button>

                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => handleSelect("enterprise")}
                        className="p-10 rounded-[32px] bg-white/[0.02] border border-white/5 hover:border-emerald-500/50 hover:bg-white/[0.05] transition-all text-left group"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-emerald-600/10 flex items-center justify-center mb-8 group-hover:bg-emerald-600 transition-colors">
                            <Building04Icon size={32} className="text-emerald-500 group-hover:text-white transition-colors" />
                        </div>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-3 font-syne">{t("auth.enterpriseRoleTitle")}</h2>
                        <p className="text-slate-500 text-xs font-medium leading-relaxed">
                            {t("auth.enterpriseRoleDesc")}
                        </p>
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
