import type { SiteLocale } from '@/features/site/site.store'

export type GuideLocaleStatus = {
  status: 'saved' | 'missing' | 'default'
  published: boolean
  updatedAt: string | null
}

export type GuideListItem = {
  slug: string
  pageKey: string
  title: string
  category: string
  readingMeta: string
  sortOrder: number
  indexed: boolean
  featured: boolean
  published: boolean
  missingLocales: SiteLocale[]
  missingCount: number
  locales: Record<SiteLocale, GuideLocaleStatus>
  updatedAt: string
}

export type GuideDetailLocale = {
  locale: SiteLocale
  published: boolean
  updatedAt: string | null
  hasCustomContent?: boolean
  title: string | null
  content: Record<string, unknown>
}

export type GuideDetail = {
  slug: string
  pageKey: string
  category: string
  readingMeta: string
  sortOrder: number
  indexed: boolean
  featured: boolean
  published: boolean
  locales: GuideDetailLocale[]
  updatedAt: string
}

export const GUIDE_CATEGORIES = [
  { value: 'BASE', label: 'Base' },
  { value: 'ATTACCHI', label: 'Attacchi' },
  { value: 'TECNICO', label: 'Tecnico' },
  { value: 'ACQUISTO', label: 'Acquisto' },
  { value: 'AMBIENTE', label: 'Ambiente' },
  { value: 'GLOSSARIO', label: 'Glossario' },
] as const
