'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Activity, Wind, Droplets } from 'lucide-react'

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

export function AnalyticsDashboard() {
  const [data24h, setData24h] = useState<ChartData[]>([])
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
      try {
        const mockData: ChartData[] = Array.from({ length: 24 }, (_, i) => {
          const phase = (i / 24) * Math.PI * 2

          // Using 'numeric' to get shorter labels like "2 PM" instead of "02:00 PM"
          const time = new Date(Date.now() - (24 - i) * 60 * 60 * 1000)
          const shortTime = time.toLocaleTimeString('en-US', { hour: 'numeric' })

          return {
            timestamp: shortTime,
            pm25: 12 + Math.sin(phase) * 5 + (Math.random() - 0.5) * 2,
            pm10: 28 + Math.sin(phase + 0.5) * 8 + (Math.random() - 0.5) * 3,
            co2: 550 + Math.sin(phase) * 80 + (Math.random() - 0.5) * 20,
            temperature: 22 + Math.sin(phase) * 3 + (Math.random() - 0.5) * 1,
            humidity: 55 + Math.sin(phase + Math.PI) * 15 + (Math.random() - 0.5) * 5,
            pm1: 6 + Math.sin(phase) * 2 + (Math.random() - 0.5) * 1,
            ozone: 18 + Math.sin(phase + 1) * 6 + (Math.random() - 0.5) * 2,
          }
        })

        setData24h(mockData)

        const avgPm25 = mockData.reduce((a, b) => a + b.pm25, 0) / mockData.length
        const maxPm25 = Math.max(...mockData.map(d => d.pm25))
        const avgCo2 = mockData.reduce((a, b) => a + b.co2, 0) / mockData.length
        const maxCo2 = Math.max(...mockData.map(d => d.co2))
        const avgTemp = mockData.reduce((a, b) => a + b.temperature, 0) / mockData.length
        const avgHumidity = mockData.reduce((a, b) => a + b.humidity, 0) / mockData.length

        setStats({ avgPm25, maxPm25, avgCo2, maxCo2, avgTemp, avgHumidity })
      } catch (error) {
        console.error('[v0] Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="text-center text-slate-400 py-8">Loading analytics...</div>
    )
  }

  // Adjusted margins to give the chart maximum breathing room
  const chartMargin = { top: 10, right: 10, left: -20, bottom: 0 }

  return (
    <div className="space-y-6 w-full">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Wind className="w-4 h-4 text-cyan-400" />
              Avg PM2.5 (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-400">{stats.avgPm25.toFixed(1)}</div>
            <p className="text-xs text-slate-500 mt-1">Peak: {stats.maxPm25.toFixed(1)} µg/m³</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              Avg CO₂ (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{stats.avgCo2.toFixed(0)}</div>
            <p className="text-xs text-slate-500 mt-1">Peak: {stats.maxCo2.toFixed(0)} ppm</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-400" />
              Avg Temperature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{stats.avgTemp.toFixed(1)}°C</div>
            <p className="text-xs text-slate-500 mt-1">Comfortable range</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-green-400" />
              Avg Humidity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{stats.avgHumidity.toFixed(0)}%</div>
            <p className="text-xs text-slate-500 mt-1">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* PM2.5 & PM10 Trend Chart */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-2 sm:pb-6">
          <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Particulate Matter Trend (24h)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {/* THE FIX: Horizontal scroll wrapper */}
          <div className="w-full overflow-x-auto pb-4">
            <div className="min-w-[600px] h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data24h} margin={chartMargin}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#94a3b8"
                    style={{ fontSize: '11px' }}
                    tickMargin={10}
                    minTickGap={15}
                  />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '6px' }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                  <Legend wrapperStyle={{ color: '#cbd5e1', fontSize: '12px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="pm25" stroke="#06b6d4" dot={false} name="PM2.5" strokeWidth={2} />
                  <Line type="monotone" dataKey="pm10" stroke="#f59e0b" dot={false} name="PM10" strokeWidth={2} />
                  <Line type="monotone" dataKey="pm1" stroke="#ef4444" dot={false} name="PM1" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CO₂ Trend */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-2 sm:pb-6">
          <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
            <Activity className="w-5 h-5 text-amber-400" />
            CO₂ Trend (24h)
          </CardTitle>
        </CardHeader>

        <CardContent className="px-2 sm:px-6">
          <div className="w-full overflow-x-auto pb-4">
            <div className="min-w-[600px] h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data24h}
                  margin={chartMargin}
                  barSize={6}
                  barCategoryGap="40%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#334155"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="timestamp"
                    stroke="#94a3b8"
                    style={{ fontSize: "11px" }}
                    tickMargin={10}
                    minTickGap={15}
                  />

                  <YAxis
                    yAxisId="left"
                    stroke="#94a3b8"
                    style={{ fontSize: "11px" }}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: "6px",
                    }}
                    labelStyle={{ color: "#f1f5f9" }}
                  />

                  <Legend
                    wrapperStyle={{
                      color: "#cbd5e1",
                      fontSize: "12px",
                      paddingTop: "10px",
                    }}
                  />

                  <Bar
                    yAxisId="left"
                    dataKey="co2"
                    fill="#f59e0b"
                    name="CO₂ (ppm)"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Humidity & Ozone Trend */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-2 sm:pb-6">
          <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
            <Droplets className="w-5 h-5 text-green-400" />
            Humidity & Ozone Trend (24h)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="w-full overflow-x-auto pb-4">
            <div className="min-w-[600px] h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data24h} margin={chartMargin}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#94a3b8"
                    style={{ fontSize: '11px' }}
                    tickMargin={10}
                    minTickGap={15}
                  />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '6px' }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                  <Legend wrapperStyle={{ color: '#cbd5e1', fontSize: '12px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="humidity" stroke="#10b981" dot={false} name="Humidity (%)" strokeWidth={2} />
                  <Line type="monotone" dataKey="ozone" stroke="#f97316" dot={false} name="Ozone (ppb)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}