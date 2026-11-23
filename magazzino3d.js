/* Magazzino 3D (v275) — magazzino 3D interattivo collegato ai dati reali, con editor della disposizione.
   Caricato con loadLib da app.js (mag3d) dopo three.js. Espone window.CDC_MG3D = { open(ctx), refresh(), close(), isOpen() }.
   Disposizione salvata in Config «mg3d:<magazzino>» = { v, W, D, items:[…], loc:{ idArticolo: { r, b, l } } }.
   items: rack (portapallet / ripiani), zone, dock (banchina), wall (muro), belt (nastro), desk (bancone).
   Le giacenze vengono da articoli e movimenti; carichi, scarichi e DDT passano dai pulsanti data-gx del gestionale. */
(function () {
  'use strict';
  let C = null, T = null, root = null, R = null, scene = null, cam = null, raf = 0, open = false, D = null, L = null, P = null;
  let pick = [], labels = [], movers = [], sel = null, tourT = 0, tourOn = false, lastT = 0, needPick = null, ENV = null, WH = null, EDIT = null;
  const OR = '#f47b20';
  const CAM = { tx: 4, ty: 0, tz: 8, dist: 265, az: -0.3, pol: 0.9 }, GOAL = { ...CAM };
  const PAL = [0xf0a24e, 0x9fc47e, 0xb9a6e0, 0xf3c27a, 0x7fb6d6, 0xe8957a, 0xd8cf9b, 0x8fcfbf, 0xe7a3c4, 0xa7b0c0];
  const PALH = ['#f0a24e', '#9fc47e', '#b9a6e0', '#f3c27a', '#7fb6d6', '#e8957a', '#d8cf9b', '#8fcfbf', '#e7a3c4', '#a7b0c0'];
  const BIN = [0x2f6fd0, 0xe5532f, 0x2aa35a, 0xf2b01e, 0x7a55c9, 0x1f9bb5, 0xd9468f, 0x5c6b7a];
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
.m3-ed{display:none}
.m3.edit .m3-ed{display:flex}
.m3.edit .m3-kpis,.m3.edit .m3-flow,.m3.edit .m3-tab,.m3.edit .m3-zone,.m3.edit .m3-shots,.m3.edit .m3-search,.m3.edit [data-m3="play"],.m3.edit .m3-bell,.m3.edit .m3-live,.m3.edit .m3-sel{display:none!important}
.m3-edit{height:40px;display:flex;align-items:center;gap:8px;border:1px solid #e7e5e1;border-radius:12px;padding:0 13px;font-size:13.5px;font-weight:600;background:#fff;white-space:nowrap}
.m3-edit:hover{background:#faf9f7}.m3-edit svg{color:${OR}}
.m3.edit .m3-edit{display:none}
.m3-edbar{position:absolute;left:264px;bottom:18px;z-index:6;align-items:center;gap:10px;padding:8px 8px 8px 16px;font-size:13px;color:#55585e;white-space:nowrap}
.m3-edbar b{color:#15171a;font-weight:700}
.m3-edbar .k{display:inline-flex;gap:4px;align-items:center}
.m3-edbar kbd{font:600 11px Inter,system-ui;border:1px solid #e3e1dd;border-radius:6px;padding:1px 6px;background:#faf9f7;color:#55585e}
.m3-edbar button{height:36px;padding:0 14px;border-radius:10px;font-weight:600;font-size:13.5px;display:flex;align-items:center;gap:6px}
.m3-edbar .ghost{border:1px solid #e7e5e1;background:#fff}
.m3-edbar .ghost:hover{background:#faf9f7}
.m3-edbar .save{background:${OR};color:#fff;box-shadow:0 5px 12px rgba(244,123,32,.3)}
.m3-edbar .save:hover{background:#e86e12}
.m3-edbar .save:disabled{opacity:.5;box-shadow:none;cursor:default}
.m3-edbar svg{width:16px;height:16px}
.m3-pal{position:absolute;left:18px;top:80px;width:228px;z-index:4;padding:12px;flex-direction:column;gap:4px;max-height:calc(100% - 100px);overflow:auto}
.m3-pal h4{margin:4px 6px 6px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#2b2e33}
.m3-pal h4:not(:first-child){margin-top:12px}
.m3-pal button{display:flex;align-items:center;gap:10px;width:100%;padding:7px 8px;border-radius:11px;text-align:left;font-size:13px;font-weight:600;color:#2b2e33}
.m3-pal button:hover{background:#fbf3ec}
.m3-pal button i{width:32px;height:32px;border-radius:9px;background:#fdf0e5;color:${OR};display:grid;place-items:center;flex:none}
.m3-pal button small{display:block;font-weight:500;color:#9a9ca1;font-size:11px}
.m3-pal button svg{width:17px;height:17px}
.m3-pal p{margin:10px 6px 2px;font-size:11.5px;color:#8a8d93;line-height:1.45}
.m3-f{display:flex;flex-direction:column;gap:4px;margin:0 0 10px}
.m3-f>span{font-size:11.5px;color:#8a8d93;font-weight:600}
.m3-f input,.m3-f select{height:38px;border:1px solid #e7e5e1;border-radius:11px;padding:0 11px;font:500 14px Inter,system-ui;background:#fff;color:#15171a;width:100%}
.m3-f input:focus,.m3-f select:focus{outline:0;border-color:${OR};box-shadow:0 0 0 3px rgba(244,123,32,.14)}
.m3-fr{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.m3-fr3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
.m3-num{display:flex;align-items:center;border:1px solid #e7e5e1;border-radius:11px;height:38px;overflow:hidden;background:#fff}
.m3-num button{width:32px;height:100%;font-size:17px;color:#55585e;flex:none}
.m3-num button:hover{background:#faf6f2;color:${OR}}
.m3-num input{border:0!important;height:100%!important;text-align:center;padding:0!important;min-width:0;box-shadow:none!important;-moz-appearance:textfield}
.m3-num input::-webkit-inner-spin-button{display:none}
.m3-seg{display:flex;gap:4px;background:#f4f3f1;border-radius:11px;padding:3px}
.m3-seg button{flex:1;height:32px;border-radius:9px;font-size:12.5px;font-weight:600;color:#55585e}
.m3-seg button.on{background:#fff;color:#15171a;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.m3-acts{display:flex;gap:6px;margin-top:6px}
.m3-acts button{flex:1;height:38px;border:1px solid #e7e5e1;border-radius:11px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px;background:#fff}
.m3-acts button:hover{background:#faf9f7}.m3-acts button svg{width:15px;height:15px}
.m3-acts .del{color:#c2412d}.m3-acts .del:hover{background:#fdf1ef}
.m3-ok{display:flex;gap:8px;align-items:flex-start;background:#eef7f0;border-radius:12px;padding:10px 12px;font-size:12.5px;color:#245c36;margin-bottom:10px}
.m3-ok svg{width:16px;height:16px;color:#2a8a4a;margin-top:1px}
.m3 .m3-loc{font:700 11px/1 Inter,system-ui!important;}
.m3-loc{display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 7px;border-radius:7px;background:#fff6d6;border:1px solid #f0d78a;color:#6b5200;font:700 11px/1 Inter,system-ui;letter-spacing:.02em;white-space:nowrap}
.m3-loc.auto{background:#f4f3f1;border-color:#e7e5e1;color:#55585e}
button.m3-loc:hover{border-color:${OR};color:${OR}}
.m3-row .m3-loc{flex:none}
.m3-ilist .m3-row{padding:7px 9px}
.m3-ilist .m3-row .tx b{font-size:12.5px}
.m3-cells{display:grid;gap:3px;margin:6px 0 4px}
.m3-cells i{display:block;height:18px;border-radius:4px;background:#efeeeb;position:relative}
.m3-cells i.f{background:#f6c89a}.m3-cells i.l{background:#f4a38e}.m3-cells i.e{background:#f7f6f4;border:1px dashed #dcd9d4}
.m3-pl{display:inline-flex;align-items:stretch;height:24px;border:1.5px solid #2b2f35;border-radius:5px;background:#fbfbf8;overflow:hidden;flex:none;font-style:normal}
.m3-pl i{background:#1f4fb4;color:#fff;font:700 9px/1 Inter,system-ui;display:grid;place-items:end center;padding:0 4px 3px;font-style:normal}
.m3-pl b{font:700 12.5px/22px Inter,system-ui;letter-spacing:.06em;padding:0 7px;color:#16181b;white-space:nowrap}
.m3-pl.big{height:34px;border-width:2px;border-radius:7px;margin:3px 0 2px}.m3-pl.big i{font-size:11px;padding:0 6px 5px}.m3-pl.big b{font-size:19px;line-height:30px;padding:0 10px}
.m3-b6{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;align-items:end;height:118px;padding:6px 4px 0;background:#f8f7f5;border-radius:13px;margin-bottom:4px}
.m3-b6 div{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:3px}
.m3-b6 span{font-size:10.5px;color:#8a8d93;font-weight:600}
.m3-b6 i{display:block;width:62%;height:var(--h);min-height:2px;border-radius:6px 6px 2px 2px;background:#f3c9a4;transform-origin:bottom;animation:m3g .9s cubic-bezier(.2,.8,.2,1) both}
.m3-b6 i.c{background:${OR}}
.m3-b6 small{font-size:10.5px;color:#9a9ca1;padding-bottom:6px}
@keyframes m3g{from{transform:scaleY(0)}}
.m3-tl2{border:0;margin:0;padding:0;gap:4px}
.m3-tl2>div,.m3-tl2>button{display:flex;align-items:center;gap:9px;padding:8px 9px;border-radius:11px;border:1px solid #eeece8;text-align:left;width:100%;background:#fff}
.m3-tl2>button:hover{border-color:#f3c9a4;background:#fffaf5}
.m3-tl2 b{min-width:40px;font-size:12px;margin:0}
.m3-tl2 .tx2{flex:1;min-width:0;font-size:12.5px;font-weight:600;color:#2b2f35}
.m3-tl2 .tx2 small{display:block;font-weight:500;color:#9a9ca1;font-size:11px;text-transform:capitalize;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.m3-kpis .m3-kpi:nth-child(3) i{background:#e8f4ec;color:#1f8a4b}
@media (max-width:1180px){.m3-kpis .m3-kpi:nth-child(3){display:none}}
.m3-lead{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3;opacity:0;transition:opacity .3s}
.m3-lead line{stroke:${OR};stroke-width:1.6;stroke-dasharray:4 4;animation:m3dash 1s linear infinite}
.m3-lead circle{fill:${OR}}.m3-lead circle+circle{fill:none;stroke:${OR};stroke-width:2}
@keyframes m3dash{to{stroke-dashoffset:-16}}
.m3-co{position:absolute;left:0;top:0;width:292px;z-index:4;background:rgba(255,255,255,.97);border-radius:18px;padding:14px 14px 12px;box-shadow:0 22px 50px rgba(20,24,18,.22),0 2px 6px rgba(0,0,0,.06);border:1px solid rgba(255,255,255,.9);pointer-events:auto;opacity:0;visibility:hidden;will-change:transform}
.m3-co.on{visibility:visible;animation:m3co .55s cubic-bezier(.2,1.25,.3,1) both}
@keyframes m3co{0%{opacity:0;scale:.86;filter:blur(4px)}60%{filter:blur(0)}100%{opacity:1;scale:1}}
.m3-co>*{animation:m3in .5s cubic-bezier(.2,.8,.2,1) both}
.m3-co>:nth-child(2){animation-delay:.06s}.m3-co>:nth-child(3){animation-delay:.1s}.m3-co>:nth-child(4){animation-delay:.14s}.m3-co>:nth-child(5){animation-delay:.18s}.m3-co>:nth-child(6){animation-delay:.22s}.m3-co>:nth-child(7){animation-delay:.27s}
.m3-coh{display:flex;align-items:center;gap:6px;margin-bottom:8px}
.m3-coh button{margin-left:auto;width:28px;height:28px;border-radius:9px;display:grid;place-items:center;color:#8a8d93}
.m3-coh button:hover{background:#f4f3f1}.m3-coh svg{width:14px;height:14px}
.m3-cot{display:block;font-size:15px;font-weight:700;letter-spacing:-.01em;line-height:1.25}
.m3-cos{display:block;font-size:11.5px;color:#8a8d93;margin-top:2px;line-height:1.4}
.m3-coq{display:flex;align-items:baseline;gap:6px;margin:10px 0 6px}
.m3-coq b{font-size:30px;font-weight:700;letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.m3-coq span{font-size:13px;color:#55585e;font-weight:600}.m3-coq em{margin-left:auto;font-style:normal;font-size:12.5px;color:#8a8d93;font-weight:600}
.m3-cob{position:relative;height:8px;border-radius:4px;background:#efedea;overflow:visible}
.m3-cob u{position:absolute;left:0;top:0;bottom:0;border-radius:4px;background:linear-gradient(90deg,#f8a45c,${OR});width:var(--w);animation:m3bar 1s .15s cubic-bezier(.2,.8,.2,1) both}
@keyframes m3bar{from{width:0}}
.m3-cob i{position:absolute;top:-4px;width:2px;height:16px;background:#17191c;border-radius:1px}
.m3-coa{display:flex;gap:6px;margin-top:12px}
.m3-coa button{flex:1;height:38px;border-radius:11px;border:1px solid #e7e5e1;display:flex;align-items:center;justify-content:center;gap:6px;font-size:12.5px;font-weight:600;background:#fff;transition:transform .15s,background .2s,border-color .2s}
.m3-coa button:hover{background:#faf8f5;transform:translateY(-1px)}.m3-coa button:active{transform:scale(.97)}
.m3-coa button.pri{background:${OR};border-color:${OR};color:#fff;font-size:15px;flex:1.5;box-shadow:0 6px 14px rgba(244,123,32,.3)}
.m3-coa button.pri span{font-size:12.5px}.m3-coa button.pri:hover{background:#e86e12}
.m3-coa button.ok{background:#e7f5ea;border-color:#bfe3c9;color:#1f7a3b}
.m3-coa svg{width:15px;height:15px}
.m3-spin{width:14px;height:14px;border-radius:50%;border:2px solid #f3c9a4;border-top-color:${OR};animation:m3rot .7s linear infinite}
@keyframes m3rot{to{transform:rotate(360deg)}}
.m3-tip{position:absolute;left:0;top:0;z-index:6;pointer-events:none;background:rgba(23,25,28,.92);color:#fff;border-radius:11px;padding:8px 11px;font-size:12.5px;opacity:0;transition:opacity .15s;max-width:260px;backdrop-filter:blur(6px)}
.m3-tip.on{opacity:1}.m3-tip b{display:block;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.m3-tip span{display:flex;align-items:center;gap:6px;color:rgba(255,255,255,.75);margin-top:3px}.m3-tip em{color:#ffb48a;font-style:normal}
.m3-tip .m3-loc{font-style:normal}
@keyframes m3in{from{opacity:0;transform:translateY(10px)}}
@keyframes m3pop{from{opacity:0;transform:scale(.4)}}
.m3-panel .m3-ph{animation:m3in .45s cubic-bezier(.2,.8,.2,1) both}
.m3-panel .m3-pb>*{animation:m3in .5s cubic-bezier(.2,.8,.2,1) both}
.m3-panel .m3-pb>:nth-child(2){animation-delay:.05s}.m3-panel .m3-pb>:nth-child(3){animation-delay:.1s}.m3-panel .m3-pb>:nth-child(4){animation-delay:.14s}.m3-panel .m3-pb>:nth-child(5){animation-delay:.18s}.m3-panel .m3-pb>:nth-child(n+6){animation-delay:.22s}
.m3-panel .m3-st{animation:m3in .5s cubic-bezier(.2,.8,.2,1) both}.m3-panel .m3-st:nth-child(2){animation-delay:.06s}.m3-panel .m3-st:nth-child(3){animation-delay:.12s}.m3-panel .m3-st:nth-child(4){animation-delay:.18s}
.m3-panel .m3-rows>*{animation:m3in .45s cubic-bezier(.2,.8,.2,1) both}
.m3-panel .m3-rows>:nth-child(1){animation-delay:.16s}.m3-panel .m3-rows>:nth-child(2){animation-delay:.2s}.m3-panel .m3-rows>:nth-child(3){animation-delay:.24s}.m3-panel .m3-rows>:nth-child(4){animation-delay:.28s}.m3-panel .m3-rows>:nth-child(5){animation-delay:.32s}.m3-panel .m3-rows>:nth-child(6){animation-delay:.36s}.m3-panel .m3-rows>:nth-child(n+7){animation-delay:.4s}
.m3-cells i{animation:m3pop .4s cubic-bezier(.2,1.3,.3,1) both;animation-delay:calc(var(--k,0) * 7ms + .15s)}
.m3-cells i.k{animation:m3pop .4s cubic-bezier(.2,1.3,.3,1) both,m3pulse 1.6s 1s ease-in-out infinite}
@keyframes m3pulse{50%{box-shadow:0 0 0 4px rgba(244,123,32,.25)}}
.m3-row{transition:border-color .2s,background .2s,transform .15s}.m3-row:hover{transform:translateX(2px)}
@media (prefers-reduced-motion:reduce){.m3-co,.m3-co>*,.m3-panel *,.m3-cells i,.m3-lead line{animation:none!important}}
@media (max-width:760px){.m3-co{width:min(330px,calc(100% - 20px))}.m3-tip{display:none}}
.m3-cells i.k{outline:2px solid ${OR};outline-offset:1px}
@media (max-width:760px){.m3-pal{top:auto;bottom:10px;left:10px;right:10px;width:auto;max-height:150px;flex-direction:row;flex-wrap:wrap}.m3-pal h4,.m3-pal p{display:none}.m3-pal button{width:auto;flex:1 1 30%;padding:5px}.m3-pal button small{display:none}.m3-edbar{left:10px;right:10px;bottom:170px;font-size:12px}.m3.edit .m3-panel{top:60px;left:56px;max-height:calc(100% - 300px);min-height:0}.m3.edit .m3-tools{top:60px}.m3-edbar .k{display:none}.m3-edit span{display:none}}
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
  Object.assign(I, {
    pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    rot: '<path d="M20 12a8 8 0 1 1-2.5-5.8"/><path d="M20 4v4h-4"/>', rotl: '<path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 4v4h4"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', save: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
    wall: '<path d="M3 7h18v10H3zM3 12h18M8 7v5M14 7v5M11 12v5M17 12v5"/>', belt: '<rect x="3" y="9" width="18" height="6" rx="3"/><circle cx="7" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="17" cy="12" r="1"/>',
    desk: '<path d="M3 10h18M5 10v9M19 10v9M7 10V6h6v4"/>', zone: '<path d="M4 4h16v16H4z" stroke-dasharray="3 2"/><path d="M8 12h8"/>',
    shelf: '<path d="M5 3v18M19 3v18M5 7h14M5 12h14M5 17h14"/><path d="M8 5h3v2H8zM13 10h3v2h-3zM8 15h4v2H8z"/>',
    pallet: '<path d="M3 17h18M4 20h16M6 17v3M12 17v3M18 17v3"/><path d="M6 8h12v9H6zM6 12.5h12M12 8v9"/>',
    building: '<path d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-6h6v6"/>', undo: '<path d="M9 7 4 12l5 5"/><path d="M4 12h11a5 5 0 0 1 0 10h-2"/>',
    pin: '<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>', auto: '<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
    floor: '<path d="M3 17 12 21l9-4-9-4z"/><path d="M3 12l9 4 9-4"/>',
    fuel: '<path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h14M7 8h6"/><path d="M15 10h1.5a1.5 1.5 0 0 1 1.5 1.5V17a1.5 1.5 0 0 0 3 0V8l-3-3"/>',
    van: '<path d="M2 16V7a1 1 0 0 1 1-1h11v10M14 9h4l3 3.5V16h-7"/><circle cx="6.5" cy="17" r="1.8"/><circle cx="16.5" cy="17" r="1.8"/>'
  });
  const ic = (k, extra) => `<svg viewBox="0 0 24 24"${extra || ''}>${I[k] || ''}</svg>`;

  /* ---------------- utilità ---------------- */
  const $ = (s, el) => (el || root).querySelector(s);
  const $$ = (s, el) => [...(el || root).querySelectorAll(s)];
  const N = v => C.fmtNum(v, Math.abs(v % 1) > 0.001 ? 1 : 0);
  const pc = (a, b) => b ? Math.round(a / b * 100) : 0;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = s => C.esc(s);
  const snap = (v, s) => Math.round(v / (s || .5)) * (s || .5);
  const toast = t => { const el = $('.m3-toast'); if (!el) return; el.textContent = t; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 2400); };
  const donut = (p, col) => { const r = 12, c = 2 * Math.PI * r, v = clamp(p, 0, 1); return `<svg class="dn" viewBox="0 0 30 30" style="stroke-linecap:butt"><circle cx="15" cy="15" r="${r}" stroke="#17191c" stroke-width="6" opacity=".9"/><circle cx="15" cy="15" r="${r}" stroke="${col}" stroke-width="6" stroke-dasharray="${(c * v).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 15 15)"/></svg>`; };
  const canW = () => C.secPerm('magazzino') === 'w';
  const canEdit = () => canW() && (!C.isOwner || C.isOwner());
  const uid = () => 'i' + Math.random().toString(36).slice(2, 9);
  const clone = o => JSON.parse(JSON.stringify(o));
  const mixC = (a, b, t) => { const A = new T.Color(a), B2 = new T.Color(b); return A.lerp(B2, t).getHex(); };

  /* ---------------- dati del gestionale ---------------- */
  function data() {
    const mag = C.mag();
    const A = C.art(), G = C.giacMap(mag), MV = C.mov().filter(m => !mag || C.magOf(m) === mag);
    const ivaK = a => C.ivaOn() ? 1 + C.ivaRate(a) : 1;
    const t0 = C.today(), m0 = t0.slice(0, 7);
    const dAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
    const arts = A.map(a => { const g = G.get(a.id) || 0, s = C.num(a.scorta); return { a, id: a.id, g, s, cat: String(a.categoria || '').trim() || 'Senza categoria', low: s > 0 && g <= s && g > 0, out: g <= 0, val: Math.max(0, g) * C.num(a.costo) * ivaK(a) }; });
    const byCat = new Map();
    arts.forEach(x => { if (!byCat.has(x.cat)) byCat.set(x.cat, []); byCat.get(x.cat).push(x); });
    const cats = [...byCat.entries()].map(([n, L2]) => ({ n, L: L2, g: L2.reduce((s, x) => s + Math.max(0, x.g), 0) })).sort((a, b) => b.g - a.g || b.L.length - a.L.length);
    cats.forEach((c, i) => { c.i = i; c.L.sort((a, b) => b.g - a.g); c.col = PAL[i % PAL.length]; c.colH = PALH[i % PALH.length]; c.bin = BIN[i % BIN.length]; c.low = c.L.filter(x => x.low).length; c.outN = c.L.filter(x => x.out).length; c.disp = c.L.length - c.outN; c.val = c.L.reduce((s, x) => s + x.val, 0); });
    const catOf = new Map(cats.map(c => [c.n, c]));
    const tot = arts.reduce((s, x) => s + Math.max(0, x.g), 0), disp = arts.filter(x => !x.out).length, val = arts.reduce((s, x) => s + x.val, 0);
    const low = arts.filter(x => x.low), out = arts.filter(x => x.out && x.s > 0);
    const MM = MV.filter(m => String(m.data).slice(0, 7) === m0);
    const srt = (a, b) => String(b.data).localeCompare(String(a.data)) || String(b.creato || '').localeCompare(String(a.creato || ''));
    const car = MV.filter(m => C.num(m.quantita) > 0 && m.tipo !== 'rettifica').sort(srt), car30 = car.filter(m => String(m.data) >= dAgo(30));
    const ret = MV.filter(m => m.tipo === 'rettifica').sort(srt), ret90 = ret.filter(m => String(m.data) >= dAgo(90));
    const scar = MV.filter(m => C.num(m.quantita) < 0).sort(srt);
    const parse = s => { try { return typeof s === 'string' ? JSON.parse(s || '[]') : (Array.isArray(s) ? s : []); } catch { return []; } };
    const ddt = C.ddt().slice().sort((a, b) => String(b.data).localeCompare(String(a.data)) || (parseInt(b.numero, 10) || 0) - (parseInt(a.numero, 10) || 0)).map(d => { const R2 = parse(d.righe).filter(l => !l.h), c = C.cliOf(d.cliente); return { d, R: R2, cli: c, cliN: c ? c.nome : (d.cliente || 'Cliente'), citta: c ? [c.citta, c.prov && '(' + c.prov + ')'].filter(Boolean).join(' ') : '', pz: R2.reduce((s, l) => s + C.num(l.q), 0) }; });
    const ddtM = ddt.filter(x => String(x.d.data).slice(0, 7) === m0);
    const pos = arts.map(x => x.g).filter(g => g > 0).sort((a, b) => a - b), refG = pos.length ? pos[Math.floor(pos.length * .75)] : 1;
    return { mag, arts, cats, catOf, tot, disp, val, low, out, MM, car, car30, ret, ret90, scar, ddt, ddtM, trf: C.xiTransito(), t0, nArt: arts.length, cli: C.cli(), refG, gas: gasData() };
  }

  /* ---------------- disposizione del magazzino ---------------- */
  const KIND = {
    pallet: { n: 'Scaffale portapallet', bw: 2.7, dep: 1.1, lh: 1.6, lv: 4, bays: 10, slot: 'pallet' },
    shelf: { n: 'Scaffale a ripiani', bw: 1.0, dep: .6, lh: .42, lv: 5, bays: 6, slot: 'cassette' }
  };
  const ZONE = { ric: ['Ricevimento merci', 0xf7eddd, 'RIC', 'dock'], stk: ['Scaffalature', 0xf2f1ee, 'STK', 'rack'], pre: ['Preparazione ordini', 0xf8ecdf, 'PRE', 'hand'], cq: ['Controllo e inventario', 0xe4f1e4, 'CQ', 'shield'], spe: ['Spedizioni', 0xf0eee9, 'SPE', 'truck'], terra: ['Area a terra', 0xf3eee4, 'TER', 'floor'], uff: ['Ufficio', 0xeaf0f6, 'UFF', 'office'], free: ['Zona libera', 0xf1f0ec, 'ZON', 'zone'] };
  const TYPES = { rack: 'Scaffale', zone: 'Zona', dock: 'Banchina', wall: 'Muro', belt: 'Nastro trasportatore', desk: 'Bancone di preparazione' };
  const lkey = () => 'mg3d:' + (C.mag() || C.MAGS()[0] || 'principale');
  const rackLen = it => it.bays * (it.bw || KIND[it.k].bw);
  const rackDep = it => it.dep || KIND[it.k].dep;
  const rackLh = it => it.lh || KIND[it.k].lh;
  function foot(it) {
    let w = 1, d = 1;
    if (it.t === 'rack') { w = rackLen(it) + .3; d = rackDep(it) + .2; }
    else if (it.t === 'zone') { w = it.w; d = it.d; }
    else if (it.t === 'dock') { w = 4.6; d = .8; }
    else if (it.t === 'wall') { w = it.len; d = .3; }
    else if (it.t === 'belt') { w = it.len; d = 1.8; }
    else if (it.t === 'desk') { w = 3.4; d = 2.8; }
    return it.r % 2 ? { w: d, d: w } : { w, d };
  }
  const box2 = it => { const f = foot(it); return { x0: it.x - f.w / 2, x1: it.x + f.w / 2, z0: it.z - f.d / 2, z1: it.z + f.d / 2 }; };
  const hitB = (a, b) => a.x0 < b.x1 - .05 && a.x1 > b.x0 + .05 && a.z0 < b.z1 - .05 && a.z1 > b.z0 + .05;
  const solid = it => it.t !== 'zone';
  function autoLayout() {
    const W = 86, Dd = 50, hw = W / 2, hd = Dd / 2, items = []; let nId = 0; const uid = () => 'a' + (++nId);
    const nR = clamp(D.cats.length, 4, 9), K = KIND.pallet, len = 12 * K.bw, x = -14 + len / 2;
    let zc = -hd + .6 + K.dep / 2, k = 0;
    const put = (r, z) => { items.push({ id: uid(), t: 'rack', k: 'pallet', x: snap(x, .05), z: +z.toFixed(2), r, bays: 12, lv: 4, code: String.fromCharCode(65 + k), cat: D.cats[k] ? D.cats[k].n : '' }); k++; };
    put(0, zc); let front = zc + K.dep / 2;
    while (k < nR) { const z1 = front + 3.4 + K.dep / 2; put(2, z1); if (k >= nR) break; const z2 = z1 + K.dep + .25; put(0, z2); front = z2 + K.dep / 2; }
    // scaffali a ripiani per la minuteria, contro il muro davanti
    for (let i = 0; i < 3; i++) items.push({ id: uid(), t: 'rack', k: 'shelf', x: -13 + i * 6.6, z: hd - .55, r: 2, bays: 6, lv: 5, code: 'M' + (i + 1), cat: '' });
    items.push({ id: uid(), t: 'zone', k: 'ric', x: -32, z: 0, w: 21, d: Dd - 1, name: 'Ricevimento merci' });
    items.push({ id: uid(), t: 'zone', k: 'pre', x: -1, z: 16.5, w: 30, d: 15, name: 'Preparazione ordini' });
    items.push({ id: uid(), t: 'zone', k: 'cq', x: 22.5, z: 16.5, w: 13, d: 15, name: 'Controllo' });
    items.push({ id: uid(), t: 'zone', k: 'spe', x: 37.5, z: 0, w: 10, d: Dd - 1, name: 'Spedizioni' });
    for (let i = 0; i < 6; i++) items.push({ id: uid(), t: 'dock', x: hw, z: -18 + i * 7.2, r: 1 });
    items.push({ id: uid(), t: 'belt', x: 10, z: 13.4, len: 44, r: 0 });
    for (let i = 0; i < 4; i++) items.push({ id: uid(), t: 'desk', x: -12 + i * 6.4, z: 10.6, r: 2 });
    items.push({ id: uid(), t: 'wall', x: -21.2, z: -15, len: 18, r: 1, h: 1.4 }, { id: uid(), t: 'wall', x: -21.2, z: 9, len: 16, r: 1, h: 1.4 }, { id: uid(), t: 'wall', x: 32.2, z: -12, len: 22, r: 1, h: 1.2 });
    return { v: 1, W, D: Dd, items, loc: {} };
  }
  function normLayout(o) {
    const L2 = { v: 1, W: clamp(+o.W || 86, 20, 300), D: clamp(+o.D || 50, 16, 240), items: [], loc: o.loc && typeof o.loc === 'object' ? o.loc : {} };
    (Array.isArray(o.items) ? o.items : []).forEach(it => {
      if (!it || !TYPES[it.t]) return; const x = { ...it, id: it.id || uid(), x: +it.x || 0, z: +it.z || 0, r: ((+it.r || 0) % 4 + 4) % 4 };
      if (x.t === 'rack') { if (!KIND[x.k]) x.k = 'pallet'; x.bays = clamp(+x.bays || KIND[x.k].bays, 1, 40); x.lv = clamp(+x.lv || KIND[x.k].lv, 1, 10); x.code = String(x.code || '?').slice(0, 6); x.cat = String(x.cat || ''); }
      if (x.t === 'zone') { if (!ZONE[x.k]) x.k = 'free'; x.w = clamp(+x.w || 10, 2, 300); x.d = clamp(+x.d || 10, 2, 300); }
      if (x.t === 'wall') { x.len = clamp(+x.len || 8, 1, 300); x.h = clamp(+x.h || 2, .5, 6); }
      if (x.t === 'belt') x.len = clamp(+x.len || 12, 2, 200);
      L2.items.push(x);
    });
    return L2;
  }
  function getLayout() {
    if (EDIT) return EDIT.L;
    const v = C.cfg ? C.cfg(lkey()) : null;
    return v && Array.isArray(v.items) ? normLayout(v) : autoLayout();
  }
  const isAutoLayout = () => !(C.cfg && C.cfg(lkey()) && Array.isArray(C.cfg(lkey()).items));
  function saveLayout(L2, msg) {
    if (!canEdit()) { toast('Solo il titolare può modificare la disposizione'); return false; }
    C.write([{ action: 'upsert', sheet: 'Config', row: { chiave: lkey(), valore: JSON.stringify(L2) } }]);
    if (msg) toast(msg); return true;
  }

  /* ubicazioni: ogni cella (scaffale, campata, livello) contiene un articolo */
  const locCode = (rk, b, l) => `${rk.code}-${String(b + 1).padStart(2, '0')}-${l + 1}`;
  function place() {
    const racks = L.items.filter(i => i.t === 'rack'), cells = new Map(), byArt = new Map(), unplaced = [];
    const rById = new Map(racks.map(r => [r.id, r]));
    const ck = (r, b, l) => r + '|' + b + '|' + l;
    const free = rk => { for (let l = 0; l < rk.lv; l++) for (let b = 0; b < rk.bays; b++) if (!cells.has(ck(rk.id, b, l))) return [b, l]; return null; };
    const set = (x, rk, b, l, auto) => { cells.set(ck(rk.id, b, l), x); byArt.set(x.id, { rk, b, l, auto, code: locCode(rk, b, l) }); };
    D.arts.forEach(x => { const lo = L.loc[x.id]; if (!lo) return; const rk = rById.get(lo.r); if (!rk || lo.b >= rk.bays || lo.l >= rk.lv || cells.has(ck(rk.id, lo.b, lo.l))) return; set(x, rk, lo.b, lo.l, 0); });
    const rest = D.arts.filter(x => !byArt.has(x.id) && (x.g > 0 || x.s > 0)).sort((a, b) => String(a.a.codice || a.a.descrizione).localeCompare(String(b.a.codice || b.a.descrizione), 'it', { numeric: true }));
    rest.forEach(x => {
      const cand = [...racks.filter(r => r.cat && r.cat === x.cat), ...racks.filter(r => !r.cat), ...racks.filter(r => r.cat && r.cat !== x.cat && !D.catOf.has(r.cat))];
      for (const rk of cand) { const f = free(rk); if (f) { set(x, rk, f[0], f[1], 1); return; } }
      unplaced.push(x);
    });
    D.arts.forEach(x => { if (!byArt.has(x.id) && !unplaced.includes(x) && (x.g > 0 || x.s > 0)) unplaced.push(x); });
    return { cells, byArt, unplaced, ck, racks };
  }
  const fillOf = x => { if (!x || x.g <= 0) return 0; const ref = x.s > 0 ? x.s * 3 : Math.max(1, D.refG * 1.2); return clamp(x.g / ref, .12, 1); };

  /* ---------------- materiali e texture ---------------- */
  const G = {}, M = {}, TX = {}, OWN = [];
  function mat(c, o) { const k = c + (o ? JSON.stringify(o) : ''); return M[k] || (M[k] = new T.MeshLambertMaterial({ color: c, ...(o || {}) })); }
  function cvTex(w, h, fn, rep) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; }
  const rr = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  function textures() {
    if (TX.ok) return; TX.ok = 1;
    TX.concrete = cvTex(512, 512, (g, w, h) => { g.fillStyle = '#efece6'; g.fillRect(0, 0, w, h); for (let i = 0; i < 14000; i++) { const v = rr(); g.fillStyle = v > .5 ? 'rgba(255,255,255,.35)' : 'rgba(120,110,95,.07)'; g.fillRect(rr() * w, rr() * h, 1 + rr() * 2, 1 + rr() * 2); } g.strokeStyle = 'rgba(90,80,70,.10)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2); g.strokeStyle = 'rgba(90,80,70,.05)'; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke(); });
    TX.panel = cvTex(128, 128, (g, w, h) => { g.fillStyle = '#f8f8f6'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 16) { g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(x, 0, 1.5, h); g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(x + 2, 0, 2, h); } g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(0, h - 3, w, 3); });
    TX.upr = cvTex(32, 256, (g, w, h) => { g.fillStyle = '#2f6db4'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(2, 0, 3, h); for (let y = 6; y < h; y += 16) { g.fillStyle = '#17365e'; g.beginPath(); g.moveTo(13, y); g.lineTo(19, y); g.lineTo(19, y + 6); g.lineTo(16, y + 9); g.lineTo(13, y + 6); g.closePath(); g.fill(); } }, [1, 5]);
    TX.haz = cvTex(64, 64, (g, w, h) => { g.fillStyle = '#f5c518'; g.fillRect(0, 0, w, h); g.fillStyle = '#1d1f22'; for (let i = -4; i < 8; i++) { g.beginPath(); g.moveTo(i * 16, 0); g.lineTo(i * 16 + 8, 0); g.lineTo(i * 16 + 8 + h, h); g.lineTo(i * 16 + h, h); g.fill(); } }, [1, 1]);
    TX.carton = cvTex(128, 128, (g, w, h) => { g.fillStyle = '#e2b27a'; g.fillRect(0, 0, w, h); const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,.08)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(236,206,160,.95)'; g.fillRect(0, 54, w, 20); g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(0, 54, w, 1.5); g.fillRect(0, 72, w, 1.5); g.fillStyle = '#fbfbf8'; g.fillRect(14, 86, 44, 28); g.fillStyle = 'rgba(0,0,0,.55)'; for (let i = 0; i < 12; i++) g.fillRect(18 + i * 3, 104, i % 3 ? 1.2 : 2, 7); g.fillRect(18, 91, 30, 3); g.fillRect(18, 97, 22, 2); g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3); });
    TX.door = cvTex(128, 128, (g, w, h) => { g.fillStyle = '#e3e6ea'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 21) { g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, y, w, 2); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(0, y + 2, w, 2); } g.fillStyle = '#3c4a5c'; for (let x = 10; x < w - 10; x += 28) g.fillRect(x, 46, 18, 8); g.fillStyle = '#f47b20'; g.fillRect(0, h - 8, w, 8); });
    TX.bin = cvTex(64, 64, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, 0, w, 6); g.fillStyle = 'rgba(255,255,255,1)'; g.fillRect(12, 24, 40, 22); g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(16, 30, 26, 3); g.fillRect(16, 37, 18, 3); });
    TX.road = cvTex(256, 256, (g, w, h) => { g.fillStyle = '#4e535b'; g.fillRect(0, 0, w, h); for (let i = 0; i < 5000; i++) { g.fillStyle = rr() > .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.08)'; g.fillRect(rr() * w, rr() * h, 2, 2); } }, [20, 1]);
    TX.grass = cvTex(256, 256, (g, w, h) => { g.fillStyle = '#a3d36c'; g.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { g.fillStyle = rr() > .5 ? 'rgba(255,255,210,.10)' : 'rgba(40,90,20,.07)'; g.fillRect(rr() * w, rr() * h, 2, 3); } }, [120, 120]);
    // geometrie condivise
    G.box = new T.BoxGeometry(1, 1, 1);
    G.boxB = new T.BoxGeometry(1, 1, 1).translate(0, .5, 0);
    G.cyl = new T.CylinderGeometry(.5, .5, 1, 14);
    G.sph = new T.SphereGeometry(.5, 14, 10);
    G.plane = new T.PlaneGeometry(1, 1);
    G.tree = new T.IcosahedronGeometry(2.3, 1); G.trunk = new T.CylinderGeometry(.22, .3, 2.4, 6).translate(0, 1.2, 0); G.pine = new T.ConeGeometry(1.9, 6.5, 7).translate(0, 3.65, 0);
    M.upr = new T.MeshLambertMaterial({ map: TX.upr, color: 0xffffff });
    M.haz = new T.MeshLambertMaterial({ map: TX.haz });
    M.carton = new T.MeshLambertMaterial({ map: TX.carton, color: 0xffffff });
    M.bin = new T.MeshLambertMaterial({ map: TX.bin, color: 0xffffff });
    M.wrap = new T.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: .28, depthWrite: false });
    M.door = new T.MeshLambertMaterial({ map: TX.door });
    M.hit = new T.MeshBasicMaterial({ visible: false });
  }
  const panelMat = len => { const t = TX.panel.clone(); t.needsUpdate = true; t.repeat.set(Math.max(1, len / 2.2), 1); t.wrapS = T.RepeatWrapping; OWN.push(t); const m = new T.MeshLambertMaterial({ map: t }); OWN.push(m); return m; };

  /* batch di istanze dentro un gruppo (coordinate locali) */
  const O3 = () => (O3.o || (O3.o = new T.Object3D()));
  function m4(x, y, z, sx, sy, sz, ry, rx, rz) { const o = O3(); o.position.set(x, y, z); o.scale.set(sx || 1, sy || 1, sz || 1); o.rotation.set(rx || 0, ry || 0, rz || 0); o.updateMatrix(); return o.matrix.clone(); }
  class Batch {
    constructor(p) { this.p = p; this.m = {}; }
    add(k, geo, material, mx, col, id) { let b = this.m[k]; if (!b) b = this.m[k] = { geo, material, ms: [], cs: [], ids: [] }; b.ms.push(mx); if (col != null) b.cs.push(col); if (id !== undefined) b.ids.push(id); return b; }
    flush(shadow) { const out = {}; Object.entries(this.m).forEach(([k, b]) => { const im = new T.InstancedMesh(b.geo, b.material, b.ms.length); b.ms.forEach((mx, i) => im.setMatrixAt(i, mx)); if (b.cs.length === b.ms.length) b.cs.forEach((c, i) => im.setColorAt(i, new T.Color(c))); im.castShadow = shadow !== false; im.receiveShadow = true; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; if (b.ids.length) im.userData.ids = b.ids; this.p.add(im); out[k] = im; }); return out; }
  }
  function mesh(geo, material, x, y, z, p, o) { const m = new T.Mesh(geo, material); m.position.set(x, y, z); if (o && o.s) m.scale.set(...o.s); if (o && o.ry) m.rotation.y = o.ry; if (o && o.rx) m.rotation.x = o.rx; if (o && o.rz) m.rotation.z = o.rz; m.castShadow = !(o && o.ns); m.receiveShadow = true; p.add(m); return m; }
  const bx = (p, w, h, d, c, x, y, z, o) => mesh(G.box, typeof c === 'object' ? c : mat(c), x, y + h / 2, z, p, { ...(o || {}), s: [w, h, d] });
  function textTex(lines, o) {
    o = o || {}; const W = o.w || 512, H = o.h || 128;
    const t = cvTex(W, H, g => { if (o.bg) { g.fillStyle = o.bg; if (o.round) { g.beginPath(); g.roundRect(0, 0, W, H, o.round); g.fill(); } else g.fillRect(0, 0, W, H); } g.fillStyle = o.color || '#fff'; g.textAlign = o.align || 'center'; g.textBaseline = 'middle'; lines.forEach(([t2, size, wgt, y, x, col]) => { g.font = `${wgt || 700} ${size}px Inter, system-ui, sans-serif`; if (col) g.fillStyle = col; g.fillText(t2, x != null ? x : W / 2, y != null ? y : H / 2); }); });
    OWN.push(t); return t;
  }
  function planeT(tex, w, h, p, x, y, z, o) { const m2 = new T.MeshBasicMaterial({ map: tex, transparent: true, side: o && o.ds ? T.DoubleSide : T.FrontSide }); OWN.push(m2); const m = new T.Mesh(G.plane, m2); m.scale.set(w, h, 1); m.position.set(x, y, z); if (o && o.rx) m.rotation.x = o.rx; if (o && o.ry) m.rotation.y = o.ry; if (o && o.rz) m.rotation.z = o.rz; p.add(m); return m; }
  function floorText(p, txt, w, x, z, ry, col) { const t = textTex([[txt, Math.min(96, Math.floor(1800 / Math.max(1, txt.length))), 800]], { color: col || 'rgba(244,123,32,.5)', w: 1024, h: 180 }); const m2 = new T.MeshLambertMaterial({ map: t, transparent: true, depthWrite: false }); OWN.push(m2); const m = new T.Mesh(G.plane, m2); m.scale.set(w, w / 5.7, 1); m.rotation.x = -Math.PI / 2; m.rotation.z = ry || 0; m.position.set(x, .56, z); m.receiveShadow = true; p.add(m); return m; }
  // etichette di ubicazione: un atlante per scaffale, quadrati con le coordinate dell'atlante
  function labelAtlas(list) {
    const cols = 10, cw = 160, ch = 60, rows = Math.max(1, Math.ceil(list.length / cols));
    const tex = cvTex(cols * cw, rows * ch, g => { list.forEach((q, i) => { const x = (i % cols) * cw, y = Math.floor(i / cols) * ch; g.fillStyle = q.bg; g.fillRect(x + 2, y + 2, cw - 4, ch - 4); g.fillStyle = '#16181b'; g.font = '800 26px Inter, system-ui, sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(q.t, x + 10, y + 20); g.fillStyle = 'rgba(0,0,0,.8)'; for (let k = 0; k < 26; k++) { const bw2 = (k * 7 + i) % 3 === 0 ? 3 : 1.5; g.fillRect(x + 10 + k * 5.4, y + 36, bw2, 16); } }); });
    OWN.push(tex); return { tex, cols, rows };
  }
  function quadsMesh(list, atlas, horiz) {
    const pos = [], uv = [], idx = [];
    list.forEach((q, i) => {
      const u0 = (i % atlas.cols) / atlas.cols, v1 = 1 - Math.floor(i / atlas.cols) / atlas.rows, u1 = u0 + 1 / atlas.cols, v0 = v1 - 1 / atlas.rows, hw = q.w / 2, hh = q.h / 2, b = pos.length / 3;
      if (horiz) pos.push(q.x - hw, q.y, q.z + hh, q.x + hw, q.y, q.z + hh, q.x + hw, q.y, q.z - hh, q.x - hw, q.y, q.z - hh);
      else pos.push(q.x - hw, q.y - hh, q.z, q.x + hw, q.y - hh, q.z, q.x + hw, q.y + hh, q.z, q.x - hw, q.y + hh, q.z);
      uv.push(u0, v0, u1, v0, u1, v1, u0, v1); idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    });
    const g2 = new T.BufferGeometry(); g2.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g2.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g2.setIndex(idx); g2.computeVertexNormals(); OWN.push(g2);
    const m2 = new T.MeshLambertMaterial({ map: atlas.tex, polygonOffset: true, polygonOffsetFactor: -2 }); OWN.push(m2);
    const m = new T.Mesh(g2, m2); m.receiveShadow = true; return m;
  }

  /* ---------------- ambiente esterno ---------------- */
  function buildEnv() {
    if (ENV) { scene.remove(ENV); ENV.traverse(o => { if (o.isInstancedMesh) o.dispose(); }); }
    ENV = new T.Group(); scene.add(ENV);
    const W = L.W, Dd = L.D, hw = W / 2, hd = Dd / 2, P2 = ENV;
    const gnd = new T.Mesh(new T.PlaneGeometry(1600, 1600), new T.MeshLambertMaterial({ map: TX.grass })); gnd.rotation.x = -Math.PI / 2; gnd.receiveShadow = true; P2.add(gnd); OWN.push(gnd.geometry, gnd.material);
    [[-190, -170, 130, 0xb3dc80], [40, -250, 160, 0xa9d775], [250, -130, 120, 0x9ccf68], [-280, 60, 130, 0xb0da7c], [-130, 210, 100, 0x94c95f], [230, 190, 110, 0xa4d36f]].forEach(([x, z, r, c]) => { const h = mesh(G.sph, mat(c), x, -r * .06, z, P2, { s: [r * 2, r * .44, r * 2], ns: 1 }); h.castShadow = false; });
    // piazzale esterno, strade
    bx(P2, W + 26, .12, Dd + 20, 0xe7e6e2, 2, 0, 2, { ns: 1 });
    const yardW = 30, rz = hd + 31;
    const yard = mesh(G.box, new T.MeshLambertMaterial({ color: 0x575c64 }), hw + yardW / 2 + .5, .08, 0, P2, { s: [yardW, .16, Dd + 18], ns: 1 }); OWN.push(yard.material);
    bx(P2, 11, .15, rz - 5.7 - hd - 9, 0x575c64, hw + 18, 0, (hd + 9 + rz - 5.7) / 2, { ns: 1 });
    const road = mesh(G.box, new T.MeshLambertMaterial({ map: TX.road }), 0, .07, rz, P2, { s: [1600, .14, 11], ns: 1 }); OWN.push(road.material);
    const B2 = new Batch(P2), dsh = (x, z, w, d) => B2.add('dash', G.box, mat(0xf4f4f2), m4(x, .16, z, w, .04, d));
    for (let x = -360; x < 360; x += 9) dsh(x, rz, 4, .3);
    for (let x = -800; x < 800; x += 800) { bx(P2, 1600, .1, .45, 0xe9e7df, 0, 0, rz - 5.8, { ns: 1 }); bx(P2, 1600, .1, .45, 0xe9e7df, 0, 0, rz + 5.8, { ns: 1 }); break; }
    // linee del piazzale camion
    for (let i = 0; i < 7; i++) dsh(hw + 20, -hd + 2 + i * (Dd - 4) / 6, 12, .22);
    // parcheggio con pensiline fotovoltaiche
    const px = -hw * .45, pz = hd + 13;
    bx(P2, 34, .2, 18, 0x60666e, px, 0, pz, { ns: 1 });
    for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const x = px - 13.5 + i * 5.2, z = pz - 4.5 + r * 9; B2.add('pv', G.box, mat(0x27416e), m4(x, 3.3, z, 4.8, .16, 5.6, 0, r ? -.12 : .12)); B2.add('pvp', G.box, mat(0xdedfe1), m4(x, 1.6, z, .18, 3.2, .18)); for (let k = 0; k < 4; k++) B2.add('pvl', G.box, mat(0x6f8fb8), m4(x - 1.8 + k * 1.2, 3.42, z, .03, .02, 5.4, 0, r ? -.12 : .12)); if ((i + r) % 3 !== 2) B2.add('car', G.box, mat(0xffffff), m4(x, .75, z, 2, 1.1, 4.2), [0xffffff, 0xd0d4da, 0x2f3540, 0xc94b3c, 0x6f8fa8][(i * 2 + r) % 5]); }
    // uffici
    const ox = hw * .5, oz = hd + 13;
    const ofc = bx(P2, 26, 6.4, 11, 0xfdfdfc, ox, 0, oz); ofc.userData.k = { t: 'zone', z: 'uffe' }; pick.push(ofc);
    for (const y of [1.3, 4.1]) { bx(P2, 26.1, 1.4, 11.1, 0x6f8fa8, ox, y, oz, { ns: 1 }); for (let i = 0; i < 7; i++) B2.add('mul', G.box, mat(0xfdfdfc), m4(ox - 12.4 + i * 4.13, y + .7, oz, .22, 1.42, 11.24)); }
    bx(P2, 26.4, .3, 11.4, 0xeeeeec, ox, 6.4, oz, { ns: 1 });
    for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) B2.add('opv', G.box, mat(0x27416e), m4(ox - 9 + i * 4.4, 7, oz - 2.2 + j * 4.4, 3.6, .18, 2.2, 0, .15));
    bx(P2, 7, 3.4, 8, 0xf3f2f0, ox + 17, 0, oz + 1); bx(P2, 7.2, .3, 8.2, 0x7fbf5e, ox + 17, 3.4, oz + 1, { ns: 1 });
    planeT(textTex([[C.orgName().slice(0, 30), 62, 700]], { bg: '#17191c', w: 768, h: 128 }), 10, 1.7, P2, ox + 6, 5.25, oz + 5.62);
    bx(P2, 2.2, .1, 4, 0xe9e7df, ox - 6, 0, oz + 7.5, { ns: 1 });
    // sfera arancione all'ingresso
    const orb = mesh(G.sph, mat(0xf47b20), 0, 3.6, hd + 10, P2, { s: [4.4, 4.4, 4.4] }); bx(P2, 4, .8, 4, 0x2b2f35, 0, 0, hd + 10); movers.push({ o: orb, t: 'float', y: 3.6 });
    // alberi
    const free = (x, z) => !(x > -hw - 42 && x < hw + yardW + 6 && z > -hd - 14 && z < hd + 24) && !(z > rz - 9 && z < rz + 9) && !(x > hw + 10 && x < hw + 26 && z > hd && z < rz);
    let n = 0; while (n < 680) { const near = rr() < .38, x = (rr() - .5) * (near ? W + 160 : 620), z = (rr() - .5) * (near ? Dd + 140 : 480) - (near ? 5 : 30); if (!free(x, z)) continue; n++; const s = .55 + rr() * .6;
      if (rr() < .22) B2.add('pine', G.pine, mat(0x4f9a43), m4(x, 0, z, s, s * 1.15, s)); else { B2.add('tree', G.tree, mat(0xffffff), m4(x, 2.6 * s + 1.1, z, s, s, s), [0x7cbf4f, 0x8cc95a, 0x6fb347, 0x98cf62][Math.floor(rr() * 4)]); B2.add('trunk', G.trunk, mat(0x8a6a4f), m4(x, 0, z, s, s, s)); } }
    for (let i = 0; i < 28; i++) B2.add('bush', G.tree, mat(0x86c457), m4(-hw + 2 + i * (W - 4) / 27, .7, hd + 3.2 + (i % 2) * .6, .5, .42, .5));
    B2.flush();
  }

  /* ---------------- magazzino ---------------- */
  function itemGroup(it) { const g = new T.Group(); g.position.set(it.x, 0, it.z); g.rotation.y = it.r * Math.PI / 2; g.userData.eid = it.id; WH.add(g); return g; }
  function hit(g, w, h, d, y, k, it) { const m = new T.Mesh(G.box, M.hit); m.scale.set(w, h, d); m.position.y = y; m.userData.k = k; m.userData.eid = it.id; g.add(m); pick.push(m); return m; }
  function buildWH() {
    if (WH) { scene.remove(WH); WH.traverse(o => { if (o.isInstancedMesh) o.dispose(); }); }
    WH = new T.Group(); scene.add(WH); RX = []; FOC = null; HOV = null; SCAN = null; BACK.length = 0; FADE.length = 0; if (root) { callout(false); const tp = $('.m3-tip'); tp && tp.classList.remove('on'); }
    const W = L.W, Dd = L.D, hw = W / 2, hd = Dd / 2;
    // pavimento in cemento
    bx(WH, W, .48, Dd, 0xe2ded7, 0, 0, 0);
    const ct = TX.concrete.clone(); ct.needsUpdate = true; ct.wrapS = ct.wrapT = T.RepeatWrapping; ct.repeat.set(W / 6, Dd / 6); OWN.push(ct);
    const fm = new T.MeshLambertMaterial({ map: ct }); OWN.push(fm); const fl = new T.Mesh(G.plane, fm); fl.scale.set(W, Dd, 1); fl.rotation.x = -Math.PI / 2; fl.position.y = .505; fl.receiveShadow = true; WH.add(fl);
    // muri perimetrali a pannelli, con il bordo arancione
    const wallSeg = (x, z, len, rot, h) => { const g = new T.Group(); g.position.set(x, .5, z); g.rotation.y = rot; WH.add(g); mesh(G.box, panelMat(len), 0, h / 2, 0, g, { s: [len, h, .3] }); bx(g, len + .04, .2, .36, 0xf47b20, 0, h, 0, { ns: 1 }); bx(g, len, .12, .34, 0xd8d6d1, 0, 0, 0, { ns: 1 }); };
    wallSeg(0, -hd, W, 0, 3.4); wallSeg(-hw, 0, Dd, Math.PI / 2, 3.4); wallSeg(hw, 0, Dd, Math.PI / 2, 3.4);
    wallSeg(-hw * .55, hd, W * .45, 0, 1.4); wallSeg(hw * .5, hd, W * .5, 0, 1.4);
    // estintori e uscite di sicurezza
    for (let i = 0; i < 4; i++) { const z = -hd + 6 + i * (Dd - 12) / 3; bx(WH, .25, .55, .25, 0xd62b1f, -hw + .35, .9, z); bx(WH, .05, .4, .5, 0x1f9a4b, -hw + .2, 2.9, z + 1.2, { ns: 1 }); }
    pick = pickEnv.slice(); movers = envMovers.slice();
    trucks = [];
    P = place();
    L.items.filter(i => i.t === 'zone').forEach(buildZone);
    L.items.filter(i => i.t !== 'zone').forEach(it => ({ rack: buildRack, dock: buildDock, wall: buildWall, belt: buildBelt, desk: buildDesk })[it.t](it));
    buildRoadTrucks(); buildPeople(); buildFleet();
    if (EDIT) { const v = []; for (let x = -hw; x <= hw + .01; x += 1) v.push(x, .53, -hd, x, .53, hd); for (let z = -hd; z <= hd + .01; z += 1) v.push(-hw, .53, z, hw, .53, z); const gg = new T.BufferGeometry(); gg.setAttribute('position', new T.Float32BufferAttribute(v, 3)); const gm = new T.LineBasicMaterial({ color: 0xcdbfb0, transparent: true, opacity: .45 }); WH.add(new T.LineSegments(gg, gm)); OWN.push(gg, gm); }
    hiMesh = new T.Mesh(G.box, new T.MeshBasicMaterial({ color: 0xf47b20, transparent: true, opacity: .35, depthWrite: false, depthTest: false })); hiMesh.renderOrder = 10; hiMesh.visible = false; WH.add(hiMesh); OWN.push(hiMesh.material);
    const eg = new T.LineSegments(new T.EdgesGeometry(G.box), new T.LineBasicMaterial({ color: 0xf47b20, depthTest: false })); eg.renderOrder = 11; hiMesh.add(eg); OWN.push(eg.geometry, eg.material);
    selHelper = null;
  }
  let hiMesh = null, selHelper = null, trucks = [];

  function buildZone(it) {
    const g = itemGroup(it), z = ZONE[it.k], w = it.r % 2 ? it.d : it.w, d = it.r % 2 ? it.w : it.d;
    g.rotation.y = 0; // le zone sono rettangoli allineati
    bx(g, w - .1, .03, d - .1, z[1], 0, .51, 0, { ns: 1 });
    const edge = it.k === 'cq' ? 0x63b37a : it.k === 'uff' ? 0x7d98b8 : 0xf3a868;
    bx(g, w, .035, .14, edge, 0, .52, -d / 2 + .07, { ns: 1 }); bx(g, w, .035, .14, edge, 0, .52, d / 2 - .07, { ns: 1 }); bx(g, .14, .035, d, edge, -w / 2 + .07, .52, 0, { ns: 1 }); bx(g, .14, .035, d, edge, w / 2 - .07, .52, 0, { ns: 1 });
    const name = (it.name || z[0]).toUpperCase().slice(0, 22), fw = Math.min(w * .8, name.length * 1.35);
    floorText(g, name, Math.max(4, fw), 0, d / 2 - fw / 11 - 1, d > w * 1.6 ? Math.PI / 2 : 0, it.k === 'cq' ? 'rgba(60,150,80,.45)' : 'rgba(244,123,32,.48)');
    if (d > w * 1.6) { const m = g.children[g.children.length - 1]; m.position.set(w / 2 - 1.6, .56, 0); }
    hit(g, w, .6, d, .5, { t: 'zone', z: it.k, id: it.id }, it);
    if (it.k === 'ric') { // pallet in arrivo: uno per carico degli ultimi 30 giorni
      const B = new Batch(g), cols = Math.max(1, Math.floor((w - 3) / 3.2)); let i = 0;
      D.car30.slice(0, 30).forEach(m => { const c = i % cols, r = Math.floor(i / cols), x = -w / 2 + 2 + c * 3.2, zz = -d / 2 + 2.2 + r * 3.4; if (zz > d / 2 - 5) return; i++; palletStack(B, x, .505, zz, clamp(C.num(m.quantita) / 80, .25, 1), PAL[i % PAL.length], 3, null); });
      const ims = B.flush(); Object.values(ims).forEach(im => { im.userData.k = { t: 'zone', z: 'ric', id: it.id }; im.userData.eid = it.id; pick.push(im); });
      // transpallet
      for (let k = 0; k < 2; k++) { const tg = new T.Group(); tg.position.set(w / 2 - 2.5, .5, -d / 2 + 4 + k * 5); g.add(tg); bx(tg, .55, .08, 1.15, 0x3a3f46, 0, .02, 0); bx(tg, .5, .5, .25, 0xf47b20, 0, .1, -.6); bx(tg, .05, .9, .05, 0x2b2f35, 0, .6, -.75, { rx: -.3 }); }
    }
    if (it.k === 'terra') { const B = new Batch(g), cols = Math.max(1, Math.floor((w - 1) / 1.6)), rows = Math.max(1, Math.floor((d - 1) / 2)); for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) if ((c * 7 + r * 3) % 5) palletStack(B, -w / 2 + 1.2 + c * 1.6, .505, -d / 2 + 1.4 + r * 2, .4 + ((c + r) % 3) * .2, PAL[(c + r) % PAL.length], 3, null); B.flush(); }
  }

  // pallet europeo con colli sopra (riempimento 0..1)
  function palletStack(B, x, y, z, f, col, maxL, id, low, rot) {
    const tint = low ? mixC(0xffffff, 0xf0603a, .6) : mixC(0xffffff, col, .3);
    B.add('palT', G.box, mat(0xcfa56f), m4(x, y + .13, z, .8, .025, 1.2), null, id);
    for (const dx of [-.35, 0, .35]) B.add('palB', G.box, mat(0xb98d58), m4(x + dx, y + .06, z, .1, .1, 1.2), null, id);
    for (const dz of [-.55, 0, .55]) B.add('palS', G.box, mat(0xc49864), m4(x, y + .012, z + dz, .8, .022, .1), null, id);
    if (f <= 0) return 0;
    const per = 6, n = Math.max(1, Math.round(f * maxL * per)); let k = 0;
    for (let l = 0; l < maxL && k < n; l++) for (let i = 0; i < per && k < n; i++, k++) {
      const cx = x + (i % 2 ? .2 : -.2), cz = z + (Math.floor(i / 2) - 1) * .4, h = .3;
      B.add('ctn', G.box, M.carton, m4(cx, y + .145 + l * .31 + h / 2, cz, .39, h, .39, ((i + l) % 2) * Math.PI / 2), tint, id);
    }
    if (n >= maxL * per && id) B.add('wrap', G.box, M.wrap, m4(x, y + .145 + maxL * .31 / 2, z, .84, maxL * .31 + .02, 1.24), null, id);
    return n;
  }

  function buildRack(it) {
    const g = itemGroup(it), K = KIND[it.k], bw = it.bw || K.bw, dep = rackDep(it), lh = rackLh(it), nb = it.bays, nl = it.lv, len = nb * bw, x0 = -len / 2;
    const pal = it.k === 'pallet', y0 = .5;
    const lvY = l => pal ? (l === 0 ? y0 : y0 + .1 + l * lh) : y0 + .1 + l * lh;
    const H = pal ? (nl > 1 ? lvY(nl - 1) - y0 + 1.35 : 2) : lvY(nl - 1) - y0 + .5;
    const B = new Batch(g), cat = D.catOf.get(it.cat), col = cat ? cat.col : 0xd6c3a5, binC = cat ? cat.bin : 0x8a97a8;
    if (pal) {
      for (let b = 0; b <= nb; b++) {
        const x = x0 + b * bw;
        for (const s of [-1, 1]) { B.add('upr', G.box, M.upr, m4(x, y0 + H / 2, s * dep / 2, .09, H, .075)); B.add('plt', G.box, mat(0x2a2d31), m4(x, y0 + .01, s * dep / 2, .2, .02, .18)); }
        for (const yy of [.15, H - .25]) B.add('br', G.box, mat(0x2f6db4), m4(x, y0 + yy, 0, .035, .035, dep));
        const seg = 1.05, nd = Math.max(1, Math.floor((H - .5) / seg)), a = Math.atan2(seg, dep), ln = Math.hypot(seg, dep);
        for (let k = 0; k < nd; k++) B.add('br', G.box, mat(0x2f6db4), m4(x, y0 + .2 + k * seg + seg / 2, 0, .03, .03, ln, 0, k % 2 ? a : -a));
      }
      for (let l = 1; l < nl; l++) for (let b = 0; b < nb; b++) { const xc = x0 + b * bw + bw / 2, y = lvY(l) - .065; for (const s of [-1, 1]) B.add('bm', G.box, mat(0xf47b20), m4(xc, y, s * (dep / 2 + .01), bw - .1, .13, .055)); B.add('bmc', G.box, mat(0xc85f12), m4(x0 + b * bw + .09, y, dep / 2 + .02, .06, .17, .06)); B.add('bmc', G.box, mat(0xc85f12), m4(x0 + (b + 1) * bw - .09, y, dep / 2 + .02, .06, .17, .06)); }
      for (const e of [-1, 1]) { B.add('grd', G.box, M.haz, m4(e * (len / 2 + .16), y0 + .3, 0, .14, .6, dep + .3)); B.add('grd', G.box, M.haz, m4(e * (len / 2 + .05), y0 + .3, dep / 2 + .16, .3, .6, .14)); }
      B.add('lineY', G.box, mat(0xf2c418), m4(0, y0 + .012, dep / 2 + .5, len + .4, .02, .09), null);
    } else {
      for (let b = 0; b <= nb; b++) { const x = x0 + b * bw; for (const s of [-1, 1]) B.add('post', G.box, mat(0x8e959e), m4(x, y0 + H / 2, s * dep / 2, .045, H, .045)); }
      for (let l = 0; l < nl; l++) for (let b = 0; b < nb; b++) B.add('deck', G.box, mat(0xb7bcc3), m4(x0 + b * bw + bw / 2, lvY(l), 0, bw - .05, .025, dep));
      for (let b = 0; b < nb; b++) { const xc = x0 + b * bw + bw / 2, a = Math.atan2(H, bw); B.add('xb', G.box, mat(0x9aa1aa), m4(xc, y0 + H / 2, -dep / 2 + .01, .015, Math.hypot(H, bw), .015, 0, 0, a)); B.add('xb', G.box, mat(0x9aa1aa), m4(xc, y0 + H / 2, -dep / 2 + .01, .015, Math.hypot(H, bw), .015, 0, 0, -a)); }
      B.add('top', G.box, mat(0x8e959e), m4(0, y0 + H, 0, len, .04, dep));
    }
    // contenuto: una cella (campata, livello) = un articolo
    const lab = [], flab = [], maxL = pal ? Math.max(1, Math.floor((lh - .4) / .31)) : 1;
    for (let l = 0; l < nl; l++) for (let b = 0; b < nb; b++) {
      const x = P.cells.get(P.ck(it.id, b, l)), xc = x0 + b * bw + bw / 2, yb = lvY(l), f = fillOf(x), code = locCode(it, b, l);
      const bg = !x ? '#ece9e3' : x.out ? '#d9d6d0' : x.low ? '#ff9478' : '#ffd84a';
      if (pal) {
        if (x) { const c2 = D.catOf.get(x.cat), cc = c2 ? c2.col : col; palletStack(B, xc - bw * .25, yb, 0, f > .5 ? 1 : f * 2, cc, maxL, x.id, x.low); if (f > .5) palletStack(B, xc + bw * .25, yb, 0, (f - .5) * 2, cc, maxL, x.id, x.low); else B.add('palT', G.box, mat(0xcfa56f), m4(xc + bw * .25, yb + .13, 0, .8, .025, 1.2), null, x.id); }
        if (l === 0) flab.push({ x: xc, y: y0 + .018, z: dep / 2 + .3, w: .5, h: .19, bg, t: code }); else lab.push({ x: xc, y: yb - .065, z: dep / 2 + .05, w: .42, h: .105, bg, t: code });
      } else {
        const c2 = x && D.catOf.get(x.cat), bc = c2 ? c2.bin : binC;
        for (let k = 0; k < 3; k++) { const bxp = x0 + b * bw + bw * (1 / 6 + k / 3); B.add('bin', G.box, M.bin, m4(bxp, yb + .0125 + .11, .03, .29, .22, .5), x ? bc : 0xd8dbe0, x ? x.id : null); if (x && f > k / 3) B.add('binI', G.box, mat(0xd9b07a), m4(bxp, yb + .03 + .085 * Math.min(1, f * 1.4), .03, .24, .17 * Math.min(1, f * 1.4), .44), null, x.id); }
        lab.push({ x: xc, y: yb - .02, z: dep / 2 + .02, w: .32, h: .07, bg, t: code });
      }
    }
    const ims = B.flush();
    ['ctn', 'palT', 'bin', 'binI', 'wrap'].forEach(k => { if (ims[k] && ims[k].userData.ids) { ims[k].userData.k = { t: 'art', rack: it.id }; ims[k].userData.eid = it.id; pick.push(ims[k]); } });
    if (ims.wrap) ims.wrap.castShadow = false;
    if (lab.length) g.add(quadsMesh(lab, labelAtlas(lab), false));
    if (flab.length) g.add(quadsMesh(flab, labelAtlas(flab), true));
    // cartelli di testata (codice dello scaffale e categoria)
    const sTex = textTex([[it.code, 150, 800, 112, null, '#ffffff'], [(it.cat || 'libero').toUpperCase().slice(0, 20), 34, 700, 214, null, 'rgba(255,255,255,.92)']], { bg: '#f47b20', w: 320, h: 256, round: 26 });
    for (const e of [-1, 1]) planeT(sTex, 1.1, .88, g, e * (len / 2 + .18), y0 + H + .62, 0, { ry: e * Math.PI / 2, ds: true });
    for (const e of [-1, 1]) bx(g, .04, .5, .04, 0x2b2f35, e * (len / 2 + .18), y0 + H, 0, { ns: 1 });
    hit(g, len, H, dep + .6, y0 + H / 2, { t: 'rack', id: it.id }, it);
  }

  function buildDock(it) {
    const g = itemGroup(it), B = new Batch(g);
    bx(g, 4.4, 3.5, .18, 0x2b2f35, 0, .5, .1);
    mesh(G.box, M.door, 0, .5 + 1.55, .22, g, { s: [3.5, 3.1, .04] });
    for (const s of [-1, 1]) bx(g, .25, 3.3, .5, 0x1b1d20, s * 1.95, .5, .45);
    bx(g, 4.15, .3, .5, 0x1b1d20, 0, 3.55, .45);
    bx(g, 2.3, .08, 2.6, 0x9ba1a8, 0, .45, -1.3, { ns: 1 });
    for (const s of [-1, 1]) bx(g, .35, .35, .3, 0x16181b, s * 1.25, .55, .35);
    bx(g, .3, .55, .2, 0x2b2f35, 2.55, 2.4, .25); B.add('lt', G.sph, new T.MeshBasicMaterial({ color: 0xe8432a }), m4(2.55, 2.85, .37, .14, .14, .06)); B.add('lt2', G.sph, new T.MeshBasicMaterial({ color: 0x2cbf5d }), m4(2.55, 2.6, .37, .14, .14, .06));
    for (const s of [-1, 1]) B.add('yl', G.box, mat(0xf2c418), m4(s * 1.9, .175, 9, .14, .02, 16));
    B.add('bol', G.cyl, mat(0xf2c418), m4(-2.6, .2 + .55, 1.4, .22, 1.1, .22)); B.add('bol', G.cyl, mat(0xf2c418), m4(2.6, .2 + .55, 1.4, .22, 1.1, .22));
    B.flush();
    hit(g, 4.6, 3.6, 1.2, 2.2, { t: 'dock', id: it.id }, it);
  }
  function buildWall(it) {
    const g = itemGroup(it), h = it.h || 2;
    mesh(G.box, panelMat(it.len), 0, .5 + h / 2, 0, g, { s: [it.len, h, .25] });
    bx(g, it.len + .02, .16, .3, 0xf47b20, 0, .5 + h, 0, { ns: 1 });
    hit(g, it.len, h, .6, .5 + h / 2, { t: 'wall', id: it.id }, it);
  }
  function buildBelt(it) {
    const g = itemGroup(it), len = it.len, B = new Batch(g);
    B.add('bf', G.box, mat(0x9aa1a9), m4(0, 1.2, -.78, len, .22, .1)); B.add('bf', G.box, mat(0x9aa1a9), m4(0, 1.2, .78, len, .22, .1));
    B.add('bb', G.box, mat(0x2b2f35), m4(0, 1.18, 0, len - .1, .08, 1.45));
    for (let x = -len / 2 + .3; x < len / 2; x += .45) B.add('rl', G.cyl, mat(0xc5cad1), m4(x, 1.26, 0, .1, 1.45, .1, 0, Math.PI / 2));
    for (let x = -len / 2 + .5; x < len / 2; x += 3) for (const s of [-1, 1]) { B.add('lg', G.box, mat(0x7d848d), m4(x, .5 + .35, s * .7, .08, .7, .08)); }
    B.add('mot', G.box, mat(0x2f6db4), m4(len / 2 - .6, .85, -1.05, .7, .5, .5)); B.add('es', G.cyl, new T.MeshBasicMaterial({ color: 0xe0322a }), m4(len / 2 - 1.5, 1.4, .86, .14, .1, .14));
    B.flush();
    const nb = clamp(Math.round(len / 3.2) + Math.min(10, D.ddtM.length), 6, 40), im = new T.InstancedMesh(G.box, M.carton, nb); im.castShadow = true; g.add(im);
    const cols = []; for (let i = 0; i < nb; i++) im.setColorAt(i, new T.Color(mixC(0xffffff, PAL[i % 4], .4)));
    movers.push({ t: 'belt', im, n: nb, len, sp: .045 + 1.8 / len });
    // portale di controllo (se il nastro passa nella zona controllo)
    const cq = L.items.find(z => z.t === 'zone' && z.k === 'cq'), wp = new T.Vector3();
    if (cq) { for (let x = -len / 2 + 1; x < len / 2 - 1; x += .5) { wp.set(x, 0, 0); g.updateMatrixWorld(); g.localToWorld(wp); const b2 = box2(cq); if (wp.x > b2.x0 + 2 && wp.x < b2.x1 - 2 && wp.z > b2.z0 && wp.z < b2.z1) { bx(g, .3, 2.4, .3, 0xfafafa, x, .5, -1); bx(g, .3, 2.4, .3, 0xfafafa, x, .5, 1); bx(g, 1.1, .7, 2.4, 0x2cbf5d, x, 2.9, 0); break; } } }
    // braccio pallettizzatore in fondo
    const arm = new T.Group(); arm.position.set(len / 2 + 1.3, .5, 0); g.add(arm); mesh(G.cyl, mat(0xe0e2e5), 0, .4, 0, arm, { s: [1.7, .8, 1.7] });
    const a1 = new T.Group(); a1.position.y = .8; arm.add(a1); mesh(G.box, mat(0xf47b20), 0, 1.4, 0, a1, { s: [.5, 2.8, .5], rz: .35 }); mesh(G.box, mat(0xf47b20), -1.3, 2.7, 0, a1, { s: [2.2, .42, .42] });
    movers.push({ o: a1, t: 'spin', sp: .6 });
    hit(g, len + 3, 1.6, 2, 1, { t: 'belt', id: it.id }, it);
  }
  function buildDesk(it) {
    const g = itemGroup(it);
    bx(g, 3.2, .06, 1.4, 0xfafafa, 0, 1.4, 0); for (const sx of [-1.5, 1.5]) for (const sz of [-.6, .6]) bx(g, .06, .9, .06, 0x8e959e, sx, .5, sz);
    bx(g, 3.1, .04, 1.3, 0xd8dbe0, 0, .75, 0, { ns: 1 });
    bx(g, .6, .38, .04, 0x1d2025, -.9, 1.7, -.45); bx(g, .06, .25, .06, 0x2b2f35, -.9, 1.46, -.45);
    bx(g, .35, .25, .3, 0xeeeeec, .9, 1.46, -.35); bx(g, .45, .3, .4, 0xe3b073, .25, 1.46, .1); bx(g, .4, .26, .36, 0xa9c98a, .3, 1.76, .1);
    mesh(G.cyl, mat(0xf47b20), -.2, 1.5, .3, g, { s: [.16, .08, .16] });
    const p = person(g, 0, 1.1, 0x39a85a); p.rotation.y = Math.PI; movers.push({ o: p, t: 'bob', ph: it.x });
    hit(g, 3.4, 2, 2.6, 1, { t: 'desk', id: it.id }, it);
  }
  function person(p, x, z, vest, helmet) {
    const g = new T.Group(); g.position.set(x, .5, z);
    const add = (w, h, d, c, y, xx, zz) => { const m = mesh(G.box, mat(c), xx || 0, y, zz || 0, g, { s: [w, h, d] }); return m; };
    add(.2, .82, .26, 0x2b3440, .41, -.13); add(.2, .82, .26, 0x2b3440, .41, .13);
    add(.24, .08, .32, 0x1b1d20, .04, -.13, .04); add(.24, .08, .32, 0x1b1d20, .04, .13, .04);
    add(.6, .72, .36, 0xf4f4f2, 1.18); add(.62, .5, .38, vest || 0x39a85a, 1.2); add(.63, .06, .39, 0xe8eef0, 1.12);
    add(.14, .62, .16, 0xf4f4f2, 1.14, -.39); add(.14, .62, .16, 0xf4f4f2, 1.14, .39);
    mesh(G.sph, mat(0xe9c4a0), 0, 1.78, 0, g, { s: [.46, .48, .46] });
    mesh(G.sph, mat(helmet || 0xf5f5f2), 0, 1.86, 0, g, { s: [.52, .34, .52] });
    g.traverse(o => { if (o.isMesh) o.castShadow = true; }); p.add(g); return g;
  }
  function forklift(p, x, z) {
    const g = new T.Group(); g.position.set(x, .5, z);
    const b = (w, h, d, c, xx, y, zz) => mesh(G.box, mat(c), xx, y, zz, g, { s: [w, h, d] });
    b(1.25, .75, 1.9, 0xf47b20, 0, .6, -.15); b(1.2, .55, .5, 0x2b2f35, 0, .55, -1.05);
    for (const s of [-1, 1]) { b(.07, 1.3, .07, 0x2b2f35, s * .55, 1.6, -.8); b(.07, 1.3, .07, 0x2b2f35, s * .55, 1.6, .45); }
    b(1.2, .06, 1.35, 0x2b2f35, 0, 2.27, -.18);
    for (const s of [-1, 1]) b(.12, 2.6, .12, 0x3a3f46, s * .38, 1.5, .95);
    b(.9, .08, .1, 0x3a3f46, 0, .5, 1.02); for (const s of [-1, 1]) b(.12, .05, 1.15, 0x3a3f46, s * .28, .28, 1.6);
    b(.9, .55, 1.05, 0xe9a25c, 0, .6, 1.6);
    for (const [wx, wz] of [[-.62, .6], [.62, .6], [-.62, -.8], [.62, -.8]]) mesh(G.cyl, mat(0x1d1f22), wx, .32, wz, g, { s: [.62, .22, .62], rz: Math.PI / 2 });
    person(g, 0, -.35, 0xf47b20, 0xf2c418).position.y = .65;
    g.traverse(o => { if (o.isMesh) o.castShadow = true; }); p.add(g); return g;
  }
  function truck(p, d, x, z, ry) {
    const g = new T.Group(); g.position.set(x, .1, z); g.rotation.y = ry || 0;
    const b = (w, h, dd, c, xx, y, zz) => mesh(G.box, typeof c === 'object' ? c : mat(c), xx, y, zz, g, { s: [w, h, dd] });
    b(13.4, 3.7, 2.55, 0xfbfbfa, -2.3, 2.55, 0); b(13.45, .5, 2.6, 0xf47b20, -2.3, .95, 0); b(13.4, .1, 2.56, 0xe1e2e4, -2.3, 4.45, 0);
    b(.08, 3.6, 2.5, 0xe3e5e8, -9.02, 2.55, 0); b(.1, 3.6, .06, 0x9aa0a8, -9.04, 2.55, 0);
    const lg = planeT(textTex([[C.orgName().toUpperCase().slice(0, 22), 58, 800]], { color: '#2b2f35', w: 768, h: 128 }), 6.5, 1.1, g, -2.3, 3, 1.285); const lg2 = lg.clone(); lg2.position.z = -1.285; lg2.rotation.y = Math.PI; g.add(lg2);
    b(2.5, 2.9, 2.5, 0xffffff, 5.9, 2.25, 0); b(.08, 1.1, 2.2, 0x2b3440, 7.17, 3.05, 0); b(.6, 1.2, 2.3, 0xffffff, 6.9, 1.4, 0); b(.05, .5, 1.6, 0x2b2f35, 7.235, 1.3, 0);
    b(2.52, .45, 2.52, 0xf47b20, 5.9, 1.25, 0); for (const s of [-1, 1]) { b(.1, .55, .12, 0x1d1f22, 6.9, 3, s * 1.42); b(.5, .1, .7, 0x2b2f35, 4.6, .9, s * 1.1); }
    b(2.2, .25, 2.2, 0x2b2f35, 4.2, .9, 0);
    [[-8, 1.05], [-6.9, 1.05], [-5.8, 1.05], [5.9, 1.05], [3.9, 1.05]].forEach(([wx, wz]) => { for (const s of [-1, 1]) { mesh(G.cyl, mat(0x1d1f22), wx, .58, s * wz, g, { s: [1.1, .38, 1.1], rx: Math.PI / 2 }); mesh(G.cyl, mat(0xc5cad1), wx, .58, s * (wz + .2), g, { s: [.5, .02, .5], rx: Math.PI / 2, ns: 1 }); } });
    const t = { g, d, road: 0 }; g.traverse(o => { if (o.isMesh) { o.userData.k = { t: 'truck', i: trucks.length }; pick.push(o); } }); p.add(g); trucks.push(t); return t;
  }
  function buildRoadTrucks() {
    const docks = L.items.filter(i => i.t === 'dock'), recent = D.ddt.slice(0, 9);
    docks.slice(0, Math.min(docks.length, 4)).forEach((dk, i) => { const g = WH.children.find(c => c.userData.eid === dk.id); if (!g) return; const t = truck(g, recent[i] || null, 0, 9.35, -Math.PI / 2); t.dock = dk.id; });
    const rz = L.D / 2 + 31;
    recent.slice(4, 7).forEach((d, i) => { const t = truck(WH, d, -120 + i * 95, rz - 2.5, 0); t.road = 1; movers.push({ o: t.g, t: 'road', sp: 7 + i, dir: 1 }); });
    D.trf.slice(0, 2).forEach((x, i) => { const t = truck(WH, { trf: x }, 80 - i * 110, rz + 2.5, Math.PI); t.road = 1; movers.push({ o: t.g, t: 'road', sp: 6 + i, dir: -1 }); });
  }
  function buildPeople() {
    const wp = new T.Vector3();
    // carrelli elevatori lungo i corridoi degli scaffali portapallet
    L.items.filter(i => i.t === 'rack' && i.k === 'pallet').slice(0, 4).forEach((it, k) => {
      if (k % 2) return; const g = WH.children.find(c => c.userData.eid === it.id); if (!g) return; g.updateMatrixWorld();
      const len = rackLen(it), dep = rackDep(it), a = g.localToWorld(new T.Vector3(-len / 2 + 1, 0, dep / 2 + 1.6)), b = g.localToWorld(new T.Vector3(len / 2 - 1, 0, dep / 2 + 1.6));
      const f = forklift(WH, a.x, a.z); movers.push({ o: f, t: 'path', a, b, sp: .18 + k * .03, ph: k * 1.3 });
    });
    // operatori che camminano nelle zone
    L.items.filter(i => i.t === 'zone' && ['ric', 'pre', 'spe', 'cq'].includes(i.k)).forEach((z, k) => {
      const b2 = box2(z), n = z.k === 'ric' || z.k === 'spe' ? 2 : 1;
      for (let j = 0; j < n; j++) { const a = new T.Vector3(b2.x0 + 1.5 + rr() * (b2.x1 - b2.x0 - 3), 0, b2.z0 + 1.5 + rr() * (b2.z1 - b2.z0 - 3)), b = new T.Vector3(b2.x0 + 1.5 + rr() * (b2.x1 - b2.x0 - 3), 0, b2.z0 + 1.5 + rr() * (b2.z1 - b2.z0 - 3)); const p = person(WH, a.x, a.z, (k + j) % 2 ? 0xf47b20 : 0x39a85a); movers.push({ o: p, t: 'walk', a, b, sp: .05 + rr() * .04, ph: rr() * 6 }); }
      if (z.k === 'ric') { const c2 = new T.Vector3((b2.x0 + b2.x1) / 2, 0, (b2.z0 + b2.z1) / 2), f = forklift(WH, c2.x, c2.z); movers.push({ o: f, t: 'loop', cx: c2.x, cz: c2.z, rx: (b2.x1 - b2.x0) * .3, rz: (b2.z1 - b2.z0) * .3, sp: .25, ph: 0 }); }
    });
  }

  /* ---------------- etichette arancioni ---------------- */
  function zoneTarget(k) {
    if (k === 'all') return { x: 4, z: 8, dist: Math.max(L.W, L.D) * 3.05, az: -0.3, pol: .9 };
    if (k === 'uffe') return { x: L.W / 4, z: L.D / 2 + 13, dist: 100, az: -0.45, pol: .95 };
    if (k === 'flotta') { if (!D.gas) return null; const F = FL(); return { x: F.cx, z: 2, dist: 118, az: -1.05, pol: .88 }; }
    if (k === 'stk') { const R2 = L.items.filter(i => i.t === 'rack'); if (!R2.length) return null; const bb = R2.map(box2).reduce((a, b) => ({ x0: Math.min(a.x0, b.x0), x1: Math.max(a.x1, b.x1), z0: Math.min(a.z0, b.z0), z1: Math.max(a.z1, b.z1) })); return { x: (bb.x0 + bb.x1) / 2, z: (bb.z0 + bb.z1) / 2 + 2, dist: Math.max(bb.x1 - bb.x0, bb.z1 - bb.z0) * 1.9 + 20, az: -0.5, pol: .88 }; }
    const z = L.items.find(i => i.t === 'zone' && i.k === k); if (!z) return null; const f = foot(z);
    return { x: z.x + (k === 'spe' ? 10 : 0), z: z.z, dist: Math.max(f.w, f.d) * 1.6 + 26, az: k === 'spe' ? .6 : -0.6, pol: .92 };
  }
  const zoneKinds = () => ['all', ...['ric', 'stk', 'pre', 'cq', 'spe', 'flotta'].filter(k => zoneTarget(k)), 'uffe'];
  const ZN = k => k === 'all' ? ['Panoramica', 'ALL'] : k === 'uffe' ? ['Uffici', 'UFF'] : k === 'flotta' ? ['Parco mezzi e gasolio', 'MEZ'] : [ZONE[k][0], ZONE[k][2]];
  function buildLabels() {
    const box = $('.m3-lbs'); box.innerHTML = ''; labels = [];
    const add = (pos, html2, cls, k, maxD, obj) => { const el = document.createElement('div'); el.className = 'm3-lb ' + (cls || ''); el.innerHTML = html2; box.appendChild(el); const L2 = { p: new T.Vector3(...pos), el, k, maxD: maxD || 1e9, obj }; el.onclick = () => { if (!EDIT) select(k); }; labels.push(L2); return L2; };
    const R2 = L.items.filter(i => i.t === 'rack'), nv = R2.reduce((s, r) => s + r.bays * r.lv, 0), used = P.byArt.size;
    const st = zoneTarget('stk'); if (st) add([st.x, 9, st.z - 2], `Scaffalature <em>${R2.length} scaffali · ${N(used)}/${N(nv)} ubicazioni</em>`, '', { t: 'zone', z: 'stk' }, 1e9);
    const sub = { ric: `${D.car30.length} carichi in 30 gg`, pre: `${D.ddtM.length} DDT nel mese`, cq: `${D.ret90.length} rettifiche`, spe: `${trucks.filter(t => !t.road && t.d).length} in banchina`, terra: 'stoccaggio a terra', uff: 'ufficio', free: '' };
    L.items.filter(i => i.t === 'zone').forEach(z => add([z.x, 4.5, z.z], `${esc(z.name || ZONE[z.k][0])}${sub[z.k] ? ` <em>${sub[z.k]}</em>` : ''}`, '', { t: 'zone', z: z.k, id: z.id }, 340));
    add([L.W / 4, 8.6, L.D / 2 + 13], `Uffici <em>${D.cli.length} clienti</em>`, 'wh', { t: 'zone', z: 'uffe' }, 240);
    if (D.gas) { const F = FL(); add([F.cx, 3, (F.z0 + F.st.z) / 2 - 4], `Parco mezzi <em>${D.gas.V.length} mezzi · ${N(Math.round(D.gas.lM))} L nel mese</em>`, '', { t: 'zone', z: 'flotta' }, 340); add([F.st.x, 6.6, F.st.z], `Distributore <em>${D.gas.price ? D.gas.price.toFixed(3).replace('.', ',') + ' €/L' : 'gasolio'}</em>`, '', { t: 'fuel' }, 260);
      fleetVeh.forEach(f => { const L3 = add([0, 0, 0], `${esc(plFmt(f.v.p))}${f.v.name ? ` <em>${esc(f.v.name.slice(0, 18))}</em>` : ''}`, 'sm wh', { t: 'veh', p: f.v.p }, 95, f.o); L3.dy = f.v.kind === 'truck' ? 4.2 : 3.2; }); }
    R2.forEach(it => { const g = WH.children.find(c => c.userData.eid === it.id); const c = D.catOf.get(it.cat), n = [...P.byArt.values()].filter(v => v.rk === it).length, pz = c ? 0 : 0;
      const pos = g ? [it.x, (it.k === 'pallet' ? (it.lv - 1) * rackLh(it) + 2.6 : it.lv * rackLh(it) + 1.2) + 1.2, it.z] : [it.x, 6, it.z];
      add(pos, `${esc(it.code)} · ${esc((it.cat || KIND[it.k].n).slice(0, 22))} <em>${n}/${it.bays * it.lv} vani</em>`, 'sm', { t: 'rack', id: it.id }, 120); });
    trucks.forEach((t, i) => { if (!t.d) return; add([0, 0, 0], t.d.trf ? 'Trasferimento <em>in viaggio</em>' : `DDT ${esc(C.dnum(t.d.d))} <em>${esc(t.d.cliN.slice(0, 18))}</em>`, 'sm wh', { t: 'truck', i }, t.road ? 150 : 120, t.g); });
  }
  const V3 = () => (V3.v || (V3.v = new T.Vector3()));
  function updLabels() {
    const w = R.domElement.clientWidth, h = R.domElement.clientHeight, v = V3();
    labels.forEach(L2 => {
      if (L2.obj) { L2.obj.getWorldPosition(v); v.y += L2.dy || 5.6; } else v.copy(L2.p);
      const d = cam.position.distanceTo(v); v.project(cam);
      const on = v.z < 1 && d < L2.maxD && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
      const act = sel && L2.k.t === sel.t && L2.k.z === sel.z && L2.k.id === sel.id && L2.k.i === sel.i && L2.k.p === sel.p;
      const quiet = (sel && sel.t === 'rack' && L2.k.t === 'rack' && !act) || (EDIT && L2.k.t !== 'rack');
      L2.el.classList.toggle('hid', (!on && !act) || quiet);
      L2.el.style.transform = `translate(${((v.x + 1) / 2 * w).toFixed(1)}px,${((1 - v.y) / 2 * h).toFixed(1)}px) translate(-50%,-100%)`;
      L2.el.style.zIndex = act ? 3 : (L2.el.classList.contains('sm') ? 1 : 2);
    });
  }

  /* ---------------- camera ---------------- */
  function applyCam() {
    const sp = Math.sin(CAM.pol), cp = Math.cos(CAM.pol);
    cam.position.set(CAM.tx + CAM.dist * sp * Math.sin(CAM.az), CAM.ty + CAM.dist * cp, CAM.tz + CAM.dist * sp * Math.cos(CAM.az));
    cam.lookAt(CAM.tx, CAM.ty, CAM.tz);
  }
  let FA = null;
  function fly(o) {
    Object.assign(GOAL, { ty: 0 }, o); const to = { ...GOAL }, d = Math.hypot(to.tx - CAM.tx, to.tz - CAM.tz), dz = Math.abs(Math.log(Math.max(1, to.dist) / Math.max(1, CAM.dist)));
    let da = to.az - CAM.az; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    FA = { from: { ...CAM }, to, da, t: 0, dur: clamp(.85 + d / 140 + dz * .3 + Math.abs(da) * .15, .85, 2.3), arc: clamp(d * .22, 0, 45) * (to.dist < 40 || CAM.dist < 40 ? 1 : .4) };
  }
  const flyStop = () => { if (FA) { FA = null; Object.assign(GOAL, CAM); } };
  function flyT(t) { if (t) fly({ tx: t.x, tz: t.z, dist: t.dist, az: t.az, pol: t.pol }); }
  function stepCam(dt) {
    if (FA) { FA.t = Math.min(1, FA.t + dt / FA.dur); const u = ease(FA.t), f = FA.from, t2 = FA.to;
      CAM.tx = f.tx + (t2.tx - f.tx) * u; CAM.tz = f.tz + (t2.tz - f.tz) * u; CAM.ty = (f.ty || 0) + ((t2.ty || 0) - (f.ty || 0)) * u; CAM.az = f.az + FA.da * u; CAM.pol = f.pol + (t2.pol - f.pol) * u;
      CAM.dist = Math.exp(Math.log(f.dist) + (Math.log(t2.dist) - Math.log(f.dist)) * u) + FA.arc * Math.sin(Math.PI * FA.t);
      if (FA.t >= 1) { FA = null; Object.assign(CAM, { tx: t2.tx, tz: t2.tz, ty: t2.ty || 0, az: t2.az, pol: t2.pol, dist: t2.dist }); }
      applyCam(); return; }
    const k = 1 - Math.exp(-dt * 3.2);
    let da = GOAL.az - CAM.az; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    CAM.az += da * k; CAM.tx += (GOAL.tx - CAM.tx) * k; CAM.ty += ((GOAL.ty || 0) - CAM.ty) * k; CAM.tz += (GOAL.tz - CAM.tz) * k; CAM.dist += (GOAL.dist - CAM.dist) * k; CAM.pol += (GOAL.pol - CAM.pol) * k;
    applyCam();
  }
  const rackG = id => WH && WH.children.find(c => c.userData.eid === id);
  function rackView(it, cell) {
    const g = rackG(it.id); if (!g) return; g.updateMatrixWorld();
    const th = it.r * Math.PI / 2, len = rackLen(it);
    if (cell) { const c = cell.clone(); c.y += .75; c.z += it.k === 'pallet' ? .55 : .25; const p = g.localToWorld(c); fly({ tx: p.x, ty: p.y, tz: p.z, dist: it.k === 'pallet' ? 8 : 5.5, az: th - 1.15, pol: 1.2 }); }
    else { const p = g.localToWorld(new T.Vector3(0, 0, rackDep(it) / 2 + 1.7)); fly({ tx: p.x, ty: 2.4, tz: p.z, dist: Math.max(20, len * .95), az: th - .55, pol: 1.02 }); }
  }
  function cellLocal(it, b, l) { const bw = it.bw || KIND[it.k].bw, len = rackLen(it), lh = rackLh(it), pal = it.k === 'pallet'; const y = pal ? (l === 0 ? .5 : .6 + l * lh) : .6 + l * lh; return new T.Vector3(-len / 2 + b * bw + bw / 2, y, 0); }
  function highlightCell(it, b, l) { return focusCell(it, b, l, null, { pull: false, co: false }); }
  function highlightCellOld(it, b, l) {
    const g = rackG(it.id); if (!g || !hiMesh) return; g.updateMatrixWorld();
    const bw = it.bw || KIND[it.k].bw, lh = rackLh(it), c = cellLocal(it, b, l); c.y += (it.k === 'pallet' ? Math.min(lh, 1.6) : lh) / 2;
    const p = g.localToWorld(c); hiMesh.position.copy(p); hiMesh.rotation.y = it.r * Math.PI / 2; hiMesh.scale.set(bw - .1, (it.k === 'pallet' ? Math.min(lh, 1.6) : lh) - .1, rackDep(it) + .2); hiMesh.visible = true;
  }


  /* ---------------- parco mezzi e distributore di gasolio (v273) ---------------- */
  const plFmt = p => C.plateFmt ? C.plateFmt(p) : p;
  const kindOf = s => /camion|tir\b|motrice|daily|eurocargo|autocarro|cassonat|truck|scania|volvo|\bman\b|iveco|actros|stralis/i.test(s) ? 'truck' : /pick.?up|hilux|ranger|l200|navara|d-max|amarok|fullback/i.test(s) ? 'pickup' : /\bauto\b|panda|punto|golf|yaris|clio|fiesta|polo|\b500\b|smart|ypsilon|berlina|tipo|qashqai|captur|duster/i.test(s) ? 'car' : 'van';
  function gasData() {
    if (!C.gasOn || !C.gasOn()) return null;
    const rows = C.gas() || [], Pl = C.plate, M2 = C.gasMezzi() || {}, Nm = C.gasNomi() || {}, Rt = C.gasRent() || {}, price = C.num(C.gasPrice()), mul = C.gMul ? C.gMul() : 1;
    const m0 = C.today().slice(0, 7), keys = []; { const d = new Date(m0 + '-15'); for (let i = 5; i >= 0; i--) { const x = new Date(d); x.setMonth(x.getMonth() - i); keys.push(x.toISOString().slice(0, 7)); } }
    const pr = r => C.num(r.prezzo) || price;
    const by = new Map(); rows.forEach(r => { const p = Pl(r.targa); if (!p) return; if (!by.has(p)) by.set(p, []); by.get(p).push(r); });
    const reg = new Set([...Object.keys(M2), ...Object.keys(Rt), ...Object.keys(Nm)].map(Pl).filter(Boolean));
    const V = [...new Set([...reg, ...by.keys()])].map(p => {
      const s = (by.get(p) || []).slice().sort((a, b) => String(a.data).localeCompare(String(b.data)) || C.num(a.km) - C.num(b.km));
      let km = 0, kl = 0, prev = 0; s.forEach(r => { const k = C.num(r.km); if (!k) return; if (prev && k > prev && k - prev < 5000) { km += k - prev; kl += C.num(r.litri); } prev = k; });
      const mm = s.filter(r => String(r.data).slice(0, 7) === m0), cnt = {}; s.forEach(r => { const u = String(r.uso || '').trim().toUpperCase(); if (u) cnt[u] = (cnt[u] || 0) + 1; });
      const uso = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0] || '', owner = s.map(r => String(r.proprietario || '').trim()).filter(Boolean).pop() || '';
      const name = String(Nm[p] || Nm[Object.keys(Nm).find(k => Pl(k) === p)] || '').trim(), rentK = Object.keys(Rt).find(k => Pl(k) === p), mz = M2[p] || M2[Object.keys(M2).find(k => Pl(k) === p)] || {};
      const sum = L2 => L2.reduce((a, r) => a + C.num(r.litri), 0);
      return { p, s, name, reg: reg.has(p), rent: rentK ? C.num(Rt[rentK]) : 0, drv: C.gasDrv ? C.gasDrv(p) : [], centro: mz.centro || '', uso, owner, km, cons: kl ? km / kl : 0, odo: Math.max(0, ...s.map(r => C.num(r.km))), last: s[s.length - 1] || null,
        lM: sum(mm), cM: mm.reduce((a, r) => a + C.num(r.litri) * pr(r), 0) * mul, nM: mm.length, lT: sum(s), cT: s.reduce((a, r) => a + C.num(r.litri) * pr(r), 0) * mul, m6: keys.map(k => sum(s.filter(r => String(r.data).slice(0, 7) === k))), kind: kindOf(name + ' ' + uso + ' ' + owner) };
    }).sort((a, b) => (b.reg - a.reg) || b.lT - a.lT).slice(0, 20);
    const rM = rows.filter(r => String(r.data).slice(0, 7) === m0), lM = rM.reduce((a, r) => a + C.num(r.litri), 0);
    let km = 0, kl = 0; V.forEach(v => { if (v.cons) { km += v.km; kl += v.km / v.cons; } });
    const lastR = rows.slice().sort((a, b) => String(b.data).localeCompare(String(a.data)) || C.num(b.km) - C.num(a.km));
    return { V, price, mul, lM, cM: rM.reduce((a, r) => a + C.num(r.litri) * pr(r), 0) * mul, nM: rM.length, cons: kl ? km / kl : 0, rent: V.reduce((a, v) => a + v.rent, 0), lastR, keys, nAll: rows.length };
  }
  const FL = () => { const hw = L.W / 2, hd = L.D / 2; return { x0: -hw - 36, x1: -hw - 5, z0: -hd - 4, z1: hd + 4, cx: -hw - 20.5, st: { x: -hw - 20.5, z: hd - 5.5 } }; };
  function plateTex(p) {
    return cvTex(256, 56, g => { g.fillStyle = '#fbfbf8'; g.beginPath(); g.roundRect(1, 1, 254, 54, 8); g.fill(); g.strokeStyle = '#2b2f35'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#1f4fb4'; g.beginPath(); g.roundRect(2, 2, 34, 52, [7, 0, 0, 7]); g.fill(); g.fillStyle = '#f5c518'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.beginPath(); g.arc(19 + Math.cos(a) * 8, 18 + Math.sin(a) * 8, 1.4, 0, 7); g.fill(); } g.fillStyle = '#fff'; g.font = '700 17px Inter, system-ui'; g.textAlign = 'center'; g.fillText('I', 19, 45); g.fillStyle = '#16181b'; g.font = '700 36px Inter, system-ui, sans-serif'; g.textBaseline = 'middle'; g.fillText(plFmt(p), 146, 30); });
  }
  // sagome dei mezzi: profilo laterale estruso con spigoli arrotondati (geometrie condivise)
  function vgeo(key, pts, depth, bev) {
    if (G[key]) return G[key];
    const sh = new T.Shape(); pts.forEach(([x, y], i) => i ? sh.lineTo(x, y) : sh.moveTo(x, y)); sh.closePath();
    const g = new T.ExtrudeGeometry(sh, { depth, bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 4 });
    g.translate(0, 0, -depth / 2); g.computeVertexNormals(); return (G[key] = g);
  }
  const VP = {
    van: { w: 1.9, body: [[-2.7, .36], [2.5, .36], [2.68, .52], [2.72, 1.02], [2.36, 1.26], [1.56, 2.26], [1.25, 2.44], [-2.58, 2.44], [-2.7, 2.32]], ws: [[2.33, 1.3], [1.58, 2.24]], side: [[.62, 1.5], [2.1, 1.5], [1.55, 2.18], [.62, 2.18]], rw: [[-2.72, 1.5], [-2.72, 2.2]], wh: [[1.62, .37], [-1.72, .37]], plateF: [2.75, .62], plateR: [-2.74, .7], hl: [2.7, .92], tl: [-2.71, 1.1], liv: [-.6, 3.6, .95] },
    car: { w: 1.66, body: [[-2.15, .3], [2.08, .3], [2.2, .48], [2.18, .76], [1.02, .96], [.32, 1.42], [-.9, 1.47], [-1.82, 1.06], [-2.15, .96], [-2.2, .5]], ws: [[1.0, .98], [.34, 1.4]], side: [[-1.66, 1.0], [.92, 1.0], [.36, 1.36], [-.86, 1.41]], rw: [[-1.8, 1.07], [-.98, 1.43]], wh: [[1.32, .33], [-1.36, .33]], plateF: [2.21, .5], plateR: [-2.21, .62], hl: [2.16, .7], tl: [-2.17, .82], liv: [0, 3.4, .55] },
    pickup: { w: 1.76, body: [[-2.6, .42], [2.45, .42], [2.6, .6], [2.6, 1.02], [1.5, 1.16], [.98, 1.82], [-.4, 1.86], [-.5, 1.18], [-2.6, 1.18]], ws: [[1.48, 1.18], [1.0, 1.8]], side: [[-.35, 1.24], [1.36, 1.24], [.96, 1.74], [-.35, 1.78]], rw: null, wh: [[1.62, .41], [-1.62, .41]], plateF: [2.63, .62], plateR: [-2.63, .8], hl: [2.58, .92], tl: [-2.61, 1.0], liv: [-.2, 4.4, .72] },
    cab: { w: 2.25, body: [[-1.0, .55], [.98, .55], [1.06, .8], [1.06, 2.75], [.9, 3.15], [-1.0, 3.15]], ws: [[1.07, 1.85], [.97, 2.95]], side: [[-.35, 1.85], [.85, 1.85], [.85, 2.85], [-.35, 2.85]], rw: null, wh: [], plateF: [1.1, .72], plateR: null, hl: [1.08, 1.0], tl: null, liv: null }
  };
  function vehicle(p2, v, x, z, ry) {
    const g = new T.Group(); g.position.set(x, .17, z); g.rotation.y = ry || 0; p2.add(g);
    const b = (w, h, d, c, xx, y, zz, o) => mesh(G.box, typeof c === 'object' ? c : mat(c), xx, y, zz, g, { s: [w, h, d], ...(o || {}) });
    const glass = M.glass || (M.glass = new T.MeshLambertMaterial({ color: 0x2c3e55 })), dark = 0x22262b;
    const pt = plateTex(v.p); OWN.push(pt); const pm = new T.MeshBasicMaterial({ map: pt }); OWN.push(pm);
    const plateAt = (xx, y, rot, zz) => { const m = new T.Mesh(G.plane, pm); m.scale.set(.52, .115, 1); m.position.set(xx, y, zz || 0); m.rotation.y = rot; g.add(m); };
    const wheel = (xx, zz, r) => { const s = Math.sign(zz); mesh(G.cyl, mat(0x15171a), xx, r, zz, g, { s: [r * 2, .27, r * 2], rx: Math.PI / 2 }); mesh(G.cyl, mat(0xbfc4cb), xx, r, zz + s * .14, g, { s: [r * 1.2, .02, r * 1.2], rx: Math.PI / 2, ns: 1 }); mesh(G.cyl, mat(0x7d838b), xx, r, zz + s * .155, g, { s: [r * .42, .02, r * .42], rx: Math.PI / 2, ns: 1 }); };
    const shell = (kind, color, P, ox) => {
      const w = P.w, bev = kind === 'cab' ? .07 : .09, xs = P.body.map(q => q[0]), fx = Math.max(...xs) + bev + .015, rx2 = Math.min(...xs) - bev - .015; P.fx = fx; P.rx = rx2; const body = mesh(vgeo('vb_' + kind, P.body, w - 2 * bev, bev), mat(color), ox || 0, 0, 0, g);
      mesh(vgeo('vg_' + kind, P.side, w + .06, 0), glass, ox || 0, 0, 0, g, { ns: 1 });
      const wsl = (a, c) => { const dx = c[0] - a[0], dy = c[1] - a[1], ln = Math.hypot(dx, dy), nx = dy / ln, ny = -dx / ln, sgn = kind === 'cab' ? 1 : 1; const m = mesh(G.box, glass, (ox || 0) + (a[0] + c[0]) / 2 + nx * .115 * sgn, (a[1] + c[1]) / 2 + ny * .115 * sgn, 0, g, { s: [ln, .035, w - .16], rz: Math.atan2(dy, dx), ns: 1 }); return m; };
      wsl(P.ws[0], P.ws[1]); if (P.rw) wsl(P.rw[1], P.rw[0]);
      P.wh.forEach(([wx, r]) => { for (const s of [-1, 1]) mesh(G.cyl, mat(0x111316), (ox || 0) + wx, r + .02, s * (w / 2 + .008), g, { s: [r * 2 + .2, .01, r * 2 + .2], rx: Math.PI / 2, ns: 1 }); wheel((ox || 0) + wx, w / 2 - .12, r); wheel((ox || 0) + wx, -w / 2 + .12, r); });
      for (const s of [-1, 1]) { b(.05, .13, .34, 0xfff3d1, (ox || 0) + fx, P.hl[1], s * (w / 2 - .3), { ns: 1 }); if (P.tl) b(.05, .26, .16, 0xd8322a, (ox || 0) + rx2, P.tl[1], s * (w / 2 - .14), { ns: 1 }); }
      plateAt((ox || 0) + fx + .03, P.plateF[1], Math.PI / 2); if (P.plateR) plateAt((ox || 0) + rx2 - .03, P.plateR[1], -Math.PI / 2);
      return body;
    };
    const livery = (len, xc, y, w) => { for (const s of [-1, 1]) b(len, .14, .02, 0xf47b20, xc, y, s * (w / 2 + .012), { ns: 1 }); const t = textTex([[C.orgName().toUpperCase().slice(0, 24), 54, 800]], { color: '#2b2f35', w: 768, h: 110 }); for (const s of [-1, 1]) { const m = planeT(t, Math.min(len * .8, 3.2), .45, g, xc, y + .5, s * (w / 2 + .016)); m.rotation.y = s > 0 ? 0 : Math.PI; } };
    const mirror = (xx, y, w) => { for (const s of [-1, 1]) { b(.05, .04, .22, dark, xx, y, s * (w / 2 + .1), { ns: 1 }); b(.07, .3, .12, dark, xx - .02, y - .05, s * (w / 2 + .24)); } };
    if (v.kind === 'truck') {
      const P = VP.cab, w = P.w; shell('cab', 0xfbfbfa, P, 2.85);
      b(.04, .55, w - .4, dark, 2.85 + P.fx, 1.05, 0, { ns: 1 }); for (let i = 0; i < 4; i++) b(.04, .04, w - .5, 0x4a5059, 2.85 + P.fx + .02, .85 + i * .13, 0, { ns: 1 });
      b(.4, .32, w + .02, 0x2b2f35, 2.85 + P.fx - .1, .4, 0); b(2.1, .28, w + .03, 0xf47b20, 2.85, 1.42, 0, { ns: 1 }); mirror(3.75, 2.6, w);
      b(5.7, .28, 1.1, 0x2b2f35, -.4, .42, 0); b(5.6, 3.0, 2.42, 0xf3f3f1, -1.35, 2.28, 0); b(5.62, .08, 2.44, 0xe1e3e6, -1.35, 3.82, 0, { ns: 1 });
      b(.04, 2.85, 2.36, 0xe6e8eb, -4.17, 2.28, 0, { ns: 1 }); b(.05, 2.85, .05, 0x9aa0a8, -4.2, 2.28, 0, { ns: 1 }); for (const s of [-1, 1]) b(.06, .22, .14, 0xd8322a, -4.2, .95, s * 1.05, { ns: 1 });
      livery(5.2, -1.35, 1.4, 2.42); plateAt(-4.21, .7, -Math.PI / 2);
      [[3.0, .5], [-2.3, .5], [-3.35, .5]].forEach(([wx, r]) => { for (const s of [-1, 1]) { mesh(G.cyl, mat(0x111316), wx, r + .03, s * 1.13, g, { s: [r * 2 + .22, .02, r * 2 + .22], rx: Math.PI / 2, ns: 1 }); wheel(wx, s * 1.05, r); } });
    } else if (v.kind === 'car') {
      const P = VP.car; shell('car', [0xe9ebee, 0xc8ccd2, 0x2f3540, 0x9fb3c8][v.p.charCodeAt(1) % 4], P);
      b(.04, .2, P.w - .5, dark, P.fx, .55, 0, { ns: 1 }); mirror(.85, 1.02, P.w); for (const s of [-1, 1]) b(3.6, .06, .02, 0xf47b20, 0, .66, s * (P.w / 2 + .1), { ns: 1 });
      b(.3, .14, P.w + .1, 0x2b2f35, P.fx - .1, .36, 0); b(.3, .14, P.w + .1, 0x2b2f35, P.rx + .1, .38, 0);
    } else if (v.kind === 'pickup') {
      const P = VP.pickup; shell('pickup', 0xfbfbfa, P);
      for (const s of [-1, 1]) b(2.05, .5, .06, 0xfbfbfa, -1.55, 1.18, s * (P.w / 2 - .03)); b(.06, .5, P.w, 0xfbfbfa, -2.57, 1.18, 0); b(1.9, .05, P.w - .1, 0x3a3f46, -1.55, 1.205, 0, { ns: 1 });
      b(1.4, .3, 1.0, 0xc79a68, -1.4, 1.23, 0); b(.6, .25, .5, 0x8aa36a, -2.1, 1.23, .3);
      b(.04, .32, P.w - .5, dark, P.fx, .82, 0, { ns: 1 }); mirror(1.25, 1.55, P.w); livery(3.2, .4, .66, P.w);
      b(.12, .5, .14, 0x2b2f35, -.55, 1.95, .6); b(.12, .5, .14, 0x2b2f35, -.55, 1.95, -.6); b(.12, .08, 1.3, 0x2b2f35, -.55, 2.2, 0);
      b(.3, .16, P.w + .12, 0x2b2f35, P.fx - .1, .46, 0); b(.25, .16, P.w + .12, 0x2b2f35, P.rx + .08, .5, 0);
    } else {
      const P = VP.van; shell('van', 0xfbfbfa, P);
      b(.04, .34, P.w - .5, dark, P.fx, .82, 0, { ns: 1 }); for (let i = 0; i < 3; i++) b(.04, .03, P.w - .6, 0x4a5059, P.fx + .02, .72 + i * .1, 0, { ns: 1 });
      b(.3, .18, P.w + .1, 0x2b2f35, P.fx - .1, .4, 0); b(.25, .18, P.w + .1, 0x2b2f35, P.rx + .08, .44, 0);
      b(.02, 1.85, .025, 0xc9ccd0, P.rx, 1.42, 0, { ns: 1 }); b(.04, .06, .4, 0x7d848d, P.rx - .01, 1.35, .32, { ns: 1 });
      b(1.1, .02, .01, 0xd0d3d7, -.95, 2.26, P.w / 2 + .012, { ns: 1 }); b(.02, 1.7, .01, 0xd0d3d7, -1.5, 1.4, P.w / 2 + .012, { ns: 1 }); mirror(1.62, 1.6, P.w); livery(3.4, -.65, .82, P.w);
      if (v.p.charCodeAt(0) % 2) { b(3.2, .05, .05, 0x8e959e, -.8, 2.62, .6); b(3.2, .05, .05, 0x8e959e, -.8, 2.62, -.6); for (let i = 0; i < 4; i++) b(.05, .05, 1.25, 0x8e959e, -2.2 + i * .9, 2.62, 0); }
    }
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.userData.k = { t: 'veh', p: v.p }; pick.push(o); } });
    return g;
  }
  let pumpCv = null, pumpTex = null;
  function pumpDraw(l, price) {
    if (!pumpCv) { pumpCv = document.createElement('canvas'); pumpCv.width = 192; pumpCv.height = 128; }
    const g = pumpCv.getContext('2d'); g.fillStyle = '#0f1a14'; g.fillRect(0, 0, 192, 128);
    g.fillStyle = '#5df08a'; g.font = '700 16px Inter, system-ui'; g.textAlign = 'left'; g.fillText('GASOLIO', 12, 24);
    g.font = '700 34px ui-monospace, Menlo, monospace'; g.textAlign = 'right'; g.fillText(l.toFixed(2), 180, 70); g.font = '600 13px Inter, system-ui'; g.fillText('litri', 180, 88);
    g.fillStyle = '#f5c518'; g.font = '700 18px ui-monospace, Menlo, monospace'; g.fillText(price ? price.toFixed(3) + ' €/L' : '— €/L', 180, 116);
    if (pumpTex) pumpTex.needsUpdate = true;
  }
  function buildFleet() {
    const GD = D.gas; if (!GD) return; const F = FL(), g = new T.Group(); WH.add(g);
    const w = F.x1 - F.x0, d = F.z1 - F.z0, cx = (F.x0 + F.x1) / 2, cz = (F.z0 + F.z1) / 2, B = new Batch(g);
    const asp = mesh(G.box, new T.MeshLambertMaterial({ map: TX.road }), cx, .08, cz, g, { s: [w, .16, d], ns: 1 }); OWN.push(asp.material);
    bx(g, 9, .15, L.D / 2 + 31 - 5.7 - F.z1, 0x575c64, F.st.x, 0, (F.z1 + L.D / 2 + 31 - 5.7) / 2, { ns: 1 });
    for (const xx of [F.x0, F.x1]) bx(g, .3, .22, d, 0xd9d6cf, xx, 0, cz, { ns: 1 });
    // stalli: due file di posti con strisce bianche e numeri
    const rowX = [F.x0 + 4.4, F.x1 - 4.4], sz = 3.9, z0 = F.z0 + 2.4, n = Math.max(1, Math.floor((F.st.z - 8 - z0) / sz)), slots = [];
    rowX.forEach((rx, ri) => { for (let i = 0; i <= n; i++) B.add('str', G.box, mat(0xf4f4f2), m4(rx, .17, z0 + i * sz - sz / 2, 7.6, .02, .12)); for (let i = 0; i < n; i++) { slots.push({ x: rx, z: z0 + i * sz, ry: ri ? 0 : Math.PI }); B.add('stop', G.box, mat(0xf2c418), m4(rx + (ri ? 3.3 : -3.3), .24, z0 + i * sz, .25, .14, 1.6)); } });
    slots.forEach((s, i) => floorText(g, String(i + 1).padStart(2, '0'), 1.6, s.x + (s.ry ? 2.2 : -2.2), s.z, Math.PI / 2, 'rgba(255,255,255,.75)').position.y = .18);
    // linea di mezzeria della corsia
    for (let zz = z0; zz < F.st.z - 9; zz += 3) B.add('lm', G.box, mat(0xf4f4f2), m4(cx, .17, zz, .14, .02, 1.6));
    // distributore: pensilina, isole, colonnine, totem prezzo, cisterna
    const st = F.st, cw = 12, cd = 9.5;
    for (const sx of [-1, 1]) for (const sz2 of [-1, 1]) mesh(G.cyl, mat(0xd7dadf), st.x + sx * (cw / 2 - 1.2), 2.75, st.z + sz2 * (cd / 2 - 1.5), g, { s: [.42, 5.2, .42] });
    bx(g, cw, .55, cd, 0xfbfbfa, st.x, 5.2, st.z); bx(g, cw + .1, .42, .12, 0xf47b20, st.x, 5.25, st.z + cd / 2); bx(g, cw + .1, .42, .12, 0xf47b20, st.x, 5.25, st.z - cd / 2); bx(g, .12, .42, cd, 0xf47b20, st.x - cw / 2, 5.25, st.z); bx(g, .12, .42, cd, 0xf47b20, st.x + cw / 2, 5.25, st.z);
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j += 2) { const m2 = new T.MeshBasicMaterial({ color: 0xfffbe6 }); OWN.push(m2); const lp = new T.Mesh(G.plane, m2); lp.scale.set(1.6, .5, 1); lp.rotation.x = Math.PI / 2; lp.position.set(st.x + i * 3.6, 5.16, st.z + j * 2.2); g.add(lp); }
    const sg = textTex([['GASOLIO', 78, 800, 60, null, '#ffffff'], [C.orgName().toUpperCase().slice(0, 26), 30, 700, 118, null, 'rgba(255,255,255,.9)']], { bg: '#f47b20', w: 768, h: 150 });
    planeT(sg, 5.2, 1, g, st.x, 5.27, st.z + cd / 2 + .1);
    pumpDraw(0, GD.price); pumpTex = new T.CanvasTexture(pumpCv); pumpTex.colorSpace = T.SRGBColorSpace; OWN.push(pumpTex);
    const isl = [-2.3, 2.3];
    isl.forEach((ix, k) => {
      bx(g, 1.3, .22, 4.4, 0xd8d5ce, st.x + ix, .16, st.z); bx(g, 1.3, .06, 4.4, 0xf2c418, st.x + ix, .38, st.z, { ns: 1 });
      const px = st.x + ix, pz = st.z; bx(g, .75, 1.75, .55, 0xf1f2f4, px, .44, pz); bx(g, .78, .32, .58, 0xf47b20, px, 2.19, pz); bx(g, .8, .08, .6, 0x2b2f35, px, 2.5, pz);
      for (const s of [-1, 1]) { const dm = new T.MeshBasicMaterial({ map: pumpTex }); OWN.push(dm); const sc = new T.Mesh(G.plane, dm); sc.scale.set(.52, .35, 1); sc.position.set(px + s * .38, 1.75, pz); sc.rotation.y = s * Math.PI / 2; g.add(sc); bx(g, .06, .22, .1, 0x1d1f22, px + s * .4, 1.05, pz + .12); bx(g, .1, .08, .06, 0x2cbf5d, px + s * .41, 1.25, pz - .12, { ns: 1 }); }
      for (const s of [-1, 1]) { mesh(G.cyl, mat(0xf2c418), px, .9, pz + s * 2.05, g, { s: [.22, .95, .22] }); B.add('bb', G.cyl, mat(0x1d1f22), m4(px, 1.1, pz + s * 2.05, .26, .12, .26)); }
    });
    // totem del prezzo
    const tot = textTex([['GASOLIO', 44, 800, 46, null, '#ffffff'], [GD.price ? GD.price.toFixed(3).replace('.', ',') : '—', 84, 800, 140, null, '#f5c518'], ['€ / litro', 30, 600, 204, null, 'rgba(255,255,255,.85)'], [`${N(GD.lM)} L nel mese`, 26, 600, 262, null, 'rgba(255,255,255,.8)']], { bg: '#17191c', w: 320, h: 300, round: 18 });
    bx(g, 1.7, 4.6, .45, 0xf47b20, st.x + cw / 2 + 2.2, .16, st.z + cd / 2 - .5); planeT(tot, 1.45, 1.36, g, st.x + cw / 2 + 2.2, 3.55, st.z + cd / 2 - .245); bx(g, 1.2, .6, .5, 0x2b2f35, st.x + cw / 2 + 2.2, .16, st.z + cd / 2 - .5);
    // cisterna del gasolio su selle, con vasca di contenimento e scaletta
    const tx = F.x0 + 5, tz = st.z + 1.5;
    bx(g, 3.6, .5, 7.4, 0xc9c6bf, tx, .16, tz); bx(g, 3.2, .1, 7, 0x9a978f, tx, .62, tz, { ns: 1 });
    mesh(G.cyl, mat(0xeef0f2), tx, 2.25, tz, g, { s: [2.5, 6, 2.5], rx: Math.PI / 2 }); mesh(G.sph, mat(0xeef0f2), tx, 2.25, tz + 3, g, { s: [2.5, 2.5, .7] }); mesh(G.sph, mat(0xeef0f2), tx, 2.25, tz - 3, g, { s: [2.5, 2.5, .7] });
    mesh(G.cyl, mat(0xf47b20), tx, 2.25, tz, g, { s: [2.53, .5, 2.53], rx: Math.PI / 2 });
    for (const s of [-1, 1]) bx(g, 2.4, 1.1, .35, 0x7d848d, tx, .6, tz + s * 2);
    bx(g, .3, .25, .3, 0x2b2f35, tx, 3.45, tz + 1.5); mesh(G.cyl, mat(0x2b2f35), tx + .3, 3.5, tz - 1.2, g, { s: [.12, .6, .12] });
    const tl = textTex([['GASOLIO', 64, 800, 46, null, '#1d1f22'], ['infiammabile · non fumare', 22, 600, 96, null, '#55585e']], { bg: '#ffffff', w: 400, h: 120, round: 10 });
    for (const s of [-1, 1]) planeT(tl, 2, .6, g, tx + s * 1.3, 2.3, tz, { ry: s * Math.PI / 2 });
    for (let k = 0; k < 6; k++) B.add('lad', G.box, mat(0x9aa1a9), m4(tx - 1.45, .9 + k * .45, tz - 2.6, .05, .05, .5)); for (const s of [-1, 1]) B.add('lad', G.box, mat(0x9aa1a9), m4(tx - 1.45, 1.95, tz - 2.6 + s * .25, .05, 2.6, .05));
    // tubo dalla cisterna alle colonnine
    const tube = new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(tx + 1.2, .4, tz - 2), new T.Vector3(tx + 4, .25, tz - 3), new T.Vector3(st.x - 2.3, .25, st.z + 1)]), 24, .07, 6); OWN.push(tube); mesh(tube, mat(0x3a3f46), 0, 0, 0, g, { ns: 1 });
    // carrello antincendio e cartelli
    bx(g, .45, .7, .35, 0xd62b1f, st.x - cw / 2 - 1, .16, st.z - 3); mesh(G.cyl, mat(0xd62b1f), st.x - cw / 2 - 1, 1.15, st.z - 3, g, { s: [.32, .55, .32] });
    const ns = textTex([['⛔', 80, 400, 64]], { bg: '#ffffff', w: 128, h: 128, round: 64 }); bx(g, .06, 1.8, .06, 0x8e959e, st.x - cw / 2 - 1, .16, st.z + 3); planeT(ns, .7, .7, g, st.x - cw / 2 - 1, 2.2, st.z + 3.05);
    B.flush();
    // mezzi: quello dell'ultimo rifornimento è alla colonnina, gli altri nei posti
    const lastP = GD.lastR[0] ? C.plate(GD.lastR[0].targa) : '';
    let k = 0; fleetVeh = [];
    GD.V.forEach(v => {
      let o;
      if (v.p === lastP && GD.V.length) { o = vehicle(g, v, st.x, st.z, Math.PI / 2); v.atPump = 1; }
      else { const s = slots[k++]; if (!s) return; o = vehicle(g, v, s.x, s.z, s.ry); }
      fleetVeh.push({ v, o });
    });
    // tubo della colonnina fino al bocchettone del mezzo al rifornimento
    const vp = fleetVeh.find(f => f.v.atPump);
    if (vp) { const h2 = new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(st.x - 2.3 + .38, 1.1, st.z + .1), new T.Vector3(st.x - 1.7, .45, st.z + .6), new T.Vector3(st.x - 1.1, 1.05, st.z + 1.1)]), 16, .035, 6); OWN.push(h2); mesh(h2, mat(0x1d1f22), 0, 0, 0, g, { ns: 1 }); movers.push({ t: 'pump', l: C.num(GD.lastR[0].litri) || 40, price: GD.price, last: 0 }); }
    // area cliccabile del parco mezzi e del distributore
    const hz = new T.Mesh(G.box, M.hit); hz.scale.set(w, .6, d); hz.position.set(cx, .2, cz); hz.userData.k = { t: 'zone', z: 'flotta' }; g.add(hz); pick.push(hz);
    const hf = new T.Mesh(G.box, M.hit); hf.scale.set(cw + 6, 5.6, cd); hf.position.set(st.x + 1.5, 2.8, st.z); hf.userData.k = { t: 'fuel' }; g.add(hf); pick.push(hf);
    const ht = new T.Mesh(G.box, M.hit); ht.scale.set(3.6, 4, 7.4); ht.position.set(tx, 2, tz); ht.userData.k = { t: 'fuel' }; g.add(ht); pick.push(ht);
  }
  let fleetVeh = [];
  const vehOf = p => D.gas && D.gas.V.find(v => v.p === p);
  const plHtml = (p, big) => `<span class="m3-pl${big ? ' big' : ''}"><i>I</i><b>${esc(plFmt(p))}</b></span>`;
  const bars6 = (vals, keys) => { const mx = Math.max(1, ...vals); const MN = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']; return `<div class="m3-b6">${vals.map((v, i) => `<div><span>${v ? N(Math.round(v)) : ''}</span><i style="--h:${(v / mx * 100).toFixed(1)}%"${i === vals.length - 1 ? ' class="c"' : ''}></i><small>${MN[+keys[i].slice(5) - 1]}</small></div>`).join('')}</div>`; };
  const gasBtns = () => (C.gasW && C.gasW() ? `<button type="button" class="m3-go" data-m3="gasadd">${ic('fuel')}Registra un rifornimento</button>` : '') + `<button type="button" class="m3-go ghost" data-m3="gasopen">${ic('chart')}Apri la sezione Gasolio</button>`;
  function fleetPanel(Pn) {
    const GD = D.gas; if (!GD) return '';
    if (Pn.t === 'zone') {
      return head(ic('van'), 'or', 'Parco mezzi · gasolio', 'Mezzi aziendali', `${GD.V.length} mezzi · distributore interno`, 1) + `<div class="m3-pb"><div class="m3-grid">
        ${stat('Gasolio nel mese', N(Math.round(GD.lM)), 'L', `${GD.nM} rifornimenti`)}${stat('Costo carburante', GD.price || GD.cM ? C.eur0(GD.cM) : '—', '', GD.price ? `${GD.price.toFixed(3).replace('.', ',')} €/L` : 'prezzo €/L da impostare')}
        ${stat('Consumo medio', GD.cons ? GD.cons.toFixed(1).replace('.', ',') : '—', GD.cons ? 'km/L' : '', GD.cons ? `${(100 / GD.cons).toFixed(1).replace('.', ',')} L ogni 100 km` : 'servono i km')}${stat('Noleggi', GD.rent ? C.eur0(GD.rent * GD.mul) : '—', GD.rent ? '/mese' : '', `${GD.V.filter(v => v.rent).length} mezzi a noleggio`)}</div>
        ${gasBtns()}
        <div class="m3-h4">Mezzi <em>${GD.V.length}</em></div><div class="m3-rows m3-ilist">${GD.V.map(v => `<button type="button" class="m3-row" data-veh3="${esc(v.p)}">${plHtml(v.p)}<span class="tx"><b>${esc(v.name || ({ van: 'Furgone', truck: 'Autocarro', car: 'Auto', pickup: 'Pick-up' })[v.kind])}</b><small>${esc([v.drv.length ? 'guida ' + v.drv.join(', ') : v.uso, v.last ? 'ultimo ' + C.dIt(v.last.data) : 'nessun rifornimento'].filter(Boolean).join(' · '))}</small></span><span class="m3-chip ${v.lM ? 'g' : 'n'}">${N(Math.round(v.lM))} L</span></button>`).join('') || '<div class="m3-empty">Nessun mezzo: aggiungili dalla sezione Gasolio con «+ Mezzo»</div>'}</div></div>`;
    }
    if (Pn.t === 'fuel') {
      return head(ic('fuel'), 'or', 'Distributore interno', 'Gasolio', `${GD.nAll} rifornimenti registrati`, 1) + `<div class="m3-pb"><div class="m3-grid">
        ${stat('Prezzo', GD.price ? GD.price.toFixed(3).replace('.', ',') : '—', '€/L', GD.price ? 'impostato nella sezione Gasolio' : 'da impostare')}${stat('Erogati nel mese', N(Math.round(GD.lM)), 'L', `${GD.nM} rifornimenti`)}</div>
        ${gasBtns()}
        <div class="m3-h4">Ultimi rifornimenti <em>${GD.lastR.length}</em></div><div class="m3-tl m3-tl2">${GD.lastR.slice(0, 14).map(r => { const p = C.plate(r.targa), v = vehOf(p); return `<button type="button" ${v ? `data-veh3="${esc(p)}"` : ''}><b>${esc(C.dIt(r.data).slice(0, 5))}</b>${plHtml(p)}<span class="tx2">${N(C.num(r.litri))} L${C.num(r.km) ? ' · ' + N(C.num(r.km)) + ' km' : ''}<small>${esc([String(r.operatore || '').trim(), String(r.uso || '').trim()].filter(x => x && x !== '?').join(' · ').toLowerCase())}</small></span></button>`; }).join('') || '<div class="m3-empty">Nessun rifornimento</div>'}</div></div>`;
    }
    const v = vehOf(Pn.p); if (!v) return '';
    const KN = { van: 'Furgone', truck: 'Autocarro', car: 'Auto aziendale', pickup: 'Pick-up' }[v.kind];
    return head(ic(v.kind === 'truck' ? 'truck' : 'van'), '', KN + (v.atPump ? ' · al distributore' : ''), plHtml(v.p, 1), esc([v.name, v.owner].filter(Boolean).join(' · ') || 'mezzo aziendale'), 1) + `<div class="m3-pb">
      <div class="m3-chips">${v.drv.length ? `<span class="m3-chip">${ic('users', ' style="width:13px;height:13px"')}${esc(v.drv.join(', '))}</span>` : ''}${v.centro ? `<span class="m3-chip n">centro ${esc(v.centro)}</span>` : ''}${v.rent ? `<span class="m3-chip" style="background:#e6efff;color:#1f55b8">Noleggio ${C.eur0(v.rent * D.gas.mul)}/mese</span>` : ''}${v.uso ? `<span class="m3-chip n">${esc(v.uso.toLowerCase())}</span>` : ''}</div>
      <div class="m3-grid">${stat('Contachilometri', v.odo ? N(v.odo) : '—', v.odo ? 'km' : '', v.last && C.num(v.last.km) ? 'al ' + C.dIt(v.last.data) : 'km non registrati')}${stat('Consumo', v.cons ? v.cons.toFixed(1).replace('.', ',') : '—', v.cons ? 'km/L' : '', v.cons ? `${(100 / v.cons).toFixed(1).replace('.', ',')} L/100 km · ${N(v.km)} km` : 'servono i km')}
      ${stat('Gasolio nel mese', N(Math.round(v.lM)), 'L', `${v.nM} pieni · ${C.eur0(v.cM)}`)}${stat('Totale', N(Math.round(v.lT)), 'L', `${v.s.length} pieni · ${C.eur0(v.cT)}`)}</div>
      <div class="m3-h4">Litri negli ultimi 6 mesi</div>${bars6(v.m6, D.gas.keys)}
      ${gasBtns()}
      <div class="m3-h4">Rifornimenti <em>${v.s.length}</em></div><div class="m3-tl m3-tl2">${v.s.slice().reverse().slice(0, 12).map(r => `<div><b>${esc(C.dIt(r.data))}</b><span class="tx2">${N(C.num(r.litri))} L${C.num(r.km) ? ' · ' + N(C.num(r.km)) + ' km' : ''}<small>${esc([String(r.operatore || '').trim(), String(r.uso || '').trim()].filter(x => x && x !== '?').join(' · ').toLowerCase())}</small></span></div>`).join('') || '<div class="m3-empty">Nessun rifornimento registrato</div>'}</div></div>`;
  }


  /* ---------------- messa a fuoco di un vano (v275): volo, estrazione, raggi X, scheda ancorata, verifica ---------------- */
  const ease = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  const easeOut = u => 1 - Math.pow(1 - u, 3);
  const easeBack = u => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };
  let FOC = null, BACK = [], HOV = null, SCAN = null;
  // istanze (pallet, colli, film, cassette) che appartengono a un articolo dentro uno scaffale
  function cellInsts(g, artId) {
    const out = []; g.children.forEach(im => { if (!im.isInstancedMesh || !im.userData.ids) return; im.userData.ids.forEach((id, i) => { if (id === artId) { const m = new T.Matrix4(); im.getMatrixAt(i, m); out.push({ im, i, m0: m }); } }); });
    return out;
  }
  function setOff(list, dy, dz) { const m = new T.Matrix4(), done = new Set(); list.forEach(x => { m.copy(x.m0); m.elements[13] += dy; m.elements[14] += dz; x.im.setMatrixAt(x.i, m); done.add(x.im); }); done.forEach(im => { im.instanceMatrix.needsUpdate = true; im.boundingSphere = null; }); }
  // staffe d'angolo che inquadrano il vano (sempre visibili, sopra a tutto)
  function brackets(color, op) {
    const im = new T.InstancedMesh(G.box, new T.MeshBasicMaterial({ color, transparent: true, opacity: op, depthTest: false, depthWrite: false }), 24); im.renderOrder = 20; im.frustumCulled = false;
    const fill = new T.Mesh(G.box, new T.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthTest: false, depthWrite: false })); fill.renderOrder = 19;
    const grp = new T.Group(); grp.add(im, fill); grp.visible = false; WH.add(grp); OWN.push(im.material, fill.material);
    return { grp, im, fill, set(w, h, d) { const L2 = Math.min(.28, Math.min(w, h, d) * .32), t = .035; let k = 0; for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) { const x = sx * w / 2, y = sy * h / 2, z = sz * d / 2; im.setMatrixAt(k++, m4(x - sx * L2 / 2, y, z, L2, t, t)); im.setMatrixAt(k++, m4(x, y - sy * L2 / 2, z, t, L2, t)); im.setMatrixAt(k++, m4(x, y, z - sz * L2 / 2, t, t, L2)); } im.instanceMatrix.needsUpdate = true; fill.scale.set(w, h, d); } };
  }
  function cellBox(it, b, l) {
    const bw = it.bw || KIND[it.k].bw, lh = rackLh(it), dep = rackDep(it), pal = it.k === 'pallet', c = cellLocal(it, b, l), h = pal ? Math.min(lh, 1.65) - .12 : lh - .08;
    c.y += h / 2 + (pal ? .02 : .02); return { c, w: bw - .14, h, d: dep + .16 };
  }
  function focusCell(it, b, l, artId, o) {
    o = o || {}; const g = rackG(it.id); if (!g) return;
    if (FOC && FOC.it === it && FOC.b === b && FOC.l === l && FOC.art === artId) { if (o.co !== false) FOC.co = 1; return; }
    unfocus(); g.updateMatrixWorld();
    const bx2 = cellBox(it, b, l), br = brackets(0xf47b20, 1); br.set(bx2.w, bx2.h, bx2.d); br.grp.visible = true;
    const pull = o.pull !== false && artId ? (it.k === 'pallet' ? .62 : .3) : 0;
    FOC = { it, b, l, art: artId, g, br, bx: bx2, insts: artId ? cellInsts(g, artId) : [], u: 0, pull, co: o.co !== false && !!artId, t0: performance.now() / 1000, xr: [] };
    placeFoc(0); if (FOC.co) callout(true);
  }
  function placeFoc(off) {
    if (!FOC) return; const { g, it, bx } = FOC, p = bx.c.clone(); p.z += off; p.y += off * .08; g.updateMatrixWorld(); g.localToWorld(p);
    FOC.br.grp.position.copy(p); FOC.br.grp.rotation.y = it.r * Math.PI / 2; FOC.wp = p;
  }
  function unfocus() {
    if (!FOC) return; const F = FOC; FOC = null;
    if (F.insts.length && F.cur) BACK.push({ insts: F.insts, from: F.cur, t: 0 });
    WH && WH.remove(F.br.grp); xrayOff(F.xr); callout(false);
  }
  // scaffali tra la camera e il vano: diventano trasparenti
  let RX = [];
  function xrayRack(it) {
    xrayOff(RX); RX = []; const g = rackG(it.id); if (!g) return; g.updateMatrixWorld(); const c = g.localToWorld(new T.Vector3(0, 2, 0));
    RX = xrayList(c, g);
  }
  function xrayList(tgtW, skip) {
    const out = [], sp = Math.sin(GOAL.pol), cp = Math.cos(GOAL.pol), camP = new T.Vector3(GOAL.tx + GOAL.dist * sp * Math.sin(GOAL.az), (GOAL.ty || 0) + GOAL.dist * cp, GOAL.tz + GOAL.dist * sp * Math.cos(GOAL.az));
    const dir = tgtW.clone().sub(camP), len = dir.length(); dir.normalize(); const ray = new T.Ray(camP, dir), hitP = new T.Vector3();
    WH.children.forEach(c => { if (!c.userData.eid || c === skip) return; const it = L.items.find(i => i.id === c.userData.eid); if (!it || it.t !== 'rack') return; const hm = c.children.find(x => x.userData.k && x.userData.k.t === 'rack'); if (!hm) return; hm.updateMatrixWorld(); const bb = new T.Box3().setFromObject(hm); bb.expandByScalar(.3); if (ray.intersectBox(bb, hitP) && hitP.distanceTo(camP) < len - .3) out.push(xrayOn(c)); });
    return out;
  }
  function xrayFor() {
    if (!FOC) return; xrayOff(FOC.xr); FOC.xr = []; xrayOff(RX); RX = []; FOC.xr = xrayList(FOC.wp.clone(), FOC.g); return;
    const sp = Math.sin(GOAL.pol), cp = Math.cos(GOAL.pol), camP = new T.Vector3(GOAL.tx + GOAL.dist * sp * Math.sin(GOAL.az), (GOAL.ty || 0) + GOAL.dist * cp, GOAL.tz + GOAL.dist * sp * Math.cos(GOAL.az));
    const tgt = FOC.wp.clone(), dir = tgt.clone().sub(camP), len = dir.length(); dir.normalize(); const ray = new T.Ray(camP, dir), hitP = new T.Vector3();
    WH.children.forEach(c => { if (!c.userData.eid || c === FOC.g) return; const it = L.items.find(i => i.id === c.userData.eid); if (!it || it.t !== 'rack') return; const hm = c.children.find(x => x.userData.k && x.userData.k.t === 'rack'); if (!hm) return; hm.updateMatrixWorld(); const bb = new T.Box3().setFromObject(hm); bb.expandByScalar(.3); if (ray.intersectBox(bb, hitP) && hitP.distanceTo(camP) < len - .3) FOC.xr.push(xrayOn(c)); });
  }
  function xrayOn(grp) {
    const ex = FADE.findIndex(r => r.grp === grp); if (ex >= 0) { const r = FADE.splice(ex, 1)[0]; r.dir = 1; return r; }
    const rec = { grp, mats: [], u: 0, dir: 1 };
    grp.traverse(o => { if (!o.isMesh || o.material === M.hit || o.userData.xr0) return; const src = o.material, arr = Array.isArray(src) ? src : [src]; const cl = arr.map(m => { const c = m.clone(); c.transparent = true; c.depthWrite = false; c.opacity = m.opacity; c.userData.o0 = m.opacity; return c; }); o.userData.xr0 = src; o.material = Array.isArray(src) ? cl : cl[0]; rec.mats.push(...cl); o.castShadow = false; });
    return rec;
  }
  function xrayOff(list) { (list || []).forEach(r => { r.dir = -1; FADE.push(r); }); }
  const FADE = [];
  function xrayRestore(r) { r.grp.traverse(o => { if (o.userData.xr0) { o.material = o.userData.xr0; delete o.userData.xr0; o.castShadow = true; } }); r.mats.forEach(m => m.dispose()); }
  function focusTick(t, dt) {
    if (FOC) {
      FOC.u = Math.min(1, FOC.u + dt / .75); const e = easeBack(FOC.u);
      if (FOC.insts.length && FOC.pull) { const dz = FOC.pull * e, dy = .05 * Math.sin(Math.PI * Math.min(1, FOC.u * 1.2)); FOC.cur = { dy, dz }; setOff(FOC.insts, dy, dz); placeFoc(dz); }
      const s = 1 + (1 - easeOut(Math.min(1, FOC.u * 1.4))) * .35 + Math.sin(t * 3) * .012; FOC.br.grp.scale.set(s, s, s);
      FOC.br.im.material.opacity = Math.min(1, FOC.u * 2); FOC.br.fill.material.opacity = .06 + Math.sin(t * 3) * .03;
      FOC.xr.forEach(r => { r.u = Math.min(1, r.u + dt / .45); r.mats.forEach(m => { m.opacity = 1 - .86 * easeOut(r.u); }); });
    }
    RX.forEach(r => { r.u = Math.min(1, r.u + dt / .45); r.mats.forEach(m => { m.opacity = 1 - .8 * easeOut(r.u); }); });
    for (let i = BACK.length - 1; i >= 0; i--) { const x = BACK[i]; x.t = Math.min(1, x.t + dt / .4); const e = 1 - ease(x.t); setOff(x.insts, x.from.dy * e, x.from.dz * e); if (x.t >= 1) BACK.splice(i, 1); }
    for (let i = FADE.length - 1; i >= 0; i--) { const r = FADE[i]; r.u = Math.max(0, r.u - dt / .35); r.mats.forEach(m => { m.opacity = 1 - .86 * easeOut(r.u); }); if (r.u <= 0) { xrayRestore(r); FADE.splice(i, 1); } }
    if (HOV && HOV.br) { HOV.br.fill.material.opacity = .05; }
    if (SCAN) { SCAN.u += dt / SCAN.dur; const u = Math.min(1, SCAN.u); if (SCAN.kind === 'rack') SCAN.m.position.x = -SCAN.len / 2 + SCAN.len * ease(u); else { SCAN.m.position.y = SCAN.y0 + SCAN.h * (.5 - .5 * Math.cos(u * Math.PI * 2)); } SCAN.m.material.opacity = Math.sin(Math.PI * u) * .95; if (u >= 1) { SCAN.p.remove(SCAN.m); SCAN = null; } }
    updCallout(t);
  }
  // passata di luce lungo il fronte dello scaffale quando lo selezioni
  function glowTex() { if (TX.glow) return TX.glow; TX.glow = cvTex(128, 8, (gx, w, h) => { const gr = gx.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,140,40,0)'); gr.addColorStop(.5, 'rgba(255,190,110,1)'); gr.addColorStop(1, 'rgba(255,140,40,0)'); gx.fillStyle = gr; gx.fillRect(0, 0, w, h); }); return TX.glow; }
  function scanRack(it) {
    const g = rackG(it.id); if (!g || SCAN) return; const len = rackLen(it), H = it.k === 'pallet' ? (it.lv - 1) * rackLh(it) + 1.4 : it.lv * rackLh(it) + .5;
    const m2 = new T.MeshBasicMaterial({ map: glowTex(), transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }); OWN.push(m2);
    const m = new T.Mesh(G.plane, m2); m.scale.set(1.6, H, 1); m.position.set(-len / 2, .5 + H / 2, rackDep(it) / 2 + .12); g.add(m);
    SCAN = { kind: 'rack', m, p: g, len, u: 0, dur: 1.5 };
  }
  // laser di verifica sul vano: una riga rossa che scorre su e giù
  function scanCell() {
    if (!FOC || SCAN) return; const { g, bx } = FOC;
    const lt = TX.laser || (TX.laser = cvTex(8, 64, (gx, w, h) => { const gr = gx.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,40,30,0)'); gr.addColorStop(.5, 'rgba(255,60,40,1)'); gr.addColorStop(1, 'rgba(255,40,30,0)'); gx.fillStyle = gr; gx.fillRect(0, 0, w, h); }));
    const m2 = new T.MeshBasicMaterial({ map: lt, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, depthTest: false }); OWN.push(m2);
    const m = new T.Mesh(G.plane, m2); m.renderOrder = 21; m.scale.set(bx.w + .1, .14, 1); m.position.set(bx.c.x, bx.c.y - bx.h / 2, bx.c.z + bx.d / 2 + (FOC.cur ? FOC.cur.dz : 0) + .02); g.add(m);
    SCAN = { kind: 'cell', m, p: g, y0: bx.c.y - bx.h / 2, h: bx.h, u: 0, dur: 1.6 };
  }
  // passaggio del mouse: staffe chiare sul vano e anteprima vicino al puntatore
  function hoverArt(id, cx, cy) {
    const tip = $('.m3-tip'); if (!tip) return;
    if (!id || EDIT || (FOC && FOC.art === id)) { if (HOV) { WH && WH.remove(HOV.br.grp); HOV = null; } tip.classList.remove('on'); return; }
    const x = D.arts.find(a => a.id === id), p2 = P.byArt.get(id); if (!x || !p2) return;
    if (!HOV || HOV.id !== id) { if (HOV) WH.remove(HOV.br.grp); const g = rackG(p2.rk.id); if (!g) return; const br = brackets(0xffffff, .95), bb = cellBox(p2.rk, p2.b, p2.l); br.set(bb.w, bb.h, bb.d); g.updateMatrixWorld(); const wp = g.localToWorld(bb.c.clone()); br.grp.position.copy(wp); br.grp.rotation.y = p2.rk.r * Math.PI / 2; br.grp.visible = true; HOV = { id, br };
      tip.innerHTML = `<b>${esc(x.a.descrizione)}</b><span><i class="m3-loc">${esc(p2.code)}</i>${N(x.g)} ${esc(x.a.um || 'pz')}${x.low ? ' · <em>sotto scorta</em>' : x.out ? ' · esaurito' : ''}</span>`; }
    const rc = root.getBoundingClientRect(); tip.style.transform = `translate(${cx - rc.left + 16}px,${cy - rc.top + 18}px)`; tip.classList.add('on');
  }
  // scheda ancorata al vano, con linea di collegamento
  function callout(on) {
    const co = $('.m3-co'), ld = $('.m3-lead'); if (!co) return;
    if (!on || !FOC || !FOC.art) { co.classList.remove('on'); ld.classList.remove('on'); return; }
    const x = D.arts.find(a => a.id === FOC.art), p2 = P.byArt.get(FOC.art); if (!x || !p2) return;
    const last = C.mov().filter(m => m.articolo === x.id).sort((a, b) => String(b.data).localeCompare(String(a.data)) || String(b.creato || '').localeCompare(String(a.creato || '')))[0];
    const ref = Math.max(x.s * 3, x.g, 1), pg = clamp(Math.max(0, x.g) / ref, 0, 1), ps = x.s ? clamp(x.s / ref, 0, 1) : 0;
    const st = x.out ? ['n', 'Esaurito'] : x.low ? ['a', 'Sotto scorta'] : ['g', 'Disponibile'];
    co.innerHTML = `<div class="m3-coh"><span class="m3-loc">${ic('pin', ' style="width:11px;height:11px"')}${esc(p2.code)}</span><span class="m3-chip ${st[0]}"><i></i>${st[1]}</span><button type="button" data-m3="pclose" aria-label="Chiudi">${ic('x')}</button></div>
      <b class="m3-cot">${esc(x.a.descrizione)}</b><small class="m3-cos">${esc([x.a.codice, x.a.codForn ? 'forn. ' + x.a.codForn : '', x.cat].filter(Boolean).join(' · '))}</small>
      <div class="m3-coq"><b data-cnt="${x.g}">0</b><span>${esc(x.a.um || 'pz')}</span>${x.val ? `<em>${C.eur0(x.val)}</em>` : ''}</div>
      <div class="m3-cob"><u style="--w:${(pg * 100).toFixed(1)}%"></u>${x.s ? `<i style="left:${(ps * 100).toFixed(1)}%" title="scorta minima"></i>` : ''}</div>
      <small class="m3-cos">${x.s ? `scorta minima ${N(x.s)} ${esc(x.a.um || '')}` : 'nessuna scorta minima'}${last ? ` · ultimo movimento ${esc(C.dIt(last.data))} (${C.num(last.quantita) > 0 ? '+' : ''}${N(C.num(last.quantita))})` : ''}</small>
      <div class="m3-coa">${canW() ? `<button type="button" class="pri" data-gx="mov-art" data-id="${esc(x.id)}">±<span>Carico / scarico</span></button>` : ''}<button type="button" data-m3="verify">${ic('check')}<span>Verifica</span></button>${canEdit() ? `<button type="button" data-loc3="${esc(x.id)}">${ic('pin')}<span>Sposta</span></button>` : ''}</div>`;
    co.classList.remove('on'); void co.offsetWidth; co.classList.add('on'); ld.classList.add('on'); co._t0 = performance.now();
    const n = $('[data-cnt]', co); if (n) { const v = +n.dataset.cnt, d = Math.abs(v % 1) > .001 ? 1 : 0, t0 = performance.now(); const step = () => { const u = Math.min(1, (performance.now() - t0) / 900); n.textContent = (v * easeOut(u)).toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d }); if (u < 1 && n.isConnected) requestAnimationFrame(step); }; requestAnimationFrame(step); }
  }
  function updCallout(t) {
    const co = $('.m3-co'), ld = $('.m3-lead'); if (!co || !co.classList.contains('on') || !FOC || !FOC.wp) return;
    const w = R.domElement.clientWidth, h = R.domElement.clientHeight, v = FOC.wp.clone(); v.y += FOC.bx.h * .1; v.project(cam);
    const px = (v.x + 1) / 2 * w, py = (1 - v.y) / 2 * h, cw = co.offsetWidth, chh = co.offsetHeight, panelW = root.classList.contains('pn') && w > 760 ? 372 : 0;
    let x = px + 70, y = py - chh - 50; if (x + cw > w - panelW - 16) x = px - cw - 70; x = clamp(x, 16, w - panelW - cw - 16); y = clamp(y, 76, h - chh - 120);
    if (w <= 760) { x = (w - cw) / 2; y = h - chh - 120; }
    co.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
    const ax = x < px ? x + cw : x, ay = clamp(py, y + 22, y + chh - 22);
    const ln = $('line', ld), c1 = $('circle', ld), c2 = $$('circle', ld)[1]; ln.setAttribute('x1', ax); ln.setAttribute('y1', ay); ln.setAttribute('x2', px); ln.setAttribute('y2', py);
    c1.setAttribute('cx', px); c1.setAttribute('cy', py); c2.setAttribute('cx', px); c2.setAttribute('cy', py); c2.setAttribute('r', 6 + (t * 14 % 14)); c2.setAttribute('opacity', 1 - (t * 14 % 14) / 14);
    ld.style.opacity = v.z < 1 ? 1 : 0;
  }
  function verify() {
    if (!FOC || !FOC.art) return; scanCell(); const co = $('.m3-co'), x = D.arts.find(a => a.id === FOC.art); if (!co || !x) return;
    const b = $('[data-m3="verify"]', co); if (b) { b.classList.add('busy'); b.innerHTML = `<i class="m3-spin"></i><span>Verifica…</span>`; }
    setTimeout(() => { if (!FOC || FOC.art !== x.id) return; const b2 = $('[data-m3="verify"]', co); if (b2) { b2.classList.remove('busy'); b2.classList.add('ok'); b2.innerHTML = `${ic('check')}<span>Verificato</span>`; } toast(`${x.a.descrizione}: a sistema ${N(x.g)} ${x.a.um || 'pz'} in ${P.byArt.get(x.id).code}${x.low ? ' · sotto scorta' : ''}`); }, 1650);
  }
  // numeri del pannello che salgono da zero
  function countUp(el) {
    $$('.m3-st b', el).forEach(b => { const tn = b.firstChild; if (!tn || tn.nodeType !== 3) return; const m = /^([^\d-]*)(-?\d{1,3}(?:\.\d{3})*(?:,\d+)?|-?\d+(?:,\d+)?)(\s*%?)$/.exec(tn.textContent.trim()); if (!m) return; const raw = m[2], d = raw.includes(',') ? raw.split(',')[1].length : 0, v = parseFloat(raw.replace(/\./g, '').replace(',', '.')); if (!isFinite(v) || !v) return; const t0 = performance.now(); const step = () => { const u = Math.min(1, (performance.now() - t0) / 850); tn.textContent = m[1] + (v * easeOut(u)).toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d }) + m[3]; if (u < 1 && tn.isConnected) requestAnimationFrame(step); }; requestAnimationFrame(step); });
  }

  /* ---------------- animazioni ---------------- */
  let o3 = null, viewOff = 0;
  function animate(t, dt) {
    if (!o3) o3 = new T.Object3D();
    movers.forEach(m => {
      const s = t * (m.sp || 1) + (m.ph || 0);
      if (m.t === 'path') { const u = (Math.sin(s) + 1) / 2, dir = Math.cos(s) >= 0 ? 1 : -1; m.o.position.lerpVectors(m.a, m.b, u); m.o.rotation.y = Math.atan2((m.b.x - m.a.x) * dir, (m.b.z - m.a.z) * dir); }
      else if (m.t === 'loop') { m.o.position.x = m.cx + Math.cos(s) * m.rx; m.o.position.z = m.cz + Math.sin(s) * m.rz; m.o.rotation.y = -s; }
      else if (m.t === 'walk') { const u = (Math.sin(s) + 1) / 2, dir = Math.cos(s) >= 0 ? 1 : -1; m.o.position.x = m.a.x + (m.b.x - m.a.x) * u; m.o.position.z = m.a.z + (m.b.z - m.a.z) * u; m.o.rotation.y = Math.atan2((m.b.x - m.a.x) * dir, (m.b.z - m.a.z) * dir); m.o.position.y = .5 + Math.abs(Math.sin(t * 6 + m.ph)) * .05; }
      else if (m.t === 'bob') m.o.position.y = .5 + Math.abs(Math.sin(t * 2 + m.ph)) * .03;
      else if (m.t === 'spin') m.o.rotation.y = Math.sin(t * m.sp) * 1.3;
      else if (m.t === 'float') m.o.position.y = m.y + Math.sin(t * 1.2) * .25;
      else if (m.t === 'pump') { if (t - m.last > .12) { m.last = t; const u = (t % 11) / 8; pumpDraw(Math.min(1, u) * m.l, m.price); } }
      else if (m.t === 'road') { m.o.position.x += m.dir * m.sp * dt; if (m.o.position.x > 330) m.o.position.x = -330; if (m.o.position.x < -330) m.o.position.x = 330; }
      else if (m.t === 'belt') { for (let i = 0; i < m.n; i++) { const u = (t * m.sp + i / m.n) % 1; o3.position.set(-m.len / 2 + .5 + u * (m.len - 1), 1.22 + .2, 0); o3.rotation.set(0, (i % 3) * .2, 0); o3.scale.set(.55, .4, .5); o3.updateMatrix(); m.im.setMatrixAt(i, o3.matrix); } m.im.instanceMatrix.needsUpdate = true; }
    });
    if (hiMesh && hiMesh.visible) hiMesh.material.opacity = .25 + Math.sin(t * 4) * .12;
    focusTick(t, dt);
  }

  /* ---------------- interfaccia ---------------- */
  function html() {
    const multi = C.magMulti();
    return `<canvas class="m3-c"></canvas><div class="m3-lbs"></div><svg class="m3-lead"><line/><circle r="4"/><circle r="6"/></svg><div class="m3-co"></div><div class="m3-tip"></div>
    <header class="m3-top">
      <div class="m3-brand"><i class="m3-logo">${ic('logo')}</i><b>${esc(C.orgName())}</b></div>
      <nav class="m3-tabs"><button type="button" class="on">${ic('cube')}Magazzino 3D</button><button type="button" data-m3="close">${ic('grid')}Gestionale</button></nav>
      <label class="m3-search">${ic('search')}<input type="search" placeholder="Articolo, ubicazione, DDT, targa" aria-label="Cerca nel magazzino" autocomplete="off"><kbd>/</kbd><div class="m3-res"></div></label>
      <div class="m3-shots" style="position:relative"><button type="button" class="m3-btn" data-m3="shots">${ic('cam')}<span>Riprese</span></button><div class="m3-menu" data-menu="shots"></div></div>
      ${canEdit() ? `<button type="button" class="m3-edit" data-m3="edit">${ic('pencil')}<span>Progetta</span></button>` : ''}
      <div class="m3-zone"><b class="m3-zc">ALL</b><span class="m3-zt"><b>Panoramica</b><small></small></span><button type="button" data-m3="next" aria-label="Reparto successivo">${ic('right')}</button><button type="button" data-m3="zones" aria-label="Scegli il reparto">${ic('down')}</button><div class="m3-menu" data-menu="zones" style="left:0;right:auto;min-width:260px"></div></div>
      ${multi ? `<select class="m3-sel" aria-label="Magazzino"><option value="">Tutti i magazzini</option>${C.MAGS().map(m => `<option${m === C.mag() ? ' selected' : ''}>${esc(m)}</option>`).join('')}</select>` : ''}
      <span class="m3-live"><i></i><span>Live</span> <b class="m3-clock"></b></span>
      <button type="button" class="m3-bell" data-m3="bell" aria-label="Da gestire">${ic('bell')}<em hidden></em></button>
      <button type="button" class="m3-x" data-m3="close" aria-label="Torna al gestionale">${ic('x')}</button>
    </header>
    <div class="m3-kpis"></div>
    <div class="m3-edbar m3-card m3-ed"><span><b>Progetta il magazzino</b></span><span class="k">trascina per spostare · <kbd>R</kbd> ruota · <kbd>Canc</kbd> elimina · <kbd>Ctrl Z</kbd> annulla</span><button type="button" class="ghost" data-m3="undo" title="Annulla l'ultima modifica">${ic('undo')}</button><button type="button" class="ghost" data-m3="edx">Esci</button><button type="button" class="save" data-m3="eds">${ic('save')}Salva</button></div>
    <div class="m3-pal m3-card m3-ed"></div>
    <div class="m3-tools m3-card"><button type="button" data-m3="zin" aria-label="Avvicina">${ic('plus')}</button><button type="button" data-m3="zout" aria-label="Allontana">${ic('minus')}</button><hr><button type="button" data-m3="rl" aria-label="Ruota a sinistra">${ic('rl')}</button><button type="button" data-m3="rr" aria-label="Ruota a destra">${ic('rr')}</button><button type="button" data-m3="home" aria-label="Vista iniziale">${ic('home')}</button><button type="button" class="play" data-m3="play" aria-label="Visita guidata">${ic('play')}</button></div>
    <aside class="m3-panel m3-card"></aside>
    <div class="m3-flow m3-card"></div>
    <div class="m3-tab m3-card"></div>
    <div class="m3-load"><b>Preparo il magazzino…</b></div><div class="m3-toast"></div>`;
  }
  const stat = (l, v, unit, sub, p) => `<div class="m3-st"><span>${l}</span><b>${v}${unit ? `<small>${unit}</small>` : ''}</b>${sub ? `<em>${sub}</em>` : ''}${p != null ? `<div class="m3-bar"><u data-w="${clamp(p, 0, 1).toFixed(3)}"></u></div>` : ''}</div>`;
  const head = (icn, cls, ey, h, p, aim) => `<div class="m3-ph"><i class="m3-pi ${cls || ''}">${icn}</i><div class="m3-pt"><span class="m3-ey">${ey}</span><h3>${h}</h3>${p ? `<p>${p}</p>` : ''}</div><div class="m3-pa">${aim ? `<button type="button" data-m3="aim" aria-label="Inquadra">${ic('target')}</button>` : ''}<button type="button" data-m3="pclose" aria-label="Chiudi">${ic('x')}</button></div></div>`;
  const locChip = x => { const p2 = P.byArt.get(x.id); return p2 ? `<button type="button" class="m3-loc${p2.auto ? ' auto' : ''}" data-loc3="${esc(x.id)}" title="${p2.auto ? 'Ubicazione automatica: tocca per spostare' : 'Ubicazione: tocca per spostare'}">${ic('pin', ' style="width:11px;height:11px"')}${esc(p2.code)}</button>` : (canEdit() ? `<button type="button" class="m3-loc auto" data-loc3="${esc(x.id)}">${ic('pin', ' style="width:11px;height:11px"')}assegna</button>` : ''); };
  const artRow = (x, hl) => { const st = x.out ? '<span class="m3-chip n"><i></i>Esaurito</span>' : x.low ? '<span class="m3-chip a"><i></i>Sotto scorta</span>' : '<span class="m3-chip g"><i></i>Ok</span>';
    const p2 = x.s > 0 ? Math.min(1, Math.max(0, x.g) / (x.s * 3)) : (x.out ? 0 : 1);
    return `<div class="m3-row${hl ? ' k' : ''}" data-art3="${esc(x.id)}">${donut(p2, x.out ? '#c9cbcf' : x.low ? '#ef6a45' : OR)}<span class="tx"><b>${esc(x.a.descrizione || 'Articolo')}</b><small>${esc([x.a.codice, N(x.g) + ' ' + (x.a.um || 'pz'), x.s ? 'min. ' + N(x.s) : ''].filter(Boolean).join(' · '))}</small></span>${locChip(x)}${st}${canW() ? `<button type="button" class="pm" data-gx="mov-art" data-id="${esc(x.id)}" title="Carico / scarico">±</button>` : ''}</div>`; };
  const mvRow = m => { const a = C.artOf(m.articolo), q = C.num(m.quantita); return `<div class="m3-row"><i class="m3-pi" style="width:30px;height:30px;border-radius:9px">${ic(m.tipo === 'rettifica' ? 'check' : q > 0 ? 'box' : 'truck')}</i><span class="tx"><b>${esc(a ? a.descrizione : 'Articolo eliminato')}</b><small>${esc([C.dIt(m.data), m.causale, C.magMulti() ? C.magOf(m) : ''].filter(Boolean).join(' · '))}</small></span><span class="m3-chip ${q > 0 ? 'g' : 'a'}">${q > 0 ? '+' : ''}${N(q)}</span></div>`; };
  const rackOf = id => L.items.find(i => i.id === id && i.t === 'rack');
  const rackArts = it => D.arts.filter(x => { const p2 = P.byArt.get(x.id); return p2 && p2.rk === it; });

  function panel(k) {
    const el = $('.m3-panel'); let h = '';
    const Pn = k || { t: 'zone', z: 'all' };
    if ((Pn.t === 'zone' && Pn.z === 'flotta') || Pn.t === 'fuel' || Pn.t === 'veh') { h = fleetPanel(Pn); if (!h) return panel(); }
    else if (Pn.t === 'zone' && Pn.z === 'all') {
      const todo = D.low.length + D.out.length + D.trf.length;
      h = head(ic('logo'), 'or', 'Magazzino · in tempo reale', esc(C.orgName()), 'Ricevimento · stoccaggio · preparazione · spedizione') + `<div class="m3-pb"><div class="m3-grid">
        ${stat('Pezzi in giacenza', N(D.tot), '', `${D.nArt} articoli`, D.nArt ? D.disp / D.nArt : 0)}
        ${stat('Ubicazioni occupate', N(P.byArt.size), '', `su ${N(P.racks.reduce((s, r) => s + r.bays * r.lv, 0))} vani`, P.racks.reduce((s, r) => s + r.bays * r.lv, 0) ? P.byArt.size / P.racks.reduce((s, r) => s + r.bays * r.lv, 0) : 0)}
        ${stat('Valore al costo', C.eur0(D.val), '', C.ivaLbl())}
        ${stat('Sotto scorta', D.low.length, '', D.low.length ? 'da riordinare' : 'tutto a posto')}
        ${stat('Movimenti del mese', D.MM.length, '', `${D.MM.filter(m => C.num(m.quantita) > 0).length} carichi · ${D.MM.filter(m => C.num(m.quantita) < 0).length} scarichi`)}
        ${stat('DDT del mese', D.ddtM.length, '', `${N(D.ddtM.reduce((s, x) => s + C.num(x.d.colli), 0))} colli`)}</div>
        ${isAutoLayout() && canEdit() ? `<div class="m3-warn">${ic('pencil')}<span>Questa è la disposizione automatica. Con <b>Progetta</b> disegni il tuo magazzino: scaffali, zone, banchine e ubicazioni.</span></div>` : ''}
        <div class="m3-h4">Da gestire <em>${todo}</em></div><div class="m3-rows">
        ${D.trf.map(x => `<div class="m3-row"><i class="m3-pi" style="width:30px;height:30px;border-radius:9px">${ic('truck')}</i><span class="tx"><b>${esc(C.xiNum(x))} in viaggio</b><small>${esc((x.mag || 'Magazzino') + ' → ' + (x.mag2 || x.dest || ''))} · ${N(C.xiPz(x))} pz</small></span><span class="m3-chip a"><i></i>In viaggio</span></div>`).join('')}
        ${D.low.slice(0, 12).map(x => artRow(x)).join('')}${D.out.slice(0, 8).map(x => artRow(x)).join('')}
        ${todo ? '' : '<div class="m3-empty">Niente da gestire: giacenze sopra la scorta minima.</div>'}</div></div>`;
    } else if (Pn.t === 'zone' && Pn.z === 'stk') {
      const R2 = P.racks, nv = R2.reduce((s, r) => s + r.bays * r.lv, 0);
      h = head(ic('rack'), '', 'Zona', 'Scaffalature', `${R2.length} scaffali · ${N(nv)} ubicazioni`, 1) + `<div class="m3-pb"><div class="m3-grid">
        ${stat('Vani occupati', N(P.byArt.size), '', `su ${N(nv)}`, nv ? P.byArt.size / nv : 0)}${stat('Senza ubicazione', P.unplaced.length, '', P.unplaced.length ? 'servono più scaffali' : 'tutto a scaffale')}</div>
        <div class="m3-h4">Scaffali <em>${R2.length}</em></div><div class="m3-rows">${R2.map(r => { const c = D.catOf.get(r.cat), n = rackArts(r).length, lw = rackArts(r).filter(x => x.low).length; return `<button type="button" class="m3-row" data-rack3="${esc(r.id)}"><span class="m3-pi dk" style="width:30px;height:30px;border-radius:9px;font-size:11px;background:${c ? c.colH : '#e7e5e1'};color:#17191c">${esc(r.code)}</span><span class="tx"><b>${esc(r.cat || KIND[r.k].n)}</b><small>${KIND[r.k].n} · ${r.bays}×${r.lv} · ${n} articoli</small></span>${lw ? `<span class="m3-chip a">${lw} sotto</span>` : `<span class="m3-chip n">${pc(n, r.bays * r.lv)} %</span>`}</button>`; }).join('') || '<div class="m3-empty">Nessuno scaffale: aggiungili con Progetta</div>'}</div>
        ${P.unplaced.length ? `<div class="m3-h4">Senza ubicazione <em>${P.unplaced.length}</em></div><div class="m3-rows m3-ilist">${P.unplaced.slice(0, 30).map(x => artRow(x)).join('')}</div>` : ''}</div>`;
    } else if (Pn.t === 'rack') {
      const it = rackOf(Pn.id); if (!it) return panel();
      const A2 = rackArts(it), c = D.catOf.get(it.cat), pz = A2.reduce((s, x) => s + Math.max(0, x.g), 0), val = A2.reduce((s, x) => s + x.val, 0), lw = A2.filter(x => x.low), nv = it.bays * it.lv;
      const cells = []; for (let l = it.lv - 1; l >= 0; l--) for (let b = 0; b < it.bays; b++) { const x = P.cells.get(P.ck(it.id, b, l)); cells.push(`<i class="${!x ? 'e' : x.low ? 'l' : x.out ? '' : 'f'}${x && x.id === Pn.art ? ' k' : ''}" ${x ? `data-art3="${esc(x.id)}"` : ''} title="${esc(locCode(it, b, l) + (x ? ' · ' + x.a.descrizione : ' · libero'))}"></i>`); }
      h = head(`<b style="font-size:13px">${esc(it.code)}</b>`, 'dk', `${KIND[it.k].n} · ${it.bays} campate · ${it.lv} livelli`, esc(it.cat || 'Scaffale libero'), `${A2.length} articoli in ${nv} vani`, 1) + `<div class="m3-pb">
        <div class="m3-chips">${lw.length ? `<span class="m3-chip a"><i></i>${lw.length} sotto scorta</span>` : '<span class="m3-chip g"><i></i>Scorte ok</span>'}<span class="m3-chip n">${nv - A2.length} vani liberi</span></div>
        <div class="m3-grid">${stat('Pezzi', N(pz), '', `${A2.filter(x => !x.out).length}/${A2.length} disponibili`, A2.length ? A2.filter(x => !x.out).length / A2.length : 0)}${stat('Valore al costo', C.eur0(val), '', C.ivaLbl())}</div>
        <div class="m3-h4">Mappa dei vani <em>dall'alto in basso</em></div><div class="m3-cells" style="grid-template-columns:repeat(${it.bays},1fr)">${cells.join('')}</div>
        ${lw.length ? `<div class="m3-warn">${ic('alert')}<span>${lw.length === 1 ? `<b>${esc(lw[0].a.descrizione)}</b> è sotto la scorta minima` : `<b>${lw.length} articoli</b> sotto la scorta minima`} · da riordinare.</span></div>${canW() ? `<button type="button" class="m3-go" data-gx="mov-art" data-id="${esc(lw[0].id)}">${ic('check')}Registra il carico</button>` : ''}` : ''}
        <div class="m3-h4">Articoli <em>${A2.length}</em></div><div class="m3-rows m3-ilist">${A2.sort((a, b) => P.byArt.get(a.id).code.localeCompare(P.byArt.get(b.id).code)).slice(0, 80).map(x => artRow(x, x.id === Pn.art)).join('') || '<div class="m3-empty">Scaffale vuoto</div>'}</div>
        ${canEdit() ? `<button type="button" class="m3-go ghost" data-m3="edrack" data-id="${esc(it.id)}">${ic('pencil')}Modifica lo scaffale</button>` : ''}</div>`;
    } else if (Pn.t === 'loc') {
      const x = D.arts.find(a => a.id === Pn.art); if (!x) return panel();
      const cur = P.byArt.get(x.id), R2 = P.racks, rk = rackOf(Pn.r) || (cur && cur.rk) || R2[0];
      if (!rk) h = head(ic('pin'), '', 'Ubicazione', esc(x.a.descrizione), '') + `<div class="m3-pb"><div class="m3-empty">Non ci sono scaffali: aggiungili con Progetta.</div></div>`;
      else {
        const b = Pn.b != null ? Pn.b : cur && cur.rk === rk ? cur.b : 0, l = Pn.l != null ? Pn.l : cur && cur.rk === rk ? cur.l : 0, occ = P.cells.get(P.ck(rk.id, b, l));
        h = head(ic('pin'), 'or', 'Ubicazione articolo', esc(x.a.descrizione), cur ? `ora in <b>${esc(cur.code)}</b>${cur.auto ? ' (automatica)' : ''}` : 'senza ubicazione') + `<div class="m3-pb">
          <label class="m3-f"><span>Scaffale</span><select data-locf="r">${R2.map(r => `<option value="${esc(r.id)}"${r === rk ? ' selected' : ''}>${esc(r.code)} · ${esc(r.cat || KIND[r.k].n)}</option>`).join('')}</select></label>
          <div class="m3-fr"><label class="m3-f"><span>Campata</span><select data-locf="b">${Array.from({ length: rk.bays }, (_, i) => `<option value="${i}"${i === b ? ' selected' : ''}>${String(i + 1).padStart(2, '0')}</option>`).join('')}</select></label>
          <label class="m3-f"><span>Livello</span><select data-locf="l">${Array.from({ length: rk.lv }, (_, i) => `<option value="${i}"${i === l ? ' selected' : ''}>${i + 1}${i === 0 ? ' (a terra)' : ''}</option>`).join('')}</select></label></div>
          <div class="m3-cells" style="grid-template-columns:repeat(${rk.bays},1fr)">${(() => { const o = []; for (let ll = rk.lv - 1; ll >= 0; ll--) for (let bb = 0; bb < rk.bays; bb++) { const y = P.cells.get(P.ck(rk.id, bb, ll)); o.push(`<i class="${!y ? 'e' : y.id === x.id ? 'f' : y.low ? 'l' : ''}${bb === b && ll === l ? ' k' : ''}" data-lcell="${bb}|${ll}" title="${esc(locCode(rk, bb, ll) + (y ? ' · ' + y.a.descrizione : ' · libero'))}"></i>`); } return o.join(''); })()}</div>
          <div class="${occ && occ.id !== x.id ? 'm3-warn' : 'm3-ok'}">${ic(occ && occ.id !== x.id ? 'alert' : 'check')}<span><b>${esc(locCode(rk, b, l))}</b> · ${occ ? (occ.id === x.id ? 'è già qui' : `occupato da <b>${esc(occ.a.descrizione)}</b>: i due articoli si scambiano di posto`) : 'libero'}</span></div>
          <button type="button" class="m3-go" data-m3="locsave" data-art="${esc(x.id)}" data-r="${esc(rk.id)}" data-b="${b}" data-l="${l}">${ic('pin')}Sposta qui</button>
          ${L.loc[x.id] ? `<button type="button" class="m3-go ghost" data-m3="locauto" data-art="${esc(x.id)}">${ic('auto')}Torna automatica</button>` : ''}</div>`;
        sel = { t: 'loc', art: x.id, r: rk.id, b, l }; highlightCell(rk, b, l);
      }
    } else if (Pn.t === 'zone' && Pn.z === 'ric') {
      const pz = D.car30.reduce((s, m) => s + C.num(m.quantita), 0);
      h = head(ic('dock'), '', 'Zona', 'Ricevimento merci', 'Arrivi dai fornitori · scarico · controllo colli', 1) + `<div class="m3-pb"><div class="m3-grid">
        ${stat('Carichi in 30 giorni', D.car30.length, '', `${N(pz)} pezzi`)}${stat('Ultimo arrivo', D.car[0] ? C.dIt(D.car[0].data) : '—', '', D.car[0] ? esc(D.car[0].causale || '') : 'nessun carico')}</div>
        ${canW() ? `<button type="button" class="m3-go" data-gx="mov-new">${ic('plus')}Nuovo carico</button>` : ''}
        <div class="m3-h4">Ultimi arrivi <em>${D.car.length}</em></div><div class="m3-rows">${D.car.slice(0, 20).map(mvRow).join('') || '<div class="m3-empty">Nessun carico registrato</div>'}</div></div>`;
    } else if ((Pn.t === 'zone' && Pn.z === 'pre') || Pn.t === 'belt' || Pn.t === 'desk') {
      const pz = D.ddtM.reduce((s, x) => s + x.pz, 0);
      h = head(ic('hand'), '', Pn.t === 'belt' ? 'Nastro trasportatore' : Pn.t === 'desk' ? 'Bancone di preparazione' : 'Zona', 'Preparazione ordini', 'Prelievo dagli scaffali · imballo · DDT', 1) + `<div class="m3-pb"><div class="m3-grid">
        ${stat('DDT del mese', D.ddtM.length, '', `${N(pz)} pezzi preparati`)}${stat('Colli del mese', N(D.ddtM.reduce((s, x) => s + C.num(x.d.colli), 0)), '', 'dai DDT')}</div>
        <button type="button" class="m3-go" data-gx="ddt-new">${ic('plus')}Nuovo DDT</button>
        <div class="m3-h4">Ultimi scarichi <em>${D.scar.length}</em></div><div class="m3-rows">${D.scar.slice(0, 16).map(mvRow).join('') || '<div class="m3-empty">Nessuno scarico</div>'}</div></div>`;
    } else if (Pn.t === 'zone' && Pn.z === 'cq') {
      h = head(ic('shield'), '', 'Zona', 'Controllo e inventario', 'Verifica dei colli · rettifiche di inventario', 1) + `<div class="m3-pb"><div class="m3-grid">
        ${stat('Rettifiche in 90 gg', D.ret90.length, '', D.ret[0] ? 'ultima ' + C.dIt(D.ret[0].data) : 'nessuna')}${stat('Da verificare', D.low.length + D.out.length, '', 'sotto scorta o esauriti', D.nArt ? 1 - (D.low.length + D.out.length) / D.nArt : 1)}</div>
        ${D.out.length ? `<div class="m3-warn">${ic('alert')}<span><b>${D.out.length} ${D.out.length === 1 ? 'articolo esaurito' : 'articoli esauriti'}</b> con scorta minima impostata · conta e rettifica se la giacenza non torna.</span></div>` : ''}
        ${canW() ? `<button type="button" class="m3-go" data-gx="mov-new">${ic('check')}Rettifica di inventario</button>` : ''}
        <div class="m3-h4">Ultime rettifiche <em>${D.ret.length}</em></div><div class="m3-rows">${D.ret.slice(0, 16).map(mvRow).join('') || '<div class="m3-empty">Nessuna rettifica di inventario</div>'}</div></div>`;
    } else if (Pn.t === 'zone' && Pn.z === 'spe') {
      h = head(ic('truck'), '', 'Zona', 'Spedizioni', 'Banchine · carico camion · consegne ai clienti', 1) + `<div class="m3-pb"><div class="m3-grid">
        ${stat('DDT del mese', D.ddtM.length, '', `${N(D.ddtM.reduce((s, x) => s + C.num(x.d.colli), 0))} colli`)}${stat('Da fatturare', D.ddt.filter(x => !x.d.fattura).length, '', 'DDT senza fattura', D.ddt.length ? D.ddt.filter(x => x.d.fattura).length / D.ddt.length : 0)}</div>
        <button type="button" class="m3-go" data-gx="ddt-new">${ic('plus')}Nuovo DDT</button>
        <div class="m3-h4">Spedizioni <em>${D.ddt.length}</em></div><div class="m3-rows">${D.ddt.slice(0, 20).map(x => { const i = trucks.findIndex(t => t.d === x); return `<button type="button" class="m3-row" ${i >= 0 ? `data-trk3="${i}"` : `data-gx="ddt-pdf" data-id="${esc(x.d.id)}"`}><i class="m3-pi" style="width:30px;height:30px;border-radius:9px">${ic('truck')}</i><span class="tx"><b>DDT ${esc(C.dnum(x.d))} · ${esc(x.cliN)}</b><small>${esc([C.dIt(x.d.data), C.num(x.d.colli) ? N(C.num(x.d.colli)) + ' colli' : '', x.R.length + ' righe'].filter(Boolean).join(' · '))}</small></span>${x.d.fattura ? '<span class="m3-chip g"><i></i>Fatturato</span>' : '<span class="m3-chip a"><i></i>Da fatturare</span>'}</button>`; }).join('') || '<div class="m3-empty">Nessun DDT</div>'}</div></div>`;
    } else if (Pn.t === 'zone' && (Pn.z === 'uffe' || Pn.z === 'uff')) {
      const V = (C.fv ? C.fv() : []), da = V.filter(f => f.stato !== 'pagata');
      h = head(ic('office'), '', 'Edificio', 'Uffici', esc(C.orgName()) + ' · clienti e documenti', 1) + `<div class="m3-pb"><div class="m3-grid">
        ${stat('Clienti', D.cli.length, '', 'in anagrafica')}${stat('Fatture da incassare', da.length, '', C.eur0(da.reduce((s, f) => s + C.num(f.totale), 0)), V.length ? 1 - da.length / V.length : 1)}</div>
        <div class="m3-h4">Clienti serviti <em>${new Set(D.ddt.map(x => x.d.cliente)).size}</em></div><div class="m3-rows">${[...new Map(D.ddt.map(x => [x.d.cliente, x])).values()].slice(0, 12).map(x => `<div class="m3-row"><i class="m3-pi" style="width:30px;height:30px;border-radius:9px">${ic('users')}</i><span class="tx"><b>${esc(x.cliN)}</b><small>${esc([x.citta, 'ultimo DDT ' + C.dIt(x.d.data)].filter(Boolean).join(' · '))}</small></span></div>`).join('') || '<div class="m3-empty">Nessun cliente servito</div>'}</div></div>`;
    } else if (Pn.t === 'zone') {
      const z = L.items.find(i => i.id === Pn.id) || {}, Z2 = ZONE[Pn.z] || ZONE.free;
      h = head(ic(Z2[3]), '', 'Zona', esc(z.name || Z2[0]), `${N(z.w || 0)} × ${N(z.d || 0)} m · ${N((z.w || 0) * (z.d || 0))} m²`, 1) + `<div class="m3-pb">${canEdit() ? `<button type="button" class="m3-go ghost" data-m3="edrack" data-id="${esc(z.id || '')}">${ic('pencil')}Modifica la zona</button>` : ''}</div>`;
    } else if (Pn.t === 'dock') {
      const t = trucks.find(tr => tr.dock === Pn.id); if (t) { const i = trucks.indexOf(t); return select({ t: 'truck', i }, 1); }
      h = head(ic('dock'), '', 'Banchina', 'Banchina libera', 'Nessun camion in carico', 1) + `<div class="m3-pb"><button type="button" class="m3-go" data-gx="ddt-new">${ic('plus')}Nuovo DDT</button></div>`;
    } else if (Pn.t === 'truck') {
      const t = trucks[Pn.i]; if (!t) return panel();
      if (!t.d) h = head(ic('truck'), '', 'Camion', 'In banchina', 'Nessun DDT collegato', 1) + `<div class="m3-pb"><button type="button" class="m3-go" data-gx="ddt-new">${ic('plus')}Nuovo DDT</button></div>`;
      else if (t.d.trf) { const x = t.d.trf; h = head(ic('truck'), '', 'Camion · trasferimento', `<span class="m3-plate">${esc(C.xiNum(x))}</span>`, 'Trasferimento tra magazzini', 1) + `<div class="m3-pb"><div class="m3-chips"><span class="m3-chip"><i></i>In viaggio</span></div><div class="m3-grid">${stat('Pezzi', N(C.xiPz(x)), '', `${(x.righe || []).length} righe`)}${stat('Partito il', C.dIt(x.data), '', '')}</div>
          <div class="m3-h4">Spedizione</div><div class="m3-ship"><i>${ic('route')}</i><div><b>${esc((x.mag || 'Magazzino') + ' → ' + (x.mag2 || x.dest || ''))}</b><small>Le quantità entrano nel magazzino di arrivo alla conferma della ricezione.</small></div></div></div>`; }
      else { const x = t.d, d = x.d;
        h = head(ic('truck'), '', 'Camion · ' + (t.road ? 'spedito' : 'in banchina'), `<span class="m3-plate">DDT ${esc(C.dnum(d))}</span>`, esc(x.cliN), 1) + `<div class="m3-pb">
        <div class="m3-chips"><span class="m3-chip">${t.road ? '<i></i>Spedito' : '<i></i>In banchina'}</span>${d.fattura ? '<span class="m3-chip g">Fatturato</span>' : '<span class="m3-chip a">Da fatturare</span>'}</div>
        <div class="m3-grid">${stat('Colli', d.colli ? N(C.num(d.colli)) : '—', '', esc(d.aspetto || ''))}${stat('Peso', d.peso ? N(C.num(d.peso)) : '—', d.peso ? 'kg' : '', '')}${stat('Pezzi', N(x.pz), '', `${x.R.length} righe`)}${stat('Trasporto', esc(d.trasporto || '—'), '', esc(d.vettore || ''))}</div>
        <div class="m3-h4">Spedizione <em>${esc(C.dIt(d.data))}</em></div>
        <div class="m3-ship"><i>${ic('route')}</i><div style="flex:1;min-width:0"><b>${esc(C.orgName().split(' ')[0])} → ${esc(x.citta || x.cliN)}</b><small>${esc([d.causale || 'Vendita', C.num(d.colli) ? N(C.num(d.colli)) + ' colli' : '', d.destinazione].filter(Boolean).join(' · '))}</small></div></div>
        <div class="m3-tl">${x.R.slice(0, 8).map(l => { const p2 = P.byArt.get(l.art); return `<div><b>${N(C.num(l.q))} ${esc(l.um || '')}</b>${esc(l.d || '')} <span>${esc([l.c, p2 && p2.code].filter(Boolean).join(' · '))}</span></div>`; }).join('')}</div>
        <button type="button" class="m3-go" data-gx="ddt-pdf" data-id="${esc(d.id)}">${ic('pdf')}Apri il DDT</button></div>`; }
    }
    el.innerHTML = h;
    root.classList.remove('np'); root.classList.add('pn');
    requestAnimationFrame(() => $$('.m3-bar u', el).forEach(u => { u.style.width = (u.dataset.w * 100) + '%'; })); countUp(el); $$('.m3-cells i', el).forEach((c, i) => c.style.setProperty('--k', i));
    const hlEl = $('.m3-row.k', el); if (hlEl) setTimeout(() => { const pb = hlEl.closest('.m3-pb'); if (pb) pb.scrollTo({ top: Math.max(0, hlEl.offsetTop - pb.offsetTop - pb.clientHeight / 2 + hlEl.offsetHeight / 2), behavior: 'smooth' }); }, 150);
  }

  function zoneChip(z) {
    const n = ZN(z); $('.m3-zc').textContent = n[1]; $('.m3-zt b').textContent = n[0];
    const nv = P.racks.reduce((s, r) => s + r.bays * r.lv, 0);
    const sub = { flotta: D.gas ? `${D.gas.V.length} mezzi · ${N(Math.round(D.gas.lM))} L` : '', all: `${pc(D.disp, D.nArt)} % · ${N(D.tot)} pezzi`, ric: `${D.car30.length} carichi · 30 gg`, stk: `${N(P.byArt.size)}/${N(nv)} ubicazioni`, pre: `${D.ddtM.length} DDT · mese`, cq: `${D.ret90.length} rettifiche · 90 gg`, spe: `${D.ddt.filter(x => !x.d.fattura).length} da fatturare`, uffe: `${D.cli.length} clienti` }[z] || '';
    $('.m3-zt small').textContent = sub;
    $$('.m3-fs button[data-fgo]').forEach(b => b.classList.toggle('on', b.dataset.fgo === z && b.dataset.on === '1'));
  }
  function select(k, noFly) {
    if (EDIT) return;
    sel = k; stopTour(k && k._tour); if (hiMesh) hiMesh.visible = false; if (!k || !(k.t === 'rack' && k.art)) { unfocus(); hoverArt(null); } if (!k || k.t !== 'rack' || k.art) { xrayOff(RX); RX = []; }
    if (!k) { root.classList.add('np'); root.classList.remove('pn'); zoneChip('all'); return; }
    if (k.t === 'zone') { zoneChip(['ric', 'stk', 'pre', 'cq', 'spe', 'uffe', 'all', 'flotta'].includes(k.z) ? k.z : 'all'); if (!noFly) { const z = k.id && L.items.find(i => i.id === k.id); if (z && !['ric', 'pre', 'cq', 'spe'].includes(k.z)) flyT({ x: z.x, z: z.z, dist: Math.max(z.w, z.d) * 1.6 + 26, az: -0.6, pol: .92 }); else flyT(zoneTarget(k.z === 'uff' ? 'uffe' : k.z)); } }
    else if (k.t === 'rack') { zoneChip('stk'); const it = rackOf(k.id); if (it) { if (k.art) { const p2 = P.byArt.get(k.art); if (p2 && p2.rk === it) { hoverArt(null); focusCell(it, p2.b, p2.l, k.art); if (!noFly) rackView(it, cellLocal(it, p2.b, p2.l)); xrayFor(); } } else { if (!noFly) rackView(it); scanRack(it); xrayRack(it); } } }
    else if (k.t === 'fuel') { zoneChip('flotta'); if (!noFly) { const F = FL(); fly({ tx: F.st.x - 2, ty: 1.5, tz: F.st.z, dist: 40, az: -0.85, pol: 1.02 }); } }
    else if (k.t === 'veh') { zoneChip('flotta'); const f = fleetVeh.find(x => x.v.p === k.p); if (f && !noFly) { const p2 = new T.Vector3(); f.o.getWorldPosition(p2); fly({ tx: p2.x, ty: 1, tz: p2.z, dist: 21, az: f.o.rotation.y + Math.PI / 2 - .7, pol: .86 }); } }
    else if (k.t === 'truck') { zoneChip('spe'); const t = trucks[k.i]; if (t && !noFly) { const p2 = new T.Vector3(); t.g.getWorldPosition(p2); fly({ tx: p2.x, tz: p2.z, dist: 62, az: t.road ? -0.35 : 0.65, pol: .96 }); } }
    else if (k.t === 'belt' || k.t === 'desk' || k.t === 'dock' || k.t === 'wall') { zoneChip(k.t === 'dock' ? 'spe' : 'pre'); if (!noFly) { const it = L.items.find(i => i.id === k.id); if (it) fly({ tx: it.x, tz: it.z, dist: 40, az: -0.5, pol: .95 }); } }
    if (k.t === 'wall') return;
    panel(k);
  }
  function kpis() {
    $('.m3-kpis').innerHTML = `<div class="m3-kpi m3-card" data-m3="zall"><i>${ic('box')}</i><div><span>Pezzi in magazzino</span><b>${N(D.tot)}<em>${pc(D.disp, D.nArt)} %</em></b><small>${D.nArt} articoli · ${C.eur0(D.val)}</small></div></div>
      <div class="m3-kpi m3-card" data-m3="zspe"><i>${ic('truck')}</i><div><span>Spedizioni del mese</span><b>${D.ddtM.length}<em>${N(D.ddtM.reduce((s, x) => s + C.num(x.d.colli), 0))} colli</em></b><small>${D.ddt.filter(x => !x.d.fattura).length} DDT da fatturare</small></div></div>` + (D.gas ? `<div class="m3-kpi m3-card" data-m3="zgas"><i>${ic('fuel')}</i><div><span>Gasolio del mese</span><b>${N(Math.round(D.gas.lM))}<em>litri</em></b><small>${D.gas.nM} rifornimenti · ${D.gas.V.length} mezzi</small></div></div>` : '');
    const n = D.low.length + D.out.length + D.trf.length, b = $('.m3-bell em'); b.hidden = !n; b.textContent = n > 99 ? '99+' : n;
    const st = [['fornitori', 'Fornitori', 'factory', 'ric', 0], ['ric', 'Ricevimento', 'dock', 'ric', 1], ['stk', 'Scaffalature', 'rack', 'stk', 1], ['pre', 'Preparazione', 'hand', 'pre', 1], ['cq', 'Controllo', 'shield', 'cq', 1], ['spe', 'Spedizione', 'truck', 'spe', 1], ['mez', 'Mezzi', 'fuel', 'flotta', 1], ['cli', 'Clienti', 'users', 'uffe', 0]].filter(s => s[3] === 'uffe' || zoneTarget(s[3]));
    $('.m3-flow').innerHTML = `<div class="m3-fh">${ic('flow')}Flusso del magazzino<em>fornitore → cliente · in tempo reale</em></div><div class="m3-fs">${st.map(([k, l, icn, z, on], i) => `${i ? '<b class="sep"></b>' : ''}<button type="button" data-fgo="${z}" data-on="${on}" class="${k === 'cq' && D.out.length || k === 'stk' && D.low.length ? 'w' : ''}"><i>${ic(icn)}</i>${l}</button>`).join('')}</div>`;
    table(table.k || 'cor');
    $('.m3-menu[data-menu="zones"]').innerHTML = zoneKinds().map(z => `<button type="button" data-zsel="${z}"><span class="zc">${ZN(z)[1]}</span>${ZN(z)[0]}</button>`).join('');
    $('.m3-menu[data-menu="shots"]').innerHTML = [['all', 'Panoramica'], ['top', 'Pianta dall\'alto'], ['stk', 'Tra gli scaffali'], ['spe', 'Banchine e camion'], ['pre', 'Nastro e preparazione'], ['low', 'Vista bassa']].map(([k, l]) => `<button type="button" data-shot="${k}">${ic('cam')}${l}</button>`).join('');
  }
  function table(k) {
    table.k = k;
    const tabs = [['cor', 'Scaffali', P.racks.length], ['mov', 'Movimenti', D.MM.length], ['spe', 'Spedizioni', D.ddtM.length], ...(D.gas ? [['mez', 'Mezzi', D.gas.V.length]] : []), ['low', 'Riordino', D.low.length]];
    let rows = '';
    if (k === 'cor') rows = P.racks.map(r => { const c = D.catOf.get(r.cat), A2 = rackArts(r), top = A2.slice().sort((a, b) => b.g - a.g)[0], lw = A2.filter(x => x.low).length; return `<button type="button" data-rack3="${esc(r.id)}"><span class="c1"><b>${esc(r.code)}</b><small>${esc(r.cat || KIND[r.k].n)}</small></span><span class="c2"><i style="background:${c ? c.colH : '#c9c6c0'}"></i>${esc(top ? top.a.descrizione : 'vuoto')}${top ? ' · ' + N(top.g) : ''}</span>${lw ? '<span class="m3-chip a">Sotto scorta</span>' : '<span class="m3-chip g"><i></i>Ok</span>'}<span class="c4">${pc(A2.length, r.bays * r.lv)} %</span><span class="c5">›</span></button>`; }).join('');
    else if (k === 'mov') rows = D.MM.slice().sort((a, b) => String(b.data).localeCompare(String(a.data))).slice(0, 40).map(m => { const a = C.artOf(m.articolo), q = C.num(m.quantita), p2 = P.byArt.get(m.articolo); return `<button type="button" ${p2 ? `data-art3="${esc(m.articolo)}"` : ''}><span class="c1"><b>${esc(C.dIt(m.data).slice(0, 5))}</b><small>${esc(p2 ? p2.code : m.tipo || '')}</small></span><span class="c2">${esc(a ? a.descrizione : 'Articolo eliminato')}</span><span class="m3-chip ${q > 0 ? 'g' : 'a'}">${q > 0 ? '+' : ''}${N(q)}</span><span class="c4">${esc((m.causale || '').slice(0, 8))}</span><span class="c5">›</span></button>`; }).join('');
    else if (k === 'spe') rows = D.ddtM.slice(0, 30).map(x => { const i = trucks.findIndex(t => t.d === x); return `<button type="button" ${i >= 0 ? `data-trk3="${i}"` : `data-gx="ddt-pdf" data-id="${esc(x.d.id)}"`}><span class="c1"><b>${esc(C.dnum(x.d))}</b><small>${esc(C.dIt(x.d.data).slice(0, 5))}</small></span><span class="c2">${esc(x.cliN)}</span>${x.d.fattura ? '<span class="m3-chip g">Fatturato</span>' : '<span class="m3-chip a">Da fatturare</span>'}<span class="c4">${N(C.num(x.d.colli))} colli</span><span class="c5">›</span></button>`; }).join('');
    else if (k === 'mez' && D.gas) rows = D.gas.V.map(v => `<button type="button" data-veh3="${esc(v.p)}"><span class="c1"><b>${esc(plFmt(v.p))}</b><small>${esc(v.name || v.kind)}</small></span><span class="c2">${esc(v.drv.join(', ') || v.uso || '—')}</span><span class="m3-chip ${v.lM ? 'g' : 'n'}">${N(Math.round(v.lM))} L</span><span class="c4">${v.cons ? v.cons.toFixed(1).replace('.', ',') + ' km/L' : '—'}</span><span class="c5">›</span></button>`).join('');
    else rows = D.low.slice(0, 40).map(x => { const p2 = P.byArt.get(x.id); return `<button type="button" data-art3="${esc(x.id)}"><span class="c1"><b>${esc(p2 ? p2.code : x.a.codice || '—')}</b><small>min. ${N(x.s)}</small></span><span class="c2">${esc(x.a.descrizione)}</span><span class="m3-chip a">${N(x.g)} ${esc(x.a.um || '')}</span><span class="c4">${pc(x.g, x.s)} %</span><span class="c5">›</span></button>`; }).join('');
    $('.m3-tab').innerHTML = `<div class="m3-tt"><i>${ic('chart')}</i>${tabs.map(([kk, l, n]) => `<button type="button" data-tab3="${kk}" class="${kk === k ? 'on' : ''}">${l}<em>${n}</em></button>`).join('')}</div><div class="m3-tr">${rows || '<div class="m3-empty">Niente da mostrare</div>'}</div>`;
  }
  function focusArt(id) {
    const x = D.arts.find(a => a.id === id); if (!x) return;
    const p2 = P.byArt.get(id);
    if (p2) select({ t: 'rack', id: p2.rk.id, art: id }); else { select({ t: 'zone', z: 'stk' }); toast('Articolo senza ubicazione'); }
  }
  function search(q) {
    const res = $('.m3-res'), s = String(q || '').trim().toLowerCase();
    if (!s) { res.classList.remove('on'); res.innerHTML = ''; return; }
    const A2 = D.arts.filter(x => { const p2 = P.byArt.get(x.id); return [x.a.codice, x.a.codForn, x.a.descrizione, x.a.barcode, x.a.categoria, p2 && p2.code].join(' ').toLowerCase().includes(s); }).slice(0, 7);
    const Dd = D.ddt.filter(x => ('ddt ' + C.dnum(x.d) + ' ' + x.cliN).toLowerCase().includes(s)).slice(0, 4);
    const Rr = P.racks.filter(r => (r.code + ' ' + r.cat).toLowerCase().includes(s)).slice(0, 4);
    const zs = zoneKinds().filter(z => ZN(z)[0].toLowerCase().includes(s)).slice(0, 2);
    const h = A2.map(x => { const p2 = P.byArt.get(x.id); return `<button type="button" data-art3="${esc(x.id)}"><i>${esc(p2 ? p2.code.split('-')[0] : 'ART')}</i><span><b>${esc(x.a.descrizione)}</b><small>${esc([p2 ? p2.code : 'senza ubicazione', N(x.g) + ' ' + (x.a.um || 'pz'), x.out ? 'esaurito' : x.low ? 'sotto scorta' : ''].filter(Boolean).join(' · '))}</small></span></button>`; }).join('')
      + Rr.map(r => `<button type="button" data-rack3="${esc(r.id)}"><i>${esc(r.code)}</i><span><b>Scaffale ${esc(r.code)} · ${esc(r.cat || KIND[r.k].n)}</b><small>${rackArts(r).length} articoli · ${r.bays * r.lv} vani</small></span></button>`).join('')
      + Dd.map(x => { const i = trucks.findIndex(t => t.d === x); return `<button type="button" ${i >= 0 ? `data-trk3="${i}"` : `data-gx="ddt-pdf" data-id="${esc(x.d.id)}"`}><i>DDT</i><span><b>DDT ${esc(C.dnum(x.d))} · ${esc(x.cliN)}</b><small>${esc(C.dIt(x.d.data))}</small></span></button>`; }).join('')
      + (D.gas ? D.gas.V.filter(v => (v.p + ' ' + plFmt(v.p) + ' ' + v.name + ' ' + v.drv.join(' ')).toLowerCase().includes(s)).slice(0, 4).map(v => `<button type="button" data-veh3="${esc(v.p)}"><i>${ic('van', ' style="width:16px;height:16px"')}</i><span><b>${esc(plFmt(v.p))}${v.name ? ' · ' + esc(v.name) : ''}</b><small>${N(Math.round(v.lM))} L nel mese${v.drv.length ? ' · ' + esc(v.drv.join(', ')) : ''}</small></span></button>`).join('') : '')
      + zs.map(z => `<button type="button" data-zsel="${z}"><i>${ZN(z)[1]}</i><span><b>${ZN(z)[0]}</b><small>reparto</small></span></button>`).join('');
    res.innerHTML = h || '<p>Nessun risultato</p>'; res.classList.add('on');
  }
  let tourI = 0;
  function startTour() { tourOn = true; tourI = 0; $('[data-m3="play"]').innerHTML = ic('pause'); tourT = 0; nextTour(); }
  function stopTour(fromTour) { if (fromTour || !tourOn) return; tourOn = false; const b = $('[data-m3="play"]'); if (b) b.innerHTML = ic('play'); }
  function nextTour() { const seq = zoneKinds(); const z = seq[tourI % seq.length]; tourI++; select({ t: 'zone', z, _tour: 1 }); tourT = 0; }

  /* ubicazioni: spostamento manuale */
  function locSave(artId, rid, b, l) {
    const L2 = clone(L), cur = P.byArt.get(artId), occ = P.cells.get(P.ck(rid, b, l));
    if (occ && occ.id !== artId) { if (cur) L2.loc[occ.id] = { r: cur.rk.id, b: cur.b, l: cur.l }; else delete L2.loc[occ.id]; }
    L2.loc[artId] = { r: rid, b, l };
    if (saveLayout(L2, 'Ubicazione salvata')) { L = L2; rebuild(); focusArt(artId); }
  }

  /* ---------------- editor della disposizione (Progetta) ---------------- */
  const PALETTE = [
    ['Scaffali', [['pallet', 'Portapallet', 'pallet campate da 2,7 m', 'pallet'], ['shelf', 'A ripiani', 'cassette per minuteria', 'shelf']]],
    ['Zone', [['z:ric', 'Ricevimento', 'arrivo merce', 'dock'], ['z:pre', 'Preparazione', 'prelievo e imballo', 'hand'], ['z:cq', 'Controllo', 'verifiche e inventario', 'shield'], ['z:spe', 'Spedizioni', 'carico camion', 'truck'], ['z:terra', 'Area a terra', 'pallet a pavimento', 'floor'], ['z:free', 'Zona libera', 'con il nome che vuoi', 'zone']]],
    ['Elementi', [['dock', 'Banchina', 'porta di carico', 'dock'], ['wall', 'Muro', 'divisorio interno', 'wall'], ['belt', 'Nastro', 'trasportatore', 'belt'], ['desk', 'Bancone', 'postazione imballo', 'desk']]]
  ];
  function enterEdit() {
    if (!canEdit()) return toast('Solo il titolare può modificare la disposizione');
    stopTour(); sel = null;
    EDIT = { L: clone(L), sel: null, undo: [], dirty: false }; L = EDIT.L; EDW = L.W; EDD = L.D;
    root.classList.add('edit'); root.classList.remove('np'); root.classList.add('pn');
    $('.m3-pal').innerHTML = PALETTE.map(([h2, list]) => `<h4>${h2}</h4>${list.map(([k, n, s, icn]) => `<button type="button" data-add="${k}"><i>${ic(icn)}</i><span>${n}<small>${s}</small></span></button>`).join('')}`).join('') + '<p>Tocca un elemento per aggiungerlo al centro della vista, poi trascinalo dove vuoi. Gli spostamenti si agganciano ogni 50 cm.</p>';
    rebuild(); edPanel(); fly({ tx: 0, tz: 0, dist: Math.max(L.W, L.D) * 2.15, az: -0.15, pol: .42 });
  }
  let EDW = 0, EDD = 0;
  function exitEdit(saveIt) {
    if (!EDIT) return;
    if (saveIt) { const L2 = clone(EDIT.L); EDIT = null; saveLayout(L2, 'Disposizione salvata'); L = L2; }
    else { if (EDIT.dirty && !confirm('Uscire senza salvare le modifiche alla disposizione?')) return; EDIT = null; L = getLayout(); }
    root.classList.remove('edit'); if (selHelper) selHelper.visible = false;
    if (L.W !== EDW || L.D !== EDD) rebuildEnv(); rebuild(); select({ t: 'zone', z: 'all' });
  }
  function push() { EDIT.undo.push(JSON.stringify(EDIT.L)); if (EDIT.undo.length > 60) EDIT.undo.shift(); EDIT.dirty = true; }
  function undo() { if (!EDIT || !EDIT.undo.length) return toast('Niente da annullare'); EDIT.L = L = JSON.parse(EDIT.undo.pop()); if (EDIT.sel && !L.items.find(i => i.id === EDIT.sel)) EDIT.sel = null; rebuild(); edPanel(); }
  const edItem = () => EDIT && L.items.find(i => i.id === EDIT.sel);
  function inside(it) { const f = foot(it), hw = L.W / 2, hd = L.D / 2; if (it.t === 'dock') return; it.x = clamp(it.x, -hw + f.w / 2, hw - f.w / 2); it.z = clamp(it.z, -hd + f.d / 2, hd - f.d / 2); }
  function dockSnap(it, x, z) { const hw = L.W / 2, hd = L.D / 2, d = [[hw - x, 1], [hd - z, 0], [x + hw, 3], [z + hd, 2]].sort((a, b) => a[0] - b[0])[0][1]; it.r = d; if (d === 1) { it.x = hw; it.z = clamp(snap(z), -hd + 2.5, hd - 2.5); } else if (d === 3) { it.x = -hw; it.z = clamp(snap(z), -hd + 2.5, hd - 2.5); } else if (d === 0) { it.z = hd; it.x = clamp(snap(x), -hw + 2.5, hw - 2.5); } else { it.z = -hd; it.x = clamp(snap(x), -hw + 2.5, hw - 2.5); } }
  function addItem(k) {
    push(); const it0 = { id: uid(), x: snap(GOAL.tx), z: snap(GOAL.tz), r: 0 }; let it;
    const codes = new Set(L.items.filter(i => i.t === 'rack').map(i => i.code)); let c = 'A'; for (let i = 0; i < 26; i++) { c = String.fromCharCode(65 + i); if (!codes.has(c)) break; }
    if (k === 'pallet' || k === 'shelf') it = { ...it0, t: 'rack', k, bays: KIND[k].bays, lv: KIND[k].lv, code: k === 'shelf' ? 'M' + (L.items.filter(i => i.k === 'shelf').length + 1) : c, cat: '' };
    else if (k.startsWith('z:')) { const zk = k.slice(2); it = { ...it0, t: 'zone', k: zk, w: zk === 'terra' ? 10 : 12, d: 8, name: ZONE[zk][0] }; }
    else if (k === 'dock') { it = { ...it0, t: 'dock' }; dockSnap(it, it.x, it.z); }
    else if (k === 'wall') it = { ...it0, t: 'wall', len: 10, h: 1.6 };
    else if (k === 'belt') it = { ...it0, t: 'belt', len: 16 };
    else if (k === 'desk') it = { ...it0, t: 'desk' };
    inside(it); L.items.push(it); EDIT.sel = it.id; rebuild(); edPanel();
  }
  function rotSel(dir) { const it = edItem(); if (!it || it.t === 'dock') return; push(); it.r = ((it.r + (dir || 1)) % 4 + 4) % 4; inside(it); rebuild(); edPanel(); }
  function delSel() { const it = edItem(); if (!it) return; push(); L.items = L.items.filter(i => i !== it); if (it.t === 'rack') Object.keys(L.loc).forEach(a => { if (L.loc[a].r === it.id) delete L.loc[a]; }); EDIT.sel = null; rebuild(); edPanel(); }
  function dupSel() { const it = edItem(); if (!it) return; push(); const n = { ...clone(it), id: uid() }; const f = foot(it); if (it.r % 2) n.x += f.w + 3; else n.z += f.d + (it.t === 'rack' ? 3.2 : 1); if (n.t === 'rack') { const codes = new Set(L.items.filter(i => i.t === 'rack').map(i => i.code)); for (let i = 0; i < 26; i++) { const c = (n.k === 'shelf' ? 'M' + (i + 1) : String.fromCharCode(65 + i)); if (!codes.has(c)) { n.code = c; break; } } n.cat = ''; } if (n.t === 'dock') dockSnap(n, n.x, n.z + 6); inside(n); L.items.push(n); EDIT.sel = n.id; rebuild(); edPanel(); }
  const numF = (lab, f, v, min, max, step) => `<label class="m3-f"><span>${lab}</span><span class="m3-num"><button type="button" data-step="${f}" data-d="${-(step || 1)}">−</button><input type="number" data-f="${f}" value="${v}" min="${min}" max="${max}" step="${step || 1}"><button type="button" data-step="${f}" data-d="${step || 1}">+</button></span></label>`;
  function edPanel() {
    const el = $('.m3-panel'), it = edItem(); let h = '';
    if (!it) {
      const nR = L.items.filter(i => i.t === 'rack'), nv = nR.reduce((s, r) => s + r.bays * r.lv, 0);
      h = head(ic('building'), 'or', 'Progetta', 'Il tuo magazzino', `${N(L.W)} × ${N(L.D)} m · ${N(L.W * L.D)} m²`) + `<div class="m3-pb">
        <div class="m3-fr">${numF('Larghezza (m)', 'W', L.W, 20, 300, 1)}${numF('Profondità (m)', 'D', L.D, 16, 240, 1)}</div>
        <div class="m3-grid" style="margin-bottom:12px">${stat('Scaffali', nR.length, '', `${N(nv)} ubicazioni`)}${stat('Articoli', D.nArt, '', P.unplaced.length ? `${P.unplaced.length} senza posto` : 'tutti a scaffale', nv ? Math.min(1, P.byArt.size / nv) : 0)}</div>
        ${P.unplaced.length ? `<div class="m3-warn">${ic('alert')}<span><b>${P.unplaced.length} articoli</b> non entrano negli scaffali: aggiungi scaffali, campate o livelli.</span></div>` : ''}
        <div class="m3-h4">Elementi <em>${L.items.length}</em></div><div class="m3-rows m3-ilist">${L.items.map(i => `<button type="button" class="m3-row" data-esel="${esc(i.id)}"><i class="m3-pi" style="width:30px;height:30px;border-radius:9px">${ic(i.t === 'rack' ? (i.k === 'shelf' ? 'shelf' : 'rack') : i.t === 'zone' ? ZONE[i.k][3] : { dock: 'dock', wall: 'wall', belt: 'belt', desk: 'desk' }[i.t])}</i><span class="tx"><b>${esc(i.t === 'rack' ? `${i.code} · ${i.cat || KIND[i.k].n}` : i.t === 'zone' ? (i.name || ZONE[i.k][0]) : TYPES[i.t])}</b><small>${esc(i.t === 'rack' ? `${i.bays} campate × ${i.lv} livelli` : i.t === 'zone' ? `${N(i.w)} × ${N(i.d)} m` : i.t === 'wall' || i.t === 'belt' ? `${N(i.len)} m` : '')}</small></span></button>`).join('')}</div>
        <div class="m3-acts" style="margin-top:12px"><button type="button" data-m3="edauto">${ic('auto')}Disposizione automatica</button></div></div>`;
    } else {
      const bad = solid(it) && L.items.some(o => o !== it && solid(o) && o.t !== 'dock' && it.t !== 'dock' && hitB(box2(it), box2(o)));
      const tt = it.t === 'rack' ? KIND[it.k].n : it.t === 'zone' ? 'Zona' : TYPES[it.t];
      h = head(ic(it.t === 'rack' ? (it.k === 'shelf' ? 'shelf' : 'rack') : it.t === 'zone' ? ZONE[it.k][3] : { dock: 'dock', wall: 'wall', belt: 'belt', desk: 'desk' }[it.t]), 'or', 'Progetta · ' + tt, esc(it.t === 'rack' ? 'Scaffale ' + it.code : it.t === 'zone' ? (it.name || ZONE[it.k][0]) : TYPES[it.t]), `posizione ${N(it.x)} · ${N(it.z)} m`) + '<div class="m3-pb">';
      if (bad) h += `<div class="m3-warn">${ic('alert')}<span>Si sovrappone a un altro elemento: spostalo o ruotalo.</span></div>`;
      if (it.t === 'rack') {
        const used = Object.values(L.loc).filter(v => v.r === it.id).length;
        h += `<div class="m3-fr"><label class="m3-f"><span>Codice</span><input data-f="code" value="${esc(it.code)}" maxlength="6"></label><label class="m3-f"><span>Tipo</span><select data-f="k"><option value="pallet"${it.k === 'pallet' ? ' selected' : ''}>Portapallet</option><option value="shelf"${it.k === 'shelf' ? ' selected' : ''}>A ripiani</option></select></label></div>
          <label class="m3-f"><span>Categoria (gli articoli di questa categoria vanno qui)</span><select data-f="cat"><option value="">Nessuna: scaffale libero</option>${D.cats.map(c => `<option${c.n === it.cat ? ' selected' : ''}>${esc(c.n)}</option>`).join('')}${it.cat && !D.catOf.has(it.cat) ? `<option selected>${esc(it.cat)}</option>` : ''}</select></label>
          <div class="m3-fr">${numF('Campate', 'bays', it.bays, 1, 40, 1)}${numF('Livelli', 'lv', it.lv, 1, it.k === 'shelf' ? 10 : 7, 1)}</div>
          <div class="m3-fr3">${numF('Campata (m)', 'bw', it.bw || KIND[it.k].bw, .6, 4, .1)}${numF('Profondità', 'dep', rackDep(it), .3, 1.6, .1)}${numF('Livello (m)', 'lh', rackLh(it), .25, 2.5, .05)}</div>
          <div class="m3-ok">${ic('rack')}<span>${it.bays * it.lv} ubicazioni · lunghezza ${N(rackLen(it))} m · altezza ${N((it.lv - (it.k === 'pallet' ? 1 : 0)) * rackLh(it) + (it.k === 'pallet' ? 1.35 : .5))} m${used ? ` · ${used} ubicazioni fissate a mano` : ''}</span></div>`;
      } else if (it.t === 'zone') {
        h += `<label class="m3-f"><span>Nome</span><input data-f="name" value="${esc(it.name || '')}" maxlength="30"></label>
          <label class="m3-f"><span>Tipo</span><select data-f="k">${Object.entries(ZONE).filter(([k]) => k !== 'stk').map(([k, z]) => `<option value="${k}"${k === it.k ? ' selected' : ''}>${z[0]}</option>`).join('')}</select></label>
          <div class="m3-fr">${numF('Larghezza (m)', 'w', it.w, 2, 300, .5)}${numF('Profondità (m)', 'd', it.d, 2, 300, .5)}</div>`;
      } else if (it.t === 'wall') h += `<div class="m3-fr">${numF('Lunghezza (m)', 'len', it.len, 1, 300, .5)}${numF('Altezza (m)', 'h', it.h, .5, 6, .1)}</div>`;
      else if (it.t === 'belt') h += numF('Lunghezza (m)', 'len', it.len, 2, 200, .5);
      else if (it.t === 'dock') h += `<div class="m3-ok">${ic('dock')}<span>La banchina si aggancia da sola al muro più vicino. I camion dei DDT più recenti si fermano qui.</span></div>`;
      h += `<div class="m3-acts">${it.t !== 'dock' ? `<button type="button" data-m3="erl">${ic('rotl')}Ruota</button><button type="button" data-m3="err">${ic('rot')}Ruota</button>` : ''}<button type="button" data-m3="edup">${ic('copy')}Duplica</button></div>
        <div class="m3-acts"><button type="button" class="del" data-m3="edel">${ic('trash')}Elimina</button><button type="button" data-m3="edesel">Fatto</button></div></div>`;
    }
    el.innerHTML = h; root.classList.remove('np'); root.classList.add('pn');
    requestAnimationFrame(() => $$('.m3-bar u', el).forEach(u => { u.style.width = (u.dataset.w * 100) + '%'; }));
    updSelHelper();
  }
  function edField(f, v) {
    const it = edItem();
    if (f === 'W' || f === 'D') { push(); L[f] = clamp(+v || L[f], f === 'W' ? 20 : 16, f === 'W' ? 300 : 240); L.items.forEach(i => { if (i.t === 'dock') dockSnap(i, i.x, i.z); else inside(i); }); rebuildEnv(); rebuild(); edPanel(); return; }
    if (!it) return; push();
    if (['bays', 'lv', 'bw', 'dep', 'lh', 'w', 'd', 'len', 'h'].includes(f)) { const n = parseFloat(String(v).replace(',', '.')); if (isNaN(n)) return; it[f] = f === 'bays' || f === 'lv' ? Math.round(n) : Math.round(n * 100) / 100; const nl = normLayout({ ...L, items: [it] }).items[0]; Object.assign(it, nl); }
    else if (f === 'k') { it.k = v; if (it.t === 'rack') { delete it.bw; delete it.dep; delete it.lh; it.lv = Math.min(it.lv, v === 'shelf' ? 10 : 7); } else if (!it.name || Object.values(ZONE).some(z => z[0] === it.name)) it.name = ZONE[v][0]; }
    else it[f] = String(v).slice(0, f === 'name' ? 30 : 30);
    inside(it); rebuild(); edPanel();
  }
  function updSelHelper() {
    if (!EDIT) return; const it = edItem();
    if (selHelper) { WH.remove(selHelper); selHelper.geometry.dispose(); selHelper.material.dispose(); selHelper = null; }
    if (!it) return; const b = box2(it), bad = solid(it) && it.t !== 'dock' && L.items.some(o => o !== it && solid(o) && o.t !== 'dock' && hitB(b, box2(o)));
    const bb = new T.Box3(new T.Vector3(b.x0 - .15, .5, b.z0 - .15), new T.Vector3(b.x1 + .15, it.t === 'rack' ? (it.lv - (it.k === 'pallet' ? 1 : 0)) * rackLh(it) + 2.2 : it.t === 'zone' ? .9 : it.t === 'wall' ? (it.h || 2) + .8 : 3.8, b.z1 + .15));
    selHelper = new T.Box3Helper(bb, bad ? 0xe8432a : 0xf47b20); selHelper.material.depthTest = false; selHelper.renderOrder = 12; WH.add(selHelper);
  }
  // trascinamento
  const ground = new (function () { this.p = null; })();
  function groundAt(cx, cy) {
    if (!ground.p) { ground.p = new T.Plane(new T.Vector3(0, 1, 0), -.5); ground.r = new T.Raycaster(); ground.v = new T.Vector3(); }
    const rc = R.domElement.getBoundingClientRect(); ground.r.setFromCamera(new T.Vector2((cx - rc.left) / rc.width * 2 - 1, -(cy - rc.top) / rc.height * 2 + 1), cam);
    return ground.r.ray.intersectPlane(ground.p, ground.v) ? ground.v.clone() : null;
  }
  function edPickAt(cx, cy) {
    if (!ground.r) groundAt(cx, cy);
    const rc = R.domElement.getBoundingClientRect(); ground.r.setFromCamera(new T.Vector2((cx - rc.left) / rc.width * 2 - 1, -(cy - rc.top) / rc.height * 2 + 1), cam);
    const H = ground.r.intersectObjects(pick, false).filter(h2 => { let o = h2.object; while (o && !o.userData.eid) o = o.parent; return o; });
    if (!H.length) return null;
    // preferisce gli oggetti alle zone sul pavimento
    const ids = H.map(h2 => { let o = h2.object; while (o && !o.userData.eid) o = o.parent; return o.userData.eid; });
    const nonZone = ids.find(id => { const it = L.items.find(i => i.id === id); return it && it.t !== 'zone'; });
    return nonZone || ids[0];
  }

  /* ---------------- eventi ---------------- */
  let drag = null, pinch = null; const pts = new Map();
  function onDown(e) {
    try { R.domElement.setPointerCapture(e.pointerId); } catch {} pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: GOAL.dist }; flyStop(); drag = null; return; }
    if (EDIT && e.button === 0 && !e.shiftKey) {
      const id = edPickAt(e.clientX, e.clientY);
      if (id) { const it = L.items.find(i => i.id === id), gp = groundAt(e.clientX, e.clientY); if (it && gp) { if (EDIT.sel !== id) { EDIT.sel = id; edPanel(); } drag = { x: e.clientX, y: e.clientY, moved: 0, item: it, off: { x: gp.x - it.x, z: gp.z - it.z }, orig: JSON.stringify(L), g: WH.children.find(c => c.userData.eid === id) }; return; } }
    }
    drag = { x: e.clientX, y: e.clientY, rot: e.button === 2 || e.shiftKey ? 1 : 0, moved: 0 };
  }
  function onMove(e) {
    if (pts.has(e.pointerId)) pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y); GOAL.dist = clamp(pinch.dist * pinch.d / Math.max(20, d), 12, 420); stopTour(); return; }
    if (!drag) { needPick = { x: e.clientX, y: e.clientY, hover: 1 }; return; }
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
    if (drag.moved > 4) { R.domElement.classList.add('drag'); stopTour(); if (!drag.item) flyStop(); }
    if (drag.item) {
      if (drag.moved < 5) return; const gp = groundAt(e.clientX, e.clientY); if (!gp) return; const it = drag.item;
      if (it.t === 'dock') dockSnap(it, gp.x - drag.off.x, gp.z - drag.off.z); else { it.x = snap(gp.x - drag.off.x); it.z = snap(gp.z - drag.off.z); inside(it); }
      if (drag.g) { drag.g.position.set(it.x, 0, it.z); if (it.t !== 'zone') drag.g.rotation.y = it.r * Math.PI / 2; }
      updSelHelper(); return;
    }
    if (drag.rot) { GOAL.az -= dx * .006; CAM.az = GOAL.az; GOAL.pol = clamp(GOAL.pol - dy * .004, .12, 1.3); CAM.pol = GOAL.pol; return; }
    const k = CAM.dist * .0016 * (900 / Math.max(500, R.domElement.clientHeight)), s = Math.sin(CAM.az), c = Math.cos(CAM.az);
    const mx = -dx * k, mz = -dy * k / Math.max(.35, Math.cos(CAM.pol - .2));
    GOAL.tx += mx * c + mz * s; GOAL.tz += -mx * s + mz * c; GOAL.tx = clamp(GOAL.tx, -160, 180); GOAL.tz = clamp(GOAL.tz, -140, 140); CAM.tx = GOAL.tx; CAM.tz = GOAL.tz;
  }
  function onUp(e) {
    pts.delete(e.pointerId); if (pts.size < 2) pinch = null;
    if (drag && drag.item) { if (drag.moved >= 5) { EDIT.undo.push(drag.orig); EDIT.dirty = true; rebuild(); } edPanel(); }
    else if (drag && drag.moved < 6) { if (EDIT) { EDIT.sel = null; edPanel(); } else needPick = { x: e.clientX, y: e.clientY }; }
    drag = null; R.domElement.classList.remove('drag');
  }
  function onWheel(e) { e.preventDefault(); flyStop(); GOAL.dist = clamp(GOAL.dist * Math.exp(e.deltaY * .0012), 12, 420); stopTour(); }
  const ray = new (function () { this.r = null; })();
  function doPick(p) {
    if (!ray.r) ray.r = new T.Raycaster();
    const rc = R.domElement.getBoundingClientRect(), v = new T.Vector2((p.x - rc.left) / rc.width * 2 - 1, -(p.y - rc.top) / rc.height * 2 + 1);
    ray.r.setFromCamera(v, cam); const H = ray.r.intersectObjects(pick, false), PR = { art: 0, truck: 1, veh: 1, rack: 2, dock: 3, belt: 3, desk: 3, fuel: 3, wall: 4, zone: 5 };
    const hit2 = H.slice(0, 8).filter(h2 => h2.object.userData.k).sort((a, b) => (PR[a.object.userData.k.t] - PR[b.object.userData.k.t]) || a.distance - b.distance)[0];
    if (p.hover) { R.domElement.classList.toggle('hov', !!hit2 || !!EDIT); const kk = hit2 && hit2.object.userData.k; hoverArt(kk && kk.t === 'art' && matchMedia('(hover:hover)').matches ? hit2.object.userData.ids && hit2.object.userData.ids[hit2.instanceId] : null, p.x, p.y); return; }
    if (EDIT || !hit2) return;
    const k = hit2.object.userData.k;
    if (k.t === 'art') { const id = hit2.object.userData.ids && hit2.object.userData.ids[hit2.instanceId]; if (id) select({ t: 'rack', id: k.rack, art: id }); else select({ t: 'rack', id: k.rack }); return; }
    select({ ...k });
  }
  function onClick(e) {
    const t = e.target;
    if (t.closest('[data-gx]')) { $$('.m3-menu.on').forEach(m => m.classList.remove('on')); $('.m3-res').classList.remove('on'); return; }
    const b = t.closest('[data-m3]'), a = b && b.dataset.m3;
    if (!t.closest('.m3-menu') && !t.closest('[data-m3="zones"]') && !t.closest('[data-m3="shots"]')) $$('.m3-menu.on').forEach(m => m.classList.remove('on'));
    if (!t.closest('.m3-search')) $('.m3-res').classList.remove('on');
    if (a === 'close') { if (EDIT && EDIT.dirty && !confirm('Uscire senza salvare le modifiche alla disposizione?')) return; EDIT = null; return close(); }
    if (a === 'zin') { flyStop(); GOAL.dist = clamp(GOAL.dist * .75, 12, 420); stopTour(); return; }
    if (a === 'zout') { flyStop(); GOAL.dist = clamp(GOAL.dist / .75, 12, 420); stopTour(); return; }
    if (a === 'rl') { flyStop(); GOAL.az -= Math.PI / 4; stopTour(); return; }
    if (a === 'rr') { flyStop(); GOAL.az += Math.PI / 4; stopTour(); return; }
    if (a === 'home') { if (EDIT) return fly({ tx: 0, tz: 0, dist: Math.max(L.W, L.D) * 2.15, az: -0.15, pol: .42 }); select({ t: 'zone', z: 'all' }); return; }
    if (a === 'play') { if (tourOn) stopTour(); else startTour(); return; }
    if (a === 'pclose') { if (EDIT) { EDIT.sel = null; edPanel(); } else if (t.closest('.m3-co')) { unfocus(); if (sel && sel.art) sel = { t: 'rack', id: sel.id }; } else select(null); return; }
    if (a === 'verify') return verify();
    if (a === 'aim') { if (sel) select(sel); return; }
    if (a === 'edit') return enterEdit();
    if (a === 'gasadd') { if (C.gasAdd) C.gasAdd(); return; }
    if (a === 'gasopen') { close(); if (C.goGas) setTimeout(C.goGas, 50); return; }
    if (a === 'zgas') { select({ t: 'zone', z: 'flotta' }); return; }
    if (a === 'edx') return exitEdit(false);
    if (a === 'eds') return exitEdit(true);
    if (a === 'undo') return undo();
    if (a === 'erl') return rotSel(-1);
    if (a === 'err') return rotSel(1);
    if (a === 'edel') return delSel();
    if (a === 'edup') return dupSel();
    if (a === 'edesel') { EDIT.sel = null; return edPanel(); }
    if (a === 'edauto') { if (!confirm('Sostituire la disposizione con quella automatica (una corsia per categoria)? Le ubicazioni fissate a mano si perdono.')) return; push(); const A2 = autoLayout(); EDIT.L = L = A2; EDIT.sel = null; rebuildEnv(); rebuild(); edPanel(); return; }
    if (a === 'edrack') { const id = b.dataset.id; enterEdit(); if (EDIT && id) { EDIT.sel = id; edPanel(); const it = edItem(); if (it) fly({ tx: it.x, tz: it.z, dist: 70, az: -0.2, pol: .5 }); } return; }
    if (a === 'locsave') return locSave(b.dataset.art, b.dataset.r, +b.dataset.b, +b.dataset.l);
    if (a === 'locauto') { const L2 = clone(L); delete L2.loc[b.dataset.art]; if (saveLayout(L2, 'Ubicazione automatica')) { L = L2; rebuild(); focusArt(b.dataset.art); } return; }
    if (a === 'zones' || a === 'shots') { $(`.m3-menu[data-menu="${a}"]`).classList.toggle('on'); return; }
    if (a === 'next') { const ks = zoneKinds(), cur = sel && sel.t === 'zone' ? (sel.z === 'uff' ? 'uffe' : sel.z) : sel && sel.t === 'rack' ? 'stk' : sel && sel.t === 'truck' ? 'spe' : 'all'; select({ t: 'zone', z: ks[(ks.indexOf(cur) + 1) % ks.length] }); return; }
    if (a === 'bell') { select({ t: 'zone', z: 'all' }); setTimeout(() => { const h2 = $$('.m3-panel .m3-h4').pop(); if (h2) h2.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 200); return; }
    if (a === 'zall') { select({ t: 'zone', z: 'all' }); return; }
    if (a === 'zspe') { select({ t: 'zone', z: 'spe' }); return; }
    const ad = t.closest('[data-add]'); if (ad) return addItem(ad.dataset.add);
    const es = t.closest('[data-esel]'); if (es) { EDIT.sel = es.dataset.esel; edPanel(); const it = edItem(); if (it) fly({ tx: it.x, tz: it.z, dist: Math.max(50, GOAL.dist * .8), az: GOAL.az, pol: GOAL.pol }); return; }
    const st = t.closest('[data-step]'); if (st) { const inp = $(`[data-f="${st.dataset.step}"]`); const nv2 = Math.round((parseFloat(inp.value) + parseFloat(st.dataset.d)) * 100) / 100; inp.value = nv2; return edField(st.dataset.step, nv2); }
    const lc = t.closest('[data-lcell]'); if (lc && sel && sel.t === 'loc') { const [bb, ll] = lc.dataset.lcell.split('|').map(Number); return panel({ t: 'loc', art: sel.art, r: sel.r, b: bb, l: ll }); }
    const lo = t.closest('[data-loc3]'); if (lo) { e.stopPropagation(); if (!canEdit()) return toast('Solo il titolare può cambiare le ubicazioni'); const p2 = P.byArt.get(lo.dataset.loc3); return panel({ t: 'loc', art: lo.dataset.loc3, r: p2 && p2.rk.id }); }
    const zs = t.closest('[data-zsel]'); if (zs) { $('.m3-res').classList.remove('on'); select({ t: 'zone', z: zs.dataset.zsel }); return; }
    const fg = t.closest('[data-fgo]'); if (fg) { select({ t: 'zone', z: fg.dataset.fgo }); return; }
    const sh = t.closest('[data-shot]'); if (sh) { stopTour(); const k = sh.dataset.shot, z = zoneTarget('stk'); ({ all: () => select({ t: 'zone', z: 'all' }), top: () => fly({ tx: 0, tz: 0, dist: Math.max(L.W, L.D) * 2.2, az: 0, pol: .12 }), stk: () => { const r = P.racks.find(x => x.k === 'pallet') || P.racks[0]; if (r) { const g = rackG(r.id); g.updateMatrixWorld(); const p2 = g.localToWorld(new T.Vector3(-rackLen(r) / 2 - 3, 0, rackDep(r) / 2 + 1.7)); fly({ tx: p2.x + 6, ty: 2.5, tz: p2.z, dist: 12, az: r.r * Math.PI / 2 - 1.3, pol: 1.3 }); } }, spe: () => flyT(zoneTarget('spe')), pre: () => flyT(zoneTarget('pre')), low: () => fly({ tx: 0, tz: 4, dist: Math.max(L.W, L.D) * 1.6, az: -0.75, pol: 1.22 }) })[k](); return; }
    const tb = t.closest('[data-tab3]'); if (tb) { table(tb.dataset.tab3); return; }
    const rw = t.closest('[data-rack3]'); if (rw) { $('.m3-res').classList.remove('on'); select({ t: 'rack', id: rw.dataset.rack3 }); return; }
    const ar = t.closest('[data-art3]'); if (ar) { $('.m3-res').classList.remove('on'); focusArt(ar.dataset.art3); return; }
    const vh = t.closest('[data-veh3]'); if (vh) { $('.m3-res').classList.remove('on'); select({ t: 'veh', p: vh.dataset.veh3 }); return; }
    const tr = t.closest('[data-trk3]'); if (tr) { $('.m3-res').classList.remove('on'); select({ t: 'truck', i: +tr.dataset.trk3 }); return; }
  }
  function onChange(e) {
    const t = e.target;
    if (t.dataset.f && EDIT) return edField(t.dataset.f, t.value);
    if (t.dataset.locf && sel && sel.t === 'loc') { const v = t.value; if (t.dataset.locf === 'r') return panel({ t: 'loc', art: sel.art, r: v, b: 0, l: 0 }); return panel({ ...sel, [t.dataset.locf]: +v }); }
  }
  function onKey(e) {
    if (!open || !document.body.contains(root)) return;
    if (document.querySelector('#sheet:not([hidden])')) return;
    const inp = $('.m3-search input'), typing = /INPUT|SELECT|TEXTAREA/.test((document.activeElement || {}).tagName || '');
    if (EDIT) {
      if (typing) { if (e.key === 'Enter') document.activeElement.blur(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); return undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); return dupSel(); }
      if (e.key === 'r' || e.key === 'R') return rotSel(e.shiftKey ? -1 : 1);
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); return delSel(); }
      if (e.key === 'Escape') { if (EDIT.sel) { EDIT.sel = null; edPanel(); } return; }
      const mv = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]; const it = edItem();
      if (mv && it) { e.preventDefault(); push(); const s = e.shiftKey ? 2 : .5; if (it.t === 'dock') dockSnap(it, it.x + mv[0] * s, it.z + mv[1] * s); else { it.x += mv[0] * s; it.z += mv[1] * s; inside(it); } rebuild(); edPanel(); }
      return;
    }
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
    const w = R.domElement.clientWidth, h = R.domElement.clientHeight, want = w > 760 && root.classList.contains('pn') ? (EDIT ? 60 : 180) : 0;
    viewOff += (want - viewOff) * (1 - Math.exp(-dt * 4)); if (Math.abs(viewOff) > .5) cam.setViewOffset(w, h, viewOff, 0, w, h); else if (cam.view && cam.view.enabled) cam.clearViewOffset();
    if (needPick) { const p2 = needPick; needPick = null; doPick(p2); }
    if (tourOn) { tourT += dt; if (tourT > 5.5) nextTour(); }
    R.render(scene, cam); updLabels();
    const ck = $('.m3-clock'); if (ck && (!loop.s || now - loop.s > 5000)) { loop.s = now; const d = new Date(); ck.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  }

  /* ---------------- ciclo di vita ---------------- */
  function disposeOwn() { OWN.splice(0).forEach(x => { try { x.dispose(); } catch {} }); }
  function rebuild() {
    // ricostruisce il magazzino (non l'esterno), con dati e disposizione attuali
    const own0 = OWN.splice(0); const keepEnv = own0.filter(x => x._env); disposeOwnList(own0.filter(x => !x._env)); OWN.push(...keepEnv);
    buildWH(); buildLabels(); if (!EDIT) kpis(); if (EDIT) updSelHelper();
  }
  function disposeOwnList(l) { l.forEach(x => { try { x.dispose(); } catch {} }); }
  function markEnv(from) { for (let i = from; i < OWN.length; i++) OWN[i]._env = 1; }
  function dispose() {
    cancelAnimationFrame(raf); raf = 0;
    if (scene) scene.traverse(o => { if (o.isInstancedMesh) o.dispose(); });
    disposeOwn(); Object.values(G).forEach(g => g.dispose && g.dispose()); Object.keys(G).forEach(k => delete G[k]);
    Object.values(M).forEach(m => m.dispose && m.dispose()); Object.keys(M).forEach(k => delete M[k]);
    Object.values(TX).forEach(t => t && t.dispose && t.dispose()); Object.keys(TX).forEach(k => delete TX[k]);
    if (R) { R.dispose(); R.forceContextLoss && R.forceContextLoss(); }
    R = scene = ENV = WH = null; pick = []; labels = []; movers = []; trucks = []; hiMesh = selHelper = null;
  }
  function setupScene() {
    scene = new T.Scene(); scene.background = new T.Color(0xa6d673); scene.fog = new T.Fog(0xa6d673, 300, 640);
    cam = new T.PerspectiveCamera(28, 1, .5, 1600);
    scene.add(new T.HemisphereLight(0xffffff, 0x9bc46f, 1.5));
    const sun = new T.DirectionalLight(0xfff6ea, 2.2); sun.position.set(-70, 130, 60); sun.castShadow = true;
    const sc = sun.shadow.camera; sc.left = -120; sc.right = 120; sc.top = 100; sc.bottom = -100; sc.near = 10; sc.far = 380;
    sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0004; sun.shadow.normalBias = .35; scene.add(sun);
    const fill = new T.DirectionalLight(0xdfe9ff, .45); fill.position.set(80, 60, -40); scene.add(fill);
  }
  function build() {
    D = data(); L = getLayout(); textures();
    pick = []; movers = [];
    const o0 = OWN.length; buildEnv(); markEnv(o0); pickEnv = pick.slice(); envMovers = movers.slice();
    buildWH(); buildLabels(); kpis();
  }
  let pickEnv = [], envMovers = [];
  function rebuildEnv() { const keep = OWN.filter(x => !x._env); disposeOwnList(OWN.filter(x => x._env)); OWN.length = 0; OWN.push(...keep); pick = []; movers = []; const o0 = OWN.length; buildEnv(); markEnv(o0); pickEnv = pick.slice(); envMovers = movers.slice(); }
  function openView(ctx) {
    C = ctx; T = window.THREE; if (!T) return;
    if (open) return refresh();
    if (!document.getElementById('m3-css')) { const s = document.createElement('style'); s.id = 'm3-css'; s.textContent = CSS; document.head.appendChild(s); }
    root = document.createElement('div'); root.className = 'm3 np'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Magazzino 3D'); root.innerHTML = html();
    document.body.appendChild(root); document.documentElement.style.overflow = 'hidden'; open = true;
    try { R = new T.WebGLRenderer({ canvas: $('.m3-c'), antialias: true, powerPreference: 'high-performance', logarithmicDepthBuffer: true }); }
    catch { root.innerHTML = '<div class="m3-load"><b>Il 3D non è supportato su questo dispositivo</b></div>'; setTimeout(close, 2500); return; }
    R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
    setupScene();
    build(); resize();
    const zt = zoneTarget('all'); Object.assign(CAM, { ty: 0, tx: zt.x, tz: zt.z, dist: zt.dist * 1.6, az: -0.1, pol: .7 }); Object.assign(GOAL, { tx: zt.x, tz: zt.z, dist: zt.dist, az: zt.az, pol: zt.pol }); applyCam();
    const cv = R.domElement;
    cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove); cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);
    cv.addEventListener('wheel', onWheel, { passive: false }); cv.addEventListener('contextmenu', e => e.preventDefault()); cv.addEventListener('pointerleave', () => { cv.classList.remove('hov'); hoverArt(null); });
    root.addEventListener('click', onClick); root.addEventListener('change', onChange);
    const inp = $('.m3-search input'); inp.addEventListener('input', () => search(inp.value)); inp.addEventListener('focus', () => { if (inp.value) search(inp.value); });
    const ms = $('.m3-sel'); if (ms) ms.addEventListener('change', () => { C.setMag(ms.value); });
    window.addEventListener('resize', resize); document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => { root.classList.add('on'); const l = $('.m3-load'); if (l) { l.style.opacity = 0; setTimeout(() => l.remove(), 500); } });
    lastT = 0; raf = requestAnimationFrame(loop);
    setTimeout(() => { if (open && !sel && root.clientWidth > 760) select({ t: 'zone', z: 'all' }, 1); else if (open) zoneChip('all'); }, 900);
  }
  function refresh() {
    if (!open || !R) return;
    if (EDIT) { D = data(); return; } // durante la progettazione i dati si aggiornano all'uscita
    const keep = sel, W0 = L.W, D0 = L.D;
    D = data(); L = getLayout();
    if (L.W !== W0 || L.D !== D0) rebuildEnv();
    rebuild();
    const ms = $('.m3-sel'); if (ms) ms.value = C.mag();
    if (keep) select(keep, 1);
  }
  function close() {
    if (!open) return; open = false; stopTour(); EDIT = null;
    window.removeEventListener('resize', resize); document.removeEventListener('keydown', onKey);
    root.classList.remove('on'); const r0 = root;
    setTimeout(() => { dispose(); r0.remove(); }, 320);
    document.documentElement.style.overflow = '';
    sel = null; if (C && C.onClose) C.onClose();
  }
  window.CDC_MG3D = { open: openView, refresh, close, isOpen: () => open };
})();
