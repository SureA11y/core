// a11ycore.run({runOnly}) vs runa11yCoreInPage(href, null, {}, runOnly) for every runOnly form.
import { launch, open } from './h.mjs';
const b = await launch();
const { page, ctx } = await open(b, '<!doctype html><html lang=en><title>t</title><main><h1>x</h1><img src="data:,"><a href="/">ok</a></main>', { console: false });
const forms = [
  "['img-alt-present']", "'img-alt-present'", "'img-alt-present, link-name-present'", "['IMG-ALT-PRESENT']", "['a11ycore-img-alt-present']",
  "{ wcag: { version: '2.2', level: 'AA' } }", "{ wcag: { version: '2.1', level: 'A' } }", "{ bestPractices: true }", "{ wcag: { version: '2.2', level: 'AA' }, bestPractices: true }",
  "{ tags: ['wcag111'] }", "['wcag2a','wcag2aa']", "{ type: 'tag', values: ['wcag111'] }", "{ type: 'rule', values: 'img-alt-present' }", "new Set(['img-alt-present'])",
  "{ includeRuleIds: ['wcag-1.1.1-non-text-content'] }", "['wcag-1.1.1-non-text-content']", "{ excludeTags: ['best-practice'] }",
  "[]", "''", "{}", "null", "undefined", "0", "false", "true", "5", "['nope']", "{ includeRuleId: ['img-alt-present'] }", "{ type: 'x', values: ['a'] }", "['img-alt-present','wcag111']",
  "{ wcag: { version: '3.0', level: 'AA' } }", "{ wcag: { version: '2.2', level: 'AAAA' } }", "{ wcag: '2.2 AA' }", "{ wcag: {} }", "{ bestPractices: 'yes' }",
  "Object.create({ includeRuleIds: ['img-alt-present'] })", "JSON.parse('{\"__proto__\": {\"includeRuleIds\": [\"img-alt-present\"]}}')", "{ tags: ['wcag22a'] }"
];
for (const f of forms) {
  const r = await page.evaluate(async (f) => {
    const sel = (r) => r.checksResults.map((c) => c.ruleId).sort().join(',');
    const summary = (r) => { const s = sel(r); return { n: r.checksResults.length, rollups: (r.rulesResults || []).length, lvl: r.engine && r.engine.wcagLevel, ver: r.engine && r.engine.wcagVersion, h: s.length + ':' + s.slice(0, 60) }; };
    const warns = []; const ow = console.warn, oi = console.info; console.warn = (...a) => warns.push('W ' + a.join(' ').slice(0, 140)); console.info = (...a) => warns.push('I ' + a.join(' ').slice(0, 140));
    let a, d;
    try { a = summary(await a11ycore.run({ runOnly: eval('(' + f + ')') })); } catch (e) { a = 'THROW ' + (e.code || '') + ' ' + e.message.slice(0, 120); }
    const wa = warns.splice(0);
    try { d = summary(a11ycore.runa11yCoreInPage(location.href, null, {}, eval('(' + f + ')'))); } catch (e) { d = 'THROW ' + (e.code || '') + ' ' + e.message.slice(0, 120); }
    const wd = warns.splice(0);
    console.warn = ow; console.info = oi;
    return { a, d, wa, wd };
  }, f);
  const same = JSON.stringify(r.a) === JSON.stringify(r.d);
  console.log((same ? 'same ' : 'DIFF ') + f.padEnd(50), JSON.stringify(r.a), same ? '' : ' direct=' + JSON.stringify(r.d), r.wa.length ? ' warns=' + JSON.stringify(r.wa) : '');
}
// options that are not an object
for (const f of ["['img-alt-present']", "'img-alt-present'", "{ context: 'main', runOnly: ['img-alt-present'] }", "{ context: '#nope' }", "{ context: '<<' }", "{ runOnly: ['img-alt-present'], rules: { include: ['link-name-present'] } }", "{ strictOptions: true, foo: 1 }", "{ strictOptions: true, context: 'main' }", "{ rules: { include: 'link-name-present' } }"]) {
  const r = await page.evaluate(async (f) => {
    const warns = []; const ow = console.warn; console.warn = (...a) => warns.push(a.join(' ').slice(0, 140));
    let a; try { const r = await a11ycore.run(eval('(' + f + ')')); a = r.checksResults.length + ' rules; ' + r.checksResults.filter(c=>c.outcome!=='notApplicable').map(c=>c.ruleId+':'+c.outcome).slice(0,5).join(','); } catch (e) { a = 'THROW ' + (e.code || '') + ' ' + e.message.slice(0, 140); }
    console.warn = ow; return { a, warns };
  }, f);
  console.log('options ' + f.padEnd(60), JSON.stringify(r));
}
await ctx.close(); await b.close();
