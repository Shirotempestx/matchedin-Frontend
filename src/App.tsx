import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom"
import { useEffect } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider, useAuth } from "./lib/auth"
import i18n, { DEFAULT_LOCALE, normalizeLocale, SUPPORTED_LOCALES } from "./i18n/config"
import Home from "./pages/home"
import Dashboard from "./pages/dashboard"
import Navbar from "./layout/navbar"
import Footer from "./layout/footer"
import RegisterFlow from "./pages/auth/register"

import RegisterEnterprise from "./pages/auth/register-enterprise"
import SelectRole from "./pages/auth/select-role"
import Login from "./pages/auth/login"
import CreateOffre from "./pages/offres/CreateOffre"
import EditOffre from "./pages/offres/EditOffre"
import ExploreOffres from "./pages/offres/ExploreOffres"
import OffreDetail from "./pages/offres/OffreDetail"
import MyApplications from "./pages/offres/MyApplications"
import NotificationsPage from "./pages/notifications"
import ExploreCandidates from "./pages/explore/ExploreCandidates"
import ExploreStudents from "./pages/explore/ExploreStudents"
import FavoritesPage from "./pages/dashboard/FavoritesPage"
import NotFound from "./pages/NotFound"
import GlobalChatbot from "./components/GlobalChatbot"
import StudentProfilePage from "./pages/student-profile"
import EnterpriseProfilePage from "./pages/enterprise-profile"
import PricingPage from "./pages/PricingPage"
import ChatPage from "./pages/chat/ChatPage"
import { AlertProvider } from "./components/alerts/AlertProvider"
import { NotificationProvider } from "./lib/notifications"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

import AdminLayout from "./features/admin/AdminLayout"
import AdminDashboard from "./features/admin/AdminDashboard"
import AdminUsersTable from "./features/admin/AdminUsersTable"
import AdminOffresTable from "./features/admin/AdminOffresTable"
import AdminReportsTable from "./features/admin/AdminReportsTable"
import AdminSettings from "./features/admin/AdminSettings"
import AdminEnterpriseRequests from "./features/admin/AdminEnterpriseRequests"

const PublicLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <Navbar />
    {children}
              <GlobalChatbot />
    <Footer />
  </>
)

function LocalePathGuard() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const path = location.pathname || "/"
    const parts = path.split("/").filter(Boolean)
    const first = parts[0]
    const isKnown = (SUPPORTED_LOCALES as readonly string[]).includes(first)
    if (isKnown) return

    const preferred = normalizeLocale(localStorage.getItem("preferred_language") || i18n.language)
    const destination = `/${preferred}${path === "/" ? "" : path}`
    navigate(destination, { replace: true })
  }, [location.pathname, navigate])

  return null
}

function LocaleSync() {
  const params = useParams()

  useEffect(() => {
    const routeLocale = normalizeLocale(params.locale)
    const current = normalizeLocale(i18n.language)

    if (current !== routeLocale) {
      void i18n.changeLanguage(routeLocale)
    }

    localStorage.setItem("preferred_language", routeLocale)
    document.documentElement.lang = routeLocale
  }, [params.locale])

  return null
}

function HomeEntry() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (isAuthenticated) {
    return <Navigate to="dashboard" replace />
  }

  return <Home />
}

const PublicRoutes = () => (
  <PublicLayout>
    <Routes>
      <Route index element={<HomeEntry />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="select-role" element={<SelectRole />} />
      <Route path="login" element={<Login />} />
      <Route path="register" element={<RegisterFlow />} />
      <Route path="register-enterprise" element={<RegisterEnterprise />} />
      <Route path="offres/create" element={<CreateOffre />} />
      <Route path="offres/:id/edit" element={<EditOffre />} />
      <Route path="offres/:id" element={<OffreDetail />} />
      <Route path="offres" element={<ExploreOffres />} />
      <Route path="my-applications" element={<MyApplications />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="explore-candidates" element={<ExploreCandidates />} />
      <Route path="explore-students" element={<ExploreStudents />} />
      <Route path="favorites" element={<FavoritesPage />} />
      <Route path="profile" element={<StudentProfilePage view="owner" />} />
      <Route path="students/:slug" element={<StudentProfilePage view="public" />} />
      <Route path="enterprise-profile" element={<EnterpriseProfilePage view="owner" />} />
      <Route path="enterprises/:slug" element={<EnterpriseProfilePage view="public" />} />
      <Route path="pricing" element={<PricingPage />} />
      <Route path="messages" element={<ChatPage />} />
      <Route path="messages/:conversationId" element={<ChatPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </PublicLayout>
)

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <AlertProvider>
              <LocalePathGuard />
              <Routes>
                <Route path="/" element={<Navigate to={`/${DEFAULT_LOCALE}`} replace />} />

                <Route path="/:locale/*" element={
                  <>
                    <LocaleSync />
                    <PublicRoutes />
                  </>
                } />

                <Route path="/:locale/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsersTable />} />
                  <Route path="offres" element={<AdminOffresTable />} />
                  <Route path="reports" element={<AdminReportsTable />} />
                  <Route path="requests" element={<AdminEnterpriseRequests />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
                <Route path="*" element={<Navigate to={`/${DEFAULT_LOCALE}`} replace />} />
              </Routes>
            </AlertProvider>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App