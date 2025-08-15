import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import BadWords from "badwords-ko";
import OpenAI from "openai";

// 한국어 금칙어 필터 초기화
const badWords = new BadWords();

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ModerationRequest {
  text: string
  type: 'creature' | 'comment' | 'general'
  reportReason?: string
}

interface ModerationResult {
  isApproved: boolean
  confidence: number
  reasons: string[]
  filteredText?: string
  moderationId: string
}

// 콘텐츠 검열 함수
async function moderateContent(text: string, type: string): Promise<ModerationResult> {
  const reasons: string[] = []
  let isApproved = true
  let confidence = 1.0
  let filteredText = text

  try {
    // 1. 한국어 금칙어 필터링
    if (badWords.isProfane(text)) {
      reasons.push("부적절한 언어 사용")
      filteredText = badWords.clean(text)
      isApproved = false
      confidence = 0.9
    }

    // 2. OpenAI Moderation API 검사 (영어/다국어)
    if (process.env.OPENAI_API_KEY) {
      try {
        const moderation = await openai.moderations.create({
          input: text,
        })

        const results = moderation.results[0]
        if (results.flagged) {
          isApproved = false
          confidence = Math.min(confidence, 0.8)

          // 위반 카테고리 분석
          const categories = results.categories
          if (categories.hate) reasons.push("혐오 표현")
          if (categories.harassment) reasons.push("괴롭힘/위협")
          if (categories.sexual) reasons.push("성적 내용")
          if (categories.violence) reasons.push("폭력적 내용")
          if (categories["self-harm"]) reasons.push("자해 관련")
        }
      } catch (openaiError) {
        console.warn("OpenAI Moderation API 호출 실패:", openaiError)
        // OpenAI 실패 시에도 한국어 필터링은 유지
      }
    }

    // 3. 공포 콘텐츠 특별 규칙 (무서핑 전용)
    if (type === 'creature') {
      // 과도한 잔혹성 체크
      const extremeViolence = [
        '살인', '죽이', '고문', '절단', '시체', '시신', '강간', '성폭행'
      ]
      
      const hasExtremeContent = extremeViolence.some(word => 
        text.toLowerCase().includes(word)
      )
      
      if (hasExtremeContent) {
        reasons.push("과도한 잔혹성 - AdSense 정책 위반 가능")
        isApproved = false
        confidence = Math.min(confidence, 0.7)
      }

      // 청소년 유해 요소 체크
      const harmfulToMinors = [
        '자살', '약물', '마약', '도박', '성인', '19금'
      ]
      
      const hasHarmfulContent = harmfulToMinors.some(word => 
        text.toLowerCase().includes(word)
      )
      
      if (hasHarmfulContent) {
        reasons.push("청소년 유해 가능성")
        confidence = Math.min(confidence, 0.8)
      }
    }

    // 4. 스팸/도배 검사
    const spamPatterns = [
      /(.)\1{5,}/, // 같은 글자 6번 이상 반복
      /(http|www\.)/gi, // URL 패턴
      /\d{2,3}-\d{3,4}-\d{4}/, // 전화번호 패턴
    ]
    
    if (spamPatterns.some(pattern => pattern.test(text))) {
      reasons.push("스팸/도배 의심")
      confidence = Math.min(confidence, 0.6)
    }

    return {
      isApproved: isApproved && reasons.length === 0,
      confidence,
      reasons,
      filteredText,
      moderationId: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

  } catch (error) {
    console.error("콘텐츠 검열 중 오류:", error)
    
    // 오류 발생 시 보수적으로 차단
    return {
      isApproved: false,
      confidence: 0.5,
      reasons: ["검열 시스템 오류 - 관리자 검토 필요"],
      filteredText: text,
      moderationId: `mod_error_${Date.now()}`
    }
  }
}

// POST: 콘텐츠 검열 요청
export async function POST(request: NextRequest) {
  try {
    const { text, type, reportReason }: ModerationRequest = await request.json()

    if (!text || !type) {
      return NextResponse.json(
        { error: "텍스트와 타입은 필수입니다" }, 
        { status: 400 }
      )
    }

    // 콘텐츠 검열 실행
    const result = await moderateContent(text, type)

    // 검열 결과를 데이터베이스에 로그 저장 (선택사항)
    const supabase = createServerClient()
    
    try {
      const { error: logError } = await supabase
        .from('moderation_logs')
        .insert({
          content_text: text,
          content_type: type,
          is_approved: result.isApproved,
          confidence: result.confidence,
          reasons: result.reasons,
          moderation_id: result.moderationId,
          created_at: new Date().toISOString()
        })
      
      if (logError) {
        console.warn("검열 로그 저장 실패:", logError)
        // 로그 실패해도 검열 결과는 반환
      }
    } catch (dbError) {
      console.warn("데이터베이스 연결 실패:", dbError)
      // DB 오류는 무시하고 검열 결과만 반환
    }

    return NextResponse.json({
      success: true,
      moderation: result
    })

  } catch (error: any) {
    console.error("POST /api/moderation 오류:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" }, 
      { status: 500 }
    )
  }
}

// GET: 검열 통계 및 관리자용 정보
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'stats'

    if (action === 'stats') {
      const supabase = createServerClient()
      
      try {
        // 최근 24시간 검열 통계
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)

        const { data: stats, error } = await supabase
          .from('moderation_logs')
          .select('is_approved, content_type, reasons')
          .gte('created_at', yesterday.toISOString())

        if (error) {
          throw error
        }

        const totalChecked = stats?.length || 0
        const approved = stats?.filter(s => s.is_approved).length || 0
        const rejected = totalChecked - approved

        const topReasons = stats
          ?.filter(s => !s.is_approved && s.reasons.length > 0)
          .flatMap(s => s.reasons)
          .reduce((acc: any, reason: string) => {
            acc[reason] = (acc[reason] || 0) + 1
            return acc
          }, {})

        return NextResponse.json({
          success: true,
          stats: {
            totalChecked,
            approved,
            rejected,
            approvalRate: totalChecked > 0 ? (approved / totalChecked * 100).toFixed(1) : 0,
            topReasons: Object.entries(topReasons || {})
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .slice(0, 5)
          }
        })

      } catch (dbError) {
        // DB 오류 시 기본 응답
        return NextResponse.json({
          success: true,
          stats: {
            totalChecked: 0,
            approved: 0,
            rejected: 0,
            approvalRate: 0,
            topReasons: []
          },
          note: "데이터베이스 연결 없음 - 실시간 통계 불가"
        })
      }
    }

    return NextResponse.json(
      { error: "지원하지 않는 액션입니다" }, 
      { status: 400 }
    )

  } catch (error: any) {
    console.error("GET /api/moderation 오류:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" }, 
      { status: 500 }
    )
  }
}