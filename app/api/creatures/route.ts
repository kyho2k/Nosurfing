import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      // Fetch single creature by ID
      const { data: creature, error } = await supabase
        .from("creatures")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching single creature:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!creature) {
        return NextResponse.json({ error: "Creature not found" }, { status: 404 });
      }

      return NextResponse.json(creature, { status: 200 });
    } else {
      // Fetch all creatures
      const { data: creatures, error } = await supabase
        .from("creatures")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching creatures:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(creatures, { status: 200 });
    }
  } catch (e) {
    console.error("Unexpected error in GET /api/creatures:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();

  try {
    const { name, description, story, image_url, appearance_time, location, creature_type } = await request.json();

    // Get the author_session_id from the current session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    let authorSessionId = user?.id;

    // 개발 환경에서 익명 로그인이 비활성화된 경우 임시 UUID 사용
    if ((!user || userError) && process.env.NODE_ENV === 'development') {
      console.warn("Anonymous auth disabled, using test UUID for development");
      authorSessionId = '00000000-0000-0000-0000-000000000000';
    } else if (userError || !user) {
      console.error("Error getting user session:", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("creatures")
      .insert([
        {
          name,
          description,
          story,
          image_url,
          appearance_time,
          location,
          creature_type,
          author_session_id: authorSessionId, // Use the user's UUID as author_session_id
        },
      ])
      .select();

    if (error) {
      console.error("Error inserting creature:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (e) {
    console.error("Unexpected error in POST /api/creatures:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH handler for liking a creature
export async function PATCH(request: NextRequest) {
  const supabase = await createServerClient();

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Creature ID is required" }, { status: 400 });
    }

    // 인증 확인 추가 (POST와 동일)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // 개발 환경에서는 인증 우회
    if ((!user || userError) && process.env.NODE_ENV === 'development') {
      console.warn("Anonymous auth disabled, allowing PATCH for development");
    } else if (userError || !user) {
      console.error("Error getting user session for PATCH:", userError);
      return NextResponse.json({ error: "Unauthorized - 익명 인증 필요" }, { status: 401 });
    }

    // 사용자 세션 ID 확인 (개발 환경에서는 임시 UUID 사용)
    const sessionId = user?.id || '00000000-0000-0000-0000-000000000000';
    
    console.log(`Processing like for creature_id: ${id}, session: ${sessionId}`);

    // PostgreSQL 함수를 통해 RLS 우회 시도
    console.log(`Attempting to increment like_count for creature ${id} using PostgreSQL function`);
    
    try {
      // 먼저 PostgreSQL 함수 호출 시도
      const { data: functionResult, error: functionError } = await supabase
        .rpc('increment_creature_like_count', { creature_uuid: id });

      if (!functionError && functionResult?.success) {
        const newLikeCount = functionResult.like_count;
        console.log(`Successfully incremented like_count using function for creature ${id}, new count: ${newLikeCount}`);
        
        return NextResponse.json({ 
          success: true, 
          newLikeCount: newLikeCount,
          message: "좋아요가 추가되었습니다!"
        });
      }
      
      console.log("PostgreSQL function not available or failed, trying direct update...");
    } catch (funcError) {
      console.log("Function call failed, falling back to direct update:", funcError);
    }

    // 폴백: 직접 UPDATE 시도
    console.log(`Fallback: Attempting direct increment for creature ${id}`);
    
    // 현재 like_count 조회
    const { data: currentCreature, error: fetchError } = await supabase
      .from('creatures')
      .select('like_count')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error("Error fetching current creature:", fetchError);
      return NextResponse.json({ 
        error: "데이터베이스 정책으로 인해 좋아요 기능이 제한되어 있습니다. 관리자에게 문의하세요.",
        details: fetchError.message 
      }, { status: 500 });
    }

    const newLikeCount = (currentCreature.like_count || 0) + 1;
    
    // like_count 업데이트 시도
    const { error: updateError } = await supabase
      .from('creatures')
      .update({ like_count: newLikeCount })
      .eq('id', id);

    if (updateError) {
      console.error("Error updating like_count:", updateError);
      return NextResponse.json({ 
        error: "좋아요 업데이트가 실패했습니다. 데이터베이스 정책을 확인해주세요.",
        details: updateError.message 
      }, { status: 500 });
    }

    console.log(`Direct update completed for creature ${id}, new count: ${newLikeCount}`);
    
    return NextResponse.json({ 
      success: true, 
      newLikeCount: newLikeCount,
      message: "좋아요가 추가되었습니다!"
    });
  } catch (e) {
    console.error("Unexpected error in PATCH /api/creatures:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE handler for a creature
export async function DELETE(request: NextRequest) {
  const supabase = await createServerClient();

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Creature ID is required" }, { status: 400 });
    }

    // Verify the user is the author (RLS will handle this on the DB side, but good to have a check here too)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    let authorSessionId = user?.id;

    // 개발 환경에서는 인증 우회
    if ((!user || userError) && process.env.NODE_ENV === 'development') {
      console.warn("Anonymous auth disabled, allowing DELETE for development");
      authorSessionId = '00000000-0000-0000-0000-000000000000';
    } else if (userError || !user) {
      console.error("Error getting user session for delete:", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("creatures")
      .delete()
      .eq("id", id)
      .eq("author_session_id", authorSessionId); // Ensure only author can delete

    if (error) {
      console.error("Error deleting creature:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Creature deleted successfully" }, { status: 200 });
  } catch (e) {
    console.error("Unexpected error in DELETE /api/creatures:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}