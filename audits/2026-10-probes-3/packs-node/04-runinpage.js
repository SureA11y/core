'use strict';
// Pack rules whose runInPage throws, is async, or returns garbage: the
// outcome recorded for the rule and whether the rest of the scan survives.
const { scan, quiet, base, report } = require('./lib.js');
const cases = {
  throws: () => { throw new Error('rule boom'); },
  throwsString: () => { throw 'string boom'; },
  async: async () => ({ outcome: 'fail', occurrences: [] }),
  undef: () => undefined,
  nul: () => null,
  number: () => 42,
  badOutcome: () => ({ outcome: 'FAIL' }),
  outcomeWin: () => ({ outcome: 'win' }),
  failNoOcc: () => ({ outcome: 'fail' }),
  failOccNotArray: () => ({ outcome: 'fail', occurrences: 'x' }),
  failOccGarbage: () => ({ outcome: 'fail', occurrences: [null, 1, 'a', {}] }),
  passWithOcc: (ctx) => ({ outcome: 'pass', occurrences: [{ __node: ctx.document.body }] }),
  occNodeNotNode: () => ({ outcome: 'fail', occurrences: [{ __node: { tagName: 'X' } }] }),
  mutatesDom: (ctx) => { ctx.document.body.innerHTML = ''; return { outcome: 'pass' }; },
  readsCtxRuleConfig: (ctx) => ({ outcome: 'pass', occurrences: [], data: { cfg: ctx.config, rule: ctx.rule } }),
  hugeOcc: (ctx) => ({ outcome: 'fail', occurrences: Array.from({ length: 20000 }, () => ({ __node: ctx.document.body })) }),
  reportsViaHelper: (ctx) => { ctx.helpers.reportOccurrence(ctx.document.body, { summary: 's' }); return { outcome: 'fail' }; }
};
for (const [name, fn] of Object.entries(cases)) {
  const pack = base({ rules: [{ id: 'p-x', meta: { title: 'x' }, runInPage: fn }] });
  const t = Date.now();
  const { r, error, warnings } = quiet(() => scan({ packs: [pack] }));
  const ms = Date.now() - t;
  if (error) { report(name, 'SCAN THROWS: ' + error.message); continue; }
  const c = r.checksResults.find((x) => x.ruleId === 'p-x');
  report(name, {
    outcome: c && c.outcome,
    error: c && c.error,
    occ: c && Array.isArray(c.occurrences) ? c.occurrences.length : c && c.occurrences,
    firstOcc: c && c.occurrences && c.occurrences[0] && JSON.stringify(c.occurrences[0]).slice(0, 160),
    others: r.checksResults.length,
    otherFailed: r.checksResults.filter((x) => x.outcome === 'fail').map((x) => x.ruleId).slice(0, 5),
    warnings: warnings.slice(0, 2), ms
  });
}
