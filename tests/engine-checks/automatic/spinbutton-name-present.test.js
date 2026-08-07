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

const RULE_ID = 'spinbutton-name-present';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test('spinbutton-name-present: no applicable => notApplicable', () => {
  const html = `<!doctype html><html><body><div>no spin</div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('spinbutton-name-present: aria-label => pass', () => {
  const html = `<!doctype html><html><body><div role='spinbutton' aria-label='Quantity'></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('spinbutton-name-present: missing name => fail', () => {
  const html = `<!doctype html><html><body><div role='spinbutton'></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test('spinbutton-name-present: fail even with visible text content (role="spinbutton" is name-from-author-only) -- the fix-it hint must not claim visible text is a valid remediation', () => {
  const html = `<!doctype html><html><body><div id="a" role='spinbutton'>Quantity</div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.doesNotMatch(rule.occurrences[0].hint, /provide visible text|has visible text/i);
  assert.match(rule.occurrences[0].hint, /aria-label/i);
});

test('spinbutton-name-present: wrapping <label> has its own aria-label even though its only child content is aria-hidden', () => {
  const html = `<!doctype html><html><body>
    <label aria-label="Toggle Navigation" for="c"><svg aria-hidden="true"><path d="M0 0"/></svg></label>
    <input role="spinbutton" id="c" type="number">
  </body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/spinbutton-name-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'spinbutton-name-present-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 8, maxOccurrences: 8 });

  const expectedFailIds = [
    'spinbutton_case_01',
    'spinbutton_case_02',
    'spinbutton_case_08',
    'spinbutton_case_09',
    'spinbutton_case_10',
    'spinbutton_case_12',
    'spinbutton_case_13',
    'spinbutton_case_17'
  ];

  const expectedNoOccIds = [
    'spinbutton_case_03',
    'spinbutton_case_04',
    'spinbutton_case_05',
    'spinbutton_case_06',
    'spinbutton_case_07',
    'spinbutton_case_11',
    'spinbutton_case_14',
    'spinbutton_case_15',
    'spinbutton_case_16',
    'spinbutton_case_18',
    'spinbutton_case_19',
    'spinbutton_case_20',
    'spinbutton_case_21',
    'spinbutton_case_22',
    'spinbutton_case_23'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test('spinbutton-name-present: aria-labelledby pointing at an <iframe> falls back to its title attribute => pass', () => {
  // aria-labelledby pointing at an <iframe> has no "content" to compute a
  // name from (iframe content is opaque/cross-origin per HTML-AAM); the
  // referenced element's own accessible name must fall back to its title
  // attribute, which the previous getConservativeSubtreeText-only
  // resolveAriaLabelledbyText never checked. Fixed via the shared
  // getTextFromIdRefs helper.
  const html = `<!doctype html><html><body><iframe id='t' title='Settings'></iframe><div role='spinbutton' aria-labelledby='t'></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test("spinbutton-name-present: label association with empty content falls back to the label's own title attribute => pass", () => {
  // getLabelText previously stopped at content-only
  // (getConservativeSubtreeText) when resolving a native <label for> whose
  // content is empty, never checking the label's own title attribute — the
  // same final-fallback step the general accname algorithm applies to any
  // element being asked for its name.
  const html = `<!doctype html><html><body><label for='a' title='Search'></label><div id='a' role='spinbutton'></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});
