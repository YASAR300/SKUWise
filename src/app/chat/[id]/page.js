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
    FileText,
    Database,
    Sidebar as SidebarIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { useTheme } from "next-themes";
import ChatResponse from "@/components/ChatResponse";
import SourcePreviewModal from "@/components/SourcePreviewModal";
import SourceManager from "@/components/SourceManager";

import { useSession } from "next-auth/react";

export default function ChatPage() {
    const { status } = useSession();
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
    const [isDeleting, setIsDeleting] = useState(false);
    const [conversation, setConversation] = useState(null);
    const [showSidebar, setShowSidebar] = useState(true);
    const [showSourcePanel, setShowSourcePanel] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showSettings, setShowSettings] = useState(false);
    const hasInitialQuerySent = useRef(false);

    // Source Preview State
    const [selectedSource, setSelectedSource] = useState(null);
    const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

    // Initial Auth Redirect
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status]);

    // Load conversation on mount
    useEffect(() => {
        if (status === "authenticated") {
            loadConversation();
            loadConversations();
        }
    }, [conversationId, status]);

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

    if (status === "loading") {
        return <div className="h-screen w-full flex items-center justify-center font-black uppercase tracking-[0.3em] opacity-20">Retrieving_Neural_History...</div>;
    }

    async function loadConversation() {
        try {
            const res = await fetch(`/api/conversations/${conversationId}`);
            if (res.status === 401) {
                router.push("/login");
                return;
            }
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
            if (res.status === 401) {
                router.push("/login");
                return;
            }
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

            if (res.status === 401) {
                router.push("/login");
                return;
            }

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
        if (isDeleting) return;

        if (!confirm("Are you sure you want to delete this conversation?")) return;

        setIsDeleting(true);
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
        } finally {
            setIsDeleting(false);
        }
    }

    const handleSourceClick = (sourceId) => {
        // Find the source in messages
        const allSources = messages.flatMap(m => m.sources || []);
        const source = allSources.find(s => s.id === sourceId);
        if (source) {
            setSelectedSource(source);
            setIsSourceModalOpen(true);
        }
    };

    const filteredConversations = conversations.filter((conv) =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Collect all unique sources for the Source Manager
    const allSessionSources = Array.from(
        new Map(messages.flatMap(m => m.sources || []).map(s => [s.id, s])).values()
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
                        <div className="p-4 border-b border-border space-y-2">
                            <button
                                onClick={handleNewChat}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-medium shadow-lg shadow-primary/20"
                            >
                                <Plus className="h-5 w-5" />
                                New Chat
                            </button>
                            <button
                                onClick={() => router.push("/reports")}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition-all font-medium border border-border/50"
                            >
                                <FileText className="h-5 w-5 text-primary" />
                                Business Reports
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
                                <div
                                    key={conv.id}
                                    onClick={() => router.push(`/chat/${conv.id}`)}
                                    className={cn(
                                        "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg mb-1 transition-all text-left group cursor-pointer",
                                        conv.id === conversationId
                                            ? "bg-primary/10 text-primary border border-primary/20"
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
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative">
                {/* Top Bar */}
                <div className="h-16 border-b border-border bg-card/80 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30">
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
                        {/* Source Toggle */}
                        <button
                            onClick={() => setShowSourcePanel(!showSourcePanel)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium",
                                showSourcePanel ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-secondary"
                            )}
                            title="Intelligence Sources"
                        >
                            <Database className="h-4 w-4" />
                            <span className="hidden sm:inline">Sources</span>
                            {allSessionSources.length > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                                    {allSessionSources.length}
                                </span>
                            )}
                        </button>

                        <div className="w-px h-6 bg-border mx-2" />

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
                <div className="flex-1 overflow-y-auto bg-background/50">
                    <div className="max-w-3xl mx-auto px-4 py-8">
                        {messages.length === 0 && !isLoading && (
                            <div className="text-center py-20">
                                <Sparkles className="h-16 w-16 mx-auto mb-6 text-primary animate-pulse" />
                                <h2 className="text-3xl font-bold mb-3 tracking-tight">How can I help you excel?</h2>
                                <p className="text-muted-foreground text-lg">
                                    Analyze inventories, optimize margins, or plan your next growth move.
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
                                                <div className="p-2.5 rounded-2xl bg-primary shadow-lg shadow-primary/20">
                                                    <Sparkles className="h-5 w-5 text-primary-foreground" />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <div className="w-full">
                                                        <ChatResponse
                                                            content={message.content}
                                                            sources={message.sources}
                                                            onCitationClick={handleSourceClick}
                                                        />
                                                    </div>

                                                    {message.clarifications && message.clarifications.length > 0 && (
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
                                                                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-card border border-border hover:border-primary hover:bg-primary/5 hover:scale-[1.02] transition-all text-left text-xs font-bold shadow-sm"
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

                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-start gap-4 mb-8"
                            >
                                <div className="p-2.5 rounded-2xl bg-primary/10">
                                    <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                                </div>
                                <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-secondary/30 border border-border/50">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    <span className="text-sm font-bold uppercase tracking-widest text-primary/60">Processing_Neural_Response...</span>
                                </div>
                            </motion.div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="border-t border-border bg-card/80 backdrop-blur-md sticky bottom-0 z-30">
                    <div className="max-w-3xl mx-auto px-4 py-6">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSendMessage();
                            }}
                            className="flex items-center gap-3"
                        >
                            <div className="flex-1 relative group">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Enter strategic query..."
                                    className="w-full px-5 py-4 rounded-2xl border-2 border-border focus:border-primary outline-none bg-background transition-all shadow-sm group-hover:border-border/80 pr-12 font-medium"
                                    disabled={isLoading}
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <div className={cn(
                                        "w-2 h-2 rounded-full transition-all",
                                        input.trim() ? "bg-primary animate-pulse scale-125" : "bg-border"
                                    )} />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className={cn(
                                    "p-4 rounded-2xl transition-all shadow-xl",
                                    input.trim() && !isLoading
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-primary/20"
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
                        <p className="text-[10px] text-center mt-3 text-muted-foreground font-medium uppercase tracking-[0.1em] opacity-60">
                            Proprietary SKUWise Intelligence Layer Active
                        </p>
                    </div>
                </div>

                {/* Source Panel Overlay */}
                <AnimatePresence>
                    {showSourcePanel && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowSourcePanel(false)}
                                className="absolute inset-0 bg-background/40 backdrop-blur-sm z-40"
                            />
                            <motion.div
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="absolute right-0 top-0 bottom-0 w-full max-w-[320px] bg-card border-l border-border z-50 shadow-2xl"
                            >
                                <div className="absolute left-0 top-1/2 -translate-x-full pr-2">
                                    <button
                                        onClick={() => setShowSourcePanel(false)}
                                        className="p-2 bg-card border border-border rounded-l-xl shadow-xl text-muted-foreground hover:text-primary transition-all"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                                <SourceManager
                                    sources={allSessionSources}
                                    onSourceClick={handleSourceClick}
                                />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* Source Preview Modal */}
            <SourcePreviewModal
                isOpen={isSourceModalOpen}
                onClose={() => setIsSourceModalOpen(false)}
                source={selectedSource}
            />

            {/* Settings Modal (remains same) */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110]"
                        onClick={() => setShowSettings(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card border border-border rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold tracking-tight">Configuration</h2>
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="p-2 hover:bg-secondary rounded-xl transition-all"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold uppercase tracking-wider">Interface Theme</span>
                                        <span className="text-[10px] text-muted-foreground font-medium">Toggle neural aesthetic</span>
                                    </div>
                                    <button
                                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                        className="px-6 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:brightness-110 transition-all"
                                    >
                                        {theme === "dark" ? "Dark" : "Light"}
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold uppercase tracking-wider">Navigation Drawer</span>
                                        <span className="text-[10px] text-muted-foreground font-medium">Maximize strategic workspace</span>
                                    </div>
                                    <button
                                        onClick={() => setShowSidebar(!showSidebar)}
                                        className="px-6 py-2 rounded-xl bg-secondary border border-border font-bold text-xs hover:bg-secondary/80 transition-all"
                                    >
                                        {showSidebar ? "Minify" : "Expand"}
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
