'use client'

import { useEffect, useId, useState } from 'react'
import { useSnapshot } from 'valtio/react'
import { api } from '@/api/endpoints'
import { authStore } from '@/features/auth'
import { useLocale } from '@/context/locale-context'
import { Button } from '@/components/Button'
import { QuantityInput } from '@/components/QuantityInput'
import { TextInput } from '@/components/TextInput'
import { useI18n } from '@/hooks/use-i18n'
import { ApiRequestError } from '@/types/api'
import { ViewportPortal } from '@/components/ViewportPortal'
import { layers } from '@/lib/layering'
import { cn } from '@/utils/cn'

type Props = {
  productSlug: string
  productName: string
  variantRef?: string | null
  className?: string
  /** Override CTA (es. «Richiedi prodotto» per fuori stock). */
  ctaLabel?: string
  requestType?: 'RESTOCK_NOTIFY' | 'PRODUCT_REQUEST'
}

export function ProductRestockNotify({
  productSlug,
  productName,
  variantRef = null,
  className,
  ctaLabel,
  requestType = 'RESTOCK_NOTIFY',
}: Props) {
  const { locale } = useLocale()
  const { t, tParams } = useI18n()
  const auth = useSnapshot(authStore)
  const titleId = useId()
  const descriptionId = useId()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState(auth.me?.email ?? '')
  const [quantity, setQuantity] = useState(1)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !pending) setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, pending])

  function closeModal() {
    if (!pending) setOpen(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      await api.catalog.restockNotify(productSlug, {
        email: email.trim(),
        quantity,
        variantRef,
        locale,
        requestType,
      })
      setDone(true)
      setOpen(false)
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? (err.userMessage ?? err.message)
          : t('product.restock.error'),
      )
    } finally {
      setPending(false)
    }
  }

  if (done) {
    return (
      <p className={cn('text-sm text-emerald-800', className)} role="status">
        {tParams('product.restock.confirmSent', { email, productName })}
        {quantity > 1 ? ` (×${quantity})` : ''}.
      </p>
    )
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className={className}
        onClick={() => {
          setError(null)
          setOpen(true)
        }}
      >
        {ctaLabel ?? t('product.restock.notifyCta')}
      </Button>

      <ViewportPortal open={open} lockScroll>
        <div
          className={cn(
            'fixed inset-0 flex h-[100dvh] w-screen items-center justify-center bg-black/40 p-4',
            layers.dialog,
          )}
          role="presentation"
          onClick={closeModal}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            onSubmit={(e) => void handleSubmit(e)}
            className="w-full max-w-md space-y-4 rounded-xl border border-idl-border bg-idl-tech-panel p-6 text-left shadow-xl shadow-zinc-950/10"
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-idl-graphite">
                {t('product.restock.title')}
              </h2>
              <p id={descriptionId} className="mt-2 text-sm text-idl-muted">
                {t('product.restock.description')}
              </p>
            </div>
            <TextInput
              label={t('common.email')}
              name="restock-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error ?? undefined}
            />
            <QuantityInput
              label={t('product.restock.quantityDesired')}
              min={1}
              max={99}
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, Math.min(99, Number(e.target.value) || 1)))
              }
            />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={closeModal} disabled={pending}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={pending || !email.trim()}>
                {pending ? t('product.restock.submitting') : t('product.restock.submit')}
              </Button>
            </div>
          </form>
        </div>
      </ViewportPortal>
    </>
  )
}
