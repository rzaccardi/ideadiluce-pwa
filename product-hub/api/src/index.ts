export {
  PrismaClient,
  ExternalSystem,
  type Product,
  type ProductStatus,
} from '../generated/hub-client/index.js'
export { hubPrisma } from './prisma.js'
export { normalizeWooContent, normalizeWooExcerpt } from './normalize-woo-content.js'
