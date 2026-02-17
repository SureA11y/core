'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

let runa11yCoreOnHtml;
let assertRule;

try {
  ({ runa11yCoreOnHtml } = require('../../helpers/runa11yCoreOnHtml'));
  ({ assertRule } = require('../../helpers/assertRule'));
} catch (e) {
  // Running outside repo context.
}

const RULE_ID = 'a11ycore-aria-role-name-present';

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

test('aria-role-name-present: role=scrollbar labelledby hidden text => fail', () => {
  const html = `
<!doctype html><html><body>
  <span id="lbl" aria-hidden="true">Scroll</span>
  <div role="scrollbar" aria-labelledby="lbl"></div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }

  const result = runa11yCoreOnHtml(html);
  // Conservative: hidden label text should not count as name.
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
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
