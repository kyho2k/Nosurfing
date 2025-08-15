import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { PWAInstaller } from "@/components/layout/PWAInstaller"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NODE_ENV === 'production' ? 'https://nosurfing.vercel.app' : 'http://localhost:3000'),
  title: "무서핑 - 존재들의 세계",
  description: "무서핑은 익명으로 공포 소설과 이미지를 공유하는 커뮤니티입니다. AI를 활용해 쉽게 공포 이야기를 만들고 다른 사용자들과 공유하세요.",
  keywords: "무서핑, 존재, 괴담, 무서운 이야기, 창작, 공포, 커뮤니티, AI",
  authors: [{ name: "무서핑 팀" }],
  creator: "무서핑",
  publisher: "무서핑",
  category: "entertainment",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "무서핑",
    startupImage: [
      {
        url: "/icon-512x512.png",
        media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
      },
    ],
  },
  openGraph: {
    type: "website",
    siteName: "무서핑",
    title: "무서핑 - 공포 커뮤니티",
    description: "익명으로 공포 소설과 이미지를 공유하는 커뮤니티",
    images: [
      {
        url: "/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "무서핑 로고",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "무서핑 - 공포 커뮤니티",
    description: "익명으로 공포 소설과 이미지를 공유하는 커뮤니티",
    images: ["/icon-512x512.png"],
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
}

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preload" href="/sw.js" as="script" />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster />
        <PWAInstaller />
      </body>
    </html>
  )
}
