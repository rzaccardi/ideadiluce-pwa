import type { SiteLocale } from './site.constants.js'
import type { ContentPageContent } from './site.types.js'
import { DEFAULT_TERMINI_IT } from './site-content-termini.defaults.js'

export const DEFAULT_TERMINI_EN: ContentPageContent = {
  layout: 'legal',
  title: 'Terms of Use and Conditions of Sale',
  subtitle: 'Terms of use of the website and online sales of TLB ITALY S.r.l.',
  intro:
    'The website www.ideadiluce.com ("Site") is owned by TLB ITALY S.r.l. ("Owner" or "Seller"), with registered office at Via Appia Pignatelli 450 – 00178 Rome (RM) Italy – VAT IT17245551001 – R.E.A.: RM-1705840 – Share capital: €10,000.00 fully paid.',
  seo: { noindex: false },
  blocks: [
  {
    kind: 'prose',
    title: 'Contact',
    paragraphs: [
      'For any information, assistance request, question or report, please contact our Customer Service:',
      'by email: info@ideadiluce.com',
      'by phone: +39 06 716 7111',
    ],
  },
  { kind: 'prose', title: 'Terms of Use', paragraphs: [] },
  {
    kind: 'prose',
    title: '1. TERMS OF USE OF THE WEBSITE',
    paragraphs: [
      'By using our Website and/or placing orders through it, the Customer confirms adherence to the following guidelines and agrees to:',
      'use the Website solely for lawful purposes;',
      'refrain from placing misleading or fraudulent orders. If valid indications of a possible fraudulent order emerge, we reserve the right to cancel such order and report the situation to the relevant authorities;',
      'provide contact details such as email address and postal address, ensuring they are accurate and truthful, thereby allowing their use for order processing as described in our Privacy Policy. Failure to provide accurate and complete information may prevent fulfilment of your order.',
      'By confirming an order on this Site, you declare that you are of legal age and have the legal capacity to enter into contracts.',
      'We disclaim all liability for mishaps or damage caused by the use of the Internet, including but not limited to service interruptions, external intrusions, computer viruses or any other force majeure event.',
    ],
  },
  {
    kind: 'prose',
    title: '2. INDUSTRIAL AND INTELLECTUAL PROPERTY',
    paragraphs: [
      'The domain, the Site and all its contents, including images, texts, videos, logos, etc., are the exclusive property of the Owner or the legitimate holders of the corresponding intellectual property and copyright rights.',
      'It is expressly prohibited to copy, download, alter or use the trademark, videos, logos and any other identifying element on this site for any purpose and by any means without the explicit written authorisation of the site owner or rights holders.',
    ],
  },
  {
    kind: 'prose',
    title: 'General Conditions of Sale',
    paragraphs: [
      'These General Conditions of Sale (hereinafter "GCS") govern the contractual relationship between the Owner and the Customer regarding the purchase of lighting products marketed by the Owner through the Site.',
      'The premises and Terms of Use of our Website are integral parts of these GCS.',
      'Please read them carefully and print and/or save them on another durable accessible medium. Please also carefully consult the Privacy Policy and Cookie Policy.',
      'The Owner undertakes to keep such documents always available and up to date. They may be modified or updated at any time by the Owner and the user undertakes to review them before placing each order.',
    ],
  },
  {
    kind: 'prose',
    title: '1. Definitions',
    paragraphs: [
      '1.1. "Contract" means the distance sales contract concerning movable tangible goods marketed on the Site.',
      '1.2. "Customer" means the consumer as a natural person who has reached 18 years of age, or the professional acting in the exercise of their activity.',
      '1.3. "Order" means the purchase proposal that the user sends to the Site Owner by completing the described order procedure.',
      '1.4. "Products" means the movable tangible goods subject to sale on this Site.',
    ],
  },
  {
    kind: 'prose',
    title: '2. Service availability',
    paragraphs: [
      '2.1. The Owner reserves the right not to accept orders that appear anomalous in relation to quantity or frequency of purchases.',
      'The Owner also reserves the right not to accept orders from users with ongoing legal proceedings, payment fraud, or false or incomplete identifying data.',
    ],
  },
  {
    kind: 'prose',
    title: '3. SCOPE OF APPLICATION',
    paragraphs: [
      '3.1. These GCS apply to all sales made by the Seller on the Site. The applicable GCS are those in force on the date the purchase order is submitted.',
      '3.2. These GCS do not govern sales or services by third parties accessible via hyperlinks.',
      '3.3. These GCS may be modified at any time and will be effective from publication on the Site.',
    ],
  },
  {
    kind: 'prose',
    title: '4. HOW TO SUBMIT YOUR ORDER AND CONCLUDE A CONTRACT WITH US',
    paragraphs: [
      '4.1. To submit your order: add products to the cart, review the summary, confirm the order. You may cancel until warehouse preparation.',
      '4.2. By submitting an order you declare that you have read and fully accepted our GCS and the obligation to pay the indicated price.',
      '4.3. We may refuse an order if there are errors in the information provided or the product sheet.',
      '4.4. If full payment is not made, the purchase contract will be automatically terminated.',
      '4.5. Every order is stored digitally or on paper at our premises. You may request a copy at any time.',
    ],
  },
  {
    kind: 'prose',
    title: '5. PRODUCTS AND THEIR AVAILABILITY',
    paragraphs: [
      '5.1. Products are described in their respective sheets. Slight differences between photos and reality may occur.',
      '5.2. Indicated availability refers to the moment you consult the Site.',
      '5.3. If an ordered product is unavailable, we will inform you by email with entitlement to a full refund or the alternatives provided.',
    ],
  },
  {
    kind: 'prose',
    title: '6. PAYMENTS',
    paragraphs: [
      '6.1. By submitting the order, you undertake to pay using one of the methods described.',
      '6.2. We accept Visa, MasterCard, Maestro, Postepay and American Express. Card data are encrypted and sent directly to the payment processor.',
      '6.3. Digital Wallets: PayPal, Apple Pay, Shop Pay, Google Pay.',
      '6.4. Bank transfer within 5 working days; goods shipped after credit verification.',
      '6.5. Refunds use the same payment method unless otherwise agreed.',
      '6.6. Advanced security protocols; PSD2 additional verification for purchases over 30 euros.',
    ],
  },
  {
    kind: 'prose',
    title: '7. PRICES',
    paragraphs: [
      '7.1. All prices are in Euros and include VAT where applicable. The applied price is that at the time of order.',
      '7.2. For discounts, we also indicate the lowest price in the last 30 days where applicable.',
    ],
  },
  {
    kind: 'prose',
    title: '8. DELIVERY TIMES AND SHIPPING COSTS',
    paragraphs: [
      '8.1. Shipping costs are borne by you and calculated before payment.',
      '8.2. Products are shipped only after full payment is received.',
      '8.3. Shipment confirmation by email.',
      '8.4. Delivery of available items within 10 working days of contract conclusion.',
      '8.5–8.9. Rules on delivery attempts, storage, risk transfer, packaging checks and carrier reservations. Hidden damage reports within 7 days to info@ideadiluce.com.',
    ],
  },
  {
    kind: 'prose',
    title: '9. RETURN POLICY AND RIGHT OF WITHDRAWAL — B2C CUSTOMERS',
    paragraphs: [
      '9.1. Right of withdrawal within 14 days of receipt. Not applicable to made-to-measure or personalised products.',
      '9.2. Extension to the next working day if the deadline falls on a weekend or public holiday.',
      '9.3. Contact info@ideadiluce.com to organise the return.',
      '9.4. Return in original condition within 7 days of contact with customer service.',
      '9.5. Refund within 14 days of receipt of goods.',
      '9.6. Return shipping costs are your responsibility; return label available on request with deduction from refund.',
    ],
  },
  {
    kind: 'contact',
    company: 'TLB ITALY S.r.l.',
    vat: 'VAT IT17245551001',
    rea: 'REA RM-1705840',
    address: 'Via Appia Pignatelli 450, 00178 Rome (RM), Italy',
    phone: '+39 06 716 7111',
    phoneHref: 'tel:+39067167111',
    email: 'info@ideadiluce.com',
  },
  ],
}

