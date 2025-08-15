"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Award, Star, Trophy, TrendingUp, User, Medal, Zap } from "lucide-react"

interface BadgeType {
  id: string
  name: string
  description: string
  icon: string
  requirement: {
    type: string
    value: number
  }
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
}

interface UserStats {
  level: number
  currentExp: number
  nextLevelExp: number
  totalExp: number
  badges: BadgeType[]
  stats: {
    creatures_created: number
    likes_received: number
    likes_given: number
    game_score: number
  }
  title?: string
  isAnonymous: boolean
}

interface Props {
  compact?: boolean
  gameScore?: number
}

const rarityColors = {
  common: 'text-gray-400 border-gray-400',
  uncommon: 'text-green-400 border-green-400',
  rare: 'text-blue-400 border-blue-400',
  epic: 'text-purple-400 border-purple-400',
  legendary: 'text-yellow-400 border-yellow-400'
}

const rarityBgColors = {
  common: 'bg-gray-900/50',
  uncommon: 'bg-green-900/50',
  rare: 'bg-blue-900/50',
  epic: 'bg-purple-900/50',
  legendary: 'bg-yellow-900/50'
}

export function AchievementsBadge({ compact = false, gameScore = 0 }: Props) {
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [allBadges, setAllBadges] = useState<BadgeType[]>([])

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const headers: HeadersInit = {}
        if (gameScore > 0) {
          headers['x-game-score'] = gameScore.toString()
        }
        
        const response = await fetch('/api/achievements', { headers })
        if (response.ok) {
          const data = await response.json()
          setUserStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch achievements:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAchievements()
  }, [gameScore])

  useEffect(() => {
    const fetchAllBadges = async () => {
      try {
        const response = await fetch('/api/achievements?action=badges')
        if (response.ok) {
          const data = await response.json()
          setAllBadges(data.badges)
        }
      } catch (error) {
        console.error('Failed to fetch badges:', error)
      }
    }

    fetchAllBadges()
  }, [])

  if (loading || !userStats) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-pulse bg-slate-700 rounded-full w-8 h-8"></div>
        <div className="animate-pulse bg-slate-700 rounded w-20 h-4"></div>
      </div>
    )
  }

  const expPercentage = userStats.nextLevelExp > 0 
    ? (userStats.currentExp / userStats.nextLevelExp) * 100 
    : 100

  if (compact) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-gray-300 hover:text-white">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium">Lv.{userStats.level}</span>
            </div>
            {userStats.badges.length > 0 && (
              <Badge variant="secondary" className="text-xs bg-purple-600/20 text-purple-300">
                {userStats.badges.length}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span>프로필 & 업적</span>
            </DialogTitle>
          </DialogHeader>
          <ProfileContent userStats={userStats} allBadges={allBadges} />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="space-y-4">
      <ProfileContent userStats={userStats} allBadges={allBadges} />
    </div>
  )
}

