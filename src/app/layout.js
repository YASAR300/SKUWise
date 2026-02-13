"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

function LayoutContent({ children }) {
  const pathname = usePathname();
  const isChatRoute = pathname?.startsWith("/chat/");

  return (
    <div className="relative min-h-screen">
      {!isChatRoute && (
        <>
          <div className="aurora-bg" />
          <div className="grid-bg" />
          <Navbar />
        </>
      )}
      <main className={isChatRoute ? "" : "pt-24 pb-12 px-6"}>
        {children}
      </main>
    </div>
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
