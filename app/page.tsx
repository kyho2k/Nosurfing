"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Ghost, Eye, Users, TrendingUp, Gamepad2, Trophy } from "lucide-react"
import { useRouter } from "next/navigation"
import { CreateCreatureForm } from "@/components/home/CreateCreatureForm"
import { HeaderBannerAd, SidebarAd, MobileAnchorAd } from "@/components/ads/AdComponents"

export default function HomePage() {
  const router = useRouter()
  const [showCreateForm, setShowCreateForm] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="p-6 border-b border-slate-700">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Ghost className="w-10 h-10 text-purple-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">무서핑</h1>
                <p className="text-purple-300 text-sm">익명 공포 커뮤니티</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push("/feed")}
                className="text-gray-300 hover:text-white"
              >
                <Eye className="w-4 h-4 mr-2" />
                피드 보기
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => router.push("/game")}
                className="text-gray-300 hover:text-white"
              >
                <Gamepad2 className="w-4 h-4 mr-2" />
                미니게임
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => router.push("/rankings")}
                className="text-gray-300 hover:text-white"
              >
                <Trophy className="w-4 h-4 mr-2" />
                랭킹
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => router.push("/about")}
                className="text-gray-300 hover:text-white"
              >
                소개
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Header Banner Ad */}
      <div className="px-6">
        <HeaderBannerAd />
      </div>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
          {!showCreateForm ? (
            <>
              {/* Hero Section */}
              <div className="text-center py-16">
                <div className="mb-8">
                  <Ghost className="w-24 h-24 text-purple-400 mx-auto mb-6 animate-pulse" />
                  <h2 className="text-5xl font-bold text-white mb-4">
                    당신의 공포를<br />세상에 알려주세요
                  </h2>
                  <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                    익명으로 무서운 이야기를 만들고 공유하세요.<br />
                    AI가 당신의 상상을 더욱 생생한 공포로 만들어드립니다.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                  <Button 
                    size="lg"
                    onClick={() => setShowCreateForm(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg font-medium transition-all duration-300 transform hover:scale-105"
                  >
                    <Ghost className="w-6 h-6 mr-3" />
                    새로운 존재 만들기
                  </Button>
                  <Button 
                    size="lg"
                    variant="outline"
                    onClick={() => router.push("/feed")}
                    className="border-purple-400 text-purple-300 hover:bg-purple-600 hover:text-white px-8 py-4 text-lg font-medium transition-all duration-300 transform hover:scale-105"
                  >
                    <Eye className="w-6 h-6 mr-3" />
                    존재들 둘러보기
                  </Button>
                  <Button 
                    size="lg"
                    variant="outline"
                    onClick={() => router.push("/game")}
                    className="border-green-400 text-green-300 hover:bg-green-600 hover:text-white px-8 py-4 text-lg font-medium transition-all duration-300 transform hover:scale-105"
                  >
                    <Gamepad2 className="w-6 h-6 mr-3" />
                    팝핑 귀신방울
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
                  <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                    <Users className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                    <div className="text-xl font-bold text-white mb-1">완전 익명</div>
                    <p className="text-gray-400 text-sm">개인정보 수집 없음</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                    <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                    <div className="text-xl font-bold text-white mb-1">AI 생성</div>
                    <p className="text-gray-400 text-sm">자동 이미지 & 스토리</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                    <Ghost className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                    <div className="text-xl font-bold text-white mb-1">공포 특화</div>
                    <p className="text-gray-400 text-sm">괴담 & 호러 전용</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                    <Gamepad2 className="w-8 h-8 text-green-400 mx-auto mb-3" />
                    <div className="text-xl font-bold text-white mb-1">미니게임</div>
                    <p className="text-gray-400 text-sm">팝핑 귀신방울</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Create Form Section */
            <div className="max-w-2xl mx-auto py-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-white">새로운 존재 만들기</h2>
                <Button 
                  variant="ghost"
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ← 돌아가기
                </Button>
              </div>
              <CreateCreatureForm />
            </div>
          )}
          </div>
          
          {/* Sidebar - Desktop Only */}
          <div className="hidden lg:block">
            <div className="sticky top-8 space-y-6">
              <SidebarAd />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 p-6 mt-16">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400">
            무서핑 &copy; 2025. 익명 공포 커뮤니티 - 모든 이야기는 픽션입니다.
          </p>
        </div>
      </footer>

      {/* Mobile Anchor Ad */}
      <MobileAnchorAd />
    </div>
  )
}