function ProfileContent({ userStats, allBadges }: { userStats: UserStats, allBadges: BadgeType[] }) {
  const expPercentage = userStats.nextLevelExp > 0 
    ? (userStats.currentExp / userStats.nextLevelExp) * 100 
    : 100

  const earnedBadgeIds = userStats.badges.map(badge => badge.id)
  const unearnedBadges = allBadges.filter(badge => !earnedBadgeIds.includes(badge.id))

  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="bg-slate-700 border-slate-600 w-full">
        <TabsTrigger value="profile" className="flex-1 text-gray-300 data-[state=active]:text-white">
          <User className="w-4 h-4 mr-2" />
          프로필
        </TabsTrigger>
        <TabsTrigger value="badges" className="flex-1 text-gray-300 data-[state=active]:text-white">
          <Medal className="w-4 h-4 mr-2" />
          업적 ({userStats.badges.length})
        </TabsTrigger>
        <TabsTrigger value="stats" className="flex-1 text-gray-300 data-[state=active]:text-white">
          <TrendingUp className="w-4 h-4 mr-2" />
          통계
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {userStats.isAnonymous ? '익명 사용자' : '무서핑 유저'}
                  </h3>
                  <p className="text-purple-300 text-sm">{userStats.title || '신참 유령'}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-400">
                  Lv.{userStats.level}
                </div>
                <div className="text-xs text-gray-400">
                  {userStats.totalExp} EXP
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">다음 레벨까지</span>
                <span className="text-white">
                  {userStats.currentExp} / {userStats.nextLevelExp} EXP
                </span>
              </div>
              <Progress value={expPercentage} className="h-2 bg-slate-700">
                <div 
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all rounded-full"
                  style={{ width: `${expPercentage}%` }}
                />
              </Progress>
              
              {userStats.badges.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">최근 획득 배지</h4>
                  <div className="flex flex-wrap gap-2">
                    {userStats.badges.slice(0, 3).map((badge) => (
                      <div 
                        key={badge.id}
                        className={`flex items-center space-x-1 px-2 py-1 rounded-full border text-xs ${rarityColors[badge.rarity]} ${rarityBgColors[badge.rarity]}`}
                      >
                        <span>{badge.icon}</span>
                        <span>{badge.name}</span>
                      </div>
                    ))}
                    {userStats.badges.length > 3 && (
                      <div className="flex items-center px-2 py-1 rounded-full bg-slate-700 text-xs text-gray-300">
                        +{userStats.badges.length - 3}개 더
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="badges" className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {/* 획득한 배지 */}
          {userStats.badges.length > 0 && (
            <div>
              <h3 className="text-white font-medium mb-3 flex items-center">
                <Award className="w-4 h-4 mr-2 text-yellow-400" />
                획득한 배지 ({userStats.badges.length})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {userStats.badges.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} earned={true} />
                ))}
              </div>
            </div>
          )}
          
          {/* 미획득 배지 */}
          {unearnedBadges.length > 0 && (
            <div>
              <h3 className="text-white font-medium mb-3 flex items-center">
                <Zap className="w-4 h-4 mr-2 text-gray-400" />
                도전할 배지 ({unearnedBadges.length})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {unearnedBadges.slice(0, 6).map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} earned={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="stats" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <StatCard 
            icon="📝" 
            label="작성한 존재" 
            value={userStats.stats.creatures_created}
            color="text-blue-400"
          />
          <StatCard 
            icon="❤️" 
            label="받은 좋아요" 
            value={userStats.stats.likes_received}
            color="text-red-400"
          />
          <StatCard 
            icon="👍" 
            label="준 좋아요" 
            value={userStats.stats.likes_given}
            color="text-green-400"
          />
          <StatCard 
            icon="🎮" 
            label="최고 게임 점수" 
            value={userStats.stats.game_score}
            color="text-purple-400"
          />
        </div>
      </TabsContent>
    </Tabs>
  )
}

function BadgeCard({ badge, earned }: { badge: BadgeType, earned: boolean }) {
  return (
    <Card className={`${earned ? 'bg-slate-800 border-slate-600' : 'bg-slate-900 border-slate-700'} ${earned ? '' : 'opacity-60'}`}>
      <CardContent className="p-3">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">{earned ? badge.icon : '🔒'}</div>
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium text-sm ${earned ? rarityColors[badge.rarity] : 'text-gray-400'}`}>
              {badge.name}
            </h4>
            <p className="text-xs text-gray-400 mt-1">{badge.description}</p>
            {!earned && (
              <p className="text-xs text-gray-500 mt-1">
                목표: {badge.requirement.value}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatCard({ icon, label, value, color }: { icon: string, label: string, value: number, color: string }) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-4 text-center">
        <div className="text-2xl mb-2">{icon}</div>
        <div className={`text-2xl font-bold ${color} mb-1`}>
          {value.toLocaleString()}
        </div>
        <div className="text-xs text-gray-400">{label}</div>
      </CardContent>
    </Card>
  )
}