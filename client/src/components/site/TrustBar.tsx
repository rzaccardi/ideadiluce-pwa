'use client'

import { Stagger, StaggerItem } from '@/components/motion'
import type { SiteShellContent } from '@/types/site-content'
import { SectionContainer } from './primitives'

export function TrustBar({ items }: { items: SiteShellContent['trustBar'] }) {
  return (
    <div className="border-t border-idl-border bg-idl-cream">
      <SectionContainer className="py-5">
        <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4" stagger={0.06}>
          {items.map((item) => (
            <StaggerItem key={item.title}>
              <div className="text-[13px] font-bold text-idl-ink">{item.title}</div>
              <div className="text-[11.5px] text-idl-ink-muted">{item.subtitle}</div>
            </StaggerItem>
          ))}
        </Stagger>
      </SectionContainer>
    </div>
  )
}
