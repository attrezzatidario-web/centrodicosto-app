/* Console › Mappa del gestionale — tutto il Centro di Costo in un'unica mappa interattiva.
   window.CDC_MAP.mount(el, ctx): ctx = { D (dati della Console), team(k) → ultimo report, go(hash) }.
   Ogni voce: [chiave, titolo, descrizione, [cosa fa], [collegamenti]] — le chiavi sono «gruppo.voce». */
(() => {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- icone dei gruppi ---------------- */
  const GI = {
    sez: '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
    app: '<rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M10.5 18.5h3"/>',
    dati: '<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    reg: '<path d="M4 4h16v16H4z"/><path d="M4 9h16M9 9v11"/>',
    srv: '<rect x="3" y="3.5" width="18" height="7" rx="2"/><rect x="3" y="13.5" width="18" height="7" rx="2"/><path d="M7 7h.01M7 17h.01M11 7h6M11 17h6"/>',
    sic: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z"/><path d="m8.8 12 2.2 2.2 4.4-4.4"/>',
    int: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    mot: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    for: '<path d="M3 9 5 4h14l2 5"/><path d="M4 9v11h16V9"/><path d="M3 9h18M9 20v-6h6v6"/>',
    set: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    team: '<circle cx="12" cy="7.5" r="3"/><circle cx="5" cy="10" r="2.2"/><circle cx="19" cy="10" r="2.2"/><path d="M6.5 20a5.5 5.5 0 0 1 11 0M1.5 19a3.6 3.6 0 0 1 5-3.3M22.5 19a3.6 3.6 0 0 0-5-3.3"/>',
    cli: '<path d="M3 21V8l9-5 9 5v13"/><path d="M9 21v-6h6v6"/>',
    hub: '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/>'
  };
  const P = {
    pin: '<path d="M12 21s-7-5.6-7-11.2A7 7 0 0 1 19 9.8C19 15.4 12 21 12 21z"/><circle cx="12" cy="10" r="2.6"/>', box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    doc: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>', cash: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/>', docok: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 14l2 2 4-4"/>',
    userp: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 11h6M19 8v6"/>', house: '<path d="M3 21V9l9-6 9 6v12"/><path d="M9 21v-6h6v6"/>', ware: '<path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 17h10"/>',
    receipt: '<path d="M7 3h10a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1z"/><path d="M9 8h6M9 12h6M9 16h3"/>', truck: '<path d="M2 7h11v9H2zM13 10h4l3 3v3h-7z"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/>',
    fuel: '<path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M3 21h13M7 7h5v4H7zM15 9h2a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V8l-3-3"/>', clip: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>',
    bag: '<path d="M6 7h12l-1 13H7z"/><path d="M9 7a3 3 0 0 1 6 0"/>', lines: '<path d="M4 7h16M4 12h16M4 17h10"/><circle cx="18.5" cy="17" r="2"/>', chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a5 5 0 0 1 5.5 5"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    grid: GI.sez, term: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M12 15h5"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>', key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>', phone: GI.app,
    db: GI.dati, folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', cloud: '<path d="M7 18a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 8.5a4 4 0 0 1-1 9.5z"/><path d="M12 11v6M9.5 13.5 12 11l2.5 2.5"/>',
    shield: GI.sic, lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', dev: '<rect x="2" y="5" width="13" height="10" rx="1.5"/><path d="M5 19h7M8.5 15v4"/><rect x="17" y="8" width="5" height="11" rx="1.5"/>',
    toggle: '<rect x="2" y="6" width="20" height="12" rx="6"/><circle cx="16" cy="12" r="3"/>', table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/>', mail: '<path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/>',
    globe: GI.set, barcode: '<path d="M4 5v14M7 5v14M10 5v14M14 5v14M16 5v14M20 5v14"/>', cube: '<path d="M12 3 3 7.5v9L12 21l9-4.5v-9z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>', sync: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5"/>',
    wifi: '<path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1"/>', text: '<path d="M4 6h16M4 12h10M4 18h13"/>', search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', bolt: GI.mot, link: GI.int
  };
  const II = { sez: { home: 'grid', piazzali: 'pin', attrezzatura: 'box', fatture: 'doc', incassi: 'cash', vendite: 'docok', clienti: 'userp', fornitori: 'house', magazzino: 'ware', interni: 'docok', preventivi: 'receipt', gls: 'truck', gasolio: 'fuel', lyreco: 'clip', amazon: 'bag', torental: 'lines', analisi: 'chart', dipendenti: 'users', impostazioni: 'gear' },
    app: { gestionale: 'grid', console: 'term', presenze: 'clock', solo: 'receipt', demo: 'play', tour: 'spark', accesso: 'key', pwa: 'phone' },
    srv: { accesso: 'key', dati: 'db', file: 'folder', ia: 'spark', backup: 'cloud', presenze: 'clock', admin: 'shield' },
    sic: { login: 'key', tentativi: 'lock', sessioni: 'dev', ruoli: 'users', permessi: 'toggle', csp: 'shield', chiavi: 'lock' },
    int: { sheets: 'table', drive: 'folder', email: 'mail', gemini: 'spark', openai: 'spark', pages: 'globe', sdi: 'docok', xlsx: 'table', pdf: 'doc', scan: 'barcode', three: 'cube', pdfjs: 'doc' },
    mot: { sync: 'sync', offline: 'wifi', ia: 'spark', lessico: 'text', ricerca: 'search', motion: 'bolt', collegamenti: 'link' },
    dati: {}, reg: { Utenti: 'users', Gestionali: 'house', Pagamenti: 'cash', Registro: 'clock', Sessioni: 'dev' }, team: { guardiano: 'shield', informatico: 'term', commerciale: 'mail', marketing: 'spark', grafico: 'bolt' } };
  const iconOf = (gk, ik) => P[(II[gk] || {})[ik]] || (gk === 'dati' ? P.table : GI[gk]);
  const svg = (k, c = '') => `<svg viewBox="0 0 24 24" class="${c}" aria-hidden="true">${GI[k] || k}</svg>`;

  /* ---------------- il catalogo: ogni singola cosa del gestionale ---------------- */
  const G = [
    { k: 'sez', t: 'Sezioni del gestionale', s: 'Tutto quello che vede chi usa il gestionale', c: '#5b7cff', L: [
      ['home', 'Dashboard', 'Il quadro generale dell\'azienda: quanto entra, quanto esce e quanto resta.', ['Ricavi, costi e utile del mese con confronto col mese prima', 'Grafico 12 mesi con linea dell\'utile', 'Spesa per area, per sede, per categoria e per fornitore', 'Cose da verificare e ultimi movimenti di tutte le aree', 'Fatture da pagare, scadenze, preventivi', 'Apertura immediata con l\'ultima Dashboard salvata sul dispositivo'], ['sez.incassi', 'sez.vendite', 'sez.attrezzatura', 'sez.fatture', 'mot.ia', 'dati.Movimenti', 'dati.Incassi']],
      ['piazzali', 'Sedi / Piazzali', 'Tutte le spese divise per sede (piazzale, locale, cantiere… secondo l\'attività).', ['Classifica e mappa delle sedi', 'Tabella sedi × aree di spesa', 'Scheda della sede mese per mese', 'Collega i nomi diversi alla stessa sede (cdcLink)', 'Proposte automatiche per città e coordinate'], ['sez.gls', 'sez.gasolio', 'sez.lyreco', 'sez.amazon', 'sez.attrezzatura', 'dati.Config']],
      ['attrezzatura', 'Acquisti / Attrezzatura', 'Ogni riga di acquisto: cosa, quanto, da chi, per quale sede.', ['Panoramica, acquisti e prodotti', 'Categoria riconosciuta in automatico dalle parole', 'Import ed export Excel', 'Budget annuale per sede', 'Prezzi variati e righe da controllare'], ['dati.Movimenti', 'sez.fornitori', 'sez.piazzali', 'mot.lessico']],
      ['fatture', 'Fatture fornitori', 'Le fatture ricevute, lette dall\'IA e confrontate con gli acquisti.', ['Lettura del PDF con l\'IA', 'Scadenze e stato pagata / da pagare', 'Confronto con gli acquisti registrati', 'Documento allegato nell\'archivio Drive'], ['dati.Fatture', 'int.gemini', 'int.drive', 'sez.fornitori']],
      ['incassi', 'Incassi e ricavi', 'Chiusure di cassa e incassi giornalieri per sede.', ['Contanti, carte/POS e altro', 'Netto IVA con aliquota dell\'attività', 'Grafico giorno per giorno o mese per mese', 'Per sede, import ed export Excel'], ['dati.Incassi', 'sez.home']],
      ['vendite', 'DDT e fatture ai clienti', 'Documenti di vendita durante il mese e fatture di fine mese.', ['DDT con scarico automatico dal magazzino', 'Fatture di fine mese per cliente (TD24)', 'PDF con foto e schede tecniche', 'File XML FatturaPA per lo SdI', 'Righe da magazzino, servizi, cataloghi o libere'], ['dati.DDT', 'dati.Vendite', 'sez.clienti', 'sez.magazzino', 'int.sdi', 'sez.preventivi']],
      ['clienti', 'Clienti', 'Anagrafica dei clienti con fatturato e documenti collegati.', ['Dati fiscali, SdI, PEC, pagamento', 'Preventivi, DDT e fatture collegati', 'Ricarico personale per cliente', 'Fatturato e da incassare'], ['dati.Clienti', 'sez.preventivi', 'sez.vendite']],
      ['fornitori', 'Fornitori', 'Anagrafica dei fornitori con spesa, fatture e archivio documenti.', ['Spesa dell\'anno e da pagare', 'Archivio fatture, DDT, ordini, listini', '«Aggiungi quelli già usati»', 'Apri il catalogo, scrivi un ordine, chiama'], ['dati.Fornitori', 'dati.DocForn', 'sez.fatture', 'sez.preventivi', 'for.payper']],
      ['magazzino', 'Magazzino', 'Articoli, giacenze, carichi e scarichi.', ['Codice interno automatico ART-0001 e codice fornitore', 'Lettore codici a barre con la fotocamera', 'Avviso sotto scorta', 'Inventario, import ed export Excel'], ['dati.Articoli', 'dati.MagMov', 'int.scan', 'sez.vendite']],
      ['interni', 'Documenti interni', 'Scarichi non fiscali e trasferimenti di merce, con numerazione propria.', ['Scarico interno con motivo e centro di costo (INT-001)', 'Trasferimento tra magazzini: in viaggio, poi ricevuto', 'Trasferimento ad altra azienda con causale e avviso sul DDT fiscale', 'PDF non fiscale, annullo e duplicazione'], ['dati.MagMov', 'sez.magazzino', 'sez.home']],
      ['preventivi', 'Preventivi', 'Preventivi con i cataloghi di tutti i fornitori, a clienti o fornitori.', ['Ricerca in tutti i fornitori e confronto', 'Logo del cliente sui capi, fronte/retro, solo stampa', 'Prezzi d\'acquisto, ricarico, sconti rivenditore', 'PDF, scheda di lavoro, scheda tecnica', 'Conversione in DDT o fattura'], ['for.payper', 'sez.clienti', 'sez.fornitori', 'sez.vendite', 'mot.ia', 'app.solo']],
      ['gls', 'Spedizioni GLS', 'Analisi delle fatture GLS spedizione per spedizione.', ['Mappa 2D e 3D delle destinazioni', 'Costo per spedizione, peso e città', 'Fatture GLS emesse con spunte', 'PDF dei mesi nel Drive'], ['dati.GLS', 'int.three', 'int.drive', 'sez.piazzali']],
      ['gasolio', 'Carburante e mezzi', 'Rifornimenti, chilometri, consumi e noleggi.', ['Mezzi con soprannome', 'Litri, km e costo per mezzo', 'Noleggi mensili', 'Operatore collegato ai dipendenti'], ['dati.Gasolio', 'sez.dipendenti', 'sez.piazzali']],
      ['lyreco', 'Lyreco', 'Fatture Lyreco riga per riga, ripartite per sede.', ['Controlli: da attribuire, quadratura, prezzi variati', 'Mappa e classifica delle sedi', 'Report PDF per sede e periodo'], ['dati.Lyreco', 'dati.LyrecoFatture', 'sez.piazzali']],
      ['amazon', 'Amazon Business', 'Ordini e articoli Amazon con controlli sull\'IVA.', ['Import diretto dal report di Amazon Business', 'IVA stimata o da fattura', 'Ordini annullati esclusi', 'Categorie automatiche o con l\'IA'], ['dati.Amazon', 'dati.AmazonArticoli', 'sez.piazzali']],
      ['torental', 'Torental', 'Listino kit adesivi, ordini e clienti Torental (solo gestionale principale).', ['Listino modificabile con materiali e servizi', 'Ordini con PDF', 'Clienti salvati da soli'], ['dati.Config']],
      ['analisi', 'Analisi', 'Cerca, filtra, raggruppa ed esporta tutti i dati del gestionale.', ['Fonti: acquisti, fatture, preventivi, DDT, vendite, incassi, GLS, carburante, magazzino, clienti, fornitori, dipendenti, presenze, ferie', 'Filtri per periodo, testo e colonne', 'Raggruppa e somma', 'Excel e PDF'], ['sez.home', 'int.xlsx', 'int.pdf', 'sez.dipendenti']],
      ['dipendenti', 'Dipendenti e presenze', 'Personale, timbrature, ferie e accessi con permessi per sezione.', ['Anagrafica, contratto, costo orario, scadenze', 'Presenze del giorno e foglio del mese (Excel e PDF)', 'Approva ferie e permessi con avviso via email', 'Accesso con permessi No / Vede / Modifica', 'Elimina con o senza storico'], ['dati.Dipendenti', 'dati.Presenze', 'dati.Assenze', 'app.presenze', 'sic.permessi']],
      ['impostazioni', 'Impostazioni', 'Dati dell\'azienda, documenti, servizi, backup, IA, account.', ['Attività e sezioni (decise dalla Console)', 'Dati fiscali per le fatture', 'Servizi preimpostati', 'Backup, centri di costo, budget', 'Chiavi IA, password, dispositivi'], ['dati.Config', 'int.drive', 'mot.ia']]
    ] },
    { k: 'app', t: 'App e accessi', s: 'Le porte d\'ingresso al Centro di Costo', c: '#8b5cf6', L: [
      ['gestionale', 'Gestionale web', 'L\'app principale per le aziende, su PC e telefono.', ['Funziona anche offline (service worker)', 'Copia dei dati sul dispositivo (IndexedDB)', 'Sincronizzazione solo delle novità', 'Barra in basso personalizzabile sul telefono'], ['sez.home', 'srv.dati', 'int.pages', 'mot.offline']],
      ['console', 'Console', 'Questa app: clienti, utenti, abbonamenti, accessi, registro, team e mappa.', ['Nuovo cliente in 4 passi con credenziali', 'Sezioni accese per gestionale e per utente', 'Pagamenti e rinnovi', 'Sessioni attive e tentativi di accesso', 'Apri il gestionale di un cliente'], ['reg.Utenti', 'reg.Gestionali', 'reg.Pagamenti', 'reg.Registro', 'srv.admin', 'team.guardiano']],
      ['presenze', 'App Presenze', 'I dipendenti timbrano e chiedono ferie dal telefono.', ['Stesse credenziali del gestionale', 'Timbratura istantanea con ora del tocco', 'Storico, saldo ferie e permessi', 'Richieste ferie, permessi a ore, malattia', 'Si installa sulla schermata Home'], ['sez.dipendenti', 'srv.presenze', 'dati.Presenze', 'dati.Assenze']],
      ['solo', 'Solo Preventivi', 'Scorciatoia che apre il gestionale direttamente sui Preventivi.', ['Icona separata sul telefono', 'Stesso account del gestionale'], ['sez.preventivi']],
      ['demo', 'Demo', 'Il gestionale di prova, senza account, con dati inventati per ogni attività.', ['Dati generati nel browser, niente salvato', 'Cambia attività dalla barra', 'Anche dipendenti e presenze di prova'], ['set.veicoli', 'app.tour']],
      ['tour', 'Presentazione', '«Scopri cosa può fare»: la vetrina animata per i potenziali clienti.', ['Si adatta all\'attività scelta', 'Funzioni con illustrazioni animate', 'Calcolatore del tempo risparmiato', 'Prezzi e domande frequenti'], ['app.demo', 'app.accesso']],
      ['accesso', 'Pagina di accesso', 'Ingresso con email o nome utente e password.', ['Password dimenticata con codice via email', 'Prima password da cambiare', 'Prova la demo senza account'], ['sic.login', 'srv.accesso']],
      ['pwa', 'App sul telefono', 'Gestionale, Console e Presenze si installano come app.', ['Icone e nomi separati', 'Aggiornamenti automatici a ogni versione'], ['mot.offline', 'int.pages']]
    ] },
    { k: 'dati', t: 'Dati del gestionale', s: 'I fogli del Foglio Google di ogni azienda', c: '#22c3ee', L: [
      ['Movimenti', 'Movimenti', 'Le righe di acquisto.', ['data, documento, codice, descrizione, quantità, prezzo, IVA, sede, categoria, fornitore'], ['sez.attrezzatura']],
      ['Config', 'Config', 'Le impostazioni e i dati «a chiave» del gestionale.', ['Preventivi (pv:…), clienti preventivi, prezzi d\'acquisto, sconti', 'Ordini e listino Torental', 'Azienda, moduli, servizi, impostazioni presenze', 'Collegamenti dei nomi alle sedi, budget'], ['sez.preventivi', 'sez.torental', 'sez.impostazioni']],
      ['GLS', 'GLS', 'Le spedizioni GLS.', ['mese, data, destinatario, città, colli, peso, nolo, carburante, totale'], ['sez.gls']],
      ['Gasolio', 'Gasolio', 'I rifornimenti.', ['data, targa, km, litri, prezzo, operatore, sede'], ['sez.gasolio']],
      ['Fatture', 'Fatture', 'Le fatture dei fornitori.', ['fornitore, numero, data, scadenza, imponibile, IVA, totale, stato, PDF'], ['sez.fatture']],
      ['Lyreco', 'Lyreco', 'Le righe delle fatture Lyreco.', ['fattura, DDT, ordine, articolo, quantità, importo, sede'], ['sez.lyreco']],
      ['LyrecoFatture', 'LyrecoFatture', 'I documenti Lyreco.', ['imponibile, totale, stato, PDF'], ['sez.lyreco']],
      ['Amazon', 'Amazon', 'Gli ordini Amazon.', ['venditore, località, pagamento, imponibile, IVA, totale'], ['sez.amazon']],
      ['AmazonArticoli', 'AmazonArticoli', 'Gli articoli degli ordini Amazon.', ['ordine, quantità, descrizione, prezzo, categoria'], ['sez.amazon']],
      ['Clienti', 'Clienti', 'L\'anagrafica clienti.', ['P.IVA, CF, indirizzo, SdI, PEC, email, telefono, pagamento'], ['sez.clienti']],
      ['Articoli', 'Articoli', 'Gli articoli di magazzino.', ['codice, codice fornitore, codice a barre, costo, prezzo, scorta'], ['sez.magazzino']],
      ['MagMov', 'MagMov', 'Carichi e scarichi di magazzino.', ['articolo, quantità con segno, costo, causale, documento'], ['sez.magazzino', 'sez.vendite']],
      ['DDT', 'DDT', 'I documenti di trasporto emessi.', ['numero, anno, cliente, destinazione, trasporto, colli, righe, fattura'], ['sez.vendite']],
      ['Vendite', 'Vendite', 'Le fatture ai clienti.', ['tipo TD01/TD24, DDT collegati, righe, imponibile, IVA, scadenza, stato'], ['sez.vendite', 'int.sdi']],
      ['Incassi', 'Incassi', 'Le chiusure di cassa.', ['sede, importo, contanti, POS, altro, IVA'], ['sez.incassi']],
      ['Fornitori', 'Fornitori', 'L\'anagrafica fornitori.', ['P.IVA, contatti, referente, categoria, pagamento, IBAN'], ['sez.fornitori']],
      ['DocForn', 'DocForn', 'L\'archivio dei documenti dei fornitori.', ['tipo, fornitore, numero, data, file nel Drive'], ['sez.fornitori', 'int.drive']],
      ['Dipendenti', 'Dipendenti', 'Le schede del personale.', ['contratto, ore, costo orario, ferie, permessi, scadenze, accesso'], ['sez.dipendenti']],
      ['Presenze', 'Presenze', 'Le timbrature.', ['dipendente, data, ora, tipo, fonte app/manuale, posizione'], ['sez.dipendenti', 'app.presenze']],
      ['Assenze', 'Assenze', 'Ferie, permessi e malattie.', ['tipo, dal, al, ore, stato, risposta del titolare'], ['sez.dipendenti', 'app.presenze']],
      ['_Modifiche', '_Modifiche', 'Registro nascosto delle modifiche per la sincronizzazione veloce.', ['ora, foglio, id, azione — fino a 20.000 righe'], ['mot.sync']]
    ] },
    { k: 'reg', t: 'Registro centrale', s: 'I fogli del Foglio principale che tengono insieme tutto', c: '#f472b6', L: [
      ['Utenti', 'Utenti', 'Tutte le persone che possono entrare.', ['ruolo, gestionale, stato, password cifrata', 'sezioni e permessi, primo accesso', 'collegamento al dipendente'], ['sic.ruoli', 'app.console']],
      ['Gestionali', 'Gestionali', 'Le aziende con il loro Foglio Google.', ['codice, tipo, stato, attività, piano', 'scadenza, canone, dati di contatto'], ['app.console', 'set.veicoli']],
      ['Pagamenti', 'Pagamenti', 'Gli abbonamenti incassati.', ['gestionale, data, importo, metodo, periodo', 'Rinnovo di un anno'], ['app.console']],
      ['Registro', 'Registro attività', 'Tutto quello che succede, in ordine di tempo.', ['accessi, clienti, utenti, pagamenti, dipendenti'], ['app.console']],
      ['Sessioni', 'Sessioni', 'I dispositivi collegati.', ['token di 60 giorni', 'chiudibili dalla Console'], ['sic.sessioni', 'app.console']]
    ] },
    { k: 'srv', t: 'Server (Code.gs)', s: 'Lo script Google che risponde a tutte le app', c: '#38bdf8', L: [
      ['accesso', 'Accesso', 'Entrare, uscire e gestire la password.', ['login, logout, logoutAll', 'forgot, resetPw, changePw', 'me, updateMe, ping'], ['sic.login', 'app.accesso']],
      ['dati', 'Dati', 'Lettura e scrittura dei fogli.', ['all — tutto o solo le novità (since)', 'batch — scritture veloci riga per riga', 'replaceAll — sostituisce un foglio'], ['mot.sync', 'sic.permessi']],
      ['file', 'File', 'Documenti nel Drive.', ['uploadPdf, pdf — analisi GLS', 'uploadDoc, getDoc — fatture, loghi, foto', 'imgs — foto prodotti per i PDF'], ['int.drive']],
      ['ia', 'Intelligenza artificiale', 'Una sola porta per tutte le richieste all\'IA.', ['lettura fatture, categorie, prodotti da link', 'posizione del logo, retro dei capi, vista 3D', 'Gemini o ChatGPT con ripiego automatico'], ['int.gemini', 'int.openai', 'mot.ia']],
      ['backup', 'Backup', 'Copie di sicurezza dei dati.', ['backup, backupInfo, backupAuto', 'ogni lunedì in «Centro di Costo - Backup», ultime 12'], ['int.drive']],
      ['presenze', 'Dipendenti e presenze', 'Accessi del personale e timbrature.', ['staffSave, staffResetPw, staffDel, dipDel', 'pzMe, pzTimbra, pzRichiesta, pzAnnulla, pzDecidi'], ['sez.dipendenti', 'app.presenze']],
      ['admin', 'Amministrazione', 'Le azioni della Console.', ['adminData, adminNewClient, adminUserAdd, adminUser', 'adminWsAdd, adminWsSet, adminWsDel, adminWsInfo', 'adminPay, adminPayDel, adminOpen, adminSwitch', 'adminResetPw, adminLogoutUser, adminDropSession, adminDelUser', 'setSettore, setKey'], ['app.console', 'reg.Gestionali']]
    ] },
    { k: 'sic', t: 'Sicurezza e permessi', s: 'Chi entra e cosa può vedere', c: '#34d399', L: [
      ['login', 'Credenziali personali', 'Ognuno entra con email o nome utente e password.', ['Password cifrata (SHA-256, 300 passaggi, sale)', 'Mai scritta in chiaro né nel codice', 'Prima password provvisoria da cambiare'], ['srv.accesso', 'reg.Utenti']],
      ['tentativi', 'Blocco tentativi', 'Troppe password sbagliate bloccano l\'account per 15 minuti.', ['Tentativi falliti nel registro'], ['reg.Registro']],
      ['sessioni', 'Sessioni', 'Ogni dispositivo ha un token che scade dopo 60 giorni.', ['Esci da tutti i dispositivi', 'Chiusura dalla Console'], ['reg.Sessioni']],
      ['ruoli', 'Ruoli', 'Amministratore, titolare, sola lettura, dipendente, demo.', ['Un solo amministratore', 'Sola lettura non può salvare nulla'], ['reg.Utenti']],
      ['permessi', 'Permessi per sezione', 'Per ogni dipendente: la sezione non si vede, si vede o si modifica.', ['Controllati dal server, non solo dall\'app', 'I dati delle sezioni non permesse non arrivano al dispositivo', 'Modifiche non permesse scartate'], ['sez.dipendenti', 'srv.dati']],
      ['csp', 'Protezione del sito', 'Regole del browser che permettono solo i file dell\'app.', ['Script solo locali', 'Collegamenti esterni solo verso i siti dei fornitori'], ['int.pages']],
      ['chiavi', 'Chiavi segrete', 'Le chiavi dell\'IA stanno nelle proprietà dello script.', ['Mai nel codice pubblico', 'Prezzi d\'acquisto solo nel Foglio Google'], ['int.gemini']]
    ] },
    { k: 'int', t: 'Servizi collegati', s: 'Gli strumenti esterni su cui poggia il gestionale', c: '#fb923c', L: [
      ['sheets', 'Google Sheets', 'Ogni azienda ha il suo Foglio Google con i dati.', ['Il Foglio principale tiene anche il registro centrale'], ['dati.Movimenti', 'reg.Gestionali']],
      ['drive', 'Google Drive', 'Cartelle private per documenti e backup.', ['«Centro di Costo - Fatture»', '«Centro di Costo - Analisi GLS»', '«Centro di Costo - Backup»', '«Centro di Costo - Team»'], ['srv.file', 'srv.backup']],
      ['email', 'Email automatiche', 'Credenziali, password dimenticata, richieste e risposte ferie.', ['Inviate dallo script, senza indirizzi esposti'], ['srv.accesso', 'srv.presenze']],
      ['gemini', 'Google Gemini', 'L\'IA principale: legge fatture e prepara schede prodotto.', ['Prova più modelli e ricorda quello che funziona'], ['srv.ia']],
      ['openai', 'ChatGPT', 'La seconda IA, usata se la prima non risponde.', ['Scelta di quale usare per prima'], ['srv.ia']],
      ['pages', 'GitHub Pages', 'Dove vive il sito: gestionale, Console e Presenze.', ['Aggiornamento automatico a ogni rilascio'], ['app.gestionale']],
      ['sdi', 'Fattura elettronica', 'File XML FatturaPA pronto da caricare.', ['DDT collegati, bollo virtuale, nature IVA'], ['sez.vendite']],
      ['xlsx', 'Excel', 'Import ed export di tutti i dati.', ['Modelli da compilare per l\'import'], ['sez.analisi']],
      ['pdf', 'PDF', 'Preventivi, DDT, fatture, report, fogli presenze.', ['Carattere Inter incorporato'], ['sez.preventivi', 'sez.analisi']],
      ['scan', 'Lettore codici a barre', 'La fotocamera legge i codici (anche con pistola USB).', ['Magazzino, preventivi, DDT'], ['sez.magazzino']],
      ['three', 'Mappa 3D', 'Le spedizioni sulla mappa dell\'Italia in 3D.', ['Zoom e rotazione dai pulsanti'], ['sez.gls']],
      ['pdfjs', 'Lettore PDF', 'Legge i PDF nel browser (loghi, documenti).', ['Anteprima dei documenti dell\'archivio'], ['sez.preventivi', 'sez.fornitori']]
    ] },
    { k: 'mot', t: 'Funzioni trasversali', s: 'Quello che lavora dietro a tutte le sezioni', c: '#facc15', L: [
      ['sync', 'Sincronizzazione', 'Il dispositivo scarica solo quello che è cambiato.', ['Coda delle modifiche se manca la rete', 'Pochi byte quando non cambia niente'], ['dati._Modifiche', 'srv.dati']],
      ['offline', 'Funziona offline', 'L\'app si apre e si usa anche senza connessione.', ['Salva in coda e invia appena torna la rete'], ['app.gestionale']],
      ['ia', 'IA nel gestionale', 'Lettura fatture, categorie, prodotti da link, logo sui capi.', ['Chiedi al gestionale'], ['srv.ia']],
      ['lessico', 'Lingua dell\'attività', 'Piazzale diventa locale, cantiere, salone… in tutta l\'app e nei PDF.', ['Categorie di spesa per attività'], ['set.veicoli']],
      ['ricerca', 'Ricerca globale', 'Cerca in tutti i fornitori con sinonimi e confronto.', ['Fino a 4 prodotti a confronto'], ['sez.preventivi']],
      ['motion', 'Movimento', 'Animazioni sobrie, numeri che salgono, apertura immediata.', ['Rispetta «riduci movimento»'], ['app.gestionale']],
      ['collegamenti', 'Collegamenti', 'Clienti, fornitori, preventivi e documenti si aprono l\'uno dall\'altro.', ['Preventivo a cliente o a fornitore', 'Riquadri «Collegati» nelle schede'], ['sez.clienti', 'sez.fornitori', 'sez.preventivi']]
    ] },
    { k: 'for', t: 'Cataloghi fornitori', s: 'I cataloghi dentro i Preventivi', c: '#e879f9', logo: true, L: [
      ['payper', 'Payper', 'Abbigliamento da lavoro e promozionale.', ['812 articoli, 3.557 colori'], ['sez.preventivi']],
      ['jrc', 'JRC', 'James Ross Collection.', ['564 articoli, 2.504 colori'], ['sez.preventivi']],
      ['dewalt', 'DeWalt', 'Elettroutensili.', ['Prezzo utilizzatore dal listino'], ['sez.preventivi']],
      ['stanley', 'Stanley', 'Utensili ed elettroutensili.', ['246 articoli'], ['sez.preventivi']],
      ['usag', 'USAG', 'Utensili professionali.', ['2.586 prodotti, 5.536 codici, listino 2026'], ['sez.preventivi']],
      ['milwaukee', 'Milwaukee', 'Elettroutensili e accessori.', ['1.926 prodotti, 7.582 codici'], ['sez.preventivi']],
      ['cofra', 'Cofra', 'Calzature e abbigliamento di sicurezza.', ['1.717 modelli, listino clienti'], ['sez.preventivi']],
      ['portwest', 'Portwest', 'Abbigliamento e DPI.', ['1.707 modelli, 3.121 colori'], ['sez.preventivi']],
      ['ffg', 'FFG', 'Utensili FF Group.', ['1.166 prodotti'], ['sez.preventivi']],
      ['benman', 'Benman', 'Utensili e accessori.', ['1.582 prodotti'], ['sez.preventivi']],
      ['hugo', 'Hugo', 'Lucchetti e cilindri.', ['74 prodotti'], ['sez.preventivi']],
      ['sola', 'Sola', 'Livelle e strumenti di misura.', ['212 prodotti'], ['sez.preventivi']],
      ['activegear', 'Active Gear', 'DPI e abbigliamento.', ['410 modelli'], ['sez.preventivi']],
      ['maxilia', 'Maxilia', 'Gadget personalizzati.', ['1.551 prodotti con scaglioni'], ['sez.preventivi']],
      ['promit', 'Promit', 'Gadget e abbigliamento promozionale.', ['1.327 prodotti'], ['sez.preventivi']],
      ['lavor', 'Lavor', 'Idropulitrici e pulizia.', ['244 macchine, 71 accessori'], ['sez.preventivi']],
      ['propac', 'Propac', 'Imballaggi.', ['1.122 prodotti, 4.331 articoli'], ['sez.preventivi']],
      ['kerakoll', 'Kerakoll', 'Prodotti per l\'edilizia.', ['317 prodotti'], ['sez.preventivi']],
      ['telwin', 'Telwin', 'Saldatrici, carica batterie e accessori.', ['591 prodotti'], ['sez.preventivi']],
      ['bihui', 'Bihui', 'Attrezzatura per piastrellisti: taglio, foratura, posa grandi lastre.', ['331 prodotti'], ['sez.preventivi']],
      ['fischer', 'Fischer', 'Fissaggi: tasselli, ancoranti chimici e metallici, viti, sigillanti.', ['734 prodotti, 5.420 codici'], ['sez.preventivi']],
      ['electraline', 'Electraline', 'Avvolgicavo, prolunghe, multiprese, prese e illuminazione.', ['299 prodotti, 407 codici'], ['sez.preventivi']],
      ['vibac', 'Vibac', 'Nastri adesivi per l\'automotive.', ['12 prodotti'], ['sez.preventivi']],
      ['krino', 'Krino', 'Utensili: punte, maschi, seghe a tazza, dischi, corone e inserti.', ['1.254 prodotti, 22.348 codici'], ['sez.preventivi']],
      ['qbrick', 'Qbrick Regular', 'Cassette portautensili, valigette, organizer e scaffali.', ['173 prodotti, 235 codici'], ['sez.preventivi']],
      ['bullvit', 'Bull-Vit', 'Viteria, bulloneria e minuteria.', ['512 prodotti, 16.506 codici'], ['sez.preventivi']],
      ['gierre', 'Gierre Scale', 'Scale, sgabelli, trabattelli e ricambi.', ['247 prodotti, 417 codici'], ['sez.preventivi']],
      ['akifix', 'Akifix', 'Cartongesso, fissaggi, finiture e utensileria.', ['1.756 prodotti, 6.594 codici'], ['sez.preventivi']],
      ['cmt', 'CMT Orange Tools', 'Lame, frese, punte e utensili per il legno.', ['992 prodotti, 5.560 codici'], ['sez.preventivi']],
      ['ambrovit', 'Ambrovit', 'Viteria e fissaggi: viti, barre filettate, rivetti, tirafondi.', ['153 prodotti, 9.468 codici'], ['sez.preventivi']],
      ['mustad', 'Mustad', 'Viti Panelvit, Drillex, Kovervit e Formex per legno, PVC e metallo.', ['59 prodotti, 733 codici'], ['sez.preventivi']],
      ['dueci', 'Duecì Grafica', 'Vinili, banner, laminazione, termoadesivi e materiali per grafica.', ['347 prodotti'], ['sez.preventivi']],
      ['prodyver', 'Prodyver', 'Carta, panni, mascheratura e protezioni per officine e carrozzerie.', ['38 prodotti, 68 codici'], ['sez.preventivi']],
      ['fermec', 'Fermec', 'Utensili professionali: chiavi, bussole, automotive, pneumatica, officina e minuteria.', ['8.265 prodotti, 30.488 codici'], ['sez.preventivi']],
      ['tecfi', 'Tecfi', 'Fissaggi, viti, bulloneria, rivetti, punte, sigillanti e schiume.', ['717 prodotti, 6.469 codici'], ['sez.preventivi']],
      ['vorpa', 'Vorpa', 'Ancoranti chimici e meccanici, tasselli, barre filettate, schiume e fissaggi.', ['332 prodotti, 1.901 codici'], ['sez.preventivi']],
      ['neri', 'Neri Safety', 'Guanti, abbigliamento, calzature e DPI: protezione di mani, capo, vista, udito e anticaduta.', ['1.524 prodotti, 5.958 codici'], ['sez.preventivi']],
      ['valex', 'Valex', 'Utensili manuali ed elettrici, spray tecnici e accessori (marchi OneAll, Kapro, Garnext, Tech).', ['2.133 prodotti, 2.935 codici'], ['sez.preventivi']],
      ['elepacking', 'Elepacking', 'Sacchi per rifiuti, teli copritutto, pacciamatura, imballi e nastri segnaletici.', ['100 prodotti, 384 codici'], ['sez.preventivi']],
      ['barbero', 'Barbero', 'DPI, imballaggio, reggia, sollevamento, fissaggio, igiene e segnaletica.', ['1.306 prodotti, 4.259 codici'], ['sez.preventivi']],
      ['svelt', 'Svelt', 'Scale, sgabelli, trabattelli, ponteggi e linee vita professionali.', ['809 prodotti, 3.041 codici'], ['sez.preventivi']],
      ['centroreti', 'Centro Reti', 'Reti e recinzioni modulari, cancelli, pali e recinzioni da cantiere.', ['95 prodotti, 480 codici'], ['sez.preventivi']],
      ['bluemaster', 'Bluemaster', 'Utensili da taglio: punte, lame a nastro, frese, maschi e seghe a tazza.', ['3.505 prodotti, 41.369 codici'], ['sez.preventivi']],
      ['cenigomma', 'Cenigomma', 'DPI, calzature, guanti, abbigliamento Carhartt e CAT, carrelli e macchine.', ['2.649 prodotti, 3.625 codici'], ['sez.preventivi']],
      ['facal', 'Facal Scale', 'Scale, trabattelli, sgabelli e rampe in alluminio e vetroresina, con accessori e ricambi.', ['646 prodotti, 1.469 codici'], ['sez.preventivi']],
      ['1aid', '1AID', 'Kit e cassette di primo soccorso DM 388, medicazione, diagnostica e defibrillatori.', ['171 prodotti'], ['sez.preventivi']],
      ['mag', 'Magazzino', 'Gli articoli del magazzino dell\'azienda.', ['Prezzo di vendita e costo'], ['sez.magazzino', 'sez.preventivi']],
      ['srv', 'Servizi', 'Le righe di servizio preimpostate.', ['Codici SRV-001…'], ['sez.impostazioni', 'sez.preventivi']]
    ] },
    { k: 'set', t: 'Attività', s: 'Il gestionale si adatta al tipo di azienda', c: '#2dd4bf', L: (window.CDC_SETTORI && window.CDC_SETTORI.list || []).map(s => [s.id, s.n, `Sedi chiamate «${(s.sede || ['Sede', 'Sedi'])[1].toLowerCase()}», acquisti come «${(s.acq || 'Acquisti').toLowerCase()}».`, ['Sezioni accese di partenza', 'Categorie di spesa dell\'attività', 'Demo con dati dell\'attività'], ['mot.lessico', 'app.demo']]) },
    { k: 'team', t: 'Team di agenti', s: 'Chi controlla e fa crescere il Centro di Costo', c: '#a78bfa', L: [
      ['guardiano', 'Guardiano', 'Ogni mattina prova app, demo, Console e Presenze e controlla i backup.', ['Report nel Drive «Centro di Costo - Team»'], ['app.console', 'srv.backup']],
      ['informatico', 'Informatico', 'Ogni settimana rivede codice, sicurezza e velocità.', ['Suggerimenti, non modifica nulla'], ['app.gestionale']],
      ['commerciale', 'Commerciale', 'Trova aziende adatte e prepara le email.', ['Da attivare'], ['app.tour']],
      ['marketing', 'Marketing', 'Idee per post, testi e concorrenza.', ['Da attivare'], ['app.tour']],
      ['grafico', 'Grafico', 'Schermate, animazioni e presentazione.', ['Da attivare'], ['app.tour']]
    ] },
    { k: 'cli', t: 'Gestionali attivi', s: 'Le aziende che usano il Centro di Costo, dal vivo', c: '#60a5fa', live: true, L: [] }
  ];
  const BY = new Map();
  const reindex = () => { BY.clear(); G.forEach(g => g.L.forEach(it => BY.set(g.k + '.' + it[0], { g, it }))); };

  /* ---------------- dati dal vivo ---------------- */
  let C = null, focus = '', sel = '', q = '', hov = '';
  const D = () => (C && C.D) || {};
  function liveClients() {
    const g = G.find(x => x.k === 'cli'), ws = (D().ws || []).filter(w => w.tipo !== 'demo');
    g.L = ws.map(w => {
      const U = (D().users || []).filter(u => u.ws === w.codice), S = window.CDC_SETTORI && window.CDC_SETTORI.get(w.settore || (w.tipo === 'principale' ? 'veicoli' : 'altro'));
      return [w.codice, w.nome || w.codice, `${w.tipo === 'principale' ? 'Il tuo gestionale' : 'Cliente'} · ${S ? S.n : 'attività non indicata'}${w.citta ? ' · ' + w.citta : ''}`, [`${U.length} ${U.length === 1 ? 'utente' : 'utenti'}`, w.stato === 'attivo' ? 'Attivo' : 'Sospeso', w.scadenza ? 'Abbonamento fino al ' + String(w.scadenza).split('-').reverse().join('/') : 'Senza scadenza', w.piano ? 'Piano ' + w.piano : ''].filter(Boolean), ['set.' + (w.settore || 'altro'), 'reg.Gestionali'], w];
    });
    reindex();
  }
  function live(key) {
    const d = D(), [gk, ik] = key.split('.'), U = (d.users || []).filter(u => u.ruolo !== 'admin'), o = [];
    const ws = (d.ws || []).filter(w => w.tipo === 'cliente');
    if (key === 'app.console' || key === 'reg.Gestionali') o.push(['Clienti', ws.length], ['Attivi', ws.filter(w => w.stato === 'attivo').length]);
    if (key === 'app.console' || key === 'reg.Utenti') o.push(['Utenti', U.length], ['Dipendenti con accesso', U.filter(u => u.ruolo === 'dipendente').length]);
    if (key === 'reg.Sessioni' || key === 'sic.sessioni') o.push(['Sessioni attive', (d.sess || []).filter(s => !s.io).length]);
    if (key === 'reg.Pagamenti') { const P = d.pagamenti || []; o.push(['Pagamenti', P.length], ['Incassato', '€ ' + Math.round(P.reduce((a, p) => a + (Number(p.importo) || 0), 0)).toLocaleString('it-IT')]); }
    if (key === 'reg.Registro') o.push(['Eventi', (d.registro || []).length]);
    if (gk === 'srv' || key === 'app.gestionale') o.push(['Versione script', d.v || '—']);
    if (gk === 'set') o.push(['Clienti con questa attività', ws.filter(w => w.settore === ik).length]);
    if (gk === 'team' && C.team) { const r = C.team(ik); o.push(['Ultimo report', r ? ({ ok: 'Tutto ok', warn: 'Da controllare', bad: 'Problema' }[r.stato] || r.stato) : 'Da attivare']); }
    if (key === 'sic.ruoli') ['utente', 'lettura', 'dipendente'].forEach(r => o.push([{ utente: 'Titolari', lettura: 'Sola lettura', dipendente: 'Dipendenti' }[r], U.filter(u => u.ruolo === r).length]));
    return o;
  }

  /* ---------------- disegno ---------------- */
  const groupCount = g => g.L.length;
  const total = () => G.reduce((a, g) => a + g.L.length, 0);
  const isPhone = () => root && root.clientWidth < 700;
  let root = null, bound = false;

  function mount(el, ctx) {
    C = ctx; root = el; liveClients();
    if (sel && !BY.has(sel)) sel = '';
    el.innerHTML = `<div class="mp">
      <div class="mp-hero">
        <div class="mp-ht"><span class="mp-eye">${svg('hub')}Mappa del gestionale</span><h2>Tutto il Centro di Costo, in un colpo d'occhio</h2><p>Sezioni, app, dati, server, sicurezza, servizi, fornitori, attività, agenti e clienti: tocca un nodo per entrare, tocca una voce per vedere cosa fa e a cosa è collegata.</p></div>
        <label class="mp-q">${svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>')}<input type="search" id="mp-q" placeholder="Cerca qualsiasi cosa: fatture, timbrature, Cofra, backup…" value="${esc(q)}" autocomplete="off"><div class="mp-qr" id="mp-qr" hidden></div></label>
      </div>
      <div class="mp-kpis">${[['Sezioni', 'sez'], ['App', 'app'], ['Fogli dati', 'dati'], ['Aree del server', 'srv'], ['Fornitori', 'for'], ['Servizi', 'int'], ['Attività', 'set'], ['Gestionali', 'cli']].map(([l, k]) => `<button type="button" class="mp-k" data-mp="g:${k}" style="--c:${G.find(g => g.k === k).c}"><b>${groupCount(G.find(g => g.k === k))}</b><span>${l}</span></button>`).join('')}<div class="mp-k tot"><b>${total()}</b><span>voci in tutto</span></div></div>
      <div class="mp-stage"><div class="mp-canvas" id="mp-canvas"></div><aside class="mp-panel" id="mp-panel"></aside></div>
      <div class="mp-inv" id="mp-inv"></div>
    </div>`;
    draw(); panel(); inventory(); bind();
  }

  // posizioni su un'ellisse
  const ell = (n, cx, cy, rx, ry, a0 = -Math.PI / 2) => Array.from({ length: n }, (_, i) => { const a = a0 + i / n * Math.PI * 2; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, a]; });
  const curve = (x1, y1, x2, y2) => { const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1; const k = .18; return `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${(mx - dy * k).toFixed(1)} ${(my + dx * k).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`; };
  // punto sul bordo della pillola centrale in direzione (x, y)
  const pillEdge = (cx, cy, w, h, x, y) => { const dx = x - cx, dy = y - cy, sx = (w / 2) / Math.abs(dx || 1e-6), sy = (h / 2) / Math.abs(dy || 1e-6), s = Math.min(sx, sy); return [cx + dx * s, cy + dy * s]; };
  const DEFS = `<defs>
      <linearGradient id="mp-gl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3b6cff"/><stop offset="1" stop-color="#d946ef"/></linearGradient>
      <linearGradient id="mp-gp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b6cff"/><stop offset=".55" stop-color="#8b5cf6"/><stop offset="1" stop-color="#ec4899"/></linearGradient>
      <radialGradient id="mp-hg"><stop offset="0" stop-color="#d946ef" stop-opacity=".55"/><stop offset="1" stop-color="#d946ef" stop-opacity="0"/></radialGradient>
      <filter id="mp-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="mp-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
    </defs>`;
  const diamond = (x, y, i) => `<g class="mp-dm" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" style="--i:${i}"><rect x="-7" y="-7" width="14" height="14" rx="2.5" transform="rotate(45)"/><path d="M-3 0h6M0 -3v6"/></g>`;
  const label = (s, max = 16) => { const w = String(s).split(' '), L = ['']; w.forEach(x => { if ((L[L.length - 1] + ' ' + x).trim().length > max && L[L.length - 1]) L.push(x); else L[L.length - 1] = (L[L.length - 1] + ' ' + x).trim(); }); return L.slice(0, 2); };

  function draw() {
    const el = root.querySelector('#mp-canvas'); if (!el) return;
    const ph = isPhone(), W = ph ? 420 : 1000, H = ph ? 640 : 660, cx = W / 2, cy = H / 2;
    if (!focus) {
      const P0 = ell(G.length, cx, cy + (ph ? 6 : 0), ph ? 160 : 385, ph ? 250 : 250), pw = ph ? 168 : 236, phh = ph ? 62 : 74, P = P0;
      const edges = G.map((g, i) => { const [x, y] = P[i], [ex, ey] = pillEdge(cx, cy, pw, phh, x, y); return { g, i, x, y, ex, ey, d: curve(ex, ey, x, y) }; });
      el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="mp-svg" role="img" aria-label="Mappa del Centro di Costo">${DEFS}
        <g class="mp-grid">${grid(W, H)}</g>
        <ellipse cx="${cx}" cy="${cy}" rx="${pw * .9}" ry="${phh * 1.6}" fill="url(#mp-hg)" filter="url(#mp-soft)"/>
        <g class="mp-edges">${edges.map(e => `<path id="mp-e${e.i}" class="mp-e${hov === e.g.k ? ' hi' : ''}" d="${e.d}" style="--i:${e.i};--c:${e.g.c}"/>`).join('')}</g>
        ${RM ? '' : `<g class="mp-flow">${edges.map(e => `<circle r="${ph ? 2 : 2.6}" fill="${e.g.c}"><animateMotion dur="${(3.2 + (e.i % 4) * .55).toFixed(2)}s" repeatCount="indefinite" begin="${(e.i * .27).toFixed(2)}s"${e.i % 2 ? ' keyPoints="1;0" keyTimes="0;1" calcMode="linear"' : ''}><mpath href="#mp-e${e.i}"/></animateMotion></circle>`).join('')}</g>`}
        <g class="mp-dms">${edges.map(e => diamond(e.ex, e.ey, e.i)).join('')}</g>
        <g class="mp-hub" style="--i:0"><rect x="${cx - pw / 2}" y="${cy - phh / 2}" width="${pw}" height="${phh}" rx="${phh / 2}" class="mp-pill"/><rect x="${cx - pw / 2}" y="${cy - phh / 2}" width="${pw}" height="${phh}" rx="${phh / 2}" class="mp-pill-b" filter="url(#mp-glow)"/>
          <text x="${cx}" y="${cy + (ph ? 7 : 9)}" text-anchor="middle" class="mp-hub-t">Centro di Costo</text></g>
        <g class="mp-nodes">${edges.map(e => node(e.x, e.y, e.g, ph ? 50 : 60, e.i)).join('')}</g>
      </svg>`;
      return;
    }
    // un gruppo aperto: il gruppo al centro, le sue voci intorno
    const g = G.find(x => x.k === focus), n = g.L.length;
    if (ph || !n) { el.innerHTML = `<div class="mp-list"><div class="mp-lh"><button type="button" class="mp-back" data-mp="back">${svg('<path d="M15 18l-6-6 6-6"/>')}Tutta la mappa</button><span class="mp-chip" style="--c:${g.c}">${svg(g.k)}${esc(g.t)}</span></div>${n ? `<div class="mp-lg">${g.L.map((it, i) => item(g, it, i)).join('')}</div>` : '<p class="mp-empty">Nessuna voce</p>'}</div>`; return; }
    const two = n > 12, inner = two ? Math.ceil(n * .42) : n;
    const P = two ? [...ell(inner, cx, cy, 245, 150, -Math.PI / 2 + .2), ...ell(n - inner, cx, cy, 430, 272, -Math.PI / 2)] : ell(n, cx, cy, n <= 6 ? 290 : 360, n <= 6 ? 190 : 230);
    const pw = 236, phh = 72;
    const ed = g.L.map((it, i) => { const [x, y] = P[i], [ex, ey] = pillEdge(cx, cy, pw, phh, x, y); return { it, i, x, y, ex, ey, d: curve(ex, ey, x, y) }; });
    const sk = sel && sel.startsWith(g.k + '.') ? sel : '';
    const linked = new Set(); if (sk) (BY.get(sk).it[4] || []).forEach(k => linked.add(k));
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="mp-svg" role="img">${DEFS}
      <g class="mp-grid">${grid(W, H)}</g>
      <ellipse cx="${cx}" cy="${cy}" rx="${pw * .9}" ry="${phh * 1.6}" fill="url(#mp-hg)" filter="url(#mp-soft)"/>
      <g class="mp-edges">${ed.map(e => `<path id="mp-f${e.i}" class="mp-e${sk === g.k + '.' + e.it[0] ? ' hi' : ''}" d="${e.d}" style="--i:${e.i % 14};--c:${g.c}"/>`).join('')}</g>
      ${RM ? '' : `<g class="mp-flow">${ed.filter((_, i) => i % 2 === 0).map(e => `<circle r="2.2" fill="${g.c}"><animateMotion dur="${(2.8 + (e.i % 5) * .5).toFixed(2)}s" repeatCount="indefinite" begin="${(e.i * .19).toFixed(2)}s"><mpath href="#mp-f${e.i}"/></animateMotion></circle>`).join('')}</g>`}
      <g class="mp-dms">${ed.map(e => diamond(e.ex, e.ey, e.i % 14)).join('')}</g>
      <g class="mp-hub" style="--i:0"><rect x="${cx - pw / 2}" y="${cy - phh / 2}" width="${pw}" height="${phh}" rx="${phh / 2}" class="mp-pill"/><rect x="${cx - pw / 2}" y="${cy - phh / 2}" width="${pw}" height="${phh}" rx="${phh / 2}" class="mp-pill-b" filter="url(#mp-glow)" style="stroke:${g.c}"/>
        <text x="${cx}" y="${cy + (label(g.t, 20).length > 1 ? -4 : 8)}" text-anchor="middle" class="mp-hub-t sm">${label(g.t, 20).map((l, j) => `<tspan x="${cx}" dy="${j ? 26 : 0}">${esc(l)}</tspan>`).join('')}</text></g>
      <g class="mp-nodes">${ed.map(e => leaf(e.x, e.y, g, e.it, e.i, sk === g.k + '.' + e.it[0], linked)).join('')}</g>
    </svg>
    <button type="button" class="mp-back abs" data-mp="back">${svg('<path d="M15 18l-6-6 6-6"/>')}Tutta la mappa</button>`;
  }
  const grid = (W, H) => { let s = ''; for (let x = 0; x <= W; x += 40) s += `<path d="M${x} 0V${H}"/>`; for (let y = 0; y <= H; y += 40) s += `<path d="M0 ${y}H${W}"/>`; return s; };
  function node(x, y, g, s, i) {
    const L = label(g.t, 14);
    return `<g class="mp-n${hov === g.k ? ' hi' : ''}" data-mp="g:${g.k}" tabindex="0" role="button" aria-label="${esc(g.t)}" style="--i:${i};--c:${g.c}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">
      <rect x="${-s / 2 - 10}" y="${-s / 2 - 10}" width="${s + 20}" height="${s + 20}" rx="${s * .34}" class="mp-n-halo"/>
      <rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="${s * .28}" class="mp-n-b"/>
      <rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="${s * .28}" class="mp-n-o" filter="url(#mp-glow)"/>
      <svg x="${-s * .25}" y="${-s * .25}" width="${s * .5}" height="${s * .5}" viewBox="0 0 24 24" class="mp-n-i">${GI[g.k]}</svg>
      <text y="${s / 2 + 26}" text-anchor="middle" class="mp-n-t">${L.map((l, j) => `<tspan x="0" dy="${j ? 20 : 0}">${esc(l)}</tspan>`).join('')}</text>
      <g transform="translate(${s / 2 - 2} ${-s / 2 + 2})" class="mp-n-c"><circle r="12"/><text y="4" text-anchor="middle">${groupCount(g)}</text></g></g>`;
  }
  function leaf(x, y, g, it, i, on, linked) {
    const s = 46, L = label(it[1], 14), lg = g.logo && !['mag', 'srv'].includes(it[0]);
    return `<g class="mp-n leaf${on ? ' on' : ''}" data-mp="i:${g.k}.${esc(it[0])}" tabindex="0" role="button" aria-label="${esc(it[1])}" style="--i:${i % 16};--c:${g.c}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">
      <rect x="${-s / 2 - 7}" y="${-s / 2 - 7}" width="${s + 14}" height="${s + 14}" rx="15" class="mp-n-halo"/>
      <rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="12" class="mp-n-b"/>
      <rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="12" class="mp-n-o" filter="url(#mp-glow)"/>
      ${lg ? `<rect x="${-s / 2 + 5}" y="${-s / 2 + 5}" width="${s - 10}" height="${s - 10}" rx="7" fill="#fff"/><image href="../logo-${esc(it[0])}.svg" x="${-s / 2 + 7}" y="${-s / 2 + 7}" width="${s - 14}" height="${s - 14}" preserveAspectRatio="xMidYMid meet"/>` : `<svg x="-12" y="-12" width="24" height="24" viewBox="0 0 24 24" class="mp-n-i">${iconOf(g.k, it[0])}</svg>`}
      <text y="${s / 2 + 22}" text-anchor="middle" class="mp-n-t sm">${L.map((l, j) => `<tspan x="0" dy="${j ? 18 : 0}">${esc(l)}</tspan>`).join('')}</text></g>`;
  }
  function item(g, it, i) {
    const k = g.k + '.' + it[0];
    return `<button type="button" class="mp-it${sel === k ? ' on' : ''}" data-mp="i:${esc(k)}" style="--c:${g.c};--i:${i % 20}"><span class="mp-it-i">${g.logo && !['mag', 'srv'].includes(it[0]) ? `<img src="../logo-${esc(it[0])}.svg" alt="" loading="lazy">` : svg(iconOf(g.k, it[0]))}</span><span class="mp-it-t"><b>${esc(it[1])}</b><small>${esc(it[2])}</small></span></button>`;
  }

  // pannello di dettaglio
  function panel() {
    const el = root.querySelector('#mp-panel'); if (!el) return;
    const r = sel && BY.get(sel);
    if (!r) {
      const g = focus && G.find(x => x.k === focus);
      el.innerHTML = g ? `<div class="mp-p-h"><span class="mp-p-ic" style="--c:${g.c}">${svg(g.k)}</span><div><small>Gruppo</small><h3>${esc(g.t)}</h3></div></div><p class="mp-p-d">${esc(g.s)}.</p>
          <div class="mp-p-s"><b>${g.L.length}</b> voci · tocca un nodo per vedere cosa fa e a cosa è collegato</div>
          <div class="mp-p-l">${g.L.map(it => `<button type="button" data-mp="i:${g.k}.${esc(it[0])}">${esc(it[1])}</button>`).join('')}</div>`
        : `<div class="mp-p-h"><span class="mp-p-ic" style="--c:#d946ef">${svg('hub')}</span><div><small>Centro di Costo</small><h3>Come è fatto</h3></div></div>
          <p class="mp-p-d">Al centro c'è il gestionale. Intorno, ${G.length} gruppi con ${total()} voci: tocca un nodo per aprirlo.</p>
          <ol class="mp-flow-l">${['Le persone entrano dalle <b>app</b> con le loro credenziali', 'Le <b>sezioni</b> leggono e scrivono i <b>dati</b> del Foglio Google dell\'azienda', 'Il <b>server</b> controlla <b>sicurezza e permessi</b> a ogni richiesta', 'Il <b>registro centrale</b> tiene insieme aziende, utenti e pagamenti', 'I <b>servizi collegati</b> fanno IA, documenti, email e backup', 'Il <b>team di agenti</b> controlla ogni giorno che tutto funzioni'].map(s => `<li>${s}</li>`).join('')}</ol>`;
      return;
    }
    const { g, it } = r, lk = (it[4] || []).filter(k => BY.has(k)), back = [...BY.entries()].filter(([k, v]) => k !== sel && (v.it[4] || []).includes(sel)).map(([k]) => k).filter(k => !lk.includes(k)), L = live(sel);
    const chip = k => { const v = BY.get(k); return `<button type="button" class="mp-lk" data-mp="i:${esc(k)}" style="--c:${v.g.c}">${svg(iconOf(v.g.k, v.it[0]))}<span>${esc(v.it[1])}</span><small>${esc(v.g.t)}</small></button>`; };
    const ws = g.k === 'cli' && it[5];
    el.innerHTML = `<div class="mp-p-h"><span class="mp-p-ic" style="--c:${g.c}">${g.logo && !['mag', 'srv'].includes(it[0]) ? `<img src="../logo-${esc(it[0])}.svg" alt="">` : svg(iconOf(g.k, it[0]))}</span><div><small>${esc(g.t)}</small><h3>${esc(it[1])}</h3></div></div>
      <p class="mp-p-d">${esc(it[2])}</p>
      ${L.length ? `<div class="mp-p-live">${L.map(([a, b]) => `<div><b>${esc(b)}</b><span>${esc(a)}</span></div>`).join('')}</div>` : ''}
      ${(it[3] || []).length ? `<h4>${g.k === 'cli' ? 'Stato' : g.k === 'dati' ? 'Cosa contiene' : 'Cosa fa'}</h4><ul class="mp-p-f">${it[3].map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
      ${lk.length ? `<h4>Collegato a</h4><div class="mp-lks">${lk.map(chip).join('')}</div>` : ''}
      ${back.length ? `<h4>Lo usano</h4><div class="mp-lks">${back.slice(0, 12).map(chip).join('')}</div>` : ''}
      ${ws ? `<a class="mp-go" href="#clienti/${esc(ws.codice)}">Apri la scheda del cliente${svg('<path d="M9 6l6 6-6 6"/>')}</a>` : ''}
      ${g.k === 'team' ? `<a class="mp-go" href="#team">Apri il Team${svg('<path d="M9 6l6 6-6 6"/>')}</a>` : ''}
      ${sel === 'reg.Utenti' ? `<a class="mp-go" href="#utenti">Apri Utenti e permessi${svg('<path d="M9 6l6 6-6 6"/>')}</a>` : sel === 'reg.Pagamenti' ? `<a class="mp-go" href="#incassi">Apri Abbonamenti${svg('<path d="M9 6l6 6-6 6"/>')}</a>` : sel === 'reg.Registro' ? `<a class="mp-go" href="#registro">Apri il Registro${svg('<path d="M9 6l6 6-6 6"/>')}</a>` : sel === 'reg.Sessioni' ? `<a class="mp-go" href="#accessi">Apri Accessi${svg('<path d="M9 6l6 6-6 6"/>')}</a>` : ''}`;
  }

  // inventario completo, voce per voce
  function inventory() {
    const el = root.querySelector('#mp-inv'); if (!el) return;
    const t = q.trim().toLowerCase(), hit = (g, it) => !t || [it[1], it[2], ...(it[3] || []), g.t].join(' ').toLowerCase().includes(t);
    const blocks = G.map(g => ({ g, L: g.L.filter(it => hit(g, it)) })).filter(b => b.L.length);
    el.innerHTML = `<div class="mp-inv-h"><h3>${t ? `Risultati per «${esc(q)}»` : 'Tutto, voce per voce'}</h3><span>${blocks.reduce((a, b) => a + b.L.length, 0)} voci</span></div>
      ${blocks.map(({ g, L }) => `<section class="mp-blk" style="--c:${g.c}"><button type="button" class="mp-blk-h" data-mp="g:${g.k}"><span class="mp-p-ic sm" style="--c:${g.c}">${svg(g.k)}</span><b>${esc(g.t)}</b><small>${esc(g.s)}</small><em>${L.length}</em></button><div class="mp-lg">${L.map((it, i) => item(g, it, i)).join('')}</div></section>`).join('') || '<p class="mp-empty">Nessuna voce trovata</p>'}`;
  }
  function results() {
    const box = root.querySelector('#mp-qr'), t = q.trim().toLowerCase(); if (!box) return;
    if (t.length < 2) { box.hidden = true; return; }
    const R = []; BY.forEach((v, k) => { const s = [v.it[1], v.it[2], ...(v.it[3] || [])].join(' ').toLowerCase(), p = v.it[1].toLowerCase().startsWith(t) ? 0 : v.it[1].toLowerCase().includes(t) ? 1 : s.includes(t) ? 2 : 9; if (p < 9) R.push([p, k, v]); });
    R.sort((a, b) => a[0] - b[0]);
    box.innerHTML = R.slice(0, 8).map(([, k, v]) => `<button type="button" data-mp="i:${esc(k)}" style="--c:${v.g.c}">${svg(v.g.k)}<span><b>${esc(v.it[1])}</b><small>${esc(v.g.t)}</small></span></button>`).join('') || '<p>Niente da mostrare</p>';
    box.hidden = false;
  }

  function open(k) {
    const r = BY.get(k); if (!r) return;
    const same = focus === r.g.k && root.querySelector('#mp-canvas .mp-svg, #mp-canvas .mp-list');
    sel = k; focus = r.g.k;
    if (same) { // stesso gruppo: si accende solo la voce, senza ridisegnare la mappa
      root.querySelectorAll('#mp-canvas [data-mp^="i:"]').forEach(n => n.classList.toggle('on', n.dataset.mp === 'i:' + k));
      const ids = r.g.L.map(it => r.g.k + '.' + it[0]); root.querySelectorAll('#mp-canvas .mp-e').forEach((e, i) => e.classList.toggle('hi', ids[i] === k));
    } else draw();
    panel(); root.querySelectorAll('#mp-inv .mp-it').forEach(n => n.classList.toggle('on', n.dataset.mp === 'i:' + k));
    const pn = root.querySelector('#mp-panel'); if (pn && isPhone()) pn.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
  }
  function bind() {
    root.onclick = e => {
      const b = e.target.closest('[data-mp]'); if (!b || !root.contains(b)) return;
      const v = b.dataset.mp;
      if (v === 'back') { focus = ''; sel = ''; draw(); panel(); return; }
      if (v.startsWith('g:')) { focus = v.slice(2); sel = ''; draw(); panel(); root.querySelector('.mp-stage').scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); return; }
      if (v.startsWith('i:')) { open(v.slice(2)); root.querySelector('#mp-qr').hidden = true; if (b.closest('.mp-inv') || b.closest('.mp-qr')) root.querySelector('.mp-stage').scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); }
    };
    root.onkeydown = e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('g[data-mp]')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); } if (e.key === 'Escape' && focus) { focus = ''; sel = ''; draw(); panel(); } };
    root.onmouseover = e => { const n = e.target.closest('.mp-n[data-mp^="g:"]'); const k = n ? n.dataset.mp.slice(2) : ''; if (k !== hov && !focus) { hov = k; root.querySelectorAll('.mp-e').forEach((p, i) => p.classList.toggle('hi', G[i] && G[i].k === k)); } };
    const qi = root.querySelector('#mp-q');
    qi.oninput = () => { q = qi.value; results(); clearTimeout(qi._t); qi._t = setTimeout(inventory, 150); };
    qi.onkeydown = e => { if (e.key === 'Enter') { const f = root.querySelector('#mp-qr [data-mp]'); if (f) f.click(); } if (e.key === 'Escape') { qi.value = ''; q = ''; results(); inventory(); } };
    if (bound) return; bound = true;
    document.addEventListener('click', e => { if (root && root.isConnected && !e.target.closest('.mp-q')) { const r = root.querySelector('#mp-qr'); if (r) r.hidden = true; } });
    let rw = 0; window.addEventListener('resize', () => { if (!root || !root.isConnected) return; const w = root.clientWidth; if ((w < 700) !== (rw < 700)) draw(); rw = w; });
  }

  window.CDC_MAP = { mount, groups: G };
})();
