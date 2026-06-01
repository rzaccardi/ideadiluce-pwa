import { env } from '../config/env.js'
import type { Request } from 'express'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

function baseMeta(req?: Pick<Request, 'correlationId'>) {
  return req?.correlationId ? { correlationId: req.correlationId } : {}
}

function log(level: LogLevel, msg: string, meta?: Record<string, unknown>) {
  const line = { ts: new Date().toISOString(), level, msg, ...meta }
  const text = JSON.stringify(line)
  if (level === 'error') console.error(text)
  else if (level === 'warn') console.warn(text)
  else console.log(text)
}

export const logger = {
  debug(msg: string, meta?: Record<string, unknown>, req?: Pick<Request, 'correlationId'>) {
    if (env.NODE_ENV !== 'production') log('debug', msg, { ...baseMeta(req), ...meta })
  },
  info(msg: string, meta?: Record<string, unknown>, req?: Pick<Request, 'correlationId'>) {
    log('info', msg, { ...baseMeta(req), ...meta })
  },
  warn(msg: string, meta?: Record<string, unknown>, req?: Pick<Request, 'correlationId'>) {
    log('warn', msg, { ...baseMeta(req), ...meta })
  },
  error(msg: string, meta?: Record<string, unknown>, req?: Pick<Request, 'correlationId'>) {
    log('error', msg, { ...baseMeta(req), ...meta })
  },
}
