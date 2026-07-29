import mqtt from 'mqtt'
import { getPool } from './db'
import * as fs from 'fs'
import * as path from 'path'

let client: mqtt.MqttClient | null = null
let isConnected = false
let lastDataSave = 0
const THROTTLE_INTERVAL = 3000 // Save 1 reading per 3 seconds
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 10
const THROTTLE_FILE = path.join(process.cwd(), '.mqtt-throttle')

// Load last save time from file
function loadLastSaveTime(): number {
  try {
    if (fs.existsSync(THROTTLE_FILE)) {
      const data = fs.readFileSync(THROTTLE_FILE, 'utf-8')
      return parseInt(data, 10) || 0
    }
  } catch (e) {
    // Ignore errors
  }
  return 0
}

// Save last save time to file
function saveLastSaveTime(time: number): void {
  try {
    fs.writeFileSync(THROTTLE_FILE, String(time), 'utf-8')
  } catch (e) {
    // Ignore errors
  }
}

export async function startMQTTService() {
  if (client) {
    console.log('[MQTT] Service already initialized')
    return
  }

  try {
    const MQTT_URL = process.env.MQTT_URL || 'wss://n262659d.ala.asia-southeast1.emqxsl.com:8084/mqtt'
    const MQTT_USERNAME = process.env.MQTT_USERNAME || 'yamm19'
    const MQTT_PASSWORD = process.env.MQTT_PASSWORD || 'Yamin9697'
    const MQTT_TOPIC = process.env.MQTT_TOPIC || 'homeassistant/sensor/esp32_air/state'

    console.log('[MQTT] Starting service... connecting to broker')

    client = mqtt.connect(MQTT_URL, {
      username: MQTT_USERNAME,
      password: MQTT_PASSWORD,
      clientId: `airqua-service-${Date.now()}`,
      reconnectPeriod: 3000, // Reconnect every 3 seconds if disconnected
      keepalive: 60,
      protocol: 'wss',
      path: '/mqtt',
      clean: true,
      connectTimeout: 10000,
    })

    client.on('connect', () => {
      console.log('[MQTT] Connected to broker successfully')
      isConnected = true
      reconnectAttempts = 0
      client?.subscribe(MQTT_TOPIC, { qos: 1 }, (err) => {
        if (err) {
          console.error('[MQTT] Subscription error:', err)
        } else {
          console.log('[MQTT] Subscribed to:', MQTT_TOPIC)
        }
      })
    })

    client.on('message', async (topic, message) => {
      try {
        const data = JSON.parse(message.toString())
        const now = Date.now()
        
        // Throttle: only save to database once per 3 seconds
        if (now - lastDataSave < THROTTLE_INTERVAL) {
          return
        }
        
        lastDataSave = now
        
        // Save to database
        const pool = getPool()
        await pool.query(
          `INSERT INTO sensor_readings (pm1, pm25, pm10, co2, ozone, tvoc, temperature, humidity, aqi, hospital_id, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
          [
            data.pm1 ?? null,
            data.pm25 ?? null,
            data.pm10 ?? null,
            data.co2 ?? null,
            data.ozone ?? null,
            data.tvoc ?? null,
            data.temperature ?? null,
            data.humidity ?? null,
            data.aqi ?? null,
            'default',
          ]
        )
        console.log('[MQTT] Data saved')
      } catch (err) {
        console.error('[MQTT] Error processing message:', err instanceof Error ? err.message : err)
      }
    })

    client.on('error', (err) => {
      console.error('[MQTT] Connection error:', err instanceof Error ? err.message : err)
      isConnected = false
    })

    client.on('offline', () => {
      console.warn('[MQTT] Offline - will attempt to reconnect')
      isConnected = false
      reconnectAttempts++
    })

    client.on('disconnect', () => {
      console.log('[MQTT] Disconnected')
      isConnected = false
    })

    client.on('reconnect', () => {
      console.log('[MQTT] Attempting to reconnect... (attempt', reconnectAttempts + 1, ')')
    })

    // Keep-alive check every 30 seconds
    setInterval(() => {
      if (client && !isConnected) {
        console.log('[MQTT] Keep-alive: connection lost, forcing reconnect')
        client.reconnect()
      }
    }, 30000)

  } catch (error) {
    console.error('[MQTT] Service error:', error instanceof Error ? error.message : error)
  }
}

export function stopMQTTService() {
  if (client) {
    client.end()
    client = null
    isConnected = false
    console.log('[MQTT] Service stopped')
  }
}

export function isMQTTConnected(): boolean {
  return isConnected
}
