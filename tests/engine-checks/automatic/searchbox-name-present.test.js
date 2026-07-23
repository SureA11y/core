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

const RULE_ID = 'a11ycore-searchbox-name-present';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test('searchbox-name-present: no applicable => notApplicable', () => {
  const html = `<!doctype html><html><body><div>no searchbox</div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('searchbox-name-present: aria-labelledby => pass', () => {
  const html = `<!doctype html><html><body><span id='lbl'>Search</span><div role='searchbox' aria-labelledby='lbl'></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('searchbox-name-present: hidden-only content => fail', () => {
  const html = `<!doctype html><html><body><div role='searchbox'><span aria-hidden='true'>Search</span></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test('searchbox-name-present: wrapping <label> has its own aria-label even though its only child content is aria-hidden (found on a real site)', () => {
  const html = `<!doctype html><html><body>
    <label aria-label="Toggle Navigation" for="c"><svg aria-hidden="true"><path d="M0 0"/></svg></label>
    <input role="searchbox" id="c" type="text">
  </body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/searchbox-name-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'searchbox-name-present-all-scenarios.html');
  const html = fs.readFileSync(fixturePath, 'utf8');

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 8, maxOccurrences: 8 });

  const expectedFailIds = [
    'searchbox_case_01', 'searchbox_case_02', 'searchbox_case_08', 'searchbox_case_09', 'searchbox_case_10', 'searchbox_case_12', 'searchbox_case_13', 'searchbox_case_17'
  ];

  const expectedNoOccIds = [
    'searchbox_case_03', 'searchbox_case_04', 'searchbox_case_05', 'searchbox_case_06', 'searchbox_case_07', 'searchbox_case_11', 'searchbox_case_14', 'searchbox_case_15', 'searchbox_case_16', 'searchbox_case_18', 'searchbox_case_19', 'searchbox_case_20', 'searchbox_case_21'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test('searchbox-name-present: aria-labelledby pointing at an <iframe> falls back to its title attribute => pass', () => {
  // Regression for a real false positive found via BBC News' cookie-consent
  // dialog (2026-07-22) — a copy-pasted bug across 16 *-name-present rules:
  // aria-labelledby pointing at an <iframe> has no "content" to compute a
  // name from (iframe content is opaque/cross-origin per HTML-AAM); the
  // referenced element's own accessible name must fall back to its title
  // attribute, which the previous getConservativeSubtreeText-only
  // resolveAriaLabelledbyText never checked. Fixed via the shared
  // getTextFromIdRefs helper.
  const html = `<!doctype html><html><body><iframe id='t' title='Settings'></iframe><div role='searchbox' aria-labelledby='t'></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('searchbox-name-present: label association with empty content falls back to the label\'s own title attribute => pass', () => {
  // Regression for the theoretical sibling gap to the <iframe>-title-
  // fallback fix (found via a deliberate audit of every duplicated
  // accessible-name helper across the *-name-present rule family,
  // 2026-07-22): getLabelText previously stopped at content-only
  // (getConservativeSubtreeText) when resolving a native <label for> whose
  // content is empty, never checking the label's own title attribute — the
  // same final-fallback step the general accname algorithm applies to any
  // element being asked for its name, regardless of why.
  const html = `<!doctype html><html><body><label for='a' title='Search'></label><div id='a' role='searchbox'></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});
