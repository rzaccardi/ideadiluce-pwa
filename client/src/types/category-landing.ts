export type CategoryLandingKey = 'design' | 'technical' | 'technical-products'

export type CategoryBreadcrumbItem = {
  label: string
  href?: string
}

export type CategoryStat = {
  label: string
  value: string
}

export type CategorySupportCard = {
  title: string
  description: string
  primaryCta: { label: string; href: string }
  secondaryCta: { label: string; href: string }
}

export type CategoryTypeTile = {
  key: string
  label: string
  count?: string
  href: string
}

export type CategorySubtypeChip = {
  label: string
  href?: string
  active?: boolean
}

export type CategoryFilterOption = {
  label: string
  value: string
  queryToken?: string
  checked?: boolean
  count?: number
}

export type CategoryFilterChipOption = {
  label: string
  value: string
  queryToken?: string
  active?: boolean
  count?: number
}

export type CategoryFilterGroup =
  | {
      kind: 'checkbox'
      label: string
      options: CategoryFilterOption[]
    }
  | {
      kind: 'chips'
      label: string
      options: CategoryFilterChipOption[]
    }

export type CategoryFaqItem = {
  question: string
}

export type CategoryTipCard = {
  eyebrow: string
  title: string
  description: string
}

export type CategoryGuideSection = {
  eyebrow: string
  title: string
  description: string
  faq: CategoryFaqItem[]
}

export type CategoryArticlesSection = {
  eyebrow: string
  title: string
  subtitle?: string
  items: Array<{
    category?: string
    title: string
    meta?: string
    href: string
  }>
}

export type CategoryTipsSection = {
  title: string
  subtitle: string
  cards: CategoryTipCard[]
}

export type CategoryCtaBanner = {
  title: string
  description: string
  primaryCta: { label: string; href: string }
  secondaryCta?: { label: string; href: string }
}

export type CategoryLandingContent = {
  breadcrumb: CategoryBreadcrumbItem[]
  eyebrow: string
  title: string
  description: string
  stats?: CategoryStat[]
  supportCard?: CategorySupportCard
  typeTiles?: CategoryTypeTile[]
  subtypeChips?: CategorySubtypeChip[]
  filtersTitle: string
  filtersResetLabel: string
  filterGroups: CategoryFilterGroup[]
  sortLabel: string
  sortValue: string
  loadMoreLabel?: string
  guide?: CategoryGuideSection
  articles?: CategoryArticlesSection
  tips?: CategoryTipsSection
  cta: CategoryCtaBanner
  searchQuery?: string
  pageSize: number
}
