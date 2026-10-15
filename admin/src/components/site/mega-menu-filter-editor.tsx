import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  LinkIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'
import { adminApi } from '@/lib/api'
import {
  buildNavFilterHref,
  defaultWorldForMenu,
  filterKindLabel,
  isFilterPinnedLink,
  optionsForFilterKind,
  SITE_NAV_FILTER_KINDS,
  type CatalogFiltersAdminDTO,
  type MegaMenuLink,
  type MegaMenuPanel,
  type SiteNavFilterKind,
} from '@/features/site/nav-filter-link'
import { type SiteLocale } from '@/features/site/site.store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { SiteContentMultiLocaleFieldEditor } from '@/components/site/site-content-multi-locale-field-editor'
import { toast } from 'sonner'

type Props = {
  menuId: string
  panel: MegaMenuPanel
  draftsByLocale: Record<SiteLocale, Record<string, unknown>>
  onLocaleChange: (locale: SiteLocale, nextPanel: Record<string, unknown>) => void
}

type PickerState = {
  columnIndex: number
  kind: SiteNavFilterKind
  query: string
} | null

function asPanel(value: unknown): MegaMenuPanel {
  if (!value || typeof value !== 'object') return { columns: [] }
  const panel = value as MegaMenuPanel
  return {
    ...panel,
    columns: Array.isArray(panel.columns) ? panel.columns : [],
  }
}

function mutateAllLocales(
  draftsByLocale: Record<SiteLocale, Record<string, unknown>>,
  onLocaleChange: Props['onLocaleChange'],
  mutator: (panel: MegaMenuPanel) => MegaMenuPanel,
) {
  for (const locale of Object.keys(draftsByLocale) as SiteLocale[]) {
    const current = asPanel(draftsByLocale[locale])
    onLocaleChange(locale, mutator(structuredClone(current)) as unknown as Record<string, unknown>)
  }
}

