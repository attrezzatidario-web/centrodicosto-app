/* Fischer — ordini al fornitore Fischer (solo gestionale principale, settore veicoli).
   Si caricano le conferme d'ordine in PDF: vengono lette, controllate (righe, sconto, IVA, totale) e assegnate
   al piazzale di destinazione. Ogni ordine ha le sue movimentazioni e una spunta verde «fatturato» (come in GLS).
   Dati: Config «fi:<id>» = un ordine; «fif:<id>» = una fattura Fischer (righe con DDT e piazzale di destinazione);
   «fiFatt» = { 'f<numero fattura>|<PIAZZALE>': 'AAAA-MM-GG' } = parte di fattura già fatturata al piazzale.
   Uso: window.CDC_FI.render(el, ctx) — caricato da app.js quando si apre la sezione. */
(() => {
  'use strict';
  const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  const ST = { confermato: ['Confermato', ''], spedito: ['In consegna', 'soon'], consegnato: ['Consegnato', 'paid'], annullato: ['Annullato', 'late'] };
  const ST_K = Object.keys(ST);
  let X = null, tab = 'pan', openId = '', openInv = '', fq = '', fpz = '', fst = '', fqf = '', fpzf = '', fsf = '', anim = true, lim = 40, limF = 40;

  /* ---------- lettura del PDF ---------- */
  const N = s => { s = String(s == null ? '' : s).trim(); if (!s) return 0; const neg = /-$/.test(s) || /^-/.test(s); const v = parseFloat(s.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.')); return isNaN(v) ? 0 : (neg ? -v : v); };
  const r2 = n => Math.round((Number(n) || 0) * 100) / 100;
  const dIso = s => { const m = /(\d{2})\.(\d{2})\.(\d{4})/.exec(s || ''); return m ? `${m[3]}-${m[2]}-${m[1]}` : ''; };
  const title = s => { s = String(s || '').trim(); return s && s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s'(-])([a-zà-ù])/g, (m, a, b) => a + b.toUpperCase()) : s; };
  const same = (a, b) => Math.abs(a - b) <= 0.02;

  async function extract(u8) {
    if (!window.pdfjsLib) await X.loadLib('lib-pdfjs.js');
    if (!window.pdfjsLib) throw new Error('lettore PDF non caricato');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib-pdfjs-worker.js';
    const pdf = await pdfjsLib.getDocument({ data: u8.slice() }).promise, items = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const tc = await (await pdf.getPage(p)).getTextContent();
      tc.items.forEach(i => { if (String(i.str).trim()) items.push({ p, x: i.transform[4], y: i.transform[5], w: i.width || 0, s: String(i.str) }); });
    }
    return items;
  }
  // righe di testo ricostruite dalle posizioni (dall'alto in basso, da sinistra a destra)
  function lines(items, keep) {
    const out = [];
    [...new Set(items.map(i => i.p))].sort((a, b) => a - b).forEach(p => {
      let cur = null;
      items.filter(i => i.p === p && (!keep || keep(i))).sort((a, b) => b.y - a.y || a.x - b.x).forEach(i => {
        if (cur && Math.abs(cur.y - i.y) <= 2.5) cur.it.push(i); else { cur = { p, y: i.y, it: [i] }; out.push(cur); }
      });
    });
    out.forEach(l => {
      l.it.sort((a, b) => a.x - b.x);
      let t = '', end = null;
      l.it.forEach(i => { t += (end != null && i.x - end < 0.8 ? '' : ' ') + i.s; end = i.x + i.w; });
      l.t = t.replace(/\s+/g, ' ').trim();
    });
    return out.filter(l => l.t);
  }
  const ROW = /^(\d{8})\s+(.+?)\s+(\d{1,3}(?:\.\d{3})*(?:,\d+)?)\s+([A-Z]{2})\s+(\d{1,3}(?:\.\d{3})*,\d{2})\s+(\d+)\s+([A-Z]{2})\s+(?:(\d{1,2},\d{2})\s+)?(\d{1,3}(?:\.\d{3})*,\d{2})\s+(\d{1,2})$/;

  // items = testo del PDF con posizioni → ordine (senza stato e piazzale collegato)
  function parse(items) {
    const all = lines(items), txt = all.map(l => l.t).join('\n');
    if (!/Conferma\s+D.ordine/i.test(txt) || !/fischer/i.test(txt)) throw new Error('non sembra una conferma d\'ordine Fischer');
    const o = { righe: [], dest: {} };
    const left = lines(items, i => i.p === 1 && i.x < 290);
    const g = (re, from) => { for (const l of from || left) { const m = re.exec(l.t); if (m) return m; } return null; };
    let m;
    if ((m = g(/^Data\s+(\d{2}\.\d{2}\.\d{4})/))) o.data = dIso(m[1]);
    if ((m = g(/Numero di cliente\s+(\d+)/))) o.cliente = m[1];
    if ((m = g(/Numero d.ordine\s+(\d+)/))) o.num = m[1];
    if (!o.num) throw new Error('numero d\'ordine non trovato');
    // destinazione della merce: righe sotto «Destinazione merce» fino a «Contatto»
    const i0 = left.findIndex(l => /^Destinazione merce/i.test(l.t)), D = [];
    if (i0 >= 0) for (let k = i0 + 1; k < left.length && !/^Contatto/i.test(left[k].t); k++) D.push(left[k].t);
    if (!D.length) throw new Error('destinazione della merce non trovata');
    const last = D[D.length - 1], cm = /^(\d{5})\s+(.+?)\s+([A-Z]{2})$/.exec(last);
    if (cm) { o.dest.cap = cm[1]; o.dest.citta = title(cm[2]); o.dest.prov = cm[3]; D.pop(); }
    o.dest.rs = title(D[0] || '');
    const mg = D.slice(1).find(t => /^\(?\s*(magazzino|mag\.?)\s+/i.test(t));
    if (mg) { o.dest.mag = title(mg.replace(/^\(?\s*(magazzino|mag\.?)\s+/i, '').replace(/\)\s*$/, '').trim()); }
    o.dest.via = title(D.slice(1).filter(t => t !== mg).join(', '));
    o.pz = o.dest.mag || o.dest.citta || o.dest.rs;
    // testata e righe
    let r = null;
    all.forEach(l => {
      const t = l.t;
      if ((m = /Peso totale:?\s*([\d.,]+)\s*KG/i.exec(t))) o.peso = N(m[1]);
      if ((m = /Magazzino:\s*(.+?)(?:\s+Peso|$)/i.exec(t))) o.magForn = m[1].trim();
      if ((m = /Condizioni Pagamento\s*:?\s*(.+)$/i.exec(t))) o.pagamento = m[1].trim();
      if ((m = /Spediz\.\/Corriere\s+(.+)$/i.exec(t))) o.corriere = m[1].trim();
      if ((m = /Porto\s*\/\s*Resa\s+(.+)$/i.exec(t))) o.porto = m[1].trim();
      if ((m = ROW.exec(t))) { r = { cod: m[1], desc: m[2].trim().replace(/(\d)(con\b)/gi, '$1 $2').replace(/\.$/, ''), ean: '', q: N(m[3]), um: m[4], prezzo: N(m[5]), per: N(m[6]), umPrezzo: m[7], sconto: m[8] ? N(m[8]) : 0, importo: N(m[9]), iva: Number(m[10]), consegna: '' }; o.righe.push(r); return; }
      if (r && /^\d{13}$/.test(t)) { r.ean = t; return; }
      if (r && (m = /Data presunta consegna il\s+(\d{2}\.\d{2}\.\d{4})/i.exec(t))) { r.consegna = dIso(m[1]); return; }
      if ((m = /^Importo totale EUR\s+([\d.,]+)/i.exec(t))) o.importoRighe = N(m[1]);
      else if ((m = /^Sconto di testata\(%\)\s+([\d.,]+)-?\s*%\s+([\d.,]+)/i.exec(t))) { o.scontoPct = N(m[1]); o.scontoImp = N(m[2]); }
      else if ((m = /^Spese di spedizione\s+([\d.,]+)/i.exec(t))) o.spese = N(m[1]);
      else if ((m = /^IVA Vend\.?\s+(\d+)\s*%\s+([\d.,]+)\s*%\s+imponibile:\s*([\d.,]+)\s+([\d.,]+)/i.exec(t))) { o.ivaPct = N(m[2]); o.imponibile = N(m[3]); o.iva = N(m[4]); }
      else if ((m = /^Totale ordine EUR\s+([\d.,]+)/i.exec(t))) o.totale = N(m[1]);
    });
    if (!o.righe.length) throw new Error('nessuna riga articolo trovata');
    o.scontoPct = o.scontoPct || 0; o.scontoImp = o.scontoImp || 0; o.spese = o.spese || 0;
    if (o.importoRighe == null) o.importoRighe = r2(o.righe.reduce((s, x) => s + x.importo, 0));
    o.id = 'o' + o.num;
    return o;
  }
  /* ---------- fatture elettroniche Fischer (PDF «fattura differita» con DDT e destinazione merce per riga) ---------- */
  const dIt = s => { const m = /(\d{2})-(\d{2})-(\d{4})/.exec(s || ''); return m ? `${m[3]}-${m[2]}-${m[1]}` : ''; };
  const NU = '-?\\d{1,3}(?:\\.\\d{3})*,\\d+';
  const IROW = new RegExp(`^(\\d{8})\\s+\\(COD\\.\\s+(.+?)\\s+(${NU})\\s+(${NU})\\s+(?:([A-Z]{2})\\s+)?(?:(-?\\d{1,2},\\d{2})\\s+)?(\\d{1,2},\\d{2}|N\\d\\.\\d)\\s+(${NU})$`);
  // provincia → piazzale (i magazzini dei logistici Veneta Logistic / RL2 portano il nome della città, non quello del piazzale)
  const PROV_PZ = { RM: 'San Cesareo', TO: 'Torino', VE: 'Venezia', VR: 'Verona', MI: 'Gorgonzola', RA: 'Ravenna', RN: 'Rimini', BO: 'Bologna', PI: 'Pisa', TE: 'Corropoli', PE: 'Pescara' };
  function pzOf(d) {
    if (!d) return '';
    const mg = /\(\s*magazzino\s+([^)]+)\)/i.exec(d.rs || '');
    return mg ? title(mg[1].trim()) : (PROV_PZ[String(d.prov || '').toUpperCase()] || d.citta || d.rs || '');
  }
  const isInvoice = txt => /Cedente\/prestatore/i.test(txt) && /fischer/i.test(txt) && /Numero documento/i.test(txt);
  function parseInv(items) {
    const all = lines(items), txt = all.map(l => l.t).join('\n');
    if (!isInvoice(txt)) throw new Error('non sembra una fattura Fischer');
    const f = { righe: [] };
    let m;
    for (const l of all) { if ((m = /^(TD\d{2})\b.*?\b(\d{5,})\s+(\d{2}-\d{2}-\d{4})\b/.exec(l.t))) { f.tipo = m[1]; f.num = m[2]; f.data = dIt(m[3]); break; } }
    if (!f.num) throw new Error('numero fattura non trovato');
    f.id = 'f' + f.num;
    let ddt = null, ord = '', r = null, blk = null, tot = false;
    const ends = t => /^(Tipo dato:|DDT\s|Vs\.?\s*Ord|-{5,}|RIEPILOGHI)/i.test(t) || IROW.test(t);
    for (const l of all) {
      let t = l.t;
      if (/^file:\/\/|^Page \d+ of \d+$/i.test(t)) continue;
      if (/RIEPILOGHI IVA/i.test(t)) { tot = true; r = null; blk = null; continue; }
      if (!tot) {
        if ((m = /^Condizione di pagamento:\s*(.+)$/i.exec(t))) f.cond = m[1].trim();
        else if ((m = /^Codice cliente:\s*(\d+)/i.exec(t))) f.cliente = m[1];
        if ((m = /^Vs\.?\s*Ord\.?\s*(.*)$/i.exec(t))) { ord = m[1].trim(); blk = null; continue; }
        if ((m = /^DDT\s+(\S+)\s+del\s+(\d{2}-\d{2}-\d{4})/i.exec(t))) { ddt = { n: m[1].replace(/^0+/, ''), d: dIt(m[2]) }; blk = null; continue; }
        if ((m = IROW.exec(t))) {
          r = { cod: m[1], desc: m[2].trim().replace(/\.$/, '').replace(/(\d)(con\b)/gi, '$1 $2'), q: N(m[3]), prezzo: N(m[4]), um: m[5] || '', sconto: m[6] ? N(m[6]) : 0, iva: m[7], importo: N(m[8]), ddt: ddt ? ddt.n : '', ddtData: ddt ? ddt.d : '', ord, ean: '', d: [] };
          f.righe.push(r); blk = null; continue;
        }
        if ((m = new RegExp(`^(SPESE\\s.+?)\\s*\\(AC\\)\\s+(${NU})\\s+(\\d{1,2},\\d{2})\\s+(${NU})$`, 'i').exec(t))) {
          f.righe.push({ cod: 'TRASPORTO', desc: title(m[1].trim()), q: 1, prezzo: N(m[2]), um: '', sconto: 0, iva: m[3], importo: N(m[4]), ddt: ddt ? ddt.n : '', ddtData: ddt ? ddt.d : '', ord, ean: '', spese: true, d: [] }); r = null; blk = null; continue;
        }
        if (!r) continue;
        t = t.replace(/^\(EAN\)\s*/, '').replace(/\s*\(EAN\)\s*/, ' ').trim();
        if ((m = /^(\d{13})\b\s*(.*)$/.exec(t))) { r.ean = m[1]; t = m[2]; }
        if (/ARTICOLO\)\s*$/i.test(t) && !/Tipo dato/i.test(t)) continue;
        t = t.replace(/^ARTICOLO\)\s*/, '');
        if ((m = /Tipo dato:\s*(\S+)/i.exec(t))) { blk = { k: m[1].toUpperCase(), t: '' }; if (blk.k === 'DEST.MERCE') r.d.push(blk); t = t.replace(/^.*?Tipo dato:\s*\S+\s*/i, ''); }
        if (blk && blk.k === 'DEST.MERCE') { if ((m = /Rif\.\s*testo:\s*(.*)$/i.exec(t))) blk.t = m[1].trim(); else if (t && !ends(t)) blk.t += ' ' + t; }
        continue;
      }
      if ((m = /^I\s*\(esigibilit.*?\)\s+(\d{1,2},\d{2}|N\d\.\d)\s+(.+)$/i.exec(t))) { const nn = m[2].match(/-?\d{1,3}(?:\.\d{3})*,\d{2}|\b0\b/g) || []; (f.aliq = f.aliq || []).push({ pct: m[1], imp: N(nn[0]), iva: N(nn[1]) }); continue; }
      if (/Totale documento/i.test(t)) { f._tl = true; continue; }
      if (f._tl) { const nn = t.match(/-?\d{1,3}(?:\.\d{3})*,\d{2}/g); if (nn) { f.totale = N(nn[nn.length - 1]); f._tl = false; } continue; }
      if ((m = /^(MP\d{2})\s+(\S+)/.exec(t))) f.mp = m[2];
      if ((m = /Data termine\s+(\d{2}-\d{2}-\d{4})\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})/i.exec(t))) (f.scad = f.scad || []).push({ d: '', imp: N(m[2]) });
      if ((m = /Data scadenza\s+(\d{2}-\d{2}-\d{4})/i.exec(t)) && f.scad && f.scad.length) f.scad[f.scad.length - 1].d = dIt(m[1]);
    }
    delete f._tl;
    if (!f.righe.length) throw new Error('nessuna riga articolo trovata');
    f.righe.forEach(x => {
      const p = String((x.d[0] && x.d[0].t) || '').split(/\s+\/\s+/).map(s => s.trim()).filter(Boolean);
      const dd = { rs: title(p[0] || ''), citta: title(p[1] || ''), prov: /^[A-Za-z]{2}$/.test(p[2] || '') ? p[2].toUpperCase() : '', via: title(((x.d[1] && x.d[1].t) || '').trim()) };
      x.dest = dd; x.pz = pzOf(dd); delete x.d;
    });
    f.righe.forEach((x, i) => { if (x.spese) { const p = f.righe.slice(0, i).reverse().find(y => !y.spese); if (p) { x.dest = p.dest; x.pz = p.pz; } } });
    const ag = f.aliq || [];
    f.imponibile = r2(ag.reduce((s, a) => s + a.imp, 0)); f.iva = r2(ag.reduce((s, a) => s + a.iva, 0));
    f.ivaPct = ag[0] ? (/^\d/.test(ag[0].pct) ? N(ag[0].pct) : 0) : 0; f.ivaNat = ag[0] && /^N/.test(ag[0].pct) ? ag[0].pct : '';
    delete f.aliq;
    if (f.totale == null) f.totale = r2(f.imponibile + f.iva);
    f.scad = (f.scad || []).filter(s => s.d);
    return f;
  }
  // controlli sulla fattura
  function checksF(f) {
    const A = [], bad = f.righe.filter(x => !same(r2(x.q * x.prezzo * (1 - (x.sconto || 0) / 100)), x.importo) && Math.abs(r2(x.q * x.prezzo * (1 - (x.sconto || 0) / 100)) - x.importo) > 0.05);
    if (bad.length) A.push({ t: 'warn', h: 'Importo di riga diverso dal calcolo', d: `${bad.map(x => x.cod).join(', ')}: quantità × prezzo non corrisponde all'importo.` });
    const sr = r2(f.righe.reduce((s, x) => s + x.importo, 0));
    if (!same(sr, f.imponibile)) A.push({ t: 'warn', h: 'La somma delle righe non torna', d: `Righe ${num2(sr)} € contro imponibile ${num2(f.imponibile)} €.` });
    if (!same(r2(f.imponibile + f.iva), f.totale) && Math.abs(r2(f.imponibile + f.iva) - f.totale) > 2.1) A.push({ t: 'warn', h: 'Totale diverso dal calcolo', d: `Imponibile + IVA = ${num2(r2(f.imponibile + f.iva))} €, sul documento ${num2(f.totale)} €.` });
    const nod = f.righe.filter(x => !x.pz); if (nod.length && f.tipo !== 'TD02') A.push({ t: 'warn', h: 'Destinazione non indicata', d: `${nod.length} ${nod.length === 1 ? 'riga' : 'righe'} senza destinazione della merce.` });
    return A;
  }

  // controlli sui numeri e sui dati dell'ordine (calcolati ogni volta, non salvati)
  function checks(o) {
    const A = [], ids = o.righe || [];
    const bad = ids.filter(x => x.per && !same(r2(x.q * x.prezzo / x.per * (1 - (x.sconto || 0) / 100)), x.importo));
    if (bad.length) A.push({ t: 'warn', h: 'Importo di riga diverso dal calcolo', d: `${bad.map(x => x.cod).join(', ')}: quantità × prezzo non corrisponde all'importo.` });
    const sr = r2(ids.reduce((s, x) => s + x.importo, 0));
    if (!same(sr, o.importoRighe)) A.push({ t: 'warn', h: 'La somma delle righe non torna', d: `Righe ${sr.toFixed(2)} € contro importo totale ${num2(o.importoRighe)} €.` });
    const imp = r2(o.importoRighe - o.scontoImp + o.spese);
    if (!same(imp, o.imponibile)) A.push({ t: 'warn', h: 'Imponibile diverso dal calcolo', d: `Righe − sconto + spese = ${imp.toFixed(2)} €, sul documento ${num2(o.imponibile)} €.` });
    if (!same(r2(o.imponibile * o.ivaPct / 100), o.iva)) A.push({ t: 'warn', h: 'IVA diversa dal calcolo', d: `${o.ivaPct}% di ${num2(o.imponibile)} € = ${r2(o.imponibile * o.ivaPct / 100).toFixed(2)} €, sul documento ${num2(o.iva)} €.` });
    if (!same(r2(o.imponibile + o.iva), o.totale)) A.push({ t: 'warn', h: 'Totale diverso dal calcolo', d: `Imponibile + IVA = ${r2(o.imponibile + o.iva).toFixed(2)} €, sul documento ${num2(o.totale)} €.` });
    if (!o.cdc) A.push({ t: 'info', h: 'Piazzale da collegare', d: `«${o.pz}» non è collegato a un centro di costo: aprilo e scegli il piazzale.` });
    if (o.spese > 0) A.push({ t: 'info', h: 'Spese di spedizione', d: `${num2(o.spese)} € addebitati (ordine sotto la soglia di porto franco).` });
    if (/anticip/i.test(o.pagamento || '') && !evaso(o)) A.push({ t: 'info', h: 'Pagamento anticipato', d: 'Da pagare prima della spedizione.' });
    return A;
  }
  const num2 = n => X.fmtNum(n, 2);

  /* ---------- dati ---------- */
  const byKey = p => Object.keys(X.db().config || {}).filter(k => k.startsWith(p)).map(k => X.cfg(k)).filter(o => o && o.id);
  const list = () => byKey('fi:').sort((a, b) => String(b.data).localeCompare(String(a.data)) || String(b.num).localeCompare(String(a.num)));
  const listF = () => byKey('fif:').sort((a, b) => String(b.data).localeCompare(String(a.data)) || String(b.num).localeCompare(String(a.num)));
  const FA = () => { const c = X.cfg('fiFatt'); return c && typeof c === 'object' && !Array.isArray(c) ? c : {}; };
  const get = id => { const o = X.cfg('fi:' + id); return o ? JSON.parse(JSON.stringify(o)) : null; };
  const getF = id => { const o = X.cfg('fif:' + id); return o ? JSON.parse(JSON.stringify(o)) : null; };
  const opSave = o => ({ action: 'upsert', sheet: 'Config', row: { chiave: 'fi:' + o.id, valore: JSON.stringify(o) } });
  const opSaveF = f => ({ action: 'upsert', sheet: 'Config', row: { chiave: 'fif:' + f.id, valore: JSON.stringify(f) } });
  const opFatt = fa => ({ action: 'upsert', sheet: 'Config', row: { chiave: 'fiFatt', valore: JSON.stringify(fa) } });
  const money = n => X.eur(n);
  const pzTot = n => X.eur0(n);
  const pzKey = s => String(s || '').toUpperCase().trim();
  const pu = n => X.fmtNum(n, 6).replace(/(,\d*?)0+$/, '$1').replace(/,$/, ''); // prezzo unitario: fino a 6 decimali senza zeri in coda
  const nextDel = o => (o.righe || []).map(x => x.consegna).filter(Boolean).sort()[0] || '';
  const sum = L => r2(L.reduce((s, o) => s + o.imponibile, 0));
  const plur = (n, a, b) => `${n} ${n === 1 ? a : b}`;

  let M = null, gm = new Map();
  // piazzale per nome: collegato al centro di costo se riconosciuto, altrimenti raggruppato per nome
  const gOf = name => {
    const k = pzKey(name); if (gm.has(k)) return gm.get(k);
    const cdc = (name && X.guess && X.guess(name)) || '', g = { k: cdc ? 'c:' + cdc : 'n:' + k, n: cdc ? X.cdcName(cdc) : (name || '—'), cdc };
    gm.set(k, g); return g;
  };
  const gOfO = o => o.cdc ? { k: 'c:' + o.cdc, n: X.cdcName(o.cdc), cdc: o.cdc } : gOf(o.pz);
  const gkey = o => gOfO(o).k, gname = o => gOfO(o).n;

  // un ordine è «evaso» quando ogni sua riga (codice + quantità) si ritrova in una fattura dello stesso piazzale, emessa dopo l'ordine
  function reconcile(O, buy) {
    const pool = [];
    buy.forEach(f => f.righe.forEach(x => { if (!x.spese) pool.push({ f, x, k: gOf(x.pz).k, used: false }); }));
    pool.sort((a, b) => String(a.f.data).localeCompare(String(b.f.data)));
    const R = {};
    O.slice().sort((a, b) => String(a.data).localeCompare(String(b.data))).forEach(o => {
      const ok = gOfO(o).k, hit = [];
      o.righe.forEach(r => { const p = pool.find(p => !p.used && p.k === ok && p.x.cod === r.cod && p.x.q === r.q && String(p.f.data) >= String(o.data)); if (p) { p.used = true; hit.push(p.f); } });
      R[o.id] = { n: hit.length, tot: o.righe.length, full: hit.length > 0 && hit.length === o.righe.length, part: hit.length > 0 && hit.length < o.righe.length, fatt: [...new Set(hit.map(f => f.num))], ids: [...new Set(hit.map(f => f.id))], d: hit.map(f => f.data).sort().pop() || '' };
    });
    return R;
  }
  const evaso = o => !!(M && M.rec[o.id] && M.rec[o.id].full);
  const late = o => o.stato !== 'consegnato' && o.stato !== 'annullato' && !evaso(o) && nextDel(o) && nextDel(o) < X.today();

  function model() {
    gm = new Map();
    const O = list(), FI = listF(), fa = FA(), act = O.filter(o => o.stato !== 'annullato');
    const buy = FI.filter(f => f.tipo !== 'TD02'), acc = FI.filter(f => f.tipo === 'TD02');
    const parts = [], G = new Map(), arts = new Map(), mm = new Map();
    buy.forEach(f => {
      const by = new Map();
      f.righe.forEach(x => { const k = pzKey(x.pz); if (!by.has(k)) by.set(k, { pz: x.pz, L: [] }); by.get(k).L.push(x); });
      by.forEach((v, k) => {
        const g = gOf(v.pz || '—'), key = f.id + '|' + k;
        const p = { key, f, pz: v.pz, g, L: v.L, imp: r2(v.L.reduce((s, x) => s + x.importo, 0)), q: v.L.reduce((s, x) => s + (x.spese ? 0 : x.q), 0), done: !!fa[key] };
        parts.push(p);
        if (!G.has(g.k)) G.set(g.k, { k: g.k, n: g.n, P: [], q: 0, tot: 0, ddt: new Set() });
        const o = G.get(g.k); o.P.push(p); o.q += p.q; o.tot += p.imp; v.L.forEach(x => { if (x.ddt) o.ddt.add(f.id + '|' + x.ddt); });
      });
      f.righe.forEach(x => { if (x.spese) return; const a = arts.get(x.cod) || { cod: x.cod, desc: x.desc, q: 0, imp: 0, f: new Set() }; a.q += x.q; a.imp += x.importo; a.f.add(f.id); arts.set(x.cod, a); });
      const mk = String(f.data || '').slice(0, 7); if (mk) { const a = mm.get(mk) || { k: mk, imp: 0, n: 0 }; a.imp += f.imponibile; a.n++; mm.set(mk, a); }
    });
    const groups = [...G.values()].map(g => { const done = g.P.filter(p => p.done), todo = g.P.filter(p => !p.done); return { ...g, tot: r2(g.tot), done, todo, tTodo: r2(todo.reduce((s, p) => s + p.imp, 0)), nd: g.ddt.size }; })
      .sort((a, b) => b.tTodo - a.tTodo || b.tot - a.tot || a.n.localeCompare(b.n, 'it'));
    const scad = buy.filter(f => f.scad && f.scad[0] && f.scad[0].d >= X.today() && !/pagato/i.test(f.cond || '')).sort((a, b) => a.scad[0].d.localeCompare(b.scad[0].d));
    return { O, FI, buy, acc, act, parts, groups, fa, rec: reconcile(act, buy), scad, arts: [...arts.values()].map(a => ({ ...a, n: a.f.size })).sort((a, b) => b.imp - a.imp), months: [...mm.values()].sort((a, b) => a.k.localeCompare(b.k)).slice(-12), spese: r2(buy.reduce((s, f) => s + f.righe.filter(x => x.spese).reduce((a, x) => a + x.importo, 0), 0)) };
  }

  /* ---------- pagina ---------- */
  function render(el, ctx) {
    X = ctx; el._fi = true;
    if (!el._wired) { wire(el); el._wired = true; }
    draw(el);
  }
  const monthLbl = k => { const [y, m] = k.split('-'); return `${MESI[+m - 1].slice(0, 3)} ${y}`; };
  const esc = s => X.esc(s);
  function draw(el) {
    X.sub('acquisti dal fornitore Fischer · IVA esclusa, salvo dove indicato');
    M = model();
    const can = X.canWrite();
    if (openId && !get(openId)) openId = ''; if (openInv && !getF(openInv)) openInv = '';
    const body = openInv ? invDetail(getF(openInv), can) : openId ? detail(get(openId), can) : tab === 'ord' ? orders() : tab === 'fat' ? invoices() : overview();
    const t = openInv ? 'fat' : openId ? 'ord' : tab;
    el.innerHTML = `<div class="gl-bar"><div class="tr-seg tr-tabs" role="tablist"><button type="button" data-fitab="pan" class="${t === 'pan' ? 'on' : ''}">Panoramica</button><button type="button" data-fitab="fat" class="${t === 'fat' ? 'on' : ''}">Fatture</button><button type="button" data-fitab="ord" class="${t === 'ord' ? 'on' : ''}">Ordini</button></div>
      <div class="gl-act">${can ? '<button type="button" class="btn sm primary" id="fi-up"><span class="lb-d">+ Carica fatture o ordini</span><span class="lb-m">+ Carica</span></button>' : ''}</div></div>
      <input type="file" id="fi-file" accept="application/pdf,.pdf,application/zip,.zip" multiple hidden>
      <div class="fi-body${anim && !X.reduced() ? ' cc-anim' : ''}">${body}</div>`;
    anim = false;
    counters(el);
  }
  function totals() {
    const todo = M.parts.filter(p => !p.done), done = M.parts.filter(p => p.done);
    return { tot: r2(M.buy.reduce((s, f) => s + f.imponibile, 0)), todo, done, tTodo: r2(todo.reduce((s, p) => s + p.imp, 0)), tDone: r2(done.reduce((s, p) => s + p.imp, 0)), scad: r2(M.scad.reduce((s, f) => s + f.totale, 0)), pezzi: M.buy.reduce((s, f) => s + f.righe.reduce((a, x) => a + (x.spese ? 0 : x.q), 0), 0) };
  }
  function counters(el) {
    if (openId || openInv || tab !== 'pan' || !(M.buy.length || M.act.length)) return;
    const T = totals(), vals = [T.tot, T.tTodo, T.tDone, T.scad, T.pezzi];
    el.querySelectorAll('[data-fik]').forEach(b => { const i = +b.dataset.fik; X.countTo(b, vals[i], i === 4 ? v => X.fmtNum(Math.round(v), 0) : X.eur0); });
  }

  function overview() {
    const m = M;
    if (!m.O.length && !m.FI.length) return `<div class="card fi-empty"><div class="pv-empty"><div class="pv-ei"><svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/></svg></div><h3>Nessun documento Fischer</h3><p>Carica le fatture (anche tutte insieme, in PDF o in uno zip) e le conferme d'ordine: vengono lette, controllate e divise per piazzale di destinazione.</p>${X.canWrite() ? '<button type="button" class="btn primary" id="fi-up2">+ Carica fatture o ordini</button>' : ''}</div></div>`;
    const T = totals(), last = m.buy.map(f => f.data).sort().pop();
    const wait = m.act.filter(o => !evaso(o) && o.stato !== 'consegnato');
    const KP = [
      ['Da fatturare ai piazzali', T.tTodo, T.todo.length ? plur(T.todo.length, 'fattura da emettere', 'fatture da emettere') : 'tutto fatturato', 1],
      ['Fatturato ai piazzali', T.tDone, plur(T.done.length, 'fattura emessa', 'fatture emesse'), 2],
      ['Da pagare a Fischer', T.scad, m.scad.length ? `IVA inclusa · prima il ${X.shortDate(m.scad[0].scad[0].d)}` : 'nessuna scadenza futura', 3],
      ['Pezzi acquistati', T.pezzi, plur(m.arts.length, 'articolo', 'articoli'), 4]
    ];
    const A = []; m.FI.forEach(f => checksF(f).filter(c => c.t === 'warn').forEach(c => A.push({ f, c }))); m.act.forEach(o => checks(o).filter(c => c.t === 'warn').forEach(c => A.push({ o, c })));
    const mx = Math.max(1, ...m.months.map(x => x.imp)), ax = Math.max(1, ...m.arts.map(x => x.imp)), gx = Math.max(1, ...m.groups.map(g => g.tot));
    const acc = m.acc.reduce((s, f) => s + f.imponibile, 0);
    return `<div class="gl-hero fi-hero"><div class="gh-top"><div class="gh-main"><span class="gh-lbl">Acquisti Fischer · imponibile fatturato</span><div class="gh-big" data-fik="0">0</div>
        <div class="gh-sub"><span>${plur(m.buy.length, 'fattura', 'fatture')}</span><span>${plur(m.groups.length, 'piazzale', 'piazzali')}</span>${last ? `<span>ultima il ${esc(X.shortDate(last))}</span>` : ''}${acc ? `<span>deposito a garanzia ${esc(pzTot(acc))}</span>` : ''}</div></div></div>
      <div class="gh-kpis">${KP.map(([l, v, s, i]) => `<div class="gh-k${i === 1 && T.todo.length ? ' ly-kwarn' : ''}"><span>${l}</span><b data-fik="${i}">0</b><small>${esc(s)}</small></div>`).join('')}</div></div>
      ${m.buy.length ? `<div class="card gf-card"><div class="card-h"><h3>Fatturato ai piazzali</h3><span class="muted small">spunta quando hai fatturato al piazzale la sua parte di fattura</span></div>
        <div class="gf-sum"><span><b>${T.done.length}</b> di ${m.parts.length} fatturate</span>${T.todo.length ? `<span class="gf-todo">Da fatturare: <b>${pzTot(T.tTodo)}</b></span>` : '<span class="gf-ok">Tutto fatturato</span>'}</div>
        ${m.groups.map(g => pzBlock(g)).join('')}</div>` : ''}
      <div class="fi-2"><div class="card"><div class="card-h"><h3>Acquisti per piazzale</h3><span class="muted small">imponibile · pezzi · consegne</span></div>
          <div class="fi-bars">${m.groups.slice().sort((a, b) => b.tot - a.tot).map(g => `<div class="fi-br"><span class="fi-bn"><b>${esc(g.n)}</b><small>${X.fmtNum(g.q, 0)} pz · ${plur(g.nd, 'consegna', 'consegne')}</small></span><span class="fi-bt"><i style="width:${(g.tot / gx * 100).toFixed(1)}%"></i></span><b class="fi-bv">${pzTot(g.tot)}</b></div>`).join('') || '<div class="empty">Nessuna fattura</div>'}</div></div>
        <div class="card"><div class="card-h"><h3>Articoli acquistati</h3><span class="muted small">pezzi e importo</span></div>
          <div class="fi-bars">${m.arts.map(a => `<div class="fi-br"><span class="fi-bn"><b>${esc(a.desc)}</b><small>cod. ${esc(a.cod)} · ${X.fmtNum(a.q, 0)} pz · ${plur(a.n, 'fattura', 'fatture')}</small></span><span class="fi-bt"><i style="width:${(a.imp / ax * 100).toFixed(1)}%"></i></span><b class="fi-bv">${pzTot(a.imp)}</b></div>`).join('') || '<div class="empty">Nessun articolo</div>'}</div></div></div>
      <div class="fi-2"><div class="card"><div class="card-h"><h3>Ordini in attesa di fattura</h3><span class="muted small">${wait.length ? plur(wait.length, 'ordine', 'ordini') : 'nessuno'}</span></div>
          <div class="fi-ol">${wait.map(o => { const rc = m.rec[o.id]; return `<button type="button" class="fi-or fi-sm" data-fiopen="${esc(o.id)}"><span class="pv-qn"><b>${esc(o.num)}</b><small>${esc(X.shortDate(o.data))}</small></span><span class="pv-qc"><b>${esc(gname(o))}</b><small>${rc && rc.part ? 'parzialmente fatturato · ' : ''}${nextDel(o) ? (late(o) ? 'consegna prevista ' : 'consegna ') + esc(X.shortDate(nextDel(o))) : 'senza data di consegna'}</small></span>${late(o) ? '<span class="fi-cs"><span class="chip late">In ritardo</span></span>' : '<span></span>'}<b class="pv-qt">${money(o.imponibile)}</b></button>`; }).join('') || '<div class="empty">Tutti gli ordini caricati risultano fatturati</div>'}</div></div>
        <div class="card"><div class="card-h"><h3>Prossime scadenze</h3><span class="muted small">${m.scad.length ? 'da oggi in avanti · IVA inclusa' : 'nessuna'}</span></div>
          <div class="fi-ol">${m.scad.slice(0, 8).map(f => { const d = f.scad[0].d, days = Math.round((new Date(d) - new Date(X.today())) / 864e5); return `<button type="button" class="fi-or fi-sm" data-fiinv="${esc(f.id)}"><span class="pv-qn"><b>${esc(f.num)}</b><small>${esc(X.shortDate(f.data))}</small></span><span class="pv-qc"><b>scade il ${esc(X.shortDate(d))}</b><small>${esc([f.mp, f.cond].filter(Boolean).join(' · '))}</small></span><span class="fi-cs"><span class="chip ${days <= 7 ? 'soon' : ''}">${days === 0 ? 'oggi' : 'tra ' + days + ' gg'}</span></span><b class="pv-qt">${money(f.scad[0].imp || f.totale)}</b></button>`; }).join('') || '<div class="empty">Nessuna fattura da pagare</div>'}</div></div></div>
      <div class="card"><div class="card-h"><h3>Mese per mese</h3><span class="muted small">imponibile fatturato${m.spese ? ' · compreso trasporto ' + pzTot(m.spese) : ''}</span></div>
        <div class="fi-bars">${m.months.map(x => `<div class="fi-br"><span class="fi-bn"><b>${esc(monthLbl(x.k))}</b><small>${plur(x.n, 'fattura', 'fatture')}</small></span><span class="fi-bt"><i style="width:${(x.imp / mx * 100).toFixed(1)}%"></i></span><b class="fi-bv">${pzTot(x.imp)}</b></div>`).join('') || '<div class="empty">Nessuna fattura</div>'}</div></div>
      <div class="card"><div class="card-h"><h3>Controlli</h3><span class="muted small">${A.length ? plur(A.length, 'punto da verificare', 'punti da verificare') : 'i numeri di tutti i documenti tornano'}</span></div>
        ${A.length ? `<div class="gl-an">${A.slice(0, 8).map(({ o, f, c }, i) => `<div class="ga-row warn" style="--d:${i * 70}ms" ${f ? `data-fiinv="${esc(f.id)}"` : `data-fiopen="${esc(o.id)}"`}><span class="ci-ic"><svg viewBox="0 0 24 24"><path d="M12 3 2 20h20zM12 10v4M12 17h.01"/></svg></span><div class="ga-m"><b>${esc(c.h)}</b><span>${esc(c.d)}</span><small>${f ? 'fattura ' + esc(f.num) : 'ordine ' + esc(o.num) + ' · ' + esc(gname(o))}</small></div></div>`).join('')}</div>` : '<div class="empty">Tutto in ordine</div>'}</div>`;
  }
  // un piazzale: le sue parti di fattura, con la spunta verde «fatturato» (come in GLS)
  function pzBlock(g) {
    const todo = g.todo.slice().sort((a, b) => String(b.f.data).localeCompare(String(a.f.data))), done = g.done.slice().sort((a, b) => String(b.f.data).localeCompare(String(a.f.data))), can = X.canWrite();
    return `<div class="fi-pz"><div class="fi-ph"><b>${esc(g.n)}</b><span>${g.done.length} di ${g.P.length} fatturate · ${g.todo.length ? `<em class="fi-td">da fatturare ${pzTot(g.tTodo)}</em>` : '<em class="fi-ok">tutto fatturato</em>'} · ${pzTot(g.tot)}${can && g.todo.length ? ` · <button type="button" class="fi-all" data-fiall="${esc(g.k)}">segna tutte</button>` : ''}</span></div>
      ${todo.length ? `<div class="fi-grid">${todo.map((p, i) => ptick(p, i)).join('')}</div>` : ''}
      ${done.length ? `<details class="fi-dn"${todo.length ? '' : ' open'}><summary>Fatturate (${done.length})</summary><div class="fi-grid">${done.map((p, i) => ptick(p, i)).join('')}</div></details>` : ''}</div>`;
  }
  function ptick(p, i) {
    const on = p.done, can = X.canWrite();
    return `<label class="gf-m${on ? ' on' : ' due'}" style="--d:${Math.min(i, 12) * 30}ms"><input type="checkbox" data-fi="${esc(p.key)}"${on ? ' checked' : ''}${can ? '' : ' disabled'}><span class="gf-box"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7"/></svg></span><span class="gf-t"><b>Fattura ${esc(p.f.num)}</b><small>${on ? 'fatturato il ' + esc(X.shortDate(M.fa[p.key])) : `${esc(X.shortDate(p.f.data))} · ${money(p.imp)}`}</small></span></label>`;
  }

  /* ---------- elenco fatture ---------- */
  function invoices() {
    const FI = M.FI, q = fqf.toLowerCase().split(/\s+/).filter(Boolean), pgs = new Map();
    M.groups.forEach(g => pgs.set(g.k, g.n));
    const partsOf = f => M.parts.filter(p => p.f.id === f.id);
    const hay = f => `${f.num} ${f.righe.map(x => `${x.desc} ${x.cod} ${x.pz} ${x.ddt}`).join(' ')}`.toLowerCase();
    const R = FI.filter(f => (!q.length || q.every(w => hay(f).includes(w))) && (!fpzf || partsOf(f).some(p => p.g.k === fpzf)) && (!fsf || (fsf === 'dafatt' ? partsOf(f).some(p => !p.done) : fsf === 'fatt' ? partsOf(f).length && partsOf(f).every(p => p.done) : fsf === 'acc' ? f.tipo === 'TD02' : true)));
    const cnt = k => FI.filter(f => k === 'dafatt' ? partsOf(f).some(p => !p.done) : k === 'fatt' ? partsOf(f).length && partsOf(f).every(p => p.done) : f.tipo === 'TD02').length;
    return `<div class="card"><div class="card-h"><h3>Fatture Fischer</h3><span class="muted small">${plur(FI.length, 'fattura', 'fatture')}</span></div>
      ${FI.length ? `<div class="pv-sb tro-sb"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="fi-qf" type="search" placeholder="Cerca per numero, DDT, piazzale o articolo…" value="${esc(fqf)}" autocomplete="off"></div>
      <div class="fi-chips">${[['', 'Tutte', FI.length], ['dafatt', 'Da fatturare ai piazzali', cnt('dafatt')], ['fatt', 'Fatturate', cnt('fatt')], ['acc', 'Acconti', cnt('acc')]].filter(([k, , n]) => !k || n).map(([k, l, n]) => `<button type="button" class="chip-f${fsf === k ? ' on' : ''}" data-fisf="${k}">${l}<em>${n}</em></button>`).join('')}</div>
      ${pgs.size > 1 ? `<div class="fi-chips">${[['', 'Tutti i piazzali'], ...[...pgs.entries()].sort((a, b) => a[1].localeCompare(b[1], 'it'))].map(([k, l]) => `<button type="button" class="chip-f${fpzf === k ? ' on' : ''}" data-fipzf="${esc(k)}">${esc(l)}</button>`).join('')}</div>` : ''}
      <div class="fi-ol">${R.slice(0, limF).map(f => {
        const P = partsOf(f), nd = P.filter(p => !p.done).length, w = checksF(f).some(c => c.t === 'warn'), names = [...new Set(P.map(p => p.g.n))];
        return `<button type="button" class="fi-or" data-fiinv="${esc(f.id)}"><span class="pv-qn"><b>${esc(f.num)}</b><small>${esc(X.shortDate(f.data))}</small></span><span class="pv-qc"><b>${esc(f.tipo === 'TD02' ? 'Deposito a garanzia' : names.join(' · ') || '—')}</b><small>${plur(f.righe.length, 'riga', 'righe')}${f.scad && f.scad[0] ? ' · scade ' + esc(X.shortDate(f.scad[0].d)) : ''}</small></span><span class="fi-cs">${f.tipo === 'TD02' ? '<span class="chip">Acconto</span>' : !P.length ? '' : nd ? `<span class="chip soon">${nd === P.length ? 'Da fatturare' : `${nd} da fatturare`}</span>` : '<span class="chip paid">Fatturata</span>'}${w ? '<span class="chip late">Controlla</span>' : ''}</span><b class="pv-qt">${money(f.imponibile)}</b></button>`;
      }).join('') || '<div class="empty">Nessuna fattura trovata</div>'}${R.length > limF ? '<button type="button" class="btn sm" id="fi-morf" style="margin:12px auto 0;display:block">Mostra altre</button>' : ''}</div>`
      : '<div class="empty">Nessuna fattura: carica i PDF delle fatture Fischer (anche uno zip con tutte)</div>'}</div>`;
  }

  function invDetail(f, can) {
    const P = M.parts.filter(p => p.f.id === f.id), C = checksF(f), acc = f.tipo === 'TD02';
    const kv = [['Data fattura', X.shortDate(f.data)], ['Tipo', acc ? 'Acconto / anticipo (TD02)' : 'Fattura differita (TD24)'], ['Pagamento', [f.cond, f.mp].filter(Boolean).join(' · ')], ['Scadenza', f.scad && f.scad[0] ? X.shortDate(f.scad[0].d) : ''], ['N. cliente', f.cliente]].filter(([, v]) => v);
    const rows = []; let cur = null;
    f.righe.forEach(x => {
      const k = x.spese ? (cur ? cur.k : '') : `${x.ddt}|${x.pz}`;
      if (!cur || (!x.spese && cur.k !== k)) { cur = { k, ddt: x.ddt, dd: x.ddtData, pz: x.pz, dest: x.dest, ord: x.ord, L: [] }; rows.push(cur); }
      cur.L.push(x);
    });
    const bp = M.groups.find(g => g.P.some(p => p.f.id === f.id));
    return `<div class="pv-back"><button type="button" class="btn sm" id="fi-back">‹ Fatture</button>${acc ? '<span class="chip">Acconto</span>' : P.length ? (P.every(p => p.done) ? '<span class="chip paid">Fatturata ai piazzali</span>' : `<span class="chip soon">${P.filter(p => !p.done).length} da fatturare</span>`) : ''}<span class="pv-sp"></span>${f.pdf ? '<button type="button" class="btn sm" id="fi-pdf">Apri PDF</button>' : ''}${can ? '<button type="button" class="btn sm st-btn-d" id="fi-del">Elimina</button>' : ''}</div>
      <div class="card"><div class="card-h"><h3>Fattura ${esc(f.num)}</h3><span class="muted small">del ${esc(X.shortDate(f.data))}</span></div>
        <div class="fi-kv">${kv.map(([k, v]) => `<div><small>${k}</small><b>${esc(v)}</b></div>`).join('')}</div>
        ${P.length ? `<div class="fi-act fi-parts">${P.map((p, i) => `<div class="fi-fatt">${ptick(p, i)}<small class="fi-pn">${esc(p.g.n)}</small></div>`).join('')}</div>` : ''}</div>
      <div class="card"><div class="card-h"><h3>Righe</h3><span class="muted small">${plur(f.righe.length, 'riga', 'righe')} · divise per consegna (DDT)</span></div><div class="mx-wrap"><table class="mx"><thead><tr><th class="l">Codice</th><th class="l">Descrizione</th><th>Quantità</th><th>Prezzo unitario</th><th>Importo</th></tr></thead><tbody>
        ${rows.map(g => `<tr class="fi-ddt"><td colspan="5"><b>${g.ddt ? 'DDT ' + esc(g.ddt) + (g.dd ? ' del ' + esc(X.shortDate(g.dd)) : '') : 'Documento'}</b>${g.pz ? ` <span>→ <b>${esc(gOf(g.pz).n)}</b> · ${esc([g.dest && g.dest.rs, g.dest && g.dest.via, g.dest && g.dest.citta, g.dest && g.dest.prov].filter(Boolean).join(', '))}</span>` : ''}${g.ord ? ` <small>ord. ${esc(g.ord)}</small>` : ''}</td></tr>${g.L.map(x => `<tr><td class="l m2">${esc(x.cod)}</td><td class="l">${esc(x.desc)}${x.ean ? `<small class="fi-ean">EAN ${esc(x.ean)}</small>` : ''}</td><td>${x.spese ? '' : X.fmtNum(x.q, 0) + (x.um ? ' ' + esc(x.um) : '')}</td><td>${x.spese ? '' : esc(pu(x.prezzo))}</td><td><b>${money(x.importo)}</b></td></tr>`).join('')}`).join('')}</tbody></table></div>
        <div class="fi-tot"><div><span>Imponibile</span><b>${money(f.imponibile)}</b></div><div><span>IVA${f.ivaPct ? ' ' + X.fmtNum(f.ivaPct, 0) + '%' : f.ivaNat ? ' (' + esc(f.ivaNat) + ')' : ''}</span><b>${money(f.iva)}</b></div><div class="fi-tt"><span>Totale documento</span><b>${money(f.totale)}</b></div></div></div>
      <div class="card"><div class="card-h"><h3>Controlli</h3><span class="muted small">${C.some(c => c.t === 'warn') ? 'da verificare' : 'i numeri tornano'}</span></div>
        ${C.length ? `<div class="gl-an">${C.map((c, i) => `<div class="ga-row ${c.t}" style="--d:${i * 60}ms"><span class="ci-ic"><svg viewBox="0 0 24 24"><path d="M12 3 2 20h20zM12 10v4M12 17h.01"/></svg></span><div class="ga-m"><b>${esc(c.h)}</b><span>${esc(c.d)}</span></div></div>`).join('')}</div>` : '<div class="empty">Quantità, prezzi, imponibile e totale sono coerenti</div>'}</div>`;
  }

  /* ---------- ordini (conferme d'ordine) ---------- */
  function orders() {
    const O = M.O, q = fq.toLowerCase().split(/\s+/).filter(Boolean);
    const pzs = [...new Map(O.map(o => [gkey(o), gname(o)])).entries()].sort((a, b) => a[1].localeCompare(b[1], 'it'));
    const hay = o => `${o.num} ${gname(o)} ${o.dest && o.dest.citta || ''} ${o.righe.map(x => x.desc + ' ' + x.cod).join(' ')}`.toLowerCase();
    const is = (o, k) => k === 'attesa' ? o.stato !== 'annullato' && !evaso(o) : k === 'evaso' ? evaso(o) : o.stato === k;
    const R = O.filter(o => (!q.length || q.every(w => hay(o).includes(w))) && (!fpz || gkey(o) === fpz) && (!fst || is(o, fst)));
    const cnt = k => O.filter(o => is(o, k)).length;
    return `<div class="card"><div class="card-h"><h3>Ordini Fischer</h3><span class="muted small">${plur(O.length, 'ordine', 'ordini')}</span></div>
      ${O.length ? `<div class="pv-sb tro-sb"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="fi-q" type="search" placeholder="Cerca per numero, piazzale o articolo…" value="${esc(fq)}" autocomplete="off"></div>
      <div class="fi-chips">${[['', 'Tutti', O.length], ['attesa', 'In attesa di fattura', cnt('attesa')], ['evaso', 'Fatturati da Fischer', cnt('evaso')], ['confermato', 'Confermati', cnt('confermato')], ['spedito', 'In consegna', cnt('spedito')], ['consegnato', 'Consegnati', cnt('consegnato')], ['annullato', 'Annullati', cnt('annullato')]].filter(([k, , n]) => !k || n).map(([k, l, n]) => `<button type="button" class="chip-f${fst === k ? ' on' : ''}" data-fist="${k}">${l}<em>${n}</em></button>`).join('')}</div>
      ${pzs.length > 1 ? `<div class="fi-chips">${[['', 'Tutti i piazzali'], ...pzs].map(([k, l]) => `<button type="button" class="chip-f${fpz === k ? ' on' : ''}" data-fipz="${esc(k)}">${esc(l)}</button>`).join('')}</div>` : ''}
      <div class="fi-ol">${R.slice(0, lim).map(o => { const st = ST[o.stato] || ST.confermato, rc = M.rec[o.id], w = checks(o).some(c => c.t === 'warn'); return `<button type="button" class="fi-or" data-fiopen="${esc(o.id)}"><span class="pv-qn"><b>${esc(o.num)}</b><small>${esc(X.shortDate(o.data))}</small></span><span class="pv-qc"><b>${esc(gname(o))}</b><small>${plur(o.righe.length, 'riga', 'righe')}${nextDel(o) && o.stato !== 'consegnato' && !evaso(o) ? ' · consegna ' + esc(X.shortDate(nextDel(o))) : ''}</small></span><span class="fi-cs"><span class="chip ${late(o) ? 'late' : st[1]}">${late(o) ? 'In ritardo' : st[0]}</span>${evaso(o) ? '<span class="chip paid">Fatturato</span>' : rc && rc.part ? '<span class="chip soon">Parziale</span>' : ''}${w ? '<span class="chip late">Controlla</span>' : ''}</span><b class="pv-qt">${money(o.imponibile)}</b></button>`; }).join('') || '<div class="empty">Nessun ordine trovato</div>'}${R.length > lim ? `<button type="button" class="btn sm" id="fi-more" style="margin:12px auto 0;display:block">Mostra altri</button>` : ''}</div>`
      : '<div class="empty">Nessun ordine: carica la prima conferma d\'ordine</div>'}</div>`;
  }

  function detail(o, can) {
    const st = ST[o.stato] || ST.confermato, rc = M.rec[o.id] || { fatt: [], ids: [] }, C = checks(o), cd = X.cdcs();
    const kv = [['Piazzale', gname(o)], ['Destinatario', o.dest.rs], ['Indirizzo', [o.dest.via, [o.dest.cap, o.dest.citta, o.dest.prov].filter(Boolean).join(' ')].filter(Boolean).join(' · ')], ['Pagamento', o.pagamento], ['Corriere', o.corriere], ['Porto / resa', o.porto], ['Peso', o.peso ? X.fmtNum(o.peso, 3) + ' kg' : ''], ['Magazzino Fischer', o.magForn], ['N. cliente', o.cliente]].filter(([, v]) => v);
    return `<div class="pv-back"><button type="button" class="btn sm" id="fi-back">‹ Ordini</button><span class="chip ${late(o) ? 'late' : st[1]}">${late(o) ? 'In ritardo' : st[0]}</span>${evaso(o) ? '<span class="chip paid">Fatturato da Fischer</span>' : rc.part ? '<span class="chip soon">Parzialmente fatturato</span>' : ''}<span class="pv-sp"></span>${o.pdf ? '<button type="button" class="btn sm" id="fi-pdf">Apri PDF</button>' : ''}${can ? '<button type="button" class="btn sm st-btn-d" id="fi-del">Elimina</button>' : ''}</div>
      <div class="card"><div class="card-h"><h3>Ordine ${esc(o.num)}</h3><span class="muted small">del ${esc(X.shortDate(o.data))}</span></div>
        <div class="fi-kv">${kv.map(([k, v]) => `<div><small>${k}</small><b>${esc(v)}</b></div>`).join('')}</div>
        <div class="fi-act">${rc.fatt.length ? `<div class="fi-sel"><small>${evaso(o) ? 'Fatture collegate' : 'Fatture parziali'}</small><div class="fi-links">${rc.ids.map((id, i) => `<button type="button" class="chip-f" data-fiinv="${esc(id)}">${esc(rc.fatt[i])}</button>`).join('')}</div></div>` : '<div class="fi-sel"><small>Fattura Fischer</small><b class="fi-na">non ancora fatturato</b></div>'}
          ${can ? `<label class="fi-sel"><small>Piazzale collegato</small><select id="fi-cdc"><option value="">— da collegare —</option>${cd.map(c => `<option value="${esc(c.cod)}"${o.cdc === c.cod ? ' selected' : ''}>${esc(c.n)}</option>`).join('')}</select></label>
          <div class="fi-sel"><small>Stato della consegna</small><div class="tr-seg">${ST_K.map(k => `<button type="button" data-fistato="${k}" class="${o.stato === k ? 'on' : ''}">${ST[k][0]}</button>`).join('')}</div></div>` : ''}</div></div>
      <div class="card"><div class="card-h"><h3>Articoli</h3><span class="muted small">${plur(o.righe.length, 'riga', 'righe')}</span></div><div class="mx-wrap"><table class="mx"><thead><tr><th class="l">Codice</th><th class="l">Descrizione</th><th>Quantità</th><th>Prezzo ogni ${o.righe[0] ? X.fmtNum(o.righe[0].per, 0) : 100}</th><th>Importo</th><th>Consegna prevista</th></tr></thead><tbody>
        ${o.righe.map(x => `<tr><td class="l m2">${esc(x.cod)}</td><td class="l">${esc(x.desc)}${x.ean ? `<small class="fi-ean">EAN ${esc(x.ean)}</small>` : ''}</td><td>${X.fmtNum(x.q, 0)} ${esc(x.um)}</td><td>${money(x.prezzo)}</td><td><b>${money(x.importo)}</b></td><td>${x.consegna ? esc(X.shortDate(x.consegna)) : '—'}</td></tr>`).join('')}</tbody></table></div>
        <div class="fi-tot"><div><span>Importo righe</span><b>${money(o.importoRighe)}</b></div>${o.scontoImp ? `<div><span>Sconto di testata ${X.fmtNum(o.scontoPct, 2)}%</span><b>− ${money(o.scontoImp)}</b></div>` : ''}${o.spese ? `<div><span>Spese di spedizione</span><b>${money(o.spese)}</b></div>` : ''}<div><span>Imponibile</span><b>${money(o.imponibile)}</b></div><div><span>IVA ${X.fmtNum(o.ivaPct, 0)}%</span><b>${money(o.iva)}</b></div><div class="fi-tt"><span>Totale ordine</span><b>${money(o.totale)}</b></div></div></div>
      <div class="card"><div class="card-h"><h3>Controlli</h3><span class="muted small">${C.some(c => c.t === 'warn') ? 'da verificare' : 'i numeri tornano'}</span></div>
        ${C.length ? `<div class="gl-an">${C.map((c, i) => `<div class="ga-row ${c.t}" style="--d:${i * 60}ms"><span class="ci-ic"><svg viewBox="0 0 24 24">${c.t === 'warn' ? '<path d="M12 3 2 20h20zM12 10v4M12 17h.01"/>' : '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'}</svg></span><div class="ga-m"><b>${esc(c.h)}</b><span>${esc(c.d)}</span></div></div>`).join('')}</div>` : '<div class="empty">Quantità, prezzi, sconto, IVA e totale sono coerenti</div>'}</div>
      <div class="card"><div class="card-h"><h3>Movimentazioni</h3><span class="muted small">storico dell'ordine</span></div>
        <div class="fi-mv">${(o.mov || []).slice().reverse().map(v => `<div class="fi-mi"><i></i><span><b>${esc(v.n || (ST[v.st] || ST.confermato)[0])}</b><small>${esc(X.shortDate(v.d))}${v.st && v.n ? ' · ' + esc((ST[v.st] || [''])[0]) : ''}</small></span></div>`).join('') || '<div class="empty">Nessuna movimentazione</div>'}</div>
        ${can ? '<div class="fi-note"><input id="fi-note" type="text" placeholder="Aggiungi una nota (es. consegna parziale, DDT n. …)" autocomplete="off"><button type="button" class="btn sm" id="fi-note-add">Aggiungi</button></div>' : ''}</div>`;
  }

  /* ---------- zip (lettura locale, senza librerie) ---------- */
  async function unzip(file) {
    const buf = await file.arrayBuffer(), dv = new DataView(buf), u8 = new Uint8Array(buf), out = [];
    let e = -1; for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 70000); i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
    if (e < 0) throw new Error('zip non valido');
    let n = dv.getUint16(e + 10, true), p = dv.getUint32(e + 16, true);
    for (; n > 0 && dv.getUint32(p, true) === 0x02014b50; n--) {
      const meth = dv.getUint16(p + 10, true), csz = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
      const name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nl)); p += 46 + nl + xl + cl;
      if (!/\.pdf$/i.test(name) || /(^|\/)(__MACOSX|\.)/.test(name)) continue;
      const ds = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true), raw = u8.subarray(ds, ds + csz);
      let data;
      if (meth === 0) data = raw; else if (meth === 8 && window.DecompressionStream) data = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()); else throw new Error('compressione dello zip non supportata: estrai i PDF e caricali');
      out.push(new File([data], name.split('/').pop(), { type: 'application/pdf' }));
    }
    return out;
  }

  /* ---------- azioni ---------- */
  const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768)); return btoa(s); };
  async function load(files) {
    let ops = [], nO = 0, nF = 0, nUp = 0, nopdf = 0, warn = 0, last = null; const bad = [];
    const flush = () => { if (ops.length) { X.write(ops); ops = []; } };
    try {
      X.busy('Preparo i file…');
      const docs = []; for (const f of files) { if (/\.zip$/i.test(f.name) || f.type === 'application/zip') { try { docs.push(...await unzip(f)); } catch (e) { bad.push(`${f.name}: ${e.message}`); } } else docs.push(f); }
      let i = 0;
      for (const f of docs) {
        i++;
        try {
          X.busy(`Leggo ${i} di ${docs.length}…`);
          const u8 = new Uint8Array(await f.arrayBuffer()), items = await extract(u8), txt = lines(items).map(l => l.t).join('\n');
          if (isInvoice(txt)) {
            const p = parseInv(items), ex = X.cfg('fif:' + p.id), f2 = { ...p, nomeFile: f.name, pdf: ex ? ex.pdf || '' : '', creato: ex ? ex.creato : new Date().toISOString() };
            if (!X.isLocal() && !f2.pdf) {
              X.busy(`Salvo il PDF ${i} di ${docs.length} nel tuo Drive…`); nUp++;
              try { f2.pdf = await X.api('uploadDoc', { name: `Fischer fattura ${f2.num} ${f2.data}.pdf`, mime: 'application/pdf', data: b64(u8) }); }
              catch (e) { if (X.isAuth && X.isAuth(e)) throw e; nopdf++; }
            }
            ops.push(opSaveF(f2)); nF++; last = { inv: f2.id }; if (checksF(f2).some(c => c.t === 'warn')) warn++;
          } else {
            const p = parse(items), ex = X.cfg('fi:' + p.id);
            const o = { ...p, nomeFile: f.name, stato: ex ? ex.stato : 'confermato', mov: ex ? (ex.mov || []) : [{ d: X.today(), st: 'confermato', n: 'Conferma d\'ordine caricata' }], cdc: ex && ex.cdc ? ex.cdc : (X.guess(p.pz) || ''), pdf: ex ? ex.pdf || '' : '', creato: ex ? ex.creato : new Date().toISOString() };
            if (ex) o.mov = [...o.mov, { d: X.today(), st: o.stato, n: 'Conferma ricaricata e aggiornata' }];
            if (!X.isLocal() && !o.pdf) {
              X.busy(`Salvo il PDF ${i} di ${docs.length} nel tuo Drive…`); nUp++;
              try { o.pdf = await X.api('uploadDoc', { name: `Fischer ordine ${o.num} ${o.data}.pdf`, mime: 'application/pdf', data: b64(u8) }); }
              catch (e) { if (X.isAuth && X.isAuth(e)) throw e; nopdf++; }
            }
            ops.push(opSave(o)); nO++; last = { ord: o.id }; if (checks(o).some(c => c.t === 'warn')) warn++;
          }
          if (ops.length >= 8) flush(); // si salva a blocchi: se la connessione cade, quanto già letto resta
        } catch (e) { if (X.isAuth && X.isAuth(e)) throw e; bad.push(`${f.name}: ${e.message}`); }
      }
    } finally { X.busy(); }
    if (ops.length || nF || nO) {
      anim = true;
      if (nF + nO === 1 && last) { if (last.inv) { openInv = last.inv; openId = ''; tab = 'fat'; } else { openId = last.ord; openInv = ''; tab = 'ord'; } } else { openId = ''; openInv = ''; tab = nF >= nO ? 'pan' : 'ord'; }
      flush();
    }
    const parts = [nF ? plur(nF, 'fattura caricata', 'fatture caricate') : '', nO ? plur(nO, 'ordine caricato', 'ordini caricati') : ''].filter(Boolean).join(' · ');
    X.toast(parts ? `${parts}${warn ? ` · ${warn} da controllare` : ''}${nopdf ? ` · PDF non archiviato su Drive (${nopdf})` : ''}${bad.length ? ` · ${bad.length} non letti` : ''}` : `Non letto: ${bad[0] || 'file non valido'}`);
    if (bad.length && parts) setTimeout(() => X.toast('Non letti: ' + bad.slice(0, 3).join(' | ')), 2800);
  }
  function setStato(o, st) {
    if (o.stato === st) return;
    o.stato = st; o.mov = [...(o.mov || []), { d: X.today(), st, n: st === 'consegnato' ? 'Merce consegnata' : st === 'spedito' ? 'Merce in consegna' : st === 'annullato' ? 'Ordine annullato' : 'Riportato a confermato' }];
    X.write([opSave(o)]);
  }
  function wire(el) {
    el.addEventListener('click', e => {
      const t = e.target, b = s => t.closest(s);
      let x;
      if (b('#fi-up') || b('#fi-up2')) return el.querySelector('#fi-file').click();
      if ((x = b('[data-fitab]'))) { tab = x.dataset.fitab; openId = ''; openInv = ''; anim = true; return draw(el); }
      if ((x = b('[data-fiopen]'))) { openId = x.dataset.fiopen; openInv = ''; tab = 'ord'; anim = true; return draw(el); }
      if ((x = b('[data-fiinv]'))) { openInv = x.dataset.fiinv; openId = ''; tab = 'fat'; anim = true; return draw(el); }
      if (b('#fi-back')) { openId = ''; openInv = ''; anim = true; return draw(el); }
      if ((x = b('[data-fist]'))) { fst = x.dataset.fist; lim = 40; return draw(el); }
      if ((x = b('[data-fipz]'))) { fpz = x.dataset.fipz; lim = 40; return draw(el); }
      if ((x = b('[data-fisf]'))) { fsf = x.dataset.fisf; limF = 40; return draw(el); }
      if ((x = b('[data-fipzf]'))) { fpzf = x.dataset.fipzf; limF = 40; return draw(el); }
      if (b('#fi-more')) { lim += 60; return draw(el); }
      if (b('#fi-morf')) { limF += 60; return draw(el); }
      if ((x = b('[data-fiall]'))) {
        const g = M.groups.find(g => g.k === x.dataset.fiall); if (!g || !g.todo.length) return;
        if (confirm(`Segnare come fatturate le ${g.todo.length} fatture da fatturare di «${g.n}» (${pzTot(g.tTodo)})?`)) { const fa = { ...FA() }; g.todo.forEach(p => { fa[p.key] = X.today(); }); X.quiet([opFatt(fa)]); draw(el); }
        return;
      }
      if (b('#fi-pdf')) { const o = openInv ? getF(openInv) : get(openId); return o && o.pdf && X.openDoc(o.pdf, openInv ? `Fischer fattura ${o.num}` : `Fischer ordine ${o.num}`); }
      if (b('#fi-del')) {
        if (openInv) { const f = getF(openInv); if (f && confirm(`Eliminare la fattura ${f.num}?`)) { const fa = { ...FA() }; Object.keys(fa).forEach(k => { if (k.startsWith(f.id + '|')) delete fa[k]; }); X.write([{ action: 'delete', sheet: 'Config', id: 'fif:' + f.id }, opFatt(fa)]); openInv = ''; X.toast('Fattura eliminata'); } return; }
        const o = get(openId); if (o && confirm(`Eliminare l'ordine ${o.num}?`)) { X.write([{ action: 'delete', sheet: 'Config', id: 'fi:' + o.id }]); openId = ''; X.toast('Ordine eliminato'); } return;
      }
      if ((x = b('[data-fistato]'))) { const o = get(openId); if (o) setStato(o, x.dataset.fistato); return; }
      if (b('#fi-note-add')) { const i = el.querySelector('#fi-note'), v = i && i.value.trim(), o = get(openId); if (o && v) { o.mov = [...(o.mov || []), { d: X.today(), st: '', n: v }]; X.write([opSave(o)]); } return; }
    });
    el.addEventListener('change', e => {
      const t = e.target;
      if (t.id === 'fi-file') { const fs = [...t.files]; t.value = ''; if (fs.length) load(fs).catch(err => { X.busy(); X.toast('Errore: ' + (err && err.message || err)); }); return; }
      if (t.dataset && t.dataset.fi) {
        const o = { ...FA() }; if (t.checked) o[t.dataset.fi] = X.today(); else delete o[t.dataset.fi];
        X.quiet([opFatt(o)]); draw(el); return;
      }
      if (t.id === 'fi-cdc') {
        const o = get(openId); if (!o) return; const pz = pzKey(o.pz), ops = [];
        list().forEach(x => { if (x.id === o.id || (!x.cdc && pzKey(x.pz) === pz)) { const y = get(x.id); y.cdc = t.value; ops.push(opSave(y)); } });
        X.write(ops); if (ops.length > 1) X.toast(`Piazzale collegato su ${ops.length} ordini`);
      }
    });
    el.addEventListener('input', e => {
      const id = e.target.id; if (id !== 'fi-q' && id !== 'fi-qf') return;
      if (id === 'fi-q') { fq = e.target.value; lim = 40; } else { fqf = e.target.value; limF = 40; }
      const pos = e.target.selectionStart; draw(el); const i = el.querySelector('#' + id); if (i) { i.focus(); try { i.setSelectionRange(pos, pos); } catch { } }
    });
  }

  window.CDC_FI = { init: c => { X = c; }, render, parse, parseInv, checksF, extract, checks, lines, isInvoice, unzip };
})();
