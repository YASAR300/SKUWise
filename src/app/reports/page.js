"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    TrendingUp,
    Package,
    DollarSign,
    BarChart3,
    RefreshCw,
    Download,
    FileType,
    FileDown,
    FileSpreadsheet,
    ChevronRight,
    Search,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
    Shield,
    PieChart,
    Activity,
    Layers,
    Zap,
    ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchWithRetry } from "@/lib/api-utils";

const REPORT_CATEGORIES = [
    {
        id: "inventory",
        title: "Inventory Intel",
        subtitle: "Asset & Stock Analysis",
        icon: Package,
        accent: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "group-hover:border-blue-500/30",
    },
    {
        id: "margin",
        title: "Margin Strategic",
        subtitle: "Profitability Metrics",
        icon: DollarSign,
        accent: "text-emerald-500",
        bg: "bg-emerald-500/10",
        border: "group-hover:border-emerald-500/30",
    },
    {
        id: "sales",
        title: "Revenue Matrix",
        subtitle: "Performance Velocity",
        icon: TrendingUp,
        accent: "text-indigo-500",
        bg: "bg-indigo-500/10",
        border: "group-hover:border-indigo-500/30",
    },
    {
        id: "competitive",
        title: "Market Edge",
        subtitle: "Category Intelligence",
        icon: BarChart3,
        accent: "text-amber-500",
        bg: "bg-amber-500/10",
        border: "group-hover:border-amber-500/30",
    },
];

const SafeMetric = ({ label, value, isCurrency = false, isPercent = false }) => {
    const formatValue = (val) => {
        if (val === null || val === undefined || isNaN(val)) return "0";
        if (typeof val === "number") {
            if (isCurrency) {
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0
                }).format(val);
            }
            if (isPercent) {
                return `${Number(val).toFixed(2)}%`;
            }
            return Number(val).toLocaleString();
        }
        return val;
    };

    return (
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">{label.replace(/([A-Z])/g, " $1")}</span>
            <div className="flex items-end justify-between">
                <span className="text-2xl font-black text-foreground tracking-tighter leading-none">
                    {formatValue(value)}
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-border" />
            </div>
        </div>
    );
};

