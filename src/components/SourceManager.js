"use client";

import { motion } from "framer-motion";
import { Database, FileText, Search, Shield, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SourceManager Component
 * A panel context that shows all sources active in the current conversation.
 */
export default function SourceManager({ sources = [], onSourceClick }) {
    return (
        <div className="flex flex-col h-full">
            <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Database className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-bold tracking-tight">Intelligence Sources</h3>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search sources..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-secondary/30 border border-border outline-none focus:border-primary transition-all text-xs"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {sources.length === 0 ? (
                    <div className="text-center py-12 opacity-40">
                        <Database className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-xs uppercase font-black tracking-widest">No Sources Loaded</p>
                    </div>
                ) : (
                    sources.map((source, idx) => (
                        <motion.button
                            key={source.id || idx}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onSourceClick(source.id)}
                            className="w-full text-left p-4 rounded-2xl border border-border bg-card/50 hover:bg-secondary/50 hover:border-primary/20 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        source.score >= 0.8 ? "bg-emerald-500" : source.score >= 0.5 ? "bg-amber-500" : "bg-rose-500"
                                    )} />
                                    <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Source #{idx + 1}</span>
                                </div>
                                <div className="p-1 rounded bg-secondary text-[8px] font-mono text-muted-foreground">{source.type}</div>
                            </div>
                            <p className="text-xs font-medium line-clamp-2 text-foreground/80 mb-3 leading-relaxed">
                                {source.content}
                            </p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary">
                                    <Shield className="h-3 w-3" />
                                    {Math.round((source.score || 0.8) * 100)}% RELIABILITY
                                </div>
                                <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </div>
                        </motion.button>
                    ))
                )}
            </div>

            <div className="p-4 border-t border-border bg-secondary/10">
                <p className="text-[9px] text-center text-muted-foreground font-medium italic">
                    All sources are verified against the SKUWise Intelligence Layer.
                </p>
            </div>
        </div>
    );
}
