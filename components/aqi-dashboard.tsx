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

interface BioaerosolIndex {
  score: number
  label: string
  color: string
  textColor: string
  factors: {
    name: string
    contribution: number
    max: number
    reason: string
  }[]
}

export function AQIDashboard() {
  const [metrics, setMetrics] = useState<MetricsState>({
    aqi: null, pm1: null, pm25: null, pm10: null,
    co2: null, ozone: null, tvoc: null,
    temperature: null, humidity: null, pressure: null,
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
          setConnectionStatus('connected')
          setConnectionError('')
          client!.subscribe('homeassistant/sensor/esp32_air/state', (err) => {
            if (err) console.error('Subscribe failed', err)
          })
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
          } catch (err) {
            console.error('Invalid JSON:', err)
          }
        })

        client.on('error', (error: any) => {
          setConnectionError(error?.message || 'Unknown error')
          setConnectionStatus('disconnected')
        })

        client.on('disconnect', () => setConnectionStatus('disconnected'))
        client.on('offline', () => {
          setConnectionStatus('disconnected')
          setConnectionError('Broker offline')
        })
      } catch (error: any) {
        setConnectionError(error?.message || 'Unknown error')
        setConnectionStatus('disconnected')
      }
    }

    connect()
    return () => { if (client) client.end() }
  }, [config])

  const handleSaveConfig = () => {
    setConfig(tempConfig)
    setIsConfigDropdownOpen(false)
  }

  // ── Respiratory Risk Factor (original) ──────────────────────────────────────
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
    if (riskScore === 0) return { score: 0, label: 'Safe', color: 'emerald' }
    if (riskScore <= 30) return { score: riskScore, label: 'Good', color: 'cyan' }
    if (riskScore <= 60) return { score: riskScore, label: 'Moderate', color: 'amber' }
    return { score: riskScore, label: 'High Risk', color: 'red' }
  }

  // ── Bioaerosol Risk Index ────────────────────────────────────────────────────
  // Proxy index based on environmental drivers of microbial load.
  // Direct microbial count is not measured — this estimates conditions that
  // favour bioaerosol survival, accumulation, and carrier-particle transport.
  //
  // Scoring (0–100):
  //   PM2.5  — carrier particles for microbes               max 30 pts
  //   CO2    — ventilation proxy; accumulation risk         max 30 pts
  //   Humidity — fungal/bacterial survival threshold        max 25 pts
  //   TVOC   — MVOCs as proxy for microbial metabolism      max 15 pts
  //
  // Validate against settle-plate colony counts during pilot for calibration.

  const calculateBioaerosolIndex = (): BioaerosolIndex => {
    const factors: BioaerosolIndex['factors'] = []
    let total = 0

    // PM2.5 — carrier particles
    let pm25Score = 0
    if (metrics.pm25 !== null) {
      if (metrics.pm25 > 35) pm25Score = 30
      else if (metrics.pm25 > 25) pm25Score = 22
      else if (metrics.pm25 > 10) pm25Score = 12
      else pm25Score = 0
    }
    factors.push({
      name: 'PM2.5',
      contribution: pm25Score,
      max: 30,
      reason: 'Microbes travel on fine particles',
    })
    total += pm25Score

    // CO2 — ventilation / bioaerosol accumulation
    let co2Score = 0
    if (metrics.co2 !== null) {
      if (metrics.co2 > 1200) co2Score = 30
      else if (metrics.co2 > 800) co2Score = 22
      else if (metrics.co2 > 600) co2Score = 12
      else co2Score = 0
    }
    factors.push({
      name: 'CO₂',
      contribution: co2Score,
      max: 30,
      reason: 'Poor ventilation → bioaerosol accumulation',
    })
    total += co2Score

    // Humidity — fungal spore proliferation + bacterial survival
    let humScore = 0
    if (metrics.humidity !== null) {
      if (metrics.humidity > 80) humScore = 25
      else if (metrics.humidity > 70) humScore = 18
      else if (metrics.humidity > 60) humScore = 10
      else humScore = 0
    }
    factors.push({
      name: 'Humidity',
      contribution: humScore,
      max: 25,
      reason: 'Above 60% favours fungal growth & pathogen survival',
    })
    total += humScore

    // TVOC — Microbial Volatile Organic Compounds (MVOCs)
    // Mold and bacteria emit VOCs as metabolic byproducts
    let tvocScore = 0
    if (metrics.tvoc !== null) {
      if (metrics.tvoc > 500) tvocScore = 15
      else if (metrics.tvoc > 250) tvocScore = 11
      else if (metrics.tvoc > 100) tvocScore = 6
      else tvocScore = 0
    }
    factors.push({
      name: 'TVOC',
      contribution: tvocScore,
      max: 15,
      reason: 'MVOCs indicate active microbial metabolism',
    })
    total += tvocScore

    // Label and color
    let label: string
    let color: string
    let textColor: string
    if (total <= 20) {
      label = 'Low'
      color = 'border-emerald-500 bg-emerald-500/10'
      textColor = 'text-emerald-400'
    } else if (total <= 45) {
      label = 'Moderate'
      color = 'border-amber-500 bg-amber-500/10'
      textColor = 'text-amber-400'
    } else if (total <= 70) {
      label = 'High'
      color = 'border-orange-500 bg-orange-500/10'
      textColor = 'text-orange-400'
    } else {
      label = 'Critical'
      color = 'border-red-500 bg-red-500/10 animate-pulse'
      textColor = 'text-red-400'
    }

    return { score: total, label, color, textColor, factors }
  }

  const getMetricStatus = (metric: string, value: number | null) => {
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

  const risk = calculateRiskFactor()
  const bioaerosol = calculateBioaerosolIndex()

  const riskCircleColor =
    risk.color === 'emerald' ? '#10b981' :
    risk.color === 'cyan'    ? '#06b6d4' :
    risk.color === 'amber'   ? '#f59e0b' : '#ef4444'

  const pm1Status   = getMetricStatus('pm1',   metrics.pm1)
  const pm25Status  = getMetricStatus('pm25',  metrics.pm25)
  const co2Status   = getMetricStatus('co2',   metrics.co2)
  const ozoneStatus = getMetricStatus('ozone', metrics.ozone)

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8 -mt-8">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
            Medical Air Quality Monitor
          </h1>
          <p className="text-slate-400 text-sm mt-1">Chest Diseases Hospital — ICU / Ward</p>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsConfigDropdownOpen(!isConfigDropdownOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              connectionStatus === 'connected'
                ? 'bg-emerald-500/20 border border-emerald-500 hover:bg-emerald-500/30'
                : connectionStatus === 'connecting'
                  ? 'bg-amber-500/20 border border-amber-500 hover:bg-amber-500/30'
                  : 'bg-red-500/20 border border-red-500 hover:bg-red-500/30'
            }`}
          >
            {connectionStatus === 'connected' ? (
              <><Wifi className="w-4 h-4 text-emerald-500" /><span className="text-sm font-medium text-emerald-300">Connected</span></>
            ) : connectionStatus === 'connecting' ? (
              <><Wifi className="w-4 h-4 text-amber-500 animate-pulse" /><span className="text-sm font-medium text-amber-300">Connecting...</span></>
            ) : (
              <><WifiOff className="w-4 h-4 text-red-500" /><span className="text-sm font-medium text-red-300">Disconnected</span></>
            )}
            <Settings className="w-4 h-4 ml-2 opacity-60" />
          </button>

          {isConfigDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-lg z-50">
              <div className="p-4 space-y-3">
                <div className="pb-3 border-b border-slate-700">
                  <h3 className="text-sm font-semibold text-white">Configuration</h3>
                  {connectionError && <p className="text-xs text-red-400 mt-2">Error: {connectionError}</p>}
                </div>
                <div>
                  <Label htmlFor="username" className="text-slate-300 text-xs">Username</Label>
                  <Input id="username" type="text" placeholder="Optional"
                    value={tempConfig.username}
                    onChange={(e) => setTempConfig({ ...tempConfig, username: e.target.value })}
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 mt-1 text-xs h-8"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-slate-300 text-xs">Password</Label>
                  <Input id="password" type="password" placeholder="Optional"
                    value={tempConfig.password}
                    onChange={(e) => setTempConfig({ ...tempConfig, password: e.target.value })}
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 mt-1 text-xs h-8"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveConfig} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs py-1 h-8">Save</Button>
                  <Button onClick={() => setIsConfigDropdownOpen(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs py-1 h-8">Close</Button>
                </div>
              </div>
            </div>
          )}

          {isConfigDropdownOpen && (
            <div className="fixed inset-0 z-40" onClick={() => setIsConfigDropdownOpen(false)} />
          )}
        </div>
      </div>

      {/* ── Single Dual-Arc Dial ──────────────────────────────────────────────── */}
      <Card className="bg-slate-900 border border-slate-700 mb-8">
        <CardContent className="p-6 flex flex-col items-center">

          {/* SVG dual-arc gauge */}
          <svg viewBox="0 0 200 115" className="w-full max-w-sm">
            {/* Outer track — Respiratory Risk */}
            <path d="M 15 100 A 85 85 0 0 1 185 100" fill="none" stroke="#1e293b" strokeWidth="13" strokeLinecap="round"/>

            {/* Outer progress — Respiratory Risk */}
            {risk.score >= 100
              ? <path d="M 15 100 A 85 85 0 0 1 185 100" fill="none" stroke={riskCircleColor} strokeWidth="13" strokeLinecap="round"/>
              : risk.score > 0 && (() => {
                  const θ = (180 - risk.score * 1.8) * Math.PI / 180
                  const ex = (100 + 85 * Math.cos(θ)).toFixed(2)
                  const ey = (100 - 85 * Math.sin(θ)).toFixed(2)
                  return <path d={`M 15 100 A 85 85 0 0 1 ${ex} ${ey}`} fill="none" stroke={riskCircleColor} strokeWidth="13" strokeLinecap="round"/>
                })()
            }

            {/* Inner track — Bioaerosol Index */}
            <path d="M 37 100 A 63 63 0 0 1 163 100" fill="none" stroke="#1e293b" strokeWidth="11" strokeLinecap="round"/>

            {/* Inner progress — Bioaerosol Index */}
            {(() => {
              const bColor = bioaerosol.score <= 20 ? '#10b981' : bioaerosol.score <= 45 ? '#f59e0b' : bioaerosol.score <= 70 ? '#f97316' : '#ef4444'
              if (bioaerosol.score <= 0) return null
              if (bioaerosol.score >= 100) return <path d="M 37 100 A 63 63 0 0 1 163 100" fill="none" stroke={bColor} strokeWidth="11" strokeLinecap="round"/>
              const θ = (180 - bioaerosol.score * 1.8) * Math.PI / 180
              const ex = (100 + 63 * Math.cos(θ)).toFixed(2)
              const ey = (100 - 63 * Math.sin(θ)).toFixed(2)
              return <path d={`M 37 100 A 63 63 0 0 1 ${ex} ${ey}`} fill="none" stroke={bColor} strokeWidth="11" strokeLinecap="round"/>
            })()}

            {/* Scale markers */}
            <line x1="15" y1="100" x2="10" y2="105" stroke="#334155" strokeWidth="1"/>
            <line x1="100" y1="15" x2="100" y2="9" stroke="#334155" strokeWidth="1"/>
            <line x1="185" y1="100" x2="190" y2="105" stroke="#334155" strokeWidth="1"/>
            <text x="10" y="112" textAnchor="middle" fontSize="7" fill="#475569" fontFamily="sans-serif">0</text>
            <text x="100" y="7" textAnchor="middle" fontSize="7" fill="#475569" fontFamily="sans-serif">50</text>
            <text x="190" y="112" textAnchor="middle" fontSize="7" fill="#475569" fontFamily="sans-serif">100</text>

            {/* Legend dots */}
            <circle cx="60" cy="108" r="4" fill={riskCircleColor}/>
            <text x="67" y="111" fontSize="7" fill="#94a3b8" fontFamily="sans-serif">Respiratory</text>
            <circle cx="120" cy="108" r="3" fill={bioaerosol.score <= 20 ? '#10b981' : bioaerosol.score <= 45 ? '#f59e0b' : bioaerosol.score <= 70 ? '#f97316' : '#ef4444'}/>
            <text x="126" y="111" fontSize="7" fill="#94a3b8" fontFamily="sans-serif">Bioaerosol</text>
          </svg>

          {/* Score labels */}
          <div className="grid grid-cols-2 w-full max-w-sm gap-6 mt-2">
            <div className="text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Respiratory Risk</p>
              <p className="text-3xl font-bold text-white mt-1">{risk.score}</p>
              <p className={`text-sm font-semibold mt-0.5 ${
                risk.color === 'emerald' ? 'text-emerald-400' :
                risk.color === 'cyan'    ? 'text-cyan-400' :
                risk.color === 'amber'   ? 'text-amber-400' : 'text-red-400'
              }`}>{risk.label}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Bioaerosol Index</p>
              <p className="text-3xl font-bold text-white mt-1">{bioaerosol.score}</p>
              <p className={`text-sm font-semibold mt-0.5 ${bioaerosol.textColor}`}>{bioaerosol.label}</p>
            </div>
          </div>

          {metrics.lastUpdate && (
            <p className="text-[10px] text-slate-600 mt-4">
              Updated: {metrics.lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Metrics Grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <Card className={`bg-slate-900 border-slate-700 transition-all ${pm1Status.alert ? 'border-red-500 shadow-lg shadow-red-500/20 animate-pulse' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
              {pm1Status.icon && <span className={pm1Status.color}>{pm1Status.icon}</span>}
              PM1 <span className="text-[10px] sm:text-xs bg-slate-800 px-1 sm:px-2 py-1 rounded text-slate-400">µg/m³</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-3xl font-bold ${pm1Status.color}`}>{metrics.pm1 ?? '—'}</div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
              {metrics.pm1 !== null ? (metrics.pm1 > 21 ? '⚠️ Ultra-fine' : metrics.pm1 > 18 ? 'Caution' : 'Safe') : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-slate-900 border-slate-700 transition-all ${pm25Status.alert ? 'border-red-500 shadow-lg shadow-red-500/20 animate-pulse' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
              {pm25Status.icon && <span className={pm25Status.color}>{pm25Status.icon}</span>}
              PM2.5 <span className="text-[10px] sm:text-xs bg-slate-800 px-1 sm:px-2 py-1 rounded text-slate-400">µg/m³</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-3xl font-bold ${pm25Status.color}`}>{metrics.pm25 ?? '—'}</div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
              {metrics.pm25 !== null ? (metrics.pm25 > 35 ? '⚠️ Exceeds' : metrics.pm25 > 30 ? 'Caution' : 'Safe') : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-slate-900 border-slate-700 transition-all ${co2Status.alert ? 'border-red-500 shadow-lg shadow-red-500/20 animate-pulse' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
              {co2Status.icon && <span className={co2Status.color}>{co2Status.icon}</span>}
              CO₂ <span className="text-[10px] sm:text-xs bg-slate-800 px-1 sm:px-2 py-1 rounded text-slate-400">ppm</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-3xl font-bold ${co2Status.color}`}>{metrics.co2 ?? '—'}</div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
              {metrics.co2 !== null ? (metrics.co2 > 800 ? '⚠️ Poor vent.' : metrics.co2 > 600 ? 'Elevated' : 'Good') : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-slate-900 border-slate-700 transition-all ${ozoneStatus.alert ? 'border-amber-500 shadow-lg shadow-amber-500/20' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
              {ozoneStatus.icon && <span className={ozoneStatus.color}>{ozoneStatus.icon}</span>}
              Ozone <span className="text-[10px] sm:text-xs bg-slate-800 px-1 sm:px-2 py-1 rounded text-slate-400">ppb</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-3xl font-bold ${ozoneStatus.color}`}>{metrics.ozone ?? '—'}</div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
              {metrics.ozone !== null ? (metrics.ozone > 50 ? '⚠️ Elevated' : 'Normal') : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
              PM10 <span className="text-[10px] sm:text-xs bg-slate-800 px-1 sm:px-2 py-1 rounded text-slate-400">µg/m³</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-bold text-slate-300">{metrics.pm10 ?? '—'}</div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Coarse particles</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
              TVOC <span className="text-[10px] sm:text-xs bg-slate-800 px-1 sm:px-2 py-1 rounded text-slate-400">ppb</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-bold text-slate-300">{metrics.tvoc ?? '—'}</div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
              {metrics.tvoc !== null ? (metrics.tvoc > 250 ? '⚠️ MVOC signal' : 'Volatile organics') : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
              Temp <span className="text-[10px] sm:text-xs bg-slate-800 px-1 sm:px-2 py-1 rounded text-slate-400">°C</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-bold text-slate-300">
              {metrics.temperature !== null ? metrics.temperature.toFixed(1) : '—'}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
              {metrics.temperature !== null ? (metrics.temperature > 30 ? '⚠️ Heat stress' : 'Environmental') : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
              Humidity <span className="text-[10px] sm:text-xs bg-slate-800 px-1 sm:px-2 py-1 rounded text-slate-400">%</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-3xl font-bold ${
              metrics.humidity !== null && metrics.humidity > 70 ? 'text-amber-400' :
              metrics.humidity !== null && metrics.humidity > 60 ? 'text-yellow-400' : 'text-slate-300'
            }`}>
              {metrics.humidity !== null ? metrics.humidity.toFixed(1) : '—'}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
              {metrics.humidity !== null ? (metrics.humidity > 70 ? '⚠️ Fungal risk' : metrics.humidity > 60 ? 'Elevated' : 'Normal') : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-300">
              Pressure <span className="text-[10px] sm:text-xs bg-slate-800 px-1 sm:px-2 py-1 rounded text-slate-400 ml-2">hPa</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-bold text-slate-300">
              {metrics.pressure !== null ? metrics.pressure.toFixed(1) : '—'}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Atmospheric</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
              AQI <span className="text-[10px] sm:text-xs bg-slate-800 px-1 sm:px-2 py-1 rounded text-slate-400">Index</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-bold text-slate-300">{metrics.aqi ?? '—'}</div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Air quality index</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Clinical Guidelines Footer ─────────────────────────────────────── */}
      <Card className="mt-6 bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-300">Clinical Thresholds</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="font-medium text-red-400 mb-1">PM2.5 &gt; 15 µg/m³</p>
            <p className="text-slate-400 text-xs">Exceeds WHO guidelines for vulnerable patients. Increase ventilation.</p>
          </div>
          <div>
            <p className="font-medium text-red-400 mb-1">CO₂ &gt; 800 ppm</p>
            <p className="text-slate-400 text-xs">Poor ventilation. Bioaerosol accumulation risk. Open windows or exhaust.</p>
          </div>
          <div>
            <p className="font-medium text-amber-400 mb-1">Humidity &gt; 70%</p>
            <p className="text-slate-400 text-xs">Fungal spore proliferation risk. Also reduces UVGI effectiveness.</p>
          </div>
          <div>
            <p className="font-medium text-amber-400 mb-1">Bioaerosol Index &gt; 45</p>
            <p className="text-slate-400 text-xs">Estimated proxy only — validate against settle plate data during pilot.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}