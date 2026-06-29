'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import {
  Wind,
  Activity,
  Droplets,
  Thermometer,
  TrendingUp,
} from 'lucide-react'

type TimeRange = '1h' | '24h' | '7d'

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

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')
  const [data, setData] = useState<ChartData[]>([])

  useEffect(() => {
    const count = timeRange === '1h' ? 12 : timeRange === '24h' ? 24 : 7

    const generated = Array.from({ length: count }, (_, i) => {
      const phase = (i / count) * Math.PI * 2

      let timestamp = ''

      if (timeRange === '1h') {
        timestamp = `${i * 5}m`
      } else if (timeRange === '24h') {
        const d = new Date(Date.now() - (count - i) * 3600000)
        timestamp = d.toLocaleTimeString('en-US', { hour: 'numeric' })
      } else {
        const d = new Date()
        d.setDate(d.getDate() - (count - i))
        timestamp = d.toLocaleDateString('en-US', { weekday: 'short' })
      }

      return {
        timestamp,
        pm25: 12 + Math.sin(phase) * 5,
        pm10: 28 + Math.sin(phase + 0.5) * 8,
        pm1: 6 + Math.sin(phase) * 2,
        co2: 550 + Math.sin(phase) * 80,
        temperature: 22 + Math.sin(phase) * 3,
        humidity: 55 + Math.sin(phase + Math.PI) * 15,
        ozone: 18 + Math.sin(phase + 1) * 6,
      }
    })

    setData(generated)
  }, [timeRange])

  const avg = (key: keyof ChartData) =>
    data.length
      ? data.reduce((s, d) => s + Number(d[key]), 0) / data.length
      : 0

  const chartMargin = {
    top: 5,
    right: 0,
    left: -35,
    bottom: 0,
  }

  return (
    <div className="w-full max-w-none px-1 sm:px-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Environmental analytics
          </h2>
        
        </div>

        <div className="flex gap-2">
          {(['1h', '24h', '7d'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition
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
              {avg('pm25').toFixed(1)}
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
              {avg('co2').toFixed(0)}
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
              {avg('temperature').toFixed(1)}°C
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
              {avg('humidity').toFixed(0)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Particulate Matter Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="px-1 sm:px-4 pb-3">
          <div className="h-[340px] sm:h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="timestamp" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Line dataKey="pm25" stroke="#06b6d4" dot={false} />
                <Line dataKey="pm10" stroke="#f59e0b" dot={false} />
                <Line dataKey="pm1" stroke="#ef4444" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">CO₂ Trend</CardTitle>
        </CardHeader>
        <CardContent className="px-1 sm:px-4 pb-3">
          <div className="h-[340px] sm:h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={chartMargin} barCategoryGap="70%">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="timestamp" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="co2" fill="#f59e0b" barSize={6} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Humidity & Ozone Trend</CardTitle>
        </CardHeader>
        <CardContent className="px-1 sm:px-4 pb-3">
          <div className="h-[340px] sm:h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="timestamp" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Line dataKey="humidity" stroke="#10b981" dot={false} />
                <Line dataKey="ozone" stroke="#f97316" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Temperature Trend</CardTitle>
        </CardHeader>
        <CardContent className="px-1 sm:px-4 pb-3">
          <div className="h-[340px] sm:h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="timestamp" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line dataKey="temperature" stroke="#3b82f6" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}