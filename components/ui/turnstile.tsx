"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"

interface TurnstileProps {
  siteKey: string
  onVerify: (token: string) => void
  onError?: () => void
  onExpire?: () => void
  className?: string
  theme?: "light" | "dark" | "auto"
  size?: "normal" | "compact"
}

declare global {
  interface Window {
    turnstile: {
      render: (element: string | HTMLElement, options: any) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

export function Turnstile({
  siteKey,
  onVerify,
  onError,
  onExpire,
  className = "",
  theme = "dark",
  size = "normal"
}: TurnstileProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [widgetId, setWidgetId] = useState<string>("")
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (isLoaded && ref.current && window.turnstile && !widgetId) {
      const id = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        callback: onVerify,
        "error-callback": onError,
        "expired-callback": onExpire,
        theme,
        size
      })
      setWidgetId(id)
    }
  }, [isLoaded, siteKey, onVerify, onError, onExpire, theme, size, widgetId])

  const reset = () => {
    if (widgetId && window.turnstile) {
      window.turnstile.reset(widgetId)
    }
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        onLoad={() => setIsLoaded(true)}
        strategy="lazyOnload"
      />
      <div 
        ref={ref} 
        className={`turnstile-widget ${className}`}
        data-theme={theme}
        data-size={size}
      />
    </>
  )
}

// Hook for easy usage
export function useTurnstile() {
  const [token, setToken] = useState<string>("")
  const [isVerified, setIsVerified] = useState(false)

  const handleVerify = (token: string) => {
    setToken(token)
    setIsVerified(true)
  }

  const handleError = () => {
    setToken("")
    setIsVerified(false)
  }

  const handleExpire = () => {
    setToken("")
    setIsVerified(false)
  }

  const reset = () => {
    setToken("")
    setIsVerified(false)
  }

  return {
    token,
    isVerified,
    handleVerify,
    handleError,
    handleExpire,
    reset
  }
}