/**
 * Stesso Postgres del BFF, schema dedicato `hub` (evita conflitti su `_prisma_migrations` con il server).
 */
export function hubDatabaseUrl(databaseUrl: string): string {
  const url = new URL(databaseUrl)
  url.searchParams.set('schema', 'hub')
  return url.toString()
}
