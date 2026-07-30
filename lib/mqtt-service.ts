import mqtt from 'mqtt'
import { getPool } from './db'

let client: mqtt.MqttClient | null = null
let isConnected = false
const THROTTLE_INTERVAL = 3000 // Save 1 reading per 3 seconds
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 10
let latestMessage: any = null // Hold latest message
let lastSaveTime = 0 // Track last save timestamp for throttling

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

    client.on('message', (topic, message) => {
      try {
        // Just store the latest message
        latestMessage = JSON.parse(message.toString())
      } catch (err) {
        console.error('[MQTT] Error parsing message:', err instanceof Error ? err.message : err)
      }
    })

    // Save latest message every 3 seconds using timestamp-based throttling
    setInterval(async () => {
      try {
        if (latestMessage && isConnected) {
          const now = Date.now()
          // Only save if 3 seconds have passed since last save
          if (now - lastSaveTime >= THROTTLE_INTERVAL) {
            lastSaveTime = now
            const pool = getPool()
            await pool.query(
              `INSERT INTO sensor_readings (pm1, pm25, pm10, co2, ozone, tvoc, temperature, humidity, aqi, hospital_id, timestamp)
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
                'default',
              ]
            )
          }
        }
      } catch (err) {
        console.error('[MQTT] Error saving to database:', err instanceof Error ? err.message : err)
      }
    }, 1000) // Check every second, but only save if 3+ seconds have passed

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
