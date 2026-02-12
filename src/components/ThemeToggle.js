"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export default function ThemeToggle() {
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="h-8 w-14 rounded-full bg-muted animate-pulse" />;

    const isDark = resolvedTheme === "dark";

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={cn(
                "relative flex h-8 w-14 items-center rounded-full p-1 transition-all duration-500 ring-1 ring-border shadow-inner",
                isDark ? "bg-primary/20" : "bg-secondary"
            )}
            aria-label="Toggle theme"
        >
            <div className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full bg-card shadow-xl transition-all duration-500 transform border border-border",
                isDark ? "translate-x-6 rotate-0" : "translate-x-0 rotate-180"
            )}>
                {isDark ? (
                    <Moon className="h-3.5 w-3.5 text-primary" strokeWidth={3} />
                ) : (
                    <Sun className="h-3.5 w-3.5 text-amber-500" strokeWidth={3} />
                )}
            </div>

            <div className="absolute inset-0 flex justify-between px-2 items-center pointer-events-none opacity-20 dark:opacity-40">
                <Sun className="h-3 w-3 text-amber-500" />
                <Moon className="h-3 w-3 text-primary" />
            </div>
        </button>
    );
}
