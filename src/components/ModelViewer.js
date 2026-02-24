"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Sparkles, Scan, Maximize2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ModelViewer({ src, poster, alt, className }) {
    const [isLoading, setIsLoading] = useState(true);
    const [arSupported, setArSupported] = useState(false);
    const viewerRef = useRef(null);

    useEffect(() => {
        console.log("📡 ModelViewer Initializing...");

        // Import model-viewer only on client side
        import("@google/model-viewer")
            .then(() => {
                console.log("✅ @google/model-viewer defined.");
                // Check AR again once defined
                if (viewerRef.current) {
                    setArSupported(viewerRef.current.canActivateAR);
                }
            })
            .catch(err => {
                console.error("❌ Failed to load model-viewer:", err);
            });

        const viewer = viewerRef.current;
        if (viewer) {
            const handleLoad = () => {
                console.log("📦 Model loaded successfully:", src);
                setIsLoading(false);
            };
            const handleError = (error) => {
                console.error("❌ Model loading error:", error);
            };

            viewer.addEventListener("load", handleLoad);
            viewer.addEventListener("error", handleError);

            return () => {
                viewer.removeEventListener("load", handleLoad);
                viewer.removeEventListener("error", handleError);
            };
        }
    }, [src]);

    return (
        <div className={cn("relative group overflow-hidden bg-secondary/20 rounded-[2.5rem] border border-border/50 shadow-inner", className)}>
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
            </div>

            <model-viewer
                ref={viewerRef}
                src={src}
                poster={poster}
                alt={alt || "3D Product Model"}
                ar
                ar-modes="webxr scene-viewer quick-look"
                camera-controls
                auto-rotate
                shadow-intensity="1"
                environment-image="neutral"
                exposure="1"
                loading="eager"
                reveal="auto"
                touch-action="pan-y"
                className="w-full h-full outline-none"
            >
                {/* Custom Poster / Loading State */}
                <div slot="poster" className="absolute inset-0 flex items-center justify-center bg-card">
                    {poster ? (
                        <Image
                            src={poster}
                            alt="Loading..."
                            fill
                            className="object-contain opacity-50 blur-sm"
                            unoptimized
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center animate-pulse">
                                <Maximize2 className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Initializing_Spatial_Data</span>
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                {isLoading && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-secondary overflow-hidden">
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: "0%" }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-full h-full bg-primary shadow-[0_0_10px_var(--color-primary)]"
                        />
                    </div>
                )}

                {/* AR Button (Customized) */}
                <button
                    slot="ar-button"
                    className="absolute bottom-6 right-6 flex items-center gap-3 px-6 py-4 bg-foreground text-background rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all z-20"
                >
                    <Scan className="h-4 w-4" />
                    View in Space
                </button>

                {/* UI Overlays */}
                <div className="absolute top-6 left-6 flex flex-col gap-2 pointer-events-none z-10">
                    <div className="flex items-center gap-2 px-3 py-1 bg-background/50 backdrop-blur-md border border-border/50 rounded-full scale-90 origin-left">
                        <Sparkles className="h-3 w-3 text-primary" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-foreground">NextGen_Visuals_v4.0</span>
                    </div>
                </div>

                <div className="absolute top-6 right-6 flex gap-2 z-10">
                    <div className="p-3 rounded-2xl bg-background/30 backdrop-blur-md border border-border/30 text-muted-foreground/50">
                        <Maximize2 className="h-4 w-4" />
                    </div>
                </div>
            </model-viewer>
        </div>
    );
}
