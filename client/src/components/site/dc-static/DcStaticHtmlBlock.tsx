'use client'

import { useEffect, useRef } from 'react'
import { mergeInlineStyles } from '@/lib/dc-static-html'

export function wireDcStyleHover(root: HTMLElement) {
  root.querySelectorAll('[style-hover]').forEach((node) => {
    const el = node as HTMLElement
    const base = el.getAttribute('style') ?? ''
    const hover = el.getAttribute('style-hover') ?? ''
    if (!hover) return

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

type Props = {
  html: string
  className?: string
}

export function DcStaticHtmlBlock({ html, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) wireDcStyleHover(ref.current)
  }, [html])

  if (!html) return null

  return (
    <div
      ref={ref}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
