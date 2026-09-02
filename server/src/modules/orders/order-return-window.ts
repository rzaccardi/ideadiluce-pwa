import type { OrderReturnWindowDTO } from '../../types/dto.js'

const ROME = 'Europe/Rome'
const RETURN_DAYS = 14

export const OPEN_RETURN_WINDOW: OrderReturnWindowDTO = {
  eligible: true,
  reason: 'not_delivered',
  deliveredAt: null,
  expiresAt: null,
  daysRemaining: null,
}

function ymdInRome(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ROME,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function addCalendarDays(ymd: string, days: number): string {
  const [year, month, day] = ymd.split('-').map(Number)
  const next = new Date(Date.UTC(year, month - 1, day + days))
  return next.toISOString().slice(0, 10)
}

function weekdayUtcYmd(ymd: string): number {
  const [year, month, day] = ymd.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

/** Se il termine cade di sabato o domenica, slitta al lunedì successivo. */
export function extendToNextWeekday(ymd: string): string {
  let cursor = ymd
  let weekday = weekdayUtcYmd(cursor)
  while (weekday === 0 || weekday === 6) {
    cursor = addCalendarDays(cursor, 1)
    weekday = weekdayUtcYmd(cursor)
  }
  return cursor
}

export function returnWindowExpiresOn(deliveredAt: Date): string {
  return extendToNextWeekday(addCalendarDays(ymdInRome(deliveredAt), RETURN_DAYS))
}

export type ReturnWindowReason = 'open' | 'not_delivered' | 'expired'

export type ReturnWindow = {
  eligible: boolean
  reason: ReturnWindowReason
  deliveredAt: string | null
  expiresAt: string | null
  daysRemaining: number | null
}

function diffYmd(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)
  const fromUtc = Date.UTC(fy, fm - 1, fd)
  const toUtc = Date.UTC(ty, tm - 1, td)
  return Math.round((toUtc - fromUtc) / 86_400_000)
}

export function computeReturnWindow(
  deliveredAtIso: string | null | undefined,
  now = new Date(),
): ReturnWindow {
  if (!deliveredAtIso) {
    return {
      eligible: true,
      reason: 'not_delivered',
      deliveredAt: null,
      expiresAt: null,
      daysRemaining: null,
    }
  }
  const deliveredAt = new Date(deliveredAtIso)
  if (Number.isNaN(deliveredAt.getTime())) {
    return {
      eligible: true,
      reason: 'not_delivered',
      deliveredAt: null,
      expiresAt: null,
      daysRemaining: null,
    }
  }

  const expiresOn = returnWindowExpiresOn(deliveredAt)
  const today = ymdInRome(now)
  const remaining = diffYmd(today, expiresOn)
  const eligible = remaining >= 0

  return {
    eligible,
    reason: eligible ? 'open' : 'expired',
    deliveredAt: deliveredAt.toISOString(),
    expiresAt: `${expiresOn}T21:59:59.000Z`,
    daysRemaining: eligible ? remaining : 0,
  }
}
