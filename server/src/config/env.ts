import { config, parse } from 'dotenv'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const serverRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const repoRoot = path.join(serverRoot, '..')

config({ path: path.join(repoRoot, '.env'), override: true })

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
  PORT: z.coerce.number().default(4100),
  CLIENT_ORIGIN: z.string().default('http://localhost:5273'),
  /** Origine Vite del backoffice admin (:5274). */
  ADMIN_ORIGIN: z.string().default('http://localhost:5274'),
  ADMIN_SESSION_COOKIE_NAME: z.string().default('admin_sid'),
  ADMIN_SESSION_DAYS: z.coerce.number().default(7),
  DATABASE_URL: z.string().min(1),
  /** Catalogo storefront: Odoo REST API v2 (website PWA su tlbdb.odoo.com, modulo tlb_idl_ecommerce). */
  ODOO_CATALOG_ENABLED: boolish.default(false),
  /** Host Odoo (es. https://tlbdb.odoo.com). */
  ODOO_CATALOG_BASE_URL: z.string().optional(),
  /** Bearer token API key (es. «PWA Platform»). */
  ODOO_CATALOG_API_KEY: z.string().optional(),
  /** ID website Odoo PWA (= 2). */
  ODOO_WEBSITE_ID: z.coerce.number().default(2),
  ODOO_CATALOG_TIMEOUT_MS: z.coerce.number().default(25_000),
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
  /** ID azione menu Odoo per aprire `product.template` nel client web (es. `497` → `/odoo/action-497/{id}`). */
  ODOO_PRODUCT_ACTION_ID: z.coerce.number().default(497),
  /** Domain (JSON) per product.category/search_read */
  ODOO_CATEGORY_DOMAIN: z.string().optional(),
  /** Lingua contesto catalogo Odoo (es. it_IT). */
  ODOO_CATALOG_LANG: z.string().default('it_IT'),
  /** ID listino Odoo B2C (`product.pricelist`). */
  ODOO_PRICELIST_B2C_ID: z.coerce.number().optional(),
  /** ID listino Odoo B2B (`product.pricelist`). */
  ODOO_PRICELIST_B2B_ID: z.coerce.number().optional(),
  /** ID listino Odoo professional (`product.pricelist`). */
  ODOO_PRICELIST_PROFESSIONAL_ID: z.coerce.number().optional(),
  /** SMTP per email transazionali (reset password, ecc.). */
  SMTP_ENABLED: boolish.default(false),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
  /** URL base PWA per link nelle email (es. https://shop.ideadiluce.it). */
  APP_PUBLIC_URL: z.string().optional(),
  PASSWORD_RESET_TOKEN_HOURS: z.coerce.number().default(24),
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
  /** Chiave pubblica Stripe (pk_*) — esposta al client via /payments/stripe/config se assente nel build. */
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  /** @deprecated Usare login backoffice (`AdminUser`). Mantenuto solo per compatibilità script. */
  ADMIN_API_TOKEN: z.string().optional(),
  /** Credenziali seed utente backoffice (solo `db:seed`). */
  ADMIN_SEED_EMAIL: z.string().email().default('admin@ideadiluce.local'),
  ADMIN_SEED_PASSWORD: z.string().min(8).default('admin123456'),
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
  /** URL pubblico PWA per sitemap / Merchant / llms (es. https://shop.ideadiluce.it). */
  PUBLIC_SITE_URL: z.string().default('https://shop.ideadiluce.it'),
  /** Fase 2: URL pubblico piattaforma tecnica (es. https://www.rfly.com). */
  TECHNICAL_SITE_URL: z.string().optional(),
  /** Fase 2: website Odoo dedicato al catalogo tecnico (default: ODOO_WEBSITE_ID). */
  TECHNICAL_ODOO_WEBSITE_ID: z.coerce.number().optional(),
  /** Meta tag google-site-verification per Search Console. */
  GOOGLE_SITE_VERIFICATION: z.string().optional(),
  /** Feed "Marco *** ha acquistato …" da storico ordini unificato (PWA + Odoo). */
  SOCIAL_PROOF_ENABLED: boolish.default(true),
  SOCIAL_PROOF_LOOKBACK_DAYS: z.coerce.number().default(30),
  SOCIAL_PROOF_MAX_EVENTS: z.coerce.number().default(12),
  /** Svuota il carrello dopo N minuti dall'ultima modifica righe (allineamento stock). */
  CART_RESERVATION_ENABLED: boolish.default(true),
  CART_RESERVATION_MINUTES: z.coerce.number().default(30),
  /** Salta controllo stock su add/patch carrello (solo test/CI quando Odoo staging non ha varianti acquistabili). */
  CART_SKIP_STOCK_CHECK: boolish.default(false),
  /** Sede ritiro in negozio (label e indirizzo unificati). */
  STORE_PICKUP_LABEL: z.string().optional(),
  STORE_PICKUP_LINE1: z.string().optional(),
  STORE_PICKUP_POSTAL_CODE: z.string().optional(),
  STORE_PICKUP_CITY: z.string().optional(),
  STORE_PICKUP_COUNTRY: z.string().optional(),
  /** Autocomplete indirizzi checkout — Google ha priorità su Mapbox. */
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  MAPBOX_ACCESS_TOKEN: z.string().optional(),
  /** DigitalOcean Spaces (S3-compatible) per media catalogo caricati dall’admin. */
  SPACES_KEY: z.string().optional(),
  SPACES_SECRET: z.string().optional(),
  SPACES_BUCKET: z.string().optional(),
  SPACES_ENDPOINT: z.string().optional(),
  SPACES_CDN_URL: z.string().optional(),
  SPACES_REGION: z.string().default('fra1'),
  /** Minuti dopo paidAt prima di inviare alert email per PAID_SYNC_PENDING. */
  PAID_SYNC_ALERT_MINUTES: z.coerce.number().default(15),
  /** Destinatario email alert sync Odoo (se assente: solo log + banner BO). */
  PAID_SYNC_ALERT_EMAIL: z.string().email().optional(),
  /** Aggiornamento automatico query ricerca Home da Odoo (prodotti più acquistati). */
  SEARCH_HINTS_AUTO_SYNC_ENABLED: boolish.default(true),
  SEARCH_HINTS_STALE_HOURS: z.coerce.number().default(72),
  SEARCH_HINTS_LOOKBACK_DAYS: z.coerce.number().default(90),
  SEARCH_HINTS_LIMIT: z.coerce.number().default(8),
})

export type Env = z.infer<typeof envSchema>

export const env: Env = envSchema.parse(process.env)
