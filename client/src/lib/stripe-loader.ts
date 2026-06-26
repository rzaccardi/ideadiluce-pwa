import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { api } from '@/api/endpoints'
import { getStripePublishableKey } from '@/lib/env'

const stripePromises = new Map<string, Promise<Stripe | null>>()
let remotePublishableKeyPromise: Promise<string | null> | null = null

export async function resolvePublishableKey(explicit?: string | null): Promise<string | null> {
  const envKey = getStripePublishableKey()
  if (envKey) return envKey
  if (explicit) return explicit

  if (!remotePublishableKeyPromise) {
    remotePublishableKeyPromise = api.payments
      .stripeConfig()
      .then((config) => config.publishableKey)
      .catch(() => null)
  }

  return remotePublishableKeyPromise
}

export function getStripePromise(publishableKey: string): Promise<Stripe | null> {
  const cached = stripePromises.get(publishableKey)
  if (cached) return cached

  const promise = loadStripe(publishableKey)
  stripePromises.set(publishableKey, promise)
  return promise
}

/** Avvia il download di Stripe.js il prima possibile (es. all'ingresso nel checkout). */
export function preloadStripe(publishableKey?: string | null): void {
  void resolvePublishableKey(publishableKey).then((key) => {
    if (key) getStripePromise(key)
  })
}

export async function resolveStripePromise(
  publishableKey?: string | null,
): Promise<Promise<Stripe | null> | null> {
  const key = await resolvePublishableKey(publishableKey)
  return key ? getStripePromise(key) : null
}
