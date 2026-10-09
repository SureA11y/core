'use strict';
// Overrides and order: same packs in either order, override + customRules on
// the same id, override of a variant base, override of a rule that a
// variant in another pack is based on.
const { scan, quiet, base, rule, outcome, strip, report, main } = require('./lib.js');
const assert = require('assert');

const A = base({ name: 'a', namespace: 'a', rules: [rule('a-one', { runInPage: () => ({ outcome: 'fail' }) })],
  dictionaries: { en: { aOne_title: 'A one' } } });
const B = base({ name: 'b', namespace: 'b', rules: [rule('b-one')], profiles: { 'b-p': { tags: ['wcag2a'], rules: ['a-one'] } },
  rollups: [{ id: 'b-r', title: 'R', checksIds: ['a-one', 'img-alt-present'] }] });

// 1. order independence
const ab = quiet(() => scan({ packs: [A, B], profile: 'b-p' })).r;
const ba = quiet(() => scan({ packs: [B, A], profile: 'b-p' })).r;
try { assert.deepStrictEqual(strip(ab), strip(ba)); report('[A,B] vs [B,A] identical', true); }
catch (e) { report('[A,B] vs [B,A] differ', e.message.slice(0, 600)); }
report('cross-pack profile rules (b-p names a-one)', { packs: ab.engine.packs, aOne: outcome(ab, 'a-one'), rollup: (ab.rulesResults.find((r) => r.ruleId === 'b-r') || {}).outcome });
// B alone: names a-one which only exists in A
const bAlone = quiet(() => scan({ packs: [B], profile: 'b-p' }));
report('B alone (profile names a-one from A)', { skipped: bAlone.r && bAlone.r.skippedPacks, err: bAlone.error && bAlone.error.message });

// 2. override + customRules same id
const fix = base({ name: 'fix', namespace: 'fix', overrides: ['img-alt-present'],
  rules: [{ id: 'img-alt-present', runInPage: () => ({ outcome: 'pass' }) }] });
const custom = [{ id: 'img-alt-present', meta: { title: 'custom' }, runInPage: () => ({ outcome: 'cantTell' }) }];
const both = quiet(() => scan({ packs: [fix], customRules: custom }));
report('override + customRules same id', both.error ? 'THROWS ' + both.error.message : {
  outcome: outcome(both.r, 'img-alt-present'), title: both.r.checksResults.find((c) => c.ruleId === 'img-alt-present').title,
  overridden: both.r.overriddenBuiltinIds, skippedCustom: both.r.skippedCustomRules, warnings: both.warnings });

// 3. customRules adding a rule with a pack rule id
const c2 = quiet(() => scan({ packs: [A], customRules: [{ id: 'a-one', runInPage: () => ({ outcome: 'pass' }) }] }));
report('customRules with a pack rule id', c2.error ? 'THROWS ' + c2.error.message : {
  outcome: outcome(c2.r, 'a-one'), overridden: c2.r.overriddenBuiltinIds, skippedCustom: c2.r.skippedCustomRules });

// 4. override contrast-minimum while another pack has a variant from it
const ovCm = base({ name: 'ovcm', namespace: 'ovcm', overrides: ['contrast-minimum'],
  rules: [{ id: 'contrast-minimum', runInPage: () => ({ outcome: 'cantTell' }) }] });
const variant = base({ name: 'var', namespace: 'var', variants: [{ id: 'var-cm7', from: 'contrast-minimum', config: { normalTextRatio: 7, largeTextRatio: 4.5 }, meta: { title: 'v' } }] });
for (const packs of [[ovCm, variant], [variant, ovCm], [variant]]) {
  const x = quiet(() => scan({ packs }));
  report('override base + variant: ' + packs.map((p) => p.name).join(','), x.error ? 'THROWS ' + x.error.message.slice(0, 300) : {
    cm: outcome(x.r, 'contrast-minimum'), v: outcome(x.r, 'var-cm7'), err: (x.r.checksResults.find((c) => c.ruleId === 'var-cm7') || {}).error, skipped: x.r.skippedPacks });
}
// 5. variant in the same pack as the override, based on the overridden rule
const self = base({ name: 'self', namespace: 'self', overrides: ['contrast-minimum'],
  rules: [{ id: 'contrast-minimum', runInPage: () => ({ outcome: 'cantTell' }) },
    { id: 'self-v', from: 'contrast-minimum', config: { normalTextRatio: 7 } }] });
const s = quiet(() => scan({ packs: [self] }));
report('variant of own override', s.error ? 'THROWS ' + s.error.message : { cm: outcome(s.r, 'contrast-minimum'), v: outcome(s.r, 'self-v'), skipped: s.r.skippedPacks && s.r.skippedPacks.map((k) => k.reason.slice(0, 300)) });

// 6. override with meta tags removing all WCAG tags: does the default scan still run it?
const untag = base({ name: 'untag', namespace: 'untag', overrides: ['img-alt-present'],
  rules: [{ id: 'img-alt-present', meta: { tags: ['untag'] }, runInPage: () => ({ outcome: 'fail' }) }],
  profiles: { 'untag-p': { tags: [] } } });
const u = quiet(() => scan({ packs: [untag], profile: 'wcag22-aa' }));
report('override retagged with checklist ns, wcag22-aa scan', u.error ? 'THROWS ' + u.error.message : { img: outcome(u.r, 'img-alt-present'), skipped: u.r.skippedPacks && u.r.skippedPacks.map((k) => k.reason.slice(0, 300)), wcag111: (u.r.rulesResults.find((r) => r.ruleId === 'wcag-1.1.1-non-text-content') || {}).data });

// 7. runOnly naming an overridden core id
const ro = quiet(() => scan({ packs: [fix] }, { runOnly: ['img-alt-present'] }));
report('runOnly overridden id', ro.error ? 'THROWS ' + ro.error.message : { ids: ro.r.checksResults.map((c) => c.ruleId), o: outcome(ro.r, 'img-alt-present') });
// 8. legacy prefix a11ycore-<id> for a pack rule
const lp = quiet(() => scan({ packs: [A] }, { runOnly: ['a11ycore-a-one'] }));
report('runOnly a11ycore-a-one', lp.error ? 'THROWS ' + lp.error.message : lp.r.checksResults.map((c) => c.ruleId));
