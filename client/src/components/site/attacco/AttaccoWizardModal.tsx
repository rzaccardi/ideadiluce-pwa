'use client'

import { useCallback, useEffect } from 'react'
import { Link } from '@/lib/navigation'
import { ViewportPortal } from '@/components/ViewportPortal'
import { ATTACCO_WIZARD_SOCKETS, type AttaccoSocketKey } from '@/lib/attacco.defaults'
import { AttaccoSocketIcon, WizardSocketIcon } from './AttaccoIcons'
import type { LocalePathFn } from '../sections/types'
import { cn } from '@/utils/cn'
import { layers } from '@/lib/layering'

type Props = {
  open: boolean
  step: 1 | 2 | 3
  shape: AttaccoSocketKey | null
  lp: LocalePathFn
  onClose: () => void
  onStep: (step: 1 | 2 | 3) => void
  onShape: (shape: AttaccoSocketKey) => void
  onRestart: () => void
}

const LAMP_TYPES = [
  { id: 'classica', label: 'Classica', hint: 'a goccia / sfera', icon: 'goccia' as const },
  { id: 'faretto', label: 'Faretto', hint: 'spot / incasso', icon: 'spot' as const },
  { id: 'tubo', label: 'Tubo LED', hint: 'neon / lineare lungo', icon: 'lineare' as const },
  { id: 'lineare', label: 'Lineare corta', hint: 'piantane, proiettori', icon: 'lineare' as const },
  { id: 'capsula', label: 'Capsula piccola', hint: 'decorative, mobili', icon: 'sfera' as const },
  { id: 'nonso', label: 'Non lo so', hint: 'guidami dalla forma', icon: 'altri' as const },
]

const SHAPE_OPTIONS: { key: AttaccoSocketKey; label: string; hint: string }[] = [
  { key: 'E27', label: 'Vite grande', hint: 'filettatura larga ~27 mm' },
  { key: 'E14', label: 'Vite piccola', hint: 'filettatura stretta ~14 mm' },
  { key: 'GU10', label: 'Due piedini larghi', hint: 'con testa, si ruota' },
  { key: 'GU5.3', label: 'Due pin sottili dritti', hint: 'si infila, spesso 12V' },
  { key: 'G9', label: 'Contatti ad asola', hint: 'capsula ravvicinata 230V' },
  { key: 'G4', label: 'Due mini pin vicini', hint: 'molto piccoli, 12V' },
  { key: 'R7s', label: 'Lineare con contatti ai lati', hint: 'tubo 78 / 118 mm' },
  { key: 'G13', label: 'Tubo lungo con due pin', hint: 'neon / T8' },
]