export const DEFAULT_TERMINI_ES: ContentPageContent = {
  layout: 'legal',
  title: 'Términos de Uso y Condiciones de Venta',
  subtitle: 'Condiciones de uso del sitio web y venta online de TLB ITALY S.r.l.',
  intro:
    'El sitio web www.ideadiluce.com ("Sitio") es propiedad de TLB ITALY S.r.l., con domicilio social en Via Appia Pignatelli 450 – 00178 Roma (RM) Italia – CIF IT17245551001.',
  seo: { noindex: false },
  blocks: [
    {
      kind: 'prose',
      title: 'Contacto',
      paragraphs: [
        'Para cualquier información, contacte con nuestro Servicio de Atención al Cliente:',
        'por correo: info@ideadiluce.com',
        'por teléfono: +39 06 716 7111',
      ],
    },
    { kind: 'prose', title: 'Términos de Uso', paragraphs: [] },
    {
      kind: 'prose',
      title: '1. CONDICIONES DE UTILIZACIÓN DEL SITIO WEB',
      paragraphs: [
        'Al utilizar nuestro Sitio web y/o realizar pedidos, el Cliente confirma adherirse a las siguientes directrices.',
        'Utilizar el Sitio únicamente con fines lícitos; abstenerse de pedidos engañosos o fraudulentos; facilitar datos de contacto exactos y veraces.',
        'Al confirmar un pedido declara ser mayor de edad y tener capacidad legal para contratar.',
        'Declinamos responsabilidad por daños causados por el uso de Internet, incluidas interrupciones, intrusiones, virus o fuerza mayor.',
      ],
    },
    {
      kind: 'prose',
      title: '2. PROPIEDAD INDUSTRIAL E INTELECTUAL',
      paragraphs: [
        'El dominio, el Sitio y todos sus contenidos son propiedad exclusiva del Titular o de los legítimos titulares de los derechos.',
        'Está prohibido copiar, descargar o usar marcas, vídeos y logotipos sin autorización escrita.',
      ],
    },
    {
      kind: 'prose',
      title: 'Condiciones Generales de Venta',
      paragraphs: [
        'Las presentes CGV regulan la compra de productos de iluminación a través del Sitio.',
        'Los Términos de Uso son parte integrante de las CGV. Consulte también la Política de Privacidad y Cookies.',
        'El Titular puede modificar estos documentos en cualquier momento; revíselos antes de cada pedido.',
      ],
    },
    {
      kind: 'prose',
      title: '1. Definiciones',
      paragraphs: [
        '1.1. "Contrato": compraventa a distancia de bienes muebles comercializados en el Sitio.',
        '1.2. "Cliente": consumidor mayor de 18 años o profesional.',
        '1.3. "Pedido": propuesta de compra enviada al Titular.',
        '1.4. "Productos": bienes muebles objeto de venta en el Sitio.',
      ],
    },
    {
      kind: 'prose',
      title: '2. Disponibilidad del servicio',
      paragraphs: [
        '2.1. El Titular puede rechazar pedidos anómalos por cantidad o frecuencia.',
        'También puede rechazar pedidos de usuarios en litigio, con fraude de pago o datos falsos.',
      ],
    },
    {
      kind: 'prose',
      title: '3. ÁMBITO DE APLICACIÓN',
      paragraphs: [
        '3.1. Las CGV aplican a todas las ventas en el Sitio; rigen las vigentes al enviar el pedido.',
        '3.2. No regulan ventas de terceros accesibles por enlaces.',
        '3.3. Las CGV pueden modificarse y entran en vigor al publicarse en el Sitio.',
      ],
    },
    {
      kind: 'prose',
      title: '4. CÓMO ENVIAR SU PEDIDO',
      paragraphs: [
        '4.1. Añada productos al carrito, revise y confirme. Puede cancelar antes de preparación en almacén.',
        '4.2. Al enviar el pedido acepta las CGV y la obligación de pagar el precio indicado.',
        '4.3–4.5. Derecho de rechazo por errores; resolución por impago; conservación digital o en papel de cada pedido.',
      ],
    },
    {
      kind: 'prose',
      title: '5. PRODUCTOS Y DISPONIBILIDAD',
      paragraphs: [
        '5.1. Los productos se describen en sus fichas; pueden existir ligeras diferencias con las fotos.',
        '5.2. La disponibilidad se refiere al momento de consulta.',
        '5.3. Si un producto no está disponible, derecho a reembolso o alternativas previstas.',
      ],
    },
    {
      kind: 'prose',
      title: '6. PAGOS',
      paragraphs: [
        '6.1–6.3. Tarjetas Visa, MasterCard, Maestro, Postepay, Amex y Digital Wallets (PayPal, Apple Pay, etc.).',
        '6.4. Transferencia bancaria en 5 días laborables; envío tras verificar el abono.',
        '6.5–6.6. Reembolso por el mismo método; protocolos de seguridad y verificación PSD2 sobre 30 €.',
      ],
    },
    {
      kind: 'prose',
      title: '7. PRECIOS',
      paragraphs: [
        '7.1. Precios en euros con IVA incluido; precio al momento del pedido.',
        '7.2. En descuentos, precio más bajo de los últimos 30 días si procede.',
      ],
    },
    {
      kind: 'prose',
      title: '8. PLAZOS Y GASTOS DE ENVÍO',
      paragraphs: [
        '8.1. Gastos de envío a su cargo, calculados antes del pago.',
        '8.2–8.4. Envío tras pago íntegro; confirmación por correo; entrega en máximo 10 días laborables.',
        '8.5–8.9. Intentos de entrega, depósito, riesgo, verificación del embalaje; daños ocultos en 7 días a info@ideadiluce.com.',
      ],
    },
    {
      kind: 'prose',
      title: '9. DEVOLUCIÓN Y DESISTIMIENTO — B2C',
      paragraphs: [
        '9.1. Desistimiento en 14 días; no aplica a productos a medida o personalizados.',
        '9.2. Plazo extendido al siguiente día laborable si cae en festivo.',
        '9.3–9.4. Contacto info@ideadiluce.com; devolución en estado original en 7 días.',
        '9.5–9.6. Reembolso en 14 días; gastos de devolución a su cargo.',
      ],
    },
    {
      kind: 'contact',
      company: 'TLB ITALY S.r.l.',
      vat: 'CIF IT17245551001',
      rea: 'REA RM-1705840',
      address: 'Via Appia Pignatelli 450, 00178 Roma (RM), Italia',
      phone: '+39 06 716 7111',
      phoneHref: 'tel:+39067167111',
      email: 'info@ideadiluce.com',
    },
  ],
}

