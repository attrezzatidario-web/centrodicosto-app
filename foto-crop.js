/* Editor della foto profilo, condiviso da gestionale (dipendenti.js) e app Presenze.
   Si trascina per spostare, si ingrandisce con cursore, rotellina o due dita; restituisce un JPEG quadrato 160 px (null se si annulla). */
window.cdcCropPhoto = function (file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Immagine non valida')); };
    im.onload = () => {
      const S = 260, OUT = 160, w = im.naturalWidth, h = im.naturalHeight, base = S / Math.min(w, h);
      let z = 1, ox = 0, oy = 0;
      const ov = document.createElement('div'); ov.className = 'ph-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Sposta e ingrandisci la foto');
      ov.innerHTML = '<div class="ph-card"><h3>Sposta e ingrandisci</h3><div class="ph-stage" tabindex="0" aria-label="Trascina per spostare la foto"><img alt="" draggable="false"><i class="ph-mask"></i></div><label class="ph-zoom"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12"/></svg><input type="range" min="1" max="5" step="0.01" value="1" aria-label="Ingrandisci"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12M12 6v12"/></svg></label><p class="ph-hint">Trascina la foto e usa il cursore per ingrandire</p><div class="ph-act"><button type="button" class="ph-no">Annulla</button><button type="button" class="ph-ok">Usa questa foto</button></div></div>';
      const st = ov.querySelector('.ph-stage'), img = st.querySelector('img'), rg = ov.querySelector('input'); img.src = url;
      const draw = () => { const dw = w * base * z, dh = h * base * z, mx = Math.max(0, (dw - S) / 2), my = Math.max(0, (dh - S) / 2); ox = Math.max(-mx, Math.min(mx, ox)); oy = Math.max(-my, Math.min(my, oy)); img.style.width = dw + 'px'; img.style.height = dh + 'px'; img.style.transform = `translate(${S / 2 - dw / 2 + ox}px, ${S / 2 - dh / 2 + oy}px)`; rg.value = z; };
      const setZ = nz => { nz = Math.max(1, Math.min(5, nz)); const r = nz / z; ox *= r; oy *= r; z = nz; draw(); };
      const P = new Map(); let d0 = 0, z0 = 1; const dist = () => { const [a, b] = [...P.values()]; return Math.hypot(a[0] - b[0], a[1] - b[1]) || 1; };
      st.addEventListener('pointerdown', e => { try { st.setPointerCapture(e.pointerId); } catch {} P.set(e.pointerId, [e.clientX, e.clientY]); if (P.size === 2) { d0 = dist(); z0 = z; } st.classList.add('grab'); });
      st.addEventListener('pointermove', e => { const p = P.get(e.pointerId); if (!p) return; if (P.size === 1) { ox += e.clientX - p[0]; oy += e.clientY - p[1]; P.set(e.pointerId, [e.clientX, e.clientY]); draw(); } else { P.set(e.pointerId, [e.clientX, e.clientY]); if (P.size === 2) setZ(z0 * dist() / d0); } });
      const up = e => { P.delete(e.pointerId); if (!P.size) st.classList.remove('grab'); }; st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up);
      st.addEventListener('wheel', e => { e.preventDefault(); setZ(z * Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
      rg.addEventListener('input', () => setZ(+rg.value));
      st.addEventListener('keydown', e => { const k = { ArrowLeft: [20, 0], ArrowRight: [-20, 0], ArrowUp: [0, 20], ArrowDown: [0, -20] }[e.key]; if (k) { e.preventDefault(); ox += k[0]; oy += k[1]; draw(); } else if (e.key === '+' || e.key === '=') setZ(z * 1.1); else if (e.key === '-') setZ(z / 1.1); });
      const done = v => { URL.revokeObjectURL(url); ov.remove(); document.removeEventListener('keydown', onKey, true); resolve(v); };
      const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); done(null); } }; document.addEventListener('keydown', onKey, true);
      ov.addEventListener('pointerdown', e => { if (e.target === ov) done(null); });
      ov.querySelector('.ph-no').onclick = () => done(null);
      ov.querySelector('.ph-ok').onclick = () => { const dw = w * base * z, dh = h * base * z, sc = base * z, L = S / 2 - dw / 2 + ox, T = S / 2 - dh / 2 + oy, c = document.createElement('canvas'); c.width = c.height = OUT; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, OUT, OUT); x.drawImage(im, -L / sc, -T / sc, S / sc, S / sc, 0, 0, OUT, OUT); done(c.toDataURL('image/jpeg', 0.82)); };
      document.body.appendChild(ov); draw(); st.focus();
    };
    im.src = url;
  });
};
