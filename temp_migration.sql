-- 임시로 익명 사용자를 위한 간단한 AI 제한 테이블
CREATE TABLE IF NOT EXISTS ai_generation_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'anonymous',  -- auth.users 테이블 의존성 제거
  request_type VARCHAR(20) DEFAULT 'unknown' CHECK (request_type IN ('story', 'image', 'both', 'unknown')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 성능을 위한 인덱스
CREATE INDEX IF NOT EXISTS ai_generation_requests_user_date_idx 
ON ai_generation_requests (user_id, created_at);

-- RLS 비활성화 (익명 사용자용)
ALTER TABLE ai_generation_requests DISABLE ROW LEVEL SECURITY;
