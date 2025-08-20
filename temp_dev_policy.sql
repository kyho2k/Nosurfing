-- 개발 환경에서 임시로 UPDATE 정책을 더 관대하게 만들기
-- 기존 UPDATE 정책 삭제
DROP POLICY IF EXISTS "Allow update for authors" ON public.creatures;

-- 새로운 UPDATE 정책 생성 (개발 환경용)
-- author_session_id가 '00000000-0000-0000-0000-000000000000'인 경우에도 업데이트 허용
CREATE POLICY "Allow update for authors or dev" ON public.creatures
    FOR UPDATE USING (
        auth.uid() = author_session_id 
        OR author_session_id = '00000000-0000-0000-0000-000000000000'::uuid
    );

-- 현재 정책 상태 확인
SELECT * FROM pg_policies WHERE tablename = 'creatures';