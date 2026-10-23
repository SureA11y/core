const { scan, scanIP, pack } = require('./h.js');
const { mk } = require('./p.js');
const mkEO = () => ({ locale: 'de', probes: { crawl: { pageTitles: { pages: [{ url: 'u', title: 't' }] } }, deep: { a: [1, 2, { b: 'x'.repeat(3000) }] } }, contrast: { mode: 'auditorAssist', rootCanvasFallback: 'transparent' }, output: { detail: 'findings' }, rules: { 'img-alt-present': { excludeSelectors: ['.x'] } }, customRules: [{ id: 'x-r', meta: { tags: ['x'] }, runInPage(ctx) { return { outcome: 'pass' }; } }], excludeSelectors: ['.y'], policy: { allowedOutcomes: ['fail', 'pass', 'cantTell', 'notApplicable'] } });
for (const [name, fn] of [['node', scan], ['inpage', scanIP]]) {
  const eo = mkEO(); const before = JSON.stringify(eo);
  fn(eo);
  const after = JSON.stringify(eo);
  const frozen = [Object.isFrozen(eo), Object.isFrozen(eo.probes), Object.isFrozen(eo.probes.crawl), Object.isFrozen(eo.rules), Object.isFrozen(eo.customRules), Object.isFrozen(eo.customRules[0]), Object.isFrozen(eo.contrast)];
  console.log(name, 'mutated:', before !== after, 'frozen:', frozen);
  if (before !== after) console.log(' diff', after.slice(0, 300));
}
// raw pack object (no definePack): frozen by scan?
const raw = mk(); scan({ packs: [raw] }); console.log('raw pack frozen after scan:', Object.isFrozen(raw), Object.isFrozen(raw.rules));
// engine state leak across scans: excludeSelectors from scan 1 affecting scan 2?
const a = scan({ excludeSelectors: ['img'] }, ['img-alt-present']).v.checksResults[0].outcome;
const b = scan({}, ['img-alt-present']).v.checksResults[0].outcome;
console.log('exclude leak', a, b);
// rules config leak
const c1 = scan({ customRules: [{ id: 'x-cfg', meta: { tags: ['x'] }, runInPage(ctx) { return { outcome: 'pass', data: ctx.config }; } }], rules: { 'x-cfg': { k: 1 } } }, ['x-cfg']).v.checksResults[0].data;
const c2 = scan({ customRules: [{ id: 'x-cfg', meta: { tags: ['x'] }, runInPage(ctx) { return { outcome: 'pass', data: ctx.config }; } }] }, ['x-cfg']).v.checksResults[0].data;
console.log('config leak', JSON.stringify(c1), JSON.stringify(c2));
// messages leak across scans
const m1 = scan({ messages: { en: { imgAltPresent_title: 'HACKED' } } }, ['img-alt-present']).v.checksResults[0].title;
const m2 = scan({}, ['img-alt-present']).v.checksResults[0].title;
console.log('messages leak', m1, '|', m2);
// a custom rule mutating helpers via prototype (not own props)
const p1 = scan({ customRules: [{ id: 'x-evil', meta: { tags: ['x'] }, runInPage(ctx) { try { Object.getPrototypeOf(ctx.helpers).queryAllSmart = () => []; } catch (e) {} try { Array.prototype.__evil = 1; } catch (e) {} try { ctx.helpers.contrast.parseCssColorToRgba = () => null; } catch (e) { return { outcome: 'pass', data: String(e) }; } return { outcome: 'pass', data: 'mutated contrast helper' }; } }] }, ['x-evil']);
console.log('helpers nested mutate', p1.v.checksResults[0].data);
delete Array.prototype.__evil;
