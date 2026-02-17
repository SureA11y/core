'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { runa11yCoreOnHtml } = require('../../helpers/runa11yCoreOnHtml');
const { assertRule } = require('../../helpers/assertRule');

const RULE_ID = 'a11ycore-form-control-programmatic-label-quality';

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

test(`${RULE_ID}: native input with associated <label> => pass`, () => {
    const html = `<!doctype html><html><body>
    <label for="a">First name</label>
    <input id="a" type="text">
  </body></html>`;

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });

    const m = rule.data.details.metrics;
    assert.equal(m.applicableCount, 1);
    assert.equal(m.flaggedCount, 0);
    assert.equal(m.byMethod.label, 1);
});

test(`${RULE_ID}: native input with aria-label => pass (not flagged)`, () => {
    const html = `<!doctype html><html><body>
    <input id="b" type="text" aria-label="Email address">
  </body></html>`;

    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });

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
