'use client'

import type { ProductDocumentDTO } from '@/types/dto'
import { ExternalLink } from '@/lib/link-title'
import { getBrowserApiBase } from '@/lib/env'
import { cn } from '@/utils/cn'

type Props = {
  slug: string
  documents: ReadonlyArray<ProductDocumentDTO>
  variantRef?: string | null
  /** CED variante per deep-link `/product-docs/<ced>/<tipo>/current`. */
  ced?: string | null
  className?: string
  variant?: 'design' | 'technical'
  showTitle?: boolean
}

const DOC_TYPE_LABEL: Record<string, string> = {
  datasheet: 'Scheda tecnica',
  scheda_ue: 'Scheda prodotto UE',
  ce: 'Dichiarazione CE',
  istruzioni: 'Istruzioni',
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

function resolveDocHref(
  doc: ProductDocumentDTO,
  slug: string,
  variantRef?: string | null,
): string {
  if (doc.publicCurrentUrl) return doc.publicCurrentUrl
  if (/^https?:\/\//i.test(doc.url) && !doc.url.includes('/api/v1/')) return doc.url
  return downloadHref(slug, doc.id, variantRef)
}

export function ProductDocuments({
  slug,
  documents,
  variantRef,
  ced: _ced,
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
          const typeLabel = doc.type ? DOC_TYPE_LABEL[doc.type] ?? doc.type : null
          const meta = [typeLabel, doc.format?.toUpperCase() ?? doc.mimetype, size]
            .filter(Boolean)
            .join(' · ')
          return (
            <li key={doc.id}>
              <ExternalLink
                href={resolveDocHref(doc, slug, variantRef)}
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
