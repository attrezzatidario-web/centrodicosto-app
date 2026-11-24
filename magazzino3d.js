/* Magazzino 3D (v290) — magazzino 3D interattivo collegato ai dati reali, con editor della disposizione.
   Caricato con loadLib da app.js (mag3d) dopo three.js. Espone window.CDC_MG3D = { open(ctx), refresh(), close(), isOpen(), pickLoc(ctx, idArticolo, {toast, onSave}), locOf(ctx, id) }.
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
.m3-b14{display:grid;grid-template-columns:repeat(14,1fr);gap:4px;align-items:end;height:104px;padding:10px 8px 0;background:#f8f7f5;border-radius:13px;margin-bottom:4px}
.m3-b14 div{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:4px}
.m3-b14 i{display:block;width:100%;height:var(--h);min-height:3px;border-radius:5px 5px 2px 2px;background:#f3c9a4;transform-origin:bottom;animation:m3g .8s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--k)*35ms)}
.m3-b14 i.c{background:${OR}}.m3-b14 div:hover i{background:#e9a25c}
.m3-b14 small{font-size:10px;color:#9a9ca1;padding-bottom:6px;font-weight:600}.m3-b14 small.we{color:#c9c6c0}
.m3-hb{display:flex;flex-direction:column;gap:9px;margin-bottom:4px}
.m3-hb>div{display:flex;flex-direction:column;gap:5px;animation:m3in .45s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--k)*60ms)}
.m3-hb span{display:flex;justify-content:space-between;gap:8px;font-size:12.5px}.m3-hb span b{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.m3-hb span small{color:#8a8d93;white-space:nowrap}
.m3-hb u{display:block;height:6px;border-radius:4px;background:#f1efeb;overflow:hidden}
.m3-hb u i{display:block;height:100%;width:var(--w);background:var(--c);border-radius:4px;transform-origin:left;animation:m3w .9s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--k)*60ms + 120ms)}
@keyframes m3w{from{transform:scaleX(0)}}
.m3-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:2px 0 4px;position:relative}
.m3-steps>div{display:flex;flex-direction:column;gap:6px;padding:10px;border-radius:12px;background:#f8f7f5;animation:m3in .45s cubic-bezier(.2,.8,.2,1) both}
.m3-steps>div:nth-child(2){animation-delay:.08s}.m3-steps>div:nth-child(3){animation-delay:.16s}
.m3-steps i{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;background:#e6f4ea;color:#2a8a4a}.m3-steps .w i{background:#fff1e3;color:${OR}}
.m3-steps i svg{width:14px;height:14px}.m3-steps b{display:block;font-size:12px;font-weight:600}.m3-steps small{display:block;font-size:11px;color:#8a8d93;line-height:1.3}
.m3-rcc{width:34px!important;height:30px!important;border-radius:9px!important;font:700 11px/30px Inter,system-ui!important;font-style:normal!important;color:#16181b!important;background:var(--c)!important;text-align:center;display:block!important;letter-spacing:.02em}
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


/* v282: uffici, clienti e fornitori */
.m3-av{display:grid;place-items:center;width:34px;height:34px;flex:none;border-radius:11px;background:var(--c);color:#16181b;font:800 12px/1 Inter,system-ui;font-style:normal;letter-spacing:.02em}
.m3-av.big{width:100%;height:100%;border-radius:inherit;font-size:15px}
.m3-seg2{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;background:#f3f2ef;border-radius:13px;margin:4px 0 2px}
.m3-seg2 button{display:flex;align-items:center;justify-content:center;gap:7px;height:38px;border:0;border-radius:10px;background:none;font:600 13px Inter,system-ui;color:#5b5f66;cursor:pointer;transition:background .2s,color .2s,box-shadow .2s}
.m3-seg2 button svg{width:16px;height:16px}.m3-seg2 button em{font-style:normal;font-weight:600;color:#9a9ca1;font-size:12px}
.m3-seg2 button.on{background:#fff;color:#16181b;box-shadow:0 2px 8px rgba(0,0,0,.08)}.m3-seg2 button.on em{color:${OR}}
.m3-leg{display:flex;gap:12px;flex-wrap:wrap;font-size:11.5px;color:#8a8d93;margin:2px 2px 6px}.m3-leg span{display:flex;align-items:center;gap:5px}.m3-leg i{width:8px;height:8px;border-radius:50%}
.m3-kv{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:4px}
.m3-kv div{background:#f8f7f5;border-radius:11px;padding:8px 10px;min-width:0;animation:m3in .4s cubic-bezier(.2,.8,.2,1) both}
.m3-kv span{display:block;font-size:11px;color:#8a8d93}.m3-kv b{display:block;font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.m3-kv a{color:${OR};text-decoration:none}
.m3-b12{grid-template-columns:repeat(12,1fr)!important}
.m3-acts{display:flex;gap:8px;flex-wrap:wrap}.m3-acts .m3-go{flex:1 1 140px;margin:0}

/* v290: preparazione e controllo */
.m3-pk{display:flex;flex-direction:column;gap:6px;margin-bottom:6px;position:relative}
.m3-pk::before{content:'';position:absolute;left:17px;top:14px;bottom:14px;width:2px;background:repeating-linear-gradient(#f6b27c 0 6px,transparent 6px 11px)}
.m3-pk button{all:unset;box-sizing:border-box;position:relative;cursor:pointer;display:grid;grid-template-columns:36px minmax(0,1fr) auto auto;gap:9px;align-items:center;padding:8px 10px 8px 0;border-radius:12px;transition:background .2s;animation:m3in .45s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--k)*50ms)}
.m3-pk button:hover{background:#f8f7f5}
.m3-pk i{width:28px;height:28px;margin-left:4px;border-radius:50%;background:#f47b20;color:#fff;display:grid;place-items:center;font-style:normal;font-weight:800;font-size:13px;box-shadow:0 0 0 4px #fff}
.m3-pk span{display:flex;flex-direction:column;min-width:0}.m3-pk span b{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.m3-pk span small{font-size:11px;color:#8a8d93;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.m3-pk .loc{font-style:normal;font-size:11.5px;font-weight:800;padding:4px 7px;border-radius:7px;background:#fff1e6;color:#c2560c;font-variant-numeric:tabular-nums}
.m3-pk .q{font-size:15px;min-width:38px;text-align:right}.m3-pk .q small{font-size:10px;color:#8a8d93;margin-left:2px;font-weight:600}
.m3-pkr{animation:m3in .45s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--k)*40ms)}
.m3-cqh{display:grid;grid-template-columns:96px minmax(0,1fr);gap:14px;align-items:center;padding:12px 14px;border-radius:16px;background:linear-gradient(160deg,#f1f9f3,#e4f2e8);margin-bottom:10px;animation:m3in .45s cubic-bezier(.2,.8,.2,1) both}
.m3-cqh .ring{width:96px;height:96px;border-radius:50%;display:grid;place-content:center;text-align:center;background:radial-gradient(closest-side,#fff 78%,transparent 79% 100%),conic-gradient(var(--c) calc(var(--p)*100%),#dfe7e1 0);animation:m3pop .6s cubic-bezier(.2,1.4,.4,1) both}
.m3-cqh .ring b{font-size:22px;font-weight:800;line-height:1}.m3-cqh .ring small{font-size:10px;color:#6b6e73;margin-top:3px}
.m3-cqh span{font-size:11.5px;font-weight:700;color:#2a7a45;text-transform:uppercase;letter-spacing:.04em}.m3-cqh div>b{display:block;font-size:15px;margin:3px 0}.m3-cqh em{font-style:normal;font-size:12px;color:#6b6e73}
.m3-chip.r{background:#fdecea;color:#c0392b}
/* v289: corriere GLS */
.m3-gl{display:grid;place-items:center;width:100%;height:100%;font-weight:900;font-size:17px;color:#16181b;background:#f2c418;border-radius:inherit}
.m3-gch{display:flex;gap:6px;overflow-x:auto;margin:0 0 12px;scrollbar-width:none}.m3-gch::-webkit-scrollbar{display:none}
.m3-gch button{all:unset;flex:none;cursor:pointer;padding:6px 11px;border-radius:999px;background:#f5f4f2;font-size:12px;font-weight:700;color:#5b5e63;transition:background .2s,color .2s}.m3-gch button.on{background:#16181b;color:#fff}
.m3-ghero{display:grid;grid-template-columns:minmax(0,1fr) 168px;gap:8px;align-items:center;padding:12px 12px 8px 14px;border-radius:16px;background:linear-gradient(160deg,#fffbea,#fdf3cf);margin-bottom:10px;animation:m3in .45s cubic-bezier(.2,.8,.2,1) both}
.m3-ghero span{font-size:11.5px;color:#8a6d00;font-weight:700;text-transform:uppercase;letter-spacing:.04em}.m3-ghero b{display:block;font-size:26px;font-weight:800;margin:4px 0 6px;letter-spacing:-.01em}.m3-ghero em{font-style:normal;font-size:12px;color:#6b6e73;line-height:1.45}
.m3-ghero em i{font-style:normal;font-weight:700}.m3-ghero em i.up{color:#c2410c}.m3-ghero em i.dn{color:#2a8a4a}
.m3 .m3-ghero svg.m3-itm{width:100%!important;height:auto!important;max-height:none!important;overflow:visible;stroke:none;fill:none;display:block}.m3-itm .d{fill:rgba(120,95,10,.32)}.m3-itm .a{fill:none;stroke:#e0b100;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1;opacity:.75;animation:m3arc 1.1s cubic-bezier(.3,.7,.2,1) forwards;animation-delay:calc(var(--k)*45ms + 150ms)}
.m3-itm .p{fill:#f2c418;stroke:#fff;stroke-width:.8;transform-box:fill-box;transform-origin:center;animation:m3pop .5s cubic-bezier(.2,1.4,.4,1) both;animation-delay:calc(var(--k)*45ms + 700ms)}
.m3-itm .o{fill:#f47b20;stroke:#fff;stroke-width:1.2}.m3-itm .o2{fill:rgba(244,123,32,.25);transform-box:fill-box;transform-origin:center;animation:m3pul 1.8s ease-out infinite}.m3-itm text{font:700 8px Inter,system-ui,sans-serif;fill:#3a3f46}
@keyframes m3arc{to{stroke-dashoffset:0}}@keyframes m3pop{from{transform:scale(0)}}@keyframes m3pul{from{transform:scale(.6);opacity:1}to{transform:scale(1.8);opacity:0}}
.m3-gsp{display:flex;gap:3px;height:12px;border-radius:7px;overflow:hidden;margin:2px 0 10px}.m3-gsp i{display:block;transform-origin:left;animation:m3w .9s cubic-bezier(.2,.8,.2,1) both}.m3-gsp.t{height:9px}
.m3-gsp .c0,.m3-gct .c0{background:#f2c418}.m3-gsp .c1,.m3-gct .c1{background:#7fb6d6}.m3-gsp .k0,.m3-gk0{background:#f2c418}.m3-gsp .k1,.m3-gk1{background:#f47b20}.m3-gsp .k2,.m3-gk2{background:#9aa0a8}
.m3-gct{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:6px}.m3-gct>div{background:#f8f7f5;border-radius:13px;padding:10px 11px;display:flex;flex-direction:column;gap:3px}
.m3-gct span{display:flex;align-items:center;gap:6px;font-size:11.5px;color:#6b6e73;font-weight:600}.m3-gct span i{width:9px;height:9px;border-radius:3px;display:block}.m3-gct b{font-size:16px}.m3-gct b em{font-style:normal;font-size:11px;color:#9a9ca1;margin-left:6px;font-weight:600}.m3-gct small{font-size:11px;color:#8a8d93}
.m3-gsr .m3-pi{font-size:10px;font-weight:800}.m3-gsv{display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex:none}.m3-gsv b{font-size:13px}.m3-gsv em{font-style:normal;font-size:10.5px;font-weight:700;padding:1px 6px;border-radius:6px}.m3-gsv em.g{background:#e7f5ea;color:#2a8a4a}.m3-gsv em.a{background:#fff3df;color:#b26b00}
.m3-rd{font-style:normal;color:#9a9ca1}
/* v287: amministrazione */
.m3-dl.g{color:#2a8a4a}.m3-dl.r{color:#d9452f}
.m3-amm button{min-width:0}
.m3-amm{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;margin:2px 0 12px}
.m3-amm button{all:unset;box-sizing:border-box;display:flex;gap:10px;align-items:center;padding:11px 12px;border-radius:14px;background:#f8f7f5;cursor:pointer;transition:background .2s,transform .2s;animation:m3in .45s cubic-bezier(.2,.8,.2,1) both}
.m3-amm button:hover{background:#f1efeb;transform:translateY(-1px)}
.m3-amm i{flex:none;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:color-mix(in srgb,var(--c) 14%,#fff);color:var(--c)}
.m3-amm i svg{width:18px;height:18px}.m3-amm span{display:flex;flex-direction:column;min-width:0}.m3-amm b{font-size:13.5px}.m3-amm small{font-size:11.5px;color:#8a8d93;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.m3-pi.m3-dt{background:color-mix(in srgb,var(--c) 13%,#fff)!important;color:var(--c)!important}
.m3-rc{display:grid;grid-template-columns:repeat(12,1fr);gap:5px;align-items:end;height:118px;padding:12px 8px 0;background:#f8f7f5;border-radius:13px;margin-bottom:6px}
.m3-rc>div{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:4px}
.m3-rc span{display:flex;gap:2px;align-items:flex-end;height:100%;width:100%}
.m3-rc i{flex:1;display:block;height:var(--h);min-height:2px;border-radius:4px 4px 1px 1px;transform-origin:bottom;animation:m3g .8s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--k)*35ms)}
.m3-rc i.r{background:#f6b27c}.m3-rc i.c{background:#c9ccd2}.m3-rc>div:last-child i.r{background:#f47b20}.m3-rc>div:last-child i.c{background:#9aa0a8}
.m3-rc small{font-size:10px;color:#8a8d93}
.m3-note{font-size:11.5px;color:#8a8d93;margin:-2px 0 10px;line-height:1.4}
.m3-cf{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px}
.m3-cf div{background:#f8f7f5;border-radius:12px;padding:9px 10px;display:flex;flex-direction:column;gap:2px}.m3-cf span{font-size:11px;color:#8a8d93}.m3-cf b{font-size:14.5px}.m3-cf b.g{color:#2a8a4a}.m3-cf b.r{color:#d9452f}
.m3-dtg{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:10px}
.m3-dtg button{all:unset;box-sizing:border-box;position:relative;display:grid;grid-template-columns:auto 1fr auto;grid-template-rows:auto auto;column-gap:8px;align-items:center;padding:10px 11px;border-radius:13px;background:#f8f7f5;cursor:pointer;border:1.5px solid transparent;transition:border-color .2s,background .2s;animation:m3in .45s cubic-bezier(.2,.8,.2,1) both}
.m3-dtg button:hover{background:#f1efeb}.m3-dtg button.on{border-color:var(--c);background:#fff}
.m3-dtg i{grid-row:1/3;width:8px;height:30px;border-radius:4px;background:var(--c)}
.m3-dtg span{font-size:12px;color:#5b5e63;font-weight:600}.m3-dtg b{grid-row:1/3;grid-column:3;font-size:17px}.m3-dtg em{font-style:normal;font-size:10.5px;color:#9a9ca1}
.m3-dtg button:last-child:nth-child(odd){grid-column:1/3}
@media (max-width:760px){.m3-amm{grid-template-columns:1fr}}
/* v284: gasolio */
.m3-dl{font-style:normal;font-weight:700;color:#8a8d93}.m3-dl.up{color:#c2410c}.m3-dl.dn{color:#2a8a4a}
.m3-hb>button{all:unset;box-sizing:border-box;display:flex;flex-direction:column;gap:5px;cursor:pointer;padding:4px 6px;margin:-4px -6px;border-radius:10px;animation:m3in .45s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--k)*50ms)}
.m3-hb>button:hover{background:#f6f5f2}.m3-hb span b .m3-pl{transform:scale(.85);transform-origin:left center;margin-right:-6px}
.m3-hb u{position:relative}.m3-hb u .avg{position:absolute;top:-3px;bottom:-3px;width:2px;margin-left:-1px;background:#16181b;border-radius:1px;opacity:.55}
.m3-an .m3-pi{width:30px;height:30px;border-radius:9px;background:#fde9e6;color:#d9452f}.m3-an .m3-pi svg{width:15px;height:15px}.m3-an .tx b{display:flex;align-items:center;gap:6px;font-weight:600}.m3-an .tx b .m3-pl{transform:scale(.8);transform-origin:left center;margin-right:-10px}
.m3-ok{background:#e7f5ea;color:#1f7a3b;border-radius:12px;padding:10px 12px;font-size:12.5px;font-weight:500}
.m3-last{background:#111316;color:#fff;border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;gap:6px;animation:m3in .45s cubic-bezier(.2,.8,.2,1) both}
.m3-last .m3-ey{color:#ffb02e}.m3-last div{display:flex;align-items:center;justify-content:space-between;gap:10px}.m3-last div>b{font-size:28px;font-weight:800;letter-spacing:-.02em;color:#ffb02e}.m3-last div>b small{font-size:13px;margin-left:3px;color:#fff;opacity:.7}.m3-last>small{color:rgba(255,255,255,.7);font-size:12px}
button.m3-chip{border:0;cursor:pointer;font:inherit}
/* v280: telefono e tablet */
.m3-lost{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:rgba(246,245,242,.92);backdrop-filter:blur(6px);font-size:15px}
.m3-lost small{color:#8a8d93;font-size:12.5px}
.m3.tch .m3-tip{display:none!important}
@media (min-width:761px) and (max-width:1180px){
 .m3-panel{width:360px;max-height:calc(100% - 100px)}.m3-tools{right:390px}
 .m3-flow{width:calc(100% - 420px)!important;padding:10px 14px 8px}
 .m3-brand b{display:none}.m3.np .m3-flow{width:calc(100% - 36px)!important;max-width:820px}
 .m3-fs{overflow-x:auto;justify-content:flex-start;gap:2px;scrollbar-width:none}.m3-fs::-webkit-scrollbar{display:none}.m3-fh em{display:none}
 .m3-kpis{max-width:calc(100% - 420px);overflow:hidden}.m3.np .m3-kpis{max-width:calc(100% - 110px)}
}
@media (min-width:761px) and (max-width:1024px){
 .m3-shots .m3-btn span,.m3-edit span{display:none}
 .m3-top{gap:8px;padding:0 12px}.m3-search{max-width:200px}
 .m3.pn .m3-kpis{display:none}
}
@media (max-width:760px){
 .m3-kpis{display:none!important}
 .m3-tools{top:auto!important;left:auto!important;right:10px!important;bottom:104px;padding:3px;transition:bottom .35s cubic-bezier(.2,.8,.2,1),opacity .25s}
 .m3-tools [data-m3="rl"],.m3-tools [data-m3="rr"],.m3-tools hr{display:none}
 .m3-tools button{width:40px;height:40px}
 .m3.pn .m3-tools{opacity:0;pointer-events:none}
 .m3-flow{padding:6px 6px 4px;bottom:10px;left:10px;right:10px;border-radius:18px;transition:transform .35s cubic-bezier(.2,.8,.2,1),opacity .25s}
 .m3-fh{display:none}.m3-fs{margin-top:0}
 .m3.pn .m3-flow{opacity:0;transform:translateY(30px);pointer-events:none}
 .m3-panel{top:auto!important;left:0!important;right:0!important;bottom:0;width:auto!important;max-height:56%!important;min-height:0;border-radius:24px 24px 0 0!important;padding-top:14px;box-shadow:0 -12px 40px rgba(20,24,18,.18)!important;transition:transform .4s cubic-bezier(.2,.8,.2,1),max-height .4s cubic-bezier(.2,.8,.2,1),opacity .3s}
 .m3-panel:before{content:'';position:absolute;left:50%;top:7px;width:42px;height:5px;margin-left:-21px;border-radius:3px;background:#d9d6d0}
 .m3-panel.big{max-height:calc(100% - 120px)!important}
 .m3.np .m3-panel{transform:translateY(105%)!important}
 .m3-ph{padding:12px 16px 4px}
 .m3-lb{height:24px;font-size:11.5px;padding:0 9px;border-radius:8px}.m3-lb em{display:none}.m3-lb.sm{height:22px;font-size:10.5px}
 .m3-co{left:10px!important;right:10px!important;top:122px!important;width:auto!important;transform:none!important;max-height:40%;overflow:auto}
 .m3-lead{display:none!important}
 .m3-edbar{bottom:12px}
}
@media (max-width:760px) and (max-height:700px){.m3-panel{max-height:62%!important}}

/* v281: telefono, impaginazione compatta (una riga in alto, niente flusso, schede dal fondo) */
@media (max-width:760px){
 .m3-top{flex-wrap:nowrap!important;height:auto!important;padding:calc(6px + env(safe-area-inset-top)) 8px 6px!important;gap:6px!important}
 .m3-x{order:0!important;flex:none;width:42px!important;height:42px!important}
 .m3-zone{order:1!important;flex:1 1 auto!important;min-width:0!important;height:42px!important;border-radius:13px}
 .m3-zone [data-m3="next"]{display:none}
 .m3-zone .m3-zc{width:34px!important;height:32px!important;font-size:11px!important}
 .m3-search{order:2!important;flex:0 0 42px!important;width:42px!important;min-width:0!important;height:42px!important;padding:0!important;justify-content:center;margin:0!important;border-radius:13px}
 .m3-search input{position:absolute;opacity:0;width:1px;pointer-events:none}.m3-search kbd{display:none}
 .m3-search:focus-within{position:absolute;left:8px;right:8px;top:calc(6px + env(safe-area-inset-top));width:auto!important;z-index:9;padding:0 12px!important;justify-content:flex-start;box-shadow:0 10px 30px rgba(0,0,0,.12)}
 .m3-search:focus-within input{position:static;opacity:1;width:auto;pointer-events:auto}
 .m3-bell{order:3!important;flex:none}
 .m3-shots,.m3-edit,.m3-live,.m3-sel{display:none!important}
 .m3-flow{display:none!important}
 .m3-tools{bottom:calc(16px + env(safe-area-inset-bottom))!important;right:12px!important;padding:3px;border-radius:14px}
 .m3-tools [data-m3="zin"],.m3-tools [data-m3="zout"],.m3-tools [data-m3="play"]{display:none!important}
 .m3-tools button{width:44px!important;height:44px!important}
 .m3-panel{max-height:42%!important;padding-bottom:env(safe-area-inset-bottom)}
 .m3-panel.big{max-height:calc(100% - 70px - env(safe-area-inset-top))!important}
 .m3-co{top:auto!important;bottom:0!important;left:0!important;right:0!important;width:auto!important;border-radius:22px 22px 0 0!important;max-height:46%;padding-bottom:calc(12px + env(safe-area-inset-bottom))!important;box-shadow:0 -12px 40px rgba(20,24,18,.18)!important}
 .m3.co-on .m3-panel{transform:translateY(105%)!important;pointer-events:none}
 .m3.co-on .m3-tools{opacity:0;pointer-events:none}
 .m3-lb{height:22px;font-size:11px;padding:0 8px}
 .m3-toast{top:calc(64px + env(safe-area-inset-top))!important;max-width:calc(100% - 24px);white-space:normal;text-align:center}
}
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
    return { mag, arts, cats, catOf, tot, disp, val, low, out, MM, car, car30, ret, ret90, scar, ddt, ddtM, trf: C.xiTransito(), t0, nArt: arts.length, cli: C.cli(), refG, gas: gasData(), rcv: rcvData(car30) };
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
  function mat(c, o) { const k = c + (o ? JSON.stringify(o) : ''); if (M[k]) return M[k]; const m = M[k] = new T.MeshLambertMaterial({ color: c, ...(o || {}) }); if (!o) m.__sh = 1; return m; }
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
  // v286: le chiamate «a perdere» (risultato non usato) segnano la mesh come statica; mergeStatic le fonde per gruppo e materiale (molte meno chiamate di disegno)
  const bxS = (...a) => { const m = bx(...a); m.__s = 1; return m; };
  const meshS = (...a) => { const m = mesh(...a); m.__s = 1; return m; };
  function mergeStatic(root) {
    const pk = new Set(pick), groups = [], v = new T.Vector3(), nm = new T.Matrix3();
    root.traverse(o => { if (!o.isMesh) groups.push(o); });
    for (const p of groups) {
      const bk = new Map();
      for (const c of p.children) {
        if (!c.__s || !c.isMesh || c.isInstancedMesh || c.children.length || !c.visible || Array.isArray(c.material) || pk.has(c) || Object.keys(c.userData).length) continue;
        const g = c.geometry; if (!g.attributes.position || !g.attributes.normal || g.attributes.position.isInterleavedBufferAttribute) continue;
        const mt = c.material, vc = mt.__sh && mt.isMeshLambertMaterial && !mt.map && !mt.transparent && mt.side === T.FrontSide;
        const k = (vc ? 'VC' : mt.uuid + '|' + (g.attributes.uv ? 1 : 0)) + '|' + c.castShadow + '|' + c.receiveShadow + '|' + c.renderOrder;
        let a = bk.get(k); if (!a) bk.set(k, a = []); a.push(c);
      }
      for (const a of bk.values()) {
        if (a.length < 2) continue;
        let nv = 0, ni = 0; for (const c of a) { const g = c.geometry; nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
        const vc = a[0].material.__sh && !a[0].material.map && !a[0].material.transparent && a[0].material.side === T.FrontSide && a.every(c => c.material.__sh), C3 = vc ? new Float32Array(nv * 3) : null;
        if (!vc && a.some(c => c.material !== a[0].material)) continue;
        const hasUv = !vc && !!a[0].geometry.attributes.uv, P3 = new Float32Array(nv * 3), N3 = new Float32Array(nv * 3), U2 = hasUv ? new Float32Array(nv * 2) : null, I = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
        let vo = 0, io = 0;
        for (const c of a) {
          c.updateMatrix(); const mm = c.matrix, g = c.geometry, pa = g.attributes.position, na = g.attributes.normal, ua = g.attributes.uv, flip = mm.determinant() < 0; nm.getNormalMatrix(mm);
          for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(mm); P3[(vo + i) * 3] = v.x; P3[(vo + i) * 3 + 1] = v.y; P3[(vo + i) * 3 + 2] = v.z; v.fromBufferAttribute(na, i).applyMatrix3(nm).normalize(); N3[(vo + i) * 3] = v.x; N3[(vo + i) * 3 + 1] = v.y; N3[(vo + i) * 3 + 2] = v.z; if (U2) { U2[(vo + i) * 2] = ua.getX(i); U2[(vo + i) * 2 + 1] = ua.getY(i); } if (C3) { const cc = c.material.color; C3[(vo + i) * 3] = cc.r; C3[(vo + i) * 3 + 1] = cc.g; C3[(vo + i) * 3 + 2] = cc.b; } }
          const cnt = g.index ? g.index.count : pa.count;
          for (let i = 0; i < cnt; i += 3) { const i0 = g.index ? g.index.getX(i) : i, i1 = g.index ? g.index.getX(i + 1) : i + 1, i2 = g.index ? g.index.getX(i + 2) : i + 2; I[io++] = vo + i0; I[io++] = vo + (flip ? i2 : i1); I[io++] = vo + (flip ? i1 : i2); }
          vo += pa.count; p.remove(c);
        }
        const bg = new T.BufferGeometry(); bg.setAttribute('position', new T.BufferAttribute(P3, 3)); bg.setAttribute('normal', new T.BufferAttribute(N3, 3)); if (U2) bg.setAttribute('uv', new T.BufferAttribute(U2, 2)); if (C3) bg.setAttribute('color', new T.BufferAttribute(C3, 3)); bg.setIndex(new T.BufferAttribute(I, 1)); bg.computeBoundingSphere(); bg.computeBoundingBox(); OWN.push(bg);
        const m = new T.Mesh(bg, vc ? (M.__vc || (M.__vc = new T.MeshLambertMaterial({ vertexColors: true }))) : a[0].material); m.castShadow = a[0].castShadow; m.receiveShadow = a[0].receiveShadow; m.renderOrder = a[0].renderOrder; m.__mg = 1; p.add(m);
      }
    }
  }
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
    bxS(P2, W + 26, .12, Dd + 20, 0xe7e6e2, 2, 0, 2, { ns: 1 });
    const yardW = 30, rz = hd + 31;
    const yard = mesh(G.box, new T.MeshLambertMaterial({ color: 0x575c64 }), hw + yardW / 2 + .5, .08, 0, P2, { s: [yardW, .16, Dd + 18], ns: 1 }); OWN.push(yard.material);
    bxS(P2, 11, .15, rz - 5.7 - hd - 9, 0x575c64, hw + 18, 0, (hd + 9 + rz - 5.7) / 2, { ns: 1 });
    const road = mesh(G.box, new T.MeshLambertMaterial({ map: TX.road }), 0, .07, rz, P2, { s: [1600, .14, 11], ns: 1 }); OWN.push(road.material);
    const B2 = new Batch(P2), dsh = (x, z, w, d) => B2.add('dash', G.box, mat(0xf4f4f2), m4(x, .16, z, w, .04, d));
    for (let x = -360; x < 360; x += 9) dsh(x, rz, 4, .3);
    for (let x = -800; x < 800; x += 800) { bxS(P2, 1600, .1, .45, 0xe9e7df, 0, 0, rz - 5.8, { ns: 1 }); bxS(P2, 1600, .1, .45, 0xe9e7df, 0, 0, rz + 5.8, { ns: 1 }); break; }
    // linee del piazzale camion
    for (let i = 0; i < 7; i++) dsh(hw + 20, -hd + 2 + i * (Dd - 4) / 6, 12, .22);
    // sfera arancione all'ingresso
    const orb = mesh(G.sph, mat(0xf47b20), 0, 3.6, hd + 10, P2, { s: [4.4, 4.4, 4.4] }); bxS(P2, 4, .8, 4, 0x2b2f35, 0, 0, hd + 10); movers.push({ o: orb, t: 'float', y: 3.6 });
    // alberi
    const free = (x, z) => !(x > -hw - 42 && x < hw + yardW + 6 && z > -hd - 14 && z < hd + 24) && !(z > rz - 9 && z < rz + 9) && !(x > hw + 10 && x < hw + 26 && z > hd && z < rz);
    let n = 0; while (n < 680) { const near = rr() < .38, x = (rr() - .5) * (near ? W + 160 : 620), z = (rr() - .5) * (near ? Dd + 140 : 480) - (near ? 5 : 30); if (!free(x, z)) continue; n++; const s = .55 + rr() * .6;
      if (rr() < .22) B2.add('pine', G.pine, mat(0x4f9a43), m4(x, 0, z, s, s * 1.15, s)); else { B2.add('tree', G.tree, mat(0xffffff), m4(x, 2.6 * s + 1.1, z, s, s, s), [0x7cbf4f, 0x8cc95a, 0x6fb347, 0x98cf62][Math.floor(rr() * 4)]); B2.add('trunk', G.trunk, mat(0x8a6a4f), m4(x, 0, z, s, s, s)); } }
    for (let i = 0; i < 28; i++) B2.add('bush', G.tree, mat(0x86c457), m4(-hw + 2 + i * (W - 4) / 27, .7, hd + 3.2 + (i % 2) * .6, .5, .42, .5));
    buildOutdoor(P2, hw, hd, rz, yardW);
    B2.flush(); mergeStatic(ENV);
  }

  /* ---------------- esterni (v285): prato, giardino con laghetto e fontana, recinzione, cancello, bandiere, insegna, lampioni, traffico, cielo ---------------- */
  function lawnTex() { if (TX.lawn) return TX.lawn; const t = cvTex(256, 256, (gx, w, h) => { for (let i = 0; i < 8; i++) { gx.fillStyle = i % 2 ? '#8cca5b' : '#97d365'; gx.fillRect(0, i * h / 8, w, h / 8); } for (let i = 0; i < 1600; i++) { gx.fillStyle = `rgba(${50 + rr() * 50},${110 + rr() * 70},40,.16)`; gx.fillRect(rr() * w, rr() * h, 1.6, 1.6); } }); t.wrapS = t.wrapT = T.RepeatWrapping; return (TX.lawn = t); }
  function paveTex() { if (TX.pave) return TX.pave; const t = cvTex(128, 128, (gx, w, h) => { gx.fillStyle = '#d9d5cc'; gx.fillRect(0, 0, w, h); gx.strokeStyle = '#c4bfb4'; gx.lineWidth = 2; for (let i = 0; i <= 4; i++) { gx.beginPath(); gx.moveTo(i * w / 4, 0); gx.lineTo(i * w / 4, h); gx.stroke(); } for (let j = 0; j <= 2; j++) { gx.beginPath(); gx.moveTo(0, j * h / 2); gx.lineTo(w, j * h / 2); gx.stroke(); } }); t.wrapS = t.wrapT = T.RepeatWrapping; return (TX.pave = t); }
  function fenceTex() { if (TX.fence) return TX.fence; const t = cvTex(128, 128, (gx, w, h) => { gx.clearRect(0, 0, w, h); gx.strokeStyle = '#3d5a45'; gx.lineWidth = 2.2; for (let i = 0; i <= 8; i++) { gx.beginPath(); gx.moveTo(i * w / 8, 0); gx.lineTo(i * w / 8, h); gx.stroke(); } for (let j = 0; j <= 4; j++) { gx.beginPath(); gx.moveTo(0, j * h / 4); gx.lineTo(w, j * h / 4); gx.stroke(); } gx.lineWidth = 5; gx.strokeRect(1, 1, w - 2, h - 2); }); return (TX.fence = t); }
  function waterTex() { if (TX.water) return TX.water; const t = cvTex(256, 256, (gx, w, h) => { gx.fillStyle = '#4fa9cf'; gx.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { const x = rr() * w, y = rr() * h, r = 8 + rr() * 26; gx.strokeStyle = `rgba(255,255,255,${.08 + rr() * .14})`; gx.lineWidth = 1.5; gx.beginPath(); gx.ellipse(x, y, r, r * .35, 0, 0, Math.PI * 2); gx.stroke(); } }); t.wrapS = t.wrapT = T.RepeatWrapping; return (TX.water = t); }
  function flagTex(k) {
    const key = 'flag_' + k; if (TX[key]) return TX[key];
    return (TX[key] = cvTex(384, 256, (gx, w, h) => {
      if (k === 'it') { ['#009246', '#f4f5f0', '#ce2b37'].forEach((c, i) => { gx.fillStyle = c; gx.fillRect(i * w / 3, 0, w / 3 + 1, h); }); }
      else if (k === 'eu') { gx.fillStyle = '#003399'; gx.fillRect(0, 0, w, h); gx.fillStyle = '#ffcc00'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, x = w / 2 + Math.cos(a) * 72, y = h / 2 + Math.sin(a) * 72; gx.beginPath(); for (let j = 0; j < 10; j++) { const r2 = j % 2 ? 5 : 12, b = -Math.PI / 2 + j * Math.PI / 5; gx.lineTo(x + Math.cos(b) * r2, y + Math.sin(b) * r2); } gx.fill(); } }
      else { gx.fillStyle = '#f47b20'; gx.fillRect(0, 0, w, h); gx.fillStyle = '#fff'; gx.beginPath(); gx.roundRect(36, 78, 100, 100, 22); gx.fill(); gx.fillStyle = '#f47b20'; gx.font = '800 62px Inter, system-ui, sans-serif'; gx.textAlign = 'center'; gx.textBaseline = 'middle'; gx.fillText(String(C.orgName() || 'A').trim()[0].toUpperCase(), 86, 130);
        gx.fillStyle = '#fff'; gx.textAlign = 'left'; let fs = 40; const nm = String(C.orgName() || '').toUpperCase().slice(0, 22); gx.font = `800 ${fs}px Inter, system-ui, sans-serif`; while (fs > 20 && gx.measureText(nm).width > w - 170) { fs -= 2; gx.font = `800 ${fs}px Inter, system-ui, sans-serif`; } gx.fillText(nm, 156, 130); }
    }));
  }
  // automobile generica (stesso profilo delle auto aziendali, colore libero, senza livrea)
  function plainCar(par, color) {
    const P = VP.car, g = new T.Group(); par.add(g); const bev = .09, glass = M.glass || (M.glass = new T.MeshLambertMaterial({ color: 0x2c3e55 }));
    meshS(vgeo('vb_car', P.body, P.w - 2 * bev, bev), mat(color), 0, 0, 0, g); meshS(vgeo('vg_car', P.side, P.w + .06, 0), glass, 0, 0, 0, g, { ns: 1 });
    P.wh.forEach(([wx, r]) => { for (const s of [-1, 1]) meshS(G.cyl, mat(0x15171a), wx, r, s * (P.w / 2 - .12), g, { s: [r * 2, .27, r * 2], rx: Math.PI / 2, ns: 1 }); });
    for (const s of [-1, 1]) { meshS(G.box, mat(0xfff3d1), 2.33, .7, s * (P.w / 2 - .3), g, { s: [.05, .13, .3], ns: 1 }); meshS(G.box, mat(0xd8322a), -2.36, .82, s * (P.w / 2 - .14), g, { s: [.05, .2, .16], ns: 1 }); }
    return g;
  }
  function bench(par, x, z, ry) {
    const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry; par.add(g);
    for (let i = 0; i < 3; i++) bxS(g, 1.8, .05, .14, 0xb98756, 0, .46, -.2 + i * .17, { ns: 1 });
    for (let i = 0; i < 2; i++) bxS(g, 1.8, .12, .04, 0xb98756, 0, .62 + i * .17, -.34, { ns: 1, rx: -.12 });
    for (const sx of [-.75, .75]) { bxS(g, .06, .46, .5, 0x2b2f35, sx, 0, -.05); bxS(g, .06, .4, .05, 0x2b2f35, sx, .5, -.33, { ns: 1 }); }
    return g;
  }
  function ornTree(par, x, z, s, col) {
    const g = new T.Group(); g.position.set(x, 0, z); par.add(g);
    meshS(G.trunk, mat(0x7a5a40), 0, 0, 0, g, { s: [s * .8, s, s * .8] });
    meshS(G.tree, mat(col), 0, 2.6 * s + .9, 0, g, { s: [s * .82, s * .9, s * .82] }); meshS(G.tree, mat(mixC(col, 0xffffff, .12)), .5 * s, 2.9 * s + 1.4, .3 * s, g, { s: [s * .5, s * .5, s * .5] });
    movers.push({ o: g, t: 'sway', ph: rr() * 6, a: .018 + rr() * .012 }); return g;
  }
  function buildOutdoor(P2, hw, hd, rz, yardW) {
    const B = new Batch(P2), lite = Q && Q.tier === 0, zF = hd + 12, zW = rz - 7.1, ox = hw * .5, gx0 = hw + 18;
    // prato rasato a strisce tra piazzale e marciapiede
    { const w = hw * 2 + 24, d = zW - 1.15 - zF; const m = new T.MeshLambertMaterial({ map: lawnTex() }); m.map.repeat.set(w / 18, d / 18); OWN.push(m); const p = new T.Mesh(G.plane, m); p.scale.set(w, d, 1); p.rotation.x = -Math.PI / 2; p.position.set(2, .03, zF + d / 2); p.receiveShadow = true; P2.add(p); }
    // marciapiede con cordolo, interrotto agli accessi e davanti agli uffici
    const gaps = [[-hw - 25.3, -hw - 15.7], [ox - 7.2, ox + 7.2], [gx0 - 5.7, gx0 + 5.7]], segs = []; let x0 = -420;
    gaps.sort((a, b) => a[0] - b[0]).forEach(([a, b]) => { segs.push([x0, a]); x0 = b; }); segs.push([x0, 420]);
    const pvM = new T.MeshLambertMaterial({ map: paveTex() }); OWN.push(pvM);
    segs.forEach(([a, b]) => { if (b - a < .5) return; const w = b - a, m2 = pvM.clone(); m2.map = paveTex().clone(); m2.map.needsUpdate = true; m2.map.repeat.set(w / 2.4, 1); OWN.push(m2, m2.map); meshS(G.box, m2, (a + b) / 2, .1, zW, P2, { s: [w, .2, 2.2], ns: 1 }).receiveShadow = true; bxS(P2, w, .24, .22, 0xbdb9b0, (a + b) / 2, 0, zW + 1.2, { ns: 1 }); });
    // vialetto pedonale fino agli uffici e cancello pedonale
    bxS(P2, 2.6, .14, zW - 1.1 - (hd + 24.9), 0xd9d5cc, ox, 0, (zW - 1.1 + hd + 24.9) / 2, { ns: 1 });
    // ---- giardino con laghetto e fontana (al posto del parcheggio)
    const pcx = -hw * .45, pcz = hd + 16.9;
    bxS(P2, 13.2, .16, 11, 0xe4dccb, pcx, 0, pcz, { ns: 1 });
    meshS(G.cyl, mat(0xbfb9ad), pcx, .32, pcz, P2, { s: [9.0, .32, 9.0] });
    const wm = new T.MeshLambertMaterial({ map: waterTex(), transparent: true, opacity: .94 }); OWN.push(wm); const wtr = mesh(G.cyl, wm, pcx, .42, pcz, P2, { s: [8.2, .2, 8.2], ns: 1 }); wtr.receiveShadow = true;
    const rim = new T.Mesh(new T.TorusGeometry(4.2, .26, 8, 48), mat(0xd9d4c8)); OWN.push(rim.geometry); rim.rotation.x = Math.PI / 2; rim.position.set(pcx, .52, pcz); rim.castShadow = true; P2.add(rim);
    movers.push({ t: 'tex', tx: wm.map, sx: .012, sy: .007 });
    // fontana: vasca centrale e getti d'acqua animati
    meshS(G.cyl, mat(0xd9d4c8), pcx, .75, pcz, P2, { s: [1.1, .9, 1.1] }); meshS(G.cyl, mat(0xd9d4c8), pcx, 1.25, pcz, P2, { s: [2.3, .18, 2.3] }); meshS(G.cyl, new T.MeshLambertMaterial({ color: 0x6cc0e0 }), pcx, 1.33, pcz, P2, { s: [2.0, .04, 2.0], ns: 1 });
    { const nD = lite ? 36 : 84, dm = new T.MeshLambertMaterial({ color: 0xe3f5ff, transparent: true, opacity: .85 }); OWN.push(dm); const im = new T.InstancedMesh(G.sph, dm, nD); im.frustumCulled = false; P2.add(im);
      const rings = [0, 1, 2].map(i => { const m2 = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .4, depthWrite: false }); OWN.push(m2); const r = new T.Mesh(new T.TorusGeometry(1, .035, 4, 40), m2); OWN.push(r.geometry); r.rotation.x = Math.PI / 2; r.position.set(pcx, .54, pcz); P2.add(r); return r; });
      movers.push({ t: 'ftn', im, n: nD, cx: pcx, cz: pcz, rings }); }
    // panchine, aiuole fiorite, alberi ornamentali, lampioncini
    [[0, -5.0, 0], [0, 5.0, Math.PI], [-5.6, 0, Math.PI / 2], [5.6, 0, -Math.PI / 2]].forEach(([dx, dz, ry]) => bench(P2, pcx + dx, pcz + dz, ry));
    const FC = [0xf06292, 0xffffff, 0xffd54f, 0xba68c8, 0xff8a65, 0x64b5f6];
    [[-6.3, -4.4], [6.3, -4.4], [-6.3, 4.4], [6.3, 4.4], [-8.5, 0], [8.5, 0]].forEach(([dx, dz], k) => { const fx = pcx + dx, fz = pcz + dz; meshS(G.cyl, mat(0xbfb9ad), fx, .14, fz, P2, { s: [2.25, .28, 2.25], ns: 1 }); meshS(G.cyl, mat(0x6b4a33), fx, .3, fz, P2, { s: [2.0, .06, 2.0], ns: 1 });
      for (let i = 0; i < (lite ? 10 : 22); i++) { const a = rr() * Math.PI * 2, r = rr() * .85; B.add('flw', G.sph, mat(0xffffff), m4(fx + Math.cos(a) * r, .42 + rr() * .12, fz + Math.sin(a) * r, .2, .16, .2), FC[(i + k) % FC.length]); B.add('flwl', G.sph, mat(0x5e9e4a), m4(fx + Math.cos(a + .4) * r * .9, .34, fz + Math.sin(a + .4) * r * .9, .24, .14, .24)); } });
    [[-10.5, -4.6], [-10.5, 4.4], [10.5, -4.6], [10.5, 4.4], [13.6, 0]].forEach(([dx, dz], i) => ornTree(P2, pcx + dx, pcz + dz, .78 + (i % 3) * .1, [0x7cbf4f, 0xf3a6c0, 0x6fb347, 0x98cf62, 0xe9b3c9][i]));
    for (const [dx, dz] of [[-6.6, -5.5], [6.6, -5.5], [-6.6, 5.5], [6.6, 5.5]]) { B.add('bol', G.cyl, mat(0x2b2f35), m4(pcx + dx, .5, pcz + dz, .16, .9, .16)); B.add('bolL', G.cyl, new T.MeshBasicMaterial({ color: 0xfff2cc }), m4(pcx + dx, 1.0, pcz + dz, .18, .12, .18)); }
    // siepi basse lungo il prato
    for (const [x, z, w, d] of [[-hw - 7, zW - 1.9, 6, .7], [ox - 11.5, zW - 1.9, 6.5, .7], [ox + 11.5, zW - 1.9, 6.5, .7], [hw - 1, zW - 1.9, 8, .7]]) { bxS(P2, w, .9, d, 0x5f9e45, x, 0, z); bxS(P2, w - .2, .12, d - .2, 0x6fb24f, x, .9, z, { ns: 1 }); }
    // ---- bandiere al vento (Italia, Europa, azienda)
    [['it', 1.2], ['eu', 3.5], ['co', 5.8]].forEach(([k, x], i) => {
      const fx = x, fz = hd + 21; bxS(P2, .9, .3, .9, 0xcfcac0, fx, 0, fz); meshS(G.cyl, mat(0xf2f3f5), fx, 4.75, fz, P2, { s: [.13, 9, .13] }); meshS(G.sph, mat(0xd9b24a), fx, 9.3, fz, P2, { s: [.22, .22, .22], ns: 1 });
      const geo = new T.PlaneGeometry(2.6, 1.7, 16, 8).translate(1.3, 0, 0); OWN.push(geo); const fm = new T.MeshLambertMaterial({ map: flagTex(k), side: T.DoubleSide }); OWN.push(fm);
      const fl = new T.Mesh(geo, fm); fl.position.set(fx + .07, 8.25, fz); fl.rotation.y = -.25; fl.castShadow = true; P2.add(fl);
      movers.push({ t: 'flag', geo, base: Float32Array.from(geo.attributes.position.array), ph: i * 1.7, n: 0 }); });
    // ---- insegna monolitica all'ingresso merci
    { const mx = hw + 8.5, mz = hd + 21.2; bxS(P2, 3.2, .35, 1.6, 0xcfcac0, mx, 0, mz); bxS(P2, 2.2, 5.6, .7, 0x1d1f22, mx, .35, mz); bxS(P2, .25, 5.78, .76, 0xf47b20, mx - 1.0, .35, mz, { ns: 1 });
      const on = String(C.orgName() || '').toUpperCase().slice(0, 22), t2 = textTex([[on, Math.max(18, Math.min(34, Math.floor(640 / Math.max(1, on.length)))), 800, 52, null, '#ffffff'], ['INGRESSO MERCI', 26, 700, 110, null, '#f47b20'], ['Accettazione · Spedizioni', 22, 600, 150, null, 'rgba(255,255,255,.75)']], { w: 360, h: 190 });
      planeT(t2, 1.85, .98, P2, mx + .1, 4.6, mz + .362); planeT(t2, 1.85, .98, P2, mx + .1, 4.6, mz - .362, { ry: Math.PI });
      for (const s of [-1, 1]) { meshS(G.cyl, mat(0x6b4a33), mx + s * 2.3, .2, mz + .9, P2, { s: [1.1, .4, 1.1], ns: 1 }); for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; B.add('flw', G.sph, mat(0xffffff), m4(mx + s * 2.3 + Math.cos(a) * .32, .5, mz + .9 + Math.sin(a) * .32, .18, .15, .18), FC[i % FC.length]); } } }
    // ---- portineria e sbarra sull'accesso camion (si alza quando esce un'auto)
    const gz = hd + 20.5, gpx = gx0 + 5.9;
    { const hx = gx0 + 8.6; bxS(P2, 3.6, .3, 3.2, 0xcfcac0, hx, 0, gz); bxS(P2, 3.2, 2.6, 2.8, 0xf4f5f6, hx, .3, gz); for (const s of [-1, 1]) { bxS(P2, 2.6, 1.3, .04, 0x2c3e55, hx, 1.2, gz + s * 1.42, { ns: 1 }); bxS(P2, .04, 1.3, 2.2, 0x2c3e55, hx + s * 1.62, 1.2, gz, { ns: 1 }); }
      bxS(P2, 4.2, .28, 3.8, 0xffffff, hx, 2.9, gz); bxS(P2, 4.24, .12, 3.84, 0xf47b20, hx, 3.0, gz, { ns: 1 });
      planeT(textTex([['PORTINERIA', 34, 800, 44, null, '#16181b']], { bg: '#ffffff', w: 320, h: 80, round: 8 }), 1.6, .4, P2, hx, 2.62, gz + 1.48);
      const gp = person(P2, hx - .3, gz - .4, 0x2f6db4, null, { mode: 'work' }); gp.position.y = .3; gp.rotation.y = -Math.PI / 2; movers.push({ o: gp, t: 'bob', ph: 4 }); }
    bxS(P2, .4, 1.1, .4, 0xf2c418, gpx, 0, gz); bxS(P2, .5, .3, .5, 0x1d1f22, gpx, 1.1, gz);
    const barTex = cvTex(256, 16, (g2, w, h) => { for (let i = 0; i < 8; i++) { g2.fillStyle = i % 2 ? '#ffffff' : '#d62b1f'; g2.fillRect(i * w / 8, 0, w / 8, h); } }); OWN.push(barTex);
    const arm = new T.Group(); arm.position.set(gpx, 1.25, gz); P2.add(arm); const am = new T.MeshLambertMaterial({ map: barTex }); OWN.push(am); meshS(G.box, am, -5.4, 0, 0, arm, { s: [10.6, .12, .12] }); meshS(G.box, mat(0x2b2f35), .1, 0, 0, arm, { s: [.5, .22, .2] });
    bxS(P2, .3, 1.19, .3, 0xf2c418, gx0 - 5.6, 0, gz); bxS(P2, 11, .02, .45, 0xf4f4f2, gx0, .15, gz - 1.6, { ns: 1 });
    for (let i = 0; i < 5; i++) B.add('bump', G.box, mat(0xffffff), m4(gx0 - 4.4 + i * 2.2, .19, gz - 4.5, 2.2, .08, .6), i % 2 ? 0x1d1f22 : 0xf2c418);
    { const car = plainCar(P2, 0x3a4352), A = new T.Vector3(gx0 - 2.7, .16, hd - 2), Bp = new T.Vector3(gx0 - 2.7, .16, gz - 2.6);
      const C2 = new T.CatmullRomCurve3([Bp.clone(), new T.Vector3(gx0 - 2.7, .16, rz - 6.4), new T.Vector3(gx0 + .5, .155, rz - 3.2), new T.Vector3(gx0 + 8, .148, rz - 2.5), new T.Vector3(gx0 + 150, .148, rz - 2.5)]);
      movers.push({ t: 'gate', car, arm, A, B: Bp, C: C2, ph: 3 }); }
    // ---- recinzione perimetrale (pannelli a rete su montanti), con aperture agli accessi
    { const fm = new T.MeshLambertMaterial({ map: fenceTex(), transparent: true, alphaTest: .35, side: T.DoubleSide }); OWN.push(fm);
      const X0 = -hw - 37.5, X1 = hw + yardW + 1.5, Z0 = -hd - 10.5, Z1 = zW - 1.4, PW = 2.5, fg = [[-hw - 25.3, -hw - 15.7], [ox - 15.4, ox + 15.4], [gx0 - 5.7, gx0 + 9.5 + 1.2]];
      const run = (ax, az, bxx, bz) => { const L2 = Math.hypot(bxx - ax, bz - az), n = Math.max(1, Math.round(L2 / PW)), ry = Math.atan2(-(bz - az), bxx - ax);
        for (let i = 0; i < n; i++) { const u0 = i / n, u1 = (i + 1) / n, cx = ax + (bxx - ax) * (u0 + u1) / 2, cz = az + (bz - az) * (u0 + u1) / 2; if (az === bz && az === Z1 && fg.some(([a, b]) => cx > a - .6 && cx < b + .6)) continue;
          B.add('fpan', G.plane, fm, m4(cx, 1.05, cz, L2 / n, 1.9, 1, ry)); B.add('fpost', G.box, mat(0x3d5a45), m4(ax + (bxx - ax) * u0, 1.05, az + (bz - az) * u0, .08, 2.1, .08)); } };
      run(X0, Z1, X1, Z1); run(X0, Z0, X1, Z0); run(X0, Z0, X0, Z1); run(X1, Z0, X1, Z1); }
    // ---- lampioni lungo il marciapiede e attraversamento pedonale
    for (let x = -176; x <= 176; x += 22) { if (gaps.some(([a, b]) => x > a - 1 && x < b + 1)) continue; B.add('lp', G.cyl, mat(0x4a4f57), m4(x, 3.6, zW - .9, .16, 7.2, .16)); B.add('lpa', G.box, mat(0x4a4f57), m4(x, 7.1, zW + .1, .1, .1, 2.2)); B.add('lph', G.box, mat(0x2b2f35), m4(x, 7.05, zW + 1.15, .5, .16, .8)); B.add('lpl', G.box, new T.MeshBasicMaterial({ color: 0xfff4d6 }), m4(x, 6.96, zW + 1.15, .4, .02, .66)); }
    for (let i = 0; i < 10; i++) B.add('zeb', G.box, mat(0xf6f6f4), m4(ox, .148, rz - 4.95 + i * 1.1, 3, .012, .55));
    for (const s of [-1, 1]) { const zz = rz + s * 7.6; B.add('sgp', G.cyl, mat(0x8e959e), m4(ox - 2.4 * s, 1.4, zz, .08, 2.8, .08)); const t3 = TX.ped || (TX.ped = cvTex(128, 128, (g2, w, h) => { g2.fillStyle = '#1f4fb4'; g2.fillRect(0, 0, w, h); g2.fillStyle = '#fff'; g2.beginPath(); g2.moveTo(w / 2, 14); g2.lineTo(w - 14, h - 18); g2.lineTo(14, h - 18); g2.closePath(); g2.fill(); g2.fillStyle = '#16181b'; for (let i = 0; i < 4; i++) g2.fillRect(28 + i * 19, h - 34, 11, 8); g2.beginPath(); g2.arc(64, 46, 6, 0, Math.PI * 2); g2.fill(); g2.lineWidth = 5; g2.strokeStyle = '#16181b'; g2.lineCap = 'round'; g2.beginPath(); g2.moveTo(64, 54); g2.lineTo(60, 74); g2.lineTo(52, 88); g2.moveTo(60, 74); g2.lineTo(70, 88); g2.moveTo(52, 64); g2.lineTo(72, 62); g2.stroke(); })); const pl = planeT(t3, .62, .62, P2, ox - 2.4 * s, 2.75, zz + .05 * s, s < 0 ? { ry: Math.PI } : {}); pl.renderOrder = 1; B.add('sgb', G.box, mat(0x2f6db4), m4(ox - 2.4 * s, 2.75, zz, .74, .74, .04)); }
    // ---- fermata dell'autobus
    { const bxp = hw + 44, bzp = zW - .2; bxS(P2, 4, .1, 1.5, 0x8e959e, bxp, 2.45, bzp - .2); bxS(P2, 4, 2.3, .05, 0x9fc3da, bxp, .2, bzp - .85, { ns: 1 }); for (const s of [-1, 1]) bxS(P2, .08, 2.35, 1.5, 0x4a4f57, bxp + s * 2, .2, bzp - .2); bxS(P2, 3, .08, .4, 0xb98756, bxp, .62, bzp - .55, { ns: 1 });
      B.add('sgp', G.cyl, mat(0x8e959e), m4(bxp + 2.7, 1.5, bzp + .5, .08, 3, .08)); planeT(textTex([['BUS', 52, 800, 62, null, '#ffffff']], { bg: '#1f4fb4', w: 160, h: 110, round: 10 }), .6, .41, P2, bxp + 2.7, 2.9, bzp + .56); }
    // ---- traffico sulla strada
    const cols = [0xd62b1f, 0xf4f5f6, 0x2f3540, 0x5b7fa6, 0xc9c6bf, 0x8a2b3a, 0x3c6e4f];
    for (let i = 0; i < (lite ? 2 : 5); i++) { const dir = i % 2 ? -1 : 1, car = plainCar(P2, cols[i % cols.length]); car.position.set(-260 + i * 113, .148, rz + (dir > 0 ? -2.5 : 2.5)); car.rotation.y = dir > 0 ? 0 : Math.PI; movers.push({ o: car, t: 'road', sp: dir > 0 ? 7.5 : 6.5, dir }); }
    // ---- cielo: nuvole che scorrono e uccelli
    const cm = new T.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: .9 }); OWN.push(cm);
    for (let i = 0; i < (lite ? 3 : 7); i++) { const g = new T.Group(); g.position.set(-300 + i * 95 + rr() * 40, 58 + rr() * 22, -hd - 150 - rr() * 120); P2.add(g); const n2 = 4 + Math.floor(rr() * 3);
      for (let k = 0; k < n2; k++) { const c = new T.Mesh(G.sph, cm); const s2 = 9 + rr() * 9; c.scale.set(s2 * 1.4, s2 * .7, s2); c.position.set((k - n2 / 2) * 7 + rr() * 3, rr() * 2.5, rr() * 6 - 3); g.add(c); }
      movers.push({ o: g, t: 'cloud', sp: 1.6 + rr() * 1.4 }); }
    { const fl = new T.Group(); P2.add(fl); const bm = mat(0x2b2f35), birds = [];
      for (let i = 0; i < 7; i++) { const b = new T.Group(), off = i === 0 ? [0, 0] : [-(Math.ceil(i / 2)) * 2.2, (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 1.8]; b.position.set(off[0], (rr() - .5) * .8, off[1]); fl.add(b);
        const wl = new T.Group(), wr = new T.Group(); b.add(wl, wr); meshS(G.box, bm, 0, 0, .55, wl, { s: [.35, .04, 1.1], ns: 1 }); meshS(G.box, bm, 0, 0, -.55, wr, { s: [.35, .04, 1.1], ns: 1 }); meshS(G.box, bm, 0, 0, 0, b, { s: [.7, .14, .18], ns: 1 }); birds.push({ wl, wr, ph: rr() * 6 }); }
      movers.push({ t: 'birds', o: fl, birds, z: hd - 40 }); }
    B.flush();
  }
  function outdoorTick(m, t, dt) {
    if (m.t === 'sway') { m.o.rotation.z = Math.sin(t * .9 + m.ph) * m.a; m.o.rotation.x = Math.sin(t * .7 + m.ph * 1.3) * m.a * .7; }
    else if (m.t === 'tex') { m.tx.offset.x = (t * m.sx) % 1; m.tx.offset.y = (t * m.sy) % 1; }
    else if (m.t === 'flag') { const pa = m.geo.attributes.position, a = pa.array, b = m.base; for (let i = 0; i < a.length; i += 3) { const x0 = b[i], y0 = b[i + 1], k = x0 / 2.6; a[i + 2] = (Math.sin(x0 * 2.3 - t * 5.4 + m.ph) * .2 + Math.sin(x0 * 5.3 - t * 7.9 + y0 * 2.1 + m.ph) * .05) * k; a[i + 1] = y0 - k * k * .1 * (1 + Math.sin(t * 1.1 + m.ph) * .35); } pa.needsUpdate = true; if ((++m.n & 3) === 0) m.geo.computeVertexNormals(); }
    else if (m.t === 'ftn') { const o = o3; for (let i = 0; i < m.n; i++) { let x, y, z, s;
        if (i < 18) { const u = (t * .62 + i / 18) % 1, a = i * 2.4; x = Math.cos(a) * .08; z = Math.sin(a) * .08; y = 1.35 + 2.5 * 4 * u * (1 - u) + (u > .5 ? -(u - .5) * .4 : 0); s = .16 * (1 - u * .4); }
        else { const j = i - 18, nn = m.n - 18, u = (t * .5 + (j % 6) / 6) % 1, a = Math.floor(j / 6) / (nn / 6) * Math.PI * 2 + .2; const r = .9 + 2.3 * u; x = Math.cos(a) * r; z = Math.sin(a) * r; y = 1.4 + 1.5 * 4 * u * (1 - u) - .95 * u; s = .12 * (1 - u * .5); }
        o.position.set(m.cx + x, y, m.cz + z); o.rotation.set(0, 0, 0); o.scale.set(s, s, s); o.updateMatrix(); m.im.setMatrixAt(i, o.matrix); }
      m.im.instanceMatrix.needsUpdate = true;
      m.rings.forEach((r, i) => { const u = (t * .45 + i / 3) % 1; const sc = 1.1 + u * 2.7; r.scale.set(sc, sc, 1); r.material.opacity = .45 * (1 - u); }); }
    else if (m.t === 'cloud') { m.o.position.x += m.sp * dt; if (m.o.position.x > 420) m.o.position.x = -420; }
    else if (m.t === 'birds') { const cyc = 46, u = ((t + 7) % cyc) / cyc; m.o.visible = u < .62; const p = u / .62; m.o.position.set(-320 + p * 640, 34 + Math.sin(p * 6) * 3, m.z + Math.sin(p * 3.1) * 40); m.o.rotation.y = -Math.cos(p * 3.1) * .25;
      m.birds.forEach(b => { const f = Math.sin(t * 9 + b.ph) * .55; b.wl.rotation.x = f; b.wr.rotation.x = -f; }); }
    else if (m.t === 'gate') { const cyc = 30, c = ((t + m.ph) % cyc), car = m.car, ez = x => x * x * (3 - 2 * x);
      let open = 0; if (c > 5.4 && c < 7) open = ez((c - 5.4) / 1.6); else if (c >= 7 && c < 11) open = 1; else if (c >= 11 && c < 12.6) open = 1 - ez((c - 11) / 1.6);
      m.arm.rotation.z = -open * 1.45;
      if (c < 5.5) { car.visible = true; const u = ez(Math.min(1, c / 5.2)); car.position.lerpVectors(m.A, m.B, u); car.rotation.y = -Math.PI / 2; }
      else if (c < 8) { car.visible = true; car.position.copy(m.B); car.rotation.y = -Math.PI / 2; }
      else if (c < 19) { car.visible = true; const u = Math.pow((c - 8) / 11, 1.6), p = m.C.getPointAt(Math.min(1, u)), tg = m.C.getTangentAt(Math.min(1, u)); car.position.copy(p); car.rotation.y = Math.atan2(-tg.z, tg.x); }
      else car.visible = false; }
  }

  /* ---------------- magazzino ---------------- */
  function itemGroup(it) { const g = new T.Group(); g.position.set(it.x, 0, it.z); g.rotation.y = it.r * Math.PI / 2; g.userData.eid = it.id; WH.add(g); return g; }
  function hit(g, w, h, d, y, k, it) { const m = new T.Mesh(G.box, M.hit); m.scale.set(w, h, d); m.position.y = y; m.userData.k = k; m.userData.eid = it.id; g.add(m); pick.push(m); return m; }
  function buildWH() {
    if (WH) { scene.remove(WH); WH.traverse(o => { if (o.isInstancedMesh) o.dispose(); }); }
    WH = new T.Group(); scene.add(WH); RX = []; FOC = null; RCV = null; RF = null; RH = null; HOV = null; SCAN = null; BACK.length = 0; FADE.length = 0; if (root) { callout(false); const tp = $('.m3-tip'); tp && tp.classList.remove('on'); }
    const W = L.W, Dd = L.D, hw = W / 2, hd = Dd / 2;
    buildOffice();
    // pavimento in cemento
    bxS(WH, W, .48, Dd, 0xe2ded7, 0, 0, 0);
    const ct = TX.concrete.clone(); ct.needsUpdate = true; ct.wrapS = ct.wrapT = T.RepeatWrapping; ct.repeat.set(W / 6, Dd / 6); OWN.push(ct);
    const fm = new T.MeshLambertMaterial({ map: ct }); OWN.push(fm); const fl = new T.Mesh(G.plane, fm); fl.scale.set(W, Dd, 1); fl.rotation.x = -Math.PI / 2; fl.position.y = .505; fl.receiveShadow = true; WH.add(fl);
    // muri perimetrali a pannelli, con il bordo arancione
    const wallSeg = (x, z, len, rot, h) => { const g = new T.Group(); g.position.set(x, .5, z); g.rotation.y = rot; WH.add(g); meshS(G.box, panelMat(len), 0, h / 2, 0, g, { s: [len, h, .3] }); bxS(g, len + .04, .2, .36, 0xf47b20, 0, h, 0, { ns: 1 }); bxS(g, len, .12, .34, 0xd8d6d1, 0, 0, 0, { ns: 1 }); };
    wallSeg(0, -hd, W, 0, 3.4); wallSeg(-hw, 0, Dd, Math.PI / 2, 3.4); wallSeg(hw, 0, Dd, Math.PI / 2, 3.4);
    wallSeg(-hw * .55, hd, W * .45, 0, 1.4); wallSeg(hw * .5, hd, W * .5, 0, 1.4);
    // estintori e uscite di sicurezza
    for (let i = 0; i < 4; i++) { const z = -hd + 6 + i * (Dd - 12) / 3; bxS(WH, .25, .55, .25, 0xd62b1f, -hw + .35, .9, z); bxS(WH, .05, .4, .5, 0x1f9a4b, -hw + .2, 2.9, z + 1.2, { ns: 1 }); }
    pick = pickEnv.slice(); movers = envMovers.slice();
    trucks = [];
    P = place();
    L.items.filter(i => i.t === 'zone').forEach(buildZone);
    L.items.filter(i => i.t !== 'zone').forEach(it => ({ rack: buildRack, dock: buildDock, wall: buildWall, belt: buildBelt, desk: buildDesk })[it.t](it));
    buildRoadTrucks(); buildPeople(); buildFleet(); buildGls(); prepBuild();
    if (EDIT) { const v = []; for (let x = -hw; x <= hw + .01; x += 1) v.push(x, .53, -hd, x, .53, hd); for (let z = -hd; z <= hd + .01; z += 1) v.push(-hw, .53, z, hw, .53, z); const gg = new T.BufferGeometry(); gg.setAttribute('position', new T.Float32BufferAttribute(v, 3)); const gm = new T.LineBasicMaterial({ color: 0xcdbfb0, transparent: true, opacity: .45 }); WH.add(new T.LineSegments(gg, gm)); OWN.push(gg, gm); }
    hiMesh = new T.Mesh(G.box, new T.MeshBasicMaterial({ color: 0xf47b20, transparent: true, opacity: .35, depthWrite: false, depthTest: false })); hiMesh.renderOrder = 10; hiMesh.visible = false; WH.add(hiMesh); OWN.push(hiMesh.material);
    const eg = new T.LineSegments(new T.EdgesGeometry(G.box), new T.LineBasicMaterial({ color: 0xf47b20, depthTest: false })); eg.renderOrder = 11; hiMesh.add(eg); OWN.push(eg.geometry, eg.material);
    selHelper = null; mergeStatic(WH);
  }
  let hiMesh = null, selHelper = null, trucks = [];

  function buildZone(it) {
    const g = itemGroup(it), z = ZONE[it.k], w = it.r % 2 ? it.d : it.w, d = it.r % 2 ? it.w : it.d;
    g.rotation.y = 0; // le zone sono rettangoli allineati
    bxS(g, w - .1, .03, d - .1, z[1], 0, .51, 0, { ns: 1 });
    const edge = it.k === 'cq' ? 0x63b37a : it.k === 'uff' ? 0x7d98b8 : 0xf3a868;
    bxS(g, w, .035, .14, edge, 0, .52, -d / 2 + .07, { ns: 1 }); bxS(g, w, .035, .14, edge, 0, .52, d / 2 - .07, { ns: 1 }); bxS(g, .14, .035, d, edge, -w / 2 + .07, .52, 0, { ns: 1 }); bxS(g, .14, .035, d, edge, w / 2 - .07, .52, 0, { ns: 1 });
    const name = (it.name || z[0]).toUpperCase().slice(0, 22), fw = Math.min(w * .8, name.length * 1.35);
    if (it.k !== 'ric') floorText(g, name, Math.max(4, fw), 0, d / 2 - fw / 11 - 1, d > w * 1.6 ? Math.PI / 2 : 0, it.k === 'cq' ? 'rgba(60,150,80,.45)' : 'rgba(244,123,32,.48)');
    if (it.k !== 'ric' && d > w * 1.6) { const m = g.children[g.children.length - 1]; m.position.set(w / 2 - 1.6, .56, 0); }
    hit(g, w, .6, d, .5, { t: 'zone', z: it.k, id: it.id }, it);
    if (it.k === 'ric') buildRic(g, it, w, d);
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
    for (const e of [-1, 1]) bxS(g, .04, .5, .04, 0x2b2f35, e * (len / 2 + .18), y0 + H, 0, { ns: 1 });
    hit(g, len, H, dep + .6, y0 + H / 2, { t: 'rack', id: it.id }, it);
  }

  function buildDock(it) {
    const g = itemGroup(it), B = new Batch(g);
    bxS(g, 4.4, 3.5, .18, 0x2b2f35, 0, .5, .1);
    meshS(G.box, M.door, 0, .5 + 1.55, .22, g, { s: [3.5, 3.1, .04] });
    for (const s of [-1, 1]) bxS(g, .25, 3.3, .5, 0x1b1d20, s * 1.95, .5, .45);
    bxS(g, 4.15, .3, .5, 0x1b1d20, 0, 3.55, .45);
    bxS(g, 2.3, .08, 2.6, 0x9ba1a8, 0, .45, -1.3, { ns: 1 });
    for (const s of [-1, 1]) bxS(g, .35, .35, .3, 0x16181b, s * 1.25, .55, .35);
    bxS(g, .3, .55, .2, 0x2b2f35, 2.55, 2.4, .25); B.add('lt', G.sph, new T.MeshBasicMaterial({ color: 0xe8432a }), m4(2.55, 2.85, .37, .14, .14, .06)); B.add('lt2', G.sph, new T.MeshBasicMaterial({ color: 0x2cbf5d }), m4(2.55, 2.6, .37, .14, .14, .06));
    for (const s of [-1, 1]) B.add('yl', G.box, mat(0xf2c418), m4(s * 1.9, .175, 9, .14, .02, 16));
    B.add('bol', G.cyl, mat(0xf2c418), m4(-2.6, .2 + .55, 1.4, .22, 1.1, .22)); B.add('bol', G.cyl, mat(0xf2c418), m4(2.6, .2 + .55, 1.4, .22, 1.1, .22));
    B.flush();
    hit(g, 4.6, 3.6, 1.2, 2.2, { t: 'dock', id: it.id }, it);
  }
  function buildWall(it) {
    const g = itemGroup(it), h = it.h || 2;
    meshS(G.box, panelMat(it.len), 0, .5 + h / 2, 0, g, { s: [it.len, h, .25] });
    bxS(g, it.len + .02, .16, .3, 0xf47b20, 0, .5 + h, 0, { ns: 1 });
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
    if (cq) { for (let x = -len / 2 + 1; x < len / 2 - 1; x += .5) { wp.set(x, 0, 0); g.updateMatrixWorld(); g.localToWorld(wp); const b2 = box2(cq); if (wp.x > b2.x0 + 2 && wp.x < b2.x1 - 2 && wp.z > b2.z0 && wp.z < b2.z1) { bxS(g, .3, 2.4, .3, 0xfafafa, x, .5, -1); bxS(g, .3, 2.4, .3, 0xfafafa, x, .5, 1); bxS(g, 1.1, .7, 2.4, 0x2cbf5d, x, 2.9, 0); break; } } }
    // braccio pallettizzatore in fondo
    const arm = new T.Group(); arm.position.set(len / 2 + 1.3, .5, 0); g.add(arm); meshS(G.cyl, mat(0xe0e2e5), 0, .4, 0, arm, { s: [1.7, .8, 1.7] });
    const a1 = new T.Group(); a1.position.y = .8; arm.add(a1); meshS(G.box, mat(0xf47b20), 0, 1.4, 0, a1, { s: [.5, 2.8, .5], rz: .35 }); meshS(G.box, mat(0xf47b20), -1.3, 2.7, 0, a1, { s: [2.2, .42, .42] });
    movers.push({ o: a1, t: 'spin', sp: .6 });
    hit(g, len + 3, 1.6, 2, 1, { t: 'belt', id: it.id }, it);
  }
  function buildDesk(it) {
    const g = itemGroup(it);
    bxS(g, 3.2, .06, 1.4, 0xfafafa, 0, 1.4, 0); for (const sx of [-1.5, 1.5]) for (const sz of [-.6, .6]) bxS(g, .06, .9, .06, 0x8e959e, sx, .5, sz);
    bxS(g, 3.1, .04, 1.3, 0xd8dbe0, 0, .75, 0, { ns: 1 });
    bxS(g, .6, .38, .04, 0x1d2025, -.9, 1.7, -.45); bxS(g, .06, .25, .06, 0x2b2f35, -.9, 1.46, -.45);
    bxS(g, .35, .25, .3, 0xeeeeec, .9, 1.46, -.35); bxS(g, .45, .3, .4, 0xe3b073, .25, 1.46, .1); bxS(g, .4, .26, .36, 0xa9c98a, .3, 1.76, .1);
    meshS(G.cyl, mat(0xf47b20), -.2, 1.5, .3, g, { s: [.16, .08, .16] });
    const p = person(g, 0, 1.0, 0x39a85a, null, { mode: 'work' }); p.rotation.y = Math.PI; movers.push({ o: p, t: 'bob', ph: it.x });
    hit(g, 3.4, 2, 2.6, 1, { t: 'desk', id: it.id }, it);
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
    [[-8, 1.05], [-6.9, 1.05], [-5.8, 1.05], [5.9, 1.05], [3.9, 1.05]].forEach(([wx, wz]) => { for (const s of [-1, 1]) { meshS(G.cyl, mat(0x1d1f22), wx, .58, s * wz, g, { s: [1.1, .38, 1.1], rx: Math.PI / 2 }); meshS(G.cyl, mat(0xc5cad1), wx, .58, s * (wz + .2), g, { s: [.5, .02, .5], rx: Math.PI / 2, ns: 1 }); } });
    const t = { g, d, road: 0 }; g.traverse(o => { if (o.isMesh) { o.userData.k = { t: 'truck', i: trucks.length }; pick.push(o); } }); p.add(g); trucks.push(t); return t;
  }
  function buildRoadTrucks() {
    const docks = L.items.filter(i => i.t === 'dock'), recent = D.ddt.slice(0, 9);
    docks.slice(0, Math.min(docks.length, 4)).forEach((dk, i) => { const g = WH.children.find(c => c.userData.eid === dk.id); if (!g) return; const t = truck(g, recent[i] || null, 0, 9.35, -Math.PI / 2); t.dock = dk.id; });
    const rz = L.D / 2 + 31;
    recent.slice(4, 7).forEach((d, i) => { const t = truck(WH, d, -120 + i * 95, rz - 2.5, 0); t.road = 1; movers.push({ o: t.g, t: 'road', sp: 7.5, dir: 1 }); });
    D.trf.slice(0, 2).forEach((x, i) => { const t = truck(WH, { trf: x }, 80 - i * 110, rz + 2.5, Math.PI); t.road = 1; movers.push({ o: t.g, t: 'road', sp: 6.5, dir: -1 }); });
  }
  function buildPeople() {
    const wp = new T.Vector3();
    // carrelli elevatori lungo i corridoi degli scaffali portapallet
    L.items.filter(i => i.t === 'rack' && i.k === 'pallet').slice(0, 4).forEach((it, k) => {
      if (k % 2) return; const g = WH.children.find(c => c.userData.eid === it.id); if (!g) return; g.updateMatrixWorld();
      const len = rackLen(it), dep = rackDep(it), a = g.localToWorld(new T.Vector3(-len / 2 + 1, 0, dep / 2 + 1.6)), b = g.localToWorld(new T.Vector3(len / 2 - 1, 0, dep / 2 + 1.6));
      const steps = rackForkSteps(it, g), f = forklift(WH, steps[0].x, steps[0].z); f.rotation.y = Math.atan2(b.x - a.x, b.z - a.z); movers.push({ o: f, t: 'fork', steps, i: 0, st: null });
    });
    // operatori che camminano nelle zone
    L.items.filter(i => i.t === 'zone' && ['pre', 'spe', 'cq'].includes(i.k)).forEach((z, k) => {
      const b2 = box2(z), n = z.k === 'ric' || z.k === 'spe' ? 2 : 1;
      for (let j = 0; j < n; j++) { const a = new T.Vector3(b2.x0 + 1.5 + rr() * (b2.x1 - b2.x0 - 3), 0, b2.z0 + 1.5 + rr() * (b2.z1 - b2.z0 - 3)), b = new T.Vector3(b2.x0 + 1.5 + rr() * (b2.x1 - b2.x0 - 3), 0, b2.z0 + 1.5 + rr() * (b2.z1 - b2.z0 - 3)); const p = person(WH, a.x, a.z, (k + j) % 2 ? 0xf47b20 : 0x39a85a); movers.push({ o: p, t: 'walk', a, b, sp: .05 + rr() * .04, ph: rr() * 6 }); }
      if (z.k === 'ric') { const c2 = new T.Vector3((b2.x0 + b2.x1) / 2, 0, (b2.z0 + b2.z1) / 2), f = forklift(WH, c2.x, c2.z); movers.push({ o: f, t: 'loop', cx: c2.x, cz: c2.z, rx: (b2.x1 - b2.x0) * .3, rz: (b2.z1 - b2.z0) * .3, sp: .25, ph: 0 }); }
    });
  }

  /* ---------------- etichette arancioni ---------------- */
  function zoneTarget(k) {
    if (k === 'all') return { x: 4, z: 8, dist: Math.max(L.W, L.D) * 3.05, az: -0.3, pol: .9 };
    if (k === 'uffe') return { x: L.W / 4, z: L.D / 2 + 9, dist: 84, az: -0.3, pol: .9 };
    if (k === 'flotta') { if (!D.gas) return null; const F = FL(); return { x: F.cx, z: 2, dist: 118, az: -1.05, pol: .88 }; }
    if (k === 'stk') { const R2 = L.items.filter(i => i.t === 'rack'); if (!R2.length) return null; const bb = R2.map(box2).reduce((a, b) => ({ x0: Math.min(a.x0, b.x0), x1: Math.max(a.x1, b.x1), z0: Math.min(a.z0, b.z0), z1: Math.max(a.z1, b.z1) })); return { x: (bb.x0 + bb.x1) / 2, z: (bb.z0 + bb.z1) / 2 + 2, dist: Math.max(bb.x1 - bb.x0, bb.z1 - bb.z0) * 1.9 + 20, az: -0.5, pol: .88 }; }
    const z = L.items.find(i => i.t === 'zone' && i.k === k); if (!z) return null; const f = foot(z);
    if (k === 'ric') return { x: z.x + 3, z: z.z, dist: Math.max(f.w, f.d) * 1.42 + 18, az: -0.5, pol: .88 };
    return { x: z.x + (k === 'spe' ? 10 : 0), z: z.z, dist: Math.max(f.w, f.d) * 1.6 + 26, az: k === 'spe' ? .6 : -0.6, pol: .92 };
  }
  const zoneKinds = () => ['all', ...['ric', 'stk', 'pre', 'cq', 'spe', 'flotta'].filter(k => zoneTarget(k)), 'uffe'];
  const ZN = k => k === 'all' ? ['Panoramica', 'ALL'] : k === 'uffe' ? ['Uffici', 'UFF'] : k === 'flotta' ? ['Parco mezzi e gasolio', 'MEZ'] : [ZONE[k][0], ZONE[k][2]];
  function buildLabels() {
    const box = $('.m3-lbs'); box.innerHTML = ''; labels = [];
    const add = (pos, html2, cls, k, maxD, obj) => { const el = document.createElement('div'); el.className = 'm3-lb ' + (cls || ''); el.innerHTML = html2; box.appendChild(el); const L2 = { p: new T.Vector3(...pos), el, k, maxD: maxD || 1e9, obj }; el.onclick = () => { if (!EDIT) select(k); }; labels.push(L2); return L2; };
    const R2 = L.items.filter(i => i.t === 'rack'), nv = R2.reduce((s, r) => s + r.bays * r.lv, 0), used = P.byArt.size;
    const st = zoneTarget('stk'); if (st) add([st.x, 9, st.z - 2], `Scaffalature <em>${R2.length} scaffali · ${N(used)}/${N(nv)} ubicazioni</em>`, '', { t: 'zone', z: 'stk' }, 1e9);
    const sub = { ric: `${D.rcv.length} arrivi in 30 gg`, pre: `${D.ddtM.length} DDT nel mese`, cq: `${D.ret90.length} rettifiche`, spe: `${trucks.filter(t => !t.road && t.d).length} in banchina`, terra: 'stoccaggio a terra', uff: 'ufficio', free: '' };
    L.items.filter(i => i.t === 'zone').forEach(z => add([z.x, 4.5, z.z], `${esc(z.name || ZONE[z.k][0])}${sub[z.k] ? ` <em>${sub[z.k]}</em>` : ''}`, '', { t: 'zone', z: z.k, id: z.id }, 340));
    add([L.W / 4, 10.4, L.D / 2 + 13], `Uffici <em>${OFF ? OFF.OD.CL.length : D.cli.length} clienti · ${OFF ? OFF.OD.FR.length : 0} fornitori</em>`, 'wh', { t: 'zone', z: 'uffe' }, 260).offClosed = true;
    if (GLS3) add([GLS3.wp.x, 4.4, GLS3.wp.z], `Corriere GLS <em>${GLS3.X.n ? GLS3.X.n + ' sped. · ' + gEu(GLS3.X.T) : 'nessuna spedizione'}</em>`, '', { t: 'gls' }, 220);
    if (OFF && OFF.acL) OFF.acL.forEach(A => { const L3 = add([0, 0, 0], `${A.t} <em>${A.s}</em>`, 'sm', A.k, 140, A.a); L3.dy = 0; L3.offOnly = true; });
    if (OFF) OFF.anc.forEach(A => { const L3 = add([0, 0, 0], `${A.t} <em>${A.s}</em>`, 'sm', { t: 'zone', z: 'uffe' }, 140, A.a); L3.dy = 0; L3.offOnly = true; });
    if (D.gas) { const F = FL(); add([F.cx, 3, (F.z0 + F.st.z) / 2 - 4], `Parco mezzi <em>${D.gas.V.length} mezzi · ${N(Math.round(D.gas.lM))} L nel mese</em>`, '', { t: 'zone', z: 'flotta' }, 340); add([F.st.x, 7.4, F.st.z], `Distributore <em>${D.gas.price ? D.gas.price.toFixed(3).replace('.', ',') + ' €/L' : 'gasolio'}</em>`, '', { t: 'fuel' }, 260);
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
      const quiet = (sel && sel.t === 'rack' && L2.k.t === 'rack' && !act) || (EDIT && L2.k.t !== 'rack') || (L2.offOnly && !(OFF && OFF.u > .6)) || (L2.offClosed && OFF && OFF.u > .3);
      const px = (v.x + 1) / 2 * w, py = (1 - v.y) / 2 * h; L2.sx = px; L2.sy = py; L2.act = act; L2.vis = (on || act) && !quiet; L2.dd = d;
      L2.el.style.transform = `translate(${px.toFixed(1)}px,${py.toFixed(1)}px) translate(-50%,-100%)`;
      L2.el.style.zIndex = act ? 3 : (L2.el.classList.contains('sm') ? 1 : 2);
    });
    // precedenza: selezionata, poi zone grandi, poi le più vicine; si nasconde chi si sovrappone o esce dallo schermo
    if (!updLabels.n || ++updLabels.n > 8) { updLabels.n = 1; const rt = root.getBoundingClientRect(); updLabels.ob = ['.m3.pn .m3-panel', '.m3-tools', '.m3-flow', '.m3-kpis', '.m3-co.on', '.m3-tab'].map(q => { const e = root.matches(q.split(' ')[0]) && q.includes(' ') ? $(q.split(' ').slice(1).join(' ')) : (q.startsWith('.m3.') ? null : $(q)); if (!e || !e.offsetParent || getComputedStyle(e).opacity === '0') return null; const r = e.getBoundingClientRect(); return r.width ? { x0: r.left - rt.left, x1: r.right - rt.left, y0: r.top - rt.top, y1: r.bottom - rt.top } : null; }).filter(Boolean); }
    const placed = (updLabels.ob || []).slice(), ord = labels.filter(l => l.vis).sort((a, b) => (b.act - a.act) || (a.el.classList.contains('sm') - b.el.classList.contains('sm')) || a.dd - b.dd);
    labels.forEach(l => { if (!l.vis) l.el.classList.add('hid'); });
    ord.forEach(l => { const lw = l.el.offsetWidth || 120, lh = l.el.offsetHeight || 26, r = { x0: l.sx - lw / 2 - 3, x1: l.sx + lw / 2 + 3, y0: l.sy - lh - 9, y1: l.sy + 2 };
      const out = r.x0 < 2 || r.x1 > w - 2 || r.y0 < 0 || r.y1 > h, hit = placed.some(q => r.x0 < q.x1 && r.x1 > q.x0 && r.y0 < q.y1 && r.y1 > q.y0);
      const hide = !l.act && (out || hit); l.el.classList.toggle('hid', hide); if (!hide) placed.push(r); });
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
    if (VEL.on) { const dec = Math.exp(-dt * 3.6); for (const o of [GOAL, CAM]) { o.tx += VEL.x * dt; o.tz += VEL.z * dt; o.az += VEL.a * dt; } VEL.x *= dec; VEL.z *= dec; VEL.a *= dec; clampT(); if (Math.hypot(VEL.x, VEL.z) < CAM.dist * .004 && Math.abs(VEL.a) < .01) VEL.on = 0; }
    const k = 1 - Math.exp(-dt * 8), kz = 1 - Math.exp(-dt * 10);
    let da = GOAL.az - CAM.az; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    CAM.az += da * k; CAM.tx += (GOAL.tx - CAM.tx) * kz; CAM.ty += ((GOAL.ty || 0) - CAM.ty) * k; CAM.tz += (GOAL.tz - CAM.tz) * kz; CAM.pol += (GOAL.pol - CAM.pol) * k;
    CAM.dist = Math.exp(Math.log(CAM.dist) + (Math.log(GOAL.dist) - Math.log(CAM.dist)) * kz);
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
        lM: sum(mm), cM: mm.reduce((a, r) => a + C.num(r.litri) * pr(r), 0) * mul, nM: mm.length, kmM: (() => { let t = 0, pv = 0; s.forEach(r => { const k = C.num(r.km); if (!k) return; if (pv && k > pv && k - pv < 5000 && String(r.data).slice(0, 7) === m0) t += k - pv; pv = k; }); return t; })(), lT: sum(s), cT: s.reduce((a, r) => a + C.num(r.litri) * pr(r), 0) * mul, m6: keys.map(k => sum(s.filter(r => String(r.data).slice(0, 7) === k))), kind: kindOf(name + ' ' + uso + ' ' + owner) };
    }).sort((a, b) => (b.reg - a.reg) || b.lT - a.lT).slice(0, 20);
    const rM = rows.filter(r => String(r.data).slice(0, 7) === m0), lM = rM.reduce((a, r) => a + C.num(r.litri), 0);
    let km = 0, kl = 0; V.forEach(v => { if (v.cons) { km += v.km; kl += v.km / v.cons; } });
    const lastR = rows.slice().sort((a, b) => String(b.data).localeCompare(String(a.data)) || C.num(b.km) - C.num(a.km));
    const k12 = []; { const d = new Date(m0 + '-15'); for (let i = 11; i >= 0; i--) { const x = new Date(d); x.setMonth(x.getMonth() - i); k12.push(x.toISOString().slice(0, 7)); } }
    const inM = k => r => String(r.data).slice(0, 7) === k, lit = L2 => L2.reduce((a, r) => a + C.num(r.litri), 0), eur = L2 => L2.reduce((a, r) => a + C.num(r.litri) * pr(r), 0) * mul;
    const rP = rows.filter(inM(k12[10])), l12 = k12.map(k => lit(rows.filter(inM(k)))), c12 = k12.map(k => eur(rows.filter(inM(k))));
    const drv = new Map(); rM.forEach(r => { const n = String(r.operatore || '').trim(); if (!n || n === '?') return; const o = drv.get(n) || { n, l: 0, k: 0 }; o.l += C.num(r.litri); o.k++; drv.set(n, o); });
    const nd = new Date(+m0.slice(0, 4), +m0.slice(5), 0).getDate(), days = Array.from({ length: nd }, (_, i) => lit(rM.filter(r => +String(r.data).slice(8, 10) === i + 1)));
    const cons = kl ? km / kl : 0, d90 = (() => { const d = new Date(C.today() + 'T12:00:00'); d.setDate(d.getDate() - 90); return d.toISOString().slice(0, 10); })(), AN = [];
    V.forEach(v => { v.l100 = v.cons ? 100 / v.cons : 0; v.eurKm = v.cons && price ? price * mul / v.cons : 0; v.l12 = k12.map(k => lit(v.s.filter(inM(k))));
      const L3 = v.s.map(r => C.num(r.litri)).filter(Boolean).sort((a, b) => a - b), med = L3.length >= 4 ? L3[Math.floor(L3.length / 2)] : 0; let prev = null;
      v.s.forEach(r => { const l = C.num(r.litri), k = C.num(r.km), pk = prev ? C.num(prev.km) : 0, rec = String(r.data) >= d90;
        if (rec) { if (!k && v.odo) AN.push({ r, v, m: 'km non inseriti' }); else if (pk && k && k < pk) AN.push({ r, v, m: `km inferiori al pieno precedente (${N(pk)})` });
          else if (pk && k && v.cons && l && k - pk < 5000) { const c2 = (k - pk) / l; if (c2 < v.cons * .6 || c2 > v.cons * 1.6) AN.push({ r, v, m: `consumo ${dec1(100 / c2)} L/100 km (di solito ${dec1(100 / v.cons)})` }); }
          if (med && l > med * 1.7 && l > 20) AN.push({ r, v, m: `${N(l)} L, molto sopra il solito (${N(Math.round(med))} L)` }); }
        if (k) prev = r; }); });
    AN.sort((a, b) => String(b.r.data).localeCompare(String(a.r.data))); V.forEach(v => { v.an = AN.filter(a => a.v === v).length; });
    return { V, price, mul, lM, cM: eur(rM), nM: rM.length, lP: lit(rP), cP: eur(rP), cons, eurKm: cons && price ? price * mul / cons : 0, kmM: V.reduce((a, v) => a + v.kmM, 0), rent: V.reduce((a, v) => a + v.rent, 0), lastR, keys, k12, l12, c12, drv, days, AN, nAll: rows.length };
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
    const wheel = (xx, zz, r) => { const s = Math.sign(zz); meshS(G.cyl, mat(0x15171a), xx, r, zz, g, { s: [r * 2, .27, r * 2], rx: Math.PI / 2 }); meshS(G.cyl, mat(0xbfc4cb), xx, r, zz + s * .14, g, { s: [r * 1.2, .02, r * 1.2], rx: Math.PI / 2, ns: 1 }); meshS(G.cyl, mat(0x7d838b), xx, r, zz + s * .155, g, { s: [r * .42, .02, r * .42], rx: Math.PI / 2, ns: 1 }); };
    const shell = (kind, color, P, ox) => {
      const w = P.w, bev = kind === 'cab' ? .07 : .09, xs = P.body.map(q => q[0]), fx = Math.max(...xs) + bev + .015, rx2 = Math.min(...xs) - bev - .015; P.fx = fx; P.rx = rx2; const body = mesh(vgeo('vb_' + kind, P.body, w - 2 * bev, bev), mat(color), ox || 0, 0, 0, g);
      meshS(vgeo('vg_' + kind, P.side, w + .06, 0), glass, ox || 0, 0, 0, g, { ns: 1 });
      const wsl = (a, c) => { const dx = c[0] - a[0], dy = c[1] - a[1], ln = Math.hypot(dx, dy), nx = dy / ln, ny = -dx / ln, sgn = kind === 'cab' ? 1 : 1; const m = mesh(G.box, glass, (ox || 0) + (a[0] + c[0]) / 2 + nx * .115 * sgn, (a[1] + c[1]) / 2 + ny * .115 * sgn, 0, g, { s: [ln, .035, w - .16], rz: Math.atan2(dy, dx), ns: 1 }); return m; };
      wsl(P.ws[0], P.ws[1]); if (P.rw) wsl(P.rw[1], P.rw[0]);
      P.wh.forEach(([wx, r]) => { for (const s of [-1, 1]) meshS(G.cyl, mat(0x111316), (ox || 0) + wx, r + .02, s * (w / 2 + .008), g, { s: [r * 2 + .2, .01, r * 2 + .2], rx: Math.PI / 2, ns: 1 }); wheel((ox || 0) + wx, w / 2 - .12, r); wheel((ox || 0) + wx, -w / 2 + .12, r); });
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
      [[3.0, .5], [-2.3, .5], [-3.35, .5]].forEach(([wx, r]) => { for (const s of [-1, 1]) { meshS(G.cyl, mat(0x111316), wx, r + .03, s * 1.13, g, { s: [r * 2 + .22, .02, r * 2 + .22], rx: Math.PI / 2, ns: 1 }); wheel(wx, s * 1.05, r); } });
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
    bxS(g, 9, .15, L.D / 2 + 31 - 5.7 - F.z1 - .05, 0x575c64, F.st.x, 0, (F.z1 + .05 + L.D / 2 + 31 - 5.7) / 2, { ns: 1 });
    for (const xx of [F.x0, F.x1]) bxS(g, .3, .22, d, 0xd9d6cf, xx, 0, cz, { ns: 1 });
    // stalli: due file di posti con strisce bianche e numeri
    const rowX = [F.x0 + 4.4, F.x1 - 4.4], sz = 3.9, z0 = F.z0 + 2.4, n = Math.max(1, Math.floor((F.st.z - 8 - z0) / sz)), slots = [];
    rowX.forEach((rx, ri) => { for (let i = 0; i <= n; i++) B.add('str', G.box, mat(0xf4f4f2), m4(rx, .17, z0 + i * sz - sz / 2, 7.6, .02, .12)); for (let i = 0; i < n; i++) { slots.push({ x: rx, z: z0 + i * sz, ry: ri ? 0 : Math.PI }); B.add('stop', G.box, mat(0xf2c418), m4(rx + (ri ? 3.3 : -3.3), .24, z0 + i * sz, .25, .14, 1.6)); } });
    slots.forEach((s, i) => floorText(g, String(i + 1).padStart(2, '0'), 1.6, s.x + (s.ry ? 2.2 : -2.2), s.z, Math.PI / 2, 'rgba(255,255,255,.75)').position.y = .18);
    // linea di mezzeria della corsia
    for (let zz = z0; zz < F.st.z - 9; zz += 3) B.add('lm', G.box, mat(0xf4f4f2), m4(cx, .17, zz, .14, .02, 1.6));
    // ---- area di rifornimento (v284): piazzale in cemento con giunti e canaline, pensilina, due isole con erogatori, terminale badge, arresto d'emergenza
    const st = F.st, cw = 15, cd = 13, IX = 2.9, cy0 = 5.4; CANO = { mats: [], u: CANO ? CANO.u : 1, want: CANO ? CANO.want : 1 };
    bxS(g, cw + 3.4, .05, cd + 4.4, 0xc9c7c2, st.x, .16, st.z, { ns: 1 });
    for (let i = -3; i <= 3; i++) B.add('jt', G.box, mat(0xb3b0aa), m4(st.x + i * 2.6, .214, st.z, .04, .008, cd + 3.0));
    for (let j = -3; j <= 3; j++) B.add('jt', G.box, mat(0xb3b0aa), m4(st.x, .216, st.z + j * 2.6, cw + 2.1, .008, .04));
    for (const s of [-1, 1]) { B.add('drn', G.box, mat(0x3a3f46), m4(st.x, .228, st.z + s * (cd / 2 + 1.75), cw + 2.2, .012, .32)); B.add('drn', G.box, mat(0x3a3f46), m4(st.x + s * (cw / 2 + 1.25), .228, st.z, .32, .012, cd + 3.2)); }
    for (const [dx, dz] of [[-5.5, -cd / 2 - .9], [5.5, cd / 2 + .9]]) { B.add('mh', G.cyl, mat(0x4a4f57), m4(st.x + dx, .236, st.z + dz, .9, .012, .9)); B.add('mhr', G.cyl, mat(0x6b7078), m4(st.x + dx, .248, st.z + dz, .7, .012, .7)); }
    // corsia: frecce, linea di arresto, scritta STOP
    for (const zz of [st.z + cd / 2 + .9, st.z - cd / 2 - .9]) { const ar = planeT(arrowTex(), 1.5, 1.5, g, st.x, .242, zz, {}); ar.rotation.x = -Math.PI / 2; ar.rotation.z = 0; }
    B.add('stopl', G.box, mat(0xf4f4f2), m4(st.x, .232, st.z - 3.6, 4, .012, .22));
    { const t2 = textTex([['STOP', 90, 800, 70, null, 'rgba(255,255,255,.92)']], { w: 320, h: 120 }); const p2 = planeT(t2, 2.2, .82, g, st.x, .242, st.z - 4.4, {}); p2.rotation.x = -Math.PI / 2; p2.rotation.z = Math.PI; }
    // pensilina: colonne rivestite con piede arancione, copertura, fascia, luci a led, telecamere
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const px = st.x + sx * IX, pz = st.z + sz * 2.3; bxS(g, .46, cy0 - .44, .46, 0xeef0f2, px, .44, pz); bxS(g, .52, .9, .52, 0xf47b20, px, .44, pz); B.add('ccl', G.box, mat(0xd9dce0), m4(px, cy0 - .2, pz, .62, .3, .62)); }
    const cM = c => { const m = new T.MeshLambertMaterial({ color: c, transparent: true }); m.userData.o0 = 1; OWN.push(m); CANO.mats.push(m); return m; }, cDeck = cM(0xfbfbfa), cOr = cM(0xf47b20), cCap = cM(0xffffff);
    bxS(g, cw, .8, cd, cDeck, st.x, cy0, st.z);
    for (const s of [-1, 1]) { bxS(g, cw + .14, .52, .1, cOr, st.x, cy0 + .14, st.z + s * (cd / 2 + .05)); bxS(g, .1, .52, cd + .14, cOr, st.x + s * (cw / 2 + .05), cy0 + .14, st.z); }
    bxS(g, cw + .2, .1, cd + .2, cCap, st.x, cy0 + .8, st.z);
    for (let i = -2; i <= 2; i++) for (const j of [-1, 0, 1]) { const m2 = new T.MeshBasicMaterial({ color: 0xfffbe6, transparent: true }); m2.userData.o0 = 1; OWN.push(m2); CANO.mats.push(m2); const lp = new T.Mesh(G.plane, m2); lp.scale.set(1.7, .42, 1); lp.rotation.x = Math.PI / 2; lp.position.set(st.x + i * 2.8, cy0 - .012, st.z + j * 3.6); g.add(lp); }
    const sg = textTex([['GASOLIO · AdBlue', 66, 800, 56, null, '#ffffff'], [C.orgName().toUpperCase().slice(0, 30) + ' · DISTRIBUTORE INTERNO', 26, 700, 108, null, 'rgba(255,255,255,.9)']], { bg: '#f47b20', w: 1024, h: 140 });
    for (const s of [-1, 1]) { const pq = planeT(sg, 7, .96, g, st.x, cy0 + .42, st.z + s * (cd / 2 + .135), s < 0 ? { ry: Math.PI } : {}); pq.material.transparent = true; pq.material.userData.o0 = 1; CANO.mats.push(pq.material); }
    for (const [sx, sz] of [[-1, -1], [1, 1]]) { const px = st.x + sx * IX, pz = st.z + sz * 2.3; bxS(g, .16, .16, .3, 0x2b2f35, px, cy0 - .62, pz + sz * .33); meshS(G.cyl, mat(0x1d1f22), px, cy0 - .55, pz + sz * .5, g, { s: [.1, .1, .1], rx: Math.PI / 2, ns: 1 }); }
    // cartello di sicurezza su una colonna
    { const t2 = textTex([['AREA DI RIFORNIMENTO', 30, 800, 40, null, '#ffffff'], ['Spegnere il motore', 28, 700, 92, null, '#ffffff'], ['Vietato fumare · usare il badge', 24, 600, 136, null, 'rgba(255,255,255,.88)']], { bg: '#1f4fb4', w: 420, h: 170, round: 12 }); planeT(t2, 1.3, .53, g, st.x - IX, 2.6, st.z + 2.3 + .245, {}); }
    pumpDraw(0, GD.price); pumpTex = new T.CanvasTexture(pumpCv); pumpTex.colorSpace = T.SRGBColorSpace; OWN.push(pumpTex);
    const termT = textTex([['BADGE', 40, 800, 52, null, '#5df08a'], ['Avvicina la tessera', 22, 600, 96, null, 'rgba(255,255,255,.85)'], ['poi scegli il mezzo', 22, 600, 128, null, 'rgba(255,255,255,.6)']], { bg: '#0f1a14', w: 256, h: 160, round: 8 });
    const hoseM = mat(0x1d1f22);
    [-IX, IX].forEach(ix => {
      const px = st.x + ix, pz = st.z, fc = ix < 0 ? 1 : -1; // lato verso la corsia centrale
      bxS(g, 1.3, .26, 6.4, 0xd8d5ce, px, .2, pz); bxS(g, 1.34, .03, 6.44, 0xbcb8b0, px, .46, pz, { ns: 1 });
      for (const s of [-1, 1]) { bxS(g, 1.4, .34, .3, M.haz, px, .19, pz + s * 3.09, { ns: 1 }); meshS(G.cyl, mat(0xf2c418), px, .85, pz + s * 3.66, g, { s: [.2, 1.3, .2], ns: 1 }); B.add('bb', G.cyl, mat(0x1d1f22), m4(px, 1.05, pz + s * 3.66, .23, .12, .23)); B.add('bb', G.cyl, mat(0x1d1f22), m4(px, .7, pz + s * 3.66, .23, .12, .23)); }
      // erogatore: zoccolo, corpo, pannelli, testata con display su due lati, pistole gasolio e AdBlue, tubi
      bxS(g, 1.0, .16, .76, 0x8e959e, px, .48, pz); bxS(g, .86, 1.5, .62, 0xf4f5f6, px, .64, pz); for (const s of [-1, 1]) bxS(g, .025, 1.1, .5, 0xf47b20, px + s * .445, .84, pz, { ns: 1 });
      bxS(g, .92, .58, .68, 0x2b2f35, px, 2.14, pz); bxS(g, .96, .08, .72, 0xf47b20, px, 2.72, pz);
      for (const s of [-1, 1]) { const dm = new T.MeshBasicMaterial({ map: pumpTex }); OWN.push(dm); const sc = new T.Mesh(G.plane, dm); sc.scale.set(.56, .37, 1); sc.position.set(px + s * .475, 2.43, pz); sc.rotation.y = s * Math.PI / 2; g.add(sc); }
      for (const s of [-1, 1]) for (const [dz, col, nm] of [[-.18, 0x1d1f22, 'd'], [.18, 0x2f6db4, 'a']]) {
        bxS(g, .14, .3, .16, 0x3a3f46, px + s * .5, 1.15, pz + dz);
        const busy = s === fc && nm === 'd' && ix < 0; if (busy) continue; // pistola in uso
        bxS(g, .1, .12, .26, col, px + s * .6, 1.27, pz + dz); meshS(G.cyl, mat(0x9aa1a9), px + s * .6, 1.2, pz + dz + .16, g, { s: [.03, .14, .03], rx: .6, ns: 1 });
        const hs = new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(px + s * .44, 2.0, pz + dz), new T.Vector3(px + s * .62, 1.35, pz + dz * 1.4), new T.Vector3(px + s * .72, .7, pz + dz), new T.Vector3(px + s * .62, 1.2, pz + dz)]), 20, .025, 6); OWN.push(hs); meshS(hs, col === 0x2f6db4 ? mat(0x2a4f86) : hoseM, 0, 0, 0, g, { ns: 1 });
      }
      // terminale badge e arresto d'emergenza alle estremità dell'isola
      const tz = pz + 2.55; bxS(g, .3, 1.0, .24, 0x2b2f35, px, .47, tz); bxS(g, .44, .52, .3, 0x1d1f22, px, 1.47, tz); const ts = planeT(termT, .36, .23, g, px + fc * .232, 1.8, tz, { ry: fc * Math.PI / 2 }); ts.renderOrder = 1;
      bxS(g, .03, .14, .2, 0x3a3f46, px + fc * .235, 1.55, tz, { ns: 1 });
      const ez = pz - 2.6; bxS(g, .1, 1.0, .1, 0xc5cad1, px, .47, ez); bxS(g, .24, .24, .14, 0xf2c418, px, 1.47, ez); meshS(G.sph, mat(0xd62b1f), px + fc * .1, 1.59, ez, g, { s: [.14, .14, .14], ns: 1 });
      meshS(G.cyl, mat(0x2f6db4), px, .82, pz - 1.6, g, { s: [.3, .7, .3] }); meshS(G.cyl, mat(0xeef0f2), px, 1.25, pz + 1.55, g, { s: [.18, .26, .18] });
    });
    // totem del prezzo a led
    const tot = textTex([['GASOLIO', 44, 800, 46, null, '#ffffff'], [GD.price ? GD.price.toFixed(3).replace('.', ',') : '—', 90, 800, 142, null, '#ffb02e'], ['€ / litro', 30, 600, 204, null, 'rgba(255,255,255,.85)'], [`${N(Math.round(GD.lM))} L nel mese`, 26, 600, 262, null, 'rgba(255,255,255,.8)']], { bg: '#111316', w: 320, h: 300, round: 18 });
    const ttx = st.x + cw / 2 + 2.6, ttz = st.z + cd / 2 + 1.4;
    bxS(g, 1.8, .5, .7, 0x8e959e, ttx, .2, ttz); bxS(g, 1.6, 4.4, .42, 0xf47b20, ttx, .7, ttz); bxS(g, 1.66, .52, .48, 0xffffff, ttx, 4.64, ttz); planeT(tot, 1.4, 1.31, g, ttx, 3.4, ttz + .228);
    // deposito: vasca di contenimento, cisterna a doppia parete con piastre ADR, sfiato, armadio di carico, pompa, parapetto, antincendio, kit antisversamento
    const tx = F.x0 + 5, tz = st.z + 1.5;
    bxS(g, 4.4, .62, 8.6, 0xc9c6bf, tx, .16, tz); bxS(g, 3.9, .04, 8.1, 0x8f8c85, tx, .79, tz, { ns: 1 }); for (const s of [-1, 1]) { bxS(g, .25, .16, 8.6, 0xbab7b0, tx + s * 2.08, .78, tz); bxS(g, 4.4, .16, .25, 0xbab7b0, tx, .78, tz + s * 4.18); }
    meshS(G.cyl, mat(0xeef0f2), tx, 2.35, tz, g, { s: [2.5, 6, 2.5], rx: Math.PI / 2 }); meshS(G.sph, mat(0xeef0f2), tx, 2.35, tz + 3, g, { s: [2.5, 2.5, .7] }); meshS(G.sph, mat(0xeef0f2), tx, 2.35, tz - 3, g, { s: [2.5, 2.5, .7] });
    for (const zz of [-1.6, 1.6]) meshS(G.cyl, mat(0xf47b20), tx, 2.35, tz + zz, g, { s: [2.56, .35, 2.56], rx: Math.PI / 2 });
    for (const s of [-1, 1]) { bxS(g, 2.3, 1.0, .35, 0x7d848d, tx, .76, tz + s * 2); }
    const adr = textTex([['30', 70, 800, 62, null, '#111'], ['1202', 70, 800, 142, null, '#111']], { bg: '#f28a1d', w: 220, h: 180, round: 6 });
    for (const s of [-1, 1]) { planeT(adr, .5, .41, g, tx + s * 1.3, 2.35, tz + .3, { ry: s * Math.PI / 2 }); }
    const tl = textTex([['GASOLIO', 60, 800, 46, null, '#1d1f22'], ['doppia parete · infiammabile', 22, 600, 96, null, '#55585e']], { bg: '#ffffff', w: 420, h: 120, round: 10 });
    for (const s of [-1, 1]) planeT(tl, 1.9, .54, g, tx + s * 1.3, 2.35, tz - 1.25, { ry: s * Math.PI / 2 });
    meshS(G.cyl, mat(0x9aa1a9), tx + .6, 4.4, tz - 2.2, g, { s: [.1, 1.8, .1] }); meshS(G.cyl, mat(0x2b2f35), tx + .6, 5.35, tz - 2.2, g, { s: [.22, .12, .22] });
    bxS(g, .5, .32, .5, 0x2b2f35, tx - .3, 3.6, tz + 1.2); meshS(G.cyl, mat(0x9aa1a9), tx - .3, 4.0, tz + 1.2, g, { s: [.12, .5, .12] });
    bxS(g, 1.0, 1.3, .6, 0xd8dbe0, tx + 1.4, .78, tz + 4.7); bxS(g, .9, .02, .02, 0x2b2f35, tx + 1.4, 1.55, tz + 5.01, { ns: 1 });
    bxS(g, .9, .6, .7, 0x4f6b54, tx - 1.2, .78, tz + 3.6); meshS(G.cyl, mat(0x6f7680), tx - .6, 1.1, tz + 3.6, g, { s: [.3, .5, .3], rz: Math.PI / 2 });
    for (let i = 0; i < 10; i++) { const zz = tz - 4.2 + i * .93; for (const s of [-1, 1]) B.add('rl', G.box, mat(0xf2c418), m4(tx + s * 2.15, 1.36, zz, .05, 1.1, .05)); }
    for (const s of [-1, 1]) { B.add('rl', G.box, mat(0xf2c418), m4(tx + s * 2.15, 1.9, tz, .06, .06, 8.4)); B.add('rl', G.box, mat(0xf2c418), m4(tx + s * 2.15, 1.4, tz, .04, .04, 8.4)); }
    for (const zz of [-1, 1]) { bxS(g, .4, .7, .3, 0xd62b1f, tx - 2.7, .2, tz + zz * 2.6); meshS(G.cyl, mat(0xd62b1f), tx - 2.7, 1.2, tz + zz * 2.6, g, { s: [.3, .55, .3] }); }
    bxS(g, 1.0, .9, .7, 0xf2c418, tx + 2.9, .2, tz - 3.4); planeT(textTex([['KIT', 40, 800, 44, null, '#1d1f22'], ['antisversamento', 22, 700, 86, null, '#1d1f22']], { w: 256, h: 110 }), .9, .39, g, tx + 2.9, .78, tz - 3.4 + .37);
    planeT(textTex([['DEPOSITO GASOLIO', 34, 800, 44, null, '#fff'], ['Vietato fumare e usare fiamme libere', 22, 600, 92, null, 'rgba(255,255,255,.9)']], { bg: '#d62b1f', w: 512, h: 120, round: 10 }), 2.4, .56, g, tx, 1.55, tz + 4.33);
    // AdBlue: cisternetta da 1000 L su pallet con gabbia
    { const ax = tx, az = tz - 6.4; bxS(g, 1.2, .15, 1.0, 0xc8a27a, ax, .2, az); bxS(g, 1.08, .95, .9, 0xf4f6f8, ax, .36, az); bxS(g, .3, .12, .3, 0x2f6db4, ax, 1.31, az);
      for (let i = 0; i < 5; i++) { B.add('ibc', G.box, mat(0x9aa1a9), m4(ax - .55 + i * .275, .85, az + .46, .025, 1.0, .025)); B.add('ibc', G.box, mat(0x9aa1a9), m4(ax - .55 + i * .275, .85, az - .46, .025, 1.0, .025)); }
      for (const y of [.6, 1.0, 1.32]) { B.add('ibc', G.box, mat(0x9aa1a9), m4(ax, y, az + .46, 1.12, .025, .025)); B.add('ibc', G.box, mat(0x9aa1a9), m4(ax, y, az - .46, 1.12, .025, .025)); }
      planeT(textTex([['AdBlue', 52, 800, 56, null, '#ffffff']], { bg: '#2f6db4', w: 256, h: 96, round: 8 }), .6, .23, g, ax, .85, az + .5); }
    // tubazione interrata segnalata dalla cisterna alle isole
    const tube = new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(tx + 1.2, .5, tz - 2), new T.Vector3(tx + 4, .24, tz - 3), new T.Vector3(st.x - IX, .24, st.z + 1)]), 24, .07, 6); OWN.push(tube); meshS(tube, mat(0x3a3f46), 0, 0, 0, g, { ns: 1 });
    B.flush();
    // mezzi: quello dell'ultimo rifornimento è alla colonnina, gli altri nei posti
    const lastP = GD.lastR[0] ? C.plate(GD.lastR[0].targa) : '';
    let k = 0; fleetVeh = [];
    GD.V.forEach(v => {
      let o;
      if (v.p === lastP && GD.V.length) { o = vehicle(g, v, st.x, st.z, Math.PI / 2); o.position.y = .215; v.atPump = 1; }
      else { const s = slots[k++]; if (!s) return; o = vehicle(g, v, s.x, s.z, s.ry); }
      fleetVeh.push({ v, o });
    });
    // tubo della colonnina fino al bocchettone del mezzo al rifornimento
    const vp = fleetVeh.find(f => f.v.atPump);
    if (vp) { const hw2 = { truck: 1.3, van: .99, car: .87, pickup: .92 }[vp.v.kind] || 1, fx = st.x - hw2 - .03, fz = st.z + .55, pxD = st.x - IX + .44;
      const nz = new T.Group(); nz.position.set(fx - .04, 1.16, fz); g.add(nz); bxS(nz, .26, .1, .09, 0x1d1f22, -.15, -.06, 0); bxS(nz, .08, .16, .07, 0x1d1f22, -.22, -.2, 0); meshS(G.cyl, mat(0x9aa1a9), .03, -.01, 0, nz, { s: [.035, .14, .035], rz: Math.PI / 2, ns: 1 });
      const h2 = new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(pxD, 2.0, st.z - .18), new T.Vector3(pxD + .3, 1.2, st.z + .05), new T.Vector3(fx - .7, .62, fz - .2), new T.Vector3(fx - .36, 1.08, fz)]), 28, .028, 6); OWN.push(h2); meshS(h2, mat(0x1d1f22), 0, 0, 0, g, { ns: 1 });
      const op = person(g, fx - .6, fz + .2, 0xf47b20, null, { mode: 'fuel' }); op.position.y = .21; op.rotation.y = Math.PI / 2; movers.push({ o: op, t: 'bob', ph: 3 });
      movers.push({ t: 'pump', l: C.num(GD.lastR[0].litri) || 40, price: GD.price, last: 0 }); }
    // area cliccabile del parco mezzi e del distributore
    const hz = new T.Mesh(G.box, M.hit); hz.scale.set(w, .6, d); hz.position.set(cx, .2, cz); hz.userData.k = { t: 'zone', z: 'flotta' }; g.add(hz); pick.push(hz);
    const hf = new T.Mesh(G.box, M.hit); hf.scale.set(cw + 6, 5.6, cd); hf.position.set(st.x + 1.5, 2.8, st.z); hf.userData.k = { t: 'fuel' }; g.add(hf); pick.push(hf);
    const ht = new T.Mesh(G.box, M.hit); ht.scale.set(3.6, 4, 7.4); ht.position.set(tx, 2, tz); ht.userData.k = { t: 'fuel' }; g.add(ht); pick.push(ht);
  }
  let fleetVeh = [], CANO = null;
  // pensilina trasparente quando si guarda il distributore
  function canoTick(dt) { const C2 = CANO; if (!C2 || Math.abs(C2.u - C2.want) < .002) return; C2.u += (C2.want - C2.u) * Math.min(1, dt * 3.2); if (Math.abs(C2.u - C2.want) < .004) C2.u = C2.want; C2.mats.forEach(m => { m.opacity = m.userData.o0 * C2.u; m.depthWrite = C2.u > .95; }); }
  const vehOf = p => D.gas && D.gas.V.find(v => v.p === p);
  const plHtml = (p, big) => `<span class="m3-pl${big ? ' big' : ''}"><i>I</i><b>${esc(plFmt(p))}</b></span>`;
  const bars6 = (vals, keys) => { const mx = Math.max(1, ...vals); const MN = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']; return `<div class="m3-b6">${vals.map((v, i) => `<div><span>${v ? N(Math.round(v)) : ''}</span><i style="--h:${(v / mx * 100).toFixed(1)}%"${i === vals.length - 1 ? ' class="c"' : ''}></i><small>${MN[+keys[i].slice(5) - 1]}</small></div>`).join('')}</div>`; };
  const gasBtns = () => (C.gasW && C.gasW() ? `<button type="button" class="m3-go" data-m3="gasadd">${ic('fuel')}Registra un rifornimento</button>` : '') + `<button type="button" class="m3-go ghost" data-m3="gasopen">${ic('chart')}Apri la sezione Gasolio</button>`;
  const pct = (a, b) => b ? Math.round((a - b) / b * 100) : null;
  const dlt = (a, b, lbl) => { const p = pct(a, b); return p == null ? '' : `<span class="m3-dl ${p > 0 ? 'up' : p < 0 ? 'dn' : ''}">${p > 0 ? '▲' : p < 0 ? '▼' : '='} ${Math.abs(p)}%</span> ${lbl}`; };
  const MN3 = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
  const dec1 = v => v.toFixed(1).replace('.', ',');
  const bars12 = (vals, keys, fmt) => { const mx = Math.max(1, ...vals); return `<div class="m3-b14 m3-b12">${vals.map((v, i) => `<div title="${MN3[+keys[i].slice(5) - 1]} ${keys[i].slice(0, 4)}: ${fmt(v)}"><i style="--h:${(v / mx * 100).toFixed(1)}%;--k:${i}"${i === vals.length - 1 ? ' class="c"' : ''}></i><small>${MN3[+keys[i].slice(5) - 1][0].toUpperCase()}</small></div>`).join('')}</div>`; };
  const anRow = a => `<button type="button" class="m3-row m3-an" data-veh3="${esc(a.v.p)}"><i class="m3-pi">${ic('alert')}</i><span class="tx"><b>${plHtml(a.v.p)} ${esc(a.m)}</b><small>${esc([C.dIt(a.r.data), N(C.num(a.r.litri)) + ' L', String(a.r.operatore || '').trim()].filter(x => x && x !== '?').join(' · '))}</small></span></button>`;
  function fleetPanel(Pn) {
    const GD = D.gas; if (!GD) return '';
    const mPrev = MN3[+GD.k12[10].slice(5) - 1];
    if (Pn.t === 'zone') {
      const cs = GD.V.filter(v => v.cons).sort((a, b) => b.l100 - a.l100), mx = Math.max(1, ...cs.map(v => v.l100)), avg = GD.cons ? 100 / GD.cons : 0;
      const dv = [...GD.drv.values()].sort((a, b) => b.l - a.l).slice(0, 6), dmx = Math.max(1, ...dv.map(d => d.l));
      return head(ic('van'), 'or', 'Parco mezzi · gasolio', 'Mezzi aziendali', `${GD.V.length} mezzi · distributore interno`, 1) + `<div class="m3-pb">
        <div class="m3-chips">${GD.AN.length ? `<button type="button" class="m3-chip r" data-m3="gasan"><i></i>${GD.AN.length} rifornimenti da controllare</button>` : '<span class="m3-chip g"><i></i>Nessuna anomalia</span>'}${GD.rent ? `<span class="m3-chip" style="background:#e6efff;color:#1f55b8">Noleggi ${C.eur0(GD.rent * GD.mul)}/mese</span>` : ''}</div>
        <div class="m3-grid">${stat('Gasolio nel mese', N(Math.round(GD.lM)), 'L', dlt(GD.lM, GD.lP, 'su ' + mPrev))}${stat('Spesa carburante', GD.price || GD.cM ? C.eur0(GD.cM) : '—', '', dlt(GD.cM, GD.cP, 'su ' + mPrev))}
        ${stat('Consumo medio', avg ? dec1(avg) : '—', avg ? 'L/100 km' : '', GD.cons ? `${dec1(GD.cons)} km con un litro` : 'servono i km')}${stat('Costo al km', GD.eurKm ? GD.eurKm.toFixed(2).replace('.', ',') : '—', GD.eurKm ? '€/km' : '', GD.kmM ? `${N(GD.kmM)} km nel mese` : 'carburante · servono i km')}</div>
        ${gasBtns()}
        <div class="m3-h4">Litri · ultimi 12 mesi <em>${C.eur0(GD.c12.reduce((a, b) => a + b, 0))}</em></div>${bars12(GD.l12, GD.k12, v => N(Math.round(v)) + ' L')}
        ${cs.length ? `<div class="m3-h4">Consumi per mezzo <em>media ${dec1(avg)} L/100 km</em></div><div class="m3-hb">${cs.map((v, i) => `<button type="button" data-veh3="${esc(v.p)}" style="--k:${i}"><span><b>${plHtml(v.p)} ${esc(v.name || '')}</b><small>${dec1(v.l100)} L/100 km</small></span><u><i style="--w:${(v.l100 / mx * 100).toFixed(1)}%;--c:${v.l100 > avg * 1.2 ? '#d9452f' : v.l100 < avg * .85 ? '#2a8a4a' : '#f3a868'}"></i><b class="avg" style="left:${(avg / mx * 100).toFixed(1)}%"></b></u></button>`).join('')}</div>` : ''}
        ${dv.length ? `<div class="m3-h4">Per autista · ${MN3[+GD.k12[11].slice(5) - 1]}</div><div class="m3-hb">${dv.map((d, i) => `<div style="--k:${i}"><span><b>${esc(d.n)}</b><small>${N(Math.round(d.l))} L · ${d.k} ${d.k === 1 ? 'pieno' : 'pieni'}</small></span><u><i style="--w:${(d.l / dmx * 100).toFixed(1)}%;--c:#2f6db4"></i></u></div>`).join('')}</div>` : ''}
        <div class="m3-h4">Mezzi <em>${GD.V.length}</em></div><div class="m3-rows m3-ilist">${GD.V.map(v => `<button type="button" class="m3-row" data-veh3="${esc(v.p)}">${plHtml(v.p)}<span class="tx"><b>${esc(v.name || ({ van: 'Furgone', truck: 'Autocarro', car: 'Auto', pickup: 'Pick-up' })[v.kind])}</b><small>${esc([v.drv.length ? 'guida ' + v.drv.join(', ') : v.uso, v.last ? 'ultimo ' + C.dIt(v.last.data) : 'nessun rifornimento'].filter(Boolean).join(' · '))}</small></span>${v.an ? `<span class="m3-chip r"><i></i>${v.an}</span>` : ''}<span class="m3-chip ${v.lM ? 'g' : 'n'}">${N(Math.round(v.lM))} L</span></button>`).join('') || '<div class="m3-empty">Nessun mezzo: aggiungili dalla sezione Gasolio con «+ Mezzo»</div>'}</div></div>`;
    }
    if (Pn.t === 'fuel') {
      const lr = GD.lastR[0], lv = lr && vehOf(C.plate(lr.targa)), dmx = Math.max(1, ...GD.days), today = +C.today().slice(8, 10);
      return head(ic('fuel'), 'or', 'Distributore interno', 'Gasolio', `${GD.nAll} rifornimenti registrati`, 1) + `<div class="m3-pb">
        <div class="m3-grid">${stat('Prezzo', GD.price ? GD.price.toFixed(3).replace('.', ',') : '—', '€/L', GD.price ? 'impostato nella sezione Gasolio' : 'da impostare')}${stat('Erogati nel mese', N(Math.round(GD.lM)), 'L', `${GD.nM} rifornimenti · ${dlt(GD.lM, GD.lP, '')}`)}
        ${stat('Media per pieno', GD.nM ? N(Math.round(GD.lM / GD.nM)) : '—', GD.nM ? 'L' : '', 'nel mese')}${stat('Spesa nel mese', GD.price || GD.cM ? C.eur0(GD.cM) : '—', '', GD.mul !== 1 ? 'IVA inclusa' : 'carburante')}</div>
        ${lr ? `<div class="m3-last"><span class="m3-ey">Ultimo rifornimento</span><div>${plHtml(C.plate(lr.targa), 1)}<b>${N(C.num(lr.litri))}<small>L</small></b></div><small>${esc([C.dIt(lr.data), C.num(lr.km) ? N(C.num(lr.km)) + ' km' : '', String(lr.operatore || '').trim(), lv && lv.name].filter(x => x && x !== '?').join(' · '))}</small></div>` : ''}
        ${gasBtns()}
        <div class="m3-h4">Litri giorno per giorno · ${MN3[+GD.k12[11].slice(5) - 1]}</div><div class="m3-b14" style="grid-template-columns:repeat(${GD.days.length},1fr);gap:2px">${GD.days.map((v, i) => `<div title="${i + 1}: ${N(Math.round(v))} L"><i style="--h:${(v / dmx * 100).toFixed(1)}%;--k:${i}"${i + 1 === today ? ' class="c"' : ''}></i><small>${(i + 1) % 5 === 0 || i === 0 ? i + 1 : ''}</small></div>`).join('')}</div>
        <div class="m3-h4">Da controllare <em>${GD.AN.length}</em></div>${GD.AN.length ? `<div class="m3-rows">${GD.AN.slice(0, 12).map(anRow).join('')}</div>` : '<div class="m3-ok">Nessuna anomalia negli ultimi 90 giorni: km in ordine e consumi regolari.</div>'}
        <div class="m3-h4">Ultimi rifornimenti <em>${GD.lastR.length}</em></div><div class="m3-tl m3-tl2">${GD.lastR.slice(0, 14).map(r => { const p = C.plate(r.targa), v = vehOf(p); return `<button type="button" ${v ? `data-veh3="${esc(p)}"` : ''}><b>${esc(C.dIt(r.data).slice(0, 5))}</b>${plHtml(p)}<span class="tx2">${N(C.num(r.litri))} L${C.num(r.km) ? ' · ' + N(C.num(r.km)) + ' km' : ''}<small>${esc([String(r.operatore || '').trim(), String(r.uso || '').trim()].filter(x => x && x !== '?').join(' · ').toLowerCase())}</small></span></button>`; }).join('') || '<div class="m3-empty">Nessun rifornimento</div>'}</div></div>`;
    }
    const v = vehOf(Pn.p); if (!v) return '';
    const KN = { van: 'Furgone', truck: 'Autocarro', car: 'Auto aziendale', pickup: 'Pick-up' }[v.kind], van = GD.AN.filter(a => a.v === v), avg = GD.cons ? 100 / GD.cons : 0;
    return head(ic(v.kind === 'truck' ? 'truck' : 'van'), '', KN + (v.atPump ? ' · al distributore' : ''), plHtml(v.p, 1), esc([v.name, v.owner].filter(Boolean).join(' · ') || 'mezzo aziendale'), 1) + `<div class="m3-pb">
      <div class="m3-chips">${v.atPump ? '<span class="m3-chip a"><i></i>In rifornimento</span>' : ''}${v.drv.length ? `<span class="m3-chip">${ic('users', ' style="width:13px;height:13px"')}${esc(v.drv.join(', '))}</span>` : ''}${v.centro ? `<span class="m3-chip n">centro ${esc(v.centro)}</span>` : ''}${v.rent ? `<span class="m3-chip" style="background:#e6efff;color:#1f55b8">Noleggio ${C.eur0(v.rent * D.gas.mul)}/mese</span>` : ''}${v.uso ? `<span class="m3-chip n">${esc(v.uso.toLowerCase())}</span>` : ''}</div>
      <div class="m3-grid">${stat('Contachilometri', v.odo ? N(v.odo) : '—', v.odo ? 'km' : '', v.last && C.num(v.last.km) ? 'al ' + C.dIt(v.last.data) : 'km non registrati')}${stat('Consumo', v.l100 ? dec1(v.l100) : '—', v.l100 ? 'L/100 km' : '', v.cons ? (avg ? `${v.l100 > avg * 1.2 ? 'sopra' : v.l100 < avg * .85 ? 'sotto' : 'in linea con'} la media (${dec1(avg)})` : `${dec1(v.cons)} km/L`) : 'servono i km')}
      ${stat('Gasolio nel mese', N(Math.round(v.lM)), 'L', `${v.nM} pieni · ${C.eur0(v.cM)}`)}${stat('Costo al km', v.eurKm ? v.eurKm.toFixed(2).replace('.', ',') : '—', v.eurKm ? '€/km' : '', `${N(v.km)} km misurati · ${C.eur0(v.cT)} in tutto`)}</div>
      <div class="m3-h4">Litri · ultimi 12 mesi <em>${N(Math.round(v.l12.reduce((a, b) => a + b, 0)))} L</em></div>${bars12(v.l12, GD.k12, x => N(Math.round(x)) + ' L')}
      ${gasBtns()}
      ${van.length ? `<div class="m3-h4">Da controllare <em>${van.length}</em></div><div class="m3-rows">${van.slice(0, 8).map(anRow).join('')}</div>` : ''}
      <div class="m3-h4">Rifornimenti <em>${v.s.length}</em></div><div class="m3-tl m3-tl2">${v.s.slice().reverse().slice(0, 12).map((r, i, A) => { const nx = A[i + 1], dk = nx && C.num(r.km) && C.num(nx.km) && C.num(r.km) > C.num(nx.km) && C.num(r.km) - C.num(nx.km) < 5000 ? C.num(r.km) - C.num(nx.km) : 0; return `<div><b>${esc(C.dIt(r.data))}</b><span class="tx2">${N(C.num(r.litri))} L${C.num(r.km) ? ' · ' + N(C.num(r.km)) + ' km' : ''}${dk ? ` · ${dec1(C.num(r.litri) / dk * 100)} L/100` : ''}<small>${esc([String(r.operatore || '').trim(), String(r.uso || '').trim()].filter(x => x && x !== '?').join(' · ').toLowerCase())}</small></span></div>`; }).join('') || '<div class="m3-empty">Nessun rifornimento registrato</div>'}</div></div>`;
  }


  /* ---------------- persone, muletti e transpallet (v278): modelli articolati e movimenti ---------------- */
  const CAPS = {};
  const capG = (r, l) => { const k = r + '|' + l; return CAPS[k] || (CAPS[k] = new T.CapsuleGeometry(r, l, 5, 12)); };
  const domeG = () => G.dome || (G.dome = new T.SphereGeometry(.5, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2));
  const torG = () => G.tor || (G.tor = new T.TorusGeometry(.16, .022, 8, 28));
  const angD = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
  function partS(...a) { const e = part(...a); e.__s = 1; return e; }
  function part(geo, m, x, y, z, par, s, r, ns) { const e = new T.Mesh(geo, m); e.position.set(x, y, z); if (s) e.scale.set(s[0], s[1], s[2]); if (r) e.rotation.set(r[0], r[1], r[2]); e.castShadow = !ns; e.receiveShadow = true; par.add(e); return e; }
  const grp = (par, x, y, z) => { const q = new T.Group(); q.position.set(x, y, z); par.add(q); return q; };
  function blobMat() { if (M.blob) return M.blob; const t = cvTex(64, 64, (gx, w, h) => { const gr = gx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(20,22,26,.42)'); gr.addColorStop(1, 'rgba(20,22,26,0)'); gx.fillStyle = gr; gx.fillRect(0, 0, w, h); }); return (M.blob = new T.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })); }
  function radTex(k, c0, c1) { if (TX[k]) return TX[k]; TX[k] = cvTex(128, 128, (gx, w, h) => { const gr = gx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, c0); gr.addColorStop(.45, c1); gr.addColorStop(1, 'rgba(0,0,0,0)'); gx.fillStyle = gr; gx.fillRect(0, 0, w, h); }); return TX[k]; }
  const SKIN = [0xeac4a0, 0xdcae88, 0xc8916b, 0xf1d3b6, 0xa8734f], HAIR = [0x2b211b, 0x4a3426, 0x6b4a2f, 0x1b1b1d, 0x8a8d93];

  // operatore: anche, ginocchia, caviglie, busto, testa, spalle, gomiti, polsi
  function person(p, x, z, vest, helmet, o) {
    o = o || {};
    const g = new T.Group(); g.position.set(x, .5, z); p.add(g);
    const sk = mat(SKIN[Math.floor(rr() * SKIN.length)]), pn = mat(o.pants || [0x2b3440, 0x33363b, 0x3b4a5e][Math.floor(rr() * 3)]), sh = mat(o.shirt || [0xf4f4f2, 0x3f4a5a, 0xe4e7eb, 0x2f3a4a][Math.floor(rr() * 4)]);
    const vs = mat(vest || 0x39a85a), rf = mat(0xe8ebee), dk = mat(0x1b1d20), bt = mat(0x2a2522), gl = mat(o.glove || [0x4a4f57, 0xe0a03a, 0x5b6068][Math.floor(rr() * 3)]), hm = mat(helmet || 0xf5f5f2);
    const root = grp(g, 0, 0, 0);
    const leg = s => { const hip = grp(root, s * .1, .92, 0); partS(capG(.084, .3), pn, 0, -.21, 0, hip, [1, 1, 1.05]); const knee = grp(hip, 0, -.43, 0); partS(G.sph, pn, 0, 0, .005, knee, [.15, .15, .155]); partS(capG(.07, .3), pn, 0, -.2, 0, knee); partS(G.cyl, rf, 0, -.27, 0, knee, [.155, .035, .155]);
      const ank = grp(knee, 0, -.42, 0); partS(G.box, bt, 0, .035, .03, ank, [.13, .1, .22]); partS(G.sph, bt, 0, .03, .13, ank, [.13, .1, .12]); partS(G.box, dk, 0, -.008, .045, ank, [.138, .022, .28]); partS(G.box, mat(0x3a332e), 0, .055, .16, ank, [.12, .05, .06]); return { hip, knee, ank }; };
    const L1 = leg(-1), R1 = leg(1);
    partS(capG(.12, .14), pn, 0, .98, 0, root, [1, 1, .78], [0, 0, Math.PI / 2]);
    partS(G.cyl, dk, 0, 1.045, 0, root, [.39, .055, .29]); partS(G.box, mat(0xb7bcc3), 0, 1.045, .152, root, [.06, .04, .014]);
    partS(G.box, dk, .19, 1.0, -.03, root, [.05, .12, .07]); partS(G.cyl, dk, .2, 1.11, -.04, root, [.012, .12, .012]); partS(G.box, mat(0xf47b20), .2, 1.04, .01, root, [.04, .03, .012], null, 1);
    const spine = grp(root, 0, 1.02, 0);
    partS(capG(.16, .26), sh, 0, .23, 0, spine, [1.05, 1, .72]);
    partS(capG(.168, .2), vs, 0, .2, 0, spine, [1.07, 1, .77]);
    for (const y of [.12, .25]) partS(G.cyl, rf, 0, y, 0, spine, [.385, .04, .284], null, 1);
    for (const s of [-1, 1]) { partS(G.box, rf, s * .085, .34, .14, spine, [.036, .17, .014], null, 1); partS(G.box, rf, s * .085, .31, -.14, spine, [.036, .22, .014], null, 1); }
    partS(G.box, mat(0xffffff), -.06, .3, .143, spine, [.06, .045, .012], null, 1); partS(G.box, mat(0xf47b20), -.06, .313, .151, spine, [.06, .012, .006], null, 1);
    partS(G.cyl, sk, 0, .53, 0, spine, [.095, .1, .095]);
    const hd = grp(spine, 0, .58, 0);
    partS(G.sph, sk, 0, .1, .005, hd, [.215, .245, .225]);
    partS(G.box, mat(HAIR[Math.floor(rr() * HAIR.length)]), 0, .075, -.098, hd, [.15, .07, .03]);
    for (const s of [-1, 1]) { partS(G.sph, mat(0x1d1f22), s * .041, .115, .106, hd, [.026, .03, .02], null, 1); partS(G.box, mat(0x3a2e26), s * .042, .147, .104, hd, [.042, .01, .016], [-.15, 0, 0], 1); partS(G.sph, sk, s * .11, .1, 0, hd, [.035, .06, .045]); }
    partS(G.sph, sk, 0, .088, .113, hd, [.032, .042, .03], null, 1); partS(G.box, mat(0xa0675a), 0, .047, .108, hd, [.045, .009, .014], null, 1);
    partS(domeG(), hm, 0, .148, -.005, hd, [.27, .26, .285]); partS(G.cyl, hm, 0, .15, -.005, hd, [.285, .018, .3]); partS(G.box, hm, 0, .152, .14, hd, [.15, .016, .07]); partS(G.box, hm, 0, .27, -.01, hd, [.035, .035, .22]);
    const arm = s => { const sh2 = grp(spine, s * .21, .43, 0); partS(G.sph, sh, 0, -.01, 0, sh2, [.125, .125, .125]); partS(capG(.05, .19), sh, 0, -.14, 0, sh2); const el = grp(sh2, 0, -.29, 0); partS(G.sph, sh, 0, 0, 0, el, [.095, .095, .095]); partS(capG(.045, .19), sh, 0, -.13, 0, el); const wr = grp(el, 0, -.28, 0); partS(G.sph, gl, 0, -.035, .01, wr, [.085, .115, .07]); partS(G.sph, gl, s * -.035, -.02, .035, wr, [.035, .06, .035]); return { sh: sh2, el, wr }; };
    const LA = arm(-1), RA = arm(1);
    if (o.tool === 'tablet' || o.mode === 'scan') { partS(G.box, dk, 0, -.06, .07, RA.wr, [.06, .045, .17]); partS(G.box, mat(0xf47b20), 0, -.04, .02, RA.wr, [.07, .06, .06]); partS(G.box, dk, .02, -.05, .1, LA.wr, [.22, .015, .3], [0, 0, .2]); partS(G.box, mat(0x9fc9e8), .02, -.04, .1, LA.wr, [.19, .006, .26], [0, 0, .2], 1); }
    const bl = part(G.plane, blobMat(), 0, .095, 0, g, [.75, .75, 1], [-Math.PI / 2, 0, 0], 1); bl.castShadow = false; bl.renderOrder = 1;
    g.traverse(e => { if (e.isMesh) { e.castShadow = false; e.receiveShadow = false; } });
    g.userData.rig = { root, spine, hd, hipL: L1.hip, hipR: R1.hip, knL: L1.knee, knR: R1.knee, anL: L1.ank, anR: R1.ank, shL: LA.sh, shR: RA.sh, elL: LA.el, elR: RA.el, wrL: LA.wr, wrR: RA.wr, ph: rr() * 6, amp: 0, mode: o.mode || 'walk', seed: rr() * 10, steer: 0, look: 0, lp: null, blob: bl };
    return g;
  }
  // posa: camminata, spinta, guida, lavoro al banco, controllo con lettore
  function poseP(R, t) {
    const a = R.amp, ph = R.ph, s = Math.sin(ph), c = Math.cos(ph), md = R.mode, sd = R.seed, still = 1 - a;
    let hL = -s * .5 * a, hR = s * .5 * a, kL = (Math.max(0, c) * 1.0 + .08) * a + .03, kR = (Math.max(0, -c) * 1.0 + .08) * a + .03;
    let sL = s * .45 * a, sR = -s * .45 * a, eL = -.16 - .32 * a * Math.max(0, -s), eR = -.16 - .32 * a * Math.max(0, s), zL = .07, zR = -.07;
    let lean = .06 * a, tw = s * .08 * a, hy = (Math.sin(t * .37 + sd) * .5 + Math.sin(t * .13 + sd * 2) * .25) * still, hx = Math.sin(t * .23 + sd) * .06 * still, bob = .028 * a * Math.cos(2 * ph), sway = Math.sin(t * .55 + sd) * .016 * still;
    let aL = -(hL + kL) * .55 + Math.max(0, -c) * .25 * a, aR = -(hR + kR) * .55 + Math.max(0, c) * .25 * a;
    if (md === 'push') { sL = sR = -1.12 + s * .04 * a; eL = eR = -.28; zL = .16; zR = -.16; lean = .2 + .04 * a; hx = .04; hy *= .3; tw *= .4; }
    else if (md === 'drive') { hL = hR = -1.5; kL = kR = 1.5; aL = aR = .05; sL = -.88 + R.steer * .25; sR = -.88 - R.steer * .25; eL = eR = -.62; zL = .1; zR = -.1; lean = -.06 + Math.sin(t * 2.2 + sd) * .01; tw = R.look * .42; hy = R.look * 1.2 + (1 - R.look) * Math.sin(t * .5 + sd) * .25; hx = .05; bob = Math.sin(t * 9) * .004 * Math.min(1, R.vib || 0); sway = 0; }
    else if (md === 'work') { const ty = t * 10; sL = -.52 + Math.sin(ty) * .05; sR = -.52 + Math.sin(ty + 1.7) * .05; eL = -1.0 + Math.max(0, Math.sin(ty * .9)) * .12; eR = -1.0 + Math.max(0, Math.sin(ty * .9 + 2)) * .12; zL = .2; zR = -.2; const up = Math.pow(Math.max(0, Math.sin(t * .31 + sd)), 10); hx = .34 - .42 * up; hy = up * Math.sin(t * .7 + sd) * .6; lean = .1; }
    else if (md === 'fuel') { sR = -1.22 + Math.sin(t * 1.3 + sd) * .03; eR = -.2; zR = -.05; sL = .08; eL = -.3; zL = .1; const lk = Math.pow(Math.max(0, Math.sin(t * .4 + sd)), 6); hx = .18 - .1 * lk; hy = .7 * lk; lean = .05; }
    else if (md === 'scan') { const cy = (t * .55 + sd) % 4, up = cy < 1.6 ? Math.sin(Math.min(1, cy / .35) * Math.PI / 2) * (cy > 1.25 ? Math.max(0, (1.6 - cy) / .35) : 1) : 0; sL = -.62; eL = -1.15; zL = .22; sR = -.55 - .75 * up; eR = -1.05 + .85 * up; zR = -.12; hx = .3 - .25 * up; hy = -.25 * up + Math.sin(t * .4 + sd) * .1 * (1 - up); lean = .06; }
    R.hipL.rotation.x = hL; R.hipR.rotation.x = hR; R.knL.rotation.x = kL; R.knR.rotation.x = kR; R.anL.rotation.x = aL; R.anR.rotation.x = aR;
    R.shL.rotation.set(sL, 0, zL); R.shR.rotation.set(sR, 0, zR); R.elL.rotation.x = eL; R.elR.rotation.x = eR;
    R.spine.rotation.set(lean, tw, 0); R.spine.scale.y = 1 + Math.sin(t * 1.7 + sd) * .012 * still;
    R.hd.rotation.set(hx, hy - tw * .8, 0); R.root.position.set(sway, bob, 0);
  }
  // aggiorna la posa dalle velocità reali (passo legato allo spazio percorso)
  function rigTick(o, t, dt) {
    const R = o.userData.rig; if (!R) return; const p = o.position;
    if (!R.lp) R.lp = p.clone(); const d = Math.hypot(p.x - R.lp.x, p.z - R.lp.z); R.lp.copy(p);
    const v = dt > 0 ? d / dt : 0; R.amp += (clamp(v / 1.15, 0, 1) - R.amp) * Math.min(1, dt * 7); R.ph += d / 1.35 * Math.PI * 2;
    poseP(R, t);
  }
  // passeggiata tra due punti: si ferma, si guarda intorno, si gira con calma e riparte
  function strollTick(m, t, dt) {
    const o = m.o; if (!m.st) { m.st = { a: m.a, b: m.b, u: 0, w: rr() * 2 }; o.position.x = m.a.x; o.position.z = m.a.z; }
    const S = m.st, d = Math.max(.5, Math.hypot(S.b.x - S.a.x, S.b.z - S.a.z)), hd = Math.atan2(S.b.x - S.a.x, S.b.z - S.a.z), df = angD(hd, o.rotation.y);
    if (S.w > 0) { S.w -= dt; if (S.w < .9) o.rotation.y += df * Math.min(1, dt * 3.2); return; }
    if (Math.abs(df) > .25) { o.rotation.y += Math.sign(df) * Math.min(Math.abs(df), dt * 3); return; }
    o.rotation.y += df * Math.min(1, dt * 5);
    S.u = Math.min(1, S.u + dt * 1.05 / (d * 1.18)); const u = S.u, e = u * u * u * (u * (u * 6 - 15) + 10);
    o.position.x = S.a.x + (S.b.x - S.a.x) * e; o.position.z = S.a.z + (S.b.z - S.a.z) * e;
    if (u >= 1) { m.st = { a: S.b, b: S.a, u: 0, w: 1.4 + rr() * 2.6 }; }
  }

  // carrello elevatore frontale: telaio, contrappeso, tettuccio, montante a sfilo, piastra, forche, catene, ruote sterzanti
  function sideG(key, pts, depth, bev) {
    if (G[key]) return G[key];
    const sh = new T.Shape(); pts.forEach((p, i) => { if (p.q) sh.quadraticCurveTo(p.q[0], p.q[1], p[0], p[1]); else if (i) sh.lineTo(p[0], p[1]); else sh.moveTo(p[0], p[1]); });
    const ge = new T.ExtrudeGeometry(sh, { depth: depth - bev * 2, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 10 });
    ge.rotateY(-Math.PI / 2); ge.translate((depth - bev * 2) / 2, 0, 0); ge.computeVertexNormals(); return (G[key] = ge);
  }
  let fkN = 0;
  function forklift(p, x, z, o) {
    o = o || {};
    const g = new T.Group(); g.position.set(x, .5, z); p.add(g);
    const OR = mat(0xf47b20), DK = mat(0x2b2f35), BK = mat(0x17191c), GR = mat(0x8e959e), LG = mat(0xc5cad1), ST = mat(0x3a3f46), SEAT = mat(0x26292d);
    partS(G.box, DK, 0, .34, -.25, g, [.98, .3, 1.9]);
    partS(sideG('fkSide', [[-.78, .42], [.66, .42], [.66, .7], [.1, .7], [-.03, .99], [-.72, .99], [-.79, .9]], 1.04, .035), OR, 0, 0, 0, g);
    partS(sideG('fkCW', [[-1.33, .17], [-.72, .17], [-.72, 1.07], [-1.06, 1.07], Object.assign([-1.33, .8], { q: [-1.33, 1.07] })], 1.1, .05), ST, 0, 0, 0, g);
    for (let i = 0; i < 5; i++) partS(G.box, BK, 0, 1.03, -.62 + i * .09, g, [.56, .012, .035], null, 1);
    partS(G.box, mat(0x1d1f22), 0, .748, .37, g, [.9, .024, .54], null, 1); for (let i = 0; i < 5; i++) partS(G.box, mat(0x2b2f35), 0, .766, .16 + i * .1, g, [.86, .012, .025], null, 1);
    partS(G.box, SEAT, 0, 1.1, -.42, g, [.52, .11, .46]); partS(G.box, SEAT, 0, 1.39, -.67, g, [.5, .5, .1], [-.14, 0, 0]); partS(G.box, SEAT, 0, 1.66, -.71, g, [.3, .12, .09], [-.14, 0, 0]);
    for (const s of [-1, 1]) partS(G.box, SEAT, s * .29, 1.22, -.42, g, [.05, .06, .34]);
    partS(G.box, mat(0xf47b20), .17, 1.36, -.6, g, [.05, .48, .012], [-.14, 0, 0], 1);
    partS(G.box, DK, 0, .95, .6, g, [.88, .48, .14], [.2, 0, 0]);
    partS(G.box, new T.MeshBasicMaterial({ color: 0x8fe0b4 }), .14, 1.15, .508, g, [.16, .08, .012], [.2, 0, 0], 1);
    partS(G.cyl, DK, 0, 1.2, .43, g, [.07, .42, .07], [.8, 0, 0]);
    const stw = grp(g, 0, 1.37, .28); stw.rotation.x = -.85; const spin = grp(stw, 0, 0, 0); partS(torG(), BK, 0, 0, 0, spin, null, [Math.PI / 2, 0, 0]); partS(G.box, BK, 0, 0, 0, spin, [.3, .02, .03]); partS(G.sph, mat(0xd62b1f), .13, .03, 0, spin, [.05, .06, .05]);
    for (let i = 0; i < 3; i++) { partS(G.cyl, BK, .3 + i * .05, 1.08, .5, g, [.018, .26, .018], [-.35, 0, 0]); partS(G.sph, mat([0xd62b1f, 0x2f6db4, 0x2b2f35][i]), .3 + i * .05, 1.2, .46, g, [.045, .045, .045]); }
    // tettuccio di protezione
    for (const s of [-1, 1]) { partS(G.box, DK, s * .47, 1.6, -.82, g, [.07, 1.24, .07]); partS(G.box, DK, s * .47, 1.47, .53, g, [.07, 1.52, .07], [-.08, 0, 0]); partS(G.box, DK, s * .47, 2.23, -.14, g, [.07, .07, 1.5]); }
    for (const zz of [-.84, .5]) partS(G.box, DK, 0, 2.23, zz, g, [1.0, .07, .07]);
    for (let i = 0; i < 6; i++) partS(G.box, DK, 0, 2.23, -.66 + i * .2, g, [.92, .025, .045]);
    for (const s of [-1, 1]) { partS(G.box, DK, s * .4, 2.17, .52, g, [.14, .1, .08]); partS(G.box, new T.MeshBasicMaterial({ color: 0xfff6dc }), s * .4, 2.17, .565, g, [.1, .06, .01], null, 1); }
    // luci posteriori, bande di sicurezza, numero
    for (const s of [-1, 1]) { partS(G.box, new T.MeshBasicMaterial({ color: 0xd8261c }), s * .38, .9, -1.395, g, [.1, .08, .03], null, 1); partS(G.box, new T.MeshBasicMaterial({ color: 0xf6f6f0 }), s * .25, .9, -1.395, g, [.07, .06, .03], null, 1); }
    partS(G.box, M.haz, 0, .3, -1.397, g, [.92, .14, .03], null, 1);
    const num = String(++fkN).padStart(2, '0'); planeT(textTex([[num, 74, 800, 50, null, '#fff']], { bg: '#1d1f22', w: 128, h: 100, round: 14 }), .2, .16, g, 0, .6, -1.415, { ry: Math.PI });
    for (const s of [-1, 1]) planeT(textTex([['C' + num, 60, 800, 50, null, '#fff']], { w: 160, h: 100 }), .26, .16, g, s * .538, .82, -.35, { ry: s * Math.PI / 2 });
    // ruote
    const wf = [-1, 1].map(s => { const w = grp(g, s * .5, .3, .42); partS(G.cyl, BK, 0, 0, 0, w, [.6, .24, .6], [0, 0, Math.PI / 2]); partS(G.cyl, LG, s * .122, 0, 0, w, [.34, .01, .34], [0, 0, Math.PI / 2], 1); for (let k = 0; k < 5; k++) { const a2 = k / 5 * Math.PI * 2; partS(G.cyl, DK, s * .133, Math.cos(a2) * .08, Math.sin(a2) * .08, w, [.035, .014, .035], [0, 0, Math.PI / 2], 1); } for (let k = 0; k < 10; k++) { const a2 = k / 10 * Math.PI * 2; partS(G.box, mat(0x232528), 0, Math.cos(a2) * .305, Math.sin(a2) * .305, w, [.2, .03, .05], [a2, 0, 0], 1); } return w; });
    const rs = [-1, 1].map(s => { const st = grp(g, s * .4, .23, -.98); const w = grp(st, 0, 0, 0); partS(G.cyl, BK, 0, 0, 0, w, [.46, .18, .46], [0, 0, Math.PI / 2]); partS(G.cyl, LG, s * .092, 0, 0, w, [.24, .01, .24], [0, 0, Math.PI / 2], 1); return { st, w }; });
    for (const s of [-1, 1]) partS(G.box, OR, s * .57, .67, .42, g, [.14, .035, .66], null, 1);
    // montante
    const mast = grp(g, 0, .12, .8);
    for (const s of [-1, 1]) { partS(G.box, GR, s * .33, 1.25, 0, mast, [.08, 2.5, .13]); partS(G.box, mat(0x6f7680), s * .29, 1.25, 0, mast, [.02, 2.5, .09], null, 1); }
    partS(G.box, GR, 0, .15, -.03, mast, [.74, .1, .08]); partS(G.box, GR, 0, 2.46, -.03, mast, [.74, .08, .08]); partS(G.box, GR, 0, 1.3, -.06, mast, [.62, .06, .05]);
    partS(G.cyl, LG, 0, .95, -.12, mast, [.09, 1.7, .09]); partS(G.cyl, mat(0xdfe3e6), 0, 1.95, -.12, mast, [.05, .4, .05]);
    for (const s of [-1, 1]) partS(G.cyl, BK, s * .16, .7, -.12, mast, [.025, 1.0, .025], [.0, 0, 0]);
    const inner = grp(mast, 0, 0, .05);
    for (const s of [-1, 1]) partS(G.box, mat(0xa3aab2), s * .25, 1.2, 0, inner, [.06, 2.36, .1]);
    partS(G.box, mat(0xa3aab2), 0, 2.36, 0, inner, [.56, .07, .07]); for (const s of [-1, 1]) partS(G.cyl, DK, s * .12, 2.3, .07, inner, [.13, .045, .13], [0, 0, Math.PI / 2]);
    const carr = grp(mast, 0, 0, .14);
    partS(G.box, DK, 0, .3, 0, carr, [.84, .36, .06]); partS(G.box, M.haz, 0, .41, .042, carr, [.8, .06, .014], null, 1);
    for (const yy of [.5, 1.06]) partS(G.box, DK, 0, yy, -.01, carr, [.84, .04, .04]);
    for (let i = -3; i <= 3; i++) partS(G.box, DK, i * .13, .79, -.01, carr, [.022, .56, .022]);
    for (const s of [-1, 1]) { partS(G.box, DK, s * .41, .79, -.01, carr, [.035, .56, .035]); partS(G.box, ST, s * .22, .3, .055, carr, [.1, .56, .05]); partS(G.box, ST, s * .22, .045, .66, carr, [.1, .045, 1.15]); }
    const chains = [-1, 1].map(s => part(G.box, BK, s * .12, 1, .02, mast, [.03, 1, .02], null, 1));
    const load = grp(carr, 0, -.005, .66); const LB = new Batch(load); palletStack(LB, 0, 0, 0, .65 + rr() * .35, PAL[Math.floor(rr() * PAL.length)], 3, null); LB.flush(); load.visible = false;
    // lampeggiante arancione e faretto blu a terra
    partS(G.cyl, BK, -.32, 2.29, -.72, g, [.12, .05, .12]);
    const bmat = new T.MeshBasicMaterial({ color: 0xffa020 }); OWN.push(bmat); partS(G.cyl, bmat, -.32, 2.36, -.72, g, [.1, .1, .1], null, 1); partS(G.sph, bmat, -.32, 2.41, -.72, g, [.1, .07, .1], null, 1);
    const glow = new T.Sprite(new T.SpriteMaterial({ map: radTex('glowA', 'rgba(255,190,80,1)', 'rgba(255,140,20,.35)'), transparent: true, depthWrite: false, blending: T.AdditiveBlending })); glow.position.set(-.32, 2.38, -.72); glow.scale.set(.9, .9, 1); g.add(glow); OWN.push(glow.material);
    const spM = new T.MeshBasicMaterial({ map: radTex('spotB', 'rgba(90,170,255,1)', 'rgba(40,110,255,.45)'), transparent: true, depthWrite: false, blending: T.AdditiveBlending }); OWN.push(spM);
    const spot = part(G.plane, spM, 0, .1, 3.3, g, [.9, .9, 1], [-Math.PI / 2, 0, 0], 1); spot.castShadow = false;
    partS(G.plane, blobMat(), 0, .095, -.2, g, [1.7, 2.9, 1], [-Math.PI / 2, 0, 0], 1).castShadow = false;
    const drv = person(g, 0, -.4, 0xf47b20, 0xf2c418, { mode: 'drive' }); drv.position.y = .28; drv.userData.rig.blob.visible = false;
    const big = new Set(); g.children.slice(0, 3).forEach(e => big.add(e)); g.traverse(e => { if (e.isMesh) { e.receiveShadow = false; e.castShadow = big.has(e); } }); [mast.children[0], mast.children[2]].forEach(e => { if (e) e.castShadow = true; });
    g.userData.fk = { mast, inner, carr, chains, load, wf, rs, spin, bmat, glow, spot, spM, drv: drv.userData.rig, f: .1, tilt: 0, steer: 0, rev: 0, revS: 0, ds: 0, v: 0 };
    return g;
  }
  function fkUpdate(F, t, dt) {
    const h = F.f - .19; F.carr.position.y = h; F.inner.position.y = Math.max(0, h - 1.05); F.mast.rotation.x = F.tilt;
    const top = 2.3 + F.inner.position.y, cb = h + .48; F.chains.forEach(c => { const L2 = Math.max(.05, top - cb); c.scale.y = L2; c.position.y = cb + L2 / 2; });
    F.wf.forEach(w => { w.rotation.x += F.ds / .3; }); F.rs.forEach(r => { r.w.rotation.x += F.ds / .23; r.st.rotation.y = -F.steer; }); F.spin.rotation.y = F.steer * 2.2; F.ds = 0;
    const fl = Math.pow(Math.max(0, Math.sin(t * 7.5)), 3); F.bmat.color.setRGB(1, .45 + fl * .35, .08 + fl * .1); F.glow.material.opacity = .25 + fl * .75; F.glow.scale.setScalar(.6 + fl * .7);
    F.revS += (F.rev - F.revS) * Math.min(1, dt * 4); F.spot.position.z = F.rev ? -2.6 : 3.3; F.spM.opacity = .55 + Math.sin(t * 5) * .15;
    const R = F.drv; R.steer += (F.steer - R.steer) * Math.min(1, dt * 6); R.look = F.revS; R.vib = 1; poseP(R, t);
  }
  // muletto guidato da una sequenza: vai, girati, alza/abbassa, carica/scarica, attendi
  function fkTick(m, t, dt) {
    const o = m.o, F = o.userData.fk; let S = m.st;
    if (!S) { const s = m.steps[m.i]; S = m.st = { s, u: 0 };
      if (s.t === 'go') { S.from = o.position.clone(); S.to = new T.Vector3(s.x, o.position.y, s.z); S.d = S.from.distanceTo(S.to); S.h = S.d > .02 ? Math.atan2(S.to.x - S.from.x, S.to.z - S.from.z) + (s.rev ? Math.PI : 0) : o.rotation.y; S.dur = S.d / (s.v || (s.rev ? 1.1 : 1.9)) + .8; }
      if (s.t === 'turn') S.h = s.h;
      if (s.t === 'lift') { S.f0 = F.f; S.dur = Math.abs(s.f - F.f) / .55 + .35; }
      if (s.t === 'tilt') { S.a0 = F.tilt; S.dur = .55; }
      if (s.t === 'wait') S.dur = s.s;
    }
    const s = S.s; let done = false;
    if (s.t === 'go' || s.t === 'turn') {
      F.rev = s.t === 'go' && s.rev ? 1 : 0;
      if (!S.ok) { const df = angD(S.h, o.rotation.y), st2 = Math.sign(df) * Math.min(Math.abs(df), dt * 1.3); o.rotation.y += st2; F.ds += Math.abs(st2) * .45; F.steer += ((Math.abs(df) > .015 ? Math.sign(df) * .7 : 0) - F.steer) * Math.min(1, dt * 7); if (Math.abs(df) < .012) { S.ok = 1; o.rotation.y = S.h; if (s.t === 'turn') done = true; } }
      else { S.u = Math.min(1, S.u + dt / S.dur); const e = ease(S.u), px = o.position.x, pz = o.position.z; o.position.lerpVectors(S.from, S.to, e); const ds = Math.hypot(o.position.x - px, o.position.z - pz); F.ds += ds * (s.rev ? -1 : 1); F.steer *= 1 - Math.min(1, dt * 5); F.tilt += ((F.load.visible ? -.05 : 0) - F.tilt) * Math.min(1, dt * 2); if (S.u >= 1) done = true; }
    } else if (s.t === 'lift') { S.u = Math.min(1, S.u + dt / S.dur); F.f = S.f0 + (s.f - S.f0) * ease(S.u); if (S.u >= 1) done = true; }
    else if (s.t === 'tilt') { S.u = Math.min(1, S.u + dt / S.dur); F.tilt = S.a0 + (s.a - S.a0) * ease(S.u); if (S.u >= 1) done = true; }
    else if (s.t === 'load') {
      if (s.drop && F.load.visible) { const v = new T.Vector3(); F.load.getWorldPosition(v); const par = s.drop.parent; par.worldToLocal(v); s.drop.position.set(v.x, .5, v.z); s.drop.rotation.y = o.rotation.y; s.drop.visible = true; }
      if (s.pick) s.pick.visible = false; F.load.visible = s.on; done = true;
    } else if (s.t === 'wait') { S.u = Math.min(1, S.u + dt / S.dur); if (S.u >= 1) done = true; }
    if (done) { m.i = (m.i + 1) % m.steps.length; m.st = null; }
    fkUpdate(F, t, dt);
  }
  function stagePallet(par) { const sg = new T.Group(); par.add(sg); const B = new Batch(sg); palletStack(B, 0, 0, 0, .8, PAL[Math.floor(rr() * PAL.length)], 3, null); B.flush(); sg.visible = false; return sg; }
  // giro di lavoro lungo uno scaffale portapallet: preleva da un vano, posa a fine corsia, riprende e mette a scaffale
  function rackForkSteps(it, g) {
    g.updateMatrixWorld(); const len = rackLen(it), dep = rackDep(it), th = it.r * Math.PI / 2, bw = it.bw || KIND.pallet.bw;
    const W2 = (x, z) => g.localToWorld(new T.Vector3(x, 0, z)), za = dep / 2 + 2.1, zi = 1.62, face = th + Math.PI;
    const bayX = b => -len / 2 + b * bw + bw / 2, lvF = l => (l === 0 ? .5 : .6 + l * rackLh(it)) - .5;
    const lvs = []; for (let l = 0; l < it.lv; l++) if (lvF(l) + .22 < 3.45) lvs.push(l);
    const st = stagePallet(WH), steps = [], go = (x, z, rev, v) => { const p = W2(x, z); steps.push({ t: 'go', x: p.x, z: p.z, rev, v }); };
    for (let k = 0; k < 3; k++) {
      const b1 = Math.floor(rr() * it.bays), b2 = Math.floor(rr() * it.bays), l1 = lvs[Math.floor(rr() * lvs.length)], l2 = lvs[Math.floor(rr() * lvs.length)], sgn = k % 2 ? -1 : 1, ex = sgn * (len / 2 - 2.35);
      go(bayX(b1), za); steps.push({ t: 'turn', h: face }, { t: 'lift', f: lvF(l1) + .07 }); go(bayX(b1), zi, false, .55); steps.push({ t: 'lift', f: lvF(l1) + .2 }, { t: 'load', on: true }); go(bayX(b1), za, true, .55);
      steps.push({ t: 'lift', f: .26 }); go(ex, za); steps.push({ t: 'lift', f: .07 }, { t: 'load', on: false, drop: st }); go(ex - sgn * 1.9, za, true, .7); steps.push({ t: 'lift', f: .1 }, { t: 'wait', s: 1.2 + rr() * 1.5 });
      go(ex, za, false, .6); steps.push({ t: 'lift', f: .22 }, { t: 'load', on: true, pick: st }); go(bayX(b2), za, true);
      steps.push({ t: 'turn', h: face }, { t: 'lift', f: lvF(l2) + .2 }); go(bayX(b2), zi, false, .55); steps.push({ t: 'lift', f: lvF(l2) + .06 }, { t: 'load', on: false }); go(bayX(b2), za, true, .55); steps.push({ t: 'lift', f: .1 });
    }
    return steps;
  }
  // transpallet manuale: forche con rulli, pompa idraulica, timone con impugnatura
  function palletJack(par) {
    const j = new T.Group(); par.add(j); const OR = mat(0xf47b20), DK = mat(0x2b2f35), BK = mat(0x17191c), LG = mat(0xc5cad1);
    for (const s of [-1, 1]) { partS(G.box, OR, s * .2, .55, .45, j, [.16, .07, 1.15]); partS(G.box, DK, s * .2, .515, .45, j, [.13, .02, 1.1], null, 1); partS(G.cyl, BK, s * .2, .535, .98, j, [.07, .1, .07], [0, 0, Math.PI / 2]); partS(G.cyl, BK, s * .2, .535, .86, j, [.07, .1, .07], [0, 0, Math.PI / 2]); }
    partS(G.box, OR, 0, .62, -.16, j, [.56, .2, .16]); partS(G.cyl, LG, 0, .8, -.18, j, [.09, .34, .09]); partS(G.cyl, DK, 0, .99, -.18, j, [.12, .05, .12]);
    for (const s of [-1, 1]) partS(G.cyl, BK, s * .07, .58, -.22, j, [.16, .06, .16], [0, 0, Math.PI / 2]);
    const tl = grp(j, 0, .74, -.2); tl.rotation.x = -.6; partS(G.cyl, DK, 0, .47, 0, tl, [.04, .94, .04]); partS(G.box, DK, 0, .95, 0, tl, [.34, .045, .045]); for (const s of [-1, 1]) partS(G.box, DK, s * .16, .85, 0, tl, [.04, .22, .04]); partS(G.box, mat(0xd62b1f), .07, .8, .025, tl, [.05, .09, .03]); partS(G.box, BK, 0, .95, 0, tl, [.22, .06, .06]);
    j.traverse(e => { if (e.isMesh) e.receiveShadow = false; });
    return j;
  }

  /* ---------------- uffici: clienti e fornitori (v282) ---------------- */
  let OFF = null, OFT = 'cli';
  const fkey = s => (C.fornKey ? C.fornKey(s) : String(s || '').toLowerCase().replace(/\b(s\.?r\.?l\.?s?|s\.?p\.?a\.?|s\.?n\.?c\.?|s\.?a\.?s\.?)\b/g, '').replace(/[^a-z0-9]/g, ''));
  const isPaid = f => String(f.stato || '').toLowerCase() === 'pagata';
  const dBack = n => { const d = new Date(C.today() + 'T12:00:00'); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
  const OST = { ok: [0x2a8a4a, 0xe4f2e7, '#2a8a4a'], open: [0xe9a23b, 0xfdf0da, '#d98a1c'], late: [0xd9452f, 0xfbe2dc, '#d9452f'], none: [0x9aa0a8, 0xefeeeb, '#9aa0a8'] };
  const stTxt = (e) => e.st === 'late' ? 'Scaduto' : e.st === 'open' ? (e.kd === 'cli' ? 'Da incassare' : 'Da pagare') : e.st === 'ok' ? 'In regola' : '';
  const initials = s => String(s || '?').replace(/\b(s\.?r\.?l\.?s?|s\.?p\.?a\.?|s\.?n\.?c\.?)\b/gi, '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';
  const hexC = c => '#' + new T.Color(c).getHexString();
  function offData() {
    const td = C.today(), y1 = dBack(365), V = C.fv ? C.fv() : [], amt = f => C.num(f.imponibile) || C.num(f.totale), srtD = (a, b) => String(b.data).localeCompare(String(a.data));
    const months = []; for (let i = 11; i >= 0; i--) { const d = new Date(td + 'T12:00:00'); d.setDate(1); d.setMonth(d.getMonth() - i); months.push(d.toISOString().slice(0, 7)); }
    const series = L2 => months.map(m => L2.filter(f => String(f.data).slice(0, 7) === m).reduce((s, f) => s + amt(f), 0));
    const fin = (e, docs) => { const f12 = docs.filter(f => String(f.data) >= y1), op = docs.filter(f => !isPaid(f)), sc = op.filter(f => f.scadenza && String(f.scadenza) < td);
      Object.assign(e, { docs: docs.slice().sort(srtD), tot: f12.reduce((s, f) => s + amt(f), 0), open: op.reduce((s, f) => s + C.num(f.totale), 0), nOpen: op.length, late: sc.reduce((s, f) => s + C.num(f.totale), 0), nLate: sc.length, ser: series(f12) });
      e.st = e.nLate ? 'late' : e.nOpen ? 'open' : (docs.length || e.act) ? 'ok' : 'none'; e.col = PAL[hashS(e.name) % PAL.length]; return e; };
    const CL = (D.cli || []).map(c => { const dd = D.ddt.filter(x => x.d.cliente === c.id), e = { kd: 'cli', id: String(c.id), name: c.nome || 'Cliente', o: c, city: [c.citta, c.prov && '(' + c.prov + ')'].filter(Boolean).join(' '), ddt: dd, pz: dd.reduce((s, x) => s + (x.pz || 0), 0), act: dd.length };
      fin(e, V.filter(f => f.cliente === c.id)); e.last = [dd[0] && String(dd[0].d.data), e.docs[0] && String(e.docs[0].data)].filter(Boolean).sort().pop() || ''; return e; });
    const FA = C.fatF ? C.fatF() : [], FO = C.forn ? C.forn() : [], nm = new Map();
    FO.forEach(f => { const k = fkey(f.nome); if (k && !nm.has(k)) nm.set(k, { o: f, name: f.nome }); });
    FA.forEach(f => { const k = fkey(f.fornitore); if (k && !nm.has(k)) nm.set(k, { o: null, name: f.fornitore }); });
    D.arts.forEach(x => { const k = fkey(x.a.fornitore); if (k && !nm.has(k)) nm.set(k, { o: null, name: String(x.a.fornitore).trim() }); });
    const FR = [...nm.entries()].map(([k, n]) => { const rc = D.rcv.filter(r => fkey(r.sup) === k), ar = D.arts.filter(x => fkey(x.a.fornitore) === k), o = n.o;
      const e = { kd: 'for', id: o ? String(o.id) : 'k:' + k, key: k, name: n.name, o, city: o ? [o.citta, o.prov && '(' + o.prov + ')'].filter(Boolean).join(' ') : '', cat: (o && o.categoria) || '', rcv: rc, arts: ar, act: rc.length + ar.length };
      fin(e, FA.filter(f => fkey(f.fornitore) === k)); e.last = [rc[0] && rc[0].data, e.docs[0] && String(e.docs[0].data)].filter(Boolean).sort().pop() || ''; return e; });
    const rank = (a, b) => (b.tot - a.tot) || (b.open - a.open) || String(b.last).localeCompare(String(a.last)) || a.name.localeCompare(b.name);
    CL.sort(rank); FR.sort(rank);
    return { CL, FR, months };
  }
  const offFind = (kd, id) => OFF && (kd === 'cli' ? OFF.OD.CL : OFF.OD.FR).find(e => e.id === String(id));
  function roomSign(e, code) {
    const st = e ? OST[e.st] : OST.none, nm = e ? e.name : 'Ufficio libero', sub = e ? [code, stTxt(e), e.st === 'late' ? C.eur0(e.late) : e.st === 'open' ? C.eur0(e.open) : e.tot ? C.eur0(e.tot) + ' in 12 mesi' : ''].filter(Boolean).join(' · ') : code;
    const t = cvTex(512, 112, (gx, w, h) => { gx.fillStyle = e ? '#ffffff' : '#f4f3f0'; gx.beginPath(); gx.roundRect(0, 0, w, h, 18); gx.fill(); gx.fillStyle = st[2]; gx.beginPath(); gx.roundRect(0, 0, 14, h, [18, 0, 0, 18]); gx.fill();
      if (e) { gx.fillStyle = hexC(e.col); gx.beginPath(); gx.arc(62, h / 2, 30, 0, Math.PI * 2); gx.fill(); gx.fillStyle = '#16181b'; gx.font = '800 24px Inter, system-ui, sans-serif'; gx.textAlign = 'center'; gx.textBaseline = 'middle'; gx.fillText(initials(nm), 62, h / 2 + 1); }
      const x0 = e ? 108 : 34; gx.textAlign = 'left'; gx.textBaseline = 'middle'; let fs = 34; gx.font = `800 ${fs}px Inter, system-ui, sans-serif`; while (fs > 22 && gx.measureText(nm).width > w - x0 - 20) { fs -= 2; gx.font = `800 ${fs}px Inter, system-ui, sans-serif`; }
      let n2 = nm; while (gx.measureText(n2).width > w - x0 - 20 && n2.length > 3) n2 = n2.slice(0, -2); if (n2 !== nm) n2 += '…';
      gx.fillStyle = e ? '#16181b' : '#9a9ca1'; gx.fillText(n2, x0, 42); gx.font = '600 21px Inter, system-ui, sans-serif'; gx.fillStyle = e ? st[2] : '#b0b2b6'; gx.fillText(sub, x0, 82); });
    OWN.push(t); return t;
  }
  function buildOffice() {
    const hw = L.W / 2, hd = L.D / 2, ox = hw * .5, oz = hd + 13, BW = 30, BD = 13, FH = 3.6, OD = offData();
    const g = new T.Group(); g.position.set(ox, 0, oz); WH.add(g); ACC = null;
    const FM = [], fm = (c, o) => { const m = new T.MeshLambertMaterial({ color: c, transparent: true, opacity: o == null ? 1 : o }); m.userData.o0 = m.opacity; FM.push(m); OWN.push(m); return m; };
    const glassF = fm(0x7f9db6, .92), frameF = fm(0xf7f7f5), darkF = fm(0x2b2f35), orF = fm(0xf47b20), roofF = fm(0xeeeeec), pvF = fm(0x27416e);
    // basamento, piazza d'ingresso, totem
    bxS(g, BW + .8, .14, BD + .8, 0x3a3f46, 0, 0, 0, { ns: 1 }); bxS(g, BW, .12, BD, 0xe7e5e0, 0, .12, 0, { ns: 1 });
    bxS(g, 14, .1, 5, 0xdcd8d0, 0, 0, BD / 2 + 2.9, { ns: 1 }); for (let i = 0; i < 6; i++) bxS(g, .1, .012, 4.6, 0xc9c4bb, -6 + i * 2.4, .1, BD / 2 + 2.9, { ns: 1 });
    for (const s of [-1, 1]) { bxS(g, 2.6, .45, .7, 0x8a8d93, s * 5.6, .1, BD / 2 + 4.3); bxS(g, 2.6, .07, .7, 0xc8a27a, s * 5.6, .55, BD / 2 + 4.3, { ns: 1 }); }
    bxS(g, 1.1, 2.6, .3, 0x1d1f22, 8.6, .1, BD / 2 + 4.4);
    planeT(textTex([['UFFICI', 30, 800, 38, null, '#f47b20'], [`${OD.CL.length} clienti`, 28, 700, 86, null, '#fff'], [`${OD.FR.length} fornitori`, 28, 700, 124, null, '#fff']], { bg: '#1d1f22', w: 200, h: 170, round: 10 }), .95, .8, g, 8.6, 1.9, BD / 2 + 4.56);
    // ---- interni (si vedono quando l'edificio si apre)
    const inner = grp(g, 0, 0, 0); inner.visible = false;
    const f0 = grp(inner, 0, .24, 0), f1 = grp(inner, 0, .24 + FH, 0);
    const rooms = [], people = [], maxP = Q && Q.tier === 0 ? 4 : Q && Q.tier === 1 ? 8 : 14;
    const glassI = new T.MeshLambertMaterial({ color: 0xc9dceb, transparent: true, opacity: .26, depthWrite: false }); OWN.push(glassI);
    const floorG = (fg, lvl) => {
      const B = new Batch(fg);
      if (lvl) { bxS(fg, BW, .22, BD, 0xdcdad5, 0, -.22, 0); bxS(fg, BW + .02, .06, BD + .02, 0xf47b20, 0, -.08, 0, { ns: 1 }); }
      bxS(fg, BW - .3, .02, BD - .3, lvl ? 0xf3f1ec : 0xefece6, 0, .0, 0, { ns: 1 });
      bxS(fg, BW - .4, .012, 2.4, 0xdedad2, 0, .02, -.3, { ns: 1 });
      // ali: clienti a sinistra, fornitori a destra
      for (const [x0, t, c] of [[-9, 'CLIENTI', 'rgba(244,123,32,.55)'], [9, 'FORNITORI', 'rgba(47,109,180,.5)']]) { const tx = textTex([[t, 70, 800, 60, null, c]], { w: 512, h: 120 }); const p = planeT(tx, 5.2, 1.2, fg, x0, .04, -.3, {}); p.rotation.x = -Math.PI / 2; }
      // uffici: 3 per fila, 2 file per ala
      const RS = [[-13, -3.95, 4.7], [-9, -3.95, 4.7], [-5, -3.95, 4.7], [-13, 3.65, 5.3], [-9, 3.65, 5.3], [-5, 3.65, 5.3]];
      for (const kd of ['cli', 'for']) RS.forEach(([x1, z, d], i) => {
        const x = kd === 'cli' ? x1 : -x1, w = 4, list = kd === 'cli' ? OD.CL : OD.FR, idx = lvl * 6 + i, e = list[idx] || null, code = (kd === 'cli' ? 'C' : 'F') + lvl + '-' + String(i + 1).padStart(2, '0'), st = e ? OST[e.st] : OST.none;
        B.add('rfl', G.box, mat(0xffffff), m4(x, .035, z, w - .14, .02, d - .14), st[1]);
        B.add('rst', G.box, mat(0xffffff), m4(x, .058, z + (z < 0 ? d / 2 - .16 : -d / 2 + .16), w - .3, .01, .12), st[0]);
        // pareti in vetro con profili scuri
        for (const sz of [-1, 1]) { B.add('gw', G.box, glassI, m4(x, 1.4, z + sz * d / 2, w, 2.7, .05)); B.add('gr', G.box, mat(0x2b2f35), m4(x, 2.76, z + sz * d / 2, w, .06, .08)); }
        for (const sx of [-1, 1]) { if (sx > 0 && !((kd === 'cli' && x1 === -5) || (kd === 'for' && x === 13))) continue; B.add('gw', G.box, glassI, m4(x + sx * w / 2, 1.4, z, .05, 2.7, d)); B.add('gr', G.box, mat(0x2b2f35), m4(x + sx * w / 2, 2.76, z, .08, .06, d)); B.add('gp', G.box, mat(0x2b2f35), m4(x + sx * w / 2, 1.4, z + d / 2 - .04, .07, 2.8, .07)); B.add('gp', G.box, mat(0x2b2f35), m4(x + sx * w / 2, 1.4, z - d / 2 + .04, .07, 2.8, .07)); }
        const cz = z < 0 ? z + d / 2 : z - d / 2; B.add('door', G.box, mat(0x2b2f35), m4(x + w / 2 - .7, 1.1, cz, .05, 2.2, .1)); B.add('door', G.box, mat(0x2b2f35), m4(x + w / 2 - 1.65, 1.1, cz, .05, 2.2, .1));
        // arredo: scrivania, sedia, monitor, armadio, pianta, tavolino
        const dz = z < 0 ? z - d / 2 + 1.0 : z + d / 2 - 1.0, fz = z < 0 ? 1 : -1;
        B.add('desk', G.box, mat(0xfafafa), m4(x - .3, .76, dz, 1.8, .05, .8)); for (const sx of [-.82, .82]) B.add('dleg', G.box, mat(0x8e959e), m4(x - .3 + sx, .38, dz, .05, .74, .7));
        B.add('mon', G.box, mat(0x1d1f22), m4(x - .3, 1.08, dz - fz * .25, .62, .38, .03)); B.add('scr', G.box, new T.MeshBasicMaterial({ color: 0x9fc9e8 }), m4(x - .3, 1.08, dz - fz * .23, .56, .32, .01)); B.add('mst', G.box, mat(0x1d1f22), m4(x - .3, .86, dz - fz * .25, .05, .2, .05));
        const hasP = e && people.length < maxP;
        if (!hasP) B.add('chs', G.box, mat(0xffffff), m4(x - .3, .5, dz + fz * .55, .5, .08, .5), e ? e.col : 0x9aa0a8); if (!hasP) B.add('chb', G.box, mat(0xffffff), m4(x - .3, .82, dz + fz * .78, .5, .55, .07), e ? e.col : 0x9aa0a8); if (!hasP) B.add('chl', G.cyl, mat(0x2b2f35), m4(x - .3, .25, dz + fz * .55, .06, .46, .06));
        B.add('cab', G.box, mat(0xeceae6), m4(x - w / 2 + .35, .6, z, .5, 1.2, 1.6)); B.add('cabs', G.box, mat(0xffffff), m4(x - w / 2 + .61, .6, z, .02, 1.1, 1.5), e ? e.col : 0xd8d6d1);
        B.add('pot', G.cyl, mat(0xc9c4bb), m4(x + w / 2 - .45, .3, z - fz * (d / 2 - .5), .38, .6, .38)); B.add('leaf', G.sph, mat(0x5e9e4a), m4(x + w / 2 - .45, 1.0, z - fz * (d / 2 - .5), .7, .9, .7));
        B.add('tab', G.cyl, mat(0xfafafa), m4(x + .9, .72, z - fz * .5, .9, .04, .9)); B.add('tabl', G.cyl, mat(0x8e959e), m4(x + .9, .36, z - fz * .5, .06, .7, .06));
        for (const a of [0, 2.1, 4.2]) B.add('stool', G.cyl, mat(0xffffff), m4(x + .9 + Math.sin(a) * .7, .45, z - fz * .5 + Math.cos(a) * .7, .36, .08, .36), e ? mixC(e.col, 0xffffff, .3) : 0xd8d6d1);
        // cartello sopra l'ufficio
        const sg = planeT(roomSign(e, code), 3.5, .77, fg, x, 3.12, z + d / 2 + .06, {}); sg.renderOrder = 2;
        if (hasP) { const p = person(fg, x - .3, dz + fz * .62, kd === 'cli' ? 0xf47b20 : 0x2f6db4, null, { mode: 'work' }); p.position.y = 0; p.rotation.y = fz > 0 ? Math.PI : 0; movers.push({ o: p, t: 'bob', ph: idx }); people.push(p); }
        const hb = new T.Mesh(G.box, M.hit); hb.scale.set(w, 3.4, d); hb.position.set(x, 1.6, z); hb.userData.k = e ? { t: 'ofr', kd, id: e.id } : { t: 'zone', z: 'uffe' }; fg.add(hb); pick.push(hb);
        rooms.push({ kd, e, code, x, z, w, d, lvl, fg });
        if (e) e.room = code;
      });
      // centro: hall al piano terra, sala riunioni al primo piano
      if (!lvl) {
        B.add('rug', G.box, mat(0xd9cfc0), m4(0, .03, 2.2, 5.2, .015, 3.6));
        B.add('rec', G.box, mat(0xfafafa), m4(0, .55, -1.2, 3.4, 1.1, .7)); B.add('recf', G.box, mat(0xf47b20), m4(0, .5, -.84, 3.4, .9, .04)); B.add('rect', G.box, mat(0x2b2f35), m4(0, 1.12, -1.2, 3.6, .05, .9));
        B.add('mon', G.box, mat(0x1d1f22), m4(.7, 1.35, -1.4, .55, .34, .03)); B.add('scr', G.box, new T.MeshBasicMaterial({ color: 0x9fc9e8 }), m4(.7, 1.35, -1.38, .5, .28, .01));
        bxS(f0, 5.4, 2.8, .25, 0x1d1f22, 0, 0, -5.9); planeT(textTex([[C.orgName().slice(0, 28), 46, 800, 70, null, '#fff'], ['Benvenuti', 26, 600, 128, null, '#f47b20']], { w: 768, h: 180 }), 5, 1.17, f0, 0, 1.75, -5.76);
        for (const s of [-1, 1]) { B.add('sofa', G.box, mat(0x3f4a5a), m4(s * 1.6, .3, 3.6, 1.8, .45, .8)); B.add('sofb', G.box, mat(0x3f4a5a), m4(s * 1.6, .65, 3.95 * 1, 1.8, .5, .2)); B.add('pot', G.cyl, mat(0xc9c4bb), m4(s * 2.6, .35, -4.6, .5, .7, .5)); B.add('leaf', G.sph, mat(0x5e9e4a), m4(s * 2.6, 1.3, -4.6, 1.0, 1.5, 1.0)); }
        B.add('ctab', G.cyl, mat(0xfafafa), m4(0, .25, 2.6, 1.1, .05, 1.1));
        for (let i = -1; i <= 1; i++) { B.add('turn', G.box, mat(0x8e959e), m4(i * 1.1, .5, 1.1, .18, 1.0, .9)); B.add('gw', G.box, glassI, m4(i * 1.1 + .38, .65, 1.1, .55, .55, .03)); }
        for (let k = 0; k < 10; k++) B.add('step', G.box, mat(0xd8d6d1), m4(2.35, (k + 1) * .15, -1.4 - k * .32, 1.0, (k + 1) * .3, .32));
        B.add('lift', G.box, glassI, m4(-2.35, 1.5, -4.4, 1.3, 3.0, 1.3)); B.add('liftc', G.box, mat(0xc5cad1), m4(-2.35, .6, -4.4, 1.1, 1.2, 1.1));
        const rp = person(f0, -.3, -1.75, 0x39a85a, null, { mode: 'work' }); rp.position.y = 0; movers.push({ o: rp, t: 'bob', ph: 7 });
      } else {
        ACC = accBuild(fg, B, glassI, people, OD); // v287: contabilità e archivio al posto della sala riunioni
      }
      const ims = B.flush(); Object.values(ims).forEach(im => { im.castShadow = false; });
    };
    floorG(f0, 0); floorG(f1, 1);
    rooms.push({ kd: 'acc', e: { id: 'cont' }, x: 0, z: -3.25, w: 5.8, d: 5.9, lvl: 1, fg: f1 }, { kd: 'acc', e: { id: 'doc' }, x: 0, z: 3.3, w: 5.8, d: 5.9, lvl: 1, fg: f1 });
    const acL = [[-3.2, 'Contabilità', 'IVA · scadenze', 'cont'], [3.3, 'Archivio', 'documenti', 'doc']].map(([z, t2, s2, id]) => { const a = new T.Object3D(); a.position.set(0, 3.75, z); f1.add(a); return { a, t: t2, s: s2, k: { t: 'acc', id } }; });
    const anc = [[f0, -9, 'Clienti', 'piano terra'], [f0, 9, 'Fornitori', 'piano terra'], [f1, -9, 'Clienti', '1° piano'], [f1, 9, 'Fornitori', '1° piano']].map(([fg, x, t2, s2]) => { const a = new T.Object3D(); a.position.set(x, 3.9, -6.3); fg.add(a); return { a, t: t2, s: s2, kd: x < 0 ? 'cli' : 'for' }; });
    // ---- facciata in vetro, fasce, pensilina, insegna (svaniscono quando si apre)
    const fac = grp(g, 0, 0, 0), FB = new Batch(fac), H2 = FH * 2 + .1;
    for (const [w, d, x, z] of [[BW, .16, 0, BD / 2], [BW, .16, 0, -BD / 2], [.16, BD, BW / 2, 0], [.16, BD, -BW / 2, 0]]) meshS(G.box, glassF, x, .24 + H2 / 2, z, fac, { s: [w, H2, d] });
    for (let x = -BW / 2; x <= BW / 2 + .01; x += 2.5) for (const z of [BD / 2 + .1, -BD / 2 - .1]) FB.add('mul', G.box, frameF, m4(x, .24 + H2 / 2, z, .14, H2, .12));
    for (let z = -BD / 2; z <= BD / 2 + .01; z += 2.6) for (const x of [BW / 2 + .1, -BW / 2 - .1]) FB.add('mul', G.box, frameF, m4(x, .24 + H2 / 2, z, .12, H2, .14));
    for (const y of [.24 + FH, .24 + H2]) { FB.add('band', G.box, frameF, m4(0, y, BD / 2 + .12, BW + .3, .42, .12)); FB.add('band', G.box, frameF, m4(0, y, -BD / 2 - .12, BW + .3, .42, .12)); FB.add('band', G.box, frameF, m4(BW / 2 + .12, y, 0, .12, .42, BD + .3)); FB.add('band', G.box, frameF, m4(-BW / 2 - .12, y, 0, .12, .42, BD + .3)); }
    FB.add('acc', G.box, orF, m4(-BW / 2 + 1.2, .24 + H2 / 2, BD / 2 + .2, .5, H2 + .4, .2)); FB.add('acc', G.box, orF, m4(0, .24 + H2 + .36, BD / 2 + .2, BW + .3, .14, .16));
    FB.add('door', G.box, darkF, m4(0, 1.45, BD / 2 + .14, 3.2, 2.5, .08)); FB.add('door', G.box, glassF, m4(0, 1.4, BD / 2 + .2, 2.9, 2.3, .04));
    FB.add('can', G.box, frameF, m4(0, 3.25, BD / 2 + 1.6, 7, .22, 3.2)); for (const s of [-1, 1]) FB.add('canp', G.box, darkF, m4(s * 3.2, 1.6, BD / 2 + 3, .14, 3.1, .14));
    FB.flush();
    const sgn = planeT(textTex([[C.orgName().slice(0, 30), 60, 800, 64, null, '#16181b']], { w: 1024, h: 128 }), 10, 1.25, fac, 3.2, .24 + FH + .6, BD / 2 + .24, {}); sgn.material.transparent = true; FM.push(sgn.material); sgn.material.userData.o0 = 1;
    const sgn2 = planeT(textTex([['UFFICI · AMMINISTRAZIONE', 40, 800, 56, null, '#ffffff']], { bg: '#f47b20', w: 768, h: 110, round: 10 }), 5.4, .78, fac, 0, 3.25, BD / 2 + 3.22, {}); sgn2.material.transparent = true; FM.push(sgn2.material); sgn2.material.userData.o0 = 1;
    // ---- tetto: solaio, parapetto, pannelli, impianti, lucernario
    const roof = grp(g, 0, 0, 0), RB = new Batch(roof), yR = .24 + H2;
    RB.add('rs', G.box, roofF, m4(0, yR + .2, 0, BW + .4, .4, BD + .4));
    for (const [w, d, x, z] of [[BW + .4, .2, 0, BD / 2 + .1], [BW + .4, .2, 0, -BD / 2 - .1], [.2, BD + .4, BW / 2 + .1, 0], [.2, BD + .4, -BW / 2 - .1, 0]]) RB.add('par', G.box, frameF, m4(x, yR + .6, z, w, .5, d));
    for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) RB.add('pv', G.box, pvF, m4(-12 + i * 3.2, yR + .75, -3.6 + j * 3, 2.8, .1, 1.7, 0, .18));
    for (let i = 0; i < 3; i++) { RB.add('hv', G.box, frameF, m4(7 + i * 2.6, yR + .9, -3, 2, 1, 1.6)); RB.add('hvf', G.cyl, darkF, m4(7 + i * 2.6, yR + 1.42, -3, .9, .05, .9)); }
    RB.add('sky', G.box, glassF, m4(4, yR + .55, 2.6, 6, .3, 2.4)); RB.add('skyf', G.box, frameF, m4(4, yR + .45, 2.6, 6.3, .2, 2.7));
    RB.flush();
    // contatto per il clic sull'edificio chiuso
    const hb = new T.Mesh(G.box, M.hit); hb.scale.set(BW, H2 + .8, BD); hb.position.set(0, .24 + H2 / 2, 0); hb.userData.k = { t: 'zone', z: 'uffe' }; g.add(hb); pick.push(hb);
    [fac, roof].forEach(G2 => G2.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } }));
    OFF = { g, inner, f0, f1, fac, roof, FM, rooms, OD, anc, acL, u: OFF ? OFF.u : 0, want: OFF ? OFF.want : 0, FH, BD, BW, br: null, foc: null };
    offApply();
  }
  function offApply() {
    const O = OFF; if (!O) return; const u = O.u, e = u * u * (3 - 2 * u), fade = Math.max(0, 1 - e * 1.7);
    O.inner.visible = u > .01; O.fac.visible = fade > .01; O.roof.visible = u < .98;
    O.FM.forEach(m => { m.opacity = m.userData.o0 * fade; m.depthWrite = fade > .95; });
    O.roof.position.y = e * 7.5;
    O.f1.position.set(0, .24 + O.FH + e * 6.4, -e * 9.5);
  }
  function offTick(t, dt) {
    const O = OFF; if (!O) return; const target = O.want ? 1 : 0;
    if (Math.abs(O.u - target) > .001) { O.u += (target - O.u) * Math.min(1, dt * 2.4); if (Math.abs(O.u - target) < .004) O.u = target; offApply(); }
    accTick(t, dt);
    if (O.foc) { O.foc.u = Math.min(1, O.foc.u + dt / .8); const s = 1 + (1 - easeOut(O.foc.u)) * .25 + Math.sin(t * 3) * .01; O.foc.br.grp.scale.set(s, s, s); O.foc.br.im.material.opacity = Math.min(1, O.foc.u * 2); O.foc.br.fill.material.opacity = .06 + Math.sin(t * 3) * .03; const p = offRoomW(O.foc.r, true); O.foc.br.grp.position.copy(p); }
  }
  // posizione di un ufficio a edificio aperto (o attuale)
  function offRoomW(r, cur) { const O = OFF, e = cur ? (O.u * O.u * (3 - 2 * O.u)) : 1, y = r.lvl ? .24 + O.FH + e * 6.4 : .24, z = r.lvl ? -e * 9.5 : 0; return new T.Vector3(O.g.position.x + r.x, y + 1.45, O.g.position.z + r.z + z); }
  function offFocus(kd, id) {
    offUnfocus(); const O = OFF; if (!O) return null; const r = O.rooms.find(q => q.e && q.kd === kd && q.e.id === String(id)); if (!r) return null;
    const br = brackets(kd === 'cli' ? 0xf47b20 : kd === 'acc' ? 0x2a8a4a : 0x2f6db4, 1); br.set(r.w + .3, 3.2, r.d + .3); br.grp.visible = true; br.grp.position.copy(offRoomW(r, true)); O.foc = { r, br, u: 0 }; return r;
  }
  function offUnfocus() { const O = OFF; if (O && O.foc) { WH && WH.remove(O.foc.br.grp); O.foc = null; } }
  function offView(kd, id) {
    const r = offFocus(kd, id); if (r) { const p = offRoomW(r, false); fly({ tx: p.x, ty: p.y - .6, tz: p.z, dist: 22, az: -0.32, pol: .95 }); return; }
    const O = OFF; if (O) fly({ tx: O.g.position.x, ty: 4.5, tz: O.g.position.z - 4, dist: 84, az: -0.3, pol: .9 });
  }
  // pannelli
  const offRow = e => { const st = OST[e.st]; return `<button type="button" class="m3-row" data-ofr="${e.kd}:${esc(e.id)}"><i class="m3-av" style="--c:${hexC(e.col)}">${esc(initials(e.name))}</i><span class="tx"><b>${esc(e.name)}</b><small>${esc([e.room, e.city || e.cat, e.last ? 'ultimo ' + C.dIt(e.last) : ''].filter(Boolean).join(' · '))}</small></span>${e.st === 'late' ? `<span class="m3-chip r"><i></i>${C.eur0(e.late)}</span>` : e.st === 'open' ? `<span class="m3-chip a"><i></i>${C.eur0(e.open)}</span>` : e.tot ? `<span class="m3-chip n">${C.eur0(e.tot)}</span>` : ''}</button>`; };
  function offPanel(Pn) {
    const O = OFF; if (!O) return ''; const { CL, FR } = O.OD;
    if (Pn.t === 'ofr') {
      const e = offFind(Pn.kd, Pn.id); if (!e) return '';
      const cli = e.kd === 'cli', o = e.o || {}, st = OST[e.st], mx = Math.max(1, ...e.ser);
      const MS = ['G', 'F', 'M', 'A', 'M', 'G', 'L', 'A', 'S', 'O', 'N', 'D'];
      const kv = [[cli ? 'P. IVA' : 'P. IVA', o.piva], ['Città', e.city], [cli ? 'Pagamento' : 'Categoria', cli ? o.pagamento : (o.categoria || e.cat)], ['Referente', o.referente], ['Telefono', o.tel && `<a href="tel:${esc(String(o.tel).replace(/\s/g, ''))}">${esc(o.tel)}</a>`, 1], ['Email', o.email && `<a href="mailto:${esc(o.email)}">${esc(o.email)}</a>`, 1]].filter(r => r[1]);
      const docRow = f => { const late = !isPaid(f) && f.scadenza && String(f.scadenza) < C.today(); return `<div class="m3-row"><i class="m3-pi" style="width:30px;height:30px;border-radius:9px">${ic('pdf')}</i><span class="tx"><b>Fattura ${esc(f.numero || '—')}</b><small>${esc([C.dIt(f.data), f.scadenza && !isPaid(f) ? 'scade ' + C.dIt(f.scadenza) : ''].filter(Boolean).join(' · '))}</small></span><span class="m3-chip ${isPaid(f) ? 'g' : late ? 'r' : 'a'}"><i></i>${C.eur0(C.num(f.totale))}</span></div>`; };
      const extra = cli ? (e.ddt.length ? `<div class="m3-h4">DDT <em>${e.ddt.length}</em></div><div class="m3-rows">${e.ddt.slice(0, 6).map(x => { const i = trucks.findIndex(t2 => t2.d === x); return `<button type="button" class="m3-row" ${i >= 0 ? `data-trk3="${i}"` : `data-gx="ddt-pdf" data-id="${esc(x.d.id)}"`}><i class="m3-pi" style="width:30px;height:30px;border-radius:9px">${ic('truck')}</i><span class="tx"><b>DDT ${esc(C.dnum(x.d))}</b><small>${esc([C.dIt(x.d.data), x.R.length + ' righe', C.num(x.d.colli) ? N(C.num(x.d.colli)) + ' colli' : ''].filter(Boolean).join(' · '))}</small></span>${x.d.fattura ? '<span class="m3-chip g"><i></i>Fatturato</span>' : '<span class="m3-chip a"><i></i>Da fatturare</span>'}</button>`; }).join('')}</div>` : '')
        : (e.rcv.length ? `<div class="m3-h4">Arrivi in 30 giorni <em>${e.rcv.length}</em></div><div class="m3-rows">${e.rcv.slice(0, 5).map(r => rcvRow(r)).join('')}</div>` : '') + (e.arts.length ? `<div class="m3-h4">Articoli forniti <em>${e.arts.length}</em></div><div class="m3-rows">${e.arts.slice().sort((a, b) => b.g - a.g).slice(0, 6).map(x => { const p2 = P.byArt.get(x.id); return `<button type="button" class="m3-row" ${p2 ? `data-art3="${esc(x.id)}"` : ''}><i class="m3-pi" style="width:30px;height:30px;border-radius:9px">${ic('box')}</i><span class="tx"><b>${esc(x.a.descrizione)}</b><small>${esc([x.a.codice, N(x.g) + ' ' + (x.a.um || 'pz')].filter(Boolean).join(' · '))}</small></span>${p2 ? `<span class="m3-loc">${esc(p2.code)}</span>` : ''}</button>`; }).join('')}</div>` : '');
      return head(`<span class="m3-av big" style="--c:${hexC(e.col)}">${esc(initials(e.name))}</span>`, '', cli ? 'Cliente' + (e.room ? ' · ufficio ' + e.room : '') : 'Fornitore' + (e.room ? ' · ufficio ' + e.room : ''), esc(e.name), esc([e.city, cli ? '' : e.cat].filter(Boolean).join(' · ')), 1) + `<div class="m3-pb">
        <div class="m3-chips"><span class="m3-chip ${e.st === 'late' ? 'r' : e.st === 'open' ? 'a' : 'g'}"><i></i>${esc(stTxt(e) || 'Nessun documento')}</span>${e.docs.length ? `<span class="m3-chip n">${e.docs.length} fatture</span>` : ''}</div>
        <div class="m3-grid">${stat(cli ? 'Fatturato 12 mesi' : 'Acquisti 12 mesi', e.tot ? C.eur0(e.tot) : '—', '', 'imponibile')}${stat(cli ? 'Da incassare' : 'Da pagare', e.open ? C.eur0(e.open) : '—', '', e.nOpen ? `${e.nOpen} ${e.nOpen === 1 ? 'fattura' : 'fatture'}` : 'niente in sospeso')}
        ${stat('Scaduto', e.late ? C.eur0(e.late) : '—', '', e.nLate ? `${e.nLate} ${e.nLate === 1 ? 'fattura' : 'fatture'}` : 'tutto nei termini')}${cli ? stat('DDT', e.ddt.length, '', `${N(e.pz)} pezzi spediti`) : stat('Articoli forniti', e.arts.length, '', `${e.rcv.length} arrivi in 30 gg`)}</div>
        <div class="m3-h4">${cli ? 'Fatturato' : 'Acquisti'} · ultimi 12 mesi</div>
        <div class="m3-b14 m3-b12">${e.ser.map((v, i) => { const m = O.OD.months[i]; return `<div title="${esc(m)}: ${esc(C.eur0(v))}"><i style="--h:${(v / mx * 100).toFixed(1)}%;--k:${i}"${i === 11 ? ' class="c"' : ''}></i><small>${MS[Number(m.slice(5)) - 1]}</small></div>`; }).join('')}</div>
        <div class="m3-acts">${cli ? (canW() ? `<button type="button" class="m3-go" data-gx="ddt-new">${ic('plus')}Nuovo DDT</button>` : '') + `<button type="button" class="m3-go ghost" data-m3="gocli">${ic('users')}Apri Clienti</button>` : (canW() ? `<button type="button" class="m3-go" data-gx="mov-new">${ic('plus')}Nuovo carico</button>` : '') + `<button type="button" class="m3-go ghost" data-m3="gofor">${ic('factory')}Apri Fornitori</button>`}</div>
        ${kv.length ? `<div class="m3-h4">Anagrafica</div><div class="m3-kv">${kv.map(([k, v, raw]) => `<div><span>${k}</span><b>${raw ? v : esc(v)}</b></div>`).join('')}</div>` : ''}
        ${e.docs.length ? `<div class="m3-h4">Fatture <em>${e.docs.length}</em></div><div class="m3-rows">${e.docs.slice(0, 8).map(docRow).join('')}</div>` : ''}
        ${extra}</div>`;
    }
    const L2 = OFT === 'cli' ? CL : FR, oC = CL.reduce((s, e) => s + e.open, 0), lC = CL.reduce((s, e) => s + e.late, 0), oF = FR.reduce((s, e) => s + e.open, 0), lF = FR.reduce((s, e) => s + e.late, 0);
    return head(ic('office'), '', 'Edificio', 'Uffici', esc(C.orgName()) + ' · clienti, fornitori e amministrazione', 1) + `<div class="m3-pb">
      <div class="m3-grid">${stat('Clienti', CL.length, '', `${CL.filter(e => e.tot || e.ddt.length).length} attivi nell'anno`)}${stat('Da incassare', oC ? C.eur0(oC) : '—', '', lC ? `${C.eur0(lC)} scaduti` : 'niente di scaduto')}
      ${stat('Fornitori', FR.length, '', `${FR.filter(e => e.tot || e.rcv.length).length} attivi`)}${stat('Da pagare', oF ? C.eur0(oF) : '—', '', lF ? `${C.eur0(lF)} scaduti` : 'niente di scaduto')}</div>
      ${ACC ? `<div class="m3-amm"><button type="button" data-acc="cont"><i style="--c:#2a8a4a">${ic('chart')}</i><span><b>Contabilità</b><small>utile del mese ${C.eur0(ACC.X.revM - ACC.X.costM)} · IVA ${ACC.X.qN} trim.</small></span></button><button type="button" data-acc="doc"><i style="--c:#7b5cc4">${ic('pdf')}</i><span><b>Archivio documenti</b><small>${N(ACC.X.tot)} documenti${ACC.X.fix.length ? ' · ' + ACC.X.fix.reduce((s2, r) => s2 + r[1], 0) + ' da sistemare' : ''}</small></span></button></div>` : ''}
      <div class="m3-seg2"><button type="button" data-oft="cli" class="${OFT === 'cli' ? 'on' : ''}">${ic('users')}Clienti <em>${CL.length}</em></button><button type="button" data-oft="for" class="${OFT === 'for' ? 'on' : ''}">${ic('factory')}Fornitori <em>${FR.length}</em></button></div>
      <div class="m3-leg"><span><i style="background:#2a8a4a"></i>In regola</span><span><i style="background:#d98a1c"></i>${OFT === 'cli' ? 'Da incassare' : 'Da pagare'}</span><span><i style="background:#d9452f"></i>Scaduto</span></div>
      <div class="m3-rows">${L2.slice(0, 60).map(offRow).join('') || `<div class="m3-empty">Nessun ${OFT === 'cli' ? 'cliente' : 'fornitore'} in anagrafica</div>`}</div></div>`;
  }

  /* ---------------- v287: amministrazione — contabilità e archivio documenti (1° piano degli uffici) ---------------- */
  const DOCT = { fe: ['Fatture emesse', 0xf47b20, 'vendite'], fr: ['Fatture ricevute', 0x2f6db4, 'fatture'], dc: ['DDT ai clienti', 0x2a8a4a, 'vendite'], df: ['DDT dei fornitori', 0x7b5cc4, 'movimenti'], rc: ['Righe di costo', 0x8e959e, 'movimenti'] };
  let ACC = null;
  function accData(OD) {
    const td = C.today(), V = C.fv ? C.fv() : [], FA = C.fatF ? C.fatF() : [], CO = C.costi ? C.costi() : [], DF = C.dfo ? C.dfo() : [], months = OD.months;
    const imp = f => C.num(f.imponibile) || C.num(f.totale), iva = f => (C.num(f.imponibile) && C.num(f.totale)) ? Math.max(0, C.num(f.totale) - C.num(f.imponibile)) : 0;
    const rowT = r => { try { return C.rowT ? C.num(C.rowT(r)) : C.num(r.prezzo) * (C.num(r.quantita) || 1); } catch { return 0; } };
    const mOf = d => String(d || '').slice(0, 7), byM = (L2, val) => months.map(m => L2.reduce((s, x) => s + (mOf(x.data) === m ? val(x) : 0), 0));
    const rev = byM(V, imp), costSrc = CO.length ? CO : FA, cost = byM(costSrc, CO.length ? rowT : imp);
    const q0 = td.slice(0, 5) + String(Math.floor((Number(td.slice(5, 7)) - 1) / 3) * 3 + 1).padStart(2, '0'), qN = ['1°', '2°', '3°', '4°'][Math.floor((Number(td.slice(5, 7)) - 1) / 3)];
    const ivaD = V.filter(f => String(f.data) >= q0).reduce((s, f) => s + iva(f), 0), ivaC = FA.filter(f => String(f.data) >= q0).reduce((s, f) => s + iva(f), 0);
    const opV = V.filter(f => !isPaid(f)), opF = FA.filter(f => !isPaid(f)), late = f => f.scadenza && String(f.scadenza) < td;
    const lim = dFwd(30), forK = f => { const k = fkey(f.fornitore), e = OD.FR.find(x => x.key === k); return e ? e.id : null; };
    const sc = [...opV.filter(f => f.scadenza && String(f.scadenza) <= lim).map(f => { const c = C.cliOf ? C.cliOf(f.cliente) : null; return { k: 'in', f, d: String(f.scadenza), name: (c && c.nome) || 'Cliente', amt: C.num(f.totale), late: late(f), ofr: 'cli:' + f.cliente }; }),
      ...opF.filter(f => f.scadenza && String(f.scadenza) <= lim).map(f => { const id = forK(f); return { k: 'out', f, d: String(f.scadenza), name: f.fornitore || 'Fornitore', amt: C.num(f.totale), late: late(f), ofr: id ? 'for:' + id : '' }; })].sort((a, b) => a.d.localeCompare(b.d));
    const cliN = id => { const c = C.cliOf ? C.cliOf(id) : null; return (c && c.nome) || ''; };
    const tm = td.slice(0, 7), srt = (a, b) => String(b.d).localeCompare(String(a.d));
    const DOC = {
      fe: V.map(f => ({ ty: 'fe', d: String(f.data || ''), t: 'Fattura ' + (f.numero || '—'), s: cliN(f.cliente), amt: C.num(f.totale), st: isPaid(f) ? 'g' : late(f) ? 'r' : 'a', ofr: 'cli:' + f.cliente })).sort(srt),
      fr: FA.map(f => { const id = forK(f); return { ty: 'fr', d: String(f.data || ''), t: 'Fattura ' + (f.numero || '—'), s: f.fornitore || '', amt: C.num(f.totale), st: isPaid(f) ? 'g' : late(f) ? 'r' : 'a', ofr: id ? 'for:' + id : '' }; }).sort(srt),
      dc: D.ddt.map((x, i) => ({ ty: 'dc', d: String(x.d.data || ''), t: 'DDT ' + C.dnum(x.d), s: x.cliN || cliN(x.d.cliente), amt: 0, st: x.d.fattura ? 'g' : 'a', ddt: x })).sort(srt),
      df: DF.map(x => ({ ty: 'df', d: String(x.data || ''), t: 'DDT ' + (x.numero || x.ndoc || '—'), s: x.fornitore || '', amt: C.num(x.totale), st: x.fattura || x.fatt ? 'g' : 'n' })).sort(srt),
      rc: CO.map(r => ({ ty: 'rc', d: String(r.data || ''), t: String(r.descrizione || r.categoria || 'Riga di costo').slice(0, 60), s: [r.fornitore, r.centro].filter(Boolean).join(' · '), amt: rowT(r), st: r.centro ? 'n' : 'a' })).sort(srt)
    };
    const fix = [
      ['DDT senza fattura', D.ddt.filter(x => !x.d.fattura).length, 'vendite', 'da fatturare ai clienti'],
      ['Fatture emesse scadute', opV.filter(late).length, 'vendite', 'da sollecitare'],
      ['Fatture ricevute senza scadenza', opF.filter(f => !f.scadenza).length, 'fatture', 'non compaiono nelle scadenze'],
      ['Righe di costo senza centro', CO.filter(r => !String(r.centro || '').trim()).length, 'movimenti', 'assegna il centro di costo'],
      ['Righe di costo senza prezzo', CO.filter(r => !rowT(r)).length, 'movimenti', 'importo mancante']
    ].filter(r => r[1] > 0);
    const n = Object.fromEntries(Object.keys(DOC).map(k => [k, DOC[k].length])), nM = Object.fromEntries(Object.keys(DOC).map(k => [k, DOC[k].filter(x => x.d.slice(0, 7) === tm).length]));
    const in30 = sc.filter(x => x.k === 'in').reduce((s, x) => s + x.amt, 0), out30 = sc.filter(x => x.k === 'out').reduce((s, x) => s + x.amt, 0);
    return { months, rev, cost, revM: rev[11], costM: cost[11], revP: rev[10], costP: cost[10], rev12: rev.reduce((a, b) => a + b, 0), cost12: cost.reduce((a, b) => a + b, 0), costFromRows: !!CO.length,
      q0, qN, ivaD, ivaC, opV: opV.reduce((s, f) => s + C.num(f.totale), 0), opF: opF.reduce((s, f) => s + C.num(f.totale), 0), lateV: opV.filter(late).reduce((s, f) => s + C.num(f.totale), 0), lateF: opF.filter(late).reduce((s, f) => s + C.num(f.totale), 0),
      sc, in30, out30, DOC, n, nM, tot: Object.values(n).reduce((a, b) => a + b, 0), fix };
  }
  function dFwd(n) { const d = new Date(C.today() + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
  const eurK = v => { const a = Math.abs(v); return (v < 0 ? '−' : '') + (a >= 1e6 ? (a / 1e6).toFixed(1).replace('.', ',') + ' mln' : a >= 1e4 ? Math.round(a / 1e3) + 'k' : Math.round(a).toLocaleString('it-IT')) + ' €'; };
  // schermo a parete della contabilità: 3 pagine che si alternano
  function accScreen(A, page, u) {
    const cv = A.cv, g = cv.getContext('2d'), w = cv.width, h = cv.height, X = A.X, F = 'Inter, system-ui, sans-serif';
    g.fillStyle = '#121418'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1c1f25'; g.fillRect(0, 0, w, 64);
    g.font = `800 26px ${F}`; g.fillStyle = '#f47b20'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText('CONTABILITÀ', 28, 33);
    const tl = ['Conto economico', `IVA · ${X.qN} trimestre (stima)`, 'Scadenze · 30 giorni'][page];
    g.font = `600 22px ${F}`; g.fillStyle = 'rgba(255,255,255,.7)'; g.fillText(tl, 210, 34);
    g.textAlign = 'right'; g.fillStyle = (Math.floor(u * 4) % 2) ? '#5df08a' : '#2e7d4a'; g.beginPath(); g.arc(w - 120, 33, 7, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.75)'; g.font = `700 20px ${F}`; g.fillText('LIVE', w - 30, 34);
    for (let i = 0; i < 3; i++) { g.fillStyle = i === page ? '#f47b20' : 'rgba(255,255,255,.18)'; g.fillRect(w / 2 - 54 + i * 40, h - 16, 32, 5); }
    g.fillStyle = '#f47b20'; g.fillRect(0, 62, w * u, 3);
    const big = (x, y, l, v, c, sub) => { g.textAlign = 'left'; g.font = `600 20px ${F}`; g.fillStyle = 'rgba(255,255,255,.55)'; g.fillText(l, x, y); g.font = `800 46px ${F}`; g.fillStyle = c; g.fillText(v, x, y + 46); if (sub) { g.font = `600 18px ${F}`; g.fillStyle = 'rgba(255,255,255,.45)'; g.fillText(sub, x, y + 86); } };
    if (page === 0) {
      const ut = X.revM - X.costM; big(36, 104, 'Ricavi del mese', eurK(X.revM), '#ffffff'); big(36, 214, 'Costi del mese', eurK(X.costM), '#c9ccd2'); big(36, 324 - 8, 'Utile', eurK(ut), ut >= 0 ? '#5df08a' : '#ff6b5b');
      const x0 = 400, x1 = w - 36, y1 = h - 44, y0 = 96, mx = Math.max(1, ...X.rev, ...X.cost), bw = (x1 - x0) / 12;
      g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 1; for (let i = 0; i <= 3; i++) { const y = y0 + (y1 - y0) * i / 3; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); }
      const grow = Math.min(1, u * 3);
      for (let i = 0; i < 12; i++) { const k = Math.min(1, Math.max(0, grow * 1.6 - i * .05)), hr = (y1 - y0) * X.rev[i] / mx * k, hc = (y1 - y0) * X.cost[i] / mx * k, bx2 = x0 + i * bw + bw * .14;
        g.fillStyle = i === 11 ? '#f47b20' : '#8a5a33'; g.fillRect(bx2, y1 - hr, bw * .34, hr); g.fillStyle = i === 11 ? '#d6dae0' : '#4b5058'; g.fillRect(bx2 + bw * .38, y1 - hc, bw * .34, hc);
        g.fillStyle = 'rgba(255,255,255,.4)'; g.font = `600 15px ${F}`; g.textAlign = 'center'; g.fillText('GFMAMGLASOND'[Number(X.months[i].slice(5)) - 1], x0 + i * bw + bw / 2, y1 + 18); }
    } else if (page === 1) {
      const sal = X.ivaD - X.ivaC; big(36, 104, 'IVA sulle vendite · a debito', eurK(X.ivaD), '#ffffff'); big(36, 214, 'IVA sugli acquisti · a credito', eurK(X.ivaC), '#c9ccd2');
      g.fillStyle = sal >= 0 ? 'rgba(244,123,32,.14)' : 'rgba(93,240,138,.12)'; g.beginPath(); g.roundRect(520, 100, w - 556, 220, 18); g.fill();
      g.textAlign = 'center'; g.font = `600 22px ${F}`; g.fillStyle = 'rgba(255,255,255,.65)'; g.fillText(sal >= 0 ? 'Saldo da versare' : 'Saldo a credito', 520 + (w - 556) / 2, 150);
      g.font = `800 64px ${F}`; g.fillStyle = sal >= 0 ? '#f47b20' : '#5df08a'; g.fillText(eurK(Math.abs(sal)), 520 + (w - 556) / 2, 222);
      g.font = `600 17px ${F}`; g.fillStyle = 'rgba(255,255,255,.4)'; g.fillText('dal totale − imponibile delle fatture registrate', 520 + (w - 556) / 2, 284);
    } else {
      big(36, 104, 'Entrate attese', eurK(X.in30), '#5df08a'); big(36, 214, 'Uscite previste', eurK(X.out30), '#ff9a6b'); big(36, 324 - 8, 'Saldo', eurK(X.in30 - X.out30), '#ffffff');
      const L2 = X.sc.slice(0, 5); g.textAlign = 'left';
      L2.forEach((s, i) => { const y = 104 + i * 54, k = Math.min(1, Math.max(0, u * 4 - i * .25)); g.globalAlpha = k; g.fillStyle = '#1c1f25'; g.beginPath(); g.roundRect(400 + (1 - k) * 40, y - 4, w - 436, 46, 10); g.fill();
        g.fillStyle = s.late ? '#ff6b5b' : s.k === 'in' ? '#5df08a' : '#ff9a6b'; g.fillRect(400 + (1 - k) * 40, y - 4, 6, 46);
        g.font = `700 19px ${F}`; g.fillStyle = '#fff'; g.fillText((s.name || '').slice(0, 26), 420 + (1 - k) * 40, y + 12); g.font = `600 15px ${F}`; g.fillStyle = 'rgba(255,255,255,.5)'; g.fillText((s.late ? 'scaduta il ' : 'scade il ') + C.dIt(s.d), 420 + (1 - k) * 40, y + 32);
        g.textAlign = 'right'; g.font = `800 22px ${F}`; g.fillStyle = s.k === 'in' ? '#5df08a' : '#ff9a6b'; g.fillText((s.k === 'in' ? '+' : '−') + eurK(s.amt), w - 50, y + 20); g.textAlign = 'left'; g.globalAlpha = 1; });
      if (!L2.length) { g.font = `600 22px ${F}`; g.fillStyle = 'rgba(255,255,255,.5)'; g.fillText('Nessuna scadenza nei prossimi 30 giorni', 420, 200); }
    }
    A.tex.needsUpdate = true;
  }
  function accBuild(fg, B, glassI, people, OD) {
    const X = accData(OD), tier = Q ? Q.tier : 2;
    // pavimenti e parete in vetro tra le due stanze (porta al centro)
    B.add('afl', G.box, mat(0xffffff), m4(0, .035, -3.2, 5.7, .02, 5.9), 0xe3efe6); B.add('afl', G.box, mat(0xffffff), m4(0, .035, 3.3, 5.7, .02, 5.9), 0xf2ebdf);
    B.add('ast', G.box, mat(0xffffff), m4(0, .058, -.45, 5.4, .01, .12), 0x2a8a4a); B.add('ast', G.box, mat(0xffffff), m4(0, .058, 6.05, 5.4, .01, .12), 0x7b5cc4);
    B.add('gw', G.box, glassI, m4(-1.6, 1.4, 0, 2.6, 2.7, .05)); B.add('gw', G.box, glassI, m4(1.8, 1.4, 0, 2.2, 2.7, .05)); B.add('gr', G.box, mat(0x2b2f35), m4(0, 2.76, 0, 5.8, .06, .08));
    for (const x of [-.3, .7]) B.add('gp', G.box, mat(0x2b2f35), m4(x, 1.4, 0, .06, 2.7, .08));
    // --- contabilità: due postazioni con doppio monitor, schermo a parete, stampante, cassaforte, cassettiere
    const scrM = new T.MeshBasicMaterial({ color: 0xbfe3cc }); OWN.push(scrM);
    for (const sx of [-1.35, 1.35]) {
      B.add('desk', G.box, mat(0xfafafa), m4(sx, .76, -4.35, 1.7, .05, .8)); for (const lx of [-.78, .78]) B.add('dleg', G.box, mat(0x8e959e), m4(sx + lx, .38, -4.35, .05, .74, .7));
      for (const mx2 of [-.36, .36]) { B.add('mon', G.box, mat(0x1d1f22), m4(sx + mx2, 1.08, -4.6, .62, .38, .03)); B.add('scr', G.box, scrM, m4(sx + mx2, 1.08, -4.58, .56, .32, .01)); B.add('mst', G.box, mat(0x1d1f22), m4(sx + mx2, .86, -4.6, .05, .2, .05)); }
      B.add('kb', G.box, mat(0x2b2f35), m4(sx, .795, -4.12, .5, .02, .16)); B.add('ppr', G.box, mat(0xffffff), m4(sx + .6, .795, -4.15, .24, .02, .32)); B.add('calc', G.box, mat(0x3a3f46), m4(sx - .62, .8, -4.15, .14, .03, .2));
    }
    const nP = tier === 0 ? 1 : 2; for (let i = 0; i < nP; i++) { const sx = i ? 1.35 : -1.35, p = person(fg, sx, -3.73, 0x2a8a4a, null, { mode: 'work', shirt: 0xf4f4f2 }); p.position.y = 0; p.rotation.y = Math.PI; movers.push({ o: p, t: 'bob', ph: 20 + i }); people.push(p); }
    if (nP < 2) { B.add('chs', G.box, mat(0x2a8a4a), m4(1.35, .5, -3.8, .5, .08, .5)); B.add('chb', G.box, mat(0x2a8a4a), m4(1.35, .82, -3.57, .5, .55, .07)); }
    bxS(fg, 4.9, 2.1, .12, 0x1d1f22, 0, .9, -6.2);
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 400; const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4; OWN.push(tex);
    const sm = new T.MeshBasicMaterial({ map: tex }); OWN.push(sm); const scr = new T.Mesh(G.plane, sm); scr.scale.set(4.7, 1.836, 1); scr.position.set(0, 1.95, -6.13); fg.add(scr);
    // stampante con foglio che esce
    bxS(fg, .8, .55, .6, 0xc5cad1, 2.3, 0, -1.2); bxS(fg, .7, .4, .55, 0xf4f5f6, 2.3, .55, -1.2); bxS(fg, .5, .03, .14, 0x2b3440, 2.3, .82, -1.36, { ns: 1 });
    const pap = new T.Mesh(G.box, mat(0xffffff)); pap.scale.set(.3, .006, .38); pap.position.set(2.3, .73, -.96); fg.add(pap);
    // cassaforte, cassettiere, pianta
    bxS(fg, .7, .9, .62, 0x3a3f46, -2.35, 0, -1.2); meshS(G.cyl, mat(0xc5cad1), -2.35, .58, -.875, fg, { s: [.16, .03, .16], rx: Math.PI / 2, ns: 1 }); bxS(fg, .05, .22, .04, 0xd9b44a, -2.15, .35, -.87, { ns: 1 });
    for (const zz of [-5.55, -4.9]) { bxS(fg, .6, 1.3, .6, 0xd8dbe0, -2.45, 0, zz); for (let i = 1; i < 4; i++) bxS(fg, .5, .015, .02, 0x8e959e, -2.45, i * .32, zz + .31, { ns: 1 }); }
    B.add('pot', G.cyl, mat(0xc9c4bb), m4(2.45, .3, -5.6, .38, .6, .38)); B.add('leaf', G.sph, mat(0x5e9e4a), m4(2.45, 1.0, -5.6, .7, .9, .7));
    // --- archivio: scaffalature con raccoglitori colorati per tipo di documento, banco di scansione
    const cases = [{ x: -2.55, z: 3.3, len: 4.6, ry: Math.PI / 2, ty: ['fe', 'fe', 'fe', 'dc', 'dc'] }, { x: 2.55, z: 3.3, len: 4.6, ry: -Math.PI / 2, ty: ['fr', 'fr', 'fr', 'df', 'df'] }, { x: 0, z: .62, len: 3.4, ry: 0, ty: ['rc', 'rc', 'rc', 'rc', 'rc'] }];
    const slots = { fe: [], fr: [], dc: [], df: [], rc: [] }, tgt = [];
    const cs = new Batch(fg);
    cases.forEach(cc => {
      const c = Math.cos(cc.ry), s = Math.sin(cc.ry), P2w = (u, y, v) => [cc.x + u * c + v * s, y, cc.z - u * s + v * c]; // u lungo lo scaffale, v verso il corridoio
      const put = (k, mt, u, y, v, sx, sy, sz, col) => { const [x, y2, z] = P2w(u, y, v); cs.add(k, G.box, mt, m4(x, y2, z, sx, sy, sz, cc.ry), col); };
      for (const e of [-1, 1]) put('cup', mat(0x3a3f46), e * cc.len / 2, 1.15, 0, .05, 2.3, .42);
      put('cbk', mat(0xd8d6d1), 0, 1.15, -.19, cc.len, 2.3, .03);
      for (let l = 0; l < 6; l++) put('csh', mat(0xc5cad1), 0, .1 + l * .44, 0, cc.len - .02, .025, .42);
      cc.ty.forEach((ty, l) => { const per = Math.floor((cc.len - .2) / .085); for (let i = 0; i < per; i++) slots[ty].push({ cc, P2w, put, u: -cc.len / 2 + .14 + i * .085, y: .1 + l * .44 + .0125 }); });
      const hb = new T.Mesh(G.box, M.hit); const [hx, , hz] = P2w(0, 0, .05); hb.scale.set(cc.len, 2.4, .6); hb.position.set(hx, 1.2, hz); hb.rotation.y = cc.ry; hb.userData.k = { t: 'acc', id: 'doc', ty: cc.ty[0] }; fg.add(hb); pick.push(hb);
    });
    Object.keys(slots).forEach(ty => { const L2 = slots[ty], nD = X.n[ty] || 0, fill = nD ? Math.max(2, Math.round(L2.length * (1 - Math.exp(-nD / 55)))) : 0, col = DOCT[ty][1];
      L2.forEach((sl, i) => { if (i >= fill) return; const hh = .32 - (i % 5 === 3 ? .04 : 0), cc2 = mixC(col, 0xffffff, (i % 4) * .07);
        sl.put('bnd', mat(0xffffff), sl.u, sl.y + hh / 2, .02, .07, hh, .3, cc2); sl.put('bnl', mat(0xffffff), sl.u, sl.y + hh * .62, .175, .05, .07, .02);
        if (i % 7 === 2) tgt.push(sl.P2w(sl.u, sl.y + hh + .05, .1)); }); });
    cs.flush();
    // targhe sugli scaffali
    const plate = (ty1, ty2, x, z, ry) => { const t = textTex([[DOCT[ty1][0], 30, 800, 34, null, hexC(DOCT[ty1][1])], [`${X.n[ty1]} documenti`, 24, 600, 70, null, '#3a3f46'], ...(ty2 ? [[DOCT[ty2][0] + ' · ' + X.n[ty2], 22, 700, 108, null, hexC(DOCT[ty2][1])]] : [])], { bg: '#ffffff', w: 400, h: ty2 ? 130 : 92, round: 10 }); const p = planeT(t, 1.7, ty2 ? .55 : .39, fg, x, 2.62, z, { ry }); p.renderOrder = 2; };
    plate('fe', 'dc', -2.33, 3.3, Math.PI / 2); plate('fr', 'df', 2.33, 3.3, -Math.PI / 2); plate('rc', null, 0, .84, 0);
    // banco di scansione e archivista
    B.add('stb', G.box, mat(0xfafafa), m4(0, .76, 3.5, 1.5, .05, .75)); for (const lx of [-.68, .68]) B.add('stl', G.box, mat(0x8e959e), m4(lx, .38, 3.5, .05, .74, .65));
    B.add('scn', G.box, mat(0x2b2f35), m4(-.3, .86, 3.42, .5, .14, .38)); B.add('scg', G.box, new T.MeshBasicMaterial({ color: 0x9fe8b4 }), m4(-.3, .936, 3.42, .42, .01, .3));
    B.add('pst', G.box, mat(0xffffff), m4(.4, .8, 3.5, .24, .05, .32)); B.add('box2', G.box, mat(0xc9a273), m4(.9, .3, 5.2, .5, .6, .4)); B.add('box2', G.box, mat(0xb89466), m4(1.42, .3, 5.25, .5, .6, .4));
    if (tier > 0) { const p = person(fg, 0, 4.2, 0x7b5cc4, null, { mode: 'scan' }); p.position.y = 0; p.rotation.y = Math.PI; movers.push({ o: p, t: 'bob', ph: 23 }); people.push(p); }
    // fogli che volano dal banco agli scaffali
    const shM = new T.MeshLambertMaterial({ color: 0xffffff, side: T.DoubleSide }); OWN.push(shM);
    const sheets = []; if (tgt.length) for (let i = 0; i < (tier === 0 ? 2 : 4); i++) { const m = new T.Mesh(G.plane, shM); m.scale.set(.21, .297, 1); m.visible = false; fg.add(m); sheets.push({ m, ph: i / (tier === 0 ? 2 : 4), tg: null, cy: -1 }); }
    // insegne delle stanze
    const sgn = (t1, t2, c, z) => { const t = textTex([[t1, 34, 800, 44, null, '#16181b'], [t2, 21, 600, 84, null, c]], { bg: '#ffffff', w: 512, h: 112, round: 18 }); const p = planeT(t, 3.5, .77, fg, 0, 3.12, z, {}); p.renderOrder = 2; };
    sgn('Contabilità', `Utile 12 mesi ${C.eur0(X.rev12 - X.cost12)}`, '#2a8a4a', .06); sgn('Archivio documenti', `${X.tot} documenti`, '#7b5cc4', 6.36);
    // stanze per il clic e per le staffe di selezione
    const hb1 = new T.Mesh(G.box, M.hit); hb1.scale.set(5.6, 3.2, 5.8); hb1.position.set(0, 1.6, -3.25); hb1.userData.k = { t: 'acc', id: 'cont' }; fg.add(hb1); pick.push(hb1);
    const A = { X, cv, tex, page: 0, t0: 0, last: -1, sheets, tgt, pap, fg };
    accScreen(A, 0, 0);
    return A;
  }
  function accTick(t, dt) {
    const A = ACC; if (!A || !OFF || OFF.u < .3) return;
    const per = 7, page = Math.floor(t / per) % 3, u = (t % per) / per, q = Math.floor(t * 8);
    if (q !== A.last) { A.last = q; accScreen(A, page, u); }
    const pu = (t % 5.5) / 5.5, pk = pu < .35 ? pu / .35 : pu < .8 ? 1 : 1 - (pu - .8) / .2; A.pap.position.z = -.96 + pk * .22; A.pap.position.y = .73 - pk * .02; A.pap.visible = pu < .97;
    A.sheets.forEach((s, i) => { const cyc = 3.4, x = (t / cyc + s.ph), cy = Math.floor(x), f = x - cy; if (cy !== s.cy) { s.cy = cy; s.tg = A.tgt[(cy * 7 + i * 13) % A.tgt.length]; }
      const k = Math.min(1, f / .8), e = k * k * (3 - 2 * k), a = [-.3, .96, 3.42], b = s.tg; s.m.visible = f < .82;
      s.m.position.set(a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e + Math.sin(e * Math.PI) * 1.1, a[2] + (b[2] - a[2]) * e);
      s.m.rotation.set(-Math.PI / 2 + Math.sin(e * Math.PI) * .9, e * 2.4 + i, Math.sin(t * 3 + i) * .25 * Math.sin(e * Math.PI)); const sc2 = 1 - e * .55; s.m.scale.set(.21 * sc2, .297 * sc2, 1); });
  }
  const accRow = x => { const dt = DOCT[x.ty], at = x.ofr ? `data-ofr="${esc(x.ofr)}"` : x.ddt ? (() => { const i = trucks.findIndex(t2 => t2.d === x.ddt); return i >= 0 ? `data-trk3="${i}"` : `data-gx="ddt-pdf" data-id="${esc(x.ddt.d.id)}"`; })() : '';
    return `<${at ? 'button type="button"' : 'div'} class="m3-row" ${at}><i class="m3-pi m3-dt" style="--c:${hexC(dt[1])}">${ic(x.ty === 'dc' || x.ty === 'df' ? 'truck' : x.ty === 'rc' ? 'chart' : 'pdf')}</i><span class="tx"><b>${esc(x.t)}</b><small>${esc([x.d ? C.dIt(x.d) : 'senza data', x.s].filter(Boolean).join(' · '))}</small></span>${x.amt ? `<span class="m3-chip ${x.st}">${x.st === 'g' || x.st === 'a' || x.st === 'r' ? '<i></i>' : ''}${C.eur0(x.amt)}</span>` : x.st === 'a' ? '<span class="m3-chip a"><i></i>da fatturare</span>' : ''}</${at ? 'button' : 'div'}>`; };
  const goBtn = (h, l, icn, gh) => C.secOn && !C.secOn(h) ? '' : `<button type="button" class="m3-go${gh ? ' ghost' : ''}" data-m3="go:${h}">${ic(icn)}${l}</button>`;
  function accPanel(Pn) {
    const A = ACC; if (!A) return ''; const X = A.X, MS = 'GFMAMGLASOND';
    if (Pn.id === 'doc') {
      const ty = Pn.ty && DOCT[Pn.ty] ? Pn.ty : '', all = Object.values(X.DOC).flat().filter(x => x.d).sort((a, b) => b.d.localeCompare(a.d)), L2 = ty ? X.DOC[ty] : all;
      return head(ic('pdf'), '', 'Amministrazione · 1° piano', 'Archivio documenti', `${N(X.tot)} documenti registrati nel gestionale`, 1) + `<div class="m3-pb">
        <div class="m3-dtg">${Object.keys(DOCT).map(k => `<button type="button" data-acc="doc:${ty === k ? '' : k}" class="${ty === k ? 'on' : ''}" style="--c:${hexC(DOCT[k][1])}"><i></i><span>${DOCT[k][0]}</span><b>${N(X.n[k])}</b><em>${X.nM[k] ? `+${X.nM[k]} nel mese` : 'nessuno nel mese'}</em></button>`).join('')}</div>
        ${X.fix.length ? `<div class="m3-h4">Da sistemare <em>${X.fix.length}</em></div><div class="m3-rows">${X.fix.map(r => `<button type="button" class="m3-row" data-m3="go:${r[2]}"><i class="m3-pi m3-dt" style="--c:#d98a1c">${ic('alert')}</i><span class="tx"><b>${esc(r[0])}</b><small>${esc(r[3])}</small></span><span class="m3-chip a"><i></i>${r[1]}</span></button>`).join('')}</div>` : ''}
        <div class="m3-h4">${ty ? DOCT[ty][0] : 'Ultimi documenti'} <em>${N(L2.length)}</em></div>
        <div class="m3-rows">${L2.slice(0, 40).map(accRow).join('') || '<div class="m3-empty">Nessun documento</div>'}</div>
        <div class="m3-acts">${ty ? goBtn(DOCT[ty][2], 'Apri ' + DOCT[ty][0].toLowerCase(), 'pdf') : goBtn('vendite', 'Vendite', 'pdf') + goBtn('fatture', 'Fatture fornitori', 'pdf', 1)}<button type="button" class="m3-go ghost" data-acc="cont">${ic('chart')}Contabilità</button></div></div>`;
    }
    const ut = X.revM - X.costM, utP = X.revP - X.costP, ut12 = X.rev12 - X.cost12, sal = X.ivaD - X.ivaC, mx = Math.max(1, ...X.rev, ...X.cost);
    const dlt = (a, b, inv) => { if (!b) return ''; const p = (a - b) / Math.abs(b) * 100, up = p >= 0, good = inv ? !up : up; return `<span class="m3-dl ${good ? 'g' : 'r'}">${up ? '▲' : '▼'} ${Math.abs(p).toFixed(0)}%</span>`; };
    return head(ic('chart'), '', 'Amministrazione · 1° piano', 'Contabilità', 'Conto economico, IVA e scadenze dai documenti registrati', 1) + `<div class="m3-pb">
      <div class="m3-grid">${stat('Ricavi del mese', C.eur0(X.revM), '', `${dlt(X.revM, X.revP)} imponibile fatture`)}${stat('Costi del mese', C.eur0(X.costM), '', `${dlt(X.costM, X.costP, 1)} ${X.costFromRows ? 'righe di costo' : 'fatture fornitori'}`)}
      ${stat('Utile del mese', C.eur0(ut), '', X.revM ? `margine ${(ut / X.revM * 100).toFixed(0)}% · ${dlt(ut, utP)}` : 'nessun ricavo nel mese')}${stat('Utile 12 mesi', C.eur0(ut12), '', `ricavi ${C.eur0(X.rev12)}`)}</div>
      <div class="m3-h4">Ricavi e costi · ultimi 12 mesi</div>
      <div class="m3-rc">${X.rev.map((v, i) => `<div title="${esc(X.months[i])}: ricavi ${esc(C.eur0(v))} · costi ${esc(C.eur0(X.cost[i]))}"><span><i class="r" style="--h:${(v / mx * 100).toFixed(1)}%;--k:${i}"></i><i class="c" style="--h:${(X.cost[i] / mx * 100).toFixed(1)}%;--k:${i}"></i></span><small>${MS[Number(X.months[i].slice(5)) - 1]}</small></div>`).join('')}</div>
      <div class="m3-leg"><span><i style="background:#f47b20"></i>Ricavi</span><span><i style="background:#9aa0a8"></i>Costi</span></div>
      <div class="m3-h4">IVA · ${X.qN} trimestre <em>stima</em></div>
      <div class="m3-kv"><div><span>Sulle vendite (a debito)</span><b>${C.eur0(X.ivaD)}</b></div><div><span>Sugli acquisti (a credito)</span><b>${C.eur0(X.ivaC)}</b></div><div><span>${sal >= 0 ? 'Saldo da versare' : 'Saldo a credito'}</span><b style="color:${sal >= 0 ? '#f47b20' : '#2a8a4a'}">${C.eur0(Math.abs(sal))}</b></div></div>
      <p class="m3-note">Calcolata dalle fatture del trimestre (totale − imponibile). Verifica sempre con il commercialista.</p>
      <div class="m3-h4">Crediti e debiti</div>
      <div class="m3-grid">${stat('Da incassare', X.opV ? C.eur0(X.opV) : '—', '', X.lateV ? `${C.eur0(X.lateV)} scaduti` : 'niente di scaduto')}${stat('Da pagare', X.opF ? C.eur0(X.opF) : '—', '', X.lateF ? `${C.eur0(X.lateF)} scaduti` : 'niente di scaduto')}</div>
      <div class="m3-h4">Scadenze · 30 giorni <em>${X.sc.length}</em></div>
      <div class="m3-cf"><div><span>Entrate</span><b class="g">+${C.eur0(X.in30)}</b></div><div><span>Uscite</span><b class="r">−${C.eur0(X.out30)}</b></div><div><span>Saldo</span><b>${C.eur0(X.in30 - X.out30)}</b></div></div>
      <div class="m3-rows">${X.sc.slice(0, 25).map(s => `<${s.ofr ? `button type="button" data-ofr="${esc(s.ofr)}"` : 'div'} class="m3-row"><i class="m3-pi m3-dt" style="--c:${s.k === 'in' ? '#2a8a4a' : '#d9452f'}">${ic(s.k === 'in' ? 'down' : 'right')}</i><span class="tx"><b>${esc(s.name)}</b><small>${esc(['Fattura ' + (s.f.numero || '—'), (s.late ? 'scaduta il ' : 'scade il ') + C.dIt(s.d)].join(' · '))}</small></span><span class="m3-chip ${s.late ? 'r' : s.k === 'in' ? 'g' : 'a'}"><i></i>${s.k === 'in' ? '+' : '−'}${C.eur0(s.amt)}</span></${s.ofr ? 'button' : 'div'}>`).join('') || '<div class="m3-empty">Nessuna scadenza nei prossimi 30 giorni</div>'}</div>
      ${X.fix.length ? `<div class="m3-h4">Da sistemare <em>${X.fix.length}</em></div><div class="m3-rows">${X.fix.map(r => `<button type="button" class="m3-row" data-m3="go:${r[2]}"><i class="m3-pi m3-dt" style="--c:#d98a1c">${ic('alert')}</i><span class="tx"><b>${esc(r[0])}</b><small>${esc(r[3])}</small></span><span class="m3-chip a"><i></i>${r[1]}</span></button>`).join('')}</div>` : ''}
      <div class="m3-acts">${goBtn('incassi', 'Incassi', 'down')}${goBtn('fatture', 'Fatture fornitori', 'pdf', 1)}${goBtn('analisi', 'Analisi', 'chart', 1)}<button type="button" class="m3-go ghost" data-acc="doc">${ic('pdf')}Archivio documenti</button></div></div>`;
  }

  /* ---------------- v289: corriere GLS nella zona Spedizioni (postazione 3D, videowall, pannello completo) ---------------- */
  let GLS3 = null, GLSM = '';
  const glsOk = () => !!(C && C.gls && (!C.glsOn || C.glsOn()));
  const gN = v => C.num(v), gK = () => (C.gMul ? C.gMul() : 1);
  const gEu = v => C.eur0(gN(v) * gK());
  const MESL = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'], MESF = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  const mLab = m => m === 'tutto' ? 'Tutto il periodo' : MESF[Number(m.slice(5)) - 1].replace(/^./, c => c.toUpperCase()) + ' ' + m.slice(0, 4);
  const geoG = r => { try { if (C.glsGeo) return C.glsGeo(r); } catch {} const G2 = window.GLS_GEO; if (!G2) return null; const c = G2.CITY[String(r.citta || '').toUpperCase().trim() + '|' + String(r.prov || '').toUpperCase().trim()], p = G2.PROV[String(r.prov || '').toUpperCase().trim()]; return c ? { lat: c[0], lon: c[1] } : p ? { lat: p[0], lon: p[1] } : null; };
  const regG = r => { try { if (C.glsReg) return C.glsReg(r); } catch {} return r.regione || 'Altro'; };
  function glsData(mSel) {
    const all = C.gls() || [], months = [...new Set(all.map(r => r.mese).filter(Boolean))].sort();
    const m = mSel && (mSel === 'tutto' || months.includes(mSel)) ? mSel : months[months.length - 1] || '';
    const rows = m === 'tutto' ? all : all.filter(r => r.mese === m), sum = (a, f) => a.reduce((s, r) => s + gN(r[f]), 0), tot = a => sum(a, 'totale');
    const prevK = m && m !== 'tutto' ? months[months.indexOf(m) - 1] : null, prev = prevK ? all.filter(r => r.mese === prevK) : null;
    const T = tot(rows), n = rows.length, colli = sum(rows, 'colli'), kr = sum(rows, 'kgReali'), kt = sum(rows, 'kgTass');
    const gg = rows.filter(r => r.gg !== '' && r.gg != null).map(r => gN(r.gg)), ggAvg = gg.length ? gg.reduce((a, b) => a + b, 0) / gg.length : 0;
    const by = (f) => { const M2 = new Map(); rows.forEach(r => { const k = f(r); if (!M2.has(k)) M2.set(k, []); M2.get(k).push(r); }); return M2; };
    const dest = [...by(r => r.citta + '|' + r.prov)].map(([k, v]) => ({ k, c: v[0].citta, p: v[0].prov, v, t: tot(v), n: v.length, geo: geoG(v[0]) })).sort((a, b) => b.t - a.t);
    const reg = [...by(regG)].map(([k, v]) => ({ k, t: tot(v), n: v.length })).sort((a, b) => b.t - a.t);
    const con = ['C1', 'C2'].map(c => { const v = rows.filter(r => r.contratto === c); return { c, n: v.length, t: tot(v), colli: sum(v, 'colli'), kt: sum(v, 'kgTass') }; });
    const comp = [['Nolo', sum(rows, 'nolo')], ['Carburante', sum(rows, 'fuel')], ['Supplementi', sum(rows, 'suppl')]];
    const ser = months.slice(-12).map(k => ({ k, t: tot(all.filter(r => r.mese === k)), n: all.filter(r => r.mese === k).length }));
    let chk = []; try { chk = C.glsChecks ? C.glsChecks(rows) : []; } catch { chk = []; }
    const fatt = (() => { try { const c = C.cfg && C.cfg('glsFatt'); return c && typeof c === 'object' ? c : {}; } catch { return {}; } })();
    const cdc = [...by(r => r.cdc || '—')].map(([k, v]) => ({ k, nome: v[0].cdcNome || '', t: tot(v), n: v.length, rd: v[0].riaddebito || '' })).sort((a, b) => b.t - a.t);
    const last = rows.slice().sort((a, b) => String(b.data).localeCompare(String(a.data)) || String(b.nsped).localeCompare(String(a.nsped)));
    return { all, months, m, rows, T, n, colli, kr, kt, prevT: prev ? tot(prev) : 0, prevK, ggAvg, in24: gg.length ? gg.filter(x => x <= 1).length / gg.length : 0, in48: gg.length ? gg.filter(x => x <= 2).length / gg.length : 0, nGg: gg.length,
      dest, reg, con, comp, ser, chk, fatt, cdc, last, vol: kr ? (kt / kr - 1) * 100 : 0, nLoc: dest.length, nReg: reg.length };
  }
  const strip = s => String(s || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  // proiezione dell'Italia (lon 6.5–18.7, lat 36.5–47.2)
  const itP = (lat, lon, x0, y0, w, h) => { const sx = (lon - 6.5) / 12.2, sy = (47.2 - lat) / 10.7; return [x0 + sx * w, y0 + sy * h]; };
  const ROMA = [41.902, 12.496];
  function glsScreen(S, page, u) {
    const g = S.cv.getContext('2d'), w = S.cv.width, h = S.cv.height, X = S.X, F = 'Inter, system-ui, sans-serif';
    g.fillStyle = '#0f1216'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#171b21'; g.fillRect(0, 0, w, 66);
    g.fillStyle = '#f2c418'; g.beginPath(); g.roundRect(24, 18, 30, 30, 7); g.fill(); g.fillStyle = '#0f1216'; g.font = `900 17px ${F}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('C', 39, 34);
    g.textAlign = 'left'; g.font = `800 25px ${F}`; g.fillStyle = '#fff'; g.fillText('CORRIERE · GLS', 66, 34);
    g.font = `600 20px ${F}`; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText([X.m ? mLab(X.m) : 'Nessun mese caricato', 'Andamento e contratti', 'Consegne e controlli'][page], 290, 35);
    g.textAlign = 'right'; g.fillStyle = (Math.floor(u * 6) % 2) ? '#5df08a' : '#2e7d4a'; g.beginPath(); g.arc(w - 112, 34, 7, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.75)'; g.font = `700 19px ${F}`; g.fillText('LIVE', w - 28, 35);
    g.fillStyle = '#f2c418'; g.fillRect(0, 64, w * u, 3);
    for (let i = 0; i < 3; i++) { g.fillStyle = i === page ? '#f2c418' : 'rgba(255,255,255,.18)'; g.fillRect(w / 2 - 54 + i * 40, h - 14, 32, 5); }
    const kp = (x, y, l, v, c, s) => { g.textAlign = 'left'; g.font = `600 17px ${F}`; g.fillStyle = 'rgba(255,255,255,.5)'; g.fillText(l, x, y); g.font = `800 38px ${F}`; g.fillStyle = c || '#fff'; g.fillText(v, x, y + 38); if (s) { g.font = `600 15px ${F}`; g.fillStyle = 'rgba(255,255,255,.42)'; g.fillText(s, x, y + 68); } };
    if (!X.n) { g.textAlign = 'center'; g.font = `700 30px ${F}`; g.fillStyle = 'rgba(255,255,255,.75)'; g.fillText('Nessuna spedizione caricata', w / 2, h / 2 - 10); g.font = `600 19px ${F}`; g.fillStyle = 'rgba(255,255,255,.45)'; g.fillText('Importa il resoconto del mese nella sezione GLS', w / 2, h / 2 + 26); S.tex.needsUpdate = true; return; }
    if (page === 0) {
      const mx0 = 40, my0 = 86, mw = 380, mh = 440, G2 = window.GLS_GEO;
      if (G2) Object.values(G2.PROV).forEach(p => { const [x, y] = itP(p[0], p[1], mx0, my0, mw, mh); g.fillStyle = 'rgba(255,255,255,.16)'; g.beginPath(); g.arc(x, y, 3.2, 0, 7); g.fill(); });
      const [ox, oy] = itP(ROMA[0], ROMA[1], mx0, my0, mw, mh), mxT = Math.max(1, ...X.dest.map(d => d.t)), D2 = X.dest.filter(d => d.geo).slice(0, 18);
      D2.forEach((d, i) => { const [x, y] = itP(d.geo.lat, d.geo.lon, mx0, my0, mw, mh), k = Math.min(1, Math.max(0, u * 2.2 - i * .06)), L2 = Math.hypot(x - ox, y - oy); if (L2 < 4) return;
        const cx = (ox + x) / 2 - (y - oy) / L2 * Math.min(60, L2 * .3), cy = (oy + y) / 2 + (x - ox) / L2 * Math.min(60, L2 * .3);
        g.strokeStyle = `rgba(242,196,24,${.25 + .5 * Math.sqrt(d.t / mxT)})`; g.lineWidth = 1.2 + 2.4 * Math.sqrt(d.t / mxT); g.beginPath(); g.moveTo(ox, oy); const N2 = 24; for (let j = 1; j <= N2 * k; j++) { const s = j / N2, a = (1 - s) * (1 - s), b = 2 * (1 - s) * s, c = s * s; g.lineTo(a * ox + b * cx + c * x, a * oy + b * cy + c * y); } g.stroke();
        if (k > .02 && k < 1) { const s = k, a = (1 - s) * (1 - s), b = 2 * (1 - s) * s, c = s * s; g.fillStyle = '#fff'; g.beginPath(); g.arc(a * ox + b * cx + c * x, a * oy + b * cy + c * y, 3.5, 0, 7); g.fill(); } });
      D2.forEach((d, i) => { const [x, y] = itP(d.geo.lat, d.geo.lon, mx0, my0, mw, mh), r = 4 + 12 * Math.sqrt(d.t / mxT), k = Math.min(1, Math.max(0, u * 2.2 - i * .06 - .3) * 3); if (k <= 0) return; g.fillStyle = 'rgba(242,196,24,.25)'; g.beginPath(); g.arc(x, y, r * k + 4, 0, 7); g.fill(); g.fillStyle = '#f2c418'; g.beginPath(); g.arc(x, y, r * k, 0, 7); g.fill();
        if (i < 5) { g.font = `700 14px ${F}`; g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText(String(d.c).slice(0, 14), x + r + 6, y + 5); } });
      const pr = 8 + Math.sin(u * 40) * 2; g.fillStyle = 'rgba(244,123,32,.3)'; g.beginPath(); g.arc(ox, oy, pr + 7, 0, 7); g.fill(); g.fillStyle = '#f47b20'; g.beginPath(); g.arc(ox, oy, 8, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = `800 15px ${F}`; g.textAlign = 'right'; g.fillText('ROMA', ox - 14, oy + 5);
      const d0 = X.prevT ? (X.T / X.prevT - 1) * 100 : null;
      kp(500, 100, 'Costo spedizioni', gEu(X.T), '#f2c418', d0 == null ? (C.ivaLbl ? C.ivaLbl() : '') : `${d0 >= 0 ? '▲' : '▼'} ${Math.abs(d0).toFixed(0)}% sul mese prima`);
      kp(500, 214, 'Spedizioni', N(X.n), '#fff', `${N(X.colli)} colli · ${X.nLoc} località`);
      kp(760, 214, 'Medio spedizione', gEu(X.T / Math.max(1, X.n)), '#fff', `${(X.T * gK() / Math.max(1, X.kt)).toFixed(2).replace('.', ',')} €/kg tass.`);
      kp(500, 328, 'Peso tassabile', N(Math.round(X.kt)) + ' kg', '#fff', `${X.vol >= 0 ? '+' : ''}${X.vol.toFixed(0)}% sul reale`);
      kp(760, 328, 'Consegna media', X.nGg ? X.ggAvg.toFixed(1).replace('.', ',') + ' gg' : '—', '#5df08a', X.nGg ? `${Math.round(X.in48 * 100)}% entro 48 ore` : 'giorni non registrati');
      g.textAlign = 'left'; g.font = `700 16px ${F}`; g.fillStyle = 'rgba(255,255,255,.55)'; g.fillText('Destinazioni principali', 500, 456);
      X.dest.slice(0, 3).forEach((d, i) => { g.font = `700 17px ${F}`; g.fillStyle = '#fff'; g.fillText(`${i + 1}. ${String(d.c).slice(0, 18)} (${d.p})`, 500, 486 + i * 26); g.textAlign = 'right'; g.fillStyle = '#f2c418'; g.fillText(gEu(d.t), w - 40, 486 + i * 26); g.textAlign = 'left'; });
    } else if (page === 1) {
      const S2 = X.ser, mx = Math.max(1, ...S2.map(s => s.t)), x0 = 40, x1 = 620, y1 = h - 70, y0 = 110, bw = (x1 - x0) / Math.max(1, S2.length);
      g.textAlign = 'left'; g.font = `700 17px ${F}`; g.fillStyle = 'rgba(255,255,255,.55)'; g.fillText('Costo per mese', x0, 96);
      S2.forEach((s, i) => { const k = Math.min(1, Math.max(0, u * 3 - i * .08)), hh = (y1 - y0) * s.t / mx * k; g.fillStyle = s.k === X.m ? '#f2c418' : '#5b4a14'; g.beginPath(); g.roundRect(x0 + i * bw + bw * .18, y1 - hh, bw * .64, hh, 5); g.fill();
        g.fillStyle = 'rgba(255,255,255,.45)'; g.font = `600 14px ${F}`; g.textAlign = 'center'; g.fillText(MESL[Number(s.k.slice(5)) - 1], x0 + i * bw + bw / 2, y1 + 22); });
      const cT = X.con.reduce((s, c) => s + c.t, 0) || 1; let cx = 680; g.textAlign = 'left'; g.font = `700 17px ${F}`; g.fillStyle = 'rgba(255,255,255,.55)'; g.fillText('Contratti', 680, 96);
      X.con.forEach((c, i) => { const ww = (w - 720) * c.t / cT * Math.min(1, u * 3); g.fillStyle = i ? '#7fb6d6' : '#f2c418'; g.fillRect(cx, 112, ww, 18); cx += ww; });
      X.con.forEach((c, i) => { const y = 170 + i * 120; g.fillStyle = i ? '#7fb6d6' : '#f2c418'; g.fillRect(680, y - 4, 6, 92); kp(700, y, i ? 'C2 · pesante e pedane' : 'C1 · pacchi', gEu(c.t), '#fff', `${c.n} sped. · ${N(c.colli)} colli · ${c.kt ? (c.t * gK() / c.kt).toFixed(2).replace('.', ',') : '—'} €/kg`); });
      const ct = X.comp.reduce((s, c) => s + c[1], 0) || 1; let px = 680; g.fillStyle = 'rgba(255,255,255,.55)'; g.font = `700 16px ${F}`; g.fillText('Composizione del costo', 680, 432);
      X.comp.forEach((c, i) => { const ww = (w - 720) * c[1] / ct; g.fillStyle = ['#f2c418', '#f47b20', '#9aa0a8'][i]; g.fillRect(px, 446, ww, 14); px += ww; });
      g.font = `600 15px ${F}`; X.comp.forEach((c, i) => { g.fillStyle = ['#f2c418', '#f47b20', '#9aa0a8'][i]; g.fillText(`${c[0]} ${Math.round(c[1] / ct * 100)}%`, 680 + i * 120, 488); });
    } else {
      kp(40, 100, 'Entro 24 ore', X.nGg ? Math.round(X.in24 * 100) + '%' : '—', '#5df08a', `${X.nGg} consegne registrate`);
      kp(260, 100, 'Entro 48 ore', X.nGg ? Math.round(X.in48 * 100) + '%' : '—', '#5df08a', `media ${X.nGg ? X.ggAvg.toFixed(1).replace('.', ',') : '—'} giorni`);
      const fm = X.m && X.m !== 'tutto' ? X.fatt[X.m] : null;
      kp(480, 100, 'Fattura del mese', X.m === 'tutto' ? '—' : fm ? 'Emessa' : 'Da emettere', fm ? '#5df08a' : '#ff9a6b', 'riaddebito ai centri di costo');
      g.textAlign = 'left'; g.font = `700 17px ${F}`; g.fillStyle = 'rgba(255,255,255,.55)'; g.fillText(X.chk.length ? `Da controllare · ${X.chk.length}` : 'Controlli', 40, 230);
      if (!X.chk.length) { g.font = `700 24px ${F}`; g.fillStyle = '#5df08a'; g.fillText('✓ Nessuna anomalia nel periodo', 40, 276); }
      X.chk.slice(0, 4).forEach((c, i) => { const y = 248 + i * 66, k = Math.min(1, Math.max(0, u * 4 - i * .3)); g.globalAlpha = k; g.fillStyle = '#171b21'; g.beginPath(); g.roundRect(40, y, w - 80, 56, 10); g.fill(); g.fillStyle = c.t === 'warn' ? '#ff9a6b' : '#7fb6d6'; g.fillRect(40, y, 6, 56);
        g.font = `700 19px ${F}`; g.fillStyle = '#fff'; g.fillText(strip(c.h).slice(0, 48), 60, y + 24); g.font = `600 14px ${F}`; g.fillStyle = 'rgba(255,255,255,.5)'; g.fillText(strip(c.d).slice(0, 92), 60, y + 45); g.textAlign = 'right'; g.font = `800 19px ${F}`; g.fillStyle = c.t === 'warn' ? '#ff9a6b' : '#7fb6d6'; g.fillText(strip(c.v).slice(0, 20), w - 56, y + 34); g.textAlign = 'left'; g.globalAlpha = 1; });
    }
    S.tex.needsUpdate = true;
  }
  function buildGls() {
    GLS3 = null; if (!glsOk()) return;
    const z = L.items.find(i => i.t === 'zone' && i.k === 'spe'); if (!z) return;
    const b = box2(z), zw = b.x1 - b.x0, zd = b.z1 - b.z0, alongZ = zd >= zw, W2 = Math.min(9.6, (alongZ ? zw : zd) - .6), DEP = 6.4;
    if (W2 < 5 || (alongZ ? zd : zw) < DEP + 4) return;
    if (!window.GLS_GEO && C.glsLoadGeo && !buildGls.ld) { buildGls.ld = 1; Promise.resolve(C.glsLoadGeo()).then(() => { if (GLS3) GLS3.X = glsData(GLSM); }).catch(() => {}); }
    const X = glsData(GLSM), g = new T.Group(); WH.add(g);
    if (alongZ) { g.position.set((b.x0 + b.x1) / 2, .5, b.z1 - .25); } else { g.position.set(b.x1 - .25, .5, (b.z0 + b.z1) / 2); g.rotation.y = -Math.PI / 2; }
    const B = new Batch(g), hw2 = W2 / 2, lite = Q && Q.tier === 0;
    // pavimento della postazione: area gialla con bordo e scritta
    B.add('gfl', G.box, mat(0xffffff), m4(0, .012, -DEP / 2, W2, .01, DEP), 0xfbf1cf);
    for (const [x, zz, sx, sz] of [[0, -DEP + .05, W2, .1], [0, -.05, W2, .1], [-hw2 + .05, -DEP / 2, .1, DEP], [hw2 - .05, -DEP / 2, .1, DEP]]) B.add('gbd', G.box, mat(0xf2c418), m4(x, .022, zz, sx, .012, sz));
    // videowall su due piedi, rivolto verso il centro del magazzino
    const vw = Math.min(W2 - 1.2, 5.4), vh = vw * .54;
    bxS(g, vw + .24, vh + .24, .14, 0x1b1d20, 0, 1.15, -DEP + .3); for (const s of [-1, 1]) { bxS(g, .12, 1.2, .12, 0x3a3f46, s * vw * .36, 0, -DEP + .3); bxS(g, .5, .05, .5, 0x3a3f46, s * vw * .36, 0, -DEP + .3, { ns: 1 }); }
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 552; const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4; OWN.push(tex);
    const sm = new T.MeshBasicMaterial({ map: tex }); OWN.push(sm); const scr = new T.Mesh(G.plane, sm); scr.scale.set(vw, vh, 1); scr.position.set(0, 1.27 + vh / 2, -DEP + .3 + .08); g.add(scr);
    // banco del corriere con stampante etichette, monitor, lettore; operatore
    const cx = -hw2 + 1.6, cz = -3.5;
    bxS(g, 2.6, .95, .8, 0xf4f5f6, cx, 0, cz); bxS(g, 2.7, .05, .9, 0x2b2f35, cx, .95, cz); bxS(g, 2.6, .9, .03, 0xf2c418, cx, .03, cz + .415, { ns: 1 });
    bxS(g, .42, .3, .36, 0xe9eaec, cx + .7, 1.0, cz); bxS(g, .3, .015, .1, 0x2b3440, cx + .7, 1.3, cz + .12, { ns: 1 });
    const lab = new T.Mesh(G.box, mat(0xffffff)); lab.scale.set(.22, .004, .16); lab.position.set(cx + .7, 1.21, cz + .2); g.add(lab);
    bxS(g, .6, .38, .03, 0x1d1f22, cx - .5, 1.2, cz - .22); B.add('gms', G.box, new T.MeshBasicMaterial({ color: 0xfff3b8 }), m4(cx - .5, 1.39, cz - .2, .54, .32, .01)); bxS(g, .05, .2, .05, 0x1d1f22, cx - .5, 1.0, cz - .22);
    if (!lite) { const p = person(g, cx, cz - .75, 0xf2c418, null, { mode: 'scan' }); p.position.y = 0; movers.push({ o: p, t: 'bob', ph: 31 }); }
    // bilancia a pavimento con collo e display che conta i kg
    const sx = cx + 2.2, sz2 = cz + .1; bxS(g, 1.0, .08, 1.0, 0x8e959e, sx, 0, sz2); bxS(g, .96, .012, .96, 0xc5cad1, sx, .08, sz2, { ns: 1 }); bxS(g, .06, 1.1, .06, 0x3a3f46, sx + .55, 0, sz2 - .45);
    const kcv = document.createElement('canvas'); kcv.width = 128; kcv.height = 56; const ktx = new T.CanvasTexture(kcv); ktx.colorSpace = T.SRGBColorSpace; OWN.push(ktx); const km = new T.MeshBasicMaterial({ map: ktx }); OWN.push(km);
    bxS(g, .34, .2, .1, 0x1d1f22, sx + .55, 1.1, sz2 - .45); const kd = new T.Mesh(G.plane, km); kd.scale.set(.3, .13, 1); kd.position.set(sx + .55, 1.2, sz2 - .395); g.add(kd);
    const sbox = new T.Group(); sbox.position.set(sx, .095, sz2); g.add(sbox); const sbm = new T.Mesh(G.box, M.carton || mat(0xe2b27a)); sbm.scale.set(.6, .42, .5); sbm.position.y = .21; sbox.add(sbm); const sbl = new T.Mesh(G.box, mat(0xffffff)); sbl.scale.set(.22, .005, .16); sbl.position.set(.08, .4225, .05); sbox.add(sbl);
    // rulliera verso le gabbie
    const rx0 = cx + 2.9, rx1 = hw2 - .7, rz = -1.9, rl = rx1 - rx0;
    if (rl > 1.4) { for (const s of [-1, 1]) bxS(g, rl, .08, .06, 0x8e959e, (rx0 + rx1) / 2, .62, rz + s * .32); for (let x = rx0 + .1; x < rx1; x += .16) B.add('grl', G.box, mat(0xc5cad1), m4(x, .69, rz, .05, .05, .6)); for (const x of [rx0 + .2, rx1 - .2]) for (const s of [-1, 1]) bxS(g, .05, .62, .05, 0x3a3f46, x, 0, rz + s * .3); }
    const parcels = []; if (rl > 1.4) for (let i = 0; i < (lite ? 2 : 4); i++) { const pg = new T.Group(); g.add(pg); const m1 = new T.Mesh(G.box, M.carton || mat(0xe2b27a)); const s = .32 + (i % 3) * .07; m1.scale.set(s, s * .7, s * .85); m1.position.y = s * .35; pg.add(m1); const l2 = new T.Mesh(G.box, mat(0xffffff)); l2.scale.set(s * .45, .005, s * .35); l2.position.set(0, s * .7 + .003, 0); pg.add(l2); parcels.push({ g: pg, ph: i / (lite ? 2 : 4) }); }
    // gabbie dei contratti: C1 pacchi, C2 pedane
    const c1 = X.con[0], c2 = X.con[1], cg = (x, lbl, col, n, ped) => {
      const w = 1.2, d = .9, h = 1.7, zc = -.75; bxS(g, w, .06, d, 0x8e959e, x, .12, zc); for (const [wx, wz] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) B.add('gcu', G.box, mat(0x9aa0a8), m4(x + wx, .12 + h / 2, zc + wz, .035, h, .035));
      for (let y = .4; y < h; y += .32) { B.add('gcw', G.box, mat(0xb9bec5), m4(x, .12 + y, zc - d / 2, w, .012, .012)); B.add('gcw', G.box, mat(0xb9bec5), m4(x - w / 2, .12 + y, zc, .012, .012, d)); B.add('gcw', G.box, mat(0xb9bec5), m4(x + w / 2, .12 + y, zc, .012, .012, d)); }
      for (const wx of [-.4, 0, .4]) B.add('gcw', G.box, mat(0xb9bec5), m4(x + wx, .12 + h / 2, zc - d / 2, .012, h, .012));
      for (const [wx, wz] of [[-.45, -.35], [.45, -.35], [-.45, .35], [.45, .35]]) B.add('gwh', G.cyl, mat(0x2b2f35), m4(x + wx, .06, zc + wz, .1, .08, .1));
      if (ped) { const k = Math.min(1, n / 25); if (n) { B.add('gpl', G.box, mat(0xc9a273), m4(x, .22, zc, 1.0, .12, .8)); const hh = .3 + 1.0 * k; B.add('gpk', G.box, mat(0xd9b07a), m4(x, .28 + hh / 2, zc, .92, hh, .72)); B.add('gpf', G.box, new T.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: .35 }), m4(x, .28 + hh / 2, zc, .95, hh + .02, .75)); } }
      else { const nb = Math.min(18, Math.ceil(n / 4)); for (let i = 0; i < nb; i++) { const cx2 = x - .36 + (i % 3) * .36, cy = .18 + Math.floor(i / 6) * .3, cz2 = zc - .22 + (Math.floor(i / 3) % 2) * .44; B.add('gbx', G.box, mat(0xffffff), m4(cx2, cy + .14, cz2, .32, .28, .38), mixC(0xe2b27a, 0xffffff, (i % 3) * .08)); } }
      const t = textTex([[lbl, 28, 800, 38, null, '#16181b'], [`${n} spedizioni nel mese`, 20, 600, 74, null, '#5b5e63']], { bg: hexC(col), w: 320, h: 100, round: 10 }); const pl = planeT(t, 1.2, .38, g, x, 2.15, zc + d / 2 + .02, {}); pl.renderOrder = 2;
      bxS(g, 1.24, .42, .03, 0x1d1f22, x, 1.93, zc + d / 2 - .02, { ns: 1 });
    };
    const gx1 = hw2 - 2.1, gx2 = hw2 - .8; cg(gx1 - .35, 'C1 · Pacchi', 0xf2c418, c1.n, 0); cg(gx2 + .05 > hw2 - .6 ? gx2 - .1 : gx2, 'C2 · Pedane', 0x7fb6d6, c2.n, 1);
    // scatole vuote, nastro, insegna sospesa
    B.add('gst', G.box, mat(0xd9b07a), m4(-hw2 + .5, .3, -1.0, .6, .6, .6)); B.add('gst', G.box, mat(0xe2b27a), m4(-hw2 + .5, .85, -1.0, .5, .5, .5)); B.add('gst', G.box, mat(0xd9b07a), m4(-hw2 + 1.15, .25, -.9, .5, .5, .55));
    const sg = textTex([['CORRIERE', 44, 900, 50, null, '#16181b'], ['GLS · ritiri e spedizioni', 24, 700, 96, null, '#16181b']], { bg: '#f2c418', w: 512, h: 128, round: 12 });
    const sgp = planeT(sg, 2.4, .6, g, cx, 3.25, cz - .1, {}); sgp.renderOrder = 2; for (const s of [-1, 1]) bxS(g, .02, .9, .02, 0x3a3f46, cx + s * 1.0, 3.55, cz - .1, { ns: 1 });
    B.flush();
    floorText(g, 'CORRIERE', Math.min(W2 * .6, 4.2), hw2 - 2.4, -DEP + 1.6, 0, 'rgba(180,140,0,.4)');
    const hb = new T.Mesh(G.box, M.hit); hb.scale.set(W2, 3.2, DEP); hb.position.set(0, 1.6, -DEP / 2); hb.userData.k = { t: 'gls' }; g.add(hb); pick.push(hb);
    const wp = new T.Vector3(0, 0, -DEP / 2); g.localToWorld(wp);
    GLS3 = { g, X, cv, tex, kcv, ktx, sbox, lab, parcels, rx0, rx1, rz, last: -1, wp, ry: g.rotation.y };
    glsScreen(GLS3, 0, 0);
  }
  function glsTick(t, dt) {
    const S = GLS3; if (!S) return;
    const per = 9, page = Math.floor(t / per) % 3, u = (t % per) / per, q = Math.floor(t * 7);
    if (q !== S.last) { S.last = q; glsScreen(S, page, u);
      const cyc = (t % 6) / 6, on = cyc > .15 && cyc < .85, kg = on ? 4.2 + Math.sin(Math.floor(t / 6) * 7.3) * 2.6 : 0, g2 = S.kcv.getContext('2d'); g2.fillStyle = '#0f1a14'; g2.fillRect(0, 0, 128, 56); g2.fillStyle = on ? '#5df08a' : '#2e5a3c'; g2.font = '700 30px ui-monospace, Menlo, monospace'; g2.textAlign = 'right'; g2.textBaseline = 'middle'; g2.fillText(on ? (Math.min(1, (cyc - .15) / .2) * kg).toFixed(2) : '0.00', 100, 30); g2.font = '700 14px Inter, sans-serif'; g2.fillText('kg', 124, 34); S.ktx.needsUpdate = true; }
    const cyc = (t % 6) / 6; S.sbox.visible = cyc > .12 && cyc < .9; S.sbox.position.y = .095 + (cyc < .15 ? (1 - (cyc - .12) / .03) * .3 : 0);
    const lc = (t % 4.5) / 4.5; S.lab.position.z = -3.3 + Math.min(1, lc / .5) * .14; S.lab.visible = lc < .9;
    S.parcels.forEach(p => { const f = ((t / 7) + p.ph) % 1; p.g.position.set(S.rx0 + .2 + (S.rx1 - S.rx0 - .4) * f, .72, S.rz); p.g.visible = f > .02 && f < .97; p.g.rotation.y = Math.sin(f * 9 + p.ph * 6) * .05; });
  }
  // pannello
  function glsMapSvg(X) {
    const G2 = window.GLS_GEO, w = 220, h = 250, P2 = (la, lo) => itP(la, lo, 6, 6, w - 12, h - 12), [ox, oy] = P2(ROMA[0], ROMA[1]), mx = Math.max(1, ...X.dest.map(d => d.t));
    const dots = G2 ? Object.values(G2.PROV).map(p => { const [x, y] = P2(p[0], p[1]); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.1" class="d"/>`; }).join('') : '';
    const D2 = X.dest.filter(d => d.geo).slice(0, 24);
    const arcs = D2.map((d, i) => { const [x, y] = P2(d.geo.lat, d.geo.lon), L2 = Math.hypot(x - ox, y - oy); if (L2 < 3) return ''; const b = Math.min(26, L2 * .3), cx = (ox + x) / 2 - (y - oy) / L2 * b, cy = (oy + y) / 2 + (x - ox) / L2 * b; return `<path d="M${ox.toFixed(1)} ${oy.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}" pathLength="1" class="a" style="--k:${i};stroke-width:${(.6 + 1.8 * Math.sqrt(d.t / mx)).toFixed(2)}"/>`; }).join('');
    const pins = D2.map((d, i) => { const [x, y] = P2(d.geo.lat, d.geo.lon), r = 2 + 6 * Math.sqrt(d.t / mx); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" class="p" style="--k:${i}"><title>${esc(d.c)} (${esc(d.p)}) · ${esc(gEu(d.t))} · ${d.n} sped.</title></circle>`; }).join('');
    return `<svg viewBox="0 0 ${w} ${h}" class="m3-itm">${dots}${arcs}${pins}<circle cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" r="9" class="o2"/><circle cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" r="4.5" class="o"/><text x="${(ox - 8).toFixed(1)}" y="${(oy + 3).toFixed(1)}" text-anchor="end">Roma</text></svg>`;
  }
  function glsPanel(Pn) {
    if (!glsOk()) return '';
    const X = glsData(Pn.m || GLSM), q = String(Pn.q || '').trim().toLowerCase(), mx = Math.max(1, ...X.ser.map(s => s.t));
    if (X.m && X.m !== GLSM && !Pn.m) GLSM = X.m;
    const chips = [...X.months.slice(-6).reverse(), ...(X.months.length > 1 ? ['tutto'] : [])].map(m => `<button type="button" data-gls="${m}" class="${m === X.m ? 'on' : ''}">${m === 'tutto' ? 'Tutto' : MESL[Number(m.slice(5)) - 1] + ' ' + m.slice(2, 4)}</button>`).join('');
    const hd = head(`<span class="m3-gl">C</span>`, '', 'Spedizioni · corriere', 'Corriere GLS', X.n ? `${esc(mLab(X.m))} · ${X.n} spedizioni · ${C.ivaLbl ? esc(C.ivaLbl()) : ''}` : 'nessuna spedizione caricata', 1);
    if (!X.n) return hd + `<div class="m3-pb"><div class="m3-empty">Importa il resoconto del mese nella sezione GLS: qui compaiono costi, destinazioni, contratti e controlli.</div><div class="m3-acts">${goBtn('gls', 'Apri la sezione GLS', 'truck')}</div></div>`;
    const d0 = X.prevT ? (X.T / X.prevT - 1) * 100 : null, cT = X.con.reduce((s, c) => s + c.t, 0) || 1, ct = X.comp.reduce((s, c) => s + c[1], 0) || 1, mR = Math.max(1, ...X.reg.map(r => r.t)), mD = Math.max(1, ...X.dest.map(r => r.t));
    const L2 = q ? X.rows.filter(r => `${r.destinatario} ${r.citta} ${r.prov} ${r.nsped} ${r.rif}`.toLowerCase().includes(q)) : X.last;
    const fm = X.m !== 'tutto' ? X.fatt[X.m] : null;
    const shipRow = r => `<div class="m3-row m3-gsr"><i class="m3-pi m3-dt" style="--c:${r.contratto === 'C2' ? '#2f6db4' : '#b58a00'}">${esc(r.contratto || '—')}</i><span class="tx"><b>${esc(r.destinatario || '—')}</b><small>${esc([C.dIt(r.data), `${r.citta} (${r.prov})`, `${gN(r.colli)} colli · ${N(gN(r.kgTass))} kg`, r.nsped].filter(Boolean).join(' · '))}</small></span><span class="m3-gsv"><b>${esc(gEu(r.totale))}</b>${r.gg === '' || r.gg == null ? '<em class="a">consegna ?</em>' : `<em class="${gN(r.gg) <= 2 ? 'g' : 'a'}">${gN(r.gg)} gg</em>`}</span></div>`;
    return hd + `<div class="m3-pb">
      <div class="m3-gch">${chips}</div>
      <div class="m3-ghero"><div><span>Costo spedizioni</span><b>${esc(gEu(X.T))}</b><em>${d0 == null ? `${X.nLoc} località · ${X.nReg} regioni` : `<i class="${d0 > 0 ? 'up' : 'dn'}">${d0 > 0 ? '▲' : '▼'} ${Math.abs(d0).toFixed(0)}%</i> sul mese prima · ${X.nLoc} località`}</em></div>${glsMapSvg(X)}</div>
      <div class="m3-grid">${stat('Spedizioni', N(X.n), '', `${N(X.colli)} colli · ${(X.colli / X.n).toFixed(1).replace('.', ',')} per sped.`)}${stat('Medio spedizione', esc(gEu(X.T / X.n)), '', `${esc(gEu(X.T / Math.max(1, X.colli)))} a collo`)}
      ${stat('Peso tassabile', N(Math.round(X.kt)), 'kg', `${X.vol >= 0 ? '+' : ''}${X.vol.toFixed(0)}% sul reale · ${(X.T * gK() / Math.max(1, X.kt)).toFixed(2).replace('.', ',')} €/kg`)}${stat('Consegna media', X.nGg ? X.ggAvg.toFixed(1).replace('.', ',') : '—', X.nGg ? 'gg' : '', X.nGg ? `${Math.round(X.in24 * 100)}% in 24 h · ${Math.round(X.in48 * 100)}% in 48 h` : 'giorni non registrati', X.nGg ? X.in48 : null)}</div>
      ${X.m !== 'tutto' ? `<div class="m3-chips"><span class="m3-chip ${fm ? 'g' : 'a'}"><i></i>${fm ? 'Fattura del mese emessa' : 'Fattura del mese da emettere'}</span>${X.chk.length ? `<span class="m3-chip r"><i></i>${X.chk.length} da controllare</span>` : '<span class="m3-chip g"><i></i>nessuna anomalia</span>'}</div>` : ''}
      <div class="m3-h4">Contratti</div>
      <div class="m3-gsp">${X.con.map((c, i) => `<i class="c${i}" style="flex:${Math.max(c.t, cT * .03)}"></i>`).join('')}</div>
      <div class="m3-gct">${X.con.map((c, i) => `<div><span><i class="c${i}"></i>${i ? 'C2 · pesante e pedane' : 'C1 · pacchi'}</span><b>${esc(gEu(c.t))}<em>${Math.round(c.t / cT * 100)}%</em></b><small>${c.n} sped. · ${N(c.colli)} colli · ${c.kt ? (c.t * gK() / c.kt).toFixed(2).replace('.', ',') + ' €/kg' : '—'}</small></div>`).join('')}</div>
      <div class="m3-h4">Composizione del costo</div>
      <div class="m3-gsp t">${X.comp.map((c, i) => `<i class="k${i}" style="flex:${Math.max(c[1], ct * .02)}"></i>`).join('')}</div>
      <div class="m3-leg">${X.comp.map((c, i) => `<span><i class="m3-gk${i}"></i>${c[0]} ${Math.round(c[1] / ct * 100)}% · ${esc(gEu(c[1]))}</span>`).join('')}</div>
      ${X.ser.length > 1 ? `<div class="m3-h4">Andamento mensile</div><div class="m3-b14 m3-b12" style="grid-template-columns:repeat(${X.ser.length},1fr)">${X.ser.map((s, i) => `<div title="${esc(mLab(s.k))}: ${esc(gEu(s.t))} · ${s.n} sped." data-gls="${s.k}" style="cursor:pointer"><i style="--h:${(s.t / mx * 100).toFixed(1)}%;--k:${i}"${s.k === X.m ? ' class="c"' : ''}></i><small>${MESL[Number(s.k.slice(5)) - 1].slice(0, 1).toUpperCase()}</small></div>`).join('')}</div>` : ''}
      <div class="m3-h4">Destinazioni principali <em>${X.nLoc}</em></div>
      <div class="m3-hb">${X.dest.slice(0, 8).map((d, i) => `<div style="--k:${i}"><span><b>${i + 1}. ${esc(d.c)} (${esc(d.p)})</b><small>${d.n} sped. · ${esc(gEu(d.t))}</small></span><u><i style="--w:${(d.t / mD * 100).toFixed(1)}%;--c:#e0b100"></i></u></div>`).join('')}</div>
      <div class="m3-h4">Regioni <em>${X.nReg}</em></div>
      <div class="m3-hb">${X.reg.slice(0, 6).map((r, i) => `<div style="--k:${i}"><span><b>${esc(r.k)}</b><small>${r.n} sped. · ${Math.round(r.t / Math.max(1, X.T) * 100)}% · ${esc(gEu(r.t))}</small></span><u><i style="--w:${(r.t / mR * 100).toFixed(1)}%;--c:#2f6db4"></i></u></div>`).join('')}</div>
      ${X.chk.length ? `<div class="m3-h4">Anomalie e possibili risparmi <em>${X.chk.length}</em></div><div class="m3-rows">${X.chk.map(c => `<div class="m3-row m3-gan ${c.t}"><i class="m3-pi m3-dt" style="--c:${c.t === 'warn' ? '#d98a1c' : '#2f6db4'}">${ic('alert')}</i><span class="tx"><b>${esc(strip(c.h))}</b><small>${esc(strip(c.d))}</small></span><span class="m3-chip ${c.t === 'warn' ? 'a' : 'n'}">${esc(strip(c.v))}</span></div>`).join('')}</div>` : ''}
      <div class="m3-h4">Centri di costo <em>${X.cdc.length}</em></div>
      <div class="m3-kv">${X.cdc.slice(0, 8).map(c => `<div><span>${esc(c.k)} ${esc(c.nome)}${c.rd ? ` · <i class="m3-rd">${esc(c.rd)}</i>` : ''}</span><b>${esc(gEu(c.t))}</b></div>`).join('')}</div>
      <div class="m3-h4">${q ? `Ricerca «${esc(Pn.q)}»` : 'Ultime spedizioni'} <em>${L2.length}</em></div>
      <div class="m3-rows">${L2.slice(0, 30).map(shipRow).join('') || '<div class="m3-empty">Nessuna spedizione</div>'}</div>
      <div class="m3-acts">${goBtn('gls', 'Apri la sezione GLS', 'truck')}<button type="button" class="m3-go ghost" data-m3="zspe">${ic('dock')}Banchine e camion</button></div></div>`;
  }
  function glsCard() {
    if (!glsOk()) return ''; const X = glsData(GLSM);
    return `<div class="m3-amm" style="grid-template-columns:minmax(0,1fr)"><button type="button" data-gls=""><i style="--c:#b58a00"><b style="font-weight:900">C</b></i><span><b>Corriere GLS</b><small>${X.n ? `${esc(mLab(X.m))} · ${X.n} spedizioni · ${esc(gEu(X.T))}${X.chk.length ? ' · ' + X.chk.length + ' da controllare' : ''}` : 'nessuna spedizione caricata'}</small></span></button></div>`;
  }

  /* ---------------- v290: preparazione ordini e controllo (scena, schermi, liste di prelievo, conta ciclica) ---------------- */
  let PRP = null, PICK = null;
  const dIso = n => { const d = new Date(C.today() + 'T12:00:00'); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
  const DOW = ['D', 'L', 'M', 'M', 'G', 'V', 'S'];
  function prepData() {
    const td = C.today(), d14 = Array.from({ length: 14 }, (_, i) => dIso(13 - i)), w0 = dIso(6);
    const per = d14.map(d => { const L2 = D.ddt.filter(x => String(x.d.data) === d); return { d, n: L2.length, pz: L2.reduce((s, x) => s + x.pz, 0) }; });
    const M2 = D.ddtM, righe = M2.reduce((s, x) => s + x.R.length, 0), pz = M2.reduce((s, x) => s + x.pz, 0), colli = M2.reduce((s, x) => s + C.num(x.d.colli), 0);
    const oggi = D.ddt.filter(x => String(x.d.data) === td), sett = D.ddt.filter(x => String(x.d.data) >= w0);
    const s30 = D.scar.filter(m => String(m.data) >= dIso(30)), byA = new Map(); s30.forEach(m => { const k = m.articolo; byA.set(k, (byA.get(k) || 0) + Math.abs(C.num(m.quantita))); });
    const topA = [...byA].map(([id, q]) => ({ id, q, a: C.artOf(id), p: P.byArt.get(id) })).filter(x => x.a).sort((a, b) => b.q - a.q).slice(0, 8);
    const byC = new Map(); M2.forEach(x => { const k = x.cliN; const o = byC.get(k) || { n: 0, pz: 0, cli: x.d.cliente }; o.n++; o.pz += x.pz; byC.set(k, o); });
    const topC = [...byC].map(([k, o]) => ({ k, ...o })).sort((a, b) => b.pz - a.pz).slice(0, 6);
    const noLoc = M2.reduce((s, x) => s + x.R.filter(l => l.art && !P.byArt.get(l.art)).length, 0), noArt = M2.reduce((s, x) => s + x.R.filter(l => !l.art).length, 0);
    return { per, righe, pz, colli, n: M2.length, oggi, sett, topA, topC, noLoc, noArt, rpo: M2.length ? righe / M2.length : 0 };
  }
  function cqData() {
    const nA = Math.max(1, D.nArt), cnt = new Set(D.ret90.map(m => m.articolo)), costOf = id => { const a = C.artOf(id); return a ? C.num(a.costo) : 0; };
    let vP = 0, vM = 0, qP = 0, qM = 0; D.ret90.forEach(m => { const q = C.num(m.quantita), v = Math.abs(q) * costOf(m.articolo); if (q >= 0) { vP += v; qP += q; } else { vM += v; qM += -q; } });
    const ms = Array.from({ length: 6 }, (_, i) => { const d = new Date(C.today() + 'T12:00:00'); d.setDate(1); d.setMonth(d.getMonth() - 5 + i); return d.toISOString().slice(0, 7); });
    const ser = ms.map(m => { const L2 = D.ret.filter(r => String(r.data).slice(0, 7) === m); return { m, p: L2.filter(r => C.num(r.quantita) > 0).length, n: L2.filter(r => C.num(r.quantita) < 0).length }; });
    const neg = D.arts.filter(x => x.g < 0), why = new Map();
    neg.forEach(x => why.set(x.id, ['Giacenza negativa', 'r']));
    D.arts.filter(x => x.out && x.s > 0).forEach(x => { if (!why.has(x.id)) why.set(x.id, ['Esaurito', 'r']); });
    D.arts.filter(x => x.low).forEach(x => { if (!why.has(x.id)) why.set(x.id, ['Sotto scorta', 'a']); });
    D.arts.filter(x => !cnt.has(x.id) && x.g > 0).sort((a, b) => b.val - a.val).slice(0, 8).forEach(x => { if (!why.has(x.id)) why.set(x.id, ['Alto valore, non contato da 90 gg', 'n']); });
    const todo = [...why].map(([id, w]) => ({ x: D.arts.find(a => a.id === id), w })).filter(o => o.x).slice(0, 18);
    return { acc: 1 - cnt.size / nA, nCnt: cnt.size, vP, vM, qP, qM, ser, neg, todo };
  }
  // ----- schermi
  function prpScreen(S, kind, page, u) {
    const g = S.cv.getContext('2d'), w = S.cv.width, h = S.cv.height, F = 'Inter, system-ui, sans-serif', acc = kind === 'pre' ? '#f47b20' : '#2fb36b';
    g.fillStyle = '#0f1216'; g.fillRect(0, 0, w, h); g.fillStyle = '#171b21'; g.fillRect(0, 0, w, 64);
    g.textBaseline = 'middle'; g.textAlign = 'left'; g.font = `800 25px ${F}`; g.fillStyle = acc; g.fillText(kind === 'pre' ? 'PREPARAZIONE ORDINI' : 'CONTROLLO E INVENTARIO', 26, 33);
    g.textAlign = 'right'; g.fillStyle = (Math.floor(u * 6) % 2) ? '#5df08a' : '#2e7d4a'; g.beginPath(); g.arc(w - 112, 33, 7, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.75)'; g.font = `700 19px ${F}`; g.fillText('LIVE', w - 28, 34);
    g.fillStyle = acc; g.fillRect(0, 62, w * u, 3);
    for (let i = 0; i < 2; i++) { g.fillStyle = i === page ? acc : 'rgba(255,255,255,.18)'; g.fillRect(w / 2 - 36 + i * 40, h - 14, 32, 5); }
    const kp = (x, y, l, v, c, s) => { g.textAlign = 'left'; g.font = `600 17px ${F}`; g.fillStyle = 'rgba(255,255,255,.5)'; g.fillText(l, x, y); g.font = `800 40px ${F}`; g.fillStyle = c || '#fff'; g.fillText(v, x, y + 40); if (s) { g.font = `600 15px ${F}`; g.fillStyle = 'rgba(255,255,255,.42)'; g.fillText(s, x, y + 72); } };
    if (kind === 'pre') { const X = S.X;
      if (page === 0) {
        kp(30, 98, 'Ordini oggi', N(X.oggi.length), '#fff', `${N(X.oggi.reduce((s, x) => s + x.pz, 0))} pezzi`); kp(250, 98, 'Ultimi 7 giorni', N(X.sett.length), '#fff', `${N(X.sett.reduce((s, x) => s + x.pz, 0))} pezzi`);
        kp(470, 98, 'Nel mese', N(X.n), acc, `${N(X.righe)} righe · ${N(X.colli)} colli`); kp(720, 98, 'Righe per ordine', X.rpo.toFixed(1).replace('.', ','), '#fff', 'media del mese');
        const x0 = 30, x1 = w - 30, y1 = h - 50, y0 = 230, mx = Math.max(1, ...X.per.map(p => p.n)), bw = (x1 - x0) / 14;
        g.textAlign = 'left'; g.font = `700 16px ${F}`; g.fillStyle = 'rgba(255,255,255,.5)'; g.fillText('Ordini evasi · ultimi 14 giorni', x0, y0 - 18);
        X.per.forEach((p, i) => { const k = Math.min(1, Math.max(0, u * 3 - i * .05)), hh = (y1 - y0 - 24) * p.n / mx * k; g.fillStyle = i === 13 ? acc : '#5b3a1f'; g.beginPath(); g.roundRect(x0 + i * bw + bw * .2, y1 - hh, bw * .6, Math.max(2, hh), 5); g.fill();
          if (p.n) { g.fillStyle = 'rgba(255,255,255,.8)'; g.font = `700 14px ${F}`; g.textAlign = 'center'; g.fillText(p.n, x0 + i * bw + bw / 2, y1 - hh - 12); }
          g.fillStyle = 'rgba(255,255,255,.4)'; g.font = `600 13px ${F}`; g.textAlign = 'center'; g.fillText(DOW[new Date(p.d + 'T12:00:00').getDay()] + ' ' + p.d.slice(8), x0 + i * bw + bw / 2, y1 + 18); });
      } else {
        g.textAlign = 'left'; g.font = `700 16px ${F}`; g.fillStyle = 'rgba(255,255,255,.5)'; g.fillText('Ultimi ordini preparati', 30, 92);
        D.ddt.slice(0, 6).forEach((x, i) => { const y = 108 + i * 64, k = Math.min(1, Math.max(0, u * 4 - i * .2)); g.globalAlpha = k; g.fillStyle = i === Math.floor(u * 12) % 6 ? '#232830' : '#171b21'; g.beginPath(); g.roundRect(30 + (1 - k) * 30, y, w - 60, 54, 10); g.fill(); g.fillStyle = acc; g.fillRect(30 + (1 - k) * 30, y, 6, 54);
          g.textAlign = 'left'; g.font = `800 19px ${F}`; g.fillStyle = '#fff'; g.fillText(`DDT ${C.dnum(x.d)} · ${String(x.cliN).slice(0, 30)}`, 52, y + 21); g.font = `600 14px ${F}`; g.fillStyle = 'rgba(255,255,255,.5)'; g.fillText(`${C.dIt(x.d.data)} · ${x.R.length} righe · ${N(x.pz)} pezzi${C.num(x.d.colli) ? ' · ' + N(C.num(x.d.colli)) + ' colli' : ''}`, 52, y + 41);
          g.textAlign = 'right'; g.font = `800 16px ${F}`; g.fillStyle = x.d.fattura ? '#5df08a' : '#ffb27a'; g.fillText(x.d.fattura ? 'FATTURATO' : 'DA FATTURARE', w - 50, y + 28); g.globalAlpha = 1; });
        if (!D.ddt.length) { g.font = `600 22px ${F}`; g.fillStyle = 'rgba(255,255,255,.5)'; g.fillText('Nessun DDT emesso', 30, 160); }
      }
    } else { const X = S.X;
      if (page === 0) {
        const cx = 170, cy = 290, r = 120, a0 = -Math.PI / 2, k = Math.min(1, u * 2.5), acc2 = X.acc;
        g.lineWidth = 22; g.strokeStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();
        g.strokeStyle = acc2 >= .95 ? '#2fb36b' : acc2 >= .85 ? '#f2c418' : '#ff6b5b'; g.lineCap = 'round'; g.beginPath(); g.arc(cx, cy, r, a0, a0 + Math.PI * 2 * acc2 * k); g.stroke(); g.lineCap = 'butt';
        g.textAlign = 'center'; g.font = `800 52px ${F}`; g.fillStyle = '#fff'; g.fillText(Math.round(acc2 * 100 * k) + '%', cx, cy - 4); g.font = `600 16px ${F}`; g.fillStyle = 'rgba(255,255,255,.5)'; g.fillText('accuratezza', cx, cy + 36); g.fillText('ultimi 90 giorni', cx, cy + 56);
        kp(360, 98, 'Rettifiche 90 gg', N(D.ret90.length), '#fff', `${N(X.nCnt)} articoli corretti`); kp(620, 98, 'Da contare', N(X.todo.length), X.todo.length ? '#ffb27a' : '#5df08a', `${X.neg.length} con giacenza negativa`);
        kp(360, 230, 'Eccedenze', '+' + C.eur0(X.vP), '#5df08a', `${N(X.qP)} pezzi in più`); kp(620, 230, 'Ammanchi', '−' + C.eur0(X.vM), '#ff9a6b', `${N(X.qM)} pezzi in meno`);
        const mx = Math.max(1, ...X.ser.map(s => s.p + s.n)), x0 = 360, bw = 100; X.ser.forEach((s, i) => { const hp = 70 * s.p / mx * k, hn = 70 * s.n / mx * k; g.fillStyle = '#2fb36b'; g.fillRect(x0 + i * bw + 20, 440 - hp, 26, hp); g.fillStyle = '#ff9a6b'; g.fillRect(x0 + i * bw + 50, 440 - hn, 26, hn); g.fillStyle = 'rgba(255,255,255,.4)'; g.font = `600 13px ${F}`; g.textAlign = 'center'; g.fillText(MESL[Number(s.m.slice(5)) - 1], x0 + i * bw + 48, 462); });
      } else {
        g.textAlign = 'left'; g.font = `700 16px ${F}`; g.fillStyle = 'rgba(255,255,255,.5)'; g.fillText('Conta ciclica · da verificare', 30, 92);
        X.todo.slice(0, 6).forEach((o, i) => { const y = 108 + i * 64, k = Math.min(1, Math.max(0, u * 4 - i * .2)), p = P.byArt.get(o.x.id), cc = o.w[1] === 'r' ? '#ff6b5b' : o.w[1] === 'a' ? '#ffb27a' : '#7fb6d6'; g.globalAlpha = k; g.fillStyle = '#171b21'; g.beginPath(); g.roundRect(30 + (1 - k) * 30, y, w - 60, 54, 10); g.fill(); g.fillStyle = cc; g.fillRect(30 + (1 - k) * 30, y, 6, 54);
          g.textAlign = 'left'; g.font = `800 19px ${F}`; g.fillStyle = '#fff'; g.fillText(String(o.x.a.descrizione).slice(0, 40), 52, y + 21); g.font = `600 14px ${F}`; g.fillStyle = 'rgba(255,255,255,.5)'; g.fillText(`${o.w[0]} · giacenza ${N(o.x.g)}${o.x.s ? ' · scorta ' + N(o.x.s) : ''}`, 52, y + 41);
          g.textAlign = 'right'; g.font = `800 20px ${F}`; g.fillStyle = cc; g.fillText(p ? p.code : '—', w - 50, y + 29); g.globalAlpha = 1; });
        if (!X.todo.length) { g.font = `700 26px ${F}`; g.fillStyle = '#5df08a'; g.fillText('✓ Niente da verificare', 30, 160); }
      }
    }
    S.tex.needsUpdate = true;
  }
  function screen3(par, x, z, ry, w, kind, X) {
    const g = new T.Group(); g.position.set(x, .5, z); g.rotation.y = ry; par.add(g); const h = w * .54;
    bxS(g, w + .22, h + .22, .14, 0x1b1d20, 0, 1.15, 0); for (const s of [-1, 1]) { bxS(g, .12, 1.2, .12, 0x3a3f46, s * w * .36, 0, 0); bxS(g, .5, .05, .5, 0x3a3f46, s * w * .36, 0, 0, { ns: 1 }); }
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 552; const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4; OWN.push(tex);
    const sm = new T.MeshBasicMaterial({ map: tex }); OWN.push(sm); const m = new T.Mesh(G.plane, sm); m.scale.set(w, h, 1); m.position.set(0, 1.26 + h / 2, .08); g.add(m);
    const S = { cv, tex, X, kind, last: -1 }; prpScreen(S, kind, 0, 0); return S;
  }
  // ----- carrello di prelievo con ceste
  function pickCart(par) {
    const j = new T.Group(); par.add(j); const FR = mat(0x3a3f46), LG = mat(0xc5cad1), BK = mat(0x17191c);
    partS(G.box, LG, 0, .72, 0, j, [.62, .03, 1.0]); partS(G.box, LG, 0, 1.12, 0, j, [.62, .03, 1.0]);
    for (const [x, z] of [[-.3, -.48], [.3, -.48], [-.3, .48], [.3, .48]]) { partS(G.box, FR, x, .95, z, j, [.03, .58, .03]); partS(G.cyl, BK, x, .57, z, j, [.11, .05, .11], [0, 0, Math.PI / 2]); }
    for (const x of [-.3, .3]) partS(G.box, FR, x, 1.42, -.5, j, [.03, .6, .03]); partS(G.cyl, mat(0xf47b20), 0, 1.7, -.5, j, [.04, .62, .04], [0, 0, Math.PI / 2]);
    [[0xf47b20, .74, -.24], [0x2f6db4, .74, .24], [0x2fb36b, 1.14, -.24], [0xf2c418, 1.14, .24]].forEach(([c, y, z]) => { partS(G.box, mat(c), 0, y + .13, z, j, [.5, .24, .4]); partS(G.box, mat(0xe2b27a), .05, y + .29, z, j, [.24, .1, .2]); });
    const t2 = new T.Mesh(G.box, new T.MeshBasicMaterial({ color: 0x9fe8b4 })); t2.scale.set(.2, .13, .012); t2.position.set(0, 1.55, -.46); t2.rotation.x = -.5; j.add(t2);
    j.traverse(e => { if (e.isMesh) { e.castShadow = false; e.receiveShadow = false; } });
    return j;
  }
  function pcartTick(m, t, dt) {
    if (m.w > 0) { m.w -= dt; return; }
    const p = m.pts[m.i], o = m.o.position, dx = p.x - o.x, dz = p.z - o.z, d = Math.hypot(dx, dz), st = m.sp * dt;
    if (d <= st) { o.x = p.x; o.z = p.z; m.w = p.w || 0; m.i = (m.i + 1) % m.pts.length; return; }
    o.x += dx / d * st; o.z += dz / d * st;
    let tg = Math.atan2(dx, dz), df = tg - m.o.rotation.y; while (df > Math.PI) df -= 2 * Math.PI; while (df < -Math.PI) df += 2 * Math.PI; m.o.rotation.y += df * Math.min(1, dt * 6);
  }
  // percorso «a corsie»: banco → testata della corsia → vani → testata → banco
  function pickPath(start, stops) {
    const out = [start.clone()], byR = new Map();
    stops.forEach(s => { if (!byR.has(s.rk.id)) byR.set(s.rk.id, []); byR.get(s.rk.id).push(s); });
    let cur = start.clone();
    const R3 = [...byR.values()].map(L2 => { const rk = L2[0].rk, g = rackG(rk.id); g.updateMatrixWorld(); const len = rackLen(rk), dep = rackDep(rk), ends = [-1, 1].map(sx => g.localToWorld(new T.Vector3(sx * (len / 2 + 1.3), 0, dep / 2 + 1.35))); return { rk, g, L2, len, dep, ends }; });
    R3.sort((a, b) => Math.min(...a.ends.map(e => e.distanceTo(start))) - Math.min(...b.ends.map(e => e.distanceTo(start))));
    R3.forEach(r => {
      const e = r.ends[0].distanceTo(cur) <= r.ends[1].distanceTo(cur) ? 0 : 1, E = r.ends[e];
      out.push(new T.Vector3(E.x, 0, cur.z), E.clone());
      const pts = r.L2.map(s => { const c = cellBox(r.rk, s.b, s.l).c; const w2 = r.g.localToWorld(new T.Vector3(c.x, 0, r.dep / 2 + 1.35)); return { s, w: w2, d: w2.distanceTo(E) }; }).sort((a, b) => a.d - b.d);
      pts.forEach(p => { p.s.w = p.w; out.push(p.w.clone()); });
      out.push(E.clone()); cur = E.clone();
    });
    out.push(new T.Vector3(cur.x, 0, start.z), start.clone());
    return out.filter((p, i) => !i || p.distanceTo(out[i - 1]) > .05);
  }
  function deskStart() { const dk = L.items.find(i => i.t === 'desk'), z = L.items.find(i => i.t === 'zone' && i.k === 'pre'); if (dk) { const g = WH.children.find(c => c.userData.eid === dk.id); if (g) { g.updateMatrixWorld(); return g.localToWorld(new T.Vector3(0, 0, -1.6)).setY(0); } } return z ? new T.Vector3(z.x, 0, z.z) : new T.Vector3(0, 0, 0); }
  function pickStops(x) { const st = []; x.R.forEach((l, i) => { const p = l.art && P.byArt.get(l.art); if (p) st.push({ li: l, i, rk: p.rk, b: p.b, l: p.l, code: p.code }); }); return st; }
  function pickClear() { if (!PICK) return; WH.remove(PICK.g); PICK.dis.forEach(o => o.dispose()); PICK = null; }
  function pickShow(x, noFly) {
    pickClear(); const stops = pickStops(x); if (!stops.length) return null;
    const start = deskStart(), path = pickPath(start, stops), g = new T.Group(); WH.add(g); const dis = [];
    const ct = cvTex(256, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(244,123,32,.9)'; for (let i = 0; i < 2; i++) { const x0 = i * 128 + 30; c.beginPath(); c.moveTo(x0, 10); c.lineTo(x0 + 50, 32); c.lineTo(x0, 54); c.lineTo(x0 + 22, 32); c.closePath(); c.fill(); } }); ct.wrapS = T.RepeatWrapping; dis.push(ct);
    const pos = [], uv = [], idx = []; let acc = 0;
    for (let i = 1; i < path.length; i++) { const a = path[i - 1], b = path[i], d = a.distanceTo(b); if (d < .05) continue; const nx = -(b.z - a.z) / d * .32, nz = (b.x - a.x) / d * .32, y = .6 + (i % 2) * .004, k = pos.length / 3;
      pos.push(a.x + nx, y, a.z + nz, a.x - nx, y, a.z - nz, b.x + nx, y, b.z + nz, b.x - nx, y, b.z - nz); uv.push(acc / 1.4, 1, acc / 1.4, 0, (acc + d) / 1.4, 1, (acc + d) / 1.4, 0); idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); acc += d; }
    const bg = new T.BufferGeometry(); bg.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); bg.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); bg.setIndex(idx); dis.push(bg);
    const rm = new T.MeshBasicMaterial({ map: ct, transparent: true, depthWrite: false, side: T.DoubleSide }); dis.push(rm); const rib = new T.Mesh(bg, rm); rib.renderOrder = 6; g.add(rib);
    const bgL = new T.BufferGeometry().setFromPoints(path.map(p => new T.Vector3(p.x, .59, p.z))); dis.push(bgL); const lm = new T.LineBasicMaterial({ color: 0xf47b20, transparent: true, opacity: .45 }); dis.push(lm); g.add(new T.Line(bgL, lm));
    const ord = stops.filter(s => s.w).sort((a, b) => path.findIndex(p => p.distanceTo(a.w) < .02) - path.findIndex(p => p.distanceTo(b.w) < .02));
    ord.forEach((s, i) => { s.n = i + 1;
      const tx = cvTex(256, 128, (c, w, h) => { c.fillStyle = '#16181b'; c.beginPath(); c.roundRect(4, 4, w - 8, h - 8, 26); c.fill(); c.fillStyle = '#f47b20'; c.beginPath(); c.arc(62, 64, 40, 0, 7); c.fill(); c.fillStyle = '#fff'; c.font = '900 46px Inter, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(i + 1), 62, 66); c.textAlign = 'left'; c.font = '800 30px Inter, sans-serif'; c.fillText(s.code, 116, 48); c.font = '700 24px Inter, sans-serif'; c.fillStyle = 'rgba(255,255,255,.65)'; c.fillText(`${N(C.num(s.li.q))} ${String(s.li.um || 'pz').slice(0, 4)}`, 116, 86); }); dis.push(tx);
      const sm = new T.SpriteMaterial({ map: tx, depthTest: false, transparent: true }); dis.push(sm); const sp = new T.Sprite(sm); sp.scale.set(3.2, 1.6, 1); sp.position.set(s.w.x, 3.6, s.w.z); sp.renderOrder = 12; g.add(sp);
      const pole = new T.Mesh(G.cyl, mat(0xf47b20)); pole.scale.set(.05, 2.6, .05); pole.position.set(s.w.x, 1.8, s.w.z); g.add(pole);
      const ring = new T.Mesh(new T.RingGeometry(.42, .58, 32), new T.MeshBasicMaterial({ color: 0xf47b20, transparent: true, depthWrite: false, side: T.DoubleSide })); dis.push(ring.geometry, ring.material); ring.rotation.x = -Math.PI / 2; ring.position.set(s.w.x, .62, s.w.z); ring.renderOrder = 7; g.add(ring); s.ring = ring; });
    const sr = new T.Mesh(new T.CircleGeometry(.7, 32), new T.MeshBasicMaterial({ color: 0x2fb36b, transparent: true, opacity: .8, depthWrite: false })); dis.push(sr.geometry, sr.material); sr.rotation.x = -Math.PI / 2; sr.position.set(start.x, .62, start.z); g.add(sr);
    let len = 0; for (let i = 1; i < path.length; i++) len += path[i].distanceTo(path[i - 1]);
    PICK = { g, dis, tex: ct, stops: ord, x, len, path };
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; path.forEach(p => { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); });
    if (!noFly) fly({ tx: (x0 + x1) / 2, ty: 0, tz: (z0 + z1) / 2 + 2, dist: Math.max(x1 - x0, z1 - z0) * 1.3 + 26, az: -0.25, pol: .62 });
    return PICK;
  }
  function prepBuild() {
    const was = PICK && PICK.x && PICK.x.d.id; if (PICK) { PICK.dis.forEach(o => o.dispose()); PICK = null; }
    PRP = null; const zp = L.items.find(i => i.t === 'zone' && i.k === 'pre'), zc = L.items.find(i => i.t === 'zone' && i.k === 'cq'), lite = Q && Q.tier === 0, R = { scr: [], wrap: null, cq: null };
    if (zp) { const b = box2(zp), w = b.x1 - b.x0, d = b.z1 - b.z0, X = prepData(), B = new Batch(WH);
      if (w >= 12 && d >= 9) {
        R.scr.push(screen3(WH, b.x0 + w * .62, b.z0 + d * .5, 0, Math.min(5.2, w * .2), 'pre', X));
        // avvolgipallet: piatto che gira, colonna, carrello del film che sale e scende
        const wx = b.x0 + 3.2, wz = b.z1 - 4.6, wg = new T.Group(); wg.position.set(wx, .5, wz); WH.add(wg);
        bxS(wg, 2.0, .14, 2.0, 0x3a3f46, 0, 0, 0); const tt = new T.Group(); tt.position.y = .14; wg.add(tt); meshS(G.cyl, mat(0xc5cad1), 0, .04, 0, tt, { s: [1.75, .08, 1.75] });
        const pb = new Batch(tt); palletStack(pb, 0, .08, 0, .85, PAL[0], 3, null); pb.flush();
        const film = new T.Mesh(G.cyl, new T.MeshLambertMaterial({ color: 0xdfe9f2, transparent: true, opacity: .4, depthWrite: false })); film.scale.set(1.32, 1.0, 1.32); film.position.y = .9; OWN.push(film.material); tt.add(film);
        bxS(wg, .3, 2.9, .3, 0xf47b20, 1.25, .14, 0); bxS(wg, .5, .3, .5, 0x3a3f46, 1.25, 0, 0); const car = new T.Group(); car.position.set(1.08, .9, 0); wg.add(car); meshS(G.box, mat(0xfafafa), 0, 0, 0, car, { s: [.28, .5, .36] }); meshS(G.cyl, mat(0xdfe9f2), -.18, 0, 0, car, { s: [.18, .42, .18] });
        bxS(wg, .45, .55, .3, 0xe9eaec, 1.25, 1.1, .45); B.add('wl', G.box, new T.MeshBasicMaterial({ color: 0x5df08a }), m4(1.25, 1.82, .61, .08, .08, .02));
        R.wrap = { tt, car, film };
        // scaffale delle ceste vuote e bancale di cartoni piegati
        const sx = b.x1 - 3, sz = b.z1 - 3.2; for (const x of [-1, 1]) bxS(WH, .05, 1.8, .05, 0x3a3f46, sx + x * .9, .5, sz - .3), bxS(WH, .05, 1.8, .05, 0x3a3f46, sx + x * .9, .5, sz + .3);
        for (let l = 0; l < 4; l++) { B.add('csh', G.box, mat(0xc5cad1), m4(sx, .62 + l * .42, sz, 1.85, .03, .62)); for (let i = 0; i < 3; i++) B.add('tote', G.box, mat(0xffffff), m4(sx - .6 + i * .6, .62 + l * .42 + .14, sz, .52, .26, .5), [0xf47b20, 0x2f6db4, 0x2fb36b, 0xf2c418][(l + i) % 4]); }
        B.add('cbp', G.box, mat(0xc9a273), m4(sx - 2.4, .58, sz, 1.2, .14, 1.0)); for (let i = 0; i < 6; i++) B.add('cbf', G.box, mat(0xd9b07a), m4(sx - 2.4, .7 + i * .06, sz, 1.1, .05, .9));
        // cartelli dei banchi con l'ordine in lavorazione
        L.items.filter(i => i.t === 'desk').slice(0, 6).forEach((dk, i) => { const x = D.ddt[i]; if (!x) return; const dg = WH.children.find(c => c.userData.eid === dk.id); if (!dg) return; dg.updateMatrixWorld(); const p = dg.localToWorld(new T.Vector3(0, 0, 0));
          const t = textTex([[`BANCO ${i + 1}`, 22, 800, 28, null, '#f47b20'], [`DDT ${C.dnum(x.d)}`, 34, 800, 66, null, '#16181b'], [String(x.cliN).slice(0, 24), 22, 600, 100, null, '#5b5e63'], [`${x.R.length} righe · ${N(x.pz)} pz`, 20, 700, 130, null, '#2f6db4']], { bg: '#ffffff', w: 360, h: 150, round: 14 });
          const pl = planeT(t, 1.7, .71, WH, p.x, 3.15, p.z, { ds: 1 }); pl.renderOrder = 2; bxS(WH, .02, .55, .02, 0x3a3f46, p.x - .6, 3.5, p.z, { ns: 1 }); bxS(WH, .02, .55, .02, 0x3a3f46, p.x + .6, 3.5, p.z, { ns: 1 });
          const h2 = new T.Mesh(G.box, M.hit); h2.scale.set(1.8, .8, .3); h2.position.set(p.x, 3.15, p.z); h2.userData.k = { t: 'pick', id: x.d.id }; WH.add(h2); pick.push(h2); });
        // carrelli di prelievo che girano tra i banchi e le corsie
        if (!lite) D.ddt.slice(0, 2).forEach((x, k) => { const st = pickStops(x).slice(0, 4); if (!st.length) return; try { const s0 = deskStart(); s0.x += k * 6.4; const path = pickPath(s0, st); const cg = new T.Group(); cg.position.copy(path[0]); WH.add(cg); const op = person(cg, 0, -1.0, k ? 0x2fb36b : 0xf47b20, null, { mode: 'push' }); pickCart(cg); cg.userData.rig = op.userData.rig;
          movers.push({ o: cg, t: 'pcart', pts: path.map((p, i) => ({ x: p.x, z: p.z, w: st.some(s => s.w && s.w.distanceTo(p) < .05) ? 2.2 : i === path.length - 1 ? 4 : 0 })), i: 1, w: k * 3, sp: 1.05 }); } catch {} });
      }
      B.flush();
    }
    if (zc) { const b = box2(zc), w = b.x1 - b.x0, d = b.z1 - b.z0, X = cqData(), B = new Batch(WH);
      if (w >= 9 && d >= 9) {
        R.scr.push(screen3(WH, b.x0 + w * .5, b.z0 + d * .55, 0, Math.min(4.6, w * .38), 'cq', X));
        // gabbia quarantena «da verificare»
        const qx = b.x1 - 2.6, qz = b.z1 - 3.0, qw = 3.4, qd = 2.8;
        for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1]]) B.add('qp', G.box, mat(0xe0322a), m4(qx + x * qw / 2, 1.0, qz + z * qd / 2, .07, 1.0, .07));
        for (const y of [.9, 1.4]) { B.add('qc', G.box, mat(0xffffff), m4(qx, y, qz - qd / 2, qw, .04, .02), 0xe0322a); B.add('qc', G.box, mat(0xffffff), m4(qx, y, qz + qd / 2, qw, .04, .02), 0xffffff); B.add('qc', G.box, mat(0xffffff), m4(qx - qw / 2, y, qz, .02, .04, qd), 0xffffff); B.add('qc', G.box, mat(0xffffff), m4(qx + qw / 2, y, qz, .02, .04, qd), 0xe0322a); }
        const nq = Math.min(4, X.todo.filter(o => o.w[1] !== 'n').length); for (let i = 0; i < nq; i++) palletStack(B, qx - .8 + (i % 2) * 1.6, .6, qz - .6 + Math.floor(i / 2) * 1.2, .5, PAL[(i + 1) % 4], 2, null, true);
        const qt = textTex([['DA VERIFICARE', 30, 900, 38, null, '#ffffff'], [`${X.todo.length} articoli · conta ciclica`, 20, 700, 74, null, 'rgba(255,255,255,.85)']], { bg: '#d9452f', w: 360, h: 96, round: 10 }); const qp = planeT(qt, 1.9, .5, WH, qx, 2.0, qz + qd / 2 + .03, { ds: 1 }); qp.renderOrder = 2;
        // postazione di conta: carrello con tablet, operatore con lettore
        const cx = b.x0 + 2.4, cz = b.z1 - 2.6; bxS(WH, 1.2, .9, .7, 0xfafafa, cx, .5, cz); B.add('ctb', G.box, mat(0x1d1f22), m4(cx - .2, 1.47, cz, .36, .02, .26)); B.add('cts', G.box, new T.MeshBasicMaterial({ color: 0x9fe8b4 }), m4(cx - .2, 1.485, cz, .32, .005, .22)); B.add('cbx', G.box, mat(0xe2b27a), m4(cx + .3, 1.55, cz, .34, .2, .3));
        if (!lite) { const p = person(WH, cx + 1.0, cz - .1, 0x2fb36b, null, { mode: 'scan' }); p.rotation.y = -Math.PI / 2; movers.push({ o: p, t: 'bob', ph: 41 }); }
        // varco sul nastro: laser, pesatura, espulsore degli scarti
        const belt = L.items.find(i => i.t === 'belt'); if (belt) { const g2 = WH.children.find(c => c.userData.eid === belt.id); if (g2) { g2.updateMatrixWorld(); let x0 = null; for (let x = -belt.len / 2 + 1; x < belt.len / 2 - 6; x += .5) { const wp = g2.localToWorld(new T.Vector3(x, 0, 0)); if (wp.x > b.x0 + 2 && wp.x < b.x1 - 2 && wp.z > b.z0 && wp.z < b.z1) { x0 = x; break; } }
          if (x0 != null) { const lz = new T.Mesh(G.box, new T.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: .35, depthWrite: false })); lz.scale.set(.02, 1.1, 1.5); lz.position.set(x0, 1.9, 0); g2.add(lz); OWN.push(lz.material);
            const sw = new T.Mesh(G.box, new T.MeshBasicMaterial({ color: 0xff6b5b })); sw.scale.set(.03, .02, 1.5); sw.position.set(x0, 1.9, 0); g2.add(sw);
            const xs = x0 + 2.4; bxS(g2, 1.3, .1, 1.6, 0x8e959e, xs, 1.06, 0, { ns: 1 }); bxS(g2, .08, 1.4, .08, 0x3a3f46, xs, .5, -1.0); bxS(g2, .5, .3, .1, 0x1d1f22, xs, 1.9, -1.0);
            const kcv = document.createElement('canvas'); kcv.width = 160; kcv.height = 64; const ktx = new T.CanvasTexture(kcv); ktx.colorSpace = T.SRGBColorSpace; OWN.push(ktx); const km = new T.MeshBasicMaterial({ map: ktx }); OWN.push(km); const kd = new T.Mesh(G.plane, km); kd.scale.set(.44, .18, 1); kd.position.set(xs, 2.05, -.94); g2.add(kd);
            const lamp = new T.Mesh(G.cyl, new T.MeshBasicMaterial({ color: 0x2fb36b })); lamp.scale.set(.12, .12, .12); lamp.position.set(xs, 2.32, -1.0); g2.add(lamp); OWN.push(lamp.material);
            const xp = x0 + 4.3; bxS(g2, .3, 1.0, .3, 0x3a3f46, xp, .5, -1.05); const arm = new T.Mesh(G.box, mat(0xf47b20)); arm.scale.set(.5, .22, .1); arm.position.set(xp, 1.5, -.85); g2.add(arm);
            bxS(g2, 1.6, .06, 1.1, 0xc5cad1, xp, 1.1, 1.45); for (const sx2 of [-.75, .75]) for (const sz2 of [1.0, 1.9]) bxS(g2, .05, .6, .05, 0x8e959e, xp + sx2, .5, sz2, { ns: 1 });
            const rj = new T.Mesh(G.box, M.carton || mat(0xe2b27a)); rj.scale.set(.5, .36, .44); rj.visible = false; g2.add(rj);
            const rt = textTex([['SCARTI', 24, 900, 30, null, '#ffffff']], { bg: '#d9452f', w: 200, h: 56, round: 8 }); const rp = planeT(rt, .8, .22, g2, xp, 1.35, 2.02, { ds: 1 }); rp.renderOrder = 2;
            R.cq = { lz, sw, ktx, kcv, lamp, arm, rj, x0, xs, xp, last: -1 }; } } }
      }
      B.flush();
    }
    PRP = R;
    if (was && sel && sel.t === 'pick') { const x = D.ddt.find(y => y.d.id === was); if (x) pickShow(x, true); }
  }
  function prepTick(t, dt) {
    if (PICK) { PICK.tex.offset.x -= dt * .9; PICK.stops.forEach((s, i) => { if (!s.ring) return; const u = ((t * .8 + i * .15) % 1); s.ring.scale.setScalar(1 + u * .7); s.ring.material.opacity = .9 * (1 - u); }); }
    if (!PRP) return;
    const per = 8, page = Math.floor(t / per) % 2, u = (t % per) / per, q = Math.floor(t * 6);
    PRP.scr.forEach(S => { if (q !== S.last) { S.last = q; prpScreen(S, S.kind, page, u); } });
    if (PRP.wrap) { const W2 = PRP.wrap, c = (t % 14) / 14; W2.tt.rotation.y = t * 1.6; W2.car.position.y = .9 + (c < .5 ? c * 2 : 2 - c * 2) * 1.4; W2.film.scale.y = Math.max(.05, Math.min(1, (c < .5 ? c * 2 : 1) * 1.0)); W2.film.position.y = .3 + W2.film.scale.y * .6; }
    const Q2 = PRP.cq; if (Q2) { const c = (t % 5) / 5;
      Q2.sw.position.y = 1.4 + Math.abs(Math.sin(t * 3.2)) * 1.0; Q2.lz.material.opacity = .22 + Math.sin(t * 9) * .08;
      const rej = Math.floor(t / 5) % 4 === 3; Q2.lamp.material.color.setHex(rej && c > .35 ? 0xff3b30 : 0x2fb36b);
      const ap = rej && c > .45 && c < .75 ? Math.sin((c - .45) / .3 * Math.PI) : 0; Q2.arm.position.z = -.85 + ap * 1.1;
      Q2.rj.visible = rej && c > .5; if (Q2.rj.visible) { const k = Math.min(1, (c - .5) / .2); Q2.rj.position.set(Q2.xp, 1.45 - k * .17 + (k < 1 ? Math.sin(k * Math.PI) * .15 : 0), k * 1.45); }
      const qq = Math.floor(t * 4); if (qq !== Q2.last) { Q2.last = qq; const g2 = Q2.kcv.getContext('2d'); g2.fillStyle = '#0f1a14'; g2.fillRect(0, 0, 160, 64); const on = c > .2 && c < .5, kg = 2.2 + ((Math.floor(t / 5) * 37) % 50) / 10; g2.fillStyle = rej ? '#ff6b5b' : '#5df08a'; g2.font = '700 30px ui-monospace, Menlo, monospace'; g2.textAlign = 'right'; g2.textBaseline = 'middle'; g2.fillText(on ? kg.toFixed(2) : rej && c >= .5 ? 'ERR' : ' OK ', 118, 33); g2.font = '700 14px Inter, sans-serif'; g2.fillText('kg', 152, 37); Q2.ktx.needsUpdate = true; } }
  }
  // ----- pannelli
  const sparkD = (per, col) => { const mx = Math.max(1, ...per.map(p => p.n)); return `<div class="m3-b14" style="grid-template-columns:repeat(${per.length},1fr)">${per.map((p, i) => `<div title="${esc(C.dIt(p.d))}: ${p.n} ordini · ${N(p.pz)} pezzi"><i style="--h:${(p.n / mx * 100).toFixed(1)}%;--k:${i}${i === per.length - 1 ? ';background:' + col : ''}"></i><small>${DOW[new Date(p.d + 'T12:00:00').getDay()]}</small></div>`).join('')}</div>`; };
  function prepPanel(Pn) {
    const X = prepData(), last = D.ddt.slice(0, 14);
    return head(ic('hand'), '', Pn.t === 'belt' ? 'Nastro trasportatore' : Pn.t === 'desk' ? 'Bancone di preparazione' : 'Zona', 'Preparazione ordini', 'Liste di prelievo · percorso tra le corsie · imballo · DDT', 1) + `<div class="m3-pb">
      <div class="m3-grid">${stat('Ordini oggi', N(X.oggi.length), '', `${N(X.sett.length)} negli ultimi 7 giorni`)}${stat('Ordini del mese', N(X.n), '', `${N(X.righe)} righe · ${N(X.pz)} pezzi`)}${stat('Righe per ordine', X.rpo.toFixed(1).replace('.', ','), '', 'media del mese')}${stat('Colli del mese', N(X.colli), '', X.n ? `${(X.colli / X.n).toFixed(1).replace('.', ',')} per ordine` : 'dai DDT')}</div>
      <button type="button" class="m3-go" data-gx="ddt-new">${ic('plus')}Nuovo DDT</button>
      <div class="m3-h4">Ordini · ultimi 14 giorni</div>${sparkD(X.per, '#f47b20')}
      ${X.noLoc || X.noArt ? `<div class="m3-warn">${ic('alert')}<span>${X.noLoc ? `<b>${X.noLoc} righe</b> del mese su articoli senza ubicazione. ` : ''}${X.noArt ? `<b>${X.noArt} righe</b> scritte a mano (senza articolo): non entrano nel percorso.` : ''}</span></div>` : ''}
      <div class="m3-h4">Liste di prelievo <em>tocca per il percorso</em></div>
      <div class="m3-rows">${last.map((x, i) => { const st = pickStops(x).length; return `<button type="button" class="m3-row m3-pkr" data-pick="${esc(x.d.id)}" style="--k:${i}"><i class="m3-pi m3-dt" style="--c:#f47b20">${ic('route')}</i><span class="tx"><b>DDT ${esc(C.dnum(x.d))} · ${esc(x.cliN)}</b><small>${esc([C.dIt(x.d.data), `${x.R.length} righe`, `${N(x.pz)} pz`, st ? `${st} ubicazioni` : 'nessuna ubicazione'].join(' · '))}</small></span><span class="m3-chip ${st ? 'g' : 'n'}">${st ? '<i></i>percorso' : '—'}</span></button>`; }).join('') || '<div class="m3-empty">Nessun DDT: crea il primo con «Nuovo DDT»</div>'}</div>
      ${X.topA.length ? `<div class="m3-h4">Più prelevati · 30 giorni</div><div class="m3-hb">${X.topA.map((o, i) => `<button type="button" data-art3="${esc(o.id)}" style="--k:${i}"><span><b>${esc(o.a.descrizione)}</b><small>${o.p ? esc(o.p.code) + ' · ' : ''}${N(o.q)} pz</small></span><u><i style="--w:${(o.q / X.topA[0].q * 100).toFixed(1)}%;--c:#f47b20"></i></u></button>`).join('')}</div>` : ''}
      ${X.topC.length ? `<div class="m3-h4">Clienti del mese</div><div class="m3-hb">${X.topC.map((o, i) => `<div style="--k:${i}"><span><b>${esc(o.k)}</b><small>${o.n} ordini · ${N(o.pz)} pz</small></span><u><i style="--w:${(o.pz / Math.max(1, X.topC[0].pz) * 100).toFixed(1)}%;--c:#2f6db4"></i></u></div>`).join('')}</div>` : ''}
      <div class="m3-h4">Ultimi scarichi <em>${D.scar.length}</em></div><div class="m3-rows">${D.scar.slice(0, 10).map(mvRow).join('') || '<div class="m3-empty">Nessuno scarico</div>'}</div></div>`;
  }
  function pickPanel(Pn) {
    const x = D.ddt.find(y => y.d.id === Pn.id); if (!x) return '';
    const PK = PICK && PICK.x === x ? PICK : null, stops = PK ? PK.stops : pickStops(x), loose = x.R.filter(l => !l.art || !P.byArt.get(l.art)), i3 = trucks.findIndex(t2 => t2.d === x);
    const mins = PK ? Math.round(PK.len / 1.1 / 60 + stops.length * .5) : 0;
    return head(ic('route'), '', 'Lista di prelievo', `DDT ${esc(C.dnum(x.d))}`, `${esc(x.cliN)}${x.citta ? ' · ' + esc(x.citta) : ''} · ${esc(C.dIt(x.d.data))}`, 1) + `<div class="m3-pb">
      <div class="m3-grid">${stat('Righe', N(x.R.length), '', `${N(x.pz)} pezzi`)}${stat('Ubicazioni', N(stops.length), '', loose.length ? `${loose.length} righe fuori percorso` : 'tutte a scaffale')}${PK ? stat('Percorso', N(Math.round(PK.len)), 'm', `circa ${Math.max(1, mins)} min a piedi`) + stat('Colli', C.num(x.d.colli) ? N(C.num(x.d.colli)) : '—', '', esc(x.d.aspetto || '')) : ''}</div>
      ${stops.length ? `<div class="m3-h4">Percorso <em>banco → corsie → banco</em></div><div class="m3-pk">${stops.map((s, i) => `<button type="button" data-art3="${esc(s.li.art)}" style="--k:${i}"><i>${s.n || i + 1}</i><span><b>${esc(s.li.d || (C.artOf(s.li.art) || {}).descrizione || 'Articolo')}</b><small>${esc([s.li.c, 'scaffale ' + s.rk.code + ' · campata ' + (s.b + 1) + ' · livello ' + (s.l + 1)].filter(Boolean).join(' · '))}</small></span><em class="loc">${esc(s.code)}</em><b class="q">${N(C.num(s.li.q))}<small>${esc(s.li.um || 'pz')}</small></b></button>`).join('')}</div>` : `<div class="m3-warn">${ic('alert')}<span>Nessuna riga di questo DDT ha un'ubicazione a scaffale: il percorso non si può disegnare.</span></div>`}
      ${loose.length ? `<div class="m3-h4">Fuori percorso <em>${loose.length}</em></div><div class="m3-rows">${loose.map(l => `<div class="m3-row"><i class="m3-pi m3-dt" style="--c:#9aa0a8">${ic('box')}</i><span class="tx"><b>${esc(l.d || 'Riga')}</b><small>${esc(l.art ? 'articolo senza ubicazione' : 'riga scritta a mano')}</small></span><span class="m3-chip n">${N(C.num(l.q))} ${esc(l.um || '')}</span></div>`).join('')}</div>` : ''}
      <div class="m3-acts"><button type="button" class="m3-go" data-gx="ddt-pdf" data-id="${esc(x.d.id)}">${ic('pdf')}Apri il DDT</button>${i3 >= 0 ? `<button type="button" class="m3-go ghost" data-trk3="${i3}">${ic('truck')}Camion in banchina</button>` : ''}<button type="button" class="m3-go ghost" data-zsel="pre">${ic('hand')}Tutte le liste</button></div></div>`;
  }
  function cqPanel() {
    const X = cqData(), a = Math.round(X.acc * 100), mx = Math.max(1, ...X.ser.map(s => Math.max(s.p, s.n)));
    return head(ic('shield'), '', 'Zona', 'Controllo e inventario', 'Varco sul nastro · conta ciclica · rettifiche', 1) + `<div class="m3-pb">
      <div class="m3-cqh"><div class="ring" style="--p:${X.acc};--c:${X.acc >= .95 ? '#2fb36b' : X.acc >= .85 ? '#e0b100' : '#d9452f'}"><b>${a}%</b><small>accuratezza</small></div><div><span>Inventario · ultimi 90 giorni</span><b>${X.nCnt ? `${N(X.nCnt)} articoli corretti su ${N(D.nArt)}` : 'Nessuna rettifica: giacenze mai corrette'}</b><em>${D.ret[0] ? 'ultima rettifica il ' + esc(C.dIt(D.ret[0].data)) : 'fai una conta ciclica per verificare'}</em></div></div>
      <div class="m3-grid">${stat('Eccedenze', '+' + C.eur0(X.vP), '', `${N(X.qP)} pezzi trovati in più`)}${stat('Ammanchi', '−' + C.eur0(X.vM), '', `${N(X.qM)} pezzi mancanti`)}${stat('Da contare', N(X.todo.length), '', 'conta ciclica suggerita')}${stat('Giacenze negative', N(X.neg.length), '', X.neg.length ? 'da correggere subito' : 'nessuna')}</div>
      ${canW() ? `<button type="button" class="m3-go" data-gx="mov-new">${ic('check')}Rettifica di inventario</button>` : ''}
      <div class="m3-h4">Rettifiche per mese <em>+ eccedenze · − ammanchi</em></div>
      <div class="m3-rc">${X.ser.map((s, i) => `<div title="${esc(MESF[Number(s.m.slice(5)) - 1])}: ${s.p} in più · ${s.n} in meno"><span><i class="r" style="--h:${(s.p / mx * 100).toFixed(1)}%;--k:${i};background:#7fcf9b"></i><i class="c" style="--h:${(s.n / mx * 100).toFixed(1)}%;--k:${i};background:#f3a98a"></i></span><small>${MESL[Number(s.m.slice(5)) - 1]}</small></div>`).join('')}</div>
      <div class="m3-h4">Conta ciclica <em>${X.todo.length}</em></div>
      <div class="m3-rows">${X.todo.map(o => { const p = P.byArt.get(o.x.id); return `<button type="button" class="m3-row" data-art3="${esc(o.x.id)}"><i class="m3-pi m3-dt" style="--c:${o.w[1] === 'r' ? '#d9452f' : o.w[1] === 'a' ? '#d98a1c' : '#2f6db4'}">${ic(o.w[1] === 'n' ? 'check' : 'alert')}</i><span class="tx"><b>${esc(o.x.a.descrizione)}</b><small>${esc([o.w[0], 'giacenza ' + N(o.x.g), o.x.s ? 'scorta ' + N(o.x.s) : ''].filter(Boolean).join(' · '))}</small></span><span class="m3-chip ${o.w[1]}">${p ? esc(p.code) : 'senza vano'}</span></button>`; }).join('') || '<div class="m3-empty">Niente da verificare</div>'}</div>
      <div class="m3-h4">Ultime rettifiche <em>${D.ret.length}</em></div><div class="m3-rows">${D.ret.slice(0, 12).map(mvRow).join('') || '<div class="m3-empty">Nessuna rettifica di inventario</div>'}</div></div>`;
  }

  /* ---------------- ricevimento merci (v276): banchine fornitori, corsie di sosta, accettazione ---------------- */
  const hashS = s => { let h = 0; s = String(s || ''); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
  const dAgoN = d => { const a = new Date(String(d).slice(0, 10) + 'T12:00:00'), b = new Date(C.today() + 'T12:00:00'); return Math.round((b - a) / 864e5); };
  const agoTxt = d => { const n = dAgoN(d); return n <= 0 ? 'Oggi' : n === 1 ? 'Ieri' : n < 7 ? n + ' giorni fa' : C.dIt(d); };
  // un arrivo = i carichi dello stesso documento, oppure dello stesso giorno e dello stesso fornitore
  function rcvData(car30) {
    const G2 = new Map();
    car30.forEach(m => {
      const a = C.artOf(m.articolo), sup = String((a && a.fornitore) || '').trim() || (m.doc ? String(m.causale || '').trim() : '') || 'Fornitore non indicato';
      const key = m.doc ? 'd:' + m.doc : 'k:' + String(m.data).slice(0, 10) + '|' + sup.toLowerCase();
      let r = G2.get(key); if (!r) G2.set(key, r = { key, data: String(m.data).slice(0, 10), sup, caus: String(m.causale || '').trim(), L: [], pz: 0, val: 0, cr: '' });
      const q = C.num(m.quantita), cu = C.num(m.costo) || (a ? C.num(a.costo) : 0);
      r.L.push({ m, a, q }); r.pz += q; r.val += q * cu; if (String(m.creato || '') > r.cr) r.cr = String(m.creato || '');
    });
    const out = [...G2.values()].sort((a, b) => b.data.localeCompare(a.data) || b.cr.localeCompare(a.cr));
    out.forEach((r, i) => { r.i = i; r.col = PAL[hashS(r.sup) % PAL.length]; r.code = 'R' + String(i + 1).padStart(2, '0'); r.age = dAgoN(r.data); });
    return out;
  }
  let RCV = null; // { q, rot, lanes: Map(key → {x,z,w,d}), zone }
  function buildRic(g, it, w, d) {
    const hw = L.W / 2, hd = L.D / 2, b2 = { x0: it.x - w / 2, x1: it.x + w / 2, z0: it.z - d / 2, z1: it.z + d / 2 };
    const gaps = [['L', b2.x0 + hw], ['R', hw - b2.x1], ['B', b2.z0 + hd]].sort((a, b) => a[1] - b[1]);
    const side = gaps[0][1] > -.5 && gaps[0][1] < 2.6 ? gaps[0] : null, rot = !side ? 0 : { L: 0, R: Math.PI, B: -Math.PI / 2 }[side[0]];
    const W = side && side[0] === 'B' ? d : w, Dl = side && side[0] === 'B' ? w : d;
    const q = new T.Group(); q.rotation.y = rot; g.add(q);
    const wallX = side ? -W / 2 - side[1] + .16 : -W / 2, R2 = D.rcv, B = new Batch(q), lanes = new Map();
    RCV = { q, rot, lanes, zone: it.id };
    const face = { ry: -rot, ds: true };
    const sign = (tex, sw, sh, x, y, z) => planeT(tex, sw, sh, q, x, y, z, face);
    const frontRes = Dl > 22 && W > 13 ? 7.2 : 0, AP = 4.4;
    // ---- banchine di scarico sul muro (porte, rampe, semafori, camion dei fornitori)
    const roomOut = !!side && !(side[0] === 'L' && D.gas); // a sinistra c'è il parco mezzi: niente camion fuori
    const nd = side ? clamp(Math.floor((Dl - frontRes - 1) / 6.2), 1, 4) : 0, doors = [];
    if (roomOut && nd) { const z0 = -Dl / 2 + .2, z1 = -Dl / 2 + 3.4 + (nd - 1) * 6.2 + 3.1; const ap = mesh(G.box, mat(0x575c64), wallX - 9.6, .075, (z0 + z1) / 2, q, { s: [18.6, .15, z1 - z0], ns: 1 }); ap.receiveShadow = true;
      for (let i = 0; i <= nd; i++) bxS(q, 16, .012, .14, 0xf4f4f2, wallX - 9.2, .15, -Dl / 2 + 3.4 + (i - .5) * 6.2, { ns: 1 }); }
    for (let i = 0; i < nd; i++) {
      const zc = -Dl / 2 + 3.4 + i * 6.2, r = R2[i] && R2[i].age <= 7 ? R2[i] : null; doors.push({ zc, r });
      for (const s of [-1, 1]) { bxS(q, .3, 3.3, .26, 0x1b1d20, wallX + .15, .5, zc + s * 1.95); B.add('bol', G.cyl, mat(0xf2c418), m4(wallX + .55, 1.05, zc + s * 2.35, .2, 1.1, .2)); B.add('bolc', G.cyl, mat(0x2b2f35), m4(wallX + .55, 1.62, zc + s * 2.35, .21, .06, .21)); }
      bxS(q, .32, .32, 4.2, 0x1b1d20, wallX + .16, 3.55, zc);
      meshS(G.cyl, mat(0xd8dbe0), wallX + .4, 3.62, zc, q, { s: [.46, 3.7, .46], rx: Math.PI / 2 });
      if (r) { bxS(q, .04, 3.0, 3.5, 0x23262b, wallX + .05, .52, zc, { ns: 1 }); // portone alzato: si vede il rimorchio
        const P0 = new Batch(q); palletStack(P0, wallX + 1.05, .56, zc - .5, .9, r.col, 3, r.key); palletStack(P0, wallX + 1.05, .56, zc + .5, .55, r.col, 3, r.key); const pi = P0.flush(); Object.values(pi).forEach(im => { im.userData.k = { t: 'ricl', key: r.key, id: it.id }; im.userData.eid = it.id; pick.push(im); });
      } else meshS(G.box, M.door, wallX + .05, .5 + 1.5, zc, q, { s: [.04, 3.0, 3.5] });
      // rampa livellatrice con bordi gialli e neri
      bxS(q, 2.4, .06, 2.3, 0x9ba1a8, wallX + 1.35, .5, zc, { ns: 1 }); for (const s of [-1, 1]) bxS(q, 2.4, .07, .14, M.haz, wallX + 1.35, .5, zc + s * 1.08, { ns: 1 });
      bxS(q, .16, .07, 2.3, M.haz, wallX + 2.6, .5, zc, { ns: 1 });
      if (r) bxS(q, .5, .05, 2.2, 0x7d848d, wallX + .05, .52, zc, { ns: 1, rz: .08 });
      // semaforo e cartello a bandiera con il numero della porta
      bxS(q, .18, .5, .28, 0x2b2f35, wallX + .2, 2.2, zc - 2.35, { ns: 1 });
      B.add(r ? 'lgOn' : 'lgOff', G.sph, MB(r ? 0x2cbf5d : 0x5b6068), m4(wallX + .31, 2.55, zc - 2.35, .1, .1, .1));
      B.add(r ? 'lrOff' : 'lrOn', G.sph, MB(r ? 0x5b6068 : 0xe8432a), m4(wallX + .31, 2.32, zc - 2.35, .1, .1, .1));
      sign(textTex([['R' + (i + 1), 92, 800, 70, null, '#fff'], [r ? 'IN SCARICO' : 'LIBERA', 26, 700, 140, null, 'rgba(255,255,255,.88)']], { bg: r ? '#f47b20' : '#3a3f46', w: 256, h: 180, round: 22 }), .95, .67, wallX + (side[0] === 'B' ? .1 : .9), 3.35, zc - 2.6);
      // corsia gialla davanti alla porta e freccia verso le corsie di sosta
      for (const s of [-1, 1]) B.add('dl', G.box, mat(0xf2c418), m4(wallX + AP / 2 + .6, .553, zc + s * 1.75, AP - .4, .012, .1));
      const ar = planeT(arrowTex(), 1.1, 1.1, q, wallX + AP - .2, .561, zc, {}); ar.rotation.x = -Math.PI / 2; ar.rotation.z = -Math.PI / 2;
      if (r && roomOut) supTruck(q, r, wallX - 9.34, zc, Math.PI, { t: 'ricl', key: r.key, id: it.id }, it.id);
      const hb = new T.Mesh(G.box, M.hit); hb.scale.set(3, 3.4, 4.4); hb.position.set(wallX + 1.5, 2.2, zc); hb.userData.k = r ? { t: 'ricl', key: r.key, id: it.id } : { t: 'zone', z: 'ric', id: it.id }; hb.userData.eid = it.id; q.add(hb); pick.push(hb);
    }
    if (side) { bxS(q, .22, .013, Dl - frontRes - .6, M.haz, wallX + AP + .55, .542, -frontRes / 2, { ns: 1 }); }
    // ---- corsie di sosta: un arrivo per corsia (pallet, cartello, codice a terra)
    const LW = 2.5, LD = 3.0, xL0 = wallX + AP + 1.6, xL1 = W / 2 - .7, zL0 = -Dl / 2 + 1.1, zL1 = Dl / 2 - frontRes - .6;
    const cols = Math.max(1, Math.floor((xL1 - xL0 + .8) / (LW + .8))), rows = Math.max(1, Math.floor((zL1 - zL0 + .9) / (LD + .9)));
    const flab = [], nL = Math.min(R2.length, cols * rows, 28);
    for (let i = 0; i < cols * rows; i++) {
      const c = Math.floor(i / rows), rw = i % rows, lx = xL0 + LW / 2 + c * (LW + .8), lz = zL0 + LD / 2 + rw * (LD + .9), r = i < nL ? R2[i] : null;
      const ln = r ? 0xf2c418 : 0xd9d2c4;
      B.add('lnY', G.box, mat(0xffffff), m4(lx, .552, lz - LD / 2, LW, .012, .07), ln); B.add('lnY', G.box, mat(0xffffff), m4(lx, .552, lz + LD / 2, LW, .012, .07), ln);
      B.add('lnY', G.box, mat(0xffffff), m4(lx - LW / 2, .552, lz, .07, .012, LD), ln); B.add('lnY', G.box, mat(0xffffff), m4(lx + LW / 2, .552, lz, .07, .012, LD), ln);
      flab.push({ x: lx, y: .562, z: lz + LD / 2 + .26, w: .62, h: .22, bg: !r ? '#ece9e3' : r.age <= 0 ? '#ffb27a' : r.age <= 2 ? '#ffd84a' : '#f3ecd8', t: r ? r.code : 'R--' });
      if (!r) continue;
      B.add('tab', G.box, mat(0xffffff), m4(lx, .554, lz - LD / 2 + .2, LW - .2, .014, .26), r.age <= 0 ? 0xf47b20 : r.age <= 2 ? 0xf3a868 : 0xc9c4bb);
      const np = clamp(Math.ceil(r.L.length / 3), 1, 4), f = clamp(r.pz / np / 45, .22, 1), P4 = [[-.5, -.68], [.5, -.68], [-.5, .68], [.5, .68]];
      for (let k = 0; k < np; k++) { const [dx, dz] = P4[k], fk = k === np - 1 ? clamp(f * (.6 + (r.i % 3) * .2), .2, 1) : f, n = palletStack(B, lx + dx, .505, lz + dz, fk, r.col, 3, r.key), ly = Math.ceil(n / 6); B.add('pls', G.box, mat(0xffffff), m4(lx + dx + .12, .505 + .145 + ly * .31 + .006, lz + dz - .2, .22, .01, .3), null, r.key); }
      // cartello della corsia: fornitore, data, pezzi
      sign(laneCard(r), 1.5, .52, lx + LW / 2 - .6, 1.5, lz - LD / 2 + .05);
      B.add('pst', G.box, mat(0x2b2f35), m4(lx + LW / 2 - .6, .5 + .6, lz - LD / 2 + .02, .05, 1.2, .05)); B.add('pstb', G.cyl, mat(0x2b2f35), m4(lx + LW / 2 - .6, .55, lz - LD / 2 + .02, .4, .04, .4));
      const hb = new T.Mesh(G.box, M.hit); hb.scale.set(LW + .3, 1.6, LD + .3); hb.position.set(lx, 1.2, lz); hb.userData.k = { t: 'ricl', key: r.key, id: it.id }; hb.userData.eid = it.id; q.add(hb); pick.push(hb);
      lanes.set(r.key, { x: lx, z: lz, w: LW, d: LD });
    }
    if (flab.length) q.add(quadsMesh(flab, labelAtlas(flab), true));
    // portale con l'insegna sopra le corsie
    { const gx = (xL0 + xL1) / 2, span = Math.min(xL1 - xL0, 11); for (const s of [-1, 1]) { B.add('gp', G.box, mat(0x2b2f35), m4(gx + s * span / 2, .5 + 2.6, -Dl / 2 + .55, .16, 5.2, .16)); B.add('gpb', G.box, M.haz, m4(gx + s * span / 2, .5 + .45, -Dl / 2 + .55, .22, .9, .22)); }
      B.add('gb', G.box, mat(0x2b2f35), m4(gx, 5.3, -Dl / 2 + .55, span, .14, .14));
      sign(textTex([['RICEVIMENTO MERCI', 62, 800, 62, null, '#fff'], [`${R2.length} arrivi negli ultimi 30 giorni`, 26, 600, 118, null, 'rgba(255,255,255,.86)']], { bg: '#f47b20', w: 768, h: 160, round: 18 }), Math.min(span - .4, 6.4), Math.min(span - .4, 6.4) / 4.8, gx, 4.35, -Dl / 2 + .65); }
    // ---- accettazione: bancone, bilancia a pavimento, pallet vuoti, pressa per cartoni, roll
    if (frontRes) {
      const zF = Dl / 2 - frontRes / 2 - .2, xA = wallX + AP + 2.6;
      bxS(q, W - 1.2, .012, .9, 0x4caf6a, (wallX + W / 2) / 2 + .4, .542, Dl / 2 - frontRes + .2, { ns: 1 });
      for (let x = wallX + 1; x < W / 2 - 1; x += 1.4) B.add('wk', G.box, mat(0xffffff), m4(x, .558, Dl / 2 - frontRes + .2, .55, .01, .12));
      // bancone con monitor, stampante etichette e lettore
      bxS(q, 3.2, .08, 1.3, 0xfafafa, xA, 1.32, zF); for (const sx of [-1.5, 1.5]) for (const sz of [-.55, .55]) bxS(q, .07, .82, .07, 0x8e959e, xA + sx, .5, zF + sz);
      bxS(q, 3.1, .5, .05, 0xf47b20, xA, .85, zF + .6, { ns: 1 });
      bxS(q, .07, .3, .07, 0x2b2f35, xA - .6, 1.4, zF - .35); const mon = textTex([['ACCETTAZIONE', 30, 800, 34, null, '#f47b20'], [String(R2.filter(r => r.age <= 0).length), 64, 800, 92, null, '#ffffff'], ['arrivi oggi', 22, 600, 140, null, 'rgba(255,255,255,.7)']], { bg: '#1d2025', w: 256, h: 170, round: 10 });
      bxS(q, .95, .62, .05, 0x1d2025, xA - .6, 1.62, zF - .38); sign(mon, .86, .55, xA - .6, 1.93, zF - .35);
      bxS(q, .34, .26, .32, 0xeeeeec, xA + .55, 1.4, zF - .3); bxS(q, .24, .02, .14, 0xffffff, xA + .55, 1.66, zF - .18, { ns: 1 });
      bxS(q, .1, .06, .26, 0x2b2f35, xA + 1.05, 1.4, zF); bxS(q, .08, .16, .08, 0xf47b20, xA + 1.05, 1.44, zF + .12);
      bxS(q, .5, .32, .4, 0xe3b073, xA + .1, 1.4, zF + .15);
      const op = person(q, xA - .2, zF + 1.0, 0x39a85a, null, { mode: 'work' }); op.rotation.y = Math.PI; movers.push({ o: op, t: 'bob', ph: 1.3 });
      // bilancia a pavimento
      const xS = xA + 4.2; bxS(q, 1.7, .07, 1.7, 0x8e959e, xS, .5, zF, { ns: 1 }); for (const s of [-1, 1]) { bxS(q, 1.9, .08, .12, M.haz, xS, .5, zF + s * .91, { ns: 1 }); bxS(q, .12, .08, 1.9, M.haz, xS + s * .91, .5, zF, { ns: 1 }); }
      bxS(q, .07, 1.3, .07, 0x2b2f35, xS + 1.25, .5, zF - .7); bxS(q, .5, .32, .14, 0x2b2f35, xS + 1.25, 1.75, zF - .7);
      sign(textTex([['0,0 kg', 50, 700, 40, null, '#ff5a3c']], { bg: '#121416', w: 192, h: 80, round: 8 }), .42, .18, xS + 1.25, 1.92, zF - .62);
      // pallet vuoti impilati, pressa per cartoni, roll
      const xP = W / 2 - 1.6; for (let k = 0; k < 9; k++) palletStack(B, xP, .505 + k * .145, zF - 1.2, 0, 0, 1, null);
      bxS(q, 1.5, 2.3, 1.2, 0x8e959e, xP - 2.6, .5, zF + 1.1); bxS(q, 1.54, .34, 1.24, 0xf47b20, xP - 2.6, 2.5, zF + 1.1); bxS(q, .9, .7, .03, 0x2b3440, xP - 2.6, 1.3, zF + 1.725, { ns: 1 });
      bxS(q, 1.1, .8, .75, 0xc9a273, xP - 2.6, .5, zF - .6); for (const s of [-.25, .25]) bxS(q, 1.12, .82, .04, 0x3a3f46, xP - 2.6, .49, zF - .6 + s, { ns: 1 });
      for (let k = 0; k < 3; k++) { const rx = xP - 5.2 - k * .95, rz = zF + 1.2; B.add('rcb', G.box, mat(0x8e959e), m4(rx, .6, rz, .8, .08, .7)); for (const sx of [-.38, .38]) for (const sz of [-.33, .33]) B.add('rcp', G.box, mat(0xb7bcc3), m4(rx + sx, 1.35, rz + sz, .03, 1.5, .03)); for (let y = .9; y < 2.1; y += .3) { B.add('rcw', G.box, mat(0xc5cad1), m4(rx, 0 + y + .5, rz - .33, .78, .015, .015)); B.add('rcw', G.box, mat(0xc5cad1), m4(rx - .38, y + .5, rz, .015, .015, .66)); } if (k < 2) B.add('rcc', G.box, M.carton, m4(rx, .95, rz, .6, .6, .5), mixC(0xffffff, PAL[k + 2], .35)); }
      for (const [cx, cc] of [[wallX + 1.2, 0x2f6db4], [wallX + 2, 0xf2c418]]) { B.add('bin2', G.cyl, mat(0xffffff), m4(cx, .5 + .5, Dl / 2 - 1, .6, 1, .6), cc); B.add('bin2l', G.cyl, mat(0x2b2f35), m4(cx, 1.03, Dl / 2 - 1, .64, .06, .64)); }
      const hb = new T.Mesh(G.box, M.hit); hb.scale.set(W - 1, 2, frontRes - 1); hb.position.set(0, 1, zF); hb.userData.k = { t: 'zone', z: 'ric', id: it.id }; hb.userData.eid = it.id; q.add(hb); pick.push(hb);
    }
    const ims = B.flush(); ['ctn', 'palT', 'palB', 'palS', 'wrap', 'pls'].forEach(k => { const im = ims[k]; if (im && im.userData.ids) { im.userData.k = { t: 'ricl', id: it.id }; im.userData.eid = it.id; pick.push(im); } });
    if (ims.wrap) ims.wrap.castShadow = false;
    // ---- carrello elevatore che porta i pallet dalla porta alla corsia, transpallet con operatore
    const V = (x, z) => new T.Vector3(x, 0, z);
    const lane0 = R2.length ? lanes.get(R2[0].key) : null, dz0 = doors.length ? doors[0].zc : -Dl / 2 + 3;
    const ax = wallX + AP + .2;
    if (lane0 && doors.length) { const st = [], go = (x, z, rev, v) => st.push({ t: 'go', x, z, rev, v }), lz = lane0.z, lx = lane0.x - .5 - 1.62;
      go(ax, dz0); st.push({ t: 'turn', h: -Math.PI / 2 }, { t: 'lift', f: .08 }); go(wallX + 2.7, dz0, false, .6); st.push({ t: 'lift', f: .24 }, { t: 'load', on: true }); go(ax, dz0, true, .7); st.push({ t: 'lift', f: .3 });
      go(ax, lz); st.push({ t: 'turn', h: Math.PI / 2 }); go(lx, lz, false, .6); st.push({ t: 'lift', f: .06 }, { t: 'load', on: false }); go(ax, lz, true, .7); st.push({ t: 'lift', f: .1 }, { t: 'wait', s: 1 });
      const f = forklift(q, ax, dz0); movers.push({ o: f, t: 'fork', steps: st, i: 0, st: null }); }
    else { const st = [{ t: 'go', x: ax, z: zL1 - 1 }, { t: 'wait', s: 1.5 }, { t: 'go', x: ax, z: -Dl / 2 + 3 }, { t: 'wait', s: 1.5 }], f = forklift(q, ax, -Dl / 2 + 3); movers.push({ o: f, t: 'fork', steps: st, i: 0, st: null }); }
    if (doors.length > 1 || R2.length > 1) { const dz1 = doors.length > 1 ? doors[1].zc : dz0, l1 = R2[1] ? lanes.get(R2[1].key) : null, tz = l1 ? l1.z + 1.5 : dz1 + 3, tx = l1 ? l1.x - LW / 2 - 1.1 : ax + 2;
      const jg = new T.Group(); q.add(jg); const op = person(jg, 0, -1.25, 0xf47b20, null, { mode: 'push' }); palletJack(jg);
      const pj = new Batch(jg); palletStack(pj, 0, .6, .45, .5, R2[1] ? R2[1].col : PAL[1], 2, null); pj.flush(); jg.userData.rig = op.userData.rig;
      movers.push(route(jg, [V(wallX + 2.9, dz1), V(ax - .8, dz1), V(ax - .8, tz), V(tx, tz), V(ax - .8, tz), V(ax - .8, dz1)], .9, 4)); }
    // controllore con lettore e tablet vicino all'ultimo arrivo
    if (lane0) { const p = person(q, lane0.x + LW / 2 + .5, lane0.z + .4, 0x39a85a, null, { mode: 'scan' }); p.rotation.y = -Math.PI / 2; movers.push({ o: p, t: 'bob', ph: 2.1 }); }
  }
  const MB = c => M['mb' + c] || (M['mb' + c] = new T.MeshBasicMaterial({ color: c }));
  function laneCard(r) {
    const sup = r.sup, sub = `${r.code} · ${agoTxt(r.data)} · ${N(r.pz)} pz`, col = '#' + new T.Color(r.col).getHexString();
    const t = cvTex(384, 132, (gx, w, h) => { gx.fillStyle = '#ffffff'; gx.beginPath(); gx.roundRect(0, 0, w, h, 16); gx.fill(); gx.fillStyle = col; gx.beginPath(); gx.roundRect(0, 0, 16, h, [16, 0, 0, 16]); gx.fill();
      gx.textAlign = 'left'; gx.textBaseline = 'middle'; let fs = 36; gx.font = `800 ${fs}px Inter, system-ui, sans-serif`; while (fs > 20 && gx.measureText(sup).width > w - 52) { fs -= 2; gx.font = `800 ${fs}px Inter, system-ui, sans-serif`; } let s2 = sup; while (gx.measureText(s2).width > w - 52 && s2.length > 3) s2 = s2.slice(0, -2); if (s2 !== sup) s2 += '…';
      gx.fillStyle = '#16181b'; gx.fillText(s2, 34, 46); gx.font = '600 24px Inter, system-ui, sans-serif'; gx.fillStyle = '#8a8d93'; gx.fillText(sub, 34, 96); });
    OWN.push(t); return t;
  }
  // camion del fornitore (motrice + rimorchio) in retromarcia contro la porta
  function supTruck(p, r, x, z, ry, k, eid) {
    const g = new T.Group(); g.position.set(x, .1, z); g.rotation.y = ry; p.add(g);
    const b = (w, h, dd, c, xx, y, zz) => mesh(G.box, mat(c), xx, y, zz, g, { s: [w, h, dd] }), band = mixC(r.col, 0x2b2f35, .15);
    b(13.4, 3.7, 2.55, 0xfbfbfa, -2.3, 2.55, 0); b(13.45, .5, 2.6, band, -2.3, .95, 0); b(13.4, .1, 2.56, 0xe1e2e4, -2.3, 4.45, 0);
    b(.1, 3.7, 2.62, 0x9aa0a8, -9.04, 2.55, 0); for (const s2 of [-1, 1]) b(1.24, 3.5, .05, 0xeef0f2, -8.4, 2.55, s2 * 1.33);
    const sup = r.sup.toUpperCase().slice(0, 22), lt = textTex([[sup, Math.min(64, Math.floor(1500 / Math.max(8, sup.length))), 800]], { color: '#2b2f35', w: 768, h: 128 });
    planeT(lt, 6.5, 1.08, g, -2.3, 3, 1.288); const l2 = planeT(lt, 6.5, 1.08, g, -2.3, 3, -1.288); l2.rotation.y = Math.PI;
    b(2.5, 2.9, 2.5, 0xffffff, 5.9, 2.25, 0); b(.08, 1.1, 2.2, 0x2b3440, 7.17, 3.05, 0); b(.6, 1.2, 2.3, 0xffffff, 6.9, 1.4, 0); b(.05, .5, 1.6, 0x2b2f35, 7.235, 1.3, 0);
    b(2.52, .45, 2.52, band, 5.9, 1.25, 0); for (const s2 of [-1, 1]) { b(.1, .55, .12, 0x1d1f22, 6.9, 3, s2 * 1.42); b(.5, .1, .7, 0x2b2f35, 4.6, .9, s2 * 1.1); }
    b(2.2, .25, 2.2, 0x2b2f35, 4.2, .9, 0);
    [[-8, 1.05], [-6.9, 1.05], [-5.8, 1.05], [5.9, 1.05], [3.9, 1.05]].forEach(([wx, wz]) => { for (const s2 of [-1, 1]) { meshS(G.cyl, mat(0x1d1f22), wx, .58, s2 * wz, g, { s: [1.1, .38, 1.1], rx: Math.PI / 2 }); meshS(G.cyl, mat(0xc5cad1), wx, .58, s2 * (wz + .2), g, { s: [.5, .02, .5], rx: Math.PI / 2, ns: 1 }); } });
    g.traverse(o => { if (o.isMesh) { o.userData.k = k; o.userData.eid = eid; pick.push(o); } });
    return g;
  }
  function arrowTex() { if (TX.arrow) return TX.arrow; TX.arrow = cvTex(128, 128, (gx, w, h) => { gx.fillStyle = 'rgba(255,255,255,.9)'; gx.beginPath(); gx.moveTo(w / 2, 8); gx.lineTo(w - 14, h / 2); gx.lineTo(w / 2 + 18, h / 2); gx.lineTo(w / 2 + 18, h - 8); gx.lineTo(w / 2 - 18, h - 8); gx.lineTo(w / 2 - 18, h / 2); gx.lineTo(14, h / 2); gx.closePath(); gx.fill(); }); return TX.arrow; }
  // percorso a velocità costante, con curve morbide
  function route(o, pts, sp, ph) { const segL = []; let tot = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], l = Math.max(.01, a.distanceTo(b)); segL.push(l); tot += l; } return { o, t: 'route', pts, segL, tot, sp, ph: ph || 0 }; }
  function routeTick(m, t, dt) {
    let s = ((t * m.sp + m.ph) % m.tot + m.tot) % m.tot, i = 0; while (s > m.segL[i]) { s -= m.segL[i]; i++; }
    const a = m.pts[i], b = m.pts[(i + 1) % m.pts.length], u = s / m.segL[i]; m.o.position.x = a.x + (b.x - a.x) * u; m.o.position.z = a.z + (b.z - a.z) * u;
    let tg = Math.atan2(b.x - a.x, b.z - a.z), cur = m.o.rotation.y, df = tg - cur; while (df > Math.PI) df -= 2 * Math.PI; while (df < -Math.PI) df += 2 * Math.PI;
    m.o.rotation.y = cur + df * Math.min(1, dt * 7);
  }
  // messa a fuoco di una corsia: staffe, pallet che si sollevano, volo della camera
  let RF = null, RH = null;
  function laneW(key) { if (!RCV) return null; const ln = RCV.lanes.get(key); if (!ln) return null; RCV.q.updateWorldMatrix(true, false); return { ln, p: RCV.q.localToWorld(new T.Vector3(ln.x, 1.05, ln.z)) }; }
  function ricFocus(key) {
    ricUnfocus(); const w = laneW(key); if (!w) return null; const br = brackets(0xf47b20, 1); br.set(w.ln.w + .3, 1.3, w.ln.d + .3); br.grp.position.copy(w.p); br.grp.rotation.y = RCV.rot; br.grp.visible = true;
    RF = { key, br, insts: cellInsts(RCV.q, key), u: 0 }; return w;
  }
  function ricUnfocus() { if (!RF) return; const F = RF; RF = null; if (F.insts.length) BACK.push({ insts: F.insts, from: F.cur || { dy: 0, dz: 0 }, t: 0 }); WH && WH.remove(F.br.grp); }
  function ricTick(t, dt) {
    if (RF) { RF.u = Math.min(1, RF.u + dt / .9); const e = easeOut(RF.u), dy = .32 * Math.sin(Math.PI * Math.min(1, RF.u * 1.15)) * (1 - RF.u * .3) + .06 * e; RF.cur = { dy, dz: 0 }; if (RF.insts.length) setOff(RF.insts, dy, 0);
      const s = 1 + (1 - easeOut(Math.min(1, RF.u * 1.4))) * .3 + Math.sin(t * 3) * .012; RF.br.grp.scale.set(s, s, s); RF.br.im.material.opacity = Math.min(1, RF.u * 2); RF.br.fill.material.opacity = .05 + Math.sin(t * 3) * .025; }
  }
  function hoverRic(key, cx, cy) {
    const tip = $('.m3-tip'); if (!tip) return;
    if (!key || EDIT || (RF && RF.key === key)) { if (RH) { WH && WH.remove(RH.br.grp); RH = null; } if (!key) return; tip.classList.remove('on'); return; }
    const r = D.rcv.find(x => x.key === key); if (!r) return;
    if (!RH || RH.key !== key) { if (RH) WH.remove(RH.br.grp); RH = null; const w = laneW(key); if (w) { const br = brackets(0xffffff, .95); br.set(w.ln.w + .3, 1.3, w.ln.d + .3); br.grp.position.copy(w.p); br.grp.rotation.y = RCV.rot; br.grp.visible = true; RH = { key, br }; }
      tip.innerHTML = `<b>${esc(r.sup)}</b><span><i class="m3-loc">${esc(r.code)}</i>${esc(agoTxt(r.data))} · ${r.L.length} ${r.L.length === 1 ? 'riga' : 'righe'} · ${N(r.pz)} pz</span>`; }
    const rc = root.getBoundingClientRect(); tip.style.transform = `translate(${cx - rc.left + 16}px,${cy - rc.top + 18}px)`; tip.classList.add('on');
  }
  function ricView(key) {
    const w = ricFocus(key); if (!w) { const z = L.items.find(i => i.t === 'zone' && i.k === 'ric'); if (z) flyT(zoneTarget('ric')); return; }
    fly({ tx: w.p.x, ty: .6, tz: w.p.z, dist: 19, az: -0.42, pol: .94 });
  }
  // pannelli
  const chipAge = r => `<span class="m3-chip ${r.age <= 0 ? 'a' : r.age <= 2 ? 'g' : 'n'}"><i></i>${esc(agoTxt(r.data))}</span>`;
  const rcvRow = (r, hl) => `<button type="button" class="m3-row${hl ? ' k' : ''}" data-rcv3="${esc(r.key)}"><i class="m3-pi m3-rcc" style="--c:#${new T.Color(r.col).getHexString()}">${esc(r.code)}</i><span class="tx"><b>${esc(r.sup)}</b><small>${esc([C.dIt(r.data), r.L.length + (r.L.length === 1 ? ' riga' : ' righe'), r.caus].filter(Boolean).join(' · '))}</small></span><span class="m3-chip g">+${N(r.pz)}</span></button>`;
  function ricPanel(Pn) {
    const R2 = D.rcv, pz = R2.reduce((s, r) => s + r.pz, 0), val = R2.reduce((s, r) => s + r.val, 0), sups = new Map();
    R2.forEach(r => { const s = sups.get(r.sup) || { n: 0, pz: 0, col: r.col }; s.n++; s.pz += r.pz; sups.set(r.sup, s); });
    if (Pn.t === 'ricl') {
      const r = R2.find(x => x.key === Pn.key); if (!r) return '';
      const stocked = r.L.filter(l => P.byArt.get(l.m.articolo)).length, cr = r.cr ? new Date(r.cr) : null;
      const lines = r.L.slice().sort((a, b) => b.q - a.q).map(l => { const p2 = P.byArt.get(l.m.articolo), x = D.arts.find(y => y.id === l.m.articolo); return `<button type="button" class="m3-row" ${p2 ? `data-art3="${esc(l.m.articolo)}"` : ''}><i class="m3-pi" style="width:30px;height:30px;border-radius:9px">${ic('box')}</i><span class="tx"><b>${esc(l.a ? l.a.descrizione : 'Articolo eliminato')}</b><small>${esc([l.a && l.a.codice, x ? 'giacenza ' + N(x.g) + ' ' + (l.a.um || 'pz') : ''].filter(Boolean).join(' · '))}</small></span><span class="m3-chip g">+${N(l.q)}</span>${p2 ? `<span class="m3-loc m3-go2">${ic('pin', ' style="width:11px;height:11px"')}${esc(p2.code)}</span>` : '<span class="m3-chip n">a terra</span>'}</button>`; }).join('');
      return head(ic('dock'), 'or', `Arrivo · corsia ${esc(r.code)}`, esc(r.sup), esc([C.dIt(r.data), r.caus].filter(Boolean).join(' · ')), 1) + `<div class="m3-pb">
        <div class="m3-chips">${chipAge(r)}<span class="m3-chip n">${r.L.length} ${r.L.length === 1 ? 'riga' : 'righe'}</span></div>
        <div class="m3-grid">${stat('Pezzi ricevuti', N(r.pz), '', `${r.L.length} ${r.L.length === 1 ? 'articolo' : 'articoli'}`)}${stat('Valore a costo', r.val ? C.eur0(r.val) : '—', '', 'IVA esclusa')}</div>
        <div class="m3-steps"><div class="d"><i>${ic('truck')}</i><span><b>Arrivato</b><small>${esc(C.dIt(r.data))}</small></span></div><div class="d"><i>${ic('check')}</i><span><b>Caricato a sistema</b><small>${cr && !isNaN(cr) ? esc(cr.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })) : 'movimento registrato'}</small></span></div><div class="${stocked === r.L.length ? 'd' : 'w'}"><i>${ic('rack')}</i><span><b>A scaffale</b><small>${stocked}/${r.L.length} con ubicazione</small></span></div></div>
        ${canW() ? `<button type="button" class="m3-go" data-gx="mov-new">${ic('plus')}Nuovo carico</button>` : ''}
        <div class="m3-h4">Righe dell'arrivo <em>tocca per andare allo scaffale</em></div><div class="m3-rows">${lines}</div></div>`;
    }
    // giorni: pezzi ricevuti negli ultimi 14 giorni
    const days = []; for (let i = 13; i >= 0; i--) { const dd = new Date(C.today() + 'T12:00:00'); dd.setDate(dd.getDate() - i); const k = dd.toISOString().slice(0, 10); days.push({ k, v: R2.filter(r => r.data === k).reduce((s, r) => s + r.pz, 0), n: R2.filter(r => r.data === k).length, w: dd.getDay() }); }
    const mx = Math.max(1, ...days.map(x => x.v)), GG = ['D', 'L', 'M', 'M', 'G', 'V', 'S'];
    const top = [...sups.entries()].sort((a, b) => b[1].pz - a[1].pz).slice(0, 5), tmx = Math.max(1, ...top.map(x => x[1].pz));
    const today = R2.filter(r => r.age <= 0);
    return head(ic('dock'), '', 'Zona', 'Ricevimento merci', 'Banchine fornitori · corsie di sosta · accettazione', 1) + `<div class="m3-pb"><div class="m3-grid">
      ${stat('Arrivi in 30 giorni', R2.length, '', `${today.length} oggi`)}${stat('Pezzi ricevuti', N(pz), '', `${D.car30.length} righe di carico`)}
      ${stat('Valore a costo', val ? C.eur0(val) : '—', '', 'IVA esclusa')}${stat('Fornitori', sups.size, '', R2[0] ? 'ultimo ' + agoTxt(R2[0].data).toLowerCase() : 'nessun arrivo')}</div>
      ${canW() ? `<button type="button" class="m3-go" data-gx="mov-new">${ic('plus')}Nuovo carico</button>` : ''}
      <div class="m3-h4">Pezzi ricevuti · ultimi 14 giorni</div>
      <div class="m3-b14">${days.map((x, i) => `<div title="${esc(C.dIt(x.k))}: ${x.n} arrivi, ${N(x.v)} pezzi"><i style="--h:${(x.v / mx * 100).toFixed(1)}%;--k:${i}"${i === 13 ? ' class="c"' : ''}></i><small${x.w === 0 || x.w === 6 ? ' class="we"' : ''}>${GG[x.w]}</small></div>`).join('')}</div>
      ${top.length ? `<div class="m3-h4">Fornitori principali <em>${sups.size}</em></div><div class="m3-hb">${top.map(([n, s], i) => `<div style="--k:${i}"><span><b>${esc(n)}</b><small>${s.n} ${s.n === 1 ? 'arrivo' : 'arrivi'} · ${N(s.pz)} pz</small></span><u><i style="--w:${(s.pz / tmx * 100).toFixed(1)}%;--c:#${new T.Color(s.col).getHexString()}"></i></u></div>`).join('')}</div>` : ''}
      <div class="m3-h4">Arrivi <em>${R2.length}</em></div><div class="m3-rows">${R2.slice(0, 30).map(r => rcvRow(r)).join('') || '<div class="m3-empty">Nessun carico negli ultimi 30 giorni</div>'}</div></div>`;
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
    if (!on || !FOC || !FOC.art) { co.classList.remove('on'); ld.classList.remove('on'); root.classList.remove('co-on'); return; }
    root.classList.add('co-on');
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
  let o3 = null, viewOff = 0, viewOffY = 0;
  function animate(t, dt) {
    if (!o3) o3 = new T.Object3D();
    movers.forEach(m => {
      const s = t * (m.sp || 1) + (m.ph || 0);
      if (m.t === 'path') { const u = (Math.sin(s) + 1) / 2, dir = Math.cos(s) >= 0 ? 1 : -1; m.o.position.lerpVectors(m.a, m.b, u); m.o.rotation.y = Math.atan2((m.b.x - m.a.x) * dir, (m.b.z - m.a.z) * dir); }
      else if (m.t === 'loop') { m.o.position.x = m.cx + Math.cos(s) * m.rx; m.o.position.z = m.cz + Math.sin(s) * m.rz; m.o.rotation.y = -s; }
      else if (m.t === 'fork') fkTick(m, t, dt);
      else if (m.t === 'walk' && m.o.userData.rig) strollTick(m, t, dt);
      else if (m.t === 'walk') { const u = (Math.sin(s) + 1) / 2, dir = Math.cos(s) >= 0 ? 1 : -1; m.o.position.x = m.a.x + (m.b.x - m.a.x) * u; m.o.position.z = m.a.z + (m.b.z - m.a.z) * u; m.o.rotation.y = Math.atan2((m.b.x - m.a.x) * dir, (m.b.z - m.a.z) * dir); m.o.position.y = .5 + Math.abs(Math.sin(t * 6 + m.ph)) * .05; }
      else if (m.t === 'route') routeTick(m, t, dt);
      else if (m.t === 'pcart') pcartTick(m, t, dt);
      else if (m.t === 'bob' && m.o.userData.rig) { }
      else if (m.t === 'bob') m.o.position.y = .5 + Math.abs(Math.sin(t * 2 + m.ph)) * .03;
      else if (m.t === 'spin') m.o.rotation.y = Math.sin(t * m.sp) * 1.3;
      else if (m.t === 'float') m.o.position.y = m.y + Math.sin(t * 1.2) * .25;
      else if (m.t === 'pump') { if (t - m.last > .12) { m.last = t; const u = (t % 11) / 8; pumpDraw(Math.min(1, u) * m.l, m.price); } }
      else if (m.t === 'sway' || m.t === 'tex' || m.t === 'flag' || m.t === 'ftn' || m.t === 'cloud' || m.t === 'birds' || m.t === 'gate') outdoorTick(m, t, dt);
      else if (m.t === 'road') { m.o.position.x += m.dir * m.sp * dt; if (m.o.position.x > 330) m.o.position.x = -330; if (m.o.position.x < -330) m.o.position.x = 330; }
      else if (m.t === 'belt') { for (let i = 0; i < m.n; i++) { const u = (t * m.sp + i / m.n) % 1; o3.position.set(-m.len / 2 + .5 + u * (m.len - 1), 1.22 + .2, 0); o3.rotation.set(0, (i % 3) * .2, 0); o3.scale.set(.55, .4, .5); o3.updateMatrix(); m.im.setMatrixAt(i, o3.matrix); } m.im.instanceMatrix.needsUpdate = true; }
      if (m.t !== 'fork' && m.o && m.o.userData && m.o.userData.rig) rigTick(m.o, t, dt);
    });
    if (hiMesh && hiMesh.visible) hiMesh.material.opacity = .25 + Math.sin(t * 4) * .12;
    focusTick(t, dt); ricTick(t, dt); offTick(t, dt); canoTick(dt); glsTick(t, dt); prepTick(t, dt);
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
    } else if (Pn.t === 'ricl' || (Pn.t === 'zone' && Pn.z === 'ric')) {
      h = ricPanel(Pn); if (!h) return panel({ t: 'zone', z: 'ric' });
    } else if ((Pn.t === 'zone' && Pn.z === 'pre') || Pn.t === 'belt' || Pn.t === 'desk') {
      h = prepPanel(Pn);
    } else if (Pn.t === 'pick') {
      h = pickPanel(Pn); if (!h) return panel({ t: 'zone', z: 'pre' });
    } else if (Pn.t === 'zone' && Pn.z === 'cq') {
      h = cqPanel();
    } else if (Pn.t === 'zone' && Pn.z === 'spe') {
      h = head(ic('truck'), '', 'Zona', 'Spedizioni', 'Banchine · carico camion · corriere · consegne ai clienti', 1) + `<div class="m3-pb">${glsCard()}<div class="m3-grid">
        ${stat('DDT del mese', D.ddtM.length, '', `${N(D.ddtM.reduce((s, x) => s + C.num(x.d.colli), 0))} colli`)}${stat('Da fatturare', D.ddt.filter(x => !x.d.fattura).length, '', 'DDT senza fattura', D.ddt.length ? D.ddt.filter(x => x.d.fattura).length / D.ddt.length : 0)}</div>
        <button type="button" class="m3-go" data-gx="ddt-new">${ic('plus')}Nuovo DDT</button>
        <div class="m3-h4">Spedizioni <em>${D.ddt.length}</em></div><div class="m3-rows">${D.ddt.slice(0, 20).map(x => { const i = trucks.findIndex(t => t.d === x); return `<button type="button" class="m3-row" ${i >= 0 ? `data-trk3="${i}"` : `data-gx="ddt-pdf" data-id="${esc(x.d.id)}"`}><i class="m3-pi" style="width:30px;height:30px;border-radius:9px">${ic('truck')}</i><span class="tx"><b>DDT ${esc(C.dnum(x.d))} · ${esc(x.cliN)}</b><small>${esc([C.dIt(x.d.data), C.num(x.d.colli) ? N(C.num(x.d.colli)) + ' colli' : '', x.R.length + ' righe'].filter(Boolean).join(' · '))}</small></span>${x.d.fattura ? '<span class="m3-chip g"><i></i>Fatturato</span>' : '<span class="m3-chip a"><i></i>Da fatturare</span>'}</button>`; }).join('') || '<div class="m3-empty">Nessun DDT</div>'}</div></div>`;
    } else if (Pn.t === 'gls') {
      h = glsPanel(Pn); if (!h) return panel({ t: 'zone', z: 'spe' });
    } else if (Pn.t === 'acc') {
      h = accPanel(Pn); if (!h) return panel({ t: 'zone', z: 'uffe' });
    } else if (Pn.t === 'ofr' || (Pn.t === 'zone' && (Pn.z === 'uffe' || Pn.z === 'uff'))) {
      h = offPanel(Pn); if (!h) return panel({ t: 'zone', z: 'uffe' });
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
    const sub = { flotta: D.gas ? `${D.gas.V.length} mezzi · ${N(Math.round(D.gas.lM))} L` : '', all: `${pc(D.disp, D.nArt)} % · ${N(D.tot)} pezzi`, ric: `${D.rcv.length} arrivi · 30 gg`, stk: `${N(P.byArt.size)}/${N(nv)} ubicazioni`, pre: `${D.ddtM.length} DDT · mese`, cq: `${D.ret90.length} rettifiche · 90 gg`, spe: `${D.ddt.filter(x => !x.d.fattura).length} da fatturare`, uffe: `${D.cli.length} clienti` }[z] || '';
    $('.m3-zt small').textContent = sub;
    $$('.m3-fs button[data-fgo]').forEach(b => b.classList.toggle('on', b.dataset.fgo.split(':')[0] === z && b.dataset.on === '1' && (!b.dataset.fgo.includes(':') || b.dataset.fgo.endsWith(':' + OFT))));
  }
  function select(k, noFly) {
    if (EDIT) return;
    sel = k; stopTour(k && k._tour); if (hiMesh) hiMesh.visible = false; if (!k || !(k.t === 'rack' && k.art)) { unfocus(); hoverArt(null); } if (!k || k.t !== 'ricl') ricUnfocus(); hoverRic(null); if (OFF) OFF.want = !!(k && (k.t === 'ofr' || k.t === 'acc' || (k.t === 'zone' && (k.z === 'uffe' || k.z === 'uff')))); if (!k || (k.t !== 'ofr' && k.t !== 'acc')) offUnfocus(); if (!k || k.t !== 'pick') pickClear(); if (CANO) CANO.want = k && k.t === 'fuel' ? .14 : 1; if (!k || k.t !== 'rack' || k.art) { xrayOff(RX); RX = []; }
    if (!k) { root.classList.add('np'); root.classList.remove('pn'); zoneChip('all'); return; }
    if (k.t === 'zone') { zoneChip(['ric', 'stk', 'pre', 'cq', 'spe', 'uffe', 'all', 'flotta'].includes(k.z) ? k.z : 'all'); if (!noFly) { const z = k.id && L.items.find(i => i.id === k.id); if (z && !['ric', 'pre', 'cq', 'spe'].includes(k.z)) flyT({ x: z.x, z: z.z, dist: Math.max(z.w, z.d) * 1.6 + 26, az: -0.6, pol: .92 }); else flyT(zoneTarget(k.z === 'uff' ? 'uffe' : k.z)); } }
    else if (k.t === 'rack') { zoneChip('stk'); const it = rackOf(k.id); if (it) { if (k.art) { const p2 = P.byArt.get(k.art); if (p2 && p2.rk === it) { hoverArt(null); focusCell(it, p2.b, p2.l, k.art); if (!noFly) rackView(it, cellLocal(it, p2.b, p2.l)); xrayFor(); } } else { if (!noFly) rackView(it); scanRack(it); xrayRack(it); } } }
    else if (k.t === 'ofr') { zoneChip('uffe'); OFT = k.kd; if (!noFly) offView(k.kd, k.id); else offFocus(k.kd, k.id); }
    else if (k.t === 'pick') { zoneChip('pre'); const x = D.ddt.find(y => y.d.id === k.id); if (x && (!PICK || PICK.x !== x)) pickShow(x, noFly); }
    else if (k.t === 'gls') { zoneChip('spe'); if (k.m) { GLSM = k.m; if (GLS3) GLS3.X = glsData(GLSM); } if (!noFly && GLS3) fly({ tx: GLS3.wp.x, ty: 1.2, tz: GLS3.wp.z, dist: 25, az: GLS3.ry - 0.35, pol: .86 }); }
    else if (k.t === 'acc') { zoneChip('uffe'); const id = k.id === 'doc' ? 'doc' : 'cont'; if (!noFly) offView('acc', id); else offFocus('acc', id); }
    else if (k.t === 'ricl') { zoneChip('ric'); if (!k.key) return select({ t: 'zone', z: 'ric', id: k.id }, noFly); if (!noFly) ricView(k.key); else ricFocus(k.key); }
    else if (k.t === 'fuel') { zoneChip('flotta'); if (!noFly) { const F = FL(); fly({ tx: F.st.x + .5, ty: 1.4, tz: F.st.z + 1, dist: 30, az: -0.55, pol: 1.0 }); } }
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
    const st = [['fornitori', 'Fornitori', 'factory', 'uffe:for', 1], ['ric', 'Ricevimento', 'dock', 'ric', 1], ['stk', 'Scaffalature', 'rack', 'stk', 1], ['pre', 'Preparazione', 'hand', 'pre', 1], ['cq', 'Controllo', 'shield', 'cq', 1], ['spe', 'Spedizione', 'truck', 'spe', 1], ['mez', 'Mezzi', 'fuel', 'flotta', 1], ['cli', 'Clienti', 'users', 'uffe:cli', 1]].filter(s => s[3].startsWith('uffe') || zoneTarget(s[3]));
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
      + (OFF ? [...OFF.OD.CL, ...OFF.OD.FR].filter(e => (e.name + ' ' + e.city + ' ' + ((e.o && e.o.piva) || '')).toLowerCase().includes(s)).slice(0, 5).map(e => `<button type="button" data-ofr="${e.kd}:${esc(e.id)}"><i>${e.kd === 'cli' ? 'CLI' : 'FOR'}</i><span><b>${esc(e.name)}</b><small>${esc([e.kd === 'cli' ? 'cliente' : 'fornitore', e.room ? 'ufficio ' + e.room : '', stTxt(e)].filter(Boolean).join(' · '))}</small></span></button>`).join('') : '')
      + (glsOk() ? (() => { const all = C.gls() || [], kw = 'gls corriere spedizioni spedizione pacchi'.includes(s) || s.includes('gls') || s.includes('corrier'); const hits = s.length > 2 ? all.filter(r => `${r.destinatario} ${r.citta} ${r.nsped} ${r.rif}`.toLowerCase().includes(s)).slice(0, 4) : []; return (kw ? `<button type="button" data-gls=""><i>GLS</i><span><b>Corriere GLS</b><small>costi, destinazioni, contratti e controlli</small></span></button>` : '') + hits.map(r => `<button type="button" data-gls="${esc(r.mese || '')}" data-glsq="${esc(r.nsped || r.destinatario || '')}"><i>GLS</i><span><b>${esc(r.destinatario || '—')} · ${esc(r.citta || '')}</b><small>${esc([r.nsped, C.dIt(r.data), gEu(r.totale)].filter(Boolean).join(' · '))}</small></span></button>`).join(''); })() : '')
      + (ACC ? [['cont', 'Contabilità', 'conto economico · iva · scadenze', 'contabilita contabilità iva scadenze scadenzario utile ricavi costi bilancio conto economico amministrazione'], ['doc', 'Archivio documenti', `${ACC.X.tot} documenti`, 'archivio documenti fatture ddt righe costo amministrazione']].filter(r => r[3].includes(s) || r[1].toLowerCase().includes(s)).map(r => `<button type="button" data-acc="${r[0]}"><i>AMM</i><span><b>${r[1]}</b><small>${esc(r[2])}</small></span></button>`).join('') : '')
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

  /* ---------------- v288: scelta dell'ubicazione dalla mappa del magazzino (popup 2D, si apre anche senza il 3D) ---------------- */
  const LCSS = `
.m3l{position:fixed;inset:0;z-index:80;display:grid;place-items:center;padding:18px;background:rgba(18,20,24,.46);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);animation:m3lf .25s ease both;font-family:Inter,system-ui,sans-serif;color:#16181b}
@keyframes m3lf{from{opacity:0}}@keyframes m3lu{from{opacity:0;transform:translateY(14px) scale(.985)}}
.m3l-c{width:min(1100px,100%);max-height:min(860px,100%);display:flex;flex-direction:column;background:#fff;border-radius:22px;box-shadow:0 30px 80px rgba(0,0,0,.28);overflow:hidden;animation:m3lu .35s cubic-bezier(.2,.8,.2,1) both}
.m3l-h{display:flex;align-items:center;gap:12px;padding:16px 18px 12px;border-bottom:1px solid #efeeeb}
.m3l-h .pi{flex:none;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:#fff1e6;color:#f47b20}.m3l-h .pi svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.m3l-h div{flex:1;min-width:0}.m3l-h small{display:block;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#f47b20}.m3l-h div>b{display:block;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.m3l-h em{font-style:normal;font-size:12.5px;color:#6b6e73}
.m3l-x{all:unset;cursor:pointer;width:36px;height:36px;border-radius:11px;display:grid;place-items:center;color:#6b6e73;background:#f5f4f2}.m3l-x:hover{background:#ecebe8}.m3l-x svg{width:18px;height:18px;stroke:currentColor;stroke-width:2;fill:none}
.m3l-b{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1.35fr) minmax(300px,1fr);overflow:hidden}
.m3l-s{min-width:0}
.m3l-map{position:relative;background:#f6f5f2;overflow:hidden;min-height:260px;touch-action:none}
.m3l-map svg{width:100%;height:100%;display:block;cursor:grab}.m3l-map svg.dr{cursor:grabbing}
.m3l-map .rk{cursor:pointer}.m3l-map .rk rect.b{transition:fill .2s,stroke .2s}.m3l-map .rk:hover rect.b{stroke:#f47b20;stroke-width:.25}
.m3l-map .rk.on rect.b{stroke:#f47b20;stroke-width:.35;fill:#fff1e6}
.m3l-zm{position:absolute;right:10px;bottom:10px;display:flex;flex-direction:column;gap:6px}.m3l-zm button{all:unset;cursor:pointer;width:34px;height:34px;border-radius:10px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.12);display:grid;place-items:center;font-size:18px;font-weight:700;color:#3a3f46}
.m3l-hint{position:absolute;left:10px;top:10px;font-size:11.5px;color:#6b6e73;background:rgba(255,255,255,.9);padding:5px 9px;border-radius:9px}
.m3l-s{display:flex;flex-direction:column;min-height:0;border-left:1px solid #efeeeb}
.m3l-rks{display:flex;gap:6px;overflow-x:auto;padding:12px 14px 8px;scrollbar-width:none}.m3l-rks::-webkit-scrollbar{display:none}
.m3l-rks button{all:unset;flex:none;cursor:pointer;padding:6px 10px;border-radius:10px;background:#f5f4f2;font-size:12.5px;font-weight:700;display:flex;gap:6px;align-items:center;transition:background .2s}
.m3l-rks button em{font-style:normal;font-weight:600;color:#8a8d93;font-size:11px}.m3l-rks button.on{background:#16181b;color:#fff}.m3l-rks button.on em{color:rgba(255,255,255,.6)}.m3l-rks button.cur::before{content:'';width:7px;height:7px;border-radius:50%;background:#f47b20}
.m3l-sc{flex:1;min-height:0;overflow:auto;padding:4px 14px 12px}
.m3l-rt{display:flex;justify-content:space-between;align-items:baseline;margin:4px 0 8px}.m3l-rt b{font-size:15px}.m3l-rt span{font-size:12px;color:#8a8d93}
.m3l-g{display:grid;grid-template-columns:22px repeat(var(--n),minmax(30px,1fr));gap:4px;min-width:max-content}
.m3l-g .lv{font-size:10.5px;color:#8a8d93;display:grid;place-items:center}.m3l-g .bh{font-size:10px;color:#8a8d93;text-align:center}
.m3l-g button{all:unset;box-sizing:border-box;cursor:pointer;height:34px;border-radius:8px;background:#fff;border:1.5px dashed #d6d4cf;position:relative;transition:transform .15s,box-shadow .15s;animation:m3lu .3s cubic-bezier(.2,.8,.2,1) both;animation-delay:var(--d)}
.m3l-g button:hover{transform:translateY(-1px);box-shadow:0 3px 10px rgba(0,0,0,.1)}
.m3l-g button.o{border:none;background:var(--c)}.m3l-g button.o::after{content:'';position:absolute;inset:auto 5px 5px 5px;height:4px;border-radius:2px;background:rgba(255,255,255,.55)}
.m3l-g button.me{background:#f47b20;border:none}.m3l-g button.me::before{content:'';position:absolute;inset:0;margin:auto;width:10px;height:10px;border-radius:50%;background:#fff}
.m3l-g button.lo{box-shadow:inset 0 0 0 2px #d9452f}
.m3l-g button.k{outline:3px solid #16181b;outline-offset:2px;z-index:1}
.m3l-lg{display:flex;flex-wrap:wrap;gap:12px;margin:10px 0 2px;font-size:11.5px;color:#6b6e73}.m3l-lg span{display:flex;gap:5px;align-items:center}.m3l-lg i{width:12px;height:12px;border-radius:4px;display:block}
.m3l-st{margin:12px 0 0;padding:11px 12px;border-radius:12px;font-size:13px;line-height:1.4;display:flex;gap:9px;align-items:flex-start;background:#eef7f0;color:#1e6b3a}.m3l-st.w{background:#fff6e5;color:#8a5a00}.m3l-st.n{background:#f5f4f2;color:#5b5e63}
.m3l-f{display:flex;gap:8px;padding:12px 14px 14px;border-top:1px solid #efeeeb;flex-wrap:wrap}
.m3l-f button{all:unset;cursor:pointer;box-sizing:border-box;padding:11px 16px;border-radius:12px;font-size:14px;font-weight:700;background:#f5f4f2;color:#16181b;text-align:center}
.m3l-f .p{flex:1;background:#f47b20;color:#fff}.m3l-f .p:hover{background:#e46d14}.m3l-f button[disabled]{opacity:.45;cursor:not-allowed}
.m3l-s.na .m3l-g button{animation:none}
.m3l-no{flex-basis:100%;font-size:12.5px;color:#8a8d93}
.m3l-e{padding:30px 20px;text-align:center;color:#6b6e73;font-size:14px}
@media (max-width:760px){.m3l{padding:0;place-items:end stretch}.m3l-c{max-height:94vh;border-radius:22px 22px 0 0}.m3l-b{grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(200px,36vh) minmax(0,1fr);overflow:auto}.m3l-s{border-left:none;border-top:1px solid #efeeeb}.m3l-f{padding-bottom:calc(14px + env(safe-area-inset-bottom))}}
`;
  let LP = null;
  function pickLoc(ctx, artId, opt) {
    opt = opt || {};
    if (!open) { C = ctx; T = window.THREE || T; D = data(); L = getLayout(); P = place(); }
    const x = D.arts.find(a => a.id === artId); if (!x) { (opt.toast || alert)('Articolo non trovato'); return; }
    if (!document.getElementById('m3l-css')) { const s = document.createElement('style'); s.id = 'm3l-css'; s.textContent = LCSS; document.head.appendChild(s); }
    if (LP) LP.el.remove();
    const cur = P.byArt.get(x.id), racks = P.racks;
    const rk0 = cur ? cur.rk : racks.find(r => r.cat && r.cat === x.cat) || racks[0];
    const el = document.createElement('div'); el.className = 'm3l'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Scegli l\'ubicazione');
    LP = { el, x, opt, rk: rk0 || null, b: cur ? cur.b : null, l: cur ? cur.l : null, vb: lpFit() };
    if (LP.rk && LP.b == null) { const f = firstFree(LP.rk); if (f) { LP.b = f[0]; LP.l = f[1]; } }
    document.body.appendChild(el); lpRender(true);
    el.addEventListener('click', lpClick); el.addEventListener('keydown', e => { if (e.key === 'Escape') lpClose(); });
    const onKey = e => { if (e.key === 'Escape' && LP) lpClose(); }; document.addEventListener('keydown', onKey); LP.off = () => document.removeEventListener('keydown', onKey);
  }
  function lpFit() { const R2 = P.racks; if (!R2.length) return null; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; R2.forEach(r => { const b = box2(r); x0 = Math.min(x0, b.x0); x1 = Math.max(x1, b.x1); z0 = Math.min(z0, b.z0); z1 = Math.max(z1, b.z1); }); const m = 4; return [x0 - m, z0 - m, x1 - x0 + m * 2, z1 - z0 + m * 2]; }
  const firstFree = rk => { for (let l = 0; l < rk.lv; l++) for (let b = 0; b < rk.bays; b++) if (!P.cells.has(P.ck(rk.id, b, l))) return [b, l]; return null; };
  const rkUse = rk => { let n = 0; for (let l = 0; l < rk.lv; l++) for (let b = 0; b < rk.bays; b++) if (P.cells.has(P.ck(rk.id, b, l))) n++; return n; };
  const svgI = p => `<svg viewBox="0 0 24 24">${p}</svg>`;
  const PIN = '<path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>';
  function lpMap() {
    const W = L.W, Dd = L.D, cur = P.byArt.get(LP.x.id), hx = c => '#' + c.toString(16).padStart(6, '0'), e = C.esc;
    let zt = '';
    let s = `<rect x="${-W / 2}" y="${-Dd / 2}" width="${W}" height="${Dd}" rx=".6" fill="#ffffff" stroke="#c9c6bf" stroke-width=".3"/>`;
    L.items.filter(i => i.t === 'zone').forEach(z => { const b = box2(z), Z2 = ZONE[z.k] || ZONE.free; s += `<rect x="${b.x0}" y="${b.z0}" width="${b.x1 - b.x0}" height="${b.z1 - b.z0}" rx=".4" fill="${hx(Z2[1])}" stroke="rgba(0,0,0,.06)" stroke-width=".15"/>`; zt += `<text x="${b.x0 + .8}" y="${b.z0 + 1.9}" font-size="1.35" font-weight="700" fill="rgba(60,62,66,.6)" pointer-events="none">${e(z.name || Z2[0])}</text>`; });
    L.items.filter(i => i.t === 'wall' || i.t === 'belt' || i.t === 'desk' || i.t === 'dock').forEach(i => { const b = box2(i), c = i.t === 'wall' ? '#8e959e' : i.t === 'dock' ? '#f2c418' : i.t === 'belt' ? '#b9bec5' : '#dcd8d0'; s += `<rect x="${b.x0}" y="${b.z0}" width="${b.x1 - b.x0}" height="${b.z1 - b.z0}" rx=".15" fill="${c}"/>`; });
    racks().forEach(rk => { const b = box2(rk), w = b.x1 - b.x0, h = b.z1 - b.z0, u = rkUse(rk) / Math.max(1, rk.bays * rk.lv), on = LP.rk === rk, vert = h > w, fs = Math.min(1.5, Math.max(.8, Math.min(w, h) * .9));
      s += `<g class="rk${on ? ' on' : ''}" data-lrk="${e(rk.id)}"><rect class="b" x="${b.x0}" y="${b.z0}" width="${w}" height="${h}" rx=".2" fill="${rk.k === 'shelf' ? '#e9edf3' : '#e3ecf7'}" stroke="${rk.k === 'shelf' ? '#9aa0a8' : '#2f6db4'}" stroke-width=".18"/>`;
      s += vert ? `<rect x="${b.x0 + .12}" y="${b.z1 - .12 - (h - .24) * u}" width="${Math.max(.1, w * .22)}" height="${(h - .24) * u}" fill="#f47b20" opacity=".75"/>` : `<rect x="${b.x0 + .12}" y="${b.z1 - .12 - Math.max(.1, h * .22)}" width="${(w - .24) * u}" height="${Math.max(.1, h * .22)}" fill="#f47b20" opacity=".75"/>`;
      s += `<text x="${(b.x0 + b.x1) / 2}" y="${(b.z0 + b.z1) / 2 + fs * .36}" font-size="${fs}" font-weight="800" text-anchor="middle" fill="#16181b">${e(rk.code)}</text>`;
      if (cur && cur.rk === rk) s += `<g transform="translate(${(b.x0 + b.x1) / 2 + Math.min(w, h) * .0 + (vert ? 0 : w / 2 - 1)},${(b.z0 + b.z1) / 2 - (vert ? h / 2 - 1 : 1.6)})"><circle r="1.05" fill="#f47b20" stroke="#fff" stroke-width=".3"/><circle r=".38" fill="#fff"/></g>`;
      s += '</g>'; });
    s += zt; const vb = LP.vb || [-W / 2 - 2, -Dd / 2 - 2, W + 4, Dd + 4];
    return `<svg viewBox="${vb.join(' ')}" preserveAspectRatio="xMidYMid meet">${s}</svg>`;
  }
  const racks = () => P.racks.slice().sort((a, b) => String(a.code).localeCompare(String(b.code), 'it', { numeric: true }));
  function lpSide() {
    const rk = LP.rk, x = LP.x, e = C.esc, cur = P.byArt.get(x.id), RS = racks();
    if (!rk) return `<div class="m3l-e">Nel magazzino non ci sono scaffali.<br>Disegnali con <b>Progetta</b> nella vista 3D.</div>`;
    let g = `<div class="m3l-g" style="--n:${rk.bays}"><span></span>${Array.from({ length: rk.bays }, (_, b) => `<span class="bh">${String(b + 1).padStart(2, '0')}</span>`).join('')}`;
    for (let l = rk.lv - 1; l >= 0; l--) { g += `<span class="lv">${l + 1}</span>`; for (let b = 0; b < rk.bays; b++) { const y = P.cells.get(P.ck(rk.id, b, l)), me = y && y.id === x.id, cc = y && D.catOf.get(y.cat); g += `<button type="button" data-lc="${b}|${l}" class="${me ? 'me' : y ? 'o' : ''}${y && y.low ? ' lo' : ''}${LP.b === b && LP.l === l ? ' k' : ''}" style="--d:${Math.min(40, (rk.lv - 1 - l) * rk.bays + b) * 8}ms${cc ? ';--c:' + cc.colH : ''}" title="${e(locCode(rk, b, l) + (y ? ' · ' + y.a.descrizione : ' · libero'))}" aria-label="${e(locCode(rk, b, l))}"></button>`; } }
    g += '</div>';
    let st = '';
    if (LP.b != null) { const y = P.cells.get(P.ck(rk.id, LP.b, LP.l)), code = locCode(rk, LP.b, LP.l);
      st = !y ? `<div class="m3l-st">${svgI(PIN).replace('<svg', '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"')}<span><b>${e(code)}</b> è libero: l'articolo va qui.</span></div>`
        : y.id === x.id ? `<div class="m3l-st n"><span><b>${e(code)}</b> è l'ubicazione attuale.</span></div>`
        : `<div class="m3l-st w"><span><b>${e(code)}</b> è occupato da <b>${e(y.a.descrizione)}</b>: ${cur ? `i due articoli si scambiano di posto (va in ${e(cur.code)}).` : 'quell\'articolo torna in automatico.'}</span></div>`; }
    return `<div class="m3l-rks">${RS.map(r => `<button type="button" data-lrk="${e(r.id)}" class="${r === rk ? 'on' : ''}${cur && cur.rk === r ? ' cur' : ''}">${e(r.code)}<em>${rkUse(r)}/${r.bays * r.lv}</em></button>`).join('')}</div>
      <div class="m3l-sc"><div class="m3l-rt"><b>Scaffale ${e(rk.code)}${rk.cat ? ' · ' + e(rk.cat) : ''}</b><span>${rk.bays} campate × ${rk.lv} livelli · ${KIND[rk.k].n.toLowerCase()}</span></div>${g}
      <div class="m3l-lg"><span><i style="background:#fff;border:1.5px dashed #d6d4cf"></i>Libero</span><span><i style="background:#9fc47e"></i>Occupato</span><span><i style="background:#f47b20"></i>Questo articolo</span><span><i style="box-shadow:inset 0 0 0 2px #d9452f;background:#fff"></i>Sotto scorta</span></div>${st}</div>`;
  }
  function lpRender(first) {
    const x = LP.x, cur = P.byArt.get(x.id), e = C.esc, ok = canEdit(), sel2 = LP.rk && LP.b != null ? P.cells.get(P.ck(LP.rk.id, LP.b, LP.l)) : null, same = sel2 && sel2.id === x.id;
    const em = `${cur ? `ora in <b>${e(cur.code)}</b>${cur.auto ? ' · scelta automatica' : ' · scelta a mano'}` : 'senza ubicazione'}${x.a.codice ? ' · cod. ' + e(x.a.codice) : ''}`;
    const foot = `${ok ? '' : '<span class="m3l-no">Solo il titolare può cambiare le ubicazioni.</span>'}${L.loc[x.id] && ok ? '<button type="button" data-lauto>Torna automatica</button>' : ''}<button type="button" data-lx>Annulla</button><button type="button" class="p" data-lsave${!ok || !LP.rk || LP.b == null || same ? ' disabled' : ''}>${LP.rk && LP.b != null ? (same ? 'Già in ' : 'Metti in ') + e(locCode(LP.rk, LP.b, LP.l)) : 'Scegli un vano'}</button>`;
    if (first) LP.el.innerHTML = `<div class="m3l-c"><div class="m3l-h"><i class="pi">${svgI(PIN)}</i><div><small>Ubicazione articolo</small><b>${e(x.a.descrizione)}</b><em>${em}</em></div><button type="button" class="m3l-x" data-lx aria-label="Chiudi">${svgI('<path d="M6 6l12 12M18 6 6 18"/>')}</button></div>
      <div class="m3l-b"><div class="m3l-map">${lpMap()}<span class="m3l-hint">Tocca uno scaffale · trascina per spostarti</span><div class="m3l-zm"><button type="button" data-lz="1" aria-label="Avvicina">+</button><button type="button" data-lz="-1" aria-label="Allontana">−</button><button type="button" data-lz="0" aria-label="Vedi tutto" style="font-size:13px">⤢</button></div></div><div class="m3l-s">${lpSide()}</div></div>
      <div class="m3l-f">${foot}</div></div>`;
    else {
      const S2 = LP.el.querySelector('.m3l-s'), sc = S2.querySelector('.m3l-sc'), top = sc ? sc.scrollTop : 0, left = sc ? sc.scrollLeft : 0, rk0 = LP.lastRk;
      LP.el.querySelector('.m3l-h em').innerHTML = em; LP.el.querySelector('.m3l-map svg').outerHTML = lpMap(); S2.innerHTML = lpSide(); LP.el.querySelector('.m3l-f').innerHTML = foot;
      S2.classList.toggle('na', rk0 === LP.rk); const sc2 = S2.querySelector('.m3l-sc'); if (sc2 && rk0 === LP.rk) { sc2.scrollTop = top; sc2.scrollLeft = left; }
    }
    LP.lastRk = LP.rk; lpDrag();
    const k = LP.el.querySelector('.m3l-g .k'); if (k && first) setTimeout(() => k.scrollIntoView({ block: 'nearest', inline: 'center' }), 60);
  }
  // spostare e ingrandire la mappa
  function lpDrag() {
    const sv = LP.el.querySelector('.m3l-map svg'); if (!sv) return;
    const vb = () => LP.vb || [-L.W / 2 - 2, -L.D / 2 - 2, L.W + 4, L.D + 4];
    const setVb = v => { LP.vb = v; sv.setAttribute('viewBox', v.join(' ')); };
    const pts = new Map(); let st = null, moved = 0;
    sv.onpointerdown = ev => { pts.set(ev.pointerId, [ev.clientX, ev.clientY]); st = { v: vb().slice(), p: [...pts.values()].map(p => p.slice()) }; moved = 0; };
    sv.onpointermove = ev => { if (!pts.has(ev.pointerId) || !st) return; pts.set(ev.pointerId, [ev.clientX, ev.clientY]); const r = sv.getBoundingClientRect(), k = Math.max(st.v[2] / r.width, st.v[3] / r.height), P1 = [...pts.values()];
      if (P1.length === 1 && st.p.length === 1) { const dx = P1[0][0] - st.p[0][0], dy = P1[0][1] - st.p[0][1]; if (Math.abs(dx) + Math.abs(dy) > 4) { moved = 1; sv.classList.add('dr'); try { sv.setPointerCapture(ev.pointerId); } catch {} } if (moved) setVb([st.v[0] - dx * k, st.v[1] - dy * k, st.v[2], st.v[3]]); }
      else if (P1.length >= 2 && st.p.length >= 2) { moved = 1; const d0 = Math.hypot(st.p[0][0] - st.p[1][0], st.p[0][1] - st.p[1][1]), d1 = Math.hypot(P1[0][0] - P1[1][0], P1[0][1] - P1[1][1]); lpZoomV(st.v, d0 / Math.max(1, d1), setVb); } };
    sv.onpointerup = sv.onpointercancel = ev => { pts.delete(ev.pointerId); sv.classList.remove('dr'); st = pts.size ? { v: vb().slice(), p: [...pts.values()].map(p => p.slice()) } : null; if (moved) { LP.noClick = Date.now(); } };
    sv.onwheel = ev => { ev.preventDefault(); const r = sv.getBoundingClientRect(), v = vb(), k = Math.max(v[2] / r.width, v[3] / r.height), f = Math.exp(ev.deltaY * .0015), cx = v[0] + (ev.clientX - r.left) * k - (r.width * k - v[2]) / 2, cy = v[1] + (ev.clientY - r.top) * k - (r.height * k - v[3]) / 2, w = clamp(v[2] * f, 8, L.W + 40), h = v[3] * w / v[2]; setVb([cx - (cx - v[0]) * w / v[2], cy - (cy - v[1]) * h / v[3], w, h]); };
  }
  function lpZoomV(v, f, setVb) { const w = clamp(v[2] * f, 8, L.W + 40), h = v[3] * w / v[2], cx = v[0] + v[2] / 2, cy = v[1] + v[3] / 2; setVb([cx - w / 2, cy - h / 2, w, h]); }
  function lpClick(ev) {
    const t = ev.target; if (!LP) return;
    if (t === LP.el || t.closest('[data-lx]')) return lpClose();
    const z = t.closest('[data-lz]'); if (z) { const sv = LP.el.querySelector('.m3l-map svg'), set = v => { LP.vb = v; sv.setAttribute('viewBox', v.join(' ')); }; const f = +z.dataset.lz; if (!f) set(LP.vb && LP.vb.join() === String(lpFit()) ? [-L.W / 2 - 2, -L.D / 2 - 2, L.W + 4, L.D + 4] : (lpFit() || [-L.W / 2 - 2, -L.D / 2 - 2, L.W + 4, L.D + 4])); else lpZoomV(LP.vb || [-L.W / 2 - 2, -L.D / 2 - 2, L.W + 4, L.D + 4], f > 0 ? .7 : 1.4, set); return; }
    const r = t.closest('[data-lrk]'); if (r) { if (LP.noClick && Date.now() - LP.noClick < 250) return; const rk = P.racks.find(q => q.id === r.dataset.lrk); if (rk && rk !== LP.rk) { LP.rk = rk; const cur = P.byArt.get(LP.x.id); if (cur && cur.rk === rk) { LP.b = cur.b; LP.l = cur.l; } else { const f = firstFree(rk); LP.b = f ? f[0] : null; LP.l = f ? f[1] : null; } lpRender(); const k = LP.el.querySelector('.m3l-g .k'); if (k) k.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); } return; }
    const c = t.closest('[data-lc]'); if (c) { const [b, l] = c.dataset.lc.split('|').map(Number); LP.b = b; LP.l = l; lpRender(); return; }
    if (t.closest('[data-lsave]') && !t.closest('[disabled]')) return lpSave(false);
    if (t.closest('[data-lauto]')) return lpSave(true);
  }
  function lpSave(auto) {
    if (!canEdit()) return; const x = LP.x, L2 = clone(L), cur = P.byArt.get(x.id), rk = LP.rk;
    if (auto) delete L2.loc[x.id];
    else { if (!rk || LP.b == null) return; const occ = P.cells.get(P.ck(rk.id, LP.b, LP.l)); if (occ && occ.id !== x.id) { if (cur) L2.loc[occ.id] = { r: cur.rk.id, b: cur.b, l: cur.l }; else delete L2.loc[occ.id]; } L2.loc[x.id] = { r: rk.id, b: LP.b, l: LP.l }; }
    C.write([{ action: 'upsert', sheet: 'Config', row: { chiave: lkey(), valore: JSON.stringify(L2) } }]);
    L = L2; P = place(); const nw = P.byArt.get(x.id), code = nw ? nw.code : '';
    (LP.opt.toast || toast)(auto ? 'Ubicazione automatica' + (code ? ': ' + code : '') : 'Ubicazione salvata: ' + code);
    if (LP.opt.onSave) try { LP.opt.onSave(code, !auto); } catch {}
    if (open) { try { rebuild(); focusArt(x.id); } catch {} }
    LP.el.querySelector('.m3l-c').style.cssText = 'transition:transform .25s,opacity .25s;transform:scale(.97);opacity:0'; setTimeout(lpClose, 220);
  }
  function lpClose() { if (!LP) return; if (LP.off) LP.off(); LP.el.remove(); LP = null; }
  function locOf(ctx, artId) { try { if (!open) { C = ctx; T = window.THREE || T; D = data(); L = getLayout(); P = place(); } const p = P.byArt.get(artId); return p ? { code: p.code, auto: !!p.auto } : null; } catch { return null; } }

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
  const VEL = { x: 0, z: 0, a: 0, on: 0 }; let lastIn = 0, tapT = 0, tapP = null;
  const now2 = () => performance.now();
  const clampT = () => { GOAL.tx = clamp(GOAL.tx, -170, 190); GOAL.tz = clamp(GOAL.tz, -150, 150); CAM.tx = clamp(CAM.tx, -175, 195); CAM.tz = clamp(CAM.tz, -155, 155); };
  const camBusy = () => !!(FA || drag || pinch || VEL.on || now2() - lastIn < 450 || Math.abs(GOAL.dist - CAM.dist) > CAM.dist * .002 || Math.abs(GOAL.tx - CAM.tx) > .03 || Math.abs(GOAL.tz - CAM.tz) > .03 || Math.abs(angD(GOAL.az, CAM.az)) > .003 || Math.abs(GOAL.pol - CAM.pol) > .003);
  // punto del pavimento sotto il cursore, solo se ragionevolmente vicino (sopra l'orizzonte non si aggancia)
  function grabAt(x, y) { const p = groundAt(x, y); return p && Math.hypot(p.x - CAM.tx, p.z - CAM.tz) < CAM.dist * 3.5 ? p : null; }
  // zoom verso un punto: il punto sotto il cursore resta fermo mentre ci si avvicina
  function zoomAt(cx, cy, f) {
    const nd = clamp(GOAL.dist * f, 8, 420), rf = nd / GOAL.dist; if (Math.abs(rf - 1) < 1e-4) return;
    const p = cx != null ? grabAt(cx, cy) : null;
    if (p) { GOAL.tx = p.x + (GOAL.tx - p.x) * rf; GOAL.tz = p.z + (GOAL.tz - p.z) * rf; }
    GOAL.dist = nd; clampT(); lastIn = now2();
  }
  const track = d => { const t = now2(); d.hist.push({ t, x: CAM.tx, z: CAM.tz, a: CAM.az }); while (d.hist.length > 2 && t - d.hist[0].t > 110) d.hist.shift(); };
  function onDown(e) {
    try { R.domElement.setPointerCapture(e.pointerId); } catch {} pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    VEL.on = 0; lastIn = now2();
    if (pts.size === 2) { const [a, b] = [...pts.values()], c = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; flyStop(); drag = null; Object.assign(GOAL, CAM);
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), a: Math.atan2(b.y - a.y, b.x - a.x), c, d0: Math.hypot(a.x - b.x, a.y - b.y), a0: Math.atan2(b.y - a.y, b.x - a.x), c0: { ...c }, g: grabAt(c.x, c.y), mode: null, hist: [] }; return; }
    if (pts.size > 2) return;
    if (EDIT && e.button === 0 && !e.shiftKey) {
      const id = edPickAt(e.clientX, e.clientY);
      if (id) { const it = L.items.find(i => i.id === id), gp = groundAt(e.clientX, e.clientY); if (it && gp) { if (EDIT.sel !== id) { EDIT.sel = id; edPanel(); } drag = { x: e.clientX, y: e.clientY, moved: 0, item: it, off: { x: gp.x - it.x, z: gp.z - it.z }, orig: JSON.stringify(L), g: WH.children.find(c => c.userData.eid === id) }; return; } }
    }
    drag = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, rot: e.button === 2 || e.shiftKey ? 1 : 0, moved: 0, g: null, hist: [] };
  }
  function onMove(e) {
    if (pts.has(e.pointerId)) pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pts.size === 2) {
      const [a, b] = [...pts.values()], nd = Math.hypot(a.x - b.x, a.y - b.y), na = Math.atan2(b.y - a.y, b.x - a.x), nc = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      if (!pinch.mode) { const sd = Math.abs(nd - pinch.d0), sa = Math.abs(angD(na, pinch.a0)), sy = nc.y - pinch.c0.y, flat = Math.abs(Math.sin(na)) < .55;
        if (flat && Math.abs(sy) > 16 && sd < 22 && sa < .14) pinch.mode = 'tilt'; else if (sd > 10 || sa > .08 || Math.hypot(nc.x - pinch.c0.x, nc.y - pinch.c0.y) > 10) pinch.mode = 'zr'; }
      if (pinch.mode === 'tilt') { CAM.pol = clamp(CAM.pol - (nc.y - pinch.c.y) * .005, .12, 1.32); }
      else if (pinch.mode === 'zr') {
        CAM.dist = clamp(CAM.dist * pinch.d / Math.max(20, nd), 8, 420); CAM.az += angD(na, pinch.a);
        applyCam(); const p = groundAt(nc.x, nc.y); if (p && pinch.g) { CAM.tx += pinch.g.x - p.x; CAM.tz += pinch.g.z - p.z; } else if (!pinch.g) pinch.g = grabAt(nc.x, nc.y);
      }
      clampT(); Object.assign(GOAL, CAM); applyCam(); track(pinch); pinch.d = nd; pinch.a = na; pinch.c = nc; stopTour(); lastIn = now2(); return;
    }
    if (!drag) { needPick = { x: e.clientX, y: e.clientY, hover: 1 }; return; }
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
    if (drag.moved > 4) { R.domElement.classList.add('drag'); stopTour(); if (!drag.item) flyStop(); }
    if (drag.item) {
      if (drag.moved < 5) return; const gp = groundAt(e.clientX, e.clientY); if (!gp) return; const it = drag.item;
      if (it.t === 'dock') dockSnap(it, gp.x - drag.off.x, gp.z - drag.off.z); else { it.x = snap(gp.x - drag.off.x); it.z = snap(gp.z - drag.off.z); inside(it); }
      if (drag.g) { drag.g.position.set(it.x, 0, it.z); if (it.t !== 'zone') drag.g.rotation.y = it.r * Math.PI / 2; }
      updSelHelper(); return;
    }
    lastIn = now2();
    if (drag.rot) { CAM.az -= dx * .0052; CAM.pol = clamp(CAM.pol - dy * .0038, .12, 1.32); GOAL.az = CAM.az; GOAL.pol = CAM.pol; applyCam(); track(drag); return; }
    if (drag.moved < 3) return;
    if (!drag.g) { Object.assign(GOAL, { tx: CAM.tx, tz: CAM.tz }); drag.g = grabAt(drag.x0, drag.y0) || 'x'; }
    const p = drag.g !== 'x' ? groundAt(e.clientX, e.clientY) : null;
    if (p && Math.hypot(p.x - drag.g.x, p.z - drag.g.z) < CAM.dist * 2) { CAM.tx += drag.g.x - p.x; CAM.tz += drag.g.z - p.z; }
    else { const k = CAM.dist * .0016 * (900 / Math.max(500, R.domElement.clientHeight)), s2 = Math.sin(CAM.az), c2 = Math.cos(CAM.az), mx = -dx * k, mz = -dy * k / Math.max(.35, Math.cos(CAM.pol - .2)); CAM.tx += mx * c2 + mz * s2; CAM.tz += -mx * s2 + mz * c2; }
    clampT(); GOAL.tx = CAM.tx; GOAL.tz = CAM.tz; applyCam(); track(drag);
  }
  // al rilascio la vista continua a scorrere e rallenta (come una mappa)
  function fling(d) {
    if (!d || d.hist.length < 2) return; const h0 = d.hist[0], h1 = d.hist[d.hist.length - 1], t = (h1.t - h0.t) / 1000; if (t < .025 || now2() - h1.t > 90) return;
    const vx = (h1.x - h0.x) / t, vz = (h1.z - h0.z) / t, va = angD(h1.a, h0.a) / t, sp = Math.hypot(vx, vz), mx = CAM.dist * 2.2;
    if (sp > CAM.dist * .06 || Math.abs(va) > .15) { const f = sp > mx ? mx / sp : 1; Object.assign(VEL, { x: vx * f, z: vz * f, a: clamp(va, -2.4, 2.4), on: 1 }); }
  }
  function onUp(e) {
    pts.delete(e.pointerId);
    if (pinch && pts.size < 2) { fling(pinch); pinch = null; if (pts.size === 1) { const [q] = [...pts.values()]; drag = { x: q.x, y: q.y, x0: q.x, y0: q.y, rot: 0, moved: 10, g: grabAt(q.x, q.y) || 'x', hist: [] }; } return; }
    if (drag && drag.item) { if (drag.moved >= 5) { EDIT.undo.push(drag.orig); EDIT.dirty = true; rebuild(); } edPanel(); }
    else if (drag && drag.moved < 6) { if (EDIT) { EDIT.sel = null; edPanel(); } else needPick = { x: e.clientX, y: e.clientY }; }
    else if (drag) fling(drag);
    drag = null; R.domElement.classList.remove('drag'); lastIn = now2();
  }
  function onWheel(e) {
    e.preventDefault(); flyStop(); VEL.on = 0; stopTour();
    let dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1); if (e.ctrlKey) dy *= 2.4; // ctrl = pizzico sul trackpad
    zoomAt(e.clientX, e.clientY, Math.exp(clamp(dy, -260, 260) * .0016));
  }
  function onDbl(e) { if (EDIT) return; e.preventDefault(); flyStop(); VEL.on = 0; zoomAt(e.clientX, e.clientY, e.shiftKey ? 1.8 : .5); }
  const ray = new (function () { this.r = null; })();
  function doPick(p) {
    if (!ray.r) ray.r = new T.Raycaster();
    const rc = R.domElement.getBoundingClientRect(), v = new T.Vector2((p.x - rc.left) / rc.width * 2 - 1, -(p.y - rc.top) / rc.height * 2 + 1);
    ray.r.setFromCamera(v, cam); const H = ray.r.intersectObjects(pick, false), PR = { art: 0, ofr: 1, ricl: 1, truck: 1, veh: 1, rack: 2, dock: 3, belt: 3, desk: 3, fuel: 3, wall: 4, zone: 5 };
    const hit2 = H.slice(0, 12).filter(h2 => h2.object.userData.k && !(h2.object.userData.k.t === 'ofr' && (!OFF || OFF.u < .5))).sort((a, b) => (PR[a.object.userData.k.t] - PR[b.object.userData.k.t]) || a.distance - b.distance)[0];
    const rk2 = hit2 && hit2.object.userData.k && hit2.object.userData.k.t === 'ricl' ? (hit2.object.userData.k.key || (hit2.object.userData.ids && hit2.object.userData.ids[hit2.instanceId]) || null) : null;
    if (p.hover) { R.domElement.classList.toggle('hov', !!hit2 || !!EDIT); const kk = hit2 && hit2.object.userData.k; if (matchMedia('(hover:hover)').matches) hoverRic(rk2, p.x, p.y); if (!(kk && kk.t === 'ricl')) hoverArt(kk && kk.t === 'art' && matchMedia('(hover:hover)').matches ? hit2.object.userData.ids && hit2.object.userData.ids[hit2.instanceId] : null, p.x, p.y); return; }
    if (EDIT || !hit2) return;
    const k = hit2.object.userData.k;
    if (k.t === 'ricl') return select({ t: 'ricl', key: rk2, id: k.id });
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
    if (a === 'zin') { flyStop(); VEL.on = 0; zoomAt(null, null, .62); stopTour(); return; }
    if (a === 'zout') { flyStop(); VEL.on = 0; zoomAt(null, null, 1 / .62); stopTour(); return; }
    if (a === 'rl') { flyStop(); VEL.on = 0; GOAL.az -= Math.PI / 4; lastIn = now2(); stopTour(); return; }
    if (a === 'rr') { flyStop(); VEL.on = 0; GOAL.az += Math.PI / 4; lastIn = now2(); stopTour(); return; }
    if (a === 'home') { if (EDIT) return fly({ tx: 0, tz: 0, dist: Math.max(L.W, L.D) * 2.15, az: -0.15, pol: .42 }); select({ t: 'zone', z: 'all' }); return; }
    if (a === 'play') { if (tourOn) stopTour(); else startTour(); return; }
    if (a === 'pclose') { if (EDIT) { EDIT.sel = null; edPanel(); } else if (t.closest('.m3-co')) { unfocus(); if (sel && sel.art) sel = { t: 'rack', id: sel.id }; } else select(null); return; }
    if (a && a.startsWith('go:')) { const h2 = a.slice(3); close(); setTimeout(() => { if (C.go) C.go(h2); else location.hash = '#' + h2; }, 350); return; }
    if (a === 'gocli' || a === 'gofor') { const f = a === 'gocli' ? C.goCli : C.goForn; close(); setTimeout(() => { if (f) f(); else location.hash = a === 'gocli' ? '#clienti' : '#fornitori'; }, 350); return; }
    if (a === 'gasan') { select({ t: 'fuel' }); return; }
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
    const zs = t.closest('[data-zsel]'); if (zs) { $('.m3-res').classList.remove('on'); $$('.m3-menu.on').forEach(m => m.classList.remove('on')); select({ t: 'zone', z: zs.dataset.zsel }); return; }
    const fg = t.closest('[data-fgo]'); if (fg) { const [z, tb] = fg.dataset.fgo.split(':'); if (tb) OFT = tb; select({ t: 'zone', z }); return; }
    const sh = t.closest('[data-shot]'); if (sh) { stopTour(); const k = sh.dataset.shot, z = zoneTarget('stk'); ({ all: () => select({ t: 'zone', z: 'all' }), top: () => fly({ tx: 0, tz: 0, dist: Math.max(L.W, L.D) * 2.2, az: 0, pol: .12 }), stk: () => { const r = P.racks.find(x => x.k === 'pallet') || P.racks[0]; if (r) { const g = rackG(r.id); g.updateMatrixWorld(); const p2 = g.localToWorld(new T.Vector3(-rackLen(r) / 2 - 3, 0, rackDep(r) / 2 + 1.7)); fly({ tx: p2.x + 6, ty: 2.5, tz: p2.z, dist: 12, az: r.r * Math.PI / 2 - 1.3, pol: 1.3 }); } }, spe: () => flyT(zoneTarget('spe')), pre: () => flyT(zoneTarget('pre')), low: () => fly({ tx: 0, tz: 4, dist: Math.max(L.W, L.D) * 1.6, az: -0.75, pol: 1.22 }) })[k](); return; }
    const ofr = t.closest('[data-ofr]'); if (ofr) { $('.m3-res').classList.remove('on'); const [kd, ...r2] = ofr.dataset.ofr.split(':'); select({ t: 'ofr', kd, id: r2.join(':') }); return; }
    const pkb = t.closest('[data-pick]'); if (pkb) { $('.m3-res').classList.remove('on'); select({ t: 'pick', id: pkb.dataset.pick }); return; }
    const glb = t.closest('[data-gls]'); if (glb) { $('.m3-res').classList.remove('on'); select({ t: 'gls', m: glb.dataset.gls || GLSM, q: glb.dataset.glsq || '' }, !!(sel && sel.t === 'gls') && !glb.dataset.glsq); return; }
    const acb = t.closest('[data-acc]'); if (acb) { $('.m3-res').classList.remove('on'); const [id, ty] = acb.dataset.acc.split(':'); select({ t: 'acc', id, ty: ty || '' }, !!(sel && sel.t === 'acc' && sel.id === id)); return; }
    const oft = t.closest('[data-oft]'); if (oft) { OFT = oft.dataset.oft; panel(sel); return; }
    const rv = t.closest('[data-rcv3]'); if (rv) { $('.m3-res').classList.remove('on'); const z = L.items.find(i => i.t === 'zone' && i.k === 'ric'); select({ t: 'ricl', key: rv.dataset.rcv3, id: z && z.id }); return; }
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
    if (!EDIT && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const st2 = CAM.dist * .12, sa = Math.sin(CAM.az), ca = Math.cos(CAM.az), mv = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
      if (mv) { e.preventDefault(); flyStop(); VEL.on = 0; GOAL.tx += (mv[0] * ca + mv[1] * sa) * st2; GOAL.tz += (-mv[0] * sa + mv[1] * ca) * st2; clampT(); lastIn = now2(); return; }
      if (e.key === '+' || e.key === '=') { e.preventDefault(); flyStop(); zoomAt(null, null, .7); return; }
      if (e.key === '-' || e.key === '_') { e.preventDefault(); flyStop(); zoomAt(null, null, 1 / .7); return; }
      if (e.key === 'q' || e.key === 'Q' || e.key === 'e' || e.key === 'E') { flyStop(); GOAL.az += (/q/i.test(e.key) ? -1 : 1) * Math.PI / 8; lastIn = now2(); return; }
    }
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
    if (Q.fps && lastT && now / 1000 - lastT < 1 / Q.fps - .004 && !camBusy()) return;
    const t = now / 1000, dt = Math.min(.05, lastT ? t - lastT : .016); lastT = t;
    stepCam(dt); animate(t, dt); shadowFollow();
    const w = R.domElement.clientWidth, h = R.domElement.clientHeight, ph = w <= 760, want = !ph && root.classList.contains('pn') ? (EDIT ? 60 : 180) : 0;
    if (ph && (!loop.f || ++loop.f > 5)) { loop.f = 1; const rt = root.getBoundingClientRect(), tb = $('.m3-top'), pn = root.classList.contains('pn') ? $('.m3-panel') : null, fl = $('.m3-flow'), co = $('.m3-co.on');
      const yT = tb ? tb.getBoundingClientRect().bottom - rt.top : 0, yB = co ? co.getBoundingClientRect().top - rt.top : pn ? pn.getBoundingClientRect().top - rt.top : h;
      loop.wy = clamp(h / 2 - (yT + Math.max(yT + 60, yB)) / 2, -h * .35, h * .35); } else if (!ph) loop.wy = 0;
    viewOff += (want - viewOff) * (1 - Math.exp(-dt * 4)); viewOffY += ((loop.wy || 0) - viewOffY) * (1 - Math.exp(-dt * 5));
    if (Math.abs(viewOff) > .5 || Math.abs(viewOffY) > .5) cam.setViewOffset(w, h, viewOff, viewOffY, w, h); else if (cam.view && cam.view.enabled) cam.clearViewOffset();
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
    R = scene = ENV = WH = null; OFF = null; CANO = null; pick = []; labels = []; movers = []; trucks = []; hiMesh = selHelper = null;
  }
  // qualità per dispositivo: telefono / tablet / computer (scende da sola se il 3D si ferma per memoria)
  let Q = null, SUN = null, lostN = 0, lostT0 = 0, GLT = 0;
  function tierQ(t) { const dpr = window.devicePixelRatio || 1;
    return [{ tier: 0, dpr: Math.min(1.5, dpr), sh: 1024, fps: 30 }, { tier: 1, dpr: Math.min(1.5, dpr), sh: 2048, fps: 40 }, { tier: 2, dpr: Math.min(2, dpr), sh: 4096, fps: 0 }][t]; }
  function pickQ() { const coarse = matchMedia('(pointer:coarse)').matches, sw = Math.min(screen.width, screen.height), mem = navigator.deviceMemory || 8;
    return tierQ(coarse && sw < 600 ? 0 : coarse || mem <= 4 || sw < 600 ? 1 : 2); }
  // l'ombra segue l'inquadratura: dettaglio alto da vicino anche con mappe piccole, senza tremolii (agganciata ai punti della mappa)
  function shadowFollow() { if (!SUN || !SUN.castShadow) return; const sc = SUN.shadow.camera, sq = Math.round(clamp(CAM.dist * .8, 30, 125) / 5) * 5;
    if (sc.right !== sq) { sc.left = -sq; sc.right = sq; sc.top = sq; sc.bottom = -sq; sc.updateProjectionMatrix(); }
    const tex = 2 * sq / SUN.shadow.mapSize.x, tx = Math.round(CAM.tx / tex) * tex, tz = Math.round(CAM.tz / tex) * tex;
    if (SUN.target.position.x !== tx || SUN.target.position.z !== tz) { SUN.target.position.set(tx, 0, tz); SUN.position.set(tx - 70, 130, tz + 60); SUN.target.updateMatrixWorld(); } }
  function setupScene() {
    scene = new T.Scene(); scene.background = new T.Color(0xa6d673); scene.fog = new T.Fog(0xa6d673, 300, 640);
    cam = new T.PerspectiveCamera(28, 1, .5, 1600);
    scene.add(new T.HemisphereLight(0xffffff, 0x9bc46f, 1.5));
    const sun = new T.DirectionalLight(0xfff6ea, 2.2); sun.position.set(-70, 130, 60); sun.castShadow = true;
    const sc = sun.shadow.camera; sc.left = -120; sc.right = 120; sc.top = 100; sc.bottom = -100; sc.near = 10; sc.far = 380;
    sun.shadow.mapSize.set(Q.sh || 1024, Q.sh || 1024); sun.shadow.bias = -0.0004; sun.shadow.normalBias = .35; sun.castShadow = !!Q.sh; scene.add(sun); scene.add(sun.target); SUN = sun;
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
    if (!Q) Q = pickQ(); root.classList.toggle('tch', matchMedia('(pointer:coarse)').matches);
    try { R = new T.WebGLRenderer({ canvas: $('.m3-c'), antialias: true, powerPreference: Q.tier < 2 ? 'default' : 'high-performance', logarithmicDepthBuffer: true }); }
    catch { root.innerHTML = '<div class="m3-load"><b>Il 3D non è supportato su questo dispositivo</b></div>'; setTimeout(close, 2500); return; }
    R.setPixelRatio(Q.dpr); R.shadowMap.enabled = !!Q.sh; R.shadowMap.type = Q.tier < 2 ? T.PCFShadowMap : T.PCFSoftShadowMap;
    // se il dispositivo toglie la memoria al 3D lo riavviamo (con qualità più bassa se succede di nuovo)
    R.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); glLost(); }, false);
    R.domElement.addEventListener('webglcontextrestored', () => glReopen(), false);
    setupScene();
    build(); resize();
    const zt = zoneTarget('all'); Object.assign(CAM, { ty: 0, tx: zt.x, tz: zt.z, dist: zt.dist * 1.6, az: -0.1, pol: .7 }); Object.assign(GOAL, { tx: zt.x, tz: zt.z, dist: zt.dist, az: zt.az, pol: zt.pol }); applyCam();
    const cv = R.domElement;
    cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove); cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);
    cv.addEventListener('wheel', onWheel, { passive: false }); cv.addEventListener('dblclick', onDbl); cv.addEventListener('contextmenu', e => e.preventDefault()); cv.addEventListener('pointerleave', () => { cv.classList.remove('hov'); hoverArt(null); hoverRic(null); });
    root.addEventListener('click', onClick); root.addEventListener('change', onChange);
    const pnl = $('.m3-panel'); let sd = null;
    pnl.addEventListener('pointerdown', e => { if (root.clientWidth > 760 || e.target.closest('button,input,select,a')) return; const r = pnl.getBoundingClientRect(); if (e.clientY - r.top > 70) return; sd = { y: e.clientY, id: e.pointerId, t: Date.now() }; pnl.setPointerCapture(e.pointerId); pnl.style.transition = 'none'; });
    pnl.addEventListener('pointermove', e => { if (!sd || e.pointerId !== sd.id) return; const dy = e.clientY - sd.y; pnl.style.transform = `translateY(${Math.max(-40, dy)}px)`; });
    const sEnd = e => { if (!sd || e.pointerId !== sd.id) return; const dy = e.clientY - sd.y, tap = Math.abs(dy) < 6 && Date.now() - sd.t < 300; sd = null; pnl.style.transition = ''; pnl.style.transform = '';
      if (tap || dy < -40) pnl.classList.toggle('big', tap ? !pnl.classList.contains('big') : true); else if (dy > 70) { if (pnl.classList.contains('big')) pnl.classList.remove('big'); else { const b = $('[data-m3="pclose"]', pnl); if (b) b.click(); } } };
    pnl.addEventListener('pointerup', sEnd); pnl.addEventListener('pointercancel', sEnd);
    const inp = $('.m3-search input'); inp.addEventListener('input', () => search(inp.value)); inp.addEventListener('focus', () => { if (inp.value) search(inp.value); });
    const ms = $('.m3-sel'); if (ms) ms.addEventListener('change', () => { C.setMag(ms.value); });
    window.addEventListener('resize', resize); document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => { root.classList.add('on'); const l = $('.m3-load'); if (l) { l.style.opacity = 0; setTimeout(() => l.remove(), 500); } });
    lastT = 0; raf = requestAnimationFrame(loop);
    setTimeout(() => { if (open && !sel && root.clientWidth > 760) select({ t: 'zone', z: 'all' }, 1); else if (open) zoneChip('all'); }, 900);
  }
  function glLost() {
    if (!open) return; cancelAnimationFrame(raf); const now = Date.now(); lostN = now - lostT0 < 90000 ? lostN + 1 : 1; lostT0 = now;
    if (lostN > 1) Q = Q.tier > 0 ? tierQ(Q.tier - 1) : { ...Q, sh: 0, dpr: 1, fps: 30 };
    let ov = $('.m3-lost'); if (!ov) { ov = document.createElement('div'); ov.className = 'm3-lost'; root.appendChild(ov); } ov.innerHTML = '<i class="m3-spin"></i><b>Riavvio il 3D…</b><small>Il dispositivo ha liberato la memoria grafica</small>';
    clearTimeout(GLT); GLT = setTimeout(glReopen, 1200);
  }
  function glReopen() {
    clearTimeout(GLT); if (!open) return; const c = C, ks = sel, g0 = { ...GOAL };
    open = false; stopTour(); EDIT = null; FA = null; window.removeEventListener('resize', resize); document.removeEventListener('keydown', onKey); cancelAnimationFrame(raf);
    try { dispose(); } catch (e) { } root.remove(); sel = null;
    openView(c); Object.assign(GOAL, g0); Object.assign(CAM, g0); if (ks) setTimeout(() => { if (open) select(ks, 1); }, 950);
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
  window.CDC_MG3D = { open: openView, refresh, close, isOpen: () => open, pickLoc, locOf };
})();
