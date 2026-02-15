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
    ExternalLink,
    Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

const REPORT_CATEGORIES = [
    {
        id: "inventory",
        title: "Inventory Intelligence",
        subtitle: "Stock Health & Valuation",
        icon: Package,
        color: "zinc",
        accent: "text-blue-400",
        bg: "bg-blue-400/5",
        border: "group-hover:border-blue-500/30",
    },
    {
        id: "margin",
        title: "Margin Strategic",
        subtitle: "Profitability & Cost Analysis",
        icon: DollarSign,
        color: "zinc",
        accent: "text-emerald-400",
        bg: "bg-emerald-400/5",
        border: "group-hover:border-emerald-500/30",
    },
    {
        id: "sales",
        title: "Revenue Dynamics",
        subtitle: "Growth & Performance Trends",
        icon: TrendingUp,
        color: "zinc",
        accent: "text-indigo-400",
        bg: "bg-indigo-400/5",
        border: "group-hover:border-indigo-500/30",
    },
    {
        id: "competitive",
        title: "Market Edge",
        subtitle: "Benchmarking & Gaps",
        icon: BarChart3,
        color: "zinc",
        accent: "text-amber-400",
        bg: "bg-amber-400/5",
        border: "group-hover:border-amber-500/30",
    },
];

const SafeMetric = ({ label, value, prefix = "", suffix = "", isCurrency = false }) => {
    const formattedValue = (val) => {
        if (val === null || val === undefined) return "—";
        if (typeof val === "number") {
            if (isCurrency) {
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0
                }).format(val);
            }
            return val.toLocaleString();
        }
        return val;
    };

    return (
        <div className="flex flex-col">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-1">{label}</span>
            <span className="text-2xl font-black text-white tracking-tight">
                {prefix}{formattedValue(value)}{suffix}
            </span>
        </div>
    );
};

