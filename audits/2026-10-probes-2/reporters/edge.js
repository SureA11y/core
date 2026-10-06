const { validateSarif, parseXml } = require('./validate.js');
const { renderSarifReport } = require('/home/user/core/src/sarif.js');
const { renderJunitReport } = require('/home/user/core/src/junit.js');
const { renderEarlReport } = require('/home/user/core/src/earl.js');
const { renderHtmlReport } = require('/home/user/core/src/report.js');
const { buildBaselineEntries, matchBaseline } = require('/home/user/core/src/baseline.js');
const cases = {
  empty: { checksResults: [] },
  minimal: { checksResults: [{ ruleId: 'x', outcome: 'fail', occurrences: [{}] }] },
  noOcc: { checksResults: [{ ruleId: 'x', outcome: 'fail' }] },
  failNoOccs: { checksResults: [{ ruleId: 'x', outcome: 'fail', occurrences: [] , type: 'automatic'}] },
  nullOcc: { checksResults: [{ ruleId: 'x', outcome: 'fail', occurrences: [null] }] },
  numId: { checksResults: [{ ruleId: 42, outcome: 'fail', occurrences: [{ summary: 's' }] }] },
  noRuleId: { checksResults: [{ outcome: 'fail', occurrences: [{ summary: 's' }] }] },
  weirdOutcome: { checksResults: [{ ruleId: 'y', outcome: 'inapplicable', occurrences: [{ summary: 's' }] }] },
  ctrl: { url: 'https://x/\u0001', engine: { tag: '\u0000t', locale: { resolved: 'zz', requested: 'zz' } }, timestamp: 'garbage', checksResults: [{ ruleId: 'a\u0000b\ud800', outcome: 'fail', occurrences: [{ summary: '\u0007 ]]> \ud800', html: '<a\u0000>', selector: '￿' }] }] },
};
for (const [name, r] of Object.entries(cases)) {
  const res = [];
  for (const [rn, fn] of Object.entries({
    sarif: () => { const s = JSON.parse(renderSarifReport(r)); if (!validateSarif(s)) return 'INVALID ' + JSON.stringify(validateSarif.errors.map(e => e.dataPath + ' ' + e.message)).slice(0, 300); return 'ok ' + s.runs[0].results.length; },
    junit: () => { const j = renderJunitReport(r); parseXml(j); const m = j.match(/<testsuites[^>]*>/)[0]; return 'ok ' + m; },
    earl: () => JSON.stringify(renderEarlReport(r)).length,
    html: () => renderHtmlReport(r).length,
    baseline: () => JSON.stringify(matchBaseline(r, buildBaselineEntries(r))),
  })) {
    try { res.push(rn + ': ' + fn()); } catch (e) { res.push(rn + ': THROW ' + e.message.slice(0, 200)); }
  }
  console.log('==', name); console.log('  ' + res.join('\n  '));
}
