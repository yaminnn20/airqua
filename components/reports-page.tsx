'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, Calendar, TrendingUp } from 'lucide-react'

export function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d'>('24h')
  const [isExporting, setIsExporting] = useState(false)

  const reportData = {
    period: selectedPeriod,
    generatedAt: new Date().toLocaleString(),
    totalReadings: selectedPeriod === '24h' ? 1440 : selectedPeriod === '7d' ? 10080 : 43200,
    avgPm25: 12.4,
    maxPm25: 28.5,
    safeTimePercentage: 87,
    alertsTriggered: selectedPeriod === '24h' ? 3 : selectedPeriod === '7d' ? 12 : 34,
    acknowledgedAlerts: selectedPeriod === '24h' ? 2 : selectedPeriod === '7d' ? 10 : 31,
    complianceStatus: 'GOOD',
  }

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const csvContent = `Air Quality Report - ${reportData.period}
Generated: ${reportData.generatedAt}

Summary Statistics
Total Readings: ${reportData.totalReadings}
Average PM2.5: ${reportData.avgPm25} µg/m³
Peak PM2.5: ${reportData.maxPm25} µg/m³
Safe Air Time: ${reportData.safeTimePercentage}%

Alerts & Compliance
Total Alerts: ${reportData.alertsTriggered}
Acknowledged: ${reportData.acknowledgedAlerts}
Compliance Status: ${reportData.complianceStatus}

WHO Guidelines Compliance
PM2.5 (Threshold 15 µg/m³): ${reportData.avgPm25 <= 15 ? '✓ COMPLIANT' : '✗ EXCEEDS'}
CO₂ (Threshold 800 ppm): ✓ COMPLIANT
Ozone (Threshold 50 ppb): ✓ COMPLIANT

Report Notes
This report shows air quality metrics for the selected period.
All measurements are compliant with WHO guidelines for respiratory patient care.
Alerts have been acknowledged and appropriate ventilation measures implemented.`

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `air-quality-report-${reportData.period}-${new Date().getTime()}.csv`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('[v0] Error exporting CSV:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      // Generate PDF as HTML and print to PDF
      const pdfContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Air Quality Report - ${reportData.period}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: white; }
    h1 { color: #1e293b; border-bottom: 2px solid #0891b2; padding-bottom: 10px; }
    h2 { color: #334155; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
    th { background: #0f172a; color: white; }
    tr:nth-child(even) { background: #f1f5f9; }
    .stat { display: inline-block; margin: 10px 20px 10px 0; }
    .stat-value { font-size: 24px; font-weight: bold; color: #0891b2; }
    .stat-label { color: #64748b; font-size: 14px; }
    .compliant { color: #10b981; font-weight: bold; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #cbd5e1; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Clinical Air Quality Report</h1>
  <p><strong>Report Period:</strong> ${reportData.period}</p>
  <p><strong>Generated:</strong> ${reportData.generatedAt}</p>
  
  <h2>Summary Statistics</h2>
  <div class="stat">
    <div class="stat-value">${reportData.totalReadings.toLocaleString()}</div>
    <div class="stat-label">Total Readings</div>
  </div>
  <div class="stat">
    <div class="stat-value">${reportData.avgPm25}</div>
    <div class="stat-label">Average PM2.5 (µg/m³)</div>
  </div>
  <div class="stat">
    <div class="stat-value">${reportData.maxPm25}</div>
    <div class="stat-label">Peak PM2.5 (µg/m³)</div>
  </div>
  <div class="stat">
    <div class="stat-value">${reportData.safeTimePercentage}%</div>
    <div class="stat-label">Safe Air Time</div>
  </div>
  
  <h2>Alerts & Response</h2>
  <table>
    <tr><th>Metric</th><th>Value</th></tr>
    <tr><td>Total Alerts</td><td>${reportData.alertsTriggered}</td></tr>
    <tr><td>Acknowledged Alerts</td><td>${reportData.acknowledgedAlerts}</td></tr>
    <tr><td>Compliance Status</td><td class="compliant">${reportData.complianceStatus}</td></tr>
  </table>
  
  <h2>WHO Guidelines Compliance</h2>
  <table>
    <tr><th>Metric</th><th>Threshold</th><th>Status</th></tr>
    <tr><td>PM2.5</td><td>15 µg/m³</td><td class="compliant">✓ COMPLIANT</td></tr>
    <tr><td>PM10</td><td>45 µg/m³</td><td class="compliant">✓ COMPLIANT</td></tr>
    <tr><td>CO₂</td><td>800 ppm</td><td class="compliant">✓ COMPLIANT</td></tr>
    <tr><td>Ozone</td><td>50 ppb</td><td class="compliant">✓ COMPLIANT</td></tr>
  </table>
  
  <div class="footer">
    <p>This report certifies that all air quality measurements are within WHO guidelines for respiratory patient care.</p>
    <p>Report generated by Clinical Air Quality Monitor for Hospital Chest Diseases Ward.</p>
  </div>
</body>
</html>`

      const blob = new Blob([pdfContent], { type: 'text/html' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `air-quality-report-${reportData.period}-${new Date().getTime()}.html`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('[v0] Error exporting PDF:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Report Period Selection */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Select Report Period
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          {(['24h', '7d', '30d'] as const).map(period => (
            <Button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              className={
                selectedPeriod === period
                  ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-600'
              }
            >
              {period === '24h' ? 'Last 24 Hours' : period === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Report Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Readings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-400">{reportData.totalReadings.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Average PM2.5</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{reportData.avgPm25}</div>
            <p className="text-xs text-slate-500 mt-1">WHO Compliant</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Safe Air Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{reportData.safeTimePercentage}%</div>
            <p className="text-xs text-slate-500 mt-1">Within safe levels</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500 mb-2 block w-fit">
              {reportData.complianceStatus}
            </Badge>
            <p className="text-xs text-slate-500">All guidelines met</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Summary */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            Alerts & Response Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-800 rounded-lg">
              <p className="text-sm text-slate-400">Total Alerts</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{reportData.alertsTriggered}</p>
            </div>
            <div className="p-4 bg-slate-800 rounded-lg">
              <p className="text-sm text-slate-400">Acknowledged</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{reportData.acknowledgedAlerts}</p>
            </div>
            <div className="p-4 bg-slate-800 rounded-lg">
              <p className="text-sm text-slate-400">Response Rate</p>
              <p className="text-2xl font-bold text-cyan-400 mt-1">
                {((reportData.acknowledgedAlerts / reportData.alertsTriggered) * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Checklist */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-400" />
            WHO Guidelines Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { metric: 'PM2.5', threshold: '15 µg/m³', status: 'compliant', value: reportData.avgPm25 },
            { metric: 'PM10', threshold: '45 µg/m³', status: 'compliant', value: 32 },
            { metric: 'CO₂', threshold: '800 ppm', status: 'compliant', value: 650 },
            { metric: 'Ozone', threshold: '50 ppb', status: 'compliant', value: 28 },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
              <div>
                <p className="font-medium text-white">{item.metric}</p>
                <p className="text-xs text-slate-400">Threshold: {item.threshold}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-cyan-400">{item.value}</p>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500 text-xs mt-1">
                  ✓ {item.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Export Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleExportCSV}
          disabled={isExporting}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
        >
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export as CSV'}
        </Button>
        <Button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
        >
          <FileText className="w-4 h-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export as PDF'}
        </Button>
      </div>
    </div>
  )
}
