// Every reporter on results holding the new rules, hook data, margins, shadow hosts and hostile strings, in five locales.
'use strict';
const fs = require('fs');
const Ajv = require('/home/user/core/node_modules/ajv');
let addFormats; try { addFormats = require('/home/user/core/node_modules/ajv-formats'); } catch {}
const { JSDOM } = require('/home/user/core/node_modules/jsdom');
const { renderSarifReport } = require('/home/user/core/src/sarif.js');
const { renderJunitReport } = require('/home/user/core/src/junit.js');
const { renderEarlReport } = require('/home/user/core/src/earl.js');
const { renderHtmlReport } = require('/home/user/core/src/report.js');
const { buildBaselineEntries, matchBaseline } = require('/home/user/core/src/baseline.js');
const S = process.env.AUDIT_SCRATCH || '/tmp/surea11y-audit';
const schema = JSON.parse(fs.readFileSync('/home/user/core/tests/schemas/sarif-schema-2.1.0.json', 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: false, validateSchema: false });
if (addFormats) addFormats(ajv);
const validate = ajv.compile(schema);
const bad = (s) => { const m = String(s).match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/); return m ? JSON.stringify(m[0]) + '@' + m.index : null; };
const files = fs.readdirSync(S).filter((f) => f.endsWith('.json'));
const issues = new Map();
const note = (k, v) => { if (!issues.has(k)) issues.set(k, v); };
for (const f of files) {
  const r = JSON.parse(fs.readFileSync(S + f));
  // SARIF
  try {
    const s = renderSarifReport(r); const j = JSON.parse(s);
    if (!validate(j)) note('SARIF schema ' + f, JSON.stringify(validate.errors.slice(0, 3)).slice(0, 400));
    const rules = new Set(j.runs[0].tool.driver.rules.map((x) => x.id));
    for (const res of j.runs[0].results) {
      if (!rules.has(res.ruleId)) note('SARIF result ruleId not in driver.rules ' + f, res.ruleId);
      if (res.ruleIndex != null && j.runs[0].tool.driver.rules[res.ruleIndex].id !== res.ruleId) note('SARIF ruleIndex mismatch ' + f, res.ruleId);
      if (!res.message || !res.message.text) note('SARIF empty message ' + f, res.ruleId);
    }
    const lb = bad(s); if (lb) note('SARIF control/lone surrogate char ' + f, lb);
  } catch (e) { note('SARIF throw ' + f, e.message); }
  // JUnit
  try {
    const x = renderJunitReport(r);
    const lb = bad(x); if (lb) note('JUNIT invalid XML char ' + f, lb + ' ' + JSON.stringify(x.slice(Math.max(0, x.search(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/) - 40), x.search(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/) + 10)));
    const doc = new new JSDOM('').window.DOMParser().parseFromString(x, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) note('JUNIT not well-formed ' + f, doc.getElementsByTagName('parsererror')[0].textContent.slice(0, 200));
    const tc = doc.getElementsByTagName('testcase').length;
    const declared = [...doc.getElementsByTagName('testsuite')].reduce((a, s) => a + Number(s.getAttribute('tests')), 0);
    if (tc !== declared) note('JUNIT tests attr vs testcases ' + f, tc + ' vs ' + declared);
    const failDeclared = [...doc.getElementsByTagName('testsuite')].reduce((a, s) => a + Number(s.getAttribute('failures')), 0);
    const failEls = [...doc.getElementsByTagName('testcase')].filter((t) => t.getElementsByTagName('failure').length).length;
    if (failDeclared !== failEls) note('JUNIT failures attr vs failure elements ' + f, failDeclared + ' vs ' + failEls);
  } catch (e) { note('JUNIT throw ' + f, e.message); }
  // EARL
  try {
    const e0 = renderEarlReport(r); const e = typeof e0 === 'string' ? JSON.parse(e0) : e0;
    const lb = bad(JSON.stringify(e)); if (lb) note('EARL bad char ' + f, lb);
    const graph = e['@graph'] || [];
    const asserts = graph.flatMap((g) => g.assertions || []);
    const map = { fail: 'earl:failed', pass: 'earl:passed', cantTell: 'earl:cantTell', notApplicable: 'earl:inapplicable' };
    for (const c of r.checksResults) {
      const a = asserts.find((x) => x.test && x.test.title === c.ruleId);
      if (!a) { note('EARL rule missing ' + f, c.ruleId); continue; }
      if (a.result.outcome !== map[c.outcome]) note('EARL outcome differs ' + f, c.ruleId + ' ' + c.outcome + ' -> ' + a.result.outcome);
    }
    if (!asserts.length) note('EARL no assertions ' + f, Object.keys(e).join(','));
  } catch (e) { note('EARL throw ' + f, e.message); }
  // HTML
  try {
    const h = renderHtmlReport(r);
    if (/<script>alert/i.test(h)) note('HTML unescaped script ' + f, '');
    if (/\{\{/.test(h.replace(/<script[\s\S]*?<\/script>/g, ''))) note('HTML placeholder ' + f, h.match(/.{40}\{\{.{40}/)[0]);
    fs.writeFileSync(S + f.replace('.json', '.html'), h);
  } catch (e) { note('HTML throw ' + f, e.message); }
  // Baseline round trip: a result matched against its own baseline leaves nothing new
  try {
    const entries = buildBaselineEntries(r);
    const m = matchBaseline(r, entries);
    const fresh = (m.new || m.newFindings || m.unmatched || []);
    if (fresh.length) note('BASELINE self-match leaves new ' + f, fresh.length + ' ' + JSON.stringify(fresh[0]).slice(0, 200));
  } catch (e) { note('BASELINE throw ' + f, e.message); }
}
for (const [k, v] of issues) console.log(k, '::', v);
console.log('files', files.length, 'issues', issues.size);
