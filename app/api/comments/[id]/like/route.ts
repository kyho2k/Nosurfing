import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

// POST: 댓글 좋아요 추가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const { id: commentId } = await params
    
    // 사용자 인증 및 세션 ID 관리
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // 세션 ID를 헤더에서 가져오기 (클라이언트에서 localStorage 값 전송)
    const clientSessionId = request.headers.get('x-session-id')
    const userSessionId = user?.id || clientSessionId || crypto.randomUUID()

    // IP 해시 생성 (중복 방지용)
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown'
    const ipHash = await hashIP(ip)

    // 댓글 존재 확인
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id')
      .eq('id', commentId)
      .eq('moderation_status', 'approved')
      .single()

    if (commentError || !comment) {
      return NextResponse.json(
        { error: "댓글을 찾을 수 없습니다." },
        { status: 404 }
      )
    }

    // 중복 좋아요 확인
    const { data: existingLike, error: existingError } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_session_id', userSessionId)
      .single()

    if (existingLike) {
      return NextResponse.json(
        { error: "이미 좋아요를 누른 댓글입니다." },
        { status: 409 }
      )
    }

    // 좋아요 추가
    const { data: newLike, error: insertError } = await supabase
      .from('comment_likes')
      .insert({
        comment_id: commentId,
        user_session_id: userSessionId,
        ip_hash: ipHash
      })
      .select()
      .single()

    if (insertError) {
      console.error("댓글 좋아요 추가 오류:", insertError)
      return NextResponse.json(
        { error: "좋아요 추가에 실패했습니다." },
        { status: 500 }
      )
    }

    // like_count 수동 업데이트 (트리거가 없으므로)
    const { data: currentComment, error: fetchError } = await supabase
      .from('comments')
      .select('like_count')
      .eq('id', commentId)
      .single()

    if (fetchError) {
      console.error("댓글 조회 오류:", fetchError)
    } else {
      // like_count 증가
      const newLikeCount = (currentComment.like_count || 0) + 1
      const { error: updateError } = await supabase
        .from('comments')
        .update({ like_count: newLikeCount })
        .eq('id', commentId)

      if (updateError) {
        console.error("like_count 업데이트 오류:", updateError)
      }
    }

    // 업데이트된 좋아요 수 조회
    const { data: updatedComment, error: finalFetchError } = await supabase
      .from('comments')
      .select('like_count')
      .eq('id', commentId)
      .single()

    return NextResponse.json({
      success: true,
      like_count: updatedComment?.like_count || 0,
      message: "좋아요가 추가되었습니다."
    })

  } catch (error: any) {
    console.error("POST /api/comments/[id]/like 오류:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}

// DELETE: 댓글 좋아요 취소
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const { id: commentId } = await params
    
    // 사용자 인증 및 세션 ID 관리
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // 세션 ID를 헤더에서 가져오기 (클라이언트에서 localStorage 값 전송)
    const clientSessionId = request.headers.get('x-session-id')
    const userSessionId = user?.id || clientSessionId || crypto.randomUUID()

    // 기존 좋아요 확인
    const { data: existingLike, error: existingError } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_session_id', userSessionId)
      .single()

    if (!existingLike) {
      return NextResponse.json(
        { error: "좋아요를 누르지 않은 댓글입니다." },
        { status: 404 }
      )
    }

    // 좋아요 삭제
    const { error: deleteError } = await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_session_id', userSessionId)

    if (deleteError) {
      console.error("댓글 좋아요 삭제 오류:", deleteError)
      return NextResponse.json(
        { error: "좋아요 취소에 실패했습니다." },
        { status: 500 }
      )
    }

    // like_count 수동 감소 (트리거가 없으므로)
    const { data: currentComment, error: fetchError } = await supabase
      .from('comments')
      .select('like_count')
      .eq('id', commentId)
      .single()

    if (fetchError) {
      console.error("댓글 조회 오류:", fetchError)
    } else {
      // like_count 감소
      const newLikeCount = Math.max((currentComment.like_count || 0) - 1, 0)
      const { error: updateError } = await supabase
        .from('comments')
        .update({ like_count: newLikeCount })
        .eq('id', commentId)

      if (updateError) {
        console.error("like_count 업데이트 오류:", updateError)
      }
    }

    // 업데이트된 좋아요 수 조회
    const { data: updatedComment, error: finalFetchError } = await supabase
      .from('comments')
      .select('like_count')
      .eq('id', commentId)
      .single()

    return NextResponse.json({
      success: true,
      like_count: updatedComment?.like_count || 0,
      message: "좋아요가 취소되었습니다."
    })

  } catch (error: any) {
    console.error("DELETE /api/comments/[id]/like 오류:", error)
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