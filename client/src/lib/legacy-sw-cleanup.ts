/** Rimuove service worker Workbox (ex app Vite) rimasti nel browser. */
export async function cleanupLegacyServiceWorkers(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false

  const registrations = await navigator.serviceWorker.getRegistrations()
  if (registrations.length === 0) return false

  await Promise.all(registrations.map((registration) => registration.unregister()))

  if ('caches' in window) {
    const keys = await caches.keys()
    await Promise.all(
      keys
        .filter((key) => key.includes('workbox') || key.includes('precache'))
        .map((key) => caches.delete(key)),
    )
  }

  return true
}
