"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FileText,
    Download,
    TrendingUp,
    Package,
    DollarSign,
    BarChart3,
    Loader2,
    FileDown,
    FileSpreadsheet,
    FileType,
    Calendar,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    ShieldCheck,
    AlertTriangle,
    LayoutDashboard,
    PieChart,
    ChevronRight,
    Search,
    RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

const REPORT_TYPES = [
    {
        id: "inventory",
        title: "Inventory Health",
        description: "Stock levels, valuation, and reorder alerts",
        icon: Package,
        color: "from-blue-500/20 to-indigo-500/20",
        iconColor: "text-blue-500",
        borderColor: "hover:border-blue-500/50",
    },
    {
        id: "margin",
        title: "Margin Analysis",
        description: "Profitability, costs, and pricing efficiency",
        icon: DollarSign,
        color: "from-emerald-500/20 to-teal-500/20",
        iconColor: "text-emerald-500",
        borderColor: "hover:border-emerald-500/50",
    },
    {
        id: "sales",
        title: "Sales Performance",
        description: "Revenue trends and top-performing products",
        icon: TrendingUp,
        color: "from-violet-500/20 to-purple-500/20",
        iconColor: "text-violet-500",
        borderColor: "hover:border-violet-500/50",
    },
    {
        id: "competitive",
        title: "Market Insights",
        description: "Competitive gaps and category benchmarking",
        icon: BarChart3,
        color: "from-amber-500/20 to-orange-500/20",
        iconColor: "text-amber-500",
        borderColor: "hover:border-amber-500/50",
    },
];

