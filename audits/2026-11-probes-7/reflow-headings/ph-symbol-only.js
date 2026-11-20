// RW: a bold paragraph/div with no letters at all (star rating, scene break, arrow, emoji) is asked about as a title
// (BOLD_SHORT_PARAGRAPH / BOLD_SHORT_DIV); BOLD_LEAD_LINE already requires a letter (/\p{L}/) but judgeBlock doesn't.
const h = require('./harness');
const D = '<!doctype html><html lang=en><head><meta charset=utf-8></head><body>';
const L = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.';
const cases = {
  'star rating p': `<p><b>★★★★☆</b></p><p>${L}</p>`,
  'scene break p': `<p><strong>* * *</strong></p><p>${L}</p>`,
  'em-dash p': `<p><strong>—</strong></p><p>${L}</p>`,
  'emoji p': `<p><b>🎉🎉</b></p><p>${L}</p>`,
  'star rating div': `<div><b>★★★★☆</b></div><div>${L}</div>`,
  'zero-width only p': `<p><b>​</b></p><p>${L}</p>`,
  'lead line stars (control: left out)': `<p><b>★★★★☆</b><br>${L}</p>`,
  'large stars 24px p': `<p style="font-size:24px"><b>★★★★☆</b></p><p>${L}</p>`,
};
(async () => {
  for (const [name, frag] of Object.entries(cases)) for (let i = 0; i < 2; i++) {
    const html = D + frag + '</body></html>';
    const c = await h.runChromium(html, 'p-as-heading', { width: 1024 });
    const j = await h.runJsdom(html, 'p-as-heading');
    console.log(name.padEnd(38), 'CR:', c.outcome, c.occ.map(o => o.code).join(','), '| jsdom:', j.outcome, j.occ.map(o => o.code).join(','));
  }
  await h.close();
})();
