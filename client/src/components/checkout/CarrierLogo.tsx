type Props = {
  carrierCode: string
  source?: string
  className?: string
}

export function CarrierLogo({ carrierCode, source, className = 'h-8 w-auto' }: Props) {
  const code = carrierCode.toLowerCase()
  const src = source?.toLowerCase()

  if (code === 'dhl' || src === 'dhl') {
    return (
      <svg viewBox="0 0 120 32" className={className} aria-label="DHL" role="img">
        <rect width="120" height="32" rx="4" fill="#FFCC00" />
        <text
          x="60"
          y="22"
          textAnchor="middle"
          fill="#D40511"
          fontFamily="Arial Black, Arial, sans-serif"
          fontSize="18"
          fontWeight="900"
        >
          DHL
        </text>
      </svg>
    )
  }

  if (code === 'fedex' || src === 'fedex') {
    return (
      <svg viewBox="0 0 120 32" className={className} aria-label="FedEx" role="img">
        <rect width="120" height="32" rx="4" fill="#4D148C" />
        <text x="60" y="21" textAnchor="middle" fill="#fff" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="700">
          Fed
        </text>
        <text x="78" y="21" fill="#FF6600" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="700">
          Ex
        </text>
      </svg>
    )
  }

  if (src === 'pickup' || code === 'pickup') {
    return (
      <svg viewBox="0 0 32 32" className={className} aria-hidden>
        <rect width="32" height="32" rx="6" fill="#fef3c7" />
        <path
          d="M10 22 V12 h12 v10 M12 12 V9 h8 v3"
          stroke="#92400e"
          strokeWidth="1.5"
          fill="none"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (src === 'free' || code === 'internal') {
    return (
      <svg viewBox="0 0 32 32" className={className} aria-hidden>
        <rect width="32" height="32" rx="6" fill="#ecfdf5" />
        <path
          d="M8 16l5 5 11-11"
          stroke="#059669"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="6" fill="#f4f4f5" />
      <path
        d="M8 12h16v12H8z M10 8h12v4H10z"
        stroke="#71717a"
        strokeWidth="1.5"
        fill="none"
        strokeLinejoin="round"
      />
    </svg>
  )
}
