import { config, parse } from 'dotenv'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { hubDatabaseUrl } from '@ideadiluce/hub-api/hub-database-url'

const serverRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const repoRoot = path.join(serverRoot, '..')

config({ path: path.join(repoRoot, '.env') })

const nodeEnvEarly = process.env.NODE_ENV ?? 'development'
const dbUrlMissing = !process.env.DATABASE_URL?.trim()
if (dbUrlMissing && nodeEnvEarly !== 'production') {
  config({ path: path.join(repoRoot, '.env.example') })
}
/** Se `.env` definisce `DATABASE_URL=` vuoto, dotenv non lo sovrascrive con `.env.example`. */
if (!process.env.DATABASE_URL?.trim() && nodeEnvEarly !== 'production') {
  try {
    const examplePath = path.join(repoRoot, '.env.example')
    const fromExample = parse(readFileSync(examplePath, 'utf8')).DATABASE_URL?.trim()
    if (fromExample) process.env.DATABASE_URL = fromExample
  } catch {
    /* .env.example assente */
  }
}

const boolish = z.preprocess((v) => {
  if (v === true) return true
  if (v === false || v === undefined || v === null || v === '') return false
  const s = String(v).toLowerCase()
  return s === 'true' || s === '1' || s === 'yes'
}, z.boolean())

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1),
  /** Catalogo da Product Hub (dump Woo importato). Se true e dati presenti, ha priorità su Odoo. */
  HUB_CATALOG_ENABLED: boolish.default(true),
  /** Default: stesso host/db del BFF, schema Postgres `hub`. */
  HUB_DATABASE_URL: z.string().optional(),
  SESSION_COOKIE_NAME: z.string().default('sid'),
  SESSION_DAYS: z.coerce.number().default(30),
  /** Attiva chiamate reali verso Odoo via XML-RPC (Odoo 18). */
  ODOO_ENABLED: boolish.default(false),
  /** Origine Odoo incluso path deploy (es. https://host/odoo). Ha priorità su `ODOO_BASE_URL`. */
  ODOO_URL: z.string().optional(),
  /**
   * Base usata solo per XML-RPC (es. `https://host` senza `/odoo`) quando il sito è sotto path
   * ma la RPC ufficiale è alla radice `/xmlrpc/2/…`. Se assente si usa `ODOO_URL` (con fallback path root lato client).
   */
  ODOO_XMLRPC_URL: z.string().optional(),
  /** @deprecated Usare `ODOO_URL`. Mantenuto per compatibilità temporanea. */
  ODOO_BASE_URL: z.string().optional(),
  ODOO_DB: z.string().optional(),
  ODOO_USERNAME: z.string().optional(),
  ODOO_PASSWORD: z.string().optional(),
  /** @deprecated Solo per eventuale JSON-2 Odoo 19+ — non usato dall’implementazione XML-RPC attuale. */
  ODOO_API_KEY: z.string().optional(),
  ODOO_TIMEOUT_MS: z.coerce.number().default(25_000),
  /**
   * Domain (JSON) per product.template/search_read (array Odoo domain).
   * Esempio: [["is_published","=",true]] oppure [["sale_ok","=",true]]
   */
  ODOO_PRODUCT_DOMAIN: z.string().optional(),
  /** Domain (JSON) per product.category/search_read */
  ODOO_CATEGORY_DOMAIN: z.string().optional(),
  /** Lingua contesto catalogo Odoo (es. it_IT). */
  ODOO_CATALOG_LANG: z.string().default('it_IT'),
  CHECKOUT_REDIRECT_BASE: z.string().optional(),
  /** Provider PWA checkout: Nexi/PayPal sono opzionali finché non configurati. */
  NEXI_ENABLED: boolish.default(false),
  NEXI_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
  NEXI_API_KEY: z.string().optional(),
  NEXI_TERMINAL_ID: z.string().optional(),
  NEXI_CHECKOUT_BASE_URL: z.string().optional(),
  PAYPAL_ENABLED: boolish.default(false),
  PAYPAL_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_CHECKOUT_BASE_URL: z.string().optional(),
  BANK_TRANSFER_HOLDER: z.string().optional(),
  BANK_TRANSFER_IBAN: z.string().optional(),
  BANK_TRANSFER_BANK_NAME: z.string().optional(),
  STRIPE_ENABLED: boolish.default(false),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  /** Token per API admin spedizioni (`X-Admin-Token`). */
  ADMIN_API_TOKEN: z.string().optional(),
  DHL_ENABLED: boolish.default(false),
  DHL_SANDBOX: boolish.default(true),
  DHL_API_KEY: z.string().optional(),
  DHL_API_SECRET: z.string().optional(),
  DHL_ACCOUNT_NUMBER: z.string().optional(),
  DHL_API_BASE_URL: z.string().optional(),
  DHL_SHIPPER_POSTAL_CODE: z.string().optional(),
  DHL_SHIPPER_CITY: z.string().optional(),
  DHL_SHIPPER_COUNTRY: z.string().optional(),
  FEDEX_ENABLED: boolish.default(false),
  FEDEX_CLIENT_ID: z.string().optional(),
  FEDEX_CLIENT_SECRET: z.string().optional(),
  FEDEX_ACCOUNT_NUMBER: z.string().optional(),
  FEDEX_API_BASE_URL: z.string().optional(),
  FEDEX_SHIPPER_POSTAL_CODE: z.string().optional(),
  FEDEX_SHIPPER_CITY: z.string().optional(),
  FEDEX_SHIPPER_COUNTRY: z.string().optional(),
  /** Chiave 32+ caratteri per cifrare credenziali corrieri in DB (consigliato in produzione). */
  SHIPPING_CREDENTIALS_KEY: z.string().optional(),
  /**
   * Se valorizzato, richiede header `X-Integrations-Token` per `/api/v1/integrations/*`.
   * Se assente, si usano le stesse regole di `requireLogin`.
   */
  INTEGRATIONS_TOKEN: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

export const env: Env = envSchema.parse(process.env)

if (!process.env.HUB_DATABASE_URL?.trim()) {
  process.env.HUB_DATABASE_URL = hubDatabaseUrl(env.DATABASE_URL)
}
