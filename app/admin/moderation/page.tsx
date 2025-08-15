"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react"

interface ModerationStats {
  totalChecked: number
  approved: number
  rejected: number
  approvalRate: number
  topReasons: [string, number][]
}

interface ReportStats {
  total: number
  pending: number
  resolved: number
  byReason: Record<string, number>
  byType: Record<string, number>
}

interface RecentReport {
  id: string
  content_id: string
  content_type: string
  reason: string
  description?: string
  status: string
  created_at: string
}

export default function ModerationDashboard() {
  const [moderationStats, setModerationStats] = useState<ModerationStats | null>(null)
  const [reportStats, setReportStats] = useState<ReportStats | null>(null)
  const [recentReports, setRecentReports] = useState<RecentReport[]>([])
  const [loading, setLoading] = useState(true)

  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 검열 통계
        const moderationResponse = await fetch('/api/moderation?action=stats')
        if (moderationResponse.ok) {
          const moderationData = await moderationResponse.json()
          setModerationStats(moderationData.stats)
        }

        // 신고 통계  
        const reportResponse = await fetch('/api/reports?action=stats')
        if (reportResponse.ok) {
          const reportData = await reportResponse.json()
          setReportStats(reportData.stats)
        }

        // 최근 신고 목록
        const recentResponse = await fetch('/api/reports?action=recent')
        if (recentResponse.ok) {
          const recentData = await recentResponse.json()
          setRecentReports(recentData.reports || [])
        }

      } catch (error) {
        console.error('관리자 데이터 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getReasonBadgeColor = (reason: string) => {
    switch (reason) {
      case 'spam': return 'bg-orange-600'
      case 'inappropriate': return 'bg-red-600' 
      case 'violence': return 'bg-purple-600'
      case 'harassment': return 'bg-pink-600'
      default: return 'bg-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'rejected': return <XCircle className="w-4 h-4 text-red-400" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-slate-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center">
              <Shield className="w-8 h-8 mr-3 text-blue-400" />
              모더레이션 대시보드
            </h1>
            <p className="text-gray-400 mt-1">콘텐츠 검열 및 신고 관리</p>
          </div>
          <div className="text-xs text-gray-500">
            마지막 업데이트: {new Date().toLocaleString('ko-KR')}
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">검열된 콘텐츠</p>
                  <p className="text-2xl font-bold text-white">
                    {moderationStats?.totalChecked || 0}
                  </p>
                  <p className="text-xs text-green-400">
                    승인률 {moderationStats?.approvalRate || 0}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">미처리 신고</p>
                  <p className="text-2xl font-bold text-white">
                    {reportStats?.pending || 0}
                  </p>
                  <p className="text-xs text-yellow-400">
                    총 {reportStats?.total || 0}건
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">승인된 콘텐츠</p>
                  <p className="text-2xl font-bold text-white">
                    {moderationStats?.approved || 0}
                  </p>
                  <p className="text-xs text-green-400">
                    +{Math.round(((moderationStats?.approved || 0) / Math.max(moderationStats?.totalChecked || 1, 1)) * 100)}%
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">차단된 콘텐츠</p>
                  <p className="text-2xl font-bold text-white">
                    {moderationStats?.rejected || 0}
                  </p>
                  <p className="text-xs text-red-400">
                    -{Math.round(((moderationStats?.rejected || 0) / Math.max(moderationStats?.totalChecked || 1, 1)) * 100)}%
                  </p>
                </div>
                <Ban className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 상세 정보 탭 */}
        <Tabs defaultValue="reports" className="space-y-4">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="reports" className="data-[state=active]:bg-slate-700">
              최근 신고
            </TabsTrigger>
            <TabsTrigger value="moderation" className="data-[state=active]:bg-slate-700">
              검열 통계
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">최근 신고 목록</CardTitle>
              </CardHeader>
              <CardContent>
                {recentReports.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    신고된 콘텐츠가 없습니다
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recentReports.map((report) => (
                      <div 
                        key={report.id} 
                        className="flex items-start justify-between p-4 bg-slate-700 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getStatusIcon(report.status)}
                            <Badge className={`${getReasonBadgeColor(report.reason)} text-white text-xs`}>
                              {report.reason}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {report.content_type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 mb-1">
                            콘텐츠 ID: <code className="bg-slate-600 px-1 rounded text-xs">{report.content_id}</code>
                          </p>
                          {report.description && (
                            <p className="text-sm text-gray-400 italic">
                              "{report.description}"
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            {formatDate(report.created_at)}
                          </p>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <Button size="sm" variant="outline" className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white">
                            승인
                          </Button>
                          <Button size="sm" variant="outline" className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white">
                            차단
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderation">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">주요 차단 사유</CardTitle>
                </CardHeader>
                <CardContent>
                  {moderationStats?.topReasons && moderationStats.topReasons.length > 0 ? (
                    <div className="space-y-3">
                      {moderationStats.topReasons.map(([reason, count], index) => (
                        <div key={reason} className="flex items-center justify-between">
                          <span className="text-gray-300">{reason}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium">{count}건</span>
                            <div className="w-16 bg-slate-600 rounded-full h-2">
                              <div 
                                className="bg-red-400 rounded-full h-2" 
                                style={{ 
                                  width: `${(count / (moderationStats?.topReasons?.[0]?.[1] || 1)) * 100}%` 
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-4">
                      차단된 콘텐츠가 없습니다
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">신고 유형별 통계</CardTitle>
                </CardHeader>
                <CardContent>
                  {reportStats?.byReason ? (
                    <div className="space-y-3">
                      {Object.entries(reportStats.byReason).map(([reason, count]) => (
                        <div key={reason} className="flex items-center justify-between">
                          <span className="text-gray-300">
                            {reason === 'spam' && '스팸/도배'}
                            {reason === 'inappropriate' && '부적절한 내용'}
                            {reason === 'violence' && '과도한 폭력'}
                            {reason === 'harassment' && '괴롭힘'}
                            {reason === 'other' && '기타'}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium">{count}건</span>
                            <div className="w-16 bg-slate-600 rounded-full h-2">
                              <div 
                                className="bg-yellow-400 rounded-full h-2" 
                                style={{ 
                                  width: `${(count / Math.max(...Object.values(reportStats.byReason))) * 100}%` 
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-4">
                      신고 데이터가 없습니다
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}