'use strict';

const test = require('node:test');
const { runa11yCoreOnHtml, assertRule } = require('@surea11y/core/testing');
const pack = require('../..');

const RULE = '__NAMESPACE__-link-text-specific';

// The pack's rules are opt-in: a scan runs them under its profiles, or when it
// asks for them by id, as here.
const scan = (html) =>
  runa11yCoreOnHtml(html, { engineOptions: { packs: [pack] }, runOnly: [RULE] });

test('a link named only "click here" fails, in any case and spacing', () => {
  assertRule(scan('<a href="/report">Click  HERE</a>'), RULE, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
});

test('a link named by where it goes passes', () => {
  assertRule(scan('<a href="/report">The 2026 annual report</a>'), RULE, 'pass');
});

test('aria-label names the link, whatever its text', () => {
  assertRule(scan('<a href="/report" aria-label="Annual report">Read more</a>'), RULE, 'pass');
});

test('a page without links is not applicable', () => {
  assertRule(scan('<p>No links</p>'), RULE, 'notApplicable');
});
