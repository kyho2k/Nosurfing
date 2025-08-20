-- 💬 댓글 시스템 구현
-- Supabase Studio > SQL Editor에서 실행하세요

-- ===================
-- 댓글 테이블 생성
-- ===================

-- 댓글 테이블 (기존 comments 테이블 확장)
DROP TABLE IF EXISTS comments;
CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creature_id UUID REFERENCES creatures(id) ON DELETE CASCADE NOT NULL,
    author_session_id UUID NOT NULL,
    author_nickname VARCHAR(50) DEFAULT 'Anonymous',
    content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 1000),
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NULL, -- 대댓글용
    like_count INTEGER DEFAULT 0,
    moderation_status VARCHAR(20) DEFAULT 'approved', -- 'approved', 'hidden', 'blocked'
    moderation_id VARCHAR(255) NULL,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 댓글 좋아요 테이블
CREATE TABLE comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
    user_session_id UUID NOT NULL,
    ip_hash VARCHAR(64), -- IP 해시 (중복 방지용)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_session_id)
);

-- 댓글 신고 테이블 (기존 content_reports 활용)
-- content_type에 'comment' 추가로 대응

-- ===================
-- 인덱스 생성 (성능 최적화)
-- ===================

-- 댓글 테이블 인덱스
CREATE INDEX idx_comments_creature_id ON comments(creature_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_comments_moderation_status ON comments(moderation_status);
CREATE INDEX idx_comments_author_session ON comments(author_session_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);

-- 댓글 좋아요 인덱스
CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_session ON comment_likes(user_session_id);

-- ===================
-- RLS (Row Level Security) 정책
-- ===================

-- 댓글 테이블 RLS 활성화
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 승인된 댓글은 누구나 읽기 가능
CREATE POLICY "Anyone can read approved comments" ON comments
    FOR SELECT USING (moderation_status != 'blocked');

-- 누구나 새 댓글 작성 가능
CREATE POLICY "Anyone can create comments" ON comments
    FOR INSERT WITH CHECK (true);

-- 작성자만 자신의 댓글 수정 가능 (5분 제한은 애플리케이션에서 처리)
CREATE POLICY "Authors can update their comments" ON comments
    FOR UPDATE USING (auth.jwt() ->> 'sub' = author_session_id::text);

-- 작성자만 자신의 댓글 삭제 가능
CREATE POLICY "Authors can delete their comments" ON comments
    FOR DELETE USING (auth.jwt() ->> 'sub' = author_session_id::text);

-- 댓글 좋아요 RLS
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comment likes" ON comment_likes
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create comment likes" ON comment_likes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete their own comment likes" ON comment_likes
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_session_id::text);

-- ===================
-- 트리거 함수들
-- ===================

-- 댓글 좋아요 수 업데이트 함수
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

-- 댓글 좋아요 트리거 생성
CREATE TRIGGER comment_like_count_trigger
    AFTER INSERT OR DELETE ON comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_like_count();

-- 댓글 수정 시간 업데이트 함수
CREATE OR REPLACE FUNCTION update_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.is_edited = true;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 댓글 수정 시간 트리거
CREATE TRIGGER comment_updated_at_trigger
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_updated_at();

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

-- ===================
-- 뷰 생성 (성능 최적화)
-- ===================

-- 댓글과 좋아요 수를 함께 조회하는 뷰
CREATE OR REPLACE VIEW comments_with_stats AS
SELECT 
    c.*,
    COALESCE(cl.like_count, 0) as actual_like_count,
    CASE 
        WHEN c.parent_comment_id IS NULL THEN 0
        ELSE 1
    END as is_reply
FROM comments c
LEFT JOIN (
    SELECT 
        comment_id,
        COUNT(*) as like_count
    FROM comment_likes
    GROUP BY comment_id
) cl ON c.id = cl.comment_id
WHERE c.moderation_status != 'blocked'
ORDER BY c.created_at ASC;

-- 대댓글 포함 계층 구조 뷰
CREATE OR REPLACE VIEW comments_threaded AS
WITH RECURSIVE comment_tree AS (
    -- 최상위 댓글
    SELECT 
        id,
        creature_id,
        author_session_id,
        author_nickname,
        content,
        parent_comment_id,
        like_count,
        moderation_status,
        created_at,
        updated_at,
        is_edited,
        0 as depth,
        ARRAY[created_at] as sort_path
    FROM comments
    WHERE parent_comment_id IS NULL 
      AND moderation_status != 'blocked'
    
    UNION ALL
    
    -- 대댓글들
    SELECT 
        c.id,
        c.creature_id,
        c.author_session_id,
        c.author_nickname,
        c.content,
        c.parent_comment_id,
        c.like_count,
        c.moderation_status,
        c.created_at,
        c.updated_at,
        c.is_edited,
        ct.depth + 1,
        ct.sort_path || c.created_at
    FROM comments c
    INNER JOIN comment_tree ct ON c.parent_comment_id = ct.id
    WHERE c.moderation_status != 'blocked'
      AND ct.depth < 3  -- 최대 3단계 깊이 제한
)
SELECT * FROM comment_tree
ORDER BY sort_path;

-- ===================
-- 테스트 데이터 삽입
-- ===================

-- 샘플 댓글 데이터 (기존 creatures가 있다면)
INSERT INTO comments (creature_id, author_session_id, author_nickname, content) 
SELECT 
    c.id,
    '11111111-1111-1111-1111-111111111111'::UUID,
    generate_random_nickname(),
    CASE 
        WHEN random() < 0.3 THEN '정말 무서워요... 😱'
        WHEN random() < 0.6 THEN '이런 이야기 더 있나요?'
        ELSE '밤에 이 글을 읽으면 안 되는 것 같아요'
    END
FROM creatures c
WHERE EXISTS (SELECT 1 FROM creatures)
LIMIT 3
ON CONFLICT DO NOTHING;

-- ===================
-- 권한 및 설명 추가
-- ===================

-- 테이블 설명
COMMENT ON TABLE comments IS '게시물 댓글 시스템';
COMMENT ON TABLE comment_likes IS '댓글 좋아요 기능';

COMMENT ON COLUMN comments.content IS '댓글 내용 (1-1000자)';
COMMENT ON COLUMN comments.parent_comment_id IS '대댓글의 경우 상위 댓글 ID';
COMMENT ON COLUMN comments.author_nickname IS '익명 닉네임 (자동 생성)';
COMMENT ON COLUMN comments.moderation_status IS 'approved: 승인, hidden: 숨김, blocked: 차단';

-- ===================
-- 완료 메시지
-- ===================

DO $$
BEGIN
    RAISE NOTICE '💬 댓글 시스템이 성공적으로 생성되었습니다!';
    RAISE NOTICE '📊 생성된 테이블: comments, comment_likes';
    RAISE NOTICE '🔒 RLS 정책이 적용되었습니다.';
    RAISE NOTICE '📈 성능 최적화 인덱스가 생성되었습니다.';
    RAISE NOTICE '🤖 자동 좋아요 카운트 및 닉네임 생성 기능이 활성화되었습니다.';
    RAISE NOTICE '🌲 대댓글 계층 구조 뷰가 생성되었습니다.';
END $$;