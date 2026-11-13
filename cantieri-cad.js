/* Centro di Costo — Piantina 2D professionale del sopralluogo (v265)
   window.CDC_CAD: open(plan, opts) · thumb(plan) · png(plan, w, o) · sheet(plan, o) · dxf(plan) · stats(plan) · detect(plan, x, y)
   Una piantina = JSON compatto dentro la pratica (p.piante[]). Unità: centimetri, asse y verso il basso.
   w pareti {i,x,y,X,Y,t,m,s,h} · o aperture {i,k,w,p,l,h,sl,f,s} · s simboli {i,k,x,y,a,w,h,s,n} · q quote {i,x,y,X,Y,d,tx}
   t testi {i,x,y,s,z} · r locali {i,n,p:[[x,y]..],fl,h} · ly {h:{layer:1},l:{layer:1}} · mode gr|sf|pr
   s = stato: 0 esistente · 1 da demolire · 2 nuovo (convenzione «gialli e rossi») */
(() => {
  'use strict';
  const uid = () => Math.random().toString(36).slice(2, 8);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const m2 = cm => (cm / 100).toFixed(2).replace('.', ',');
  const mq = v => (v / 10000).toFixed(2).replace('.', ',');
  const num = s => { const v = parseFloat(String(s == null ? '' : s).replace(',', '.')); return isFinite(v) ? v : 0; };
  const dist = (a, b, c, d) => Math.hypot(c - a, d - b);
  const f1 = v => Math.round(v * 10) / 10;
  const INK = '#1d2433', BLUE = '#1f6fd1', ORG = '#c2410c', ACC = '#2563eb', NEWC = '#f4b73f', DEMC = '#e5484d', GRN = '#15803d';
  const TINT = ['#e8f0ff', '#e9f7ef', '#fff4e0', '#f3ebff', '#e6f6f8', '#fdecee'];
  const X1 = '<path d="M-50-50 50 50M50-50-50 50" opacity=".3"/>';
  const SYM = {
    wc: { n: 'WC', g: 'Bagno', w: 40, h: 70, d: '<rect x="-38" y="-50" width="76" height="28" rx="5"/><path d="M-34-16h68c0 42-15 66-34 66S-34 26-34-16z"/>' },
    lav: { n: 'Lavabo', g: 'Bagno', w: 60, h: 45, d: '<rect x="-50" y="-50" width="100" height="100" rx="9"/><ellipse cx="0" cy="6" rx="34" ry="30"/><circle cx="0" cy="-34" r="4"/>' },
    bid: { n: 'Bidet', g: 'Bagno', w: 38, h: 55, d: '<rect x="-40" y="-50" width="80" height="22" rx="4"/><ellipse cx="0" cy="14" rx="36" ry="38"/>' },
    doc: { n: 'Doccia', g: 'Bagno', w: 80, h: 80, d: '<rect x="-50" y="-50" width="100" height="100"/>' + X1 + '<circle r="9"/>' },
    vas: { n: 'Vasca', g: 'Bagno', w: 170, h: 70, d: '<rect x="-50" y="-50" width="100" height="100" rx="10"/><rect x="-43" y="-40" width="86" height="80" rx="24"/><circle cx="-36" cy="0" r="4"/>' },
    lvt: { n: 'Lavatrice', g: 'Bagno', w: 60, h: 60, d: '<rect x="-50" y="-50" width="100" height="100" rx="4"/><circle cx="0" cy="8" r="30"/><circle cx="0" cy="8" r="18"/><path d="M-40-38h20"/>' },
    cot: { n: 'Piano cottura', g: 'Cucina', w: 60, h: 55, d: '<rect x="-50" y="-50" width="100" height="100" rx="5"/><circle cx="-24" cy="-24" r="16"/><circle cx="24" cy="-24" r="12"/><circle cx="-24" cy="24" r="12"/><circle cx="24" cy="24" r="16"/>' },
    lvl: { n: 'Lavello', g: 'Cucina', w: 120, h: 55, d: '<rect x="-50" y="-50" width="100" height="100"/><rect x="-44" y="-38" width="40" height="76" rx="6"/><rect x="2" y="-38" width="26" height="76" rx="6"/><path d="M34-38h10v76H34z"/>' },
    fri: { n: 'Frigorifero', g: 'Cucina', w: 60, h: 65, d: '<rect x="-50" y="-50" width="100" height="100" rx="4"/><path d="M-50-14h100M-34-34v10M-34-4v14"/>' },
    lvs: { n: 'Lavastoviglie', g: 'Cucina', w: 60, h: 60, d: '<rect x="-50" y="-50" width="100" height="100" rx="4"/><path d="M-50-30h100"/><circle cx="0" cy="14" r="22"/>' },
    mob: { n: 'Mobile / base', g: 'Cucina', w: 60, h: 60, d: '<rect x="-50" y="-50" width="100" height="100"/><path d="M0-50v100"/>' },
    let: { n: 'Letto matrimoniale', g: 'Arredo', w: 170, h: 200, d: '<rect x="-50" y="-50" width="100" height="100" rx="4"/><rect x="-43" y="-45" width="40" height="20" rx="7"/><rect x="3" y="-45" width="40" height="20" rx="7"/><path d="M-50-8h100"/>' },
    ls: { n: 'Letto singolo', g: 'Arredo', w: 90, h: 200, d: '<rect x="-50" y="-50" width="100" height="100" rx="4"/><rect x="-36" y="-45" width="72" height="20" rx="7"/><path d="M-50-8h100"/>' },
    div: { n: 'Divano', g: 'Arredo', w: 200, h: 90, d: '<rect x="-50" y="-50" width="100" height="100" rx="9"/><rect x="-50" y="-50" width="100" height="28" rx="9"/><path d="M-32-22v72M32-22v72"/>' },
    tav: { n: 'Tavolo', g: 'Arredo', w: 160, h: 90, d: '<rect x="-50" y="-50" width="100" height="100" rx="6"/><rect x="-44" y="-44" width="88" height="88" rx="4" opacity=".35"/>' },
    sed: { n: 'Sedia', g: 'Arredo', w: 45, h: 45, d: '<rect x="-50" y="-50" width="100" height="100" rx="12"/><path d="M-40-34h80"/>' },
    arm: { n: 'Armadio', g: 'Arredo', w: 120, h: 60, d: '<rect x="-50" y="-50" width="100" height="100"/><path d="M0-50v100"/>' + X1 },
    scr: { n: 'Scrivania', g: 'Arredo', w: 140, h: 70, d: '<rect x="-50" y="-50" width="100" height="100" rx="3"/><rect x="18" y="-50" width="32" height="100" opacity=".4"/>' },
    lue: { n: 'Punto luce', g: 'Elettrico', c: ORG, w: 28, h: 28, d: '<circle r="46"/><path d="M-32-32 32 32M32-32-32 32"/>' },
    app: { n: 'Applique', g: 'Elettrico', c: ORG, w: 28, h: 28, d: '<path d="M-46 30a46 46 0 0 1 92 0z"/><path d="M0-14v-30"/>' },
    int: { n: 'Interruttore', g: 'Elettrico', c: ORG, w: 24, h: 24, d: '<circle r="40"/><circle r="9" fill="' + ORG + '"/><path d="M6-6 36-36"/>' },
    pre: { n: 'Presa', g: 'Elettrico', c: ORG, w: 24, h: 24, d: '<circle r="46"/><path d="M-20-24v48M20-24v48"/>' },
    dat: { n: 'Dati / TV', g: 'Elettrico', c: ORG, w: 26, h: 26, d: '<rect x="-46" y="-46" width="92" height="92" rx="8"/><circle r="22"/>' },
    qua: { n: 'Quadro elettrico', g: 'Elettrico', c: ORG, w: 50, h: 20, d: '<rect x="-50" y="-50" width="100" height="100"/><path d="M-30-20h60M-30 0h60M-30 20h60"/>' },
    cit: { n: 'Citofono', g: 'Elettrico', c: ORG, w: 18, h: 24, d: '<rect x="-40" y="-50" width="80" height="100" rx="8"/><circle r="16"/>' },
    acq: { n: 'Punto acqua', g: 'Idraulico', c: BLUE, w: 26, h: 26, d: '<circle r="46"/><path d="M0-30C18-6 26 6 26 16a26 26 0 0 1-52 0C-26 6-18-6 0-30z"/>' },
    sca: { n: 'Scarico', g: 'Idraulico', c: BLUE, w: 26, h: 26, d: '<circle r="46"/><path d="M-26-26 26 26M26-26-26 26"/>' },
    cal: { n: 'Caldaia', g: 'Idraulico', c: BLUE, w: 60, h: 40, d: '<rect x="-50" y="-50" width="100" height="100" rx="6"/><circle r="26"/><path d="M0-26v26l18 10"/>' },
    rad: { n: 'Radiatore', g: 'Idraulico', c: BLUE, w: 100, h: 12, d: '<rect x="-50" y="-50" width="100" height="100"/><path d="M-30-50v100M-10-50v100M10-50v100M30-50v100"/>' },
    cli: { n: 'Climatizzatore', g: 'Idraulico', c: BLUE, w: 90, h: 25, d: '<rect x="-50" y="-50" width="100" height="100" rx="8"/><path d="M-36 12q8-14 18 0t18 0t18 0t18 0"/>' }
  };
  Object.assign(SYM, {
    pol: { n: 'Poltrona', g: 'Arredo', w: 80, h: 80, d: '<rect x="-50" y="-50" width="100" height="100" rx="14"/><rect x="-50" y="-50" width="100" height="30" rx="10"/><rect x="-50" y="-20" width="18" height="70" rx="6"/><rect x="32" y="-20" width="18" height="70" rx="6"/>' },
    mat: { n: 'Letto 1 piazza e mezza', g: 'Arredo', w: 130, h: 200, d: '<rect x="-50" y="-50" width="100" height="100" rx="4"/><rect x="-38" y="-45" width="76" height="20" rx="7"/><path d="M-50-8h100"/>' },
    com: { n: 'Comodino', g: 'Arredo', w: 40, h: 40, d: '<rect x="-50" y="-50" width="100" height="100" rx="4"/><circle r="22"/>' },
    cas: { n: 'Cassettiera', g: 'Arredo', w: 100, h: 45, d: '<rect x="-50" y="-50" width="100" height="100"/><path d="M-50 0h100"/>' },
    lib: { n: 'Libreria', g: 'Arredo', w: 100, h: 30, d: '<rect x="-50" y="-50" width="100" height="100"/><path d="M-17-50v100M17-50v100"/>' },
    tvm: { n: 'Mobile TV', g: 'Arredo', w: 150, h: 45, d: '<rect x="-50" y="-50" width="100" height="100"/><rect x="-30" y="-20" width="60" height="40" rx="3"/>' },
    tot: { n: 'Tavolo tondo', g: 'Arredo', w: 100, h: 100, d: '<circle r="50"/><circle r="38" opacity=".35"/>' },
    cuc: { n: 'Cucina a isola', g: 'Cucina', w: 180, h: 90, d: '<rect x="-50" y="-50" width="100" height="100" rx="3"/><rect x="-44" y="-44" width="40" height="52"/><circle cx="26" cy="-14" r="12"/><circle cx="26" cy="22" r="12"/>' },
    cam: { n: 'Camino / stufa', g: 'Arredo', w: 80, h: 45, d: '<rect x="-50" y="-50" width="100" height="100"/><path d="M-50-50 50 50M50-50-50 50"/>' },
    dsc: { n: 'Doccia con piatto', g: 'Bagno', w: 120, h: 80, d: '<rect x="-50" y="-50" width="100" height="100"/>' + X1 + '<circle cx="30" r="9"/>' },
    dan: { n: 'Doccia angolare', g: 'Bagno', w: 90, h: 90, d: '<path d="M-50-50H50A100 100 0 0 1-50 50z"/><circle cx="-24" cy="-24" r="7"/>' },
    blr: { n: 'Boiler', g: 'Bagno', w: 50, h: 50, d: '<circle r="50"/><circle r="32" opacity=".35"/>' },
    plf: { n: 'Plafoniera', g: 'Elettrico', c: ORG, w: 34, h: 34, d: '<circle r="48"/><circle r="26"/>' },
    far: { n: 'Faretto', g: 'Elettrico', c: ORG, w: 18, h: 18, d: '<circle r="46"/><circle r="12" fill="' + ORG + '"/>' },
    dev: { n: 'Deviatore', g: 'Elettrico', c: ORG, w: 24, h: 24, d: '<circle r="40"/><circle r="9" fill="' + ORG + '"/><path d="M6-6 36-36M-6 6-36 36"/>' },
    pul: { n: 'Pulsante', g: 'Elettrico', c: ORG, w: 22, h: 22, d: '<circle r="44"/><circle r="16" fill="' + ORG + '"/>' },
    ter: { n: 'Termostato', g: 'Elettrico', c: ORG, w: 22, h: 22, d: '<rect x="-46" y="-46" width="92" height="92" rx="12"/><path d="M-22 20q16-40 44 0"/>' },
    vid: { n: 'Videocitofono', g: 'Elettrico', c: ORG, w: 22, h: 26, d: '<rect x="-44" y="-50" width="88" height="100" rx="6"/><rect x="-26" y="-34" width="52" height="38"/>' },
    cnt: { n: 'Contatore', g: 'Elettrico', c: ORG, w: 30, h: 30, d: '<rect x="-48" y="-48" width="96" height="96" rx="4"/><circle r="26"/><path d="M0-26v26l14 8"/>' },
    fum: { n: 'Rilevatore fumo', g: 'Sicurezza', c: GRN, w: 22, h: 22, d: '<circle r="46"/><path d="M-26 0h52M0-26v52"/>' },
    ext: { n: 'Estintore', g: 'Sicurezza', c: DEMC, w: 24, h: 24, d: '<rect x="-46" y="-46" width="92" height="92"/><path d="M0-30 28 26H-28z" fill="' + DEMC + '"/>' },
    usc: { n: 'Uscita emergenza', g: 'Sicurezza', c: GRN, w: 40, h: 20, d: '<rect x="-50" y="-50" width="100" height="100" fill="' + GRN + '"/><path d="M-30 0H20M4-22 28 0 4 22" stroke="#fff"/>' },
    rub: { n: 'Rubinetto / attacco', g: 'Idraulico', c: BLUE, w: 20, h: 20, d: '<circle r="46"/><path d="M-26 0h52M0-26v26"/>' },
    pzz: { n: 'Pozzetto', g: 'Idraulico', c: BLUE, w: 40, h: 40, d: '<rect x="-50" y="-50" width="100" height="100"/><circle r="34"/><path d="M-34-34 34 34M34-34-34 34"/>' },
    val: { n: 'Valvola / collettore', g: 'Idraulico', c: BLUE, w: 30, h: 22, d: '<path d="M-50-40 50 40V-40L-50 40z"/>' },
    vtc: { n: 'Ventilconvettore', g: 'Idraulico', c: BLUE, w: 80, h: 25, d: '<rect x="-50" y="-50" width="100" height="100"/><circle cx="-24" r="30"/><circle cx="24" r="30"/>' },
    est: { n: 'Estrattore aria', g: 'Idraulico', c: BLUE, w: 24, h: 24, d: '<rect x="-46" y="-46" width="92" height="92"/><circle r="30"/><path d="M0 0 18-18M0 0-18-18M0 0 18 18M0 0-18 18"/>' },
    pq: { n: 'Pilastro quadrato', g: 'Strutture', w: 30, h: 30, d: '<rect x="-50" y="-50" width="100" height="100" fill="' + INK + '"/>' },
    pc: { n: 'Pilastro tondo', g: 'Strutture', w: 30, h: 30, d: '<circle r="50" fill="' + INK + '"/>' },
    can: { n: 'Canna fumaria', g: 'Strutture', w: 35, h: 35, d: '<rect x="-50" y="-50" width="100" height="100"/><circle r="26"/>' },
    asc: { n: 'Ascensore', g: 'Strutture', w: 120, h: 140, d: '<rect x="-50" y="-50" width="100" height="100"/><rect x="-44" y="-44" width="88" height="88"/>' + X1 },
    sc: { n: 'Scala rettilinea', g: 'Strutture', w: 100, h: 300, d: s => { const n = Math.max(3, s.n || Math.round(s.h / 28)); let p = '<rect x="-50" y="-50" width="100" height="100"/>'; for (let i = 1; i < n; i++) p += `<path d="M-50 ${-50 + 100 * i / n}H50"/>`; return p + '<path d="M0 42V-38M-12-26 0-40 12-26" fill="none"/>'; } }
  });
  const OP = {
    p: { n: 'Porta', l: 80, h: 210, sl: 0 }, pd: { n: 'Porta doppia', l: 140, h: 210, sl: 0 }, ps: { n: 'Porta scorrevole', l: 90, h: 210, sl: 0 },
    pi: { n: 'Porta ingresso', l: 100, h: 215, sl: 0 }, f: { n: 'Finestra', l: 120, h: 120, sl: 90 }, pf: { n: 'Portafinestra', l: 140, h: 220, sl: 0 }, v: { n: 'Varco', l: 100, h: 210, sl: 0 }
  };
  const WT = {
    t8: { n: 'Tramezzo laterizio 8', t: 8, c: INK }, t12: { n: 'Tramezzo laterizio 12', t: 12, c: INK }, cg: { n: 'Cartongesso 10', t: 10, c: '#6f7a93' },
    t15: { n: 'Muro 15', t: 15, c: INK }, t20: { n: 'Muro 20', t: 20, c: INK }, tp: { n: 'Tamponatura 30', t: 30, c: '#2b3248' }, po: { n: 'Muro portante 40', t: 40, c: '#161b2a' }, cls: { n: 'Calcestruzzo 25', t: 25, c: '#3a4156' }
  };
  const FL = { none: 'Nessuna', pa: 'Parquet', pi: 'Piastrelle', gr: 'Gres grande formato', ma: 'Marmo', re: 'Resina / cemento' };
  const STN = ['Esistente', 'Da demolire', 'Nuovo'];
  const isDoor = k => k === 'p' || k === 'pd' || k === 'ps' || k === 'pi' || k === 'pf';
  const layerOf = s => { const g = (SYM[s.k] || {}).g; return g === 'Elettrico' || g === 'Sicurezza' ? 'e' : g === 'Idraulico' ? 'i' : g === 'Strutture' ? 'k' : 'a'; };
  const LAYERS = [['r', 'Locali e pavimenti'], ['w', 'Pareti'], ['o', 'Porte e finestre'], ['a', 'Arredi'], ['e', 'Impianto elettrico'], ['i', 'Impianto idraulico'], ['k', 'Strutture'], ['q', 'Quote'], ['t', 'Testi']];

  /* ---------- geometria ---------- */
  function norm(p) { ['w', 'o', 's', 'q', 't', 'r'].forEach(k => { if (!Array.isArray(p[k])) p[k] = []; }); if (!p.h) p.h = '2,70'; if (!p.ly) p.ly = { h: {}, l: {} }; if (!p.mode) p.mode = 'gr'; if (!p.opt) p.opt = {}; return p; }
  const area = pts => { let a = 0; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; a += x1 * y2 - x2 * y1; } return Math.abs(a) / 2; };
  const sarea = pts => { let a = 0; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; a += x1 * y2 - x2 * y1; } return a / 2; };
  const perim = pts => { let l = 0; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; l += dist(x1, y1, x2, y2); } return l; };
  function centroid(pts) {
    let a = 0, cx = 0, cy = 0; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length], f = x1 * y2 - x2 * y1; a += f; cx += (x1 + x2) * f; cy += (y1 + y2) * f; }
    if (Math.abs(a) < 1e-6) { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2]; } return [cx / (3 * a), cy / (3 * a)];
  }
  function inPoly(x, y, pts) { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
  function segDist(px, py, x1, y1, x2, y2) { const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy; let t = L2 ? ((px - x1) * dx + (py - y1) * dy) / L2 : 0; t = Math.max(0, Math.min(1, t)); return { d: dist(px, py, x1 + t * dx, y1 + t * dy), t }; }
  function lineInt(p1, d1, p2, d2) { const c = d1[0] * d2[1] - d1[1] * d2[0]; if (Math.abs(c) < 1e-9) return null; const t = ((p2[0] - p1[0]) * d2[1] - (p2[1] - p1[1]) * d2[0]) / c; return [p1[0] + d1[0] * t, p1[1] + d1[1] * t, t]; }
  function segInt(a, b, c, d) { const r = lineInt(a, [b[0] - a[0], b[1] - a[1]], c, [d[0] - c[0], d[1] - c[1]]); if (!r) return null; const u = lineInt(c, [d[0] - c[0], d[1] - c[1]], a, [b[0] - a[0], b[1] - a[1]]); if (!u) return null; return r[2] >= -1e-6 && r[2] <= 1 + 1e-6 && u[2] >= -1e-6 && u[2] <= 1 + 1e-6 ? [r[0], r[1]] : null; }
  const wLen = w => dist(w.x, w.y, w.X, w.Y);
  function wFrame(w) { const L = wLen(w) || 1, ux = (w.X - w.x) / L, uy = (w.Y - w.y) / L; return { L, ux, uy, nx: -uy, ny: ux, ang: Math.atan2(uy, ux) * 180 / Math.PI }; }
  function opPoint(plan, o) { const w = plan.w.find(x => x.i === o.w); if (!w) return null; const f = wFrame(w); return { w, f, x: w.x + f.ux * o.p, y: w.y + f.uy * o.p }; }
  function quadPts(x1, y1, x2, y2, t, e1, e2) {
    const L = dist(x1, y1, x2, y2) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L, nx = -uy * t / 2, ny = ux * t / 2, ax = x1 - ux * e1, ay = y1 - uy * e1, bx = x2 + ux * e2, by = y2 + uy * e2;
    return [[ax + nx, ay + ny], [bx + nx, by + ny], [bx - nx, by - ny], [ax - nx, ay - ny]];
  }
  const wallQuad = w => quadPts(w.x, w.y, w.X, w.Y, w.t, w.t / 2, w.t / 2);
  function bbox(plan, only) {
    let a = [1e9, 1e9, -1e9, -1e9]; const add = (x, y, r) => { r = r || 0; a[0] = Math.min(a[0], x - r); a[1] = Math.min(a[1], y - r); a[2] = Math.max(a[2], x + r); a[3] = Math.max(a[3], y + r); };
    plan.w.forEach(w => { add(w.x, w.y, w.t / 2); add(w.X, w.Y, w.t / 2); }); if (only === 'w') return a[0] > a[2] ? null : a;
    plan.r.forEach(r => r.p.forEach(p => add(p[0], p[1]))); plan.s.forEach(s => add(s.x, s.y, Math.max(s.w, s.h) / 2)); plan.q.forEach(q => { add(q.x, q.y); add(q.X, q.Y); }); plan.t.forEach(t => add(t.x, t.y, 40));
    return a[0] > a[2] ? null : a;
  }
  /* punti di aggancio: estremi, punti medi, intersezioni, spigoli delle pareti */
  function snapPoints(plan) {
    const P = [], W = plan.w;
    W.forEach(w => { P.push({ x: w.x, y: w.y, k: 'e' }, { x: w.X, y: w.Y, k: 'e' }, { x: (w.x + w.X) / 2, y: (w.y + w.Y) / 2, k: 'm' }); wallQuad(w).forEach(q => P.push({ x: q[0], y: q[1], k: 'c' })); });
    for (let i = 0; i < W.length; i++) for (let j = i + 1; j < W.length; j++) { const p = segInt([W[i].x, W[i].y], [W[i].X, W[i].Y], [W[j].x, W[j].y], [W[j].X, W[j].Y]); if (p) P.push({ x: p[0], y: p[1], k: 'i' }); }
    plan.r.forEach(r => r.p.forEach(p => P.push({ x: p[0], y: p[1], k: 'c' }))); plan.q.forEach(q => P.push({ x: q.x, y: q.y, k: 'e' }, { x: q.X, y: q.Y, k: 'e' })); return P;
  }

  /* ---------- riconoscimento automatico del locale (riempimento + tracciamento del contorno) ---------- */
  function simplify(pts, eps) {
    if (pts.length < 4) return pts; let far = 0, fd = -1; for (let i = 1; i < pts.length; i++) { const d = dist(pts[0][0], pts[0][1], pts[i][0], pts[i][1]); if (d > fd) { fd = d; far = i; } }
    const part = arr => { const res = [0]; const rec = (a, b) => { let mx = -1, mi = -1; for (let i = a + 1; i < b; i++) { const d = segDist(arr[i][0], arr[i][1], arr[a][0], arr[a][1], arr[b][0], arr[b][1]).d; if (d > mx) { mx = d; mi = i; } } if (mx > eps) { rec(a, mi); res.push(mi); rec(mi, b); } }; rec(0, arr.length - 1); res.push(arr.length - 1); return res.map(i => arr[i]); };
    const h1 = part(pts.slice(0, far + 1)), h2 = part(pts.slice(far).concat([pts[0]])); return h1.concat(h2.slice(1, -1));
  }
  function detect(plan, px, py) {
    norm(plan); const W = plan.w; if (!W.length) return { err: 'Disegna prima le pareti' };
    const b = bbox(plan, 'w'); const pad = 60; let g = 2.5; const bw = b[2] - b[0] + 2 * pad, bh = b[3] - b[1] + 2 * pad; while (bw * bh / (g * g) > 1.6e6) g *= 2;
    const x0 = b[0] - pad, y0 = b[1] - pad, N = Math.ceil(bw / g), M = Math.ceil(bh / g), grid = new Uint8Array(N * M);
    W.forEach(w => { const q = wallQuad(w), minx = Math.max(0, Math.floor((Math.min(...q.map(p => p[0])) - x0) / g)), maxx = Math.min(N - 1, Math.ceil((Math.max(...q.map(p => p[0])) - x0) / g)), miny = Math.max(0, Math.floor((Math.min(...q.map(p => p[1])) - y0) / g)), maxy = Math.min(M - 1, Math.ceil((Math.max(...q.map(p => p[1])) - y0) / g));
      for (let j = miny; j <= maxy; j++) for (let i = minx; i <= maxx; i++) { const cx = x0 + (i + .5) * g, cy = y0 + (j + .5) * g; let s = 0, ok = true; for (let k = 0; k < 4; k++) { const A = q[k], B = q[(k + 1) % 4], c = (B[0] - A[0]) * (cy - A[1]) - (B[1] - A[1]) * (cx - A[0]); if (c === 0) continue; if (s === 0) s = c > 0 ? 1 : -1; else if ((c > 0 ? 1 : -1) !== s) { ok = false; break; } } if (ok) grid[j * N + i] = 1; } });
    const si = Math.floor((px - x0) / g), sj = Math.floor((py - y0) / g); if (si < 0 || sj < 0 || si >= N || sj >= M) return { err: 'Tocca dentro la zona delle pareti' }; if (grid[sj * N + si]) return { err: 'Tocca dentro il locale, non sul muro' };
    const stack = [sj * N + si]; grid[sj * N + si] = 2; let cnt = 0, open = false;
    while (stack.length) { const c = stack.pop(); cnt++; const i = c % N, j = (c - i) / N; if (i === 0 || j === 0 || i === N - 1 || j === M - 1) { open = true; break; } for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = (j + dj) * N + (i + di); if (grid[n] === 0) { grid[n] = 2; stack.push(n); } } }
    if (open) return { err: 'Il locale non è chiuso: controlla che le pareti si tocchino' };
    const E = new Map(); const key = (i, j) => j * (N + 1) + i; const addE = (a, b) => { const k = key(a[0], a[1]); (E.get(k) || E.set(k, []).get(k)).push([a, b]); };
    for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) if (grid[j * N + i] === 2) {
      if (j === 0 || grid[(j - 1) * N + i] !== 2) addE([i, j], [i + 1, j]); if (i === N - 1 || grid[j * N + i + 1] !== 2) addE([i + 1, j], [i + 1, j + 1]);
      if (j === M - 1 || grid[(j + 1) * N + i] !== 2) addE([i + 1, j + 1], [i, j + 1]); if (i === 0 || grid[j * N + i - 1] !== 2) addE([i, j + 1], [i, j]);
    }
    let best = null, bestA = 0; const used = new Set();
    for (const [k0, arr0] of E) for (const e0 of arr0) { if (used.has(e0)) continue; const loop = []; let e = e0, guard = 0; while (e && !used.has(e) && guard++ < 4e6) { used.add(e); loop.push(e[0]); const nxt = (E.get(key(e[1][0], e[1][1])) || []).find(x => !used.has(x)); e = nxt; } const pts = loop.map(p => [x0 + p[0] * g, y0 + p[1] * g]), a = area(pts); if (a > bestA) { bestA = a; best = pts; } }
    if (!best) return { err: 'Locale non riconosciuto' };
    let pts = best.filter((p, i) => { const a = best[(i + best.length - 1) % best.length], c = best[(i + 1) % best.length]; return (p[0] - a[0]) * (c[1] - p[1]) - (p[1] - a[1]) * (c[0] - p[0]) !== 0; });
    pts = simplify(pts, g * 1.3); if (pts.length < 3) return { err: 'Locale troppo piccolo' };
    /* affina i lati sul filo interno reale delle pareti: spigoli esatti */
    const lines = pts.map((p, i) => {
      const q = pts[(i + 1) % pts.length], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, ang = Math.atan2(q[1] - p[1], q[0] - p[0]); let bw2 = null, bd = 1e9;
      W.forEach(w => { const f = wFrame(w); let da = Math.abs(((ang - Math.atan2(f.uy, f.ux)) * 180 / Math.PI) % 180); if (da > 90) da = 180 - da; if (da > 4) return; const sd = (mx - w.x) * f.nx + (my - w.y) * f.ny, e = Math.abs(Math.abs(sd) - w.t / 2); if (e < g * 2 + 2 && e < bd) { bd = e; bw2 = { w, f, sg: sd >= 0 ? 1 : -1 }; } });
      if (!bw2) return { p: p, d: [q[0] - p[0], q[1] - p[1]] };
      const { w, f, sg } = bw2; return { p: [w.x + f.nx * sg * w.t / 2, w.y + f.ny * sg * w.t / 2], d: [f.ux, f.uy] };
    });
    const out = pts.map((p, i) => { const a = lines[(i + lines.length - 1) % lines.length], c = lines[i], r = lineInt(a.p, a.d, c.p, c.d); return r && dist(r[0], r[1], p[0], p[1]) < g * 3 + 4 ? [f1(r[0]), f1(r[1])] : [f1(p[0]), f1(p[1])]; });
    return { pts: out };
  }
  /* poligono chiuso di pareti: porta la linea tracciata sul filo interno (o esterno) e ricalcola gli spigoli */
  function offsetLoop(pts, t, al) {
    if (al === 'asse' || pts.length < 3) return pts.map(p => [p[0], p[1]]); const A = sarea(pts), s = al === 'int' ? t / 2 : -t / 2, L = pts.length, lines = [];
    for (let i = 0; i < L; i++) { const p = pts[i], q = pts[(i + 1) % L], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1; let nx = dy / l, ny = -dx / l; if (A < 0) { nx = -nx; ny = -ny; } lines.push({ p: [p[0] + nx * s, p[1] + ny * s], d: [dx, dy], n: [nx, ny] }); }
    return pts.map((p, i) => { const a = lines[(i + L - 1) % L], c = lines[i], r = lineInt(a.p, a.d, c.p, c.d); return r ? [f1(r[0]), f1(r[1])] : [f1(p[0] + c.n[0] * s), f1(p[1] + c.n[1] * s)]; });
  }

  /* ---------- statistiche, quantità ---------- */
  function roomOps(plan, r) {
    const out = []; plan.o.forEach(o => { const q = opPoint(plan, o); if (!q) return; let hit = false; for (let i = 0; i < r.p.length && !hit; i++) { const a = r.p[i], b = r.p[(i + 1) % r.p.length]; if (segDist(q.x, q.y, a[0], a[1], b[0], b[1]).d <= q.w.t / 2 + 14) hit = true; } if (hit) out.push(o); });
    return out;
  }
  function stats(plan) {
    norm(plan); const H = (num(plan.h) || 2.7) * 100, rooms = plan.r.map(r => {
      const ops = roomOps(plan, r), a = area(r.p), pe = perim(r.p), h = r.h ? num(r.h) * 100 : H, apA = ops.reduce((s, o) => s + o.l * o.h, 0);
      return { i: r.i, n: r.n || 'Locale', area: a, per: pe, h, wall: Math.max(0, pe * h - apA), ops, pts: r.p, fl: r.fl || 'none' };
    });
    const cnt = {}; plan.s.forEach(s => { cnt[s.k] = (cnt[s.k] || 0) + 1; });
    const W = [0, 0, 0], WA = [0, 0, 0]; plan.w.forEach(w => { const s = w.s || 0, L = wLen(w), h = w.h ? w.h : H, ap = plan.o.filter(o => o.w === w.i && (isDoor(o.k) || o.k === 'f' || o.k === 'v')).reduce((t, o) => t + o.l * o.h, 0); W[s] += L; WA[s] += Math.max(0, L * h - ap); });
    return { rooms, area: rooms.reduce((s, r) => s + r.area, 0), wall: plan.w.reduce((s, w) => s + wLen(w), 0), walls: plan.w.length, doors: plan.o.filter(o => isDoor(o.k) && o.k !== 'pf').length, wins: plan.o.filter(o => o.k === 'f' || o.k === 'pf').length, ops: plan.o.length, sym: cnt, wl: W, wa: WA };
  }

  /* ---------- disegno SVG (stringa) ---------- */
  const symD = (d, s) => typeof d.d === 'function' ? d.d(s || {}) : d.d;
  const eff = (s, mode) => mode === 'gr' ? (s || 0) : 0;
  const shown = (plan, layer, s, mode) => !(plan.ly && plan.ly.h && plan.ly.h[layer]) && !(mode === 'sf' && s === 2) && !(mode === 'pr' && s === 1);
  const DEFS = `<defs>
<pattern id="cdHd" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="#fde7e8"/><path d="M0 0V9" stroke="${DEMC}" stroke-width="3.2"/></pattern>
<pattern id="cdPa" width="60" height="20" patternUnits="userSpaceOnUse"><rect width="60" height="20" fill="#f1dfc6"/><path d="M0 0H60M0 10H60M30 0V10M0 10V20M60 10V20" stroke="#cdaa7f" stroke-width=".7" fill="none"/></pattern>
<pattern id="cdPi" width="33" height="33" patternUnits="userSpaceOnUse"><rect width="33" height="33" fill="#eaf1f5"/><path d="M0 0H33V33" stroke="#aebdca" stroke-width=".8" fill="none"/></pattern>
<pattern id="cdGr" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#ebe8e0"/><path d="M0 0H60V60" stroke="#c4bdaf" stroke-width=".9" fill="none"/></pattern>
<pattern id="cdMa" width="80" height="80" patternUnits="userSpaceOnUse"><rect width="80" height="80" fill="#f5f2ec"/><path d="M0 0H80V80M10 70Q30 50 45 55T75 20" stroke="#d6cfc0" stroke-width=".8" fill="none"/></pattern>
<pattern id="cdRe" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#d8dce3"/></pattern></defs>`;
  const FLP = { pa: 'cdPa', pi: 'cdPi', gr: 'cdGr', ma: 'cdMa', re: 'cdRe' };
  function opSvg(plan, o, sel, mode) {
    const q = opPoint(plan, o); if (!q) return ''; const { w, f } = q, t = w.t, l = o.l, h2 = l / 2, fl = o.f || 0, sx = fl & 2 ? -1 : 1, sy = fl & 1 ? -1 : 1, st = eff(o.s, mode);
    let g = `<path class="oj" d="M${-h2} ${-t / 2}H${h2}M${-h2} ${t / 2}H${h2}"/>`;
    if (o.k === 'p' || o.k === 'pi') g += `<rect class="ol" x="${-h2}" y="0" width="${o.k === 'pi' ? 6 : 4}" height="${l}"/><path class="oa" d="M${h2} 0A${l} ${l} 0 0 1 ${-h2} ${l}"/>`;
    else if (o.k === 'pd') g += `<rect class="ol" x="${-h2}" y="0" width="4" height="${h2}"/><rect class="ol" x="${h2 - 4}" y="0" width="4" height="${h2}"/><path class="oa" d="M0 0A${h2} ${h2} 0 0 1 ${-h2} ${h2}M0 0A${h2} ${h2} 0 0 0 ${h2} ${h2}"/>`;
    else if (o.k === 'ps') g += `<rect class="ol" x="${-h2}" y="${-t / 2 + 1}" width="${l * .56}" height="${Math.max(3, t * .34)}"/><path class="oa" d="M${-h2 + l * .62} ${-t * .1}H${h2 - 4}m-8-5 8 5-8 5"/>`;
    else if (o.k === 'f' || o.k === 'pf') {
      g += `<rect class="ofr" x="${-h2}" y="${-t / 2}" width="${l}" height="${t}"/><path class="og" d="M${-h2} 0H${h2}"/><path class="oj" d="M${-h2} ${-t / 6}H${h2}M${-h2} ${t / 6}H${h2}"/>`;
      if (o.k === 'pf') g += `<path class="oa" d="M0 0A${h2} ${h2} 0 0 1 ${-h2} ${h2}M0 0A${h2} ${h2} 0 0 0 ${h2} ${h2}"/>`;
    } else if (o.k === 'v') g += `<path class="oj" d="M${-h2} ${-t / 2 - 4}V${t / 2 + 4}M${h2} ${-t / 2 - 4}V${t / 2 + 4}"/>`;
    const hl = sel ? `<rect class="osel" x="${-h2 - 3}" y="${-t / 2 - 3}" width="${l + 6}" height="${t + 6}" rx="3"/>` : '';
    return `<g class="op s${st}" transform="translate(${f1(q.x)} ${f1(q.y)}) rotate(${f1(f.ang)}) scale(${sx} ${sy})">${hl}${g}</g>`;
  }
  function draw(plan, o) {
    norm(plan); o = o || {}; const z = o.z || .5, fs = (o.fs || 12) / z, sel = o.sel || new Set(), mode = o.mode || plan.mode || 'gr', out = [], is = (t, i) => sel.has(t + ':' + i), sh = (l, s) => shown(plan, l, s || 0, mode);
    if (sh('r')) plan.r.forEach((r, n) => {
      if (!r.p || r.p.length < 3) return; const pts = r.p.map(p => p[0] + ',' + p[1]).join(' '), fp = FLP[r.fl];
      out.push(`<polygon class="rm${is('r', r.i) ? ' sel' : ''}" fill="${fp ? 'url(#' + fp + ')' : TINT[n % TINT.length]}" points="${pts}"/>`);
    });
    if (sh('w')) plan.w.forEach(w => {
      if (!shown(plan, 'w', w.s, mode)) return; const L = wLen(w); if (L < 1) return; const f = wFrame(w), st = eff(w.s, mode), ops = plan.o.filter(x => x.w === w.i).sort((a, b) => a.p - b.p), c = (WT[w.m] || {}).c; let cur = 0; const segs = [];
      ops.forEach(x => { const a = Math.max(cur, x.p - x.l / 2), b = Math.min(L, x.p + x.l / 2); if (a > cur) segs.push([cur, a]); cur = Math.max(cur, b); }); if (cur < L) segs.push([cur, L]);
      segs.forEach(([a, b]) => { const qd = quadPts(w.x + f.ux * a, w.y + f.uy * a, w.x + f.ux * b, w.y + f.uy * b, w.t, a <= 0 ? w.t / 2 : 0, b >= L ? w.t / 2 : 0); out.push(`<polygon class="wl w${st}${is('w', w.i) ? ' sel' : ''}"${c && st === 0 ? ` style="--wc:${c}"` : ''} points="${qd.map(p => f1(p[0]) + ',' + f1(p[1])).join(' ')}"/>`); });
    });
    if (sh('o')) plan.o.forEach(x => { if (!shown(plan, 'o', x.s, mode)) return; out.push(opSvg(plan, x, is('o', x.i), mode)); });
    plan.s.forEach(s => {
      const d = SYM[s.k]; if (!d || !shown(plan, layerOf(s), s.s, mode)) return; const st = eff(s.s, mode), c = st === 1 ? DEMC : st === 2 ? '#a86b00' : (d.c || INK);
      out.push(`<g class="sy" style="--c:${c}" transform="translate(${f1(s.x)} ${f1(s.y)}) rotate(${s.a || 0}) scale(${f1(s.w / 100)} ${f1(s.h / 100)})">${symD(d, s)}</g>`);
      if (is('s', s.i)) out.push(`<rect class="ssel" x="${-s.w / 2 - 4}" y="${-s.h / 2 - 4}" width="${s.w + 8}" height="${s.h + 8}" rx="4" transform="translate(${f1(s.x)} ${f1(s.y)}) rotate(${s.a || 0})"/>`);
    });
    const cen = (() => { const m = plan.w.map(w => [(w.x + w.X) / 2, (w.y + w.Y) / 2]); return m.length ? [m.reduce((s, p) => s + p[0], 0) / m.length, m.reduce((s, p) => s + p[1], 0) / m.length] : [0, 0]; })();
    if (o.auto !== false && sh('q')) plan.w.forEach(w => {
      if (!shown(plan, 'w', w.s, mode)) return; const L = wLen(w); if (L < 25) return; const f = wFrame(w), mx = (w.x + w.X) / 2, my = (w.y + w.Y) / 2; let nx = f.nx, ny = f.ny; if ((mx - cen[0]) * nx + (my - cen[1]) * ny < 0) { nx = -nx; ny = -ny; }
      let a = f.ang; if (a > 90 || a < -90) a += 180; const d = w.t / 2 + fs * .75;
      out.push(`<text class="wd" font-size="${f1(fs * .82)}" text-anchor="middle" transform="translate(${f1(mx + nx * d)} ${f1(my + ny * d)}) rotate(${f1(a)})" dy="${f1(fs * .28)}">${m2(L)}</text>`);
    });
    if (plan.opt && plan.opt.ol && sh('o')) plan.o.forEach(x => { if (!shown(plan, 'o', x.s, mode)) return; const q = opPoint(plan, x); if (!q) return; out.push(`<text class="wd" font-size="${f1(fs * .7)}" text-anchor="middle" x="${f1(q.x)}" y="${f1(q.y + (q.w.t / 2 + fs * 1.3) * 1)}">${Math.round(x.l)}×${Math.round(x.h)}</text>`); });
    if (sh('q')) plan.q.forEach(q => {
      const L = dist(q.x, q.y, q.X, q.Y); if (L < 1) return; const ux = (q.X - q.x) / L, uy = (q.Y - q.y) / L, nx = -uy, ny = ux, d = q.d || 0, ax = q.x + nx * d, ay = q.y + ny * d, bx = q.X + nx * d, by = q.Y + ny * d, e = fs * .5, sg = d >= 0 ? 1 : -1;
      let a = Math.atan2(uy, ux) * 180 / Math.PI; if (a > 90 || a < -90) a += 180; const tk = fs * .45;
      out.push(`<g class="qt${is('q', q.i) ? ' sel' : ''}"><path d="M${q.x + nx * sg * e} ${q.y + ny * sg * e}L${ax + nx * sg * e} ${ay + ny * sg * e}M${q.X + nx * sg * e} ${q.Y + ny * sg * e}L${bx + nx * sg * e} ${by + ny * sg * e}M${ax} ${ay}L${bx} ${by}M${ax - ux * tk - nx * tk} ${ay - uy * tk - ny * tk}L${ax + ux * tk + nx * tk} ${ay + uy * tk + ny * tk}M${bx - ux * tk - nx * tk} ${by - uy * tk - ny * tk}L${bx + ux * tk + nx * tk} ${by + uy * tk + ny * tk}"/><text font-size="${f1(fs * .95)}" text-anchor="middle" transform="translate(${f1((ax + bx) / 2)} ${f1((ay + by) / 2)}) rotate(${f1(a)})" dy="${f1(-fs * .35)}">${esc(q.tx || m2(L))}</text></g>`);
    });
    if (sh('r')) plan.r.forEach(r => { if (!r.p || r.p.length < 3) return; const c = centroid(r.p); out.push(`<text class="rn" text-anchor="middle" font-size="${f1(fs * 1.15)}" x="${f1(c[0])}" y="${f1(c[1] - fs * .15)}">${esc(r.n || 'Locale')}</text><text class="ra" text-anchor="middle" font-size="${f1(fs * .95)}" x="${f1(c[0])}" y="${f1(c[1] + fs * 1.05)}">${mq(area(r.p))} m²</text>`); });
    if (sh('t')) plan.t.forEach(t => out.push(`<text class="tx${is('t', t.i) ? ' sel' : ''}" font-size="${f1(fs * ([1, 1.35, 1.9][(t.z || 1) - 1] || 1) * 1.1)}" x="${f1(t.x)}" y="${f1(t.y)}">${esc(t.s)}</text>`));
    return out.join('');
  }
  const svgCss = (k, hw) => `.rm{stroke:none}.rm.sel{stroke:${ACC};stroke-width:${2 * k};stroke-dasharray:6 4;vector-effect:non-scaling-stroke}
.wl{fill:var(--wc,${INK})}.wl.sel{fill:${ACC}}.wl.w1{fill:url(#cdHd);stroke:${DEMC};stroke-width:${k};vector-effect:non-scaling-stroke}.wl.w2{fill:${NEWC};stroke:#7a5200;stroke-width:${k};vector-effect:non-scaling-stroke}.wl.w1.sel,.wl.w2.sel{fill:${ACC};fill-opacity:.55}
.oj{stroke:${INK};stroke-width:${1.2 * k};fill:none;vector-effect:non-scaling-stroke}.oa{stroke:#6b7385;stroke-width:${k};fill:none;stroke-dasharray:4 3;vector-effect:non-scaling-stroke}.ol{fill:${INK}}.ofr{fill:#fff;stroke:${INK};stroke-width:${1.2 * k};vector-effect:non-scaling-stroke}.og{stroke:${BLUE};stroke-width:${1.4 * k};vector-effect:non-scaling-stroke}.osel{fill:${ACC};fill-opacity:.12;stroke:${ACC};stroke-width:${1.5 * k};vector-effect:non-scaling-stroke}
.op.s1 .oj,.op.s1 .oa,.op.s1 .ofr,.op.s1 .og{stroke:${DEMC}}.op.s1 .ol{fill:${DEMC}}.op.s2 .ol{fill:#a86b00}.op.s2 .ofr{fill:#ffe9a8}.op.s2 .oj{stroke:#7a5200}
.sy *{stroke:var(--c);stroke-width:${1.4 * k};vector-effect:non-scaling-stroke}.sy *:not([fill]){fill:#fff}.sy *[opacity]{fill:none}.ssel{fill:${ACC};fill-opacity:.08;stroke:${ACC};stroke-width:${1.4 * k};stroke-dasharray:5 3;vector-effect:non-scaling-stroke}
text{font-family:Inter,system-ui,Arial,sans-serif;fill:${INK};paint-order:stroke;stroke:#fff;stroke-width:${hw}px;stroke-linejoin:round}.wd{fill:#5b6475;font-weight:500}.rn{font-weight:700;fill:#14284f}.ra{fill:#44506a;font-weight:500}.tx.sel{fill:${ACC}}
.qt path{stroke:#0e7490;stroke-width:${k};fill:none;vector-effect:non-scaling-stroke}.qt text{fill:#0e7490;font-weight:600}.qt.sel path{stroke:${ACC};stroke-width:${2 * k}}`;
  const scoped = c => c.replace(/(^|\})\s*([^{}]+)\{/g, (m, a, s) => a + s.split(',').map(x => '.cdc-cad ' + x.trim()).join(',') + '{');
  const SCSS = scoped(svgCss(1, 3));

  /* ---------- anteprima, stampa in scala (PNG/PDF), DXF ---------- */
  function thumb(plan, w) {
    norm(plan); const b = bbox(plan); if (!b) return ''; const pad = 60, bw = b[2] - b[0] + pad * 2, bh = b[3] - b[1] + pad * 2, z = (w || 360) / bw;
    return `<svg viewBox="${b[0] - pad} ${b[1] - pad} ${bw} ${bh}" preserveAspectRatio="xMidYMid meet" class="cad-th cdc-cad"><style>${SCSS}</style>${DEFS}${draw(plan, { z, fs: 11, auto: false })}</svg>`;
  }
  const SCALES = [20, 25, 50, 75, 100, 150, 200, 250, 500];
  const PAPER = { A4: [210, 297], A3: [297, 420] };
  const dstr = d => { const x = d ? new Date(d) : new Date(); return x.toLocaleDateString('it-IT'); };
  function sheet(plan, o) {
    norm(plan); o = o || {}; const meta = o.meta || {}, mode = o.mode || plan.mode || 'gr', dpi = o.dpi || 200, pxmm = dpi / 25.4, b = bbox(plan) || [0, 0, 400, 300], pad = 45, bw = b[2] - b[0] + pad * 2, bh = b[3] - b[1] + pad * 2, mg = 7;
    const cart = o.cart === false ? 0 : (o.cartH || 24), fitD = (pw, ph) => { const aw = pw - 2 * mg, ah = ph - 2 * mg - cart; for (const d of SCALES) if (bw * 10 / d <= aw && bh * 10 / d <= ah) return d; return Math.ceil(Math.max(bw * 10 / aw, bh * 10 / ah) / 100) * 100; };
    let pw, ph, pn = 'Foglio'; if (Array.isArray(o.paper)) { pw = o.paper[0]; ph = o.paper[1]; } else {
      const base = PAPER[o.paper] || PAPER.A4, P = [base[0], base[1]], Lx = [base[1], base[0]]; pn = o.paper || 'A4';
      if (o.orient === 'p') [pw, ph] = P; else if (o.orient === 'l') [pw, ph] = Lx; else [pw, ph] = fitD(Lx[0], Lx[1]) < fitD(P[0], P[1]) ? Lx : fitD(Lx[0], Lx[1]) > fitD(P[0], P[1]) ? P : (bw >= bh ? Lx : P);
    }
    const d = o.scale || fitD(pw, ph), kk = 10 / d, aw = pw - 2 * mg, ah = ph - 2 * mg - cart, tx = mg + aw / 2 - (b[0] + b[2]) / 2 * kk, ty = mg + ah / 2 - (b[1] + b[3]) / 2 * kk, k = pxmm / 4.6, hw = d / 20;
    const fsCm = 2.5 * d / 10, S = stats(plan), anyS = plan.w.some(w => w.s) || plan.o.some(x => x.s) || plan.s.some(x => x.s);
    const t = (x, y, s, sz, cls, anc) => `<text class="ct ${cls || ''}" x="${f1(x)}" y="${f1(y)}" font-size="${sz}"${anc ? ` text-anchor="${anc}"` : ''}>${esc(s)}</text>`;
    let sb = [1, 2, 5, 10, 20].find(m => m * 1000 / d >= 22) || 20; const sbl = sb * 1000 / d, bx = pw - mg - 6 - sbl, by = ph - mg - cart - 7;
    let bar = ''; for (let i = 0; i < 4; i++) bar += `<rect x="${f1(bx + sbl / 4 * i)}" y="${by}" width="${f1(sbl / 4)}" height="1.6" fill="${i % 2 ? '#fff' : INK}" stroke="${INK}" stroke-width=".18"/>`;
    bar += t(bx, by - 1.4, '0', 2.4, '', 'middle') + t(bx + sbl, by - 1.4, sb + ' m', 2.4, '', 'middle');
    const nx = pw - mg - 10, ny = mg + 12, north = `<g transform="translate(${nx} ${ny})"><circle r="5.2" fill="#fff" stroke="${INK}" stroke-width=".25"/><path d="M0-4.4 2.2 3 0 1.6-2.2 3z" fill="${INK}"/>${t(0, -6.4, 'N', 3, '', 'middle')}</g>`;
    let leg = ''; if (mode === 'gr' && anyS) leg = `<g transform="translate(${mg + 4} ${ph - mg - cart - 14})"><rect width="5" height="3" fill="${NEWC}" stroke="#7a5200" stroke-width=".2"/>${t(7, 2.5, 'Nuove costruzioni', 2.5)}<rect y="5" width="5" height="3" fill="url(#cdHd)" stroke="${DEMC}" stroke-width=".2"/>${t(7, 7.5, 'Demolizioni', 2.5)}</g>`;
    const cy0 = ph - mg - cart, c1 = aw * .42, c2 = aw * .32;
    const cartS = cart ? `<g><rect x="${mg}" y="${cy0}" width="${aw}" height="${cart}" fill="#fff" stroke="${INK}" stroke-width=".35"/><path d="M${mg + c1} ${cy0}v${cart}M${mg + c1 + c2} ${cy0}v${cart}" stroke="${INK}" stroke-width=".25"/>
${t(mg + 3, cy0 + 5, String(meta.studio || 'Rilievo').toUpperCase(), 2.2, 'lb')}${t(mg + 3, cy0 + 11.5, meta.cliente || ' ', 4, 'bd')}${t(mg + 3, cy0 + 17, meta.cantiere || ' ', 3, '')}${t(mg + 3, cy0 + cart - 2.2, meta.pratica ? 'Pratica ' + meta.pratica : ' ', 2.4, 'lb')}
${t(mg + c1 + 3, cy0 + 5, 'ELABORATO', 2.2, 'lb')}${t(mg + c1 + 3, cy0 + 11.5, 'Planimetria', 4, 'bd')}${t(mg + c1 + 3, cy0 + 17, plan.n || 'Piantina', 3, '')}${t(mg + c1 + 3, cy0 + cart - 2.2, 'Superficie utile ' + mq(S.area) + ' m²', 2.4, 'lb')}
${t(mg + c1 + c2 + 3, cy0 + 5, 'SCALA', 2.2, 'lb')}${t(mg + c1 + c2 + 3, cy0 + 13, '1:' + d, 6.4, 'bd')}${t(mg + c1 + c2 + 3, cy0 + 18, 'Data ' + dstr(meta.data), 2.8, '')}${t(mg + c1 + c2 + 3, cy0 + cart - 2.2, pn + ' · quote in metri', 2.4, 'lb')}</g>` : '';
    const css = svgCss(k, hw) + `.ct{stroke:none;paint-order:normal;font-family:Inter,Arial,sans-serif}.ct.lb{fill:#7a8399;font-weight:600;letter-spacing:.04em}.ct.bd{font-weight:700}`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(pw * pxmm)}" height="${Math.round(ph * pxmm)}" viewBox="0 0 ${pw} ${ph}"><style>${css}</style>${DEFS}<rect width="${pw}" height="${ph}" fill="#fff"/><rect x="${mg * .5}" y="${mg * .5}" width="${pw - mg}" height="${ph - mg}" fill="none" stroke="#9aa5bd" stroke-width=".25"/>
