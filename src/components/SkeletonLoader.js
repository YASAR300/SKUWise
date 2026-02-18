"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function SkeletonLoader({ className, type = "card" }) {
    if (type === "card") {
        return (
            <div className={cn("p-10 rounded-[2.5rem] bg-card border border-border relative overflow-hidden", className)}>
                <div className="shimmer absolute inset-0" />
                <div className="flex justify-between items-start mb-12">
                    <div className="h-14 w-14 rounded-2xl bg-secondary/50" />
                    <div className="h-4 w-12 bg-secondary/30 rounded" />
                </div>
                <div className="space-y-4">
                    <div className="h-4 w-1/3 bg-secondary/50 rounded" />
                    <div className="h-8 w-3/4 bg-secondary/30 rounded" />
                </div>
                <div className="mt-12 pt-8 border-t border-border flex justify-between items-end">
                    <div className="space-y-2">
                        <div className="h-3 w-16 bg-secondary/40 rounded" />
                        <div className="h-6 w-24 bg-secondary/20 rounded" />
                    </div>
                    <div className="h-10 w-20 bg-secondary/30 rounded-xl" />
                </div>
            </div>
        );
    }

    if (type === "chat") {
        return (
            <div className={cn("space-y-6 w-full", className)}>
                {[1, 2, 3].map((i) => (
                    <div key={i} className={cn(
                        "flex gap-4 max-w-[80%]",
                        i % 2 === 0 ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}>
                        <div className="h-10 w-10 rounded-full bg-secondary/50 shrink-0" />
                        <div className={cn(
                            "p-5 rounded-[2rem] bg-card border border-border relative overflow-hidden w-full",
                            i % 2 === 0 ? "rounded-tr-none" : "rounded-tl-none"
                        )}>
                            <div className="shimmer absolute inset-0" />
                            <div className="space-y-2">
                                <div className="h-3 w-3/4 bg-secondary/40 rounded" />
                                <div className="h-3 w-1/2 bg-secondary/20 rounded" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={cn("relative overflow-hidden bg-secondary/20 rounded-xl", className)}>
            <div className="shimmer absolute inset-0" />
        </div>
    );
}
