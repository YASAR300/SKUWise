"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, Send, Command, Loader2, Check } from "lucide-react";

export default function VoiceOverlay({ isRecording, transcript, voiceMode, onStop, onConfirm }) {
    if (!isRecording) return null;

    const statusMap = {
        listening: "Listening to Matrix...",
        processing: "Analyzing neural signals...",
        reviewing: "Review your request",
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-2xl flex flex-col items-center justify-center p-6"
        >
            {/* Pulsing Aura */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: voiceMode === 'listening' ? [1, 1.2, 1] : 1,
                        opacity: voiceMode === 'listening' ? [0.1, 0.2, 0.1] : 0.05
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px]"
                />
            </div>

            <div className="relative z-10 w-full max-w-2xl flex flex-col items-center gap-12 text-center">
                <div className="space-y-4">
                    <motion.div
                        animate={voiceMode === 'listening' ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="p-8 rounded-full bg-primary/10 border border-primary/20 text-primary shadow-[0_0_50px_rgba(var(--primary-rgb),0.2)]"
                    >
                        {voiceMode === 'processing' ? (
                            <Loader2 className="h-12 w-12 animate-spin" />
                        ) : voiceMode === 'reviewing' ? (
                            <Check className="h-12 w-12" />
                        ) : (
                            <Mic className="h-12 w-12" />
                        )}
                    </motion.div>
                    <div className="flex items-center justify-center gap-2">
                        {voiceMode === 'listening' && <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />}
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/70">
                            {statusMap[voiceMode] || "Voice_Link_Active"}
                        </span>
                    </div>
                </div>

                <div className="space-y-6 w-full">
                    <div className="min-h-[120px] bg-muted/50 rounded-3xl p-8 border border-border/50 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                        <p className="text-xl md:text-3xl font-medium text-foreground/90 leading-tight">
                            {voiceMode === 'processing' ? "Transcribing..." : (transcript || "Speak now, I'm listening...")}
                        </p>
                        {voiceMode === 'listening' && !transcript && (
                            <div className="mt-6 flex gap-1 justify-center">
                                {[...Array(8)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ height: [8, 24, 8] }}
                                        transition={{
                                            duration: 0.8,
                                            repeat: Infinity,
                                            delay: i * 0.1,
                                            ease: "easeInOut"
                                        }}
                                        className="w-1 bg-primary/40 rounded-full"
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-2">
                        <Command className="h-3 w-3" />
                        Try saying: "Show inventory" or "Create new chat"
                    </p>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onStop}
                        className="px-8 py-4 rounded-full bg-muted border border-border text-foreground font-bold text-xs uppercase tracking-widest hover:bg-muted/80 transition-all flex items-center gap-2"
                    >
                        <X className="h-4 w-4" />
                        {voiceMode === 'reviewing' ? 'Discard' : 'Cancel'}
                    </button>
                    {voiceMode !== 'processing' && (
                        <button
                            onClick={onConfirm}
                            disabled={!transcript && voiceMode === 'reviewing'}
                            className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all shadow-xl shadow-primary/20 flex items-center gap-2"
                        >
                            {voiceMode === 'listening' ? (
                                <>
                                    <div className="h-2 w-2 rounded-full bg-white animate-pulse mr-1" />
                                    Stop & Review
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Confirm & Send
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
