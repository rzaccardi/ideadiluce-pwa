'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { apiClient } from '@/api/client'
import { api } from '@/api/endpoints'
import { useLocale } from '@/context/locale-context'
import { ui } from '@/lib/ui-classes'
import { cn } from '@/utils/cn'
import type { ProfessionistiPageContent } from '@/types/site-content'

type Props = {
  registration: ProfessionistiPageContent['registration']
}

export function ProfessionalAccountForm({ registration }: Props) {
  const { locale } = useLocale()
  const [companyName, setCompanyName] = useState('')
  const [vatNumber, setVatNumber] = useState('')
  const [sector, setSector] = useState(registration.sectors[0] ?? '')
  const [sectorOther, setSectorOther] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [pec, setPec] = useState('')
  const [sdiCode, setSdiCode] = useState('')
  const [visuraFile, setVisuraFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [country, setCountry] = useState('IT')
  const [loading, setLoading] = useState(false)
  const [vatMessage, setVatMessage] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (sector === 'Altro' && !sectorOther.trim()) {
      toast.error('Specifica il settore in "Altro"')
      return
    }
    setLoading(true)
    setVatMessage(null)
    try {
      const tax = await api.tax.validate({
        countryCode: country,
        vatNumber: vatNumber.trim(),
        personType: 'company',
      })

      if (tax.vat && (!tax.vat.formatValid || !tax.vat.checksumValid)) {
        setVatMessage(tax.vat.errors[0] ?? 'Partita IVA non valida.')
        return
      }

      if (tax.vat?.vies.status === 'invalid' && country !== 'IT') {
        setVatMessage('Partita IVA non presente su VIES.')
        return
      }

      const resolvedCompanyName =
        companyName.trim() ||
        tax.vat?.autofill?.companyName ||
        tax.vat?.vies.name ||
        ''
      if (resolvedCompanyName && !companyName.trim()) {
        setCompanyName(resolvedCompanyName)
      }

      if (tax.taxValidationStatus === 'vies_unavailable') {
        setVatMessage(
          'Servizio VIES temporaneamente non disponibile: invieremo la richiesta ma il dato sarà ricontrollato.',
        )
      }

      const form = new FormData()
      form.append('companyName', (resolvedCompanyName || companyName).trim())
      form.append('vatNumber', vatNumber.trim())
      form.append('sector', sector)
      if (sector === 'Altro') form.append('sectorOther', sectorOther.trim())
      form.append('contactName', contactName.trim())
      form.append('email', email.trim())
      if (phone.trim()) form.append('phone', phone.trim())
      if (pec.trim()) form.append('pec', pec.trim())
      if (sdiCode.trim()) form.append('sdiCode', sdiCode.trim())
      if (message.trim()) form.append('message', message.trim())
      form.append('locale', locale)
      form.append('country', country)
      if (visuraFile) form.append('visura', visuraFile)

      await apiClient.postForm<{ submitted: boolean; id: string }>(
        '/api/v1/site/professional-requests',
        form,
      )
      toast.success('Richiesta inviata. Verificheremo la P.IVA e ti contatteremo entro 24 ore lavorative.')
      setCompanyName('')
      setVatNumber('')
      setSectorOther('')
      setContactName('')
      setEmail('')
      setPhone('')
      setPec('')
      setSdiCode('')
      setVisuraFile(null)
      setMessage('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invio non riuscito')
    } finally {
      setLoading(false)
    }
  }

  const { fields, placeholders } = registration
  const sectors = registration.sectors.includes('Altro')
    ? registration.sectors
    : [...registration.sectors, 'Altro']

  return (
    <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className={ui.labelSm}>{fields.companyName}</span>
          <input
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder={placeholders.companyName}
            className={cn(ui.input, 'mt-1.5 border-[#e3e6ea] bg-[#f7f8fa]')}
            autoComplete="organization"
          />
        </label>
        <label className="block text-sm">
          <span className={ui.labelSm}>{fields.vat}</span>
          <input
            required
            value={vatNumber}
            onChange={(e) => setVatNumber(e.target.value)}
            placeholder={placeholders.vat}
            className={cn(ui.input, 'mt-1.5 border-[#e3e6ea] bg-[#f7f8fa] font-mono text-sm uppercase')}
          />
          {vatMessage ? (
            <p className="mt-1 text-xs text-amber-800">{vatMessage}</p>
          ) : null}
        </label>
        <label className="block text-sm">
          <span className={ui.labelSm}>Paese</span>
          <select
            required
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={cn(ui.select, 'mt-1.5 h-10 w-full rounded-lg border-[#e3e6ea] bg-[#f7f8fa]')}
          >
            <option value="IT">Italia</option>
            <option value="FR">Francia</option>
            <option value="DE">Germania</option>
            <option value="ES">Spagna</option>
            <option value="AT">Austria</option>
            <option value="BE">Belgio</option>
            <option value="NL">Paesi Bassi</option>
            <option value="CH">Svizzera</option>
            <option value="GB">Regno Unito</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className={ui.labelSm}>{fields.sector}</span>
          <select
            required
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className={cn(ui.select, 'mt-1.5 h-10 w-full rounded-lg border-[#e3e6ea] bg-[#f7f8fa]')}
          >
            {sectors.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        {sector === 'Altro' ? (
          <label className="block text-sm">
            <span className={ui.labelSm}>Specifica settore</span>
            <input
              required
              value={sectorOther}
              onChange={(e) => setSectorOther(e.target.value)}
              className={cn(ui.input, 'mt-1.5 border-[#e3e6ea] bg-[#f7f8fa]')}
            />
          </label>
        ) : null}
        <label className="block text-sm">
          <span className={ui.labelSm}>PEC</span>
          <input
            type="email"
            value={pec}
            onChange={(e) => setPec(e.target.value)}
            placeholder="nome@pec.it"
            className={cn(ui.input, 'mt-1.5 border-[#e3e6ea] bg-[#f7f8fa]')}
          />
        </label>
        <label className="block text-sm">
          <span className={ui.labelSm}>Codice SDI</span>
          <input
            value={sdiCode}
            onChange={(e) => setSdiCode(e.target.value.toUpperCase())}
            placeholder="0000000"
            className={cn(ui.input, 'mt-1.5 border-[#e3e6ea] bg-[#f7f8fa] font-mono uppercase')}
            maxLength={7}
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className={ui.labelSm}>Visura camerale (PDF o immagine)</span>
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            onChange={(e) => setVisuraFile(e.target.files?.[0] ?? null)}
            className="mt-1.5 block w-full text-sm text-idl-muted file:mr-3 file:rounded-md file:border-0 file:bg-idl-graphite file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
          />
        </label>
        <label className="block text-sm">
          <span className={ui.labelSm}>{fields.contactName}</span>
          <input
            required
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder={placeholders.contactName}
            className={cn(ui.input, 'mt-1.5 border-[#e3e6ea] bg-[#f7f8fa]')}
            autoComplete="name"
          />
        </label>
        <label className="block text-sm">
          <span className={ui.labelSm}>{fields.email}</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholders.email}
            className={cn(ui.input, 'mt-1.5 border-[#e3e6ea] bg-[#f7f8fa]')}
            autoComplete="email"
          />
        </label>
        <label className="block text-sm">
          <span className={ui.labelSm}>{fields.phone}</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={placeholders.phone}
            className={cn(ui.input, 'mt-1.5 border-[#e3e6ea] bg-[#f7f8fa]')}
            autoComplete="tel"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className={ui.labelSm}>{fields.message}</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className={cn(ui.input, 'mt-1.5 min-h-[80px] resize-y border-[#e3e6ea] bg-[#f7f8fa]')}
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-[9px] bg-idl-graphite py-3.5 text-[15px] font-bold text-white transition hover:bg-[#2a2d35] disabled:opacity-60"
      >
        {loading ? 'Invio in corso…' : registration.submitLabel}
      </button>
      <p className="text-center text-xs text-[#9298a3]">{registration.formNote}</p>
    </form>
  )
}
