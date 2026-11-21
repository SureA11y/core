const F = '/tmp/surea11y-audit/scratch/family/';
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const { renderHtmlReport } = require('/home/user/core-r8/src/report.js');
const { renderSarifReport } = require('/home/user/core-r8/src/sarif.js');
const { renderJunitReport } = require('/home/user/core-r8/src/junit.js');
const ps = ['pack-rgaa', 'pack-raweb', 'pack-wai-aria'].map(n => require(F + n));
console.warn = () => {}; console.info = () => {};
const html = '<!doctype html><html lang="en"><head><title>t</title></head><body><main>x</main></body></html>';
for (const [prof, locale] of [['rgaa-4.1.2', 'en'], ['rgaa-4.1.2', 'de'], [['rgaa-4.1.2', 'wcag22-aa'], 'en'], [['rgaa-4.1.2', 'raweb-1.1'], 'en'], ['raweb-1.1', 'en'], ['raweb-1.1', 'fr']]) {
  const r = runa11yCoreOnHtml(html, { engineOptions: { packs: ps, profile: prof, locale } });
  const h = renderHtmlReport(r, { packs: ps });
  const chip = (h.match(/[^>]{0,40}(Article 47|Loi du 28 mai|Law of 28 May)[^<]{0,60}/) || [''])[0];
  const s = renderSarifReport(r, { packs: ps }); const j = renderJunitReport(r, { packs: ps });
  console.log(JSON.stringify(prof).padEnd(28), locale, 'engine.law', JSON.stringify(r.engine.law && { id: r.engine.law.id, lang: r.engine.law.lang, name: r.engine.law.name.slice(0, 30) }), '| profiles.law', JSON.stringify(r.profiles && Object.fromEntries(Object.entries(r.profiles).map(([k, v]) => [k, v.law && v.law.id]))), '| html chip:', JSON.stringify(chip.slice(0, 80)), '| sarif law?', /article-47|lu-loi/.test(s), '| junit law?', /article-47|lu-loi/.test(j));
}
