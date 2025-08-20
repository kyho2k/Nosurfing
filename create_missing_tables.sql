-- Missing tables for Nosurfing project

-- 좋아요 테이블
CREATE TABLE IF NOT EXISTS creature_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creature_id UUID REFERENCES creatures(id) ON DELETE CASCADE,
    user_session_id UUID NOT NULL,
    ip_hash VARCHAR(64), -- IP 해시 (중복 방지용)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(creature_id, user_session_id)
);

-- 콘텐츠 신고 테이블
CREATE TABLE IF NOT EXISTS content_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id VARCHAR(255) NOT NULL, -- 신고된 콘텐츠 ID
    content_type VARCHAR(50) NOT NULL, -- 'creature', 'comment'
    reason VARCHAR(50) NOT NULL, -- 'spam', 'inappropriate', 'violence', 'harassment', 'other'
    description TEXT, -- 신고 상세 설명
    reporter_session_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'resolved', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE NULL,
    resolved_by VARCHAR(255) NULL
);

-- AI 생성 요청 제한 테이블
CREATE TABLE IF NOT EXISTS ai_generation_requests (
    id BIGSERIAL PRIMARY KEY,
    user_session_id UUID NOT NULL,
    request_type VARCHAR(20) DEFAULT 'unknown' CHECK (request_type IN ('story', 'image', 'both', 'unknown')),
    success BOOLEAN DEFAULT true,
    error_message TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_creature_likes_creature_id ON creature_likes(creature_id);
CREATE INDEX IF NOT EXISTS idx_creature_likes_session ON creature_likes(user_session_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_content_id ON content_reports(content_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);

-- RLS 정책 설정
ALTER TABLE creature_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read likes" ON creature_likes
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create likes" ON creature_likes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete their own likes" ON creature_likes
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_session_id::text);

-- reports 테이블 RLS
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create reports" ON content_reports
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read reports" ON content_reports
    FOR SELECT USING (true);

-- AI 요청 테이블 RLS
ALTER TABLE ai_generation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own AI requests" ON ai_generation_requests
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_session_id::text);

CREATE POLICY "Anyone can create AI requests" ON ai_generation_requests
    FOR INSERT WITH CHECK (true);

-- 좋아요 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_creature_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE creatures 
        SET like_count = like_count + 1 
        WHERE id = NEW.creature_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE creatures 
        SET like_count = like_count - 1 
        WHERE id = OLD.creature_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 좋아요 트리거 생성
DROP TRIGGER IF EXISTS creature_like_count_trigger ON creature_likes;
CREATE TRIGGER creature_like_count_trigger
    AFTER INSERT OR DELETE ON creature_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_creature_like_count();