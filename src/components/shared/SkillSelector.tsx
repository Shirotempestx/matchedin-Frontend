import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/axios";
import {
  Search01Icon,
  RemoveCircleIcon,
  CodeIcon,
  PresentationBarChart01Icon,
} from "hugeicons-react";

interface Skill {
  id: number;
  name: string;
  category: string;
  level?: number;
}

interface SkillSelectorProps {
  onUpdate: (skills: { id: number; level: number }[]) => void;
  onSelectionChange?: (skills: Skill[]) => void;
  initialSkills?: Skill[];
  title?: string;
  description?: string;
  accentColor?: string; // e.g., "blue" or "emerald"
  defaultProfileType?: "IT" | "NON_IT" | "ALL" | null;
  allowDomainChange?: boolean;
  showDomainCards?: boolean;
  hideEmptyState?: boolean;
}

/**
 * SHARED COMPONENT: SkillSelector
 * A premium, unified expertise selector used across Registration (Students)
 * and Opportunity Creation (Enterprises).
 */
export default function SkillSelector({
  onUpdate,
  onSelectionChange,
  initialSkills = [],
  title,
  description,
  accentColor = "blue",
  defaultProfileType = null,
  allowDomainChange = true,
  showDomainCards = true,
  hideEmptyState = false,
}: SkillSelectorProps) {
  const [profileType, setProfileType] = useState<
    "IT" | "NON_IT" | "ALL" | null
  >(defaultProfileType);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>(initialSkills);
  const [isFocused, setIsFocused] = useState(false);

  // Sync initialSkills if they change (useful for edit/create autofill modes)
  useEffect(() => {
    const currentKey = selectedSkills
      .map((skill) => `${skill.id}:${skill.level || 3}`)
      .join("|");
    const nextKey = initialSkills
      .map((skill) => `${skill.id}:${skill.level || 3}`)
      .join("|");
    if (currentKey !== nextKey) {
      setSelectedSkills(initialSkills);
      onSelectionChange?.(initialSkills);
    }
  }, [initialSkills, selectedSkills, onSelectionChange]);

  // Debounced search to Laravel API
  useEffect(() => {
    const delayDebounceFn = setTimeout(
      async () => {
        if (profileType) {
          try {
            const categoryParam =
              profileType === "ALL" ? "" : `&type=${profileType}`;
            const { data } = await api.get(
              `/skills/search?q=${query}${categoryParam}`,
            );
            setSuggestions(data);
          } catch (error) {
            console.error("Failed to fetch skills", error);
          }
        }
      },
      query.length > 0 ? 300 : 0,
    );

    return () => clearTimeout(delayDebounceFn);
  }, [query, profileType]);

  const addSkill = (skill: Skill) => {
    if (!selectedSkills.find((s) => s.id === skill.id)) {
      const updated = [...selectedSkills, { ...skill, level: 3 }];
      setSelectedSkills(updated);
      onUpdate(updated.map((s) => ({ id: s.id, level: s.level || 3 })));
      onSelectionChange?.(updated);
    }
    setQuery(skill.name);
    setSuggestions([]);
  };

  const updateLevel = (id: number, level: number) => {
    const updated = selectedSkills.map((s) =>
      s.id === id ? { ...s, level } : s,
    );
    setSelectedSkills(updated);
    onUpdate(updated.map((s) => ({ id: s.id, level: s.level || 3 })));
    onSelectionChange?.(updated);
  };

  const removeSkill = (id: number) => {
    const updated = selectedSkills.filter((s) => s.id !== id);
    setSelectedSkills(updated);
    onUpdate(updated.map((s) => ({ id: s.id, level: s.level || 3 })));
    onSelectionChange?.(updated);
  };

  const bgActive = accentColor === "emerald" ? "bg-emerald-600" : "bg-blue-600";
  const borderActive =
    accentColor === "emerald" ? "border-emerald-600/50" : "border-blue-600/50";
  const textActive =
    accentColor === "emerald" ? "text-emerald-500" : "text-blue-500";

  return (
    <div className="space-y-8">
      {showDomainCards && allowDomainChange && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DomainCard
            selected={profileType === "IT"}
            onClick={() => setProfileType("IT")}
            icon={<CodeIcon size={32} />}
            title="Tech & IT"
            desc="Développeurs, Data, Devops..."
            accentColor={accentColor}
          />
          <DomainCard
            selected={profileType === "NON_IT"}
            onClick={() => setProfileType("NON_IT")}
            icon={<PresentationBarChart01Icon size={32} />}
            title="Business & Management"
            desc="Marketing, RH, Finance, Sales..."
            accentColor={accentColor}
          />
        </div>
      )}

      {profileType && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          {(title || description) && (
            <header>
              {title && (
                <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2 font-syne">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  {description}
                </p>
              )}
            </header>
          )}

          {/* Selected Tags Display */}
          {(!hideEmptyState || selectedSkills.length > 0) && (
            <div className={`flex flex-wrap gap-3 p-4 bg-white/[0.03] border border-white/10 rounded-[32px] ${selectedSkills.length === 0 ? 'min-h-[80px]' : ''}`}>
              {selectedSkills.length === 0 && !hideEmptyState && (
                <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest flex items-center h-full pl-4 mt-3">
                  Aucune compÃ©tence sÃ©lectionnÃ©e
                </span>
              )}
            <AnimatePresence>
              {selectedSkills.map((skill) => (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  key={skill.id}
                  className="flex flex-col gap-2 p-4 bg-white/[0.03] border border-white/10 rounded-[24px] min-w-[160px]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white text-[10px] font-black uppercase tracking-widest truncate max-w-[110px]">
                      {skill.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill.id)}
                      className="text-slate-600 hover:text-red-500 transition-colors"
                    >
                      <RemoveCircleIcon size={16} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <span className="text-[8px] font-black uppercase text-slate-600 tracking-tighter italic">
                      Niveau
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => updateLevel(skill.id, lvl)}
                          className={`w-3 h-3 rounded-full border transition-all ${
                            (skill.level || 3) >= lvl
                              ? `${bgActive} ${accentColor === "emerald" ? "border-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "border-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.3)]"}`
                              : "border-white/10 hover:border-white/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          )}

          {/* Search Input */}
          <div className="relative">
            <Search01Icon
              className={`absolute left-6 top-1/2 -translate-y-1/2 ${isFocused ? textActive : "text-slate-500"} transition-colors`}
              size={20}
            />
            <input
              type="text"
              placeholder={`RECHERCHER : ${profileType === "IT" ? "REACT, LARAVEL, DOCKER..." : "SEO, SALES, FIGMA..."}`}
              className={`w-full pl-16 pr-6 py-5 bg-white/[0.03] border border-white/10 rounded-[28px] text-[11px] font-black tracking-widest text-white focus:outline-none focus:bg-white/[0.07] transition-all placeholder:text-slate-600 uppercase ${isFocused ? borderActive : ""}`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            />

            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {suggestions.length > 0 && isFocused && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-full left-2 right-2 mt-2 bg-[#121214] border border-white/10 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[9999] overflow-hidden flex flex-col max-h-[220px]"
                >
                  <div className="overflow-y-auto thin-scrollbar">
                    {suggestions.map((skill) => (
                      <button
                        type="button"
                        key={skill.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            addSkill(skill);
                          }}
                        className="w-full flex items-center justify-between px-8 py-5 hover:bg-white/5 text-left transition-colors border-b border-white/5 last:border-0"
                      >
                        <span className="text-white text-[11px] font-black uppercase tracking-widest">
                          {skill.name}
                        </span>
                        <span className="text-slate-600 text-[9px] font-bold uppercase tracking-widest">
                          {skill.category}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
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
  accentColor: string;
}

function DomainCard({
  icon,
  title,
  desc,
  onClick,
  selected,
  accentColor,
}: DomainCardProps) {
  const activeStyles =
    accentColor === "emerald"
      ? "bg-emerald-600 border-emerald-600 shadow-2xl shadow-emerald-600/20"
      : "bg-blue-600 border-blue-600 shadow-2xl shadow-blue-600/20";

  const iconColor = selected
    ? "text-white"
    : accentColor === "emerald"
      ? "text-emerald-500"
      : "text-blue-500";
  const descColor = selected
    ? accentColor === "emerald"
      ? "text-emerald-100"
      : "text-blue-100"
    : "text-slate-500";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-10 rounded-[40px] border transition-all duration-500 text-left group relative overflow-hidden ${selected ? activeStyles : "bg-white/[0.03] border-white/10 hover:border-white/30 hover:bg-white/[0.05]"}`}
    >
      <div
        className={`mb-6 transition-transform duration-500 group-hover:scale-110 ${iconColor}`}
      >
        {icon}
      </div>
      <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2 font-syne">
        {title}
      </h3>
      <p
        className={`text-[10px] font-bold uppercase tracking-widest leading-relaxed ${descColor}`}
      >
        {desc}
      </p>
    </button>
  );
}
