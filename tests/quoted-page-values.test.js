'use strict';

/**
 * Page values quoted in a finding are cut to 120 characters
 * (helpers.quoteText), never copied whole: a 200 KB id, role, lang,
 * autocomplete or aria-invalid value, or link name, reached the summary,
 * its parameters, the details and every report (round 8, NW-7). And a long
 * role token is not measured against every role for a near misspelling,
 * which took seconds (round 8).
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../src/testing.js');

const BIG = 'Z'.repeat(200000);

// The longest string anywhere in a value, and where it is.
function longest(value, at = '') {
  if (typeof value === 'string') return { length: value.length, at };
  let best = { length: 0, at };
  if (value && typeof value === 'object') {
    for (const k of Object.keys(value)) {
      // The element's markup and selector are the engine's own, capped elsewhere.
      if (/^(html|selector|snippet|target|xpath)$/i.test(k)) continue;
      const found = longest(value[k], at + '.' + k);
      if (found.length > best.length) best = found;
    }
  }
  return best;
}

test('page values quoted in findings are cut, not copied whole (NW-7)', () => {
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>h</h1>
<div role="${BIG}">r</div>
<input autocomplete="${BIG}" aria-label="x">
<p lang="${BIG}">x</p>
<div id="${BIG}">a</div><div id="${BIG}">b</div><span aria-labelledby="${BIG}">c</span>
<a href="/x">${BIG}</a><a href="/y">${BIG}</a>
<input type="text" aria-labelledby="nope-${BIG}">
<input type="text" aria-label="x" aria-invalid="${BIG}">
</main></body></html>`;
  const ids = [
    'duplicate-id-aria',
    'duplicate-id',
    'autocomplete-valid',
    'identical-links-same-purpose',
    'aria-roles-valid',
    'valid-lang',
    'form-control-programmatic-label-present',
    'invalid-field-error-message'
  ];
  const warn = console.warn;
  console.warn = () => {};
  let r;
  try {
    r = runa11yCoreOnHtml(html, { runOnly: ids });
  } finally {
    console.warn = warn;
  }
  for (const id of ids) {
    const c = r.checksResults.find((x) => x.ruleId === id);
    assert.ok(c, id);
    assert.ok(c.occurrences.length > 0, id + ' reports the value');
    const found = longest(c.occurrences);
    assert.ok(found.length < 1000, `${id}: ${found.length} characters at ${found.at}`);
  }
});
