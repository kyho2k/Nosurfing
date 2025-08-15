"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, X, Smartphone } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Service Worker 등록
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          })
          
          console.log('[PWA] Service Worker registered successfully:', registration.scope)
          
          // 업데이트 체크
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] New version available')
                  // 사용자에게 새 버전 알림 표시 (선택사항)
                }
              })
            }
          })
          
        } catch (error) {
          console.error('[PWA] Service Worker registration failed:', error)
        }
      })
    }

    // PWA 설치 이벤트 리스너
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // 이미 설치되었는지 확인
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setShowInstallPrompt(true)
      }
    }

    // 앱이 이미 설치되었는지 확인
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          (window.navigator as any).standalone === true) {
        setIsInstalled(true)
        setShowInstallPrompt(false)
      }
    }

    // 이벤트 리스너 등록
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully')
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    })

    // 초기 설치 상태 확인
    checkIfInstalled()

    // 일정 시간 후 프롬프트 표시 (사용자 경험 향상)
    const timer = setTimeout(() => {
      if (deferredPrompt && !isInstalled) {
        setShowInstallPrompt(true)
      }
    }, 3000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      clearTimeout(timer)
    }
  }, [deferredPrompt, isInstalled])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        
        console.log('[PWA] User choice:', outcome)
        
        if (outcome === 'accepted') {
          console.log('[PWA] User accepted the install prompt')
        } else {
          console.log('[PWA] User dismissed the install prompt')
        }
        
        setDeferredPrompt(null)
        setShowInstallPrompt(false)
      } catch (error) {
        console.error('[PWA] Install prompt failed:', error)
      }
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // 24시간 후 다시 표시하도록 로컬 스토리지에 저장
    localStorage.setItem('pwa-dismissed', Date.now().toString())
  }

  // 이미 설치되었거나 프롬프트를 표시하지 않아야 하는 경우
  if (isInstalled || !showInstallPrompt || !deferredPrompt) {
    return null
  }

  // 최근에 무시한 경우 체크 (24시간)
  const dismissed = localStorage.getItem('pwa-dismissed')
  if (dismissed && Date.now() - parseInt(dismissed) < 24 * 60 * 60 * 1000) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <Card className="bg-slate-800/95 backdrop-blur-sm border-purple-500/30 shadow-2xl">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium text-sm">
                무서핑 앱 설치
              </h3>
              <p className="text-gray-300 text-xs mt-1">
                홈 화면에 추가하여 더 빠르고 편리하게 이용하세요
              </p>
              
              <div className="flex items-center space-x-2 mt-3">
                <Button
                  onClick={handleInstallClick}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5"
                >
                  <Download className="w-3 h-3 mr-1" />
                  설치
                </Button>
                
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white text-xs px-2 py-1.5"
                >
                  나중에
                </Button>
              </div>
            </div>
            
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="flex-shrink-0 p-1 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="mt-3 text-xs text-gray-400">
            💡 설치 후 오프라인에서도 이용 가능합니다
          </div>
        </CardContent>
      </Card>
    </div>
  )
}