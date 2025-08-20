#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// 현재 파일의 경로 가져오기
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 환경 변수 로드
const supabaseUrl = 'https://arrpuarrykptututjdnq.supabase.co'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceRoleKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY 환경 변수가 필요합니다.')
  console.error('Supabase 대시보드에서 Service Role 키를 가져와 설정하세요.')
  process.exit(1)
}

// Supabase 클라이언트 생성 (Service Role 키 사용)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applySchema() {
  try {
    console.log('🔄 무서핑 데이터베이스 스키마 적용 중...')
    
    // 완전한 스키마 파일 읽기
    const schemaPath = join(__dirname, 'supabase', 'migrations', '000_complete_schema.sql')
    const schemaSql = readFileSync(schemaPath, 'utf8')
    
    console.log('📖 스키마 파일을 읽었습니다.')
    
    // RLS 정책 등 복잡한 SQL을 처리하기 위해 여러 단계로 분할
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`🔧 ${statements.length}개의 SQL 구문을 실행합니다...`)
    
    let successCount = 0
    let errorCount = 0
    
    for (const [index, statement] of statements.entries()) {
      try {
        if (statement.trim()) {
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
          
          if (error) {
            console.error(`❌ 구문 ${index + 1} 실행 실패:`, error.message)
            errorCount++
          } else {
            console.log(`✅ 구문 ${index + 1} 실행 성공`)
            successCount++
          }
        }
      } catch (err) {
        console.error(`❌ 구문 ${index + 1} 실행 중 오류:`, err.message)
        errorCount++
      }
    }
    
    console.log('\n📊 실행 결과:')
    console.log(`✅ 성공: ${successCount}개`)
    console.log(`❌ 실패: ${errorCount}개`)
    
    if (errorCount === 0) {
      console.log('\n🎉 스키마가 성공적으로 적용되었습니다!')
    } else {
      console.log('\n⚠️  일부 구문이 실패했습니다. 수동으로 Supabase 대시보드에서 확인하세요.')
    }
    
    // 테이블 생성 확인
    console.log('\n🔍 테이블 생성 상태 확인 중...')
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['creatures', 'creature_likes', 'content_reports', 'ai_generation_requests', 'moderation_logs', 'user_achievements'])
    
    if (tableError) {
      console.error('❌ 테이블 확인 실패:', tableError.message)
    } else {
      console.log('📋 생성된 테이블:')
      tables.forEach(table => {
        console.log(`  ✅ ${table.table_name}`)
      })
    }
    
  } catch (error) {
    console.error('💥 스키마 적용 중 치명적 오류:', error)
    process.exit(1)
  }
}

// 직접 SQL 실행을 위한 함수 (Supabase가 지원하지 않는 경우 대안)
async function applySchemaDirectly() {
  try {
    console.log('🔄 직접 SQL 실행으로 스키마 적용 중...')
    
    // 스키마 파일 읽기
    const schemaPath = join(__dirname, 'supabase', 'migrations', '000_complete_schema.sql')
    const schemaSql = readFileSync(schemaPath, 'utf8')
    
    // 전체 SQL을 한 번에 실행
    const { data, error } = await supabase.rpc('execute_sql', {
      query: schemaSql
    })
    
    if (error) {
      console.error('❌ 스키마 적용 실패:', error)
      
      // 대안: 각 테이블을 개별적으로 생성
      console.log('🔄 개별 테이블 생성 시도...')
      await createTablesIndividually()
    } else {
      console.log('✅ 스키마가 성공적으로 적용되었습니다!')
    }
    
  } catch (error) {
    console.error('💥 직접 실행 중 오류:', error)
    await createTablesIndividually()
  }
}

async function createTablesIndividually() {
  console.log('📋 개별 테이블 생성 시작...')
  
  // creature_likes 테이블만 우선 생성 (가장 중요)
  const createLikesTable = `
    CREATE TABLE IF NOT EXISTS creature_likes (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      creature_id INTEGER REFERENCES creatures(id) ON DELETE CASCADE,
      user_session_id UUID NOT NULL,
      ip_hash VARCHAR(64),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(creature_id, user_session_id)
    );
  `
  
  try {
    const { error } = await supabase.rpc('exec', { sql: createLikesTable })
    if (error) {
      console.error('❌ creature_likes 테이블 생성 실패:', error)
    } else {
      console.log('✅ creature_likes 테이블 생성 성공')
    }
  } catch (err) {
    console.error('❌ 테이블 생성 중 오류:', err)
  }
  
  // 좋아요 카운트 업데이트 함수
  const createLikeFunction = `
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
  `
  
  const createLikeTrigger = `
    DROP TRIGGER IF EXISTS creature_like_count_trigger ON creature_likes;
    CREATE TRIGGER creature_like_count_trigger
        AFTER INSERT OR DELETE ON creature_likes
        FOR EACH ROW
        EXECUTE FUNCTION update_creature_like_count();
  `
  
  try {
    await supabase.rpc('exec', { sql: createLikeFunction })
    await supabase.rpc('exec', { sql: createLikeTrigger })
    console.log('✅ 좋아요 트리거 생성 성공')
  } catch (err) {
    console.error('❌ 트리거 생성 실패:', err)
  }
}

// 실행
console.log('🚀 무서핑 데이터베이스 마이그레이션 시작')
applySchemaDirectly()