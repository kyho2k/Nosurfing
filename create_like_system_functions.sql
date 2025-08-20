-- 좋아요 시스템 테이블 생성 (중복 방지용)
CREATE TABLE IF NOT EXISTS public.creature_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creature_id INTEGER NOT NULL REFERENCES public.creatures(id) ON DELETE CASCADE,
    user_session_id TEXT NOT NULL,
    ip_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 동일 사용자의 중복 좋아요 방지
    UNIQUE(creature_id, user_session_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_creature_likes_creature_id ON public.creature_likes(creature_id);
CREATE INDEX IF NOT EXISTS idx_creature_likes_session_id ON public.creature_likes(user_session_id);

-- RLS 정책 설정
ALTER TABLE public.creature_likes ENABLE ROW LEVEL SECURITY;

-- 좋아요 추가 정책 (누구나 추가 가능)
DROP POLICY IF EXISTS "Anyone can insert likes" ON public.creature_likes;
CREATE POLICY "Anyone can insert likes" ON public.creature_likes
    FOR INSERT WITH CHECK (true);

-- 좋아요 조회 정책 (누구나 조회 가능)
DROP POLICY IF EXISTS "Anyone can select likes" ON public.creature_likes;
CREATE POLICY "Anyone can select likes" ON public.creature_likes
    FOR SELECT USING (true);

-- 좋아요 삭제 정책 (본인 것만 삭제 가능)
DROP POLICY IF EXISTS "Users can delete own likes" ON public.creature_likes;
CREATE POLICY "Users can delete own likes" ON public.creature_likes
    FOR DELETE USING (user_session_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 좋아요 추가 함수 생성
CREATE OR REPLACE FUNCTION public.add_creature_like(
    p_creature_id INTEGER,
    p_user_session_id TEXT,
    p_ip_hash TEXT DEFAULT NULL
)
RETURNS JSON
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    v_like_count INTEGER;
    v_result JSON;
BEGIN
    -- 게시물 존재 확인
    IF NOT EXISTS (SELECT 1 FROM public.creatures WHERE id = p_creature_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', '게시물을 찾을 수 없습니다.'
        );
    END IF;

    -- 이미 좋아요했는지 확인
    IF EXISTS (
        SELECT 1 FROM public.creature_likes 
        WHERE creature_id = p_creature_id 
        AND user_session_id = p_user_session_id
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', '이미 좋아요를 누르셨습니다.'
        );
    END IF;

    -- 좋아요 레코드 추가
    INSERT INTO public.creature_likes (creature_id, user_session_id, ip_hash)
    VALUES (p_creature_id, p_user_session_id, p_ip_hash);

    -- 게시물의 like_count 업데이트
    UPDATE public.creatures 
    SET like_count = like_count + 1,
        updated_at = NOW()
    WHERE id = p_creature_id;

    -- 업데이트된 좋아요 수 가져오기
    SELECT like_count INTO v_like_count
    FROM public.creatures
    WHERE id = p_creature_id;

    RETURN json_build_object(
        'success', true,
        'like_count', v_like_count,
        'message', '좋아요가 추가되었습니다.'
    );

EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object(
            'success', false,
            'error', '이미 좋아요를 누르셨습니다.'
        );
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', '좋아요 추가 중 오류가 발생했습니다: ' || SQLERRM
        );
END;
$$;

-- 좋아요 제거 함수 생성
CREATE OR REPLACE FUNCTION public.remove_creature_like(
    p_creature_id INTEGER,
    p_user_session_id TEXT
)
RETURNS JSON
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    v_like_count INTEGER;
    v_deleted_count INTEGER;
BEGIN
    -- 좋아요 레코드 삭제
    DELETE FROM public.creature_likes
    WHERE creature_id = p_creature_id 
    AND user_session_id = p_user_session_id;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    -- 삭제된 레코드가 없으면 오류 반환
    IF v_deleted_count = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', '좋아요를 찾을 수 없습니다.'
        );
    END IF;

    -- 게시물의 like_count 업데이트
    UPDATE public.creatures 
    SET like_count = GREATEST(like_count - 1, 0),
        updated_at = NOW()
    WHERE id = p_creature_id;

    -- 업데이트된 좋아요 수 가져오기
    SELECT like_count INTO v_like_count
    FROM public.creatures
    WHERE id = p_creature_id;

    RETURN json_build_object(
        'success', true,
        'like_count', v_like_count,
        'message', '좋아요가 취소되었습니다.'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', '좋아요 취소 중 오류가 발생했습니다: ' || SQLERRM
        );
END;
$$;

-- 좋아요 상태 확인 함수 생성
CREATE OR REPLACE FUNCTION public.check_creature_like_status(
    p_creature_id INTEGER,
    p_user_session_id TEXT
)
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.creature_likes
        WHERE creature_id = p_creature_id 
        AND user_session_id = p_user_session_id
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;

-- 함수들에 대한 권한 부여
GRANT EXECUTE ON FUNCTION public.add_creature_like(INTEGER, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.add_creature_like(INTEGER, TEXT, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION public.remove_creature_like(INTEGER, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.remove_creature_like(INTEGER, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION public.check_creature_like_status(INTEGER, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_creature_like_status(INTEGER, TEXT) TO authenticated;

-- creatures 테이블에 대한 업데이트 권한 설정
DROP POLICY IF EXISTS "Functions can update like_count" ON public.creatures;
CREATE POLICY "Functions can update like_count" ON public.creatures
    FOR UPDATE USING (true);

-- 초기 데이터 정리 (like_count가 NULL인 경우 0으로 설정)
UPDATE public.creatures SET like_count = 0 WHERE like_count IS NULL;