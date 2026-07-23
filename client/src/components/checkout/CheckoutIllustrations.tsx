'use client'

import { cn } from '@/utils/cn'

type IconProps = {
  className?: string
  size?: number
}

export function CheckoutLoadingRing({ className, size = 76 }: IconProps) {
  return (
    <svg
      className={cn('idl-ring absolute inset-0 text-idl-ink', className)}
      viewBox="0 0 76 76"
      width={size}
      height={size}
      aria-hidden
    >
      <circle cx="38" cy="38" r="33" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="5" />
      <circle
        cx="38"
        cy="38"
        r="33"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="60 150"
      />
    </svg>
  )
}

export function CheckoutLoadingPin({ className, size = 34 }: IconProps) {
  return (
    <svg
      className={cn('idl-pin text-idl-ink', className)}
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M24 6 q11 0 11 12 q0 9 -11 22 q-11 -13 -11 -22 q0 -12 11 -12Z" />
      <circle cx="24" cy="18" r="4" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function CheckoutLoadingTruck({ className, size = 36 }: IconProps) {
  return (
    <svg
      className={cn('idl-truck text-idl-ink', className)}
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 14h20v16H5Z" />
      <path d="M25 22h10l5 6v2H25Z" />
      <circle cx="12" cy="32" r="3" />
      <circle cx="34" cy="32" r="3" />
    </svg>
  )
}

export function CheckoutLoadingShield({ className, size = 34 }: IconProps) {
  return (
    <svg
      className={cn('idl-bulb text-idl-ink', className)}
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M24 6 l14 5 v9 q0 12 -14 18 q-14 -6 -14 -18 v-9Z" />
      <path d="M18 23 l5 5 l8 -9" stroke="#1f9d57" />
    </svg>
  )
}

export function CheckoutLoadingBulb({ className, size = 38 }: IconProps) {
  return (
    <svg className={cn('idl-bulb text-idl-brass', className)} viewBox="0 0 48 48" width={size} height={size} aria-hidden>
      <path d="M24 8 q11 0 11 12 q0 7 -6 11 v4 h-10 v-4 q-6 -4 -6 -11 q0 -12 11 -12Z" fill="currentColor" />
      <rect x="19" y="36" width="10" height="5" rx="2" fill="#a1a1aa" />
      <rect x="20" y="42" width="8" height="3" rx="1.5" fill="#a1a1aa" />
    </svg>
  )
}

export function CheckoutSecureIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden>
      <path
        d="M8 1.5 3 3.5v4c0 3.1 2.1 5.9 5 6.5 2.9-.6 5-3.4 5-6.5v-4L8 1.5Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path d="M6 8l1.5 1.5L10.5 6.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  )
}

export function CheckoutReturnsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden>
      <path
        d="M2.5 8a5.5 5.5 0 0 1 9.4-3.9M13.5 8a5.5 5.5 0 0 1-9.4 3.9"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path d="M2 4.5V8h3.5M13 11.5V8H9.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  )
}
