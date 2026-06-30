const DEFAULT_STOREFRONT_ORIGIN = 'http://localhost:3000'

function storefrontOrigin(): string {
  const fromEnv = import.meta.env.VITE_STOREFRONT_URL?.trim()
  return (fromEnv || DEFAULT_STOREFRONT_ORIGIN).replace(/\/$/, '')
}

/** URL assoluto sul dominio storefront (shop), non sul backoffice. */
export function buildStorefrontUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${storefrontOrigin()}${normalizedPath}`
}
