import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft01Icon } from 'hugeicons-react';
import { useTranslation } from 'react-i18next';
import { normalizeLocale } from '@/i18n/config';

export default function NotFound() {
    const { i18n } = useTranslation();
    const location = useLocation();
    const isFr = (i18n.resolvedLanguage || 'fr').startsWith('fr');
    const routeLocale = normalizeLocale(location.pathname.split('/').filter(Boolean)[0] || localStorage.getItem('preferred_language') || 'fr');
    return (
        <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-6 relative overflow-hidden selection:bg-blue-600/30">
            {/* Ambient glows */}
            <div className="absolute top-[10%] left-[20%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[10%] right-[20%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none" />



            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="text-center relative z-10 max-w-lg"
            >
                {/* Giant 404 */}
                <motion.h1
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="text-[12rem] md:text-[16rem] font-black italic uppercase leading-none tracking-tighter font-syne bg-gradient-to-b from-white/20 to-white/5 bg-clip-text text-transparent select-none"
                >
                    404
                </motion.h1>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-6 -mt-8"
                >
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter font-syne">
                        {isFr ? 'Page' : 'Page'} <span className="text-blue-500">{isFr ? 'Introuvable' : 'Not Found'}</span>
                    </h2>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] leading-relaxed max-w-sm mx-auto">
                        {isFr ? "La page que vous recherchez n'existe pas ou a ete deplacee." : 'The page you are looking for does not exist or has moved.'}
                    </p>
                </motion.div>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center mt-10"
                >
                    <Link to={`/${routeLocale}`}
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-[22px] font-black uppercase tracking-widest text-[11px] transition-all shadow-lg shadow-blue-500/20">
                        <ArrowLeft01Icon size={16} /> {isFr ? "Retour a l'accueil" : 'Back to home'}
                    </Link>
                    <Link to={`/${routeLocale}/dashboard`}
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-[22px] font-black uppercase tracking-widest text-[11px] transition-all">
                        {isFr ? 'Mon dashboard' : 'My dashboard'}
                    </Link>
                </motion.div>
            </motion.div>
        </div>
    );
}
