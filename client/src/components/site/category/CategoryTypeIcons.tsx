import type { CategoryTypeTile } from '@/types/category-landing'
import type { ComponentType } from 'react'

function SospensioneIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 80 80" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="40" cy="52" r="16" fill="#c9a24b" opacity="0.14" stroke="none" />
      <path d="M14 12 H66" />
      <path d="M40 12 V30" />
      <path d="M26 45 Q40 24 54 45" />
      <path d="M26 45 H54" />
      <path d="M33 53 L31 61 M40 54 V63 M47 53 L49 61" opacity="0.65" />
    </svg>
  )
}

function PareteIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 80 80" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="44" cy="40" r="14" fill="#c9a24b" opacity="0.14" stroke="none" />
      <path d="M18 12 V68" />
      <path d="M18 40 H28" />
      <path d="M28 32 H46 V48 H28 Z" />
      <path d="M34 30 L32 21 M41 30 V19 M48 30 L50 21" opacity="0.65" />
      <path d="M34 50 L32 59 M41 50 V61 M48 50 L50 59" opacity="0.65" />
    </svg>
  )
}

function TavoloIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 80 80" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="40" cy="34" r="15" fill="#c9a24b" opacity="0.14" stroke="none" />
      <path d="M28 41 L34 24 H46 L52 41 Z" />
      <path d="M40 41 V60" />
      <path d="M30 61 Q40 65 50 61" />
    </svg>
  )
}

function TerraIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 80 80" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="43" cy="36" r="12" fill="#c9a24b" opacity="0.14" stroke="none" />
      <path d="M32 22 H54 L48 35 H38 Z" />
      <path d="M43 22 V64" />
      <path d="M33 65 H53" />
      <path d="M38 65 V61 M48 65 V61" opacity="0.7" />
    </svg>
  )
}

function PlafoniereIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 80 80" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="40" cy="26" r="14" fill="#c9a24b" opacity="0.14" stroke="none" />
      <path d="M14 16 H66" />
      <path d="M27 16 Q40 35 53 16" />
      <path d="M33 16 Q40 25 47 16" opacity="0.55" />
      <path d="M30 33 L28 41 M40 35 V43 M50 33 L52 41" opacity="0.6" />
    </svg>
  )
}

function FarettiIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 80 80" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="40" cy="48" r="15" fill="#c9a24b" opacity="0.14" stroke="none" />
      <path d="M14 16 H66" />
      <ellipse cx="40" cy="20" rx="9" ry="3" />
      <path d="M33 22 L25 60 H55 L47 22" opacity="0.85" />
    </svg>
  )
}

type IconProps = { className?: string }

const ICONS: Record<string, ComponentType<IconProps>> = {
  sospensione: SospensioneIcon,
  parete: PareteIcon,
  tavolo: TavoloIcon,
  terra: TerraIcon,
  plafoniere: PlafoniereIcon,
  faretti: FarettiIcon,
}

function resolveTypeIcon(key: string): ComponentType<IconProps> {
  const normalized = key.trim().toLowerCase()
  if (ICONS[normalized]) return ICONS[normalized]!
  if (/sospens|pendan|chandelier/.test(normalized)) return SospensioneIcon
  if (/parete|appliqu|wall/.test(normalized)) return PareteIcon
  if (/tavolo|table|desk/.test(normalized)) return TavoloIcon
  if (/terra|piantan|floor/.test(normalized)) return TerraIcon
  if (/plafon|soffitto|ceiling/.test(normalized)) return PlafoniereIcon
  if (/farett|incass|spot|recess/.test(normalized)) return FarettiIcon
  return SospensioneIcon
}

export function CategoryTypeIcon({ tile }: { tile: CategoryTypeTile }) {
  const Icon = resolveTypeIcon(tile.key)
  return <Icon className="h-[60px] w-full text-idl-brass sm:h-[84px]" />
}
