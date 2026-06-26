'use client'

import { useEffect, useRef } from 'react'
import { FadeIn } from '@/components/motion'
import { DC_STATIC_ANIMATION_CSS, wireDcStaticAnimations } from '@/lib/dc-static-animations'
import { DC_HOME_RESPONSIVE_CSS } from '@/lib/dc-home-responsive'
import { wireDcStyleHover } from '@/components/site/dc-static/DcStaticHtmlBlock'

type Props = {
  headLinks: string[]
  stylesCss: string
  bodyHtml: string
  animations?: boolean
  homeResponsive?: boolean
}

export function DcStaticPage({
  headLinks,
  stylesCss,
  bodyHtml,
  animations = false,
  homeResponsive = false,
}: Props) {
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const appended: HTMLLinkElement[] = []
    for (const markup of headLinks) {
      const tpl = document.createElement('template')
      tpl.innerHTML = markup.trim()
      const link = tpl.content.firstElementChild
      if (link instanceof HTMLLinkElement) {
        document.head.appendChild(link)
        appended.push(link)
      }
    }

    return () => {
      for (const link of appended) link.remove()
    }
  }, [headLinks])

  useEffect(() => {
    const body = bodyRef.current
    if (!body) return

    if (animations) {
      const root = body.closest('[data-dc-static-root]')
      if (root instanceof HTMLElement) return wireDcStaticAnimations(root)
      return undefined
    }

    wireDcStyleHover(body)
    return undefined
  }, [animations, bodyHtml])

  return (
    <FadeIn variant="fade">
      <>
        {stylesCss ? <style dangerouslySetInnerHTML={{ __html: stylesCss }} /> : null}
        {animations ? <style dangerouslySetInnerHTML={{ __html: DC_STATIC_ANIMATION_CSS }} /> : null}
        {homeResponsive ? <style dangerouslySetInnerHTML={{ __html: DC_HOME_RESPONSIVE_CSS }} /> : null}
        <div
          ref={bodyRef}
          data-dc-static-root
          {...(homeResponsive ? { 'data-dc-home': '' } : {})}
          style={{
            width: '100%',
            overflow: 'hidden',
            fontFamily: "'Hanken Grotesk',system-ui,sans-serif",
            color: '#14161b',
            background: '#ffffff',
          }}
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      </>
    </FadeIn>
  )
}
