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
  Quote
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const suggestedQueries = [
    "Analyze Q4 margin leakage",
    "Compare SKUs with Competitor X",
    "Identify high-risk inventory",
  ];

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setResult(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

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

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="search-mode"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 w-full flex flex-col items-center gap-12"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Strategic Intelligence Engine</p>
              <h1 className="text-4xl md:text-6xl font-normal tracking-[-0.04em] leading-tight text-foreground">
                How shall we <span className="font-serif italic text-primary">advance</span> today?
              </h1>
            </motion.div>

            <form onSubmit={handleSearch} className="w-full max-w-2xl group">
              <motion.div
                layout
                className={cn(
                  "w-full transition-all duration-500 rounded-2xl p-px",
                  isFocused || isAnalyzing ? "bg-gradient-to-r from-primary via-purple-500 to-primary" : "bg-border"
                )}
              >
                <div className="bg-background w-full rounded-2xl flex items-center px-6 py-4">
                  <Search className={cn("h-5 w-5 transition-colors", isFocused ? "text-primary" : "text-muted-foreground")} />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={isAnalyzing ? "Processing neural paths..." : "Query the void..."}
                    disabled={isAnalyzing}
                    className="flex-1 bg-transparent border-none px-4 py-3 text-lg focus:outline-none placeholder:text-muted-foreground/30 placeholder:italic font-light text-foreground"
                  />
                  <button
                    type="submit"
                    disabled={!query || isAnalyzing}
                    className={cn(
                      "p-3 rounded-full transition-all active:scale-90",
                      query && !isAnalyzing ? "bg-primary text-white scale-100" : "bg-secondary text-muted-foreground scale-90 opacity-40"
                    )}
                  >
                    {isAnalyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                  </button>
                </div>
              </motion.div>
            </form>

            {!isFocused && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap justify-center gap-3 px-8"
              >
                {suggestedQueries.map((q) => (
                  <button
                    key={q}
                    onClick={() => { setQuery(q); handleSearch(); }}
                    className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest border border-border/50 rounded-full hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all text-muted-foreground"
                  >
                    {q}
                  </button>
                ))}
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="result-mode"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 w-full max-w-4xl bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8 md:p-12 space-y-8">
              <header className="flex justify-between items-center pb-8 border-b border-border/50">
                <button
                  onClick={() => setResult(null)}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  New Analysis
                </button>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <BrainCircuit className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Intelligence Output</span>
                </div>
              </header>

              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <Quote className="h-8 w-8 text-primary/20 rotate-180 flex-shrink-0" />
                  <h2 className="text-2xl font-black text-foreground">{query}</h2>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none prose-p:text-muted-foreground prose-strong:text-foreground prose-strong:font-black">
                  <ReactMarkdown>{result.answer}</ReactMarkdown>
                </div>
              </div>

              {result.sources && result.sources.length > 0 && (
                <footer className="pt-8 border-t border-border/50 space-y-4">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Neural Sources Connected</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.sources.map((source, i) => (
                      <div key={i} className="px-3 py-1 rounded-full bg-secondary border border-border text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        {source.type} metadata-id: {source.id.slice(0, 8)}
                      </div>
                    ))}
                  </div>
                </footer>
              )}
            </div>

            <div className="bg-primary px-12 py-6 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-bold">Actionable Strategic Path Generated</span>
              </div>
              <button className="text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors">
                Deploy Strategy
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Mode HUD (Minimalist) */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-10 px-10 py-4 glass border border-border rounded-full z-50">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Mode</p>
            <p className="text-[11px] font-bold text-foreground">Deep Research</p>
          </div>
        </div>
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-secondary text-muted-foreground group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Persona</p>
            <p className="text-[11px] font-bold text-foreground">Growth Optimizer</p>
          </div>
        </div>
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-secondary text-muted-foreground group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-sm">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Target</p>
            <p className="text-[11px] font-bold text-foreground">Market Share</p>
          </div>
        </div>
      </div>
    </div>
  );
}
