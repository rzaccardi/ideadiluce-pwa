import { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio/react'
import { cartFeedbackStore } from '@/features/cart/cart-feedback.store'
import { cn } from '@/utils/cn'

export function CartFlyIn() {
  const { flyInToken, flyInImageUrl } = useSnapshot(cartFeedbackStore)
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (flyInToken === 0) return
    setActive(true)
    const timer = window.setTimeout(() => setActive(false), 700)
    return () => window.clearTimeout(timer)
  }, [flyInToken])

  if (!active || !flyInImageUrl) return null

  return (
    <div
      key={flyInToken}
      className={cn(
        'pointer-events-none absolute bottom-14 right-2 z-10 h-14 w-14 overflow-hidden rounded-lg shadow-lg ring-2 ring-white',
        'cart-fly-in',
      )}
      aria-hidden
    >
      <img src={flyInImageUrl} alt="" className="h-full w-full object-cover" />
    </div>
  )
}
