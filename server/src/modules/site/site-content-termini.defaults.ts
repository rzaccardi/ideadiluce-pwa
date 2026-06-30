import type { ContentPageContent } from './site.types.js'

/** Versione contenuto termini — incrementare per forzare migrazione da versioni precedenti. */
export const TERMINI_CONTENT_VERSION = 2

/** Termini d'Uso e CGV — versione italiana (fonte per BO e traduzioni). */
export const DEFAULT_TERMINI_IT: ContentPageContent = {
  layout: 'legal',
  title: "Termini d'Uso e Condizioni di Vendita",
  subtitle: 'Condizioni di utilizzo del sito e di vendita online di TLB ITALY S.r.l.',
  intro:
    'Il sito Internet www.ideadiluce.com ("Sito") è di proprietà di TLB ITALY S.r.l. ("Titolare" o "Venditore"), con sede legale in Via Appia Pignatelli 450 – 00178 Roma (RM) Italy – P.IVA IT17245551001 – R.E.A.: RM-1705840 – Capitale sociale: € 10.000,00 i.v.',
  seo: { noindex: false, terminiVersion: TERMINI_CONTENT_VERSION },
  blocks: [
    {
      kind: 'prose',
      title: 'Contatti',
      paragraphs: [
        'Per qualsiasi informazione, richiesta di assistenza, domanda o segnalazione, si prega di contattare il nostro Servizio Clienti:',
        'via mail: info@ideadiluce.com',
        'telefonicamente: +39 06 716 7111',
      ],
    },
    {
      kind: 'prose',
      title: "Termini d'Uso",
      paragraphs: [
        'Le seguenti condizioni regolano l\'accesso e l\'utilizzo del Sito da parte degli utenti.',
      ],
    },
    {
      kind: 'prose',
      title: '1. CONDIZIONI DI UTILIZZO DEL SITO WEB',
      paragraphs: [
        'Utilizzando il nostro Sito web e/o effettuando ordini tramite esso, il Cliente conferma di aderire alle seguenti linee guida e di:',
        'impiegare il Sito web unicamente per fini leciti;',
        'astenersi dal fare ordini ingannevoli o fraudolenti. Qualora emergessero indizi validi di un possibile ordine fraudolento, ci riserviamo il diritto di annullare detto ordine e segnalare la situazione alle autorità pertinenti;',
        'impegnarsi a fornire dati di contatto quali indirizzo email e indirizzo postale, assicurandosi che siano esatti e veritieri, consentendo così l\'uso di tali informazioni per l\'elaborazione dell\'ordine come descritto nella nostra informativa sulla Privacy. La mancata fornitura di informazioni accurate e complete può precludere la realizzazione del tuo ordine.',
        'Confermando un ordine su questo Sito, dichiari di essere maggiorenne e di avere la capacità legale per stipulare contratti.',
        'Decliniamo ogni responsabilità per disguidi o danni causati dall\'uso di Internet, inclusi, ma non limitati a, interruzioni di servizio, intrusioni esterne, virus informatici o qualsiasi altro evento di forza maggiore.',
      ],
    },
    {
      kind: 'prose',
      title: '2. PROPRIETÀ INDUSTRIALE E INTELLETTUALE',
      paragraphs: [
        'Il dominio, il Sito e tutti i suoi contenuti, che includono immagini, testi, video, loghi, ecc., sono di esclusiva proprietà del Titolare o dei legittimi titolari dei diritti intellettuali e diritti d\'autore corrispondenti. Il sito web nella sua interezza, individualmente nei suoi componenti, così come questo documento legale, sono opere d\'ingegno regolamentate dal Codice di Proprietà Industriale e dalla normativa sul Diritto d\'Autore.',
        'È espressamente proibito copiare, scaricare, alterare o usare il marchio, i video, i loghi e qualsiasi altro elemento identificativo presente su questo sito per qualsiasi scopo e su qualsiasi mezzo senza l\'esplicita autorizzazione scritta del proprietario del sito o dei detentori dei diritti.',
      ],
    },
    {
      kind: 'prose',
      title: 'Condizioni Generali di Vendita',
      paragraphs: [
        'Le presenti Condizioni Generali di Vendita (di seguito "CGdV") disciplinano il rapporto contrattuale tra il Titolare e il Cliente, avente ad oggetto l\'acquisto dei prodotti di illuminazione commercializzati dal Titolare attraverso il Sito e sono messe a disposizione degli utenti in modo che sia consentita loro la memorizzazione e la riproduzione.',
        'Le premesse e i Termini d\'Uso del nostro Sito web sono parti integranti delle presenti CGdV.',
        'Vi preghiamo di prenderne attentamente visione e di stamparle e/o salvarle su altro supporto duraturo accessibile. Vi preghiamo altresì di consultare attentamente l\'informativa Privacy e l\'Informativa Cookie.',
        'Il Titolare si impegna a rendere tali documenti sempre fruibili ed aggiornati. Essi possono essere modificati o aggiornati in ogni momento dal Titolare e l\'utente si impegna a prenderne visione prima di effettuare ogni ordine.',
      ],
    },
    {
      kind: 'prose',
      title: '1. Definizioni',
      paragraphs: [
        '1.1. Per "Contratto" si intende il contratto di compravendita a distanza, ossia il negozio giuridico avente per oggetto i beni mobili materiali commercializzati dal Sito, effettuato a distanza tra il Titolare ed un utente finale, nell\'ambito di un sistema di vendita a distanza organizzato dal Titolare che impiega esclusivamente Internet come tecnologia di comunicazione a distanza. Il Contratto è regolato dalle presenti CGdV. Il contratto a distanza è disciplinato dal Capo I, Titolo III (artt. 45 e ss.) del Decreto Legislativo 6 settembre 2005, n. 206 ("Codice del Consumo"), quando coinvolge un consumatore, e dal Decreto Legislativo 9 aprile 2003, n. 70, contenente la disciplina del commercio elettronico.',
        '1.2. Con "Cliente" si intende il consumatore quale persona fisica, che abbia compiuto 18 anni, e che esegue un ordine per scopi estranei all\'attività imprenditoriale, commerciale, artigianale o professionale dallo stesso eventualmente svolta, oppure il professionista, inteso come la persona fisica o giuridica che agisce nell\'esercizio della propria attività imprenditoriale, commerciale, artigianale o professionale, ovvero un suo intermediario.',
        '1.3. Con "Ordine" si intende la proposta di acquisto che l\'utente invia al Titolare del Sito, completando la procedura d\'ordine descritta.',
        '1.4. Con "Prodotti" si intendono i beni mobili materiali oggetto di compravendita su questo Sito.',
      ],
    },
    {
      kind: 'prose',
      title: '2. Disponibilità del servizio',
      paragraphs: [
        '2.1. Il Titolare si riserva, in ogni caso, il diritto di non accettare ordini, da chiunque provenienti, che risultino anomali in relazione alla quantità o alla frequenza di acquisti effettuati sul sito.',
        'Il Titolare si riserva, altresì, il diritto di non accettare ordini provenienti da utenti con i quali è in corso un contenzioso legale; utenti coinvolti in frodi relative a pagamenti con carta di credito; utenti che abbiano rilasciato dati identificativi che poi si rivelino essere falsi, incompleti o inesatti.',
      ],
    },
    {
      kind: 'prose',
      title: '3. AMBITO DI APPLICAZIONE',
      paragraphs: [
        '3.1. Le presenti CGdV si applicano a tutte le vendite effettuate dal Venditore sul Sito. Le CGdV applicabili sono quelle in vigore alla data di invio dell\'ordine di acquisto.',
        '3.2. Le presenti CGdV non regolano la vendita di prodotti o la fornitura di servizi effettuate da terzi che utilizzano collegamenti diretti al Sito attraverso banner o tramite altri collegamenti ipertestuali/links. Sui siti web consultabili tramite tali collegamenti, il Titolare non effettua alcun tipo di controllo/monitoraggio. Pertanto, in nessun caso il Titolare potrà essere ritenuto responsabile per i beni o servizi promessi da terzi o per l\'esecuzione di transazioni fra i clienti del Sito e terze parti.',
        '3.3. Le presenti CGdV possono essere modificate in ogni momento. Eventuali modifiche e/o nuove condizioni saranno in vigore dal momento della loro pubblicazione nella sezione "Condizioni Generali di Vendita" del Sito. Per questo motivo, gli utenti sono invitati a consultare, prima di effettuare qualsiasi ordine, la versione più aggiornata delle CGdV.',
        'Le CGdV applicate sono quelle in vigore alla data di invio dell\'ordine di acquisto. L\'utente è tenuto a leggere attentamente la versione più aggiornata delle presenti CGdV di cui gli è consentita la memorizzazione, la riproduzione e la stampa su supporto durevole, nonché tutte le altre informazioni fornite, prima e durante la procedura di acquisto.',
      ],
    },
    {
      kind: 'prose',
      title: '4. COME INVIARE IL TUO ORDINE E CONCLUDERE UN CONTRATTO CON NOI',
      paragraphs: [
        '4.1. Per inviare il tuo ordine e concludere un contratto con noi, ti invitiamo a seguire i seguenti passaggi:',
        'Compilazione e Invio dell\'ordine: accedi alla pagina Prodotto, scegli il Prodotto che vuoi acquistare e aggiungilo al carrello; segui le istruzioni sul sito per inviare l\'ordine.',
        'Verifica e Riepilogo del Tuo Ordine: prima di inviare l\'ordine, controlla e correggi eventuali errori (puoi modificare o annullare il tuo ordine prima del suo invio); rivedi i nostri Termini e Condizioni e ti consigliamo di stampare una copia.',
        'Conferma del Contratto: il tuo ordine si riterrà concluso una volta che è stato ricevuto dal nostro server; verificheremo i dettagli del tuo ordine per assicurarci che tutto sia corretto; ti invieremo una email di conferma dell\'ordine (la "Conferma dell\'ordine") contenente i dettagli dell\'ordine; verifica la correttezza del contenuto e informaci di eventuali errori.',
        'Annullamento dell\'ordine: puoi annullare l\'ordine finché non è stato preparato in magazzino; ci riserviamo di annullare l\'ordine nei casi previsti nel paragrafo 4.3 e nel caso in cui il pagamento non sia stato completato.',
        '4.2. Inviando un ordine dichiari di aver letto e accettato integralmente le nostre CGdV e riconosci che questo implica l\'obbligo di pagare il prezzo indicato, oltre a eventuali altri costi (es. spese di spedizione). Una volta che l\'ordine è stato inviato, comprendi che diventa definitivo e non lo puoi annullare.',
        '4.3. Ci riserviamo il diritto di non procedere con l\'ordine e di rifiutarlo, nel caso in cui ci siano errori nelle informazioni da te fornite (per esempio numero della carta, data di scadenza, indirizzo di fatturazione o di spedizione insufficiente o errato; informazioni ingannevoli) o nella scheda prodotto (per esempio errore relativo al prezzo, alla descrizione, alla disponibilità del prodotto).',
        '4.4. Nel caso in cui non effettui il pagamento totale del prezzo dei prodotti, delle spese di spedizione (se previste) e di qualsiasi altro costo aggiuntivo indicato nell\'ordine oppure il pagamento non è confermato, il contratto di acquisto verrà automaticamente risolto, salvo il diritto al risarcimento dei danni, e di questo ti informeremo.',
        '4.5. Ti informiamo che ogni ordine inviato viene conservato in forma digitale o cartacea presso la propria sede, secondo criteri di riservatezza e sicurezza. Puoi richiederne una copia in qualunque momento.',
      ],
    },
    {
      kind: 'prose',
      title: '5. PRODOTTI E DISPONIBILITÀ DEGLI STESSI',
      paragraphs: [
        '5.1. I Prodotti qui in vendita sono descritti nelle relative schede Prodotto. Considera che ci possono essere leggere differenze tra le foto dei Prodotti e come questi sono nella realtà. Questo a causa anche degli schermi e della loro risoluzione. Tuttavia, ci impegniamo a presentare i prodotti nel modo più fedele possibile.',
        '5.2. Quando visiti le Schede Prodotto, la disponibilità indicata si riferisce al momento in cui stai consultando il Sito. Considera che il nostro Sito può essere visitato da più persone allo stesso tempo. Questo significa che, occasionalmente, più clienti potrebbero ordinare lo stesso prodotto contemporaneamente. Quindi, il nostro sistema potrebbe indicare come disponibile un prodotto la cui produzione non è più disponibile. Di questo ti informeremo appena possibile.',
        '5.3. Se un prodotto che hai ordinato non è disponibile, temporaneamente o definitivamente, vogliamo chiarire che non siamo responsabili di questa indisponibilità. Se il prodotto che hai acquistato non è disponibile, ti informeremo via email e avrai diritto al rimborso dell\'intero importo, se avrai già effettuato il pagamento. In alternativa: se possibile, potrai scegliere di attendere il riassortimento del prodotto (ti indicheremo il nuovo termine di consegna previsto); se preferisci, potrai accettare la consegna dei prodotti disponibili e ricevere il rimborso di quelli non disponibili; oppure, potrai accettare un buono sconto da usare per futuri acquisti sul nostro sito.',
      ],
    },
    {
      kind: 'prose',
      title: '6. PAGAMENTI',
      paragraphs: [
        '6.1. Inviando l\'ordine, ti impegni ad effettuare il pagamento con uno dei metodi di seguito descritti.',
        '6.2. Accettiamo carte di credito e debito Visa, MasterCard, Maestro, Postepay e American Express. L\'addebito verrà effettuato al momento della trasmissione dell\'ordine. I dati della carta di credito sono criptati e trasmessi direttamente al gestore dei pagamenti senza transitare dai nostri server.',
        '6.3. Accettiamo pagamenti tramite Digital Wallet come PayPal, Apple Pay, Shop Pay, Google Pay. Se scegli di utilizzare questi strumenti, verrai reindirizzato al relativo sito per completare il pagamento seguendo la relativa procedura.',
        '6.4. Accettiamo pagamenti tramite bonifico bancario alle seguenti condizioni: il bonifico dovrà pervenire entro 5 giorni lavorativi dall\'effettuazione dell\'ordine (oltre tale data l\'ordine sarà considerato nullo); la causale dovrà indicare il numero e la data dell\'ordine, la ragione sociale o il nominativo dell\'acquirente; le coordinate sono visibili sul sito durante la procedura d\'ordine e nell\'email di conferma ordine. La merce verrà spedita solamente dopo aver verificato l\'avvenuto accredito presso il nostro c/c bancario (l\'importo bonificato viene accreditato non prima di 1/3 giorni lavorativi dalla data di effettuazione).',
        '6.5. In caso di rimborso utilizzeremo lo stesso strumento di pagamento utilizzato nell\'acquisto, salvo diverso accordo. Se hai utilizzato PayPal o altri Digital Wallets, non possiamo essere considerati responsabili per eventuali ritardi nell\'accredito del rimborso.',
        '6.6. Utilizziamo protocolli di sicurezza avanzati per proteggere tutti i pagamenti. Per acquisti superiori a 30 euro, il sistema di pagamento potrebbe richiedere una verifica aggiuntiva per assicurare la tua identità, come previsto dalla PSD2, attraverso dispositivi mobili o altri strumenti di autenticazione.',
      ],
    },
    {
      kind: 'prose',
      title: '7. PREZZI',
      paragraphs: [
        '7.1. Tutti i prezzi mostrati sul Sito sono espressi in Euro e includono l\'IVA (Imposta Valore Aggiunto), se applicabile, insieme a tutte le altre imposte. Il prezzo applicato al tuo acquisto è quello indicato al momento in cui effettui l\'ordine e confermato nella email di Conferma dell\'ordine. Ciò significa che eventuali variazioni di prezzo, in aumento o diminuzione, che avvengono dopo il tuo ordine, non ti riguardano.',
        '7.2. In caso di sconti, indicheremo anche il prezzo più basso applicato negli ultimi 30 giorni, se applicabile.',
      ],
    },
    {
      kind: 'prose',
      title: '8. TEMPI E SPESE DI SPEDIZIONE',
      paragraphs: [
        '8.1. Le spese di spedizione sono a tuo carico e vengono calcolate al termine del processo di acquisto, dopo aver selezionato la modalità di spedizione e prima del pagamento. Le spese possono variare in base al peso, al volume e alla zona di consegna.',
        '8.2. Spediremo i Prodotti solo dopo aver ricevuto il pagamento di tutto quanto dovuto. La spedizione sarà affidata a un vettore professionale.',
        '8.3. Il Cliente sarà informato mediante una email di conferma che l\'ordine è in fase di spedizione.',
        '8.4. I tempi di consegna sono quelli indicati sul Sito e, in ogni caso, la consegna degli articoli disponibili avverrà non oltre 10 giorni dalla conclusione del contratto, esclusi sabati e giorni festivi. Per i prodotti disponibili su ordinazione, ci saranno tempistiche che variano a seconda del fornitore e ti saranno comunicate appena possibile. Se non sei presente al momento della consegna, il vettore tenterà una nuova consegna il giorno successivo oppure proverà a contattarti per organizzare una nuova consegna.',
        '8.5. Se non riusciamo a consegnare l\'ordine, questo andrà in giacenza e il vettore ti lascerà un avviso. Se anche in questo caso non riusciremo ad effettuare la consegna entro il termine di giacenza indicato nell\'avviso, il contratto si intenderà risolto. I costi di restituzione dell\'ordine derivanti dalla risoluzione del contratto rimarranno a tuo carico.',
        '8.6. In caso di ritardo nella consegna, puoi richiedere la consegna entro un termine supplementare. Se anche questo termine scade senza consegna, puoi risolvere il contratto.',
        '8.7. Saranno considerati adempiuti i nostri obblighi di consegna e il rischio di perdita e danneggiamento dei prodotti, per causa a noi non imputabile, è trasferito a te nel momento in cui tu o un terzo da te designato (es. portiere) riceverete fisicamente i prodotti.',
        '8.8. Al momento del ricevimento della merce, ricordati di verificare che i prodotti e i relativi imballaggi siano in buone condizioni. In particolare, controlla che il numero dei prodotti ricevuti sia corretto e che l\'imballo risulti integro e non alterato, anche nei materiali di chiusura.',
        '8.9. Se noti alcune anomalie sul pacco o nel modo con cui il vettore te lo consegna, ricordati di segnalarlo al vettore accettando il pacco con riserva specifica e indicando il motivo della riserva (per esempio: sospetta manomissione, trattamento improprio, pacco visivamente danneggiato). Ogni segnalazione di danni o anomalie occulti dovrà avvenire entro 7 giorni solari dalla consegna mediante invio di email a info@ideadiluce.com.',
      ],
    },
    {
      kind: 'prose',
      title: '9. POLICY DI RESO E DIRITTO DI RECESSO — CLIENTI B2C',
      paragraphs: [
        '9.1. Hai la possibilità di avvalerti del diritto di recesso entro un termine di 14 (quattordici) giorni dal ricevimento del Prodotto, per annullare l\'acquisto di tutto o parte dell\'ordine e per restituire la merce. Questo diritto di recesso non si applica a Prodotti confezionati su misura, realizzati o personalizzati secondo le tue specifiche, a ordini speciali, o a Prodotti che, per loro natura, non possono essere rispediti.',
        '9.2. Qualora il termine finale per esercitare il diritto di recesso cada di sabato, domenica o festivo, tale termine sarà esteso al successivo giorno lavorativo.',
        '9.3. Per procedere alla restituzione del Prodotto, dovrai contattarci via mail all\'indirizzo info@ideadiluce.com indicando gli articoli che vuoi restituire. Ti invitiamo, inoltre, a motivare il recesso, per contribuire al miglioramento della qualità dei Prodotti e servizi offerti.',
        '9.4. Una volta inviata, la mail sarà immediatamente gestita dal servizio clienti, che ti contatterà per organizzare il reso del Prodotto e fornire le istruzioni specifiche, che variano a seconda della merce da restituire. Il Prodotto dovrà essere restituito nel suo stato originale, completo di imballaggio, manuali e accessori, entro 7 giorni dal contatto con il servizio clienti.',
        '9.5. L\'importo pagato per l\'acquisto del Prodotto e le spese di spedizione iniziali saranno rimborsati entro 14 giorni dal ricevimento della merce.',
        '9.6. Le spese ed i costi di spedizione per il rientro del prodotto sono a tuo carico. Se richiesto, possiamo fornirti un\'etichetta di reso il cui costo ti verrà comunicato dal servizio clienti e verrà detratto dal rimborso. Sarà tua cura imballare al meglio il prodotto per assicurare che arrivi integro a destinazione.',
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
      email: 'info@ideadiluce.com',
    },
  ],
}
