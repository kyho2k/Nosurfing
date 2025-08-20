import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

// PUT: 댓글 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const commentId = params.id
    
    // 사용자 인증
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    const body = await request.json()
    const { content } = body

    // 입력값 검증
    if (!content || content.length < 1 || content.length > 1000) {
      return NextResponse.json(
        { error: "댓글은 1자 이상 1000자 이하로 작성해주세요." },
        { status: 400 }
      )
    }

    // 기존 댓글 조회 및 권한 확인
    const { data: existingComment, error: fetchError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .single()

    if (fetchError || !existingComment) {
      return NextResponse.json(
        { error: "댓글을 찾을 수 없습니다." },
        { status: 404 }
      )
    }

    // 작성자 권한 확인
    const currentUserId = user?.id || 'anonymous'
    if (existingComment.author_session_id !== currentUserId) {
      return NextResponse.json(
        { error: "댓글을 수정할 권한이 없습니다." },
        { status: 403 }
      )
    }

    // 5분 이내 수정 제한 확인
    const createdAt = new Date(existingComment.created_at)
    const now = new Date()
    const timeDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60) // 분 단위

    if (timeDiff > 5) {
      return NextResponse.json(
        { error: "댓글은 작성 후 5분 이내에만 수정할 수 있습니다." },
        { status: 403 }
      )
    }

    // 댓글 수정
    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
        is_edited: true
      })
      .eq('id', commentId)
      .select()
      .single()

    if (updateError) {
      console.error("댓글 수정 오류:", updateError)
      return NextResponse.json(
        { error: "댓글 수정에 실패했습니다." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      comment: updatedComment,
      message: "댓글이 수정되었습니다."
    })

  } catch (error: any) {
    console.error("PUT /api/comments/[id] 오류:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}

// DELETE: 댓글 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const commentId = params.id
    
    // 사용자 인증
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    // 기존 댓글 조회 및 권한 확인
    const { data: existingComment, error: fetchError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .single()

    if (fetchError || !existingComment) {
      return NextResponse.json(
        { error: "댓글을 찾을 수 없습니다." },
        { status: 404 }
      )
    }

    // 작성자 권한 확인
    const currentUserId = user?.id || 'anonymous'
    if (existingComment.author_session_id !== currentUserId) {
      return NextResponse.json(
        { error: "댓글을 삭제할 권한이 없습니다." },
        { status: 403 }
      )
    }

    // 5분 이내 삭제 제한 확인
    const createdAt = new Date(existingComment.created_at)
    const now = new Date()
    const timeDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60) // 분 단위

    if (timeDiff > 5) {
      return NextResponse.json(
        { error: "댓글은 작성 후 5분 이내에만 삭제할 수 있습니다." },
        { status: 403 }
      )
    }

    // 대댓글이 있는지 확인
    const { data: replies, error: repliesError } = await supabase
      .from('comments')
      .select('id')
      .eq('parent_comment_id', commentId)

    if (repliesError) {
      console.error("대댓글 조회 오류:", repliesError)
      return NextResponse.json(
        { error: "댓글 삭제 중 오류가 발생했습니다." },
        { status: 500 }
      )
    }

    // 대댓글이 있는 경우 내용만 삭제 (구조 유지)
    if (replies && replies.length > 0) {
      const { error: updateError } = await supabase
        .from('comments')
        .update({
          content: '삭제된 댓글입니다.',
          moderation_status: 'hidden',
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)

      if (updateError) {
        console.error("댓글 숨김 처리 오류:", updateError)
        return NextResponse.json(
          { error: "댓글 삭제에 실패했습니다." },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: "댓글이 삭제되었습니다. (대댓글 보호)"
      })
    }

    // 대댓글이 없는 경우 완전 삭제
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (deleteError) {
      console.error("댓글 삭제 오류:", deleteError)
      return NextResponse.json(
        { error: "댓글 삭제에 실패했습니다." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "댓글이 삭제되었습니다."
    })

  } catch (error: any) {
    console.error("DELETE /api/comments/[id] 오류:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}