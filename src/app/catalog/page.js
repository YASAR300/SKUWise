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
    Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function CatalogPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

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
        setLoading(true);
        try {
            const res = await fetch("/api/products");
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setProducts(data);
            } else {
                setProducts([]);
            }
        } catch (err) {
            console.error("Failed to fetch products:", err);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }

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

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="group relative flex items-center gap-3 px-8 py-4 bg-foreground text-background rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-foreground/10"
                    >
                        <Plus className="h-4 w-4" />
                        Create Asset
                    </button>

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
        </div>
    );
}
