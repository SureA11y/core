// strictOptions on mappings / optInRules spellings the loose scan accepts
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const html = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1></main></body></html>';
for (const eo of [{ optInRules: 'all' }, { optInRules: 'ALL' }, { optInRules: ['all'] }, { optInRules: ' all ' }, { optInRules: 'all,' }, { optInRules: '' }, { optInRules: [] }, { mappings: 'EN301549' }, { mappings: 'en301549:v4.1.1' }, { mappings: 'en301549: V4.1.1' }, { mappings: ' en301549 ' }, { mappings: 'en301549,' }, { mappings: '' }, { mappings: [] }, { excludeSelectors: '' }, { excludeSelectors: [] }, { excludeSelectors: 'main, ' }, { excludeSelectors: ['  '] }]) {
  const res = {};
  for (const strict of [false, true]) {
    const warns = []; const w = console.warn; console.warn = (m) => warns.push(String(m).slice(0, 90));
    try { runa11yCoreOnHtml(html, { runOnly: ['page-has-heading-one'], engineOptions: { ...eo, strictOptions: strict } }); res[strict] = 'ok' + (warns.length ? ' WARN ' + warns.join(' / ') : ''); } catch (e) { res[strict] = 'THROW ' + e.message.slice(0, 90); }
    console.warn = w;
  }
  console.log(JSON.stringify(eo).padEnd(36), '| loose:', res.false, '| strict:', res.true);
}
