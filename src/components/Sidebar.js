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
        <div className="flex h-screen w-64 flex-col border-r bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 transition-colors duration-300">
            <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 dark:border-slate-900">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <span className="text-xl font-bold text-white">S</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">SKUWise</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
                <div className="space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200"
                                )}
                            >
                                <item.icon className={cn(
                                    "h-5 w-5 transition-colors",
                                    isActive ? "text-indigo-600 dark:text-indigo-400" : "group-hover:text-indigo-500 dark:group-hover:text-indigo-400"
                                )} />
                                {item.label}
                                {isActive && (
                                    <motion.div
                                        layoutId="active-nav"
                                        className="absolute left-0 h-6 w-1 rounded-r-full bg-indigo-600 dark:bg-indigo-400"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>

                <div className="mt-8">
                    <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Support
                    </h3>
                    <div className="mt-2 space-y-1">
                        {secondaryItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200"
                            >
                                <item.icon className="h-5 w-5 group-hover:text-indigo-500 dark:group-hover:text-indigo-400" />
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-4">
                <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Appearance</span>
                    <ThemeToggle />
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-900 p-2 border border-slate-100 dark:border-slate-800">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Users className="h-4 w-4" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="truncate text-xs font-bold text-slate-900 dark:text-white">Admin User</p>
                        <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">Category Manager</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
