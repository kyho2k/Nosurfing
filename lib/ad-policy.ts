// Google AdSense 정책 준수 관련 유틸리티

export interface ContentPolicy {
  allowAds: boolean
  contentRating: 'general' | 'teen' | 'mature' 
  restrictions: string[]
  safeForWork: boolean
}

// 콘텐츠 분석 및 광고 게재 가능성 판단
export function analyzeContentForAds(content: {
  title?: string
  description?: string
  story?: string
  type?: string
}): ContentPolicy {
  const text = `${content.title || ''} ${content.description || ''} ${content.story || ''}`.toLowerCase()
  
  const policy: ContentPolicy = {
    allowAds: true,
    contentRating: 'general',
    restrictions: [],
    safeForWork: true
  }

  // 심각한 폭력성 체크 (AdSense 정책 위반 가능)
  const severeViolence = [
    '살인', '죽이', '고문', '절단', '시체', '시신', '목을 매', '자살',
    '강간', '성폭행', '학대', '폭행', '테러', '폭탄', '총격'
  ]
  
  const hasSevereViolence = severeViolence.some(word => text.includes(word))
  if (hasSevereViolence) {
    policy.allowAds = false
    policy.contentRating = 'mature'
    policy.restrictions.push('과도한 폭력적 내용')
    policy.safeForWork = false
  }

  // 성인 콘텐츠 체크
  const adultContent = [
    '성인', '19금', '야동', '섹스', '성관계', '음란',
    '노출', '벗은', '나체', '음경', '질'
  ]
  
  const hasAdultContent = adultContent.some(word => text.includes(word))
  if (hasAdultContent) {
    policy.allowAds = false
    policy.contentRating = 'mature'
    policy.restrictions.push('성인 콘텐츠')
    policy.safeForWork = false
  }

  // 도박/약물 관련 체크
  const gamblingDrugs = [
    '도박', '카지노', '베팅', '마약', '대마초', '코카인',
    '필로폰', '약물', '환각제', '흡연'
  ]
  
  const hasGamblingDrugs = gamblingDrugs.some(word => text.includes(word))
  if (hasGamblingDrugs) {
    policy.allowAds = false
    policy.restrictions.push('도박/약물 관련 내용')
  }

  // 차별/혐오 표현 체크
  const hateContent = [
    '인종차별', '성차별', '종교차별', '동성애혐오',
    '장애인차별', '혐오발언'
  ]
  
  const hasHateContent = hateContent.some(word => text.includes(word))
  if (hasHateContent) {
    policy.allowAds = false
    policy.restrictions.push('차별/혐오 표현')
  }

  // 허용 가능한 공포 요소 (AdSense 정책 내)
  const mildHorror = [
    '유령', '귀신', '괴물', '좀비', '무서운', '소름',
    '오싹', '섬뜩', '괴담', '미스터리', '으스스'
  ]
  
  const hasMildHorror = mildHorror.some(word => text.includes(word))
  if (hasMildHorror && policy.allowAds) {
    policy.contentRating = 'teen'
    // 가벼운 공포는 광고 허용하되 teen 등급으로 설정
  }

  // 청소년 유해 가능성 체크 (경고만)
  const teenSensitive = [
    '술', '음주', '담배', '폭력', '싸움', '괴롭힘'
  ]
  
  const hasTeenSensitive = teenSensitive.some(word => text.includes(word))
  if (hasTeenSensitive) {
    policy.contentRating = 'teen'
    policy.restrictions.push('청소년 유의 콘텐츠')
  }

  return policy
}

// 광고 표시 여부 결정
export function shouldShowAds(contentPolicy: ContentPolicy): boolean {
  return contentPolicy.allowAds && contentPolicy.safeForWork
}

// 콘텐츠 등급에 따른 광고 타입 결정
export function getAdTypeForContent(contentPolicy: ContentPolicy): 'family' | 'general' | 'none' {
  if (!contentPolicy.allowAds) return 'none'
  
  switch (contentPolicy.contentRating) {
    case 'general':
      return 'family'
    case 'teen':
      return 'general'
    case 'mature':
      return 'none'
    default:
      return 'general'
  }
}

// AdSense 설정 데이터
export const ADSENSE_CONFIG = {
  publisherId: process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || 'ca-pub-test',
  
  // 슬롯 ID들 (실제 운영 시 교체 필요)
  slots: {
    headerBanner: '1234567890',
    sidebar: '2345678901', 
    feedInline: '3456789012',
    contentBottom: '4567890123',
    mobileAnchor: '5678901234',
    gamePage: '6789012345',
    interstitial: '7890123456'
  },
  
  // 환경별 설정
  testMode: process.env.NODE_ENV === 'development',
  
  // 정책 준수 설정
  familySafeMode: true,
  contentRatingRequired: true,
  
  // 광고 차단 감지
  adBlockDetection: true,
  
  // 무효 클릭 방지
  clickFloodProtection: true
}

// AdSense 콘텐츠 정책 가이드라인
export const AD_CONTENT_GUIDELINES = {
  allowed: [
    '일반적인 공포/괴담 이야기',
    '미스터리 추리 콘텐츠', 
    '판타지 호러 요소',
    '가벼운 서스펜스',
    '유령/귀신 이야기',
    '도시전설 및 괴담'
  ],
  
  restricted: [
    '과도한 폭력 묘사',
    '잔혹한 살인 장면',
    '성인/음란 콘텐츠',
    '자살 조장 내용',
    '약물/도박 관련',
    '차별/혐오 표현'
  ],
  
  recommendations: [
    '콘텐츠 경고 문구 사용',
    '연령 제한 표시',
    '사실과 픽션 구분 명시',
    '건전한 공포 콘텐츠 지향',
    '커뮤니티 가이드라인 준수'
  ]
}

// 광고 차단 감지 함수
export function detectAdBlocker(): Promise<boolean> {
  return new Promise((resolve) => {
    const testAd = document.createElement('div')
    testAd.innerHTML = '&nbsp;'
    testAd.className = 'adsbox'
    testAd.style.position = 'absolute'
    testAd.style.left = '-9999px'
    testAd.style.height = '1px'
    
    document.body.appendChild(testAd)
    
    setTimeout(() => {
      const isBlocked = testAd.offsetHeight === 0
      document.body.removeChild(testAd)
      resolve(isBlocked)
    }, 100)
  })
}

// 무효 클릭 방지 (클릭 빈도 제한)
const clickHistory: number[] = []
const CLICK_LIMIT = 3 // 10분 내 3회 제한
const TIME_WINDOW = 10 * 60 * 1000 // 10분

export function isValidAdClick(): boolean {
  const now = Date.now()
  
  // 10분 이전 클릭 기록 제거
  while (clickHistory.length > 0 && clickHistory[0] < now - TIME_WINDOW) {
    clickHistory.shift()
  }
  
  // 클릭 제한 확인
  if (clickHistory.length >= CLICK_LIMIT) {
    console.warn('광고 클릭 제한 초과 - 잠시 후 다시 시도해주세요')
    return false
  }
  
  clickHistory.push(now)
  return true
}