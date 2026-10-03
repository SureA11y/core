'use strict';

/**
 * Two fixes for CodeQL alerts that change nothing visible, held here so
 * they stay fixed: the translation template parser stays fast on a long run
 * of braces, and the rule catalog's markdown escaping survives a backslash.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { translate } = require('../src/index.js').__internal;
const { escapePipes } = require('../scripts/generate-rule-catalog.js');

test('a long run of braces in a message renders quickly and correctly', () => {
  // The old pattern let a key contain a brace, and took about 2 seconds on
  // this; keys never contain one.
  const template = '{{name}} ' + '{{!'.repeat(20000);
  const start = Date.now();
  const out = translate('no.such.key', template, { name: 'Ana' }, 'en');
  const ms = Date.now() - start;
  assert.ok(out.startsWith('Ana {{!{{!'), out.slice(0, 20));
  assert.ok(ms < 500, `took ${ms}ms`);
  // Ordinary templates are unchanged, sections included.
  assert.equal(
    translate('no.such.key', '{{a}} and {{#b}}yes{{/b}}{{^b}}no{{/b}}', { a: 'x', b: false }, 'en'),
    'x and no'
  );
});

test('the rule catalog escapes a backslash before escaping a pipe', () => {
  // Unescaped, the backslash in `a\|b` would escape the pipe the catalog
  // adds, and the cell would end there.
  assert.equal(escapePipes('a|b'), 'a\\|b');
  assert.equal(escapePipes('a\\|b'), 'a\\\\\\|b');
  assert.equal(escapePipes('C:\\path'), 'C:\\\\path');
});
