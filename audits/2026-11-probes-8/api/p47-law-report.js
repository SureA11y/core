// HTML report of a scan of two profiles serving different laws.
const F = '/tmp/surea11y-audit/scratch/family/';
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const { renderHtmlReport } = require('/home/user/core-r8/src/report.js');
const ps = ['pack-rgaa', 'pack-raweb', 'pack-wai-aria'].map(n => require(F + n));
console.warn = () => {}; console.info = () => {};
const html = '<!doctype html><html lang="en"><head><title>t</title></head><body><main>x</main></body></html>';
for (const prof of [['rgaa-4.1.2', 'raweb-1.1'], ['raweb-1.1', 'rgaa-4.1.2'], ['wcag22-aa', 'rgaa-4.1.2']]) {
  const r = runa11yCoreOnHtml(html, { engineOptions: { packs: ps, profile: prof } });
  const h = renderHtmlReport(r, { packs: ps });
  require('fs').writeFileSync('out-p47-' + prof.join('+') + '.html', h);
  const a47 = (h.match(/Article 47 de la loi/g) || []).length, lu = (h.match(/Loi du 28 mai 2019/g) || []).length;
  const ctx = (h.match(/.{0,200}Article 47 de la loi.{0,80}/) || [''])[0].replace(/\s+/g, ' ');
  console.log(JSON.stringify(prof), 'Article 47 x' + a47, 'Loi LU x' + lu, '\n   ', ctx.slice(0, 300));
}
