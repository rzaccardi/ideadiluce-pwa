'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '@/hooks/use-i18n'
import {
  barcodeFilename,
  barcodeToCanvas,
  barcodeToPdf,
  barcodeToSvg,
  encodeProductBarcode,
} from '@/lib/ean-barcode'
import { copyTextToClipboard } from '@/lib/copy-to-clipboard'
import { notify } from '@/lib/notify'
import { cn } from '@/utils/cn'
import { CopyableEanValue } from './CopyableEanValue'

type Props = {
  value: string
  productName?: string | null
  brand?: string | null
  variant?: 'compact' | 'full'
  className?: string
}

function uint8ToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(copy).set(bytes)
  return copy
}

function downloadBlob(data: Blob | string | Uint8Array, filename: string, type: string) {
  const blob =
    data instanceof Blob
      ? data
      : new Blob([typeof data === 'string' ? data : uint8ToArrayBuffer(data)], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export function ProductEanBarcode({
  value,
  productName,
  brand,
  variant = 'full',
  className,
}: Props) {
  const { t, tParams } = useI18n()
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<number | null>(null)
  const encoded = useMemo(() => encodeProductBarcode(value), [value])
  const svg = useMemo(
    () =>
      encoded
        ? barcodeToSvg(encoded, {
            includeDigits: false,
            moduleWidth: variant === 'compact' ? 1.2 : 2,
            barHeight: variant === 'compact' ? 28 : 64,
            quietModules: variant === 'compact' ? 6 : 10,
            foreground: 'currentColor',
            background: 'transparent',
          })
        : null,
    [encoded, variant],
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  if (!value.trim()) return null

  async function handleCopy(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    const result = await copyTextToClipboard(value)
    if (result === 'failed') {
      notify.error(t('product.meta.eanCopyFailed'))
      return
    }
    if (result === 'prompted') return
    setCopied(true)
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => setCopied(false), 1800)
  }

  async function handleDownloadPng() {
    if (!encoded) return
    try {
      const canvas = barcodeToCanvas(encoded, {
        includeDigits: true,
        moduleWidth: 3,
        barHeight: 96,
      })
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((result) => resolve(result), 'image/png')
      })
      if (!blob) throw new Error('png')
      downloadBlob(blob, barcodeFilename(encoded.digits, 'png'), 'image/png')
    } catch {
      notify.error(t('product.meta.eanDownloadFailed'))
    }
  }

  function handleDownloadPdf() {
    if (!encoded) return
    try {
      const pdf = barcodeToPdf(encoded, { productName, brand })
      downloadBlob(pdf, barcodeFilename(encoded.digits, 'pdf'), 'application/pdf')
    } catch {
      notify.error(t('product.meta.eanDownloadFailed'))
    }
  }

  function handleDownloadSvg() {
    if (!encoded) return
    try {
      const markup = barcodeToSvg(encoded, { includeDigits: true, moduleWidth: 2, barHeight: 80 })
      downloadBlob(markup, barcodeFilename(encoded.digits, 'svg'), 'image/svg+xml;charset=utf-8')
    } catch {
      notify.error(t('product.meta.eanDownloadFailed'))
    }
  }

  const compact = variant === 'compact'

  return (
    <div className={cn(compact ? 'flex flex-col space-y-1' : 'space-y-2.5', className)}>
      {svg ? (
        <button
          type="button"
          onClick={(event) => void handleCopy(event)}
          onPointerDown={(event) => event.stopPropagation()}
          className={cn(
            'overflow-hidden text-left text-idl-graphite [&_svg]:h-auto [&_svg]:w-full',
            compact ? 'max-w-[180px]' : 'max-w-[280px] rounded-md border border-idl-tech-border bg-white px-2 pt-2 pb-1',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-idl-amber',
          )}
          aria-label={tParams('product.meta.eanBarcodeAria', { ean: value })}
          title={copied ? t('product.meta.eanCopied') : t('product.meta.eanCopyHint')}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : null}
      <div className={cn('flex flex-wrap items-center gap-x-2 gap-y-1', compact && 'font-mono text-[10.5px] text-idl-muted')}>
        {compact ? (
          <>
            EAN <CopyableEanValue value={value} className="font-mono text-[10.5px] text-idl-graphite" />
          </>
        ) : (
          <>
            <span className="font-mono text-[11px] tracking-wide text-idl-muted uppercase">EAN</span>
            <CopyableEanValue value={value} className="font-mono text-sm text-idl-graphite" />
          </>
        )}
      </div>
      {encoded ? (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              void handleDownloadPng()
            }}
            onPointerDown={(event) => event.stopPropagation()}
            className={cn(
              'rounded border border-idl-tech-border font-mono tracking-wide text-idl-graphite uppercase transition hover:border-idl-amber hover:text-idl-amber',
              compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]',
            )}
          >
            {t('product.meta.eanDownloadPng')}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              handleDownloadPdf()
            }}
            onPointerDown={(event) => event.stopPropagation()}
            className={cn(
              'rounded border border-idl-tech-border font-mono tracking-wide text-idl-graphite uppercase transition hover:border-idl-amber hover:text-idl-amber',
              compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]',
            )}
          >
            {t('product.meta.eanDownloadPdf')}
          </button>
          {!compact ? (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                handleDownloadSvg()
              }}
              onPointerDown={(event) => event.stopPropagation()}
              className="rounded border border-idl-tech-border px-2 py-1 font-mono text-[10px] tracking-wide text-idl-graphite uppercase transition hover:border-idl-amber hover:text-idl-amber"
            >
              {t('product.meta.eanDownloadSvg')}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
