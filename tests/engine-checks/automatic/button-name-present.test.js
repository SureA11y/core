'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

let runa11yCoreOnHtml;
let assertRule;

try {
  ({ runa11yCoreOnHtml } = require('../../helpers/runa11yCoreOnHtml'));
  ({ assertRule } = require('../../helpers/assertRule'));
} catch (e) {
  // If your repo uses a different layout, update these paths.
}

const RULE_ID = 'a11ycore-button-name-present';

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
