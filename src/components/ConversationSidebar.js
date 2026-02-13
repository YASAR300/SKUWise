"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    MessageSquare,
    Plus,
    Trash2,
    PanelLeftClose,
    PanelLeft,
    Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ConversationSidebar({
    currentConversationId,
    onSelectConversation,
    onNewConversation,
}) {
    const [conversations, setConversations] = useState([]);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch conversations on mount
    useEffect(() => {
        fetchConversations();
    }, []);

    async function fetchConversations() {
        try {
            const res = await fetch("/api/conversations");
            const data = await res.json();
            setConversations(data.conversations || []);
        } catch (error) {
            console.error("Failed to fetch conversations:", error);
        } finally {
            setLoading(false);
        }
    }

    async function deleteConversation(id) {
        try {
            await fetch(`/api/conversations/${id}`, { method: "DELETE" });
            setConversations((prev) => prev.filter((c) => c.id !== id));
            if (currentConversationId === id) {
                onNewConversation();
            }
        } catch (error) {
            console.error("Failed to delete conversation:", error);
        }
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (hours < 1) return "Just now";
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    }

    const filteredConversations = conversations.filter((conv) =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Collapsed state - icon only
    if (isCollapsed) {
        return (
            <motion.div
                initial={{ width: 64 }}
                animate={{ width: 64 }}
                className="fixed left-0 top-0 h-screen bg-card border-r border-border z-50 flex flex-col items-center py-4 gap-3"
            >
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="p-3 hover:bg-secondary rounded-lg transition-colors"
                    title="Expand sidebar"
                >
                    <PanelLeft className="h-5 w-5 text-muted-foreground" />
                </button>

                <button
                    onClick={onNewConversation}
                    className="p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    title="New chat"
                >
                    <Plus className="h-5 w-5" />
                </button>

                <button
                    className="p-3 hover:bg-secondary rounded-lg transition-colors"
                    title="Search chats"
                >
                    <Search className="h-5 w-5 text-muted-foreground" />
                </button>

                <button
                    className="p-3 hover:bg-secondary rounded-lg transition-colors"
                    title="Recent chats"
                >
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                </button>
            </motion.div>
        );
    }

    // Expanded state
    return (
        <motion.div
            initial={{ width: 280 }}
            animate={{ width: 280 }}
            className="fixed left-0 top-0 h-screen bg-card border-r border-border z-50 flex flex-col"
        >
            {/* Header */}
            <div className="p-3 border-b border-border flex items-center justify-between">
                <button
                    onClick={() => setIsCollapsed(true)}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                    <PanelLeftClose className="h-5 w-5 text-muted-foreground" />
                </button>

                <button
                    onClick={onNewConversation}
                    className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                    <Plus className="h-4 w-4" />
                    New chat
                </button>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-border">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-secondary/30 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto p-2">
                {loading ? (
                    <div className="text-center text-muted-foreground text-sm py-8">
                        Loading...
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">
                        {searchQuery ? "No chats found" : "No conversations yet"}
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredConversations.map((conv) => (
                            <motion.div
                                key={conv.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={cn(
                                    "group relative p-3 rounded-lg transition-all cursor-pointer",
                                    currentConversationId === conv.id
                                        ? "bg-secondary"
                                        : "hover:bg-secondary/50"
                                )}
                                onClick={() => onSelectConversation(conv.id)}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-sm text-foreground truncate">
                                            {conv.title}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {formatDate(conv.updatedAt)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteConversation(conv.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 rounded transition-all"
                                    >
                                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
