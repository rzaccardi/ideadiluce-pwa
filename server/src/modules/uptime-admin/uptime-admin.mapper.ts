import type { UptimeRobotLog, UptimeRobotMonitor, UptimeRobotPsp } from './uptime-robot.client.js'

export type UptimeMonitorStatus = 'paused' | 'pending' | 'up' | 'seems_down' | 'down' | 'unknown'
export type UptimeMonitorType = 'http' | 'keyword' | 'ping' | 'port' | 'heartbeat' | 'unknown'
export type UptimeLogType = 'down' | 'up' | 'paused' | 'started' | 'unknown'

export type UptimeMonitorLogDto = {
  type: UptimeLogType
  at: string
  durationSeconds: number
  reason: string | null
}

export type UptimeMonitorDto = {
  id: number
  name: string
  url: string
  type: UptimeMonitorType
  status: UptimeMonitorStatus
  intervalSeconds: number
  uptime7d: number | null
  uptime30d: number | null
  uptimeAll: number | null
  lastResponseMs: number | null
  sslExpiresAt: string | null
  keyword: string | null
  recommendedKey: string | null
  logs: UptimeMonitorLogDto[]
}

export type UptimeIncidentDto = UptimeMonitorLogDto & {
  monitorId: number
  monitorName: string
}

export type UptimeStatusPageDto = {
  id: number
  name: string
  url: string
}

export function mapMonitorStatus(status: number | undefined): UptimeMonitorStatus {
  if (status === 0) return 'paused'
  if (status === 1) return 'pending'
  if (status === 2) return 'up'
  if (status === 8) return 'seems_down'
  if (status === 9) return 'down'
  return 'unknown'
}

export function mapMonitorType(type: number | undefined): UptimeMonitorType {
  if (type === 1) return 'http'
  if (type === 2) return 'keyword'
  if (type === 3) return 'ping'
  if (type === 4) return 'port'
  if (type === 5) return 'heartbeat'
  return 'unknown'
}

export function mapLogType(type: number | undefined): UptimeLogType {
  if (type === 1) return 'down'
  if (type === 2) return 'up'
  if (type === 99) return 'paused'
  if (type === 98) return 'started'
  return 'unknown'
}

function unixToIso(value: number | string | undefined): string | null {
  const n = typeof value === 'string' ? Number(value) : value
  if (!n || !Number.isFinite(n) || n <= 0) return null
  return new Date(n * 1000).toISOString()
}

function parseRatio(value: string | undefined, index: number): number | null {
  if (!value) return null
  const part = value.split('-')[index]?.trim()
  if (!part) return null
  const n = Number(part)
  return Number.isFinite(n) ? n : null
}

function parseSingleRatio(value: string | number | undefined): number | null {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

function logReason(reason: UptimeRobotLog['reason']): string | null {
  if (!reason) return null
  if (typeof reason === 'string') return reason.trim() || null
  const detail = reason.detail?.trim()
  const code = reason.code?.trim()
  if (detail && code) return `${code}: ${detail}`
  return detail || code || null
}

export function mapMonitorLog(log: UptimeRobotLog): UptimeMonitorLogDto | null {
  const at = unixToIso(log.datetime)
  if (!at) return null
  return {
    type: mapLogType(log.type),
    at,
    durationSeconds: typeof log.duration === 'number' ? log.duration : 0,
    reason: logReason(log.reason),
  }
}

export function mapMonitor(
  monitor: UptimeRobotMonitor,
  recommendedKey: string | null,
): UptimeMonitorDto {
  const logs = (monitor.logs ?? [])
    .map(mapMonitorLog)
    .filter((row): row is UptimeMonitorLogDto => row != null)
  return {
    id: monitor.id,
    name: monitor.friendly_name?.trim() || `Monitor ${monitor.id}`,
    url: monitor.url?.trim() || '',
    type: mapMonitorType(monitor.type),
    status: mapMonitorStatus(monitor.status),
    intervalSeconds: typeof monitor.interval === 'number' ? monitor.interval : 300,
    uptime7d: parseRatio(monitor.custom_uptime_ratio, 0),
    uptime30d: parseRatio(monitor.custom_uptime_ratio, 1),
    uptimeAll: parseSingleRatio(monitor.all_time_uptime_ratio),
    lastResponseMs: parseSingleRatio(monitor.average_response_time),
    sslExpiresAt: unixToIso(monitor.ssl?.expires),
    keyword: monitor.keyword_value?.trim() || null,
    recommendedKey,
    logs,
  }
}

export function collectIncidents(monitors: UptimeMonitorDto[], limit = 12): UptimeIncidentDto[] {
  const rows: UptimeIncidentDto[] = []
  for (const monitor of monitors) {
    for (const log of monitor.logs) {
      if (log.type !== 'down' && log.type !== 'up') continue
      rows.push({
        ...log,
        monitorId: monitor.id,
        monitorName: monitor.name,
      })
    }
  }
  rows.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
  return rows.slice(0, limit)
}

export function mapStatusPages(psps: UptimeRobotPsp[]): UptimeStatusPageDto[] {
  return psps
    .map((psp) => {
      const url = (psp.custom_url || psp.standard_url || '').trim()
      if (!url) return null
      return {
        id: psp.id,
        name: psp.friendly_name?.trim() || `Status ${psp.id}`,
        url,
      }
    })
    .filter((row): row is UptimeStatusPageDto => row != null)
}

