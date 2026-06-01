import type { NextFunction, Request, Response } from 'express'
import type { ZodSchema } from 'zod'

type Schemas = {
  body?: ZodSchema
  query?: ZodSchema
  params?: ZodSchema
}

export function validateRequest(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body) as Request['body']
      if (schemas.query) req.query = schemas.query.parse(req.query) as Request['query']
      if (schemas.params) req.params = schemas.params.parse(req.params) as Request['params']
      next()
    } catch (e) {
      next(e)
    }
  }
}
