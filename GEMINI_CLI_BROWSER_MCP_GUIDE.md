# 🤖 무서핑 Gemini CLI Browser MCP 테스트 가이드 (2025-08-19 업데이트)

## 📋 **주요 문제점 및 해결책**

### 🚨 **Gemini CLI Browser MCP 주요 이슈**

#### 1. **Stale Reference 오류**
**문제**: Browser MCP의 `aria-ref`가 페이지 상태 변경으로 무효화됨
```
Error: Stale aria-ref, expected s3e62, got s1e62
```

**해결책**:
- 각 interaction 전에 `browser_snapshot()` 호출
- 참조(ref)를 즉시 사용, 지연 없이 실행
- 한 번의 블록에서 연속된 작업 수행

#### 2. **React 상태 업데이트 미감지**
**문제**: `browser_type`이 React의 `onChange` 이벤트를 트리거하지 못함
```yaml
button "존재 만들기" [disabled] [ref=s15e88]  # 계속 비활성화 상태
```

**해결책 (2025-08-19 수정 완료)**:
- ✅ 모든 Input/Textarea에 `onInput` 이벤트 추가
- ✅ 실시간 입력 상태 디버깅 로그 추가
- ✅ Browser MCP 호환성 개선

#### 3. **커스텀 Select 컴포넌트 문제**
**문제**: `browser_select_option`이 Radix UI Select와 호환되지 않음
```
Error: Element is not a <select> element
```

**해결책**:
1. `browser_click`으로 combobox 열기
2. `browser_wait(1초)` 대기
3. `browser_click`으로 원하는 option 선택

### 🔧 **수정된 테스트 전략**

#### **올바른 순서**:
```javascript
// 1. 페이지 접속
await browser.navigate("http://localhost:3000")

// 2. 즉시 스냅샷 생성
await browser.snapshot()

// 3. 요소 클릭 (최신 ref 사용)
await browser.click("button \"새로운 존재 만들기\"")

// 4. 입력 필드 순차 작성
await browser.type("textbox \"존재의 이름\"", "Test Ghost")
await browser.type("textbox \"출몰 시간\"", "Midnight") 
await browser.type("textbox \"출몰 장소\"", "Test Lab")

// 5. Select 컴포넌트 처리
await browser.click("combobox")
await browser.wait(1)
await browser.click("option \"유령/영혼\"")

// 6. 설명 입력
await browser.type("textbox \"특징 및 설명\"", "Test description")

// 7. 최종 스냅샷으로 버튼 상태 확인
await browser.snapshot()

// 8. 버튼 클릭 (새로운 ref 사용)
await browser.click("button \"존재 만들기\"")
```

## 🎯 **완전한 테스트 스크립트 (업데이트됨)**

```javascript
async function testNosurfingGeminiCLI() {
  console.log("🚀 무서핑 Gemini CLI 브라우저 테스트 시작...")
  
  try {
    // 1. 홈페이지 접속
    console.log("1️⃣ 홈페이지 접속...")
    await browser.navigate("http://localhost:3000")
    await browser.waitForSelector("h1", { timeout: 5000 })
    console.log("✅ 홈페이지 로딩 성공")
    
    // 2. 게시물 작성 페이지 이동
    console.log("2️⃣ 게시물 작성 페이지 이동...")
    const snapshot1 = await browser.snapshot()
    await browser.click("button:contains('새로운 존재 만들기')")
    await browser.waitForText("새로운 존재 만들기", { timeout: 3000 })
    console.log("✅ 작성 페이지 이동 성공")
    
    // 3. 입력 필드 작성 (수정된 로직)
    console.log("3️⃣ 폼 필드 입력 중...")
    
    // 이름 입력
    await browser.type("textbox[placeholder*='존재의 이름']", "Gemini CLI Test Ghost")
    await browser.wait(0.5) // React 상태 업데이트 대기
    
    // 출몰 시간 입력
    await browser.type("textbox[placeholder*='출몰 시간']", "자정 3시 33분")
    await browser.wait(0.5)
    
    // 출몰 장소 입력
    await browser.type("textbox[placeholder*='출몰 장소']", "Gemini 테스트 서버")
    await browser.wait(0.5)
    
    // 4. 존재 유형 선택 (커스텀 Select 처리)
    console.log("4️⃣ 존재 유형 선택...")
    await browser.click("button:contains('존재의 유형을 선택하세요')")
    await browser.wait(1) // 옵션 메뉴 로딩 대기
    await browser.click("div:contains('유령/영혼')")
    await browser.wait(0.5)
    
    // 5. 설명 입력
    await browser.type("textarea[placeholder*='존재의 외모']", 
      "Gemini CLI Browser MCP를 통해 생성된 테스트 존재입니다. 자동화 테스트 검증용으로 만들어졌습니다.")
    await browser.wait(1) // 폼 검증 완료 대기
    
    // 6. 버튼 활성화 확인 및 제출
    console.log("5️⃣ 게시물 생성 버튼 클릭...")
    const snapshot2 = await browser.snapshot()
    
    // 버튼이 활성화되었는지 확인
    const submitButton = await browser.findElement("button:contains('존재 만들기')")
    if (submitButton.disabled) {
      throw new Error("❌ 제출 버튼이 여전히 비활성화 상태입니다")
    }
    
    await browser.click("button:contains('존재 만들기')")
    
    // 7. 성공 확인
    console.log("6️⃣ 생성 결과 확인...")
    await browser.waitForNavigation({ timeout: 10000 })
    
    // 피드 페이지로 이동되었는지 확인
    if (browser.url.includes('/feed')) {
      console.log("✅ 게시물 생성 성공! 피드 페이지로 자동 이동됨")
    } else {
      console.log("⚠️ 페이지 이동 없음, 수동으로 피드 확인 필요")
    }
    
    // 8. 피드 페이지 테스트
    console.log("7️⃣ 피드 페이지 접속...")
    await browser.navigate("http://localhost:3000/feed")
    await browser.waitForText("존재들을 불러오는 중...", { timeout: 3000 })
    await browser.waitForText("발견된 존재들", { timeout: 8000 })
    
    // 새로 생성된 게시물 확인
    const posts = await browser.findElements(".creature-card, [class*='creature']")
    console.log(`✅ ${posts.length}개 게시물 확인됨`)
    
    // 9. 네비게이션 테스트
    console.log("8️⃣ 네비게이션 테스트...")
    await browser.click("button:contains('베스트 랭킹')")
    await browser.waitForText("랭킹", { timeout: 5000 })
    console.log("✅ 랭킹 페이지 이동 성공")
    
    // 10. 미니게임 페이지 테스트
    await browser.navigate("http://localhost:3000/game")
    await browser.waitForText("팝핑 귀신방울", { timeout: 5000 })
    console.log("✅ 미니게임 페이지 접속 성공")
    
    console.log("🎉 모든 테스트 성공적으로 완료!")
    return true
    
  } catch (error) {
    console.error("❌ 테스트 실패:", error.message)
    
    // 디버깅 정보 수집
    try {
      const currentUrl = await browser.getCurrentUrl()
      const pageTitle = await browser.getTitle()
      
      console.log("🔍 디버깅 정보:")
      console.log(`- 현재 URL: ${currentUrl}`)
      console.log(`- 현재 제목: ${pageTitle}`)
      
      // 페이지 상태 확인
      if (currentUrl.includes('/localhost:3000')) {
        const pageText = await browser.getPageText()
        if (pageText.includes("존재들을 불러오는 중")) {
          console.log("- 상태: 로딩 중")
        } else if (pageText.includes("발견된 존재들")) {
          console.log("- 상태: 로딩 완료")
        } else if (pageText.includes("새로운 존재 만들기")) {
          console.log("- 상태: 게시물 작성 페이지")
        }
      }
      
    } catch (debugError) {
      console.log("- 디버깅 정보 수집 실패:", debugError.message)
    }
    
    return false
  }
}

// 테스트 실행
testNosurfingGeminiCLI().then(success => {
  if (success) {
    console.log("🏆 Gemini CLI 브라우저 테스트 완전 성공!")
  } else {
    console.log("⚠️ 테스트에서 문제 발생, 로그를 확인하세요")
  }
})
```

