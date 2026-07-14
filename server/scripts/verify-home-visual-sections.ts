import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const row = await prisma.sitePage.findUnique({
    where: { pageKey_locale: { pageKey: 'home', locale: 'IT' } },
  })
  const content = row?.content as {
    rooms?: { items?: Array<{ title: string; imageUrl?: string }>; title?: string }
    designShowcase?: { title?: string; searchQuery?: string; productCount?: number }
  }

  console.log(
    JSON.stringify(
      {
        published: row?.published,
        roomsCount: content?.rooms?.items?.length ?? 0,
        roomsTitle: content?.rooms?.title,
        designTitle: content?.designShowcase?.title,
        designQuery: content?.designShowcase?.searchQuery,
        productCount: content?.designShowcase?.productCount,
        firstRoom: content?.rooms?.items?.[0],
      },
      null,
      2,
    ),
  )
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error)
    void prisma.$disconnect()
    process.exit(1)
  })
