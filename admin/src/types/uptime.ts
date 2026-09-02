export type UptimeMonitorStatus = 'paused' | 'pending' | 'up' | 'seems_down' | 'down' | 'unknown'
export type UptimeMonitorType = 'http' | 'keyword' | 'ping' | 'port' | 'heartbeat' | 'unknown'
export type UptimeLogType = 'down' | 'up' | 'paused' | 'started' | 'unknown'

export type UptimeMonitorLog = {
  type: UptimeLogType
  at: string
  durationSeconds: number
  reason: string | null
}

export type UptimeMonitor = {
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
  logs: UptimeMonitorLog[]
}

export type UptimeIncident = UptimeMonitorLog & {
  monitorId: number
  monitorName: string
}

export type UptimeRecommended = {
  key: string
  name: string
  url: string
  type: 'http' | 'keyword'
  keyword: string | null
  description: string
  present: boolean
  monitorId: number | null
}

export type UptimeOverview = {
  configured: boolean
  dashboardUrl: string
  account: {
    monitorLimit: number
    monitorIntervalMinutes: number
    up: number
    down: number
    paused: number
  } | null
  monitors: UptimeMonitor[]
  recommended: UptimeRecommended[]
  incidents: UptimeIncident[]
  statusPages: Array<{ id: number; name: string; url: string }>
  missingRecommended: number
  fetchedAt: string
}

export type UptimeEnsureResult = {
  created: Array<{ key: string; id: number; name: string }>
  skipped: Array<{ key: string; reason: string }>
  overview: UptimeOverview
}

export const UPTIME_STATUS_LABELS: Record<UptimeMonitorStatus, string> = {
  up: 'Online',
  down: 'Down',
  seems_down: 'Sembra down',
  paused: 'In pausa',
  pending: 'In attesa',
  unknown: 'Sconosciuto',
}

export const UPTIME_TYPE_LABELS: Record<UptimeMonitorType, string> = {
  http: 'HTTP',
  keyword: 'Keyword',
  ping: 'Ping',
  port: 'Porta',
  heartbeat: 'Heartbeat',
  unknown: 'Altro',
}

export const UPTIME_LOG_LABELS: Record<UptimeLogType, string> = {
  down: 'Down',
  up: 'Ripristinato',
  paused: 'Pausa',
  started: 'Avvio',
  unknown: 'Evento',
}

export function uptimeStatusLabel(status: UptimeMonitorStatus): string {
  return UPTIME_STATUS_LABELS[status] ?? status
}

export function sslExpiryWarning(iso: string | null, now = Date.now()): 'ok' | 'soon' | 'expired' | null {
  if (!iso) return null
  const at = new Date(iso).getTime()
  if (!Number.isFinite(at)) return null
  if (at <= now) return 'expired'
  const days = (at - now) / (24 * 60 * 60 * 1000)
  if (days <= 21) return 'soon'
  return 'ok'
}
