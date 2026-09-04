'use client'

import { useEffect, useRef, useState } from 'react'
import { useI18n } from '@/hooks/use-i18n'
import { copyTextToClipboard } from '@/lib/copy-to-clipboard'
import { notify } from '@/lib/notify'
import { cn } from '@/utils/cn'

type Props = {
  value: string
  className?: string
}

export function CopyableEanValue({ value, className }: Props) {
  const { t, tParams } = useI18n()
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  async function handleCopy(event: React.MouseEvent<HTMLButtonElement>) {
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

  return (
    <button
      type="button"
      onClick={(event) => void handleCopy(event)}
      onPointerDown={(event) => event.stopPropagation()}
      className={cn(
        'inline cursor-pointer rounded-sm bg-transparent p-0 text-inherit underline-offset-2 hover:underline',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-idl-amber',
        className,
      )}
      aria-label={tParams('product.meta.eanCopyAria', { ean: value })}
      title={copied ? t('product.meta.eanCopied') : t('product.meta.eanCopyHint')}
    >
      {value}
      {copied ? (
        <span className="ml-1.5 font-sans font-medium" aria-live="polite">
          {t('product.meta.eanCopied')}
        </span>
      ) : null}
    </button>
  )
}
