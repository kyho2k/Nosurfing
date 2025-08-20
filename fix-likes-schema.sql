-- 🔧 무서핑 좋아요 기능 수정용 SQL
-- Supabase 대시보드 > SQL Editor에서 실행하세요

-- 1. creature_likes 테이블 생성
CREATE TABLE IF NOT EXISTS creature_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creature_id INTEGER REFERENCES creatures(id) ON DELETE CASCADE,
    user_session_id UUID NOT NULL,
    ip_hash VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(creature_id, user_session_id)
);

-- 2. 좋아요 수 업데이트 함수
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

-- 3. 좋아요 트리거 생성
DROP TRIGGER IF EXISTS creature_like_count_trigger ON creature_likes;
CREATE TRIGGER creature_like_count_trigger
    AFTER INSERT OR DELETE ON creature_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_creature_like_count();

-- 4. RLS 정책 설정
ALTER TABLE creature_likes ENABLE ROW LEVEL SECURITY;

-- 5. 읽기 정책 (누구나 좋아요 목록 조회 가능)
CREATE POLICY "Anyone can read likes" ON creature_likes
    FOR SELECT USING (true);

-- 6. 생성 정책 (누구나 좋아요 생성 가능)
CREATE POLICY "Anyone can create likes" ON creature_likes
    FOR INSERT WITH CHECK (true);

-- 7. 삭제 정책 (자신의 좋아요만 삭제 가능)
CREATE POLICY "Users can delete their own likes" ON creature_likes
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_session_id::text);

-- 8. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_creature_likes_creature_id ON creature_likes(creature_id);
CREATE INDEX IF NOT EXISTS idx_creature_likes_session ON creature_likes(user_session_id);

-- 완료 확인
SELECT 'creature_likes 테이블과 관련 기능이 성공적으로 생성되었습니다!' as result;