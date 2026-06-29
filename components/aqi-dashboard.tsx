'use client'

import { useEffect, useState } from 'react'
import mqtt from 'mqtt'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2, Wifi, WifiOff, Settings } from 'lucide-react'

interface MetricsState {
  aqi: number | null
  pm1: number | null
  pm25: number | null
  pm10: number | null
  co2: number | null
  ozone: number | null
  tvoc: number | null
  temperature: number | null
  humidity: number | null
  pressure: number | null
  lastUpdate: Date | null
}

export function AQIDashboard() {
  const [metrics, setMetrics] = useState<MetricsState>({
    aqi: null,
    pm1: null,
    pm25: null,
    pm10: null,
    co2: null,
    ozone: null,
    tvoc: null,
    temperature: null,
    humidity: null,
    pressure: null,
    lastUpdate: null,
  })

  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('connecting')
  const [connectionError, setConnectionError] = useState<string>('')
  const [config, setConfig] = useState({
    url: 'wss://n262659d.ala.asia-southeast1.emqxsl.com:8084/mqtt',
    username: 'yamm19',
    password: 'Yamin9697',
  })
  const [isConfigDropdownOpen, setIsConfigDropdownOpen] = useState(false)
  const [tempConfig, setTempConfig] = useState(config)

  useEffect(() => {
    let client: mqtt.MqttClient | null = null

    const connect = () => {
      try {
        console.log('[v0] Attempting to connect to:', config.url)
        setConnectionStatus('connecting')
        setConnectionError('')

        client = mqtt.connect(config.url, {
          username: config.username || undefined,
          password: config.password || undefined,
          clientId: 'web_dashboard_' + Math.random().toString(16).substring(2, 8),
          protocol: 'wss',
          path: '/mqtt',
          clean: true,
          connectTimeout: 10000,
          reconnectPeriod: 2000,
        })

        client.on('connect', () => {
          console.log('MQTT Connected')
          setConnectionStatus('connected')
          setConnectionError('')

          client!.subscribe(
            'homeassistant/sensor/esp32_air/state',
            (err) => {
              if (err) {
                console.error('Subscribe failed', err)
              } else {
                console.log('Subscribed successfully')
              }
            }
          )
        })

        client.on('message', (_topic, message) => {
          try {
            const data = JSON.parse(message.toString())
            setMetrics({
              temperature: data.temperature ?? null,
              humidity: data.humidity ?? null,
              pressure: data.pressure ?? null,
              pm1: data.pm1 ?? null,
              pm25: data.pm25 ?? null,
              pm10: data.pm10 ?? null,
              aqi: data.aqi ?? null,
              co2: data.co2 ?? null,
              ozone: data.ozone ?? null,
              tvoc: data.tvoc ?? null,
              lastUpdate: new Date(),
            })
            console.log('Received:', data)
          } catch (err) {
            console.error('Invalid JSON:', err)
          }
        })

        client.on('error', (error: any) => {
          const errorMsg = error?.message || error?.toString() || 'Unknown error'
          console.error('[v0] MQTT Error:', errorMsg)
          setConnectionError(errorMsg)
          setConnectionStatus('disconnected')
        })

        client.on('disconnect', () => {
          console.log('[v0] MQTT Disconnected')
          setConnectionStatus('disconnected')
        })

        client.on('offline', () => {
          console.log('[v0] MQTT Offline')
          setConnectionStatus('disconnected')
          setConnectionError('Broker offline')
        })
      } catch (error: any) {
        const errorMsg = error?.message || error?.toString() || 'Unknown error'
        console.error('[v0] Connection failed:', errorMsg)
        setConnectionError(errorMsg)
        setConnectionStatus('disconnected')
      }
    }

    connect()

    return () => {
      if (client) {
        client.end()
      }
    }
  }, [config])

  const handleSaveConfig = () => {
    setConfig(tempConfig)
    setIsConfigDropdownOpen(false)
  }

  const calculateRiskFactor = (): { score: number; label: string; color: string } => {
    let riskScore = 0
    if (metrics.pm25 !== null) {
      if (metrics.pm25 > 35) riskScore += 40
      else if (metrics.pm25 > 10) riskScore += 25
      else if (metrics.pm25 > 5) riskScore += 10
    }
    if (metrics.co2 !== null) {
      if (metrics.co2 > 800) riskScore += 40
      else if (metrics.co2 > 600) riskScore += 25
      else if (metrics.co2 > 400) riskScore += 10
    }
    if (metrics.ozone !== null) {
      if (metrics.ozone > 50) riskScore += 20
      else if (metrics.ozone > 30) riskScore += 10
    }

    if (riskScore === 0) {
      return { score: 0, label: 'Safe Air', color: 'border-emerald-500 bg-emerald-500/10' }
    } else if (riskScore <= 30) {
      return { score: riskScore, label: 'Good', color: 'border-cyan-500 bg-cyan-500/10' }
    } else if (riskScore <= 60) {
      return { score: riskScore, label: 'Moderate', color: 'border-amber-500 bg-amber-500/10' }
    } else {
      return { score: riskScore, label: 'High Risk', color: 'border-red-500 bg-red-500/10 animate-pulse' }
    }
  }

  const risk = calculateRiskFactor()

  const getMetricStatus = (metric: string, value: number | null): { color: string; icon: React.ReactNode; alert: boolean } => {
    if (value === null) return { color: 'text-slate-400', icon: null, alert: false }

    if (metric === 'pm1') {
      if (value > 25) return { color: 'text-red-500', icon: <AlertCircle className="w-5 h-5" />, alert: true }
      if (value > 20) return { color: 'text-amber-500', icon: <AlertCircle className="w-5 h-5" />, alert: false }
      return { color: 'text-emerald-500', icon: <CheckCircle2 className="w-5 h-5" />, alert: false }
    }

    if (metric === 'pm25') {
      if (value > 35) return { color: 'text-red-500', icon: <AlertCircle className="w-5 h-5" />, alert: true }
      if (value > 30) return { color: 'text-amber-500', icon: <AlertCircle className="w-5 h-5" />, alert: false }
      return { color: 'text-emerald-500', icon: <CheckCircle2 className="w-5 h-5" />, alert: false }
    }

    if (metric === 'co2') {
      if (value > 800) return { color: 'text-red-500', icon: <AlertCircle className="w-5 h-5" />, alert: true }
      if (value > 600) return { color: 'text-amber-500', icon: <AlertCircle className="w-5 h-5" />, alert: false }
      return { color: 'text-emerald-500', icon: <CheckCircle2 className="w-5 h-5" />, alert: false }
    }

    if (metric === 'ozone') {
      if (value > 60) return { color: 'text-amber-500', icon: <AlertCircle className="w-5 h-5" />, alert: false }
      return { color: 'text-emerald-500', icon: <CheckCircle2 className="w-5 h-5" />, alert: false }
    }

    return { color: 'text-slate-300', icon: null, alert: false }
  }

  const pm1Status = getMetricStatus('pm1', metrics.pm1)
  const pm25Status = getMetricStatus('pm25', metrics.pm25)
  const co2Status = getMetricStatus('co2', metrics.co2)
  const ozoneStatus = getMetricStatus('ozone', metrics.ozone)

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 -mt-8">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">Medical Air Quality Monitor</h1>
          <p className="text-slate-400 text-sm mt-1">Chest Diseases Hospital Ward</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setIsConfigDropdownOpen(!isConfigDropdownOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${connectionStatus === 'connected'
                ? 'bg-emerald-500/20 border border-emerald-500 hover:bg-emerald-500/30'
                : connectionStatus === 'connecting'
                  ? 'bg-amber-500/20 border border-amber-500 hover:bg-amber-500/30'
                  : 'bg-red-500/20 border border-red-500 hover:bg-red-500/30'
              }`}
          >
            {connectionStatus === 'connected' ? (
              <>
                <Wifi className={`w-4 h-4 text-emerald-500`} />
                <span className="text-sm font-medium text-emerald-300">Connected</span>
              </>
            ) : connectionStatus === 'connecting' ? (
              <>
                <Wifi className={`w-4 h-4 text-amber-500 animate-pulse`} />
                <span className="text-sm font-medium text-amber-300">Connecting...</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-300">Disconnected</span>
              </>
            )}
            <Settings className="w-4 h-4 ml-2 opacity-60" />
          </button>

          {/* Configuration Dropdown */}
          {isConfigDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-lg z-50">
              <div className="p-4 space-y-3">
                <div className="pb-3 border-b border-slate-700">
                  <h3 className="text-sm font-semibold text-white">Configuration</h3>
                  {connectionError && (
                    <p className="text-xs text-red-400 mt-2">
                      Error: {connectionError}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="username" className="text-slate-300 text-xs">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Optional"
                    value={tempConfig.username}
                    onChange={(e) => setTempConfig({ ...tempConfig, username: e.target.value })}
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 mt-1 text-xs h-8"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-slate-300 text-xs">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Optional"
                    value={tempConfig.password}
                    onChange={(e) => setTempConfig({ ...tempConfig, password: e.target.value })}
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 mt-1 text-xs h-8"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleSaveConfig}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs py-1 h-8"
                  >
                    Save
                  </Button>
                  <Button
                    onClick={() => setIsConfigDropdownOpen(false)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs py-1 h-8"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Click outside to close dropdown */}
          {isConfigDropdownOpen && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsConfigDropdownOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Risk Factor Circle */}
      <div className="mb-8">
        <Card className={`bg-slate-900 border-2 ${risk.color} transition-all duration-300`}>
          <CardContent className="p-8 flex flex-col items-center justify-center">
            <div className="relative w-40 h-40 rounded-full border-8 border-current flex items-center justify-center mb-4" style={{ borderColor: risk.color.includes('emerald') ? '#10b981' : risk.color.includes('cyan') ? '#06b6d4' : risk.color.includes('amber') ? '#f59e0b' : '#ef4444' }}>
              <div className="text-center">
                <div className="text-5xl font-bold text-white">{risk.score}</div>
                <div className="text-sm text-slate-300 mt-1">Risk Score</div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">Respiratory Patient Risk Factor</h3>
            <p className={`text-lg font-semibold ${risk.color.includes('emerald') ? 'text-emerald-400' : risk.color.includes('cyan') ? 'text-cyan-400' : risk.color.includes('amber') ? 'text-amber-400' : 'text-red-400'}`}>
              {risk.label}
            </p>
            {metrics.lastUpdate && (
              <p className="text-xs text-slate-400 mt-3">Last updated: {metrics.lastUpdate.toLocaleTimeString()}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Metrics Grid - CHANGED TO 2 COLUMNS ON MOBILE */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PM1 */}
        <Card className={`bg-slate-900 border-slate-700 transition-all ${pm1Status.alert ? 'border-red-500 shadow-lg shadow-red-500/20 animate-pulse' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
              {pm1Status.icon && <span className={pm1Status.color}>{pm1Status.icon}</span>}
              PM1
              <span className="text-[10px] sm:text-xs bg-slate-800 px-1 sm:px-2 py-1 rounded text-slate-400">µg/m³</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-3xl font-bold ${pm1Status.color}`}>{metrics.pm1 ?? '—'}</div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
              {metrics.pm1 !== null ? (metrics.pm1 > 21 ? '⚠️ Ultra-fine' : metrics.pm1 > 18 ? 'Caution' : 'Safe') : 'No data'}
            </p>
          </CardContent>
        </Card>

        {/* PM2.5 */}
        <Card className={`bg-slate-900 border-slate-700 transition-all ${pm25Status.alert ? 'border-red-500 shadow-lg shadow-red-500/20 animate-pulse' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
              {pm25Status.icon && <span className={pm25Status.color}>{pm25Status.icon}</span>}
              PM2.5
              <span className="text-[10px] sm:text-xs bg-slate-800 px-1 sm:px-2 py-1 rounded text-slate-400">µg/m³</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-3xl font-bold ${pm25Status.color}`}>{metrics.pm25 ?? '—'}</div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
              {metrics.pm25 !== null ? (metrics.pm25 > 35 ? '⚠️ EXCEEDS' : metrics.pm25 > 30 ? 'Caution' : 'Safe') : 'No data'}
            </p>
          </CardContent>
        </Card>

        {/* CO2 */}
        <Card className={`bg-slate-900 border-slate-700 transition-all ${co2Status.alert ? 'border-red-500 shadow-lg shadow-red-500/20 animate-pulse' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
              {co2Status.icon && <span className={co2Status.color}>{co2Status.icon}</span>}
              CO₂
              <span className="text-[10px] sm:text-xs bg-slate-800 px-1 sm:px-2 py-1 rounded text-slate-400">ppm</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-3xl font-bold ${co2Status.color}`}>{metrics.co2 ?? '—'}</div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
              {metrics.co2 !== null ? (metrics.co2 > 800 ? '⚠️ POOR VENT' : metrics.co2 > 600 ? 'Elevated' : 'Good') : 'No data'}
            </p>
          </CardContent>
        </Card>

        {/* Ozone */}
        <Card className={`bg-slate-900 border-slate-700 transition-all ${ozoneStatus.alert ? 'border-amber-500 shadow-lg shadow-amber-500/20' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
              {ozoneStatus.icon && <span className={ozoneStatus.color}>{ozoneStatus.icon}</span>}
              Ozone
              <span className="text-[10px] sm:text-xs bg-slate-800 px-1 sm:px-2 py-1 rounded text-slate-400">ppb</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-3xl font-bold ${ozoneStatus.color}`}>{metrics.ozone ?? '—'}</div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
              {metrics.ozone !== null ? (metrics.ozone > 50 ? '⚠️ Elevated' : 'Normal') : 'No data'}
            </p>
          </CardContent>
        </Card>

        {/* PM10 */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
              PM10
              <span className="text-[10px] sm:text-xs bg-slate-800 px-1 sm:px-2 py-1 rounded text-slate-400">µg/m³</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-bold text-slate-300">{metrics.pm10 ?? '—'}</div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Particulate matter</p>
          </CardContent>
        </Card>

        {/* TVOC */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
              TVOC
              <span className="text-[10px] sm:text-xs bg-slate-800 px-1 sm:px-2 py-1 rounded text-slate-400">ppb</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-bold text-slate-300">{metrics.tvoc ?? '—'}</div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Volatile organics</p>
          </CardContent>
        </Card>

        {/* Temperature */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
              Temp
              <span className="text-[10px] sm:text-xs bg-slate-800 px-1 sm:px-2 py-1 rounded text-slate-400">°C</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-bold text-slate-300">{metrics.temperature !== null ? metrics.temperature.toFixed(1) : '—'}</div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Environmental</p>
          </CardContent>
        </Card>

        {/* Humidity */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
              Humidity
              <span className="text-[10px] sm:text-xs bg-slate-800 px-1 sm:px-2 py-1 rounded text-slate-400">%</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-bold text-slate-300">{metrics.humidity !== null ? metrics.humidity.toFixed(1) : '—'}</div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Relative humidity</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-300">
              Pressure
              <span className="text-[10px] sm:text-xs bg-slate-800 px-1 sm:px-2 py-1 rounded text-slate-400 ml-2">
                hPa
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-xl sm:text-3xl font-bold text-slate-300">
              {metrics.pressure !== null
                ? metrics.pressure.toFixed(1)
                : '—'}
            </div>

            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
              Atmospheric pressure
            </p>
          </CardContent>
        </Card>

        {/* AQI Index */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
              AQI
              <span className="text-[10px] sm:text-xs bg-slate-800 px-1 sm:px-2 py-1 rounded text-slate-400">Index</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-bold text-slate-300">{metrics.aqi ?? '—'}</div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Air quality index</p>
          </CardContent>
        </Card>
      </div>

      {/* Clinical Guidelines Footer */}
      <Card className="mt-8 bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-300">Clinical Thresholds & Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-red-400 mb-1">{`PM2.5 > 15 µg/m³`}</p>
            <p className="text-slate-400">Exceeds WHO strict guidelines for vulnerable respiratory patients. Activate air purification & increase ventilation.</p>
          </div>
          <div>
            <p className="font-medium text-red-400 mb-1">{`CO₂ > 800 ppm`}</p>
            <p className="text-slate-400">Poor ventilation detected. Increased viral & bacterial stagnation risk. Review HVAC system performance.</p>
          </div>
          <div>
            <p className="font-medium text-amber-400 mb-1">{`Ozone > 50 ppb`}</p>
            <p className="text-slate-400">Elevated ozone levels may irritate respiratory system. Review outdoor air intake & ozone generation sources.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}