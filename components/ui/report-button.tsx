"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Flag, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReportButtonProps {
  contentId: string
  contentType: 'creature' | 'comment'
  size?: 'sm' | 'default'
  variant?: 'ghost' | 'outline' | 'secondary'
}

const reportReasons = [
  { value: 'spam', label: '스팸/도배' },
  { value: 'inappropriate', label: '부적절한 내용' },
  { value: 'violence', label: '과도한 폭력/잔혹성' },
  { value: 'harassment', label: '괴롭힘/위협' },
  { value: 'other', label: '기타' }
]

export function ReportButton({ 
  contentId, 
  contentType, 
  size = 'sm', 
  variant = 'ghost' 
}: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedReason, setSelectedReason] = useState<string>("")
  const [description, setDescription] = useState("")
  const { toast } = useToast()

  const handleReport = async () => {
    if (!selectedReason) {
      toast({
        title: "신고 사유 필요",
        description: "신고 사유를 선택해주세요",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId,
          contentType,
          reason: selectedReason,
          description: description.trim() || undefined
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || '신고 처리 중 오류가 발생했습니다')
      }

      toast({
        title: "신고 완료",
        description: result.message,
      })

      // 폼 초기화 및 다이얼로그 닫기
      setSelectedReason("")
      setDescription("")
      setIsOpen(false)

    } catch (error: any) {
      console.error('신고 오류:', error)
      toast({
        title: "신고 실패",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className="text-gray-400 hover:text-red-400 hover:bg-red-400/10"
        >
          <Flag className="w-3 h-3 mr-1" />
          신고
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
            콘텐츠 신고
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            부적절한 콘텐츠를 발견하셨나요? 신고 사유를 선택해주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-white">
              신고 사유 <span className="text-red-400">*</span>
            </Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="신고 사유를 선택하세요" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {reportReasons.map(reason => (
                  <SelectItem 
                    key={reason.value} 
                    value={reason.value}
                    className="text-white hover:bg-slate-600"
                  >
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">
              추가 설명 (선택사항)
            </Label>
            <Textarea
              id="description"
              placeholder="신고 내용에 대한 자세한 설명을 입력해주세요..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 resize-none"
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-gray-400 text-right">
              {description.length}/500
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
              className="border-slate-600 text-gray-300 hover:bg-slate-700"
            >
              취소
            </Button>
            <Button
              onClick={handleReport}
              disabled={isSubmitting || !selectedReason}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? '신고 중...' : '신고하기'}
            </Button>
          </div>
        </div>

        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-yellow-200">
              <p className="font-medium mb-1">신고 안내사항</p>
              <ul className="space-y-1 list-disc list-inside pl-2">
                <li>허위 신고는 제재 대상입니다</li>
                <li>동일 콘텐츠는 한 번만 신고 가능합니다</li>
                <li>신고된 콘텐츠는 관리자가 검토합니다</li>
                <li>3회 이상 신고 시 자동으로 숨김 처리됩니다</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}