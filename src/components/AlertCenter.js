"use client";

import { useState, useEffect } from "react";
import { Bell, X, Info, AlertTriangle, TrendingUp, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useChat } from "./ChatProvider";

export default function AlertCenter() {
    const [alerts, setAlerts] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const { handleSendMessage } = useChat();

    const fetchAlerts = async () => {
        try {
            const res = await fetch("/api/alerts");
            const data = await res.json();
            if (Array.isArray(data)) setAlerts(data);
        } catch (err) {
            console.error("Failed to fetch alerts:", err);
        }
    };

    const generateAlerts = async () => {
        try {
            await fetch("/api/alerts/generate", { method: "POST" });
            fetchAlerts();
        } catch (err) {
            console.error("Failed to generate alerts:", err);
        }
    };

    const dismissAlert = async (id) => {
        try {
            await fetch("/api/alerts", {
                method: "PATCH",
                body: JSON.stringify({ alertId: id, dismissed: true }),
            });
            setAlerts(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            console.error("Failed to dismiss alert:", err);
        }
    };

    useEffect(() => {
        fetchAlerts();

        // Polling every 5 minutes only FEETCHES existing alerts
        // It does NOT generate new ones to save Gemini quota
        const poll = setInterval(fetchAlerts, 5 * 60 * 1000);

        return () => {
            clearInterval(poll);
        };
    }, []);

    const unreadCount = alerts.length;

    const getIcon = (type) => {
        switch (type) {
            case "risk": return <AlertTriangle className="h-4 w-4 text-destructive" />;
            case "opportunity": return <TrendingUp className="h-4 w-4 text-primary" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case "critical": return "bg-destructive/10 border-destructive/20 text-destructive";
            case "high": return "bg-orange-500/10 border-orange-500/20 text-orange-500";
            case "medium": return "bg-primary/10 border-primary/20 text-primary";
            default: return "bg-muted border-border text-muted-foreground";
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-muted transition-colors"
                aria-label="Alerts"
            >
                <Bell className="h-5 w-5 text-foreground/70" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-sm">
                        {unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40 bg-transparent"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-3 w-80 z-50 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
                        >
                            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/50">
                                <h3 className="font-bold text-sm tracking-tight uppercase opacity-70">AI Business Nudges</h3>
                                <button
                                    onClick={generateAlerts}
                                    className="text-[10px] font-bold text-primary hover:underline uppercase"
                                >
                                    Refresh
                                </button>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                                {alerts.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Check className="h-8 w-8 text-primary mx-auto mb-2 opacity-20" />
                                        <p className="text-sm text-muted-foreground italic">All clear! No pending alerts.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border">
                                        {alerts.map((alert) => (
                                            <div key={alert.id} className="p-4 hover:bg-muted/30 transition-colors group relative">
                                                <div className="flex gap-3">
                                                    <div className={cn(
                                                        "mt-1 p-1.5 rounded-lg border",
                                                        getSeverityColor(alert.severity)
                                                    )}>
                                                        {getIcon(alert.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-[13px] leading-tight mb-0.5">{alert.title}</p>
                                                        <p className="text-[12px] text-muted-foreground leading-snug">{alert.message}</p>

                                                        <button
                                                            onClick={() => {
                                                                handleSendMessage(`Tell me more about the alert: ${alert.title}. ${alert.message}`);
                                                                setIsOpen(false);
                                                            }}
                                                            className="mt-2 text-[10px] font-bold uppercase text-primary tracking-widest hover:opacity-70 transition-opacity"
                                                        >
                                                            Ask AI Guide →
                                                        </button>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => dismissAlert(alert.id)}
                                                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-muted transition-all"
                                                >
                                                    <X className="h-3 w-3 text-muted-foreground" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
