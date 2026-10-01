import { describe, expect, it } from 'vitest'
import { changePasswordSchema, patchMeSchema } from './users.validators.js'

describe('patchMeSchema', () => {
  it('accetta patch senza email', () => {
    expect(patchMeSchema.safeParse({ firstName: 'Mario' }).success).toBe(true)
  })

  it('accetta email valida', () => {
    const parsed = patchMeSchema.safeParse({ email: 'nuovo@example.com' })
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data.email).toBe('nuovo@example.com')
  })

  it('rifiuta email non valida', () => {
    expect(patchMeSchema.safeParse({ email: 'not-an-email' }).success).toBe(false)
  })

  it('trimma gli spazi intorno all’email', () => {
    const parsed = patchMeSchema.safeParse({ email: '  nuovo@example.com  ' })
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data.email).toBe('nuovo@example.com')
  })
})

describe('changePasswordSchema', () => {
  it('richiede password attuale e nuova di almeno 8 caratteri', () => {
    expect(
      changePasswordSchema.safeParse({ currentPassword: 'old', newPassword: 'short' }).success,
    ).toBe(false)
    expect(
      changePasswordSchema.safeParse({ currentPassword: 'oldpass', newPassword: 'longenough' })
        .success,
    ).toBe(true)
  })
})
