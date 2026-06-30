import { describe, expect, it, vi } from 'vitest'
import type { Request, Response } from 'express'
import { loadV1Session } from './session.js'

function mockReq(path: string): Request {
  return {
    originalUrl: path,
    url: path,
    cookies: {},
  } as Request
}

describe('loadV1Session', () => {
  it('salta DB sessione su letture pubbliche senza cookie', () => {
    const next = vi.fn()
    loadV1Session(mockReq('/api/v1/catalog/bootstrap?locale=IT'), {} as Response, next)
    expect(next).toHaveBeenCalledOnce()
  })

  it('salta DB sessione su site pubblico senza cookie', () => {
    const next = vi.fn()
    loadV1Session(mockReq('/api/v1/site/pages/home?locale=IT'), {} as Response, next)
    expect(next).toHaveBeenCalledOnce()
  })
})
