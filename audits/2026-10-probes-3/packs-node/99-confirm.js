'use strict';
// Re-runs the minimal repro of each finding in a fresh process and prints
// CONFIRMED when the reported behaviour is observed.
const vm = require('vm');
const { scan, quiet, base, rule, outcome, packApi, main } = require('./lib.js');
const { checkPack, satisfiesRange, preparePacks, packScript, describePacks } = packApi;
const results = [];
const check = (id, fn) => { let ok; try { ok = fn(); } catch (e) { ok = 'error: ' + e.message; } results.push(`${id}: ${ok === true ? 'CONFIRMED' : 'NOT REPRODUCED (' + ok + ')'}`); };
const plain = scan({}).checksResults.length;

check('PN-1 checklist namespace "best-practice" removes 27 core rules', () => {
  const p = base({ name: 'bp', namespace: 'best-practice', profiles: { 'best-practice-p': { tags: ['wcag2a'] } } });
  const r = quiet(() => scan({ packs: [p] })).r;
  return !r.skippedPacks && plain - r.checksResults.length === 27;
});
check('PN-2 cache ignores strictOptions (invalid pack, non-strict then strict)', () => {
  const bad = base({ name: 'bad2', namespace: 'bad', core: '^99.0.0' });
  quiet(() => scan({ packs: [bad] }));
  const x = quiet(() => scan({ packs: [bad], strictOptions: true }));
  let threw = false; try { packScript([bad]); } catch { threw = true; }
  return !x.error && !threw;
});
check('PN-3 string/number entries hit another pack object\'s cached engine', () => {
  const v = base({ name: 'victim', namespace: 'victim', rules: [rule('victim-a')] });
  const e = preparePacks([v]);
  for (let n = 1; n < 10000; n++) if (quiet(() => preparePacks([n])).r === e) return true;
  return false;
});
check('PN-4 mutated pack object keeps the stale engine', () => {
  const p = base({ name: 'mut', namespace: 'mut', rules: [rule('mut-a')] });
  quiet(() => scan({ packs: [p] }));
  p.rules.push(rule('mut-b'));
  return outcome(quiet(() => scan({ packs: [p] })).r, 'mut-b') === undefined;
});
check('PN-5 packs: <single pack> silently ignored, no warning', () => {
  const p = base({ name: 'single', namespace: 'single', rules: [rule('single-a')] });
  const x = quiet(() => scan({ packs: p }));
  return outcome(x.r, 'single-a') === undefined && x.warnings.length === 0;
});
check('PN-6 pack rules without the namespace tag do not run under the pack\'s own profile', () => {
  const p = base({ name: 'cl', namespace: 'cl', rules: [rule('cl-always', { meta: { tags: ['links'] } })], profiles: { 'cl-p': { tags: ['wcag2a'] } } });
  const r = quiet(() => scan({ packs: [p], profile: 'cl-p' })).r;
  return r.engine.profile === 'cl-p' && outcome(r, 'cl-always') === undefined && outcome(quiet(() => scan({ packs: [p] })).r, 'cl-always') === 'pass';
});
check('PN-7 profile exclude of wrong shape silently ignored', () => {
  const p = base({ name: 'ex', namespace: 'ex', profiles: { 'ex-1': { tags: ['wcag2a'], exclude: { rules: 'img-alt-present' } } } });
  const r = quiet(() => scan({ packs: [p], profile: 'ex-1' })).r;
  return checkPack(p).length === 0 && !r.skippedPacks && outcome(r, 'img-alt-present') === 'fail';
});
check('PN-8 hyphen range "1.0.0 - 2.0.0" reported as not supporting this core', () => satisfiesRange('1.10.0', '1.0.0 - 2.0.0') === false && satisfiesRange('1.0.0', '1.0.0 - 2.0.0') === null);
check('PN-8b "||" alone / trailing "||" read as a range', () => satisfiesRange('1.10.0', '||') === false && satisfiesRange('1.10.0', '^1.10.0 ||') === true);
check('PN-9 PACKS.md {name} placeholders are not filled ({{name}} are)', () => {
  const R = { id: 'p-a', meta: { title: 't' }, runInPage: (ctx) => ({ outcome: 'fail', occurrences: [ctx.helpers.reportOccurrence(ctx.document.body, { summary: 's', i18n: { summaryKey: 'pA_summary', params: { name: 'N' } } })] }) };
  const s = (t) => quiet(() => scan({ packs: [base({ name: 'ph' + t.length, rules: [R], dictionaries: { en: { pA_summary: t } } })] })).r.checksResults.find((c) => c.ruleId === 'p-a').occurrences[0].summary;
  return s('A {name}') === 'A {name}' && s('A {{name}}') === 'A N';
});
check('PN-10 packScript emits an unparsable script for valid rule shapes', () => {
  const bad = (fn, n) => { const s = packScript([base({ name: 'ps' + n, rules: [{ id: 'p-a', meta: { title: 't' }, runInPage: fn }] })]); try { new vm.Script(s); return false; } catch { return true; } };
  return bad((ctx, o = String(1)) => ({ outcome: 'pass' }), 1) && bad(function () { return { outcome: 'pass' }; }.bind(null), 2);
});
check('PN-11 namespace/profile/standard key/rollup ids not tied to namespace', () =>
  checkPack(base({ namespace: 'img' })).length === 0 && checkPack(base({ profiles: { 'zzz-1': { tags: [] } } })).length === 0 &&
  !quiet(() => scan({ packs: [base({ name: 'zz', profiles: { 'zzz-1': { tags: ['wcag2a'] } } })] })).r.skippedPacks);
