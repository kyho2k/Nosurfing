import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { createAdminClient } from "@/lib/supabase-admin"

// POST: 게시물 좋아요 추가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const adminSupabase = createAdminClient()
    const { id: creatureId } = await params
    
    // 사용자 인증 및 세션 ID 관리
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // 세션 ID를 헤더에서 가져오기 (클라이언트에서 localStorage 값 전송)
    const clientSessionId = request.headers.get('x-session-id')
    const userSessionId = user?.id || clientSessionId || crypto.randomUUID()

    console.log(`[LIKE POST] 게시물 ${creatureId} 좋아요 추가 요청, 세션: ${userSessionId}`)

    // 게시물 존재 확인 및 현재 좋아요 수 가져오기
    const { data: creature, error: creatureError } = await supabase
      .from('creatures')
      .select('id, like_count')
      .eq('id', creatureId)
      .single()

    if (creatureError || !creature) {
      console.error(`[LIKE POST] 게시물 ${creatureId} 찾을 수 없음:`, creatureError)
      return NextResponse.json(
        { error: "게시물을 찾을 수 없습니다." },
        { status: 404 }
      )
    }

    // 관리자 권한으로 like_count 직접 업데이트 (서비스 키 없을 때는 일반 클라이언트 사용)
    const newLikeCount = (creature.like_count || 0) + 1
    
    // 먼저 관리자 클라이언트로 시도, 실패하면 일반 클라이언트 사용
    let updateResult, updateError;
    
    try {
      const adminResult = await adminSupabase
        .from('creatures')
        .update({ like_count: newLikeCount })
        .eq('id', creatureId)
        .select('like_count')
        .single()
      
      updateResult = adminResult.data
      updateError = adminResult.error
    } catch (adminError) {
      console.log(`[LIKE POST] 관리자 클라이언트 실패, 일반 클라이언트로 재시도:`, adminError)
      
      // 일반 클라이언트로 재시도
      const regularResult = await supabase
        .from('creatures')
        .update({ like_count: newLikeCount })
        .eq('id', creatureId)
        .select('like_count')
        .single()
      
      updateResult = regularResult.data
      updateError = regularResult.error
    }

    if (updateError) {
      console.error(`[LIKE POST] 게시물 ${creatureId} like_count 업데이트 실패:`, updateError)
      return NextResponse.json(
        { error: "좋아요 추가에 실패했습니다." },
        { status: 500 }
      )
    }

    console.log(`[LIKE POST] 게시물 ${creatureId} 좋아요 성공: ${updateResult.like_count}`)

    return NextResponse.json({
      success: true,
      like_count: updateResult.like_count,
      message: "좋아요가 추가되었습니다."
    })

  } catch (error: any) {
    console.error("POST /api/creatures/[id]/like 오류:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}

// DELETE: 게시물 좋아요 취소
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const adminSupabase = createAdminClient()
    const { id: creatureId } = await params
    
    // 사용자 인증 및 세션 ID 관리
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // 세션 ID를 헤더에서 가져오기
    const clientSessionId = request.headers.get('x-session-id')
    const userSessionId = user?.id || clientSessionId || crypto.randomUUID()

    console.log(`[LIKE DELETE] 게시물 ${creatureId} 좋아요 취소 요청, 세션: ${userSessionId}`)

    // 게시물 존재 확인 및 현재 좋아요 수 가져오기
    const { data: creature, error: creatureError } = await supabase
      .from('creatures')
      .select('id, like_count')
      .eq('id', creatureId)
      .single()

    if (creatureError || !creature) {
      console.error(`[LIKE DELETE] 게시물 ${creatureId} 찾을 수 없음:`, creatureError)
      return NextResponse.json(
        { error: "게시물을 찾을 수 없습니다." },
        { status: 404 }
      )
    }

    // 관리자 권한으로 like_count 직접 감소 (0 이하로는 안 됨, 서비스 키 없을 때는 일반 클라이언트 사용)
    const newLikeCount = Math.max((creature.like_count || 0) - 1, 0)
    
    // 먼저 관리자 클라이언트로 시도, 실패하면 일반 클라이언트 사용
    let updateResult, updateError;
    
    try {
      const adminResult = await adminSupabase
        .from('creatures')
        .update({ like_count: newLikeCount })
        .eq('id', creatureId)
        .select('like_count')
        .single()
      
      updateResult = adminResult.data
      updateError = adminResult.error
    } catch (adminError) {
      console.log(`[LIKE DELETE] 관리자 클라이언트 실패, 일반 클라이언트로 재시도:`, adminError)
      
      // 일반 클라이언트로 재시도
      const regularResult = await supabase
        .from('creatures')
        .update({ like_count: newLikeCount })
        .eq('id', creatureId)
        .select('like_count')
        .single()
      
      updateResult = regularResult.data
      updateError = regularResult.error
    }

    if (updateError) {
      console.error(`[LIKE DELETE] 게시물 ${creatureId} like_count 업데이트 실패:`, updateError)
      return NextResponse.json(
        { error: "좋아요 취소에 실패했습니다." },
        { status: 500 }
      )
    }

    console.log(`[LIKE DELETE] 게시물 ${creatureId} 좋아요 취소 성공: ${updateResult.like_count}`)

    return NextResponse.json({
      success: true,
      like_count: updateResult.like_count,
      message: "좋아요가 취소되었습니다."
    })

  } catch (error: any) {
    console.error("DELETE /api/creatures/[id]/like 오류:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}

// GET: 게시물 좋아요 상태 확인 (임시로 항상 false 반환)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: creatureId } = await params
    
    // 세션 ID를 헤더에서 가져오기
    const clientSessionId = request.headers.get('x-session-id')
    
    // 임시로 세션이 있으면 좋아요 하지 않은 상태로 반환
    // 실제로는 creature_likes 테이블을 조회해야 함
    return NextResponse.json({
      is_liked: false
    })

  } catch (error: any) {
    console.error("GET /api/creatures/[id]/like 오류:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}

// IP 해시 생성 함수 (개인정보 보호)
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(ip + process.env.IP_SALT || 'nosurfing-salt')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}