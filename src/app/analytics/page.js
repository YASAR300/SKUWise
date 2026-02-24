"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    TrendingUp,
    TrendingDown,
    Package,
    DollarSign,
    ShoppingCart,
    Star,
    AlertTriangle,
    BarChart3,
    Layers,
    Zap,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    Activity,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { fetchWithRetry } from "@/lib/api-utils";

// ── Helper: Format currency ──
const fmt = (n) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);
const fmtShort = (n) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
    return fmt(n);
};

// ── Sparkline SVG component ──
function Sparkline({ data = [], color = "var(--color-primary)", height = 40, width = 120 }) {
    if (!data || data.length < 2) return null;
    const vals = data.map((d) => (typeof d === "number" ? d : d.revenue ?? d.value ?? 0));
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    const pts = vals.map((v, i) => {
        const x = (i / (vals.length - 1)) * width;
        const y = height - ((v - min) / range) * height;
        return `${x},${y}`;
    });
    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" className="opacity-80">
            <polyline points={pts.join(" ")} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ── Bar chart component ──
function BarChart({ data = [], valueKey = "revenue", labelKey = "name", color = "var(--color-primary)" }) {
    if (!data.length) return null;
    const vals = data.map((d) => d[valueKey] || 0);
    const max = Math.max(...vals) || 1;
    return (
        <div className="flex items-end gap-1.5 h-28 w-full">
            {data.map((d, i) => {
                const pct = (d[valueKey] / max) * 100;
                return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer">
                        <div className="relative w-full flex flex-col items-center">
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-1 px-2 py-1 rounded-lg bg-popover border border-border text-[9px] font-black whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md">
                                {fmtShort(d[valueKey])}
                            </div>
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${pct}%` }}
                                transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }}
                                style={{ background: color, width: "100%", minHeight: "2px" }}
                                className="rounded-t-md opacity-80 group-hover:opacity-100 transition-opacity"
                            />
                        </div>
                        <span className="text-[7px] font-black text-muted-foreground uppercase truncate max-w-full px-0.5">{(d[labelKey] || "").slice(0, 5)}</span>
                    </div>
                );
            })}
        </div>
    );
}

// ── Donut chart SVG ──
function DonutChart({ healthy = 0, low = 0, out = 0 }) {
    const total = healthy + low + out || 1;
    const colors = ["#10b981", "#f59e0b", "#ef4444"];
    const vals = [healthy, low, out];
    const labels = ["Healthy", "Low", "Out"];
    const r = 40;
    const circumference = 2 * Math.PI * r;
    let offset = 0;
    const segments = vals.map((v, i) => {
        const pct = v / total;
        const dash = pct * circumference;
        const gap = circumference - dash;
        const seg = { stroke: colors[i], dash, gap, offset, label: labels[i], value: v };
        offset += dash;
        return seg;
    });
    return (
        <div className="flex items-center gap-6">
            <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-secondary)" strokeWidth="14" />
                {segments.map((s, i) => (
                    <motion.circle
                        key={i}
                        cx="50" cy="50" r={r}
                        fill="none"
                        stroke={s.stroke}
                        strokeWidth="14"
                        strokeDasharray={`${s.dash} ${s.gap}`}
                        strokeDashoffset={-s.offset}
                        strokeLinecap="round"
                        initial={{ strokeDasharray: `0 ${circumference}` }}
                        animate={{ strokeDasharray: `${s.dash} ${s.gap}` }}
                        transition={{ duration: 1, delay: i * 0.2, ease: "easeOut" }}
                        style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
                    />
                ))}
                <text x="50" y="54" textAnchor="middle" className="fill-foreground font-black text-[14px]" style={{ fontFamily: "inherit" }}>
                    {total}
                </text>
            </svg>
            <div className="flex flex-col gap-2">
                {segments.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.stroke }} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{s.label}</span>
                        <span className="text-[10px] font-black text-foreground ml-auto pl-2">{s.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Revenue Line Chart ──
function RevenueLineChart({ data = [] }) {
    if (!data.length) return <div className="h-32 flex items-center justify-center opacity-20 text-xs font-black uppercase tracking-widest">No Revenue Data</div>;
    const vals = data.map((d) => d.revenue);
    const min = Math.min(...vals);
    const max = Math.max(...vals) || 1;
    const W = 500;
    const H = 80;
    const pad = 8;
    const pts = data.map((d, i) => {
        const x = pad + (i / (data.length - 1)) * (W - pad * 2);
        const y = H - pad - ((d.revenue - min) / (max - min || 1)) * (H - pad * 2);
        return { x, y, ...d };
    });
    const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");
    const areaD = `${pathD} L ${pts[pts.length - 1].x},${H} L ${pts[0].x},${H} Z`;

    return (
        <div className="w-full overflow-hidden">
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="overflow-visible">
                <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <motion.path d={areaD} fill="url(#revGrad)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} />
                <motion.path
                    d={pathD}
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                />
                {pts.map((p, i) => (
                    <g key={i} className="group cursor-pointer">
                        <circle cx={p.x} cy={p.y} r="5" fill="var(--color-card)" stroke="var(--color-primary)" strokeWidth="2" />
                        <title>{`${p.date}: ${fmtShort(p.revenue)}`}</title>
                    </g>
                ))}
            </svg>
            {/* X axis labels */}
            <div className="flex justify-between mt-1">
                {[data[0], data[Math.floor(data.length / 2)], data[data.length - 1]].filter(Boolean).map((d, i) => (
                    <span key={i} className="text-[8px] font-black text-muted-foreground uppercase tracking-wider">{d.date}</span>
                ))}
            </div>
        </div>
    );
}

// ── KPI Card ──
function KpiCard({ icon: Icon, label, value, sub, trend, color = "text-primary", bg = "bg-primary/10", delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay, ease: "easeOut" }}
            className="relative bg-card p-6 rounded-[2rem] border border-border hover:border-foreground/10 hover:shadow-lg transition-all group overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/[0.03] group-hover:to-primary/[0.06] transition-all" />
            <div className="relative flex justify-between items-start mb-5">
                <div className={cn("p-2.5 rounded-xl", bg)}>
                    <Icon className={cn("h-4 w-4", color)} />
                </div>
                {trend !== undefined && (
                    <div className={cn("flex items-center gap-1 text-[10px] font-black", trend >= 0 ? "text-emerald-500" : "text-rose-500")}>
                        {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div className="relative space-y-0.5">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
                <p className="text-2xl font-black tracking-tighter text-foreground leading-none">{value}</p>
                {sub && <p className="text-[9px] text-muted-foreground font-bold mt-1">{sub}</p>}
            </div>
        </motion.div>
    );
}

export default function AnalyticsPage() {
    const { status } = useSession();
    const router = useRouter();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async (signal, quiet = false) => {
        if (!quiet) setLoading(true);
        else setRefreshing(true);
        setError(null);
        try {
            const res = await fetchWithRetry("/api/analytics", { signal });
            if (res.status === 401) { router.push("/login"); return; }
            if (!res.ok) throw new Error(`API error ${res.status}`);
            const json = await res.json();
            setData(json);
        } catch (err) {
            if (err.name === "AbortError") return;
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [router]);

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
        else if (status === "authenticated") {
            const ctrl = new AbortController();
            fetchData(ctrl.signal);
            return () => ctrl.abort();
        }
    }, [status, router, fetchData]);

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="h-12 w-12 rounded-full border-2 border-border border-t-foreground"
                />
                <p className="text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground animate-pulse">
                    Synthesizing_Analytics_Matrix...
                </p>
            </div>
        );
    }

    const { kpis, revenueTrend, categoryBreakdown, topProducts, stockHealth } = data || {};

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Subtle Grid */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.06]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:32px_32px]" />
            </div>

            <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-12 space-y-8">

                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border">
                            <Activity className="h-3 w-3 text-primary animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground opacity-70">
                                Performance_Intelligence_Engine v2.0
                            </span>
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter leading-none italic">
                            Analytics<span className="text-muted-foreground font-thin not-italic">/</span>
                            <span className="text-primary">Dashboard</span>
                        </h1>
                        <p className="text-base text-muted-foreground font-medium max-w-xl">
                            Real-time business intelligence — revenue flow, stock health, and category performance.
                        </p>
                    </div>
                    <button
                        onClick={() => fetchData(new AbortController().signal, true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-border bg-card hover:bg-accent transition-all text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground self-start md:self-auto"
                    >
                        <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
                        {refreshing ? "Syncing..." : "Refresh_Matrix"}
                    </button>
                </div>

                {error && (
                    <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                        {error} — check your server logs.
                    </div>
                )}

                {/* ── KPI Row ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard icon={DollarSign} label="Total_Revenue" value={fmtShort(kpis?.totalRevenue)} sub={`${kpis?.totalUnitsSold?.toLocaleString()} units sold`} color="text-emerald-500" bg="bg-emerald-500/10" delay={0} />
                    <KpiCard icon={Package} label="Catalog_Size" value={kpis?.totalProducts?.toLocaleString() || "0"} sub={`${kpis?.lowStockCount || 0} low-stock alerts`} color="text-blue-500" bg="bg-blue-500/10" delay={0.05} />
                    <KpiCard icon={AlertTriangle} label="Stock_Alerts" value={kpis?.lowStockCount || 0} sub={`${kpis?.outOfStockCount || 0} out of stock`} color="text-amber-500" bg="bg-amber-500/10" delay={0.1} />
                    <KpiCard icon={Star} label="Avg_Rating" value={`${kpis?.avgRating || 0}/5`} sub={`${kpis?.highMarginCount || 0} high-margin SKUs`} color="text-violet-500" bg="bg-violet-500/10" delay={0.15} />
                </div>

                {/* ── Second KPI Row (Inventory Value) ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                    <div className="md:col-span-2 bg-foreground text-background p-8 rounded-[2.5rem] flex items-center justify-between gap-6 relative overflow-hidden">
                        <motion.div
                            animate={{ scale: [1, 1.1, 1], opacity: [0.05, 0.1, 0.05] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="absolute right-0 top-0 w-64 h-64 rounded-full bg-white pointer-events-none"
                        />
                        <div className="space-y-2 relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-50">Inventory_Net_Value</p>
                            <p className="text-4xl font-black tracking-tighter leading-none">{fmtShort(kpis?.totalInventoryValue)}</p>
                            <p className="text-[10px] font-bold opacity-60">Across {kpis?.totalProducts} cataloged assets</p>
                        </div>
                        <Layers className="h-12 w-12 opacity-10 flex-shrink-0 relative z-10" />
                    </div>
                    <div className="bg-card border border-border rounded-[2.5rem] p-8 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">Margin_Matrix</span>
                            <BarChart3 className="h-4 w-4 text-muted-foreground/30" />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">High Margin (&gt;40%)</span>
                                <span className="text-lg font-black">{kpis?.highMarginCount || 0}</span>
                            </div>
                            <div className="h-px bg-border" />
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Low Margin (&lt;20%)</span>
                                <span className="text-lg font-black">{kpis?.lowMarginCount || 0}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── Charts Row 1: Revenue Trend + Stock Health ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Trend */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.25 }}
                        className="lg:col-span-2 bg-card border border-border rounded-[2.5rem] p-8"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Revenue_Velocity_Chart</h2>
                                <p className="text-xl font-black tracking-tighter mt-1">Sales Trend</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Live_Data</span>
                            </div>
                        </div>
                        {revenueTrend?.length > 1 ? (
                            <RevenueLineChart data={revenueTrend} />
                        ) : (
                            <div className="h-24 flex items-center justify-center opacity-20">
                                <p className="text-[10px] font-black uppercase tracking-widest">No_Sales_Data_Available</p>
                            </div>
                        )}
                    </motion.div>

                    {/* Stock Health Donut */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="bg-card border border-border rounded-[2.5rem] p-8 flex flex-col"
                    >
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-2">Stock_Health_Matrix</h2>
                        <p className="text-xl font-black tracking-tighter mb-6">Inventory Status</p>
                        <div className="flex-1 flex items-center justify-center">
                            <DonutChart
                                healthy={stockHealth?.healthy || 0}
                                low={stockHealth?.low || 0}
                                out={stockHealth?.out || 0}
                            />
                        </div>
                    </motion.div>
                </div>

                {/* ── Charts Row 2: Category + Top Products ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Category Revenue Bars */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.35 }}
                        className="bg-card border border-border rounded-[2.5rem] p-8"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Category_Revenue_Matrix</h2>
                                <p className="text-xl font-black tracking-tighter mt-1">By Category</p>
                            </div>
                            <Zap className="h-4 w-4 text-muted-foreground/20" />
                        </div>
                        {categoryBreakdown?.length > 0 ? (
                            <BarChart data={categoryBreakdown} valueKey="revenue" labelKey="name" color="var(--color-primary)" />
                        ) : (
                            <div className="h-28 flex items-center justify-center opacity-20">
                                <p className="text-[10px] font-black uppercase tracking-widest">No_Category_Data</p>
                            </div>
                        )}
                    </motion.div>

                    {/* Top Products Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="bg-card border border-border rounded-[2.5rem] p-8 overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Revenue_Leaders</h2>
                                <p className="text-xl font-black tracking-tighter mt-1">Top Products</p>
                            </div>
                            <TrendingUp className="h-4 w-4 text-muted-foreground/20" />
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {topProducts?.length > 0 ? topProducts.map((p, i) => (
                                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors group">
                                    <span className="text-[9px] font-black text-muted-foreground w-4 flex-shrink-0 italic">{i + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black truncate group-hover:translate-x-0.5 transition-transform">{p.name}</p>
                                        <p className="text-[8px] text-muted-foreground uppercase tracking-widest">{p.category}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-xs font-black text-emerald-500">{fmtShort(p.revenue)}</p>
                                        <p className="text-[8px] text-muted-foreground">{p.unitsSold} sold</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-12 flex items-center justify-center opacity-20">
                                    <p className="text-[10px] font-black uppercase tracking-widest">No_Sales_Recorded</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* ── Category Deep-Dive Table ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.45 }}
                    className="bg-card border border-border rounded-[2.5rem] p-8"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sector_Intelligence_Matrix</h2>
                            <p className="text-xl font-black tracking-tighter mt-1">Category Breakdown</p>
                        </div>
                        <BarChart3 className="h-4 w-4 text-muted-foreground/20" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    {["Category", "Products", "Stock Units", "Inventory Value", "Revenue"].map((h) => (
                                        <th key={h} className="pb-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-left px-2">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {categoryBreakdown?.length > 0 ? categoryBreakdown.map((cat, i) => (
                                    <tr key={i} className="hover:bg-accent/30 transition-colors group">
                                        <td className="py-4 px-2">
                                            <span className="text-sm font-black group-hover:translate-x-1 transition-transform inline-block">{cat.name}</span>
                                        </td>
                                        <td className="py-4 px-2 text-sm font-bold text-muted-foreground">{cat.productCount}</td>
                                        <td className="py-4 px-2">
                                            <span className={cn("text-sm font-black", cat.stock < 10 ? "text-rose-500" : "text-foreground")}>{cat.stock.toLocaleString()}</span>
                                        </td>
                                        <td className="py-4 px-2 text-sm font-bold">{fmtShort(cat.totalValue)}</td>
                                        <td className="py-4 px-2">
                                            <span className={cn("text-sm font-black", cat.revenue > 0 ? "text-emerald-500" : "text-muted-foreground")}>{fmtShort(cat.revenue)}</span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="py-16 text-center opacity-20">
                                            <p className="text-[10px] font-black uppercase tracking-widest">No_Sector_Data_Available</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}
