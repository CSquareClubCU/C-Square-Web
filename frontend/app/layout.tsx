import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "C Square Club | Chandigarh University",
  description: "Official platform for C Square Club events, registrations, and attendance.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { ScrollToTop } from "@/components/ScrollToTop";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/logo-black.png" media="(prefers-color-scheme: light)" />
        <link rel="icon" href="/logo-white.png" media="(prefers-color-scheme: dark)" />
      </head>
      <body className="min-h-full flex flex-col font-sans relative">
        <ScrollToTop />
        <PWAInstallBanner />
        <AuthProvider>
          <Header />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
