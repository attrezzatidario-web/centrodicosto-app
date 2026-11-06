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
  function mat(col, o) { return new THREE.MeshStandardMaterial(Object.assign({ color: col, roughness: .75, metalness: 0 }, o || {})); }
  function mesh(g, m, x, y, z, sh = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = sh; o.receiveShadow = true; return o; }
  function canvasTex(w, h) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; return { cv, ctx: cv.getContext('2d'), tex }; }

  function makePerson(M, shirtCol, legs) {
    const g = new THREE.Group(), shirt = mat(shirtCol, { roughness: .7 });
    g.add(mesh(new THREE.CapsuleGeometry(.4, .55, 6, 16), shirt, 0, 1.6, 0));
    const head = mesh(new THREE.SphereGeometry(.34, 24, 18), M.skin, 0, 2.32, -.02); g.add(head);
    const arms = [-1, 1].map(s => { const a = new THREE.Group(); a.position.set(s * .47, 1.85, -.05); const c = mesh(new THREE.CapsuleGeometry(.1, .62, 4, 10), shirt, 0, 0, -.38); c.rotation.x = Math.PI / 2; a.add(c); a.rotation.x = -.35; g.add(a); return a; });
    const lg = legs ? [-1, 1].map(s => { const l = new THREE.Group(); l.position.set(s * .2, 1.0, 0); l.add(mesh(new THREE.CapsuleGeometry(.12, .6, 4, 8), M.leg2, 0, -.4, 0)); g.add(l); return l; }) : [];
    return { g, head, arms, legs: lg, shirt };
  }

  function build() {
    const wrap = document.createElement('div'); wrap.className = 'tm3d-wrap';
    const headEl = document.createElement('div'); headEl.className = 'tm3d-head'; wrap.appendChild(headEl);
    const all = document.createElement('button'); all.type = 'button'; all.className = 'tm3d-all'; all.textContent = 'Vista intera'; all.hidden = true; all.addEventListener('click', () => TM3D.onPick && TM3D.onPick('')); wrap.appendChild(all);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    wrap.insertBefore(renderer.domElement, wrap.firstChild);
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(38, 1.6, .1, 100);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb9a98a, 1.05));
    const sun = new THREE.DirectionalLight(0xfff4e0, 1.9); sun.position.set(-7, 15, 9); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 10, bottom: -10, near: 1, far: 40 }); sun.shadow.bias = -.0004; sun.shadow.radius = 4; scene.add(sun);

    const M = { floor: mat(0xf1ead9, { roughness: 1 }), rim: mat(0xdcc08a), wood: mat(0xe6cf9d), leg: mat(0xb9a47c), dark: mat(0x23262e, { roughness: .5 }), chair: mat(0x2b2e36), kb: mat(0x3a3d46), skin: mat(0x15151b, { roughness: .6 }), pot: mat(0xb9b0a0), leaf: mat(0x3f9a62, { roughness: .8 }),
      wall: mat(0xf4efe3, { roughness: 1 }), wall2: mat(0xebe4d3, { roughness: 1 }), white: mat(0xffffff, { roughness: .6 }), leg2: mat(0x2e3340), blue: mat(0x8fc4ee, { transparent: true, opacity: .75 }), paper: mat(0xffffff, { roughness: .5 }) };
    scene.add(mesh(new THREE.BoxGeometry(17, .4, 12), M.floor, 0, -.2, 0, false));
    [[0, 6.1, 17.6], [0, -6.1, 17.6]].forEach(([x, z, w]) => scene.add(mesh(new THREE.BoxGeometry(w, .5, .4), M.rim, x, -.15, z, false)));
    [[-8.7], [8.7]].forEach(([x]) => scene.add(mesh(new THREE.BoxGeometry(.4, .5, 12.4), M.rim, x, -.15, 0, false)));
    // pareti (fondo e sinistra)
    scene.add(mesh(new THREE.BoxGeometry(17.4, 5.2, .3), M.wall, 0, 2.6, -6.15, false)); scene.add(mesh(new THREE.BoxGeometry(.3, 5.2, 12.2), M.wall2, -8.65, 2.6, 0, false));
    scene.add(mesh(new THREE.BoxGeometry(17.4, .3, .45), M.rim, 0, .15, -5.95, false)); scene.add(mesh(new THREE.BoxGeometry(.45, .3, 12.2), M.rim, -8.45, .15, 0, false));

    // lavagna kanban
    const kb = canvasTex(512, 256); const kx = kb.ctx; kx.fillStyle = '#fff'; kx.fillRect(0, 0, 512, 256); kx.fillStyle = '#6b7488'; kx.font = '600 20px Inter, sans-serif'; ['DA FARE', 'IN CORSO', 'FATTO'].forEach((t, i) => kx.fillText(t, 18 + i * 170, 30)); kx.strokeStyle = '#e5e8ef'; kx.lineWidth = 2; [168, 338].forEach(x => { kx.beginPath(); kx.moveTo(x, 12); kx.lineTo(x, 244); kx.stroke(); }); kb.tex.needsUpdate = true;
    scene.add(mesh(new THREE.BoxGeometry(5.6, 3, .12), M.wood, -3.2, 2.9, -5.9, false));
    const board = new THREE.Mesh(new THREE.PlaneGeometry(5.3, 2.7), new THREE.MeshBasicMaterial({ map: kb.tex })); board.position.set(-3.2, 2.9, -5.83); scene.add(board);
    const notes = []; const NC = [0xffd966, 0xff9bb5, 0x8fd3a6, 0x9cc7ff, 0xffb072];
    [[0, 3], [1, 2], [2, 3]].forEach(([col, n]) => { for (let r = 0; r < n; r++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(.85, .62), new THREE.MeshBasicMaterial({ color: NC[(col * 3 + r * 2) % 5] })); p.position.set(-5.3 + col * 1.74 + (r % 2) * .08, 3.35 - r * .78, -5.8); p.rotation.z = (r - 1) * .04; p.userData = { b: p.rotation.z, ph: col + r }; scene.add(p); notes.push(p); } });
    // schermo grande
    const tv = canvasTex(512, 288); scene.add(mesh(new THREE.BoxGeometry(4.4, 2.6, .16), M.dark, 3.6, 3.0, -5.9, false));
    const tvm = new THREE.Mesh(new THREE.PlaneGeometry(4.1, 2.3), new THREE.MeshBasicMaterial({ map: tv.tex })); tvm.position.set(3.6, 3.0, -5.8); scene.add(tvm);
    // orologio (ore vere)
    const clock = new THREE.Group(); clock.position.set(.35, 3.9, -5.82); clock.add(new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .08, 32), M.white)); clock.children[0].rotation.x = Math.PI / 2; clock.add(mesh(new THREE.CylinderGeometry(.58, .58, .05, 32), M.dark, 0, 0, -.03, false)); clock.children[1].rotation.x = Math.PI / 2;
    const hH = mesh(new THREE.BoxGeometry(.05, .3, .03), M.dark, 0, 0, .07, false), hM = mesh(new THREE.BoxGeometry(.035, .44, .03), M.dark, 0, 0, .09, false);
    [hH, hM].forEach(h => { h.geometry.translate(0, h.geometry.parameters.height / 2, 0); h.position.set(0, 0, h === hH ? .07 : .09); clock.add(h); }); scene.add(clock);
    // libreria a sinistra
    const shelf = new THREE.Group(); shelf.position.set(-8.1, 0, -1.4); shelf.add(mesh(new THREE.BoxGeometry(.7, 3.4, 3.2), M.wood, 0, 1.7, 0)); const BC = [0x3f7fc4, 0xe0802e, 0x3f9a62, 0xd4568a, 0x8a6ad0, 0xf0c04a];
    [.75, 1.55, 2.35, 3.1].forEach((y, r) => { for (let i = 0; i < 9; i++) { const h = .45 + ((i * 7 + r * 3) % 5) * .07; shelf.add(mesh(new THREE.BoxGeometry(.4, h, .22), mat(BC[(i + r) % 6]), .2, y + h / 2 - .05, -1.3 + i * .32)); } }); scene.add(shelf);
    // angolo caffè e distributore dell'acqua
    const cafe = new THREE.Group(); cafe.position.set(-7.2, 0, 4.4); cafe.add(mesh(new THREE.CylinderGeometry(.7, .7, .08, 32), M.wood, 0, 1.1, 0)); cafe.add(mesh(new THREE.CylinderGeometry(.1, .1, 1.1, 10), M.leg, 0, .55, 0));
    [-.25, .3].forEach(x => cafe.add(mesh(new THREE.CylinderGeometry(.11, .09, .2, 16), M.white, x, 1.24, x * .4))); scene.add(cafe);
    const cooler = new THREE.Group(); cooler.position.set(7.8, 0, -4.2); cooler.add(mesh(new THREE.BoxGeometry(.8, 1.5, .8), M.white, 0, .75, 0)); cooler.add(mesh(new THREE.CylinderGeometry(.3, .3, .8, 20), M.blue, 0, 1.9, 0, false)); scene.add(cooler);

    const plant = (x, z, s = 1) => { const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(.34 * s, .26 * s, .55 * s, 20), M.pot, 0, .27 * s, 0));
      for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28, l = mesh(new THREE.ConeGeometry(.12 * s, 1.1 * s, 8), M.leaf, Math.cos(a) * .18 * s, .95 * s, Math.sin(a) * .18 * s); l.rotation.set(Math.sin(a) * .35, 0, -Math.cos(a) * .35); g.add(l); }
      g.position.set(x, 0, z); scene.add(g); return g; };
    plant(7.9, -5.3, 1.15); plant(-7.9, 5.3, .9); plant(7.9, 5.3); plant(-7.7, -5.3, 1);

    const desks = {}, hits = [];
    Object.keys(POS).forEach((k, idx) => {
      const [x, z] = POS[k], g = new THREE.Group(); g.position.set(x, 0, z);
      g.add(mesh(new THREE.BoxGeometry(3.1, .14, 1.5), M.wood, 0, 1.45, 0));
      [-1.45, 1.45].forEach(lx => g.add(mesh(new THREE.BoxGeometry(.1, 1.4, 1.3), M.leg, lx, .72, 0)));
      g.add(mesh(new THREE.BoxGeometry(.7, .04, .26), M.kb, 0, 1.54, .35));
      g.add(mesh(new THREE.BoxGeometry(.18, .5, .14), M.dark, 0, 1.78, -.4)); g.add(mesh(new THREE.BoxGeometry(.7, .06, .4), M.dark, 0, 1.54, -.4));
      g.add(mesh(new THREE.BoxGeometry(1.75, 1.05, .08), M.dark, 0, 2.4, -.45));
      g.add(mesh(new THREE.CylinderGeometry(.13, .11, .2, 14), M.white, 1.1, 1.62, .1)); // tazza
      const sc = canvasTex(256, 160); const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.62, .92), new THREE.MeshBasicMaterial({ map: sc.tex })); scr.position.set(0, 2.4, -.4); g.add(scr);
      const chair = new THREE.Group(); chair.position.set(0, 0, 1.25);
      chair.add(mesh(new THREE.CylinderGeometry(.08, .08, .8, 10), M.chair, 0, .4, 0)); chair.add(mesh(new THREE.CylinderGeometry(.5, .5, .1, 24), M.chair, 0, .95, 0)); chair.add(mesh(new THREE.BoxGeometry(.95, 1.0, .14), M.chair, 0, 1.55, .42));
      g.add(chair);
      const P = makePerson(M, SHIRT[k], false); P.g.position.set(0, 0, 1.15); g.add(P.g);
      const hit = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.4, 3.6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); hit.position.set(0, 1.5, .5); hit.userData.k = k; g.add(hit); hits.push(hit);
      const ring = new THREE.Mesh(new THREE.RingGeometry(2.3, 2.45, 64), new THREE.MeshBasicMaterial({ color: 0x3362ab, transparent: true, opacity: 0, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.set(0, .02, .5); g.add(ring);
      g.scale.setScalar(.001); scene.add(g);
      desks[k] = { g, cv: sc.cv, ctx: sc.ctx, tex: sc.tex, person: P.g, head: P.head, arms: P.arms, chair, ring, born: performance.now() + idx * 140, lift: 0, on: false, st: 'off', ph: idx * 1.3, flash: 0, nx: performance.now() + 3000 + idx * 2200, ts: 0, act: '', dir: 1 };
    });

    // cervello condiviso + biglietti che viaggiano
    const brain = new THREE.Group(); brain.position.set(0, 1.5, .1);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(.32, 32, 24), new THREE.MeshStandardMaterial({ color: 0x4f86d6, emissive: 0x3362ab, emissiveIntensity: .9, roughness: .3 })); brain.add(orb);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(.55, .02, 8, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .8 })); halo.rotation.x = 1.2; brain.add(halo);
    brain.add(new THREE.PointLight(0x6ea0ff, 8, 5)); scene.add(brain);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.5, 48), new THREE.MeshBasicMaterial({ color: 0x3362ab, transparent: true, opacity: .1 })); disc.rotation.x = -Math.PI / 2; disc.position.set(0, .02, .1); scene.add(disc);
    const pk = []; Object.keys(POS).forEach((k, i) => { for (let j = 0; j < 3; j++) { const p = new THREE.Mesh(new THREE.BoxGeometry(.13, .02, .17), new THREE.MeshBasicMaterial({ color: 0x1fa97a })); p.userData = { k, off: j / 3 + i * .07 }; scene.add(p); pk.push(p); } });

    // corriere: porta i report da una scrivania all'altra
    const W = makePerson(M, 0x6b7488, true); const paper = mesh(new THREE.BoxGeometry(.32, .04, .42), M.paper, 0, 1.55, -.75, false); W.g.add(paper); scene.add(W.g); W.g.position.set(.9, 0, .4);

    return { all, headEl, wrap, renderer, scene, cam, desks, hits, brain, orb, halo, disc, pk, sun, M, notes, kb, tv, clock, hH, hM, walker: { P: W, i: 0, wait: 0, route: [], key: '', pos: new THREE.Vector2(.9, .4) }, ray: new THREE.Raycaster(), mouse: new THREE.Vector2(), pills: {}, sel: '', hover: '', az: 0, cur: new THREE.Vector3(0, 15.6, 13.4), look: new THREE.Vector3(0, 1.5, -.9), raf: 0, t0: performance.now(), last: performance.now(), gone: 0, w: 0, h: 0, drag: null, stats: { ok: 0, warn: 0, bad: 0, off: 5 }, wallDark: null };
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
    s.M.floor.color.set(dark ? 0x1d2538 : 0xf1ead9); s.M.rim.color.set(dark ? 0x5d5035 : 0xdcc08a); s.M.wood.color.set(dark ? 0x8a7249 : 0xe6cf9d); s.M.wall.color.set(dark ? 0x2a3350 : 0xf4efe3); s.M.wall2.color.set(dark ? 0x232b45 : 0xebe4d3);
    s.sun.intensity = dark ? 1.2 : 1.9;
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
    // cervello e biglietti
    s.brain.position.y = 1.5 + Math.sin(t * 1.3) * .1; s.halo.rotation.z = t * .8; s.orb.scale.setScalar(1 + Math.sin(t * 2.2) * .04); s.disc.material.opacity = .08 + Math.sin(t * 2) * .03;
    s.pk.forEach(p => {
      const kx = p.userData.k, d = s.desks[kx]; if (!d.on) { p.visible = false; return; } p.visible = true;
      const u = (t * .22 + p.userData.off) % 1, a = s.brain.position, b = new THREE.Vector3(POS[kx][0], 3.2, POS[kx][1]), mid = a.clone().lerp(b, .5); mid.y += 1.2;
      const q = a.clone().multiplyScalar((1 - u) * (1 - u)).add(mid.multiplyScalar(2 * (1 - u) * u)).add(b.clone().multiplyScalar(u * u)); p.position.copy(q); p.rotation.set(u * 6, u * 9, 0); p.material.color.set(st[d.st] || st.ok); p.scale.setScalar(.8 + Math.sin(u * 3.14) * .4);
    });
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
