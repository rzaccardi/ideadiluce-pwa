import { Outlet } from 'react-router-dom'
import { FloatingCartMonitor } from '@/components/cart/FloatingCartMonitor'

export function RootLayout() {
  return (
    <>
      <Outlet />
      <FloatingCartMonitor />
    </>
  )
}
