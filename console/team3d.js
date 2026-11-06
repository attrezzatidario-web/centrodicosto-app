/* Console › Team: ufficio 3D (three.js). Una scrivania per agente + «cervello condiviso» al centro.
   Uso: TM3D.show(contenitore, { agents:[{k,n,st,ago,on}], sel }); TM3D.onPick = k => …  (st: ok|warn|bad|off) */
(function () {
  'use strict';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const POS = { guardiano: [-4.8, -2.7], informatico: [0, -2.7], commerciale: [4.8, -2.7], marketing: [-2.4, 2.3], grafico: [2.4, 2.3] };
  const SHIRT = { guardiano: 0x3f7fc4, informatico: 0xe0802e, commerciale: 0x3f7fc4, marketing: 0xe0802e, grafico: 0x3f7fc4 };
  let I = null; // istanza unica: il canvas passa da un contenitore all'altro quando la Console ridisegna la pagina

  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#888';
  function isDark() { const m = /(\d+)\D+(\d+)\D+(\d+)/.exec(getComputedStyle(document.body).backgroundColor); return m ? (+m[1] * 299 + +m[2] * 587 + +m[3] * 114) / 1000 < 110 : false; }
  const ease = t => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);

  /* ---------- contenuto degli schermi (canvas 256×160) ---------- */
  function drawScreen(k, c, t, col, on) {
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
  }

  /* ---------- costruzione della scena ---------- */
  function mat(col, o) { return new THREE.MeshStandardMaterial(Object.assign({ color: col, roughness: .75, metalness: 0 }, o || {})); }
  function mesh(g, m, x, y, z, sh = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = sh; o.receiveShadow = true; return o; }

  function build() {
    const wrap = document.createElement('div'); wrap.className = 'tm3d-wrap';
    const all = document.createElement('button'); all.type = 'button'; all.className = 'tm3d-all'; all.textContent = 'Vista intera'; all.hidden = true; all.addEventListener('click', () => TM3D.onPick && TM3D.onPick('')); wrap.appendChild(all);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    wrap.appendChild(renderer.domElement);
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(38, 1.6, .1, 100);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb9a98a, 1.05));
    const sun = new THREE.DirectionalLight(0xfff4e0, 1.9); sun.position.set(-7, 15, 9); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 10, bottom: -10, near: 1, far: 40 }); sun.shadow.bias = -.0004; sun.shadow.radius = 4; scene.add(sun);

    const M = { floor: mat(0xf1ead9, { roughness: 1 }), rim: mat(0xdcc08a), wood: mat(0xe6cf9d), leg: mat(0xb9a47c), dark: mat(0x23262e, { roughness: .5 }), chair: mat(0x2b2e36), kb: mat(0x3a3d46), skin: mat(0x15151b, { roughness: .6 }), pot: mat(0xb9b0a0), leaf: mat(0x3f9a62, { roughness: .8 }) };
    const floor = mesh(new THREE.BoxGeometry(17, .4, 12), M.floor, 0, -.2, 0, false); scene.add(floor);
    [[0, -6.1, 17.6, .5], [0, 6.1, 17.6, .5]].forEach(([x, z, w]) => scene.add(mesh(new THREE.BoxGeometry(w, .5, .4), M.rim, x, -.15, z, false)));
    [[-8.7, 0], [8.7, 0]].forEach(([x]) => scene.add(mesh(new THREE.BoxGeometry(.4, .5, 12.4), M.rim, x, -.15, 0, false)));

    const plant = (x, z, s = 1) => { const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(.34 * s, .26 * s, .55 * s, 20), M.pot, 0, .27 * s, 0));
      for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28, l = mesh(new THREE.ConeGeometry(.12 * s, 1.1 * s, 8), M.leaf, Math.cos(a) * .18 * s, .95 * s, Math.sin(a) * .18 * s); l.rotation.set(Math.sin(a) * .35, 0, -Math.cos(a) * .35); g.add(l); }
      g.position.set(x, 0, z); scene.add(g); return g; };
    plant(-7.9, -5.2); plant(7.9, -5.2, 1.15); plant(-7.9, 5.2, .9); plant(7.9, 5.2);

    const desks = {}, hits = [];
    Object.keys(POS).forEach((k, idx) => {
      const [x, z] = POS[k], g = new THREE.Group(); g.position.set(x, 0, z);
      // scrivania
      g.add(mesh(new THREE.BoxGeometry(3.1, .14, 1.5), M.wood, 0, 1.45, 0));
      [-1.45, 1.45].forEach(lx => g.add(mesh(new THREE.BoxGeometry(.1, 1.4, 1.3), M.leg, lx, .72, 0)));
      g.add(mesh(new THREE.BoxGeometry(.7, .04, .26), M.kb, 0, 1.54, .35));
      // monitor
      g.add(mesh(new THREE.BoxGeometry(.18, .5, .14), M.dark, 0, 1.78, -.4)); g.add(mesh(new THREE.BoxGeometry(.7, .06, .4), M.dark, 0, 1.54, -.4));
      g.add(mesh(new THREE.BoxGeometry(1.75, 1.05, .08), M.dark, 0, 2.4, -.45));
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 160; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.62, .92), new THREE.MeshBasicMaterial({ map: tex })); scr.position.set(0, 2.4, -.4); g.add(scr);
      // sedia + persona (si siede dal lato della telecamera, guarda lo schermo)
      const chair = new THREE.Group(); chair.position.set(0, 0, 1.25);
      chair.add(mesh(new THREE.CylinderGeometry(.08, .08, .8, 10), M.chair, 0, .4, 0)); chair.add(mesh(new THREE.CylinderGeometry(.5, .5, .1, 24), M.chair, 0, .95, 0));
      chair.add(mesh(new THREE.BoxGeometry(.95, 1.0, .14), M.chair, 0, 1.55, .42));
      g.add(chair);
      const person = new THREE.Group(); person.position.set(0, 0, 1.15);
      const shirt = mat(SHIRT[k], { roughness: .7 });
      person.add(mesh(new THREE.CapsuleGeometry(.4, .55, 6, 16), shirt, 0, 1.6, 0));
      const head = mesh(new THREE.SphereGeometry(.34, 24, 18), M.skin, 0, 2.32, -.02); person.add(head);
      const arms = [-1, 1].map(s => { const a = new THREE.Group(); a.position.set(s * .47, 1.85, -.05); a.add(mesh(new THREE.CapsuleGeometry(.1, .62, 4, 10), shirt, 0, 0, -.38)); a.children[0].rotation.x = Math.PI / 2; a.rotation.x = -.35; person.add(a); return a; });
      g.add(person);
      // area cliccabile + anello di selezione
      const hit = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.4, 3.6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); hit.position.set(0, 1.5, .5); hit.userData.k = k; g.add(hit); hits.push(hit);
      const ring = new THREE.Mesh(new THREE.RingGeometry(2.3, 2.45, 64), new THREE.MeshBasicMaterial({ color: 0x3362ab, transparent: true, opacity: 0, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.set(0, .02, .5); g.add(ring);
      g.scale.setScalar(.001); scene.add(g);
      desks[k] = { g, cv, ctx: cv.getContext('2d'), tex, scr, person, head, arms, chair, ring, hit, born: performance.now() + idx * 140, lift: 0, on: false, st: 'off', ph: idx * 1.3 };
    });

    // cervello condiviso
    const brain = new THREE.Group(); brain.position.set(0, 1.5, .1);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(.32, 32, 24), new THREE.MeshStandardMaterial({ color: 0x4f86d6, emissive: 0x3362ab, emissiveIntensity: .9, roughness: .3 })); brain.add(orb);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(.55, .02, 8, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .8 })); halo.rotation.x = 1.2; brain.add(halo);
    brain.add(new THREE.PointLight(0x6ea0ff, 8, 5)); scene.add(brain);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.5, 48), new THREE.MeshBasicMaterial({ color: 0x3362ab, transparent: true, opacity: .1 })); disc.rotation.x = -Math.PI / 2; disc.position.set(0, .02, .1); scene.add(disc);
    const pk = []; Object.keys(POS).forEach((k, i) => { for (let j = 0; j < 4; j++) { const p = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 8), new THREE.MeshBasicMaterial({ color: 0x1fa97a })); p.userData = { k, off: j / 4 + i * .07 }; scene.add(p); pk.push(p); } });

    return { all, wrap, renderer, scene, cam, desks, hits, brain, orb, halo, disc, pk, sun, M, floor, ray: new THREE.Raycaster(), mouse: new THREE.Vector2(), pills: {}, sel: '', hover: '', az: 0, st: {}, cur: new THREE.Vector3(0, 12.9, 11.1), look: new THREE.Vector3(0, 0, -.3), raf: 0, t0: performance.now(), gone: 0, w: 0, h: 0, drag: null };
  }

  function pose(sel) {
    if (sel && POS[sel]) { const [x, z] = POS[sel]; return { p: new THREE.Vector3(x * .75, 6.3, z + 6.6), l: new THREE.Vector3(x * .9, 1.4, z) }; }
    return { p: new THREE.Vector3(0, 12.9, 11.1), l: new THREE.Vector3(0, 0, -.3) };
  }

  function frame() {
    const s = I; if (!s) return;
    if (!s.wrap.isConnected) { if (++s.gone > 90) { s.raf = 0; return; } s.raf = requestAnimationFrame(frame); return; } s.gone = 0;
    const now = performance.now(), t = RM ? 0 : (now - s.t0) / 1000;
    const w = s.wrap.clientWidth, h = s.wrap.clientHeight; if (w && h && (w !== s.w || h !== s.h)) { s.w = w; s.h = h; s.renderer.setSize(w, h, false); s.cam.aspect = w / h; s.cam.updateProjectionMatrix(); }
    // telecamera: avvicinamento morbido verso la scrivania scelta, più rotazione con il trascinamento
    const tg = pose(s.sel), k = RM ? 1 : .07;
    s.cur.lerp(tg.p, k); s.look.lerp(tg.l, k);
    const off = s.cur.clone().sub(s.look); off.applyAxisAngle(new THREE.Vector3(0, 1, 0), s.az); s.cam.position.copy(s.look).add(off); s.cam.lookAt(s.look);
    const dark = s.dark, st = { ok: css('--ok'), warn: css('--warn'), bad: css('--bad'), off: '#1d2230' };
    s.M.floor.color.set(dark ? 0x1d2538 : 0xf1ead9); s.M.rim.color.set(dark ? 0x5d5035 : 0xdcc08a); s.M.wood.color.set(dark ? 0x8a7249 : 0xe6cf9d);
    s.sun.intensity = dark ? 1.2 : 1.9;
    Object.keys(s.desks).forEach(key => {
      const d = s.desks[key], a = Math.min(1, Math.max(0, (now - d.born) / 700)); d.g.scale.setScalar(Math.max(.001, RM ? 1 : ease(a)));
      const want = (key === s.hover ? .12 : 0) + (key === s.sel ? .1 : 0); d.lift += (want - d.lift) * .15; d.g.position.y = d.lift;
      d.ring.material.opacity = key === s.sel ? .55 + .25 * Math.sin(t * 3) : 0; d.ring.material.color.set(css('--acc'));
      if (d.on) { d.person.visible = true; d.arms[0].rotation.x = -.35 + Math.sin(t * 9 + d.ph) * .07; d.arms[1].rotation.x = -.35 + Math.sin(t * 9 + d.ph + 2) * .07; d.person.position.y = Math.sin(t * 1.4 + d.ph) * .02; d.head.rotation.y = Math.sin(t * .7 + d.ph) * .25; d.chair.rotation.y = Math.sin(t * .5 + d.ph) * .05; }
      else d.person.visible = false;
      if (!d.tick || now - d.tick > 90) { d.tick = now; drawScreen(key, d.ctx, t, st[d.st] || st.off, d.on); d.tex.needsUpdate = true; }
    });
    s.brain.position.y = 1.5 + Math.sin(t * 1.3) * .1; s.halo.rotation.z = t * .8; s.orb.scale.setScalar(1 + Math.sin(t * 2.2) * .04); s.disc.material.opacity = .08 + Math.sin(t * 2) * .03;
    s.pk.forEach(p => {
      const k = p.userData.k, d = s.desks[k]; if (!d.on) { p.visible = false; return; } p.visible = true;
      const u = (t * .22 + p.userData.off) % 1, a = s.brain.position, b = new THREE.Vector3(POS[k][0], 3.2, POS[k][1]), mid = a.clone().lerp(b, .5); mid.y += 1.2;
      const q = a.clone().multiplyScalar((1 - u) * (1 - u)).add(mid.multiplyScalar(2 * (1 - u) * u)).add(b.clone().multiplyScalar(u * u)); p.position.copy(q); p.material.color.set(st[d.st] || st.ok); p.scale.setScalar(.7 + Math.sin(u * 3.14) * .5);
    });
    s.renderer.render(s.scene, s.cam);
    // nomi sopra le scrivanie (come nel video)
    const v = new THREE.Vector3();
    Object.keys(s.pills).forEach(key => { const el = s.pills[key]; v.set(POS[key][0], 3.55 + s.desks[key].lift, POS[key][1] - .2).project(s.cam); const vis = v.z < 1; el.style.opacity = vis ? '' : '0'; el.style.transform = `translate(${(v.x * .5 + .5) * w}px, ${(-v.y * .5 + .5) * h}px) translate(-50%, -100%)`; });
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
      // etichette
      data.agents.forEach(a => {
        const d = s.desks[a.k]; if (!d) return; d.on = !!a.on; d.st = a.st;
        let el = s.pills[a.k];
        if (!el) { el = document.createElement('button'); el.type = 'button'; el.dataset.tm = a.k; el.addEventListener('click', () => TM3D.onPick && TM3D.onPick(a.k)); s.wrap.appendChild(el); s.pills[a.k] = el; }
        el.className = 'tm3d-pill st-' + a.st + (a.k === data.sel ? ' on' : ''); el.innerHTML = `<i></i><b>${a.n}</b><small>${a.on ? a.ago : 'Da attivare'}</small>`;
      });
      s.sel = data.sel || ''; s.all.hidden = !s.sel;
      if (!s.raf) s.raf = requestAnimationFrame(frame);
    }
  };
  window.TM3D = TM3D;
})();
