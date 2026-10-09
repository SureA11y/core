'use strict';

const test = require('node:test');
const { runa11yCoreOnHtml, assertRule } = require('@surea11y/core/testing');
const pack = require('../..');

const RULE = '__NAMESPACE__-new-window-review';

const scan = (html) =>
  runa11yCoreOnHtml(html, { engineOptions: { packs: [pack] }, runOnly: [RULE] });

test('a link opening a new window is asked about, never failed', () => {
  assertRule(scan('<a href="/report" target="_blank">Annual report</a>'), RULE, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
});

test('links that open in the same window are not applicable', () => {
  assertRule(scan('<a href="/report">Annual report</a>'), RULE, 'notApplicable');
});
