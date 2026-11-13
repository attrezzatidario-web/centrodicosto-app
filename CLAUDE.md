# Centro di Costo — indice per Claude (leggere PRIMA di aprire file)

Regola d'oro: NON leggere app.js intero (9.500 righe). Usa `grep -n` sul nome qui sotto e leggi solo 40–80 righe attorno.

## File
| File | Cosa |
|---|---|
| app.js | tutto il gestionale (una IIFE). Sezioni sotto |
| dipendenti.js | sezione Dipendenti (caricata con loadLib) |
| cantieri.js, cantieri-cad.js | Preventivi lavori (loadLib da renderCn) e piantina 2D del sopralluogo (editor SVG a tutto schermo, dati in p.piante) |
| analisi.js | sezione Analisi |
| settori.js | settori di attività e moduli (MOD) |
| demo.js | dati della versione demo (addStaff ecc.) |
| tour.js | presentazione iniziale (LOGOS fornitori) |
| presenze/presenze.js | app timbrature dipendenti |
| console/console.js, console/mappa.js | console amministratore + mappa del gestionale |
| cat-*.json / cat-*-det.json | cataloghi fornitori (enormi: MAI leggerli, usare python per contarli) |
| sw.js | service worker (CACHE = versione) |
| Code.gs | NON è nel repo: è sul Google Apps Script di Dario (versione live cdc-5.4) |

## Sezioni di app.js (cerca il titolo con grep)
Storage · Utils · Config · Sync (pull/applyOps) · settore e moduli · State · Router · HOME (renderHome) · MOVIMENTI (renderMov) · CENTRI/dashboard (renderDash) · ARTICOLI · IMPOSTAZIONI (renderSettings, PERM_SEC) · Sheet (openSheet) · GLS (renderGls) · GASOLIO (renderGas) · DASHBOARD GENERALE (renderOverview) · PIAZZALI (renderPz) · PREVENTIVI (PV_SUP, renderPv) · FATTURE FORNITORI (renderFat) · TORENTAL (renderTor) · LYRECO (renderLy) · AMAZON (renderAm) · CLIENTI/MAGAZZINO/DDT (renderCli, renderMag, renderVen) · DOCUMENTI INTERNI (renderInt, xiForm, xiOpen, xiReceive, xiPdf: scarichi non fiscali e trasferimenti, salvati in Config «xi:<id>», movimenti MagMov con doc = id; modulo «interni» richiede «magazzino») · SERVIZI (renderSrvSet) · INCASSI (renderInc) · FORNITORI (renderForn) · Eventi · Splash

## Aggiungere un fornitore al catalogo Preventivi (checklist)
1. cat-X.json (+ cat-X-det.json) — formato come cat-lavor.json (tool:true, noList:true, imgPre, groups, items)
2. logo-X.svg
3. app.js: PV_SUP + placeholder ricerca (`cat.f === 'X'`)
4. index.html: bottone `data-pvsup="X"` + host foto in CSP (img-src e connect-src)
5. tour.js LOGOS · console/mappa.js gruppo 'for' (+ bump mappa.js?v)
6. Code.gs IMG_HOSTS (foto nei PDF) → lo modifica Dario

## Rilascio (sempre)
- `git pull --rebase` prima (altre chat pubblicano)
- bump versione: `?v=N` in index.html, `centro-costo-vN` in sw.js (+ loadLib('…?v=N') se cambia quel file)
- test Playwright nella cartella di lavoro (gasmock), poi commit + `git push origin main`

## Regole di Dario
- Risposte in italiano, brevi; causa del problema prima della soluzione
- Mai password in chat; chiavi API solo nelle proprietà dello script
- Mai prezzi d'acquisto nel repo pubblico
- Non deve risultare da nessuna parte dove lavora (la parola "attrezzati" va bene)
- Code.gs: consegnarlo solo se cambia; Code.gs non deve contenere codice degli agenti

## Pubblicazione (GitHub Pages)
- NON togliere il file `.nojekyll`: senza, Jekyll elabora ~190 MB e la pubblicazione va in timeout (10/11/2026). Con `.nojekyll` impiega ~2 minuti.
- Se tornasse lenta: spostare cat-*, dw-/st-/us-*, img/ in un repo dati separato (repo vuoto già creato: attrezzatidario-web/centrodicosto-dati).
