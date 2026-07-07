import { isValidElement, type ComponentProps, type ReactNode } from 'react'

export function extractTextFromChildren(children: ReactNode): string | undefined {
  if (children == null || typeof children === 'boolean') return undefined
  if (typeof children === 'string' || typeof children === 'number') {
    const text = String(children).replace(/\s+/g, ' ').trim()
    return text || undefined
  }
  if (Array.isArray(children)) {
    const parts = children.map(extractTextFromChildren).filter(Boolean) as string[]
    return parts.length ? parts.join(' ').replace(/\s+/g, ' ').trim() : undefined
  }
  if (isValidElement<{ children?: ReactNode }>(children)) {
    return extractTextFromChildren(children.props.children)
  }
  return undefined
}

export function resolveLinkTitle(
  children: ReactNode,
  title?: string,
  ariaLabel?: string,
): string | undefined {
  if (title?.trim()) return title.trim()
  if (ariaLabel?.trim()) return ariaLabel.trim()
  return extractTextFromChildren(children)
}

export function ExternalLink({
  title,
  'aria-label': ariaLabel,
  children,
  ...props
}: ComponentProps<'a'>) {
  const resolvedTitle = resolveLinkTitle(children, title, ariaLabel)

  return (
    <a {...props} title={resolvedTitle} aria-label={ariaLabel}>
      {children}
    </a>
  )
}
