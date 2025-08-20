-- RLS를 우회하는 좋아요 증가 함수 생성
CREATE OR REPLACE FUNCTION increment_creature_like_count(creature_uuid UUID)
RETURNS JSON
SECURITY DEFINER 
LANGUAGE plpgsql
AS $$
DECLARE
    result_row JSON;
    current_count INTEGER;
BEGIN
    -- 현재 like_count 가져오기
    SELECT like_count INTO current_count 
    FROM public.creatures 
    WHERE id = creature_uuid;
    
    -- like_count 증가
    UPDATE public.creatures 
    SET like_count = COALESCE(like_count, 0) + 1,
        updated_at = NOW()
    WHERE id = creature_uuid;
    
    -- 업데이트된 데이터 반환
    SELECT json_build_object(
        'id', id, 
        'like_count', like_count,
        'success', true
    ) INTO result_row
    FROM public.creatures 
    WHERE id = creature_uuid;
    
    RETURN result_row;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- 함수에 대한 권한 부여
GRANT EXECUTE ON FUNCTION increment_creature_like_count(UUID) TO anon;
GRANT EXECUTE ON FUNCTION increment_creature_like_count(UUID) TO authenticated;

-- 테스트용: RLS 임시 비활성화 (개발용)
-- ALTER TABLE public.creatures DISABLE ROW LEVEL SECURITY;

-- 또는 더 관대한 UPDATE 정책 생성
DROP POLICY IF EXISTS "Anyone can update like_count" ON public.creatures;
CREATE POLICY "Anyone can update like_count" ON public.creatures
    FOR UPDATE USING (true);