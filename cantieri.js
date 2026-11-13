/* Centro di Costo — Cantieri (v260)
   window.CDC_CN.render(el, ctx): dal sopralluogo al preventivo e alla gestione del cantiere.
   Una pratica = una riga Config «cnt:<id>» (JSON); il listino personale = Config «cntListino».
   Le foto stanno nel Drive (uploadDoc) con miniatura; qui restano solo gli id. */
(() => {
  'use strict';
  let C = null, root = null;
  const S = { v: 'home', id: '', tab: 'dati', q: '', fs: '', p: null, dirty: false, saved: 0, lst: null, lq: '', lc: '', mem: {}, thumbs: {}, cat: '' };

  /* ---------- utilità ---------- */
  const esc = s => C.esc(s), N = v => C.num(v), eur = v => C.eur(v), fmt = (v, d = 2) => C.fmtNum(v, d);
  const today = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
  const dIt = s => s ? C.dIt(s) : '—';
  const canW = () => C.secPerm('cantieri') === 'w';
  const r2 = v => Math.round((Number(v) || 0) * 100) / 100;
  const dec = v => String(v == null || v === '' ? '' : v).replace('.', ',');
  const clone = o => JSON.parse(JSON.stringify(o));
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ic = (d, c) => `<svg class="cn-i${c ? ' ' + c : ''}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const IC = {
    plus: '<path d="M12 5v14M5 12h14"/>', back: '<path d="M15 5l-7 7 7 7"/>', home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    ruler: '<path d="M3 17 17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>', cam: '<path d="M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
    plan: '<path d="M3 4h18v16H3zM3 11h7M10 11v9M14 4v7h7"/>', list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>', euro: '<path d="M18 7a6.5 6.5 0 1 0 0 10M4.5 10.5h9M4.5 13.5h9"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    pdf: '<path d="M7 3h9l4 4v14H7z"/><path d="M15 3v5h5M10 14h6M10 17h4"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>', up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>', calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>', hammer: '<path d="M14 6l4 4M12 8l4 4-8.5 8.5a2 2 0 0 1-3-3z"/><path d="M13 4l3-1 5 5-1 3"/>',
    clip: '<path d="M20 11.5 12 19.5a5 5 0 0 1-7-7l8-8a3.4 3.4 0 0 1 5 5l-8 8a1.8 1.8 0 0 1-2.5-2.5l7-7"/>', send: '<path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/>', book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
    chev: '<path d="M9 6l6 6-6 6"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', sync: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5"/>', warn: '<path d="M12 4 2.5 20h19z"/><path d="M12 10v4.5M12 17.5v.01"/>',
    xls: '<path d="M7 3h9l4 4v14H7z"/><path d="M15 3v5h5M10 12l4 5M14 12l-4 5"/>', wa: '<path d="M4 20l1.3-4.2A8 8 0 1 1 8.4 18.8z"/>', mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>', mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'
  };

  /* ---------- fasi della pratica ---------- */
  const ST = [
    ['sopralluogo', 'Sopralluogo', '#6b7fa8'], ['preventivo', 'Preventivo', '#8b5cf6'], ['inviato', 'Inviato', '#0e9fb4'],
    ['accettato', 'Accettato', '#1baf7a'], ['lavori', 'In lavorazione', '#eb6834'], ['chiuso', 'Chiuso', '#64748b']
  ];
  const STX = { perso: ['Non accettato', '#d55181'] };
  const stName = k => (ST.find(s => s[0] === k) || [0, (STX[k] || [])[0] || 'Sopralluogo'])[1];
  const stCol = k => (ST.find(s => s[0] === k) || [0, 0, (STX[k] || [])[1] || '#6b7fa8'])[2];
  const stIdx = k => Math.max(0, ST.findIndex(s => s[0] === k));
  const TIPI = ['Ristrutturazione completa', 'Bagno', 'Cucina', 'Pavimenti e rivestimenti', 'Tinteggiatura e cartongesso', 'Impianto elettrico', 'Impianto idraulico e termico', 'Serramenti', 'Facciata e cappotto', 'Tetto e coperture', 'Opere esterne e giardino', 'Nuova costruzione', 'Manutenzione', 'Altro'];
  const IMMOBILI = ['Appartamento', 'Villa / casa indipendente', 'Negozio / locale commerciale', 'Ufficio', 'Capannone', 'Condominio (parti comuni)', 'Terreno / area esterna', 'Altro'];
  const FONTI = ['Passaparola', 'Sito web', 'Social', 'Cliente già acquisito', 'Studio tecnico / architetto', 'Altro'];
  const AMB = ['Soggiorno', 'Cucina', 'Camera', 'Camera matrimoniale', 'Cameretta', 'Bagno', 'Corridoio', 'Ingresso', 'Studio', 'Lavanderia', 'Ripostiglio', 'Balcone', 'Terrazzo', 'Giardino', 'Garage', 'Cantina', 'Locale tecnico'];

  /* ---------- checklist del sopralluogo ---------- */
  const CHK = [
    ['Accessi e logistica', [['acc_mezzi', 'Accesso mezzi e scarico materiali'], ['acc_asc', 'Scale / ascensore per portare i materiali'], ['acc_park', 'Parcheggio, ZTL e occupazione suolo pubblico'], ['acc_ref', 'Chiavi, orari e referente in cantiere']]],
    ['Strutture', [['str_fes', 'Fessurazioni e cedimenti'], ['str_sol', 'Solai e travi'], ['str_dem', 'Pareti da demolire: sono portanti?'], ['str_cop', 'Copertura e tetto'], ['str_fac', 'Facciata e intonaci esterni']]],
    ['Umidità', [['um_ris', 'Umidità di risalita'], ['um_inf', 'Infiltrazioni dall\'alto'], ['um_muf', 'Muffe e condensa']]],
    ['Impianto elettrico', [['el_qua', 'Quadro e messa a terra'], ['el_lin', 'Linee, punti luce e prese'], ['el_dic', 'Dichiarazione di conformità / adeguamento']]],
    ['Impianto idrico e termico', [['id_sca', 'Scarichi e colonne'], ['id_tub', 'Tubazioni acqua'], ['id_cal', 'Caldaia, riscaldamento, climatizzazione'], ['id_gas', 'Impianto gas e conformità']]],
    ['Serramenti e finiture', [['fi_ser', 'Serramenti e infissi'], ['fi_pav', 'Pavimenti esistenti'], ['fi_riv', 'Rivestimenti'], ['fi_int', 'Intonaci e tinteggiature']]],
    ['Pratiche e sicurezza', [['pr_tit', 'Titolo edilizio necessario (CILA, SCIA, permesso)'], ['pr_cat', 'Conformità urbanistica e catastale'], ['pr_con', 'Autorizzazione del condominio'], ['pr_ami', 'Sospetta presenza di amianto'], ['pr_pon', 'Ponteggi e opere provvisionali'], ['pr_sic', 'Rischi per la sicurezza (PSC / POS)']]],
    ['Smaltimento', [['sm_mac', 'Macerie da smaltire (stima in mc)'], ['sm_cas', 'Cassone e area di deposito']]]
  ];
  const CHK_ALL = CHK.flatMap(g => g[1]);
  const CHK_ST = { '': ['Da verificare', 'n'], ok: ['A posto', 'ok'], att: ['Attenzione', 'wa'], no: ['Criticità', 'no'] };

  /* ---------- listino iniziale (prezzi INDICATIVI da verificare e adattare ai tuoi) ---------- */
  const CATS = ['Cantiere e sicurezza', 'Demolizioni e rimozioni', 'Murature e massetti', 'Intonaci e cartongesso', 'Pavimenti e rivestimenti', 'Impianto elettrico', 'Impianto idraulico e termico', 'Serramenti e porte', 'Tinteggiature', 'Opere esterne e facciate', 'Varie'];
  const L0 = [
    ['Cantiere e sicurezza', 'Allestimento e pulizia cantiere', 'corpo', 350], ['Cantiere e sicurezza', 'Protezione di pavimenti e arredi', 'mq', 4.5], ['Cantiere e sicurezza', 'Noleggio ponteggio / trabattello', 'giorno', 45], ['Cantiere e sicurezza', 'Cassone scarrabile per macerie con trasporto', 'cad', 380],
    ['Demolizioni e rimozioni', 'Demolizione tramezzi in laterizio', 'mq', 22], ['Demolizioni e rimozioni', 'Demolizione pavimento e massetto', 'mq', 28], ['Demolizioni e rimozioni', 'Rimozione rivestimenti (piastrelle)', 'mq', 18], ['Demolizioni e rimozioni', 'Rimozione intonaco ammalorato', 'mq', 16],
    ['Demolizioni e rimozioni', 'Smontaggio sanitari e arredo bagno', 'cad', 60], ['Demolizioni e rimozioni', 'Rimozione serramenti esistenti', 'cad', 55], ['Demolizioni e rimozioni', 'Trasporto e conferimento macerie in discarica', 'mc', 70],
    ['Murature e massetti', 'Tramezzi in laterizio forato sp. 8 cm', 'mq', 38], ['Murature e massetti', 'Tramezzi in laterizio forato sp. 12 cm', 'mq', 44], ['Murature e massetti', 'Massetto sabbia e cemento sp. 5 cm', 'mq', 24], ['Murature e massetti', 'Massetto autolivellante', 'mq', 18], ['Murature e massetti', 'Apertura vano porta su muro con architrave', 'cad', 420], ['Murature e massetti', 'Impermeabilizzazione bagno con guaina liquida', 'mq', 22],
    ['Intonaci e cartongesso', 'Intonaco civile su pareti', 'mq', 26], ['Intonaci e cartongesso', 'Rasatura e stuccatura pareti', 'mq', 14], ['Intonaci e cartongesso', 'Parete in cartongesso con isolante', 'mq', 42], ['Intonaci e cartongesso', 'Controsoffitto in cartongesso', 'mq', 38], ['Intonaci e cartongesso', 'Rasatura soffitti', 'mq', 16],
    ['Pavimenti e rivestimenti', 'Posa pavimento in gres (solo posa)', 'mq', 32], ['Pavimenti e rivestimenti', 'Posa parquet / laminato (solo posa)', 'mq', 24], ['Pavimenti e rivestimenti', 'Posa rivestimento pareti (solo posa)', 'mq', 36], ['Pavimenti e rivestimenti', 'Fornitura pavimento in gres (a scelta cliente)', 'mq', 28], ['Pavimenti e rivestimenti', 'Battiscopa', 'ml', 7], ['Pavimenti e rivestimenti', 'Soglie e davanzali in marmo', 'ml', 55],
    ['Impianto elettrico', 'Punto luce / presa (impianto sottotraccia)', 'cad', 48], ['Impianto elettrico', 'Quadro elettrico con protezioni', 'cad', 520], ['Impianto elettrico', 'Linea dedicata (forno, piano cottura, clima)', 'cad', 160], ['Impianto elettrico', 'Impianto TV / dati', 'cad', 55], ['Impianto elettrico', 'Dichiarazione di conformità', 'corpo', 150], ['Impianto elettrico', 'Fornitura frutti e placche serie civile', 'cad', 14],
    ['Impianto idraulico e termico', 'Punto acqua calda e fredda con scarico', 'cad', 210], ['Impianto idraulico e termico', 'Rifacimento impianto bagno completo', 'corpo', 1900], ['Impianto idraulico e termico', 'Installazione sanitari (posa)', 'cad', 130], ['Impianto idraulico e termico', 'Radiatore in alluminio (fornitura e posa)', 'cad', 190], ['Impianto idraulico e termico', 'Sostituzione caldaia a condensazione', 'cad', 1900], ['Impianto idraulico e termico', 'Climatizzatore split (fornitura e posa)', 'cad', 1050],
    ['Serramenti e porte', 'Porta interna (fornitura e posa)', 'cad', 380], ['Serramenti e porte', 'Finestra PVC con vetrocamera', 'mq', 420], ['Serramenti e porte', 'Portoncino blindato', 'cad', 1500], ['Serramenti e porte', 'Tapparella avvolgibile', 'mq', 95], ['Serramenti e porte', 'Zanzariera', 'mq', 85],
    ['Tinteggiature', 'Tinteggiatura pareti e soffitti (2 mani)', 'mq', 9], ['Tinteggiatura', 'Tinteggiatura con idropittura lavabile', 'mq', 11], ['Tinteggiature', 'Trattamento antimuffa', 'mq', 8], ['Tinteggiature', 'Verniciatura porte e infissi', 'cad', 90],
    ['Opere esterne e facciate', 'Cappotto termico sp. 10 cm', 'mq', 95], ['Opere esterne e facciate', 'Intonaco e tinteggiatura facciata', 'mq', 38], ['Opere esterne e facciate', 'Pavimentazione esterna in gres / pietra', 'mq', 58], ['Opere esterne e facciate', 'Rifacimento manto di copertura (tegole)', 'mq', 95], ['Opere esterne e facciate', 'Canali di gronda e pluviali', 'ml', 28],
    ['Varie', 'Assistenza muraria agli impianti', 'ora', 32], ['Varie', 'Manodopera specializzata', 'ora', 38], ['Varie', 'Manodopera comune', 'ora', 28], ['Varie', 'Pulizia finale di cantiere', 'corpo', 220], ['Varie', 'Pratica edilizia (CILA) e direzione lavori', 'corpo', 900], ['Varie', 'Imprevisti e piccole opere in economia', 'corpo', 0]
  ].map((x, i) => ({ id: 'l' + (i + 1), cat: x[0] === 'Tinteggiatura' ? 'Tinteggiature' : x[0], d: x[1], um: x[2], pr: x[3], cs: '' }));
  const listino = () => { const c = C.cfg('cntListino'); return c && Array.isArray(c.v) && c.v.length ? c.v : L0; };
  const listinoOwn = () => { const c = C.cfg('cntListino'); return !!(c && Array.isArray(c.v) && c.v.length); };

  const CLAU = ['Il preventivo si intende per le sole lavorazioni descritte; eventuali lavori non indicati o richiesti in corso d\'opera saranno concordati e quotati a parte.', 'I prezzi sono validi per l\'esecuzione in un unico intervento continuativo e salvo imprevisti non rilevabili al sopralluogo (vizi nascosti, strutture o impianti non a norma).', 'Le misure sono state rilevate al sopralluogo; le quantità finali saranno verificate a lavori eseguiti.', 'Il cliente garantisce l\'accesso libero all\'area di lavoro, l\'utilizzo di acqua ed energia elettrica e l\'eventuale autorizzazione del condominio.', 'Le opere sono garantite ai sensi di legge.'];
  const ESCL = ['Pratiche edilizie, catastali e oneri di legge', 'Progettazione, direzione lavori e collaudi (se non indicati)', 'Fornitura di arredi, elettrodomestici e apparecchi illuminanti', 'Opere non espressamente descritte nel computo', 'Smaltimento di materiali speciali (amianto, vernici, ecc.)'];

  /* ---------- pratiche ---------- */
  const keyOf = id => 'cnt:' + id;
  const ALL = () => Object.keys(C.db().config || {}).filter(k => k.startsWith('cnt:')).map(k => C.cfg(k)).filter(p => p && p.id);
  const getP = id => { const p = C.cfg(keyOf(id)); return p ? clone(p) : null; };
  const nextNum = () => { const y = new Date().getFullYear(), pre = `CN-${y}-`; const n = Math.max(0, ...ALL().map(p => String(p.num || '').startsWith(pre) ? parseInt(String(p.num).slice(pre.length), 10) || 0 : 0)); return pre + String(n + 1).padStart(3, '0'); };
  const newP = () => ({
    id: 'cn' + C.uid(), num: nextNum(), stato: 'sopralluogo', creato: today(),
    cli: { id: '', nome: '', ref: '', tel: '', email: '', ind: '', cap: '', citta: '', prov: '', piva: '', cf: '' },
    cant: { ind: '', citta: '', tipo: TIPI[0], immobile: IMMOBILI[0], piano: '', asc: '', anno: '', note: '' },
    sopr: { data: today(), ora: '', tecnico: '', fonte: '', note: '' },
    amb: [], chk: {}, chkN: {}, foto: [], piante: [], crit: '', voci: [], eco: { sg: 0, ut: 0, sic: 0, sicT: 'eur', sc: 0, iva: 10, arr: 0 },
    pag: [{ id: 'g1', d: 'Acconto alla firma', pc: 30 }, { id: 'g2', d: 'A metà lavori (SAL)', pc: 40 }, { id: 'g3', d: 'A fine lavori', pc: 30 }],
    cond: { val: 30, tempi: '', inizio: '', escl: ESCL.map(x => '• ' + x).join('\n'), clau: CLAU.map(x => '• ' + x).join('\n'), note: '', foto: true },
    gl: [], extra: []
  });

  /* ---------- misure e computo ---------- */
  const apLen = a => N(a.l) * N(a.h) * (N(a.q) || 1);
  function misure(a) {
    const l = N(a.l), p = N(a.p), h = N(a.h) || 2.7, ap = (a.ap || []).reduce((s, x) => s + apLen(x), 0);
    const pav = l * p, per = 2 * (l + p), lor = per * h, net = Math.max(0, lor - ap);
    return { pav, per, lor, ap, net, sof: pav, vol: pav * h, h };
  }
  const totM = p => p.amb.reduce((t, a) => { const m = misure(a); t.pav += m.pav; t.net += m.net; t.sof += m.sof; t.per += m.per; t.vol += m.vol; return t; }, { pav: 0, net: 0, sof: 0, per: 0, vol: 0 });
  const vAmt = v => r2(N(v.q) * N(v.pr) * (1 - Math.min(100, N(v.sc)) / 100));
  const vIn = v => !v.opt || v.on;
  function calc(p) {
    const e = p.eco || {}, vs = (p.voci || []).filter(vIn), A = r2(vs.reduce((s, v) => s + vAmt(v), 0));
    const SG = r2(A * N(e.sg) / 100), UT = r2((A + SG) * N(e.ut) / 100), SC = r2((A + SG + UT) * N(e.sc) / 100);
    const SIC = e.sicT === 'pct' ? r2(A * N(e.sic) / 100) : r2(N(e.sic));
    const imp = r2(A + SG + UT - SC + SIC), iva = r2(imp * N(e.iva) / 100), tot0 = r2(imp + iva), tot = r2(tot0 - N(e.arr));
    const opt = r2((p.voci || []).filter(v => v.opt && !v.on).reduce((s, v) => s + vAmt(v), 0));
    const withC = vs.filter(v => N(v.cs) > 0), costo = r2(withC.reduce((s, v) => s + N(v.q) * N(v.cs), 0)), ricC = r2(withC.reduce((s, v) => s + vAmt(v), 0));
    const marg = withC.length && withC.length >= vs.length * .5 && ricC > 0 ? { v: r2(ricC - costo), pc: (ricC - costo) / ricC * 100, cov: withC.length / vs.length } : null;
    const k = A > 0 ? imp / A : 1, avA = A > 0 ? vs.reduce((s, v) => s + vAmt(v) * Math.min(100, N(v.av)) / 100, 0) / A : 0;
    return { A, SG, UT, SC, SIC, imp, iva, tot0, tot, opt, marg, k, av: avA, sal: r2(imp * avA), salT: r2(tot * avA), nv: vs.length };
  }
  const byCat = p => { const m = new Map(); (p.voci || []).forEach(v => { const c = v.cat || 'Varie'; if (!m.has(c)) m.set(c, []); m.get(c).push(v); }); return [...m].sort((a, b) => (CATS.indexOf(a[0]) + 100 * (CATS.indexOf(a[0]) < 0)) - (CATS.indexOf(b[0]) + 100 * (CATS.indexOf(b[0]) < 0))); };
  const chkStat = p => { const t = CHK_ALL.length, d = CHK_ALL.filter(([k]) => p.chk && p.chk[k]).length, w = CHK_ALL.filter(([k]) => p.chk && (p.chk[k] === 'att' || p.chk[k] === 'no')).length; return { t, d, w }; };
  const totOf = p => calc(p).tot;

  /* ---------- grafica ---------- */
  const CSS = `
.cn{--cn-navy:#14284f;--cn-navy2:#27487f;--cn-r:16px;--cn-ease:cubic-bezier(.2,.8,.2,1);display:grid;gap:18px;padding-bottom:40px;color:var(--ink)}
.cn *,.cn-mo *{box-sizing:border-box}.cn>*,.cn-pane>*,.cn-eco>*{min-width:0}.cn-k b{white-space:nowrap}.cn button,.cn-mo button{font:inherit}.cn-mo,.cn-mo *{box-sizing:border-box}.cn-i{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:none}
.cn-hero{position:relative;overflow:hidden;border-radius:22px;padding:30px 32px;color:#fff;background:linear-gradient(120deg,var(--cn-navy) 0%,var(--cn-navy2) 62%,#3a64ab 100%);isolation:isolate}
.cn-hero::before{content:"";position:absolute;inset:0;z-index:-1;background-image:linear-gradient(rgba(255,255,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.07) 1px,transparent 1px);background-size:28px 28px;mask-image:linear-gradient(100deg,transparent 10%,#000 70%);animation:cn-grid 18s linear infinite}
@keyframes cn-grid{to{background-position:28px 28px}}
.cn-hero::after{content:"";position:absolute;width:420px;height:420px;right:-120px;top:-200px;z-index:-1;border-radius:50%;background:radial-gradient(circle,rgba(125,170,255,.35),transparent 65%)}
.cn-hero h2{margin:0;font-size:30px;letter-spacing:-.02em;font-weight:700}.cn-hero p{margin:6px 0 0;opacity:.8;font-size:14.5px;max-width:520px}
.cn-hero-in{display:flex;gap:24px;align-items:center;justify-content:space-between;flex-wrap:wrap}
.cn-hero .cn-draw{width:170px;height:112px;flex:none;opacity:.95}.cn-draw path,.cn-draw rect,.cn-draw line{fill:none;stroke:#cfe0ff;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:var(--l,300);stroke-dashoffset:var(--l,300);animation:cn-dr 2.2s var(--cn-ease) forwards;animation-delay:calc(var(--i,0)*.14s)}
.cn-draw .a{stroke:#ffd27a}@keyframes cn-dr{to{stroke-dashoffset:0}}
.cn-btn{display:inline-flex;align-items:center;gap:8px;height:42px;padding:0 18px;border-radius:12px;border:1px solid var(--line);background:var(--surface);color:var(--ink);font-weight:600;font-size:14px;cursor:pointer;transition:transform .15s var(--cn-ease),box-shadow .2s,background .2s}
.cn-btn:hover{box-shadow:0 6px 18px -8px rgba(20,40,80,.35)}.cn-btn:active{transform:scale(.97)}
.cn-btn.pri{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}.cn-btn.wh{background:#fff;color:var(--cn-navy);border-color:#fff}.cn-btn.sm{height:34px;padding:0 12px;font-size:13px;border-radius:10px}.cn-btn.gh{background:transparent}.cn-btn.dg{color:var(--danger)}
.cn-btn[disabled]{opacity:.5;pointer-events:none}
.cn-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.cn-k{position:relative;background:var(--surface);border:1px solid var(--line);border-radius:var(--cn-r);padding:16px 18px;overflow:hidden;animation:cn-up .6s var(--cn-ease) both;animation-delay:calc(var(--i,0)*70ms)}
.cn-k span{display:block;font-size:12.5px;font-weight:600;color:var(--muted)}.cn-k b{display:block;font-size:28px;letter-spacing:-.02em;margin-top:6px}.cn-k small{display:block;color:var(--muted);font-size:12.5px;margin-top:2px}
.cn-k .cn-ring{position:absolute;right:14px;top:14px;width:46px;height:46px}
@keyframes cn-up{from{opacity:0;transform:translateY(10px)}}
.cn-ring circle{fill:none;stroke-width:4.5}.cn-ring .bg{stroke:color-mix(in srgb,var(--ink) 8%,transparent)}.cn-ring .fg{stroke:var(--c,var(--accent));stroke-linecap:round;transform:rotate(-90deg);transform-origin:50% 50%;animation:cn-ring 1.1s var(--cn-ease) both}
@keyframes cn-ring{from{stroke-dasharray:0 200}}
.cn-pipe{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}
.cn-ps{position:relative;text-align:left;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:13px 14px 14px;cursor:pointer;transition:transform .2s var(--cn-ease),border-color .2s,box-shadow .2s;animation:cn-up .6s var(--cn-ease) both;animation-delay:calc(var(--i,0)*60ms + 150ms);color:inherit}
.cn-ps:hover{transform:translateY(-2px);box-shadow:0 10px 24px -14px rgba(20,40,80,.4)}.cn-ps.on{border-color:var(--c);box-shadow:0 0 0 3px color-mix(in srgb,var(--c) 18%,transparent)}
.cn-ps i{display:block;width:8px;height:8px;border-radius:50%;background:var(--c);margin-bottom:8px;box-shadow:0 0 0 4px color-mix(in srgb,var(--c) 16%,transparent)}
.cn-ps span{display:block;font-size:12.5px;font-weight:600;color:var(--ink-2)}.cn-ps b{display:block;font-size:22px;margin-top:2px;letter-spacing:-.02em}.cn-ps small{display:block;color:var(--muted);font-size:12px;margin-top:1px;min-height:15px}
.cn-ps u{display:block;height:3px;border-radius:3px;margin-top:10px;background:color-mix(in srgb,var(--ink) 7%,transparent);overflow:hidden;text-decoration:none}
.cn-ps u::after{content:"";display:block;height:100%;width:calc(var(--p,0)*100%);background:var(--c);border-radius:3px;transform-origin:0 50%;animation:cn-bar 1s calc(.3s + var(--i)*70ms) var(--cn-ease) both}
@keyframes cn-bar{from{transform:scaleX(0)}}
.cn-bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.cn-bar .cn-s{position:relative;flex:1 1 260px;max-width:420px}
.cn-s input{width:100%;height:42px;border-radius:12px;border:1px solid var(--line);background:var(--surface);padding:0 14px 0 40px;font:inherit;font-size:14px;color:var(--ink)}.cn-s .cn-i{position:absolute;left:13px;top:12px;color:var(--muted)}
.cn-todo{display:grid;gap:8px}.cn-td{display:flex;gap:12px;align-items:center;padding:11px 14px;border-radius:12px;background:var(--surface);border:1px solid var(--line);cursor:pointer;animation:cn-up .5s var(--cn-ease) both;animation-delay:calc(var(--i,0)*50ms)}
.cn-td:hover{border-color:color-mix(in srgb,var(--c) 55%,var(--line))}.cn-td .d{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:color-mix(in srgb,var(--c) 13%,transparent);color:var(--c)}
.cn-td b{font-size:13.5px}.cn-td small{display:block;color:var(--muted);font-size:12.5px}.cn-td .cn-i:last-child{margin-left:auto;color:var(--muted)}
.cn-h3{display:flex;align-items:center;gap:10px;margin:2px 2px 0;font-size:15px;font-weight:700}.cn-h3 small{font-weight:500;color:var(--muted);font-size:12.5px}.cn-h3 .sp{flex:1}
.cn-lst{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:14px}
.cn-pc{position:relative;display:grid;gap:10px;text-align:left;background:var(--surface);border:1px solid var(--line);border-radius:var(--cn-r);padding:16px 18px 16px;cursor:pointer;color:inherit;transition:transform .25s var(--cn-ease),box-shadow .25s,border-color .25s;animation:cn-up .55s var(--cn-ease) both;animation-delay:calc(var(--i,0)*45ms)}
.cn-pc:hover{transform:translateY(-3px);box-shadow:0 16px 34px -18px rgba(20,40,80,.45);border-color:color-mix(in srgb,var(--c) 40%,var(--line))}
.cn-pc::before{content:"";position:absolute;left:0;top:16px;bottom:16px;width:3px;border-radius:0 3px 3px 0;background:var(--c)}
.cn-pc-t{display:flex;justify-content:space-between;align-items:center;gap:8px}.cn-num{font-size:12px;font-weight:700;color:var(--muted);letter-spacing:.04em}
.cn-pc h4{margin:0;font-size:17px;letter-spacing:-.01em;line-height:1.25}.cn-pc p{margin:0;color:var(--ink-2);font-size:13px;display:flex;gap:6px;align-items:center}.cn-pc p .cn-i{width:14px;height:14px;color:var(--muted)}
.cn-pc-b{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;margin-top:2px}.cn-pc-b b{font-size:21px;letter-spacing:-.02em}.cn-pc-b small{color:var(--muted);font-size:12px;text-align:right}
.cn-chip{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 10px;border-radius:99px;font-size:12px;font-weight:600;background:color-mix(in srgb,var(--c,var(--accent)) 13%,transparent);color:var(--c,var(--accent));white-space:nowrap}
.cn-chip::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}.cn-chip.plain::before{display:none}.cn-chip.n{--c:var(--muted)}.cn-chip.ok{--c:#1f9d6b}.cn-chip.wa{--c:#c98500}.cn-chip.no{--c:#d63a3a}
.cn-seg{display:flex;gap:3px}.cn-seg i{flex:1;height:4px;border-radius:4px;background:color-mix(in srgb,var(--ink) 9%,transparent);overflow:hidden;position:relative}.cn-seg i.on::after{content:"";position:absolute;inset:0;background:var(--c);transform-origin:0 50%;animation:cn-bar .8s calc(var(--j)*90ms + .2s) var(--cn-ease) both}
.cn-empty{text-align:center;padding:44px 20px;background:var(--surface);border:1px dashed var(--line);border-radius:20px}.cn-empty b{display:block;font-size:18px;margin-top:6px}.cn-empty p{margin:6px auto 18px;color:var(--muted);max-width:420px;font-size:14px}
.cn-empty svg.big{width:150px;height:110px;margin:0 auto;display:block}.cn-empty svg.big path,.cn-empty svg.big rect,.cn-empty svg.big line{fill:none;stroke:var(--accent);stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:var(--l,300);stroke-dashoffset:var(--l,300);animation:cn-dr 2.4s var(--cn-ease) forwards;animation-delay:calc(var(--i,0)*.14s)}
.cn-empty svg.big .a{stroke:#eb6834}
/* editor */
.cn-top{padding:4px 0 0}.cn-tw{position:sticky;top:0;z-index:20;margin:-6px -4px 0;padding:6px 4px 8px;background:color-mix(in srgb,var(--bg) 86%,transparent);backdrop-filter:saturate(1.4) blur(14px);-webkit-backdrop-filter:saturate(1.4) blur(14px)}
.cn-top-r{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.cn-top h2{margin:0;font-size:20px;letter-spacing:-.01em;line-height:1.2}.cn-top .sub{color:var(--muted);font-size:12.5px;font-weight:600;letter-spacing:.04em}
.cn-back{width:38px;height:38px;border-radius:12px;border:1px solid var(--line);background:var(--surface);display:grid;place-items:center;cursor:pointer;color:var(--ink)}
.cn-tot{margin-left:auto;text-align:right}.cn-tot small{display:block;color:var(--muted);font-size:11.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase}.cn-tot b{font-size:22px;letter-spacing:-.02em}
.cn-sv{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);font-weight:600;min-width:84px;transition:color .3s}.cn-sv.ok{color:#1f9d6b}.cn-sv .cn-i{width:14px;height:14px}.cn-sv.busy .cn-i{animation:cn-spin 1s linear infinite}
@keyframes cn-spin{to{transform:rotate(360deg)}}
.cn-step{display:flex;align-items:flex-start;margin:14px 2px 2px;position:relative}
.cn-step button{flex:1;display:grid;justify-items:center;gap:6px;border:0;background:none;cursor:pointer;color:var(--muted);font-size:12px;font-weight:600;position:relative;padding:0}
.cn-step button::before{content:"";position:absolute;top:10px;left:-50%;right:50%;height:2px;background:color-mix(in srgb,var(--ink) 10%,transparent);z-index:0}.cn-step button:first-child::before{display:none}
.cn-step button::after{content:"";position:absolute;top:10px;left:-50%;right:50%;height:2px;background:var(--c);z-index:0;transform:scaleX(0);transform-origin:0 50%;transition:transform .6s var(--cn-ease)}.cn-step button.done::after{transform:scaleX(1)}.cn-step button:first-child::after{display:none}
.cn-step i{width:22px;height:22px;border-radius:50%;border:2px solid color-mix(in srgb,var(--ink) 16%,transparent);background:var(--surface);position:relative;z-index:1;display:grid;place-items:center;transition:all .35s var(--cn-ease)}
.cn-step button.done i{background:var(--c);border-color:var(--c)}.cn-step button.done i::after{content:"";width:9px;height:5px;border-left:2px solid #fff;border-bottom:2px solid #fff;transform:rotate(-45deg) translate(1px,-1px)}
.cn-step button.cur{color:var(--ink)}.cn-step button.cur i{border-color:var(--c);box-shadow:0 0 0 5px color-mix(in srgb,var(--c) 20%,transparent);animation:cn-pulse 2.4s ease-in-out infinite}
@keyframes cn-pulse{50%{box-shadow:0 0 0 8px color-mix(in srgb,var(--c) 6%,transparent)}}
.cn-tabs{position:relative;display:flex;gap:4px;overflow-x:auto;padding:4px;background:color-mix(in srgb,var(--ink) 5%,transparent);border-radius:14px;scrollbar-width:none}.cn-tabs::-webkit-scrollbar{display:none}
.cn-tabs button{position:relative;z-index:1;flex:1 0 auto;display:flex;gap:8px;align-items:center;justify-content:center;height:38px;padding:0 16px;border:0;border-radius:11px;background:none;color:var(--ink-2);font-weight:600;font-size:13.5px;cursor:pointer;white-space:nowrap;transition:color .2s}
.cn-tabs button.on{color:var(--ink)}.cn-tabs .ind{position:absolute;z-index:0;top:4px;bottom:4px;border-radius:11px;background:var(--surface);box-shadow:0 1px 3px rgba(0,0,0,.1),0 6px 14px -8px rgba(20,40,80,.35);transition:left .35s var(--cn-ease),width .35s var(--cn-ease)}
.cn-pane{display:grid;gap:16px;animation:cn-fade .45s var(--cn-ease) both}@keyframes cn-fade{from{opacity:0;transform:translateY(8px)}}
.cn-card{background:var(--surface);border:1px solid var(--line);border-radius:var(--cn-r);padding:18px 20px}.cn-card>h3{margin:0 0 14px;font-size:15px;display:flex;align-items:center;gap:10px}.cn-card>h3 .cn-i{color:var(--accent)}.cn-card>h3 .sp{flex:1}.cn-card>h3 small{font-weight:500;color:var(--muted);font-size:12.5px}
.cn-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px 14px}.cn-g .w2{grid-column:span 2}.cn-g .wf{grid-column:1/-1}
.cn-f{display:grid;gap:5px;align-content:start;min-width:0}.cn-f>span{font-size:12px;font-weight:600;color:var(--muted)}
.cn-f input,.cn-f select,.cn-f textarea,.cn-in{width:100%;height:40px;border-radius:10px;border:1px solid var(--line);background:var(--bg);padding:0 12px;font:inherit;font-size:14px;color:var(--ink);transition:border-color .2s,box-shadow .2s,background .2s;min-width:0}
.cn-f textarea{height:auto;min-height:80px;padding:10px 12px;resize:vertical;line-height:1.45}.cn-f input:focus,.cn-f select:focus,.cn-f textarea:focus,.cn-in:focus{outline:0;border-color:var(--accent);background:var(--surface);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 18%,transparent)}
.cn-sum{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.cn-sm{padding:12px 14px;border-radius:12px;background:color-mix(in srgb,var(--accent) 6%,var(--surface));border:1px solid color-mix(in srgb,var(--accent) 12%,var(--line))}.cn-sm span{font-size:12px;color:var(--muted);font-weight:600}.cn-sm b{display:block;font-size:20px;letter-spacing:-.01em;margin-top:2px}
.cn-amb{display:grid;gap:14px}.cn-ar{border:1px solid var(--line);border-radius:14px;padding:14px 16px;display:grid;gap:12px;background:var(--bg);animation:cn-up .45s var(--cn-ease) both}.cn-ar-h{display:flex;gap:10px;align-items:center}.cn-ar-h input{font-weight:700;font-size:15px;height:36px;max-width:260px}
.cn-dims{display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) minmax(0,1.3fr);gap:10px;align-items:end}
.cn-m{display:flex;flex-wrap:wrap;gap:6px}.cn-m span{font-size:12px;padding:5px 10px;border-radius:99px;background:var(--surface);border:1px solid var(--line);color:var(--ink-2)}.cn-m b{color:var(--ink)}
.cn-ap{display:grid;grid-template-columns:96px repeat(3,minmax(0,1fr)) 34px;gap:8px;align-items:center}.cn-ap .cn-in{height:34px;font-size:13px}
.cn-plan{width:100%;max-height:300px;border-radius:14px;background:color-mix(in srgb,var(--accent) 5%,var(--surface));border:1px solid var(--line)}.cn-plan rect{fill:color-mix(in srgb,var(--accent) 11%,transparent);stroke:var(--accent);stroke-width:1.6;stroke-dasharray:900;stroke-dashoffset:900;animation:cn-dr 1.4s var(--cn-ease) forwards;animation-delay:calc(var(--i)*.12s)}.cn-plan text{font:600 11px var(--font);fill:var(--ink);text-anchor:middle}.cn-plan .t2{font-weight:500;fill:var(--muted);font-size:10px}
.cn-chk{display:grid;gap:14px}.cn-cg>b{display:block;font-size:12.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
.cn-ci{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 12px;align-items:center;padding:9px 0;border-top:1px solid var(--line)}.cn-ci:first-of-type{border-top:0}.cn-ci>span{font-size:14px}
.cn-cs{display:inline-flex;gap:3px;padding:3px;background:color-mix(in srgb,var(--ink) 6%,transparent);border-radius:10px}.cn-cs button{height:28px;padding:0 10px;border:0;border-radius:8px;background:none;color:var(--ink-2);font-size:12px;font-weight:600;cursor:pointer;transition:all .2s var(--cn-ease)}
.cn-cs button.on{background:var(--c);color:#fff;box-shadow:0 4px 10px -4px var(--c)}.cn-ci .cn-in{grid-column:1/-1;height:34px;font-size:13px}
.cn-ph{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}.cn-pt{position:relative;aspect-ratio:1;border-radius:12px;overflow:hidden;background:color-mix(in srgb,var(--ink) 7%,transparent);cursor:pointer;animation:cn-up .45s var(--cn-ease) both;animation-delay:calc(var(--i,0)*40ms)}
.cn-pt img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s var(--cn-ease)}.cn-pt:hover img{transform:scale(1.06)}.cn-pt span{position:absolute;left:0;right:0;bottom:0;padding:16px 8px 6px;font-size:11.5px;color:#fff;background:linear-gradient(transparent,rgba(0,0,0,.65));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cn-pt.sk::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.4),transparent 70%);background-size:200% 100%;animation:cn-sh 1.2s infinite}@keyframes cn-sh{from{background-position:200% 0}to{background-position:-200% 0}}
.cn-add{display:grid;place-items:center;gap:4px;aspect-ratio:1;border-radius:12px;border:1.5px dashed color-mix(in srgb,var(--accent) 45%,var(--line));color:var(--accent);background:none;font-weight:600;font-size:12.5px;cursor:pointer;transition:background .2s,transform .2s var(--cn-ease)}.cn-add:hover{background:color-mix(in srgb,var(--accent) 7%,transparent);transform:translateY(-2px)}
/* computo */
.cn-cat{border:1px solid var(--line);border-radius:14px;background:var(--surface);overflow:hidden}.cn-cat>summary{list-style:none;display:flex;align-items:center;gap:10px;padding:13px 16px;cursor:pointer;font-weight:700;font-size:14.5px;background:color-mix(in srgb,var(--accent) 4%,var(--surface))}
.cn-cat>summary::-webkit-details-marker{display:none}.cn-cat>summary .cn-i{transition:transform .25s var(--cn-ease);color:var(--muted)}.cn-cat[open]>summary .cn-i{transform:rotate(90deg)}.cn-cat>summary em{margin-left:auto;font-style:normal;font-size:15px}.cn-cat>summary small{font-weight:500;color:var(--muted)}
.cn-vr{display:grid;grid-template-columns:minmax(0,1fr) 66px 86px 96px 62px 100px auto;gap:8px;align-items:center;padding:10px 14px;border-top:1px solid var(--line);animation:cn-fade .35s var(--cn-ease) both}
.cn-vr.opt{background:repeating-linear-gradient(135deg,transparent 0 10px,color-mix(in srgb,var(--warn) 5%,transparent) 10px 20px)}.cn-vr.var{box-shadow:inset 3px 0 0 #eb6834}
.cn-vr .cn-in{height:36px;font-size:13.5px}.cn-vr .d{font-weight:600}.cn-vr .am{text-align:right;font-weight:700;font-size:14.5px;white-space:nowrap}.cn-vr .num{text-align:right}
.cn-vh{display:grid;grid-template-columns:minmax(0,1fr) 66px 86px 96px 62px 100px 112px;gap:8px;padding:8px 14px;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}
.cn-ic{width:30px;height:30px;display:inline-grid;place-items:center;border:0;border-radius:8px;background:none;color:var(--muted);cursor:pointer;transition:background .15s,color .15s}.cn-ic:hover{background:color-mix(in srgb,var(--ink) 8%,transparent);color:var(--ink)}.cn-ic.on{color:var(--warn);background:var(--warn-soft)}.cn-ic .cn-i{width:16px;height:16px}
.cn-vx{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:0 14px 12px;font-size:12px}.cn-vx.hid{display:none}
.cn-acts{display:flex;gap:8px;flex-wrap:wrap}
.cn-eco{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:16px;align-items:start}.cn-sticky{position:sticky;top:70px}
.cn-qe{display:grid;gap:0}.cn-qe div{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-top:1px solid var(--line);font-size:14px}.cn-qe div:first-child{border-top:0}.cn-qe span{color:var(--ink-2)}.cn-qe .neg b{color:#1f9d6b}
.cn-qe .big{padding-top:14px;margin-top:4px;border-top:2px solid var(--ink)}.cn-qe .big span{font-weight:700;color:var(--ink)}.cn-qe .big b{font-size:28px;letter-spacing:-.02em}
.cn-stk{display:flex;height:10px;border-radius:8px;overflow:hidden;margin:2px 0 14px;background:color-mix(in srgb,var(--ink) 7%,transparent)}.cn-stk i{display:block;height:100%;background:var(--c);transform-origin:0 50%;animation:cn-bar 1s var(--cn-ease) both;animation-delay:calc(var(--i)*120ms);transition:flex-basis .5s var(--cn-ease)}
.cn-lg{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--ink-2);margin:-6px 0 12px}.cn-lg i{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--c);margin-right:6px}
.cn-pg{display:grid;grid-template-columns:minmax(0,1fr) 84px 110px 34px;gap:8px;align-items:center;margin-bottom:8px}.cn-pg .cn-in{height:36px}
.cn-sc{display:grid;grid-template-columns:150px minmax(0,1fr) 54px;gap:12px;align-items:center;padding:7px 0}.cn-sc input[type=range]{width:100%;accent-color:var(--accent)}
.cn-big{display:flex;align-items:center;gap:22px;flex-wrap:wrap}.cn-big .cn-ring{width:120px;height:120px}.cn-big .cn-ring circle{stroke-width:7}.cn-big>div:last-child{display:grid;gap:4px}.cn-big b{font-size:34px;letter-spacing:-.02em}
.cn-rg{position:relative;width:120px;height:120px}.cn-rg .cn-ring{width:100%;height:100%}.cn-rg span{position:absolute;inset:0;display:grid;place-items:center;font-size:26px;font-weight:700;letter-spacing:-.02em}
.cn-gl{display:grid;gap:8px}.cn-gr{display:grid;grid-template-columns:130px minmax(0,1fr) 34px;gap:8px;align-items:start}.cn-gr textarea{min-height:40px;height:40px;padding:9px 12px}
.cn-ban{display:flex;align-items:center;gap:14px;width:100%;text-align:left;padding:16px 18px;border-radius:var(--cn-r);border:1px solid color-mix(in srgb,var(--accent) 35%,var(--line));background:linear-gradient(120deg,color-mix(in srgb,var(--accent) 12%,var(--surface)),var(--surface));cursor:pointer;color:var(--ink);transition:transform .2s var(--cn-ease),box-shadow .2s}.cn-ban:hover{transform:translateY(-2px);box-shadow:0 12px 26px -16px rgba(20,40,80,.5)}
.cn-ban .i{display:grid;place-items:center;width:44px;height:44px;border-radius:13px;background:var(--cn-navy);color:#fff;flex:none}.cn-ban .i .cn-i{width:22px;height:22px}.cn-ban span:nth-child(2){flex:1;min-width:0}.cn-ban b{display:block;font-size:15px}.cn-ban small{display:block;color:var(--muted);font-size:12.5px;margin-top:2px}
.cn-pls{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:14px}
.cn-pl{background:var(--surface);border:1px solid var(--line);border-radius:var(--cn-r);overflow:hidden;animation:cn-up .55s var(--cn-ease) both;animation-delay:calc(var(--i,0)*70ms)}
.cn-pl-th{display:block;width:100%;height:220px;border:0;border-bottom:1px solid var(--line);padding:16px;cursor:pointer;background-color:#fbfcfe;background-image:linear-gradient(#e9edf5 1px,transparent 1px),linear-gradient(90deg,#e9edf5 1px,transparent 1px);background-size:22px 22px;transition:filter .2s}.cn-pl-th:hover{filter:brightness(.96)}.cn-pl-th svg.cad-th{width:100%;height:100%}
.cn-pl-e{display:grid;place-items:center;gap:8px;height:100%;color:#7a8399;font-size:13px}.cn-pl-e .cn-i{width:34px;height:34px}
.cn-pl-b{padding:14px 16px 16px}.cn-pl-b h4{margin:0;font-size:15px}.cn-pl-b p{margin:4px 0 10px;color:var(--muted);font-size:13px}.cn-plc{display:flex;gap:9px;align-items:center;margin-top:12px;font-size:13px;cursor:pointer}.cn-plc input{width:17px;height:17px}.cn-pl-b .cn-chips{margin-bottom:12px;flex-wrap:wrap}.cn-pl-b .cn-chips span{flex:none;height:26px;display:inline-flex;align-items:center;padding:0 10px;border-radius:99px;background:color-mix(in srgb,var(--ink) 6%,transparent);font-size:12px;font-weight:600;color:var(--ink-2)}
.cn-mo{position:fixed;inset:0;z-index:200;display:grid;place-items:center;padding:18px;background:rgba(10,18,36,.5);backdrop-filter:blur(6px);animation:cn-fi .25s ease both}.cn-mo.out{animation:cn-fo .2s ease both}
.cn-mb{width:min(760px,100%);max-height:calc(100vh - 36px);display:flex;flex-direction:column;background:var(--surface);color:var(--ink);border-radius:20px;box-shadow:0 30px 80px -20px rgba(0,0,0,.5);animation:cn-pop .38s var(--cn-ease) both;overflow:hidden}.cn-mb.wide{width:min(980px,100%)}
@keyframes cn-fi{from{opacity:0}}@keyframes cn-fo{to{opacity:0}}@keyframes cn-pop{from{opacity:0;transform:translateY(18px) scale(.97)}}
.cn-mh{display:flex;align-items:center;gap:10px;padding:16px 20px;border-bottom:1px solid var(--line)}.cn-mh h3{margin:0;font-size:17px}.cn-mh .sp{flex:1}.cn-ms{overflow:auto;padding:16px 20px;display:grid;gap:12px;align-content:start}.cn-mf{padding:14px 20px;border-top:1px solid var(--line);display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}
.cn-chips{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}.cn-chips::-webkit-scrollbar{display:none}.cn-chips button{flex:none;height:32px;padding:0 13px;border-radius:99px;border:1px solid var(--line);background:var(--surface);color:var(--ink-2);font-size:12.5px;font-weight:600;cursor:pointer;transition:all .2s var(--cn-ease)}.cn-chips button.on{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}
.cn-li{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:12px;align-items:center;padding:11px 12px;border-radius:12px;border:1px solid var(--line);cursor:pointer;background:var(--bg);text-align:left;color:inherit;font:inherit;transition:all .2s var(--cn-ease)}.cn-li:hover{border-color:var(--accent);transform:translateX(3px)}.cn-li b{font-size:14px;font-weight:600}.cn-li small{display:block;color:var(--muted);font-size:12px}.cn-li em{font-style:normal;font-weight:700}.cn-li.flash{background:color-mix(in srgb,#1f9d6b 14%,var(--bg));border-color:#1f9d6b}
.cn-lbx{position:relative;display:grid;gap:12px}.cn-lbx img,.cn-lbx canvas{max-width:100%;max-height:62vh;border-radius:12px;display:block;margin:0 auto;touch-action:none;background:#111}
.cn-pens{display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap}.cn-pens i{width:26px;height:26px;border-radius:50%;background:var(--c);border:3px solid var(--surface);box-shadow:0 0 0 1.5px var(--line);cursor:pointer;transition:transform .2s var(--cn-ease)}.cn-pens i.on{transform:scale(1.2);box-shadow:0 0 0 2px var(--ink)}
.cn-note{padding:11px 14px;border-radius:12px;background:var(--warn-soft);color:var(--warn);font-size:13px;display:flex;gap:10px;align-items:flex-start}.cn-note .cn-i{margin-top:1px}.cn-ro .cn-note.ro{display:flex}
.cn-hint{color:var(--muted);font-size:12.5px;margin:0}
.cn-mic.on{color:#d63a3a;animation:cn-pulse2 1s infinite}@keyframes cn-pulse2{50%{opacity:.4}}
@media (max-width:980px){.cn-pipe{grid-template-columns:repeat(3,minmax(0,1fr))}.cn-eco{grid-template-columns:1fr}.cn-sticky{position:static}.cn-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.cn-sum{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:700px){.cn-k b{font-size:22px}.cn-k{padding:14px}.cn-k .cn-ring{width:38px;height:38px;right:10px;top:10px}.cn-pc-b b{font-size:19px}.cn-hero{padding:22px 20px}.cn-hero h2{font-size:25px}.cn-hero .cn-draw{display:none}.cn-top h2{font-size:18px}.cn-tot b{font-size:18px}.cn-g .w2{grid-column:1/-1}.cn-step button span{display:none}.cn-step button.cur span{display:block;position:absolute;top:28px;white-space:nowrap}.cn-step{margin-bottom:20px}
.cn-vh{display:none}.cn-vr{grid-template-columns:repeat(4,minmax(0,1fr));grid-template-areas:"d d d d" "u q p s" "a a x x";padding:12px 14px}.cn-vr .d{grid-area:d}.cn-vr .u{grid-area:u}.cn-vr .q{grid-area:q}.cn-vr .p{grid-area:p}.cn-vr .s{grid-area:s}.cn-vr .am{grid-area:a;text-align:left;font-size:16px;align-self:center}.cn-vr .x{grid-area:x;justify-self:end}
.cn-dims{grid-template-columns:repeat(3,minmax(0,1fr))}.cn-dims .m{grid-column:1/-1}.cn-ap{grid-template-columns:84px repeat(3,minmax(0,1fr)) 30px}.cn-sc{grid-template-columns:1fr 70px 46px}.cn-sc input[type=range]{grid-column:1/-1;grid-row:2}.cn-gr{grid-template-columns:1fr 34px}.cn-gr textarea{grid-column:1/-1;grid-row:2}.cn-pg{grid-template-columns:minmax(0,1fr) 62px 86px 30px}.cn-mo{padding:0;align-items:end}.cn-mb,.cn-mb.wide{border-radius:20px 20px 0 0;max-height:92vh;width:100%}.cn-vx{grid-template-columns:1fr 1fr}}
.cn-still *{animation:none!important}.cn-still .cn-draw *,.cn-still .cn-plan rect{stroke-dashoffset:0!important}
@media (prefers-reduced-motion:reduce){.cn *,.cn-mo,.cn-mb{animation-duration:.01ms!important;animation-delay:0s!important;transition-duration:.01ms!important}.cn-draw *,.cn-plan rect,.cn-empty svg.big *{stroke-dashoffset:0!important}}
`;
  const ensureCss = () => { if (document.getElementById('cn-css')) return; const s = document.createElement('style'); s.id = 'cn-css'; s.textContent = CSS; document.head.appendChild(s); };

  /* ---------- pezzi comuni ---------- */
  const norm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const RL = 2 * Math.PI * 20;
  const ring = (v, c) => `<svg class="cn-ring" viewBox="0 0 50 50" aria-hidden="true"><circle class="bg" cx="25" cy="25" r="20"/><circle class="fg" cx="25" cy="25" r="20" style="stroke-dasharray:${(Math.max(0, Math.min(1, v)) * RL).toFixed(1)} 200;--c:${c || 'var(--accent)'}"/></svg>`;
  const $ = (s, el) => (el || root).querySelector(s), $$ = (s, el) => [...(el || root).querySelectorAll(s)];
  function modal(html, o = {}) {
    const m = document.createElement('div'); m.className = 'cn-mo'; m.innerHTML = `<div class="cn-mb${o.wide ? ' wide' : ''}">${html}</div>`;
    const key = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    const close = () => { document.removeEventListener('keydown', key, true); m.classList.add('out'); setTimeout(() => m.remove(), 200); if (o.onClose) o.onClose(); };
    m.addEventListener('mousedown', e => { m._d = e.target === m; });
    m.addEventListener('click', e => { if ((e.target === m && m._d) || e.target.closest('[data-mx]')) close(); });
    document.addEventListener('keydown', key, true); document.body.appendChild(m); m.close = close; return m;
  }
  const mh = (t, extra) => `<div class="cn-mh"><h3>${t}</h3><span class="sp"></span>${extra || ''}<button type="button" class="cn-ic" data-mx aria-label="Chiudi">${ic(IC.x)}</button></div>`;
  const field = (label, path, o = {}) => {
    const v = path.split('.').reduce((a, k) => (a == null ? a : a[k]), S.p), cls = o.w ? ` ${o.w}` : '';
    if (o.sel) return `<label class="cn-f${cls}"><span>${esc(label)}</span><select data-f="${path}">${o.sel.map(x => { const [val, lab] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(val)}"${String(v || '') === String(val) ? ' selected' : ''}>${esc(lab)}</option>`; }).join('')}</select></label>`;
    if (o.area) return `<label class="cn-f${cls}"><span>${esc(label)}</span><textarea data-f="${path}" rows="${o.rows || 3}" placeholder="${esc(o.ph || '')}">${esc(v || '')}</textarea></label>`;
    return `<label class="cn-f${cls}"><span>${esc(label)}</span><input data-f="${path}" type="${o.type || 'text'}" value="${esc(o.num ? dec(v) : v || '')}" placeholder="${esc(o.ph || '')}"${o.num ? ' inputmode="decimal"' : ''}${o.list ? ` list="${o.list}"` : ''}${o.max ? ` maxlength="${o.max}"` : ''}></label>`;
  };
  const getPath = (path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), S.p);
  const setPath = (path, val) => { const ks = path.split('.'), l = ks.pop(), o = ks.reduce((a, k) => (a[k] == null ? (a[k] = {}) : a[k]), S.p); o[l] = val; };
  const rItem = parts => { let arr = S.p[parts[0]], it = (arr || []).find(x => String(x.id) === parts[1]); if (it && parts.length > 3) { it = (it[parts[2]] || []).find(x => String(x.id) === parts[3]); } return it; };

  /* ---------- salvataggio ---------- */
  function setSv(k) { const el = $('#cn-sv'); if (!el) return; el.className = 'cn-sv ' + k; el.innerHTML = k === 'busy' ? `${ic(IC.sync)}Salvo…` : k === 'ok' ? `${ic(IC.check)}Salvato` : ''; }
  function touch() { if (!canW()) return; S.dirty = true; setSv('busy'); clearTimeout(S.tm); S.tm = setTimeout(save, 900); }
  function save() {
    clearTimeout(S.tm); const p = S.p; if (!p || !S.dirty || !canW()) return;
    if (!p.cli.nome && !p.cant.ind && !p.amb.length && !p.voci.length && !p.foto.length && !(p.piante || []).length) { S.dirty = false; return; }
    p.agg = today(); const json = JSON.stringify(p);
    if (json.length > 46000) C.toast('Questa pratica è molto grande: duplicala in due pratiche o riduci le foto/voci prima di aggiungere altro');
    S.dirty = false; C.write([{ action: 'upsert', sheet: 'Config', row: { chiave: keyOf(p.id), valore: json } }]); setSv('ok');
    clearTimeout(S.tv); S.tv = setTimeout(() => { const e = $('#cn-sv'); if (e && !S.dirty) e.className = 'cn-sv', e.innerHTML = ''; }, 2200);
  }
  addEventListener('pagehide', () => { try { save(); } catch {} });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { try { save(); } catch {} } });

  /* ---------- HOME ---------- */
  const HOUSE = '<svg class="cn-draw" viewBox="0 0 170 112" aria-hidden="true"><path style="--l:300;--i:0" d="M18 98V52l48-34 48 34v46z"/><path style="--l:90;--i:2" d="M52 98V72h28v26"/><rect style="--l:60;--i:3" x="88" y="58" width="16" height="14" rx="1.5"/><path style="--l:60;--i:3" d="M96 58v14M88 65h16"/><path class="a" style="--l:240;--i:4" d="M10 108h112M10 104v8M122 104v8"/><path style="--l:90;--i:5" d="M134 98V30M130 36l4-7 4 7"/><path style="--l:80;--i:6" d="M146 98V52M146 52h14M146 66h14M146 80h14"/></svg>';
  const EMPTY = '<svg class="big" viewBox="0 0 170 112" aria-hidden="true"><path style="--l:300;--i:0" d="M18 98V52l48-34 48 34v46z"/><path style="--l:90;--i:2" d="M52 98V72h28v26"/><rect style="--l:60;--i:3" x="88" y="58" width="16" height="14" rx="1.5"/><path class="a" style="--l:240;--i:4" d="M10 108h112M10 104v8M122 104v8"/><path style="--l:90;--i:5" d="M134 98V30M130 36l4-7 4 7"/></svg>';
  function todos(A) {
    const t = today(), out = [], dd = s => Math.round((new Date(s + 'T12:00') - new Date(t + 'T12:00')) / 864e5);
    A.forEach(p => {
      const c = (p.cli && p.cli.nome) || 'Senza nome';
      if (p.stato === 'sopralluogo' && p.sopr && p.sopr.data) { const d = dd(p.sopr.data); if (d < 0) out.push({ p, w: 0, c: '#d63a3a', i: IC.ruler, h: `Sopralluogo da completare · ${c}`, s: `era previsto il ${dIt(p.sopr.data)}` }); else if (d <= 3) out.push({ p, w: 1 + d, c: '#3362ab', i: IC.ruler, h: `Sopralluogo ${d === 0 ? 'oggi' : d === 1 ? 'domani' : 'il ' + dIt(p.sopr.data)}${p.sopr.ora ? ' alle ' + p.sopr.ora : ''} · ${c}`, s: [p.cant.ind, p.cant.citta].filter(Boolean).join(', ') || 'indirizzo da inserire' }); }
      if (p.stato === 'preventivo' && p.voci.length) out.push({ p, w: 5, c: '#8b5cf6', i: IC.send, h: `Preventivo da inviare · ${c}`, s: `${eur(totOf(p))} · ${p.voci.length} voci pronte` });
      if (p.stato === 'inviato') { const d = -dd((p.log && p.log.inviato) || p.agg || t); const vl = N(p.cond && p.cond.val) || 30, sc = vl - d; if (d >= 7) out.push({ p, w: 3, c: '#0e9fb4', i: IC.send, h: `Da richiamare · ${c}`, s: `inviato ${d} giorni fa${sc >= 0 && sc <= 7 ? ` · offerta valida ancora ${sc} gg` : sc < 0 ? ' · offerta scaduta' : ''}` }); }
      if (p.stato === 'accettato') out.push({ p, w: 4, c: '#1baf7a', i: IC.hammer, h: `Accettato: pianifica l'inizio lavori · ${c}`, s: eur(totOf(p)) });
    });
    return out.sort((a, b) => a.w - b.w).slice(0, 6);
  }
  function paintHome() {
    const A = ALL(), q = norm(S.q), t0 = A.map(p => [p, calc(p).tot]);
    const open = A.filter(p => !['chiuso', 'perso'].includes(p.stato)), won = t0.filter(([p]) => ['accettato', 'lavori', 'chiuso'].includes(p.stato)), lost = A.filter(p => p.stato === 'perso').length;
    const sent = t0.filter(([p]) => p.stato === 'inviato'), rate = won.length + lost ? won.length / (won.length + lost) : null, y = String(new Date().getFullYear());
    const wonY = won.filter(([p]) => String(p.log && p.log.accettato || p.creato || '').startsWith(y));
    const stats = ST.map(([k], i) => { const l = t0.filter(([p]) => p.stato === k); return { k, n: l.length, v: l.reduce((s, [, x]) => s + x, 0) }; }), mx = Math.max(1, ...stats.map(s => s.n));
    let L = t0.filter(([p]) => (!S.fs || (S.fs === 'perso' ? p.stato === 'perso' : p.stato === S.fs)) && (!q || norm([p.num, p.cli.nome, p.cant.ind, p.cant.citta, p.cant.tipo].join(' ')).includes(q)));
    L.sort((a, b) => String(b[0].agg || b[0].creato).localeCompare(String(a[0].agg || a[0].creato)) || String(b[0].num).localeCompare(String(a[0].num)));
    const td = todos(A);
    root.innerHTML = `<div class="cn${canW() ? '' : ' cn-ro'}${S.seen ? ' cn-still' : ''}" id="cn-r">
      <div class="cn-hero"><div class="cn-hero-in"><div><h2>Sopralluoghi e preventivi lavori</h2><p>Dal sopralluogo al preventivo firmato: misure, foto, computo, quadro economico, avanzamento lavori. Tutto in un posto solo.</p>
        ${canW() ? `<div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap"><button class="cn-btn wh" data-act="new">${ic(IC.plus)}Nuovo sopralluogo</button><button class="cn-btn gh" style="color:#fff;border-color:rgba(255,255,255,.35)" data-act="listino">${ic(IC.book)}Il mio listino</button></div>` : ''}</div>${HOUSE}</div></div>
      ${A.length ? `<div class="cn-kpis">
        <div class="cn-k" style="--i:0"><span>Pratiche aperte</span><b data-cu="${open.length}" data-f0="0">0</b><small>${A.filter(p => p.stato === 'sopralluogo').length} da rilevare · ${A.filter(p => p.stato === 'lavori').length} in lavorazione</small></div>
        <div class="cn-k" style="--i:1"><span>Preventivi in attesa</span><b data-cu="${sent.reduce((s, [, x]) => s + x, 0)}">€ 0</b><small>${sent.length} ${sent.length === 1 ? 'inviato' : 'inviati'} al cliente</small></div>
        <div class="cn-k" style="--i:2"><span>Lavori acquisiti ${y}</span><b data-cu="${wonY.reduce((s, [, x]) => s + x, 0)}">€ 0</b><small>${wonY.length} ${wonY.length === 1 ? 'pratica accettata' : 'pratiche accettate'}</small></div>
        <div class="cn-k" style="--i:3"><span>Tasso di accettazione</span><b>${rate == null ? '—' : fmt(rate * 100, 0) + '%'}</b><small>${rate == null ? 'servono preventivi chiusi' : `${won.length} accettati · ${lost} no`}</small>${rate == null ? '' : ring(rate, '#1baf7a')}</div></div>
      ${td.length ? `<div><div class="cn-h3">Da fare<small>${td.length} ${td.length === 1 ? 'cosa' : 'cose'}</small></div><div class="cn-todo" style="margin-top:10px">${td.map((x, i) => `<div class="cn-td" style="--c:${x.c};--i:${i}" data-open="${esc(x.p.id)}" role="button" tabindex="0"><span class="d">${ic(x.i)}</span><div><b>${esc(x.h)}</b><small>${esc(x.s)}</small></div>${ic(IC.chev)}</div>`).join('')}</div></div>` : ''}
      <div class="cn-pipe">${stats.map((s, i) => `<button class="cn-ps${S.fs === s.k ? ' on' : ''}" style="--c:${stCol(s.k)};--i:${i};--p:${(s.n / mx).toFixed(3)}" data-fs="${s.k}"><i></i><span>${stName(s.k)}</span><b>${s.n}</b><small>${s.v ? eur(s.v).replace(/,00$/, '') : '&nbsp;'}</small><u></u></button>`).join('')}</div>
      <div class="cn-bar"><div class="cn-s">${ic(IC.list)}<input id="cn-q" type="search" placeholder="Cerca cliente, indirizzo, numero…" value="${esc(S.q)}" autocomplete="off"></div>
        ${S.fs ? `<button class="cn-btn sm" data-fs="">${ic(IC.x)}${esc(stName(S.fs))}</button>` : ''}${lost ? `<button class="cn-btn sm gh" data-fs="perso">Non accettati (${lost})</button>` : ''}</div>
      <div id="cn-list">${homeList()}</div>`
      : `<div class="cn-empty">${EMPTY}<b>Inizia dal primo sopralluogo</b><p>Rileva le stanze con le misure, scatta le foto, spunta la lista dei controlli e costruisci il preventivo con il tuo listino. Poi invia un PDF professionale al cliente.</p>${canW() ? `<button class="cn-btn pri" data-act="new">${ic(IC.plus)}Nuovo sopralluogo</button>` : ''}</div>`}</div>`;
    S.seen = true;
    $$('[data-cu]').forEach(el => { const v = +el.dataset.cu; if (el.dataset.f0) C.countTo(el, v, x => String(Math.round(x))); else C.countTo(el, v, x => eur(x).replace(/,00$/, '')); });
  }
  const cardP = (p, tot, i) => {
    const idx = stIdx(p.stato), perso = p.stato === 'perso', col = stCol(p.stato), lastN = (p.voci || []).length;
    return `<button class="cn-pc" style="--c:${col};--i:${Math.min(i, 12)}" data-open="${esc(p.id)}"><div class="cn-pc-t"><span class="cn-num">${esc(p.num)}</span><span class="cn-chip" style="--c:${col}">${esc(stName(p.stato))}</span></div>
      <h4>${esc(p.cli.nome || 'Cliente da inserire')}</h4><p>${ic(IC.pin)}${esc([p.cant.ind, p.cant.citta].filter(Boolean).join(', ') || 'Indirizzo da inserire')}</p>
      <div class="cn-seg" style="--c:${col}">${ST.map((s, j) => `<i class="${!perso && j <= idx ? 'on' : ''}" style="--j:${j}"></i>`).join('')}</div>
      <div class="cn-pc-b"><div><b>${tot ? eur(tot) : '—'}</b></div><small>${esc(p.cant.tipo || '')}<br>${p.stato === 'sopralluogo' ? 'Sopralluogo ' + dIt(p.sopr && p.sopr.data) : lastN + (lastN === 1 ? ' voce' : ' voci')}</small></div></button>`;
  };

  /* ---------- EDITOR: struttura ---------- */
  const TABS = [['dati', 'Dati', IC.user], ['rilievo', 'Rilievo', IC.ruler], ['piantina', 'Piantina', IC.plan], ['computo', 'Computo', IC.list], ['prev', 'Preventivo', IC.euro], ['lavori', 'Cantiere', IC.hammer]];
  const tabFor = st => ({ sopralluogo: 'rilievo', preventivo: 'computo', inviato: 'prev', accettato: 'prev', lavori: 'lavori', chiuso: 'lavori', perso: 'prev' }[st] || 'dati');
  function openP(id) {
    save(); const ex = id ? getP(id) : null;
    S.p = ex || newP(); S.id = S.p.id; S.v = 'p'; S.tab = ex ? tabFor(ex.stato) : 'dati'; S.dirty = false; S.mod = null;
    paintEditor(); window.scrollTo({ top: 0 });
  }
  function goHome() { save(); S.v = 'home'; S.p = null; S.seen = false; paintHome(); window.scrollTo({ top: 0 }); }
  function paintEditor() {
    const p = S.p, t = calc(p), lost = p.stato === 'perso';
    root.innerHTML = `<div class="cn${canW() ? '' : ' cn-ro'}" id="cn-r"><div class="cn-top"><div class="cn-top-r">
      <button class="cn-back" data-act="home" aria-label="Torna alle pratiche">${ic(IC.back)}</button>
      <div style="min-width:0"><div class="sub">${esc(p.num)}${lost ? ' · NON ACCETTATO' : ''}</div><h2 id="cn-ht">${esc(p.cli.nome || 'Nuova pratica')}</h2></div>
      <span class="cn-sv" id="cn-sv"></span><div class="cn-tot"><small>Totale IVA inclusa</small><b id="cn-htot">${eur(t.tot)}</b></div></div>
      <div class="cn-step" id="cn-step">${ST.map(([k, n, c]) => `<button type="button" data-st="${k}" style="--c:${c}"><i></i><span>${n}</span></button>`).join('')}</div></div>
      <div class="cn-tw"><div class="cn-tabs" id="cn-tabs">${TABS.map(([k, n, i]) => `<button type="button" data-tab="${k}">${ic(i)}${n}</button>`).join('')}<span class="ind"></span></div></div><div id="cn-pane"></div></div>`;
    paintStep(); setTab(S.tab, true);
  }
  function paintStep() {
    const p = S.p, idx = p.stato === 'perso' ? -1 : stIdx(p.stato);
    $$('#cn-step button').forEach((b, i) => { b.classList.toggle('done', i < idx); b.classList.toggle('cur', i === idx); });
    const sub = $('.cn-top .sub'); if (sub) sub.textContent = p.num + (p.stato === 'perso' ? ' · NON ACCETTATO' : '');
  }
  function moveInd() { const b = $('#cn-tabs button.on'), i = $('#cn-tabs .ind'); if (b && i) { i.style.left = b.offsetLeft + 'px'; i.style.width = b.offsetWidth + 'px'; b.scrollIntoView({ block: 'nearest', inline: 'center' }); } }
  function setTab(t, first) {
    S.tab = t; $$('#cn-tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
    const pane = $('#cn-pane');
    if (t === 'piantina' && !window.CDC_CAD) { pane.innerHTML = '<div class="cn-card"><div class="cn-empty"><b>Carico il disegno…</b></div></div>'; C.loadLib('cantieri-cad.js?v=263').then(() => { if (S.tab === 'piantina') setTab('piantina', true); }).catch(() => { pane.innerHTML = '<div class="cn-card"><div class="cn-empty"><b>Disegno non disponibile</b><p>Controlla la connessione e riprova.</p></div></div>'; }); requestAnimationFrame(moveInd); return; }
    pane.innerHTML = { dati: paneDati, rilievo: paneRilievo, piantina: panePiantina, computo: paneComputo, prev: panePrev, lavori: paneLavori }[t]();
    pane.firstElementChild && pane.firstElementChild.classList.add('cn-pane'); afterPane(); if (!first) window.scrollTo({ top: 0, behavior: 'smooth' });
    requestAnimationFrame(moveInd);
  }
  function afterPane() { loadThumbs(); if (!canW()) $$('#cn-pane input,#cn-pane select,#cn-pane textarea,#cn-pane [data-w]').forEach(e => { e.disabled = true; }); }
  function setStato(k) {
    if (!canW() || S.p.stato === k) return; const p = S.p; p.stato = k; p.log = p.log || {}; p.log[k] = today(); touch(); paintStep(); live();
    if (k === 'accettato' || k === 'lavori') C.toast(k === 'accettato' ? 'Preventivo accettato' : 'Lavori avviati');
  }

  /* ---------- aggiornamento in tempo reale dei totali ---------- */
  function live() {
    if (!S.p) return; const p = S.p, t = calc(p);
    const ht = $('#cn-htot'); if (ht) ht.textContent = eur(t.tot);
    $$('[data-am]').forEach(e => { const v = p.voci.find(x => String(x.id) === e.dataset.am); if (v) e.textContent = eur(vAmt(v)); });
    $$('[data-cs]').forEach(e => { const l = p.voci.filter(v => (v.cat || 'Varie') === e.dataset.cs && vIn(v)); e.textContent = eur(l.reduce((s, v) => s + vAmt(v), 0)); });
    $$('[data-q]').forEach(e => { const k = e.dataset.q; e.textContent = eur(t[k]); });
    $$('[data-tl]').forEach(e => { e.textContent = { n: t.nv, pav: fmt(totM(p).pav), net: fmt(totM(p).net), vol: fmt(totM(p).vol), amb: p.amb.length }[e.dataset.tl]; });
    const sk = $('#cn-stk'); if (sk) sk.innerHTML = stk(t);
    const qe = $('#cn-qe'); if (qe) qe.innerHTML = qeHtml(t);
    $$('[data-ms]').forEach(e => { const a = p.amb.find(x => String(x.id) === e.dataset.ms); if (a) e.innerHTML = msChips(a); });
    const pg = $('#cn-pgt'); if (pg) pg.innerHTML = pagTot(t);
    $$('[data-pgi]').forEach(e => { const r = p.pag.find(x => String(x.id) === e.dataset.pgi); if (r) e.textContent = eur(r2(t.tot * N(r.pc) / 100)); });
    const lv = $('#cn-lv'); if (lv) lv.innerHTML = lavTot(t);
  }
  const stk = t => { const parts = [[t.A, '#3362ab'], [t.SG + t.UT, '#8b5cf6'], [t.SIC, '#eb6834'], [t.iva, '#9aa3b5']].filter(x => x[0] > 0), tt = parts.reduce((s, x) => s + x[0], 0) || 1; return parts.map((x, i) => `<i style="--c:${x[1]};--i:${i};flex:${(x[0] / tt * 100).toFixed(2)} 0 0"></i>`).join(''); };

  /* ---------- scheda DATI ---------- */
  function paneDati() {
    const p = S.p, cl = (C.db().clienti || []).slice().sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'it')), dp = (C.db().dipendenti || []).filter(d => d.stato !== 'cessato');
    const tec = dp.map(d => `${d.nome || ''} ${d.cognome || ''}`.trim()).filter(Boolean);
    return `<div class="cn-pane">
      ${canW() ? '' : '<div class="cn-note ro">' + ic(IC.warn) + '<span>Hai il permesso di sola lettura su questa sezione.</span></div>'}
      <div class="cn-card"><h3>${ic(IC.user)}Cliente</h3><div class="cn-g">
        ${cl.length ? `<label class="cn-f wf"><span>Scegli dall'anagrafica clienti</span><select id="cn-cpick"><option value="">— nuovo cliente —</option>${cl.map(c => `<option value="${esc(c.id)}"${String(p.cli.id) === String(c.id) ? ' selected' : ''}>${esc(c.nome)}</option>`).join('')}</select></label>` : ''}
        ${field('Nome o ragione sociale', 'cli.nome', { w: 'w2', ph: 'Es. Mario Rossi', max: 90 })}${field('Referente', 'cli.ref', { max: 60 })}${field('Telefono', 'cli.tel', { type: 'tel', max: 30 })}${field('Email', 'cli.email', { type: 'email', max: 80 })}
        ${field('Indirizzo di residenza / sede', 'cli.ind', { w: 'w2', max: 100 })}${field('CAP', 'cli.cap', { max: 8 })}${field('Città', 'cli.citta', { max: 60 })}${field('Prov.', 'cli.prov', { max: 3 })}${field('Partita IVA', 'cli.piva', { max: 16 })}${field('Codice fiscale', 'cli.cf', { max: 16 })}</div></div>
      <div class="cn-card"><h3>${ic(IC.pin)}Cantiere<span class="sp"></span>${canW() ? '<button type="button" class="cn-btn sm gh" data-act="same-addr">Stesso indirizzo del cliente</button>' : ''}</h3><div class="cn-g">
        ${field('Indirizzo del cantiere', 'cant.ind', { w: 'w2', max: 100 })}${field('Città', 'cant.citta', { max: 60 })}${field('Tipo di intervento', 'cant.tipo', { sel: TIPI })}${field('Tipo di immobile', 'cant.immobile', { sel: IMMOBILI })}
        ${field('Piano', 'cant.piano', { ph: 'Es. 3°', max: 20 })}${field('Ascensore', 'cant.asc', { sel: [['', '—'], ['si', 'Sì'], ['no', 'No']] })}${field('Anno di costruzione', 'cant.anno', { max: 4, ph: 'Es. 1975' })}
        ${field('Note sul cantiere', 'cant.note', { w: 'wf', area: 1, rows: 2, ph: 'Accessi, orari, vincoli del condominio…' })}</div></div>
      <div class="cn-card"><h3>${ic(IC.ruler)}Sopralluogo</h3><div class="cn-g">
        ${field('Data', 'sopr.data', { type: 'date' })}${field('Ora', 'sopr.ora', { type: 'time' })}
        <label class="cn-f"><span>Tecnico</span><input data-f="sopr.tecnico" list="cn-tec" value="${esc(p.sopr.tecnico || '')}" maxlength="60" placeholder="Chi fa il sopralluogo"><datalist id="cn-tec">${tec.map(x => `<option value="${esc(x)}">`).join('')}</datalist></label>
        ${field('Come ci ha conosciuto', 'sopr.fonte', { sel: [['', '—']].concat(FONTI) })}</div>
        <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">${canW() ? `<button type="button" class="cn-btn pri" data-tab="rilievo">Vai al rilievo ${ic(IC.chev)}</button>` : ''}</div></div>
      ${canW() && ALL().some(x => x.id === p.id) ? `<div class="cn-acts"><button class="cn-btn sm gh" data-act="dup">${ic(IC.copy)}Duplica pratica</button><button class="cn-btn sm gh dg" data-act="del">${ic(IC.trash)}Elimina pratica</button></div>` : ''}
    </div>`;
  }

  /* ---------- scheda RILIEVO ---------- */
  const msChips = a => { const m = misure(a); return `<span>Pavimento <b>${fmt(m.pav)} mq</b></span><span>Perimetro <b>${fmt(m.per)} m</b></span><span>Pareti nette <b>${fmt(m.net)} mq</b></span><span>Volume <b>${fmt(m.vol)} mc</b></span>`; };
  const ambRow = a => `<div class="cn-ar" data-amb="${esc(a.id)}"><div class="cn-ar-h"><input class="cn-in" list="cn-amb-l" data-r="amb|${esc(a.id)}|n" value="${esc(a.n || '')}" placeholder="Nome ambiente" maxlength="40"><span class="sp" style="flex:1"></span><button type="button" class="cn-ic" data-act="amb-del" data-id="${esc(a.id)}" data-w aria-label="Elimina ambiente">${ic(IC.trash)}</button></div>
    <div class="cn-dims"><label class="cn-f"><span>Lunghezza (m)</span><input class="cn-in" inputmode="decimal" data-r="amb|${esc(a.id)}|l" value="${esc(dec(a.l))}" placeholder="0,00"></label><label class="cn-f"><span>Larghezza (m)</span><input class="cn-in" inputmode="decimal" data-r="amb|${esc(a.id)}|p" value="${esc(dec(a.p))}" placeholder="0,00"></label><label class="cn-f"><span>Altezza (m)</span><input class="cn-in" inputmode="decimal" data-r="amb|${esc(a.id)}|h" value="${esc(dec(a.h))}" placeholder="2,70"></label><div class="cn-m m" data-ms="${esc(a.id)}">${msChips(a)}</div></div>
    ${(a.ap || []).map(x => `<div class="cn-ap" data-api="${esc(x.id)}"><select class="cn-in" data-r="amb|${esc(a.id)}|ap|${esc(x.id)}|t"><option${x.t === 'Porta' ? ' selected' : ''}>Porta</option><option${x.t === 'Finestra' ? ' selected' : ''}>Finestra</option><option${x.t === 'Portafinestra' ? ' selected' : ''}>Portafinestra</option><option${x.t === 'Vano' ? ' selected' : ''}>Vano</option></select><input class="cn-in" inputmode="decimal" placeholder="Larg. m" data-r="amb|${esc(a.id)}|ap|${esc(x.id)}|l" value="${esc(dec(x.l))}"><input class="cn-in" inputmode="decimal" placeholder="Alt. m" data-r="amb|${esc(a.id)}|ap|${esc(x.id)}|h" value="${esc(dec(x.h))}"><input class="cn-in" inputmode="numeric" placeholder="Quante" data-r="amb|${esc(a.id)}|ap|${esc(x.id)}|q" value="${esc(x.q || '')}"><button type="button" class="cn-ic" data-act="ap-del" data-id="${esc(a.id)}" data-ap="${esc(x.id)}" data-w aria-label="Togli apertura">${ic(IC.x)}</button></div>`).join('')}
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button type="button" class="cn-btn sm" data-act="ap-add" data-id="${esc(a.id)}" data-w>${ic(IC.plus)}Porta o finestra</button><span class="cn-hint">Le aperture si tolgono dalle pareti.</span></div>
    <label class="cn-f"><span>Note dell'ambiente</span><input class="cn-in" data-r="amb|${esc(a.id)}|note" value="${esc(a.note || '')}" placeholder="Stato, problemi, da rifare…" maxlength="160"></label></div>`;
  function planSvg(p) {
    const R = p.amb.filter(a => N(a.l) > 0 && N(a.p) > 0); if (!R.length) return '';
    const k = 30, gap = 10, maxW = 620; let x = 0, y = 0, rh = 0; const it = [];
    R.forEach(a => { const w = N(a.l) * k, h = N(a.p) * k; if (x + w > maxW && x > 0) { x = 0; y += rh + gap; rh = 0; } it.push({ a, x, y, w, h }); x += w + gap; rh = Math.max(rh, h); });
    const W = Math.max(...it.map(o => o.x + o.w)), H = y + rh;
    return `<svg class="cn-plan" viewBox="-10 -10 ${(W + 20).toFixed(0)} ${(H + 20).toFixed(0)}" role="img" aria-label="Schema delle stanze in scala">${it.map((o, i) => { const fs = Math.max(8, Math.min(13, o.w / Math.max(4, String(o.a.n || '').length) * 1.5)); return `<rect style="--i:${i}" x="${o.x.toFixed(1)}" y="${o.y.toFixed(1)}" width="${o.w.toFixed(1)}" height="${o.h.toFixed(1)}" rx="4"/><text x="${(o.x + o.w / 2).toFixed(1)}" y="${(o.y + o.h / 2 - 1).toFixed(1)}" style="font-size:${fs.toFixed(1)}px">${esc(o.a.n || 'Ambiente')}</text><text class="t2" x="${(o.x + o.w / 2).toFixed(1)}" y="${(o.y + o.h / 2 + 12).toFixed(1)}">${fmt(N(o.a.l) * N(o.a.p))} mq</text>`; }).join('')}</svg>`;
  }
  function chkRow(k, l) {
    const p = S.p, st = p.chk[k] || '', COLS = { ok: '#1f9d6b', att: '#c98500', no: '#d63a3a' };
    return `<div class="cn-ci" data-ck="${k}"><span>${esc(l)}</span><div class="cn-cs">${[['ok', 'A posto'], ['att', 'Attenzione'], ['no', 'Criticità']].map(([s, n]) => `<button type="button" data-w data-cks="${k}:${s}" class="${st === s ? 'on' : ''}" style="--c:${COLS[s]}">${n}</button>`).join('')}</div>${st === 'att' || st === 'no' ? `<input class="cn-in" data-cn="${k}" value="${esc(p.chkN[k] || '')}" placeholder="Cosa hai visto? (finisce nel rilievo)" maxlength="160">` : ''}</div>`;
  }
  function chkHead() { const s = chkStat(S.p); return `<div class="cn-rg" style="width:64px;height:64px">${ring(s.d / s.t, s.w ? '#c98500' : '#1f9d6b')}<span style="font-size:15px">${Math.round(s.d / s.t * 100)}%</span></div><div><b style="font-size:15px">${s.d} di ${s.t} controlli fatti</b><div class="cn-hint">${s.w ? `<span style="color:#c98500;font-weight:600">${s.w} da tenere d'occhio</span> · ` : ''}spunta mentre giri nella casa</div></div>`; }
  function paneRilievo() {
    const p = S.p, T = totM(p);
    return `<div class="cn-pane">${canW() || (p.piante || []).length ? `<button type="button" class="cn-ban" data-tab="piantina"><span class="i">${ic(IC.plan)}</span><span><b>${(p.piante || []).length ? 'Piantina del sopralluogo' : 'Disegna la piantina mentre misuri'}</b><small>${(p.piante || []).length ? (p.piante.length + (p.piante.length === 1 ? ' disegno' : ' disegni') + ' · pareti, porte, impianti e quote') : 'Pareti con le misure, porte, finestre, arredi e impianti: i mq passano al rilievo'}</small></span>${ic(IC.chev)}</button>` : ''}<div class="cn-card"><h3>${ic(IC.ruler)}Ambienti e misure<span class="sp"></span><small>${p.amb.length} ${p.amb.length === 1 ? 'ambiente' : 'ambienti'}</small></h3>
      <div class="cn-sum" style="margin-bottom:14px"><div class="cn-sm"><span>Pavimenti</span><b><i style="font-style:normal" data-tl="pav">${fmt(T.pav)}</i> mq</b></div><div class="cn-sm"><span>Pareti nette</span><b><i style="font-style:normal" data-tl="net">${fmt(T.net)}</i> mq</b></div><div class="cn-sm"><span>Volume</span><b><i style="font-style:normal" data-tl="vol">${fmt(T.vol)}</i> mc</b></div><div class="cn-sm"><span>Ambienti</span><b data-tl="amb">${p.amb.length}</b></div></div>
      <div id="cn-plan">${planSvg(p)}</div>
      <div class="cn-amb" id="cn-amb" style="margin-top:14px">${p.amb.map(ambRow).join('')}</div><datalist id="cn-amb-l">${AMB.map(x => `<option value="${x}">`).join('')}</datalist>
      ${canW() ? `<div class="cn-chips" style="margin-top:14px;flex-wrap:wrap">${['Soggiorno', 'Cucina', 'Camera', 'Bagno', 'Corridoio', 'Ingresso', 'Balcone'].map(x => `<button type="button" data-act="amb-add" data-n="${x}">+ ${x}</button>`).join('')}<button type="button" data-act="amb-add" data-n="">+ Altro</button></div>` : ''}</div>
      <div class="cn-card"><h3>${ic(IC.check)}Lista dei controlli<span class="sp"></span><small>cosa guardare in sopralluogo</small></h3><div style="display:flex;gap:14px;align-items:center;margin-bottom:16px" id="cn-chead">${chkHead()}</div><div class="cn-chk">${CHK.map(([g, it]) => `<div class="cn-cg"><b>${g}</b>${it.map(([k, l]) => chkRow(k, l)).join('')}</div>`).join('')}</div></div>
      <div class="cn-card"><h3>${ic(IC.cam)}Foto del sopralluogo<span class="sp"></span><small>${p.foto.length} ${p.foto.length === 1 ? 'foto' : 'foto'}</small></h3><div class="cn-ph" id="cn-ph">${photosHtml()}</div>
        <input type="file" id="cn-fc" accept="image/*" capture="environment" hidden><input type="file" id="cn-fg" accept="image/*" multiple hidden>
        ${canW() ? `<div class="cn-acts" style="margin-top:14px"><button class="cn-btn" data-act="foto-cam">${ic(IC.cam)}Scatta foto</button><button class="cn-btn" data-act="foto-gal">${ic(IC.clip)}Dalla galleria</button></div>` : ''}<p class="cn-hint" style="margin-top:10px">Le foto si ridimensionano e si salvano nel tuo Drive. Tocca una foto per scrivere una didascalia o disegnarci sopra.</p></div>
      <div class="cn-card"><h3>${ic(IC.warn)}Criticità e note del rilievo<span class="sp"></span>${micBtn()}</h3><label class="cn-f"><textarea id="cn-crit" data-f="crit" rows="5" placeholder="Cosa va sistemato prima, imprevisti possibili, richieste del cliente…">${esc(p.crit || '')}</textarea></label>
        <div style="margin-top:14px"><button class="cn-btn pri" data-tab="computo">Passa al computo ${ic(IC.chev)}</button></div></div></div>`;
  }
  const micBtn = () => (window.SpeechRecognition || window.webkitSpeechRecognition) && canW() ? `<button type="button" class="cn-ic" data-act="mic" aria-label="Detta le note">${ic(IC.mic)}</button>` : '';
  const photosHtml = () => S.p.foto.map((f, i) => `<div class="cn-pt sk" data-ph="${esc(f.id)}" style="--i:${Math.min(i, 14)}"><img alt=""><span>${esc(f.cap || '')}</span></div>`).join('') + (canW() ? `<button type="button" class="cn-add" data-act="foto-gal">${ic(IC.plus)}Aggiungi</button>` : '');

  /* ---------- foto ---------- */
  const useMem = () => C.DEMO() || C.isLocal();
  function compress(file, max, q) {
    return new Promise((res, rej) => {
      const u = URL.createObjectURL(file), img = new Image();
      img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); res(c.toDataURL('image/jpeg', q)); };
      img.onerror = () => { URL.revokeObjectURL(u); rej(new Error('Foto non leggibile')); }; img.src = u;
    });
  }
  async function addPhotos(files) {
    const list = [...files].filter(f => /^image\//.test(f.type) || /\.(jpe?g|png|webp|heic)$/i.test(f.name)); if (!list.length) return;
    for (const f of list) {
      try {
        C.busy('Preparo la foto…'); const full = await compress(f, 1600, .72), th = await compress(f, 360, .66), id = 'f' + C.uid(), ph = { id, f: '', t: '', cap: '', amb: '', ts: new Date().toISOString() };
        if (useMem()) S.mem[id] = { f: full, t: th };
        else { C.busy('Salvo la foto nel tuo Drive…'); const nm = `Sopralluogo ${S.p.num} ${S.p.foto.length + 1}`.replace(/[\\/]/g, '-'); ph.f = await C.api('uploadDoc', { name: nm + '.jpg', mime: 'image/jpeg', data: full.split(',')[1] }); ph.t = await C.api('uploadDoc', { name: nm + ' miniatura.jpg', mime: 'image/jpeg', data: th.split(',')[1] }); S.thumbs[ph.t] = th; }
        S.p.foto.push(ph); touch();
      } catch (e) { C.toast(e.message || 'Foto non salvata'); }
    }
    C.busy(); const g = $('#cn-ph'); if (g) { g.innerHTML = photosHtml(); loadThumbs(); const h = $('.cn-card h3 small', g.parentElement); if (h) h.textContent = S.p.foto.length + ' foto'; }
  }
  async function photoData(ph, full) {
    if (S.mem[ph.id]) return S.mem[ph.id][full ? 'f' : 't'];
    const id = full ? ph.f : (ph.t || ph.f); if (!id) return '';
    if (S.thumbs[id]) return S.thumbs[id];
    const r = await C.api('getDoc', { id }); return (S.thumbs[id] = `data:${r.mime || 'image/jpeg'};base64,${r.data}`);
  }
  async function loadThumbs() {
    const els = $$('.cn-pt.sk'), q = els.slice(); const work = async () => { while (q.length) { const el = q.shift(), ph = S.p && S.p.foto.find(x => x.id === el.dataset.ph); if (!ph) continue; try { const src = await photoData(ph, false); if (src && el.isConnected) { $('img', el).src = src; el.classList.remove('sk'); } } catch { el.classList.remove('sk'); } } };
    await Promise.all([work(), work(), work()]);
  }
  function lightbox(id) {
    const ph = S.p.foto.find(x => x.id === id); if (!ph) return;
    const m = modal(`${mh('Foto del sopralluogo')}<div class="cn-ms"><div class="cn-lbx"><img alt="" id="cn-lbi"></div>
      <label class="cn-f"><span>Didascalia</span><input class="cn-in" id="cn-cap" value="${esc(ph.cap || '')}" maxlength="80" placeholder="Es. Crepa sul muro del bagno"></label>
      <label class="cn-f"><span>Ambiente</span><select class="cn-in" id="cn-pamb"><option value="">—</option>${S.p.amb.map(a => `<option${ph.amb === (a.n || '') ? ' selected' : ''}>${esc(a.n || 'Ambiente')}</option>`).join('')}</select></label></div>
      <div class="cn-mf">${canW() ? `<button class="cn-btn dg" data-x="del">${ic(IC.trash)}Elimina</button><button class="cn-btn" data-x="pen">${ic(IC.edit)}Disegna sopra</button>` : ''}<button class="cn-btn pri" data-mx>Fatto</button></div>`, { onClose: () => { const g = $('#cn-ph'); if (g) { g.innerHTML = photosHtml(); loadThumbs(); } } });
    photoData(ph, true).then(s => { const i = $('#cn-lbi', m); if (i && s) i.src = s; }).catch(() => C.toast('Foto non disponibile'));
    $('#cn-cap', m).oninput = e => { ph.cap = e.target.value; touch(); }; $('#cn-pamb', m).onchange = e => { ph.amb = e.target.value; touch(); };
    m.addEventListener('click', e => { const b = e.target.closest('[data-x]'); if (!b) return; if (b.dataset.x === 'del') { if (!confirm('Eliminare questa foto?')) return; S.p.foto = S.p.foto.filter(x => x.id !== id); touch(); m.close(); } else if (b.dataset.x === 'pen') { m.close(); annotate(id); } });
  }
  async function annotate(id) {
    const ph = S.p.foto.find(x => x.id === id); let src; try { C.busy('Apro la foto…'); src = await photoData(ph, true); } catch { C.busy(); return C.toast('Foto non disponibile'); } C.busy();
    const img = new Image(); await new Promise(r => { img.onload = r; img.src = src; });
    const k = Math.min(1, 1100 / Math.max(img.width, img.height)), W = Math.round(img.width * k), H = Math.round(img.height * k); let col = '#ef3b3b', hist = [], cur = null;
    const m = modal(`${mh('Disegna sulla foto')}<div class="cn-ms"><div class="cn-lbx"><canvas id="cn-cv" width="${W}" height="${H}"></canvas></div><div class="cn-pens">${['#ef3b3b', '#ffd23f', '#ffffff', '#1baf7a'].map((c, i) => `<i style="--c:${c}" data-c="${c}" class="${i ? '' : 'on'}"></i>`).join('')}<button class="cn-btn sm" data-x="undo">Annulla</button></div></div><div class="cn-mf"><button class="cn-btn" data-mx>Chiudi senza salvare</button><button class="cn-btn pri" data-x="ok">Salva disegno</button></div>`, { wide: true });
    const cv = $('#cn-cv', m), cx = cv.getContext('2d'); const draw = () => { cx.drawImage(img, 0, 0, W, H); hist.forEach(s => { cx.strokeStyle = s.c; cx.lineWidth = Math.max(4, W / 220); cx.lineCap = cx.lineJoin = 'round'; cx.beginPath(); s.p.forEach(([x, y], i) => i ? cx.lineTo(x, y) : cx.moveTo(x, y)); cx.stroke(); }); }; draw();
    const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; };
    cv.onpointerdown = e => { cv.setPointerCapture(e.pointerId); cur = { c: col, p: [pt(e)] }; hist.push(cur); }; cv.onpointermove = e => { if (!cur) return; cur.p.push(pt(e)); draw(); }; cv.onpointerup = () => { cur = null; };
    m.addEventListener('click', async e => {
      const c = e.target.closest('[data-c]'); if (c) { col = c.dataset.c; $$('.cn-pens i', m).forEach(i => i.classList.toggle('on', i === c)); return; }
      const b = e.target.closest('[data-x]'); if (!b) return; if (b.dataset.x === 'undo') { hist.pop(); draw(); return; }
      if (b.dataset.x === 'ok') { try {
        C.busy('Salvo la foto…'); const full = cv.toDataURL('image/jpeg', .78), tc = document.createElement('canvas'), tk = 360 / Math.max(W, H); tc.width = Math.round(W * tk); tc.height = Math.round(H * tk); tc.getContext('2d').drawImage(cv, 0, 0, tc.width, tc.height); const th = tc.toDataURL('image/jpeg', .66);
        if (useMem()) S.mem[id] = { f: full, t: th }; else { const nm = `Sopralluogo ${S.p.num} disegno`; ph.f = await C.api('uploadDoc', { name: nm + '.jpg', mime: 'image/jpeg', data: full.split(',')[1] }); ph.t = await C.api('uploadDoc', { name: nm + ' miniatura.jpg', mime: 'image/jpeg', data: th.split(',')[1] }); S.thumbs[ph.f] = full; S.thumbs[ph.t] = th; }
        touch(); C.busy(); m.close(); const g = $('#cn-ph'); if (g) { g.innerHTML = photosHtml(); loadThumbs(); } } catch (er) { C.busy(); C.toast(er.message || 'Non salvata'); } }
    });
  }
  /* dettatura delle note */
  function dictate(btn) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return; const ta = $('#cn-crit'); if (!ta) return;
    if (btn._r) { btn._r.stop(); return; }
    const r = new SR(); r.lang = 'it-IT'; r.interimResults = false; r.continuous = true; btn._r = r; btn.classList.add('on');
    r.onresult = e => { let t = ''; for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) t += e.results[i][0].transcript + ' '; if (t) { ta.value = (ta.value ? ta.value.replace(/\s*$/, ' ') : '') + t.trim(); S.p.crit = ta.value; touch(); } };
    r.onend = r.onerror = () => { btn.classList.remove('on'); btn._r = null; }; try { r.start(); } catch { btn._r = null; btn.classList.remove('on'); }
  }

  /* ---------- scheda COMPUTO ---------- */
  const UMS = ['mq', 'ml', 'mc', 'cad', 'corpo', 'ora', 'giorno', 'kg', 'q.li', 't'];
  const voceRow = (v, i) => `<div class="cn-vr${v.opt ? ' opt' : ''}${v.var ? ' var' : ''}" data-v="${esc(v.id)}" style="animation-delay:${Math.min(i, 8) * 30}ms">
    <input class="cn-in d" data-r="voci|${esc(v.id)}|d" value="${esc(v.d || '')}" placeholder="Descrizione della lavorazione" maxlength="200">
    <input class="cn-in u" data-r="voci|${esc(v.id)}|um" list="cn-um" value="${esc(v.um || '')}" placeholder="U.M." maxlength="8">
    <input class="cn-in q num" inputmode="decimal" data-r="voci|${esc(v.id)}|q" value="${esc(dec(v.q))}" placeholder="Q.tà">
    <input class="cn-in p num" inputmode="decimal" data-r="voci|${esc(v.id)}|pr" value="${esc(dec(v.pr))}" placeholder="Prezzo €">
    <input class="cn-in s num" inputmode="decimal" data-r="voci|${esc(v.id)}|sc" value="${esc(dec(v.sc))}" placeholder="Sc. %">
    <div class="am" data-am="${esc(v.id)}">${eur(vAmt(v))}</div>
    <div class="x"><button type="button" class="cn-ic" data-act="v-mis" data-id="${esc(v.id)}" data-w title="Prendi la quantità dalle misure" aria-label="Quantità dalle misure">${ic(IC.ruler)}</button><button type="button" class="cn-ic${v.opt || v.var || N(v.cs) ? ' on' : ''}" data-act="v-more" data-id="${esc(v.id)}" aria-label="Altre opzioni">${ic(IC.edit)}</button><button type="button" class="cn-ic" data-act="v-del" data-id="${esc(v.id)}" data-w aria-label="Elimina voce">${ic(IC.trash)}</button></div></div>
    <div class="cn-vx hid" data-vx="${esc(v.id)}"><label class="cn-f"><span>Il tuo costo (privato) €/${esc(v.um || 'um')}</span><input class="cn-in" inputmode="decimal" data-r="voci|${esc(v.id)}|cs" value="${esc(dec(v.cs))}" placeholder="serve per il margine"></label>
      <label class="cn-f"><span>Ambiente</span><select class="cn-in" data-r="voci|${esc(v.id)}|amb"><option value="">—</option>${S.p.amb.map(a => `<option${v.amb === (a.n || '') ? ' selected' : ''}>${esc(a.n || 'Ambiente')}</option>`).join('')}</select></label>
      <div class="cn-f"><span>Tipo di voce</span><div class="cn-chips"><button type="button" data-vt="opt:${esc(v.id)}" data-w class="${v.opt ? 'on' : ''}">Opzionale</button>${v.opt ? `<button type="button" data-vt="on:${esc(v.id)}" data-w class="${v.on ? 'on' : ''}">Inclusa nel totale</button>` : ''}<button type="button" data-vt="var:${esc(v.id)}" data-w class="${v.var ? 'on' : ''}">Variante</button></div></div>
      <div class="cn-acts" style="grid-column:1/-1"><button type="button" class="cn-btn sm" data-act="v-up" data-id="${esc(v.id)}" data-w>${ic(IC.up)}Su</button><button type="button" class="cn-btn sm" data-act="v-down" data-id="${esc(v.id)}" data-w>${ic(IC.down)}Giù</button><button type="button" class="cn-btn sm" data-act="v-dup" data-id="${esc(v.id)}" data-w>${ic(IC.copy)}Duplica</button></div></div>`;
  function paneComputo() {
    const p = S.p, t = calc(p), cats = byCat(p);
    return `<div class="cn-pane"><div class="cn-sum"><div class="cn-sm"><span>Voci</span><b data-tl="n">${t.nv}</b></div><div class="cn-sm"><span>Totale lavori</span><b data-q="A">${eur(t.A)}</b></div><div class="cn-sm"><span>Opzionali non inclusi</span><b data-q="opt">${eur(t.opt)}</b></div><div class="cn-sm"><span>Totale con IVA</span><b data-q="tot">${eur(t.tot)}</b></div></div>
      ${canW() ? `<div class="cn-acts"><button class="cn-btn pri" data-act="pick">${ic(IC.plus)}Aggiungi dal listino</button><button class="cn-btn" data-act="voce-new">${ic(IC.edit)}Voce manuale</button>${p.amb.length ? `<button class="cn-btn" data-act="from-rilievo">${ic(IC.ruler)}Proponi voci dal rilievo</button>` : ''}<button class="cn-btn gh" data-act="listino">${ic(IC.book)}Il mio listino</button></div>` : ''}
      ${cats.length ? `<div style="display:grid;gap:12px">${cats.map(([c, vs], ci) => `<details class="cn-cat" open><summary>${ic(IC.chev)}${esc(c)}<small>${vs.length} ${vs.length === 1 ? 'voce' : 'voci'}</small><em data-cs="${esc(c)}">${eur(vs.filter(vIn).reduce((s, v) => s + vAmt(v), 0))}</em></summary><div class="cn-vh"><span>Descrizione</span><span>U.M.</span><span>Q.tà</span><span>Prezzo €</span><span>Sc. %</span><span style="text-align:right">Importo</span><span></span></div>${vs.map((v, i) => voceRow(v, i + ci)).join('')}</details>`).join('')}</div>
      <datalist id="cn-um">${UMS.map(x => `<option value="${x}">`).join('')}</datalist>
      ${canW() ? `<div class="cn-acts"><button class="cn-btn pri" data-tab="prev">Vai al preventivo ${ic(IC.chev)}</button></div>` : ''}`
      : `<div class="cn-empty">${EMPTY}<b>Il computo è vuoto</b><p>Aggiungi le lavorazioni dal tuo listino e indica le quantità: puoi prenderle direttamente dalle misure del rilievo.</p></div>`}</div>`;
  }
  function addVoce(o) { const v = { id: 'v' + C.uid(), cat: o.cat || 'Varie', d: o.d || '', um: o.um || 'cad', q: o.q != null ? String(o.q) : '1', pr: o.pr != null ? String(o.pr) : '', sc: '', cs: o.cs || '', opt: false, on: true, amb: '', var: S.p.stato === 'lavori', av: 0 }; S.p.voci.push(v); touch(); return v; }
  function refreshPane() { const y = scrollY; setTab(S.tab, true); scrollTo({ top: y }); }
  function pickModal() {
    const lst = listino(); let q = '', cat = '';
    const m = modal(`${mh('Aggiungi dal listino', '<button type="button" class="cn-btn sm gh" data-x="manage">Gestisci listino</button>')}<div class="cn-ms"><div class="cn-s">${ic(IC.list)}<input id="cn-pq" type="search" placeholder="Cerca lavorazione…" autocomplete="off"></div><div class="cn-chips" id="cn-pc"></div><div id="cn-pl" style="display:grid;gap:8px"></div></div><div class="cn-mf"><span class="cn-hint" id="cn-pn" style="margin-right:auto"></span><button class="cn-btn pri" data-mx>Fine</button></div>`, { wide: true, onClose: refreshPane });
    let n = 0;
    const paint = () => {
      const cs = [...new Set(lst.map(x => x.cat))]; $('#cn-pc', m).innerHTML = `<button type="button" data-pc="" class="${cat ? '' : 'on'}">Tutte</button>` + cs.map(c => `<button type="button" data-pc="${esc(c)}" class="${cat === c ? 'on' : ''}">${esc(c)}</button>`).join('');
      const f = lst.filter(x => (!cat || x.cat === cat) && (!q || norm(x.d + ' ' + x.cat).includes(q))).slice(0, 80);
      $('#cn-pl', m).innerHTML = f.length ? f.map(x => `<button type="button" class="cn-li" data-lid="${esc(x.id)}"><div><b>${esc(x.d)}</b><small>${esc(x.cat)} · ${esc(x.um)}</small></div><em>${N(x.pr) ? eur(N(x.pr)) : 'a corpo'}</em>${ic(IC.plus)}</button>`).join('') : '<p class="cn-hint">Nessuna voce: prova un\'altra ricerca o aggiungila dal tuo listino.</p>';
    }; paint();
    $('#cn-pq', m).oninput = e => { q = norm(e.target.value); paint(); };
    m.addEventListener('click', e => {
      const c = e.target.closest('[data-pc]'); if (c) { cat = c.dataset.pc; paint(); return; }
      if (e.target.closest('[data-x="manage"]')) { m.close(); setTimeout(listinoModal, 220); return; }
      const b = e.target.closest('[data-lid]'); if (!b) return; const x = lst.find(l => l.id === b.dataset.lid); if (!x) return;
      addVoce({ cat: x.cat, d: x.d, um: x.um, pr: x.pr, cs: x.cs }); n++; b.classList.add('flash'); setTimeout(() => b.classList.remove('flash'), 600); $('#cn-pn', m).textContent = n + (n === 1 ? ' voce aggiunta' : ' voci aggiunte');
    });
    setTimeout(() => { const i = $('#cn-pq', m); i && i.focus(); }, 120);
  }
  function misureModal(vid) {
    const p = S.p, v = p.voci.find(x => x.id === vid), T = totM(p); if (!v) return;
    const rows = [['Totale rilievo', null], ['Pavimenti', T.pav, 'mq'], ['Soffitti', T.sof, 'mq'], ['Pareti nette (senza aperture)', T.net, 'mq'], ['Pareti + soffitti', T.net + T.sof, 'mq'], ['Perimetro (battiscopa)', T.per, 'ml'], ['Volume', T.vol, 'mc']];
    p.amb.forEach(a => { const m = misure(a), n = a.n || 'Ambiente'; rows.push([n, null], [`${n} · pavimento`, m.pav, 'mq'], [`${n} · pareti nette`, m.net, 'mq'], [`${n} · perimetro`, m.per, 'ml']); });
    const mo = modal(`${mh('Quantità dalle misure')}<div class="cn-ms">${p.amb.length ? rows.map(r => r[1] == null ? `<div class="cn-hint" style="font-weight:700;margin-top:6px">${esc(r[0])}</div>` : `<button type="button" class="cn-li" data-mv="${r[1].toFixed(2)}" data-mu="${r[2]}"><div><b>${esc(r[0])}</b></div><em>${fmt(r[1])} ${r[2]}</em>${ic(IC.chev)}</button>`).join('') : '<p class="cn-hint">Nessuna misura: inserisci prima gli ambienti nel Rilievo.</p>'}</div>`);
    mo.addEventListener('click', e => { const b = e.target.closest('[data-mv]'); if (!b) return; v.q = dec(r2(+b.dataset.mv)); if (!v.um || v.um === 'cad' || v.um === 'corpo') v.um = b.dataset.mu; touch(); mo.close(); refreshPane(); });
  }
  function fromRilievo() {
    const p = S.p, T = totM(p), L = listino(), g = s => L.find(x => norm(x.d).includes(norm(s)));
    const R = [['Posa pavimento in gres', T.pav], ['Battiscopa', T.per], ['Rasatura e stuccatura pareti', T.net], ['Tinteggiatura pareti e soffitti', T.net + T.sof], ['Pulizia finale di cantiere', 1]];
    let n = 0; R.forEach(([k, q]) => { const x = g(k); if (!x || !(q > 0) || p.voci.some(v => v.d === x.d)) return; addVoce({ cat: x.cat, d: x.d, um: x.um, pr: x.pr, cs: x.cs, q: r2(q) }); n++; });
    C.toast(n ? `${n} ${n === 1 ? 'voce aggiunta' : 'voci aggiunte'} dalle misure: controlla prezzi e quantità` : 'Le voci principali ci sono già'); refreshPane();
  }


  /* ---------- piantina 2D ---------- */
  function panePiantina() {
    const p = S.p, L = p.piante = p.piante || [], CAD = window.CDC_CAD;
    const cards = L.map((pl, i) => {
      const s = CAD.stats(pl), n = s.rooms.length, has = pl.w.length || pl.s.length || pl.t.length, id = esc(pl.id);
      return `<div class="cn-pl" style="--i:${Math.min(i, 8)}"><button type="button" class="cn-pl-th" data-act="pl-open" data-id="${id}" aria-label="Apri il disegno">${has ? CAD.thumb(pl, 440) : `<div class="cn-pl-e">${ic(IC.plan)}<span>${canW() ? 'Vuota: tocca per disegnare' : 'Vuota'}</span></div>`}</button>
        <div class="cn-pl-b"><h4>${esc(pl.n || 'Piantina')}</h4><p>${n} ${n === 1 ? 'locale' : 'locali'} · <b>${fmt(s.area / 10000)} mq</b> · ${fmt(s.wall / 100)} m di pareti</p>
        <div class="cn-chips"><span>${s.doors} ${s.doors === 1 ? 'porta' : 'porte'}</span><span>${s.wins} ${s.wins === 1 ? 'finestra' : 'finestre'}</span><span>${pl.s.length} elementi</span></div>
        <div class="cn-acts"><button class="cn-btn pri sm" data-act="pl-open" data-id="${id}">${ic(IC.edit)}${canW() ? 'Disegna' : 'Apri'}</button>${canW() && n ? `<button class="cn-btn sm" data-act="pl-amb" data-id="${id}" title="Crea o aggiorna gli ambienti del rilievo con nome, misure e aperture">${ic(IC.ruler)}Genera ambienti</button>` : ''}<button class="cn-btn sm" data-act="pl-png" data-id="${id}">${ic(IC.pdf)}Immagine</button>${canW() ? `<button class="cn-ic" data-act="pl-dup" data-id="${id}" aria-label="Duplica">${ic(IC.copy)}</button><button class="cn-ic" data-act="pl-del" data-id="${id}" aria-label="Elimina">${ic(IC.trash)}</button>` : ''}</div>
        ${canW() ? `<label class="cn-plc"><input type="checkbox" data-plpdf="${id}" ${pl.pdf !== false ? 'checked' : ''}>Allega al PDF del preventivo</label>` : ''}</div></div>`;
    }).join('');
    return `<div class="cn-pane"><div class="cn-card"><h3>${ic(IC.plan)}Piantine del sopralluogo<span class="sp"></span><small>${L.length} ${L.length === 1 ? 'disegno' : 'disegni'}</small></h3>
      <p class="cn-hint" style="margin:0 0 14px">Disegna pareti con le misure, aggiungi porte, finestre, arredi e impianti. I mq di ogni locale passano al rilievo con «Genera ambienti». Il disegno si salva da solo.</p>
      ${L.length ? `<div class="cn-pls">${cards}</div>` : `<div class="cn-empty">${EMPTY}<b>Nessuna piantina</b><p>Crea la piantina mentre sei sul posto: pareti, porte, finestre, impianti e quote.</p></div>`}
      ${canW() ? `<div class="cn-acts" style="margin-top:16px"><button class="cn-btn pri" data-act="pl-new">${ic(IC.plus)}Nuova piantina</button></div>` : ''}</div></div>`;
  }
  function openCad(id) {
    const pl = (S.p.piante || []).find(x => x.id === id); if (!pl || !window.CDC_CAD) return; const pid = S.id;
    window.CDC_CAD.open(pl, { edit: canW(), names: AMB, onError: e => C.toast('Disegno non avviato: ' + ((e && e.message) || e)), onChange: () => { if (S.p && S.id === pid) touch(); }, onClose: () => { if (S.v === 'p' && S.id === pid && S.tab === 'piantina') refreshPane(); } });
  }
  function plToAmb(pl) {
    const St = window.CDC_CAD.stats(pl), p = S.p; if (!St.rooms.length) return C.toast('Disegna almeno un locale (Locale da misure o Area)');
    const hh = dec(pl.h || '2,70'); let nn = 0, uu = 0; const T = { p: 'Porta', pd: 'Porta doppia', ps: 'Porta scorrevole', pi: 'Porta ingresso', f: 'Finestra', pf: 'Portafinestra', v: 'Varco' };
    St.rooms.forEach(r => {
      const xs = r.pts.map(q => q[0]), ys = r.pts.map(q => q[1]), bw = Math.max(...xs) - Math.min(...xs), bh = Math.max(...ys) - Math.min(...ys), rect = Math.abs(bw * bh - r.area) <= r.area * .02;
      const l = bw / 100, pp = rect ? bh / 100 : r.area / 10000 / (l || 1), g = {};
      r.ops.forEach(o => { const k = `${T[o.k] || 'Apertura'}|${o.l}|${o.h}`; g[k] = (g[k] || 0) + 1; });
      const ap = Object.keys(g).map(k => { const [t, w, h] = k.split('|'); return { id: 'o' + C.uid(), t, l: dec(r2(w / 100)), h: dec(r2(h / 100)), q: String(g[k]) }; });
      const src = pl.id + ':' + r.i, ex = p.amb.find(a => a.src === src);
      if (ex) { Object.assign(ex, { n: r.n, l: dec(r2(l)), p: dec(r2(pp)), ap }); if (!ex.h) ex.h = hh; uu++; } else { p.amb.push({ id: 'a' + C.uid(), n: r.n, l: dec(r2(l)), p: dec(r2(pp)), h: hh, ap, note: '', src }); nn++; }
    });
    touch(); live(); refreshPane(); C.toast(`${nn ? nn + (nn === 1 ? ' ambiente creato' : ' ambienti creati') : ''}${nn && uu ? ' · ' : ''}${uu ? uu + (uu === 1 ? ' aggiornato' : ' aggiornati') : ''}: controlla in Rilievo`);
  }

  /* ---------- listino personale ---------- */
  function listinoModal() {
    S.lst = clone(listino()); let q = '', cat = ''; const own = listinoOwn(), W = canW();
    const m = modal(`${mh('Il mio listino', W ? '<button type="button" class="cn-btn sm" data-x="xls">' + ic(IC.xls) + 'Importa Excel</button>' : '')}<div class="cn-ms">${own ? '' : `<div class="cn-note">${ic(IC.warn)}<span><b>Prezzi indicativi di partenza.</b> Sono solo un esempio: modificali con i tuoi prezzi e salva, così i preventivi useranno i tuoi.</span></div>`}
      <div class="cn-s">${ic(IC.list)}<input id="cn-lq" type="search" placeholder="Cerca nel listino…" autocomplete="off"></div><div class="cn-chips" id="cn-lc"></div><div id="cn-ll" style="display:grid;gap:8px"></div>
      ${W ? '<div><button type="button" class="cn-btn sm" data-x="add">' + ic(IC.plus) + 'Nuova voce</button></div>' : ''}<input type="file" id="cn-lf" accept=".xlsx,.xls,.csv" hidden></div>
      <div class="cn-mf"><span class="cn-hint" id="cn-ln" style="margin-right:auto">${S.lst.length} voci</span>${W && own ? '<button class="cn-btn gh" data-x="reset">Ripristina indicativi</button>' : ''}<button class="cn-btn" data-mx>Chiudi</button>${W ? '<button class="cn-btn pri" data-x="save">Salva listino</button>' : ''}</div>`, { wide: true });
    const paint = () => {
      const cs = [...new Set(S.lst.map(x => x.cat))]; $('#cn-lc', m).innerHTML = `<button type="button" data-lc="" class="${cat ? '' : 'on'}">Tutte</button>` + cs.map(c => `<button type="button" data-lc="${esc(c)}" class="${cat === c ? 'on' : ''}">${esc(c)}</button>`).join('');
      const f = S.lst.filter(x => (!cat || x.cat === cat) && (!q || norm(x.d + ' ' + x.cat).includes(q))).slice(0, 120);
      $('#cn-ll', m).innerHTML = f.map(x => `<div class="cn-vr" style="grid-template-columns:150px minmax(0,1fr) 64px 86px 86px 32px" data-li="${esc(x.id)}"><select class="cn-in" data-k="cat">${CATS.concat(S.lst.map(y => y.cat)).filter((c, i, a) => a.indexOf(c) === i).map(c => `<option${c === x.cat ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select><input class="cn-in" data-k="d" value="${esc(x.d)}" maxlength="160"><input class="cn-in" data-k="um" value="${esc(x.um)}" maxlength="8"><input class="cn-in" data-k="pr" inputmode="decimal" value="${esc(dec(x.pr))}" placeholder="Prezzo"><input class="cn-in" data-k="cs" inputmode="decimal" value="${esc(dec(x.cs))}" placeholder="Costo"><button type="button" class="cn-ic" data-x="del" aria-label="Elimina voce">${ic(IC.trash)}</button></div>`).join('') || '<p class="cn-hint">Nessuna voce.</p>';
      $('#cn-ln', m).textContent = S.lst.length + ' voci' + (S.lst.length > 120 && !q && !cat ? ' · ne mostro 120: usa la ricerca' : '');
      if (!W) $$('input,select,button[data-x="del"]', $('#cn-ll', m)).forEach(e => { e.disabled = true; });
    }; paint();
    $('#cn-lq', m).oninput = e => { q = norm(e.target.value); paint(); };
    m.addEventListener('input', e => { const row = e.target.closest('[data-li]'), k = e.target.dataset.k; if (!row || !k) return; const x = S.lst.find(l => l.id === row.dataset.li); if (x) x[k] = e.target.value; });
    m.addEventListener('click', async e => {
      const c = e.target.closest('[data-lc]'); if (c) { cat = c.dataset.lc; paint(); return; }
      const b = e.target.closest('[data-x]'); if (!b) return; const a = b.dataset.x;
      if (a === 'add') { S.lst.unshift({ id: 'l' + C.uid(), cat: cat || CATS[0], d: '', um: 'cad', pr: '', cs: '' }); q = ''; $('#cn-lq', m).value = ''; paint(); const i = $('#cn-ll input[data-k=d]', m); i && i.focus(); }
      else if (a === 'del') { const id = b.closest('[data-li]').dataset.li; S.lst = S.lst.filter(l => l.id !== id); paint(); }
      else if (a === 'reset') { if (confirm('Tornare ai prezzi indicativi di partenza? Il tuo listino verrà cancellato.')) { C.write([{ action: 'delete', sheet: 'Config', id: 'cntListino' }]); m.close(); C.toast('Listino ripristinato'); } }
      else if (a === 'save') { const clean = S.lst.filter(x => String(x.d).trim()).map(x => ({ id: x.id, cat: x.cat, d: String(x.d).trim(), um: String(x.um || 'cad').trim(), pr: String(x.pr || '').trim(), cs: String(x.cs || '').trim() })); const json = JSON.stringify({ v: clean }); if (json.length > 46000) return C.toast('Listino troppo grande per essere salvato (' + clean.length + ' voci): togli qualche voce'); C.write([{ action: 'upsert', sheet: 'Config', row: { chiave: 'cntListino', valore: json } }]); m.close(); C.toast('Listino salvato'); }
      else if (a === 'xls') $('#cn-lf', m).click();
    });
    $('#cn-lf', m).onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      try { C.busy('Leggo il file…'); await C.loadXlsx(); const wb = XLSX.read(await f.arrayBuffer()), rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' }); C.busy();
        const hi = rows.findIndex(r => r.some(c => /descr/i.test(String(c)))); if (hi < 0) return C.toast('Non trovo la colonna «Descrizione»: serve una riga di intestazione');
        const H = rows[hi].map(c => norm(c)), ix = re => H.findIndex(h => re.test(h)), ci = { cat: ix(/categ|capitolo|gruppo/), d: ix(/descr/), um: ix(/^um|unita|u m/), pr: ix(/prezzo|vendita|importo/), cs: ix(/costo|acquisto/) };
        let n = 0; rows.slice(hi + 1).forEach(r => { const d = String(r[ci.d] || '').trim(); if (!d) return; S.lst.push({ id: 'l' + C.uid(), cat: String(ci.cat >= 0 && r[ci.cat] || 'Varie').trim() || 'Varie', d, um: String(ci.um >= 0 && r[ci.um] || 'cad').trim(), pr: ci.pr >= 0 ? String(r[ci.pr] || '').replace('.', ',') : '', cs: ci.cs >= 0 ? String(r[ci.cs] || '').replace('.', ',') : '' }); n++; });
        paint(); C.toast(`${n} voci importate: ricordati di salvare il listino`); } catch (er) { C.busy(); C.toast(er.message || 'File non leggibile'); }
      e.target.value = '';
    };
  }

  /* ---------- scheda PREVENTIVO ---------- */
  const pagTot = t => { const s = S.p.pag.reduce((a, r) => a + N(r.pc), 0), ok = Math.abs(s - 100) < .01; return `<span class="cn-chip ${ok ? 'ok' : 'wa'}">${fmt(s, s % 1 ? 1 : 0)}% ${ok ? '· ' + eur(t.tot) : '· deve fare 100%'}</span>`; };
  const qeHtml = t => { const e = S.p.eco, row = (l, k, neg) => `<div${neg ? ' class="neg"' : ''}><span>${l}</span><b>${neg ? '− ' : ''}${eur(t[k])}</b></div>`; return `${row('Totale lavori', 'A')}${t.SG ? row(`Spese generali ${fmt(N(e.sg), 1)}%`, 'SG') : ''}${t.UT ? row(`Utile d'impresa ${fmt(N(e.ut), 1)}%`, 'UT') : ''}${t.SC ? row(`Sconto ${fmt(N(e.sc), 1)}%`, 'SC', 1) : ''}${t.SIC ? row('Oneri per la sicurezza', 'SIC') : ''}<div><span><b>Imponibile</b></span><b>${eur(t.imp)}</b></div>${row(`IVA ${fmt(N(e.iva), 0)}%`, 'iva')}${N(e.arr) ? `<div class="neg"><span>Arrotondamento</span><b>− ${eur(N(e.arr))}</b></div>` : ''}<div class="big"><span>Totale</span><b>${eur(t.tot)}</b></div>${t.marg ? `<div><span>Margine previsto <small style="color:var(--muted)">(solo per te)</small></span><b style="color:${t.marg.pc >= 20 ? '#1f9d6b' : t.marg.pc >= 10 ? '#c98500' : '#d63a3a'}">${eur(t.marg.v)} · ${fmt(t.marg.pc, 0)}%</b></div>` : ''}`; };
  function panePrev() {
    const p = S.p, t = calc(p), e = p.eco, st = p.stato;
    const pgRow = r => `<div class="cn-pg" data-pg="${esc(r.id)}"><input class="cn-in" data-r="pag|${esc(r.id)}|d" value="${esc(r.d || '')}" placeholder="Es. Acconto alla firma"><input class="cn-in" inputmode="decimal" data-r="pag|${esc(r.id)}|pc" value="${esc(dec(r.pc))}" placeholder="%"><b data-pgi="${esc(r.id)}" style="text-align:right;font-size:14px">${eur(r2(t.tot * N(r.pc) / 100))}</b><button type="button" class="cn-ic" data-act="pag-del" data-id="${esc(r.id)}" data-w aria-label="Togli">${ic(IC.x)}</button></div>`;
    const acts = [];
    if (st === 'sopralluogo' || st === 'preventivo') acts.push(`<button class="cn-btn pri" data-act="send" data-w>${ic(IC.send)}Segna come inviato</button>`);
    if (st === 'inviato') acts.push(`<button class="cn-btn pri" data-act="won" data-w>${ic(IC.check)}Il cliente ha accettato</button><button class="cn-btn dg" data-act="lost" data-w>Non accettato</button>`);
    if (st === 'perso') acts.push(`<button class="cn-btn" data-act="reopen" data-w>Riapri la trattativa</button>`);
    if (st === 'accettato') acts.push(`<button class="cn-btn pri" data-act="start" data-w>${ic(IC.hammer)}Avvia i lavori</button>`);
    return `<div class="cn-pane"><div class="cn-eco"><div style="display:grid;gap:16px">
      <div class="cn-card"><h3>${ic(IC.calc)}Maggiorazioni, sconto e IVA</h3><div class="cn-g">
        ${field('Spese generali %', 'eco.sg', { num: 1, ph: '0' })}${field('Utile d\'impresa %', 'eco.ut', { num: 1, ph: '0' })}${field('Sconto commerciale %', 'eco.sc', { num: 1, ph: '0' })}
        <div class="cn-f"><span>Oneri per la sicurezza</span><div style="display:grid;grid-template-columns:1fr 92px;gap:6px"><input data-f="eco.sic" inputmode="decimal" value="${esc(dec(e.sic))}" placeholder="0" class="cn-in"><select data-f="eco.sicT" class="cn-in"><option value="eur"${e.sicT !== 'pct' ? ' selected' : ''}>€</option><option value="pct"${e.sicT === 'pct' ? ' selected' : ''}>% lavori</option></select></div></div>
        ${field('Aliquota IVA', 'eco.iva', { sel: [['4', '4%'], ['10', '10%'], ['22', '22%'], ['0', '0% (esente / reverse charge)']] })}${field('Arrotondamento a ribasso €', 'eco.arr', { num: 1, ph: '0' })}</div>
        <p class="cn-hint" style="margin-top:10px">Se i tuoi prezzi sono già finiti lascia a zero spese generali e utile. L'aliquota IVA dipende dal tipo di intervento e dal cliente: confermala con il tuo commercialista.</p></div>
      <div class="cn-card"><h3>${ic(IC.euro)}Pagamenti<span class="sp"></span><span id="cn-pgt">${pagTot(t)}</span></h3><div id="cn-pgl">${p.pag.map(pgRow).join('')}</div>
        ${canW() ? `<div class="cn-chips" style="margin-top:6px;flex-wrap:wrap"><button type="button" data-act="pag-add">+ Rata</button><button type="button" data-act="pag-pre" data-n="30,40,30">30 · 40 · 30</button><button type="button" data-act="pag-pre" data-n="50,50">50 · 50</button><button type="button" data-act="pag-pre" data-n="40,30,30">40 · 30 · 30</button><button type="button" data-act="pag-pre" data-n="100">Unica soluzione</button></div>` : ''}</div>
      <div class="cn-card"><h3>${ic(IC.clip)}Condizioni</h3><div class="cn-g">${field('Validità offerta (giorni)', 'cond.val', { num: 1, ph: '30' })}${field('Tempi di esecuzione', 'cond.tempi', { ph: 'Es. 25 giorni lavorativi', max: 60 })}${field('Inizio lavori previsto', 'cond.inizio', { type: 'date' })}
        ${field('Escluso dal preventivo', 'cond.escl', { w: 'wf', area: 1, rows: 5 })}${field('Condizioni generali', 'cond.clau', { w: 'wf', area: 1, rows: 6 })}${field('Note per il cliente', 'cond.note', { w: 'wf', area: 1, rows: 3, ph: 'Facoltative: compaiono nel PDF' })}</div>
        <label style="display:flex;gap:10px;align-items:center;margin-top:12px;font-size:14px;cursor:pointer"><input type="checkbox" id="cn-pf" ${p.cond.foto !== false ? 'checked' : ''} style="width:18px;height:18px"> Allega le foto del sopralluogo al PDF</label></div></div>
      <div class="cn-sticky"><div class="cn-card"><h3>${ic(IC.pdf)}Quadro economico</h3><div class="cn-stk" id="cn-stk">${stk(t)}</div><div class="cn-lg"><span><i style="--c:#3362ab"></i>Lavori</span><span><i style="--c:#8b5cf6"></i>Maggiorazioni</span><span><i style="--c:#eb6834"></i>Sicurezza</span><span><i style="--c:#9aa3b5"></i>IVA</span></div>
        <div class="cn-qe" id="cn-qe">${qeHtml(t)}</div>
        <div class="cn-acts" style="margin-top:16px"><button class="cn-btn pri" data-act="pdf">${ic(IC.pdf)}Scarica il PDF</button>${acts.join('')}</div>
        <div class="cn-acts" style="margin-top:8px"><button class="cn-btn sm" data-act="wa">${ic(IC.wa)}WhatsApp</button><button class="cn-btn sm" data-act="mail">${ic(IC.mail)}Email</button></div></div></div></div></div>`;
  }

  /* ---------- scheda CANTIERE ---------- */
  const lavTot = t => `<div class="cn-rg">${ring(t.av, '#eb6834')}<span>${Math.round(t.av * 100)}%</span></div><div><small style="color:var(--muted);font-weight:600">Avanzamento lavori</small><b>${eur(t.sal)}</b><div class="cn-hint">maturato senza IVA · <b style="color:var(--ink)">${eur(t.salT)}</b> con IVA da fatturare in tutto</div></div>`;
  function paneLavori() {
    const p = S.p, t = calc(p), st = p.stato, cats = byCat(p).map(([c, vs]) => [c, vs.filter(vIn)]).filter(x => x[1].length), ex = p.extra || [];
    const acts = st === 'accettato' ? `<button class="cn-btn pri" data-act="start" data-w>${ic(IC.hammer)}Avvia i lavori</button>` : st === 'lavori' ? `<button class="cn-btn pri" data-act="close" data-w>${ic(IC.check)}Chiudi il cantiere</button>` : st === 'chiuso' ? '<span class="cn-chip ok">Cantiere chiuso</span>' : '';
    return `<div class="cn-pane">${['sopralluogo', 'preventivo', 'inviato', 'perso'].includes(st) ? `<div class="cn-note">${ic(IC.warn)}<span>Questa scheda serve quando il preventivo è accettato. Puoi già usarla per preparare il cantiere.</span></div>` : ''}
      <div class="cn-card"><div class="cn-big" id="cn-lv">${lavTot(t)}</div>${acts ? `<div class="cn-acts" style="margin-top:16px">${acts}</div>` : ''}</div>
      ${cats.length ? `<div class="cn-card"><h3>${ic(IC.list)}Avanzamento per lavorazione<span class="sp"></span><small>trascina o scrivi la percentuale</small></h3>${cats.map(([c, vs]) => `<div style="margin-bottom:8px"><div class="cn-hint" style="font-weight:700;margin:12px 0 2px;text-transform:uppercase;letter-spacing:.05em">${esc(c)}</div>${vs.map(v => `<div class="cn-sc"><span style="font-size:13.5px;font-weight:600">${esc(v.d || 'Voce')}<small style="display:block;color:var(--muted);font-weight:500">${fmt(N(v.q))} ${esc(v.um || '')} · ${eur(vAmt(v))}</small></span><input type="range" min="0" max="100" step="5" data-r="voci|${esc(v.id)}|av" value="${esc(v.av || 0)}"><input class="cn-in" inputmode="numeric" data-r="voci|${esc(v.id)}|av" value="${esc(v.av || 0)}" style="text-align:right"></div>`).join('')}</div>`).join('')}</div>` : '<div class="cn-empty"><b>Nessuna lavorazione</b><p>Crea prima il computo.</p></div>'}
      <div class="cn-card"><h3>${ic(IC.plus)}Varianti ed extra concordati<span class="sp"></span><small>${eur(r2(ex.reduce((s, x) => s + N(x.imp), 0)))} IVA esclusa</small></h3><div class="cn-gl">${ex.map(x => `<div class="cn-pg" style="grid-template-columns:minmax(0,1fr) 110px 34px"><input class="cn-in" data-r="extra|${esc(x.id)}|d" value="${esc(x.d || '')}" placeholder="Es. Spostamento punto acqua"><input class="cn-in" inputmode="decimal" data-r="extra|${esc(x.id)}|imp" value="${esc(dec(x.imp))}" placeholder="€"><button type="button" class="cn-ic" data-act="ex-del" data-id="${esc(x.id)}" data-w>${ic(IC.x)}</button></div>`).join('')}</div>${canW() ? `<button class="cn-btn sm" data-act="ex-add" style="margin-top:8px">${ic(IC.plus)}Aggiungi</button>` : ''}</div>
      <div class="cn-card"><h3>${ic(IC.book)}Giornale dei lavori</h3><div class="cn-gl">${(p.gl || []).slice().sort((a, b) => String(b.data).localeCompare(String(a.data))).map(g => `<div class="cn-gr"><input type="date" class="cn-in" data-r="gl|${esc(g.id)}|data" value="${esc(g.data || '')}"><textarea class="cn-in" data-r="gl|${esc(g.id)}|t" rows="2" placeholder="Cosa è stato fatto, chi c'era, problemi…">${esc(g.t || '')}</textarea><button type="button" class="cn-ic" data-act="gl-del" data-id="${esc(g.id)}" data-w>${ic(IC.x)}</button></div>`).join('') || '<p class="cn-hint">Nessuna annotazione.</p>'}</div>${canW() ? `<button class="cn-btn sm" data-act="gl-add" style="margin-top:10px">${ic(IC.plus)}Nuova annotazione</button>` : ''}</div></div>`;
  }

  /* ---------- PDF del preventivo ---------- */
  async function buildPdf() {
    const p = S.p, t = calc(p);
    if (!p.voci.length) return C.toast('Aggiungi almeno una voce al computo');
    try {
      C.busy('Preparo il PDF…');
      const { jsPDF, logo, fonts } = await C.pdfKit(), az = { nome: C.orgName(), ...(C.cfg('azienda') || {}) };
      const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true }); let FF = 'helvetica';
      if (fonts) { fonts.forEach(([w, data]) => { doc.addFileToVFS(`Inter-${w}.ttf`, data); doc.addFont(`Inter-${w}.ttf`, 'Inter', w === 'regular' ? 'normal' : w); }); FF = 'Inter'; }
      const W = 210, H = 297, M = 16, CW = W - 2 * M;
      const K = { navy: [20, 40, 79], navy2: [39, 72, 127], ink: [28, 32, 44], ink2: [78, 86, 102], mut: [128, 136, 150], line: [226, 230, 238], soft: [244, 247, 252], white: [255, 255, 255], amber: [235, 160, 52], acc: [51, 98, 171] };
      const fill = c => doc.setFillColor(...c), stroke = c => doc.setDrawColor(...c), tc = c => doc.setTextColor(...c);
      const font = (st, sz) => { doc.setFont(FF, FF === 'helvetica' && st === 'semibold' ? 'bold' : st); doc.setFontSize(sz); };
      const clean = s => String(s == null ? '' : s).replace(/[•·]/g, '-').replace(/[^\S\n]+/g, ' ');
      const txt = (s, x, y, o) => doc.text(clean(s), x, y, o);
      const wrap = (s, w) => doc.splitTextToSize(clean(s), w);
      const E = v => eur(v).replace(/ ?€$/, '') + ' €';
      const photos = p.cond.foto !== false ? p.foto.slice(0, 12) : [], imgs = [];
      for (let i = 0; i < photos.length; i += 4) await Promise.all(photos.slice(i, i + 4).map(async ph => { try { const d = await photoData(ph, true); if (d) imgs.push({ d, cap: ph.cap, amb: ph.amb, at: photos.indexOf(ph) }); } catch {} }));
      imgs.sort((a, b) => a.at - b.at);
      const place = (d, x, y, w, h) => { const pr = doc.getImageProperties(d), k = Math.max(w / pr.width, h / pr.height), iw = pr.width * k, ih = pr.height * k; doc.saveGraphicsState(); doc.roundedRect(x, y, w, h, 2.5, 2.5, null); doc.clip(); doc.discardPath(); doc.addImage(d, 'JPEG', x + (w - iw) / 2, y + (h - ih) / 2, iw, ih, undefined, 'FAST'); doc.restoreGraphicsState(); };

      /* copertina */
      fill(K.navy); doc.rect(0, 0, W, 104, 'F');
      stroke([36, 62, 108]); doc.setLineWidth(.15); for (let x = 0; x <= W; x += 10) doc.line(x, 0, x, 104); for (let y = 0; y <= 104; y += 10) doc.line(0, y, W, y);
      fill(K.amber); doc.rect(M, 66, 18, 1.2, 'F');
      if (logo) { fill(K.white); doc.roundedRect(M, 16, 15, 15, 3, 3, 'F'); doc.addImage(logo, 'PNG', M + .8, 16.8, 13.4, 13.4); }
      tc(K.white); font('bold', 13); txt(az.nome || '', M + (logo ? 20 : 0), 22.5);
      font('normal', 8.6); tc([200, 214, 240]); txt([az.indirizzo, [az.cap, az.citta, az.prov ? `(${az.prov})` : ''].filter(Boolean).join(' ')].filter(Boolean).join(' · '), M + (logo ? 20 : 0), 28);
      tc([200, 214, 240]); font('semibold', 8.5); txt('PREVENTIVO N. ' + p.num.replace('CN-', ''), W - M, 22.5, { align: 'right' }); font('normal', 8.5); txt(dIt(p.log && p.log.inviato || today()), W - M, 28, { align: 'right' });
      tc(K.white); font('bold', 34); txt('Preventivo lavori', M, 56);
      font('normal', 12); tc([214, 226, 250]); txt(p.cant.tipo + (p.cant.immobile ? ' · ' + p.cant.immobile : ''), M, 78);
      font('normal', 10); txt([p.cant.ind, p.cant.citta].filter(Boolean).join(', '), M, 85);
      let y = 118; const bw = (CW - 8) / 2;
      const box = (x, lab, lines) => { stroke(K.line); fill(K.soft); doc.roundedRect(x, y, bw, 38, 3, 3, 'FD'); tc(K.mut); font('bold', 7); txt(lab, x + 5, y + 7); tc(K.ink); font('bold', 12); txt(wrap(lines[0] || '—', bw - 10)[0], x + 5, y + 15); font('normal', 9); tc(K.ink2); let yy = y + 21; lines.slice(1).filter(Boolean).forEach(l => { wrap(l, bw - 10).slice(0, 2).forEach(s => { txt(s, x + 5, yy); yy += 4.6; }); }); };
      box(M, 'CLIENTE', [p.cli.nome, p.cli.ref && 'c.a. ' + p.cli.ref, [p.cli.ind, [p.cli.cap, p.cli.citta].filter(Boolean).join(' ')].filter(Boolean).join(', '), [p.cli.tel, p.cli.email].filter(Boolean).join(' · '), p.cli.piva && 'P. IVA ' + p.cli.piva]);
      box(M + bw + 8, 'CANTIERE', [[p.cant.ind, p.cant.citta].filter(Boolean).join(', ') || '—', p.cant.tipo, [p.cant.immobile, p.cant.piano && 'piano ' + p.cant.piano, p.cant.asc === 'si' ? 'con ascensore' : p.cant.asc === 'no' ? 'senza ascensore' : ''].filter(Boolean).join(' · '), p.sopr.data && 'Sopralluogo del ' + dIt(p.sopr.data) + (p.sopr.tecnico ? ' · ' + p.sopr.tecnico : '')]);
      y += 46;
      if (imgs[0]) { place(imgs[0].d, M, y, CW, 70); y += 78; }
      const bx = y; fill(K.navy); doc.roundedRect(M, bx, CW, 28, 4, 4, 'F'); tc([180, 198, 235]); font('bold', 7.5); txt('IMPORTO TOTALE · IVA ' + fmt(N(p.eco.iva), 0) + '% INCLUSA', M + 8, bx + 9); tc(K.white); font('bold', 24); txt(E(t.tot), M + 8, bx + 21);
      tc([200, 214, 240]); font('normal', 8.4); txt(`Imponibile ${E(t.imp)} · valido ${N(p.cond.val) || 30} giorni`, W - M - 8, bx + 21, { align: 'right' });

      /* computo */
      doc.addPage(); y = 26; tc(K.navy); font('bold', 17); txt('Computo estimativo', M, y); fill(K.amber); doc.rect(M, y + 3, 12, 1, 'F'); y += 12;
      const body = []; let n = 0;
      byCat(p).forEach(([c, vs]) => {
        body.push([{ content: c.toUpperCase(), colSpan: 6, styles: { fillColor: K.soft, textColor: K.navy, fontStyle: 'bold', fontSize: 7.8, cellPadding: { top: 2.6, bottom: 2.6, left: 2, right: 2 } } }]);
        vs.forEach(v => { n++; const optx = v.opt && !v.on; body.push([String(n), clean(v.d) + (v.opt ? (v.on ? '  [opzione inclusa]' : '  [OPZIONALE - non compresa nel totale]') : '') + (v.var ? '  [variante]' : ''), v.um || '', fmt(N(v.q), N(v.q) % 1 ? 2 : 0), N(v.pr) ? E(N(v.pr) * (1 - N(v.sc) / 100)) : 'a corpo', { content: E(vAmt(v)), styles: optx ? { textColor: K.mut, fontStyle: 'italic' } : {} }]); });
        const sub = vs.filter(vIn).reduce((s, v) => s + vAmt(v), 0); body.push([{ content: 'Totale ' + c.toLowerCase(), colSpan: 5, styles: { halign: 'right', fontStyle: 'bold', textColor: K.ink2, fontSize: 8 } }, { content: E(sub), styles: { fontStyle: 'bold' } }]);
      });
      doc.autoTable({ startY: y, margin: { left: M, right: M, top: 24, bottom: 22 }, theme: 'plain', head: [['N.', 'Descrizione', 'U.M.', 'Q.tà', 'Prezzo unit.', 'Importo']], body,
        styles: { font: FF, fontSize: 8.6, cellPadding: { top: 2.4, bottom: 2.4, left: 2, right: 2 }, textColor: K.ink, lineColor: K.line, lineWidth: { bottom: .2 }, overflow: 'linebreak' },
        headStyles: { fillColor: K.navy, textColor: K.white, fontStyle: 'bold', fontSize: 7.6 },
        columnStyles: { 0: { cellWidth: 9 }, 2: { cellWidth: 16 }, 3: { cellWidth: 16, halign: 'right' }, 4: { cellWidth: 25, halign: 'right' }, 5: { cellWidth: 28, halign: 'right' } },
        didParseCell: h => { if (h.section === 'head' && h.column.index >= 3) h.cell.styles.halign = 'right'; } });
      y = doc.lastAutoTable.finalY + 10;
      const need = h => { if (y + h > H - 24) { doc.addPage(); y = 26; } };
      const h2 = s => { need(30); tc(K.navy); font('bold', 14); txt(s, M, y); fill(K.amber); doc.rect(M, y + 2.5, 10, .9, 'F'); y += 10; };

      /* quadro economico */
      const rows = [['Totale lavori', t.A]]; if (t.SG) rows.push([`Spese generali ${fmt(N(p.eco.sg), 1)}%`, t.SG]); if (t.UT) rows.push([`Utile d'impresa ${fmt(N(p.eco.ut), 1)}%`, t.UT]); if (t.SC) rows.push([`Sconto commerciale ${fmt(N(p.eco.sc), 1)}%`, -t.SC]); if (t.SIC) rows.push(['Oneri per la sicurezza (non soggetti a ribasso)', t.SIC]);
      rows.push(['Imponibile', t.imp], [`IVA ${fmt(N(p.eco.iva), 0)}%`, t.iva]); if (N(p.eco.arr)) rows.push(['Arrotondamento', -N(p.eco.arr)]);
      h2('Quadro economico'); const qh = rows.length * 8 + 18; need(qh);
      stroke(K.line); fill(K.white); doc.roundedRect(M, y, CW, qh, 3, 3, 'FD'); let qy = y + 8;
      rows.forEach(([l, v], i) => { const b = l === 'Imponibile'; tc(b ? K.ink : K.ink2); font(b ? 'bold' : 'normal', 9.4); txt(l, M + 6, qy); tc(K.ink); font(b ? 'bold' : 'semibold', 9.4); txt((v < 0 ? '- ' : '') + E(Math.abs(v)), W - M - 6, qy, { align: 'right' }); qy += 8; });
      fill(K.navy); doc.roundedRect(M + 3, qy - 3, CW - 6, 12, 2.5, 2.5, 'F'); tc(K.white); font('bold', 11); txt('TOTALE', M + 8, qy + 4.6); font('bold', 14); txt(E(t.tot), W - M - 8, qy + 5, { align: 'right' }); y += qh + 12;
      if (t.opt) { tc(K.mut); font('normal', 8.4); txt(`Lavorazioni opzionali non comprese nel totale: ${E(t.opt)} + IVA`, M, y - 4); y += 4; }

      /* pagamenti */
      const pg = p.pag.filter(r => N(r.pc) > 0);
      if (pg.length) { h2('Modalità di pagamento'); doc.autoTable({ startY: y, margin: { left: M, right: M, top: 24, bottom: 22 }, theme: 'plain', head: [['Rata', 'Quota', 'Importo IVA inclusa']], body: pg.map(r => [clean(r.d), fmt(N(r.pc), N(r.pc) % 1 ? 1 : 0) + '%', E(r2(t.tot * N(r.pc) / 100))]),
        styles: { font: FF, fontSize: 9, cellPadding: { top: 2.8, bottom: 2.8, left: 3, right: 3 }, textColor: K.ink, lineColor: K.line, lineWidth: { bottom: .2 } }, headStyles: { fillColor: K.soft, textColor: K.navy, fontStyle: 'bold', fontSize: 7.6 }, columnStyles: { 1: { halign: 'right', cellWidth: 24 }, 2: { halign: 'right', cellWidth: 44 } }, didParseCell: h => { if (h.section === 'head' && h.column.index >= 1) h.cell.styles.halign = 'right'; } }); y = doc.lastAutoTable.finalY + 10; }

      /* condizioni */
      const sec = (title, text) => { if (!String(text || '').trim()) return; need(24); tc(K.mut); font('bold', 7.4); txt(title.toUpperCase(), M, y); y += 5; tc(K.ink2); font('normal', 8.8); wrap(text, CW).forEach(l => { need(6); txt(l, M, y); y += 4.7; }); y += 5; };
      h2('Condizioni'); const info = [p.cond.tempi && 'Tempi di esecuzione: ' + p.cond.tempi, p.cond.inizio && 'Inizio lavori previsto: ' + dIt(p.cond.inizio), 'Validità dell\'offerta: ' + (N(p.cond.val) || 30) + ' giorni dalla data di emissione'].filter(Boolean).join('\n');
      sec('Tempi e validità', info); sec('Escluso dal preventivo', p.cond.escl); sec('Condizioni generali', p.cond.clau); sec('Note', p.cond.note);

      /* accettazione */
      need(58); y += 2; stroke(K.line); fill(K.soft); doc.roundedRect(M, y, CW, 50, 3, 3, 'FD'); tc(K.navy); font('bold', 10); txt('Accettazione del preventivo', M + 6, y + 9); tc(K.ink2); font('normal', 8.4); txt(wrap('Con la firma il cliente accetta il preventivo n. ' + p.num + ' per l\'importo di ' + E(t.tot) + ' IVA inclusa e le condizioni indicate.', CW - 12), M + 6, y + 15);
      const sw = (CW - 18) / 2; [[M + 6, 'Per l\'impresa'], [M + 12 + sw, 'Il cliente (data e firma)']].forEach(([x, l]) => { stroke(K.mut); doc.setLineWidth(.25); doc.line(x, y + 41, x + sw, y + 41); tc(K.mut); font('normal', 7.4); txt(l, x, y + 45.5); }); y += 58;

      /* piantine */
      const pls = (p.piante || []).filter(x => x.pdf !== false && (x.w || []).length);
      if (pls.length && !window.CDC_CAD) { try { await C.loadLib('cantieri-cad.js?v=263'); } catch { } }
      if (window.CDC_CAD) for (const pl of pls) {
        try {
          const im = await window.CDC_CAD.png(pl, 1800, { title: pl.n || 'Piantina' }), s2 = window.CDC_CAD.stats(pl), nr = s2.rooms.length;
          doc.addPage(); y = 26; h2('Planimetria del rilievo' + (pl.n ? ' - ' + pl.n : ''));
          const maxH = H - 22 - y - (nr ? 22 + nr * 7 : 6); let iw = CW, ih = iw * im.h / im.w; if (ih > maxH) { ih = maxH; iw = ih * im.w / im.h; }
          doc.addImage(im.url, 'PNG', M + (CW - iw) / 2, y, iw, ih); y += ih + 6;
          if (nr) doc.autoTable({ startY: y, margin: { left: M, right: M, bottom: 22 }, theme: 'plain', styles: { font: FF, fontSize: 8.6, cellPadding: 2, textColor: K.ink, lineColor: K.line, lineWidth: { bottom: .2 } }, headStyles: { fillColor: K.navy, textColor: K.white, fontStyle: 'bold', fontSize: 8 },
            head: [['Locale', ...['Superficie', 'Perimetro', 'Porte', 'Finestre'].map(x => ({ content: x, styles: { halign: 'right' } }))]], body: s2.rooms.map(r => [clean(r.n), fmt(r.area / 10000) + ' mq', fmt(r.per / 100) + ' m', String(r.ops.filter(o => o.k !== 'f' && o.k !== 'pf' && window.CDC_CAD.isDoor(o.k)).length), String(r.ops.filter(o => o.k === 'f' || o.k === 'pf').length)]), columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } } });
        } catch { }
      }

      /* foto */
      const gal = imgs.slice(imgs.length > 1 ? 1 : 0).filter(() => true);
      if (imgs.length > 1) { doc.addPage(); y = 26; h2('Documentazione fotografica del sopralluogo'); const gw = (CW - 8) / 2, gh = 62; let col = 0;
        imgs.slice(1).forEach(im => { if (y + gh + 14 > H - 22) { doc.addPage(); y = 26; col = 0; } const x = M + col * (gw + 8); place(im.d, x, y, gw, gh); tc(K.ink2); font('normal', 8); txt(wrap([im.amb, im.cap].filter(Boolean).join(' · ') || ' ', gw)[0], x, y + gh + 5); if (col) { col = 0; y += gh + 12; } else col = 1; }); }

      /* intestazioni e piè di pagina */
      const N2 = doc.getNumberOfPages();
      for (let i = 1; i <= N2; i++) {
        doc.setPage(i);
        if (i > 1) { fill(K.navy); doc.rect(0, 0, W, 12, 'F'); tc(K.white); font('bold', 8.4); txt(az.nome || '', M, 7.6); font('normal', 8.4); txt(`Preventivo ${p.num} · ${p.cli.nome || ''}`, W - M, 7.6, { align: 'right' }); }
        stroke(K.line); doc.setLineWidth(.2); doc.line(M, H - 15, W - M, H - 15); tc(K.mut); font('normal', 7.6); txt([az.nome, az.piva && 'P. IVA ' + az.piva, az.tel, az.email].filter(Boolean).join(' · '), M, H - 10); txt(`Pagina ${i} di ${N2}`, W - M, H - 10, { align: 'right' });
      }
      doc.save(`Preventivo-${p.num}-${String(p.cli.nome || 'cliente').replace(/[^\w]+/g, '-').slice(0, 30)}.pdf`); C.busy();
    } catch (e) { C.busy(); C.toast('PDF non riuscito: ' + (e.message || e)); }
  }

  /* ---------- azioni ---------- */
  const digits = s => { let d = String(s || '').replace(/[^\d+]/g, ''); if (d.startsWith('+')) d = d.slice(1); else if (d.startsWith('00')) d = d.slice(2); else if (d.length === 10 && d.startsWith('3')) d = '39' + d; return d; };
  const msg = () => { const p = S.p, t = calc(p); return `Buongiorno ${p.cli.ref || p.cli.nome || ''}, le invio il preventivo ${p.num} per i lavori in ${[p.cant.ind, p.cant.citta].filter(Boolean).join(', ') || 'cantiere'}: totale ${eur(t.tot)} IVA inclusa, valido ${N(p.cond.val) || 30} giorni. Resto a disposizione per qualsiasi chiarimento. ${C.orgName()}`; };
  const PAGN = { 3: ['Acconto alla firma', 'A metà lavori (SAL)', 'A fine lavori'], 2: ['Acconto alla firma', 'A fine lavori'], 1: ['All\'accettazione'] };
  function act(a, b) {
    const id = b.dataset.id, p = S.p, vi = () => p.voci.findIndex(x => String(x.id) === id);
    switch (a) {
      case 'new': return openP('');
      case 'home': return goHome();
      case 'listino': return listinoModal();
      case 'same-addr': p.cant.ind = p.cli.ind || ''; p.cant.citta = p.cli.citta || ''; touch(); return refreshPane();
      case 'dup': { const q = clone(p); q.id = 'cn' + C.uid(); q.num = nextNum(); q.stato = p.stato === 'sopralluogo' ? 'sopralluogo' : 'preventivo'; q.log = {}; q.creato = today(); q.gl = []; q.voci.forEach(v => { v.av = 0; }); S.p = q; S.dirty = true; save(); C.toast('Pratica duplicata: ' + q.num); S.tab = 'dati'; return paintEditor(); }
      case 'del': if (!confirm('Eliminare definitivamente questa pratica?')) return; S.dirty = false; C.write([{ action: 'delete', sheet: 'Config', id: keyOf(p.id) }]); C.toast('Pratica eliminata'); return goHome();
      case 'amb-add': { p.amb.push({ id: 'a' + C.uid(), n: b.dataset.n || '', l: '', p: '', h: '', ap: [], note: '' }); touch(); refreshPane(); const inp = $$('#cn-amb .cn-ar').pop(); const f = inp && $('input[data-r$="|l"]', inp); f && f.focus(); return; }
      case 'amb-del': { const a2 = p.amb.find(x => x.id === id); if (a2 && (N(a2.l) || N(a2.p)) && !confirm('Eliminare questo ambiente?')) return; p.amb = p.amb.filter(x => x.id !== id); touch(); return refreshPane(); }
      case 'ap-add': { const a2 = p.amb.find(x => x.id === id); if (a2) { (a2.ap = a2.ap || []).push({ id: 'o' + C.uid(), t: 'Porta', l: '0,90', h: '2,10', q: '1' }); touch(); refreshPane(); } return; }
      case 'ap-del': { const a2 = p.amb.find(x => x.id === id); if (a2) { a2.ap = a2.ap.filter(x => x.id !== b.dataset.ap); touch(); refreshPane(); } return; }
      case 'pl-new': { const pl = window.CDC_CAD.newPlan(p.piante.length ? 'Piano ' + (p.piante.length + 1) : 'Piano terra'); p.piante.push(pl); touch(); return openCad(pl.id); }
      case 'pl-open': return openCad(id);
      case 'pl-amb': { const pl = p.piante.find(x => x.id === id); return pl && plToAmb(pl); }
      case 'pl-dup': { const pl = p.piante.find(x => x.id === id); if (pl) { const c = clone(pl); c.id = 'pl' + C.uid(); c.n = (pl.n || 'Piantina') + ' (copia)'; p.piante.push(c); touch(); refreshPane(); } return; }
      case 'pl-del': { const pl = p.piante.find(x => x.id === id); if (!pl || !confirm('Eliminare questa piantina?')) return; p.piante = p.piante.filter(x => x.id !== id); touch(); return refreshPane(); }
      case 'pl-png': { const pl = p.piante.find(x => x.id === id); if (!pl) return; if (!pl.w.length) return C.toast('La piantina è vuota'); C.busy('Preparo l’immagine…'); return window.CDC_CAD.png(pl, 2000, { title: pl.n }).then(r => { const a = document.createElement('a'); a.href = r.url; a.download = 'piantina-' + String(pl.n || p.num).replace(/[^\w]+/g, '-').toLowerCase() + '.png'; document.body.appendChild(a); a.click(); a.remove(); }).catch(e => C.toast(e.message)).finally(() => C.busy()); }
      case 'foto-cam': return $('#cn-fc').click();
      case 'foto-gal': return $('#cn-fg').click();
      case 'mic': return dictate(b);
      case 'pick': return pickModal();
      case 'voce-new': { const v = addVoce({ cat: 'Varie', pr: '' }); refreshPane(); const f = $(`[data-v="${v.id}"] .d`); f && f.focus(); return; }
      case 'from-rilievo': return fromRilievo();
      case 'v-more': { const e = $(`[data-vx="${id}"]`); if (e) e.classList.toggle('hid'); return; }
      case 'v-mis': return misureModal(id);
      case 'v-del': p.voci.splice(vi(), 1); touch(); live(); return refreshPane();
      case 'v-dup': { const i = vi(); if (i < 0) return; const c = clone(p.voci[i]); c.id = 'v' + C.uid(); p.voci.splice(i + 1, 0, c); touch(); return refreshPane(); }
      case 'v-up': case 'v-down': { const i = vi(), d = a === 'v-up' ? -1 : 1; if (i < 0) return; let j = i + d; while (j >= 0 && j < p.voci.length && p.voci[j].cat !== p.voci[i].cat) j += d; if (j < 0 || j >= p.voci.length) return; [p.voci[i], p.voci[j]] = [p.voci[j], p.voci[i]]; touch(); refreshPane(); const e = $(`[data-vx="${id}"]`); e && e.classList.remove('hid'); return; }
      case 'pag-add': p.pag.push({ id: 'g' + C.uid(), d: '', pc: '' }); touch(); return refreshPane();
      case 'pag-del': p.pag = p.pag.filter(x => x.id !== id); touch(); return refreshPane();
      case 'pag-pre': { const L = b.dataset.n.split(','); const nm = PAGN[L.length] || []; p.pag = L.map((x, i) => ({ id: 'g' + C.uid(), d: nm[i] || 'Rata ' + (i + 1), pc: x })); if (L.length === 2 && L[0] === '40') p.pag[0].d = 'Acconto alla firma'; touch(); return refreshPane(); }
      case 'send': setStato('inviato'); C.toast('Segnato come inviato'); return refreshPane();
      case 'won': setStato('accettato'); return refreshPane();
      case 'lost': setStato('perso'); return refreshPane();
      case 'reopen': setStato('inviato'); return refreshPane();
      case 'start': setStato('lavori'); return refreshPane();
      case 'close': if (confirm('Chiudere il cantiere?')) { setStato('chiuso'); refreshPane(); } return;
      case 'pdf': return buildPdf();
      case 'wa': { const d = digits(p.cli.tel); window.open(`https://wa.me/${d}?text=${encodeURIComponent(msg())}`, '_blank', 'noopener'); return; }
      case 'mail': { location.href = `mailto:${encodeURIComponent(p.cli.email || '')}?subject=${encodeURIComponent('Preventivo ' + p.num)}&body=${encodeURIComponent(msg())}`; return; }
      case 'gl-add': (p.gl = p.gl || []).push({ id: 'g' + C.uid(), data: today(), t: '' }); touch(); return refreshPane();
      case 'gl-del': p.gl = p.gl.filter(x => x.id !== id); touch(); return refreshPane();
      case 'ex-add': (p.extra = p.extra || []).push({ id: 'x' + C.uid(), d: '', imp: '' }); touch(); return refreshPane();
      case 'ex-del': p.extra = p.extra.filter(x => x.id !== id); touch(); return refreshPane();
    }
  }
  function onClick(e) {
    let b; const t = e.target;
    if ((b = t.closest('[data-open]'))) return openP(b.dataset.open);
    if ((b = t.closest('[data-fs]'))) { S.fs = S.fs === b.dataset.fs ? '' : b.dataset.fs; return paintHome(); }
    if ((b = t.closest('[data-tab]'))) return setTab(b.dataset.tab);
    if ((b = t.closest('[data-st]'))) return setStato(b.dataset.st);
    if ((b = t.closest('[data-cks]'))) {
      if (!canW()) return; const [k, s] = b.dataset.cks.split(':'); if (S.p.chk[k] === s) delete S.p.chk[k]; else S.p.chk[k] = s; touch();
      const row = b.closest('.cn-ci'), lab = $('span', row).textContent; row.outerHTML = chkRow(k, lab); const h = $('#cn-chead'); if (h) h.innerHTML = chkHead(); return;
    }
    if ((b = t.closest('[data-vt]'))) { const [k, id] = b.dataset.vt.split(':'), v = S.p.voci.find(x => x.id === id); if (!v) return; if (k === 'opt') { v.opt = !v.opt; v.on = !v.opt; } else if (k === 'on') v.on = !v.on; else v.var = !v.var; touch(); refreshPane(); const e2 = $(`[data-vx="${id}"]`); e2 && e2.classList.remove('hid'); return; }
    if ((b = t.closest('.cn-pt[data-ph]'))) return lightbox(b.dataset.ph);
    if ((b = t.closest('[data-act]'))) return act(b.dataset.act, b);
  }
  function onInput(e) {
    const el = e.target; if (!el || !el.matches) return;
    if (el.id === 'cn-q') { S.q = el.value; const L = homeList(); const box = $('#cn-list'); if (box) box.innerHTML = L; return; }
    if (!S.p) return;
    if (el.dataset.f) {
      setPath(el.dataset.f, el.value); if (el.dataset.f === 'cli.nome') { const h = $('#cn-ht'); if (h) h.textContent = el.value || 'Nuova pratica'; }
      touch(); live(); return;
    }
    if (el.dataset.r) {
      const parts = el.dataset.r.split('|'), it = rItem(parts); if (!it) return; it[parts[parts.length - 1]] = el.value;
      $$(`[data-r="${el.dataset.r}"]`).forEach(o => { if (o !== el) o.value = el.value; });
      if (parts[0] === 'amb' && parts[2] === 'n') { /* il nome non cambia le misure */ }
      touch(); live(); return;
    }
    if (el.dataset.cn) { S.p.chkN[el.dataset.cn] = el.value; touch(); return; }
  }
  function onChange(e) {
    const el = e.target;
    if (el.id === 'cn-cpick') { const c = (C.db().clienti || []).find(x => String(x.id) === el.value); if (c) { Object.assign(S.p.cli, { id: c.id, nome: c.nome || '', tel: c.tel || '', email: c.email || '', ind: c.indirizzo || '', cap: c.cap || '', citta: c.citta || '', prov: c.prov || '', piva: c.piva || '', cf: c.cf || '' }); const h = $('#cn-ht'); if (h) h.textContent = c.nome || 'Nuova pratica'; touch(); refreshPane(); } else { S.p.cli.id = ''; touch(); } return; }
    if (el.dataset && el.dataset.plpdf) { const pl = (S.p.piante || []).find(x => x.id === el.dataset.plpdf); if (pl) { pl.pdf = el.checked; touch(); } return; }
    if (el.id === 'cn-pf') { S.p.cond.foto = el.checked; touch(); return; }
    if (el.id === 'cn-fc' || el.id === 'cn-fg') { const f = [...el.files]; el.value = ''; return addPhotos(f); }
    if (el.dataset && el.dataset.r && el.dataset.r.startsWith('amb|')) { const pl = $('#cn-plan'); if (pl) pl.innerHTML = planSvg(S.p); }
  }
  const homeList = () => { const A = ALL(), q = norm(S.q); let L = A.map(p => [p, calc(p).tot]).filter(([p]) => (!S.fs || p.stato === S.fs) && (!q || norm([p.num, p.cli.nome, p.cant.ind, p.cant.citta, p.cant.tipo].join(' ')).includes(q))); L.sort((a, b) => String(b[0].agg || b[0].creato).localeCompare(String(a[0].agg || a[0].creato)) || String(b[0].num).localeCompare(String(a[0].num))); return L.length ? `<div class="cn-lst">${L.map(([p, tot], i) => cardP(p, tot, i)).join('')}</div>` : '<div class="cn-empty"><b>Nessuna pratica trovata</b><p>Cambia i filtri o la ricerca.</p></div>'; };
  function bind(el) {
    el.addEventListener('click', onClick); el.addEventListener('input', onInput); el.addEventListener('change', onChange);
    el.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-open][role=button]')) { e.preventDefault(); openP(e.target.dataset.open); } });
  }
  function render(el, ctx) {
    C = ctx; root = el; ensureCss(); if (C.sub) C.sub('Sopralluoghi, preventivi e avanzamento dei lavori'); if (!el._cnB) { bind(el); el._cnB = 1; }
    if (S.v === 'p' && S.p) { if (!$('#cn-r')) paintEditor(); return; }
    if ($('#cn-r') && document.activeElement && document.activeElement.id === 'cn-q') return;
    S.v = 'home'; paintHome();
  }
  window.CDC_CN = { render, calc, misure, L0 };
})();
