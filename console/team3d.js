/* Console › Team: ufficio 3D (three.js). Una scrivania per agente, «cervello condiviso», lavagna, schermo grande, corriere che porta i report.
   Uso: TM3D.show(contenitore, { agents:[{k,n,st,ago,on}], sel, head:{t,s}, stats:{ok,warn,bad,off} }); TM3D.onPick = k => …  (st: ok|warn|bad|off) */
(function () {
  'use strict';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const POS = { guardiano: [-4.8, -2.7], informatico: [0, -2.7], commerciale: [4.8, -2.7], marketing: [-2.4, 2.3], grafico: [2.4, 2.3] };
  const SHIRT = { guardiano: 0x3f7fc4, informatico: 0xe0802e, commerciale: 0x3f7fc4, marketing: 0xe0802e, grafico: 0x3f7fc4 };
  const ACT = {
    guardiano: ['Controllo la demo', 'Verifico i backup', 'Provo la Console'],
    informatico: ['Rivedo il codice', 'Controllo la sicurezza', 'Misuro la velocità'],
    commerciale: ['Cerco aziende', 'Preparo le bozze', 'Studio i settori'],
    marketing: ['Penso ai post', 'Confronto la concorrenza', 'Scrivo un testo'],
    grafico: ['Guardo le schermate', 'Controllo i colori', 'Provo il telefono']
  };
  let I = null; // istanza unica: il canvas passa da un contenitore all'altro quando la Console ridisegna la pagina

  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#888';
  function isDark() { const m = /(\d+)\D+(\d+)\D+(\d+)/.exec(getComputedStyle(document.body).backgroundColor); return m ? (+m[1] * 299 + +m[2] * 587 + +m[3] * 114) / 1000 < 110 : false; }
  const ease = t => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);

  /* ---------- schermi (canvas) ---------- */
  function drawScreen(k, c, t, col, on, flash) {
    c.fillStyle = on ? col : '#1d2230'; c.fillRect(0, 0, 256, 160);
    if (!on) { c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(40, 78, 176, 4); return; }
    c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(0, 0, 256, 160);
    c.fillStyle = '#fff'; c.strokeStyle = '#fff'; c.lineCap = 'round'; c.lineJoin = 'round';
    if (k === 'guardiano') {
      const p = (t * .6) % 1; c.globalAlpha = 1 - p; c.lineWidth = 4; c.beginPath(); c.arc(128, 80, 34 + p * 30, 0, 6.3); c.stroke(); c.globalAlpha = 1;
      c.lineWidth = 9; c.beginPath(); c.arc(128, 80, 34, 0, 6.3); c.stroke(); c.lineWidth = 11; c.beginPath(); c.moveTo(110, 82); c.lineTo(124, 96); c.lineTo(148, 66); c.stroke();
    } else if (k === 'informatico') {
      const W = [.5, .3, .62, .22, .44, .7, .26, .5, .36, .6], off = (t * 22) % 22;
      for (let i = -1; i < 9; i++) { const w = W[(i + 10 + Math.floor(t * 22 / 22)) % 10] * 190; c.globalAlpha = .88; c.fillRect(16 + (i % 3 === 1 ? 18 : 0), 12 + i * 22 - off, w, 9); }
      c.globalAlpha = 1;
    } else if (k === 'commerciale') {
      const sel = Math.floor(t * .8) % 4;
      for (let i = 0; i < 4; i++) { c.globalAlpha = i === sel ? 1 : .32; c.fillRect(14, 14 + i * 36, 228, 26); c.globalAlpha = i === sel ? .45 : .6; c.fillStyle = col; c.fillRect(22, 22 + i * 36, 70, 9); c.fillStyle = '#fff'; }
      c.globalAlpha = 1;
    } else if (k === 'marketing') {
      [.4, .7, .5, .9, .62].forEach((h, i) => { const v = .55 + .45 * Math.sin(t * 1.6 + i * .9); c.globalAlpha = .92; c.fillRect(20 + i * 44, 148 - h * v * 130, 30, h * v * 130); }); c.globalAlpha = 1;
    } else {
      const s = 1 + .14 * Math.sin(t * 2); c.globalAlpha = .92;
      c.beginPath(); c.arc(60, 80, 26 * s, 0, 6.3); c.fill();
      c.save(); c.translate(128, 80); c.rotate(Math.sin(t) * .3); c.fillRect(-26 * s, -26 * s, 52 * s, 52 * s); c.restore();
      c.beginPath(); c.moveTo(196, 108 + 4 * s); c.lineTo(222, 52); c.lineTo(170, 52); c.closePath(); c.fill(); c.globalAlpha = 1;
    }
    if (flash > 0) { c.fillStyle = 'rgba(255,255,255,' + (flash * .55).toFixed(2) + ')'; c.fillRect(0, 0, 256, 160); }
  }
  function drawTv(c, t, stats, dark) {
    c.fillStyle = dark ? '#0f1626' : '#14213d'; c.fillRect(0, 0, 512, 288);
    c.fillStyle = 'rgba(255,255,255,.9)'; c.font = '600 26px Inter, sans-serif'; c.fillText('Team · oggi', 28, 46);
    c.fillStyle = 'rgba(255,255,255,.45)'; c.font = '16px Inter, sans-serif'; c.fillText(new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }), 400, 44);
    const rows = [['Tutto ok', stats.ok, '#34c08e'], ['Da controllare', stats.warn, '#e8a640'], ['Problemi', stats.bad, '#ef6b80'], ['Da attivare', stats.off, '#6b7488']];
    rows.forEach((r, i) => { const y = 82 + i * 44, w = Math.max(.06, r[1] / 5) * 300 * (.92 + .08 * Math.sin(t * 2 + i)); c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(150, y, 300, 22); c.fillStyle = r[2]; c.fillRect(150, y, w, 22);
      c.fillStyle = 'rgba(255,255,255,.85)'; c.font = '16px Inter, sans-serif'; c.fillText(r[0], 28, y + 17); c.fillText(String(r[1]), 464, y + 17); });
    c.strokeStyle = '#4f86d6'; c.lineWidth = 3; c.beginPath(); for (let x = 0; x <= 484; x += 8) { const y = 262 + Math.sin(x / 38 + t * 2.4) * 8; x ? c.lineTo(28 + x, y) : c.moveTo(28 + x, y); } c.stroke();
  }

  /* ---------- costruzione ---------- */
  function mat(col, o) { return new THREE.MeshStandardMaterial(Object.assign({ color: col, roughness: .7, metalness: 0 }, o || {})); }
  function put(o, x, y, z, sh = true) { o.position.set(x, y, z); o.castShadow = sh; o.receiveShadow = true; return o; }
  function mesh(g, m, x, y, z, sh = true) { return put(new THREE.Mesh(g, m), x, y, z, sh); }
  function canvasTex(w, h) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; return { cv, ctx: cv.getContext('2d'), tex }; }
  // rettangolo con angoli arrotondati estruso (w × h, spessore t), centrato nell'origine
  function rrShape(w, h, r) { r = Math.min(r, w / 2 - .001, h / 2 - .001); const x = -w / 2, y = -h / 2, s = new THREE.Shape(); s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; }
  const GC = {};
  function rr(w, h, t, r, m, x, y, z, sh = true) { const key = [w, h, t, r].join(); const g = GC[key] || (GC[key] = (() => { const e = new THREE.ExtrudeGeometry(rrShape(w, h, r), { depth: t, bevelEnabled: false, curveSegments: 5 }); e.translate(0, 0, -t / 2); return e; })()); return put(new THREE.Mesh(g, m), x, y, z, sh); }
  // lastra orizzontale (superficie w × d, altezza t)
  function slab(w, d, t, r, m, x, y, z, sh = true) { const o = rr(w, d, t, r, m, x, y, z, sh); o.rotation.x = -Math.PI / 2; return o; }
  function blob(w, d, x, z, op) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), BLOBM(op)); m.rotation.x = -Math.PI / 2; m.position.set(x, .015, z); return m; }
  let BT = null; const BM = {};
  function BLOBM(op) { if (!BT) { const c = canvasTex(64, 64); const g = c.ctx.createRadialGradient(32, 32, 2, 32, 32, 32); g.addColorStop(0, 'rgba(20,24,36,.9)'); g.addColorStop(1, 'rgba(20,24,36,0)'); c.ctx.fillStyle = g; c.ctx.fillRect(0, 0, 64, 64); BT = c.tex; } return BM[op] || (BM[op] = new THREE.MeshBasicMaterial({ map: BT, transparent: true, opacity: op, depthWrite: false, toneMapped: false })); }
  function woodTex() {
    const c = canvasTex(1024, 1024), x = c.ctx; x.fillStyle = '#e6d3ad'; x.fillRect(0, 0, 1024, 1024);
    for (let r = 0; r < 12; r++) { const y = r * 85.33; let off = (r * 173) % 340; for (let px = -off; px < 1024; px += 340) { const v = 222 + ((r * 7 + px * 3) % 22) - 10; x.fillStyle = `rgb(${v},${v - 18},${v - 52})`; x.fillRect(px + 1, y + 1, 338, 83); x.strokeStyle = 'rgba(120,90,50,.07)'; for (let g = 0; g < 7; g++) { x.beginPath(); x.moveTo(px, y + 8 + g * 11 + (g % 3)); x.bezierCurveTo(px + 100, y + 4 + g * 11, px + 220, y + 14 + g * 11, px + 340, y + 8 + g * 11); x.stroke(); } } }
    x.fillStyle = 'rgba(90,60,30,.18)'; for (let r = 0; r <= 12; r++) x.fillRect(0, r * 85.33 - 1, 1024, 2);
    c.tex.wrapS = c.tex.wrapT = THREE.RepeatWrapping; c.tex.repeat.set(3, 2); return c.tex;
  }
  function rugTex() { const c = canvasTex(512, 512), x = c.ctx; x.fillStyle = '#d9dee8'; x.beginPath(); x.arc(256, 256, 250, 0, 6.3); x.fill(); [[220, '#c4ccdb'], [170, '#d9dee8'], [120, '#b9c3d6'], [60, '#d9dee8']].forEach(([r, col]) => { x.fillStyle = col; x.beginPath(); x.arc(256, 256, r, 0, 6.3); x.fill(); }); return c.tex; }

  function makePerson(M, k, legs) {
    const g = new THREE.Group(), L = LOOK[k] || LOOK.walker, shirt = mat(L.shirt, { roughness: .65 }), hair = mat(L.hair, { roughness: .55 });
    g.add(mesh(new THREE.CapsuleGeometry(.4, .55, 8, 20), shirt, 0, 1.6, 0));
    { const cl = mesh(new THREE.TorusGeometry(.16, .05, 8, 20), mat(0xffffff), 0, 2.02, -.03); cl.rotation.x = Math.PI / 2; g.add(cl); }
    const head = new THREE.Group(); head.position.set(0, 2.32, -.02); head.add(mesh(new THREE.SphereGeometry(.34, 28, 20), hair, 0, 0, 0));
    head.add(mesh(new THREE.SphereGeometry(.07, 8, 8), M.skinT, -.34, -.02, .02)); head.add(mesh(new THREE.SphereGeometry(.07, 8, 8), M.skinT, .34, -.02, .02));
    if (L.acc === 'phones') { head.add(mesh(new THREE.TorusGeometry(.36, .035, 8, 24, Math.PI), M.dark, 0, .02, 0)); [-1, 1].forEach(sd => { const c = mesh(new THREE.CylinderGeometry(.1, .1, .09, 16), M.dark, sd * .37, -.02, 0); c.rotation.z = Math.PI / 2; head.add(c); }); }
    if (L.acc === 'bun') head.add(mesh(new THREE.SphereGeometry(.14, 12, 10), hair, 0, .3, .2));
    if (L.acc === 'cap') { const c = mesh(new THREE.SphereGeometry(.355, 24, 14, 0, 6.28, 0, 1.15), mat(0xd4568a), 0, .02, 0); head.add(c); const br = mesh(new THREE.CylinderGeometry(.2, .2, .03, 16), mat(0xd4568a), 0, .1, -.32); br.scale.set(1, 1, .7); head.add(br); }
    g.add(head);
    const arms = [-1, 1].map(s => { const a = new THREE.Group(); a.position.set(s * .47, 1.85, -.05); const c = mesh(new THREE.CapsuleGeometry(.1, .6, 4, 10), shirt, 0, 0, -.36); c.rotation.x = Math.PI / 2; a.add(c); a.add(mesh(new THREE.SphereGeometry(.105, 12, 10), M.skinT, 0, 0, -.78)); a.rotation.x = -.35; g.add(a); return a; });
    const lg = legs ? [-1, 1].map(s => { const l = new THREE.Group(); l.position.set(s * .2, 1.0, 0); l.add(mesh(new THREE.CapsuleGeometry(.12, .6, 4, 8), M.leg2, 0, -.4, 0)); g.add(l); return l; }) : [];
    return { g, head, arms, legs: lg };
  }
  const LOOK = { guardiano: { shirt: 0x3f7fc4, hair: 0x1c1c22, acc: 'phones' }, informatico: { shirt: 0xe0802e, hair: 0x2a1d16, acc: 'phones' }, commerciale: { shirt: 0x2f6fb0, hair: 0x1c1c22, acc: 'cap' }, marketing: { shirt: 0xd4568a, hair: 0x4a2a1c, acc: 'bun' }, grafico: { shirt: 0x2fa58a, hair: 0x1c1c22 }, walker: { shirt: 0x6b7488, hair: 0x1c1c22 } };

  function desk(M, k) {
    const g = new THREE.Group(), accent = LOOK[k].shirt;
    g.add(slab(3.2, 1.5, .1, .12, M.desk, 0, 1.4, 0)); g.add(slab(3.2, .06, .12, .02, M.oak, 0, 1.4, .72)); // piano + bordo in legno
    [-1.45, 1.45].forEach(x => { g.add(rr(.07, 1.4, 1.1, .02, M.metal, x, .7, 0)); }); g.add(rr(2.9, .5, .05, .02, M.metal, 0, 1.15, -.55));
    g.add(slab(.62, 1.1, 1.0, .06, M.desk, 1.15, .52, .05)); [.9, .5].forEach(y => g.add(rr(.5, .08, .03, .02, M.metal, 1.15, y + .15, .62)));
    // monitor sottile con base
    g.add(rr(.12, .5, .08, .03, M.metal2, 0, 1.68, -.42)); g.add(slab(.7, .38, .04, .08, M.metal2, 0, 1.46, -.42));
    g.add(rr(1.8, 1.08, .07, .06, M.bezel, 0, 2.42, -.45));
    const sc = canvasTex(256, 160), scr = new THREE.Mesh(new THREE.PlaneGeometry(1.7, .96), new THREE.MeshBasicMaterial({ map: sc.tex, toneMapped: false })); scr.position.set(0, 2.42, -.405); g.add(scr);
    // dettagli sulla scrivania
    g.add(slab(.95, .3, .035, .05, M.kbw, 0, 1.46, .38)); g.add(slab(.15, .24, .04, .07, M.kbw, .7, 1.46, .4));
    const mug = mesh(new THREE.CylinderGeometry(.12, .1, .2, 20), mat(accent, { roughness: .4 }), -1.15, 1.55, .15); g.add(mug);
    const nb = slab(.5, .38, .04, .03, mat(0xf7f3ea), -.95, 1.46, .42); nb.rotation.z = .12; g.add(nb);
    g.add(mesh(new THREE.CylinderGeometry(.14, .11, .16, 16), M.pot, 1.3, 1.5, -.35)); const sp = mesh(new THREE.SphereGeometry(.15, 12, 10), M.leaf, 1.3, 1.66, -.35); sp.scale.y = .8; g.add(sp);
    const lamp = new THREE.Group(); lamp.position.set(-1.35, 1.46, -.35); lamp.add(mesh(new THREE.CylinderGeometry(.12, .14, .04, 16), M.metal2, 0, .02, 0)); const arm = mesh(new THREE.CylinderGeometry(.018, .018, .75, 8), M.metal2, 0, .4, 0); arm.rotation.z = .25; lamp.add(arm); const sh = mesh(new THREE.ConeGeometry(.14, .2, 16, 1, true), M.metal2, .17, .78, 0); sh.rotation.z = Math.PI / 2 + .3; lamp.add(sh); g.add(lamp);
    return { g, scr, sc };
  }
  function chair(M, accent) {
    const c = new THREE.Group(); c.add(mesh(new THREE.CylinderGeometry(.06, .06, .55, 10), M.metal2, 0, .55, 0));
    for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283, leg = rr(.55, .06, .06, .02, M.metal2, Math.cos(a) * .28, .22, Math.sin(a) * .28); leg.rotation.y = -a; c.add(leg); c.add(mesh(new THREE.SphereGeometry(.055, 8, 8), M.dark, Math.cos(a) * .55, .1, Math.sin(a) * .55)); }
    c.add(slab(1.0, .95, .14, .22, mat(accent, { roughness: .8 }), 0, .93, 0));
    const back = rr(.92, 1.0, .1, .2, M.chairBack, 0, 1.6, .5); back.rotation.x = .12; c.add(back); [-.52, .52].forEach(x => c.add(rr(.05, .05, .5, .02, M.metal2, x, 1.2, .02)));
    return c;
  }

  function build() {
    const wrap = document.createElement('div'); wrap.className = 'tm3d-wrap';
    const headEl = document.createElement('div'); headEl.className = 'tm3d-head'; wrap.appendChild(headEl);
    const all = document.createElement('button'); all.type = 'button'; all.className = 'tm3d-all'; all.textContent = 'Vista intera'; all.hidden = true; all.addEventListener('click', () => TM3D.onPick && TM3D.onPick('')); wrap.appendChild(all);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
    wrap.insertBefore(renderer.domElement, wrap.firstChild);
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(38, 1.6, .1, 100);
    scene.add(new THREE.HemisphereLight(0xfdfcff, 0xc9b79a, .95));
    const sun = new THREE.DirectionalLight(0xfff1dc, 2.1); sun.position.set(-9, 15, 8); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 10, bottom: -10, near: 1, far: 40 }); sun.shadow.bias = -.0004; sun.shadow.radius = 5; scene.add(sun);
    const fill = new THREE.DirectionalLight(0xcfe0ff, .45); fill.position.set(8, 9, 10); scene.add(fill);

    const wt = woodTex();
    const M = { floor: mat(0xffffff, { map: wt, roughness: .55 }), slab: mat(0xe8e4da, { roughness: .9 }), desk: mat(0xfafafa, { roughness: .45 }), oak: mat(0xd9b97e, { roughness: .55 }), metal: mat(0x1f2230, { roughness: .45, metalness: .5 }), metal2: mat(0x4a4f5e, { roughness: .4, metalness: .6 }), bezel: mat(0x14161d, { roughness: .35 }), dark: mat(0x23262e, { roughness: .5 }),
      kbw: mat(0xeceef2, { roughness: .5 }), chairBack: mat(0x2b2e36, { roughness: .9 }), skinT: mat(0xe0b08a, { roughness: .6 }), pot: mat(0xd9d2c4), leaf: mat(0x3f9a62, { roughness: .8 }), wall: mat(0xf7f5ef, { roughness: 1 }), wall2: mat(0xf0ede4, { roughness: 1 }), wain: mat(0xdde5ee, { roughness: 1 }), white: mat(0xffffff, { roughness: .5 }), leg2: mat(0x2e3340), glass: mat(0xbfdcf5, { transparent: true, opacity: .55, roughness: .1 }), sofa: mat(0x6f86a8, { roughness: .9 }), wood: mat(0xe3cc9c, { roughness: .6 }), paper: mat(0xffffff, { roughness: .5 }) };
    M.floor.map = wt;
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(17, 12), M.floor); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl);
    scene.add(mesh(new THREE.BoxGeometry(17, .35, 12), M.slab, 0, -.18, 0, false));
    // pareti: fondo e sinistra, con zoccolo e fascia
    scene.add(mesh(new THREE.BoxGeometry(17.4, 5.2, .3), M.wall, 0, 2.6, -6.15, false)); scene.add(mesh(new THREE.BoxGeometry(.3, 5.2, 12.2), M.wall2, -8.65, 2.6, 0, false));
    scene.add(mesh(new THREE.BoxGeometry(17.4, 1.5, .34), M.wain, 0, .75, -6.13, false)); scene.add(mesh(new THREE.BoxGeometry(.34, 1.5, 12.2), M.wain, -8.63, .75, 0, false));
    scene.add(mesh(new THREE.BoxGeometry(17.4, .08, .4), M.white, 0, 1.52, -6.11, false)); scene.add(mesh(new THREE.BoxGeometry(.4, .08, 12.2), M.white, -8.61, 1.52, 0, false));
    // finestra sul fondo-sinistra (parete sinistra): cielo + montanti
    const win = canvasTex(256, 256), wg = win.ctx.createLinearGradient(0, 0, 0, 256); wg.addColorStop(0, '#9fd0f5'); wg.addColorStop(1, '#eaf5ff'); win.ctx.fillStyle = wg; win.ctx.fillRect(0, 0, 256, 256); win.ctx.fillStyle = 'rgba(255,255,255,.8)'; [[60, 90, 50], [170, 60, 36]].forEach(([x, y, r]) => { win.ctx.beginPath(); win.ctx.ellipse(x, y, r, r * .45, 0, 0, 6.3); win.ctx.fill(); }); win.tex.needsUpdate = true;
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.9), new THREE.MeshBasicMaterial({ map: win.tex, toneMapped: false })); sky.rotation.y = Math.PI / 2; sky.position.set(-8.48, 3.0, 2.4); scene.add(sky);
    [-2.3, 0, 2.3].forEach(dz => scene.add(mesh(new THREE.BoxGeometry(.08, 3.0, .07), M.metal, -8.44, 3.0, 2.4 + dz, false))); [1.5, 4.5].forEach(y => scene.add(mesh(new THREE.BoxGeometry(.08, .07, 4.7), M.metal, -8.44, y, 2.4, false)));
    scene.add(mesh(new THREE.BoxGeometry(.3, .08, 4.9), M.white, -8.4, 1.5, 2.4, false));

    // lavagna kanban
    const kb = canvasTex(512, 256), kx = kb.ctx; kx.fillStyle = '#fff'; kx.fillRect(0, 0, 512, 256); kx.fillStyle = '#6b7488'; kx.font = '600 20px Inter, sans-serif'; ['DA FARE', 'IN CORSO', 'FATTO'].forEach((t, i) => kx.fillText(t, 18 + i * 170, 30)); kx.strokeStyle = '#e5e8ef'; kx.lineWidth = 2; [168, 338].forEach(x => { kx.beginPath(); kx.moveTo(x, 12); kx.lineTo(x, 244); kx.stroke(); }); kb.tex.needsUpdate = true;
    scene.add(rr(5.6, 3, .1, .12, M.metal, -3.2, 2.95, -5.9)); const board = new THREE.Mesh(new THREE.PlaneGeometry(5.3, 2.7), new THREE.MeshBasicMaterial({ map: kb.tex, toneMapped: false })); board.position.set(-3.2, 2.95, -5.83); scene.add(board);
    const notes = [], NC = [0xffd966, 0xff9bb5, 0x8fd3a6, 0x9cc7ff, 0xffb072];
    [[0, 3], [1, 2], [2, 3]].forEach(([col, n]) => { for (let r = 0; r < n; r++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(.85, .62), new THREE.MeshBasicMaterial({ color: NC[(col * 3 + r * 2) % 5], toneMapped: false })); p.position.set(-5.3 + col * 1.74 + (r % 2) * .08, 3.4 - r * .78, -5.8); p.rotation.z = (r - 1) * .04; p.userData = { b: p.rotation.z, ph: col + r }; scene.add(p); notes.push(p); } });
    // schermo grande a muro
    const tv = canvasTex(512, 288); scene.add(rr(4.4, 2.6, .16, .1, M.bezel, 3.6, 3.05, -5.9));
    const tvm = new THREE.Mesh(new THREE.PlaneGeometry(4.18, 2.38), new THREE.MeshBasicMaterial({ map: tv.tex, toneMapped: false })); tvm.position.set(3.6, 3.05, -5.8); scene.add(tvm);
    // orologio con le ore vere
    const clock = new THREE.Group(); clock.position.set(.35, 3.95, -5.82); const cf = mesh(new THREE.CylinderGeometry(.55, .55, .08, 40), M.white, 0, 0, 0, false); cf.rotation.x = Math.PI / 2; clock.add(cf); const cr = mesh(new THREE.TorusGeometry(.55, .04, 8, 40), M.metal, 0, 0, .04, false); clock.add(cr);
    const hH = mesh(new THREE.BoxGeometry(.05, .3, .03), M.dark, 0, 0, .07, false), hM = mesh(new THREE.BoxGeometry(.035, .44, .03), M.dark, 0, 0, .09, false);
    [hH, hM].forEach(h => { h.geometry.translate(0, h.geometry.parameters.height / 2, 0); h.position.set(0, 0, h === hH ? .07 : .09); clock.add(h); }); scene.add(clock);
    // poster a parete sinistra
    [[-5.1, '#3f7fc4', '#f6c453'], [-3.9, '#d4568a', '#fff'], [-2.7, '#2fa58a', '#fff']].forEach(([z, a, b]) => { const c = canvasTex(128, 160); c.ctx.fillStyle = '#fff'; c.ctx.fillRect(0, 0, 128, 160); c.ctx.fillStyle = a; c.ctx.fillRect(14, 14, 100, 90); c.ctx.fillStyle = b; c.ctx.beginPath(); c.ctx.arc(64, 59, 22, 0, 6.3); c.ctx.fill(); c.ctx.fillStyle = '#c9cfdb'; c.ctx.fillRect(14, 120, 70, 8); c.ctx.fillRect(14, 136, 44, 8); c.tex.needsUpdate = true;
      const fr = rr(.85, 1.05, .05, .02, M.metal, -8.45, 3.3, z + 5.4); fr.rotation.y = Math.PI / 2; scene.add(fr); const p = new THREE.Mesh(new THREE.PlaneGeometry(.75, .95), new THREE.MeshBasicMaterial({ map: c.tex, toneMapped: false })); p.rotation.y = Math.PI / 2; p.position.set(-8.41, 3.3, z + 5.4); scene.add(p); });
    // libreria a sinistra
    const shelf = new THREE.Group(); shelf.position.set(-8.1, 0, -2.2); shelf.add(mesh(new THREE.BoxGeometry(.7, 3.4, 3.2), M.wood, 0, 1.7, 0)); const BC = [0x3f7fc4, 0xe0802e, 0x3f9a62, 0xd4568a, 0x8a6ad0, 0xf0c04a];
    [.75, 1.55, 2.35, 3.1].forEach((y, r) => { shelf.add(mesh(new THREE.BoxGeometry(.5, .06, 3.1), M.white, .1, y - .05, 0)); for (let i = 0; i < 9; i++) { const h = .45 + ((i * 7 + r * 3) % 5) * .07; shelf.add(mesh(new THREE.BoxGeometry(.4, h, .22), mat(BC[(i + r) % 6], { roughness: .6 }), .2, y + h / 2 - .02, -1.3 + i * .32)); } }); scene.add(shelf);
    // angolo caffè
    const cafe = new THREE.Group(); cafe.position.set(-7.0, 0, 4.6); cafe.add(mesh(new THREE.CylinderGeometry(.7, .7, .06, 40), M.oak, 0, 1.1, 0)); cafe.add(mesh(new THREE.CylinderGeometry(.07, .07, 1.1, 10), M.metal2, 0, .55, 0)); cafe.add(mesh(new THREE.CylinderGeometry(.4, .4, .05, 24), M.metal2, 0, .03, 0));
    [-.25, .3].forEach(x => cafe.add(mesh(new THREE.CylinderGeometry(.11, .09, .2, 16), M.white, x, 1.24, x * .4))); cafe.add(mesh(new THREE.CylinderGeometry(.18, .14, .3, 16), M.pot, 0, 1.3, -.2)); scene.add(cafe); scene.add(blob(2.2, 2.2, -7.0, 4.6, .35));
    [[-6.0, 3.3], [-5.9, 5.0]].forEach(([x, z]) => { const st = mesh(new THREE.CylinderGeometry(.34, .3, .62, 24), mat(0xe9b44c, { roughness: .8 }), x, .31, z); scene.add(st); scene.add(blob(1, 1, x, z, .3)); });
    // divano nell'angolo destro
    const sofa = new THREE.Group(); sofa.position.set(7.0, 0, 4.2); sofa.rotation.y = -Math.PI / 2 + .0; sofa.add(slab(3.0, 1.1, .5, .2, M.sofa, 0, .45, 0)); sofa.add(rr(3.0, .9, .28, .2, M.sofa, 0, 1.0, .5)); [-1.4, 1.4].forEach(x => sofa.add(rr(.25, .8, .9, .1, M.sofa, x, .75, 0)));
    [-.8, .7].forEach((x, i) => { const cu = rr(.62, .55, .16, .12, mat(i ? 0xe9b44c : 0xd4568a, { roughness: .9 }), x, 1.05, .2); cu.rotation.x = -.25; sofa.add(cu); }); scene.add(sofa); scene.add(blob(4.2, 2.2, 7.0, 4.2, .35));
    const cooler = new THREE.Group(); cooler.position.set(7.8, 0, -4.2); cooler.add(rr(.8, 1.5, .8, .1, M.white, 0, .75, 0)); cooler.add(mesh(new THREE.CylinderGeometry(.3, .3, .8, 24), mat(0x9fd0f5, { transparent: true, opacity: .7, roughness: .1 }), 0, 1.9, 0, false)); scene.add(cooler); scene.add(blob(1.6, 1.6, 7.8, -4.2, .3));
    // tappeto tondo centrale (dove prima c'era la sfera)
    const rug = new THREE.Mesh(new THREE.CircleGeometry(2.4, 64), new THREE.MeshStandardMaterial({ map: rugTex(), roughness: 1, transparent: true })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, .02, .3); rug.receiveShadow = true; scene.add(rug);

    const plant = (x, z, s = 1) => { const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(.34 * s, .26 * s, .55 * s, 24), M.pot, 0, .27 * s, 0));
      for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28, l = mesh(new THREE.ConeGeometry(.12 * s, 1.2 * s, 8), M.leaf, Math.cos(a) * .2 * s, 1.0 * s, Math.sin(a) * .2 * s); l.rotation.set(Math.sin(a) * .4, 0, -Math.cos(a) * .4); g.add(l); }
      g.position.set(x, 0, z); scene.add(g); scene.add(blob(1.4 * s, 1.4 * s, x, z, .3)); return g; };
    plant(7.9, -5.3, 1.15); plant(-7.9, 5.6, .9); plant(7.9, 5.6, 1); plant(-7.7, -5.4, 1.05); plant(-.9, 5.5, .8);

    const desks = {}, hits = [];
    Object.keys(POS).forEach((k, idx) => {
      const [x, z] = POS[k], g = new THREE.Group(); g.position.set(x, 0, z);
      const D = desk(M, k); g.add(D.g);
      const ch = chair(M, LOOK[k].shirt); ch.position.set(0, 0, 1.25); g.add(ch);
      const P = makePerson(M, k, false); P.g.position.set(0, 0, 1.15); g.add(P.g);
      g.add(blob(4.2, 3.0, 0, .6, .38)); g.add(blob(1.8, 1.8, 0, 1.25, .3));
      const hit = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.4, 3.6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); hit.position.set(0, 1.5, .5); hit.userData.k = k; g.add(hit); hits.push(hit);
      const ring = new THREE.Mesh(new THREE.RingGeometry(2.3, 2.42, 64), new THREE.MeshBasicMaterial({ color: 0x3362ab, transparent: true, opacity: 0, side: THREE.DoubleSide, toneMapped: false })); ring.rotation.x = -Math.PI / 2; ring.position.set(0, .03, .5); g.add(ring);
      g.scale.setScalar(.001); scene.add(g);
      desks[k] = { g, cv: D.sc.cv, ctx: D.sc.ctx, tex: D.sc.tex, person: P.g, head: P.head, arms: P.arms, chair: ch, ring, born: performance.now() + idx * 140, lift: 0, on: false, st: 'off', ph: idx * 1.3, flash: 0, nx: performance.now() + 3000 + idx * 2200, ts: 0, act: '', dir: 1 };
    });

    // corriere: porta i report da una scrivania all'altra
    const W = makePerson(M, 'walker', true); const paper = mesh(new THREE.BoxGeometry(.32, .04, .42), M.paper, 0, 1.55, -.75, false); W.g.add(paper); scene.add(W.g); W.g.position.set(.9, 0, .4);

    return { all, headEl, wrap, renderer, scene, cam, desks, hits, sun, fill, M, notes, kb, tv, clock, hH, hM, walker: { P: W, i: 0, wait: 0, route: [], key: '', pos: new THREE.Vector2(.9, .4) }, ray: new THREE.Raycaster(), mouse: new THREE.Vector2(), pills: {}, sel: '', hover: '', az: 0, cur: new THREE.Vector3(0, 15.6, 13.4), look: new THREE.Vector3(0, 1.5, -.9), raf: 0, t0: performance.now(), last: performance.now(), gone: 0, w: 0, h: 0, drag: null, stats: { ok: 0, warn: 0, bad: 0, off: 5 } };
  }

  const HOME = () => ({ p: new THREE.Vector3(0, 15.6, 13.4), l: new THREE.Vector3(0, 1.5, -.9) });
  function pose(sel) {
    if (sel && POS[sel]) { const [x, z] = POS[sel]; return { p: new THREE.Vector3(x * .75, 6.3, z + 6.6), l: new THREE.Vector3(x * .9, 1.4, z) }; }
    return HOME();
  }
  function route(s) {
    const act = Object.keys(POS).filter(k => s.desks[k].on), key = act.join(','); if (s.walker.key === key) return; s.walker.key = key;
    const order = ['guardiano', 'informatico', 'commerciale', 'grafico', 'marketing'].filter(k => act.includes(k)), R = [{ x: .9, z: .4 }];
    order.forEach(k => { const [x, z] = POS[k], sx = z < 0 ? x + 1.95 : x + 2.0, sz = z < 0 ? -1.3 : z + .3; R.push({ x: sx, z: .3 }); R.push({ x: sx, z: sz, stop: k }); R.push({ x: sx, z: .3 }); });
    R.push({ x: .9, z: .4 }); s.walker.route = R; s.walker.i = 0;
  }

  function frame() {
    const s = I; if (!s) return;
    if (!s.wrap.isConnected) { if (++s.gone > 90) { s.raf = 0; return; } s.raf = requestAnimationFrame(frame); return; } s.gone = 0;
    const now = performance.now(), dt = Math.min(.05, (now - s.last) / 1000); s.last = now; const t = RM ? 0 : (now - s.t0) / 1000;
    const w = s.wrap.clientWidth, h = s.wrap.clientHeight; if (w && h && (w !== s.w || h !== s.h)) { s.w = w; s.h = h; s.renderer.setSize(w, h, false); s.cam.aspect = w / h; s.cam.updateProjectionMatrix(); }
    const tg = pose(s.sel), k = RM ? 1 : .06;
    s.cur.lerp(tg.p, k); s.look.lerp(tg.l, k);
    const drift = !s.drag && !RM ? Math.sin(t * .13) * (s.sel ? .03 : .07) : 0;
    const off = s.cur.clone().sub(s.look); off.applyAxisAngle(new THREE.Vector3(0, 1, 0), s.az + drift); off.y += Math.sin(t * .17) * (RM ? 0 : .12); s.cam.position.copy(s.look).add(off); s.cam.lookAt(s.look);
    const dark = s.dark, st = { ok: css('--ok'), warn: css('--warn'), bad: css('--bad'), off: '#1d2230' };
    s.M.floor.color.set(dark ? 0x6b7691 : 0xffffff); s.M.slab.color.set(dark ? 0x2a3249 : 0xe8e4da); s.M.wall.color.set(dark ? 0x2f3957 : 0xf7f5ef); s.M.wall2.color.set(dark ? 0x28314d : 0xf0ede4); s.M.wain.color.set(dark ? 0x3a4668 : 0xdde5ee); s.M.desk.color.set(dark ? 0xc9cfdd : 0xfafafa); s.M.sofa.color.set(dark ? 0x4d5f80 : 0x6f86a8);
    s.sun.intensity = dark ? 1.25 : 2.1; s.fill.intensity = dark ? .3 : .45;
    route(s);
    Object.keys(s.desks).forEach(key => {
      const d = s.desks[key], a = Math.min(1, Math.max(0, (now - d.born) / 700)); d.g.scale.setScalar(Math.max(.001, RM ? 1 : ease(a)));
      const want = (key === s.hover ? .12 : 0) + (key === s.sel ? .1 : 0); d.lift += (want - d.lift) * .15; d.g.position.y = d.lift;
      d.ring.material.opacity = key === s.sel ? .55 + .25 * Math.sin(t * 3) : 0; d.ring.material.color.set(css('--acc'));
      if (d.on) {
        d.person.visible = true;
        // comportamenti ogni tanto: si guarda attorno, si stiracchia, beve
        if (!RM && now > d.nx) { const r = Math.random(); d.act = r < .4 ? 'look' : r < .7 ? 'stretch' : 'sip'; d.ts = now; d.dir = Math.random() < .5 ? -1 : 1; d.nx = now + 8000 + Math.random() * 9000; }
        const e = d.act ? (now - d.ts) / 1700 : 2, kk = e < 1 ? Math.sin(e * Math.PI) : 0, hover = key === s.hover ? 1 : 0;
        const ty = Math.sin(t * 9 + d.ph) * .07, ty2 = Math.sin(t * 9 + d.ph + 2) * .07;
        d.arms[0].rotation.x = -.35 + ty + (d.act === 'stretch' ? kk * 2.1 : 0) + hover * 1.5 * (.5 + .5 * Math.sin(t * 8));
        d.arms[1].rotation.x = -.35 + ty2 + (d.act === 'stretch' ? kk * 2.1 : d.act === 'sip' ? kk * 1.5 : 0);
        d.head.rotation.y = Math.sin(t * .7 + d.ph) * .2 + (d.act === 'look' ? kk * 1.1 * d.dir : 0); d.head.rotation.x = d.act === 'sip' ? -kk * .25 : 0;
        d.person.position.y = Math.sin(t * 1.4 + d.ph) * .02 + (d.act === 'stretch' ? kk * .06 : 0); d.chair.rotation.y = Math.sin(t * .5 + d.ph) * .05 + (d.act === 'look' ? kk * .25 * d.dir : 0);
      } else d.person.visible = false;
      if (d.flash > 0) d.flash = Math.max(0, d.flash - dt * 1.4);
      if (!d.tick || now - d.tick > 90) { d.tick = now; drawScreen(key, d.ctx, t, st[d.st] || st.off, d.on, d.flash); d.tex.needsUpdate = true; }
    });
    // lavagna, schermo grande, orologio
    s.notes.forEach(p => { p.rotation.z = p.userData.b + Math.sin(t * 1.2 + p.userData.ph) * .02; });
    if (!s.tvT || now - s.tvT > 110) { s.tvT = now; drawTv(s.tv.ctx, t, s.stats, dark); s.tv.tex.needsUpdate = true; }
    const dn = new Date(), mn = dn.getMinutes() + dn.getSeconds() / 60; s.hM.rotation.z = -mn / 60 * 6.283; s.hH.rotation.z = -((dn.getHours() % 12) + mn / 60) / 12 * 6.283;
    // corriere
    const W = s.walker, R = W.route;
    if (R.length > 1 && !RM) {
      if (W.wait > 0) W.wait -= dt;
      else { const n = R[W.i % R.length], dx = n.x - W.pos.x, dz = n.z - W.pos.y, dist = Math.hypot(dx, dz);
        if (dist < .08) { if (n.stop) { W.wait = 1.4; const dd = s.desks[n.stop]; if (dd) dd.flash = 1; } W.i = (W.i + 1) % R.length; }
        else { const sp = 1.9 * dt; W.pos.x += dx / dist * Math.min(sp, dist); W.pos.y += dz / dist * Math.min(sp, dist); W.P.g.rotation.y = Math.atan2(-dx, -dz); }
      }
      const mv = W.wait > 0 ? 0 : 1, ph = t * 8;
      W.P.g.position.set(W.pos.x, Math.abs(Math.sin(ph)) * .06 * mv, W.pos.y);
      W.P.legs.forEach((l, i) => { l.rotation.x = Math.sin(ph + i * 3.14) * .6 * mv; }); W.P.arms.forEach((a, i) => { a.rotation.x = -1.0 + Math.sin(ph + i * 3.14) * .1 * mv; });
      W.P.g.visible = true;
    } else W.P.g.visible = R.length > 1;
    s.renderer.render(s.scene, s.cam);
    // nomi + attività sopra le scrivanie (come nel video)
    const v = new THREE.Vector3(), slot = Math.floor(t / 5);
    Object.keys(s.pills).forEach(key => {
      const el = s.pills[key], d = s.desks[key]; v.set(POS[key][0], 3.55 + d.lift, POS[key][1] - .2).project(s.cam); const vis = v.z < 1; el.style.opacity = vis ? '' : '0'; el.style.transform = `translate(${(v.x * .5 + .5) * w}px, ${(-v.y * .5 + .5) * h}px) translate(-50%, -100%)`;
      const sm = el._sm; let txt; if (!d.on) txt = 'Da attivare'; else if (d.st === 'warn' || d.st === 'bad') txt = d.st === 'bad' ? 'Problema da guardare' : 'Ha trovato qualcosa'; else txt = ACT[key][(slot + d.ph | 0) % 3];
      if (sm.textContent !== txt) sm.textContent = txt;
    });
    s.raf = requestAnimationFrame(frame);
  }

  function bindInput(s) {
    const cv = s.renderer.domElement;
    const pick = e => { const r = cv.getBoundingClientRect(); s.mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); s.ray.setFromCamera(s.mouse, s.cam); const h = s.ray.intersectObjects(s.hits, false)[0]; return h ? h.object.userData.k : ''; };
    cv.addEventListener('pointerdown', e => { s.drag = { x: e.clientX, az: s.az, moved: false }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', e => {
      if (s.drag) { const dx = e.clientX - s.drag.x; if (Math.abs(dx) > 5) s.drag.moved = true; if (s.drag.moved) s.az = Math.max(-.6, Math.min(.6, s.drag.az - dx / 300)); }
      else { s.hover = pick(e); cv.style.cursor = s.hover ? 'pointer' : 'grab'; }
    });
    cv.addEventListener('pointerup', e => { const d = s.drag; s.drag = null; if (d && !d.moved) { const k = pick(e); if (k && TM3D.onPick) TM3D.onPick(k); } });
    cv.addEventListener('pointerleave', () => { s.hover = ''; });
    cv.addEventListener('dblclick', () => { s.az = 0; });
  }

  const TM3D = {
    onPick: null,
    ok() { try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch { return false; } },
    show(box, data) {
      if (!I) { I = build(); bindInput(I); }
      const s = I; s.dark = isDark();
      if (s.wrap.parentNode !== box) box.appendChild(s.wrap);
      if (data.stats) s.stats = data.stats;
      if (data.head) s.headEl.innerHTML = `<b>${data.head.t}</b><span>${data.head.s}</span>`;
      data.agents.forEach(a => {
        const d = s.desks[a.k]; if (!d) return; d.on = !!a.on; d.st = a.st;
        let el = s.pills[a.k];
        if (!el) { el = document.createElement('button'); el.type = 'button'; el.dataset.tm = a.k; el.addEventListener('click', () => TM3D.onPick && TM3D.onPick(a.k)); s.wrap.appendChild(el); s.pills[a.k] = el; }
        el.className = 'tm3d-pill st-' + a.st + (a.k === data.sel ? ' on' : ''); el.innerHTML = `<i></i><b>${a.n}</b><small></small>`; el._sm = el.querySelector('small');
      });
      s.sel = data.sel || ''; s.all.hidden = !s.sel;
      if (!s.raf) s.raf = requestAnimationFrame(frame);
    }
  };
  window.TM3D = TM3D;
})();
