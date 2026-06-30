'use client'

import { Reveal } from '@/components/motion'
import { PageLoadTransition } from '@/components/motion/PageLoadTransition'
import { AmbientiPageSkeleton } from '@/components/site/skeletons'
import { useLocalePath } from '@/hooks/use-locale-path'
import type { EditorialPageContent } from '@/types/site-content'
import { CategoryCtaBanner } from '../category/CategoryCtaBanner'
import { AMBIENTI_CONSULT_CTA } from '@/lib/ambienti.defaults'
import { AmbientiHeroSection } from './sections/AmbientiHeroSection'
import { AmbientiRoomsSection } from './sections/AmbientiRoomsSection'
import { PopularLooksSection } from './sections/PopularLooksSection'
import { ShopTheLookSection } from './sections/ShopTheLookSection'

type Props = {
  content: Readonly<EditorialPageContent> | null
  roomsLoading?: boolean
}

export function AmbientiView({ content, roomsLoading = false }: Props) {
  const lp = useLocalePath()

  return (
    <div className="bg-idl-tech-panel">
      <Reveal immediate>
        <AmbientiHeroSection lp={lp} />
      </Reveal>

      {roomsLoading || !content ? (
        <PageLoadTransition isLoading skeleton={<AmbientiPageSkeleton />}>
          {null}
        </PageLoadTransition>
      ) : (
        <Reveal immediate delay={0.05}>
          <AmbientiRoomsSection items={content.items} lp={lp} />
        </Reveal>
      )}

      <Reveal>
        <ShopTheLookSection lp={lp} />
      </Reveal>
      <Reveal>
        <PopularLooksSection lp={lp} />
      </Reveal>
      <Reveal>
        <CategoryCtaBanner
          banner={{
            title: AMBIENTI_CONSULT_CTA.title,
            description: AMBIENTI_CONSULT_CTA.description,
            primaryCta: AMBIENTI_CONSULT_CTA.primaryCta,
            secondaryCta: AMBIENTI_CONSULT_CTA.secondaryCta,
          }}
          lp={lp}
          variant="design"
        />
      </Reveal>
    </div>
  )
}
