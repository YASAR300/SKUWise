"use client";

import { motion } from "framer-motion";
import { AlertTriangle, RefreshCcw, Home, ShieldAlert } from "lucide-react";
import Link from "next/link";

/**
 * ErrorFallback Component
 * A premium, informative fallback UI for when parts of the app crash.
 */
export default function ErrorFallback({ error, reset }) {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-card/50 backdrop-blur-xl border border-destructive/20 rounded-[2rem] p-10 text-center shadow-2xl relative overflow-hidden"
            >
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-destructive/10 blur-[80px] rounded-full -z-10" />

                <div className="inline-flex p-4 rounded-2xl bg-destructive/10 text-destructive mb-6">
                    <ShieldAlert className="h-8 w-8" />
                </div>

                <h1 className="text-2xl font-black tracking-tight mb-2 uppercase">Neural_Interrupt_Detected</h1>
                <p className="text-sm text-muted-foreground font-medium mb-8 leading-relaxed">
                    SKUWise core intelligence hit an unexpected blockage. The operation was suspended safely to protect your data.
                </p>

                {process.env.NODE_ENV === "development" && error && (
                    <div className="mb-8 p-4 bg-secondary/50 rounded-xl text-left border border-border/50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-destructive mb-2">Diagnostic_Dump:</p>
                        <p className="text-[10px] font-mono break-all opacity-70 leading-normal">
                            {error.message}
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => {
                            reset();
                            window.location.reload();
                        }}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                        <RefreshCcw className="h-4 w-4" />
                        Restart_Node
                    </button>
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-secondary text-foreground font-bold text-xs uppercase tracking-widest hover:bg-secondary/80 transition-all border border-border/50"
                    >
                        <Home className="h-4 w-4" />
                        Safe_Sector
                    </Link>
                </div>

                <p className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] opacity-30">
                    SKUWise AI | Resilience Protocol v6.0
                </p>
            </motion.div>
        </div>
    );
}