<g transform="translate(${f1(tx)} ${f1(ty)}) scale(${kk})">${draw(plan, { z: 1, fs: fsCm, auto: o.auto !== false, mode })}</g>${north}${bar}${leg}${cartS}</svg>`;
    return { svg, pw, ph, d, w: Math.round(pw * pxmm), h: Math.round(ph * pxmm), pn };
  }
  function sheetPng(plan, o) {
    const s = sheet(plan, o); return new Promise((res, rej) => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = s.w; c.height = s.h; c.getContext('2d').drawImage(im, 0, 0); res({ url: c.toDataURL('image/png'), w: s.w, h: s.h, d: s.d, pw: s.pw, ph: s.ph }); }; im.onerror = () => rej(new Error('Disegno non esportabile')); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s.svg); });
  }
  const png = (plan, wpx, o) => sheetPng(plan, Object.assign({ paper: 'A3', dpi: 150 }, o || {}));

  function dxf(plan) {
    norm(plan); const L = [], LAY = { MURI: 7, DEMOLIZIONI: 1, NUOVE: 2, APERTURE: 5, ARREDI: 3, IMPIANTI: 4, QUOTE: 6, TESTI: 7, LOCALI: 8 };
    const g = (c, v) => { L.push(String(c), String(v)); }, n = v => (Math.round(v * 100) / 100).toFixed(2), Y = y => -y;
    g(0, 'SECTION'); g(2, 'HEADER'); g(9, '$ACADVER'); g(1, 'AC1009'); g(0, 'ENDSEC');
    g(0, 'SECTION'); g(2, 'TABLES'); g(0, 'TABLE'); g(2, 'LTYPE'); g(70, 1); g(0, 'LTYPE'); g(2, 'CONTINUOUS'); g(70, 0); g(3, 'Solid line'); g(72, 65); g(73, 0); g(40, '0.0'); g(0, 'ENDTAB');
    g(0, 'TABLE'); g(2, 'LAYER'); g(70, Object.keys(LAY).length); Object.keys(LAY).forEach(k => { g(0, 'LAYER'); g(2, k); g(70, 0); g(62, LAY[k]); g(6, 'CONTINUOUS'); }); g(0, 'ENDTAB'); g(0, 'ENDSEC');
    g(0, 'SECTION'); g(2, 'ENTITIES');
    const line = (ly, a, b) => { g(0, 'LINE'); g(8, ly); g(10, n(a[0])); g(20, n(Y(a[1]))); g(30, '0.0'); g(11, n(b[0])); g(21, n(Y(b[1]))); g(31, '0.0'); };
    const poly = (ly, pts, closed) => { g(0, 'POLYLINE'); g(8, ly); g(66, 1); g(70, closed ? 1 : 0); pts.forEach(p => { g(0, 'VERTEX'); g(8, ly); g(10, n(p[0])); g(20, n(Y(p[1]))); g(30, '0.0'); }); g(0, 'SEQEND'); g(8, ly); };
    const text = (ly, p, h, s, rot) => { g(0, 'TEXT'); g(8, ly); g(10, n(p[0])); g(20, n(Y(p[1]))); g(30, '0.0'); g(40, n(h)); g(1, String(s).replace(/[^\x20-\x7e]/g, c => ({ 'à': 'a', 'è': 'e', 'é': 'e', 'ì': 'i', 'ò': 'o', 'ù': 'u', '²': '2', '×': 'x', '°': ' gradi' }[c] || '?'))); if (rot) g(50, n(-rot)); };
    const arc = (ly, c, a, b) => { const A = [a[0] - c[0], Y(a[1]) - Y(c[1])], B = [b[0] - c[0], Y(b[1]) - Y(c[1])], r = Math.hypot(A[0], A[1]); let a1 = Math.atan2(A[1], A[0]) * 180 / Math.PI, a2 = Math.atan2(B[1], B[0]) * 180 / Math.PI; if (A[0] * B[1] - A[1] * B[0] < 0) { const t = a1; a1 = a2; a2 = t; } g(0, 'ARC'); g(8, ly); g(10, n(c[0])); g(20, n(Y(c[1]))); g(30, '0.0'); g(40, n(r)); g(50, n((a1 + 360) % 360)); g(51, n((a2 + 360) % 360)); };
    plan.w.forEach(w => { const ly = w.s === 1 ? 'DEMOLIZIONI' : w.s === 2 ? 'NUOVE' : 'MURI'; poly(ly, wallQuad(w), true); });
    plan.o.forEach(o => {
      const q = opPoint(plan, o); if (!q) return; const { w, f } = q, t = w.t, h2 = o.l / 2, fl = o.f || 0, sx = fl & 2 ? -1 : 1, sy = fl & 1 ? -1 : 1, W = (lx, ly) => { const X = sx * lx, Yy = sy * ly; return [q.x + f.ux * X - f.uy * Yy, q.y + f.uy * X + f.ux * Yy]; };
      line('APERTURE', W(-h2, -t / 2), W(-h2, t / 2)); line('APERTURE', W(h2, -t / 2), W(h2, t / 2));
      if (o.k === 'f' || o.k === 'pf') line('APERTURE', W(-h2, 0), W(h2, 0));
      if (o.k === 'p' || o.k === 'pi') { line('APERTURE', W(-h2, 0), W(-h2, o.l)); arc('APERTURE', W(-h2, 0), W(h2, 0), W(-h2, o.l)); }
      if (o.k === 'pd') { line('APERTURE', W(-h2, 0), W(-h2, h2)); line('APERTURE', W(h2, 0), W(h2, h2)); arc('APERTURE', W(-h2, 0), W(0, 0), W(-h2, h2)); arc('APERTURE', W(h2, 0), W(0, 0), W(h2, h2)); }
    });
    plan.s.forEach(s => { const a = (s.a || 0) * Math.PI / 180, c = Math.cos(a), si = Math.sin(a), P = [[-s.w / 2, -s.h / 2], [s.w / 2, -s.h / 2], [s.w / 2, s.h / 2], [-s.w / 2, s.h / 2]].map(p => [s.x + p[0] * c - p[1] * si, s.y + p[0] * si + p[1] * c]); poly(['e', 'i', 'k'].includes(layerOf(s)) ? 'IMPIANTI' : 'ARREDI', P, true); text('ARREDI', [s.x - s.w / 2 + 3, s.y], 6, (SYM[s.k] || {}).n || s.k, s.a || 0); });
    plan.q.forEach(q => { const Ld = dist(q.x, q.y, q.X, q.Y); if (Ld < 1) return; const ux = (q.X - q.x) / Ld, uy = (q.Y - q.y) / Ld, nx = -uy, ny = ux, d = q.d || 0, a = [q.x + nx * d, q.y + ny * d], b = [q.X + nx * d, q.Y + ny * d]; line('QUOTE', [q.x, q.y], a); line('QUOTE', [q.X, q.Y], b); line('QUOTE', a, b); text('QUOTE', [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], 8, q.tx || m2(Ld), Math.atan2(uy, ux) * 180 / Math.PI); });
    plan.r.forEach(r => { if (!r.p || r.p.length < 3) return; poly('LOCALI', r.p, true); const c = centroid(r.p); text('TESTI', [c[0] - 40, c[1]], 12, r.n || 'Locale'); text('TESTI', [c[0] - 40, c[1] - 18], 9, mq(area(r.p)) + ' mq'); });
    plan.t.forEach(t => text('TESTI', [t.x, t.y], 10 * ([1, 1.35, 1.9][(t.z || 1) - 1] || 1), t.s));
    g(0, 'ENDSEC'); g(0, 'EOF'); return L.join('\r\n') + '\r\n';
  }

  /* computo di massima ricavato dal disegno (per i preventivi) */
  function bom(plan) {
    const S = stats(plan), out = [], H = (num(plan.h) || 2.7) * 100, add = (d, u, q, k) => { if (q > 0.0001) out.push({ k, d, u, q: Math.round(q * 100) / 100 }); };
    add('Demolizione tramezzi e pareti (da disegno)', 'mq', S.wa[1] / 10000, 'dem');
    add('Realizzazione nuove pareti (da disegno)', 'mq', S.wa[2] / 10000, 'par');
    const fl = {}; S.rooms.forEach(r => { if (r.fl && r.fl !== 'none') fl[r.fl] = (fl[r.fl] || 0) + r.area / 10000; }); Object.keys(fl).forEach(k => add('Posa pavimento: ' + FL[k].toLowerCase(), 'mq', fl[k], 'pav'));
    add('Tinteggiatura pareti dei locali', 'mq', S.rooms.reduce((s, r) => s + r.wall, 0) / 10000, 'tin'); add('Tinteggiatura soffitti', 'mq', S.area / 10000, 'sof');
    const cnt = (f) => plan.o.filter(f).length;
    add('Rimozione porte', 'cad', cnt(o => o.s === 1 && isDoor(o.k)), 'rp'); add('Fornitura e posa nuove porte interne', 'cad', cnt(o => o.s === 2 && isDoor(o.k) && o.k !== 'pf' && o.k !== 'pi'), 'np');
    add('Rimozione serramenti', 'cad', cnt(o => o.s === 1 && (o.k === 'f' || o.k === 'pf')), 'rf'); add('Fornitura e posa nuovi serramenti', 'cad', cnt(o => o.s === 2 && (o.k === 'f' || o.k === 'pf')), 'nf');
    const sy = {}; plan.s.forEach(s => { if (s.s === 2) sy[s.k] = (sy[s.k] || 0) + 1; }); Object.keys(sy).forEach(k => { if (SYM[k]) add('Fornitura e posa: ' + SYM[k].n.toLowerCase(), 'cad', sy[k], 'sym'); });
    return out;
  }
  const I = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const IC = {
    sel: '<path d="M5 3l14 8-6 2-3 6z"/>', pan: '<path d="M8 13V6a1.5 1.5 0 0 1 3 0v5m0-2.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2-4a1.5 1.5 0 0 1 2.5-1.5L8 15"/>',
    wall: '<path d="M4 20 20 4"/><circle cx="4" cy="20" r="1.8"/><circle cx="20" cy="4" r="1.8"/>', room: '<rect x="4" y="5" width="16" height="11"/><path d="M4 20h16M4 18.5v3M20 18.5v3"/>', area: '<path d="M5 18 4 8l8-4 8 6-3 8z"/>',
    op: '<path d="M6 21V4h10v17M4 21h16"/><circle cx="13" cy="13" r="1"/>', sym: '<rect x="3" y="11" width="18" height="7" rx="2"/><path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3M6 18v2M18 18v2"/>',
    dim: '<path d="M3 7v10M21 7v10M3 12h18M7 9l-4 3 4 3M17 9l4 3-4 3"/>', txt: '<path d="M5 7V5h14v2M12 5v14M9 19h6"/>', undo: '<path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3"/>', redo: '<path d="M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3"/>',
    zin: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5M11 8v6M8 11h6"/>', zout: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5M8 11h6"/>', fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    grid: '<path d="M4 4h16v16H4zM4 12h16M12 4v16"/>', mag: '<path d="M6 3v9a6 6 0 0 0 12 0V3h-4v9a2 2 0 0 1-4 0V3zM6 7h4M14 7h4"/>', dims: '<path d="M4 9h16M4 6v6M20 6v6M9 17h6"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    rot: '<path d="M20 12a8 8 0 1 1-3-6.2M20 4v5h-5"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>', dl: '<path d="M12 4v11m-4-4 4 4 4-4M5 20h14"/>',
    ok: '<path d="M5 12.5 10 17.5 19 7"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>', flip: '<path d="M12 3v18M8 7 3 12l5 5zM16 7l5 5-5 5z"/>', end: '<path d="M5 12.5 10 17.5 19 7"/>',
    detect: '<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M12 8v8M8 12h8"/><circle cx="12" cy="12" r="2.2"/>', meas: '<path d="M3 17 17 3l4 4L7 21z M7 13l2 2M10 10l2 2M13 7l2 2"/>', layers: '<path d="m12 3 9 5-9 5-9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5"/>', exp: '<path d="M12 3v12m-4-4 4 4 4-4M4 17v3h16v-3"/>', plus: '<path d="M12 5v14M5 12h14"/>', mirror: '<path d="M12 3v18M7 7 3 12l4 5zM17 7l4 5-4 5z"/>', split: '<path d="M4 12h6M14 12h6M12 5v14"/>', join: '<path d="M4 20V8h12M16 8l-4-4M16 8l-4 4"/>', eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', multi: '<rect x="3" y="3" width="10" height="10" rx="1"/><rect x="11" y="11" width="10" height="10" rx="1"/>', ang: '<path d="M4 20h16M4 20 14 6M9 20a5 5 0 0 0-1.6-3.7"/>', paste: '<rect x="6" y="5" width="12" height="16" rx="2"/><path d="M9 5V3h6v2"/>', pdf: '<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 14h6M9 17h6"/>'
  };
  const CSS = `.cad-lock{overflow:hidden!important}
