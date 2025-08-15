import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    // 익명 사용자를 위한 간소화된 제한 정보
    // 실제 사용량 추적은 클라이언트 세션/쿠키 기반으로 처리
    const dailyLimit = 3;
    const today = new Date().toISOString().split('T')[0];
    
    return NextResponse.json({
      dailyLimit,
      usedCount: 0, // 세션 기반으로 클라이언트에서 관리
      remainingCount: dailyLimit,
      canGenerate: true,
      resetTime: `${today}T24:00:00.000Z`,
      isAnonymous: true,
      note: "익명 사용자 - 세션 기반 제한"
    });

  } catch (error: any) {
    console.error("AI 제한 확인 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestType } = body; // 'story' 또는 'image' 또는 'both'
    
    // 익명 사용자를 위한 간소화된 응답
    // 실제 제한은 클라이언트 측에서 세션 스토리지로 관리
    const dailyLimit = 3;
    
    return NextResponse.json({
      success: true,
      dailyLimit,
      usedCount: 1, // 클라이언트에서 증가 처리 필요
      remainingCount: dailyLimit - 1,
      canGenerate: true,
      isAnonymous: true,
      requestType: requestType || 'unknown',
      timestamp: new Date().toISOString(),
      note: "익명 사용자 - 클라이언트 세션 기반 제한"
    });

  } catch (error: any) {
    console.error("AI 제한 기록 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}