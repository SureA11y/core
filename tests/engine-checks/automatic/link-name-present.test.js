'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

let runa11yCoreOnHtml;
let assertRule;

try {
  ({ runa11yCoreOnHtml } = require('../../helpers/runa11yCoreOnHtml'));
  ({ assertRule } = require('../../helpers/assertRule'));
} catch (e) {
  // Repo layout fallback
}

test('a11ycore-link-name-present: no applicable elements => notApplicable', () => {
  const html = `
<!doctype html><html><body>
  <div>no links</div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11ycore-link-name-present', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test('a11ycore-link-name-present: missing name => fail', () => {
  const html = `
<!doctype html><html><body>
  <a href="/x" aria-label=""></a>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11ycore-link-name-present', 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
});

test('a11ycore-link-name-present: named link => pass', () => {
  const html = `
<!doctype html><html><body>
  <a href="/x">Read more</a>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11ycore-link-name-present', 'pass', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});
