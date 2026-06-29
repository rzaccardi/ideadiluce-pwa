'use client'

import { Link } from '@/lib/navigation'
import { Breadcrumb } from '@/components/Breadcrumb'
import { ProductGrid } from '@/components/product/ProductGrid'
import { PageHeader } from '@/components/PageHeader'
import { PageFlexBody, PageFlexShell } from '@/components/layout/PageFlexShell'
import { SectionContainer } from '@/components/site/primitives'
import { useLocalePath } from '@/hooks/use-locale-path'
import type { AmbientiRoomMeta } from '@/lib/ambienti.defaults'
import type { ProductCardDTO } from '@/types/dto'
import { cn } from '@/utils/cn'

type Props = {
  room: AmbientiRoomMeta
  products: ProductCardDTO[]
}

export function AmbienteRoomView({ room, products }: Props) {
  const lp = useLocalePath()
  const title = `Illuminazione per ${room.slug === 'esterno' ? 'esterni' : room.slug}`

  return (
    <PageFlexShell tone="paper">
      <PageFlexBody tone="paper">
        <SectionContainer className="py-8 sm:py-10">
          <Breadcrumb
            items={[
              { label: 'Ambienti', to: lp('/ambienti') },
              { label: title },
            ]}
          />
          <PageHeader title={title} description={room.description} />
          {room.intro ? (
            <p className="mb-8 max-w-3xl text-[15px] leading-relaxed text-idl-ink-muted">{room.intro}</p>
          ) : null}

          <div className="mb-8 flex flex-wrap gap-2">
            {room.tags.map((tag) => (
              <Link
                key={tag.href}
                to={lp(tag.href)}
                className="rounded-full border border-idl-border bg-idl-tech-panel px-4 py-2 text-[13px] font-semibold text-idl-ink transition hover:border-idl-brass hover:text-idl-brass"
              >
                {tag.label}
              </Link>
            ))}
          </div>

          <p
            className={cn(
              'mb-8 inline-flex rounded-lg px-3 py-2 text-[13px] font-medium',
              room.kelvinWarning
                ? 'border border-amber-200 bg-amber-50 text-amber-900'
                : 'bg-idl-cream text-idl-ink-muted',
            )}
          >
            {room.kelvinTip}
          </p>

          {products.length > 0 ? (
            <>
              <h2 className="mb-6 font-serif text-2xl font-medium text-idl-ink">Prodotti consigliati</h2>
              <ProductGrid products={products} />
            </>
          ) : null}

          <div className="mt-10 border-t border-idl-border pt-8">
            <Link to={lp('/guide')} className="text-sm font-bold text-idl-brass">
              Guide alla scelta della luce →
            </Link>
          </div>
        </SectionContainer>
      </PageFlexBody>
    </PageFlexShell>
  )
}
