import type { NextFunction, Request, Response } from 'express'
import { isPrivateApiPath } from '../lib/private-api-paths.js'

const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
} as const

/** Impedisce cache CDN/browser su carrello, checkout e dati utente. */
export function noStorePrivateApi(req: Request, res: Response, next: NextFunction) {
  const path = `${req.baseUrl}${req.path}`
  if (!isPrivateApiPath(path)) {
    next()
    return
  }

  res.set(NO_STORE_HEADERS)
  res.vary('Cookie')
  next()
}
