import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme !== "light" : true;
  const triggerThemeGlow = () => {
    document.documentElement.classList.add("theme-swap-glow");
    window.setTimeout(() => {
      document.documentElement.classList.remove("theme-swap-glow");
    }, 560);
  };

  const handleThemeToggle = () => {
    triggerThemeGlow();
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <motion.button
      type="button"
      onClick={handleThemeToggle}
      whileTap={{ scale: 0.92, rotate: isDark ? -10 : 10 }}
      className="relative h-10 px-3 rounded-xl border app-border app-soft app-muted hover:text-white transition-all flex items-center gap-2 overflow-hidden"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <motion.span
        className="absolute inset-0 pointer-events-none"
        initial={false}
        animate={{ opacity: isDark ? 0.12 : 0.2 }}
        style={{
          background:
            "radial-gradient(circle at 20% 50%, rgba(245, 158, 11, 0.4), transparent 45%), radial-gradient(circle at 80% 50%, rgba(59, 130, 246, 0.35), transparent 42%)",
        }}
      />
      <motion.span
        initial={false}
        animate={{ rotate: isDark ? 0 : 180, scale: isDark ? 1 : 1.05 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
        className="relative"
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </motion.span>
      <span className="hidden 2xl:block text-[11px] font-black uppercase tracking-wider">
        {isDark ? "Light" : "Dark"}
      </span>
    </motion.button>
  );
}
