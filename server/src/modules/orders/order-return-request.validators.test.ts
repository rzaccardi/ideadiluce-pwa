import { describe, expect, it } from 'vitest'
import { orderReturnRequestBodySchema } from './order-return-request.validators.js'

describe('orderReturnRequestBodySchema', () => {
  it('accetta body vuoto', () => {
    expect(orderReturnRequestBodySchema.parse({})).toEqual({})
  })

  it('trimma le note', () => {
    expect(orderReturnRequestBodySchema.parse({ notes: '  reso  ', locale: 'IT' })).toEqual({
      notes: 'reso',
      locale: 'IT',
    })
  })

  it('rifiuta note troppo lunghe', () => {
    expect(() => orderReturnRequestBodySchema.parse({ notes: 'x'.repeat(2001) })).toThrow()
  })
})
