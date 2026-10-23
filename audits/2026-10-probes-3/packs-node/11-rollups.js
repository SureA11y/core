'use strict';
// Checklist rollup outcomes: fail dominates, cantTell, notApplicable, and
// members that do not run under the profile.
const { scan, quiet, base, rule, rollup, report } = require('./lib.js');
const R = (id, outcome) => rule(id, { meta: { tags: [process.env.TAG || 'wcag2a'] }, runInPage: (ctx) => (outcome === 'fail' || outcome === 'cantTell')
  ? { outcome, occurrences: [{ __node: ctx.document.body }] } : { outcome } });
const pack = base({ name: 'roll', namespace: 'roll', title: 'Roll',
  rules: [R('roll-f', 'fail'), R('roll-c', 'cantTell'), R('roll-p', 'pass'), R('roll-n', 'notApplicable'), R('roll-n2', 'notApplicable')],
  profiles: {
    'roll-all': { tags: [] },
    'roll-narrow': { tags: [], rules: [], exclude: { rules: ['roll-f'] } }
  },
  rollups: [
    { id: 'roll-fc', title: 'f+c', checksIds: ['roll-f', 'roll-c', 'roll-p'] },
    { id: 'roll-cp', title: 'c+p', checksIds: ['roll-c', 'roll-p'] },
    { id: 'roll-pn', title: 'p+n', checksIds: ['roll-p', 'roll-n'] },
    { id: 'roll-nn', title: 'n+n', checksIds: ['roll-n', 'roll-n2'] },
    { id: 'roll-fonly', title: 'f only', checksIds: ['roll-f'] },
    { id: 'roll-core-not-selected', title: 'core region (not in profile tags)', checksIds: ['region'] },
    { id: 'roll-dup', title: 'dup member', checksIds: ['roll-f', 'roll-f'] }
  ] });
for (const profile of ['roll-all', 'roll-narrow']) {
  const { r, error, warnings } = quiet(() => scan({ packs: [pack], profile }));
  if (error) { report(profile, 'THROWS ' + error.message); continue; }
  report(profile, {
    profile: r.engine.profile,
    skipped: r.skippedPacks,
    ran: r.checksResults.map((c) => `${c.ruleId}:${c.outcome}`),
    rollups: r.rulesResults.filter((x) => x.ruleId.startsWith('roll-')).map((x) => `${x.ruleId}:${x.outcome} [${x.data.details.reasonCode}; missing=${x.data.details.metrics.missingCount}]`),
    standards: r.standards,
    warnings
  });
}
