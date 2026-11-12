// Guardiano · controllo automatico del Centro di Costo (sito pubblicato)
// Uso: node agenti/guardiano.mjs [cartella-del-sito] > report.json
// Prova il codice del ramo main (lo stesso pubblicato su GitHub Pages) servito in locale:
// pagine, versioni coerenti, demo completa senza errori, Console e Presenze.
// Non usa dati reali né credenziali: la demo gira solo nel browser.
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.xlsx': 'application/octet-stream' };
const srv = http.createServer((q, r) => {
  let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(ROOT)) { r.writeHead(403); return r.end(); }
  if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
});
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const BASE = `http://127.0.0.1:${srv.address().port}/`;
const VOCI = [];
const ARGS = process.argv.slice(2);
const add = (stato, testo, dettaglio = '') => VOCI.push({ stato, testo, dettaglio });
const t0 = Date.now();

async function fetchT(u) {
  const s = Date.now();
  try { const r = await fetch(u, { cache: 'no-store' }); const txt = await r.text(); return { ok: r.ok, code: r.status, ms: Date.now() - s, txt }; }
  catch (e) { return { ok: false, code: 0, ms: Date.now() - s, txt: '', err: e.message }; }
}

// 1. pagine online
// 1. file principali presenti e leggibili
const PAGINE = [['Gestionale', ''], ['Console', 'console/'], ['Presenze', 'presenze/'], ['Preventivi', 'preventivi/']];
let home = '';
for (const [n, p] of PAGINE) {
  const r = await fetchT(BASE + p);
  if (!p) home = r.txt;
  if (!r.ok) add('bad', `${n}: pagina mancante`, `Risposta ${r.code || 'assente'}`);
}
// file citati da index.html che non esistono
const rif = [...home.matchAll(/(?:src|href)="([^"#:]+?)(?:\?[^"]*)?"/g)].map(m => m[1]).filter(u => !u.startsWith('//'));
const mancanti = [...new Set(rif)].filter(u => !fs.existsSync(path.join(ROOT, u)));
if (mancanti.length) add('bad', 'File mancanti nel sito', mancanti.join(', '));

// 2. versioni coerenti (index.html e sw.js)
const sw = await fetchT(BASE + 'sw.js');
const vIdx = (home.match(/app\.js\?v=(\d+)/) || [])[1], vSw = (sw.txt.match(/centro-costo-v(\d+)/) || [])[1];
if (vIdx && vSw && vIdx !== vSw) add('warn', 'Versioni non allineate', `index v${vIdx} · cache v${vSw}: chi ha l'app installata potrebbe vedere la versione vecchia`);
else if (vIdx) add('ok', `Versione pubblicata v${vIdx}`, '');

// 3. prova nel browser
const browser = await chromium.launch();
async function prova(nome, fn) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 860 } });
  const p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !/favicon|fonts\.g|script\.google|ERR_|Failed to load resource/i.test(m.text())) errs.push(m.text()); });
  try { await fn(p, errs); }
  catch (e) { add('bad', `${nome}: la prova si è bloccata`, e.message.split('\n')[0].slice(0, 200)); }
  await ctx.close();
}

await prova('Demo', async (p, errs) => {
  const s = Date.now();
  await p.goto(BASE, { waitUntil: 'load', timeout: 45000 });
  await p.waitForTimeout(3000); // lascia partire la presentazione iniziale
  // il pulsante vero è [data-demo]: lo clicchiamo subito (aspettare un pulsante nascosto falsava il tempo di apertura di ~10 s)
  await p.waitForSelector('[data-demo]', { state: 'attached', timeout: 10000 });
  const s1 = Date.now();
  await p.evaluate(() => document.querySelector('[data-demo]').click());
  await p.waitForFunction(() => { const v = document.querySelector('#v-home'); return v && !v.hidden && v.offsetHeight > 0; }, null, { timeout: 30000 });
  const apri = Date.now() - s1;
  const viste = await p.$$eval('section.view[data-v]', a => a.map(x => x.dataset.v));
  const visibili = await p.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].filter(a => a.offsetParent && getComputedStyle(a).visibility !== 'hidden').map(a => a.getAttribute('href').slice(1)).filter(Boolean));
  const da = viste.filter(v => visibili.includes(v));
  const lente = [], rotte = [];
  for (const v of da) {
    const n0 = errs.length, s2 = Date.now();
    await p.evaluate(v => { location.hash = '#' + v; }, v);
    const ok = await p.waitForFunction(v => { const el = document.querySelector(`section.view[data-v="${v}"]`); return el && !el.hidden && el.offsetHeight > 0; }, v, { timeout: 15000 }).then(() => true, () => false);
    await p.waitForTimeout(500);
    const ms = Date.now() - s2;
    if (!ok) rotte.push(v); else if (ms > 4000) lente.push(`${v} ${(ms / 1000).toFixed(1)} s`);
    if (errs.length > n0) rotte.push(`${v} (errore: ${errs[errs.length - 1].slice(0, 120)})`);
  }
  if (apri > 8000) add('warn', 'La demo si apre lentamente', `${(apri / 1000).toFixed(1)} s`);
  else add('ok', 'La demo si apre', `${(apri / 1000).toFixed(1)} s`);
  if (rotte.length) add('bad', `Sezioni con problemi: ${rotte.length}`, rotte.join(' · '));
  else add('ok', `Tutte le sezioni della demo funzionano (${da.length})`, da.join(', '));
  if (lente.length) add('warn', 'Sezioni lente', lente.join(' · '));
});

await prova('Console', async (p, errs) => {
  await p.goto(BASE + 'console/', { waitUntil: 'load', timeout: 45000 });
  await p.waitForSelector('#gate:not([hidden])', { timeout: 20000 });
  await p.waitForTimeout(800);
  if (errs.length) add('bad', 'Console: errori nella pagina di accesso', errs.slice(0, 3).join(' · '));
  else add('ok', 'Console: pagina di accesso a posto', '');
});

await prova('Presenze', async (p, errs) => {
  await p.goto(BASE + 'presenze/', { waitUntil: 'load', timeout: 45000 });
  await p.waitForTimeout(2500);
  if (errs.length) add('bad', 'Presenze: errori nella pagina', errs.slice(0, 3).join(' · '));
  else add('ok', 'App Presenze a posto', '');
});

await browser.close();
srv.close();

const peggio = VOCI.some(v => v.stato === 'bad') ? 'bad' : VOCI.some(v => v.stato === 'warn') ? 'warn' : 'ok';
const nb = VOCI.filter(v => v.stato !== 'ok').length;
console.log(JSON.stringify({
  agente: 'guardiano', data: new Date().toISOString(), stato: peggio,
  titolo: peggio === 'ok' ? 'Tutto funziona' : `${nb} ${nb === 1 ? 'cosa' : 'cose'} da controllare`,
  voci: VOCI, durata: Math.round((Date.now() - t0) / 1000)
}, null, 1));
