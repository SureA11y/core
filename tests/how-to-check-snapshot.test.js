'use strict';

/**
 * The steps a person is shown for an undecided finding are the same as
 * those recorded in tests/snapshots/how-to-check.json, before they moved into
 * src/procedures: for every core rule, reason code and locale, every rule's
 * meta.review, and the review dictionaries byte for byte. A difference is a
 * bug in what gives the steps: fix it, never the record.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { compute, RECORD } = require('./helpers/howToCheckSnapshot.js');

const record = require(RECORD);
const now = compute();

test('howToCheckFor gives every rule, code and locale the steps it gave before', () => {
  assert.ok(Object.keys(record.steps).length > 240);
  const changed = [];
  for (const [entry, byLocale] of Object.entries(record.steps)) {
    for (const [locale, digest] of Object.entries(byLocale)) {
      if (!now.steps[entry] || now.steps[entry][locale] !== digest) {
        changed.push(`${entry} ${locale}`);
      }
    }
  }
  assert.deepEqual(changed, []);
  assert.deepEqual(Object.keys(now.steps).sort(), Object.keys(record.steps).sort());
});

test('every rule’s meta.review is what it was', () => {
  assert.deepEqual(now.reviews, record.reviews);
});

test('the review dictionaries are byte for byte what they were', () => {
  assert.deepEqual(now.dictionaries, record.dictionaries);
});
