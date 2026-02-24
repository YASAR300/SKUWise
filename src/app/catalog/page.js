"use client";

import { useState, useEffect, useCallback, memo } from "react";
import Image from "next/image";
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
    Sparkles,
    Upload,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Star,
    TrendingUp,
    MessageSquare,
    Trash2,
    BarChart2,
    Edit3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { fetchWithRetry } from "@/lib/api-utils";
import SkeletonLoader from "@/components/SkeletonLoader";
import confetti from "canvas-confetti";
import Portal from "@/components/Portal";
import ModelViewer from "@/components/ModelViewer";
import BulkImportModal from "@/components/BulkImportModal";

// Move ProductCard outside of CatalogPage component for stability and performance
const ProductCard = memo(({ product, onSelect }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={() => onSelect?.(product)}
            className="bg-card p-0 rounded-[2.5rem] border border-border hover:border-foreground/20 hover:shadow-2xl transition-all group flex flex-col relative overflow-hidden cursor-pointer"
        >
            {/* Visual Asset Area */}
            <div className="relative h-64 w-full bg-secondary/30 overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                {product.imageUrl ? (
                    <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
                        <ShoppingBag className="h-16 w-16 mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest">No_Asset_Loaded</span>
                    </div>
                )}

                {/* Overlay Metadata */}
                <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-2 py-1 bg-background/80 backdrop-blur-md rounded-lg text-[8px] font-black uppercase tracking-widest border border-border text-muted-foreground">
                        {product.category}
                    </span>
                </div>

                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all">
                    <div className="h-10 w-10 rounded-xl bg-background/80 backdrop-blur-md flex items-center justify-center text-foreground border border-border shadow-lg">
                        <Activity className="h-4 w-4" />
                    </div>
                </div>
            </div>

            <div className="p-8 space-y-4 flex-grow flex flex-col">
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1 min-w-0">
                        <h3 className="text-xl font-black text-foreground tracking-tighter leading-tight italic group-hover:translate-x-1 transition-transform truncate">
                            {product.name}
                        </h3>
                        <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] font-mono">
                            ID_{product.id.slice(-8)}
                        </p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-20 group-hover:opacity-100 transition-all shrink-0" />
                </div>

                <div className="mt-auto pt-6 border-t border-border flex justify-between items-end">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Valuation</p>
                        <p className="text-2xl font-black text-foreground tracking-tighter italic">₹{product.price.toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                window.dispatchEvent(new CustomEvent('open-3d-preview', { detail: product }));
                            }}
                            className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all group/btn flex items-center justify-center"
                        >
                            <CubeTransparentIcon className="h-4 w-4" />
                        </button>
                        <div className="text-right space-y-1">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Liquidity</p>
                            <p className={cn(
                                "text-[10.5px] font-black italic uppercase tracking-tighter",
                                product.stock < (product.reorderPoint || 10) ? "text-rose-500" : "text-foreground"
                            )}>
                                {product.stock} Units
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
});
ProductCard.displayName = "ProductCard";

// Helper component for the Icon since heroicons might not be globally available
function CubeTransparentIcon({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-5.25v9" />
        </svg>
    );
}

