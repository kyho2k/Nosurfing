-- RLS 상태 확인
-- Supabase 대시보드에서 실행: https://supabase.com/dashboard/project/arrpuarrykptututjdnq/sql/new

SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN 'RLS Enabled' 
        ELSE 'RLS Disabled' 
    END as rls_status
FROM pg_tables 
WHERE tablename = 'creatures' AND schemaname = 'public';

-- 현재 정책들 확인
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'creatures' AND schemaname = 'public';