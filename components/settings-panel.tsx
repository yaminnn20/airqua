'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, AlertCircle, Info } from 'lucide-react'

interface ThresholdSettings {
  pm1: number
  pm25: number
  pm10: number
  co2: number
  ozone: number
  tvoc: number
}

export function SettingsPanel() {
  const [thresholds, setThresholds] = useState<ThresholdSettings>({
    pm1: 8,
    pm25: 15,
    pm10: 45,
    co2: 800,
    ozone: 50,
    tvoc: 300,
  })

  const [saved, setSaved] = useState(false)

  const handleThresholdChange = (key: keyof ThresholdSettings, value: string) => {
    setThresholds({
      ...thresholds,
      [key]: parseFloat(value) || 0,
    })
    setSaved(false)
  }

  const handleSave = async () => {
    try {
      // Save thresholds to localStorage
      localStorage.setItem('hospital_thresholds', JSON.stringify(thresholds))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('[v0] Error saving settings:', error)
    }
  }

  const handleReset = () => {
    const defaultThresholds = {
      pm1: 8,
      pm25: 15,
      pm10: 45,
      co2: 800,
      ozone: 50,
      tvoc: 300,
    }
    setThresholds(defaultThresholds)
    localStorage.setItem('hospital_thresholds', JSON.stringify(defaultThresholds))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Card className="bg-blue-950/30 border-blue-800">
        <CardContent className="pt-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-semibold mb-1">WHO Clinical Guidelines</p>
            <p>These thresholds are based on WHO guidelines optimized for respiratory patient safety in hospital environments.</p>
          </div>
        </CardContent>
      </Card>

      {/* Clinical Thresholds */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            Clinical Alert Thresholds
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* PM1 */}
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <Label htmlFor="pm1" className="text-white font-medium">
                  PM1 (Ultra-fine Particulates)
                </Label>
                <p className="text-xs text-slate-400 mt-1">
                  Most dangerous to respiratory system. WHO guideline for sensitive environments.
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-bold text-cyan-400">{thresholds.pm1}</p>
                <p className="text-xs text-slate-500">µg/m³</p>
              </div>
            </div>
            <Input
              id="pm1"
              type="number"
              value={thresholds.pm1}
              onChange={e => handleThresholdChange('pm1', e.target.value)}
              className="bg-slate-800 border-slate-600 text-white"
              step="0.5"
            />
          </div>

          {/* PM2.5 */}
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <Label htmlFor="pm25" className="text-white font-medium">
                  PM2.5 (Fine Particulates)
                </Label>
                <p className="text-xs text-slate-400 mt-1">
                  Penetrates deep into lungs. WHO strict guideline for vulnerable populations.
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-bold text-cyan-400">{thresholds.pm25}</p>
                <p className="text-xs text-slate-500">µg/m³</p>
              </div>
            </div>
            <Input
              id="pm25"
              type="number"
              value={thresholds.pm25}
              onChange={e => handleThresholdChange('pm25', e.target.value)}
              className="bg-slate-800 border-slate-600 text-white"
              step="0.5"
            />
          </div>

          {/* PM10 */}
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <Label htmlFor="pm10" className="text-white font-medium">
                  PM10 (Coarse Particulates)
                </Label>
                <p className="text-xs text-slate-400 mt-1">
                  Affects upper respiratory tract. WHO guideline for indoor air quality.
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-bold text-cyan-400">{thresholds.pm10}</p>
                <p className="text-xs text-slate-500">µg/m³</p>
              </div>
            </div>
            <Input
              id="pm10"
              type="number"
              value={thresholds.pm10}
              onChange={e => handleThresholdChange('pm10', e.target.value)}
              className="bg-slate-800 border-slate-600 text-white"
              step="1"
            />
          </div>

          {/* CO2 */}
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <Label htmlFor="co2" className="text-white font-medium">
                  CO₂ (Carbon Dioxide)
                </Label>
                <p className="text-xs text-slate-400 mt-1">
                  Indicates ventilation quality. High CO₂ increases airborne pathogen concentration.
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-bold text-cyan-400">{thresholds.co2}</p>
                <p className="text-xs text-slate-500">ppm</p>
              </div>
            </div>
            <Input
              id="co2"
              type="number"
              value={thresholds.co2}
              onChange={e => handleThresholdChange('co2', e.target.value)}
              className="bg-slate-800 border-slate-600 text-white"
              step="10"
            />
          </div>

          {/* Ozone */}
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <Label htmlFor="ozone" className="text-white font-medium">
                  Ozone (O₃)
                </Label>
                <p className="text-xs text-slate-400 mt-1">
                  Oxidant pollutant. Can cause respiratory inflammation and reduce lung function.
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-bold text-cyan-400">{thresholds.ozone}</p>
                <p className="text-xs text-slate-500">ppb</p>
              </div>
            </div>
            <Input
              id="ozone"
              type="number"
              value={thresholds.ozone}
              onChange={e => handleThresholdChange('ozone', e.target.value)}
              className="bg-slate-800 border-slate-600 text-white"
              step="1"
            />
          </div>

          {/* TVOC */}
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <Label htmlFor="tvoc" className="text-white font-medium">
                  TVOC (Total Volatile Organic Compounds)
                </Label>
                <p className="text-xs text-slate-400 mt-1">
                  Chemical vapors from cleaning products, equipment. Can trigger respiratory issues.
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-bold text-cyan-400">{thresholds.tvoc}</p>
                <p className="text-xs text-slate-500">µg/m³</p>
              </div>
            </div>
            <Input
              id="tvoc"
              type="number"
              value={thresholds.tvoc}
              onChange={e => handleThresholdChange('tvoc', e.target.value)}
              className="bg-slate-800 border-slate-600 text-white"
              step="10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save and Reset Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
        >
          <Save className="w-4 h-4 mr-2" />
          {saved ? 'Saved Successfully!' : 'Save Thresholds'}
        </Button>
        <Button
          onClick={handleReset}
          variant="outline"
          className="flex-1 bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-600 font-medium"
        >
          Reset to Defaults
        </Button>
      </div>

      {/* WHO Guidelines Reference */}
      <Card className="bg-slate-900 border-slate-700 bg-gradient-to-r from-slate-900 to-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-sm">WHO Air Quality Guidelines Reference</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-slate-400 space-y-1">
          <p>• PM2.5: 15 µg/m³ (24-hour mean) - Strict guideline for vulnerable populations</p>
          <p>• PM10: 45 µg/m³ (24-hour mean) - Standard air quality guideline</p>
          <p>• CO₂: 800 ppm - Safe indoor air quality threshold for hospitals</p>
          <p>• Ozone: 50 ppb - WHO guideline for maximum exposure</p>
          <p>These settings ensure respiratory patient safety in chest disease wards.</p>
        </CardContent>
      </Card>
    </div>
  )
}
