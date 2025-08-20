-- 게시물 좋아요 중복 방지를 위한 테이블 생성
CREATE TABLE IF NOT EXISTS public.creature_likes (
    id bigserial PRIMARY KEY,
    creature_id bigint NOT NULL REFERENCES public.creatures(id) ON DELETE CASCADE,
    user_session_id uuid NOT NULL,
    ip_hash text,
    created_at timestamptz DEFAULT now()
);

-- 중복 방지를 위한 유니크 제약 조건
CREATE UNIQUE INDEX IF NOT EXISTS creature_likes_unique_session 
ON public.creature_likes(creature_id, user_session_id);

-- 성능을 위한 인덱스
CREATE INDEX IF NOT EXISTS creature_likes_creature_id_idx 
ON public.creature_likes(creature_id);

CREATE INDEX IF NOT EXISTS creature_likes_session_id_idx 
ON public.creature_likes(user_session_id);

-- RLS 정책 설정
ALTER TABLE public.creature_likes ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 조회 가능
CREATE POLICY "Anyone can view creature likes" 
ON public.creature_likes FOR SELECT 
USING (true);

-- 본인의 좋아요만 삽입 가능
CREATE POLICY "Users can insert their own likes" 
ON public.creature_likes FOR INSERT 
WITH CHECK (auth.uid()::text = user_session_id::text OR auth.uid() IS NULL);

-- 본인의 좋아요만 삭제 가능
CREATE POLICY "Users can delete their own likes" 
ON public.creature_likes FOR DELETE 
USING (auth.uid()::text = user_session_id::text OR auth.uid() IS NULL);

-- 함수: 게시물 좋아요 추가 (중복 방지)
CREATE OR REPLACE FUNCTION add_creature_like(
    p_creature_id bigint,
    p_user_session_id uuid,
    p_ip_hash text DEFAULT NULL
)
RETURNS json
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    existing_like_id bigint;
    new_like_count integer;
    result_json json;
BEGIN
    -- 기존 좋아요 확인
    SELECT id INTO existing_like_id 
    FROM public.creature_likes 
    WHERE creature_id = p_creature_id 
    AND user_session_id = p_user_session_id;
    
    -- 이미 좋아요를 누른 경우
    IF existing_like_id IS NOT NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', '이미 좋아요를 누른 게시물입니다.',
            'like_count', (
                SELECT like_count 
                FROM public.creatures 
                WHERE id = p_creature_id
            )
        );
    END IF;
    
    -- 좋아요 추가
    INSERT INTO public.creature_likes (creature_id, user_session_id, ip_hash)
    VALUES (p_creature_id, p_user_session_id, p_ip_hash);
    
    -- creatures 테이블의 like_count 증가
    UPDATE public.creatures 
    SET like_count = like_count + 1 
    WHERE id = p_creature_id
    RETURNING like_count INTO new_like_count;
    
    -- 결과 반환
    RETURN json_build_object(
        'success', true,
        'message', '좋아요가 추가되었습니다.',
        'like_count', new_like_count
    );
END;
$$;

-- 함수: 게시물 좋아요 제거
CREATE OR REPLACE FUNCTION remove_creature_like(
    p_creature_id bigint,
    p_user_session_id uuid
)
RETURNS json
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    existing_like_id bigint;
    new_like_count integer;
BEGIN
    -- 기존 좋아요 확인
    SELECT id INTO existing_like_id 
    FROM public.creature_likes 
    WHERE creature_id = p_creature_id 
    AND user_session_id = p_user_session_id;
    
    -- 좋아요를 누르지 않은 경우
    IF existing_like_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', '좋아요를 누르지 않은 게시물입니다.',
            'like_count', (
                SELECT like_count 
                FROM public.creatures 
                WHERE id = p_creature_id
            )
        );
    END IF;
    
    -- 좋아요 제거
    DELETE FROM public.creature_likes 
    WHERE id = existing_like_id;
    
    -- creatures 테이블의 like_count 감소
    UPDATE public.creatures 
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = p_creature_id
    RETURNING like_count INTO new_like_count;
    
    -- 결과 반환
    RETURN json_build_object(
        'success', true,
        'message', '좋아요가 취소되었습니다.',
        'like_count', new_like_count
    );
END;
$$;

-- 함수: 사용자의 좋아요 상태 확인
CREATE OR REPLACE FUNCTION check_creature_like_status(
    p_creature_id bigint,
    p_user_session_id uuid
)
RETURNS boolean
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    like_exists boolean := false;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM public.creature_likes 
        WHERE creature_id = p_creature_id 
        AND user_session_id = p_user_session_id
    ) INTO like_exists;
    
    RETURN like_exists;
END;
$$;

-- 함수 권한 부여
GRANT EXECUTE ON FUNCTION add_creature_like(bigint, uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION remove_creature_like(bigint, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_creature_like_status(bigint, uuid) TO anon, authenticated;