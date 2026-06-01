import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'demo@example.com'
  const passwordHash = bcrypt.hashSync('password123', 10)

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      firstName: 'Demo',
      lastName: 'Utente',
      phone: '+39000000000',
      status: 'ACTIVE',
    },
    update: { firstName: 'Demo', lastName: 'Utente' },
  })

  await prisma.odooCustomerMap.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      odooPartnerId: 99001,
      syncStatus: 'SYNCED',
    },
    update: { syncStatus: 'SYNCED' },
  })

  await prisma.orderCache.upsert({
    where: { id: 'seed-order-1' },
    create: {
      id: 'seed-order-1',
      userId: user.id,
      odooSaleOrderId: 50001,
      status: 'sale',
      paymentStatus: 'paid',
      currencyCode: 'EUR',
      totalAmount: 129_00,
      snapshotJson: { note: 'seed' },
    },
    update: {},
  })

  const { seedDefaultShippingZones } = await import('../src/modules/shipping/shipping.admin.routes.js')
  await seedDefaultShippingZones()

  console.info('Seed OK:', { email, password: 'password123' })
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    void prisma.$disconnect()
    process.exit(1)
  })
