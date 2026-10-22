'use strict';

/**
 * The browser bundle stays within a size budget. Every browser integration
 * sends the whole bundle into each page it scans, and the browser parses and
 * compiles it there, before the scan and on top of it: a cost the scan's own
 * timings never show. It grew a third in three releases (1.9.0: 837 KB,
 * 1.10.0: 885 KB, 1.11.1: 1,047 KB, 1.12.0: 1,105 KB), each step for real
 * features, and loading it into a page went from 154 to 211 ms on a 4-core
 * cloud machine.
 *
 * A change that takes the bundle past its budget fails here. If what it adds
 * is worth its size, raise the budget in the same commit and say in the
 * commit what the bytes pay for, so that growth is a decision rather than a
 * surprise. The locale side files have budgets of their own: a page loads at
 * most one of them, with the bundle.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const KB = 1024;

// [file, budget in KB]: about 5% above the size when the budget was set.
const BUDGETS = [
  ['surea11y.browser.js', 1258],
  ['surea11y.i18n.de.js', 156],
  ['surea11y.i18n.es.js', 151],
  ['surea11y.i18n.fr.js', 157],
  ['surea11y.i18n.ja.js', 183]
];

test('every built locale side file has a budget', () => {
  const sideFiles = fs
    .readdirSync(ROOT)
    .filter((f) => /^surea11y\.i18n\.[\w-]+\.js$/.test(f))
    .sort();
  assert.deepEqual(
    sideFiles,
    BUDGETS.map(([f]) => f).filter((f) => f !== 'surea11y.browser.js'),
    'a new locale needs its own budget here'
  );
});

for (const [file, budgetKb] of BUDGETS) {
  test(`${file} stays within ${budgetKb} KB`, () => {
    const kb = fs.statSync(path.join(ROOT, file)).size / KB;
    assert.ok(
      kb <= budgetKb,
      `${file} is ${kb.toFixed(0)} KB, past its budget of ${budgetKb} KB. If the growth is worth it, raise the budget in tests/bundle-size.test.js and say in the commit what it pays for.`
    );
  });
}
