'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Link } from '@/lib/navigation'
import { api } from '@/api/endpoints'
import { useLocale } from '@/context/locale-context'
import { useI18n } from '@/hooks/use-i18n'
import { useLocalePath } from '@/hooks/use-locale-path'
import { Button } from '@/components/Button'
import { ui } from '@/lib/ui-classes'
import { cn } from '@/utils/cn'

type Usage = 'home' | 'shop' | 'office' | 'outdoor' | 'install'
type Urgency = 'low' | 'medium' | 'high'

type Props = {
  title?: string
  description?: string
  className?: string
}

function CameraIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={19}
      height={19}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x={3} y={5} width={18} height={14} rx={2} />
      <circle cx={12} cy={12} r={3.2} />
      <path d="M8 5l1.5-2h5L16 5" />
    </svg>
  )
}

function ChipGroup<T extends string>({
  value,
  options,
  onChange,
  accent = false,
}: {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
  accent?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-[30px] px-3.5 py-1.5 text-[12.5px] font-semibold transition',
              active
                ? accent
                  ? 'bg-idl-amber text-white'
                  : 'bg-idl-ink text-white'
                : 'border border-[#e3e6ea] bg-white text-idl-graphite hover:border-idl-amber/40',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function PhotoUploadSlot({
  id,
  label,
  hint,
  file,
  previewUrl,
  onPick,
}: {
  id: string
  label: string
  hint: string
  file: File | null
  previewUrl: string | null
  onPick: (file: File | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      <div className="mb-2.5 font-mono text-[10.5px] tracking-[0.1em] text-idl-muted uppercase">
        {label}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative flex aspect-[3/2] w-full flex-col items-center justify-center overflow-hidden rounded-[10px]',
          'border-[1.5px] border-dashed border-[#d4d9df] bg-[#fafbfc] text-center transition hover:border-idl-amber/50',
        )}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- anteprima locale da File
          <img src={previewUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="px-4 text-[13px] leading-snug text-idl-muted">{hint}</span>
        )}
        {file ? (
          <span className="absolute bottom-2 rounded-md bg-idl-ink/75 px-2 py-1 text-[11px] font-semibold text-white">
            {file.name}
          </span>
        ) : null}
      </button>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="sr-only"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
    </div>
  )
}

