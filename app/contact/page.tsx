"use client"

import { Ghost, ArrowLeft, Mail, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export default function ContactPage() {
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
          <Ghost className="w-24 h-24 text-purple-400 mx-auto animate-pulse" />

          <h1 className="text-4xl font-bold text-white">존재들과 소통하기</h1>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6 text-center">
                <Mail className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">이메일</h3>
                <p className="text-gray-300">존재들에게 편지를 보내보세요</p>
                <p className="text-purple-400 mt-2">contact@무서핑.com</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6 text-center">
                <MessageCircle className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">메시지</h3>
                <p className="text-gray-300">존재들과 직접 대화해보세요</p>
                <Button className="mt-4 bg-purple-600 hover:bg-purple-700">대화 시작하기</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
