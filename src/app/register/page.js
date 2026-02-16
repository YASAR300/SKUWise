"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Circle, User, Lock, ArrowRight, Loader2, AlertCircle, Sparkles, Mail } from "lucide-react";

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Registration failed");
            }

            router.push("/login?registered=true");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.05] dark:opacity-[0.1]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-card/50 backdrop-blur-3xl border border-border p-12 rounded-[3.5rem] shadow-2xl relative z-10"
            >
                <div className="flex flex-col items-center gap-4 mb-12">
                    <div className="h-16 w-16 bg-primary/10 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/10">
                        <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none mb-2">Initialize_Node</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground italic">Register_Security_Credentials</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="relative group">
                        <User className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                        <input
                            type="text"
                            placeholder="FULL_NAME"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="w-full bg-secondary/50 border border-border hover:border-foreground/10 focus:border-foreground/20 rounded-2xl pl-14 pr-6 py-5 text-[10px] font-black tracking-widest uppercase focus:outline-none transition-all shadow-inner"
                        />
                    </div>

                    <div className="relative group">
                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                        <input
                            type="email"
                            placeholder="PRIMARY_EMAIL"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="w-full bg-secondary/50 border border-border hover:border-foreground/10 focus:border-foreground/20 rounded-2xl pl-14 pr-6 py-5 text-[10px] font-black tracking-widest uppercase focus:outline-none transition-all shadow-inner"
                        />
                    </div>

                    <div className="relative group">
                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                        <input
                            type="password"
                            placeholder="SECURE_PASSPHRASE"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            className="w-full bg-secondary/50 border border-border hover:border-foreground/10 focus:border-foreground/20 rounded-2xl pl-14 pr-6 py-5 text-[10px] font-black tracking-widest uppercase focus:outline-none transition-all shadow-inner"
                        />
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex items-center gap-2 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-[10px] font-black uppercase tracking-widest"
                            >
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-foreground text-background py-5 rounded-2xl font-black text-[12px] uppercase tracking-[0.3em] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl flex items-center justify-center gap-4 group"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                Register_Node
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-12 pt-8 border-t border-border flex flex-col items-center gap-4">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Already have a node?</p>
                    <Link
                        href="/login"
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground hover:underline decoration-primary/50 underline-offset-8 transition-all"
                    >
                        Access_Existing_Credentials
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
