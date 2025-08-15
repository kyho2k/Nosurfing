#!/bin/bash

echo "=================================="
echo "무서핑 서버 디버깅 도구"
echo "=================================="
echo ""

# 패키지 관리자 감지
if [ -f "pnpm-lock.yaml" ]; then
    PKG_MANAGER="pnpm"
elif [ -f "yarn.lock" ]; then
    PKG_MANAGER="yarn"
elif [ -f "package-lock.json" ]; then
    PKG_MANAGER="npm"
else
    echo "⚠️  패키지 매니저를 감지할 수 없습니다. npm을 사용합니다."
    PKG_MANAGER="npm"
fi

echo "📦 패키지 매니저: $PKG_MANAGER"
echo ""

# 함수: 서버 상태 확인
check_server() {
    echo "🔍 서버 상태 확인..."
    
    if pgrep -f "next" > /dev/null; then
        echo "✅ Next.js 프로세스가 실행 중입니다"
        
        # 포트 체크
        if nc -z localhost 3000 2>/dev/null; then
            echo "✅ 포트 3000이 열려있습니다"
            
            # HTTP 응답 체크
            response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
            if [ "$response" = "200" ]; then
                echo "✅ 서버가 HTTP 200으로 응답합니다"
            else
                echo "⚠️  서버 응답 코드: $response"
            fi
        else
            echo "❌ 포트 3000에 연결할 수 없습니다"
            echo "   프로세스는 실행 중이지만 포트가 열리지 않았습니다."
            echo "   무한 루프 또는 초기화 문제일 가능성이 있습니다."
        fi
    else
        echo "❌ Next.js 프로세스가 실행되지 않습니다"
    fi
}

# 함수: 프로세스 종료
kill_server() {
    echo "🛑 기존 서버 종료..."
    pkill -f "next" 2>/dev/null
    sleep 2
    
    # 확인
    if pgrep -f "next" > /dev/null; then
        echo "⚠️  프로세스가 여전히 실행 중입니다. 강제 종료..."
        pkill -9 -f "next" 2>/dev/null
        sleep 1
    fi
    
    echo "✅ 서버가 종료되었습니다"
}

# 함수: 캐시 정리
clean_cache() {
    echo "🧹 캐시 정리..."
    rm -rf .next
    rm -rf node_modules/.cache
    echo "✅ 캐시가 정리되었습니다"
}

# 함수: 의존성 재설치
reinstall_deps() {
    echo "📦 의존성 재설치..."
    rm -rf node_modules
    $PKG_MANAGER install
    echo "✅ 의존성이 재설치되었습니다"
}

# 함수: 서버 시작 (타임아웃 포함)
start_server_with_timeout() {
    echo "🚀 서버 시작 (30초 타임아웃)..."
    
    # 백그라운드에서 서버 시작
    $PKG_MANAGER run dev > server.log 2>&1 &
    SERVER_PID=$!
    
    echo "   PID: $SERVER_PID"
    echo "   로그: tail -f server.log"
    echo ""
    
    # 최대 30초 동안 서버 시작 대기
    for i in {1..30}; do
        echo -n "   대기 중... ($i/30초) "
        
        if nc -z localhost 3000 2>/dev/null; then
            echo ""
            echo "✅ 서버가 시작되었습니다!"
            return 0
        fi
        
        # 프로세스가 죽었는지 확인
        if ! kill -0 $SERVER_PID 2>/dev/null; then
            echo ""
            echo "❌ 서버 프로세스가 종료되었습니다"
            echo "   마지막 로그:"
            tail -n 20 server.log
            return 1
        fi
        
        sleep 1
        echo -ne "\r"
    done
    
    echo ""
    echo "❌ 30초 타임아웃 - 서버가 시작되지 않습니다"
    echo "   무한 루프 또는 초기화 문제일 가능성이 높습니다"
    echo ""
    echo "📋 서버 로그 (마지막 50줄):"
    echo "=================================="
    tail -n 50 server.log
    echo "=================================="
    
    # 서버 종료
    kill $SERVER_PID 2>/dev/null
    return 1
}

# 메인 메뉴
while true; do
    echo ""
    echo "=================================="
    echo "선택하세요:"
    echo "1) 서버 상태 확인"
    echo "2) 서버 종료"
    echo "3) 캐시 정리"
    echo "4) 서버 재시작 (캐시 정리 포함)"
    echo "5) 의존성 재설치 후 서버 시작"
    echo "6) API 테스트 실행"
    echo "7) 서버 로그 보기"
    echo "8) 종료"
    echo "=================================="
    read -p "선택 [1-8]: " choice
    
    case $choice in
        1)
            check_server
            ;;
        2)
            kill_server
            ;;
        3)
            clean_cache
            ;;
        4)
            kill_server
            clean_cache
            start_server_with_timeout
            ;;
        5)
            kill_server
            clean_cache
            reinstall_deps
            start_server_with_timeout
            ;;
        6)
            echo "🧪 API 테스트..."
            if [ -f "test-api.sh" ]; then
                bash test-api.sh
            else
                echo "test-api.sh 파일이 없습니다"
            fi
            ;;
        7)
            if [ -f "server.log" ]; then
                echo "📋 서버 로그 (최근 50줄):"
                tail -n 50 server.log
            else
                echo "server.log 파일이 없습니다"
            fi
            ;;
        8)
            echo "👋 종료합니다"
            exit 0
            ;;
        *)
            echo "❌ 잘못된 선택입니다"
            ;;
    esac
done