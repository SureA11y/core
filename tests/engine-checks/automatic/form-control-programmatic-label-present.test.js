'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'form-control-programmatic-label-present';

test('notApplicable when there are no target controls', () => {
  const html = '<!doctype html><html><body><p>none</p></body></html>';
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('pass: <label for="id"> association', () => {
  const html = `
    <!doctype html><html><body>
      <label for="a">Name</label>
      <input id="a" type="text">
    </body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('pass: wrapping <label> association', () => {
  const html = `
    <!doctype html><html><body>
      <label>Email <input id="b" type="email"></label>
    </body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('fail: wrapping <label> whose only text is aria-hidden gives no real accessible name', () => {
  const html = `
    <!doctype html><html><body>
      <label><input id="b" type="checkbox"><span aria-hidden="true">Accept</span></label>
    </body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'b'));
});

test('pass: wrapping <label> has its own aria-label even though its only child content is aria-hidden', () => {
  const html = `
    <!doctype html><html><body>
      <label aria-label="Toggle Navigation" for="c"><svg aria-hidden="true"><path d="M0 0"/></svg></label>
      <input id="c" type="checkbox">
    </body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('fail: <label for> whose only text is aria-hidden gives no real accessible name', () => {
  const html = `
    <!doctype html><html><body>
      <label for="b"><span aria-hidden="true">Volume</span></label>
      <input id="b" type="range">
    </body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'b'));
});

test("pass: <label for> with empty content falls back to the label's own title attribute", () => {
  // Regression for a false positive: a <label for> whose own
  // content is empty still contributes a name via its title attribute per
  // accname's title-fallback step, which applies to the label element
  // itself, not just the control it labels.
  // labelContributesAccessibleName (src/core/dom-helpers.js)
  // only checked the label's aria-name and content name, never its title.
  const html = `
    <!doctype html><html><body>
      <label for="a" title="Search"></label>
      <input id="a" type="range">
    </body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('pass: aria-label (non-empty)', () => {
  const html = `
    <!doctype html><html><body>
      <input id="c" type="text" aria-label="Search">
    </body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('pass: aria-labelledby resolves to non-empty text', () => {
  const html = `
    <!doctype html><html><body>
      <span id="lbl">Username</span>
      <input id="d" type="text" aria-labelledby="lbl">
    </body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('fail: aria-labelledby present but resolves to empty text', () => {
  const html = `
    <!doctype html><html><body>
      <span id="lbl2"></span>
      <input id="e" type="text" aria-labelledby="lbl2">
    </body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
});

test('pass: placeholder-only does not count as label', () => {
  const html = `
    <!doctype html><html><body>
      <input id="f" type="text" placeholder="Your name">
    </body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('fail: title-only is empty', () => {
  const html = `
    <!doctype html><html><body>
      <input id="g" type="text" placeholder="">
    </body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
});

test('pass: title-only does not count as label', () => {
  const html = `
    <!doctype html><html><body>
      <input id="g" type="text" title="Your name">
    </body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('fail: title-only is empty', () => {
  const html = `
    <!doctype html><html><body>
      <input id="g" type="text" title="">
    </body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
});

test('pass: mixed controls all labeled', () => {
  const html = `
    <!doctype html><html><body>
      <label for="h">Country</label>
      <select id="h"><option>FR</option></select>

      <label>Message <textarea id="i"></textarea></label>

      <input id="j" type="text" aria-label="City">

      <span id="kLbl">Postal code</span>
      <input id="k" type="text" aria-labelledby="kLbl">
    </body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('fail: mixed controls with one unlabeled', () => {
  const html = `
    <!doctype html><html><body>
      <label for="l">Email</label>
      <input id="l" type="email">

      <input id="m" type="text">
    </body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
});

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: fixture coverage (tests/fixtures/form-control-programmatic-label-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'form-control-programmatic-label-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  const expectedFailIds = [
    'fc_case_01',
    'fc_case_08',
    'fc_case_09',
    'fc_case_10',
    'fc_case_12',
    'fc_case_18',
    'fc_case_19',
    'fc_case_37',
    'fc_case_40b',
    'fc_case_41',
    'fc_case_43'
  ];

  const expectedNoOccIds = [
    // PASS cases
    'fc_case_02',
    'fc_case_03',
    'fc_case_04',
    'fc_case_05',
    'fc_case_06',
    'fc_case_07',
    'fc_case_11',
    'fc_case_13',
    'fc_case_14',
    'fc_case_15',
    'fc_case_16',
    'fc_case_17',
    'fc_case_20',
    'fc_case_23',
    'fc_case_26',
    'fc_case_38',
    'fc_case_40a',
    'fc_case_42',
    'fc_case_44',

    // Ineligible in acc (should not produce occurrences)
    'fc_case_21',
    'fc_case_22',
    'fc_case_24',
    'fc_case_25',
    'fc_case_39a',
    'fc_case_27',
    'fc_case_28',
    'fc_case_29',
    'fc_case_30',
    'fc_case_31',
    'fc_case_32',

    // Untargeted by selector
    'fc_case_33',
    'fc_case_34',
    'fc_case_35',
    'fc_case_36',

    // Aggregation demo-only
    'fc_case_39b',
    'fc_case_39c',
    'fc_case_40'
  ];

  const rule = assertRule(result, RULE_ID, 'fail', {
    minOccurrences: expectedFailIds.length
  });

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test('notApplicable: unlabeled native control carrying aria-hidden="true" itself', () => {
  const html = `
    <!doctype html><html><body>
      <input id="ah1" type="text" aria-hidden="true">
    </body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('notApplicable: unlabeled native control under an aria-hidden="true" ancestor', () => {
  const html = `
    <!doctype html><html><body>
      <div aria-hidden="true">
        <input id="ah2" type="text">
      </div>
    </body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('notApplicable: aria-hidden control referenced by aria-labelledby (IDREF override)', () => {
  const html = `
    <!doctype html><html><body>
      <div aria-labelledby="ah3">References the control.</div>
      <input id="ah3" type="text" aria-hidden="true">
    </body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('aria-hidden-focus still reports the control this rule now skips', () => {
  const html = `
    <!doctype html><html><body>
      <div aria-hidden="true">
        <input id="ah4" type="text">
      </div>
    </body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: ['aria-hidden-focus'] });
  assertRule(result, 'aria-hidden-focus', 'fail', { minOccurrences: 1 });
});

test('fail: an unlabeled control outside the aria-hidden subtree is unaffected', () => {
  const html = `
    <!doctype html><html><body>
      <div aria-hidden="true"><input id="ah5" type="text"></div>
      <input id="visible" type="text">
    </body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'visible'));
  assert.ok(!hasOccurrenceForId(rule, 'ah5'));
});

// A labeled aria-hidden control is out of scope, not a pass: the name is not
// exposed either, so the rule has nothing to assert about it.
test('notApplicable: aria-hidden control that does carry an aria-label', () => {
  const html = `
    <!doctype html><html><body>
      <div aria-hidden="true"><input id="ah6" type="text" aria-label="Search"></div>
    </body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('notApplicable: <select> and <textarea> inside aria-hidden, like <input>', () => {
  const html = `
    <!doctype html><html><body>
      <div aria-hidden="true">
        <select id="ah7"><option>a</option></select>
        <textarea id="ah8"></textarea>
      </div>
    </body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

// Guards against over-excluding: only the aria-hidden overrides are dropped.
// A focusable role=presentation control keeps its role by conflict resolution.
test('fail: focusable role="presentation" control stays in scope', () => {
  const html = `
    <!doctype html><html><body>
      <input id="pres" type="text" role="presentation">
    </body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'pres'));
});

test('notApplicable: control under an aria-hidden ancestor several levels up', () => {
  const html = `
    <!doctype html><html><body>
      <div aria-hidden="true"><div><fieldset><div>
        <input id="ah9" type="text">
      </div></fieldset></div></div>
    </body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});
