import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/axios"; // Your typed Axios instance
import { Search01Icon, RemoveCircleIcon } from "hugeicons-react";

/**
 * UI HELPER: Input Group
 * Standardized input with icon and premium styling
 */
interface InputGroupProps {
  icon: React.ReactNode;
  name: string;
  placeholder: string;
  value: string;
  type?: string;
  onChange: (updater: (prev: Record<string, string>) => Record<string, string>) => void;
}

export function InputGroup({ icon, name, placeholder, value, type = "text", onChange }: InputGroupProps) {
  return (
    <div className="relative group">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
        {icon}
      </div>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange((prev: Record<string, string>) => ({ ...prev, [name]: e.target.value }))}
        className="w-full pl-16 pr-6 py-5 bg-white/[0.03] border border-white/10 rounded-[24px] text-[11px] font-black tracking-widest text-white focus:outline-none focus:border-blue-600/50 focus:bg-white/[0.07] transition-all placeholder:text-slate-600 uppercase"
      />
    </div>
  );
}

/**
 * UI HELPER: Domain Card
 * Large selectable cards for IT vs Non-IT branching
 */
interface DomainCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
  selected: boolean;
}

export function DomainCard({ icon, title, desc, onClick, selected }: DomainCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-8 rounded-[32px] border transition-all duration-500 text-left group relative overflow-hidden ${selected
        ? 'bg-blue-600 border-blue-600 shadow-2xl shadow-blue-600/20'
        : 'bg-white/[0.03] border-white/10 hover:border-blue-600/40 hover:bg-white/[0.05]'
        }`}
    >
      {/* Visual flare for selected state */}
      {selected && (
        <motion.div
          layoutId="activeGlow"
          className="absolute -top-12 -right-12 w-24 h-24 bg-white/20 blur-3xl rounded-full"
        />
      )}

      <div className={`mb-6 transition-transform duration-500 group-hover:scale-110 ${selected ? 'text-white' : 'text-blue-500'}`}>
        {icon}
      </div>

      <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2 font-syne">
        {title}
      </h3>

      <p className={`text-[10px] font-bold uppercase tracking-widest leading-relaxed ${selected ? 'text-blue-100' : 'text-slate-500'}`}>
        {desc}
      </p>
    </button>
  );
}

export interface Skill {
  id: number;
  name: string;
  category: string;
  level?: number;
}

interface CompetenceSelectorProps {
  onUpdate: (skills: Skill[]) => void;
  profileType: "IT" | "NON_IT" | null;
  initialSkills?: Skill[];
}

export default function CompetenceSelector({ onUpdate, profileType, initialSkills = [] }: CompetenceSelectorProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>(initialSkills);
  const [isFocused, setIsFocused] = useState(false);

  // Debounced search to Laravel API
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (profileType) {
        try {
          const { data } = await api.get(`/skills/search?q=${query}&type=${profileType}`);
          setSuggestions(data);
        } catch (error) {
          console.error("Failed to fetch skills", error);
        }
      }
    }, query.length > 0 ? 300 : 0); // Immediate for empty query

    return () => clearTimeout(delayDebounceFn);
  }, [query, profileType]);

  const addSkill = (skill: Skill) => {
    if (!selectedSkills.find((s) => s.id === skill.id)) {
      const updated = [...selectedSkills, { ...skill, level: 3 }];
      setSelectedSkills(updated);
      onUpdate(updated);
    }
    setQuery("");
    setSuggestions([]);
  };

  const updateLevel = (id: number, level: number) => {
    const updated = selectedSkills.map((s) => (s.id === id ? { ...s, level } : s));
    setSelectedSkills(updated);
    onUpdate(updated);
  };

  const removeSkill = (id: number) => {
    const updated = selectedSkills.filter((s) => s.id !== id);
    setSelectedSkills(updated);
    onUpdate(updated);
  };

  return (
    <div className="space-y-4">
      {/* Selected Tags Display */}
      <div className="flex flex-wrap gap-2 min-h-[60px] p-4 bg-white/[0.03] border border-white/10 rounded-[24px]">
        {selectedSkills.length === 0 && (
          <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest flex items-center h-full pl-2">
            Aucune compétence sélectionnée
          </span>
        )}
        <AnimatePresence>
          {selectedSkills.map((skill) => (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              key={skill.id}
              className="flex flex-col gap-2 p-3 bg-white/[0.03] border border-white/10 rounded-[20px] min-w-[150px]"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-white text-[10px] font-black uppercase tracking-widest truncate max-w-[100px]">
                  {skill.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeSkill(skill.id)}
                  className="text-slate-600 hover:text-red-500 transition-colors"
                >
                  <RemoveCircleIcon size={14} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-[8px] font-black uppercase text-slate-600 tracking-tighter italic">Niveau</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => updateLevel(skill.id, lvl)}
                      className={`w-3 h-3 rounded-full border transition-all ${(skill.level || 3) >= lvl
                        ? 'bg-blue-600 border-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.3)]'
                        : 'border-white/10 hover:border-white/30'
                        }`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search01Icon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
        <input
          type="text"
          placeholder={`RECHERCHER : ${profileType === "IT" ? "REACT, LARAVEL, DOCKER..." : "SEO, SALES, FIGMA..."}`}
          className="w-full pl-16 pr-6 py-5 bg-white/[0.03] border border-white/10 rounded-[24px] text-[11px] font-black tracking-widest text-white focus:border-blue-600/50 outline-none transition-all placeholder:text-slate-600"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)} // Small delay to allow clicking suggestions
        />

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {suggestions.length > 0 && isFocused && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-full left-0 right-0 mt-2 bg-[#18181b] border border-white/10 rounded-[24px] shadow-2xl z-[100] overflow-hidden flex flex-col max-h-[300px]"
            >
              <div className="overflow-y-auto">
                {suggestions.map((skill) => (
                  <button
                    type="button"
                    key={skill.id}
                    onClick={() => addSkill(skill)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 text-left transition-colors border-b border-white/5 last:border-0"
                  >
                    <span className="text-white text-[11px] font-black uppercase tracking-widest">{skill.name}</span>
                    <span className="text-slate-600 text-[9px] font-bold uppercase tracking-widest">{skill.category}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}