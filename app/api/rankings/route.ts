import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { searchParams } = new URL(request.url);
  
  // 쿼리 파라미터
  const period = searchParams.get('period') || 'monthly'; // monthly, weekly, daily
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    let startDate: string;
    const now = new Date();
    
    // 기간별 시작일 계산
    switch (period) {
      case 'daily':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        startDate = today.toISOString();
        break;
      case 'weekly':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // 이번 주 일요일
        weekStart.setHours(0, 0, 0, 0);
        startDate = weekStart.toISOString();
        break;
      case 'monthly':
      default:
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate = monthStart.toISOString();
        break;
    }

    // 베스트 게시물 조회 (좋아요 수 기준 내림차순)
    const { data: bestCreatures, error } = await supabase
      .from("creatures")
      .select(`
        id,
        name,
        description,
        story,
        image_url,
        appearance_time,
        location,
        creature_type,
        like_count,
        created_at,
        author_session_id
      `)
      .gte('created_at', startDate)
      .not('like_count', 'is', null)
      .gte('like_count', 1)
      .order('like_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching best creatures:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 추가 통계 정보
    const { data: totalStats, error: statsError } = await supabase
      .from("creatures")
      .select('id, like_count, created_at')
      .gte('created_at', startDate);

    let stats = {
      totalCreatures: 0,
      totalLikes: 0,
      averageLikes: 0,
      topScore: 0
    };

    if (!statsError && totalStats) {
      const totalLikes = totalStats.reduce((sum, creature) => sum + (creature.like_count || 0), 0);
      const totalCreatures = totalStats.length;
      
      stats = {
        totalCreatures: totalCreatures,
        totalLikes: totalLikes,
        averageLikes: totalCreatures > 0 ? Math.round(totalLikes / totalCreatures * 10) / 10 : 0,
        topScore: bestCreatures && bestCreatures.length > 0 ? (bestCreatures[0].like_count || 0) : 0
      };
    }

    // 랭킹 정보 추가
    const rankedCreatures = bestCreatures?.map((creature, index) => ({
      ...creature,
      rank: index + 1,
      rankBadge: index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}위`
    })) || [];

    return NextResponse.json({
      period,
      startDate,
      creatures: rankedCreatures,
      stats,
      generatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Unexpected error in GET /api/rankings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}