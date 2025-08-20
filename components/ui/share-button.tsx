"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Copy, Check } from "lucide-react"
import { toast } from "sonner"

interface ShareButtonProps {
  url: string
  title: string
  text?: string
  className?: string
}

export function ShareButton({ url, title, text, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    // Web Share API 지원 확인 (모바일)
    if (navigator.share && navigator.canShare) {
      try {
        await navigator.share({
          title,
          text: text || title,
          url
        })
        toast.success("공유 완료!")
      } catch (error) {
        // 사용자가 공유를 취소한 경우
        if ((error as Error).name !== 'AbortError') {
          toast.error("공유에 실패했습니다")
          fallbackCopy()
        }
      }
    } else {
      // Web Share API 미지원 시 URL 복사
      fallbackCopy()
    }
  }

  const fallbackCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("링크가 복사되었습니다!")
      
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (error) {
      toast.error("복사에 실패했습니다")
    }
  }

  return (
    <Button
      onClick={handleShare}
      variant="outline"
      size="sm"
      className={`gap-2 ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-500" />
          복사됨
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          공유
        </>
      )}
    </Button>
  )
}