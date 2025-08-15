#!/bin/bash

echo "=================================="
echo "무서핑 디버그 서버 시작"
echo "=================================="
echo ""

# 기존 프로세스 종료
echo "🔍 기존 Next.js 프로세스 확인..."
if pgrep -f "next dev" > /dev/null; then
    echo "⚠️  기존 서버를 종료합니다..."
    pkill -f "next dev"
    sleep 2
fi

# .next 폴더 정리
echo "🧹 빌드 캐시 정리..."
rm -rf .next
rm -rf node_modules/.cache

# 환경변수 확인
echo ""
echo "🔑 환경변수 확인..."
if [ -f .env.local ]; then
    echo "✅ .env.local 파일 존재"
    echo "   NEXT_PUBLIC_SUPABASE_URL: $(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d'=' -f2 | cut -c1-30)..."
    echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY: $(grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local | cut -d'=' -f2 | cut -c1-30)..."
else
    echo "❌ .env.local 파일이 없습니다!"
fi

echo ""
echo "🚀 개발 서버 시작 (디버그 모드)..."
echo "=================================="
echo ""

# 디버그 정보와 함께 서버 시작
NODE_ENV=development \
NODE_OPTIONS='--trace-warnings' \
npx next dev --hostname localhost --port 3000 2>&1 | while IFS= read -r line
do
    # 타임스탬프 추가
    echo "[$(date '+%H:%M:%S')] $line"
    
    # 특정 에러 패턴 감지
    if echo "$line" | grep -q "Error\|error\|ERROR"; then
        echo "⚠️  에러 감지됨!"
    fi
    
    if echo "$line" | grep -q "ready\|Ready\|READY"; then
        echo "✅ 서버가 준비되었습니다!"
        echo ""
        echo "테스트 URL:"
        echo "  - http://localhost:3000"
        echo "  - http://localhost:3000/minimal"
        echo "  - http://localhost:3000/api/health"
        echo ""
    fi
done