import type { ContentBlock, ContentPageContent } from '@/types/site-content'

export const CHI_SIAMO_STATS: Extract<ContentBlock, { kind: 'stats' }> = {
  kind: 'stats',
  items: [
    { value: '25+', label: 'anni di esperienza' },
    { value: '8.000+', label: 'prodotti a catalogo' },
    { value: '120+', label: 'brand selezionati' },
    { value: '∞', label: 'spedizioni in tutto il mondo' },
  ],
}

export const CHI_SIAMO_SEDE: Extract<ContentBlock, { kind: 'split' }> = {
  kind: 'split',
  title: 'Sede di Roma',
  imageUrl: '',
  alt: 'Mappa / sede Idea di Luce',
  paragraphs: ['Via Appia Pignatelli 450 · su appuntamento'],
  layout: 'image-right',
}

export const CHI_SIAMO_SUPPORT_CTA: Extract<ContentBlock, { kind: 'cta' }> = {
  kind: 'cta',
  title: 'Non trovi il prodotto giusto?',
  description:
    'Inviaci una foto, l\'attacco o il codice: ti aiutiamo a trovare il ricambio compatibile o un\'alternativa.',
  primaryLabel: 'Richiedi supporto →',
  primaryHref: '/on-demand',
  variant: 'dark',
}

export const CHI_SIAMO_CONTACT_CTA: NonNullable<ContentPageContent['cta']> = {
  label: 'Contattaci →',
  href: '/contatti',
}
