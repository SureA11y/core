// Edge cases of @surea11y/core/testing and definePack, run from a pack folder given as argv[2].
const path = require('path');
const req = require('module').createRequire(path.join(path.resolve(process.argv[2]), 'x.js'));
const { runa11yCoreOnHtml, assertRule, createDom, runa11yCoreOnDom } = req('@surea11y/core/testing');
const { definePack, checkPack } = req('@surea11y/core/pack');
const pack = req(path.resolve(process.argv[2]));
const html = '<!doctype html><html lang="en"><title>t</title><a href="/x">Read more</a></html>';
const tryIt = (label, fn) => { try { const v = fn(); console.log(`[${label}] ok`, v === undefined ? '' : JSON.stringify(v).slice(0, 300)); } catch (e) { console.log(`[${label}] THROWS`, (e.code ? e.code + ' ' : '') + String(e.message).split('\n').slice(0, 3).join(' | ')); } };

tryIt('assertRule unknown id', () => { const r = runa11yCoreOnHtml(html, { engineOptions: { packs: [pack] }, runOnly: ['acme-link-text-specific'] }); assertRule(r, 'acme-nope', 'fail'); });
tryIt('runOnly unknown id with pack', () => { const r = runa11yCoreOnHtml(html, { engineOptions: { packs: [pack] }, runOnly: ['acme-nope'] }); return { n: r.checksResults.length, warn: r.warnings }; });
tryIt('runOnly unknown id no pack', () => { const r = runa11yCoreOnHtml(html, { runOnly: ['acme-nope'] }); return { n: r.checksResults.length }; });
tryIt('opt-in rule without runOnly', () => { const r = runa11yCoreOnHtml(html, { engineOptions: { packs: [pack] } }); return r.checksResults.some((x) => x.ruleId === 'acme-link-text-specific'); });
tryIt('assertRule bad outcome name', () => { const r = runa11yCoreOnHtml(html, { engineOptions: { packs: [pack] }, runOnly: ['acme-link-text-specific'] }); assertRule(r, 'acme-link-text-specific', 'failed'); });
tryIt('assertRule unprefixed id (a11ycore tag)', () => { const r = runa11yCoreOnHtml(html, { runOnly: ['link-name-present'] }); return { tag: r.engine.tag, rule: assertRule(r, 'link-name-present', 'pass').ruleId }; });
tryIt('empty html', () => runa11yCoreOnHtml('', { engineOptions: { packs: [pack] }, runOnly: ['acme-link-text-specific'] }).checksResults.map((x) => x.outcome));
tryIt('runa11yCoreOnDom with packs', () => { const dom = createDom(html); return runa11yCoreOnDom(dom, { engineOptions: { packs: [pack] }, runOnly: ['acme-link-text-specific'] }).checksResults.map((x) => x.outcome); });
tryIt('globals leak after scan', () => ({ window: typeof global.window, document: typeof global.document }));
tryIt('pack strictOptions unknown profile', () => runa11yCoreOnHtml(html, { engineOptions: { packs: [pack], profile: 'acme-nope', strictOptions: true } }).engine.profile);
tryIt('pack unknown profile (no strict)', () => { const r = runa11yCoreOnHtml(html, { engineOptions: { packs: [pack], profile: 'acme-nope' } }); return { profile: r.engine.profile, n: r.checksResults.length }; });

const base = { name: 'p', version: '1.0.0', namespace: 'zz', core: '^1.10.0' };
const runRule = (rule, label) => tryIt(label, () => { const p = definePack({ ...base, rules: [rule] }); const r = runa11yCoreOnHtml(html, { engineOptions: { packs: [p] }, runOnly: [rule.id] }); const x = r.checksResults.find((c) => c.ruleId === rule.id); return x ? { outcome: x.outcome, error: x.error, skipped: r.skippedPacks } : { missing: true, skipped: r.skippedPacks }; });
runRule({ id: 'zz-async', meta: { tags: ['zz'] }, runInPage: async () => ({ outcome: 'fail', occurrences: [] }) }, 'async runInPage');
runRule({ id: 'zz-nometa', runInPage: () => ({ outcome: 'pass', occurrences: [] }) }, 'rule without meta');
runRule({ id: 'zz-throws', meta: { tags: ['zz'] }, runInPage: () => { throw new Error('kaboom'); } }, 'rule throws');
runRule({ id: 'zz-bad-outcome', meta: { tags: ['zz'] }, runInPage: () => ({ outcome: 'failed', occurrences: [] }) }, 'bad outcome string');
runRule({ id: 'zz-returns-undefined', meta: { tags: ['zz'] }, runInPage: () => {} }, 'returns undefined');
runRule({ id: 'zz-arrow', meta: { tags: ['zz'] }, runInPage: (ctx) => ({ outcome: 'pass', occurrences: [] }) }, 'arrow fn');
runRule({ id: 'zz-method', meta: { tags: ['zz'] }, runInPage(ctx) { return { outcome: 'pass', occurrences: [] }; } }, 'method shorthand');
runRule({ id: 'zz-native', meta: { tags: ['zz'] }, runInPage: Math.max }, 'native fn');
runRule({ id: 'zz-bound', meta: { tags: ['zz'] }, runInPage: function (ctx) { return { outcome: 'pass', occurrences: [] }; }.bind(null) }, 'bound fn');
tryIt('definePack rule no runInPage', () => definePack({ ...base, rules: [{ id: 'zz-x', meta: {} }] }) && 'accepted');
tryIt('definePack id without ns', () => definePack({ ...base, rules: [{ id: 'other-x', runInPage() {} }] }) && 'accepted');
tryIt('definePack id dup with core', () => checkPack({ ...base, namespace: 'link', rules: [{ id: 'link-name-present', runInPage() {} }] }));
tryIt('checkPack ns=a11ycore', () => checkPack({ ...base, namespace: 'a11ycore' }));
tryIt('checkPack ns=forms', () => checkPack({ ...base, namespace: 'forms' }));
tryIt('checkPack ns=best-practice', () => checkPack({ ...base, namespace: 'best-practice' }));
