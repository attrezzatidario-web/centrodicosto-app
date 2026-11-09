/* Centro di Costo — Console · «TEST ESTREMO»
   Genera nel browser un'azienda di prova piena di dati (3 anni, ~55.000 righe su tutti i fogli)
   per vedere come si comporta il gestionale con tantissimi dati. Tutto è inventato.
   Il generatore è deterministico (stesso seme = stessi id), così un caricamento interrotto riprende da dov'era
   e rilanciarlo non crea doppioni (upsert per id). */
(() => {
  'use strict';
  function gen(o) {
    const O = Object.assign({ name: 'TEST ESTREMO S.r.l.', short: 'Test Estremo', pre: 'TE', dom: 'test-estremo.example', seed: 990077, days: 1095, sedi: 12, forn: 250, cli: 1200, mov: 12000, fat: 1500, glsm: 35, glsn: [110, 170], mezzi: 16, lyfm: 35, lyfn: [6, 10], am: 1000, art: 2500, mmov: 2500, ddtn: 2000, cb: 500, dest: 400, fimm: 500, inc: 5, pv: 400, srv: 80, pvc: 150 }, o || {});
    let seed = O.seed;
    const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    const pick = a => a[Math.floor(rnd() * a.length)];
    const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
    const r2 = n => Math.round(n * 100) / 100;
    const pad = (n, l = 2) => String(n).padStart(l, '0');
    const now = new Date(); now.setHours(12, 0, 0, 0);
    const ds = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const daysAgo = n => { const d = new Date(now); d.setDate(d.getDate() - n); return d; };
    const DAYS = O.days; // 3 anni
    let nid = 0; const id = p => p + (++nid).toString(36).padStart(5, '0');
    const wPick = (arr, w) => { const t = w.reduce((a, b) => a + b, 0); let r = rnd() * t; for (let i = 0; i < arr.length; i++) { r -= w[i]; if (r <= 0) return arr[i]; } return arr[arr.length - 1]; };

    /* ---------- sedi / centri di costo ---------- */
    const SD = [['Sede Roma', 'Sede', 'Roma', 'RM', '00156', [12.58, 41.92]], ['Magazzino Milano', 'Magazzino', 'Milano', 'MI', '20138', [9.24, 45.45]], ['Piazzale Bologna', 'Piazzale', 'Bologna', 'BO', '40132', [11.3, 44.5]],
      ['Piazzale Torino', 'Piazzale', 'Torino', 'TO', '10143', [7.65, 45.075]], ['Magazzino Napoli', 'Magazzino', 'Napoli', 'NA', '80147', [14.32, 40.86]], ['Piazzale Verona', 'Piazzale', 'Verona', 'VR', '37135', [11.0, 45.41]],
      ['Piazzale Bari', 'Piazzale', 'Bari', 'BA', '70132', [16.84, 41.1]], ['Magazzino Firenze', 'Magazzino', 'Firenze', 'FI', '50127', [11.21, 43.8]], ['Piazzale Padova', 'Piazzale', 'Padova', 'PD', '35127', [11.92, 45.4]],
      ['Piazzale Pescara', 'Piazzale', 'Pescara', 'PE', '65129', [14.2, 42.45]], ['Magazzino Catania', 'Magazzino', 'Catania', 'CT', '95121', [15.07, 37.47]], ['Piazzale Genova', 'Piazzale', 'Genova', 'GE', '16152', [8.87, 44.42]]];
    const SEDI = SD.slice(0, O.sedi).map(([n, tipo, citta, prov, cap, geo], i) => ({ cod: O.pre + pad(i + 1), n, tipo, ind: `Via dell'Industria ${10 + i * 7} – ${citta} (${prov})`, key: n.toUpperCase(), loc: `${citta.toUpperCase()}|${cap}`, citta, prov, geo }))
      .concat([{ cod: 'CDC99', n: 'Da attribuire', tipo: 'Sospeso', ind: 'Sede di consegna non indicata', key: '', loc: '', citta: '', prov: '', geo: null }]);
    const REAL = SEDI.slice(0, -1), CENTRI = REAL.map(s => s.citta.toUpperCase()), W = [9, 7, 5, 5, 4, 3, 3, 3, 2, 2, 2, 2].slice(0, O.sedi);

    /* ---------- articoli (con varianti per avere centinaia di descrizioni diverse) ---------- */
    const BASE = [
      ['Guanti nitrile nero (conf. 100)', 'CONF', 8.9, 'Würth', ['tg. S', 'tg. M', 'tg. L', 'tg. XL']], ['Scarpe antinfortunistiche S3', 'PA', 64.5, 'Cofra', ['tg. 39', 'tg. 40', 'tg. 41', 'tg. 42', 'tg. 43', 'tg. 44', 'tg. 45', 'tg. 46']],
      ['T-shirt cotone con logo', 'PZ', 6.2, 'Payper', ['bianca S', 'bianca M', 'bianca L', 'nera M', 'nera L', 'blu XL']], ['Felpa con zip', 'PZ', 18.5, 'Payper', ['blu navy M', 'blu navy L', 'grigia L', 'nera XL']],
      ['Gilet alta visibilità', 'PZ', 7.4, 'Portwest', ['arancio L', 'arancio XL', 'giallo L', 'giallo XXL']], ['Pantalone da lavoro multitasche', 'PZ', 29.9, 'Portwest', ['tg. 46', 'tg. 48', 'tg. 50', 'tg. 52', 'tg. 54']],
      ['Avvitatore a batteria 18V', 'PZ', 189, 'Milwaukee', ['solo corpo', 'kit 2 batterie']], ['Batteria 18V', 'PZ', 98, 'Milwaukee', ['2,0 Ah', '5,0 Ah', '8,0 Ah']], ['Smerigliatrice angolare', 'PZ', 145, 'DeWalt', ['115 mm', '125 mm', '230 mm']],
      ['Disco da taglio inox', 'PZ', 1.35, 'Würth', ['115 mm', '125 mm', '230 mm']], ['Punta HSS', 'PZ', 2.1, 'Würth', ['4 mm', '5 mm', '6 mm', '8 mm', '10 mm', '12 mm']], ['Viti autoperforanti (conf. 500)', 'CONF', 14.8, 'Würth', ['4,2x13', '4,2x19', '4,8x25', '5,5x32']],
      ['Rivetti alluminio (conf. 250)', 'CONF', 11.5, 'Berner', ['3,2x8', '4x10', '4,8x12']], ['Silicone 310 ml', 'PZ', 4.9, 'Berner', ['trasparente', 'bianco', 'nero']], ['Sgrassatore spray 400 ml', 'PZ', 5.6, 'Würth', ['']],
      ['Nastro adesivo', 'PZ', 3.2, 'Propac', ['americano 50 mm', 'imballo 50 mm avana', 'imballo trasparente', 'carta 38 mm']], ['Scatola cartone', 'PZ', 1.1, 'Propac', ['30x20x20', '40x30x30', '60x40x40']],
      ['Film estensibile', 'PZ', 12.9, 'Propac', ['17 my', '23 my']], ['Carta mani piegata (cartone)', 'CONF', 24, 'Lyreco', ['']], ['Toner stampante', 'PZ', 69, 'Lyreco', ['nero', 'ciano', 'magenta', 'giallo']], ['Risma carta A4 80 g', 'PZ', 4.2, 'Lyreco', ['']],
      ['Chiave combinata', 'PZ', 7.8, 'USAG', ['8 mm', '10 mm', '13 mm', '17 mm', '19 mm', '22 mm']], ['Set cacciaviti', 'PZ', 32, 'USAG', ['6 pezzi', '8 pezzi', 'isolati 1000V']], ['Cassetta attrezzi completa', 'PZ', 249, 'USAG', ['']],
      ['Prolunga avvolgicavo', 'PZ', 39, 'Amazon', ['15 m', '25 m', '50 m']], ['Faro LED da cantiere', 'PZ', 45, 'Amazon', ['30W', '50W', '100W']], ['Idropulitrice acqua fredda', 'PZ', 299, 'Lavor', ['130 bar', '150 bar']],
      ['Aspiratore solidi e liquidi', 'PZ', 129, 'Lavor', ['20 L', '30 L', '50 L']], ['Spese di trasporto', 'PZ', 12, 'Würth', ['']], ['Occhiali di protezione', 'PZ', 3.9, 'Cofra', ['trasparenti', 'fumé']], ['Cuffie antirumore', 'PZ', 16.5, 'Cofra', ['']],
      ['Pellicola adesiva', 'MQ', 6.7, 'Avery', ['arancione', 'grigia', 'bianca', 'nera']], ['Application tape', 'MQ', 0.95, 'Avery', ['']], ['Fascette nylon (conf. 100)', 'CONF', 3.4, 'Berner', ['200 mm', '300 mm', '400 mm']],
      ['Grasso multiuso 400 g', 'PZ', 7.2, 'Würth', ['']], ['Olio motore 5 L', 'PZ', 38, 'Würth', ['5W30', '10W40']], ['Spazzole tergicristallo', 'PZ', 14, 'Bosch', ['450 mm', '550 mm', '650 mm']],
      ['Lampadina', 'PZ', 4.5, 'Osram', ['H4', 'H7', 'P21W']], ['Fusibili lamellari (assortimento)', 'CONF', 9.9, 'Berner', ['']], ['Kit pronto soccorso', 'PZ', 26.5, 'Amazon', ['']], ['Estintore 6 kg', 'PZ', 42, 'Antincendi Sud', ['polvere', 'CO2']]];
    const ART = [];
    BASE.forEach(b => b[4].forEach((v, k) => ART.push([(b[0] + (v ? ' ' + v : '')).replace(/\s+/g, ' '), b[1], r2(b[2] * (1 + k * 0.06)), b[3]])));
    const cat = d => { const D = d.toUpperCase();
      if (/TRASPORTO/.test(D)) return 'Trasporti e servizi'; if (/T-SHIRT|FELPA|GILET|PANTALONE/.test(D)) return 'Abbigliamento da lavoro'; if (/SCARPE|GUANT|OCCHIAL|CUFFIE|PRONTO SOCCORSO|ESTINTORE/.test(D)) return 'DPI e sicurezza';
      if (/SCATOLA|FILM|NASTRO/.test(D)) return 'Imballaggio'; if (/CARTA MANI|SGRASS/.test(D)) return 'Pulizia e igiene'; if (/TONER|RISMA/.test(D)) return 'Ufficio e informatica';
      if (/DISCO|PUNTA/.test(D)) return 'Accessori per utensili'; if (/AVVITATORE|BATTERIA|SMERIGLIATRICE|IDROPULITRICE|ASPIRATORE/.test(D)) return 'Elettroutensili e batterie';
      if (/VITI|RIVETTI|FASCETTE/.test(D)) return 'Minuteria e fissaggio'; if (/SILICONE|GRASSO|OLIO/.test(D)) return 'Chimici e sigillanti'; if (/PROLUNGA|FARO|LED|LAMPADINA|FUSIBILI/.test(D)) return 'Elettrico e illuminazione';
      if (/PELLICOLA|APPLICATION/.test(D)) return 'Pellicole e adesivi'; if (/SPAZZOLE/.test(D)) return 'Ricambi'; return 'Utensili e attrezzature'; };
    const AW = ART.map(a => a[2] > 150 ? 1 : a[2] > 40 ? 3 : 6);

    /* ---------- fornitori e clienti (nomi generati) ---------- */
    const P1 = ['Alfa', 'Beta', 'Delta', 'Euro', 'Ital', 'Medi', 'Nord', 'Sud', 'Centro', 'Tecno', 'Edil', 'Ferro', 'Auto', 'Logi', 'Elettro', 'Termo', 'Idro', 'Pneu', 'Meta', 'Poli', 'Vetro', 'Mecc', 'Gomma', 'Plast', 'Agri'];
    const P2 = ['forniture', 'service', 'tecnica', 'commerciale', 'trade', 'sistemi', 'ricambi', 'logistica', 'utensili', 'impianti', 'group', 'distribuzione', 'store', 'parts', 'line'];
    const FX = ['S.r.l.', 'S.p.A.', 'S.n.c.', 'S.a.s.', 'S.r.l.s.'];
    const CIT = [['Roma', 'RM', '00100'], ['Milano', 'MI', '20100'], ['Napoli', 'NA', '80100'], ['Torino', 'TO', '10100'], ['Bologna', 'BO', '40100'], ['Firenze', 'FI', '50100'], ['Bari', 'BA', '70100'], ['Verona', 'VR', '37100'], ['Padova', 'PD', '35100'], ['Genova', 'GE', '16100'], ['Palermo', 'PA', '90100'], ['Catania', 'CT', '95100'], ['Brescia', 'BS', '25100'], ['Pescara', 'PE', '65100'], ['Latina', 'LT', '04100'], ['Frosinone', 'FR', '03100'], ['Perugia', 'PG', '06100'], ['Ancona', 'AN', '60100'], ['Rimini', 'RN', '47900'], ['Salerno', 'SA', '84100']];
    const NOMI = ['Marco', 'Giulia', 'Paolo', 'Sara', 'Luca', 'Anna', 'Andrea', 'Elena', 'Matteo', 'Chiara', 'Davide', 'Francesca', 'Simone', 'Laura', 'Stefano', 'Valentina', 'Alessandro', 'Martina', 'Federico', 'Silvia'];
    const COGN = ['Rossi', 'Bianchi', 'Verdi', 'Neri', 'Russo', 'Ferrari', 'Esposito', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri', 'Fontana', 'Santoro'];
    const ATT = ['Trasporti', 'Costruzioni', 'Officina', 'Autoriparazioni', 'Noleggi', 'Logistica', 'Carrozzeria', 'Impianti', 'Servizi', 'Edilizia', 'Elettrica', 'Idraulica', 'Gomme', 'Allestimenti', 'Movimento terra'];
    const piva = () => String(int(10000000, 99999999)) + String(int(100, 999));
    const tel = () => '0' + int(2, 9) + ' ' + int(1000000, 9999999);
    const slug = s => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '').slice(0, 18);
    const PAG = ['Rimessa diretta', 'Bonifico vista fattura', 'Bonifico 30 gg d.f.f.m.', 'Bonifico 60 gg d.f.f.m.', 'Ri.Ba. 30 gg d.f.f.m.', 'Ri.Ba. 60 gg d.f.f.m.'];
    const SDI = ['M5UXCR1', 'KRRH6B9', 'T9K4ZHO', 'SUBM70N', 'W7YVJK9', 'USAL8PV', '0000000'];
    const seenN = new Set(), uniq = f => { for (;;) { const n = f(); if (!seenN.has(n)) { seenN.add(n); return n; } } };

    const brandF = [...new Set(ART.map(a => a[3]))];
    const fornNomi = brandF.map(b => b + ' Italia ' + pick(FX));
    while (fornNomi.length < O.forn) fornNomi.push(uniq(() => pick(P1) + pick(P2) + ' ' + pick(FX)));
    const fornitori = fornNomi.map((nome, i) => { const c = pick(CIT); return { id: 'tf' + pad(i + 1, 4), nome, piva: piva(), cf: '', indirizzo: `Via ${pick(['Roma', 'Garibaldi', 'Mazzini', "dell'Industria", 'Tiburtina', 'Emilia', 'Appia'])} ${int(1, 300)}`, cap: c[2], citta: c[0], prov: c[1], email: `ordini@${slug(nome)}.example`, pec: rnd() < .4 ? `${slug(nome)}@pec.example` : '', tel: tel(), referente: pick(NOMI) + ' ' + pick(COGN), categoria: pick(['Utensili e attrezzature', 'DPI e sicurezza', 'Abbigliamento da lavoro', 'Imballaggio', 'Ricambi', 'Chimici e sigillanti', 'Trasporti e servizi', 'Ufficio e informatica']), pagamento: pick(PAG), iban: rnd() < .5 ? 'IT' + int(10, 99) + 'X' + int(1000000000, 9999999999) + int(10000000, 99999999) : '', note: '', creato: ds(daysAgo(int(400, DAYS))) }; });
    // brand → fornitore per gli acquisti
    const FB = {}; brandF.forEach((b, i) => { FB[b] = fornNomi[i]; });

    const clienti = [];
    for (let i = 0; i < O.cli; i++) {
      const c = pick(CIT), nome = uniq(() => rnd() < .55 ? `${pick(COGN)} ${pick(ATT)} ${pick(FX)}` : `${pick(ATT)} ${pick(P1)}${pick(P2)} ${pick(FX)}`);
      clienti.push({ id: 'tc' + pad(i + 1, 4), nome, piva: piva(), cf: '', indirizzo: `Via ${pick(['Roma', 'Garibaldi', 'Verdi', 'Cavour', 'Nazionale', 'del Lavoro', 'Prenestina'])} ${int(1, 250)}`, cap: c[2], citta: c[0], prov: c[1], nazione: 'IT', sdi: pick(SDI), pec: rnd() < .3 ? `${slug(nome)}@pec.example` : '', email: `amministrazione@${slug(nome)}.example`, tel: tel(), pagamento: pick(PAG), note: rnd() < .1 ? 'Cliente con consegne su appuntamento' : '', creato: ds(daysAgo(int(30, DAYS))) });
    }

    /* ---------- acquisti (Movimenti) ---------- */
    const movimenti = [];
    for (let i = 0; i < O.mov; i++) {
      const a = wPick(ART, AW), d = daysAgo(int(0, DAYS)), q = a[2] > 100 ? int(1, 3) : int(1, 40);
      movimenti.push({ id: id('tm'), data: ds(d), ndoc: 'DDT ' + int(1000, 99999), codice: 'ART' + int(10000, 99999), descrizione: a[0].toUpperCase(), um: a[1], quantita: q, prezzo: r2(a[2] * (0.88 + rnd() * 0.24)), iva: 0.22,
        centro: wPick(CENTRI, W), societa: '', categoria: cat(a[0]), fornitore: FB[a[3]] || a[3], note: rnd() < .03 ? 'Reso parziale' : '', creato: ds(d) });
    }

    /* ---------- fatture fornitori ---------- */
    const fatture = [], FCATS = [...new Set(movimenti.map(r => r.categoria))];
    for (let i = 0; i < O.fat; i++) {
      const d = daysAgo(int(1, DAYS)), imp = r2(80 + rnd() * rnd() * 9000), sc = new Date(d); sc.setDate(sc.getDate() + pick([0, 30, 60, 90]));
      const paid = ds(sc) < ds(now) ? rnd() < 0.9 : rnd() < 0.15;
      fatture.push({ id: id('tx'), fornitore: rnd() < .6 ? fornNomi[int(0, brandF.length - 1)] : pick(fornNomi), numero: `${int(1, 4999)}/${d.getFullYear()}`, data: ds(d), scadenza: ds(sc), imponibile: imp, imposta: r2(imp * 0.22), totale: r2(imp * 1.22), centro: wPick(CENTRI, W),
        categoria: pick(FCATS), stato: paid ? 'pagata' : 'da pagare', pagata: paid ? ds(sc) : '', ddt: '', righe: '', pdf: '', note: '', creato: ds(d) });
    }

    /* ---------- GLS ---------- */
    const DEST = clienti.slice(0, O.dest);
    const REG = { RM: 'Lazio', LT: 'Lazio', FR: 'Lazio', MI: 'Lombardia', BS: 'Lombardia', NA: 'Campania', SA: 'Campania', TO: 'Piemonte', BO: 'Emilia-Romagna', RN: 'Emilia-Romagna', FI: 'Toscana', BA: 'Puglia', VR: 'Veneto', PD: 'Veneto', GE: 'Liguria', PA: 'Sicilia', CT: 'Sicilia', PE: 'Abruzzo', PG: 'Umbria', AN: 'Marche' };
    const gls = [];
    for (let m = O.glsm; m >= 0; m--) {
      const base = new Date(now.getFullYear(), now.getMonth() - m, 1), mese = `${base.getFullYear()}-${pad(base.getMonth() + 1)}`;
      for (let i = 0, n = int(O.glsn[0], O.glsn[1]); i < n; i++) {
        const dd = pick(DEST), cI = wPick(REAL.map((s, k) => k), W), colli = int(1, 8), kg = r2(colli * (1.5 + rnd() * 14)), nolo = r2(6.5 + kg * 0.32), fuel = r2(nolo * 0.12), suppl = rnd() < 0.15 ? r2(3 + rnd() * 9) : 0;
        const day = new Date(base); day.setDate(int(1, 28)); if (day > now) continue;
        gls.push({ id: id('tg'), mese, data: ds(day), contratto: '1234', nsped: String(int(600000000, 699999999)), rif: 'ORD' + int(10000, 99999), destinatario: dd.nome, citta: dd.citta, prov: dd.prov, regione: REG[dd.prov] || '',
          cdc: REAL[cI].cod, cdcNome: CENTRI[cI], tipologia: rnd() < 0.85 ? 'Nazionale' : 'Express', colli, kgReali: kg, kgTass: Math.ceil(kg), nolo, fuel, suppl, totale: r2(nolo + fuel + suppl), gg: int(1, 4), riaddebito: rnd() < 0.2 ? 'Cliente' : '', note: '' });
      }
    }

    /* ---------- carburante e mezzi ---------- */
    const MZ = ['Iveco Daily', 'Ford Transit', 'Fiat Ducato', 'Renault Master', 'Peugeot Boxer', 'Mercedes Sprinter', 'VW Crafter', 'Citroën Jumper'];
    const gasolio = [];
    for (let k = 0; k < O.mezzi; k++) {
      const targa = `G${String.fromCharCode(65 + k % 26)}${int(100, 999)}${String.fromCharCode(65 + int(0, 25))}${String.fromCharCode(65 + int(0, 25))}`, mezzo = pick(MZ), op = pick(NOMI) + ' ' + pick(COGN), cen = CENTRI[k % CENTRI.length];
      let km = 20000 + k * 17000;
      for (let d = DAYS; d > 0; d -= int(5, 9)) { const lt = r2(40 + rnd() * 35); km += Math.round(lt * (10 + rnd() * 4));
        gasolio.push({ id: id('tq'), data: ds(daysAgo(d)), targa, km, litri: rnd() < .01 ? -lt : lt, prezzo: r2(1.62 + rnd() * 0.22), proprietario: k < Math.ceil(O.mezzi * .75) ? 'Aziendale' : 'Noleggio', operatore: op, centro: cen, uso: mezzo, note: '' }); }
    }

    /* ---------- Lyreco ---------- */
    const LYA = [['Carta A4 80 g (risma)', 'Ufficio', 4.1], ['Toner nero', 'Informatica', 68], ['Penne a sfera blu (conf. 50)', 'Cancelleria', 12.5], ['Carta igienica (conf. 48)', 'Igiene', 29.9], ['Detergente multiuso 5 L', 'Pulizia', 11.8],
      ['Sacchi neri 110 L', 'Pulizia', 9.4], ['Raccoglitori ad anelli', 'Archiviazione', 2.3], ['Caffè in capsule (100)', 'Pausa caffè', 27], ['Bicchieri carta (conf. 50)', 'Pausa caffè', 3.1], ['Guanti monouso (conf. 100)', 'Igiene', 7.9],
      ['Post-it 76x76', 'Cancelleria', 1.9], ['Buste a sacco A4', 'Cancelleria', 6.4], ['Acqua naturale 0,5 L (24)', 'Pausa caffè', 5.6], ['Etichette adesive A4', 'Ufficio', 14.2], ['Batterie AA (conf. 24)', 'Informatica', 12.9]];
    const lyreco = [], lyfatture = [];
    for (let m = O.lyfm; m >= 0; m--) for (let f = 0, nF = int(O.lyfn[0], O.lyfn[1]); f < nF; f++) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, int(2, 27)); if (d > now) continue;
      const nf = String(int(2024, 2026)) + pad(O.lyfm + 1 - m, 2) + pad(f + 1, 2) + int(1000, 9999), nc = rnd() < .04; let tot = 0;
      const noSede = rnd() < .12;
      for (let i = 0, n = int(4, 16); i < n; i++) { const a = pick(LYA), q = int(1, 12) * (nc ? -1 : 1), s = noSede ? SEDI[SEDI.length - 1] : wPick(REAL, W), imp = r2(a[2] * q); tot += imp;
        lyreco.push({ id: nf + '-' + (i + 1), fattura: nf, tipo: nc ? 'TD04' : 'TD01', data: ds(d), ddt: String(int(800000, 899999)), dataDdt: ds(d), ordine: 'OR' + int(10000, 99999), richiedente: pick(NOMI).charAt(0) + '. ' + pick(COGN), codice: String(int(100000, 999999)), descrizione: a[0].toUpperCase(), categoria: a[1], quantita: q, um: 'PZ', prezzo: a[2], importo: imp, iva: 22, sede: s.key, cdc: s.cod, note: '' }); }
      lyfatture.push({ id: nf, tipo: nc ? 'TD04' : 'TD01', data: ds(d), descrizione: nc ? 'Nota di credito' : 'Fattura', imponibile: r2(tot), totale: r2(tot * 1.22), stato: m > 1 ? 'pagata' : 'da pagare', pagata: m > 1 ? ds(d) : '', pdf: '', note: '' });
    }

    /* ---------- Amazon ---------- */
    const AMA = [['Organizer per minuteria 24 scomparti', 'Organizzazione', 19.9], ['Prolunga elettrica 10 m', 'Elettrico', 24.5], ['Faretto LED ricaricabile', 'Illuminazione', 32], ['Mouse wireless', 'Informatica', 14.9], ['Cavo USB-C 2 m (2 pezzi)', 'Informatica', 11.9],
      ['Termometro digitale', 'Varie', 9.9], ['Kit pronto soccorso', 'Sicurezza', 26.5], ['Tappetino ergonomico', 'Ufficio', 22], ['Monitor 24 pollici', 'Informatica', 119], ['Tastiera wireless', 'Informatica', 29.9], ['Hard disk esterno 2 TB', 'Informatica', 74.9],
      ['Cassetta portautensili', 'Organizzazione', 34.9], ['Lampada da tavolo LED', 'Ufficio', 27.5], ['Scaffale metallico 5 ripiani', 'Organizzazione', 59.9], ['Batterie ricaricabili AA (8)', 'Elettrico', 21.9], ['Router 4G', 'Informatica', 89], ['Stampante laser', 'Informatica', 159]];
    const amazon = [], amazonart = [];
    for (let i = 0; i < O.am; i++) {
      const d = daysAgo(int(0, DAYS)), oid = `40${int(1, 9)}-${int(1000000, 9999999)}-${pad(i, 7)}`, s = wPick(REAL, W); let sub = 0, pz = 0; const n = int(1, 4);
      for (let k = 0; k < n; k++) { const a = pick(AMA), q = int(1, 4); sub += a[2] * q; pz += q;
        amazonart.push({ id: oid + '-' + k, ordine: oid, data: ds(d), quantita: q, descrizione: a[0], prezzo: a[2], importo: r2(a[2] * q), venditore: rnd() < .7 ? 'Amazon' : pick(['TecnoStore', 'Ufficio Facile', 'ElettroShop']), condizione: rnd() < .97 ? 'Nuovo' : 'Usato', spedito: ds(d), localita: s.citta.toUpperCase(), categoria: a[1] }); }
      const totale = r2(sub), imp = r2(totale / 1.22), est = rnd() < .1;
      amazon.push({ id: oid, data: ds(d), articoli: n, pezzi: pz, venditore: 'Amazon', destinatario: O.short + ' S.r.l.', localita: s.citta.toUpperCase(), pagamento: rnd() < .8 ? 'Fattura mensile' : 'Carta aziendale', subtotale: totale, spedizione: 0, sconti: 0, imponibile: imp, iva: r2(totale - imp), totale, ivaTipo: est ? 'stimata' : 'fattura', cdc: s.cod, note: '', pdf: '' });
    }

    /* ---------- magazzino ---------- */
    const articoli = [];
    for (let i = 0; i < O.art; i++) {
      const a = ART[i % ART.length], v = Math.floor(i / ART.length), costo = r2(a[2] * (0.85 + rnd() * 0.3));
      const ean = '80' + String(int(10000000000, 99999999999)).slice(0, 11);
      articoli.push({ id: 'ta' + pad(i + 1, 5), codice: 'ART-' + pad(i + 1, 4), codForn: a[3].slice(0, 3).toUpperCase() + '-' + int(1000, 99999), descrizione: a[0] + (v ? ` · lotto ${v + 1}` : ''), um: a[1], categoria: cat(a[0]), fornitore: FB[a[3]] || a[3], costo, prezzo: r2(costo * (1.3 + rnd() * 0.6)), iva: 22, scorta: int(0, 40), barcode: ean, note: '', creato: ds(daysAgo(int(500, DAYS))) });
    }
    const magmov = [];
    articoli.forEach(a => magmov.push({ id: id('tk'), data: ds(daysAgo(DAYS)), articolo: a.id, tipo: 'carico', quantita: int(20, 400), costo: a.costo, causale: 'Giacenza iniziale', doc: '', note: '', creato: ds(daysAgo(DAYS)) }));
    for (let i = 0; i < O.mmov; i++) { const a = pick(articoli), d = daysAgo(int(0, DAYS - 1));
      magmov.push({ id: id('tk'), data: ds(d), articolo: a.id, tipo: 'carico', quantita: int(10, 200), costo: r2(a.costo * (0.95 + rnd() * .1)), causale: `DDT fornitore n. ${int(100, 9999)}`, doc: '', note: '', creato: ds(d) }); }

    /* ---------- DDT e fatture ai clienti ---------- */
    const ddt = [], vendite = [], CB = clienti.slice(0, O.cb);
    const nDdt = {}, nFv = {};
    const days = Array.from({ length: O.ddtn }, () => int(0, DAYS)).sort((a, b) => b - a);
    days.forEach(g => {
      const d = daysAgo(g), y = String(d.getFullYear()), c = pick(CB), righe = [];
      for (let j = 0, n = int(2, 9); j < n; j++) { const a = pick(articoli); if (righe.some(l => l.art === a.id)) continue; righe.push({ art: a.id, c: a.codice, d: a.descrizione, um: a.um, q: int(1, 25), p: a.prezzo, sc: rnd() < .2 ? pick([5, 10]) : 0, iva: 22 }); }
      nDdt[y] = (nDdt[y] || 0) + 1;
      const dd = { id: id('td'), numero: String(nDdt[y]), anno: y, data: ds(d), cliente: c.id, destinazione: rnd() < .2 ? `Cantiere di ${pick(CIT)[0]}` : '', causale: 'Vendita', trasporto: pick(['Mittente', 'Mittente', 'Vettore', 'Destinatario']), vettore: '', colli: int(1, 12), peso: int(5, 900), aspetto: pick(['Scatole', 'Pallet', 'A vista']), prezzi: '', righe: JSON.stringify(righe), fattura: '', note: '', creato: ds(d) };
      ddt.push(dd); righe.forEach(l => magmov.push({ id: id('tk'), data: dd.data, articolo: l.art, tipo: 'scarico', quantita: -l.q, costo: 0, causale: `DDT ${dd.numero}/${dd.anno}`, doc: dd.id, note: '', creato: dd.data }));
    });
    const tot = R => { const by = {}; R.filter(l => !l.h).forEach(l => { const t = r2(l.q * l.p * (1 - (l.sc || 0) / 100)); by[l.iva] = r2((by[l.iva] || 0) + t); }); let imp = 0, iva = 0; Object.entries(by).forEach(([a, v]) => { imp += v; iva += r2(v * a / 100); }); return [r2(imp), r2(iva)]; };
    const cur = ds(now).slice(0, 7), months = [...new Set(ddt.map(d => d.data.slice(0, 7)).filter(m => m < cur))].sort();
    months.forEach(m => { const [yy, mm] = m.split('-').map(Number), last = ds(new Date(yy, mm, 0)), byC = {};
      ddt.filter(d => d.data.slice(0, 7) === m).forEach(d => { (byC[d.cliente] = byC[d.cliente] || []).push(d); });
      Object.entries(byC).forEach(([cid, L]) => { const c = CB.find(x => x.id === cid);
        const righe = L.flatMap(d => [{ h: 1, d: `DDT n. ${d.numero}/${d.anno} del ${d.data.split('-').reverse().join('/')}`, ddt: d.id }, ...JSON.parse(d.righe)]), [imp, iva] = tot(righe);
        const sc = new Date(yy, mm, 0); sc.setDate(sc.getDate() + 30); sc.setMonth(sc.getMonth() + 1, 0);
        nFv[yy] = (nFv[yy] || 0) + 1;
        const late = ds(sc) < ds(now), paid = late ? rnd() < .88 : rnd() < .2;
        const f = { id: id('tv'), numero: String(nFv[yy]), anno: String(yy), data: last, tipo: 'TD24', cliente: cid, ddt: JSON.stringify(L.map(d => d.id)), righe: JSON.stringify(righe), imponibile: imp, imposta: iva, totale: r2(imp + iva), pagamento: c.pagamento, scadenza: ds(sc), stato: paid ? 'pagata' : 'emessa', pagata: paid ? ds(sc) : '', note: '', creato: last };
        vendite.push(f); L.forEach(d => { d.fattura = f.id; }); }); });
    // fatture immediate (TD01) senza DDT
    for (let i = 0; i < O.fimm; i++) { const d = daysAgo(int(0, DAYS)), yy = d.getFullYear(), c = pick(clienti), righe = [];
      for (let j = 0, n = int(1, 5); j < n; j++) { const a = pick(articoli); righe.push({ art: a.id, c: a.codice, d: a.descrizione, um: a.um, q: int(1, 10), p: a.prezzo, sc: 0, iva: 22 }); }
      const [imp, iva] = tot(righe), sc = new Date(d); sc.setDate(sc.getDate() + 30); nFv[yy] = (nFv[yy] || 0) + 1; const paid = ds(sc) < ds(now) ? rnd() < .9 : rnd() < .3;
      vendite.push({ id: id('tv'), numero: String(nFv[yy]), anno: String(yy), data: ds(d), tipo: 'TD01', cliente: c.id, ddt: '[]', righe: JSON.stringify(righe), imponibile: imp, imposta: iva, totale: r2(imp + iva), pagamento: c.pagamento, scadenza: ds(sc), stato: paid ? 'pagata' : 'emessa', pagata: paid ? ds(sc) : '', note: '', creato: ds(d) }); }

    /* ---------- incassi giornalieri (5 sedi) ---------- */
    const incassi = [], CI = CENTRI.slice(0, O.inc), WI = [5, 3, 2, 2, 1];
    for (let g = DAYS; g >= 0; g--) { const d = daysAgo(g), wd = d.getDay(); if (wd === 0) continue;
      CI.forEach((c, j) => { const v = r2((900 + rnd() * 1800) * WI[j] / 3 * (wd === 6 ? .5 : 1)), pos = r2(v * (.55 + rnd() * .3)), alt = rnd() < .05 ? r2(v * .1) : 0;
        incassi.push({ id: id('ti'), data: ds(d), sede: c, importo: r2(v + alt), contanti: r2(v - pos), pos, altro: alt, iva: 22, tipo: rnd() < .97 ? 'corrispettivi' : 'altro', note: '', creato: ds(d) }); }); }

    /* ---------- configurazione, preventivi, servizi ---------- */
    const cdcLink = {}; REAL.forEach((s, i) => { cdcLink['att|' + CENTRI[i]] = s.cod; cdcLink['gas|' + CENTRI[i]] = s.cod; cdcLink['gls|' + CENTRI[i]] = s.cod; });
    const budget = {}; CENTRI.forEach(c => { const v = movimenti.filter(r => r.centro === c && r.data >= ds(daysAgo(365))).reduce((t, r) => t + r.quantita * r.prezzo, 0); budget[c] = Math.round(v * (0.9 + rnd() * .3) / 1000) * 1000; });
    const servizi = Array.from({ length: O.srv }, (_, i) => ({ id: 'ts' + pad(i + 1, 3), cod: 'SRV-' + pad(i + 1, 3), d: pick(['Applicazione', 'Rimozione', 'Montaggio', 'Installazione', 'Manutenzione', 'Collaudo', 'Trasporto', 'Consulenza']) + ' ' + pick(['kit adesivi', 'scaffalatura', 'gancio traino', 'faro supplementare', 'pedana', 'portapacchi', 'impianto elettrico', 'cassone', 'sponda idraulica']) + (i >= 72 ? ' urgente' : ''), um: pick(['ORE', 'PZ', 'PZ', 'FORF']), p: r2(25 + rnd() * 380), costo: r2(10 + rnd() * 120), iva: 22, note: '' }));
    const pvClienti = clienti.slice(0, O.pvc).map(c => ({ id: 'pc' + c.id, nome: c.nome, ref: pick(NOMI) + ' ' + pick(COGN), email: c.email, tel: c.tel, ind: `${c.indirizzo}, ${c.citta}`, ric: rnd() < .25 ? pick([40, 60, 80, 100]) : '', note: '', dal: c.creato }));
    const config = {
      azienda: { nome: O.name, citta: 'Roma (RM)', piva: '01234567890', cf: '01234567890', indirizzo: "Via dell'Industria 10", cap: '00156', regime: 'RF01', iban: 'IT60X0542811101000000123456', email: 'amministrazione@' + O.dom, tel: '06 1234567' },
      centri: CENTRI, lyCdc: SEDI, ppRic: 2, budget, cdcLink, servizi, pvClienti, amLastImport: { data: ds(now), fino: ds(now) }
    };
    const COL = [['00000', 'BIANCO'], ['01000', 'GIALLO']], SZ = ['S', 'M', 'L', 'XL', 'XXL'], STATI = ['bozza', 'inviato', 'inviato', 'accettato', 'accettato', 'rifiutato'];
    for (let i = 0; i < O.pv; i++) {
      const g = int(0, DAYS), d = daysAgo(g), y = d.getFullYear(), cli = pick(pvClienti), righe = [];
      for (let j = 0, n = int(1, 14); j < n; j++) { const [c, cn] = pick(COL), sz = SZ.slice(0, int(2, 5)), q = {}; sz.forEach(s => { q[s] = int(1, 30); });
        righe.push({ sup: 'payper', it: '000001', n: 'MIAMI+', cl: 'T-SHIRT', c, cn, sz, q, p: r2(5.5 + rnd() * 4), man: true, sc: rnd() < .2 ? 5 : 0 }); }
      const pid = 'tp' + pad(i + 1, 4);
      config['pv:' + pid] = { id: pid, num: `P${y}-${pad(i + 1, 3)}`, data: ds(d), valid: 30, stato: g > 60 ? pick(['accettato', 'rifiutato', 'accettato']) : pick(STATI), cliente: { nome: cli.nome, ref: cli.ref, email: cli.email, tel: cli.tel, ind: cli.ind }, cliId: cli.id, righe, sconto: rnd() < .15 ? 3 : 0, note: 'Consegna in 10 giorni lavorativi.', iva: 22, agg: d.toISOString() };
    }

    return {
      config,
      sheets: { Fornitori: fornitori, Clienti: clienti, Articoli: articoli, Movimenti: movimenti, Fatture: fatture, GLS: gls, Gasolio: gasolio, Lyreco: lyreco, LyrecoFatture: lyfatture, Amazon: amazon, AmazonArticoli: amazonart, DDT: ddt, Vendite: vendite, MagMov: magmov, Incassi: incassi }
    };
  }

  // tutte le operazioni in ordine fisso (Config prima, poi un foglio alla volta)
  function ops(o) {
    const D = gen(o), L = [], parts = [];
    Object.entries(D.config).forEach(([chiave, v]) => L.push({ action: 'upsert', sheet: 'Config', row: { chiave, valore: JSON.stringify(v) } }));
    parts.push(['Impostazioni e preventivi', L.length]);
    Object.entries(D.sheets).forEach(([sh, rows]) => { rows.forEach(row => L.push({ action: 'upsert', sheet: sh, row })); parts.push([sh, rows.length]); });
    return { ops: L, parts };
  }
  // gestionale DEMO per le presentazioni ai clienti: azienda inventata (ingrosso edile), dati credibili ma leggeri (~12.000 righe, circa 1 anno e mezzo)
  const DEMO = { NAME: 'BIANCHI FORNITURE EDILI S.R.L.', EMAIL: 'demo@bianchiforniture.example', OPT: { name: 'Bianchi Forniture Edili S.r.l.', short: 'Bianchi Forniture', pre: 'BF', dom: 'bianchiforniture.example', seed: 424242, days: 540, sedi: 3, forn: 45, cli: 140, mov: 1800, fat: 260, glsm: 17, glsn: [40, 70], mezzi: 5, lyfm: 17, lyfn: [3, 5], am: 150, art: 220, mmov: 300, ddtn: 320, cb: 80, dest: 60, fimm: 80, inc: 3, pv: 40, srv: 30, pvc: 40 } };
  window.CDC_STRESS = { gen, ops, NAME: 'TEST ESTREMO', DEMO };
})();
