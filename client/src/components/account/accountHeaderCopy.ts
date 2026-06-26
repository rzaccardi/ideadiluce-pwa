'use client'

import { tParams } from '@/i18n/messages'
import type { PwaLocale } from '@/lib/locale'
import type { OrderDTO, UserDTO } from '@/types/dto'
import { formatAddressSummary } from '@/lib/address'
import { paymentMethodLabel } from '@/lib/paymentLabels'
import { formatOrderRef } from '@/lib/orderLabels'

export type AccountHeaderMeta = { label: string; value: string }[]

export function accountDisplayName(user: UserDTO): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return name || user.email
}

export function accountGreeting(user: UserDTO, locale: PwaLocale = 'IT'): string {
  const name = user.firstName?.trim()
  return name
    ? tParams(locale, 'account.greeting.named', { name })
    : tParams(locale, 'account.greeting.default', {})
}

export function resolveAccountSection(
  pathname: string,
  user: UserDTO,
  locale: PwaLocale = 'IT',
  options?: { orderCount?: number | null; orderDetail?: OrderDTO | null },
): { title: string | null; description: string | null; meta: AccountHeaderMeta } {
  const name = accountDisplayName(user)
  const orderCount = options?.orderCount
  const baseMeta: AccountHeaderMeta = [
    { label: tParams(locale, 'account.meta.customer', {}), value: name },
    { label: tParams(locale, 'account.meta.email', {}), value: user.email },
  ]

  const orderDetailMatch = pathname.match(/^\/account\/orders\/([^/]+)$/)
  if (orderDetailMatch && options?.orderDetail) {
    const o = options.orderDetail
    const dateLocale =
      locale === 'IT'
        ? 'it-IT'
        : locale === 'EN'
          ? 'en-GB'
          : locale === 'ES'
            ? 'es-ES'
            : locale === 'FR'
              ? 'fr-FR'
              : 'de-DE'
    return {
      title: formatOrderRef(o.odooSaleOrderId, locale),
      description: new Date(o.createdAt).toLocaleDateString(dateLocale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      meta: [],
    }
  }

  if (pathname === '/account/orders') {
    return {
      title: tParams(locale, 'account.section.orders.title', {}),
      description: tParams(locale, 'account.section.orders.description', {}),
      meta: [],
    }
  }

  if (pathname.startsWith('/account/profile')) {
    return {
      title: tParams(locale, 'account.section.profile.title', {}),
      description: tParams(locale, 'account.section.profile.description', {}),
      meta: [
        ...baseMeta,
        ...(user.phone
          ? [{ label: tParams(locale, 'account.meta.phone', {}), value: user.phone }]
          : []),
        {
          label: tParams(locale, 'account.meta.shippingAddress', {}),
          value: formatAddressSummary(user.shippingAddress),
        },
        {
          label: tParams(locale, 'account.meta.preferredPayment', {}),
          value: paymentMethodLabel(user.preferredPaymentMethod, locale),
        },
      ],
    }
  }

  return {
    title: null,
    description: tParams(locale, 'account.section.overview.description', {}),
    meta: [
      ...baseMeta,
      ...(orderCount != null
        ? [{ label: tParams(locale, 'account.meta.orders', {}), value: String(orderCount) }]
        : []),
    ],
  }
}
