"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Plus,
    Settings,
    Circle
} from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "./ThemeToggle";
import { motion } from "framer-motion";

const navLinks = [
    { label: "Research", href: "/" },
    { label: "Catalog", href: "/catalog" },
    { label: "Growth", href: "/competitors" },
];

export default function Navbar() {
    const pathname = usePathname();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex justify-between items-center pointer-events-none">
            <div className="flex items-center gap-6 pointer-events-auto">
                <Link href="/" className="flex items-center gap-2 group">
                    <Circle className="h-5 w-5 fill-primary text-primary transition-transform group-hover:scale-110" />
                    <span className="text-sm font-black tracking-[0.2em] uppercase">SKUWise</span>
                </Link>
                <div className="h-px w-8 bg-border" />
                <div className="flex gap-6">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "text-[10px] uppercase tracking-[0.25em] font-black transition-colors",
                                pathname === link.href ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-4 pointer-events-auto">
                <button className="text-[10px] font-black uppercase tracking-widest px-4 py-2 border border-border rounded-full hover:bg-secondary transition-all">
                    Connect Data
                </button>
                <ThemeToggle />
                <Link href="/settings" className="p-2 rounded-full hover:bg-secondary transition-colors">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                </Link>
            </div>
        </nav>
    );
}
