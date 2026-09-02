/** Z-index condivisi — ordine dal basso verso l'alto. */
export const layers = {
  megaBackdrop: 'z-40',
  headerBar: 'z-50',
  utilityBar: 'z-[55]',
  megaPanel: 'z-[56]',
  headerDropdown: 'z-[60]',
  mobileNav: 'z-[65]',
  sheetBackdrop: 'z-[70]',
  sheet: 'z-[71]',
  modal: 'z-[80]',
  searchModal: 'z-[120]',
  /** Header checkout (logo / back) — sopra overlay di loading z-200. */
  checkoutHeader: 'z-[210]',
  /** Overlay riepilogo ordine mobile — sopra header checkout. */
  checkoutMobileSummary: 'z-[230]',
  dialog: 'z-[10000]',
} as const
