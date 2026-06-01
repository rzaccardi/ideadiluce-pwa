import type { NextFunction, Request, Response } from 'express'
import { randomUUID } from 'node:crypto'

const HEADER = 'x-correlation-id'

export function correlationMiddleware(req: Request, res: Response, next: NextFunction) {
  const incoming = req.get(HEADER)
  const id = incoming && incoming.trim().length > 0 ? incoming.trim() : randomUUID()
  req.correlationId = id
  res.setHeader(HEADER, id)
  next()
}
