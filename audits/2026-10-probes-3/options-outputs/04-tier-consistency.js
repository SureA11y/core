'use strict';
// Does each reporter count the same findings as failures? Cases where the
// check outcome and an occurrence's tier disagree: the 2.2 coercion of
// duplicate-id, a policy that disallows fail, a custom rule's cantTell with a
// fail-tier occurrence, a manual rule's fail.
const h = require('./h.js');
const { main, sub } = h.load();
const sarif = sub('sarif'), junit = sub('junit'), baseline = sub('baseline'), report = sub('report'), earl = sub('earl');
function reporters(result) {
  const s = JSON.parse(sarif.renderSarifReport(result));
  const res = s.runs[0].results;
  const j = junit.renderJunitReport(result);
  const b = baseline.buildBaselineEntries(result);
  const e0 = earl.renderEarlReport(result); const e = typeof e0 === "string" ? JSON.parse(e0) : e0;
  const graph = e['@graph'] || [];
  const earlFailed = JSON.stringify(e).match(/earl:failed/g) || [];
  const html = report.renderHtmlReport(result);
  return {
    sarifError: res.filter((r) => r.level === 'error').map((r) => r.ruleId),
    sarifWarning: res.filter((r) => r.level === 'warning').map((r) => r.ruleId),
    junitFailures: (j.match(/<testsuites[^>]*failures="(\d+)"/) || [])[1],
    junitFailureRules: [...j.matchAll(/<testcase [^>]*name="([^"]+)"[^>]*>\s*<failure/g)].map((m) => m[1].slice(0, 60)),
    baselineEntries: b.map((x) => x.ruleId),
    earlFailedCount: earlFailed.length,
    htmlFailChip: (html.match(/data-outcome="fail"/g) || []).length
  };
}
const custom = (ret, meta = {}) => ({ id: 'org-x', meta: { title: 'X', ...meta }, runInPage: new Function('ctx', 'return ' + JSON.stringify(ret)) });
const cases = {
  'duplicate-id under 2.2': { html: '<div id="a"></div><div id="a"></div>', eo: {}, ro: ['duplicate-id'] },
  'duplicate-id under 2.1': { html: '<div id="a"></div><div id="a"></div>', eo: { wcagVersion: '2.1' }, ro: ['duplicate-id'] },
  'policy no fail': { html: '<img src=a.png>', eo: { policy: { allowedOutcomes: ['pass', 'cantTell', 'notApplicable'] } }, ro: ['img-alt-present'] },
  'custom cantTell + fail-tier occ': { html: '<p>x</p>', eo: { customRules: [custom({ ruleId: 'org-x', outcome: 'cantTell', occurrences: [{ selector: 'p', html: '<p>x</p>', summary: 's', occurrenceOutcome: 'fail' }] })] }, ro: ['org-x'] },
  'custom pass + fail-tier occ': { html: '<p>x</p>', eo: { customRules: [custom({ ruleId: 'org-x', outcome: 'pass', occurrences: [{ selector: 'p', html: '<p>x</p>', summary: 's', occurrenceOutcome: 'fail' }] })] }, ro: ['org-x'] },
  'custom manual fail': { html: '<p>x</p>', eo: { customRules: [custom({ ruleId: 'org-x', outcome: 'fail', occurrences: [{ selector: 'p', html: '<p>x</p>', summary: 's' }] }, { type: 'manual' })] }, ro: ['org-x'] },
  'custom fail with only cantTell-tier occ': { html: '<p>x</p>', eo: { customRules: [custom({ ruleId: 'org-x', outcome: 'fail', occurrences: [{ selector: 'p', html: '<p>x</p>', summary: 's', occurrenceOutcome: 'cantTell', uncertainty: { code: 'judgement-required' } }] })] }, ro: ['org-x'] },
  'custom notApplicable + fail occ': { html: '<p>x</p>', eo: { customRules: [custom({ ruleId: 'org-x', outcome: 'notApplicable', occurrences: [{ selector: 'p', html: '<p>x</p>', summary: 's', occurrenceOutcome: 'fail' }] })] }, ro: ['org-x'] }
};
for (const [name, c] of Object.entries(cases)) {
  const r = h.scan(c.html, { engineOptions: c.eo, runOnly: c.ro });
  if (r.error) { console.log(name, 'ERR', r.error.message); continue; }
  const chk = r.value.checksResults.find((x) => x.ruleId === c.ro[0]);
  console.log('\n## ' + name, '| outcome', chk.outcome, '| occ tiers', JSON.stringify(chk.occurrences.map((o) => o.occurrenceOutcome)), '| error', chk.error || '-');
  console.log(JSON.stringify(reporters(r.value)));
}
process.exit(0);
