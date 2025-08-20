-- 💬 무서핑 댓글 시스템 설정 SQL
-- Supabase Studio > SQL Editor에서 실행하세요
-- https://supabase.com/dashboard/project/arrpuarrykptututjdnq/sql/new

-- 1. 댓글 테이블 생성
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creature_id UUID NOT NULL,
  author_session_id UUID NOT NULL,
  author_nickname VARCHAR(50) DEFAULT 'Anonymous',
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 1000),
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NULL,
  like_count INTEGER DEFAULT 0,
  moderation_status VARCHAR(20) DEFAULT 'approved',
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 댓글 좋아요 테이블 생성
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  user_session_id UUID NOT NULL,
  ip_hash VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_session_id)
);

-- 3. 성능 최적화 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_comments_creature_id ON comments(creature_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_moderation_status ON comments(moderation_status);
CREATE INDEX IF NOT EXISTS idx_comments_author_session ON comments(author_session_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_session ON comment_likes(user_session_id);

-- 4. Row Level Security (RLS) 정책 설정
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (존재할 경우)
DROP POLICY IF EXISTS "Anyone can read approved comments" ON comments;
DROP POLICY IF EXISTS "Anyone can create comments" ON comments;
DROP POLICY IF EXISTS "Anyone can read comment likes" ON comment_likes;
DROP POLICY IF EXISTS "Anyone can create comment likes" ON comment_likes;

-- 댓글 읽기 정책 (승인된 댓글만)
CREATE POLICY "Anyone can read approved comments" ON comments
  FOR SELECT USING (moderation_status != 'blocked');

-- 댓글 작성 정책 (누구나 가능)
CREATE POLICY "Anyone can create comments" ON comments
  FOR INSERT WITH CHECK (true);

-- 댓글 좋아요 읽기 정책
CREATE POLICY "Anyone can read comment likes" ON comment_likes
  FOR SELECT USING (true);

-- 댓글 좋아요 작성 정책
CREATE POLICY "Anyone can create comment likes" ON comment_likes
  FOR INSERT WITH CHECK (true);

-- 5. 자동 기능 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE comments 
        SET like_count = like_count + 1 
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE comments 
        SET like_count = like_count - 1 
        WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거 삭제 (존재할 경우)
DROP TRIGGER IF EXISTS comment_like_count_trigger ON comment_likes;

-- 좋아요 수 자동 업데이트 트리거
CREATE TRIGGER comment_like_count_trigger
    AFTER INSERT OR DELETE ON comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_like_count();

-- 랜덤 닉네임 생성 함수
CREATE OR REPLACE FUNCTION generate_random_nickname()
RETURNS TEXT AS $$
DECLARE
    prefixes TEXT[] := ARRAY['무서운', '공포의', '어둠의', '그림자', '유령', '괴물', '밤의', '소름돋는'];
    suffixes TEXT[] := ARRAY['방문자', '관찰자', '존재', '그림자', '목격자', '탐험가', '수집가', '이야기꾼'];
    random_number INTEGER;
BEGIN
    random_number := floor(random() * 9999) + 1;
    RETURN prefixes[floor(random() * array_length(prefixes, 1)) + 1] || 
           suffixes[floor(random() * array_length(suffixes, 1)) + 1] || 
           '#' || random_number;
END;
$$ LANGUAGE plpgsql;

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '✅ 무서핑 댓글 시스템이 성공적으로 설정되었습니다!';
    RAISE NOTICE '📊 생성된 테이블: comments, comment_likes';
    RAISE NOTICE '🔒 RLS 보안 정책이 적용되었습니다';
    RAISE NOTICE '📈 성능 최적화 인덱스가 생성되었습니다';
    RAISE NOTICE '🤖 자동 좋아요 카운트 및 닉네임 생성 기능이 활성화되었습니다';
END $$;