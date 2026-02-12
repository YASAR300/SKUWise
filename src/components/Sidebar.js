"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    TrendingUp,
    BarChart3,
    Users,
    Settings,
    HelpCircle,
    Database,
    BrainCircuit
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import ThemeToggle from "./ThemeToggle";

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: BrainCircuit, label: "AI Analysis", href: "/analysis" },
    { icon: Package, label: "Catalog", href: "/catalog" },
    { icon: TrendingUp, label: "Competitors", href: "/competitors" },
    { icon: BarChart3, label: "Sales Data", href: "/sales" },
    { icon: Users, label: "Customers", href: "/customers" },
    { icon: Database, label: "Data Import", href: "/import" },
];

const secondaryItems = [
    { icon: Settings, label: "Settings", href: "/settings" },
    { icon: HelpCircle, label: "Help", href: "/help" },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-card border-border transition-colors duration-300">
            <div className="flex h-16 items-center justify-between px-6 border-b border-border/50">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="text-xl font-bold text-primary-foreground">S</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-foreground">SKUWise</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-6 custom-scrollbar">
                <div className="space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                )}
                            >
                                <item.icon className={cn(
                                    "h-5 w-5 transition-colors",
                                    isActive ? "text-primary" : "group-hover:text-primary"
                                )} />
                                {item.label}
                                {isActive && (
                                    <motion.div
                                        layoutId="active-nav"
                                        className="absolute left-[-12px] h-6 w-1 rounded-r-full bg-primary"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>

                <div className="mt-10">
                    <h3 className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
                        Organization
                    </h3>
                    <div className="mt-3 space-y-1">
                        {secondaryItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            >
                                <item.icon className="h-5 w-5 group-hover:text-primary" />
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <div className="border-t border-border p-4 space-y-4">
                <div className="flex items-center justify-between px-2">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Theme</span>
                    <ThemeToggle />
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-secondary/50 p-2.5 border border-border/50">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Users className="h-5 w-5" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="truncate text-xs font-bold text-foreground">Admin User</p>
                        <p className="truncate text-[10px] font-medium text-muted-foreground">Category Manager</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
