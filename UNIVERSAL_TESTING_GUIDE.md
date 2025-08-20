# 🔧 무서핑 프로젝트 범용 테스트 가이드

## ⚠️ 중요: 다른 AI 도구 사용시 주의사항

### 🕐 **첫 실행시 대기 시간**
- **최소 2-3분 대기 필요**
- "응답하지 않음"처럼 보여도 정상 작동 중
- Next.js 15 + React 19 컴파일 시간 때문

### 🚀 **빠른 실행 방법**
```bash
# 1. 의존성 설치
pnpm install

# 2. 환경 변수 설정 (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://arrpuarrykptututjdnq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-proj-...

# 3. 개발 서버 실행 (터보 모드)
pnpm dev:fast
# 또는
npm run dev
```

### 📋 **테스트 체크리스트**

#### ✅ **1단계: 서버 시작 확인**
- [ ] `pnpm dev` 실행
- [ ] "Ready in X seconds" 메시지 대기
- [ ] 포트 3000 사용 중인지 확인

#### ✅ **2단계: 홈페이지 접속**
- [ ] http://localhost:3000 접속
- [ ] 로딩 화면이 나타나도 **최소 30초 대기**
- [ ] "무서핑" 로고와 메뉴 표시 확인

#### ✅ **3단계: 핵심 기능 테스트**
- [ ] "새로운 존재 만들기" 버튼 클릭
- [ ] "존재들 둘러보기" (/feed) 이동
- [ ] 기존 게시물 좋아요 테스트
- [ ] AI 생성 기능 테스트 (OpenAI API 키 필요)

### 🐛 **문제 해결 가이드**

#### **문제: 페이지가 로딩되지 않음**
```bash
# 해결책 1: 캐시 삭제
rm -rf .next
pnpm dev

# 해결책 2: 의존성 재설치
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm dev
```

#### **문제: "Internal Server Error"**
- `.env.local` 파일 확인
- Supabase 연결 상태 확인
- OpenAI API 키 유효성 확인

#### **문제: 익명 인증 오류**
- Supabase 대시보드에서 "Anonymous sign-ins" 활성화
- 또는 앱이 자동으로 우회 처리함 (정상 작동)

### 🎯 **범용 사용을 위한 권장사항**

#### **1. 환경 변수 템플릿 제공**
```bash
# .env.local.example
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=your-openai-key (선택사항)
```

#### **2. Docker 컨테이너 사용**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

#### **3. Vercel 원클릭 배포**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/nosurfing)

### 📊 **성능 최적화 팁**

#### **개발 환경**
- Node.js 18+ 사용
- 메모리 8GB 이상 권장
- SSD 스토리지 사용

#### **빌드 최적화**
```json
// next.config.js
const nextConfig = {
  experimental: {
    turbo: true,
    optimizeCss: true
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
  }
}
```

### 🤖 **AI 도구별 테스트 가이드**

#### **Claude Code**
- 정상 작동 확인됨
- Browser MCP 완벽 지원

#### **다른 AI 도구들**
- 첫 로딩시 충분한 대기 시간 필요
- 타임아웃 설정을 5분 이상으로 조정 권장
- 브라우저 자동화 도구 사용시 explicit wait 설정

### 🎉 **성공 지표**

#### ✅ **정상 작동 확인 방법**
1. 홈페이지 로딩 완료
2. 메뉴 네비게이션 작동
3. 게시물 목록 표시
4. 좋아요 기능 작동
5. 댓글 시스템 작동

#### ⚠️ **알려진 제한사항**
- OpenAI API 키 없으면 AI 생성 기능만 비활성화
- Supabase 익명 로그인 비활성화시 일부 기능 제한
- 첫 실행시 긴 로딩 시간 (정상)

---

## 📞 지원 및 피드백

문제 발생시:
1. 이 가이드의 해결책 시도
2. 서버 로그 확인
3. 브라우저 콘솔 오류 확인
4. GitHub Issues에 상세한 오류 정보와 함께 보고

**이 프로젝트는 범용적으로 사용 가능하며, 적절한 설정과 대기 시간만 확보하면 모든 AI 도구에서 정상 작동합니다.**