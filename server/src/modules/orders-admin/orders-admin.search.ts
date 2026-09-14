import type { Prisma } from '@prisma/client'

export function parseAdminOrdersSearch(q: string): {
  term: string
  odooSaleOrderId: number | null
  pwaOrderId: string | null
} {
  const term = q.trim()
  const compact = term.replace(/\s+/g, '')

  const idl = /^#?IDL-\d{4}-(\d+)$/i.exec(compact)
  if (idl) {
    const id = Number(idl[1])
    return {
      term,
      odooSaleOrderId: Number.isInteger(id) && id > 0 ? id : null,
      pwaOrderId: null,
    }
  }

  const hashed = /^#(\d+)$/.exec(compact)
  if (hashed) {
    const id = Number(hashed[1])
    return {
      term,
      odooSaleOrderId: Number.isInteger(id) && id > 0 ? id : null,
      pwaOrderId: null,
    }
  }

  if (/^\d{1,10}$/.test(compact)) {
    const id = Number(compact)
    return {
      term,
      odooSaleOrderId: Number.isInteger(id) && id > 0 ? id : null,
      pwaOrderId: null,
    }
  }

  if (/^c[a-z0-9]{20,}$/i.test(term)) {
    return { term, odooSaleOrderId: null, pwaOrderId: term }
  }

  return { term, odooSaleOrderId: null, pwaOrderId: null }
}

export function buildPwaOrderSearchWhere(q: string): Prisma.PwaOrderWhereInput {
  const parsed = parseAdminOrdersSearch(q)
  const or: Prisma.PwaOrderWhereInput[] = [
    { email: { contains: parsed.term, mode: 'insensitive' } },
    { clientOrderRef: { contains: parsed.term, mode: 'insensitive' } },
    { odooSaleOrderName: { contains: parsed.term, mode: 'insensitive' } },
    {
      user: {
        is: {
          OR: [
            { firstName: { contains: parsed.term, mode: 'insensitive' } },
            { lastName: { contains: parsed.term, mode: 'insensitive' } },
          ],
        },
      },
    },
  ]
  if (parsed.pwaOrderId) or.push({ id: parsed.pwaOrderId })
  if (parsed.odooSaleOrderId != null) or.push({ odooSaleOrderId: parsed.odooSaleOrderId })
  return { OR: or }
}

export function odooListSearchTerm(q: string | undefined): string | undefined {
  const term = q?.trim()
  if (!term || term.includes('@')) return undefined
  const parsed = parseAdminOrdersSearch(term)
  if (parsed.odooSaleOrderId != null) return String(parsed.odooSaleOrderId)
  return term
}
