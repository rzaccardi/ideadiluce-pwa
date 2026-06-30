/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_STOREFRONT_URL?: string
  readonly VITE_ADMIN_DEV_EMAIL?: string
  readonly VITE_ADMIN_DEV_PASSWORD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
