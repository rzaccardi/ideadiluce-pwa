import { prisma } from './prisma.js'

/**
 * Alloca un odooPartnerId sintetico negativo per path locale (ODOO_ENABLED=false).
 * Gli id Odoo reali sono positivi; i negativi restano riservati al satellite locale.
 */
export async function allocateLocalPartnerId(): Promise<number> {
  const agg = await prisma.customerSatellite.aggregate({
    _min: { odooPartnerId: true },
  })
  const min = agg._min.odooPartnerId
  if (min == null || min >= 0) return -1
  return min - 1
}
