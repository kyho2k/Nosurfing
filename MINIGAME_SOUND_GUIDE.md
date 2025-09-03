# 미니게임 사운드 추가 가이드

무서핑의 팝핑 귀신방울 미니게임에 사운드 효과를 추가하는 방법을 안내합니다.

## 1. 필요한 사운드 파일 준비

다음과 같은 사운드 파일들을 준비하세요:

- `bubble-pop.mp3` - 방울이 터질 때 나는 소리
- `game-start.mp3` - 게임 시작 시 효과음
- `game-over.mp3` - 게임 종료 시 효과음
- `background-music.mp3` - 배경 음악 (선택사항)

## 2. 사운드 파일 위치

프로젝트 root 디렉토리에 `public/sounds/` 폴더를 생성하고 사운드 파일들을 배치하세요:

```
public/
  sounds/
    bubble-pop.mp3
    game-start.mp3
    game-over.mp3
    background-music.mp3
```

## 3. 코드 수정 방법

### 3.1. MiniGamePopup.tsx 파일 수정

`/components/game/MiniGamePopup.tsx` 파일을 다음과 같이 수정하세요:

#### 사운드 관련 ref 추가 (컴포넌트 상단):

```tsx
// 사운드 관련 ref 추가
const bubblePopSoundRef = useRef<HTMLAudioElement>(null)
const gameStartSoundRef = useRef<HTMLAudioElement>(null)
const gameOverSoundRef = useRef<HTMLAudioElement>(null)
const backgroundMusicRef = useRef<HTMLAudioElement>(null)
```

#### 사운드 재생 함수 추가:

```tsx
// 사운드 재생 함수들
const playBubblePopSound = () => {
  if (bubblePopSoundRef.current) {
    bubblePopSoundRef.current.currentTime = 0
    bubblePopSoundRef.current.play().catch(() => {
      // 자동재생이 차단된 경우 무시
    })
  }
}

const playGameStartSound = () => {
  if (gameStartSoundRef.current) {
    gameStartSoundRef.current.play().catch(() => {})
  }
}

const playGameOverSound = () => {
  if (gameOverSoundRef.current) {
    gameOverSoundRef.current.play().catch(() => {})
  }
}

const playBackgroundMusic = () => {
  if (backgroundMusicRef.current) {
    backgroundMusicRef.current.loop = true
    backgroundMusicRef.current.volume = 0.3 // 볼륨 30%
    backgroundMusicRef.current.play().catch(() => {})
  }
}

const stopBackgroundMusic = () => {
  if (backgroundMusicRef.current) {
    backgroundMusicRef.current.pause()
    backgroundMusicRef.current.currentTime = 0
  }
}
```

#### handleCanvasClick 함수에 사운드 추가:

```tsx
// 기존 handleCanvasClick 함수에서 방울이 터질 때 사운드 재생
if (clickedBubbleIndex !== -1) {
  const clickedBubble = bubblesRef.current[clickedBubbleIndex]
  bubblesRef.current.splice(clickedBubbleIndex, 1)

  // 방울 터지는 사운드 재생
  playBubblePopSound()

  setGameState(prev => ({
    ...prev,
    score: prev.score + clickedBubble.points * (prev.combo + 1),
    bubblesPopped: prev.bubblesPopped + 1,
    combo: prev.combo + 1
  }))
}
```

#### startGame 함수에 사운드 추가:

```tsx
const startGame = () => {
  bubblesRef.current = []
  lastSpawnTimeRef.current = 0
  
  // 게임 시작 사운드 재생
  playGameStartSound()
  // 배경음악 시작
  playBackgroundMusic()
  
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
```

#### 게임 종료 시 사운드 추가 (타이머 useEffect에서):

```tsx
// 타이머 useEffect에서 게임 종료 처리 부분 수정
if (prev.timeLeft <= 1) {
  // 배경음악 정지 및 게임 종료 사운드 재생
  stopBackgroundMusic()
  playGameOverSound()
  
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
```

#### 팝업 닫힐 때 배경음악 정지:

```tsx
// 팝업이 닫힐 때 게임 초기화 useEffect 수정
useEffect(() => {
  if (!isOpen) {
    // 배경음악 정지
    stopBackgroundMusic()
    
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
```

#### HTML audio 요소 추가 (컴포넌트 return문에):

```tsx
return (
  <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
    {/* 기존 컴포넌트 내용 */}
    
    {/* 사운드 요소들 */}
    <audio ref={bubblePopSoundRef} preload="auto">
      <source src="/sounds/bubble-pop.mp3" type="audio/mpeg" />
    </audio>
    <audio ref={gameStartSoundRef} preload="auto">
      <source src="/sounds/game-start.mp3" type="audio/mpeg" />
    </audio>
    <audio ref={gameOverSoundRef} preload="auto">
      <source src="/sounds/game-over.mp3" type="audio/mpeg" />
    </audio>
    <audio ref={backgroundMusicRef} preload="auto">
      <source src="/sounds/background-music.mp3" type="audio/mpeg" />
    </audio>
    
    {/* 기존 컴포넌트 내용 계속... */}
  </div>
)
```

## 4. 추천 사운드 리소스

### 무료 사운드 리소스:
- **Freesound.org** - 다양한 무료 사운드 효과
- **Zapsplat** - 고품질 사운드 효과 (회원가입 필요)
- **Pixabay Music** - 로열티 프리 음악 및 효과음

### 사운드 파일 특성:
- **bubble-pop.mp3**: 짧고 경쾌한 팝 사운드 (0.1~0.5초)
- **game-start.mp3**: 게임 시작을 알리는 효과음 (1~3초)
- **game-over.mp3**: 게임 종료를 알리는 효과음 (2~5초)
- **background-music.mp3**: 공포 분위기의 배경음악 (반복 재생용)

## 5. 주의사항

### 브라우저 자동재생 정책:
- 최신 브라우저들은 사용자 상호작용 없이는 오디오 자동재생을 차단합니다
- 게임 시작 버튼을 클릭한 후부터 사운드가 재생됩니다
- catch() 블록으로 자동재생 실패를 처리하여 오류를 방지합니다

### 성능 고려사항:
- 사운드 파일 크기는 가능한 작게 유지하세요 (MP3 권장)
- preload="auto" 속성으로 미리 로딩하되, 파일이 큰 경우 preload="metadata" 사용 고려
- 모바일 환경에서는 데이터 사용량을 고려하세요

### 사용자 경험:
- 사운드 on/off 토글 버튼 추가를 고려하세요
- 볼륨 조절 기능 추가도 좋은 UX입니다
- 배경음악은 게임에 방해가 되지 않도록 볼륨을 낮게 설정하세요

## 6. 사운드 on/off 토글 추가 (선택사항)

사용자가 사운드를 켜고 끌 수 있도록 하려면:

```tsx
// 사운드 활성화 상태 추가
const [soundEnabled, setSoundEnabled] = useState(true)

// 각 사운드 재생 함수에 조건 추가
const playBubblePopSound = () => {
  if (soundEnabled && bubblePopSoundRef.current) {
    bubblePopSoundRef.current.currentTime = 0
    bubblePopSoundRef.current.play().catch(() => {})
  }
}

// 헤더에 사운드 토글 버튼 추가
<Button 
  onClick={() => setSoundEnabled(!soundEnabled)}
  variant="outline" 
  size="sm"
>
  {soundEnabled ? '🔊' : '🔇'}
</Button>
```

이 가이드를 따라하면 미니게임에 멋진 사운드 효과를 추가할 수 있습니다!