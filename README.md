# 👻 무서핑 (Nosurfing)

> **익명 공포 커뮤니티 - AI 기반 괴담 창작 플랫폼**

무서핑은 완전 익명으로 공포 소설과 이미지를 공유하는 커뮤니티 서비스입니다. AI를 활용해 쉽게 공포 이야기를 만들고, 다른 사용자들과 공유할 수 있습니다.

[![Demo](https://img.shields.io/badge/Demo-Live-success)](https://nosurfing.vercel.app)
[![GitHub](https://img.shields.io/github/license/kyho2k/Nosurfing)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Powered-green)](https://supabase.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-purple)](https://web.dev/progressive-web-apps/)

## ✨ 주요 기능

### 🎭 **완전 익명 시스템**
- 회원가입/로그인 불필요
- 개인정보 수집 없음
- 세션 기반 권한 관리

### 🤖 **AI 기반 콘텐츠 생성**
- OpenAI GPT-3.5 Turbo로 공포 소설 자동 생성
- DALL-E 3로 분위기 있는 이미지 생성
- 일일 3회 무료 생성 제한

### 🛡️ **스마트 모더레이션**
- AI 기반 콘텐츠 필터링
- 사용자 신고 시스템
- 자동 숨김/차단 기능

### 📱 **PWA 지원**
- 모바일 앱처럼 설치 가능
- 오프라인 지원
- 푸시 알림 준비

### 🎮 **게이미피케이션**
- 팝핑 귀신방울 미니게임
- 업적 및 배지 시스템
- 월간 베스트 랭킹

## 🚀 빠른 시작

### 1. 프로젝트 클론
```bash
git clone https://github.com/kyho2k/Nosurfing.git
cd Nosurfing
npm install
```

### 2. 환경 변수 설정
```bash
cp .env.example .env.local
# .env.local 파일을 열어서 실제 값들을 입력하세요
```

### 3. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 📚 배포 가이드

상세한 배포 방법은 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)를 참고하세요.

### 간단 배포 (Vercel + Supabase)

1. **Supabase 프로젝트 생성**
   - https://supabase.com 에서 새 프로젝트 생성
   - `supabase/migrations/000_complete_schema.sql` 실행

2. **Vercel 배포**
   - GitHub 연동 후 자동 배포
   - 환경 변수 설정

3. **도메인 연결 (선택)**
   - 커스텀 도메인 설정

## 🏗️ 기술 스택

### Frontend
- **Next.js 15** - React 프레임워크 (App Router)
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 스타일링
- **Shadcn/ui** - UI 컴포넌트
- **PWA** - 모바일 앱 경험

### Backend
- **Vercel Functions** - 서버리스 API
- **Supabase** - 데이터베이스 및 인증
- **PostgreSQL** - 관계형 데이터베이스
- **Row Level Security** - 데이터 보안

### AI & Services
- **OpenAI GPT-3.5** - 텍스트 생성
- **DALL-E 3** - 이미지 생성
- **Perspective API** - 콘텐츠 필터링 (선택)

### Deployment
- **Vercel** - 호스팅 및 CI/CD
- **Supabase Storage** - 이미지 저장
- **CDN** - 글로벌 콘텐츠 전송

## 📁 프로젝트 구조

```
nosurfing/
├── app/                    # Next.js App Router
│   ├── api/               # API 라우트
│   ├── admin/             # 관리자 페이지
│   ├── feed/              # 피드 페이지
│   ├── game/              # 미니게임
│   └── rankings/          # 랭킹 페이지
├── components/            # React 컴포넌트
│   ├── ui/               # 재사용 UI 컴포넌트
│   ├── home/             # 홈페이지 컴포넌트
│   └── layout/           # 레이아웃 컴포넌트
├── lib/                   # 유틸리티 함수
├── hooks/                 # Custom React 훅
├── supabase/             # 데이터베이스 마이그레이션
├── public/               # 정적 파일
└── styles/               # 글로벌 스타일
```

## 🔧 개발 가이드

### 환경 변수

필수 환경 변수:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

선택 환경 변수:
```env
OPENAI_API_KEY=your_openai_key
PERSPECTIVE_API_KEY=your_perspective_key
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_id
```

### 주요 스크립트

```bash
# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 타입 체크
npm run type-check

# 린팅
npm run lint

# 포맷팅
npm run format
```

### 데이터베이스 스키마

Supabase Studio에서 `supabase/migrations/000_complete_schema.sql`을 실행하세요.

주요 테이블:
- `creatures` - 메인 콘텐츠 (공포 존재들)
- `creature_likes` - 좋아요 시스템
- `content_reports` - 신고 시스템
- `ai_generation_requests` - AI 사용량 제한
- `moderation_logs` - 검열 로그

## 🧪 테스트

### API 테스트
```bash
# Health Check
curl http://localhost:3000/api/health

# 존재 목록 조회
curl http://localhost:3000/api/creatures

# AI 제한 확인
curl http://localhost:3000/api/ai/limits
```

### 기능 테스트 체크리스트
- [ ] 홈페이지 로딩
- [ ] 익명 글쓰기
- [ ] AI 생성 (API 키 필요)
- [ ] 좋아요 기능
- [ ] 신고 기능
- [ ] PWA 설치
- [ ] 반응형 디자인

## 🔒 보안

### 구현된 보안 기능
- **Row Level Security (RLS)** - 데이터베이스 레벨 보안
- **Rate Limiting** - API 호출 제한
- **Content Filtering** - AI 기반 콘텐츠 검열
- **CSRF Protection** - 크로스 사이트 요청 위조 방지
- **XSS Protection** - 스크립트 삽입 공격 방지

### 보안 고려사항
- API 키는 환경 변수로 관리
- 사용자 입력은 모두 검증 및 필터링
- 이미지 업로드는 안전한 버킷에만 허용
- 세션 기반 권한 관리로 익명성 보장

## 📈 성능 최적화

### 구현된 최적화
- **Image Optimization** - Next.js Image 컴포넌트
- **Code Splitting** - 페이지별 번들 분할
- **SSR/ISR** - 서버 사이드 렌더링
- **CDN** - 글로벌 콘텐츠 전송
- **Database Indexing** - 쿼리 성능 최적화

### 성능 모니터링
- **Vercel Analytics** - 트래픽 분석
- **Supabase Dashboard** - 데이터베이스 성능
- **Web Vitals** - 사용자 경험 지표

## 📋 로드맵

### v1.0 (현재)
- [x] 기본 익명 게시판
- [x] AI 콘텐츠 생성
- [x] PWA 지원
- [x] 모더레이션 시스템

### v1.1 (예정)
- [ ] 댓글 시스템
- [ ] 실시간 알림
- [ ] 고급 검색 기능
- [ ] 카테고리 분류

### v1.2 (예정)
- [ ] 음성 읽기 기능
- [ ] 다국어 지원
- [ ] 고급 게이미피케이션
- [ ] 커뮤니티 이벤트

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


V### Vercel 환경변수 셋업
Environment Variables에 아래 넣기
	•	NEXT_PUBLIC_SUPABASE_URL
	•	NEXT_PUBLIC_SUPABASE_ANON_KEY
	•	OPENAI_API_KEY(쓰는 경우) 등

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

## 🙏 감사의 말

- [Next.js](https://nextjs.org/) - 훌륭한 React 프레임워크
- [Supabase](https://supabase.com/) - 멋진 Backend-as-a-Service
- [OpenAI](https://openai.com/) - 강력한 AI API
- [Vercel](https://vercel.com/) - 최고의 배포 플랫폼
- [Tailwind CSS](https://tailwindcss.com/) - 유연한 CSS 프레임워크

## 📞 지원

- **GitHub Issues**: [이슈 신고](https://github.com/kyho2k/Nosurfing/issues)
- **Discord**: [커뮤니티 참여](https://discord.gg/nosurfing)
- **Email**: support@nosurfing.app

---

**⚠️ 주의사항**: 무서핑의 모든 콘텐츠는 픽션이며, 실제 공포 체험과는 무관합니다. 미성년자는 보호자의 동의 하에 이용해 주세요.

**🎉 무서핑과 함께 당신만의 공포 이야기를 세상에 알려보세요!**

## 🤖 AI / MCP 가이드

- 공식 개요: `MCP_SETUP.md` — MCP 원칙, 충돌 방지 체크리스트
- Gemini 브라우저 MCP: `GEMINI_CLI_BROWSER_MCP_GUIDE.md` — 실행/테스트 상세
- Claude 사용 가이드: `CLAUDE.md` — Claude Code/데스크톱 워크플로
- 팀 규범: `TEAM_GUIDELINES.md` — 브랜치/PR/테스트/AI 도구 사용 기준
- PRD 템플릿: `doc/PRD_TEMPLATE.md`

폴더 구조(샘플):
```
mcp/
├── README.md
├── gemini-browser/
│   └── README.md
├── claude/
│   └── local-server.json.example
└── scripts/
    └── mcp/
        └── start-gemini-browser.sh
```
