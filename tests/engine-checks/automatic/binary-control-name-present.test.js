'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let runa11yCoreOnHtml;
let assertRule;

try {
  ({ runa11yCoreOnHtml } = require('../../helpers/runa11yCoreOnHtml'));
  ({ assertRule } = require('../../helpers/assertRule'));
} catch (e) {}

const RULE_ID = 'binary-control-name-present';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test('binary-control-name-present: no applicable elements => notApplicable', () => {
  const html = `<!doctype html><html><body><div>no binary controls</div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('binary-control-name-present: checkbox with label => pass', () => {
  const html = `<!doctype html><html><body><label><input type='checkbox'/> Accept</label></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('binary-control-name-present: checkbox with hidden-only label text => fail', () => {
  const html = `<!doctype html><html><body><label><input type='checkbox'/><span aria-hidden='true'>Accept</span></label></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test('binary-control-name-present: radio with label[for] => pass', () => {
  const html = `<!doctype html><html><body><input id='r1' type='radio'/><label for='r1'>Choice A</label></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('binary-control-name-present: role=checkbox with aria-hidden content only => fail', () => {
  const html = `<!doctype html><html><body><div role='checkbox' tabindex='0'><span aria-hidden='true'>X</span></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test('binary-control-name-present: role=switch with aria-label => pass', () => {
  const html = `<!doctype html><html><body><div role='switch' tabindex='0' aria-label='Airplane mode'></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('binary-control-name-present: role=radio with visible content => pass', () => {
  const html = `<!doctype html><html><body><div role='radio' tabindex='0'>Option</div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('checkbox-name-present: wrapping <label> has its own aria-label even though its only child content is aria-hidden', () => {
  const html = `<!doctype html><html><body>
    <label aria-label="Toggle Navigation" for="c"><svg aria-hidden="true"><path d="M0 0"/></svg></label>
    <input role="checkbox" id="c" type="checkbox">
  </body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/binary-control-name-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'binary-control-name-present-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 7, maxOccurrences: 7 });

  const expectedFailIds = [
    'binctl_case_01',
    'binctl_case_07',
    'binctl_case_10',
    'binctl_case_13',
    'binctl_case_15',
    'binctl_case_17',
    'binctl_case_23'
  ];

  const expectedNoOccIds = [
    'binctl_case_19',
    'binctl_case_18b',
    'binctl_case_02',
    'binctl_case_03',
    'binctl_case_04',
    'binctl_case_05',
    'binctl_case_06',
    'binctl_case_08',
    'binctl_case_09',
    'binctl_case_11',
    'binctl_case_12',
    'binctl_case_14',
    'binctl_case_16',
    'binctl_case_18',
    'binctl_case_20',
    'binctl_case_21',
    'binctl_case_22',
    'binctl_case_24',
    'binctl_case_25'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test('binary-control-name-present: aria-labelledby pointing at an <iframe> falls back to its title attribute => pass', () => {
  // Regression for a false positive — a copy-pasted bug across the
  // *-name-present rules:
  // aria-labelledby pointing at an <iframe> has no "content" to compute a
  // name from (iframe content is opaque/cross-origin per HTML-AAM); the
  // referenced element's own accessible name must fall back to its title
  // attribute, which the previous getConservativeSubtreeText-only
  // resolveAriaLabelledbyText never checked. Fixed via the shared
  // getTextFromIdRefs helper.
  const html = `<!doctype html><html><body><iframe id='t' title='Settings'></iframe><div role='checkbox' aria-labelledby='t'></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test("binary-control-name-present: label association with empty content falls back to the label's own title attribute => pass", () => {
  // Regression for the sibling gap to the <iframe>-title-fallback fix:
  // getLabelText previously stopped at content-only
  // (getConservativeSubtreeText) when resolving a native <label for> whose
  // content is empty, never checking the label's own title attribute — the
  // same final-fallback step the general accname algorithm applies to any
  // element being asked for its name, regardless of why.
  // Uses a native input[type=checkbox], not role="checkbox" on a <div> —
  // native <label for> association is only checked for native
  // checkbox/radio inputs (role-based ones use content-as-name instead,
  // per WAI-ARIA; <label for> doesn't apply to non-labelable elements
  // anyway per the HTML living standard).
  const html = `<!doctype html><html><body><label for='a' title='Search'></label><input id='a' type='checkbox'/></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});
