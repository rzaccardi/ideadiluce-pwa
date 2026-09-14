'use client'

import { useEffect } from 'react'
import { useSnapshot } from 'valtio/react'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'
import { ui } from '@/lib/ui-classes'
import {
  hydrateLightsStore,
  lightsStore,
  playLightSwitchSound,
  prefetchLightSwitchSound,
  toggleLights,
} from '@/features/lights'

function LampIcon({ on, className }: { on: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none">
      <path
        d="M9 18h6M10 21h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M8.2 14.2c-.7-1-1.2-2.2-1.2-3.5A5 5 0 0 1 12 5.7a5 5 0 0 1 5 5c0 1.3-.5 2.5-1.2 3.5H8.2Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
        fill={on ? 'currentColor' : 'none'}
      />
      <path
        d="M12 3v1.2M6.2 6.2l.9.9M17.8 6.2l-.9.9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
        className={cn('origin-center transition-opacity duration-300', on ? 'opacity-100' : 'opacity-0')}
      />
    </svg>
  )
}

export function HeaderLightsToggle() {
  const { t } = useI18n()
  const { on } = useSnapshot(lightsStore)

  useEffect(() => {
    hydrateLightsStore()
    prefetchLightSwitchSound()
  }, [])

  function handleToggle() {
    const next = !lightsStore.on
    playLightSwitchSound(next)
    toggleLights()
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-pressed={on}
      aria-label={on ? t('nav.lightsOff') : t('nav.lightsOn')}
      title={on ? t('nav.lightsOff') : t('nav.lightsOn')}
      className={cn(
        ui.interactive,
        ui.headerActionBtn,
        'inline-flex size-[38px] shrink-0 items-center justify-center rounded-full border p-0',
      )}
    >
      <LampIcon
        on={on}
        className={cn(
          'relative z-[1] size-[18px] shrink-0 transition duration-300',
          on
            ? 'text-idl-glow drop-shadow-[0_0_8px_rgba(201,162,75,1)]'
            : 'text-idl-ink-soft',
        )}
      />
    </button>
  )
}
