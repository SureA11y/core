'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { runa11yCoreOnHtml } = require('../../helpers/runa11yCoreOnHtml');
const { assertRule } = require('../../helpers/assertRule');

const RULE_ID = 'form-control-programmatic-label-quality';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: no native controls => notApplicable`, () => {
  const html = `<!doctype html><html><body>
    <p>No inputs here</p>
  </body></html>`;

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });

  assert.ok(
    rule.data && rule.data.details && rule.data.details.metrics,
    'Expected metrics in rule-level data.details'
  );
  assert.equal(rule.data.details.metrics.applicableCount, 0);
});

test(`${RULE_ID}: native input with associated <label> => pass (not flagged)`, () => {
  const html = `<!doctype html><html><body>
    <label for="a">First name</label>
    <input id="a" type="text">
  </body></html>`;

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'pass', {
    minOccurrences: 0,
    maxOccurrences: 0
  });

  const m = rule.data.details.metrics;
  assert.equal(m.applicableCount, 1);
  assert.equal(m.flaggedCount, 0);
  assert.equal(m.byMethod.label, 1);
});

test(`${RULE_ID}: aria-label only => cantTell with label_from_aria_label_only`, () => {
  const html = `<!doctype html><html><body>
    <input id="b" type="text" aria-label="Email address">
  </body></html>`;

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });

  const o = rule.occurrences[0];
  assert.ok(hasOccurrenceForId(rule, 'b'), 'Expected an occurrence for #b');
  assert.equal(o.data.details.reasonCode, 'label_from_aria_label_only');
  assert.equal(o.data.details.labelMethod, 'aria-label');
  assert.equal(o.i18n.summaryKey, 'formControl_programmaticLabelQuality_summary_unseenName');
  assert.equal(o.i18n.hintKey, 'formControl_programmaticLabelQuality_hint_unseenName');

  const m = rule.data.details.metrics;
  assert.equal(m.applicableCount, 1);
  assert.equal(m.flaggedCount, 1);
  assert.equal(m.byMethod['aria-label'], 1);
});

test(`${RULE_ID}: aria-label on a checkbox, radio, select and range is flagged too`, () => {
  const html = `<!doctype html><html><body>
    <input id="cb" type="checkbox" aria-label="Subscribe">
    <input id="rd" type="radio" name="x" aria-label="Yes">
    <select id="sel" aria-label="Country"><option>Spain</option></select>
    <input id="rng" type="range" aria-label="Volume">
  </body></html>`;

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 4, maxOccurrences: 4 });
  for (const id of ['cb', 'rd', 'sel', 'rng']) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected an occurrence for #${id}`);
  }
});

