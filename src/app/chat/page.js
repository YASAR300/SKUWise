"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

/**
 * Chat Index Page
 * Redirects the user to their most recent chat or creates a new one.
 * This acts as the "Chat Tab" landing page.
 */
export default function ChatIndexPage() {
    const router = useRouter();
    const { status } = useSession();
    const [error, setError] = useState(null);

    const initializeApp = useCallback(async () => {
        try {
            // 1. Try to fetch conversations
            const res = await fetch("/api/conversations");
            if (res.ok) {
                const data = await res.json();
                if (data.conversations && data.conversations.length > 0) {
                    // Redirect to the most recent one
                    router.push(`/chat/${data.conversations[0].id}`);
                    return;
                }
            }

            // 2. No conversations found, create a new one
            const createRes = await fetch("/api/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: "Brand New Strategy",
                    mode: "quick",
                }),
            });

            if (createRes.ok) {
                const createData = await createRes.json();
                router.push(`/chat/${createData.conversation.id}`);
            } else {
                throw new Error("Failed to initialize chat");
            }
        } catch (err) {
            console.error("Chat Init Error:", err);
            setError(err.message);
        }
    }, [router]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }

        if (status === "authenticated") {
            initializeApp();
        }
    }, [status, router, initializeApp]);

    if (error) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center gap-4">
                <p className="text-rose-500 font-bold uppercase tracking-widest text-xs">Initialization_Failed</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 border border-border rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-secondary transition-all"
                >
                    Retry_Link
                </button>
            </div>
        );
    }

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 animate-pulse">
                Accessing_Secure_Chat_Node...
            </p>
        </div>
    );
}
