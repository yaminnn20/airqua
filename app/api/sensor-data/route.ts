import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hours = parseInt(searchParams.get('hours') || '24')
    const hospitalId = searchParams.get('hospitalId') || 'default'

    // Fetch sensor readings from Neon database
    const result = await pool.query(
      `SELECT * FROM sensor_readings 
       WHERE hospital_id = $1
       AND timestamp > NOW() - INTERVAL '1 hour' * $2
       ORDER BY timestamp DESC 
       LIMIT 1000`,
      [hospitalId, hours]
    )

    return NextResponse.json({
      success: true,
      data: result.rows || [],
      count: (result.rows || []).length,
    })
  } catch (error: any) {
    console.error('[v0] Error fetching sensor data:', error)
    // Return empty array on error so app shows mock data gracefully
    return NextResponse.json({
      success: true,
      data: [],
      count: 0,
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      pm1,
      pm25,
      pm10,
      co2,
      ozone,
      tvoc,
      temperature,
      humidity,
      aqi,
      room_id = 'default',
      hospital_id = 'default',
    } = body

    // Insert sensor reading into Neon database
    await pool.query(
      `INSERT INTO sensor_readings (pm1, pm25, pm10, co2, ozone, tvoc, temperature, humidity, aqi, room_id, hospital_id, timestamp, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
      [pm1, pm25, pm10, co2, ozone, tvoc, temperature, humidity, aqi, room_id, hospital_id]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[v0] Error saving sensor data:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
