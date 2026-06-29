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

  const { seedDefaultTaxRules } = await import('../src/modules/tax/tax.admin.routes.js')
  await seedDefaultTaxRules()

  await prisma.socialProofSettings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      enabled: true,
      minQuantity: 1,
      lookbackDays: 30,
      maxEvents: 12,
      odooImportEnabled: false,
    },
    update: {},
  })

  const adminEmail = (process.env.ADMIN_SEED_EMAIL ?? 'admin@ideadiluce.local').toLowerCase()
  const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? 'admin123456'
  const adminPasswordHash = bcrypt.hashSync(adminPassword, 10)

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      displayName: 'Amministratore',
      status: 'ACTIVE',
    },
    update: {
      passwordHash: adminPasswordHash,
      displayName: 'Amministratore',
      status: 'ACTIVE',
    },
  })

  console.info('Seed OK:', {
    shopUser: { email, password: 'password123' },
    adminUser: { email: adminEmail, password: adminPassword },
  })

  const { seedSitePages } = await import('../src/modules/site/site.service.js')
  await seedSitePages()
  console.info('Site pages seeded')
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    void prisma.$disconnect()
    process.exit(1)
  })
