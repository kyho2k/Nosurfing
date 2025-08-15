import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // 환경변수 체크
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      return NextResponse.json(
        { error: "OpenAI API 키가 설정되지 않았습니다. .env.local 파일을 확인해주세요." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { prompt, name, location, appearance_time, creature_type, description } = body;

    // 입력 검증
    if (!prompt && (!name || !location)) {
      return NextResponse.json(
        { error: "프롬프트 또는 기본 정보(이름, 장소)가 필요합니다." },
        { status: 400 }
      );
    }

    // 이미지 생성을 위한 프롬프트 구성
    let imagePrompt = "";
    
    if (prompt) {
      // 사용자가 직접 프롬프트를 입력한 경우
      imagePrompt = `Create a dark, atmospheric horror illustration based on this concept: ${prompt}. 
Style: Digital art, dark atmosphere, mysterious lighting, Korean horror aesthetic, cinematographic composition. 
Avoid: Excessive gore, nudity, explicit violence. Keep it scary but tasteful.`;
    } else {
      // 폼 데이터를 기반으로 프롬프트 생성
      const styleMap: { [key: string]: string } = {
        'ghost': 'ethereal ghost with translucent appearance, floating in shadows',
        'monster': 'mysterious creature lurking in darkness, disturbing silhouette',
        'demon': 'dark demonic presence with glowing eyes, shadowy form',
        'urban-legend': 'mysterious urban setting with ominous atmosphere',
        'cursed-object': 'cursed item emanating dark energy, supernatural aura',
        'supernatural': 'supernatural phenomenon with otherworldly effects',
        'other': 'mysterious entity with unknown form, shrouded in darkness'
      };

      const creatureStyle = styleMap[creature_type] || 'mysterious dark presence';
      
      imagePrompt = `Create a dark atmospheric horror illustration featuring: ${creatureStyle} at ${location} during ${appearance_time}.
Scene description: ${description || name}
Style: Dark cinematic lighting, Korean horror movie aesthetic, mysterious atmosphere, professional digital art
Mood: Eerie, suspenseful, haunting but not excessively gory
Composition: Dramatic perspective, atmospheric shadows, moody color palette
Avoid: Explicit violence, gore, nudity. Keep it atmospheric and mysterious.`;
    }

    console.log("AI 이미지 생성 요청 시작...");
    console.log("프롬프트:", imagePrompt.substring(0, 100) + "...");

    // DALL·E 3로 이미지 생성
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: imagePrompt,
      size: "1024x1024",
      quality: "standard", // 비용 절약을 위해 standard 사용
      n: 1, // DALL·E 3는 1개씩만 생성 가능
      style: "natural" // vivid 또는 natural
    });

    const imageUrl = response.data[0]?.url;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "이미지 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    console.log("AI 이미지 생성 완료");

    // 이미지 URL과 개선된 프롬프트 반환
    return NextResponse.json({
      imageUrl: imageUrl,
      revisedPrompt: response.data[0]?.revised_prompt, // DALL·E 3가 개선한 프롬프트
      model: "dall-e-3"
    });

  } catch (error: any) {
    console.error("AI 이미지 생성 오류:", error);
    
    // OpenAI API 관련 오류 처리
    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: "OpenAI API 할당량이 부족합니다. 나중에 다시 시도해주세요." },
        { status: 429 }
      );
    }
    
    if (error.code === 'invalid_api_key') {
      return NextResponse.json(
        { error: "OpenAI API 키가 유효하지 않습니다." },
        { status: 401 }
      );
    }

    if (error.code === 'content_policy_violation') {
      return NextResponse.json(
        { error: "콘텐츠 정책에 위반되는 내용입니다. 다른 내용으로 시도해주세요." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "이미지 생성 중 오류가 발생했습니다: " + error.message },
      { status: 500 }
    );
  }
}