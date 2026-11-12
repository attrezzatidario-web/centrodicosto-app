/* Centro di Costo — app Presenze (v127)
   Il dipendente entra con le stesse credenziali del gestionale: timbra entrata, pausa e uscita (l'ora la decide il server)
   e chiede ferie, permessi o comunica la malattia. Nella demo tutto resta sul dispositivo. */
(() => {
  'use strict';
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxExGwxVNa08xHz1zp2BmoGkvT1LX7jj-yfdbzbWckqOBsMxPsISmDdKgDmx4uqwRiW/exec';
  const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }, del(k) { try { localStorage.removeItem(k); } catch {} } };
  const $ = (q, r = document) => r.querySelector(q), $$ = (q, r = document) => [...r.querySelectorAll(q)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseD = s => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
  const addD = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return ymd(d); };
  const dIt = s => s ? String(s).slice(0, 10).split('-').reverse().join('/') : '';
  const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  const GG = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const dLong = s => { const d = parseD(s); return `${GG[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]}`; };
  const hm = m => { m = Math.max(0, Math.round(m)); return `${Math.floor(m / 60)}:${pad(m % 60)}`; };
  const hTxt = m => { m = Math.max(0, Math.round(m)); const h = Math.floor(m / 60), r = m % 60; return h ? `${h} h${r ? ' ' + pad(r) : ''}` : `${r} min`; };
  const tmin = t => { const [h, m, s] = String(t || '0:0').split(':').map(Number); return (h || 0) * 60 + (m || 0) + (s || 0) / 60; };
  const nf = n => (Math.round(n * 10) / 10).toLocaleString('it-IT');
  const TIPI = { in: 'Entrata', pausa: 'Inizio pausa', rientro: 'Fine pausa', out: 'Uscita' };
  const BTN = { in: ['Timbra l\'entrata', 'go'], pausa: ['Inizia la pausa', 'pause'], rientro: ['Torna dalla pausa', 'go'], out: ['Timbra l\'uscita', 'stop'] };
  const ASS = { ferie: 'Ferie', permesso: 'Permesso', malattia: 'Malattia', altro: 'Altra assenza' };
  const AST = { attesa: ['wait', 'In attesa'], approvata: ['ok', 'Approvata'], rifiutata: ['no', 'Rifiutata'], comunicata: ['info', 'Comunicata'] };
  const IC = { go: '<path d="M5 12h12M13 6l6 6-6 6"/>', stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>', pause: '<path d="M9 6v12M15 6v12"/>', plus: '<path d="M12 5v14M5 12h14"/>', out: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>', key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/>', grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2"/>', pin: '<path d="M12 21s-7-5.6-7-11.2A7 7 0 0 1 19 9.8C19 15.4 12 21 12 21z"/><circle cx="12" cy="10" r="2.6"/>', check: '<path d="M5 12l5 5L20 7"/>', fuel: '<path d="M5 20V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v15M4 20h11M5 10h9M14 8l3 2v7a1.5 1.5 0 0 0 3 0V9l-2-3"/>' };
  IC.card = '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 15h4"/>'; IC.cash = '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/>'; IC.cam = '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'; IC.rec = '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>';
  const svg = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${IC[k] || ''}</svg>`;

  let url = LS.get('cdc_url', '') || SCRIPT_URL; if (url === 'local') url = SCRIPT_URL;
  let tok = LS.get('cdc_tok', ''), me = LS.get('cdc_me', null), M = null, DEMO = false, tab = 'oggi', mon = '', off = 0, clockT = 0, D0 = null;

  /* ---------- rete ---------- */
  class AuthErr extends Error {}
  const device = () => ((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '') + (matchMedia('(max-width: 640px)').matches ? ' · telefono' : '') + ' · Presenze';
  async function post(action, extra = {}) {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, token: tok, ...extra }), credentials: 'omit', referrerPolicy: 'no-referrer' });
    const j = await r.json();
    if (!j.ok && j.auth) throw new AuthErr(j.error || 'Sessione scaduta: entra di nuovo');
    if (!j.ok) throw new Error(/sconosciuta/i.test(j.error || '') ? 'Il gestionale va aggiornato (script Google cdc-5.5) per usare questa funzione' : j.error || 'Operazione non riuscita');
    return j.result;
  }
  const netErr = e => e instanceof TypeError ? 'Nessuna connessione: controlla internet e riprova' : e.message;

  /* ---------- demo: stessi calcoli, dati generati sul dispositivo ---------- */
  const loadJs = src => new Promise((ok, ko) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = ko; document.head.appendChild(s); });
  async function demoInit() {
    if (!window.CDC_DEMO) { await loadJs('../settori.js?v=129'); await loadJs('../demo.js?v=129'); }
    D0 = window.CDC_DEMO(LS.get('cdc_demo_set', '') || 'veicoli');
    const extra = LS.get('cdc_pz_demo', { p: [], a: [], del: [] });
    const g0 = (D0.gasolio || [])[0]; D0.mezzi = g0 ? [{ targa: g0.targa, nome: g0.uso || '' }] : []; D0.rif = []; D0.nsMine = (D0.spese || []).filter(x => x.dip === (D0.dipendenti[0] || {}).id);
    D0.presenze.push(...extra.p.filter(p => p.dip === 'dpd1')); D0.assenze.push(...extra.a); D0.assenze = D0.assenze.filter(a => !extra.del.includes(a.id));
  }
  const demoSave = (k, v) => { const x = LS.get('cdc_pz_demo', { p: [], a: [], del: [] }); x[k].push(v); LS.set('cdc_pz_demo', x); };
  const NEXT = { '': ['in'], out: ['in'], in: ['pausa', 'out'], rientro: ['pausa', 'out'], pausa: ['rientro', 'out'] };
  function demoMe() {
    const d = D0.dipendenti[0], n = new Date(), oggi = ymd(n), from = addD(oggi, -70);
    const P = D0.presenze.filter(p => p.dip === d.id && p.data >= from), T = P.filter(p => p.data === oggi).sort((a, b) => String(a.ora).localeCompare(String(b.ora))), last = T.length ? T[T.length - 1].tipo : '';
    return { dip: { id: d.id, nome: d.nome, cognome: d.cognome, mansione: d.mansione, sede: d.sede, ore: d.ore, ferie: d.ferie, permessi: d.permessi, assunzione: d.assunzione, foto: d.foto || '' }, oggi, ora: `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`, stato: last, next: NEXT[last] || ['in'],
      mezzi: D0.mezzi, rif: D0.rif.slice(0, 6), presenze: P, assenze: D0.assenze.filter(a => a.dip === d.id), set: D0.config.pzSet || {}, ns: (() => { const me0 = d.id, car = (D0.carte || []).filter(c => c.dip === me0 && c.stato !== 'bloccata'), fo = (D0.fondi || []).filter(f => f.dip === me0), sp = D0.nsMine || []; return { attivo: !!(car.length || fo.length), carte: car.map(c => ({ id: c.id, nome: c.nome, ultime4: c.ultime4, tipo: c.tipo, colore: c.colore })), contanti: fo.length ? fo.reduce((t, f) => t + Number(f.importo || 0), 0) - sp.filter(x => x.metodo === 'contanti' && x.stato !== 'rifiutata').reduce((t, x) => t + x.importo, 0) : null, spese: sp, cat: ['Carburante', 'Pasti e trasferte', 'Materiale e attrezzatura', 'Pedaggi e parcheggi', 'Altro'], centri: [] }; })(), azienda: (D0.config.azienda && D0.config.azienda.nome) || 'Azienda demo', user: me };
  }
  async function call(action, extra = {}) {
    if (!DEMO) return post(action, extra);
    await new Promise(r => setTimeout(r, 250));
    const d = D0.dipendenti[0];
    if (action === 'pzTimbra') { const m = demoMe(); if (!m.next.includes(extra.tipo)) throw new Error('Timbratura non valida in questo momento'); const p = { id: 'dz' + Date.now(), dip: d.id, data: m.oggi, ora: m.ora, tipo: extra.tipo, fonte: 'app', nota: '' }; D0.presenze.push(p); demoSave('p', p); return Object.assign(demoMe(), { fatto: p }); }
    if (action === 'pzRichiesta') { const a = { id: 'dza' + Date.now(), dip: d.id, tipo: extra.tipo, dal: extra.dal, al: extra.al, ore: extra.tipo === 'permesso' ? Number(extra.ore) || 0 : '', motivo: extra.motivo || '', stato: extra.tipo === 'malattia' ? 'comunicata' : 'attesa', risposta: '', creato: new Date().toISOString(), deciso: '' }; D0.assenze.push(a); demoSave('a', a); return demoMe(); }
    if (action === 'pzRifornimento') { D0.rif.unshift({ id: 'dr' + Date.now(), data: demoMe().oggi, targa: extra.targa, litri: Number(String(extra.litri).replace(',', '.')) || 0, km: Number(extra.km) || 0 }); return demoMe(); }
    if (action === 'pzSpesa') { const c = (D0.carte || []).find(x => String(x.id) === String(extra.carta)); D0.nsMine.unshift({ id: 'dsp' + Date.now(), data: extra.data, dip: d.id, importo: Number(String(extra.importo).replace(',', '.')) || 0, esercente: extra.esercente, categoria: extra.categoria, centro: extra.centro, descrizione: extra.descrizione, metodo: extra.metodo, carta: extra.metodo === 'carta' ? extra.carta : '', foto: extra.foto ? 'demo' : '', stato: 'inviata', risposta: '', creato: new Date().toISOString() }); return demoMe(); }
    if (action === 'pzFoto') { d.foto = extra.foto || ''; return demoMe(); }
    if (action === 'pzSpesaDel') { D0.nsMine = D0.nsMine.filter(x => x.id !== extra.id); return demoMe(); }
    if (action === 'pzAnnulla') { D0.assenze = D0.assenze.filter(a => a.id !== extra.id); demoSave('del', extra.id); return demoMe(); }
    return demoMe();
  }

  /* ---------- calcoli ---------- */
  const set = () => Object.assign({ giorni: 5, geo: false }, (M && M.set) || {});
  const workday = s => { const g = parseD(s).getDay(); return set().giorni >= 6 ? g !== 0 : g !== 0 && g !== 6; };
  const workDays = (a, b) => { let n = 0; for (let d = a; d <= b; d = addD(d, 1)) if (workday(d)) n++; return n; };
  const srvNow = () => new Date(Date.now() + off);
  const today = () => M ? M.oggi : ymd(new Date());
  const punches = day => M.presenze.filter(p => String(p.data).slice(0, 10) === day).sort((a, b) => String(a.ora).localeCompare(String(b.ora)));
  function work(day) {
    const L = punches(day); let m = 0, st = null, pause = 0, pst = null;
    L.forEach(p => { const t = tmin(p.ora); if (p.tipo === 'in' || p.tipo === 'rientro') { if (pst != null) { pause += t - pst; pst = null; } st = t; } else { if (st != null) { m += t - st; st = null; } if (p.tipo === 'pausa') pst = t; } });
    const live = day === today(), n = srvNow(), nm = n.getHours() * 60 + n.getMinutes() + n.getSeconds() / 60;
    if (st != null && live) m += nm - st;
    if (pst != null && live) pause += nm - pst;
    return { min: Math.max(0, m), pause, L, open: st != null, anom: st != null && !live };
  }
  const absOn = day => M.assenze.find(a => (a.stato === 'approvata' || a.stato === 'comunicata') && a.dal <= day && (a.al || a.dal) >= day);
  function saldo() {
    const d = M.dip, y = today().slice(0, 4), ass = d.assunzione && String(d.assunzione).slice(0, 4) === y ? parseD(d.assunzione) : null, k = ass ? (12 - ass.getMonth()) / 12 : 1;
    const fs = Math.round((Number(d.ferie) || 26) * k * 10) / 10, ps = Math.round((Number(d.permessi) || 32) * k * 10) / 10, A = M.assenze.filter(a => String(a.dal).slice(0, 4) === y);
    const fg = A.filter(a => a.tipo === 'ferie' && a.stato === 'approvata').reduce((s, a) => s + workDays(a.dal, a.al || a.dal), 0);
    const fa = A.filter(a => a.tipo === 'ferie' && a.stato === 'attesa').reduce((s, a) => s + workDays(a.dal, a.al || a.dal), 0);
    const pg = A.filter(a => a.tipo === 'permesso' && a.stato === 'approvata').reduce((s, a) => s + (Number(a.ore) || 0), 0);
    return { fs, fg, fa, fr: fs - fg, ps, pg, pr: ps - pg };
  }

  /* ---------- schermate ---------- */
  function show(id) { ['pz-login', 'pz-pwset', 'pz-app'].forEach(x => { $('#' + x).hidden = x !== id; }); $('#pz-boot').hidden = true; }
  function setM(m) {
    M = m; const [y, mo, d] = m.oggi.split('-').map(Number), [h, mi, s] = String(m.ora).split(':').map(Number);
    off = new Date(y, mo - 1, d, h, mi, s || 0).getTime() - Date.now();
    if (!mon) mon = m.oggi.slice(0, 7);
    $('#pz-name').textContent = `${m.dip.nome || ''} ${m.dip.cognome || ''}`.trim();
    $('#pz-org').textContent = [m.azienda, m.dip.mansione].filter(Boolean).join(' · ');
    { const av = $('#pz-av'), ini = (String(m.dip.nome || '?')[0] + String(m.dip.cognome || '')[0]).toUpperCase(); if (m.dip.foto) { let im = av.querySelector('img'); if (!im) { av.textContent = ''; im = new Image(); im.alt = ''; av.appendChild(im); } if (im.src !== m.dip.foto) im.src = m.dip.foto; } else av.textContent = ini; }
    const n = m.assenze.filter(a => a.stato === 'attesa').length; $('#pz-badge').hidden = !n; $('#pz-badge').textContent = n;
    const nsOn = !!(m.ns && m.ns.attivo); const nt = $('.pz-tabs [data-tab=spese]'); if (nt) nt.hidden = !nsOn; if (!nsOn && tab === 'spese') tab = 'oggi';
    const np = nsOn ? (m.ns.spese || []).filter(x => x.stato === 'inviata').length : 0; const nb = $('#pz-nsb'); if (nb) { nb.hidden = !np; nb.textContent = np; }
    $('#pz-demo').hidden = !DEMO;
    if (!DEMO && !m.stale && me) LS.set('cdc_pz_cache', { u: me.email, m });
  }
  // v128: all'apertura mostra subito l'ultima copia salvata sul telefono, poi la aggiorna dal server in sottofondo
  function fromCache() {
    const c = LS.get('cdc_pz_cache', null); if (!c || !me || c.u !== me.email || !c.m || !c.m.dip) return false;
    const n = new Date(), m = { ...c.m, oggi: ymd(n), ora: `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`, stale: true };
    const T = (m.presenze || []).filter(p => String(p.data).slice(0, 10) === m.oggi).sort((a, b) => String(a.ora).localeCompare(String(b.ora))), last = T.length ? T[T.length - 1].tipo : '';
    m.stato = last; m.next = NEXT[last] || ['in'];
    setM(m); render(); return true;
  }
  const syncing = on => { const t = $('.pz-top'); if (t) t.classList.toggle('sync', !!on); };
  function render() {
    $$('.pz-tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    const TT = { oggi: 'Oggi', storico: 'Storico', richieste: 'Ferie e permessi', spese: 'Spese' };
    const lt = `<header class="pz-lt">${tab === 'oggi' ? `<small>${esc(cap(dLong(today())))}</small>` : ''}<h1>${TT[tab] || ''}</h1></header>`;
    $('#pz-main').innerHTML = lt + (tab === 'storico' ? vStorico() : tab === 'richieste' ? vRichieste() : tab === 'spese' ? vSpese() : vOggi());
    if (tab === 'spese') nsInit();
    tick();
  }
  function vOggi() {
    const w = work(today()), a = absOn(today()), last = w.L.length ? w.L[w.L.length - 1] : null;
    const st = !last ? (a ? ['abs', ASS[a.tipo] || 'Assenza', 'Oggi risulti assente: buon riposo'] : workday(today()) ? ['idle', 'Non hai ancora timbrato', 'Quando arrivi al lavoro timbra l\'entrata'] : ['idle', 'Oggi è giorno di riposo', 'Se lavori comunque, timbra l\'entrata']) :
      last.tipo === 'pausa' ? ['pause', 'Sei in pausa', `dalle ${String(last.ora).slice(0, 5)}`] : last.tipo === 'out' ? ['done', 'Giornata conclusa', `uscita alle ${String(last.ora).slice(0, 5)}`] : ['work', 'Sei al lavoro', `dalle ${String(w.L.find(p => p.tipo === 'in').ora).slice(0, 5)}`];
    const nx = M.next.slice(); if (nx.length === 2 && nx[1] === 'out') nx.reverse();
    const wk = (() => { const d = parseD(today()), s = addD(today(), -((d.getDay() + 6) % 7)); let t = 0; for (let x = s; x <= today(); x = addD(x, 1)) t += work(x).min; return t; })();
    const target = (Number(M.dip.ore) || 40);
    return `<section class="pz-hero st-${st[0]}">
        <div class="pz-date">${esc(cap(dLong(today())))}</div>
        <div class="pz-clock" id="pz-clock">--:--<small>:--</small></div>
        <div class="pz-state"><i></i><b>${esc(st[1])}</b><span>${esc(st[2])}</span></div>
      </section>
      <section class="pz-actions">${nx.map((k, i) => `<button type="button" class="pz-big ${BTN[k][1]}${i ? ' alt' : ''}" data-timbra="${k}">${svg(BTN[k][1])}<span>${BTN[k][0]}</span></button>`).join('')}${set().geo ? `<p class="pz-geo">${svg('pin')}La timbratura salva la tua posizione</p>` : ''}</section>
      <section class="pz-card"><div class="pz-ch"><h3>Oggi</h3><span class="pz-live" id="pz-today">${hTxt(w.min)}</span></div>
        ${w.L.length ? `<ol class="pz-tl">${w.L.map(p => `<li class="t-${esc(p.tipo)}"><b>${String(p.ora).slice(0, 5)}</b><span>${esc(TIPI[p.tipo] || p.tipo)}${p.fonte === 'manuale' ? ' <em>corretta dal titolare</em>' : ''}${p.pending ? ' <em>invio…</em>' : ''}</span></li>`).join('')}${w.open ? '<li class="t-now"><b>adesso</b><span>in corso…</span></li>' : ''}</ol>` : '<p class="pz-empty">Nessuna timbratura oggi</p>'}
        ${w.pause >= 1 ? `<p class="pz-sub">Pausa: ${hTxt(w.pause)}</p>` : ''}</section>
      ${(M.mezzi || []).length ? `<section class="pz-card"><div class="pz-ch"><h3>Rifornimenti</h3><span>${esc(M.mezzi.map(m => m.nome || m.targa).join(' · '))}</span></div>
        <button type="button" class="pz-btn primary wide" data-rif>${svg('fuel')}Segna un rifornimento</button>
        ${(M.rif || []).length ? `<div style="margin-top:8px">${M.rif.map(r => `<div class="pz-req"><div><b>${nf(Number(r.litri) || 0)} L · ${esc(r.targa)}</b><small>${esc(cap(dLong(String(r.data).slice(0, 10))))}${Number(r.km) ? ` · ${Number(r.km).toLocaleString('it-IT')} km` : ''}</small></div></div>`).join('')}</div>` : ''}</section>` : ''}
      <section class="pz-card"><div class="pz-ch"><h3>Questa settimana</h3><span>${hTxt(wk)} su ${nf(target)} h</span></div><div class="pz-prog"><i style="width:${Math.min(100, wk / 60 / target * 100).toFixed(1)}%"></i></div></section>`;
  }
  function vStorico() {
    const [y, m] = mon.split('-').map(Number), last = new Date(y, m, 0).getDate(), days = [];
    let tot = 0, gl = 0;
    for (let i = last; i >= 1; i--) { const day = `${mon}-${pad(i)}`; if (day > today()) continue; const w = work(day), a = absOn(day); if (w.min) { tot += w.min; gl++; } days.push({ day, w, a }); }
    const first = addD(today(), -69).slice(0, 7);
    return `<div class="pz-mnav"><button type="button" class="pz-ib" data-mon="-1"${mon <= first ? ' disabled' : ''} aria-label="Mese precedente">‹</button><b>${esc(cap(MESI[m - 1]))} ${y}</b><button type="button" class="pz-ib" data-mon="1"${mon >= today().slice(0, 7) ? ' disabled' : ''} aria-label="Mese successivo">›</button></div>
      <div class="pz-tiles"><div><span>Ore lavorate</span><b>${hm(tot)}</b></div><div><span>Giorni</span><b>${gl}</b></div><div><span>Media al giorno</span><b>${gl ? hm(tot / gl) : '—'}</b></div></div>
      <section class="pz-card pz-days">${days.map(({ day, w, a }) => `<div class="pz-day${workday(day) ? '' : ' we'}${w.anom ? ' an' : ''}"><span class="pz-dd"><b>${parseD(day).getDate()}</b>${GG[parseD(day).getDay()].slice(0, 3)}</span>
        <span class="pz-dl">${w.L.length ? w.L.map(p => `<em class="p-${esc(p.tipo)}">${String(p.ora).slice(0, 5)}</em>`).join('') : a ? `<em class="p-abs">${esc(ASS[a.tipo])}</em>` : `<small>${workday(day) ? 'nessuna timbratura' : 'riposo'}</small>`}${w.anom ? '<small class="pz-an">manca l\'uscita: avvisa il titolare</small>' : ''}</span>
        <b class="pz-dh">${w.min ? hm(w.min) : ''}</b></div>`).join('') || '<p class="pz-empty">Nessun giorno</p>'}</section>
      <p class="pz-foot">Le timbrature vengono registrate con l'ora del server. Per correggerne una chiedi al titolare.</p>`;
  }
  function vRichieste() {
    const s = saldo(), L = M.assenze.slice().sort((a, b) => String(b.dal).localeCompare(String(a.dal)));
    return `<div class="pz-tiles"><div><span>Ferie residue</span><b>${nf(s.fr)} <small>gg</small></b><em>${nf(s.fg)} godute${s.fa ? ` · ${nf(s.fa)} in attesa` : ''}</em></div><div><span>Permessi residui</span><b>${nf(s.pr)} <small>h</small></b><em>su ${nf(s.ps)} h</em></div></div>
      <div class="pz-reqb"><button type="button" class="pz-btn primary" data-req="ferie">${svg('plus')}Chiedi ferie</button><button type="button" class="pz-btn" data-req="permesso">Permesso</button><button type="button" class="pz-btn" data-req="malattia">Malattia</button></div>
      <section class="pz-card"><div class="pz-ch"><h3>Le tue richieste</h3></div>${L.length ? L.map(a => { const st = AST[a.stato] || AST.attesa, n = a.tipo === 'permesso' && Number(a.ore) ? `${nf(Number(a.ore))} ore` : `${workDays(a.dal, a.al || a.dal)} gg`; return `<div class="pz-req"><div><b>${esc(ASS[a.tipo] || a.tipo)} · ${n}</b><small>${a.dal === (a.al || a.dal) ? esc(cap(dLong(a.dal))) : `dal ${esc(dIt(a.dal))} al ${esc(dIt(a.al))}`}${a.motivo ? ' · ' + esc(a.motivo) : ''}</small>${a.risposta ? `<small class="pz-risp">Risposta: ${esc(a.risposta)}</small>` : ''}</div><span class="pz-st ${st[0]}">${st[1]}</span>${a.stato === 'attesa' ? `<button type="button" class="pz-lnk" data-annulla="${esc(a.id)}">Annulla</button>` : ''}</div>`; }).join('') : '<p class="pz-empty">Nessuna richiesta. Quando ne fai una, il titolare riceve un avviso.</p>'}</section>`;
  }

  /* ---------- orologio ---------- */
  function tick() {
    clearTimeout(clockT);
    const c = $('#pz-clock'); if (c) { const n = srvNow(); c.innerHTML = `${pad(n.getHours())}:${pad(n.getMinutes())}<small>:${pad(n.getSeconds())}</small>`; }
    const t = $('#pz-today'); if (t && M) t.textContent = hTxt(work(today()).min);
    if (M && ymd(srvNow()) !== M.oggi && !document.hidden) { refresh(); return; }
    clockT = setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
  }

  /* ---------- fogli, avvisi ---------- */
  let toastT = 0;
  function toast(t, ok) { const e = $('#pz-toast'); e.innerHTML = `${ok ? svg('check') : ''}<span>${esc(t)}</span>`; e.className = 'pz-toast' + (ok ? ' ok' : ''); e.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { e.hidden = true; }, 3200); }
  function sheet(title, html) { $('#pz-sh-t').textContent = title; $('#pz-sh-b').innerHTML = html; $('#pz-sheet').hidden = false; requestAnimationFrame(() => $('#pz-sheet').classList.add('on')); }
  function closeSheet() { const s = $('#pz-sheet'); s.classList.remove('on'); setTimeout(() => { s.hidden = true; }, 200); }
  const busyB = async (b, txt, fn) => { const h = b.innerHTML; b.disabled = true; b.innerHTML = `<span class="pz-spin sm"></span><span>${esc(txt)}</span>`; try { return await fn(); } finally { b.disabled = false; b.innerHTML = h; } };

  function confirmTimbra(k) {
    const n = srvNow();
    sheet(BTN[k][0], `<div class="pz-conf ${BTN[k][1]}"><div class="pz-conf-t">${pad(n.getHours())}:${pad(n.getMinutes())}</div><p>${esc(TIPI[k])} di oggi, ${esc(dLong(today()))}</p></div>
      <button type="button" class="pz-big ${BTN[k][1]}" id="pz-ok">${svg(BTN[k][1])}<span>Conferma</span></button>`);
    $('#pz-ok').onclick = () => timbra(k);
  }
  const geo = () => new Promise(ok => { if (!navigator.geolocation) return ok(''); navigator.geolocation.getCurrentPosition(p => ok(`${p.coords.latitude.toFixed(5)},${p.coords.longitude.toFixed(5)} ±${Math.round(p.coords.accuracy)}m`), () => ok(''), { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }); });
  // v129: la timbratura compare subito sul telefono e parte verso il server in sottofondo; l'ora è quella del momento del tocco
  let PEND = [];
  const withPend = m => { if (PEND.length) m.presenze = m.presenze.filter(p => !PEND.some(q => q.id === p.id)).concat(PEND); return m; };
  const nextOf = () => { const T = punches(today()), l = T.length ? T[T.length - 1].tipo : ''; return { stato: l, next: NEXT[l] || ['in'] }; };
  async function timbra(k) {
    const n = srvNow(), p = { id: 'tmp' + Date.now(), data: today(), ora: `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`, tipo: k, fonte: 'app', nota: '', pending: true };
    PEND.push(p); M.presenze = M.presenze.concat([p]); Object.assign(M, nextOf());
    closeSheet(); render(); toast(`${TIPI[k]} alle ${p.ora.slice(0, 5)}`, true); if (navigator.vibrate) navigator.vibrate(30);
    const drop = () => { PEND = PEND.filter(q => q !== p); M.presenze = M.presenze.filter(q => q !== p); Object.assign(M, nextOf()); render(); };
    for (let i = 0; i < 4; i++) {
      try {
        const luogo = set().geo && !DEMO ? await geo() : '';
        if (set().geo && !DEMO && !luogo) throw new Error('Per timbrare serve la posizione: consentila nelle impostazioni del browser e riprova');
        const r = await call('pzTimbra', { tipo: k, luogo, device: device(), tc: Date.now() + off });
        PEND = PEND.filter(q => q !== p);
        if (r.dip) { setM(withPend(r)); if (PEND.length) Object.assign(M, nextOf()); } else { M.presenze = M.presenze.filter(q => q !== p && q.id !== r.fatto.id).concat([r.fatto]); setM({ ...M, oggi: r.oggi, ora: r.ora, ...nextOf(), stale: false }); }
        render(); return;
      } catch (e) {
        if (e instanceof AuthErr) { drop(); return toLogin(e.message); }
        if (!(e instanceof TypeError) || i === 3) { drop(); toast(netErr(e).replace(/^Nessuna connessione.*/, 'Timbratura non inviata: nessuna connessione, riprova')); return refresh(); }
        await new Promise(r => setTimeout(r, 2500 * (i + 1)));
      }
    }
  }
  function reqForm(tipo) {
    const t = today(), nx = workday(addD(t, 1)) ? addD(t, 1) : addD(t, 3);
    sheet(tipo === 'malattia' ? 'Comunica la malattia' : 'Nuova richiesta', `<form id="pz-rf" class="pz-form">
      <div class="pz-seg">${Object.entries(ASS).map(([k, l]) => `<label><input type="radio" name="tipo" value="${k}"${k === tipo ? ' checked' : ''}><span>${l}</span></label>`).join('')}</div>
      <div class="pz-row"><label class="pz-f"><span>Dal</span><input type="date" name="dal" value="${tipo === 'malattia' ? t : nx}" min="${addD(t, -30)}" required></label><label class="pz-f" data-al><span>Al</span><input type="date" name="al" value="${tipo === 'malattia' ? t : nx}" required></label></div>
      <div class="pz-row" data-ore hidden><label class="pz-f"><span>Dalle</span><input type="time" name="h1" value="09:00"></label><label class="pz-f"><span>Alle</span><input type="time" name="h2" value="11:00"></label></div>
      <label class="pz-f"><span data-mot>Motivo (facoltativo)</span><input name="motivo" maxlength="200" placeholder="Es. visita medica, impegni familiari"></label>
      <p class="pz-sub" id="pz-rinfo"></p><p class="pz-err" id="pz-rerr"></p>
      <button type="submit" class="pz-btn primary wide">Invia</button></form>`);
    const f = $('#pz-rf'), upd = () => {
      const tp = f.tipo.value, perm = tp === 'permesso';
      $('[data-ore]', f).hidden = !perm; $('[data-al]', f).hidden = perm;
      $('[data-mot]', f).textContent = tp === 'malattia' ? 'Numero del certificato (protocollo)' : 'Motivo (facoltativo)';
      if (perm) f.al.value = f.dal.value; else if (f.al.value < f.dal.value) f.al.value = f.dal.value;
      const n = perm ? (tmin(f.h2.value) - tmin(f.h1.value)) / 60 : workDays(f.dal.value, f.al.value || f.dal.value);
      $('#pz-rinfo').textContent = perm ? (n > 0 ? `${nf(n)} ore di permesso` : '') : `${n} ${n === 1 ? 'giorno lavorativo' : 'giorni lavorativi'}${tp === 'ferie' ? ` · ti restano ${nf(saldo().fr)} giorni` : ''}${tp === 'malattia' ? ' · il titolare riceve subito l\'avviso' : ''}`;
    };
    f.addEventListener('input', upd); f.addEventListener('change', upd); upd();
    f.onsubmit = async ev => {
      ev.preventDefault(); $('#pz-rerr').textContent = '';
      const tp = f.tipo.value, perm = tp === 'permesso', ore = perm ? Math.round((tmin(f.h2.value) - tmin(f.h1.value)) / 60 * 100) / 100 : '';
      if (perm && !(ore > 0)) return void ($('#pz-rerr').textContent = 'Controlla l\'orario del permesso');
      if (!perm && f.al.value < f.dal.value) return void ($('#pz-rerr').textContent = 'La data di fine è prima di quella di inizio');
      const motivo = [perm ? `dalle ${f.h1.value} alle ${f.h2.value}` : '', f.motivo.value.trim()].filter(Boolean).join(' · ');
      await busyB(f.querySelector('[type=submit]'), 'Invio…', async () => {
        try { const r = await call('pzRichiesta', { tipo: tp, dal: f.dal.value, al: perm ? f.dal.value : f.al.value, ore, motivo }); setM(r); closeSheet(); tab = 'richieste'; render(); toast(tp === 'malattia' ? 'Malattia comunicata al titolare' : 'Richiesta inviata al titolare', true); }
        catch (e) { if (e instanceof AuthErr) return toLogin(e.message); $('#pz-rerr').textContent = netErr(e); }
      });
    };
  }
  // v138: rifornimento del mezzo assegnato dal titolare
  function rifForm() {
    const L = M.mezzi || []; if (!L.length) return;
    sheet('Rifornimento', `<form id="pz-gf" class="pz-form">
      ${L.length > 1 ? `<label class="pz-f"><span>Mezzo</span><select name="targa">${L.map(m => `<option value="${esc(m.targa)}">${esc(m.targa)}${m.nome ? ' · ' + esc(m.nome) : ''}</option>`).join('')}</select></label>` : `<input type="hidden" name="targa" value="${esc(L[0].targa)}"><p class="pz-sub" style="margin-top:-4px">${esc(L[0].targa)}${L[0].nome ? ' · ' + esc(L[0].nome) : ''}</p>`}
      <div class="pz-row"><label class="pz-f"><span>Litri</span><input name="litri" inputmode="decimal" required placeholder="0,00"></label><label class="pz-f"><span>Km del mezzo</span><input name="km" inputmode="numeric" placeholder="contachilometri"></label></div>
      <label class="pz-f"><span>Importo pagato € (facoltativo)</span><input name="importo" inputmode="decimal" placeholder="come sullo scontrino"></label>
      <label class="pz-f"><span>Note (facoltativo)</span><input name="note" maxlength="200" placeholder="Es. distributore, cantiere"></label>
      <p class="pz-err" id="pz-gerr"></p>
      <button type="submit" class="pz-btn primary wide">Salva rifornimento</button></form>`);
    const f = $('#pz-gf');
    f.onsubmit = async ev => {
      ev.preventDefault(); $('#pz-gerr').textContent = '';
      const lt = Number(String(f.litri.value).replace(',', '.'));
      if (!(lt > 0)) return void ($('#pz-gerr').textContent = 'Scrivi i litri');
      await busyB(f.querySelector('[type=submit]'), 'Salvo…', async () => {
        try { setM(await call('pzRifornimento', { targa: f.targa.value, litri: f.litri.value, km: f.km.value.replace(/\D/g, ''), importo: f.importo.value, note: f.note.value.trim() })); closeSheet(); render(); toast('Rifornimento salvato', true); }
        catch (e) { if (e instanceof AuthErr) return toLogin(e.message); $('#pz-gerr').textContent = netErr(e); }
      });
    };
  }

  /* ---------- nota spese ---------- */
  const ns = () => (M && M.ns) || {};
  const eur = v => Number(v || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
  const NST = { inviata: ['wait', 'Da approvare'], approvata: ['ok', 'Approvata'], rifiutata: ['no', 'Rifiutata'] };
  /* ---- Spese: schede, elenco per mese, dettaglio (v215, pensato per il telefono) ---- */
  let spF = 'all', spN = 30;
  IC.chev = '<path d="M9 6l6 6-6 6"/>'; IC.rcpt = '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>';
  const dShort = d => { const x = new Date(String(d).slice(0, 10) + 'T12:00:00'); return isNaN(x) ? dIt(d) : x.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }).replace('.', ''); };
  const mLabel = k => { const s = new Date(k + '-01T12:00:00').toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }); return s[0].toUpperCase() + s.slice(1); };
  const cLabel = x => { if (x.metodo !== 'carta') return 'Contanti'; const c = (ns().carte || []).find(c => c.id === x.carta); return c ? (c.nome || 'Carta') + ' ••' + (c.ultime4 || '') : 'Carta'; };
  function spRow(x, i) {
    const st = NST[x.stato] || NST.inviata, cash = x.metodo !== 'carta';
    return `<button type="button" class="pz-sx" data-spd="${esc(x.id)}" style="--i:${Math.min(i, 10)}"><i class="pz-sx-i ${cash ? 'cash' : 'card'}">${svg(cash ? 'cash' : 'card')}</i><span class="pz-sx-m"><b>${esc(x.esercente || x.categoria || 'Spesa')}</b><small>${esc(dShort(x.data))} · ${esc(cLabel(x))}${x.categoria ? ' · ' + esc(x.categoria) : ''}</small>${x.stato === 'rifiutata' && x.risposta ? `<em class="pz-sx-no">${esc(x.risposta)}</em>` : ''}</span><span class="pz-sx-r"><b>${eur(x.importo)}</b><span class="pz-st ${st[0]}">${st[1]}</span></span></button>`;
  }
  function vSpese() {
    const N = ns(), all = (N.spese || []).slice().sort((a, b) => String(b.data).localeCompare(String(a.data)) || String(b.creato).localeCompare(String(a.creato)));
    const mk = today().slice(0, 7), car = N.carte || [], cash = N.contanti, inM = all.filter(x => String(x.data).slice(0, 7) === mk && x.stato !== 'rifiutata');
    const wait = all.filter(x => x.stato === 'inviata'), sum = l => l.reduce((t, x) => t + Number(x.importo || 0), 0);
    if (spF !== 'all' && !all.some(x => x.stato === spF)) spF = 'all';
    const F = spF === 'all' ? all : all.filter(x => x.stato === spF), shown = F.slice(0, spN);
    let list = '', cur = '';
    shown.forEach((x, i) => { const k = String(x.data).slice(0, 7); if (k !== cur) { cur = k; list += `<div class="pz-mh"><span>${mLabel(k)}</span><b>${eur(sum(F.filter(y => String(y.data).slice(0, 7) === k && y.stato !== 'rifiutata')))}</b></div>`; } list += spRow(x, i); });
    const chips = [['all', 'Tutte'], ['inviata', 'Da approvare'], ['approvata', 'Approvate'], ['rifiutata', 'Rifiutate']].map(([k, t]) => [k, t, k === 'all' ? all.length : all.filter(x => x.stato === k).length]).filter(c => c[0] === 'all' || c[2]);
    const nCards = car.length + (cash != null ? 1 : 0);
    return `<div class="pz-nsw" id="pz-nsw">${car.map((c, i) => `<button type="button" class="pz-cc c-${esc(c.colore || 'blu')}" style="--i:${i}" data-spesa="carta:${esc(c.id)}" aria-label="Registra una spesa con ${esc(c.nome || 'la carta')}"><span class="pz-cc-t"><b>${esc(c.nome || 'Carta')}</b><i></i></span><span class="pz-cc-n">•••• ${esc(c.ultime4 || '')}</span><small>${esc(({ credito: 'Credito', debito: 'Debito', prepagata: 'Prepagata' })[c.tipo] || 'Carta aziendale')}</small></button>`).join('')}${cash != null ? `<button type="button" class="pz-cc c-cash" style="--i:${car.length}" data-spesa="contanti:" aria-label="Registra una spesa in contanti"><span class="pz-cc-t"><b>Contanti</b>${svg('cash')}</span><span class="pz-cc-n" id="pz-cash">${eur(cash)}</span><small>a tua disposizione</small></button>` : ''}</div>
      ${nCards > 1 ? `<div class="pz-dots" aria-hidden="true">${Array.from({ length: nCards }, (_, i) => `<i${i ? '' : ' class="on"'}></i>`).join('')}</div>` : ''}
      <div class="pz-tiles"><div><span>Spese del mese</span><b>${eur(sum(inM))}</b><em>${inM.length} ${inM.length === 1 ? 'registrata' : 'registrate'}</em></div><div><span>Da approvare</span><b>${wait.length}</b><em>${eur(sum(wait))}</em></div></div>
      <button type="button" class="pz-btn primary wide" data-spesa="new">${svg('plus')}Registra una spesa</button>
      ${all.length ? `<section class="pz-card pz-sxc"><div class="pz-ch"><h3>Le tue spese</h3></div>${chips.length > 1 ? `<div class="pz-fch" role="tablist">${chips.map(c => `<button type="button" data-spf="${c[0]}" class="${spF === c[0] ? 'on' : ''}">${c[1]}<em>${c[2]}</em></button>`).join('')}</div>` : ''}<div class="pz-sxl">${list}</div>${F.length > shown.length ? `<button type="button" class="pz-btn wide" data-spmore="1">Mostra altre ${Math.min(30, F.length - shown.length)} spese</button>` : ''}</section>`
      : `<section class="pz-card pz-empty"><i>${svg('rcpt')}</i><b>Nessuna spesa ancora</b><p>Appena paghi qualcosa per l'azienda, registralo qui: bastano importo e foto dello scontrino.</p></section>`}`;
  }
  function nsInit() {
    const w = $('#pz-nsw'), ds = $$('.pz-dots i'); if (!w || ds.length < 2) return;
    w.addEventListener('scroll', () => { const k = Math.round(w.scrollLeft / (w.scrollWidth / ds.length)); ds.forEach((d, i) => d.classList.toggle('on', i === k)); }, { passive: true });
  }
  function spDetail(id) {
    const x = (ns().spese || []).find(s => s.id === id); if (!x) return;
    const st = NST[x.stato] || NST.inviata, rows = [['Data', dIt(x.data)], ['Pagata con', cLabel(x)], ['Categoria', x.categoria], ['Magazzino / sede', x.centro], ['Note', x.descrizione], ['Scontrino', x.foto ? 'Allegato ✓' : 'Non allegato']].filter(r => r[1]);
    sheet('Dettaglio spesa', `<div class="pz-sd"><b class="pz-sd-a">${eur(x.importo)}</b><span class="pz-st ${st[0]}">${st[1]}</span><p class="pz-sd-t">${esc(x.esercente || 'Spesa')}</p></div>
      ${x.stato === 'rifiutata' && x.risposta ? `<div class="pz-sd-no"><b>Motivo del rifiuto</b>${esc(x.risposta)}</div>` : ''}
      <dl class="pz-dl">${rows.map(r => `<div><dt>${r[0]}</dt><dd>${esc(r[1])}</dd></div>`).join('')}</dl>
      ${x.stato === 'inviata' ? `<button type="button" class="pz-btn danger wide" id="pz-spx">Annulla questa spesa</button><p class="pz-sub pz-sd-h">Puoi annullarla finché il titolare non l'ha approvata.</p>` : ''}`);
    const bx = $('#pz-spx'); if (!bx) return; let armed = 0;
    bx.onclick = () => { if (!armed) { armed = 1; bx.textContent = 'Tocca ancora per confermare'; bx.classList.add('armed'); setTimeout(() => { if (bx.isConnected) { armed = 0; bx.textContent = 'Annulla questa spesa'; bx.classList.remove('armed'); } }, 4000); return; }
      busyB(bx, 'Annullo…', async () => { try { setM(await call('pzSpesaDel', { id })); closeSheet(); render(); toast('Spesa annullata', true); } catch (er) { if (er instanceof AuthErr) return toLogin(er.message); toast(netErr(er)); } }); };
  }
  const toJpeg = f => new Promise((ok, ko) => { const im = new Image(); im.onload = () => { const k = Math.min(1, 1600 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(im.src); ok(c.toDataURL('image/jpeg', .75)); }; im.onerror = () => ko(new Error('Foto non leggibile')); im.src = URL.createObjectURL(f); });
  function spesaForm(pre) {
    const N = ns(), car = N.carte || [], cash = N.contanti, cats = N.cat || [], centri = N.centri || [];
    if (!car.length && cash == null) return;
    let photo = '', cat = '';
    const opts = car.map(c => ({ v: 'carta:' + c.id, i: 'card', n: c.nome || 'Carta', s: '••' + (c.ultime4 || '') })).concat(cash != null ? [{ v: 'contanti:', i: 'cash', n: 'Contanti', s: eur(cash) }] : []);
    const phHtml = () => photo ? `<img src="${photo}" alt=""><span><b>Foto pronta</b><small>Tocca per cambiarla</small></span>` : `<i>${svg('cam')}</i><span><b>Fotografa o carica</b><small>Consigliato: scontrino, fattura o ricevuta</small></span>`;
    sheet('Nuova spesa', `<form id="pz-sf" class="pz-form pz-sform" novalidate>
      <label class="pz-amtw" id="pz-aw"><span>Importo</span><div><input name="importo" inputmode="decimal" autocomplete="off" required placeholder="0,00" aria-label="Importo in euro"><b>€</b></div></label>
      <div class="pz-f"><span>Pagata con</span><div class="pz-mch" id="pz-sm" role="radiogroup">${opts.map(o => `<button type="button" role="radio" data-m="${esc(o.v)}"><i>${svg(o.i)}</i><b>${esc(o.n)}</b><small>${esc(o.s)}</small></button>`).join('')}</div></div>
      <div class="pz-f"><span>Scontrino, fattura o ricevuta</span><button type="button" class="pz-ph2" id="pz-ph">${phHtml()}</button></div>
      <label class="pz-f"><span>Negozio o fornitore</span><input name="esercente" maxlength="80" placeholder="Es. distributore, ferramenta" autocomplete="off"></label>
      ${cats.length ? `<div class="pz-f"><span>Categoria</span><div class="pz-cch" id="pz-cat">${cats.map(c => `<button type="button" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div></div>` : ''}
      <div class="pz-f"><span>Data</span><div class="pz-dch" id="pz-dc"><button type="button" data-d="0">Oggi</button><button type="button" data-d="1">Ieri</button><input type="date" name="data" value="${today()}" max="${today()}" required aria-label="Data della spesa"></div></div>
      <details class="pz-more"><summary>Altri dettagli</summary><div class="pz-mbody">
        <label class="pz-f"><span>Magazzino o sede</span>${centri.length ? `<select name="centro"><option value="">—</option>${centri.map(c => `<option>${esc(c)}</option>`).join('')}</select>` : '<input name="centro" maxlength="60" placeholder="facoltativo">'}</label>
        <label class="pz-f"><span>Note</span><input name="descrizione" maxlength="200" placeholder="facoltativo"></label></div></details>
      <p class="pz-err" id="pz-serr" role="alert"></p>
      <div class="pz-sbar"><button type="submit" class="pz-btn primary wide">Invia la spesa</button></div></form>`);
    const f = $('#pz-sf'), seg = $('#pz-sm'), aw = $('#pz-aw'); let sel = null;
    const pick = b => { sel = b; seg.querySelectorAll('button').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); }); };
    pick(seg.querySelector(`[data-m="${CSS.escape(pre || '')}"]`) || seg.querySelector('button'));
    seg.onclick = e => { const b = e.target.closest('button'); if (b) pick(b); };
    const cc = $('#pz-cat'); if (cc) cc.onclick = e => { const b = e.target.closest('button'); if (!b) return; cat = cat === b.dataset.c ? '' : b.dataset.c; cc.querySelectorAll('button').forEach(x => x.classList.toggle('on', x.dataset.c === cat)); };
    const dc = $('#pz-dc'), dsync = () => { const v = f.data.value, t = today(), y = ymd(new Date(new Date(t + 'T12:00:00').getTime() - 864e5)); dc.querySelectorAll('button').forEach(x => x.classList.toggle('on', v === (x.dataset.d === '0' ? t : y))); };
    dc.onclick = e => { const b = e.target.closest('button'); if (!b) return; const t = today(); f.data.value = b.dataset.d === '0' ? t : ymd(new Date(new Date(t + 'T12:00:00').getTime() - 864e5)); dsync(); }; f.data.oninput = dsync; dsync();
    f.importo.oninput = () => { aw.classList.remove('bad'); $('#pz-serr').textContent = ''; };
    $('#pz-ph').onclick = () => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = async () => { if (!i.files[0]) return; try { photo = await toJpeg(i.files[0]); $('#pz-ph').innerHTML = phHtml(); $('#pz-ph').classList.add('has'); } catch (er) { $('#pz-serr').textContent = er.message; } }; i.click(); };
    f.onsubmit = async ev => {
      ev.preventDefault(); $('#pz-serr').textContent = '';
      const imp = Number(String(f.importo.value).replace(',', '.')); if (!(imp > 0)) { aw.classList.add('bad'); f.importo.focus(); return void ($('#pz-serr').textContent = 'Scrivi l\'importo della spesa'); }
      const [metodo, carta] = sel.dataset.m.split(':');
      await busyB(f.querySelector('[type=submit]'), 'Invio…', async () => {
        try { setM(await call('pzSpesa', { importo: f.importo.value, metodo, carta, esercente: f.esercente.value.trim(), data: f.data.value, categoria: cat, centro: f.centro.value.trim(), descrizione: f.descrizione.value.trim(), foto: photo ? photo.split(',')[1] : '' })); closeSheet(); spF = 'all'; render(); toast('Spesa inviata', true); }
        catch (e) { if (e instanceof AuthErr) return toLogin(e.message); $('#pz-serr').textContent = netErr(e); }
      });
    };
  }
  function menu() {
    const gest = me && (me.ruolo !== 'dipendente' || Object.values(me.sezioni || {}).some(Boolean));
    sheet(`${me && me.nome || ''}`, `<p class="pz-sub" style="margin-top:-6px">${esc(me && me.email || '')}</p><div class="pz-menu">
      ${gest ? `<a href="../" class="pz-mi">${svg('grid')}<span>Apri il gestionale</span></a>` : ''}
      ${DEMO ? '' : `<button type="button" class="pz-mi" data-m="pw">${svg('key')}<span>Cambia password</span></button>`}
      <button type="button" class="pz-mi" data-m="out">${svg('out')}<span>${DEMO ? 'Esci dalla demo' : 'Esci'}</span></button></div>
      <p class="pz-foot">Per aggiungere Presenze alla schermata Home: menu del browser › «Aggiungi a schermata Home».</p>`);
    $('#pz-sh-b').onclick = async e => { const b = e.target.closest('[data-m]'); if (!b) return; if (b.dataset.m === 'out') logout(); else { closeSheet(); setTimeout(() => pwSheet(), 220); } };
  }
  function pwSheet() {
    sheet('Cambia password', `<form id="pz-cp" class="pz-form"><label class="pz-f"><span>Password attuale</span><input name="old" type="password" autocomplete="current-password" required></label><label class="pz-f"><span>Nuova password (almeno 8 caratteri)</span><input name="n1" type="password" autocomplete="new-password" minlength="8" required></label><label class="pz-f"><span>Ripeti la nuova password</span><input name="n2" type="password" autocomplete="new-password" minlength="8" required></label><p class="pz-err" id="pz-cperr"></p><button type="submit" class="pz-btn primary wide">Salva</button></form>`);
    $('#pz-cp').onsubmit = async ev => { ev.preventDefault(); const f = ev.target; const err = m => { $('#pz-cperr').textContent = m; }; if (f.n1.value !== f.n2.value) return err('Le due password non coincidono'); await busyB(f.querySelector('[type=submit]'), 'Salvo…', async () => { try { const r = await post('changePw', { old: f.old.value, nuova: f.n1.value }); tok = r.token; LS.set('cdc_tok', tok); closeSheet(); toast('Password cambiata', true); } catch (e) { err(netErr(e)); } }); };
  }
  async function logout() {
    closeSheet();
    if (!DEMO && tok) { try { await post('logout'); } catch {} }
    tok = ''; me = null; M = null; LS.set('cdc_tok', ''); LS.del('cdc_me'); if (DEMO) LS.del('cdc_pz_demo'); DEMO = false;
    toLogin();
  }
  function toLogin(msg) { tok = ''; LS.set('cdc_tok', ''); show('pz-login'); $('#pz-lerr').textContent = msg || ''; clearTimeout(clockT); }

  /* ---------- avvio ---------- */
  async function refresh() {
    syncing(true);
    try { setM(withPend(await call('pzMe'))); if (PEND.length) Object.assign(M, nextOf()); if (!$('#pz-sheet').classList.contains('on')) render(); }
    catch (e) {
      if (e instanceof AuthErr) return toLogin(e.message);
      if (!M) { show('pz-app'); $('#pz-main').innerHTML = `<section class="pz-card pz-msg"><h3>Presenze non disponibile</h3><p>${esc(netErr(e))}</p>${me && (me.ruolo !== 'dipendente' || Object.values(me.sezioni || {}).some(Boolean)) ? '<a class="pz-btn" href="../">Vai al gestionale</a>' : ''}<button type="button" class="pz-btn primary" data-retry>Riprova</button><button type="button" class="pz-lnk" data-m2="out">Esci</button></section>`; $('.pz-tabs').hidden = true; }
      else toast(netErr(e));
    } finally { syncing(false); }
  }
  // foto profilo: il dipendente tocca il suo cerchio in alto e sceglie una foto (ritaglio quadrato 128 px)
  // editor della foto profilo: si trascina per spostare, si ingrandisce con cursore, rotellina o due dita; esce un JPEG quadrato 160 px (null se si annulla)
  const cropPhoto = f => window.cdcCropPhoto(f); // editor in foto-crop.js (condiviso con l'app Presenze)
  function avatarInit() {
    const av = $('#pz-av'); if (!av || av._ph) return; av._ph = 1; av.setAttribute('role', 'button'); av.tabIndex = 0; av.title = 'Cambia la foto del profilo'; av.setAttribute('aria-label', 'Cambia la foto del profilo');
    const pick = () => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = async () => { if (!i.files[0]) return; try { const foto = await cropPhoto(i.files[0]); if (!foto) return; setM(await call('pzFoto', { foto })); toast('Foto aggiornata', true); } catch (e) { toast(e.message || 'Non riesco a salvare la foto'); } }; i.click(); };
    av.addEventListener('click', pick); av.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  }
  async function start() {
    avatarInit();
    if (me && me.mustPw && !DEMO) { show('pz-pwset'); return; }
    show('pz-app'); $('.pz-tabs').hidden = false;
    if (DEMO || !fromCache()) $('#pz-main').innerHTML = '<div class="pz-loading"><div class="pz-spin"></div></div>';
    if (DEMO) { try { await demoInit(); } catch { $('#pz-main').innerHTML = '<section class="pz-card pz-msg"><p>Demo non disponibile: controlla la connessione</p></section>'; return; } }
    await refresh();
  }
  async function boot() {
    if (me && me.demo) { DEMO = true; return start(); }
    if (!tok || !me) return toLogin();
    start();
  }

  /* ---------- eventi ---------- */
  $('#pz-lf').addEventListener('submit', async ev => {
    ev.preventDefault(); $('#pz-lerr').textContent = '';
    const u = $('#pz-user').value.trim(), p = $('#pz-pw').value;
    if (!u || !p) return void ($('#pz-lerr').textContent = 'Scrivi accesso e password');
    if (/^demo(2026)?$/i.test(u)) { me = { email: 'demo', nome: 'Ospite', ruolo: 'demo', demo: true, sezioni: {} }; LS.set('cdc_me', me); DEMO = true; return start(); }
    await busyB($('#pz-lgo'), 'Verifico…', async () => {
      try {
        const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'login', email: u, password: p, device: device() }), credentials: 'omit', referrerPolicy: 'no-referrer' }).then(x => x.json());
        if (!r.ok) throw new Error(r.error || 'Accesso non riuscito');
        tok = r.result.token; me = r.result.user; LS.set('cdc_tok', tok); LS.set('cdc_me', me); $('#pz-pw').value = ''; DEMO = false;
        start();
      } catch (e) { $('#pz-lerr').textContent = netErr(e).replace(/^Email o password/, 'Accesso o password'); }
    });
  });
  $('#pz-pf').addEventListener('submit', async ev => {
    ev.preventDefault(); const f = ev.target, err = m => { $('#pz-perr').textContent = m; };
    if (f.n1.value.length < 8) return err('La nuova password deve avere almeno 8 caratteri');
    if (f.n1.value !== f.n2.value) return err('Le due password non coincidono');
    await busyB(f.querySelector('[type=submit]'), 'Salvo…', async () => {
      try { const r = await post('changePw', { old: f.old.value, nuova: f.n1.value }); tok = r.token; LS.set('cdc_tok', tok); me = { ...me, mustPw: false }; LS.set('cdc_me', me); f.reset(); start(); toast('Password salvata', true); }
      catch (e) { if (e instanceof AuthErr) return toLogin(e.message); err(netErr(e)); }
    });
  });
  document.addEventListener('click', e => {
    const t = e.target;
    const tb = t.closest('.pz-tabs [data-tab]'); if (tb) { tab = tb.dataset.tab; render(); window.scrollTo(0, 0); return; }
    const tm = t.closest('[data-timbra]'); if (tm && !tm.closest('#pz-sheet')) return confirmTimbra(tm.dataset.timbra);
    if (t.closest('[data-close]')) return closeSheet();
    const mn = t.closest('[data-mon]'); if (mn && !mn.disabled) { const [y, m] = mon.split('-').map(Number); mon = ymd(new Date(y, m - 1 + Number(mn.dataset.mon), 1)).slice(0, 7); render(); return; }
    const rq = t.closest('[data-req]'); if (rq) return reqForm(rq.dataset.req);
    if (t.closest('[data-rif]')) return rifForm();
    const spn = t.closest('[data-spesa]'); if (spn) return spesaForm(spn.dataset.spesa === 'new' ? '' : spn.dataset.spesa);
    const spd = t.closest('[data-spd]'); if (spd) return spDetail(spd.dataset.spd);
    const spf = t.closest('[data-spf]'); if (spf) { spF = spf.dataset.spf; spN = 30; render(); return; }
    if (t.closest('[data-spmore]')) { spN += 30; render(); return; }
    const sd = t.closest('[data-spdel]'); if (sd) { if (!confirm('Annullare questa spesa?')) return; busyB(sd, '…', async () => { try { setM(await call('pzSpesaDel', { id: sd.dataset.spdel })); render(); toast('Spesa annullata', true); } catch (er) { if (er instanceof AuthErr) return toLogin(er.message); toast(netErr(er)); } }); return; }
    const an = t.closest('[data-annulla]'); if (an) { if (!confirm('Annullare questa richiesta?')) return; busyB(an, '…', async () => { try { setM(await call('pzAnnulla', { id: an.dataset.annulla })); render(); toast('Richiesta annullata', true); } catch (er) { toast(netErr(er)); } }); return; }
    if (t.closest('#pz-menu')) return menu();
    if (t.closest('[data-retry]')) { $('#pz-main').innerHTML = '<div class="pz-loading"><div class="pz-spin"></div></div>'; return refresh(); }
    if (t.closest('[data-m2="out"]')) return logout();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#pz-sheet').hidden) closeSheet(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && M) refresh(); });
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('../sw.js').catch(() => {});
  boot();
})();
