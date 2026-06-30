export function parseGuideEyebrow(eyebrow?: string) {
  if (!eyebrow) return { category: null, meta: null }
  const parts = eyebrow.split('·').map((part) => part.trim()).filter(Boolean)
  if (parts.length >= 2) {
    return { category: parts[0], meta: parts.slice(1).join(' · ') }
  }
  return { category: parts[0] ?? null, meta: null }
}

export function parseGuideSubtitle(subtitle?: string) {
  if (!subtitle) return { headline: null, description: null }
  const colonIdx = subtitle.indexOf(':')
  if (colonIdx > 0) {
    const headline = subtitle.slice(0, colonIdx).trim()
    const description = subtitle.slice(colonIdx + 1).trim()
    return {
      headline: headline.endsWith('.') ? headline : `${headline}.`,
      description: description ? description.charAt(0).toUpperCase() + description.slice(1) : null,
    }
  }
  return { headline: null, description: subtitle }
}

export const GUIDE_ARTICLE_LAYOUT = {
  wide: 'mx-auto w-full max-w-[1080px]',
  body: 'mx-auto w-full max-w-[820px]',
  intro: 'mx-auto w-full max-w-[760px]',
} as const
