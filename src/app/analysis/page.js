"use client";

import { useState, useEffect } from "react";
import {
    BarChart3,
    TrendingDown,
    TrendingUp,
    AlertTriangle,
    Target,
    Layers,
    Filter,
    ArrowUpRight,
    Zap,
    Shield,
    Activity,
    Search,
    ChevronRight,
    LineChart,
    PieChart,
    Info,
    CheckCircle2,
    Compass
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AnalysisPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState("all");
    const [selectedAsset, setSelectedAsset] = useState(null);

    const fetchAnalysis = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/analysis?category=${category}`);
            const result = await res.json();
            setData(result);
        } catch (err) {
            console.error("Analysis Link Failed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalysis();
    }, [category]);

    const categories = ["all", "Electronics", "Furniture", "Books", "Toys", "Home & Kitchen"];

    return (
        <div className="max-w-[1400px] mx-auto space-y-10 py-12 px-8 relative min-h-screen pb-32">
            {/* Background Grid */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.05]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:48px_48px]"></div>
            </div>

            <header className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-border pb-10">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border scale-90 origin-left">
                        <Compass className="h-3 w-3 text-primary" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground">Strategic_Intelligence_Matrix</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <h1 className="text-4xl font-black text-foreground tracking-tighter leading-none italic">
                            Gap<span className="text-muted-foreground">Analysis</span>
                        </h1>
                        <p className="text-base text-muted-foreground font-medium tracking-tight max-w-lg">
                            Diagnosing competitive disparities and revenue leakage through <span className="text-foreground font-bold">multimodal root-cause synthesis</span>.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-secondary p-1 rounded-xl border border-border overflow-x-auto no-scrollbar max-w-md">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                    category === cat ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-48 bg-secondary/50 rounded-[2rem] animate-pulse" />)}
                </div>
            ) : data && (
                <div className="space-y-10">
                    {/* Key Metrics Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card p-6 rounded-[2rem] border border-border group hover:border-primary/20 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-primary/10 rounded-xl text-primary"><Target className="h-5 w-5" /></div>
                                <Zap className="h-4 w-4 text-muted-foreground/10" />
                            </div>
                            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Market_Price_Gap</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black italic">{data.summary.avgMarketGap}%</span>
                                <TrendingUp className="h-4 w-4 text-rose-500" />
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card p-6 rounded-[2rem] border border-border group hover:border-amber-500/20 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500"><AlertTriangle className="h-5 w-5" /></div>
                                <Shield className="h-4 w-4 text-muted-foreground/10" />
                            </div>
                            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">High_Risk_Assets</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black italic">{data.summary.highRiskAssets}</span>
                                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">Critical_Alerts</span>
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card p-6 rounded-[2rem] border border-border group hover:border-emerald-500/20 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500"><Activity className="h-5 w-5" /></div>
                                <Layers className="h-4 w-4 text-muted-foreground/10" />
                            </div>
                            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Analyzed_Sectors</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black italic">{data.summary.totalAnalyzed}</span>
                                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">Active_Nodes</span>
                            </div>
                        </motion.div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Analysis List */}
                        <div className="lg:col-span-7 space-y-5">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 opacity-60">
                                <Search className="h-3 w-3" /> Competitive_Disparity_Map
                            </h2>
                            <div className="grid gap-3">
                                {data.analysis.map((asset, idx) => (
                                    <motion.div
                                        key={asset.id}
                                        onClick={() => setSelectedAsset(asset)}
                                        className={cn(
                                            "flex items-center justify-between p-4 bg-card border rounded-2xl transition-all cursor-pointer group",
                                            selectedAsset?.id === asset.id ? "border-primary shadow-lg ring-2 ring-primary/5 translate-x-1" : "border-border hover:border-foreground/10"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-10 w-10 rounded-xl flex items-center justify-center text-xs font-black italic",
                                                asset.severity === 'high' ? "bg-rose-500/10 text-rose-500" : "bg-secondary text-muted-foreground"
                                            )}>
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <h4 className="font-black italic text-base tracking-tight uppercase leading-tight">{asset.name}</h4>
                                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{asset.category}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-right">
                                                <p className="text-[8px] font-black text-muted-foreground uppercase mb-0.5">Deviation</p>
                                                <div className={cn("text-sm font-black italic flex items-center gap-1", parseFloat(asset.priceGap) > 0 ? "text-rose-500" : "text-emerald-500")}>
                                                    {asset.priceGap}%
                                                    {parseFloat(asset.priceGap) > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary transition-colors" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Root Cause Diagnosis Panel */}
                        <div className="lg:col-span-5">
                            <div className="sticky top-28">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-5 flex items-center gap-2 opacity-60">
                                    <Activity className="h-3 w-3" /> Root_Cause_Diagnosis
                                </h2>

                                <AnimatePresence mode="wait">
                                    {selectedAsset ? (
                                        <motion.div
                                            key={selectedAsset.id}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="bg-card border border-border rounded-[2.5rem] p-8 space-y-8 overflow-hidden relative"
                                        >
                                            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                                                <Compass className="h-32 w-32" />
                                            </div>

                                            <div className="space-y-1">
                                                <h3 className="text-2xl font-black italic tracking-tighter leading-none">{selectedAsset.name}</h3>
                                                <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Diagnostic_Report_Active</p>
                                            </div>

                                            <div className="relative space-y-8 before:absolute before:left-5 before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-primary/50 before:via-border before:to-transparent">
                                                <div className="relative pl-12">
                                                    <div className="absolute left-0 h-10 w-10 rounded-full bg-secondary border-4 border-card flex items-center justify-center z-10">
                                                        <Activity className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Market_Positioning</p>
                                                        <p className="font-bold text-xs">₹{selectedAsset.ourPrice.toLocaleString()} vs ₹{selectedAsset.avgCompetitorPrice.toLocaleString()}</p>
                                                    </div>
                                                </div>

                                                <div className="relative pl-12">
                                                    <div className="absolute left-0 h-10 w-10 rounded-full bg-secondary border-4 border-card flex items-center justify-center z-10">
                                                        <AlertTriangle className={cn("h-4 w-4", selectedAsset.severity === 'high' ? "text-rose-500" : "text-amber-500")} />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Deviance_Metric</p>
                                                        <p className="text-lg font-black italic underline decoration-primary/30">{selectedAsset.priceGap}% Gap</p>
                                                    </div>
                                                </div>

                                                <div className="relative pl-12">
                                                    <div className="absolute left-0 h-10 w-10 rounded-full bg-foreground border-4 border-card flex items-center justify-center z-10 text-background">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    </div>
                                                    <div className="bg-foreground text-background p-5 rounded-2xl space-y-1 shadow-lg">
                                                        <p className="text-[8px] font-black uppercase tracking-[0.4em] opacity-40">Primary_Diagnosis</p>
                                                        <p className="text-lg font-black italic leading-tight">{selectedAsset.rootCause}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-6 border-t border-border grid grid-cols-2 gap-3">
                                                <div className="p-3 bg-secondary rounded-xl">
                                                    <p className="text-[8px] font-black text-muted-foreground uppercase mb-0.5">Stock</p>
                                                    <p className="font-black italic text-sm">{selectedAsset.stock} Units</p>
                                                </div>
                                                <div className="p-3 bg-secondary rounded-xl">
                                                    <p className="text-[8px] font-black text-muted-foreground uppercase mb-0.5">Customer_Rating</p>
                                                    <p className="font-black italic text-sm">{selectedAsset.rating || 4.5}/5.0</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div className="bg-secondary/10 border border-dashed border-border rounded-[2.5rem] h-[400px] flex flex-col items-center justify-center text-center p-8 space-y-4">
                                            <Compass className="h-10 w-10 text-muted-foreground opacity-10" />
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Select_Node_For_Diagnostic_Flow</p>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
