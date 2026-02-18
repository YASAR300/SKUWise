"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ChatFAB from "@/components/ChatFAB";
import { ThemeProvider } from "@/components/ThemeProvider";
import { usePathname } from "next/navigation";
import { Providers } from "@/components/Providers";
import ErrorBoundary from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

function LayoutContent({ children }) {
  const pathname = usePathname();
  const isChatRoute = pathname?.startsWith("/chat/");
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  return (
    <Providers>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ErrorBoundary>
          {!isAuthRoute && !isChatRoute && (
            <>
              <div className="aurora-bg" />
              <div className="grid-bg" />
              <Navbar />
              <ChatFAB />
            </>
          )}
          <main className={isChatRoute ? "" : "pt-24 pb-12 px-6"}>
            {children}
          </main>
        </ErrorBoundary>
      </ThemeProvider>
    </Providers>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          storageKey="sku-wise-v3"
        >
          <LayoutContent>{children}</LayoutContent>
        </ThemeProvider>
      </body>
    </html>
  );
}
