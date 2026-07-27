'use strict';

/**
 * TEST TEMPLATE NOTES
 * - Filtering / engine-mechanics checks should use normative automatic checks, not advisory/manual checks.
 * - If the rule under test is manual or advisory, it MUST NOT be expected to return `fail`.
 * - Prefer asserting stable evidence fields only (selector/summary/hint), not full HTML formatting.
 * - Optional: run twice and assert identical outcomes/occurrences for determinism.
 */

const test = require('node:test');
const { runa11yCoreOnHtml } = require('../tests/helpers/runa11yCoreOnHtml');
const { assertRule } = require('../tests/helpers/assertRule');

test('<kebab-id>: no applicable elements => notApplicable', () => {
  const html = `
<!doctype html><html><body>
  <!-- TODO: page with no applicable targets -->
</body></html>
  `;

  const result = runa11yCoreOnHtml(html);

  // Optional determinism check:
  // const result2 = runa11yCoreOnHtml(html);
  // assert.deepStrictEqual(result2, result);

  assertRule(result, '<kebab-id>', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test('<kebab-id>: failing case => fail with 1+ occurrences', () => {
  const html = `
<!doctype html><html><body>
  <!-- TODO: minimal failing fixture -->
</body></html>
  `;

  const result = runa11yCoreOnHtml(html);

  assertRule(result, '<kebab-id>', 'fail', {
    minOccurrences: 1
  });
});

test('<kebab-id>: passing case => pass', () => {
  const html = `
<!doctype html><html><body>
  <!-- TODO: minimal passing fixture -->
</body></html>
  `;

  const result = runa11yCoreOnHtml(html);

  assertRule(result, '<kebab-id>', 'pass', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

// Optional: only include if the rule can produce cantTell deterministically.
/*
test('<kebab-id>: manual judgment required => cantTell with 1+ occurrences', () => {
  const html = `
<!doctype html><html><body>
  <!-- TODO: fixture that requires human judgment per the standard -->
</body></html>
  `;

  const result = runa11yCoreOnHtml(html);

  assertRule(result, '<kebab-id>', 'cantTell', {
    minOccurrences: 1
  });
});
*/
