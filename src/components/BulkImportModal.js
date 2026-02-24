"use client";

import { useState, useCallback } from "react";
import {
    X, Upload, Scan, Loader2, CheckCircle2, AlertCircle,
    FileText, TrendingUp, Star, Trash2, ArrowRight, Boxes
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Portal from "./Portal";
import confetti from "canvas-confetti";

export default function BulkImportModal({ isOpen, onClose, onComplete }) {
    const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Success
    const [files, setFiles] = useState({ products: null, sales: null, reviews: null });
    const [isScanning, setIsScanning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [extracted, setExtracted] = useState({ products: [], sales: [], reviews: [] });

    const handleFileChange = (type, file) => {
        setFiles(prev => ({ ...prev, [type]: file }));
    };

    const runScan = async () => {
        if (!files.products) return;
        setIsScanning(true);
        setError(null);

        const formData = new FormData();
        formData.append("productsFile", files.products);
        if (files.sales) formData.append("salesFile", files.sales);
        if (files.reviews) formData.append("reviewsFile", files.reviews);
        formData.append("mode", "ai");
        formData.append("commit", "false");

        try {
            const res = await fetch("/api/bulk-import", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                setExtracted(data);
                setStep(2);
            } else {
                throw new Error(data.error || "Scan failed");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsScanning(false);
        }
    };

    const handleCommit = async () => {
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData();
        // Since we already have the JSON from step 1, we send that to avoid re-scanning
        formData.append("productsJson", JSON.stringify(extracted.products));
        formData.append("salesJson", JSON.stringify(extracted.sales));
        formData.append("reviewsJson", JSON.stringify(extracted.reviews));
        formData.append("commit", "true");

        try {
            const res = await fetch("/api/bulk-import", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#6366f1', '#818cf8', '#ffffff']
                });
                setStep(3);
                onComplete?.();
            } else {
                throw new Error(data.error || "Import failed");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetImport = () => {
        setFiles({ products: null, sales: null, reviews: null });
        setExtracted({ products: [], sales: [], reviews: [] });
        setError(null);
        setStep(1);
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => !isScanning && !isSubmitting && onClose()}
                    className="absolute inset-0 bg-background/80 backdrop-blur-xl"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-4xl bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-border flex items-center justify-between bg-secondary/30">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Scan className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tighter italic uppercase text-foreground">Bulk_Import_System</h2>
                                <p className="text-[10px] font-black tracking-widest uppercase text-muted-foreground opacity-60">Products + Sales + Reviews · Multi-Format AI Scan</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 rounded-2xl hover:bg-accent transition-all text-muted-foreground"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8">
                        {step === 1 && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Products Upload (Required) */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full w-fit">
                                        <FileText className="h-3 w-3 text-primary" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-primary">Required</span>
                                    </div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest">Products_Manifest</h4>
                                    <label className={cn(
                                        "block w-full aspect-square border-2 border-dashed rounded-3xl transition-all cursor-pointer",
                                        files.products ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"
                                    )}>
                                        <input type="file" className="hidden" onChange={(e) => handleFileChange('products', e.target.files[0])} />
                                        <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
                                            {files.products ? (
                                                <>
                                                    <CheckCircle2 className="h-10 w-10 text-primary" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-full italic">{files.products.name}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="h-10 w-10 text-muted-foreground/30" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Drop Product File</span>
                                                </>
                                            )}
                                        </div>
                                    </label>
                                </div>

                                {/* Sales Upload (Optional) */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-full w-fit border border-border">
                                        <TrendingUp className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Optional</span>
                                    </div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest">Sales_Metadata</h4>
                                    <label className={cn(
                                        "block w-full aspect-square border-2 border-dashed rounded-3xl transition-all cursor-pointer",
                                        files.sales ? "border-emerald-500/50 bg-emerald-500/5" : "border-border hover:border-emerald-500/30"
                                    )}>
                                        <input type="file" className="hidden" onChange={(e) => handleFileChange('sales', e.target.files[0])} />
                                        <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
                                            {files.sales ? (
                                                <>
                                                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-full italic">{files.sales.name}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="h-10 w-10 text-muted-foreground/30" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Drop Sales File</span>
                                                </>
                                            )}
                                        </div>
                                    </label>
                                </div>

                                {/* Reviews Upload (Optional) */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-full w-fit border border-border">
                                        <Star className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Optional</span>
                                    </div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest">Customer_Reviews</h4>
                                    <label className={cn(
                                        "block w-full aspect-square border-2 border-dashed rounded-3xl transition-all cursor-pointer",
                                        files.reviews ? "border-amber-500/50 bg-amber-500/5" : "border-border hover:border-amber-500/30"
                                    )}>
                                        <input type="file" className="hidden" onChange={(e) => handleFileChange('reviews', e.target.files[0])} />
                                        <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
                                            {files.reviews ? (
                                                <>
                                                    <CheckCircle2 className="h-10 w-10 text-amber-500" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-full italic">{files.reviews.name}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="h-10 w-10 text-muted-foreground/30" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Drop Reviews File</span>
                                                </>
                                            )}
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="p-4 rounded-3xl bg-secondary/50 border border-border">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileText className="h-3 w-3 text-primary" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Products</span>
                                        </div>
                                        <div className="text-2xl font-black italic">{extracted.products.length}</div>
                                    </div>
                                    <div className="p-4 rounded-3xl bg-secondary/50 border border-border">
                                        <div className="flex items-center gap-2 mb-2">
                                            <TrendingUp className="h-3 w-3 text-emerald-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Sales</span>
                                        </div>
                                        <div className="text-2xl font-black italic">{extracted.sales.length}</div>
                                    </div>
                                    <div className="p-4 rounded-3xl bg-secondary/50 border border-border">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Star className="h-3 w-3 text-amber-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Reviews</span>
                                        </div>
                                        <div className="text-2xl font-black italic">{extracted.reviews.length}</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Verification_Matrix</h4>
                                    <div className="border border-border rounded-3xl overflow-hidden bg-background">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-secondary/30 border-b border-border">
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest italic">Product_Name</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest italic text-center">Price</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest italic text-center">Stock</th>
                                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest italic text-right">Mapping</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/50">
                                                {extracted.products.slice(0, 10).map((p, idx) => {
                                                    const normalize = (str) => str?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
                                                    const pIdNorm = normalize(p.refId);
                                                    const pNameNorm = normalize(p.name);

                                                    const hasSales = extracted.sales.some(s => {
                                                        const sRefNorm = normalize(s.productRef);
                                                        return (pIdNorm && sRefNorm === pIdNorm) || (sRefNorm === pNameNorm);
                                                    });
                                                    const hasReviews = extracted.reviews.some(r => {
                                                        const rRefNorm = normalize(r.productRef);
                                                        return (pIdNorm && rRefNorm === pIdNorm) || (rRefNorm === pNameNorm);
                                                    });
                                                    return (
                                                        <tr key={idx} className="hover:bg-accent/30 transition-colors">
                                                            <td className="px-6 py-4 text-[10px] font-bold truncate max-w-[200px]">
                                                                <div className="flex flex-col">
                                                                    <span>{p.name || "Untitled"}</span>
                                                                    {p.refId && <span className="text-[8px] opacity-40 font-mono">ID: {p.refId}</span>}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-[10px] font-black italic text-center">₹{(p.price || 0).toLocaleString()}</td>
                                                            <td className="px-6 py-4 text-[10px] font-black italic text-center">{p.stock || 0}</td>
                                                            <td className="px-6 py-4 text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    {hasSales && (
                                                                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20" title="Sales Linked" />
                                                                    )}
                                                                    {hasReviews && (
                                                                        <div className="h-2 w-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/20" title="Reviews Linked" />
                                                                    )}
                                                                    {!hasSales && !hasReviews && (
                                                                        <div className="h-2 w-2 rounded-full bg-border" />
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {extracted.products.length > 10 && (
                                                    <tr>
                                                        <td colSpan="4" className="px-6 py-4 text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-30 italic">
                                                            + {extracted.products.length - 10} more items in manifest
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-6">
                                <div className="h-24 w-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-black tracking-tighter italic italic uppercase">Sector_Sync_Complete</h3>
                                    <p className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">Successfully cataloged assets and hyper-contextualized performance data.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="px-6 py-3 rounded-2xl bg-secondary border border-border">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Products</p>
                                        <p className="text-xl font-black italic">{extracted.products.length}</p>
                                    </div>
                                    <div className="px-6 py-3 rounded-2xl bg-secondary border border-border">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Sales</p>
                                        <p className="text-xl font-black italic">{extracted.sales.length}</p>
                                    </div>
                                    <div className="px-6 py-3 rounded-2xl bg-secondary border border-border">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Reviews</p>
                                        <p className="text-xl font-black italic">{extracted.reviews.length}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-8 border-t border-border bg-secondary/10 flex items-center justify-between">
                        {error && (
                            <div className="flex items-center gap-3 text-rose-500">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
                            </div>
                        )}
                        <div /> {/* Spacer */}
                        <div className="flex items-center gap-4">
                            {step === 1 && (
                                <button
                                    onClick={runScan}
                                    disabled={!files.products || isScanning}
                                    className="group relative flex items-center gap-3 px-8 py-4 bg-foreground text-background rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 shadow-xl shadow-foreground/10"
                                >
                                    {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scan className="h-4 w-4 text-primary" />}
                                    {isScanning ? "Scanning_Manifest..." : "Initialize AI Scan"}
                                </button>
                            )}
                            {step === 2 && (
                                <>
                                    <button
                                        onClick={() => setStep(1)}
                                        className="flex items-center gap-3 px-8 py-4 bg-secondary text-foreground border border-border rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-accent"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleCommit}
                                        disabled={isSubmitting}
                                        className="group relative flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 disabled:opacity-30 shadow-xl shadow-primary/20"
                                    >
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                        {isSubmitting ? "Finalizing_Sync..." : "Commit Hyper-Catalog"}
                                    </button>
                                </>
                            )}
                            {step === 3 && (
                                <div className="flex gap-4">
                                    <button
                                        onClick={resetImport}
                                        className="px-12 py-4 bg-secondary text-foreground border border-border rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-accent"
                                    >
                                        Sync More Assets
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="px-12 py-4 bg-foreground text-background rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-foreground/10"
                                    >
                                        Return to Operations
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </Portal>
    );
}
