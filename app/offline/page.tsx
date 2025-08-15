"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WifiOff, RefreshCw, Ghost } from "lucide-react"
import { useRouter } from "next/navigation"

export default function OfflinePage() {
  const router = useRouter()

  const handleRetry = () => {
    if (navigator.onLine) {
      router.refresh()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="bg-slate-800/90 border-slate-700 shadow-2xl max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-gray-400" />
          </div>
          <CardTitle className="text-2xl text-white flex items-center justify-center">
            <Ghost className="w-6 h-6 mr-2 text-purple-400" />
            오프라인 상태
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-3">
            <p className="text-gray-300">
              인터넷 연결이 끊어진 것 같습니다.
            </p>
            <p className="text-gray-400 text-sm">
              네트워크 연결을 확인하고 다시 시도해주세요.
            </p>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-lg">
            <p className="text-purple-400 text-sm font-medium mb-2">
              💡 오프라인에서도 할 수 있는 것들:
            </p>
            <ul className="text-gray-400 text-sm space-y-1 text-left">
              <li>• 이전에 본 이야기들 다시 읽기</li>
              <li>• 캐시된 페이지 탐색</li>
              <li>• 미니게임 즐기기</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleRetry}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              다시 시도
            </Button>
            
            <Button 
              variant="ghost"
              onClick={() => router.push('/feed')}
              className="w-full text-gray-400 hover:text-white hover:bg-slate-700"
            >
              캐시된 피드 보기
            </Button>
          </div>

          <div className="text-xs text-gray-500 mt-6">
            연결이 복구되면 자동으로 최신 콘텐츠를 불러옵니다.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}