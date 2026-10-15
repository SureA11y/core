'use strict';

// Some patterns retried a run of characters from every position in it, so a
// long value cost the square of its length: at 80,000 characters,
// page-title-patterns took 19 s on a <title>, autocomplete-valid 7 s on an
// autocomplete value, and the alt-text helpers seconds on a file-like name
// or trailing dots. A hostile page could stall a scan that way. They now
// step over the run once. The limit below is far above what the fixed code
// takes (a few milliseconds) and far below the old cost, so it doesn't
// flake under load.

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../../src/testing.js');

const N = 60000;
const LIMIT_MS = 2000;

const page = (head, body) =>
  `<!doctype html><html lang="en"><head>${head}</head><body><main>${body}</main></body></html>`;

const CASES = [
  ['a long <title>', 'page-title-patterns', page(`<title>${'a'.repeat(N)}</title>`, '<h1>x</h1>')],
  [
    'an autocomplete value with a long run of spaces',
    'autocomplete-valid',
    page('<title>t</title>', `<label>Email <input autocomplete="a${' '.repeat(N)}!"></label>`)
  ],
  [
    'an alt that looks like a long file name',
    'img-alt-quality',
    page('<title>t</title>', `<img src="a.png" alt="IMG_${'1'.repeat(N)}.jpgx">`)
  ],
  [
    'an alt ending in a long run of dots',
    'img-alt-quality',
    page('<title>t</title>', `<img src="a.png" alt="a${'.'.repeat(N)}x">`)
  ],
  [
    'a heading ending in a long run of dots',
    'heading-quality',
    page('<title>t</title>', `<h1>a${'.'.repeat(N)}x</h1>`)
  ],
  [
    'a label ending in a long run of dots',
    'form-control-label-quality',
    page('<title>t</title>', `<label>a${'.'.repeat(N)}x <input></label>`)
  ]
];

for (const [name, ruleId, html] of CASES) {
  test(`${ruleId} is quick on ${name}`, () => {
    const started = Date.now();
    const result = runa11yCoreOnHtml(html, { runOnly: [ruleId], entryPointParity: false });
    const ms = Date.now() - started;
    assert.equal(result.checksResults[0].error, undefined);
    assert.ok(ms < LIMIT_MS, `${ms} ms`);
  });
}

test('the patterns still match what they matched', () => {
  const run = (ruleId, html) =>
    runa11yCoreOnHtml(html, { runOnly: [ruleId], entryPointParity: false }).checksResults[0];
  const title = (t) => run('page-title-patterns', page(`<title>${t}</title>`, '<h1>x</h1>'));
  assert.equal(title('Acme | Home').outcome, 'cantTell');
  assert.equal(title('Acme - home').outcome, 'cantTell');
  assert.equal(title('Home: Acme').outcome, 'cantTell');
  assert.equal(title('Annual report 2026 for shareholders').occurrences.length, 0);
  const alt = (a) =>
    run('img-alt-quality', page('<title>t</title>', `<img src="a.png" alt="${a}">`));
  assert.ok(JSON.stringify(alt('IMG_20260101_1234').occurrences).includes('ileName'));
  assert.ok(!JSON.stringify(alt('A cat on a sofa.').occurrences).includes('ileName'));
  const auto = (v) =>
    run(
      'autocomplete-valid',
      page('<title>t</title>', `<label>Email <input autocomplete="${v}"></label>`)
    );
  assert.equal(auto('  email  ').outcome, 'pass');
  assert.equal(auto('emial').outcome, 'fail');
});
