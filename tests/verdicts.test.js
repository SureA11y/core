'use strict';

// engineOptions.verdicts: a finding's verdict under another standard, beside
// its WCAG one (docs/OUTPUT_SCHEMA.md, "Verdicts"). Off by default, it never
// changes a WCAG outcome; on, it states what the rules' meta.verdicts say.

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');
const { getChecksCatalog } = require('../src/index.js');
const { normalizeRuleMeta } = require('../src/core/rule-meta.js');
const { renderSarifReport } = require('../src/sarif.js');
const { renderJunitReport } = require('../src/junit.js');
const { renderEarlReport } = require('../src/earl.js');
const { renderHtmlReport } = require('../src/report.js');
const findingIds = require('../scripts/data/finding-ids.json');

const page = (body) =>
  `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;
const ARIA = { verdicts: ['wai-aria'] };
const GRID =
  '<h2>Orders</h2><div role="grid" id="orders"><div role="row"><div role="gridcell">Order 123</div></div></div>';
const check = (result, ruleId) => result.checksResults.find((c) => c.ruleId === ruleId);
const rollup = (result, ruleId) => result.rulesResults.find((r) => r.ruleId === ruleId);

test('verdicts are off by default: no verdicts field, no WAI-ARIA rollup, no engine.verdicts', () => {
  const r = runa11yCoreOnHtml(page(GRID));
  assert.equal(r.engine.verdicts, undefined);
  for (const c of r.checksResults) {
    assert.equal(c.verdicts, undefined, c.ruleId);
    for (const o of c.occurrences || []) assert.equal(o.verdicts, undefined, c.ruleId);
  }
  assert.ok(!r.rulesResults.some((x) => x.ruleId.startsWith('wai-aria-')));
});

test('an unnamed grid: WCAG cantTell, WAI-ARIA fail, on the finding, the rule and its rollup', () => {
  const r = runa11yCoreOnHtml(page(GRID), { engineOptions: ARIA });
  assert.deepEqual(r.engine.verdicts, ['wai-aria']);
  const c = check(r, 'aria-role-name-present');
  assert.equal(c.outcome, 'cantTell');
  assert.deepEqual(c.verdicts, { wcag: 'cantTell', 'wai-aria': 'fail' });
  assert.deepEqual(c.occurrences[0].verdicts, { wcag: 'cantTell', 'wai-aria': 'fail' });
  assert.equal(rollup(r, 'wcag-4.1.2-name').outcome, 'cantTell');
  const aria = rollup(r, 'wai-aria-name-required');
  assert.equal(aria.outcome, 'fail');
  assert.equal(aria.meta.standard, 'WAI-ARIA');
  assert.ok(
    aria.data.details.contributors.some(
      (x) => x.testId === 'aria-role-name-present' && x.outcome === 'fail'
    )
  );
  // The rule names the WAI-ARIA requirement it checks, and the result lists
  // the standard its rollups name.
  assert.ok(
    c.meta.normativeMappings.some(
      (m) => m.standard === 'WAI-ARIA' && m.requirement === 'name-required'
    )
  );
  assert.ok(r.standards.some((s) => s.key === 'wai-aria' && s.standard === 'WAI-ARIA'));
});

test('a finding that fails both keeps fail under both', () => {
  const r = runa11yCoreOnHtml(
    page('<div role="checkbox" tabindex="0" aria-label="Subscribe">Subscribe</div>'),
    { engineOptions: ARIA }
  );
  const c = check(r, 'aria-required-attr');
  assert.deepEqual(c.verdicts, { wcag: 'fail', 'wai-aria': 'fail' });
  assert.equal(rollup(r, 'wai-aria-required-states').outcome, 'fail');
});

test('turning verdicts on changes no WCAG outcome, rule or rollup', () => {
  const html = page(
    GRID +
      '<button aria-valuenow="1">Save</button><div role="list"><div>a</div></div>' +
      '<div role="listitem">b</div><div role="widget">c</div><span role="presentation" aria-label="x">t</span>' +
      '<div role="checkbox" tabindex="0">d</div><div role="dialog"></div><img src="a.png">'
  );
  const off = runa11yCoreOnHtml(html);
  const on = runa11yCoreOnHtml(html, { engineOptions: ARIA });
  const outcomes = (r) =>
    r.checksResults.map((c) => [
      c.ruleId,
      c.outcome,
      (c.occurrences || []).map((o) => o.occurrenceOutcome || null)
    ]);
  assert.deepEqual(outcomes(on), outcomes(off));
  const wcag = (r) =>
    r.rulesResults.filter((x) => x.ruleId.startsWith('wcag-')).map((x) => [x.ruleId, x.outcome]);
  assert.deepEqual(wcag(on), wcag(off));
});

test('a named grid passes under both, and a page with none is notApplicable under both', () => {
  const named = runa11yCoreOnHtml(page('<div role="grid" aria-label="Orders"></div>'), {
    engineOptions: ARIA
  });
  assert.deepEqual(check(named, 'aria-role-name-present').verdicts, {
    wcag: 'pass',
    'wai-aria': 'pass'
  });
  assert.equal(rollup(named, 'wai-aria-name-required').outcome, 'pass');
  const none = runa11yCoreOnHtml(page('<p>Text</p>'), { engineOptions: ARIA });
  assert.deepEqual(check(none, 'aria-role-name-present').verdicts, {
    wcag: 'notApplicable',
    'wai-aria': 'notApplicable'
  });
});

test('a rule mapped to no WCAG criterion has a notApplicable WCAG verdict', () => {
  const r = runa11yCoreOnHtml(page('<div role="region">Orders</div>'), {
    engineOptions: ARIA
  });
  const c = check(r, 'landmark-role-name-present');
  assert.equal(c.verdicts.wcag, 'notApplicable');
  assert.equal(c.verdicts['wai-aria'], 'fail');
});

test('a standard the engine has no verdicts for is ignored, with a warning', () => {
  const warnings = [];
  const warn = console.warn;
  console.warn = (m) => warnings.push(String(m));
  try {
    const r = runa11yCoreOnHtml(page(GRID), { engineOptions: { verdicts: ['wai-aria', 'nope'] } });
    assert.deepEqual(r.engine.verdicts, ['wai-aria']);
  } finally {
    console.warn = warn;
  }
  assert.ok(warnings.some((w) => w.includes('engineOptions.verdicts') && w.includes('"nope"')));
});

test("every rule's verdicts name reason codes it gives, and a requirement with a rollup", () => {
  const withVerdicts = getChecksCatalog().filter((d) => d.verdicts);
  assert.ok(withVerdicts.length >= 29, String(withVerdicts.length));
  const r = runa11yCoreOnHtml(page('<p>Text</p>'), { engineOptions: ARIA });
  for (const def of withVerdicts) {
    const table = def.verdicts['wai-aria'];
    assert.ok(table, def.ruleId);
    for (const [code, entry] of Object.entries(table)) {
      assert.ok(findingIds.reasonCodes[def.ruleId].includes(code), `${def.ruleId} ${code}`);
      const aria = rollup(r, `wai-aria-${entry.requirement}`);
      assert.ok(aria, `${def.ruleId} ${code}: no rollup for ${entry.requirement}`);
      assert.ok(
        aria.data.details.contributors.some((x) => x.testId === def.ruleId),
        `${def.ruleId} is not a contributor of ${aria.ruleId}`
      );
    }
  }
});

test('meta.verdicts is checked when a rule is loaded', () => {
  const meta = (verdicts) => ({ title: 'x', verdicts });
  assert.throws(
    () => normalizeRuleMeta('r', 'r', meta({ 'wai-aria': { A: 'pass' } }), 'a11ycore'),
    /must be fail or cantTell/
  );
  assert.throws(
    () => normalizeRuleMeta('r', 'r', meta({ wcag: { A: 'fail' } }), 'a11ycore'),
    /names no standard/
  );
  assert.deepEqual(
    normalizeRuleMeta('r', 'r', meta({ 'WAI-ARIA': { A: 'fail' } }), 'a11ycore').verdicts,
    { 'wai-aria': { A: { outcome: 'fail' } } }
  );
  assert.equal(normalizeRuleMeta('r', 'r', meta(undefined), 'a11ycore').verdicts, null);
});

test('SARIF carries the verdicts, and failOnVerdicts raises a WAI-ARIA failure to error', () => {
  const r = runa11yCoreOnHtml(page(GRID), { engineOptions: ARIA });
  const levelOf = (options) =>
    JSON.parse(renderSarifReport(r, options)).runs[0].results.find(
      (x) => x.ruleId === 'aria-role-name-present'
    );
  const plain = levelOf({});
  assert.equal(plain.level, 'warning');
  assert.deepEqual(plain.properties.verdicts, { wcag: 'cantTell', 'wai-aria': 'fail' });
  assert.equal(levelOf({ failOnVerdicts: ['wai-aria'] }).level, 'error');
  assert.equal(levelOf({ failOnVerdicts: 'wai-aria' }).level, 'error');
  assert.throws(() => renderSarifReport(r, { failOnVerdicts: 5 }), /failOnVerdicts/);
});

test('JUnit gates on a WAI-ARIA failure only with failOnVerdicts', () => {
  const r = runa11yCoreOnHtml(page(GRID), {
    runOnly: ['aria-role-name-present'],
    engineOptions: ARIA
  });
  assert.match(renderJunitReport(r), /failures="0"/);
  const gated = renderJunitReport(r, { failOnVerdicts: ['wai-aria'] });
  assert.match(gated, /<failure type="verdict" message="1 occurrence fails wai-aria/);
  assert.throws(() => renderJunitReport(r, { failOnVerdicts: {} }), /failOnVerdicts/);
});

test('EARL asserts the WAI-ARIA verdict apart, as part of the requirement it checks', () => {
  const r = runa11yCoreOnHtml(page(GRID), { engineOptions: ARIA });
  const assertions = renderEarlReport(r)['@graph'][0].assertions;
  const wcag = assertions.find((a) => a.test.title === 'aria-role-name-present');
  const aria = assertions.find((a) => a.test.title === 'aria-role-name-present (WAI-ARIA)');
  assert.equal(wcag.result.outcome, 'earl:cantTell');
  assert.equal(aria.result.outcome, 'earl:failed');
  assert.deepEqual(aria.test.isPartOf, ['https://www.w3.org/TR/wai-aria-1.2/#namecalculation']);
  // Off, there is no such assertion.
  const off = renderEarlReport(runa11yCoreOnHtml(page(GRID)))['@graph'][0].assertions;
  assert.ok(!off.some((a) => a.test.title.endsWith('(WAI-ARIA)')));
});

test('the HTML report shows the WAI-ARIA verdict on the card, and no notice about standards', () => {
  const html = renderHtmlReport(runa11yCoreOnHtml(page(GRID), { engineOptions: ARIA }));
  assert.match(html, /WAI-ARIA: Fail/);
  assert.ok(!html.includes('list of standards is missing or could not be read'));
});
