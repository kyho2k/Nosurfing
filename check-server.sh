#!/bin/bash

# 서버 상태 빠른 확인
echo "🔍 서버 상태 확인 중..."

# 프로세스 확인
if pgrep -f "next dev" > /dev/null; then
    echo "✅ Next.js 개발 서버가 실행 중입니다."
    
    # 포트 확인
    if lsof -i :3000 > /dev/null 2>&1; then
        echo "✅ 포트 3000이 사용 중입니다."
    else
        echo "⚠️  포트 3000이 사용되지 않습니다."
    fi
else
    echo "❌ Next.js 개발 서버가 실행되지 않습니다."
    echo ""
    echo "서버를 시작하려면:"
    echo "  pnpm run dev"
fi

echo ""
echo "🧪 빠른 연결 테스트..."

# curl로 간단한 테스트
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)

if [ "$response" = "200" ]; then
    echo "✅ 서버가 정상적으로 응답합니다 (HTTP 200)"
elif [ "$response" = "000" ]; then
    echo "❌ 서버에 연결할 수 없습니다"
else
    echo "⚠️  서버가 응답했지만 상태 코드가 $response 입니다"
fi

echo ""
echo "📊 포트 사용 상황:"
lsof -i :3000 2>/dev/null | grep LISTEN || echo "포트 3000에서 리스닝 중인 프로세스가 없습니다"