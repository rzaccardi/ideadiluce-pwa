import { env } from '../config/env.js'
import { AppError } from '../types/errors.js'

export const RECAPTCHA_ACTIONS = {
  login: 'login',
  register: 'register',
  adminLogin: 'admin_login',
} as const

export type RecaptchaAction = (typeof RECAPTCHA_ACTIONS)[keyof typeof RECAPTCHA_ACTIONS]

type RecaptchaVerifyResponse = {
  success: boolean
  score?: number
  action?: string
  challenge_ts?: string
  hostname?: string
  'error-codes'?: string[]
}

export function isRecaptchaEnabled(): boolean {
  return env.RECAPTCHA_ENABLED && Boolean(env.RECAPTCHA_SECRET_KEY?.trim())
}

export async function verifyRecaptchaToken(
  token: string | undefined,
  remoteIp?: string,
  expectedAction?: RecaptchaAction,
): Promise<void> {
  if (!isRecaptchaEnabled()) return

  const trimmed = token?.trim()
  if (!trimmed) {
    throw new AppError(
      'RECAPTCHA_REQUIRED',
      'reCAPTCHA token missing',
      'Verifica di sicurezza non riuscita. Riprova.',
      400,
      false,
    )
  }

  const params = new URLSearchParams({
    secret: env.RECAPTCHA_SECRET_KEY!,
    response: trimmed,
  })
  if (remoteIp?.trim()) {
    params.set('remoteip', remoteIp.trim())
  }

  let data: RecaptchaVerifyResponse
  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    })
    data = (await res.json()) as RecaptchaVerifyResponse
  } catch {
    throw new AppError(
      'RECAPTCHA_UNAVAILABLE',
      'reCAPTCHA verification failed',
      'Verifica anti-bot temporaneamente non disponibile. Riprova tra poco.',
      503,
      true,
    )
  }

  if (!data.success) {
    throw new AppError(
      'RECAPTCHA_FAILED',
      'reCAPTCHA verification rejected',
      'Verifica anti-bot non superata. Riprova.',
      400,
      false,
      data['error-codes'],
    )
  }

  if (expectedAction && data.action !== expectedAction) {
    throw new AppError(
      'RECAPTCHA_FAILED',
      'reCAPTCHA action mismatch',
      'Verifica anti-bot non superata. Riprova.',
      400,
      false,
      { expectedAction, action: data.action },
    )
  }

  if (typeof data.score === 'number' && data.score < env.RECAPTCHA_SCORE_THRESHOLD) {
    throw new AppError(
      'RECAPTCHA_FAILED',
      'reCAPTCHA score below threshold',
      'Verifica anti-bot non superata. Riprova.',
      400,
      false,
      { score: data.score, threshold: env.RECAPTCHA_SCORE_THRESHOLD },
    )
  }
}
