import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

// 배지 타입 정의
interface BadgeType {
  id: string
  name: string
  description: string
  icon: string
  requirement: {
    type: 'creatures_created' | 'likes_given' | 'likes_received' | 'game_score' | 'days_active'
    value: number
  }
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
}

// 사전 정의된 배지들
const BADGES: BadgeType[] = [
  // 창작 관련 배지
  {
    id: 'first_creature',
    name: '첫 번째 존재',
    description: '첫 번째 존재를 만들었습니다',
    icon: '👶',
    requirement: { type: 'creatures_created', value: 1 },
    rarity: 'common'
  },
  {
    id: 'prolific_creator',
    name: '다작 귀신',
    description: '10편 이상의 존재를 만들었습니다',
    icon: '📚',
    requirement: { type: 'creatures_created', value: 10 },
    rarity: 'uncommon'
  },
  {
    id: 'master_creator',
    name: '존재 마스터',
    description: '50편의 존재를 만든 진정한 창작자',
    icon: '👑',
    requirement: { type: 'creatures_created', value: 50 },
    rarity: 'epic'
  },
  
  // 좋아요 관련 배지
  {
    id: 'first_like',
    name: '첫 번째 공감',
    description: '첫 좋아요를 받았습니다',
    icon: '❤️',
    requirement: { type: 'likes_received', value: 1 },
    rarity: 'common'
  },
  {
    id: 'popular_creator',
    name: '인기 작가',
    description: '총 100개의 좋아요를 받았습니다',
    icon: '⭐',
    requirement: { type: 'likes_received', value: 100 },
    rarity: 'rare'
  },
  {
    id: 'legend_creator',
    name: '전설의 작가',
    description: '총 500개의 좋아요를 받은 전설',
    icon: '🌟',
    requirement: { type: 'likes_received', value: 500 },
    rarity: 'legendary'
  },
  
  // 커뮤니티 참여 배지
  {
    id: 'supporter',
    name: '열혈 관객',
    description: '50번 이상 좋아요를 눌렀습니다',
    icon: '👍',
    requirement: { type: 'likes_given', value: 50 },
    rarity: 'uncommon'
  },
  {
    id: 'game_beginner',
    name: '게임 입문자',
    description: '미니게임에서 1000점을 달성했습니다',
    icon: '🎮',
    requirement: { type: 'game_score', value: 1000 },
    rarity: 'common'
  },
  {
    id: 'game_master',
    name: '게임 마스터',
    description: '미니게임에서 10000점을 달성한 고수',
    icon: '🏆',
    requirement: { type: 'game_score', value: 10000 },
    rarity: 'rare'
  }
];

// 레벨 계산 함수
function calculateLevel(totalExp: number): { level: number, currentExp: number, nextLevelExp: number } {
  // 레벨당 필요 경험치: 100 * level^1.5
  let level = 1;
  let expForNextLevel = 100;
  let totalExpForCurrentLevel = 0;
  
  while (totalExp >= expForNextLevel) {
    totalExpForCurrentLevel = expForNextLevel;
    level++;
    expForNextLevel = Math.floor(100 * Math.pow(level, 1.5));
  }
  
  const currentExp = totalExp - totalExpForCurrentLevel + expForNextLevel - Math.floor(100 * Math.pow(level - 1, 1.5));
  const nextLevelExp = Math.floor(100 * Math.pow(level, 1.5)) - totalExpForCurrentLevel;
  
  return { level: level - 1, currentExp, nextLevelExp };
}

// 경험치 계산 함수
function calculateTotalExp(stats: any): number {
  return (stats.creatures_created || 0) * 50 +     // 존재 생성: 50exp
         (stats.likes_received || 0) * 10 +        // 좋아요 받기: 10exp
         (stats.likes_given || 0) * 2 +            // 좋아요 주기: 2exp
         Math.floor((stats.game_score || 0) / 100); // 게임 점수: 100점당 1exp
}

export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'stats';

  try {
    // 현재 사용자의 세션 확인 (쿠키 기반)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      // 익명 사용자를 위한 로컬 데이터만 반환
      return NextResponse.json({
        isAnonymous: true,
        level: 1,
        currentExp: 0,
        nextLevelExp: 100,
        totalExp: 0,
        badges: [],
        stats: {
          creatures_created: 0,
          likes_received: 0,
          likes_given: 0,
          game_score: parseInt(request.headers.get('x-game-score') || '0')
        }
      });
    }

    if (action === 'badges') {
      // 모든 배지 정보 반환
      return NextResponse.json({
        badges: BADGES,
        rarityColors: {
          common: '#6b7280',
          uncommon: '#10b981',
          rare: '#3b82f6',
          epic: '#8b5cf6',
          legendary: '#f59e0b'
        }
      });
    }

    // 사용자 통계 조회
    const [creaturesResult, likesGivenResult, likesReceivedResult] = await Promise.all([
      // 생성한 존재 수
      supabase
        .from('creatures')
        .select('id')
        .eq('author_session_id', user.id),
      
      // 준 좋아요 수 (실제로는 별도 테이블이 필요하지만 임시로 0)
      Promise.resolve({ data: [], error: null }),
      
      // 받은 좋아요 수
      supabase
        .from('creatures')
        .select('like_count')
        .eq('author_session_id', user.id)
    ]);

    const stats = {
      creatures_created: creaturesResult.data?.length || 0,
      likes_received: likesReceivedResult.data?.reduce((sum, creature) => sum + (creature.like_count || 0), 0) || 0,
      likes_given: 0, // TODO: 실제 좋아요 준 횟수 계산
      game_score: parseInt(request.headers.get('x-game-score') || '0') // 클라이언트에서 전송
    };

    // 경험치 및 레벨 계산
    const totalExp = calculateTotalExp(stats);
    const levelInfo = calculateLevel(totalExp);

    // 획득한 배지 확인
    const earnedBadges = BADGES.filter(badge => {
      const statValue = stats[badge.requirement.type as keyof typeof stats] || 0;
      return statValue >= badge.requirement.value;
    });

    return NextResponse.json({
      isAnonymous: false,
      ...levelInfo,
      totalExp,
      badges: earnedBadges,
      allBadges: BADGES,
      stats,
      title: getTitleByLevel(levelInfo.level)
    });

  } catch (error: any) {
    console.error("Error in GET /api/achievements:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 레벨별 칭호
function getTitleByLevel(level: number): string {
  if (level >= 50) return "공포의 제왕"
  if (level >= 40) return "어둠의 주인"
  if (level >= 30) return "공포 마스터"
  if (level >= 20) return "괴담 전문가"
  if (level >= 10) return "무서운 이야기꾼"
  if (level >= 5) return "초보 작가"
  return "신참 유령"
}

// 배지 업데이트 (POST)
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  
  try {
    const { gameScore } = await request.json();
    
    // 게임 점수 업데이트 (세션 기반)
    // 실제로는 별도의 user_achievements 테이블에 저장해야 함
    
    return NextResponse.json({ 
      success: true, 
      message: "Achievement data updated" 
    });

  } catch (error: any) {
    console.error("Error in POST /api/achievements:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}