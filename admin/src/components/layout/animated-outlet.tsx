import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

/**
 * Outlet con enter animation a ogni cambio route — evita il salto secco tra pagine.
 */
export function AnimatedOutlet() {
  const location = useLocation()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    node.classList.remove('admin-page-enter')
    void node.offsetWidth
    node.classList.add('admin-page-enter')
  }, [location.pathname])

  return (
    <div
      ref={ref}
      key={location.pathname}
      className={cn('admin-page-enter flex min-h-full flex-1 flex-col')}
    >
      <Outlet />
    </div>
  )
}
