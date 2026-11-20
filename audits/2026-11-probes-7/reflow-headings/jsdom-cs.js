const { JSDOM } = require('/home/user/core/node_modules/jsdom');
const d = new JSDOM(`<!doctype html><style>:root{--fs:24px;--fw:700}.a{font-size:clamp(1.5rem, 1rem + 2vw, 2.5rem)}.b{font-size:var(--fs);font-weight:var(--fw)}</style><p class=a>x</p><p class=b>y</p>`);
for (const s of ['.a','.b']) { const cs = d.window.getComputedStyle(d.window.document.querySelector(s)); console.log(s, JSON.stringify(cs.fontSize), JSON.stringify(cs.fontWeight)); }
