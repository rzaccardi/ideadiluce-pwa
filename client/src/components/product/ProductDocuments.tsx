'use client'

import type { ProductDocumentDTO } from '@/types/dto'
import { ExternalLink } from '@/lib/link-title'
import { getBrowserApiBase } from '@/lib/env'
import { cn } from '@/utils/cn'

type Props = {
  slug: string
  documents: ReadonlyArray<ProductDocumentDTO>
  variantRef?: string | null
  className?: string
  variant?: 'design' | 'technical'
  showTitle?: boolean
}

function formatBytes(bytes: number | null | undefined): string | null {
  if (bytes == null || bytes <= 0) return null
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function downloadHref(slug: string, documentId: string, variantRef?: string | null): string {
  const base = getBrowserApiBase().replace(/\/$/, '')
  const search = new URLSearchParams({ source: `pdp:${slug}` })
  if (variantRef) search.set('variantRef', variantRef)
  const prefix = base ? base : ''
  return `${prefix}/api/v1/catalog/products/${encodeURIComponent(slug)}/documents/${encodeURIComponent(documentId)}/download?${search}`
}

export function ProductDocuments({
  slug,
  documents,
  variantRef,
  className,
  variant = 'design',
  showTitle = true,
}: Props) {
  if (!documents.length) return null

  const isDesign = variant === 'design'

  return (
    <section className={cn('space-y-3', className)}>
      {showTitle ? (
        <h2
          className={cn(
            'text-lg font-semibold tracking-tight',
            isDesign ? 'font-serif text-idl-design-fg' : 'font-extrabold text-idl-ink',
          )}
        >
          Documenti e schede tecniche
        </h2>
      ) : null}
      <ul className="divide-y divide-idl-border rounded-lg border border-idl-border bg-idl-tech-panel">
        {documents.map((doc) => {
          const size = formatBytes(doc.sizeBytes)
          const meta = [doc.type, doc.format?.toUpperCase(), size].filter(Boolean).join(' · ')
          return (
            <li key={doc.id}>
              <ExternalLink
                href={downloadHref(slug, doc.id, variantRef)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm transition hover:bg-idl-paper/80"
              >
                <span className="font-medium text-idl-ink">{doc.name}</span>
                {meta ? <span className="text-idl-muted">{meta}</span> : null}
              </ExternalLink>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
