'use client'

import { useEffect, useState, useMemo } from 'react'
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
  Legend
} from 'recharts'
import { Wind, Activity, Droplets, Thermometer, TrendingUp, CloudFog } from 'lucide-react'

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
    const fetchData = async () => {
      try {
        const hours = timeRange === '1h' ? '1' : timeRange === '24h' ? '24' : '168'
        const response = await fetch(`/api/sensor-data?hours=${hours}&hospitalId=default`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch sensor data')
        }
        
        const result = await response.json()
        
        if (result.success && result.data && result.data.length > 0) {
          // Transform database data for charts
          const chartData = result.data.map((item: any) => ({
            timestamp: new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit' }),
            pm25: parseFloat(item.pm25) || 0,
            pm10: parseFloat(item.pm10) || 0,
            pm1: parseFloat(item.pm1) || 0,
            co2: parseFloat(item.co2) || 0,
            temperature: parseFloat(item.temperature) || 0,
            humidity: parseFloat(item.humidity) || 0,
            ozone: parseFloat(item.ozone) || 0,
          }))
          
          setData(chartData)
          return
        }
      } catch (error) {
        console.log('[v0] Error fetching real data, using fallback mock data:', error)
      }
      
      // Fallback to mock data if database is empty or error occurs
      const count = timeRange === '1h' ? 12 : timeRange === '24h' ? 24 : 7
      const rangeOffset = timeRange === '1h' ? 5 : timeRange === '24h' ? 0 : -3

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
          pm25: 12 + rangeOffset + Math.sin(phase) * 5 + Math.random() * 2,
          pm10: 28 + rangeOffset + Math.sin(phase + 0.5) * 8,
        pm1: 6 + (rangeOffset * 0.5) + Math.sin(phase) * 2,
        co2: 550 + (rangeOffset * 15) + Math.sin(phase) * 80 + Math.random() * 10,
        temperature: 22 + (rangeOffset * 0.3) + Math.sin(phase) * 3,
        humidity: 55 + rangeOffset + Math.sin(phase + Math.PI) * 15,
        ozone: 18 + rangeOffset + Math.sin(phase + 1) * 6,
        }
      })
      
      setData(generated)
    }
    
    fetchData()
  }, [timeRange])

  const averages = useMemo(() => {
    if (data.length === 0) return { pm25: 0, co2: 0, temp: 0, humidity: 0 }
    const sum = data.reduce((acc, curr) => ({
      pm25: acc.pm25 + curr.pm25,
      co2: acc.co2 + curr.co2,
      temp: acc.temp + curr.temperature,
      humidity: acc.humidity + curr.humidity,
    }), { pm25: 0, co2: 0, temp: 0, humidity: 0 })
    
    return {
      pm25: sum.pm25 / data.length,
      co2: sum.co2 / data.length,
      temp: sum.temp / data.length,
      humidity: sum.humidity / data.length,
    }
  }, [data])

  return (
    <div key={timeRange} className="w-full max-w-none px-1 sm:px-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Environmental analytics</h2>
        <div className="flex gap-2">
          {(['1h', '24h', '7d'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                timeRange === range ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="PM2.5" value={averages.pm25.toFixed(1)} icon={<Wind className="w-4 h-4 text-cyan-400"/>} color="text-cyan-400" />
        <MetricCard title="CO₂" value={averages.co2.toFixed(0)} icon={<Activity className="w-4 h-4 text-amber-400"/>} color="text-amber-400" />
        <MetricCard title="Temp" value={`${averages.temp.toFixed(1)}°C`} icon={<Thermometer className="w-4 h-4 text-blue-400"/>} color="text-blue-400" />
        <MetricCard title="Humidity" value={`${averages.humidity.toFixed(0)}%`} icon={<Droplets className="w-4 h-4 text-green-400"/>} color="text-green-400" />
      </div>

      {/* Stacked Charts */}
      <div className="flex flex-col gap-6">
        
        {/* Chart 1: Particulate Matter (Line Chart) */}
        <Card className="bg-slate-900 border-slate-700 w-full">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CloudFog className="w-5 h-5 text-cyan-400" /> Air Quality (PM)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{backgroundColor:'#0f172a', border:'none', color: '#fff', borderRadius: '8px'}} />
                <Legend />
                <Line name="PM2.5" type="monotone" dataKey="pm25" stroke="#06b6d4" strokeWidth={2} isAnimationActive={false} dot={false} />
                <Line name="PM10" type="monotone" dataKey="pm10" stroke="#8b5cf6" strokeWidth={2} isAnimationActive={false} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 2: CO2 Levels (Bar Chart) */}
        <Card className="bg-slate-900 border-slate-700 w-full">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" /> CO₂ Levels
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} domain={['dataMin - 50', 'dataMax + 50']} />
                <Tooltip 
                  contentStyle={{backgroundColor:'#0f172a', border:'none', color: '#fff', borderRadius: '8px'}} 
                  cursor={{fill: '#1e293b'}}
                />
                <Bar name="CO₂ (ppm)" dataKey="co2" fill="#fbbf24" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 3: Temperature & Humidity (Full Width Dual Axis) */}
        <Card className="bg-slate-900 border-slate-700 w-full">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" /> Temperature & Humidity
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={12} />
                
                {/* Left Y-Axis for Temperature */}
                <YAxis yAxisId="left" stroke="#60a5fa" fontSize={12} domain={['auto', 'auto']} />
                {/* Right Y-Axis for Humidity */}
                <YAxis yAxisId="right" orientation="right" stroke="#4ade80" fontSize={12} domain={['auto', 'auto']} />
                
                <Tooltip contentStyle={{backgroundColor:'#0f172a', border:'none', color: '#fff', borderRadius: '8px'}} />
                <Legend />
                <Line yAxisId="left" name="Temperature (°C)" type="monotone" dataKey="temperature" stroke="#60a5fa" strokeWidth={2} isAnimationActive={false} dot={false} />
                <Line yAxisId="right" name="Humidity (%)" type="monotone" dataKey="humidity" stroke="#4ade80" strokeWidth={2} isAnimationActive={false} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

function MetricCard({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) {
  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-slate-300">
          {icon} {title}
        </div>
        <div className={`text-2xl font-bold mt-2 ${color}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  )
}
