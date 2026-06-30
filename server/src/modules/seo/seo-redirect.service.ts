import { prisma } from '../../lib/prisma.js'

function normalizePath(path: string): string {
  const trimmed = path.trim()
  if (!trimmed) return '/'
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withSlash.length > 1 && withSlash.endsWith('/') ? withSlash.slice(0, -1) : withSlash
}

export async function findSeoRedirect(fromPath: string) {
  const normalized = normalizePath(fromPath)
  return prisma.seoRedirect.findUnique({ where: { fromPath: normalized } })
}

export async function upsertSeoRedirect(input: {
  fromPath: string
  toPath: string
  statusCode?: number
  reason?: string | null
}) {
  const fromPath = normalizePath(input.fromPath)
  const toPath = normalizePath(input.toPath)
  return prisma.seoRedirect.upsert({
    where: { fromPath },
    create: {
      fromPath,
      toPath,
      statusCode: input.statusCode ?? 301,
      reason: input.reason ?? null,
    },
    update: {
      toPath,
      statusCode: input.statusCode ?? 301,
      reason: input.reason ?? null,
    },
  })
}

export async function listSeoRedirects() {
  return prisma.seoRedirect.findMany({ orderBy: { createdAt: 'desc' } })
}

export async function listSeoRedirectsPage(page = 1, pageSize = 50) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
  const safeSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.min(Math.floor(pageSize), 200) : 50
  const skip = (safePage - 1) * safeSize
  const [items, total] = await Promise.all([
    prisma.seoRedirect.findMany({ orderBy: { createdAt: 'desc' }, skip, take: safeSize }),
    prisma.seoRedirect.count(),
  ])
  const totalPages = Math.max(1, Math.ceil(total / safeSize))
  return {
    items,
    page: safePage,
    pageSize: safeSize,
    total,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
  }
}

export async function deleteSeoRedirect(fromPath: string) {
  const normalized = normalizePath(fromPath)
  return prisma.seoRedirect.delete({ where: { fromPath: normalized } }).catch(() => null)
}
