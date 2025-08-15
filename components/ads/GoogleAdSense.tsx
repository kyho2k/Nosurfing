"use client"

import { useEffect } from 'react'
import Script from 'next/script'

interface GoogleAdSenseProps {
  publisherId: string
  slot: string
  width?: number | string
  height?: number | string
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal'
  responsive?: boolean
  className?: string
  style?: React.CSSProperties
  testMode?: boolean
}

declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

export function GoogleAdSense({
  publisherId,
  slot,
  width = 'auto',
  height = 'auto', 
  format = 'auto',
  responsive = true,
  className = '',
  style = {},
  testMode = false
}: GoogleAdSenseProps) {
  
  useEffect(() => {
    // AdSense 광고 푸시 (클라이언트 사이드에서만)
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({})
      }
    } catch (error) {
      console.error('AdSense 광고 로드 실패:', error)
    }
  }, [])

  // 테스트 모드일 때 광고 대신 플레이스홀더 표시
  if (testMode) {
    return (
      <div 
        className={`bg-gray-800 border border-gray-600 rounded-lg flex items-center justify-center ${className}`}
        style={{
          width: width === 'auto' ? '100%' : width,
          height: height === 'auto' ? '250px' : height,
          minHeight: '100px',
          ...style
        }}
      >
        <div className="text-center text-gray-400">
          <div className="text-sm font-medium">📢 광고 영역</div>
          <div className="text-xs mt-1">테스트 모드</div>
          <div className="text-xs text-gray-500">슬롯: {slot}</div>
        </div>
      </div>
    )
  }

  const adStyle: React.CSSProperties = {
    display: 'block',
    width: width === 'auto' ? '100%' : width,
    height: height === 'auto' ? 'auto' : height,
    ...style
  }

  return (
    <>
      {/* Google AdSense 스크립트 로드 */}
      <Script
        id="adsense-script"
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      
      {/* 광고 단위 */}
      <div className={className}>
        <ins
          className="adsbygoogle"
          style={adStyle}
          data-ad-client={publisherId}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive.toString()}
        />
      </div>
    </>
  )
}