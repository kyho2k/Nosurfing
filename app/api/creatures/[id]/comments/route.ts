import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

// GET: 특정 게시물의 댓글 목록 조회 (중첩 라우트 버전)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const creatureId = id
    const { searchParams } = new URL(request.url)
    const includeReplies = searchParams.get('include_replies') === 'true'

    if (!creatureId) {
      return NextResponse.json(
        { error: "creature_id가 필요합니다." },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // 먼저 게시물이 존재하는지 확인
    const { data: creature, error: creatureError } = await supabase
      .from('creatures')
      .select('id')
      .eq('id', creatureId)
      .single()

    if (creatureError || !creature) {
      return NextResponse.json(
        { error: "게시물을 찾을 수 없습니다." },
        { status: 404 }
      )
    }

    // 댓글 조회 (기본적으로는 댓글 시스템이 구축될 때까지 빈 배열 반환)
    try {
      let query = supabase
        .from('comments')
        .select(`
          id,
          creature_id,
          author_session_id,
          author_nickname,
          content,
          parent_comment_id,
          like_count,
          moderation_status,
          is_edited,
          created_at,
          updated_at
        `)
        .eq('creature_id', creatureId)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: true })

      // 대댓글 포함 여부
      if (!includeReplies) {
        query = query.is('parent_comment_id', null)
      }

      const { data: comments, error } = await query

      if (error) {
        console.error("댓글 조회 오류:", error)
        // 댓글 테이블이 없는 경우 빈 배열 반환
        if (error.message.includes('relation "public.comments" does not exist')) {
          return NextResponse.json({
            success: true,
            comments: [],
            total: 0,
            message: "댓글 시스템이 아직 설정되지 않았습니다."
          })
        }
        throw error
      }

      // 계층 구조로 정리 (대댓글 포함시)
      if (includeReplies) {
        const organizedComments = organizeComments(comments || [])
        return NextResponse.json({
          success: true,
          comments: organizedComments,
          total: comments?.length || 0
        })
      }

      return NextResponse.json({
        success: true,
        comments: comments || [],
        total: comments?.length || 0
      })

    } catch (commentError: any) {
      console.error("댓글 시스템 오류:", commentError)
      // 댓글 테이블이 없는 경우에도 정상적으로 빈 배열 반환
      return NextResponse.json({
        success: true,
        comments: [],
        total: 0,
        message: "댓글 시스템이 아직 설정되지 않았습니다."
      })
    }

  } catch (error: any) {
    console.error("GET /api/creatures/[id]/comments 오류:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}

// 댓글을 계층 구조로 정리하는 함수
function organizeComments(comments: any[]) {
  const commentMap = new Map()
  const rootComments: any[] = []

  // 모든 댓글을 맵에 저장
  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] })
  })

  // 계층 구조 생성
  comments.forEach(comment => {
    const commentWithReplies = commentMap.get(comment.id)
    
    if (comment.parent_comment_id) {
      // 대댓글인 경우
      const parentComment = commentMap.get(comment.parent_comment_id)
      if (parentComment) {
        parentComment.replies.push(commentWithReplies)
      }
    } else {
      // 최상위 댓글인 경우
      rootComments.push(commentWithReplies)
    }
  })

  return rootComments
}