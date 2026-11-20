// jsdom vs Chromium for modern CSS values: clamp()/min()/max() font sizes, var() sizes and weights
const h = require('./harness');
const D = '<!doctype html><html lang=en><head><meta charset=utf-8>';
const L = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.';
const cases = {
  'font-size clamp() large bold': `<style>.t{font-weight:700;font-size:clamp(1.5rem, 1rem + 2vw, 2.5rem)}</style></head><body><p class=t>Our services</p><p>${L}</p>`,
  'font-size max() large bold': `<style>.t{font-weight:700;font-size:max(24px, 1.5rem)}</style></head><body><p class=t>Our services</p><p>${L}</p>`,
  'font-size var() large bold': `<style>:root{--fs-lg:24px}.t{font-weight:700;font-size:var(--fs-lg)}</style></head><body><p class=t>Our services</p><p>${L}</p>`,
  'font-weight var() body size': `<style>:root{--fw-bold:700}.t{font-weight:var(--fw-bold)}</style></head><body><p class=t>Opening hours</p><p>${L}</p>`,
  'font-weight var() large': `<style>:root{--fw-bold:700}.t{font-weight:var(--fw-bold);font-size:24px}</style></head><body><p class=t>Our services</p><p>${L}</p>`,
  'control: plain 24px bold': `<style>.t{font-weight:700;font-size:24px}</style></head><body><p class=t>Our services</p><p>${L}</p>`,
};
(async () => {
  for (const [name, rest] of Object.entries(cases)) for (let i = 0; i < 2; i++) {
    const html = D + rest + '</body></html>';
    const c = await h.runChromium(html, 'p-as-heading', { width: 1024 });
    const j = await h.runJsdom(html, 'p-as-heading');
    const f = (r) => r.outcome + ' ' + r.occ.map(o => o.code).join(',');
    console.log((f(c) === f(j) ? '  ' : '!!') + name.padEnd(30), 'CR:', f(c), '| jsdom:', f(j));
  }
  await h.close();
})();
