"use client";

import { useState, useEffect } from "react";
import { Package, Search, Filter, ArrowUpRight, ShoppingBag, Layers } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function CatalogPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        async function fetchProducts() {
            try {
                const res = await fetch("/api/products");
                const data = await res.json();

                if (res.ok && Array.isArray(data)) {
                    setProducts(data);
                } else {
                    console.error("API error or invalid data format:", data);
                    setProducts([]); // Fallback to empty array
                }
            } catch (err) {
                console.error("Failed to fetch products:", err);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        }
        fetchProducts();
    }, []);

    const filteredProducts = Array.isArray(products) ? products.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.toLowerCase().includes(search.toLowerCase())
    ) : [];

    return (
        <div className="max-w-6xl mx-auto space-y-12 py-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">
                        <Package className="h-3 w-3" />
                        Inventory Protocol
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground">Strategic Catalog</h1>
                    <p className="text-muted-foreground text-sm font-medium">Manage and monitor your intelligence assets.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="glass-pill flex items-center px-4 py-2 gap-3 min-w-[300px]">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search catalog..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-transparent border-none text-sm font-bold focus:outline-none w-full"
                        />
                    </div>
                    <button className="p-2.5 rounded-xl glass border border-border hover:border-primary/50 transition-all">
                        <Filter className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-48 glass-pill animate-pulse rounded-3xl" />
                    ))}
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="h-64 glass rounded-[2.5rem] flex flex-col items-center justify-center text-center p-12 space-y-4">
                    <Layers className="h-12 w-12 text-muted-foreground/30" />
                    <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">No active assets found in sector.</p>
                    <button onClick={() => window.location.href = '/import'} className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">Sync Data Now →</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredProducts.map((product, idx) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="glass-pill p-6 group cursor-pointer hover:border-primary/40 transition-all"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <ShoppingBag className="h-5 w-5" />
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-20 group-hover:opacity-100 group-hover:text-primary transition-all" />
                            </div>

                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{product.category}</p>
                                <h3 className="text-lg font-black truncate">{product.name}</h3>
                            </div>

                            <div className="mt-6 pt-6 border-t border-border/50 flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pricing</p>
                                    <p className="text-xl font-black">₹{product.price.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Stock</p>
                                    <p className={cn("text-xs font-black", product.stock < 10 ? "text-rose-500" : "text-emerald-500")}>
                                        {product.stock} units
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