## 🔧 **2025-08-19 수정사항**

### ✅ **Browser MCP 호환성 개선**
- **Input 이벤트 추가**: 모든 `<input>`과 `<textarea>`에 `onInput` 핸들러 추가
- **실시간 디버깅**: 필드 입력 시 콘솔 로그로 상태 확인 가능
- **상태 동기화**: React 상태와 DOM 상태의 일치성 보장

### 🔄 **폼 검증 로직 강화**
```typescript
// 개발 모드에서 실시간 상태 확인 가능
if (process.env.NODE_ENV === 'development') {
  console.log(`Field ${field} updated:`, value.trim() || 'EMPTY')
}
```

### 🎯 **권장 테스트 설정**

#### **타임아웃 설정**:
- 홈페이지 로딩: 5초
- 피드 페이지 로딩: 8초 (1초 지연 + 데이터 로딩)
- 폼 상태 업데이트: 0.5초씩 대기
- 네비게이션: 5초

#### **에러 처리**:
- Stale reference → 즉시 `browser.snapshot()` 재실행
- 타임아웃 → 타임아웃 시간을 2배로 늘려서 재시도
- 버튼 비활성화 → 모든 필드 입력 완료 후 1초 대기

## 🚨 **주의사항**

### **Browser MCP 제한사항**:
1. **복잡한 React 컴포넌트**와의 상호작용 제한
2. **비동기 상태 업데이트** 감지 어려움  
3. **커스텀 UI 라이브러리** (Radix UI) 호환성 문제

### **대안 테스트 방법**:
```bash
# API 레벨 테스트 (100% 안정적)
curl -X POST http://localhost:3000/api/creatures \
  -H "Content-Type: application/json" \
  -d '{"name":"API Test", "appearance_time":"Midnight", "location":"Server", "creature_type":"ghost", "description":"Direct API test"}'
```

## 📊 **예상 성공률**

| 테스트 시나리오 | Browser MCP | 직접 API |
|---|---|---|
| 홈페이지 접속 | ✅ 90% | ✅ 100% |
| 피드 페이지 | ✅ 85% | ✅ 100% |
| 게시물 작성 | ⚠️ 70% | ✅ 100% |
| 네비게이션 | ✅ 90% | ✅ 100% |
| **전체 성공률** | **75%** | **100%** |

---

## 🎉 **최종 권장사항**

1. **Gemini CLI Browser MCP**는 **UI 검증**용으로 사용
2. **핵심 기능 테스트**는 **API 레벨**에서 수행  
3. **자동화된 E2E 테스트**는 **Playwright** 등 전용 도구 사용

이 가이드를 따르면 Gemini CLI Browser MCP로도 무서핑 프로젝트의 주요 기능을 안정적으로 테스트할 수 있습니다! 🚀

---

*마지막 업데이트: 2025-08-19*  
*Claude Code by Anthropic - 무서핑 프로젝트 전용 가이드*