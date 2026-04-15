import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../lib/axios";
import type { AuthResponse, LaravelValidationErrors } from "@/type/auth";
import { 
  ShieldKeyIcon, Mail01Icon, UserIcon, 
  Cancel01Icon, ArrowRight01Icon 
} from "hugeicons-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}


export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<LaravelValidationErrors>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Sanctum CSRF Initialization
      await api.get('/sanctum/csrf-cookie');

      const endpoint = isLogin ? "/login" : "/register";
      const { data } = await api.post<AuthResponse>(endpoint, formData);

      console.log("Success:", data.message);
      // Redirect or update global auth context here
      window.location.href = "/dashboard";
      
    } catch (err: any) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors as LaravelValidationErrors);
      } else {
        console.error("Auth Error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden p-10 border border-slate-200"
          >
            <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-slate-950 transition-colors">
              <Cancel01Icon size={24} />
            </button>

            <div className="mb-10 text-left">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-200">
                <ShieldKeyIcon size={28} />
              </div>
              <h2 className="text-3xl font-black text-slate-950 uppercase italic tracking-tighter leading-none mb-2 font-syne">
                {isLogin ? "Connexion" : "Inscription"}
              </h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                {isLogin ? "Accès sécurisé" : "Rejoignez l'écosystème"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1">
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      name="name" type="text" placeholder="NOM COMPLET"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[20px] text-[11px] font-black tracking-widest focus:outline-none focus:border-blue-600 transition-all"
                      onChange={handleInputChange}
                    />
                  </div>
                  {errors.name && <span className="text-[10px] text-red-500 font-black px-2">{errors.name[0]}</span>}
                </div>
              )}

              <div className="space-y-1">
                <div className="relative">
                  <Mail01Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    name="email" type="email" placeholder="EMAIL"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[20px] text-[11px] font-black tracking-widest focus:outline-none focus:border-blue-600 transition-all"
                    onChange={handleInputChange}
                  />
                </div>
                {errors.email && <span className="text-[10px] text-red-500 font-black px-2">{errors.email[0]}</span>}
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <ShieldKeyIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    name="password" type="password" placeholder="MOT DE PASSE"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[20px] text-[11px] font-black tracking-widest focus:outline-none focus:border-blue-600 transition-all"
                    onChange={handleInputChange}
                  />
                </div>
                {errors.password && <span className="text-[10px] text-red-500 font-black px-2">{errors.password[0]}</span>}
              </div>

              {!isLogin && (
                <div className="relative">
                  <ShieldKeyIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    name="password_confirmation" type="password" placeholder="CONFIRMER"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[20px] text-[11px] font-black tracking-widest focus:outline-none focus:border-blue-600 transition-all"
                    onChange={handleInputChange}
                  />
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full py-4 bg-blue-600 text-white text-[12px] font-black uppercase tracking-[0.2em] rounded-[20px] shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {loading ? "Chargement..." : isLogin ? "Se Connecter" : "S'inscrire"}
                <ArrowRight01Icon size={18} />
              </button>
            </form>

            <button 
              onClick={() => { setIsLogin(!isLogin); setErrors({}); }}
              className="mt-8 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-blue-600 transition-colors w-full text-center"
            >
              {isLogin ? "Créer un nouveau compte" : "Déjà membre ? Connexion"}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}