test(`${RULE_ID}: a visible <label> wins over aria-label => pass`, () => {
  const html = `<!doctype html><html><body>
    <label for="v">Email</label><input id="v" type="text" aria-label="Email address">
  </body></html>`;

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: aria-labelledby to hidden text => cantTell with label_from_hidden_labelledby`, () => {
  for (const hiding of ['hidden', 'style="display:none"', 'style="visibility:hidden"']) {
    const html = `<!doctype html><html><body>
      <span id="l" ${hiding}>Search</span>
      <input id="h" type="text" aria-labelledby="l">
    </body></html>`;

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
    const d = rule.occurrences[0].data.details;
    assert.equal(d.reasonCode, 'label_from_hidden_labelledby', hiding);
    assert.equal(d.labelMethod, 'aria-labelledby', hiding);
  }
});

test(`${RULE_ID}: aria-labelledby to visible, clipped, or partly visible text => pass`, () => {
  const clipped = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)';
  const cases = [
    '<span id="l">Search</span><input id="t" type="text" aria-labelledby="l">',
    `<span id="l" style="${clipped}">Search</span><input id="t" type="text" aria-labelledby="l">`,
    '<span id="l" hidden>Search</span><span id="m">Site</span><input id="t" type="text" aria-labelledby="l m">'
  ];
  for (const body of cases) {
    const result = runa11yCoreOnHtml(`<!doctype html><html><body>${body}</body></html>`, {
      runOnly: [RULE_ID]
    });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a visually hidden (clipped) <label> => pass`, () => {
  const html = `<!doctype html><html><body>
    <label for="s" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Search</label>
    <input id="s" type="text">
  </body></html>`;

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: placeholder-only => cantTell with occurrence + reasonCode`, () => {
  const html = `<!doctype html><html><body>
    <input id="c" type="text" placeholder="Search">
  </body></html>`;

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });

  assert.ok(hasOccurrenceForId(rule, 'c'), 'Expected an occurrence for #c');
  assert.ok(
    rule.occurrences.some(
      (o) =>
        o &&
        o.data &&
        o.data.details &&
        o.data.details.reasonCode === 'label_from_placeholder_primary'
    ),
    'Expected reasonCode label_from_placeholder_primary'
  );

  const m = rule.data.details.metrics;
  assert.equal(m.applicableCount, 1);
  assert.equal(m.flaggedCount, 1);
  assert.equal(m.byMethod.placeholder, 1);
});

test(`${RULE_ID}: title-only => cantTell with occurrence + reasonCode`, () => {
  const html = `<!doctype html><html><body>
    <input id="d" type="text" title="Account number">
  </body></html>`;

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });

  assert.ok(hasOccurrenceForId(rule, 'd'), 'Expected an occurrence for #d');
  assert.ok(
    rule.occurrences.some(
      (o) =>
        o && o.data && o.data.details && o.data.details.reasonCode === 'label_from_title_primary'
    ),
    'Expected reasonCode label_from_title_primary'
  );

  const m = rule.data.details.metrics;
  assert.equal(m.applicableCount, 1);
  assert.equal(m.flaggedCount, 1);
  assert.equal(m.byMethod.title, 1);
});

test(`${RULE_ID}: role="presentation" but focusable => still evaluated`, () => {
  const html = `<!doctype html><html><body>
    <input id="e" type="text" role="presentation" placeholder="X">
  </body></html>`;

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });

  const m = rule.data.details.metrics;
  assert.equal(m.applicableCount, 1);
  assert.equal(m.byMethod.placeholder, 1);
});

test(`${RULE_ID}: role="presentation" and not focusable => excluded => notApplicable`, () => {
  const html = `<!doctype html><html><body>
    <input id="e" type="text" role="presentation" tabindex="-1" placeholder="X">
  </body></html>`;

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });

  const m = rule.data.details.metrics;
  assert.equal(m.applicableCount, 0);
});

test(`${RULE_ID}: deterministic output (run twice)`, () => {
  const html = `<!doctype html><html><body>
    <input id="f" type="text" placeholder="City">
  </body></html>`;

  const r1 = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule1 = assertRule(r1, RULE_ID, 'cantTell', { minOccurrences: 1 });

  const r2 = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule2 = assertRule(r2, RULE_ID, 'cantTell', { minOccurrences: 1 });

  // Compare stable fields only
  assert.deepEqual(
    {
      outcome: rule1.outcome,
      metrics: rule1.data.details.metrics,
      occ: (rule1.occurrences || []).map((o) => ({
        selector: o.selector,
        reasonCode: o.data && o.data.details && o.data.details.reasonCode,
        labelMethod: o.data && o.data.details && o.data.details.labelMethod
      }))
    },
    {
      outcome: rule2.outcome,
      metrics: rule2.data.details.metrics,
      occ: (rule2.occurrences || []).map((o) => ({
        selector: o.selector,
        reasonCode: o.data && o.data.details && o.data.details.reasonCode,
        labelMethod: o.data && o.data.details && o.data.details.labelMethod
      }))
    }
  );
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/form-control-programmatic-label-quality-manual-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'form-control-programmatic-label-quality-manual-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  // Manual rule: automatic outcomes are restricted to cantTell / notApplicable.
  // Never assert pass/fail here.
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 7, maxOccurrences: 7 });

  const expectedFailIds = [
    'fcq_case_01',
    'fcq_case_02',
    'fcq_case_03',
    'fcq_case_04',
    'fcq_case_08',
    'fcq_case_09',
    'fcq_case_15'
  ];

  const expectedNoOccIds = [
    'fcq_case_05',
    'fcq_case_06',
    'fcq_case_07',
    'fcq_case_10',
    'fcq_case_11',
    'fcq_case_12',
    'fcq_case_13',
    'fcq_case_14',
    'fcq_case_16',
    'fcq_case_17',
    'fcq_case_18'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test(`${RULE_ID}: a control with no name at all => notApplicable, since that is form-control-programmatic-label-present's finding, not a question of label quality`, () => {
  const html = `<!doctype html><html><body><input id="n" type="text"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
  assert.equal(rule.data.details.metrics.applicableCount, 0);
  assert.equal(rule.data.details.metrics.byMethod.none, 1);
});

test(`${RULE_ID}: a label under the same aria-hidden ancestor as its control still counts => pass`, () => {
  const html = `<!doctype html><html><body>
    <div aria-hidden="true"><form>
      <label for="u">User ID</label>
      <input id="u" type="text" placeholder="User ID">
    </form></div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a hidden <label> beside a shown control => the placeholder is the label`, () => {
  const html = `<!doctype html><html><body>
    <label for="h" hidden>Email</label>
    <input id="h" type="text" placeholder="Email">
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'label_from_placeholder_primary');
});
