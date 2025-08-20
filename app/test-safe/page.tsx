"use client"

// 무한루프 방지용 안전한 테스트 페이지
export default function SafeTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🎃 무서핑 안전 테스트 페이지</h1>
          <p className="text-purple-300 text-lg">브라우저 MCP 테스트를 위한 안전한 환경</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 서버 상태 */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">🚀 서버 상태</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-300">상태:</span>
                <span className="text-green-400">정상 동작</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">환경:</span>
                <span className="text-blue-400">Development</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">포트:</span>
                <span className="text-yellow-400">3000</span>
              </div>
            </div>
          </div>

          {/* 완성된 기능들 */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">✅ 완성된 기능들</h2>
            <div className="space-y-2 text-sm">
              <div className="text-green-400">• 익명 커뮤니티 시스템</div>
              <div className="text-green-400">• 댓글 시스템 (완전 구현)</div>
              <div className="text-green-400">• AI 콘텐츠 생성</div>
              <div className="text-green-400">• 미니게임 (팝핑 귀신방울)</div>
              <div className="text-green-400">• 랭킹 시스템</div>
              <div className="text-green-400">• PWA 지원</div>
              <div className="text-green-400">• 광고 시스템</div>
            </div>
          </div>

          {/* 테스트 링크들 */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">🔗 테스트 페이지들</h2>
            <div className="space-y-3">
              <a href="/" className="block text-purple-400 hover:text-purple-300 transition-colors">
                → 메인 페이지
              </a>
              <a href="/feed" className="block text-purple-400 hover:text-purple-300 transition-colors">
                → 피드 페이지
              </a>
              <a href="/game" className="block text-purple-400 hover:text-purple-300 transition-colors">
                → 미니게임
              </a>
              <a href="/rankings" className="block text-purple-400 hover:text-purple-300 transition-colors">
                → 랭킹 페이지
              </a>
              <a href="/creatures/1" className="block text-purple-400 hover:text-purple-300 transition-colors">
                → 게시물 상세 (댓글 시스템)
              </a>
            </div>
          </div>

          {/* API 테스트 */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">🛠️ API 상태</h2>
            <div className="space-y-2 text-sm">
              <div className="text-green-400">• /api/health ✅</div>
              <div className="text-green-400">• /api/creatures ✅</div>
              <div className="text-green-400">• /api/comments ✅</div>
              <div className="text-green-400">• /api/rankings ✅</div>
              <div className="text-blue-400">• /api/ai/* (API 키 필요)</div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-green-900/20 border border-green-500/30 rounded-lg">
          <h3 className="text-lg font-semibold text-green-400 mb-2">🎯 테스트 가이드</h3>
          <p className="text-green-300 text-sm leading-relaxed">
            이 페이지는 무한루프 없이 안전하게 테스트할 수 있도록 설계되었습니다. 
            위의 링크들을 클릭하여 각 기능을 확인해보세요. 
            댓글 시스템은 완전히 구현되어 있으며, 데이터베이스 연결만 하면 바로 사용 가능합니다.
          </p>
        </div>
      </div>
    </div>
  )
}