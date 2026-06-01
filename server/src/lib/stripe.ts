import Stripe from 'stripe'
import { env } from '../config/env.js'

let client: Stripe | null = null

export function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY?.trim()) {
    throw new Error('STRIPE_SECRET_KEY non configurata')
  }
  if (!client) {
    client = new Stripe(env.STRIPE_SECRET_KEY.trim())
  }
  return client
}

export function isStripeConfigured(): boolean {
  return Boolean(env.STRIPE_ENABLED && env.STRIPE_SECRET_KEY?.trim())
}
