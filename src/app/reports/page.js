"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

const REPORT_TYPES = [
    {
        id: "inventory",
        title: "Inventory Health",
        description: "Stock levels, turnover rates, and reorder points",
        icon: Package,
        color: "bg-blue-500",
    },
    {
        id: "margin",
        title: "Margin Analysis",
        description: "Profit margins, cost breakdowns, and pricing optimization",
        icon: DollarSign,
        color: "bg-green-500",
    },
    {
        id: "sales",
        title: "Sales Performance",
        description: "Revenue trends, top products, and growth metrics",
        icon: TrendingUp,
        color: "bg-purple-500",
    },
    {
        id: "competitive",
        title: "Competitive Analysis",
        description: "Market comparison and competitive positioning",
        icon: BarChart3,
        color: "bg-orange-500",
    },
];

export default function ReportsPage() {
    const [selectedType, setSelectedType] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [activeTab, setActiveTab] = useState("summary");

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
            alert("Failed to generate report. Please try again.");
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
            } else {
                throw new Error("Export failed");
            }
        } catch (error) {
            console.error("Failed to export report:", error);
            alert("Failed to export report. Please try again.");
        }
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center gap-3 mb-2">
                        <FileText className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold">Business Reports</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Generate comprehensive reports with AI-powered insights
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Report Type Selection */}
                {!reportData && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {REPORT_TYPES.map((report) => {
                            const Icon = report.icon;
                            return (
                                <motion.button
                                    key={report.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleGenerateReport(report.id)}
                                    disabled={isGenerating}
                                    className={cn(
                                        "p-6 rounded-2xl border-2 border-border bg-card hover:border-primary transition-all text-left",
                                        selectedType === report.id && "border-primary bg-primary/5",
                                        isGenerating && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", report.color)}>
                                        <Icon className="h-6 w-6 text-white" />
                                    </div>
                                    <h3 className="text-lg font-bold mb-2">{report.title}</h3>
                                    <p className="text-sm text-muted-foreground">{report.description}</p>
                                </motion.button>
                            );
                        })}
                    </div>
                )}

                {/* Loading State */}
                {isGenerating && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                        <p className="text-lg font-medium">Generating report...</p>
                        <p className="text-sm text-muted-foreground">Analyzing data and creating insights</p>
                    </div>
                )}

                {/* Report Preview */}
                {reportData && !isGenerating && (
                    <div className="space-y-6">
                        {/* Actions Bar */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => {
                                    setReportData(null);
                                    setSelectedType(null);
                                }}
                                className="px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-all"
                            >
                                ← Back to Reports
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleExport("pdf")}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all"
                                >
                                    <FileType className="h-4 w-4" />
                                    Export PDF
                                </button>
                                <button
                                    onClick={() => handleExport("csv")}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-all"
                                >
                                    <FileDown className="h-4 w-4" />
                                    Export CSV
                                </button>
                                <button
                                    onClick={() => handleExport("excel")}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all"
                                >
                                    <FileSpreadsheet className="h-4 w-4" />
                                    Export Excel
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-border">
                            <div className="flex gap-4">
                                {["summary", "insights", "data"].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={cn(
                                            "px-4 py-3 font-medium border-b-2 transition-all capitalize",
                                            activeTab === tab
                                                ? "border-primary text-primary"
                                                : "border-transparent text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="bg-card rounded-2xl border border-border p-6">
                            {activeTab === "summary" && (
                                <div className="space-y-4">
                                    <h2 className="text-2xl font-bold mb-6">Report Summary</h2>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {Object.entries(reportData.summary).map(([key, value]) => (
                                            <div key={key} className="p-4 rounded-xl bg-secondary/30">
                                                <p className="text-sm text-muted-foreground mb-1 capitalize">
                                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                                </p>
                                                <p className="text-2xl font-bold">
                                                    {typeof value === "number" ? value.toLocaleString() : value}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === "insights" && (
                                <div className="space-y-4">
                                    <h2 className="text-2xl font-bold mb-6">Key Insights</h2>
                                    {reportData.insights.map((insight, i) => (
                                        <div key={i} className="p-4 rounded-xl bg-secondary/30 border-l-4 border-primary">
                                            <p className="text-sm">{insight}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === "data" && (
                                <div className="space-y-4">
                                    <h2 className="text-2xl font-bold mb-6">Detailed Data</h2>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-border">
                                                    <th className="text-left p-3 font-medium">SKU</th>
                                                    <th className="text-left p-3 font-medium">Name</th>
                                                    <th className="text-left p-3 font-medium">Category</th>
                                                    <th className="text-right p-3 font-medium">Stock</th>
                                                    <th className="text-right p-3 font-medium">Price</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reportData.data.allProducts?.slice(0, 20).map((product) => (
                                                    <tr key={product.id} className="border-b border-border hover:bg-secondary/30">
                                                        <td className="p-3 font-mono text-xs">{product.sku}</td>
                                                        <td className="p-3">{product.name}</td>
                                                        <td className="p-3">{product.category || "N/A"}</td>
                                                        <td className="p-3 text-right">{product.stock}</td>
                                                        <td className="p-3 text-right">${product.price.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
