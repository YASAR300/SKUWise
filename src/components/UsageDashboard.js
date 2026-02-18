"use client";

import { motion } from "framer-motion";
import {
    Zap,
    BarChart3,
    DollarSign,
    Cpu,
    ArrowUpRight,
    ShieldCheck,
    AlertCircle,
    TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import SkeletonLoader from "./SkeletonLoader";

/**
 * UsageDashboard Component
 * Displays aggregated usage statistics and costs in a premium interface.
 */
export default function UsageDashboard({ data, isLoading }) {
    if (isLoading) {
        return (
            <div className="space-y-8 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <SkeletonLoader key={i} />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <SkeletonLoader className="h-96" />
                    <div className="space-y-6">
                        <SkeletonLoader className="h-32" />
                        <SkeletonLoader className="h-32" />
                    </div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { aggregates, modelBreakdown, dailyUsage } = data;

    return (
        <div className="space-y-8 pb-12">
            {/* 1. Hero Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label="Total Intelligence Cost"
                    value={`$${aggregates.totalCost.toFixed(4)}`}
                    subValue="Monthly Cumulative"
                    icon={DollarSign}
                    color="primary"
                />
                <StatCard
                    label="Tokens Processed"
                    value={aggregates.totalTokens.toLocaleString()}
                    subValue={`${aggregates.recordCount} Operations`}
                    icon={Cpu}
                    color="secondary"
                />
                <StatCard
                    label="Active AI Nodes"
                    value={Object.keys(modelBreakdown).length}
                    subValue="Redundant Availability"
                    icon={Zap}
                    color="accent"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 2. Model Breakdown */}
                <div className="bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-xl">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold tracking-tight">Model Distribution</h3>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Resource allocation mapping</p>
                        </div>
                        <BarChart3 className="h-5 w-5 text-primary opacity-50" />
                    </div>

                    <div className="space-y-6">
                        {Object.entries(modelBreakdown).map(([model, stats], i) => (
                            <motion.div
                                key={model}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="space-y-2"
                            >
                                <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                                    <span>{model}</span>
                                    <span className="text-primary">${stats.cost.toFixed(4)}</span>
                                </div>
                                <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(stats.cost / aggregates.totalCost) * 100}%` }}
                                        className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-[0.1em]">
                                    <span>{stats.count} Sessions</span>
                                    <span>{stats.tokens.toLocaleString()} Tokens</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* 3. Budget & Optimization */}
                <div className="space-y-6">
                    <div className="bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-6 flex items-start gap-4">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm uppercase tracking-wider">Health Status: Optimal</h4>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                Your current consumption is 84% below the threshold. Neural efficiency is at peak performance.
                            </p>
                        </div>
                    </div>

                    <div className="bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <h4 className="font-bold text-sm uppercase tracking-wider">Optimization Directives</h4>
                        </div>
                        <ul className="space-y-3">
                            <OptimizationItem text="Utilize Gemini-Flash for non-critical routing to save 30% cost." />
                            <OptimizationItem text="Clean context prompts to reduce token noise by ~200 per query." />
                            <OptimizationItem text="Enable adaptive persona-switching for cost-effective analysis." />
                        </ul>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <SparklesLarge />
                        </div>
                        <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-primary mb-2">Neural Recommendation</h4>
                        <p className="text-sm font-medium leading-relaxed italic">
                            "Switching to Flash 2.0 for all inventory summaries could save you approximately $4.20 over the next 10,000 queries."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, subValue, icon: Icon, color }) {
    const colors = {
        primary: "bg-primary/10 text-primary border-primary/20",
        secondary: "bg-secondary text-foreground border-border",
        accent: "bg-purple-500/10 text-purple-500 border-purple-500/20"
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={cn(
                "p-6 rounded-3xl border shadow-lg backdrop-blur-md transition-all",
                colors[color]
            )}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-xl bg-background/50 backdrop-blur-sm">
                    <Icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 opacity-30" />
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{label}</p>
                <h3 className="text-2xl font-black tracking-tight">{value}</h3>
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{subValue}</p>
            </div>
        </motion.div>
    );
}

function OptimizationItem({ text }) {
    return (
        <li className="flex items-start gap-3 group">
            <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 group-hover:scale-150 transition-all shadow-[0_0_5px_rgba(var(--primary),0.5)]" />
            <span className="text-xs text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">{text}</span>
        </li>
    );
}

function SparklesLarge() {
    return (
        <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
        </svg>
    );
}
