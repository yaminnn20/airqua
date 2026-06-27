# Clinical Air Quality Index Monitor

A medical-grade real-time AQI monitoring dashboard designed for Chest Diseases Hospital wards, featuring high-visibility clinical thresholds and respiratory patient risk assessment.

## Features

### 🏥 Clinical Monitoring
- **Respiratory Patient Risk Factor**: A prominent circular indicator (0-100 scale) that transforms clinical air quality metrics into actionable risk levels
- **Real-time Metrics**: 8 sensor inputs including PM2.5, PM10, CO₂, O₃, TVOC, Temperature, and Humidity
- **Clinical Thresholds**: Strict WHO guidelines for vulnerable lungs with visual alert states
- **High-Contrast Design**: Dark clinical theme optimized for 24/7 ward operations

### 🚨 Alert System
- **PM2.5 > 15 µg/m³**: Bright red alert (WHO strict guideline for respiratory patients)
- **CO₂ > 800 ppm**: Red/orange alert indicating poor ventilation and viral/bacterial stagnation risk
- **Ozone > 50 ppb**: Amber alert for elevated respiratory irritant levels
- **Pulsing Animations**: Critical alerts trigger pulse effects for immediate visual recognition

### 🔧 Configuration Panel
- Collapsible HiveMQ configuration interface
- Customizable broker URL, username, and password
- Secure WebSocket connection (WSS) on port 8884
- Configuration persists during session

### 📊 MQTT Real-time Integration
- Listens to 8 HomeAssistant sensor topics via secure WebSocket
- Automatic reconnection with 1-second intervals
- Clean client lifecycle management with proper unmount cleanup

## Getting Started

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The dashboard will be available at `http://localhost:3000`

### MQTT Configuration

1. Click **"HiveMQ Configuration"** to expand the settings panel
2. Enter your HiveMQ broker URL (default: `wss://broker.hivemq.com:8884/mqtt`)
3. Add username and password if your broker requires authentication
4. Click **"Save Configuration"**
5. The dashboard will attempt to connect immediately

### Sensor Topic Mapping

The dashboard subscribes to these exact HomeAssistant sensor topics:

```
homeassistant/sensor/esp32_aqi/state          → AQI Index
homeassistant/sensor/esp32_pm2_5/state        → PM2.5 (µg/m³)
homeassistant/sensor/esp32_pm10/state         → PM10 (µg/m³)
homeassistant/sensor/esp32_co2/state          → CO₂ (ppm)
homeassistant/sensor/esp32_ozone/state        → Ozone (ppb)
homeassistant/sensor/esp32_tvoc/state         → TVOC (ppb)
homeassistant/sensor/esp32_temperature/state  → Temperature (°C)
homeassistant/sensor/esp32_humidity/state     → Humidity (%)
```

### Clinical Risk Calculation

The **Respiratory Patient Risk Factor** is calculated as:

```
Risk Score = (PM2.5 × 40%) + (CO₂ × 40%) + (Ozone × 20%)
```

**Risk Levels:**
- **0**: Safe Air (Green) - All metrics within safe zones
- **1-30**: Good (Cyan) - Minor thresholds exceeded
- **31-60**: Moderate (Amber) - Multiple metrics elevated
- **61-100**: High Risk (Red, Pulsing) - Critical patient safety concern

### Threshold Details

#### PM2.5 (Particulate Matter 2.5µm)
- **Normal**: < 5 µg/m³ (Safe) ✓
- **Caution**: 5-10 µg/m³ (Monitor)
- **Warning**: 10-15 µg/m³ (Review ventilation)
- **Critical**: > 15 µg/m³ (Activate air purification) 🚨

#### CO₂ (Carbon Dioxide)
- **Good**: < 400 ppm (Optimal) ✓
- **Acceptable**: 400-600 ppm (Normal indoor)
- **Caution**: 600-800 ppm (Increase ventilation)
- **Critical**: > 800 ppm (High viral/bacterial stagnation) 🚨

