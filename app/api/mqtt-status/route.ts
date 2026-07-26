import { NextRequest, NextResponse } from 'next/server'
import { startMQTTService, isMQTTConnected } from '@/lib/mqtt-service'

// Start MQTT service on first request
startMQTTService().catch(err => console.error('[MQTT] Failed to start:', err))

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    mqttConnected: isMQTTConnected(),
    message: 'MQTT service is running continuously in the background'
  })
}
