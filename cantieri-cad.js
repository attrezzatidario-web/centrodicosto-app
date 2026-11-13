/* Centro di Costo — Piantina 2D del sopralluogo (v262)
   window.CDC_CAD: open(plan, opts) editor a tutto schermo · thumb(plan) · png(plan, w, o) · stats(plan)
   Una piantina = oggetto JSON piccolo dentro la pratica (p.piante[]). Unità: centimetri.
   w pareti {i,x,y,X,Y,t} · o aperture {i,k,w,p,l,h,sl,f} · s simboli {i,k,x,y,a,w,h} · q quote {i,x,y,X,Y,d}
   t testi {i,x,y,s,z} · r locali {i,n,p:[[x,y]..]} */
(() => {
  'use strict';
  const uid = () => Math.random().toString(36).slice(2, 8);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const m2 = cm => (cm / 100).toFixed(2).replace('.', ',');
  const mq = v => (v / 10000).toFixed(2).replace('.', ',');
  const num = s => { const v = parseFloat(String(s == null ? '' : s).replace(',', '.')); return isFinite(v) ? v : 0; };
  const dist = (a, b, c, d) => Math.hypot(c - a, d - b);
  const INK = '#1d2433', BLUE = '#1f6fd1', ORG = '#c2410c', ACC = '#2563eb';
  const TINT = ['#e8f0ff', '#e9f7ef', '#fff4e0', '#f3ebff', '#e6f6f8', '#fdecee'];

  /* ---------- catalogo simboli: disegno in un riquadro -50..50, poi scalato a w×h cm ---------- */
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
  const OP = {
    p: { n: 'Porta', l: 80, h: 210, sl: 0 }, pd: { n: 'Porta doppia', l: 140, h: 210, sl: 0 }, ps: { n: 'Porta scorrevole', l: 90, h: 210, sl: 0 },
    pi: { n: 'Porta ingresso', l: 100, h: 215, sl: 0 }, f: { n: 'Finestra', l: 120, h: 120, sl: 90 }, pf: { n: 'Portafinestra', l: 140, h: 220, sl: 0 }, v: { n: 'Varco', l: 100, h: 210, sl: 0 }
  };
  const isDoor = k => k === 'p' || k === 'pd' || k === 'ps' || k === 'pi' || k === 'pf';

  /* ---------- geometria ---------- */
  function norm(p) { ['w', 'o', 's', 'q', 't', 'r'].forEach(k => { if (!Array.isArray(p[k])) p[k] = []; }); if (!p.h) p.h = '2,70'; return p; }
  function area(pts) { let a = 0; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; a += x1 * y2 - x2 * y1; } return Math.abs(a) / 2; }
  function perim(pts) { let l = 0; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; l += dist(x1, y1, x2, y2); } return l; }
  function centroid(pts) {
    let a = 0, cx = 0, cy = 0; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length], f = x1 * y2 - x2 * y1; a += f; cx += (x1 + x2) * f; cy += (y1 + y2) * f; }
    if (Math.abs(a) < 1e-6) { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2]; } return [cx / (3 * a), cy / (3 * a)];
  }
  function inPoly(x, y, pts) { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
  function segDist(px, py, x1, y1, x2, y2) { const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy; let t = L2 ? ((px - x1) * dx + (py - y1) * dy) / L2 : 0; t = Math.max(0, Math.min(1, t)); return { d: dist(px, py, x1 + t * dx, y1 + t * dy), t }; }
  const wLen = w => dist(w.x, w.y, w.X, w.Y);
  function wFrame(w) { const L = wLen(w) || 1, ux = (w.X - w.x) / L, uy = (w.Y - w.y) / L; return { L, ux, uy, nx: -uy, ny: ux, ang: Math.atan2(uy, ux) * 180 / Math.PI }; }
  function opPoint(plan, o) { const w = plan.w.find(x => x.i === o.w); if (!w) return null; const f = wFrame(w); return { w, f, x: w.x + f.ux * o.p, y: w.y + f.uy * o.p }; }
  function bbox(plan) {
    let a = [1e9, 1e9, -1e9, -1e9]; const add = (x, y, r) => { r = r || 0; a[0] = Math.min(a[0], x - r); a[1] = Math.min(a[1], y - r); a[2] = Math.max(a[2], x + r); a[3] = Math.max(a[3], y + r); };
    plan.w.forEach(w => { add(w.x, w.y, w.t / 2); add(w.X, w.Y, w.t / 2); }); plan.r.forEach(r => r.p.forEach(p => add(p[0], p[1]))); plan.s.forEach(s => add(s.x, s.y, Math.max(s.w, s.h) / 2)); plan.q.forEach(q => { add(q.x, q.y); add(q.X, q.Y); }); plan.t.forEach(t => add(t.x, t.y, 40));
    return a[0] > a[2] ? null : a;
  }

  /* ---------- statistiche e collegamento al rilievo ---------- */
  function roomOps(plan, r) {
    const out = []; plan.o.forEach(o => { const q = opPoint(plan, o); if (!q) return; let hit = false; for (let i = 0; i < r.p.length && !hit; i++) { const a = r.p[i], b = r.p[(i + 1) % r.p.length]; if (segDist(q.x, q.y, a[0], a[1], b[0], b[1]).d <= q.w.t / 2 + 12) hit = true; } if (hit) out.push(o); });
    return out;
  }
  function stats(plan) {
    norm(plan); const rooms = plan.r.map(r => { const ops = roomOps(plan, r); return { i: r.i, n: r.n || 'Locale', area: area(r.p), per: perim(r.p), ops, pts: r.p }; });
    const cnt = {}; plan.s.forEach(s => { cnt[s.k] = (cnt[s.k] || 0) + 1; });
    return { rooms, area: rooms.reduce((s, r) => s + r.area, 0), wall: plan.w.reduce((s, w) => s + wLen(w), 0), walls: plan.w.length, doors: plan.o.filter(o => isDoor(o.k) && o.k !== 'pf').length, wins: plan.o.filter(o => o.k === 'f' || o.k === 'pf').length, ops: plan.o.length, sym: cnt };
  }

  /* ---------- disegno SVG (stringa) ---------- */
  function quad(x1, y1, x2, y2, t, e1, e2) {
    const L = dist(x1, y1, x2, y2) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L, nx = -uy * t / 2, ny = ux * t / 2, ax = x1 - ux * e1, ay = y1 - uy * e1, bx = x2 + ux * e2, by = y2 + uy * e2;
    return `${ax + nx},${ay + ny} ${bx + nx},${by + ny} ${bx - nx},${by - ny} ${ax - nx},${ay - ny}`;
  }
  const f1 = v => Math.round(v * 10) / 10;
  function opSvg(plan, o, sel) {
    const q = opPoint(plan, o); if (!q) return ''; const { w, f } = q, t = w.t, l = o.l, h2 = l / 2, fl = o.f || 0, sx = fl & 2 ? -1 : 1, sy = fl & 1 ? -1 : 1;
    let g = `<path class="oj" d="M${-h2} ${-t / 2}H${h2}M${-h2} ${t / 2}H${h2}"/>`;
    const arc = (r, hx, dir) => `<path class="oa" d="M${hx + dir * r} 0A${r} ${r} 0 0 ${dir > 0 ? 0 : 1} ${hx} ${r}"/>`;
    if (o.k === 'p' || o.k === 'pi') g += `<rect class="ol" x="${-h2}" y="0" width="${o.k === 'pi' ? 6 : 4}" height="${l}"/><path class="oa" d="M${h2} 0A${l} ${l} 0 0 1 ${-h2} ${l}"/>`;
    else if (o.k === 'pd') g += `<rect class="ol" x="${-h2}" y="0" width="4" height="${h2}"/><rect class="ol" x="${h2 - 4}" y="0" width="4" height="${h2}"/><path class="oa" d="M0 0A${h2} ${h2} 0 0 1 ${-h2} ${h2}M0 0A${h2} ${h2} 0 0 0 ${h2} ${h2}"/>`;
    else if (o.k === 'ps') g += `<rect class="ol" x="${-h2}" y="${-t / 2 + 1}" width="${l * .56}" height="${Math.max(3, t * .34)}"/><path class="oa" d="M${-h2 + l * .62} ${-t * .1}H${h2 - 4}m-8-5 8 5-8 5"/>`;
    else if (o.k === 'f' || o.k === 'pf') {
      g += `<rect class="ofr" x="${-h2}" y="${-t / 2}" width="${l}" height="${t}"/><path class="og" d="M${-h2} 0H${h2}"/><path class="oj" d="M${-h2} ${-t / 6}H${h2}M${-h2} ${t / 6}H${h2}"/>`;
      if (o.k === 'pf') g += `<path class="oa" d="M0 0A${h2} ${h2} 0 0 1 ${-h2} ${h2}M0 0A${h2} ${h2} 0 0 0 ${h2} ${h2}"/>`;
    } else if (o.k === 'v') g += `<path class="oj" d="M${-h2} ${-t / 2 - 4}V${t / 2 + 4}M${h2} ${-t / 2 - 4}V${t / 2 + 4}"/>`;
    const hl = sel ? `<rect class="osel" x="${-h2 - 3}" y="${-t / 2 - 3}" width="${l + 6}" height="${t + 6}" rx="3"/>` : '';
    return `<g transform="translate(${f1(q.x)} ${f1(q.y)}) rotate(${f1(f.ang)}) scale(${sx} ${sy})">${hl}${g}</g>`;
  }
  function draw(plan, o) {
    norm(plan); o = o || {}; const z = o.z || .5, fs = (o.fs || 12) / z, sel = o.sel || {}, out = [], is = (t, i) => sel.t === t && sel.i === i;
    plan.r.forEach((r, n) => { if (!r.p || r.p.length < 3) return; out.push(`<polygon class="rm${is('r', r.i) ? ' sel' : ''}" fill="${TINT[n % TINT.length]}" points="${r.p.map(p => p[0] + ',' + p[1]).join(' ')}"/>`); });
    plan.w.forEach(w => {
      const L = wLen(w); if (L < 1) return; const f = wFrame(w), ops = plan.o.filter(x => x.w === w.i).sort((a, b) => a.p - b.p); let cur = 0; const segs = [];
      ops.forEach(x => { const a = Math.max(cur, x.p - x.l / 2), b = Math.min(L, x.p + x.l / 2); if (a > cur) segs.push([cur, a]); cur = Math.max(cur, b); }); if (cur < L) segs.push([cur, L]);
      segs.forEach(([a, b]) => out.push(`<polygon class="wl${is('w', w.i) ? ' sel' : ''}" points="${quad(w.x + f.ux * a, w.y + f.uy * a, w.x + f.ux * b, w.y + f.uy * b, w.t, a <= 0 ? w.t / 2 : 0, b >= L ? w.t / 2 : 0)}"/>`));
    });
    plan.o.forEach(x => out.push(opSvg(plan, x, is('o', x.i))));
    plan.s.forEach(s => {
      const d = SYM[s.k]; if (!d) return; out.push(`<g class="sy" style="--c:${d.c || INK}" transform="translate(${f1(s.x)} ${f1(s.y)}) rotate(${s.a || 0}) scale(${f1(s.w / 100)} ${f1(s.h / 100)})">${d.d}</g>`);
      if (is('s', s.i)) out.push(`<rect class="ssel" x="${-s.w / 2 - 4}" y="${-s.h / 2 - 4}" width="${s.w + 8}" height="${s.h + 8}" rx="4" transform="translate(${f1(s.x)} ${f1(s.y)}) rotate(${s.a || 0})"/>`);
    });
    const cen = (() => { const m = plan.w.map(w => [(w.x + w.X) / 2, (w.y + w.Y) / 2]); return m.length ? [m.reduce((s, p) => s + p[0], 0) / m.length, m.reduce((s, p) => s + p[1], 0) / m.length] : [0, 0]; })();
    if (o.auto !== false) plan.w.forEach(w => {
      const L = wLen(w); if (L < 25) return; const f = wFrame(w), mx = (w.x + w.X) / 2, my = (w.y + w.Y) / 2; let nx = f.nx, ny = f.ny; if ((mx - cen[0]) * nx + (my - cen[1]) * ny < 0) { nx = -nx; ny = -ny; }
      let a = f.ang; if (a > 90 || a < -90) a += 180; const d = w.t / 2 + fs * .75;
      out.push(`<text class="wd" font-size="${f1(fs * .82)}" text-anchor="middle" transform="translate(${f1(mx + nx * d)} ${f1(my + ny * d)}) rotate(${f1(a)})" dy="${f1(fs * .28)}">${m2(L)}</text>`);
    });
    plan.q.forEach(q => {
      const L = dist(q.x, q.y, q.X, q.Y); if (L < 1) return; const ux = (q.X - q.x) / L, uy = (q.Y - q.y) / L, nx = -uy, ny = ux, d = q.d || 0, ax = q.x + nx * d, ay = q.y + ny * d, bx = q.X + nx * d, by = q.Y + ny * d, e = fs * .5, sg = d >= 0 ? 1 : -1;
      let a = Math.atan2(uy, ux) * 180 / Math.PI; if (a > 90 || a < -90) a += 180; const tk = fs * .45;
      out.push(`<g class="qt${is('q', q.i) ? ' sel' : ''}"><path d="M${q.x + nx * sg * e} ${q.y + ny * sg * e}L${ax + nx * sg * e} ${ay + ny * sg * e}M${q.X + nx * sg * e} ${q.Y + ny * sg * e}L${bx + nx * sg * e} ${by + ny * sg * e}M${ax} ${ay}L${bx} ${by}M${ax - ux * tk - nx * tk} ${ay - uy * tk - ny * tk}L${ax + ux * tk + nx * tk} ${ay + uy * tk + ny * tk}M${bx - ux * tk - nx * tk} ${by - uy * tk - ny * tk}L${bx + ux * tk + nx * tk} ${by + uy * tk + ny * tk}"/><text font-size="${f1(fs * .95)}" text-anchor="middle" transform="translate(${f1((ax + bx) / 2)} ${f1((ay + by) / 2)}) rotate(${f1(a)})" dy="${f1(-fs * .35)}">${m2(L)}</text></g>`);
    });
    plan.r.forEach(r => { if (!r.p || r.p.length < 3) return; const c = centroid(r.p); out.push(`<text class="rn" text-anchor="middle" font-size="${f1(fs * 1.15)}" x="${f1(c[0])}" y="${f1(c[1] - fs * .15)}">${esc(r.n || 'Locale')}</text><text class="ra" text-anchor="middle" font-size="${f1(fs * .95)}" x="${f1(c[0])}" y="${f1(c[1] + fs * 1.05)}">${mq(area(r.p))} m²</text>`); });
    plan.t.forEach(t => out.push(`<text class="tx${is('t', t.i) ? ' sel' : ''}" font-size="${f1(fs * ([1, 1.35, 1.9][(t.z || 1) - 1] || 1) * 1.1)}" x="${f1(t.x)}" y="${f1(t.y)}">${esc(t.s)}</text>`));
    return out.join('');
  }
  const SVG_CSS = `.rm{stroke:none}.rm.sel{stroke:${ACC};stroke-width:2;stroke-dasharray:6 4;vector-effect:non-scaling-stroke}.wl{fill:${INK}}.wl.sel{fill:${ACC}}
.oj{stroke:${INK};stroke-width:1.2;fill:none;vector-effect:non-scaling-stroke}.oa{stroke:#6b7385;stroke-width:1;fill:none;stroke-dasharray:4 3;vector-effect:non-scaling-stroke}.ol{fill:${INK}}.ofr{fill:#fff;stroke:${INK};stroke-width:1.2;vector-effect:non-scaling-stroke}.og{stroke:${BLUE};stroke-width:1.4;vector-effect:non-scaling-stroke}.osel{fill:${ACC};fill-opacity:.12;stroke:${ACC};stroke-width:1.5;vector-effect:non-scaling-stroke}
.sy *{stroke:var(--c);stroke-width:1.4;vector-effect:non-scaling-stroke}.sy *:not([fill]){fill:#fff}.sy *[opacity]{fill:none}.ssel{fill:${ACC};fill-opacity:.08;stroke:${ACC};stroke-width:1.4;stroke-dasharray:5 3;vector-effect:non-scaling-stroke}
text{font-family:Inter,system-ui,Arial,sans-serif;fill:${INK};paint-order:stroke;stroke:#fff;stroke-width:3px;stroke-linejoin:round}.wd{fill:#5b6475;font-weight:500}.rn{font-weight:700;fill:#14284f}.ra{fill:#44506a;font-weight:500}.tx.sel{fill:${ACC}}
.qt path{stroke:#0e7490;stroke-width:1;fill:none;vector-effect:non-scaling-stroke}.qt text{fill:#0e7490;font-weight:600}.qt.sel path{stroke:${ACC};stroke-width:2}`;

  const SCSS = SVG_CSS.replace(/(^|\})\s*([^{}]+)\{/g, (m, a, s) => a + s.split(',').map(x => '.cdc-cad ' + x.trim()).join(',') + '{');
  /* ---------- anteprima, PNG, PDF ---------- */
  function thumb(plan, w) {
    norm(plan); const b = bbox(plan); if (!b) return ''; const pad = 60, bw = b[2] - b[0] + pad * 2, bh = b[3] - b[1] + pad * 2, z = (w || 360) / bw;
    return `<svg viewBox="${b[0] - pad} ${b[1] - pad} ${bw} ${bh}" preserveAspectRatio="xMidYMid meet" class="cad-th cdc-cad"><style>${SCSS}</style>${draw(plan, { z, fs: 11, auto: false })}</svg>`;
  }
  function svgFull(plan, wpx, o) {
    o = o || {}; const b = bbox(plan) || [0, 0, 400, 300], pad = 80, bw = b[2] - b[0] + pad * 2, bh = b[3] - b[1] + pad * 2, mg = wpx * .035, z = (wpx - mg * 2) / bw, strip = wpx * .075, hpx = Math.round(bh * z + mg * 2 + strip), fs = wpx / 80;
    let bar = [50, 100, 200, 500, 1000, 2000].find(v => v * z > wpx * .1) || 1000; const bx = mg, by = hpx - strip * .5;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${wpx}" height="${hpx}" viewBox="0 0 ${wpx} ${hpx}"><style>${SVG_CSS}</style><rect width="${wpx}" height="${hpx}" fill="#fff"/>
<rect x="${mg * .4}" y="${mg * .4}" width="${wpx - mg * .8}" height="${hpx - mg * .8}" fill="none" stroke="#c9d1e0" stroke-width="2"/>
<g transform="translate(${mg - b[0] * z + pad * z} ${mg - b[1] * z + pad * z}) scale(${z})">${draw(plan, { z, fs, auto: o.auto !== false })}</g>
<path d="M${mg} ${hpx - strip}H${wpx - mg}" stroke="#c9d1e0" stroke-width="2"/>
<text x="${mg}" y="${hpx - strip * .62}" font-size="${fs * 1.25}" font-weight="700" fill="${INK}" stroke="none" font-family="Inter,Arial,sans-serif">${esc(o.title || plan.n || 'Piantina')}</text>
<text x="${mg}" y="${hpx - strip * .3}" font-size="${fs * .85}" fill="#6b7385" stroke="none" font-family="Inter,Arial,sans-serif">${esc(o.sub || 'Rilievo di massima — quote in metri, misure indicative')}</text>
<g transform="translate(${wpx - mg - bar * z} ${by})"><path d="M0 0H${bar * z}M0-8V8M${bar * z}-8V8" stroke="${INK}" stroke-width="3" fill="none"/><text x="${bar * z / 2}" y="${-14}" text-anchor="middle" font-size="${fs * .9}" fill="${INK}" stroke="none" font-family="Inter,Arial,sans-serif">${bar >= 100 ? bar / 100 + ' m' : bar + ' cm'}</text></g></svg>`;
  }
  function png(plan, wpx, o) {
    norm(plan); wpx = wpx || 1800; const svg = svgFull(plan, wpx, o), m = svg.match(/height="(\d+)"/), hpx = +m[1];
    return new Promise((res, rej) => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = wpx; c.height = hpx; c.getContext('2d').drawImage(im, 0, 0); res({ url: c.toDataURL('image/png'), w: wpx, h: hpx }); }; im.onerror = () => rej(new Error('Disegno non esportabile')); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
  }

  /* ---------- editor a tutto schermo ---------- */
  const I = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const IC = {
    sel: '<path d="M5 3l14 8-6 2-3 6z"/>', pan: '<path d="M8 13V6a1.5 1.5 0 0 1 3 0v5m0-2.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2-4a1.5 1.5 0 0 1 2.5-1.5L8 15"/>',
    wall: '<path d="M4 20 20 4"/><circle cx="4" cy="20" r="1.8"/><circle cx="20" cy="4" r="1.8"/>', room: '<rect x="4" y="5" width="16" height="11"/><path d="M4 20h16M4 18.5v3M20 18.5v3"/>', area: '<path d="M5 18 4 8l8-4 8 6-3 8z"/>',
    op: '<path d="M6 21V4h10v17M4 21h16"/><circle cx="13" cy="13" r="1"/>', sym: '<rect x="3" y="11" width="18" height="7" rx="2"/><path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3M6 18v2M18 18v2"/>',
    dim: '<path d="M3 7v10M21 7v10M3 12h18M7 9l-4 3 4 3M17 9l4 3-4 3"/>', txt: '<path d="M5 7V5h14v2M12 5v14M9 19h6"/>', undo: '<path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3"/>', redo: '<path d="M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3"/>',
    zin: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5M11 8v6M8 11h6"/>', zout: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5M8 11h6"/>', fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    grid: '<path d="M4 4h16v16H4zM4 12h16M12 4v16"/>', mag: '<path d="M6 3v9a6 6 0 0 0 12 0V3h-4v9a2 2 0 0 1-4 0V3zM6 7h4M14 7h4"/>', dims: '<path d="M4 9h16M4 6v6M20 6v6M9 17h6"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    rot: '<path d="M20 12a8 8 0 1 1-3-6.2M20 4v5h-5"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>', dl: '<path d="M12 4v11m-4-4 4 4 4-4M5 20h14"/>',
    ok: '<path d="M5 12.5 10 17.5 19 7"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>', flip: '<path d="M12 3v18M8 7 3 12l5 5zM16 7l5 5-5 5z"/>', end: '<path d="M5 12.5 10 17.5 19 7"/>'
  };
  const TOOLS = [['sel', 'Seleziona', 'V'], ['pan', 'Sposta la vista', 'H'], ['wall', 'Pareti', 'W'], ['room', 'Locale da misure', 'R'], ['area', 'Area libera', 'A'], ['op', 'Porte e finestre', 'P'], ['sym', 'Arredi e impianti', 'S'], ['dim', 'Quota', 'Q'], ['txt', 'Testo', 'T']];
  const HINT = {
    sel: 'Tocca un elemento per modificarlo · trascina per spostarlo · trascina lo sfondo per spostare la vista', pan: 'Trascina per spostare la vista · pizzica o rotella per lo zoom',
    wall: 'Tocca il punto di partenza, poi i vertici. Scrivi la misura (es. 3,40) e premi Invio. Chiudi sul primo punto per creare il locale', room: 'Trascina un rettangolo oppure scrivi larghezza e profondità nel pannello',
    area: 'Tocca i vertici del locale; chiudi sul primo punto o premi Fine · calcola mq e perimetro', op: 'Avvicinati a una parete e tocca per inserire. Poi trascina per spostare lungo il muro', sym: 'Scegli l’elemento e tocca dove metterlo', dim: 'Tocca due punti per quotare una distanza', txt: 'Tocca dove scrivere'
  };
  let cssDone = false;
  const CSS = `.cad-lock{overflow:hidden!important}
.cad{--n1:#0d1730;--n2:#14284f;--n3:#1d3566;--am:#f2b13c;position:fixed;inset:0;z-index:300;display:grid;grid-template-rows:auto minmax(0,1fr);background:var(--n1);color:#e8eefc;font:14px/1.4 Inter,system-ui,sans-serif;animation:cad-in .35s cubic-bezier(.2,.8,.2,1) both;-webkit-user-select:none;user-select:none}
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
.cad-hint{position:absolute;left:12px;right:12px;bottom:12px;display:flex;justify-content:center;pointer-events:none}.cad-hint span{background:rgba(13,23,48,.88);color:#e8eefc;font-size:12.5px;padding:8px 14px;border-radius:99px;backdrop-filter:blur(8px);max-width:100%;text-align:center;animation:cad-pop .3s both}
.cad-opt{position:absolute;left:12px;top:12px;display:flex;gap:6px;align-items:center;flex-wrap:wrap;max-width:calc(100% - 24px);animation:cad-pop .25s both}
.cad-chip{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;border-radius:99px;border:1px solid #d7dde9;background:#fff;color:#1d2433;font-size:12.5px;font-weight:600;box-shadow:0 4px 14px -8px rgba(20,40,80,.4)}.cad-chip.on{background:var(--n2);color:#fff;border-color:var(--n2)}.cad-chip.go{background:var(--am);border-color:var(--am);color:#2a1d00}
.cad-chip svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.cad-len{position:absolute;right:12px;top:12px;display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #d7dde9;border-radius:12px;padding:6px 8px 6px 12px;box-shadow:0 10px 30px -14px rgba(20,40,80,.5);animation:cad-pop .25s both;color:#1d2433;font-size:12.5px;font-weight:600}
.cad-len input{width:84px;height:34px;border:1px solid #c9d1e0;border-radius:8px;padding:0 9px;font-weight:700;font-size:15px;color:#1d2433;background:#fff;outline:none;-webkit-user-select:text;user-select:text}.cad-len input:focus{border-color:${ACC}}
.cad-sb{position:absolute;left:14px;bottom:56px;color:#1d2433;font-size:11.5px;font-weight:600;pointer-events:none}.cad-sb i{display:block;height:7px;border:2px solid #1d2433;border-top:0;margin-bottom:3px}
.cad-fly{position:absolute;left:10px;top:54px;bottom:60px;width:276px;max-width:calc(100% - 20px);overflow-y:auto;background:rgba(255,255,255,.97);border:1px solid #d7dde9;border-radius:16px;padding:10px;box-shadow:0 24px 60px -24px rgba(10,20,50,.55);animation:cad-pop .25s both;color:#1d2433;backdrop-filter:blur(10px)}
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
  function css() { if (cssDone) return; cssDone = true; const s = document.createElement('style'); s.id = 'cad-css'; s.textContent = CSS; document.head.appendChild(s); }
  const prevOp = k => { const d = { w: [{ i: 'x', x: -60, y: 0, X: 60, Y: 0, t: 14 }], o: [{ k, w: 'x', p: 60, l: Math.min(OP[k].l, 100), f: 0 }], s: [], q: [], t: [], r: [] }; return `<svg class="cdc-cad" viewBox="-70 -42 140 84"><style>${SCSS}</style>${draw(d, { z: 1, auto: false })}</svg>`; };
  const prevSym = k => { const d = SYM[k], m = Math.max(d.w, d.h), sx = d.w / m * .92, sy = d.h / m * .92; return `<svg class="cdc-cad" viewBox="-60 -60 120 120"><style>${SCSS}</style><g class="sy" style="--c:${d.c || INK}" transform="scale(${sx * 1.1} ${sy * 1.1})">${d.d}</g></svg>`; };

  function open(plan, opts) {
    opts = opts || {}; norm(plan); css(); const edit = !!opts.edit;
    const el = document.createElement('div'); el.className = 'cad' + (edit ? '' : ' ro');
    el.innerHTML = `<div class="cad-top"><button class="cad-b" data-a="close" aria-label="Chiudi">${I(IC.x)}</button><input class="nm" id="cad-nm" value="${esc(plan.n || '')}" placeholder="Nome piantina (es. Piano terra)" ${edit ? '' : 'disabled'} aria-label="Nome piantina">
      <button class="cad-b e" data-a="undo" aria-label="Annulla" title="Annulla (Ctrl+Z)">${I(IC.undo)}</button><button class="cad-b e" data-a="redo" aria-label="Ripeti" title="Ripeti">${I(IC.redo)}</button><span class="cad-sep m-h"></span>
      <button class="cad-b m-h" data-a="zout" aria-label="Riduci">${I(IC.zout)}</button><span class="cad-zl m-h" id="cad-zl">100%</span><button class="cad-b m-h" data-a="zin" aria-label="Ingrandisci">${I(IC.zin)}</button><button class="cad-b" data-a="fit" aria-label="Inquadra tutto" title="Inquadra tutto (0)">${I(IC.fit)}</button><button class="cad-b cad-sumb" data-a="sum" aria-label="Riepilogo e misure">${I(IC.list)}</button><span class="cad-sep m-h"></span>
      <button class="cad-b m-h" data-a="grid" aria-label="Griglia" title="Griglia">${I(IC.grid)}</button><button class="cad-b e" data-a="snap" aria-label="Aggancio" title="Aggancio a griglia e punti">${I(IC.mag)}</button><button class="cad-b m-h" data-a="auto" aria-label="Quote automatiche" title="Misure sulle pareti">${I(IC.dims)}</button><button class="cad-b m-h" data-a="png" aria-label="Scarica immagine" title="Scarica immagine PNG">${I(IC.dl)}</button>
      <button class="cad-b done" data-a="close">${I(IC.ok)}<span>Fatto</span></button></div>
      <div class="cad-main"><div class="cad-tools">${TOOLS.map(([k, n, h]) => `<button class="cad-b${k === 'sel' || k === 'pan' ? '' : ' e'}" data-tool="${k}" data-t="${n} (${h})" aria-label="${n}">${I(IC[k])}<kbd>${h}</kbd></button>`).join('')}</div>
      <div class="cad-stage" id="cad-stage"><svg class="cad-svg" id="cad-svg" preserveAspectRatio="none"></svg><div class="cad-sb" id="cad-sb"></div><div id="cad-ui"></div><div class="cad-hint"><span id="cad-hint"></span></div></div>
      <aside class="cad-side" id="cad-side"></aside></div>`;
    document.body.appendChild(el); document.documentElement.classList.add('cad-lock');
    const $ = s => el.querySelector(s), $$ = s => [...el.querySelectorAll(s)], svg = $('#cad-svg'), stage = $('#cad-stage'), side = $('#cad-side'), ui = $('#cad-ui');
    const st = { tool: 'sel', opk: 'p', symk: 'wc', sel: null, draw: null, drag: null, hover: null, grid: true, snap: true, auto: true, th: 15, ptrs: new Map(), hist: [], hi: -1, W: 800, H: 600, v: plan.v ? { ...plan.v } : null, pan: null, pinch: null, down: null, rect: null, qa: null, fly: '', sumOpen: false, room: { l: '4,00', p: '3,00', n: '' }, space: false, raf: 0 };
    const snapJson = () => JSON.stringify({ w: plan.w, o: plan.o, s: plan.s, q: plan.q, t: plan.t, r: plan.r, h: plan.h });
    st.hist.push(snapJson()); st.hi = 0;
    const px = () => 1 / st.v.z, step = () => (st.v.z >= .8 ? 5 : st.v.z >= .3 ? 10 : st.v.z >= .12 ? 25 : 50);
    const world = e => { const r = svg.getBoundingClientRect(); return [st.v.x + (e.clientX - r.left) / st.v.z, st.v.y + (e.clientY - r.top) / st.v.z]; };
    const rn = v => Math.round(v * 10) / 10;
    function commit() { const s = snapJson(); if (s === st.hist[st.hi]) return; st.hist = st.hist.slice(0, st.hi + 1); st.hist.push(s); if (st.hist.length > 80) st.hist.shift(); st.hi = st.hist.length - 1; if (opts.onChange) opts.onChange(plan); hud(); }
    function restore(i) { if (i < 0 || i >= st.hist.length) return; st.hi = i; const d = JSON.parse(st.hist[i]); Object.assign(plan, d); st.sel = null; st.draw = null; if (opts.onChange) opts.onChange(plan); panel(); render(); }
    function fit() {
      const b = bbox(plan), W = st.W, H = st.H; if (!b) { const z = Math.min(W / 1000, H / 700); st.v = { z, x: -(W / z - 1000) / 2, y: -(H / z - 700) / 2 }; return; }
      const pad = 90, bw = b[2] - b[0] + pad * 2, bh = b[3] - b[1] + pad * 2, z = Math.min(W / bw, H / bh, 2); st.v = { z, x: b[0] - pad - (W / z - bw) / 2, y: b[1] - pad - (H / z - bh) / 2 };
    }
    const zoomAt = (cx, cy, k) => { const v = st.v, z = Math.max(.04, Math.min(6, v.z * k)), wx = v.x + cx / v.z, wy = v.y + cy / v.z; st.v = { z, x: wx - cx / z, y: wy - cy / z }; render(); };
    const sched = () => { if (st.raf) return; st.raf = requestAnimationFrame(() => { st.raf = 0; render(); }); };

    /* snap */
    const points = () => { const a = []; plan.w.forEach(w => { a.push([w.x, w.y], [w.X, w.Y]); }); plan.r.forEach(r => r.p.forEach(p => a.push(p))); return a; };
    function snapPt(pw, o) {
      o = o || {}; let [x, y] = pw; const tol = 12 * px(); let best = null, bd = tol;
      points().forEach(p => { const d = dist(x, y, p[0], p[1]); if (d < bd) { bd = d; best = p; } });
      if (best && !(o.ref && best === o.ref)) return { x: best[0], y: best[1], m: true };
      const sn = st.snap, s = step();
      if (o.ref) {
        const dx = x - o.ref[0], dy = y - o.ref[1], L = Math.hypot(dx, dy); if (L < 1) return { x: o.ref[0], y: o.ref[1] };
        let a = Math.atan2(dy, dx); const q = Math.PI / 12, na = Math.round(a / q) * q; if (o.strict || Math.abs(na - a) < .07) a = na; const LL = sn ? Math.max(s, Math.round(L / s) * s) : L;
        return { x: rn(o.ref[0] + Math.cos(a) * LL), y: rn(o.ref[1] + Math.sin(a) * LL) };
      }
      return sn ? { x: Math.round(x / s) * s, y: Math.round(y / s) * s } : { x: rn(x), y: rn(y) };
    }
    function nearWall(pw, extra) {
      let best = null; plan.w.forEach(w => { const r = segDist(pw[0], pw[1], w.x, w.y, w.X, w.Y); if (r.d <= w.t / 2 + extra && (!best || r.d < best.d)) best = { w, d: r.d, pos: r.t * wLen(w) }; }); return best;
    }
    function moveV(from, to) {
      const nr = (x, y) => Math.abs(x - from[0]) < .6 && Math.abs(y - from[1]) < .6;
      plan.w.forEach(w => { if (nr(w.x, w.y)) { w.x = to[0]; w.y = to[1]; } if (nr(w.X, w.Y)) { w.X = to[0]; w.Y = to[1]; } });
      plan.r.forEach(r => r.p.forEach(p => { if (nr(p[0], p[1])) { p[0] = to[0]; p[1] = to[1]; } }));
      plan.q.forEach(q => { if (nr(q.x, q.y)) { q.x = to[0]; q.y = to[1]; } if (nr(q.X, q.Y)) { q.X = to[0]; q.Y = to[1]; } });
      plan.o.forEach(o => { const w = plan.w.find(x => x.i === o.w); if (w) o.p = Math.max(o.l / 2, Math.min(wLen(w) - o.l / 2, o.p)); });
    }

    /* modifica del modello */
    const nRoom = () => { let n = plan.r.length + 1; while (plan.r.some(r => r.n === 'Locale ' + n)) n++; return 'Locale ' + n; };
    const addW = (a, b) => { const w = { i: 'w' + uid(), x: a[0], y: a[1], X: b[0], Y: b[1], t: st.th }; plan.w.push(w); return w; };
    function addRoom(pts, name) { const r = { i: 'r' + uid(), n: name || nRoom(), p: pts.map(p => [p[0], p[1]]) }; plan.r.push(r); return r; }
    function rectRoom(x1, y1, x2, y2, name) {
      const a = [Math.min(x1, x2), Math.min(y1, y2)], b = [Math.max(x1, x2), Math.max(y1, y2)], P = [[a[0], a[1]], [b[0], a[1]], [b[0], b[1]], [a[0], b[1]]];
      for (let i = 0; i < 4; i++) addW(P[i], P[(i + 1) % 4]); return addRoom(P, name);
    }
    function delSel() {
      const s = st.sel; if (!s) return; const rm = (k, i) => { plan[k] = plan[k].filter(x => x.i !== i); };
      if (s.t === 'w') { rm('w', s.i); plan.o = plan.o.filter(o => o.w !== s.i); } else if (s.t === 'o') rm('o', s.i); else if (s.t === 's') rm('s', s.i); else if (s.t === 'q') rm('q', s.i); else if (s.t === 't') rm('t', s.i); else if (s.t === 'r') rm('r', s.i);
      st.sel = null; commit(); panel(); render();
    }
    function finishDraw(close) {
      const d = st.draw; if (!d) return; st.draw = null;
      if (st.tool === 'area') { if (d.pts.length >= 3) { const r = addRoom(d.pts); st.sel = { t: 'r', i: r.i }; st.tool = 'sel'; commit(); } }
      else if (close && d.pts.length >= 3) { const r = addRoom(d.pts); st.sel = { t: 'r', i: r.i }; st.tool = 'sel'; commit(); toolUI(); }
      else if (d.ws > 0) commit();
      toolUI(); render();
    }

    /* selezione */
    function pick(pw, tol) {
      const x = pw[0], y = pw[1];
      for (let k = plan.s.length - 1; k >= 0; k--) { const s = plan.s[k], a = -(s.a || 0) * Math.PI / 180, dx = x - s.x, dy = y - s.y, lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a); if (Math.abs(lx) <= s.w / 2 + tol * .5 && Math.abs(ly) <= s.h / 2 + tol * .5) return { t: 's', i: s.i }; }
      for (let k = plan.o.length - 1; k >= 0; k--) { const o = plan.o[k], q = opPoint(plan, o); if (!q) continue; const dx = x - q.x, dy = y - q.y, al = dx * q.f.ux + dy * q.f.uy, pe = dx * q.f.nx + dy * q.f.ny; if (Math.abs(al) <= o.l / 2 + tol * .4 && Math.abs(pe) <= q.w.t / 2 + tol) return { t: 'o', i: o.i }; }
      for (let k = plan.t.length - 1; k >= 0; k--) { const t = plan.t[k], fs = 13 / st.v.z * ([1, 1.35, 1.9][(t.z || 1) - 1] || 1); if (x >= t.x - tol && x <= t.x + t.s.length * fs * .6 + tol && y >= t.y - fs - tol && y <= t.y + tol) return { t: 't', i: t.i }; }
      for (const q of plan.q) { const L = dist(q.x, q.y, q.X, q.Y) || 1, nx = -(q.Y - q.y) / L, ny = (q.X - q.x) / L, d = q.d || 0; if (segDist(x, y, q.x + nx * d, q.y + ny * d, q.X + nx * d, q.Y + ny * d).d <= tol) return { t: 'q', i: q.i }; }
      let bw = null, bd = 1e9; plan.w.forEach(w => { const r = segDist(x, y, w.x, w.y, w.X, w.Y); if (r.d <= w.t / 2 + tol && r.d < bd) { bd = r.d; bw = w; } }); if (bw) return { t: 'w', i: bw.i };
      for (let k = plan.r.length - 1; k >= 0; k--) if (inPoly(x, y, plan.r[k].p)) return { t: 'r', i: plan.r[k].i };
      return null;
    }
    const selObj = () => { const s = st.sel; if (!s) return null; const k = { w: 'w', o: 'o', s: 's', q: 'q', t: 't', r: 'r' }[s.t]; return plan[k].find(x => x.i === s.i) || null; };
    function handles() {
      const s = selObj(); if (!s) return []; const t = st.sel.t;
      if (t === 'w') return [{ x: s.x, y: s.y, o: [s.X, s.Y], k: 'a' }, { x: s.X, y: s.Y, o: [s.x, s.y], k: 'b' }];
      if (t === 'q') return [{ x: s.x, y: s.y, k: 'qa' }, { x: s.X, y: s.Y, k: 'qb' }];
      if (t === 'r') return s.p.map((p, i) => ({ x: p[0], y: p[1], k: 'v', n: i }));
      return [];
    }
    function beginSelect(pw, e) {
      const tol = (e.pointerType === 'touch' ? 16 : 9) * px();
      for (const h of handles()) if (dist(pw[0], pw[1], h.x, h.y) <= tol * 1.1) { st.drag = { k: h.k === 'qa' || h.k === 'qb' ? h.k : 'pt', from: [h.x, h.y], ref: h.o, moved: false }; return; }
      const hit = pick(pw, tol), sameHit = hit && st.sel && hit.t === st.sel.t && hit.i === st.sel.i; st.sel = hit; if (!sameHit) panel();
      if (!hit) { st.pan = { sx: e.clientX, sy: e.clientY, vx: st.v.x, vy: st.v.y }; svg.classList.add('grab'); render(); return; }
      const o = selObj(); st.drag = { k: hit.t, start: pw, moved: false, o: JSON.parse(JSON.stringify(o)) }; render();
    }
    function doDrag(pw, e) {
      const d = st.drag, s = selObj(); if (!d) return; if (!d.moved && dist(pw[0], pw[1], d.start ? d.start[0] : pw[0], d.start ? d.start[1] : pw[1]) < 3 * px() && d.k !== 'pt' && d.k !== 'qa' && d.k !== 'qb') return; d.moved = true; const sn = st.snap, g = step();
      if (d.k === 'pt') { const n = snapPt(pw, { ref: d.ref, strict: e.shiftKey }); moveV(d.from, [n.x, n.y]); d.from = [n.x, n.y]; }
      else if (d.k === 'qa' || d.k === 'qb') { const n = snapPt(pw); if (d.k === 'qa') { s.x = n.x; s.y = n.y; } else { s.X = n.x; s.Y = n.y; } }
      else if (d.k === 'w' && s) {
        let dx = pw[0] - d.start[0], dy = pw[1] - d.start[1]; if (sn) { dx = Math.round(dx / g) * g; dy = Math.round(dy / g) * g; }
        const a = [s.x, s.y], b = [s.X, s.Y], na = [d.o.x + dx, d.o.y + dy], nb = [d.o.X + dx, d.o.Y + dy]; moveV(a, na); moveV(b, nb);
      } else if ((d.k === 's' || d.k === 't') && s) { let dx = pw[0] - d.start[0], dy = pw[1] - d.start[1]; if (sn) { dx = Math.round(dx / g) * g; dy = Math.round(dy / g) * g; } s.x = d.o.x + dx; s.y = d.o.y + dy; }
      else if (d.k === 'o' && s) { const nw = nearWall(pw, 30 * px() + 10); if (nw) { s.w = nw.w.i; s.p = Math.round(Math.max(s.l / 2, Math.min(wLen(nw.w) - s.l / 2, nw.pos))); } }
      else if (d.k === 'q' && s) { const L = dist(s.x, s.y, s.X, s.Y) || 1, nx = -(s.Y - s.y) / L, ny = (s.X - s.x) / L; s.d = Math.round(((pw[0] - s.x) * nx + (pw[1] - s.y) * ny) / 5) * 5; }
      sched();
    }

    /* eventi puntatore */
    function toolClick(pw, e) {
      const t = st.tool;
      if (t === 'wall' || t === 'area') {
        const last = st.draw && st.draw.pts[st.draw.pts.length - 1], s = snapPt(pw, { ref: t === 'wall' && last ? last : null, strict: e.shiftKey }), p = [s.x, s.y];
        if (!st.draw) { st.draw = { pts: [p], cur: p, ws: 0 }; optUI(); panel(); render(); return; }
        if (dist(p[0], p[1], last[0], last[1]) < 5) return;
        const first = st.draw.pts[0], closes = st.draw.pts.length >= 3 && dist(p[0], p[1], first[0], first[1]) < 14 * px();
        if (closes) p[0] = first[0], p[1] = first[1];
        if (t === 'wall') { addW(last, p); st.draw.ws++; }
        if (closes) { finishDraw(true); return; } st.draw.pts.push(p); st.draw.cur = p; render();
      } else if (t === 'op') {
        const nw = nearWall(pw, 18 * px() + 8); if (!nw) return; const d = OP[st.opk], L = wLen(nw.w), l = Math.min(d.l, Math.max(30, L - 10)), pos = Math.round(Math.max(l / 2, Math.min(L - l / 2, nw.pos)));
        const o = { i: 'o' + uid(), k: st.opk, w: nw.w.i, p: pos, l, h: d.h, sl: d.sl, f: 0 }; plan.o.push(o); st.sel = { t: 'o', i: o.i }; commit(); panel(); render();
      } else if (t === 'sym') {
        const s = snapPt(pw), d = SYM[st.symk], o = { i: 's' + uid(), k: st.symk, x: s.x, y: s.y, a: 0, w: d.w, h: d.h }; plan.s.push(o); st.sel = { t: 's', i: o.i }; st.tool = 'sel'; st.fly = ''; commit(); toolUI(); panel(); render();
      } else if (t === 'dim') {
        const s = snapPt(pw); if (!st.qa) { st.qa = [s.x, s.y]; render(); return; } if (dist(st.qa[0], st.qa[1], s.x, s.y) < 5) return;
        const q = { i: 'q' + uid(), x: st.qa[0], y: st.qa[1], X: s.x, Y: s.y, d: 40 }; plan.q.push(q); st.qa = null; st.sel = { t: 'q', i: q.i }; commit(); panel(); render();
      } else if (t === 'txt') {
        const s = snapPt(pw), o = { i: 't' + uid(), x: s.x, y: s.y, s: 'Testo', z: 1 }; plan.t.push(o); st.sel = { t: 't', i: o.i }; st.tool = 'sel'; commit(); toolUI(); panel(); render(); const f = $('[data-f=ts]'); if (f) { f.focus(); f.select(); }
      }
    }
    svg.addEventListener('pointerdown', e => {
      if (e.button === 2) return; try { svg.setPointerCapture(e.pointerId); } catch { }
      st.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (st.fly && edit) { st.fly = ''; flyUI(); } if (st.sumOpen) { st.sumOpen = false; panel(); }
      if (st.ptrs.size === 2) { const [a, b] = [...st.ptrs.values()]; st.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: st.v.z, v: { ...st.v }, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 }; st.drag = null; st.pan = null; st.rect = null; st.down = null; return; }
      if (st.ptrs.size > 2) return;
      const pw = world(e); st.down = { cx: e.clientX, cy: e.clientY, moved: false };
      if (e.button === 1 || st.tool === 'pan' || st.space || !edit) { st.pan = { sx: e.clientX, sy: e.clientY, vx: st.v.x, vy: st.v.y }; svg.classList.add('grab'); return; }
      if (st.tool === 'sel') return beginSelect(pw, e);
      if (st.tool === 'room') { const s = snapPt(pw); st.rect = { a: [s.x, s.y], b: [s.x, s.y] }; return; }
      st.hover = pw; if (st.tool === 'wall' || st.tool === 'area') updDraw(pw, e); sched();
    });
    function updDraw(pw, e) { if (!st.draw) { const s = snapPt(pw); st.hover = [s.x, s.y]; return; } const last = st.draw.pts[st.draw.pts.length - 1], s = snapPt(pw, { ref: st.tool === 'wall' ? last : null, strict: e && e.shiftKey }); st.draw.cur = [s.x, s.y]; st.hover = [s.x, s.y]; }
    svg.addEventListener('pointermove', e => {
      const p = st.ptrs.get(e.pointerId); if (p) { p.x = e.clientX; p.y = e.clientY; }
      if (st.pinch && st.ptrs.size >= 2) { const [a, b] = [...st.ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), r = svg.getBoundingClientRect(), z = Math.max(.04, Math.min(6, st.pinch.z * d / st.pinch.d)), cx = (a.x + b.x) / 2 - r.left, cy = (a.y + b.y) / 2 - r.top, wx = st.pinch.v.x + (st.pinch.cx - r.left) / st.pinch.v.z, wy = st.pinch.v.y + (st.pinch.cy - r.top) / st.pinch.v.z; st.v = { z, x: wx - cx / z, y: wy - cy / z }; sched(); return; }
      if (st.down && dist(e.clientX, e.clientY, st.down.cx, st.down.cy) > 5) st.down.moved = true;
      if (st.pan) { st.v.x = st.pan.vx - (e.clientX - st.pan.sx) / st.v.z; st.v.y = st.pan.vy - (e.clientY - st.pan.sy) / st.v.z; sched(); return; }
      const pw = world(e); if (!edit) return;
      if (st.drag) return doDrag(pw, e);
      if (st.rect) { const s = snapPt(pw); st.rect.b = [s.x, s.y]; sched(); return; }
      const t = st.tool; if (t === 'wall' || t === 'area') updDraw(pw, e); else if (t === 'op' || t === 'sym' || t === 'dim' || t === 'txt') { const s = t === 'op' ? { x: pw[0], y: pw[1] } : snapPt(pw); st.hover = [s.x, s.y]; } else return; sched();
    });
    const endPtr = e => {
      const had = st.ptrs.delete(e.pointerId); if (st.pinch) { if (st.ptrs.size < 2) st.pinch = null; return; } if (!had) return;
      svg.classList.remove('grab');
      if (st.pan) { const m = st.down && st.down.moved; st.pan = null; st.down = null; if (st.tool === 'sel' && !m) { st.sel = null; panel(); render(); } return; }
      if (st.drag) { const d = st.drag; st.drag = null; st.down = null; if (d.moved) { commit(); panel(); } render(); return; }
      if (st.rect) { const r = st.rect; st.rect = null; st.down = null; if (Math.abs(r.a[0] - r.b[0]) > 20 && Math.abs(r.a[1] - r.b[1]) > 20) { const rr = rectRoom(r.a[0], r.a[1], r.b[0], r.b[1]); st.sel = { t: 'r', i: rr.i }; st.tool = 'sel'; commit(); toolUI(); panel(); } render(); return; }
      if (st.down && edit && e.type === 'pointerup') { const pw = world(e); st.down = null; toolClick(pw, e); } st.down = null;
    };
    svg.addEventListener('pointerup', endPtr); svg.addEventListener('pointercancel', endPtr);
    svg.addEventListener('dblclick', e => { if (edit && (st.tool === 'wall' || st.tool === 'area') && st.draw) { e.preventDefault(); finishDraw(false); } });
    svg.addEventListener('wheel', e => { e.preventDefault(); const r = svg.getBoundingClientRect(); zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.15 : 1 / 1.15); }, { passive: false });
    svg.addEventListener('contextmenu', e => e.preventDefault());

    /* rendering */
    function overlay() {
      const z = st.v.z, p = 1 / z, o = [];
      const hd = (x, y, c) => `<circle cx="${x}" cy="${y}" r="${6 * p}" fill="#fff" stroke="${c || ACC}" stroke-width="${2 * p}"/>`;
      handles().forEach(h => o.push(hd(h.x, h.y)));
      if (st.draw) {
        const d = st.draw, pts = d.pts.concat([d.cur]); o.push(`<polyline points="${pts.map(q => q.join(',')).join(' ')}" fill="${st.tool === 'area' ? 'rgba(37,99,235,.08)' : 'none'}" stroke="${ACC}" stroke-width="${st.tool === 'wall' ? st.th : 2 * p}" stroke-opacity="${st.tool === 'wall' ? .45 : 1}" stroke-linejoin="round" stroke-linecap="${st.tool === 'wall' ? 'square' : 'round'}"/>`);
        const l = d.pts[d.pts.length - 1], c = d.cur, L = dist(l[0], l[1], c[0], c[1]);
        if (L > 1) o.push(`<text x="${(l[0] + c[0]) / 2}" y="${(l[1] + c[1]) / 2 - 14 * p}" text-anchor="middle" font-size="${13 * p}" font-weight="700" fill="${ACC}">${m2(L)} m</text>`);
        d.pts.forEach((q, i) => o.push(hd(q[0], q[1], i === 0 ? '#16a34a' : ACC)));
      } else if ((st.tool === 'wall' || st.tool === 'area') && st.hover) o.push(`<circle cx="${st.hover[0]}" cy="${st.hover[1]}" r="${5 * p}" fill="${ACC}" opacity=".6"/>`);
      if (st.rect) { const a = st.rect.a, b = st.rect.b; o.push(`<rect x="${Math.min(a[0], b[0])}" y="${Math.min(a[1], b[1])}" width="${Math.abs(a[0] - b[0])}" height="${Math.abs(a[1] - b[1])}" fill="rgba(37,99,235,.1)" stroke="${ACC}" stroke-width="${2 * p}" stroke-dasharray="${6 * p} ${4 * p}"/><text x="${(a[0] + b[0]) / 2}" y="${(a[1] + b[1]) / 2}" text-anchor="middle" font-size="${14 * p}" font-weight="700" fill="${ACC}">${m2(Math.abs(a[0] - b[0]))} × ${m2(Math.abs(a[1] - b[1]))} m</text>`); }
      if (st.tool === 'op' && st.hover) { const nw = nearWall(st.hover, 18 * p + 8); if (nw) { const d = OP[st.opk], L = wLen(nw.w), l = Math.min(d.l, Math.max(30, L - 10)), pos = Math.max(l / 2, Math.min(L - l / 2, nw.pos)), g = { w: [nw.w], o: [{ i: 'gh', k: st.opk, w: nw.w.i, p: pos, l, f: 0 }], s: [], q: [], t: [], r: [] }; o.push(`<g opacity=".6">${opSvg(g, g.o[0], true)}</g>`); } }
      if (st.tool === 'sym' && st.hover) { const d = SYM[st.symk]; o.push(`<g opacity=".55" class="sy" style="--c:${ACC}" transform="translate(${st.hover[0]} ${st.hover[1]}) scale(${d.w / 100} ${d.h / 100})">${d.d}</g>`); }
      if (st.tool === 'dim' && st.qa) { const h = st.hover || st.qa; o.push(hd(st.qa[0], st.qa[1]), `<line x1="${st.qa[0]}" y1="${st.qa[1]}" x2="${h[0]}" y2="${h[1]}" stroke="${ACC}" stroke-width="${2 * p}" stroke-dasharray="${5 * p} ${4 * p}"/>`, `<text x="${(st.qa[0] + h[0]) / 2}" y="${(st.qa[1] + h[1]) / 2 - 10 * p}" text-anchor="middle" font-size="${13 * p}" font-weight="700" fill="${ACC}">${m2(dist(st.qa[0], st.qa[1], h[0], h[1]))} m</text>`); }
      return o.join('');
    }
    function gridSvg() {
      const v = st.v, z = v.z, w = st.W / z, h = st.H / z, maj = z < .12 ? 500 : 100; let s = '<defs>';
      if (z >= .55) s += `<pattern id="gm" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0H0V10" fill="none" stroke="#edf0f6" stroke-width="${.9 / z}"/></pattern>`;
      s += `<pattern id="gM" width="${maj}" height="${maj}" patternUnits="userSpaceOnUse"><path d="M${maj} 0H0V${maj}" fill="none" stroke="#dbe1ed" stroke-width="${1.1 / z}"/></pattern></defs>`;
      if (z >= .55) s += `<rect x="${v.x}" y="${v.y}" width="${w}" height="${h}" fill="url(#gm)"/>`; return s + `<rect x="${v.x}" y="${v.y}" width="${w}" height="${h}" fill="url(#gM)"/>`;
    }
    function render() {
      const v = st.v; if (!v) return; svg.setAttribute('viewBox', `${v.x} ${v.y} ${st.W / v.z} ${st.H / v.z}`);
      svg.innerHTML = `<style>${SCSS}</style>${st.grid ? gridSvg() : ''}${draw(plan, { z: v.z, fs: 12, sel: st.sel || {}, auto: st.auto })}${overlay()}`; hud();
    }
    function hud() {
      $('#cad-zl').textContent = Math.round(st.v.z * 100) + '%'; $('[data-a=undo]').disabled = st.hi <= 0; $('[data-a=redo]').disabled = st.hi >= st.hist.length - 1;
      $('[data-a=grid]').classList.toggle('on', st.grid); $('[data-a=snap]').classList.toggle('on', st.snap); $('[data-a=auto]').classList.toggle('on', st.auto);
      let L = [10, 20, 50, 100, 200, 500, 1000, 2000].find(x => x * st.v.z >= 70) || 2000; $('#cad-sb').innerHTML = `<i style="width:${Math.round(L * st.v.z)}px"></i>${L >= 100 ? L / 100 + ' m' : L + ' cm'}`;
      svg.setAttribute('class', 'cad-svg cdc-cad t-' + st.tool);
    }
    function toolUI() {
      $$('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === st.tool)); $('#cad-hint').textContent = HINT[st.tool] || ''; flyUI(); optUI(); panel(); hud();
    }
    function optUI() {
      const t = st.tool; let h = '';
      if (edit && (t === 'wall' || t === 'room')) h += [8, 12, 15, 20, 30].map(v => `<button class="cad-chip${st.th === v ? ' on' : ''}" data-th="${v}">${v} cm</button>`).join('') + '<span class="cad-chip" style="pointer-events:none;background:transparent;border-color:transparent;box-shadow:none;color:#6b7385">spessore</span>';
      if (edit && (t === 'wall' || t === 'area') && st.draw) h += `<button class="cad-chip go" data-a="finish">${I(IC.ok)}Fine</button>`;
      if (edit && t === 'op') h += `<button class="cad-chip" data-a="fly-op">${esc(OP[st.opk].n)} ▾</button>`; if (edit && t === 'sym') h += `<button class="cad-chip" data-a="fly-sym">${esc(SYM[st.symk].n)} ▾</button>`;
      let lenH = ''; if (edit && st.draw) lenH = `<div class="cad-len"><span>Lunghezza (m)</span><input id="cad-len" inputmode="decimal" placeholder="es. 3,40" autocomplete="off"></div>`;
      ui.innerHTML = `<div class="cad-opt">${h}</div>${lenH}<div id="cad-fly"></div>`; flyUI();
    }
    function flyUI() {
      const f = $('#cad-fly'); if (!f) return; if (!st.fly) { f.innerHTML = ''; return; }
      if (st.fly === 'op') f.innerHTML = `<div class="cad-fly"><h5>Porte e finestre</h5><div class="cad-fg">${Object.keys(OP).map(k => `<button class="cad-it${st.opk === k ? ' on' : ''}" data-opk="${k}">${prevOp(k)}${esc(OP[k].n)}</button>`).join('')}</div></div>`;
      else { const gs = [...new Set(Object.values(SYM).map(s => s.g))]; f.innerHTML = `<div class="cad-fly">${gs.map(g => `<h5>${g}</h5><div class="cad-fg">${Object.keys(SYM).filter(k => SYM[k].g === g).map(k => `<button class="cad-it${st.symk === k ? ' on' : ''}" data-symk="${k}">${prevSym(k)}${esc(SYM[k].n)}</button>`).join('')}</div>`).join('')}</div>`; }
    }

    /* pannello laterale */
    const fld = (l, f, v, o) => `<label class="cad-f">${l}<input data-f="${f}" value="${esc(v)}" ${o || ''}></label>`;
    function panel() {
      const s = selObj(), t = st.sel && st.sel.t; let h = '', sumMode = false;
      const acts = (x) => `<div class="cad-acts">${x || ''}<button class="cad-b dg" data-a="del">${I(IC.trash)}Elimina</button></div>`;
      if (edit && st.tool === 'room') h = `<h4>Locale da misure</h4>${fld('Nome', 'rn', st.room.n, 'placeholder="es. Cucina"')}<div class="cad-r2">${fld('Larghezza (m)', 'rl', st.room.l, 'inputmode="decimal"')}${fld('Profondità (m)', 'rp', st.room.p, 'inputmode="decimal"')}</div><div class="cad-acts"><button class="cad-b pr" data-a="room-add">${I(IC.plus || IC.ok)}Inserisci il locale</button></div><p class="cad-p">Oppure trascina un rettangolo sul disegno. Poi puoi spostarlo e correggere ogni parete.</p>`;
      else if (edit && s && t === 'w') h = `<h4>Parete <small>${m2(wLen(s))} m</small></h4>${fld('Lunghezza (m)', 'wl', m2(wLen(s)), 'inputmode="decimal"')}<label class="cad-f">Spessore<select data-f="wt">${[8, 10, 12, 15, 20, 25, 30, 40].map(v => `<option value="${v}"${v === s.t ? ' selected' : ''}>${v} cm${v <= 10 ? ' · tramezzo' : v >= 25 ? ' · portante' : ''}</option>`).join('')}</select></label>${acts()}<p class="cad-p">Trascina i pallini alle estremità per allungare: i muri collegati seguono.</p>`;
      else if (edit && s && t === 'o') h = `<h4>${esc(OP[s.k].n)} <small>${Math.round(s.l)} × ${Math.round(s.h)} cm</small></h4><label class="cad-f">Tipo<select data-f="ok">${Object.keys(OP).map(k => `<option value="${k}"${k === s.k ? ' selected' : ''}>${OP[k].n}</option>`).join('')}</select></label><div class="cad-r2">${fld('Larghezza (cm)', 'ol', Math.round(s.l), 'inputmode="numeric"')}${fld('Altezza (cm)', 'oh', Math.round(s.h), 'inputmode="numeric"')}</div>${s.k === 'f' || s.k === 'pf' ? fld('Altezza davanzale (cm)', 'osl', Math.round(s.sl || 0), 'inputmode="numeric"') : ''}${acts(`<button class="cad-b" data-a="flip-h">${I(IC.flip)}Cerniera</button><button class="cad-b" data-a="flip-s">${I(IC.rot)}Apertura</button>`)}`;
      else if (edit && s && t === 's') h = `<h4>${esc(SYM[s.k].n)}</h4><div class="cad-r2">${fld('Larghezza (cm)', 'sw', Math.round(s.w), 'inputmode="numeric"')}${fld('Profondità (cm)', 'sh', Math.round(s.h), 'inputmode="numeric"')}</div>${fld('Rotazione (gradi)', 'sa', Math.round(s.a || 0), 'inputmode="numeric"')}${acts(`<button class="cad-b" data-a="rot-l">${I(IC.rot)}−90°</button><button class="cad-b" data-a="rot-r">${I(IC.rot)}+90°</button><button class="cad-b" data-a="dup">${I(IC.copy)}Duplica</button>`)}`;
      else if (edit && s && t === 'r') { const a = area(s.p), pe = perim(s.p); h = `<h4>Locale</h4>${fld('Nome', 'rname', s.n, 'list="cad-names" placeholder="es. Cucina"')}<datalist id="cad-names">${(opts.names || ['Soggiorno', 'Cucina', 'Camera', 'Bagno', 'Corridoio', 'Ingresso', 'Balcone']).map(n => `<option value="${esc(n)}">`).join('')}</datalist><div class="cad-kp"><div><span>Superficie</span><b>${mq(a)} m²</b></div><div><span>Perimetro</span><b>${m2(pe)} m</b></div></div>${acts()}<p class="cad-p">Il nome e i mq passano al rilievo con «Genera ambienti».</p>`; }
      else if (edit && s && t === 'q') h = `<h4>Quota <small>${m2(dist(s.x, s.y, s.X, s.Y))} m</small></h4>${fld('Distanza dalla linea (cm)', 'qd', Math.round(s.d || 0), 'inputmode="numeric"')}${acts(`<button class="cad-b" data-a="q-flip">${I(IC.flip)}Inverti lato</button>`)}`;
      else if (edit && s && t === 't') h = `<h4>Testo</h4>${fld('Contenuto', 'ts', s.s)}<label class="cad-f">Dimensione<select data-f="tz"><option value="1"${s.z == 1 ? ' selected' : ''}>Piccolo</option><option value="2"${s.z == 2 ? ' selected' : ''}>Medio</option><option value="3"${s.z == 3 ? ' selected' : ''}>Grande</option></select></label>${acts()}`;
      else {
        sumMode = true; const S = stats(plan); h = `<h4>Riepilogo <small>${S.rooms.length} ${S.rooms.length === 1 ? 'locale' : 'locali'}</small></h4><div class="cad-kp"><div><span>Superficie</span><b>${mq(S.area)} m²</b></div><div><span>Pareti</span><b>${m2(S.wall)} m</b></div><div><span>Porte</span><b>${S.doors}</b></div><div><span>Finestre</span><b>${S.wins}</b></div></div>`;
        if (S.rooms.length) h += `<div class="cad-rl">${S.rooms.map(r => `<button data-sel="r:${r.i}"><span>${esc(r.n)}</span><small>${m2(r.per)} m</small><b>${mq(r.area)} m²</b></button>`).join('')}</div>`;
        const imp = Object.keys(S.sym).filter(k => SYM[k] && SYM[k].g !== 'Arredo' && SYM[k].g !== 'Bagno' && SYM[k].g !== 'Cucina'); if (imp.length) h += `<p class="cad-p"><b style="color:#fff">Impianti</b> · ${imp.map(k => `${S.sym[k]} ${SYM[k].n.toLowerCase()}`).join(' · ')}</p>`;
        if (edit) h += `${fld('Altezza dei locali (m)', 'ph', plan.h, 'inputmode="decimal"')}<p class="cad-p">${S.rooms.length ? 'Seleziona un locale per rinominarlo.' : 'Inizia con «Locale da misure» (R) oppure disegna le pareti (W). Poi aggiungi porte, finestre, arredi e impianti.'}</p>`;
      }
      side.innerHTML = h; side.classList.toggle('empty', !edit && !h); side.classList.toggle('sum', sumMode); side.classList.toggle('open', sumMode && st.sumOpen);
    }
    side.addEventListener('input', e => {
      const f = e.target.dataset && e.target.dataset.f; if (!f) return; const s = selObj(), v = e.target.value, n = num(v);
      if (f === 'rn') st.room.n = v; else if (f === 'rl') st.room.l = v; else if (f === 'rp') st.room.p = v; else if (f === 'ph') plan.h = v;
      else if (f === 'rname' && s) s.n = v; else if (f === 'ol' && s && n > 10) { s.l = n; s.p = Math.max(n / 2, s.p); } else if (f === 'oh' && s) s.h = n; else if (f === 'osl' && s) s.sl = n;
      else if (f === 'sw' && s && n > 4) s.w = n; else if (f === 'sh' && s && n > 4) s.h = n; else if (f === 'sa' && s) s.a = n; else if (f === 'qd' && s) s.d = n; else if (f === 'ts' && s) s.s = v;
      render();
    });
    side.addEventListener('change', e => {
      const f = e.target.dataset && e.target.dataset.f; if (!f) return; const s = selObj(), v = e.target.value, n = num(v);
      if (f === 'wl' && s && n > 0.05) { const fr = wFrame(s), nb = [rn(s.x + fr.ux * n * 100), rn(s.y + fr.uy * n * 100)]; moveV([s.X, s.Y], nb); }
      else if (f === 'wt' && s) s.t = +v; else if (f === 'ok' && s) { s.k = v; s.h = OP[v].h; s.sl = OP[v].sl; } else if (f === 'tz' && s) s.z = +v;
      commit(); panel(); render();
    });
    side.addEventListener('click', e => {
      const b = e.target.closest('[data-a],[data-sel]'); if (!b) return; if (b.dataset.sel) { const [t, i] = b.dataset.sel.split(':'); st.sel = { t, i }; const r = selObj(); if (r && t === 'r') { const bb = r.p.reduce((a, p) => [Math.min(a[0], p[0]), Math.min(a[1], p[1]), Math.max(a[2], p[0]), Math.max(a[3], p[1])], [1e9, 1e9, -1e9, -1e9]); const cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2; st.v.x = cx - st.W / st.v.z / 2; st.v.y = cy - st.H / st.v.z / 2; } panel(); render(); return; }
      const a = b.dataset.a, s = selObj();
      if (a === 'del') delSel();
      else if (a === 'rot-l' || a === 'rot-r') { if (s) { s.a = (((s.a || 0) + (a === 'rot-r' ? 90 : -90)) % 360 + 360) % 360; commit(); panel(); render(); } }
      else if (a === 'dup') { if (s) { const c = JSON.parse(JSON.stringify(s)); c.i = 's' + uid(); c.x += 30; c.y += 30; plan.s.push(c); st.sel = { t: 's', i: c.i }; commit(); panel(); render(); } }
      else if (a === 'flip-h') { if (s) { s.f = (s.f || 0) ^ 2; commit(); render(); } } else if (a === 'flip-s') { if (s) { s.f = (s.f || 0) ^ 1; commit(); render(); } }
      else if (a === 'q-flip') { if (s) { s.d = -(s.d || 0); commit(); panel(); render(); } }
      else if (a === 'room-add') { const l = num(st.room.l) * 100, p = num(st.room.p) * 100; if (l < 30 || p < 30) return; const c = [st.v.x + st.W / st.v.z / 2, st.v.y + st.H / st.v.z / 2], x = Math.round((c[0] - l / 2) / 10) * 10, y = Math.round((c[1] - p / 2) / 10) * 10, r = rectRoom(x, y, x + l, y + p, st.room.n.trim()); st.room.n = ''; st.sel = { t: 'r', i: r.i }; st.tool = 'sel'; commit(); toolUI(); render(); }
    });

    /* barra, tastiera */
    function setTool(t) { if (!edit && t !== 'sel' && t !== 'pan') return; if (st.draw) finishDraw(false); st.tool = t; st.qa = null; st.rect = null; st.hover = null; st.fly = t === 'op' || t === 'sym' ? t : ''; if (t !== 'sel') st.sel = null; toolUI(); render(); }
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.closest('#cad-side')) return;
      if (b.dataset.tool) return setTool(b.dataset.tool);
      if (b.dataset.th) { st.th = +b.dataset.th; optUI(); return; } if (b.dataset.opk) { st.opk = b.dataset.opk; st.fly = ''; optUI(); return; } if (b.dataset.symk) { st.symk = b.dataset.symk; st.fly = ''; optUI(); $('#cad-hint').textContent = 'Tocca dove posizionare «' + SYM[st.symk].n + '»'; return; }
      const a = b.dataset.a; if (!a) return;
      if (a === 'close') return close(); if (a === 'undo') return restore(st.hi - 1); if (a === 'redo') return restore(st.hi + 1);
      if (a === 'zin') return zoomAt(st.W / 2, st.H / 2, 1.3); if (a === 'zout') return zoomAt(st.W / 2, st.H / 2, 1 / 1.3); if (a === 'fit') { fit(); return render(); }
      if (a === 'grid') { st.grid = !st.grid; return render(); } if (a === 'snap') { st.snap = !st.snap; return hud(); } if (a === 'auto') { st.auto = !st.auto; return render(); }
      if (a === 'fly-op') { st.fly = st.fly ? '' : 'op'; return flyUI(); } if (a === 'fly-sym') { st.fly = st.fly ? '' : 'sym'; return flyUI(); }
      if (a === 'finish') return finishDraw(false); if (a === 'sum') { st.sumOpen = !st.sumOpen; if (st.sumOpen) { st.sel = null; if (st.tool !== 'sel') setTool('sel'); } panel(); return render(); }
      if (a === 'png') { b.disabled = true; png(plan, 2000, { title: plan.n }).then(r => { const l = document.createElement('a'); l.href = r.url; l.download = 'piantina-' + String(plan.n || 'rilievo').replace(/[^\w]+/g, '-').toLowerCase() + '.png'; document.body.appendChild(l); l.click(); l.remove(); }).catch(() => { }).finally(() => { b.disabled = false; }); }
    });
    $('#cad-nm').addEventListener('input', e => { plan.n = e.target.value; }); $('#cad-nm').addEventListener('change', () => commit());
    ui.addEventListener('keydown', e => {
      if (e.target.id !== 'cad-len') return; if (e.key === 'Enter') { e.preventDefault(); const n = num(e.target.value) * 100, d = st.draw; if (!d || n < 5) return; const last = d.pts[d.pts.length - 1], c = d.cur, L = dist(last[0], last[1], c[0], c[1]) || 1, ux = L > 1 ? (c[0] - last[0]) / L : 1, uy = L > 1 ? (c[1] - last[1]) / L : 0, p = [rn(last[0] + ux * n), rn(last[1] + uy * n)]; if (st.tool === 'wall') { addW(last, p); d.ws++; } const first = d.pts[0]; if (d.pts.length >= 3 && dist(p[0], p[1], first[0], first[1]) < 3) { finishDraw(true); return; } d.pts.push(p); d.cur = p; e.target.value = ''; render(); e.target.focus(); }
    });
    function key(e) {
      if (!document.body.contains(el)) return; const tg = e.target, typing = tg && /^(INPUT|SELECT|TEXTAREA)$/.test(tg.tagName);
      if (e.key === 'Escape') { if (typing && tg.id === 'cad-len') { tg.blur(); } if (st.fly) { st.fly = ''; flyUI(); } else if (st.draw) finishDraw(false); else if (st.qa) { st.qa = null; render(); } else if (st.tool !== 'sel') setTool('sel'); else if (st.sel) { st.sel = null; panel(); render(); } else close(); e.stopPropagation(); return; }
      if (typing) return;
      if (edit && st.draw && /^[0-9,.]$/.test(e.key)) { const f = $('#cad-len'); if (f) { f.focus(); f.value += e.key; e.preventDefault(); } return; }
      if (e.key === 'Enter' && st.draw) { finishDraw(false); return; }
      if (e.key === ' ') { st.space = true; e.preventDefault(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); restore(e.shiftKey ? st.hi + 1 : st.hi - 1); return; } if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); restore(st.hi + 1); return; }
      if ((e.key === 'Delete' || e.key === 'Backspace') && edit) { e.preventDefault(); delSel(); return; }
      if (e.key === '+' || e.key === '=') return zoomAt(st.W / 2, st.H / 2, 1.25); if (e.key === '-') return zoomAt(st.W / 2, st.H / 2, 1 / 1.25); if (e.key === '0') { fit(); return render(); }
      if (e.key.startsWith('Arrow') && edit) { const s = selObj(), t = st.sel && st.sel.t, d = (e.shiftKey ? 10 : 1), dx = e.key === 'ArrowLeft' ? -d : e.key === 'ArrowRight' ? d : 0, dy = e.key === 'ArrowUp' ? -d : e.key === 'ArrowDown' ? d : 0; if (s && (t === 's' || t === 't')) { s.x += dx; s.y += dy; commit(); render(); e.preventDefault(); } else if (s && t === 'w') { moveV([s.x, s.y], [s.x + dx, s.y + dy]); moveV([s.X, s.Y], [s.X + dx, s.Y + dy]); commit(); render(); e.preventDefault(); } return; }
      const tt = TOOLS.find(x => x[2].toLowerCase() === e.key.toLowerCase()); if (tt && !e.ctrlKey && !e.metaKey) setTool(tt[0]);
    }
    const keyUp = e => { if (e.key === ' ') st.space = false; };
    document.addEventListener('keydown', key, true); document.addEventListener('keyup', keyUp);
    const ro = new ResizeObserver(() => { const r = stage.getBoundingClientRect(), first = !st.v; st.W = Math.max(200, r.width); st.H = Math.max(200, r.height); if (first) fit(); render(); }); ro.observe(stage);
    function close() { if (st.draw) finishDraw(false); document.removeEventListener('keydown', key, true); document.removeEventListener('keyup', keyUp); ro.disconnect(); plan.v = { x: Math.round(st.v.x), y: Math.round(st.v.y), z: Math.round(st.v.z * 1000) / 1000 }; el.style.transition = 'opacity .2s'; el.style.opacity = '0'; setTimeout(() => { el.remove(); document.documentElement.classList.remove('cad-lock'); }, 200); if (opts.onChange) opts.onChange(plan); if (opts.onClose) opts.onClose(plan); }
    const r0 = stage.getBoundingClientRect(); st.W = Math.max(200, r0.width); st.H = Math.max(200, r0.height); if (!st.v) fit(); toolUI(); render();
    return { close };
  }
  const newPlan = n => ({ id: 'pl' + uid(), n: n || 'Piano terra', h: '2,70', w: [], o: [], s: [], q: [], t: [], r: [] });
  window.CDC_CAD = { open, thumb, png, stats, newPlan, norm, SYM, OP, isDoor };
})();
