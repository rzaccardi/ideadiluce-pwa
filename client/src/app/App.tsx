import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/routes/router'
import { fetchMe } from '@/features/auth'
import { fetchCart } from '@/features/cart'
import { LoadingState } from '@/components/LoadingState'

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void fetchMe()
      .then(() => fetchCart())
      .finally(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <LoadingState message="Avvio applicazione…" />
      </div>
    )
  }

  return <RouterProvider router={router} />
}
