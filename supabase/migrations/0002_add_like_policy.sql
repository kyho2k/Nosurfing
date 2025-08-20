-- 좋아요 기능을 위한 PostgreSQL 함수 생성

-- 좋아요 증가 함수 (RLS 우회)
CREATE OR REPLACE FUNCTION increment_creature_like_count(creature_uuid uuid)
RETURNS json
SECURITY DEFINER -- 함수 소유자 권한으로 실행 (RLS 우회)
LANGUAGE plpgsql
AS $$
DECLARE
    result_row json;
    creature_bigint_id bigint;
BEGIN
    -- UUID를 bigint ID로 변환
    SELECT id INTO creature_bigint_id 
    FROM public.creatures 
    WHERE id::text = creature_uuid::text;
    
    IF creature_bigint_id IS NULL THEN
        RAISE EXCEPTION 'Creature with uuid % not found', creature_uuid;
    END IF;
    
    -- like_count 증가
    UPDATE public.creatures 
    SET like_count = like_count + 1 
    WHERE id = creature_bigint_id;
    
    -- 업데이트된 정보 반환
    SELECT json_build_object(
        'success', true,
        'like_count', like_count
    ) INTO result_row
    FROM public.creatures
    WHERE id = creature_bigint_id;
    
    RETURN result_row;
END;
$$;

-- 함수에 대한 설명 추가
COMMENT ON FUNCTION increment_creature_like_count(bigint) IS '좋아요 수를 안전하게 증가시키는 함수 (RLS 우회)';

-- 익명 사용자도 함수를 실행할 수 있도록 권한 부여
GRANT EXECUTE ON FUNCTION increment_creature_like_count(bigint) TO anon;
GRANT EXECUTE ON FUNCTION increment_creature_like_count(bigint) TO authenticated;