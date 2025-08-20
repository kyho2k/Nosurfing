import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // 먼저 comments 테이블이 존재하는지 확인
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'comments')

    if (tables && tables.length > 0) {
      return NextResponse.json({
        success: true,
        message: "댓글 테이블이 이미 존재합니다."
      })
    }

    // 테이블 생성
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS comments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        creature_id UUID NOT NULL,
        author_session_id UUID NOT NULL,
        author_nickname VARCHAR(50) DEFAULT 'Anonymous',
        content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 1000),
        parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NULL,
        like_count INTEGER DEFAULT 0,
        moderation_status VARCHAR(20) DEFAULT 'approved',
        is_edited BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    const createLikesTableSQL = `
      CREATE TABLE IF NOT EXISTS comment_likes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
        user_session_id UUID NOT NULL,
        ip_hash VARCHAR(64),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(comment_id, user_session_id)
      );
    `

    // 인덱스 생성
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_comments_creature_id ON comments(creature_id);
      CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_comments_moderation_status ON comments(moderation_status);
      CREATE INDEX IF NOT EXISTS idx_comments_author_session ON comments(author_session_id);
      CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id);
      CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
      CREATE INDEX IF NOT EXISTS idx_comment_likes_session ON comment_likes(user_session_id);
    `

    // RLS 설정
    const rlsSQL = `
      ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY IF NOT EXISTS "Anyone can read approved comments" ON comments
        FOR SELECT USING (moderation_status != 'blocked');
      
      CREATE POLICY IF NOT EXISTS "Anyone can create comments" ON comments
        FOR INSERT WITH CHECK (true);
      
      CREATE POLICY IF NOT EXISTS "Anyone can read comment likes" ON comment_likes
        FOR SELECT USING (true);
      
      CREATE POLICY IF NOT EXISTS "Anyone can create comment likes" ON comment_likes
        FOR INSERT WITH CHECK (true);
    `

    // 트리거 함수
    const triggerFunctionSQL = `
      CREATE OR REPLACE FUNCTION update_comment_like_count()
      RETURNS TRIGGER AS $$
      BEGIN
          IF TG_OP = 'INSERT' THEN
              UPDATE comments 
              SET like_count = like_count + 1 
              WHERE id = NEW.comment_id;
              RETURN NEW;
          ELSIF TG_OP = 'DELETE' THEN
              UPDATE comments 
              SET like_count = like_count - 1 
              WHERE id = OLD.comment_id;
              RETURN OLD;
          END IF;
          RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER IF NOT EXISTS comment_like_count_trigger
          AFTER INSERT OR DELETE ON comment_likes
          FOR EACH ROW
          EXECUTE FUNCTION update_comment_like_count();

      CREATE OR REPLACE FUNCTION generate_random_nickname()
      RETURNS TEXT AS $$
      DECLARE
          prefixes TEXT[] := ARRAY['무서운', '공포의', '어둠의', '그림자', '유령', '괴물', '밤의', '소름돋는'];
          suffixes TEXT[] := ARRAY['방문자', '관찰자', '존재', '그림자', '목격자', '탐험가', '수집가', '이야기꾼'];
          random_number INTEGER;
      BEGIN
          random_number := floor(random() * 9999) + 1;
          RETURN prefixes[floor(random() * array_length(prefixes, 1)) + 1] || 
                 suffixes[floor(random() * array_length(suffixes, 1)) + 1] || 
                 '#' || random_number;
      END;
      $$ LANGUAGE plpgsql;
    `

    // SQL 실행 (관리자 권한으로 직접 실행해야 함)
    console.log("댓글 시스템 설정을 위한 SQL:")
    console.log("1. 테이블 생성:", createTableSQL)
    console.log("2. 좋아요 테이블:", createLikesTableSQL)
    console.log("3. 인덱스 생성:", createIndexesSQL)
    console.log("4. RLS 정책:", rlsSQL)
    console.log("5. 트리거 함수:", triggerFunctionSQL)

    return NextResponse.json({
      success: false,
      message: "Supabase Studio에서 직접 실행이 필요합니다",
      sql: {
        tables: createTableSQL + createLikesTableSQL,
        indexes: createIndexesSQL,
        rls: rlsSQL,
        functions: triggerFunctionSQL
      }
    })

  } catch (error: any) {
    console.error("댓글 시스템 설정 오류:", error)
    return NextResponse.json(
      { 
        error: "댓글 시스템 설정에 실패했습니다",
        details: error.message 
      },
      { status: 500 }
    )
  }
}