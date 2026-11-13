/* Centro di Costo — dati dimostrativi per la versione DEMO (codice DEMO2026).
   Tutto è inventato e generato nel browser: niente viene letto o salvato sul Foglio Google.
   v95: un set di dati per ogni settore di attività (settori.js); «veicoli» è la demo storica. */
(() => {
  'use strict';
  let seed = 20260426;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const r2 = n => Math.round(n * 100) / 100;
  const pad = n => String(n).padStart(2, '0');
  const now = new Date();
  const ds = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const daysAgo = n => { const d = new Date(now); d.setDate(d.getDate() - n); return d; };
  const uid = () => Math.floor(rnd() * 1e12).toString(36) + Math.floor(rnd() * 1e6).toString(36);

  const vei = function () {
    seed = 20260426;
    const CENTRI = ['MILANO', 'TORINO', 'BOLOGNA', 'ROMA', 'NAPOLI'];
    const SEDI = [
      { cod: 'DM01', n: 'Sede Milano', tipo: 'Sede', ind: 'Via Roma 10 – Milano (MI)', key: 'AZIENDA DEMO VIA ROMA MILANO', loc: 'MILANO|20121', citta: 'Milano', prov: 'MI', geo: [9.19, 45.464] },
      { cod: 'DM02', n: 'Magazzino Torino', tipo: 'Magazzino', ind: 'Corso Francia 200 – Torino (TO)', key: 'MAGAZZINO TORINO', loc: 'TORINO|10143', citta: 'Torino', prov: 'TO', geo: [7.65, 45.075] },
      { cod: 'DM03', n: 'Piazzale Bologna', tipo: 'Piazzale', ind: 'Via Emilia 45 – Bologna (BO)', key: 'PIAZZALE BOLOGNA', loc: 'BOLOGNA|40132', citta: 'Bologna', prov: 'BO', geo: [11.3, 44.5] },
      { cod: 'DM04', n: 'Filiale Roma', tipo: 'Sede operativa', ind: 'Via Tiburtina 900 – Roma (RM)', key: 'FILIALE ROMA', loc: 'ROMA|00156', citta: 'Roma', prov: 'RM', geo: [12.58, 41.92] },
      { cod: 'DM05', n: 'Magazzino Napoli', tipo: 'Magazzino', ind: 'Via Argine 300 – Napoli (NA)', key: 'MAGAZZINO NAPOLI', loc: 'NAPOLI|80147', citta: 'Napoli', prov: 'NA', geo: [14.32, 40.86] },
      { cod: 'CDC99', n: 'Da attribuire', tipo: 'Sospeso', ind: 'Sede di consegna non indicata', key: '', loc: '', citta: '', prov: '', geo: null }
    ];
    const CDC_BY = { MILANO: 'DM01', TORINO: 'DM02', BOLOGNA: 'DM03', ROMA: 'DM04', NAPOLI: 'DM05' };
    // ---------- acquisti di attrezzatura ----------
    const ART = [
      ['Guanti nitrile nero tg. L (conf. 100)', 'CONF', 8.9, 'Würth'], ['Scarpe antinfortunistiche S3 tg. 43', 'PA', 64.5, 'Cofra'], ['T-shirt cotone con logo', 'PZ', 6.2, 'Payper'],
      ['Felpa con zip blu navy', 'PZ', 18.5, 'Payper'], ['Gilet alta visibilità arancio', 'PZ', 7.4, 'Portwest'], ['Avvitatore a batteria 18V', 'PZ', 189, 'Milwaukee'],
      ['Batteria 18V 5,0 Ah', 'PZ', 98, 'Milwaukee'], ['Smerigliatrice angolare 125 mm', 'PZ', 145, 'DeWalt'], ['Disco da taglio inox 125 mm', 'PZ', 1.35, 'Würth'],
      ['Punta HSS 8 mm', 'PZ', 2.1, 'Würth'], ['Viti autoperforanti 4,2x19 (conf. 500)', 'CONF', 14.8, 'Würth'], ['Rivetti alluminio 4,8x12 (conf. 250)', 'CONF', 11.5, 'Berner'],
      ['Silicone trasparente 310 ml', 'PZ', 4.9, 'Berner'], ['Sgrassatore spray 400 ml', 'PZ', 5.6, 'Würth'], ['Nastro americano 50 mm', 'PZ', 3.2, 'Propac'],
      ['Scatola cartone 40x30x30', 'PZ', 1.1, 'Propac'], ['Film estensibile 23 my', 'PZ', 12.9, 'Propac'], ['Carta mani piegata (cartone)', 'CONF', 24, 'Lyreco'],
      ['Toner stampante nero', 'PZ', 69, 'Lyreco'], ['Risma carta A4 80 g', 'PZ', 4.2, 'Lyreco'], ['Chiave combinata 13 mm', 'PZ', 7.8, 'USAG'],
      ['Set cacciaviti 8 pezzi', 'PZ', 32, 'USAG'], ['Cassetta attrezzi completa', 'PZ', 249, 'USAG'], ['Prolunga avvolgicavo 25 m', 'PZ', 39, 'Amazon'],
      ['Faro LED da cantiere 50W', 'PZ', 45, 'Amazon'], ['Idropulitrice acqua fredda 150 bar', 'PZ', 299, 'Lavor'], ['Aspiratore solidi e liquidi 30 L', 'PZ', 129, 'Lavor'],
      ['Spese di trasporto', 'PZ', 12, 'Würth'], ['Occhiali di protezione', 'PZ', 3.9, 'Cofra'], ['Cuffie antirumore', 'PZ', 16.5, 'Cofra']
    ];
    const cat = d => { const D = d.toUpperCase();
      if (/TRASPORTO/.test(D)) return 'Trasporti e servizi'; if (/T-SHIRT|FELPA|GILET/.test(D)) return 'Abbigliamento da lavoro'; if (/SCARPE|GUANT|OCCHIAL|CUFFIE/.test(D)) return 'DPI e sicurezza';
      if (/SCATOLA|FILM|NASTRO/.test(D)) return 'Imballaggio'; if (/CARTA MANI|SGRASS/.test(D)) return 'Pulizia e igiene'; if (/TONER|RISMA/.test(D)) return 'Ufficio e informatica';
      if (/DISCO|PUNTA/.test(D)) return 'Accessori per utensili'; if (/AVVITATORE|BATTERIA|SMERIGLIATRICE|IDROPULITRICE|ASPIRATORE/.test(D)) return 'Elettroutensili e batterie';
      if (/VITI|RIVETTI/.test(D)) return 'Minuteria e fissaggio'; if (/SILICONE/.test(D)) return 'Chimici e sigillanti'; if (/PROLUNGA|FARO|LED/.test(D)) return 'Elettrico e illuminazione'; return 'Utensili e attrezzature'; };
    const movimenti = [];
    for (let i = 0; i < 360; i++) {
      const a = pick(ART), d = daysAgo(int(0, 360)), q = a[1] === 'PZ' && a[2] > 100 ? int(1, 2) : int(1, 20);
      movimenti.push({ id: 'dm' + uid(), data: ds(d), ndoc: 'DDT ' + int(1000, 9999), codice: 'ART' + int(10000, 99999), descrizione: a[0].toUpperCase(), um: a[1], quantita: q, prezzo: r2(a[2] * (0.9 + rnd() * 0.2)), iva: 0.22,
        centro: pick(CENTRI), societa: '', categoria: cat(a[0]), fornitore: a[3], note: '', creato: ds(d) });
    }
    // ---------- spedizioni GLS ----------
    const DEST = [['Ricambi Rossi S.r.l.', 'Milano', 'MI', 'Lombardia'], ['Officina Bianchi', 'Torino', 'TO', 'Piemonte'], ['Autoservice Verdi', 'Bologna', 'BO', 'Emilia-Romagna'], ['Logistica Nord', 'Verona', 'VR', 'Veneto'],
      ['Carrozzeria Esposito', 'Napoli', 'NA', 'Campania'], ['Gomme Express', 'Roma', 'RM', 'Lazio'], ['Ferramenta Conti', 'Firenze', 'FI', 'Toscana'], ['Truck Center Sud', 'Bari', 'BA', 'Puglia'],
      ['Flotte Italia', 'Padova', 'PD', 'Veneto'], ['Service Adriatico', 'Pescara', 'PE', 'Abruzzo'], ['Moto Ricambi', 'Brescia', 'BS', 'Lombardia'], ['Isola Auto', 'Palermo', 'PA', 'Sicilia']];
    const gls = [];
    for (let m = 5; m >= 0; m--) {
      const base = new Date(now.getFullYear(), now.getMonth() - m, 1), mese = `${base.getFullYear()}-${pad(base.getMonth() + 1)}`, n = int(55, 85);
      for (let i = 0; i < n; i++) {
        const dd = pick(DEST), c = pick(CENTRI), colli = int(1, 6), kg = r2(colli * (2 + rnd() * 12)), nolo = r2(6.5 + kg * 0.32), fuel = r2(nolo * 0.12), suppl = rnd() < 0.15 ? r2(3 + rnd() * 9) : 0;
        const day = new Date(base); day.setDate(int(1, 27));
        gls.push({ id: 'dg' + uid(), mese, data: ds(day), contratto: '1234', nsped: String(int(600000000, 699999999)), rif: 'ORD' + int(1000, 9999), destinatario: dd[0], citta: dd[1], prov: dd[2], regione: dd[3],
          cdc: CDC_BY[c], cdcNome: c, tipologia: rnd() < 0.85 ? 'Nazionale' : 'Express', colli, kgReali: kg, kgTass: Math.ceil(kg), nolo, fuel, suppl, totale: r2(nolo + fuel + suppl), gg: int(1, 3), riaddebito: rnd() < 0.2 ? 'Cliente' : '', note: '' });
      }
    }
    // ---------- gasolio ----------
    const MEZZI = [['FX123AB', 'Furgone Iveco Daily', 'Marco Neri'], ['GA456CD', 'Furgone Ford Transit', 'Luca Gallo'], ['FY789EF', 'Fiat Ducato', 'Paolo Riva'], ['GB012GH', 'Renault Master', 'Andrea Fontana'], ['FZ345IL', 'Peugeot Boxer', 'Sara Greco']];
    const gasolio = [];
    MEZZI.forEach(([targa, mezzo, op], k) => { let km = 40000 + k * 23000;
      for (let d = 180; d > 0; d -= int(6, 10)) { const lt = r2(45 + rnd() * 30); km += Math.round(lt * (11 + rnd() * 3));
        gasolio.push({ id: 'dq' + uid(), data: ds(daysAgo(d)), targa, km, litri: lt, prezzo: r2(1.68 + rnd() * 0.14), proprietario: 'Aziendale', operatore: op, centro: CENTRI[k % CENTRI.length], uso: mezzo, note: '' }); } });
    // ---------- fatture fornitori ----------
    const FORN = ['Würth S.r.l.', 'Berner S.p.A.', 'Cofra S.r.l.', 'Milwaukee Italia', 'Propac S.r.l.', 'Payper S.p.A.', 'Officina Meccanica Sud', 'Energia Più S.p.A.'];
    const fatture = [];
    for (let i = 0; i < 46; i++) {
      const d = daysAgo(int(5, 300)), imp = r2(150 + rnd() * 3800), sc = new Date(d); sc.setDate(sc.getDate() + pick([30, 60, 90]));
      const paid = ds(sc) < ds(now) ? rnd() < 0.85 : rnd() < 0.2;
      fatture.push({ id: 'df' + uid(), fornitore: pick(FORN), numero: `${int(1, 999)}/${d.getFullYear()}`, data: ds(d), scadenza: ds(sc), imponibile: imp, imposta: r2(imp * 0.22), totale: r2(imp * 1.22), centro: pick(CENTRI),
        categoria: pick(['Utensili e attrezzature', 'DPI e sicurezza', 'Abbigliamento da lavoro', 'Imballaggio', 'Trasporti e servizi']), stato: paid ? 'pagata' : 'da pagare', pagata: paid ? ds(sc) : '', ddt: '', righe: '', pdf: '', note: '', creato: ds(d) });
    }
    // ---------- Lyreco ----------
    const LYA = [['Carta A4 80 g (risma)', 'Ufficio', 4.1], ['Toner nero', 'Informatica', 68], ['Penne a sfera blu (conf. 50)', 'Cancelleria', 12.5], ['Carta igienica (conf. 48)', 'Igiene', 29.9],
      ['Detergente multiuso 5 L', 'Pulizia', 11.8], ['Sacchi neri 110 L', 'Pulizia', 9.4], ['Raccoglitori ad anelli', 'Archiviazione', 2.3], ['Caffè in capsule (100)', 'Pausa caffè', 27]];
    const lyreco = [], lyfatture = [];
    for (let m = 7; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, int(3, 25)), nf = String(2026000000 + int(100000, 999999)); let tot = 0;
      for (let i = 0; i < int(6, 14); i++) { const a = pick(LYA), q = int(1, 10), s = pick(SEDI.slice(0, 5)), imp = r2(a[2] * q); tot += imp;
        lyreco.push({ id: 'dl' + uid(), fattura: nf, tipo: 'TD01', data: ds(d), ddt: String(int(800000, 899999)), dataDdt: ds(d), ordine: 'OR' + int(10000, 99999), richiedente: pick(['M. Neri', 'L. Gallo', 'S. Greco']), codice: String(int(100000, 999999)), descrizione: a[0].toUpperCase(), categoria: a[1], quantita: q, um: 'PZ', prezzo: a[2], importo: imp, iva: 22, sede: s.key, cdc: s.cod, note: '' }); }
      lyfatture.push({ id: nf, tipo: 'TD01', data: ds(d), descrizione: 'Fattura', imponibile: r2(tot), totale: r2(tot * 1.22), stato: m > 1 ? 'pagata' : 'da pagare', pagata: m > 1 ? ds(d) : '', pdf: '', note: '' });
    }
    // ---------- Amazon ----------
    const AMA = [['Organizer per minuteria 24 scomparti', 'Organizzazione', 19.9], ['Prolunga elettrica 10 m', 'Elettrico', 24.5], ['Faretto LED ricaricabile', 'Illuminazione', 32], ['Mouse wireless', 'Informatica', 14.9],
      ['Cavo USB-C 2 m (2 pezzi)', 'Informatica', 11.9], ['Termometro digitale', 'Varie', 9.9], ['Kit pronto soccorso', 'Sicurezza', 26.5], ['Tappetino ergonomico', 'Ufficio', 22]];
    const amazon = [], amazonart = [];
    for (let i = 0; i < 34; i++) {
      const d = daysAgo(int(2, 330)), id = `40${int(1, 9)}-${int(1000000, 9999999)}-${int(1000000, 9999999)}`, s = pick(SEDI.slice(0, 5)); let sub = 0, pz = 0; const n = int(1, 3);
      for (let k = 0; k < n; k++) { const a = pick(AMA), q = int(1, 3); sub += a[2] * q; pz += q;
        amazonart.push({ id: id + '-' + k, ordine: id, data: ds(d), quantita: q, descrizione: a[0], prezzo: a[2], importo: r2(a[2] * q), venditore: 'Amazon', condizione: 'Nuovo', spedito: ds(d), localita: s.citta.toUpperCase(), categoria: a[1] }); }
      const totale = r2(sub), imp = r2(totale / 1.22);
      amazon.push({ id, data: ds(d), articoli: n, pezzi: pz, venditore: 'Amazon', destinatario: 'Azienda Demo', localita: s.citta.toUpperCase(), pagamento: 'Carta aziendale', subtotale: totale, spedizione: 0, sconti: 0, imponibile: imp, iva: r2(totale - imp), totale, ivaTipo: 'fattura', cdc: s.cod, note: '', pdf: '' });
    }
    // ---------- preventivi, clienti, ordini Torental ----------
    const config = {
      azienda: { nome: 'Azienda Demo S.r.l.', citta: 'Milano (MI)' }, centri: CENTRI, lyCdc: SEDI, ppRic: 2,
      budget: { MILANO: 26000, TORINO: 18000, BOLOGNA: 17000, ROMA: 20000, NAPOLI: 12000 },
      pvClienti: [{ id: 'c1', nome: 'Rossi Trasporti S.r.l.', ref: 'Mario Rossi', email: 'info@rossitrasporti.example', tel: '02 1234567', ind: 'Via Milano 1, Milano', ric: '' },
        { id: 'c2', nome: 'Edil Bianchi', ref: 'Giulia Bianchi', email: 'giulia@edilbianchi.example', tel: '011 7654321', ind: 'Corso Torino 5, Torino', ric: 70 },
        { id: 'c3', nome: 'Officina Verdi', ref: 'Luca Verdi', email: 'officina@verdi.example', tel: '051 222333', ind: 'Via Bologna 9, Bologna', ric: '' }]
    };
    const y = now.getFullYear();
    const pv = (id, num, cli, stato, giorni, righe, extra) => { config['pv:' + id] = Object.assign({ id, num, data: ds(daysAgo(giorni)), valid: 30, stato, cliente: { nome: cli.nome, ref: cli.ref, email: cli.email, tel: cli.tel, ind: cli.ind }, righe, sconto: 0, note: 'Consegna in 10 giorni lavorativi.', iva: 22, agg: daysAgo(giorni).toISOString() }, extra || {}); };
    pv('d1', `P${y}-004`, config.pvClienti[0], 'inviato', 3, [{ sup: 'payper', it: '000001', n: 'MIAMI+', cl: 'T-SHIRT', c: '00000', cn: 'BIANCO', sz: ['S', 'M', 'L', 'XL'], q: { S: 4, M: 10, L: 10, XL: 6 }, p: 6.9, man: true, sc: 0 }]);
    pv('d2', `P${y}-003`, config.pvClienti[1], 'accettato', 12, [{ sup: 'payper', it: '000001', n: 'MIAMI+', cl: 'T-SHIRT', c: '01000', cn: 'GIALLO', sz: ['M', 'L'], q: { M: 15, L: 15 }, p: 6.9, man: true, sc: 5 }]);
    pv('d3', `P${y}-002`, config.pvClienti[2], 'bozza', 20, []);
    config.trClienti = [{ id: 't1', nome: 'Noleggi Express S.r.l.', ref: 'Anna Conti', tel: '06 998877', email: 'anna@noleggiexpress.example', ind: 'Roma', piva: '' }];
    config['tro:o1'] = { id: 'o1', num: `T${y}-001`, data: ds(daysAgo(6)), consegna: ds(daysAgo(-8)), stato: 'confermato', cliente: { nome: 'Noleggi Express S.r.l.', ref: 'Anna Conti', tel: '06 998877', email: 'anna@noleggiexpress.example', ind: 'Roma', piva: '' }, cliId: 't1', mezzi: '4 furgoni', righe: [{ t: 'Applicazione kit adesivi furgone', cod: 'DEMO-APP', q: 4, p: 85 }, { t: 'Transferta (1 giorno, 100 km)', cod: 'TRASF', q: 1, p: 120 }], sconto: 0, note: '' };
    return { movimenti, gls, gasolio, fatture, lyreco, lyfatture, amazon, amazonart, pdf: [], config, ai: false, aik: { gemini: false }, aiFirst: 'gemini', v: 'demo' };
  };

  /* ================= v95: demo per settore ================= */
  // [nome sede, città, provincia, [lon, lat]] · articoli [descrizione, um, prezzo, fornitore, peso] · fissi [descrizione, fornitore, € al mese]
  const PROF = {
    bar: { az: 'Bar Centrale Demo S.r.l.', citta: 'Roma (RM)',
      sedi: [['Bar Centrale', 'Roma', 'RM', [12.496, 41.902]], ['Caffè Stazione', 'Roma', 'RM', [12.502, 41.901]], ['Chiosco al Parco', 'Ostia', 'RM', [12.29, 41.733]]],
      art: [['Caffè in grani miscela bar 1 kg', 'KG', 18.5, 'Torrefazione Romana', 5], ['Latte fresco intero 1 L', 'LT', 1.15, 'Centrale del Latte', 8], ['Cornetti surgelati vuoti (conf. 60)', 'CONF', 23.9, 'Dolciaria Laziale', 5],
        ['Cornetti alla crema (conf. 50)', 'CONF', 26.5, 'Dolciaria Laziale', 3], ['Tramezzini assortiti (vassoio 20)', 'CONF', 19, 'Gastronomia Fresca', 3], ['Acqua minerale naturale 50 cl (24)', 'CONF', 5.6, 'Bevande Italia', 4],
        ['Coca-Cola lattina 33 cl (24)', 'CONF', 15.9, 'Bevande Italia', 3], ['Succo di frutta 125 ml (24)', 'CONF', 11.4, 'Bevande Italia', 2], ['Birra bottiglia 33 cl (24)', 'CONF', 19.8, 'Bevande Italia', 2],
        ['Aperol 1 L', 'PZ', 13.9, 'Distribuzione Alcolici', 2], ['Prosecco DOC (6 bottiglie)', 'CONF', 33, 'Distribuzione Alcolici', 1], ['Zucchero in bustine (conf. 1000)', 'CONF', 14.5, 'Cash & Carry Roma', 2],
        ['Bicchieri carta 8 oz asporto (conf. 1000)', 'CONF', 39, 'Monouso Pro', 1], ['Tovaglioli bar (conf. 2000)', 'CONF', 16.9, 'Monouso Pro', 2], ['Detergente lavabicchieri 5 kg', 'PZ', 14.5, 'Igiene Professionale', 1],
        ['Sanificante superfici 750 ml (6)', 'CONF', 18, 'Igiene Professionale', 1], ['Intervento tecnico e decalcificazione', 'PZ', 95, 'Assistenza Macchine Bar', .3]],
      fissi: [['Bolletta energia elettrica', 'Energia Più S.p.A.', 420], ['Canone di locazione locale', 'Immobiliare Capitolina', 2100], ['Elaborazione paghe e consulenza', 'Studio Paghe Rossi', 260]],
      forn: ['Torrefazione Romana', 'Bevande Italia', 'Dolciaria Laziale', 'Cash & Carry Roma', 'Distribuzione Alcolici', 'Energia Più S.p.A.'] },
    pizzeria: { az: 'Pizzeria Demo S.r.l.', citta: 'Napoli (NA)',
      sedi: [['Pizzeria Centro', 'Napoli', 'NA', [14.252, 40.845]], ['Pizzeria Vomero', 'Napoli', 'NA', [14.232, 40.846]], ['Asporto Pozzuoli', 'Pozzuoli', 'NA', [14.12, 40.823]]],
      art: [['Farina tipo 00 per pizza sacco 25 kg', 'SCA', 22.5, 'Molino del Sud', 6], ['Lievito di birra fresco 500 g', 'PZ', 2.1, 'Molino del Sud', 2], ['Fior di latte per pizza', 'KG', 7.8, 'Caseificio Campano', 7],
        ['Mozzarella di bufala campana DOP', 'KG', 12.9, 'Caseificio Campano', 3], ['Pomodoro pelato 2,5 kg', 'PZ', 3.4, 'Conserve del Vesuvio', 5], ['Passata di pomodoro 700 g (12)', 'CONF', 11.2, 'Conserve del Vesuvio', 2],
        ['Olio extravergine di oliva 5 L', 'PZ', 39.5, 'Oleificio Irpino', 2], ['Prosciutto cotto alta qualità', 'KG', 11.5, 'Salumificio Partenope', 2], ['Salame piccante a fette', 'KG', 14.2, 'Salumificio Partenope', 2],
        ['Rucola fresca', 'KG', 6.2, 'Ortofrutta Flegrea', 2], ['Basilico fresco (mazzi)', 'PZ', .9, 'Ortofrutta Flegrea', 2], ['Cartoni pizza 33x33 (conf. 100)', 'CONF', 21.5, 'Imballaggi Pizza', 3],
        ['Birra bottiglia 33 cl (24)', 'CONF', 19.8, 'Bevande Campania', 2], ['Acqua minerale 50 cl (24)', 'CONF', 5.4, 'Bevande Campania', 2], ['Coca-Cola lattina 33 cl (24)', 'CONF', 15.9, 'Bevande Campania', 2],
        ['Legna di faggio per forno (quintale)', 'PZ', 16.5, 'Legnami Irpini', 3], ['Sgrassatore professionale 5 L', 'PZ', 12.8, 'Igiene Professionale', 1], ['Tovaglioli carta (conf. 1000)', 'CONF', 9.5, 'Imballaggi Pizza', 1]],
      fissi: [['Bolletta energia elettrica', 'Energia Più S.p.A.', 560], ['Canone di locazione locale', 'Immobiliare Partenope', 1900], ['Commissioni Just Eat', 'Just Eat Italy', 640], ['Elaborazione paghe e consulenza', 'Studio Paghe Esposito', 310]],
      forn: ['Molino del Sud', 'Caseificio Campano', 'Conserve del Vesuvio', 'Salumificio Partenope', 'Bevande Campania', 'Legnami Irpini'] },
    ristorante: { az: 'Trattoria Demo S.r.l.', citta: 'Firenze (FI)',
      sedi: [['Trattoria in Centro', 'Firenze', 'FI', [11.256, 43.773]], ['Osteria sul Fiume', 'Firenze', 'FI', [11.245, 43.766]], ['Bistrot Fiesole', 'Fiesole', 'FI', [11.293, 43.806]]],
      art: [['Filetto di manzo', 'KG', 38, 'Macelleria Toscana', 3], ['Bistecca alla fiorentina', 'KG', 29, 'Macelleria Toscana', 4], ['Pollo ruspante intero', 'KG', 7.2, 'Macelleria Toscana', 2],
        ['Salmone fresco filetto', 'KG', 19.5, 'Pescheria del Porto', 2], ['Gamberi rossi', 'KG', 42, 'Pescheria del Porto', 1], ['Vongole veraci', 'KG', 12.5, 'Pescheria del Porto', 2],
        ['Pasta spaghetti trafilata al bronzo 5 kg', 'PZ', 9.8, 'Grossista Alimentare', 2], ['Riso carnaroli 5 kg', 'PZ', 15.5, 'Grossista Alimentare', 1], ['Olio extravergine di oliva 5 L', 'PZ', 41, 'Frantoio del Chianti', 2],
        ['Parmigiano reggiano 24 mesi', 'KG', 19.8, 'Caseificio Emiliano', 2], ['Uova fresche (30)', 'CONF', 6.6, 'Fattoria Mugello', 3], ['Pomodori cuore di bue', 'KG', 2.9, 'Ortofrutta Toscana', 4],
        ['Insalata mista', 'KG', 4.1, 'Ortofrutta Toscana', 3], ['Vino Chianti Classico (6 bottiglie)', 'CONF', 54, 'Cantina del Chianti', 3], ['Prosecco DOC (6 bottiglie)', 'CONF', 36, 'Cantina del Chianti', 1],
        ['Acqua minerale 75 cl (12)', 'CONF', 7.2, 'Bevande Toscana', 3], ['Noleggio tovagliato settimanale', 'PZ', 68, 'Lavanderia Industriale Arno', 2], ['Detergente lavastoviglie 10 kg', 'PZ', 29, 'Igiene Professionale', 1]],
      fissi: [['Bolletta energia elettrica', 'Energia Più S.p.A.', 780], ['Fornitura gas metano cucina', 'Gas Toscana S.p.A.', 340], ['Canone di locazione locale', 'Immobiliare Medicea', 2600], ['Elaborazione paghe e consulenza', 'Studio Paghe Bianchi', 420]],
      forn: ['Macelleria Toscana', 'Pescheria del Porto', 'Grossista Alimentare', 'Cantina del Chianti', 'Ortofrutta Toscana', 'Lavanderia Industriale Arno'] },
    lavanderia: { az: 'Lavanderia Demo S.r.l.', citta: 'Bologna (BO)', mezzi: [['FX201LV', 'Fiat Doblò ritiro e consegna', 'Marco Neri'], ['GA332LV', 'Renault Kangoo', 'Sara Greco']],
      sedi: [['Lavanderia Centro', 'Bologna', 'BO', [11.342, 44.494]], ['Lavasecco Murri', 'Bologna', 'BO', [11.36, 44.48]], ['Self-service Casalecchio', 'Casalecchio di Reno', 'BO', [11.276, 44.477]]],
      art: [['Detersivo liquido professionale 20 kg', 'PZ', 58, 'Chimica Lavanderia', 5], ['Ammorbidente concentrato 20 kg', 'PZ', 39, 'Chimica Lavanderia', 3], ['Smacchiatore pre-trattante 5 L', 'PZ', 24, 'Chimica Lavanderia', 2],
        ['Solvente per lavasecco 30 L', 'PZ', 145, 'Chimica Lavanderia', 1], ['Igienizzante tessuti 10 L', 'PZ', 32, 'Chimica Lavanderia', 2], ['Grucce in metallo (conf. 500)', 'CONF', 48, 'Forniture Tintorie', 3],
        ['Buste copriabiti in rotolo', 'PZ', 39, 'Forniture Tintorie', 3], ['Cartellini numerati (conf. 1000)', 'CONF', 14, 'Forniture Tintorie', 1], ['Guarnizione oblò lavatrice', 'PZ', 35, 'Ricambi Macchine Lavaggio', 1],
        ['Cinghia essiccatoio', 'PZ', 28, 'Ricambi Macchine Lavaggio', 1], ['Manutenzione caldaia vapore', 'PZ', 180, 'Assistenza Tecnica Emilia', .5], ['Rotoli cassa termici (conf. 10)', 'CONF', 9, 'Ufficio Facile', 1]],
      fissi: [['Bolletta energia elettrica', 'Energia Più S.p.A.', 690], ['Fornitura gas metano', 'Gas Emilia S.p.A.', 330], ['Servizio idrico', 'Acque Bolognesi', 140], ['Canone di locazione locale', 'Immobiliare Felsinea', 1450]],
      forn: ['Chimica Lavanderia', 'Forniture Tintorie', 'Ricambi Macchine Lavaggio', 'Assistenza Tecnica Emilia', 'Energia Più S.p.A.'] },
    edile: { az: 'Edil Deposito Demo S.r.l.', citta: 'Tivoli (RM)', mezzi: [['FT510ED', 'Camion con gru Iveco', 'Paolo Riva'], ['GB118ED', 'Furgone Ducato cassonato', 'Luca Gallo'], ['FV774ED', 'Muletto diesel', 'Andrea Fontana']],
      sedi: [['Deposito Tivoli', 'Tivoli', 'RM', [12.8, 41.96]], ['Deposito Guidonia', 'Guidonia Montecelio', 'RM', [12.72, 41.998]], ['Punto vendita Colleferro', 'Colleferro', 'RM', [13.005, 41.728]]],
      art: [['Cemento 32,5 R sacco 25 kg', 'SCA', 6.2, 'Cementeria Laziale', 7], ['Malta bastarda sacco 25 kg', 'SCA', 3.9, 'Cementeria Laziale', 4], ['Bancale forati 8x25x25 (200 pz)', 'PZ', 128, 'Laterizi Centro Italia', 3],
        ['Tondino ferro B450C 12 mm (barra 12 m)', 'PZ', 11, 'Ferro Sud Acciai', 4], ['Rete elettrosaldata 2x3 m', 'PZ', 18, 'Ferro Sud Acciai', 3], ['Sabbia lavata big bag 1 m³', 'PZ', 55, 'Cave Tiburtine', 3],
        ['Lastra cartongesso 120x200', 'PZ', 7.4, 'Isolanti & Cartongesso', 4], ['Pannello EPS 3 cm', 'PZ', 4.2, 'Isolanti & Cartongesso', 2], ['Guaina bituminosa rotolo 10 m', 'PZ', 38, 'Isolanti & Cartongesso', 2],
        ['Piastrelle gres porcellanato 60x60', 'MT', 14, 'Ceramiche Sassuolo', 3], ['Tubo PVC 110 mm 3 m', 'PZ', 9.5, 'Idrotermica Roma', 2], ['Pittura lavabile 14 L', 'PZ', 42, 'Colorificio Laziale', 2],
        ['Viti per cartongesso (conf. 1000)', 'CONF', 9, 'Ferramenta Industriale', 2], ['Pallet EPAL', 'PZ', 9, 'Pallet Service', 2], ['Trasporto con autogru', 'PZ', 120, 'Trasporti Edili Roma', 1]],
      fissi: [['Bolletta energia elettrica', 'Energia Più S.p.A.', 520], ['Canone di locazione piazzale', 'Immobiliare Tiburtina', 2400], ['Assicurazione mezzi e merci', 'Assicurazioni Generali Demo', 380]],
      forn: ['Cementeria Laziale', 'Laterizi Centro Italia', 'Ferro Sud Acciai', 'Isolanti & Cartongesso', 'Ceramiche Sassuolo', 'Trasporti Edili Roma'] },
    impresa: { az: 'Costruzioni Demo S.r.l.', citta: 'Roma (RM)', mezzi: [['FS903IM', 'Furgone Ducato cantiere', 'Marco Neri'], ['GC217IM', 'Pick-up Hilux', 'Andrea Fontana']],
      sedi: [['Cantiere via Appia', 'Roma', 'RM', [12.53, 41.86]], ['Villa Parioli', 'Roma', 'RM', [12.49, 41.925]], ['Condominio Frascati', 'Frascati', 'RM', [12.68, 41.81]]],
      art: [['Cemento 32,5 R sacco 25 kg', 'SCA', 6.4, 'Edil Deposito Tivoli', 5], ['Forati 8x25x25', 'PZ', .65, 'Edil Deposito Tivoli', 4], ['Tondino ferro 12 mm (barra 12 m)', 'PZ', 11.4, 'Edil Deposito Tivoli', 3],
        ['Noleggio miniescavatore (giorno)', 'PZ', 180, 'Noleggi Macchine Roma', 3], ['Noleggio ponteggio (mese)', 'PZ', 650, 'Ponteggi Lazio', 2], ['Subappalto impianto elettrico · SAL', 'PZ', 2400, 'Elettro Impianti Demo', 1],
        ['Smaltimento macerie cassone 6 m³', 'PZ', 290, 'Ecologia Romana', 2], ['Scarpe antinfortunistiche S3', 'PA', 64, 'Sicurezza Lavoro', 1], ['Guanti da lavoro (conf. 12)', 'CONF', 18, 'Sicurezza Lavoro', 1],
        ['Pratica CILA e direzione lavori', 'PZ', 600, 'Studio Tecnico Demo', .4], ['Lastra cartongesso 120x200', 'PZ', 7.6, 'Edil Deposito Tivoli', 3], ['Pittura lavabile 14 L', 'PZ', 44, 'Colorificio Laziale', 2],
        ['Tubo multistrato 26 mm (50 m)', 'PZ', 95, 'Idrotermica Roma', 2], ['Gasolio per gruppo elettrogeno', 'LT', 1.72, 'Carburanti Roma', 2]],
      fissi: [['Canone di locazione ufficio', 'Immobiliare Capitolina', 900], ['Assicurazione RC impresa', 'Assicurazioni Generali Demo', 410], ['Consulenza sicurezza RSPP', 'Studio Sicurezza Demo', 180]],
      forn: ['Edil Deposito Tivoli', 'Noleggi Macchine Roma', 'Elettro Impianti Demo', 'Ecologia Romana', 'Ponteggi Lazio', 'Studio Tecnico Demo'] },
    negozio: { az: 'Boutique Demo S.r.l.', citta: 'Torino (TO)',
      sedi: [['Negozio Via Roma', 'Torino', 'TO', [7.683, 45.068]], ['Outlet Moncalieri', 'Moncalieri', 'TO', [7.68, 45.0]], ['Negozio Online', 'Torino', 'TO', null]],
      art: [['Riassortimento merce collezione autunno', 'PZ', 1250, 'Moda Ingrosso Milano', 2], ['Riassortimento accessori e pelletteria', 'PZ', 680, 'Pelletterie Toscane', 1], ['Shopper carta personalizzate (conf. 250)', 'CONF', 85, 'Packaging Torino', 2],
        ['Etichette prezzo in rotolo', 'PZ', 6, 'Ufficio Facile', 2], ['Scaffale espositore a muro', 'PZ', 240, 'Arredo Negozi', .5], ['Faretto LED a binario', 'PZ', 39, 'Illuminazione Pro', 1],
        ['Rotoli cassa termici (conf. 10)', 'CONF', 9, 'Ufficio Facile', 1], ['Volantini promozionali (1000 pz)', 'PZ', 49, 'Tipografia Rapida', 1], ['Spese di trasporto corriere', 'PZ', 9.9, 'Corriere Espresso', 3]],
      fissi: [['Canone di locazione negozio', 'Immobiliare Sabauda', 2300], ['Bolletta energia elettrica', 'Energia Più S.p.A.', 310], ['Canone software di cassa', 'Cassa Facile S.r.l.', 39]],
      forn: ['Moda Ingrosso Milano', 'Pelletterie Toscane', 'Packaging Torino', 'Arredo Negozi', 'Tipografia Rapida'],
      amz: [['Gruccia in velluto (50 pezzi)', 'Arredo negozio', 24.9], ['Lettore codici a barre USB', 'Informatica', 39.9], ['Carta da pacchi kraft', 'Imballaggio', 14.5], ['Specchio da camerino', 'Arredo negozio', 79]], gls: true },
    estetica: { az: 'Salone Demo S.r.l.', citta: 'Milano (MI)',
      sedi: [['Salone Centro', 'Milano', 'MI', [9.19, 45.464]], ['Beauty Lab Navigli', 'Milano', 'MI', [9.172, 45.451]], ['Barber Shop Isola', 'Milano', 'MI', [9.19, 45.488]]],
      art: [['Tinta in crema professionale 100 ml', 'PZ', 6.5, 'Cosmetica Professionale', 6], ['Ossigeno 20 volumi 1 L', 'PZ', 4.2, 'Cosmetica Professionale', 3], ['Shampoo professionale 1 L', 'PZ', 14, 'Cosmetica Professionale', 3],
        ['Maschera ristrutturante 500 ml', 'PZ', 18, 'Cosmetica Professionale', 2], ['Cera depilatoria liposolubile 800 ml', 'PZ', 9, 'Estetica Forniture', 2], ['Smalto semipermanente', 'PZ', 6.5, 'Nail Supply', 3],
        ['Asciugamani monouso (conf. 100)', 'CONF', 12, 'Estetica Forniture', 3], ['Carta per lettino in rotolo', 'PZ', 6, 'Estetica Forniture', 2], ['Guanti in nitrile (conf. 100)', 'CONF', 8.9, 'Estetica Forniture', 2],
        ['Phon professionale 2000 W', 'PZ', 129, 'Attrezzature Saloni', .4], ['Forbici da taglio 6"', 'PZ', 89, 'Attrezzature Saloni', .4], ['Prodotti per la rivendita (kit)', 'PZ', 140, 'Cosmetica Professionale', 1],
        ['Lavanderia asciugamani e kimono', 'PZ', 45, 'Lavanderia Milano', 2]],
      fissi: [['Canone di locazione salone', 'Immobiliare Meneghina', 1900], ['Bolletta energia elettrica', 'Energia Più S.p.A.', 290], ['Abbonamento app prenotazioni', 'Treatwell', 79]],
      forn: ['Cosmetica Professionale', 'Estetica Forniture', 'Nail Supply', 'Attrezzature Saloni', 'Lavanderia Milano'],
      amz: [['Organizer per spazzole', 'Arredo salone', 19.9], ['Lampada LED per unghie', 'Attrezzature', 49.9], ['Diffusore di essenze', 'Accoglienza', 29.9], ['Cuffie usa e getta (100)', 'Monouso', 9.9]] },
    hotel: { az: 'Hotel Demo S.r.l.', citta: 'Venezia (VE)',
      sedi: [['Hotel in Centro', 'Venezia', 'VE', [12.336, 45.438]], ['B&B Laguna', 'Venezia', 'VE', [12.325, 45.43]], ['Casa vacanze Lido', 'Venezia Lido', 'VE', [12.365, 45.41]]],
      art: [['Cornetti surgelati (conf. 60)', 'CONF', 24, 'Forniture Alberghiere Veneto', 4], ['Caffè in grani 1 kg', 'KG', 21, 'Torrefazione Veneziana', 3], ['Latte UHT (cartone 12)', 'CONF', 12, 'Forniture Alberghiere Veneto', 3],
        ['Marmellata monoporzione (conf. 100)', 'CONF', 18, 'Forniture Alberghiere Veneto', 2], ['Yogurt monoporzione (24)', 'CONF', 11, 'Forniture Alberghiere Veneto', 2], ['Kit cortesia (100 pezzi)', 'CONF', 45, 'Amenities Italia', 3],
        ['Lenzuola matrimoniali', 'PZ', 18, 'Tessile Alberghiero', 1], ['Set asciugamani', 'PZ', 12, 'Tessile Alberghiero', 1], ['Noleggio biancheria (mese)', 'PZ', 380, 'Lavanderia Industriale Veneta', 2],
        ['Detergente bagno 5 L', 'PZ', 11, 'Igiene Professionale', 2], ['Materasso matrimoniale', 'PZ', 320, 'Arredi Hotel', .3], ['Manutenzione climatizzatori', 'PZ', 160, 'Clima Service', .5]],
      fissi: [['Commissioni Booking.com', 'Booking.com', 1150], ['Bolletta energia elettrica', 'Energia Più S.p.A.', 870], ['Canone di locazione immobile', 'Immobiliare Serenissima', 3200]],
      forn: ['Forniture Alberghiere Veneto', 'Amenities Italia', 'Tessile Alberghiero', 'Lavanderia Industriale Veneta', 'Booking.com'],
      amz: [['Asciugacapelli da parete', 'Arredo camere', 34.9], ['Bollitore elettrico', 'Arredo camere', 22.9], ['Ciabatte monouso (50)', 'Cortesia', 19.9], ['Cassaforte da camera', 'Arredo camere', 69]] },
    altro: { az: 'Azienda Demo S.r.l.', citta: 'Milano (MI)',
      sedi: [['Sede di Milano', 'Milano', 'MI', [9.19, 45.464]], ['Ufficio di Roma', 'Roma', 'RM', [12.496, 41.902]], ['Ufficio di Bologna', 'Bologna', 'BO', [11.342, 44.494]]],
      art: [['Risma carta A4 80 g', 'PZ', 4.2, 'Ufficio Facile', 5], ['Toner stampante nero', 'PZ', 69, 'Ufficio Facile', 2], ['Notebook 15" per ufficio', 'PZ', 690, 'Informatica Pro', .3],
        ['Sedia ergonomica da ufficio', 'PZ', 149, 'Arredo Ufficio', .4], ['Servizio pulizie mensile', 'PZ', 380, 'Pulizie Professionali', 2], ['Canone software gestionale', 'PZ', 49, 'Software House Demo', 2],
        ['Consulenza commercialista', 'PZ', 450, 'Studio Commerciale Demo', 1], ['Spese di trasporto corriere', 'PZ', 12, 'Corriere Espresso', 2], ['Materiale di consumo vario', 'PZ', 35, 'Cash & Carry', 2]],
      fissi: [['Canone di locazione ufficio', 'Immobiliare Demo', 1600], ['Bolletta energia elettrica', 'Energia Più S.p.A.', 240], ['Telefonia e internet', 'Telefonia Business', 89]],
      forn: ['Ufficio Facile', 'Informatica Pro', 'Pulizie Professionali', 'Studio Commerciale Demo', 'Energia Più S.p.A.'],
      amz: [['Mouse wireless', 'Informatica', 14.9], ['Cavo USB-C 2 m', 'Informatica', 11.9], ['Lampada da scrivania LED', 'Ufficio', 29.9], ['Kit pronto soccorso', 'Sicurezza', 26.5]] }
  };
  function sector(id) {
    seed = 20260426 + id.length * 7919;
    const P = PROF[id], S = window.CDC_SETTORI && window.CDC_SETTORI.get(id), RU = (S && S.cat) || [];
    const cat = d => { const D = ' ' + String(d).toUpperCase() + ' '; for (const [c, k] of RU) if (k.some(x => D.includes(x))) return c; return 'Altro'; };
    const pre = id.slice(0, 2).toUpperCase();
    const SEDI = P.sedi.map(([n, citta, prov, geo], i) => ({ cod: `${pre}0${i + 1}`, n, tipo: S ? S.sede[0] : 'Sede', ind: `${citta} (${prov})`, key: n.toUpperCase(), loc: `${citta.toUpperCase()}|`, citta, prov, geo }))
      .concat([{ cod: 'CDC99', n: 'Da attribuire', tipo: 'Sospeso', ind: 'Sede non indicata', key: '', loc: '', citta: '', prov: '', geo: null }]);
    const REAL = SEDI.slice(0, -1), CENTRI = REAL.map(s => s.n.toUpperCase()), W = [5, 3, 2].slice(0, REAL.length);
    const wPick = (arr, w) => { const t = w.reduce((a, b) => a + b, 0); let r = rnd() * t; for (let i = 0; i < arr.length; i++) { r -= w[i]; if (r <= 0) return arr[i]; } return arr[arr.length - 1]; };
    const movimenti = [], tW = P.art.reduce((s, a) => s + (a[4] || 1), 0);
    for (let i = 0; i < 340; i++) {
      let r = rnd() * tW, a = P.art[0]; for (const x of P.art) { r -= x[4] || 1; if (r <= 0) { a = x; break; } }
      const d = daysAgo(int(0, 330)), big = a[2] > 100, q = big ? 1 : a[1] === 'KG' ? int(2, 25) : int(1, 12);
      movimenti.push({ id: 'dm' + uid(), data: ds(d), ndoc: 'DDT ' + int(1000, 9999), codice: 'ART' + int(10000, 99999), descrizione: a[0].toUpperCase(), um: a[1], quantita: q, prezzo: r2(a[2] * (0.92 + rnd() * 0.16)), iva: 0.22,
        centro: wPick(CENTRI, W), societa: '', categoria: cat(a[0]), fornitore: a[3], note: '', creato: ds(d) });
    }
    // spese fisse mese per mese (affitto, bollette, consulenze) su ogni sede
    for (let m = 10; m >= 0; m--) {
      const base = new Date(now.getFullYear(), now.getMonth() - m, 1);
      P.fissi.forEach(([t, f, v], k) => REAL.forEach((s, j) => { if (j > 0 && k > 1 && rnd() < .4) return; const d = new Date(base); d.setDate(int(2, 26)); if (d > now) return;
        const val = r2(v * (j ? .6 : 1) * (0.9 + rnd() * 0.2));
        movimenti.push({ id: 'dm' + uid(), data: ds(d), ndoc: 'FT ' + int(100, 999), codice: '', descrizione: t.toUpperCase(), um: 'PZ', quantita: 1, prezzo: val, iva: 0.22, centro: CENTRI[j], societa: '', categoria: cat(t), fornitore: f, note: '', creato: ds(d) }); }));
    }
    // fatture dei fornitori principali
    const fatture = [], CATS = [...new Set(movimenti.map(r => r.categoria))];
    for (let i = 0; i < 40; i++) {
      const d = daysAgo(int(5, 300)), imp = r2(120 + rnd() * 2600), sc = new Date(d); sc.setDate(sc.getDate() + pick([30, 60, 90]));
      const paid = ds(sc) < ds(now) ? rnd() < 0.85 : rnd() < 0.2;
      fatture.push({ id: 'df' + uid(), fornitore: pick(P.forn), numero: `${int(1, 999)}/${d.getFullYear()}`, data: ds(d), scadenza: ds(sc), imponibile: imp, imposta: r2(imp * 0.22), totale: r2(imp * 1.22), centro: wPick(CENTRI, W),
        categoria: pick(CATS), stato: paid ? 'pagata' : 'da pagare', pagata: paid ? ds(sc) : '', ddt: '', righe: '', pdf: '', note: '', creato: ds(d) });
    }
    // carburante dei mezzi (lavanderia, edilizia)
    const gasolio = [];
    (P.mezzi || []).forEach(([targa, mezzo, op], k) => { let km = 30000 + k * 21000;
      for (let d = 180; d > 0; d -= int(6, 11)) { const lt = r2(35 + rnd() * 35); km += Math.round(lt * (9 + rnd() * 4));
        gasolio.push({ id: 'dq' + uid(), data: ds(daysAgo(d)), targa, km, litri: lt, prezzo: r2(1.68 + rnd() * 0.14), proprietario: 'Aziendale', operatore: op, centro: CENTRI[k % CENTRI.length], uso: mezzo, note: '' }); } });
    // ordini Amazon (negozio, estetica, hotel, ufficio)
    const amazon = [], amazonart = [];
    if (P.amz) for (let i = 0; i < 26; i++) {
      const d = daysAgo(int(2, 320)), oid = `40${int(1, 9)}-${int(1000000, 9999999)}-${int(1000000, 9999999)}`, s = wPick(REAL, W); let sub = 0, pz = 0; const n = int(1, 3);
      for (let k = 0; k < n; k++) { const a = pick(P.amz), q = int(1, 3); sub += a[2] * q; pz += q;
        amazonart.push({ id: oid + '-' + k, ordine: oid, data: ds(d), quantita: q, descrizione: a[0], prezzo: a[2], importo: r2(a[2] * q), venditore: 'Amazon', condizione: 'Nuovo', spedito: ds(d), localita: s.citta.toUpperCase(), categoria: a[1] }); }
      const totale = r2(sub), imp = r2(totale / 1.22);
      amazon.push({ id: oid, data: ds(d), articoli: n, pezzi: pz, venditore: 'Amazon', destinatario: P.az, localita: s.citta.toUpperCase(), pagamento: 'Carta aziendale', subtotale: totale, spedizione: 0, sconti: 0, imponibile: imp, iva: r2(totale - imp), totale, ivaTipo: 'fattura', cdc: s.cod, note: '', pdf: '' });
    }
    // spedizioni ai clienti del negozio online
    const gls = [];
    if (P.gls) { const DEST = [['Cliente Rossi', 'Milano', 'MI', 'Lombardia'], ['Cliente Bianchi', 'Roma', 'RM', 'Lazio'], ['Cliente Verdi', 'Napoli', 'NA', 'Campania'], ['Cliente Neri', 'Firenze', 'FI', 'Toscana'], ['Cliente Gallo', 'Bari', 'BA', 'Puglia'], ['Cliente Riva', 'Verona', 'VR', 'Veneto']];
      for (let m = 5; m >= 0; m--) { const base = new Date(now.getFullYear(), now.getMonth() - m, 1), mese = `${base.getFullYear()}-${pad(base.getMonth() + 1)}`;
        for (let i = 0, n = int(25, 45); i < n; i++) { const dd = pick(DEST), colli = 1, kg = r2(.5 + rnd() * 3), nolo = r2(5.9 + kg * .4), fuel = r2(nolo * .12), day = new Date(base); day.setDate(int(1, 27)); if (day > now) continue;
          gls.push({ id: 'dg' + uid(), mese, data: ds(day), contratto: '1234', nsped: String(int(600000000, 699999999)), rif: 'WEB' + int(1000, 9999), destinatario: dd[0], citta: dd[1], prov: dd[2], regione: dd[3], cdc: REAL[REAL.length - 1].cod, cdcNome: CENTRI[CENTRI.length - 1], tipologia: 'Nazionale', colli, kgReali: kg, kgTass: Math.ceil(kg), nolo, fuel, suppl: 0, totale: r2(nolo + fuel), gg: int(1, 3), riaddebito: rnd() < .5 ? 'Cliente' : '', note: '' }); } } }
    const cdcLink = {}; REAL.forEach((s, i) => { cdcLink['att|' + CENTRI[i]] = s.cod; cdcLink['gas|' + CENTRI[i]] = s.cod; });
    const budget = {}; CENTRI.forEach((c, i) => { const v = movimenti.filter(r => r.centro === c).reduce((t, r) => t + r.quantita * r.prezzo, 0); budget[c] = Math.round(v * (i % 2 ? 1.15 : 0.95) / 500) * 500; });
    const config = { azienda: { nome: P.az, citta: P.citta }, centri: CENTRI, lyCdc: SEDI, ppRic: 2, budget, cdcLink,
      pvClienti: [{ id: 'c1', nome: 'Cliente Rossi S.r.l.', ref: 'Mario Rossi', email: 'info@rossi.example', tel: '02 1234567', ind: 'Via Milano 1, Milano', ric: '' },
        { id: 'c2', nome: 'Studio Bianchi', ref: 'Giulia Bianchi', email: 'giulia@bianchi.example', tel: '011 7654321', ind: 'Corso Torino 5, Torino', ric: 60 }] };
    const y = now.getFullYear();
    const pv = (pid, num, cli, stato, giorni, righe) => { config['pv:' + pid] = { id: pid, num, data: ds(daysAgo(giorni)), valid: 30, stato, cliente: { nome: cli.nome, ref: cli.ref, email: cli.email, tel: cli.tel, ind: cli.ind }, righe, sconto: 0, note: 'Consegna in 10 giorni lavorativi.', iva: 22, agg: daysAgo(giorni).toISOString() }; };
    pv('d1', `P${y}-002`, config.pvClienti[0], 'inviato', 4, [{ sup: 'payper', it: '000001', n: 'MIAMI+', cl: 'T-SHIRT', c: '00000', cn: 'BIANCO', sz: ['S', 'M', 'L'], q: { S: 4, M: 8, L: 6 }, p: 6.9, man: true, sc: 0 }]);
    pv('d2', `P${y}-001`, config.pvClienti[1], 'accettato', 15, [{ sup: 'payper', it: '000001', n: 'MIAMI+', cl: 'T-SHIRT', c: '01000', cn: 'GIALLO', sz: ['M', 'L'], q: { M: 10, L: 10 }, p: 6.9, man: true, sc: 5 }]);
    return { movimenti, gls, gasolio, fatture, lyreco: [], lyfatture: [], amazon, amazonart, pdf: [], config, ai: false, aik: { gemini: false }, aiFirst: 'gemini', v: 'demo' };
  }
  /* v98: clienti, magazzino, DDT e fatture di prova (uguali per tutte le attività, con gli articoli della demo) */
  function addSales(D, id) {
    seed = 777; const ids = () => 'dx' + uid();
    const CL = [['Rossi Costruzioni S.r.l.', 'Via Appia Nuova 120', '00179', 'Roma', 'RM'], ['Bianchi & Figli S.n.c.', 'Corso Italia 45', '20122', 'Milano', 'MI'], ['Verdi Servizi S.r.l.', 'Via Emilia 300', '40138', 'Bologna', 'BO'],
      ['Hotel Bellavista S.r.l.', 'Lungomare Colombo 12', '84129', 'Salerno', 'SA'], ['Esposito Group S.p.A.', 'Via Toledo 210', '80134', 'Napoli', 'NA'], ['Studio Neri Associati', 'Via dei Mille 8', '10123', 'Torino', 'TO']];
    const SDI = ['M5UXCR1', 'KRRH6B9', 'T9K4ZHO', 'SUBM70N', 'W7YVJK9', '0000000'];
    const clienti = CL.map(([nome, ind, cap, citta, prov], i) => ({ id: 'dc' + (i + 1), nome, piva: String(10000000000 + int(1, 89999999999)).slice(0, 11), cf: '', indirizzo: ind, cap, citta, prov, nazione: 'IT', sdi: SDI[i], pec: i === 5 ? 'studioneri@pec.example' : '', email: `amministrazione@${nome.split(' ')[0].toLowerCase()}.example`, tel: '0' + int(2, 9) + ' ' + int(1000000, 9999999), pagamento: ['Bonifico 30 gg d.f.f.m.', 'Ri.Ba. 60 gg d.f.f.m.', 'Bonifico vista fattura', 'Bonifico 60 gg d.f.f.m.', 'Ri.Ba. 30 gg d.f.f.m.', 'Rimessa diretta'][i], note: '', creato: ds(daysAgo(200)) }));
    const seen = new Map(); D.movimenti.forEach(r => { if (!seen.has(r.descrizione) && r.prezzo > 0 && r.prezzo < 400 && r.codice) seen.set(r.descrizione, r); });
    const articoli = [...seen.values()].slice(0, 14).map((r, i) => ({ id: 'da' + (i + 1), codice: 'A' + String(100 + i), descrizione: r.descrizione.charAt(0) + r.descrizione.slice(1).toLowerCase(), um: r.um || 'PZ', categoria: r.categoria, fornitore: r.fornitore, costo: r2(r.prezzo), prezzo: r2(r.prezzo * 1.5), iva: 22, scorta: int(5, 20), barcode: '', note: '', creato: ds(daysAgo(120)) }));
    const magmov = [], ddt = [], vendite = [];
    articoli.forEach((a, i) => { magmov.push({ id: ids(), data: ds(daysAgo(110)), articolo: a.id, tipo: 'carico', quantita: int(30, 160), costo: a.costo, causale: 'Giacenza iniziale', doc: '', note: '', creato: ds(daysAgo(110)) }); if (i % 3 === 0) magmov.push({ id: ids(), data: ds(daysAgo(int(10, 40))), articolo: a.id, tipo: 'carico', quantita: int(20, 60), costo: a.costo, causale: 'Acquisto da fornitore', doc: '', note: '', creato: ds(daysAgo(20)) }); });
    const y = now.getFullYear(), dates = Array.from({ length: 18 }, () => int(1, 62)).sort((a, b) => b - a);
    dates.forEach((g, k) => {
      const d = daysAgo(g); if (d.getFullYear() !== y) return;
      const c = clienti[int(0, 4)], righe = [];
      for (let j = 0, n = int(2, 4); j < n; j++) { const a = pick(articoli); if (righe.some(l => l.art === a.id)) continue; righe.push({ art: a.id, c: a.codice, d: a.descrizione, um: a.um, q: int(1, 12), p: a.prezzo, sc: rnd() < .2 ? 5 : 0, iva: 22 }); }
      const dd = { id: 'dd' + (k + 1), numero: String(ddt.filter(x => x.anno === String(y)).length + 1), anno: String(y), data: ds(d), cliente: c.id, destinazione: '', causale: 'Vendita', trasporto: pick(['Mittente', 'Mittente', 'Vettore']), vettore: '', colli: int(1, 6), peso: int(5, 120), aspetto: pick(['Scatole', 'Pallet']), prezzi: '', righe: JSON.stringify(righe), fattura: '', note: '', creato: ds(d) };
      ddt.push(dd); righe.forEach(l => magmov.push({ id: ids(), data: dd.data, articolo: l.art, tipo: 'scarico', quantita: -l.q, costo: 0, causale: `DDT ${dd.numero}/${dd.anno}`, doc: dd.id, note: '', creato: dd.data }));
    });
    // il mese scorso è già fatturato (fatture di fine mese)
    const cur = ds(now).slice(0, 7), tot = R => { const by = {}; R.filter(l => !l.h).forEach(l => { const t = r2(l.q * l.p * (1 - (l.sc || 0) / 100)); by[l.iva] = r2((by[l.iva] || 0) + t); }); let imp = 0, iva = 0; Object.entries(by).forEach(([a, v]) => { imp += v; iva += r2(v * a / 100); }); return [r2(imp), r2(iva)]; };
    const prev = [...new Set(ddt.map(d => d.data.slice(0, 7)).filter(m => m < cur))].sort();
    let nf = 0;
    prev.forEach(m => { const [yy, mm] = m.split('-').map(Number), last = ds(new Date(yy, mm, 0));
      clienti.forEach(c => { const L = ddt.filter(d => d.cliente === c.id && d.data.slice(0, 7) === m); if (!L.length) return;
        const righe = L.flatMap(d => [{ h: 1, d: `DDT n. ${d.numero}/${d.anno} del ${d.data.split('-').reverse().join('/')}`, ddt: d.id }, ...JSON.parse(d.righe)]), [imp, iva] = tot(righe);
        const sc = new Date(yy, mm, 0); sc.setDate(sc.getDate() + 30); sc.setMonth(sc.getMonth() + 1, 0);
        const f = { id: 'dv' + (++nf), numero: String(nf), anno: String(yy), data: last, tipo: 'TD24', cliente: c.id, ddt: JSON.stringify(L.map(d => d.id)), righe: JSON.stringify(righe), imponibile: imp, imposta: iva, totale: r2(imp + iva), pagamento: c.pagamento, scadenza: ds(sc), stato: rnd() < .5 ? 'pagata' : 'emessa', pagata: '', note: '', creato: last };
        if (f.stato === 'pagata') f.pagata = last; vendite.push(f); L.forEach(d => { d.fattura = f.id; }); }); });
    Object.assign(D.config.azienda = D.config.azienda || {}, { piva: '01234567890', cf: '01234567890', indirizzo: 'Via Roma 10', cap: '00100', regime: 'RF01', iban: 'IT60X0542811101000000123456', email: 'info@azienda-demo.example', tel: '06 1234567' });
    // v99: incassi giornalieri per sede, in modo che i ricavi superino i costi del 15–35% (utile realistico)
    const S = window.CDC_SETTORI && window.CDC_SETTORI.get(id || 'veicoli'), ivaI = (S && S.ivaInc) || 22, CEN = (D.config.centri || []).slice(0, 5), WS = [5, 3, 2, 2, 1].slice(0, CEN.length);
    const cost = {}, addC = (d, v) => { const m = String(d).slice(0, 7); cost[m] = (cost[m] || 0) + v; };
    D.movimenti.forEach(r => addC(r.data, r.quantita * r.prezzo)); D.gasolio.forEach(r => addC(r.data, r.litri * r.prezzo)); D.amazon.forEach(o => addC(o.data, o.imponibile)); D.lyreco.forEach(r => addC(r.data, r.importo)); D.gls.forEach(r => addC(r.data, r.totale)); if (id && id !== 'veicoli') D.fatture.forEach(f => addC(f.data, f.imponibile));
    const fvM = {}; vendite.forEach(f => { fvM[f.data.slice(0, 7)] = (fvM[f.data.slice(0, 7)] || 0) + f.imponibile; });
    const incassi = [];
    Object.keys(cost).sort().forEach(m => {
      const [yy, mm] = m.split('-').map(Number), last = Math.min(new Date(yy, mm, 0).getDate(), m === ds(now).slice(0, 7) ? now.getDate() : 31);
      const target = Math.max(0, cost[m] * (1.15 + rnd() * .2) - (fvM[m] || 0)) * (1 + ivaI / 100); if (!target || !CEN.length) return;
      const days = []; for (let g = 1; g <= last; g++) { const wd = new Date(yy, mm - 1, g).getDay(); if (wd !== 0 || rnd() < .4) days.push([g, wd === 5 || wd === 6 ? 1.5 : 1]); }
      const wT = days.reduce((a, d) => a + d[1], 0) * WS.reduce((a, b) => a + b, 0);
      days.forEach(([g, wd]) => CEN.forEach((c, j) => { const v = r2(target * wd * WS[j] / wT * (.8 + rnd() * .4)); if (v < 1) return; const pos = r2(v * (.55 + rnd() * .25)), dd = ds(new Date(yy, mm - 1, g));
        incassi.push({ id: 'di' + uid(), data: dd, sede: c, importo: v, contanti: r2(v - pos), pos, altro: 0, iva: ivaI, tipo: 'corrispettivi', note: '', creato: dd }); }));
    });
    // v101: anagrafica fornitori dai nomi usati negli acquisti
    const FN = [...new Set([...D.movimenti.map(r => r.fornitore), ...D.fatture.map(f => f.fornitore)].filter(Boolean))].slice(0, 10);
    const fornitori = FN.map((nome, i) => ({ id: 'dfo' + (i + 1), nome, piva: String(10000000000 + int(1, 89999999999)).slice(0, 11), cf: '', indirizzo: `Via ${pick(['Roma', 'Garibaldi', 'Mazzini', 'dell\'Industria', 'Tiburtina'])} ${int(1, 200)}`, cap: String(int(10, 98)) + '100', citta: pick(['Roma', 'Milano', 'Napoli', 'Bologna', 'Torino', 'Firenze']), prov: '', email: `ordini@${nome.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '')}.example`, pec: '', tel: '0' + int(2, 9) + ' ' + int(1000000, 9999999), referente: pick(['Marco', 'Giulia', 'Paolo', 'Sara', 'Luca']) + ' ' + pick(['Rossi', 'Bianchi', 'Verdi', 'Neri']), categoria: (D.movimenti.find(r => r.fornitore === nome) || {}).categoria || '', pagamento: pick(['Bonifico 30 gg d.f.f.m.', 'Ri.Ba. 60 gg d.f.f.m.', 'Bonifico vista fattura']), iban: '', note: '', creato: ds(daysAgo(300)) }));
    addStaff(D);
    return Object.assign(D, { clienti, articoli, magmov, ddt, vendite, incassi, fornitori });
  }
  /* v127: dipendenti, timbrature degli ultimi due mesi e richieste di ferie e permessi */
  function addStaff(D) {
    seed = 4242;
    const CEN = (D.config.centri || ['Sede']).slice(0, 3), y = now.getFullYear();
    const P = [['Marco', 'Neri', 'Autista e montatore', 'Logistica', 0, 'Tempo indeterminato', 40, 17.8], ['Sara', 'Greco', 'Impiegata amministrativa', 'Ufficio', 0, 'Tempo indeterminato', 40, 19.5], ['Luca', 'Gallo', 'Magazziniere', 'Magazzino', 1, 'Tempo indeterminato', 40, 16.9],
      ['Paolo', 'Riva', 'Responsabile operativo', 'Operativo', 0, 'Tempo indeterminato', 40, 24.3], ['Andrea', 'Fontana', 'Operaio', 'Produzione', 1, 'Tempo determinato', 40, 16.2], ['Giulia', 'Conti', 'Addetta vendite', 'Commerciale', 2 % CEN.length, 'Part-time', 24, 15.4], ['Elena', 'Marino', 'Apprendista', 'Produzione', 0, 'Apprendistato', 40, 12.6]];
    const dipendenti = P.map(([nome, cognome, mansione, reparto, c, contratto, ore, costo], i) => {
      const ass = ds(daysAgo(i === 6 ? 140 : int(500, 3200)));
      return { id: 'dpd' + (i + 1), nome, cognome, cf: '', nascita: `${int(1968, 2003)}-${pad(int(1, 12))}-${pad(int(1, 28))}`, email: `${nome.toLowerCase()}.${cognome.toLowerCase()}@azienda-demo.example`, tel: `3${int(20, 49)} ${int(100, 999)} ${int(1000, 9999)}`, indirizzo: '', mansione, reparto, sede: CEN[c % CEN.length] || '', contratto, livello: pick(['CCNL Commercio 4°', 'CCNL Metalmeccanico C2', 'CCNL Commercio 5°', 'CCNL Metalmeccanico D1']), assunzione: ass,
        fine: contratto === 'Tempo determinato' ? ds(daysAgo(-int(12, 40))) : contratto === 'Apprendistato' ? ds(daysAgo(-560)) : '', ore, costo, ferie: 26, permessi: 32, iban: '', stato: 'attivo', account: '', visita: ds(daysAgo(-int(-20, 300))), corso: ds(daysAgo(-int(15, 700))), colore: '', note: '', creato: ass };
    });
    const presenze = [], assenze = [], t = (h, m) => `${pad(h)}:${pad(Math.max(0, Math.min(59, m)))}:${pad(int(0, 59))}`;
    const off = new Set(); // giorni di assenza approvata
    const addA = (i, tipo, dal, al, stato, extra = {}) => { const a = { id: 'dsa' + uid(), dip: dipendenti[i].id, tipo, dal, al, ore: '', motivo: '', stato, risposta: '', chi: '', creato: ds(daysAgo(int(2, 20))) + 'T09:00:00.000Z', deciso: stato === 'attesa' || stato === 'comunicata' ? '' : ds(daysAgo(1)) + 'T10:00:00.000Z', ...extra }; assenze.push(a); if (stato === 'approvata' && tipo !== 'permesso' || stato === 'comunicata') for (let d = new Date(dal); ds(d) <= al; d.setDate(d.getDate() + 1)) off.add(a.dip + ds(d)); };
    const wdBack = (n, len) => { let d = daysAgo(n); while ([0, 6].includes(d.getDay())) d.setDate(d.getDate() - 1); const s0 = ds(d); let e = new Date(d), k = 1; while (k < len) { e.setDate(e.getDate() + 1); if (![0, 6].includes(e.getDay())) k++; } return [s0, ds(e)]; };
    let r = wdBack(32, 5); addA(1, 'ferie', r[0], r[1], 'approvata', { motivo: 'Vacanza' });
    r = wdBack(9, 2); addA(4, 'malattia', r[0], r[1], 'comunicata', { motivo: 'Certificato n. 2981' });
    r = wdBack(18, 1); addA(2, 'permesso', r[0], r[0], 'approvata', { ore: 3, motivo: 'Visita medica' });
    r = wdBack(-20, 5); addA(0, 'ferie', r[0], r[1], 'attesa', { motivo: 'Matrimonio di mio fratello' });
    r = wdBack(-6, 1); addA(5, 'permesso', r[0], r[0], 'attesa', { ore: 2, motivo: 'Colloquio a scuola' });
    r = wdBack(-35, 3); addA(3, 'ferie', r[0], r[1], 'approvata');
    r = wdBack(26, 1); addA(6, 'ferie', r[0], r[0], 'rifiutata', { risposta: 'Giornata di inventario, scegli un altro giorno' });
    const nowM = now.getHours() * 60 + now.getMinutes();
    for (let g = 60; g >= 0; g--) {
      const d = daysAgo(g), day = ds(d); if ([0, 6].includes(d.getDay())) continue;
      dipendenti.forEach((p, i) => {
        if (off.has(p.id + day)) return;
        const pt = p.ore < 30, st = (pt ? 14 * 60 : 8 * 60) + int(-12, 14) + (i === 3 ? -20 : 0), pa = st + (pt ? 0 : 240 + int(-10, 15)), re = pa + int(55, 65), en = pt ? st + 4 * 60 + int(-5, 20) : re + 240 + int(-10, 45);
        const seq = pt ? [['in', st], ['out', en]] : [['in', st], ['pausa', pa], ['rientro', re], ['out', en]];
        seq.forEach(([tipo, m], k) => { if (g === 0 && m > nowM) return; if (g === 3 && i === 2 && tipo === 'out') return; presenze.push({ id: 'dpz' + uid(), dip: p.id, data: day, ora: t(Math.floor(m / 60), m % 60), tipo, sede: p.sede, fonte: g === 12 && i === 1 && k === 0 ? 'manuale' : 'app', luogo: '', disp: '', nota: g === 12 && i === 1 && k === 0 ? 'Dimenticata la timbratura' : '', chi: '', creato: day }); });
      });
    }
    // oggi: Elena non ha ancora timbrato
    const td = ds(now); for (let k = presenze.length - 1; k >= 0; k--) if (presenze[k].data === td && presenze[k].dip === 'dpd7') presenze.splice(k, 1);
    D.config.pzSet = { giorni: 5, geo: false };
    // nota spese: carte, contanti, spese e un estratto conto già in parte riconciliato
    const carte = [
      { id: 'dca1', nome: 'Visa aziendale', tipo: 'credito', ultime4: '4821', banca: 'Banca demo', titolare: 'Azienda demo', dip: 'dpd1', plafond: 1500, centro: '', stato: 'attiva', scadenza: '09/28', colore: 'blu', note: '', creato: ds(daysAgo(120)) },
      { id: 'dca2', nome: 'Carta carburante', tipo: 'prepagata', ultime4: '0377', banca: 'Banca demo', titolare: 'Azienda demo', dip: 'dpd2', plafond: 800, centro: '', stato: 'attiva', scadenza: '03/27', colore: 'arancio', note: '', creato: ds(daysAgo(120)) },
      { id: 'dca3', nome: 'Mastercard riserva', tipo: 'debito', ultime4: '9150', banca: 'Banca demo', titolare: 'Azienda demo', dip: '', plafond: 0, centro: '', stato: 'attiva', scadenza: '12/27', colore: 'nero', note: '', creato: ds(daysAgo(90)) }];
    const fondi = [
      { id: 'dfo1', data: ds(daysAgo(40)), dip: 'dpd1', importo: 300, tipo: 'consegna', note: 'Cassa piccole spese', chi: '', creato: ds(daysAgo(40)) },
      { id: 'dfo2', data: ds(daysAgo(12)), dip: 'dpd1', importo: 200, tipo: 'consegna', note: 'Trasferta', chi: '', creato: ds(daysAgo(12)) },
      { id: 'dfo3', data: ds(daysAgo(25)), dip: 'dpd3', importo: 150, tipo: 'consegna', note: 'Anticipo materiali', chi: '', creato: ds(daysAgo(25)) }];
    const ES = [['Distributore Q8', 'Carburante', 58.4], ['Ristorante Da Gino', 'Pasti e trasferte', 42], ['Ferramenta Rossi', 'Materiale e attrezzatura', 36.9], ['Autostrade per l\'Italia', 'Pedaggi e parcheggi', 14.2], ['Cartoleria Centrale', 'Cancelleria e ufficio', 23.5], ['Distributore Eni', 'Carburante', 64.8], ['Bar Stazione', 'Pasti e trasferte', 9.6], ['Brico Center', 'Materiale e attrezzatura', 112.3], ['Parcheggio Centro', 'Pedaggi e parcheggi', 6], ['Officina Verdi', 'Ricambi e manutenzione', 185]];
    const spese = [], estratti = [];
    ES.concat(ES.map(x => [x[0], x[1], Math.round(x[2] * 1.1 * 100) / 100])).forEach((x, k) => {
      const g = 4 + k * 2, d = ds(daysAgo(g)), card = k % 3 === 2 ? 'dca2' : 'dca1', dip = card === 'dca2' ? 'dpd2' : 'dpd1', cash = k % 4 === 3;
      const sp = { id: 'dsp' + k, data: d, dip: cash ? 'dpd1' : dip, importo: x[2], esercente: x[0], categoria: x[1], descrizione: '', centro: '', metodo: cash ? 'contanti' : 'carta', carta: cash ? '' : card, foto: k % 5 === 4 ? '' : 'demo', stato: g < 6 ? 'inviata' : 'approvata', risposta: '', estratto: '', chi: '', creato: d + 'T10:00:00', deciso: g < 6 ? '' : d + 'T16:00:00' };
      spese.push(sp);
      if (!cash && card === 'dca1' && g >= 4) {
        if (k === 6) return; // spesa non presente nell'estratto
        const e = { id: 'des' + k, carta: card, lotto: 'dlt1', data: d, descrizione: x[0].toUpperCase() + ' ' + (1000 + k * 37), importo: x[2], spesa: '', stato: '', note: 'estratto-demo.csv', creato: d };
        if (k % 5 !== 1) { e.spesa = sp.id; e.stato = 'abbinata'; sp.estratto = e.id; }
        estratti.push(e);
      }
    });
    estratti.push({ id: 'desX1', carta: 'dca1', lotto: 'dlt1', data: ds(daysAgo(9)), descrizione: 'AMAZON EU SARL 4471', importo: 89.9, spesa: '', stato: '', note: 'estratto-demo.csv', creato: ds(daysAgo(9)) },
      { id: 'desX2', carta: 'dca1', lotto: 'dlt1', data: ds(daysAgo(15)), descrizione: 'CANONE CARTA', importo: 2.5, spesa: '', stato: 'ignorata', note: 'estratto-demo.csv', creato: ds(daysAgo(15)) });
    Object.assign(D, { carte, fondi, spese, estratti });
    Object.assign(D, { dipendenti, presenze, assenze });
  }
  /* v260: cantieri di prova per l'impresa edile (sopralluoghi, preventivi inviati/accettati, un lavoro in corso) */
  function addCantieri(D) {
    seed = 9090;
    const V = (cat, dsc, um, q, pr, x = {}) => Object.assign({ id: 'dv' + uid(), cat, d: dsc, um, q: String(q), pr: String(pr), sc: '', cs: '', opt: false, on: true, amb: '', var: false, av: 0 }, x);
    const A = (n, l, p, h, ap = []) => ({ id: 'da' + uid(), n, l: String(l).replace('.', ','), p: String(p).replace('.', ','), h: String(h).replace('.', ','), ap: ap.map(([t, w, hh, q]) => ({ id: 'do' + uid(), t, l: String(w).replace('.', ','), h: String(hh).replace('.', ','), q: String(q) })), note: '' });
    const base = { cond: { val: 30, tempi: '20 giorni lavorativi', inizio: '', escl: '- Pratiche edilizie e oneri di legge\n- Fornitura di arredi e sanitari a scelta del cliente\n- Opere non espressamente descritte nel computo', clau: '- Le misure sono state rilevate al sopralluogo e verificate a lavori eseguiti.\n- Eventuali lavori aggiuntivi saranno concordati e quotati a parte.\n- Le opere sono garantite ai sensi di legge.', note: '', foto: true }, gl: [], extra: [], foto: [], crit: '', log: {}, chkN: {} };
    const mk = (id, num, st, giorni, cli, cant, amb, voci, o = {}) => { D.config['cnt:' + id] = Object.assign({ id, num, stato: st, creato: ds(daysAgo(giorni)), agg: ds(daysAgo(Math.max(0, giorni - 1))), cli: Object.assign({ id: '', ref: '', tel: '', email: '', ind: '', cap: '', citta: '', prov: '', piva: '', cf: '' }, cli), cant: Object.assign({ ind: '', citta: '', tipo: 'Ristrutturazione completa', immobile: 'Appartamento', piano: '', asc: '', anno: '', note: '' }, cant), sopr: { data: ds(daysAgo(giorni + 3)), ora: '', tecnico: '', fonte: 'Passaparola', note: '' }, amb, chk: {}, voci, eco: { sg: 0, ut: 0, sic: 0, sicT: 'eur', sc: 0, iva: 10, arr: 0 }, pag: [{ id: 'dg1', d: 'Acconto alla firma', pc: 30 }, { id: 'dg2', d: 'A metà lavori (SAL)', pc: 40 }, { id: 'dg3', d: 'A fine lavori', pc: 30 }] }, JSON.parse(JSON.stringify(base)), o); };
    const bagno = [A('Bagno', 2.8, 2.1, 2.7, [['Porta', 0.7, 2.1, 1], ['Finestra', 0.8, 1.2, 1]])];
    mk('cb1', `CN-${now.getFullYear()}-003`, 'inviato', 6, { nome: 'Famiglia Conti', ref: 'Anna Conti', tel: '333 1234567', email: 'anna.conti@example.com', ind: 'Via dei Gelsi 14', citta: 'Roma', prov: 'RM' }, { ind: 'Via dei Gelsi 14', citta: 'Roma', tipo: 'Bagno', piano: '2°', asc: 'si' }, bagno, [
      V('Demolizioni e rimozioni', 'Demolizione pavimento e massetto', 'mq', 5.9, 28), V('Demolizioni e rimozioni', 'Rimozione rivestimenti (piastrelle)', 'mq', 21.5, 18), V('Demolizioni e rimozioni', 'Smontaggio sanitari e arredo bagno', 'cad', 4, 60), V('Demolizioni e rimozioni', 'Trasporto e conferimento macerie in discarica', 'mc', 3, 70),
      V('Murature e massetti', 'Massetto sabbia e cemento sp. 5 cm', 'mq', 5.9, 24), V('Murature e massetti', 'Impermeabilizzazione bagno con guaina liquida', 'mq', 12, 22), V('Impianto idraulico e termico', 'Rifacimento impianto bagno completo', 'corpo', 1, 1900), V('Impianto idraulico e termico', 'Installazione sanitari (posa)', 'cad', 4, 130),
      V('Pavimenti e rivestimenti', 'Posa pavimento in gres (solo posa)', 'mq', 5.9, 32), V('Pavimenti e rivestimenti', 'Posa rivestimento pareti (solo posa)', 'mq', 21.5, 36), V('Tinteggiature', 'Tinteggiatura pareti e soffitti (2 mani)', 'mq', 8, 9), V('Serramenti e porte', 'Porta interna (fornitura e posa)', 'cad', 1, 380, { opt: true, on: false })], { log: { inviato: ds(daysAgo(6)) } });
    const app = [A('Soggiorno', 5.2, 4.1, 2.8, [['Portafinestra', 1.4, 2.2, 1], ['Porta', 0.9, 2.1, 1]]), A('Cucina', 3.6, 3.1, 2.8, [['Finestra', 1.2, 1.4, 1]]), A('Camera', 4.2, 3.5, 2.8, [['Finestra', 1.4, 1.4, 1]]), A('Bagno', 2.5, 2.2, 2.8, [['Finestra', 0.8, 1.2, 1]]), A('Corridoio', 4.6, 1.2, 2.8)];
    mk('ca1', `CN-${now.getFullYear()}-002`, 'lavori', 30, { nome: 'Rossi Costruzioni S.r.l.', ref: 'Marco Rossi', tel: '06 5551234', email: 'm.rossi@example.com', ind: 'Via Appia Nuova 120', cap: '00179', citta: 'Roma', prov: 'RM', piva: '01234567890' }, { ind: 'Via Tuscolana 88', citta: 'Roma', tipo: 'Ristrutturazione completa', piano: '4°', asc: 'si', anno: '1968' }, app, [
      V('Demolizioni e rimozioni', 'Demolizione tramezzi in laterizio', 'mq', 24, 22, { av: 100 }), V('Demolizioni e rimozioni', 'Rimozione intonaco ammalorato', 'mq', 40, 16, { av: 100 }), V('Murature e massetti', 'Tramezzi in laterizio forato sp. 8 cm', 'mq', 18, 38, { av: 100 }),
      V('Impianto elettrico', 'Punto luce / presa (impianto sottotraccia)', 'cad', 46, 48, { av: 80 }), V('Impianto elettrico', 'Quadro elettrico con protezioni', 'cad', 1, 520, { av: 100 }), V('Impianto idraulico e termico', 'Punto acqua calda e fredda con scarico', 'cad', 6, 210, { av: 60 }),
      V('Intonaci e cartongesso', 'Rasatura e stuccatura pareti', 'mq', 128, 14, { av: 20 }), V('Pavimenti e rivestimenti', 'Posa pavimento in gres (solo posa)', 'mq', 62, 32, { av: 0 }), V('Pavimenti e rivestimenti', 'Battiscopa', 'ml', 58, 7, { av: 0 }), V('Tinteggiature', 'Tinteggiatura pareti e soffitti (2 mani)', 'mq', 190, 9, { av: 0 }), V('Serramenti e porte', 'Porta interna (fornitura e posa)', 'cad', 5, 380, { av: 0 }), V('Varie', 'Pulizia finale di cantiere', 'corpo', 1, 220, { av: 0 })],
      { eco: { sg: 0, ut: 0, sic: 600, sicT: 'eur', sc: 3, iva: 10, arr: 0 }, log: { inviato: ds(daysAgo(26)), accettato: ds(daysAgo(21)), lavori: ds(daysAgo(14)) }, gl: [{ id: 'dgl1', data: ds(daysAgo(13)), t: 'Demolizioni completate, macerie portate in discarica.' }, { id: 'dgl2', data: ds(daysAgo(6)), t: 'Tracce e tubazioni elettriche finite; inizio impianto idraulico.' }] });
    mk('cc1', `CN-${now.getFullYear()}-004`, 'sopralluogo', 1, { nome: 'Studio Dentistico Neri', ref: 'Dott.ssa Neri', tel: '06 5559988', email: 'segreteria@neri.example', ind: 'Viale Europa 31', citta: 'Roma', prov: 'RM' }, { ind: 'Viale Europa 31', citta: 'Roma', tipo: 'Tinteggiatura e cartongesso', immobile: 'Ufficio', piano: 'T', asc: 'no' }, [A('Sala attesa', 4.5, 3.8, 3.0), A('Ambulatorio', 4.0, 3.5, 3.0)], [], { sopr: { data: ds(daysAgo(-1)), ora: '10:00', tecnico: '', fonte: 'Sito web', note: '' } });
    mk('cd1', `CN-${now.getFullYear()}-001`, 'chiuso', 80, { nome: 'Condominio Le Palme', ref: 'Amm. Ferri', tel: '06 5557700', ind: 'Via delle Palme 3', citta: 'Roma', prov: 'RM' }, { ind: 'Via delle Palme 3', citta: 'Roma', tipo: 'Facciata e cappotto', immobile: 'Condominio (parti comuni)' }, [], [V('Opere esterne e facciate', 'Intonaco e tinteggiatura facciata', 'mq', 320, 38, { av: 100 }), V('Opere esterne e facciate', 'Canali di gronda e pluviali', 'ml', 60, 28, { av: 100 })], { eco: { sg: 0, ut: 0, sic: 0, sicT: 'eur', sc: 0, iva: 10, arr: 0 }, log: { inviato: ds(daysAgo(78)), accettato: ds(daysAgo(70)), lavori: ds(daysAgo(60)), chiuso: ds(daysAgo(30)) } });
    mk('ce1', `CN-${now.getFullYear()}-005`, 'perso', 40, { nome: 'Sig. Greco', tel: '338 9876543', ind: 'Via Nomentana 200', citta: 'Roma', prov: 'RM' }, { ind: 'Via Nomentana 200', citta: 'Roma', tipo: 'Cucina' }, [A('Cucina', 3.4, 3.0, 2.7)], [V('Pavimenti e rivestimenti', 'Posa pavimento in gres (solo posa)', 'mq', 10.2, 32), V('Impianto elettrico', 'Punto luce / presa (impianto sottotraccia)', 'cad', 10, 48)], { log: { inviato: ds(daysAgo(36)), perso: ds(daysAgo(20)) } });
    return D;
  }
  window.CDC_DEMO = id => { const D = addSales(PROF[id] ? sector(id) : vei(), PROF[id] ? id : 'veicoli'); return id === 'impresa' ? addCantieri(D) : D; };
})();
