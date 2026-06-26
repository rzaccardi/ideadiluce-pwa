/**
 * Smoke test PAID_SYNC alert: ordine fittizio + processDueAlerts.
 * Uso: npx tsx scripts/paid-sync-alert-smoke.ts
 */
import { prisma } from '../src/lib/prisma.js'
import { paidSyncAlertService } from '../src/modules/orders-admin/paid-sync-alert.service.js'

async function main() {
  const id = `sprint1-paid-sync-test-${Date.now()}`
  const cartId = `smoke-cart-${id}`
  const paidAt = new Date(Date.now() - 20 * 60_000)

  await prisma.cart.create({
    data: { id: cartId, status: 'CONVERTED' },
  })

  await prisma.pwaOrder.create({
    data: {
      id,
      cartId,
      email: 'paid-sync-test@example.com',
      orderStatus: 'PAID_SYNC_PENDING',
      paymentStatus: 'CAPTURED',
      paidAt,
      amountTotal: 9999,
      currencyCode: 'EUR',
      odooLastSyncStatus: 'PENDING',
    },
  })

  const pending = await paidSyncAlertService.listPendingForAdmin()
  const hasTest = pending.items.some((i) => i.id === id)
  console.log('listPendingForAdmin count=%d hasTest=%s', pending.count, hasTest)

  const result = await paidSyncAlertService.processDueAlerts()
  console.log('processDueAlerts', result)

  const after = await prisma.pwaOrder.findUnique({
    where: { id },
    select: { paidSyncAlertSentAt: true },
  })
  console.log('paidSyncAlertSentAt', after?.paidSyncAlertSentAt?.toISOString() ?? null)

  await prisma.pwaOrder.delete({ where: { id } })
  await prisma.cart.delete({ where: { id: cartId } })
  console.log('OK — ordine test rimosso')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
