'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { runa11yCoreOnHtml } = require('../../helpers/runa11yCoreOnHtml');
const { assertRule } = require('../../helpers/assertRule');

const RULE_ID = 'form-control-programmatic-label-quality';

function hasOccurrenceForId(rule, id) {
    return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: no native controls => notApplicable`, () => {
    const html = `<!doctype html><html><body>
    <p>No inputs here</p>
  </body></html>`;

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });

    assert.ok(rule.data && rule.data.details && rule.data.details.metrics, 'Expected metrics in rule-level data.details');
    assert.equal(rule.data.details.metrics.applicableCount, 0);
});

test(`${RULE_ID}: native input with associated <label> => notApplicable (not flagged)`, () => {
    const html = `<!doctype html><html><body>
    <label for="a">First name</label>
    <input id="a" type="text">
  </body></html>`;

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    // Manual rules may only emit cantTell/notApplicable, never pass.
    const rule = assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });

    const m = rule.data.details.metrics;
    assert.equal(m.applicableCount, 1);
    assert.equal(m.flaggedCount, 0);
    assert.equal(m.byMethod.label, 1);
});

test(`${RULE_ID}: native input with aria-label => notApplicable (not flagged)`, () => {
    const html = `<!doctype html><html><body>
    <input id="b" type="text" aria-label="Email address">
  </body></html>`;

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    // Manual rules may only emit cantTell/notApplicable, never pass.
    const rule = assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });

    const m = rule.data.details.metrics;
    assert.equal(m.applicableCount, 1);
    assert.equal(m.flaggedCount, 0);
    assert.equal(m.byMethod['aria-label'], 1);
});

test(`${RULE_ID}: placeholder-only => cantTell with occurrence + reasonCode`, () => {
    const html = `<!doctype html><html><body>
    <input id="c" type="text" placeholder="Search">
  </body></html>`;

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });

    assert.ok(hasOccurrenceForId(rule, 'c'), 'Expected an occurrence for #c');
    assert.ok(rule.occurrences.some((o) =>
        o &&
        o.data &&
        o.data.details &&
        o.data.details.reasonCode === 'label_from_placeholder_primary'
    ), 'Expected reasonCode label_from_placeholder_primary');

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
    assert.ok(rule.occurrences.some((o) =>
        o &&
        o.data &&
        o.data.details &&
        o.data.details.reasonCode === 'label_from_title_primary'
    ), 'Expected reasonCode label_from_title_primary');

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
    const rule = assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });

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
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'form-control-programmatic-label-quality-manual-all-scenarios.html');
  const html = fs.readFileSync(fixturePath, 'utf8');

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  // Manual rule: automatic outcomes are restricted to cantTell / notApplicable.
  // Never assert pass/fail here.
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 5, maxOccurrences: 5 });

  const expectedFailIds = [
    'fcq_case_01', 'fcq_case_02', 'fcq_case_03', 'fcq_case_04', 'fcq_case_09'
  ];

  const expectedNoOccIds = [
    'fcq_case_05', 'fcq_case_06', 'fcq_case_07', 'fcq_case_08', 'fcq_case_10', 'fcq_case_11', 'fcq_case_12', 'fcq_case_13', 'fcq_case_14'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
