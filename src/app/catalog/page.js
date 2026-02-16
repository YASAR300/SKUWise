"use client";

import { useState, useEffect } from "react";
import {
    Package,
    Search,
    Filter,
    ArrowUpRight,
    ShoppingBag,
    Layers,
    Plus,
    X,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Boxes,
    Tag,
    Coins,
    Warehouse,
    Activity,
    Shield,
    Zap,
    Scan,
    Camera,
    Sparkles,
    Upload,
    ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function CatalogPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // OCR Specific State
    const [ocrResults, setOcrResults] = useState([]);
    const [dragActive, setDragActive] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        category: "",
        price: "",
        stock: "",
        cost: "",
        reorderPoint: "10"
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        console.log("🚀 Initializing Asset Sync...");
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/products");
            console.log("📡 API Response Status:", res.status);

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `HTTP ${res.status}`);
            }

            const data = await res.json();
            console.log("📦 Data received from Sector:", data);

            if (Array.isArray(data)) {
                setProducts(data);
                console.log(`✅ Loaded ${data.length} assets successfully.`);
            } else {
                console.warn("⚠️ Received non-array data from API:", data);
                setProducts([]);
                setError("Data format mismatch (Sector Error 402)");
            }
        } catch (err) {
            console.error("❌ Link Failure in fetchProducts:", err);
            setProducts([]);
            setError(err.message || "Connection to Data Lake interrupted (Sector Error 500)");
        } finally {
            setLoading(false);
        }
    }

    const handleOcrScan = async (file) => {
        if (!file) return;
        setIsScanning(true);
        setError(null);
        setOcrResults([]);

        const formData = new FormData();
        formData.append("image", file);

        try {
            const res = await fetch("/api/products/ocr", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setOcrResults(data.products.map(p => ({
                    ...p,
                    price: p.price || 0,
                    stock: p.stock || 0,
                    cost: p.cost || (p.price * 0.7),
                    id: Math.random().toString(36).substr(2, 9)
                })));
            } else {
                const data = await res.json();
                throw new Error(data.error || "OCR Scan failed");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsScanning(false);
        }
    };

    const handleCommitOcr = async () => {
        setIsSubmitting(true);
        try {
            // Commit all extracted products in batch
            const promises = ocrResults.map(p =>
                fetch("/api/products", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(p),
                })
            );

            await Promise.all(promises);
            await fetchProducts();
            setSuccess(true);
            setTimeout(() => {
                setIsOcrModalOpen(false);
                setOcrResults([]);
                setSuccess(false);
            }, 1500);
        } catch (err) {
            setError("Bulk commit failed. Check logs.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const newProduct = await res.json();
                setProducts([newProduct, ...products]);
                setSuccess(true);
                setTimeout(() => {
                    setIsModalOpen(false);
                    setSuccess(false);
                    setFormData({
                        name: "",
                        category: "",
                        price: "",
                        stock: "",
                        cost: "",
                        reorderPoint: "10"
                    });
                }, 1500);
            } else {
                const data = await res.json();
                throw new Error(data.error || "Failed to create product");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredProducts = Array.isArray(products) ? products.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.toLowerCase().includes(search.toLowerCase())
    ) : [];

    return (
        <div className="max-w-[1400px] mx-auto space-y-16 py-16 px-8 relative">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.05]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
            </div>

            <header className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-12 border-b border-border pb-12">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border scale-90 origin-left">
                        <Boxes className="h-3 w-3 text-foreground" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">Asset_Logistics_Center</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <h1 className="text-6xl font-black text-foreground tracking-tighter leading-none italic">
                            Intel<span className="text-muted-foreground">Catalog</span>
                        </h1>
                        <p className="text-lg text-muted-foreground font-medium tracking-tight max-w-lg">
                            Centralized intelligence hub for managing high-value inventory clusters and product synchronization.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative group min-w-[320px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                        <input
                            type="text"
                            placeholder="SCAN_SECTOR_DATA..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-background border border-border focus:border-foreground/20 rounded-2xl pl-12 pr-6 py-4 text-[10px] font-black tracking-widest uppercase focus:outline-none transition-all shadow-inner"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsOcrModalOpen(true)}
                            className="group relative flex items-center gap-3 px-6 py-4 bg-secondary text-foreground border border-border rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-accent hover:border-primary/30"
                        >
                            <Scan className="h-4 w-4 text-primary" />
                            AI Scan
                        </button>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="group relative flex items-center gap-3 px-8 py-4 bg-foreground text-background rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-foreground/10"
                        >
                            <Plus className="h-4 w-4" />
                            Create Asset
                        </button>
                    </div>

                    <button className="p-4 rounded-2xl bg-secondary border border-border hover:bg-accent transition-all text-muted-foreground">
                        <Filter className="h-5 w-5" />
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="h-64 bg-card border border-border rounded-[2rem] animate-pulse" />
                    ))}
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="h-[400px] bg-card border border-dashed border-border rounded-[3rem] flex flex-col items-center justify-center text-center p-12 space-y-6">
                    <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center opacity-40">
                        <Layers className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-foreground font-black uppercase tracking-[0.3em] text-sm italic underline">Sector_Empty_Warning</p>
                        <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">No matching assets identified in the current buffer.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-primary text-[10px] font-black uppercase tracking-widest hover:scale-110 transition-transform flex items-center gap-2"
                    >
                        Initialize First Entity <ArrowUpRight className="h-3 w-3" />
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredProducts.map((product, idx) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-card p-10 rounded-[2.5rem] border border-border hover:border-foreground/20 hover:shadow-2xl hover:-translate-y-2 transition-all group flex flex-col relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">
                                <Activity className="h-16 w-16" />
                            </div>

                            <div className="flex justify-between items-start mb-12">
                                <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:bg-foreground/5 transition-all">
                                    <ShoppingBag className="h-6 w-6" />
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] font-mono">{product.id}</span>
                                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-20 group-hover:opacity-100 transition-all" />
                                </div>
                            </div>

                            <div className="space-y-2 flex-grow">
                                <span className="inline-block px-3 py-1 bg-secondary border border-border rounded-lg text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground group-hover:border-foreground/10 transition-colors">
                                    {product.category}
                                </span>
                                <h3 className="text-2xl font-black text-foreground tracking-tighter leading-tight italic group-hover:translate-x-1 transition-transform">{product.name}</h3>
                            </div>

                            <div className="mt-12 pt-8 border-t border-border flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Valuation</p>
                                    <p className="text-2xl font-black text-foreground tracking-tighter">₹{product.price.toLocaleString()}</p>
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Liquidity</p>
                                    <p className={cn(
                                        "text-sm font-black italic",
                                        product.stock < (product.reorderPoint || 10) ? "text-rose-500" : "text-foreground"
                                    )}>
                                        {product.stock} Units
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* AI OCR Scanner Modal */}
            <AnimatePresence>
                {isOcrModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 sm:p-12">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isScanning && !isSubmitting && setIsOcrModalOpen(false)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-xl"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-4xl bg-card border border-border rounded-[3.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-10 border-b border-border flex items-center justify-between bg-card z-20">
                                <div className="space-y-1">
                                    <h2 className="text-xs font-black uppercase tracking-[0.4em] text-foreground flex items-center gap-3">
                                        <Sparkles className="h-4 w-4 text-primary" /> AI_Vision_Matrix
                                    </h2>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic font-serif">Gemini Powered Data Extraction v7.0</p>
                                </div>
                                <button
                                    onClick={() => setIsOcrModalOpen(false)}
                                    className="p-3 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                                {ocrResults.length === 0 ? (
                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                                        onDragLeave={() => setDragActive(false)}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setDragActive(false);
                                            if (e.dataTransfer.files[0]) handleOcrScan(e.dataTransfer.files[0]);
                                        }}
                                        className={cn(
                                            "h-[350px] border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center space-y-6 transition-all",
                                            dragActive ? "border-primary bg-primary/5 scale-[0.98]" : "border-border bg-secondary/20",
                                            isScanning ? "pointer-events-none" : "hover:bg-secondary/40 hover:border-primary/30"
                                        )}
                                    >
                                        {isScanning ? (
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="relative w-20 h-20">
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                        className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary"
                                                    />
                                                    <Scan className="absolute inset-0 m-auto h-8 w-8 text-primary animate-pulse" />
                                                </div>
                                                <div className="space-y-2 text-center">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary animate-pulse">Scanning_Image_Layers...</p>
                                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Synthesizing_Multimodal_Data</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center">
                                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                                <div className="space-y-2 text-center">
                                                    <p className="text-foreground font-black uppercase tracking-[0.3em] text-sm italic underline">Input_Required</p>
                                                    <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">Drop screenshot or browse product sheet</p>
                                                </div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    id="ocr-upload"
                                                    className="hidden"
                                                    onChange={(e) => e.target.files[0] && handleOcrScan(e.target.files[0])}
                                                />
                                                <label
                                                    htmlFor="ocr-upload"
                                                    className="px-8 py-3 bg-foreground text-background rounded-xl font-black text-[10px] uppercase tracking-[0.2em] cursor-pointer hover:scale-105 transition-transform"
                                                >
                                                    Browse Files
                                                </label>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="p-6 rounded-3xl bg-secondary/50 border border-border">
                                            <div className="flex items-center justify-between mb-8">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Assets Identified: {ocrResults.length}</span>
                                                <button
                                                    onClick={() => setOcrResults([])}
                                                    className="text-[9px] font-black uppercase tracking-widest text-destructive hover:underline"
                                                >
                                                    Clear Buffer
                                                </button>
                                            </div>

                                            <div className="overflow-hidden rounded-2xl border border-border">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-background border-b border-border">
                                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identity</th>
                                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sector</th>
                                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Valuation</th>
                                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Qty</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border/50">
                                                        {ocrResults.map((p, idx) => (
                                                            <tr key={idx} className="bg-card hover:bg-secondary/20 transition-colors">
                                                                <td className="px-6 py-4 text-xs font-bold">{p.name}</td>
                                                                <td className="px-6 py-4">
                                                                    <span className="px-2 py-0.5 rounded-md bg-secondary text-[9px] font-black uppercase tracking-widest">{p.category || "General"}</span>
                                                                </td>
                                                                <td className="px-6 py-4 text-right font-mono text-xs">₹{p.price.toLocaleString()}</td>
                                                                <td className="px-6 py-4 text-right font-black italic text-xs">{p.stock}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {success ? (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center text-center gap-4 py-20"
                                            >
                                                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                                                <div className="space-y-1">
                                                    <p className="text-emerald-500 font-black uppercase tracking-[0.3em] text-sm">Batch_Commit_Success</p>
                                                    <p className="text-emerald-500/60 font-medium text-xs">All extracted assets have been merged with global catalog.</p>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <div className="flex items-center justify-between p-8 rounded-3xl bg-foreground text-background">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Ready to Merge</p>
                                                    <p className="text-sm font-black italic uppercase tracking-tighter">Commit {ocrResults.length} Units to Data-Lake?</p>
                                                </div>
                                                <button
                                                    onClick={handleCommitOcr}
                                                    disabled={isSubmitting}
                                                    className="flex items-center gap-3 px-10 py-4 bg-background text-foreground rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                                >
                                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                                                    Finalize Merge
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {error && (
                                    <div className="p-5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                                        <AlertCircle className="h-4 w-4" /> Error: {error}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Elite Create Asset Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isSubmitting && setIsModalOpen(false)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-xl"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-card border border-border rounded-[3.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="p-10 border-b border-border flex items-center justify-between">
                                <div className="space-y-1">
                                    <h2 className="text-xs font-black uppercase tracking-[0.4em] text-foreground flex items-center gap-3">
                                        <Plus className="h-4 w-4 text-primary" /> Create_New_Entity
                                    </h2>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic font-serif">Secure Data Entry Buffer v1.0</p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-3 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-10 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Product Name */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Tag className="h-3 w-3" /> Identity_Label
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="ENTITY_NAME"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-secondary/50 border border-border focus:border-foreground/20 rounded-2xl px-6 py-4 text-sm font-bold tracking-tight focus:outline-none transition-all placeholder:text-muted-foreground/30 focus:bg-background"
                                        />
                                    </div>

                                    {/* Category */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Boxes className="h-3 w-3" /> Category_Cluster
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="CORE_SECTOR"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full bg-secondary/50 border border-border focus:border-foreground/20 rounded-2xl px-6 py-4 text-sm font-bold tracking-tight focus:outline-none transition-all placeholder:text-muted-foreground/30 focus:bg-background"
                                        />
                                    </div>

                                    {/* Price */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Coins className="h-3 w-3" /> Valuation_INR
                                        </label>
                                        <input
                                            required
                                            type="number"
                                            placeholder="00.00"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full bg-secondary/50 border border-border focus:border-foreground/20 rounded-2xl px-6 py-4 text-sm font-bold tracking-tight focus:outline-none transition-all placeholder:text-muted-foreground/30 focus:bg-background"
                                        />
                                    </div>

                                    {/* Cost */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Activity className="h-3 w-3" /> Base_Cost_INR
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="AUTO_SYNT"
                                            value={formData.cost}
                                            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                            className="w-full bg-secondary/50 border border-border focus:border-foreground/20 rounded-2xl px-6 py-4 text-sm font-bold tracking-tight focus:outline-none transition-all placeholder:text-muted-foreground/30 focus:bg-background"
                                        />
                                    </div>

                                    {/* Stock */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Warehouse className="h-3 w-3" /> Initial_Liquidity
                                        </label>
                                        <input
                                            required
                                            type="number"
                                            placeholder="QUANTITY"
                                            value={formData.stock}
                                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                            className="w-full bg-secondary/50 border border-border focus:border-foreground/20 rounded-2xl px-6 py-4 text-sm font-bold tracking-tight focus:outline-none transition-all placeholder:text-muted-foreground/30 focus:bg-background"
                                        />
                                    </div>

                                    {/* Reorder Point */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Shield className="h-3 w-3" /> Critical_Buffer_Limit
                                        </label>
                                        <input
                                            required
                                            type="number"
                                            value={formData.reorderPoint}
                                            onChange={(e) => setFormData({ ...formData, reorderPoint: e.target.value })}
                                            className="w-full bg-secondary/50 border border-border focus:border-foreground/20 rounded-2xl px-6 py-4 text-sm font-bold tracking-tight focus:outline-none transition-all placeholder:text-muted-foreground/30 focus:bg-background"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                                        <AlertCircle className="h-4 w-4" /> {error}
                                    </div>
                                )}

                                {success && (
                                    <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                                        <CheckCircle2 className="h-4 w-4" /> Entity_Successfully_Synthesized
                                    </div>
                                )}

                                <div className="pt-4 flex items-center justify-end gap-6">
                                    <button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() => setIsModalOpen(false)}
                                        className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        Abort_Entry
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex items-center gap-3 px-12 py-5 bg-foreground text-background rounded-3xl font-black text-[12px] uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-xl shadow-foreground/20"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Zap className="h-4 w-4 fill-background" />
                                        )}
                                        Commit_Asset
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: var(--color-border);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: var(--color-muted-foreground);
                }
            `}</style>
        </div>
    );
}
