-- 임시: creatures 테이블의 RLS 완전 비활성화 (테스트용)
-- Supabase 대시보드에서 실행해주세요: https://supabase.com/dashboard/project/arrpuarrykptututjdnq/sql/new

-- RLS 비활성화 (임시)
ALTER TABLE public.creatures DISABLE ROW LEVEL SECURITY;

-- 확인용 메시지
SELECT 'RLS disabled for creatures table - FOR TESTING ONLY' as status;