"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Play, Pause, RotateCcw, Trophy, Ghost, Skull } from "lucide-react"
import { useRouter } from "next/navigation"
import { AchievementsBadge } from "@/components/profile/AchievementsBadge"
import { GamePageAd, MobileAnchorAd } from "@/components/ads/AdComponents"

interface Bubble {
  id: number
  x: number
  y: number
  radius: number
  opacity: number
  fadeDirection: number
  speed: number
  type: 'ghost' | 'skull' | 'demon'
  points: number
}

interface GameState {
  isPlaying: boolean
  isPaused: boolean
  score: number
  timeLeft: number
  level: number
  bubblesPopped: number
  combo: number
  bestScore: number
}

const GAME_DURATION = 60 // 60초 게임
const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600

export default function PoppingBubblesGame() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const bubblesRef = useRef<Bubble[]>([])
  const lastSpawnTimeRef = useRef<number>(0)

  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isPaused: false,
    score: 0,
    timeLeft: GAME_DURATION,
    level: 1,
    bubblesPopped: 0,
    combo: 0,
    bestScore: 0
  })

  // 로컬 스토리지에서 최고점수 불러오기
  useEffect(() => {
    const savedBestScore = localStorage.getItem('nosurfing-best-score')
    if (savedBestScore) {
      setGameState(prev => ({ ...prev, bestScore: parseInt(savedBestScore) }))
    }
  }, [])

  // 버블 타입별 설정
  const getBubbleConfig = (type: Bubble['type']) => {
    switch (type) {
      case 'ghost':
        return { points: 10, color: '#9333ea', emoji: '👻' }
      case 'skull':
        return { points: 20, color: '#dc2626', emoji: '💀' }
      case 'demon':
        return { points: 50, color: '#7c2d12', emoji: '👹' }
    }
  }

  // 랜덤 버블 생성
  const createBubble = useCallback((): Bubble => {
    const types: Bubble['type'][] = ['ghost', 'skull', 'demon']
    const weights = [70, 25, 5] // ghost 70%, skull 25%, demon 5%
    let random = Math.random() * 100
    let selectedType: Bubble['type'] = 'ghost'
    
    for (let i = 0; i < types.length; i++) {
      if (random <= weights[i]) {
        selectedType = types[i]
        break
      }
      random -= weights[i]
    }

    const config = getBubbleConfig(selectedType)
    const radius = 25 + Math.random() * 15 // 25-40px 반지름

    return {
      id: Date.now() + Math.random(),
      x: radius + Math.random() * (CANVAS_WIDTH - radius * 2),
      y: radius + Math.random() * (CANVAS_HEIGHT - radius * 2),
      radius,
      opacity: 0.8 + Math.random() * 0.2,
      fadeDirection: Math.random() > 0.5 ? 1 : -1,
      speed: 0.5 + Math.random() * 1.5,
      type: selectedType,
      points: config.points
    }
  }, [])

  // 버블 그리기
  const drawBubble = useCallback((ctx: CanvasRenderingContext2D, bubble: Bubble) => {
    const config = getBubbleConfig(bubble.type)
    
    // 그림자 효과
    ctx.shadowColor = config.color
    ctx.shadowBlur = 10
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    // 버블 원형 배경
    ctx.beginPath()
    ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2)
    ctx.fillStyle = `${config.color}${Math.floor(bubble.opacity * 255).toString(16).padStart(2, '0')}`
    ctx.fill()
    
    // 테두리
    ctx.strokeStyle = `rgba(255, 255, 255, ${bubble.opacity * 0.3})`
    ctx.lineWidth = 2
    ctx.stroke()

    // 이모지 그리기
    ctx.shadowBlur = 0
    ctx.font = `${bubble.radius * 1.2}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = `rgba(255, 255, 255, ${bubble.opacity})`
    ctx.fillText(config.emoji, bubble.x, bubble.y)
  }, [])

  // 게임 루프
  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current
    if (!canvas || !gameState.isPlaying || gameState.isPaused) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 캔버스 클리어 (검은 배경)
    ctx.fillStyle = '#0f0f0f'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // 새로운 버블 생성 (레벨에 따라 생성 빈도 증가)
    const spawnInterval = Math.max(800 - (gameState.level - 1) * 100, 300)
    if (timestamp - lastSpawnTimeRef.current > spawnInterval) {
      bubblesRef.current.push(createBubble())
      lastSpawnTimeRef.current = timestamp
    }

    // 버블 업데이트 및 그리기
    bubblesRef.current = bubblesRef.current.filter(bubble => {
      // 투명도 애니메이션
      bubble.opacity += bubble.fadeDirection * 0.005
      if (bubble.opacity <= 0.3 || bubble.opacity >= 1) {
        bubble.fadeDirection *= -1
      }

      // 버블 이동 (살짝 떠다니는 효과)
      bubble.x += (Math.random() - 0.5) * bubble.speed
      bubble.y += (Math.random() - 0.5) * bubble.speed

      // 화면 경계 체크
      if (bubble.x < bubble.radius || bubble.x > CANVAS_WIDTH - bubble.radius) {
        bubble.x = Math.max(bubble.radius, Math.min(CANVAS_WIDTH - bubble.radius, bubble.x))
      }
      if (bubble.y < bubble.radius || bubble.y > CANVAS_HEIGHT - bubble.radius) {
        bubble.y = Math.max(bubble.radius, Math.min(CANVAS_HEIGHT - bubble.radius, bubble.y))
      }

      drawBubble(ctx, bubble)
      
      // 5초 후 자동 제거
      return timestamp - bubble.id < 5000
    })

    animationRef.current = requestAnimationFrame(gameLoop)
  }, [gameState.isPlaying, gameState.isPaused, gameState.level, createBubble, drawBubble])

  // 타이머
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused) return

    const timer = setInterval(() => {
      setGameState(prev => {
        if (prev.timeLeft <= 1) {
          // 게임 종료
          if (prev.score > prev.bestScore) {
            localStorage.setItem('nosurfing-best-score', prev.score.toString())
            return { 
              ...prev, 
              isPlaying: false, 
              timeLeft: 0, 
              bestScore: prev.score 
            }
          }
          return { ...prev, isPlaying: false, timeLeft: 0 }
        }

        // 레벨 업 (10초마다)
        const newLevel = Math.floor((GAME_DURATION - prev.timeLeft + 10) / 10)
        
        return { 
          ...prev, 
          timeLeft: prev.timeLeft - 1,
          level: Math.max(newLevel, 1)
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState.isPlaying, gameState.isPaused])

  // 애니메이션 시작
  useEffect(() => {
    if (gameState.isPlaying && !gameState.isPaused) {
      animationRef.current = requestAnimationFrame(gameLoop)
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameState.isPlaying, gameState.isPaused, gameLoop])

  // 캔버스 클릭 처리
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameState.isPlaying || gameState.isPaused) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_WIDTH / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height
    const clickX = (event.clientX - rect.left) * scaleX
    const clickY = (event.clientY - rect.top) * scaleY

    // 클릭된 버블 찾기
    const clickedBubbleIndex = bubblesRef.current.findIndex(bubble => {
      const distance = Math.sqrt(
        Math.pow(clickX - bubble.x, 2) + Math.pow(clickY - bubble.y, 2)
      )
      return distance <= bubble.radius
    })

    if (clickedBubbleIndex !== -1) {
      const clickedBubble = bubblesRef.current[clickedBubbleIndex]
      bubblesRef.current.splice(clickedBubbleIndex, 1)

      setGameState(prev => ({
        ...prev,
        score: prev.score + clickedBubble.points * (prev.combo + 1),
        bubblesPopped: prev.bubblesPopped + 1,
        combo: prev.combo + 1
      }))
    } else {
      // 빗나간 클릭은 콤보 리셋
      setGameState(prev => ({ ...prev, combo: 0 }))
    }
  }, [gameState.isPlaying, gameState.isPaused])

  // 게임 시작
  const startGame = () => {
    bubblesRef.current = []
    lastSpawnTimeRef.current = 0
    setGameState({
      isPlaying: true,
      isPaused: false,
      score: 0,
      timeLeft: GAME_DURATION,
      level: 1,
      bubblesPopped: 0,
      combo: 0,
      bestScore: gameState.bestScore
    })
  }

  // 게임 일시정지/재개
  const togglePause = () => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }))
  }

  // 게임 리셋
  const resetGame = () => {
    bubblesRef.current = []
    setGameState(prev => ({
      isPlaying: false,
      isPaused: false,
      score: 0,
      timeLeft: GAME_DURATION,
      level: 1,
      bubblesPopped: 0,
      combo: 0,
      bestScore: prev.bestScore
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="p-6 border-b border-slate-700">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/")}
            className="text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            홈으로
          </Button>
          <div className="flex items-center space-x-3">
            <Ghost className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">팝핑 귀신방울</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Game Stats */}
            <div className="space-y-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
                    게임 정보
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">점수:</span>
                    <span className="text-white font-bold">{gameState.score.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">최고 점수:</span>
                    <span className="text-yellow-400 font-bold">{gameState.bestScore.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">남은 시간:</span>
                    <span className="text-red-400 font-bold">{gameState.timeLeft}초</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">레벨:</span>
                    <span className="text-purple-400 font-bold">{gameState.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">터뜨린 방울:</span>
                    <span className="text-green-400 font-bold">{gameState.bubblesPopped}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">콤보:</span>
                    <span className="text-orange-400 font-bold">x{gameState.combo + 1}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Game Rules */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Skull className="w-5 h-5 mr-2 text-gray-400" />
                    게임 방법
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-300 space-y-2">
                  <p>👻 유령방울: 10점</p>
                  <p>💀 해골방울: 20점</p>
                  <p>👹 악마방울: 50점</p>
                  <p className="text-yellow-400">💡 연속 터뜨리면 콤보 보너스!</p>
                  <p className="text-red-400">⚠️ 빗나가면 콤보 리셋!</p>
                </CardContent>
              </Card>

              {/* Achievements */}
              <div>
                <AchievementsBadge gameScore={gameState.bestScore} />
              </div>

              {/* Game Page Ad */}
              <GamePageAd />
            </div>

            {/* Game Area */}
            <div className="lg:col-span-3">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">게임 화면</CardTitle>
                    <div className="flex space-x-2">
                      {!gameState.isPlaying ? (
                        <Button onClick={startGame} className="bg-green-600 hover:bg-green-700">
                          <Play className="w-4 h-4 mr-2" />
                          시작
                        </Button>
                      ) : (
                        <>
                          <Button onClick={togglePause} variant="outline">
                            {gameState.isPaused ? (
                              <><Play className="w-4 h-4 mr-2" />재개</>
                            ) : (
                              <><Pause className="w-4 h-4 mr-2" />일시정지</>
                            )}
                          </Button>
                          <Button onClick={resetGame} variant="destructive">
                            <RotateCcw className="w-4 h-4 mr-2" />
                            리셋
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <canvas
                      ref={canvasRef}
                      width={CANVAS_WIDTH}
                      height={CANVAS_HEIGHT}
                      onClick={handleCanvasClick}
                      className="border border-slate-600 rounded-lg cursor-crosshair max-w-full h-auto"
                      style={{ backgroundColor: '#0f0f0f' }}
                    />
                  </div>
                  
                  {!gameState.isPlaying && gameState.timeLeft === 0 && (
                    <div className="text-center mt-4 p-4 bg-slate-900 rounded-lg">
                      <h3 className="text-2xl font-bold text-white mb-2">게임 종료!</h3>
                      <p className="text-gray-300">최종 점수: <span className="text-yellow-400 font-bold">{gameState.score.toLocaleString()}점</span></p>
                      <p className="text-gray-300">터뜨린 방울: <span className="text-green-400 font-bold">{gameState.bubblesPopped}개</span></p>
                      {gameState.score === gameState.bestScore && gameState.score > 0 && (
                        <p className="text-yellow-400 font-bold mt-2">🎉 신기록 달성!</p>
                      )}
                    </div>
                  )}

                  {gameState.isPaused && (
                    <div className="text-center mt-4 p-4 bg-slate-900 rounded-lg">
                      <h3 className="text-xl font-bold text-white">게임 일시정지됨</h3>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Anchor Ad */}
      <MobileAnchorAd />
    </div>
  )
}