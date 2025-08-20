import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

// 댓글 타입 정의
interface Comment {
  id: string
  creature_id: string
  author_session_id: string
  author_nickname: string
  content: string
  parent_comment_id?: string
  like_count: number
  moderation_status: string
  is_edited: boolean
  created_at: string
  updated_at: string
}

// GET: 특정 게시물의 댓글 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const creatureId = searchParams.get('creature_id')
    const includeReplies = searchParams.get('include_replies') === 'true'

    if (!creatureId) {
      return NextResponse.json(
        { error: "creature_id가 필요합니다." },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

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
      return NextResponse.json(
        { error: "댓글을 불러오는데 실패했습니다." },
        { status: 500 }
      )
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

  } catch (error: any) {
    console.error("GET /api/comments 오류:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}

// POST: 새 댓글 작성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // 익명 사용자 인증
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    const body = await request.json()
    const { 
      creature_id, 
      content, 
      parent_comment_id,
      author_nickname 
    } = body

    // 입력값 검증
    if (!creature_id || !content) {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      )
    }

    if (content.length < 1 || content.length > 1000) {
      return NextResponse.json(
        { error: "댓글은 1자 이상 1000자 이하로 작성해주세요." },
        { status: 400 }
      )
    }

    // 익명 사용자 세션 ID 생성
    const authorSessionId = user?.id || crypto.randomUUID()

    // 랜덤 닉네임 생성 (제공되지 않은 경우)
    let nickname = author_nickname
    if (!nickname) {
      const { data: nicknameResult } = await supabase
        .rpc('generate_random_nickname')
      nickname = nicknameResult || '익명의 방문자'
    }

    // 부모 댓글 존재 확인 (대댓글인 경우)
    if (parent_comment_id) {
      const { data: parentComment, error: parentError } = await supabase
        .from('comments')
        .select('id')
        .eq('id', parent_comment_id)
        .eq('creature_id', creature_id)
        .single()

      if (parentError || !parentComment) {
        return NextResponse.json(
          { error: "유효하지 않은 상위 댓글입니다." },
          { status: 400 }
        )
      }
    }

    // 댓글 저장
    const commentData = {
      creature_id,
      author_session_id: authorSessionId,
      author_nickname: nickname,
      content: content.trim(),
      parent_comment_id: parent_comment_id || null,
      moderation_status: 'approved' // 기본적으로 승인 (추후 필터링 강화 가능)
    }

    const { data: newComment, error: insertError } = await supabase
      .from('comments')
      .insert(commentData)
      .select()
      .single()

    if (insertError) {
      console.error("댓글 저장 오류:", insertError)
      return NextResponse.json(
        { error: "댓글 작성에 실패했습니다." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      comment: newComment,
      message: "댓글이 작성되었습니다."
    })

  } catch (error: any) {
    console.error("POST /api/comments 오류:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}

// 댓글을 계층 구조로 정리하는 함수
function organizeComments(comments: Comment[]) {
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