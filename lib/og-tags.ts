import { Metadata } from "next"

interface OGTagsProps {
  title: string
  description: string
  image?: string
  url?: string
  type?: "website" | "article"
  publishedTime?: string
  author?: string
}

export function generateOGTags({
  title,
  description,
  image,
  url,
  type = "website",
  publishedTime,
  author
}: OGTagsProps): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nosurfing.vercel.app"
  const fullUrl = url ? `${baseUrl}${url}` : baseUrl
  const ogImage = image || `${baseUrl}/icon-512x512.png`

  const metadata: Metadata = {
    title: `${title} | 무서핑`,
    description,
    openGraph: {
      title: `${title} | 무서핑`,
      description,
      url: fullUrl,
      siteName: "무서핑",
      type,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        }
      ],
      locale: "ko_KR",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | 무서핑`,
      description,
      images: [ogImage],
      creator: "@nosurfing_kr",
    },
    alternates: {
      canonical: fullUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  }

  // Article 타입인 경우 추가 메타데이터
  if (type === "article" && publishedTime) {
    metadata.openGraph = {
      ...metadata.openGraph,
      type: "article",
      publishedTime,
      authors: author ? [author] : undefined,
      section: "공포소설",
      tags: ["공포", "괴담", "무서운이야기", "창작"],
    }
  }

  return metadata
}

// 존재(creature) 상세페이지용 OG 태그
export function generateCreatureOGTags(creature: {
  id: string
  name: string
  description: string
  story: string
  image_url?: string
  created_at: string
}) {
  const truncatedStory = creature.story.length > 150 
    ? creature.story.substring(0, 150) + "..." 
    : creature.story

  return generateOGTags({
    title: creature.name,
    description: `${creature.description} - ${truncatedStory}`,
    image: creature.image_url,
    url: `/creatures/${creature.id}`,
    type: "article",
    publishedTime: creature.created_at,
    author: "익명"
  })
}

// 랭킹 페이지용 OG 태그
export function generateRankingOGTags(period: string = "monthly") {
  return generateOGTags({
    title: `${period === "monthly" ? "월간" : "주간"} 베스트 랭킹`,
    description: "무서핑에서 가장 인기 있는 공포 이야기들을 만나보세요. 독창적인 괴담과 무서운 존재들이 기다리고 있습니다.",
    url: "/rankings",
    type: "website"
  })
}

// 게임 페이지용 OG 태그
export function generateGameOGTags() {
  return generateOGTags({
    title: "팝핑 귀신방울 게임",
    description: "무서핑의 재미있는 미니게임을 즐겨보세요! 유령 방울을 터뜨리며 최고 점수에 도전하세요.",
    url: "/game",
    type: "website"
  })
}