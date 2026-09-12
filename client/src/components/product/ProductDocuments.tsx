'use client'

import type { ProductDocumentDTO } from '@/types/dto'
import { ExternalLink } from '@/lib/link-title'
import { getBrowserApiBase } from '@/lib/env'
import { resolveProductDocumentHref } from '@/lib/product-documents'
import { cn } from '@/utils/cn'
import { useI18n } from '@/hooks/use-i18n'
import type { MessageKey } from '@/i18n/messages'

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

const DOC_TYPE_KEY: Record<string, MessageKey> = {
  datasheet: 'product.docs.datasheet',
  scheda_ue: 'product.docs.euSheet',
  ce: 'product.docs.ce',
  istruzioni: 'product.docs.instructions',
}

function formatBytes(bytes: number | null | undefined): string | null {
  if (bytes == null || bytes <= 0) return null
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none">
      <path
        d="M12 4v11m0 0l-4-4m4 4l4-4M5 18h14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
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
  const { t } = useI18n()
  if (!documents.length) return null

  const isDesign = variant === 'design'
  const accent = isDesign ? 'text-idl-brass' : 'text-idl-amber'
  const apiBase = getBrowserApiBase()

  return (
    <section className={cn('space-y-3', className)}>
      {showTitle ? (
        <h2
          className={cn(
            'text-lg font-semibold tracking-tight',
            isDesign ? 'font-serif text-idl-ink' : 'font-extrabold text-idl-ink',
          )}
        >
          {t('product.docs.title')}
        </h2>
      ) : null}
      <ul className="divide-y divide-idl-border rounded-lg border border-idl-border bg-idl-paper">
        {documents.map((doc) => {
          const size = formatBytes(doc.sizeBytes)
          const typeKey = doc.type ? DOC_TYPE_KEY[doc.type] : undefined
          const typeLabel = typeKey ? t(typeKey) : doc.type
          const meta = [typeLabel, doc.format?.toUpperCase() ?? doc.mimetype, size]
            .filter(Boolean)
            .join(' · ')
          const href = resolveProductDocumentHref(doc, { slug, variantRef, apiBase })
          const filename = doc.name?.trim() || 'documento.pdf'
          return (
            <li key={doc.id}>
              <ExternalLink
                href={href}
                download={filename}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-idl-tech-panel"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <DownloadIcon className={cn('size-4 shrink-0', accent)} />
                  <span className="font-medium text-idl-ink underline-offset-2 group-hover:underline">
                    {doc.name}
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  {meta ? <span className="text-idl-muted">{meta}</span> : null}
                  <span className={cn('font-semibold tracking-wide uppercase', accent)}>
                    {t('product.docs.download')}
                  </span>
                </span>
              </ExternalLink>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
