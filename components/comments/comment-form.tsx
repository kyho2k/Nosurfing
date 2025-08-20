"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { MessageCircle, Send, Loader2 } from "lucide-react"

interface CommentFormProps {
  creatureId: string
  parentCommentId?: string
  onCommentAdded: (comment: any) => void
  onCancel?: () => void
  placeholder?: string
  buttonText?: string
}

export function CommentForm({
  creatureId,
  parentCommentId,
  onCommentAdded,
  onCancel,
  placeholder = "무서운 이야기에 대한 생각을 공유해주세요...",
  buttonText = "댓글 작성"
}: CommentFormProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      toast.error("댓글 내용을 입력해주세요")
      return
    }

    if (content.length > 1000) {
      toast.error("댓글은 1000자 이하로 작성해주세요")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creature_id: creatureId,
          content: content.trim(),
          parent_comment_id: parentCommentId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '댓글 작성에 실패했습니다')
      }

      // 성공시 폼 초기화 및 콜백 호출
      setContent("")
      onCommentAdded(data.comment)
      toast.success("댓글이 작성되었습니다")
      
      // 대댓글 폼인 경우 취소
      if (onCancel) {
        onCancel()
      }
    } catch (error: any) {
      console.error('댓글 작성 오류:', error)
      toast.error(error.message || '댓글 작성에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          className="min-h-[100px] pr-16 resize-none bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-purple-500"
          maxLength={1000}
          disabled={isSubmitting}
        />
        <div className="absolute bottom-2 right-2 text-xs text-slate-400">
          {content.length}/1000
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <MessageCircle className="w-4 h-4" />
          <span>익명으로 댓글이 작성됩니다</span>
        </div>
        
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              취소
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || isSubmitting}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                작성 중...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {buttonText}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}