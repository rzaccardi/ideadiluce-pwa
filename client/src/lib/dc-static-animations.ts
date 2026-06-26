import { mergeInlineStyles } from '@/lib/dc-static-html'

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

export const DC_STATIC_ANIMATION_CSS = `
[data-dc-static-root][data-dc-animated] {
  --dc-ease: ${EASE};
  --dc-duration: 0.28s;
  --dc-stagger: 70ms;
}

[data-dc-static-root][data-dc-animated] [data-dc-section] {
  opacity: 0;
  transform: translateY(16px);
  transition:
    opacity var(--dc-duration) var(--dc-ease),
    transform var(--dc-duration) var(--dc-ease);
}

[data-dc-static-root][data-dc-animated] [data-dc-section].dc-visible {
  opacity: 1;
  transform: translateY(0);
}

[data-dc-static-root][data-dc-animated] [data-dc-section="hero"] > * {
  opacity: 0;
  transform: translateY(16px);
  transition:
    opacity var(--dc-duration) var(--dc-ease),
    transform var(--dc-duration) var(--dc-ease);
  transition-delay: calc(var(--dc-i, 0) * var(--dc-stagger));
}

[data-dc-static-root][data-dc-animated] [data-dc-section="hero"].dc-visible > * {
  opacity: 1;
  transform: translateY(0);
}

[data-dc-static-root][data-dc-animated] [data-dc-stagger-item] {
  opacity: 0;
  transform: translateY(16px);
  transition:
    opacity var(--dc-duration) var(--dc-ease),
    transform var(--dc-duration) var(--dc-ease);
  transition-delay: calc(var(--dc-i, 0) * var(--dc-stagger));
}

[data-dc-static-root][data-dc-animated] [data-dc-section].dc-visible [data-dc-stagger-item] {
  opacity: 1;
  transform: translateY(0);
}

[data-dc-static-root][data-dc-animated] [data-dc-hover-lift] {
  transition: transform 0.2s var(--dc-ease);
  will-change: transform;
}

[data-dc-static-root][data-dc-animated] [data-dc-hover-lift]:hover {
  transform: translateY(-4px);
}

[data-dc-static-root][data-dc-animated] [data-dc-hover-lift]:active {
  transform: translateY(-2px) scale(0.99);
}

[data-dc-static-root][data-dc-animated] [data-dc-section="rooms"] img {
  transition: transform 0.5s var(--dc-ease);
}

[data-dc-static-root][data-dc-animated] [data-dc-section="rooms"] a:hover img {
  transform: scale(1.03);
}

[data-dc-static-root][data-dc-animated] [data-dc-style-hover] {
  transition:
    background-color 0.18s var(--dc-ease),
    background 0.18s var(--dc-ease),
    border-color 0.18s var(--dc-ease),
    color 0.18s var(--dc-ease),
    box-shadow 0.18s var(--dc-ease);
}

@keyframes dc-hero-glow {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 1; }
  50% { transform: translate(-12px, 8px) scale(1.04); opacity: 0.92; }
}

[data-dc-static-root][data-dc-animated] [data-dc-hero-glow] {
  animation: dc-hero-glow 40s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  [data-dc-static-root][data-dc-animated] [data-dc-section],
  [data-dc-static-root][data-dc-animated] [data-dc-section] > *,
  [data-dc-static-root][data-dc-animated] [data-dc-stagger-item] {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }

  [data-dc-static-root][data-dc-animated] [data-dc-hover-lift]:hover,
  [data-dc-static-root][data-dc-animated] [data-dc-hover-lift]:active {
    transform: none !important;
  }

  [data-dc-static-root][data-dc-animated] [data-dc-section="rooms"] a:hover img {
    transform: none !important;
  }

  [data-dc-static-root][data-dc-animated] [data-dc-hero-glow] {
    animation: none !important;
  }
}
`

const STAGGER_SECTIONS = new Set([
  'sockets',
  'paths',
  'rooms',
  'technical-showcase',
  'brands',
  'guides',
  'expressions',
  'blog',
])

const HOVER_LIFT_SECTIONS = new Set(['sockets', 'paths', 'rooms', 'guides', 'expressions', 'blog'])

function isGrid(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const style = el.getAttribute('style') ?? ''
  return /display:\s*grid/i.test(style)
}

function findPrimaryGrid(section: HTMLElement): HTMLElement | null {
  if (isGrid(section)) return section
  const candidates = section.querySelectorAll('div[style*="grid"]')
  for (const el of candidates) {
    if (el instanceof HTMLElement && isGrid(el)) return el
  }
  return null
}

function tagStaggerItems(section: HTMLElement) {
  const id = section.getAttribute('data-dc-section')
  if (!id || !STAGGER_SECTIONS.has(id)) return

  const grid = findPrimaryGrid(section)
  if (!grid) return

  ;[...grid.children].forEach((child, index) => {
    if (!(child instanceof HTMLElement)) return
    child.setAttribute('data-dc-stagger-item', '')
    child.style.setProperty('--dc-i', String(index))
  })
}

function tagHoverLift(section: HTMLElement) {
  const id = section.getAttribute('data-dc-section')
  if (!id || !HOVER_LIFT_SECTIONS.has(id)) return

  section.querySelectorAll('[style-hover]').forEach((node) => {
    if (node instanceof HTMLElement) node.setAttribute('data-dc-hover-lift', '')
  })
}

function tagHeroGlow(section: HTMLElement) {
  const glow = section.querySelector('div[style*="radial-gradient"]')
  if (glow instanceof HTMLElement) glow.setAttribute('data-dc-hero-glow', '')
}

function wireStyleHover(root: HTMLElement) {
  root.querySelectorAll('[style-hover]').forEach((node) => {
    const el = node as HTMLElement
    const base = el.getAttribute('style') ?? ''
    const hover = el.getAttribute('style-hover') ?? ''
    if (!hover) return

    el.setAttribute('data-dc-style-hover', '')
    const onEnter = () => {
      el.setAttribute('style', mergeInlineStyles(base, hover))
    }
    const onLeave = () => {
      el.setAttribute('style', base)
    }
    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mouseleave', onLeave)
  })
}

export function wireDcStaticAnimations(root: HTMLElement) {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    wireStyleHover(root)
    return () => {}
  }

  root.setAttribute('data-dc-animated', '')

  const sections = root.querySelectorAll<HTMLElement>('[data-dc-section]')
  sections.forEach((section) => {
    tagStaggerItems(section)
    tagHoverLift(section)
    if (section.getAttribute('data-dc-section') === 'hero') tagHeroGlow(section)
  })

  wireStyleHover(root)

  const hero = root.querySelector<HTMLElement>('[data-dc-section="hero"]')
  if (hero) {
    ;[...hero.children].forEach((child, index) => {
      if (child instanceof HTMLElement) child.style.setProperty('--dc-i', String(index))
    })
    requestAnimationFrame(() => {
      requestAnimationFrame(() => hero.classList.add('dc-visible'))
    })
  }

  const scrollSections = [...sections].filter((s) => s.getAttribute('data-dc-section') !== 'hero')
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('dc-visible')
        observer.unobserve(entry.target)
      }
    },
    { rootMargin: '-48px 0px', threshold: 0.08 },
  )

  scrollSections.forEach((section) => observer.observe(section))

  return () => observer.disconnect()
}
