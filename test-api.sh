#!/bin/bash

echo "========================================="
echo "무서핑 API 테스트 스크립트"
echo "========================================="
echo ""

# 색상 코드 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 기본 URL
BASE_URL="http://localhost:3000"

# 테스트 함수
test_endpoint() {
    local endpoint=$1
    local method=$2
    local data=$3
    
    echo -e "${YELLOW}테스트: ${method} ${endpoint}${NC}"
    
    if [ -z "$data" ]; then
        response=$(curl -s -X ${method} -w "\n[HTTP_STATUS]:%{http_code}" ${BASE_URL}${endpoint} 2>&1)
    else
        response=$(curl -s -X ${method} \
            -H "Content-Type: application/json" \
            -d "${data}" \
            -w "\n[HTTP_STATUS]:%{http_code}" \
            ${BASE_URL}${endpoint} 2>&1)
    fi
    
    # HTTP 상태 코드 추출
    http_status=$(echo "$response" | grep -o '\[HTTP_STATUS\]:[0-9]*' | cut -d':' -f2)
    body=$(echo "$response" | sed 's/\[HTTP_STATUS\]:[0-9]*$//')
    
    if [ -z "$http_status" ]; then
        echo -e "${RED}❌ 서버 연결 실패${NC}"
        echo "에러: 서버가 실행 중인지 확인하세요"
    elif [ "$http_status" -eq 200 ]; then
        echo -e "${GREEN}✅ 성공 (HTTP ${http_status})${NC}"
        echo "응답: ${body}"
    else
        echo -e "${RED}❌ 실패 (HTTP ${http_status})${NC}"
        echo "응답: ${body}"
    fi
    
    echo "----------------------------------------"
    echo ""
}

# 서버 상태 확인
echo "1. 서버 상태 확인"
echo "========================================="
test_endpoint "/" "GET"

# 헬스체크
echo "2. 헬스체크 API"
echo "========================================="
test_endpoint "/api/health" "GET"

# 환경변수 체크
echo "3. 환경변수 체크 API"
echo "========================================="
test_endpoint "/api/env-check" "GET"

# 간단한 테스트 API
echo "4. 간단한 테스트 API"
echo "========================================="
test_endpoint "/api/simple-test" "GET"

# Creatures API GET
echo "5. Creatures API (GET)"
echo "========================================="
test_endpoint "/api/creatures" "GET"

# Creatures API POST
echo "6. Creatures API (POST)"
echo "========================================="
test_data='{"name":"테스트 존재","description":"무서운 존재"}'
test_endpoint "/api/creatures" "POST" "$test_data"

# 연결 테스트 API
echo "7. 연결 테스트 API"
echo "========================================="
test_endpoint "/api/test-connection" "GET"

echo ""
echo "========================================="
echo "테스트 완료!"
echo "========================================="