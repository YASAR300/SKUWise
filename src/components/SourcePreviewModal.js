"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Database, Calendar, ExternalLink, ShieldCheck, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReliabilityIndicator } from "./SourceCitation";

/**
 * SourcePreviewModal Component
 * Displays detailed information about a specific data source.
 */
export default function SourcePreviewModal({ isOpen, onClose, source }) {
    if (!source) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-background/80 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/20">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                                    <Database className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-1">Data Asset Verified</div>
                                    <h2 className="text-xl font-bold tracking-tight">{source.type?.toUpperCase()} Reference</h2>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-secondary rounded-xl transition-all"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Reliability Section */}
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <ReliabilityIndicator score={source.score} />
                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                                    <span className="px-2 py-0.5 rounded bg-secondary border border-border">ID: {source.id}</span>
                                </div>
                            </div>

                            {/* Content Block */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    <FileText className="h-4 w-4" />
                                    Source Content
                                </div>
                                <div className="p-5 rounded-2xl bg-secondary/30 border border-border/50 text-sm leading-relaxed text-foreground/90 font-medium italic">
                                    "{source.content}"
                                </div>
                            </div>

                            {/* Metadata Grid */}
                            {source.metadata && Object.keys(source.metadata).length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                        <Share2 className="h-4 w-4" />
                                        Extended Metadata
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {Object.entries(source.metadata).map(([key, value]) => {
                                            if (key === 'content') return null;
                                            return (
                                                <div key={key} className="p-3 rounded-xl border border-border/50 bg-card/50 flex flex-col gap-1">
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider font-mono">{key}</span>
                                                    <span className="text-xs font-medium truncate">{String(value)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-border bg-secondary/10 flex items-center justify-between">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                            >
                                Confirm & Close
                            </button>
                            <div className="flex items-center gap-3">
                                <button className="p-2 hover:bg-secondary rounded-lg transition-all text-muted-foreground" title="Report Data Inaccuracy">
                                    <ShieldCheck className="h-5 w-5" />
                                </button>
                                <button className="p-2 hover:bg-secondary rounded-lg transition-all text-muted-foreground" title="External Audit">
                                    <ExternalLink className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
