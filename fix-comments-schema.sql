-- 🔧 댓글 시스템 스키마 수정
-- creature_id 타입을 UUID에서 INTEGER로 변경

-- 1. 기존 comments 테이블 삭제 및 재생성
DROP TABLE IF EXISTS comment_likes;
DROP TABLE IF EXISTS comments;

-- 2. 올바른 타입으로 댓글 테이블 재생성
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creature_id INTEGER NOT NULL,  -- UUID에서 INTEGER로 변경
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

-- 3. 댓글 좋아요 테이블 재생성
CREATE TABLE comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  user_session_id UUID NOT NULL,
  ip_hash VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_session_id)
);

-- 4. 성능 최적화 인덱스 생성
CREATE INDEX idx_comments_creature_id ON comments(creature_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_comments_moderation_status ON comments(moderation_status);
CREATE INDEX idx_comments_author_session ON comments(author_session_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_session ON comment_likes(user_session_id);

-- 5. Row Level Security (RLS) 정책 설정
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

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

-- 6. 자동 기능 트리거 함수 및 트리거 생성
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
    RAISE NOTICE '✅ 댓글 시스템 스키마가 수정되었습니다!';
    RAISE NOTICE '🔧 creature_id 타입이 INTEGER로 변경되었습니다';
    RAISE NOTICE '📊 모든 테이블과 정책이 재생성되었습니다';
END $$;