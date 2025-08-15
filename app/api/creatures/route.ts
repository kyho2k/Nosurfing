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

    if (userError || !user) {
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
          author_session_id: user.id, // Use the user's UUID as author_session_id
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

    if (userError || !user) {
      console.error("Error getting user session for PATCH:", userError);
      return NextResponse.json({ error: "Unauthorized - 익명 인증 필요" }, { status: 401 });
    }

    // 현재 like_count를 조회한 후 1 증가
    console.log(`Incrementing like_count for creature_id: ${id}`);
    
    // 먼저 현재 값을 조회
    const { data: currentData, error: fetchError } = await supabase
      .from('creatures')
      .select('like_count')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error("Error fetching current like_count:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const newLikeCount = (currentData.like_count || 0) + 1;

    // 업데이트 실행
    const { data, error } = await supabase
      .from('creatures')
      .update({ like_count: newLikeCount })
      .eq('id', id)
      .select();

    if (error) {
      console.error("Error updating like_count:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log(`Successfully incremented like_count to ${newLikeCount} for creature_id: ${id}. Data:`, data);

    return NextResponse.json({ message: "Like count incremented", data }, { status: 200 });
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

    if (userError || !user) {
      console.error("Error getting user session for delete:", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("creatures")
      .delete()
      .eq("id", id)
      .eq("author_session_id", user.id); // Ensure only author can delete

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