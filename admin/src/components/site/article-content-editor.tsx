import { ChevronDownIcon, ChevronUpIcon, ImageIcon, Trash2Icon } from 'lucide-react'
import { cloneContent, getAtPath, setAtPath } from '@/features/site/site-content-utils'
import { SITE_LOCALES, type SiteLocale } from '@/features/site/site.store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const LOCALE_LABELS: Record<SiteLocale, string> = {
  IT: 'Italiano',
  EN: 'Inglese',
  ES: 'Spagnolo',
  FR: 'Francese',
  DE: 'Tedesco',
}

const BLOCK_KIND_LABELS: Record<string, string> = {
  prose: 'Testo',
  image: 'Immagine',
  split: 'Immagine + testo',
  gallery: 'Galleria',
  bullets: 'Elenco puntato',
  cards: 'Card prodotti',
  features: 'Box informativi',
  cta: 'Call to action',
}

const BLOCK_TEMPLATES: Record<string, Record<string, unknown>> = {
  prose: { kind: 'prose', paragraphs: [''] },
  image: { kind: 'image', imageUrl: '', alt: '', layout: 'wide' },
  split: { kind: 'split', layout: 'image-right', imageUrl: '', alt: '', paragraphs: [''] },
  gallery: { kind: 'gallery', title: '', items: [{ imageUrl: '', alt: '' }] },
  bullets: { kind: 'bullets', title: '', items: [''] },
  cards: {
    kind: 'cards',
    title: '',
    subtitle: '',
    items: [{ title: '', description: '', href: '/catalogo?world=design&q=', imageUrl: '' }],
  },
  features: { kind: 'features', title: '', items: [{ title: '', description: '' }] },
  cta: { kind: 'cta', title: '', primaryLabel: '', primaryHref: '', variant: 'accent' },
}

type Props = {
  draftsByLocale: Record<SiteLocale, Record<string, unknown>>
  onLocaleChange: (locale: SiteLocale, next: Record<string, unknown>) => void
  path?: string[]
}

function mutateAllLocales(
  draftsByLocale: Record<SiteLocale, Record<string, unknown>>,
  onLocaleChange: (locale: SiteLocale, next: Record<string, unknown>) => void,
  mutator: (root: Record<string, unknown>) => void,
) {
  for (const locale of SITE_LOCALES) {
    const next = cloneContent(draftsByLocale[locale])
    mutator(next)
    onLocaleChange(locale, next)
  }
}

function ImagePreview({ url }: { url: string }) {
  if (!url.trim()) {
    return (
      <div className="flex h-28 items-center justify-center rounded-md border border-dashed bg-muted/30 text-muted-foreground">
        <ImageIcon className="size-5" />
      </div>
    )
  }
  return <img src={url} alt="" className="h-28 w-full rounded-md border object-cover" />
}

