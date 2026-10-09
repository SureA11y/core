'use strict';
// A compact result (output.detail 'findings') of a pack scan, rendered in a
// process without the pack: the reporters read a pass/notApplicable back from
// core's catalog, which has no pack rule. Compared with the full result of
// the same scan (10a).
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const { renderSarifReport } = require(path.join(ROOT, 'src/sarif.js'));
const { renderJunitReport } = require(path.join(ROOT, 'src/junit.js'));
const { renderEarlReport } = require(path.join(ROOT, 'src/earl.js'));
const { expandCompactResult } = require(path.join(ROOT, 'src/scan-result.js'));
const load = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, 'out', f), 'utf8'));
for (const [full, compact] of [['10-sample.json', '10-sample-compact.json'], ['10-sample.json', '10-sample-compact-fr.json']]) {
  const F = load(full);
  const C = load(compact);
  const packRules = F.checksResults.filter((c) => /^sample-/.test(c.ruleId) && !(c.occurrences || []).length).map((c) => c.ruleId);
  const view = (r) => {
    const e = expandCompactResult(r);
    const sarif = JSON.parse(renderSarifReport(r)).runs[0].tool.driver.rules;
    return Object.fromEntries(packRules.map((id) => {
      const c = e.checksResults.find((x) => x.ruleId === id);
      const s = sarif.find((x) => x.id === id);
      return [id, { outcome: c.outcome, title: c.title, mappings: ((c.meta && c.meta.normativeMappings) || []).map((m) => `${m.standard}:${m.requirement}`).join(' '), sarif: s ? `${s.shortDescription.text} [${s.properties.tags.join(',')}]` : 'not in SARIF' }];
    }));
  };
  const junitCount = (r) => (renderJunitReport(r).match(/<testcase /g) || []).length;
  const earl = (r) => JSON.stringify(renderEarlReport(r)['@graph'][0].assertions.filter((a) => /^sample-/.test(a.test.title)));
  console.log(`--- ${compact} vs ${full}`);
  console.log(JSON.stringify({ full: view(F), compact: view(C), junitTestcases: { full: junitCount(F), compact: junitCount(C) }, earlSameForPackRules: earl(F) === earl(C) }, null, 1));
}

// Core rules of the same compact result: the profile is the pack's, which
// core's catalog doesn't know.
{
  const warns = [];
  const w = console.warn;
  console.warn = (...a) => warns.push(a.join(' ').slice(0, 200));
  let diff = [];
  try {
    const F = load('10-sample.json');
    const E = expandCompactResult(load('10-sample-compact.json'));
    for (const c of F.checksResults) {
      if (/^sample-/.test(c.ruleId)) continue;
      const e = E.checksResults.find((x) => x.ruleId === c.ruleId);
      const m = (x) => ((x.meta && x.meta.normativeMappings) || []).filter((y) => y.standard && y.standard !== 'WCAG').map((y) => `${y.standard}:${y.requirement}`).join(' ');
      if (m(c) !== m(e)) diff.push(`${c.ruleId} (${c.outcome}): full "${m(c)}" | compact "${m(e)}"`);
    }
  } catch (e) {
    diff = ['throws: ' + e.message];
  } finally {
    console.warn = w;
  }
  console.log('--- core rules, compact vs full, other-standard mappings\n' + JSON.stringify({ diff, warns: warns.slice(0, 3), warnCount: warns.length }, null, 1));
}
