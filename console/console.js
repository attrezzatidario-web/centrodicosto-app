/* Centro di Costo — Console di amministrazione (v1)
   App separata dal gestionale: clienti, gestionali, utenti, permessi, abbonamenti, accessi e registro.
   Usa lo stesso script Google del gestionale (azioni admin*, script cdc-4.7). Solo l'amministratore può entrare. */
(() => {
  'use strict';
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxExGwxVNa08xHz1zp2BmoGkvT1LX7jj-yfdbzbWckqOBsMxPsISmDdKgDmx4uqwRiW/exec';
  const NEED_V = 'cdc-4.7';
  const SET = window.CDC_SETTORI || { list: [], moduli: [], sempre: [], piani: {}, get: () => ({ id: 'altro', n: 'Attività', ic: '' }) };
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }, del(k) { try { localStorage.removeItem(k); } catch {} } };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nh = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const APPWIN = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const eur = (v, d = 0) => '€ ' + Number(v || 0).toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d });
  const eur2 = v => eur(v, Number(v) % 1 ? 2 : 0);
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const okD = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
  const pD = s => okD(s) ? new Date(s + 'T12:00:00') : null;
  const dIt = s => { const d = pD(s) || (s ? new Date(s) : null); return d && !isNaN(d) ? d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'; };
  const daysTo = s => { const d = pD(s); return d ? Math.round((d - pD(today())) / 864e5) : null; };
  const ago = v => { const d = v ? new Date(v) : null; if (!d || isNaN(d)) return 'mai'; const m = (Date.now() - d) / 6e4; return m < 2 ? 'adesso' : m < 60 ? `${Math.round(m)} min fa` : m < 1440 ? `${Math.round(m / 60)} ore fa` : m < 2880 ? 'ieri' : m < 43200 ? `${Math.round(m / 1440)} giorni fa` : dIt(v); };
  const when = v => { const d = v ? new Date(v) : null; return d && !isNaN(d) ? d.toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'; };
  const ini = s => String(s || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;
  const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
  const IC = {
    plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', open: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    sheet: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M4 15h16M10 3v18"/>', pay: '<rect x="2.5" y="6" width="19" height="13" rx="2"/><path d="M2.5 10h19M6.5 15h4"/>',
    more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/>', out: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>', wa: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>', pause: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>', play: '<path d="M7 5v14l12-7z"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>', bolt: '<path d="M13 3 5 14h6l-1 7 8-11h-6z"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', back: '<path d="M15 5l-7 7 7 7"/>', ok: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/>', warn: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/>', dev: '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M11 18.5h2"/>'
  };
  const ico = (k, c = '') => `<svg viewBox="0 0 24 24" class="i ${c}">${IC[k] || k}</svg>`;
  // un colore per ogni attività (tavolozza sobria, leggibile in chiaro e scuro)
  const SC = { veicoli: '#3d6fd1', bar: '#c9822b', pizzeria: '#d1553f', ristorante: '#b8476e', lavanderia: '#2f9bb3', edile: '#8a6a3c', impresa: '#6c7a89', negozio: '#7a5cc7', estetica: '#cc5f9d', hotel: '#2e9a74', altro: '#7d8697' };
  const secOf = w => SET.get(w.settore) || SET.get('altro');
  const secTile = (w, cls = '') => { const s = typeof w === 'string' ? SET.get(w) : secOf(w); return `<span class="tile ${cls}" style="--c:${SC[s.id] || SC.altro}"><svg viewBox="0 0 24 24">${s.ic || ''}</svg></span>`; };
  const PIANI = SET.piani || { prova: 'Prova', base: 'Base', pro: 'Pro' };
  const RUOLI = { admin: 'Amministratore', utente: 'Può modificare', lettura: 'Sola lettura', demo: 'Demo', dipendente: 'Dipendente' };

  /* ================= stato ================= */
  let tok = LS.get('cdcx_tok', ''), me = LS.get('cdcx_me', null), D = null, view = 'panoramica', sel = '', busyN = 0;
  let F = { cli: LS.get('cdcx_fcli', 'tutti'), ut: 'tutti', reg: 'tutto', q: '' };

  /* ================= server ================= */
  class AuthError extends Error {}
  async function post(action, extra) {
    let r;
    try { r = await fetch(SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, token: tok, ...extra }), credentials: 'omit', referrerPolicy: 'no-referrer' }); }
    catch { throw new Error('Connessione assente: controlla internet e riprova'); }
    let j; try { j = await r.json(); } catch { throw new Error('Risposta non valida dallo script Google'); }
    if (!j.ok && j.auth) { logout(j.error); throw new AuthError(j.error); }
    if (!j.ok) throw new Error(/sconosciuta/i.test(j.error || '') ? `Aggiorna lo script Google alla versione ${NEED_V}` : j.error || 'Errore');
    return j.result;
  }
  async function load(quiet) {
    syncState('busy');
    try { const first = !D; D = await post('adminData'); syncState(D.v && D.v >= NEED_V ? 'ok' : 'old'); render(first); return D; }
    catch (e) { syncState('err'); if (!(e instanceof AuthError) && !quiet) toast(e.message, 'bad'); throw e; }
  }
  // esegue un'azione e aggiorna tutto con i dati che tornano
  async function act(action, extra, okMsg, msg) {
    busy(msg || 'Salvo…');
    try { const r = await post(action, extra); const d = r && r.users ? r : r && r.data && r.data.users ? r.data : null; if (d) D = d; busy(); if (okMsg) toast(okMsg, 'ok'); render(); return r || true; }
    catch (e) { busy(); if (!(e instanceof AuthError)) toast(e.message, 'bad'); return null; }
  }
  function syncState(s) { const el = $('#sync'); if (!el) return; el.className = 'sync ' + s; el.title = { busy: 'Aggiorno…', ok: `Aggiornato alle ${new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`, err: 'Non aggiornato: problema di connessione', old: `Script Google da aggiornare alla ${NEED_V}` }[s] || ''; }

  /* ================= accesso ================= */
  function showGate(msg) {
    $('#app').hidden = true; $('#gate').hidden = false; closeDrawer(true); closeModal();
    const e = $('#gate-err'); e.hidden = !msg; e.textContent = msg || '';
    orbit();
    setTimeout(() => { const i = $('#g-email'); if (i && !i.value) i.focus(); }, 300);
  }
  async function login(ev) {
    ev.preventDefault();
    const email = $('#g-email').value.trim(), pw = $('#g-pw').value, b = $('#g-go'), e = $('#gate-err');
    if (!email || !pw) { e.hidden = false; e.textContent = 'Scrivi email e password'; return; }
    b.classList.add('loading'); b.disabled = true; e.hidden = true;
    try {
      const r = await post('login', { email, password: pw, device: 'Console · ' + devName() });
      if (!r.user.admin) { tok = r.token; post('logout').catch(() => {}); tok = ''; throw new Error('Questo account non è un amministratore: la Console è riservata.'); }
      tok = r.token; me = r.user; LS.set('cdcx_tok', tok); LS.set('cdcx_me', me);
      $('#g-pw').value = '';
      await enter(true);
    } catch (err) { e.hidden = false; e.textContent = err.message; $('#gate-form').classList.remove('shake'); void $('#gate-form').offsetWidth; $('#gate-form').classList.add('shake'); }
    finally { b.classList.remove('loading'); b.disabled = false; }
  }
  function logout(msg) {
    if (tok && !msg) post('logout').catch(() => {});
    tok = ''; me = null; D = null; LS.del('cdcx_tok'); LS.del('cdcx_me');
    showGate(msg);
  }
  const devName = () => { const u = navigator.userAgent; return /iPhone/.test(u) ? 'iPhone' : /iPad/.test(u) ? 'iPad' : /Android/.test(u) ? 'Android' : /Mac/.test(u) ? 'Mac' : /Windows/.test(u) ? 'Windows' : 'Browser'; };
  async function enter(fresh) {
    $('#gate').hidden = true; $('#app').hidden = false; stopOrbit();
    renderMe();
    if (!D) $('#view').innerHTML = skeleton();
    route();
    try { await load(); loadTeam(); if (sel) route(); if (fresh) toast(`Ciao ${String((me && me.nome) || '').split(' ')[0] || 'Dario'}`, 'ok'); } catch {}
  }

  /* ================= navigazione ================= */
  const TITLES = { panoramica: ['Panoramica', ''], clienti: ['Clienti', 'Gestionali delle aziende che usano il Centro di Costo'], utenti: ['Utenti e permessi', 'Chi entra, in quale gestionale e cosa può fare'], incassi: ['Abbonamenti', 'Pagamenti, rinnovi e scadenze'], accessi: ['Accessi', 'Dispositivi collegati e tentativi di accesso'], registro: ['Registro attività', 'Tutto quello che succede, in ordine di tempo'], team: ['Team', 'Gli agenti che controllano e fanno crescere il Centro di Costo'], mappa: ['Mappa del gestionale', 'Ogni parte del Centro di Costo e come è collegata'], impostazioni: ['Impostazioni', 'Il tuo account e la Console'] };
  function route() {
    const h = decodeURIComponent(location.hash.slice(1)), [v, id] = h.split('/');
    const nv = TITLES[v] ? v : 'panoramica';
    const changed = nv !== view; view = nv; sel = id || '';
    $$('#nav a').forEach(a => a.classList.toggle('on', a.dataset.v === view));
    $('#title').textContent = TITLES[view][0];
    closeSide();
    render(changed);
    if (sel && D) { if (view === 'clienti') openClient(sel); else if (view === 'utenti') openUser(sel); }
    else closeDrawer(true);
  }
  function render(anim) {
    if (!me || $('#app').hidden) return;
    const st = $('#subtitle'); st.textContent = view === 'panoramica' ? greet() : TITLES[view][1];
    badges();
    if (!D) return;
    const el = $('#view'), y = el.scrollTop;
    el.classList.toggle('still', !anim || RM);
    el.innerHTML = ({ panoramica: vHome, clienti: vClienti, utenti: vUtenti, incassi: vIncassi, accessi: vAccessi, registro: vRegistro, team: vTeam, mappa: () => '<div id="mp-root"></div>', impostazioni: vImpost }[view])();
    if (view === 'mappa' && window.CDC_MAP) { if (!T) loadTeam(); window.CDC_MAP.mount($('#mp-root'), { D, team: k => T ? tRep(k)[0] : null }); }
    el.scrollTop = anim ? 0 : y;
    countUp(el);
    if (!$('#drawer').hidden) refreshDrawer();
  }
  const greet = () => { const h = new Date().getHours(), n = String((me && me.nome) || '').split(' ')[0]; return `${h < 13 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera'}${n ? ', ' + n : ''} · ${new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}`; };
  function badges() {
    if (!D) return;
    const C = clients(), sc = C.filter(w => scadOf(w)).length, live = (D.sess || []).filter(s => !s.io).length;
    $('#nb-cli').textContent = C.length || ''; $('#nb-inc').textContent = sc || ''; $('#nb-live').textContent = live || '';
    const tb = $('#nb-team'); if (tb && T) { const n = AGENTI.filter(a => { const r = tRep(a.k)[0]; return r && r.stato !== 'ok'; }).length; tb.textContent = n || ''; tb.className = n ? 'warn' : ''; }
  }
  function renderMe() {
    if (!me) return;
    $('#side-me').innerHTML = `<span class="av">${esc(ini(me.nome || me.email))}</span><div><b>${esc(me.nome || 'Amministratore')}</b><span>${esc(me.email)}</span></div><button class="ib" type="button" data-act="logout" title="Esci">${ico('out')}</button>`;
  }

  /* ================= dati derivati ================= */
  const clients = () => (D.ws || []).filter(w => w.tipo === 'cliente');
  const wsOf = c => (D.ws || []).find(w => w.codice === c);
  const usersOf = c => (D.users || []).filter(u => u.ws === c);
  const paysOf = c => (D.pagamenti || []).filter(p => p.ws === c);
  const scadOf = w => { if (w.tipo !== 'cliente' || !okD(w.scadenza)) return ''; const d = daysTo(w.scadenza); return d < 0 ? 'late' : d <= 30 ? 'soon' : ''; };
  const scadTxt = w => { if (w.tipo !== 'cliente') return w.tipo === 'principale' ? 'Il tuo gestionale' : 'Dati di prova'; if (!okD(w.scadenza)) return 'Senza scadenza'; const d = daysTo(w.scadenza); return d < 0 ? `Scaduto da ${plural(-d, 'giorno', 'giorni')}` : d === 0 ? 'Scade oggi' : d <= 60 ? `Scade tra ${plural(d, 'giorno', 'giorni')}` : `Fino al ${dIt(w.scadenza)}`; };
  const stOf = w => w.stato !== 'attivo' ? 'off' : scadOf(w) === 'late' ? 'late' : scadOf(w) === 'soon' ? 'soon' : 'on';
  const ST_TXT = { on: 'Attivo', soon: 'In scadenza', late: 'Scaduto', off: 'Sospeso' };
  const monthKey = d => String(d || '').slice(0, 7);
  function months12() { const o = [], d = new Date(); d.setDate(1); for (let i = 11; i >= 0; i--) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); o.push({ k: `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`, l: MESI[x.getMonth()], y: x.getFullYear() }); } return o; }

  /* ================= grafici animati (SVG) ================= */
  function bars(series, { h = 0, fmt = eur, hi = -1 } = {}) {
    const W = innerWidth < 700 ? 360 : 600, P = 26; h = h || (innerWidth < 700 ? 190 : 210);
    const max = Math.max(1, ...series.map(s => s.v)), bw = (W - P * 2) / series.length, step = niceStep(max);
    const top = Math.ceil(max / step) * step, y = v => h - 22 - (v / top) * (h - 40);
    let g = ''; for (let v = 0; v <= top + 1e-9; v += step) g += `<line x1="${P}" x2="${W - 4}" y1="${y(v)}" y2="${y(v)}"/><text x="${P - 6}" y="${y(v) + 3.5}" text-anchor="end">${v >= 1000 ? Math.round(v / 1000) + 'k' : Math.round(v)}</text>`;
    const r = series.map((s, i) => { const x = P + i * bw + bw * 0.2, ww = bw * 0.6, yy = y(s.v), hh = Math.max(s.v ? 2 : 0, h - 22 - yy); return `<g class="bar${i === hi ? ' hi' : ''}" style="--i:${i}"><rect x="${x}" y="${yy}" width="${ww}" height="${hh}" rx="4"/><rect class="hit" x="${P + i * bw}" y="0" width="${bw}" height="${h}"><title>${esc(s.t || s.l)}: ${esc(fmt(s.v))}</title></rect><text x="${x + ww / 2}" y="${h - 6}" text-anchor="middle">${esc(s.l)}</text>${s.v ? `<text class="val" x="${x + ww / 2}" y="${yy - 6}" text-anchor="middle">${esc(s.v >= 1000 ? (s.v / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 }) + 'k' : Math.round(s.v))}</text>` : ''}</g>`; }).join('');
    return `<svg class="chart bars" viewBox="0 0 ${W} ${h}" role="img"><g class="grid">${g}</g>${r}</svg>`;
  }
  function niceStep(max) { const r = max / 4, p = Math.pow(10, Math.floor(Math.log10(r))), n = r / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
  function donut(parts, center) {
    const tot = parts.reduce((a, p) => a + p.v, 0) || 1; let off = 0;
    const segs = parts.map((p, i) => { const pct = p.v / tot * 100, s = `<circle r="15.915" cx="21" cy="21" pathLength="100" stroke="${p.c}" stroke-dasharray="${Math.max(0, pct - (parts.length > 1 ? 0.8 : 0))} ${100 - pct + (parts.length > 1 ? 0.8 : 0)}" stroke-dashoffset="${-off}" style="--i:${i}"><title>${esc(p.l)}: ${p.v}</title></circle>`; off += pct; return s; }).join('');
    return `<div class="donut"><svg viewBox="0 0 42 42"><circle class="track" r="15.915" cx="21" cy="21"/>${segs}</svg><div class="donut-c">${center || ''}</div></div>`;
  }
  function spark(vals, c = 'var(--acc)') {
    if (vals.length < 2) return '';
    const W = 120, H = 34, max = Math.max(...vals, 1), min = Math.min(...vals, 0), x = i => i / (vals.length - 1) * W, y = v => H - 3 - (v - min) / (max - min || 1) * (H - 6);
    const d = vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path class="a" d="${d} L${W} ${H} L0 ${H}Z" fill="${c}"/><path class="l" d="${d}" stroke="${c}" pathLength="1"/></svg>`;
  }
  function ring(pct, label, cls = '') {
    const p = Math.max(0, Math.min(100, pct));
    return `<div class="ring ${cls}"><svg viewBox="0 0 42 42"><circle class="track" r="17" cx="21" cy="21"/><circle class="v" r="17" cx="21" cy="21" pathLength="100" stroke-dasharray="${p} 100"/></svg><div>${label}</div></div>`;
  }
  // numeri che salgono quando la pagina appare
  function countUp(root) {
    $$('[data-n]', root).forEach(el => {
      const n = Number(el.dataset.n), f = el.dataset.f === 'eur' ? eur : v => Math.round(v).toLocaleString('it-IT');
      if (RM || root.classList.contains('still') || !n) { el.textContent = f(n); return; }
      const t0 = performance.now(), dur = 900;
      const tick = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = f(n * e); if (k < 1) requestAnimationFrame(tick); };
      el.textContent = f(0); requestAnimationFrame(tick);
    });
  }
  const kpi = (lab, n, f, sub, cls = '', extra = '', go = '') => `<${go ? `a href="${go}"` : 'div'} class="kpi ${cls}"><span class="kpi-l">${lab}</span><b data-n="${n}" data-f="${f || ''}">${f === 'eur' ? eur(n) : n}</b><small>${sub}</small>${extra}</${go ? 'a' : 'div'}>`;

  /* ================= PANORAMICA ================= */
  function vHome() {
    const C = clients(), act = C.filter(w => w.stato === 'attivo'), M = months12(), P = D.pagamenti || [], y = String(new Date().getFullYear());
    const byM = M.map(m => ({ l: m.l, t: `${m.l} ${m.y}`, v: P.filter(p => monthKey(p.data) === m.k).reduce((a, p) => a + p.importo, 0) }));
    const anno = P.filter(p => String(p.data).startsWith(y)).reduce((a, p) => a + p.importo, 0), arr = act.reduce((a, w) => a + (w.canone || 0), 0);
    const U = (D.users || []).filter(u => u.ruolo !== 'admin'), live = (D.sess || []).filter(s => !s.io);
    const scad = C.filter(w => scadOf(w)).sort((a, b) => String(a.scadenza).localeCompare(String(b.scadenza)));
    const prossime = C.filter(w => okD(w.scadenza) && !scadOf(w) && daysTo(w.scadenza) <= 90).sort((a, b) => String(a.scadenza).localeCompare(String(b.scadenza)));
    const bySec = {}; C.forEach(w => { const s = secOf(w).id; bySec[s] = (bySec[s] || 0) + 1; });
    const parts = Object.entries(bySec).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ l: (SET.get(k).s || SET.get(k).n), v, c: SC[k] || SC.altro, k }));
    const piani = ['prova', 'base', 'pro'].map(k => ({ k, n: C.filter(w => w.piano === k).length }));
    const newM = M.map(m => C.filter(w => monthKey(w.creato) === m.k).length);
    const firstAcc = U.filter(u => u.cambia && u.stato === 'attivo');
    const warnV = D.v && D.v < NEED_V ? `<div class="banner warn">${ico('warn')}<div><b>Aggiorna lo script Google alla versione ${NEED_V}</b><span>Ora è la ${esc(D.v)}: pagamenti, registro e permessi funzionano dopo l'aggiornamento.</span></div></div>` : '';
    return `${warnV}
    <div class="grid kpis stag">
      ${kpi('Clienti attivi', act.length, '', `${plural(C.length - act.length, 'sospeso', 'sospesi')} · ${plural(C.filter(w => monthKey(w.creato) === M[11].k).length, 'nuovo', 'nuovi')} questo mese`, '', spark(newM), '#clienti')}
      ${kpi('Incassato nel ' + y, anno, 'eur', `${eur(byM[11].v)} questo mese`, 'acc', spark(byM.map(m => m.v), 'var(--ok)'), '#incassi')}
      ${kpi('Canoni annui attivi', arr, 'eur', act.length ? `in media ${eur(arr / act.length)} a cliente` : 'imposta il canone nei clienti', '', '', '#incassi')}
      ${kpi('Utenti', U.length, '', `${plural(live.length, 'dispositivo collegato', 'dispositivi collegati')} ora`, live.length ? 'live' : '', '', '#accessi')}
    </div>
    <div class="grid two">
      <div class="card stag-1"><div class="card-h"><h3>Incassi degli abbonamenti</h3><span class="muted">ultimi 12 mesi</span></div>${byM.some(m => m.v) ? bars(byM, { hi: 11 }) : empty('Nessun pagamento registrato', 'Quando un cliente paga, registralo dalla sua scheda o da Abbonamenti: qui vedi l\'andamento.', '<button class="btn sm" type="button" data-act="pay">Registra un pagamento</button>')}</div>
      <div class="card stag-2"><div class="card-h"><h3>Clienti per attività</h3><span class="muted">${plural(C.length, 'gestionale', 'gestionali')}</span></div>
        ${C.length ? `<div class="mix">${donut(parts, `<b data-n="${C.length}">${C.length}</b><span>clienti</span>`)}<ul class="legend">${parts.map(p => `<li style="--c:${p.c}"><i></i><span>${esc(p.l)}</span><b>${p.v}</b></li>`).join('')}</ul></div>
        <div class="plans">${piani.map(p => `<div class="plan p-${p.k}"><span>${esc(PIANI[p.k])}</span><b>${p.n}</b><i style="--w:${C.length ? p.n / C.length * 100 : 0}%"></i></div>`).join('')}</div>` : empty('Nessun cliente', 'Crea il primo gestionale con «Nuovo cliente».', '<button class="btn sm primary" type="button" data-act="new">Nuovo cliente</button>')}</div>
    </div>
    <div class="grid two">
      <div class="card stag-3"><div class="card-h"><h3>Da seguire</h3>${scad.length + firstAcc.length ? `<span class="pill warn">${scad.length + firstAcc.length}</span>` : '<span class="pill ok">tutto in ordine</span>'}</div>
        <ul class="todo">${scad.map(w => `<li><a href="#clienti/${esc(w.codice)}">${secTile(w, 'sm')}<span><b>${esc(w.nome)}</b><small class="${scadOf(w)}">${esc(scadTxt(w))}${w.canone ? ' · canone ' + eur(w.canone) : ''}</small></span></a><button class="btn sm" type="button" data-act="pay" data-ws="${esc(w.codice)}">Registra pagamento</button></li>`).join('')}
          ${firstAcc.map(u => `<li><a href="#utenti/${esc(u.email)}"><span class="av sm">${esc(ini(u.nome))}</span><span><b>${esc(u.nome)}</b><small>${u.ultimo ? 'deve ancora scegliere la sua password' : 'non è ancora entrato'} · ${esc((wsOf(u.ws) || {}).nome || '')}</small></span></a><button class="btn sm ghost" type="button" data-act="creds" data-email="${esc(u.email)}">Nuova password</button></li>`).join('')}
          ${!scad.length && !firstAcc.length ? `<li class="calm">${ico('ok')}<span>Nessun abbonamento scaduto o in scadenza nei prossimi 30 giorni.${prossime.length ? ` Il prossimo: <a href="#clienti/${esc(prossime[0].codice)}">${esc(prossime[0].nome)}</a>, ${esc(scadTxt(prossime[0]).toLowerCase())}.` : ''}</span></li>` : ''}</ul></div>
      <div class="card stag-4"><div class="card-h"><h3>Attività recente</h3><a class="muted link" href="#registro">tutto il registro</a></div>${timeline((D.registro || []).slice(0, 7))}</div>
    </div>`;
  }
  const empty = (t, s, b = '') => `<div class="empty"><svg viewBox="0 0 120 80" class="empty-art"><rect x="14" y="18" width="92" height="52" rx="8"/><path d="M14 32h92"/><circle cx="24" cy="25" r="2.2"/><circle cx="31" cy="25" r="2.2"/><path class="ln" d="M28 56l16-12 12 8 18-16 18 10"/></svg><b>${t}</b><span>${s}</span>${b}</div>`;
  function skeleton() { return `<div class="grid kpis">${'<div class="kpi sk"><i></i><i></i><i></i></div>'.repeat(4)}</div><div class="grid two"><div class="card sk tall"></div><div class="card sk tall"></div></div>`; }

  /* ================= REGISTRO ================= */
  const AZ = {
    accesso: ['Accesso', 'out', 'n'], accesso_ko: ['Password sbagliata', 'warn', 'bad'], utente_creato: ['Nuovo utente', 'user', 'acc'], utente_modificato: ['Utente modificato', 'edit', 'n'], utente_bloccato: ['Utente bloccato', 'lock', 'bad'], utente_attivato: ['Utente attivato', 'check', 'ok'], utente_eliminato: ['Utente eliminato', 'trash', 'bad'],
    password_provvisoria: ['Password provvisoria', 'key', 'n'], disconnesso: ['Disconnesso dai dispositivi', 'out', 'n'], sessione_chiusa: ['Sessione chiusa', 'out', 'n'], gestionale_creato: ['Nuovo cliente', 'bolt', 'acc'], gestionale_modificato: ['Cliente modificato', 'edit', 'n'], gestionale_sospeso: ['Cliente sospeso', 'pause', 'bad'],
    gestionale_riattivato: ['Cliente riattivato', 'play', 'ok'], gestionale_eliminato: ['Cliente eliminato', 'trash', 'bad'], gestionale_aperto: ['Gestionale aperto', 'open', 'n'], pagamento: ['Pagamento', 'pay', 'ok'], pagamento_eliminato: ['Pagamento eliminato', 'trash', 'bad'], abbonamento_rinnovato: ['Abbonamento rinnovato', 'cal', 'ok']
  };
  const REG_F = { tutto: ['Tutto', () => true], accessi: ['Accessi', a => /^accesso|sessione|disconnesso/.test(a)], clienti: ['Clienti', a => /^gestionale/.test(a)], utenti: ['Utenti', a => /^utente|password/.test(a)], pagamenti: ['Pagamenti', a => /^pagamento|abbonamento/.test(a)] };
  function timeline(L) {
    if (!L.length) return `<p class="muted small pad">Ancora niente da mostrare: qui compaiono accessi, clienti creati, pagamenti e modifiche.</p>`;
    const U = new Map((D.users || []).map(u => [String(u.email).toLowerCase(), u]));
    return `<ol class="tl">${L.map((r, i) => { const a = AZ[r.azione] || [r.azione, 'bolt', 'n'], w = wsOf(r.ws), u = U.get(String(r.chi).toLowerCase()); return `<li class="t-${a[2]}" style="--i:${i}"><span class="tl-i">${ico(a[1])}</span><div><b>${esc(a[0])}</b><span>${esc(r.dettaglio || '')}</span><small>${esc(ago(r.data))}${u ? ' · ' + esc(u.ruolo === 'admin' ? 'tu' : u.nome) : r.chi ? ' · ' + esc(r.chi) : ''}${w ? ` · <a href="#clienti/${esc(w.codice)}">${esc(w.nome)}</a>` : ''}</small></div></li>`; }).join('')}</ol>`;
  }
  function vRegistro() {
    const q = nh(F.q), f = REG_F[F.reg] || REG_F.tutto, L = (D.registro || []).filter(r => f[1](r.azione) && (!q || nh([r.chi, r.dettaglio, (AZ[r.azione] || [])[0], (wsOf(r.ws) || {}).nome].join(' ')).includes(q)));
    return `<div class="bar"><div class="chips">${Object.entries(REG_F).map(([k, [l]]) => `<button type="button" class="chip ${F.reg === k ? 'on' : ''}" data-freg="${k}">${l}</button>`).join('')}</div><label class="filter">${ico('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>')}<input type="search" id="f-q" placeholder="Filtra…" value="${esc(F.q)}"></label></div>
      <div class="card">${timeline(L.slice(0, 200))}${L.length > 200 ? `<p class="muted small pad">Mostro le 200 righe più recenti di ${L.length}.</p>` : ''}</div>
      <p class="muted small foot">Il registro tiene gli ultimi eventi nel foglio «Registro» del tuo Foglio Google principale.</p>`;
  }

  /* ================= CLIENTI ================= */
  const CLI_F = { tutti: 'Tutti', on: 'Attivi', soon: 'In scadenza', late: 'Scaduti', off: 'Sospesi', prova: 'In prova' };
  function vClienti() {
    const C = clients(), q = nh(F.q);
    const n = k => k === 'tutti' ? C.length : k === 'prova' ? C.filter(w => w.piano === 'prova').length : C.filter(w => stOf(w) === k).length;
    const L = C.filter(w => (F.cli === 'tutti' || (F.cli === 'prova' ? w.piano === 'prova' : stOf(w) === F.cli)) && (!q || nh([w.nome, w.citta, w.codice, w.email, w.referente, w.piva, secOf(w).n].join(' ')).includes(q)))
      .sort((a, b) => ({ late: 0, soon: 1, on: 2, off: 3 }[stOf(a)] - { late: 0, soon: 1, on: 2, off: 3 }[stOf(b)]) || String(b.creato).localeCompare(String(a.creato)));
    const own = (D.ws || []).filter(w => w.tipo !== 'cliente');
    return `<div class="bar"><div class="chips">${Object.entries(CLI_F).map(([k, l]) => `<button type="button" class="chip ${F.cli === k ? 'on' : ''}" data-fcli="${k}">${l}<em>${n(k)}</em></button>`).join('')}</div><label class="filter">${ico('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>')}<input type="search" id="f-q" placeholder="Nome, città, P.IVA…" value="${esc(F.q)}"></label></div>
      ${L.length ? `<div class="cards stag">${L.map((w, i) => cliCard(w, i)).join('')}</div>` : C.length ? empty('Nessun cliente con questi filtri', 'Cambia filtro o cerca un altro nome.') : empty('Ancora nessun cliente', 'Quando un cliente ha pagato, crea il suo gestionale: scegli attività, piano e sezioni, e gli mandi le credenziali.', '<button class="btn primary" type="button" data-act="new">Crea il primo cliente</button>')}
      <h4 class="sec-t">I tuoi gestionali</h4><div class="cards own">${own.map((w, i) => cliCard(w, i)).join('')}</div>
      ${window.CDC_STRESS ? `<div class="banner st-b">${ico('bolt')}<div><b>Test estremo</b><span>${stressWs() ? `«${esc(stressWs().nome)}» esiste già: puoi riempirlo di nuovo o completare un caricamento interrotto.` : 'Crea un gestionale di prova pieno di dati (3 anni, circa 57.000 righe su tutte le sezioni) per vedere come si comporta con tantissimi dati.'}</span></div><button class="btn sm" type="button" data-act="stress">${stressWs() ? 'Riempi di nuovo' : 'Crea il test'}</button></div>` : ''}`;
  }
  function cliCard(w, i) {
    const U = usersOf(w.codice), s = stOf(w), d = daysTo(w.scadenza), pct = okD(w.scadenza) ? Math.max(0, Math.min(100, d / 365 * 100)) : 100;
    const live = (D.sess || []).filter(x => x.w === w.codice && !x.io).length;
    return `<a class="cc s-${s} t-${esc(w.tipo)}" href="#clienti/${esc(w.codice)}" style="--i:${i};--c:${SC[secOf(w).id] || SC.altro}">
      <div class="cc-h">${secTile(w)}<div class="cc-n"><b>${esc(w.nome)}</b><span>${esc(secOf(w).s || secOf(w).n)}${w.citta ? ' · ' + esc(w.citta) : ''}</span></div>${w.tipo === 'cliente' ? `<span class="pill p-${esc(w.piano)}">${esc(PIANI[w.piano] || w.piano)}</span>` : `<span class="pill">${w.tipo === 'principale' ? 'Principale' : 'Demo'}</span>`}</div>
      <div class="cc-s"><span class="st st-${s}"><i></i>${w.tipo === 'cliente' ? ST_TXT[s] : w.stato === 'attivo' ? 'Attivo' : 'Sospeso'}</span><span class="muted">${esc(scadTxt(w))}</span></div>
      ${w.tipo === 'cliente' ? `<div class="meter s-${s}"><i style="--w:${pct}%"></i></div>` : ''}
      <div class="cc-f"><span class="avs">${U.slice(0, 4).map(u => `<span class="av xs" title="${esc(u.nome)}">${esc(ini(u.nome))}</span>`).join('')}${U.length > 4 ? `<span class="av xs more">+${U.length - 4}</span>` : ''}${!U.length ? '<span class="muted small">nessun utente</span>' : ''}</span>${live ? `<span class="live-dot" title="collegati ora">${live}</span>` : ''}<b>${w.canone ? eur(w.canone) + '<small>/anno</small>' : ''}</b></div>
    </a>`;
  }

  /* --- scheda cliente (pannello laterale) --- */
  let drawerKind = '', drawerId = '', dTab = 'riepilogo', wsInfo = {};
  function openClient(code) {
    const w = wsOf(code); if (!w) { toast('Gestionale non trovato', 'bad'); location.hash = '#clienti'; return; }
    drawerKind = 'cli'; if (drawerId !== code) dTab = 'riepilogo'; drawerId = code;
    showDrawer(drawerCli(w));
    if (w.tipo !== 'demo' && !(code in wsInfo)) loadWsInfo(code);
  }
  async function loadWsInfo(code) {
    try { wsInfo[code] = await post('adminWsInfo', { codice: code }); } catch (e) { wsInfo[code] = { err: e.message }; }
    if (drawerKind === 'cli' && drawerId === code && dTab === 'sezioni') refreshDrawer();
    if (drawerKind === 'usr') refreshDrawer();
  }
  function refreshDrawer() {
    if ($('#drawer').hidden) return;
    if (drawerKind === 'cli') { const w = wsOf(drawerId); if (!w) return closeDrawer(); const b = $('#drawer-in .dw-body'), y = b ? b.scrollTop : 0; $('#drawer-in').innerHTML = drawerCli(w); const nb = $('#drawer-in .dw-body'); if (nb) nb.scrollTop = y; countUp($('#drawer-in')); }
    if (drawerKind === 'usr') { const u = (D.users || []).find(x => x.email === drawerId); if (!u) return closeDrawer(); const b = $('#drawer-in .dw-body'), y = b ? b.scrollTop : 0; $('#drawer-in').innerHTML = drawerUsr(u); const nb = $('#drawer-in .dw-body'); if (nb) nb.scrollTop = y; }
  }
  function drawerCli(w) {
    const s = stOf(w), U = usersOf(w.codice), P = paysOf(w.codice).sort((a, b) => String(b.data).localeCompare(String(a.data))), tot = P.reduce((a, p) => a + p.importo, 0), cli = w.tipo === 'cliente';
    const tabs = [['riepilogo', 'Riepilogo'], ...(w.tipo !== 'demo' ? [['sezioni', 'Sezioni']] : []), ['utenti', `Utenti <em>${U.length}</em>`], ...(cli ? [['pagamenti', `Pagamenti <em>${P.length}</em>`]] : []), ['attivita', 'Attività']];
    if (!tabs.some(t => t[0] === dTab)) dTab = 'riepilogo';
    const d = daysTo(w.scadenza);
    let body = '';
    if (dTab === 'riepilogo') body = `
      <div class="dw-stats">
        ${cli ? ring(okD(w.scadenza) ? Math.max(0, d) / 365 * 100 : 100, okD(w.scadenza) ? `<b>${d < 0 ? 0 : d}</b><span>giorni</span>` : '<b>∞</b><span>senza scadenza</span>', 's-' + s) : ring(100, `<b>${U.length}</b><span>utenti</span>`)}
        <div class="dw-sg">${cli ? `<div><span>Abbonamento</span><b class="${scadOf(w)}">${esc(scadTxt(w))}</b></div><div><span>Canone annuo</span><b>${w.canone ? eur(w.canone) : '—'}</b></div><div><span>Incassato in tutto</span><b data-n="${tot}" data-f="eur">${eur(tot)}</b></div>` : ''}<div><span>Utenti</span><b>${U.length}${U.filter(u => u.sessioni).length ? ` <small class="live">· ${U.filter(u => u.sessioni).length} collegati</small>` : ''}</b></div><div><span>Creato</span><b>${esc(dIt(w.creato))}</b></div></div>
      </div>
      <form class="form" id="f-cli" data-code="${esc(w.codice)}">
        <h4>Azienda</h4>
        <div class="row"><label class="fl"><span>Ragione sociale</span><input name="nome" value="${esc(w.nome)}" required></label><label class="fl"><span>Città</span><input name="citta" value="${esc(w.citta || '')}" placeholder="Es. Roma (RM)"></label></div>
        ${cli ? `<div class="row"><label class="fl"><span>Partita IVA</span><input name="piva" value="${esc(w.piva || '')}" inputmode="numeric"></label><label class="fl"><span>Referente</span><input name="referente" value="${esc(w.referente || '')}"></label></div>
        <div class="row"><label class="fl"><span>Email</span><input name="email" type="email" value="${esc(w.email || '')}"></label><label class="fl"><span>Telefono</span><input name="telefono" value="${esc(w.telefono || '')}" inputmode="tel"></label></div>` : ''}
        <h4>Gestionale</h4>
        <div class="row"><label class="fl"><span>Attività</span><select name="settore">${SET.list.map(x => `<option value="${x.id}"${x.id === secOf(w).id ? ' selected' : ''}>${esc(x.n)}</option>`).join('')}</select></label><label class="fl"><span>Codice</span><input name="codice" value="${esc(w.codice)}" class="mono up" pattern="[A-Za-z0-9_\\-]{4,20}" required></label></div>
        ${cli ? `<div class="row three"><label class="fl"><span>Piano</span><select name="piano">${Object.entries(PIANI).map(([k, v]) => `<option value="${k}"${k === w.piano ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select></label><label class="fl"><span>Canone annuo €</span><input name="canone" type="number" min="0" step="1" value="${w.canone || ''}" inputmode="decimal"></label><label class="fl"><span>Scadenza</span><input name="scadenza" type="date" value="${esc(w.scadenza || '')}"></label></div>` : ''}
        <label class="fl"><span>Note (le vedi solo tu)</span><textarea name="note" rows="2">${esc(w.note || '')}</textarea></label>
        <div class="form-a"><button class="btn primary" type="submit">Salva modifiche</button></div>
      </form>
      ${w.tipo !== 'principale' ? `<div class="danger-z"><h4>Zona delicata</h4>
        <div class="dz"><div><b>${w.stato === 'attivo' ? 'Sospendi il gestionale' : 'Riattiva il gestionale'}</b><span>${w.stato === 'attivo' ? 'I suoi utenti non possono entrare finché non lo riattivi. I dati restano.' : 'Gli utenti possono di nuovo entrare.'}</span></div><button class="btn ${w.stato === 'attivo' ? 'warn' : ''}" type="button" data-act="wsstato">${w.stato === 'attivo' ? 'Sospendi' : 'Riattiva'}</button></div>
        <div class="dz"><div><b>Elimina il cliente</b><span>Lo togli dalla Console. ${w.url ? 'Il suo Foglio Google resta nel tuo Drive.' : ''}</span></div><button class="btn danger" type="button" data-act="wsdel">Elimina</button></div></div>` : ''}`;
    if (dTab === 'sezioni') body = modPanel(w);
    if (dTab === 'utenti') body = `<div class="dw-list">${U.map(u => usrRow(u)).join('') || '<p class="muted pad">Nessun utente in questo gestionale.</p>'}</div>${w.tipo !== 'demo' ? `<button class="btn" type="button" data-act="useradd" data-ws="${esc(w.codice)}">${ico('plus')} Aggiungi un utente</button>` : ''}`;
    if (dTab === 'pagamenti') body = `<div class="pay-h"><div><span>Incassato</span><b data-n="${tot}" data-f="eur">${eur(tot)}</b></div><button class="btn primary" type="button" data-act="pay" data-ws="${esc(w.codice)}">${ico('plus')} Registra pagamento</button></div>${P.length ? `<div class="pays">${P.map(payRow).join('')}</div>` : '<p class="muted pad">Nessun pagamento registrato per questo cliente.</p>'}`;
    if (dTab === 'attivita') body = `<div class="card flat">${timeline((D.registro || []).filter(r => r.ws === w.codice).slice(0, 60))}</div>`;
    return `<header class="dw-h" style="--c:${SC[secOf(w).id] || SC.altro}">
        <button class="ib" type="button" data-act="close" aria-label="Chiudi">${ico('x')}</button>
        <div class="dw-id">${secTile(w, 'lg')}<div><h3>${esc(w.nome)}</h3><span>${esc(secOf(w).n)}${w.citta ? ' · ' + esc(w.citta) : ''}</span><div class="dw-pills"><span class="st st-${s}"><i></i>${cli ? ST_TXT[s] : w.stato === 'attivo' ? 'Attivo' : 'Sospeso'}</span>${cli ? `<span class="pill p-${esc(w.piano)}">${esc(PIANI[w.piano])}</span>` : `<span class="pill">${w.tipo === 'principale' ? 'Il tuo gestionale' : 'Demo'}</span>`}<button class="pill code" type="button" data-copy="${esc(w.codice)}" title="Copia il codice">${esc(w.codice)} ${ico('copy')}</button></div></div></div>
        <div class="dw-act">${w.tipo !== 'demo' ? `<button class="btn primary" type="button" data-act="open">${ico('open')} Apri il gestionale</button>` : ''}${cli ? `<button class="btn" type="button" data-act="pay" data-ws="${esc(w.codice)}">${ico('pay')} Pagamento</button>` : ''}${w.url ? `<a class="btn ghost" href="${esc(w.url)}" target="_blank" rel="noopener">${ico('sheet')} Foglio Google</a>` : ''}${cli && w.email ? `<a class="btn ghost" href="mailto:${esc(w.email)}">${ico('mail')}</a>` : ''}${cli && w.telefono ? `<a class="btn ghost" href="https://wa.me/${esc(waNum(w.telefono))}" target="_blank" rel="noopener" title="WhatsApp">${ico('wa')}</a>` : ''}</div>
        <nav class="tabs">${tabs.map(([k, l]) => `<button type="button" class="${dTab === k ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</nav>
      </header><div class="dw-body">${body}</div>`;
  }
  const waNum = t => { let n = String(t || '').replace(/\D/g, ''); if (n.length === 10 && n[0] === '3') n = '39' + n; return n; };
  function modPanel(w) {
    const info = wsInfo[w.codice];
    if (!info) return '<div class="loading-b"><span class="spin"></span> Leggo le sezioni dal Foglio del cliente…</div>';
    if (info.err) return `<div class="banner bad">${ico('warn')}<div><b>Non riesco a leggere le sezioni</b><span>${esc(info.err)}</span></div><button class="btn sm" type="button" data-act="wsinfo">Riprova</button></div>`;
    const s = secOf(w), cur = modState(w);
    return `<p class="muted">Accendi o spegni le sezioni del gestionale di ${esc(w.nome)}. La modifica vale per tutti i suoi utenti; per limitare una persona sola usa i permessi nella scheda dell'utente.</p>
      <div class="always"><span>Sempre incluse</span>${(SET.sempre || []).map(x => `<em>${esc(x === 'Acquisti' ? (s.acq || x) : x)}</em>`).join('')}</div>
      <div class="mods">${SET.moduli.filter(m => !m.only || m.only === s.id).map((m, i) => `<label class="mod" style="--i:${i}"><span class="mod-t"><b>${esc(m.t(s))}</b><small>${esc(m.d(s))}</small></span><input type="checkbox" class="sw" data-mod="${m.k}"${cur[m.k] ? ' checked' : ''}></label>`).join('')}</div>`;
  }
  function modState(w) {
    const s = secOf(w), o = {}, saved = (wsInfo[w.codice] || {}).moduli || {};
    SET.moduli.forEach(m => { if (m.only && m.only !== s.id) return; o[m.k] = m.k in saved ? !!saved[m.k] : m.k in (s.mod || {}) ? !!s.mod[m.k] : true; });
    if (o.interni && !o.magazzino) o.interni = false; // i documenti interni servono il magazzino
    return o;
  }
  let modT = null;
  function modChange(inp) {
    const w = wsOf(drawerId); if (!w) return;
    const info = wsInfo[w.codice] || (wsInfo[w.codice] = {}), cur = modState(w);
    cur[inp.dataset.mod] = inp.checked;
    if (inp.dataset.mod === 'vendite' && inp.checked && !cur.clienti) { cur.clienti = true; const c = $('[data-mod="clienti"]'); if (c) c.checked = true; toast('Accesa anche «Clienti»: serve per DDT e fatture'); }
    if (inp.dataset.mod === 'interni' && inp.checked && !cur.magazzino) { cur.magazzino = true; const g = $('[data-mod="magazzino"]'); if (g) g.checked = true; toast('Accesa anche «Magazzino»: serve per i documenti interni'); }
    if (inp.dataset.mod === 'magazzino' && !inp.checked && cur.interni) { cur.interni = false; const g = $('[data-mod="interni"]'); if (g) g.checked = false; }
    info.moduli = cur;
    clearTimeout(modT); modT = setTimeout(async () => { syncState('busy'); try { const r = await post('adminWsSet', { codice: w.codice, set: { moduli: cur } }); if (r && r.users) D = r; syncState('ok'); toast('Sezioni aggiornate', 'ok'); } catch (e) { syncState('err'); if (!(e instanceof AuthError)) toast(e.message, 'bad'); } }, 600);
  }
  const payRow = p => `<div class="pay" data-pay="${esc(p.id)}"><span class="pay-d"><b>${esc(String(new Date(p.data + 'T12:00:00').getDate()))}</b><small>${esc(MESI[Number(String(p.data).slice(5, 7)) - 1] || '')} ${esc(String(p.data).slice(0, 4))}</small></span><div><b>${eur2(p.importo)}</b><span>${esc([p.metodo, p.periodo, p.note].filter(Boolean).join(' · ') || 'Pagamento')}</span>${view === 'incassi' ? `<small><a href="#clienti/${esc(p.ws)}">${esc((wsOf(p.ws) || {}).nome || p.ws)}</a></small>` : ''}</div><button class="ib sm" type="button" data-act="paydel" title="Elimina">${ico('trash')}</button></div>`;

  /* ================= UTENTI ================= */
  const UT_F = { tutti: 'Tutti', attivo: 'Attivi', live: 'Collegati ora', primo: 'Primo accesso', lettura: 'Sola lettura', bloccato: 'Bloccati' };
  const utMatch = (u, k) => k === 'tutti' || (k === 'live' ? u.sessioni > 0 : k === 'primo' ? u.cambia && u.stato === 'attivo' : k === 'lettura' ? u.ruolo === 'lettura' : u.stato === k);
  function vUtenti() {
    const U = D.users || [], q = nh(F.q);
    const L = U.filter(u => utMatch(u, F.ut) && (!q || nh([u.nome, u.email, u.azienda, u.telefono, (wsOf(u.ws) || {}).nome].join(' ')).includes(q)))
      .sort((a, b) => (a.ruolo === 'admin' ? -1 : b.ruolo === 'admin' ? 1 : 0) || (b.sessioni - a.sessioni) || String(b.ultimo || '').localeCompare(String(a.ultimo || '')));
    return `<div class="bar"><div class="chips">${Object.entries(UT_F).map(([k, l]) => `<button type="button" class="chip ${F.ut === k ? 'on' : ''}" data-fut="${k}">${l}<em>${U.filter(u => utMatch(u, k)).length}</em></button>`).join('')}</div><label class="filter">${ico('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>')}<input type="search" id="f-q" placeholder="Nome, email, azienda…" value="${esc(F.q)}"></label><button class="btn" type="button" data-act="useradd">${ico('plus')} Utente</button></div>
      ${L.length ? `<div class="table stag"><div class="tr th"><span>Persona</span><span>Gestionale</span><span>Permessi</span><span>Ultimo accesso</span><span></span></div>${L.map((u, i) => {
        const w = wsOf(u.ws), lim = u.ruolo === 'dipendente' ? 0 : Object.keys(u.sezioni || {}).length;
        return `<a class="tr" href="#utenti/${esc(u.email)}" style="--i:${i}"><span class="who"><span class="av ${u.sessioni ? 'on' : ''}">${esc(ini(u.nome || u.email))}</span><span><b>${esc(u.nome || '—')}${u.ruolo === 'admin' ? ' <em class="you">tu</em>' : ''}</b><small>${esc(u.email)}</small></span></span>
          <span class="ws">${w ? `${secTile(w, 'xs')}<span>${esc(w.nome)}</span>` : '<span class="muted">nessuno</span>'}</span>
          <span><span class="pill r-${esc(u.ruolo)}">${esc(RUOLI[u.ruolo] || u.ruolo)}</span>${lim ? `<span class="pill lim" title="Sezioni nascoste a questo utente">−${lim} sezion${lim === 1 ? 'e' : 'i'}</span>` : ''}${u.stato !== 'attivo' ? `<span class="pill bad">${u.stato === 'bloccato' ? 'Bloccato' : 'In attesa'}</span>` : u.cambia ? '<span class="pill warn">primo accesso</span>' : ''}</span>
          <span class="when">${u.sessioni ? `<span class="live">● collegato · ${plural(u.sessioni, 'dispositivo', 'dispositivi')}</span>` : esc(ago(u.ultimo))}<small>${u.accessi ? plural(u.accessi, 'accesso', 'accessi') : ''}</small></span><span class="chev">›</span></a>`; }).join('')}</div>` : empty('Nessun utente', 'Nessun risultato con questi filtri.')}
      <p class="muted small foot">«Sola lettura» vede tutto ma non può modificare. Dalla scheda di ogni utente puoi anche nascondergli singole sezioni del gestionale.</p>`;
  }
  const usrRow = u => `<a class="ur" href="#utenti/${esc(u.email)}"><span class="av ${u.sessioni ? 'on' : ''}">${esc(ini(u.nome || u.email))}</span><span><b>${esc(u.nome || u.email)}</b><small>${esc(u.email)} · ${esc(RUOLI[u.ruolo] || u.ruolo)}${u.stato !== 'attivo' ? ' · ' + esc(u.stato) : ''}</small></span><small class="muted">${u.sessioni ? '<span class="live">● collegato</span>' : esc(ago(u.ultimo))}</small></a>`;
  function openUser(email) {
    const u = (D.users || []).find(x => x.email === email); if (!u) { toast('Utente non trovato', 'bad'); location.hash = '#utenti'; return; }
    drawerKind = 'usr'; drawerId = email;
    showDrawer(drawerUsr(u));
    const w = wsOf(u.ws); if (w && w.tipo !== 'demo' && !(w.codice in wsInfo)) loadWsInfo(w.codice);
  }
  function drawerUsr(u) {
    const adm = u.ruolo === 'admin', w = wsOf(u.ws), W = (D.ws || []).filter(x => x.tipo !== 'demo' || u.ws === x.codice);
    const S = (D.sess || []).filter(s => s.e === String(u.email).toLowerCase()), A = (D.registro || []).filter(r => String(r.chi).toLowerCase() === String(u.email).toLowerCase() && /^accesso/.test(r.azione)).slice(0, 8);
    const s = w ? secOf(w) : null, cur = w ? modState(w) : {}, hid = u.sezioni || {};
    const mods = w && w.tipo !== 'demo' ? SET.moduli.filter(m => (!m.only || m.only === s.id) && cur[m.k]) : [];
    return `<header class="dw-h">
        <button class="ib" type="button" data-act="close" aria-label="Chiudi">${ico('x')}</button>
        <div class="dw-id"><span class="av lg ${u.sessioni ? 'on' : ''}">${esc(ini(u.nome || u.email))}</span><div><h3>${esc(u.nome || u.email)}</h3><span>${esc(u.email)}${u.telefono ? ' · ' + esc(u.telefono) : ''}</span><div class="dw-pills"><span class="st st-${u.stato === 'attivo' ? 'on' : 'off'}"><i></i>${u.stato === 'attivo' ? 'Attivo' : u.stato === 'bloccato' ? 'Bloccato' : 'In attesa'}</span><span class="pill r-${esc(u.ruolo)}">${esc(RUOLI[u.ruolo] || u.ruolo)}</span>${u.cambia ? '<span class="pill warn">primo accesso da fare</span>' : ''}</div></div></div>
        ${adm ? '' : `<div class="dw-act"><a class="btn ghost" href="mailto:${esc(u.email)}">${ico('mail')} Email</a>${u.telefono ? `<a class="btn ghost" href="https://wa.me/${esc(waNum(u.telefono))}" target="_blank" rel="noopener">${ico('wa')} WhatsApp</a>` : ''}${w ? `<a class="btn ghost" href="#clienti/${esc(w.codice)}">${secTile(w, 'xs')} ${esc(w.nome)}</a>` : ''}</div>`}
      </header>
      <div class="dw-body">
      ${adm ? `<div class="banner">${ico('shield')}<div><b>Amministratore</b><span>Sei tu: puoi entrare in tutti i gestionali e nella Console. Nome e password li cambi da Impostazioni.</span></div></div>` : `
      <form class="form" id="f-usr" data-email="${esc(u.email)}">
        <h4>Dati</h4>
        <div class="row"><label class="fl"><span>Nome e cognome</span><input name="nome" value="${esc(u.nome || '')}" required></label><label class="fl"><span>Telefono</span><input name="telefono" value="${esc(u.telefono || '')}" inputmode="tel"></label></div>
        <label class="fl"><span>Gestionale</span><select name="ws">${u.ws ? '' : '<option value="" selected>— Nessuno</option>'}${W.map(x => `<option value="${esc(x.codice)}"${x.codice === u.ws ? ' selected' : ''}>${esc(x.nome)} · ${esc(x.codice)}</option>`).join('')}</select></label>
        <h4>Permessi</h4>
        <div class="seg" role="radiogroup">${[['utente', 'Può modificare', 'Inserisce e modifica i dati'], ['lettura', 'Sola lettura', 'Vede tutto, non modifica nulla'], ...(u.ruolo === 'dipendente' ? [['dipendente', 'Dipendente', 'Permessi decisi dal titolare nella sezione Dipendenti']] : [])].map(([k, l, d]) => `<label class="seg-o"><input type="radio" name="ruolo" value="${k}"${u.ruolo === k || (k === 'utente' && !['utente', 'lettura', 'dipendente'].includes(u.ruolo)) ? ' checked' : ''}><span><b>${l}</b><small>${d}</small></span></label>`).join('')}</div>
        <div class="seg" role="radiogroup">${[['attivo', 'Può entrare', 'Accesso consentito'], ['bloccato', 'Bloccato', 'Viene disconnesso subito']].map(([k, l, d]) => `<label class="seg-o ${k}"><input type="radio" name="stato" value="${k}"${(u.stato === k || (k === 'bloccato' && u.stato === 'attesa')) ? ' checked' : ''}><span><b>${l}</b><small>${d}</small></span></label>`).join('')}</div>
        ${w && w.tipo !== 'demo' ? `<h4>Sezioni che può vedere</h4>${!wsInfo[w.codice] ? '<div class="loading-b"><span class="spin"></span> Leggo le sezioni del gestionale…</div>' : mods.length ? `<div class="mods compact">${mods.map(m => `<label class="mod"><span class="mod-t"><b>${esc(m.t(s))}</b></span><input type="checkbox" class="sw" name="sez_${m.k}"${hid[m.k] === false ? '' : ' checked'}></label>`).join('')}</div><p class="muted small">Le sezioni spente nel gestionale di ${esc(w.nome)} non compaiono qui: si accendono dalla scheda del cliente.</p>` : '<p class="muted small">Il gestionale non ha sezioni facoltative accese.</p>'}` : ''}
        <label class="fl"><span>Note (le vedi solo tu)</span><textarea name="note" rows="2">${esc(u.note || '')}</textarea></label>
        <div class="form-a"><button class="btn primary" type="submit">Salva</button></div>
      </form>
      <h4>Sicurezza</h4>
      <div class="sec-acts">
        <button class="act" type="button" data-act="creds" data-email="${esc(u.email)}">${ico('key')}<span><b>Password provvisoria</b><small>Ne crei una nuova da mandargli; al primo accesso la cambia</small></span></button>
        <button class="act" type="button" data-act="kick" data-email="${esc(u.email)}"${u.sessioni ? '' : ' disabled'}>${ico('out')}<span><b>Disconnetti da tutti i dispositivi</b><small>${u.sessioni ? plural(u.sessioni, 'dispositivo collegato', 'dispositivi collegati') : 'nessun dispositivo collegato ora'}</small></span></button>
        <button class="act danger" type="button" data-act="userdel" data-email="${esc(u.email)}">${ico('trash')}<span><b>Elimina l'utente</b><small>Non potrà più entrare; i dati del gestionale restano</small></span></button>
      </div>`}
      <h4>Dispositivi collegati</h4>${S.length ? `<div class="dw-list">${S.map(sessRow).join('')}</div>` : '<p class="muted small">Nessuno in questo momento.</p>'}
      <h4>Ultimi accessi</h4>${A.length ? `<ul class="mini">${A.map(r => `<li class="${r.azione === 'accesso_ko' ? 'bad' : ''}"><span>${r.azione === 'accesso_ko' ? 'Password sbagliata' : 'Entrato'}${r.dettaglio && r.azione === 'accesso' ? ' · ' + esc(r.dettaglio) : ''}</span><small>${esc(when(r.data))}</small></li>`).join('')}</ul>` : `<p class="muted small">${u.ultimo ? 'Ultimo accesso ' + esc(ago(u.ultimo)) + '.' : 'Non è ancora entrato.'} ${u.accessi ? plural(u.accessi, 'accesso', 'accessi') + ' in tutto.' : ''}</p>`}
      <p class="muted small foot">Creato il ${esc(dIt(u.creato))}.</p>
      </div>`;
  }
  const sessRow = s => { const u = (D.users || []).find(x => String(x.email).toLowerCase() === s.e), w = wsOf(s.w); return `<div class="sess" data-sess="${esc(s.id)}"><span class="sess-i">${ico('dev')}</span><div><b>${esc(s.d || 'Dispositivo')}${s.io ? ' <em class="you">questo</em>' : ''}</b><span>${view === 'accessi' ? esc(u ? u.nome : s.e) + ' · ' : ''}${esc(w ? w.nome : s.w)}</span><small>entrato ${esc(ago(s.a))} · scade ${esc(dIt(s.x))}</small></div>${s.io ? '' : `<button class="btn sm ghost" type="button" data-act="sessdrop">Chiudi</button>`}</div>`; };

  /* ================= ABBONAMENTI ================= */
  function vIncassi() {
    const C = clients(), P = (D.pagamenti || []).slice().sort((a, b) => String(b.data).localeCompare(String(a.data))), M = months12(), y = String(new Date().getFullYear()), m = M[11].k;
    const byM = M.map(x => ({ l: x.l, t: `${x.l} ${x.y}`, v: P.filter(p => monthKey(p.data) === x.k).reduce((a, p) => a + p.importo, 0) }));
    const anno = P.filter(p => String(p.data).startsWith(y)).reduce((a, p) => a + p.importo, 0), mese = byM[11].v;
    const arr = C.filter(w => w.stato === 'attivo').reduce((a, w) => a + (w.canone || 0), 0), due = C.filter(w => scadOf(w));
    const dueV = due.reduce((a, w) => a + (w.canone || 0), 0);
    const up = C.filter(w => okD(w.scadenza)).sort((a, b) => String(a.scadenza).localeCompare(String(b.scadenza))).slice(0, 8);
    return `<div class="grid kpis stag">
        ${kpi('Incassato nel ' + y, anno, 'eur', `${plural(P.filter(p => String(p.data).startsWith(y)).length, 'pagamento', 'pagamenti')}`, 'acc')}
        ${kpi('Questo mese', mese, 'eur', MESI[new Date().getMonth()] + ' ' + y)}
        ${kpi('Canoni annui attivi', arr, 'eur', `${plural(C.filter(w => w.stato === 'attivo').length, 'cliente attivo', 'clienti attivi')}`)}
        ${kpi('Da rinnovare', dueV, 'eur', `${plural(due.length, 'abbonamento scaduto o in scadenza', 'abbonamenti scaduti o in scadenza')}`, due.length ? 'warn' : '')}
      </div>
      <div class="grid two wide-l">
        <div class="card"><div class="card-h"><h3>Incassi per mese</h3><button class="btn sm primary" type="button" data-act="pay">${ico('plus')} Registra pagamento</button></div>${byM.some(x => x.v) ? bars(byM, { hi: 11 }) : empty('Ancora nessun incasso', 'Registra i pagamenti dei clienti: con «rinnova» la scadenza va avanti di un anno da sola.')}</div>
        <div class="card"><div class="card-h"><h3>Scadenze</h3></div>${up.length ? `<ul class="todo">${up.map(w => `<li><a href="#clienti/${esc(w.codice)}">${secTile(w, 'sm')}<span><b>${esc(w.nome)}</b><small class="${scadOf(w)}">${esc(scadTxt(w))}</small></span></a><span class="amt">${w.canone ? eur(w.canone) : ''}</span></li>`).join('')}</ul>` : '<p class="muted small pad">Nessun abbonamento con scadenza.</p>'}</div>
      </div>
      <div class="card"><div class="card-h"><h3>Pagamenti</h3><span class="muted">${P.length}</span></div>${P.length ? `<div class="pays">${P.slice(0, 120).map(payRow).join('')}</div>` : '<p class="muted small pad">Nessun pagamento registrato.</p>'}</div>`;
  }

  /* ================= ACCESSI ================= */
  function vAccessi() {
    const S = (D.sess || []).slice().sort((a, b) => String(b.a).localeCompare(String(a.a))), R = (D.registro || []).filter(r => /^accesso/.test(r.azione)).slice(0, 40), ko = R.filter(r => r.azione === 'accesso_ko').length;
    return `<div class="grid kpis three stag">
        ${kpi('Dispositivi collegati', S.filter(s => !s.io).length, '', 'escluso questo', S.filter(s => !s.io).length ? 'live' : '')}
        ${kpi('Persone collegate', new Set(S.filter(s => !s.io).map(s => s.e)).size, '', 'con almeno un dispositivo')}
        ${kpi('Password sbagliate', ko, '', 'negli ultimi accessi', ko ? 'warn' : '')}
      </div>
      <div class="grid two">
        <div class="card"><div class="card-h"><h3>Collegati adesso</h3>${S.filter(s => !s.io).length ? '<button class="btn sm ghost" type="button" data-act="kickall">Chiudi tutte le altre</button>' : ''}</div>${S.length ? `<div class="dw-list">${S.map(sessRow).join('')}</div>` : '<p class="muted small pad">Nessuno.</p>'}</div>
        <div class="card"><div class="card-h"><h3>Ultimi accessi</h3><a class="muted link" href="#registro" data-freg-go="accessi">registro</a></div>${timeline(R.slice(0, 14))}</div>
      </div>
      <p class="muted small foot">Una sessione dura 60 giorni dall'ultimo accesso con password. Dopo 5 password sbagliate l'account si blocca per 15 minuti.</p>`;
  }

  /* ================= TEAM (agenti) ================= */
  // I report li scrivono gli agenti (attività programmate) nella cartella Drive «Centro di Costo - Team»; li legge lo script separato TEAM_URL (team.gs), indipendente da Code.gs.
  const AGENTI = [
    { k: 'guardiano', n: 'Guardiano', r: 'Ogni mattina prova app, demo, Console e Presenze e controlla i backup', ic: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z"/><path d="m8.8 12 2.2 2.2 4.4-4.4"/>' },
    { k: 'informatico', n: 'Informatico', r: 'Ogni settimana rivede codice, sicurezza e velocità', ic: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>' },
    { k: 'commerciale', n: 'Commerciale', r: 'Trova aziende adatte e prepara le email da mandare', ic: '<path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/>' },
    { k: 'marketing', n: 'Marketing', r: 'Idee per post, testi e confronto con la concorrenza', ic: '<path d="M4 10v4l11 5V5z"/><path d="M15 9a3 3 0 0 1 0 6M7 14l1 5h3"/>' },
    { k: 'grafico', n: 'Grafico', r: 'Schermate, animazioni e presentazione, su richiesta', ic: '<circle cx="12" cy="12" r="8.5"/><circle cx="8.5" cy="10" r="1.2"/><circle cx="12" cy="7.5" r="1.2"/><circle cx="15.5" cy="10" r="1.2"/><path d="M12 20.5c-1.5 0-2-1-2-2 0-1.3 1-2 2.2-2H14a3 3 0 0 0 3-3"/>' }
  ];
  const TEAM_URL = 'https://script.google.com/macros/s/AKfycbzzTczF9lPzqEx57olsxpO6XHZK9lQSZsbX1cSwzXN-0DauWYYijZzKJpX4D3Lu2Qg/exec'; // script Google separato «Centro di Costo - Team» (team.gs): non dipende da Code.gs
  const ST_T = { ok: 'Tutto ok', warn: 'Da controllare', bad: 'Problema' };
  let T = null, tErr = '', tBusy = false, tSel = 'guardiano';
  async function loadTeam(force) {
    if (tBusy || (T && !force)) return; tBusy = true;
    try {
      if (!TEAM_URL) throw new Error('Lo script del Team non è ancora collegato.');
      let r; try { r = await fetch(TEAM_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'report', token: tok }), credentials: 'omit', referrerPolicy: 'no-referrer' }); } catch { throw new Error('Connessione assente'); }
      const j = await r.json().catch(() => ({ ok: false, error: 'Risposta non valida dallo script del Team' }));
      if (!j.ok) throw new Error(j.error || 'Errore');
      T = j.result; tErr = '';
    }
    catch (e) { tErr = e.message; T = T || { report: [] }; }
    finally { tBusy = false; }
    if (view === 'team') render(); else badges();
  }
  const tRep = k => ((T && T.report) || []).filter(r => r && r.agente === k).sort((a, b) => String(b.data).localeCompare(String(a.data)));
  /* ---- chat con l'agente (pannello a destra della scena, come nel video) ---- */
  let tChat = LS.get('cdcx_tchat', {}), tChatBusy = '';
  const tcSave = () => { const o = {}; Object.keys(tChat).forEach(k => o[k] = tChat[k].slice(-16)); LS.set('cdcx_tchat', o); };
  const tcHtml = t => esc(t).replace(/\n/g, '<br>');
  function tcMsgs(k) {
    const a = AGENTI.find(x => x.k === k), r = tRep(k)[0], L = tChat[k] || [];
    const hi = r ? `Ciao, sono ${a.n}. Ultimo report: «${r.titolo || ST_T[r.stato] || ''}» (${ago(r.data)}). Chiedimi pure.` : `Ciao, sono ${a.n}. Non sono ancora partito: appena avrò un report potrò risponderti sui risultati.`;
    return `<div class="tc-m a">${tcHtml(hi)}</div>` + L.map(m => `<div class="tc-m ${m.r === 'u' ? 'u' : m.r === 'e' ? 'e' : 'a'}">${tcHtml(m.t)}</div>`).join('') + (tChatBusy === k ? '<div class="tc-m a typ"><i></i><i></i><i></i></div>' : '');
  }
  function tcPaint(k) { const b = $('#tc-list'); if (!b || b.dataset.k !== k) return; b.innerHTML = tcMsgs(k); b.scrollTop = b.scrollHeight; const f = $('#tm-chat'); if (f) f.querySelector('button[type=submit]').disabled = tChatBusy === k; }
  function tcPanel(k) {
    const a = AGENTI.find(x => x.k === k), r = tRep(k)[0], st = r ? r.stato : 'off';
    return `<aside class="card tm-chat"><div class="tc-h"><span class="tm-ic st-${st}"><svg viewBox="0 0 24 24">${a.ic}</svg></span><div><b>${a.n}</b><small>${esc(a.r)}</small></div></div>
      <div class="tc-list" id="tc-list" data-k="${k}">${tcMsgs(k)}</div>
      <div class="tc-q">${['Cosa hai trovato?', 'Cosa devo fare per primo?'].map(q => `<button type="button" data-tcq="${esc(q)}">${esc(q)}</button>`).join('')}</div>
      <form id="tm-chat" class="tc-f" autocomplete="off"><input name="m" maxlength="400" placeholder="Scrivi a ${a.n}…" aria-label="Messaggio"><button class="btn sm" type="submit">Invia</button></form></aside>`;
  }
  async function tcSend(k, text) {
    text = String(text || '').trim(); if (!text || tChatBusy) return;
    const L = tChat[k] = tChat[k] || []; L.push({ r: 'u', t: text }); tChatBusy = k; tcSave(); tcPaint(k);
    try {
      const hist = L.filter(m => m.r !== 'e').slice(-10).map(m => ({ role: m.r === 'u' ? 'user' : 'assistant', content: m.t }));
      const ac = new AbortController(), to = setTimeout(() => ac.abort(), 45000); let r; try { r = await fetch(TEAM_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'chat', token: tok, agente: k, messaggi: hist }), credentials: 'omit', referrerPolicy: 'no-referrer', signal: ac.signal }); } catch (e) { throw new Error(e && e.name === 'AbortError' ? 'L\'agente non risponde (oltre 45 secondi): controlla di aver pubblicato la nuova versione dello script' : 'Connessione assente'); } finally { clearTimeout(to); }
      const j = await r.json().catch(() => ({ ok: false, error: 'Risposta non valida dallo script del Team' }));
      if (!j.ok) throw new Error(/sconosciuta/i.test(j.error || '') ? 'Aggiorna lo script del Team all\'ultima versione (team.gs)' : j.error || 'Errore');
      L.push({ r: 'a', t: j.result.testo || '…' });
    } catch (e) { L.push({ r: 'e', t: e.message }); }
    tChatBusy = ''; tcSave(); tcPaint(k);
  }
  function tcBind() {
    const f = $('#tm-chat'); if (!f || f._b) return; f._b = 1; const k = $('#tc-list').dataset.k;
    f.addEventListener('submit', ev => { ev.preventDefault(); const i = f.m; const t = i.value; i.value = ''; tcSend(k, t); });
    $$('[data-tcq]').forEach(b => b.addEventListener('click', () => tcSend(k, b.dataset.tcq)));
    const l = $('#tc-list'); l.scrollTop = l.scrollHeight; if (innerWidth > 900 && !tChatBusy) f.m.focus({ preventScroll: true });
  }
  // Ufficio 3D (team3d.js + three.js, caricati solo quando serve). Se il dispositivo non ha WebGL restano le schede.
  let tFocus = '';
  function tmLoad(src) { return new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
  async function tmMount() {
    tcBind();
    const box = $('#tm3d'); if (!box) return;
    try {
      if (!window.THREE) await tmLoad('../lib-three.min.js?v=160');
      if (!window.TM3D) await tmLoad('team3d.js?v=4');
      if (!TM3D.ok()) throw 0;
      TM3D.onPick = k => { tFocus = k; if (k) tSel = k; render(); };
      const b2 = $('#tm3d'); if (!b2) return;
      const ag = AGENTI.map(a => { const r = tRep(a.k)[0]; return { k: a.k, n: a.n, on: !!r, st: r ? r.stato : 'off', ago: r ? esc(ago(r.data)) : '' }; }), n = x => ag.filter(a => a.st === x).length, h = new Date().getHours(), nome = String((me && me.nome) || 'Dario').split(' ')[0];
      const bits = []; if (n('ok')) bits.push(`${n('ok')} ${n('ok') === 1 ? 'agente ha finito' : 'agenti hanno finito'}`); if (n('warn') + n('bad')) bits.push(`${n('warn') + n('bad')} ${n('warn') + n('bad') === 1 ? 'ha trovato qualcosa' : 'hanno trovato qualcosa'}`); if (n('off')) bits.push(`${n('off')} ${n('off') === 1 ? 'deve ancora partire' : 'devono ancora partire'}`);
      TM3D.show(b2, { sel: tFocus, agents: ag, stats: { ok: n('ok'), warn: n('warn'), bad: n('bad'), off: n('off') }, head: { t: `${h < 13 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera'}, ${esc(nome)}`, s: esc(bits.join(' · ')) } });
    } catch { const x = $('#tm3d'); if (x) x.remove(); }
  }
  function vTeam() {
    setTimeout(tmMount, 0);
    if (!T) { loadTeam(); return `<div class="card"><p class="muted small pad">Carico i report…</p></div>`; }
    const agent = AGENTI.find(a => a.k === tSel) || AGENTI[0], L = tRep(agent.k), last = L[0];
    const cards = AGENTI.map(a => {
      const r = tRep(a.k)[0], on = !!r, st = on ? r.stato : 'off';
      return `<button type="button" class="tm-a ${a.k === agent.k ? 'on' : ''} ${on ? '' : 'off'}" data-tm="${a.k}">
        <span class="tm-ic st-${st}"><svg viewBox="0 0 24 24">${a.ic}</svg></span>
        <span class="tm-t"><b>${a.n}</b><small>${on ? esc(r.titolo || ST_T[r.stato] || '') : 'Da attivare'}</small></span>
        <i class="tm-dot st-${st}" title="${on ? ST_T[st] || '' : 'Da attivare'}"></i></button>`;
    }).join('');
    const voci = last ? `<ul class="tm-v">${(last.voci || []).map(v => `<li class="st-${esc(v.stato)}"><i></i><div><b>${esc(v.testo)}</b>${v.dettaglio ? `<small>${esc(v.dettaglio)}</small>` : ''}</div></li>`).join('')}</ul>` : '';
    const storia = L.length > 1 ? `<div class="card"><div class="card-h"><h3>Ultimi controlli</h3><span class="muted">${L.length}</span></div>
        <div class="tm-strip">${L.slice(0, 30).reverse().map(r => `<i class="st-${esc(r.stato)}" title="${esc(when(r.data))} · ${esc(r.titolo || '')}"></i>`).join('')}</div>
        <ul class="mini">${L.slice(1, 8).map(r => `<li class="${r.stato === 'bad' ? 'bad' : ''}"><span>${esc(r.titolo || ST_T[r.stato] || '')}</span><small>${esc(when(r.data))}</small></li>`).join('')}</ul></div>` : '';
    const main = last
      ? `<div class="card"><div class="card-h"><h3>${esc(last.titolo || ST_T[last.stato] || 'Report')}</h3><span class="pill ${esc(last.stato)}">${ST_T[last.stato] || ''}</span></div>
          <p class="muted small tm-when">${esc(when(last.data))}${last.durata ? ` · ${last.durata} s` : ''}</p>${voci}</div>${storia}`
      : `<div class="card">${empty(`${agent.n}: da attivare`, esc(agent.r) + '. Chiedi a Claude di attivarlo: qui vedrai i suoi report.')}</div>`;
    return `${tErr ? `<div class="card flat tm-err"><b>Report non disponibili.</b> <span class="muted small">${esc(tErr)}</span></div>` : ''}
      <div class="tm-split ${tFocus ? 'on' : ''}"><div class="tm3d" id="tm3d"></div>${tFocus ? tcPanel(tFocus) : ''}</div><div class="tm-grid">${cards}</div>
      <div class="tm-head"><div><h3>${agent.n}</h3><p class="muted small">${esc(agent.r)}</p></div><button class="btn sm ghost" type="button" data-act="tmreload">Aggiorna</button></div>
      ${main}
      <p class="muted small foot">Gli agenti lavorano su Claude, non sul tuo server: non rallentano il gestionale. Leggono solo la demo e i file del sito, mai i dati dei clienti.</p>`;
  }

  /* ================= IMPOSTAZIONI ================= */
  function vImpost() {
    const th = LS.get('cdcx_theme', 'auto'), app = D.app || new URL('../', location.href).href, con = new URL('./', location.href).href;
    return `<div class="grid two">
      <div class="card"><div class="card-h"><h3>Il tuo account</h3></div>
        <form class="form" id="f-me"><div class="row"><label class="fl"><span>Nome</span><input name="nome" value="${esc(me.nome || '')}"></label><label class="fl"><span>Telefono</span><input name="telefono" value="${esc(me.telefono || '')}"></label></div>
        <label class="fl"><span>Email di accesso</span><input value="${esc(me.email)}" disabled></label><div class="form-a"><button class="btn" type="submit">Salva</button></div></form>
        <form class="form" id="f-pw"><h4>Cambia password</h4><label class="fl"><span>Password attuale</span><input name="old" type="password" autocomplete="current-password" required></label><div class="row"><label class="fl"><span>Nuova password</span><input name="n1" type="password" autocomplete="new-password" minlength="8" required></label><label class="fl"><span>Ripeti</span><input name="n2" type="password" autocomplete="new-password" minlength="8" required></label></div><div class="form-a"><button class="btn" type="submit">Cambia password</button></div></form>
      </div>
      <div class="card"><div class="card-h"><h3>Console</h3></div>
        <div class="set-r"><div><b>Aspetto</b><small>Chiaro, scuro o come il dispositivo</small></div><div class="segm">${[['auto', 'Auto'], ['light', 'Chiaro'], ['dark', 'Scuro']].map(([k, l]) => `<button type="button" data-theme="${k}" class="${th === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
        <div class="set-r"><div><b>Indirizzo del gestionale</b><small>${esc(app)}</small></div><button class="btn sm ghost" type="button" data-copy="${esc(app)}">${ico('copy')} Copia</button></div>
        <div class="set-r"><div><b>Indirizzo della Console</b><small>${esc(con)} · non darlo ai clienti</small></div><button class="btn sm ghost" type="button" data-copy="${esc(con)}">${ico('copy')} Copia</button></div>
        <div class="set-r"><div><b>Script Google</b><small>versione ${esc(D.v || 'precedente alla cdc-4.7')}${D.v && D.v >= NEED_V ? ' · aggiornato' : ' · da aggiornare'}</small></div><span class="pill ${D.v && D.v >= NEED_V ? 'ok' : 'warn'}">${D.v && D.v >= NEED_V ? 'OK' : 'Aggiorna'}</span></div>
        <div class="set-r"><div><b>Esci dalla Console</b><small>Su questo dispositivo</small></div><button class="btn sm" type="button" data-act="logout">${ico('out')} Esci</button></div>
        <p class="muted small">Sul telefono puoi aggiungere la Console alla schermata Home: si apre come un'app separata dal gestionale.</p>
      </div></div>`;
  }

  /* ================= pannello laterale ================= */
  function showDrawer(html) {
    const dw = $('#drawer'), first = dw.hidden;
    $('#drawer-in').innerHTML = html; dw.hidden = false; countUp($('#drawer-in'));
    if (first) { dw.classList.remove('in'); void dw.offsetWidth; dw.classList.add('in'); document.body.classList.add('dw-open'); }
  }
  function closeDrawer(silent) {
    const dw = $('#drawer'); if (dw.hidden) return;
    drawerKind = ''; drawerId = ''; document.body.classList.remove('dw-open');
    const fin = () => { dw.hidden = true; dw.classList.remove('out'); };
    if (RM || silent === true) fin(); else { dw.classList.add('out'); setTimeout(fin, 220); }
    if (silent !== true && location.hash.includes('/')) history.replaceState(null, '', '#' + view);
  }

  /* ================= finestre ================= */
  let mOk = null;
  function modal(title, body, ok, opt = {}) {
    const c = $('#modal-card');
    c.className = 'modal-card' + (opt.wide ? ' wide' : '') + (opt.cls ? ' ' + opt.cls : '');
    c.innerHTML = `<form id="m-form" novalidate><header><h3>${title}</h3><button class="ib" type="button" data-act="mclose" aria-label="Chiudi">${ico('x')}</button></header><div class="m-body">${body}</div>${opt.noFoot ? '' : `<footer>${opt.cancel === false ? '' : `<button class="btn ghost" type="button" data-act="mclose">${opt.cancel || 'Annulla'}</button>`}<button class="btn ${opt.danger ? 'danger' : 'primary'}" type="submit" id="m-ok">${opt.okLabel || 'Salva'}</button></footer>`}</form>`;
    mOk = ok; const m = $('#modal'); m.hidden = false; m.classList.remove('in'); void m.offsetWidth; m.classList.add('in');
    setTimeout(() => { const f = $('[data-focus]', c) || $('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea', c); if (f && innerWidth > 700) f.focus(); }, 60);
    return c;
  }
  function closeModal() { const m = $('#modal'); if (m.hidden) return; m.hidden = true; mOk = null; $('#modal-card').innerHTML = ''; }
  const ask = (title, text, okLabel = 'Conferma', danger = false) => new Promise(res => { modal(title, `<p class="ask">${text}</p>`, () => { res(true); return true; }, { okLabel, danger, cls: 'small' }); $('#modal')._res = () => res(false); });

  /* ================= azioni ================= */
  async function openWs(code) {
    const w = wsOf(code); if (!w) return;
    const q = LS.get('cdc_queue', []);
    if (q && q.length && !(await ask('Modifiche non inviate', `Nel gestionale aperto su questo dispositivo ci sono ${q.length} modifiche non ancora salvate: aprendo ${esc(w.nome)} andranno perse. Continuare?`, 'Apri comunque', true))) return;
    if (stressRun && !stressRun.end && !(await ask('Il test estremo sta caricando', `Aprendo ${esc(w.nome)} adesso il caricamento dei dati si ferma. Potrai riprenderlo da dove era con «Riempi di nuovo». Aprire comunque?`, 'Apri comunque', true))) return;
    // v117: nella Console installata come app (Dock del Mac, Home del telefono) una nuova scheda non esiste:
    // window.open apriva una pagina bianca al posto della Console. Lì il gestionale si apre nella stessa finestra.
    const win = APPWIN ? null : window.open('about:blank', '_blank');
    busy(`Apro ${w.nome}…`);
    try {
      const r = await post('adminOpen', { codice: code });
      LS.set('cdc_tok', r.token); LS.set('cdc_me', r.user); LS.set('cdc_queue', []); LS.del('cdc_data');
      const dest = new URL('../#home', location.href).href;
      if (stressRun && !stressRun.end) stressRun.stop = true;
      if (win && !win.closed) { win.location.href = dest; busy(); toast(`${w.nome} aperto in una nuova scheda`, 'ok'); }
      else { busy(`Apro ${w.nome}…`); location.href = dest; }
    } catch (e) { busy(); if (win) win.close(); if (!(e instanceof AuthError)) toast(e.message, 'bad'); }
  }
  function payForm(code) {
    const C = clients(); if (!C.length) return toast('Prima crea un cliente');
    const w0 = wsOf(code) || C.find(w => scadOf(w)) || C[0];
    const per = w => { const base = okD(w.scadenza) && w.scadenza > today() ? w.scadenza : today(), d = pD(base); d.setFullYear(d.getFullYear() + 1); return `${dIt(base)} → ${dIt(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)}`; };
    const c = modal('Registra un pagamento', `
      <label class="fl"><span>Cliente</span><select name="ws" id="p-ws">${C.map(w => `<option value="${esc(w.codice)}"${w.codice === w0.codice ? ' selected' : ''}>${esc(w.nome)}</option>`).join('')}</select></label>
      <div class="row"><label class="fl"><span>Importo €</span><input name="importo" type="number" min="0" step="0.01" inputmode="decimal" required value="${w0.canone || ''}" data-focus></label><label class="fl"><span>Data</span><input name="data" type="date" value="${today()}" required></label></div>
      <div class="row"><label class="fl"><span>Metodo</span><select name="metodo">${['Bonifico', 'Contanti', 'Carta', 'PayPal', 'Satispay', 'Altro'].map(x => `<option>${x}</option>`).join('')}</select></label><label class="fl"><span>Riferimento</span><input name="periodo" placeholder="es. canone 2027, fattura 12"></label></div>
      <label class="check big"><input type="checkbox" name="rinnova" checked><span><b>Rinnova l'abbonamento di un anno</b><small id="p-per">${esc(per(w0))}</small></span></label>
      <label class="fl"><span>Note</span><input name="note"></label>`, async fd => {
      const o = { ws: fd.get('ws'), importo: Number(String(fd.get('importo')).replace(',', '.')), data: fd.get('data'), metodo: fd.get('metodo'), periodo: String(fd.get('periodo') || '').trim(), note: String(fd.get('note') || '').trim(), rinnova: fd.get('rinnova') === 'on' };
      if (!(o.importo > 0)) return toast('Scrivi l\'importo', 'bad');
      const r = await act('adminPay', o, o.rinnova ? 'Pagamento registrato · abbonamento rinnovato' : 'Pagamento registrato', 'Registro il pagamento…');
      if (r && !RM) burst($('#view'));
      return !!r;
    }, { okLabel: 'Registra' });
    $('#p-ws', c).onchange = e => { const w = wsOf(e.target.value); $('#p-per', c).textContent = per(w); const i = $('[name=importo]', c); if (w.canone) i.value = w.canone; };
  }
  async function credsReset(email) {
    const u = (D.users || []).find(x => x.email === email); if (!u) return;
    if (!(await ask('Password provvisoria', `Creare una nuova password provvisoria per <b>${esc(u.nome || u.email)}</b>? Quella attuale smette di funzionare e viene disconnesso.`, 'Crea password'))) return;
    const r = await act('adminResetPw', { email }, '', 'Creo la password…'); if (!r || !r.pw) return;
    showCreds({ email, pw: r.pw, inviata: r.inviata, wsNome: (wsOf(u.ws) || {}).nome || '', nome: u.nome }, 'Nuova password provvisoria');
  }
  function credMsg(r) { const link = D.app || new URL('../', location.href).href; return `Ciao${r.nome ? ' ' + String(r.nome).split(' ')[0] : ''}, il tuo gestionale «${r.wsNome || ''}» è pronto.\nApri: ${link}\nEmail: ${r.email}\nPassword provvisoria: ${r.pw}\nAl primo accesso sceglierai una password tua.`; }
  function credBlock(r) {
    const link = D.app || new URL('../', location.href).href, msg = credMsg(r), tel = r.telefono ? waNum(r.telefono) : '';
    return `<div class="cred"><div><span>Indirizzo</span><b>${esc(link)}</b></div><div><span>Email</span><b>${esc(r.email)}</b></div><div><span>Password provvisoria</span><b class="mono pw">${esc(r.pw)}</b></div></div>
      <div class="cred-a"><button class="btn primary" type="button" data-copy="${esc(msg)}">${ico('copy')} Copia il messaggio</button><a class="btn" href="https://wa.me/${tel}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">${ico('wa')} WhatsApp</a><a class="btn" href="mailto:${esc(r.email)}?subject=${encodeURIComponent('Il tuo gestionale è pronto')}&body=${encodeURIComponent(msg)}">${ico('mail')} Email</a></div>
      <p class="muted small">${r.inviata ? '<b>Gliele abbiamo già mandate via email.</b> ' : ''}Dopo aver chiuso, la password non sarà più visibile: se si perde ne crei un'altra dalla scheda dell'utente.</p>`;
  }
  function showCreds(r, title) { modal(title, `<div class="done"><svg viewBox="0 0 52 52" class="done-i"><circle cx="26" cy="26" r="24"/><path d="m15 27 7 7 15-16"/></svg></div>${credBlock(r)}`, () => true, { okLabel: 'Fatto', cancel: false }); }
  function userAdd(code) {
    const W = (D.ws || []).filter(w => w.tipo !== 'demo'); const w0 = wsOf(code) || W.find(w => w.tipo === 'cliente') || W[0];
    modal('Nuovo utente', `<p class="muted">Un collaboratore o un altro accesso per un gestionale esistente. Riceve una password provvisoria e al primo accesso ne sceglie una sua.</p>
      <div class="row"><label class="fl"><span>Nome e cognome</span><input name="nome" required data-focus></label><label class="fl"><span>Telefono</span><input name="telefono" inputmode="tel"></label></div>
      <label class="fl"><span>Email (sarà il suo accesso)</span><input name="email" type="email" inputmode="email" required></label>
      <label class="fl"><span>Gestionale</span><select name="ws">${W.map(w => `<option value="${esc(w.codice)}"${w.codice === w0.codice ? ' selected' : ''}>${esc(w.nome)}</option>`).join('')}</select></label>
      <div class="seg">${[['utente', 'Può modificare', 'Inserisce e modifica i dati'], ['lettura', 'Sola lettura', 'Vede tutto, non modifica']].map(([k, l, d], i) => `<label class="seg-o"><input type="radio" name="ruolo" value="${k}"${i ? '' : ' checked'}><span><b>${l}</b><small>${d}</small></span></label>`).join('')}</div>
      <label class="check"><input type="checkbox" name="invia" checked><span>Manda subito le credenziali via email</span></label>`, async fd => {
      const o = { nome: String(fd.get('nome') || '').trim(), telefono: String(fd.get('telefono') || '').trim(), email: String(fd.get('email') || '').trim(), ws: fd.get('ws'), ruolo: fd.get('ruolo'), invia: fd.get('invia') === 'on' };
      if (o.nome.length < 2) return toast('Scrivi nome e cognome', 'bad');
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(o.email)) return toast('Email non valida', 'bad');
      const r = await act('adminUserAdd', o, 'Utente creato', 'Creo l\'utente…'); if (!r) return false;
      showCreds({ ...r, nome: o.nome, telefono: o.telefono }, 'Utente creato'); return false;
    }, { okLabel: 'Crea utente' });
  }

  /* --- nuovo cliente: procedura guidata --- */
  function wizard() {
    const y1 = (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
    const st = { step: 0, settore: '', piano: 'base', mod: null };
    const STEPS = ['Azienda', 'Attività', 'Piano e sezioni', 'Titolare'];
    const c = modal('Nuovo cliente', `
      <ol class="wz-steps">${STEPS.map((s, i) => `<li data-s="${i}"><i>${i + 1}</i><span>${s}</span></li>`).join('')}<span class="wz-prog"><i></i></span></ol>
      <div class="wz-view"><div class="wz-track">
        <section class="wz-p" data-p="0"><h4>Di chi è il gestionale?</h4>
          <label class="fl"><span>Ragione sociale</span><input name="azienda" placeholder="Es. Pizzeria Bella Napoli S.r.l." data-focus autocomplete="off"></label>
          <div class="row"><label class="fl"><span>Città</span><input name="citta" placeholder="Es. Napoli (NA)"></label><label class="fl"><span>Partita IVA</span><input name="piva" inputmode="numeric" placeholder="facoltativa"></label></div>
          <label class="fl"><span>Note (le vedi solo tu)</span><input name="note" placeholder="es. pagamento ricevuto il …"></label></section>
        <section class="wz-p" data-p="1"><h4>Che attività è?</h4><p class="muted small">Decide nomi, categorie di spesa e sezioni di partenza. Si può cambiare in qualsiasi momento.</p>
          <div class="secs">${SET.list.map((s, i) => `<button type="button" class="sec" data-sec="${s.id}" style="--c:${SC[s.id] || SC.altro};--i:${i}"><span class="tile"><svg viewBox="0 0 24 24">${s.ic}</svg></span><b>${esc(s.s || s.n)}</b><small>${esc(s.d || '')}</small></button>`).join('')}</div></section>
        <section class="wz-p" data-p="2"><h4>Piano e sezioni</h4>
          <div class="plan-pick">${Object.entries(PIANI).map(([k, v]) => `<label class="pp p-${k}"><input type="radio" name="piano" value="${k}"${k === 'base' ? ' checked' : ''}><span><b>${esc(v)}</b><small>${k === 'prova' ? 'per farlo provare' : k === 'base' ? 'le sezioni essenziali' : 'tutto acceso'}</small></span></label>`).join('')}</div>
          <div class="row"><label class="fl"><span>Canone annuo €</span><input name="canone" type="number" min="0" step="1" inputmode="decimal" placeholder="es. 490"></label><label class="fl"><span>Abbonamento fino al</span><input name="scadenza" type="date" value="${y1}"></label></div>
          <div id="wz-mods"></div></section>
        <section class="wz-p" data-p="3"><h4>Il primo utente</h4><p class="muted small">Di solito il titolare. Riceve una password provvisoria e al primo accesso ne sceglie una sua.</p>
          <div class="row"><label class="fl"><span>Nome e cognome</span><input name="nome" autocomplete="off"></label><label class="fl"><span>Telefono</span><input name="telefono" inputmode="tel"></label></div>
          <label class="fl"><span>Email (sarà il suo accesso)</span><input name="email" type="email" inputmode="email" autocomplete="off"></label>
          <label class="check"><input type="checkbox" name="invia" checked><span>Manda subito le credenziali via email</span></label>
          <div class="recap" id="wz-recap"></div></section>
      </div></div>`, () => false, { wide: true, cls: 'wz', noFoot: true });
    const form = $('#m-form', c);
    form.insertAdjacentHTML('beforeend', `<footer class="wz-f"><button class="btn ghost" type="button" id="wz-back">Indietro</button><button class="btn primary" type="button" id="wz-next">Avanti</button></footer>`);
    const v = n => String(form.elements[n] ? form.elements[n].value : '').trim();
    const drawMods = () => {
      const s = SET.get(st.settore || 'altro'); if (!st.mod) { st.mod = {}; SET.moduli.forEach(m => { if (m.only && m.only !== s.id) return; st.mod[m.k] = m.k in (s.mod || {}) ? !!s.mod[m.k] : true; }); }
      $('#wz-mods', c).innerHTML = `<div class="always"><span>Sempre incluse</span>${(SET.sempre || []).map(x => `<em>${esc(x === 'Acquisti' ? s.acq || x : x)}</em>`).join('')}</div><div class="mods compact">${SET.moduli.filter(m => !m.only || m.only === s.id).map(m => `<label class="mod"><span class="mod-t"><b>${esc(m.t(s))}</b><small>${esc(m.d(s))}</small></span><input type="checkbox" class="sw" data-wzmod="${m.k}"${st.mod[m.k] ? ' checked' : ''}></label>`).join('')}</div>`;
    };
    const recap = () => { const s = SET.get(st.settore || 'altro'), on = Object.entries(st.mod || {}).filter(x => x[1]).length; $('#wz-recap', c).innerHTML = `<span class="tile" style="--c:${SC[s.id]}"><svg viewBox="0 0 24 24">${s.ic}</svg></span><div><b>${esc(v('azienda'))}</b><small>${esc(s.n)} · piano ${esc(PIANI[st.piano])}${v('canone') ? ' · ' + eur(v('canone')) + '/anno' : ''} · ${on} sezioni facoltative${v('scadenza') ? ' · fino al ' + esc(dIt(v('scadenza'))) : ''}</small></div>`; };
    const go = n => {
      st.step = n;
      $('.wz-track', c).style.transform = `translateX(${-n * 100}%)`;
      $$('.wz-steps li', c).forEach((li, i) => { li.classList.toggle('on', i === n); li.classList.toggle('done', i < n); });
      $('.wz-prog i', c).style.width = `${n / (STEPS.length - 1) * 100}%`;
      $('#wz-back', c).style.visibility = n ? '' : 'hidden';
      $('#wz-next', c).textContent = n === STEPS.length - 1 ? 'Crea il cliente' : 'Avanti';
      $$('.wz-p', c).forEach((p, i) => { p.inert = i !== n; });
      if (n === 2) drawMods(); if (n === 3) recap();
      setTimeout(() => { const f = $(`.wz-p[data-p="${n}"] input:not([type=checkbox]):not([type=radio])`, c); if (f && innerWidth > 700) f.focus({ preventScroll: true }); }, 380);
      $('.wz-view', c).scrollTop = 0;
    };
    const check = n => {
      if (n === 0 && v('azienda').length < 2) { toast('Scrivi il nome dell\'azienda', 'bad'); return false; }
      if (n === 1 && !st.settore) { toast('Scegli il tipo di attività', 'bad'); return false; }
      if (n === 3) { if (v('nome').length < 2) { toast('Scrivi nome e cognome del titolare', 'bad'); return false; } if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v('email'))) { toast('Email non valida', 'bad'); return false; } }
      return true;
    };
    c.addEventListener('click', e => {
      const sb = e.target.closest('[data-sec]'); if (sb) { st.settore = sb.dataset.sec; st.mod = null; $$('.sec', c).forEach(b => b.classList.toggle('on', b === sb)); setTimeout(() => go(2), RM ? 0 : 260); return; }
      const li = e.target.closest('.wz-steps li'); if (li) { const n = Number(li.dataset.s); if (n < st.step) go(n); else { for (let i = st.step; i < n; i++) if (!check(i)) return; go(n); } }
    });
    c.addEventListener('change', e => {
      if (e.target.dataset.wzmod) { st.mod[e.target.dataset.wzmod] = e.target.checked; if (e.target.dataset.wzmod === 'vendite' && e.target.checked && !st.mod.clienti) { st.mod.clienti = true; drawMods(); } }
      if (e.target.name === 'piano') { st.piano = e.target.value; if (st.piano === 'pro') { Object.keys(st.mod || {}).forEach(k => { st.mod[k] = true; }); drawMods(); } }
    });
    form.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); $('#wz-next', c).click(); } });
    $('#wz-back', c).onclick = () => go(Math.max(0, st.step - 1));
    $('#wz-next', c).onclick = async () => {
      if (!check(st.step)) return;
      if (st.step < STEPS.length - 1) return go(st.step + 1);
      const o = { azienda: v('azienda'), citta: v('citta'), piva: v('piva').replace(/\s|^IT/gi, ''), note: v('note'), settore: st.settore, piano: st.piano, canone: Number(v('canone')) || 0, scadenza: v('scadenza'), moduli: st.mod, nome: v('nome'), telefono: v('telefono'), email: v('email'), invia: form.elements.invia.checked };
      building(c, o);
      try {
        const r = await post('adminNewClient', o);
        if (r.data) D = r.data; render();
        built(c, { ...r, nome: o.nome, telefono: o.telefono, wsNome: o.azienda }, o);
      } catch (e) { if (e instanceof AuthError) return; c.classList.remove('building'); $('.wz-build', c) && $('.wz-build', c).remove(); toast(e.message, 'bad'); }
    };
    go(0);
  }
  function building(c, o) {
    const s = SET.get(o.settore);
    c.classList.add('building');
    $('.m-body', c).insertAdjacentHTML('beforeend', `<div class="wz-build"><div class="bld-art" style="--c:${SC[s.id]}"><span class="tile xl"><svg viewBox="0 0 24 24">${s.ic}</svg></span><i></i><i></i><i></i></div>
      <ol class="bld-steps">${['Creo il Foglio Google del cliente', 'Preparo le sezioni scelte', `Creo l'accesso per ${esc(o.nome)}`, o.invia ? 'Mando le credenziali via email' : 'Preparo le credenziali'].map((t, i) => `<li style="--i:${i}"><i></i>${t}</li>`).join('')}</ol></div>`);
  }
  function built(c, r, o) {
    const s = SET.get(o.settore);
    $('.m-body', c).innerHTML = `<div class="wz-done"><div class="done big"><svg viewBox="0 0 52 52" class="done-i"><circle cx="26" cy="26" r="24"/><path d="m15 27 7 7 15-16"/></svg></div><h3>${esc(o.azienda)} è pronto</h3><p class="muted">${esc(s.n)} · piano ${esc(PIANI[o.piano])} · codice <b class="mono">${esc(r.codice)}</b></p>${credBlock(r)}</div>`;
    c.classList.remove('building');
    const f = $('.wz-f', c); f.innerHTML = `<button class="btn ghost" type="button" data-act="mclose">Chiudi</button><a class="btn primary" href="#clienti/${esc(r.codice)}" data-act="mclose">Apri la scheda del cliente</a>`;
    if (!RM) burst(c);
    toast('Cliente creato', 'ok');
  }

  /* ================= TEST ESTREMO: gestionale di prova pieno di dati ================= */
  const stressWs = () => clients().find(w => String(w.nome).trim().toUpperCase() === (window.CDC_STRESS || {}).NAME);
  // invia al gestionale di prova con il SUO token (non tocca la sessione della Console né quella del gestionale)
  async function postWs(t, action, extra) {
    const r = await fetch(SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, token: t, ...extra }), credentials: 'omit', referrerPolicy: 'no-referrer' });
    let j; try { j = await r.json(); } catch { throw new Error('Risposta non valida dallo script Google (forse il blocco era troppo grande o lo script è andato in tempo scaduto)'); }
    if (!j.ok) throw new Error(j.error || 'Errore'); return j.result;
  }
  const fmtN = n => Number(n).toLocaleString('it-IT');
  const fmtT = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? `${h} h ${m} min` : m ? `${m} min ${s % 60 ? (s % 60) + ' s' : ''}` : `${s} s`; };
  let stressRun = null;
  async function stress() {
    const S = window.CDC_STRESS; if (!S) return;
    if (stressRun) return stressView();
    const w0 = stressWs(), P = LS.get('cdcx_stress', null), resume = !!(w0 && P && P.codice === w0.codice && P.done > 0 && P.done < P.tot);
    const go = await ask(w0 ? `Riempire «${esc(w0.nome)}»?` : 'Creare il gestionale «TEST ESTREMO»?',
      `${w0 ? '' : 'Creo un cliente di prova (attività allestimento veicoli, tutte le sezioni accese) e '}lo riempio con circa <b>57.000 righe</b> inventate: 3 anni di acquisti, fatture, spedizioni, carburante, Lyreco, Amazon, 1.200 clienti, 250 fornitori, 2.500 articoli, DDT, fatture di vendita, incassi e 400 preventivi.<br><br>Ci vuole un po': <b>lascia aperta questa pagina</b>. Se si interrompe, rilancialo e riprende da dove era${resume ? ` (ora è al ${Math.floor(P.done / P.tot * 100)}%)` : ''}. Ricaricare di nuovo non crea doppioni.`, resume ? 'Riprendi' : w0 ? 'Riempi' : 'Crea e riempi');
    if (!go) return;
    await new Promise(r => setTimeout(r, 60)); // la finestra di conferma si chiude dopo questa riga
    const st = stressRun = { stop: false, done: 0, tot: 0, parts: [], t0: Date.now(), sent0: 0, msg: 'Preparo i dati…', err: '', end: false, codice: w0 ? w0.codice : '' };
    stressView();
    try {
      if (!st.codice) {
        st.msg = 'Creo il gestionale «TEST ESTREMO»…'; stressDraw();
        const mod = {}; (SET.moduli || []).forEach(m => { if (!m.only) mod[m.k] = true; });
        const r = await post('adminNewClient', { azienda: S.NAME, citta: 'Roma', piva: '', note: 'Gestionale di prova con dati inventati (test estremo)', settore: 'veicoli', piano: 'pro', canone: 0, scadenza: '', moduli: mod, nome: 'Test Estremo', telefono: '', email: 'test.estremo@centrodicosto.example', invia: false });
        st.codice = r.codice; if (r.data) D = r.data; render();
      }
      st.msg = 'Apro il gestionale di prova…'; stressDraw();
      const o = await post('adminOpen', { codice: st.codice }), T = o.token;
      st.msg = 'Preparo i dati…'; stressDraw();
      await new Promise(r => setTimeout(r, 30));
      const { ops, parts } = S.ops(); st.tot = ops.length; st.parts = parts;
      const P2 = LS.get('cdcx_stress', null);
      st.done = P2 && P2.codice === st.codice && P2.tot === ops.length && P2.done < ops.length ? P2.done : 0; st.sent0 = st.done; st.t0 = Date.now();
      let size = 400, fails = 0;
      while (st.done < st.tot && !st.stop) {
        const part = ops.slice(st.done, st.done + size), t = Date.now();
        st.msg = ''; stressDraw();
        try {
          await postWs(T, 'batch', { ops: part });
          st.done += part.length; fails = 0; LS.set('cdcx_stress', { codice: st.codice, done: st.done, tot: st.tot });
          const sec = (Date.now() - t) / 1000; size = Math.max(50, Math.min(3000, Math.round(size * Math.min(2, Math.max(.4, 25 / Math.max(1, sec))))));
        } catch (e) {
          if (++fails > 4) throw e;
          size = Math.max(50, Math.round(size / 2)); st.msg = `Il server ha risposto con un errore, riprovo con blocchi più piccoli (${size} righe)…`; stressDraw();
          await new Promise(r => setTimeout(r, 3000 * fails));
        }
      }
      st.end = true; st.msg = st.stop ? 'Fermato: rilancia il test per riprendere da qui.' : '';
      if (!st.stop) { LS.set('cdcx_stress', { codice: st.codice, done: st.tot, tot: st.tot }); toast('Test estremo pronto', 'ok'); }
    } catch (e) { st.end = true; st.err = e instanceof AuthError ? 'Sessione scaduta: rientra nella Console e rilancia il test.' : e.message; }
    stressDraw();
    load(true).catch(() => {});
  }
  function stressView() {
    modal('Test estremo', '<div id="st-run"></div>', () => true, { noFoot: true, cls: 'lock small' });
    stressDraw();
  }
  function stressDraw() {
    const el = $('#st-run'), st = stressRun; if (!el || !st) return;
    const pct = st.tot ? st.done / st.tot * 100 : 0, sec = (Date.now() - st.t0) / 1000, sp = sec > 2 ? (st.done - st.sent0) / sec : 0, eta = sp ? (st.tot - st.done) / sp : 0;
    let acc = 0; const cur = st.parts.findIndex(([, n]) => (acc += n) > st.done);
    acc = 0;
    el.innerHTML = `<div class="st-run">
      <div class="st-top"><b>${st.tot ? Math.floor(pct) + '%' : '…'}</b><span>${st.tot ? `${fmtN(st.done)} di ${fmtN(st.tot)} righe` : esc(st.msg)}</span></div>
      <div class="meter st-m${st.end && !st.err && !st.stop ? ' ok' : ''}"><i style="--w:${pct}%"></i></div>
      ${st.tot ? `<p class="muted small">${st.end ? (st.err ? '' : st.stop ? esc(st.msg) : `Completato in ${fmtT(sec)}.`) : `${sp ? `${fmtN(Math.round(sp))} righe al secondo · mancano circa ${fmtT(eta)}` : 'Misuro la velocità…'}${st.msg ? ' · ' + esc(st.msg) : ''}`}</p>` : ''}
      ${st.err ? `<div class="banner bad">${ico('warn')}<div><b>Caricamento interrotto</b><span>${esc(st.err)}</span></div></div>` : ''}
      ${st.parts.length ? `<ul class="st-parts">${st.parts.map(([n, k], i) => { const a = acc; acc += k; const d = Math.max(0, Math.min(k, st.done - a)); return `<li class="${d >= k ? 'ok' : i === cur ? 'on' : ''}"><span>${esc(n)}</span><em>${fmtN(d)} / ${fmtN(k)}</em></li>`; }).join('')}</ul>` : ''}
      <div class="st-f">${st.end ? `<button class="btn ghost" type="button" data-act="stclose">Chiudi</button>${st.codice && !st.err ? `<button class="btn primary" type="button" data-act="stopen">${ico('open')} Apri il gestionale</button>` : '<button class="btn primary" type="button" data-act="stress">Riprova</button>'}` : `<button class="btn ghost" type="button" data-act="ststop"${st.stop ? ' disabled' : ''}>${st.stop ? 'Mi fermo dopo questo blocco…' : 'Ferma'}</button>`}</div>
    </div>`;
  }
  setInterval(() => { if (stressRun && !stressRun.end) stressDraw(); }, 1000);

  /* ================= effetti ================= */
  function burst(host) {
    if (RM || !host) return;
    const b = document.createElement('div'); b.className = 'burst';
    const cols = ['#3d6fd1', '#2e9a74', '#e2a33b', '#d1553f', '#7a5cc7'];
    b.innerHTML = Array.from({ length: 26 }, (_, i) => { const a = (i / 26) * Math.PI * 2, r = 90 + Math.random() * 90; return `<i style="--x:${Math.cos(a) * r}px;--y:${Math.sin(a) * r - 40}px;--r:${Math.random() * 360}deg;background:${cols[i % cols.length]};animation-delay:${Math.random() * 80}ms"></i>`; }).join('');
    (host.closest('.modal-card') || document.body).appendChild(b); setTimeout(() => b.remove(), 1400);
  }
  let toastT = null;
  function toast(msg, kind = '') {
    const t = $('#toast'); t.className = 'toast ' + kind; t.innerHTML = `${kind === 'ok' ? ico('check') : kind === 'bad' ? ico('warn') : ''}<span>${esc(msg)}</span>`; t.hidden = false;
    t.classList.remove('in'); void t.offsetWidth; t.classList.add('in');
    clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, kind === 'bad' ? 4600 : 2600);
  }
  function busy(msg) {
    let b = $('#busy');
    if (!msg) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('div'); b.id = 'busy'; b.className = 'busy'; document.body.appendChild(b); }
    b.innerHTML = `<div><span class="spin"></span>${esc(msg)}</div>`;
  }

  /* --- animazione della pagina di accesso: i gestionali in orbita attorno alla Console --- */
  let orbRAF = 0;
  function orbit() {
    const svg = $('#orbit'); if (!svg || svg.dataset.on) return; svg.dataset.on = '1';
    const L = SET.list.filter(s => s.id !== 'altro'), R = [130, 200, 268], cx = 300, cy = 300;
    const nodes = L.map((s, i) => ({ s, ring: i % 3, a: (i / L.length) * Math.PI * 2 + (i % 3) * 0.6, sp: [0.00022, -0.00015, 0.0001][i % 3] }));
    svg.innerHTML = `<defs><radialGradient id="og" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#4f86d6" stop-opacity=".55"/><stop offset="1" stop-color="#4f86d6" stop-opacity="0"/></radialGradient></defs>
      <circle cx="${cx}" cy="${cy}" r="120" fill="url(#og)" class="o-glow"/>
      ${R.map((r, i) => `<circle cx="${cx}" cy="${cy}" r="${r}" class="o-ring" style="--i:${i}"/>`).join('')}
      <g id="o-links"></g>
      <g class="o-hub"><circle cx="${cx}" cy="${cy}" r="46" class="o-hub-b"/><circle cx="${cx}" cy="${cy}" r="46" class="o-pulse"/><circle cx="${cx}" cy="${cy}" r="46" class="o-pulse d2"/>
        <g transform="translate(${cx - 24} ${cy - 24}) scale(.09375)" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M248 164 A100 100 0 1 0 348 264" stroke="#fff" stroke-width="34"/><path d="M248 164 V264 H348" stroke="#fff" stroke-width="22"/><path d="M284 230 V134 A96 96 0 0 1 380 230 Z" stroke="#e22726" fill="#e22726" stroke-width="22"/></g></g>
      <g id="o-nodes">${nodes.map((n, i) => `<g class="o-node" style="--c:${SC[n.s.id]};--i:${i}"><circle r="21"/><g transform="translate(-10 -10) scale(.84)">${n.s.ic}</g></g>`).join('')}</g>`;
    const G = $$('.o-node', svg), links = $('#o-links', svg);
    links.innerHTML = nodes.map(() => '<line class="o-link"/>').join('') + nodes.map(() => '<circle r="2.6" class="o-pkt"/>').join('');
    const LN = $$('.o-link', links), PK = $$('.o-pkt', links);
    let t0 = performance.now();
    const frame = t => {
      const dt = RM ? 0 : t - t0;
      nodes.forEach((n, i) => {
        const a = n.a + dt * n.sp, x = cx + Math.cos(a) * R[n.ring], y = cy + Math.sin(a) * R[n.ring];
        G[i].setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
        LN[i].setAttribute('x1', cx); LN[i].setAttribute('y1', cy); LN[i].setAttribute('x2', x.toFixed(1)); LN[i].setAttribute('y2', y.toFixed(1));
        const k = ((dt / 2600 + i * 0.37) % 1), dir = i % 2 ? k : 1 - k;
        PK[i].setAttribute('cx', (cx + (x - cx) * dir).toFixed(1)); PK[i].setAttribute('cy', (cy + (y - cy) * dir).toFixed(1));
        PK[i].style.opacity = (Math.sin(k * Math.PI) * 0.9).toFixed(2);
      });
      if (!RM) orbRAF = requestAnimationFrame(frame);
    };
    orbRAF = requestAnimationFrame(frame);
  }
  function stopOrbit() { cancelAnimationFrame(orbRAF); const s = $('#orbit'); if (s) { delete s.dataset.on; s.innerHTML = ''; } }

  /* ================= tema ================= */
  function applyTheme(t) { if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); }

  /* ================= ricerca ================= */
  function search(q) {
    const box = $('#search-res'), n = nh(q.trim());
    if (!n || !D) { box.hidden = true; return; }
    const W = (D.ws || []).filter(w => nh([w.nome, w.citta, w.codice, w.piva, w.email].join(' ')).includes(n)).slice(0, 6);
    const U = (D.users || []).filter(u => nh([u.nome, u.email, u.azienda].join(' ')).includes(n)).slice(0, 6);
    box.innerHTML = (W.length ? `<small>Clienti</small>${W.map(w => `<a href="#clienti/${esc(w.codice)}">${secTile(w, 'xs')}<span><b>${esc(w.nome)}</b><em>${esc(w.citta || w.codice)}</em></span></a>`).join('')}` : '') + (U.length ? `<small>Utenti</small>${U.map(u => `<a href="#utenti/${esc(u.email)}"><span class="av xs">${esc(ini(u.nome))}</span><span><b>${esc(u.nome)}</b><em>${esc(u.email)}</em></span></a>`).join('')}` : '') || '<p>Nessun risultato</p>';
    box.hidden = false;
  }

  /* ================= eventi ================= */
  function closeSide() { document.body.classList.remove('side-open'); $('#scrim').hidden = true; }
  function bind() {
    $('#gate-form').addEventListener('submit', login);
    window.addEventListener('hashchange', route);
    $('#menu-btn').onclick = () => { document.body.classList.add('side-open'); $('#scrim').hidden = false; };
    $('#scrim').onclick = closeSide;
    $('#new-client').onclick = () => wizard();
    const si = $('#search'); si.oninput = () => search(si.value); si.onfocus = () => search(si.value);
    si.onkeydown = e => { if (e.key === 'Escape') { si.value = ''; search(''); si.blur(); } if (e.key === 'Enter') { const a = $('#search-res a'); if (a) { location.hash = a.getAttribute('href'); si.value = ''; search(''); si.blur(); } } };
    document.addEventListener('click', e => { if (!e.target.closest('#search-w')) $('#search-res').hidden = true; else if (e.target.closest('#search-res a')) { si.value = ''; setTimeout(() => search(''), 0); } });
    document.addEventListener('keydown', e => {
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !$('#app').hidden) { e.preventDefault(); si.focus(); }
      if (e.key === 'Escape') { if (!$('#modal').hidden) { const m = $('#modal'); if (m._res) { m._res(); m._res = null; } closeModal(); } else if (!$('#drawer').hidden) closeDrawer(); else closeSide(); }
    });
    // filtri (debounce sulla ricerca)
    document.addEventListener('input', e => {
      if (e.target.id === 'f-q') { F.q = e.target.value; clearTimeout(e.target._t); const p = e.target.selectionStart; e.target._t = setTimeout(() => { render(); const x = $('#f-q'); if (x) { x.focus(); try { x.setSelectionRange(p, p); } catch {} } }, 160); }
    });
    document.addEventListener('change', e => { if (e.target.matches('[data-mod]') && e.target.closest('#drawer')) modChange(e.target); });
    document.addEventListener('submit', async e => {
      const f = e.target;
      if (f.id === 'm-form') { e.preventDefault(); if (!mOk) return; const fd = new FormData(f), ok = $('#m-ok'); if (ok) ok.disabled = true; try { const r = await mOk(fd); if (r === true) { const m = $('#modal'); m._res = null; closeModal(); } } finally { if (ok) ok.disabled = false; } return; }
      if (f.id === 'f-cli') {
        e.preventDefault(); const fd = new FormData(f), set = {}; ['nome', 'citta', 'piva', 'referente', 'email', 'telefono', 'settore', 'codice', 'piano', 'canone', 'scadenza', 'note'].forEach(k => { if (fd.has(k)) set[k] = String(fd.get(k) || '').trim(); });
        if (set.codice) set.codice = set.codice.toUpperCase();
        const code = f.dataset.code, r = await act('adminWsSet', { codice: code, set }, 'Cliente aggiornato');
        if (r && set.codice && set.codice !== code) { wsInfo[set.codice] = wsInfo[code]; location.hash = '#clienti/' + set.codice; }
        return;
      }
      if (f.id === 'f-usr') {
        e.preventDefault(); const fd = new FormData(f), set = {}; ['nome', 'telefono', 'ws', 'ruolo', 'stato', 'note'].forEach(k => { set[k] = String(fd.get(k) || ''); });
        const sz = {}; $$('[name^="sez_"]', f).forEach(i => { sz[i.name.slice(4)] = i.checked; }); if ($$('[name^="sez_"]', f).length) set.sezioni = sz;
        const u = (D.users || []).find(x => x.email === f.dataset.email);
        if (u && set.stato === 'bloccato' && u.stato !== 'bloccato' && !(await ask('Bloccare l\'utente?', `${esc(u.nome)} verrà disconnesso subito e non potrà entrare finché non lo sblocchi.`, 'Blocca', true))) return;
        await act('adminUser', { email: f.dataset.email, set }, 'Utente aggiornato'); return;
      }
      if (f.id === 'f-me') { e.preventDefault(); const fd = new FormData(f); try { busy('Salvo…'); const u = await post('updateMe', { nome: fd.get('nome'), telefono: fd.get('telefono') }); me = { ...me, ...u }; LS.set('cdcx_me', me); renderMe(); busy(); toast('Salvato', 'ok'); } catch (er) { busy(); if (!(er instanceof AuthError)) toast(er.message, 'bad'); } return; }
      if (f.id === 'f-pw') {
        e.preventDefault(); const fd = new FormData(f);
        if (String(fd.get('n1')).length < 8) return toast('La nuova password deve avere almeno 8 caratteri', 'bad');
        if (fd.get('n1') !== fd.get('n2')) return toast('Le due password non coincidono', 'bad');
        try { busy('Cambio la password…'); const r = await post('changePw', { old: fd.get('old'), nuova: fd.get('n1') }); tok = r.token; LS.set('cdcx_tok', tok); busy(); f.reset(); toast('Password cambiata · gli altri dispositivi dovranno entrare di nuovo', 'ok'); load(true).catch(() => {}); } catch (er) { busy(); if (!(er instanceof AuthError)) toast(er.message, 'bad'); }
      }
    });
    document.addEventListener('click', async e => {
      const t = e.target;
      const cp = t.closest('[data-copy]'); if (cp) { const v = cp.dataset.copy; (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(() => toast('Copiato', 'ok'), () => toast(v)); return; }
      const th = t.closest('[data-theme]'); if (th && th.tagName === 'BUTTON') { LS.set('cdcx_theme', th.dataset.theme); applyTheme(th.dataset.theme); render(); return; }
      const fc = t.closest('[data-fcli]'); if (fc) { F.cli = fc.dataset.fcli; LS.set('cdcx_fcli', F.cli); render(); return; }
      const tm = t.closest('[data-tm]'); if (tm) { tSel = tm.dataset.tm; if (tm.classList.contains('tm-a')) tFocus = tSel; render(); return; }
      const fu = t.closest('[data-fut]'); if (fu) { F.ut = fu.dataset.fut; render(); return; }
      const fr = t.closest('[data-freg]'); if (fr) { F.reg = fr.dataset.freg; render(); return; }
      const frg = t.closest('[data-freg-go]'); if (frg) { F.reg = frg.dataset.fregGo; F.q = ''; }
      const tb = t.closest('[data-tab]'); if (tb) { dTab = tb.dataset.tab; refreshDrawer(); const w = wsOf(drawerId); if (dTab === 'sezioni' && w && !(w.codice in wsInfo)) loadWsInfo(w.codice); return; }
      if (t.closest('#drawer') && !t.closest('.drawer-in')) { closeDrawer(); return; }
      if (t.closest('#modal') && !t.closest('.modal-card')) { const m = $('#modal'); if (!$('#modal-card').classList.contains('wz') && !$('#modal-card').classList.contains('lock')) { if (m._res) { m._res(); m._res = null; } closeModal(); } return; }
      const a = t.closest('[data-act]'); if (!a) return;
      const k = a.dataset.act, w = wsOf(a.dataset.ws || drawerId), em = a.dataset.email;
      if (k === 'mclose') { const m = $('#modal'); if (m._res) { m._res(); m._res = null; } closeModal(); return; }
      if (k === 'close') return closeDrawer();
      if (k === 'logout') { if (await ask('Uscire dalla Console?', 'Per rientrare servono email e password.', 'Esci')) logout(); return; }
      if (k === 'new') return wizard();
      if (k === 'stress') { if (stressRun && stressRun.end) { stressRun = null; closeModal(); } return stress(); }
      if (k === 'ststop') { if (stressRun) { stressRun.stop = true; stressDraw(); } return; }
      if (k === 'stclose') { const c = stressRun && stressRun.end; closeModal(); if (c) stressRun = null; return; }
      if (k === 'stopen') { const c = stressRun && stressRun.codice; closeModal(); stressRun = null; if (c) return openWs(c); return; }
      if (k === 'pay') return payForm(a.dataset.ws || (drawerKind === 'cli' ? drawerId : ''));
      if (k === 'useradd') return userAdd(a.dataset.ws || '');
      if (k === 'creds') return credsReset(em);
      if (k === 'open' && w) return openWs(w.codice);
      if (k === 'wsinfo' && w) { delete wsInfo[w.codice]; refreshDrawer(); return loadWsInfo(w.codice); }
      if (k === 'wsstato' && w) { const off = w.stato === 'attivo'; if (off && !(await ask(`Sospendere ${esc(w.nome)}?`, 'I suoi utenti non potranno entrare finché non lo riattivi. I dati restano al loro posto.', 'Sospendi', true))) return; act('adminWsSet', { codice: w.codice, set: { stato: off ? 'sospeso' : 'attivo' } }, off ? 'Gestionale sospeso' : 'Gestionale riattivato'); return; }
      if (k === 'wsdel' && w) {
        const n = usersOf(w.codice).length;
        const c = modal(`Eliminare ${esc(w.nome)}?`, `<p class="ask">Il cliente sparisce dalla Console e i suoi utenti non possono più entrare.${w.url ? ' Il suo <b>Foglio Google resta nel tuo Drive</b>: se vuoi, lo cancelli tu a mano.' : ''}</p>${n ? `<div class="seg">${[['0', 'Blocca gli utenti', `Restano in elenco come bloccati (${n})`], ['1', 'Elimina gli utenti', `Spariscono anche loro (${n})`]].map(([v, l, d], i) => `<label class="seg-o"><input type="radio" name="ut" value="${v}"${i ? '' : ' checked'}><span><b>${l}</b><small>${d}</small></span></label>`).join('')}</div>` : ''}<label class="fl"><span>Per confermare scrivi <b>${esc(w.codice)}</b></span><input name="conf" autocomplete="off" class="mono up"></label>`, async fd => {
          if (String(fd.get('conf') || '').trim().toUpperCase() !== w.codice.toUpperCase()) { toast('Il codice non corrisponde', 'bad'); return false; }
          const r = await act('adminWsDel', { codice: w.codice, utenti: fd.get('ut') === '1' }, 'Cliente eliminato'); if (r) { closeDrawer(true); location.hash = '#clienti'; } return !!r;
        }, { okLabel: 'Elimina definitivamente', danger: true, cls: 'small' });
        return;
      }
      if (k === 'paydel') { const id = a.closest('[data-pay]').dataset.pay, p = (D.pagamenti || []).find(x => x.id === id); if (p && await ask('Eliminare il pagamento?', `${eur2(p.importo)} del ${esc(dIt(p.data))}. La scadenza dell'abbonamento non cambia: se serve, correggila nella scheda del cliente.`, 'Elimina', true)) act('adminPayDel', { id }, 'Pagamento eliminato'); return; }
      if (k === 'kick' && em) { const u = (D.users || []).find(x => x.email === em); if (await ask('Disconnettere?', `${esc(u ? u.nome : em)} dovrà rientrare con email e password su tutti i dispositivi.`, 'Disconnetti')) act('adminLogoutUser', { email: em }, 'Disconnesso da tutti i dispositivi'); return; }
      if (k === 'userdel' && em) { const u = (D.users || []).find(x => x.email === em); if (await ask('Eliminare l\'utente?', `L'account di <b>${esc(u ? u.nome : em)}</b> viene cancellato e non potrà più entrare. I dati del gestionale restano.`, 'Elimina', true)) { const r = await act('adminDelUser', { email: em }, 'Utente eliminato'); if (r) { closeDrawer(true); history.replaceState(null, '', '#utenti'); } } return; }
      if (k === 'sessdrop') { const id = a.closest('[data-sess]').dataset.sess; act('adminDropSession', { id }, 'Sessione chiusa', 'Chiudo la sessione…'); return; }
      if (k === 'tmreload') { await loadTeam(true); toast('Report aggiornati', 'ok'); return; }
      if (k === 'kickall') { const S = (D.sess || []).filter(s => !s.io); if (!(await ask('Chiudere tutte le altre sessioni?', `${plural(S.length, 'dispositivo verrà disconnesso', 'dispositivi verranno disconnessi')}: tutti dovranno rientrare con la password.`, 'Chiudi tutte', true))) return; busy('Chiudo le sessioni…'); for (const s of S) { try { const r = await post('adminDropSession', { id: s.id }); if (r && r.users) D = r; } catch {} } busy(); render(); toast('Sessioni chiuse', 'ok'); return; }
    });
    // aggiornamento automatico: dispositivi collegati e registro restano freschi
    document.addEventListener('visibilitychange', () => { if (!document.hidden && tok && !$('#app').hidden && $('#modal').hidden) load(true).catch(() => {}); });
    setInterval(() => { if (!document.hidden && tok && !$('#app').hidden && $('#modal').hidden && !$('#busy') && !document.activeElement.closest('form')) load(true).catch(() => {}); }, 90000);
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => render());
  }

  /* ================= avvio ================= */
  bind();
  if (top !== self) { try { top.location = self.location; } catch { document.body.innerHTML = ''; } return; }
  setTimeout(() => { const s = $('#splash'); if (s) { s.classList.add('out'); setTimeout(() => s.remove(), 500); } }, RM ? 0 : 650);
  if (tok && me) enter(false); else showGate();
})();
