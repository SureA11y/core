'use strict';

/**
 * Two fixes for CodeQL alerts that change nothing visible, held here so
 * they stay fixed: the translation template parser stays fast on a long run
 * of braces, and the rule catalog's markdown escaping survives a backslash.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { translate } = require('../src/index.js').__internal;
const { escapePipes, jsdocTag } = require('../scripts/generate-rule-catalog.js');
const { jsdocTag: reviewJsdocTag } = require('../scripts/lib/rule-review-data.js');

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

// A wrapped line of a rule's header that starts with "@" continues the tag
// above it: region's applicability stopped at "(or other own content, see"
// where the next line began "@implementation-notes)".
test('a wrapped header line starting with @ does not end the tag above it', () => {
  const source = [
    '/**',
    ' * @applicability',
    ' *   Applies to text of its own (or other own content, see',
    ' *   @implementation-notes) outside any landmark.',
    ' * @expectation',
    ' *   Content is inside a landmark.',
    ' */'
  ].join('\n');
  for (const parse of [jsdocTag, reviewJsdocTag]) {
    assert.equal(
      parse(source, 'applicability'),
      'Applies to text of its own (or other own content, see @implementation-notes) outside any landmark.'
    );
    assert.equal(parse(source, 'expectation'), 'Content is inside a landmark.');
  }
});

// A custom element whose shadowRoot getter throws: its shadow tree is
// unreadable, as a closed one is, and every other rule runs as usual. It
// used to put about 77 rules into cantTell with the getter's error.
test('a shadowRoot getter that throws is a tree the engine cannot read, not an error', () => {
  const { createDom, runa11yCoreOnDom } = require('./helpers/runDomRulesOnHtml.js');
  const dom = createDom(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>T</h1><x-bad>hi</x-bad><img src="a.png" alt="A"><p>text</p></main></body></html>'
  );
  dom.window.customElements.define(
    'x-bad',
    class extends dom.window.HTMLElement {
      get shadowRoot() {
        throw new Error('nope');
      }
    }
  );
  const result = runa11yCoreOnDom(dom, {});
  const errored = result.checksResults.filter((c) => c.error && !c.occurrences.length);
  assert.deepStrictEqual(
    errored.map((c) => c.ruleId),
    []
  );
});

// With profileRules, the shared caches are filled and timed before the
// first rule, so a rule that reads no styles is not charged for them.
test('profileRules times the shared cache warm-up apart from the rules', () => {
  const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');
  const body = '<div><span>x</span></div>'.repeat(300);
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`,
    {
      runOnly: ['aria-valid-attr', 'region'],
      engineOptions: { perfStats: true, profileRules: true }
    }
  );
  assert.equal(typeof result.perfStats.warmUpMs, 'number');
  assert.ok(result.perfStats.warmUpMs >= 0);
  assert.deepEqual(Object.keys(result.perfStats.ruleTimings).sort(), ['aria-valid-attr', 'region']);
  const plain = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`,
    { runOnly: ['aria-valid-attr'], engineOptions: { perfStats: true } }
  );
  assert.equal(plain.perfStats.warmUpMs, undefined);
});
