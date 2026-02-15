"use client";

import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import {
    Zap,
    TrendingUp,
    TrendingDown,
    Box,
    DollarSign,
    Star,
    Lightbulb,
    Target,
    BarChart3,
    ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Custom component to render metrics in a "Card" format
 */
const MetricCard = ({ label, value, icon: Icon, color = "primary" }) => (
    <div className={cn(
        "flex items-center gap-3 p-4 rounded-2xl border bg-card/50 backdrop-blur-sm shadow-sm",
        color === "primary" ? "border-primary/20" : "border-border"
    )}>
        <div className={cn(
            "p-2 rounded-xl",
            color === "primary" ? "bg-primary/10" : "bg-secondary"
        )}>
            <Icon className={cn(
                "h-5 w-5",
                color === "primary" ? "text-primary" : "text-muted-foreground"
            )} />
        </div>
        <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{label}</div>
            <div className="text-lg font-bold tracking-tight">{value}</div>
        </div>
    </div>
);

/**
 * Enhanced Markdown Component
 */
export default function ChatResponse({ content }) {
    // Advanced parsing for specific metrics or data patterns
    // This is a simple heuristic-based approach to pull out key metrics
    const extractMetrics = (text) => {
        const metrics = [];

        // Pattern: Revenue generated: ₹XXX.XX or $XXX.XX
        const revenueMatch = text.match(/(Revenue|Total Revenue)[:\s]+([$₹\d,.]+)/i);
        if (revenueMatch) metrics.push({ label: "Revenue", value: revenueMatch[2], icon: DollarSign });

        // Pattern: Units Sold: XXX
        const unitsMatch = text.match(/(Units Sold|Sold)[:\s]+(\d+)/i);
        if (unitsMatch) metrics.push({ label: "Total Units", value: unitsMatch[2], icon: Box });

        // Pattern: Rating: X/5
        const ratingMatch = text.match(/(Rating)[:\s]+([\d.]+\/5)/i);
        if (ratingMatch) metrics.push({ label: "Rating", value: ratingMatch[2], icon: Star });

        return metrics.slice(0, 3); // Return top 3 detected metrics
    };

    const detectedMetrics = extractMetrics(content);

    return (
        <div className="chat-response-container space-y-6">
            {/* 1. Highlight Metrics Section (if any detected) */}
            {detectedMetrics.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 my-4">
                    {detectedMetrics.map((m, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <MetricCard label={m.label} value={m.value} icon={m.icon} />
                        </motion.div>
                    ))}
                </div>
            )}

            {/* 2. Main Content Rendering */}
            <div className="prose prose-sm dark:prose-invert max-w-none 
                prose-headings:font-bold prose-headings:tracking-tight 
                prose-h1:text-2xl prose-h1:text-primary prose-h1:mb-2
                prose-h2:text-xl prose-h2:border-b prose-h2:border-border prose-h2:pb-1 prose-h2:mt-8 prose-h2:mb-4
                prose-h3:text-lg prose-h3:text-foreground prose-h3:mt-6
                prose-p:text-sm prose-p:leading-relaxed prose-p:text-muted-foreground/90
                prose-strong:text-foreground prose-strong:font-bold
                prose-ul:my-4 prose-li:my-1 prose-li:text-sm prose-li:text-muted-foreground/90
            ">
                <ReactMarkdown
                    components={{
                        // Custom styling for specific identifiers like "STRATEGIC RECOMMENDATION"
                        p: ({ node, children }) => {
                            const text = children?.[0];
                            if (typeof text === 'string' && text.includes('STRATEGIC')) {
                                return (
                                    <div className="my-6 p-5 rounded-2xl bg-primary/5 border border-primary/10 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                                            <TrendingUp className="h-12 w-12 text-primary" />
                                        </div>
                                        <div className="flex items-center gap-2 mb-2 text-primary font-bold text-xs uppercase tracking-widest">
                                            <Target className="h-4 w-4" />
                                            Strategic Directive
                                        </div>
                                        <p className="m-0 text-foreground font-medium relative z-10">{children}</p>
                                    </div>
                                );
                            }
                            return <p>{children}</p>;
                        },
                        // Style headers with accents
                        h2: ({ node, children }) => (
                            <h2 className="flex items-center gap-2 group">
                                <span className="h-4 w-1 bg-primary rounded-full transition-all group-hover:h-6" />
                                {children}
                            </h2>
                        ),
                        // Intelligent list styling
                        li: ({ node, children }) => (
                            <li className="list-none flex items-start gap-2 group">
                                <ArrowUpRight className="h-4 w-4 mt-0.5 text-primary/40 group-hover:text-primary transition-colors flex-shrink-0" />
                                <span>{children}</span>
                            </li>
                        )
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>
        </div>
    );
}
