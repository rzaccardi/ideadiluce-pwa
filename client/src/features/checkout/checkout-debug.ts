type DbgPhase = 'enter' | 'exit' | 'skip' | 'schedule' | 'api' | 'error' | 'state'

type CallWindow = { count: number; firstAt: number; lastAt: number }

const LOOP_WINDOW_MS = 3_000
const LOOP_THRESHOLD = 5

let seq = 0

const callWindows = new Map<string, CallWindow>()

function isEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_CHECKOUT_DEBUG === 'false') return false
  if (process.env.NEXT_PUBLIC_CHECKOUT_DEBUG === 'true') return true
  return process.env.NODE_ENV === 'development'
}

function now() {
  return new Date().toISOString().slice(11, 23)
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

  dump() {
    return {
      seq,
      loops: Object.fromEntries(callWindows.entries()),
    }
  },

  reset() {
    seq = 0
    callWindows.clear()
    console.info('[checkout] debug counters reset')
  },
}

if (typeof window !== 'undefined' && isEnabled()) {
  console.info(
    '%c[checkout] debug attivo — filtra la console con "checkout". Comandi: __checkoutDebug.dump(), __checkoutDebug.reset()',
    'color:#60a5fa;font-weight:bold',
  )
  ;(window as Window & { __checkoutDebug?: typeof checkoutDbg }).__checkoutDebug = checkoutDbg
} else if (typeof window !== 'undefined') {
  ;(window as Window & { __checkoutDebug?: typeof checkoutDbg }).__checkoutDebug = checkoutDbg
}