export default function ReportsPage() {
    const [selectedType, setSelectedType] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [error, setError] = useState(null);

    async function handleGenerateReport(type) {
        setSelectedType(type);
        setIsGenerating(true);
        setReportData(null);
        setError(null);

        try {
            const res = await fetch("/api/reports", {
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
            const res = await fetch("/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: selectedType, format, filters: {} }),
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${selectedType}-intel-${Date.now()}.${format === "excel" ? "xlsx" : format}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        } catch (e) { console.error("Export error:", e); }
    }

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans selection:bg-white/10">
            {/* Elite Grid Background */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="absolute inset-0 bg-radial-gradient from-white/5 to-transparent blur-3xl opacity-50"></div>
            </div>

            <div className="relative z-10 max-w-[1400px] mx-auto px-8 py-16">
                {/* Elite Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 mb-20">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 scale-90 origin-left">
                            <Zap className="h-3 w-3 text-white fill-white" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Advanced Intel Core v4.0</span>
                        </div>
                        <h1 className="text-6xl font-black text-white tracking-tighter leading-none">
                            SKU<span className="text-zinc-500">Wise</span> <span className="text-white/20">/</span> Reports
                        </h1>
                        <p className="text-lg text-zinc-500 max-w-lg font-medium tracking-tight">
                            Synthesized business intelligence for strategic inventory optimization and profitability tracking.
                        </p>
                    </div>

                    {!reportData && !isGenerating && (
                        <div className="flex flex-col items-end gap-2">
                            <div className="h-px w-32 bg-gradient-to-l from-white/20 to-transparent" />
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">System Status: Operational</span>
                        </div>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {/* Error State */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold flex items-center gap-3 mb-12"
                        >
                            <AlertCircle className="h-5 w-5" />
                            {error}. Please try again or check data connections.
                        </motion.div>
                    )}

                    {!reportData && !isGenerating ? (
                        <motion.div
                            key="landing"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                        >
                            {REPORT_CATEGORIES.map((cat, idx) => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleGenerateReport(cat.id)}
                                    className={cn(
                                        "group relative flex flex-col p-8 rounded-2xl bg-[#121214] border border-white/5 transition-all duration-300",
                                        "hover:bg-[#18181b] hover:border-white/20 hover:-translate-y-1",
                                        cat.border
                                    )}
                                >
                                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-12 transition-all group-hover:scale-110", cat.bg)}>
                                        <cat.icon className={cn("h-6 w-6", cat.accent)} />
                                    </div>
                                    <h3 className="text-xl font-black text-white mb-1 group-hover:text-white transition-colors">
                                        {cat.title}
                                    </h3>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6">
                                        {cat.subtitle}
                                    </p>
                                    <div className="mt-auto pt-8 flex items-center justify-between border-t border-white/5">
                                        <span className="text-[10px] font-black text-zinc-600 group-hover:text-white transition-colors uppercase tracking-[0.2em]">Generate</span>
                                        <ChevronRight className="h-4 w-4 text-zinc-700 group-hover:text-white transition-all group-hover:translate-x-1" />
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
                            <div className="relative w-24 h-24 mb-12">
                                <div className="absolute inset-0 rounded-full border border-white/10 border-t-white animate-spin" />
                                <RefreshCw className="absolute inset-0 m-auto h-8 w-8 text-white animate-pulse" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white">Processing Intelligence</span>
                            <div className="mt-4 flex gap-1">
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="w-1 h-3 bg-white/20 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="report"
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* Summary Bar */}
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                {Object.entries(reportData.summary).map(([key, value], idx) => (
                                    <div key={key} className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                                        <SafeMetric
                                            label={key}
                                            value={value}
                                            isCurrency={key.toLowerCase().includes("value") || key.toLowerCase().includes("revenue") || key.toLowerCase().includes("profit")}
                                        />
                                    </div>
                                ))}
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Source Alpha</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-sm font-bold text-white">LIVE_SYNC</span>
                                    </div>
                                </div>
                            </div>

                            {/* Main Analysis Engine */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Insights Panel */}
                                <div className="lg:col-span-4 flex flex-col gap-6">
                                    <div className="p-8 rounded-3xl bg-[#121214] border border-white/5 flex-1 ring-1 ring-white/5">
                                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white flex items-center gap-3">
                                                <PieChart className="h-4 w-4 text-zinc-500" /> Analytical Insights
                                            </h2>
                                            <Shield className="h-4 w-4 text-white/20" />
                                        </div>
                                        <div className="space-y-6">
                                            {reportData.insights.map((insight, i) => (
                                                <div key={i} className="group relative flex gap-4 p-4 rounded-xl hover:bg-white/5 transition-all">
                                                    <div className="mt-1 w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] flex-shrink-0" />
                                                    <p className="text-zinc-400 text-[13px] leading-relaxed font-medium group-hover:text-zinc-200">
                                                        {insight}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-8 rounded-3xl bg-[#121214] border border-white/5">
                                        <div className="flex items-center gap-3 mb-6">
                                            <Download className="h-4 w-4 text-zinc-500" />
                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Exports</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                            {[
                                                { label: "Intelligence PDF", format: "pdf", icon: FileType, color: "text-red-400" },
                                                { label: "Dataset CSV", format: "csv", icon: FileDown, color: "text-emerald-400" },
                                                { label: "Matrix XLS", format: "excel", icon: FileSpreadsheet, color: "text-blue-400" }
                                            ].map((opt) => (
                                                <button
                                                    key={opt.format}
                                                    onClick={() => handleExport(opt.format)}
                                                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                                                >
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                                                    <opt.icon className={cn("h-4 w-4 opacity-40 group-hover:opacity-100 transition-all", opt.color)} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => { setReportData(null); setSelectedType(null); }}
                                        className="p-6 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-black uppercase tracking-[0.5em] transition-all text-zinc-500 hover:text-white"
                                    >
                                        ← REFRESH_SYSTEM
                                    </button>
                                </div>

                                {/* Detailed Matrix */}
                                <div className="lg:col-span-8">
                                    <div className="rounded-3xl bg-[#121214] border border-white/5 h-full flex flex-col ring-1 ring-white/5 overflow-hidden">
                                        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white mb-1">Detailed Matrix</h2>
                                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Active SKU Synchronization</p>
                                            </div>
                                            <div className="relative group">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                                                <input
                                                    type="text"
                                                    placeholder="SCAN_OBJECTS..."
                                                    className="bg-[#09090b] border border-white/5 focus:border-white/20 rounded-xl pl-10 pr-4 py-3 text-[10px] font-bold tracking-widest uppercase focus:outline-none transition-all w-64"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto max-h-[700px] custom-scrollbar">
                                            <table className="w-full">
                                                <thead className="sticky top-0 bg-[#121214] z-10 border-b border-white/5">
                                                    <tr>
                                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-600 text-left">Entity</th>
                                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-600 text-left">Sector</th>
                                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-600 text-right">Liquidity</th>
                                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-600 text-right">Valuation</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {(reportData.data.allProducts || []).slice(0, 50).map((p) => (
                                                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                                                            <td className="px-8 py-6">
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{p.name}</span>
                                                                    <span className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em] mt-1">{p.sku}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <span className="px-3 py-1 rounded-full bg-white/5 text-[9px] font-black uppercase tracking-widest text-zinc-500 border border-white/5">
                                                                    {p.category || "General"}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-6 text-right">
                                                                <span className={cn(
                                                                    "text-sm font-black",
                                                                    (p.stock <= (p.reorderPoint || 10)) ? "text-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.2)]" : "text-zinc-500"
                                                                )}>
                                                                    {p.stock}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-6 text-right font-mono text-sm font-bold text-emerald-500/80">
                                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p.price)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="p-8 bg-black/20 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                            <div className="flex items-center gap-4">
                                                <span>Total Matrix Points: {(reportData.data.allProducts || []).length}</span>
                                                <div className="w-1 h-1 rounded-full bg-zinc-800" />
                                                <span>Viewing First 50 Clusters</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button className="h-10 w-10 flex items-center justify-center rounded-xl border border-white/5 hover:bg-white/5 transition-all"><ChevronRight className="rotate-180 h-4 w-4" /></button>
                                                <button className="h-10 w-10 flex items-center justify-center rounded-xl border border-white/5 hover:bg-white/5 transition-all"><ChevronRight className="h-4 w-4" /></button>
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
                    background: #27272a;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #3f3f46;
                }
            `}</style>
        </div>
    );
}
