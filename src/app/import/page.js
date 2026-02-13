"use client";

import { motion } from "framer-motion";
import { Database, FileUp, ShieldCheck, Sparkles } from "lucide-react";
import UploadZone from "@/components/DataIngestion/UploadZone";

export default function ImportPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-12 py-12">
            <header className="text-center space-y-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]"
                >
                    <Database className="h-3 w-3" />
                    Neural Data Ingestion
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-5xl font-black tracking-tight text-foreground"
                >
                    Connect Your Intelligence
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-muted-foreground text-sm font-medium max-w-xl mx-auto"
                >
                    Upload your product catalogs, sales reports, and customer reviews.
                    Our AI will automatically clean, structure, and vectorize the data for deep strategic analysis.
                </motion.p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { icon: FileUp, title: "Universal Sync", desc: "Support for CSV, XLXS, and even raw text dumps." },
                    { icon: ShieldCheck, title: "Data Integrity", desc: "Automatic duplicate detection and unit normalization." },
                    { icon: Sparkles, title: "AI Vectorization", desc: "Embeddings generated instantly for neural search." },
                ].map((feature, idx) => (
                    <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + idx * 0.1 }}
                        className="glass-pill p-6 text-center space-y-3"
                    >
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
                            <feature.icon className="h-5 w-5" />
                        </div>
                        <h3 className="text-sm font-black text-foreground uppercase tracking-wider">{feature.title}</h3>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">{feature.desc}</p>
                    </motion.div>
                ))}
            </div>

            <motion.section
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
            >
                <UploadZone onUploadComplete={(data) => console.log("Upload success:", data)} />
            </motion.section>

            <footer className="text-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    Secure End-to-End Encryption • GDPR Compliant • AES-256 Storage
                </p>
            </footer>
        </div>
    );
}
