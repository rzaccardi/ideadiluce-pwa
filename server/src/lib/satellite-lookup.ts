import { prisma } from './prisma.js'
import { AppError } from '../types/errors.js'

/** Risolve odooPartnerId da id satellite (cuid) o da partner già numerico. */
export async function resolveOdooPartnerId(satelliteOrPartner: string | number): Promise<number> {
  if (typeof satelliteOrPartner === 'number') return satelliteOrPartner
  const row = await prisma.customerSatellite.findUnique({
    where: { id: satelliteOrPartner },
    select: { odooPartnerId: true },
  })
  if (!row) {
    throw new AppError('USER_NOT_FOUND', 'User not found', 'Utente non trovato.', 404, false)
  }
  return row.odooPartnerId
}

export async function findSatelliteByIdOrPartner(idOrPartner: string | number) {
  if (typeof idOrPartner === 'number') {
    return prisma.customerSatellite.findUnique({ where: { odooPartnerId: idOrPartner } })
  }
  return prisma.customerSatellite.findUnique({ where: { id: idOrPartner } })
}
