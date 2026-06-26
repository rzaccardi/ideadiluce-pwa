import type { BrandDisplayStyle } from '@/lib/brand.defaults'
import { cn } from '@/utils/cn'

type Props = {
  name: string
  style: BrandDisplayStyle
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function BrandNameDisplay({ name, style, size = 'md', className }: Props) {
  if (style === 'bold-accent' && name.toLowerCase().includes('tlb')) {
    return (
      <span
        className={cn(
          'font-extrabold tracking-wide text-idl-graphite',
          size === 'lg' ? 'text-[26px]' : size === 'md' ? 'text-[22px]' : 'text-lg',
          className,
        )}
      >
        TLB <span className="text-idl-brass">ITALY</span>
      </span>
    )
  }

  if (style === 'serif') {
    return (
      <span
        className={cn(
          'font-serif font-medium tracking-wide text-idl-graphite',
          size === 'lg' ? 'text-[30px]' : size === 'md' ? 'text-2xl' : 'text-lg',
          name === 'FontanaArte' && 'text-[21px]',
          name === 'Davide Groppi' && 'text-lg',
          className,
        )}
      >
        {name}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'font-extrabold tracking-wide text-idl-graphite uppercase',
        size === 'lg' ? 'text-[30px]' : size === 'md' ? 'text-xl' : 'text-base',
        name === 'Ledvance' && 'text-[19px]',
        name === 'Mean Well' && 'text-lg',
        className,
      )}
    >
      {name}
    </span>
  )
}
