'use strict';

/**
 * src/coverage/wcag-titles.js gives every criterion the title that
 * src/coverage/wcag-facets.js gives it, so src/wcag.js and the HTML report
 * can read the titles without carrying every facet's label.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { WCAG_TITLES } = require('../../src/coverage/wcag-titles.js');
const { FACETS } = require('../../src/coverage/wcag-facets.js');

test('every criterion has the title the facets give it', () => {
  assert.deepEqual(
    WCAG_TITLES,
    Object.fromEntries(Object.entries(FACETS).map(([sc, c]) => [sc, c.title]))
  );
  assert.ok(Object.isFrozen(WCAG_TITLES));
});
