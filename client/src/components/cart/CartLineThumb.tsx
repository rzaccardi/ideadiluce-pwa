import { cn } from '@/utils/cn'

type Props = {
  imageUrl: string | null | undefined
  name: string | null | undefined
  size?: 'sm' | 'md'
  className?: string
}

const sizeClass = {
  sm: 'size-12 rounded-md',
  md: 'size-16 rounded-lg',
} as const

export function CartLineThumb({ imageUrl, name, size = 'md', className }: Props) {
  const dim = sizeClass[size]

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className={cn('shrink-0 border border-idl-border/60 object-cover', dim, className)}
      />
    )
  }

  const letter = (name?.trim()?.[0] ?? '?').toUpperCase()

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center border border-idl-border/60 bg-idl-cream font-medium text-idl-placeholder',
        size === 'sm' ? 'text-sm' : 'text-lg',
        dim,
        className,
      )}
      aria-hidden="true"
    >
      {letter}
    </div>
  )
}
