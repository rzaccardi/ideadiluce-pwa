'use client'

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

export function UtilityBar({ bar }: { bar: SiteShellContent['utilityBar'] }) {
  const lp = useLocalePath()
  const reduceMotion = useReducedMotion()

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
          <LanguageSwitcher variant="utilityBar" />
        </div>
      </div>
    </SectionContainer>
  )

  return (
    <div className={cn(ui.utilityBar, 'relative', layers.utilityBar)}>
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
