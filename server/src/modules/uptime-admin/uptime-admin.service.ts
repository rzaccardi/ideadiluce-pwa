import { env } from '../../config/env.js'
import { AppError } from '../../types/errors.js'
import { logger } from '../../lib/logger.js'
import {
  collectIncidents,
  mapMonitor,
  mapStatusPages,
  type UptimeIncidentDto,
  type UptimeMonitorDto,
  type UptimeStatusPageDto,
} from './uptime-admin.mapper.js'
import {
  buildRecommendedMonitors,
  matchRecommendedMonitor,
  type RecommendedMonitorSpec,
} from './uptime-recommended.js'
import { uptimeRobotClient, type UptimeRobotMonitor } from './uptime-robot.client.js'

const DASHBOARD_URL = 'https://dashboard.uptimerobot.com/monitors'
const OVERVIEW_CACHE_MS = 20_000

export type UptimeRecommendedDto = {
  key: string
  name: string
  url: string
  type: 'http' | 'keyword'
  keyword: string | null
  description: string
  present: boolean
  monitorId: number | null
}

export type UptimeOverviewDto = {
  configured: boolean
  dashboardUrl: string
  account: {
    monitorLimit: number
    monitorIntervalMinutes: number
    up: number
    down: number
    paused: number
  } | null
  monitors: UptimeMonitorDto[]
  recommended: UptimeRecommendedDto[]
  incidents: UptimeIncidentDto[]
  statusPages: UptimeStatusPageDto[]
  missingRecommended: number
  fetchedAt: string
}

export type UptimeEnsureResultDto = {
  created: Array<{ key: string; id: number; name: string }>
  skipped: Array<{ key: string; reason: string }>
  overview: UptimeOverviewDto
}

type CacheEntry = { at: number; value: UptimeOverviewDto }

let overviewCache: CacheEntry | null = null

function apiKey(): string | null {
  const key = env.UPTIMEROBOT_API_KEY?.trim()
  return key ? key : null
}

function recommendedEnv() {
  return {
    publicSiteUrl: env.PUBLIC_SITE_URL,
    adminOrigin: env.ADMIN_ORIGIN,
    odooBaseUrl: env.ODOO_CATALOG_BASE_URL || env.ODOO_XMLRPC_URL,
    apiPublicUrl: env.API_PUBLIC_URL,
  }
}

function monitorIntervalSeconds(): number {
  const n = env.UPTIMEROBOT_INTERVAL_SECONDS
  if (!Number.isFinite(n) || n < 60) return 300
  return Math.round(n)
}

function toRecommendedDtos(
  specs: RecommendedMonitorSpec[],
  monitors: UptimeRobotMonitor[],
): UptimeRecommendedDto[] {
  const existing = monitors.map((m) => ({
    id: m.id,
    url: m.url ?? '',
    friendlyName: m.friendly_name ?? '',
  }))
  return specs.map((spec) => {
    const match = matchRecommendedMonitor(spec, existing)
    return {
      key: spec.key,
      name: spec.friendlyName,
      url: spec.url,
      type: spec.type,
      keyword: spec.keywordValue ?? null,
      description: spec.description,
      present: Boolean(match),
      monitorId: match?.id ?? null,
    }
  })
}

function recommendedKeyByMonitorId(recommended: UptimeRecommendedDto[]): Map<number, string> {
  const map = new Map<number, string>()
  for (const row of recommended) {
    if (row.monitorId != null) map.set(row.monitorId, row.key)
  }
  return map
}

function buildOverview(
  rawMonitors: UptimeRobotMonitor[],
  account: UptimeOverviewDto['account'],
  statusPages: UptimeStatusPageDto[],
): UptimeOverviewDto {
  const specs = buildRecommendedMonitors(recommendedEnv())
  const recommended = toRecommendedDtos(specs, rawMonitors)
  const keys = recommendedKeyByMonitorId(recommended)
  const monitors = rawMonitors.map((m) => mapMonitor(m, keys.get(m.id) ?? null))
  return {
    configured: true,
    dashboardUrl: DASHBOARD_URL,
    account,
    monitors,
    recommended,
    incidents: collectIncidents(monitors),
    statusPages,
    missingRecommended: recommended.filter((r) => !r.present).length,
    fetchedAt: new Date().toISOString(),
  }
}

