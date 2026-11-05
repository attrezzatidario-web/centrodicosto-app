/* Fischer — ordini al fornitore Fischer (solo gestionale principale, settore veicoli).
   Si caricano le conferme d'ordine in PDF: vengono lette, controllate (righe, sconto, IVA, totale) e assegnate
   al piazzale di destinazione. Ogni ordine ha le sue movimentazioni e una spunta verde «fatturato» (come in GLS).
   Dati: Config «fi:<id>» = un ordine; Config «fiFatt» = { idOrdine: 'AAAA-MM-GG' }.
   Uso: window.CDC_FI.render(el, ctx) — caricato da app.js quando si apre la sezione. */
(() => {
  'use strict';
  const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  const ST = { confermato: ['Confermato', ''], spedito: ['In consegna', 'soon'], consegnato: ['Consegnato', 'paid'], annullato: ['Annullato', 'late'] };
  const ST_K = Object.keys(ST);
  let X = null, tab = 'pan', openId = '', fq = '', fpz = '', fst = '', anim = true, lim = 40;

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
    if (/anticip/i.test(o.pagamento || '') && !F()[o.id]) A.push({ t: 'info', h: 'Pagamento anticipato', d: 'Da pagare prima della spedizione.' });
    return A;
  }
  const num2 = n => X.fmtNum(n, 2);

  /* ---------- dati ---------- */
  const list = () => Object.keys(X.db().config || {}).filter(k => k.startsWith('fi:')).map(k => X.cfg(k)).filter(o => o && o.id).sort((a, b) => String(b.data).localeCompare(String(a.data)) || String(b.num).localeCompare(String(a.num)));
  const F = () => { const c = X.cfg('fiFatt'); return c && typeof c === 'object' && !Array.isArray(c) ? c : {}; };
  const get = id => { const o = X.cfg('fi:' + id); return o ? JSON.parse(JSON.stringify(o)) : null; };
  const opSave = o => ({ action: 'upsert', sheet: 'Config', row: { chiave: 'fi:' + o.id, valore: JSON.stringify(o) } });
  const gkey = o => o.cdc ? 'c:' + o.cdc : 'n:' + String(o.pz || '').toUpperCase();
  const gname = o => o.cdc ? X.cdcName(o.cdc) : o.pz;
  const money = n => X.eur(n);
  const pzTot = n => X.eur0(n);
  const nextDel = o => (o.righe || []).map(x => x.consegna).filter(Boolean).sort()[0] || '';
  const late = o => o.stato !== 'consegnato' && o.stato !== 'annullato' && nextDel(o) && nextDel(o) < X.today();

  function model() {
    const O = list(), fa = F(), act = O.filter(o => o.stato !== 'annullato'), G = new Map();
    act.forEach(o => { const k = gkey(o); if (!G.has(k)) G.set(k, { k, n: gname(o), O: [] }); G.get(k).O.push(o); });
    const groups = [...G.values()].map(g => {
      const done = g.O.filter(o => fa[o.id]), todo = g.O.filter(o => !fa[o.id]);
      return { ...g, done, todo, tot: sum(g.O), tTodo: sum(todo) };
    }).sort((a, b) => b.tTodo - a.tTodo || b.tot - a.tot || a.n.localeCompare(b.n, 'it'));
    const arts = new Map();
    act.forEach(o => o.righe.forEach(x => { const a = arts.get(x.cod) || { cod: x.cod, desc: x.desc, q: 0, imp: 0, n: 0 }; a.q += x.q; a.imp += x.importo; a.n++; arts.set(x.cod, a); }));
    const mm = new Map();
    act.forEach(o => { const k = String(o.data || '').slice(0, 7); if (k) { const a = mm.get(k) || { k, imp: 0, n: 0 }; a.imp += o.imponibile; a.n++; mm.set(k, a); } });
    return { O, act, groups, fa, arts: [...arts.values()].sort((a, b) => b.imp - a.imp), months: [...mm.values()].sort((a, b) => a.k.localeCompare(b.k)).slice(-12) };
  }
  const sum = L => r2(L.reduce((s, o) => s + o.imponibile, 0));

  /* ---------- pagina ---------- */
  function render(el, ctx) {
    X = ctx; el._fi = true;
    if (!el._wired) { wire(el); el._wired = true; }
    draw(el);
  }
  const monthLbl = k => { const [y, m] = k.split('-'); return `${MESI[+m - 1].slice(0, 3)} ${y}`; };
  function draw(el) {
    X.sub('ordini al fornitore Fischer · IVA esclusa, salvo dove indicato');
    const can = X.canWrite(), body = openId && get(openId) ? detail(get(openId), can) : tab === 'ord' ? orders() : overview();
    if (openId && !get(openId)) openId = '';
    el.innerHTML = `<div class="gl-bar"><div class="tr-seg tr-tabs" role="tablist"><button type="button" data-fitab="pan" class="${!openId && tab === 'pan' ? 'on' : ''}">Panoramica</button><button type="button" data-fitab="ord" class="${openId || tab === 'ord' ? 'on' : ''}">Ordini</button></div>
      <div class="gl-act">${can ? '<button type="button" class="btn sm primary" id="fi-up"><span class="lb-d">+ Carica conferma d\'ordine</span><span class="lb-m">+ Conferma</span></button>' : ''}</div></div>
      <input type="file" id="fi-file" accept="application/pdf,.pdf" multiple hidden>
      <div class="fi-body${anim && !X.reduced() ? ' cc-anim' : ''}">${body}</div>`;
    anim = false;
    counters(el);
  }
  function counters(el) {
    const m = model(); if (openId || tab !== 'pan' || !m.act.length) return;
    const tot = sum(m.act), todo = m.act.filter(o => !m.fa[o.id]), done = m.act.filter(o => m.fa[o.id]);
    const vals = [tot, sum(todo), sum(done), m.act.reduce((s, o) => s + o.righe.reduce((a, x) => a + x.q, 0), 0)];
    el.querySelectorAll('[data-fik]').forEach(b => X.countTo(b, vals[+b.dataset.fik], +b.dataset.fik === 3 ? v => X.fmtNum(Math.round(v), 0) : X.eur0));
  }

  function overview() {
    const m = model();
    if (!m.O.length) return `<div class="card fi-empty"><div class="pv-empty"><div class="pv-ei"><svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/></svg></div><h3>Nessun ordine Fischer</h3><p>Carica la conferma d'ordine in PDF: viene letta, controllata e assegnata al piazzale di destinazione. Puoi caricarne più d'una insieme.</p>${X.canWrite() ? '<button type="button" class="btn primary" id="fi-up2">+ Carica conferma d\'ordine</button>' : ''}</div></div>`;
    const act = m.act, todo = act.filter(o => !m.fa[o.id]), done = act.filter(o => m.fa[o.id]);
    const arr = act.filter(o => o.stato !== 'consegnato'), lt = arr.filter(late), nd = arr.map(nextDel).filter(Boolean).sort()[0];
    const pezzi = act.reduce((s, o) => s + o.righe.reduce((a, x) => a + x.q, 0), 0), last = act.map(o => o.data).sort().pop();
    const KP = [
      ['Da fatturare', sum(todo), `${todo.length} ${todo.length === 1 ? 'ordine' : 'ordini'}`, 1],
      ['Fatturato', sum(done), `${done.length} ${done.length === 1 ? 'ordine' : 'ordini'}`, 2],
      ['In arrivo', null, arr.length ? `${arr.length} ${arr.length === 1 ? 'ordine' : 'ordini'}${lt.length ? ` · ${lt.length} in ritardo` : nd ? ' · prossima ' + X.shortDate(nd) : ''}` : 'tutto consegnato', 'n'],
      ['Pezzi ordinati', pezzi, `${m.arts.length} articoli`, 3]
    ];
    const A = []; m.act.forEach(o => checks(o).filter(c => c.t === 'warn').forEach(c => A.push({ o, c })));
    const mx = Math.max(1, ...m.months.map(x => x.imp)), ax = Math.max(1, ...m.arts.map(x => x.imp));
    return `<div class="gl-hero fi-hero"><div class="gh-top"><div class="gh-main"><span class="gh-lbl">Ordini Fischer · imponibile ordinato</span><div class="gh-big" data-fik="0">0</div>
        <div class="gh-sub"><span>${act.length} ${act.length === 1 ? 'ordine' : 'ordini'}</span><span>${m.groups.length} ${m.groups.length === 1 ? 'piazzale' : 'piazzali'}</span>${last ? `<span>ultimo il ${esc(X.shortDate(last))}</span>` : ''}</div></div></div>
      <div class="gh-kpis">${KP.map(([l, v, s, i]) => `<div class="gh-k${i === 1 && todo.length ? ' ly-kwarn' : ''}"><span>${l}</span><b${typeof i === 'number' ? ` data-fik="${i}"` : ''}>${v == null ? (arr.length || '—') : '0'}</b><small>${esc(s)}</small></div>`).join('')}</div></div>
      <div class="card gf-card"><div class="card-h"><h3>Fatturato per piazzale</h3><span class="muted small">spunta quando l'ordine è stato fatturato</span></div>
        <div class="gf-sum"><span><b>${done.length}</b> di ${act.length} ordini fatturati</span>${todo.length ? `<span class="gf-todo">Da fatturare: <b>${pzTot(sum(todo))}</b></span>` : '<span class="gf-ok">Tutto fatturato</span>'}</div>
        ${m.groups.map(g => `<div class="fi-pz"><div class="fi-ph"><b>${esc(g.n)}</b><span>${g.done.length} di ${g.O.length} fatturati · ${g.todo.length ? `<em class="fi-td">da fatturare ${pzTot(g.tTodo)}</em>` : '<em class="fi-ok">tutto fatturato</em>'} · ${pzTot(g.tot)}</span></div>
          <div class="fi-grid">${g.O.map((o, i) => tick(o, m.fa, i)).join('')}</div></div>`).join('')}</div>
      <div class="fi-2"><div class="card"><div class="card-h"><h3>Articoli ordinati</h3><span class="muted small">pezzi e importo</span></div>
          <div class="fi-bars">${m.arts.map(a => `<div class="fi-br"><span class="fi-bn"><b>${esc(a.desc)}</b><small>cod. ${esc(a.cod)} · ${X.fmtNum(a.q, 0)} pz · ${a.n} ${a.n === 1 ? 'ordine' : 'ordini'}</small></span><span class="fi-bt"><i style="width:${(a.imp / ax * 100).toFixed(1)}%"></i></span><b class="fi-bv">${pzTot(a.imp)}</b></div>`).join('')}</div></div>
        <div class="card"><div class="card-h"><h3>Mese per mese</h3><span class="muted small">imponibile ordinato</span></div>
          <div class="fi-bars">${m.months.map(x => `<div class="fi-br"><span class="fi-bn"><b>${esc(monthLbl(x.k))}</b><small>${x.n} ${x.n === 1 ? 'ordine' : 'ordini'}</small></span><span class="fi-bt"><i style="width:${(x.imp / mx * 100).toFixed(1)}%"></i></span><b class="fi-bv">${pzTot(x.imp)}</b></div>`).join('')}</div></div></div>
      <div class="card"><div class="card-h"><h3>Controlli</h3><span class="muted small">${A.length ? `${A.length} ${A.length === 1 ? 'punto' : 'punti'} da verificare` : 'i numeri di tutti gli ordini tornano'}</span></div>
        ${A.length ? `<div class="gl-an">${A.slice(0, 8).map(({ o, c }, i) => `<div class="ga-row warn" style="--d:${i * 70}ms" data-fiopen="${esc(o.id)}"><span class="ci-ic"><svg viewBox="0 0 24 24"><path d="M12 3 2 20h20zM12 10v4M12 17h.01"/></svg></span><div class="ga-m"><b>${esc(c.h)}</b><span>${esc(c.d)}</span><small>ordine ${esc(o.num)} · ${esc(gname(o))}</small></div></div>`).join('')}</div>` : '<div class="empty">Tutto in ordine</div>'}</div>`;
  }
  const esc = s => X.esc(s);
  function tick(o, fa, i) {
    const on = !!fa[o.id], can = X.canWrite();
    return `<label class="gf-m${on ? ' on' : ' due'}" style="--d:${(i || 0) * 30}ms"><input type="checkbox" data-fi="${esc(o.id)}"${on ? ' checked' : ''}${can ? '' : ' disabled'}><span class="gf-box"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7"/></svg></span><span class="gf-t"><b>Ordine ${esc(o.num)}</b><small>${on ? 'fatturato il ' + esc(X.shortDate(fa[o.id])) : `${esc(X.shortDate(o.data))} · ${money(o.imponibile)}`}</small></span></label>`;
  }

  function orders() {
    const O = list(), fa = F(), q = fq.toLowerCase().split(/\s+/).filter(Boolean);
    const pzs = [...new Map(O.map(o => [gkey(o), gname(o)])).entries()].sort((a, b) => a[1].localeCompare(b[1], 'it'));
    const hay = o => `${o.num} ${gname(o)} ${o.dest && o.dest.citta || ''} ${o.righe.map(x => x.desc + ' ' + x.cod).join(' ')}`.toLowerCase();
    const R = O.filter(o => (!q.length || q.every(w => hay(o).includes(w))) && (!fpz || gkey(o) === fpz) && (!fst || (fst === 'dafatt' ? o.stato !== 'annullato' && !fa[o.id] : fst === 'fatt' ? !!fa[o.id] : o.stato === fst)));
    const cnt = k => O.filter(o => k === 'dafatt' ? o.stato !== 'annullato' && !fa[o.id] : k === 'fatt' ? !!fa[o.id] : o.stato === k).length;
    return `<div class="card"><div class="card-h"><h3>Ordini Fischer</h3><span class="muted small">${O.length} ${O.length === 1 ? 'ordine' : 'ordini'}</span></div>
      ${O.length ? `<div class="pv-sb tro-sb"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="fi-q" type="search" placeholder="Cerca per numero, piazzale o articolo…" value="${esc(fq)}" autocomplete="off"></div>
      <div class="fi-chips">${[['', 'Tutti', O.length], ['dafatt', 'Da fatturare', cnt('dafatt')], ['fatt', 'Fatturati', cnt('fatt')], ['confermato', 'Confermati', cnt('confermato')], ['spedito', 'In consegna', cnt('spedito')], ['consegnato', 'Consegnati', cnt('consegnato')]].filter(([k, , n]) => !k || n).map(([k, l, n]) => `<button type="button" class="chip-f${fst === k ? ' on' : ''}" data-fist="${k}">${l}<em>${n}</em></button>`).join('')}</div>
      ${pzs.length > 1 ? `<div class="fi-chips">${[['', 'Tutti i piazzali'], ...pzs].map(([k, l]) => `<button type="button" class="chip-f${fpz === k ? ' on' : ''}" data-fipz="${esc(k)}">${esc(l)}</button>`).join('')}</div>` : ''}
      <div class="fi-ol">${R.slice(0, lim).map(o => { const st = ST[o.stato] || ST.confermato, on = !!fa[o.id], w = checks(o).some(c => c.t === 'warn'); return `<button type="button" class="fi-or" data-fiopen="${esc(o.id)}"><span class="pv-qn"><b>${esc(o.num)}</b><small>${esc(X.shortDate(o.data))}</small></span><span class="pv-qc"><b>${esc(gname(o))}</b><small>${o.righe.length} ${o.righe.length === 1 ? 'riga' : 'righe'}${nextDel(o) && o.stato !== 'consegnato' ? ' · consegna ' + esc(X.shortDate(nextDel(o))) : ''}</small></span><span class="fi-cs"><span class="chip ${late(o) ? 'late' : st[1]}">${late(o) ? 'In ritardo' : st[0]}</span>${on ? '<span class="chip paid">Fatturato</span>' : ''}${w ? '<span class="chip late">Controlla</span>' : ''}</span><b class="pv-qt">${money(o.imponibile)}</b></button>`; }).join('') || '<div class="empty">Nessun ordine trovato</div>'}${R.length > lim ? `<button type="button" class="btn sm" id="fi-more" style="margin:12px auto 0;display:block">Mostra altri</button>` : ''}</div>`
      : '<div class="empty">Nessun ordine: carica la prima conferma d\'ordine</div>'}</div>`;
  }

  function detail(o, can) {
    const st = ST[o.stato] || ST.confermato, fa = F(), on = !!fa[o.id], C = checks(o), cd = X.cdcs();
    const kv = [['Piazzale', gname(o)], ['Destinatario', o.dest.rs], ['Indirizzo', [o.dest.via, [o.dest.cap, o.dest.citta, o.dest.prov].filter(Boolean).join(' ')].filter(Boolean).join(' · ')], ['Pagamento', o.pagamento], ['Corriere', o.corriere], ['Porto / resa', o.porto], ['Peso', o.peso ? X.fmtNum(o.peso, 3) + ' kg' : ''], ['Magazzino Fischer', o.magForn], ['N. cliente', o.cliente]].filter(([, v]) => v);
    return `<div class="pv-back"><button type="button" class="btn sm" id="fi-back">‹ Ordini</button><span class="chip ${late(o) ? 'late' : st[1]}">${late(o) ? 'In ritardo' : st[0]}</span>${on ? '<span class="chip paid">Fatturato</span>' : ''}<span class="pv-sp"></span>${o.pdf ? '<button type="button" class="btn sm" id="fi-pdf">Apri PDF</button>' : ''}${can ? '<button type="button" class="btn sm st-btn-d" id="fi-del">Elimina</button>' : ''}</div>
      <div class="card"><div class="card-h"><h3>Ordine ${esc(o.num)}</h3><span class="muted small">del ${esc(X.shortDate(o.data))}</span></div>
        <div class="fi-kv">${kv.map(([k, v]) => `<div><small>${k}</small><b>${esc(v)}</b></div>`).join('')}</div>
        <div class="fi-act"><div class="fi-fatt">${tick(o, fa, 0)}</div>
          ${can ? `<label class="fi-sel"><small>Piazzale collegato</small><select id="fi-cdc"><option value="">— da collegare —</option>${cd.map(c => `<option value="${esc(c.cod)}"${o.cdc === c.cod ? ' selected' : ''}>${esc(c.n)}</option>`).join('')}</select></label>
          <div class="fi-sel"><small>Stato della consegna</small><div class="tr-seg">${ST_K.map(k => `<button type="button" data-fistato="${k}" class="${o.stato === k ? 'on' : ''}">${ST[k][0]}</button>`).join('')}</div></div>` : ''}</div></div>
      <div class="card"><div class="card-h"><h3>Articoli</h3><span class="muted small">${o.righe.length} ${o.righe.length === 1 ? 'riga' : 'righe'}</span></div><div class="mx-wrap"><table class="mx"><thead><tr><th class="l">Codice</th><th class="l">Descrizione</th><th>Quantità</th><th>Prezzo ogni ${o.righe[0] ? X.fmtNum(o.righe[0].per, 0) : 100}</th><th>Importo</th><th>Consegna prevista</th></tr></thead><tbody>
        ${o.righe.map(x => `<tr><td class="l m2">${esc(x.cod)}</td><td class="l">${esc(x.desc)}${x.ean ? `<small class="fi-ean">EAN ${esc(x.ean)}</small>` : ''}</td><td>${X.fmtNum(x.q, 0)} ${esc(x.um)}</td><td>${money(x.prezzo)}</td><td><b>${money(x.importo)}</b></td><td>${x.consegna ? esc(X.shortDate(x.consegna)) : '—'}</td></tr>`).join('')}</tbody></table></div>
        <div class="fi-tot"><div><span>Importo righe</span><b>${money(o.importoRighe)}</b></div>${o.scontoImp ? `<div><span>Sconto di testata ${X.fmtNum(o.scontoPct, 2)}%</span><b>− ${money(o.scontoImp)}</b></div>` : ''}${o.spese ? `<div><span>Spese di spedizione</span><b>${money(o.spese)}</b></div>` : ''}<div><span>Imponibile</span><b>${money(o.imponibile)}</b></div><div><span>IVA ${X.fmtNum(o.ivaPct, 0)}%</span><b>${money(o.iva)}</b></div><div class="fi-tt"><span>Totale ordine</span><b>${money(o.totale)}</b></div></div></div>
      <div class="card"><div class="card-h"><h3>Controlli</h3><span class="muted small">${C.some(c => c.t === 'warn') ? 'da verificare' : 'i numeri tornano'}</span></div>
        ${C.length ? `<div class="gl-an">${C.map((c, i) => `<div class="ga-row ${c.t}" style="--d:${i * 60}ms"><span class="ci-ic"><svg viewBox="0 0 24 24">${c.t === 'warn' ? '<path d="M12 3 2 20h20zM12 10v4M12 17h.01"/>' : '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'}</svg></span><div class="ga-m"><b>${esc(c.h)}</b><span>${esc(c.d)}</span></div></div>`).join('')}</div>` : '<div class="empty">Quantità, prezzi, sconto, IVA e totale sono coerenti</div>'}</div>
      <div class="card"><div class="card-h"><h3>Movimentazioni</h3><span class="muted small">storico dell'ordine</span></div>
        <div class="fi-mv">${(o.mov || []).slice().reverse().map(v => `<div class="fi-mi"><i></i><span><b>${esc(v.n || (ST[v.st] || ST.confermato)[0])}</b><small>${esc(X.shortDate(v.d))}${v.st && v.n ? ' · ' + esc((ST[v.st] || [''])[0]) : ''}</small></span></div>`).join('') || '<div class="empty">Nessuna movimentazione</div>'}</div>
        ${can ? '<div class="fi-note"><input id="fi-note" type="text" placeholder="Aggiungi una nota (es. consegna parziale, DDT n. …)" autocomplete="off"><button type="button" class="btn sm" id="fi-note-add">Aggiungi</button></div>' : ''}</div>`;
  }

  /* ---------- azioni ---------- */
  async function load(files) {
    const ops = [], ok = [], bad = []; let warn = 0, nopdf = 0;
    for (const f of files) {
      try {
        X.busy(`Leggo ${f.name}…`);
        const u8 = new Uint8Array(await f.arrayBuffer()), p = parse(await extract(u8)), ex = X.cfg('fi:' + p.id);
        const o = { ...p, nomeFile: f.name, stato: ex ? ex.stato : 'confermato', mov: ex ? (ex.mov || []) : [{ d: X.today(), st: 'confermato', n: 'Conferma d\'ordine caricata' }], cdc: ex && ex.cdc ? ex.cdc : (X.guess(p.pz) || ''), pdf: ex ? ex.pdf || '' : '', creato: ex ? ex.creato : new Date().toISOString() };
        if (ex) o.mov = [...o.mov, { d: X.today(), st: o.stato, n: 'Conferma ricaricata e aggiornata' }];
        if (!X.isLocal() && !o.pdf) {
          X.busy('Salvo il PDF nel tuo Drive…'); let bin = ''; for (let i = 0; i < u8.length; i += 32768) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
          try { o.pdf = await X.api('uploadDoc', { name: `Fischer ordine ${o.num} ${o.data}.pdf`, mime: 'application/pdf', data: btoa(bin) }); }
          catch (e) { if (X.isAuth && X.isAuth(e)) throw e; nopdf++; } // l'ordine si salva comunque: il PDF si può ricaricare
        }
        ops.push(opSave(o)); ok.push(o); if (checks(o).some(c => c.t === 'warn')) warn++;
      } catch (e) { if (X.isAuth && X.isAuth(e)) { X.busy(); throw e; } bad.push(`${f.name}: ${e.message}`); }
    }
    X.busy();
    if (ops.length) { if (ok.length === 1) { openId = ok[0].id; tab = 'ord'; } else tab = 'ord'; anim = true; X.write(ops); }
    X.toast(ok.length ? `${ok.length} ${ok.length === 1 ? 'ordine caricato' : 'ordini caricati'}${warn ? ` · ${warn} da controllare` : ''}${nopdf ? ` · PDF non archiviato su Drive (${nopdf})` : ''}${bad.length ? ` · ${bad.length} non letti` : ''}` : `Non letto: ${bad[0] || 'file non valido'}`);
    if (bad.length && ok.length) setTimeout(() => X.toast('Non letti: ' + bad.join(' | ')), 2800);
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
      if ((x = b('[data-fitab]'))) { tab = x.dataset.fitab; openId = ''; anim = true; return draw(el); }
      if ((x = b('[data-fiopen]'))) { openId = x.dataset.fiopen; tab = 'ord'; anim = true; return draw(el); }
      if (b('#fi-back')) { openId = ''; anim = true; return draw(el); }
      if ((x = b('[data-fist]'))) { fst = x.dataset.fist; lim = 40; return draw(el); }
      if ((x = b('[data-fipz]'))) { fpz = x.dataset.fipz; lim = 40; return draw(el); }
      if (b('#fi-more')) { lim += 60; return draw(el); }
      if (b('#fi-pdf')) { const o = get(openId); return o && o.pdf && X.openDoc(o.pdf, `Fischer ${o.num}`); }
      if (b('#fi-del')) { const o = get(openId); if (o && confirm(`Eliminare l'ordine ${o.num}?`)) { const fa = { ...F() }; delete fa[o.id]; X.write([{ action: 'delete', sheet: 'Config', id: 'fi:' + o.id }, { action: 'upsert', sheet: 'Config', row: { chiave: 'fiFatt', valore: JSON.stringify(fa) } }]); openId = ''; X.toast('Ordine eliminato'); } return; }
      if ((x = b('[data-fistato]'))) { const o = get(openId); if (o) setStato(o, x.dataset.fistato); return; }
      if (b('#fi-note-add')) { const i = el.querySelector('#fi-note'), v = i && i.value.trim(), o = get(openId); if (o && v) { o.mov = [...(o.mov || []), { d: X.today(), st: '', n: v }]; X.write([opSave(o)]); } return; }
    });
    el.addEventListener('change', e => {
      const t = e.target;
      if (t.id === 'fi-file') { const fs = [...t.files]; t.value = ''; if (fs.length) load(fs); return; }
      if (t.dataset && t.dataset.fi) {
        const o = { ...F() }; if (t.checked) o[t.dataset.fi] = X.today(); else delete o[t.dataset.fi];
        X.quiet([{ action: 'upsert', sheet: 'Config', row: { chiave: 'fiFatt', valore: JSON.stringify(o) } }]); draw(el); return;
      }
      if (t.id === 'fi-cdc') {
        const o = get(openId); if (!o) return; const pz = String(o.pz || '').toUpperCase(), ops = [];
        list().forEach(x => { if (x.id === o.id || (!x.cdc && String(x.pz || '').toUpperCase() === pz)) { const y = get(x.id); y.cdc = t.value; ops.push(opSave(y)); } });
        X.write(ops); if (ops.length > 1) X.toast(`Piazzale collegato su ${ops.length} ordini`);
      }
    });
    el.addEventListener('input', e => {
      if (e.target.id !== 'fi-q') return;
      fq = e.target.value; lim = 40; const pos = e.target.selectionStart; draw(el); const i = el.querySelector('#fi-q'); if (i) { i.focus(); try { i.setSelectionRange(pos, pos); } catch { } }
    });
  }

  window.CDC_FI = { render, parse, extract, checks, lines };
})();
