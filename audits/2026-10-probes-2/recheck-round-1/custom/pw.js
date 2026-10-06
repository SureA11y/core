const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const { runa11yCoreInPage } = require('/home/user/core/src/index.js');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.setContent('<html lang="en"><head><title>t</title></head><body><main><p>hi</p><img src="a.png"></main></body></html>');
  const rule = { runInPage(ctx) { const el = ctx.helpers.queryAllSmart('img')[0]; return { outcome: 'fail', occurrences: [{ __node: el, summary: 's' }] }; } };
  const cr = [{ id: 'z', meta: { title: 'Z' }, runInPage: rule.runInPage.toString() }];
  // evaluate runa11yCoreInPage
  let r = await p.evaluate(runa11yCoreInPage, ['https://e.test/', null, { customRules: cr }, ['z']]).catch(e => 'ERR ' + e.message);
  console.log('evaluate fn: ', typeof r === 'string' ? r : JSON.stringify(r.checksResults.map(x => [x.ruleId, x.outcome, x.occurrences[0] && x.occurrences[0].selector])), r.skippedCustomRules);
  // bundle
  await p.addScriptTag({ content: fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8') });
  const keys = await p.evaluate(() => Object.keys(window.a11ycore || {}));
  console.log('bundle keys', keys);
  r = await p.evaluate(([cr]) => window.a11ycore.runa11yCoreInPage('https://e.test/', null, { customRules: cr }, ['z']), [cr]).catch(e => 'ERR ' + e.message);
  console.log('bundle: ', typeof r === 'string' ? r : JSON.stringify(r.checksResults.map(x => [x.ruleId, x.outcome, x.occurrences[0] && x.occurrences[0].selector])));
  // C-8 circular occurrence
  const circ = [{ id: 'circ', meta: {}, runInPage: "(ctx)=>{ const o={summary:'s'}; o.self=o; return {outcome:'fail', occurrences:[o]}; }" }];
  r = await p.evaluate(([cr]) => window.a11ycore.runa11yCoreInPage('https://e.test/', null, { customRules: cr }, ['circ']), [circ]).catch(e => 'ERR ' + e.message);
  console.log('circular: ', typeof r === 'string' ? r.slice(0, 300) : JSON.stringify(r.checksResults.map(x => [x.ruleId, x.outcome, x.error])));
  await b.close();
})();
