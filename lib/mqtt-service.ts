import mqtt from 'mqtt'
import { getPool } from './db'

let client: mqtt.MqttClient | null = null
let isConnected = false

export async function startMQTTService() {
  if (isConnected || client) {
    console.log('[MQTT] Service already running')
    return
  }

  try {
    const MQTT_URL = process.env.MQTT_URL || 'wss://n262659d.ala.asia-southeast1.emqxsl.com:8084/mqtt'
    const MQTT_USERNAME = process.env.MQTT_USERNAME || 'yamm19'
    const MQTT_PASSWORD = process.env.MQTT_PASSWORD || 'Yamin9697'
    const MQTT_TOPIC = process.env.MQTT_TOPIC || 'homeassistant/sensor/esp32_air/state'

    console.log('[MQTT] Connecting to broker:', MQTT_URL)

    client = mqtt.connect(MQTT_URL, {
      username: MQTT_USERNAME,
      password: MQTT_PASSWORD,
      clientId: `airqua-service-${Date.now()}`,
      reconnectPeriod: 5000,
      keepalive: 60,
      protocol: 'wss',
      path: '/mqtt',
    })

    client.on('connect', () => {
      console.log('[MQTT] Connected to broker')
      isConnected = true
      client?.subscribe(MQTT_TOPIC, (err) => {
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
        
        console.log('[MQTT] Data saved - PM2.5:', data.pm25, 'CO2:', data.co2)
      } catch (err) {
        console.error('[MQTT] Error processing message:', err)
      }
    })

    client.on('error', (err) => {
      console.error('[MQTT] Connection error:', err)
      isConnected = false
    })

    client.on('disconnect', () => {
      console.log('[MQTT] Disconnected from broker')
      isConnected = false
    })
  } catch (error) {
    console.error('[MQTT] Service error:', error)
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
