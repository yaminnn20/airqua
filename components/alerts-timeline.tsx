'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react'

interface Alert {
  id: number
  timestamp: string
  alert_type: string
  metric_name: string
  metric_value: number
  threshold: number
  room_id: string
  acknowledged: boolean
  acknowledged_at?: string
  acknowledged_by?: string
  severity: string
}

export function AlertsTimeline() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unacknowledged'>('all')

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        // Mock data for alerts
        const mockAlerts: Alert[] = [
          {
            id: 1,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            alert_type: 'threshold_exceeded',
            metric_name: 'PM2.5',
            metric_value: 18.5,
            threshold: 15,
            room_id: 'Ward-A1',
            acknowledged: false,
            severity: 'critical',
          },
          {
            id: 2,
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            alert_type: 'threshold_exceeded',
            metric_name: 'CO₂',
            metric_value: 850,
            threshold: 800,
            room_id: 'Ward-B2',
            acknowledged: true,
            acknowledged_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            acknowledged_by: 'Dr. Smith',
            severity: 'warning',
          },
          {
            id: 3,
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            alert_type: 'threshold_exceeded',
            metric_name: 'Ozone',
            metric_value: 55,
            threshold: 50,
            room_id: 'Ward-A1',
            acknowledged: true,
            acknowledged_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
            acknowledged_by: 'Nurse Johnson',
            severity: 'warning',
          },
          {
            id: 4,
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            alert_type: 'threshold_exceeded',
            metric_name: 'PM2.5',
            metric_value: 22,
            threshold: 15,
            room_id: 'Ward-C3',
            acknowledged: false,
            severity: 'critical',
          },
        ]

        setAlerts(mockAlerts)
      } catch (error) {
        console.error('[v0] Error fetching alerts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()
  }, [])

  const filteredAlerts = filter === 'unacknowledged' ? alerts.filter(a => !a.acknowledged) : alerts

  const handleAcknowledge = (alertId: number) => {
    setAlerts(alerts.map(a =>
      a.id === alertId
        ? {
            ...a,
            acknowledged: true,
            acknowledged_at: new Date().toISOString(),
            acknowledged_by: 'You',
          }
        : a
    ))
  }

  if (loading) {
    return <div className="text-center text-slate-400 py-8">Loading alerts...</div>
  }

  return (
    <div className="space-y-6">
      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={() => setFilter('all')}
          variant={filter === 'all' ? 'default' : 'outline'}
          className={filter === 'all' ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}
        >
          All Alerts ({alerts.length})
        </Button>
        <Button
          onClick={() => setFilter('unacknowledged')}
          variant={filter === 'unacknowledged' ? 'default' : 'outline'}
          className={filter === 'unacknowledged' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}
        >
          Unacknowledged ({alerts.filter(a => !a.acknowledged).length})
        </Button>
      </div>

      {/* Alerts Timeline */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="py-8 text-center text-slate-400">
              No alerts in this view
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map(alert => (
            <Card
              key={alert.id}
              className={`bg-slate-900 border transition-all ${
                alert.acknowledged ? 'border-slate-700' : alert.severity === 'critical' ? 'border-red-500 shadow-lg shadow-red-500/20' : 'border-amber-500 shadow-lg shadow-amber-500/20'
              }`}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {alert.acknowledged ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <AlertCircle className={`w-5 h-5 ${alert.severity === 'critical' ? 'text-red-500 animate-pulse' : 'text-amber-500'}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">{alert.metric_name}</span>
                        <Badge className={
                          alert.severity === 'critical'
                            ? 'bg-red-500/20 text-red-300 border-red-500'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500'
                        }>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        {alert.acknowledged && (
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500">
                            ACKNOWLEDGED
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-300">
                        Value: <span className="font-mono font-semibold text-cyan-400">{alert.metric_value.toFixed(1)}</span>
                        {' '}exceeds threshold{' '}
                        <span className="font-mono font-semibold text-amber-400">{alert.threshold}</span>
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                        <div>Room: <span className="text-slate-300">{alert.room_id}</span></div>
                        {alert.acknowledged_by && (
                          <div>Ack. by: <span className="text-slate-300">{alert.acknowledged_by}</span></div>
                        )}
                      </div>
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <Button
                      onClick={() => handleAcknowledge(alert.id)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                    >
                      Acknowledge
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