#### Ozone (O₃)
- **Normal**: < 30 ppb (Safe) ✓
- **Caution**: 30-50 ppb (Monitor respiratory symptoms)
- **Warning**: > 50 ppb (Restrict outdoor air intake) ⚠️

## Architecture

### Component Structure

```
app/
├── layout.tsx           # Root layout with dark theme
├── page.tsx            # Main dashboard page
└── globals.css         # Clinical dark theme tokens
components/
├── aqi-dashboard.tsx   # Main dashboard component
└── ui/
    ├── card.tsx       # Shadcn card component
    ├── collapsible.tsx # Shadcn collapsible component
    ├── input.tsx      # Shadcn input component
    └── label.tsx      # Shadcn label component
```

### State Management

The dashboard uses React hooks for state management:

```typescript
interface MetricsState {
  aqi: number | null
  pm25: number | null
  pm10: number | null
  co2: number | null
  ozone: number | null
  tvoc: number | null
  temperature: number | null
  humidity: number | null
  lastUpdate: Date | null
}
```

### MQTT Connection Lifecycle

1. **useEffect Hook**: Initializes MQTT client on component mount
2. **Subscribe**: Automatically subscribes to all 8 sensor topics
3. **Message Handler**: Updates metrics state in real-time
4. **Cleanup**: Properly ends client connection on component unmount
5. **Reconnection**: Automatic retry with 1-second intervals

## Deployment

### Vercel Deployment

```bash
# Deploy to Vercel
vercel deploy

# View logs
vercel logs
```

### Environment Variables

No environment variables required. All configuration is done via the UI.

### Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires WebSocket support (WSS) for MQTT over secure WebSocket.

## Clinical Use Guidelines

### Daily Operations

1. **Morning Check**: Verify "Connected" status in top-right corner
2. **Monitor Risk Factor**: Watch the circular indicator throughout the day
3. **Alert Response**: Respond to pulsing red alerts immediately
4. **Manual Override**: Can customize broker URL if testing with different sources
5. **Documentation**: Last update timestamp shown in Risk Factor card

### Ventilation Response Protocol

- **Yellow Alert (Moderate)**: Review HVAC settings, increase fresh air intake
- **Red Alert (High Risk)**: Immediately activate portable air purifiers, maximize ventilation
- **Sustained High PM2.5**: Investigate outdoor air quality, check intake filters
- **High CO₂**: Verify HVAC operation, open windows if outdoor AQI safe

### Maintenance

- **Weekly**: Verify connection status and data flow
- **Monthly**: Check broker configuration, test manual updates
- **Quarterly**: Review alert response times, update clinical thresholds if needed

## Technologies Used

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS v4, Shadcn UI components
- **MQTT**: mqtt v5.15.1 over secure WebSocket (WSS)
- **Theme**: Clinical dark mode (Slate-950 base, emerald/cyan/amber/red accents)

## Responsive Design

- **Desktop**: Full 4-column metric grid with sidebar
- **Tablet (1024px)**: 2-column metric grid
- **Mobile (640px)**: 1-column stacked layout

All UI scales responsively while maintaining readability of clinical data.

## Troubleshooting

### Connection Issues

**"Disconnected" Status Persists**
- Check broker URL format: `wss://broker.hivemq.com:8884/mqtt`
- Verify WSS (secure WebSocket) connectivity from your network
- Check browser console for detailed error messages

**No Data Appearing**
- Verify sensor device is publishing to correct MQTT topics
- Confirm MQTT broker is receiving messages (check broker logs)
- Check HomeAssistant MQTT integration configuration

### Performance

- Dashboard is optimized for 60 FPS animations
- Metric updates debounced to prevent excessive re-renders
- State cleanup ensures no memory leaks on route changes

## License

Medical-grade monitoring software for hospital use. Use in accordance with local healthcare IT policies and data protection regulations.

## Support

For issues, questions, or feature requests related to clinical thresholds and hospital integration, please refer to the embedded clinical guidelines in the dashboard footer.