export function AttaccoWizardModal({
  open,
  step,
  shape,
  lp,
  onClose,
  onStep,
  onShape,
  onRestart,
}: Props) {
  const result = shape ? ATTACCO_WIZARD_SOCKETS[shape] : null

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onKeyDown])

  if (!open) return null

  return (
    <ViewportPortal open lockScroll>
      <div
        className={cn(
          'fixed inset-0 flex h-[100dvh] w-screen items-center justify-center bg-[rgba(12, 12, 13,0.55)] p-4 sm:p-6',
          layers.modal,
        )}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Trova il tuo attacco"
    >
      <div
        className="max-h-[92vh] w-full max-w-[680px] overflow-auto rounded-2xl bg-idl-tech-panel shadow-[0_30px_80px_rgba(0,0,0,0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between rounded-t-2xl border-b border-idl-tech-border bg-idl-tech-panel px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3 sm:gap-3.5">
            <div className="font-mono text-[11px] tracking-[0.18em] text-idl-amber">TROVA IL TUO ATTACCO</div>
            <div className="flex gap-1.5">
              {[1, 2, 3].map((dot) => (
                <span
                  key={dot}
                  className={cn('h-1 w-6 rounded-sm', step >= dot ? 'bg-idl-amber' : 'bg-idl-tech-chip-border')}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-[34px] items-center justify-center rounded-lg bg-idl-tech-panel text-lg text-idl-graphite-2"
            aria-label="Chiudi"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-7 sm:px-7 sm:py-8">
          {step === 1 ? (
            <div>
              <h2 className="text-[20px] font-extrabold tracking-tight text-idl-graphite sm:text-[22px]">
                Che tipo di lampadina devi sostituire?
              </h2>
              <p className="mt-1.5 text-[14px] text-idl-graphite-2">
                Scegli quella che somiglia di più alla tua. Serve solo a restringere il campo.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {LAMP_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => onStep(2)}
                    className="flex items-center gap-3 rounded-[10px] border border-idl-tech-chip-border bg-idl-tech-panel p-3.5 text-left transition hover:border-idl-amber hover:bg-[#fafafa] sm:p-4"
                  >
                    <AttaccoSocketIcon icon={type.icon === 'goccia' ? 'E27' : type.icon === 'spot' ? 'GU10' : type.icon === 'lineare' ? 'R7s' : type.icon === 'sfera' ? 'G9' : 'altri'} size={30} />
                    <div>
                      <div className="text-[15px] font-bold text-idl-graphite">{type.label}</div>
                      <div className="text-[12px] text-idl-muted">{type.hint}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <button
                type="button"
                onClick={() => onStep(1)}
                className="mb-3.5 text-[13px] font-semibold text-idl-muted"
              >
                ← Indietro
              </button>
              <h2 className="text-[20px] font-extrabold tracking-tight text-idl-graphite sm:text-[22px]">
                Che forma ha l&apos;attacco?
              </h2>
              <p className="mt-1.5 text-[14px] text-idl-graphite-2">
                Guarda la base della lampadina e scegli la descrizione che corrisponde.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {SHAPE_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => onShape(option.key)}
                    className="flex items-center gap-3.5 rounded-[10px] border border-idl-tech-chip-border bg-idl-tech-panel p-3.5 text-left transition hover:border-idl-amber hover:bg-[#fafafa] sm:px-4"
                  >
                    <WizardSocketIcon socket={option.key} />
                    <div>
                      <div className="text-[14.5px] font-bold text-idl-graphite">{option.label}</div>
                      <div className="text-[12px] text-idl-muted">{option.hint}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 3 && result ? (
            <div>
              <button
                type="button"
                onClick={() => onStep(2)}
                className="mb-4 text-[13px] font-semibold text-idl-muted"
              >
                ← Indietro
              </button>
              <div className="flex flex-col items-center gap-4 rounded-[14px] border border-idl-tech-border bg-idl-path-tech p-5 text-idl-graphite sm:flex-row sm:items-center sm:gap-5 sm:p-6">
                <div className="flex size-[88px] shrink-0 items-center justify-center rounded-xl border border-idl-tech-border bg-idl-tech-panel">
                  <WizardSocketIcon socket={result.key} />
                </div>
                <div>
                  <div className="font-mono text-[11px] tracking-[0.16em] text-idl-amber">PROBABILMENTE TI SERVE</div>
                  <div className="font-mono text-[24px] font-medium text-idl-graphite sm:text-[26px]">{result.short}</div>
                  <div className="text-[14px] text-idl-graphite-2">{result.name}</div>
                </div>
              </div>
              <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
                <div className="rounded-[10px] border border-idl-tech-border bg-idl-path-tech p-4">
                  <div className="mb-1.5 font-mono text-[10.5px] tracking-[0.1em] text-idl-muted">COME CONTROLLARE</div>
                  <p className="text-[13.5px] leading-snug text-idl-graphite-2">{result.check}</p>
                </div>
                <div className="rounded-[10px] border border-idl-tech-border bg-idl-path-tech p-4">
                  <div className="mb-1.5 font-mono text-[10.5px] tracking-[0.1em] text-idl-muted">USATO PER</div>
                  <p className="text-[13.5px] leading-snug text-idl-graphite-2">{result.use}</p>
                </div>
              </div>
              {result.note ? (
                <div className="mt-3.5 rounded-[10px] border border-idl-promo-border bg-idl-promo-bg px-4 py-3 text-[13px] text-idl-promo-text">
                  {result.note}
                </div>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link
                  to={lp(result.href)}
                  onClick={onClose}
                  className="rounded-[7px] bg-idl-amber px-5 py-3 text-[14.5px] font-bold text-white dark:text-idl-design"
                >
                  Vedi lampadine {result.short} →
                </Link>
                <button
                  type="button"
                  onClick={onRestart}
                  className="rounded-[7px] border border-idl-tech-chip-border bg-idl-tech-panel px-5 py-3 text-[14.5px] font-bold text-idl-graphite"
                >
                  Ricomincia
                </button>
                <Link to={lp('/guide')} onClick={onClose} className="px-2 py-3 text-[14.5px] font-bold text-idl-amber">
                  Guida completa agli attacchi
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
    </ViewportPortal>
  )
}
