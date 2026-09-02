import type { Request } from 'express'
import type { Prisma } from '@prisma/client'
import type { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { env } from '../../config/env.js'
import { parseHubLocale } from '../../lib/hub-locale.js'
import {
  classifyPathKind,
  classifyReferrer,
  internalHostsFromSiteUrls,
  isBotUserAgent,
  isProbePath,
  normalizeNotFoundPath,
  normalizeQueryString,
  type NotFoundPathKind,
  type NotFoundReferrerKind,
} from './not-found.normalize.js'
import type {
  notFoundAdminHitsQuerySchema,
  notFoundAdminListQuerySchema,
  notFoundEventBodySchema,
} from './not-found.validators.js'

export type NotFoundHitDTO = {
  id: string
  path: string
  queryString: string | null
  referrer: string | null
  referrerHost: string | null
  referrerKind: string
  locale: string
  isBot: boolean
  isProbe: boolean
  pathKind: string
  createdAt: string
}

export type NotFoundPathRowDTO = {
  path: string
  pathKind: string
  hits: number
  firstSeenAt: string
  lastSeenAt: string
  withReferrerHits: number
  internalHits: number
  topReferrers: Array<{ referrer: string | null; referrerKind: string; count: number }>
  redirect: { fromPath: string; toPath: string; statusCode: number } | null
}

export type NotFoundStatsDTO = {
  days: number
  totalHits: number
  uniquePaths: number
  withReferrerHits: number
  internalHits: number
  legacyHits: number
  botHits: number
  probeHits: number
  maxDaily: number
  topPaths: Array<{ path: string; pathKind: string; hits: number; lastSeenAt: string }>
  byPathKind: Array<{ pathKind: string; count: number }>
  byReferrerKind: Array<{ referrerKind: string; count: number }>
  topReferrerHosts: Array<{ host: string; count: number }>
  dailyTrend: Array<{ date: string; count: number }>
}

function siteInternalHosts() {
  return internalHostsFromSiteUrls([env.APP_PUBLIC_URL, env.PUBLIC_SITE_URL, env.CHECKOUT_REDIRECT_BASE])
}

function mapHit(row: {
  id: string
  path: string
  queryString: string | null
  referrer: string | null
  referrerHost: string | null
  referrerKind: string
  locale: string
  isBot: boolean
  isProbe: boolean
  pathKind: string
  createdAt: Date
}): NotFoundHitDTO {
  return {
    id: row.id,
    path: row.path,
    queryString: row.queryString,
    referrer: row.referrer,
    referrerHost: row.referrerHost,
    referrerKind: row.referrerKind,
    locale: row.locale,
    isBot: row.isBot,
    isProbe: row.isProbe,
    pathKind: row.pathKind,
    createdAt: row.createdAt.toISOString(),
  }
}

function sinceDate(days: number) {
  return new Date(Date.now() - days * 86400000)
}

function buildWhere(input: {
  days: number
  hideBots: boolean
  hideProbes: boolean
  q?: string
  referrerKind?: string
  pathKind?: string
  path?: string
}): Prisma.NotFoundHitWhereInput {
  return {
    createdAt: { gte: sinceDate(input.days) },
    ...(input.hideBots ? { isBot: false } : {}),
    ...(input.hideProbes ? { isProbe: false } : {}),
    ...(input.referrerKind && input.referrerKind !== 'all'
      ? { referrerKind: input.referrerKind }
      : {}),
    ...(input.pathKind && input.pathKind !== 'all' ? { pathKind: input.pathKind } : {}),
    ...(input.path ? { path: input.path } : {}),
    ...(input.q?.trim()
      ? {
          OR: [
            { path: { contains: input.q.trim(), mode: 'insensitive' } },
            { referrer: { contains: input.q.trim(), mode: 'insensitive' } },
          ],
        }
      : {}),
  }
}

export const notFoundEventsService = {
  async record(req: Request, body: z.infer<typeof notFoundEventBodySchema>) {
    const path = normalizeNotFoundPath(body.path)
    if (!path) return { recorded: false as const }

    const userAgent = req.headers['user-agent']?.slice(0, 500) ?? null
    const isBot = isBotUserAgent(userAgent)
    const isProbe = isProbePath(path)
    const pathKind = classifyPathKind(path)
    const classified = classifyReferrer(
      body.referrer || (typeof req.headers.referer === 'string' ? req.headers.referer : null),
      siteInternalHosts(),
    )

    const row = await prisma.notFoundHit.create({
      data: {
        path,
        queryString: normalizeQueryString(body.queryString),
        referrer: classified.referrer,
        referrerHost: classified.referrerHost,
        referrerKind: classified.referrerKind,
        locale: parseHubLocale(body.locale ?? 'IT'),
        isBot,
        isProbe,
        pathKind,
        userId: req.sessionRecord?.userId ?? null,
        sessionId: req.sessionRecord?.id ?? null,
        userAgent,
      },
    })

    return { recorded: true as const, id: row.id }
  },
}

export const notFoundAdminService = {
  async getStats(days: number, hideBots: boolean, hideProbes: boolean): Promise<NotFoundStatsDTO> {
    const where = buildWhere({ days, hideBots, hideProbes })

    const [totalHits, pathGroups, kindGroups, referrerGroups, hostGroups, botCount, probeCount, trendRows] =
      await Promise.all([
        prisma.notFoundHit.count({ where }),
        prisma.notFoundHit.groupBy({
          by: ['path'],
          where,
          _count: { _all: true },
          _max: { createdAt: true },
        }),
        prisma.notFoundHit.groupBy({
          by: ['pathKind'],
          where,
          _count: { _all: true },
        }),
        prisma.notFoundHit.groupBy({
          by: ['referrerKind'],
          where,
          _count: { _all: true },
        }),
        prisma.notFoundHit.groupBy({
          by: ['referrerHost'],
          where: { ...where, referrerHost: { not: null } },
          _count: { _all: true },
        }),
        prisma.notFoundHit.count({ where: { ...where, isBot: true } }),
        prisma.notFoundHit.count({ where: { ...where, isProbe: true } }),
        prisma.notFoundHit.findMany({
          where,
          select: { createdAt: true },
        }),
      ])

    const uniquePaths = pathGroups.length
    const topPaths = [...pathGroups]
      .sort((a, b) => b._count._all - a._count._all)
      .slice(0, 15)
      .map((row) => ({
        path: row.path,
        pathKind: classifyPathKind(row.path),
        hits: row._count._all,
        lastSeenAt: row._max.createdAt?.toISOString() ?? sinceDate(days).toISOString(),
      }))

    const referrerMap = new Map(referrerGroups.map((row) => [row.referrerKind, row._count._all]))
    const withReferrerHits =
      (referrerMap.get('internal') ?? 0) +
      (referrerMap.get('legacy') ?? 0) +
      (referrerMap.get('external') ?? 0)

    const dayCounts = new Map<string, number>()
    for (const row of trendRows) {
      const day = row.createdAt.toISOString().slice(0, 10)
      dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1)
    }
    const dailyTrend = [...dayCounts.entries()]
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
    const maxDaily = dailyTrend.reduce((max, row) => Math.max(max, row.count), 0)

    return {
      days,
      totalHits,
      uniquePaths,
      withReferrerHits,
      internalHits: referrerMap.get('internal') ?? 0,
      legacyHits: referrerMap.get('legacy') ?? 0,
      botHits: hideBots ? 0 : botCount,
      probeHits: hideProbes ? 0 : probeCount,
      maxDaily,
      topPaths,
      byPathKind: kindGroups
        .map((row) => ({ pathKind: row.pathKind, count: row._count._all }))
        .sort((a, b) => b.count - a.count),
      byReferrerKind: referrerGroups
        .map((row) => ({ referrerKind: row.referrerKind, count: row._count._all }))
        .sort((a, b) => b.count - a.count),
      topReferrerHosts: hostGroups
        .filter((row): row is typeof row & { referrerHost: string } => Boolean(row.referrerHost))
        .map((row) => ({ host: row.referrerHost, count: row._count._all }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      dailyTrend,
    }
  },

  async list(query: z.infer<typeof notFoundAdminListQuerySchema>) {
    const where = buildWhere(query)
    const skip = (query.page - 1) * query.pageSize

    const [pathGroups, allPathGroups] = await Promise.all([
      prisma.notFoundHit.groupBy({
        by: ['path'],
        where,
        _count: { _all: true },
        _max: { createdAt: true },
        _min: { createdAt: true },
        orderBy: { _count: { path: 'desc' } },
        skip,
        take: query.pageSize,
      }),
      prisma.notFoundHit.groupBy({
        by: ['path'],
        where,
        _count: { _all: true },
      }),
    ])

    const total = allPathGroups.length
    const paths = pathGroups.map((row) => row.path)

    const [kindRows, referrerRows, redirectRows] = paths.length
      ? await Promise.all([
          prisma.notFoundHit.groupBy({
            by: ['path', 'pathKind'],
            where: { ...where, path: { in: paths } },
            _count: { _all: true },
          }),
          prisma.notFoundHit.groupBy({
            by: ['path', 'referrer', 'referrerKind'],
            where: { ...where, path: { in: paths } },
            _count: { _all: true },
          }),
          prisma.seoRedirect.findMany({
            where: { fromPath: { in: paths } },
            select: { fromPath: true, toPath: true, statusCode: true },
          }),
        ])
      : [[], [], []]

    const pathKindByPath = new Map<string, { pathKind: string; count: number }>()
    for (const row of kindRows) {
      const current = pathKindByPath.get(row.path)
      if (!current || row._count._all > current.count) {
        pathKindByPath.set(row.path, { pathKind: row.pathKind, count: row._count._all })
      }
    }

    const referrersByPath = new Map<string, Array<{ referrer: string | null; referrerKind: string; count: number }>>()
    const withReferrerByPath = new Map<string, number>()
    const internalByPath = new Map<string, number>()
    for (const row of referrerRows) {
      const list = referrersByPath.get(row.path) ?? []
      list.push({
        referrer: row.referrer,
        referrerKind: row.referrerKind,
        count: row._count._all,
      })
      referrersByPath.set(row.path, list)
      if (row.referrerKind !== 'none') {
        withReferrerByPath.set(row.path, (withReferrerByPath.get(row.path) ?? 0) + row._count._all)
      }
      if (row.referrerKind === 'internal') {
        internalByPath.set(row.path, (internalByPath.get(row.path) ?? 0) + row._count._all)
      }
    }

    const redirectByPath = new Map(redirectRows.map((row) => [row.fromPath, row]))

    const items: NotFoundPathRowDTO[] = pathGroups.map((row) => {
      const topReferrers = (referrersByPath.get(row.path) ?? [])
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
      return {
        path: row.path,
        pathKind: pathKindByPath.get(row.path)?.pathKind ?? classifyPathKind(row.path),
        hits: row._count._all,
        firstSeenAt: row._min.createdAt?.toISOString() ?? sinceDate(query.days).toISOString(),
        lastSeenAt: row._max.createdAt?.toISOString() ?? sinceDate(query.days).toISOString(),
        withReferrerHits: withReferrerByPath.get(row.path) ?? 0,
        internalHits: internalByPath.get(row.path) ?? 0,
        topReferrers,
        redirect: redirectByPath.get(row.path) ?? null,
      }
    })

    return {
      items,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    }
  },

  async listHits(query: z.infer<typeof notFoundAdminHitsQuerySchema>) {
    const path = normalizeNotFoundPath(query.path) ?? query.path
    const where = buildWhere({ ...query, path })
    const skip = (query.page - 1) * query.pageSize

    const [total, rows, referrerGroups, redirect] = await Promise.all([
      prisma.notFoundHit.count({ where }),
      prisma.notFoundHit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.pageSize,
      }),
      prisma.notFoundHit.groupBy({
        by: ['referrer', 'referrerKind', 'referrerHost'],
        where,
        _count: { _all: true },
      }),
      prisma.seoRedirect.findUnique({
        where: { fromPath: path },
        select: { fromPath: true, toPath: true, statusCode: true, reason: true },
      }),
    ])

    const pathKind = (rows[0]?.pathKind ?? classifyPathKind(path)) as NotFoundPathKind
    const referrers = referrerGroups
      .map((row) => ({
        referrer: row.referrer,
        referrerHost: row.referrerHost,
        referrerKind: row.referrerKind as NotFoundReferrerKind,
        count: row._count._all,
      }))
      .sort((a, b) => b.count - a.count)

    return {
      path,
      pathKind,
      hits: total,
      redirect,
      referrers,
      items: rows.map(mapHit),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    }
  },
}
