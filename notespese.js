/* Centro di Costo — Nota spese (v204)
   window.CDC_NS.render(el, ctx): carte aziendali, contanti assegnati, spese registrate dai dipendenti
   (dall'app Presenze) e importazione dell'estratto conto con riconciliazione automatica.
   Fogli: Carte, Fondi (contanti), Spese, Estratti. ctx arriva da app.js. */
(() => {
  'use strict';
  let C = null, root = null;
  const S = { tab: 'panoramica', mon: '', q: '', fp: '', fm: '', fs: '', card: '', lotto: '', rf: '', fresh: true, imp: null };

  /* ---------- utilità ---------- */
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => ymd(new Date());
  const parseD = s => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
  const dayDiff = (a, b) => Math.abs(Math.round((parseD(a) - parseD(b)) / 864e5));
  const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  const mLbl = k => { const [y, m] = k.split('-').map(Number); return `${MESI[m - 1].replace(/^./, c => c.toUpperCase())} ${y}`; };
  const mShift = (k, n) => { const [y, m] = k.split('-').map(Number); return ymd(new Date(y, m - 1 + n, 1)).slice(0, 7); };
  const N = v => C.num(v);
  const esc = s => C.esc(s);
  const eur = v => C.eur(v);
  const norm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const A = k => (C.db()[k] || []);
  const CARTE = () => A('carte'), FONDI = () => A('fondi'), SP = () => A('spese'), EST = () => A('estratti');
  const DIPS = () => A('dipendenti').filter(d => d.stato !== 'cessato');
  const dipOf = id => A('dipendenti').find(d => String(d.id) === String(id));
  const nameOf = d => d ? (`${d.nome || ''} ${d.cognome || ''}`.trim() || 'Senza nome') : '—';
  const ini = d => d ? (String(d.nome || '?')[0] + String(d.cognome || '')[0]).toUpperCase() : '?';
  const COL = ['#3362ab', '#1baf7a', '#eb6834', '#8b5cf6', '#0e9fb4', '#d55181', '#c98500', '#64748b'];
  const colOf = d => (d && d.colore) || COL[[...String(d ? d.id : 'x')].reduce((s, c) => s + c.charCodeAt(0), 0) % COL.length];
  const av = d => `<span class="ns-av" style="--c:${colOf(d)}">${esc(ini(d))}</span>`;
  const cardOf = id => CARTE().find(c => String(c.id) === String(id));
  const cardLbl = c => c ? `${c.nome || 'Carta'} ••${c.ultime4 || ''}` : 'Carta';
  const canW = () => C.secPerm('notespese') === 'w';
  const CAT_DEF = ['Carburante', 'Pasti e trasferte', 'Materiale e attrezzatura', 'Pedaggi e parcheggi', 'Cancelleria e ufficio', 'Ricambi e manutenzione', 'Abbigliamento da lavoro', 'Altro'];
  const cats = () => { const c = C.cfg('nsCat'); return Array.isArray(c) && c.length ? c : CAT_DEF; };
  const DEST = { inviata: ['wait', 'Da approvare'], approvata: ['ok', 'Approvata'], rifiutata: ['no', 'Rifiutata'] };
  const COLORI = { blu: 'Blu', nero: 'Nero', verde: 'Verde', viola: 'Viola', arancio: 'Arancio' };
  const IC = {
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 15h4"/>', cash: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v.01M18 14.5v.01"/>',
    doc: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>', plus: '<path d="M12 5v14M5 12h14"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
    alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/>', clip: '<path d="M20 11l-8.5 8.5a5 5 0 0 1-7-7L13 4a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4L14 7"/>', xls: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8l8 8M16 8l-8 8"/>',
    up: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>', link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>', go: '<path d="M9 6l6 6-6 6"/>', back: '<path d="M15 6l-6 6 6 6"/>',
    scan: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16"/>', user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/>'
  };
  const svg = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${IC[k] || ''}</svg>`;

  /* badge della banca: sigla su colore di marca (non il logo ufficiale, che non si può riprodurre) */
  const BANKS = [['intesa|san ?paolo', '#00833e', 'IS'], ['unicredit', '#e30613', 'UC'], ['bper', '#00a0d2', 'BP'], ['banco ?bpm|bpm', '#d4002a', 'BB'], ['fineco', '#00a3e0', 'FE'], ['poste', '#ffcc00', 'PI', '#1b2a6b'], ['n26', '#36a18b', 'N26'], ['revolut', '#0075eb', 'R'], ['qonto', '#2f2f2f', 'Q'], ['american ?express|amex', '#016fd0', 'AX'], ['bnl|paribas', '#00915a', 'BNL'], ['monte dei paschi|mps', '#1b3b8b', 'MP'], ['credem', '#00843d', 'CR'], ['sella', '#0a7a5a', 'SE'], ['ing', '#ff6200', 'ING'], ['mediolanum', '#0071ce', 'ML'], ['satispay', '#e5402a', 'SP'], ['nexi', '#2d32aa', 'NX'], ['hype', '#1ba5e0', 'H'], ['widiba', '#c8102e', 'WI'], ['banca ?etica', '#7bb800', 'BE'], ['crédit agricole|credit agricole|cariparma|crédit', '#00836b', 'CA'], ['bnp', '#00915a', 'BNP'], ['mastercard', '#eb001b', 'MC'], ['visa', '#1a1f71', 'V'], ['wise', '#9fe870', 'W', '#163300'], ['paypal', '#003087', 'PP']];
  const BDOM = [['intesa|san ?paolo', 'intesasanpaolo.com'], ['unicredit', 'unicredit.it'], ['bper', 'bper.it'], ['banco ?bpm|bpm', 'bancobpm.it'], ['fineco', 'finecobank.com'], ['poste', 'poste.it'], ['n26', 'n26.com'], ['revolut', 'revolut.com'], ['qonto', 'qonto.com'], ['american ?express|amex', 'americanexpress.com'], ['bnl|paribas', 'bnl.it'], ['monte dei paschi|mps', 'mps.it'], ['credem', 'credem.it'], ['sella', 'sella.it'], ['^ing', 'ing.it'], ['mediolanum', 'bancamediolanum.it'], ['satispay', 'satispay.com'], ['nexi', 'nexi.it'], ['hype', 'hype.it'], ['widiba', 'widiba.it'], ['banca ?etica', 'bancaetica.it'], ['agricole|cariparma', 'credit-agricole.it'], ['mastercard', 'mastercard.it'], ['visa', 'visa.it'], ['wise', 'wise.com'], ['paypal', 'paypal.com'], ['banca ?d.?italia', 'bancaditalia.it'], ['bcc|credito cooperativo', 'gruppobcciccrea.it'], ['illimity', 'illimity.com'], ['banca ?ifis|ifis', 'bancaifis.it'], ['banca ?generali', 'bancagenerali.com'], ['bnp', 'bnpparibas.it'], ['bbva', 'bbva.com'], ['santander', 'santander.com'], ['deutsche', 'db.com'], ['unipol|ubi', 'ubibanca.com'], ['mooney|sisal', 'mooney.it']];
  const bankBadge = n => { n = String(n || '').trim(); if (!n) return ''; const k = BANKS.find(b => new RegExp(b[0], 'i').test(n)); let col, ini, ink = '#fff'; if (k) { col = k[1]; ini = k[2]; ink = k[3] || '#fff'; } else { const h = [...n].reduce((t, c) => t + c.charCodeAt(0), 0); col = COL[h % COL.length]; ini = n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase(); } const dm = BDOM.find(b => new RegExp(b[0], 'i').test(n)); return `<i class="ns-bk${dm ? ' lg' : ''}" style="--bk:${col};--bki:${ink}" title="${esc(n)}"><b>${esc(ini)}</b>${dm ? `<img src="https://www.google.com/s2/favicons?domain=${dm[1]}&sz=64" alt="" loading="lazy">` : ''}</i>`; };
  const pickM = () => S.mon;
  const inMon = (d, m) => String(d || '').slice(0, 7) === m;

  /* ---------- calcoli ---------- */
  const spent = (list) => list.filter(s => s.stato !== 'rifiutata').reduce((t, s) => t + N(s.importo), 0);
  const saldo = id => FONDI().filter(f => String(f.dip) === String(id)).reduce((t, f) => t + N(f.importo), 0) - spent(SP().filter(s => String(s.dip) === String(id) && s.metodo === 'contanti'));
  const given = id => FONDI().filter(f => String(f.dip) === String(id)).reduce((t, f) => t + N(f.importo), 0);
  const cardMon = (cid, m) => spent(SP().filter(s => s.metodo === 'carta' && String(s.carta) === String(cid) && inMon(s.data, m)));
  const fmt1 = v => C.fmtNum(v, 0);

  /* ---------- riconciliazione ---------- */
  const simil = (a, b) => { a = norm(a); b = norm(b); if (!a || !b) return 0; const wa = new Set(a.split(' ').filter(w => w.length > 2)), wb = b.split(' ').filter(w => w.length > 2); if (!wa.size || !wb.length) return 0; return wb.filter(w => wa.has(w) || [...wa].some(x => x.startsWith(w) || w.startsWith(x))).length / Math.max(wa.size, wb.length); };
  // rows = movimenti dell'estratto aperti, pool = spese con carta non ancora abbinate
  function pairUp(rows, pool) {
    const cand = [];
    rows.forEach(e => pool.forEach(s => {
      const dd = dayDiff(e.data, s.data), da = Math.abs(N(e.importo) - N(s.importo)), sm = simil(e.descrizione, s.esercente);
      if (da < 0.01 && dd <= 5) cand.push({ e, s, k: 'esatta', w: dd - sm * 2 });
      else if (da < 0.01 && dd <= 12) cand.push({ e, s, k: 'probabile', w: 20 + dd - sm * 2 });
      else if (da <= Math.max(1, N(s.importo) * .02) && dd <= 3 && sm > 0) cand.push({ e, s, k: 'importo', w: 40 + dd + da });
    }));
    cand.sort((x, y) => x.w - y.w);
    const ue = new Set(), us = new Set(), out = [];
    cand.forEach(c => { if (ue.has(c.e.id) || us.has(c.s.id)) return; ue.add(c.e.id); us.add(c.s.id); out.push(c); });
    return out;
  }
  const openRows = cid => EST().filter(r => String(r.carta) === String(cid) && !r.spesa && r.stato !== 'ignorata' && N(r.importo) > 0);
  const poolOf = cid => SP().filter(s => s.metodo === 'carta' && String(s.carta) === String(cid) && s.stato !== 'rifiutata' && !s.estratto);
  const coverage = cid => { const d = EST().filter(r => String(r.carta) === String(cid)).map(r => String(r.data)).filter(Boolean).sort(); return d.length ? [d[0], d[d.length - 1]] : null; };
  function recon(cid) {
    const rows = openRows(cid), pool = poolOf(cid), P = pairUp(rows, pool);
    const mine = new Set(P.map(p => p.e.id)), sp = new Set(P.map(p => p.s.id)), cov = coverage(cid);
    return { pairs: P, auto: P.filter(p => p.k === 'esatta'), sugg: P.filter(p => p.k !== 'esatta'), unE: rows.filter(r => !mine.has(r.id)), unS: cov ? pool.filter(s => !sp.has(s.id) && String(s.data) >= cov[0] && String(s.data) <= cov[1]) : [], pending: cov ? pool.filter(s => String(s.data) > cov[1]) : pool };
  }
  const linkOps = (e, s) => [{ action: 'upsert', sheet: 'Estratti', row: { ...e, spesa: s.id, stato: 'abbinata' } }, { action: 'upsert', sheet: 'Spese', row: { ...s, estratto: e.id } }];
  const unlinkOps = e => { const s = SP().find(x => String(x.id) === String(e.spesa)); return [{ action: 'upsert', sheet: 'Estratti', row: { ...e, spesa: '', stato: '' } }].concat(s ? [{ action: 'upsert', sheet: 'Spese', row: { ...s, estratto: '' } }] : []); };
  const alertsAll = () => {
    const L = [], pend = SP().filter(s => s.stato === 'inviata');
    if (pend.length) L.push({ t: 'wait', k: 'spese', x: `${pend.length} ${pend.length === 1 ? 'spesa da approvare' : 'spese da approvare'}`, s: eur(spent(pend)) });
    const nf = SP().filter(s => s.stato !== 'rifiutata' && !s.foto && N(s.importo) >= 1);
    if (nf.length) L.push({ t: 'warn', k: 'spese', x: `${nf.length} ${nf.length === 1 ? 'spesa senza scontrino' : 'spese senza scontrino'}`, s: 'manca la foto', f: 'nofoto' });
    DIPS().forEach(d => { const v = saldo(d.id); if (v < -0.005) L.push({ t: 'no', k: 'contanti', x: `${nameOf(d)} ha speso ${eur(-v)} più dei contanti ricevuti`, s: 'saldo negativo' }); });
    CARTE().filter(c => c.stato !== 'bloccata' && N(c.plafond) > 0 && cardMon(c.id, today().slice(0, 7)) > N(c.plafond)).forEach(c => L.push({ t: 'no', k: 'carte', x: `${cardLbl(c)} ha superato il plafond del mese`, s: `${eur(cardMon(c.id, today().slice(0, 7)))} su ${eur(N(c.plafond))}` }));
    let ue = 0, us = 0;
    CARTE().forEach(c => { const r = recon(c.id); ue += r.unE.length + r.sugg.length; us += r.unS.length; });
    if (ue) L.push({ t: 'warn', k: 'estratto', x: `${ue} ${ue === 1 ? 'movimento' : 'movimenti'} dell'estratto senza nota spesa`, s: 'da abbinare' });
    if (us) L.push({ t: 'no', k: 'estratto', x: `${us} ${us === 1 ? 'spesa registrata' : 'spese registrate'} con carta non ${us === 1 ? 'trovata' : 'trovate'} nell'estratto`, s: 'da verificare' });
    return L;
  };

  /* ---------- pezzi di interfaccia ---------- */
  const pill = (k, t) => `<span class="ns-st ${k}">${esc(t)}</span>`;
  const empty = (t, s, btn) => `<div class="ns-empty"><div class="ns-empty-i">${svg('doc')}</div><b>${esc(t)}</b><p>${esc(s)}</p>${btn || ''}</div>`;
  const ring = (p, c) => { const r = 17, L = 2 * Math.PI * r, v = Math.max(0, Math.min(1, p)); return `<svg class="ns-ring" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="${r}" class="bg"/><circle cx="22" cy="22" r="${r}" class="fg ${c || ''}" style="stroke-dasharray:${L.toFixed(1)};--to:${(L * (1 - v)).toFixed(1)}"/></svg>`; };
  const bars = (list, total, cls) => { if (!list.length) return '<p class="ns-none">Nessuna spesa nel periodo</p>'; const max = Math.max(...list.map(x => x.v), 1); return list.map((x, i) => `<div class="ns-br" style="--i:${i}"><div class="ns-br-t"><span>${x.l}</span><b>${eur(x.v)}</b></div><div class="ns-br-b"><i class="${cls || ''}" style="--w:${(x.v / max * 100).toFixed(1)}%"></i></div></div>`).join(''); };
  const groupSum = (list, f) => { const m = new Map(); list.forEach(s => { const k = f(s) || 'Senza categoria'; m.set(k, (m.get(k) || 0) + N(s.importo)); }); return [...m].map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v); };

  /* ---------- schede ---------- */
  function tabPano() {
    const m = today().slice(0, 7), sm = SP().filter(s => inMon(s.data, m) && s.stato !== 'rifiutata'), pend = SP().filter(s => s.stato === 'inviata');
    const cash = DIPS().reduce((t, d) => t + Math.max(0, saldo(d.id)), 0), al = alertsAll();
    const six = [...Array(6)].map((_, i) => mShift(m, i - 5)), mv = six.map(k => ({ k, v: spent(SP().filter(s => inMon(s.data, k))) })), mx = Math.max(...mv.map(x => x.v), 1);
    const byCat = groupSum(sm, s => s.categoria).slice(0, 6).map(x => ({ l: esc(x.k), v: x.v })), byP = groupSum(sm, s => nameOf(dipOf(s.dip))).slice(0, 6).map(x => ({ l: esc(x.k), v: x.v }));
    const kp = (l, v, s, cls, go, n) => `<button type="button" class="ns-k card ${cls || ''}" style="--i:${n}" data-ns="go:${go}"><span>${l}</span><b data-nsc="${v}">${eur(v)}</b><small>${s}</small></button>`;
    return `<div class="ns-kpis">
      ${kp(`Spese di ${MESI[+m.slice(5) - 1]}`, spent(sm), `${sm.length} ${sm.length === 1 ? 'spesa' : 'spese'} · carte e contanti`, '', 'spese', 0)}
      ${kp('Da approvare', spent(pend), `${pend.length} ${pend.length === 1 ? 'spesa' : 'spese'} in attesa`, pend.length ? 'warn' : '', 'spese', 1)}
      ${kp('Contanti in giro', cash, `${DIPS().filter(d => saldo(d.id) > 0.005).length} persone con contanti`, '', 'contanti', 2)}
      ${kp('Carte attive', CARTE().filter(c => c.stato !== 'bloccata').length, `${CARTE().filter(c => c.dip).length} assegnate`, '', 'carte', 3).replace(/<b data-nsc="(\d+)">[^<]*<\/b>/, '<b data-nsn="$1">$1</b>')}
    </div>
    <div class="ns-g2">
      <section class="card ns-box" style="--i:4"><div class="ns-bh"><h3>Ultimi sei mesi</h3><span>spese registrate</span></div>
        <div class="ns-cols">${mv.map((x, i) => `<div class="ns-col${x.k === m ? ' cur' : ''}" style="--i:${i}" title="${esc(mLbl(x.k))}: ${esc(eur(x.v))}"><div class="ns-col-b"><i style="--h:${(x.v / mx * 100).toFixed(1)}%"></i></div><b>${x.v ? eur(x.v).replace(/,\d\d/, '') : '—'}</b><span>${MESI[+x.k.slice(5) - 1].slice(0, 3)}</span></div>`).join('')}</div></section>
      <section class="card ns-box" style="--i:5"><div class="ns-bh"><h3>Da controllare</h3><span>${al.length ? al.length : 'tutto a posto'}</span></div>
        ${al.length ? `<div class="ns-al">${al.map((a, i) => `<button type="button" class="ns-a ${a.t}" style="--i:${i}" data-ns="go:${a.k}${a.f ? ':' + a.f : ''}"><i>${svg(a.t === 'wait' ? 'doc' : 'alert')}</i><span><b>${esc(a.x)}</b><small>${esc(a.s)}</small></span>${svg('go')}</button>`).join('')}</div>` : `<div class="ns-ok"><i>${svg('check')}</i><b>Niente da segnalare</b><p>Le spese sono approvate e coincidono con gli estratti conto.</p></div>`}</section>
    </div>
    <div class="ns-g2">
      <section class="card ns-box" style="--i:6"><div class="ns-bh"><h3>Per categoria</h3><span>${esc(MESI[+m.slice(5) - 1])}</span></div>${bars(byCat, 0)}</section>
      <section class="card ns-box" style="--i:7"><div class="ns-bh"><h3>Per persona</h3><span>${esc(MESI[+m.slice(5) - 1])}</span></div>${bars(byP, 0, 'alt')}</section>
    </div>`;
  }

  const spFiltered = () => SP().filter(s => (S.mon === 'all' || inMon(s.data, S.mon)) && (!S.fp || String(s.dip) === S.fp) && (!S.fm || s.metodo === S.fm) && (!S.fs || (S.fs === 'nofoto' ? (!s.foto && s.stato !== 'rifiutata') : s.stato === S.fs)) &&
    (!S.q || norm([s.esercente, s.categoria, s.descrizione, nameOf(dipOf(s.dip)), s.centro].join(' ')).includes(norm(S.q)))).sort((a, b) => String(b.data).localeCompare(String(a.data)) || String(b.creato).localeCompare(String(a.creato)));
  function spRow(s, i) {
    const d = dipOf(s.dip), c = cardOf(s.carta), st = DEST[s.stato] || DEST.inviata;
    return `<div class="ns-sp" style="--i:${Math.min(i, 14)}" data-ns="spesa:${esc(s.id)}">
      ${av(d)}<div class="ns-sp-m"><b>${esc(s.esercente || s.categoria || 'Spesa')}</b><small>${esc(nameOf(d))} · ${esc(C.dIt(s.data))}${s.categoria ? ' · ' + esc(s.categoria) : ''}${s.centro ? ' · ' + esc(s.centro) : ''}</small></div>
      <span class="ns-me ${s.metodo === 'carta' ? 'ns-by-card' : 'ns-by-cash'}">${s.metodo === 'carta' && c && c.banca ? bankBadge(c.banca) : svg(s.metodo === 'carta' ? 'card' : 'cash')}<em>${s.metodo === 'carta' ? esc(c ? '••' + c.ultime4 : 'Carta') : 'Contanti'}</em></span>
      <span class="ns-rc${s.foto ? ' on' : ''}" title="${s.foto ? 'Scontrino allegato' : 'Nessuno scontrino'}">${svg(s.foto ? 'clip' : 'doc')}</span>
      <b class="ns-am">${eur(N(s.importo))}</b>${pill(st[0], st[1])}
      <span class="ns-ac">${s.stato === 'inviata' && canW() ? `<button type="button" class="ns-ib ok" data-ns="appr:${esc(s.id)}" title="Approva">${svg('check')}</button><button type="button" class="ns-ib no" data-ns="rifi:${esc(s.id)}" title="Rifiuta">${svg('x')}</button>` : ''}${s.estratto ? `<i class="ns-mt" title="Trovata nell'estratto conto">${svg('link')}</i>` : ''}</span></div>`;
  }
  function tabSpese() {
    const L = spFiltered(), tot = spent(L), d = DIPS();
    const mon = S.mon === 'all' ? '' : `<div class="ns-mn"><button type="button" class="ns-ib" data-ns="mon:-1" aria-label="Mese precedente">${svg('back')}</button><b>${esc(mLbl(S.mon))}</b><button type="button" class="ns-ib" data-ns="mon:1" aria-label="Mese successivo"${S.mon >= today().slice(0, 7) ? ' disabled' : ''}>${svg('go')}</button></div>`;
    return `<div class="ns-flt">${mon}<button type="button" class="ns-chip${S.mon === 'all' ? ' on' : ''}" data-ns="mon:all">Tutto il periodo</button>
      <input class="ns-q" id="ns-q" type="search" placeholder="Cerca esercente, persona, categoria…" value="${esc(S.q)}">
      <select id="ns-fp"><option value="">Tutte le persone</option>${d.map(x => `<option value="${esc(x.id)}"${S.fp === String(x.id) ? ' selected' : ''}>${esc(nameOf(x))}</option>`).join('')}</select>
      <select id="ns-fm"><option value="">Carte e contanti</option><option value="carta"${S.fm === 'carta' ? ' selected' : ''}>Solo carte</option><option value="contanti"${S.fm === 'contanti' ? ' selected' : ''}>Solo contanti</option></select>
      <select id="ns-fs"><option value="">Tutti gli stati</option><option value="inviata"${S.fs === 'inviata' ? ' selected' : ''}>Da approvare</option><option value="approvata"${S.fs === 'approvata' ? ' selected' : ''}>Approvate</option><option value="rifiutata"${S.fs === 'rifiutata' ? ' selected' : ''}>Rifiutate</option><option value="nofoto"${S.fs === 'nofoto' ? ' selected' : ''}>Senza scontrino</option></select></div>
      <section class="card ns-list">${L.length ? L.map(spRow).join('') + `<div class="ns-foot"><span>${L.length} ${L.length === 1 ? 'spesa' : 'spese'}</span><b>${eur(tot)}</b></div>` : empty('Nessuna spesa', S.q || S.fp || S.fm || S.fs ? 'Cambia i filtri per vedere altre spese.' : 'Le spese registrate dai dipendenti con l\'app Presenze compaiono qui. Per far registrare le spese a una persona, assegnale una carta o dei contanti.', canW() ? `<button type="button" class="btn sm primary" data-ns="spesa:new">+ Registra una spesa</button>` : '')}</section>`;
  }

  function cardVis(c, i) {
    const d = dipOf(c.dip), pl = N(c.plafond), u = cardMon(c.id, today().slice(0, 7)), p = pl ? u / pl : 0, bl = c.stato === 'bloccata';
    return `<div class="ns-cw" style="--i:${i}"><button type="button" class="ns-cc c-${esc(c.colore || 'blu')}${bl ? ' blk' : ''}" data-ns="carta:${esc(c.id)}">
      <span class="ns-cc-top"><span class="ns-cc-nm">${bankBadge(c.banca)}<b>${esc(c.nome || 'Carta aziendale')}</b></span><i class="ns-chip-ic"></i></span>
      <span class="ns-cc-num">•••• •••• •••• ${esc(c.ultime4 || '0000')}</span>
      <span class="ns-cc-bot"><span><small>${esc(({ credito: 'Credito', debito: 'Debito', prepagata: 'Prepagata' })[c.tipo] || 'Carta')}${c.banca ? ' · ' + esc(c.banca) : ''}</small><b>${d ? esc(nameOf(d)) : 'Non assegnata'}</b></span>${pl ? `<span class="ns-cc-r">${ring(p, p > 1 ? 'over' : '')}<em>${Math.round(p * 100)}%</em></span>` : ''}</span>${bl ? '<span class="ns-cc-bk">Bloccata</span>' : ''}</button>
      <div class="ns-cm"><span>Questo mese <b>${eur(u)}</b>${pl ? ` su ${eur(pl)}` : ''}</span>${pl ? `<div class="ns-br-b"><i class="${p > 1 ? 'over' : ''}" style="--w:${Math.min(100, p * 100).toFixed(1)}%"></i></div>` : ''}</div></div>`;
  }
  function tabCarte() {
    const L = CARTE();
    return `<div class="ns-cards">${L.map(cardVis).join('') || ''}${canW() ? `<button type="button" class="ns-cw ns-add" style="--i:${L.length}" data-ns="carta:new"><i>${svg('plus')}</i><b>Aggiungi una carta</b><small>Solo le ultime 4 cifre: il numero completo non serve</small></button>` : ''}</div>
      ${L.length ? '<p class="ns-note">Assegna una carta a un dipendente: nella sua app Presenze comparirà la possibilità di registrare le spese fatte con quella carta.</p>' : ''}`;
  }

  function tabContanti() {
    const ids = new Set([...FONDI().map(f => String(f.dip)), ...SP().filter(s => s.metodo === 'contanti').map(s => String(s.dip))]);
    const P = [...ids].map(dipOf).filter(Boolean).sort((a, b) => saldo(b.id) - saldo(a.id));
    const sel = S.rf && ids.has(S.rf) ? S.rf : '';
    const led = [...FONDI().filter(f => !sel || String(f.dip) === sel).map(f => ({ d: f.data, dip: f.dip, v: N(f.importo), x: N(f.importo) >= 0 ? 'Contanti assegnati' : 'Contanti restituiti', n: f.note, k: 'f', id: f.id })),
      ...SP().filter(s => s.metodo === 'contanti' && s.stato !== 'rifiutata' && (!sel || String(s.dip) === sel)).map(s => ({ d: s.data, dip: s.dip, v: -N(s.importo), x: s.esercente || s.categoria || 'Spesa in contanti', n: s.categoria, k: 's', id: s.id }))].sort((a, b) => String(b.d).localeCompare(String(a.d))).slice(0, 80);
    return `<div class="ns-peo">${P.map((d, i) => { const v = saldo(d.id), g = given(d.id), sp = g - v, p = g > 0 ? Math.min(1, Math.max(0, sp / g)) : 0; return `<button type="button" class="card ns-pc${sel === String(d.id) ? ' on' : ''}" style="--i:${i}" data-ns="rf:${esc(d.id)}">
      <span class="ns-pc-h">${av(d)}<b>${esc(nameOf(d))}</b></span><span class="ns-pc-v ${v < -0.005 ? 'neg' : ''}"><small>Contanti a disposizione</small><b>${eur(v)}</b></span>
      <span class="ns-br-b"><i class="${v < -0.005 ? 'over' : ''}" style="--w:${(p * 100).toFixed(1)}%"></i></span><span class="ns-pc-f"><span>Ricevuti ${eur(g)}</span><span>Spesi ${eur(sp)}</span></span></button>`; }).join('')}
      ${canW() ? `<button type="button" class="ns-pc ns-add" style="--i:${P.length}" data-ns="fondo:new"><i>${svg('plus')}</i><b>Assegna contanti</b><small>a un dipendente, con data e nota</small></button>` : ''}</div>
      <section class="card ns-list"><div class="ns-bh" style="padding:14px 16px 4px"><h3>${sel ? esc(nameOf(dipOf(sel))) : 'Movimenti dei contanti'}</h3>${sel ? '<button type="button" class="ns-chip on" data-ns="rf:">Mostra tutti</button>' : '<span>ultimi movimenti</span>'}</div>
      ${led.length ? led.map((m, i) => `<div class="ns-lg" style="--i:${Math.min(i, 14)}">${av(dipOf(m.dip))}<div class="ns-sp-m"><b>${esc(m.x)}</b><small>${esc(nameOf(dipOf(m.dip)))} · ${esc(C.dIt(m.d))}${m.k === 'f' && m.n ? ' · ' + esc(m.n) : ''}</small></div><b class="ns-am ${m.v >= 0 ? 'pos' : 'neg'}">${m.v >= 0 ? '+' : '−'}${eur(Math.abs(m.v))}</b>${m.k === 'f' && canW() ? `<button type="button" class="ns-ib" data-ns="fondodel:${esc(m.id)}" title="Elimina">${svg('trash')}</button>` : '<span class="ns-ib sp"></span>'}</div>`).join('') : empty('Nessun contante assegnato', 'Dai dei contanti a un dipendente: nella sua app Presenze potrà registrare le spese pagate in contanti.', canW() ? '<button type="button" class="btn sm primary" data-ns="fondo:new">+ Assegna contanti</button>' : '')}</section>`;
  }

  /* --- estratto conto --- */
  const lottoOf = cid => { const m = new Map(); EST().filter(r => String(r.carta) === String(cid)).forEach(r => { const o = m.get(r.lotto) || { id: r.lotto, n: 0, a: r.data, b: r.data, f: r.note || '', t: 0, ok: 0 }; o.n++; if (r.data < o.a) o.a = r.data; if (r.data > o.b) o.b = r.data; if (N(r.importo) > 0) { o.t += N(r.importo); } if (r.spesa) o.ok++; m.set(r.lotto, o); }); return [...m.values()].sort((a, b) => String(b.b).localeCompare(String(a.b))); };
  function tabEstratto() {
    const cs = CARTE(); if (!cs.length) return empty('Aggiungi prima una carta', 'Per importare un estratto conto serve almeno una carta aziendale.', canW() ? '<button type="button" class="btn sm primary" data-ns="carta:new">+ Aggiungi una carta</button>' : '');
    if (!S.card || !cardOf(S.card)) S.card = String(cs[0].id);
    const c = cardOf(S.card), lots = lottoOf(S.card), r = recon(S.card), rows = EST().filter(x => String(x.carta) === S.card && (!S.lotto || x.lotto === S.lotto)).sort((a, b) => String(b.data).localeCompare(String(a.data)));
    const ok = rows.filter(x => x.spesa).length, ig = rows.filter(x => x.stato === 'ignorata').length, tot = rows.length - ig, pct = tot ? ok / tot : 0;
    const spById = id => SP().find(s => String(s.id) === String(id));
    const sug = new Map(r.pairs.map(p => [p.e.id, p]));
    const line = (e, i) => {
      const s = e.spesa ? spById(e.spesa) : null, sg = sug.get(e.id), ign = e.stato === 'ignorata', cr = N(e.importo) < 0;
      const st = s ? pill('ok', 'Abbinata') : ign ? pill('mute', cr ? 'Accredito' : 'Ignorata') : sg ? pill('wait', sg.k === 'esatta' ? 'Corrisponde' : sg.k === 'importo' ? 'Importo diverso' : 'Probabile') : cr ? pill('mute', 'Accredito') : pill('no', 'Senza nota spesa');
      const det = s ? `<small class="ns-ln"><i>${svg('link')}</i>${esc(nameOf(dipOf(s.dip)))} · ${esc(s.esercente || s.categoria || '')} · ${esc(C.dIt(s.data))}</small>` : sg ? `<small class="ns-ln sg"><i>${svg('scan')}</i>${esc(nameOf(dipOf(sg.s.dip)))} · ${esc(sg.s.esercente || '')} · ${eur(N(sg.s.importo))} · ${esc(C.dIt(sg.s.data))}</small>` : '';
      const act = !canW() ? '' : s ? `<button type="button" class="btn sm ghost" data-ns="unlink:${esc(e.id)}">Scollega</button>` : sg ? `<button type="button" class="btn sm primary" data-ns="conf:${esc(e.id)}:${esc(sg.s.id)}">Conferma</button><button type="button" class="btn sm ghost" data-ns="pick:${esc(e.id)}">Altra…</button>` : ign ? `<button type="button" class="btn sm ghost" data-ns="unign:${esc(e.id)}">Riattiva</button>` : cr ? '' : `<button type="button" class="btn sm" data-ns="pick:${esc(e.id)}">Abbina</button><button type="button" class="ns-ib" data-ns="ign:${esc(e.id)}" title="Ignora (commissione, canone…)">${svg('x')}</button>`;
      return `<div class="ns-es${s ? ' m' : ''}${ign ? ' ig' : ''}" style="--i:${Math.min(i, 16)}"><span class="ns-es-d">${esc(C.dIt(e.data))}</span><div class="ns-sp-m"><b>${esc(e.descrizione || '—')}</b>${det}</div><b class="ns-am${cr ? ' pos' : ''}">${cr ? '+' : ''}${eur(Math.abs(N(e.importo)))}</b>${st}<span class="ns-ac2">${act}</span></div>`;
    };
    return `<div class="ns-estb"><div class="ns-flt"><select id="ns-ec">${cs.map(x => `<option value="${esc(x.id)}"${String(x.id) === S.card ? ' selected' : ''}>${esc(cardLbl(x))}${x.dip ? ' · ' + esc(nameOf(dipOf(x.dip))) : ''}</option>`).join('')}</select>
      ${lots.length ? `<select id="ns-el"><option value="">Tutti gli estratti</option>${lots.map(l => `<option value="${esc(l.id)}"${S.lotto === l.id ? ' selected' : ''}>${esc(C.dIt(l.a))} – ${esc(C.dIt(l.b))} · ${l.n} mov.</option>`).join('')}</select>` : ''}
      <span style="flex:1"></span>${rows.length ? '<button type="button" class="btn sm" data-ns="xls-rec">' + svg('xls') + 'Esporta</button>' : ''}${r.auto.length && canW() ? `<button type="button" class="btn sm" data-ns="autoapply">Abbina ${r.auto.length} ${r.auto.length === 1 ? 'movimento' : 'movimenti'}</button>` : ''}${canW() ? `<button type="button" class="btn sm primary" data-ns="import">${svg('up')}Importa estratto conto</button>` : ''}</div></div>
      ${rows.length ? `<div class="ns-sum"><section class="card ns-rg" style="--i:0"><div class="ns-rg-r">${ring(pct, 'big')}<b>${Math.round(pct * 100)}%</b></div><div><h3>Movimenti abbinati</h3><p>${ok} su ${tot}${ig ? ` · ${ig} ignorati` : ''}</p></div></section>
        <button type="button" class="card ns-k${r.unE.length ? ' warn' : ''}" style="--i:1" data-ns="rfl:no"><span>Senza nota spesa</span><b data-nsn="${r.unE.length}">${r.unE.length}</b><small>${eur(r.unE.reduce((t, x) => t + N(x.importo), 0))} da giustificare</small></button>
        <button type="button" class="card ns-k${r.pairs.length ? ' warn' : ''}" style="--i:2"><span>Da confermare</span><b data-nsn="${r.pairs.length}">${r.pairs.length}</b><small>abbinamenti trovati</small></button>
        <button type="button" class="card ns-k${r.unS.length ? ' bad' : ''}" style="--i:3"><span>Spese non nell'estratto</span><b data-nsn="${r.unS.length}">${r.unS.length}</b><small>${eur(r.unS.reduce((t, x) => t + N(x.importo), 0))} registrati con la carta</small></button></div>
      <section class="card ns-list">${rows.map(line).join('')}</section>
      ${r.unS.length ? `<section class="card ns-list ns-miss"><div class="ns-bh" style="padding:14px 16px 4px"><h3>Spese con questa carta non trovate nell'estratto</h3><span>controlla importo e data</span></div>${r.unS.map((s, i) => spRow(s, i)).join('')}</section>` : ''}
      ${r.pending.length ? `<p class="ns-note">${r.pending.length} ${r.pending.length === 1 ? 'spesa è successiva' : 'spese sono successive'} all'ultimo estratto caricato: verranno controllate con il prossimo.</p>` : ''}`
      : `<section class="ns-drop" data-ns="${canW() ? 'import' : ''}"><div class="ns-scan"><i></i></div><div class="ns-drop-i">${svg('up')}</div><b>Importa l'estratto conto di ${esc(cardLbl(c))}</b><p>Carica il file della banca (CSV, Excel) oppure il PDF dell'estratto: il sistema legge i movimenti e controlla se coincidono con le spese registrate dai dipendenti.</p>${canW() ? '<span class="btn primary">Scegli il file</span>' : ''}</section>`}`;
  }

  function view() {
    const T = [['panoramica', 'Panoramica'], ['spese', 'Spese'], ['carte', 'Carte'], ['contanti', 'Contanti'], ['estratto', 'Estratto conto']], pend = SP().filter(s => s.stato === 'inviata').length;
    const body = { panoramica: tabPano, spese: tabSpese, carte: tabCarte, contanti: tabContanti, estratto: tabEstratto }[S.tab]();
    const act = canW() ? (S.tab === 'carte' ? '<button type="button" class="btn sm primary" data-ns="carta:new">+ Carta</button>' : S.tab === 'contanti' ? '<button type="button" class="btn sm primary" data-ns="fondo:new">+ Contanti</button>' : S.tab === 'estratto' ? '' : '<button type="button" class="btn sm primary" data-ns="spesa:new">+ Spesa</button>') : '';
    return `<div class="ns-bar"><div class="seg ns-tabs" role="tablist">${T.map(([k, l]) => `<button type="button" role="tab" data-ns="tab:${k}" class="${S.tab === k ? 'on' : ''}">${l}${k === 'spese' && pend ? `<em>${pend}</em>` : ''}</button>`).join('')}</div>
      <div class="ns-act">${S.tab === 'spese' ? `<button type="button" class="btn sm" data-ns="xls-sp">${svg('xls')}<span class="ns-hm">Esporta</span></button>` : ''}${act}</div></div><div class="ns-body${S.fresh ? ' ns-anim' : ''}">${body}</div>`;
  }

  function render(el, ctx) {
    C = ctx; if (root !== el) { root = el; bind(el); }
    if (!S.mon) S.mon = today().slice(0, 7);
    C.sub('Carte aziendali, contanti e spese dei dipendenti');
    const keep = document.activeElement && document.activeElement.id === 'ns-q' ? document.activeElement.selectionStart : null;
    el.innerHTML = view();
    el.querySelectorAll('[data-nsc]').forEach(x => C.countTo(x, Number(x.dataset.nsc), eur));
    el.querySelectorAll('[data-nsn]').forEach(x => C.countTo(x, Number(x.dataset.nsn), v => String(Math.round(v))));
    S.fresh = false;
    if (keep != null) { const q = el.querySelector('#ns-q'); if (q) { q.focus(); try { q.setSelectionRange(keep, keep); } catch {} } }
  }
  const rerender = (fresh) => { if (fresh) S.fresh = true; if (root) render(root, C); };

  /* ---------- moduli ---------- */
  const optDip = (sel, all) => (all ? DIPS() : DIPS().filter(d => d.stato !== 'cessato')).map(d => `<option value="${esc(d.id)}"${String(sel) === String(d.id) ? ' selected' : ''}>${esc(nameOf(d))}</option>`).join('');
  function fileToJpeg(f, max = 1600) {
    return new Promise((ok, ko) => { const img = new Image(); img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(img.src); ok(c.toDataURL('image/jpeg', .78)); }; img.onerror = () => ko(new Error('Foto non leggibile')); img.src = URL.createObjectURL(f); });
  }
  const pickFile = accept => new Promise((ok, ko) => { const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.onchange = () => i.files && i.files[0] ? ok(i.files[0]) : ko(new Error('annullato')); i.click(); });
  const cleanAmt = v => { const n = Number(String(v).replace(',', '.')); return isFinite(n) ? Math.round(n * 100) / 100 : NaN; };

  function spesaForm(id) {
    const o = id && id !== 'new' ? SP().find(s => String(s.id) === String(id)) : null, nw = !o, r = o || { data: today(), metodo: 'carta', stato: 'approvata' };
    let photo = null, photoId = r.foto || '';
    const centri = (C.centri ? C.centri() : []) || [];
    const dd = o ? o.dip : (DIPS()[0] || {}).id;
    C.openSheet(nw ? 'Registra una spesa' : 'Spesa', `<label class="f"><span>Dipendente</span><select name="dip" required>${optDip(dd, true)}</select></label>
      <div class="ns-row2"><label class="f"><span>Data</span><input type="date" name="data" value="${esc(r.data)}" max="${today()}" required></label><label class="f"><span>Importo €</span><input name="importo" inputmode="decimal" value="${r.importo ? esc(String(r.importo).replace('.', ',')) : ''}" placeholder="0,00" required data-focus></label></div>
      <label class="f"><span>Negozio / fornitore</span><input name="esercente" value="${esc(r.esercente || '')}" maxlength="80" placeholder="Es. Brico, distributore, ristorante"></label>
      <div class="ns-row2"><label class="f"><span>Categoria</span><select name="categoria"><option value="">—</option>${cats().concat(r.categoria && !cats().includes(r.categoria) ? [r.categoria] : []).map(c => `<option${r.categoria === c ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
        <label class="f"><span>Magazzino / sede</span><input name="centro" list="ns-cl" value="${esc(r.centro || '')}" placeholder="facoltativo"><datalist id="ns-cl">${centri.map(c => `<option value="${esc(c)}">`).join('')}</datalist></label></div>
      <div class="ns-row2"><label class="f"><span>Pagata con</span><select name="metodo"><option value="carta"${r.metodo === 'carta' ? ' selected' : ''}>Carta aziendale</option><option value="contanti"${r.metodo === 'contanti' ? ' selected' : ''}>Contanti</option></select></label>
        <label class="f" id="ns-cf"><span>Carta</span><select name="carta">${CARTE().map(c => `<option value="${esc(c.id)}"${String(r.carta) === String(c.id) ? ' selected' : ''}>${esc(cardLbl(c))}</option>`).join('')}</select></label></div>
      <label class="f"><span>Note</span><input name="descrizione" value="${esc(r.descrizione || '')}" maxlength="200" placeholder="facoltativo"></label>
      <div class="f"><span>Scontrino, fattura o ricevuta</span><div class="ns-ph" id="ns-ph"></div></div>
      ${o ? `<label class="f"><span>Stato</span><select name="stato"><option value="inviata"${r.stato === 'inviata' ? ' selected' : ''}>Da approvare</option><option value="approvata"${r.stato === 'approvata' ? ' selected' : ''}>Approvata</option><option value="rifiutata"${r.stato === 'rifiutata' ? ' selected' : ''}>Rifiutata</option></select></label>` : ''}`,
      async fd => {
        const imp = cleanAmt(fd.get('importo')); if (!(imp > 0)) return C.toast('Controlla l\'importo');
        const metodo = fd.get('metodo'); if (metodo === 'carta' && !CARTE().length) return C.toast('Aggiungi prima una carta');
        if (!fd.get('dip')) return C.toast('Scegli il dipendente');
        const row = { ...(o || {}), id: o ? o.id : 'sp' + C.uid(), data: fd.get('data'), dip: fd.get('dip'), importo: imp, esercente: String(fd.get('esercente') || '').trim(), categoria: fd.get('categoria') || '', descrizione: String(fd.get('descrizione') || '').trim(), centro: String(fd.get('centro') || '').trim(), metodo, carta: metodo === 'carta' ? fd.get('carta') : '', foto: photoId, stato: o ? fd.get('stato') : 'approvata', chi: o ? o.chi : ((C.me() || {}).email || ''), creato: o ? o.creato : new Date().toISOString(), deciso: o ? o.deciso : new Date().toISOString() };
        if (photo && !C.isLocal()) { try { C.busy('Salvo lo scontrino nel tuo Drive…'); row.foto = await C.api('uploadDoc', { name: `Spesa ${row.esercente || row.categoria || ''} ${row.data} ${row.importo}.jpg`.replace(/[\\/]/g, '-'), mime: 'image/jpeg', data: photo.split(',')[1] }); row.nomeFoto = 'scontrino.jpg'; } catch (e) { C.busy(); return C.toast('Foto non salvata: ' + e.message); } C.busy(); }
        C.write([{ action: 'upsert', sheet: 'Spese', row }]); C.closeSheet(); C.toast('Spesa salvata');
      }, o && canW() ? () => { if (!confirm('Eliminare questa spesa?')) return; C.write([{ action: 'delete', sheet: 'Spese', id: o.id }].concat(o.estratto ? (() => { const e = EST().find(x => String(x.id) === String(o.estratto)); return e ? [{ action: 'upsert', sheet: 'Estratti', row: { ...e, spesa: '', stato: '' } }] : []; })() : [])); C.closeSheet(); C.toast('Spesa eliminata'); } : null);
    const sheet = document.getElementById('sheet-body'), mt = sheet.querySelector('[name=metodo]'), cf = sheet.querySelector('#ns-cf'), ph = sheet.querySelector('#ns-ph');
    const sync = () => { cf.style.display = mt.value === 'carta' ? '' : 'none'; }; mt.onchange = sync; sync();
    const draw = () => {
      ph.innerHTML = photo ? `<img src="${photo}" alt=""><div><b>Nuova foto pronta</b><small>verrà salvata nel Drive</small></div><button type="button" class="btn sm ghost" data-p="pick">Cambia</button>`
        : photoId ? `<i class="ns-ph-i ok">${svg('clip')}</i><div><b>Scontrino allegato</b><small>nel tuo Google Drive</small></div><button type="button" class="btn sm" data-p="open">Apri</button><button type="button" class="btn sm ghost" data-p="pick">Sostituisci</button>`
        : `<i class="ns-ph-i">${svg('doc')}</i><div><b>Nessuna foto</b><small>fotografa o carica lo scontrino</small></div><button type="button" class="btn sm primary" data-p="pick">Allega</button>`;
    };
    ph.onclick = async e => { const b = e.target.closest('[data-p]'); if (!b) return; e.preventDefault(); if (b.dataset.p === 'open') return C.docView(photoId, 'Scontrino'); try { photo = await fileToJpeg(await pickFile('image/*')); draw(); } catch (er) { if (er.message !== 'annullato') C.toast(er.message); } };
    draw();
  }

  function rejectForm(id) {
    const s = SP().find(x => String(x.id) === String(id)); if (!s) return;
    C.openSheet('Rifiuta la spesa', `<p class="muted small" style="margin:0 0 12px">${esc(nameOf(dipOf(s.dip)))} · ${esc(s.esercente || s.categoria || 'Spesa')} · ${esc(eur(N(s.importo)))}. Il dipendente vedrà il motivo nella sua app.</p><label class="f"><span>Motivo</span><input name="risposta" maxlength="200" placeholder="Es. manca lo scontrino" data-focus></label>`,
      fd => { C.write([{ action: 'upsert', sheet: 'Spese', row: { ...s, stato: 'rifiutata', risposta: String(fd.get('risposta') || '').trim(), deciso: new Date().toISOString() } }]); C.closeSheet(); C.toast('Spesa rifiutata'); }, null, 'Rifiuta');
  }

  function cartaForm(id) {
    const o = id && id !== 'new' ? CARTE().find(c => String(c.id) === String(id)) : null, r = o || { tipo: 'credito', stato: 'attiva', colore: 'blu' }, centri = (C.centri ? C.centri() : []) || [];
    C.openSheet(o ? 'Carta aziendale' : 'Nuova carta aziendale', `<div class="ns-prev"><button type="button" class="ns-cc c-${esc(r.colore)}" id="ns-pv" tabindex="-1"><span class="ns-cc-top"><span class="ns-cc-nm"><i id="ns-pb" class="ns-bbw">${bankBadge(r.banca)}</i><b id="ns-pn">${esc(r.nome || 'Carta aziendale')}</b></span><i class="ns-chip-ic"></i></span><span class="ns-cc-num">•••• •••• •••• <span id="ns-p4">${esc(r.ultime4 || '0000')}</span></span><span class="ns-cc-bot"><span><small>Assegnata a</small><b id="ns-pd">${esc(r.dip ? nameOf(dipOf(r.dip)) : 'Non assegnata')}</b></span></span></button></div>
      <label class="f"><span>Nome della carta</span><input name="nome" value="${esc(r.nome || '')}" maxlength="40" placeholder="Es. Visa aziendale, Carta carburante" required data-focus></label>
      <div class="ns-row2"><label class="f"><span>Ultime 4 cifre</span><input name="ultime4" value="${esc(r.ultime4 || '')}" inputmode="numeric" maxlength="4" pattern="\\d{4}" placeholder="1234" required></label><label class="f"><span>Tipo</span><select name="tipo"><option value="credito"${r.tipo === 'credito' ? ' selected' : ''}>Credito</option><option value="debito"${r.tipo === 'debito' ? ' selected' : ''}>Debito</option><option value="prepagata"${r.tipo === 'prepagata' ? ' selected' : ''}>Prepagata</option></select></label></div>
      <div class="ns-row2"><label class="f"><span>Banca</span><div class="ns-bi"><i id="ns-bb" class="ns-bbw">${bankBadge(r.banca)}</i><input name="banca" list="ns-bl" value="${esc(r.banca || '')}" maxlength="40" placeholder="Es. Intesa Sanpaolo" autocomplete="off"></div><datalist id="ns-bl">${['Intesa Sanpaolo', 'UniCredit', 'BPER Banca', 'Banco BPM', 'Fineco', 'Poste Italiane', 'N26', 'Revolut Business', 'Qonto', 'American Express', 'BNL', 'Monte dei Paschi', 'Credem', 'Banca Sella', 'ING', 'Banca Mediolanum', 'Crédit Agricole', 'Nexi', 'Hype', 'Satispay'].map(x => `<option value="${x}">`).join('')}</datalist></label><label class="f"><span>Intestata a</span><input name="titolare" value="${esc(r.titolare || '')}" maxlength="60" placeholder="facoltativo"></label></div>
      <label class="f"><span>Assegnata a</span><select name="dip"><option value="">Nessuno (carta non assegnata)</option>${optDip(r.dip, true)}</select></label>
      <div class="ns-row2"><label class="f"><span>Limite mensile € (facoltativo)</span><input name="plafond" inputmode="decimal" value="${N(r.plafond) ? esc(String(N(r.plafond)).replace('.', ',')) : ''}" placeholder="senza limite"></label><label class="f"><span>Scadenza</span><input name="scadenza" value="${esc(r.scadenza || '')}" maxlength="5" placeholder="MM/AA"></label></div>
      <label class="f"><span>Magazzino / sede predefinita</span><input name="centro" list="ns-cl2" value="${esc(r.centro || '')}" placeholder="facoltativo"><datalist id="ns-cl2">${centri.map(c => `<option value="${esc(c)}">`).join('')}</datalist></label>
      <div class="f"><span>Colore</span><div class="ns-sw">${Object.keys(COLORI).map(k => `<label><input type="radio" name="colore" value="${k}"${r.colore === k ? ' checked' : ''}><i class="c-${k}" title="${COLORI[k]}"></i></label>`).join('')}</div></div>
      ${o ? `<label class="f"><span>Stato</span><select name="stato"><option value="attiva"${r.stato !== 'bloccata' ? ' selected' : ''}>Attiva</option><option value="bloccata"${r.stato === 'bloccata' ? ' selected' : ''}>Bloccata</option></select></label>` : ''}
      <p class="muted small">Inserisci solo le ultime 4 cifre: il numero completo della carta non serve e non va mai scritto qui.</p>`,
      fd => {
        const u4 = String(fd.get('ultime4') || '').trim(); if (!/^\d{4}$/.test(u4)) return C.toast('Scrivi solo le ultime 4 cifre');
        const row = { ...(o || {}), id: o ? o.id : 'ca' + C.uid(), nome: String(fd.get('nome')).trim(), tipo: fd.get('tipo'), ultime4: u4, banca: String(fd.get('banca') || '').trim(), titolare: String(fd.get('titolare') || '').trim(), dip: fd.get('dip') || '', plafond: N(fd.get('plafond')) || 0, centro: String(fd.get('centro') || '').trim(), stato: o ? fd.get('stato') : 'attiva', scadenza: String(fd.get('scadenza') || '').trim(), colore: fd.get('colore') || 'blu', note: o ? o.note : '', creato: o ? o.creato : new Date().toISOString() };
        C.write([{ action: 'upsert', sheet: 'Carte', row }]); C.closeSheet(); C.toast('Carta salvata');
      }, o && canW() ? () => { if (SP().some(s => String(s.carta) === String(o.id)) && !confirm('Questa carta ha spese registrate. Eliminarla lo stesso?')) return; C.write([{ action: 'delete', sheet: 'Carte', id: o.id }]); C.closeSheet(); C.toast('Carta eliminata'); } : null);
    const b = document.getElementById('sheet-body'), pv = b.querySelector('#ns-pv');
    b.oninput = b.onchange = e => { const t = e.target; if (t.name === 'nome') b.querySelector('#ns-pn').textContent = t.value || 'Carta aziendale'; if (t.name === 'banca') { const h = bankBadge(t.value); b.querySelector('#ns-bb').innerHTML = h; b.querySelector('#ns-pb').innerHTML = h; } if (t.name === 'ultime4') b.querySelector('#ns-p4').textContent = (t.value.replace(/\D/g, '') + '0000').slice(0, 4); if (t.name === 'colore') pv.className = 'ns-cc c-' + t.value; if (t.name === 'dip') b.querySelector('#ns-pd').textContent = t.value ? nameOf(dipOf(t.value)) : 'Non assegnata'; };
  }

  function fondoForm() {
    C.openSheet('Contanti', `<div class="seg ns-sg" id="ns-ft"><button type="button" class="on" data-v="consegna">Assegna</button><button type="button" data-v="restituzione">Ritira</button></div>
      <label class="f"><span>Dipendente</span><select name="dip" required>${optDip('', true)}</select></label>
      <div class="ns-row2"><label class="f"><span>Importo €</span><input name="importo" inputmode="decimal" placeholder="0,00" required data-focus></label><label class="f"><span>Data</span><input type="date" name="data" value="${today()}" max="${today()}" required></label></div>
      <label class="f"><span>Nota</span><input name="note" maxlength="120" placeholder="Es. trasferta a Bologna, anticipo materiali"></label><input type="hidden" name="tipo" value="consegna">`,
      fd => { const imp = cleanAmt(fd.get('importo')); if (!(imp > 0)) return C.toast('Controlla l\'importo'); const t = fd.get('tipo');
        C.write([{ action: 'upsert', sheet: 'Fondi', row: { id: 'fo' + C.uid(), data: fd.get('data'), dip: fd.get('dip'), importo: t === 'restituzione' ? -imp : imp, tipo: t, note: String(fd.get('note') || '').trim(), chi: (C.me() || {}).email || '', creato: new Date().toISOString() } }]); C.closeSheet(); C.toast(t === 'restituzione' ? 'Contanti ritirati' : 'Contanti assegnati'); }, null, 'Registra');
    const b = document.getElementById('sheet-body');
    b.querySelector('#ns-ft').onclick = e => { const x = e.target.closest('[data-v]'); if (!x) return; b.querySelectorAll('#ns-ft button').forEach(y => y.classList.toggle('on', y === x)); b.querySelector('[name=tipo]').value = x.dataset.v; };
  }

  function pickForm(eid) {
    const e = EST().find(x => String(x.id) === String(eid)); if (!e) return;
    const pool = poolOf(e.carta).sort((a, b) => dayDiff(a.data, e.data) - dayDiff(b.data, e.data));
    C.openSheet('Abbina il movimento', `<div class="ns-pk0"><b>${esc(e.descrizione)}</b><span>${esc(C.dIt(e.data))} · ${eur(N(e.importo))}</span></div>
      ${pool.length ? `<div class="ns-pk">${pool.slice(0, 40).map(s => { const dA = N(s.importo) - N(e.importo); return `<button type="button" class="ns-pki" data-pk="${esc(s.id)}">${av(dipOf(s.dip))}<span><b>${esc(s.esercente || s.categoria || 'Spesa')}</b><small>${esc(nameOf(dipOf(s.dip)))} · ${esc(C.dIt(s.data))}</small></span><b class="${Math.abs(dA) < .01 ? 'pos' : 'neg'}">${eur(N(s.importo))}</b></button>`; }).join('')}</div>` : '<p class="ns-none">Nessuna spesa con questa carta da abbinare. Puoi crearne una dal movimento.</p>'}
      <button type="button" class="btn" id="ns-mk">${svg('plus')} Crea una nota spesa da questo movimento</button>`, null, null);
    const ok = document.getElementById('sheet-ok'); if (ok) ok.hidden = true;
    const b = document.getElementById('sheet-body');
    b.onclick = ev => { const k = ev.target.closest('[data-pk]'), mk = ev.target.closest('#ns-mk');
      if (k) { const s = SP().find(x => String(x.id) === k.dataset.pk); C.write(linkOps(e, s)); C.closeSheet(); C.toast('Movimento abbinato'); }
      if (mk) { const c = cardOf(e.carta), s = { id: 'sp' + C.uid(), data: e.data, dip: c ? c.dip : '', importo: N(e.importo), esercente: e.descrizione, categoria: '', descrizione: 'Creata dall\'estratto conto', centro: c ? c.centro : '', metodo: 'carta', carta: e.carta, foto: '', stato: 'approvata', chi: (C.me() || {}).email || '', creato: new Date().toISOString(), deciso: new Date().toISOString(), estratto: e.id };
        C.write([{ action: 'upsert', sheet: 'Spese', row: s }, { action: 'upsert', sheet: 'Estratti', row: { ...e, spesa: s.id, stato: 'abbinata' } }]); C.closeSheet(); C.toast('Nota spesa creata: completala con i dati mancanti'); } };
  }

  /* ---------- importazione dell'estratto conto ---------- */
  const toNum = v => { if (typeof v === 'number') return v; let s = String(v == null ? '' : v).trim(); if (!s) return NaN; const neg = /^\(.*\)$/.test(s) || /-\s*$/.test(s) || /^-/.test(s); s = s.replace(/[€\s()+-]/g, ''); if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(/,/g, ''); const n = parseFloat(s); return isNaN(n) ? NaN : neg ? -Math.abs(n) : n; };
  const toDate = v => { if (v instanceof Date) { const d = new Date(v.getTime() + 12 * 36e5); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; } const s = String(v == null ? '' : v).trim(); let m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/); if (m) { let y = +m[3]; if (y < 100) y += 2000; return `${y}-${pad(+m[2])}-${pad(+m[1])}`; } m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[0] : ''; };
  const H_DATE = ['data operazione', 'data contabile', 'data movimento', 'data valuta', 'data', 'date'], H_DESC = ['descrizione', 'causale', 'dettaglio', 'descrizione operazione', 'esercente', 'operazione', 'movimento', 'description', 'beneficiario'], H_AMT = ['importo', 'importo euro', 'importo in euro', 'importo eur', 'amount', 'valore', 'totale'], H_OUT = ['dare', 'addebiti', 'addebito', 'uscite', 'uscita', 'debit'], H_IN = ['avere', 'accrediti', 'accredito', 'entrate', 'entrata', 'credit'];
  const idxOf = (hd, keys) => { for (const k of keys) { const i = hd.findIndex(h => h === k); if (i >= 0) return i; } for (const k of keys) { const i = hd.findIndex(h => h.includes(k)); if (i >= 0) return i; } return -1; };
  function parseSheet(rows) {
    let hi = -1, best = 0, cd = -1, cx = -1, ca = -1, co = -1, ci = -1;
    for (let i = 0; i < Math.min(rows.length, 30); i++) { const hd = rows[i].map(norm), d = idxOf(hd, H_DATE), a = idxOf(hd, H_AMT), o = idxOf(hd, H_OUT), x = idxOf(hd, H_DESC), sc = (d >= 0) + (x >= 0) + (a >= 0 || o >= 0); if (sc > best && d >= 0) { best = sc; hi = i; cd = d; cx = x; ca = a; co = o; ci = idxOf(hd, H_IN); } }
    if (hi < 0 || best < 2) { // senza intestazioni: prima colonna con date, ultima numerica, la più lunga come descrizione
      const w = Math.max(...rows.slice(0, 40).map(r => r.length)), samp = rows.slice(0, 40); hi = -1;
      cd = [...Array(w).keys()].find(c => samp.filter(r => toDate(r[c])).length >= samp.length / 3); if (cd == null) return null;
      ca = [...Array(w).keys()].reverse().find(c => samp.filter(r => !isNaN(toNum(r[c])) && !toDate(r[c])).length >= samp.length / 3); if (ca == null) return null;
      cx = [...Array(w).keys()].filter(c => c !== cd && c !== ca).sort((p, q) => samp.reduce((t, r) => t + String(r[q] || '').length, 0) - samp.reduce((t, r) => t + String(r[p] || '').length, 0))[0]; co = ci = -1;
    }
    const out = [];
    rows.slice(hi + 1).forEach(r => {
      const d = toDate(r[cd]); if (!d) return;
      let v = NaN; if (ca >= 0) v = toNum(r[ca]); if ((isNaN(v) || v === 0) && co >= 0) { const o = toNum(r[co]), i = ci >= 0 ? toNum(r[ci]) : NaN; v = !isNaN(o) && o !== 0 ? Math.abs(o) : !isNaN(i) && i !== 0 ? -Math.abs(i) : NaN; if (co >= 0) out.dare = true; }
      if (isNaN(v) || v === 0) return;
      out.push({ data: d, descrizione: String(r[cx] == null ? '' : r[cx]).replace(/\s+/g, ' ').trim().slice(0, 120), importo: v });
    });
    out.dare = co >= 0; return out;
  }
  async function readFile(f) {
    const pdf = /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name), img = /^image\//.test(f.type);
    if (pdf || img) {
      if (C.isLocal()) throw new Error('Nella demo si possono importare solo file CSV o Excel');
      let b64; if (img) b64 = (await fileToJpeg(f, 2200)).split(',')[1]; else { const u8 = new Uint8Array(await f.arrayBuffer()); let bin = ''; for (let i = 0; i < u8.length; i += 32768) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 32768)); b64 = btoa(bin); }
      C.busy('Leggo l\'estratto conto con l\'IA…');
      try { const r = await C.api('ai', { task: 'estratto', data: b64, mime: pdf ? 'application/pdf' : 'image/jpeg', oggi: today() }); const L = (r && r.righe || []).map(x => ({ data: toDate(x.data), descrizione: String(x.descrizione || '').trim().slice(0, 120), importo: toNum(x.importo) })).filter(x => x.data && !isNaN(x.importo) && x.importo !== 0); L.ai = true; return L; } finally { C.busy(); }
    }
    await C.loadXlsx();
    const buf = await f.arrayBuffer(), csv = /\.(csv|txt|tsv)$/i.test(f.name);
    const wb = csv ? XLSX.read(new TextDecoder(/�/.test(new TextDecoder('utf-8').decode(buf.slice(0, 4000))) ? 'windows-1252' : 'utf-8').decode(buf), { type: 'string', raw: true }) : XLSX.read(buf, { type: 'array', cellDates: true });
    let best = null; wb.SheetNames.forEach(n => { const r = parseSheet(XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: '' })); if (r && (!best || r.length > best.length)) best = r; });
    return best;
  }
  async function startImport() {
    if (!CARTE().length) return C.toast('Aggiungi prima una carta');
    let f; try { f = await pickFile('.csv,.xls,.xlsx,.txt,.pdf,image/*'); } catch { return; }
    let L; try { C.busy('Leggo il file…'); L = await readFile(f); } catch (e) { C.busy(); return C.toast(e.message); } C.busy();
    if (!L || !L.length) return C.toast('Non ho trovato movimenti in questo file: servono almeno data, descrizione e importo');
    const neg = L.filter(x => x.importo < 0).length > L.filter(x => x.importo > 0).length && !L.ai && !L.dare;
    S.imp = { f: f.name, L, inv: neg, ai: !!L.ai };
    importForm();
  }
  function importRows() { const I = S.imp, sg = I.inv ? -1 : 1; return I.L.map(x => ({ data: x.data, descrizione: x.descrizione, importo: Math.round(x.importo * sg * 100) / 100 })); }
  function importForm() {
    const I = S.imp, R = importRows(), out = R.filter(x => x.importo > 0), ds = R.map(x => x.data).sort(), tot = out.reduce((t, x) => t + x.importo, 0);
    C.openSheet('Importa estratto conto', `<div class="ns-ifile"><i>${svg('xls')}</i><div><b>${esc(I.f)}</b><small>${R.length} movimenti · dal ${esc(C.dIt(ds[0]))} al ${esc(C.dIt(ds[ds.length - 1]))}${I.ai ? ' · letto con l\'IA: controlla i dati' : ''}</small></div></div>
      <label class="f"><span>Carta dell'estratto</span><select name="carta">${CARTE().map(c => `<option value="${esc(c.id)}"${String(c.id) === S.card ? ' selected' : ''}>${esc(cardLbl(c))}${c.dip ? ' · ' + esc(nameOf(dipOf(c.dip))) : ''}</option>`).join('')}</select></label>
      <div class="ns-ik"><div><span>Spese (uscite)</span><b>${eur(tot)}</b><small>${out.length} movimenti</small></div><div><span>Accrediti</span><b>${eur(R.filter(x => x.importo < 0).reduce((t, x) => t - x.importo, 0))}</b><small>${R.length - out.length} movimenti</small></div></div>
      ${I.ai ? '' : `<label class="ns-chk"><input type="checkbox" id="ns-inv"${I.inv ? ' checked' : ''}><span>Le spese hanno l'importo negativo nel file (inverti il segno)</span></label>`}
      <div class="ns-iprev">${R.slice(0, 6).map(x => `<div><span>${esc(C.dIt(x.data))}</span><b>${esc(x.descrizione || '—')}</b><em class="${x.importo < 0 ? 'pos' : ''}">${x.importo < 0 ? '+' : ''}${eur(Math.abs(x.importo))}</em></div>`).join('')}${R.length > 6 ? `<small>e altri ${R.length - 6} movimenti…</small>` : ''}</div>`,
      fd => doImport(fd.get('carta')), null, 'Importa e riconcilia');
    const b = document.getElementById('sheet-body'); const inv = b.querySelector('#ns-inv'); if (inv) inv.onchange = () => { S.imp.inv = inv.checked; const car = b.querySelector('[name=carta]').value; S.card = car; importForm(); };
  }
  function doImport(carta) {
    const R = importRows(), lotto = 'lt' + C.uid(), have = new Set(EST().filter(e => String(e.carta) === String(carta)).map(e => [e.data, N(e.importo).toFixed(2), norm(e.descrizione).slice(0, 30)].join('|')));
    let dup = 0; const rows = [];
    R.forEach(x => { const k = [x.data, x.importo.toFixed(2), norm(x.descrizione).slice(0, 30)].join('|'); if (have.has(k)) { dup++; return; } have.add(k); rows.push({ id: 'es' + C.uid(), carta, lotto, data: x.data, descrizione: x.descrizione, importo: x.importo, spesa: '', stato: x.importo < 0 ? 'ignorata' : '', note: S.imp.f, creato: new Date().toISOString() }); });
    if (!rows.length) { C.closeSheet(); return C.toast('Questi movimenti sono già stati importati'); }
    C.write(rows.map(row => ({ action: 'upsert', sheet: 'Estratti', row })));
    S.card = String(carta); S.lotto = lotto; S.tab = 'estratto'; S.fresh = true;
    const r = recon(carta), ops = []; r.auto.forEach(p => ops.push(...linkOps(p.e, p.s)));
    if (ops.length) C.write(ops);
    C.closeSheet(); C.toast(`${rows.length} movimenti importati${dup ? ` (${dup} già presenti)` : ''} · ${r.auto.length} abbinati in automatico`);
    rerender(true);
  }

  /* ---------- esportazioni ---------- */
  async function xlsSpese() {
    await C.loadXlsx(); const L = spFiltered();
    const rows = L.map(s => ({ Data: s.data, Dipendente: nameOf(dipOf(s.dip)), 'Negozio / fornitore': s.esercente || '', Categoria: s.categoria || '', 'Magazzino / sede': s.centro || '', Pagamento: s.metodo === 'carta' ? cardLbl(cardOf(s.carta)) : 'Contanti', Importo: N(s.importo), Stato: (DEST[s.stato] || DEST.inviata)[1], Scontrino: s.foto ? 'sì' : 'no', 'Nell\'estratto': s.estratto ? 'sì' : s.metodo === 'carta' ? 'no' : '', Note: s.descrizione || '' }));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Nota spese'); XLSX.writeFile(wb, `nota-spese-${S.mon === 'all' ? 'tutte' : S.mon}.xlsx`); C.toast('Excel scaricato');
  }
  async function xlsRec() {
    await C.loadXlsx(); const rows = EST().filter(x => String(x.carta) === S.card && (!S.lotto || x.lotto === S.lotto)).sort((a, b) => String(a.data).localeCompare(String(b.data))).map(e => { const s = SP().find(x => String(x.id) === String(e.spesa)); return { Data: e.data, Descrizione: e.descrizione, Importo: N(e.importo), Esito: s ? 'Abbinata' : e.stato === 'ignorata' ? 'Ignorata' : 'Senza nota spesa', Dipendente: s ? nameOf(dipOf(s.dip)) : '', 'Spesa registrata': s ? s.esercente || '' : '', 'Importo registrato': s ? N(s.importo) : '' }; });
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Riconciliazione'); XLSX.writeFile(wb, `riconciliazione-${(cardOf(S.card) || {}).ultime4 || ''}.xlsx`); C.toast('Excel scaricato');
  }

  /* ---------- eventi ---------- */
  function bind(el) {
    el.addEventListener('click', e => {
      const t = e.target.closest('[data-ns]'); if (!t || t.disabled || !C) return;
      const [a, b, c] = String(t.dataset.ns).split(':');
      if (e.target.closest('.ns-ac button, .ns-ac2 button') && a === 'spesa') return;
      if (a === 'tab') { S.tab = b; S.fresh = true; return rerender(); }
      if (a === 'go') { S.tab = b; S.fs = c === 'nofoto' ? 'nofoto' : (b === 'spese' && !c ? S.fs : ''); if (b === 'spese') S.mon = c === 'nofoto' || !c ? 'all' : S.mon; if (a === 'go' && b === 'spese' && !c && t.closest('.ns-k')) { S.fs = t.textContent.includes('Da approvare') ? 'inviata' : ''; S.mon = S.fs ? 'all' : today().slice(0, 7); } S.fresh = true; return rerender(); }
      if (a === 'mon') { S.mon = b === 'all' ? 'all' : mShift(S.mon === 'all' ? today().slice(0, 7) : S.mon, Number(b)); return rerender(); }
      if (a === 'spesa') return b === 'new' ? (canW() ? spesaForm('new') : 0) : canW() || true ? spesaView(b) : 0;
      if (a === 'appr') { e.stopPropagation(); const s = SP().find(x => String(x.id) === b); if (s) { C.write([{ action: 'upsert', sheet: 'Spese', row: { ...s, stato: 'approvata', risposta: '', deciso: new Date().toISOString() } }]); C.toast('Spesa approvata'); } return; }
      if (a === 'rifi') { e.stopPropagation(); return rejectForm(b); }
      if (a === 'carta') return b === 'new' ? cartaForm('new') : (canW() ? cartaForm(b) : 0);
      if (a === 'fondo') return fondoForm();
      if (a === 'fondodel') { if (confirm('Eliminare questo movimento di contanti?')) C.write([{ action: 'delete', sheet: 'Fondi', id: b }]); return; }
      if (a === 'rf') { S.rf = S.rf === b ? '' : b; return rerender(); }
      if (a === 'import') return startImport();
      if (a === 'pick') return pickForm(b);
      if (a === 'conf') { const x = EST().find(r => String(r.id) === b), s = SP().find(r => String(r.id) === c); if (x && s) { C.write(linkOps(x, s)); C.toast('Movimento abbinato'); } return; }
      if (a === 'unlink') { const x = EST().find(r => String(r.id) === b); if (x) C.write(unlinkOps(x)); return; }
      if (a === 'ign') { const x = EST().find(r => String(r.id) === b); if (x) C.write([{ action: 'upsert', sheet: 'Estratti', row: { ...x, stato: 'ignorata' } }]); return; }
      if (a === 'unign') { const x = EST().find(r => String(r.id) === b); if (x) C.write([{ action: 'upsert', sheet: 'Estratti', row: { ...x, stato: '' } }]); return; }
      if (a === 'autoapply') { const r = recon(S.card), ops = []; r.auto.forEach(p => ops.push(...linkOps(p.e, p.s))); if (ops.length) { C.write(ops); C.toast(`${r.auto.length} movimenti abbinati`); } return; }
      if (a === 'xls-sp') return xlsSpese().catch(er => C.toast(er.message));
      if (a === 'xls-rec') return xlsRec().catch(er => C.toast(er.message));
    });
    el.addEventListener('input', e => { if (e.target.id === 'ns-q') { S.q = e.target.value; clearTimeout(bind._t); bind._t = setTimeout(() => rerender(), 180); } });
    el.addEventListener('change', e => {
      const id = e.target.id; if (id === 'ns-fp') S.fp = e.target.value; else if (id === 'ns-fm') S.fm = e.target.value; else if (id === 'ns-fs') S.fs = e.target.value; else if (id === 'ns-ec') { S.card = e.target.value; S.lotto = ''; S.fresh = true; } else if (id === 'ns-el') S.lotto = e.target.value; else return; rerender();
    });
  }
  function spesaView(id) {
    const s = SP().find(x => String(x.id) === String(id)); if (!s) return;
    if (canW()) return spesaForm(id);
    C.openSheet('Spesa', `<p><b>${esc(s.esercente || s.categoria || 'Spesa')}</b><br>${esc(eur(N(s.importo)))} · ${esc(C.dIt(s.data))}</p>${s.foto ? '<button type="button" class="btn" id="ns-vf">Apri lo scontrino</button>' : ''}`, null, null); const b = document.getElementById('ns-vf'); if (b) b.onclick = () => C.docView(s.foto, 'Scontrino');
  }

  if (!window._nsImgErr) { window._nsImgErr = 1; document.addEventListener('error', e => { const t = e.target; if (t && t.tagName === 'IMG' && t.closest && t.closest('.ns-bk')) { t.remove(); } }, true); }
  window.CDC_NS = { render, saldo, recon };
})();
