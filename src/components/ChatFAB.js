"use client";

import { motion } from "framer-motion";
import { MessageSquare, Sparkles } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Floating Chat Button (FAB)
 * A premium, circular button fixed to the bottom right for ubiquitous chat access.
 */
export default function ChatFAB() {
    const router = useRouter();
    const pathname = usePathname();

    // Hide on chat routes and auth routes as it's redundant or distracting
    const isChatRoute = pathname?.startsWith("/chat/");
    const isAuthRoute = pathname === "/login" || pathname === "/register";
    const isHome = pathname === "/";

    if (isChatRoute || isAuthRoute || isHome) return null;

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-8 right-8 z-[100]"
        >
            <button
                onClick={() => router.push("/chat")}
                className={cn(
                    "relative group p-5 rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/40 transition-all overflow-hidden",
                    "hover:ring-4 hover:ring-primary/20"
                )}
            >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Icons */}
                <div className="relative">
                    <MessageSquare className="h-7 w-7 transition-all group-hover:scale-0 group-hover:opacity-0" />
                    <Sparkles className="h-7 w-7 absolute inset-0 scale-0 opacity-0 group-hover:scale-110 group-hover:opacity-100 transition-all text-white" />
                </div>

                {/* Tooltip-like label on hover */}
                <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-card border border-border shadow-xl text-xs font-bold uppercase tracking-widest text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 pointer-events-none">
                    Summon SKUWise AI
                </span>
            </button>
        </motion.div>
    );
}
