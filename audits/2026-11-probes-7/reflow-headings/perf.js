const h = require('./harness');
const D = '<!doctype html><html lang=en><head><meta charset=utf-8></head><body>';
const L = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.';
const gens = {
  flatCards: (n) => Array.from({length:n/4},(_,i)=>`<div class=c><div><b>Title ${i}</b></div><div>${L}</div><p>x</p></div>`).join(''),
  leadLines: (n) => Array.from({length:n/3},(_,i)=>`<p><b>Title ${i}</b><br>${L}</p>`).join(''),
  manyBr: (n) => `<div><b>Title</b>` + '<br>word '.repeat(n) + `</div>`,
  manyBrP: (n) => Array.from({length:n/2},()=>`<p>a<br>b</p>`).join(''),
  deepDiv: (n) => '<div>'.repeat(n) + '<b>Deep title</b>' + '</div>'.repeat(n) + `<p>${L}</p>`,
  deepSpanInDiv: (n) => '<div>' + '<span>'.repeat(n) + '<b>x</b>' + '</span>'.repeat(n) + '</div>',
  deepBr: (n) => '<div>'.repeat(n) + `<b>T</b><br>${L}` + '</div>'.repeat(n),
  boldRun: (n) => Array.from({length:n},(_,i)=>`<p><b>Bold line ${i}</b></p>`).join('') + `<p>${L}</p>`,
};
(async () => {
  const which = process.argv[2]; const sizes = (process.argv[3]||'1000,5000,20000').split(',').map(Number);
  const engines = (process.argv[4]||'cr,js').split(',');
  for (const [name, g] of Object.entries(gens)) {
    if (which && which !== 'all' && name !== which) continue;
    for (const n of sizes) {
      const html = D + g(n) + '</body></html>';
      const out = [];
      if (engines.includes('cr')) { const r = await h.runChromium(html, 'p-as-heading', { width: 1024 }); out.push('CR ' + r.ms + 'ms ' + r.outcome + ' n=' + r.occ.length + (r.error?' ERR '+JSON.stringify(r.error).slice(0,100):'')); }
      if (engines.includes('js')) { const r = await h.runJsdom(html, 'p-as-heading'); out.push('JS ' + r.ms + 'ms ' + r.outcome + ' n=' + r.occ.length+ (r.error?' ERR '+JSON.stringify(r.error).slice(0,100):'')); }
      console.log(name.padEnd(14), String(n).padStart(6), out.join(' | '));
    }
  }
  await h.close();
})();
