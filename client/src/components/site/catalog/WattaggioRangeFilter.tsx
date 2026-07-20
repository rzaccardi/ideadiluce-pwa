'use client'

import { useEffect, useRef, useState } from 'react'
import { formatWattLabel } from '@/lib/catalog-facets-ui'
import { cn } from '@/utils/cn'

type Props = {
  /** Valori watt ordinati crescenti (da facet Odoo). */
  values: ReadonlyArray<number>
  min?: number
  max?: number
  onChange: (range: { min?: number; max?: number }) => void
  /** Debounce commit URL/API mentre si trascina. */
  commitDelayMs?: number
  tone?: 'tech' | 'design'
  className?: string
}

function nearestIndex(values: ReadonlyArray<number>, target: number): number {
  if (values.length === 0) return 0
  let best = 0
  let bestDist = Math.abs(values[0]! - target)
  for (let i = 1; i < values.length; i++) {
    const dist = Math.abs(values[i]! - target)
    if (dist < bestDist) {
      best = i
      bestDist = dist
    }
  }
  return best
}

function resolveIndices(
  values: ReadonlyArray<number>,
  min?: number,
  max?: number,
): { lo: number; hi: number } {
  const last = Math.max(0, values.length - 1)
  const lo = min == null ? 0 : nearestIndex(values, min)
  const hi = max == null ? last : nearestIndex(values, max)
  return lo <= hi ? { lo, hi } : { lo: hi, hi: lo }
}

const thumbClass =
  '[&::-webkit-slider-runnable-track]:bg-transparent [&::-moz-range-track]:bg-transparent ' +
  '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:size-4 ' +
  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 ' +
  '[&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-idl-ink [&::-webkit-slider-thumb]:shadow ' +
  '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:relative [&::-moz-range-thumb]:size-4 ' +
  '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white ' +
  '[&::-moz-range-thumb]:bg-idl-ink [&::-moz-range-thumb]:shadow'

export function WattaggioRangeFilter({
  values,
  min,
  max,
  onChange,
  commitDelayMs = 280,
  tone = 'tech',
  className,
}: Props) {
  const last = Math.max(0, values.length - 1)
  const resolved = resolveIndices(values, min, max)
  const [lo, setLo] = useState(resolved.lo)
  const [hi, setHi] = useState(resolved.hi)
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    const next = resolveIndices(values, min, max)
    setLo(next.lo)
    setHi(next.hi)
  }, [values, min, max])

  useEffect(() => {
    return () => {
      if (commitTimer.current) clearTimeout(commitTimer.current)
    }
  }, [])

  if (values.length < 2) return null

  const boundMin = values[0]!
  const boundMax = values[last]!
  const loVal = values[lo] ?? boundMin
  const hiVal = values[hi] ?? boundMax
  const isFullRange = lo === 0 && hi === last
  const pctLo = last === 0 ? 0 : (lo / last) * 100
  const pctHi = last === 0 ? 100 : (hi / last) * 100
  const fill = tone === 'design' ? 'bg-idl-brass/30' : 'bg-idl-amber/30'

  function scheduleCommit(nextLo: number, nextHi: number) {
    if (commitTimer.current) clearTimeout(commitTimer.current)
    commitTimer.current = setTimeout(() => {
      const full = nextLo === 0 && nextHi === last
      onChangeRef.current(
        full
          ? { min: undefined, max: undefined }
          : { min: values[nextLo], max: values[nextHi] },
      )
    }, commitDelayMs)
  }

  function updateLo(raw: number) {
    const nextLo = Math.min(raw, hi)
    setLo(nextLo)
    scheduleCommit(nextLo, hi)
  }

  function updateHi(raw: number) {
    const nextHi = Math.max(raw, lo)
    setHi(nextHi)
    scheduleCommit(lo, nextHi)
  }

  function clearRange() {
    if (commitTimer.current) clearTimeout(commitTimer.current)
    setLo(0)
    setHi(last)
    onChangeRef.current({ min: undefined, max: undefined })
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="font-mono text-[12px] font-semibold text-idl-ink">
            {formatWattLabel(loVal)}
            <span className="mx-1.5 font-normal text-idl-muted">–</span>
            {formatWattLabel(hiVal)}
          </div>
          <div className="mt-0.5 text-[11px] text-idl-muted">
            {isFullRange ? 'Tutti i wattaggi' : 'Range selezionato'}
          </div>
        </div>
        {!isFullRange ? (
          <button
            type="button"
            onClick={clearRange}
            className={cn(
              'shrink-0 text-[12px] font-semibold',
              tone === 'design' ? 'text-idl-brass' : 'text-idl-amber',
            )}
          >
            Azzera
          </button>
        ) : null}
      </div>

      <div className="relative h-8 touch-none">
        <div className="pointer-events-none absolute top-1/2 right-0 left-0 h-1.5 -translate-y-1/2 rounded-full bg-idl-tech-border" />
        <div
          className={cn(
            'pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full',
            fill,
          )}
          style={{ left: `${pctLo}%`, width: `${Math.max(0, pctHi - pctLo)}%` }}
        />
        <input
          type="range"
          min={0}
          max={last}
          step={1}
          value={lo}
          aria-label="Wattaggio minimo"
          onChange={(e) => updateLo(Number(e.target.value))}
          className={cn(
            'pointer-events-none absolute inset-0 z-[3] h-8 w-full cursor-pointer appearance-none bg-transparent',
            thumbClass,
          )}
        />
        <input
          type="range"
          min={0}
          max={last}
          step={1}
          value={hi}
          aria-label="Wattaggio massimo"
          onChange={(e) => updateHi(Number(e.target.value))}
          className={cn(
            'pointer-events-none absolute inset-0 z-[4] h-8 w-full cursor-pointer appearance-none bg-transparent',
            thumbClass,
          )}
        />
      </div>

      <div className="flex justify-between font-mono text-[10.5px] text-idl-muted">
        <span>{formatWattLabel(boundMin)}</span>
        <span>{formatWattLabel(boundMax)}</span>
      </div>
    </div>
  )
}
