'use strict';
// Catalog functions and selection with a checklist pack: rollup lookup,
// runOnly by namespace tag, optInRules, rule ids that look like tags.
const { scan, quiet, base, rule, report, main } = require('./lib.js');
const pack = base({ name: 'cl', namespace: 'cl', title: 'CL',
  rules: [rule('cl-own', { meta: { tags: ['cl'] }, runInPage: () => ({ outcome: 'fail' }) }), rule('cl-always', { meta: { tags: ['links'] } })],
  profiles: { 'cl-p': { tags: ['wcag2a'] } },
  rollups: [{ id: 'cl-r', title: 'R', checksIds: ['cl-own', 'img-alt-present'] }] });
const ids = (r) => r.checksResults.map((c) => c.ruleId).filter((id) => id.startsWith('cl-'));
const q = (label, fn) => { const x = quiet(fn); report(label, x.error ? 'THROWS ' + x.error.message.slice(0, 200) : x.r); };
q('default scan: pack rules run', () => ids(scan({ packs: [pack] })));
q('optInRules [cl]', () => ids(scan({ packs: [pack], optInRules: ['cl'] })));
q('runOnly tags [cl]', () => ids(scan({ packs: [pack] }, { runOnly: { tags: ['cl'] } })));
q('runOnly [cl-r] (rollup id)', () => { const r = scan({ packs: [pack] }, { runOnly: ['cl-r'] }); return { checks: r.checksResults.map((c) => c.ruleId), rollups: r.rulesResults.map((x) => x.ruleId) }; });
q('getCompositeRuleById(cl-r)', () => { const c = main.getCompositeRuleById('cl-r', { packs: [pack] }); return c && { id: c.ruleId || c.id, checksIds: c.checksIds }; });
q('getCheckDefById(cl-own) without packs', () => main.getCheckDefById('cl-own'));
q('getChecksForRunOnly([cl-own])', () => main.getChecksForRunOnly(['cl-own'], { packs: [pack] }).map((d) => d.ruleId || d));
q('getRulesCatalog has cl-r?', () => main.getRulesCatalog({ packs: [pack] }).some((r) => (r.ruleId || r.id) === 'cl-r'));
q('profile cl-p checks', () => ids(scan({ packs: [pack], profile: 'cl-p' })));
q('profile cl-p, runOnly [img-alt-present]', () => scan({ packs: [pack], profile: 'cl-p' }, { runOnly: ['img-alt-present'] }).rulesResults.map((x) => `${x.ruleId}:${x.outcome}`));
