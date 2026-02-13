"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send,
    Loader2,
    ThumbsUp,
    ThumbsDown,
    Copy,
    Check,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import ConversationSidebar from "@/components/ConversationSidebar";

export default function ChatPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const messagesEndRef = useRef(null);

    const conversationId = params.id;
    const initialQuery = searchParams.get("query");

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [conversation, setConversation] = useState(null);

    // Load conversation on mount
    useEffect(() => {
        loadConversation();
    }, [conversationId]);

    // Handle initial query
    useEffect(() => {
        if (initialQuery && messages.length === 0) {
            handleSendMessage(initialQuery);
        }
    }, [initialQuery]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function loadConversation() {
        try {
            const res = await fetch(`/api/conversations/${conversationId}`);
            if (res.ok) {
                const data = await res.json();
                setConversation(data.conversation);
                setMessages(data.conversation.messages || []);
            }
        } catch (error) {
            console.error("Failed to load conversation:", error);
        }
    }

    async function handleSendMessage(text = input) {
        if (!text.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            role: "user",
            content: text,
            createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            // Send to AI
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: text,
                    mode: "quick",
                    conversationId,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                const aiMessage = {
                    id: Date.now() + 1,
                    role: "assistant",
                    content: data.answer,
                    sources: data.sources || [],
                    clarifications: data.clarifications || [],
                    createdAt: new Date().toISOString(),
                };

                setMessages((prev) => [...prev, aiMessage]);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error("Failed to send message:", error);
            const errorMessage = {
                id: Date.now() + 1,
                role: "assistant",
                content: "Sorry, I encountered an error. Please try again.",
                createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }

    function handleNewConversation() {
        router.push("/");
    }

    function handleSelectConversation(id) {
        router.push(`/chat/${id}`);
    }

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            {/* Sidebar */}
            <ConversationSidebar
                currentConversationId={conversationId}
                onSelectConversation={handleSelectConversation}
                onNewConversation={handleNewConversation}
            />

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col pl-[280px]">
                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-3xl mx-auto px-4 py-8">
                        <AnimatePresence>
                            {messages.map((message, index) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={cn(
                                        "mb-6",
                                        message.role === "user" ? "flex justify-end" : ""
                                    )}
                                >
                                    {message.role === "user" ? (
                                        // User Message
                                        <div className="max-w-[80%] px-6 py-4 rounded-2xl bg-primary text-primary-foreground">
                                            <p className="text-sm leading-relaxed">{message.content}</p>
                                        </div>
                                    ) : (
                                        // AI Message
                                        <div className="w-full">
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="p-2 rounded-lg bg-primary/10">
                                                    <Sparkles className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                                        <ReactMarkdown>{message.content}</ReactMarkdown>
                                                    </div>

                                                    {/* Sources */}
                                                    {message.sources && message.sources.length > 0 && (
                                                        <div className="mt-4 p-4 rounded-xl bg-secondary/30 border border-border">
                                                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                                                Data Sources
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {message.sources.map((source, i) => (
                                                                    <span
                                                                        key={i}
                                                                        className="px-2 py-1 rounded-lg bg-card border border-border text-xs font-mono"
                                                                    >
                                                                        {typeof source === "string" ? source : source.id}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Clarifications */}
                                                    {message.clarifications && message.clarifications.length > 0 && (
                                                        <div className="mt-4">
                                                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                                                Explore Further
                                                            </h4>
                                                            <div className="grid gap-2">
                                                                {message.clarifications.map((q, i) => (
                                                                    <button
                                                                        key={i}
                                                                        onClick={() => handleSendMessage(q)}
                                                                        className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border hover:border-primary hover:bg-primary/5 transition-all text-left text-sm"
                                                                    >
                                                                        {q}
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

                        {/* Loading Indicator */}
                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-start gap-3 mb-6"
                            >
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary/30">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    <span className="text-sm text-muted-foreground">Thinking...</span>
                                </div>
                            </motion.div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="border-t border-border bg-card">
                    <div className="max-w-3xl mx-auto px-4 py-4">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSendMessage();
                            }}
                            className="flex items-center gap-3"
                        >
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Send a message..."
                                className="flex-1 px-4 py-3 rounded-xl border-2 border-border focus:border-primary outline-none bg-background transition-all"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className={cn(
                                    "p-3 rounded-xl transition-all",
                                    input.trim() && !isLoading
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                        : "bg-secondary text-muted-foreground cursor-not-allowed"
                                )}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Send className="h-5 w-5" />
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
