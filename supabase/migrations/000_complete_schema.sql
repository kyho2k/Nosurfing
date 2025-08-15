-- 🗄️ 무서핑 완전한 데이터베이스 스키마
-- Supabase Studio > SQL Editor에서 실행하세요

-- ===================
-- 기본 테이블 생성
-- ===================

-- 존재(creatures) 테이블 - 메인 콘텐츠
CREATE TABLE IF NOT EXISTS creatures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    appearance_time VARCHAR(100),
    location VARCHAR(255),
    creature_type VARCHAR(100),
    description TEXT,
    story TEXT NOT NULL,
    image_url TEXT,
    like_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    author_session_id UUID NOT NULL,
    moderation_status VARCHAR(20) DEFAULT 'approved', -- 'approved', 'hidden', 'blocked'
    moderation_id VARCHAR(255) NULL,
    is_ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- 검열 로그 테이블
CREATE TABLE IF NOT EXISTS moderation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_text TEXT NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- 'creature', 'comment', 'general'
    is_approved BOOLEAN NOT NULL DEFAULT false,
    confidence DECIMAL(3,2) DEFAULT 1.0, -- 0.00 ~ 1.00
    reasons TEXT[] DEFAULT '{}', -- 차단/경고 사유 배열
    moderation_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 업적 테이블 (게이미피케이션)
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_session_id UUID NOT NULL,
    achievement_type VARCHAR(50) NOT NULL, -- 'first_story', 'popular_story', 'prolific_writer'
    achievement_data JSONB DEFAULT '{}',
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_session_id, achievement_type)
);

-- ===================
-- 인덱스 생성 (성능 최적화)
-- ===================

