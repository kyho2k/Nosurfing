# 🚀 무서핑 배포 가이드 (초심자용)

## 필요한 것들
- GitHub 계정
- Vercel 계정 (무료)
- Supabase 계정 (무료)
- OpenAI API 키 (선택, AI 기능용)

## 1단계: 환경 준비

### A. Node.js 설치 확인
```bash
node --version  # v18 이상이어야 함
npm --version
```

### B. 프로젝트 다운로드
```bash
git clone https://github.com/kyho2k/Nosurfing.git
cd Nosurfing
npm install
```

## 2단계: Supabase 설정

### A. Supabase 프로젝트 생성
1. https://supabase.com 접속
2. "Start your project" 클릭
3. GitHub로 로그인
4. "New project" 클릭
5. 프로젝트 이름: `nosurfing-prod`
6. 데이터베이스 비밀번호 설정 (기억해 두세요!)
7. 리전: Northeast Asia (Seoul) 선택
8. "Create new project" 클릭

### B. 데이터베이스 테이블 생성
1. Supabase 대시보드에서 "SQL Editor" 클릭
2. 다음 SQL 실행:

```sql
-- 존재(creatures) 테이블
CREATE TABLE creatures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  appearance_time VARCHAR(100),
  location VARCHAR(255),
  creature_type VARCHAR(100),
  description TEXT,
  story TEXT,
  image_url TEXT,
  like_count INTEGER DEFAULT 0,
  author_session_id UUID NOT NULL,
  moderation_status VARCHAR(20) DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책 활성화
ALTER TABLE creatures ENABLE ROW LEVEL SECURITY;

-- 누구나 승인된 콘텐츠 읽기 가능
CREATE POLICY "Anyone can read approved creatures" ON creatures
    FOR SELECT USING (moderation_status != 'blocked');

-- 작성자만 수정/삭제 가능
CREATE POLICY "Authors can update their creatures" ON creatures
    FOR UPDATE USING (auth.jwt() ->> 'sub' = author_session_id::text);

CREATE POLICY "Authors can delete their creatures" ON creatures
    FOR DELETE USING (auth.jwt() ->> 'sub' = author_session_id::text);

-- 누구나 새 존재 생성 가능
CREATE POLICY "Anyone can create creatures" ON creatures
    FOR INSERT WITH CHECK (true);
```

### C. 스토리지 버킷 생성
1. Supabase 대시보드에서 "Storage" 클릭
2. "Create bucket" 클릭
3. 버킷 이름: `creatures-images`
4. "Public bucket" 체크
5. "Create bucket" 클릭

### D. API 키 복사
1. "Settings" → "API" 클릭
2. 다음 정보 복사해 두기:
   - Project URL
   - anon public key

## 3단계: 환경 변수 설정

프로젝트 폴더에 `.env.local` 파일 생성:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI (AI 기능용 - 선택사항)
OPENAI_API_KEY=your_openai_api_key

# 기타
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 4단계: 로컬 테스트

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속해서 모든 기능 테스트

## 5단계: Vercel 배포

### A. Vercel 계정 생성
1. https://vercel.com 접속
2. "Sign Up" → GitHub로 로그인

### B. 프로젝트 배포
1. Vercel 대시보드에서 "New Project" 클릭
2. GitHub에서 `Nosurfing` 리포지토리 선택
3. "Import" 클릭
4. "Environment Variables" 섹션에서 `.env.local`의 모든 변수 입력:
   ```
   NEXT_PUBLIC_SUPABASE_URL = your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your_supabase_key
   OPENAI_API_KEY = your_openai_key (선택)
   ```
5. "Deploy" 클릭
6. 배포 완료까지 2-3분 대기

### C. 도메인 확인
배포 완료 후 Vercel이 제공하는 URL (예: `nosurfing-xxx.vercel.app`)로 접속

## 6단계: 이미지 도메인 허용

`next.config.mjs` 파일에서 Supabase 이미지 도메인 추가:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'your-project-id.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
```

변경 후 GitHub에 커밋하면 자동 재배포됩니다.

## 7단계: 최종 테스트

배포된 사이트에서 다음 기능들을 테스트:

### ✅ 체크리스트
- [ ] 홈페이지 로딩
- [ ] 익명 글쓰기
- [ ] 이미지 업로드
- [ ] AI 생성 (API 키 설정한 경우)
- [ ] 좋아요 기능
- [ ] 신고 기능
- [ ] PWA 설치 프롬프트
- [ ] 모바일 반응형
- [ ] 링크 공유 (OG 태그)

## 문제 해결

### 이미지가 안 보이는 경우
- `next.config.mjs`의 이미지 도메인 설정 확인
- Supabase 스토리지 버킷이 public인지 확인

### AI 기능이 안 되는 경우
- OpenAI API 키 확인
- API 키에 충분한 크레딧이 있는지 확인

### 데이터베이스 오류
- Supabase 연결 정보 확인
- RLS 정책이 올바르게 설정되었는지 확인

## 추가 설정 (선택)

### 커스텀 도메인
1. Vercel 프로젝트 설정 → Domains
2. 소유한 도메인 추가
3. DNS 설정 안내에 따라 네임서버 변경

### Google Analytics
1. `app/layout.tsx`에 GA 스크립트 추가
2. 환경 변수에 GA ID 추가

### AdSense (수익화)
1. Google AdSense 승인 후
2. 광고 코드를 컴포넌트에 삽입
3. 공포 콘텐츠 정책 주의

## 유지보수

### 정기 업데이트
```bash
npm update
npm audit fix
```

### 백업
- Supabase 데이터는 자동 백업됨
- 코드는 GitHub에 자동 저장됨

### 모니터링
- Vercel Analytics로 트래픽 확인
- Supabase 대시보드로 DB 상태 확인

---

🎉 **축하합니다! 무서핑이 성공적으로 배포되었습니다!**

문제가 있거나 도움이 필요하면 GitHub Issues에 올려주세요.