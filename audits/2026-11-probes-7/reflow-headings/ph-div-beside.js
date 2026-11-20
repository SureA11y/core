// RW: BOLD_SHORT_DIV asks about a bold <div> laid out BESIDE the passage when the side-by-side layout is
// float, display:table-cell or an auto-flowing grid column (laidOutAsLabel only knows inline, flex row, grid with template columns).
const h = require('./harness');
const D = '<!doctype html><html lang=en><head><meta charset=utf-8></head><body>';
const L = 'Free shipping on every order over fifty euros, worldwide, delivered within three to five working days.';
const cases = {
  'flex row (control, left out)': `<div style="display:flex"><div><b>Shipping</b></div><div>${L}</div></div>`,
  'float:left label beside': `<div style="overflow:hidden"><div style="float:left;width:30%"><b>Shipping</b></div><div style="margin-left:32%">${L}</div></div>`,
  'display:table-cell beside': `<div style="display:table;width:100%"><div style="display:table-row"><div style="display:table-cell;width:30%"><b>Shipping</b></div><div style="display:table-cell">${L}</div></div></div>`,
  'grid-auto-flow:column beside': `<div style="display:grid;grid-auto-flow:column"><div><b>Shipping</b></div><div>${L}</div></div>`,
  'block below (control, asked)': `<div><div><b>Shipping</b></div><div>${L}</div></div>`,
};
(async () => {
  for (const [name, frag] of Object.entries(cases)) for (let i = 0; i < 2; i++) {
    const html = D + frag + '</body></html>';
    const c = await h.runChromium(html, 'p-as-heading', { width: 1024, after: () => { const [a, b] = document.querySelectorAll('b, b ~ *'); const t = document.querySelector('b').parentElement.getBoundingClientRect(); const nx = document.querySelector('b').parentElement.nextElementSibling.getBoundingClientRect(); return `titleTop=${t.top|0} nextTop=${nx.top|0} nextLeft=${nx.left|0}`; } });
    const j = await h.runJsdom(html, 'p-as-heading');
    console.log(name.padEnd(30), c.extra, '| CR:', c.outcome, c.occ.map(o => o.code).join(','), '| jsdom:', j.outcome, j.occ.map(o => o.code).join(','));
  }
  await h.close();
})();
