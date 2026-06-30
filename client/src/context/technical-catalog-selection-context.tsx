'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { ProductCardDTO } from '@/types/dto'
import {
  useTechnicalCatalogSelection,
  type TechnicalCatalogSelection,
} from '@/hooks/use-technical-catalog-selection'

const TechnicalCatalogSelectionContext = createContext<TechnicalCatalogSelection | null>(null)

type ProviderProps = {
  products: ReadonlyArray<ProductCardDTO>
  children: ReactNode
}

export function TechnicalCatalogSelectionProvider({ products, children }: ProviderProps) {
  const selection = useTechnicalCatalogSelection(products)
  return (
    <TechnicalCatalogSelectionContext.Provider value={selection}>
      {children}
    </TechnicalCatalogSelectionContext.Provider>
  )
}

export function useTechnicalCatalogSelectionContext() {
  return useContext(TechnicalCatalogSelectionContext)
}