export default function ReportsPage() {
    const [selectedType, setSelectedType] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [activeTab, setActiveTab] = useState("summary");
    const [hoveredType, setHoveredType] = useState(null);

    async function handleGenerateReport(type) {
        setSelectedType(type);
        setIsGenerating(true);
        setReportData(null);

        try {
            const res = await fetch("/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type,
                    format: "json",
                    filters: {},
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setReportData(data.report);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error("Failed to generate report:", error);
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
                body: JSON.stringify({
                    type: selectedType,
                    format,
                    filters: {},
                }),
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${selectedType}-report-${Date.now()}.${format === "excel" ? "xlsx" : format}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error("Failed to export report:", error);
        }
    }

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(val);
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-24">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 mb-4"
                        >
                            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                                <LayoutDashboard className="h-6 w-6 text-primary" />
                            </div>
                            <span className="text-sm font-bold tracking-[0.3em] uppercase text-primary">Strategic Analytics</span>
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl font-black tracking-tight"
                        >
                            Business <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-400">Reports</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-slate-400 mt-4 max-w-xl text-lg leading-relaxed"
                        >
                            Generate high-fidelity intelligence reports using core inventory metrics and AI-driven growth analysis.
                        </motion.p>
                    </div>

                    {!reportData && !isGenerating && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-3 p-1 rounded-full bg-slate-900/50 border border-slate-800 backdrop-blur-xl"
                        >
                            {['Daily', 'Weekly', 'Quarterly'].map((period) => (
                                <button key={period} className={cn(
                                    "px-6 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all",
                                    period === 'Daily' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:text-slate-300"
                                )}>
                                    {period}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {!reportData && !isGenerating ? (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-8"
                        >
                            {REPORT_TYPES.map((report, idx) => (
                                <motion.button
                                    key={report.id}
                                    initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    onMouseEnter={() => setHoveredType(report.id)}
                                    onMouseLeave={() => setHoveredType(null)}
                                    onClick={() => handleGenerateReport(report.id)}
                                    className={cn(
                                        "group relative flex flex-col p-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/40 backdrop-blur-2xl transition-all duration-500 text-left overflow-hidden",
                                        report.borderColor,
                                        hoveredType === report.id && "translate-y-[-8px] shadow-2xl shadow-primary/10 border-primary/30"
                                    )}
                                >
                                    {/* Gradient Overlay */}
                                    <div className={cn(
                                        "absolute inset-0 bg-gradient-to-br transition-opacity duration-500 opacity-0 group-hover:opacity-100",
                                        report.color
                                    )} />

                                    <div className="relative z-10">
                                        <div className={cn(
                                            "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6",
                                            "bg-slate-800 border border-slate-700 shadow-inner"
                                        )}>
                                            <report.icon className={cn("h-8 w-8", report.iconColor)} />
                                        </div>

                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-2xl font-black tracking-tight">{report.title}</h3>
                                            <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-primary transition-all group-hover:translate-x-1" />
                                        </div>
                                        <p className="text-slate-400 text-sm leading-relaxed max-w-[80%] uppercase tracking-widest font-medium opacity-60">
                                            {report.description}
                                        </p>
                                    </div>

                                    {/* Decorative Circles */}
                                    <div className="absolute right-[-20px] bottom-[-20px] w-40 h-40 bg-white/5 blur-3xl rounded-full" />
                                </motion.button>
                            ))}
                        </motion.div>
                    ) : isGenerating ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-32"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-[60px] animate-pulse rounded-full" />
                                <RefreshCw className="h-20 w-20 animate-spin text-primary relative z-10" />
                            </div>
                            <h2 className="text-3xl font-black tracking-[0.2em] uppercase mt-12 mb-4">Synthesizing Data</h2>
                            <p className="text-slate-500 font-mono tracking-tighter">COLLECTING_DATAPOINTS // AGGREGATING_INSIGHTS // MAPPING_TRENDS</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="report"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-8"
                        >
                            {/* Summary Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {Object.entries(reportData.summary).map(([key, value], idx) => (
                                    <motion.div
                                        key={key}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="p-8 rounded-[2rem] border border-slate-800 bg-slate-900/50 backdrop-blur-xl group hover:border-primary/30 transition-all shadow-xl"
                                    >
                                        <p className="text-slate-500 text-[10px] font-black tracking-[0.2em] uppercase mb-1">
                                            {key.replace(/([A-Z])/g, " $1").trim()}
                                        </p>
                                        <div className="flex items-end justify-between">
                                            <p className="text-3xl font-black tracking-tight">
                                                {typeof value === "number" && (key.includes("Value") || key.includes("Revenue") || key.includes("Profit"))
                                                    ? formatCurrency(value)
                                                    : value.toLocaleString()}
                                            </p>
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                {idx % 2 === 0 ? <ArrowUpRight className="h-4 w-4 text-emerald-400" /> : <TrendingUp className="h-4 w-4 text-primary" />}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Main Content Area */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Insights Panel */}
                                <div className="lg:col-span-1 space-y-6">
                                    <div className="p-8 rounded-[2.5rem] border border-slate-800 bg-[#0f172a] shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4">
                                            <ShieldCheck className="h-5 w-5 text-primary opacity-20" />
                                        </div>
                                        <h2 className="text-xl font-black tracking-widest uppercase mb-8 flex items-center gap-2">
                                            <PieChart className="h-5 w-5 text-primary" /> Key Analysis
                                        </h2>
                                        <div className="space-y-6">
                                            {reportData.insights.map((insight, i) => (
                                                <div key={i} className="flex gap-4 group">
                                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary ring-4 ring-primary/10" />
                                                    <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-200 transition-colors">
                                                        {insight}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/40 backdrop-blur-lg">
                                        <h2 className="text-lg font-black tracking-widest uppercase mb-6 flex items-center gap-2">
                                            <Download className="h-5 w-5 text-emerald-500" /> Export Assets
                                        </h2>
                                        <div className="grid grid-cols-1 gap-3">
                                            <button
                                                onClick={() => handleExport("pdf")}
                                                className="flex items-center justify-between p-4 rounded-2xl bg-[#ef4444]/10 border border-[#ef4444]/20 hover:bg-[#ef4444]/20 transition-all text-sm font-bold uppercase tracking-widest text-[#ef4444]"
                                            >
                                                <span>Standard PDF</span>
                                                <FileType className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleExport("csv")}
                                                className="flex items-center justify-between p-4 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 hover:bg-[#10b981]/20 transition-all text-sm font-bold uppercase tracking-widest text-[#10b981]"
                                            >
                                                <span>Data Sheet CSV</span>
                                                <FileDown className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleExport("excel")}
                                                className="flex items-center justify-between p-4 rounded-2xl bg-[#3b82f6]/10 border border-[#3b82f6]/20 hover:bg-[#3b82f6]/20 transition-all text-sm font-bold uppercase tracking-widest text-[#3b82f6]"
                                            >
                                                <span>XLSX Workbook</span>
                                                <FileSpreadsheet className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => { setReportData(null); setSelectedType(null); }}
                                        className="w-full p-6 rounded-[2rem] border border-slate-800 bg-slate-900/20 hover:bg-slate-900/40 transition-all text-xs font-black tracking-[0.3em] uppercase text-slate-500 hover:text-slate-300"
                                    >
                                        ← New Intelligence Request
                                    </button>
                                </div>

                                {/* Detailed Data Panel */}
                                <div className="lg:col-span-2">
                                    <div className="rounded-[2.5rem] border border-slate-800 bg-[#0f172a] shadow-2xl overflow-hidden h-full flex flex-col">
                                        <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                                            <h2 className="text-xl font-black tracking-widest uppercase flex items-center gap-2">
                                                <BarChart3 className="h-5 w-5 text-primary" /> Integrated Data Lake
                                            </h2>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                                                <input
                                                    type="text"
                                                    placeholder="FILTER_RECORDS..."
                                                    className="bg-slate-950/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs font-mono tracking-tighter focus:outline-none focus:border-primary/50 transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto max-h-[700px]">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="border-b border-slate-800 bg-slate-900/20">
                                                        <th className="px-8 py-5 text-[10px] font-black tracking-widest text-slate-500 uppercase">Identity</th>
                                                        <th className="px-8 py-5 text-[10px] font-black tracking-widest text-slate-500 uppercase">Sector</th>
                                                        <th className="px-8 py-5 text-[10px] font-black tracking-widest text-slate-500 uppercase text-right">Liquidity</th>
                                                        <th className="px-8 py-5 text-[10px] font-black tracking-widest text-slate-500 uppercase text-right">Valuation</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800/50">
                                                    {reportData.data.allProducts?.slice(0, 30).map((product) => (
                                                        <tr key={product.id} className="hover:bg-primary/5 transition-colors group">
                                                            <td className="px-8 py-5">
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-slate-200 text-sm group-hover:text-primary transition-colors">{product.name}</span>
                                                                    <span className="text-[10px] font-mono text-slate-600 uppercase mt-0.5 tracking-tighter">{product.sku}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5">
                                                                <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-slate-800 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                                    {product.category || "General"}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-5 text-right">
                                                                {product.stock <= (product.reorderPoint || 10) ? (
                                                                    <div className="flex items-center justify-end gap-2 text-rose-500 font-black">
                                                                        <AlertTriangle className="h-3 w-3" />
                                                                        <span>{product.stock}</span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="font-bold text-slate-400">{product.stock}</span>
                                                                )}
                                                            </td>
                                                            <td className="px-8 py-5 text-right font-mono font-bold text-emerald-500/80">
                                                                {formatCurrency(product.price)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="p-6 bg-slate-900/50 border-t border-slate-800 flex items-center justify-between text-[10px] font-black tracking-[0.3em] uppercase text-slate-600">
                                            <span>Showing top 30 intelligence points</span>
                                            <span className="flex items-center gap-4">
                                                <span>PAGE_01 // OFFSET_00</span>
                                                <div className="flex gap-2">
                                                    <button className="h-8 w-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center hover:text-slate-300">←</button>
                                                    <button className="h-8 w-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center hover:text-slate-300">→</button>
                                                </div>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
