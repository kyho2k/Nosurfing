"use client"

import { GoogleAdSense } from './GoogleAdSense'

// 환경 변수에서 AdSense 설정 가져오기
const ADSENSE_PUBLISHER_ID = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || 'ca-pub-test'
const TEST_MODE = process.env.NODE_ENV === 'development' || !process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID

// 헤더 배너 광고 (상단 고정)
export function HeaderBannerAd() {
  return (
    <div className="w-full mb-4">
      <GoogleAdSense
        publisherId={ADSENSE_PUBLISHER_ID}
        slot="1234567890" // 실제 슬롯 ID로 교체 필요
        format="horizontal"
        width="100%"
        height={90}
        className="max-w-4xl mx-auto"
        testMode={TEST_MODE}
      />
    </div>
  )
}

// 사이드바 광고 (세로형)
export function SidebarAd() {
  return (
    <div className="w-full">
      <GoogleAdSense
        publisherId={ADSENSE_PUBLISHER_ID}
        slot="2345678901" // 실제 슬롯 ID로 교체 필요
        format="vertical"
        width={300}
        height={600}
        responsive={false}
        className="sticky top-4"
        testMode={TEST_MODE}
      />
    </div>
  )
}

// 피드 인라인 광고 (피드 중간삽입)
export function FeedInlineAd() {
  return (
    <div className="w-full my-6">
      <GoogleAdSense
        publisherId={ADSENSE_PUBLISHER_ID}
        slot="3456789012" // 실제 슬롯 ID로 교체 필요
        format="rectangle"
        width={336}
        height={280}
        className="mx-auto"
        testMode={TEST_MODE}
      />
    </div>
  )
}

// 콘텐츠 하단 광고 (게시물 아래)
export function ContentBottomAd() {
  return (
    <div className="w-full mt-4 pt-4 border-t border-slate-700">
      <div className="text-center text-xs text-gray-500 mb-2">
        광고
      </div>
      <GoogleAdSense
        publisherId={ADSENSE_PUBLISHER_ID}
        slot="4567890123" // 실제 슬롯 ID로 교체 필요
        format="auto"
        width="100%"
        height={250}
        className="max-w-lg mx-auto"
        testMode={TEST_MODE}
      />
    </div>
  )
}

// 모바일 앵커 광고 (하단 고정)
export function MobileAnchorAd() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-slate-900 border-t border-slate-700">
      <GoogleAdSense
        publisherId={ADSENSE_PUBLISHER_ID}
        slot="5678901234" // 실제 슬롯 ID로 교체 필요
        format="horizontal"
        width="100%"
        height={50}
        responsive={true}
        testMode={TEST_MODE}
      />
    </div>
  )
}

// 게임 페이지용 광고 (작은 크기)
export function GamePageAd() {
  return (
    <div className="w-full">
      <div className="text-center text-xs text-gray-500 mb-2">
        스폰서 광고
      </div>
      <GoogleAdSense
        publisherId={ADSENSE_PUBLISHER_ID}
        slot="6789012345" // 실제 슬롯 ID로 교체 필요
        format="rectangle"
        width={300}
        height={250}
        responsive={false}
        testMode={TEST_MODE}
      />
    </div>
  )
}

// 인터스티셜 광고 (페이지 전환 시)
export function InterstitialAd({ show, onClose }: { show: boolean, onClose: () => void }) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-medium">잠깐! 스폰서 메시지</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>
        <GoogleAdSense
          publisherId={ADSENSE_PUBLISHER_ID}
          slot="7890123456" // 실제 슬롯 ID로 교체 필요
          format="rectangle"
          width={300}
          height={250}
          testMode={TEST_MODE}
        />
        <div className="text-center mt-4">
          <button
            onClick={onClose}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm"
          >
            계속하기
          </button>
        </div>
      </div>
    </div>
  )
}

// 광고 차단 감지 알림
export function AdBlockerNotice() {
  return (
    <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <div className="text-yellow-400 text-lg">⚠️</div>
        <div>
          <h3 className="text-yellow-200 font-medium mb-2">
            광고 차단기가 감지되었습니다
          </h3>
          <p className="text-yellow-100 text-sm mb-3">
            무서핑은 광고 수익으로 운영됩니다. 광고 차단기를 비활성화해주시면 더 나은 서비스 제공에 도움이 됩니다.
          </p>
          <div className="text-xs text-yellow-300">
            💡 광고는 콘텐츠 품질에 맞게 엄선하여 제공합니다
          </div>
        </div>
      </div>
    </div>
  )
}