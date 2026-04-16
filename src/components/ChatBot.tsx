import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createChatSession, sendMessage } from "@/lib/gemini";
import { detectBadWords } from "@/lib/profanity";
import type { ChatSession } from "@google/generative-ai";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
}

interface ChatBotProps {
  accentColor: string; // e.g. 'emerald' or 'blue'
  systemPrompt: string;
  botName: string;
  userName?: string;
  welcomeMessage?: string;
}

const accentMap: Record<
  string,
  {
    bg: string;
    bgHover: string;
    text: string;
    border: string;
    glow: string;
    bgSoft: string;
    ring: string;
  }
> = {
  emerald: {
    bg: "bg-emerald-600",
    bgHover: "hover:bg-emerald-500",
    text: "text-emerald-500",
    border: "border-emerald-500/30",
    glow: "shadow-emerald-500/30",
    bgSoft: "bg-emerald-500/10",
    ring: "ring-emerald-500/20",
  },
  blue: {
    bg: "bg-blue-600",
    bgHover: "hover:bg-blue-500",
    text: "text-blue-500",
    border: "border-blue-500/30",
    glow: "shadow-blue-500/30",
    bgSoft: "bg-blue-500/10",
    ring: "ring-blue-500/20",
  },
};

export default function ChatBot({
  accentColor,
  systemPrompt,
  botName,
  userName,
  welcomeMessage,
}: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const accent = accentMap[accentColor] || accentMap.blue;

  // Initialize chat session
  useEffect(() => {
    try {
      const session = createChatSession(systemPrompt);
      setChatSession(session);
    } catch (error) {
      console.error("Chat session initialization failed:", error);
      setChatSession(null);
      setMessages([
        {
          id: "config-error",
          role: "bot",
          content:
            "⚠️ L'assistant IA n'est pas configure. Ajoutez VITE_GEMINI_API_KEY pour activer le chatbot.",
          timestamp: new Date(),
        },
      ]);
    }
  }, [systemPrompt]);

  // Add welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0 && welcomeMessage) {
      setMessages([
        {
          id: "welcome",
          role: "bot",
          content: welcomeMessage,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, messages.length, welcomeMessage]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || !chatSession) return;

    const profanityResult = detectBadWords(trimmed);
    if (profanityResult.hasBadWord) {
      const warningMsg: Message = {
        id: `warn-${Date.now()}`,
        role: "bot",
        content: "⚠️ Merci d'utiliser un langage respectueux.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, warningMsg]);
      return;
    }

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await sendMessage(chatSession, trimmed);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: "bot",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: "bot",
        content: "⚠️ Désolé, une erreur est survenue. Veuillez réessayer.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, chatSession]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Simple markdown-like rendering: bold, line breaks
  const renderContent = (text: string) => {
    return text.split("\n").map((line, i) => {
      const parts = line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={j} className="font-bold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={j}>{part}</span>;
      });
      return (
        <span key={i}>
          {parts}
          {i < text.split("\n").length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <>
      {/* Floating Bubble */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-6 z-[1000] w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-[0_18px_40px_rgba(20,57,160,0.55)] bg-[#2166ff] border border-white/20"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 1 }}
        aria-label="Ouvrir le chatbot"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.svg
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </motion.svg>
          ) : (
            <motion.svg
              key="chat"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-7 h-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.25}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </motion.svg>
          )}
        </AnimatePresence>

        {/* Pulse ring when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-[#2166ff] opacity-30 animate-ping" />
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-20 right-6 z-[1000] w-[380px] h-[520px] flex flex-col rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
            style={{
              background:
                "linear-gradient(145deg, rgba(9,9,11,0.97) 0%, rgba(15,15,20,0.98) 100%)",
              backdropFilter: "blur(40px)",
            }}
          >
            {/* Header */}
            <div
              className={`px-5 py-4 border-b border-white/5 flex items-center gap-3`}
            >
              <div className="w-10 h-10 rounded-[12px] overflow-hidden shadow-sm flex items-center justify-center shrink-0">
                <img
                  src="/Logo.svg"
                  alt="MatchedIn Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-sm font-black uppercase tracking-wide truncate">
                  {botName}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`w-2 h-2 rounded-full ${accent.bg} animate-pulse`}
                  />
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    En ligne
                  </span>
                </div>
                {userName && (
                  <p className="text-slate-600 text-[9px] font-bold uppercase tracking-widest truncate mt-0.5">
                    Session: {userName}
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:border-white/20 transition-all"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[82%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed ${
                      msg.role === "user"
                        ? `${accent.bg} text-white rounded-br-md`
                        : "bg-white/[0.05] text-slate-200 border border-white/5 rounded-bl-md"
                    }`}
                  >
                    {renderContent(msg.content)}
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/[0.05] border border-white/5 px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${accent.bg} animate-bounce`}
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className={`w-2 h-2 rounded-full ${accent.bg} animate-bounce`}
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className={`w-2 h-2 rounded-full ${accent.bg} animate-bounce`}
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-white/5">
              <div
                className={`flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-1 focus-within:border-white/20 focus-within:${accent.ring} focus-within:ring-2 transition-all`}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Écrivez votre message..."
                  className="flex-1 bg-transparent text-white text-[13px] py-2.5 placeholder:text-slate-600 outline-none"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    input.trim() && !isLoading
                      ? `${accent.bg} ${accent.bgHover} text-white shadow-lg ${accent.glow}`
                      : "bg-white/5 text-slate-600 cursor-not-allowed"
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-center text-slate-700 text-[9px] font-medium mt-2 tracking-wide">
                Propulsé par Gemini AI • MatchedIn
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
