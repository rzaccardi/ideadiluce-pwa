export function isDev(): boolean {
  return process.env.NODE_ENV === 'development'
}

export function getPublicApiUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.VITE_API_URL ??
    process.env.VITE_API_BASE_URL ??
    'http://localhost:4000'
  )
}

export function getServerApiUrl(): string {
  return (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.VITE_API_URL ??
    process.env.VITE_API_BASE_URL ??
    'http://localhost:4000'
  )
}

export function getBrowserApiBase(): string {
  return isDev() ? '' : getPublicApiUrl()
}

export function getStripePublishableKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ||
    process.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim() ||
    undefined
  )
}

export function getIntegrationsToken(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_INTEGRATIONS_TOKEN?.trim() ||
    process.env.VITE_INTEGRATIONS_TOKEN?.trim() ||
    undefined
  )
}

export function getGoogleMapsApiKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ||
    undefined
  )
}

export function getMapboxAccessToken(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ||
    process.env.VITE_MAPBOX_ACCESS_TOKEN?.trim() ||
    undefined
  )
}

export function getArflyMediaBaseUrl(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_ARFLY_MEDIA_BASE_URL?.trim() ||
    process.env.VITE_ARFLY_MEDIA_BASE_URL?.trim() ||
    undefined
  )
}

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173')
  )
}

export function getGoogleSiteVerification(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || undefined
}
