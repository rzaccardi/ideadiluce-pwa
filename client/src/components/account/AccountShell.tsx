'use client'

import { type ReactNode } from 'react'
import { SectionContainer } from '@/components/site/primitives'
import type { UserDTO } from '@/types/dto'
import { useI18n } from '@/hooks/use-i18n'
import { useLocale } from '@/context/locale-context'
import { accountGreeting } from '@/components/account/accountHeaderCopy'
import {
  accountDcMainGridClass,
  accountDcPageClass,
  accountDcUserBandClass,
} from './dc/account-dc-styles'

type Props = {
  user: UserDTO
  nav: ReactNode
  children: ReactNode
}

function userInitial(user: UserDTO): string {
  const fromName = user.firstName?.trim()?.[0] ?? user.lastName?.trim()?.[0]
  if (fromName) return fromName.toUpperCase()
  return user.email[0]?.toUpperCase() ?? '?'
}

export function AccountShell({ user, nav, children }: Props) {
  const { t } = useI18n()
  const { locale } = useLocale()
  const greeting = accountGreeting(user, locale)
  const displayEmail = user.email

  return (
    <div className={accountDcPageClass}>
      <div className={accountDcUserBandClass}>
        <SectionContainer className="flex flex-wrap items-center gap-[18px] py-7 sm:py-8">
          <div
            className="flex size-[58px] shrink-0 items-center justify-center rounded-full bg-[#0c0c0d] font-serif text-2xl font-semibold text-[#c9a24b]"
            aria-hidden
          >
            {userInitial(user)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[23px] font-extrabold tracking-[-0.02em] text-idl-graphite">{greeting}</h1>
            <p className="text-[13.5px] text-idl-muted">
              {displayEmail}
              {user.isProfessional ? ` · ${t('account.overview.professionalActive')}` : null}
            </p>
          </div>
        </SectionContainer>
      </div>

      <SectionContainer className="py-7 pb-14 sm:py-8 lg:pb-16">
        <div className={accountDcMainGridClass}>
          <aside className="min-w-0">{nav}</aside>
          <div className="min-w-0">{children}</div>
        </div>
      </SectionContainer>
    </div>
  )
}