export function MegaMenuFilterEditor({ menuId, panel, draftsByLocale, onLocaleChange }: Props) {
  const world = defaultWorldForMenu(menuId)
  const [filters, setFilters] = useState<CatalogFiltersAdminDTO | null>(null)
  const [loadingFilters, setLoadingFilters] = useState(false)
  const [picker, setPicker] = useState<PickerState>(null)
  const [customDraft, setCustomDraft] = useState<{ columnIndex: number; label: string; href: string } | null>(
    null,
  )

  useEffect(() => {
    let cancelled = false
    setLoadingFilters(true)
    const query = new URLSearchParams({ locale: 'IT', world })
    void adminApi<CatalogFiltersAdminDTO>(`/catalog/filters?${query}`)
      .then((data) => {
        if (!cancelled) setFilters(data)
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Impossibile caricare i filtri Odoo')
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingFilters(false)
      })
    return () => {
      cancelled = true
    }
  }, [world])

  const pickerOptions = useMemo(() => {
    if (!picker) return []
    const options = optionsForFilterKind(filters, picker.kind)
    const q = picker.query.trim().toLowerCase()
    if (!q) return options.slice(0, 80)
    return options
      .filter((opt) => opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q))
      .slice(0, 80)
  }, [filters, picker])

  function updateColumnTitle(columnIndex: number, title: string) {
    // Solo IT: le altre lingue restano a DeepL / traduzione manuale.
    const current = asPanel(draftsByLocale.IT)
    const next = structuredClone(current)
    const column = next.columns[columnIndex]
    if (!column) return
    column.title = title
    onLocaleChange('IT', next as unknown as Record<string, unknown>)
  }

  function moveLink(columnIndex: number, linkIndex: number, direction: -1 | 1) {
    mutateAllLocales(draftsByLocale, onLocaleChange, (next) => {
      const column = next.columns[columnIndex]
      if (!column) return next
      const target = linkIndex + direction
      if (target < 0 || target >= column.links.length) return next
      const copy = [...column.links]
      const [item] = copy.splice(linkIndex, 1)
      if (!item) return next
      copy.splice(target, 0, item)
      column.links = copy
      return next
    })
  }

  function removeLink(columnIndex: number, linkIndex: number) {
    mutateAllLocales(draftsByLocale, onLocaleChange, (next) => {
      const column = next.columns[columnIndex]
      if (!column) return next
      column.links = column.links.filter((_, index) => index !== linkIndex)
      return next
    })
  }

  function addFilterLink(columnIndex: number, kind: SiteNavFilterKind, value: string, label: string) {
    const href = buildNavFilterHref(kind, value, world)
    const link: MegaMenuLink = {
      label,
      href,
      filterKind: kind,
      filterValue: value,
      filterWorld: world,
    }
    mutateAllLocales(draftsByLocale, onLocaleChange, (next) => {
      const column = next.columns[columnIndex]
      if (!column) return next
      column.links = [...column.links, link]
      return next
    })
    setPicker(null)
  }

  function addCustomLink(columnIndex: number, label: string, href: string) {
    const link: MegaMenuLink = { label: label.trim() || 'Link', href: href.trim() || '/' }
    mutateAllLocales(draftsByLocale, onLocaleChange, (next) => {
      const column = next.columns[columnIndex]
      if (!column) return next
      column.links = [...column.links, link]
      return next
    })
    setCustomDraft(null)
  }

  function addColumn() {
    mutateAllLocales(draftsByLocale, onLocaleChange, (next) => ({
      ...next,
      columns: [...next.columns, { title: 'NUOVA COLONNA', links: [] }],
    }))
  }

  function removeColumn(columnIndex: number) {
    mutateAllLocales(draftsByLocale, onLocaleChange, (next) => ({
      ...next,
      columns: next.columns.filter((_, index) => index !== columnIndex),
    }))
  }

  const promoDrafts = Object.fromEntries(
    (Object.keys(draftsByLocale) as SiteLocale[]).map((locale) => {
      const localePanel = asPanel(draftsByLocale[locale])
      return [
        locale,
        {
          eyebrow: localePanel.eyebrow ?? '',
          allSocketsCta: localePanel.allSocketsCta ?? '',
          promo: localePanel.promo ?? {
            title: '',
            description: '',
            ctaLabel: '',
            ctaHref: '',
            variant: world === 'design' ? 'design' : 'technical',
          },
        },
      ]
    }),
  ) as unknown as Record<SiteLocale, Record<string, unknown>>

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Fissa voci del menu su filtri Odoo (categoria, tag, brand, …). L’etichetta in vetrina arriva
        automaticamente tradotta da Odoo per ogni lingua.
      </p>

      {panel.columns.map((column, columnIndex) => (
        <div key={`col-${columnIndex}`} className="space-y-3 rounded-lg border p-3">
          <div className="flex flex-wrap items-end gap-2">
            <Field className="min-w-0 flex-1 gap-1.5">
              <FieldLabel>Titolo colonna (IT)</FieldLabel>
              <Input
                value={column.title}
                onChange={(e) => updateColumnTitle(columnIndex, e.target.value)}
                placeholder="Es. TECNOLOGIA"
              />
            </Field>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Elimina colonna"
              onClick={() => removeColumn(columnIndex)}
            >
              <Trash2Icon className="size-4" />
            </Button>
          </div>

          <ul className="space-y-2">
            {column.links.map((link, linkIndex) => {
              const pinned = isFilterPinnedLink(link)
              return (
                <li
                  key={`${link.filterKind ?? 'custom'}-${link.filterValue ?? link.href}-${linkIndex}`}
                  className="flex flex-wrap items-center gap-2 rounded-md border bg-white px-3 py-2"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900">{link.label || '—'}</span>
                      {pinned && link.filterKind ? (
                        <Badge variant="secondary">{filterKindLabel(link.filterKind)}</Badge>
                      ) : (
                        <Badge variant="outline">Link fisso</Badge>
                      )}
                    </div>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {pinned
                        ? `${link.filterKind}=${link.filterValue}${link.filterWorld ? ` · ${link.filterWorld}` : ''}`
                        : link.href}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Sposta su"
                      onClick={() => moveLink(columnIndex, linkIndex, -1)}
                      disabled={linkIndex === 0}
                    >
                      <ArrowUpIcon className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Sposta giù"
                      onClick={() => moveLink(columnIndex, linkIndex, 1)}
                      disabled={linkIndex === column.links.length - 1}
                    >
                      <ArrowDownIcon className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Rimuovi voce"
                      onClick={() => removeLink(columnIndex, linkIndex)}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                </li>
              )
            })}
            {column.links.length === 0 ? (
              <li className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                Nessuna voce in questa colonna.
              </li>
            ) : null}
          </ul>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setPicker({
                  columnIndex,
                  kind: menuId === 'arredo' ? 'tipologia' : 'tag',
                  query: '',
                })
              }
              disabled={loadingFilters}
            >
              <PlusIcon className="size-4" />
              Aggiungi filtro Odoo
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCustomDraft({ columnIndex, label: '', href: '/' })}
            >
              <LinkIcon className="size-4" />
              Link personalizzato
            </Button>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addColumn}>
        <PlusIcon className="size-4" />
        Aggiungi colonna
      </Button>

      <div className="rounded-lg border p-3">
        <p className="mb-3 text-sm font-medium text-gray-900">Promo e testi laterali</p>
        <SiteContentMultiLocaleFieldEditor
          value={promoDrafts.IT}
          path={[]}
          draftsByLocale={promoDrafts}
          onLocaleChange={(locale, nextRoot) => {
            const current = asPanel(draftsByLocale[locale])
            onLocaleChange(locale, {
              ...current,
              eyebrow: typeof nextRoot.eyebrow === 'string' ? nextRoot.eyebrow : current.eyebrow,
              allSocketsCta:
                typeof nextRoot.allSocketsCta === 'string' ? nextRoot.allSocketsCta : current.allSocketsCta,
              promo:
                nextRoot.promo && typeof nextRoot.promo === 'object'
                  ? (nextRoot.promo as MegaMenuPanel['promo'])
                  : current.promo,
            } as unknown as Record<string, unknown>)
          }}
        />
      </div>

      <Sheet open={Boolean(picker)} onOpenChange={(open) => !open && setPicker(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Aggiungi filtro Odoo</SheetTitle>
            <SheetDescription>
              Scegli un’entità dal catalogo. In storefront l’etichetta seguirà la lingua Odoo.
            </SheetDescription>
          </SheetHeader>
          {picker ? (
            <div className="flex min-h-0 flex-1 flex-col gap-3 px-4">
              <Field className="gap-1.5">
                <FieldLabel>Tipo</FieldLabel>
                <Select
                  value={picker.kind}
                  onValueChange={(value) =>
                    setPicker({ ...picker, kind: value as SiteNavFilterKind, query: '' })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SITE_NAV_FILTER_KINDS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field className="gap-1.5">
                <FieldLabel>Cerca</FieldLabel>
                <Input
                  value={picker.query}
                  onChange={(e) => setPicker({ ...picker, query: e.target.value })}
                  placeholder="Nome o valore…"
                />
              </Field>
              <div className="min-h-0 flex-1 space-y-1 overflow-y-auto rounded-md border p-1">
                {loadingFilters ? (
                  <p className="p-3 text-sm text-muted-foreground">Caricamento filtri…</p>
                ) : pickerOptions.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">Nessun risultato.</p>
                ) : (
                  pickerOptions.map((opt) => (
                    <button
                      key={`${picker.kind}-${opt.value}`}
                      type="button"
                      className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => addFilterLink(picker.columnIndex, picker.kind, opt.value, opt.label)}
                    >
                      <span className="min-w-0 truncate">
                        <span className="font-medium">{opt.label}</span>
                        <span className="ml-2 font-mono text-xs text-muted-foreground">{opt.value}</span>
                      </span>
                      <Badge variant="outline">{opt.count}</Badge>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : null}
          <SheetFooter>
            <Button type="button" variant="cancel" onClick={() => setPicker(null)}>
              Annulla
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(customDraft)} onOpenChange={(open) => !open && setCustomDraft(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Link personalizzato</SheetTitle>
            <SheetDescription>
              Per guide o URL fissi. L’etichetta resta gestita con DeepL tra le lingue.
            </SheetDescription>
          </SheetHeader>
          {customDraft ? (
            <div className="space-y-3 px-4">
              <Field className="gap-1.5">
                <FieldLabel>Etichetta</FieldLabel>
                <Input
                  value={customDraft.label}
                  onChange={(e) => setCustomDraft({ ...customDraft, label: e.target.value })}
                  placeholder="Es. Dimmerabilità"
                />
              </Field>
              <Field className="gap-1.5">
                <FieldLabel>Href</FieldLabel>
                <Input
                  value={customDraft.href}
                  onChange={(e) => setCustomDraft({ ...customDraft, href: e.target.value })}
                  placeholder="/guide/…"
                />
              </Field>
            </div>
          ) : null}
          <SheetFooter>
            <Button type="button" variant="cancel" onClick={() => setCustomDraft(null)}>
              Annulla
            </Button>
            <Button
              type="button"
              variant="success"
              disabled={!customDraft}
              onClick={() => {
                if (!customDraft) return
                addCustomLink(customDraft.columnIndex, customDraft.label, customDraft.href)
              }}
            >
              Aggiungi
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
