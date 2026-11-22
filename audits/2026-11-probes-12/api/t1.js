const B = require('./bh.js'); const fs = require('fs');
const pg = `<!doctype html><html lang="en"><head><title>t</title><script src="/core.js"></script><script src="/de.js"></script></head><body><main><h1>t</h1>${'<img src="a.png">'.repeat(4)}<a href="/x"></a></main></body></html>`;
(async () => {
  await B.start();
  const http = require('http');
  const { page, logs } = await B.open('/', pg.replace('<script src="/de.js"></script>', `<script>${fs.readFileSync(B.ROOT + '/surea11y.i18n.de.js', 'utf8').replace(/<\/script/g, '<\\/script')}</script>`));
  const out = await page.evaluate(async () => {
    const res = {};
    const c = a11ycore.console || a11ycore;
    res.keys = Object.keys(a11ycore).filter(k => typeof a11ycore[k] === 'function').join(' ');
    const r1 = a11ycore.runa11yCoreInPage(location.href, null, { locale: 'de-AT', messages: { 'de-AT': { img_altPresent_summary_fail: 'AT!' } }, output: { maxOccurrencesPerRule: 1 } }, ['img-alt-present', 'link-name-present']);
    res.loc = r1.engine.locale; res.sum = r1.checksResults.map(c => c.ruleId + ':' + (c.occurrences[0] || {}).summary);
    const r2 = a11ycore.runa11yCoreInPage(location.href, null, { locale: 'de-AT' }, ['img-alt-present']); res.loc2 = r2.engine.locale; res.sum2 = (r2.checksResults[0].occurrences[0] || {}).summary;
    try { const t = a11ycore.table ? a11ycore.table(r1) : null; res.table = t; } catch (e) { res.table = 'ERR ' + e.message; }
    const r3 = a11ycore.runa11yCoreInPage(location.href, null, { timeBudgetMs: 1 }, null);
    try { const t = a11ycore.table(r3); res.tableBudget = Array.isArray(t) ? t.slice(0, 3) : t; } catch (e) { res.tableBudget = 'ERR ' + e.message; }
    return res;
  });
  console.log(JSON.stringify(out, null, 1).slice(0, 3000)); console.log(logs.slice(0, 12).map(l => l.slice(0, 250)));
  await B.stop();
})();
