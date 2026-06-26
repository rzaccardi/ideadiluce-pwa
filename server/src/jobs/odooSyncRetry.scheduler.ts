import { processOdooSyncRetryQueue } from './odooSyncRetry.job.js'

const INTERVAL_MS = 5 * 60 * 1000

let timer: ReturnType<typeof setInterval> | null = null
let running = false

export function startOdooSyncRetryScheduler(): void {
  if (timer) return
  timer = setInterval(() => {
    if (running) return
    running = true
    void processOdooSyncRetryQueue()
      .catch(() => {
        /* logged in job */
      })
      .finally(() => {
        running = false
      })
  }, INTERVAL_MS)
  timer.unref?.()
}

export function stopOdooSyncRetryScheduler(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
