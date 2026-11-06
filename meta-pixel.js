/* Meta Pixel di Centro di Costo — carica solo dopo consenso, solo dalla schermata di accesso/demo */
(function () {
  var ID = '1821419968983928', KEY = 'cdc_consent', st = null, loaded = false, queue = [];
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function load() {
    if (loaded) return; loaded = true;
    var f = window.fbq = function () { f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments); };
    if (!window._fbq) window._fbq = f; f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
    var s = document.createElement('script'); s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
    f('init', ID); f('set', 'autoConfig', false, ID);
    queue.forEach(function (q) { send(q[0], q[1]); }); queue = [];
  }
  function send(kind, name) { if (kind === 'page') window.fbq('track', 'PageView'); else if (kind === 'custom') window.fbq('trackCustom', name); else window.fbq('track', name); }
  function track(kind, name) { if (get() !== 'yes') return; if (!loaded) { queue.push([kind, name]); load(); } else send(kind, name); }
  function banner() {
    if (get() || document.getElementById('cdc-ck')) return;
    var d = document.createElement('div'); d.id = 'cdc-ck'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Cookie');
    d.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:99999;max-width:520px;margin:0 auto;background:#0b1a13;color:#fff;border-radius:16px;padding:16px 18px;font:14px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;box-shadow:0 18px 50px rgba(0,0,0,.35)';
    d.innerHTML = '<div style="margin-bottom:12px">Usiamo un cookie di Meta per capire se le nostre inserzioni funzionano. Solo se accetti. <a href="privacy/" style="color:#7ee2b1" target="_blank" rel="noopener">Informativa</a></div><div style="display:flex;gap:10px;justify-content:flex-end"><button type="button" data-ck="no" style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,.35);border-radius:999px;padding:9px 18px;font:inherit;cursor:pointer">Rifiuta</button><button type="button" data-ck="yes" style="background:#2fcf86;color:#04140c;border:0;border-radius:999px;padding:9px 18px;font:inherit;font-weight:700;cursor:pointer">Accetta</button></div>';
    d.addEventListener('click', function (e) { var b = e.target.closest('[data-ck]'); if (!b) return; set(b.dataset.ck); d.remove(); if (b.dataset.ck === 'yes') track('page'); });
    document.body.appendChild(d);
  }
  window.cdcPixel = {
    page: function () { banner(); track('page'); },
    demo: function () { track('custom', 'DemoAperta'); },
    lead: function () { track('standard', 'Lead'); }
  };
})();
