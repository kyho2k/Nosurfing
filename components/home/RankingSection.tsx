"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Heart, MapPin, Clock, User } from "lucide-react"
import { useRouter } from "next/navigation"

interface RankedCreature {
  id: number
  name: string
  description: string
  story?: string
  image_url?: string
  appearance_time: string
  location: string
  creature_type: string
  like_count: number
  created_at: string
  author_session_id: string
  rank: number
  rankBadge: string
}

interface RankingData {
  period: string
  startDate: string
  creatures: RankedCreature[]
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

const periodLabels: Record<string, string> = {
  daily: "일간",
  weekly: "주간", 
  monthly: "월간"
}

export function RankingSection() {
  const router = useRouter()
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'weekly' | 'daily'>('monthly')
  const [rankingData, setRankingData] = useState<RankingData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/rankings?period=${selectedPeriod}&limit=5`)
        if (!response.ok) {
          throw new Error(`Failed to fetch rankings: ${response.statusText}`)
        }
        const data = await response.json()
        setRankingData(data)
      } catch (error: any) {
        console.error('Rankings fetch error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRankings()
  }, [selectedPeriod])

  const formatDate = (dateString: string) => {
    // 클라이언트에서만 실행되도록 보장
    if (typeof window === 'undefined') {
      return dateString;  // 서버에서는 원본 문자열 반환
    }
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getRankCardStyle = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-br from-yellow-900/40 to-amber-900/40 border-yellow-500/30"
    if (rank === 2) return "bg-gradient-to-br from-gray-700/40 to-slate-600/40 border-gray-400/30"
    if (rank === 3) return "bg-gradient-to-br from-amber-900/40 to-orange-900/40 border-orange-500/30"
    return "bg-slate-800 border-slate-700"
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-12">
      <div className="text-center mb-8">
        <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-white">명예의 전당</h2>
        <p className="text-gray-400">가장 많은 사랑을 받은 존재들을 확인하세요.</p>
      </div>

      <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as any)} className="mb-8">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="daily">일간</TabsTrigger>
          <TabsTrigger value="weekly">주간</TabsTrigger>
          <TabsTrigger value="monthly">월간</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="text-center text-white">랭킹을 불러오는 중...</div>
      ) : rankingData && rankingData.creatures.length > 0 ? (
        <div className="space-y-4">
          {rankingData.creatures.map((creature) => (
            <Card key={creature.id} className={getRankCardStyle(creature.rank)} onClick={() => router.push(`/creatures/${creature.id}`)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex flex-col items-center">
                      <div className="text-3xl mb-1">{creature.rankBadge}</div>
                      <div className="text-xs text-gray-400">#{creature.rank}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <CardTitle className="text-xl text-white">{creature.name}</CardTitle>
                        <Badge variant="secondary" className="bg-purple-600 text-white text-xs">
                          {typeLabels[creature.creature_type] || creature.creature_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 text-red-400 mb-1">
                      <Heart className="w-4 h-4 fill-current" />
                      <span className="text-xl font-bold">{creature.like_count}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">아직 랭킹 데이터가 없습니다</h3>
          <p className="text-gray-400 mb-4">
            첫 번째로 공포 이야기를 만들어 명예의 전당에 이름을 올려보세요!
          </p>
          <p className="text-sm text-gray-500">
            💡 다른 사용자들이 여러분의 이야기에 좋아요를 누르면 랭킹에 나타납니다
          </p>
        </div>
      )}
    </div>
  )
}
