import { useSession, signOut } from "next-auth/react";
import {
    Plus,
    Settings,
    Circle,
    LogOut,
    LogIn,
    UserPlus,
    User as UserIcon,
    ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "./ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
    { label: "Research", href: "/" },
    { label: "Chat", href: "/chat" },
    { label: "Catalog", href: "/catalog" },
    { label: "Analysis", href: "/analysis" },
    { label: "Reports", href: "/reports" },
];

export default function Navbar() {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const [showUserMenu, setShowUserMenu] = useState(false);

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

            <div className="flex items-center gap-4 pointer-events-auto relative">
                <ThemeToggle />

                <div className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className={cn(
                            "flex items-center gap-2 p-2 px-3 rounded-full border border-border transition-all hover:bg-secondary",
                            showUserMenu && "bg-secondary border-foreground/20"
                        )}
                    >
                        {status === "authenticated" ? (
                            <div className="flex items-center gap-2">
                                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                                    <UserIcon className="h-3 w-3 text-primary" />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest max-w-[80px] truncate">
                                    {session.user.name?.split(' ')[0]}
                                </span>
                                <ChevronDown className={cn("h-3 w-3 transition-transform", showUserMenu && "rotate-180")} />
                            </div>
                        ) : (
                            <Settings className="h-4 w-4 text-muted-foreground" />
                        )}
                    </button>

                    <AnimatePresence>
                        {showUserMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 mt-4 w-56 bg-card border border-border rounded-2xl p-2 shadow-2xl backdrop-blur-xl z-[60]"
                            >
                                {status === "authenticated" ? (
                                    <>
                                        <div className="px-4 py-3 border-b border-border/50 mb-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest truncate">{session.user.email}</p>
                                            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">Node_Authorized</p>
                                        </div>
                                        <button
                                            onClick={() => signOut()}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Terminate_Session
                                        </button>
                                    </>
                                ) : (
                                    <div className="space-y-1">
                                        <Link
                                            href="/login"
                                            onClick={() => setShowUserMenu(false)}
                                            className="flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-secondary rounded-xl transition-all"
                                        >
                                            <LogIn className="h-4 w-4" />
                                            Initialize_Login
                                        </Link>
                                        <Link
                                            href="/register"
                                            onClick={() => setShowUserMenu(false)}
                                            className="flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-secondary rounded-xl transition-all"
                                        >
                                            <UserPlus className="h-4 w-4" />
                                            Create_Identity
                                        </Link>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </nav>
    );
}
