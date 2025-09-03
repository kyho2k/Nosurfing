"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Pause, RotateCcw, Ghost, X, Info } from "lucide-react"

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

interface MiniGamePopupProps {
  isOpen: boolean
  onClose: () => void
}

const GAME_DURATION = 60
const CANVAS_WIDTH = 600
const CANVAS_HEIGHT = 400

export function MiniGamePopup({ isOpen, onClose }: MiniGamePopupProps) {
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

  const [showInstructions, setShowInstructions] = useState(true)

  // 로컬 스토리지에서 최고점수 불러오기
  useEffect(() => {
    if (isOpen) {
      const savedBestScore = localStorage.getItem('nosurfing-best-score')
      if (savedBestScore) {
        setGameState(prev => ({ ...prev, bestScore: parseInt(savedBestScore) }))
      }
    }
  }, [isOpen])

  // 팝업이 닫힐 때 게임 초기화
  useEffect(() => {
    if (!isOpen) {
      setGameState({
        isPlaying: false,
        isPaused: false,
        score: 0,
        timeLeft: GAME_DURATION,
        level: 1,
        bubblesPopped: 0,
        combo: 0,
        bestScore: gameState.bestScore
      })
      setShowInstructions(true)
      bubblesRef.current = []
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isOpen])

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
    const weights = [70, 25, 5]
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
    const radius = 20 + Math.random() * 10

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
    
    ctx.shadowColor = config.color
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    ctx.beginPath()
    ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2)
    ctx.fillStyle = `${config.color}${Math.floor(bubble.opacity * 255).toString(16).padStart(2, '0')}`
    ctx.fill()
    
    ctx.strokeStyle = `rgba(255, 255, 255, ${bubble.opacity * 0.3})`
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.shadowBlur = 0
    ctx.font = `${bubble.radius}px serif`
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

    ctx.fillStyle = '#0f0f0f'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    const spawnInterval = Math.max(1000 - (gameState.level - 1) * 100, 400)
    if (timestamp - lastSpawnTimeRef.current > spawnInterval) {
      bubblesRef.current.push(createBubble())
      lastSpawnTimeRef.current = timestamp
    }

    bubblesRef.current = bubblesRef.current.filter(bubble => {
      bubble.opacity += bubble.fadeDirection * 0.005
      if (bubble.opacity <= 0.3 || bubble.opacity >= 1) {
        bubble.fadeDirection *= -1
      }

      bubble.x += (Math.random() - 0.5) * bubble.speed
      bubble.y += (Math.random() - 0.5) * bubble.speed

      if (bubble.x < bubble.radius || bubble.x > CANVAS_WIDTH - bubble.radius) {
        bubble.x = Math.max(bubble.radius, Math.min(CANVAS_WIDTH - bubble.radius, bubble.x))
      }
      if (bubble.y < bubble.radius || bubble.y > CANVAS_HEIGHT - bubble.radius) {
        bubble.y = Math.max(bubble.radius, Math.min(CANVAS_HEIGHT - bubble.radius, bubble.y))
      }

      drawBubble(ctx, bubble)
      
      return timestamp - bubble.id < 4000
    })

    animationRef.current = requestAnimationFrame(gameLoop)
  }, [gameState.isPlaying, gameState.isPaused, gameState.level, createBubble, drawBubble])

  // 타이머
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused) return

    const timer = setInterval(() => {
      setGameState(prev => {
        if (prev.timeLeft <= 1) {
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
      setGameState(prev => ({ ...prev, combo: 0 }))
    }
  }, [gameState.isPlaying, gameState.isPaused])

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

  const togglePause = () => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }))
  }

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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto border border-slate-700">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center">
                <Ghost className="w-6 h-6 mr-2 text-purple-400" />
                팝핑 귀신방울
              </CardTitle>
              <div className="flex items-center space-x-2">
                {/* Game Stats Display */}
                <div className="text-sm text-gray-300 space-x-4 mr-4">
                  <span>점수: <span className="text-white font-bold">{gameState.score.toLocaleString()}</span></span>
                  <span>시간: <span className="text-red-400 font-bold">{gameState.timeLeft}초</span></span>
                  <span>콤보: <span className="text-orange-400 font-bold">x{gameState.combo + 1}</span></span>
                </div>
                
                <Button 
                  onClick={() => setShowInstructions(true)} 
                  variant="outline" 
                  size="sm"
                  className="text-gray-300 hover:text-white"
                >
                  <Info className="w-4 h-4 mr-1" />
                  도움말
                </Button>
                
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
                
                <Button 
                  onClick={onClose}
                  variant="ghost" 
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
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
        
        {/* Instructions Overlay */}
        {showInstructions && (
          <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center rounded-lg">
            <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full border border-slate-700 mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Ghost className="w-6 h-6 mr-2 text-purple-400" />
                  게임 방법
                </h3>
                <Button 
                  onClick={() => setShowInstructions(false)}
                  variant="ghost" 
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4 text-gray-300">
                <div className="text-center space-y-2">
                  <p className="text-lg">화면에 나타나는 방울들을 클릭해서 터뜨리세요!</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-slate-700 p-2 rounded">
                    <span className="flex items-center">
                      <span className="text-2xl mr-2">👻</span>
                      유령방울
                    </span>
                    <span className="text-green-400 font-bold">10점</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-700 p-2 rounded">
                    <span className="flex items-center">
                      <span className="text-2xl mr-2">💀</span>
                      해골방울
                    </span>
                    <span className="text-yellow-400 font-bold">20점</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-700 p-2 rounded">
                    <span className="flex items-center">
                      <span className="text-2xl mr-2">👹</span>
                      악마방울
                    </span>
                    <span className="text-red-400 font-bold">50점</span>
                  </div>
                </div>
                
                <div className="bg-purple-900 bg-opacity-50 p-3 rounded">
                  <p className="text-yellow-400 font-medium">💡 팁:</p>
                  <p className="text-sm">• 연속으로 터뜨리면 콤보 보너스 획득!</p>
                  <p className="text-sm">• 빗나가면 콤보가 리셋됩니다</p>
                  <p className="text-sm">• 60초 동안 최대한 많은 점수를 획득하세요</p>
                </div>
                
                <Button 
                  onClick={() => setShowInstructions(false)}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  게임 시작하기
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}