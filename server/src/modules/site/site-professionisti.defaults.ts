import type { ProfessionistiPageContent } from './site.types.js'

export const DEFAULT_PROFESSIONISTI_IT: ProfessionistiPageContent = {
  eyebrow: 'AREA PROFESSIONISTI · B2B',
  title: 'Soluzioni luce per installatori, aziende e architetti',
  subtitle:
    'Prezzi dedicati, riordino rapido da codice o EAN, preventivi personalizzati e supporto su ricambi e prodotti fuori produzione. Un solo interlocutore per arredo e tecnica.',
  hero: {
    primaryCta: { label: "Richiedi l'attivazione", href: '#registrazione' },
    secondaryCta: { label: "Accedi all'account", href: '/login' },
  },
  quickReorder: {
    title: 'RIORDINO RAPIDO DA CODICE / EAN',
    placeholder: 'incolla qui la tua lista…',
    exampleLines: ['8711500411990 ×10', '4058075609907 ×24', '322805 ×4'],
    ctaLabel: 'Aggiungi tutto al carrello',
    footnote: 'Riconosce SKU, EAN e MPN · disponibile con account business attivo',
    loginHint: 'Attiva l\'account business per usare il riordino rapido.',
  },
  features: [
    {
      num: '01',
      title: 'Prezzi IVA esclusa',
      description:
        'Listino dedicato per partita IVA, con condizioni riservate e scaglioni quantità.',
    },
    {
      num: '02',
      title: 'Riordino da codice/EAN',
      description: "Incolla i codici e componi l'ordine in pochi secondi, anche da storico.",
    },
    {
      num: '03',
      title: 'Lead time visibile',
      description: 'Disponibilità e tempi di consegna chiari su ogni prodotto, anche su ordinazione.',
    },
    {
      num: '04',
      title: 'Prodotti fuori produzione',
      description: 'Cerchiamo ricambi difficili e alternative compatibili per i tuoi impianti.',
    },
  ],
  audiences: {
    title: 'Pensata per il tuo lavoro',
    items: [
      {
        title: 'Installatori',
        description: 'Riordino rapido, ricambi, alimentatori e lampadine sempre disponibili.',
      },
      {
        title: 'Architetti / Interior',
        description: 'Brand di design, progetti su misura e consulenza arredo per i tuoi clienti.',
      },
      {
        title: 'Aziende / Manutentori',
        description: 'Quantità, ricambi, tempi certi e preventivi per la manutenzione.',
      },
      {
        title: 'Rivenditori',
        description: 'Listini dedicati, disponibilità e accesso a prodotti speciali.',
      },
    ],
  },
  registration: {
    title: 'Attiva il tuo account business',
    description:
      'Compila i dati della tua attività: verifichiamo la partita IVA e attiviamo prezzi e funzioni dedicate, di solito entro 24 ore lavorative.',
    benefits: [
      'Listino IVA esclusa e sconti per volume',
      'Riordino rapido e storico ordini',
      'Preventivi personalizzati e referente dedicato',
      'Pagamento con bonifico e fattura',
    ],
    formNote: 'Verifica P.IVA entro 24h lavorative · nessun costo di attivazione',
    submitLabel: "Richiedi l'attivazione",
    sectors: [
      'Installatore',
      'Architetto / Interior',
      'Azienda / Manutentore',
      'Rivenditore',
      'Altro',
    ],
    fields: {
      companyName: 'Ragione sociale',
      vat: 'Partita IVA',
      sector: 'Settore',
      contactName: 'Referente',
      email: 'Email',
      phone: 'Telefono',
      message: 'Note aggiuntive (opzionale)',
    },
    placeholders: {
      companyName: 'Rossi Impianti Srl',
      vat: 'IT________',
      contactName: 'Nome e cognome',
      email: 'azienda@email.it',
      phone: '+39 ___ ___ ____',
    },
  },
}
