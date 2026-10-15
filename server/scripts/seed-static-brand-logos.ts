/**
 * Registra in CatalogBrand i JPG di client/public/brands come logo light.
 * Uso: npx tsx scripts/seed-static-brand-logos.ts (da server/, con env root).
 */
import { brandsAdminService } from '../src/modules/brands-admin/brands-admin.service.js'

async function main() {
  const result = await brandsAdminService.seedStaticLogos()
  console.info('Static brand logos seeded:', result)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
