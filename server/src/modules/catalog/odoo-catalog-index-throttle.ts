/**
 * Auto-throttling per sync indice catalogo verso Odoo.sh.
 * Su 429 riduce concurrency e alza il delay; su successi ripristina lentamente.
 */

export type CatalogIndexThrottleConfig = {
  initialConcurrency: number
  minConcurrency: number
  maxConcurrency: number
  initialDelayMs: number
  minDelayMs: number
  maxDelayMs: number
}

export type CatalogIndexThrottleSnapshot = {
  concurrency: number
  delayMs: number
  rateLimitHits: number
  successStreak: number
}

const SUCCESS_STREAK_TO_RECOVER = 12

export function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.trunc(value)))
}

export function computeBackoffMs(options: {
  attempt: number
  baseDelayMs: number
  maxDelayMs: number
  retryAfterMs?: number | null
}): number {
  const { attempt, baseDelayMs, maxDelayMs, retryAfterMs } = options
  if (retryAfterMs != null && retryAfterMs > 0) {
    return clampInt(retryAfterMs, 250, maxDelayMs)
  }
  const exp = Math.min(maxDelayMs, baseDelayMs * 2 ** Math.max(0, attempt - 1))
  const jitter = Math.floor(Math.random() * Math.min(500, Math.max(50, exp * 0.1)))
  return clampInt(exp + jitter, 250, maxDelayMs)
}

export class CatalogIndexThrottle {
  private concurrency: number
  private delayMs: number
  private rateLimitHits = 0
  private successStreak = 0
  private readonly minConcurrency: number
  private readonly maxConcurrency: number
  private readonly minDelayMs: number
  private readonly maxDelayMs: number
  private readonly initialConcurrency: number
  private readonly initialDelayMs: number

  constructor(config: CatalogIndexThrottleConfig) {
    this.minConcurrency = Math.max(1, config.minConcurrency)
    this.maxConcurrency = Math.max(this.minConcurrency, config.maxConcurrency)
    this.minDelayMs = Math.max(0, config.minDelayMs)
    this.maxDelayMs = Math.max(this.minDelayMs, config.maxDelayMs)
    this.initialConcurrency = clampInt(
      config.initialConcurrency,
      this.minConcurrency,
      this.maxConcurrency,
    )
    this.initialDelayMs = clampInt(config.initialDelayMs, this.minDelayMs, this.maxDelayMs)
    this.concurrency = this.initialConcurrency
    this.delayMs = this.initialDelayMs
  }

  snapshot(): CatalogIndexThrottleSnapshot {
    return {
      concurrency: this.concurrency,
      delayMs: this.delayMs,
      rateLimitHits: this.rateLimitHits,
      successStreak: this.successStreak,
    }
  }

  currentConcurrency(): number {
    return this.concurrency
  }

  currentDelayMs(): number {
    return this.delayMs
  }

  /** Chiamata dopo una richiesta OK (lista o dettaglio). */
  onSuccess(): void {
    this.successStreak += 1
    if (this.successStreak < SUCCESS_STREAK_TO_RECOVER) return

    this.successStreak = 0
    if (this.delayMs > this.initialDelayMs) {
      this.delayMs = clampInt(Math.floor(this.delayMs * 0.75), this.initialDelayMs, this.maxDelayMs)
    } else if (this.concurrency < this.initialConcurrency) {
      this.concurrency = clampInt(this.concurrency + 1, this.minConcurrency, this.initialConcurrency)
    } else if (this.concurrency < this.maxConcurrency && this.delayMs <= this.initialDelayMs) {
      this.concurrency = clampInt(this.concurrency + 1, this.minConcurrency, this.maxConcurrency)
    }
  }

  /**
   * Chiamata su HTTP 429 (o rate-limit equivalente).
   * @returns ms di pausa consigliata prima di ritentare
   */
  onRateLimit(retryAfterMs?: number | null): number {
    this.rateLimitHits += 1
    this.successStreak = 0
    this.concurrency = this.minConcurrency
    const fromHeader =
      retryAfterMs != null && retryAfterMs > 0
        ? clampInt(retryAfterMs, this.minDelayMs || 250, this.maxDelayMs)
        : null
    const bumped = clampInt(Math.max(this.delayMs * 2, this.initialDelayMs * 2), this.minDelayMs || 250, this.maxDelayMs)
    this.delayMs = fromHeader != null ? Math.max(fromHeader, bumped) : bumped
    return this.delayMs
  }

  /** Chiamata su errori retriabili non-429 (5xx / rete). */
  onTransientError(): number {
    this.successStreak = 0
    this.delayMs = clampInt(Math.max(this.delayMs, this.initialDelayMs * 1.5), this.minDelayMs, this.maxDelayMs)
    return this.delayMs
  }
}
