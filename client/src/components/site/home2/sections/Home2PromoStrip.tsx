import type { Home2PromoItem } from '@/lib/homepage2.defaults'

type Props = {
  items: ReadonlyArray<Home2PromoItem>
}

export function Home2PromoStrip({ items }: Props) {
  return (
    <section className="border-b border-idl-border bg-idl-cream">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 divide-x divide-idl-border lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="px-4 py-5 text-center sm:px-6 sm:py-6">
            <p className="font-serif text-[15px] font-medium text-idl-ink sm:text-[16px]">{item.label}</p>
            <p className="mt-1 text-[12px] leading-snug text-idl-muted sm:text-[13px]">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
