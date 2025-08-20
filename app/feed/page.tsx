"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Ghost, ArrowLeft, Sparkles, Clock, MapPin, User, Heart, Share2, Trophy, MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { ReportButton } from "@/components/ui/report-button"
import { HeaderBannerAd, FeedInlineAd, ContentBottomAd, MobileAnchorAd } from "@/components/ads/AdComponents"
import { useAuth } from "@/components/auth/AuthProvider"
import { getSessionHeaders } from "@/lib/session-utils"

interface Creature {
  id: number
  name: string
  appearance_time: string  // DB 필드명과 일치
  location: string
  description: string      // characteristics → description
  creature_type: string    // type → creature_type
  created_at: string       // createdAt → created_at
  like_count?: number      // 좋아요 수 추가
  story?: string
  is_liked?: boolean       // 사용자 좋아요 상태 추가
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
  // 안전한 기본값 설정
  const location = creature.location || '알 수 없는 곳'
  const appearanceTime = creature.appearance_time || '어느 때'
  const name = creature.name || '이름 모를 존재'
  const description = creature.description || '설명할 수 없는 모습'

  const stories = [
    `${location}에서 ${appearanceTime}에 목격된 ${name}. 목격자들은 ${description}라고 증언했다. 그 후로 그 장소를 지나는 사람들은 이상한 기운을 느낀다고 한다...`,

    `어느 날 밤, ${appearanceTime}에 ${location}에서 일어난 일이다. ${name}이 나타났을 때, 주변은 갑자기 차가워졌다. ${description} 그 존재를 본 사람들은 며칠간 악몽에 시달렸다고 한다.`,

    `${location}에는 오래된 전설이 있다. ${appearanceTime}마다 ${name}이 나타난다는 것이다. ${description} 지역 주민들은 그 시간에는 절대 그곳에 가지 않는다고 한다.`,

    `최근 ${location}에서 기괴한 목격담이 늘고 있다. ${appearanceTime}에 나타나는 ${name}에 대한 것이다. ${description} 당신이라면... 그 존재와 마주쳤을 때 어떻게 하겠는가?`,
  ]

  return stories[Math.floor(Math.random() * stories.length)]
}

