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
} catch (e) {
  // If your repo uses a different layout, update these paths.
}

const RULE_ID = 'a11ycore-button-name-present';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test('button-name-present: no applicable elements => notApplicable', () => {
  const html = `
<!doctype html><html><body>
  <div>no buttons</div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('button-name-present: native button with text => pass', () => {
  const html = `
<!doctype html><html><body>
  <button>Save</button>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('button-name-present: aria-label provides name even if content aria-hidden => pass', () => {
  const html = `
<!doctype html><html><body>
  <button aria-label="Close"><span aria-hidden="true">X</span></button>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('button-name-present: aria-labelledby provides name => pass', () => {
  const html = `
<!doctype html><html><body>
  <span id="lbl">Download</span>
  <button aria-labelledby="lbl"><span aria-hidden="true">X</span></button>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('button-name-present: empty button => fail', () => {
  const html = `
<!doctype html><html><body>
  <button></button>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test('button-name-present: content only aria-hidden => fail', () => {
  const html = `
<!doctype html><html><body>
  <button><span aria-hidden="true">asdfasdf</span></button>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test('button-name-present: content aria-hidden=false => pass', () => {
  const html = `
<!doctype html><html><body>
  <button><span aria-hidden="false">asdfasdf</span></button>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('button-name-present: mixed aria-hidden + visible text => pass', () => {
  const html = `
<!doctype html><html><body>
  <button><span aria-hidden="true">asdfasdf</span>asdf</button>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('button-name-present: input type=submit with value => pass', () => {
  const html = `
<!doctype html><html><body>
  <input type="submit" value="Submit form" />
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('button-name-present: input type=submit without value and no aria => fail', () => {
  const html = `
<!doctype html><html><body>
  <input type="submit" />
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test('button-name-present: role=button with text => pass', () => {
  const html = `
<!doctype html><html><body>
  <div role="button" tabindex="0">Open menu</div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('button-name-present: role=button with only aria-hidden text => fail', () => {
  const html = `
<!doctype html><html><body>
  <div role="button" tabindex="0"><span aria-hidden="true">Hidden label</span></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: pass when an icon-only button's name comes from a wrapped <img alt>`, () => {
  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const html = `<!doctype html><html><body><button><img alt="Close dialog" src="x.png"></button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when an icon-only button's name comes from a nested role="img" aria-label`, () => {
  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const html = `<!doctype html><html><body><button><span role="img" aria-label="Close"></span></button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when an icon-only button's name comes from a wrapping <label> (found on a real site — DeviantArt's settings toggles wrap a description div and an unlabeled aria-pressed button in one <label>)`, () => {
  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const html = `<!doctype html><html><body><label><div>Display Mature Content</div><button aria-pressed="false"><span></span></button></label></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when an icon-only button has no wrapping <label> and no other name`, () => {
  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const html = `<!doctype html><html><body><div>Display Mature Content</div><button aria-pressed="false"><span></span></button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/button-name-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'button-name-present-all-scenarios.html');
  const html = fs.readFileSync(fixturePath, 'utf8');

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 13, maxOccurrences: 13 });

  const expectedFailIds = [
    'btn_case_01', 'btn_case_06', 'btn_case_07', 'btn_case_08', 'btn_case_10', 'btn_case_12',
    'btn_case_14', 'btn_case_16', 'btn_case_17', 'btn_case_19', 'btn_case_19b', 'btn_case_23',
    'btn_case_26'
  ];

  const expectedNoOccIds = [
    'btn_case_02', 'btn_case_03', 'btn_case_04', 'btn_case_05', 'btn_case_09', 'btn_case_11', 'btn_case_13', 'btn_case_15',
    'btn_case_18b', 'btn_case_18c', 'btn_case_18d', 'btn_case_18e', 'btn_case_18f', 'btn_case_18g', 'btn_case_27'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
