/**
 * 클라이언트 사이드 세션 관리 유틸리티
 * localStorage를 사용하여 브라우저 세션 간 일관성 유지
 */

const SESSION_ID_KEY = 'nosurfing_session_id'

/**
 * 현재 세션 ID를 가져오거나 새로 생성
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    // 서버 사이드에서는 빈 문자열 반환
    return ''
  }

  let sessionId = localStorage.getItem(SESSION_ID_KEY)
  
  if (!sessionId) {
    // 새 세션 ID 생성 (UUID v4 형식)
    sessionId = crypto.randomUUID()
    localStorage.setItem(SESSION_ID_KEY, sessionId)
  }
  
  return sessionId
}

/**
 * 세션 ID를 재설정 (새로운 UUID 생성)
 */
export function resetSessionId(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  const newSessionId = crypto.randomUUID()
  localStorage.setItem(SESSION_ID_KEY, newSessionId)
  return newSessionId
}

/**
 * 세션 ID를 삭제
 */
export function clearSessionId(): void {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.removeItem(SESSION_ID_KEY)
}

/**
 * API 호출을 위한 헤더 생성 (세션 ID 포함)
 */
export function getSessionHeaders(): Record<string, string> {
  const sessionId = getSessionId()
  return sessionId ? { 'x-session-id': sessionId } : {}
}