export const DEFAULT_TERMINI_FR: ContentPageContent = {
  layout: 'legal',
  title: "Conditions d'Utilisation et Conditions Générales de Vente",
  subtitle: "Conditions d'utilisation du site et de vente en ligne de TLB ITALY S.r.l.",
  intro:
    'Le site www.ideadiluce.com est la propriété de TLB ITALY S.r.l., Via Appia Pignatelli 450 – 00178 Rome (RM) – TVA IT17245551001.',
  seo: { noindex: false },
  blocks: [
    {
      kind: 'prose',
      title: 'Contact',
      paragraphs: [
        'Pour toute information, contactez notre Service Client :',
        'e-mail : info@ideadiluce.com',
        'téléphone : +39 06 716 7111',
      ],
    },
    { kind: 'prose', title: "Conditions d'Utilisation", paragraphs: [] },
    {
      kind: 'prose',
      title: "1. CONDITIONS D'UTILISATION DU SITE",
      paragraphs: [
        'En utilisant le Site et/ou en passant commande, le Client adhère aux directives suivantes.',
        'Utilisation licite uniquement ; pas de commandes frauduleuses ; données de contact exactes.',
        'En confirmant une commande, vous déclarez être majeur et capable de contracter.',
        'Aucune responsabilité pour dommages liés à Internet ou force majeure.',
      ],
    },
    {
      kind: 'prose',
      title: '2. PROPRIÉTÉ INTELLECTUELLE',
      paragraphs: [
        'Le Site et ses contenus sont la propriété exclusive du Titulaire ou des titulaires des droits.',
        'Copie ou utilisation des marques et logos interdite sans autorisation écrite.',
      ],
    },
    {
      kind: 'prose',
      title: 'Conditions Générales de Vente',
      paragraphs: [
        'Les CGV régissent l\'achat de produits d\'éclairage via le Site.',
        'Les Conditions d\'Utilisation font partie intégrante des CGV. Consultez la Politique de Confidentialité et Cookies.',
        'Documents modifiables à tout moment ; à consulter avant chaque commande.',
      ],
    },
    {
      kind: 'prose',
      title: '1. Définitions',
      paragraphs: [
        '1.1. Contrat de vente à distance ; 1.2. Client consommateur ou professionnel ; 1.3. Commande ; 1.4. Produits.',
      ],
    },
    {
      kind: 'prose',
      title: '2. Disponibilité',
      paragraphs: ['2.1. Droit de refuser commandes anormales ou de clients en litige ou fraude.'],
    },
    {
      kind: 'prose',
      title: "3. CHAMP D'APPLICATION",
      paragraphs: [
        '3.1. CGV applicables à la date de commande ; 3.2. Pas de responsabilité pour sites tiers ; 3.3. Modifications publiées sur le Site.',
      ],
    },
    {
      kind: 'prose',
      title: '4. PASSER COMMANDE',
      paragraphs: [
        '4.1. Panier, vérification, confirmation ; annulation possible avant préparation.',
        '4.2–4.5. Acceptation des CGV ; refus en cas d\'erreur ; résolution si impayé ; conservation des commandes.',
      ],
    },
    {
      kind: 'prose',
      title: '5. PRODUITS',
      paragraphs: ['5.1. Fiches produit ; 5.2. Disponibilité au moment de consultation ; 5.3. Remboursement si indisponible.'],
    },
    {
      kind: 'prose',
      title: '6. PAIEMENTS',
      paragraphs: [
        '6.1–6.3. Cartes et Digital Wallets ; 6.4. Virement sous 5 jours ; 6.5–6.6. Remboursement et sécurité PSD2.',
      ],
    },
    {
      kind: 'prose',
      title: '7. PRIX',
      paragraphs: ['7.1. Euros TTC ; 7.2. Prix le plus bas sur 30 jours si remise.'],
    },
    {
      kind: 'prose',
      title: '8. LIVRAISON',
      paragraphs: [
        '8.1–8.4. Frais à votre charge ; expédition après paiement ; délai max. 10 jours ouvrés.',
        '8.5–8.9. Tentatives de livraison, réserves transporteur ; dommages sous 7 jours à info@ideadiluce.com.',
      ],
    },
    {
      kind: 'prose',
      title: '9. RÉTRACTATION B2C',
      paragraphs: [
        '9.1. 14 jours ; pas pour sur mesure ; 9.2. Prolongation si week-end ; 9.3–9.6. Contact, retour, remboursement.',
      ],
    },
    {
      kind: 'contact',
      company: 'TLB ITALY S.r.l.',
      vat: 'TVA IT17245551001',
      rea: 'REA RM-1705840',
      address: 'Via Appia Pignatelli 450, 00178 Rome (RM), Italie',
      phone: '+39 06 716 7111',
      phoneHref: 'tel:+39067167111',
      email: 'info@ideadiluce.com',
    },
  ],
}

