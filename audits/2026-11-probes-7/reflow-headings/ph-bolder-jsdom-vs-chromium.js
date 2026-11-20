// RW: jsdom reads font-weight 'bolder' as 700 whatever the parent's weight; Chromium resolves it against the parent
// (CSS Fonts 4 relative weights: 300 -> 400, 700 -> 900). Verdicts differ between engines.
const h = require('./harness');
const D = '<!doctype html><html lang=en><head><meta charset=utf-8>';
const L = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.';
const cases = {
  'light theme (body 300), <strong> at 24px': `<style>body{font-weight:300}</style></head><body><p style="font-size:24px"><strong>Our services</strong></p><p>${L}</p></body></html>`,
  'bold container (700), <strong> at body size': `</head><body><div style="font-weight:700"><p><strong>Opening hours</strong></p><p>${L}</p></div></body></html>`,
  'control: normal theme, <strong> at 24px': `</head><body><p style="font-size:24px"><strong>Our services</strong></p><p>${L}</p></body></html>`,
};
(async () => {
  for (const [name, rest] of Object.entries(cases)) for (let i = 0; i < 2; i++) {
    const html = D + rest;
    const c = await h.runChromium(html, 'p-as-heading', { width: 1024, after: () => getComputedStyle(document.querySelector('strong')).fontWeight });
    const j = await h.runJsdom(html, 'p-as-heading');
    console.log(name.padEnd(46), `Chromium(strong=${c.extra}):`, c.outcome, c.occ.map(o => o.code).join(','), '| jsdom:', j.outcome, j.occ.map(o => o.code).join(','));
  }
  await h.close();
})();