-- creatures 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_creatures_created_at ON creatures(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creatures_like_count ON creatures(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_creatures_moderation_status ON creatures(moderation_status);
CREATE INDEX IF NOT EXISTS idx_creatures_author_session ON creatures(author_session_id);

-- likes 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_creature_likes_creature_id ON creature_likes(creature_id);
CREATE INDEX IF NOT EXISTS idx_creature_likes_session ON creature_likes(user_session_id);

-- reports 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_content_reports_content_id ON content_reports(content_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_created_at ON content_reports(created_at DESC);

-- AI 요청 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_ai_requests_session_date ON ai_generation_requests(user_session_id, created_at);

-- 검열 로그 인덱스
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created_at ON moderation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_is_approved ON moderation_logs(is_approved);

-- ===================
-- RLS (Row Level Security) 정책
-- ===================

-- creatures 테이블 RLS 활성화
ALTER TABLE creatures ENABLE ROW LEVEL SECURITY;

-- 승인된 콘텐츠는 누구나 읽기 가능
CREATE POLICY "Anyone can read approved creatures" ON creatures
    FOR SELECT USING (moderation_status != 'blocked');

-- 누구나 새 존재 생성 가능
CREATE POLICY "Anyone can create creatures" ON creatures
    FOR INSERT WITH CHECK (true);

-- 작성자만 자신의 글 수정 가능 (3분 제한은 애플리케이션에서 처리)
CREATE POLICY "Authors can update their creatures" ON creatures
    FOR UPDATE USING (auth.jwt() ->> 'sub' = author_session_id::text);

-- 작성자만 자신의 글 삭제 가능
CREATE POLICY "Authors can delete their creatures" ON creatures
    FOR DELETE USING (auth.jwt() ->> 'sub' = author_session_id::text);

-- likes 테이블 RLS
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

-- moderation_logs RLS
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read moderation_logs" ON moderation_logs
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert moderation_logs" ON moderation_logs  
    FOR INSERT WITH CHECK (true);

-- achievements RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own achievements" ON user_achievements
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_session_id::text);

CREATE POLICY "Anyone can create achievements" ON user_achievements
    FOR INSERT WITH CHECK (true);

-- ===================
-- 유용한 함수들
-- ===================

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

-- 자동 검열 처리 함수
CREATE OR REPLACE FUNCTION auto_moderate_content(
    p_content_id VARCHAR(255),
    p_content_type VARCHAR(50)
) RETURNS VOID AS $$
DECLARE
    report_count INTEGER;
BEGIN
    -- 해당 콘텐츠의 미처리 신고 수 계산
    SELECT COUNT(*) INTO report_count
    FROM content_reports 
    WHERE content_id = p_content_id AND status = 'pending';
    
    -- 신고 임계값에 따른 자동 조치
    IF report_count >= 5 THEN
        -- 5회 이상: 자동 차단
        IF p_content_type = 'creature' THEN
            UPDATE creatures 
            SET moderation_status = 'blocked', updated_at = NOW()
            WHERE id::VARCHAR = p_content_id;
        END IF;
    ELSIF report_count >= 3 THEN  
        -- 3회 이상: 자동 숨김
        IF p_content_type = 'creature' THEN
            UPDATE creatures 
            SET moderation_status = 'hidden', updated_at = NOW()
            WHERE id::VARCHAR = p_content_id;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 신고 시 자동 검열 트리거 함수
CREATE OR REPLACE FUNCTION trigger_auto_moderate()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM auto_moderate_content(NEW.content_id, NEW.content_type);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 자동 검열 트리거 생성
DROP TRIGGER IF EXISTS auto_moderate_on_report ON content_reports;
CREATE TRIGGER auto_moderate_on_report
    AFTER INSERT ON content_reports
    FOR EACH ROW
    EXECUTE FUNCTION trigger_auto_moderate();

-- ===================
-- 통계 뷰 생성
-- ===================

-- 일일 검열 통계 뷰
CREATE OR REPLACE VIEW moderation_daily_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_checked,
    SUM(CASE WHEN is_approved THEN 1 ELSE 0 END) as approved_count,
    SUM(CASE WHEN NOT is_approved THEN 1 ELSE 0 END) as rejected_count,
    ROUND(AVG(CASE WHEN is_approved THEN 1.0 ELSE 0.0 END) * 100, 1) as approval_rate
FROM moderation_logs 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 신고 요약 뷰
CREATE OR REPLACE VIEW report_summary AS  
SELECT
    COUNT(*) as total_reports,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_reports,
    SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_reports
FROM content_reports 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';

-- ===================
-- 초기 데이터 삽입 (테스트용)
-- ===================

-- 샘플 존재 데이터
INSERT INTO creatures (name, appearance_time, location, creature_type, description, story, author_session_id) VALUES
('붉은 눈의 그림자', '밤 12시', '내 방 창문', '유령', '밤마다 창밖을 서성이는 붉은 눈의 그림자', '어느 날 밤, 잠 못 이루고 뒤척이던 나는 창밖에서 섬뜩한 시선을 느꼈다. 붉게 빛나는 두 눈이 어둠 속에서 나를 응시하고 있었다. 그것은 형체 없는 그림자였지만, 그 시선은 마치 칼날처럼 내 심장을 꿰뚫는 듯했다. 다음 날부터 매일 밤, 그 그림자는 내 창밖을 서성였고, 나는 점점 잠식되어 갔다...', '00000000-0000-0000-0000-000000000000'),
('숲 속의 속삭임', '새벽', '어두운 숲', '정령', '깊은 숲 속에서 들려오는 알 수 없는 속삭임', '어둠이 깔린 숲 속, 발걸음을 옮길 때마다 나뭇잎 바스락거리는 소리 외에 희미한 속삭임이 들려왔다. 처음엔 바람 소리인 줄 알았지만, 점점 또렷해지는 그 소리는 마치 누군가 내 이름을 부르는 듯했다. 뒤를 돌아봐도 아무도 없었고, 속삭임은 더욱 가까이 다가왔다. 나는 공포에 질려 달아나기 시작했다...', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- 테이블에 대한 설명 추가
COMMENT ON TABLE creatures IS '무서핑 메인 콘텐츠 - 공포 존재들';
COMMENT ON TABLE creature_likes IS '존재에 대한 좋아요';
COMMENT ON TABLE content_reports IS '콘텐츠 신고 데이터';
COMMENT ON TABLE ai_generation_requests IS 'AI 생성 요청 제한 추적';
COMMENT ON TABLE moderation_logs IS '콘텐츠 자동 검열 로그';
COMMENT ON TABLE user_achievements IS '사용자 업적 및 배지';

-- ===================
-- 완료 메시지
-- ===================

DO $$
BEGIN
    RAISE NOTICE '🎉 무서핑 데이터베이스 스키마가 성공적으로 생성되었습니다!';
    RAISE NOTICE '📊 생성된 테이블: creatures, creature_likes, content_reports, ai_generation_requests, moderation_logs, user_achievements';
    RAISE NOTICE '🔒 RLS 정책이 모든 테이블에 적용되었습니다.';
    RAISE NOTICE '📈 성능 최적화를 위한 인덱스가 생성되었습니다.';
    RAISE NOTICE '🤖 자동 검열 및 좋아요 카운트 트리거가 활성화되었습니다.';
END $$;