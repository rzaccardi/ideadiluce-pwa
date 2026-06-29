'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api/endpoints'
import { useLocale } from '@/context/locale-context'
import { Button } from '@/components/Button'
import { ui } from '@/lib/ui-classes'
import { cn } from '@/utils/cn'

type FormKind = 'product-not-found' | 'contact' | 'b2b'

type Props = {
  kind: FormKind
  title?: string
  description?: string
  /** Layout a tutta larghezza nella griglia contatti. */
  embedded?: boolean
  className?: string
}

export function SiteLeadForm({ kind, title, description, embedded = false, className }: Props) {
  const { locale } = useLocale()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [productCode, setProductCode] = useState('')
  const [brand, setBrand] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.site.submitInquiry({
        kind,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        message: message.trim() || undefined,
        productCode: productCode.trim() || undefined,
        brand: brand.trim() || undefined,
        quantity: kind === 'product-not-found' ? Number(quantity) || 1 : undefined,
        locale,
      })
      toast.success('Richiesta inviata. Ti risponderemo al più presto.')
      setMessage('')
      setProductCode('')
      setBrand('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invio non riuscito')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={cn(
        embedded
          ? 'rounded-2xl border border-idl-tech-border bg-idl-tech-panel p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-7'
          : cn(ui.panel, 'max-w-2xl'),
        className,
      )}
    >
      {title ? <h2 className="text-xl font-bold tracking-tight text-idl-ink">{title}</h2> : null}
      {description ? <p className="mt-1 text-sm text-idl-muted">{description}</p> : null}
      <form className="mt-6 space-y-4" onSubmit={(e) => void onSubmit(e)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className={ui.labelSm}>Nome e cognome</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={cn(ui.input, 'mt-1')}
              autoComplete="name"
            />
          </label>
          <label className="block text-sm">
            <span className={ui.labelSm}>Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(ui.input, 'mt-1')}
              autoComplete="email"
            />
          </label>
          <label className="block text-sm">
            <span className={ui.labelSm}>Telefono / WhatsApp</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={cn(ui.input, 'mt-1')}
              autoComplete="tel"
            />
          </label>
          {kind === 'product-not-found' ? (
            <>
              <label className="block text-sm">
                <span className={ui.labelSm}>Codice / EAN / MPN</span>
                <input
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value)}
                  className={cn(ui.input, 'mt-1 font-mono text-sm')}
                />
              </label>
              <label className="block text-sm">
                <span className={ui.labelSm}>Marca (se nota)</span>
                <input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className={cn(ui.input, 'mt-1')}
                />
              </label>
              <label className="block text-sm">
                <span className={ui.labelSm}>Quantità</span>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={cn(ui.input, 'mt-1')}
                />
              </label>
            </>
          ) : null}
        </div>
        <label className="block text-sm">
          <span className={ui.labelSm}>Messaggio</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className={cn(ui.input, 'mt-1 min-h-[100px] resize-y')}
            placeholder={
              kind === 'product-not-found'
                ? 'Descrivi il prodotto, dove lo usavi e cosa ti serve…'
                : 'Come possiamo aiutarti?'
            }
          />
        </label>
        <Button type="submit" loading={loading} variant={kind === 'product-not-found' ? 'technical' : 'primary'}>
          Invia la richiesta
        </Button>
        <p className="text-xs text-idl-muted">
          Inviando accetti la{' '}
          <a href="/privacy" className="text-idl-brass underline">
            Privacy Policy
          </a>
          . Ti rispondiamo via email o telefono, di solito in giornata lavorativa.
        </p>
      </form>
    </div>
  )
}
