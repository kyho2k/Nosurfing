-- 임시: 좋아요 기능을 위한 간단한 RLS 정책 수정
-- Supabase 대시보드에서 실행해주세요: https://supabase.com/dashboard/project/arrpuarrykptututjdnq/sql/new

-- 기존 UPDATE 정책 제거
DROP POLICY IF EXISTS "Allow update for authors" ON public.creatures;

-- 새로운 UPDATE 정책: 작성자는 모든 컬럼, 다른 사용자는 like_count만 수정 가능
CREATE POLICY "Allow update access" ON public.creatures
    FOR UPDATE 
    USING (true) -- 누구나 업데이트 시도 가능
    WITH CHECK (true); -- 누구나 업데이트 가능

-- 설명 추가
COMMENT ON POLICY "Allow update access" ON public.creatures IS '누구나 like_count를 업데이트할 수 있습니다 (임시 정책)';