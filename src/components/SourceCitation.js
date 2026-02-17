"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Shield, ExternalLink, Info } from "lucide-react";

/**
 * SourceCitation Component
 * A small, interactive badge to represent a source citation in text.
 */
export default function SourceCitation({ id, index, onClick, score = 0.9 }) {
    // Determine reliability color based on score
    const getReliabilityColor = (s) => {
        if (s >= 0.8) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
        if (s >= 0.5) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
        return "text-rose-500 bg-rose-500/10 border-rose-500/20";
    };

    return (
        <motion.button
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onClick(id)}
            className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider transition-all align-baseline mx-0.5",
                "bg-secondary/50 hover:bg-primary/10 hover:border-primary/30 hover:text-primary",
                "cursor-pointer group shadow-sm"
            )}
            title={`View Source: ${id}`}
        >
            <span className="opacity-60 group-hover:opacity-100">[{index}]</span>
            <div className={cn(
                "w-1.5 h-1.5 rounded-full animate-pulse",
                score >= 0.8 ? "bg-emerald-500" : score >= 0.5 ? "bg-amber-500" : "bg-rose-500"
            )} />
        </motion.button>
    );
}

/**
 * ReliabilityIndicator Component
 */
export function ReliabilityIndicator({ score }) {
    const s = parseFloat(score) || 0;
    const label = s >= 0.8 ? "High Confidence" : s >= 0.5 ? "Medium Confidence" : "Low Confidence";
    const colorClass = s >= 0.8 ? "text-emerald-500" : s >= 0.5 ? "text-amber-500" : "text-rose-500";

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50">
            <Shield className={cn("h-3.5 w-3.5", colorClass)} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
            <span className={cn("text-xs font-mono font-bold ml-1", colorClass)}>{Math.round(s * 100)}%</span>
        </div>
    );
}
