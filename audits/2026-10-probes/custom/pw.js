const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const core = require('/home/user/core/src/index.js');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(async e => { console.log('launch w/ path failed', e.message.slice(0,200)); return chromium.launch(); });
  const page = await browser.newPage();
  const html = `<!doctype html><html lang="en"><head><title>T</title></head><body><main><h1>Hi</h1><div id="a" onclick="x()">a</div><div class="skip" onclick="y()">b</div></main></body></html>`;
  await page.setContent(html);
  const docRule = { id:'org-no-inline-onclick', meta:{ title:'No inline onclick handlers', defaultSeverity:'moderate' },
    runInPage(ctx) { const els = ctx.helpers.queryAll('[onclick]'); const occurrences = els.map((el) => ({ selector: ctx.helpers.buildSelector(el), html: el.outerHTML, summary: 'x' })); return { ruleId: ctx.rule.ruleId, outcome: occurrences.length ? 'fail' : 'pass', severity: 'moderate', occurrences }; } };
  const cases = {
    methodShorthandToString: { ...docRule, runInPage: docRule.runInPage.toString() },
    fnStr: { ...docRule, runInPage: 'function ' + docRule.runInPage.toString() },
    arrowStr: { ...docRule, runInPage: "(ctx)=>({outcome:'fail',occurrences:[{__node: ctx.document.querySelector('#a')}]})" },
    asyncStr: { ...docRule, runInPage: "async (ctx)=>({outcome:'fail',occurrences:[]})" },
    liveFn: { ...docRule },
    closureStr: { ...docRule, runInPage: "(ctx)=>({outcome: OUTER ? 'fail':'pass', occurrences:[]})" },
    circular: { ...docRule, runInPage: "(ctx)=>{ const o={summary:'x', __node: ctx.document.querySelector('#a')}; o.me=o; return {outcome:'fail',occurrences:[o]}; }" },
    nodeInData: { ...docRule, runInPage: "(ctx)=>({outcome:'fail',occurrences:[{__node: ctx.document.querySelector('#a'), data:{el: ctx.document.querySelector('#a')}}]})" },
  };
  // A) self-contained runner via function-source
  const src = core.runa11yCoreInPage.toString();
  await page.addScriptTag({ content: 'window.__run = ' + src + ';' });
  for (const [k, rule] of Object.entries(cases)) {
    try {
      const out = await page.evaluate(({ rule }) => { const r = window.__run(location.href, null, { customRules:[rule] }, ['org-no-inline-onclick']); const c = r.checksResults.find(x=>x.ruleId==='org-no-inline-onclick'); return c ? { outcome:c.outcome, error:c.error||'', n:c.occurrences.length, sel: c.occurrences.map(o=>o.selector) } : { absent:true, total:r.checksResults.length }; }, { rule });
      console.log('A', k.padEnd(26), JSON.stringify(out));
    } catch (e) { console.log('A', k.padEnd(26), 'ERR', e.message.split('\n')[0].slice(0,200)); }
  }
  // A2) runa11yCoreInPage passed directly to page.evaluate (the doc pattern) w/ multiple args via wrapper
  try {
    const out = await page.evaluate(new Function('args', 'const run=' + src + '; return run(location.href, null, args.eo, args.ro).checksResults.filter(c=>c.ruleId.startsWith("org")).map(c=>c.ruleId+":"+c.outcome)'), { eo: { customRules:[cases.arrowStr] }, ro: null });
    console.log('A2 default run', out);
  } catch (e) { console.log('A2 ERR', e.message.slice(0,200)); }
  // B) browser bundle
  const page2 = await browser.newPage(); await page2.setContent(html);
  await page2.addScriptTag({ content: fs.readFileSync('/home/user/core/surea11y.browser.js','utf8') });
  for (const [k, rule] of Object.entries(cases)) {
    try {
      const out = await page2.evaluate(({ rule }) => { const r = window.a11ycore.runa11yCoreInPage(location.href, null, { customRules:[rule], excludeSelectors:['.skip'] }, ['org-no-inline-onclick']); const c = r.checksResults.find(x=>x.ruleId==='org-no-inline-onclick'); return c ? { outcome:c.outcome, error:c.error||'', n:c.occurrences.length, sel:c.occurrences.map(o=>o.selector) } : { absent:true, total:r.checksResults.length }; }, { rule });
      console.log('B', k.padEnd(26), JSON.stringify(out));
    } catch (e) { console.log('B', k.padEnd(26), 'ERR', e.message.split('\n')[0].slice(0,200)); }
  }
  // B2: bundle — runOnly bare array with unknown id / typo
  const o = await page2.evaluate(() => { try { const r = window.a11ycore.runa11yCoreInPage(location.href, null, { customRules:[] }, ['org-typo']); return 'no throw, total=' + r.checksResults.length; } catch (e) { return 'THROW ' + e.message; } });
  console.log('B2 typo runOnly', o);
  console.log('bundle keys', await page2.evaluate(() => Object.keys(window.a11ycore)));
  // determinism in browser
  const d = await page2.evaluate(() => { const eo={timestamp:'2026-01-01T00:00:00Z', customRules:[{id:'z',meta:{},runInPage:"(c)=>({outcome:'fail',occurrences:[{__node:c.document.querySelector('#a')}]})"}]}; return JSON.stringify(window.a11ycore.runa11yCoreInPage('u',null,eo,null))===JSON.stringify(window.a11ycore.runa11yCoreInPage('u',null,eo,null)); });
  console.log('browser deterministic', d);
  await browser.close();
})();
