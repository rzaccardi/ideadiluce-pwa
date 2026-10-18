/** Z-index condivisi: ordine dal basso verso l'alto (dentro/fuori dallo sticky chrome). */
export const layers = {
  /**
 * Sticky chrome container (`site-chrome`): sopra il contenuto pagina.
 * I valori sotto vivono DENTRO questo contesto (`isolate`).
 */
  headerBar: 'z-50',
  /** Banner legacy + utility strip: sopra il dimmer del mega menu. */
  utilityBar: 'z-[44]',
  /** Dimmer mega menu: sotto tutto lo chrome (banner, utility, header, pannello). */
  megaBackdrop: 'z-40',
  /** Riga header (nav/azioni) + host del mega panel (sopra il backdrop). */
  headerNav: 'z-[45]',
  /**
   * Pannello mega, dentro l'header: sotto la riga nav, sopra il dimmer
   * perché l'header è già sopra il backdrop.
   */
  megaPanel: 'z-[1]',
  /** Riga logo/nav: sopra il pannello mega se i due si sovrappongono. */
  headerRow: 'z-[2]',
  /**
 * Language / account / mini-cart dropdown.
 * La utility bar si alza a questo livello solo mentre il dropdown lingua è aperto.
 */
  headerDropdown: 'z-[60]',
  mobileNav: 'z-[65]',
  sheetBackdrop: 'z-[70]',
  sheet: 'z-[71]',
  modal: 'z-[80]',
  searchModal: 'z-[120]',
  /** Header checkout (logo / back): sopra overlay di loading z-200. */
  checkoutHeader: 'z-[210]',
  /** Overlay riepilogo ordine mobile: sopra header checkout. */
  checkoutMobileSummary: 'z-[230]',
  dialog: 'z-[10000]',
} as const
