"use client";

import { useChat } from "@/components/ChatProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Volume2, VolumeX, Plus, Sidebar as SidebarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ChatResponse from "@/components/ChatResponse";
import SourcePreviewModal from "@/components/SourcePreviewModal";
import { useState, useEffect } from "react";

export default function ChatPage() {
    const {
        messages,
        isLoading,
        messagesEndRef,
        handleSendMessage,
        isSpeaking,
        handleSpeak,
        handleSourceClick,
        selectedSource,
        isSourceModalOpen,
        setIsSourceModalOpen
    } = useChat();

    // Auto-scroll inside the page container
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading, messagesEndRef]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="h-full overflow-y-auto bg-background/50 scroll-smooth custom-scrollbar"
        >
            <div className="max-w-3xl mx-auto px-4 py-8">
                {isLoading && messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 animate-pulse">
                            Initializing_Chat_Node...
                        </p>
                    </div>
                ) : messages.length === 0 && !isLoading ? (
                    <div className="text-center py-20">
                        <Sparkles className="h-16 w-16 mx-auto mb-6 text-primary animate-pulse" />
                        <h2 className="text-3xl font-bold mb-3 tracking-tight">How can I help you excel?</h2>
                        <p className="text-muted-foreground text-lg">
                            Analyze inventories, optimize margins, or plan your next growth move.
                        </p>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {messages.map((message, index) => (
                            <motion.div
                                key={message.id || index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "mb-8",
                                    message.role === "user" ? "flex justify-end" : ""
                                )}
                            >
                                {message.role === "user" ? (
                                    <div className="max-w-[80%] px-6 py-4 rounded-3xl bg-primary text-primary-foreground shadow-xl shadow-primary/10">
                                        <p className="text-sm leading-relaxed font-medium">{message.content}</p>
                                    </div>
                                ) : (
                                    <div className="w-full">
                                        <div className="flex items-start gap-4 mb-3">
                                            <div className="p-2.5 rounded-2xl bg-primary shadow-lg shadow-primary/20 shrink-0">
                                                <Sparkles className="h-5 w-5 text-primary-foreground" />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <ChatResponse
                                                    content={message.content}
                                                    sources={message.sources}
                                                    onCitationClick={handleSourceClick}
                                                />

                                                <div className="mt-4 flex items-center gap-3">
                                                    <button
                                                        onClick={() => handleSpeak(message.content)}
                                                        className={cn(
                                                            "flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all text-[9px] font-bold uppercase tracking-[0.1em]",
                                                            isSpeaking ? "bg-primary/20 text-primary border-primary/30" : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/30"
                                                        )}
                                                    >
                                                        {isSpeaking ? <VolumeX className="h-2.5 w-2.5" /> : <Volume2 className="h-2.5 w-2.5" />}
                                                        {isSpeaking ? "Stop" : "Speak"}
                                                    </button>
                                                </div>

                                                {message.clarifications?.length > 0 && (
                                                    <div className="mt-8 space-y-3">
                                                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">
                                                            <SidebarIcon className="h-3 w-3" />
                                                            Suggested Syntheses
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {message.clarifications.map((q, i) => (
                                                                <button
                                                                    key={i}
                                                                    onClick={() => handleSendMessage(q)}
                                                                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-card border border-border hover:border-primary hover:bg-primary/5 transition-all text-xs font-bold shadow-sm"
                                                                >
                                                                    {q}
                                                                    <Plus className="h-3 w-3 text-primary" />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}

                {isLoading && messages.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-4 mb-8">
                        <div className="p-2.5 rounded-2xl bg-primary/10 shrink-0">
                            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                        </div>
                        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-secondary/30 border border-border/50 shadow-sm">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Processing_Neural_Response...</span>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} className="h-10" />
            </div>
        </motion.div>
    );
}
