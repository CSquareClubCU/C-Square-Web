import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "C Square Club | Chandigarh University",
  description: "Official platform for C Square Club events, registrations, and attendance.",
};

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
<<<<<<< HEAD
import { ScrollToTop } from "@/components/ScrollToTop";
=======
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f

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
      <body className="min-h-full flex flex-col font-sans relative">
<<<<<<< HEAD
        <ScrollToTop />
=======
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
        <AuthProvider>
          <Header />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
