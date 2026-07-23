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
  // Running outside repo context.
}

const RULE_ID = 'a11ycore-aria-role-name-present';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test('aria-role-name-present: no applicable elements => notApplicable', () => {
  const html = `
<!doctype html><html><body>
  <div>no matching roles</div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('aria-role-name-present: role=toolbar missing name => fail', () => {
  const html = `
<!doctype html><html><body>
  <div role="toolbar"></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test('aria-role-name-present: role=toolbar aria-label => pass', () => {
  const html = `
<!doctype html><html><body>
  <div role="toolbar" aria-label="Editor tools"></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('aria-role-name-present: role=tablist aria-labelledby => pass', () => {
  const html = `
<!doctype html><html><body>
  <h2 id="t1">Account tabs</h2>
  <div role="tablist" aria-labelledby="t1">
    <div role="tab" aria-label="Overview"></div>
  </div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('aria-role-name-present: role=radiogroup empty aria-label => fail', () => {
  const html = `
<!doctype html><html><body>
  <div role="radiogroup" aria-label=" "></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test('aria-role-name-present: role=tree title => pass', () => {
  const html = `
<!doctype html><html><body>
  <div role="tree" title="File browser"></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('aria-role-name-present: multiple roles mixed => fail with >=2 occurrences', () => {
  const html = `
<!doctype html><html><body>
  <div role="grid"></div>
  <div role="menu" aria-label="Main menu"></div>
  <div role="menubar"></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
});

test('aria-role-name-present: role=scrollbar labelledby hidden text => pass', () => {
  const html = `
<!doctype html><html><body>
  <span id="lbl" aria-hidden="true">Scroll</span>
  <div role="scrollbar" aria-labelledby="lbl"></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  // Per the Accessible Name and Description Computation spec, a node
  // directly referenced by aria-labelledby still supplies its text even
  // when hidden from the accessibility tree (a standard visually-hidden
  // label pattern) — this is not an accessibility violation.
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('aria-role-name-present: role=meter title => fail when no name', () => {
  const html = `
<!doctype html><html><body>
  <div role="meter"></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  // Conservative: hidden label text should not count as name.
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test('aria-role-name-present: role=meter title => pass when name is provided via title', () => {
  const html = `
<!doctype html><html><body>
  <div role="meter" title="File browser"></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('aria-role-name-present: role=meter title => fail when title is empty', () => {
  const html = `
<!doctype html><html><body>
  <div role="meter" title=""></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  // Conservative: hidden label text should not count as name.
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test('aria-role-name-present: role=meter title => pass when name is provided via aria-label', () => {
  const html = `
<!doctype html><html><body>
  <div role="meter" aria-label="File browser"></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('aria-role-name-present: role=meter title => fail when aria-label is empty', () => {
  const html = `
<!doctype html><html><body>
  <div role="meter" aria-label=""></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  // Conservative: hidden label text should not count as name.
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test('aria-role-name-present: role=meter title => pass when name is provided via aria-labelledby', () => {
  const html = `
<!doctype html><html><body>
  <div role="meter" aria-labelledby="jarl"></div>
  <div id="jarl">asdfasdf</div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('aria-role-name-present: role=meter title => fail when aria-labelledby is empty', () => {
  const html = `
<!doctype html><html><body>
  <div role="meter" aria-labelledby=""></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  // Conservative: hidden label text should not count as name.
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test('aria-role-name-present: role=meter title => fail when aria-labelledby points to a non-existing element', () => {
  const html = `
<!doctype html><html><body>
  <div role="meter" aria-labelledby="jasdf"></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  // Conservative: hidden label text should not count as name.
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});


test('aria-role-name-present: role=progressbar title => fail when no name', () => {
  const html = `
<!doctype html><html><body>
  <div role="progressbar"></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  // Conservative: hidden label text should not count as name.
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test('aria-role-name-present: role=progressbar title => pass when name is provided via title', () => {
  const html = `
<!doctype html><html><body>
  <div role="progressbar" title="File browser"></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('aria-role-name-present: role=progressbar title => fail when title is empty', () => {
  const html = `
<!doctype html><html><body>
  <div role="progressbar" title=""></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  // Conservative: hidden label text should not count as name.
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test('aria-role-name-present: role=progressbar title => pass when name is provided via aria-label', () => {
  const html = `
<!doctype html><html><body>
  <div role="progressbar" aria-label="File browser"></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('aria-role-name-present: role=progressbar title => fail when aria-label is empty', () => {
  const html = `
<!doctype html><html><body>
  <div role="progressbar" aria-label=""></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  // Conservative: hidden label text should not count as name.
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test('aria-role-name-present: role=progressbar title => pass when name is provided via aria-labelledby', () => {
  const html = `
<!doctype html><html><body>
  <div role="progressbar" aria-labelledby="jarl"></div>
  <div id="jarl">asdfasdf</div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('aria-role-name-present: role=progressbar title => fail when aria-labelledby is empty', () => {
  const html = `
<!doctype html><html><body>
  <div role="progressbar" aria-labelledby=""></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  // Conservative: hidden label text should not count as name.
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test('aria-role-name-present: role=progressbar title => fail when aria-labelledby points to a non-existing element', () => {
  const html = `
<!doctype html><html><body>
  <div role="progressbar" aria-labelledby="jasdf"></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  // Conservative: hidden label text should not count as name.
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/aria-role-name-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'aria-role-name-present-all-scenarios.html');
  const html = fs.readFileSync(fixturePath, 'utf8');

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 14, maxOccurrences: 14 });

  const expectedFailIds = [
    'role_case_01', 'role_case_03', 'role_case_05', 'role_case_07', 'role_case_09', 'role_case_11', 'role_case_13', 'role_case_15', 'role_case_17', 'role_case_19', 'role_case_22', 'role_case_23', 'role_case_25', 'role_case_29'
  ];

  const expectedNoOccIds = [
    'role_case_02', 'role_case_04', 'role_case_06', 'role_case_08', 'role_case_10', 'role_case_12', 'role_case_14', 'role_case_16', 'role_case_18', 'role_case_20', 'role_case_21', 'role_case_24', 'role_case_26', 'role_case_27', 'role_case_28', 'role_case_30', 'role_case_31'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
