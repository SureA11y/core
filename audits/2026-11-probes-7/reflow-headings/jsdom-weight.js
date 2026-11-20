const { JSDOM } = require('/home/user/core/node_modules/jsdom');
const d = new JSDOM(`<!doctype html><style>body{font-weight:300}</style><body><p id=p style="font-size:24px"><strong id=s>Our</strong></p><div style="font-weight:700"><p id=p2><strong id=s2>x</strong></p></div></body>`);
const w = d.window; for (const id of ['p','s','p2','s2']) { const cs = w.getComputedStyle(w.document.getElementById(id)); console.log(id, JSON.stringify(cs.fontWeight), JSON.stringify(cs.fontSize)); }
