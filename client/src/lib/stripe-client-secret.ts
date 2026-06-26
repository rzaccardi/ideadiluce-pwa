/** Checkout Session secrets possono arrivare URL-encoded (%2F → /). */
export function normalizeStripeClientSecret(clientSecret: string): string {
  const trimmed = clientSecret.trim()
  if (!trimmed.includes('%')) return trimmed
  try {
    return decodeURIComponent(trimmed)
  } catch {
    return trimmed
  }
}
