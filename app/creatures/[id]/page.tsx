"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Ghost, ArrowLeft, Sparkles, Clock, MapPin, User, Heart, Share2, MessageCircle, Loader2, Image as ImageIcon } from "lucide-react"
import Image from "next/image"
import { ReportButton } from "@/components/ui/report-button"
import { ShareButton } from "@/components/ui/share-button"
import { CommentList } from "@/components/comments"
import { HeaderBannerAd, ContentBottomAd, MobileAnchorAd } from "@/components/ads/AdComponents"
import { toast } from "sonner"

interface Creature {
  id: number
  name: string
  appearance_time: string
  location: string
  description: string
  creature_type: string
  created_at: string
  like_count?: number
  story?: string
  image_url?: string
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
    `${creature.location}에서 ${creature.appearance_time}에 목격된 ${creature.name}. 목격자들은 ${creature.description}라고 증언했다. 그 후로 그 장소를 지나는 사람들은 이상한 기운을 느낀다고 한다...`,

    `어느 날 밤, ${creature.appearance_time}에 ${creature.location}에서 일어난 일이다. ${creature.name}이 나타났을 때, 주변은 갑자기 차가워졌다. ${creature.description} 그 존재를 본 사람들은 며칠간 악몽에 시달렸다고 한다.`,

    `${creature.location}에는 오래된 전설이 있다. ${creature.appearance_time}마다 ${creature.name}이 나타난다는 것이다. ${creature.description} 지역 주민들은 그 시간에는 절대 그곳에 가지 않는다고 한다.`,

    `최근 ${creature.location}에서 기괴한 목격담이 늘고 있다. ${creature.appearance_time}에 나타나는 ${creature.name}에 대한 것이다. ${creature.description} 당신이라면... 그 존재와 마주쳤을 때 어떻게 하겠는가?`,
  ]

  return stories[Math.floor(Math.random() * stories.length)]
}

