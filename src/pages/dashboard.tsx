import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation, useNavigate } from "react-router-dom";
import { normalizeLocale } from "@/i18n/config";
import EnterpriseDashboard from "./dashboard/EnterpriseDashboard";
import StudentDashboard from "./dashboard/StudentDashboard";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const routeLocale = normalizeLocale(
    location.pathname.split("/").filter(Boolean)[0] ||
      localStorage.getItem("preferred_language") ||
      "fr",
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(`/${routeLocale}/login`);
    }
  }, [isAuthenticated, isLoading, navigate, routeLocale]);

  useEffect(() => {
    if (user && user.role === "enterprise") {
      // Wake-up ping for Render API
      fetch("https://neural-extractor.onrender.com/api/v1/health", {
        method: "GET",
        mode: "no-cors",
      }).catch(() => {
        // Ignore errors gracefully
      });
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="app-page flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (user.role === "enterprise") {
    return <EnterpriseDashboard />;
  }

  return <StudentDashboard />;
}
