-- AI 생성 횟수 제한을 위한 테이블 생성
CREATE TABLE IF NOT EXISTS ai_generation_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type VARCHAR(20) DEFAULT 'unknown' CHECK (request_type IN ('story', 'image', 'both', 'unknown')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 성능을 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS ai_generation_requests_user_date_idx 
ON ai_generation_requests (user_id, created_at);

-- RLS (Row Level Security) 정책 활성화
ALTER TABLE ai_generation_requests ENABLE ROW LEVEL SECURITY;

-- 정책: 사용자는 자신의 기록만 조회 가능
CREATE POLICY "Users can view their own AI generation requests" 
ON ai_generation_requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- 정책: 사용자는 자신의 기록만 생성 가능
CREATE POLICY "Users can create their own AI generation requests" 
ON ai_generation_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 오래된 기록 자동 정리를 위한 함수 (선택사항)
CREATE OR REPLACE FUNCTION cleanup_old_ai_requests()
RETURNS void AS $$
BEGIN
  -- 30일 이전 기록 삭제
  DELETE FROM ai_generation_requests 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;