// ── ProductDetailSheet ─────────────────────────────────────────────────────
function ProductDetailSheet({ product, onClose }) {
    const [sales, setSales] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [salesLoading, setSalesLoading] = useState(true);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [tab, setTab] = useState("sales"); // "sales" | "reviews"

    // Sales form
    const [saleForm, setSaleForm] = useState({ unitsSold: "", revenue: "", date: new Date().toISOString().substring(0, 10) });
    const [savingSale, setSavingSale] = useState(false);
    const [saleMsg, setSaleMsg] = useState(null);

    // Review form
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "", date: new Date().toISOString().substring(0, 10) });
    const [savingReview, setSavingReview] = useState(false);
    const [reviewMsg, setReviewMsg] = useState(null);

    useEffect(() => {
        if (!product) return;
        setSalesLoading(true);
        setReviewsLoading(true);
        fetch(`/api/sales?productId=${product.id}`)
            .then(r => r.json())
            .then(d => setSales(d.sales || []))
            .finally(() => setSalesLoading(false));
        fetch(`/api/reviews?productId=${product.id}`)
            .then(r => r.json())
            .then(d => setReviews(d.reviews || []))
            .finally(() => setReviewsLoading(false));
    }, [product]);

    const handleAddSale = async (e) => {
        e.preventDefault();
        if (!saleForm.unitsSold || !saleForm.revenue) return;
        setSavingSale(true);
        setSaleMsg(null);
        try {
            const res = await fetch("/api/sales", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: product.id, ...saleForm }),
            });
            const data = await res.json();
            if (res.ok) {
                setSales(prev => [data.sale, ...prev]);
                setSaleForm({ unitsSold: "", revenue: "", date: new Date().toISOString().substring(0, 10) });
                setSaleMsg({ type: "success", text: "Sale entry saved!" });
            } else throw new Error(data.error);
        } catch (err) {
            setSaleMsg({ type: "error", text: err.message });
        } finally {
            setSavingSale(false);
            setTimeout(() => setSaleMsg(null), 3000);
        }
    };

    const handleDeleteSale = async (id) => {
        await fetch(`/api/sales?id=${id}`, { method: "DELETE" });
        setSales(prev => prev.filter(s => s.id !== id));
    };

    const handleAddReview = async (e) => {
        e.preventDefault();
        setSavingReview(true);
        setReviewMsg(null);
        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: product.id, ...reviewForm }),
            });
            const data = await res.json();
            if (res.ok) {
                setReviews(prev => [data.review, ...prev]);
                setReviewForm({ rating: 5, comment: "", date: new Date().toISOString().substring(0, 10) });
                setReviewMsg({ type: "success", text: "Review saved!" });
            } else throw new Error(data.error);
        } catch (err) {
            setReviewMsg({ type: "error", text: err.message });
        } finally {
            setSavingReview(false);
            setTimeout(() => setReviewMsg(null), 3000);
        }
    };

    const handleDeleteReview = async (id) => {
        await fetch(`/api/reviews?id=${id}`, { method: "DELETE" });
        setReviews(prev => prev.filter(r => r.id !== id));
    };

    const totalRevenue = sales.reduce((s, d) => s + d.revenue, 0);
    const totalUnits = sales.reduce((s, d) => s + d.unitsSold, 0);
    const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

    return (
        <Portal>
            <AnimatePresence>
                {product && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 z-[200] bg-background/60 backdrop-blur-sm"
                        />
                        {/* Sheet */}
                        <motion.div
                            key="sheet"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed right-0 top-0 bottom-0 z-[201] w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-border flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-1">Product Detail</p>
                                    <h2 className="text-lg font-black tracking-tighter italic truncate">{product.name}</h2>
                                    <p className="text-[10px] text-muted-foreground font-bold mt-0.5">{product.category} · ₹{product.price?.toLocaleString()} · {product.stock} units</p>
                                </div>
                                <button onClick={onClose} className="p-2 rounded-xl hover:bg-accent transition-all flex-shrink-0">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* KPI row */}
                            <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
                                <div className="p-4 text-center">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Revenue</p>
                                    <p className="text-base font-black text-emerald-500">₹{totalRevenue.toLocaleString()}</p>
                                </div>
                                <div className="p-4 text-center">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Units Sold</p>
                                    <p className="text-base font-black">{totalUnits}</p>
                                </div>
                                <div className="p-4 text-center">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Avg Rating</p>
                                    <p className="text-base font-black text-amber-500">{avgRating ? `${avgRating}/5` : "—"}</p>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-border">
                                {[{ id: "sales", label: "Sales", icon: TrendingUp }, { id: "reviews", label: "Reviews", icon: Star }].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTab(t.id)}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                                            tab === t.id ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <t.icon className="h-3.5 w-3.5" />{t.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="flex-1 overflow-y-auto">
                                {tab === "sales" && (
                                    <div className="p-5 space-y-5">
                                        {/* Add Sale Form */}
                                        <form onSubmit={handleAddSale} className="space-y-3 bg-secondary/50 rounded-2xl p-4 border border-border">
                                            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2">
                                                <BarChart2 className="h-3 w-3" /> Add Sales Record
                                            </p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Units Sold *</label>
                                                    <input
                                                        type="number" min="1" required
                                                        placeholder="e.g. 5"
                                                        value={saleForm.unitsSold}
                                                        onChange={e => setSaleForm(f => ({ ...f, unitsSold: e.target.value }))}
                                                        className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm font-bold focus:outline-none focus:border-primary transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Revenue (₹) *</label>
                                                    <input
                                                        type="number" min="0" step="0.01" required
                                                        placeholder="e.g. 1750"
                                                        value={saleForm.revenue}
                                                        onChange={e => setSaleForm(f => ({ ...f, revenue: e.target.value }))}
                                                        className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm font-bold focus:outline-none focus:border-primary transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Date</label>
                                                <input
                                                    type="date"
                                                    value={saleForm.date}
                                                    onChange={e => setSaleForm(f => ({ ...f, date: e.target.value }))}
                                                    className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm font-bold focus:outline-none focus:border-primary transition-all"
                                                />
                                            </div>
                                            {saleMsg && (
                                                <p className={cn("text-[10px] font-black", saleMsg.type === "success" ? "text-emerald-500" : "text-destructive")}>{saleMsg.text}</p>
                                            )}
                                            <button type="submit" disabled={savingSale} className="w-full py-2.5 rounded-xl bg-foreground text-background text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-all disabled:opacity-50">
                                                {savingSale ? "Saving..." : "Save Sales Entry"}
                                            </button>
                                        </form>

                                        {/* Sales History */}
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">History ({sales.length} entries)</p>
                                            {salesLoading ? (
                                                <div className="h-16 flex items-center justify-center opacity-30"><Loader2 className="h-5 w-5 animate-spin" /></div>
                                            ) : sales.length === 0 ? (
                                                <div className="py-8 text-center opacity-30">
                                                    <p className="text-[9px] font-black uppercase tracking-widest">No sales recorded yet</p>
                                                </div>
                                            ) : sales.map(s => (
                                                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary border border-border group">
                                                    <div>
                                                        <p className="text-xs font-black">{s.unitsSold} units · ₹{s.revenue?.toLocaleString()}</p>
                                                        <p className="text-[8px] text-muted-foreground font-bold">{new Date(s.date).toLocaleDateString("en-IN")}</p>
                                                    </div>
                                                    <button onClick={() => handleDeleteSale(s.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {tab === "reviews" && (
                                    <div className="p-5 space-y-5">
                                        {/* Add Review Form */}
                                        <form onSubmit={handleAddReview} className="space-y-3 bg-secondary/50 rounded-2xl p-4 border border-border">
                                            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2">
                                                <MessageSquare className="h-3 w-3" /> Add Customer Review
                                            </p>
                                            <div>
                                                <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Rating (1–5) *</label>
                                                <div className="flex gap-1 mt-2">
                                                    {[1, 2, 3, 4, 5].map(n => (
                                                        <button
                                                            key={n} type="button"
                                                            onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                                                            className="p-1"
                                                        >
                                                            <Star className={cn("h-5 w-5", n <= reviewForm.rating ? "text-amber-400 fill-amber-400" : "text-border")} />
                                                        </button>
                                                    ))}
                                                    <span className="ml-2 text-sm font-black self-center">{reviewForm.rating}/5</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Comment (optional)</label>
                                                <textarea
                                                    rows={3}
                                                    placeholder="Customer feedback..."
                                                    value={reviewForm.comment}
                                                    onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                                                    className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm font-bold focus:outline-none focus:border-primary transition-all resize-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Date</label>
                                                <input
                                                    type="date"
                                                    value={reviewForm.date}
                                                    onChange={e => setReviewForm(f => ({ ...f, date: e.target.value }))}
                                                    className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm font-bold focus:outline-none focus:border-primary transition-all"
                                                />
                                            </div>
                                            {reviewMsg && (
                                                <p className={cn("text-[10px] font-black", reviewMsg.type === "success" ? "text-emerald-500" : "text-destructive")}>{reviewMsg.text}</p>
                                            )}
                                            <button type="submit" disabled={savingReview} className="w-full py-2.5 rounded-xl bg-foreground text-background text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-all disabled:opacity-50">
                                                {savingReview ? "Saving..." : "Save Review"}
                                            </button>
                                        </form>

                                        {/* Reviews list */}
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">Reviews ({reviews.length})</p>
                                            {reviewsLoading ? (
                                                <div className="h-16 flex items-center justify-center opacity-30"><Loader2 className="h-5 w-5 animate-spin" /></div>
                                            ) : reviews.length === 0 ? (
                                                <div className="py-8 text-center opacity-30">
                                                    <p className="text-[9px] font-black uppercase tracking-widest">No reviews yet</p>
                                                </div>
                                            ) : reviews.map(r => (
                                                <div key={r.id} className="p-3 rounded-xl bg-secondary border border-border group space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex gap-0.5">
                                                            {[1, 2, 3, 4, 5].map(n => (
                                                                <Star key={n} className={cn("h-3 w-3", n <= r.rating ? "text-amber-400 fill-amber-400" : "text-border")} />
                                                            ))}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[8px] text-muted-foreground font-bold">{new Date(r.date).toLocaleDateString("en-IN")}</span>
                                                            <button onClick={() => handleDeleteReview(r.id)} className="p-1 rounded text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all">
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {r.comment && <p className="text-xs text-muted-foreground font-medium leading-relaxed">{r.comment}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </Portal>
    );
}

export default function CatalogPage() {
    const { status } = useSession();
    const router = useRouter();
    const [availableCategories, setAvailableCategories] = useState(["all"]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [sortBy, setSortBy] = useState("updatedAt");
    const [sortOrder, setSortOrder] = useState("desc");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0 });
    const [selectedProduct, setSelectedProduct] = useState(null); // for detail sheet

    const [isModalOpen, setIsModalOpen] = useState(false);
    // Bulk Import Specific State
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [preview3DProduct, setPreview3DProduct] = useState(null);

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


    const fetchProducts = useCallback(async (signal) => {
        if (status !== "authenticated") return;
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                search,
                category,
                sortBy,
                sortOrder
            });
            const res = await fetchWithRetry(`/api/products?${params.toString()}`, { signal });

            if (res.status === 401) {
                router.push("/login");
                return;
            }

            const data = await res.json();

            if (res.ok) {
                setProducts(data.products || []);
                setPagination(data.pagination || { totalPages: 1, totalItems: 0 });

                // Update dynamic categories
                if (data.categories) {
                    setAvailableCategories(["all", ...data.categories.filter(c => c !== "all")]);
                }
            } else {
                throw new Error(data.error || "Failed to fetch sector data");
            }
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.error("Link Failure:", err);
            setError(err.message);
        } finally {
            // Only stop spinning if this was the last request called
            setLoading(false);
        }
    }, [page, search, category, sortBy, sortOrder, status, router]);

    useEffect(() => {
        const handleOpen3D = (e) => {
            console.log("🎯 3D Preview Event Caught:", e.detail);
            setPreview3DProduct(e.detail);
        };
        window.addEventListener('open-3d-preview', handleOpen3D);
        return () => window.removeEventListener('open-3d-preview', handleOpen3D);
    }, []);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            const controller = new AbortController();
            const timer = setTimeout(() => {
                fetchProducts(controller.signal);
            }, 300);
            return () => {
                clearTimeout(timer);
                controller.abort();
            };
        }
    }, [fetchProducts, status, router]);

    if (status === "loading") {
        return <div className="min-h-screen flex items-center justify-center font-black uppercase tracking-widest opacity-20">Accessing_Catalog_Node...</div>;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetchWithRetry("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                fetchProducts();
                setSuccess(true);
                setTimeout(() => {
                    setIsModalOpen(false);
                    setSuccess(false);
                    setFormData({ name: "", category: "", price: "", stock: "", cost: "", reorderPoint: "10" });
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

    return (
        <div className="max-w-[1400px] mx-auto space-y-12 py-16 px-8 relative min-h-screen pb-32">
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
                            Managing <span className="text-foreground font-bold underline decoration-primary/30">{pagination.totalItems} high-value assets</span> across global sectors.
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
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full bg-background border border-border focus:border-foreground/20 rounded-2xl pl-12 pr-12 py-4 text-[10px] font-black tracking-widest uppercase focus:outline-none transition-all shadow-inner"
                        />
                        {loading && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <Loader2 className="h-4 w-4 text-primary animate-spin" />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fetchProducts()}
                            className="p-4 rounded-2xl bg-secondary border border-border hover:bg-accent transition-all text-muted-foreground flex items-center justify-center min-w-[52px]"
                        >
                            <Loader2 className={cn("h-5 w-5", loading && "animate-spin")} />
                        </button>

                        <button
                            onClick={() => setIsBulkImportOpen(true)}
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
                </div>
            </header>

            <div className="space-y-6">
                <div className="overflow-x-auto custom-horizontal-scrollbar">
                    <div className="flex items-center gap-2 pb-2">
                        {availableCategories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => { setCategory(cat); setPage(1); }}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                                    (category === cat || (cat !== 'all' && category?.toLowerCase() === cat.toLowerCase()))
                                        ? "bg-foreground text-background border-foreground"
                                        : "bg-secondary text-muted-foreground border-border hover:border-foreground/20"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between border-t border-border/10 pt-4">
                    <div className="flex bg-secondary rounded-xl p-1 border border-border">
                        {[
                            { label: "Recent", val: "updatedAt" },
                            { label: "Price", val: "price" },
                            { label: "Stock", val: "stock" }
                        ].map((s) => (
                            <button
                                key={s.val}
                                onClick={() => { setSortBy(s.val); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all",
                                    sortBy === s.val ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {s.label}
                                {sortBy === s.val && <ArrowUpDown className="h-3 w-3 opacity-50" />}
                            </button>
                        ))}
                    </div>

                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">
                        Synthesized_Catalog_View
                    </div>
                </div>
            </div>

            {loading && products.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <SkeletonLoader key={i} />
                    ))}
                </div>
            ) : products.length === 0 ? (
                <div className="h-[400px] bg-card border border-dashed border-border rounded-[3rem] flex flex-col items-center justify-center text-center p-12 space-y-6">
                    <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center opacity-40">
                        <Layers className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-foreground font-black uppercase tracking-[0.3em] text-sm italic underline">Sector_Void_Warning</p>
                        <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">No assets found for the specified parameters.</p>
                    </div>
                    <button
                        onClick={() => { setSearch(""); setCategory("all"); setPage(1); }}
                        className="text-primary text-[10px] font-black uppercase tracking-widest hover:scale-110 transition-transform flex items-center gap-2"
                    >
                        Clear All Constraints <X className="h-3 w-3" />
                    </button>
                </div>
            ) : (
                <motion.div
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                    <AnimatePresence mode="popLayout">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} onSelect={setSelectedProduct} />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 bg-background/80 backdrop-blur-xl border border-border p-2 rounded-3xl flex items-center gap-2 shadow-2xl">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-4 rounded-2xl bg-secondary hover:bg-accent disabled:opacity-30 disabled:hover:bg-secondary transition-all"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>

                    <div className="px-6 flex items-center gap-3">
                        <span className="text-[10px] font-black tracking-widest uppercase">Page</span>
                        <span className="text-lg font-black italic">{page}</span>
                        <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">of {pagination.totalPages}</span>
                    </div>

                    <button
                        onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                        disabled={page === pagination.totalPages}
                        className="p-4 rounded-2xl bg-secondary hover:bg-accent disabled:opacity-30 disabled:hover:bg-secondary transition-all"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            )}


            {/* 3D Preview Matrix Modal */}
            <AnimatePresence>
                {preview3DProduct && (
                    <Portal>
                        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 sm:p-12">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setPreview3DProduct(null)}
                                className="absolute inset-0 bg-background/90 backdrop-blur-2xl"
                            />

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                                className="relative w-full max-w-5xl h-[80vh] bg-card border border-border rounded-[4rem] shadow-2xl overflow-hidden flex flex-col sm:flex-row"
                            >
                                {/* Left Side: 3D Control Center */}
                                <div className="p-12 w-full sm:w-1/3 border-b sm:border-b-0 sm:border-r border-border flex flex-col justify-between bg-secondary/10">
                                    <div className="space-y-8">
                                        <div className="space-y-2">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                                                <Sparkles className="h-3 w-3 text-primary" />
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-primary">Spatial_Intelligence_Active</span>
                                            </div>
                                            <h2 className="text-4xl font-black italic tracking-tighter leading-none">{preview3DProduct.name}</h2>
                                            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{preview3DProduct.category}</p>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Product_Identity</p>
                                                <p className="text-sm font-black font-mono opacity-40">{preview3DProduct.id}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 rounded-3xl bg-background border border-border">
                                                    <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Stock</p>
                                                    <p className="text-xl font-black italic">{preview3DProduct.stock}</p>
                                                </div>
                                                <div className="p-4 rounded-3xl bg-background border border-border">
                                                    <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Price</p>
                                                    <p className="text-xl font-black italic">₹{preview3DProduct.price}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-6 rounded-3xl bg-primary text-primary-foreground">
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">AR Stability</p>
                                            <div className="flex items-center gap-4">
                                                <div className="h-1 flex-grow bg-white/20 rounded-full overflow-hidden">
                                                    <div className="h-full bg-white w-[92%]" />
                                                </div>
                                                <span className="text-xs font-black">92%</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setPreview3DProduct(null)}
                                            className="w-full p-5 rounded-3xl bg-secondary border border-border font-black text-[10px] uppercase tracking-widest hover:bg-muted transition-all"
                                        >
                                            Deactivate View
                                        </button>
                                    </div>
                                </div>

                                {/* Right Side: The Matrix (Model) */}
                                <div className="relative flex-grow h-full bg-background grayscale-[0.2] hover:grayscale-0 transition-all duration-700">
                                    <ModelViewer
                                        src="https://modelviewer.dev/shared-assets/models/Astronaut.glb"
                                        alt={preview3DProduct.name}
                                        className="w-full h-full"
                                    />

                                    <button
                                        onClick={() => setPreview3DProduct(null)}
                                        className="absolute top-8 right-8 p-4 rounded-full bg-background/50 backdrop-blur-md border border-border hover:bg-background transition-all z-30"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </Portal>
                )}
            </AnimatePresence>

            {/* Asset Entry Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <Portal>
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isSubmitting && setIsModalOpen(false)} className="absolute inset-0 bg-background/80 backdrop-blur-xl" />
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-card border border-border rounded-[3.5rem] shadow-2xl overflow-hidden p-10 pt-16">
                                <div className="absolute top-8 right-8 cursor-pointer" onClick={() => setIsModalOpen(false)}><X /></div>
                                <h2 className="text-3xl font-black italic mb-8 uppercase tracking-tighter">New Asset Entry</h2>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="text" placeholder="NAME" required className="p-4 bg-secondary rounded-xl font-bold uppercase text-xs" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                        <input type="text" placeholder="CATEGORY" required className="p-4 bg-secondary rounded-xl font-bold uppercase text-xs" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                                        <input type="number" placeholder="PRICE" required className="p-4 bg-secondary rounded-xl font-bold uppercase text-xs" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                        <input type="number" placeholder="STOCK" required className="p-4 bg-secondary rounded-xl font-bold uppercase text-xs" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                                    </div>
                                    <button type="submit" disabled={isSubmitting} className="w-full p-6 bg-foreground text-background font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2">
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : <Zap className="h-4 w-4" />} Commit Entity
                                    </button>
                                    {success && <p className="text-emerald-500 font-black text-center text-[10px] uppercase">Entity Successfully Synthesized</p>}
                                </form>
                            </motion.div>
                        </div>
                    </Portal>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

                .custom-horizontal-scrollbar::-webkit-scrollbar {
                    height: 4px;
                }
                .custom-horizontal-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-horizontal-scrollbar::-webkit-scrollbar-thumb {
                    background: var(--color-border);
                    border-radius: 10px;
                    transition: all 0.3s;
                }
                .custom-horizontal-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: var(--color-primary);
                }
                .custom-horizontal-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: var(--color-border) transparent;
                    padding-bottom: 8px;
                }
            `}</style>

            {/* Product Detail Sheet */}
            <ProductDetailSheet
                product={selectedProduct}
                onClose={() => setSelectedProduct(null)}
            />
            {/* Bulk Import Modal */}
            <BulkImportModal
                isOpen={isBulkImportOpen}
                onClose={() => setIsBulkImportOpen(false)}
                onComplete={() => fetchProducts()}
            />
        </div>
    );
}
