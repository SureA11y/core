const { four, page, close } = require('./h.js');
const ce=['contrast-enhanced'], cc=['contrast-computable','contrast-minimum'];
const cases = [
 ['enhanced: sign at 4.54 beside digits', '<p>45<span style="color:#767676">€</span></p>', ce],
 ['enhanced: aria-disabled plain span', '<p><span aria-disabled="true" style="color:#767676">Note</span></p>', ce],
 ['inset shadow card', '<div style="background:#fff;box-shadow:inset 0 0 0 100vmax rgba(0,0,0,.6)"><p style="color:#555">Card text</p></div>', cc],
 ['mix-blend-mode on text', '<div style="background:#fff"><p style="color:#777;mix-blend-mode:multiply">Blend</p></div>', cc],
 ['filter invert on wrapper', '<div style="filter:invert(1);background:#fff"><p style="color:#eee">Filtered</p></div>', cc],
 ['mask fade', '<p style="color:#000;-webkit-mask-image:linear-gradient(#000,transparent);mask-image:linear-gradient(#000,transparent)">Read more fade</p>', cc],
 ['transform scale tiny', '<p style="color:#aaa;transform:scale(.01)">Tiny</p>', cc],
 ['top layer dialog over dark page', '<div style="background:#000;height:300px"></div><dialog open style="background:#fff;color:#aaa">Dialog text</dialog>', cc],
 ['clip-path inset on wrapper (partial)', '<div style="clip-path:inset(0 50% 0 0);background:#000"><p style="color:#fff">Clipped half</p></div>', cc],
 ['positioned dark ::before under text', '<style>.h{position:relative;color:#fff;padding:10px}.h::before{content:"";position:absolute;inset:0;background:#000;z-index:-1}</style><div style="position:relative;z-index:0"><p class="h">Hero text</p></div>', cc],
 ['sticky header without bg', '<header style="position:sticky;top:0;color:#777">Sticky nav</header><div style="height:2000px;background:#000"></div>', cc],
];
(async () => { for (const [l, b, ids] of cases) await four(l, page(b), ids); await close(); })();
