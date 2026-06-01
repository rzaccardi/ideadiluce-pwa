import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { authStore } from '@/features/auth'
import { wishlistStore, fetchWishlist, removeWishlistItem } from '@/features/wishlist'
import { PageHeader } from '@/components/PageHeader'
import { ErrorState } from '@/components/ErrorState'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/Button'
import { ListSkeleton } from '@/components/Skeleton'

export function WishlistPage() {
  const auth = useSnapshot(authStore)
  const wl = useSnapshot(wishlistStore)

  useEffect(() => {
    void fetchWishlist()
  }, [])

  return (
    <div>
      <PageHeader
        title="Preferiti"
        description={
          auth.isAuthenticated
            ? `Account collegato: ${auth.me?.email ?? ''}`
            : 'Sessione ospite: lista salvata sul browser tramite cookie di sessione.'
        }
      />

      {wl.error ? <ErrorState message={wl.error} className="mb-6" /> : null}

      {wl.isLoading && wl.items.length === 0 ? (
        <ListSkeleton count={3} />
      ) : wl.items.length === 0 ? (
        <EmptyState title="Lista vuota" description="Aggiungi prodotti dalla scheda dettaglio." />
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
          {wl.items.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <Link to={`/prodotto/${i.productRef}`} className="font-medium text-zinc-900 hover:underline">
                  {i.productRef}
                </Link>
                {i.variantRef ? <p className="text-xs text-zinc-500">Variante: {i.variantRef}</p> : null}
              </div>
              <Button variant="ghost" onClick={() => void removeWishlistItem(i.id)}>
                Rimuovi
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
