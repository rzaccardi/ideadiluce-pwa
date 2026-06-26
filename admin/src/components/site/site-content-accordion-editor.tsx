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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { SiteContentFieldEditor } from '@/components/site/site-content-field-editor'

type SiteContentAccordionEditorProps = {
  pageKey: string
  content: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
  searchQuery?: string
}

export function SiteContentAccordionEditor({
  pageKey,
  content,
  onChange,
  searchQuery = '',
}: SiteContentAccordionEditorProps) {
  const sections = getSiteContentSections(pageKey)
  const visibleSections = sections.filter((section) => {
    if (!searchQuery) return true
    const sectionValue = pickSectionValue(content, section)
    return contentMatchesSearch(sectionValue, searchQuery, section.label)
  })

  const defaultOpen = searchQuery
    ? visibleSections.map((section) => section.id)
    : [sections[0]?.id ?? 'all']

  function handleSectionChange(section: SiteContentSection, sectionValue: unknown) {
    onChange(mergeSectionValue(cloneContent(content), section, sectionValue))
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
        const sectionValue = pickSectionValue(content, section)
        const sectionRoot = cloneContent(
          typeof sectionValue === 'object' && sectionValue !== null
            ? (sectionValue as Record<string, unknown>)
            : {},
        )
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
              <SiteContentFieldEditor
                value={sectionRoot}
                path={[]}
                root={sectionRoot}
                onRootChange={(nextRoot) => {
                  handleSectionChange(section, nextRoot)
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
