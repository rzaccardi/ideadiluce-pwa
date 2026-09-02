import { AppError } from '../../types/errors.js'

const UPTIMEROBOT_API = 'https://api.uptimerobot.com/v2'
const FETCH_TIMEOUT_MS = 20_000

export type UptimeRobotStat = 'ok' | 'fail'

export type UptimeRobotErrorBody = {
  type?: string
  message?: string
}

export type UptimeRobotAccount = {
  email?: string
  monitor_limit?: number
  monitor_interval?: number
  up_monitors?: number
  down_monitors?: number
  paused_monitors?: number
}

export type UptimeRobotLog = {
  type?: number
  datetime?: number
  duration?: number
  reason?: { code?: string; detail?: string } | string
}

export type UptimeRobotSsl = {
  brand?: string
  product?: string
  expires?: number
}

export type UptimeRobotMonitor = {
  id: number
  friendly_name?: string
  url?: string
  type?: number
  status?: number
  interval?: number
  keyword_value?: string
  custom_uptime_ratio?: string
  all_time_uptime_ratio?: string
  average_response_time?: number | string
  last_check?: number | string
  logs?: UptimeRobotLog[]
  ssl?: UptimeRobotSsl
}

export type UptimeRobotPsp = {
  id: number
  friendly_name?: string
  standard_url?: string
  custom_url?: string
  status?: number
}

type UptimeRobotBaseResponse = {
  stat?: UptimeRobotStat
  error?: UptimeRobotErrorBody
}

export type GetAccountDetailsResponse = UptimeRobotBaseResponse & {
  account?: UptimeRobotAccount
}

export type GetMonitorsResponse = UptimeRobotBaseResponse & {
  pagination?: { offset: number; limit: number; total: number }
  monitors?: UptimeRobotMonitor[]
}

export type GetPspsResponse = UptimeRobotBaseResponse & {
  psps?: UptimeRobotPsp[]
}

export type NewMonitorResponse = UptimeRobotBaseResponse & {
  monitor?: { id: number; status?: number }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function failFromBody(body: UptimeRobotBaseResponse | null, fallback: string): AppError {
  const message = body?.error?.message?.trim() || fallback
  const type = body?.error?.type?.trim() || ''
  const readOnly =
    /read.?only/i.test(message) ||
    /read.?only/i.test(type) ||
    (type === 'invalid_api_key' && /read/i.test(message))
  if (readOnly) {
    return new AppError(
      'UPTIMEROBOT_READ_ONLY',
      message,
      'La chiave UptimeRobot è in sola lettura. Per creare i monitor serve la Main API Key (read-write) da Integrations & API.',
      403,
      false,
    )
  }
  if (/invalid.?api.?key/i.test(message) || type === 'invalid_api_key') {
    return new AppError(
      'UPTIMEROBOT_INVALID_KEY',
      message,
      'Chiave API UptimeRobot non valida. Controlla UPTIMEROBOT_API_KEY sul componente api.',
      502,
      true,
    )
  }
  return new AppError(
    'UPTIMEROBOT_ERROR',
    message,
    `UptimeRobot ha rifiutato la richiesta: ${message}`,
    502,
    true,
  )
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function postForm<T extends UptimeRobotBaseResponse>(
  apiKey: string,
  method: string,
  extra: Record<string, string | number> = {},
  attempt = 0,
): Promise<T> {
  const body = new URLSearchParams()
  body.set('api_key', apiKey)
  body.set('format', 'json')
  for (const [key, value] of Object.entries(extra)) {
    body.set(key, String(value))
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(`${UPTIMEROBOT_API}/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body,
      signal: controller.signal,
    })
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError'
    throw new AppError(
      aborted ? 'UPTIMEROBOT_TIMEOUT' : 'UPTIMEROBOT_UNAVAILABLE',
      e instanceof Error ? e.message : String(e),
      aborted
        ? 'UptimeRobot non ha risposto in tempo. Riprova tra qualche secondo.'
        : 'Impossibile raggiungere l’API UptimeRobot.',
      502,
      true,
    )
  } finally {
    clearTimeout(timer)
  }

  if (res.status === 429 && attempt < 2) {
    const retryAfter = Number(res.headers.get('retry-after'))
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 8_000
    await sleep(waitMs)
    return postForm<T>(apiKey, method, extra, attempt + 1)
  }

  const json: unknown = await res.json().catch(() => null)
  const parsed = asRecord(json) as T | null
  if (!res.ok || !parsed || parsed.stat !== 'ok') {
    throw failFromBody(parsed, `HTTP ${res.status}`)
  }
  return parsed
}

export const uptimeRobotClient = {
  getAccountDetails(apiKey: string) {
    return postForm<GetAccountDetailsResponse>(apiKey, 'getAccountDetails')
  },

  async getAllMonitors(apiKey: string): Promise<UptimeRobotMonitor[]> {
    const monitors: UptimeRobotMonitor[] = []
    let offset = 0
    const limit = 50
    for (;;) {
      const page = await postForm<GetMonitorsResponse>(apiKey, 'getMonitors', {
        offset,
        limit,
        logs: 1,
        logs_limit: 8,
        ssl: 1,
        custom_uptime_ratios: '7-30',
        all_time_uptime_ratio: 1,
        response_times: 1,
        response_times_limit: 3,
      })
      const batch = page.monitors ?? []
      monitors.push(...batch)
      const total = page.pagination?.total ?? batch.length
      offset += batch.length
      if (batch.length === 0 || offset >= total) break
    }
    return monitors
  },

  async getPsps(apiKey: string): Promise<UptimeRobotPsp[]> {
    try {
      const page = await postForm<GetPspsResponse>(apiKey, 'getPSPs')
      return page.psps ?? []
    } catch {
      return []
    }
  },

  newMonitor(
    apiKey: string,
    input: {
      friendlyName: string
      url: string
      type: 1 | 2
      interval: number
      keywordValue?: string
    },
  ) {
    const extra: Record<string, string | number> = {
      friendly_name: input.friendlyName,
      url: input.url,
      type: input.type,
      interval: input.interval,
      timeout: 30,
    }
    if (input.type === 2 && input.keywordValue) {
      extra.keyword_type = 1
      extra.keyword_value = input.keywordValue
    }
    return postForm<NewMonitorResponse>(apiKey, 'newMonitor', extra)
  },
}
