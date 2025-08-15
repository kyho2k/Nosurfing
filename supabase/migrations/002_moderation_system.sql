-- 콘텐츠 검열 로그 테이블
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

-- 콘텐츠 신고 테이블  
CREATE TABLE IF NOT EXISTS content_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id VARCHAR(255) NOT NULL, -- 신고된 콘텐츠 ID
    content_type VARCHAR(50) NOT NULL, -- 'creature', 'comment'
    reason VARCHAR(50) NOT NULL, -- 'spam', 'inappropriate', 'violence', 'harassment', 'other'
    description TEXT, -- 신고 상세 설명 (선택사항)
    reporter_session_id VARCHAR(255) NOT NULL, -- 신고자 세션 ID (익명)
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'resolved', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE NULL,
    resolved_by VARCHAR(255) NULL -- 처리한 관리자 ID
);

-- 기존 creatures 테이블에 검열 관련 컬럼 추가
ALTER TABLE creatures 
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'approved', -- 'approved', 'hidden', 'blocked'
ADD COLUMN IF NOT EXISTS moderation_id VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS moderation_confidence DECIMAL(3,2) DEFAULT 1.0;

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created_at ON moderation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_is_approved ON moderation_logs(is_approved);
CREATE INDEX IF NOT EXISTS idx_content_reports_content_id ON content_reports(content_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_created_at ON content_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creatures_moderation_status ON creatures(moderation_status);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- 검열 로그는 관리자만 접근 가능 (현재는 모든 사용자 읽기 허용)
CREATE POLICY "Anyone can read moderation_logs" ON moderation_logs
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert moderation_logs" ON moderation_logs  
    FOR INSERT WITH CHECK (true);

-- 신고는 누구나 생성/조회 가능
CREATE POLICY "Anyone can create reports" ON content_reports
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read reports" ON content_reports
    FOR SELECT USING (true);

-- creatures 테이블에서 차단된 콘텐츠 필터링
DROP POLICY IF EXISTS "Anyone can read creatures" ON creatures;
CREATE POLICY "Anyone can read approved creatures" ON creatures
    FOR SELECT USING (moderation_status != 'blocked');

-- 댓글 기능 대비 테이블 (추후 확장용)
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creature_id UUID REFERENCES creatures(id) ON DELETE CASCADE,
    author_session_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    moderation_status VARCHAR(20) DEFAULT 'approved',
    moderation_id VARCHAR(255) NULL,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved comments" ON comments
    FOR SELECT USING (moderation_status != 'blocked');

CREATE POLICY "Authors can insert comments" ON comments
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = author_session_id);

-- 통계 뷰 생성 (성능 최적화)
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

CREATE OR REPLACE VIEW report_summary AS  
SELECT
    COUNT(*) as total_reports,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_reports,
    SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_reports,
    json_object_agg(reason, reason_count) as reasons_breakdown
FROM (
    SELECT 
        status,
        reason,
        COUNT(*) as reason_count
    FROM content_reports 
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY status, reason
) subquery;

-- 함수: 자동 검열 처리
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

-- 트리거: 신고 추가 시 자동 검열 실행
CREATE OR REPLACE FUNCTION trigger_auto_moderate()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM auto_moderate_content(NEW.content_id, NEW.content_type);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_moderate_on_report ON content_reports;
CREATE TRIGGER auto_moderate_on_report
    AFTER INSERT ON content_reports
    FOR EACH ROW
    EXECUTE FUNCTION trigger_auto_moderate();

COMMENT ON TABLE moderation_logs IS '콘텐츠 자동 검열 로그';
COMMENT ON TABLE content_reports IS '사용자 신고 데이터';  
COMMENT ON COLUMN creatures.moderation_status IS 'approved: 승인됨, hidden: 숨김, blocked: 차단됨';
COMMENT ON FUNCTION auto_moderate_content IS '신고 누적 시 자동 조치 함수';