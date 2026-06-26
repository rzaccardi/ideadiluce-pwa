/**
 * Crea o aggiorna un utente backoffice.
 *
 *   npm run admin:create-user -- email@example.com "password" "Nome visualizzato"
 */
import { loadMonorepoEnv } from '../../scripts/load-monorepo-env.mjs'
import bcrypt from 'bcryptjs'

loadMonorepoEnv()
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]?.trim().toLowerCase()
  const password = process.argv[3]
  const displayName = process.argv[4]?.trim() || null

  if (!email || !password) {
    console.error(
      'Uso: npx tsx scripts/create-admin-user.ts <email> <password> [displayName]',
    )
    process.exit(1)
  }
  if (password.length < 8) {
    console.error('La password deve avere almeno 8 caratteri.')
    process.exit(1)
  }

  const passwordHash = bcrypt.hashSync(password, 10)
  const user = await prisma.adminUser.upsert({
    where: { email },
    create: { email, passwordHash, displayName, status: 'ACTIVE' },
    update: { passwordHash, displayName, status: 'ACTIVE' },
  })

  console.info('AdminUser OK:', { id: user.id, email: user.email, displayName: user.displayName })
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    void prisma.$disconnect()
    process.exit(1)
  })
