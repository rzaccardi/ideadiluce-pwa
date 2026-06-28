import { useMemo } from 'react'
import { cn } from '@/utils/cn'

type Props = {
  html: string
  className?: string
}

/** Ripulisce HTML prodotto e assicura link assoluti verso asset Woo. */
function sanitizeProductHtml(html: string): string {
  let s = html.replace(/\\"/g, '"')
  s = s.replace(/\b(href|src)\s*=\s*"+([^"]+)"+/gi, (_, attr: string, url: string) => {
    const clean = url.trim().replace(/^["']+|["']+$/g, '')
    return `${attr}="${clean}"`
  })
  return s
}

export function ProductDescriptionHtml({ html, className }: Props) {
  const safeHtml = useMemo(() => sanitizeProductHtml(html), [html])

  return (
    <div
      className={cn('product-description', className)}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
      onClick={(e) => {
        const anchor = (e.target as HTMLElement).closest('a')
        if (!anchor) return
        const href = anchor.getAttribute('href')
        if (!href || href.startsWith('/') || href.startsWith('#')) return
        if (/^https?:\/\//i.test(href)) {
          e.preventDefault()
          window.open(href, '_blank', 'noopener,noreferrer')
        }
      }}
    />
  )
}
