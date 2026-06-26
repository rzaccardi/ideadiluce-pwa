import 'server-only'

import { DcStaticPage } from '@/components/site/DcStaticPage'
import { loadDcStaticHtml } from '@/lib/dc-static-html.server'

type Props = {
  template: string
  animations?: boolean
}

export function DcStaticTemplatePage({ template, animations = false }: Props) {
  const doc = loadDcStaticHtml(template)
  const homeResponsive = template === 'home-desktop.html'
  return (
    <DcStaticPage
      headLinks={doc.headLinks}
      stylesCss={doc.stylesCss}
      bodyHtml={doc.bodyHtml}
      animations={animations}
      homeResponsive={homeResponsive}
    />
  )
}
