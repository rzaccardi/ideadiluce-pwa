import type { Request } from 'express'
import type { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { parseHubLocale } from '../../lib/hub-locale.js'
import { sanitizeCatalogSearchQuery } from '../catalog/catalog-search-guard.js'
import type { catalogSearchEventBodySchema } from './catalog-search-events.validators.js'

function normalizeQuery(query: string): string {
  return sanitizeCatalogSearchQuery(query)?.toLowerCase() ?? query.trim().toLowerCase()
}

export type CatalogSearchEventDTO = {
  id: string
  query: string
  normalizedQuery: string
  locale: string
  source: string
  action: string
  resultCount: number | null
  productTotal: number | null
  clickedPath: string | null
  clickedKind: string | null
  clickedLabel: string | null
  userId: string | null
  sessionId: string | null
  createdAt: string
}

function mapRow(row: {
  id: string
  query: string
  normalizedQuery: string
  locale: string
  source: string
  action: string
  resultCount: number | null
  productTotal: number | null
  clickedPath: string | null
  clickedKind: string | null
  clickedLabel: string | null
  userId: string | null
  sessionId: string | null
  createdAt: Date
}): CatalogSearchEventDTO {
  return {
    id: row.id,
    query: row.query,
    normalizedQuery: row.normalizedQuery,
    locale: row.locale,
    source: row.source,
    action: row.action,
    resultCount: row.resultCount,
    productTotal: row.productTotal,
    clickedPath: row.clickedPath,
    clickedKind: row.clickedKind,
    clickedLabel: row.clickedLabel,
    userId: row.userId,
    sessionId: row.sessionId,
    createdAt: row.createdAt.toISOString(),
  }
}

export const catalogSearchEventsService = {
  async record(req: Request, body: z.infer<typeof catalogSearchEventBodySchema>) {
    const sanitized = sanitizeCatalogSearchQuery(body.query)
    if (!sanitized) return { recorded: false as const }

    const locale = parseHubLocale(body.locale ?? 'IT')
    const row = await prisma.catalogSearchEvent.create({
      data: {
        query: sanitized,
        normalizedQuery: normalizeQuery(sanitized),
        locale,
        source: body.source,
        action: body.action,
        resultCount: body.resultCount ?? null,
        productTotal: body.productTotal ?? null,
        clickedPath: body.clickedPath?.trim() || null,
        clickedKind: body.clickedKind ?? null,
        clickedLabel: body.clickedLabel?.trim() || null,
        userId: req.sessionRecord?.userId ?? null,
        sessionId: req.sessionRecord?.id ?? null,
        userAgent: req.headers['user-agent']?.slice(0, 500) ?? null,
      },
    })

    return { recorded: true as const, id: row.id }
  },
}

export const searchAnalyticsAdminService = {
  async list(query: {
    page: number
    pageSize: number
    days: number
    q?: string
    locale?: string
    source?: string
    action?: string
  }) {
    const since = new Date(Date.now() - query.days * 86400000)
    const q = query.q?.trim()

    const where = {
      createdAt: { gte: since },
      ...(query.locale ? { locale: query.locale } : {}),
      ...(query.source ? { source: query.source } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(q
        ? {
            OR: [
              { query: { contains: q, mode: 'insensitive' as const } },
              { clickedLabel: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const skip = (query.page - 1) * query.pageSize
    const [total, rows] = await Promise.all([
      prisma.catalogSearchEvent.count({ where }),
      prisma.catalogSearchEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.pageSize,
      }),
    ])

    return {
      items: rows.map(mapRow),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    }
  },

  async getStats(days: number, locale?: string) {
    const since = new Date(Date.now() - days * 86400000)
    const where = {
      createdAt: { gte: since },
      ...(locale ? { locale } : {}),
    }

    const rows = await prisma.catalogSearchEvent.findMany({
      where,
      select: {
        normalizedQuery: true,
        query: true,
        locale: true,
        source: true,
        action: true,
        resultCount: true,
        productTotal: true,
        createdAt: true,
      },
    })

    const totalEvents = rows.length
    const uniqueQueries = new Set(rows.map((r) => r.normalizedQuery)).size
    const submitEvents = rows.filter((r) => r.action === 'submit' || r.action === 'view_all')
    const zeroResultSubmits = submitEvents.filter(
      (r) => (r.productTotal ?? r.resultCount ?? 0) === 0,
    ).length
    const zeroResultRate =
      submitEvents.length > 0 ? Math.round((zeroResultSubmits / submitEvents.length) * 100) : 0
    const pickEvents = rows.filter((r) => r.action === 'suggest_pick').length
    const pickThroughRate =
      totalEvents > 0 ? Math.round((pickEvents / totalEvents) * 100) : 0

    const queryCounts = new Map<string, { query: string; count: number; zeroResults: number }>()
    for (const row of rows) {
      const key = row.normalizedQuery
      const current = queryCounts.get(key) ?? {
        query: row.query,
        count: 0,
        zeroResults: 0,
      }
      current.count += 1
      if (
        (row.action === 'submit' || row.action === 'view_all') &&
        (row.productTotal ?? row.resultCount ?? 0) === 0
      ) {
        current.zeroResults += 1
      }
      queryCounts.set(key, current)
    }

    const topQueries = [...queryCounts.entries()]
      .map(([normalizedQuery, value]) => ({
        normalizedQuery,
        query: value.query,
        count: value.count,
        zeroResults: value.zeroResults,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)

    const sourceCounts = new Map<string, number>()
    for (const row of rows) {
      sourceCounts.set(row.source, (sourceCounts.get(row.source) ?? 0) + 1)
    }
    const bySource = [...sourceCounts.entries()]
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)

    const localeCounts = new Map<string, number>()
    for (const row of rows) {
      localeCounts.set(row.locale, (localeCounts.get(row.locale) ?? 0) + 1)
    }
    const byLocale = [...localeCounts.entries()]
      .map(([locale, count]) => ({ locale, count }))
      .sort((a, b) => b.count - a.count)

    const dayCounts = new Map<string, number>()
    for (const row of rows) {
      const day = row.createdAt.toISOString().slice(0, 10)
      dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1)
    }
    const dailyTrend = [...dayCounts.entries()]
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const maxDaily = dailyTrend.reduce((max, row) => Math.max(max, row.count), 0)

    return {
      days,
      locale: locale ?? null,
      totalEvents,
      uniqueQueries,
      zeroResultRate,
      pickThroughRate,
      topQueries,
      bySource,
      byLocale,
      dailyTrend,
      maxDaily,
    }
  },
}
