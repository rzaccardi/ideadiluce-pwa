'use client'

import { Link } from '@/lib/navigation'
import { SiteImage } from '@/components/site/SiteImage'
import { FadeIn } from '@/components/motion'
import type { Home2SplitBlock } from '@/lib/homepage2.defaults'
import type { LocalePathFn } from '@/components/site/sections/types'

type Props = {
  blocks: [Home2SplitBlock, Home2SplitBlock]
  imageUrls: [string, string]
  lp: LocalePathFn
}

function SplitBlock({
  block,
  imageUrl,
  lp,
}: {
  block: Home2SplitBlock
  imageUrl: string
  lp: LocalePathFn
}) {
  return (
    <Link
      to={lp(block.href)}
      className="group relative flex min-h-[280px] flex-col justify-end overflow-hidden sm:min-h-[360px] lg:min-h-[420px]"
    >
      <SiteImage
        src={imageUrl}
        alt=""
        fill
        sizes="(max-width:1024px) 100vw, 50vw"
        className="object-cover transition duration-700 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
      <div className="relative z-[2] p-6 sm:p-8 lg:p-10">
        <p className="font-mono text-[10px] tracking-[0.14em] text-idl-glow uppercase">{block.eyebrow}</p>
        <h2 className="mt-2 font-serif text-[clamp(1.5rem,3vw,2.25rem)] leading-tight font-medium text-white">
          {block.title}
        </h2>
        <p className="mt-3 max-w-md text-[14px] leading-relaxed text-white/85">{block.description}</p>
        <span className="mt-5 inline-flex text-[14px] font-bold text-idl-glow">{block.ctaLabel} →</span>
      </div>
    </Link>
  )
}

export function Home2CategorySplit({ blocks, imageUrls, lp }: Props) {
  return (
    <section className="grid lg:grid-cols-2">
      <FadeIn>
        <SplitBlock block={blocks[0]} imageUrl={imageUrls[0]} lp={lp} />
      </FadeIn>
      <FadeIn delay={0.08}>
        <SplitBlock block={blocks[1]} imageUrl={imageUrls[1]} lp={lp} />
      </FadeIn>
    </section>
  )
}
