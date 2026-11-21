const fs = require('fs');
const F = '/tmp/surea11y-audit/scratch/family/';
const { chromium } = require('/home/user/core/node_modules/playwright');
const P = require('/home/user/core-r8/src/pack.js');
const core = require('/home/user/core-r8/src/index.js');
const ps = ['pack-rgaa', 'pack-raweb', 'pack-en301549', 'pack-wai-aria'].map(n => require(F + n));
const bundle = fs.readFileSync('/home/user/core-r8/surea11y.browser.js', 'utf8');
const html = fs.readFileSync('/home/user/core-r8/tests/fixtures/' + (process.argv[2] || 'all-pass.html'), 'utf8');
const { JSDOM } = require('/home/user/core-r8/node_modules/jsdom');
(async () => {
  console.warn = () => {}; console.info = () => {};
  const script = P.packScript(ps);
  const names = P.describePacks(ps).map(d => d.name + '@' + d.version);
  const prof = ['wcag22-aa', 'rgaa-4.1.2', 'wai-aria-1.2', 'raweb-1.1', 'en301549-v4.1.1'];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.setContent(html);
  await page.addScriptTag({ content: bundle });
  await page.addScriptTag({ content: script });
  const b = await page.evaluate(([names, prof]) => { try { return window.a11ycore.runa11yCoreInPage(null, null, { packs: names, profile: prof }, null); } catch (e) { return { err: e.code + ' ' + e.message }; } }, [names, prof]);
  if (b.err) { console.log('browser THROW', b.err); }
  // Node with pack objects on the same page html via jsdom (layout differs, so compare only rules list/profile metadata)
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  global.window = dom.window; global.document = dom.window.document; const n = await core.runDomRulesInPage(null, null, { packs: ps, profile: prof }, null);
  console.log('browser profiles', JSON.stringify(b.engine && b.engine.profiles), 'notRun', JSON.stringify(b.engine && b.engine.profilesNotRun), 'law', JSON.stringify(b.engine && b.engine.law));
  console.log('node packs', JSON.stringify(n.engine && n.engine.packs), 'browser packs', JSON.stringify(b.engine && b.engine.packs));
  const ids = r => new Set((r.checksResults || []).map(c => c.ruleId));
  const bi = ids(b), ni = ids(n);
  console.log('rules browser', bi.size, 'node', ni.size, 'only browser', [...bi].filter(x => !ni.has(x)).slice(0, 10), 'only node', [...ni].filter(x => !bi.has(x)).slice(0, 10));
  const rb = new Set((b.rulesResults || []).map(c => c.id)), rn = new Set((n.rulesResults || []).map(c => c.id));
  console.log('rollups browser', rb.size, 'node', rn.size, 'only browser', [...rb].filter(x => !rn.has(x)).slice(0, 10), 'only node', [...rn].filter(x => !rb.has(x)).slice(0, 10));
  const ek = r => Object.keys(r.engine || {}).sort().join(',');
  if (ek(b) !== ek(n)) console.log('engine keys differ:\n B', ek(b), '\n N', ek(n));
  await browser.close();
})().catch(e => console.log('THROW', e.stack.slice(0, 400)));
