/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  remotePatterns: [
  {
    protocol: 'https',
    hostname: 'arrpuarrykptututjdnq.supabase.co',
    pathname: '/storage/v1/object/public/**',
   },
  // PWA 지원을 위한 설정
  experimental: {
    webVitalsAttribution: ['CLS', 'LCP']
  },
  // Service Worker를 위한 헤더 설정
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  // 환경변수 검증
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // 디버깅을 위한 로깅 활성화
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}

export default nextConfig
