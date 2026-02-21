"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "./ChatProvider";

export default function NudgeToast() {
    const [latestAlert, setLatestAlert] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const { handleSendMessage } = useChat();

    const checkCriticalAlerts = async () => {
        try {
            const res = await fetch("/api/alerts");
            const alerts = await res.json();

            // Look for critical alerts that haven't been shown in this "session"
            const critical = alerts.find(a => a.severity === "critical" && !a.dismissed);

            if (critical && (!latestAlert || latestAlert.id !== critical.id)) {
                setLatestAlert(critical);
                setIsVisible(true);

                // Auto-hide after 12 seconds
                setTimeout(() => setIsVisible(false), 12000);
            }
        } catch (err) {
            console.error("Failed to check critical alerts:", err);
        }
    };

    useEffect(() => {
        // Initial check after 5 seconds to let UI stabilize
        const initialTimer = setTimeout(checkCriticalAlerts, 5000);

        // Poll for criticals every 2 minutes
        const poll = setInterval(checkCriticalAlerts, 2 * 60 * 1000);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(poll);
        };
    }, [latestAlert]);

    const handleAskAI = () => {
        if (!latestAlert) return;
        handleSendMessage(`What should I do about the critical alert: "${latestAlert.title}"? Context: ${latestAlert.message}`);
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && latestAlert && (
                <motion.div
                    initial={{ opacity: 0, x: 100, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 100, scale: 0.9 }}
                    className="fixed bottom-6 right-6 z-[60] w-full max-w-sm"
                >
                    <div className="relative group overflow-hidden bg-background border-2 border-primary/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl">
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />

                        <div className="p-5 flex flex-col gap-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-primary/10 text-primary animate-pulse">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Autonomous Alert</span>
                                </div>
                                <button
                                    onClick={() => setIsVisible(false)}
                                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="space-y-1">
                                <h4 className="font-bold text-lg leading-tight flex items-center gap-2">
                                    {latestAlert.title}
                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {latestAlert.message}
                                </p>
                            </div>

                            <button
                                onClick={handleAskAI}
                                className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2 group-active:scale-95"
                            >
                                Take Action with AI Advisor
                                <Sparkles className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Progress Bar for Auto-dismiss */}
                        <motion.div
                            initial={{ width: "100%" }}
                            animate={{ width: "0%" }}
                            transition={{ duration: 12, ease: "linear" }}
                            className="h-1 bg-primary/20 absolute bottom-0 left-0"
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
