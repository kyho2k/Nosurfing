"use client"

import React, { useEffect, useState } from "react"
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
import { Ghost, Loader2, Plus, Sparkles, Wand2, Image, Gamepad2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth/AuthProvider"
import { MiniGamePopup } from "@/components/game/MiniGamePopup"

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

  // 미니게임 팝업 상태
  const [showMiniGame, setShowMiniGame] = useState(false)
  
  // AI 생성된 데이터를 임시 저장
  const [pendingCreatureData, setPendingCreatureData] = useState<any>(null)

  // 미니게임 완료 후 실제 게시하는 함수
  const handlePostAfterMiniGame = async () => {
    if (!pendingCreatureData) return;

    setIsLoading(true);
    
    try {
      if (!supabase) throw new Error("Supabase 클라이언트 초기화 오류.");
      if (!isAuthenticated) {
          const { error: signInError } = await supabase.auth.signInAnonymously();
          if (signInError) throw new Error(`익명 인증 실패: ${signInError.message}`);
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/creatures", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token && { "Authorization": `Bearer ${session.access_token}` })
        },
        body: JSON.stringify({
          ...pendingCreatureData.creatureData,
          moderation_id: pendingCreatureData.moderationResult.moderation.moderationId,
          moderation_confidence: pendingCreatureData.moderationResult.moderation.confidence
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "게시물 생성 실패");
      }

      toast({ title: "게시 완료!", description: "AI 존재가 세상에 알려졌습니다. 피드로 이동합니다." });

      // 상태 초기화
      setCreature({ name: "", appearance_time: "", location: "", description: "", creature_type: "", story: "", image_url: "" });
      setAIState({ isGenerating: false, generatedStory: "", generatedImageUrl: "", aiPrompt: "" });
      setPendingCreatureData(null);
      router.push("/feed");

    } catch (error: any) {
      console.error("게시 오류:", error);
      toast({ title: "오류", description: error.message || "게시 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }
  
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

  const handleCreateCreature = async () => {
    // This function now only handles MANUAL submission
    if (!supabase) {
      toast({
        title: "시스템 오류",
        description: "Supabase 클라이언트를 초기화할 수 없습니다. 페이지를 새로고침해 주세요.",
        variant: "destructive",
      })
      return
    }

    if (!isAuthenticated && process.env.NODE_ENV === 'development') {
      console.warn('익명 인증이 비활성화되어 있지만 개발 모드에서 게시물 작성을 허용합니다.')
    } else if (!isAuthenticated) {
      try {
        toast({ title: "재인증 시도 중", description: "익명 세션을 다시 생성하는 중입니다..." })
        const { error: signInError } = await supabase.auth.signInAnonymously()
        if (signInError) throw new Error(signInError.message)
        toast({ title: "재인증 성공", description: "익명 세션이 생성되었습니다. 다시 시도해주세요." })
        return;
      } catch (error: any) {
        toast({ title: "인증 오류", description: `인증에 실패했습니다: ${error.message}. 페이지를 새로고침해 주세요.`, variant: "destructive" })
        return
      }
    }

    setIsLoading(true)
    try {
      const creatureData = { ...creature }; // No AI data in manual mode

      const moderationText = `${creatureData.name} ${creatureData.description}`
      const moderationResponse = await fetch("/api/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: moderationText, type: "creature" }),
      })

      if (!moderationResponse.ok) throw new Error("콘텐츠 검열 중 오류가 발생했습니다")
      const moderationResult = await moderationResponse.json()
      
      if (!moderationResult.moderation.isApproved) {
        const reasons = moderationResult.moderation.reasons.join(', ')
        toast({ title: "콘텐츠 검열 실패", description: `다음 이유로 게시가 제한됩니다: ${reasons}`, variant: "destructive" })
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch("/api/creatures", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token && { "Authorization": `Bearer ${session.access_token}` })
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

      toast({ title: "성공!", description: "새로운 존재가 세상에 알려졌습니다. 피드로 이동합니다." })

      setCreature({ name: "", appearance_time: "", location: "", description: "", creature_type: "", story: "", image_url: "" })
      router.push("/feed")

    } catch (error: any) {
      console.error(error)
      toast({ title: "오류", description: `존재를 만드는 데 실패했습니다: ${error.message}`, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  // NEW: Combined function for AI generation and posting
  const handleAIGenerateAndPost = async () => {
    if (!aiState.aiPrompt.trim()) {
      toast({ title: "입력 필요", description: "AI 생성을 위한 아이디어를 입력해주세요.", variant: "destructive" })
      return
    }

    if (!aiLimits.canGenerate) {
      toast({ title: "일일 제한 도달", description: `하루 ${aiLimits.dailyLimit}회 AI 생성 제한에 도달했습니다.`, variant: "destructive" })
      return
    }
    
    const isCommonFieldsValid = creature.appearance_time?.trim() && creature.location?.trim() && creature.creature_type?.trim();
    if (!isCommonFieldsValid) {
        toast({ title: "추가 정보 필요", description: "출몰 시간, 출몰 장소, 존재 유형을 모두 입력해주세요.", variant: "destructive" });
        return;
    }

    setIsLoading(true);
    setAIState(prev => ({ ...prev, isGenerating: true }));

    try {
      const limitResponse = await fetch('/api/ai/limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestType: 'both' })
      });

      if (!limitResponse.ok) {
        const limitData = await limitResponse.json();
        toast({ title: "제한 확인 실패", description: limitData.error || "일일 제한을 확인할 수 없습니다.", variant: "destructive" });
        return;
      }
      setAILimits(await limitResponse.json());

      toast({ title: "AI 생성 중...", description: "스토리와 이미지를 생성하고 바로 게시합니다." });
      const [storyResponse, imageResponse] = await Promise.all([
        fetch("/api/ai/story", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: aiState.aiPrompt }) }),
        fetch("/api/ai/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: aiState.aiPrompt }) })
      ]);

      const storyData = await storyResponse.json();
      const imageData = await imageResponse.json();

      if (!storyResponse.ok) {
        toast({ title: "스토리 생성 실패", description: storyData.error || "스토리 생성에 실패했습니다.", variant: "destructive" });
        return;
      }
      if (!imageResponse.ok) {
        toast({ title: "이미지 생성 실패", description: imageData.error || "이미지 생성에 실패했습니다.", variant: "destructive" });
        return;
      }
      
      const storyLines = storyData.story.split('\n');
      const possibleTitle = storyLines[0].substring(0, 50).trim();
      
      const creatureData = {
        ...creature,
        name: creature.name.trim() || possibleTitle || "AI 생성 존재",
        story: storyData.story,
        image_url: imageData.imageUrl,
      };

      const moderationText = `${creatureData.name} ${creatureData.description} ${creatureData.story || ''}`;
      const moderationResponse = await fetch("/api/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: moderationText, type: "creature" }),
      });

      if (!moderationResponse.ok) {
        toast({ title: "콘텐츠 검열 오류", description: "콘텐츠 검열 중 문제가 발생했습니다.", variant: "destructive" });
        return;
      }
      const moderationResult = await moderationResponse.json();

      if (!moderationResult.moderation.isApproved) {
        const reasons = moderationResult.moderation.reasons?.join(', ') || '알 수 없는 이유';
        console.error("콘텐츠 검열 실패:", moderationResult);
        toast({ 
          title: "콘텐츠 검열 실패", 
          description: `다음 이유로 게시가 제한됩니다: ${reasons}. 다른 내용으로 다시 시도해주세요.`,
          variant: "destructive" 
        });
        return;
      }

      // AI 생성 완료 후 데이터 임시 저장하고 미니게임 실행
      const pendingData = {
        creatureData,
        moderationResult
      };
      
      setPendingCreatureData(pendingData);
      
      toast({ 
        title: "AI 생성 완료!", 
        description: "잠시 미니게임을 즐겨보세요. 게임이 끝나면 자동으로 게시됩니다." 
      });

      // 미니게임 실행
      setShowMiniGame(true);

    } catch (error: any) {
      console.error("AI 생성 및 게시 오류:", error);
      const errorMessage = typeof error === 'string' ? error : 
                          error?.message ? error.message : 
                          "AI 생성 및 게시 중 오류가 발생했습니다.";
      toast({ title: "오류", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
      setAIState(prev => ({ ...prev, isGenerating: false }));
    }
  }

  // 폼 유효성 검증 - 모드에 따라 다르게 적용
  const isManualFormValid =
    !!(creature.name?.trim() &&
    creature.appearance_time?.trim() &&
    creature.location?.trim() &&
    creature.description?.trim() &&
    creature.creature_type?.trim());

  const isAIFormValid =
    !!(aiState.aiPrompt?.trim() &&
    creature.appearance_time?.trim() &&
    creature.location?.trim() &&
    creature.creature_type?.trim());

  // 디버깅용 로그 (개발 모드에서만)
  if (process.env.NODE_ENV === 'development') {
    console.log('Form validation debug:', {
      creationMode,
      isManualFormValid,
      isAIFormValid,
      aiPrompt: aiState.aiPrompt?.trim() || 'EMPTY',
      name: creature.name?.trim() || 'EMPTY',
      appearance_time: creature.appearance_time?.trim() || 'EMPTY', 
      location: creature.location?.trim() || 'EMPTY',
      description: creature.description?.trim() || 'EMPTY',
      creature_type: creature.creature_type?.trim() || 'EMPTY',
    })
  }

  return (
    <div>
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
            
            {!aiLimits.canGenerate && (
              <div className="text-xs text-amber-400 text-center bg-amber-900/20 p-2 rounded">
                💡 내일 자정에 AI 생성 횟수가 초기화됩니다.
              </div>
            )}

          </div>
        )}
        {/* 통합 폼 */}
        <div className="space-y-4">
          {/* 이름 */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white font-medium">
              {creationMode === 'ai' ? '존재의 이름 (비워두면 AI가 자동 생성)' : '존재의 이름'}
            </Label>
            <Input
              id="name"
              placeholder={creationMode === 'ai' ? 'AI가 생성한 이름을 수정하거나 새로 입력...' : '예: 계단 밑의 그림자, 새벽 3시의 속삭임...'}
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
              {creationMode === 'ai' ? '특징 및 추가 설명' : '특징 및 설명'}
            </Label>
            <Textarea
              id="characteristics"
              placeholder={creationMode === 'ai' ? 'AI 생성 스토리에 추가할 설명을 입력하세요...' : '존재의 외모, 행동, 능력 등을 자세히 설명해주세요...'}
              value={creature.description}
              onChange={(e) =>
                handleInputChange("description", e.target.value)
              }
              onInput={(e) => handleInputChange("description", (e.target as HTMLTextAreaElement).value)}
              className="bg-slate-700 border-slate-600 text-white placeholder-gray-400 min-h-[120px]"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* 생성 버튼 */}
        <Button
          onClick={creationMode === 'ai' ? handleAIGenerateAndPost : handleCreateCreature}
          disabled={
            isLoading || 
            aiState.isGenerating ||
            (creationMode === 'manual' && !isManualFormValid) ||
            (creationMode === 'ai' && !isAIFormValid)
          }
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading || aiState.isGenerating ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5 mr-2" />
          )}
          {isLoading || aiState.isGenerating
            ? "생성 및 게시 중..."
            : creationMode === 'ai'
              ? "AI로 생성하고 게시하기"
              : "존재 만들기"
          }
        </Button>
      </CardContent>
    </Card>

    {/* 미니게임 팝업 */}
    <MiniGamePopup 
      isOpen={showMiniGame} 
      onClose={() => {
        setShowMiniGame(false);
        // 미니게임이 끝나면 게시 처리
        if (pendingCreatureData) {
          handlePostAfterMiniGame();
        }
      }} 
    />
    </div>
  )
}
