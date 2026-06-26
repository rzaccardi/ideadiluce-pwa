'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api/endpoints'
import { useLocale } from '@/context/locale-context'
import { Button } from '@/components/Button'

type Props = {
  title?: string
  description?: string
}

export function ProfessionalQuoteForm({
  title = 'Richiedi preventivo o consulenza',
  description = 'Descrivi il progetto o l’ambiente: il team commerciale ti ricontatterà con una proposta personalizzata.',
}: Props) {
  const { locale } = useLocale()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Compila nome, email e messaggio.')
      return
    }
    setSubmitting(true)
    try {
      await api.site.submitInquiry({
        kind: 'professional-quote',
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        brand: company.trim() || undefined,
        message: message.trim(),
        locale,
      })
      toast.success('Richiesta inviata. Ti ricontatteremo al più presto.')
      setMessage('')
    } catch {
      toast.error('Invio non riuscito. Riprova o scrivici a info@ideadiluce.com')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-[14px] border border-[#e5e7eb] bg-[#fafbfc] p-6">
      <h2 className="text-xl font-bold tracking-tight text-idl-graphite">{title}</h2>
      <p className="mt-2 text-sm text-idl-muted">{description}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-idl-graphite">
          Nome e cognome *
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-idl-border px-3 py-2.5 text-sm"
          />
        </label>
        <label className="block text-sm font-semibold text-idl-graphite">
          Email *
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-idl-border px-3 py-2.5 text-sm"
          />
        </label>
        <label className="block text-sm font-semibold text-idl-graphite">
          Telefono
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-idl-border px-3 py-2.5 text-sm"
          />
        </label>
        <label className="block text-sm font-semibold text-idl-graphite">
          Azienda / studio
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-idl-border px-3 py-2.5 text-sm"
          />
        </label>
      </div>
      <label className="mt-4 block text-sm font-semibold text-idl-graphite">
        Messaggio *
        <textarea
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tipo di progetto, ambienti, quantità indicative, tempistiche…"
          className="mt-1.5 w-full rounded-lg border border-idl-border px-3 py-2.5 text-sm"
        />
      </label>
      <Button type="submit" disabled={submitting} className="mt-5">
        {submitting ? 'Invio…' : 'Invia richiesta'}
      </Button>
    </form>
  )
}
