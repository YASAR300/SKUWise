"use client";

import { motion } from "framer-motion";
import { AlertCircle, RefreshCw, Layers } from "lucide-react";

/**
 * WidgetFallback Component
 * A localized fallback for specific dashboard sections or components.
 */
export default function WidgetFallback({ title, error, retry }) {
    return (
        <div className="h-full w-full min-h-[200px] flex flex-col items-center justify-center p-8 bg-card/30 border border-dashed border-border rounded-3xl text-center">
            <div className="p-3 rounded-full bg-destructive/10 text-destructive mb-4">
                <AlertCircle className="h-5 w-5" />
            </div>

            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2">{title || "Stream_Interrupted"}</h4>

            <p className="text-[10px] text-muted-foreground font-medium mb-6 max-w-[200px]">
                {error || "Telemetry collection timed out or returned invalid parity."}
            </p>

            {retry && (
                <button
                    onClick={retry}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-[10px] font-black uppercase tracking-widest transition-all border border-border/50"
                >
                    <RefreshCw className="h-3 w-3" />
                    Retry_Sync
                </button>
            )}
        </div>
    );
}

export function EmptyWidget({ title, message, icon: Icon = Layers }) {
    return (
        <div className="h-full w-full min-h-[200px] flex flex-col items-center justify-center p-8 bg-card/10 border border-dashed border-border/30 rounded-3xl text-center opacity-40 grayscale">
            <div className="mb-4">
                <Icon className="h-8 w-8" />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title || "No_Telemetry"}</h4>
            <p className="text-[10px] font-medium max-w-[200px] leading-tight">
                {message || "The neural cluster has not yet synthesized any data for this sector."}
            </p>
        </div>
    );
}
