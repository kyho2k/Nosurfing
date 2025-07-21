"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Ghost, ArrowLeft, Sparkles, Clock, MapPin, User } from "lucide-react"
import { useRouter } from "next/navigation"

interface Creature {
  id: number
  name: string
  appearanceTime: string
  location: string
  characteristics: string
  type: string
  createdAt: string
  story?: string
}

const typeLabels: Record<string, string> = {
  ghost: "유령/영혼",
  monster: "괴물/크리처",
  demon: "악마/악령",
  "urban-legend": "도시전설",
  "cursed-object": "저주받은 물건",
  supernatural: "초자연적 현상",
  other: "기타",
}

const generateStory = (creature: Creature): string => {
  const stories = [
    `${creature.location}에서 ${creature.appearanceTime}에 목격된 ${creature.name}. 목격자들은 ${creature.characteristics}라고 증언했다. 그 후로 그 장소를 지나는 사람들은 이상한 기운을 느낀다고 한다...`,

    `어느 날 밤, ${creature.appearanceTime}에 ${creature.location}에서 일어난 일이다. ${creature.name}이 나타났을 때, 주변은 갑자기 차가워졌다. ${creature.characteristics} 그 존재를 본 사람들은 며칠간 악몽에 시달렸다고 한다.`,

    `${creature.location}에는 오래된 전설이 있다. ${creature.appearanceTime}마다 ${creature.name}이 나타난다는 것이다. ${creature.characteristics} 지역 주민들은 그 시간에는 절대 그곳에 가지 않는다고 한다.`,

    `최근 ${creature.location}에서 기괴한 목격담이 늘고 있다. ${creature.appearanceTime}에 나타나는 ${creature.name}에 대한 것이다. ${creature.characteristics} 당신이라면... 그 존재와 마주쳤을 때 어떻게 하겠는가?`,
  ]

  return stories[Math.floor(Math.random() * stories.length)]
}

export default function FeedPage() {
  const router = useRouter()
  const [creatures, setCreatures] = useState<Creature[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 로컬 스토리지에서 존재들 불러오기
    const savedCreatures = JSON.parse(localStorage.getItem("creatures") || "[]")
    const creaturesWithStories = savedCreatures.map((creature: Creature) => ({
      ...creature,
      story: generateStory(creature),
    }))
    setCreatures(creaturesWithStories)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Ghost className="w-16 h-16 text-purple-400 mx-auto animate-pulse mb-4" />
          <p className="text-white text-lg">존재들을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="p-6 border-b border-slate-700">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" onClick={() => router.push("/")} className="text-gray-300 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              돌아가기
            </Button>
          </div>
          <div className="flex items-center space-x-3">
            <Ghost className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">존재들의 피드</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          {creatures.length === 0 ? (
            <div className="text-center py-16">
              <Ghost className="w-24 h-24 text-gray-600 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-4">아직 존재가 없습니다</h2>
              <p className="text-gray-400 mb-8">첫 번째 무서운 존재를 만들어보세요!</p>
              <Button onClick={() => router.push("/")} className="bg-purple-600 hover:bg-purple-700">
                존재 만들러 가기
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">발견된 존재들</h2>
                <p className="text-gray-300">AI가 생성한 괴담과 함께 확인해보세요</p>
              </div>

              {creatures.map((creature) => (
                <Card key={creature.id} className="bg-slate-800 border-slate-700 shadow-xl">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl text-white mb-2">{creature.name}</CardTitle>
                        <Badge variant="secondary" className="bg-purple-600 text-white">
                          {typeLabels[creature.type] || creature.type}
                        </Badge>
                      </div>
                      <div className="text-right text-sm text-gray-400">
                        <div className="flex items-center mb-1">
                          <User className="w-3 h-3 mr-1" />
                          익명의 목격자
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(creature.createdAt).toLocaleDateString("ko-KR")}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-purple-400 font-medium mb-1">출몰 시간</h4>
                        <p className="text-gray-300">{creature.appearanceTime}</p>
                      </div>
                      <div>
                        <h4 className="text-purple-400 font-medium mb-1">출몰 장소</h4>
                        <p className="text-gray-300 flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {creature.location}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-purple-400 font-medium mb-2">특징</h4>
                      <p className="text-gray-300 leading-relaxed">{creature.characteristics}</p>
                    </div>

                    {creature.story && (
                      <div className="bg-slate-900 p-4 rounded-lg border border-purple-500/30">
                        <h4 className="text-purple-400 font-medium mb-2 flex items-center">
                          <Sparkles className="w-4 h-4 mr-2" />
                          AI 생성 괴담
                        </h4>
                        <p className="text-gray-300 leading-relaxed italic">{creature.story}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
