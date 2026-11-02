/* Centro di Costo — controllo della velocità con il «test estremo» (~57.000 righe, console/stress.js).
   Uso: node strumenti/perf.test.js        (dalla cartella del repository; serve Playwright)
   Misura: apertura con la copia sul dispositivo (PC e telefono simulato, CPU ×4) e apertura di ogni sezione.
   Esce con errore se una misura supera il suo limite (BUDGET): da lanciare prima di ogni pubblicazione. */
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const BUDGET = { boot1: 1500, boot4: 3500, first4: 1500, sez: 400, home: 700 };
global.window = {}; require(ROOT + '/console/stress.js'); const G = window.CDC_STRESS.gen();
const mod = {}; ['piazzali', 'gls', 'gasolio', 'lyreco', 'amazon', 'incassi', 'clienti', 'fornitori', 'magazzino', 'vendite'].forEach(k => mod[k] = true);
const L = s => G.sheets[s];
const user = { email: 'a@b.it', nome: 'Dario', admin: true, ruolo: 'admin', ws: 'TESTES26', wsNome: 'TEST ESTREMO', wsSettore: 'veicoli', wsPiano: 'pro', principale: false };
const all = { movimenti: L('Movimenti'), config: { ...G.config, moduli: mod }, gls: L('GLS'), gasolio: L('Gasolio'), fatture: L('Fatture'), lyreco: L('Lyreco'), lyfatture: L('LyrecoFatture'), amazon: L('Amazon'), amazonart: L('AmazonArticoli'), clienti: L('Clienti'), articoli: L('Articoli'), magmov: L('MagMov'), ddt: L('DDT'), vendite: L('Vendite'), incassi: L('Incassi'), fornitori: L('Fornitori'), docforn: [], pdf: [], ai: false, user, t: Date.now() };
const ALL = JSON.stringify({ ok: true, v: 'cdc-5.4', data: all });
const NOCHG = () => JSON.stringify({ ok: true, v: 'cdc-5.4', data: { delta: true, full: [], del: {}, pdf: [], ai: false, user, t: Date.now() } });
const MIME = { js: 'text/javascript', css: 'text/css', html: 'text/html', json: 'application/json', svg: 'image/svg+xml' };
const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': MIME[f.split('.').pop()] || 'application/octet-stream' }); r.end(d); }); }).listen(8160);
let bad = 0; const chk = (what, ms, max) => { const ok = ms <= max; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'LENTO'} ${what.padEnd(34)} ${String(ms).padStart(5)} ms  (limite ${max})`); };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  let first = true;
  await p.route('https://script.google.com/**', rt => { const a = JSON.parse(rt.request().postData()); const body = a.action !== 'all' ? JSON.stringify({ ok: true, result: {} }) : first ? (first = false, ALL) : NOCHG(); rt.fulfill({ contentType: 'application/json', body }); });
  await p.addInitScript(u => { localStorage.setItem('cdc_tok', JSON.stringify('T')); localStorage.setItem('cdc_me', JSON.stringify(u)); }, user);
  await p.goto('http://localhost:8160/#home');
  await p.waitForFunction(() => /Sincronizzato/.test((document.querySelector('#sync-side') || {}).textContent || ''), null, { timeout: 120000 });
  await p.waitForTimeout(5000); // la Dashboard «ferma» si salva 3,5 s dopo
  const cdp = await ctx.newCDPSession(p);
  const homeReady = () => p.waitForFunction(() => { const h = document.querySelector('#v-home'); return h && !h.hidden && h.innerText.length > 800; }, null, { timeout: 60000, polling: 30 });
  for (const thr of [1, 4]) {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: thr });
    await p.reload({ waitUntil: 'commit' }); const t0 = Date.now();
    await p.waitForFunction(() => { const h = document.querySelector('#v-snap') || document.querySelector('#v-home'); return h && !h.hidden && h.innerText.length > 800; }, null, { timeout: 60000, polling: 20 });
    if (thr === 4) chk('prima immagine della Dashboard CPU ×4', Date.now() - t0, BUDGET.first4);
    await homeReady();
    chk(`apertura (copia sul dispositivo) CPU ×${thr}`, Date.now() - t0, thr === 1 ? BUDGET.boot1 : BUDGET.boot4);
    await p.waitForTimeout(1500);
  }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  for (const v of ['attrezzatura', 'piazzali', 'gls', 'gasolio', 'fatture', 'lyreco', 'amazon', 'incassi', 'clienti', 'fornitori', 'magazzino', 'vendite', 'preventivi', 'impostazioni', 'home']) {
    await p.evaluate(v => { location.hash = v === 'impostazioni' ? '#incassi' : '#impostazioni'; }, v); await p.waitForTimeout(400);
    const ms = await p.evaluate(v => new Promise(res => { const t = performance.now(); addEventListener('hashchange', () => requestAnimationFrame(() => setTimeout(() => res(Math.round(performance.now() - t)), 0)), { once: true }); location.hash = '#' + v; }), v);
    chk('sezione ' + v, ms, v === 'home' ? BUDGET.home : BUDGET.sez);
  }
  console.log(errs.length ? 'ERRORI ' + errs.join(' | ') : 'nessun errore'); if (errs.length) bad++;
  await b.close(); srv.close(); process.exit(bad ? 1 : 0);
})();
