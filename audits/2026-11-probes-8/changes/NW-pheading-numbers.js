// p-as-heading: which bold lines at body size before plain text are asked about (prices/numbers/symbols left out?)
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const texts = ['$29.99', '45%', '+45%', '−5%', '-5%', '+33 1 23 45 67 89', '$29.99*', '£1,299.00', '1.234,56 €', '3×', '4.5 ★', '★★★★☆', '٢٠٢٤', '２０２４', '½', '2024', '#1', 'No. 12', '12:30', '€ 9,–', '1/2', '~30', '≈ 30', '100+', '1st', '§ 12', '¥1,000', '$ 1 000', '9.99 $US', 'Opening hours', '営業時間', 'Часы работы'];
for (const t of texts) {
  for (const size of ['16px', '24px']) {
    const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>Shop</h1><p>Intro paragraph text that reads plainly here.</p><p style="font-size:${size}"><b>${t}</b></p><p style="font-size:16px">Mon to Fri, nine to five, closed on public holidays and weekends.</p></main></body></html>`;
    const r = runa11yCoreOnHtml(html, { runOnly: ['p-as-heading'] });
    const c = r.checksResults[0];
    const occ = c.occurrences.filter(o => o.data.details.reasonCode);
    process.stdout.write(`${size==='16px'?'\n'+t.padEnd(20):''} ${size}: ${c.outcome} ${occ.map(o => o.data.details.reasonCode + (o.data.details.lean ? '/' + o.data.details.lean : '')).join(',')}`.padEnd(48));
  }
}
console.log();
