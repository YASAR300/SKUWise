"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { fetchWithRetry } from "@/lib/api-utils";

const ChatContext = createContext();

export function ChatProvider({ children }) {
    const { status } = useSession();
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();

    const conversationId = params?.id;
    const initialQuery = searchParams?.get("query");

    // Shared State
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [conversation, setConversation] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showSidebar, setShowSidebar] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [showSourcePanel, setShowSourcePanel] = useState(false);
    const [selectedSource, setSelectedSource] = useState(null);
    const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

    // Voice & File State
    const [isRecording, setIsRecording] = useState(false);
    const [voiceMode, setVoiceMode] = useState("idle"); // idle, listening, processing
    const [liveTranscript, setLiveTranscript] = useState("");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [attachments, setAttachments] = useState([]);

    const hasInitialQuerySent = useRef(false);
    const isRecordingRef = useRef(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // MediaRecorder-based voice recording (replaces Web Speech API which has network errors)
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // Handlers and Data Loaders defined first to avoid TDZ errors in Effects
    const handleSpeak = useCallback((text) => {
        if (typeof window === "undefined" || !window.speechSynthesis) return;
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }
        // Basic cleanup for speech (remove markdown)
        const cleanText = text.replace(/[*#`_]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    }, [isSpeaking]);

    const loadConversation = useCallback(async () => {
        if (!conversationId) return;
        setIsHistoryLoading(true);
        try {
            const res = await fetchWithRetry(`/api/conversations/${conversationId}`);
            if (res.ok) {
                const data = await res.json();
                setConversation(data.conversation);
                // Important: setMessages must happen before setIsHistoryLoading(false)
                setMessages(data.conversation.messages || []);
            }
        } catch (error) {
            console.error("Failed to load conversation:", error);
        } finally {
            setIsHistoryLoading(false);
        }
    }, [conversationId]);

    const loadConversations = useCallback(async () => {
        try {
            const res = await fetchWithRetry("/api/conversations");
            if (res.ok) {
                const data = await res.json();
                setConversations(data.conversations || []);
            }
        } catch (error) {
            console.error("Failed to load conversations:", error);
        }
    }, []);

    const handleSendMessage = useCallback(async (text = input, existingAttachments = []) => {
        if (!text.trim() || isSending || !conversationId) return;

        const userMessage = {
            id: Date.now(),
            role: "user",
            content: text,
            createdAt: new Date().toISOString(),
        };

        const filePromises = attachments.map(file => new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve({
                inlineData: { data: reader.result.split(',')[1], mimeType: file.type }
            });
            reader.readAsDataURL(file);
        }));

        const uploadedFileData = await Promise.all(filePromises);
        const fileData = [...uploadedFileData, ...existingAttachments.map(batch => ({
            inlineData: { data: batch.data, mimeType: batch.mimeType }
        }))];

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setAttachments([]);
        setIsSending(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: text,
                    mode: "quick",
                    conversationId,
                    attachments: fileData
                }),
            });

            const data = await res.json();
            if (res.ok) {
                const assistantMsg = {
                    id: Date.now() + 1,
                    role: "assistant",
                    content: data.answer,
                    sources: data.sources || [],
                    clarifications: data.clarifications || [],
                    createdAt: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, assistantMsg]);

                // AI Voice Feedback
                handleSpeak(data.answer);
            }
        } catch (error) {
            console.error("Chat error:", error);
        } finally {
            setIsSending(false);
        }
    }, [input, isSending, conversationId, attachments, handleSpeak]);

    // Effects
    useEffect(() => {
        if (status === "authenticated") {
            loadConversations();
        }
    }, [status, loadConversations]);

    // Re-load when ID changes
    useEffect(() => {
        if (status === "authenticated" && conversationId) {
            loadConversation();
        } else if (!conversationId) {
            setMessages([]);
            setConversation(null);
        }
    }, [conversationId, status, loadConversation]);

    // Handle initial query
    useEffect(() => {
        // We only send if we have a query, haven't sent it yet, and have an ID
        if (initialQuery && !hasInitialQuerySent.current && conversationId) {
            // Wait for history to finish loading so we don't double-send or overwrite
            if (isHistoryLoading) return;

            // If messages are empty, it's a new chat, proceed
            if (messages.length === 0) {
                hasInitialQuerySent.current = true;

                // Remove query from URL immediately to prevent reload triggers
                const params = new URLSearchParams(searchParams.toString());
                params.delete('query');
                router.replace(`/chat/${conversationId}${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });

                let pendingAttachments = [];
                try {
                    const stored = sessionStorage.getItem('pending_attachments');
                    if (stored) {
                        pendingAttachments = JSON.parse(stored);
                        sessionStorage.removeItem('pending_attachments');
                    }
                } catch (e) {
                    console.error("Pending attachments parse error:", e);
                }
                handleSendMessage(initialQuery, pendingAttachments);
            }
        }
    }, [initialQuery, messages.length, conversationId, isHistoryLoading, router, searchParams, handleSendMessage]);

    async function handleNewChat() {
        try {
            const res = await fetch("/api/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: "Strategic Analysis", mode: "quick" }),
            });
            if (res.ok) {
                const data = await res.json();
                await loadConversations();
                router.push(`/chat/${data.conversation.id}`);
                return data.conversation.id;
            }
        } catch (err) {
            console.error("New chat failed:", err);
        }
    }

    async function handleDeleteConversation(id) {
        if (isDeleting) return;
        if (!confirm("Delete this session?")) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
            if (res.ok) {
                await loadConversations();
                if (id === conversationId) router.push("/chat");
            }
        } catch (err) {
            console.error("Delete failed:", err);
        } finally {
            setIsDeleting(false);
        }
    }


    const stopSpeaking = () => {
        if (typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    };

    const parseVoiceCommand = (text) => {
        const lowerText = text.toLowerCase().trim();

        if (lowerText.includes("new chat") || lowerText.includes("create chat")) {
            handleNewChat();
            return true;
        }
        if (lowerText.includes("show inventory") || lowerText.includes("open catalog") || lowerText.includes("check stock")) {
            router.push("/catalog");
            return true;
        }
        if (lowerText.includes("show reports") || lowerText.includes("open analysis")) {
            router.push("/reports");
            return true;
        }
        if (lowerText.includes("go home") || lowerText.includes("open dashboard")) {
            router.push("/");
            return true;
        }

        return false;
    };

    const confirmVoiceInput = async () => {
        if (!liveTranscript) return;
        const handled = parseVoiceCommand(liveTranscript);
        if (!handled) {
            await handleSendMessage(liveTranscript);
        }
        setVoiceMode("idle");
        setIsRecording(false);
        isRecordingRef.current = false;
        setLiveTranscript("");
    };

    const cancelVoice = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setVoiceMode("idle");
        setIsRecording(false);
        isRecordingRef.current = false;
        setLiveTranscript("");
    };

    const toggleRecording = async () => {
        if (isRecordingRef.current) {
            // STOP RECORDING
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            // Do NOT hide overlay yet, wait for transcription review
            setVoiceMode("processing");
            isRecordingRef.current = false;
        } else {
            // START RECORDING
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new MediaRecorder(stream);
                mediaRecorderRef.current = recorder;
                audioChunksRef.current = [];
                setLiveTranscript("");

                recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) audioChunksRef.current.push(e.data);
                };

                recorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

                    // Cleanup stream
                    stream.getTracks().forEach(track => track.stop());

                    // Send to our Gemini Transcribe API
                    setVoiceMode("processing");
                    try {
                        const formData = new FormData();
                        formData.append("audio", audioBlob);

                        const res = await fetch("/api/transcribe", {
                            method: "POST",
                            body: formData,
                        });

                        const data = await res.json();
                        if (data.transcript) {
                            setLiveTranscript(data.transcript);
                            setVoiceMode("reviewing");
                        } else {
                            // If empty transcript, just close
                            setVoiceMode("idle");
                            setIsRecording(false);
                        }
                    } catch (err) {
                        console.error("Transcription failed:", err);
                        setVoiceMode("idle");
                        setIsRecording(false);
                    }
                };

                recorder.start();
                setIsRecording(true);
                isRecordingRef.current = true;
                setVoiceMode("listening");
            } catch (err) {
                console.error("Microphone access denied:", err);
                alert("Please allow microphone access to use voice features.");
                setIsRecording(false);
                isRecordingRef.current = false;
                setVoiceMode("idle");
            }
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setAttachments(prev => [...prev, ...files]);
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSourceClick = (sourceId) => {
        const allSources = messages.flatMap(m => m.sources || []);
        const source = allSources.find(s => s.id === sourceId);
        if (source) {
            setSelectedSource(source);
            setIsSourceModalOpen(true);
        }
    };

    const value = {
        messages, setMessages,
        input, setInput,
        isDeleting, setIsDeleting,
        conversation, setConversation,
        conversations, setConversations,
        searchQuery, setSearchQuery,
        showSidebar, setShowSidebar,
        showSettings, setShowSettings,
        showSourcePanel, setShowSourcePanel,
        selectedSource, setSelectedSource,
        isSourceModalOpen, setIsSourceModalOpen,
        isRecording, setIsRecording,
        voiceMode, setVoiceMode,
        liveTranscript, setLiveTranscript,
        isSpeaking, setIsSpeaking,
        attachments, setAttachments,
        conversationId,
        loadConversation,
        loadConversations,
        isHistoryLoading,
        isSending,
        isLoading: isHistoryLoading || isSending,
        handleSendMessage,
        handleNewChat,
        handleDeleteConversation,
        handleSpeak,
        stopSpeaking,
        toggleRecording,
        confirmVoiceInput,
        cancelVoice,
        handleFileChange,
        removeAttachment,
        handleSourceClick,
        messagesEndRef,
        fileInputRef,
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
}

export const useChat = () => useContext(ChatContext);
