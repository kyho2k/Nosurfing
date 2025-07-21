"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Ghost, Plus, Users } from "lucide-react"
import { useRouter } from "next/navigation"

interface CreatureData {
  name: string
  appearanceTime: string
  location: string
  characteristics: string
  type: string
}

export default function HomePage() {
  const router = useRouter()
  const [creature, setCreature] = useState<CreatureData>({
    name: "",
    appearanceTime: "",
    location: "",
    characteristics: "",
    type: "",
  })

  const handleInputChange = (field: keyof CreatureData, value: string) => {
    setCreature((prev) => ({ ...prev, [field]: value }))
  }

  const handleCreateCreature = () => {
    // 로컬 스토리지에 존재 저장
    const existingCreatures = JSON.parse(localStorage.getItem("creatures") || "[]")
    const newCreature = {
      ...creature,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    }
    existingCreatures.push(newCreature)
    localStorage.setItem("creatures", JSON.stringify(existingCreatures))

    // 피드 페이지로 이동
    router.push("/feed")
  }

  const isFormValid =
    creature.name && creature.appearanceTime && creature.location && creature.characteristics && creature.type

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="p-6 border-b border-slate-700">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Ghost className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">무서핑</h1>
            <span className="text-gray-400 text-sm">- 존재들의 세계</span>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/feed")}
            className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"
          >
            <Users className="w-4 h-4 mr-2" />
            피드 보기
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-4">당신만의 무서운 존재를 만들어보세요</h2>
            <p className="text-gray-300 text-lg">
              상상 속의 기괴하고 무서운 존재를 세상에 공개하고, AI가 만든 괴담을 확인해보세요
            </p>
          </div>

          <Card className="bg-slate-800 border-slate-700 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center">
                <Plus className="w-6 h-6 mr-2 text-purple-400" />
                새로운 존재 만들기
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 이름 */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white font-medium">
                  존재의 이름
                </Label>
                <Input
                  id="name"
                  placeholder="예: 계단 밑의 그림자, 새벽 3시의 속삭임..."
                  value={creature.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                />
              </div>

              {/* 출몰 시간 */}
              <div className="space-y-2">
                <Label htmlFor="time" className="text-white font-medium">
                  출몰 시간
                </Label>
                <Input
                  id="time"
                  placeholder="예: 새벽 3시 33분, 보름달이 뜨는 밤..."
                  value={creature.appearanceTime}
                  onChange={(e) => handleInputChange("appearanceTime", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                />
              </div>

              {/* 출몰 장소 */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-white font-medium">
                  출몰 장소
                </Label>
                <Input
                  id="location"
                  placeholder="예: 오래된 학교 화장실, 지하철 마지막 칸..."
                  value={creature.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                />
              </div>

              {/* 유형 */}
              <div className="space-y-2">
                <Label htmlFor="type" className="text-white font-medium">
                  존재 유형
                </Label>
                <Select onValueChange={(value) => handleInputChange("type", value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="존재의 유형을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="ghost" className="text-white">
                      유령/영혼
                    </SelectItem>
                    <SelectItem value="monster" className="text-white">
                      괴물/크리처
                    </SelectItem>
                    <SelectItem value="demon" className="text-white">
                      악마/악령
                    </SelectItem>
                    <SelectItem value="urban-legend" className="text-white">
                      도시전설
                    </SelectItem>
                    <SelectItem value="cursed-object" className="text-white">
                      저주받은 물건
                    </SelectItem>
                    <SelectItem value="supernatural" className="text-white">
                      초자연적 현상
                    </SelectItem>
                    <SelectItem value="other" className="text-white">
                      기타
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 특징 */}
              <div className="space-y-2">
                <Label htmlFor="characteristics" className="text-white font-medium">
                  특징 및 설명
                </Label>
                <Textarea
                  id="characteristics"
                  placeholder="존재의 외모, 행동, 능력 등을 자세히 설명해주세요..."
                  value={creature.characteristics}
                  onChange={(e) => handleInputChange("characteristics", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-gray-400 min-h-[120px]"
                />
              </div>

              {/* 생성 버튼 */}
              <Button
                onClick={handleCreateCreature}
                disabled={!isFormValid}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Ghost className="w-5 h-5 mr-2" />
                존재 만들기
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-gray-500 text-sm py-8">
        <p>© 2024 무서핑 - 당신의 상상이 현실이 되는 곳</p>
      </footer>
    </div>
  )
}
