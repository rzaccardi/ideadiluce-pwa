import { describe, expect, it } from 'vitest'
import { loginBodySchema, registerBodySchema } from './auth.validators.js'

describe('registerBodySchema', () => {
  it('accetta registrazione privato (retail) senza campi azienda', () => {
    const result = registerBodySchema.safeParse({
      email: 'privato@example.com',
      password: 'password1',
      firstName: 'Mario',
      lastName: 'Rossi',
      customerSegment: 'retail',
    })
    expect(result.success).toBe(true)
  })

  it('accetta business con companyName e vatNumber', () => {
    const result = registerBodySchema.safeParse({
      email: 'azienda@example.com',
      password: 'password1',
      customerSegment: 'business',
      companyName: 'TLB Italy Srl',
      vatNumber: 'IT17245551001',
    })
    expect(result.success).toBe(true)
  })

  it('richiede companyName e vatNumber per business', () => {
    const missingBoth = registerBodySchema.safeParse({
      email: 'azienda@example.com',
      password: 'password1',
      customerSegment: 'business',
    })
    expect(missingBoth.success).toBe(false)
    if (!missingBoth.success) {
      const paths = missingBoth.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('companyName')
      expect(paths).toContain('vatNumber')
    }

    const missingVat = registerBodySchema.safeParse({
      email: 'azienda@example.com',
      password: 'password1',
      customerSegment: 'business',
      companyName: 'TLB Italy Srl',
    })
    expect(missingVat.success).toBe(false)
    if (!missingVat.success) {
      expect(missingVat.error.issues.some((i) => i.path.join('.') === 'vatNumber')).toBe(true)
    }
  })

  it('rifiuta vatNumber troppo corto', () => {
    const result = registerBodySchema.safeParse({
      email: 'azienda@example.com',
      password: 'password1',
      customerSegment: 'business',
      companyName: 'TLB',
      vatNumber: 'IT12',
    })
    expect(result.success).toBe(false)
  })
})

describe('loginBodySchema', () => {
  it('richiede email valida e password non vuota', () => {
    expect(loginBodySchema.safeParse({ email: 'bad', password: 'x' }).success).toBe(false)
    expect(loginBodySchema.safeParse({ email: 'ok@example.com', password: '' }).success).toBe(false)
    expect(loginBodySchema.safeParse({ email: 'ok@example.com', password: 'x' }).success).toBe(true)
  })
})
