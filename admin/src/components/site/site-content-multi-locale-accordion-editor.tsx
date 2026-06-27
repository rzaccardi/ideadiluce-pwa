import {
  getSiteContentSections,
  mergeSectionValue,
  pickSectionValue,
  type SiteContentSection,
} from '@/features/site/site-content-sections'
import {
  contentMatchesSearch,
  countEditableFields,
  countTranslatableFields,
} from '@/features/site/site-content-search'
import { cloneContent } from '@/features/site/site-content-utils'
import { type SiteLocale } from '@/features/site/site.store'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { SiteContentMultiLocaleFieldEditor } from '@/components/site/site-content-multi-locale-field-editor'

type SiteContentMultiLocaleAccordionEditorProps = {
  pageKey: string
  draftsByLocale: Record<SiteLocale, Record<string, unknown>>
  onLocaleChange: (locale: SiteLocale, next: Record<string, unknown>) => void
  searchQuery?: string
}

export function SiteContentMultiLocaleAccordionEditor({
  pageKey,
  draftsByLocale,
  onLocaleChange,
  searchQuery = '',
}: SiteContentMultiLocaleAccordionEditorProps) {
  const italianContent = draftsByLocale.IT
  const sections = getSiteContentSections(pageKey)
  const visibleSections = sections.filter((section) => {
    if (!searchQuery) return true
    const sectionValue = pickSectionValue(italianContent, section)
    return contentMatchesSearch(sectionValue, searchQuery, section.label)
  })

  const defaultOpen = searchQuery
    ? visibleSections.map((section) => section.id)
    : [sections[0]?.id ?? 'all']

  function handleLocaleSectionChange(
    locale: SiteLocale,
    section: SiteContentSection,
    sectionValue: unknown,
  ) {
    onLocaleChange(
      locale,
      mergeSectionValue(cloneContent(draftsByLocale[locale]), section, sectionValue),
    )
  }

  if (visibleSections.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Nessun campo corrisponde alla ricerca.
      </p>
    )
  }

  return (
    <Accordion
      key={`${pageKey}:${searchQuery}`}
      defaultValue={defaultOpen}
      multiple
      className="w-full space-y-2"
    >
      {visibleSections.map((section) => {
        const sectionValue = pickSectionValue(italianContent, section)
        const sectionRoot = cloneContent(
          typeof sectionValue === 'object' && sectionValue !== null
            ? (sectionValue as Record<string, unknown>)
            : {},
        )
        const sectionDrafts = Object.fromEntries(
          (Object.keys(draftsByLocale) as SiteLocale[]).map((locale) => [
            locale,
            cloneContent(pickSectionValue(draftsByLocale[locale], section) ?? sectionRoot) as Record<
              string,
              unknown
            >,
          ]),
        ) as Record<SiteLocale, Record<string, unknown>>
        const fieldCount = countEditableFields(sectionRoot)
        const translatableCount = countTranslatableFields(sectionRoot)

        return (
          <AccordionItem key={section.id} value={section.id} className="rounded-lg border px-3">
            <AccordionTrigger className="py-3 text-base font-semibold text-gray-900 hover:no-underline">
              <span className="flex flex-1 items-center gap-2 text-left">
                {section.label}
                <Badge variant="outline" className="font-normal">
                  {fieldCount} campi
                </Badge>
                {translatableCount > 0 ? (
                  <Badge variant="secondary" className="font-normal">
                    {translatableCount} traducibili
                  </Badge>
                ) : null}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4 pt-1">
              <SiteContentMultiLocaleFieldEditor
                value={sectionRoot}
                path={[]}
                draftsByLocale={sectionDrafts}
                onLocaleChange={(locale, nextRoot) => {
                  handleLocaleSectionChange(locale, section, nextRoot)
                }}
                searchQuery={searchQuery}
              />
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}
