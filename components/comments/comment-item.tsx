"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Heart, MessageCircle, Edit3, Trash2, MoreHorizontal, Flag } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { CommentForm } from "./comment-form"
import { getSessionHeaders } from "@/lib/session-utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  replies?: Comment[]
}

interface CommentItemProps {
  comment: Comment
  onCommentUpdate: (commentId: string, updatedComment: any) => void
  onCommentDelete: (commentId: string) => void
  onReplyAdded: (parentId: string, newComment: any) => void
  currentUserId?: string
  depth?: number
}

export function CommentItem({
  comment,
  onCommentUpdate,
  onCommentDelete,
  onReplyAdded,
  currentUserId,
  depth = 0
}: CommentItemProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(comment.like_count)
  const [isLiking, setIsLiking] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [likeStatusLoaded, setLikeStatusLoaded] = useState(false)

  const isAuthor = currentUserId === comment.author_session_id
  const isEditable = isAuthor && getMinutesAgo() <= 5
  const isHidden = comment.moderation_status === 'hidden'
  const maxDepth = 2 // 최대 2단계까지만 대댓글 허용

  // 작성 시간 계산
  function getMinutesAgo() {
    const now = new Date()
    const created = new Date(comment.created_at)
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60))
  }

  // 컴포넌트 마운트 시 좋아요 상태 확인
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (typeof window === 'undefined' || likeStatusLoaded) return;
      
      try {
        const response = await fetch(`/api/comments/${comment.id}/like`, {
          method: 'GET',
          headers: getSessionHeaders()
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsLiked(data.is_liked || false);
        }
      } catch (error) {
        console.warn('좋아요 상태 확인 실패:', error);
      } finally {
        setLikeStatusLoaded(true);
      }
    };

    // 컴포넌트 마운트 후 잠시 후 실행
    const timer = setTimeout(checkLikeStatus, 500);
    return () => clearTimeout(timer);
  }, [comment.id, likeStatusLoaded]);

  // 좋아요 토글
  const handleLike = async () => {
    if (isLiking) return

    setIsLiking(true)
    try {
      // 첫 클릭은 항상 좋아요 추가, 이후 클릭은 토글
      const method = isLiked ? 'DELETE' : 'POST'
      
      const response = await fetch(`/api/comments/${comment.id}/like`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getSessionHeaders()
        }
      })

      const data = await response.json()

      if (!response.ok) {
        // 좋아요가 없는 상태에서 DELETE 시도 시 POST로 재시도
        if (method === 'DELETE' && data.error?.includes('좋아요를 누르지 않은')) {
          console.log('좋아요 상태 불일치 감지, POST로 재시도합니다')
          const retryResponse = await fetch(`/api/comments/${comment.id}/like`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getSessionHeaders()
            }
          })
          
          if (retryResponse.ok) {
            setIsLiked(true)
            setLikeCount(prev => prev + 1)
            return
          }
        }
        throw new Error(data.error || '좋아요 처리에 실패했습니다')
      }

      setIsLiked(!isLiked)
      setLikeCount(data.like_count)
      toast.success(data.message)

    } catch (error: any) {
      console.error('좋아요 오류:', error)
      toast.error(error.message || '좋아요 처리에 실패했습니다')
    } finally {
      setIsLiking(false)
    }
  }

  // 댓글 수정
  const handleEdit = async (newContent: string) => {
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newContent })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '댓글 수정에 실패했습니다')
      }

      onCommentUpdate(comment.id, data.comment)
      setShowEditForm(false)
      toast.success('댓글이 수정되었습니다')

    } catch (error: any) {
      console.error('댓글 수정 오류:', error)
      toast.error(error.message || '댓글 수정에 실패했습니다')
    }
  }

  // 댓글 삭제
  const handleDelete = async () => {
    if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '댓글 삭제에 실패했습니다')
      }

      onCommentDelete(comment.id)
      toast.success('댓글이 삭제되었습니다')

    } catch (error: any) {
      console.error('댓글 삭제 오류:', error)
      toast.error(error.message || '댓글 삭제에 실패했습니다')
    } finally {
      setIsDeleting(false)
    }
  }

  // 신고 기능
  const handleReport = async () => {
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_type: 'comment',
          content_id: comment.id,
          reason: 'inappropriate_content'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '신고 처리에 실패했습니다')
      }

      toast.success('신고가 접수되었습니다')

    } catch (error: any) {
      console.error('신고 오류:', error)
      toast.error(error.message || '신고 처리에 실패했습니다')
    }
  }

  if (isHidden) {
    return (
      <div className="py-4 text-sm text-slate-500 italic border-l-2 border-slate-700 pl-4">
        삭제된 댓글입니다.
      </div>
    )
  }

  return (
    <div className={`py-4 ${depth > 0 ? 'ml-8 border-l-2 border-slate-700 pl-4' : ''}`}>
      <div className="space-y-3">
        {/* 작성자 정보 및 시간 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-purple-400">
              {comment.author_nickname}
            </span>
            {comment.is_edited && (
              <span className="text-xs text-slate-500">(수정됨)</span>
            )}
            <span className="text-xs text-slate-500">
              {formatDistanceToNow(new Date(comment.created_at), { 
                addSuffix: true, 
                locale: ko 
              })}
            </span>
          </div>

          {/* 더보기 메뉴 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
              {isEditable && (
                <>
                  <DropdownMenuItem 
                    onClick={() => setShowEditForm(true)}
                    className="text-slate-300 hover:bg-slate-700"
                  >
                    <Edit3 className="mr-2 h-4 w-4" />
                    수정
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-red-400 hover:bg-slate-700"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    삭제
                  </DropdownMenuItem>
                </>
              )}
              {!isAuthor && (
                <DropdownMenuItem 
                  onClick={handleReport}
                  className="text-orange-400 hover:bg-slate-700"
                >
                  <Flag className="mr-2 h-4 w-4" />
                  신고
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 댓글 내용 */}
        {showEditForm ? (
          <CommentForm
            creatureId={comment.creature_id}
            onCommentAdded={(updatedComment) => handleEdit(updatedComment.content)}
            onCancel={() => setShowEditForm(false)}
            placeholder="댓글을 수정해주세요..."
            buttonText="수정 완료"
          />
        ) : (
          <div className="text-slate-200 whitespace-pre-wrap break-words">
            {comment.content}
          </div>
        )}

        {/* 좋아요 및 답글 버튼 */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={isLiking}
            className={`h-8 gap-1 ${
              isLiked 
                ? 'text-red-400 hover:text-red-300' 
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            <span>{likeCount}</span>
          </Button>

          {depth < maxDepth && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="h-8 gap-1 text-slate-400 hover:text-slate-300"
            >
              <MessageCircle className="h-4 w-4" />
              답글
            </Button>
          )}
        </div>

        {/* 대댓글 작성 폼 */}
        {showReplyForm && (
          <div className="mt-4">
            <CommentForm
              creatureId={comment.creature_id}
              parentCommentId={comment.id}
              onCommentAdded={(newReply) => {
                onReplyAdded(comment.id, newReply)
                setShowReplyForm(false)
              }}
              onCancel={() => setShowReplyForm(false)}
              placeholder="답글을 작성해주세요..."
              buttonText="답글 작성"
            />
          </div>
        )}

        {/* 대댓글들 */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-2">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onCommentUpdate={onCommentUpdate}
                onCommentDelete={onCommentDelete}
                onReplyAdded={onReplyAdded}
                currentUserId={currentUserId}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}