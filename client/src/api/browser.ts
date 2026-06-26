import { createApiClient } from '@/api/request'
import { getBrowserApiBase } from '@/lib/env'

/** Browser fetch — in dev usa path relativi (rewrite Next.js), in prod URL assoluto. */
export const apiClient = createApiClient(getBrowserApiBase())

export const API_BASE = getBrowserApiBase()
