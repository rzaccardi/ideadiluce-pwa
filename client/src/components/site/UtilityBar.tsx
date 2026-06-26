'use client'

import { motion, useReducedMotion } from 'motion/react'
import { Link } from '@/lib/navigation'
import { useTheme } from '@/context/theme-context'
import { useLocalePath } from '@/hooks/use-locale-path'
import type { SiteShellContent } from '@/types/site-content'
import { cn } from '@/utils/cn'
import { fadeInVariants, transitionBase } from '@/lib/motion/presets'
import { SectionContainer } from './primitives'

export function UtilityBar({ bar }: { bar: SiteShellContent['utilityBar'] }) {
  const lp = useLocalePath()
  const reduceMotion = useReducedMotion()
  const { isDark } = useTheme()

  const inner = (
    <SectionContainer className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        {bar.messages.map((msg) => (
          <span key={msg}>{msg}</span>
        ))}
      </div>
      <div className="flex gap-5 font-semibold">
        {bar.links.map((link) => (
          <Link
            key={link.href}
            to={lp(link.href)}
            className={cn('transition-colors', isDark ? 'hover:text-idl-design-fg' : 'hover:text-idl-ink')}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </SectionContainer>
  )

  return (
    <div
      className={cn(
        'hidden border-b text-[12.5px] lg:block',
        isDark ? 'border-white/8 bg-[#1b160f] text-idl-design-subtle' : 'border-idl-border bg-idl-cream text-idl-ink-soft',
      )}
    >
      {reduceMotion ? (
        inner
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInVariants}
          transition={{ ...transitionBase, delay: 0.04 }}
        >
          {inner}
        </motion.div>
      )}
    </div>
  )
}