export default function FeedPage() {
  const router = useRouter()
  const { supabase, isAuthenticated, isLoading: authLoading } = useAuth()
  const [creatures, setCreatures] = useState<Creature[]>([])
  const [loading, setLoading] = useState(true)
  const [likingCreature, setLikingCreature] = useState<number | null>(null)

  useEffect(() => {
    let isMounted = true;

    const fetchCreatures = async () => {
      try {
        const response = await fetch("/api/creatures", {
          headers: getSessionHeaders()
        })
        if (!response.ok) {
          throw new Error(`Failed to fetch creatures: ${response.status}`)
        }
        const data = await response.json()
        
        if (isMounted) {
          // 각 게시물의 좋아요 상태를 병렬로 가져오기
          const creaturesWithLikeStatus = await Promise.all(
            data.map(async (creature: Creature) => {
              try {
                const likeResponse = await fetch(`/api/creatures/${creature.id}/like`, {
                  method: 'GET',
                  headers: getSessionHeaders()
                })
                const likeData = await likeResponse.json()
                
                return {
                  ...creature,
                  story: generateStory(creature),
                  is_liked: likeData.is_liked || false
                }
              } catch (error) {
                console.warn(`Failed to fetch like status for creature ${creature.id}:`, error)
                return {
                  ...creature,
                  story: generateStory(creature),
                  is_liked: false
                }
              }
            })
          )
          
          setCreatures(creaturesWithLikeStatus)
          setLoading(false)
        }
      } catch (error: any) {
        console.error('Failed to fetch creatures:', error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    // 1초 후 실행하여 hydration 완료 후 API 호출
    const timer = setTimeout(fetchCreatures, 1000)

    return () => {
      isMounted = false;
      clearTimeout(timer)
    }
  }, [])

  const handleLike = async (creatureId: number) => {
    const creature = creatures.find(c => c.id === creatureId)
    if (!creature) return

    setLikingCreature(creatureId)
    try {
      // 현재 좋아요 상태에 따라 추가 또는 취소
      const method = creature.is_liked ? 'DELETE' : 'POST'
      
      const response = await fetch(`/api/creatures/${creatureId}/like`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getSessionHeaders()
        }
      })

      const data = await response.json()

      if (!response.ok) {
        // 좋아요 상태 불일치 시 POST로 재시도 (댓글 좋아요와 동일한 로직)
        if (method === 'DELETE' && data.error?.includes('좋아요를 누르지 않은')) {
          console.log('좋아요 상태 불일치 감지, POST로 재시도합니다')
          const retryResponse = await fetch(`/api/creatures/${creatureId}/like`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getSessionHeaders()
            }
          })
          
          if (retryResponse.ok) {
            const retryData = await retryResponse.json()
            // 상태 업데이트: 좋아요 추가
            setCreatures(prev => prev.map(c => 
              c.id === creatureId 
                ? { ...c, like_count: retryData.like_count, is_liked: true }
                : c
            ))
            return
          }
        }
        throw new Error(data.error || '좋아요 처리에 실패했습니다')
      }

      // 정상 처리 시 상태 업데이트
      setCreatures(prev => prev.map(c => 
        c.id === creatureId 
          ? { 
              ...c, 
              like_count: data.like_count, 
              is_liked: !creature.is_liked 
            }
          : c
      ))

    } catch (error: any) {
      console.error('좋아요 오류:', error)
      alert(error.message || '좋아요 처리에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLikingCreature(null)
    }
  }

  const handleShare = (creature: Creature) => {
    const url = `${window.location.origin}/creatures/${creature.id}`
    navigator.clipboard.writeText(url).then(() => {
      alert('링크가 클립보드에 복사되었습니다!')
    }).catch(() => {
      alert('링크 복사에 실패했습니다.')
    })
  }

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
            <Button 
              variant="ghost" 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('베스트 랭킹 버튼 클릭됨')
                router.push("/rankings")
              }} 
              className="text-gray-300 hover:text-white"
            >
              <Trophy className="w-4 h-4 mr-2" />
              베스트 랭킹
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

              {creatures.map((creature, index) => (
                <Card key={creature.id} className="bg-slate-800 border-slate-700 shadow-xl cursor-pointer hover:bg-slate-750 transition-colors" onClick={() => router.push(`/creatures/${creature.id}`)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl text-white mb-2 hover:text-purple-300 transition-colors">{creature.name}</CardTitle>
                        <Badge variant="secondary" className="bg-purple-600 text-white">
                          {typeLabels[creature.creature_type] || creature.creature_type}
                        </Badge>
                      </div>
                      <div className="text-right text-sm text-gray-400">
                        <div className="flex items-center mb-1">
                          <User className="w-3 h-3 mr-1" />
                          익명의 목격자
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(creature.created_at).toLocaleDateString("ko-KR")}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-purple-400 font-medium mb-1">출몰 시간</h4>
                        <p className="text-gray-300">{creature.appearance_time}</p>
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
                      <p className="text-gray-300 leading-relaxed">{creature.description}</p>
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

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-700" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(creature.id)}
                          disabled={likingCreature === creature.id}
                          className={`transition-all duration-200 ${
                            creature.is_liked 
                              ? 'text-red-400 hover:text-red-300' 
                              : 'text-gray-400 hover:text-red-400 hover:bg-red-900/20'
                          }`}
                        >
                          <Heart className={`w-4 h-4 mr-1 ${
                            likingCreature === creature.id ? 'animate-pulse' : ''
                          } ${creature.is_liked ? 'fill-current' : ''}`} />
                          {creature.like_count || 0}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare(creature)}
                          className="text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 transition-all duration-200"
                        >
                          <Share2 className="w-4 h-4 mr-1" />
                          공유
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/creatures/${creature.id}`)}
                          className="text-gray-400 hover:text-purple-400 hover:bg-purple-900/20 transition-all duration-200"
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          댓글
                        </Button>
                        <ReportButton 
                          contentId={creature.id.toString()} 
                          contentType="creature" 
                          size="sm" 
                          variant="ghost"
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        #{creature.id}
                      </div>
                    </div>
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