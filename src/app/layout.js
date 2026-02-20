"use client";
import { useState, useEffect } from "react";

import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ChatFAB from "@/components/ChatFAB";
import { ThemeProvider } from "@/components/ThemeProvider";
import { usePathname } from "next/navigation";
import { Providers } from "@/components/Providers";
import ErrorBoundary from "@/components/ErrorBoundary";
import { motion, AnimatePresence } from "framer-motion";

const inter = Inter({ subsets: ["latin"] });

function LayoutContent({ children }) {
  const pathname = usePathname();
  const isChatRoute = pathname?.startsWith("/chat/");
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

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
              <motion.div
                className="aurora-bg"
                animate={{ x: mousePos.x, y: mousePos.y }}
                transition={{ type: "spring", damping: 50, stiffness: 200 }}
              />
              <motion.div
                className="grid-bg"
                animate={{ x: -mousePos.x * 0.5, y: -mousePos.y * 0.5 }}
                transition={{ type: "spring", damping: 60, stiffness: 150 }}
              />
              <Navbar />
              <ChatFAB />
            </>
          )}
          <AnimatePresence mode="wait">
            <motion.main
              key={isChatRoute ? 'chat' : pathname}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.02, y: -10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className={isChatRoute ? "" : "pt-24 pb-12 px-6 relative z-10"}
            >
              {children}
            </motion.main>
          </AnimatePresence>
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
