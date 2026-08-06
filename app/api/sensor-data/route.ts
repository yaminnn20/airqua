import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

// 1. Maintain a single connection pool across frozen serverless instances
declare global {
  var globalPgPool: Pool | undefined
}

function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) {
    console.error('[DB] DATABASE_URL environment variable is missing')
    return null
  }

  if (!global.globalPgPool) {
    console.log('[DB] Creating global connection pool for serverless execution')
    global.globalPgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 4,                  // Limits connections per serverless container instance
      idleTimeoutMillis: 15000, // Closes idle connections after 15 seconds
      connectionTimeoutMillis: 5000,
    })
  }
  return global.globalPgPool
}

// 2. GET Endpoint (Kept intact for your frontend to read history)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hours = parseInt(searchParams.get('hours') || '24')
    const hospitalId = searchParams.get('hospitalId') || 'default'

    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ success: false, error: 'Database configuration missing' }, { status: 500 })
    }

    const result = await pool.query(
      `SELECT pm1, pm25, pm10, co2, temperature, humidity, ozone, timestamp 
       FROM sensor_readings 
       WHERE hospital_id = $1 AND timestamp > NOW() - INTERVAL '1 hour' * $2 
       ORDER BY timestamp DESC LIMIT 1000`,
      [hospitalId, hours]
    )

    // Note: Removed pool.end() so the connection stays open for the next request!
    return NextResponse.json({ success: true, data: result.rows || [] })
  } catch (error) {
    console.error('[API GET Error]:', error)
    return NextResponse.json({ success: false, data: [], error: 'Failed to fetch sensor data' }, { status: 500 })
  }
}

// 3. POST Endpoint (UNBLOCKED: This receives the data forwarded from EMQX)
export async function POST(request: NextRequest) {
  try {
    // Parse the payload sent by EMQX
    const latestMessage = await request.json()
    
    console.log('[Webhook POST] Received packet:', JSON.stringify(latestMessage))

    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 })
    }

    // Save directly to Neon database
    await pool.query(
      `INSERT INTO sensor_readings 
       (pm1, pm25, pm10, co2, ozone, tvoc, temperature, humidity, aqi, hospital_id, timestamp) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [
        latestMessage.pm1 ?? null,
        latestMessage.pm25 ?? null,
        latestMessage.pm10 ?? null,
        latestMessage.co2 ?? null,
        latestMessage.ozone ?? null,
        latestMessage.tvoc ?? null,
        latestMessage.temperature ?? null,
        latestMessage.humidity ?? null,
        latestMessage.aqi ?? null,
        latestMessage.hospital_id ?? 'default'
      ]
    )

    return NextResponse.json({ success: true, message: 'Data synced to Neon successfully' }, { status: 200 })
  } catch (error) {
    console.error('[API POST Error]:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' }, 
      { status: 500 }
    )
  }
}