export function ProductNotFoundLeadForm({ title, description, className }: Props) {
  const { t } = useI18n()
  const lp = useLocalePath()
  const { locale } = useLocale()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [productCode, setProductCode] = useState('')
  const [brand, setBrand] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [message, setMessage] = useState('')
  const [usage, setUsage] = useState<Usage>('home')
  const [urgency, setUrgency] = useState<Urgency>('medium')
  const [productPhoto, setProductPhoto] = useState<File | null>(null)
  const [socketPhoto, setSocketPhoto] = useState<File | null>(null)
  const [productPreview, setProductPreview] = useState<string | null>(null)
  const [socketPreview, setSocketPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function onProductPhoto(file: File | null) {
    if (productPreview) URL.revokeObjectURL(productPreview)
    setProductPhoto(file)
    setProductPreview(file ? URL.createObjectURL(file) : null)
  }

  function onSocketPhoto(file: File | null) {
    if (socketPreview) URL.revokeObjectURL(socketPreview)
    setSocketPhoto(file)
    setSocketPreview(file ? URL.createObjectURL(file) : null)
  }

  const usageOptions: Array<{ value: Usage; label: string }> = [
    { value: 'home', label: t('productNotFound.usageHome') },
    { value: 'shop', label: t('productNotFound.usageShop') },
    { value: 'office', label: t('productNotFound.usageOffice') },
    { value: 'outdoor', label: t('productNotFound.usageOutdoor') },
    { value: 'install', label: t('productNotFound.usageInstall') },
  ]

  const urgencyOptions: Array<{ value: Urgency; label: string }> = [
    { value: 'low', label: t('productNotFound.urgencyLow') },
    { value: 'medium', label: t('productNotFound.urgencyMedium') },
    { value: 'high', label: t('productNotFound.urgencyHigh') },
  ]

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const usageLabel = usageOptions.find((o) => o.value === usage)?.label ?? usage
      const urgencyLabel = urgencyOptions.find((o) => o.value === urgency)?.label ?? urgency
      const meta = [`${t('productNotFound.usage')}: ${usageLabel}`, `${t('productNotFound.urgency')}: ${urgencyLabel}`]
      const fullMessage = [meta.join('\n'), message.trim()].filter(Boolean).join('\n\n')

      await api.site.submitProductNotFoundInquiry({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        message: fullMessage || undefined,
        productCode: productCode.trim() || undefined,
        brand: brand.trim() || undefined,
        quantity: Number(quantity) || 1,
        usage: usageLabel,
        urgency: urgencyLabel,
        locale,
        productPhoto,
        socketPhoto,
      })
      toast.success(t('productNotFound.success'))
      setMessage('')
      setProductCode('')
      setBrand('')
      onProductPhoto(null)
      onSocketPhoto(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('productNotFound.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-idl-tech-border bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-8',
        className,
      )}
    >
      <div className="mb-1 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-[#f0e3d0] bg-[#fbf4ea] text-idl-amber">
          <CameraIcon />
        </span>
        <h2 className="text-xl font-extrabold tracking-tight text-idl-ink">
          {title ?? t('productNotFound.formTitle')}
        </h2>
      </div>
      <p className="mb-6 text-sm text-idl-muted">
        {description ?? t('productNotFound.formDescription')}
      </p>

      <form className="space-y-5" onSubmit={(e) => void onSubmit(e)}>
        <div className="grid gap-3 sm:grid-cols-2">
          <PhotoUploadSlot
            id="pnf-product-photo"
            label={t('productNotFound.photoProduct')}
            hint={t('productNotFound.photoProductHint')}
            file={productPhoto}
            previewUrl={productPreview}
            onPick={onProductPhoto}
          />
          <PhotoUploadSlot
            id="pnf-socket-photo"
            label={t('productNotFound.photoSocket')}
            hint={t('productNotFound.photoSocketHint')}
            file={socketPhoto}
            previewUrl={socketPreview}
            onPick={onSocketPhoto}
          />
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <label className="block text-sm">
            <span className={ui.labelSm}>{t('productNotFound.nameLabel')}</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('productNotFound.namePlaceholder')}
              className={cn(ui.input, 'mt-1.5 border-[#e3e6ea] bg-[#f7f8fa]')}
              autoComplete="name"
            />
          </label>
          <label className="block text-sm">
            <span className={ui.labelSm}>{t('common.email')}</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('productNotFound.emailPlaceholder')}
              className={cn(ui.input, 'mt-1.5 border-[#e3e6ea] bg-[#f7f8fa]')}
              autoComplete="email"
            />
          </label>
          <label className="block text-sm">
            <span className={ui.labelSm}>{t('productNotFound.phoneLabel')}</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('productNotFound.phonePlaceholder')}
              className={cn(ui.input, 'mt-1.5 border-[#e3e6ea] bg-[#f7f8fa]')}
              autoComplete="tel"
            />
          </label>
          <label className="block text-sm">
            <span className={ui.labelSm}>{t('productNotFound.codeLabel')}</span>
            <input
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              placeholder={t('productNotFound.codePlaceholder')}
              className={cn(ui.input, 'mt-1.5 border-[#e3e6ea] bg-[#f7f8fa] font-mono text-sm')}
            />
          </label>
          <label className="block text-sm">
            <span className={ui.labelSm}>{t('productNotFound.brandLabel')}</span>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder={t('productNotFound.brandPlaceholder')}
              className={cn(ui.input, 'mt-1.5 border-[#e3e6ea] bg-[#f7f8fa]')}
            />
          </label>
          <label className="block text-sm">
            <span className={ui.labelSm}>{t('common.quantity')}</span>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={cn(ui.input, 'mt-1.5 border-[#e3e6ea] bg-[#f7f8fa]')}
            />
          </label>
        </div>

        <div>
          <div className={cn(ui.labelSm, 'mb-2')}>{t('productNotFound.usage')}</div>
          <ChipGroup value={usage} options={usageOptions} onChange={setUsage} />
        </div>

        <div>
          <div className={cn(ui.labelSm, 'mb-2')}>{t('productNotFound.urgency')}</div>
          <ChipGroup value={urgency} options={urgencyOptions} onChange={setUrgency} accent />
        </div>

        <label className="block text-sm">
          <span className={ui.labelSm}>{t('productNotFound.messageLabel')}</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder={t('productNotFound.messagePlaceholder')}
            className={cn(ui.input, 'mt-1.5 min-h-[88px] resize-y border-[#e3e6ea] bg-[#f7f8fa]')}
          />
        </label>

        <Button type="submit" loading={loading} variant="technical" className="w-full py-3.5 text-[15px]">
          {t('productNotFound.submit')}
        </Button>

        <p className="text-center text-xs text-idl-muted">
          {t('productNotFound.privacyNote')}{' '}
          <Link to={lp('/privacy')} className="text-idl-brass underline">
            {t('productNotFound.privacyLink')}
          </Link>
          . {t('productNotFound.responseNote')}
        </p>
      </form>
    </div>
  )
}
