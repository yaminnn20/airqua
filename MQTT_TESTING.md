# MQTT Testing Guide

## Publishing Test Data to HiveMQ

To test the dashboard without physical sensors, you can publish MQTT messages to the expected topics using any MQTT client.

### Using HiveMQ Web Client

1. Visit: https://www.hivemq.com/demos/websocket-client/
2. Set Connection Details:
   - Host: `broker.hivemq.com`
   - Port: `8884` (WebSocket)
   - Protocol: `wss://`
3. Click "Connect"

### Publishing Test Values

#### Safe Air Conditions (Risk Score: 0)

```
Topic: homeassistant/sensor/esp32_pm2_5/state
Payload: 8

Topic: homeassistant/sensor/esp32_co2/state
Payload: 450

Topic: homeassistant/sensor/esp32_ozone/state
Payload: 25

Topic: homeassistant/sensor/esp32_pm10/state
Payload: 12

Topic: homeassistant/sensor/esp32_tvoc/state
Payload: 100

Topic: homeassistant/sensor/esp32_temperature/state
Payload: 22.5

Topic: homeassistant/sensor/esp32_humidity/state
Payload: 55

Topic: homeassistant/sensor/esp32_aqi/state
Payload: 50
```

**Expected Dashboard State:**
- Risk Score: 0 (Safe Air) 🟢
- All metric cards show green indicators
- No alerts triggered

---

#### Moderate Air Quality (Risk Score: ~30)

```
Topic: homeassistant/sensor/esp32_pm2_5/state
Payload: 12  (Caution level)

Topic: homeassistant/sensor/esp32_co2/state
Payload: 650  (Elevated)

Topic: homeassistant/sensor/esp32_ozone/state
Payload: 35  (Monitor)

Topic: homeassistant/sensor/esp32_pm10/state
Payload: 25

Topic: homeassistant/sensor/esp32_tvoc/state
Payload: 250

Topic: homeassistant/sensor/esp32_temperature/state
Payload: 23

Topic: homeassistant/sensor/esp32_humidity/state
Payload: 60

Topic: homeassistant/sensor/esp32_aqi/state
Payload: 65
```

**Expected Dashboard State:**
- Risk Score: ~25-35 (Good) 🔵
- PM2.5 and CO₂ show amber indicators
- Caution status displayed

---

#### Poor Air Quality Alert (Risk Score: ~60+)

```
Topic: homeassistant/sensor/esp32_pm2_5/state
Payload: 18  (EXCEEDS THRESHOLD)

Topic: homeassistant/sensor/esp32_co2/state
Payload: 950  (POOR VENTILATION)

Topic: homeassistant/sensor/esp32_ozone/state
Payload: 65  (ELEVATED)

Topic: homeassistant/sensor/esp32_pm10/state
Payload: 40

Topic: homeassistant/sensor/esp32_tvoc/state
Payload: 500

Topic: homeassistant/sensor/esp32_temperature/state
Payload: 24

Topic: homeassistant/sensor/esp32_humidity/state
Payload: 70

Topic: homeassistant/sensor/esp32_aqi/state
Payload: 150
```

**Expected Dashboard State:**
- Risk Score: 60-75 (High Risk) 🔴
- Pulsing red border animation on risk factor card
- PM2.5 card: Bright red with alert icon
- CO₂ card: Red with "POOR VENTILATION" warning
- Ozone card: Amber with elevated indicator
- All metric cards highlight critical levels
- Clinical staff should activate air purification immediately

---

## Using MQTT.js Command Line

If you have Node.js installed:

```bash
npm install -g mqtt

# Connect and publish
mqtt pub -h broker.hivemq.com -p 8884 --protocol mqtts \
  -t "homeassistant/sensor/esp32_pm2_5/state" \
  -m "18"
```

## Using Python (PAHO MQTT)

```python
import paho.mqtt.client as mqtt
import ssl
import time

broker = "broker.hivemq.com"
port = 8884
topics = {
    "homeassistant/sensor/esp32_pm2_5/state": "18",
    "homeassistant/sensor/esp32_co2/state": "950",
    "homeassistant/sensor/esp32_ozone/state": "65",
    "homeassistant/sensor/esp32_pm10/state": "40",
    "homeassistant/sensor/esp32_tvoc/state": "500",
    "homeassistant/sensor/esp32_temperature/state": "24",
    "homeassistant/sensor/esp32_humidity/state": "70",
    "homeassistant/sensor/esp32_aqi/state": "150"
}

client = mqtt.Client()
client.tls_set(cert_reqs=ssl.CERT_NONE)
client.tls_insecure_set(True)

client.connect(broker, port, keepalive=60)
client.loop_start()

for topic, payload in topics.items():
    client.publish(topic, payload)
    print(f"Published {payload} to {topic}")
    time.sleep(0.2)

client.loop_stop()
client.disconnect()
```

