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
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed bottom-12 right-12 z-[100]"
        >
            <button
                onClick={() => router.push("/chat")}
                className={cn(
                    "relative group p-6 rounded-[2rem] bg-foreground text-background shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(255,255,255,0.05)] transition-all overflow-hidden border border-white/20",
                    "hover:ring-8 hover:ring-primary/10"
                )}
            >
                {/* Neural Pulse Effect */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="absolute inset-0 bg-primary pointer-events-none"
                />

                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Icons */}
                <div className="relative flex items-center justify-center">
                    <MessageSquare className="h-7 w-7 transition-all duration-500 group-hover:rotate-[360deg] group-hover:scale-0 group-hover:opacity-0" />
                    <Sparkles className="h-7 w-7 absolute inset-0 scale-0 opacity-0 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500 text-primary" />
                </div>

                {/* Tooltip-like label on hover */}
                <motion.span
                    initial={{ opacity: 0, x: 20 }}
                    whileHover={{ opacity: 1, x: 0 }}
                    className="absolute right-full mr-6 top-1/2 -translate-y-1/2 px-5 py-3 rounded-2xl bg-card border border-border shadow-2xl text-[10px] font-black uppercase tracking-[0.2em] text-foreground whitespace-nowrap pointer-events-none"
                >
                    Initialize_Neural_Link
                </motion.span>
            </button>
        </motion.div>
    );
}
