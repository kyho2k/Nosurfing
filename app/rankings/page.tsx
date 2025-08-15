"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Trophy, Heart, MapPin, Clock, User, Calendar, TrendingUp, Award } from "lucide-react"
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

interface RankingStats {
  totalCreatures: number
  totalLikes: number
  averageLikes: number
  topScore: number
}

interface RankingData {
  period: string
  startDate: string
  creatures: RankedCreature[]
  stats: RankingStats
  generatedAt: string
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

export default function RankingsPage() {
  const router = useRouter()
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'weekly' | 'daily'>('monthly')
  const [rankingData, setRankingData] = useState<RankingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 랭킹 데이터 가져오기
  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/rankings?period=${selectedPeriod}&limit=20`)
        if (!response.ok) {
          throw new Error(`Failed to fetch rankings: ${response.statusText}`)
        }
        
        const data = await response.json()
        setRankingData(data)
      } catch (error: any) {
        console.error('Rankings fetch error:', error)
        setError(error.message || '랭킹 데이터를 불러올 수 없습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchRankings()
  }, [selectedPeriod])

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // 순위별 카드 스타일
  const getRankCardStyle = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-br from-yellow-900/40 to-amber-900/40 border-yellow-500/30"
    if (rank === 2) return "bg-gradient-to-br from-gray-700/40 to-slate-600/40 border-gray-400/30"
    if (rank === 3) return "bg-gradient-to-br from-amber-900/40 to-orange-900/40 border-orange-500/30"
    return "bg-slate-800 border-slate-700"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto animate-pulse mb-4" />
          <p className="text-white text-lg">랭킹을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="p-6 border-b border-slate-700">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/")}
            className="text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            홈으로
          </Button>
          <div className="flex items-center space-x-3">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <h1 className="text-3xl font-bold text-white">베스트 공포글 랭킹</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          
          {/* Period Selection */}
          <div className="mb-8">
            <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as any)}>
              <TabsList className="bg-slate-800 border-slate-700">
                <TabsTrigger value="daily" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
                  일간 베스트
                </TabsTrigger>
                <TabsTrigger value="weekly" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
                  주간 베스트
                </TabsTrigger>
                <TabsTrigger value="monthly" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
                  월간 베스트
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {error ? (
            <Card className="bg-slate-800 border-slate-700 text-center p-8">
              <p className="text-red-400 mb-4">⚠️ {error}</p>
              <Button onClick={() => window.location.reload()}>다시 시도</Button>
            </Card>
          ) : (
            <>
              {/* Stats Overview */}
              {rankingData && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4 text-center">
                      <Award className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{rankingData.stats.topScore}</div>
                      <p className="text-gray-400 text-sm">최고 좋아요</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{rankingData.stats.totalCreatures}</div>
                      <p className="text-gray-400 text-sm">{periodLabels[selectedPeriod]} 게시물</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4 text-center">
                      <Heart className="w-6 h-6 text-red-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{rankingData.stats.totalLikes}</div>
                      <p className="text-gray-400 text-sm">총 좋아요 수</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4 text-center">
                      <Calendar className="w-6 h-6 text-green-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{rankingData.stats.averageLikes}</div>
                      <p className="text-gray-400 text-sm">평균 좋아요</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Rankings List */}
              {rankingData && rankingData.creatures.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      {periodLabels[selectedPeriod]} 베스트 공포글
                    </h2>
                    <p className="text-gray-400 text-sm">
                      기준일: {formatDate(rankingData.startDate)}
                    </p>
                  </div>

                  {rankingData.creatures.map((creature) => (
                    <Card key={creature.id} className={getRankCardStyle(creature.rank)}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            {/* Rank Badge */}
                            <div className="flex flex-col items-center">
                              <div className="text-3xl mb-1">{creature.rankBadge}</div>
                              <div className="text-xs text-gray-400">#{creature.rank}</div>
                            </div>
                            
                            {/* Creature Info */}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <CardTitle className="text-xl text-white">{creature.name}</CardTitle>
                                <Badge variant="secondary" className="bg-purple-600 text-white text-xs">
                                  {typeLabels[creature.creature_type] || creature.creature_type}
                                </Badge>
                              </div>
                              
                              <div className="grid md:grid-cols-2 gap-2 mb-3 text-sm">
                                <div className="flex items-center text-gray-300">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {creature.appearance_time}
                                </div>
                                <div className="flex items-center text-gray-300">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {creature.location}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Like Count */}
                          <div className="text-right">
                            <div className="flex items-center space-x-1 text-red-400 mb-1">
                              <Heart className="w-4 h-4 fill-current" />
                              <span className="text-xl font-bold">{creature.like_count}</span>
                            </div>
                            <p className="text-xs text-gray-400">
                              {formatDate(creature.created_at)}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {(creature.description || creature.story) && (
                        <CardContent>
                          {creature.description && (
                            <div className="mb-3">
                              <h4 className="text-purple-400 font-medium mb-1 text-sm">특징</h4>
                              <p className="text-gray-300 text-sm leading-relaxed">{creature.description}</p>
                            </div>
                          )}
                          
                          {creature.story && (
                            <div className="bg-slate-900/50 p-3 rounded-lg border border-purple-500/20">
                              <h4 className="text-purple-400 font-medium mb-2 text-sm flex items-center">
                                <span className="mr-1">📖</span>
                                공포 스토리 (미리보기)
                              </h4>
                              <p className="text-gray-300 text-sm leading-relaxed">
                                {creature.story.length > 150 
                                  ? `${creature.story.substring(0, 150)}...` 
                                  : creature.story}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700">
                            <div className="flex items-center text-gray-400 text-xs">
                              <User className="w-3 h-3 mr-1" />
                              익명의 작가
                            </div>
                            <div className="text-xs text-gray-500">
                              게시물 ID: #{creature.id}
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-slate-800 border-slate-700 text-center p-12">
                  <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    {periodLabels[selectedPeriod]} 랭킹이 없습니다
                  </h3>
                  <p className="text-gray-400 mb-6">
                    아직 좋아요를 받은 게시물이 없습니다.<br />
                    첫 번째 베스트 게시물의 주인공이 되어보세요!
                  </p>
                  <Button onClick={() => router.push("/")} className="bg-purple-600 hover:bg-purple-700">
                    게시물 작성하러 가기
                  </Button>
                </Card>
              )}

              {/* Update Info */}
              {rankingData && (
                <div className="text-center mt-8 p-4 bg-slate-800/50 rounded-lg">
                  <p className="text-gray-400 text-sm">
                    마지막 업데이트: {formatDate(rankingData.generatedAt)}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}