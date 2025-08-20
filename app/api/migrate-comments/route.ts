import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

export async function POST() {
  try {
    const supabase = await createServerClient()

    // 마이그레이션 SQL 실행
    const migrationSQL = `
      -- 댓글 테이블 생성 (이미 존재하면 무시)
      CREATE TABLE IF NOT EXISTS comments (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          creature_id UUID NOT NULL,
          author_session_id UUID NOT NULL,
          author_nickname VARCHAR(50) DEFAULT 'Anonymous',
          content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 1000),
          parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NULL,
          like_count INTEGER DEFAULT 0,
          moderation_status VARCHAR(20) DEFAULT 'approved',
          moderation_id VARCHAR(255) NULL,
          is_edited BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 댓글 좋아요 테이블 생성
      CREATE TABLE IF NOT EXISTS comment_likes (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
          user_session_id UUID NOT NULL,
          ip_hash VARCHAR(64),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(comment_id, user_session_id)
      );

      -- 인덱스 생성
      CREATE INDEX IF NOT EXISTS idx_comments_creature_id ON comments(creature_id);
      CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_comments_moderation_status ON comments(moderation_status);
      CREATE INDEX IF NOT EXISTS idx_comments_author_session ON comments(author_session_id);
      CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id);
      CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
      CREATE INDEX IF NOT EXISTS idx_comment_likes_session ON comment_likes(user_session_id);

      -- RLS 정책
      ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Anyone can read approved comments" ON comments;
      CREATE POLICY "Anyone can read approved comments" ON comments
          FOR SELECT USING (moderation_status != 'blocked');

      DROP POLICY IF EXISTS "Anyone can create comments" ON comments;
      CREATE POLICY "Anyone can create comments" ON comments
          FOR INSERT WITH CHECK (true);

      DROP POLICY IF EXISTS "Authors can update their comments" ON comments;
      CREATE POLICY "Authors can update their comments" ON comments
          FOR UPDATE USING (author_session_id::text = auth.jwt() ->> 'sub');

      DROP POLICY IF EXISTS "Authors can delete their comments" ON comments;
      CREATE POLICY "Authors can delete their comments" ON comments
          FOR DELETE USING (author_session_id::text = auth.jwt() ->> 'sub');

      -- 댓글 좋아요 RLS
      ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Anyone can read comment likes" ON comment_likes;
      CREATE POLICY "Anyone can read comment likes" ON comment_likes
          FOR SELECT USING (true);

      DROP POLICY IF EXISTS "Anyone can create comment likes" ON comment_likes;
      CREATE POLICY "Anyone can create comment likes" ON comment_likes
          FOR INSERT WITH CHECK (true);

      DROP POLICY IF EXISTS "Users can delete their own comment likes" ON comment_likes;
      CREATE POLICY "Users can delete their own comment likes" ON comment_likes
          FOR DELETE USING (user_session_id::text = auth.jwt() ->> 'sub');
    `

    // 댓글 테이블 생성
    const { error: commentsError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS comments (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            creature_id UUID NOT NULL,
            author_session_id UUID NOT NULL,
            author_nickname VARCHAR(50) DEFAULT 'Anonymous',
            content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 1000),
            parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NULL,
            like_count INTEGER DEFAULT 0,
            moderation_status VARCHAR(20) DEFAULT 'approved',
            moderation_id VARCHAR(255) NULL,
            is_edited BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (commentsError) {
      console.error("댓글 테이블 생성 오류:", commentsError)
      return NextResponse.json(
        { error: "댓글 테이블 생성에 실패했습니다.", details: commentsError },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "댓글 시스템 마이그레이션이 완료되었습니다."
    })

  } catch (error: any) {
    console.error("마이그레이션 API 오류:", error)
    return NextResponse.json(
      { error: "마이그레이션 중 오류가 발생했습니다.", details: error.message },
      { status: 500 }
    )
  }
}