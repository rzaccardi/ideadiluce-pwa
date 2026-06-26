'use client'

import { Toaster } from 'sonner'

/** Toast globali storefront — alto a destra, stile IdeaDiLuce. */
export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      expand={false}
      closeButton
      visibleToasts={4}
      offset={{ top: 16, right: 16 }}
      gap={10}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: 'idl-toast',
          title: 'idl-toast__title',
          description: 'idl-toast__description',
          closeButton: 'idl-toast__close',
          icon: 'idl-toast__icon',
          success: 'idl-toast--success',
          error: 'idl-toast--error',
          info: 'idl-toast--info',
          warning: 'idl-toast--warning',
        },
      }}
    />
  )
}
