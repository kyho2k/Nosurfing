#!/usr/bin/env bash
set -euo pipefail

# 샘플 스크립트: 실제 명령은 GEMINI_CLI_BROWSER_MCP_GUIDE.md를 참고해 업데이트하세요.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# 1) .env.local 로드 (있을 경우)
if [[ -f "$ROOT_DIR/.env.local" ]]; then
  # shellcheck disable=SC1090
  source "$ROOT_DIR/.env.local"
fi

if [[ -z "${GOOGLE_API_KEY:-}" ]]; then
  echo "[오류] GOOGLE_API_KEY가 설정되어 있지 않습니다 (.env.local 확인)." >&2
  exit 1
fi

# 2) 포트 설정 (기본: 7311)
export GEMINI_BROWSER_MCP_PORT="${GEMINI_BROWSER_MCP_PORT:-7311}"
echo "[정보] Gemini Browser MCP를 포트 $GEMINI_BROWSER_MCP_PORT 에서 시작합니다."

# 3) 실제 실행 명령 (TODO: 가이드에 맞춰 수정)
echo "[안내] 실제 실행 명령을 가이드에 맞춰 업데이트하세요."
echo "예: gemini mcp browser --port $GEMINI_BROWSER_MCP_PORT"

exit 0