export default function CreatureDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [creature, setCreature] = useState<Creature | null>(null)
  const [loading, setLoading] = useState(true)
  const [liking, setLiking] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>()

  const creatureId = params.id as string

  useEffect(() => {
    const fetchCreature = async () => {
      try {
        const response = await fetch(`/api/creatures?id=${creatureId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch creature")
        }
        const creatureData = await response.json()
        
        if (!creatureData || !creatureData.id) {
          throw new Error("Creature not found")
        }
        const creatureWithStory = {
          ...creatureData,
          story: generateStory(creatureData),
        }
        setCreature(creatureWithStory)
      } catch (error) {
        console.error(error)
        toast.error("존재를 불러오는데 실패했습니다")
        router.push("/feed")
      } finally {
        setLoading(false)
      }
    }

    if (creatureId) {
      fetchCreature()
    }
  }, [creatureId, router])

  // 현재 사용자 세션 ID 가져오기 (익명 사용자용)
  useEffect(() => {
    const getOrCreateSessionId = () => {
      // 클라이언트 사이드에서만 실행되도록 보장
      if (typeof window !== 'undefined') {
        let sessionId = localStorage.getItem('nosurfing_session_id')
        if (!sessionId) {
          sessionId = crypto.randomUUID()
          localStorage.setItem('nosurfing_session_id', sessionId)
        }
        setCurrentUserId(sessionId)
      }
    }

    // 컴포넌트가 마운트된 후에만 실행
    setTimeout(getOrCreateSessionId, 100)
  }, [])

  const handleLike = async () => {
    if (!creature || liking) return

    setLiking(true)
    try {
      const response = await fetch('/api/creatures', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: creature.id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to like creature')
      }

      // 성공 시 좋아요 수 업데이트
      setCreature(prev => prev ? {
        ...prev,
        like_count: (prev.like_count || 0) + 1
      } : null)

      toast.success("좋아요를 눌렀습니다!")

    } catch (error: any) {
      console.error('좋아요 실패:', error)
      toast.error(error.message || '좋아요에 실패했습니다')
    } finally {
      setLiking(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-purple-400 mx-auto animate-spin mb-4" />
          <p className="text-white text-lg">존재를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!creature) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Ghost className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">존재를 찾을 수 없습니다</h2>
          <Button onClick={() => router.push("/feed")} className="bg-purple-600 hover:bg-purple-700">
            피드로 돌아가기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="p-6 border-b border-slate-700">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push("/feed")} className="text-gray-300 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            피드로 돌아가기
          </Button>
          <div className="flex items-center space-x-3">
            <Ghost className="w-8 h-8 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">존재 상세정보</h1>
          </div>
        </div>
      </header>

      {/* Header Banner Ad */}
      <div className="px-6">
        <HeaderBannerAd />
      </div>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Creature Detail */}
          <Card className="bg-slate-800 border-slate-700 shadow-xl overflow-hidden">
            {creature.image_url ? (
              <div className="relative w-full h-96 bg-slate-700">
                <Image 
                  src={creature.image_url} 
                  alt={creature.name}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    // 이미지 로드 실패를 조용히 처리 (콘솔 에러 없이)
                    const target = e.target as HTMLImageElement;
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.image-error-placeholder')) {
                      target.style.display = 'none';
                      const placeholder = document.createElement('div');
                      placeholder.className = 'absolute inset-0 flex items-center justify-center image-error-placeholder';
                      placeholder.innerHTML = `
                        <div class="text-center text-gray-400">
                          <svg class="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 12l2.5 3.01L15 11l4 5H5l4-4z"/>
                          </svg>
                          <p class="text-lg">이미지를 불러올 수 없습니다</p>
                        </div>
                      `;
                      parent.appendChild(placeholder);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-96 bg-slate-700 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-lg">이미지 없음</p>
                </div>
              </div>
            )}
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl text-white mb-2">{creature.name}</CardTitle>
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
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-purple-400 font-medium mb-2">출몰 시간</h4>
                  <p className="text-gray-300 text-lg">{creature.appearance_time}</p>
                </div>
                <div>
                  <h4 className="text-purple-400 font-medium mb-2">출몰 장소</h4>
                  <p className="text-gray-300 text-lg flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    {creature.location}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-purple-400 font-medium mb-3">특징</h4>
                <p className="text-gray-300 leading-relaxed text-lg">{creature.description}</p>
              </div>

              {creature.story && (
                <div className="bg-slate-900 p-6 rounded-lg border border-purple-500/30">
                  <h4 className="text-purple-400 font-medium mb-3 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2" />
                    AI 생성 괴담
                  </h4>
                  <p className="text-gray-300 leading-relaxed italic text-lg">{creature.story}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-700">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={handleLike}
                    disabled={liking}
                    className="text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-all duration-200"
                  >
                    <Heart className={`w-5 h-5 mr-2 ${liking ? 'animate-pulse' : ''}`} />
                    {creature.like_count || 0}
                  </Button>
                  
                  <ShareButton
                    title={creature.name}
                    text={`${creature.name} - 무서핑에서 발견된 존재`}
                    url={window.location.href}
                    size="lg"
                    className="text-gray-400 hover:text-blue-400 hover:bg-blue-900/20"
                  />

                  <ReportButton 
                    contentId={creature.id.toString()} 
                    contentType="creature" 
                    size="lg" 
                    variant="ghost"
                  />
                </div>
                <div className="text-sm text-gray-500">
                  #{creature.id}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card className="bg-slate-800 border-slate-700 shadow-xl">
            <CardContent className="p-6">
              <CommentList 
                creatureId={creature.id.toString()} 
                currentUserId={currentUserId}
              />
            </CardContent>
          </Card>

          {/* Content Bottom Ad */}
          <ContentBottomAd />
        </div>
      </main>

      {/* Mobile Anchor Ad */}
      <MobileAnchorAd />
    </div>
  )
}