'use strict';

const test = require('node:test');
const { runa11yCoreOnHtml, assertRule } = require('@surea11y/core/testing');
const pack = require('../..');

const RULE = '__NAMESPACE__-contrast-enhanced';

const scan = (html) =>
  runa11yCoreOnHtml(html, {
    engineOptions: { packs: [pack] },
    runOnly: [RULE, 'contrast-minimum']
  });

test('grey on white (4.5:1) meets core contrast-minimum but not 7:1', () => {
  const result = scan('<p style="color:#767676;background:#fff">Grey text</p>');
  assertRule(result, 'contrast-minimum', 'pass');
  assertRule(result, RULE, 'fail', { minOccurrences: 1 });
});

test('black on white passes', () => {
  assertRule(scan('<p style="color:#000;background:#fff">Black text</p>'), RULE, 'pass');
});
