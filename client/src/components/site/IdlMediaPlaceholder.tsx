import { cn } from '@/utils/cn'

type Props = {
  className?: string
  /** Riempie il contenitore `relative` del media. */
  fill?: boolean
  /** Wordmark bianco su fondo scuro. */
  inverted?: boolean
}

/** Media vuoto o rotto: logo Idea di Luce al centro. */
export function IdlMediaPlaceholder({ className, fill = false, inverted = false }: Props) {
  return (
    <div
      aria-hidden
      className={cn(
        'flex items-center justify-center px-[14%]',
        inverted ? 'bg-idl-design-elevated' : 'bg-idl-cream',
        fill ? 'absolute inset-0 size-full' : 'size-full min-h-[4.5rem]',
        className,
      )}
    >
      <img
        src={inverted ? '/brand/ideadiluce-white.svg' : '/brand/ideadiluce.svg'}
        alt=""
        width={255}
        height={44}
        decoding="async"
        draggable={false}
        className={cn(
          'pointer-events-none h-auto w-full max-h-[42%] max-w-[14rem] object-contain select-none',
          inverted ? 'opacity-60' : 'opacity-50 dark:invert dark:opacity-55',
        )}
      />
    </div>
  )
}
