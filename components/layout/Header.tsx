"use client"

import { Button } from "@/components/ui/button"
import { Ghost, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { AchievementsBadge } from "@/components/profile/AchievementsBadge"

export function Header() {
  const router = useRouter()

  return (
    <header className="p-6 border-b border-slate-700">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Ghost className="w-8 h-8 text-purple-400" />
          <h1 className="text-3xl font-bold text-white">무서핑</h1>
          <span className="text-gray-400 text-sm">- 존재들의 세계</span>
        </div>
        <div className="flex items-center space-x-3">
          <AchievementsBadge compact />
          <Button
            variant="outline"
            onClick={() => router.push("/feed")}
            className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"
          >
            <Users className="w-4 h-4 mr-2" />
            피드 보기
          </Button>
        </div>
      </div>
    </header>
  )
}