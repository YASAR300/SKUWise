"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, Zap, BrainCircuit, TrendingUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState("");

  const suggestedQueries = [
    "Analyze Q4 margin leakage",
    "Compare SKUs with Competitor X",
    "Identify high-risk inventory",
  ];

  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center max-w-5xl mx-auto overflow-hidden px-4">
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

      {/* Main AI Interaction Area */}
      <div className="relative z-10 w-full flex flex-col items-center gap-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Strategic Intelligence Engine</p>
          <h1 className="text-4xl md:text-6xl font-normal tracking-[-0.04em] leading-tight">
            How shall we <span className="font-serif italic">advance</span> today?
          </h1>
        </motion.div>

        <motion.div
          layout
          className={cn(
            "w-full max-w-2xl transition-all duration-500 rounded-px p-px",
            isFocused ? "bg-gradient-to-r from-primary/50 via-purple-500/50 to-primary/50" : "bg-border"
          )}
        >
          <div className="bg-background w-full rounded-px flex items-center px-6 py-4">
            <Search className={cn("h-5 w-5 transition-colors", isFocused ? "text-primary" : "text-muted-foreground")} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Query the void..."
              className="flex-1 bg-transparent border-none px-4 py-3 text-lg focus:outline-none placeholder:text-muted-foreground/30 placeholder:italic font-light"
            />
            <button className={cn(
              "p-3 rounded-full transition-all active:scale-90",
              query ? "bg-primary text-white scale-100" : "bg-secondary text-muted-foreground scale-90 opacity-40"
            )}>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </motion.div>

        <AnimatePresence>
          {!isFocused && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-wrap justify-center gap-3 px-8"
            >
              {suggestedQueries.map((q) => (
                <button
                  key={q}
                  onClick={() => setQuery(q)}
                  className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest border border-border/50 rounded-full hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all text-muted-foreground"
                >
                  {q}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Mode HUD (Minimalist) */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-10 px-10 py-4 glass border border-border rounded-full">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Mode</p>
            <p className="text-[11px] font-bold">Deep Research</p>
          </div>
        </div>
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-secondary text-muted-foreground group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Persona</p>
            <p className="text-[11px] font-bold">Growth Optimizer</p>
          </div>
        </div>
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-secondary text-muted-foreground group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-sm">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Target</p>
            <p className="text-[11px] font-bold">Market Share</p>
          </div>
        </div>
      </div>
    </div>
  );
}
