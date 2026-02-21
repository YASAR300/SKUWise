"use client";

import { Suspense } from "react";
import { SessionProvider } from "next-auth/react";
import { ChatProvider } from "./ChatProvider";

export function Providers({ children }) {
    return (
        <SessionProvider>
            <Suspense fallback={null}>
                <ChatProvider>
                    {children}
                </ChatProvider>
            </Suspense>
        </SessionProvider>
    );
}
