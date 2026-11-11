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
} catch {}

const RULE_ID = 'dialog-name-present';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test('dialog-name-present: no applicable elements => notApplicable', () => {
  const html = `<!doctype html><html><body><div>no dialogs</div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('dialog-name-present: role=dialog with aria-labelledby => pass', () => {
  const html = `<!doctype html><html><body><h2 id='t'>Settings</h2><div role='dialog' aria-labelledby='t'></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('dialog-name-present: role=alertdialog missing name => cantTell', () => {
  const html = `<!doctype html><html><body><div role='alertdialog'></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: pass when aria-labelledby points at an element whose own name comes from a wrapped img alt`, () => {
  // Dialog supports no content-fallback of its own (only aria-label/
  // aria-labelledby/title), so this specifically exercises
  // computeIdRefTargetTextAlternative's recursive target resolution, not
  // getContentNameInfo's direct fallback path.
  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const html = `<!doctype html><html><body>
    <div role="dialog" aria-labelledby="lbl"></div>
    <span id="lbl"><img alt="Confirm deletion" src="x.png"></span>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when aria-labelledby points at an element whose own name comes from a nested role="img" aria-label`, () => {
  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const html = `<!doctype html><html><body>
    <div role="dialog" aria-labelledby="lbl2"></div>
    <span id="lbl2"><span role="img" aria-label="Confirm deletion"></span></span>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/dialog-name-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'dialog-name-present-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 9, maxOccurrences: 9 });

  const expectedFailIds = [
    'dialog_case_01',
    'dialog_case_02',
    'dialog_case_06',
    'dialog_case_08',
    'dialog_case_09',
    'dialog_case_10',
    'dialog_case_17',
    'dialog_case_22',
    'dialog_case_24'
  ];

  const expectedNoOccIds = [
    'dialog_case_12',
    'dialog_case_13',
    'dialog_case_03',
    'dialog_case_04',
    'dialog_case_05',
    'dialog_case_07',
    'dialog_case_11',
    'dialog_case_14',
    'dialog_case_15',
    'dialog_case_16',
    'dialog_case_18',
    'dialog_case_19',
    'dialog_case_20',
    'dialog_case_21',
    'dialog_case_23',
    'dialog_case_25'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test('dialog-name-present: aria-labelledby pointing at an <iframe> falls back to its title attribute => pass', () => {
  // Regression for a copy-pasted bug across the *-name-present rules:
  // aria-labelledby pointing at an <iframe> has no "content" to compute a
  // name from (iframe content is opaque/cross-origin per HTML-AAM); the
  // referenced element's own accessible name must fall back to its title
  // attribute, which the previous getConservativeSubtreeText-only
  // resolveAriaLabelledbyText never checked. Fixed via the shared
  // getTextFromIdRefs helper.
  const html = `<!doctype html><html><body><iframe id='t' title='Settings'></iframe><div role='dialog' aria-labelledby='t'></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: an open native <dialog> with no name is asked about; a named one passes`, () => {
  const bad = `<!doctype html><html><body><dialog open id="d"><p>Sure?</p><button>OK</button></dialog></body></html>`;
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
    const rule = assertRule(
      runa11yCoreOnHtml(bad, { runOnly: [RULE_ID], engineOptions }),
      RULE_ID,
      'cantTell',
      { minOccurrences: 1, maxOccurrences: 1 }
    );
    assert.ok(hasOccurrenceForId(rule, 'd'));
    assert.equal(rule.occurrences[0].data.details.controlType, 'dialog');
  }
  const good = `<!doctype html><html><body><dialog open aria-label="Confirm"><button>OK</button></dialog></body></html>`;
  assertRule(runa11yCoreOnHtml(good, { runOnly: [RULE_ID] }), RULE_ID, 'pass', {
    maxOccurrences: 0
  });
});

test(`${RULE_ID}: a closed native <dialog> is not applicable`, () => {
  const html = `<!doctype html><html><body><dialog><p>Sure?</p></dialog></body></html>`;
  assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'notApplicable', {
    maxOccurrences: 0
  });
});

test(`${RULE_ID}: the role is the first concrete token of a fallback list`, () => {
  const alert = `<!doctype html><html><body><div role="alertdialog dialog" id="d"></div></body></html>`;
  for (const engineOptions of [{}]) {
    const rule = assertRule(
      runa11yCoreOnHtml(alert, { runOnly: [RULE_ID], engineOptions }),
      RULE_ID,
      'cantTell',
      { minOccurrences: 1, maxOccurrences: 1 }
    );
    assert.equal(rule.occurrences[0].data.details.controlType, 'alertdialog');
  }
  const unknownFirst = `<!doctype html><html><body><div role="modal dialog" id="d"></div></body></html>`;
  assertRule(runa11yCoreOnHtml(unknownFirst, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  // Tokens are separated by any ASCII whitespace and matched in any case.
  const tabUpper = `<!doctype html><html><body><div role="modal\tDIALOG" id="d"></div></body></html>`;
  assertRule(runa11yCoreOnHtml(tabUpper, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  // A dialog token after a concrete role does not make the element a dialog.
  const regionFirst = `<!doctype html><html><body><div role="region dialog"></div><dialog open role="none"><p>x</p></dialog></body></html>`;
  assertRule(runa11yCoreOnHtml(regionFirst, { runOnly: [RULE_ID] }), RULE_ID, 'notApplicable', {
    maxOccurrences: 0
  });
});

test(`${RULE_ID}: a fail names an empty heading it points to, and does not ask for an aria-labelledby it has`, () => {
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body>
  <div id="d1" role="dialog" aria-labelledby="t1"><h2 id="t1"></h2><p>Body</p></div>
  <div id="d2" role="dialog" aria-labelledby="t2"><h2 id="t2"><span aria-hidden="true">Hi</span></h2></div>
  <div id="d3" role="dialog"><p>Body</p></div>
</body></html>`;
  const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 3,
    maxOccurrences: 3
  });
  const occ = (id) => rule.occurrences.find((o) => o.html.includes(`id="${id}"`));
  assert.equal(occ('d1').i18n.hintKey, 'nameCause_hint_labelledbyEmpty');
  assert.equal(
    occ('d1').hint,
    'Its aria-labelledby points only to elements with no text (<h2 id="t1">), so it gives no name. Put the text in the element it points to, or name it with aria-label.'
  );
  assert.equal(occ('d1').data.details.nameCause.cause, 'labelledbyEmpty');
  assert.equal(occ('d2').i18n.hintKey, 'dialogNamePresent_hint_fail_labelledby');
  assert.equal(
    occ('d2').hint,
    "Its aria-labelledby gives no name. Check that it lists the id of the dialog's heading and that the heading has text screen readers read, or name the dialog with aria-label."
  );
  assert.equal(occ('d3').i18n.hintKey, 'dialogNamePresent_hint_fail');
  assert.equal(
    occ('d3').hint,
    'Name it with aria-labelledby pointing at its heading, or with aria-label, so screen readers announce what the dialog is about.'
  );
});
