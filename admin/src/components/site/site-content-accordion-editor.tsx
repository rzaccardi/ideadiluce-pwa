import {
  getSiteContentSections,
  mergeSectionValue,
  pickSectionValue,
  type SiteContentSection,
} from '@/features/site/site-content-sections'
import { cloneContent } from '@/features/site/site-content-utils'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { SiteContentFieldEditor } from '@/components/site/site-content-field-editor'

type SiteContentAccordionEditorProps = {
  pageKey: string
  content: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}

export function SiteContentAccordionEditor({
  pageKey,
  content,
  onChange,
}: SiteContentAccordionEditorProps) {
  const sections = getSiteContentSections(pageKey)

  function handleSectionChange(section: SiteContentSection, sectionValue: unknown) {
    onChange(mergeSectionValue(content, section, sectionValue))
  }

  return (
    <Accordion defaultValue={[sections[0]?.id ?? 'all']} multiple className="w-full">
      {sections.map((section) => {
        const sectionValue = pickSectionValue(content, section)
        const sectionRoot = cloneContent(
          typeof sectionValue === 'object' && sectionValue !== null
            ? (sectionValue as Record<string, unknown>)
            : {},
        )

        return (
          <AccordionItem key={section.id} value={section.id}>
            <AccordionTrigger className="text-base font-semibold text-gray-900">
              {section.label}
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <SiteContentFieldEditor
                value={sectionRoot}
                path={[]}
                root={sectionRoot}
                onRootChange={(nextRoot) => {
                  handleSectionChange(section, nextRoot)
                }}
              />
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}
