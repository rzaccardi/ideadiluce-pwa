'use client'

import { Link } from '@/lib/navigation'
import { SiteImage } from '@/components/site/SiteImage'
import { Stagger, StaggerItem } from '@/components/motion'
import type { Home2CategoryTile } from '@/lib/homepage2.defaults'
import type { LocalePathFn } from '@/components/site/sections/types'

type Props = {
  tiles: ReadonlyArray<Home2CategoryTile>
  imageUrls: ReadonlyArray<string | undefined>
  lp: LocalePathFn
}

export function Home2VisualCategories({ tiles, imageUrls, lp }: Props) {
  return (
    <section className="border-b border-idl-border bg-white py-10 sm:py-14 dark:bg-idl-tech-panel">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-14">
        <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6" stagger={0.05}>
          {tiles.map((tile, index) => {
            const imageUrl = imageUrls[index]
            return (
              <StaggerItem key={tile.key}>
                <Link
                  to={lp(tile.href)}
                  className="group block overflow-hidden rounded-lg border border-idl-border bg-idl-cream"
                >
                  <div className="relative aspect-square overflow-hidden bg-idl-cream">
                    {imageUrl ? (
                      <SiteImage
                        src={imageUrl}
                        alt=""
                        fill
                        sizes="(max-width:640px) 45vw, 16vw"
                        className="object-cover transition duration-500 group-hover:scale-[1.04]"
                      />
                    ) : null}
                  </div>
                  <div className="px-2 py-3 text-center">
                    <span className="font-serif text-[14px] font-medium text-idl-ink sm:text-[15px]">{tile.label}</span>
                  </div>
                </Link>
              </StaggerItem>
            )
          })}
        </Stagger>
      </div>
    </section>
  )
}
