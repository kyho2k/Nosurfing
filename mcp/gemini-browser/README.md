# Gemini 브라우저 MCP (샘플)

이 문서는 Gemini CLI의 브라우저 MCP를 프로젝트에서 일관되게 사용하는 방법을 예시로 보여줍니다. 실제 상세 명령과 최신 이슈/해결책은 `GEMINI_CLI_BROWSER_MCP_GUIDE.md`를 따르세요.

## 요구사항
- 환경변수: `GOOGLE_API_KEY` (로컬에서만 보관, `.env.local` 권장)
- 포트: `7311` (다른 MCP와 겹치지 않게 고정)

## 빠른 시작 (예시)
1) `.env.local`에 키 넣기
```env
GOOGLE_API_KEY=your_google_api_key
```

2) 서버 실행 스크립트 사용(샘플)
```bash
bash scripts/mcp/start-gemini-browser.sh
```

3) 테스트
- 가이드의 예제 스크립트로 페이지 이동/입력/제출까지 동작 확인
- 문제가 있으면 스냅샷 재생성, 대기시간 조정 등 가이드의 해결책 적용

## 주의사항
- 이 폴더의 문서는 샘플/가이드입니다. 실제 실행 명령은 `GEMINI_CLI_BROWSER_MCP_GUIDE.md`의 최신 버전을 우선합니다.
- 비밀키는 커밋 금지. 로컬에서만 보관하세요.