function emptyOverview(): UptimeOverviewDto {
  const specs = buildRecommendedMonitors(recommendedEnv())
  const recommended = toRecommendedDtos(specs, [])
  return {
    configured: false,
    dashboardUrl: DASHBOARD_URL,
    account: null,
    monitors: [],
    recommended,
    incidents: [],
    statusPages: [],
    missingRecommended: recommended.length,
    fetchedAt: new Date().toISOString(),
  }
}

async function fetchOverviewLive(key: string): Promise<UptimeOverviewDto> {
  const [accountRes, rawMonitors, psps] = await Promise.all([
    uptimeRobotClient.getAccountDetails(key),
    uptimeRobotClient.getAllMonitors(key),
    uptimeRobotClient.getPsps(key),
  ])
  const acc = accountRes.account
  return buildOverview(
    rawMonitors,
    acc
      ? {
          monitorLimit: acc.monitor_limit ?? 0,
          monitorIntervalMinutes: acc.monitor_interval ?? 5,
          up: acc.up_monitors ?? 0,
          down: acc.down_monitors ?? 0,
          paused: acc.paused_monitors ?? 0,
        }
      : null,
    mapStatusPages(psps),
  )
}

export const uptimeAdminService = {
  async getOverview(): Promise<UptimeOverviewDto> {
    const key = apiKey()
    if (!key) return emptyOverview()
    const now = Date.now()
    if (overviewCache && now - overviewCache.at < OVERVIEW_CACHE_MS) {
      return overviewCache.value
    }
    const value = await fetchOverviewLive(key)
    overviewCache = { at: now, value }
    return value
  },

  async ensureRecommended(): Promise<UptimeEnsureResultDto> {
    const key = apiKey()
    if (!key) {
      throw new AppError(
        'UPTIMEROBOT_NOT_CONFIGURED',
        'UptimeRobot API key missing',
        'Configura UPTIMEROBOT_API_KEY sul componente api, poi riprova.',
        400,
        false,
      )
    }
    overviewCache = null
    const specs = buildRecommendedMonitors(recommendedEnv())
    const existing = await uptimeRobotClient.getAllMonitors(key)
    const created: UptimeEnsureResultDto['created'] = []
    const skipped: UptimeEnsureResultDto['skipped'] = []
    const interval = monitorIntervalSeconds()

    for (const spec of specs) {
      const match = matchRecommendedMonitor(
        spec,
        existing.map((m) => ({
          id: m.id,
          url: m.url ?? '',
          friendlyName: m.friendly_name ?? '',
        })),
      )
      if (match) {
        skipped.push({ key: spec.key, reason: 'già presente' })
        continue
      }
      const createdRes = await uptimeRobotClient.newMonitor(key, {
        friendlyName: spec.friendlyName,
        url: spec.url,
        type: spec.type === 'keyword' ? 2 : 1,
        interval,
        keywordValue: spec.keywordValue,
      })
      const id = createdRes.monitor?.id
      if (!id) {
        skipped.push({ key: spec.key, reason: 'risposta senza id' })
        continue
      }
      existing.push({
        id,
        friendly_name: spec.friendlyName,
        url: spec.url,
        type: spec.type === 'keyword' ? 2 : 1,
        status: 1,
      })
      created.push({ key: spec.key, id, name: spec.friendlyName })
      logger.info('uptime.monitor_created', { key: spec.key, id, url: spec.url })
      await new Promise((resolve) => setTimeout(resolve, 400))
    }

    overviewCache = null
    const overview = await fetchOverviewLive(key)
    overviewCache = { at: Date.now(), value: overview }
    return { created, skipped, overview }
  },
}
