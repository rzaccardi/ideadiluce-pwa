'use client'

import { useState } from 'react'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { HeaderAccountMenu } from '@/components/site/HeaderAccountMenu'
import { motion, useReducedMotion } from '@/lib/motion-client'
import { Link } from '@/lib/navigation'
import { useLocalePath } from '@/hooks/use-locale-path'
import type { SiteShellContent } from '@/types/site-content'
import { cn } from '@/utils/cn'
import { ui } from '@/lib/ui-classes'
import { layers } from '@/lib/layering'
import { fadeInVariants, transitionBase } from '@/lib/motion/presets'
import { SectionContainer } from './primitives'

type Props = {
  bar: SiteShellContent['utilityBar']
  /** Notifica il parent quando un dropdown esce dallo slot (overflow / z-index). */
  onDropdownOpenChange?: (open: boolean) => void
}

export function UtilityBar({ bar, onDropdownOpenChange }: Props) {
  const lp = useLocalePath()
  const reduceMotion = useReducedMotion()
  /** Alza tutta la strip sopra headerNav mentre il dropdown lingua è aperto. */
  const [langMenuOpen, setLangMenuOpen] = useState(false)

  const setLangOpen = (open: boolean) => {
    setLangMenuOpen(open)
    onDropdownOpenChange?.(open)
  }

  const inner = (
    <SectionContainer className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        {bar.messages.map((msg) => (
          <span key={msg}>{msg}</span>
        ))}
      </div>
      <div className={ui.utilityBarActions}>
        {bar.links.map((link) => (
          <Link key={link.href} to={lp(link.href)} className={ui.utilityBarLink}>
            {link.label}
          </Link>
        ))}
        <HeaderAccountMenu variant="utilityBar" />
        <div className={ui.utilityBarControls}>
          <LanguageSwitcher variant="utilityBar" onOpenChange={setLangOpen} />
        </div>
      </div>
    </SectionContainer>
  )

  return (
    <div
      className={cn(
        ui.utilityBar,
        'relative',
        langMenuOpen ? layers.headerDropdown : layers.utilityBar,
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
