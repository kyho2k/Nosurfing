# 🔧 Gemini CLI 문제 해결 가이드

## 🚨 **고질적 문제들과 해결책**

### **문제 1: 홈페이지 404 오류**
```
Page Title: 404: This page could not be found.
```

**원인**: 
- Gemini CLI가 실행한 `npm run dev`와 기존 `pnpm dev` 서버 충돌
- 포트 3000 점유 상태 충돌

**해결책**:
```bash
# 1단계: 모든 개발 서버 종료
pkill -f "next.*dev"
pkill -f "pnpm.*dev" 
pkill -f "npm.*dev"

# 2단계: 포트 정리
lsof -ti:3000 | xargs kill -9 2>/dev/null

# 3단계: 프로젝트 디렉토리에서 새로 시작
cd "/Volumes/PCIE Media/Project/Nosurfing"
pnpm dev

# 또는 다른 포트 사용
pnpm dev -- --port 3001
```

### **문제 2: 정적 자산 404 오류**
```
GET /_next/static/chunks/main-app.js 404
GET /_next/static/css/app/layout.css 404
```

**원인**: 
- Next.js 빌드 파일이 제대로 생성되지 않음
- 서버 충돌로 인한 asset 경로 오류

**해결책**:
```bash
# .next 디렉토리 삭제 후 재빌드
rm -rf .next
pnpm dev
```

### **문제 3: 피드 페이지 무한 로딩**
```yaml
paragraph: 존재들을 불러오는 중...  # 5초 후에도 그대로
```

**원인**:
- JavaScript 실행 실패로 1초 타이머가 작동하지 않음
- API 호출 실패

**해결책**:
```bash
# API가 정상 작동하는지 확인
curl http://localhost:3000/api/creatures

# 정상 응답이 없으면 서버 재시작
pnpm dev
```

## ✅ **올바른 테스트 절차**

### **1단계: 환경 정리**
```bash
# 터미널 1: 기존 프로세스 정리
pkill -f "dev"
lsof -ti:3000 | xargs kill -9

# 터미널 2: 새로운 서버 시작
cd "/Volumes/PCIE Media/Project/Nosurfing"
pnpm install  # 의존성 확인
pnpm dev     # 서버 시작
```

### **2단계: 서버 상태 확인**
```bash
# API 테스트
curl -s http://localhost:3000/api/creatures | jq 'length'

# 홈페이지 확인
curl -s http://localhost:3000 | grep -o "무서핑"
```

### **3단계: Browser MCP 테스트**
```javascript
// 올바른 순서
async function testNosurfing() {
  // 1. 홈페이지 접속 (404 오류 확인용)
  await browser.navigate("http://localhost:3000")
  
  // 404라면 피드로 직접 이동
  if (pageTitle.includes("404")) {
    await browser.navigate("http://localhost:3000/feed")
  }
  
  // 2. 충분한 대기 시간 (피드 페이지)
  await browser.waitForText("존재들을 불러오는 중", { timeout: 3000 })
  await browser.waitForText("발견된 존재들", { timeout: 10000 }) // 10초로 증가
  
  // 3. 나머지 페이지 테스트
  await browser.navigate("http://localhost:3000/game")
  await browser.navigate("http://localhost:3000/rankings")
}
```

## 🎯 **권장 테스트 전략**

### **안정적인 하이브리드 접근**
1. **서버 상태 먼저 확인**: `curl` 테스트
2. **단순 페이지 접속**: Browser MCP
3. **복잡한 기능**: API 레벨 테스트

### **타임아웃 설정**
```javascript
const TIMEOUTS = {
  homepage: 5000,      // 홈페이지
  feed: 10000,         // 피드 (1초 지연 + 로딩)
  navigation: 5000,    // 네비게이션
  api: 3000           // API 응답
}
```

### **오류 대응**
```javascript
try {
  await browser.navigate("http://localhost:3000")
} catch (error) {
  if (error.message.includes("404")) {
    console.log("홈페이지 404 - 서버 재시작 필요")
    // 대안 경로로 테스트 계속
    await browser.navigate("http://localhost:3000/feed")
  }
}
```

## 🚀 **최종 권장사항**

### **Gemini CLI 사용 시 주의점**
1. **한 번에 하나의 서버만** 실행
2. **충분한 타임아웃** 설정 (최소 10초)
3. **404 오류 시 즉시 서버 재시작**
4. **정적 자산 오류 시 .next 디렉토리 삭제**

### **가장 안정적인 방법**
```bash
# 매번 테스트 전에 실행
pkill -f "dev" && cd "/path/to/Nosurfing" && pnpm dev
```

이 가이드를 따르면 Gemini CLI의 고질적인 문제들을 해결할 수 있습니다! 🎉

---

*마지막 업데이트: 2025-08-19*  
*무서핑 프로젝트 전용 문제 해결 가이드*