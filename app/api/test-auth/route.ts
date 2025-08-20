import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const supabase = createClient(url, key);
    
    // 익명 로그인
    const { data, error } = await supabase.auth.signInAnonymously();
    
    if (error) {
      console.error('Anonymous sign in failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      user_id: data.user?.id,
      access_token: data.session?.access_token,
      message: "Anonymous user created successfully"
    }, { status: 200 });
  } catch (e) {
    console.error("Unexpected error in GET /api/test-auth:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}