"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    LayoutDashboard,
    BarChart3,
    Zap,
    History,
    RefreshCw,
    Shield
} from "lucide-react";
import UsageDashboard from "@/components/UsageDashboard";
import { fetchWithRetry } from "@/lib/api-utils";

export default function UsagePage() {
    const [usageData, setUsageData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUsage = async () => {
        setIsLoading(true);
        try {
            const res = await fetchWithRetry("/api/usage");
            if (res.ok) {
                const data = await res.json();
                setUsageData(data);
            }
        } catch (error) {
            console.error("Failed to fetch usage:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsage();
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Shield className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">System_Resources</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                        Operational <span className="text-primary italic">Intelligence</span>
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-xl text-sm font-medium leading-relaxed">
                        Track neural consumption, API routing performance, and real-time computation costs across your SKUWise infrastructure.
                    </p>
                </motion.div>

                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={fetchUsage}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground transition-all font-bold text-xs uppercase tracking-widest border border-border/50"
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Sync Metrics
                </motion.button>
            </div>

            {/* Dashboard */}
            <UsageDashboard data={usageData} isLoading={isLoading} />

            {/* Recent Activity Table (simplified for premium feel) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-12 bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-8"
            >
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <History className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-bold tracking-tight">Recent Computational Strings</h3>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border/50 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                <th className="pb-4">Timestamp</th>
                                <th className="pb-4">Model</th>
                                <th className="pb-4">Volume</th>
                                <th className="pb-4">Costing</th>
                                <th className="pb-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs font-medium">
                            {usageData?.recentRecords?.map((record) => (
                                <tr key={record.id} className="border-b border-border/20 last:border-0 hover:bg-primary/5 transition-colors">
                                    <td className="py-4 opacity-50">{new Date(record.createdAt).toLocaleString()}</td>
                                    <td className="py-4">
                                        <span className="px-2 py-1 rounded-md bg-secondary text-[10px] font-bold">
                                            {record.model}
                                        </span>
                                    </td>
                                    <td className="py-4">{record.totalTokens.toLocaleString()} tx</td>
                                    <td className="py-4 text-primary font-bold">${record.cost.toFixed(5)}</td>
                                    <td className="py-4 text-right">
                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                                            <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                                            Success
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {(!usageData?.recentRecords || usageData.recentRecords.length === 0) && !isLoading && (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-muted-foreground italic opacity-50">
                                        No recent neural activity detected.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}
