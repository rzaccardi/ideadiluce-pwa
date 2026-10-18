export type MailTemplateAudience = 'cliente' | 'interno' | 'generico'

export type MailTemplatePreview = {
  key: string
  label: string
  audience: MailTemplateAudience
  subject: string
  bodyHtml: string
}

export type MailTemplatePreviewList = {
  items: MailTemplatePreview[]
}

export function mailTemplateAudienceLabel(audience: MailTemplateAudience): string {
  if (audience === 'interno') return 'Interno'
  if (audience === 'generico') return 'Generico'
  return 'Cliente'
}
