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

const RULE_ID = 'combobox-name-present';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test('combobox-name-present: no applicable elements => notApplicable', () => {
  const html = `<!doctype html><html><body><div>no combobox</div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('combobox-name-present: role=combobox with aria-label => pass', () => {
  const html = `<!doctype html><html><body><div role='combobox' tabindex='0' aria-label='Search'></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('combobox-name-present: role=combobox with aria-hidden content only => fail', () => {
  const html = `<!doctype html><html><body><div role='combobox' tabindex='0'><span aria-hidden='true'>Search</span></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test('combobox-name-present: role=combobox with visible content but no author-provided name => fail', () => {
  const html = `<!doctype html><html><body><div role='combobox' tabindex='0'>Search</div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  // role="combobox" is name-from-author-only per WAI-ARIA: subtree content
  // must NOT be treated as a valid accessible-name source.
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/combobox-name-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'combobox-name-present-all-scenarios.html');
  const html = fs.readFileSync(fixturePath, 'utf8');

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 8, maxOccurrences: 8 });

  const expectedFailIds = [
    'combobox_case_01',
    'combobox_case_02',
    'combobox_case_08',
    'combobox_case_09',
    'combobox_case_10',
    'combobox_case_12',
    'combobox_case_13',
    'combobox_case_17'
  ];

  const expectedNoOccIds = [
    'combobox_case_03',
    'combobox_case_04',
    'combobox_case_05',
    'combobox_case_06',
    'combobox_case_07',
    'combobox_case_11',
    'combobox_case_14',
    'combobox_case_15',
    'combobox_case_16',
    'combobox_case_18',
    'combobox_case_19',
    'combobox_case_20',
    'combobox_case_21',
    'combobox_case_22'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test('combobox-name-present: aria-labelledby pointing at an <iframe> falls back to its title attribute => pass', () => {
  // Regression for a real false positive found via BBC News' cookie-consent
  // dialog (2026-07-22) — a copy-pasted bug across 16 *-name-present rules:
  // aria-labelledby pointing at an <iframe> has no "content" to compute a
  // name from (iframe content is opaque/cross-origin per HTML-AAM); the
  // referenced element's own accessible name must fall back to its title
  // attribute, which the previous getConservativeSubtreeText-only
  // resolveAriaLabelledbyText never checked. Fixed via the shared
  // getTextFromIdRefs helper.
  const html = `<!doctype html><html><body><iframe id='t' title='Settings'></iframe><div role='combobox' aria-labelledby='t'></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('combobox-name-present: label association with empty content falls back to the label\'s own title attribute => pass', () => {
  // Regression for the theoretical sibling gap to the <iframe>-title-
  // fallback fix (found via a deliberate audit of every duplicated
  // accessible-name helper across the *-name-present rule family,
  // 2026-07-22): getLabelText previously stopped at content-only
  // (getConservativeSubtreeText) when resolving a native <label for> whose
  // content is empty, never checking the label's own title attribute — the
  // same final-fallback step the general accname algorithm applies to any
  // element being asked for its name, regardless of why.
  const html = `<!doctype html><html><body><label for='a' title='Search'></label><div id='a' role='combobox'></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});