check('PN-12 getter that throws / Proxy make a non-strict scan throw', () => {
  const t = base({ name: 'thr' }); Object.defineProperty(t, 'rules', { enumerable: true, get() { throw new Error('boom'); } });
  return !!quiet(() => scan({ packs: [t] })).error;
});
check('PN-13 describePacks throws on standard: {} (checkPack accepts it)', () => {
  try { describePacks([base({ standard: {} })]); return false; } catch (e) { return e instanceof TypeError && checkPack(base({ standard: {} })).length === 0; }
});
check('PN-14 dictionary keys constructor/hasOwnProperty rejected as "defined in both function ..."', () => {
  const r = quiet(() => scan({ packs: [base({ name: 'dk', dictionaries: { en: { constructor: 'x' } } })] })).r;
  return /defined in both function Object/.test(r.skippedPacks[0].reason);
});
check('PN-15 rule ids "p-" and "p- x y" accepted; duplicate ids pass checkPack', () =>
  checkPack(base({ rules: [rule('p-'), rule('p- x y')] })).length === 0 && checkPack(base({ rules: [rule('p-a'), rule('p-a')] })).length === 0);
check('PN-16 skippedPacks keeps input order while engine.packs is sorted', () => {
  const a = base({ name: 'zbad', namespace: 'zbad', core: '^99.0.0' }), b = base({ name: 'abad', namespace: 'abad', core: 'nope' });
  const r1 = quiet(() => scan({ packs: [a, b] })).r, r2 = quiet(() => scan({ packs: [b, a] })).r;
  return r1.skippedPacks[0].name !== r2.skippedPacks[0].name;
});
check('PN-17 unclear reasons: standard {} / unknown requirement / variant without i18n', () => {
  const r1 = quiet(() => scan({ packs: [base({ name: 's1', standard: {} })] })).r.skippedPacks[0].reason;
  const r2 = quiet(() => scan({ packs: [base({ name: 's2', variants: [{ id: 'p-v', from: 'contrast-minimum', config: { normalTextRatio: 7 } }] })] })).r.skippedPacks[0].reason;
  return /mappingsFor is not a function/.test(r1) && /titleKey must end in _title/.test(r2);
});
check('PN-18 customRules with a pack rule id is listed in overriddenBuiltinIds', () => {
  const A = base({ name: 'a', namespace: 'a', rules: [rule('a-one')] });
  return quiet(() => scan({ packs: [A], customRules: [{ id: 'a-one', runInPage: () => ({ outcome: 'pass' }) }] })).r.overriddenBuiltinIds.includes('a-one');
});
check('PN-19 a profile cannot name another pack\'s rule: that pack is skipped', () => {
  const A = base({ name: 'a', namespace: 'a', rules: [rule('a-one')] });
  const B = base({ name: 'b', namespace: 'b', profiles: { 'b-p': { tags: [], rules: ['a-one'] } } });
  const r = quiet(() => scan({ packs: [A, B] })).r;
  return r.skippedPacks && r.skippedPacks[0].name === 'b';
});
check('PN-20 checklist title can be a core standard name', () => {
  const p = base({ name: 'tt', namespace: 'tt', title: 'EN 301 549', profiles: { 'tt-p': { tags: ['wcag2a'] } }, rollups: [{ id: 'tt-r', title: 'R', checksIds: ['img-alt-present'] }] });
  const r = quiet(() => scan({ packs: [p], profile: 'tt-p' })).r;
  return !r.skippedPacks && r.rulesResults.find((x) => x.ruleId === 'tt-r').meta.standard === 'EN 301 549';
});
check('PN-21 prerelease core 1.11.0-rc.1 satisfies ^1.11.0', () => satisfiesRange('1.11.0-rc.1', '^1.11.0') === true);
check('PN-22 packs: [] echoed in each check\'s engineOptions; packs: [x] not', () => {
  const r = scan({ packs: [] });
  const p = base({ name: 'echo', rules: [rule('p-a')] });
  const r2 = quiet(() => scan({ packs: [p] })).r;
  return Array.isArray(r.checksResults[0].engineOptions.packs) && !('packs' in r2.checksResults[0].engineOptions);
});
check('PN-23 profile version not among the standard versions is accepted', () => {
  const { ruleMappedStandard, wcagTags } = packApi;
  const fns = ruleMappedStandard({ standard: 'S', tag: 'ss', versions: [{ version: '1.0', wcagVersion: '2.2' }], requirements: { '1.0': { 1: { title: 'x', wcagSc: ['1.1.1'] } } }, ruleMap: { '1.0': { 'img-alt-present': { requirements: ['1'] } } } });
  const p = base({ name: 'sv', namespace: 'ss', standard: { key: 'ss', standard: 'S', versions: ['1.0'], profiles: { 'ss-9': { version: '9.9', tags: ['ss'], mappedRules: true } }, ruleTag: 'ss', ruleMapped: true, ...fns } });
  const r = quiet(() => scan({ packs: [p], profile: 'ss-9' })).r;
  return !r.skippedPacks && r.engine.profile === 'ss-9';
});
console.log(results.join('\n'));
