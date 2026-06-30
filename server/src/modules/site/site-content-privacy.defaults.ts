import type { ContentPageContent } from './site.types.js'

/** Versione contenuto privacy — incrementare per forzare migrazione da versioni precedenti. */
export const PRIVACY_CONTENT_VERSION = 1

/** Privacy Policy — versione italiana (fonte per BO e traduzioni). */
export const DEFAULT_PRIVACY_IT: ContentPageContent = {
  layout: 'legal',
  title: 'Privacy Policy',
  subtitle: 'Informativa sul trattamento dei dati personali ai sensi del GDPR.',
  intro:
    'Con la presente Privacy Policy, resa ai sensi dell\'art. 13 del Regolamento (UE) 2016/679 ("GDPR" o "Regolamento"), desideriamo informare l\'Utente sulle modalità con cui verranno trattati i suoi Dati Personali (cioè qualsiasi informazione in grado di identificarlo direttamente o indirettamente) quando visita e/o acquista sul sito web www.ideadiluce.com (di seguito, il "Sito"). Questa informativa, unitamente alla Cookie Policy e ai Termini d\'Uso e Condizioni Generali di Vendita, stabilisce le basi su cui verranno trattati i dati personali degli Utenti.',
  seo: { noindex: false, privacyVersion: PRIVACY_CONTENT_VERSION },
  blocks: [
    {
      kind: 'prose',
      title: 'Titolare del trattamento dei dati personali',
      paragraphs: [
        'Titolare del Trattamento dei dati personali raccolti per il tramite del Sito è: TLB Italy S.r.l., con sede legale in Roma (RM) Via Appia Pignatelli, 450, cap 00178, P.IVA n. IT17245551001 (d\'ora in poi "Titolare del Trattamento"), indirizzo e-mail: info@tlbitaly.com.',
      ],
    },
    {
      kind: 'prose',
      title: 'Modalità di trattamento dei dati personali',
      paragraphs: [
        'Teniamo nella massima considerazione il diritto alla privacy ed alla protezione dei dati personali dei nostri Utenti che verranno trattati lecitamente. I Dati Personali forniti o acquisiti saranno oggetto di Trattamento improntato ai principi di correttezza, liceità, trasparenza e di tutela della riservatezza ai sensi delle vigenti normative, mediante le opportune misure di sicurezza volte ad impedire l\'accesso, la divulgazione, la modifica o la distruzione non autorizzata dei Dati Personali.',
        'Il Trattamento viene effettuato mediante strumenti informatici e/o telematici, con modalità organizzative e con logiche strettamente correlate alle finalità indicate.',
      ],
    },
    {
      kind: 'prose',
      title: 'Dati personali trattati',
      paragraphs: [
        'Quando l\'Utente visita il Sito, ci contatta (via mail, via telefono, via posta ecc.), si iscrive alla newsletter o invia un ordine, trattiamo alcuni suoi dati personali, in modo autonomo o tramite terze parti.',
        'Elenchiamo le categorie di dati personali trattati:',
        'Dati identificativi, di contatto e di accesso: nome e cognome, indirizzo email, indirizzo di spedizione, numero di telefono, e credenziali di accesso all\'account, nonché degli eventuali altri Dati Personali comunicati volontariamente dall\'Utente.',
        'Dati di acquisto: i dati che si riferiscono agli acquisti compiuti.',
        'Dati di navigazione: relativi alla connessione, indirizzi IP, nomi a dominio ed altri parametri relativi al browser e al sistema operativo utilizzato.',
        'Dati di utilizzo: informazioni generate visitando il Sito o compiendo acquisti su questo: dati di log, dati relativi a registrazioni effettuate, processi di interazione e di transazione, indicatori di prestazione, dati relativi a flussi di navigazione e utilizzo di funzionalità.',
        'Dati di fatturazione e Dati di pagamento: eventuale Partita IVA, codice fiscale, indirizzo.',
      ],
    },
    {
      kind: 'prose',
      title: 'Finalità del trattamento e base giuridica',
      paragraphs: [
        'Il Titolare tratterà i Dati Personali degli Utenti, come sopra elencati, per lo svolgimento delle sue attività economiche e commerciali, per le specifiche finalità di seguito indicate.',
      ],
    },
    {
      kind: 'prose',
      title: '1. Finalità inerenti il contratto e gli obblighi di legge',
      paragraphs: [
        '1.1 Navigazione sul Sito;',
        '1.2 Registrazione e Gestione dell\'account (recupero credenziali, cancellazione ecc.) e fruizione dei servizi connessi;',
        '1.3 Attività necessarie alla conclusione del contratto per l\'acquisto di articoli di illuminazione venduti dal Sito e alla sua esecuzione;',
        '1.4 Elaborazione degli ordini;',
        '1.5 Attività di assistenza e customer care nonché per dare riscontro a richieste, reclami, segnalazioni e contestazioni provenienti dagli Utenti via email agli indirizzi del Titolare oppure attraverso altri canali di comunicazione;',
        '1.6 Gestione delle richieste degli Utenti tramite strumenti di comunicazione a distanza, come e-mail, chat, telefono, SMS, chatbot, banner, sistemi di notifica e altri strumenti di comunicazione a distanza presenti sul Sito;',
        '1.7 Adempimento degli obblighi derivanti dalla legge vigente, regolamenti o normativa comunitaria (es. obblighi fiscali e contabili) ovvero gestione e risposta a richieste provenienti dalle competenti autorità amministrative, fiscali e giudiziarie;',
        '1.8 Attività di natura amministrativa, contabile e fiscale quali attività connesse al contratto concluso tramite il Sito, quali, a titolo esemplificativo, l\'emissione delle ricevute e/o fatture, la tenuta delle scritture contabili;',
        '1.9 Riscontro alle richieste di esercizio dei diritti riconosciuti agli Utenti dal contratto stipulato con il Titolare, dalla legge in relazione a tale contratto o dal GDPR, e conseguenti attività.',
        'Per queste finalità, la Base giuridica è la necessità di dare esecuzione agli obblighi precontrattuali e contrattuali di cui l\'Utente è parte (art. 6.1.b) del GDPR) oppure l\'adempimento di obblighi di legge cui è soggetto il Titolare (art. 6.1.c) del GDPR).',
        'Pertanto, ad eccezione dei dati di registrazione dell\'account che è facoltativa, il loro trattamento è necessario per consentire la conclusione e l\'esecuzione del contratto tramite il Sito ovvero per rispondere alle richieste precontrattuali effettuate dall\'Utente in relazione al Sito. La mancata comunicazione dei dati, dunque, comporterà l\'impossibilità per l\'Utente di concludere un contratto tramite il Sito e/o di ricevere risposta alle richieste effettuate.',
      ],
    },
    {
      kind: 'prose',
      title: '2. Finalità di analisi e statistica e altre finalità non basate sul consenso',
      paragraphs: [
        '2.1 Svolgere analisi statistiche rispetto all\'utilizzo del Sito, alla navigazione, alla ricerca di articoli di illuminazione, per migliorare il sito e l\'offerta dei prodotti venduti per suo tramite;',
        '2.2 Garantire il rispetto dei diritti contrattuali del Titolare del Trattamento ovvero dimostrare di avere adempiuto agli obblighi nascenti dal contratto con l\'interessato o imposti dalla legge, per prevenire e/o reprimere azioni fraudolente o dannose;',
        '2.3 Ricordare all\'Utente che ha intrapreso il procedimento d\'acquisto di aver inserito un articolo di illuminazione nel suo carrello d\'acquisto. La base giuridica di questo trattamento è l\'interesse legittimo (art. 6.1.f) del Regolamento). Talune volte la Base Giuridica consiste nel legittimo interesse (art. 6, comma 1, lett. f) in combinato disposto con il considerando 47 del Regolamento), per l\'invio di comunicazioni di email transazionali (es. carrello abbandonato).',
      ],
    },
    {
      kind: 'prose',
      title: '3. Finalità di marketing diretto e profilazione',
      paragraphs: [
        '3.1 Con il consenso dell\'Utente, invieremo email commerciali per mostrargli aggiornamenti, novità, offerte e promozioni, ricerche di mercato, anche tramite strumenti di trattamenti automatizzati come email e newsletter;',
        '3.2 Con il consenso dell\'Utente, tratteremo i suoi Dati personali per attribuirgli particolari caratteristiche, preferenze, ed inviargli, anche tramite strumenti di trattamenti automatizzati come il "retargeting" oppure tramite inserimento in cluster di soggetti dalle caratteristiche comuni, comunicazioni commerciali personalizzate e diversificate, sulla base del suo profilo.',
        'Per queste finalità, il trattamento, compresa la decisione finale circa la comunicazione promozionale da inviare o far visualizzare all\'utente in base al/ai cluster di appartenenza, avviene in modo automatizzato, senza l\'intervento umano, sulla base di algoritmi i cui parametri sono stati precedentemente impostati.',
        'La base giuridica è il consenso espresso dell\'Utente al trattamento dei dati personali per queste finalità (art. 6.1.a) del Regolamento). Il conferimento dei dati per queste finalità è facoltativo. In caso di mancato consenso, di revoca dello stesso od esercizio del diritto di opposizione non sarà in alcun modo pregiudicata la possibilità per l\'Utente di effettuare acquisti sul Sito.',
      ],
    },
    {
      kind: 'prose',
      title: '4. Soft-spam',
      paragraphs: [
        'Per inviare all\'indirizzo email dell\'Utente rilasciato nell\'ambito dell\'acquisto degli articoli tramite il Sito, comunicazioni commerciali per proporre la vendita diretta di articoli analoghi. Tale attività non necessita dell\'acquisizione di un previo consenso espresso dell\'interessato in quanto esercitata sulla base giuridica di cui all\'art. 130, comma 4, del Codice della privacy (D.lgs. 30 giugno 2003, n. 196) che la consente espressamente, a condizione che l\'utente non rifiuti tale uso, inizialmente o in occasione di successive comunicazioni.',
      ],
    },
    {
      kind: 'prose',
      title: 'Modifica delle scelte e revoca del consenso',
      paragraphs: [
        'In caso di rilascio del consenso, l\'Utente potrà in qualsiasi momento revocare il consenso prestato e/o opporsi al trattamento dei dati personali per finalità di marketing generico e profilazione attraverso le modalità indicate nella sezione "Diritti degli Interessati" più avanti in questa informativa.',
        'In caso di revoca del consenso, si considereranno comunque legittimi i trattamenti eseguiti sulla base del consenso prestato prima della sua revoca. In caso di revoca del consenso e/o opposizione al trattamento dei suoi dati per la finalità del marketing generico, i dati dell\'utente non verranno più trattati per tale finalità e verranno conservati dal Titolare solo nella circostanza in cui sussista un\'altra base giuridica che ne legittima il trattamento (es. esecuzione contrattuale; obbligo di legge; interesse legittimo).',
      ],
    },
    {
      kind: 'prose',
      title: 'Tempo di conservazione',
      paragraphs: [
        'Il Titolare tratterà i dati personali degli Utenti per il tempo necessario al raggiungimento delle finalità per cui tali dati sono stati raccolti, come definite in questa informativa. Comunque, per ciascuna delle finalità indicate, i dati personali raccolti saranno conservati per il tempo di seguito specificato:',
        'Per le finalità inerenti il Contratto il Titolare tratterà i dati dell\'Utente per il tempo strettamente necessario allo svolgimento delle singole attività di trattamento, fermo restando che, scaduto tale termine, il Titolare potrà conservare i dati per le finalità e per i periodi massimi di conservazione di cui alle altre sezioni della presente informativa, se pertinenti e/o, comunque, nei casi stabiliti dal GDPR e/o dalla legge.',
        'Per le finalità fiscali, di amministrazione, contabilità e di legge, sino alla scadenza dei termini di legge previsti per l\'effettuazione di ciascun adempimento e/o per i tempi di conservazione previsti dalla legge. In caso di chiusura dell\'account su iniziativa dell\'Utente i dati in esso riportati saranno conservati per finalità amministrative per un periodo non superiore a quello necessario agli scopi, per i quali sono stati raccolti e trattati.',
        'Per le finalità basate sul legittimo interesse del Titolare, questo tratterà i dati dell\'Utente per il tempo strettamente necessario al soddisfacimento di tale interesse, salvo che, a fronte di contestazioni e/o reclami, il Titolare necessiti di conservare i dati personali per svolgere attività di difesa (1.7 – 1.8) per i 10 anni successivi (di prescrizione) oppure, in presenza di contenzioso, l\'ulteriore conservazione sia determinata dalla durata del contenzioso o da specifiche richieste dell\'autorità. L\'Utente può ottenere maggiori informazioni sul legittimo interesse perseguito contattando il Titolare.',
        'Per la finalità del marketing diretto e della profilazione, fintanto che il consenso non venga revocato e comunque per un periodo pari a 12 mesi da quando il consenso è stato prestato oppure rinnovato dall\'Utente, in occasione di un nuovo acquisto o dalla data dell\'ultimo contatto con l\'Utente, con ciò intendendosi ad esempio, l\'apertura della newsletter.',
        'Trascorsi tali tempi di conservazione i Dati Personali saranno cancellati e l\'Utente non potrà più esercitare i diritti di accesso, cancellazione, rettifica e portabilità dei Dati.',
      ],
    },
    {
      kind: 'prose',
      title: 'Comunicazione e diffusione dei dati',
      paragraphs: [
        'Oltre al Titolare, in alcuni casi, potrebbero avere accesso ai dati:',
        'Soggetti coinvolti nell\'organizzazione del Sito web e della società. Nello specifico, i dati verranno comunicati a Consulente Fiscale, Webmaster, Consulente Marketing e Social-Media, Società per Assistenza Tecnico-Informatica, Società di Sviluppo Software per il Gestionale di Produzione.',
        'Soggetti terzi che svolgono compiti accessori e strumentali rispetto all\'attività del Titolare e che trattano i dati personali per conto del Titolare (per esempio: servizi di pagamento, legali, commercialisti, amministratori di sistema, società di logistica, servizi di newsletter). Nello specifico, è stato concluso un accordo di assistenza tecnica per la riparazione di apparecchiature informatiche su cui possono essere contenuti anche dati personali di clienti.',
        'Soggetti pubblici o privati che possono accedere ai Dati in osservanza della legge, dei regolamenti e dei provvedimenti emanati dalle autorità competenti.',
        'Potenziali acquirenti della società Titolare ed entità risultanti dalla fusione o ogni altra forma di trasformazione.',
        'Tali destinatari, a seconda dei casi, trattano i dati personali degli Utenti in qualità di incaricati, responsabili del trattamento o autonomi titolari. L\'Utente può richiedere l\'elenco aggiornato dei Responsabili del Trattamento di cui all\'art. 28 GDPR.',
      ],
    },
    {
      kind: 'prose',
      title: 'Luogo del trattamento e trasferimento dei dati all\'estero',
      paragraphs: [
        'Il trattamento dei Dati si svolge essenzialmente in Italia e nei Paesi dell\'Unione Europea.',
        'Alcuni strumenti di terzi possono trattare i dati degli utenti di questo sito web in Paesi al di fuori dello Spazio Economico Europeo (i "Paesi Terzi").',
        'Il trasferimento dei dati verso Paesi Terzi può avvenire anche attraverso l\'utilizzo di tool esterni che permettono determinati servizi (es. newsletter, remarketing, advertising, utilizzo dei tasti social, visualizzazione di video).',
        'Talune volte l\'utilizzo di tali strumenti può implicare il trasferimento dei dati personali degli utenti che visitano questo sito web verso un Paese terzo per il quale non vi è una decisione di adeguatezza della Commissione Europea.',
        'Qualora vi fosse esigenza di trasferire i dati verso Paesi Terzi, il Titolare si impegna ad assicurare che il Paese in cui saranno inviati i dati garantisca un livello adeguato di protezione, così come previsto dall\'articolo 45 GDPR; tale trasferimento sarà regolato sulla base delle clausole contrattuali standard di protezione dei dati approvate dalla Commissione Europea per il trasferimento di informazioni personali al di fuori del SEE ai sensi dell\'articolo 46.2 GDPR.',
      ],
    },
    {
      kind: 'prose',
      title: 'Cookie',
      paragraphs: [
        'Questo Sito web utilizza i cookie. I cookie sono piccoli file di testo che possono essere installati dai siti web sui dispositivi degli utenti per rendere più efficiente l\'esperienza di navigazione e per personalizzare contenuti e annunci, fornire le funzioni dei social network e analizzare il traffico. Puoi gestire le preferenze dal browser o contattarci per maggiori informazioni.',
      ],
    },
    {
      kind: 'prose',
      title: 'Strumenti di Trattamento dei Dati Personali',
      paragraphs: [],
    },
    {
      kind: 'prose',
      title: 'Newsletter',
      paragraphs: [
        'Il servizio di newsletter permette al Titolare del Trattamento di inviare via email agli utenti promozioni e comunicazioni commerciali.',
        'Mailchimp (Intuit Inc.) — Mailchimp è un servizio di gestione indirizzi e invio di messaggi email fornito da Intuit Inc. Luogo del trattamento: STATI UNITI. Se l\'Utente non vuole che i propri dati personali vengano gestiti da Mailchimp, sarà necessario che annulli la sua iscrizione alla newsletter. A tal fine, il Titolare mette a disposizione un tasto di disiscrizione (link di unsubscribe) in ogni comunicazione commerciale.',
      ],
    },
    {
      kind: 'prose',
      title: 'Tasti social network',
      paragraphs: [
        'L\'Utente può utilizzare i tasti social per visitare le pagine social del Sito. I seguenti strumenti raccolgono dati personali come dati di traffico sulle pagine visitate:',
        'Facebook (Meta Platforms Ireland Limited) — Dati Personali raccolti: Cookie, Dati di utilizzo e altri dati come da relativa privacy policy. Luogo del trattamento: IRLANDA – STATI UNITI.',
        'Instagram (Meta Platforms Ireland Limited) — Dati Personali raccolti: Cookie, Dati di utilizzo e altri dati come da relativa privacy policy. Luogo del trattamento: IRLANDA – STATI UNITI.',
      ],
    },
    {
      kind: 'prose',
      title: 'Gestione dei pagamenti',
      paragraphs: [
        'NEXI (Nexi S.p.A.) — Servizio di pagamento che consente all\'Utente di effettuare pagamenti online tramite carta di credito. Luogo del trattamento: consulta la privacy policy di Nexi.',
        'PAYPAL (Paypal Europe S.a.r.l.) — Servizio di pagamento che consente all\'Utente di effettuare pagamenti online utilizzando le proprie credenziali PayPal. Luogo del trattamento: LUSSEMBURGO.',
        'APPLE PAY (Apple Payments Inc.) — Servizio di pagamento fornito da Apple Payments Inc.',
        'GOOGLE PAY (Google Ireland Limited) — Servizio di pagamento fornito da Google Ireland Limited.',
      ],
    },
    {
      kind: 'prose',
      title: 'Statistica',
      paragraphs: [
        'I servizi di statistica permettono al Titolare del Trattamento di monitorare e analizzare i dati di traffico e servono a tener traccia del comportamento dell\'Utente.',
        'Google Analytics (Google Ireland Limited) — Google Analytics è un servizio di analisi fornito da Google Ireland Limited. In questo sito è attiva la funzione di anonimizzazione dell\'indirizzo IP. L\'utilizzo di Google Analytics può prevedere in alcuni casi il trasferimento dei dati verso Paesi terzi quali gli Stati Uniti. Al link https://tools.google.com/dlpage/gaoptout?hl=it è disponibile il componente aggiuntivo del browser per la disattivazione di Google Analytics. Luogo del trattamento: IRLANDA e in taluni casi STATI UNITI.',
        'Pixel di Facebook (Meta Platforms Ireland Limited) — Strumento di monitoraggio delle conversioni di Facebook. Dati Personali raccolti: Cookie; Dati di utilizzo. Luogo del trattamento: Irlanda e in taluni casi STATI UNITI.',
      ],
    },
    {
      kind: 'prose',
      title: 'Remarketing',
      paragraphs: [
        'Questi servizi consentono a questo Sito di comunicare, ottimizzare e offrire annunci pubblicitari basati sull\'utilizzo passato di questo Sito web da parte dell\'Utente. Questa attività viene effettuata tramite il tracciamento dei Dati di Utilizzo e l\'uso di Cookie. Questo Sito web utilizza i seguenti servizi: Facebook Pixel.',
      ],
    },
    {
      kind: 'prose',
      title: 'Diritti degli Interessati',
      paragraphs: [
        'Gli interessati hanno diritto di esercitare le facoltà previste agli artt. 7, 15-22 del Regolamento.',
        'In particolare, gli Utenti hanno il diritto di ottenere: l\'accesso, l\'aggiornamento, la rettificazione ovvero, quando vi hanno interesse, l\'integrazione dei dati; la cancellazione, la trasformazione in forma anonima o il blocco dei dati trattati in violazione di legge, compresi quelli di cui non è necessaria la conservazione in relazione agli scopi per i quali i dati sono stati raccolti o successivamente trattati; l\'attestazione che le operazioni di cui sopra sono state portate a conoscenza di coloro ai quali i dati sono stati comunicati o diffusi, eccettuato il caso in cui tale adempimento si rivela impossibile o comporta un impiego di mezzi manifestamente sproporzionato rispetto al diritto tutelato.',
        'Inoltre, gli Utenti hanno il diritto di revocare il consenso in qualsiasi momento, qualora il trattamento si basi sul loro consenso, di richiedere la portabilità dei dati, di richiedere la limitazione del trattamento dei dati personali e/o la cancellazione ("diritto all\'oblio"), nonché di opporsi al trattamento dei dati personali che li riguardano e al trattamento per fini di invio di materiale pubblicitario, di vendita diretta e per il compimento di ricerche di mercato.',
        'Ai sensi della Normativa Applicabile, i Titolari informano che gli Utenti hanno il diritto di ottenere l\'indicazione (I) dell\'origine dei dati personali; (II) delle finalità e modalità del trattamento; (III) della logica applicata in caso di trattamento effettuato con l\'ausilio di strumenti elettronici; (IV) degli estremi identificativi dei Titolari e dei responsabili; (V) dei soggetti o delle categorie di soggetti ai quali i dati personali possono essere comunicati o che possono venirne a conoscenza in qualità di responsabili o incaricati.',
        'Gli interessati potranno esercitare i loro diritti inviando al Titolare un\'apposita comunicazione oppure utilizzando il modulo di esercizio dei diritti degli interessati, da inviare, debitamente compilato e munito di sottoscrizione e allegati, al Titolare via mail a: legal@ideadiluce.com',
        'Gli interessati, qualora ritenessero che il trattamento che li riguarda violi il Regolamento, hanno altresì diritto a proporre reclamo al Garante della Privacy (Garante per la protezione dei dati personali, Piazza Venezia n. 11 – 00187 – Roma, http://www.garanteprivacy.it/).',
      ],
    },
    {
      kind: 'prose',
      title: 'Modifiche a questa Privacy Policy',
      paragraphs: [
        'Il Titolare del Trattamento si riserva il diritto di apportare modifiche alla presente Privacy Policy in qualunque momento dandone pubblicità agli Utenti su questa pagina. Si prega dunque di consultare spesso questa pagina, prendendo come riferimento la data di ultima modifica indicata in fondo.',
        'Nel caso di mancata accettazione delle modifiche apportate alla presente Privacy Policy, l\'Utente è tenuto a cessare l\'utilizzo di questo Sito web e può richiedere al Titolare del Trattamento di rimuovere i propri Dati Personali. Salvo quanto diversamente specificato, la precedente Privacy Policy continuerà ad applicarsi ai Dati Personali sino a quel momento raccolti.',
        'Il Titolare non è responsabile per l\'aggiornamento di tutti i link visualizzabili nella presente Privacy Policy, pertanto ogni qualvolta un link non sia funzionante e/o aggiornato, gli Utenti riconoscono ed accettano che dovranno sempre far riferimento al documento e/o sezione dei siti internet richiamati da tale link.',
        'Privacy Policy aggiornata a marzo 2024.',
      ],
    },
    {
      kind: 'contact',
      company: 'TLB ITALY S.r.l.',
      vat: 'P.IVA IT17245551001',
      rea: 'REA RM-1705840',
      address: 'Via Appia Pignatelli 450, 00178 Roma (RM), Italy',
      phone: '+39 06 716 7111',
      phoneHref: 'tel:+39067167111',
      email: 'info@tlbitaly.com',
    },
  ],
}
