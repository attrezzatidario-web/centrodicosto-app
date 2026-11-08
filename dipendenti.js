/* Centro di Costo — Dipendenti e presenze (v127)
   window.CDC_DIP.render(el, ctx): anagrafica, presenze (giorno e mese), ferie e permessi, scadenze,
   scheda del dipendente con accesso al gestionale e permessi per sezione. ctx arriva da app.js. */
(() => {
  'use strict';
  let C = null, root = null;
  const S = { tab: 'persone', q: '', fst: 'attivi', det: '', dtab: 'riepilogo', day: '', mon: '', pvMon: '', creds: null };

  /* ---------- utilità ---------- */
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => ymd(new Date());
  const parseD = s => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
  const addD = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return ymd(d); };
  const validD = s => /^\d{4}-\d{2}-\d{2}/.test(String(s || ''));
  const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  const GG = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
  const mLbl = k => { const [y, m] = k.split('-').map(Number); return `${MESI[m - 1].replace(/^./, c => c.toUpperCase())} ${y}`; };
  const dLong = s => { const d = parseD(s); return `${GG[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`; };
  const hm = m => { m = Math.max(0, Math.round(m)); return `${Math.floor(m / 60)}:${pad(m % 60)}`; };
  const hDec = m => C.fmtNum(m / 60, 1).replace(/,0$/, '');
  const tmin = t => { const [h, m, s] = String(t || '0:0').split(':').map(Number); return (h || 0) * 60 + (m || 0) + (s || 0) / 60; };
  const N = v => C.num(v);
  const esc = s => C.esc(s);
  const nameOf = d => `${d.nome || ''} ${d.cognome || ''}`.trim() || 'Senza nome';
  const ini = d => (String(d.nome || '?')[0] + String(d.cognome || '')[0] || '').toUpperCase();
  const COL = ['#3362ab', '#1baf7a', '#eb6834', '#8b5cf6', '#0e9fb4', '#d55181', '#c98500', '#64748b'];
  const av = (d, c = '') => `<span class="dp-av${c ? ' ' + c : ''}" style="--c:${colOf(d)}">${d.foto ? `<img src="${esc(d.foto)}" alt="">` : esc(ini(d))}</span>`;
  const colOf = d => d.colore || COL[[...String(d.id)].reduce((s, c) => s + c.charCodeAt(0), 0) % COL.length];
  const TIPI = { in: 'Entrata', pausa: 'Pausa', rientro: 'Rientro', out: 'Uscita' };
  const ASS = { ferie: ['Ferie', 'F'], permesso: ['Permesso', 'P'], malattia: ['Malattia', 'M'], altro: ['Altra assenza', 'A'] };
  const AST = { attesa: ['soon', 'Da approvare'], approvata: ['paid', 'Approvata'], rifiutata: ['late', 'Rifiutata'], comunicata: ['', 'Comunicata'] };
  const CONTR = ['Tempo indeterminato', 'Tempo determinato', 'Apprendistato', 'Part-time', 'Stagionale', 'Intermittente', 'Collaborazione', 'Tirocinio / stage'];
  const IC = {
    cam: '<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.4"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a5 5 0 0 1 5.5 5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/>', back: '<path d="M15 18l-6-6 6-6"/>', plus: '<path d="M12 5v14M5 12h14"/>', go: '<path d="M9 6l6 6-6 6"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>', phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>', xls: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8l8 8M16 8l-8 8"/>',
    pdf: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 14h6M9 17h4"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>', check: '<path d="M5 12l5 5L20 7"/>', trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>', fuel: '<path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M3 21h13M7 7h5v4H7z"/>'
  };
  const svg = (k, cls = '') => `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true">${IC[k] || ''}</svg>`;

  /* ---------- dati ---------- */
  const db = () => C.db();
  const DIP = () => (db().dipendenti || []);
  const PRE = () => (db().presenze || []);
  const ASSE = () => (db().assenze || []);
  const STAFF = () => (db().staff || []);
  const set = () => Object.assign({ giorni: 5, geo: false }, C.cfg('pzSet') || {});
  const canW = () => C.secPerm('dipendenti') === 'w';
  const owner = () => C.isOwner();
  const dipOf = id => DIP().find(d => String(d.id) === String(id));
  const active = () => DIP().filter(d => d.stato !== 'cessato');
  const workday = s => { const g = parseD(s).getDay(); return set().giorni >= 6 ? g !== 0 : g !== 0 && g !== 6; };
  const dailyMin = d => (N(d.ore) || 40) / (set().giorni >= 6 ? 6 : 5) * 60;
  // v129: indici ricostruiti una volta per disegno — timbrature per dipendente e giorno, assenze per dipendente, ore già calcolate
  let IX = null, AX = null, WK = new Map();
  const reIndex = () => { IX = null; AX = null; WK = new Map(); };
  function ix() {
    if (IX) return IX; IX = new Map();
    PRE().forEach(p => { const k = p.dip + '|' + String(p.data).slice(0, 10); let a = IX.get(k); if (!a) IX.set(k, a = []); a.push(p); });
    IX.forEach(a => a.sort((x, y) => String(x.ora).localeCompare(String(y.ora)))); return IX;
  }
  const punches = (id, day) => ix().get(id + '|' + day) || [];
  // ore lavorate in un giorno: da entrata/rientro a pausa/uscita; se manca l'uscita e il giorno è oggi conta fino a adesso
  function work(id, day) {
    const wk = id + '|' + day; if (day !== today() && WK.has(wk)) return WK.get(wk); const r = work0(id, day); if (day !== today()) WK.set(wk, r); return r;
  }
  function work0(id, day) {
    const L = punches(id, day); let m = 0, st = null, open = false, pause = 0, pst = null;
    L.forEach(p => { const t = tmin(p.ora); if (p.tipo === 'in' || p.tipo === 'rientro') { if (pst != null) { pause += t - pst; pst = null; } st = t; } else if (p.tipo === 'pausa' || p.tipo === 'out') { if (st != null) { m += t - st; st = null; } if (p.tipo === 'pausa') pst = t; } });
    if (st != null) { if (day === today()) { const n = new Date(); m += n.getHours() * 60 + n.getMinutes() - st; } open = true; }
    const last = L.length ? L[L.length - 1].tipo : '';
    return { min: Math.max(0, m), pause, L, last, open, anom: open && day < today(), first: L.find(p => p.tipo === 'in'), end: [...L].reverse().find(p => p.tipo === 'out') };
  }
  const absOn = (id, day) => { if (!AX) { AX = new Map(); ASSE().forEach(a => { if (a.stato !== 'approvata' && a.stato !== 'comunicata') return; const k = String(a.dip); if (!AX.has(k)) AX.set(k, []); AX.get(k).push(a); }); } return (AX.get(String(id)) || []).find(a => a.dal <= day && (a.al || a.dal) >= day); };
  function now(d) {
    const w = work(d.id, today()), a = absOn(d.id, today());
    if (w.last === 'in' || w.last === 'rientro') return { k: 'in', t: `Presente dalle ${String((w.first || w.L[0]).ora).slice(0, 5)}`, c: 'paid' };
    if (w.last === 'pausa') return { k: 'pausa', t: `In pausa dalle ${String(w.L[w.L.length - 1].ora).slice(0, 5)}`, c: 'soon' };
    if (w.last === 'out') return { k: 'out', t: `Uscito alle ${String(w.end.ora).slice(0, 5)}`, c: '' };
    if (a) return { k: 'ass', t: ASS[a.tipo] ? ASS[a.tipo][0] : 'Assente', c: 'ass' };
    if (!workday(today())) return { k: 'riposo', t: 'Riposo', c: '' };
    return { k: 'no', t: 'Non ha timbrato', c: 'late' };
  }
  const workDays = (dal, al) => { let n = 0; for (let d = dal; d <= al; d = addD(d, 1)) if (workday(d)) n++; return n; };
  // saldo ferie e permessi dell'anno: spettanti in proporzione ai mesi dall'assunzione
  function saldo(d, y = String(new Date().getFullYear())) {
    const ass = validD(d.assunzione) && d.assunzione.slice(0, 4) === y ? parseD(d.assunzione) : null, k = ass ? (12 - ass.getMonth()) / 12 : 1;
    const fs = Math.round(N(d.ferie || 26) * k * 10) / 10, ps = Math.round(N(d.permessi || 32) * k * 10) / 10;
    const A = ASSE().filter(a => String(a.dip) === String(d.id) && String(a.dal).slice(0, 4) === y);
    const fg = A.filter(a => a.tipo === 'ferie' && a.stato === 'approvata').reduce((s, a) => s + workDays(a.dal, a.al || a.dal), 0);
    const fa = A.filter(a => a.tipo === 'ferie' && a.stato === 'attesa').reduce((s, a) => s + workDays(a.dal, a.al || a.dal), 0);
    const pg = A.filter(a => a.tipo === 'permesso' && a.stato === 'approvata').reduce((s, a) => s + N(a.ore), 0);
    const mg = A.filter(a => a.tipo === 'malattia').reduce((s, a) => s + workDays(a.dal, a.al || a.dal), 0);
    return { fs, fg, fa, fr: Math.round((fs - fg) * 10) / 10, ps, pg, pr: Math.round((ps - pg) * 10) / 10, mg };
  }
  function month(d, mk) {
    const [y, m] = mk.split('-').map(Number), last = new Date(y, m, 0).getDate(), days = [];
    let tot = 0, gl = 0, extra = 0, an = 0;
    for (let i = 1; i <= last; i++) {
      const day = `${mk}-${pad(i)}`, w = work(d.id, day), a = absOn(d.id, day);
      if (w.min > 0) { tot += w.min; gl++; extra += Math.max(0, w.min - dailyMin(d)); }
      if (w.anom) an++;
      days.push({ day, w, a });
    }
    return { days, tot, gl, extra, an };
  }
  const scad = d => [['fine', 'Fine contratto'], ['visita', 'Visita medica'], ['corso', 'Corso sicurezza']].filter(([k]) => validD(d[k])).map(([k, l]) => ({ k, l, d: d[k], g: Math.round((parseD(d[k]) - parseD(today())) / 864e5) }));
  const scadCls = g => g < 0 ? 'late' : g <= 30 ? 'soon' : '';
  const scadTxt = g => g < 0 ? `scaduta da ${-g} ${g === -1 ? 'giorno' : 'giorni'}` : g === 0 ? 'oggi' : `tra ${g} ${g === 1 ? 'giorno' : 'giorni'}`;
  const staffOf = d => STAFF().find(u => String(u.dip) === String(d.id));
  const pzUrl = () => location.origin + location.pathname.replace(/[^/]*$/, '') + 'presenze/';

  /* ---------- disegno ---------- */
  function render(el, ctx) {
    C = ctx; reIndex();
    if (root !== el) { root = el; bind(el); }
    if (!S.day) S.day = today();
    if (!S.mon) S.mon = today().slice(0, 7);
    if (!S.pvMon) S.pvMon = today().slice(0, 7);
    if (S.det && S.det !== 'new' && !dipOf(S.det)) S.det = '';
    C.sub(S.det ? (S.det === 'new' ? 'Nuovo dipendente' : nameOf(dipOf(S.det))) : 'Persone, presenze, ferie e permessi');
    el.innerHTML = S.det ? detail() : list();
  }

  function kpis() {
    const A = active(), st = A.map(now), pres = st.filter(x => x.k === 'in' || x.k === 'pausa').length, ass = st.filter(x => x.k === 'ass').length;
    const pend = ASSE().filter(a => a.stato === 'attesa').length, mk = today().slice(0, 7);
    const cost = A.reduce((s, d) => s + month(d, mk).tot / 60 * N(d.costo), 0);
    const sc = A.reduce((s, d) => s + scad(d).filter(x => x.g <= 30).length, 0);
    return `<div class="dp-kpis">
      <button type="button" class="card dp-k" data-dp="tab:persone"><span>Dipendenti</span><b>${A.length}</b><small>${DIP().length - A.length ? `${DIP().length - A.length} cessati` : 'attivi'}</small></button>
      <button type="button" class="card dp-k" data-dp="tab:presenze"><span>Presenti adesso</span><b>${pres}<em>/${A.length}</em></b><small>${ass ? `${ass} assenti oggi` : workday(today()) ? 'nessuna assenza oggi' : 'oggi è giorno di riposo'}</small></button>
      <button type="button" class="card dp-k${pend ? ' warn' : ''}" data-dp="tab:ferie"><span>Richieste da approvare</span><b>${pend}</b><small>ferie, permessi e malattia</small></button>
      ${canW() && owner() ? `<div class="card dp-k"><span>Costo del personale · ${MESI[new Date().getMonth()]}</span><b>${C.eur0(cost)}</b><small>ore lavorate × costo orario</small></div>` : `<button type="button" class="card dp-k${sc ? ' warn' : ''}" data-dp="tab:scadenze"><span>Scadenze vicine</span><b>${sc}</b><small>entro 30 giorni</small></button>`}
    </div>`;
  }
  function list() {
    const T = [['persone', 'Persone'], ['presenze', 'Presenze'], ['ferie', 'Ferie e permessi'], ['scadenze', 'Scadenze']];
    const pend = ASSE().filter(a => a.stato === 'attesa').length;
    const body = S.tab === 'presenze' ? tabPres() : S.tab === 'ferie' ? tabFerie() : S.tab === 'scadenze' ? tabScad() : tabPers();
    return `<div class="dp-bar"><div class="seg dp-tabs" role="tablist">${T.map(([k, l]) => `<button type="button" role="tab" data-dp="tab:${k}" class="${S.tab === k ? 'on' : ''}">${l}${k === 'ferie' && pend ? `<em>${pend}</em>` : ''}</button>`).join('')}</div>
      <div class="dp-act"><button type="button" class="btn sm" data-dp="pzlink">${svg('phone')}App Presenze</button>${owner() && !C.DEMO() ? `<button type="button" class="btn sm" data-dp="set" title="Impostazioni delle presenze">${svg('gear')}<span class="dp-hm">Impostazioni</span></button>` : ''}${canW() ? `<button type="button" class="btn sm primary" data-dp="new">${svg('plus')}Dipendente</button>` : ''}</div></div>
      ${kpis()}${body}`;
  }

  // ---- Persone ----
  function tabPers() {
    const q = String(S.q || '').toLowerCase(), mk = today().slice(0, 7);
    const L = DIP().filter(d => S.fst === 'tutti' || (S.fst === 'cessati' ? d.stato === 'cessato' : d.stato !== 'cessato')).filter(d => !q || [nameOf(d), d.mansione, d.reparto, d.sede, d.email, d.tel].join(' ').toLowerCase().includes(q)).sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'it'));
    if (!DIP().length) return `<div class="card dp-empty">${svg('users', 'dp-ei')}<h3>Nessun dipendente</h3><p>Aggiungi le persone che lavorano nell'azienda: le ritrovi nelle presenze, nelle ferie e, se vuoi, con un accesso al gestionale e all'app Presenze.</p>${canW() ? '<button type="button" class="btn primary" data-dp="new">+ Aggiungi il primo dipendente</button>' : ''}</div>`;
    return `<div class="card dp-list"><div class="dp-lh"><div class="dp-sb"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="dp-q" type="search" placeholder="Cerca nome, mansione, sede…" value="${esc(S.q)}" autocomplete="off"></div>
      <div class="seg dp-fs">${[['attivi', 'Attivi'], ['cessati', 'Cessati'], ['tutti', 'Tutti']].map(([k, l]) => `<button type="button" data-dp="fst:${k}" class="${S.fst === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      <div class="dp-tw"><table class="dp-t dp-pt"><thead><tr><th>Dipendente</th><th>Sede</th><th>Contratto</th><th>Oggi</th><th class="r">Ore ${MESI[new Date().getMonth()]}</th><th>Accesso</th><th></th></tr></thead><tbody>
      ${L.map(d => { const n = now(d), m = month(d, mk), u = staffOf(d), sc = scad(d).filter(x => x.g <= 30); return `<tr data-dp="open:${esc(d.id)}">
        <td><div class="dp-who">${av(d, '')}<span><b>${esc(nameOf(d))}</b><small>${esc([d.mansione, d.reparto].filter(Boolean).join(' · ') || '—')}</small></span></div></td>
        <td>${esc(d.sede || '—')}</td>
        <td><span class="dp-c2">${esc(d.contratto || '—')}${d.fine ? `<small>fino al ${esc(C.dIt(d.fine))}</small>` : ''}</span></td>
        <td>${d.stato === 'cessato' ? '<span class="chip">Cessato</span>' : `<span class="chip ${n.c}">${esc(n.t)}</span>`}${sc.length ? `<span class="dp-warn" title="${esc(sc.map(x => x.l + ' ' + scadTxt(x.g)).join(' · '))}">${svg('alert')}</span>` : ''}</td>
        <td class="r num">${m.tot ? hm(m.tot) : '—'}</td>
        <td>${u ? `<span class="chip ${u.stato === 'attivo' ? 'paid' : 'late'}">${u.stato !== 'attivo' ? 'Sospeso' : u.ruolo === 'dipendente' ? (Object.values(u.sezioni || {}).some(Boolean) ? 'Gestionale + Presenze' : 'Solo Presenze') : u.ruolo === 'utente' ? 'Responsabile' : 'Sola lettura'}</span>` : '<span class="muted small">nessuno</span>'}</td>
        <td class="dp-go">${canW() ? `<button type="button" class="dp-rdel" data-dp="del:${esc(d.id)}" title="Elimina ${esc(nameOf(d))}" aria-label="Elimina">${svg('trash')}</button>` : ''}${svg('go')}</td></tr>`; }).join('') || `<tr><td colspan="7"><div class="empty">Nessun dipendente trovato</div></td></tr>`}
      </tbody></table></div></div>`;
  }

  // ---- Presenze (giorno e mese) ----
  const AXS = 6 * 60, AXE = 22 * 60;
  function bar(w) {
    const seg = []; let st = null;
    w.L.forEach(p => { const t = tmin(p.ora); if (p.tipo === 'in' || p.tipo === 'rientro') st = t; else if (st != null) { seg.push([st, t]); st = null; } });
    if (st != null) seg.push([st, w.open && !w.anom ? (() => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); })() : st + 5, true]);
    const pct = t => Math.max(0, Math.min(100, (t - AXS) / (AXE - AXS) * 100));
    return `<div class="dp-bar2">${seg.map(([a, b, o]) => `<i class="${o ? 'open' : ''}" style="left:${pct(a).toFixed(2)}%;width:${Math.max(.6, pct(b) - pct(a)).toFixed(2)}%"></i>`).join('')}</div>`;
  }
  function tabPres() {
    const isDay = S.pmode !== 'mese';
    const head = `<div class="dp-ph"><div class="seg dp-fs">${[['giorno', 'Giorno'], ['mese', 'Mese']].map(([k, l]) => `<button type="button" data-dp="pmode:${k}" class="${(isDay ? 'giorno' : 'mese') === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div class="dp-nav"><button type="button" class="icon-btn" data-dp="${isDay ? 'dprev' : 'mprev'}" aria-label="Precedente">‹</button><b>${isDay ? esc(dLong(S.day).replace(/^./, c => c.toUpperCase())) : esc(mLbl(S.mon))}</b><button type="button" class="icon-btn" data-dp="${isDay ? 'dnext' : 'mnext'}" aria-label="Successivo"${(isDay ? S.day >= today() : S.mon >= today().slice(0, 7)) ? ' disabled' : ''}>›</button>${isDay && S.day !== today() ? '<button type="button" class="btn sm" data-dp="dtoday">Oggi</button>' : ''}</div>
      <div class="dp-ex">${isDay ? '' : `<button type="button" class="btn sm" data-dp="xls">${svg('xls')}Excel</button><button type="button" class="btn sm" data-dp="pdf">${svg('pdf')}PDF</button>`}<button type="button" class="btn sm" data-dp="mappa">${svg('pin')}Mappa</button></div></div>`;
    const A = active().sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'it'));
    if (!A.length) return `<div class="card">${head}<div class="empty">Aggiungi i dipendenti per vedere le presenze</div></div>`;
    if (isDay) {
      const rows = A.map(d => ({ d, w: work(d.id, S.day), a: absOn(d.id, S.day) }));
      const ticks = [6, 8, 10, 12, 14, 16, 18, 20, 22];
      return `<div class="card dp-pc">${head}
        <div class="dp-tw"><table class="dp-t dp-day"><thead><tr><th>Dipendente</th><th>Entrata</th><th>Uscita</th><th class="r">Pausa</th><th class="r">Ore</th><th class="dp-axh"><div class="dp-ax">${ticks.map(h => `<span style="left:${((h * 60 - AXS) / (AXE - AXS) * 100).toFixed(2)}%">${h}</span>`).join('')}</div></th>${canW() ? '<th></th>' : ''}</tr></thead><tbody>
        ${rows.map(({ d, w, a }) => `<tr><td><div class="dp-who">${av(d, 'sm')}<span><b>${esc(nameOf(d))}</b><small>${a ? esc(ASS[a.tipo][0]) : w.anom ? '<em class="dp-an">manca l\'uscita</em>' : w.L.length ? w.L.map(p => `${String(p.ora).slice(0, 5)} ${TIPI[p.tipo] ? TIPI[p.tipo].toLowerCase() : p.tipo}${p.fonte === 'manuale' ? '*' : ''}`).join(' · ') : workday(S.day) ? 'nessuna timbratura' : 'riposo'}</small></span></div></td>
          <td class="num">${w.first ? String(w.first.ora).slice(0, 5) : '—'}</td><td class="num">${w.end ? String(w.end.ora).slice(0, 5) : w.open && !w.anom ? '<span class="chip paid">in corso</span>' : '—'}</td>
          <td class="r num">${w.pause ? hm(w.pause) : '—'}</td><td class="r num"><b>${w.min ? hm(w.min) : '—'}</b></td><td class="dp-axc">${a && !w.L.length ? `<div class="dp-bar2 abs"><span>${esc(ASS[a.tipo][0])}</span></div>` : bar(w)}</td>
          ${canW() ? `<td class="dp-go"><button type="button" class="btn sm" data-dp="fix:${esc(d.id)}:${S.day}">Correggi</button></td>` : ''}</tr>`).join('')}
        </tbody></table></div><p class="muted small dp-note">* timbratura inserita o corretta a mano</p></div>`;
    }
    const [y, m] = S.mon.split('-').map(Number), last = new Date(y, m, 0).getDate(), Ms = A.map(d => ({ d, M: month(d, S.mon) }));
    return `<div class="card dp-pc">${head}
      <div class="dp-tw dp-mw"><table class="dp-t dp-mon"><thead><tr><th class="dp-stk">Dipendente</th><th class="r dp-mt">Ore</th><th class="r dp-mt">Gg</th><th class="r dp-mt dp-mt2">Straord.</th>${Array.from({ length: last }, (_, i) => { const day = `${S.mon}-${pad(i + 1)}`; return `<th class="c${workday(day) ? '' : ' we'}${day === today() ? ' td' : ''}"><span>${GG[parseD(day).getDay()][0].toUpperCase()}</span>${i + 1}</th>`; }).join('')}</tr></thead><tbody>
      ${Ms.map(({ d, M }) => `<tr><td class="dp-stk"><div class="dp-who">${av(d, 'sm')}<span><b>${esc(nameOf(d))}</b>${M.an ? `<small class="dp-an">${M.an} ${M.an === 1 ? 'uscita mancante' : 'uscite mancanti'}</small>` : ''}</span></div></td><td class="r num dp-mt"><b>${hm(M.tot)}</b></td><td class="r num dp-mt">${M.gl}</td><td class="r num dp-mt dp-mt2">${M.extra >= 30 ? hm(M.extra) : '—'}</td>
        ${M.days.map(x => `<td class="c${workday(x.day) ? '' : ' we'}${x.day === today() ? ' td' : ''}${x.w.anom ? ' an' : ''}${canW() ? ' ed' : ''}"${canW() ? ` data-dp="fix:${esc(d.id)}:${x.day}"` : ''} title="${esc(C.dIt(x.day))}${x.w.min ? ' · ' + hm(x.w.min) : ''}${x.a ? ' · ' + ASS[x.a.tipo][0] : ''}">${x.w.min ? `<b>${hDec(x.w.min)}</b>` : x.a ? `<em class="dp-al ${x.a.tipo}">${ASS[x.a.tipo][1]}</em>` : x.w.anom ? '<em class="dp-al an">!</em>' : ''}</td>`).join('')}</tr>`).join('')}
      </tbody></table></div>
      <div class="dp-leg"><span><em class="dp-al ferie">F</em>Ferie</span><span><em class="dp-al permesso">P</em>Permesso</span><span><em class="dp-al malattia">M</em>Malattia</span><span><em class="dp-al an">!</em>Uscita mancante</span><span>Ore in decimali · straordinari oltre ${hDec(A.length ? dailyMin(A[0]) : 480)} h al giorno</span></div></div>`;
  }

  // ---- Ferie e permessi ----
  function reqRow(a, opts = {}) {
    const d = dipOf(a.dip) || {}, st = AST[a.stato] || AST.attesa, gg = a.tipo === 'permesso' && N(a.ore) ? `${C.fmtNum(N(a.ore), 1).replace(/,0$/, '')} ore` : `${workDays(a.dal, a.al || a.dal)} ${workDays(a.dal, a.al || a.dal) === 1 ? 'giorno' : 'giorni'}`;
    return `<div class="dp-req">${av(d, 'sm')}<div class="dp-rq"><b>${opts.noName ? '' : esc(nameOf(d)) + ' · '}${esc(ASS[a.tipo] ? ASS[a.tipo][0] : a.tipo)}</b><small>${a.dal === (a.al || a.dal) ? esc(dLong(a.dal)) : `dal ${esc(C.dIt(a.dal))} al ${esc(C.dIt(a.al))}`} · ${gg}${a.motivo ? ' · «' + esc(a.motivo) + '»' : ''}${a.risposta ? ' · risposta: ' + esc(a.risposta) : ''}</small></div>
      <span class="chip ${st[0]}">${st[1]}</span>${canW() ? (a.stato === 'attesa' ? `<span class="dp-ra"><button type="button" class="btn sm dp-ok" data-dp="dec:${esc(a.id)}:approvata">${svg('check')}Approva</button><button type="button" class="btn sm" data-dp="dec:${esc(a.id)}:rifiutata">Rifiuta</button></span>` : `<span class="dp-ra"><button type="button" class="btn sm ghost" data-dp="aedit:${esc(a.id)}">Modifica</button></span>`) : ''}</div>`;
  }
  function tabFerie() {
    const P = ASSE().filter(a => a.stato === 'attesa').sort((a, b) => String(a.dal).localeCompare(String(b.dal)));
    const F = ASSE().filter(a => a.stato !== 'attesa' && a.stato !== 'rifiutata' && (a.al || a.dal) >= today()).sort((a, b) => String(a.dal).localeCompare(String(b.dal)));
    const R = ASSE().filter(a => a.stato !== 'attesa' && !F.includes(a)).sort((a, b) => String(b.dal).localeCompare(String(a.dal))).slice(0, 12);
    const y = String(new Date().getFullYear());
    return `<div class="dp-two"><div class="card"><div class="card-h"><h3>Da approvare</h3>${canW() ? `<button type="button" class="btn sm" data-dp="anew">${svg('plus')}Inserisci assenza</button>` : ''}</div>${P.length ? P.map(a => reqRow(a)).join('') : '<div class="empty">Nessuna richiesta in attesa</div>'}</div>
      <div class="card"><div class="card-h"><h3>Prossime assenze</h3></div>${F.length ? F.map(a => reqRow(a)).join('') : '<div class="empty">Nessuna assenza in programma</div>'}</div></div>
      <div class="card"><div class="card-h"><h3>Saldo ${y}</h3><span class="muted small">ferie in giorni lavorativi · permessi in ore · spettanti in proporzione all'assunzione</span></div>
      <div class="dp-tw"><table class="dp-t"><thead><tr><th>Dipendente</th><th class="r">Ferie spettanti</th><th class="r">Godute</th><th class="r">In attesa</th><th class="r">Residue</th><th class="r">Permessi residui</th><th class="r">Malattia</th></tr></thead><tbody>
      ${active().sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'it')).map(d => { const s = saldo(d, y); return `<tr data-dp="open:${esc(d.id)}:ferie"><td><div class="dp-who">${av(d, 'sm')}<b>${esc(nameOf(d))}</b></div></td><td class="r num">${C.fmtNum(s.fs, 1).replace(/,0$/, '')}</td><td class="r num">${s.fg}</td><td class="r num">${s.fa || '—'}</td><td class="r num"><b class="${s.fr < 0 ? 'dp-neg' : ''}">${C.fmtNum(s.fr, 1).replace(/,0$/, '')}</b></td><td class="r num">${C.fmtNum(s.pr, 1).replace(/,0$/, '')} h</td><td class="r num">${s.mg ? s.mg + ' gg' : '—'}</td></tr>`; }).join('')}
      </tbody></table></div></div>
      ${R.length ? `<div class="card"><div class="card-h"><h3>Storico</h3></div>${R.map(a => reqRow(a)).join('')}</div>` : ''}`;
  }

  // ---- Scadenze ----
  function tabScad() {
    const L = active().flatMap(d => scad(d).map(x => ({ ...x, dd: d }))).sort((a, b) => a.g - b.g);
    return `<div class="card"><div class="card-h"><h3>Scadenze del personale</h3><span class="muted small">fine contratto, visite mediche, corsi di sicurezza</span></div>
      ${L.length ? L.map(x => `<button type="button" class="dp-sc" data-dp="open:${esc(x.dd.id)}:anag">${av(x.dd, 'sm')}<span class="dp-rq"><b>${esc(x.l)} · ${esc(nameOf(x.dd))}</b><small>${esc(C.dIt(x.d))}</small></span><span class="chip ${scadCls(x.g)}">${esc(scadTxt(x.g))}</span>${svg('go', 'dp-gi')}</button>`).join('') : '<div class="empty">Nessuna scadenza registrata: aggiungi le date nella scheda di ogni dipendente</div>'}</div>`;
  }

  /* ---------- scheda del dipendente ---------- */
  function detail() {
    const nw = S.det === 'new', d = nw ? { id: '', nome: '', cognome: '', stato: 'attivo', ore: 40, ferie: 26, permessi: 32, contratto: CONTR[0], sede: (C.centri()[0] || '') } : dipOf(S.det);
    const T = nw ? [['anag', 'Anagrafica']] : [['riepilogo', 'Riepilogo'], ['pres', 'Presenze'], ['ferie', 'Ferie e permessi'], ['anag', 'Anagrafica'], ...(owner() ? [['acc', 'Accesso']] : [])];
    if (!T.some(t => t[0] === S.dtab)) S.dtab = T[0][0];
    const n = nw ? null : now(d);
    const body = S.dtab === 'anag' ? anag(d, nw) : S.dtab === 'pres' ? dPres(d) : S.dtab === 'ferie' ? dFerie(d) : S.dtab === 'acc' ? acc(d) : riep(d);
    return `<div class="dp-dh"><button type="button" class="btn sm" data-dp="back">${svg('back')}Dipendenti</button></div>
      <div class="card dp-hero">${nw ? `<span class="dp-av lg" style="--c:#94a3b8">${svg('plus')}</span>` : `<button type="button" class="dp-avb" data-dp="foto:${esc(d.id)}"${canW() ? '' : ' disabled'} aria-label="${canW() ? 'Cambia la foto profilo' : 'Foto profilo'}">${av(d, 'lg')}${canW() ? `<i class="dp-cam">${svg('cam')}</i>` : ''}</button>`}<div class="dp-ht"><h2>${nw ? 'Nuovo dipendente' : esc(nameOf(d))}</h2><p>${nw ? 'Compila i dati e salva: poi potrai dargli l\'accesso al gestionale e all\'app Presenze' : esc([d.mansione, d.reparto, d.sede].filter(Boolean).join(' · ') || 'Mansione non indicata')}</p>
        ${nw ? '' : `<div class="dp-hc">${d.stato === 'cessato' ? '<span class="chip">Cessato</span>' : `<span class="chip ${n.c}">${esc(n.t)}</span>`}${d.contratto ? `<span class="chip">${esc(d.contratto)}</span>` : ''}${staffOf(d) ? `<span class="chip paid">${svg('key')}Accesso attivo</span>` : ''}${d.foto && canW() ? `<button type="button" class="dp-rm" data-dp="fotodel:${esc(d.id)}">Rimuovi foto</button>` : ''}</div>`}</div>
        ${!nw && canW() ? `<div class="dp-ha"><button type="button" class="btn sm" data-dp="fix:${esc(d.id)}:${today()}">${svg('clock')}Timbratura a mano</button><button type="button" class="btn sm dp-del" data-dp="del:${esc(d.id)}" title="Elimina dipendente">${svg('trash')}<span class="dp-hm">Elimina</span></button></div>` : ''}</div>
      ${T.length > 1 ? `<div class="seg dp-tabs dp-dt" role="tablist">${T.map(([k, l]) => `<button type="button" role="tab" data-dp="dtab:${k}" class="${S.dtab === k ? 'on' : ''}">${l}</button>`).join('')}</div>` : ''}
      ${body}`;
  }
  function riep(d) {
    const mk = today().slice(0, 7), M = month(d, mk), s = saldo(d), w = work(d.id, today()), sc = scad(d);
    const R = ASSE().filter(a => String(a.dip) === String(d.id)).sort((a, b) => String(b.creato || b.dal).localeCompare(String(a.creato || a.dal))).slice(0, 4);
    const cg = String(d.cognome || '').toLowerCase().trim(), nm = nameOf(d).toLowerCase(), gas = cg.length > 1 && C.secPerm('gasolio') ? (db().gasolio || []).filter(r => { const o = String(r.operatore || '').toLowerCase().trim(); return o && (o === nm || o.split(/\s+/).includes(cg)); }) : [];
    return `<div class="dp-kpis">
        <div class="card dp-k"><span>Ore di ${MESI[new Date().getMonth()]}</span><b>${hm(M.tot)}</b><small>${M.gl} ${M.gl === 1 ? 'giorno' : 'giorni'} lavorati</small></div>
        <div class="card dp-k"><span>Straordinari</span><b>${hm(M.extra)}</b><small>oltre ${hDec(dailyMin(d))} h al giorno</small></div>
        <div class="card dp-k"><span>Ferie residue</span><b>${C.fmtNum(s.fr, 1).replace(/,0$/, '')} <em>gg</em></b><small>${s.fg} godute${s.fa ? ` · ${s.fa} in attesa` : ''}</small></div>
        <div class="card dp-k"><span>Permessi residui</span><b>${C.fmtNum(s.pr, 1).replace(/,0$/, '')} <em>h</em></b><small>su ${C.fmtNum(s.ps, 1).replace(/,0$/, '')} h dell'anno</small></div></div>
      <div class="dp-two"><div class="card"><div class="card-h"><h3>Oggi</h3><span class="muted small">${esc(dLong(today()))}</span></div>
        ${w.L.length ? `<div class="dp-tl">${w.L.map(p => `<div class="dp-tli ${esc(p.tipo)}"><b>${String(p.ora).slice(0, 5)}</b><span>${esc(TIPI[p.tipo] || p.tipo)}${p.fonte === 'manuale' ? ' <em>a mano</em>' : ''}</span></div>`).join('')}</div><p class="dp-tot">Totale <b>${hm(w.min)}</b>${w.open ? ' · in corso' : ''}</p>` : `<div class="empty">${absOn(d.id, today()) ? esc(ASS[absOn(d.id, today()).tipo][0]) : 'Nessuna timbratura oggi'}</div>`}</div>
        <div class="card"><div class="card-h"><h3>Scadenze</h3></div>${sc.length ? sc.map(x => `<div class="dp-sr"><span>${esc(x.l)}<small>${esc(C.dIt(x.d))}</small></span><span class="chip ${scadCls(x.g)}">${esc(scadTxt(x.g))}</span></div>`).join('') : '<div class="empty">Nessuna scadenza: aggiungile in Anagrafica</div>'}</div></div>
      <div class="dp-two"><div class="card"><div class="card-h"><h3>Ultime richieste</h3><button type="button" class="btn sm ghost" data-dp="dtab:ferie">Tutte</button></div>${R.length ? R.map(a => reqRow(a, { noName: true })).join('') : '<div class="empty">Nessuna richiesta</div>'}</div>
        <div class="card"><div class="card-h"><h3>Contatti e contratto</h3></div><div class="dp-kv">${[['Telefono', d.tel ? `<a href="tel:${esc(String(d.tel).replace(/\s+/g, ''))}">${esc(d.tel)}</a>` : ''], ['Email', d.email ? `<a href="mailto:${esc(d.email)}">${esc(d.email)}</a>` : ''], ['Assunto il', esc(C.dIt(d.assunzione))], ['Ore settimanali', d.ore ? esc(C.fmtNum(N(d.ore), 1).replace(/,0$/, '')) : ''], ['Livello', esc(d.livello || '')], ...(owner() ? [['Costo orario', N(d.costo) ? C.eur(N(d.costo)) : '']] : [])].filter(x => x[1]).map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('') || '<div class="empty">Completa l\'anagrafica</div>'}</div>
        ${gas.length ? `<button type="button" class="dp-link" data-dp="gas:${esc(d.id)}">${svg('fuel')}<span>${gas.length} rifornimenti di carburante a suo nome</span>${svg('go')}</button>` : ''}</div></div>`;
  }
  const fld = (d, k, l, o = {}) => `<label class="f${o.w2 ? ' dp-w2' : ''}"><span>${l}</span>${o.sel ? `<select name="${k}">${o.sel.map(v => `<option${String(d[k] || '') === v ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select>` : `<input name="${k}" type="${o.t || 'text'}" value="${esc(d[k] == null ? '' : o.im === 'decimal' ? String(d[k]).replace('.', ',') : d[k])}"${o.ph ? ` placeholder="${esc(o.ph)}"` : ''}${o.req ? ' required' : ''}${o.im ? ` inputmode="${o.im}"` : ''}>`}</label>`;
  function anag(d, nw) {
    const ro = !canW(), cen = C.centri(), sedi = cen.length ? cen : [''];
    if (d.sede && !sedi.includes(d.sede)) sedi.push(d.sede);
    return `<form class="card dp-form" id="dp-af"${ro ? ' inert' : ''}>
      <h4>Dati personali</h4><div class="dp-g">${fld(d, 'nome', 'Nome', { req: 1 })}${fld(d, 'cognome', 'Cognome')}${fld(d, 'cf', 'Codice fiscale')}${fld(d, 'nascita', 'Data di nascita', { t: 'date' })}${fld(d, 'tel', 'Telefono', { im: 'tel' })}${fld(d, 'email', 'Email', { t: 'email' })}${fld(d, 'indirizzo', 'Indirizzo', { w2: 1 })}</div>
      <h4>Lavoro</h4><div class="dp-g">${fld(d, 'mansione', 'Mansione', { ph: 'Es. magazziniere, pizzaiolo, commessa' })}${fld(d, 'reparto', 'Reparto')}${fld(d, 'sede', C.sedeWord(), { sel: sedi })}${fld(d, 'contratto', 'Contratto', { sel: CONTR })}${fld(d, 'livello', 'Livello / CCNL')}${fld(d, 'ore', 'Ore settimanali', { im: 'decimal' })}${fld(d, 'assunzione', 'Data di assunzione', { t: 'date' })}${fld(d, 'fine', 'Fine contratto', { t: 'date' })}</div>
      <h4>Ferie, costi e scadenze</h4><div class="dp-g">${fld(d, 'ferie', 'Giorni di ferie all\'anno', { im: 'decimal' })}${fld(d, 'permessi', 'Ore di permesso all\'anno', { im: 'decimal' })}${owner() ? fld(d, 'costo', 'Costo orario aziendale €', { im: 'decimal', ph: 'Es. 18,50' }) + fld(d, 'iban', 'IBAN per lo stipendio') : ''}${fld(d, 'visita', 'Scadenza visita medica', { t: 'date' })}${fld(d, 'corso', 'Scadenza corso sicurezza', { t: 'date' })}</div>
      <h4>Altro</h4><div class="dp-g">${fld(d, 'stato', 'Stato', { sel: ['attivo', 'cessato'] })}<label class="f dp-w2"><span>Note</span><textarea name="note" rows="2">${esc(d.note || '')}</textarea></label></div>
      ${ro ? '' : `<div class="dp-fa">${nw ? '' : `<button type="button" class="btn sm st-btn-d" data-dp="del:${esc(d.id)}">Elimina dipendente</button>`}<span></span><button type="submit" class="btn primary">${nw ? 'Aggiungi dipendente' : 'Salva modifiche'}</button></div>`}</form>`;
  }
  function dPres(d) {
    const M = month(d, S.pvMon);
    return `<div class="card"><div class="dp-ph"><div class="dp-nav"><button type="button" class="icon-btn" data-dp="pvprev">‹</button><b>${esc(mLbl(S.pvMon))}</b><button type="button" class="icon-btn" data-dp="pvnext"${S.pvMon >= today().slice(0, 7) ? ' disabled' : ''}>›</button></div><span class="muted small">${hm(M.tot)} in ${M.gl} ${M.gl === 1 ? 'giorno' : 'giorni'}${M.extra >= 30 ? ` · ${hm(M.extra)} di straordinario` : ''}</span></div>
      <div class="dp-days">${M.days.filter(x => x.day <= today()).reverse().map(x => `<div class="dp-dr${workday(x.day) ? '' : ' we'}${x.w.anom ? ' an' : ''}"><span class="dp-dd"><b>${parseD(x.day).getDate()}</b>${GG[parseD(x.day).getDay()]}</span>
        <span class="dp-dl">${x.w.L.length ? x.w.L.map(p => `<span class="dp-pu ${esc(p.tipo)}">${String(p.ora).slice(0, 5)} ${esc((TIPI[p.tipo] || p.tipo).toLowerCase())}${p.fonte === 'manuale' ? '*' : ''}</span>`).join('') : x.a ? `<span class="chip">${esc(ASS[x.a.tipo][0])}</span>` : `<span class="muted small">${workday(x.day) ? 'nessuna timbratura' : 'riposo'}</span>`}${x.w.anom ? '<em class="dp-an">manca l\'uscita</em>' : ''}</span>
        <b class="dp-dh2">${x.w.min ? hm(x.w.min) : ''}</b>${canW() ? `<button type="button" class="btn sm ghost" data-dp="fix:${esc(d.id)}:${x.day}">${svg('edit')}</button>` : ''}</div>`).join('')}</div></div>`;
  }
  function dFerie(d) {
    const s = saldo(d), L = ASSE().filter(a => String(a.dip) === String(d.id)).sort((a, b) => String(b.dal).localeCompare(String(a.dal)));
    return `<div class="dp-kpis"><div class="card dp-k"><span>Ferie spettanti ${new Date().getFullYear()}</span><b>${C.fmtNum(s.fs, 1).replace(/,0$/, '')} <em>gg</em></b><small>${N(d.ferie || 26)} all'anno</small></div><div class="card dp-k"><span>Godute</span><b>${s.fg} <em>gg</em></b><small>${s.fa ? s.fa + ' in attesa' : 'approvate'}</small></div><div class="card dp-k"><span>Residue</span><b class="${s.fr < 0 ? 'dp-neg' : ''}">${C.fmtNum(s.fr, 1).replace(/,0$/, '')} <em>gg</em></b><small>da godere</small></div><div class="card dp-k"><span>Permessi residui</span><b>${C.fmtNum(s.pr, 1).replace(/,0$/, '')} <em>h</em></b><small>${C.fmtNum(s.pg, 1).replace(/,0$/, '')} h usate</small></div></div>
      <div class="card"><div class="card-h"><h3>Richieste e assenze</h3>${canW() ? `<button type="button" class="btn sm" data-dp="anew:${esc(d.id)}">${svg('plus')}Inserisci assenza</button>` : ''}</div>${L.length ? L.map(a => reqRow(a, { noName: true })).join('') : '<div class="empty">Nessuna richiesta: il dipendente le fa dall\'app Presenze</div>'}</div>`;
  }
  // ---- accesso al gestionale e all'app Presenze ----
  const SECS = () => C.sections();
  function acc(d) {
    const u = staffOf(d), cr = S.creds && S.creds.dip === d.id ? S.creds : null;
    const kind = u ? (u.ruolo === 'utente' ? 'resp' : u.ruolo === 'lettura' ? 'ro' : Object.values(u.sezioni || {}).some(Boolean) ? 'ges' : 'pz') : (S.akind || 'pz');
    const perm = u ? (u.sezioni || {}) : (S.aperm || {});
    const sugg = d.email || `${String(d.nome || '').toLowerCase()}.${String(d.cognome || '').toLowerCase()}`.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9.]/g, '').replace(/^\.|\.$/g, '');
    const K = [['pz', 'Solo app Presenze', 'timbra e chiede ferie e permessi, non entra nel gestionale'], ['ges', 'Presenze + gestionale', 'entra nel gestionale e vede solo le sezioni che scegli tu'], ['resp', 'Responsabile', 'vede e modifica tutto, anche i dipendenti e gli accessi'], ['ro', 'Sola lettura', 'vede tutto il gestionale ma non può modificare']];
    return `${cr ? `<div class="card dp-cred"><div class="dp-credi">${svg('key')}</div><div><h3>Credenziali di ${esc(nameOf(d))}</h3><p>Dagliele a voce o mandale: al primo accesso gli chiederà di cambiare la password. ${cr.inviata ? '<b>Le abbiamo mandate anche via email.</b>' : ''}</p>
        <div class="dp-cr"><span>Accesso</span><b>${esc(cr.login)}</b><button type="button" class="btn sm ghost" data-dp="copy:${esc(cr.login)}">${svg('copy')}</button></div><div class="dp-cr"><span>Password</span><b class="mono">${esc(cr.pw)}</b><button type="button" class="btn sm ghost" data-dp="copy:${esc(cr.pw)}">${svg('copy')}</button></div>
        <div class="dp-cra"><a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/${esc(String(d.tel || '').replace(/\D/g, '').replace(/^(?!39)(3\d{8,9})$/, '39$1'))}?text=${encodeURIComponent(`Ciao ${d.nome || ''}, ecco il tuo accesso.\nPresenze: ${pzUrl()}\nGestionale: ${pzUrl().replace(/presenze\/$/, '')}\nAccesso: ${cr.login}\nPassword provvisoria: ${cr.pw}`)}">Manda su WhatsApp</a><button type="button" class="btn sm" data-dp="copy:${esc(`Presenze: ${pzUrl()}\nAccesso: ${cr.login}\nPassword provvisoria: ${cr.pw}`)}">Copia tutto</button><button type="button" class="btn sm ghost" data-dp="credok">Fatto</button></div></div></div>` : ''}
      <div class="card dp-acc"><div class="card-h"><h3>${u ? 'Accesso' : 'Dai un accesso'}</h3>${u ? `<span class="chip ${u.stato === 'attivo' ? 'paid' : 'late'}">${u.stato === 'attivo' ? 'Attivo' : 'Sospeso'}</span>` : ''}</div>
        ${u ? `<div class="dp-kv">${[['Accesso', esc(u.email)], ['Ultimo accesso', u.ultimo ? esc(new Date(u.ultimo).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })) : 'mai'], ['Accessi', String(u.accessi || 0)], ...(u.cambia ? [['Password', 'provvisoria, da cambiare']] : [])].map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('')}</div>`
          : `<label class="f"><span>Email oppure nome utente per entrare</span><input id="dp-login" value="${esc(S.alogin || sugg)}" placeholder="mario.rossi oppure mario@azienda.it" autocomplete="off"></label><p class="muted small">Con l'email può recuperare la password da solo; con un nome utente la password gliela dai tu.</p>`}
        <h4>Cosa può fare</h4><div class="dp-kind">${K.map(([k, l, s]) => `<label class="dp-ko${kind === k ? ' on' : ''}"><input type="radio" name="dp-kind" value="${k}"${kind === k ? ' checked' : ''}><span><b>${l}</b><small>${s}</small></span></label>`).join('')}</div>
        <div class="dp-perm"${kind === 'ges' ? '' : ' hidden'}><h4>Sezioni del gestionale</h4><div class="dp-pm">${SECS().map(x => { const v = perm[x.k] === 'w' || perm[x.k] === true ? 'w' : perm[x.k] === 'r' ? 'r' : ''; return `<div class="dp-pr"><span>${esc(x.t)}</span><div class="seg dp-p3" data-perm="${x.k}">${[['', 'No'], ['r', 'Vede'], ['w', 'Modifica']].map(([pv, pl]) => `<button type="button" data-pv="${pv}" class="${v === pv ? 'on' : ''}">${pl}</button>`).join('')}</div></div>`; }).join('')}</div><p class="muted small">«Vede» mostra la sezione senza poter cambiare nulla. I dati delle sezioni che non vede non arrivano proprio sul suo dispositivo.</p></div>
        <div class="dp-fa">${u ? `<button type="button" class="btn sm st-btn-d" data-dp="adel">Togli l'accesso</button><button type="button" class="btn sm" data-dp="apw">Nuova password</button><button type="button" class="btn sm" data-dp="asus">${u.stato === 'attivo' ? 'Sospendi' : 'Riattiva'}</button>` : `${d.email ? `<label class="dp-chk"><input type="checkbox" id="dp-inv" checked> Mandagli le credenziali via email</label>` : ''}`}<span></span><button type="button" class="btn primary" data-dp="asave">${u ? 'Salva permessi' : 'Crea l\'accesso'}</button></div></div>`;
  }

  /* ---------- moduli (timbrature a mano, assenze, impostazioni) ---------- */
  function fixForm(id, day) {
    const d = dipOf(id); if (!d) return;
    const L = punches(id, day).map(p => ({ ...p }));
    const row = (p, i) => `<div class="dp-fx" data-i="${i}"><select name="t${i}">${Object.entries(TIPI).map(([k, l]) => `<option value="${k}"${p.tipo === k ? ' selected' : ''}>${l}</option>`).join('')}</select><input name="o${i}" type="time" step="60" value="${esc(String(p.ora || '').slice(0, 5))}" required><input name="n${i}" value="${esc(p.nota || '')}" placeholder="Nota (facoltativa)"><button type="button" class="pv-lb d" data-fxdel="${i}" title="Togli">${svg('x')}</button>${p.fonte && p.fonte !== 'manuale' ? '<small>dall\'app</small>' : ''}</div>`;
    const draw = () => { $('#dp-fxl').innerHTML = L.length ? L.map(row).join('') : '<div class="empty">Nessuna timbratura</div>'; };
    C.openSheet(`Timbrature · ${nameOf(d)}`, `<p class="muted small" style="margin:0 0 12px">${esc(dLong(day).replace(/^./, c => c.toUpperCase()))}. Le timbrature corrette restano segnate come inserite a mano.</p><div id="dp-fxl" class="dp-fxl"></div>
      <div class="dp-fxa"><button type="button" class="btn sm" id="dp-fxadd">${svg('plus')}Aggiungi timbratura</button><button type="button" class="btn sm ghost" id="dp-fxday">Giornata standard</button></div>`, fd => {
      const nowS = new Date().toISOString(), keep = new Set(), ops = [];
      L.forEach((p, i) => { const o = String(fd.get('o' + i) || '').trim(); if (!o) return; const tp = String(fd.get('t' + i) || 'in'), nt = String(fd.get('n' + i) || '').trim(), ora = o.length === 5 ? o + ':00' : o; const ch = !p.id || ora !== String(p.ora) || tp !== p.tipo || nt !== (p.nota || ''); const id0 = p.id || 'pz' + C.uid(); keep.add(id0); if (ch) ops.push({ action: 'upsert', sheet: 'Presenze', row: { id: id0, dip: d.id, data: day, ora, tipo: tp, sede: p.sede || d.sede || '', fonte: 'manuale', luogo: p.luogo || '', disp: p.disp || '', nota: nt, chi: (C.me() || {}).email || '', creato: p.creato || nowS } }); });
      punches(id, day).forEach(p => { if (!keep.has(p.id)) ops.push({ action: 'delete', sheet: 'Presenze', id: p.id }); });
      if (ops.length) { C.write(ops); C.toast('Timbrature salvate'); } return true;
    }, null, 'Salva');
    $('#sheet-form').classList.add('wide');
    const sync = () => { const f = $('#sheet-form'); L.forEach((p, i) => { if (!f.elements['o' + i]) return; p.tipo = f.elements['t' + i].value; p.ora = f.elements['o' + i].value; p.nota = f.elements['n' + i].value; }); };
    draw();
    $('#dp-fxadd').onclick = () => { sync(); const last = L[L.length - 1], nx = !last ? 'in' : last.tipo === 'in' || last.tipo === 'rientro' ? 'out' : last.tipo === 'pausa' ? 'rientro' : 'in'; L.push({ tipo: nx, ora: '', nota: '' }); draw(); const ins = $$('#dp-fxl input[type=time]'); if (ins.length) ins[ins.length - 1].focus(); };
    $('#dp-fxday').onclick = () => { sync(); const h = dailyMin(d), st = 8 * 60 + 30, half = Math.round(h / 2); L.length = 0; [['in', st], ['pausa', st + half], ['rientro', st + half + 60], ['out', st + h + 60]].forEach(([t, m]) => L.push({ tipo: t, ora: `${pad(Math.floor(m / 60))}:${pad(m % 60)}`, nota: '' })); draw(); };
    $('#dp-fxl').onclick = e => { const b = e.target.closest('[data-fxdel]'); if (!b) return; sync(); L.splice(+b.dataset.fxdel, 1); draw(); };
  }
  function assForm(a0, dipId) {
    const nw = !a0, a = a0 ? { ...a0 } : { id: 'as' + C.uid(), dip: dipId || '', tipo: 'ferie', dal: today(), al: today(), ore: '', motivo: '', stato: 'approvata', risposta: '', chi: (C.me() || {}).email || '', creato: new Date().toISOString(), deciso: '' };
    const D = active().sort((x, y) => nameOf(x).localeCompare(nameOf(y), 'it'));
    C.openSheet(nw ? 'Inserisci assenza' : 'Modifica assenza', `<label class="f"><span>Dipendente</span><select name="dip" required>${D.map(d => `<option value="${esc(d.id)}"${String(a.dip) === String(d.id) ? ' selected' : ''}>${esc(nameOf(d))}</option>`).join('')}</select></label>
      <div class="f-row"><label class="f"><span>Tipo</span><select name="tipo">${Object.entries(ASS).map(([k, v]) => `<option value="${k}"${a.tipo === k ? ' selected' : ''}>${v[0]}</option>`).join('')}</select></label><label class="f"><span>Stato</span><select name="stato">${Object.entries(AST).map(([k, v]) => `<option value="${k}"${a.stato === k ? ' selected' : ''}>${v[1]}</option>`).join('')}</select></label></div>
      <div class="f-row"><label class="f"><span>Dal</span><input type="date" name="dal" value="${esc(a.dal)}" required></label><label class="f"><span>Al</span><input type="date" name="al" value="${esc(a.al || a.dal)}" required></label><label class="f"><span>Ore (permessi)</span><input name="ore" inputmode="decimal" value="${esc(a.ore == null ? '' : a.ore)}"></label></div>
      <label class="f"><span>Motivo o note</span><input name="motivo" value="${esc(a.motivo || '')}"></label>`, fd => {
      const o = { ...a }; ['dip', 'tipo', 'stato', 'dal', 'al', 'motivo'].forEach(k => { o[k] = String(fd.get(k) || '').trim(); }); o.ore = o.tipo === 'permesso' ? N(fd.get('ore')) : ''; if (o.al < o.dal) { C.toast('La data di fine è prima di quella di inizio'); return; } if (o.stato !== a.stato && o.stato !== 'attesa') o.deciso = new Date().toISOString();
      C.write([{ action: 'upsert', sheet: 'Assenze', row: o }]); C.toast(nw ? 'Assenza inserita' : 'Assenza aggiornata'); return true;
    }, nw ? null : () => { if (!confirm('Eliminare questa assenza?')) return; C.write([{ action: 'delete', sheet: 'Assenze', id: a.id }]); C.toast('Assenza eliminata'); return true; }, nw ? 'Inserisci' : 'Salva');
  }
  function setForm() {
    const s = set();
    C.openSheet('Impostazioni presenze', `<label class="f"><span>Giorni lavorativi a settimana</span><select name="giorni"><option value="5"${s.giorni < 6 ? ' selected' : ''}>5 · dal lunedì al venerdì</option><option value="6"${s.giorni >= 6 ? ' selected' : ''}>6 · dal lunedì al sabato</option></select></label>
      <label class="dp-chk dp-chkb"><input type="checkbox" name="geo"${s.geo ? ' checked' : ''}><span><b>Chiedi la posizione quando timbrano</b><small>Il telefono chiede il permesso la prima volta; la posizione resta salvata con la timbratura.</small></span></label>
      <div class="dp-pzl"><span>Link dell'app Presenze</span><b>${esc(pzUrl())}</b><button type="button" class="btn sm" data-dp="copy:${esc(pzUrl())}">${svg('copy')}Copia</button></div>`, fd => { C.setConfig('pzSet', { ...s, giorni: N(fd.get('giorni')) || 5, geo: !!fd.get('geo') }); C.toast('Impostazioni salvate'); return true; }, null, 'Salva');
  }
  const $ = (q, r = document) => r.querySelector(q), $$ = (q, r = document) => [...r.querySelectorAll(q)];

  /* ---------- export del foglio presenze ---------- */
  function sheetRows() {
    const [y, m] = S.mon.split('-').map(Number), last = new Date(y, m, 0).getDate(), A = active().sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'it'));
    return { last, A, Ms: A.map(d => ({ d, M: month(d, S.mon) })) };
  }
  async function exportXls() {
    await C.loadXlsx(); const X = window.XLSX, { last, Ms } = sheetRows();
    const head = ['Dipendente', 'Mansione', ...Array.from({ length: last }, (_, i) => String(i + 1)), 'Ore totali', 'Giorni lavorati', 'Straordinari (ore)', 'Ferie (gg)', 'Permessi (gg)', 'Malattia (gg)'];
    const rows = Ms.map(({ d, M }) => [nameOf(d), d.mansione || '', ...M.days.map(x => x.w.min ? Math.round(x.w.min / 60 * 100) / 100 : x.a ? ASS[x.a.tipo][1] : ''), Math.round(M.tot / 60 * 100) / 100, M.gl, Math.round(M.extra / 60 * 100) / 100, M.days.filter(x => x.a && x.a.tipo === 'ferie').length, M.days.filter(x => x.a && x.a.tipo === 'permesso').length, M.days.filter(x => x.a && x.a.tipo === 'malattia').length]);
    const ws = X.utils.aoa_to_sheet([[`Foglio presenze · ${mLbl(S.mon)} · ${C.orgName()}`], [], head, ...rows]);
    ws['!cols'] = [{ wch: 24 }, { wch: 16 }, ...Array.from({ length: last }, () => ({ wch: 5 })), { wch: 10 }, { wch: 9 }, { wch: 11 }, { wch: 8 }, { wch: 9 }, { wch: 9 }];
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }];
    const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'Presenze');
    const det = [['Dipendente', 'Data', 'Ora', 'Tipo', 'Fonte', 'Nota']];
    Ms.forEach(({ d, M }) => M.days.forEach(x => x.w.L.forEach(p => det.push([nameOf(d), C.dIt(x.day), String(p.ora).slice(0, 5), TIPI[p.tipo] || p.tipo, p.fonte === 'manuale' ? 'a mano' : 'app', p.nota || '']))));
    const wd = X.utils.aoa_to_sheet(det); wd['!cols'] = [{ wch: 24 }, { wch: 11 }, { wch: 7 }, { wch: 10 }, { wch: 8 }, { wch: 30 }]; X.utils.book_append_sheet(wb, wd, 'Timbrature');
    const ab = [['Dipendente', 'Tipo', 'Dal', 'Al', 'Ore', 'Stato', 'Motivo']]; ASSE().filter(a => a.dal.slice(0, 7) <= S.mon && (a.al || a.dal).slice(0, 7) >= S.mon).forEach(a => ab.push([nameOf(dipOf(a.dip) || {}), ASS[a.tipo] ? ASS[a.tipo][0] : a.tipo, C.dIt(a.dal), C.dIt(a.al), a.ore || '', (AST[a.stato] || [, a.stato])[1], a.motivo || '']));
    const wa = X.utils.aoa_to_sheet(ab); wa['!cols'] = [{ wch: 24 }, { wch: 12 }, { wch: 11 }, { wch: 11 }, { wch: 6 }, { wch: 13 }, { wch: 30 }]; X.utils.book_append_sheet(wb, wa, 'Assenze');
    X.writeFile(wb, `presenze-${S.mon}.xlsx`, { compression: true }); C.toast('Foglio presenze in Excel creato');
  }
  async function exportPdf() {
    C.busy('Preparo il PDF…');
    try {
      const { last, Ms } = sheetRows(), [jsPDF, logo, fonts] = await Promise.all([C.loadPdf(), C.logoPng(), C.loadFonts()]);
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape', compress: true }); let FF = 'helvetica';
      if (fonts) { fonts.forEach(([w, data]) => { doc.addFileToVFS(`Inter-${w}.ttf`, data); doc.addFont(`Inter-${w}.ttf`, 'Inter', w === 'regular' ? 'normal' : w); }); FF = 'Inter'; }
      const W = 297, H = 210, M = 10;
      doc.setFillColor(23, 54, 109); doc.rect(0, 0, W, 26, 'F'); doc.setFillColor(51, 98, 171); doc.triangle(W * .6, 0, W, 0, W, 26, 'F');
      if (logo) { doc.setFillColor(255, 255, 255); doc.roundedRect(M, 7, 11, 11, 2.4, 2.4, 'F'); doc.addImage(logo, 'PNG', M + .6, 7.6, 9.8, 9.8); }
      doc.setTextColor(255, 255, 255); doc.setFont(FF, 'bold'); doc.setFontSize(14); doc.text(`Foglio presenze · ${mLbl(S.mon)}`, M + (logo ? 15 : 0), 13.5); doc.setFont(FF, 'normal'); doc.setFontSize(8.5); doc.text(`${C.orgName()} · ore lavorate in decimali · F ferie · P permesso · M malattia`, M + (logo ? 15 : 0), 19);
      doc.text(`Creato il ${new Date().toLocaleDateString('it-IT')}`, W - M, 13.5, { align: 'right' });
      const [y, m] = S.mon.split('-').map(Number);
      const head = ['Dipendente', ...Array.from({ length: last }, (_, i) => `${GG[new Date(y, m - 1, i + 1).getDay()][0].toUpperCase()}\n${i + 1}`), 'Ore', 'Gg', 'Str.'];
      const body = Ms.map(({ d, M: X }) => [nameOf(d), ...X.days.map(x => x.w.min ? hDec(x.w.min) : x.a ? ASS[x.a.tipo][1] : ''), hDec(X.tot), String(X.gl), X.extra >= 30 ? hDec(X.extra) : '']);
      const we = new Set(Array.from({ length: last }, (_, i) => i).filter(i => !workday(`${S.mon}-${pad(i + 1)}`)).map(i => i + 1));
      doc.autoTable({ startY: 32, head: [head], body, theme: 'grid', margin: { left: M, right: M },
        styles: { font: FF, fontSize: 6.6, cellPadding: { top: 1.6, bottom: 1.6, left: .6, right: .6 }, halign: 'center', lineColor: [227, 231, 238], lineWidth: .15, textColor: [31, 36, 48] },
        headStyles: { fillColor: [245, 247, 251], textColor: [74, 81, 96], fontStyle: 'bold', fontSize: 6.2 },
        columnStyles: { 0: { halign: 'left', cellWidth: 34, fontStyle: 'bold' }, [last + 1]: { fontStyle: 'bold', cellWidth: 10 }, [last + 2]: { cellWidth: 7 }, [last + 3]: { cellWidth: 9 } },
        didParseCell: c => { if (we.has(c.column.index)) c.cell.styles.fillColor = [241, 243, 247]; if (c.section === 'body' && /^[FPMA]$/.test(c.cell.raw)) { c.cell.styles.textColor = [165, 111, 0]; c.cell.styles.fontStyle = 'bold'; } } });
      let yy = doc.lastAutoTable.finalY + 10;
      if (yy < H - 30) { doc.setFont(FF, 'normal'); doc.setFontSize(8); doc.setTextColor(120, 128, 142); doc.text('Firma del responsabile', M, yy + 10); doc.line(M, yy + 18, M + 70, yy + 18); doc.text('Firma per il consulente del lavoro', W - M - 70, yy + 10); doc.line(W - M - 70, yy + 18, W - M, yy + 18); }
      doc.save(`presenze-${S.mon}.pdf`); C.busy(); C.toast('Foglio presenze in PDF creato');
    } catch (e) { C.busy(); C.toast('PDF non creato: ' + e.message); }
  }

  /* ---------- v144: mappa delle posizioni di entrata e uscita (file HTML scaricabile) ---------- */
  const parseLuogo = s => { const m = String(s || '').match(/(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)(?:\s*±\s*(\d+))?/); return m ? { lat: +m[1], lon: +m[2], acc: m[3] ? +m[3] : 0 } : null; };
  function mappaForm() {
    const isDay = S.pmode !== 'mese', [y, m] = S.mon.split('-').map(Number), dal = isDay ? S.day : `${S.mon}-01`, al = isDay ? S.day : `${S.mon}-${pad(new Date(y, m, 0).getDate())}`;
    const L = DIP().slice().sort((a, b) => (a.stato === 'cessato') - (b.stato === 'cessato') || nameOf(a).localeCompare(nameOf(b), 'it'));
    C.openSheet('Mappa delle timbrature', `<p class="muted small" style="margin:0 0 12px">Scarichi un file che si apre sul computer con la mappa: pallino verde per l'entrata, rosso per l'uscita.</p>
      <label class="f"><span>Dipendente</span><select name="dip"><option value="">Tutti i dipendenti</option>${L.map(d => `<option value="${esc(d.id)}">${esc(nameOf(d))}${d.stato === 'cessato' ? ' (cessato)' : ''}</option>`).join('')}</select></label>
      <div class="f-row"><label class="f"><span>Dal</span><input type="date" name="dal" value="${esc(dal)}" required></label><label class="f"><span>Al</span><input type="date" name="al" value="${esc(al)}" required></label></div>`,
      fd => { const r = exportMappa(String(fd.get('dip') || ''), String(fd.get('dal') || ''), String(fd.get('al') || '')); return r; }, null, 'Scarica la mappa');
  }
  function exportMappa(dipId, dal, al) {
    if (!dal || !al || al < dal) { C.toast('Controlla le date'); return false; }
    const P = PRE().filter(p => (p.tipo === 'in' || p.tipo === 'out') && String(p.data).slice(0, 10) >= dal && String(p.data).slice(0, 10) <= al && (!dipId || String(p.dip) === dipId))
      .sort((a, b) => String(a.data).localeCompare(String(b.data)) || String(a.ora).localeCompare(String(b.ora)));
    const pts = []; let senza = 0;
    P.forEach(p => { const g = parseLuogo(p.luogo); if (!g) { senza++; return; } pts.push({ n: nameOf(dipOf(p.dip) || {}), d: C.dIt(String(p.data).slice(0, 10)), o: String(p.ora).slice(0, 5), t: p.tipo, lat: g.lat, lon: g.lon, a: g.acc }); });
    if (!pts.length) { C.toast(P.length ? 'Nessuna di queste timbrature ha la posizione' : 'Nessuna timbratura in questo periodo'); return false; }
    const who = dipId ? nameOf(dipOf(dipId) || {}) : 'Tutti i dipendenti', per = dal === al ? C.dIt(dal) : `${C.dIt(dal)} – ${C.dIt(al)}`;
    const data = JSON.stringify(pts).replace(/</g, '\\u003c'), H = s => esc(s);
    const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mappa timbrature · ${H(who)}</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>*{box-sizing:border-box}body{margin:0;font:14px/1.4 system-ui,-apple-system,Segoe UI,sans-serif;color:#1f2430;display:flex;flex-direction:column;height:100vh}header{padding:12px 16px;border-bottom:1px solid #e3e7ee}header b{font-size:16px}header span{color:#6b7385;margin-left:8px}.lg{float:right;color:#6b7385}.lg i{display:inline-block;width:10px;height:10px;border-radius:50%;margin:0 4px 0 12px;vertical-align:-1px}main{flex:1;display:flex;min-height:0}#m{flex:1}#l{width:300px;overflow:auto;border-left:1px solid #e3e7ee}#l div{padding:8px 12px;border-bottom:1px solid #f0f2f6;cursor:pointer}#l div:hover{background:#f5f7fb}#l small{display:block;color:#6b7385}@media(max-width:700px){main{flex-direction:column}#l{width:auto;height:35%;border-left:0;border-top:1px solid #e3e7ee}}</style></head><body>
<header><span class="lg"><i style="background:#1baf7a"></i>Entrata<i style="background:#d94b3d"></i>Uscita</span><b>${H(who)}</b><span>${H(per)} · ${pts.length} ${pts.length === 1 ? 'posizione' : 'posizioni'}</span></header>
<main><div id="m"></div><div id="l"></div></main>
<script>const P=${data};const E=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const l=document.getElementById('l');l.innerHTML=P.map((p,i)=>'<div data-i="'+i+'"><b>'+E(p.n)+'</b><small>'+E(p.d)+' · '+E(p.o)+' · '+(p.t==='in'?'Entrata':'Uscita')+'</small></div>').join('');
if(window.L){const m=L.map('m');const T=[['https://{s}.basemaps.cartocdn.com/rasterTiles/voyager/{z}/{x}/{y}{r}.png',{subdomains:'abcd',maxZoom:19,attribution:'© OpenStreetMap © CARTO'}],['https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'© Esri'}]];let ti=0,tl=L.tileLayer(T[0][0],T[0][1]).addTo(m);tl.on('tileerror',()=>{if(ti===0){ti=1;m.removeLayer(tl);tl=L.tileLayer(T[1][0],T[1][1]).addTo(m)}});const k=P.map(p=>{const c=p.t==='in'?'#1baf7a':'#d94b3d';return L.circleMarker([p.lat,p.lon],{radius:9,color:'#fff',weight:2,fillColor:c,fillOpacity:1}).addTo(m).bindPopup('<b>'+E(p.n)+'</b><br>'+(p.t==='in'?'Entrata':'Uscita')+' · '+E(p.d)+' alle '+E(p.o)+(p.a?'<br>precisione ±'+p.a+' m':'')+'<br><a target="_blank" href="https://www.google.com/maps?q='+p.lat+','+p.lon+'">Apri in Google Maps</a>')});
m.fitBounds(L.latLngBounds(P.map(p=>[p.lat,p.lon])).pad(.2),{maxZoom:17});l.onclick=e=>{const d=e.target.closest('[data-i]');if(!d)return;const i=+d.dataset.i;m.setView([P[i].lat,P[i].lon],17);k[i].openPopup()}}
else{l.onclick=e=>{const d=e.target.closest('[data-i]');if(d){const p=P[+d.dataset.i];window.open('https://www.google.com/maps?q='+p.lat+','+p.lon)}};document.getElementById('m').innerHTML='<p style="padding:20px">Per vedere la mappa serve la connessione internet. Dalla lista a destra puoi aprire ogni posizione in Google Maps.</p>'}</script></body></html>`;
    const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tutti';
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' })); a.download = `mappa-timbrature-${dipId ? slug(who) : 'tutti'}-${dal}${al !== dal ? '_' + al : ''}.html`;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    C.toast(`Mappa scaricata · ${pts.length} posizioni${senza ? ` (${senza} timbrature senza posizione)` : ''}`); return true;
  }

  /* ---------- eventi ---------- */
  // foto profilo: ritaglio quadrato 128 px, JPEG leggero salvato nella scheda (si vede in tutte le liste e nell'app Presenze)
  const toAvatar = f => new Promise((ok, ko) => { const im = new Image(), u = URL.createObjectURL(f); im.onload = () => { URL.revokeObjectURL(u); const s = Math.min(im.width, im.height), c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 128, 128); x.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 128, 128); ok(c.toDataURL('image/jpeg', 0.8)); }; im.onerror = () => { URL.revokeObjectURL(u); ko(new Error('Immagine non valida')); }; im.src = u; });
  function fotoPick(id) {
    const d = dipOf(id); if (!d || !canW()) return;
    const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*';
    i.onchange = async () => { if (!i.files[0]) return; try { const foto = await toAvatar(i.files[0]); C.write([{ action: 'upsert', sheet: 'Dipendenti', row: { ...dipOf(id), foto } }]); C.toast('Foto aggiornata'); render(root, C); } catch (e) { C.toast(e.message || 'Non riesco a leggere la foto'); } };
    i.click();
  }
  function bind(el) {
    const re = () => render(el, C);
    el.addEventListener('click', async ev => {
      const t = ev.target, b = t.closest('[data-dp]'); if (!b || (b.tagName === 'TR' && t.closest('button'))) { if (!b) { const pv = t.closest('.dp-p3 [data-pv]'); if (pv) { pv.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === pv)); } } if (!b) return; }
      const [k, a1, a2] = b.dataset.dp.split(':');
      if (k === 'tab') { S.tab = a1; S.det = ''; re(); window.scrollTo(0, 0); }
      else if (k === 'fst') { S.fst = a1; re(); }
      else if (k === 'open') { S.det = a1; S.dtab = a2 || 'riepilogo'; S.creds = null; S.akind = ''; S.alogin = ''; re(); window.scrollTo(0, 0); }
      else if (k === 'back') { S.det = ''; S.creds = null; re(); }
      else if (k === 'new') { S.det = 'new'; S.dtab = 'anag'; re(); window.scrollTo(0, 0); setTimeout(() => { const i = el.querySelector('[name=nome]'); if (i) i.focus(); }, 60); }
      else if (k === 'dtab') { S.dtab = a1; re(); }
      else if (k === 'pmode') { S.pmode = a1; re(); }
      else if (k === 'dprev') { S.day = addD(S.day, -1); re(); } else if (k === 'dnext') { S.day = addD(S.day, 1); re(); } else if (k === 'dtoday') { S.day = today(); re(); }
      else if (k === 'mprev' || k === 'mnext') { const [y, m] = S.mon.split('-').map(Number), d = new Date(y, m - 1 + (k === 'mprev' ? -1 : 1), 1); S.mon = ymd(d).slice(0, 7); re(); }
      else if (k === 'pvprev' || k === 'pvnext') { const [y, m] = S.pvMon.split('-').map(Number), d = new Date(y, m - 1 + (k === 'pvprev' ? -1 : 1), 1); S.pvMon = ymd(d).slice(0, 7); re(); }
      else if (k === 'fix') fixForm(a1, a2);
      else if (k === 'anew') assForm(null, a1);
      else if (k === 'aedit') { const a = ASSE().find(x => String(x.id) === a1); if (a) assForm(a); }
      else if (k === 'dec') decide(a1, a2);
      else if (k === 'set') setForm();
      else if (k === 'xls') exportXls().catch(e => C.toast(e.message));
      else if (k === 'pdf') exportPdf();
      else if (k === 'mappa') mappaForm();
      else if (k === 'pzlink') pzLink();
      else if (k === 'copy') { const v = b.dataset.dp.slice(5); (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(() => C.toast('Copiato'), () => C.toast(v)); }
      else if (k === 'credok') { S.creds = null; re(); }
      else if (k === 'del') delDip(a1 || S.det);
      else if (k === 'gas') { C.goGas(String((dipOf(a1) || {}).cognome || '')); }
      else if (k === 'foto') fotoPick(a1);
      else if (k === 'fotodel') { const d0 = dipOf(a1); if (d0) { C.write([{ action: 'upsert', sheet: 'Dipendenti', row: { ...d0, foto: '' } }]); C.toast('Foto rimossa'); re(); } }
      else if (k === 'asave') accSave();
      else if (k === 'apw') accPw();
      else if (k === 'asus') accSus();
      else if (k === 'adel') accDel();
    });
    el.addEventListener('change', ev => {
      const t = ev.target;
      if (t.name === 'dp-kind') { S.akind = t.value; const p = el.querySelector('.dp-perm'); if (p) p.hidden = t.value !== 'ges'; el.querySelectorAll('.dp-ko').forEach(x => x.classList.toggle('on', x.querySelector('input').checked)); }
      if (t.id === 'dp-login') S.alogin = t.value;
    });
    el.addEventListener('input', ev => { const t = ev.target; if (t.id === 'dp-q') { clearTimeout(t._t); t._t = setTimeout(() => { S.q = t.value; re(); const i = el.querySelector('#dp-q'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 200); } });
    el.addEventListener('submit', ev => {
      if (ev.target.id !== 'dp-af') return; ev.preventDefault();
      const fd = new FormData(ev.target), nw = S.det === 'new', d0 = nw ? {} : dipOf(S.det), o = { ...d0 };
      ['nome', 'cognome', 'cf', 'nascita', 'tel', 'email', 'indirizzo', 'mansione', 'reparto', 'sede', 'contratto', 'livello', 'assunzione', 'fine', 'iban', 'visita', 'corso', 'stato', 'note'].forEach(k => { if (fd.has(k)) o[k] = String(fd.get(k) || '').trim(); });
      ['ore', 'ferie', 'permessi', 'costo'].forEach(k => { if (fd.has(k)) o[k] = String(fd.get(k) || '').trim() === '' ? '' : N(fd.get(k)); });
      if (!o.nome) { C.toast('Scrivi il nome'); return; }
      o.cf = String(o.cf || '').toUpperCase(); o.iban = String(o.iban || '').replace(/\s+/g, '').toUpperCase();
      if (nw) { o.id = 'dp' + C.uid(); o.creato = new Date().toISOString(); }
      C.write([{ action: 'upsert', sheet: 'Dipendenti', row: o }]);
      C.toast(nw ? `${nameOf(o)} aggiunto` : 'Dati salvati');
      if (nw) { S.det = o.id; S.dtab = owner() ? 'acc' : 'riepilogo'; re(); window.scrollTo(0, 0); }
    });
  }
  // eliminazione: scheda, accesso e (se si vuole) timbrature e assenze
  function delDip(id) {
    const d = dipOf(id); if (!d) return;
    const u = staffOf(d);
    C.openSheet(`Eliminare ${nameOf(d)}?`, `<p class="muted small" style="margin:0 0 14px">La scheda viene tolta${u ? ' e il suo accesso al gestionale e all\'app Presenze smette subito di funzionare' : ''}. Non si può annullare.</p>
      <label class="dp-chk dp-chkb"><input type="checkbox" name="tutto"><span><b>Elimina anche tutto lo storico</b><small>Timbrature, ferie, permessi e malattie. Se non lo spunti restano nei fogli e nei report.</small></span></label>
      ${d.stato !== 'cessato' ? `<div class="dp-alt"><div><b>Ha solo smesso di lavorare?</b><small>Segnalo come cessato: sparisce dagli attivi ma resta tutto lo storico.</small></div><button type="button" class="btn sm" id="dp-cess">Segna cessato</button></div>` : ''}`, async fd => {
      const tutto = !!fd.get('tutto'), mine = r => String(r.dip) === String(d.id);
      const local = [{ action: 'delete', sheet: 'Dipendenti', id: d.id }, ...(tutto ? [...PRE().filter(mine).map(p => ({ action: 'delete', sheet: 'Presenze', id: p.id })), ...ASSE().filter(mine).map(a => ({ action: 'delete', sheet: 'Assenze', id: a.id }))] : [])];
      if (C.DEMO()) { db().staff = STAFF().filter(x => x !== u); S.det = ''; C.write(local); C.toast(`${nameOf(d)} eliminato`); return true; }
      if (!C.online()) { C.toast('Per eliminare un dipendente serve la connessione'); return; }
      try {
        C.busy('Elimino…'); const r = await C.api('dipDel', { id: d.id, tutto }); C.busy();
        if (r.staff) db().staff = r.staff; S.det = ''; S.creds = null; C.applyLocal(local);
        C.toast(`${nameOf(d)} eliminato${tutto && r.presenze + r.assenze ? ` con ${r.presenze} timbrature e ${r.assenze} assenze` : ''}`); return true;
      } catch (e) { C.busy(); C.toast(/sconosciuta/i.test(e.message) ? 'Aggiorna lo script Google alla versione cdc-5.3 per eliminare i dipendenti' : e.message); }
    }, null, 'Elimina');
    const ok = $('#sheet-ok'); if (ok) ok.classList.add('dp-danger');
    const c = $('#dp-cess'); if (c) c.onclick = () => { C.closeSheet(); C.write([{ action: 'upsert', sheet: 'Dipendenti', row: { ...d, stato: 'cessato', fine: d.fine || today() } }]); C.toast(`${nameOf(d)} segnato come cessato`); };
  }
  async function decide(id, stato) {
    const a = ASSE().find(x => String(x.id) === id); if (!a) return;
    const risp = stato === 'rifiutata' ? prompt('Motivo del rifiuto (facoltativo, lo vede il dipendente):', '') : '';
    if (risp === null) return;
    const row = { ...a, stato, risposta: risp || '', deciso: new Date().toISOString() };
    // v129: si aggiorna subito sullo schermo; il server salva e manda l'email in sottofondo
    if (C.online()) { C.applyLocal([{ action: 'upsert', sheet: 'Assenze', row }]); C.toast(stato === 'approvata' ? 'Richiesta approvata' : 'Richiesta rifiutata'); C.api('pzDecidi', { id, stato, risposta: risp || '' }).catch(e => { C.applyLocal([{ action: 'upsert', sheet: 'Assenze', row: a }]); C.toast('Non salvata: ' + e.message); }); }
    else { C.write([{ action: 'upsert', sheet: 'Assenze', row }]); C.toast(stato === 'approvata' ? 'Richiesta approvata' : 'Richiesta rifiutata'); }
  }
  function pzLink() {
    const u = pzUrl();
    C.openSheet('App Presenze', `<p class="muted small" style="margin:0 0 14px">I dipendenti la aprono dal telefono con le loro credenziali: timbrano entrata, pausa e uscita (con l'ora del server, non quella del telefono) e chiedono ferie, permessi o malattia. Dal telefono si può aggiungere alla schermata Home come un'app.</p>
      <div class="dp-pzl"><span>Link</span><b>${esc(u)}</b><button type="button" class="btn sm" data-dpc="${esc(u)}">${svg('copy')}Copia</button><a class="btn sm" href="${esc(u)}" target="_blank" rel="noopener">Apri</a></div>`, null, null, 'Chiudi');
    const ok = $('#sheet-ok'); ok.type = 'button'; ok.onclick = () => C.closeSheet();
    const c = $('#sheet-body [data-dpc]'); if (c) c.onclick = () => { (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(() => C.toast('Link copiato'), () => C.toast(u)); };
  }
  // ---- accessi (azioni sul server) ----
  function permFromUI() { const o = {}; root.querySelectorAll('.dp-p3').forEach(g => { const on = g.querySelector('.on'); o[g.dataset.perm] = on ? (on.dataset.pv || false) : false; }); return o; }
  async function accSave() {
    const d = dipOf(S.det); if (!d) return; const u = staffOf(d), kind = (root.querySelector('[name=dp-kind]:checked') || {}).value || 'pz';
    const ruolo = kind === 'resp' ? 'utente' : kind === 'ro' ? 'lettura' : 'dipendente', sezioni = kind === 'ges' ? permFromUI() : {};
    if (kind === 'ges' && !Object.values(sezioni).some(Boolean)) return C.toast('Scegli almeno una sezione che può vedere, oppure «Solo app Presenze»');
    if (kind === 'resp' && !confirm(`${nameOf(d)} potrà vedere e modificare tutto, anche costi, dipendenti e accessi. Continuare?`)) return;
    const login = u ? u.email : String((root.querySelector('#dp-login') || {}).value || '').trim();
    if (!login) return C.toast('Scrivi l\'email o il nome utente');
    if (C.DEMO()) { // demo: simula l'accesso sul dispositivo per far vedere come funziona
      const st = db().staff = (db().staff || []).filter(x => String(x.dip) !== String(d.id));
      st.push({ email: login.toLowerCase(), nome: nameOf(d), ruolo, sezioni, stato: 'attivo', dip: d.id, cambia: u ? u.cambia : '1', accessi: 0, ultimo: '' });
      if (!u) S.creds = { dip: d.id, login: login.toLowerCase(), pw: 'Esempio-' + Math.random().toString(36).slice(2, 7), inviata: false };
      render(root, C); return C.toast(u ? 'Demo: permessi salvati solo su questo dispositivo' : 'Demo: ecco come appaiono le credenziali (non sono reali)');
    }
    try {
      C.busy(u ? 'Salvo i permessi…' : 'Creo l\'accesso…');
      const r = await C.api('staffSave', { login, nome: nameOf(d), dip: d.id, ruolo, sezioni, stato: u ? u.stato : 'attivo', invia: !!(root.querySelector('#dp-inv') || {}).checked, telefono: d.tel || '' });
      C.busy(); db().staff = r.staff;
      if (r.nuovo) { S.creds = { dip: d.id, login: r.login, pw: r.pw, inviata: r.inviata }; if (!d.account) C.write([{ action: 'upsert', sheet: 'Dipendenti', row: { ...d, account: r.login } }]); else render(root, C); C.toast('Accesso creato'); }
      else { render(root, C); C.toast('Permessi salvati · valgono dal prossimo accesso'); }
    } catch (e) { C.busy(); C.toast(e.message); }
  }
  async function accPw() {
    if (C.DEMO()) return C.toast('Nella demo gli accessi non si modificano');
    const d = dipOf(S.det), u = d && staffOf(d); if (!u) return;
    if (!confirm(`Creare una nuova password provvisoria per ${nameOf(d)}? Quella attuale smette di funzionare.`)) return;
    try { C.busy('Creo la password…'); const r = await C.api('staffResetPw', { login: u.email, invia: /@/.test(u.email) }); C.busy(); db().staff = r.staff; S.creds = { dip: d.id, login: u.email, pw: r.pw, inviata: r.inviata }; render(root, C); } catch (e) { C.busy(); C.toast(e.message); }
  }
  async function accSus() {
    if (C.DEMO()) return C.toast('Nella demo gli accessi non si modificano');
    const d = dipOf(S.det), u = d && staffOf(d); if (!u) return;
    try { C.busy(); const r = await C.api('staffSave', { login: u.email, nome: u.nome, dip: d.id, ruolo: u.ruolo, sezioni: u.sezioni, stato: u.stato === 'attivo' ? 'bloccato' : 'attivo' }); C.busy(); db().staff = r.staff; render(root, C); C.toast(u.stato === 'attivo' ? 'Accesso sospeso' : 'Accesso riattivato'); } catch (e) { C.busy(); C.toast(e.message); }
  }
  async function accDel() {
    if (C.DEMO()) return C.toast('Nella demo gli accessi non si modificano');
    const d = dipOf(S.det), u = d && staffOf(d); if (!u) return;
    if (!confirm(`Togliere l'accesso a ${nameOf(d)}? Non potrà più entrare né timbrare. La scheda e le presenze restano.`)) return;
    try { C.busy(); const r = await C.api('staffDel', { login: u.email }); C.busy(); db().staff = r.staff; C.write([{ action: 'upsert', sheet: 'Dipendenti', row: { ...d, account: '' } }]); C.toast('Accesso tolto'); } catch (e) { C.busy(); C.toast(e.message); }
  }

  window.CDC_DIP = { render, hours: (id, day) => work(id, day).min, nameOf };
})();
