'use strict';
const L = require('./lib.js');
const fs = require('fs');
const corpus = JSON.parse(fs.readFileSync(__dirname + '/out/corpus.json', 'utf8'));
const issues = {};
const note = (k, v) => { (issues[k] = issues[k] || []).push(v); };
const tier = (c, o) => (o && (o.occurrenceOutcome === 'fail' || o.occurrenceOutcome === 'cantTell')) ? o.occurrenceOutcome : (c.outcome === 'fail' || c.outcome === 'cantTell' ? c.outcome : null);
let n = 0;
for (const [name, r0] of Object.entries(corpus)) {
  n++;
  const r = JSON.parse(JSON.stringify(r0));
  const checks = r.checksResults;
  const failRules = new Set(checks.filter(c => c.outcome === 'fail').map(c => c.ruleId));
  const ctRules = new Set(checks.filter(c => c.outcome === 'cantTell').map(c => c.ruleId));
  let failOcc = 0, ctOcc = 0;
  for (const c of checks) if (c.outcome === 'fail' || c.outcome === 'cantTell') for (const o of c.occurrences || []) { const t = tier(c, o); if (t === 'fail') failOcc++; else if (t === 'cantTell') ctOcc++; }
  // SARIF
  let sarif;
  try { sarif = L.renderSarifReport(r); } catch (e) { note('sarif-throw', name + ' ' + e.message); continue; }
  const errs = L.sarifErrors(sarif); if (errs.length) note('sarif-invalid', name + ' ' + errs.slice(0, 3).join('; '));
  const run = JSON.parse(sarif).runs[0];
  const sErr = run.results.filter(x => x.level === 'error'), sWarn = run.results.filter(x => x.level === 'warning');
  if (sErr.length !== failOcc) note('sarif-failcount', `${name} sarif=${sErr.length} occ=${failOcc}`);
  if (sWarn.length !== ctOcc) note('sarif-ctcount', `${name} sarif=${sWarn.length} occ=${ctOcc}`);
  const sFailRules = new Set(sErr.map(x => x.ruleId));
  for (const id of failRules) if (!sFailRules.has(id)) note('sarif-failrule-missing', name + ' ' + id);
  for (const id of sFailRules) if (!failRules.has(id)) note('sarif-error-not-fail-rule', name + ' ' + id);
  const notes = ((run.invocations || [])[0] || {}).toolExecutionNotifications || [];
  for (const nn of notes) if (nn.level === 'note') { const c = checks.find(c => c.ruleId === nn.associatedRule.id); if (c && c.outcome !== 'notApplicable') note('sarif-note-on-' + c.outcome, name + ' ' + c.ruleId + ': ' + nn.message.text.slice(0, 100)); }
  // JUnit
  let xml, doc;
  try { xml = L.renderJunitReport(r); doc = L.parseXml(xml); } catch (e) { note('junit', name + ' ' + e.message); continue; }
  const root = doc.documentElement;
  const suites = [...doc.getElementsByTagName('testsuite')];
  const sum = (a) => suites.reduce((s, x) => s + Number(x.getAttribute(a)), 0);
  for (const a of ['tests', 'failures', 'errors', 'skipped']) if (sum(a) !== Number(root.getAttribute(a))) note('junit-total', `${name} ${a}`);
  for (const s of suites) {
    const tcs = [...s.getElementsByTagName('testcase')];
    if (tcs.length !== Number(s.getAttribute('tests'))) note('junit-suite-tests', name + ' ' + s.getAttribute('name'));
    if (tcs.filter(t => t.getElementsByTagName('failure').length).length !== Number(s.getAttribute('failures'))) note('junit-suite-failures', name);
  }
  const jFail = new Set([...doc.getElementsByTagName('failure')].filter(f => f.getAttribute('type') === 'fail').map(f => f.parentNode.getAttribute('name')));
  for (const id of failRules) if (!jFail.has(id)) note('junit-failrule-missing', name + ' ' + id);
  for (const id of jFail) if (!failRules.has(id)) note('junit-fail-not-fail-rule', name + ' ' + id);
  // suites vs rulesResults criteria
  const rollupSc = new Set(r.rulesResults.filter(x => !(x.meta && x.meta.standard && x.meta.standard !== 'WCAG')).map(x => ((x.meta.normativeMappings || []).find(m => !m.type && (!m.standard || m.standard === 'WCAG')) || {}).requirement));
  const suiteSc = suites.map(s => [...s.getElementsByTagName('property')].find(p => p.getAttribute('name') === 'wcagCriterion')).filter(Boolean).map(p => p.getAttribute('value'));
  const lvl = suites.map(s => { const p = [...s.getElementsByTagName('property')].find(p => p.getAttribute('name') === 'wcagLevel'); return p && p.getAttribute('value'); });
  if (r.engine.wcagLevel) for (const [i, sc] of suiteSc.entries()) if (!rollupSc.has(sc)) note('junit-suite-not-in-rollups(wcagLevel)', `${name} ${sc}`);
  // criterionOutcome vs rollup
  // EARL
  let earl; try { earl = L.renderEarlReport(r); } catch (e) { note('earl-throw', name + ' ' + e.message); continue; }
  const asserts = earl['@graph'].flatMap(g => g.assertions);
  const eFail = new Set(asserts.filter(a => a.result.outcome === 'earl:failed').map(a => a.test.title));
  if ([...failRules].sort().join() !== [...eFail].sort().join()) note('earl-fail-mismatch', name);
  if (asserts.length !== checks.length) note('earl-count', `${name} ${asserts.length} vs ${checks.length}`);
  for (const a of asserts) for (const p of a.test.isPartOf || []) if (!/^WCAG2:[a-z0-9-]+$/.test(p)) note('earl-ispartof-bad', name + ' ' + a.test.title + ' ' + p);
  if (name.startsWith('de:') || name.startsWith('fr:') || name.startsWith('es:') || name.startsWith('ja:')) {
    const en = corpus['full:' + name.split(':')[1]];
    if (en) { const ee = L.renderEarlReport(JSON.parse(JSON.stringify(en)))['@graph'].flatMap(g => g.assertions); const m = new Map(ee.map(a => [a.test.title, JSON.stringify(a.test.isPartOf)])); for (const a of asserts) if (m.has(a.test.title) && m.get(a.test.title) !== JSON.stringify(a.test.isPartOf)) { note('earl-ispartof-locale', `${name} ${a.test.title} ${JSON.stringify(a.test.isPartOf)} vs en ${m.get(a.test.title)}`); break; } }
  }
  // HTML
  let html; try { html = L.renderHtmlReport(r); } catch (e) { note('html-throw', name + ' ' + e.message); continue; }
  const dataM = html.match(/<script type="application\/json" id="report-data">([\s\S]*?)<\/script>/);
  const rows = JSON.parse(dataM[1]);
  if (rows.filter(x => x.outcome === 'fail').length !== failOcc) note('html-failocc', name);
  // Baseline
  const entries = L.B.buildBaselineEntries(r);
  if (entries.length !== failOcc) note('baseline-count', `${name} ${entries.length} vs ${failOcc}`);
  const m = L.B.matchBaseline(r, entries);
  if (m.newCount !== 0 || m.staleCount !== 0) note('baseline-roundtrip', name + JSON.stringify({ n: m.newCount, s: m.staleCount }));
  const s2 = JSON.parse(L.renderSarifReport(r, { baselineEntries: entries })).runs[0].results.filter(x => x.level === 'error').length;
  if (s2) note('sarif-baseline-left', name + ' ' + s2);
  const j2 = L.parseXml(L.renderJunitReport(r, { baselineEntries: { version: 1, entries } }));
  if (Number(j2.documentElement.getAttribute('failures'))) note('junit-baseline-left', name);
  // cantTellAs failure
  const jf = L.parseXml(L.renderJunitReport(r, { cantTellAs: 'FAILURE' }));
  if (ctRules.size && Number(jf.documentElement.getAttribute('failures')) <= Number(root.getAttribute('failures'))) note('junit-cantTellAs-noop', name);
}
console.log('checked', n);
for (const [k, v] of Object.entries(issues)) { console.log('##', k, v.length); for (const x of v.slice(0, 6)) console.log('   ', x); }
