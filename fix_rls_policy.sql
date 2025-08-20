-- 🔧 무서핑 좋아요 기능 RLS 정책 수정
-- Supabase Dashboard > SQL Editor에서 실행하세요

-- 방법 1: 임시로 RLS 완전 비활성화 (테스트용)
ALTER TABLE public.creatures DISABLE ROW LEVEL SECURITY;

-- 또는 방법 2: 더 관대한 UPDATE 정책 생성 (권장)
-- 먼저 기존 정책 삭제
DROP POLICY IF EXISTS "Authors can update their creatures" ON public.creatures;
DROP POLICY IF EXISTS "Allow update for authors" ON public.creatures;
DROP POLICY IF EXISTS "Allow update for authors or dev" ON public.creatures;

-- 새로운 관대한 UPDATE 정책 생성
CREATE POLICY "Anyone can update creatures" ON public.creatures
    FOR UPDATE USING (true);

-- 방법 3: PostgreSQL 함수 생성 (가장 안전)
CREATE OR REPLACE FUNCTION increment_creature_like_count(creature_uuid UUID)
RETURNS JSON
SECURITY DEFINER 
LANGUAGE plpgsql
AS $$
DECLARE
    result_row JSON;
    new_count INTEGER;
BEGIN
    -- like_count 증가
    UPDATE public.creatures 
    SET like_count = COALESCE(like_count, 0) + 1,
        updated_at = NOW()
    WHERE id = creature_uuid;
    
    -- 업데이트된 like_count 가져오기
    SELECT like_count INTO new_count
    FROM public.creatures 
    WHERE id = creature_uuid;
    
    -- 결과 반환
    SELECT json_build_object(
        'id', creature_uuid, 
        'like_count', new_count,
        'success', true
    ) INTO result_row;
    
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

-- 현재 상태 확인
SELECT 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN 'RLS 활성화됨' 
        ELSE 'RLS 비활성화됨' 
    END as status
FROM pg_tables 
WHERE tablename = 'creatures';

-- 정책 확인
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'creatures';

-- 현재 like_count 상태 확인
SELECT id, name, like_count FROM creatures ORDER BY id;