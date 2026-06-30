import type { SiteLocale } from './site.constants.js'
import type { ContentPageContent } from './site.types.js'
import { DEFAULT_PRIVACY_IT } from './site-content-privacy.defaults.js'

export const DEFAULT_PRIVACY_EN: ContentPageContent = {
  layout: 'legal',
  title: 'Privacy Policy',
  subtitle: 'Information on the processing of personal data under the GDPR.',
  intro:
    'This Privacy Policy, issued pursuant to Art. 13 of Regulation (EU) 2016/679 ("GDPR" or "Regulation"), informs Users about how their Personal Data (i.e. any information capable of identifying them directly or indirectly) will be processed when they visit and/or purchase on the website www.ideadiluce.com (the "Site"). This notice, together with the Cookie Policy and the Terms of Use and General Conditions of Sale, sets out the basis on which Users\' personal data will be processed.',
  seo: { noindex: false },
  blocks: [
    {
      kind: 'prose',
      title: 'Data Controller',
      paragraphs: [
        'The Data Controller for personal data collected through the Site is: TLB Italy S.r.l., with registered office at Via Appia Pignatelli, 450, 00178 Rome (RM), VAT IT17245551001 ("Data Controller"), email: info@tlbitaly.com.',
      ],
    },
    {
      kind: 'prose',
      title: 'Processing methods',
      paragraphs: [
        'We attach the utmost importance to Users\' right to privacy and the protection of personal data, which will be processed lawfully. Personal Data provided or acquired will be processed in accordance with the principles of fairness, lawfulness, transparency and confidentiality, with appropriate security measures to prevent unauthorised access, disclosure, modification or destruction.',
        'Processing is carried out using IT and/or telematic tools, with organisational methods and logic strictly related to the stated purposes.',
      ],
    },
    {
      kind: 'prose',
      title: 'Personal data processed',
      paragraphs: [
        'When the User visits the Site, contacts us (by email, phone, post, etc.), subscribes to the newsletter or places an order, we process some of their personal data, either directly or through third parties.',
        'Categories of personal data processed:',
        'Identifying, contact and access data: name and surname, email address, shipping address, phone number, account login credentials, and any other Personal Data voluntarily provided by the User.',
        'Purchase data: data relating to purchases made.',
        'Browsing data: connection data, IP addresses, domain names and other parameters relating to the browser and operating system used.',
        'Usage data: information generated when visiting the Site or making purchases: log data, registration data, interaction and transaction processes, performance indicators, browsing flows and feature usage.',
        'Billing and payment data: VAT number where applicable, tax code, address.',
      ],
    },
    {
      kind: 'prose',
      title: 'Purposes of processing and legal basis',
      paragraphs: [
        'The Controller will process Users\' Personal Data for the conduct of its business and commercial activities, for the specific purposes indicated below.',
      ],
    },
    {
      kind: 'prose',
      title: '1. Contract-related purposes and legal obligations',
      paragraphs: [
        '1.1 Browsing the Site; 1.2 Account registration and management; 1.3 Activities necessary to conclude and perform the contract for the purchase of lighting products sold on the Site; 1.4 Order processing; 1.5 Customer care and responses to requests, complaints and reports; 1.6 Management of requests via remote communication tools; 1.7 Compliance with legal, regulatory and EU obligations; 1.8 Administrative, accounting and tax activities; 1.9 Responses to requests to exercise rights under the contract, applicable law or GDPR.',
        'Legal basis: performance of pre-contractual and contractual obligations (Art. 6.1.b GDPR) or compliance with legal obligations (Art. 6.1.c GDPR). Except for optional account registration data, processing is necessary to conclude and perform contracts via the Site. Failure to provide data will prevent the User from concluding a contract and/or receiving responses to requests.',
      ],
    },
    {
      kind: 'prose',
      title: '2. Analytics, statistics and other non-consent-based purposes',
      paragraphs: [
        '2.1 Statistical analysis of Site usage, browsing and product searches to improve the Site and product offering; 2.2 Protection of the Controller\'s contractual rights and prevention/repression of fraudulent or harmful actions; 2.3 Reminder to Users who started checkout that they added a lighting product to their cart (legitimate interest, Art. 6.1.f GDPR; transactional emails such as abandoned cart).',
      ],
    },
    {
      kind: 'prose',
      title: '3. Direct marketing and profiling',
      paragraphs: [
        '3.1 With User consent, commercial emails with updates, news, offers, promotions and market research, including via automated tools such as email and newsletters; 3.2 With User consent, processing for profiling, retargeting and personalised commercial communications based on the User\'s profile, including automated decision-making.',
        'Legal basis: User consent (Art. 6.1.a GDPR). Provision of data is optional. Refusal, withdrawal or objection will not affect the User\'s ability to purchase on the Site.',
      ],
    },
    {
      kind: 'prose',
      title: '4. Soft-spam',
      paragraphs: [
        'Commercial communications to the email address provided during purchase to offer direct sale of similar products, based on Art. 130, paragraph 4 of the Italian Privacy Code (Legislative Decree 196/2003), provided the User does not object initially or in subsequent communications.',
      ],
    },
    {
      kind: 'prose',
      title: 'Changing choices and withdrawing consent',
      paragraphs: [
        'Users may withdraw consent and/or object to processing for generic marketing and profiling at any time via the methods indicated in the "Data Subject Rights" section.',
        'Processing based on consent before withdrawal remains lawful. After withdrawal/objection for marketing, data will no longer be processed for that purpose unless another legal basis applies (contract performance, legal obligation, legitimate interest).',
      ],
    },
    {
      kind: 'prose',
      title: 'Retention period',
      paragraphs: [
        'Data will be processed for the time necessary to achieve the purposes for which it was collected. Specific retention periods apply per purpose: contract data for the time strictly necessary; tax/accounting/legal data until statutory deadlines; legitimate interest data until the interest is satisfied (up to 10 years for defence in disputes); marketing/profiling data for up to 12 months from consent or last contact. After retention periods, Personal Data will be deleted.',
      ],
    },
    {
      kind: 'prose',
      title: 'Communication and disclosure of data',
      paragraphs: [
        'In addition to the Controller, the following may have access to data: persons involved in organising the Site and company (tax consultant, webmaster, marketing consultant, IT support, software development); third parties processing data on behalf of the Controller (payment services, legal, accountants, system administrators, logistics, newsletter services); public or private entities with legal access; potential buyers of the company or entities resulting from mergers.',
        'Recipients may act as processors, sub-processors or independent controllers. Users may request the updated list of processors under Art. 28 GDPR.',
      ],
    },
    {
      kind: 'prose',
      title: 'Place of processing and transfers abroad',
      paragraphs: [
        'Processing takes place mainly in Italy and EU countries. Some third-party tools may process data outside the EEA. Transfers may occur via external tools (newsletter, remarketing, advertising, social buttons, video). Where transfers to third countries are necessary, the Controller ensures adequate protection under Art. 45 GDPR or standard contractual clauses under Art. 46.2 GDPR.',
      ],
    },
    {
      kind: 'prose',
      title: 'Cookies',
      paragraphs: [
        'This Site uses cookies — small text files installed on users\' devices to improve browsing, personalise content and ads, provide social features and analyse traffic. See the Cookie Policy for details.',
      ],
    },
    {
      kind: 'prose',
      title: 'Personal Data processing tools',
      paragraphs: [],
    },
    {
      kind: 'prose',
      title: 'Newsletter',
      paragraphs: [
        'Mailchimp (Intuit Inc.) — email address management and sending service. Processing location: UNITED STATES. Users may unsubscribe via the link in each commercial communication.',
      ],
    },
    {
      kind: 'prose',
      title: 'Social network buttons',
      paragraphs: [
        'Facebook and Instagram (Meta Platforms Ireland Limited) — interaction with social networks. Personal Data collected: Cookies, Usage data. Processing location: IRELAND – UNITED STATES.',
      ],
    },
    {
      kind: 'prose',
      title: 'Payment management',
      paragraphs: [
        'NEXI (Nexi S.p.A.), PayPal (Paypal Europe S.a.r.l.), Apple Pay (Apple Payments Inc.), Google Pay (Google Ireland Limited) — online payment services. See each provider\'s privacy policy for details.',
      ],
    },
    {
      kind: 'prose',
      title: 'Statistics',
      paragraphs: [
        'Google Analytics (Google Ireland Limited) — traffic analysis with IP anonymisation enabled. Opt-out: https://tools.google.com/dlpage/gaoptout?hl=en. Processing location: IRELAND and in some cases UNITED STATES.',
        'Facebook Pixel (Meta Platforms Ireland Limited) — conversion tracking. Processing location: Ireland and in some cases UNITED STATES.',
      ],
    },
    {
      kind: 'prose',
      title: 'Remarketing',
      paragraphs: [
        'Services enabling advertising based on past Site usage via Usage Data tracking and Cookies. This Site uses Facebook Pixel.',
      ],
    },
    {
      kind: 'prose',
      title: 'Data Subject Rights',
      paragraphs: [
        'Data subjects may exercise the rights under Arts. 7 and 15-22 of the Regulation: access, rectification, erasure, restriction, portability, objection, and withdrawal of consent.',
        'Requests may be sent to the Controller at legal@ideadiluce.com. Data subjects may lodge a complaint with the Italian Data Protection Authority (Garante per la protezione dei dati personali, Piazza Venezia 11, 00187 Rome, http://www.garanteprivacy.it/).',
      ],
    },
    {
      kind: 'prose',
      title: 'Changes to this Privacy Policy',
      paragraphs: [
        'The Controller reserves the right to modify this Privacy Policy at any time by publishing updates on this page. Please check this page regularly, referring to the last update date at the bottom.',
        'If Users do not accept changes, they must stop using the Site and may request deletion of their Personal Data. Previous versions apply to data collected before changes.',
        'Privacy Policy last updated: March 2024.',
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
      email: 'info@tlbitaly.com',
    },
  ],
}

export const DEFAULT_PRIVACY_ES: ContentPageContent = {
  layout: 'legal',
  title: 'Política de Privacidad',
  subtitle: 'Información sobre el tratamiento de datos personales según el RGPD.',
  intro:
    'La presente Política de Privacidad, conforme al art. 13 del Reglamento (UE) 2016/679 (RGPD), informa al Usuario sobre el tratamiento de sus Datos Personales al visitar y/o comprar en www.ideadiluce.com (el "Sitio"). Junto con la Política de Cookies y los Términos de Uso, establece las bases del tratamiento de datos personales.',
  seo: { noindex: false },
  blocks: [
    {
      kind: 'prose',
      title: 'Responsable del tratamiento',
      paragraphs: [
        'TLB Italy S.r.l., Via Appia Pignatelli 450, 00178 Roma, CIF IT17245551001, email: info@tlbitaly.com.',
      ],
    },
    {
      kind: 'prose',
      title: 'Modalidades de tratamiento',
      paragraphs: [
        'Los datos personales se tratarán de forma lícita, con principios de corrección, licitud, transparencia y confidencialidad, mediante medidas de seguridad adecuadas y herramientas informáticas/telemáticas.',
      ],
    },
    {
      kind: 'prose',
      title: 'Datos personales tratados',
      paragraphs: [
        'Datos identificativos y de contacto; datos de compra; datos de navegación; datos de uso; datos de facturación y pago.',
      ],
    },
    {
      kind: 'prose',
      title: 'Finalidades y base jurídica',
      paragraphs: [
        '1. Contrato y obligaciones legales (art. 6.1.b y 6.1.c RGPD): navegación, cuenta, pedidos, atención al cliente, obligaciones fiscales y contables.',
        '2. Análisis y estadística (interés legítimo): mejora del sitio, prevención de fraude, carrito abandonado.',
        '3. Marketing y perfilado (consentimiento): newsletters, ofertas, retargeting.',
        '4. Soft-spam: comunicaciones sobre productos similares según normativa italiana.',
      ],
    },
    {
      kind: 'prose',
      title: 'Revocación del consentimiento y conservación',
      paragraphs: [
        'El Usuario puede revocar el consentimiento en cualquier momento. Plazos de conservación según finalidad: contractual, fiscal/legal, interés legítimo (hasta 10 años en litigios), marketing (12 meses).',
      ],
    },
    {
      kind: 'prose',
      title: 'Comunicación y transferencias',
      paragraphs: [
        'Acceso por proveedores, asesores, servicios de pago, logística, newsletter y autoridades. Tratamiento principalmente en Italia/UE; posibles transferencias fuera del EEE con garantías adecuadas (art. 45 y 46 RGPD).',
      ],
    },
    {
      kind: 'prose',
      title: 'Cookies y herramientas',
      paragraphs: [
        'Cookies: ver Política de Cookies. Herramientas: Mailchimp, Facebook/Instagram, Nexi, PayPal, Apple Pay, Google Pay, Google Analytics (IP anonimizado), Facebook Pixel.',
      ],
    },
    {
      kind: 'prose',
      title: 'Derechos del interesado',
      paragraphs: [
        'Derechos arts. 7 y 15-22 RGPD: acceso, rectificación, supresión, limitación, portabilidad, oposición. Contacto: legal@ideadiluce.com. Reclamación ante el Garante italiano (www.garanteprivacy.it).',
      ],
    },
    {
      kind: 'prose',
      title: 'Modificaciones',
      paragraphs: ['El Responsable puede modificar esta política en cualquier momento. Actualizada en marzo de 2024.'],
    },
    {
      kind: 'contact',
      company: 'TLB ITALY S.r.l.',
      vat: 'CIF IT17245551001',
      rea: 'REA RM-1705840',
      address: 'Via Appia Pignatelli 450, 00178 Roma (RM), Italia',
      phone: '+39 06 716 7111',
      phoneHref: 'tel:+39067167111',
      email: 'info@tlbitaly.com',
    },
  ],
}

export const DEFAULT_PRIVACY_FR: ContentPageContent = {
  layout: 'legal',
  title: 'Politique de Confidentialité',
  subtitle: 'Information sur le traitement des données personnelles (RGPD).',
  intro:
    'La présente Politique de Confidentialité, conformément à l\'art. 13 du Règlement (UE) 2016/679 (RGPD), informe l\'Utilisateur sur le traitement de ses Données Personnelles lors de la visite et/ou de l\'achat sur www.ideadiluce.com (le « Site »).',
  seo: { noindex: false },
  blocks: [
    {
      kind: 'prose',
      title: 'Responsable du traitement',
      paragraphs: ['TLB Italy S.r.l., Via Appia Pignatelli 450, 00178 Rome, TVA IT17245551001, email : info@tlbitaly.com.'],
    },
    {
      kind: 'prose',
      title: 'Modalités de traitement',
      paragraphs: [
        'Traitement licite selon les principes de loyauté, licéité, transparence et confidentialité, avec mesures de sécurité appropriées.',
      ],
    },
    {
      kind: 'prose',
      title: 'Données personnelles traitées',
      paragraphs: [
        'Données d\'identification et de contact ; données d\'achat ; données de navigation ; données d\'utilisation ; données de facturation et de paiement.',
      ],
    },
    {
      kind: 'prose',
      title: 'Finalités et base juridique',
      paragraphs: [
        '1. Contrat et obligations légales (art. 6.1.b et 6.1.c RGPD). 2. Analyse et statistiques (intérêt légitime). 3. Marketing et profilage (consentement). 4. Soft-spam selon la loi italienne.',
      ],
    },
    {
      kind: 'prose',
      title: 'Consentement et conservation',
      paragraphs: [
        'Révocation possible à tout moment. Durées de conservation selon la finalité : contractuelle, fiscale/légale, intérêt légitime, marketing (12 mois).',
      ],
    },
    {
      kind: 'prose',
      title: 'Communication et transferts',
      paragraphs: [
        'Accès par prestataires, conseils, paiement, logistique, newsletter. Traitement principalement en Italie/UE ; transferts hors EEE avec garanties (art. 45 et 46 RGPD).',
      ],
    },
    {
      kind: 'prose',
      title: 'Cookies et outils',
      paragraphs: [
        'Cookies : voir Politique Cookies. Outils : Mailchimp, Facebook/Instagram, Nexi, PayPal, Apple Pay, Google Pay, Google Analytics, Facebook Pixel.',
      ],
    },
    {
      kind: 'prose',
      title: 'Droits des personnes concernées',
      paragraphs: [
        'Droits arts. 7 et 15-22 RGPD. Contact : legal@ideadiluce.com. Réclamation auprès du Garante italien (www.garanteprivacy.it).',
      ],
    },
    {
      kind: 'prose',
      title: 'Modifications',
      paragraphs: ['Le Responsable peut modifier cette politique à tout moment. Mise à jour : mars 2024.'],
    },
    {
      kind: 'contact',
      company: 'TLB ITALY S.r.l.',
      vat: 'TVA IT17245551001',
      rea: 'REA RM-1705840',
      address: 'Via Appia Pignatelli 450, 00178 Rome (RM), Italie',
      phone: '+39 06 716 7111',
      phoneHref: 'tel:+39067167111',
      email: 'info@tlbitaly.com',
    },
  ],
}

export const DEFAULT_PRIVACY_DE: ContentPageContent = {
  layout: 'legal',
  title: 'Datenschutzerklärung',
  subtitle: 'Informationen zur Verarbeitung personenbezogener Daten gemäß DSGVO.',
  intro:
    'Diese Datenschutzerklärung gemäß Art. 13 der Verordnung (EU) 2016/679 (DSGVO) informiert Nutzer über die Verarbeitung ihrer personenbezogenen Daten beim Besuch und/oder Kauf auf www.ideadiluce.com (die „Website").',
  seo: { noindex: false },
  blocks: [
    {
      kind: 'prose',
      title: 'Verantwortlicher',
      paragraphs: ['TLB Italy S.r.l., Via Appia Pignatelli 450, 00178 Rom, USt-IdNr. IT17245551001, E-Mail: info@tlbitaly.com.'],
    },
    {
      kind: 'prose',
      title: 'Verarbeitungsmethoden',
      paragraphs: [
        'Rechtmäßige Verarbeitung nach den Grundsätzen von Rechtmäßigkeit, Transparenz und Vertraulichkeit mit angemessenen Sicherheitsmaßnahmen.',
      ],
    },
    {
      kind: 'prose',
      title: 'Verarbeitete personenbezogene Daten',
      paragraphs: [
        'Identifikations- und Kontaktdaten; Kaufdaten; Navigationsdaten; Nutzungsdaten; Rechnungs- und Zahlungsdaten.',
      ],
    },
    {
      kind: 'prose',
      title: 'Zwecke und Rechtsgrundlage',
      paragraphs: [
        '1. Vertrag und gesetzliche Pflichten (Art. 6.1.b und 6.1.c DSGVO). 2. Analyse und Statistik (berechtigtes Interesse). 3. Marketing und Profiling (Einwilligung). 4. Soft-Spam nach italienischem Recht.',
      ],
    },
    {
      kind: 'prose',
      title: 'Einwilligung und Aufbewahrung',
      paragraphs: [
        'Widerruf jederzeit möglich. Aufbewahrungsfristen je nach Zweck: vertraglich, steuerlich/rechtlich, berechtigtes Interesse, Marketing (12 Monate).',
      ],
    },
    {
      kind: 'prose',
      title: 'Weitergabe und Übermittlung',
      paragraphs: [
        'Zugang durch Dienstleister, Berater, Zahlung, Logistik, Newsletter. Verarbeitung hauptsächlich in Italien/EU; Übermittlungen außerhalb des EWR mit Garantien (Art. 45 und 46 DSGVO).',
      ],
    },
    {
      kind: 'prose',
      title: 'Cookies und Tools',
      paragraphs: [
        'Cookies: siehe Cookie-Richtlinie. Tools: Mailchimp, Facebook/Instagram, Nexi, PayPal, Apple Pay, Google Pay, Google Analytics, Facebook Pixel.',
      ],
    },
    {
      kind: 'prose',
      title: 'Rechte der Betroffenen',
      paragraphs: [
        'Rechte gem. Art. 7 und 15-22 DSGVO. Kontakt: legal@ideadiluce.com. Beschwerde beim italienischen Garante (www.garanteprivacy.it).',
      ],
    },
    {
      kind: 'prose',
      title: 'Änderungen',
      paragraphs: ['Der Verantwortliche kann diese Erklärung jederzeit ändern. Aktualisiert: März 2024.'],
    },
    {
      kind: 'contact',
      company: 'TLB ITALY S.r.l.',
      vat: 'USt-IdNr. IT17245551001',
      rea: 'REA RM-1705840',
      address: 'Via Appia Pignatelli 450, 00178 Rom (RM), Italien',
      phone: '+39 06 716 7111',
      phoneHref: 'tel:+39067167111',
      email: 'info@tlbitaly.com',
    },
  ],
}

const PRIVACY_BY_LOCALE: Record<SiteLocale, ContentPageContent> = {
  IT: DEFAULT_PRIVACY_IT,
  EN: DEFAULT_PRIVACY_EN,
  ES: DEFAULT_PRIVACY_ES,
  FR: DEFAULT_PRIVACY_FR,
  DE: DEFAULT_PRIVACY_DE,
}

export function getPrivacyDefaults(locale: SiteLocale): ContentPageContent {
  return PRIVACY_BY_LOCALE[locale] ?? DEFAULT_PRIVACY_IT
}

/** Rileva contenuto privacy legacy (breve placeholder pre-migrazione). */
export function isLegacyPrivacyContent(content: unknown): boolean {
  if (!content || typeof content !== 'object') return true
  const page = content as ContentPageContent
  const blocks = page.blocks
  if (!Array.isArray(blocks)) return true

  const version = (page.seo as { privacyVersion?: number } | undefined)?.privacyVersion
  if (version !== undefined) return false

  if (blocks.length !== 1) return false
  const block = blocks[0]
  if (!block || block.kind !== 'prose') return false
  const paragraphs = block.paragraphs ?? []
  return (
    paragraphs.length <= 3 &&
    paragraphs.some((p) => p.includes('Stripe secondo la propria informativa'))
  )
}
