import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion"
import { ArrowRight01Icon } from "hugeicons-react";
import { useAuth } from "@/lib/auth";
import { Alert02Icon, Logout01Icon, UserIcon, CrownIcon, FavouriteIcon , Message01Icon } from "hugeicons-react";
import { useTranslation } from "react-i18next";
import { normalizeLocale } from "@/i18n/config";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import ThemeToggle from "@/components/ThemeToggle";
import { Menu, X } from "lucide-react";
import { useNotifications } from "@/lib/notifications";

type NavbarNotification = {
  id: string
  title: string
  body: string
  action_url?: string | null
  read_at?: string | null
}

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { unreadCount, markAsRead } = useNotifications();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const locale = normalizeLocale(location.pathname.split('/').filter(Boolean)[0] || i18n.language);
  const withLocale = (path: string) => `/${locale}${path}`;
  const isLandingPage = location.pathname === `/${locale}` || location.pathname === `/${locale}/`;
  const isActivePath = (path: string) => {
    const fullPath = withLocale(path);
    return location.pathname === fullPath || location.pathname.startsWith(`${fullPath}/`);
  };

  const navLinkClass = (path: string) => `px-2.5 xl:px-3 py-2 rounded-xl text-[10px] xl:text-[11px] font-black uppercase tracking-wide xl:tracking-[0.14em] whitespace-nowrap transition-all ${isActivePath(path)
    ? 'text-white bg-white/10 border border-white/10'
    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
    }`;

  const enterpriseLinks = [
    { path: '/dashboard', label: t('nav.dashboard') },
    ...(user?.status === 'active' ? [{ path: '/offres/create', label: t('nav.createOffer') }] : []),
    { path: '/explore-candidates', label: t('nav.candidates') },
    { path: '/explore-students', label: t('nav.exploreStudents') },
    { path: '/messages', label: 'Messages' },
  ];

  const studentLinks = [
    { path: '/dashboard', label: t('nav.dashboard') },
    { path: '/offres', label: t('nav.opportunities') },
    { path: '/my-applications', label: t('nav.myApplications') },
    { path: '/messages', label: 'Messages' },
  ];

  const authLinks = user?.role === 'enterprise' ? enterpriseLinks : studentLinks;

  const { data: recentData } = useQuery<{ data: NavbarNotification[] }>({
    queryKey: ['notifications-recent'],
    queryFn: async () => {
      const res = await api.get('/notifications', { params: { limit: 5 } });
      return res.data;
    },
    enabled: isAuthenticated && notificationsOpen,
    staleTime: 15000,
  });

  const recentNotifications = recentData?.data ?? [];

  const handleLanguageChange = (nextLocale: string) => {
    const currentPath = location.pathname || '/';
    const parts = currentPath.split('/').filter(Boolean);
    const hasLocale = parts.length > 0 && (parts[0] === 'fr' || parts[0] === 'en');
    const suffix = hasLocale ? `/${parts.slice(1).join('/')}` : currentPath;
    const nextPath = `/${nextLocale}${suffix === '/' ? '' : suffix}`;
    localStorage.setItem('preferred_language', nextLocale);
    void i18n.changeLanguage(nextLocale);
    navigate(nextPath, { replace: true });
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-[999] transition-all duration-500 ${scrolled ? 'bg-[#09090b]/95 backdrop-blur-xl border-b border-white/5 shadow-2xl' : 'bg-transparent'
        }`}
    >
      {isAuthenticated && user?.role === 'enterprise' && user?.status !== 'active' && (
        <div className="bg-red-500/10 border-b border-red-500/20 py-1.5 flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-red-400">
            {locale === 'fr'
              ? "Compte en cours d'approbation par l'administrateur"
              : "Account pending admin approval"}
          </span>
        </div>
      )}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 xl:px-8 h-20 flex items-center gap-4 xl:gap-6">
        {/* Logo */}
        <Link to={withLocale('/')} className="shrink-0 text-slate-400 flex items-center gap-3 hover:text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all">
          <img src="/Logo.svg" alt="MatchedIn" className="h-9 w-9 rounded-xl object-contain" />
          <span className="hidden md:block text-white font-black text-xl tracking-tighter italic uppercase">MatchedIn</span>
        </Link>

        {/* Nav Links */}
        <div className="hidden min-[1240px]:flex items-center justify-center gap-2 xl:gap-3 flex-1 min-w-0">
          {isAuthenticated ? (
            <>
              {authLinks.map((link) => (
                <Link key={link.path} to={withLocale(link.path)} className={navLinkClass(link.path)}>{link.label}</Link>
              ))}
            </>
          ) : (
            [t('nav.features'), t('nav.pricing'), t('nav.about')].map((item) => (
              <a key={item} href="#" className="text-slate-400 hover:text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all">
                {item}
              </a>
            ))
          )}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-2 xl:gap-3 shrink-0 ml-auto">
          {!isAuthenticated && isLandingPage && (
            <div className="hidden md:flex items-center">
              <label className="sr-only">{t('common.language')}</label>
              <select
                value={locale}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="h-10 px-3 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-[11px] font-bold uppercase tracking-tight"
              >
                <option value="fr">{t('common.french')}</option>
                <option value="en">{t('common.english')}</option>
              </select>
            </div>
          )}
          {isAuthenticated ? (
            <>
              <button
                onClick={() => setMobileMenuOpen(v => !v)}
                className="min-[1240px]:hidden h-10 w-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white flex items-center justify-center transition-all"
                aria-label={mobileMenuOpen ? (locale === 'fr' ? 'Fermer le menu' : 'Close menu') : (locale === 'fr' ? 'Ouvrir le menu' : 'Open menu')}
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>

              <ThemeToggle />

              {/* Messages icon */}
              <Link
                to={withLocale('/messages')}
                className="relative h-10 w-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-emerald-400/40 text-slate-200 hover:text-white flex items-center justify-center transition-all"
                aria-label={locale === 'fr' ? 'Messages' : 'Messages'}
                title="Messages"
              >
                <Message01Icon size={16} />
              </Link>

              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(v => !v)}
                  className="relative h-10 w-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-blue-400/40 text-slate-200 hover:text-white flex items-center justify-center transition-all"
                  aria-label={locale === 'fr' ? 'Ouvrir les notifications' : 'Open notifications'}
                  title={locale === 'fr' ? 'Notifications' : 'Notifications'}
                >
                  <Alert02Icon size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-[300px] md:w-[360px] rounded-2xl border border-white/10 bg-[#0f1014] shadow-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                      <p className="text-[11px] font-black uppercase tracking-widest text-slate-200">
                        {locale === 'fr' ? 'Notifications' : 'Notifications'}
                      </p>
                      <Link
                        to={withLocale('/notifications')}
                        onClick={() => setNotificationsOpen(false)}
                        className="text-[11px] font-bold text-blue-300 hover:text-blue-200"
                      >
                        {locale === 'fr' ? 'Voir tout' : 'View all'}
                      </Link>
                    </div>

                    <div className="max-h-[320px] overflow-y-auto">
                      {recentNotifications.length === 0 && (
                        <div className="px-4 py-6 text-[12px] text-slate-400">
                          {locale === 'fr' ? 'Aucune notification recente.' : 'No recent notifications.'}
                        </div>
                      )}
                      {recentNotifications.map((item) => (
                        <div key={item.id} className={`px-4 py-3 border-b border-white/5 ${item.read_at ? 'bg-transparent' : 'bg-blue-500/5'}`}>
                          <p className="text-[12px] font-bold text-white line-clamp-1">{item.title}</p>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{item.body}</p>
                          <div className="mt-2 flex items-center gap-3">
                            {!item.read_at && (
                              <button onClick={() => { void markAsRead([item.id]); }} className="text-[11px] text-emerald-300 hover:text-emerald-200">
                                {locale === 'fr' ? 'Marquer lu' : 'Mark read'}
                              </button>
                            )}
                            {item.action_url && (
                              <Link
                                to={withLocale(item.action_url)}
                                onClick={() => setNotificationsOpen(false)}
                                className="text-[11px] text-blue-300 hover:text-blue-200"
                              >
                                {locale === 'fr' ? 'Ouvrir' : 'Open'}
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {!user?.subscription_tier && (
                <Link to={withLocale('/pricing')} className="relative h-10 px-3 md:px-4 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 flex items-center justify-center gap-2 transition-all group shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                    <CrownIcon size={16} className="group-hover:scale-110 transition-transform" />
                    <span className="hidden xl:block text-[11px] font-black uppercase tracking-wider">{locale === 'fr' ? 'Passer Premium' : 'Go Premium'}</span>
                </Link>
              )}

              <div className="relative group">
                <Link
                  to={user?.role === 'enterprise' || user?.role === 'Entreprise' ? withLocale('/enterprise-profile') : withLocale('/profile')}
                  className="text-white bg-white/10 hover:bg-white/20 px-3 md:px-4 py-2 rounded-xl text-[12px] font-bold uppercase tracking-tight transition-colors flex items-center gap-2 max-w-[170px] border border-white/10"
                >
                  <UserIcon size={16} className="shrink-0" />
                  <span className="truncate hidden sm:block">{user?.name}</span>
                </Link>

                <div className="absolute right-0 top-full pt-2 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 transition-all duration-150 z-50">
                  <div className="w-52 rounded-xl border border-white/10 bg-[#0f1014] shadow-2xl p-2 flex flex-col gap-1">
                    <button
                      onClick={logout}
                      className="w-full h-10 px-3 rounded-lg text-left border border-transparent hover:border-red-500/40 hover:bg-red-500/10 text-slate-300 hover:text-red-300 text-[12px] font-black uppercase tracking-tight transition-all flex items-center gap-2"
                    >
                      <Logout01Icon size={14} className="shrink-0" />
                      <span>{t('nav.logout')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to={withLocale('/login')} className="text-slate-400 hover:text-white text-[13px] font-bold uppercase tracking-tight transition-colors hidden md:block">
                {t('nav.login')}
              </Link>
              <Link to={withLocale('/select-role?action=register')} className="h-10 px-5 bg-blue-600 hover:bg-blue-500 text-white text-[12px] font-black uppercase tracking-tight rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2">
                {t('nav.start')} <ArrowRight01Icon size={14} />
              </Link>
            </>
          )}
        </div>
      </div>

      {isAuthenticated && mobileMenuOpen && (
        <div className="min-[1240px]:hidden border-t border-white/10 bg-[#09090b]/95 backdrop-blur-xl">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {authLinks.map((link) => (
                <Link
                  key={`mobile-${link.path}`}
                  to={withLocale(link.path)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-3 rounded-xl text-[11px] font-black uppercase tracking-wide border transition-all ${isActivePath(link.path)
                    ? 'text-white bg-white/10 border-white/20'
                    : 'text-slate-300 bg-white/5 border-white/10 hover:text-white hover:bg-white/10'
                    }`}
                >
                  {link.label}
                </Link>
              ))}

              {!user?.subscription_tier && (
                <Link
                  to={withLocale('/pricing')}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-3 rounded-xl text-[11px] font-black uppercase tracking-wide border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-all"
                >
                  {locale === 'fr' ? 'Passer Premium' : 'Go Premium'}
                </Link>
              )}

              <button
                onClick={() => { setMobileMenuOpen(false); void logout(); }}
                className="px-3 py-3 rounded-xl text-[11px] font-black uppercase tracking-wide border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-all text-left"
              >
                {t('nav.logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.nav>
  );
}