export const DEFAULT_TERMINI_DE: ContentPageContent = {
  layout: 'legal',
  title: 'Nutzungsbedingungen und Allgemeine Verkaufsbedingungen',
  subtitle: 'Nutzungsbedingungen der Website und Online-Verkauf von TLB ITALY S.r.l.',
  intro:
    'Die Website www.ideadiluce.com ist Eigentum von TLB ITALY S.r.l., Via Appia Pignatelli 450 – 00178 Rom – USt-IdNr. IT17245551001.',
  seo: { noindex: false },
  blocks: [
    {
      kind: 'prose',
      title: 'Kontakt',
      paragraphs: [
        'Für Informationen wenden Sie sich an unseren Kundenservice:',
        'E-Mail: info@ideadiluce.com',
        'Telefon: +39 06 716 7111',
      ],
    },
    { kind: 'prose', title: 'Nutzungsbedingungen', paragraphs: [] },
    {
      kind: 'prose',
      title: '1. NUTZUNGSBEDINGUNGEN DER WEBSITE',
      paragraphs: [
        'Mit Nutzung der Website und Bestellungen bestätigt der Kunde die Einhaltung folgender Richtlinien.',
        'Nur rechtmäßige Nutzung; keine betrügerischen Bestellungen; wahrheitsgemäße Kontaktdaten.',
        'Mit Bestellbestätigung erklären Sie Volljährigkeit und Vertragsfähigkeit.',
        'Keine Haftung für Internetschäden oder höhere Gewalt.',
      ],
    },
    {
      kind: 'prose',
      title: '2. GEISTIGES EIGENTUM',
      paragraphs: [
        'Website und Inhalte sind Eigentum des Inhabers oder Rechteinhaber.',
        'Kopieren oder Nutzen von Marken ohne schriftliche Genehmigung untersagt.',
      ],
    },
    {
      kind: 'prose',
      title: 'Allgemeine Verkaufsbedingungen',
      paragraphs: [
        'AVB regeln den Kauf von Beleuchtungsprodukten über die Website.',
        'Nutzungsbedingungen sind Bestandteil der AVB. Beachten Sie Datenschutz und Cookie-Richtlinie.',
        'Änderungen jederzeit möglich; vor jeder Bestellung prüfen.',
      ],
    },
    {
      kind: 'prose',
      title: '1. Definitionen',
      paragraphs: [
        '1.1. Fernabsatzvertrag ; 1.2. Kunde Verbraucher oder Gewerbetreibender ; 1.3. Bestellung ; 1.4. Produkte.',
      ],
    },
    {
      kind: 'prose',
      title: '2. Verfügbarkeit',
      paragraphs: ['2.1. Ablehnung ungewöhnlicher Bestellungen oder bei Betrug/Rechtsstreit.'],
    },
    {
      kind: 'prose',
      title: '3. ANWENDUNGSBEREICH',
      paragraphs: [
        '3.1. AVB zum Bestellzeitpunkt ; 3.2. Keine Haftung für Drittlinks ; 3.3. Änderungen ab Veröffentlichung.',
      ],
    },
    {
      kind: 'prose',
      title: '4. BESTELLUNG',
      paragraphs: [
        '4.1. Warenkorb, Prüfung, Bestätigung ; Stornierung bis Lagervorbereitung.',
        '4.2–4.5. AVB-Akzeptanz ; Ablehnung bei Fehlern ; Auflösung bei Nichtzahlung ; Aufbewahrung.',
      ],
    },
    {
      kind: 'prose',
      title: '5. PRODUKTE',
      paragraphs: ['5.1. Produktblätter ; 5.2. Verfügbarkeit bei Abruf ; 5.3. Erstattung bei Nichtverfügbarkeit.'],
    },
    {
      kind: 'prose',
      title: '6. ZAHLUNGEN',
      paragraphs: [
        '6.1–6.3. Karten und Digital Wallets ; 6.4. Überweisung in 5 Werktagen ; 6.5–6.6. Erstattung und PSD2.',
      ],
    },
    {
      kind: 'prose',
      title: '7. PREISE',
      paragraphs: ['7.1. Euro inkl. MwSt. ; 7.2. Niedrigster Preis der letzten 30 Tage bei Rabatt.'],
    },
    {
      kind: 'prose',
      title: '8. LIEFERUNG',
      paragraphs: [
        '8.1–8.4. Versandkosten ; Versand nach Zahlung ; max. 10 Werktage.',
        '8.5–8.9. Zustellversuche, Vorbehalt Spediteur ; Schäden in 7 Tagen an info@ideadiluce.com.',
      ],
    },
    {
      kind: 'prose',
      title: '9. WIDERRUF B2C',
      paragraphs: [
        '9.1. 14 Tage ; nicht bei Maßanfertigung ; 9.2. Verlängerung bei Feiertag ; 9.3–9.6. Kontakt, Rücksendung, Erstattung.',
      ],
    },
    {
      kind: 'contact',
      company: 'TLB ITALY S.r.l.',
      vat: 'USt-IdNr. IT17245551001',
      rea: 'REA RM-1705840',
      address: 'Via Appia Pignatelli 450, 00178 Rom (RM), Italien',
      phone: '+39 06 716 7111',
      phoneHref: 'tel:+39067167111',
      email: 'info@ideadiluce.com',
    },
  ],
}

const TERMINI_BY_LOCALE: Record<SiteLocale, ContentPageContent> = {
  IT: DEFAULT_TERMINI_IT,
  EN: DEFAULT_TERMINI_EN,
  ES: DEFAULT_TERMINI_ES,
  FR: DEFAULT_TERMINI_FR,
  DE: DEFAULT_TERMINI_DE,
}

export function getTerminiDefaults(locale: SiteLocale): ContentPageContent {
  return TERMINI_BY_LOCALE[locale] ?? DEFAULT_TERMINI_IT
}

export function isLegacyTerminiContent(content: unknown): boolean {
  if (!content || typeof content !== 'object') return true
  const blocks = (content as ContentPageContent).blocks
  if (!Array.isArray(blocks)) return true
  return blocks.some(
    (block) =>
      block &&
      typeof block === 'object' &&
      (block as { kind?: string }).kind === 'features' &&
      Array.isArray((block as { items?: unknown[] }).items) &&
      (block as { items: Array<{ title?: string }> }).items.some((item) =>
        ['info aziendali', 'utility', 'seguici'].includes(String(item?.title ?? '')),
      ),
  )
}
