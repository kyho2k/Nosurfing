"use client"

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-4">무서핑 테스트 페이지</h1>
      <p className="text-xl">서버가 정상적으로 작동하고 있습니다!</p>
      <div className="mt-8 space-y-4">
        <div className="p-4 bg-gray-800 rounded">
          <h2 className="text-2xl font-semibold mb-2">API 테스트</h2>
          <button 
            onClick={async () => {
              try {
                const res = await fetch('/api/simple-test');
                const data = await res.json();
                alert(JSON.stringify(data));
              } catch (error) {
                alert('API 호출 실패: ' + error);
              }
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded transition"
          >
            Simple API 테스트
          </button>
        </div>
        <div className="p-4 bg-gray-800 rounded">
          <button 
            onClick={async () => {
              try {
                const res = await fetch('/api/env-check');
                const data = await res.json();
                alert(JSON.stringify(data, null, 2));
              } catch (error) {
                alert('환경변수 확인 실패: ' + error);
              }
            }}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition"
          >
            환경변수 확인
          </button>
        </div>
      </div>
    </div>
  )
}
