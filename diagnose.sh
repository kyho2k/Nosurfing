#!/bin/bash

echo "=================================="
echo "무서핑 서버 에러 진단 도구"
echo "=================================="
echo ""

# 타임스탬프 함수
timestamp() {
    date "+%Y-%m-%d %H:%M:%S"
}

# 로그 파일 설정
LOG_DIR="./logs"
mkdir -p $LOG_DIR
LOG_FILE="$LOG_DIR/debug_$(date +%Y%m%d_%H%M%S).log"

echo "📝 로그 파일: $LOG_FILE"
echo ""

# 시스템 정보 기록
{
    echo "=================================="
    echo "시스템 정보"
    echo "=================================="
    echo "날짜: $(timestamp)"
    echo "Node.js 버전: $(node -v)"
    echo "NPM 버전: $(npm -v)"
    
    if command -v pnpm &> /dev/null; then
        echo "PNPM 버전: $(pnpm -v)"
    fi
    
    echo ""
    echo "운영체제: $(uname -a)"
    echo ""
    
    echo "=================================="
    echo "프로젝트 정보"
    echo "=================================="
    echo "현재 디렉토리: $(pwd)"
    echo ""
    
    echo "package.json 내용:"
    cat package.json | grep -E '"(name|version|next|react|typescript)"'
    echo ""
    
    echo "환경 변수:"
    if [ -f .env.local ]; then
        echo "✅ .env.local 파일 존재"
        grep -E "^NEXT_PUBLIC_" .env.local | sed 's/=.*/=***/'
    else
        echo "❌ .env.local 파일 없음"
    fi
    echo ""
    
} > $LOG_FILE

# 서버 시작 및 에러 캡처
echo "🚀 서버 시작 및 에러 모니터링..."
echo "   (Ctrl+C로 종료)"
echo ""

# 환경 변수와 디버그 옵션 설정
export NODE_ENV=development
export DEBUG=*
export NODE_OPTIONS='--trace-warnings --trace-deprecation'

# 서버 실행 및 로그 기록
{
    echo "=================================="
    echo "서버 실행 로그"
    echo "=================================="
    echo "시작 시간: $(timestamp)"
    echo ""
} >> $LOG_FILE

# 서버 실행 (타임아웃 포함)
timeout 60 npx next dev 2>&1 | tee -a $LOG_FILE | while IFS= read -r line
do
    # 콘솔에 출력
    echo "[$(date '+%H:%M:%S')] $line"
    
    # 에러 패턴 감지
    if echo "$line" | grep -iE "error|fail|crash|abort|infinite|loop|timeout|EADDRINUSE|EMFILE|ENOMEM"; then
        echo "" | tee -a $LOG_FILE
        echo "⚠️  문제 감지: $line" | tee -a $LOG_FILE
        echo "" | tee -a $LOG_FILE
    fi
    
    # Ready 상태 감지
    if echo "$line" | grep -iE "ready|compiled|started on"; then
        echo "" | tee -a $LOG_FILE
        echo "✅ 서버 시작 감지!" | tee -a $LOG_FILE
        echo "" | tee -a $LOG_FILE
        
        # API 테스트 실행
        sleep 3
        echo "🧪 API 테스트 실행..." | tee -a $LOG_FILE
        
        for endpoint in "/" "/api/health" "/api/env-check" "/minimal"; do
            echo -n "   테스트: $endpoint ... " | tee -a $LOG_FILE
            response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$endpoint" 2>/dev/null)
            if [ "$response" = "200" ]; then
                echo "✅ OK ($response)" | tee -a $LOG_FILE
            else
                echo "❌ FAIL ($response)" | tee -a $LOG_FILE
            fi
        done
    fi
done

# 타임아웃 또는 종료 후 처리
EXIT_CODE=$?

{
    echo ""
    echo "=================================="
    echo "실행 종료"
    echo "=================================="
    echo "종료 시간: $(timestamp)"
    echo "종료 코드: $EXIT_CODE"
    
    if [ $EXIT_CODE -eq 124 ]; then
        echo "⚠️  60초 타임아웃으로 종료됨"
        echo "   무한 루프 또는 초기화 문제일 가능성이 높습니다"
    elif [ $EXIT_CODE -eq 0 ]; then
        echo "✅ 정상 종료"
    else
        echo "❌ 비정상 종료 (코드: $EXIT_CODE)"
    fi
    
    echo ""
    echo "=================================="
    echo "프로세스 정보"
    echo "=================================="
    ps aux | grep -E "node|next" | grep -v grep
    
    echo ""
    echo "=================================="
    echo "포트 사용 정보"
    echo "=================================="
    lsof -i :3000 2>/dev/null || echo "포트 3000 사용 안 함"
    
} >> $LOG_FILE

echo ""
echo "=================================="
echo "진단 완료"
echo "=================================="
echo "📋 전체 로그: $LOG_FILE"
echo ""

# 로그 요약
echo "📊 로그 요약:"
echo "   에러 수: $(grep -ci error $LOG_FILE)"
echo "   경고 수: $(grep -ci warning $LOG_FILE)"
echo "   무한 루프 관련: $(grep -ci -E 'infinite|loop|timeout|hang' $LOG_FILE)"
echo ""

# 주요 에러 표시
if grep -qi error $LOG_FILE; then
    echo "❌ 발견된 주요 에러:"
    grep -i error $LOG_FILE | head -5
fi