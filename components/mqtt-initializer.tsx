'use client'

import { useEffect } from 'react'

export function MQTTInitializer() {
  useEffect(() => {
    // Initialize MQTT service on app load
    fetch('/api/mqtt-status')
      .then(res => res.json())
      .then(data => {
        console.log('[v0] MQTT Service Status:', data)
      })
      .catch(err => console.error('[v0] MQTT Status Check Failed:', err))
  }, [])

  return null
}