function LocaleTextFields({
  label,
  path,
  draftsByLocale,
  onLocaleChange,
  multiline = false,
}: {
  label: string
  path: string[]
  draftsByLocale: Record<SiteLocale, Record<string, unknown>>
  onLocaleChange: (locale: SiteLocale, next: Record<string, unknown>) => void
  multiline?: boolean
}) {
  return (
    <Field className="gap-2">
      <FieldLabel>{label}</FieldLabel>
      <div className="space-y-2 rounded-lg border bg-muted/10 p-3">
        {SITE_LOCALES.map((locale) => {
          const value = getAtPath(draftsByLocale[locale], path)
          const text = typeof value === 'string' ? value : ''
          return (
            <div key={locale} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{LOCALE_LABELS[locale]}</Label>
              {multiline ? (
                <Textarea
                  className="min-h-20"
                  value={text}
                  onChange={(e) => {
                    const next = cloneContent(draftsByLocale[locale])
                    setAtPath(next, path, e.target.value)
                    onLocaleChange(locale, next)
                  }}
                />
              ) : (
                <Input
                  value={text}
                  onChange={(e) => {
                    const next = cloneContent(draftsByLocale[locale])
                    setAtPath(next, path, e.target.value)
                    onLocaleChange(locale, next)
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </Field>
  )
}

function TechnicalField({
  label,
  path,
  draftsByLocale,
  onLocaleChange,
  placeholder,
}: {
  label: string
  path: string[]
  draftsByLocale: Record<SiteLocale, Record<string, unknown>>
  onLocaleChange: (locale: SiteLocale, next: Record<string, unknown>) => void
  placeholder?: string
}) {
  const value = getAtPath(draftsByLocale.IT, path)
  const text = typeof value === 'string' ? value : ''
  return (
    <Field>
      <FieldLabel>
        {label}
        <Badge variant="outline" className="ml-2 font-normal">
          condiviso
        </Badge>
      </FieldLabel>
      <Input
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          mutateAllLocales(draftsByLocale, onLocaleChange, (root) => {
            setAtPath(root, path, e.target.value)
          })
        }}
      />
      <FieldDescription>Stesso valore per tutte le lingue (URL, layout, link).</FieldDescription>
    </Field>
  )
}

export function ArticleCoverEditor({ draftsByLocale, onLocaleChange, path = ['coverImage'] }: Props) {
  const cover = getAtPath(draftsByLocale.IT, path)
  const imageUrl =
    cover && typeof cover === 'object' && 'imageUrl' in cover && typeof cover.imageUrl === 'string'
      ? cover.imageUrl
      : ''

  return (
    <FieldGroup className="gap-4 rounded-lg border bg-background p-4">
      <FieldLabel className="text-base font-semibold">Immagine di copertina</FieldLabel>
      {imageUrl ? <ImagePreview url={imageUrl} /> : null}
      <TechnicalField
        label="URL immagine copertina"
        path={[...path, 'imageUrl']}
        draftsByLocale={draftsByLocale}
        onLocaleChange={onLocaleChange}
        placeholder="https://…"
      />
      <LocaleTextFields label="Testo alternativo (alt)" path={[...path, 'alt']} draftsByLocale={draftsByLocale} onLocaleChange={onLocaleChange} />
      <LocaleTextFields label="Didascalia" path={[...path, 'caption']} draftsByLocale={draftsByLocale} onLocaleChange={onLocaleChange} multiline />
    </FieldGroup>
  )
}

function BlockEditor({
  blockIndex,
  basePath,
  draftsByLocale,
  onLocaleChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  blockIndex: number
  basePath: string[]
  draftsByLocale: Record<SiteLocale, Record<string, unknown>>
  onLocaleChange: (locale: SiteLocale, next: Record<string, unknown>) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
}) {
  const block = getAtPath(draftsByLocale.IT, [...basePath, String(blockIndex)])
  const kind = block && typeof block === 'object' && 'kind' in block ? String(block.kind) : 'prose'
  const blockPath = [...basePath, String(blockIndex)]

  return (
    <div className="rounded-lg border border-dashed bg-background p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{BLOCK_KIND_LABELS[kind] ?? kind}</Badge>
          <span className="text-sm text-muted-foreground">Blocco {blockIndex + 1}</span>
        </div>
        <div className="flex gap-1">
          <Button type="button" size="icon" variant="ghost" onClick={onMoveUp}>
            <ChevronDownIcon className="size-4 rotate-180" />
          </Button>
          <Button type="button" size="icon" variant="ghost" onClick={onMoveDown}>
            <ChevronDownIcon className="size-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" onClick={onRemove}>
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      </div>

      {kind === 'prose' ? (
        <LocaleTextFields label="Paragrafo" path={[...blockPath, 'paragraphs', '0']} draftsByLocale={draftsByLocale} onLocaleChange={onLocaleChange} multiline />
      ) : null}

      {kind === 'image' || kind === 'split' ? (
        <FieldGroup className="gap-4">
          <ImagePreview url={typeof getAtPath(draftsByLocale.IT, [...blockPath, 'imageUrl']) === 'string' ? (getAtPath(draftsByLocale.IT, [...blockPath, 'imageUrl']) as string) : ''} />
          <TechnicalField label="URL immagine" path={[...blockPath, 'imageUrl']} draftsByLocale={draftsByLocale} onLocaleChange={onLocaleChange} />
          <LocaleTextFields label="Alt" path={[...blockPath, 'alt']} draftsByLocale={draftsByLocale} onLocaleChange={onLocaleChange} />
          <LocaleTextFields label="Didascalia" path={[...blockPath, 'caption']} draftsByLocale={draftsByLocale} onLocaleChange={onLocaleChange} />
          {kind === 'image' ? (
            <Field>
              <FieldLabel>Layout immagine</FieldLabel>
              <Select
                value={String(getAtPath(draftsByLocale.IT, [...blockPath, 'layout']) ?? 'wide')}
                onValueChange={(value) => {
                  if (!value) return
                  mutateAllLocales(draftsByLocale, onLocaleChange, (root) => setAtPath(root, [...blockPath, 'layout'], value))
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inline">Inline</SelectItem>
                  <SelectItem value="wide">Wide</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                  <SelectItem value="portrait">Portrait</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          ) : (
            <Field>
              <FieldLabel>Posizione immagine</FieldLabel>
              <Select
                value={String(getAtPath(draftsByLocale.IT, [...blockPath, 'layout']) ?? 'image-right')}
                onValueChange={(value) => {
                  if (!value) return
                  mutateAllLocales(draftsByLocale, onLocaleChange, (root) => setAtPath(root, [...blockPath, 'layout'], value))
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="image-left">Sinistra</SelectItem>
                  <SelectItem value="image-right">Destra</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
          {kind === 'split' ? (
            <>
              <LocaleTextFields label="Titolo" path={[...blockPath, 'title']} draftsByLocale={draftsByLocale} onLocaleChange={onLocaleChange} />
              <LocaleTextFields label="Testo" path={[...blockPath, 'paragraphs', '0']} draftsByLocale={draftsByLocale} onLocaleChange={onLocaleChange} multiline />
            </>
          ) : null}
        </FieldGroup>
      ) : null}

      {kind === 'bullets' ? (
        <FieldGroup className="gap-4">
          <LocaleTextFields label="Titolo elenco" path={[...blockPath, 'title']} draftsByLocale={draftsByLocale} onLocaleChange={onLocaleChange} />
          <LocaleTextFields label="Primo punto" path={[...blockPath, 'items', '0']} draftsByLocale={draftsByLocale} onLocaleChange={onLocaleChange} />
        </FieldGroup>
      ) : null}

      {kind === 'cards' ? (
        <FieldGroup className="gap-4">
          <LocaleTextFields label="Titolo sezione" path={[...blockPath, 'title']} draftsByLocale={draftsByLocale} onLocaleChange={onLocaleChange} />
          <LocaleTextFields label="Sottotitolo" path={[...blockPath, 'subtitle']} draftsByLocale={draftsByLocale} onLocaleChange={onLocaleChange} />
          {[0, 1, 2, 3].map((cardIndex) => {
            const cardPath = [...blockPath, 'items', String(cardIndex)]
            const card = getAtPath(draftsByLocale.IT, cardPath)
            if (!card && cardIndex > 0) return null
            return (
              <div key={cardIndex} className="rounded-md border p-3">
                <FieldLabel>Card prodotto {cardIndex + 1}</FieldLabel>
                <div className="mt-2 space-y-3">
                  <ImagePreview url={typeof getAtPath(draftsByLocale.IT, [...cardPath, 'imageUrl']) === 'string' ? (getAtPath(draftsByLocale.IT, [...cardPath, 'imageUrl']) as string) : ''} />
                  <TechnicalField label="URL immagine" path={[...cardPath, 'imageUrl']} draftsByLocale={draftsByLocale} onLocaleChange={onLocaleChange} />
                  <TechnicalField label="Link prodotto" path={[...cardPath, 'href']} draftsByLocale={draftsByLocale} onLocaleChange={onLocaleChange} />
                  <LocaleTextFields label="Nome prodotto" path={[...cardPath, 'title']} draftsByLocale={draftsByLocale} onLocaleChange={onLocaleChange} />
                  <LocaleTextFields label="Descrizione" path={[...cardPath, 'description']} draftsByLocale={draftsByLocale} onLocaleChange={onLocaleChange} multiline />
                </div>
              </div>
            )
          })}
        </FieldGroup>
      ) : null}

      {kind === 'gallery' ? (
        <FieldGroup className="gap-4">
          <LocaleTextFields label="Titolo galleria" path={[...blockPath, 'title']} draftsByLocale={draftsByLocale} onLocaleChange={onLocaleChange} />
          {[0, 1, 2].map((itemIndex) => (
            <div key={itemIndex} className="rounded-md border p-3">
              <FieldLabel>Immagine {itemIndex + 1}</FieldLabel>
              <div className="mt-2 space-y-3">
                <ImagePreview url={typeof getAtPath(draftsByLocale.IT, [...blockPath, 'items', String(itemIndex), 'imageUrl']) === 'string' ? (getAtPath(draftsByLocale.IT, [...blockPath, 'items', String(itemIndex), 'imageUrl']) as string) : ''} />
                <TechnicalField label="URL" path={[...blockPath, 'items', String(itemIndex), 'imageUrl']} draftsByLocale={draftsByLocale} onLocaleChange={onLocaleChange} />
                <LocaleTextFields label="Alt" path={[...blockPath, 'items', String(itemIndex), 'alt']} draftsByLocale={draftsByLocale} onLocaleChange={onLocaleChange} />
                <LocaleTextFields label="Didascalia" path={[...blockPath, 'items', String(itemIndex), 'caption']} draftsByLocale={draftsByLocale} onLocaleChange={onLocaleChange} />
              </div>
            </div>
          ))}
        </FieldGroup>
      ) : null}

      {kind === 'features' || kind === 'cta' ? (
        <p className="text-sm text-muted-foreground">
          Blocco {BLOCK_KIND_LABELS[kind]}: usa l&apos;editor JSON nella sezione sotto per modifiche avanzate.
        </p>
      ) : null}
    </div>
  )
}

export function ArticleBlocksEditor({ draftsByLocale, onLocaleChange, path = ['blocks'] }: Props) {
  const blocks = getAtPath(draftsByLocale.IT, path)
  const items = Array.isArray(blocks) ? blocks : []

  function moveBlock(from: number, to: number) {
    if (to < 0 || to >= items.length) return
    mutateAllLocales(draftsByLocale, onLocaleChange, (root) => {
      const current = getAtPath(root, path)
      if (!Array.isArray(current)) return
      const [item] = current.splice(from, 1)
      current.splice(to, 0, item)
      setAtPath(root, path, current)
    })
  }

  return (
    <FieldGroup className="gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FieldLabel className="text-base font-semibold">Blocchi articolo</FieldLabel>
        <Select
          onValueChange={(kind) => {
            const blockKind = String(kind ?? '')
            if (!blockKind || !BLOCK_TEMPLATES[blockKind]) return
            mutateAllLocales(draftsByLocale, onLocaleChange, (root) => {
              const current = getAtPath(root, path)
              const next = Array.isArray(current) ? [...current] : []
              next.push(structuredClone(BLOCK_TEMPLATES[blockKind]))
              setAtPath(root, path, next)
            })
          }}
        >
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Aggiungi blocco…" /></SelectTrigger>
          <SelectContent>
            {Object.entries(BLOCK_KIND_LABELS).map(([kind, label]) => (
              <SelectItem key={kind} value={kind}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Nessun blocco.</p>
      ) : (
        items.map((_, index) => (
          <BlockEditor
            key={`block-${index}`}
            blockIndex={index}
            basePath={path}
            draftsByLocale={draftsByLocale}
            onLocaleChange={onLocaleChange}
            onMoveUp={() => moveBlock(index, index - 1)}
            onMoveDown={() => moveBlock(index, index + 1)}
            onRemove={() => {
              mutateAllLocales(draftsByLocale, onLocaleChange, (root) => {
                const current = getAtPath(root, path)
                if (!Array.isArray(current)) return
                current.splice(index, 1)
                setAtPath(root, path, current)
              })
            }}
          />
        ))
      )}
    </FieldGroup>
  )
}

export function ArticleContentEditor(props: Props) {
  return (
    <div className="space-y-6">
      <ArticleCoverEditor {...props} />
      <ArticleBlocksEditor {...props} />
    </div>
  )
}
