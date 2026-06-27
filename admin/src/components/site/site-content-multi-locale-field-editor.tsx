import { PlusIcon, Trash2Icon } from 'lucide-react'
import { fieldLabel, isTechnicalField, isTextareaField } from '@/features/site/site-content-labels'
import { contentMatchesSearch } from '@/features/site/site-content-search'
import { cloneContent, getAtPath, setAtPath } from '@/features/site/site-content-utils'
import { SITE_LOCALES, type SiteLocale } from '@/features/site/site.store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

const LOCALE_LABELS: Record<SiteLocale, string> = {
  IT: 'Italiano',
  EN: 'Inglese',
  ES: 'Spagnolo',
  FR: 'Francese',
  DE: 'Tedesco',
}

type SiteContentMultiLocaleFieldEditorProps = {
  value: unknown
  path: string[]
  draftsByLocale: Record<SiteLocale, Record<string, unknown>>
  onLocaleChange: (locale: SiteLocale, next: Record<string, unknown>) => void
  label?: string
  depth?: number
  searchQuery?: string
}

function getArrayAtPath(root: Record<string, unknown>, path: string[]) {
  let cursor: unknown = root
  for (const segment of path) {
    if (Array.isArray(cursor)) cursor = cursor[Number(segment)]
    else if (cursor && typeof cursor === 'object') cursor = (cursor as Record<string, unknown>)[segment]
  }
  return cursor
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

export function SiteContentMultiLocaleFieldEditor({
  value,
  path,
  draftsByLocale,
  onLocaleChange,
  label,
  depth = 0,
  searchQuery = '',
}: SiteContentMultiLocaleFieldEditorProps) {
  const key = path[path.length - 1]
  const fieldKey = typeof key === 'string' ? key : null

  if (searchQuery && !contentMatchesSearch(value, searchQuery, fieldKey)) {
    return null
  }

  if (typeof value === 'string') {
    const controlLabel = label ?? (fieldKey ? fieldLabel(fieldKey) : 'Testo')
    const technical = fieldKey ? isTechnicalField(fieldKey) : false
    const italianValue = getAtPath(draftsByLocale.IT, path)
    const sampleValue = typeof italianValue === 'string' ? italianValue : value
    const multiline =
      fieldKey ? isTextareaField(fieldKey) || sampleValue.length > 120 : sampleValue.length > 120

    if (technical) {
      return (
        <Field className="gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <FieldLabel className="mb-0">
              {controlLabel}
              <Badge variant="outline" className="ml-2 font-normal">
                tecnico
              </Badge>
            </FieldLabel>
          </div>
          <Input
            value={sampleValue}
            placeholder="Valore condiviso tra lingue…"
            onChange={(e) => {
              mutateAllLocales(draftsByLocale, onLocaleChange, (root) => {
                setAtPath(root, path, e.target.value)
              })
            }}
          />
          <FieldDescription>Non incluso nella traduzione automatica DeepL.</FieldDescription>
        </Field>
      )
    }

    return (
      <Field className="gap-2">
        <FieldLabel className="mb-0">{controlLabel}</FieldLabel>
        <div className="space-y-2 rounded-lg border border-border/70 bg-muted/10 p-3">
          {SITE_LOCALES.map((locale) => {
            const localeValue = getAtPath(draftsByLocale[locale], path)
            const text = typeof localeValue === 'string' ? localeValue : ''
            return (
              <div key={locale} className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">{LOCALE_LABELS[locale]}</Label>
                {multiline ? (
                  <Textarea
                    className="min-h-20 resize-y"
                    value={text}
                    placeholder={locale === 'IT' ? 'Testo sorgente per DeepL…' : 'Traduzione…'}
                    onChange={(e) => {
                      const next = cloneContent(draftsByLocale[locale])
                      setAtPath(next, path, e.target.value)
                      onLocaleChange(locale, next)
                    }}
                  />
                ) : (
                  <Input
                    value={text}
                    placeholder={locale === 'IT' ? 'Testo breve…' : 'Traduzione…'}
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

  if (typeof value === 'number') {
    return (
      <Field>
        <FieldLabel>{label ?? fieldLabel(String(key))}</FieldLabel>
        <Input
          type="number"
          value={value}
          onChange={(e) => {
            mutateAllLocales(draftsByLocale, onLocaleChange, (root) => {
              setAtPath(root, path, Number(e.target.value))
            })
          }}
        />
      </Field>
    )
  }

  if (typeof value === 'boolean') {
    return (
      <Field orientation="horizontal">
        <Switch
          checked={value}
          onCheckedChange={(checked) => {
            mutateAllLocales(draftsByLocale, onLocaleChange, (root) => {
              setAtPath(root, path, checked)
            })
          }}
        />
        <FieldLabel>{label ?? fieldLabel(String(key))}</FieldLabel>
      </Field>
    )
  }

  if (Array.isArray(value)) {
    const arrayLabel = label ?? (typeof key === 'string' ? fieldLabel(key) : 'Elenco')
    const isStringArray = value.every((item) => typeof item === 'string')
    const visibleItems = value
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !searchQuery || contentMatchesSearch(item, searchQuery, fieldKey))

    if (visibleItems.length === 0) return null

    return (
      <FieldGroup className="rounded-lg border border-border/70 bg-muted/20 p-3">
        <div className="flex items-center justify-between gap-2">
          <FieldLabel>{arrayLabel}</FieldLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              mutateAllLocales(draftsByLocale, onLocaleChange, (root) => {
                const current = getArrayAtPath(root, path)
                if (!Array.isArray(current)) return
                current.push(isStringArray ? '' : {})
                setAtPath(root, path, current)
              })
            }}
          >
            <PlusIcon data-icon="inline-start" />
            Aggiungi
          </Button>
        </div>
        <FieldGroup className="gap-3">
          {visibleItems.map(({ item, index }) => (
            <div
              key={`${path.join('.')}-${index}`}
              className="flex flex-col gap-2 rounded-md border border-dashed bg-background p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {fieldLabel(typeof key === 'string' ? key : 'item', index)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    mutateAllLocales(draftsByLocale, onLocaleChange, (root) => {
                      const current = getArrayAtPath(root, path)
                      if (!Array.isArray(current)) return
                      current.splice(index, 1)
                      setAtPath(root, path, current)
                    })
                  }}
                >
                  <Trash2Icon data-icon="inline-start" />
                  Rimuovi
                </Button>
              </div>
              <SiteContentMultiLocaleFieldEditor
                value={item}
                path={[...path, String(index)]}
                draftsByLocale={draftsByLocale}
                onLocaleChange={onLocaleChange}
                depth={depth + 1}
                searchQuery={searchQuery}
              />
            </div>
          ))}
        </FieldGroup>
      </FieldGroup>
    )
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, childValue]) => !searchQuery || contentMatchesSearch(childValue, searchQuery, null),
    )
    if (entries.length === 0) return null

    const objectLabel = label ?? (typeof key === 'string' ? fieldLabel(key) : undefined)

    return (
      <FieldGroup className={depth > 0 ? 'gap-3 rounded-lg border border-border/60 bg-muted/10 p-3' : 'gap-4'}>
        {objectLabel ? (
          <FieldLabel className="text-base font-semibold text-gray-900">{objectLabel}</FieldLabel>
        ) : null}
        {entries.map(([childKey, childValue]) => (
          <SiteContentMultiLocaleFieldEditor
            key={[...path, childKey].join('.')}
            value={childValue}
            path={[...path, childKey]}
            draftsByLocale={draftsByLocale}
            onLocaleChange={onLocaleChange}
            depth={depth + 1}
            searchQuery={searchQuery}
          />
        ))}
      </FieldGroup>
    )
  }

  return null
}
