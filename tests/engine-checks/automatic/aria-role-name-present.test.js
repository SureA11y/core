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

const RULE_ID = 'aria-role-name-present';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test('aria-role-name-present: no applicable elements => notApplicable', () => {
  const html = `
<!doctype html><html><body>
  <div>no matching roles</div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

// WAI-ARIA marks tablist, toolbar, menu, menubar and scrollbar "Accessible
// Name Required: False" -- an author may name them, and the APG recommends it
// for a tablist, but an unnamed one is not an SC 4.1.2 failure. They are out
// of this rule's applicability entirely, so an unnamed one is notApplicable
// rather than pass: the rule has no verdict to give about them.
test('aria-role-name-present: role=tablist missing name => notApplicable (name allowed, not required)', () => {
  const html = `
<!doctype html><html><body>
  <div role="tablist">
    <div role="tab" aria-label="Overview"></div>
  </div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('aria-role-name-present: toolbar/menu/menubar/scrollbar missing name => notApplicable', () => {
  const html = `
<!doctype html><html><body>
  <div role="toolbar"></div>
  <div role="menu"></div>
  <div role="menubar"></div>
  <div role="scrollbar"></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('aria-role-name-present: role=grid aria-labelledby => pass', () => {
  const html = `
<!doctype html><html><body>
  <h2 id="t1">Recent orders</h2>
  <div role="grid" aria-labelledby="t1"></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('aria-role-name-present: role=radiogroup empty aria-label => fail', () => {
  const html = `
<!doctype html><html><body>
  <div role="radiogroup" aria-label=" "></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test('aria-role-name-present: role=tree title => pass', () => {
  const html = `
<!doctype html><html><body>
  <div role="tree" title="File browser"></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('aria-role-name-present: multiple roles mixed => fail with >=2 occurrences', () => {
  const html = `
<!doctype html><html><body>
  <div role="grid"></div>
  <div role="radiogroup"></div>
  <div role="tree" aria-label="File browser"></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
});

test('aria-role-name-present: unnamed not-required roles do not add occurrences to a fail', () => {
  const html = `
<!doctype html><html><body>
  <div role="grid"></div>
  <div role="tablist"></div>
  <div role="toolbar"></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

  const result = runa11yCoreOnHtml(html);
  // Only the grid is reported: the tablist and toolbar are out of scope, not
  // silently passing occurrences.
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test('aria-role-name-present: role=tree labelledby hidden text => pass', () => {
  const html = `
<!doctype html><html><body>
  <span id="lbl" aria-hidden="true">File browser</span>
  <div role="tree" aria-labelledby="lbl"></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

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

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

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

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('aria-role-name-present: role=meter title => fail when title is empty', () => {
  const html = `
<!doctype html><html><body>
  <div role="meter" title=""></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

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

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('aria-role-name-present: role=meter title => fail when aria-label is empty', () => {
  const html = `
<!doctype html><html><body>
  <div role="meter" aria-label=""></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

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

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('aria-role-name-present: role=meter title => fail when aria-labelledby is empty', () => {
  const html = `
<!doctype html><html><body>
  <div role="meter" aria-labelledby=""></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

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

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

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

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

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

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('aria-role-name-present: role=progressbar title => fail when title is empty', () => {
  const html = `
<!doctype html><html><body>
  <div role="progressbar" title=""></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

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

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('aria-role-name-present: role=progressbar title => fail when aria-label is empty', () => {
  const html = `
<!doctype html><html><body>
  <div role="progressbar" aria-label=""></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

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

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('aria-role-name-present: role=progressbar title => fail when aria-labelledby is empty', () => {
  const html = `
<!doctype html><html><body>
  <div role="progressbar" aria-labelledby=""></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

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

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

  const result = runa11yCoreOnHtml(html);
  // Conservative: hidden label text should not count as name.
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/aria-role-name-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'aria-role-name-present-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 10, maxOccurrences: 10 });

  const expectedFailIds = [
    'role_case_01',
    'role_case_03',
    'role_case_05',
    'role_case_07',
    'role_case_09',
    'role_case_12',
    'role_case_13',
    'role_case_14',
    'role_case_16',
    'role_case_20'
  ];

  const expectedNoOccIds = [
    'role_case_02',
    'role_case_04',
    'role_case_06',
    'role_case_08',
    'role_case_10',
    'role_case_11',
    'role_case_15',
    'role_case_17',
    'role_case_18',
    'role_case_19',
    'role_case_21',
    'role_case_22',
    // Section G: name allowed but not required, so out of applicability.
    'role_case_23',
    'role_case_24',
    'role_case_25',
    'role_case_26',
    'role_case_27'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

// The rule's whole applicability is now one spec fact: WAI-ARIA's "Accessible
// Name Required: True" characteristic. Reading the generated block back out of
// the source and re-deriving it from aria-query is what keeps that honest --
// scripts/generate-aria-tables.js writes the block, but nothing in CI runs its
// --check, so without this the set could be hand-edited back to a hand-picked
// allowlist (the defect this rule was fixed for) with the suite still green.
test("aria-role-name-present: the generated role set is exactly ARIA's name-required roles", () => {
  let roles;
  try {
    ({ roles } = require('aria-query'));
  } catch {
    // aria-query is a devDependency; skip when running outside the repo.
    assert.ok(true);
    return;
  }

  const source = fs.readFileSync(
    path.join(__dirname, '..', '..', '..', 'src', 'checks', 'automatic', `${RULE_ID}.js`),
    'utf8'
  );
  const block = source.match(
    /\/\/ <generated:aria-name-required-roles>([\s\S]*?)\/\/ <\/generated:aria-name-required-roles>/
  );
  assert.ok(block, 'generated:aria-name-required-roles block not found');

  const listed = [...block[1].matchAll(/'([a-z-]+)'/g)].map((m) => m[1]);
  assert.ok(listed.length > 0, 'generated role set is empty');

  for (const role of listed) {
    const def = roles.get(role);
    assert.ok(def, `aria-query no longer defines role: ${role}`);
    assert.equal(
      def.accessibleNameRequired,
      true,
      `${role} is listed but WAI-ARIA does not require an accessible name for it`
    );
    assert.equal(
      (def.nameFrom || []).includes('contents'),
      false,
      `${role} can take its name from contents, which this rule never accepts`
    );
  }

  // The roles this rule used to fail: allowed to have a name, not required to.
  for (const role of ['tablist', 'toolbar', 'menu', 'menubar', 'scrollbar']) {
    assert.equal(
      roles.get(role).accessibleNameRequired,
      false,
      `${role} now requires an accessible name and should be reconsidered for this rule`
    );
    assert.equal(listed.includes(role), false, `${role} must not be in the name-required set`);
  }
});
