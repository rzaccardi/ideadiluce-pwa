import { SectionContainer } from '../primitives'
import { Reveal } from '@/components/motion'
import { ui } from '@/lib/ui-classes'
import { cn } from '@/utils/cn'

type Props = {
  title: string
  description: string
  placeholder: string
  ctaLabel: string
  privacyNote: string
}

export function NewsletterSection({ title, description, placeholder, ctaLabel, privacyNote }: Props) {
  return (
    <Reveal className="border-t border-idl-border bg-idl-cream">
      <SectionContainer narrow className="py-10 text-center">
        <h2 className="font-serif text-2xl text-idl-ink">{title}</h2>
        <p className="mt-2 text-sm text-idl-ink-muted">{description}</p>
        <form className="mx-auto mt-5 flex max-w-md flex-col gap-2 sm:flex-row" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            placeholder={placeholder}
            className="min-w-0 flex-1 rounded-md border border-idl-border px-4 py-3 text-sm outline-none"
          />
          <button type="submit" className={cn(ui.ctaInk, 'rounded-md bg-idl-ink px-5 py-3 text-sm font-bold text-white')}>
            {ctaLabel}
          </button>
        </form>
        <p className="mt-3 text-xs text-idl-ink-muted">{privacyNote}</p>
      </SectionContainer>
    </Reveal>
  )
}
