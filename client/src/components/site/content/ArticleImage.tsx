'use client'

import Image from 'next/image'
import type { ArticleImageLayout } from '@/types/site-content'
import { cn } from '@/utils/cn'

type Props = {
  imageUrl: string
  alt: string
  caption?: string
  layout?: ArticleImageLayout
}

const LAYOUT_CLASS: Record<ArticleImageLayout, string> = {
  inline: 'max-w-2xl',
  wide: 'max-w-4xl',
  full: 'max-w-none',
  portrait: 'max-w-sm',
}

const ASPECT_CLASS: Record<ArticleImageLayout, string> = {
  inline: 'aspect-[4/3]',
  wide: 'aspect-[16/9]',
  full: 'aspect-[21/9] sm:aspect-[2/1]',
  portrait: 'aspect-[3/4]',
}

export function ArticleImage({ imageUrl, alt, caption, layout = 'wide' }: Props) {
  return (
    <figure className={cn('mx-auto w-full', LAYOUT_CLASS[layout])}>
      <div className={cn('relative overflow-hidden rounded-xl border border-idl-tech-border bg-idl-cream', ASPECT_CLASS[layout])}>
        <Image src={imageUrl} alt={alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 896px" />
      </div>
      {caption ? (
        <figcaption className="mt-2 text-center text-[13px] leading-relaxed text-idl-muted">{caption}</figcaption>
      ) : null}
    </figure>
  )
}
