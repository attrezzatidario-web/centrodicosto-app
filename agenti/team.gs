/**
 * Centro di Costo — TEAM (script separato, NON fa parte di Code.gs)
 * Legge i report degli agenti dalla cartella Drive «Centro di Costo - Team» e li dà alla Console (sezione Team).
 * Nessuna chat che modifica Code.gs deve toccare questo script.
 * Accesso: controlla il token chiedendo allo script principale chi è l'utente (azione «me»): solo l'amministratore.
 */
const TEAM_V = 'team-2';
const MAIN_URL = 'https://script.google.com/macros/s/AKfycbxExGwxVNa08xHz1zp2BmoGkvT1LX7jj-yfdbzbWckqOBsMxPsISmDdKgDmx4uqwRiW/exec';
const ADMIN = 'attrezzatidario@gmail.com';
const FOLDER = 'Centro di Costo - Team', MAX = 150;

function doGet() { return out({ ok: true, v: TEAM_V }); }

function doPost(e) {
  try {
    const b = JSON.parse((e.postData && e.postData.contents) || '{}');
    const me = whoIs(b.token);
    if (!me) return out({ ok: false, auth: true, error: 'Sessione scaduta: entra di nuovo nella Console' });
    if (!me.admin || String(me.email).toLowerCase() !== ADMIN) return out({ ok: false, error: 'Solo l\'amministratore può vedere il Team' });
    if (b.action === 'report') return out({ ok: true, v: TEAM_V, result: report() });
    if (b.action === 'chat') return out({ ok: true, v: TEAM_V, result: chat(b) });
    return out({ ok: false, error: 'Azione sconosciuta' });
  } catch (err) { return out({ ok: false, error: String(err.message || err) }); }
}

// chiede allo script principale chi è il proprietario del token (risultato tenuto 10 minuti)
function whoIs(tok) {
  if (!tok) return null;
  const c = CacheService.getScriptCache(), k = 'me_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(tok)));
  const hit = c.get(k); if (hit) return JSON.parse(hit);
  const r = UrlFetchApp.fetch(MAIN_URL, { method: 'post', contentType: 'text/plain;charset=utf-8', payload: JSON.stringify({ action: 'me', token: tok }), muteHttpExceptions: true, followRedirects: true });
  let j = null; try { j = JSON.parse(r.getContentText()); } catch (e) { throw new Error('Lo script principale non risponde'); }
  if (!j.ok) return null;
  c.put(k, JSON.stringify(j.result), 600);
  return j.result;
}

function report() {
  const it = DriveApp.getFoldersByName(FOLDER);
  if (!it.hasNext()) return { report: [] };
  const files = [], fi = it.next().getFiles();
  while (fi.hasNext()) { const f = fi.next(); if (/\.json$/i.test(f.getName())) files.push(f); }
  files.sort((a, b) => b.getDateCreated() - a.getDateCreated());
  const out = [];
  files.slice(0, MAX).forEach(f => { try { const j = JSON.parse(f.getBlob().getDataAsString('UTF-8')); if (j && j.agente) out.push(j); } catch (e) {} });
  return { report: out };
}

/* ---------- chat con gli agenti (Console › Team) ----------
 * Serve la chiave Anthropic nelle Proprietà dello script: nome ANTHROPIC_KEY (Impostazioni progetto › Proprietà dello script).
 * L'agente risponde solo in base ai suoi ultimi report e non può eseguire nulla. Limite: 60 messaggi al giorno. */
const CHAT_MODEL = 'claude-sonnet-5-5', CHAT_MAX_DAY = 60;
const AGENTI = {
  guardiano: 'controlli ogni mattina app, demo, Console, Presenze, sito online, backup e Foglio',
  informatico: 'ogni lunedì rivedi il codice della settimana: sicurezza, errori probabili, velocità, ordine',
  commerciale: 'ogni martedì cerchi aziende adatte al gestionale e prepari le bozze delle email (non invii mai nulla)',
  marketing: 'ogni mercoledì prepari idee per post e testi e confronti la concorrenza',
  grafico: 'ogni giovedì controlli l\'aspetto del gestionale e della Console e suggerisci miglioramenti'
};
function chat(b) {
  const ag = String(b.agente || ''), desc = AGENTI[ag];
  if (!desc) throw new Error('Agente sconosciuto');
  const key = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_KEY');
  if (!key) throw new Error('Manca la chiave: nelle Proprietà dello script aggiungi ANTHROPIC_KEY');
  const day = 'chat_' + Utilities.formatDate(new Date(), 'Europe/Rome', 'yyyyMMdd'), props = PropertiesService.getScriptProperties();
  const n = Number(props.getProperty(day) || 0); if (n >= CHAT_MAX_DAY) throw new Error('Limite di ' + CHAT_MAX_DAY + ' messaggi al giorno raggiunto: riprova domani');
  const msgs = (Array.isArray(b.messaggi) ? b.messaggi : []).slice(-10).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 1500) })).filter(m => m.content);
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();
  if (!msgs.length) throw new Error('Scrivi un messaggio');
  const mine = report().report.filter(r => r.agente === ag).sort((a, c) => String(c.data).localeCompare(String(a.data)));
  const last = mine[0] ? JSON.stringify(mine[0]).slice(0, 6000) : 'nessun report ancora (l\'agente non è mai partito)';
  const storia = mine.slice(0, 6).map(r => r.data + ' · ' + r.stato + ' · ' + (r.titolo || '')).join('\n') || '—';
  const system = 'Sei l\'agente ' + ag.toUpperCase() + ' del gestionale «Centro di Costo» di Dario (Soluzione Veicolare / Attrezzati). Il tuo lavoro: ' + desc + '.\n' +
    'Parli con Dario, che non è un programmatore. Rispondi SEMPRE in italiano semplice, breve (massimo 5 righe), senza elenchi lunghi.\n' +
    'Rispondi solo in base ai tuoi report qui sotto: se un dato non c\'è, dillo, non inventare. Non puoi modificare nulla né far partire altri agenti. ' +
    'Se Dario chiede di correggere o fare qualcosa, spiega cosa servirebbe e digli di scrivere a Claude nella chat del progetto: «sistema i punti del report del ' + ag + '».\n\n' +
    'ULTIMO REPORT:\n' + last + '\n\nULTIMI CONTROLLI:\n' + storia;
  const r = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', { method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' }, payload: JSON.stringify({ model: CHAT_MODEL, max_tokens: 600, system: system, messages: msgs }) });
  let j = null; try { j = JSON.parse(r.getContentText()); } catch (e) {}
  if (r.getResponseCode() !== 200 || !j || !j.content) throw new Error('L\'agente non risponde (' + r.getResponseCode() + ')' + (j && j.error && j.error.message ? ': ' + String(j.error.message).slice(0, 120) : ''));
  props.setProperty(day, String(n + 1));
  return { testo: j.content.map(c => c.text || '').join('').trim() };
}

function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

// da eseguire una volta dall'editor per dare i permessi (Drive e connessione allo script principale)
function autorizza() { report(); UrlFetchApp.fetch(MAIN_URL, { muteHttpExceptions: true }); PropertiesService.getScriptProperties(); Logger.log('Permessi OK'); }
