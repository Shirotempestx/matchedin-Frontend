import { Outlet, NavLink, Navigate, useLocation } from 'react-router-dom';
import { 
  DashboardSquare01Icon, 
  UserGroupIcon, 
  Briefcase02Icon, 
  Alert02Icon, 
  Logout01Icon,
  Settings01Icon
} from 'hugeicons-react';
import { useAuth } from '@/lib/auth';
import { normalizeLocale } from '@/i18n/config';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import ThemeToggle from '@/components/ThemeToggle';

const AdminLayout = () => {
    const { user, isLoading, logout } = useAuth();
    const location = useLocation();
    const { i18n } = useTranslation();
    const locale = normalizeLocale(location.pathname.split('/').filter(Boolean)[0] || i18n.language);
    const withLocale = (path: string) => `/${locale}${path}`;

    const { data: pendingOfferNotifs } = useQuery<{ data: Array<{ id: number }> }>({
        queryKey: ['admin-notif-pending-offers'],
        queryFn: async () => {
            const res = await api.get('/notifications', { params: { type: 'pending_offer', is_read: '0', limit: 50 } });
            return res.data;
        },
        enabled: !!user && user.role.toLowerCase() === 'admin',
        refetchInterval: 30000,
    });

    const { data: pendingEnterpriseNotifs } = useQuery<{ data: Array<{ id: number }> }>({
        queryKey: ['admin-notif-pending-enterprise'],
        queryFn: async () => {
            const res = await api.get('/notifications', { params: { type: 'pending_enterprise', is_read: '0', limit: 50 } });
            return res.data;
        },
        enabled: !!user && user.role.toLowerCase() === 'admin',
        refetchInterval: 30000,
    });

    const { data: pendingReportsNotifs } = useQuery<{ data: Array<{ id: number }> }>({
        queryKey: ['admin-notif-reports'],
        queryFn: async () => {
            const res = await api.get('/notifications', { params: { type: 'report_created', is_read: '0', limit: 50 } });
            return res.data;
        },
        enabled: !!user && user.role.toLowerCase() === 'admin',
        refetchInterval: 30000,
    });

    const pendingOfferCount = pendingOfferNotifs?.data?.length ?? 0;
    const pendingEnterpriseCount = pendingEnterpriseNotifs?.data?.length ?? 0;
    const pendingReportsCount = pendingReportsNotifs?.data?.length ?? 0;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!user || user.role.toLowerCase() !== 'admin') {
        return <Navigate to={withLocale('/dashboard')} replace />;
    }

    return (
        <div className="min-h-screen bg-[#09090b] text-white flex overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-[#09090b] border-r border-white/5 flex flex-col justify-between fixed h-full z-20">
                <div>
                    <div className="p-8 flex items-center gap-3">
                        <img src="/Logo.svg" alt="MatchedIn" className="h-8 w-8 rounded-xl object-contain drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                        <span className="text-white font-black text-xl tracking-tighter italic uppercase font-syne">Admin</span>
                    </div>
                    <nav className="mt-4 flex flex-col gap-2 px-4">
                        <NavLink to={withLocale('/admin')} end className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-xs font-bold uppercase tracking-widest ${isActive ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'text-slate-500 hover:text-white hover:bg-white/[0.03]'}`}>
                            <DashboardSquare01Icon size={18} /> Dashboard
                        </NavLink>
                        <NavLink to={withLocale('/admin/users')} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-xs font-bold uppercase tracking-widest ${isActive ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'text-slate-500 hover:text-white hover:bg-white/[0.03]'}`}>
                            <UserGroupIcon size={18} /> {locale === 'fr' ? 'Utilisateurs' : 'Users'}
                        </NavLink>
                        <NavLink to={withLocale('/admin/offres')} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-xs font-bold uppercase tracking-widest ${isActive ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'text-slate-500 hover:text-white hover:bg-white/[0.03]'}`}>
                            <Briefcase02Icon size={18} /> {locale === 'fr' ? 'Opportunites' : 'Opportunities'}
                            {pendingOfferCount > 0 && <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">{pendingOfferCount}</span>}
                        </NavLink>
                        <NavLink to={withLocale('/admin/reports')} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-xs font-bold uppercase tracking-widest ${isActive ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'text-slate-500 hover:text-white hover:bg-white/[0.03]'}`}>
                            <Alert02Icon size={18} /> {locale === 'fr' ? 'Signalements' : 'Reports'}
                            {pendingReportsCount > 0 && <span className="ml-auto px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px]">{pendingReportsCount}</span>}
                        </NavLink>
                        <NavLink to={withLocale('/admin/requests')} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-xs font-bold uppercase tracking-widest ${isActive ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'text-slate-500 hover:text-white hover:bg-white/[0.03]'}`}>
                            <UserGroupIcon size={18} /> {locale === 'fr' ? 'Demandes Entreprises' : 'Company Requests'}
                            {pendingEnterpriseCount > 0 && <span className="ml-auto px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px]">{pendingEnterpriseCount}</span>}
                        </NavLink>
                        <NavLink to={withLocale('/admin/settings')} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-xs font-bold uppercase tracking-widest ${isActive ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'text-slate-500 hover:text-white hover:bg-white/[0.03]'}`}>
                            <Settings01Icon size={18} /> {locale === 'fr' ? 'Referentiels' : 'References'}
                        </NavLink>
                    </nav>
                </div>
                <div className="p-4 border-t border-white/5">
                    <div className="mb-3">
                        <ThemeToggle />
                    </div>
                    <button onClick={logout} className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 hover:border-red-500/20 border border-transparent w-full rounded-2xl transition-all text-xs font-bold uppercase tracking-widest">
                        <Logout01Icon size={18} /> {locale === 'fr' ? 'Deconnexion' : 'Log out'}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 flex-1 p-8 overflow-y-auto w-full relative h-screen">
                <div className="max-w-7xl mx-auto relative z-10">
                    <Outlet />
                </div>
                {/* Background Effects */}
                <div className="fixed top-[20%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
                <div className="fixed bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none z-0" />
            </main>
        </div>
    );
};

export default AdminLayout;
