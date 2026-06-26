import { PlusIcon, Trash2Icon } from 'lucide-react'
import { fieldLabel, isTechnicalField, isTextareaField } from '@/features/site/site-content-labels'
import { setAtPath } from '@/features/site/site-content-utils'
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
}

export function SiteContentFieldEditor({
  value,
  path,
  root,
  onRootChange,
  label,
  depth = 0,
}: SiteContentFieldEditorProps) {
  const key = path[path.length - 1]

  if (typeof value === 'string') {
    const fieldKey = typeof key === 'string' ? key : ''
    const controlLabel = label ?? (fieldKey ? fieldLabel(fieldKey) : 'Testo')
    const technical = fieldKey ? isTechnicalField(fieldKey) : false
    const multiline = fieldKey ? isTextareaField(fieldKey) || value.length > 120 : value.length > 120

    return (
      <Field>
        <FieldLabel>
          {controlLabel}
          {technical ? (
            <Badge variant="outline" className="ml-2 font-normal">
              tecnico
            </Badge>
          ) : null}
        </FieldLabel>
        {multiline ? (
          <Textarea
            className="min-h-24"
            value={value}
            onChange={(e) => {
              const next = structuredClone(root)
              setAtPath(next, path, e.target.value)
              onRootChange(next)
            }}
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => {
              const next = structuredClone(root)
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
            const next = structuredClone(root)
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
            const next = structuredClone(root)
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

    return (
      <FieldGroup className="rounded-lg border border-border/70 p-3">
        <div className="flex items-center justify-between gap-2">
          <FieldLabel>{arrayLabel}</FieldLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const next = structuredClone(root)
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
        <FieldGroup>
          {value.map((item, index) => (
            <div key={`${path.join('.')}-${index}`} className="flex flex-col gap-2 rounded-md border border-dashed p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {fieldLabel(typeof key === 'string' ? key : 'item', index)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const next = structuredClone(root)
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
              />
            </div>
          ))}
        </FieldGroup>
      </FieldGroup>
    )
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    const objectLabel = label ?? (typeof key === 'string' ? fieldLabel(key) : undefined)

    return (
      <FieldGroup className={depth > 0 ? 'rounded-lg border border-border/60 p-3' : undefined}>
        {objectLabel ? <FieldLabel className="text-base">{objectLabel}</FieldLabel> : null}
        {entries.map(([childKey, childValue]) => (
          <SiteContentFieldEditor
            key={[...path, childKey].join('.')}
            value={childValue}
            path={[...path, childKey]}
            root={root}
            onRootChange={onRootChange}
            depth={depth + 1}
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
