import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import { AuthProvider } from "@/components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "随手HK - 香港生活助手",
  description: "香港天气、港铁到站、实时汇率、上班打卡、杂费AI识别、相册管理 — 一站式香港生活工具",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "随手HK",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-HK" suppressHydrationWarning className={'  h-full antialiased'}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 safe-area-inset">
        {/* Animated background orbs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute top-1/3 -right-32 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
          <div className="absolute -bottom-32 left-1/4 w-72 h-72 bg-emerald-200/15 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '3s' }} />
          <div className="absolute top-2/3 left-1/2 w-64 h-64 bg-amber-200/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <AuthProvider>
          <div className="relative z-10 flex flex-col min-h-full">
            <Navbar />
            <main className="flex-1 pb-safe">
              {children}
            </main>
            <MobileNav />
            <footer className="hidden md:block bg-white/80 backdrop-blur-lg border-t border-gray-200 py-6">
              <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
                <p>随手HK &copy; {new Date().getFullYear()} &mdash; 香港生活一站式工具</p>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
