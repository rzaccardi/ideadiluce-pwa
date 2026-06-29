import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { envMock } = vi.hoisted(() => ({
  envMock: {
    RECAPTCHA_ENABLED: true,
    RECAPTCHA_SECRET_KEY: 'test-secret',
    RECAPTCHA_SCORE_THRESHOLD: 0.5,
  },
}))

vi.mock('../config/env.js', () => ({
  env: envMock,
}))

import { isRecaptchaEnabled, verifyRecaptchaToken } from './recaptcha.js'
import { AppError } from '../types/errors.js'

describe('recaptcha', () => {
  beforeEach(() => {
    envMock.RECAPTCHA_ENABLED = true
    envMock.RECAPTCHA_SECRET_KEY = 'test-secret'
    envMock.RECAPTCHA_SCORE_THRESHOLD = 0.5
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('isRecaptchaEnabled when flag and secret are set', () => {
    expect(isRecaptchaEnabled()).toBe(true)
    envMock.RECAPTCHA_ENABLED = false
    expect(isRecaptchaEnabled()).toBe(false)
  })

  it('skips verification when disabled', async () => {
    envMock.RECAPTCHA_ENABLED = false
    await expect(verifyRecaptchaToken(undefined)).resolves.toBeUndefined()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rejects missing token when enabled', async () => {
    await expect(verifyRecaptchaToken('')).rejects.toMatchObject<Partial<AppError>>({
      code: 'RECAPTCHA_REQUIRED',
      statusCode: 400,
    })
  })

  it('accepts valid v3 token from Google', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({ success: true, score: 0.9, action: 'login' }),
    } as Response)

    await expect(verifyRecaptchaToken('valid-token', '127.0.0.1', 'login')).resolves.toBeUndefined()
    expect(fetch).toHaveBeenCalledWith(
      'https://www.google.com/recaptcha/api/siteverify',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('rejects low score', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({ success: true, score: 0.1, action: 'login' }),
    } as Response)

    await expect(verifyRecaptchaToken('token', undefined, 'login')).rejects.toMatchObject<
      Partial<AppError>
    >({
      code: 'RECAPTCHA_FAILED',
      statusCode: 400,
    })
  })

  it('rejects action mismatch', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({ success: true, score: 0.9, action: 'register' }),
    } as Response)

    await expect(verifyRecaptchaToken('token', undefined, 'login')).rejects.toMatchObject<
      Partial<AppError>
    >({
      code: 'RECAPTCHA_FAILED',
      statusCode: 400,
    })
  })

  it('rejects invalid token from Google', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }),
    } as Response)

    await expect(verifyRecaptchaToken('bad-token')).rejects.toMatchObject<Partial<AppError>>({
      code: 'RECAPTCHA_FAILED',
      statusCode: 400,
    })
  })
})
