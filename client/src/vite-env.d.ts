/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base del backend (es. http://localhost:4000). Priorità su VITE_API_BASE_URL. */
  readonly VITE_API_URL: string | undefined
  readonly VITE_API_BASE_URL: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
