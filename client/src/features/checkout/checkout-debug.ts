type DbgPhase = 'enter' | 'exit' | 'skip' | 'schedule' | 'api' | 'error' | 'state' | 'race'

type CallWindow = { count: number; firstAt: number; lastAt: number }

type InFlightEntry = {
  id: number
  name: string
  via?: string
  startedAt: number
  stack?: string
}

const LOOP_WINDOW_MS = 3_000
const LOOP_THRESHOLD = 5

let seq = 0

const callWindows = new Map<string, CallWindow>()
const inFlight = new Map<string, InFlightEntry[]>()

function isEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_CHECKOUT_DEBUG === 'false') return false
  if (process.env.NEXT_PUBLIC_CHECKOUT_DEBUG === 'true') return true
  return process.env.NODE_ENV === 'development'
}

function now() {
  return new Date().toISOString().slice(11, 23)
}

function captureStack(skipFrames = 2): string | undefined {
  if (!isEnabled()) return undefined
  const raw = new Error().stack
  if (!raw) return undefined
  return raw
    .split('\n')
    .slice(skipFrames, skipFrames + 8)
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
}

function trackLoop(key: string) {
  const t = Date.now()
  const prev = callWindows.get(key)
  if (!prev || t - prev.firstAt > LOOP_WINDOW_MS) {
    callWindows.set(key, { count: 1, firstAt: t, lastAt: t })
    return
  }
  prev.count += 1
  prev.lastAt = t
  if (prev.count === LOOP_THRESHOLD) {
    console.warn(
      `%c[checkout] ⚠ possibile loop: "${key}" chiamato ${prev.count} volte in ${LOOP_WINDOW_MS}ms`,
      'color:#f59e0b;font-weight:bold',
      { firstAt: new Date(prev.firstAt).toISOString(), lastAt: new Date(prev.lastAt).toISOString() },
    )
  } else if (prev.count > LOOP_THRESHOLD && prev.count % 5 === 0) {
    console.warn(`%c[checkout] ⚠ loop continua: "${key}" ×${prev.count}`, 'color:#f59e0b;font-weight:bold')
  }
}

function phaseStyle(phase: DbgPhase): string {
  switch (phase) {
    case 'enter':
      return 'color:#60a5fa'
    case 'exit':
      return 'color:#34d399'
    case 'skip':
      return 'color:#9ca3af'
    case 'schedule':
      return 'color:#c084fc'
    case 'api':
      return 'color:#fbbf24'
    case 'error':
      return 'color:#f87171'
    case 'state':
      return 'color:#a78bfa'
    case 'race':
      return 'color:#fb923c;font-weight:bold'
    default:
      return 'color:#e5e7eb'
  }
}

function log(phase: DbgPhase, label: string, data?: unknown) {
  if (!isEnabled()) return
  const id = ++seq
  const style = phaseStyle(phase)
  const prefix = `%c[checkout #${id}] ${now()} ${phase.toUpperCase()} ${label}`
  if (data === undefined) {
    console.log(prefix, style)
  } else {
    console.log(prefix, style, data)
  }
}

export const checkoutDbg = {
  enabled: isEnabled,

  fn(name: string, phase: DbgPhase, data?: unknown) {
    if (!isEnabled()) return
    if (phase === 'enter') trackLoop(name)
    log(phase, name, data)
  },

  effect(name: string, data?: unknown) {
    if (!isEnabled()) return
    trackLoop(`effect:${name}`)
    log('enter', `useEffect:${name}`, data)
  },

  schedule(name: string, delayMs: number, data?: unknown) {
    this.fn(name, 'schedule', { delayMs, ...((data && typeof data === 'object') ? data : { detail: data }) })
  },

  api(name: string, data?: unknown) {
    this.fn(name, 'api', data)
  },

  state(label: string, data?: unknown) {
    this.fn(label, 'state', data)
  },

  /** Avvia tracking di una chiamata in-flight; avvisa se ne parte una seconda in parallelo. */
  beginInFlight(name: string, meta?: { via?: string; detail?: unknown }) {
    if (!isEnabled()) return -1
    const id = ++seq
    const entry: InFlightEntry = {
      id,
      name,
      via: meta?.via,
      startedAt: Date.now(),
      stack: captureStack(3),
    }
    const list = inFlight.get(name) ?? []
    list.push(entry)
    inFlight.set(name, list)

    const payload = {
      via: meta?.via,
      inFlight: list.length,
      detail: meta?.detail,
      peers: list.map((e) => ({
        id: e.id,
        via: e.via,
        ageMs: Date.now() - e.startedAt,
      })),
      stack: entry.stack,
    }

    if (list.length > 1) {
      console.warn(
        `%c[checkout #${id}] ${now()} RACE ${name} — ${list.length} chiamate in parallelo`,
        phaseStyle('race'),
        payload,
      )
    } else {
      log('enter', `${name} (in-flight)`, payload)
    }

    return id
  },

  endInFlight(name: string, token: number, meta?: { via?: string; detail?: unknown; error?: string }) {
    if (!isEnabled() || token < 0) return
    const list = inFlight.get(name) ?? []
    const next = list.filter((e) => e.id !== token)
    if (next.length === 0) inFlight.delete(name)
    else inFlight.set(name, next)

    log(meta?.error ? 'error' : 'exit', `${name} (in-flight done)`, {
      via: meta?.via,
      remaining: next.length,
      detail: meta?.detail,
      error: meta?.error,
    })
  },

  dump() {
    return {
      seq,
      loops: Object.fromEntries(callWindows.entries()),
      inFlight: Object.fromEntries(
        [...inFlight.entries()].map(([name, entries]) => [
          name,
          entries.map((e) => ({
            id: e.id,
            via: e.via,
            ageMs: Date.now() - e.startedAt,
            stack: e.stack,
          })),
        ]),
      ),
    }
  },

  reset() {
    seq = 0
    callWindows.clear()
    inFlight.clear()
    console.info('[checkout] debug counters reset')
  },
}

if (typeof window !== 'undefined' && isEnabled()) {
  console.info(
    '%c[checkout] debug attivo - filtra la console con "checkout" o "RACE". Comandi: __checkoutDebug.dump(), __checkoutDebug.reset()',
    'color:#60a5fa;font-weight:bold',
  )
  ;(window as Window & { __checkoutDebug?: typeof checkoutDbg }).__checkoutDebug = checkoutDbg
} else if (typeof window !== 'undefined') {
  ;(window as Window & { __checkoutDebug?: typeof checkoutDbg }).__checkoutDebug = checkoutDbg
}
