"use client"

import { useState, useEffect, useCallback } from "react"
import { CommentItem } from "./comment-item"
import { CommentForm } from "./comment-form"
import { Button } from "@/components/ui/button"
import { RefreshCw, MessageCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

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

interface CommentListProps {
  creatureId: string
  currentUserId?: string
}

export function CommentList({ creatureId, currentUserId }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  // 댓글 목록 로드
  const loadComments = useCallback(async (showLoader = false) => {
    if (showLoader) setRefreshing(true)
    
    try {
      // 먼저 중첩 라우트 시도, 실패하면 기본 라우트 사용
      let response = await fetch(
        `/api/creatures/${creatureId}/comments?include_replies=true`
      )
      
      // 404인 경우 기본 API 경로로 재시도
      if (!response.ok && response.status === 404) {
        response = await fetch(
          `/api/comments?creature_id=${creatureId}&include_replies=true`
        )
      }
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || '댓글을 불러오는데 실패했습니다')
      }
      
      setComments(data.comments || [])
      setError(null)
      
    } catch (error: any) {
      console.error('댓글 로드 오류:', error)
      setError(error.message)
      toast.error(error.message || '댓글을 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
      if (showLoader) setRefreshing(false)
    }
  }, [creatureId])

  // 초기 로드
  useEffect(() => {
    loadComments()
  }, [loadComments])

  // 새 댓글 추가 핸들러
  const handleCommentAdded = (newComment: Comment) => {
    if (newComment.parent_comment_id) {
      // 대댓글인 경우
      handleReplyAdded(newComment.parent_comment_id, newComment)
    } else {
      // 최상위 댓글인 경우
      setComments(prev => [...prev, { ...newComment, replies: [] }])
    }
    setShowForm(false)
  }

  // 댓글 수정 핸들러
  const handleCommentUpdate = (commentId: string, updatedComment: Comment) => {
    const updateCommentInTree = (comments: Comment[]): Comment[] => {
      return comments.map(comment => {
        if (comment.id === commentId) {
          return { ...comment, ...updatedComment }
        }
        if (comment.replies) {
          return {
            ...comment,
            replies: updateCommentInTree(comment.replies)
          }
        }
        return comment
      })
    }
    
    setComments(prev => updateCommentInTree(prev))
  }

  // 댓글 삭제 핸들러
  const handleCommentDelete = (commentId: string) => {
    const deleteCommentFromTree = (comments: Comment[]): Comment[] => {
      return comments
        .map(comment => {
          if (comment.replies) {
            return {
              ...comment,
              replies: deleteCommentFromTree(comment.replies)
            }
          }
          return comment
        })
        .filter(comment => comment.id !== commentId)
    }
    
    setComments(prev => deleteCommentFromTree(prev))
  }

  // 대댓글 추가 핸들러
  const handleReplyAdded = (parentId: string, newReply: Comment) => {
    const addReplyToTree = (comments: Comment[]): Comment[] => {
      return comments.map(comment => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newReply]
          }
        }
        if (comment.replies) {
          return {
            ...comment,
            replies: addReplyToTree(comment.replies)
          }
        }
        return comment
      })
    }
    
    setComments(prev => addReplyToTree(prev))
  }

  // 새로고침
  const handleRefresh = () => {
    loadComments(true)
  }

  if (loading) {
    return (
      <div className="py-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
        <p className="text-slate-400">댓글을 불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <Button 
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          다시 시도
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 댓글 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">
            댓글 ({comments.length})
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-slate-300"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button
            onClick={() => setShowForm(!showForm)}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
          >
            댓글 작성
          </Button>
        </div>
      </div>

      {/* 댓글 작성 폼 */}
      {showForm && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <CommentForm
            creatureId={creatureId}
            onCommentAdded={handleCommentAdded}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* 댓글 목록 */}
      {comments.length === 0 ? (
        <div className="py-12 text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400 mb-2">아직 댓글이 없습니다</p>
          <p className="text-sm text-slate-500">
            이 무서운 이야기에 대한 첫 번째 댓글을 남겨보세요!
          </p>
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              variant="outline"
              size="sm"
              className="mt-4 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              첫 댓글 작성하기
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-1 divide-y divide-slate-700">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onCommentUpdate={handleCommentUpdate}
              onCommentDelete={handleCommentDelete}
              onReplyAdded={handleReplyAdded}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  )
}