/* Magazzino 3D (v271) — plastico isometrico interattivo del magazzino, collegato ai dati reali.
   Caricato con loadLib da app.js (mag3d) dopo three.js. Espone window.CDC_MG3D = { open(ctx), refresh(), close(), isOpen() }.
   Dati: articoli, movimenti (giacenze per magazzino), DDT, clienti, trasferimenti in viaggio. Non scrive nulla da solo:
   carichi/scarichi e DDT passano dai pulsanti data-gx del gestionale (movForm, docForm…). */
(function () {
  'use strict';
  let C = null, T = null, root = null, R = null, scene = null, cam = null, raf = 0, open = false, D = null;
  let pick = [], labels = [], movers = [], sel = null, tourT = 0, tourOn = false, lastT = 0, hoverObj = null, needPick = null;
  const OR = '#f47b20';
  const CAM = { tx: 4, tz: 8, dist: 265, az: -0.3, pol: 0.9 }, GOAL = { ...CAM };
  const PAL = [0xf0a24e, 0xa9c98a, 0xc9b8e6, 0xf3c27a, 0x8fc1d9, 0xe8957a, 0xd8cf9b, 0xb7d3a8];
  const PALH = ['#f0a24e', '#a9c98a', '#c9b8e6', '#f3c27a', '#8fc1d9', '#e8957a', '#d8cf9b', '#b7d3a8'];

  /* ---------------- stile ---------------- */
  const CSS = `
.m3 *,.m3 *:before,.m3 *:after{box-sizing:border-box}
.m3{position:fixed;inset:0;z-index:45;background:#a6d673;font-family:Inter,system-ui,-apple-system,sans-serif;color:#15171a;overflow:hidden;-webkit-font-smoothing:antialiased;opacity:0;transition:opacity .35s ease}
.m3.on{opacity:1}
.m3 canvas.m3-c{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab}
.m3 canvas.m3-c.drag{cursor:grabbing}.m3 canvas.m3-c.hov{cursor:pointer}
.m3 button{font:inherit;color:inherit;cursor:pointer;border:0;background:none;padding:0}
.m3 svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:none}
.m3-top{position:absolute;left:0;right:0;top:0;height:64px;background:rgba(255,255,255,.97);border-bottom:1px solid #ecebe8;display:flex;align-items:center;gap:12px;padding:0 18px;z-index:5;box-shadow:0 1px 0 rgba(0,0,0,.02)}
.m3-brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:15.5px;white-space:nowrap;margin-right:6px}
.m3-logo{width:34px;height:34px;border-radius:10px;background:${OR};display:grid;place-items:center;color:#fff;box-shadow:0 3px 8px rgba(244,123,32,.28)}
.m3-logo svg{width:20px;height:20px;stroke-width:2}
.m3-tabs{display:flex;gap:4px}
.m3-tabs button{display:flex;align-items:center;gap:7px;height:36px;padding:0 12px;border-radius:10px;font-size:13.5px;font-weight:600;color:#3a3d42}
.m3-tabs button svg{width:16px;height:16px;color:#7a7d83}
.m3-tabs button.on{background:#f4f3f1;color:#15171a}.m3-tabs button.on svg{color:${OR}}
.m3-tabs button:not(.on):hover{background:#f7f6f4}
.m3-search{position:relative;flex:1;max-width:300px;min-width:150px;height:40px;border:1px solid #e7e5e1;border-radius:12px;display:flex;align-items:center;gap:8px;padding:0 10px 0 12px;background:#fff;margin-left:auto}
.m3-search svg{color:#8a8d93;width:17px;height:17px}
.m3-search input{flex:1;min-width:0;border:0;outline:0;font:inherit;font-size:14px;background:none;color:#15171a}
.m3-search input::placeholder{color:#9a9ca1}
.m3-search kbd{font:600 11px Inter,system-ui;color:#8a8d93;border:1px solid #e3e1dd;border-radius:6px;padding:2px 6px;background:#faf9f7}
.m3-res{position:absolute;left:0;right:0;top:46px;background:#fff;border:1px solid #eceae6;border-radius:14px;box-shadow:0 18px 40px rgba(20,22,26,.14);padding:6px;max-height:340px;overflow:auto;display:none}
.m3-res.on{display:block}
.m3-res button{display:flex;width:100%;text-align:left;align-items:center;gap:10px;padding:8px 9px;border-radius:10px}
.m3-res button:hover,.m3-res button.k{background:#fbf3ec}
.m3-res i{width:30px;height:30px;border-radius:9px;background:#fdf0e5;color:${OR};display:grid;place-items:center;flex:none;font-style:normal;font-size:11px;font-weight:700}
.m3-res b{display:block;font-size:13.5px;font-weight:600}.m3-res small{display:block;color:#8a8d93;font-size:12px}
.m3-res p{margin:8px 10px;color:#8a8d93;font-size:13px}
.m3-btn{height:40px;display:flex;align-items:center;gap:8px;border:1px solid #e7e5e1;border-radius:12px;padding:0 13px;font-size:13.5px;font-weight:600;background:#fff;white-space:nowrap;position:relative}
.m3-btn:hover{background:#faf9f7}
.m3-menu{position:absolute;top:46px;right:0;min-width:220px;background:#fff;border:1px solid #eceae6;border-radius:14px;box-shadow:0 18px 40px rgba(20,22,26,.14);padding:6px;display:none;z-index:8;text-align:left}
.m3-menu.on{display:block}
.m3-menu button{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border-radius:9px;font-size:13.5px;font-weight:500}
.m3-menu button:hover{background:#fbf3ec}.m3-menu button.on{color:${OR};font-weight:600}
.m3-menu em{margin-left:auto;font-style:normal;color:#9a9ca1;font-size:12px}
.m3-menu .zc{width:28px;height:22px;border-radius:7px;background:#fdf0e5;color:${OR};display:grid;place-items:center;font-size:10px;font-weight:700}
.m3-zone{position:relative;height:46px;display:flex;align-items:center;gap:10px;border:1px solid #e7e5e1;border-radius:14px;padding:0 4px 0 5px;background:#fff;min-width:210px}
.m3-zc{width:38px;height:36px;border-radius:10px;background:${OR};color:#fff;display:grid;place-items:center;font-size:11.5px;font-weight:700;letter-spacing:.02em;flex:none}
.m3-zt{display:flex;flex-direction:column;line-height:1.15;min-width:0;flex:1}
.m3-zt b{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.m3-zt small{font-size:11.5px;color:#8a8d93;white-space:nowrap}
.m3-zone>button{width:30px;height:36px;display:grid;place-items:center;color:#55585e;border-radius:9px}
.m3-zone>button:hover{background:#f6f5f3}.m3-zone>button+button{border-left:1px solid #eeece8;border-radius:0 9px 9px 0}
.m3-live{height:36px;display:flex;align-items:center;gap:8px;padding:0 13px;border-radius:11px;background:#e7f5ea;color:#1f7a3b;font-size:13.5px;font-weight:600;white-space:nowrap}
.m3-live i{width:7px;height:7px;border-radius:50%;background:#22a04b;box-shadow:0 0 0 0 rgba(34,160,75,.5);animation:m3p 2s infinite}
@keyframes m3p{0%{box-shadow:0 0 0 0 rgba(34,160,75,.45)}70%{box-shadow:0 0 0 7px rgba(34,160,75,0)}100%{box-shadow:0 0 0 0 rgba(34,160,75,0)}}
.m3-bell{position:relative;width:38px;height:38px;display:grid;place-items:center;border-radius:11px;color:#3a3d42}
.m3-bell:hover{background:#f6f5f3}.m3-bell svg{width:20px;height:20px}
.m3-bell em{position:absolute;top:2px;right:1px;min-width:17px;height:17px;border-radius:9px;background:${OR};color:#fff;font:700 10px/17px Inter,system-ui;text-align:center;font-style:normal;padding:0 4px;border:2px solid #fff}
.m3-sel{height:40px;border:1px solid #e7e5e1;border-radius:12px;background:#fff;font:600 13px Inter,system-ui;padding:0 10px;max-width:170px}
.m3-card{background:rgba(255,255,255,.97);border:1px solid rgba(255,255,255,.9);border-radius:18px;box-shadow:0 10px 30px rgba(32,48,20,.13),0 1px 2px rgba(0,0,0,.04)}
.m3-kpis{position:absolute;left:18px;top:80px;display:flex;gap:12px;z-index:3}
.m3-kpi{display:flex;align-items:center;gap:14px;padding:13px 20px 13px 14px;min-width:210px;cursor:pointer}
.m3-kpi i{width:36px;height:36px;border-radius:50%;background:#fdf0e5;color:${OR};display:grid;place-items:center;flex:none}
.m3-kpi span{display:block;font-size:12.5px;color:#55585e;font-weight:500}
.m3-kpi b{font-size:24px;font-weight:700;letter-spacing:-.02em;line-height:1.15}
.m3-kpi b em{font-style:normal;font-size:12.5px;color:${OR};font-weight:600;margin-left:6px;letter-spacing:0}
.m3-kpi small{display:block;font-size:11.5px;color:#9a9ca1}
.m3-tools{position:absolute;top:80px;right:372px;display:flex;flex-direction:column;align-items:center;padding:6px;gap:2px;z-index:3;transition:right .35s cubic-bezier(.2,.8,.2,1)}
.m3.np .m3-tools{right:18px}
.m3-tools button{width:40px;height:40px;display:grid;place-items:center;border-radius:11px;color:#3a3d42}
.m3-tools button:hover{background:#f5f4f2}
.m3-tools hr{width:24px;border:0;border-top:1px solid #eeece8;margin:4px 0}
.m3-tools .play{background:${OR};color:#fff;margin-top:6px;box-shadow:0 6px 14px rgba(244,123,32,.35)}
.m3-tools .play:hover{background:#e86e12}.m3-tools .play svg{fill:currentColor;stroke:none;width:14px;height:14px}
.m3-panel{position:absolute;top:80px;right:18px;width:340px;max-height:calc(100% - 300px);min-height:200px;display:flex;flex-direction:column;z-index:4;transition:transform .45s cubic-bezier(.2,.8,.2,1),opacity .3s}
.m3.np .m3-panel{transform:translateX(380px);opacity:0;pointer-events:none}
.m3-ph{display:flex;align-items:flex-start;gap:12px;padding:18px 18px 6px}
.m3-pi{width:44px;height:44px;border-radius:13px;background:#f5f4f2;display:grid;place-items:center;flex:none;color:#2b2e33}
.m3-pi.or{background:${OR};color:#fff;box-shadow:0 5px 12px rgba(244,123,32,.3)}
.m3-pi.dk{background:#17191c;color:#fff;font-weight:700;font-size:13px}
.m3-pt{flex:1;min-width:0}
.m3-ey{display:block;color:${OR};font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;line-height:1.35}
.m3-pt h3{margin:2px 0 2px;font-size:17px;font-weight:700;letter-spacing:-.01em;line-height:1.25}
.m3-pt p{margin:0;color:#8a8d93;font-size:12.5px;line-height:1.35}
.m3-pa{display:flex;gap:6px}
.m3-pa button{width:32px;height:32px;border:1px solid #eceae6;border-radius:10px;display:grid;place-items:center;color:#55585e;background:#fff}
.m3-pa button:hover{background:#faf9f7}.m3-pa svg{width:15px;height:15px}
.m3-pb{overflow:auto;padding:8px 18px 16px;flex:1;overscroll-behavior:contain}
.m3-pb::-webkit-scrollbar{width:6px}.m3-pb::-webkit-scrollbar-thumb{background:#e4e2de;border-radius:3px}
.m3-chips{display:flex;gap:6px;flex-wrap:wrap;margin:2px 0 12px}
.m3-chip{display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 10px;border-radius:13px;background:#f2f1ef;font-size:12px;font-weight:600;color:#3a3d42;white-space:nowrap}
.m3-chip i{width:6px;height:6px;border-radius:50%;background:currentColor}
.m3-chip.g{background:#e7f5ea;color:#1f7a3b}.m3-chip.a{background:#fdf0e1;color:#b2600f}.m3-chip.r{background:#fde9e6;color:#c2412d}.m3-chip.n{background:#f2f1ef;color:#55585e}
.m3-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.m3-st{background:#f8f7f5;border-radius:13px;padding:11px 12px 12px;min-width:0}
.m3-st span{display:block;font-size:11.5px;color:#8a8d93;font-weight:500;margin-bottom:3px}
.m3-st b{font-size:19px;font-weight:700;letter-spacing:-.02em;white-space:nowrap}
.m3-st b small{font-size:11.5px;font-weight:500;color:#9a9ca1;letter-spacing:0;margin-left:3px}
.m3-st em{display:block;font-style:normal;font-size:11.5px;color:#9a9ca1;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.m3-bar{height:4px;border-radius:2px;background:#ebe9e5;margin-top:8px;overflow:hidden}
.m3-bar u{display:block;height:100%;width:0;background:${OR};border-radius:2px;transition:width .9s cubic-bezier(.2,.8,.2,1)}
.m3-warn{display:flex;gap:10px;align-items:flex-start;background:#fdf3e2;border-radius:13px;padding:11px 12px;margin:10px 0 0;font-size:12.5px;color:#5f4a2c;line-height:1.4}
.m3-warn svg{color:#c7781d;width:17px;height:17px;margin-top:1px}
.m3-go{width:100%;height:44px;border-radius:13px;background:${OR}!important;color:#fff!important;font-weight:600;font-size:14px;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;box-shadow:0 6px 16px rgba(244,123,32,.3)}
.m3-go:hover{background:#e86e12!important}.m3-go svg{width:16px;height:16px}
.m3-go.ghost{background:#fff!important;color:#2b2e33!important;border:1px solid #e7e5e1;box-shadow:none}
.m3-h4{display:flex;justify-content:space-between;align-items:center;margin:16px 0 8px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#2b2e33}
.m3-h4 em{font-style:normal;font-weight:500;color:#9a9ca1;letter-spacing:0;text-transform:none;font-size:12px}
.m3-rows{display:flex;flex-direction:column;gap:7px}
.m3-row{display:flex;align-items:center;gap:10px;border:1px solid #eeece8;border-radius:13px;padding:9px 10px;background:#fff;text-align:left;width:100%}
.m3-row:hover{border-color:#f3c9a4;background:#fffaf5}
.m3-row.k{border-color:${OR};box-shadow:0 0 0 3px rgba(244,123,32,.12)}
.m3-row .dn{width:30px;height:30px;flex:none}
.m3-row .tx{flex:1;min-width:0}
.m3-row .tx b{display:block;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.m3-row .tx small{display:block;font-size:11.5px;color:#8a8d93;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.m3-row .m3-chip{height:24px;font-size:11.5px}
.m3-row .pm{width:30px;height:30px;border-radius:9px;border:1px solid #eceae6;display:grid;place-items:center;font-weight:600;color:#55585e;flex:none;background:#fff}
.m3-row .pm:hover{background:${OR};color:#fff;border-color:${OR}}
.m3-ship{border:1px solid #eeece8;border-radius:13px;padding:12px;display:flex;gap:11px;align-items:flex-start}
.m3-ship i{width:36px;height:36px;border-radius:10px;background:#f5f4f2;display:grid;place-items:center;flex:none}
.m3-ship b{display:block;font-size:13.5px;font-weight:600}.m3-ship small{display:block;font-size:12px;color:#8a8d93;line-height:1.4}
.m3-tl{margin:10px 0 0 6px;border-left:2px solid #eeece8;padding-left:12px;display:flex;flex-direction:column;gap:6px;font-size:12.5px}
.m3-tl b{font-weight:700;margin-right:6px}.m3-tl span{color:#8a8d93}
.m3-plate{display:inline-block;border:2px solid #17191c;border-radius:7px;padding:2px 9px;font-size:16px;font-weight:700;letter-spacing:.03em;margin:4px 0 3px;background:#fff}
.m3-empty{padding:16px 6px;color:#8a8d93;font-size:13px;text-align:center}
.m3-flow{position:absolute;left:18px;bottom:18px;width:min(760px,calc(100% - 460px));padding:14px 18px 12px;z-index:3}
.m3-fh{display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:600}
.m3-fh svg{width:16px;height:16px;color:#55585e}
.m3-fh em{margin-left:auto;font-style:normal;color:#9a9ca1;font-size:12px;font-weight:500}
.m3-fs{display:flex;align-items:flex-start;justify-content:space-between;margin-top:10px;gap:4px}
.m3-fs button{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#2b2e33;flex:1;min-width:64px;padding:2px 0;border-radius:10px}
.m3-fs button i{width:36px;height:36px;border-radius:11px;background:#fdf0e5;color:${OR};display:grid;place-items:center;transition:transform .2s}
.m3-fs button:hover i{transform:translateY(-2px)}
.m3-fs button.on i{background:${OR};color:#fff;box-shadow:0 5px 12px rgba(244,123,32,.3)}
.m3-fs button.w i{background:#fde9e6;color:#c2412d}
.m3-fs b.sep{flex:0 0 14px;height:2px;background:#ead7c5;margin-top:17px;border-radius:1px}
.m3-tab{position:absolute;right:18px;bottom:18px;width:430px;z-index:3;padding:6px 6px 8px;transition:opacity .3s}
.m3-tt{display:flex;align-items:center;gap:2px;padding:4px 6px 6px}
.m3-tt>i{width:30px;height:30px;border-radius:9px;background:#fdf0e5;color:${OR};display:grid;place-items:center;margin-right:6px}
.m3-tt>i svg{width:16px;height:16px}
.m3-tt button{height:30px;padding:0 10px;border-radius:9px;font-size:12.5px;font-weight:600;color:#55585e}
.m3-tt button em{font-style:normal;color:#a9abb0;font-weight:500;margin-left:4px;font-size:11.5px}
.m3-tt button.on{background:#f4f3f1;color:#15171a}
.m3-tr{max-height:146px;overflow:auto;padding:0 4px}
.m3-tr button{display:grid;grid-template-columns:64px 1fr auto 44px 12px;align-items:center;gap:8px;width:100%;padding:6px 6px;border-radius:9px;text-align:left;font-size:12.5px}
.m3-tr button:hover{background:#fbf7f3}
.m3-tr .c1 b{display:block;font-size:12.5px}.m3-tr .c1 small{display:block;color:#9a9ca1;font-size:10.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.m3-tr .c2{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:6px}
.m3-tr .c2 i{width:9px;height:9px;border-radius:50%;flex:none}
.m3-tr .c4{color:#8a8d93;text-align:right;font-size:12px}
.m3-tr .c5{color:#c5c7cb}
.m3-tr .m3-chip{height:22px;font-size:11px}
.m3-lbs{position:absolute;inset:0;pointer-events:none;z-index:2;overflow:hidden}
.m3-lb{position:absolute;left:0;top:0;transform:translate(-50%,-100%);pointer-events:auto;cursor:pointer;display:flex;align-items:center;gap:8px;height:28px;padding:0 11px;border-radius:9px;background:${OR};color:#fff;font-size:12.5px;font-weight:600;white-space:nowrap;box-shadow:0 6px 16px rgba(170,80,10,.28);transition:opacity .25s;will-change:transform}
.m3-lb:after{content:'';position:absolute;left:50%;bottom:-5px;margin-left:-5px;border:5px solid transparent;border-bottom:0;border-top-color:${OR}}
.m3-lb em{font-style:normal;font-weight:500;opacity:.92;padding-left:8px;border-left:1px solid rgba(255,255,255,.45)}
.m3-lb.sm{height:24px;font-size:11.5px;padding:0 9px;border-radius:8px}
.m3-lb.hid{opacity:0;pointer-events:none}
.m3-lb.wh{background:#fff;color:#2b2e33;box-shadow:0 4px 12px rgba(0,0,0,.12)}.m3-lb.wh:after{border-top-color:#fff}.m3-lb.wh em{border-left-color:#e7e5e1;color:#8a8d93}
.m3-load{position:absolute;inset:0;display:grid;place-items:center;z-index:9;background:#a6d673;transition:opacity .5s}
.m3-load b{background:#fff;border-radius:14px;padding:12px 18px;font-size:14px;font-weight:600;box-shadow:0 10px 30px rgba(0,0,0,.12)}
.m3-toast{position:absolute;left:50%;top:78px;transform:translateX(-50%);background:#17191c;color:#fff;font-size:13px;padding:9px 14px;border-radius:11px;z-index:9;opacity:0;transition:opacity .25s;pointer-events:none}
.m3-toast.on{opacity:1}
@media (max-width:1180px){.m3-tab{display:none}.m3-flow{width:calc(100% - 400px)}}
@media (max-width:900px){.m3-tabs,.m3-brand b{display:none}.m3-kpi{min-width:0}.m3-kpis .m3-kpi:nth-child(2){display:none}}
@media (max-width:760px){
 .m3-top{height:auto;flex-wrap:wrap;padding:8px 10px;gap:8px}
 .m3-brand{display:none}
 .m3-search{order:1;flex:1 1 60%;max-width:none;margin:0}
 .m3-shots{order:2}.m3-shots .m3-btn span{display:none}
 .m3-x{order:3}
 .m3-zone{order:4;flex:1 1 calc(100% - 150px);min-width:0;height:44px}
 .m3-sel{order:5}
 .m3-live{order:6;padding:0 10px}.m3-live span{display:none}
 .m3-bell{order:7}
 .m3-kpis{top:122px;left:10px}.m3-kpi{padding:9px 14px 9px 10px;gap:10px}.m3-kpi b{font-size:19px}.m3-kpi i{width:30px;height:30px}
 .m3.pn .m3-kpis{display:none}
 .m3-tools{top:122px;right:auto;left:10px;padding:4px}.m3.np .m3-tools{right:auto}
 .m3:not(.pn) .m3-tools{top:196px}
 .m3-tools button{width:36px;height:36px}
 .m3-panel{top:122px;left:62px;right:10px;width:auto;max-height:calc(100% - 250px)}
 .m3.np .m3-panel{transform:translateY(20px)}
 .m3-flow{left:10px;right:10px;width:auto;bottom:10px;padding:10px 12px}
 .m3-fs{overflow-x:auto;justify-content:flex-start;scrollbar-width:none}.m3-fs::-webkit-scrollbar{display:none}
 .m3-fh em{display:none}
}
.m3-x{display:none}
@media (max-width:760px){.m3-x{display:grid;width:40px;height:40px;border:1px solid #e7e5e1;border-radius:12px;place-items:center;background:#fff}}
@media (prefers-reduced-motion:reduce){.m3,.m3-panel,.m3-bar u,.m3-tools{transition:none}.m3-live i{animation:none}}
`;

  /* ---------------- icone ---------------- */
  const I = {
    logo: '<path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 17h10"/>',
    cube: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
    grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    right: '<path d="m9 6 6 6-6 6"/>', down: '<path d="m6 9 6 6 6-6"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
    rl: '<path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 4v4h4"/>', rr: '<path d="M20 12a8 8 0 1 1-2.5-5.8"/><path d="M20 4v4h-4"/>',
    home: '<path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z"/>', play: '<path d="M7 5v14l12-7z"/>', pause: '<path d="M8 5h3v14H8zM13 5h3v14h-3z"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>', target: '<circle cx="12" cy="12" r="7"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
    truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    dock: '<path d="M3 20V9l9-5 9 5v11"/><path d="M7 20v-7h10v7M7 16h10"/>',
    rack: '<path d="M4 3v18M20 3v18M4 8h16M4 13h16M4 18h16"/>',
    hand: '<path d="M7 11V6a1.5 1.5 0 0 1 3 0v5M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V12M16 9.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-5-2.7L4 15a1.5 1.5 0 0 1 2.5-1.7L7 14"/>',
    shield: '<path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z"/><path d="m9 12 2 2 4-4"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4.5a3 3 0 0 1 0 6M21 20c0-2.8-1.7-5-4-5.7"/>',
    factory: '<path d="M3 21V10l5 3V10l5 3V10l5 3V4h3v17z"/>',
    flow: '<path d="M7 4v14m0 0-3.5-3.5M7 18l3.5-3.5M17 20V6m0 0-3.5 3.5M17 6l3.5 3.5"/>',
    route: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>',
    alert: '<path d="M12 4 2.5 20h19z"/><path d="M12 10v4.5M12 17.5v.01"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>', office: '<path d="M4 21V5l8-2v18M12 8h8v13M8 8v.01M8 12v.01M8 16v.01M16 12v.01M16 16v.01"/>',
    chart: '<path d="M4 20h16M7 16v-5M12 16V7M17 16v-8"/>', pdf: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>'
  };
  const ic = (k, extra) => `<svg viewBox="0 0 24 24"${extra || ''}>${I[k] || ''}</svg>`;

  /* ---------------- utilità ---------------- */
  const $ = (s, el) => (el || root).querySelector(s);
  const $$ = (s, el) => [...(el || root).querySelectorAll(s)];
  const N = v => C.fmtNum(v, Math.abs(v % 1) > 0.001 ? 1 : 0);
  const pc = (a, b) => b ? Math.round(a / b * 100) : 0;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = s => C.esc(s);
  const toast = t => { const el = $('.m3-toast'); if (!el) return; el.textContent = t; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 2200); };
  const donut = (p, col) => { const r = 12, c = 2 * Math.PI * r, v = clamp(p, 0, 1); return `<svg class="dn" viewBox="0 0 30 30" style="stroke-linecap:butt"><circle cx="15" cy="15" r="${r}" stroke="#17191c" stroke-width="6" opacity=".9"/><circle cx="15" cy="15" r="${r}" stroke="${col}" stroke-width="6" stroke-dasharray="${(c * v).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 15 15)"/></svg>`; };
  const canW = () => C.secPerm('magazzino') === 'w';

  /* ---------------- dati ---------------- */
  function data() {
    const mag = C.mag();
    const A = C.art(), G = C.giacMap(mag), MV = C.mov().filter(m => !mag || C.magOf(m) === mag);
    const ivaK = a => C.ivaOn() ? 1 + C.ivaRate(a) : 1;
    const t0 = C.today(), m0 = t0.slice(0, 7);
    const dAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
    const arts = A.map(a => { const g = G.get(a.id) || 0, s = C.num(a.scorta); return { a, id: a.id, g, s, low: s > 0 && g <= s && g > 0, out: g <= 0, val: Math.max(0, g) * C.num(a.costo) * ivaK(a) }; });
    const byCat = new Map();
    arts.forEach(x => { const k = String(x.a.categoria || '').trim() || 'Senza categoria'; if (!byCat.has(k)) byCat.set(k, []); byCat.get(k).push(x); });
    let cats = [...byCat.entries()].map(([n, L]) => ({ n, L, g: L.reduce((s, x) => s + Math.max(0, x.g), 0) })).sort((a, b) => b.g - a.g || b.L.length - a.L.length);
    const MAXR = 8;
    if (cats.length > MAXR) { const rest = cats.slice(MAXR - 1), L = rest.flatMap(c => c.L); cats = cats.slice(0, MAXR - 1).concat([{ n: 'Altre categorie', L, g: L.reduce((s, x) => s + Math.max(0, x.g), 0), multi: rest.length }]); }
    cats.forEach((c, i) => { c.i = i; c.code = 'C' + (i + 1); c.L.sort((a, b) => b.g - a.g); c.disp = c.L.filter(x => !x.out).length; c.low = c.L.filter(x => x.low).length; c.outN = c.L.filter(x => x.out).length; c.val = c.L.reduce((s, x) => s + x.val, 0); c.col = PAL[i % PAL.length]; c.colH = PALH[i % PALH.length]; });
    const tot = arts.reduce((s, x) => s + Math.max(0, x.g), 0), disp = arts.filter(x => !x.out).length, val = arts.reduce((s, x) => s + x.val, 0);
    const low = arts.filter(x => x.low), out = arts.filter(x => x.out && x.s > 0);
    const MM = MV.filter(m => String(m.data).slice(0, 7) === m0);
    const car = MV.filter(m => C.num(m.quantita) > 0 && m.tipo !== 'rettifica').sort((a, b) => String(b.data).localeCompare(String(a.data)) || String(b.creato).localeCompare(String(a.creato)));
    const car30 = car.filter(m => String(m.data) >= dAgo(30));
    const ret = MV.filter(m => m.tipo === 'rettifica').sort((a, b) => String(b.data).localeCompare(String(a.data)));
    const ret90 = ret.filter(m => String(m.data) >= dAgo(90));
    const scar = MV.filter(m => C.num(m.quantita) < 0).sort((a, b) => String(b.data).localeCompare(String(a.data)) || String(b.creato).localeCompare(String(a.creato)));
    const parse = s => { try { return typeof s === 'string' ? JSON.parse(s || '[]') : (Array.isArray(s) ? s : []); } catch { return []; } };
    const ddt = C.ddt().slice().sort((a, b) => String(b.data).localeCompare(String(a.data)) || (parseInt(b.numero, 10) || 0) - (parseInt(a.numero, 10) || 0)).map(d => { const R = parse(d.righe).filter(l => !l.h), c = C.cliOf(d.cliente); return { d, R, cli: c, cliN: c ? c.nome : (d.cliente || 'Cliente'), citta: c ? [c.citta, c.prov && '(' + c.prov + ')'].filter(Boolean).join(' ') : '', pz: R.reduce((s, l) => s + C.num(l.q), 0) }; });
    const ddtM = ddt.filter(x => String(x.d.data).slice(0, 7) === m0);
    const trf = C.xiTransito();
    return { mag, arts, cats, tot, disp, val, low, out, MM, car, car30, ret, ret90, scar, ddt, ddtM, trf, t0, nArt: arts.length, cli: C.cli() };
  }

  /* ---------------- scena ---------------- */
  const M = {}; // materiali
  function mat(c) { return M[c] || (M[c] = new T.MeshLambertMaterial({ color: c })); }
  function box(w, h, d, c, x, y, z, o) { const m = new T.Mesh(new T.BoxGeometry(w, h, d), typeof c === 'number' || typeof c === 'string' ? mat(c) : c); m.position.set(x, y + h / 2, z); m.castShadow = !(o && o.ns); m.receiveShadow = true; (o && o.p || scene).add(m); return m; }
  function inst(geo, material, mats, cols) {
    const im = new T.InstancedMesh(geo, material, Math.max(1, mats.length)); im.count = mats.length;
    mats.forEach((m4, i) => im.setMatrixAt(i, m4)); if (cols) cols.forEach((c, i) => im.setColorAt(i, new T.Color(c)));
    im.castShadow = true; im.receiveShadow = true; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; scene.add(im); return im;
  }
  const m4 = (x, y, z, sx, sy, sz, ry) => { const o = new T.Object3D(); o.position.set(x, y, z); o.scale.set(sx || 1, sy || 1, sz || 1); o.rotation.y = ry || 0; o.updateMatrix(); return o.matrix.clone(); };
  function textTex(lines, o) {
    o = o || {}; const W = o.w || 512, H = o.h || 128, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    if (o.bg) { g.fillStyle = o.bg; g.fillRect(0, 0, W, H); }
    g.fillStyle = o.color || '#fff'; g.textAlign = o.align || 'center'; g.textBaseline = 'middle';
    lines.forEach(([t, size, wgt, y, x]) => { g.font = `${wgt || 700} ${size}px Inter, system-ui, sans-serif`; g.fillText(t, x != null ? x : (o.align === 'left' ? 20 : W / 2), y != null ? y : H / 2); });
    const tx = new T.CanvasTexture(cv); tx.colorSpace = T.SRGBColorSpace; tx.anisotropy = 4; return tx;
  }
  function plane(w, d, tex, x, y, z, ry, o) { const m = new T.Mesh(new T.PlaneGeometry(w, d), new T.MeshLambertMaterial({ map: tex, transparent: true, depthWrite: false, ...(o || {}) })); m.rotation.x = -Math.PI / 2; m.rotation.z = ry || 0; m.position.set(x, y, z); m.receiveShadow = true; scene.add(m); return m; }
  const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

  // area dell'edificio e delle zone (metri)
  const B = { x0: -42, x1: 44, z0: -27, z1: 23 };
  const Z = {
    all: { code: 'ALL', n: 'Panoramica', t: [4, 0, 8], dist: 265, az: -0.3, pol: 0.9 },
    ric: { code: 'RIC', n: 'Ricevimento merci', s: 'Arrivi · scarico · controllo colli', t: [-30, 0, -2], dist: 70, az: -0.75, pol: 0.92, lab: [-30, 4.5, -4], ic: 'dock' },
    stk: { code: 'STK', n: 'Scaffalature', s: 'Stoccaggio · corsie · vani', t: [8, 0, -9], dist: 82, az: -0.55, pol: 0.9, lab: [8, 7.4, -9], ic: 'rack' },
    pre: { code: 'PRE', n: 'Preparazione ordini', s: 'Prelievo · imballo · DDT', t: [0, 0, 16], dist: 58, az: -0.7, pol: 0.95, lab: [-1, 4.4, 18], ic: 'hand' },
    cq: { code: 'CQ', n: 'Controllo e inventario', s: 'Verifica colli · rettifiche', t: [23, 0, 16], dist: 46, az: -0.6, pol: 0.95, lab: [23, 5.6, 14.5], ic: 'shield' },
    spe: { code: 'SPE', n: 'Spedizioni', s: 'Banchine · carico camion', t: [50, 0, -3], dist: 92, az: 0.62, pol: 0.95, lab: [40, 5, -2], ic: 'truck' },
    uff: { code: 'UFF', n: 'Uffici', s: 'Clienti · documenti', t: [22, 0, 36], dist: 100, az: -0.45, pol: 0.95, lab: [22, 8.5, 35], ic: 'office' }
  };
  const ZK = ['all', 'ric', 'stk', 'pre', 'cq', 'spe', 'uff'];
  const RACK = { x0: -12, bays: 10, bw: 3.9, lv: 4, lh: 1.15, dep: 1.3, z0: -23.5, gap: 4.4 };

  function buildScene() {
    scene = new T.Scene();
    scene.background = new T.Color(0xa6d673);
    scene.fog = new T.Fog(0xa6d673, 260, 520);
    cam = new T.PerspectiveCamera(28, 1, 1, 1400);
    scene.add(new T.HemisphereLight(0xffffff, 0x9bc46f, 1.55));
    const sun = new T.DirectionalLight(0xfff6ea, 2.1); sun.position.set(-70, 120, 60); sun.castShadow = true;
    const sc = sun.shadow.camera; sc.left = -110; sc.right = 110; sc.top = 90; sc.bottom = -90; sc.near = 10; sc.far = 360;
    sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.4; sun.shadow.radius = 4; scene.add(sun);

    // terreno, colline
    const gnd = new T.Mesh(new T.PlaneGeometry(1400, 1400), mat(0xa2d36c)); gnd.rotation.x = -Math.PI / 2; gnd.receiveShadow = true; scene.add(gnd);
    [[-170, -150, 120, 0xb3dc80], [40, -230, 150, 0xa9d775], [230, -120, 110, 0x9ccf68], [-260, 60, 120, 0xb0da7c], [-120, 190, 90, 0x94c95f], [210, 170, 100, 0xa4d36f]].forEach(([x, z, r, c]) => { const h = new T.Mesh(new T.SphereGeometry(r, 24, 12), mat(c)); h.scale.y = .22; h.position.set(x, -r * .06, z); h.receiveShadow = true; scene.add(h); });
    // piazzale e strade
    box(B.x1 - B.x0 + 22, .12, B.z1 - B.z0 + 16, 0xe9e8e4, (B.x0 + B.x1) / 2 + 1, 0, (B.z0 + B.z1) / 2 + 2, { ns: 1 });
    box(30, .16, 66, 0x4c5159, 64, 0, -2, { ns: 1 }); // piazzale camion
    for (let i = 0; i < 5; i++) box(13, .18, .25, 0xf2f2f0, 62, 0, -22 + i * 10, { ns: 1 });
    box(1400, .14, 11, 0x50555d, 0, 0, 56, { ns: 1 }); // strada
    const dash = []; for (let x = -340; x < 340; x += 9) dash.push(m4(x, .2, 56, 1, 1, 1)); inst(new T.BoxGeometry(4, .05, .32), mat(0xf4f4f2), dash);
    box(11, .15, 26, 0x50555d, 64, 0, 41, { ns: 1 }); // accesso piazzale
    box(8, .15, 12, 0x50555d, 6, 0, 46, { ns: 1 }); // accesso uffici e parcheggio
    box(1400, .1, .5, 0xe6e4dc, 0, 0, 50.2, { ns: 1 }); box(1400, .1, .5, 0xe6e4dc, 0, 0, 61.8, { ns: 1 });

    // pavimento e zone
    box(B.x1 - B.x0, .5, B.z1 - B.z0, 0xf5f1ea, (B.x0 + B.x1) / 2, 0, (B.z0 + B.z1) / 2);
    const fl = (x0, x1, z0, z1, c) => box(x1 - x0, .04, z1 - z0, c, (x0 + x1) / 2, .5, (z0 + z1) / 2, { ns: 1 });
    fl(-41.5, -17.5, -26.5, 22.5, 0xf7efe2); fl(-15, 31, -26.5, 8.5, 0xf2f1ee); fl(-15, 15, 10, 22.5, 0xf8eee2); fl(16, 31, 10, 22.5, 0xe6f1e6); fl(33, 43.5, -26.5, 22.5, 0xf1efea);
    // muri bassi bianchi con bordo arancione (reparti aperti)
    const wall = (x0, z0, x1, z1, h) => { h = h || 2.4; const L = Math.hypot(x1 - x0, z1 - z0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, a = Math.atan2(z1 - z0, x1 - x0);
      const w = box(L, h, .45, 0xfbfbfa, cx, .5, cz); w.rotation.y = -a; const cap = box(L + .02, .2, .5, 0xf47b20, cx, .5 + h, cz, { ns: 1 }); cap.rotation.y = -a; };
    wall(B.x0, B.z0, B.x1, B.z0, 3.2); wall(B.x0, B.z0, B.x0, B.z1, 3.2);
    wall(B.x0, B.z1, -30, B.z1, 1.6); wall(-24, B.z1, 8, B.z1, 1.6); wall(14, B.z1, B.x1, B.z1, 1.6);
    wall(B.x1, B.z0, B.x1, -22, 3.2); wall(B.x1, 20, B.x1, B.z1, 3.2);
    wall(-17, -26.5, -17, -10, 1.4); wall(-17, -4, -17, 8.8, 1.4); wall(-17, 14, -17, 22.5, 1.4);
    wall(-15, 9.2, -2, 9.2, 1.1); wall(5, 9.2, 31.5, 9.2, 1.1); wall(15.5, 12, 15.5, 22.5, 1.1); wall(32, -26.5, 32, -12, 1.1); wall(32, -5, 32, 8, 1.1);
    // scritte a pavimento
    const ft = (txt, w, x, z, ry, col) => plane(w, w / 5.3, textTex([[txt, 92, 800]], { color: col || 'rgba(244,123,32,.55)', w: 1024, h: 192 }), x, .56, z, ry);
    ft('RICEVIMENTO', 20, -29.5, 17.5, 0); ft('MAGAZZINO', 22, 8, 6.2, 0, 'rgba(160,160,160,.35)'); ft('PREPARAZIONE', 15, -1, 20.6, 0); ft('SPEDIZIONI', 17, 38, 14, Math.PI / 2); ft('CONTROLLO', 11, 23.5, 21.2, 0, 'rgba(60,150,80,.45)');

    // porte di banchina sul lato destro
    for (let i = 0; i < 6; i++) { const z = -19 + i * 7.2; box(.3, 2.9, 4.6, 0x3d4249, B.x1 + .1, .5, z, { ns: 1 }); box(.35, .3, 5, 0xf47b20, B.x1 + .12, 3.3, z, { ns: 1 }); box(2.2, .6, 4.6, 0xb9bcc0, B.x1 + 1.2, 0, z, { ns: 1 }); }

    // uffici
    const ox = 22, oz = 35;
    const ofc = box(26, 6.4, 11, 0xfdfdfc, ox, 0, oz); ofc.userData.k = { t: 'zone', z: 'uff' }; pick.push(ofc);
    box(26.1, 1.4, 11.1, 0x6f8fa8, ox, 1.3, oz, { ns: 1 }); box(26.1, 1.4, 11.1, 0x6f8fa8, ox, 4.1, oz, { ns: 1 });
    for (let i = 0; i < 6; i++) box(.25, 1.42, 11.12, 0xfdfdfc, ox - 11 + i * 4.4, 1.3, oz, { ns: 1 }), box(.25, 1.42, 11.12, 0xfdfdfc, ox - 11 + i * 4.4, 4.1, oz, { ns: 1 });
    box(26.4, .3, 11.4, 0xeeeeec, ox, 6.4, oz, { ns: 1 });
    const pv = []; for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) pv.push(m4(ox - 9 + i * 4.4, 7, oz - 2.2 + j * 4.4, 1, 1, 1));
    const pvm = inst(new T.BoxGeometry(3.6, .18, 2.2), mat(0x27406b), pv); pvm.rotation.x = 0;
    const sign = new T.Mesh(new T.PlaneGeometry(10, 1.7), new T.MeshBasicMaterial({ map: textTex([[C.orgName().slice(0, 30), 64, 700]], { bg: '#17191c', w: 768, h: 128 }) }));
    sign.position.set(ox + 6, 5.25, oz + 5.62); scene.add(sign);
    box(7, 3.4, 8, 0xf3f2f0, ox + 17, 0, oz + 1); box(7.2, .3, 8.2, 0x7fbf5e, ox + 17, 3.4, oz + 1, { ns: 1 });
    pick.push(...[sign].map(o => (o.userData.k = { t: 'zone', z: 'uff' }, o)));
    // parcheggio con pensiline fotovoltaiche
    box(32, .13, 18, 0x5d636b, -22, 0, 37, { ns: 1 });
    const pp = [], pl = [];
    for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { pp.push(m4(-34 + i * 4.8, 3.2, 31.5 + r * 11, 4.4, 1, 5.6, 0)); pl.push(m4(-34 + i * 4.8, 1.6, 31.5 + r * 11, 1, 1, 1)); }
    const pan = inst(new T.BoxGeometry(1, .18, 1), mat(0x2b4777), pp); pan.rotation.x = 0;
    inst(new T.BoxGeometry(.18, 3.2, .18), mat(0xdedede), pl);
    const cars = [], cc = []; const CC = [0xffffff, 0xd0d4da, 0x2f3540, 0xc94b3c, 0x6f8fa8];
    for (let i = 0; i < 9; i++) { const r = i % 2, k = Math.floor(i / 2) + (r ? 1 : 0); cars.push(m4(-34 + k * 4.8, .55, 31.5 + r * 11, 1, 1, 1)); cc.push(CC[i % CC.length]); }
    inst(new T.BoxGeometry(2, 1.1, 4.2), mat(0xffffff), cars, cc);

    // alberi
    const tr = [], trc = [], pn = [], tk = [];
    const free = (x, z) => !(x > -72 && x < 80 && z > -38 && z < 49) && !(z > 48 && z < 64) ;
    let n = 0; while (n < 620) { const near = rnd() < .35, x = (rnd() - .5) * (near ? 240 : 600), z = (rnd() - .5) * (near ? 180 : 460) - (near ? 5 : 30); if (!free(x, z)) continue; n++; const s = .55 + rnd() * .6;
      if (rnd() < .22) pn.push(m4(x, 0, z, s, s * 1.15, s)); else { tr.push(m4(x, 2.6 * s + 1.1, z, s, s, s)); trc.push([0x7cbf4f, 0x8cc95a, 0x6fb347, 0x98cf62][Math.floor(rnd() * 4)]); tk.push(m4(x, 0, z, s, s, s)); } }
    inst(new T.IcosahedronGeometry(2.3, 1), mat(0xffffff), tr, trc);
    inst(new T.CylinderGeometry(.22, .3, 2.4, 6).translate(0, 1.2, 0), mat(0x8a6a4f), tk);
    inst(new T.ConeGeometry(1.9, 6.5, 7).translate(0, 3.25 + .4, 0), mat(0x4f9a43), pn);
    // aiuole davanti
    const sh = []; for (let i = 0; i < 26; i++) sh.push(m4(-40 + i * 3.2, .5, 27.5 + (i % 2) * .6, .55, .55, .55)); inst(new T.IcosahedronGeometry(1.4, 1), mat(0x86c457), sh);

    buildRacks(); buildFloorStuff(); buildTrucks();
  }

  /* scaffalature: una corsia per categoria, vani riempiti in base alle giacenze */
  let boxIM = null, boxMap = [], rackGroups = [], pinIM = null, hiMesh = null;
  function slotPos(r, b, l, s) { const x = RACK.x0 + b * RACK.bw + RACK.bw * (.2 + s * .3), y = .6 + .18 + l * RACK.lh, z = RACK.z0 + r * RACK.gap; return [x, y, z]; }
  function buildRacks() {
    const nr = Math.max(4, Math.min(8, D.cats.length || 4)), up = [], bm = [], top = [];
    const len = RACK.bays * RACK.bw;
    for (let r = 0; r < nr; r++) {
      const z = RACK.z0 + r * RACK.gap;
      for (let b = 0; b <= RACK.bays; b++) { const x = RACK.x0 + b * RACK.bw; up.push(m4(x, .5, z - RACK.dep / 2, 1, 1, 1)); up.push(m4(x, .5, z + RACK.dep / 2, 1, 1, 1)); }
      for (let l = 0; l <= RACK.lv; l++) { const y = .6 + l * RACK.lh; bm.push(m4(RACK.x0 + len / 2, y, z - RACK.dep / 2, len, 1, 1)); bm.push(m4(RACK.x0 + len / 2, y, z + RACK.dep / 2, len, 1, 1)); }
      const c = D.cats[r];
      const tx = textTex(Array.from({ length: RACK.bays }, (_, b) => [String(b + 1).padStart(2, '0'), 30, 700, 32, (b + .5) * 2048 / RACK.bays]), { bg: '#1b1d21', w: 2048, h: 64 });
      const band = new T.Mesh(new T.BoxGeometry(len + .3, .55, .12), [mat(0x1b1d21), mat(0x1b1d21), mat(0x1b1d21), mat(0x1b1d21), new T.MeshBasicMaterial({ map: tx }), mat(0x1b1d21)]);
      band.position.set(RACK.x0 + len / 2, .6 + RACK.lv * RACK.lh + .5, z + RACK.dep / 2 + .02); scene.add(band);
      // piano invisibile per cliccare la corsia
      const hit = new T.Mesh(new T.BoxGeometry(len, RACK.lv * RACK.lh + 1, RACK.dep + 1.2), new T.MeshBasicMaterial({ visible: false }));
      hit.position.set(RACK.x0 + len / 2, .6 + (RACK.lv * RACK.lh) / 2, z); hit.userData.k = { t: 'row', r }; scene.add(hit); pick.push(hit); rackGroups[r] = hit;
    }
    inst(new T.BoxGeometry(.16, RACK.lv * RACK.lh + .85, .16).translate(0, (RACK.lv * RACK.lh + .85) / 2, 0), mat(0x2f6fb5), up);
    inst(new T.BoxGeometry(1, .14, .14), mat(0xf47b20), bm);
    // scatole
    const mats = [], cols = []; boxMap = []; const pins = [];
    D.cats.slice(0, nr).forEach((c, r) => {
      const cap = RACK.bays * RACK.lv * 3, P = c.L.filter(x => !x.out), sumG = P.reduce((s, x) => s + x.g, 0) || 1;
      const F = Math.min(cap, Math.max(P.length, Math.round(cap * (0.3 + 0.62 * (c.disp / Math.max(1, c.L.length))))));
      let k = 0; const order = [];
      for (let l = 0; l < RACK.lv; l++) for (let b = 0; b < RACK.bays; b++) for (let s = 0; s < 3; s++) order.push([b, l, s]);
      // ordine "naturale" ma un po' sparso, così non sembra un blocco pieno
      const sh = order.map((o, i) => [o, (o[1] * 0.9) + ((i * 7919) % 97) / 97 * 1.6]).sort((a, b) => a[1] - b[1]).map(x => x[0]);
      const slots = P.map(x => Math.max(1, Math.round(x.g / sumG * F)));
      let over = slots.reduce((s, v) => s + v, 0) - F; for (let i = slots.length - 1; over > 0 && i >= 0; i--) { const cut = Math.min(over, slots[i] - 1); slots[i] -= cut; over -= cut; }
      P.forEach((x, i) => { for (let j = 0; j < slots[i] && k < cap; j++, k++) {
        const [b, l, s] = sh[k], [px, py, pz] = slotPos(r, b, l, s), hv = .55 + ((k * 13) % 5) * .07;
        mats.push(m4(px, py + hv / 2, pz, 1.08, hv, 1.08, 0)); cols.push(x.low ? 0xef6a45 : c.col); boxMap.push({ id: x.id, r, b, l, s });
        if (j === 0 && x.low) pins.push(m4(px, .6 + RACK.lv * RACK.lh + 1.35, pz + RACK.dep / 2 + .1, 1, 1, 1));
      } });
    });
    boxIM = inst(new T.BoxGeometry(1, 1, 1), mat(0xffffff), mats, cols); boxIM.userData.k = { t: 'box' }; pick.push(boxIM);
    if (pins.length) { pinIM = inst(new T.SphereGeometry(.32, 10, 8), new T.MeshBasicMaterial({ color: 0xe8432a }), pins); }
    // evidenzia vano
    hiMesh = new T.Mesh(new T.BoxGeometry(1.4, 1.05, 1.5), new T.MeshBasicMaterial({ color: 0xf47b20, transparent: true, opacity: .45, depthWrite: false, depthTest: false }));
    hiMesh.visible = false; scene.add(hiMesh);
    const eg = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(1.4, 1.05, 1.5)), new T.LineBasicMaterial({ color: 0xf47b20, depthTest: false })); eg.renderOrder = 11; hiMesh.add(eg); hiMesh.renderOrder = 10;
  }

  /* operatori, carrelli, nastro, pallet in ricevimento, controllo */
  let beltIM = null, beltN = 0;
  function person(x, z, col, p) {
    const g = new T.Group(); g.position.set(x, .55, z);
    const legs = new T.Mesh(new T.BoxGeometry(.5, .8, .32), mat(0x2b3440)); legs.position.y = .4; g.add(legs);
    const body = new T.Mesh(new T.BoxGeometry(.62, .75, .4), mat(0xfafafa)); body.position.y = 1.18; g.add(body);
    const vest = new T.Mesh(new T.BoxGeometry(.64, .28, .42), mat(col || 0x39a85a)); vest.position.y = 1.3; g.add(vest);
    const head = new T.Mesh(new T.SphereGeometry(.24, 10, 8), mat(0xe9c4a0)); head.position.y = 1.78; g.add(head);
    const hair = new T.Mesh(new T.SphereGeometry(.25, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x3a2a20)); hair.position.y = 1.83; g.add(hair);
    g.traverse(o => { if (o.isMesh) o.castShadow = true; }); (p || scene).add(g); return g;
  }
  function forklift(x, z) {
    const g = new T.Group(); g.position.set(x, .55, z);
    const b = new T.Mesh(new T.BoxGeometry(1.4, .9, 2.1), mat(0xf47b20)); b.position.y = .55; g.add(b);
    const c = new T.Mesh(new T.BoxGeometry(1.3, .9, .9), mat(0x2b2f35)); c.position.set(0, 1.4, -.35); g.add(c);
    const m = new T.Mesh(new T.BoxGeometry(1.2, 2.4, .12), mat(0x3a3f46)); m.position.set(0, 1.25, 1.1); g.add(m);
    const f = new T.Mesh(new T.BoxGeometry(1, .08, 1.2), mat(0x3a3f46)); f.position.set(0, .2, 1.7); g.add(f);
    const ld = new T.Mesh(new T.BoxGeometry(1, .8, 1), mat(0xe9a25c)); ld.position.set(0, .64, 1.7); g.add(ld);
    g.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(g); return g;
  }
  function buildFloorStuff() {
    // carrelli nelle corsie
    const nr = Math.max(4, Math.min(8, D.cats.length || 4));
    [1, 3, 5].filter(i => i < nr).forEach((i, k) => { const f = forklift(RACK.x0 + 4 + k * 12, RACK.z0 + i * RACK.gap + RACK.gap / 2); movers.push({ o: f, t: 'fork', a: RACK.x0 + 2, b: RACK.x0 + RACK.bays * RACK.bw - 2, sp: 2.4 + k * .5, ph: k * 2.1 }); });
    // ricevimento: un pallet per ogni carico degli ultimi 30 giorni (max 24)
    const pal = [], pb = [], pbc = [], recv = D.car30.slice(0, 24); const pm = [];
    recv.forEach((m, i) => { const col = i % 4, row = Math.floor(i / 4), x = -38 + col * 4.6, z = -22 + row * 4.8; pal.push(m4(x, .55, z, 1, 1, 1));
      const h = 1 + Math.min(2, Math.floor(C.num(m.quantita) / 40)); for (let y = 0; y < h; y++) for (let q = 0; q < 4; q++) { pb.push(m4(x - .6 + (q % 2) * 1.2, .85 + y * .85 + .4, z - .55 + Math.floor(q / 2) * 1.1, 1.05, .8, 1, 0)); pbc.push(PAL[(i + y) % 4]); }
      pm.push(m); });
    if (pal.length) { inst(new T.BoxGeometry(2.6, .28, 2.6), mat(0xc79a68), pal); const im = inst(new T.BoxGeometry(1, 1, 1), mat(0xffffff), pb, pbc); im.userData.k = { t: 'zone', z: 'ric' }; pick.push(im); }
    const rf = forklift(-28, 8); movers.push({ o: rf, t: 'loop', cx: -28, cz: 4, rx: 7, rz: 9, sp: .35, ph: 0 });
    // area ricevimento cliccabile
    const hz = (x0, x1, z0, z1, z) => { const h = new T.Mesh(new T.BoxGeometry(x1 - x0, .6, z1 - z0), new T.MeshBasicMaterial({ visible: false })); h.position.set((x0 + x1) / 2, .5, (z0 + z1) / 2); h.userData.k = { t: 'zone', z }; scene.add(h); pick.push(h); };
    hz(-41.5, -17.5, -26.5, 22.5, 'ric'); hz(-15, 15, 10, 22.5, 'pre'); hz(16, 31, 10, 22.5, 'cq'); hz(33, 43.5, -26.5, 22.5, 'spe');
    // nastro trasportatore: dalle scaffalature alla spedizione
    const bl = box(52, .5, 1.6, 0x2d3238, 9, .9, 15.2); bl.userData.k = { t: 'zone', z: 'pre' }; pick.push(bl);
    const legs = []; for (let x = -16; x < 34; x += 3.2) { legs.push(m4(x, .5, 14.6, 1, 1, 1)); legs.push(m4(x, .5, 15.8, 1, 1, 1)); }
    inst(new T.BoxGeometry(.14, .9, .14).translate(0, .45, 0), mat(0x9aa0a8), legs);
    box(52, .12, .14, 0xb8bdc3, 9, 1.4, 14.35, { ns: 1 }); box(52, .12, .14, 0xb8bdc3, 9, 1.4, 16.05, { ns: 1 });
    beltN = clamp(D.ddt.filter(x => String(x.d.data) >= D.t0.slice(0, 8) + '01').length * 2 + 8, 10, 26);
    beltIM = new T.InstancedMesh(new T.BoxGeometry(1.05, .75, 1), mat(0xe9a25c), beltN); beltIM.castShadow = true; scene.add(beltIM);
    // tavoli di preparazione con operatori
    for (let i = 0; i < 4; i++) { const x = -11 + i * 6.6; box(3.4, 1, 1.8, 0xfafafa, x, .55, 11.6); box(.7, .5, .6, 0xe9a25c, x - .7, 1.55, 11.6); box(.6, .4, .6, 0xa9c98a, x + .6, 1.55, 11.4);
      const p = person(x, 13, [0x39a85a, 0xf47b20, 0x39a85a, 0x2f6fb5][i]); p.rotation.y = Math.PI; movers.push({ o: p, t: 'bob', ph: i }); }
    // controllo: portale verde sul nastro + banco con operatore
    box(.5, 2.6, .5, 0xfafafa, 23, .55, 13.9); box(.5, 2.6, .5, 0xfafafa, 23, .55, 16.5); box(1.3, .9, 3.4, 0x2cbf5d, 23, 3.1, 15.2);
    box(3, 1, 1.6, 0xfafafa, 26.5, .55, 19.5); box(.4, .4, .4, 0xf47b20, 25.8, 1.55, 19.4); box(.4, .4, .4, 0x2cbf5d, 26.5, 1.55, 19.4); box(.45, .45, .45, 0x1b1d21, 27.3, 1.55, 19.5);
    person(26.5, 21, 0x39a85a).rotation.y = Math.PI; const p2 = person(20.5, 17.4, 0x39a85a); movers.push({ o: p2, t: 'walk', a: [20.5, 17.4], b: [28, 17.4], sp: .8, ph: 1 });
    // pallettizzatore (braccio arancione) a fine nastro
    const arm = new T.Group(); arm.position.set(31.6, .55, 15.2); const base = new T.Mesh(new T.CylinderGeometry(.8, 1, .8, 16), mat(0xe0e2e5)); base.position.y = .4; arm.add(base);
    const a1 = new T.Group(); a1.position.y = .8; arm.add(a1); const s1 = new T.Mesh(new T.BoxGeometry(.55, 2.8, .55), mat(0xf47b20)); s1.position.y = 1.4; s1.rotation.z = .35; a1.add(s1);
    const s2 = new T.Mesh(new T.BoxGeometry(2.2, .45, .45), mat(0xf47b20)); s2.position.set(-1.3, 2.7, 0); a1.add(s2); arm.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(arm);
    movers.push({ o: a1, t: 'spin', sp: .6 });
    // operatori che camminano
    [[-34, -6, -22, -6], [-36, 12, -36, -18], [-6, 21, 12, 21], [36, -20, 36, 18], [38, 18, 38, -16]].forEach(([x0, z0, x1, z1], i) => { const p = person(x0, z0, i % 2 ? 0xf47b20 : 0x39a85a); movers.push({ o: p, t: 'walk', a: [x0, z0], b: [x1, z1], sp: .7 + i * .12, ph: i * 1.7 }); });
    // sfera arancione all'ingresso (come nel plastico)
    const orb = new T.Mesh(new T.SphereGeometry(2.2, 24, 16), mat(0xf47b20)); orb.position.set(2, 3.5, 33); orb.castShadow = true; scene.add(orb);
    box(4, .8, 4, 0x2b2f35, 2, 0, 33); movers.push({ o: orb, t: 'float', y: 3.5 });
  }

  /* camion: uno per DDT recente alle banchine, altri in viaggio sulla strada */
  let trucks = [];
  function truck(x, z, ry, d, roadMove) {
    const g = new T.Group(); g.position.set(x, .1, z); g.rotation.y = ry;
    const tr = new T.Mesh(new T.BoxGeometry(12, 3.6, 3), mat(0xfbfbfa)); tr.position.set(-2, 2.4, 0); g.add(tr);
    const st = new T.Mesh(new T.BoxGeometry(12.05, .55, 3.05), mat(0xf47b20)); st.position.set(-2, 1.05, 0); g.add(st);
    const lg = new T.Mesh(new T.PlaneGeometry(6, 1.1), new T.MeshBasicMaterial({ map: textTex([[C.orgName().toUpperCase().slice(0, 22), 56, 800]], { color: '#2b2f35', w: 768, h: 128 }), transparent: true }));
    lg.position.set(-2, 2.9, 1.53); g.add(lg); const lg2 = lg.clone(); lg2.position.z = -1.53; lg2.rotation.y = Math.PI; g.add(lg2);
    const cab = new T.Mesh(new T.BoxGeometry(2.6, 3, 2.9), mat(0xffffff)); cab.position.set(5.6, 2, 0); g.add(cab);
    const win = new T.Mesh(new T.BoxGeometry(.1, 1.1, 2.4), mat(0x2b3440)); win.position.set(6.93, 2.7, 0); g.add(win);
    const cs = new T.Mesh(new T.BoxGeometry(2.62, .5, 2.92), mat(0xf47b20)); cs.position.set(5.6, 1.1, 0); g.add(cs);
    const wh = new T.CylinderGeometry(.55, .55, .4, 12); [[-6, 1.4], [-4.6, 1.4], [5.6, 1.4], [-6, -1.4], [-4.6, -1.4], [5.6, -1.4]].forEach(([wx, wz]) => { const w = new T.Mesh(wh, mat(0x22262b)); w.rotation.x = Math.PI / 2; w.position.set(wx, .55, wz); g.add(w); });
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.userData.k = { t: 'truck', i: trucks.length }; pick.push(o); } });
    scene.add(g); const t = { g, d, road: roadMove }; trucks.push(t); return t;
  }
  function buildTrucks() {
    trucks = [];
    const recent = D.ddt.slice(0, 9);
    const DZ = [-19, -11.8, 2.6, 9.8]; recent.slice(0, 4).forEach((d, i) => truck(B.x1 + 9.5, DZ[i], 0, d, 0));
    recent.slice(4, 7).forEach((d, i) => { const t = truck(-120 + i * 95, 53.5, 0, d, 1); movers.push({ o: t.g, t: 'road', sp: 7 + i, dir: 1, z: 53.5 }); });
    D.trf.slice(0, 2).forEach((x, i) => { const t = truck(80 - i * 110, 58.5, Math.PI, { trf: x }, 1); movers.push({ o: t.g, t: 'road', sp: 6 + i, dir: -1, z: 58.5 }); });
    if (!recent.length) { const t = truck(B.x1 + 9.5, -19, 0, null, 0); }
  }

  /* ---------------- etichette arancioni sopra i reparti ---------------- */
  function buildLabels() {
    const box = $('.m3-lbs'); box.innerHTML = ''; labels = [];
    const add = (pos, html, cls, k, minD, maxD) => { const el = document.createElement('div'); el.className = 'm3-lb ' + (cls || ''); el.innerHTML = html; box.appendChild(el); const L = { p: new T.Vector3(...pos), el, k, minD: minD || 0, maxD: maxD || 1e9 }; el.onclick = () => select(k); labels.push(L); return L; };
    const nr = Math.max(4, Math.min(8, D.cats.length || 4)), vani = nr * RACK.bays * RACK.lv * 3;
    add(Z.stk.lab, `Scaffalature <em>${nr} corsie · ${N(vani)} vani</em>`, '', { t: 'zone', z: 'stk' }, 0, 1e9);
    add(Z.ric.lab, `Ricevimento <em>${D.car30.length} carichi in 30 gg</em>`, '', { t: 'zone', z: 'ric' }, 0, 330);
    add(Z.pre.lab, `Preparazione <em>${D.ddtM.length} DDT nel mese</em>`, '', { t: 'zone', z: 'pre' }, 0, 330);
    add(Z.cq.lab, `Controllo <em>${D.ret90.length} rettifiche</em>`, '', { t: 'zone', z: 'cq' }, 0, 150);
    add(Z.spe.lab, `Spedizioni <em>${trucks.filter(t => !t.road && t.d).length} in banchina</em>`, '', { t: 'zone', z: 'spe' }, 0, 330);
    add(Z.uff.lab, `Uffici <em>${D.cli.length} clienti</em>`, 'wh', { t: 'zone', z: 'uff' }, 0, 220);
    D.cats.slice(0, nr).forEach((c, r) => add([RACK.x0 + RACK.bays * RACK.bw / 2, .6 + RACK.lv * RACK.lh + 1.5, RACK.z0 + r * RACK.gap], `${c.code} · ${esc(c.n.length > 22 ? c.n.slice(0, 21) + '…' : c.n)} <em>${N(c.g)} pz${c.low ? ' · ' + c.low + ' sotto scorta' : ''}</em>`, 'sm', { t: 'row', r }, 0, 95));
    trucks.forEach((t, i) => { if (!t.d) return; const L = add([0, 5.5, 0], t.d.trf ? `Trasferimento <em>in viaggio</em>` : `DDT ${esc(C.dnum(t.d.d))} <em>${esc(t.d.cliN.slice(0, 18))}</em>`, 'sm wh', { t: 'truck', i }, 0, t.road ? 140 : 110); L.obj = t.g; });
  }
  const V = new (function () { this.v = null; })();
  function updLabels() {
    const w = R.domElement.clientWidth, h = R.domElement.clientHeight; if (!V.v) V.v = new T.Vector3();
    labels.forEach(L => {
      if (L.obj) { V.v.copy(L.obj.position); V.v.y += 5.5; } else V.v.copy(L.p);
      const d = cam.position.distanceTo(V.v); V.v.project(cam);
      const on = V.v.z < 1 && d < L.maxD && d > L.minD && Math.abs(V.v.x) < 1.1 && Math.abs(V.v.y) < 1.1;
      const act = sel && L.k.t === sel.t && (L.k.z === sel.z && L.k.r === sel.r && L.k.i === sel.i);
      const quiet = sel && sel.t === 'row' && L.k.t === 'row' && !act;
      L.el.classList.toggle('hid', (!on && !act) || quiet);
      L.el.style.transform = `translate(${((V.v.x + 1) / 2 * w).toFixed(1)}px,${((1 - V.v.y) / 2 * h).toFixed(1)}px) translate(-50%,-100%)`;
      L.el.style.zIndex = act ? 3 : (L.el.classList.contains('sm') ? 1 : 2);
    });
  }

  /* ---------------- camera ---------------- */
  function applyCam() {
    const sp = Math.sin(CAM.pol), cp = Math.cos(CAM.pol);
    cam.position.set(CAM.tx + CAM.dist * sp * Math.sin(CAM.az), CAM.dist * cp, CAM.tz + CAM.dist * sp * Math.cos(CAM.az));
    cam.lookAt(CAM.tx, 0, CAM.tz);
  }
  function fly(o) { Object.assign(GOAL, o); }
  function flyZone(z) { const q = Z[z]; if (!q) return; fly({ tx: q.t[0], tz: q.t[2], dist: q.dist, az: q.az, pol: q.pol }); }
  function stepCam(dt) {
    const k = 1 - Math.exp(-dt * 3.2);
    let da = GOAL.az - CAM.az; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    CAM.az += da * k; CAM.tx += (GOAL.tx - CAM.tx) * k; CAM.tz += (GOAL.tz - CAM.tz) * k; CAM.dist += (GOAL.dist - CAM.dist) * k; CAM.pol += (GOAL.pol - CAM.pol) * k;
    applyCam();
  }

  /* ---------------- animazioni ---------------- */
  let o3 = null, viewOff = 0;
  function animate(t, dt) {
    if (!o3) o3 = new T.Object3D();
    movers.forEach(m => {
      const s = t * (m.sp || 1) + (m.ph || 0);
      if (m.t === 'fork') { const u = (Math.sin(s * .25) + 1) / 2, x = m.a + (m.b - m.a) * u; const v = Math.cos(s * .25); m.o.position.x = x; m.o.rotation.y = v > 0 ? Math.PI / 2 : -Math.PI / 2; }
      else if (m.t === 'loop') { m.o.position.x = m.cx + Math.cos(s) * m.rx; m.o.position.z = m.cz + Math.sin(s) * m.rz; m.o.rotation.y = -s; }
      else if (m.t === 'walk') { const u = (Math.sin(s * .35) + 1) / 2; m.o.position.x = m.a[0] + (m.b[0] - m.a[0]) * u; m.o.position.z = m.a[1] + (m.b[1] - m.a[1]) * u; const dir = Math.cos(s * .35) >= 0 ? 1 : -1; m.o.rotation.y = Math.atan2((m.b[0] - m.a[0]) * dir, (m.b[1] - m.a[1]) * dir); m.o.position.y = .55 + Math.abs(Math.sin(s * 5)) * .06; }
      else if (m.t === 'bob') m.o.position.y = .55 + Math.abs(Math.sin(t * 2 + m.ph)) * .04;
      else if (m.t === 'spin') m.o.rotation.y = Math.sin(t * m.sp) * 1.3;
      else if (m.t === 'float') m.o.position.y = m.y + Math.sin(t * 1.2) * .25;
      else if (m.t === 'road') { m.o.position.x += m.dir * m.sp * dt; if (m.o.position.x > 330) m.o.position.x = -330; if (m.o.position.x < -330) m.o.position.x = 330; }
    });
    if (beltIM) { for (let i = 0; i < beltN; i++) { const u = ((t * .055 + i / beltN) % 1); o3.position.set(-16 + u * 47.5, 1.55 + .37, 15.2); o3.rotation.y = 0; o3.scale.set(1, 1, 1); o3.updateMatrix(); beltIM.setMatrixAt(i, o3.matrix); } beltIM.instanceMatrix.needsUpdate = true; }
    if (hiMesh && hiMesh.visible) { const s = 1 + Math.sin(t * 4) * .06; hiMesh.scale.set(s, s, s); }
  }

  /* ---------------- interfaccia ---------------- */
  function html() {
    const multi = C.magMulti();
    return `<canvas class="m3-c"></canvas><div class="m3-lbs"></div>
    <header class="m3-top">
      <div class="m3-brand"><i class="m3-logo">${ic('logo')}</i><b>${esc(C.orgName())}</b></div>
      <nav class="m3-tabs"><button type="button" class="on">${ic('cube')}Magazzino 3D</button><button type="button" data-m3="close">${ic('grid')}Gestionale</button></nav>
      <label class="m3-search">${ic('search')}<input type="search" placeholder="Articolo, codice, DDT, cliente" aria-label="Cerca nel magazzino" autocomplete="off"><kbd>/</kbd><div class="m3-res"></div></label>
      <div class="m3-shots" style="position:relative"><button type="button" class="m3-btn" data-m3="shots">${ic('cam')}<span>Riprese</span></button><div class="m3-menu" data-menu="shots"></div></div>
      <div class="m3-zone"><b class="m3-zc">ALL</b><span class="m3-zt"><b>Panoramica</b><small></small></span><button type="button" data-m3="next" aria-label="Reparto successivo">${ic('right')}</button><button type="button" data-m3="zones" aria-label="Scegli il reparto">${ic('down')}</button><div class="m3-menu" data-menu="zones" style="left:0;right:auto;min-width:260px"></div></div>
      ${multi ? `<select class="m3-sel" aria-label="Magazzino"><option value="">Tutti i magazzini</option>${C.MAGS().map(m => `<option${m === C.mag() ? ' selected' : ''}>${esc(m)}</option>`).join('')}</select>` : ''}
      <span class="m3-live"><i></i><span>Live</span> <b class="m3-clock"></b></span>
      <button type="button" class="m3-bell" data-m3="bell" aria-label="Da gestire">${ic('bell')}<em hidden></em></button>
      <button type="button" class="m3-x" data-m3="close" aria-label="Torna al gestionale">${ic('x')}</button>
    </header>
    <div class="m3-kpis"></div>
    <div class="m3-tools m3-card"><button type="button" data-m3="zin" aria-label="Avvicina">${ic('plus')}</button><button type="button" data-m3="zout" aria-label="Allontana">${ic('minus')}</button><hr><button type="button" data-m3="rl" aria-label="Ruota a sinistra">${ic('rl')}</button><button type="button" data-m3="rr" aria-label="Ruota a destra">${ic('rr')}</button><button type="button" data-m3="home" aria-label="Vista iniziale">${ic('home')}</button><button type="button" class="play" data-m3="play" aria-label="Visita guidata">${ic('play')}</button></div>
    <aside class="m3-panel m3-card"></aside>
    <div class="m3-flow m3-card"></div>
    <div class="m3-tab m3-card"></div>
    <div class="m3-load"><b>Preparo il magazzino…</b></div><div class="m3-toast"></div>`;
  }
  const stat = (l, v, unit, sub, p) => `<div class="m3-st"><span>${l}</span><b>${v}${unit ? `<small>${unit}</small>` : ''}</b>${sub ? `<em>${sub}</em>` : ''}${p != null ? `<div class="m3-bar"><u data-w="${clamp(p, 0, 1).toFixed(3)}"></u></div>` : ''}</div>`;
  const head = (icn, cls, ey, h, p, aim) => `<div class="m3-ph"><i class="m3-pi ${cls || ''}">${icn}</i><div class="m3-pt"><span class="m3-ey">${ey}</span><h3>${h}</h3>${p ? `<p>${p}</p>` : ''}</div><div class="m3-pa">${aim ? `<button type="button" data-m3="aim" aria-label="Inquadra">${ic('target')}</button>` : ''}<button type="button" data-m3="pclose" aria-label="Chiudi">${ic('x')}</button></div></div>`;
  const artRow = (x, hl) => { const st = x.out ? '<span class="m3-chip n"><i></i>Esaurito</span>' : x.low ? '<span class="m3-chip a"><i></i>Sotto scorta</span>' : '<span class="m3-chip g"><i></i>Disponibile</span>';
    const p = x.s > 0 ? Math.min(1, Math.max(0, x.g) / (x.s * 3)) : (x.out ? 0 : 1);
    return `<div class="m3-row${hl ? ' k' : ''}" data-art3="${esc(x.id)}">${donut(p, x.out ? '#c9cbcf' : x.low ? '#ef6a45' : OR)}<span class="tx"><b>${esc(x.a.descrizione || 'Articolo')}</b><small>${esc([x.a.codice, N(x.g) + ' ' + (x.a.um || 'pz'), x.s ? 'min. ' + N(x.s) : ''].filter(Boolean).join(' · '))}</small></span>${st}${canW() ? `<button type="button" class="pm" data-gx="mov-art" data-id="${esc(x.id)}" title="Carico / scarico">±</button>` : ''}</div>`; };
  const mvRow = m => { const a = C.artOf(m.articolo), q = C.num(m.quantita); return `<div class="m3-row"><i class="m3-pi" style="width:30px;height:30px;border-radius:9px">${ic(m.tipo === 'rettifica' ? 'check' : q > 0 ? 'box' : 'truck')}</i><span class="tx"><b>${esc(a ? a.descrizione : 'Articolo eliminato')}</b><small>${esc([C.dIt(m.data), m.causale, C.magMulti() ? C.magOf(m) : ''].filter(Boolean).join(' · '))}</small></span><span class="m3-chip ${q > 0 ? 'g' : 'a'}">${q > 0 ? '+' : ''}${N(q)}</span></div>`; };

  function panel(k) {
    const el = $('.m3-panel'); let h = '';
    const P = k || { t: 'zone', z: 'all' };
    if (P.t === 'zone' && P.z === 'all') {
      const todo = D.low.length + D.out.length + D.trf.length;
      h = head(ic('logo'), 'or', 'Magazzino · in tempo reale', esc(C.orgName()), 'Ricevimento · stoccaggio · preparazione · spedizione') + `<div class="m3-pb"><div class="m3-grid">
        ${stat('Pezzi in giacenza', N(D.tot), '', `${D.nArt} articoli`, D.nArt ? D.disp / D.nArt : 0)}
        ${stat('Disponibilità', pc(D.disp, D.nArt) + ' %', '', `${D.disp}/${D.nArt} articoli`, D.nArt ? D.disp / D.nArt : 0)}
        ${stat('Valore al costo', C.eur0(D.val), '', C.ivaLbl())}
        ${stat('Sotto scorta', D.low.length, '', D.low.length ? 'da riordinare' : 'tutto a posto')}
        ${stat('Movimenti del mese', D.MM.length, '', `${D.MM.filter(m => C.num(m.quantita) > 0).length} carichi · ${D.MM.filter(m => C.num(m.quantita) < 0).length} scarichi`)}
        ${stat('DDT del mese', D.ddtM.length, '', `${N(D.ddtM.reduce((s, x) => s + C.num(x.d.colli), 0))} colli`)}</div>
        <div class="m3-h4">Da gestire <em>${todo}</em></div><div class="m3-rows">
        ${D.trf.map(x => `<div class="m3-row"><i class="m3-pi" style="width:30px;height:30px;border-radius:9px">${ic('truck')}</i><span class="tx"><b>${esc(C.xiNum(x))} in viaggio</b><small>${esc((x.mag || 'Magazzino') + ' → ' + (x.mag2 || x.dest || ''))} · ${N(C.xiPz(x))} pz</small></span><span class="m3-chip a"><i></i>In viaggio</span></div>`).join('')}
        ${D.low.slice(0, 12).map(x => artRow(x)).join('')}${D.out.slice(0, 8).map(x => artRow(x)).join('')}
        ${todo ? '' : '<div class="m3-empty">Niente da gestire: giacenze sopra la scorta minima.</div>'}</div></div>`;
    } else if (P.t === 'zone' && P.z === 'stk') {
      const nr = Math.max(4, Math.min(8, D.cats.length || 4));
      h = head(ic('rack'), '', 'Zona', 'Scaffalature', `${nr} corsie · ${N(nr * RACK.bays * RACK.lv * 3)} vani · una corsia per categoria`, 1) + `<div class="m3-pb"><div class="m3-grid">
        ${stat('Pezzi a scaffale', N(D.tot), '', `${D.cats.length} categorie`)}${stat('Articoli disponibili', pc(D.disp, D.nArt) + ' %', '', `${D.disp}/${D.nArt}`, D.nArt ? D.disp / D.nArt : 0)}</div>
        <div class="m3-h4">Corsie <em>${D.cats.length}</em></div><div class="m3-rows">${D.cats.slice(0, nr).map(c => `<button type="button" class="m3-row" data-row3="${c.i}"><span class="m3-pi dk" style="width:30px;height:30px;border-radius:9px;font-size:11px;background:${c.colH};color:#17191c">${c.code}</span><span class="tx"><b>${esc(c.n)}</b><small>${c.L.length} articoli · ${N(c.g)} pz${c.multi ? ` · ${c.multi} categorie` : ''}</small></span>${c.low ? `<span class="m3-chip a">${c.low} sotto</span>` : '<span class="m3-chip g"><i></i>Ok</span>'}</button>`).join('') || '<div class="m3-empty">Nessun articolo in magazzino</div>'}</div></div>`;
    } else if (P.t === 'row') {
      const c = D.cats[P.r]; if (!c) return panel();
      const val = c.val, hl = P.art;
      h = head(`<b style="font-size:13px">${c.code}</b>`, 'dk', `Corsia ${String(P.r + 1).padStart(2, '0')} · scaffalature`, esc(c.n), `${c.L.length} articoli · ${RACK.bays} campate · ${RACK.lv} livelli`, 1) + `<div class="m3-pb">
        <div class="m3-chips">${c.low ? `<span class="m3-chip a"><i></i>${c.low} sotto scorta</span>` : '<span class="m3-chip g"><i></i>Scorte ok</span>'}${c.outN ? `<span class="m3-chip n">${c.outN} esauriti</span>` : ''}</div>
        <div class="m3-grid">${stat('Pezzi', N(c.g), '', `${c.disp}/${c.L.length} disponibili`, c.L.length ? c.disp / c.L.length : 0)}${stat('Valore al costo', C.eur0(val), '', C.ivaLbl())}</div>
        ${c.low ? `<div class="m3-warn">${ic('alert')}<span>${c.low === 1 ? `<b>${esc(c.L.find(x => x.low).a.descrizione)}</b> è sotto la scorta minima` : `<b>${c.low} articoli</b> sotto la scorta minima`} · da riordinare.</span></div>${canW() ? `<button type="button" class="m3-go" data-gx="mov-art" data-id="${esc(c.L.find(x => x.low).id)}">${ic('check')}Registra il carico</button>` : ''}` : ''}
        <div class="m3-h4">Articoli <em>${c.L.length}</em></div><div class="m3-rows">${c.L.slice(0, 60).map(x => artRow(x, x.id === hl)).join('')}${c.L.length > 60 ? `<div class="m3-empty">e altri ${c.L.length - 60}: usa la ricerca</div>` : ''}</div></div>`;
    } else if (P.t === 'zone' && P.z === 'ric') {
      const pz = D.car30.reduce((s, m) => s + C.num(m.quantita), 0);
      h = head(ic('dock'), '', 'Zona', 'Ricevimento merci', 'Arrivi dai fornitori · scarico · controllo colli', 1) + `<div class="m3-pb"><div class="m3-grid">
        ${stat('Carichi in 30 giorni', D.car30.length, '', `${N(pz)} pezzi`)}${stat('Ultimo arrivo', D.car[0] ? C.dIt(D.car[0].data) : '—', '', D.car[0] ? esc(D.car[0].causale || '') : 'nessun carico')}</div>
        ${canW() ? `<button type="button" class="m3-go" data-gx="mov-new">${ic('plus')}Nuovo carico</button>` : ''}
        <div class="m3-h4">Ultimi arrivi <em>${D.car.length}</em></div><div class="m3-rows">${D.car.slice(0, 20).map(mvRow).join('') || '<div class="m3-empty">Nessun carico registrato</div>'}</div></div>`;
    } else if (P.t === 'zone' && P.z === 'pre') {
      const pz = D.ddtM.reduce((s, x) => s + x.pz, 0);
      h = head(ic('hand'), '', 'Zona', 'Preparazione ordini', 'Prelievo dagli scaffali · imballo · DDT', 1) + `<div class="m3-pb"><div class="m3-grid">
        ${stat('DDT del mese', D.ddtM.length, '', `${N(pz)} pezzi preparati`)}${stat('Colli del mese', N(D.ddtM.reduce((s, x) => s + C.num(x.d.colli), 0)), '', 'dai DDT')}</div>
        <button type="button" class="m3-go" data-gx="ddt-new">${ic('plus')}Nuovo DDT</button>
        <div class="m3-h4">Ultimi scarichi <em>${D.scar.length}</em></div><div class="m3-rows">${D.scar.slice(0, 16).map(mvRow).join('') || '<div class="m3-empty">Nessuno scarico</div>'}</div></div>`;
    } else if (P.t === 'zone' && P.z === 'cq') {
      h = head(ic('shield'), '', 'Zona', 'Controllo e inventario', 'Verifica dei colli · rettifiche di inventario', 1) + `<div class="m3-pb"><div class="m3-grid">
        ${stat('Rettifiche in 90 gg', D.ret90.length, '', D.ret[0] ? 'ultima ' + C.dIt(D.ret[0].data) : 'nessuna')}${stat('Articoli da verificare', D.low.length + D.out.length, '', 'sotto scorta o esauriti', D.nArt ? 1 - (D.low.length + D.out.length) / D.nArt : 1)}</div>
        ${D.out.length ? `<div class="m3-warn">${ic('alert')}<span><b>${D.out.length} ${D.out.length === 1 ? 'articolo esaurito' : 'articoli esauriti'}</b> con scorta minima impostata · conta e rettifica se la giacenza non torna.</span></div>` : ''}
        ${canW() ? `<button type="button" class="m3-go" data-gx="mov-new">${ic('check')}Rettifica di inventario</button>` : ''}
        <div class="m3-h4">Ultime rettifiche <em>${D.ret.length}</em></div><div class="m3-rows">${D.ret.slice(0, 16).map(mvRow).join('') || '<div class="m3-empty">Nessuna rettifica di inventario</div>'}</div></div>`;
    } else if (P.t === 'zone' && P.z === 'spe') {
      h = head(ic('truck'), '', 'Zona', 'Spedizioni', 'Banchine · carico camion · consegne ai clienti', 1) + `<div class="m3-pb"><div class="m3-grid">
        ${stat('DDT del mese', D.ddtM.length, '', `${N(D.ddtM.reduce((s, x) => s + C.num(x.d.colli), 0))} colli`)}${stat('Da fatturare', D.ddt.filter(x => !x.d.fattura).length, '', 'DDT senza fattura', D.ddt.length ? D.ddt.filter(x => x.d.fattura).length / D.ddt.length : 0)}</div>
        <button type="button" class="m3-go" data-gx="ddt-new">${ic('plus')}Nuovo DDT</button>
        <div class="m3-h4">Spedizioni <em>${D.ddt.length}</em></div><div class="m3-rows">${D.ddt.slice(0, 20).map(x => { const i = trucks.findIndex(t => t.d === x); return `<button type="button" class="m3-row" ${i >= 0 ? `data-trk3="${i}"` : `data-gx="ddt-pdf" data-id="${esc(x.d.id)}"`}><i class="m3-pi" style="width:30px;height:30px;border-radius:9px">${ic('truck')}</i><span class="tx"><b>DDT ${esc(C.dnum(x.d))} · ${esc(x.cliN)}</b><small>${esc([C.dIt(x.d.data), C.num(x.d.colli) ? N(C.num(x.d.colli)) + ' colli' : '', x.R.length + ' righe'].filter(Boolean).join(' · '))}</small></span>${x.d.fattura ? '<span class="m3-chip g"><i></i>Fatturato</span>' : '<span class="m3-chip a"><i></i>Da fatturare</span>'}</button>`; }).join('') || '<div class="m3-empty">Nessun DDT</div>'}</div></div>`;
    } else if (P.t === 'zone' && P.z === 'uff') {
      const V = (C.fv ? C.fv() : []), da = V.filter(f => f.stato !== 'pagata');
      h = head(ic('office'), '', 'Edificio', 'Uffici', esc(C.orgName()) + ' · clienti e documenti', 1) + `<div class="m3-pb"><div class="m3-grid">
        ${stat('Clienti', D.cli.length, '', 'in anagrafica')}${stat('Fatture da incassare', da.length, '', C.eur0(da.reduce((s, f) => s + C.num(f.totale), 0)), V.length ? 1 - da.length / V.length : 1)}</div>
        <div class="m3-h4">Clienti serviti <em>${new Set(D.ddt.map(x => x.d.cliente)).size}</em></div><div class="m3-rows">${[...new Map(D.ddt.map(x => [x.d.cliente, x])).values()].slice(0, 12).map(x => `<div class="m3-row"><i class="m3-pi" style="width:30px;height:30px;border-radius:9px">${ic('users')}</i><span class="tx"><b>${esc(x.cliN)}</b><small>${esc([x.citta, 'ultimo DDT ' + C.dIt(x.d.data)].filter(Boolean).join(' · '))}</small></span></div>`).join('') || '<div class="m3-empty">Nessun cliente servito</div>'}</div></div>`;
    } else if (P.t === 'truck') {
      const t = trucks[P.i]; if (!t) return panel();
      if (!t.d) h = head(ic('truck'), '', 'Camion', 'Banchina libera', 'Nessun DDT registrato', 1) + `<div class="m3-pb"><button type="button" class="m3-go" data-gx="ddt-new">${ic('plus')}Nuovo DDT</button></div>`;
      else if (t.d.trf) { const x = t.d.trf; h = head(ic('truck'), '', 'Camion · trasferimento', `<span class="m3-plate">${esc(C.xiNum(x))}</span>`, 'Trasferimento tra magazzini', 1) + `<div class="m3-pb"><div class="m3-chips"><span class="m3-chip"><i></i>In viaggio</span></div><div class="m3-grid">${stat('Pezzi', N(C.xiPz(x)), '', `${(x.righe || []).length} righe`)}${stat('Partito il', C.dIt(x.data), '', '')}</div>
          <div class="m3-h4">Spedizione</div><div class="m3-ship"><i>${ic('route')}</i><div><b>${esc((x.mag || 'Magazzino') + ' → ' + (x.mag2 || x.dest || ''))}</b><small>Le quantità entrano nel magazzino di arrivo alla conferma della ricezione.</small><div class="m3-bar"><u data-w=".5"></u></div></div></div></div>`; }
      else { const x = t.d, d = x.d;
        h = head(ic('truck'), '', 'Camion · ' + (t.road ? 'spedito' : 'in banchina'), `<span class="m3-plate">DDT ${esc(C.dnum(d))}</span>`, esc(x.cliN), 1) + `<div class="m3-pb">
        <div class="m3-chips"><span class="m3-chip">${t.road ? '<i></i>Spedito' : '<i></i>In banchina'}</span>${d.fattura ? '<span class="m3-chip g">Fatturato</span>' : '<span class="m3-chip a">Da fatturare</span>'}</div>
        <div class="m3-grid">${stat('Colli', d.colli ? N(C.num(d.colli)) : '—', '', esc(d.aspetto || ''))}${stat('Peso', d.peso ? N(C.num(d.peso)) : '—', d.peso ? 'kg' : '', '')}${stat('Pezzi', N(x.pz), '', `${x.R.length} righe`)}${stat('Trasporto', esc(d.trasporto || '—'), '', esc(d.vettore || ''))}</div>
        <div class="m3-h4">Spedizione <em>${esc(C.dIt(d.data))}</em></div>
        <div class="m3-ship"><i>${ic('route')}</i><div style="flex:1;min-width:0"><b>${esc(C.orgName().split(' ')[0])} → ${esc(x.citta || x.cliN)}</b><small>${esc([d.causale || 'Vendita', C.num(d.colli) ? N(C.num(d.colli)) + ' colli' : '', d.destinazione].filter(Boolean).join(' · '))}</small></div></div>
        <div class="m3-tl">${x.R.slice(0, 8).map(l => `<div><b>${N(C.num(l.q))} ${esc(l.um || '')}</b>${esc(l.d || '')} <span>${esc(l.c || '')}</span></div>`).join('')}</div>
        <button type="button" class="m3-go" data-gx="ddt-pdf" data-id="${esc(d.id)}">${ic('pdf')}Apri il DDT</button></div>`; }
    }
    el.innerHTML = h;
    root.classList.remove('np'); root.classList.add('pn');
    requestAnimationFrame(() => $$('.m3-bar u', el).forEach(u => { u.style.width = (u.dataset.w * 100) + '%'; }));
    const hlEl = $('.m3-row.k', el); if (hlEl) setTimeout(() => hlEl.scrollIntoView({ block: 'center', behavior: 'smooth' }), 120);
  }

  function zoneChip(z) {
    const q = Z[z] || Z.all; $('.m3-zc').textContent = q.code; $('.m3-zt b').textContent = q.n;
    const sub = { all: `${pc(D.disp, D.nArt)} % · ${N(D.tot)} pezzi`, ric: `${D.car30.length} carichi · 30 gg`, stk: `${pc(D.disp, D.nArt)} % · ${N(D.tot)} pezzi`, pre: `${D.ddtM.length} DDT · mese`, cq: `${D.ret90.length} rettifiche · 90 gg`, spe: `${D.ddt.filter(x => !x.d.fattura).length} da fatturare`, uff: `${D.cli.length} clienti` }[z] || '';
    $('.m3-zt small').textContent = sub;
    $$('.m3-fs button[data-fz]').forEach(b => b.classList.toggle('on', b.dataset.fz === z));
  }
  function select(k, noFly) {
    sel = k; stopTour(k && k._tour);
    if (!k) { root.classList.add('np'); root.classList.remove('pn'); hiMesh && (hiMesh.visible = false); zoneChip('all'); return; }
    hiMesh.visible = false;
    if (k.t === 'zone') { zoneChip(k.z); if (!noFly) flyZone(k.z); }
    else if (k.t === 'row') { zoneChip('stk'); const z = RACK.z0 + k.r * RACK.gap; if (!noFly) fly({ tx: RACK.x0 + RACK.bays * RACK.bw / 2, tz: z + 1.5, dist: 70, az: -0.25, pol: .72 });
      if (k.art) { const b = boxMap.find(x => x.id === k.art); if (b) { const [x, y, zz] = slotPos(b.r, b.b, b.l, b.s); hiMesh.position.set(x, y + .45, zz); hiMesh.visible = true; if (!noFly) fly({ tx: x, tz: zz + 1.2, dist: 44, az: -0.22, pol: .62 }); } } }
    else if (k.t === 'truck') { zoneChip('spe'); const t = trucks[k.i]; if (t && !noFly) fly({ tx: t.g.position.x - (t.road ? 0 : 2), tz: t.g.position.z, dist: 68, az: t.road ? -0.35 : 0.6, pol: .96 }); }
    panel(k);
  }

  function kpis() {
    $('.m3-kpis').innerHTML = `<div class="m3-kpi m3-card" data-m3="zall"><i>${ic('box')}</i><div><span>Pezzi in magazzino</span><b>${N(D.tot)}<em>${pc(D.disp, D.nArt)} %</em></b><small>${D.nArt} articoli · ${C.eur0(D.val)}</small></div></div>
      <div class="m3-kpi m3-card" data-m3="zspe"><i>${ic('truck')}</i><div><span>Spedizioni del mese</span><b>${D.ddtM.length}<em>${N(D.ddtM.reduce((s, x) => s + C.num(x.d.colli), 0))} colli</em></b><small>${D.ddt.filter(x => !x.d.fattura).length} DDT da fatturare</small></div></div>`;
    const n = D.low.length + D.out.length + D.trf.length, b = $('.m3-bell em'); b.hidden = !n; b.textContent = n > 99 ? '99+' : n;
    const st = [['fornitori', 'Fornitori', 'factory', 'ric'], ['ric', 'Ricevimento', 'dock', 'ric'], ['stk', 'Scaffalature', 'rack', 'stk'], ['pre', 'Preparazione', 'hand', 'pre'], ['cq', 'Controllo', 'shield', 'cq'], ['spe', 'Spedizione', 'truck', 'spe'], ['cli', 'Clienti', 'users', 'uff']];
    $('.m3-flow').innerHTML = `<div class="m3-fh">${ic('flow')}Flusso del magazzino<em>fornitore → cliente · in tempo reale</em></div><div class="m3-fs">${st.map(([k, l, icn, z], i) => `${i ? '<b class="sep"></b>' : ''}<button type="button" data-fz="${k === 'fornitori' || k === 'cli' ? '' : z}" data-fgo="${z}" class="${k === 'cq' && D.out.length || k === 'stk' && D.low.length ? 'w' : ''}"><i>${ic(icn)}</i>${l}</button>`).join('')}</div>`;
    table(table.k || 'cor');
    $('.m3-menu[data-menu="zones"]').innerHTML = ZK.map(z => `<button type="button" data-zsel="${z}"><span class="zc">${Z[z].code}</span>${Z[z].n}</button>`).join('');
    $('.m3-menu[data-menu="shots"]').innerHTML = [['all', 'Panoramica'], ['top', 'Dall\'alto'], ['stk', 'Tra gli scaffali'], ['spe', 'Banchine e camion'], ['pre', 'Nastro e preparazione'], ['low', 'Vista bassa']].map(([k, l]) => `<button type="button" data-shot="${k}">${ic('cam')}${l}</button>`).join('');
  }
  function table(k) {
    table.k = k; const nr = Math.max(4, Math.min(8, D.cats.length || 4));
    const tabs = [['cor', 'Corsie', D.cats.slice(0, nr).length], ['mov', 'Movimenti', D.MM.length], ['spe', 'Spedizioni', D.ddtM.length], ['low', 'Riordino', D.low.length]];
    let rows = '';
    if (k === 'cor') rows = D.cats.slice(0, nr).map(c => `<button type="button" data-row3="${c.i}"><span class="c1"><b>${c.code}</b><small>${esc(c.n)}</small></span><span class="c2"><i style="background:${c.colH}"></i>${esc(c.L[0] ? c.L[0].a.descrizione : '—')} · ${N(c.L[0] ? c.L[0].g : 0)}</span>${c.low ? '<span class="m3-chip a">Sotto scorta</span>' : '<span class="m3-chip g"><i></i>Ok</span>'}<span class="c4">${pc(c.disp, c.L.length)} %</span><span class="c5">›</span></button>`).join('');
    else if (k === 'mov') rows = D.MM.slice().sort((a, b) => String(b.data).localeCompare(String(a.data))).slice(0, 40).map(m => { const a = C.artOf(m.articolo), q = C.num(m.quantita), x = D.arts.find(y => y.id === m.articolo), c = x && D.cats.find(cc => cc.L.includes(x)); return `<button type="button" ${c && c.i < nr ? `data-art3="${esc(m.articolo)}"` : ''}><span class="c1"><b>${esc(C.dIt(m.data).slice(0, 5))}</b><small>${esc(m.tipo || '')}</small></span><span class="c2">${esc(a ? a.descrizione : 'Articolo eliminato')}</span><span class="m3-chip ${q > 0 ? 'g' : 'a'}">${q > 0 ? '+' : ''}${N(q)}</span><span class="c4">${esc((m.causale || '').slice(0, 8))}</span><span class="c5">›</span></button>`; }).join('');
    else if (k === 'spe') rows = D.ddtM.slice(0, 30).map(x => { const i = trucks.findIndex(t => t.d === x); return `<button type="button" ${i >= 0 ? `data-trk3="${i}"` : `data-gx="ddt-pdf" data-id="${esc(x.d.id)}"`}><span class="c1"><b>${esc(C.dnum(x.d))}</b><small>${esc(C.dIt(x.d.data).slice(0, 5))}</small></span><span class="c2">${esc(x.cliN)}</span>${x.d.fattura ? '<span class="m3-chip g">Fatturato</span>' : '<span class="m3-chip a">Da fatturare</span>'}<span class="c4">${N(C.num(x.d.colli))} colli</span><span class="c5">›</span></button>`; }).join('');
    else rows = D.low.slice(0, 40).map(x => `<button type="button" data-art3="${esc(x.id)}"><span class="c1"><b>${esc(x.a.codice || '—')}</b><small>min. ${N(x.s)}</small></span><span class="c2">${esc(x.a.descrizione)}</span><span class="m3-chip a">${N(x.g)} ${esc(x.a.um || '')}</span><span class="c4">${pc(x.g, x.s)} %</span><span class="c5">›</span></button>`).join('');
    $('.m3-tab').innerHTML = `<div class="m3-tt"><i>${ic('chart')}</i>${tabs.map(([kk, l, n]) => `<button type="button" data-tab3="${kk}" class="${kk === k ? 'on' : ''}">${l}<em>${n}</em></button>`).join('')}</div><div class="m3-tr">${rows || '<div class="m3-empty">Niente da mostrare</div>'}</div>`;
  }
  function focusArt(id) {
    const x = D.arts.find(a => a.id === id); if (!x) return;
    const c = D.cats.find(cc => cc.L.includes(x)); if (!c) return;
    select({ t: 'row', r: c.i, art: id });
    if (!boxMap.some(b => b.id === id)) toast(x.out ? 'Articolo esaurito: il vano è vuoto' : 'Articolo nella corsia ' + c.code);
  }

  /* ricerca */
  function search(q) {
    const res = $('.m3-res'), s = String(q || '').trim().toLowerCase();
    if (!s) { res.classList.remove('on'); res.innerHTML = ''; return; }
    const A = D.arts.filter(x => [x.a.codice, x.a.codForn, x.a.descrizione, x.a.barcode, x.a.categoria].join(' ').toLowerCase().includes(s)).slice(0, 7);
    const Dd = D.ddt.filter(x => ('ddt ' + C.dnum(x.d) + ' ' + x.cliN).toLowerCase().includes(s)).slice(0, 4);
    const Cc = D.cats.filter(c => c.n.toLowerCase().includes(s)).slice(0, 3);
    const zs = ZK.filter(z => Z[z].n.toLowerCase().includes(s)).slice(0, 2);
    let h = A.map(x => `<button type="button" data-art3="${esc(x.id)}"><i>${esc((x.a.codice || 'ART').slice(0, 4))}</i><span><b>${esc(x.a.descrizione)}</b><small>${esc([x.a.categoria, N(x.g) + ' ' + (x.a.um || 'pz'), x.out ? 'esaurito' : x.low ? 'sotto scorta' : ''].filter(Boolean).join(' · '))}</small></span></button>`).join('')
      + Cc.map(c => `<button type="button" data-row3="${c.i}"><i>${c.code}</i><span><b>Corsia ${esc(c.n)}</b><small>${c.L.length} articoli · ${N(c.g)} pz</small></span></button>`).join('')
      + Dd.map(x => { const i = trucks.findIndex(t => t.d === x); return `<button type="button" ${i >= 0 ? `data-trk3="${i}"` : `data-gx="ddt-pdf" data-id="${esc(x.d.id)}"`}><i>DDT</i><span><b>DDT ${esc(C.dnum(x.d))} · ${esc(x.cliN)}</b><small>${esc(C.dIt(x.d.data))}</small></span></button>`; }).join('')
      + zs.map(z => `<button type="button" data-zsel="${z}"><i>${Z[z].code}</i><span><b>${Z[z].n}</b><small>reparto</small></span></button>`).join('');
    res.innerHTML = h || '<p>Nessun risultato</p>'; res.classList.add('on');
  }

  /* visita guidata */
  let tourI = 0;
  function startTour() { tourOn = true; tourI = 0; $('[data-m3="play"]').innerHTML = ic('pause'); tourT = 0; nextTour(); }
  function stopTour(fromTour) { if (fromTour || !tourOn) return; tourOn = false; const b = $('[data-m3="play"]'); if (b) b.innerHTML = ic('play'); }
  function nextTour() { const seq = ['all', 'ric', 'stk', 'pre', 'cq', 'spe', 'uff']; const z = seq[tourI % seq.length]; tourI++; select({ t: 'zone', z, _tour: 1 }); tourT = 0; }

  /* ---------------- eventi ---------------- */
  let drag = null, pinch = null;
  function onDown(e) {
    if (e.button === 2 || e.shiftKey) drag = { x: e.clientX, y: e.clientY, rot: 1, moved: 0 }; else drag = { x: e.clientX, y: e.clientY, rot: 0, moved: 0 };
    try { R.domElement.setPointerCapture(e.pointerId); } catch {} pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: GOAL.dist }; drag = null; }
  }
  const pts = new Map();
  function onMove(e) {
    if (pts.has(e.pointerId)) pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y); GOAL.dist = clamp(pinch.dist * pinch.d / Math.max(20, d), 18, 300); stopTour(); return; }
    if (!drag) { needPick = { x: e.clientX, y: e.clientY, hover: 1 }; return; }
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
    if (drag.moved > 4) { R.domElement.classList.add('drag'); stopTour(); }
    if (drag.rot) { GOAL.az -= dx * .006; CAM.az = GOAL.az; GOAL.pol = clamp(GOAL.pol - dy * .004, .35, 1.25); CAM.pol = GOAL.pol; return; }
    const k = CAM.dist * .0016 * (900 / Math.max(500, R.domElement.clientHeight)), s = Math.sin(CAM.az), c = Math.cos(CAM.az);
    const mx = -dx * k, mz = -dy * k / Math.cos(CAM.pol - .2);
    GOAL.tx += mx * c + mz * s; GOAL.tz += -mx * s + mz * c; GOAL.tx = clamp(GOAL.tx, -120, 130); GOAL.tz = clamp(GOAL.tz, -100, 100); CAM.tx = GOAL.tx; CAM.tz = GOAL.tz;
  }
  function onUp(e) {
    pts.delete(e.pointerId); if (pts.size < 2) pinch = null;
    if (drag && drag.moved < 6) needPick = { x: e.clientX, y: e.clientY };
    drag = null; R.domElement.classList.remove('drag');
  }
  function onWheel(e) { e.preventDefault(); GOAL.dist = clamp(GOAL.dist * Math.exp(e.deltaY * .0012), 18, 300); stopTour(); }
  const ray = new (function () { this.r = null; })();
  function doPick(p) {
    if (!ray.r) ray.r = new T.Raycaster();
    const rc = R.domElement.getBoundingClientRect(), v = new T.Vector2((p.x - rc.left) / rc.width * 2 - 1, -(p.y - rc.top) / rc.height * 2 + 1);
    ray.r.setFromCamera(v, cam); const H = ray.r.intersectObjects(pick, false), PR = { box: 0, truck: 1, row: 2, zone: 3 };
    const hit = H.slice(0, 6).filter(h => h.object.userData.k).sort((a, b) => (PR[a.object.userData.k.t] - PR[b.object.userData.k.t]) || a.distance - b.distance)[0];
    if (p.hover) { R.domElement.classList.toggle('hov', !!hit); return; }
    if (!hit) return;
    const k = hit.object.userData.k; if (!k) return;
    if (k.t === 'box') { const b = boxMap[hit.instanceId]; if (b) select({ t: 'row', r: b.r, art: b.id }); return; }
    select({ ...k });
  }
  function onClick(e) {
    const t = e.target;
    if (t.closest('[data-gx]')) { // azioni del gestionale (carico, DDT…): il foglio si apre sopra la vista 3D
      $$('.m3-menu.on').forEach(m => m.classList.remove('on')); $('.m3-res').classList.remove('on'); return; }
    const b = t.closest('[data-m3]'), a = b && b.dataset.m3;
    if (!t.closest('.m3-menu') && !t.closest('[data-m3="zones"]') && !t.closest('[data-m3="shots"]')) $$('.m3-menu.on').forEach(m => m.classList.remove('on'));
    if (!t.closest('.m3-search')) $('.m3-res').classList.remove('on');
    if (a === 'close') return close();
    if (a === 'zin') { GOAL.dist = clamp(GOAL.dist * .75, 18, 300); stopTour(); return; }
    if (a === 'zout') { GOAL.dist = clamp(GOAL.dist / .75, 18, 300); stopTour(); return; }
    if (a === 'rl') { GOAL.az -= Math.PI / 4; stopTour(); return; }
    if (a === 'rr') { GOAL.az += Math.PI / 4; stopTour(); return; }
    if (a === 'home') { select({ t: 'zone', z: 'all' }); return; }
    if (a === 'play') { if (tourOn) stopTour(); else startTour(); return; }
    if (a === 'pclose') { select(null); return; }
    if (a === 'aim') { if (sel) select(sel); return; }
    if (a === 'zones' || a === 'shots') { $(`.m3-menu[data-menu="${a}"]`).classList.toggle('on'); return; }
    if (a === 'next') { const cur = sel && sel.t === 'zone' ? sel.z : sel && sel.t === 'row' ? 'stk' : sel && sel.t === 'truck' ? 'spe' : 'all'; select({ t: 'zone', z: ZK[(ZK.indexOf(cur) + 1) % ZK.length] }); return; }
    if (a === 'bell') { select({ t: 'zone', z: 'all' }); setTimeout(() => { const h = $('.m3-panel .m3-h4'); if (h) h.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 200); return; }
    if (a === 'zall') { select({ t: 'zone', z: 'all' }); return; }
    if (a === 'zspe') { select({ t: 'zone', z: 'spe' }); return; }
    const zs = t.closest('[data-zsel]'); if (zs) { $('.m3-res').classList.remove('on'); select({ t: 'zone', z: zs.dataset.zsel }); return; }
    const fg = t.closest('[data-fgo]'); if (fg) { select({ t: 'zone', z: fg.dataset.fgo }); return; }
    const sh = t.closest('[data-shot]'); if (sh) { stopTour(); const k = sh.dataset.shot; ({ all: () => select({ t: 'zone', z: 'all' }), top: () => fly({ tx: 2, tz: -1, dist: 165, az: -0.02, pol: .2 }), stk: () => fly({ tx: 8, tz: -6, dist: 34, az: -0.15, pol: 1.12 }), spe: () => flyZone('spe'), pre: () => flyZone('pre'), low: () => fly({ tx: 0, tz: 4, dist: 120, az: -0.75, pol: 1.22 }) })[k](); return; }
    const tb = t.closest('[data-tab3]'); if (tb) { table(tb.dataset.tab3); return; }
    const rw = t.closest('[data-row3]'); if (rw) { $('.m3-res').classList.remove('on'); select({ t: 'row', r: +rw.dataset.row3 }); return; }
    const ar = t.closest('[data-art3]'); if (ar) { $('.m3-res').classList.remove('on'); focusArt(ar.dataset.art3); return; }
    const tr = t.closest('[data-trk3]'); if (tr) { $('.m3-res').classList.remove('on'); select({ t: 'truck', i: +tr.dataset.trk3 }); return; }
  }
  function onKey(e) {
    if (!open || !document.body.contains(root)) return;
    const sheetOpen = document.querySelector('#sheet:not([hidden])');
    if (sheetOpen) return;
    const inp = $('.m3-search input');
    if (e.key === '/' && document.activeElement !== inp) { e.preventDefault(); inp.focus(); return; }
    if (e.key === 'Escape') { if (document.activeElement === inp && inp.value) { inp.value = ''; search(''); return; } if (sel) select(null); else close(); }
    if (e.key === 'Enter' && document.activeElement === inp) { const f = $('.m3-res button'); if (f) f.click(); }
  }
  function resize() { if (!R) return; const w = root.clientWidth, h = root.clientHeight; R.setSize(w, h, false); cam.aspect = w / h; cam.fov = w < 760 ? 38 : 28; cam.updateProjectionMatrix(); }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (document.hidden) return;
    const t = now / 1000, dt = Math.min(.05, lastT ? t - lastT : .016); lastT = t;
    stepCam(dt); animate(t, dt);
    const w = R.domElement.clientWidth, h = R.domElement.clientHeight, want = w > 760 && root.classList.contains('pn') ? 180 : 0;
    viewOff += (want - viewOff) * (1 - Math.exp(-dt * 4)); if (Math.abs(viewOff) > .5) cam.setViewOffset(w, h, viewOff, 0, w, h); else if (cam.view && cam.view.enabled) cam.clearViewOffset();
    if (needPick) { const p = needPick; needPick = null; doPick(p); }
    if (tourOn) { tourT += dt; if (tourT > 5.5) nextTour(); }
    R.render(scene, cam); updLabels();
    const ck = $('.m3-clock'); if (ck && (!loop.s || now - loop.s > 5000)) { loop.s = now; const d = new Date(); ck.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  }

  /* ---------------- ciclo di vita ---------------- */
  function dispose() {
    cancelAnimationFrame(raf); raf = 0;
    if (scene) scene.traverse(o => { if (o.geometry) o.geometry.dispose(); const m = o.material; (Array.isArray(m) ? m : m ? [m] : []).forEach(x => { if (x.map) x.map.dispose(); x.dispose(); }); });
    Object.keys(M).forEach(k => delete M[k]);
    if (R) { R.dispose(); R.forceContextLoss && R.forceContextLoss(); }
    R = scene = null; pick = []; labels = []; movers = []; trucks = []; boxMap = []; rackGroups = []; boxIM = pinIM = hiMesh = beltIM = null;
  }
  function build() {
    D = data(); pick = []; movers = []; buildScene(); buildLabels(); kpis();
  }
  function openView(ctx) {
    C = ctx; T = window.THREE; if (!T) return;
    if (open) return refresh();
    if (!document.getElementById('m3-css')) { const s = document.createElement('style'); s.id = 'm3-css'; s.textContent = CSS; document.head.appendChild(s); }
    root = document.createElement('div'); root.className = 'm3 np'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Magazzino 3D'); root.innerHTML = html();
    document.body.appendChild(root); document.documentElement.style.overflow = 'hidden'; open = true;
    try { R = new T.WebGLRenderer({ canvas: $('.m3-c'), antialias: true, powerPreference: 'high-performance' }); }
    catch { root.innerHTML = '<div class="m3-load"><b>Il 3D non è supportato su questo dispositivo</b></div>'; setTimeout(close, 2500); return; }
    R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
    Object.assign(CAM, { tx: 4, tz: 2, dist: 300, az: -0.2, pol: .7 }); Object.assign(GOAL, { tx: 4, tz: 8, dist: 265, az: -0.3, pol: .9 });
    build(); resize(); applyCam();
    const cv = R.domElement;
    cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove); cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);
    cv.addEventListener('wheel', onWheel, { passive: false }); cv.addEventListener('contextmenu', e => e.preventDefault()); cv.addEventListener('pointerleave', () => cv.classList.remove('hov'));
    root.addEventListener('click', onClick);
    const inp = $('.m3-search input'); inp.addEventListener('input', () => search(inp.value)); inp.addEventListener('focus', () => { if (inp.value) search(inp.value); });
    const ms = $('.m3-sel'); if (ms) ms.addEventListener('change', () => { C.setMag(ms.value); });
    window.addEventListener('resize', resize); document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => { root.classList.add('on'); const l = $('.m3-load'); if (l) { l.style.opacity = 0; setTimeout(() => l.remove(), 500); } });
    lastT = 0; raf = requestAnimationFrame(loop);
    setTimeout(() => { if (open && !sel && root.clientWidth > 760) select({ t: 'zone', z: 'all' }, 1); else if (open) zoneChip('all'); }, 900);
  }
  function refresh() {
    if (!open || !R) return;
    const keep = sel, cam0 = { ...CAM }, g0 = { ...GOAL };
    // ricostruisce la scena con i dati aggiornati (giacenze, DDT…), mantenendo inquadratura e selezione
    scene.traverse(o => { if (o.geometry) o.geometry.dispose(); const m = o.material; (Array.isArray(m) ? m : m ? [m] : []).forEach(x => { if (x.map) x.map.dispose(); x.dispose(); }); });
    Object.keys(M).forEach(k => delete M[k]); trucks = []; boxMap = []; rackGroups = [];
    build(); Object.assign(CAM, cam0); Object.assign(GOAL, g0); resize();
    const ms = $('.m3-sel'); if (ms) ms.value = C.mag();
    if (keep) select(keep, 1);
  }
  function close() {
    if (!open) return; open = false; stopTour();
    window.removeEventListener('resize', resize); document.removeEventListener('keydown', onKey);
    root.classList.remove('on'); const r0 = root;
    setTimeout(() => { dispose(); r0.remove(); }, 320);
    document.documentElement.style.overflow = '';
    sel = null; if (C && C.onClose) C.onClose();
  }
  window.CDC_MG3D = { open: openView, refresh, close, isOpen: () => open };
})();
