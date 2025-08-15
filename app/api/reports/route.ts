import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

interface ReportRequest {
  contentId: string
  contentType: 'creature' | 'comment'
  reason: 'spam' | 'inappropriate' | 'violence' | 'harassment' | 'other'
  description?: string
  reporterSession?: string
}

interface ReportResponse {
  success: boolean
  reportId?: string
  message: string
}

// POST: 콘텐츠 신고 (익명 사용자용 간소화 버전)
export async function POST(request: NextRequest) {
  try {
    const { contentId, contentType, reason, description }: ReportRequest = await request.json()

    if (!contentId || !contentType || !reason) {
      return NextResponse.json(
        { 
          success: false, 
          message: "필수 정보가 누락되었습니다" 
        } as ReportResponse, 
        { status: 400 }
      )
    }

    // 익명 사용자를 위한 간소화된 신고 처리
    // 실제 데이터 저장 없이 응답만 처리 (개발 단계)
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return NextResponse.json({
      success: true,
      reportId,
      message: "신고가 접수되었습니다. 검토 후 조치하겠습니다.",
      isAnonymous: true,
      contentId,
      reason,
      timestamp: new Date().toISOString(),
      note: "익명 사용자 신고 - 간소화된 처리"
    } as ReportResponse)

  } catch (error: any) {
    console.error("POST /api/reports 오류:", error)
    return NextResponse.json(
      { 
        success: false, 
        message: "서버 오류가 발생했습니다" 
      } as ReportResponse, 
      { status: 500 }
    )
  }
}

// 신고 누적 시 자동 조치 함수
async function checkAndAutoModerate(contentId: string, contentType: string, supabase: any) {
  try {
    // 해당 콘텐츠의 총 신고 수 조회
    const { data: reports, error } = await supabase
      .from('content_reports')
      .select('id, reason')
      .eq('content_id', contentId)
      .eq('status', 'pending')

    if (error || !reports) {
      console.warn("신고 수 조회 실패:", error)
      return
    }

    const reportCount = reports.length
    
    // 신고 임계값 설정
    const AUTO_HIDE_THRESHOLD = 3  // 3번 신고 시 자동 숨김
    const AUTO_BLOCK_THRESHOLD = 5 // 5번 신고 시 자동 차단

    if (reportCount >= AUTO_BLOCK_THRESHOLD) {
      // 자동 차단 조치
      await updateContentStatus(contentId, contentType, 'blocked', supabase)
      console.log(`콘텐츠 ${contentId} 자동 차단됨 (신고 ${reportCount}회)`)
      
    } else if (reportCount >= AUTO_HIDE_THRESHOLD) {
      // 자동 숨김 조치
      await updateContentStatus(contentId, contentType, 'hidden', supabase)
      console.log(`콘텐츠 ${contentId} 자동 숨김됨 (신고 ${reportCount}회)`)
    }

  } catch (error) {
    console.error("자동 검열 처리 실패:", error)
  }
}

// 콘텐츠 상태 업데이트 함수
async function updateContentStatus(contentId: string, contentType: string, status: string, supabase: any) {
  try {
    if (contentType === 'creature') {
      await supabase
        .from('creatures')
        .update({ 
          moderation_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', contentId)
    }
    // 추후 댓글 등 다른 콘텐츠 타입 추가 가능
    
  } catch (error) {
    console.error("콘텐츠 상태 업데이트 실패:", error)
  }
}

// GET: 신고 통계 및 관리자 정보 (익명 사용자용 간소화 버전)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'stats'

    if (action === 'stats') {
      // 모의 신고 통계 (개발 단계)
      const mockStats = {
        total: 0,
        pending: 0,
        resolved: 0,
        byReason: {},
        byType: {},
        isAnonymous: true,
        note: "익명 사용자 - 모의 통계 데이터"
      }

      return NextResponse.json({
        success: true,
        stats: mockStats
      })
    }

    if (action === 'recent') {
      // 모의 최근 신고 목록
      return NextResponse.json({
        success: true,
        reports: [],
        isAnonymous: true,
        note: "익명 사용자 - 모의 신고 목록"
      })
    }

    return NextResponse.json(
      { error: "지원하지 않는 액션입니다" }, 
      { status: 400 }
    )

  } catch (error: any) {
    console.error("GET /api/reports 오류:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" }, 
      { status: 500 }
    )
  }
}