## Risk Score Calculation Reference

The dashboard calculates the risk score as:

```
PM2.5 Contribution = {
  0 if value <= 5,
  10 if 5 < value <= 10,
  25 if 10 < value <= 15,
  40 if value > 15
}

CO2 Contribution = {
  0 if value <= 400,
  10 if 400 < value <= 600,
  25 if 600 < value <= 800,
  40 if value > 800
}

Ozone Contribution = {
  0 if value <= 30,
  10 if 30 < value <= 50,
  20 if value > 50
}

Total Risk Score = PM2.5 + CO2 + Ozone
```

## Real-world Testing Workflow

### Step 1: Verify Connection
- Open the dashboard
- Check that "Connected" appears in top-right corner
- Expand HiveMQ Configuration and verify settings

### Step 2: Test Safe Conditions
- Publish "Safe Air Conditions" values
- Wait 1-2 seconds for updates
- Verify all metrics show "—" before data arrives, then show numeric values
- Confirm risk score is 0 and "Safe Air" is displayed

### Step 3: Test Alert System
- Publish "Poor Air Quality Alert" values
- Verify red pulsing border appears on risk factor card
- Check that PM2.5 and CO₂ cards show red alerts
- Confirm clinical thresholds displayed at bottom

### Step 4: Test Responsiveness
- Publish intermediate values
- Verify real-time updates without page refresh
- Test that configuration changes trigger reconnection
- Check that disconnecting/reconnecting shows proper status

## Performance Testing

### Stress Test (Rapid Updates)
```bash
# Publish a new value every 100ms
for i in {1..100}; do
  VALUE=$((RANDOM % 50 + 5))
  mqtt pub -h broker.hivemq.com -p 8884 --protocol mqtts \
    -t "homeassistant/sensor/esp32_pm2_5/state" \
    -m "$VALUE"
  sleep 0.1
done
```

Expected: Dashboard smoothly updates without lag or visual glitches

### Load Test (Multiple Sensors)
Publish to all 8 topics simultaneously and verify:
- All values update within 2-3 seconds
- No console errors in browser DevTools
- CPU usage remains under 15%
- No memory leaks after 1 hour of continuous updates

## Troubleshooting MQTT Connection

### Dashboard Shows "Disconnected"

**Check 1: Verify Broker Connectivity**
```bash
# Test connection to HiveMQ
openssl s_client -connect broker.hivemq.com:8884 -quiet
```

**Check 2: Check Browser Console**
- Open DevTools (F12)
- Check Console tab for connection errors
- Look for WebSocket (WSS) connection details

**Check 3: Verify Topic Format**
- Ensure topics exactly match the expected list
- Check for extra spaces or typos
- Verify using HiveMQ web client to confirm topics received

### Values Not Updating

**Check 1: Verify Publishing**
- Use HiveMQ web client to manually publish
- Confirm messages arrive via "Messages Received" log

**Check 2: Check Dashboard State**
- Verify connection status shows "Connected"
- Check browser console for any filtering issues
- Try publishing to `test/topic` to verify publication works

**Check 3: Restart Dashboard**
- Reload page (F5)
- Close and reopen browser if connection cached
- Clear browser cache if needed

## Integration with HomeAssistant

### MQTT Entity Setup

Add to your HomeAssistant `configuration.yaml`:

```yaml
mqtt:
  broker: broker.hivemq.com
  port: 8884
  protocol: 3.1.1

template:
  - sensor:
      - name: "ESP32 AQI"
        unit_of_measurement: "AQI"
        icon: "mdi:air-quality"
        state_topic: "homeassistant/sensor/esp32_aqi/state"
        
      - name: "ESP32 PM2.5"
        unit_of_measurement: "µg/m³"
        icon: "mdi:air-filter"
        state_topic: "homeassistant/sensor/esp32_pm2_5/state"
        
      - name: "ESP32 CO2"
        unit_of_measurement: "ppm"
        icon: "mdi:molecule-co2"
        state_topic: "homeassistant/sensor/esp32_co2/state"
```

Then access metrics in HomeAssistant automations and dashboards.

## Reference: Default Broker Configuration

- **Broker**: `broker.hivemq.com`
- **Port**: `8884` (WebSocket Secure)
- **Protocol**: `wss://` (Secure WebSocket)
- **Keep Alive**: 60 seconds
- **Auth**: Optional (username/password)
- **Max Connections**: No limit on public broker
