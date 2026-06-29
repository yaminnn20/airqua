'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Activity, Wind, Droplets, Clock } from 'lucide-react'

interface ChartData {
  timestamp: string
  pm25: number
  pm10: number
  co2: number
  temperature: number
  humidity: number
  pm1: number
  ozone: number
}

type TimeRange = '1h' | '24h' | '7d'

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [stats, setStats] = useState({
    avgPm25: 0,
    maxPm25: 0,
    avgCo2: 0,
    maxCo2: 0,
    avgTemp: 0,
    avgHumidity: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Configure data generation based on selected time range
        let points = 24
        let intervalMs = 60 * 60 * 1000 // 1 hour
        let timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric' }

        if (timeRange === '1h') {
          points = 12 // Every 5 minutes
          intervalMs = 5 * 60 * 1000
          timeOptions = { hour: 'numeric', minute: '2-digit' }
        } else if (timeRange === '7d') {
          points = 7 // Every 1 day
          intervalMs = 24 * 60 * 60 * 1000
          timeOptions = { weekday: 'short' }
        }

        const mockData: ChartData[] = Array.from({ length: points }, (_, i) => {
          const phase = (i / points) * Math.PI * 2
          const time = new Date(Date.now() - (points - 1 - i) * intervalMs)
          const formattedTime = time.toLocaleTimeString('en-US', timeOptions).replace(':00 ', ' ')

          return {
            timestamp: timeRange === '7d' ? time.toLocaleDateString('en-US', timeOptions) : formattedTime,
            pm25: 12 + Math.sin(phase) * 5 + (Math.random() - 0.5) * 2,
            pm10: 28 + Math.sin(phase + 0.5) * 8 + (Math.random() - 0.5) * 3,
            co2: 550 + Math.sin(phase) * 80 + (Math.random() - 0.5) * 20,
            temperature: 22 + Math.sin(phase) * 3 + (Math.random() - 0.5) * 1,
            humidity: 55 + Math.sin(phase + Math.PI) * 15 + (Math.random() - 0.5) * 5,
            pm1: 6 + Math.sin(phase) * 2 + (Math.random() - 0.5) * 1,
            ozone: 18 + Math.sin(phase + 1) * 6 + (Math.random() - 0.5) * 2,
          }
        })

        setChartData(mockData)

        // Calculate Stats
        const avgPm25 = mockData.reduce((a, b) => a + b.pm25, 0) / mockData.length
        const maxPm25 = Math.max(...mockData.map(d => d.pm25))
        const avgCo2 = mockData.reduce((a, b) => a + b.co2, 0) / mockData.length
        const maxCo2 = Math.max(...mockData.map(d => d.co2))
        const avgTemp = mockData.reduce((a, b) => a + b.temperature, 0) / mockData.length
        const avgHumidity = mockData.reduce((a, b) => a + b.humidity, 0) / mockData.length

        setStats({ avgPm25, maxPm25, avgCo2, maxCo2, avgTemp, avgHumidity })
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [timeRange]) // Re-run when timeRange changes

  // Chart styling constants
  const chartMargin = { top: 10, right: 10, left: -25, bottom: 0 }
  const axisStyle = { fontSize: '10px', fill: '#94a3b8' }

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto">

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-cyan-400" />
          Environment Overview
        </h2>

        {/* Time Range Toggle Buttons */}
        <div className="flex bg-slate-800 p-1 rounded-lg w-full sm:w-auto">
          {(['1h', '24h', '7d'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${timeRange === range
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-12 flex flex-col items-center gap-3">
          <Clock className="w-6 h-6 animate-pulse" />
          Loading analytics...
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Wind className="w-4 h-4 text-cyan-400" />
                  Avg PM2.5 ({timeRange})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-xl sm:text-2xl font-bold text-cyan-400">{stats.avgPm25.toFixed(1)}</div>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Peak: {stats.maxPm25.toFixed(1)} µg/m³</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  Avg CO₂ ({timeRange})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-xl sm:text-2xl font-bold text-amber-400">{stats.avgCo2.toFixed(0)}</div>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Peak: {stats.maxCo2.toFixed(0)} ppm</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-400" />
                  Avg Temp
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-xl sm:text-2xl font-bold text-blue-400">{stats.avgTemp.toFixed(1)}°C</div>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Over {timeRange}</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-green-400" />
                  Avg Humidity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-xl sm:text-2xl font-bold text-green-400">{stats.avgHumidity.toFixed(0)}%</div>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Over {timeRange}</p>
              </CardContent>
            </Card>
          </div>

          {/* PM Trend Chart */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center gap-2 text-sm sm:text-base">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                Particulate Matter Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              {/* Removed min-w and horizontal scrolling, added dynamic height */}
              <div className="w-full h-[250px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={chartMargin}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis
                      dataKey="timestamp"
                      stroke="#94a3b8"
                      style={axisStyle}
                      tickMargin={10}
                      minTickGap={20}
                    />
                    <YAxis stroke="#94a3b8" style={axisStyle} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '6px', fontSize: '12px' }}
                      itemStyle={{ padding: 0 }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="pm25" stroke="#06b6d4" dot={false} name="PM2.5" strokeWidth={2} />
                    <Line type="monotone" dataKey="pm10" stroke="#f59e0b" dot={false} name="PM10" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* CO2 Bar Chart */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center gap-2 text-sm sm:text-base">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                CO₂ Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <div className="w-full h-[250px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={chartMargin} maxBarSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis
                      dataKey="timestamp"
                      stroke="#94a3b8"
                      style={axisStyle}
                      tickMargin={10}
                      minTickGap={20}
                    />
                    <YAxis stroke="#94a3b8" style={axisStyle} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '6px', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    <Bar dataKey="co2" fill="#f59e0b" name="CO₂ (ppm)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}