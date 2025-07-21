"use client"

import { Ghost, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" className="text-gray-300 hover:text-white mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
        </Link>

        {/* Content */}
        <div className="text-center space-y-8">
          <Ghost className="w-24 h-24 text-purple-400 mx-auto" />

          <h1 className="text-4xl font-bold text-white">존재들에 대하여</h1>

          <div className="text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto space-y-4">
            <p>
              이 세상에는 우리가 알지 못하는 다양한 <span className="text-purple-400">존재</span>들이 살고 있습니다.
            </p>
            <p>그들은 때로는 우리의 페이지를 가져가기도 하고, 때로는 우리를 도와주기도 합니다.</p>
            <p>무서핑은 그런 신비로운 존재들과 함께하는 공간입니다.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