.cad{--n1:#0d1730;--n2:#14284f;--n3:#1d3566;--am:#f2b13c;position:fixed;inset:0;z-index:300;display:grid;grid-template-rows:auto minmax(0,1fr);background:var(--n1);color:#e8eefc;font:14px/1.4 Inter,system-ui,sans-serif;-webkit-user-select:none;user-select:none}
.cad *{box-sizing:border-box}.cad button{font:inherit;cursor:pointer}.cad svg{display:block}.cad input,.cad select{font:inherit}
@keyframes cad-in{from{opacity:0;transform:scale(.985)}}@keyframes cad-pop{from{opacity:0;transform:translateY(6px) scale(.97)}}@keyframes cad-sl{from{opacity:0;transform:translateX(14px)}}
.cad-top{display:flex;align-items:center;gap:6px;padding:8px 10px;background:linear-gradient(180deg,#18306a,var(--n2));border-bottom:1px solid rgba(255,255,255,.08);flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}.cad-top::-webkit-scrollbar{display:none}
.cad-top .nm{flex:1 1 160px;min-width:110px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:10px;color:#fff;height:38px;padding:0 12px;font-weight:600;outline:none;-webkit-user-select:text;user-select:text}.cad-top .nm:focus{border-color:var(--am)}
.cad-b{color:#e8eefc;flex:none;display:inline-grid;place-items:center;width:38px;height:38px;border-radius:10px;border:1px solid transparent;background:transparent;transition:background .15s,transform .15s}.cad-b svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.cad-b:hover{background:rgba(255,255,255,.1)}.cad-b:active{transform:scale(.92)}.cad-b.on{background:rgba(242,177,60,.18);border-color:rgba(242,177,60,.55);color:var(--am)}.cad-b[disabled]{opacity:.3;pointer-events:none}
.cad-b.done{width:auto;padding:0 14px;gap:7px;display:inline-flex;align-items:center;background:var(--am);color:#2a1d00;font-weight:700}.cad-b.done:hover{background:#ffc45a}
.cad-sep{flex:none;width:1px;height:22px;background:rgba(255,255,255,.14);margin:0 3px}.cad-zl{flex:none;min-width:48px;text-align:center;font-size:12.5px;opacity:.8;font-variant-numeric:tabular-nums}
.cad-main{display:grid;grid-template-columns:62px minmax(0,1fr) 300px;min-height:0}
.cad-tools{display:flex;flex-direction:column;gap:4px;padding:10px 7px;background:var(--n2);border-right:1px solid rgba(255,255,255,.07);overflow-y:auto;scrollbar-width:none}.cad-tools .cad-b{width:48px;height:48px;position:relative}.cad-tools .cad-b svg{width:23px;height:23px}
.cad-tools .cad-b kbd{position:absolute;right:4px;bottom:2px;font:600 8.5px Inter,sans-serif;opacity:.45}
.cad-tools .cad-b::after{content:attr(data-t);position:absolute;left:58px;top:50%;transform:translateY(-50%);white-space:nowrap;background:#000c;color:#fff;font-size:12px;padding:5px 9px;border-radius:7px;opacity:0;pointer-events:none;transition:opacity .15s;z-index:5}.cad-tools .cad-b:hover::after{opacity:1}
.cad-stage{position:relative;min-width:0;min-height:0;background:#fbfcfe;overflow:hidden}.cad-svg{position:absolute;inset:0;width:100%;height:100%;touch-action:none;background:#fbfcfe;cursor:default}
.cad-svg.t-wall,.cad-svg.t-area,.cad-svg.t-room,.cad-svg.t-dim{cursor:crosshair}.cad-svg.t-pan,.cad-svg.grab{cursor:grab}.cad-svg.t-op,.cad-svg.t-sym,.cad-svg.t-txt{cursor:copy}
.cad-hint{position:absolute;left:12px;right:12px;bottom:12px;display:flex;justify-content:center;pointer-events:none}.cad-hint span{background:rgba(13,23,48,.88);color:#e8eefc;font-size:12.5px;padding:8px 14px;border-radius:99px;max-width:100%;text-align:center;animation:cad-pop .3s both}
.cad-opt{position:absolute;left:12px;top:12px;display:flex;gap:6px;align-items:center;flex-wrap:wrap;max-width:calc(100% - 24px);animation:cad-pop .25s both}
.cad-chip{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;border-radius:99px;border:1px solid #d7dde9;background:#fff;color:#1d2433;font-size:12.5px;font-weight:600;box-shadow:0 4px 14px -8px rgba(20,40,80,.4)}.cad-chip.on{background:var(--n2);color:#fff;border-color:var(--n2)}.cad-chip.go{background:var(--am);border-color:var(--am);color:#2a1d00}
.cad-chip svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.cad-len{position:absolute;right:12px;top:12px;display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #d7dde9;border-radius:12px;padding:6px 8px 6px 12px;box-shadow:0 10px 30px -14px rgba(20,40,80,.5);animation:cad-pop .25s both;color:#1d2433;font-size:12.5px;font-weight:600}
.cad-len input{width:84px;height:34px;border:1px solid #c9d1e0;border-radius:8px;padding:0 9px;font-weight:700;font-size:15px;color:#1d2433;background:#fff;outline:none;-webkit-user-select:text;user-select:text}.cad-len input:focus{border-color:${ACC}}
.cad-sb{position:absolute;left:14px;bottom:56px;color:#1d2433;font-size:11.5px;font-weight:600;pointer-events:none}.cad-sb i{display:block;height:7px;border:2px solid #1d2433;border-top:0;margin-bottom:3px}
.cad-fly{position:absolute;left:10px;top:54px;bottom:60px;width:276px;max-width:calc(100% - 20px);overflow-y:auto;background:rgba(255,255,255,.97);border:1px solid #d7dde9;border-radius:16px;padding:10px;box-shadow:0 24px 60px -24px rgba(10,20,50,.55);animation:cad-pop .25s both;color:#1d2433}
.cad-fly h5{margin:10px 4px 6px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#7a8399}.cad-fly h5:first-child{margin-top:2px}.cad-fg{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.cad-it{display:grid;gap:3px;justify-items:center;padding:7px 4px 6px;border-radius:11px;border:1px solid #e4e9f2;background:#fff;color:#1d2433;font-size:11px;font-weight:600;line-height:1.15;text-align:center;transition:transform .15s,border-color .15s,box-shadow .15s}.cad-it svg{width:56px;height:46px}.cad-it:hover{transform:translateY(-2px);border-color:${ACC};box-shadow:0 8px 18px -10px rgba(37,99,235,.55)}.cad-it.on{border-color:${ACC};background:#eef3ff}
.cad-side{background:var(--n2);border-left:1px solid rgba(255,255,255,.07);overflow-y:auto;padding:14px;min-height:0;animation:cad-sl .35s .1s both}
.cad-side h4{margin:0 0 10px;font-size:13px;letter-spacing:.02em;display:flex;align-items:center;gap:8px}.cad-side h4 small{font-weight:500;opacity:.6;font-size:12px}.cad-side h4 .sp{flex:1}
.cad-f{display:grid;gap:5px;margin-bottom:10px;font-size:12px;color:#b9c6e6;font-weight:600}.cad-f input,.cad-f select{width:100%;height:38px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);color:#fff;padding:0 11px;outline:none;font-size:14px;font-weight:600;-webkit-user-select:text;user-select:text}.cad-f select option{color:#111}.cad-f input:focus,.cad-f select:focus{border-color:var(--am)}
.cad-r2{display:grid;grid-template-columns:1fr 1fr;gap:8px}.cad-acts{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}.cad-acts .cad-b{width:auto;padding:0 11px;gap:6px;display:inline-flex;align-items:center;font-size:12.5px;font-weight:600;background:rgba(255,255,255,.08)}.cad-acts .cad-b.dg{color:#ff9aa2}.cad-acts .cad-b.pr{background:var(--am);color:#2a1d00}
.cad-kp{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}.cad-kp div{background:rgba(255,255,255,.07);border-radius:12px;padding:10px 12px}.cad-kp span{display:block;font-size:11px;color:#9fb0d8;font-weight:600}.cad-kp b{display:block;font-size:19px;margin-top:2px;font-variant-numeric:tabular-nums}
.cad-rl{display:grid;gap:5px;margin:8px 0 12px}.cad-rl button{color:#e8eefc;display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;text-align:left;background:rgba(255,255,255,.06);border:1px solid transparent;border-radius:10px;padding:8px 11px;font-size:13px;transition:background .15s,transform .15s}.cad-rl button:hover{background:rgba(255,255,255,.12);transform:translateX(2px)}.cad-rl small{opacity:.65;font-variant-numeric:tabular-nums}
.cad-p{font-size:12px;color:#a9b8de;line-height:1.5;margin:6px 0 0}
.cad-bar{position:absolute;left:0;top:0;height:3px;background:linear-gradient(90deg,var(--am),#fff);width:100%;transform-origin:left;animation:cad-bar .6s both}@keyframes cad-bar{from{transform:scaleX(0)}}
.cad.ro .cad-tools .e,.cad.ro .cad-top .e{display:none}
.cad-th{width:100%;height:100%}.cad-sumb{display:none}
@media(max-width:860px){.cad-top>.cad-b[data-a=close]:not(.done){display:none}.cad-top{gap:4px;padding:8px 8px}.cad-top .cad-b{width:36px;height:38px}.cad-top .nm{min-width:70px;flex-basis:80px}.cad-top .m-h{display:none}.cad-sumb{display:inline-grid!important}.cad-b.done{padding:0;width:38px}.cad-b.done span{display:none}.cad-side.sum:not(.open){display:none}.cad-main{grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr) auto}.cad-tools{grid-row:2;flex-direction:row;padding:6px 8px;overflow-x:auto;overflow-y:hidden;border-right:0;border-top:1px solid rgba(255,255,255,.08);padding-bottom:max(6px,env(safe-area-inset-bottom))}.cad-tools .cad-b{flex:none;width:46px;height:46px}.cad-tools .cad-b::after,.cad-tools .cad-b kbd{display:none}
.cad-side{position:absolute;left:8px;right:8px;bottom:70px;z-index:6;max-height:44%;border:1px solid rgba(255,255,255,.12);border-radius:18px;box-shadow:0 18px 50px -12px #000a;animation:cad-pop .25s both}.cad-side.empty{display:none}.cad-stage{grid-row:1}.cad-hint{bottom:8px}.cad-sb{bottom:46px}.cad-fly{top:52px;bottom:8px}.cad-top .zl2{display:none}}
@media(prefers-reduced-motion:reduce){.cad,.cad *{animation:none!important;transition:none!important}}`;
  const TOOLS = [['sel', 'Seleziona', 'V'], ['pan', 'Sposta la vista', 'H'], ['wall', 'Pareti', 'W'], ['room', 'Locale da misure', 'R'], ['detect', 'Riconosci locale', 'D'], ['area', 'Area libera', 'A'], ['op', 'Porte e finestre', 'P'], ['sym', 'Arredi e impianti', 'S'], ['dim', 'Quota', 'Q'], ['meas', 'Misura', 'M'], ['txt', 'Testo', 'T']];
  const HINT = {
    sel: 'Tocca un elemento · trascina per spostarlo · Maiusc per più elementi · trascina sullo sfondo per selezionare con il rettangolo', pan: 'Trascina per spostare la vista · pizzica o rotella per lo zoom',
    wall: 'Tocca il punto di partenza, poi i vertici. Scrivi la misura (es. 3,40) e premi Invio; Tab per l’angolo. Chiudi sul primo punto per creare il locale', room: 'Trascina un rettangolo oppure scrivi le misure interne nel pannello',
    detect: 'Tocca dentro un locale chiuso: il programma ne rileva il contorno interno e calcola i mq netti', area: 'Tocca i vertici del locale; chiudi sul primo punto o premi Fine · calcola mq e perimetro',
    op: 'Avvicinati a una parete e tocca per inserire. Vedi le distanze dagli spigoli', sym: 'Scegli l’elemento e tocca dove metterlo: si appoggia da solo alla parete', dim: 'Tocca due punti per quotare (si aggancia a spigoli e estremi)', meas: 'Tocca due punti: vedi distanza, angolo e differenze X/Y (non viene salvata)', txt: 'Tocca dove scrivere'
  };
  const SNL = { e: 'Estremo', m: 'Punto medio', i: 'Intersezione', c: 'Spigolo' };
  let cssDone = false;
  const CSS2 = `
.cad-main{grid-template-columns:62px minmax(0,1fr) 320px}.cad-tools{gap:3px}.cad-tools .cad-b{height:44px}
.cad-pop{position:absolute;right:12px;top:54px;width:300px;max-width:calc(100% - 24px);max-height:calc(100% - 120px);overflow-y:auto;background:rgba(255,255,255,.98);border:1px solid #d7dde9;border-radius:16px;padding:12px;box-shadow:0 24px 60px -24px rgba(10,20,50,.55);animation:cad-pop .22s both;color:#1d2433;z-index:4}
.cad-pop h5{margin:12px 2px 6px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#7a8399}.cad-pop h5:first-child{margin-top:0}
.cad-pop .row{display:flex;gap:6px;flex-wrap:wrap}.cad-pop .row .cad-chip{height:30px;padding:0 10px;font-size:12px}
.cad-pop .ly{display:grid;grid-template-columns:1fr 34px 34px;gap:4px;align-items:center;padding:3px 0;font-size:13px;font-weight:600}.cad-pop .ly button{height:30px;border-radius:8px;border:1px solid #e0e5ef;background:#fff;color:#7a8399;display:grid;place-items:center}.cad-pop .ly button.on{background:#eaf1ff;border-color:#9db8f0;color:${ACC}}.cad-pop .ly button svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.cad-pop select,.cad-pop input{width:100%;height:36px;border-radius:9px;border:1px solid #cdd5e3;padding:0 9px;font-weight:600;color:#1d2433;background:#fff;-webkit-user-select:text;user-select:text}
.cad-pop .go{margin-top:8px;width:100%;height:40px;border-radius:10px;border:0;background:var(--am);color:#2a1d00;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px}.cad-pop .go svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.cad-pop .go.sec{background:#eef2fa;color:#1d2433}
.cad-pop .nt{font-size:11.5px;color:#6b7385;line-height:1.45;margin:6px 2px 0}
.cad-opt select{height:32px;border-radius:99px;border:1px solid #d7dde9;background:#fff;color:#1d2433;font-size:12.5px;font-weight:600;padding:0 10px;box-shadow:0 4px 14px -8px rgba(20,40,80,.4);max-width:170px}
.cad-chip.s0.on{background:#334155;border-color:#334155}.cad-chip.s2{border-color:#e7b94c}.cad-chip.s2.on{background:${NEWC};border-color:${NEWC};color:#2a1d00}.cad-chip.s1{border-color:#f1a3a7}.cad-chip.s1.on{background:${DEMC};border-color:${DEMC};color:#fff}
.cad-len{flex-direction:row}.cad-len label{display:flex;align-items:center;gap:6px}.cad-len input+span,.cad-len .u{color:#7a8399;font-weight:600}
.cad-info{position:absolute;left:12px;bottom:52px;background:rgba(13,23,48,.9);color:#fff;font-size:12.5px;padding:7px 12px;border-radius:10px;pointer-events:none;font-variant-numeric:tabular-nums;animation:cad-pop .2s both}
.cad-modeb{position:absolute;right:12px;bottom:12px;display:flex;gap:6px;pointer-events:none}.cad-modeb span{background:rgba(13,23,48,.82);color:#e8eefc;font-size:11.5px;font-weight:600;padding:5px 10px;border-radius:99px}
.cad-kp.k3{grid-template-columns:1fr 1fr 1fr}.cad-kp.k3 b{font-size:16px}
.cad-side .sec{margin:14px 0 6px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#9fb0d8;font-weight:700}
.cad-sm{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-bottom:10px}.cad-sm button{height:34px;border-radius:9px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#e8eefc;font-size:12px;font-weight:600}.cad-sm button.on{border-color:var(--am);background:rgba(242,177,60,.18);color:var(--am)}
.cad-sm button.s1.on{border-color:#ff8f95;background:rgba(229,72,84,.22);color:#ffb3b7}.cad-sm button.s2.on{border-color:${NEWC};background:rgba(244,183,63,.25);color:#ffd884}
@media(max-width:860px){.cad-pop{right:8px;left:8px;width:auto;top:50px;max-height:calc(100% - 140px)}.cad-info{bottom:48px}.cad-modeb{display:none}}
`;
  function css() { if (cssDone) return; cssDone = true; const s = document.createElement('style'); s.id = 'cad-css'; s.textContent = CSS + CSS2; document.head.appendChild(s); }
  const prevOp = k => { const d = { w: [{ i: 'x', x: -60, y: 0, X: 60, Y: 0, t: 14 }], o: [{ k, w: 'x', p: 60, l: Math.min(OP[k].l, 100), f: 0 }], s: [], q: [], t: [], r: [] }; return `<svg class="cdc-cad" viewBox="-70 -42 140 84"><style>${SCSS}</style>${draw(d, { z: 1, auto: false, mode: 'sf' })}</svg>`; };
  const prevSym = k => { const d = SYM[k], m = Math.max(d.w, d.h), sx = d.w / m * .92, sy = d.h / m * .92; return `<svg class="cdc-cad" viewBox="-60 -60 120 120"><style>${SCSS}</style><g class="sy" style="--c:${d.c || INK}" transform="scale(${sx * 1.1} ${sy * 1.1})">${symD(d, { w: d.w, h: d.h })}</g></svg>`; };

  function open(plan, opts) {
    const before = document.querySelectorAll('.cad').length;
    try { return openRaw(plan, opts); } catch (e) {
      document.querySelectorAll('.cad').forEach((n, i) => { if (i >= before) n.remove(); }); document.documentElement.classList.remove('cad-lock');
      if (opts && opts.onError) opts.onError(e); else console.error(e); return null;
    }
  }
  function openRaw(plan, opts) {
    opts = opts || {}; norm(plan); css(); const edit = !!opts.edit;
    const el = document.createElement('div'); el.className = 'cad' + (edit ? '' : ' ro');
    el.innerHTML = `<div class="cad-top"><button class="cad-b" data-a="close" aria-label="Chiudi">${I(IC.x)}</button><input class="nm" id="cad-nm" value="${esc(plan.n || '')}" placeholder="Nome piantina (es. Piano terra)" ${edit ? '' : 'disabled'} aria-label="Nome piantina">
      <button class="cad-b e" data-a="undo" aria-label="Annulla" title="Annulla (Ctrl+Z)">${I(IC.undo)}</button><button class="cad-b e" data-a="redo" aria-label="Ripeti" title="Ripeti (Ctrl+Y)">${I(IC.redo)}</button><span class="cad-sep m-h"></span>
      <button class="cad-b m-h" data-a="zout" aria-label="Riduci">${I(IC.zout)}</button><span class="cad-zl m-h" id="cad-zl">100%</span><button class="cad-b m-h" data-a="zin" aria-label="Ingrandisci">${I(IC.zin)}</button><button class="cad-b" data-a="fit" aria-label="Inquadra tutto" title="Inquadra tutto (0)">${I(IC.fit)}</button><button class="cad-b cad-sumb" data-a="sum" aria-label="Riepilogo e misure">${I(IC.list)}</button><span class="cad-sep m-h"></span>
      <button class="cad-b" data-pm="vw" aria-label="Vista e livelli" title="Vista, livelli, stato di fatto / progetto">${I(IC.layers)}</button><button class="cad-b e" data-pm="snp" aria-label="Aggancio e griglia" title="Aggancio, griglia, angoli">${I(IC.mag)}</button><button class="cad-b m-h" data-a="auto" aria-label="Quote automatiche" title="Misure sulle pareti">${I(IC.dims)}</button><button class="cad-b" data-pm="exp" aria-label="Stampa ed esporta" title="Stampa in scala, PDF, PNG, DXF">${I(IC.exp)}</button>
      <button class="cad-b done" data-a="close">${I(IC.ok)}<span>Fatto</span></button></div>
      <div class="cad-main"><div class="cad-tools">${TOOLS.map(([k, n, h]) => `<button class="cad-b${k === 'sel' || k === 'pan' || k === 'meas' ? '' : ' e'}" data-tool="${k}" data-t="${n} (${h})" aria-label="${n}">${I(IC[k])}<kbd>${h}</kbd></button>`).join('')}</div>
      <div class="cad-stage" id="cad-stage"><svg class="cad-svg" id="cad-svg" preserveAspectRatio="none"></svg><div class="cad-sb" id="cad-sb"></div><div id="cad-ui"></div><div id="cad-pop"></div><div id="cad-info"></div><div class="cad-modeb" id="cad-modeb"></div><div class="cad-hint"><span id="cad-hint"></span></div></div>
      <aside class="cad-side" id="cad-side"></aside></div>`;
    document.body.appendChild(el); document.documentElement.classList.add('cad-lock');
    const $ = s => el.querySelector(s), $$ = s => [...el.querySelectorAll(s)], svg = $('#cad-svg'), stage = $('#cad-stage'), side = $('#cad-side'), ui = $('#cad-ui');
    const st = { tool: 'sel', opk: 'p', symk: 'wc', sel: new Set(), draw: null, drag: null, hover: null, hsn: null, grid: true, snap: true, pol: 15, auto: plan.opt.auto !== false, wm: 't12', al: 'int', ns: 0, attach: true, multi: false, gs: 0, ptrs: new Map(), hist: [], hi: -1, W: 800, H: 600, v: plan.v ? { ...plan.v } : null, pan: null, pinch: null, down: null, box: null, qa: null, ma: null, mb: null, fly: '', pop: '', sumOpen: false, room: { l: '4,00', p: '3,00', n: '' }, space: false, raf: 0, clip: null, pn: 0, info: '', exp: { paper: 'A4', orient: '', scale: 0 }, sp: null };
    const snapJson = () => JSON.stringify({ w: plan.w, o: plan.o, s: plan.s, q: plan.q, t: plan.t, r: plan.r, h: plan.h, ly: plan.ly, mode: plan.mode, opt: plan.opt });
    st.hist.push(snapJson()); st.hi = 0;
    const px = () => 1 / st.v.z, gstep = () => st.gs || (st.v.z >= .8 ? 5 : st.v.z >= .3 ? 10 : st.v.z >= .12 ? 25 : 50);
    const world = e => { const r = svg.getBoundingClientRect(); return [st.v.x + (e.clientX - r.left) / st.v.z, st.v.y + (e.clientY - r.top) / st.v.z]; };
    const rn = v => Math.round(v * 10) / 10, nid = p => p + uid(), key = (t, i) => t + ':' + i, ang = (a, b) => { let d = Math.atan2(-(b[1] - a[1]), b[0] - a[0]) * 180 / Math.PI; return d < 0 ? d + 360 : d; };
    const find = (t, i) => plan[t].find(x => x.i === i) || null;
    const selItems = () => [...st.sel].map(k => { const [t, i] = k.split(':'); const o = find(t, i); return o ? { t, i, o } : null; }).filter(Boolean);
    const one = () => { if (st.sel.size !== 1) return null; return selItems()[0] || null; };
    const layerOfItem = (t, o) => t === 's' ? layerOf(o) : t;
    const pickable = (t, o) => { const l = layerOfItem(t, o); return shown(plan, l, o.s || 0, plan.mode) && !plan.ly.l[l]; };
    const flash = (m, bad) => { $('#cad-hint').textContent = m; if (bad && opts.toast) opts.toast(m); };
    const sps = () => st.sp || (st.sp = snapPoints(plan));
    function commit() { st.sp = null; const s = snapJson(); if (s === st.hist[st.hi]) return; st.hist = st.hist.slice(0, st.hi + 1); st.hist.push(s); if (st.hist.length > 80) st.hist.shift(); st.hi = st.hist.length - 1; if (opts.onChange) opts.onChange(plan); hud(); }
    function restore(i) { if (i < 0 || i >= st.hist.length) return; st.hi = i; st.sp = null; const d = JSON.parse(st.hist[i]); Object.assign(plan, d); norm(plan); st.sel.clear(); st.draw = null; if (opts.onChange) opts.onChange(plan); panel(); render(); }
    function fit() {
      const b = bbox(plan), W = st.W, H = st.H; if (!b) { const z = Math.min(W / 1000, H / 700); st.v = { z, x: -(W / z - 1000) / 2, y: -(H / z - 700) / 2 }; return; }
      const pad = 90, bw = b[2] - b[0] + pad * 2, bh = b[3] - b[1] + pad * 2, z = Math.min(W / bw, H / bh, 2); st.v = { z, x: b[0] - pad - (W / z - bw) / 2, y: b[1] - pad - (H / z - bh) / 2 };
    }
    const zoomAt = (cx, cy, k) => { const v = st.v, z = Math.max(.04, Math.min(8, v.z * k)), wx = v.x + cx / v.z, wy = v.y + cy / v.z; st.v = { z, x: wx - cx / z, y: wy - cy / z }; render(); };
    const sched = () => { if (st.raf) return; st.raf = requestAnimationFrame(() => { st.raf = 0; render(); }); };

    /* aggancio: punti (estremi, medi, intersezioni, spigoli), polare, griglia, allineamento */
    function snapPt(pw, o) {
      o = o || {}; const x = pw[0], y = pw[1], tol = (o.touch ? 16 : 11) * px(); let best = null, bd = tol; const SP = o.sp || sps(); st.hsn = null;
      if (st.snap && !o.free) SP.forEach(p => { const d = dist(x, y, p.x, p.y); if (d < bd && !(o.ref && dist(p.x, p.y, o.ref[0], o.ref[1]) < .5)) { bd = d; best = p; } });
      if (best) { st.hsn = { x: best.x, y: best.y, k: best.k }; return { x: best.x, y: best.y, k: best.k }; }
      const g = gstep();
      if (o.ref) {
        const dx = x - o.ref[0], dy = y - o.ref[1], L = Math.hypot(dx, dy); if (L < 1) return { x: o.ref[0], y: o.ref[1] };
        let a = Math.atan2(dy, dx); const stp = (o.strict ? 90 : st.pol) * Math.PI / 180; if (stp > 0) { const na = Math.round(a / stp) * stp; if (o.strict || st.pol === 90 || Math.abs(na - a) < .09) a = na; }
        const LL = st.snap ? Math.max(g, Math.round(L / g) * g) : L; return { x: rn(o.ref[0] + Math.cos(a) * LL), y: rn(o.ref[1] + Math.sin(a) * LL) };
      }
      let rx = st.snap ? Math.round(x / g) * g : rn(x), ry = st.snap ? Math.round(y / g) * g : rn(y), gl = [];
      if (st.snap && !o.free) { let gx = null, gy = null; SP.forEach(p => { if (Math.abs(p.x - x) < tol * .7 && (!gx || Math.abs(p.x - x) < Math.abs(gx.x - x))) gx = p; if (Math.abs(p.y - y) < tol * .7 && (!gy || Math.abs(p.y - y) < Math.abs(gy.y - y))) gy = p; }); if (gx) { rx = gx.x; gl.push([gx.x, gx.y, gx.x, ry]); } if (gy) { ry = gy.y; gl.push([gy.x, gy.y, rx, gy.y]); } if (gl.length) st.hsn = { gl }; }
      return { x: rx, y: ry };
    }
    function nearWall(pw, extra) { let best = null; plan.w.forEach(w => { if (!pickable('w', w)) return; const r = segDist(pw[0], pw[1], w.x, w.y, w.X, w.Y); if (r.d <= w.t / 2 + extra && (!best || r.d < best.d)) best = { w, d: r.d, pos: r.t * wLen(w) }; }); return best; }
    function moveV(from, to) {
      const nr = (x, y) => Math.abs(x - from[0]) < .6 && Math.abs(y - from[1]) < .6;
      plan.w.forEach(w => { if (nr(w.x, w.y)) { w.x = to[0]; w.y = to[1]; } if (nr(w.X, w.Y)) { w.X = to[0]; w.Y = to[1]; } });
      plan.r.forEach(r => r.p.forEach(p => { if (nr(p[0], p[1])) { p[0] = to[0]; p[1] = to[1]; } }));
      plan.q.forEach(q => { if (nr(q.x, q.y)) { q.x = to[0]; q.y = to[1]; } if (nr(q.X, q.Y)) { q.X = to[0]; q.Y = to[1]; } });
      fixOps();
    }
    const fixOps = () => plan.o.forEach(o => { const w = find('w', o.w); if (w) o.p = Math.max(Math.min(o.l / 2, wLen(w) / 2), Math.min(wLen(w) - Math.min(o.l / 2, wLen(w) / 2), o.p)); });

    /* modifica del modello */
    const nRoom = () => { let n = plan.r.length + 1; while (plan.r.some(r => r.n === 'Locale ' + n)) n++; return 'Locale ' + n; };
    const WTt = () => (WT[st.wm] || WT.t12).t;
    function addW(a, b) { const w = { i: nid('w'), x: a[0], y: a[1], X: b[0], Y: b[1], t: WTt(), m: st.wm }; if (st.ns) w.s = st.ns; plan.w.push(w); return w; }
    function addRoom(pts, name) { const r = { i: nid('r'), n: name || nRoom(), p: pts.map(p => [rn(p[0]), rn(p[1])]) }; plan.r.push(r); return r; }
    function loopFrom(P, t, al) {
      if (al === 'int') return { ax: offsetLoop(P, t, 'int'), room: P.map(p => [p[0], p[1]]) };
      if (al === 'asse') return { ax: P.map(p => [p[0], p[1]]), room: offsetLoop(P, t, 'est') }; const ax = offsetLoop(P, t, 'est'); return { ax, room: offsetLoop(ax, t, 'est') };
    }
    function rectRoom(x1, y1, x2, y2, name) {
      const a = [Math.min(x1, x2), Math.min(y1, y2)], b = [Math.max(x1, x2), Math.max(y1, y2)], P = [[a[0], a[1]], [b[0], a[1]], [b[0], b[1]], [a[0], b[1]]], L = loopFrom(P, WTt(), st.al);
      for (let i = 0; i < 4; i++) addW(L.ax[i], L.ax[(i + 1) % 4]); return addRoom(L.room, name);
    }
    function delSel() {
      const it = selItems(); if (!it.length) return; const ids = {}; it.forEach(x => { (ids[x.t] = ids[x.t] || new Set()).add(x.i); });
      Object.keys(ids).forEach(t => { plan[t] = plan[t].filter(x => !ids[t].has(x.i)); }); if (ids.w) plan.o = plan.o.filter(o => !ids.w.has(o.w));
      st.sel.clear(); commit(); panel(); render();
    }
    function closeLoop(d) {
      const n = d.pts.length, L = loopFrom(d.pts, WTt(), st.al); const ws = d.wids.slice(-n);
      if (ws.length === n && st.al !== 'asse') ws.forEach((id, k) => { const w = find('w', id); if (w) { w.x = L.ax[k][0]; w.y = L.ax[k][1]; w.X = L.ax[(k + 1) % n][0]; w.Y = L.ax[(k + 1) % n][1]; } });
      const r = addRoom(L.room); st.sel = new Set([key('r', r.i)]); return r;
    }
    function finishDraw(close) {
      const d = st.draw; if (!d) return; st.draw = null; st.info = '';
      if (st.tool === 'area') { if (d.pts.length >= 3) { const r = addRoom(d.pts); st.sel = new Set([key('r', r.i)]); st.tool = 'sel'; commit(); } }
      else if (close && d.pts.length >= 3) { closeLoop(d); st.tool = 'sel'; commit(); }
      else if (d.ws > 0) commit();
      st.sp = null; toolUI(); render();
    }
    function addPoint(p, byClick) {
      const d = st.draw, t = st.tool, last = d.pts[d.pts.length - 1]; if (dist(p[0], p[1], last[0], last[1]) < 4) return false;
      const first = d.pts[0], closes = d.pts.length >= 3 && dist(p[0], p[1], first[0], first[1]) < (byClick ? 14 * px() : 3);
      if (closes) { p[0] = first[0]; p[1] = first[1]; }
      if (t === 'wall') { const w = addW(last, p); d.wids.push(w.i); d.ws++; st.sp = null; }
      if (closes) { finishDraw(true); return true; } d.pts.push(p); d.cur = p; render(); return true;
    }

    /* selezione */
    function itemBox(t, o) {
      if (t === 'w') { const r = o.t / 2; return [Math.min(o.x, o.X) - r, Math.min(o.y, o.Y) - r, Math.max(o.x, o.X) + r, Math.max(o.y, o.Y) + r]; }
      if (t === 'o') { const q = opPoint(plan, o); return q ? [q.x - 3, q.y - 3, q.x + 3, q.y + 3] : [0, 0, 0, 0]; }
      if (t === 's') { const r = Math.max(o.w, o.h) / 2; return [o.x - r, o.y - r, o.x + r, o.y + r]; }
      if (t === 'q') return [Math.min(o.x, o.X), Math.min(o.y, o.Y), Math.max(o.x, o.X), Math.max(o.y, o.Y)];
      if (t === 't') return [o.x, o.y - 14, o.x + (o.s || '').length * 8, o.y];
      const xs = o.p.map(p => p[0]), ys = o.p.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    }
    function pick(pw, tol) {
      const x = pw[0], y = pw[1];
      for (let k = plan.s.length - 1; k >= 0; k--) { const s = plan.s[k]; if (!pickable('s', s)) continue; const a = -(s.a || 0) * Math.PI / 180, dx = x - s.x, dy = y - s.y, lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a); if (Math.abs(lx) <= s.w / 2 + tol * .5 && Math.abs(ly) <= s.h / 2 + tol * .5) return { t: 's', i: s.i }; }
      for (let k = plan.o.length - 1; k >= 0; k--) { const o = plan.o[k]; if (!pickable('o', o)) continue; const q = opPoint(plan, o); if (!q) continue; const dx = x - q.x, dy = y - q.y, al = dx * q.f.ux + dy * q.f.uy, pe = dx * q.f.nx + dy * q.f.ny; if (Math.abs(al) <= o.l / 2 + tol * .4 && Math.abs(pe) <= q.w.t / 2 + tol) return { t: 'o', i: o.i }; }
      for (let k = plan.t.length - 1; k >= 0; k--) { const t = plan.t[k]; if (!pickable('t', t)) continue; const fs = 13 / st.v.z * ([1, 1.35, 1.9][(t.z || 1) - 1] || 1); if (x >= t.x - tol && x <= t.x + t.s.length * fs * .6 + tol && y >= t.y - fs - tol && y <= t.y + tol) return { t: 't', i: t.i }; }
      for (const q of plan.q) { if (!pickable('q', q)) continue; const L = dist(q.x, q.y, q.X, q.Y) || 1, nx = -(q.Y - q.y) / L, ny = (q.X - q.x) / L, d = q.d || 0; if (segDist(x, y, q.x + nx * d, q.y + ny * d, q.X + nx * d, q.Y + ny * d).d <= tol) return { t: 'q', i: q.i }; }
      let bw = null, bd = 1e9; plan.w.forEach(w => { if (!pickable('w', w)) return; const r = segDist(x, y, w.x, w.y, w.X, w.Y); if (r.d <= w.t / 2 + tol && r.d < bd) { bd = r.d; bw = w; } }); if (bw) return { t: 'w', i: bw.i };
      for (let k = plan.r.length - 1; k >= 0; k--) if (pickable('r', plan.r[k]) && inPoly(x, y, plan.r[k].p)) return { t: 'r', i: plan.r[k].i };
      return null;
    }
    function handles() {
      const o = one(); if (!o || !edit) return []; const s = o.o, t = o.t;
      if (t === 'w') return [{ x: s.x, y: s.y, o: [s.X, s.Y], k: 'a' }, { x: s.X, y: s.Y, o: [s.x, s.y], k: 'b' }];
      if (t === 'q') return [{ x: s.x, y: s.y, k: 'qa' }, { x: s.X, y: s.Y, k: 'qb' }];
      if (t === 'r') return s.p.map((p, i) => ({ x: p[0], y: p[1], k: 'v', n: i }));
      if (t === 's') { const a = (s.a || 0) * Math.PI / 180, r = s.h / 2 + 28 / st.v.z; return [{ x: s.x + Math.sin(a) * r, y: s.y - Math.cos(a) * r, k: 'rot', c: [s.x, s.y] }]; }
      return [];
    }
    const keyPts = (t, o) => t === 'w' ? [[o.x, o.y], [o.X, o.Y]] : t === 's' || t === 't' ? [[o.x, o.y]] : t === 'q' ? [[o.x, o.y], [o.X, o.Y]] : t === 'r' ? o.p.map(p => [p[0], p[1]]) : [];
    function snapExcl() { const ex = new Set(st.sel), P = { w: plan.w.filter(x => !ex.has(key('w', x.i))), r: plan.r.filter(x => !ex.has(key('r', x.i))), q: plan.q.filter(x => !ex.has(key('q', x.i))) }; return snapPoints(P); }
    function beginSelect(pw, e) {
      const touch = e.pointerType === 'touch', tol = (touch ? 16 : 9) * px(), add = e.shiftKey || e.ctrlKey || e.metaKey || st.multi;
      for (const h of handles()) if (dist(pw[0], pw[1], h.x, h.y) <= tol * 1.15) { st.drag = { k: h.k === 'qa' || h.k === 'qb' || h.k === 'rot' ? h.k : 'pt', from: [h.x, h.y], ref: h.o, c: h.c, moved: false, sp: snapExcl() }; return; }
      const hit = pick(pw, tol);
      if (!hit) { if (edit && (!touch || st.multi)) st.box = { a: pw, b: pw, add, moved: false }; else { st.pan = { sx: e.clientX, sy: e.clientY, vx: st.v.x, vy: st.v.y }; svg.classList.add('grab'); } if (!add && !st.box) { st.sel.clear(); panel(); } render(); return; }
      const k = key(hit.t, hit.i);
      if (add) { if (st.sel.has(k)) st.sel.delete(k); else st.sel.add(k); st.down.noMove = true; panel(); render(); return; }
      if (!st.sel.has(k)) { st.sel = new Set([k]); panel(); }
      if (!edit) { render(); return; }
      const it = selItems(), single = it.length === 1 ? it[0] : null;
      st.drag = { k: single && (single.t === 'w' || single.t === 'o') ? single.t : 'move', start: pw, moved: false, base: it.map(x => ({ t: x.t, i: x.i, o: JSON.parse(JSON.stringify(x.o)) })), sp: snapExcl() }; render();
    }
    function doDrag(pw, e) {
      const d = st.drag; if (!d) return; const one1 = one(), s = one1 && one1.o; if (!d.moved && d.start && dist(pw[0], pw[1], d.start[0], d.start[1]) < 3 * px()) return; d.moved = true; const g = gstep();
      if (d.k === 'pt') { const n = snapPt(pw, { ref: d.ref, strict: e.shiftKey, sp: d.sp }); moveV(d.from, [n.x, n.y]); d.from = [n.x, n.y]; if (d.ref) st.info = m2(dist(d.ref[0], d.ref[1], n.x, n.y)) + ' m · ' + Math.round(ang(d.ref, [n.x, n.y])) + '°'; }
      else if (d.k === 'qa' || d.k === 'qb') { const n = snapPt(pw, { sp: d.sp }); if (d.k === 'qa') { s.x = n.x; s.y = n.y; } else { s.X = n.x; s.Y = n.y; } }
      else if (d.k === 'rot' && s) { let a = Math.atan2(pw[1] - d.c[1], pw[0] - d.c[0]) * 180 / Math.PI + 90; if (!e.altKey) a = Math.round(a / 15) * 15; s.a = ((Math.round(a) % 360) + 360) % 360; st.info = s.a + '°'; }
      else if (d.k === 'w' && s) { let dx = pw[0] - d.start[0], dy = pw[1] - d.start[1]; if (st.snap) { dx = Math.round(dx / g) * g; dy = Math.round(dy / g) * g; } const b = d.base[0].o; moveV([s.x, s.y], [b.x + dx, b.y + dy]); moveV([s.X, s.Y], [b.X + dx, b.Y + dy]); }
      else if (d.k === 'o' && s) { const nw = nearWall(pw, 30 * px() + 10); if (nw) { s.w = nw.w.i; s.p = Math.round(Math.max(s.l / 2, Math.min(wLen(nw.w) - s.l / 2, nw.pos))); const q = opPoint(plan, s); st.info = 'dallo spigolo: ' + m2(s.p - s.l / 2) + ' m · all’altro lato: ' + m2(wLen(nw.w) - s.p - s.l / 2) + ' m'; } }
      else if (d.k === 'move') {
        let dx = pw[0] - d.start[0], dy = pw[1] - d.start[1];
        if (st.snap) { let bc = null, bd = 12 * px(); d.base.forEach(b => keyPts(b.t, b.o).forEach(k => { d.sp.forEach(p => { const cx = p.x - (k[0] + dx), cy = p.y - (k[1] + dy), dd = Math.hypot(cx, cy); if (dd < bd) { bd = dd; bc = [cx, cy]; } }); })); if (bc) { dx += bc[0]; dy += bc[1]; } else { dx = Math.round(dx / g) * g; dy = Math.round(dy / g) * g; } }
        d.base.forEach(b => { const o = find(b.t, b.i); if (!o) return; applyMove(o, b.t, b.o, dx, dy); }); st.info = 'Δx ' + m2(dx) + ' · Δy ' + m2(dy) + ' m';
      }
      sched();
    }
    function applyMove(o, t, b, dx, dy) {
      if (t === 'w') { o.x = rn(b.x + dx); o.y = rn(b.y + dy); o.X = rn(b.X + dx); o.Y = rn(b.Y + dy); } else if (t === 's' || t === 't') { o.x = rn(b.x + dx); o.y = rn(b.y + dy); }
      else if (t === 'q') { o.x = rn(b.x + dx); o.y = rn(b.y + dy); o.X = rn(b.X + dx); o.Y = rn(b.Y + dy); } else if (t === 'r') o.p = b.p.map(p => [rn(p[0] + dx), rn(p[1] + dy)]);
    }
    function boxSelect(b) {
      const x1 = Math.min(b.a[0], b.b[0]), y1 = Math.min(b.a[1], b.b[1]), x2 = Math.max(b.a[0], b.b[0]), y2 = Math.max(b.a[1], b.b[1]), win = b.b[0] >= b.a[0], out = b.add ? new Set(st.sel) : new Set();
      ['w', 'o', 's', 'q', 't', 'r'].forEach(t => plan[t].forEach(o => { if (!pickable(t, o)) return; const bb = itemBox(t, o), inside = bb[0] >= x1 && bb[2] <= x2 && bb[1] >= y1 && bb[3] <= y2, cross = !(bb[2] < x1 || bb[0] > x2 || bb[3] < y1 || bb[1] > y2); if (win ? inside : (t === 'r' ? inside : cross)) out.add(key(t, o.i)); }));
      st.sel = out;
    }

    /* trasformazioni sulla selezione */
    function selCenter(it) { let a = [1e9, 1e9, -1e9, -1e9]; it.forEach(x => { if (x.t === 'o') return; const b = itemBox(x.t, x.o); a = [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])]; }); return a[0] > a[2] ? null : [(a[0] + a[2]) / 2, (a[1] + a[3]) / 2]; }
    function xform(fn, fa, mirror) {
      const it = selItems(); if (!it.length) return; const ws = new Set(it.filter(x => x.t === 'w').map(x => x.i));
      it.forEach(({ t, o }) => {
        const P = (x, y) => { const r = fn(x, y); return [rn(r[0]), rn(r[1])]; };
        if (t === 'w') { const a = P(o.x, o.y), b = P(o.X, o.Y); o.x = a[0]; o.y = a[1]; o.X = b[0]; o.Y = b[1]; } else if (t === 's') { const a = P(o.x, o.y); o.x = a[0]; o.y = a[1]; o.a = ((Math.round(fa(o.a || 0)) % 360) + 360) % 360; }
        else if (t === 't') { const a = P(o.x, o.y); o.x = a[0]; o.y = a[1]; } else if (t === 'q') { const a = P(o.x, o.y), b = P(o.X, o.Y); o.x = a[0]; o.y = a[1]; o.X = b[0]; o.Y = b[1]; if (mirror) o.d = -(o.d || 0); } else if (t === 'r') o.p = o.p.map(p => P(p[0], p[1]));
      });
      if (mirror) plan.o.forEach(o => { if (ws.has(o.w)) o.f = (o.f || 0) ^ 1; }); commit(); panel(); render();
    }
    const moveSel = (dx, dy) => xform((x, y) => [x + dx, y + dy], a => a);
    function rotSel(deg) { const c = selCenter(selItems()); if (!c) return; const r = deg * Math.PI / 180, co = Math.cos(r), si = Math.sin(r); xform((x, y) => [c[0] + (x - c[0]) * co - (y - c[1]) * si, c[1] + (x - c[0]) * si + (y - c[1]) * co], a => a + deg); }
    function mirSel(horiz) { const c = selCenter(selItems()); if (!c) return; if (horiz) xform((x, y) => [2 * c[0] - x, y], a => 180 - a, true); else xform((x, y) => [x, 2 * c[1] - y], a => -a, true); }
    function copySel() { const it = selItems(); if (!it.length) return; const ws = new Set(it.filter(x => x.t === 'w').map(x => x.i)), clip = { w: [], o: [], s: [], q: [], t: [], r: [] }; it.forEach(x => clip[x.t].push(JSON.parse(JSON.stringify(x.o)))); plan.o.forEach(o => { if (ws.has(o.w) && !clip.o.some(c => c.i === o.i)) clip.o.push(JSON.parse(JSON.stringify(o))); }); st.clip = clip; st.pn = 0; }
    function pasteClip(off) {
      const c = st.clip; if (!c) return; st.pn++; const d = (off == null ? 40 * st.pn : off), map = {}, sel = new Set(); const nid2 = (p, o) => { const n = nid(p); map[o.i] = n; return n; };
      c.w.forEach(w => { const n = JSON.parse(JSON.stringify(w)); n.i = nid2('w', w); n.x += d; n.y += d; n.X += d; n.Y += d; plan.w.push(n); sel.add(key('w', n.i)); });
      c.o.forEach(o => { if (!map[o.w]) return; const n = JSON.parse(JSON.stringify(o)); n.i = nid('o'); n.w = map[o.w]; plan.o.push(n); if (!c.w.length || c.o.length) { } });
      c.s.forEach(s => { const n = JSON.parse(JSON.stringify(s)); n.i = nid('s'); n.x += d; n.y += d; plan.s.push(n); sel.add(key('s', n.i)); });
      c.q.forEach(q => { const n = JSON.parse(JSON.stringify(q)); n.i = nid('q'); n.x += d; n.y += d; n.X += d; n.Y += d; plan.q.push(n); sel.add(key('q', n.i)); });
      c.t.forEach(t => { const n = JSON.parse(JSON.stringify(t)); n.i = nid('t'); n.x += d; n.y += d; plan.t.push(n); sel.add(key('t', n.i)); });
      c.r.forEach(r => { const n = JSON.parse(JSON.stringify(r)); n.i = nid('r'); n.p = n.p.map(p => [p[0] + d, p[1] + d]); plan.r.push(n); sel.add(key('r', n.i)); });
      st.sel = sel; commit(); panel(); render();
    }
    function splitWall(w, d) {
      const L = wLen(w); if (d < 10 || d > L - 10) return; const f = wFrame(w), m = [rn(w.x + f.ux * d), rn(w.y + f.uy * d)], n = JSON.parse(JSON.stringify(w)); n.i = nid('w'); n.x = m[0]; n.y = m[1]; w.X = m[0]; w.Y = m[1]; plan.w.push(n);
      plan.o.forEach(o => { if (o.w === w.i && o.p > d) { o.w = n.i; o.p -= d; } }); fixOps(); st.sel = new Set([key('w', w.i), key('w', n.i)]); commit(); panel(); render();
    }
    function joinCorner() {
      const it = selItems().filter(x => x.t === 'w'); if (it.length !== 2) return; const [a, b] = [it[0].o, it[1].o], r = lineInt([a.x, a.y], [a.X - a.x, a.Y - a.y], [b.x, b.y], [b.X - b.x, b.Y - b.y]); if (!r) { flash('Le due pareti sono parallele', true); return; }
      const P = [rn(r[0]), rn(r[1])], mv = w => { if (dist(w.x, w.y, P[0], P[1]) <= dist(w.X, w.Y, P[0], P[1])) { w.x = P[0]; w.y = P[1]; } else { w.X = P[0]; w.Y = P[1]; } }; mv(a); mv(b); fixOps(); commit(); panel(); render();
    }
    const setState = s => { selItems().forEach(({ t, o }) => { if (t === 'w' || t === 'o' || t === 's') { if (s) o.s = s; else delete o.s; } }); commit(); panel(); render(); };

    /* clic con lo strumento attivo */
    function attachSym(pw, d, k) {
      let best = null; plan.w.forEach(w => { if (!pickable('w', w)) return; const r = segDist(pw[0], pw[1], w.x, w.y, w.X, w.Y), lim = w.t / 2 + Math.max(d.h, 20) + 22 * px(); if (r.d <= lim && (!best || r.d < best.r.d)) best = { w, r }; });
      if (!best) return null; const { w, r } = best, f = wFrame(w), px0 = w.x + f.ux * r.t * f.L, py0 = w.y + f.uy * r.t * f.L, side = ((pw[0] - px0) * f.nx + (pw[1] - py0) * f.ny) >= 0 ? 1 : -1, nx = f.nx * side, ny = f.ny * side, off = w.t / 2 + d.h / 2;
      return { x: rn(px0 + nx * off), y: rn(py0 + ny * off), a: ((Math.round(Math.atan2(-nx, ny) * 180 / Math.PI) % 360) + 360) % 360 };
    }
    function symPlace(pw, e) {
      const d = SYM[st.symk], s = snapPt(pw, { free: e && e.altKey }); let r = { x: s.x, y: s.y, a: 0 }; if (st.attach && d.g !== 'Strutture' && !(e && e.altKey)) { const at = attachSym(pw, d, st.symk); if (at) r = at; } return r;
    }
    function toolClick(pw, e) {
      const t = st.tool, touch = e.pointerType === 'touch';
      if (t === 'wall' || t === 'area') {
        const last = st.draw && st.draw.pts[st.draw.pts.length - 1], s = snapPt(pw, { ref: t === 'wall' && last ? last : null, strict: e.shiftKey, touch }), p = [s.x, s.y];
        if (!st.draw) { st.draw = { pts: [p], cur: p, ws: 0, wids: [] }; optUI(); panel(); render(); return; } addPoint(p, true);
      } else if (t === 'op') {
        const nw = nearWall(pw, 18 * px() + 8); if (!nw) return; const d = OP[st.opk], L = wLen(nw.w), l = Math.min(d.l, Math.max(30, L - 10)), pos = Math.round(Math.max(l / 2, Math.min(L - l / 2, nw.pos)));
        const o = { i: nid('o'), k: st.opk, w: nw.w.i, p: pos, l, h: d.h, sl: d.sl, f: 0 }; if (st.ns) o.s = st.ns; plan.o.push(o); st.sel = new Set([key('o', o.i)]); commit(); panel(); render();
      } else if (t === 'sym') {
        const r = symPlace(pw, e), d = SYM[st.symk], o = { i: nid('s'), k: st.symk, x: r.x, y: r.y, a: r.a, w: d.w, h: d.h }; if (st.ns) o.s = st.ns; plan.s.push(o); st.sel = new Set([key('s', o.i)]); st.tool = 'sel'; st.fly = ''; commit(); toolUI(); panel(); render();
      } else if (t === 'dim') {
        const s = snapPt(pw, { touch }); if (!st.qa) { st.qa = [s.x, s.y]; render(); return; } if (dist(st.qa[0], st.qa[1], s.x, s.y) < 5) return;
        const q = { i: nid('q'), x: st.qa[0], y: st.qa[1], X: s.x, Y: s.y, d: 40 }; plan.q.push(q); st.qa = null; st.sel = new Set([key('q', q.i)]); commit(); panel(); render();
      } else if (t === 'meas') {
        const s = snapPt(pw, { touch }); if (!st.ma || st.mb) { st.ma = [s.x, s.y]; st.mb = null; } else st.mb = [s.x, s.y]; render();
      } else if (t === 'detect') {
        const r = detect(plan, pw[0], pw[1]); if (r.err) { flash(r.err, true); return; } const n = addRoom(r.pts); st.sel = new Set([key('r', n.i)]); commit(); panel(); render(); flash('Locale riconosciuto: ' + mq(area(n.p)) + ' m² netti');
      } else if (t === 'txt') {
        const s = snapPt(pw, { touch }), o = { i: nid('t'), x: s.x, y: s.y, s: 'Testo', z: 1 }; plan.t.push(o); st.sel = new Set([key('t', o.i)]); st.tool = 'sel'; commit(); toolUI(); panel(); render(); const f = $('[data-f=ts]'); if (f) { f.focus(); f.select(); }
      }
    }
    svg.addEventListener('pointerdown', e => {
      if (e.button === 2 && e.pointerType === 'mouse') { try { svg.setPointerCapture(e.pointerId); } catch { } st.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); st.pan = { sx: e.clientX, sy: e.clientY, vx: st.v.x, vy: st.v.y }; st.down = { cx: e.clientX, cy: e.clientY, moved: true }; svg.classList.add('grab'); return; }
      try { svg.setPointerCapture(e.pointerId); } catch { }
      st.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (st.fly && edit) { st.fly = ''; flyUI(); } if (st.sumOpen) { st.sumOpen = false; panel(); } if (st.pop) { st.pop = ''; popUI(); }
      if (st.ptrs.size === 2) { const [a, b] = [...st.ptrs.values()]; st.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: st.v.z, v: { ...st.v }, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 }; st.drag = null; st.pan = null; st.box = null; st.down = null; return; }
      if (st.ptrs.size > 2) return;
      const pw = world(e); st.down = { cx: e.clientX, cy: e.clientY, moved: false, noMove: false };
      if (e.button === 1 || st.tool === 'pan' || st.space || !edit) { st.pan = { sx: e.clientX, sy: e.clientY, vx: st.v.x, vy: st.v.y }; svg.classList.add('grab'); return; }
      if (st.tool === 'sel') return beginSelect(pw, e);
      if (st.tool === 'room') { const s = snapPt(pw); st.rectA = { a: [s.x, s.y], b: [s.x, s.y] }; return; }
      st.hover = pw; if (st.tool === 'wall' || st.tool === 'area') updDraw(pw, e); sched();
    });
    function updDraw(pw, e) {
      const touch = e && e.pointerType === 'touch'; if (!st.draw) { const s = snapPt(pw, { touch }); st.hover = [s.x, s.y]; return; }
      const last = st.draw.pts[st.draw.pts.length - 1], s = snapPt(pw, { ref: st.tool === 'wall' ? last : null, strict: e && e.shiftKey, touch }); st.draw.cur = [s.x, s.y]; st.hover = [s.x, s.y];
      const L = dist(last[0], last[1], s.x, s.y), li = $('#cad-len'), ai = $('#cad-ang'); if (li && !li.value) li.placeholder = m2(L); if (ai && !ai.value) ai.placeholder = String(Math.round(ang(last, [s.x, s.y]))); st.info = m2(L) + ' m · ' + Math.round(ang(last, [s.x, s.y])) + '°';
    }
    svg.addEventListener('pointermove', e => {
      const p = st.ptrs.get(e.pointerId); if (p) { p.x = e.clientX; p.y = e.clientY; }
      if (st.pinch && st.ptrs.size >= 2) { const [a, b] = [...st.ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), r = svg.getBoundingClientRect(), z = Math.max(.04, Math.min(8, st.pinch.z * d / st.pinch.d)), cx = (a.x + b.x) / 2 - r.left, cy = (a.y + b.y) / 2 - r.top, wx = st.pinch.v.x + (st.pinch.cx - r.left) / st.pinch.v.z, wy = st.pinch.v.y + (st.pinch.cy - r.top) / st.pinch.v.z; st.v = { z, x: wx - cx / z, y: wy - cy / z }; sched(); return; }
      if (st.down && dist(e.clientX, e.clientY, st.down.cx, st.down.cy) > 5) st.down.moved = true;
      if (st.pan) { st.v.x = st.pan.vx - (e.clientX - st.pan.sx) / st.v.z; st.v.y = st.pan.vy - (e.clientY - st.pan.sy) / st.v.z; sched(); return; }
      const pw = world(e); if (!edit) return;
      if (st.drag) return doDrag(pw, e);
      if (st.box) { st.box.b = pw; if (st.down && st.down.moved) st.box.moved = true; sched(); return; }
      if (st.rectA) { const s = snapPt(pw); st.rectA.b = [s.x, s.y]; st.info = m2(Math.abs(st.rectA.a[0] - s.x)) + ' × ' + m2(Math.abs(st.rectA.a[1] - s.y)) + ' m'; sched(); return; }
      const t = st.tool; if (t === 'wall' || t === 'area') updDraw(pw, e); else if (t === 'op' || t === 'detect') st.hover = pw; else if (t === 'sym') { st.hover = pw; st.hsym = symPlace(pw, e); } else if (t === 'dim' || t === 'txt' || t === 'meas') { const s = snapPt(pw, { touch: e.pointerType === 'touch' }); st.hover = [s.x, s.y]; if (t === 'meas' && st.ma && !st.mb) st.mh = [s.x, s.y]; } else return; sched();
    });
    const endPtr = e => {
      const had = st.ptrs.delete(e.pointerId); if (st.pinch) { if (st.ptrs.size < 2) st.pinch = null; return; } if (!had) return;
      svg.classList.remove('grab'); st.info = st.draw ? st.info : '';
      if (st.pan) { const m = st.down && st.down.moved; st.pan = null; st.down = null; if (st.tool === 'sel' && !m) { st.sel.clear(); panel(); render(); } return; }
      if (st.drag) { const d = st.drag; st.drag = null; st.down = null; st.sp = null; st.info = ''; if (d.moved) { commit(); panel(); } render(); return; }
      if (st.box) { const b = st.box; st.box = null; const m = st.down && st.down.moved; st.down = null; if (m) boxSelect(b); else if (!b.add) st.sel.clear(); panel(); render(); return; }
      if (st.rectA) { const r = st.rectA; st.rectA = null; st.down = null; st.info = ''; if (Math.abs(r.a[0] - r.b[0]) > 20 && Math.abs(r.a[1] - r.b[1]) > 20) { const rr = rectRoom(r.a[0], r.a[1], r.b[0], r.b[1]); st.sel = new Set([key('r', rr.i)]); st.tool = 'sel'; commit(); toolUI(); panel(); } render(); return; }
      if (st.down && st.down.noMove) { st.down = null; return; }
      if (st.down && edit && e.type === 'pointerup') { const pw = world(e); st.down = null; toolClick(pw, e); } st.down = null;
    };
    svg.addEventListener('pointerup', endPtr); svg.addEventListener('pointercancel', endPtr);
    svg.addEventListener('dblclick', e => { if (edit && (st.tool === 'wall' || st.tool === 'area') && st.draw) { e.preventDefault(); finishDraw(false); } });
    svg.addEventListener('wheel', e => { e.preventDefault(); const r = svg.getBoundingClientRect(); zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.15 : 1 / 1.15); }, { passive: false });
    svg.addEventListener('contextmenu', e => e.preventDefault());

    /* rendering */
    function overlay() {
      const z = st.v.z, p = 1 / z, o = [], hd = (x, y, c) => `<circle cx="${x}" cy="${y}" r="${6 * p}" fill="#fff" stroke="${c || ACC}" stroke-width="${2 * p}"/>`;
      handles().forEach(h => o.push(h.k === 'rot' ? `<line x1="${h.c[0]}" y1="${h.c[1]}" x2="${h.x}" y2="${h.y}" stroke="${ACC}" stroke-width="${p}" stroke-dasharray="${4 * p} ${3 * p}"/><circle cx="${h.x}" cy="${h.y}" r="${7 * p}" fill="${ACC}" stroke="#fff" stroke-width="${2 * p}"/>` : hd(h.x, h.y)));
      const lab = (x, y, s, c) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="${13 * p}" font-weight="700" fill="${c || ACC}">${s}</text>`;
      if (st.draw) {
        const d = st.draw, pts = d.pts.concat([d.cur]), wt = WTt(); o.push(`<polyline points="${pts.map(q => q.join(',')).join(' ')}" fill="${st.tool === 'area' ? 'rgba(37,99,235,.08)' : 'none'}" stroke="${ACC}" stroke-width="${st.tool === 'wall' ? wt : 2 * p}" stroke-opacity="${st.tool === 'wall' ? .45 : 1}" stroke-linejoin="round" stroke-linecap="${st.tool === 'wall' ? 'square' : 'round'}"/>`);
        const l = d.pts[d.pts.length - 1], c = d.cur, L = dist(l[0], l[1], c[0], c[1]);
        if (L > 1) o.push(lab((l[0] + c[0]) / 2, (l[1] + c[1]) / 2 - 14 * p, m2(L) + ' m'));
        if (st.tool === 'area' && d.pts.length >= 2) { const pp = d.pts.concat([d.cur]); o.push(lab(...centroid(pp), mq(area(pp)) + ' m²', '#0e7490').replace('<text ', '<text style="paint-order:stroke" ')); }
        d.pts.forEach((q, i) => o.push(hd(q[0], q[1], i === 0 ? '#16a34a' : ACC)));
      } else if ((st.tool === 'wall' || st.tool === 'area') && st.hover) o.push(`<circle cx="${st.hover[0]}" cy="${st.hover[1]}" r="${5 * p}" fill="${ACC}" opacity=".6"/>`);
      const hs = st.hsn; if (hs && hs.gl) hs.gl.forEach(g => o.push(`<line x1="${g[0]}" y1="${g[1]}" x2="${g[2]}" y2="${g[3]}" stroke="#16a34a" stroke-width="${p}" stroke-dasharray="${5 * p} ${4 * p}"/>`));
      if (hs && hs.k && edit && (st.draw || ['wall', 'area', 'dim', 'meas', 'txt', 'room', 'sym'].includes(st.tool) || st.drag)) { const r = 7 * p, c = '#e11d8d'; o.push(hs.k === 'm' ? `<path d="M${hs.x} ${hs.y - r}L${hs.x + r} ${hs.y + r}H${hs.x - r}z" fill="none" stroke="${c}" stroke-width="${2 * p}"/>` : hs.k === 'i' ? `<path d="M${hs.x - r} ${hs.y - r}L${hs.x + r} ${hs.y + r}M${hs.x + r} ${hs.y - r}L${hs.x - r} ${hs.y + r}" stroke="${c}" stroke-width="${2 * p}"/>` : `<rect x="${hs.x - r}" y="${hs.y - r}" width="${2 * r}" height="${2 * r}" fill="none" stroke="${c}" stroke-width="${2 * p}"/>`, `<text x="${hs.x + 10 * p}" y="${hs.y - 10 * p}" font-size="${11 * p}" font-weight="700" fill="${c}">${SNL[hs.k]}</text>`); }
      if (st.box) { const a = st.box.a, b = st.box.b, win = b[0] >= a[0]; o.push(`<rect x="${Math.min(a[0], b[0])}" y="${Math.min(a[1], b[1])}" width="${Math.abs(a[0] - b[0])}" height="${Math.abs(a[1] - b[1])}" fill="${win ? 'rgba(37,99,235,.08)' : 'rgba(22,163,74,.1)'}" stroke="${win ? ACC : '#16a34a'}" stroke-width="${p}" stroke-dasharray="${win ? '' : (5 * p) + ' ' + (4 * p)}"/>`); }
      if (st.rectA) { const a = st.rectA.a, b = st.rectA.b; o.push(`<rect x="${Math.min(a[0], b[0])}" y="${Math.min(a[1], b[1])}" width="${Math.abs(a[0] - b[0])}" height="${Math.abs(a[1] - b[1])}" fill="rgba(37,99,235,.1)" stroke="${ACC}" stroke-width="${2 * p}" stroke-dasharray="${6 * p} ${4 * p}"/>`, lab((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, m2(Math.abs(a[0] - b[0])) + ' × ' + m2(Math.abs(a[1] - b[1])) + ' m (interno)')); }
      if (st.tool === 'op' && st.hover) { const nw = nearWall(st.hover, 18 * p + 8); if (nw) { const d = OP[st.opk], L = wLen(nw.w), l = Math.min(d.l, Math.max(30, L - 10)), pos = Math.max(l / 2, Math.min(L - l / 2, nw.pos)), g = { w: [nw.w], o: [{ i: 'gh', k: st.opk, w: nw.w.i, p: pos, l, f: 0 }], s: [], q: [], t: [], r: [], ly: { h: {}, l: {} } }; o.push(`<g opacity=".6">${opSvg(g, g.o[0], true, 'sf')}</g>`); const fr = wFrame(nw.w), ox = nw.w.x + fr.ux * pos, oy = nw.w.y + fr.uy * pos, nx = fr.nx * (nw.w.t / 2 + 22 * p), ny = fr.ny * (nw.w.t / 2 + 22 * p); o.push(lab(nw.w.x + fr.ux * (pos - l / 2) / 2 + nx, nw.w.y + fr.uy * (pos - l / 2) / 2 + ny, m2(pos - l / 2)), lab(nw.w.x + fr.ux * (pos + l / 2 + (L - pos - l / 2) / 2) + nx, nw.w.y + fr.uy * (pos + l / 2 + (L - pos - l / 2) / 2) + ny, m2(L - pos - l / 2))); } }
      if (st.tool === 'sym' && st.hover) { const d = SYM[st.symk], r = st.hsym || { x: st.hover[0], y: st.hover[1], a: 0 }; o.push(`<g opacity=".6" class="sy" style="--c:${ACC}" transform="translate(${r.x} ${r.y}) rotate(${r.a}) scale(${d.w / 100} ${d.h / 100})">${symD(d, { w: d.w, h: d.h })}</g>`); }
      if (st.tool === 'dim' && st.qa) { const h = st.hover || st.qa; o.push(hd(st.qa[0], st.qa[1]), `<line x1="${st.qa[0]}" y1="${st.qa[1]}" x2="${h[0]}" y2="${h[1]}" stroke="${ACC}" stroke-width="${2 * p}" stroke-dasharray="${5 * p} ${4 * p}"/>`, lab((st.qa[0] + h[0]) / 2, (st.qa[1] + h[1]) / 2 - 10 * p, m2(dist(st.qa[0], st.qa[1], h[0], h[1])) + ' m')); }
      if (st.tool === 'meas' && st.ma) { const b = st.mb || st.mh || st.ma, a = st.ma, L = dist(a[0], a[1], b[0], b[1]); o.push(hd(a[0], a[1], '#0e7490'), hd(b[0], b[1], '#0e7490'), `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#0e7490" stroke-width="${2 * p}"/>`, lab((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 12 * p, m2(L) + ' m · ' + Math.round(ang(a, b)) + '°', '#0e7490')); st.info = 'Distanza ' + m2(L) + ' m · Δx ' + m2(Math.abs(b[0] - a[0])) + ' · Δy ' + m2(Math.abs(b[1] - a[1])) + ' m · ' + Math.round(ang(a, b)) + '°'; }
      return o.join('');
    }
    function gridSvg() {
      const v = st.v, z = v.z, w = st.W / z, h = st.H / z, maj = z < .12 ? 500 : 100, mi = st.gs && st.gs < 10 ? 0 : 10; let s = '<defs>';
      if (z >= .55 && mi) s += `<pattern id="gm" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0H0V10" fill="none" stroke="#edf0f6" stroke-width="${.9 / z}"/></pattern>`;
      s += `<pattern id="gM" width="${maj}" height="${maj}" patternUnits="userSpaceOnUse"><path d="M${maj} 0H0V${maj}" fill="none" stroke="#dbe1ed" stroke-width="${1.1 / z}"/></pattern></defs>`;
      if (z >= .55 && mi) s += `<rect x="${v.x}" y="${v.y}" width="${w}" height="${h}" fill="url(#gm)"/>`; return s + `<rect x="${v.x}" y="${v.y}" width="${w}" height="${h}" fill="url(#gM)"/>`;
    }
    function render() {
      const v = st.v; if (!v) return; svg.setAttribute('viewBox', `${v.x} ${v.y} ${st.W / v.z} ${st.H / v.z}`);
      svg.innerHTML = `<style>${SCSS}</style>${DEFS}${st.grid ? gridSvg() : ''}${draw(plan, { z: v.z, fs: 12, sel: st.sel, auto: st.auto })}${overlay()}`; hud();
    }
    function hud() {
      $('#cad-zl').textContent = Math.round(st.v.z * 100) + '%'; $('[data-a=undo]').disabled = st.hi <= 0; $('[data-a=redo]').disabled = st.hi >= st.hist.length - 1; $('[data-a=auto]').classList.toggle('on', st.auto);
      let L = [10, 20, 50, 100, 200, 500, 1000, 2000].find(x => x * st.v.z >= 70) || 2000; $('#cad-sb').innerHTML = `<i style="width:${Math.round(L * st.v.z)}px"></i>${L >= 100 ? L / 100 + ' m' : L + ' cm'}`;
      svg.setAttribute('class', 'cad-svg cdc-cad t-' + st.tool); const inf = $('#cad-info'); inf.innerHTML = st.info ? `<div class="cad-info">${esc(st.info)}</div>` : '';
      $('#cad-modeb').innerHTML = plan.mode !== 'gr' ? `<span>${plan.mode === 'sf' ? 'Stato di fatto' : 'Progetto'}</span>` : '';
      ['vw', 'snp', 'exp'].forEach(k => { const b = $(`[data-pm=${k}]`); if (b) b.classList.toggle('on', st.pop === k); });
    }

    function toolUI() {
      $$('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === st.tool)); $('#cad-hint').textContent = HINT[st.tool] || ''; flyUI(); optUI(); popUI(); panel(); hud();
    }
    function optUI() {
      const t = st.tool; let h = ''; const chip = (c, a, x, on) => `<button class="cad-chip ${c || ''}${on ? ' on' : ''}" ${a}>${x}</button>`;
      if (edit && (t === 'wall' || t === 'room' || t === 'op' || t === 'sym')) h += [[0, 'Esistente'], [2, 'Nuovo'], [1, 'Da demolire']].map(([v, n]) => chip('s' + v, `data-ns="${v}"`, n, st.ns === v)).join('');
      if (edit && (t === 'wall' || t === 'room')) h += `<select data-wm aria-label="Tipo di parete">${Object.keys(WT).map(k => `<option value="${k}"${st.wm === k ? ' selected' : ''}>${WT[k].n}</option>`).join('')}</select><select data-al aria-label="Allineamento delle misure"><option value="int"${st.al === 'int' ? ' selected' : ''}>Misure interne</option><option value="asse"${st.al === 'asse' ? ' selected' : ''}>Misure sull’asse</option><option value="est"${st.al === 'est' ? ' selected' : ''}>Misure esterne</option></select>`;
      if (edit && (t === 'wall' || t === 'area') && st.draw) h += chip('go', 'data-a="finish"', I(IC.ok) + 'Fine');
      if (edit && t === 'op') h += chip('', 'data-a="fly-op"', esc(OP[st.opk].n) + ' ▾'); if (edit && t === 'sym') h += chip('', 'data-a="fly-sym"', esc(SYM[st.symk].n) + ' ▾') + chip('', 'data-a="attach"', 'Appoggia alla parete', st.attach);
      if (edit && t === 'sel') h += chip('', 'data-a="multi"', I(IC.multi) + 'Selezione multipla', st.multi);
      let lenH = ''; if (edit && st.draw && st.tool === 'wall') lenH = `<div class="cad-len"><label>Lunghezza <input id="cad-len" inputmode="decimal" placeholder="3,40" autocomplete="off"><span class="u">m</span></label><label>Angolo <input id="cad-ang" inputmode="decimal" placeholder="0" autocomplete="off" style="width:66px"><span class="u">°</span></label></div>`;
      ui.innerHTML = `<div class="cad-opt">${h}</div>${lenH}<div id="cad-fly"></div>`; flyUI();
    }
    function flyUI() {
      const f = $('#cad-fly'); if (!f) return; if (!st.fly) { f.innerHTML = ''; return; }
      if (st.fly === 'op') f.innerHTML = `<div class="cad-fly"><h5>Porte e finestre</h5><div class="cad-fg">${Object.keys(OP).map(k => `<button class="cad-it${st.opk === k ? ' on' : ''}" data-opk="${k}">${prevOp(k)}${esc(OP[k].n)}</button>`).join('')}</div></div>`;
      else { const gs = [...new Set(Object.values(SYM).map(s => s.g))]; f.innerHTML = `<div class="cad-fly">${gs.map(g => `<h5>${g}</h5><div class="cad-fg">${Object.keys(SYM).filter(k => SYM[k].g === g).map(k => `<button class="cad-it${st.symk === k ? ' on' : ''}" data-symk="${k}">${prevSym(k)}${esc(SYM[k].n)}</button>`).join('')}</div>`).join('')}</div>`; }
    }
    const chp = (a, x, on, c) => `<button class="cad-chip ${c || ''}${on ? ' on' : ''}" ${a}>${x}</button>`;
    function popUI() {
      const p = $('#cad-pop'); if (!p) return; if (!st.pop) { p.innerHTML = ''; hud(); return; } let h = '';
      if (st.pop === 'vw') {
        h = `<h5>Vista del disegno</h5><div class="row">${[['gr', 'Gialli e rossi'], ['sf', 'Stato di fatto'], ['pr', 'Progetto']].map(([k, n]) => chp(`data-mode="${k}"`, n, plan.mode === k)).join('')}</div><p class="nt">Gialli e rossi mostra insieme ciò che si costruisce (giallo) e ciò che si demolisce (rosso). Stato di fatto nasconde i nuovi elementi, Progetto nasconde le demolizioni.</p>
<h5>Livelli</h5>${LAYERS.map(([k, n]) => `<div class="ly"><span>${n}</span><button class="${plan.ly.h[k] ? '' : 'on'}" data-lyh="${k}" aria-label="Mostra o nascondi ${n}">${I(IC.eye)}</button><button class="${plan.ly.l[k] ? 'on' : ''}" data-lyl="${k}" aria-label="Blocca ${n}">${I(IC.lock)}</button></div>`).join('')}
<p class="nt">Occhio = visibile · Lucchetto = bloccato (non si seleziona per sbaglio).</p><h5>Etichette</h5><div class="row">${chp('data-a="auto"', 'Misure sulle pareti', st.auto)}${chp('data-opt="ol"', 'Misure di porte e finestre', !!plan.opt.ol)}${chp('data-a="grid"', 'Griglia', st.grid)}</div>`;
      } else if (st.pop === 'snp') {
        h = `<h5>Aggancio</h5><div class="row">${chp('data-a="snap"', 'Punti e griglia', st.snap)}${chp('data-a="attach"', 'Arredi alla parete', st.attach)}</div><p class="nt">Si aggancia a estremi, punti medi, intersezioni e spigoli delle pareti. Tieni premuto Alt per disattivarlo.</p>
<h5>Angoli</h5><div class="row">${[[0, 'Libero'], [15, '15°'], [30, '30°'], [45, '45°'], [90, 'Ortogonale']].map(([v, n]) => chp(`data-pol="${v}"`, n, st.pol === v)).join('')}</div><h5>Passo della griglia</h5><div class="row">${[[0, 'Auto'], [1, '1 cm'], [5, '5 cm'], [10, '10 cm'], [25, '25 cm'], [50, '50 cm']].map(([v, n]) => chp(`data-gs="${v}"`, n, st.gs === v)).join('')}</div>`;
      } else if (st.pop === 'exp') {
        const E = st.exp, pv = (() => { try { return sheet(plan, { paper: E.paper, orient: E.orient || undefined, scale: E.scale || 0, dpi: 20, meta: opts.meta }); } catch { return null; } })();
        h = `<h5>Stampa in scala</h5><div class="row" style="flex-wrap:nowrap"><select data-pap><option value="A4"${E.paper === 'A4' ? ' selected' : ''}>A4</option><option value="A3"${E.paper === 'A3' ? ' selected' : ''}>A3</option></select><select data-ori><option value="">Orientamento automatico</option><option value="l"${E.orient === 'l' ? ' selected' : ''}>Orizzontale</option><option value="p"${E.orient === 'p' ? ' selected' : ''}>Verticale</option></select></div>
<div class="row" style="margin-top:6px"><select data-scl><option value="0">Scala automatica</option>${SCALES.map(d => `<option value="${d}"${E.scale === d ? ' selected' : ''}>1:${d}</option>`).join('')}</select></div><p class="nt">${pv ? `Risultato: <b>scala 1:${pv.d}</b> su ${E.paper} ${pv.pw > pv.ph ? 'orizzontale' : 'verticale'}, con cartiglio, scala grafica e nord.` : ''} Le misure sul foglio corrispondono a quelle reali.</p>
${opts.pdfKit ? `<button class="go" data-exp="pdf">${I(IC.pdf)}Scarica PDF in scala</button>` : ''}<button class="go sec" data-exp="png">${I(IC.dl)}Scarica immagine (PNG)</button><button class="go sec" data-exp="dxf">${I(IC.dl)}Scarica DXF per AutoCAD</button><p class="nt">Il DXF si apre in AutoCAD, BricsCAD, LibreCAD e simili (unità: centimetri, livelli separati per muri, demolizioni, nuove costruzioni, aperture, arredi, impianti, quote).</p>`;
      }
      p.innerHTML = `<div class="cad-pop">${h}</div>`; hud();
    }
    const fname = ext => 'piantina-' + String(plan.n || 'rilievo').replace(/[^\w]+/g, '-').toLowerCase() + '.' + ext;
    const dl = (name, url) => { const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); };
    const expO = () => ({ paper: st.exp.paper, orient: st.exp.orient || undefined, scale: st.exp.scale || 0, dpi: 200, meta: opts.meta, mode: plan.mode });
    async function doExport(kind, btn) {
      if (btn) btn.disabled = true;
      try {
        if (kind === 'dxf') { const u = URL.createObjectURL(new Blob([dxf(plan)], { type: 'application/dxf' })); dl(fname('dxf'), u); setTimeout(() => URL.revokeObjectURL(u), 4000); }
        else if (kind === 'png') { const r = await sheetPng(plan, expO()); dl(fname('png'), r.url); }
        else if (kind === 'pdf') { const kit = await opts.pdfKit(), r = await sheetPng(plan, expO()), JS = kit.jsPDF, doc = new JS({ unit: 'mm', format: [Math.min(r.pw, r.ph), Math.max(r.pw, r.ph)], orientation: r.pw > r.ph ? 'l' : 'p', compress: true }); doc.addImage(r.url, 'PNG', 0, 0, r.pw, r.ph, undefined, 'FAST'); doc.save(fname('pdf')); }
      } catch (e) { flash('Esportazione non riuscita: ' + (e && e.message || e), true); }
      if (btn) btn.disabled = false;
    }

    /* pannello laterale */
    const fld = (l, f, v, o) => `<label class="cad-f">${l}<input data-f="${f}" value="${esc(v)}" ${o || ''}></label>`;
    const stSel = items => { const ss = items.filter(x => x.t === 'w' || x.t === 'o' || x.t === 's'); if (!ss.length) return ''; const v = new Set(ss.map(x => x.o.s || 0)), cur = v.size === 1 ? [...v][0] : -1; return `<div class="sec">Stato</div><div class="cad-sm">${[[0, 'Esistente'], [1, 'Da demolire'], [2, 'Nuovo']].map(([k, n]) => `<button data-st="${k}" class="s${k}${cur === k ? ' on' : ''}">${n}</button>`).join('')}</div>`; };
    const kp = (arr, c) => `<div class="cad-kp${c ? ' ' + c : ''}">${arr.map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('')}</div>`;
    function panel() {
      const it = one(), s = it && it.o, t = it && it.t, items = selItems(); let h = '', sumMode = false;
      const acts = x => `<div class="cad-acts">${x || ''}<button class="cad-b" data-a="dup">${I(IC.copy)}Duplica</button><button class="cad-b dg" data-a="del">${I(IC.trash)}Elimina</button></div>`;
      if (edit && st.tool === 'room') h = `<h4>Locale da misure interne</h4>${fld('Nome', 'rn', st.room.n, 'placeholder="es. Cucina"')}<div class="cad-r2">${fld('Larghezza (m)', 'rl', st.room.l, 'inputmode="decimal"')}${fld('Profondità (m)', 'rp', st.room.p, 'inputmode="decimal"')}</div><div class="cad-acts"><button class="cad-b pr" data-a="room-add">${I(IC.plus)}Inserisci il locale</button></div><p class="cad-p">Le misure sono quelle <b style="color:#fff">libere tra i muri</b> (cambia in alto: sull’asse o esterne). Oppure trascina un rettangolo sul disegno.</p>`;
      else if (edit && st.tool === 'detect') h = `<h4>Riconosci locale</h4><p class="cad-p">Tocca dentro un locale delimitato da pareti: il programma traccia il contorno sul filo interno dei muri e calcola superficie netta e perimetro. Se il locale non è chiuso te lo segnala.</p>`;
      else if (edit && items.length > 1) {
        const c = {}; items.forEach(x => { c[x.t] = (c[x.t] || 0) + 1; }); const nm = { w: 'pareti', o: 'aperture', s: 'arredi/impianti', q: 'quote', t: 'testi', r: 'locali' };
        h = `<h4>${items.length} elementi <small>${Object.keys(c).map(k => c[k] + ' ' + nm[k]).join(' · ')}</small></h4>${stSel(items)}<div class="sec">Sposta di</div><div class="cad-r2">${fld('Orizzontale (m)', 'mdx', '0,00', 'inputmode="decimal"')}${fld('Verticale (m)', 'mdy', '0,00', 'inputmode="decimal"')}</div><div class="cad-acts"><button class="cad-b pr" data-a="move-apply">Sposta</button></div><div class="sec">Trasforma</div><div class="cad-acts"><button class="cad-b" data-a="rot-l">${I(IC.rot)}−90°</button><button class="cad-b" data-a="rot-r">${I(IC.rot)}+90°</button><button class="cad-b" data-a="mir-h">${I(IC.mirror)}Specchia ↔</button><button class="cad-b" data-a="mir-v">${I(IC.mirror)}Specchia ↕</button>${items.filter(x => x.t === 'w').length === 2 ? `<button class="cad-b" data-a="join">${I(IC.join)}Raccorda angolo</button>` : ''}</div><div class="cad-acts"><button class="cad-b" data-a="dup">${I(IC.copy)}Duplica</button><button class="cad-b" data-a="copy">${I(IC.copy)}Copia</button><button class="cad-b dg" data-a="del">${I(IC.trash)}Elimina</button></div><p class="cad-p">Maiusc + tocco per aggiungere o togliere elementi. Trascina uno degli elementi selezionati per spostarli tutti.</p>`;
      }
      else if (edit && s && t === 'w') {
        const L = wLen(s); h = `<h4>Parete <small>${m2(L)} m · ${Math.round(ang([s.x, s.y], [s.X, s.Y]))}°</small></h4><label class="cad-f">Tipo<select data-f="wm"><option value=""${!s.m ? ' selected' : ''}>Personalizzata</option>${Object.keys(WT).map(k => `<option value="${k}"${s.m === k ? ' selected' : ''}>${WT[k].n}</option>`).join('')}</select></label>
<div class="cad-r2">${fld('Lunghezza (m)', 'wl', m2(L), 'inputmode="decimal"')}${fld('Angolo (°)', 'wa', Math.round(ang([s.x, s.y], [s.X, s.Y]) * 10) / 10, 'inputmode="decimal"')}</div><div class="cad-r2">${fld('Spessore (cm)', 'wt', s.t, 'inputmode="decimal"')}${fld('Altezza (m)', 'wh', s.h ? m2(s.h) : '', 'inputmode="decimal" placeholder="' + esc(plan.h) + '"')}</div>${stSel(items)}
<div class="sec">Coordinate (m)</div><div class="cad-r2">${fld('Inizio X', 'wx1', m2(s.x), 'inputmode="decimal"')}${fld('Inizio Y', 'wy1', m2(s.y), 'inputmode="decimal"')}${fld('Fine X', 'wx2', m2(s.X), 'inputmode="decimal"')}${fld('Fine Y', 'wy2', m2(s.Y), 'inputmode="decimal"')}</div>
<div class="sec">Dividi la parete</div><div class="cad-r2">${fld('A distanza (m)', 'wsp', m2(L / 2), 'inputmode="decimal"')}<div class="cad-acts" style="align-self:end;margin:0 0 10px"><button class="cad-b" data-a="split-at">${I(IC.split)}Dividi</button></div></div>${acts()}<p class="cad-p">Trascina i pallini alle estremità per allungare: i muri collegati seguono.</p>`;
      }
      else if (edit && s && t === 'o') { const w = find('w', s.w), L = w ? wLen(w) : 0; h = `<h4>${esc(OP[s.k].n)} <small>${Math.round(s.l)} × ${Math.round(s.h)} cm</small></h4><label class="cad-f">Tipo<select data-f="ok">${Object.keys(OP).map(k => `<option value="${k}"${k === s.k ? ' selected' : ''}>${OP[k].n}</option>`).join('')}</select></label><div class="cad-r2">${fld('Larghezza (cm)', 'ol', Math.round(s.l), 'inputmode="numeric"')}${fld('Altezza (cm)', 'oh', Math.round(s.h), 'inputmode="numeric"')}</div>${s.k === 'f' || s.k === 'pf' ? fld('Altezza davanzale (cm)', 'osl', Math.round(s.sl || 0), 'inputmode="numeric"') : ''}<div class="cad-r2">${fld('Dallo spigolo (m)', 'op1', m2(s.p - s.l / 2), 'inputmode="decimal"')}${fld('Dall’altro lato (m)', 'op2', m2(L - s.p - s.l / 2), 'inputmode="decimal"')}</div>${stSel(items)}${acts(`<button class="cad-b" data-a="flip-h">${I(IC.flip)}Cerniera</button><button class="cad-b" data-a="flip-s">${I(IC.rot)}Apertura</button>`)}`; }
      else if (edit && s && t === 's') h = `<h4>${esc(SYM[s.k].n)}</h4><div class="cad-r2">${fld('Larghezza (cm)', 'sw', Math.round(s.w), 'inputmode="numeric"')}${fld('Profondità (cm)', 'sh', Math.round(s.h), 'inputmode="numeric"')}</div><div class="cad-r2">${fld('Rotazione (°)', 'sa', Math.round(s.a || 0), 'inputmode="numeric"')}${s.k === 'sc' ? fld('Alzate', 'sn', s.n || Math.max(3, Math.round(s.h / 28)), 'inputmode="numeric"') : '<span></span>'}</div><div class="cad-r2">${fld('Posizione X (m)', 'sx', m2(s.x), 'inputmode="decimal"')}${fld('Posizione Y (m)', 'sy', m2(s.y), 'inputmode="decimal"')}</div>${stSel(items)}${acts(`<button class="cad-b" data-a="rot-l">${I(IC.rot)}−90°</button><button class="cad-b" data-a="rot-r">${I(IC.rot)}+90°</button>`)}<p class="cad-p">Trascina il pallino blu sopra l’elemento per ruotarlo (scatti di 15°; Alt = libero).</p>`;
      else if (edit && s && t === 'r') {
        const S = stats(plan).rooms.find(r => r.i === s.i) || { area: area(s.p), per: perim(s.p), wall: 0, h: (num(plan.h) || 2.7) * 100 }; h = `<h4>Locale</h4>${fld('Nome', 'rname', s.n, 'list="cad-names" placeholder="es. Cucina"')}<datalist id="cad-names">${(opts.names || ['Soggiorno', 'Cucina', 'Camera', 'Bagno', 'Corridoio', 'Ingresso', 'Balcone']).map(n => `<option value="${esc(n)}">`).join('')}</datalist>${kp([['Superficie netta', mq(S.area) + ' m²'], ['Perimetro', m2(S.per) + ' m'], ['Superficie pareti', mq(S.wall) + ' m²'], ['Volume', (S.area * S.h / 1e6).toFixed(2).replace('.', ',') + ' m³']])}<div class="cad-r2"><label class="cad-f">Pavimento<select data-f="rfl">${Object.keys(FL).map(k => `<option value="${k}"${(s.fl || 'none') === k ? ' selected' : ''}>${FL[k]}</option>`).join('')}</select></label>${fld('Altezza (m)', 'rh', s.h ? m2(s.h) : '', 'inputmode="decimal" placeholder="' + esc(plan.h) + '"')}</div><div class="cad-acts"><button class="cad-b" data-a="room-redo">${I(IC.detect)}Ricalcola dalle pareti</button><button class="cad-b dg" data-a="del">${I(IC.trash)}Elimina</button></div><p class="cad-p">La superficie è quella netta, tra i muri. Il nome e i mq passano al rilievo con «Genera ambienti».</p>`;
      }
      else if (edit && s && t === 'q') h = `<h4>Quota <small>${m2(dist(s.x, s.y, s.X, s.Y))} m</small></h4>${fld('Testo (vuoto = misura automatica)', 'qt', s.tx || '', 'placeholder="' + m2(dist(s.x, s.y, s.X, s.Y)) + '"')}${fld('Distanza dalla linea (cm)', 'qd', Math.round(s.d || 0), 'inputmode="numeric"')}${acts(`<button class="cad-b" data-a="q-flip">${I(IC.flip)}Inverti lato</button>`)}`;
      else if (edit && s && t === 't') h = `<h4>Testo</h4>${fld('Contenuto', 'ts', s.s)}<label class="cad-f">Dimensione<select data-f="tz"><option value="1"${s.z == 1 ? ' selected' : ''}>Piccolo</option><option value="2"${s.z == 2 ? ' selected' : ''}>Medio</option><option value="3"${s.z == 3 ? ' selected' : ''}>Grande</option></select></label>${acts()}`;
      else {
        sumMode = true; const S = stats(plan); h = `<h4>Riepilogo <small>${S.rooms.length} ${S.rooms.length === 1 ? 'locale' : 'locali'}</small></h4>${kp([['Superficie netta', mq(S.area) + ' m²'], ['Pareti', m2(S.wall) + ' m'], ['Porte', S.doors], ['Finestre', S.wins]])}`;
        if (S.rooms.length) h += `<div class="cad-rl">${S.rooms.map(r => `<button data-sel="r:${r.i}"><span>${esc(r.n)}</span><small>${m2(r.per)} m</small><b>${mq(r.area)} m²</b></button>`).join('')}</div>`;
        if (S.wl[1] || S.wl[2]) h += `<div class="sec">Demolizioni e nuove costruzioni</div>${kp([['Da demolire', mq(S.wa[1]) + ' m²'], ['Nuove pareti', mq(S.wa[2]) + ' m²']])}`;
        const imp = Object.keys(S.sym).filter(k => SYM[k] && SYM[k].g !== 'Arredo' && SYM[k].g !== 'Bagno' && SYM[k].g !== 'Cucina'); if (imp.length) h += `<p class="cad-p"><b style="color:#fff">Impianti</b> · ${imp.map(k => `${S.sym[k]} ${SYM[k].n.toLowerCase()}`).join(' · ')}</p>`;
        if (edit) h += `${fld('Altezza dei locali (m)', 'ph', plan.h, 'inputmode="decimal"')}${st.clip ? `<div class="cad-acts"><button class="cad-b" data-a="paste">${I(IC.paste)}Incolla</button></div>` : ''}<p class="cad-p">${S.rooms.length ? 'Seleziona un locale per rinominarlo e scegliere il pavimento.' : 'Inizia con «Locale da misure» (R) oppure disegna le pareti (W) e poi usa «Riconosci locale» (D). Aggiungi porte, finestre, arredi e impianti; segna ciò che si demolisce (rosso) e ciò che è nuovo (giallo).'}</p>`;
      }
      side.innerHTML = h; side.classList.toggle('empty', !edit && !h); side.classList.toggle('sum', sumMode); side.classList.toggle('open', sumMode && st.sumOpen);
    }
    const LIVE = new Set(['rn', 'rl', 'rp', 'ph', 'rname', 'ts', 'sw', 'sh', 'sa', 'sn', 'ol', 'oh', 'osl', 'qd', 'qt', 'rh', 'wh', 'wt', 'mdx', 'mdy', 'wsp']);
    function applyField(f, v) {
      const it = one(), s = it && it.o, n = num(v), M = x => Math.round(x * 100 * 10) / 10;
      if (f === 'rn') st.room.n = v; else if (f === 'rl') st.room.l = v; else if (f === 'rp') st.room.p = v; else if (f === 'ph') plan.h = v;
      else if (!s) return;
      else if (f === 'rname') s.n = v; else if (f === 'rfl') { if (v === 'none') delete s.fl; else s.fl = v; } else if (f === 'rh') { if (v.trim() === '') delete s.h; else s.h = v; }
      else if (f === 'wm') { s.m = v || undefined; if (v) s.t = WT[v].t; if (!v) delete s.m; } else if (f === 'wt' && n >= 2) { s.t = n; if (s.m && WT[s.m].t !== n) delete s.m; } else if (f === 'wh') { if (n > 0) s.h = n * 100; else delete s.h; }
      else if (f === 'wl' && n > 0.05) { const fr = wFrame(s); moveV([s.X, s.Y], [rn(s.x + fr.ux * n * 100), rn(s.y + fr.uy * n * 100)]); }
      else if (f === 'wa') { const L = wLen(s), a = n * Math.PI / 180; moveV([s.X, s.Y], [rn(s.x + Math.cos(a) * L), rn(s.y - Math.sin(a) * L)]); }
      else if (f === 'wx1') moveV([s.x, s.y], [M(n / 100), s.y]); else if (f === 'wy1') moveV([s.x, s.y], [s.x, M(n / 100)]); else if (f === 'wx2') moveV([s.X, s.Y], [M(n / 100), s.Y]); else if (f === 'wy2') moveV([s.X, s.Y], [s.X, M(n / 100)]);
      else if (f === 'ok') { s.k = v; s.h = OP[v].h; s.sl = OP[v].sl; } else if (f === 'ol' && n > 10) { s.l = n; fixOps(); } else if (f === 'oh') s.h = n; else if (f === 'osl') s.sl = n;
      else if (f === 'op1') { s.p = Math.round(n * 100 + s.l / 2); fixOps(); } else if (f === 'op2') { const w = find('w', s.w); if (w) { s.p = Math.round(wLen(w) - s.l / 2 - n * 100); fixOps(); } }
      else if (f === 'sw' && n > 4) s.w = n; else if (f === 'sh' && n > 4) s.h = n; else if (f === 'sa') s.a = ((n % 360) + 360) % 360; else if (f === 'sn') s.n = Math.max(2, Math.round(n)); else if (f === 'sx') s.x = Math.round(n * 1000) / 10; else if (f === 'sy') s.y = Math.round(n * 1000) / 10;
      else if (f === 'qd') s.d = n; else if (f === 'qt') { if (v.trim()) s.tx = v; else delete s.tx; } else if (f === 'ts') s.s = v; else if (f === 'tz') s.z = +v;
    }
    side.addEventListener('input', e => { const f = e.target.dataset && e.target.dataset.f; if (!f || !LIVE.has(f)) return; applyField(f, e.target.value); render(); });
    side.addEventListener('change', e => { const f = e.target.dataset && e.target.dataset.f; if (!f) return; if (f !== 'mdx' && f !== 'mdy' && f !== 'wsp') applyField(f, e.target.value); commit(); if (f !== 'rname' && f !== 'ts' && f !== 'qt' && f !== 'rn' && f !== 'rl' && f !== 'rp' && f !== 'ph' && f !== 'mdx' && f !== 'mdy' && f !== 'wsp') panel(); render(); });
    function sideAct(a) {
      const it = one(), s = it && it.o, f = k => num(((side.querySelector(`[data-f=${k}]`) || {}).value));
      if (a === 'del') delSel();
      else if (a === 'rot-l' || a === 'rot-r') { if (s && it.t === 's' && st.sel.size === 1) { s.a = (((s.a || 0) + (a === 'rot-r' ? 90 : -90)) % 360 + 360) % 360; commit(); panel(); render(); } else rotSel(a === 'rot-r' ? 90 : -90); }
      else if (a === 'dup') { copySel(); pasteClip(40); } else if (a === 'copy') { copySel(); flash('Copiato: usa Incolla o Ctrl+V'); panel(); } else if (a === 'paste') pasteClip();
      else if (a === 'flip-h') { if (s) { s.f = (s.f || 0) ^ 2; commit(); render(); } } else if (a === 'flip-s') { if (s) { s.f = (s.f || 0) ^ 1; commit(); render(); } }
      else if (a === 'q-flip') { if (s) { s.d = -(s.d || 0); commit(); panel(); render(); } } else if (a === 'mir-h') mirSel(true); else if (a === 'mir-v') mirSel(false); else if (a === 'join') joinCorner();
      else if (a === 'move-apply') moveSel(Math.round(f('mdx') * 1000) / 10, Math.round(f('mdy') * 1000) / 10);
      else if (a === 'split-at') { if (s && it.t === 'w') splitWall(s, Math.round(f('wsp') * 100)); }
      else if (a === 'room-redo') { if (s && it.t === 'r') { const c = centroid(s.p), r = detect(plan, c[0], c[1]); if (r.err) flash(r.err, true); else { s.p = r.pts; commit(); panel(); render(); } } }
      else if (a === 'room-add') { const l = num(st.room.l) * 100, p = num(st.room.p) * 100; if (l < 30 || p < 30) return; const c = [st.v.x + st.W / st.v.z / 2, st.v.y + st.H / st.v.z / 2], x = Math.round((c[0] - l / 2) / 10) * 10, y = Math.round((c[1] - p / 2) / 10) * 10, r = rectRoom(x, y, x + l, y + p, st.room.n.trim()); st.room.n = ''; st.sel = new Set([key('r', r.i)]); st.tool = 'sel'; commit(); toolUI(); render(); }
    }

    /* barra, tastiera */
    function setTool(t) { if (!edit && t !== 'sel' && t !== 'pan') return; if (st.draw) finishDraw(false); st.tool = t; st.qa = null; st.rectA = null; st.hover = null; st.hsn = null; st.ma = null; st.mb = null; st.mh = null; st.info = ''; st.fly = t === 'op' || t === 'sym' ? t : ''; if (t !== 'sel') st.sel.clear(); toolUI(); render(); }
    el.addEventListener('click', e => {
      const sb = e.target.closest('[data-sel]'); if (sb) { const [t, i] = sb.dataset.sel.split(':'); st.sel = new Set([key(t, i)]); const r = find(t, i); if (r && t === 'r') { const bb = itemBox('r', r), cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2; st.v.x = cx - st.W / st.v.z / 2; st.v.y = cy - st.H / st.v.z / 2; } panel(); render(); return; }
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.st != null) return setState(+b.dataset.st);
      if (b.dataset.tool) return setTool(b.dataset.tool);
      if (b.dataset.ns != null) { st.ns = +b.dataset.ns; optUI(); return; } if (b.dataset.opk) { st.opk = b.dataset.opk; st.fly = ''; optUI(); return; } if (b.dataset.symk) { st.symk = b.dataset.symk; st.fly = ''; optUI(); $('#cad-hint').textContent = 'Tocca dove posizionare «' + SYM[st.symk].n + '»'; return; }
      if (b.dataset.pm) { st.pop = st.pop === b.dataset.pm ? '' : b.dataset.pm; return popUI(); }
      if (b.dataset.mode) { plan.mode = b.dataset.mode; commit(); popUI(); return render(); }
      if (b.dataset.lyh) { const k = b.dataset.lyh; if (plan.ly.h[k]) delete plan.ly.h[k]; else plan.ly.h[k] = 1; commit(); popUI(); return render(); }
      if (b.dataset.lyl) { const k = b.dataset.lyl; if (plan.ly.l[k]) delete plan.ly.l[k]; else plan.ly.l[k] = 1; commit(); popUI(); return; }
      if (b.dataset.opt) { const k = b.dataset.opt; plan.opt[k] = !plan.opt[k]; commit(); popUI(); return render(); }
      if (b.dataset.pol != null) { st.pol = +b.dataset.pol; return popUI(); } if (b.dataset.gs != null) { st.gs = +b.dataset.gs; popUI(); return render(); }
      if (b.dataset.exp) return doExport(b.dataset.exp, b);
      const a = b.dataset.a; if (!a) return;
      if (a === 'close') return close(); if (a === 'undo') return restore(st.hi - 1); if (a === 'redo') return restore(st.hi + 1);
      if (a === 'zin') return zoomAt(st.W / 2, st.H / 2, 1.3); if (a === 'zout') return zoomAt(st.W / 2, st.H / 2, 1 / 1.3); if (a === 'fit') { fit(); return render(); }
      if (a === 'grid') { st.grid = !st.grid; popUI(); return render(); } if (a === 'snap') { st.snap = !st.snap; popUI(); return hud(); } if (a === 'auto') { st.auto = !st.auto; plan.opt.auto = st.auto; popUI(); return render(); }
      if (a === 'attach') { st.attach = !st.attach; popUI(); return optUI(); } if (a === 'multi') { st.multi = !st.multi; return optUI(); }
      if (a === 'fly-op') { st.fly = st.fly ? '' : 'op'; return flyUI(); } if (a === 'fly-sym') { st.fly = st.fly ? '' : 'sym'; return flyUI(); }
      if (a === 'finish') return finishDraw(false); if (a === 'sum') { st.sumOpen = !st.sumOpen; if (st.sumOpen) { st.sel.clear(); if (st.tool !== 'sel') setTool('sel'); } panel(); return render(); }
      if (b.closest('#cad-side')) sideAct(a);
    });
    el.addEventListener('change', e => {
      const t = e.target; if (t.dataset.wm != null) { st.wm = t.value; optUI(); } else if (t.dataset.al != null) { st.al = t.value; } else if (t.dataset.pap != null) { st.exp.paper = t.value; popUI(); } else if (t.dataset.ori != null) { st.exp.orient = t.value; popUI(); } else if (t.dataset.scl != null) { st.exp.scale = +t.value; popUI(); }
    });
    $('#cad-nm').addEventListener('input', e => { plan.n = e.target.value; }); $('#cad-nm').addEventListener('change', () => commit());
    ui.addEventListener('keydown', e => {
      if (e.target.id !== 'cad-len' && e.target.id !== 'cad-ang') return; if (e.key !== 'Enter') return; e.preventDefault(); const d = st.draw; if (!d) return;
      const li = $('#cad-len'), ai = $('#cad-ang'), last = d.pts[d.pts.length - 1], c = d.cur, Lc = dist(last[0], last[1], c[0], c[1]) || 1, n = li && li.value ? num(li.value) * 100 : Lc; if (n < 5) return;
      let ux, uy; if (ai && ai.value !== '') { const a = num(ai.value) * Math.PI / 180; ux = Math.cos(a); uy = -Math.sin(a); } else { ux = Lc > 1 ? (c[0] - last[0]) / Lc : 1; uy = Lc > 1 ? (c[1] - last[1]) / Lc : 0; }
      const p = [rn(last[0] + ux * n), rn(last[1] + uy * n)]; if (li) li.value = ''; if (ai) ai.value = ''; if (addPoint(p, false) && st.draw) { const f = $('#cad-len'); if (f) f.focus(); }
    });
    function key2(e) {
      if (!document.body.contains(el)) return; const tg = e.target, typing = tg && /^(INPUT|SELECT|TEXTAREA)$/.test(tg.tagName), mod = e.ctrlKey || e.metaKey;
      if (e.key === 'Escape') { if (typing && (tg.id === 'cad-len' || tg.id === 'cad-ang')) tg.blur(); if (st.pop) { st.pop = ''; popUI(); } else if (st.fly) { st.fly = ''; flyUI(); } else if (st.draw) finishDraw(false); else if (st.qa || st.ma) { st.qa = null; st.ma = null; st.mb = null; render(); } else if (st.tool !== 'sel') setTool('sel'); else if (st.sel.size) { st.sel.clear(); panel(); render(); } else close(); e.stopPropagation(); return; }
      if (typing) return;
      if (edit && st.draw && st.tool === 'wall' && /^[0-9,.]$/.test(e.key)) { const f = $('#cad-len'); if (f) { f.focus(); f.value += e.key; e.preventDefault(); } return; }
      if (e.key === 'Enter' && st.draw) { finishDraw(false); return; }
      if (e.key === ' ') { st.space = true; e.preventDefault(); return; }
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); restore(e.shiftKey ? st.hi + 1 : st.hi - 1); return; } if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); restore(st.hi + 1); return; }
      if (mod && edit) { const k = e.key.toLowerCase(); if (k === 'c') { copySel(); e.preventDefault(); return; } if (k === 'v') { pasteClip(); e.preventDefault(); return; } if (k === 'd') { e.preventDefault(); copySel(); pasteClip(40); return; } if (k === 'a') { e.preventDefault(); st.sel = new Set(); ['w', 'o', 's', 'q', 't', 'r'].forEach(t => plan[t].forEach(o => { if (pickable(t, o)) st.sel.add(key(t, o.i)); })); panel(); render(); return; } }
      if (e.key === 'F8') { e.preventDefault(); st.pol = st.pol === 90 ? 15 : 90; flash('Angoli: ' + (st.pol === 90 ? 'ortogonale' : 'scatti di 15°')); return; }
      if ((e.key === 'Delete' || e.key === 'Backspace') && edit) { e.preventDefault(); delSel(); return; }
      if (e.key === '+' || e.key === '=') return zoomAt(st.W / 2, st.H / 2, 1.25); if (e.key === '-') return zoomAt(st.W / 2, st.H / 2, 1 / 1.25); if (e.key === '0') { fit(); return render(); }
      if (e.key.startsWith('Arrow') && edit && st.sel.size) { const d = e.shiftKey ? 10 : 1, dx = e.key === 'ArrowLeft' ? -d : e.key === 'ArrowRight' ? d : 0, dy = e.key === 'ArrowUp' ? -d : e.key === 'ArrowDown' ? d : 0; const only = selItems().some(x => x.t !== 'o'); if (only) { e.preventDefault(); moveSel(dx, dy); } return; }
      const tt = TOOLS.find(x => x[2].toLowerCase() === e.key.toLowerCase()); if (tt && !mod) setTool(tt[0]);
    }
    const keyUp = e => { if (e.key === ' ') st.space = false; };
    document.addEventListener('keydown', key2, true); document.addEventListener('keyup', keyUp);
    const ro = new ResizeObserver(() => { const r = stage.getBoundingClientRect(), first = !st.v; st.W = Math.max(200, r.width); st.H = Math.max(200, r.height); if (first) fit(); render(); }); ro.observe(stage);
    function close() { if (st.draw) finishDraw(false); document.removeEventListener('keydown', key2, true); document.removeEventListener('keyup', keyUp); ro.disconnect(); plan.v = { x: Math.round(st.v.x), y: Math.round(st.v.y), z: Math.round(st.v.z * 1000) / 1000 }; el.style.transition = 'opacity .2s'; el.style.opacity = '0'; setTimeout(() => { el.remove(); document.documentElement.classList.remove('cad-lock'); }, 200); if (opts.onChange) opts.onChange(plan); if (opts.onClose) opts.onClose(plan); }
    const r0 = stage.getBoundingClientRect(); st.W = Math.max(200, r0.width); st.H = Math.max(200, r0.height); if (!st.v) fit(); toolUI(); render();
    return { close };
  }
  const newPlan = n => ({ id: 'pl' + uid(), n: n || 'Piano terra', h: '2,70', w: [], o: [], s: [], q: [], t: [], r: [], ly: { h: {}, l: {} }, mode: 'gr', opt: {} });
  window.CDC_CAD = { open, thumb, png, sheet, sheetPng, dxf, bom, stats, detect, newPlan, norm, SYM, OP, WT, FL, isDoor, v: 265 };
})();
