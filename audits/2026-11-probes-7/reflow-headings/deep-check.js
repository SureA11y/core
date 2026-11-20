const h = require('./harness');
const D = '<!doctype html><html lang=en><head><meta charset=utf-8></head><body>';
const L = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.';
(async () => {
  for (const n of [1,2,3,10,100,300,600]) {
    const a = D + '<div>'.repeat(n) + '<b>Deep title</b>' + '</div>'.repeat(n) + `<p>${L}</p>`;
    const b = D + '<div>'.repeat(n) + `<b>T</b><br>${L}` + '</div>'.repeat(n);
    const ra = await h.runChromium(a, 'p-as-heading', {width:1024}); const rb = await h.runChromium(b, 'p-as-heading', {width:1024});
    const ja = await h.runJsdom(a, 'p-as-heading'); const jb = await h.runJsdom(b, 'p-as-heading');
    console.log(n, 'div:', ra.outcome, ja.outcome, ja.ms+'ms', ' lead:', rb.outcome, jb.outcome, jb.ms+'ms');
  }
  await h.close();
})();
