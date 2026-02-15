"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send,
    Loader2,
    Sparkles,
    Home,
    Moon,
    Sun,
    Settings,
    Plus,
    Search,
    X,
    Menu,
    MessageSquare,
    Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { useTheme } from "next-themes";
import ChatResponse from "@/components/ChatResponse";

export default function ChatPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const messagesEndRef = useRef(null);
    const { theme, setTheme } = useTheme();

    const conversationId = params.id;
    const initialQuery = searchParams.get("query");

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [conversation, setConversation] = useState(null);
    const [showSidebar, setShowSidebar] = useState(true);
    const [conversations, setConversations] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showSettings, setShowSettings] = useState(false);
    const hasInitialQuerySent = useRef(false);

    // Load conversation on mount
    useEffect(() => {
        loadConversation();
        loadConversations();
    }, [conversationId]);

    // Handle initial query (only once)
    useEffect(() => {
        if (initialQuery && !hasInitialQuerySent.current && messages.length === 0) {
            hasInitialQuerySent.current = true;
            handleSendMessage(initialQuery);
        }
    }, [initialQuery, messages.length]);

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

    async function loadConversations() {
        try {
            const res = await fetch("/api/conversations");
            if (res.ok) {
                const data = await res.json();
                setConversations(data.conversations || []);
            }
        } catch (error) {
            console.error("Failed to load conversations:", error);
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

    async function handleNewChat() {
        try {
            const res = await fetch("/api/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: "New Conversation",
                    mode: "quick",
                }),
            });

            const data = await res.json();

            if (res.ok) {
                router.push(`/chat/${data.conversation.id}`);
            }
        } catch (error) {
            console.error("Failed to create conversation:", error);
        }
    }

    async function handleDeleteConversation(id) {
        try {
            const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
            if (res.ok) {
                // Refresh the list
                await loadConversations();

                // Only redirect if we deleted the current active conversation
                if (id === conversationId) {
                    router.push("/");
                    router.refresh();
                }
            } else {
                const error = await res.json();
                console.error("Delete failed:", error);
                alert("Failed to delete conversation.");
            }
        } catch (error) {
            console.error("Failed to delete conversation:", error);
            alert("Error deleting conversation.");
        }
    }

    const filteredConversations = conversations.filter((conv) =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            {/* Sidebar */}
            <AnimatePresence>
                {showSidebar && (
                    <motion.div
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ type: "spring", damping: 20 }}
                        className="w-[280px] border-r border-border bg-card flex flex-col"
                    >
                        {/* Sidebar Header */}
                        <div className="p-4 border-b border-border">
                            <button
                                onClick={handleNewChat}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-medium"
                            >
                                <Plus className="h-5 w-5" />
                                New Chat
                            </button>
                        </div>

                        {/* Search */}
                        <div className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search conversations..."
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background outline-none focus:border-primary transition-all text-sm"
                                />
                            </div>
                        </div>

                        {/* Conversations List */}
                        <div className="flex-1 overflow-y-auto px-2">
                            {filteredConversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => router.push(`/chat/${conv.id}`)}
                                    className={cn(
                                        "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg mb-1 transition-all text-left group",
                                        conv.id === conversationId
                                            ? "bg-primary/10 text-primary"
                                            : "hover:bg-secondary text-foreground"
                                    )}
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <MessageSquare className="h-4 w-4 flex-shrink-0" />
                                        <span className="text-sm truncate">{conv.title}</span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteConversation(conv.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-all"
                                    >
                                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                    </button>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Top Bar */}
                <div className="h-16 border-b border-border bg-card px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="p-2 hover:bg-secondary rounded-lg transition-all"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => router.push("/")}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-secondary rounded-lg transition-all text-sm font-medium"
                        >
                            <Home className="h-4 w-4" />
                            Home
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Theme Toggle */}
                        <button
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="p-2 hover:bg-secondary rounded-lg transition-all"
                            title="Toggle theme"
                        >
                            {theme === "dark" ? (
                                <Sun className="h-5 w-5" />
                            ) : (
                                <Moon className="h-5 w-5" />
                            )}
                        </button>

                        {/* Settings */}
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="p-2 hover:bg-secondary rounded-lg transition-all"
                            title="Settings"
                        >
                            <Settings className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-3xl mx-auto px-4 py-8">
                        {messages.length === 0 && !isLoading && (
                            <div className="text-center py-12">
                                <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
                                <h2 className="text-2xl font-bold mb-2">Start a conversation</h2>
                                <p className="text-muted-foreground">
                                    Ask me anything about your business, products, or strategy
                                </p>
                            </div>
                        )}

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
                                        <div className="max-w-[80%] px-6 py-4 rounded-2xl bg-primary text-primary-foreground">
                                            <p className="text-sm leading-relaxed">{message.content}</p>
                                        </div>
                                    ) : (
                                        <div className="w-full">
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="p-2 rounded-lg bg-primary/10">
                                                    <Sparkles className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="w-full">
                                                        <ChatResponse content={message.content} />
                                                    </div>

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

            {/* Settings Modal */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                        onClick={() => setShowSettings(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold">Settings</h2>
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="p-2 hover:bg-secondary rounded-lg transition-all"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Theme</span>
                                    <button
                                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                        className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-all text-sm"
                                    >
                                        {theme === "dark" ? "Dark" : "Light"}
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Sidebar</span>
                                    <button
                                        onClick={() => setShowSidebar(!showSidebar)}
                                        className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-all text-sm"
                                    >
                                        {showSidebar ? "Hide" : "Show"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
