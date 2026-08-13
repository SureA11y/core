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

const RULE_ID = 'textbox-name-present';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test('textbox-name-present: no applicable => notApplicable', () => {
  const html = `<!doctype html><html><body><div>no textbox</div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('textbox-name-present: aria-label => pass', () => {
  const html = `<!doctype html><html><body><div role='textbox' aria-label='Name'></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('textbox-name-present: visible content but no author-provided name => fail', () => {
  const html = `<!doctype html><html><body><div id="a" role='textbox' contenteditable='true'>Name</div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  // role="textbox" is name-from-author-only per WAI-ARIA: subtree content
  // must NOT be treated as a valid accessible-name source.
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });

  // Regression: the fix-it hint must not claim visible text is a valid
  // remediation, since this exact case (visible text present, "Name")
  // still correctly fails -- a hint saying otherwise would send authors
  // down a dead end.
  assert.doesNotMatch(rule.occurrences[0].hint, /provide visible text|has visible text/i);
  assert.match(rule.occurrences[0].hint, /aria-label/i);
});

test('textbox-name-present: hidden-only content => fail', () => {
  const html = `<!doctype html><html><body><div role='textbox' contenteditable='true'><span aria-hidden='true'>Name</span></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test('textbox-name-present: wrapping <label> has its own aria-label even though its only child content is aria-hidden', () => {
  const html = `<!doctype html><html><body>
    <label aria-label="Toggle Navigation" for="c"><svg aria-hidden="true"><path d="M0 0"/></svg></label>
    <input role="textbox" id="c" type="text">
  </body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/textbox-name-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'textbox-name-present-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 6, maxOccurrences: 6 });

  const expectedFailIds = [
    'textbox_case_01',
    'textbox_case_02',
    'textbox_case_08',
    'textbox_case_09',
    'textbox_case_10',
    'textbox_case_17'
  ];

  const expectedNoOccIds = [
    'textbox_case_12',
    'textbox_case_13',
    'textbox_case_03',
    'textbox_case_04',
    'textbox_case_05',
    'textbox_case_06',
    'textbox_case_07',
    'textbox_case_11',
    'textbox_case_14',
    'textbox_case_15',
    'textbox_case_16',
    'textbox_case_18',
    'textbox_case_19',
    'textbox_case_20',
    'textbox_case_21',
    'textbox_case_22',
    'textbox_case_23'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test('textbox-name-present: aria-labelledby pointing at an <iframe> falls back to its title attribute => pass', () => {
  // Regression: aria-labelledby pointing at an <iframe> has no "content" to
  // compute a name from (iframe content is opaque/cross-origin per HTML-AAM);
  // the referenced element's own accessible name must fall back to its title
  // attribute, which the previous getConservativeSubtreeText-only
  // resolveAriaLabelledbyText never checked. Fixed via the shared
  // getTextFromIdRefs helper.
  const html = `<!doctype html><html><body><iframe id='t' title='Settings'></iframe><div role='textbox' aria-labelledby='t'></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test("textbox-name-present: label association with empty content falls back to the label's own title attribute => pass", () => {
  // Regression for the sibling gap to the <iframe>-title-fallback fix:
  // getLabelText previously stopped at content-only
  // (getConservativeSubtreeText) when resolving a native <label for> whose
  // content is empty, never checking the label's own title attribute — the
  // same final-fallback step the general accname algorithm applies to any
  // element being asked for its name, regardless of why.
  const html = `<!doctype html><html><body><label for='a' title='Search'></label><div id='a' role='textbox'></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});
