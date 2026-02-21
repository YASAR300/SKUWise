"use client";
import { useChat } from "@/components/ChatProvider";
import VoiceOverlay from "@/components/VoiceOverlay";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Search,
    MessageSquare,
    Trash2,
    FileText,
    Menu,
    Settings,
    Moon,
    Sun,
    Paperclip,
    Mic,
    MicOff,
    Send,
    Loader2,
    X,
    FolderOpen,
    Sparkles,
    Image as ImageIcon,
    FileCode,
    Home,
    VolumeX
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useRef, Suspense } from "react";
import SourceManager from "@/components/SourceManager";
import SourcePreviewModal from "@/components/SourcePreviewModal";

function ChatLayoutInner({ children }) {
    const { theme, setTheme } = useTheme();
    const {
        conversation,
        conversations,
        conversationId,
        searchQuery, setSearchQuery,
        showSidebar, setShowSidebar,
        handleNewChat,
        handleDeleteConversation,
        showSettings, setShowSettings,
        showSourcePanel, setShowSourcePanel,
        selectedSource, setSelectedSource,
        isSourceModalOpen, setIsSourceModalOpen,
        handleSourceClick,
        messages,
        input, setInput,
        isLoading,
        attachments,
        fileInputRef,
        handleFileChange,
        removeAttachment,
        toggleRecording,
        confirmVoiceInput,
        cancelVoice,
        isRecording,
        liveTranscript,
        voiceMode,
        handleSendMessage,
        isSpeaking,
        handleSpeak,
        stopSpeaking
    } = useChat();

    const menuRef = useRef(null);

    const filteredConversations = conversations.filter((conv) =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const allSessionSources = Array.from(
        new Map(messages.flatMap(m => m.sources || []).map(s => [s.id, s])).values()
    );

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            <VoiceOverlay
                isRecording={isRecording}
                transcript={liveTranscript}
                voiceMode={voiceMode}
                onStop={cancelVoice}
                onConfirm={voiceMode === 'reviewing' ? confirmVoiceInput : toggleRecording}
            />
            {/* Persistent Sidebar */}
            {showSidebar && (
                <div className="w-[280px] border-r border-border bg-card flex flex-col shrink-0 overflow-hidden">
                    <div className="p-4 border-b border-border space-y-2">
                        <button
                            onClick={handleNewChat}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-medium shadow-lg shadow-primary/20"
                        >
                            <Plus className="h-5 w-5" />
                            New Chat
                        </button>
                        <Link
                            href="/reports"
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition-all font-medium border border-border/50"
                        >
                            <FileText className="h-5 w-5 text-primary" />
                            Business Reports
                        </Link>
                    </div>

                    <div className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search history..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background outline-none focus:border-primary transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-2 pb-4">
                        {filteredConversations.map((conv) => (
                            <Link
                                key={conv.id}
                                href={`/chat/${conv.id}`}
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
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDeleteConversation(conv.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-all"
                                >
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </button>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative h-full">
                {/* Fixed Top Bar */}
                <div className="h-16 border-b border-border bg-card/80 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30 shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="p-2 hover:bg-secondary rounded-lg transition-all text-muted-foreground hover:text-primary"
                            title="Toggle Sidebar"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <Link
                            href="/"
                            className="p-2 hover:bg-secondary rounded-lg transition-all text-muted-foreground hover:text-primary"
                            title="Go Home"
                        >
                            <Home className="h-5 w-5" />
                        </Link>
                        <div className="h-4 w-[1px] bg-border mx-1" />
                        <div className="flex flex-col">
                            <h1 className="text-sm font-bold tracking-tight truncate max-w-[200px]">
                                {conversation?.title || "Neural Analysis"}
                            </h1>
                            <div className="flex items-center gap-1.5">
                                <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                    Active_Node_01
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <AnimatePresence>
                            {isSpeaking && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={stopSpeaking}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-all text-[10px] font-bold uppercase tracking-wider"
                                    title="Stop Speech"
                                >
                                    <VolumeX className="h-3.5 w-3.5" />
                                    Stop Audio
                                </motion.button>
                            )}
                        </AnimatePresence>

                        <button
                            onClick={() => setShowSourcePanel(!showSourcePanel)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-wider",
                                showSourcePanel ? "bg-primary text-primary-foreground border-primary shadow-lg" : "bg-secondary text-muted-foreground border-border hover:border-primary/50"
                            )}
                        >
                            <FolderOpen className="h-3.5 w-3.5" />
                            Source Matrix
                        </button>
                        <button
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="p-2 hover:bg-secondary rounded-lg transition-all"
                            title="Toggle Theme"
                        >
                            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="p-2 hover:bg-secondary rounded-lg transition-all"
                            title="Settings"
                        >
                            <Settings className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Variable Content Area (Messages) */}
                <div className="flex-1 overflow-hidden relative">
                    {children}
                </div>

                {/* Fixed Input Area */}
                <div className="border-t border-border bg-card/80 backdrop-blur-md z-30 shrink-0">
                    <div className="max-w-3xl mx-auto px-4 py-4">
                        {attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {attachments.map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary border border-border text-xs font-medium">
                                        {file.type.startsWith('image/') ? <ImageIcon className="h-3 w-3" /> : <FileCode className="h-3 w-3" />}
                                        <span className="truncate max-w-[100px]">{file.name}</span>
                                        <button onClick={() => removeAttachment(idx)} className="hover:text-destructive">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSendMessage();
                            }}
                            className="flex items-center gap-3"
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                multiple
                                accept="image/*,.pdf,.xlsx,.xls,.csv"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-4 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground transition-all border border-border"
                                title="Attach Files"
                            >
                                <Paperclip className="h-5 w-5" />
                            </button>

                            <div className="flex-1 relative group">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Enter strategic query..."
                                    className="w-full px-5 py-4 rounded-2xl border-2 border-border focus:border-primary outline-none bg-background transition-all shadow-sm group-hover:border-border/80 pr-12 font-medium text-sm"
                                    disabled={isLoading}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={toggleRecording}
                                className={cn(
                                    "p-4 rounded-2xl transition-all border",
                                    isRecording ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-secondary text-foreground hover:bg-secondary/80 border-border"
                                )}
                            >
                                {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                            </button>

                            {/* Permanent Volume / Stop button */}
                            <button
                                type="button"
                                onClick={stopSpeaking}
                                className={cn(
                                    "p-4 rounded-2xl transition-all border",
                                    isSpeaking
                                        ? "bg-destructive/10 text-destructive border-destructive/30 animate-pulse hover:bg-destructive/20"
                                        : "bg-secondary text-muted-foreground border-border hover:bg-secondary/80"
                                )}
                                title={isSpeaking ? "Stop Speaking" : "Stop Audio"}
                            >
                                <VolumeX className="h-5 w-5" />
                            </button>
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className={cn(
                                    "p-4 rounded-2xl transition-all",
                                    input.trim() && !isLoading ? "bg-primary text-primary-foreground hover:scale-105" : "bg-secondary text-muted-foreground cursor-not-allowed"
                                )}
                            >
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Side Overlays */}
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
                            className="absolute right-0 top-0 bottom-0 w-full max-w-[320px] bg-card border-l border-border z-50 overflow-hidden"
                        >
                            <SourceManager
                                sources={allSessionSources}
                                onSourceClick={handleSourceClick}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Source Preview Modal (Persistent) */}
            <SourcePreviewModal
                isOpen={isSourceModalOpen}
                onClose={() => setIsSourceModalOpen(false)}
                source={selectedSource}
            />
        </div>
    );
}

export default function RootChatLayout({ children }) {
    return (
        <Suspense fallback={
            <div className="h-screen w-full flex items-center justify-center">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-20 animate-pulse">
                    Initializing_Cognitive_Core...
                </div>
            </div>
        }>
            <ChatLayoutInner>{children}</ChatLayoutInner>
        </Suspense>
    );
}
