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

const RULE_ID = 'dialog-name-present';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test('dialog-name-present: no applicable elements => notApplicable', () => {
  const html = `<!doctype html><html><body><div>no dialogs</div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('dialog-name-present: role=dialog with aria-labelledby => pass', () => {
  const html = `<!doctype html><html><body><h2 id='t'>Settings</h2><div role='dialog' aria-labelledby='t'></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('dialog-name-present: role=alertdialog missing name => fail', () => {
  const html = `<!doctype html><html><body><div role='alertdialog'></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: pass when aria-labelledby points at an element whose own name comes from a wrapped img alt`, () => {
  // Dialog supports no content-fallback of its own (only aria-label/
  // aria-labelledby/title), so this specifically exercises
  // computeIdRefTargetTextAlternative's recursive target resolution, not
  // getContentNameInfo's direct fallback path.
  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const html = `<!doctype html><html><body>
    <div role="dialog" aria-labelledby="lbl"></div>
    <span id="lbl"><img alt="Confirm deletion" src="x.png"></span>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when aria-labelledby points at an element whose own name comes from a nested role="img" aria-label`, () => {
  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const html = `<!doctype html><html><body>
    <div role="dialog" aria-labelledby="lbl2"></div>
    <span id="lbl2"><span role="img" aria-label="Confirm deletion"></span></span>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/dialog-name-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'dialog-name-present-all-scenarios.html');
  const html = fs.readFileSync(fixturePath, 'utf8');

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 9, maxOccurrences: 9 });

  const expectedFailIds = [
    'dialog_case_01', 'dialog_case_02', 'dialog_case_06', 'dialog_case_08', 'dialog_case_09', 'dialog_case_10', 'dialog_case_12', 'dialog_case_13', 'dialog_case_17'
  ];

  const expectedNoOccIds = [
    'dialog_case_03', 'dialog_case_04', 'dialog_case_05', 'dialog_case_07', 'dialog_case_11', 'dialog_case_14', 'dialog_case_15', 'dialog_case_16', 'dialog_case_18', 'dialog_case_19', 'dialog_case_20', 'dialog_case_21'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test('dialog-name-present: aria-labelledby pointing at an <iframe> falls back to its title attribute => pass', () => {
  // Regression for a real false positive found via BBC News' cookie-consent
  // dialog (2026-07-22) — a copy-pasted bug across 16 *-name-present rules:
  // aria-labelledby pointing at an <iframe> has no "content" to compute a
  // name from (iframe content is opaque/cross-origin per HTML-AAM); the
  // referenced element's own accessible name must fall back to its title
  // attribute, which the previous getConservativeSubtreeText-only
  // resolveAriaLabelledbyText never checked. Fixed via the shared
  // getTextFromIdRefs helper.
  const html = `<!doctype html><html><body><iframe id='t' title='Settings'></iframe><div role='dialog' aria-labelledby='t'></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});
