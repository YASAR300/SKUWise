"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ArrowRight,
  Zap,
  BrainCircuit,
  TrendingUp,
  Loader2,
  Terminal,
  ArrowLeft,
  Sparkles,
  Quote,
  Plus,
  Mic,
  Paperclip,
  Image as ImageIcon,
  Lightbulb,
  ShoppingCart,
  GraduationCap,
  Globe,
  Palette,
  HelpCircle,
  MoreHorizontal,
  ChevronRight
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mode, setMode] = useState("quick");
  const [showModeMenu, setShowModeMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowModeMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Disable scroll on homepage
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Suggest protection if loading
  if (status === "loading") {
    return <div className="h-screen w-full flex items-center justify-center font-black uppercase tracking-[0.3em] opacity-20">Initializing_Cognitive_Core...</div>;
  }

  const suggestedQueries = [
    "Analyze Q4 margin leakage",
    "Compare SKUs with Competitor X",
    "Identify high-risk inventory",
  ];

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setShowModeMenu(false);

    try {
      // Create conversation
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: query.slice(0, 50),
          mode,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Redirect to chat page
        router.push(`/chat/${data.conversation.id}?query=${encodeURIComponent(query)}`);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error("Failed to create conversation:", err);
      alert("Failed to start chat. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const currentMode = aiModes.find(m => m.id === mode) || aiModes[0];

  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-start overflow-hidden px-4 pt-32">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none opacity-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="w-full h-full border-[0.5px] border-dashed border-primary/30 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-[0.5px] border-dashed border-primary/20 rounded-full"
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key="search-mode"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          className="relative z-10 w-full flex flex-col items-center gap-12"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
            >
              <BrainCircuit className="h-5 w-5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                AI Business Analyst
              </span>
            </motion.div>
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl font-bold tracking-tight"
            >
              What can I help with?
            </motion.h1>
          </div>

          {/* Search Bar with Mode Menu */}
          <motion.form
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSearch}
            className="w-full max-w-2xl relative"
            ref={menuRef}
          >
            {/* Mode Dropdown Menu */}
            <AnimatePresence>
              {showModeMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-0 mb-3 w-72 max-h-[350px] overflow-y-auto bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl z-50"
                >
                  <div className="p-1.5">
                    {/* AI Modes */}
                    {aiModes.map((aiMode) => {
                      const Icon = aiMode.icon;
                      return (
                        <button
                          key={aiMode.id}
                          type="button"
                          onClick={() => {
                            setMode(aiMode.id);
                            setShowModeMenu(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                            mode === aiMode.id
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-secondary/50 text-foreground"
                          )}
                        >
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{aiMode.label}</div>
                            <div className="text-xs text-muted-foreground">{aiMode.description}</div>
                          </div>
                        </button>
                      );
                    })}

                    {/* Divider */}
                    <div className="my-2 border-t border-border" />

                    {/* More Options */}
                    {moreOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setMode(option.id);
                            setShowModeMenu(false);
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-all text-left"
                        >
                          <Icon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                          <span className="font-medium text-sm">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search Input */}
            <div
              className={cn(
                "relative flex items-center gap-3 px-5 py-3.5 rounded-2xl border-2 transition-all duration-300 bg-card",
                isFocused
                  ? "border-primary shadow-xl shadow-primary/20"
                  : "border-border shadow-lg hover:border-primary/50"
              )}
            >
              {/* Mode Button */}
              <button
                type="button"
                onClick={() => setShowModeMenu(!showModeMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/70 transition-all border border-border/50"
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
              </button>

              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Ask anything..."
                className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground"
                disabled={isAnalyzing}
              />

              {/* Right Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="p-2 hover:bg-secondary/70 rounded-lg transition-colors"
                  title="Add files"
                >
                  <Paperclip className="h-5 w-5 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  className="p-2 hover:bg-secondary/70 rounded-lg transition-colors"
                  title="Voice input"
                >
                  <Mic className="h-5 w-5 text-muted-foreground" />
                </button>
                <button
                  type="submit"
                  disabled={!query.trim() || isAnalyzing}
                  className={cn(
                    "p-3 rounded-xl transition-all",
                    query.trim() && !isAnalyzing
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl"
                      : "bg-secondary text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ArrowRight className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Current Mode Indicator */}
            {!showModeMenu && (() => {
              const Icon = currentMode.icon;
              return (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon className="h-4 w-4" />
                  <span>{currentMode.label}</span>
                </div>
              );
            })()}
          </motion.form>

          {/* Suggested Queries */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-3 justify-center"
          >
            {suggestedQueries.map((sq, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(sq);
                  handleSearch(null);
                }}
                className="px-5 py-2.5 rounded-full border border-border hover:border-primary hover:bg-primary/5 transition-all text-sm font-medium"
              >
                {sq}
              </button>
            ))}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
