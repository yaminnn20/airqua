'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Activity, Wind, Droplets, Thermometer } from 'lucide-react'

interface ChartData {
  timestamp: string
  pm25: number
  pm10: number
  pm1: number
  co2: number
  temperature: number
  humidity: number
  ozone: number
}

type TimeRange = '1h' | '24h' | '7d'

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')
  const [data, setData] = useState<ChartData[]>([])

  const [stats, setStats] = useState({
    avgPm25: 0,
    avgCo2: 0,
    avgTemp: 0,
    avgHumidity: 0,
  })

  useEffect(() => {
    const points = timeRange === '1h' ? 12 : timeRange === '24h' ? 24 : 7

    const generated: ChartData[] = Array.from({ length: points }, (_, i) => {
      const phase = (i / points) * Math.PI * 2

      let timestamp = ''

      if (timeRange === '1h') {
        timestamp = `${i * 5}m`
      } else if (timeRange === '24h') {
        const t = new Date(Date.now() - (points - i) * 60 * 60 * 1000)
        timestamp = t.toLocaleTimeString('en-US', { hour: 'numeric' })
      } else {
        const d = new Date()
        d.setDate(d.getDate() - (points - i))
        timestamp = d.toLocaleDateString('en-US', { weekday: 'short' })
      }

      return {
        timestamp,
        pm25: 12 + Math.sin(phase) * 5 + (Math.random() - 0.5) * 2,
        pm10: 28 + Math.sin(phase + 0.5) * 8 + (Math.random() - 0.5) * 3,
        pm1: 6 + Math.sin(phase) * 2 + (Math.random() - 0.5),
        co2: 550 + Math.sin(phase) * 80 + (Math.random() - 0.5) * 20,
        temperature: 22 + Math.sin(phase) * 3 + (Math.random() - 0.5),
        humidity: 55 + Math.sin(phase + Math.PI) * 15 + (Math.random() - 0.5) * 5,
        ozone: 18 + Math.sin(phase + 1) * 6 + (Math.random() - 0.5) * 2,
      }
    })

    setData(generated)

    setStats({
      avgPm25: generated.reduce((a, b) => a + b.pm25, 0) / generated.length,
      avgCo2: generated.reduce((a, b) => a + b.co2, 0) / generated.length,
      avgTemp: generated.reduce((a, b) => a + b.temperature, 0) / generated.length,
      avgHumidity: generated.reduce((a, b) => a + b.humidity, 0) / generated.length,
    })
  }, [timeRange])

  const chartMargin = { top: 10, right: 10, left: -20, bottom: 0 }

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">
            Clinical Air Quality Monitor
          </h2>
          <p className="text-sm text-slate-400">
            Environmental analytics dashboard
          </p>
        </div>

        <div className="flex gap-2">
          {(['1h', '24h', '7d'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition
                ${timeRange === range
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-slate-300">
              <Wind className="w-4 h-4 text-cyan-400" />
              PM2.5
            </div>
            <div className="text-2xl font-bold text-cyan-400 mt-2">
              {stats.avgPm25.toFixed(1)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-slate-300">
              <Activity className="w-4 h-4 text-amber-400" />
              CO₂
            </div>
            <div className="text-2xl font-bold text-amber-400 mt-2">
              {stats.avgCo2.toFixed(0)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-slate-300">
              <Thermometer className="w-4 h-4 text-blue-400" />
              Temp
            </div>
            <div className="text-2xl font-bold text-blue-400 mt-2">
              {stats.avgTemp.toFixed(1)}°C
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-slate-300">
              <Droplets className="w-4 h-4 text-green-400" />
              Humidity
            </div>
            <div className="text-2xl font-bold text-green-400 mt-2">
              {stats.avgHumidity.toFixed(0)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Particulate Matter Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] sm:h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="timestamp" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Line dataKey="pm25" stroke="#06b6d4" strokeWidth={2} dot={false} />
                <Line dataKey="pm10" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line dataKey="pm1" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">CO₂ Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] sm:h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={chartMargin} barCategoryGap="65%">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="timestamp" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="co2"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                  barSize={timeRange === '7d' ? 18 : 8}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">
            Humidity & Ozone Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] sm:h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="timestamp" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Line dataKey="humidity" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line dataKey="ozone" stroke="#f97316" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Temperature Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] sm:h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="timestamp" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Line dataKey="temperature" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}