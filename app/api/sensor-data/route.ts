import { NextRequest, NextResponse } from 'next/server'

async function getPool() {
  if (!process.env.DATABASE_URL) {
    console.log('[v0] DATABASE_URL not set, returning empty data')
    return null
  }

  const { Pool } = await import('pg')
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  return pool
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hours = parseInt(searchParams.get('hours') || '24')
    const hospitalId = searchParams.get('hospitalId') || 'default'

    const pool = await getPool()
    if (!pool) {
      return NextResponse.json({ success: true, data: [] })
    }

    const result = await pool.query(
      `SELECT pm1, pm25, pm10, co2, temperature, humidity, ozone, timestamp 
       FROM sensor_readings 
       WHERE hospital_id = $1
       AND timestamp > NOW() - INTERVAL '1 hour' * $2
       ORDER BY timestamp DESC 
       LIMIT 1000`,
      [hospitalId, hours]
    )

    await pool.end()
    return NextResponse.json({
      success: true,
      data: result.rows || [],
    })
  } catch (error) {
    console.log('[v0] Error fetching sensor data, returning empty:', error)
    return NextResponse.json({ success: true, data: [] })
  }
}

export async function POST(request: NextRequest) {
  // DISABLED: data comes from MQTT service only, not from browser
  // POST requests are rejected to prevent duplicate saves
  console.log('[v0] POST /api/sensor-data blocked - use MQTT service instead')
  return NextResponse.json({ success: false, error: 'POST endpoint disabled - use MQTT service' }, { status: 400 })
}
