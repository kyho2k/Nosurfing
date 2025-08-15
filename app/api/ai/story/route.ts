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
    const { prompt, name, location, appearance_time, creature_type } = body;

    // 입력 검증
    if (!prompt && (!name || !location)) {
      return NextResponse.json(
        { error: "프롬프트 또는 기본 정보(이름, 장소)가 필요합니다." },
        { status: 400 }
      );
    }

    // 공포 소설 생성을 위한 프롬프트 구성
    let storyPrompt = "";
    
    if (prompt) {
      // 사용자가 직접 프롬프트를 입력한 경우
      storyPrompt = `다음 아이디어를 바탕으로 한국어 공포 단편소설을 1000-1500자 분량으로 작성해주세요. 
      
아이디어: ${prompt}

요구사항:
- 한국적인 배경과 정서가 담긴 공포 이야기
- 독자가 몰입할 수 있는 생생한 묘사
- 적절한 긴장감과 공포 요소
- 과도한 잔혹성이나 혐오 표현 자제
- 1인칭 또는 3인칭 관찰자 시점으로 작성
- 결말은 여운이 남도록 마무리

소설을 작성해주세요:`;
    } else {
      // 폼 데이터를 기반으로 프롬프트 생성
      const typeMap: { [key: string]: string } = {
        'ghost': '유령이나 영혼',
        'monster': '괴물이나 크리처',
        'demon': '악마나 악령',
        'urban-legend': '도시전설',
        'cursed-object': '저주받은 물건',
        'supernatural': '초자연적 현상',
        'other': '미지의 존재'
      };

      const creatureTypeKr = typeMap[creature_type] || '미지의 존재';

      storyPrompt = `다음 설정을 바탕으로 한국어 공포 단편소설을 1000-1500자 분량으로 작성해주세요.

설정:
- 존재 이름: ${name}
- 출몰 장소: ${location}
- 출몰 시간: ${appearance_time}
- 존재 유형: ${creatureTypeKr}

요구사항:
- 위 설정을 활용한 한국적 공포 이야기
- 주인공이 이 존재와 마주치는 상황 연출
- 생생한 묘사와 적절한 긴장감
- 과도한 잔혹성이나 혐오 표현 자제
- 1인칭 또는 3인칭 시점으로 작성
- 독자에게 여운을 남기는 결말

소설을 작성해주세요:`;
    }

    // OpenAI API 호출
    console.log("AI 스토리 생성 요청 시작...");
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "당신은 한국의 공포 소설을 전문으로 하는 작가입니다. 한국적 정서와 배경을 잘 살린 무서운 이야기를 만드는 전문가입니다. 독자들이 몰입할 수 있으면서도 불쾌감을 주지 않는 적절한 수준의 공포 요소를 사용합니다."
        },
        {
          role: "user",
          content: storyPrompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.8, // 창의성을 위해 높은 온도 설정
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const generatedStory = completion.choices[0]?.message?.content;

    if (!generatedStory) {
      return NextResponse.json(
        { error: "스토리 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    console.log("AI 스토리 생성 완료");

    return NextResponse.json({
      story: generatedStory,
      usage: completion.usage,
      model: completion.model
    });

  } catch (error: any) {
    console.error("AI 스토리 생성 오류:", error);
    
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

    return NextResponse.json(
      { error: "스토리 생성 중 오류가 발생했습니다: " + error.message },
      { status: 500 }
    );
  }
}