export default function ReportsPage() {
    const [selectedType, setSelectedType] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [error, setError] = useState(null);

    async function handleGenerateReport(type) {
        setSelectedType(type);
        setIsGenerating(true);
        setReportData(null);
        setError(null);

        try {
            const res = await fetchWithRetry("/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, format: "json", filters: {} }),
            });

            const data = await res.json();
            if (res.ok) {
                setReportData(data.report);
            } else {
                throw new Error(data.error || "Generation failed");
            }
        } catch (error) {
            console.error("Report error:", error);
            setError(error.message);
        } finally {
            setIsGenerating(false);
        }
    }

    async function handleExport(format) {
        if (!selectedType) return;
        try {
            const res = await fetchWithRetry("/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: selectedType, format, filters: {} }),
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${selectedType}-intel-${new Date().getTime()}.${format === "excel" ? "xlsx" : format}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        } catch (e) {
            console.error("Export error:", e);
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
            {/* Elite Grid Background - Adapts to Theme */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.05] dark:opacity-20">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            </div>

            <div className="relative z-10 max-w-[1400px] mx-auto px-8 py-16">
                {/* Elite Restoration Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 mb-20 border-b border-border pb-12">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border scale-90 origin-left">
                            <Zap className="h-3 w-3 text-foreground fill-foreground" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">Strategic Intel v5.0 Sync</span>
                        </div>
                        <h1 className="text-6xl font-black text-foreground tracking-tighter leading-none italic">
                            Intel<span className="text-muted-foreground">Core</span> <span className="text-border font-thin not-italic">/</span> Reports
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-lg font-medium tracking-tight">
                            Synthesized business intelligence for critical inventory optimization and global performance tracking.
                        </p>
                    </div>

                    {!reportData && !isGenerating && (
                        <div className="flex flex-col items-end gap-2 opacity-50">
                            <div className="h-px w-32 bg-gradient-to-l from-muted-foreground to-transparent" />
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">System Operational</span>
                        </div>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold flex items-center gap-3 mb-12"
                        >
                            <AlertCircle className="h-5 w-5" />
                            {error}. Check data integrity and retry.
                        </motion.div>
                    )}

                    {!reportData && !isGenerating ? (
                        <motion.div
                            key="landing"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                        >
                            {REPORT_CATEGORIES.map((cat, idx) => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleGenerateReport(cat.id)}
                                    className={cn(
                                        "group relative flex flex-col p-8 rounded-3xl bg-card border border-border transition-all duration-300",
                                        "hover:bg-accent hover:border-foreground/20 hover:-translate-y-1 hover:shadow-2xl dark:hover:shadow-none",
                                        cat.border
                                    )}
                                >
                                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-12 transition-all group-hover:scale-110", cat.bg)}>
                                        <cat.icon className={cn("h-6 w-6", cat.accent)} />
                                    </div>
                                    <h3 className="text-2xl font-black text-foreground mb-1 tracking-tight">
                                        {cat.title}
                                    </h3>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-10">
                                        {cat.subtitle}
                                    </p>
                                    <div className="mt-auto pt-8 flex items-center justify-between border-t border-border">
                                        <span className="text-[10px] font-black text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-[0.3em]">Initialize</span>
                                        <ChevronRight className="h-4 w-4 text-border group-hover:text-foreground transition-all group-hover:translate-x-1" />
                                    </div>
                                </button>
                            ))}
                        </motion.div>
                    ) : isGenerating ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-40"
                        >
                            <div className="relative w-24 h-24 mb-12 flex items-center justify-center">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 rounded-full border border-border border-t-foreground"
                                />
                                <RefreshCw className="h-8 w-8 text-foreground animate-pulse" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-foreground">Synthesizing_Matrix</span>
                            <div className="mt-4 flex gap-1.5">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ height: [4, 12, 4] }}
                                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                                        className="w-1 bg-muted-foreground/30"
                                    />
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="report"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* Detailed Summary Scorecard */}
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                {Object.entries(reportData.summary).map(([key, value]) => (
                                    <div key={key} className="p-8 rounded-3xl bg-card border border-border shadow-sm">
                                        <SafeMetric
                                            label={key}
                                            value={value}
                                            isCurrency={key.toLowerCase().includes("value") || key.toLowerCase().includes("revenue") || key.toLowerCase().includes("profit") || key.toLowerCase().includes("cost")}
                                            isPercent={key.toLowerCase().includes("margin") || key.toLowerCase().includes("percent")}
                                        />
                                    </div>
                                ))}
                                <div className="hidden lg:flex p-8 rounded-3xl bg-foreground text-background border border-border flex-col justify-between overflow-hidden relative group">
                                    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
                                        <Layers className="h-10 w-10" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest relative z-10 opacity-70">Verification</span>
                                    <div className="flex items-center gap-2 relative z-10">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-sm font-black italic tracking-tighter uppercase">Operational_Sync</span>
                                    </div>
                                </div>
                            </div>

                            {/* Analysis Control Center */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
                                {/* Side Panel: Insights & Actions */}
                                <div className="lg:col-span-4 flex flex-col gap-6">
                                    <div className="p-10 rounded-[2.5rem] bg-card border border-border flex-1 shadow-sm">
                                        <div className="flex items-center justify-between mb-10 pb-6 border-b border-border">
                                            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-foreground flex items-center gap-3">
                                                <Activity className="h-4 w-4 text-primary" /> Core analysis
                                            </h2>
                                            <Shield className="h-4 w-4 text-muted-foreground opacity-50" />
                                        </div>
                                        <div className="space-y-8">
                                            {reportData.insights.map((insight, i) => (
                                                <div key={i} className="group relative flex gap-5">
                                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground flex-shrink-0" />
                                                    <p className="text-muted-foreground text-sm leading-relaxed font-bold tracking-tight group-hover:text-foreground transition-colors">
                                                        {insight}
                                                    </p>
                                                </div>
                                            ))}
                                            {reportData.insights.length === 0 && (
                                                <div className="flex flex-col items-center py-20 opacity-20 text-center gap-4">
                                                    <Layers className="h-8 w-8" />
                                                    <span className="text-xs font-black uppercase tracking-widest">No critical anomalies detected</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-10 rounded-[2.5rem] bg-card border border-border shadow-sm">
                                        <div className="flex items-center gap-3 mb-8">
                                            <Download className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Export Matrix</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            {[
                                                { label: "Technical PDF", format: "pdf", icon: FileType, color: "text-rose-500", bg: "hover:bg-rose-500/5 group-hover:border-rose-500/20" },
                                                { label: "Data-Lake CSV", format: "csv", icon: FileDown, color: "text-emerald-500", bg: "hover:bg-emerald-500/5 group-hover:border-emerald-500/20" },
                                                { label: "Analytical XLSX", format: "excel", icon: FileSpreadsheet, color: "text-blue-500", bg: "hover:bg-blue-500/5 group-hover:border-blue-500/20" }
                                            ].map((opt) => (
                                                <button
                                                    key={opt.format}
                                                    onClick={() => handleExport(opt.format)}
                                                    className={cn(
                                                        "flex items-center justify-between p-5 rounded-2xl bg-secondary border border-border transition-all group",
                                                        opt.bg
                                                    )}
                                                >
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-foreground">{opt.label}</span>
                                                    <opt.icon className={cn("h-5 w-5 opacity-40 group-hover:opacity-100 transition-all", opt.color)} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => { setReportData(null); setSelectedType(null); }}
                                        className="p-8 rounded-[2rem] border border-border bg-card hover:bg-accent transition-all text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground hover:text-foreground"
                                    >
                                        ← REFRESH_SYSTEM_CORE
                                    </button>
                                </div>

                                {/* Main Data Matrix: Elite Restoration */}
                                <div className="lg:col-span-8">
                                    <div className="rounded-[3rem] bg-card border border-border h-full flex flex-col shadow-sm overflow-hidden border-b-8 border-b-foreground/10">
                                        <div className="p-10 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-8">
                                            <div className="space-y-1">
                                                <h2 className="text-xs font-black uppercase tracking-[0.4em] text-foreground">Active matrix synchronization</h2>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic font-serif">Verified Cluster Data Set 01</p>
                                            </div>
                                            <div className="relative group">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                                                <input
                                                    type="text"
                                                    placeholder="SCAN_DATA_STREAM..."
                                                    className="bg-background border border-border focus:border-foreground/20 rounded-2xl pl-12 pr-6 py-4 text-[10px] font-black tracking-widest uppercase focus:outline-none transition-all w-72 shadow-inner"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto max-h-[800px] custom-scrollbar overflow-x-hidden">
                                            <table className="w-full border-collapse">
                                                <thead className="sticky top-0 bg-card/80 backdrop-blur-md z-20 border-b border-border">
                                                    <tr>
                                                        <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-left">Identity Cluster</th>
                                                        <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-left">Sector</th>
                                                        <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Liquidity</th>
                                                        <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Valuation</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/50">
                                                    {(reportData.data.allProducts || []).slice(0, 50).map((p, idx) => (
                                                        <tr key={p.id} className="hover:bg-accent/30 transition-colors group">
                                                            <td className="px-10 py-8">
                                                                <div className="flex flex-col gap-1.5">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-sm font-black text-foreground group-hover:translate-x-1 transition-transform italic">{p.name}</span>
                                                                        {p.stock <= (p.reorderPoint || 10) && (
                                                                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-[8px] font-black uppercase tracking-widest">Reorder_Required</span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest font-mono">{p.id}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-10 py-8">
                                                                <span className="px-3 py-1.5 rounded-xl bg-secondary text-[9px] font-black uppercase tracking-widest text-muted-foreground border border-border group-hover:border-foreground/10 transition-colors">
                                                                    {p.category || "General"}
                                                                </span>
                                                            </td>
                                                            <td className="px-10 py-8 text-right">
                                                                <span className={cn(
                                                                    "text-sm font-black",
                                                                    (p.stock <= (p.reorderPoint || 10)) ? "text-destructive" : "text-muted-foreground opacity-70"
                                                                )}>
                                                                    {p.stock}
                                                                </span>
                                                            </td>
                                                            <td className="px-10 py-8 text-right font-mono text-sm font-black text-foreground">
                                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p.price || 0)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="p-10 bg-secondary border-t border-border flex items-center justify-between">
                                            <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                                <span>Total Matrix Points: {(reportData.data.allProducts || []).length}</span>
                                                <div className="w-1.5 h-1.5 rounded-full bg-border text-primary animate-pulse" />
                                                <span>Verified Dataset v5.0 Sync</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button className="h-12 w-12 flex items-center justify-center rounded-2xl border border-border text-muted-foreground hover:text-foreground hover:bg-card transition-all"><ChevronRight className="rotate-180 h-5 w-5" /></button>
                                                <button className="h-12 w-12 flex items-center justify-center rounded-2xl border border-border text-muted-foreground hover:text-foreground hover:bg-card transition-all"><ChevronRight className="h-5 w-5" /></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: var(--color-border);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: var(--color-muted-foreground);
                }
            `}</style>
        </div>
    );
}
