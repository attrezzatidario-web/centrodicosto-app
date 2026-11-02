/* Centro di Costo — «Scopri cosa può fare» (v97, rinnovata in v104)
   Pagina di presentazione per i clienti: si apre dalla pagina di accesso e dalla demo.
   Si adatta all'attività scelta (settori.js). Animazioni leggere in CSS, ferme con «riduci movimento». */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SOON = new Set(); // funzioni in preparazione: etichetta «in arrivo»

  // esempi di righe di fattura riconosciute in automatico, per attività
  const EX = {
    veicoli: [['GUANTI NITRILE NERO TG. L', 'DPI e sicurezza'], ['AVVITATORE M18 FUEL', 'Elettroutensili e batterie'], ['FELPA ZIP BLU NAVY', 'Abbigliamento da lavoro'], ['VITI AUTOPERFORANTI 4,2X19', 'Minuteria e fissaggio']],
    bar: [['CAFFÈ IN GRANI MISCELA BAR 1 KG', 'Caffè e bevande calde'], ['CORNETTI ALLA CREMA (CONF. 50)', 'Food e pasticceria'], ['APEROL 1 L', 'Bevande e alcolici'], ['BICCHIERI CARTA ASPORTO', 'Monouso e packaging']],
    pizzeria: [['FARINA TIPO 00 SACCO 25 KG', 'Farine e impasti'], ['FIOR DI LATTE PER PIZZA', 'Latticini e formaggi'], ['CARTONI PIZZA 33X33', 'Cartoni e asporto'], ['LEGNA DI FAGGIO PER FORNO', 'Forno e combustibili']],
    ristorante: [['FILETTO DI MANZO', 'Carne'], ['VONGOLE VERACI', 'Pesce'], ['VINO CHIANTI CLASSICO', 'Vini e bevande'], ['NOLEGGIO TOVAGLIATO', 'Tovagliato e lavanderia']],
    lavanderia: [['DETERSIVO LIQUIDO 20 KG', 'Detersivi e prodotti chimici'], ['GRUCCE IN METALLO (500)', 'Grucce e imballi'], ['GUARNIZIONE OBLÒ LAVATRICE', 'Macchinari e ricambi'], ['BOLLETTA ENERGIA ELETTRICA', 'Utenze']],
    edile: [['CEMENTO 32,5 R SACCO 25 KG', 'Cementi, malte e premiscelati'], ['TONDINO FERRO B450C 12 MM', 'Ferro e acciaio'], ['LASTRA CARTONGESSO 120X200', 'Isolanti e cartongesso'], ['SABBIA LAVATA BIG BAG', 'Inerti']],
    impresa: [['NOLEGGIO MINIESCAVATORE', 'Noleggi mezzi e attrezzature'], ['SMALTIMENTO MACERIE CASSONE', 'Smaltimento rifiuti'], ['SUBAPPALTO IMPIANTO ELETTRICO', 'Subappalti e manodopera'], ['SCARPE ANTINFORTUNISTICHE S3', 'DPI e sicurezza']],
    negozio: [['SHOPPER CARTA PERSONALIZZATE', 'Imballi e shopper'], ['SCAFFALE ESPOSITORE', 'Allestimento e arredo'], ['ROTOLI CASSA TERMICI', 'Ufficio, cassa e informatica'], ['SPESE CORRIERE ESPRESSO', 'Spedizioni e-commerce']],
    estetica: [['TINTA IN CREMA 100 ML', 'Prodotti professionali'], ['ASCIUGAMANI MONOUSO (100)', 'Monouso e consumabili'], ['PHON PROFESSIONALE 2000 W', 'Attrezzature e arredi'], ['ABBONAMENTO APP PRENOTAZIONI', 'Prenotazioni e app']],
    hotel: [['KIT CORTESIA (100 PEZZI)', 'Kit cortesia'], ['NOLEGGIO BIANCHERIA', 'Biancheria e lavanderia'], ['COMMISSIONI BOOKING.COM', 'Commissioni portali'], ['MARMELLATA MONOPORZIONE', 'Colazione e food']],
    altro: [['TONER STAMPANTE NERO', 'Ufficio, cassa e informatica'], ['SERVIZIO PULIZIE MENSILE', 'Servizi'], ['CONSULENZA COMMERCIALISTA', 'Personale e consulenze'], ['CANONE DI LOCAZIONE UFFICIO', 'Affitto e locazioni']]
  };
  // a chi si rivolge, per il titolo
  const PL = { veicoli: 'officine e allestitori', bar: 'bar e caffetterie', pizzeria: 'pizzerie', ristorante: 'ristoranti', lavanderia: 'lavanderie', edile: 'ingrossi edili', impresa: 'imprese edili', negozio: 'negozi', estetica: 'parrucchieri ed estetisti', hotel: 'hotel e B&B', altro: 'ogni azienda' };
  const VEI_CAT = ['Trasporti e servizi', 'Abbigliamento da lavoro', 'DPI e sicurezza', 'Imballaggio', 'Pulizia e igiene', 'Ufficio e informatica', 'Accessori per utensili', 'Elettroutensili e batterie', 'Minuteria e fissaggio', 'Chimici e sigillanti', 'Elettrico e illuminazione', 'Utensili e attrezzature'];
  const LOGOS = ['payper', 'milwaukee', 'cofra', 'portwest', 'usag', 'dewalt', 'stanley', 'lavor', 'kerakoll', 'telwin', 'propac', 'promit', 'maxilia', 'sola', 'ffg', 'benman', 'activegear', 'jrc', 'hugo'];

  // illustrazioni animate delle funzioni (SVG + classi CSS)
  const ILL = {
    spese: `<svg viewBox="0 0 200 110" class="il il-bars">${[[46, 34], [58, 40], [52, 44], [70, 46], [64, 42], [84, 50], [78, 48]].map(([r, c], i) => `<rect class="rv1" x="${16 + i * 25}" y="${100 - r}" width="9" height="${r}" rx="2.5" style="--i:${i}"/><rect class="cv1" x="${26 + i * 25}" y="${100 - c}" width="9" height="${c}" rx="2.5" style="--i:${i}"/>`).join('')}<path class="il-line" d="M25 78 L50 70 L75 76 L100 62 L125 64 L150 52 L175 54" pathLength="1"/></svg>`,
    forn: `<div class="il il-logos"><div class="il-track">${[...LOGOS, ...LOGOS].map(l => `<img src="logo-${l}.svg" alt="" loading="lazy">`).join('')}</div></div>`,
    prev: `<svg viewBox="0 0 200 110" class="il il-doc"><rect x="58" y="8" width="84" height="96" rx="6" class="pg"/>${[24, 34, 44, 58, 68, 78].map((y, i) => `<path d="M70 ${y} H${i % 3 === 2 ? 112 : 130}" pathLength="1" style="--i:${i}"/>`).join('')}<g class="bdg"><rect x="118" y="74" width="44" height="22" rx="6"/><text x="140" y="89">PDF</text></g></svg>`,
    mag: `<svg viewBox="0 0 200 110" class="il il-shelf"><path d="M30 34 H170 M30 68 H170 M30 102 H170" class="sh"/>${[[40, 12], [66, 12], [92, 12], [44, 46], [70, 46], [118, 46], [40, 80], [96, 80], [122, 80], [148, 80]].map(([x, y], i) => `<rect x="${x}" y="${y}" width="22" height="22" rx="3" style="--i:${i}"/>`).join('')}<g class="cnt"><rect x="142" y="8" width="44" height="22" rx="11"/><text x="164" y="23">128</text></g></svg>`,
    ddt: `<svg viewBox="0 0 200 110" class="il il-ddt">${[0, 1, 2].map(i => `<g class="d" style="--i:${i}"><rect x="${12 + i * 10}" y="${14 + i * 8}" width="46" height="58" rx="4"/><path d="M${20 + i * 10} ${30 + i * 8} H${48 + i * 10} M${20 + i * 10} ${40 + i * 8} H${42 + i * 10}"/></g>`).join('')}<path class="ar" d="M84 56 H112" pathLength="1"/><path class="ah" d="M106 50 L114 56 L106 62"/><g class="inv"><rect x="124" y="14" width="62" height="82" rx="5"/><path d="M134 32 H176 M134 44 H168 M134 56 H176"/><rect x="134" y="70" width="42" height="14" rx="3" class="tot"/></g></svg>`,
    ai: `<svg viewBox="0 0 200 110" class="il il-ai"><rect x="50" y="6" width="100" height="98" rx="6" class="pg"/>${[20, 32, 44, 56, 68, 80].map((y, i) => `<rect x="62" y="${y}" width="${[60, 44, 70, 52, 66, 40][i]}" height="6" rx="3" class="ln" style="--i:${i}"/>`).join('')}<rect x="52" y="10" width="96" height="4" rx="2" class="scan"/><g class="ok"><circle cx="150" cy="88" r="14"/><path d="M143 88 L148 93 L157 83"/></g></svg>`,
    sedi: `<svg viewBox="0 0 200 110" class="il il-map"><path class="ln" d="M44 72 L96 36 L150 60 L120 92 Z" pathLength="1"/>${[[44, 72], [96, 36], [150, 60], [120, 92]].map(([x, y], i) => `<g style="--i:${i}"><circle class="pu" cx="${x}" cy="${y}" r="10"/><circle class="pt" cx="${x}" cy="${y}" r="5"/></g>`).join('')}</svg>`,
    cli: `<svg viewBox="0 0 200 110" class="il il-cli">${[0, 1, 2].map(i => `<g style="--i:${i}"><rect x="30" y="${12 + i * 32}" width="140" height="26" rx="8"/><circle cx="46" cy="${25 + i * 32}" r="7"/><rect x="60" y="${20 + i * 32}" width="${[64, 52, 72][i]}" height="5" rx="2.5" class="t"/><rect x="60" y="${29 + i * 32}" width="${[40, 34, 46][i]}" height="4" rx="2" class="t2"/></g>`).join('')}</svg>`,
    acc: `<svg viewBox="0 0 200 110" class="il il-dev"><rect x="26" y="18" width="96" height="62" rx="5" class="lp"/><path d="M16 86 H132" class="lp"/><rect x="148" y="30" width="34" height="62" rx="6" class="ph"/>${[0, 1, 2].map(i => `<circle class="dt" cx="${128 + i * 7}" cy="56" r="2.2" style="--i:${i}"/>`).join('')}<path class="ck" d="M60 48 L70 58 L88 40" pathLength="1"/></svg>`
  };
  const FEAT = [
    ['spese', 'Quanto guadagni, davvero', 'Incassi, fatture e spese in un unico conto: ricavi, costi e utile mese per mese e per ogni sede.'],
    ['forn', 'Tutti i fornitori', 'Cataloghi con foto, codici e listini di 17 fornitori. Aggiungiamo anche i tuoi.'],
    ['prev', 'Preventivi in un clic', 'Scegli i prodotti, applichi ricarico e sconti, scarichi un PDF professionale da mandare al cliente.'],
    ['ai', 'Fatture lette dall\'IA', 'Fotografi o carichi la fattura del fornitore: righe, importi e categorie si compilano da soli.'],
    ['cli', 'Clienti', 'Anagrafica dei clienti con contatti, ricarico personale e storico dei preventivi.'],
    ['mag', 'Magazzino', 'Articoli, giacenze, carichi e scarichi. Sai sempre cosa hai e cosa riordinare.'],
    ['ddt', 'DDT e fatture di fine mese', 'Fai i DDT durante il mese e a fine mese li raccogli in una fattura, con PDF e file XML.'],
    ['sedi', 'Più sedi', 'Locali, cantieri, depositi o punti vendita: spese e confronto tra le tue sedi, con mappa.'],
    ['acc', 'Ovunque e in sicurezza', 'Da PC e telefono. Ogni collaboratore con il suo accesso, i dati restano solo tuoi.']
  ];
  const STEPS = [
    ['Raccontami la tua attività', 'Mi dici come lavori, quali fornitori usi e cosa ti serve controllare.'],
    ['Preparo il tuo gestionale', 'Sezioni, categorie e nomi su misura. I tuoi fornitori con i loro listini.'],
    ['Importo i tuoi dati', 'Fatture, Excel e storico che hai già: niente da ricopiare a mano.'],
    ['Cresce con te', 'Ti serve qualcosa di nuovo? Lo aggiungo. Il gestionale si adatta a te, non il contrario.']
  ];
  const WISH = ['Un nuovo fornitore con il suo listino', 'Un report per il commercialista', 'Import dal tuo vecchio programma', 'Una sezione tutta tua', 'Ordini ai fornitori', 'Scadenzario dei pagamenti', 'Etichette e codici a barre', 'Collegamento all\'e-commerce'];


  /* ===== v106: «Dentro il gestionale» — schermate di esempio animate, adattate all'attività ===== */
  const SHOW = [
    ['dash', 'Dashboard', 'Il quadro di tutto, a colpo d\'occhio', ['Ricavi, costi e utile del mese, confrontati con il mese prima', 'Spese per {sedi} e per categoria', 'Fatture in scadenza e avvisi in evidenza']],
    ['acq', '{acq}', 'Ogni spesa al suo posto', ['Scrivi o importi le righe: la categoria si assegna da sola', 'Cerchi qualsiasi voce in un attimo', 'Ogni spesa ha {sede} e il suo fornitore']],
    ['fat', 'Fatture fornitori', 'La fattura si compila da sola', ['Fotografi o carichi il PDF: l\'IA legge fornitore, righe e importi', 'Scadenze e pagamenti sotto controllo', 'Il PDF resta archiviato, sempre a portata di mano']],
    ['prev', 'Preventivi', 'Preventivi professionali in pochi minuti', ['Scegli i prodotti dai cataloghi, con foto e codici', 'Ricarico e sconti calcolati da soli', 'PDF pronto da mandare su WhatsApp o email']],
    ['mag', 'Magazzino', 'Sai sempre cosa hai', ['Giacenze aggiornate a ogni carico e scarico', 'Avviso quando un articolo è sotto scorta', 'Valore del magazzino calcolato in automatico']],
    ['ven', 'DDT e fatture', 'Dai DDT alla fattura di fine mese', ['DDT dal telefono, anche con firma del cliente', 'A fine mese raccogli i DDT in una fattura con un clic', 'PDF e file XML pronti per lo SdI']],
    ['inc', 'Incassi', 'Quanto entra, giorno per giorno', ['Chiusure di cassa con contanti, POS e altro', 'Calendario del mese con le giornate migliori', 'Ricavi e utile in Dashboard senza fare conti']],
    ['for', 'Fornitori', 'Tutti i fornitori in un posto', ['Spesa dell\'anno e fatture da pagare per ognuno', 'Contatti, IBAN e condizioni di pagamento', 'Ordini veloci dai loro cataloghi']]
  ];
  const PRZ = [24.9, 189, 32.5, 14.2];
  const eu = v => '€ ' + Number(v).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const eu0 = v => '€ ' + Math.round(v).toLocaleString('it-IT');
  function sxTxt(t, s) { const sd = s.sede || ['Sede', 'Sedi']; return t.replace('{sedi}', sd[1].toLowerCase()).replace('{sede}', (sd[2] ? 'la sua ' : 'il suo ') + sd[0].toLowerCase()).replace('{acq}', s.acq || 'Acquisti'); }
  function showMock(k, s, cats, ex) {
    const sd = s.sede || ['Sede', 'Sedi'], SD = ['Roma', 'Milano', 'Napoli'].map(c => `${sd[0]} ${c}`);
    if (k === 'dash') return `<div class="sx-kpis">${[['Ricavi', 48250, 'ok', '+14%'], ['Costi', 31120, '', '+3%'], ['Utile', 17130, 'ok', '+38%'], ['Da pagare', 4380, 'warn', '3 fatture']].map(([l, v, c, d], i) => `<div class="sx-k" style="--i:${i}"><small>${l}</small><b data-cnt="${v}" data-eur="1">€ 0</b><em class="${c}">${d}</em></div>`).join('')}</div>
      <div class="sx-row2"><div class="sx-box"><div class="sx-bh">Ricavi e costi <span>ultimi 6 mesi</span></div><div class="sx-cols">${[[60, 44], [66, 48], [58, 46], [74, 50], [80, 52], [92, 58]].map(([a, b], i) => `<div style="--i:${i}"><i class="r" style="--h:${a}%"></i><i class="c" style="--h:${b}%"></i><span>${['mag', 'giu', 'lug', 'ago', 'set', 'ott'][i]}</span></div>`).join('')}</div></div>
      <div class="sx-box"><div class="sx-bh">Spese per ${esc(sd[1].toLowerCase())}</div>${SD.map((n, i) => `<div class="sx-hb" style="--i:${i}"><span>${esc(n)}</span><i style="--w:${[82, 58, 37][i]}%"></i><b>${eu0([12840, 9110, 5870][i])}</b></div>`).join('')}<div class="sx-bh" style="margin-top:12px">Categorie</div>${cats.slice(0, 3).map((c, i) => `<div class="sx-hb c" style="--i:${i + 3}"><span>${esc(c)}</span><i style="--w:${[64, 41, 27][i]}%"></i><b>${[34, 22, 15][i]}%</b></div>`).join('')}</div></div>`;
    if (k === 'acq') return `<div class="sx-tool"><div class="sx-search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span class="sx-type" data-type="${esc(ex[0][0].split(' ').slice(0, 2).join(' ').toLowerCase())}"></span></div><span class="sx-btn">+ Nuova spesa</span></div>
      <div class="sx-table"><div class="sx-tr th"><span>Data</span><span>Descrizione</span><span>Categoria</span><span>Importo</span></div>${ex.map(([t, c], i) => `<div class="sx-tr" style="--i:${i}"><span>${['24/10', '22/10', '21/10', '18/10'][i]}</span><span class="d">${esc(t)}</span><span><em class="sx-chip">${esc(c)}</em></span><span class="n">${eu(PRZ[i] * (i === 1 ? 1 : 4))}</span></div>`).join('')}
      <div class="sx-tr new"><span>oggi</span><span class="d">${esc(ex[1][0])}</span><span><em class="sx-chip ai">✦ ${esc(ex[1][1])}</em></span><span class="n">${eu(PRZ[1])}</span></div></div>`;
    if (k === 'fat') return `<div class="sx-split"><div class="sx-paper"><div class="pp-h"><i></i><i></i></div>${[80, 60, 90, 70, 85, 55].map((w, i) => `<span style="--w:${w}%;--i:${i}"></span>`).join('')}<div class="pp-t"><i></i></div><div class="sx-scan"></div></div>
      <div class="sx-fields">${[['Fornitore', 'Rossi Forniture S.r.l.'], ['Numero', 'FT 2026/1184'], ['Data', '24/10/2026'], ['Scadenza', '23/11/2026'], ['Totale', '€ 1.284,60']].map(([l, v], i) => `<div class="sx-fd" style="--i:${i}"><small>${l}</small><b>${v}</b></div>`).join('')}
        <div class="sx-lines">${ex.slice(0, 3).map(([t, c], i) => `<div style="--i:${i}"><span>${esc(t)}</span><em class="sx-chip">${esc(c)}</em></div>`).join('')}</div><div class="sx-ok">✓ Registrata · da pagare tra 30 giorni</div></div></div>`;
    if (k === 'prev') return `<div class="sx-split prev"><div class="sx-cat">${ex.map(([t], i) => `<div class="sx-pc" style="--i:${i}"><i class="ph p${i}"></i><b>${esc(t)}</b><span>${eu(PRZ[i])}</span><em class="${i < 3 ? 'in' : ''}">${i < 3 ? '✓ aggiunto' : '+ aggiungi'}</em></div>`).join('')}</div>
      <div class="sx-cart"><div class="sx-bh">Preventivo n. 87</div>${ex.slice(0, 3).map(([t], i) => `<div class="ln" style="--i:${i}"><span>${[2, 1, 5][i]} × ${esc(t.split(' ').slice(0, 3).join(' '))}</span><b>${eu(PRZ[i] * [2, 1, 5][i] * 1.3)}</b></div>`).join('')}
        <div class="rc"><span>Ricarico</span><div class="sl"><i></i></div><b>30%</b></div><div class="tt"><span>Totale</span><b data-cnt="${Math.round((PRZ[0] * 2 + PRZ[1] + PRZ[2] * 5) * 1.3 * 1.22)}" data-eur="1">€ 0</b></div><span class="sx-btn pdf">Scarica PDF</span></div></div>`;
    if (k === 'mag') return `<div class="sx-kpis three">${[['Articoli', 248, ''], ['Valore magazzino', 18460, 'eur'], ['Sotto scorta', 3, 'warn']].map(([l, v, c], i) => `<div class="sx-k" style="--i:${i}"><small>${l}</small><b data-cnt="${v}"${c === 'eur' ? ' data-eur="1"' : ''} class="${c}">0</b></div>`).join('')}</div>
      <div class="sx-table mag">${ex.map(([t], i) => `<div class="sx-tr" style="--i:${i}"><span class="d">${esc(t)}</span><span class="st"><i style="--w:${[72, 18, 55, 9][i]}%" class="${[72, 18, 55, 9][i] < 20 ? 'lo' : ''}"></i></span><span class="n">${[36, 4, 22, 2][i]} pz</span><span>${[72, 18, 55, 9][i] < 20 ? '<em class="sx-chip warn">da riordinare</em>' : '<em class="sx-chip okc">ok</em>'}</span></div>`).join('')}</div>
      <div class="sx-mv"><span class="in">▲ Carico +24 · ${esc(ex[0][0])}</span><span class="out">▼ Scarico −6 · DDT n. 48</span></div>`;
    if (k === 'ven') return `<div class="sx-ddt">${['Bianchi S.r.l.', 'Bianchi S.r.l.', 'Bianchi S.r.l.', 'Bianchi S.r.l.'].map((c, i) => `<div class="sx-d" style="--i:${i}"><b>DDT ${44 + i}</b><span>${['03', '10', '17', '24'][i]}/10 · ${c}</span><em>${eu([320, 415.5, 288, 506.4][i])}</em></div>`).join('')}</div>
      <div class="sx-arrow"><span class="sx-btn">Crea fattura di fine mese</span></div>
      <div class="sx-inv"><div><small>Fattura n. 112 · 31/10/2026</small><b>Bianchi S.r.l.</b><span>4 DDT raccolti · IVA 22%</span></div><div class="r"><b data-cnt="1874" data-eur="1">€ 0</b><span><em class="sx-chip">PDF</em><em class="sx-chip xml">XML per lo SdI</em></span></div></div>`;
    if (k === 'inc') return `<div class="sx-kpis three">${[['Incassato a ottobre', 38920, 'eur'], ['Media al giorno', 1297, 'eur'], ['Giorno migliore', 2480, 'eur']].map(([l, v], i) => `<div class="sx-k" style="--i:${i}"><small>${l}</small><b data-cnt="${v}" data-eur="1">€ 0</b></div>`).join('')}</div>
      <div class="sx-cal">${['L', 'M', 'M', 'G', 'V', 'S', 'D'].map(d => `<span class="h">${d}</span>`).join('')}<span></span><span></span>${Array.from({ length: 31 }, (_, i) => { const v = [.3, .45, .5, .55, .8, 1, .7][(i + 2) % 7] * (.75 + ((i * 37) % 25) / 100); return `<span class="d" style="--v:${v.toFixed(2)};--i:${i}">${i + 1}</span>`; }).join('')}</div>
      <div class="sx-mv"><span class="in">Contanti 42%</span><span class="pos">POS 51%</span><span class="alt">Altro 7%</span></div>`;
    if (k === 'for') return `<div class="sx-forn">${[['Rossi Forniture S.r.l.', cats[0], 14820, 1284.6], ['Metro Italia', cats[1] || cats[0], 9640, 0], ['Global Service', cats[2] || cats[0], 6210, 512], ['Edison Energia', 'Utenze', 3980, 0]].map(([n, c, a, d], i) => `<div class="sx-f" style="--i:${i}"><span class="av">${esc(n[0])}</span><div><b>${esc(n)}</b><span>${esc(c)}</span></div><div class="r"><small>Spesa 2026</small><b>${eu0(a)}</b>${d ? `<em class="sx-chip warn">da pagare ${eu(d)}</em>` : '<em class="sx-chip okc">tutto pagato</em>'}</div></div>`).join('')}</div>`;
    return '';
  }
  function showcase(s, cats, ex) {
    return `<section class="tr-sec tr-show" id="tr-show"><div class="tr-h rv"><span class="tr-eye">Dentro il gestionale</span><h2>Guarda come funziona</h2><p class="tr-sub">Le schermate vere, con esempi per la tua attività. Passano da sole, oppure scegli tu.</p></div>
      <div class="sx rv"><nav class="sx-tabs" role="tablist">${SHOW.map(([k, t], i) => `<button type="button" role="tab" data-sx="${k}" class="${i ? '' : 'on'}"><b>${esc(sxTxt(t, s))}</b><span>${esc(SHOW[i][2])}</span><i class="pg"></i></button>`).join('')}</nav>
        <div class="sx-stage"><div class="sx-win"><div class="sx-top"><i></i><i></i><i></i><span id="sx-url">centrodicosto · ${esc(sxTxt(SHOW[0][1], s))}</span></div><div class="sx-app"><aside class="sx-side">${SHOW.map(([k]) => `<i data-sxi="${k}" class="${k === 'dash' ? 'on' : ''}"></i>`).join('')}</aside><div class="sx-main" id="sx-main"></div></div></div>
          <ul class="sx-pts" id="sx-pts"></ul></div></div></section>`;
  }
  let sxK = 'dash', sxT = null, sxCtx = null;
  function sxShow(k, auto) {
    if (!root || !sxCtx) return; const [s, cats, ex] = sxCtx, it = SHOW.find(x => x[0] === k); if (!it) return;
    sxK = k;
    $$('.sx-tabs [data-sx]', root).forEach(b => { const on = b.dataset.sx === k; b.classList.toggle('on', on); if (on) { const pg = $('.pg', b); pg.style.animation = 'none'; void pg.offsetWidth; pg.style.animation = ''; b.classList.toggle('auto', !!auto); const tb = b.parentNode; if (tb.scrollWidth > tb.clientWidth) tb.scrollTo({ left: b.offsetLeft - tb.clientWidth / 2 + b.clientWidth / 2, behavior: reduced() ? 'auto' : 'smooth' }); } });
    $$('.sx-side [data-sxi]', root).forEach(i => i.classList.toggle('on', i.dataset.sxi === k));
    const m = $('#sx-main', root); m.innerHTML = `<div class="sx-h"><b>${esc(sxTxt(it[1], s))}</b><span>${esc(it[2])}</span></div>${showMock(k, s, cats, ex)}`;
    $('#sx-url', root).textContent = 'centrodicosto · ' + sxTxt(it[1], s);
    $('#sx-pts', root).innerHTML = it[3].map((p, i) => `<li style="--i:${i}">${esc(sxTxt(p, s))}</li>`).join('');
    $$('[data-cnt]', m).forEach(c => { c._done = 1; count(c); });
    const ty = $('.sx-type', m); if (ty) { const full = ty.dataset.type; let n = 0; const st = setInterval(() => { if (!root || !ty.isConnected) return clearInterval(st); ty.textContent = full.slice(0, ++n); if (n >= full.length) clearInterval(st); }, 90); }
    if (!reduced()) { clearTimeout(sxT); sxT = setTimeout(() => { const i = SHOW.findIndex(x => x[0] === sxK); sxShow(SHOW[(i + 1) % SHOW.length][0], true); }, auto === false ? 14000 : 6500); }
  }
  /* una giornata tipo */
  function dayline(s, ex) {
    const D = [['08:30', 'Apri la dashboard', 'Incassi di ieri, spese del mese e fatture in scadenza: sai subito come stai andando.', 'dash'],
      ['10:15', 'Arriva una fattura', `La fotografi: l'IA legge righe e importi e assegna le categorie, per esempio «${ex[0][0]}» → ${ex[0][1]}.`, 'fat'],
      ['12:00', 'Un cliente chiede un preventivo', 'Scegli dal catalogo, applichi il ricarico e mandi il PDF su WhatsApp mentre sei ancora al telefono.', 'prev'],
      ['16:00', 'Consegni la merce', 'Fai il DDT dal telefono: il magazzino si aggiorna da solo.', 'ven'],
      ['19:30', 'Chiudi la giornata', 'Segni l\'incasso: ricavi e utile del giorno si aggiornano senza fare conti.', 'inc'],
      ['Fine mese', 'Fatture in un clic', 'I DDT del mese diventano fatture con PDF e XML pronti per lo SdI.', 'ven']];
    return `<section class="tr-sec tr-day"><div class="tr-h rv"><span class="tr-eye">Una giornata con Centro di Costo</span><h2>Meno carte, più tempo per lavorare</h2><p class="tr-sub">Ecco come cambia una giornata qualsiasi in ${esc((PL[s.id] ? 'una delle ' + PL[s.id] : 'azienda'))}.</p></div>
      <ol class="tr-dl">${D.map(([h, t, d, k], i) => `<li class="rv" style="--d:${i * 90}ms"><span class="tm">${h}</span><span class="dot"></span><div class="dc"><b>${esc(t)}</b><p>${esc(d)}</p><button type="button" class="tr-lk" data-sxgo="${k}">Guarda la schermata →</button></div></li>`).join('')}</ol></section>`;
  }
  /* prima e dopo + calcolatore del tempo risparmiato */
  function beforeAfter() {
    const P = [['Fatture in una scatola, sulla mail e su WhatsApp', 'Tutte le fatture lette, archiviate e cercabili'], ['Un Excel diverso per ogni cosa', 'Un solo posto per spese, incassi, clienti e magazzino'], ['A fine mese non sai quanto hai guadagnato', 'Utile del mese sempre aggiornato'], ['Preventivi rifatti ogni volta da zero', 'Preventivi dal catalogo in pochi minuti'], ['Scopri che manca un articolo quando serve', 'Avviso automatico sotto scorta'], ['Ore a ricopiare DDT nelle fatture', 'Fattura di fine mese in un clic']];
    return `<section class="tr-sec tr-ba"><div class="tr-h rv"><h2>Prima e dopo</h2><p class="tr-sub">Le stesse cose che fai già, senza perdere tempo.</p></div>
      <div class="ba rv"><div class="ba-c no"><h3><span>✕</span>Senza gestionale</h3><ul>${P.map(([a], i) => `<li style="--i:${i}">${esc(a)}</li>`).join('')}</ul></div><div class="ba-arrow" aria-hidden="true">→</div><div class="ba-c yes"><h3><span>✓</span>Con Centro di Costo</h3><ul>${P.map(([, b], i) => `<li style="--i:${i}">${esc(b)}</li>`).join('')}</ul></div></div>
      <div class="calc rv"><div class="calc-l"><h3>Quanto tempo risparmi?</h3><p>Sposta i cursori con i numeri della tua attività.</p>
        ${[['f', 'Fatture fornitori al mese', 40, 200], ['p', 'Preventivi al mese', 15, 100], ['d', 'DDT o consegne al mese', 30, 300]].map(([k, l, v, mx]) => `<label class="calc-r"><span>${l}<b data-cv="${k}">${v}</b></span><input type="range" min="0" max="${mx}" value="${v}" data-calc="${k}"></label>`).join('')}</div>
        <div class="calc-o"><small>Tempo risparmiato</small><b id="calc-h">0</b><span>ore al mese</span><em id="calc-g"></em><p>Stima indicativa: fattura da 6 a 1 minuto, preventivo da 20 a 5, DDT da 8 a 2.</p></div></div></section>`;
  }
  function calcUpd() {
    if (!root) return; const v = k => +($(`[data-calc="${k}"]`, root) || {}).value || 0;
    ['f', 'p', 'd'].forEach(k => { const b = $(`[data-cv="${k}"]`, root); if (b) b.textContent = v(k); });
    const h = (v('f') * 5 + v('p') * 15 + v('d') * 6) / 60, el = $('#calc-h', root); if (!el) return;
    const from = +el.dataset.v || 0; el.dataset.v = h;
    const t0 = performance.now(); const f = t => { const k = Math.min(1, (t - t0) / 500), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(from + (h - from) * e); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f);
    $('#calc-g', root).textContent = `≈ ${Math.round(h * 12 / 8)} giornate di lavoro all'anno`;
  }
  /* domande frequenti */
  const FAQ = [['Devo installare qualcosa?', 'No. Si apre dal browser su PC, tablet e telefono. Sul telefono puoi aggiungerlo alla schermata Home e si usa come un\'app.'],
    ['Dove sono i miei dati?', 'Ogni azienda ha il suo archivio separato: solo tu e i collaboratori a cui dai l\'accesso potete vederlo. Le password non vengono mai salvate in chiaro.'],
    ['Posso provarlo prima?', 'Sì: la demo si apre senza registrazione, con dati di esempio della tua attività. Niente di quello che fai viene salvato.'],
    ['Fa la fattura elettronica?', 'Prepara il PDF e il file XML nel formato FatturaPA, pronti da caricare sul portale dell\'Agenzia delle Entrate o dal tuo intermediario.'],
    ['Posso importare i dati che ho già?', 'Sì: fatture, file Excel e storico. Te li importo io all\'avvio, così parti subito senza ricopiare nulla.'],
    ['Possono usarlo i miei collaboratori?', 'Sì, ognuno con il suo accesso. Puoi decidere chi può modificare, chi può solo consultare e quali sezioni vede.'],
    ['Quanto costa?', 'Avvio una tantum di 1.000 € (preparazione su misura, import dei tuoi dati e formazione) e poi 79 € al mese, prezzi IVA esclusa. Nel canone ci sono aggiornamenti, assistenza, backup e utenti illimitati.'],
    ['E se mi serve una funzione che non c\'è?', 'Me lo dici e la aggiungo: il gestionale cresce insieme alla tua attività.']];
  /* v115: prezzi */
  function priceSec() {
    const chk = '<svg viewBox="0 0 24 24"><path d="M5 12.5 10 17l9-10"/></svg>';
    const A = ['Gestionale preparato su misura per la tua attività', 'Import di fatture, articoli, clienti e listini che hai già', 'Cataloghi dei tuoi fornitori con foto e codici', 'Logo e dati della tua azienda su preventivi, DDT e fatture', 'Formazione per te e i tuoi collaboratori'];
    const B = ['Tutte le sezioni che ti servono, su PC, tablet e telefono', 'Utenti e collaboratori illimitati, con i loro permessi', 'Aggiornamenti e funzioni nuove sempre inclusi', 'Assistenza diretta via email, telefono e WhatsApp', 'Backup automatico: i dati restano solo tuoi'];
    return `<section class="tr-sec tr-price" id="tr-price"><div class="tr-h rv"><h2>Prezzi chiari, senza sorprese</h2><p class="tr-sub">Un avvio su misura e un canone mensile. Niente costi nascosti, niente vincoli di anni.</p></div>
      <div class="pr-grid">
        <article class="pr-c rv"><span class="pr-k">Avvio</span><div class="pr-v"><b>1.000 €</b><span>una tantum</span></div><p class="pr-d">Preparo il gestionale insieme a te e lo consegno pronto da usare.</p><ul>${A.map(x => `<li>${chk}${esc(x)}</li>`).join('')}</ul></article>
        <article class="pr-c pr-main rv" style="--d:120ms"><span class="pr-badge">Tutto incluso</span><span class="pr-k">Canone</span><div class="pr-v"><b>79 €</b><span>al mese</span></div><p class="pr-d">Usi il gestionale ogni giorno, con tutto quello che serve per farlo crescere.</p><ul>${B.map(x => `<li>${chk}${esc(x)}</li>`).join('')}</ul>
          <button type="button" class="tr-btn glow pr-cta" data-tr="req">Richiedi il tuo gestionale</button></article>
      </div>
      <p class="pr-note rv">Prezzi IVA esclusa. Il primo anno: 1.000 € di avvio + 79 € al mese. Funzioni su misura in più? Ti preparo un preventivo a parte.</p></section>`;
  }
  function faq() { return `<section class="tr-sec tr-faq" id="tr-faq"><div class="tr-h rv"><h2>Domande frequenti</h2></div><div class="fq rv">${FAQ.map(([q, a], i) => `<details${i ? '' : ' open'}><summary>${esc(q)}<i></i></summary><p>${esc(a)}</p></details>`).join('')}</div></section>`; }


  /* ===== v107: altre sezioni con esempi ===== */
  // 1. dal telefono: tre schermate che si alternano
  function phoneSec(s, ex) {
    return `<section class="tr-sec tr-phone" id="tr-phone"><div class="pho-l rv"><span class="tr-eye">Anche dal telefono</span><h2>Il gestionale in tasca</h2><p class="tr-sub">Tutto quello che fai dal computer lo fai anche dal telefono, quando sei in giro o sul posto.</p>
        <ul class="pho-pts">${[['cam', 'Fotografi le fatture', 'Inquadri il foglio: righe, importi e categorie si compilano da soli.'], ['sig', 'DDT firmati sul posto', 'Il cliente firma col dito sullo schermo, il PDF parte subito.'], ['bel', 'Sempre aggiornato', 'Incassi, utile e scadenze a portata di mano, ovunque sei.']].map(([k, t, d], i) => `<li data-ph="${i}" class="${i ? '' : 'on'}"><span class="pi">${i + 1}</span><div><b>${t}</b><p>${d}</p></div></li>`).join('')}</ul></div>
      <div class="pho-r rv"><div class="phone"><i class="notch"></i><div class="ph-scr">
        <div class="ph-s s0 on"><div class="ph-h">Nuova fattura</div><div class="ph-cam"><div class="ph-doc">${[80, 55, 90, 65, 85, 50, 70].map(w => `<span style="--w:${w}%"></span>`).join('')}</div><i class="c1"></i><i class="c2"></i><i class="c3"></i><i class="c4"></i><i class="ph-scan"></i></div><div class="ph-res"><b>✓ Fattura letta</b><span>${esc(ex[0][0])}</span><em>${esc(ex[0][1])}</em></div></div>
        <div class="ph-s s1"><div class="ph-h">DDT n. 49 · firma</div><div class="ph-sig"><svg viewBox="0 0 200 80"><path d="M10 55 C 30 10, 45 70, 60 40 S 85 20, 95 45 S 120 70, 135 30 S 160 25, 190 50" pathLength="1"/></svg><span>Firma del cliente</span></div><div class="ph-btn">Salva e invia PDF</div></div>
        <div class="ph-s s2"><div class="ph-h">Oggi</div><div class="ph-kpi"><small>Utile del mese</small><b>€ 17.130</b><em>▲ 38%</em></div><div class="ph-bars">${[40, 55, 48, 62, 70, 86].map((h, i) => `<i style="--h:${h}%;--i:${i}"></i>`).join('')}</div><div class="ph-al"><span>⚠</span>Fattura Rossi in scadenza tra 3 giorni</div></div>
      </div></div></div></section>`;
  }
  // 2. analisi con l'intelligenza artificiale (chat)
  function aiSec(s, cats) {
    const c0 = cats[0] || 'Materie prime', c1 = cats[1] || 'Utenze', sd = (s.sede || ['Sede', 'Sedi'])[0];
    return `<section class="tr-sec tr-ai"><div class="ai-wrap rv"><div class="ai-l"><span class="tr-eye">Analisi con l'IA</span><h2>Chiedi, e il gestionale ti risponde</h2><p class="tr-sub">L'intelligenza artificiale legge i tuoi numeri e ti dice dove intervenire, in parole semplici.</p>
        <div class="ai-q">${['Dove posso risparmiare?', 'Come va rispetto all\'anno scorso?', 'Quale fornitore mi costa di più?'].map(q => `<span>${q}</span>`).join('')}</div></div>
      <div class="ai-chat"><div class="m u">Dove posso risparmiare questo mese?</div><div class="m t"><i></i><i></i><i></i></div>
        <div class="m a"><b>Ecco cosa vedo a ottobre:</b><ul><li><em class="bad">▲ 18%</em> la spesa per <b>${esc(c0)}</b> è salita rispetto a settembre: due fornitori hanno alzato i prezzi.</li><li><em class="ok">−€ 240</em> raggruppando gli ordini di <b>${esc(c1)}</b> in uno solo al mese risparmi sul trasporto.</li><li><em class="warn">!</em> ${esc(sd)} Milano costa il 22% in più delle altre: controlla le ultime 5 fatture.</li></ul></div></div></div></section>`;
  }
  // 3. il PDF che riceve il cliente
  function pdfSec(s, ex) {
    const rows = ex.slice(0, 3).map(([t], i) => [t, [4, 1, 10][i], [PRZ[0], PRZ[1], PRZ[2]][i] * 1.3]);
    const imp = rows.reduce((a, r) => a + r[1] * r[2], 0);
    return `<section class="tr-sec tr-pdf"><div class="pdf-l rv"><span class="tr-eye">Esempio reale</span><h2>Il preventivo che riceve il tuo cliente</h2><p class="tr-sub">Con il tuo logo, le foto dei prodotti e i totali già calcolati. Pronto in pochi minuti, da mandare su WhatsApp o per email.</p>
        <ul class="tr-pts"><li><b>Foto e codici</b> presi dai cataloghi dei fornitori</li><li><b>Ricarico e sconti</b> per ogni cliente, senza calcolatrice</li><li><b>Stesso stile</b> anche per DDT e fatture</li></ul></div>
      <div class="pdf-r rv"><div class="slot"></div><div class="paper"><div class="pd-h"><div class="pd-logo"><img src="logo.svg" alt="" width="28" height="28"><b>La tua azienda S.r.l.</b></div><div class="pd-n"><small>PREVENTIVO</small><b>n. 87 / 2026</b><span>27/10/2026</span></div></div>
        <div class="pd-c"><small>Spett.le</small><b>Bianchi S.r.l.</b><span>Via Roma 12 · 00184 Roma</span></div>
        <div class="pd-t"><div class="pd-r th"><span></span><span>Articolo</span><span>Q.tà</span><span>Prezzo</span><span>Totale</span></div>${rows.map(([t, q, p], i) => `<div class="pd-r" style="--i:${i}"><i class="ph p${i}"></i><span>${esc(t)}</span><span>${q}</span><span>${eu(p)}</span><span>${eu(p * q)}</span></div>`).join('')}</div>
        <div class="pd-tot"><div><span>Imponibile</span><b>${eu(imp)}</b></div><div><span>IVA 22%</span><b>${eu(imp * .22)}</b></div><div class="g"><span>Totale</span><b>${eu(imp * 1.22)}</b></div></div>
        <div class="pd-f">Validità 30 giorni · Pagamento: bonifico 30 gg d.f.f.m.</div></div></div></section>`;
  }
  // 4. dati che entrano e che escono
  function flowSec() {
    const IC2 = { cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>', pdf: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>', xls: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M4 15h16M10 4v16"/>', xml: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13 6l-2 12"/>', bk: '<path d="M12 3a9 9 0 1 0 9 9"/><path d="M21 3v6h-6"/><path d="M12 8v4l3 2"/>' };
    const IN = [['cam', 'Foto delle fatture'], ['pdf', 'PDF dei fornitori'], ['xls', 'File Excel'], ['xml', 'Fatture XML']], OUT = [['pdf', 'Preventivi in PDF'], ['xml', 'Fatture XML per lo SdI'], ['xls', 'Excel per il commercialista'], ['bk', 'Backup automatico']];
    return `<section class="tr-sec tr-flow"><div class="tr-h rv"><span class="tr-eye">Entra di tutto, esce quello che ti serve</span><h2>Lavora con quello che hai già</h2><p class="tr-sub">Non serve cambiare abitudini: porti dentro i documenti che ricevi e tiri fuori quelli che devi mandare.</p></div>
      <div class="flow rv">${IN.map(([ic, t], i) => `<div class="fl-n in" style="grid-row:${i + 1}"><span><svg viewBox="0 0 24 24">${IC2[ic]}</svg></span>${t}</div><div class="fl-w l" style="grid-row:${i + 1};--i:${i}"><i></i></div>`).join('')}
        <div class="fl-hub"><img src="logo.svg" alt="" width="54" height="54"><b>Centro di Costo</b><span>legge, classifica e archivia</span><i class="r1"></i><i class="r2"></i></div>
        ${OUT.map(([ic, t], i) => `<div class="fl-w r" style="grid-row:${i + 1};--i:${i}"><i></i></div><div class="fl-n out" style="grid-row:${i + 1}"><span><svg viewBox="0 0 24 24">${IC2[ic]}</svg></span>${t}</div>`).join('')}</div></section>`;
  }
  // 5. chi può fare cosa
  function rolesSec(s) {
    const acq = s.acq || 'Acquisti';
    const R = [['Titolare', 'Tu', 'Vede e modifica tutto', [1, 1, 1, 1, 1], 'ok'], ['Collaboratore', 'In ufficio o in negozio', 'Modifica solo le sue sezioni', [1, 1, 0, 1, 0], 'acc'], ['Commercialista', 'Consulente esterno', 'Vede tutto, non modifica nulla', [1, 1, 1, 0, 1], 'ro']];
    const SEC = ['Dashboard', acq, 'Incassi e utile', 'Magazzino', 'Fatture fornitori'];
    return `<section class="tr-sec tr-roles"><div class="tr-h rv"><span class="tr-eye">Accessi e permessi</span><h2>Ognuno vede solo quello che deve</h2><p class="tr-sub">Ogni persona entra con il suo account. Decidi tu chi può modificare, chi può solo consultare e quali sezioni vede.</p></div>
      <div class="roles">${R.map(([t, w, d, on, k], i) => `<article class="role rv" style="--d:${i * 110}ms"><div class="rh"><span class="ra k-${k}">${t[0]}</span><div><b>${t}</b><small>${w}</small></div></div><span class="rp k-${k}">${d}</span><ul>${SEC.map((x, j) => `<li class="${on[j] ? 'y' : 'n'}" style="--j:${j}"><span>${esc(x)}</span><i></i></li>`).join('')}</ul></article>`).join('')}</div></section>`;
  }

  let root = null, opts = {}, sel = 'veicoli', obs = null, timers = [];
  const SET = () => window.CDC_SETTORI || { list: [], get: () => null };

  // scena animata dell'apertura: finestra della dashboard + card in vetro che si muovono
  const MESI = ['mag', 'giu', 'lug', 'ago', 'set', 'ott'];
  function heroScene(s, cats, ex) {
    const C3 = cats.slice(0, 3);
    return `<div class="tr-scene" id="tr-scene" aria-hidden="true">
      <div class="ts-win" style="--z:14">
        <div class="ts-top"><i></i><i></i><i></i><span>Dashboard · ${esc(s.s || s.n || 'La tua azienda')}</span><em class="ts-live">dal vivo</em></div>
        <div class="ts-body">
          <div class="ts-kpis"><div><small>Incassi</small><b data-k="inc">€ 0</b></div><div><small>Spese</small><b data-k="spe">€ 0</b></div><div class="u"><small>Utile</small><b data-k="ut">€ 0</b><em data-k="dl">+12%</em></div></div>
          <svg class="ts-chart" viewBox="0 0 400 130" preserveAspectRatio="none"><defs><linearGradient id="ts-ga" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#5fd3a5" stop-opacity=".35"/><stop offset="1" stop-color="#5fd3a5" stop-opacity="0"/></linearGradient></defs>
            ${[26, 60, 94].map(y => `<line x1="0" x2="400" y1="${y}" y2="${y}" class="gl"/>`).join('')}
            <path class="ar" d=""/><path class="li" d="" pathLength="1"/><path class="ls" d="" pathLength="1"/><circle class="dt" r="5"/></svg>
          <div class="ts-mo">${MESI.map(m => `<span>${m}</span>`).join('')}</div>
        </div>
      </div>
      <div class="ts-card ts-donut" style="--z:28;--d:1"><svg viewBox="0 0 42 42"><circle class="t" r="15.9" cx="21" cy="21"/>${[0, 1, 2, 3].map(i => `<circle class="sg g${i}" r="15.9" cx="21" cy="21" pathLength="100"/>`).join('')}</svg>
        <div class="ts-lg"><small>Spese per categoria</small>${C3.map((c, i) => `<span class="g${i}"><i></i>${esc(c)}</span>`).join('')}</div></div>
      <div class="ts-card ts-ai" style="--z:22;--d:2"><div class="ts-aih"><span class="ts-spark">✦</span>Fattura letta dall'IA</div>
        ${ex.slice(0, 3).map(([t, c], i) => `<div class="ts-air" style="--i:${i}"><span>${esc(t)}</span><em>${esc(c)}</em></div>`).join('')}</div>
      <div class="ts-toast" style="--z:36"><span class="ts-ti"></span><div><b></b><small></small></div></div>
    </div>`;
  }
  // curva morbida tra i punti
  function curve(pts, W, H) {
    const P = pts.map((y, i) => [i / (pts.length - 1) * W, H - 10 - y * (H - 22)]);
    let d = `M0 ${P[0][1].toFixed(1)}`;
    for (let i = 0; i < P.length - 1; i++) { const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2; d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`; }
    return { d, end: P[P.length - 1] };
  }
  const SCN = [
    { inc: 32480, spe: 20000, dl: '+12%', a: [.35, .45, .40, .62, .58, .80], b: [.30, .32, .38, .36, .42, .40], c: [38, 27, 20, 15] },
    { inc: 41250, spe: 22370, dl: '+21%', a: [.30, .38, .55, .50, .72, .90], b: [.28, .34, .32, .40, .38, .44], c: [32, 30, 24, 14] },
    { inc: 28940, spe: 19480, dl: '+6%', a: [.42, .36, .48, .45, .52, .60], b: [.36, .30, .40, .38, .44, .42], c: [44, 22, 20, 14] },
    { inc: 36700, spe: 21390, dl: '+15%', a: [.25, .40, .36, .58, .68, .76], b: [.32, .30, .36, .44, .40, .46], c: [35, 31, 19, 15] }
  ];
  const TOASTS = [['doc', 'Fattura registrata', '14 righe · categorie assegnate'], ['in', 'Incasso del giorno', '+ € 1.240,00 · cassa'], ['ok', 'Preventivo inviato', 'PDF con foto dei prodotti'], ['warn', 'Sotto scorta', '3 articoli da riordinare'], ['ddt', 'Fattura di fine mese', '6 DDT raccolti · XML pronto']];
  const TI = { doc: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>', in: '<path d="M12 19V5M5 12l7-7 7 7"/>', ok: '<path d="m5 12.5 4.5 4.5L19 7.5"/>', warn: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/>', ddt: '<path d="M2 7h11v9H2zM13 10h4l3 3v3h-7z"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/>' };
  let scn = 0, cur = null, tIdx = 0;
  const eurF = v => '€ ' + Math.round(v).toLocaleString('it-IT');
  const easeIO = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  function sceneSet(i, instant) {
    const sc = $('#tr-scene', root); if (!sc) return;
    const S = SCN[i % SCN.length], from = cur || { inc: 0, spe: 0, a: S.a.map(() => 0.3), b: S.b.map(() => 0.3) };
    $('[data-k="dl"]', sc).textContent = S.dl;
    let off = 0; $$('.ts-donut .sg', sc).forEach((c, k) => { c.setAttribute('stroke-dasharray', `${S.c[k] - 1} ${101 - S.c[k]}`); c.setAttribute('stroke-dashoffset', -off); off += S.c[k]; });
    const draw = (k) => {
      const v = { inc: from.inc + (S.inc - from.inc) * k, spe: from.spe + (S.spe - from.spe) * k, a: from.a.map((y, j) => y + (S.a[j] - y) * k), b: from.b.map((y, j) => y + (S.b[j] - y) * k) };
      const A = curve(v.a, 400, 130), B = curve(v.b, 400, 130);
      $('.ts-chart .li', sc).setAttribute('d', A.d); $('.ts-chart .ls', sc).setAttribute('d', B.d); $('.ts-chart .ar', sc).setAttribute('d', `${A.d} L400 130 L0 130 Z`);
      const dt = $('.ts-chart .dt', sc); dt.setAttribute('cx', A.end[0]); dt.setAttribute('cy', A.end[1]);
      $('[data-k="inc"]', sc).textContent = eurF(v.inc); $('[data-k="spe"]', sc).textContent = eurF(v.spe); $('[data-k="ut"]', sc).textContent = eurF(v.inc - v.spe);
      cur = v;
    };
    if (instant || reduced()) return draw(1);
    const t0 = performance.now(), dur = 1300;
    const f = t => { if (!root) return; const k = Math.min(1, (t - t0) / dur); draw(easeIO(k)); if (k < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  }
  function toastNext() {
    const t = $('.ts-toast', root); if (!t) return;
    const [k, a, b] = TOASTS[tIdx++ % TOASTS.length];
    t.classList.remove('show');
    setTimeout(() => { if (!root) return; const ic = $('.ts-ti', t); ic.className = 'ts-ti k-' + k; ic.innerHTML = `<svg viewBox="0 0 24 24">${TI[k]}</svg>`; $('b', t).textContent = a; $('small', t).textContent = b; t.classList.add('show'); }, 420);
  }
  function aiCycle() {
    const rows = $$('.ts-air', root); if (!rows.length) return;
    rows.forEach(r => r.classList.remove('on')); rows.forEach((r, i) => setTimeout(() => r.classList.add('on'), 350 + i * 650));
  }
  function render() {
    const S = SET(), s = S.get(sel) || S.list[0] || { n: '', s: '', sede: ['Sede', 'Sedi'], cat: [] };
    const cats = s.cat ? [...new Set(s.cat.map(c => c[0]))] : VEI_CAT, C = opts.contatti || {};
    const word = PL[s.id] || (s.s || s.n || '').toLowerCase();
    const ex = EX[s.id] || EX.altro;
    const mail = `mailto:${C.email}?subject=${encodeURIComponent('Centro di Costo · ' + (s.n || ''))}&body=${encodeURIComponent(`Ciao ${C.nome || ''},\nvorrei maggiori informazioni sul gestionale per la mia attività (${s.n || ''}).\n\nAzienda:\nCittà:\nCosa mi servirebbe:\n`)}`;
    sxCtx = [s, cats, ex];
    root.innerHTML = `<div class="tr-scroll">
      <header class="tr-bar"><i class="tr-prog" id="tr-prog"></i><div class="tr-brand"><img src="logo.svg" alt="" width="30" height="30"><b>Centro di Costo</b></div>
        <nav class="tr-nav"><a href="#tr-show" data-go>Come funziona</a><a href="#tr-phone" data-go>Telefono</a><a href="#tr-funz" data-go>Funzioni</a><a href="#tr-how" data-go>Su misura</a><a href="#tr-price" data-go>Prezzi</a><a href="#tr-faq" data-go>Domande</a></nav><div class="tr-bar-r"><a class="tr-btn ghost sm" href="${esc(mail)}">Contattami</a><button type="button" class="tr-x" data-tr="close" aria-label="Chiudi">✕</button></div></header>

      <section class="tr-hero">
        <div class="th-bg" aria-hidden="true"><i class="b1"></i><i class="b2"></i><i class="b3"></i><i class="grid"></i></div>
        <div class="tr-hl">
          <span class="tr-eye"><i></i>Gestionale aziendale su misura</span>
          <h1>Il gestionale su misura per <span class="tr-rot" data-word><b>${esc(word)}</b></span></h1>
          <p>Quanto incassi, quanto spendi e quanto ti resta. Fornitori, preventivi, clienti, magazzino e fatture in un unico posto, su PC e telefono. Preparato su misura per come lavori, e personalizzabile quanto vuoi.</p>
          <div class="tr-cta">${opts.demo ? '' : `<button type="button" class="tr-btn glow" data-tr="demo"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>Prova la demo</button>`}<button type="button" class="tr-btn ${opts.demo ? 'glow' : 'white'}" data-tr="req">Richiedi il tuo gestionale</button><a class="tr-btn glass" href="${esc(mail)}">Scrivimi</a></div>
          <ul class="tr-trust"><li>Pronto in pochi giorni</li><li>I dati restano solo tuoi</li><li>PC, tablet e telefono</li></ul>
        </div>
        <div class="tr-hr">${heroScene(s, cats, ex)}</div>
      </section>

      <section class="tr-sets"><div class="tr-setsc rv"><div class="tr-setsh"><h2>Scegli la tua attività</h2><p class="tr-sub">Nomi, sezioni e categorie si adattano da soli.</p></div>
        <div class="tr-chips">${S.list.map(x => `<button type="button" class="tr-chip${x.id === sel ? ' on' : ''}" data-trset="${x.id}"><svg viewBox="0 0 24 24">${x.ic}</svg>${esc(x.s || x.n)}</button>`).join('')}</div></div></section>

${showcase(s, cats, ex)}
      ${phoneSec(s, ex)}
      <section class="tr-sec" id="tr-funz"><div class="tr-h rv"><h2>Tutto quello che serve, in un posto solo</h2><p class="tr-sub">Ogni funzione si accende o si spegne: tieni solo quello che usi.</p></div>
        <div class="tr-grid">${FEAT.map(([k, t, d], i) => `<article class="tr-f rv" style="--d:${(i % 3) * 90}ms"><span class="tr-fn">${String(i + 1).padStart(2, '0')}</span><div class="tr-ill">${ILL[k]}</div><h3>${t}${SOON.has(k) ? '<span class="tr-soon">in arrivo</span>' : ''}</h3><p>${d}</p></article>`).join('')}</div></section>

${aiSec(s, cats)}
      ${pdfSec(s, ex)}
      ${dayline(s, ex)}
      <section class="tr-sec tr-fit"><div class="tr-fit-l rv"><span class="tr-eye">Per ${esc(word)}</span><h2>Parla la lingua della tua attività</h2>
          <ul class="tr-pts"><li><b>${esc(s.sede ? s.sede[1] : 'Sedi')}</b> al posto di sedi generiche: confronti le spese tra ${s.sede && s.sede[2] ? 'le tue' : 'i tuoi'} ${esc((s.sede ? s.sede[1] : 'sedi').toLowerCase())}</li><li><b>${cats.length} categorie di spesa</b> già pronte e modificabili</li><li><b>Ogni riga riconosciuta da sola</b>: scrivi o importi, la categoria si assegna in automatico</li></ul>
          <div class="tr-cats">${cats.map((c, i) => `<span style="--i:${i}">${esc(c)}</span>`).join('')}</div></div>
        <div class="tr-fit-r rv"><div class="tr-cls" aria-hidden="true"><div class="cl-h">Riconoscimento automatico</div>${ex.map(([t, c], i) => `<div class="cl-r" style="--i:${i}"><span class="cl-t">${esc(t)}</span><span class="cl-a"></span><span class="cl-c">${esc(c)}</span></div>`).join('')}</div></div>
      </section>

      <section class="tr-sec tr-num rv"><div class="th-bg" aria-hidden="true"><i class="b1"></i><i class="b2"></i><i class="grid"></i></div>${[[17, '', 'fornitori con catalogo'], [25000, '+', 'codici prodotto con foto'], [11, '', 'attività già pronte'], [24, '/7', 'da PC e telefono']].map(([n, u, l]) => `<div><b data-cnt="${n}" data-u="${u}">0</b><span>${l}</span></div>`).join('')}</section>

${flowSec()}
      ${beforeAfter()}
      ${rolesSec(s)}
      <section class="tr-sec tr-how" id="tr-how"><div class="tr-h rv"><h2>Su misura, davvero</h2><p class="tr-sub">Non un programma uguale per tutti: il tuo gestionale lo preparo io, insieme a te.</p></div>
        <ol class="tr-steps">${STEPS.map(([t, d], i) => `<li class="rv" style="--d:${i * 120}ms"><span class="n">${i + 1}</span><b>${t}</b><p>${d}</p></li>`).join('')}</ol>
        <div class="tr-wish rv"><h3>Pensi a qualcosa che non c'è? Lo aggiungo.</h3><div class="tr-wl">${WISH.map((w, i) => `<span style="--i:${i}">${esc(w)}</span>`).join('')}</div><p class="tr-wish-p">…e tutto quello che ti serve: scrivimelo.</p></div></section>

${priceSec()}
${faq()}
      <section class="tr-sec tr-end rv"><div class="tr-card"><div class="th-bg" aria-hidden="true"><i class="b1"></i><i class="b3"></i><i class="grid"></i></div><div><h2>Parliamone</h2><p>Raccontami di cosa hai bisogno: ti rispondo personalmente e ti preparo una proposta per la tua attività.</p>
          <div class="tr-who"><span class="tr-av">${esc(String(C.nome || 'D')[0])}</span><span><b>${esc(C.nome || '')}</b><small>${esc(C.email || '')}${C.tel ? ' · ' + esc(C.tel) : ''}</small></span></div></div>
        <div class="tr-cta col"><a class="tr-btn" href="${esc(mail)}">Scrivimi una email</a>${C.wa ? `<a class="tr-btn alt" href="https://wa.me/${esc(C.wa)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}${C.tel ? `<a class="tr-btn alt" href="tel:${esc(String(C.tel).replace(/\s+/g, ''))}">Chiama ${esc(C.tel)}</a>` : ''}<button type="button" class="tr-btn ghost" data-tr="req">Richiedi il tuo gestionale</button>${opts.demo ? '' : '<button type="button" class="tr-btn ghost" data-tr="demo">Prova la demo</button>'}</div></div>
        <p class="tr-foot">Centro di Costo · gestionale aziendale</p></section>
    </div>`;
    wire();
  }
  function count(el) {
    const to = +el.dataset.cnt, u = el.dataset.u || '', eur = /€/.test(el.textContent);
    const fmt = v => el.dataset.eur ? '€ ' + Math.round(v).toLocaleString('it-IT') : Math.round(v).toLocaleString('it-IT') + (eur ? ' €' : u);
    if (reduced()) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), dur = 1400;
    const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(to * e); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  function wire() {
    obs && obs.disconnect(); timers.forEach(clearInterval); timers = [];
    const sc = $('.tr-scroll', root);
    obs = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; e.target.classList.add('in'); $$('[data-cnt]', e.target).forEach(c => { if (!c._done) { c._done = 1; count(c); } }); obs.unobserve(e.target); }), { root: sc, threshold: .18 });
    $$('.rv', root).forEach(el => obs.observe(el));
    // parola del titolo che scorre tra le attività finché non ne scegli una
    const w = $('[data-word]', root), L = SET().list;
    if (w && !opts.fixed && !reduced() && L.length) {
      let i = Math.max(0, L.findIndex(x => x.id === sel));
      timers.push(setInterval(() => {
        i = (i + 1) % L.length;
        const old = $('b:not(.out)', w), nw = document.createElement('b');
        w.style.width = w.getBoundingClientRect().width + 'px';
        nw.textContent = PL[L[i].id] || (L[i].s || L[i].n).toLowerCase(); nw.className = 'in'; w.appendChild(nw);
        void w.offsetWidth; w.style.width = nw.getBoundingClientRect().width + 'px';
        if (old) { old.classList.add('out'); setTimeout(() => old.remove(), 700); }
        setTimeout(() => nw.classList.remove('in'), 30);
      }, 2600));
    }
    // scena dell'apertura: dati che cambiano, notifiche, righe lette dall'IA
    cur = null; sceneSet(scn, true); setTimeout(() => { if (root) { $('#tr-scene', root) && $('#tr-scene', root).classList.add('on'); toastNext(); aiCycle(); } }, 250);
    if (!reduced()) {
      timers.push(setInterval(() => { if (!document.hidden) sceneSet(++scn); }, 4200));
      timers.push(setInterval(() => { if (!document.hidden) toastNext(); }, 3400));
      timers.push(setInterval(() => { if (!document.hidden) aiCycle(); }, 5200));
    }
    // telefono: le tre schermate si alternano
    let phI = 0; const phGo = i => { phI = i; $$('.ph-s', root).forEach((x, k) => x.classList.toggle('on', k === i)); $$('.pho-pts [data-ph]', root).forEach((x, k) => x.classList.toggle('on', k === i)); };
    if (!reduced()) timers.push(setInterval(() => { if (!document.hidden && root) phGo((phI + 1) % 3); }, 3800));
    $$('.pho-pts [data-ph]', root).forEach(li => { li.onclick = () => phGo(+li.dataset.ph); });
    // schermate di esempio e calcolatore
    clearTimeout(sxT); sxShow(sxK, true); calcUpd();
    // movimento con il mouse, luce sulle card, barra di avanzamento
    const scene = $('#tr-scene', root), hero = $('.tr-hero', root), prog = $('#tr-prog', root);
    if (hero && scene && matchMedia('(hover: hover)').matches && !reduced()) hero.onpointermove = e => { const r = hero.getBoundingClientRect(); scene.style.setProperty('--px', ((e.clientX - r.left) / r.width - .5).toFixed(3)); scene.style.setProperty('--py', ((e.clientY - r.top) / r.height - .5).toFixed(3)); };
    $$('.tr-f', root).forEach(f => { f.onpointermove = e => { const r = f.getBoundingClientRect(); f.style.setProperty('--mx', (e.clientX - r.left) + 'px'); f.style.setProperty('--my', (e.clientY - r.top) + 'px'); }; });
    if (prog) sc.onscroll = () => { prog.style.transform = `scaleX(${Math.min(1, sc.scrollTop / Math.max(1, sc.scrollHeight - sc.clientHeight))})`; };
  }
  function onClick(e) {
    const sxb = e.target.closest('[data-sx]'); if (sxb) { sxShow(sxb.dataset.sx, false); return; }
    const sxg = e.target.closest('[data-sxgo]'); if (sxg) { sxShow(sxg.dataset.sxgo, false); const t = $('#tr-show', root); t && t.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }); return; }
    const gl = e.target.closest('a[data-go]'); if (gl) { e.preventDefault(); const t = $(gl.getAttribute('href'), root); t && t.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }); return; }
    const a = e.target.closest('[data-tr]'), c = e.target.closest('[data-trset]');
    if (c) { sel = c.dataset.trset; opts.fixed = true; const y = $('.tr-scroll', root).scrollTop; render(); const s2 = $('.tr-scroll', root); s2.scrollTop = y; $$('.rv', root).forEach(el => el.classList.add('in')); return; }
    if (!a) return;
    const k = a.dataset.tr;
    if (k === 'close') close();
    if (k === 'demo') { close(); opts.onDemo && opts.onDemo(); }
    if (k === 'req') { close(); opts.onRequest && opts.onRequest(sel); }
  }
  function onKey(e) { if (e.key === 'Escape') close(); }
  function close() {
    if (!root) return;
    timers.forEach(clearInterval); timers = []; obs && obs.disconnect(); clearTimeout(sxT);
    root.classList.add('bye'); document.removeEventListener('keydown', onKey);
    const st = document.getElementById('setup'); if (st) st.inert = false;
    const r = root; root = null; setTimeout(() => { r.remove(); document.body.classList.remove('tr-open'); }, reduced() ? 0 : 260);
  }
  function open(o) {
    opts = o || {}; sel = opts.settore || 'veicoli'; opts.fixed = !!opts.settore && opts.settore !== 'veicoli';
    if (root) root.remove();
    root = document.createElement('div');
    if (!$('link[data-tour]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'tour.css?v=' + (opts.v || 1); l.dataset.tour = 1; const r0 = root; r0.style.visibility = 'hidden'; l.onload = l.onerror = () => { r0.style.visibility = ''; }; document.head.appendChild(l); } root.id = 'tour'; root.className = 'tour'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Scopri cosa può fare il gestionale');
    try { document.activeElement && document.activeElement.blur(); } catch {}
    const st = document.getElementById('setup'); if (st) st.inert = true;
    document.body.appendChild(root); document.body.classList.add('tr-open');
    root.addEventListener('click', onClick); document.addEventListener('keydown', onKey);
    root.addEventListener('input', e => { if (e.target.matches('[data-calc]')) calcUpd(); });
    render();
  }
  window.CDC_TOUR = { open, close };
})();
