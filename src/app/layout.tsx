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
  title: "云相册 - 你的云端记忆",
  description: "一个支持图片和视频上传、标签管理和智能搜索的云相册应用",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "云相册",
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
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        {/* Prevent auto-zoom on iOS inputs */}
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
              <p>云相册 &copy; {new Date().getFullYear()} &mdash; 安全存储你的每一刻</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
