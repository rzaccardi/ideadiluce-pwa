import { describe, expect, it } from 'vitest'
import {
  collectIncidents,
  mapMonitor,
  mapMonitorStatus,
  mapMonitorType,
} from './uptime-admin.mapper.js'

describe('uptime-admin mapper', () => {
  it('mappa status e type UptimeRobot', () => {
    expect(mapMonitorStatus(2)).toBe('up')
    expect(mapMonitorStatus(9)).toBe('down')
    expect(mapMonitorStatus(8)).toBe('seems_down')
    expect(mapMonitorType(1)).toBe('http')
    expect(mapMonitorType(2)).toBe('keyword')
  })

  it('estrae uptime 7/30 giorni, SSL e incidenti', () => {
    const mapped = mapMonitor(
      {
        id: 11,
        friendly_name: 'IDL · Storefront',
        url: 'https://shop.ideadiluce.it',
        type: 2,
        status: 2,
        interval: 300,
        keyword_value: 'Idea di Luce',
        custom_uptime_ratio: '99.980-99.950',
        all_time_uptime_ratio: '99.9',
        average_response_time: '412',
        ssl: { expires: 1_893_456_000 },
        logs: [
          { type: 1, datetime: 1_725_000_000, duration: 90, reason: { code: '333', detail: 'timeout' } },
          { type: 2, datetime: 1_725_000_090, duration: 90 },
          { type: 99, datetime: 1_724_000_000, duration: 10 },
        ],
      },
      'shop',
    )

    expect(mapped.recommendedKey).toBe('shop')
    expect(mapped.uptime7d).toBe(99.98)
    expect(mapped.uptime30d).toBe(99.95)
    expect(mapped.lastResponseMs).toBe(412)
    expect(mapped.sslExpiresAt).toBe(new Date(1_893_456_000 * 1000).toISOString())
    expect(mapped.logs[0]?.reason).toBe('333: timeout')

    const incidents = collectIncidents([mapped], 10)
    expect(incidents).toHaveLength(2)
    expect(incidents[0]?.type).toBe('up')
    expect(incidents[0]?.monitorName).toBe('IDL · Storefront')
  })
})
