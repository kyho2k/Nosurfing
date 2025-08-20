#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://arrpuarrykptututjdnq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycnB1YXJyeWtwdHV0dXRqZG5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDI2OTcsImV4cCI6MjA3MDQ3ODY5N30.0OrLCwkOEDVtgBa_DDmHZuR-MuMl4mSzTsPxucPc42I'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkTables() {
  console.log('🔍 현재 테이블 구조 확인 중...')
  
  try {
    // creatures 테이블 확인
    const { data: creatures, error: creaturesError } = await supabase
      .from('creatures')
      .select('*')
      .limit(1)
    
    if (creaturesError) {
      console.error('❌ creatures 테이블 접근 실패:', creaturesError.message)
    } else {
      console.log('✅ creatures 테이블 존재함')
    }
    
    // creature_likes 테이블 확인
    const { data: likes, error: likesError } = await supabase
      .from('creature_likes')
      .select('*')
      .limit(1)
    
    if (likesError) {
      console.error('❌ creature_likes 테이블 없음:', likesError.message)
      return false
    } else {
      console.log('✅ creature_likes 테이블 존재함')
      return true
    }
    
  } catch (error) {
    console.error('💥 테이블 확인 중 오류:', error)
    return false
  }
}

async function testLikeInsertion() {
  console.log('🧪 좋아요 삽입 테스트...')
  
  try {
    // 테스트 좋아요 삽입
    const { data, error } = await supabase
      .from('creature_likes')
      .insert({
        creature_id: 1,
        user_session_id: '00000000-0000-0000-0000-000000000000',
        ip_hash: 'test-hash'
      })
      .select()
    
    if (error) {
      console.error('❌ 좋아요 삽입 실패:', error.message)
      return false
    } else {
      console.log('✅ 좋아요 삽입 성공:', data)
      
      // 삽입한 테스트 데이터 삭제
      await supabase
        .from('creature_likes')
        .delete()
        .eq('id', data[0].id)
      
      console.log('🧹 테스트 데이터 정리 완료')
      return true
    }
    
  } catch (error) {
    console.error('💥 좋아요 테스트 중 오류:', error)
    return false
  }
}

async function main() {
  console.log('🚀 무서핑 좋아요 기능 테스트 시작')
  
  const tablesExist = await checkTables()
  
  if (tablesExist) {
    console.log('✅ 모든 필요한 테이블이 존재합니다!')
    
    const testResult = await testLikeInsertion()
    if (testResult) {
      console.log('🎉 좋아요 기능이 정상적으로 작동합니다!')
    } else {
      console.log('⚠️ 좋아요 기능에 문제가 있습니다.')
    }
  } else {
    console.log('❌ creature_likes 테이블이 없습니다.')
    console.log('📝 Supabase 대시보드의 SQL Editor에서 다음 스키마를 실행하세요:')
    console.log(`
-- creature_likes 테이블 생성
CREATE TABLE IF NOT EXISTS creature_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creature_id INTEGER REFERENCES creatures(id) ON DELETE CASCADE,
    user_session_id UUID NOT NULL,
    ip_hash VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(creature_id, user_session_id)
);

-- 좋아요 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_creature_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE creatures 
        SET like_count = like_count + 1 
        WHERE id = NEW.creature_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE creatures 
        SET like_count = like_count - 1 
        WHERE id = OLD.creature_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 좋아요 트리거 생성
DROP TRIGGER IF EXISTS creature_like_count_trigger ON creature_likes;
CREATE TRIGGER creature_like_count_trigger
    AFTER INSERT OR DELETE ON creature_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_creature_like_count();

-- RLS 정책 설정
ALTER TABLE creature_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read likes" ON creature_likes
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create likes" ON creature_likes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete their own likes" ON creature_likes
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_session_id::text);
    `)
  }
}

main().catch(console.error)