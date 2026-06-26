import { isStripeConfigured } from './stripe.js'

export function getStripePublishableKey(): string | null {
  const fromEnv =
    process.env.STRIPE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ||
    process.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim() ||
    null
  return fromEnv || null
}

export function getStripeClientConfig() {
  return {
    enabled: isStripeConfigured(),
    publishableKey: getStripePublishableKey(),
  }
}

/** Checkout Session client secrets possono contenere caratteri URL-encoded. */
export function decodeStripeClientSecret(clientSecret: string): string {
  const trimmed = clientSecret.trim()
  if (!trimmed.includes('%')) return trimmed
  try {
    return decodeURIComponent(trimmed)
  } catch {
    return trimmed
  }
}
