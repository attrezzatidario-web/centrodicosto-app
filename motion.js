/* Centro di Costo — animazioni del gestionale (v108)
   Livello unico di «motion» sopra l'app, senza toccare il codice delle sezioni:
   - entrata a cascata di card, KPI, righe e barre quando cambi sezione
   - numeri che salgono, barre che crescono, righe che compaiono scorrendo
   - indicatore che scivola nel menu laterale, titolo che cambia con dissolvenza
   - barra di avanzamento in alto mentre salva, effetto «onda» sui pulsanti
   Le sezioni che hanno già le loro animazioni (Dashboard, Attrezzatura, Fatture, Piazzali, GLS, ecc.) ricevono solo i ritocchi comuni.
   Con «riduci movimento» non fa niente. */
(() => {
  'use strict';
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  if (RM.matches) return;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const EASE = 'cubic-bezier(.2, .8, .2, 1)', SPRING = 'cubic-bezier(.34, 1.4, .5, 1)';
  // sezioni con animazioni proprie (cc-anim, ovAnim…): qui solo titolo, menu e piccoli ritocchi
  const OWN = new Set(['home', 'attrezzatura', 'movimenti', 'articoli', 'fatture', 'piazzali', 'gls', 'gasolio', 'lyreco', 'amazon', 'torental', 'preventivi', 'notespese']);
  const anim = (el, kf, o) => { try { return el.animate(kf, { fill: 'backwards', easing: EASE, ...o }); } catch { return null; } };
  const inView = el => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };

  /* ---------- numeri che salgono ---------- */
  const NUM = /^(€\s?)?-?\d{1,3}(\.\d{3})*(,\d{1,2})?(\s?€|\s?%)?$/;
  function countUp(el, delay) {
    const txt = el.textContent.trim(); if (!NUM.test(txt) || el._mvCount) return;
    const pre = (txt.match(/^€\s?/) || [''])[0], suf = (txt.match(/(\s?€|\s?%)$/) || [''])[0];
    const core = txt.slice(pre.length, txt.length - suf.length), dec = (core.split(',')[1] || '').length;
    const to = parseFloat(core.replace(/\./g, '').replace(',', '.')); if (!isFinite(to) || Math.abs(to) < 2) return;
    el._mvCount = 1;
    const fmt = v => { const [i, d] = Math.abs(v).toFixed(dec).split('.'); return pre + (v < 0 ? '-' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (d ? ',' + d : '') + suf; };
    const dur = 900, t0 = performance.now() + (delay || 0);
    el.textContent = fmt(0);
    const step = t => {
      if (!el.isConnected) return;
      const k = Math.max(0, Math.min(1, (t - t0) / dur)), e = 1 - Math.pow(1 - k, 3);
      el.textContent = k >= 1 ? txt : fmt(to * e);
      if (k < 1) requestAnimationFrame(step); else { el.textContent = txt; el._mvCount = 0; }
    };
    requestAnimationFrame(step);
  }

  /* ---------- entrata della sezione ---------- */
  let revealObs = null;
  function enter(v) {
    const V = $(`.view[data-v="${v}"]`) || $('.view:not([hidden])'); if (!V) return;
    if (revealObs) revealObs.disconnect();
    // titolo e sottotitolo
    ['#title', '#subtitle'].forEach((s, i) => { const t = $(s); if (t && t.textContent) anim(t, [{ opacity: 0, transform: 'translateY(6px)', filter: 'blur(3px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 450, delay: i * 60 }); });
    if (OWN.has(v)) { ownTouches(V); return; }
    let i = 0;
    // KPI e card principali
    const blocks = $$('.gx-k, .st-card, .card:not(.gx-list), .gx-list', V).filter(el => !el.closest('.cc-anim') && el.offsetParent);
    blocks.forEach(el => {
      if (!inView(el)) return reveal(el);
      anim(el, [{ opacity: 0, transform: 'translateY(14px) scale(.985)' }, { opacity: 1, transform: 'none' }], { duration: 560, delay: Math.min(i++, 8) * 55 });
    });
    // numeri grandi nei KPI
    $$('.gx-k b, .st-stat b', V).forEach((b, k) => countUp(b, 120 + k * 60));
    // righe delle tabelle
    // v118: solo le prime 40 righe (prima le guardava tutte: con migliaia di righe bloccava la pagina quasi un secondo)
    $$('.gx-list tbody tr, .st-card .st-row', V).slice(0, 40).forEach((tr, k) => {
      if (!inView(tr)) return reveal(tr, true);
      anim(tr, [{ opacity: 0, transform: 'translateX(-8px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: 180 + Math.min(k, 14) * 28 });
    });
    bars(V, 250);
  }
  // sezioni con animazioni proprie: solo barre e righe sotto la piega
  function ownTouches(V) {
    $$('tbody tr', V).slice(0, 40).forEach(tr => { if (!inView(tr)) reveal(tr, true); });
  }
  // barre (larghezza o altezza in percentuale) che crescono
  // v118: prima legge tutte le misure e poi anima (prima alternava lettura e scrittura: il browser ricalcolava la pagina a ogni barra)
  function bars(root, delay) {
    const L = [];
    for (const el of $$('[style*="width:"], [style*="height:"], [style*="--h:"], [style*="--w:"]', root)) {
      if (L.length >= 80) break;
      if (el.closest('.cc-anim') || el.tagName === 'IMG' || el.tagName === 'svg' || el.tagName === 'INPUT') continue;
      const st = el.getAttribute('style') || '';
      const hBar = /(^|;)\s*(height|--h)\s*:\s*[\d.]+%/.test(st), wBar = /(^|;)\s*(width|--w)\s*:\s*[\d.]+%/.test(st);
      if (!hBar && !wBar) continue;
      const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
      if (hBar && r.width > 60) continue; if (wBar && r.height > 16) continue; // solo barre sottili, non contenitori
      if (!(r.bottom > 0 && r.top < innerHeight)) continue;
      L.push([el, hBar]);
    }
    L.forEach(([el, hBar], k) => {
      el.style.transformOrigin = hBar ? '50% 100%' : '0 50%';
      anim(el, [{ transform: hBar ? 'scaleY(0)' : 'scaleX(0)' }, { transform: 'none' }], { duration: 800, delay: delay + Math.min(k, 40) * 14, easing: SPRING });
    });
  }
  // compare quando entra nello schermo scorrendo
  function reveal(el, row) {
    if (!('IntersectionObserver' in window)) return;
    if (!revealObs) revealObs = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; revealObs.unobserve(e.target);
      anim(e.target, e.target._mvRow ? [{ opacity: 0, transform: 'translateX(-8px)' }, { opacity: 1, transform: 'none' }] : [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: e.target._mvRow ? 380 : 560 });
    }), { threshold: .08 });
    el._mvRow = !!row; revealObs.observe(el);
  }

  /* ---------- indicatore del menu laterale ---------- */
  let ind = null;
  function navInd(instant) {
    const nav = $('.nav'); if (!nav) return;
    const a = $('.nav a.active', nav), desk = matchMedia('(min-width: 900px)').matches;
    if (!ind) { ind = document.createElement('i'); ind.className = 'nav-ind'; nav.appendChild(ind); }
    if (!a || !desk || a.hidden) { ind.style.opacity = '0'; return; }
    const nr = nav.getBoundingClientRect(), r = a.getBoundingClientRect();
    ind.style.transition = instant ? 'none' : '';
    ind.style.transform = `translate(${r.left - nr.left}px, ${r.top - nr.top + nav.scrollTop}px)`;
    ind.style.width = r.width + 'px'; ind.style.height = r.height + 'px'; ind.style.opacity = '1';
    document.body.classList.add('mv-nav');
  }

  /* ---------- barra di avanzamento mentre salva ---------- */
  function syncBar() {
    return; /* barra blu in alto rimossa (v254) */
    let bar = $('#mv-prog'); if (!bar) { bar = document.createElement('div'); bar.id = 'mv-prog'; bar.innerHTML = '<i></i>'; document.body.appendChild(bar); }
    const s = $('#sync-side') || $('#sync'), busy = s && /Salvo|Carico|Aggiorno/i.test(s.textContent);
    bar.classList.toggle('on', !!busy);
  }

  /* ---------- onda sui pulsanti ---------- */
  function ripple(e) {
    const b = e.target.closest('.btn, .fab, .chip, .tr-chip, [data-mod].tg'); if (!b || b.disabled) return;
    const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2.2, w = document.createElement('span');
    w.className = 'mv-rip'; w.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
    b.classList.add('mv-rh'); b.appendChild(w); setTimeout(() => { w.remove(); if (!b.querySelector('.mv-rip')) b.classList.remove('mv-rh'); }, 650);
  }

  /* ---------- avvio ---------- */
  let last = '';
  function onView() {
    const v = document.body.dataset.view || ''; if (!v || v === last) { navInd(); return; }
    const first = !last; last = v;
    navInd(first);
    requestAnimationFrame(() => enter(v));
  }
  function init() {
    new MutationObserver(onView).observe(document.body, { attributes: true, attributeFilter: ['data-view'] });
    // l'app compare dopo l'accesso: anima la prima sezione
    const app = $('#app'); if (app) new MutationObserver(() => { if (!app.hidden) { last = ''; onView(); } }).observe(app, { attributes: true, attributeFilter: ['hidden'] });
    ['#sync-side', '#sync'].forEach(s => { const el = $(s); if (el) new MutationObserver(syncBar).observe(el, { childList: true, characterData: true, subtree: true, attributes: true }); });
    document.addEventListener('pointerdown', ripple, { passive: true });
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => navInd(true), 120); });
    // le voci del menu possono comparire/sparire (sezioni accese/spente): riposiziona
    const nav = $('.nav'); if (nav) new MutationObserver(() => requestAnimationFrame(() => navInd(true))).observe(nav, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
    if (document.body.dataset.view) onView();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* v259: niente zoom a due dita su iPhone (user-scalable=no viene ignorato da Safari) */
['gesturestart', 'gesturechange', 'gestureend'].forEach(ev => document.addEventListener(ev, e => e.preventDefault()));
