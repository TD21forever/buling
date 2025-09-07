import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "捕灵 - AI灵感捕捉工具",
  description: "基于AI的对话式灵感捕捉与管理工具，帮助你记录、整理和发现创意灵感",
  keywords: ["AI", "灵感", "创意", "笔记", "对话", "语音", "管理"],
  authors: [{ name: "捕灵团队" }],
  creator: "捕灵团队",
  publisher: "捕灵",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "捕灵",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    siteName: "捕灵",
    title: "捕灵 - AI灵感捕捉工具",
    description: "基于AI的对话式灵感捕捉与管理工具",
    images: [
      {
        url: "/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "捕灵应用图标",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "捕灵 - AI灵感捕捉工具",
    description: "基于AI的对话式灵感捕捉与管理工具",
    images: ["/icon-512x512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#8b5cf6",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="application-name" content="捕灵" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="捕灵" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#8b5cf6" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="mask-icon" href="/icon.svg" color="#8b5cf6" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        <meta name="twitter:creator" content="@buling_app" />
        <meta name="twitter:url" content="https://buling.app" />
        <meta property="og:url" content="https://buling.app" />
        <meta property="og:type" content="website" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
