"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Ghost, Loader2, Plus, Sparkles, Wand2, Image } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth/AuthProvider"

interface CreatureData {
  name: string
  appearance_time: string   // DB 필드명과 일치
  location: string
  description: string       // characteristics → description
  creature_type: string     // type → creature_type
  story?: string           // AI 생성 스토리
  image_url?: string       // AI 생성 이미지 URL
}

interface AIGenerationState {
  isGenerating: boolean
  generatedStory: string
  generatedImageUrl: string
  aiPrompt: string
}

interface AILimits {
  dailyLimit: number
  usedCount: number
  remainingCount: number
  canGenerate: boolean
  resetTime?: string
}

export function CreateCreatureForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { supabase, isLoading: isSupabaseLoading, error: supabaseError, isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [creature, setCreature] = useState<CreatureData>({
    name: "",
    appearance_time: "",
    location: "",
    description: "",
    creature_type: "",
    story: "",
    image_url: "",
  })

  // AI 생성 관련 상태
  const [aiState, setAIState] = useState<AIGenerationState>({
    isGenerating: false,
    generatedStory: "",
    generatedImageUrl: "",
    aiPrompt: ""
  })
  
  // 생성 모드: 'manual' (직접 작성) 또는 'ai' (AI 생성)
  const [creationMode, setCreationMode] = useState<'manual' | 'ai'>('manual')
  
  // AI 생성 횟수 제한 상태
  const [aiLimits, setAILimits] = useState<AILimits>({
    dailyLimit: 3,
    usedCount: 0,
    remainingCount: 3,
    canGenerate: true
  })

  // 인증 상태 확인
  useEffect(() => {
    if (!isAuthenticated && !isSupabaseLoading) {
      toast({
        title: "인증 필요",
        description: "익명 세션을 생성하는 중입니다. 잠시만 기다려주세요.",
        variant: "default",
      })
    }
  }, [isAuthenticated, isSupabaseLoading, toast])

  // AI 생성 제한 정보 가져오기
  useEffect(() => {
    const fetchAILimits = async () => {
      try {
        const response = await fetch('/api/ai/limits')
        if (response.ok) {
          const limits = await response.json()
          setAILimits(limits)
        }
      } catch (error) {
        console.error('AI 제한 정보 조회 실패:', error)
      }
    }

    // 익명 세션이 생성된 후에 제한 정보 조회
    if (supabase && !isSupabaseLoading) {
      fetchAILimits()
    }
  }, [supabase, isSupabaseLoading])

  const handleInputChange = (field: keyof CreatureData, value: string) => {
    setCreature((prev) => ({ ...prev, [field]: value }))
    
    // Browser MCP 호환성: 강제로 폼 검증 상태 업데이트
    if (process.env.NODE_ENV === 'development') {
      console.log(`Field ${field} updated:`, value.trim() || 'EMPTY')
    }
  }

  // AI로 스토리와 이미지 생성
  const handleAIGeneration = async () => {
    if (!aiState.aiPrompt.trim()) {
      toast({
        title: "입력 필요",
        description: "AI 생성을 위한 아이디어를 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    // 일일 제한 확인
    if (!aiLimits.canGenerate) {
      toast({
        title: "일일 제한 도달",
        description: `하루 ${aiLimits.dailyLimit}회 AI 생성 제한에 도달했습니다. 내일 다시 시도해주세요.`,
        variant: "destructive",
      })
      return
    }

    setAIState(prev => ({ ...prev, isGenerating: true }))
    
    try {
      // 먼저 사용량 기록 (생성 전에 차감)
      const limitResponse = await fetch('/api/ai/limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestType: 'both' })
      })

      if (!limitResponse.ok) {
        const limitData = await limitResponse.json()
        throw new Error(limitData.error || "일일 제한을 확인할 수 없습니다.")
      }

      // 제한 상태 업데이트
      const newLimits = await limitResponse.json()
      setAILimits(newLimits)
      // 병렬로 스토리와 이미지 생성 요청
      const [storyResponse, imageResponse] = await Promise.all([
        fetch("/api/ai/story", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: aiState.aiPrompt }),
        }),
        fetch("/api/ai/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: aiState.aiPrompt }),
        })
      ])

      const storyData = await storyResponse.json()
      const imageData = await imageResponse.json()

      if (!storyResponse.ok) {
        throw new Error(storyData.error || "스토리 생성에 실패했습니다")
      }
      
      if (!imageResponse.ok) {
        throw new Error(imageData.error || "이미지 생성에 실패했습니다")
      }

      // 생성된 콘텐츠를 상태에 저장
      setAIState(prev => ({
        ...prev,
        generatedStory: storyData.story,
        generatedImageUrl: imageData.imageUrl
      }))

      // 폼에 AI 생성 데이터 자동 입력 (간단한 예시로 제목만)
      const storyLines = storyData.story.split('\n')
      const possibleTitle = storyLines[0].substring(0, 50).trim()
      
      setCreature(prev => ({
        ...prev,
        story: storyData.story,
        image_url: imageData.imageUrl,
        name: prev.name || possibleTitle || "AI가 생성한 존재",
      }))

      toast({
        title: "AI 생성 완료!",
        description: "스토리와 이미지가 생성되었습니다. 내용을 확인하고 수정하세요.",
      })

    } catch (error: any) {
      console.error("AI 생성 오류:", error)
      toast({
        title: "생성 실패",
        description: error.message || "AI 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setAIState(prev => ({ ...prev, isGenerating: false }))
    }
  }

  const handleCreateCreature = async () => {
    // 인증 상태 체크 - 개발 환경에서는 익명 인증 없이도 허용
    if (!supabase) {
      toast({
        title: "시스템 오류",
        description: "Supabase 클라이언트를 초기화할 수 없습니다. 페이지를 새로고침해 주세요.",
        variant: "destructive",
      })
      return
    }

    // 개발 환경에서 익명 인증이 비활성화된 경우 경고만 표시하고 계속 진행
    if (!isAuthenticated && process.env.NODE_ENV === 'development') {
      console.warn('익명 인증이 비활성화되어 있지만 개발 모드에서 게시물 작성을 허용합니다.')
      toast({
        title: "개발 모드",
        description: "익명 인증 없이 개발 모드에서 게시물을 작성합니다.",
      })
    } else if (!isAuthenticated) {
      // 프로덕션 환경에서는 재인증 시도
      try {
        toast({
          title: "재인증 시도 중",
          description: "익명 세션을 다시 생성하는 중입니다...",
        })
        
        const { error: signInError } = await supabase.auth.signInAnonymously()
        if (signInError) {
          throw new Error(signInError.message)
        }
          
        toast({
          title: "재인증 성공", 
          description: "익명 세션이 생성되었습니다. 다시 시도해주세요.",
        })
        return;
      } catch (error: any) {
        toast({
          title: "인증 오류",
          description: `인증에 실패했습니다: ${error.message}. 페이지를 새로고침해 주세요.`,
          variant: "destructive",
        })
        return
      }
    }

    setIsLoading(true)
    try {
      // AI 생성 모드일 때는 생성된 콘텐츠도 함께 전송
      const creatureData = {
        ...creature,
        story: creationMode === 'ai' ? aiState.generatedStory : undefined,
        image_url: creationMode === 'ai' ? aiState.generatedImageUrl : undefined,
      }

      // 1단계: 콘텐츠 검열 수행
      const moderationText = `${creatureData.name} ${creatureData.description} ${creatureData.story || ''}`
      
      const moderationResponse = await fetch("/api/moderation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: moderationText,
          type: "creature"
        }),
      })

      if (!moderationResponse.ok) {
        throw new Error("콘텐츠 검열 중 오류가 발생했습니다")
      }

      const moderationResult = await moderationResponse.json()
      
      // 검열 실패 시 사용자에게 알림
      if (!moderationResult.moderation.isApproved) {
        const reasons = moderationResult.moderation.reasons.join(', ')
        toast({
          title: "콘텐츠 검열 실패",
          description: `다음 이유로 게시가 제한됩니다: ${reasons}`,
          variant: "destructive",
        })
        return
      }

      // 2단계: 검열 통과 시 크리처 생성
      // 인증 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch("/api/creatures", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token && {
            "Authorization": `Bearer ${session.access_token}`
          })
        },
        body: JSON.stringify({
          ...creatureData,
          moderation_id: moderationResult.moderation.moderationId,
          moderation_confidence: moderationResult.moderation.confidence
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create creature")
      }

      toast({
        title: "성공!",
        description: "새로운 존재가 세상에 알려졌습니다. 피드로 이동합니다.",
      })

      // 성공 시 폼 초기화 및 피드 페이지로 이동
      setCreature({
        name: "",
        appearance_time: "",
        location: "",
        description: "",
        creature_type: "",
        story: "",
        image_url: "",
      })
      setAIState({
        isGenerating: false,
        generatedStory: "",
        generatedImageUrl: "",
        aiPrompt: ""
      })
      router.push("/feed")

    } catch (error: any) {
      console.error(error)
      toast({
        title: "오류",
        description: `존재를 만드는 데 실패했습니다: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 폼 유효성 검증 - 모드에 따라 다르게 적용
  const isFormValid = creationMode === 'manual' 
    ? (creature.name?.trim() &&
       creature.appearance_time?.trim() &&
       creature.location?.trim() &&
       creature.description?.trim() &&
       creature.creature_type?.trim())
    : (aiState.generatedStory?.trim() && // AI 모드일 때는 스토리가 생성되어야 함
       creature.appearance_time?.trim() &&
       creature.location?.trim() &&
       creature.creature_type?.trim())

  // 디버깅용 로그 (개발 모드에서만)
  if (process.env.NODE_ENV === 'development') {
    console.log('Form validation debug:', {
      creationMode,
      name: creature.name?.trim() || 'EMPTY',
      appearance_time: creature.appearance_time?.trim() || 'EMPTY', 
      location: creature.location?.trim() || 'EMPTY',
      description: creature.description?.trim() || 'EMPTY',
      creature_type: creature.creature_type?.trim() || 'EMPTY',
      generatedStory: aiState.generatedStory?.trim() || 'EMPTY',
      isFormValid
    })
  }

  return (
    <Card className="bg-slate-800 border-slate-700 shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl text-white flex items-center justify-between">
          <div className="flex items-center">
            <Plus className="w-6 h-6 mr-2 text-purple-400" />
            새로운 존재 만들기
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Button
              variant={creationMode === 'manual' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCreationMode('manual')}
              disabled={isLoading || aiState.isGenerating}
              className={`${creationMode === 'manual' ? 'bg-purple-600' : 'text-gray-400'}`}
            >
              직접 작성
            </Button>
            <Button
              variant={creationMode === 'ai' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCreationMode('ai')}
              disabled={isLoading || aiState.isGenerating}
              className={`${creationMode === 'ai' ? 'bg-purple-600' : 'text-gray-400'}`}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              AI 생성
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI 생성 모드일 때 프롬프트 입력 */}
        {creationMode === 'ai' && (
          <div className="bg-slate-900 p-4 rounded-lg border border-purple-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wand2 className="w-5 h-5 text-purple-400" />
                <Label className="text-purple-400 font-medium">
                  AI 생성 아이디어 입력
                </Label>
              </div>
              <div className="text-xs text-gray-400 bg-slate-800 px-2 py-1 rounded">
                남은 횟수: {aiLimits.remainingCount}/{aiLimits.dailyLimit}
              </div>
            </div>
            <Textarea
              placeholder="예: 폐가에서 귀신을 만난 이야기, 지하철에서 일어난 무서운 일..."
              value={aiState.aiPrompt}
              onChange={(e) => setAIState(prev => ({ ...prev, aiPrompt: e.target.value }))}
              className="bg-slate-800 border-slate-600 text-white placeholder-gray-400 min-h-[80px]"
              disabled={isLoading || aiState.isGenerating}
            />
            <Button
              onClick={handleAIGeneration}
              disabled={isLoading || aiState.isGenerating || !aiState.aiPrompt.trim() || !aiLimits.canGenerate}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300"
            >
              {aiState.isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  AI가 생성하는 중... (약 5-8초 소요)
                </>
              ) : !aiLimits.canGenerate ? (
                <>
                  🚫 일일 AI 생성 제한 도달 ({aiLimits.usedCount}/{aiLimits.dailyLimit})
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI로 스토리 & 이미지 생성
                </>
              )}
            </Button>
            
            {!aiLimits.canGenerate && (
              <div className="text-xs text-amber-400 text-center bg-amber-900/20 p-2 rounded">
                💡 내일 자정에 AI 생성 횟수가 초기화됩니다.
              </div>
            )}
            
            {/* AI 생성 결과 미리보기 */}
            {aiState.generatedStory && (
              <div className="space-y-3">
                <Label className="text-green-400 font-medium flex items-center">
                  <Sparkles className="w-4 h-4 mr-1" />
                  생성된 스토리 (미리보기)
                </Label>
                <div className="bg-slate-800 p-3 rounded max-h-32 overflow-y-auto text-gray-300 text-sm">
                  {aiState.generatedStory.substring(0, 200)}...
                </div>
              </div>
            )}
            
            {aiState.generatedImageUrl && (
              <div className="space-y-2">
                <Label className="text-green-400 font-medium flex items-center">
                  <Image className="w-4 h-4 mr-1" />
                  생성된 이미지
                </Label>
                <img 
                  src={aiState.generatedImageUrl} 
                  alt="AI 생성 이미지" 
                  className="w-full max-w-xs mx-auto rounded border border-slate-600"
                />
              </div>
            )}
          </div>
        )}
        {/* 수동 입력 모드일 때만 보여주는 필드들 */}
        {creationMode === 'manual' && (
          <>
            {/* 이름 */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white font-medium">
                존재의 이름
              </Label>
              <Input
                id="name"
                placeholder="예: 계단 밑의 그림자, 새벽 3시의 속삭임..."
                value={creature.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                onInput={(e) => handleInputChange("name", (e.target as HTMLInputElement).value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                disabled={isLoading}
              />
            </div>

            {/* 출몰 시간 */}
            <div className="space-y-2">
              <Label htmlFor="time" className="text-white font-medium">
                출몰 시간
              </Label>
              <Input
                id="time"
                placeholder="예: 새벽 3시 33분, 보름달이 뜨는 밤..."
                value={creature.appearance_time}
                onChange={(e) => handleInputChange("appearance_time", e.target.value)}
                onInput={(e) => handleInputChange("appearance_time", (e.target as HTMLInputElement).value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                disabled={isLoading}
              />
            </div>

            {/* 출몰 장소 */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-white font-medium">
                출몰 장소
              </Label>
              <Input
                id="location"
                placeholder="예: 오래된 학교 화장실, 지하철 마지막 칸..."
                value={creature.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                onInput={(e) => handleInputChange("location", (e.target as HTMLInputElement).value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                disabled={isLoading}
              />
            </div>

            {/* 유형 */}
            <div className="space-y-2">
              <Label htmlFor="type" className="text-white font-medium">
                존재 유형
              </Label>
              <Select
                onValueChange={(value) => handleInputChange("creature_type", value)}
                disabled={isLoading}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="존재의 유형을 선택하세요" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="ghost" className="text-white">
                    유령/영혼
                  </SelectItem>
                  <SelectItem value="monster" className="text-white">
                    괴물/크리처
                  </SelectItem>
                  <SelectItem value="demon" className="text-white">
                    악마/악령
                  </SelectItem>
                  <SelectItem value="urban-legend" className="text-white">
                    도시전설
                  </SelectItem>
                  <SelectItem value="cursed-object" className="text-white">
                    저주받은 물건
                  </SelectItem>
                  <SelectItem value="supernatural" className="text-white">
                    초자연적 현상
                  </SelectItem>
                  <SelectItem value="other" className="text-white">
                    기타
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 특징 */}
            <div className="space-y-2">
              <Label htmlFor="characteristics" className="text-white font-medium">
                특징 및 설명
              </Label>
              <Textarea
                id="characteristics"
                placeholder="존재의 외모, 행동, 능력 등을 자세히 설명해주세요..."
                value={creature.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                onInput={(e) => handleInputChange("description", (e.target as HTMLTextAreaElement).value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-gray-400 min-h-[120px]"
                disabled={isLoading}
              />
            </div>
          </>
        )}

        {/* AI 모드일 때 기본 정보 입력 (선택사항) */}
        {creationMode === 'ai' && aiState.generatedStory && (
          <div className="space-y-4">
            <Label className="text-white font-medium">
              AI 생성 후 추가 정보 입력 (선택사항)
            </Label>
            
            {/* 이름 */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300 text-sm">
                존재의 이름 (비워두면 AI가 자동 생성)
              </Label>
              <Input
                id="name"
                placeholder="AI가 생성한 이름을 수정하거나 새로 입력..."
                value={creature.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                onInput={(e) => handleInputChange("name", (e.target as HTMLInputElement).value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                disabled={isLoading}
              />
            </div>

            {/* 필수 정보들 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="time" className="text-gray-300 text-sm">출몰 시간</Label>
                <Input
                  id="time"
                  placeholder="새벽 3시 33분..."
                  value={creature.appearance_time}
                  onChange={(e) => handleInputChange("appearance_time", e.target.value)}
                  onInput={(e) => handleInputChange("appearance_time", (e.target as HTMLInputElement).value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location" className="text-gray-300 text-sm">출몰 장소</Label>
                <Input
                  id="location"
                  placeholder="오래된 학교..."
                  value={creature.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  onInput={(e) => handleInputChange("location", (e.target as HTMLInputElement).value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-gray-300 text-sm">존재 유형</Label>
              <Select
                onValueChange={(value) => handleInputChange("creature_type", value)}
                disabled={isLoading}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="유형을 선택하세요" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="ghost" className="text-white">유령/영혼</SelectItem>
                  <SelectItem value="monster" className="text-white">괴물/크리처</SelectItem>
                  <SelectItem value="demon" className="text-white">악마/악령</SelectItem>
                  <SelectItem value="urban-legend" className="text-white">도시전설</SelectItem>
                  <SelectItem value="cursed-object" className="text-white">저주받은 물건</SelectItem>
                  <SelectItem value="supernatural" className="text-white">초자연적 현상</SelectItem>
                  <SelectItem value="other" className="text-white">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-300 text-sm">추가 설명</Label>
              <Textarea
                id="description"
                placeholder="AI 생성 스토리에 추가할 설명..."
                value={creature.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                onInput={(e) => handleInputChange("description", (e.target as HTMLTextAreaElement).value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-gray-400 min-h-[80px]"
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        {/* 생성 버튼 */}
        <Button
          onClick={handleCreateCreature}
          disabled={!isFormValid || isLoading || aiState.isGenerating}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : creationMode === 'ai' ? (
            <Sparkles className="w-5 h-5 mr-2" />
          ) : (
            <Ghost className="w-5 h-5 mr-2" />
          )}
          {isLoading 
            ? "게시하는 중..." 
            : creationMode === 'ai' 
              ? "AI 생성 존재 게시하기" 
              : "존재 만들기"
          }
        </Button>
      </CardContent>
    </Card>
  )
}
