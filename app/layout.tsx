import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "무서핑 - 존재들의 세계",
  description: "당신만의 무서운 존재를 만들고 AI 괴담을 확인해보세요",
  keywords: "무서핑, 존재, 괴담, 무서운 이야기, 창작",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
