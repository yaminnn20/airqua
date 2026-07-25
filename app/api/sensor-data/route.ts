import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hours = searchParams.get('hours') || '24'
    const hospitalId = searchParams.get('hospitalId') || 'default'

    // Fetch sensor readings from Neon database
    const readings = await db.execute(
      sql`SELECT * FROM sensor_readings 
          WHERE hospital_id = ${hospitalId} 
          AND timestamp > NOW() - INTERVAL '${hours} hours'
          ORDER BY timestamp DESC 
          LIMIT 1000`
    )

    return NextResponse.json({
      success: true,
      data: readings.rows || [],
      count: (readings.rows || []).length,
    })
  } catch (error: any) {
    console.error('[v0] Error fetching sensor data:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
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
    await db.execute(
      sql`INSERT INTO sensor_readings (pm1, pm25, pm10, co2, ozone, tvoc, temperature, humidity, aqi, room_id, hospital_id, timestamp, created_at)
          VALUES (${pm1}, ${pm25}, ${pm10}, ${co2}, ${ozone}, ${tvoc}, ${temperature}, ${humidity}, ${aqi}, ${room_id}, ${hospital_id}, NOW(), NOW())`
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
