import { PlusIcon, Trash2Icon } from 'lucide-react'
import { fieldLabel, isTechnicalField, isTextareaField } from '@/features/site/site-content-labels'
import { contentMatchesSearch } from '@/features/site/site-content-search'
import { cloneContent, setAtPath } from '@/features/site/site-content-utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

type SiteContentFieldEditorProps = {
  value: unknown
  path: string[]
  root: Record<string, unknown>
  onRootChange: (next: Record<string, unknown>) => void
  label?: string
  depth?: number
  searchQuery?: string
}

export function SiteContentFieldEditor({
  value,
  path,
  root,
  onRootChange,
  label,
  depth = 0,
  searchQuery = '',
}: SiteContentFieldEditorProps) {
  const key = path[path.length - 1]
  const fieldKey = typeof key === 'string' ? key : null

  if (searchQuery && !contentMatchesSearch(value, searchQuery, fieldKey)) {
    return null
  }

  if (typeof value === 'string') {
    const controlLabel = label ?? (fieldKey ? fieldLabel(fieldKey) : 'Testo')
    const technical = fieldKey ? isTechnicalField(fieldKey) : false
    const multiline = fieldKey ? isTextareaField(fieldKey) || value.length > 120 : value.length > 120

    return (
      <Field className="gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <FieldLabel className="mb-0">
            {controlLabel}
            {technical ? (
              <Badge variant="outline" className="ml-2 font-normal">
                tecnico
              </Badge>
            ) : null}
          </FieldLabel>
          {multiline ? (
            <span className="text-xs tabular-nums text-muted-foreground">{value.length} car.</span>
          ) : null}
        </div>
        {multiline ? (
          <Textarea
            className="min-h-24 resize-y"
            value={value}
            placeholder="Testo visibile sul sito…"
            onChange={(e) => {
              const next = cloneContent(root)
              setAtPath(next, path, e.target.value)
              onRootChange(next)
            }}
          />
        ) : (
          <Input
            value={value}
            placeholder="Testo breve…"
            onChange={(e) => {
              const next = cloneContent(root)
              setAtPath(next, path, e.target.value)
              onRootChange(next)
            }}
          />
        )}
        {technical ? (
          <FieldDescription>Non incluso nella traduzione automatica DeepL.</FieldDescription>
        ) : null}
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
            const next = cloneContent(root)
            setAtPath(next, path, Number(e.target.value))
            onRootChange(next)
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
            const next = cloneContent(root)
            setAtPath(next, path, checked)
            onRootChange(next)
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
              const next = cloneContent(root)
              const current = getArrayAtPath(next, path)
              if (!Array.isArray(current)) return
              current.push(isStringArray ? '' : {})
              setAtPath(next, path, current)
              onRootChange(next)
            }}
          >
            <PlusIcon data-icon="inline-start" />
            Aggiungi
          </Button>
        </div>
        <FieldGroup className="gap-3">
          {visibleItems.map(({ item, index }) => (
            <div key={`${path.join('.')}-${index}`} className="flex flex-col gap-2 rounded-md border border-dashed bg-background p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {fieldLabel(typeof key === 'string' ? key : 'item', index)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const next = cloneContent(root)
                    const current = getArrayAtPath(next, path)
                    if (!Array.isArray(current)) return
                    current.splice(index, 1)
                    setAtPath(next, path, current)
                    onRootChange(next)
                  }}
                >
                  <Trash2Icon data-icon="inline-start" />
                  Rimuovi
                </Button>
              </div>
              <SiteContentFieldEditor
                value={item}
                path={[...path, String(index)]}
                root={root}
                onRootChange={onRootChange}
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
    const entries = Object.entries(value as Record<string, unknown>).filter(([, childValue]) =>
      !searchQuery || contentMatchesSearch(childValue, searchQuery, null),
    )
    if (entries.length === 0) return null

    const objectLabel = label ?? (typeof key === 'string' ? fieldLabel(key) : undefined)

    return (
      <FieldGroup className={depth > 0 ? 'gap-3 rounded-lg border border-border/60 bg-muted/10 p-3' : 'gap-4'}>
        {objectLabel ? <FieldLabel className="text-base font-semibold text-gray-900">{objectLabel}</FieldLabel> : null}
        {entries.map(([childKey, childValue]) => (
          <SiteContentFieldEditor
            key={[...path, childKey].join('.')}
            value={childValue}
            path={[...path, childKey]}
            root={root}
            onRootChange={onRootChange}
            depth={depth + 1}
            searchQuery={searchQuery}
          />
        ))}
      </FieldGroup>
    )
  }

  return null
}

function getArrayAtPath(root: Record<string, unknown>, path: string[]) {
  let cursor: unknown = root
  for (const segment of path) {
    if (Array.isArray(cursor)) cursor = cursor[Number(segment)]
    else if (cursor && typeof cursor === 'object') cursor = (cursor as Record<string, unknown>)[segment]
  }
  return cursor
}
