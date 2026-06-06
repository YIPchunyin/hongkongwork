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
    <html lang="zh-HK" className={'  h-full antialiased'}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 safe-area-inset">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 pb-safe">
            {children}
          </main>
          <MobileNav />
          <footer className="hidden md:block bg-white border-t border-gray-200 py-6">
            <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
              <p>随手HK &copy; {new Date().getFullYear()} &mdash; 香港生活一站式工具</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
