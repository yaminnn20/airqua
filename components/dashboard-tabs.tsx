'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AQIDashboard } from '@/components/aqi-dashboard'
import { AnalyticsDashboard } from '@/components/analytics-dashboard'
import { AlertsTimeline } from '@/components/alerts-timeline'
import { ReportsPage } from '@/components/reports-page'
import { BarChart3, AlertCircle, TrendingUp, FileText } from 'lucide-react'

export function DashboardTabs() {
  const [activeTab, setActiveTab] = useState('monitor')

  return (
    <div className="min-h-screen bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur ">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <TabsList className="grid w-full grid-cols-4 bg-slate-900 border border-slate-700">
              <TabsTrigger
                value="monitor"
                className="flex items-center gap-2 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Monitor</span>
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="flex items-center gap-2 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300"
              >
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger
                value="alerts"
                className="flex items-center gap-2 data-[state=active]:bg-red-500/20 data-[state=active]:text-red-300"
              >
                <AlertCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Alerts</span>
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="flex items-center gap-2 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Reports</span>
              </TabsTrigger>
              
            </TabsList>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <TabsContent value="monitor" className="space-y-6">
            <AQIDashboard />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <AlertsTimeline />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <ReportsPage />
          </TabsContent>

        </div>
      </Tabs>
    </div>
  )
}
