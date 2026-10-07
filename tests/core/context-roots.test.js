'use strict';

/**
 * Unit tests for src/core/dom-helpers.js's two module-level exports,
 * normalizeSelectorList and resolveContextRoots.
 *
 * These decide what a scan is actually pointed at. dom-runner.js calls
 * resolveContextRoots to scope a run, and frame-scan.js calls it again to work
 * out which child frames fall inside that same scope -- so a disagreement
 * about "what does this contextSelector resolve to" splits the frame tree away
 * from the page scan. Every engine test reaches them through a full scan,
 * which only ever exercises the single-string form on a well-formed document;
 * the comma-separated string, the array form, a selector that matches nothing,
 * an unparseable selector and a document with no elements are all pinned here
 * instead.
 */

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');

const { normalizeSelectorList, resolveContextRoots } = require('../../src/core/dom-helpers.js');

function docFrom(html) {
  return new JSDOM(html, { url: 'https://example.test/' }).window.document;
}

const PAGE = `<!doctype html><html><body>
  <main id="main"><p id="p1">one</p></main>
  <aside id="aside"><p id="p2">two</p></aside>
</body></html>`;

test('normalizeSelectorList: an array is trimmed, stringified and stripped of blanks', () => {
  assert.deepStrictEqual(normalizeSelectorList(['  #a  ', '#b', '', '   ']), ['#a', '#b']);
  // Entries are stringified before trimming, so a non-string entry becomes its
  // String() form rather than being dropped.
  assert.deepStrictEqual(normalizeSelectorList([1, null, '#c']), ['1', 'null', '#c']);
});

test('normalizeSelectorList: a comma-separated string splits into one selector per entry', () => {
  assert.deepStrictEqual(normalizeSelectorList('#a,#b'), ['#a', '#b']);
  assert.deepStrictEqual(normalizeSelectorList('#a, #b ,  #c '), ['#a', '#b', '#c']);
  assert.deepStrictEqual(normalizeSelectorList('  #only  '), ['#only']);
  assert.deepStrictEqual(normalizeSelectorList('#a,,#b,'), ['#a', '#b']);
});

// A comma inside a selector is no separator (#127): the string is a
// selector list, cut where CSS cuts one.
test('normalizeSelectorList: a string is cut only at commas between selectors', () => {
  assert.deepStrictEqual(normalizeSelectorList('img:not(.a, .b)'), ['img:not(.a, .b)']);
  assert.deepStrictEqual(normalizeSelectorList(':is(.a, .b), .c'), [':is(.a, .b)', '.c']);
  assert.deepStrictEqual(normalizeSelectorList('li:nth-child(odd of .a, .b) img'), [
    'li:nth-child(odd of .a, .b) img'
  ]);
  assert.deepStrictEqual(normalizeSelectorList('[title=","], [title=\',\'], .c'), [
    '[title=","]',
    "[title=',']",
    '.c'
  ]);
  // A quote inside the other kind, or escaped, does not end the string.
  assert.deepStrictEqual(normalizeSelectorList('[title="it\'s, x"], [title="a\\", b"], .c'), [
    '[title="it\'s, x"]',
    '[title="a\\", b"]',
    '.c'
  ]);
  assert.deepStrictEqual(normalizeSelectorList('.a\\,b, .c'), ['.a\\,b', '.c']);
  // An unbalanced bracket keeps the rest whole; it is no valid selector.
  assert.deepStrictEqual(normalizeSelectorList('.a, #bad[, .c'), ['.a', '#bad[, .c']);
  // A string means the same as the array of its selectors.
  assert.deepStrictEqual(
    normalizeSelectorList('img:not(.a, .b), .c'),
    normalizeSelectorList(['img:not(.a, .b)', '.c'])
  );
});

test('normalizeSelectorList: anything with no selectors in it is an empty list', () => {
  for (const value of [null, undefined, '', 0, false, [], '   ', ',,,', {}, 42, true]) {
    assert.deepStrictEqual(normalizeSelectorList(value), [], JSON.stringify(value));
  }
});

test('resolveContextRoots: no selector scans the whole document', () => {
  const document = docFrom(PAGE);

  for (const contextSelector of [null, undefined, '', '   ', [], ['', '  ']]) {
    const { ctxSelector, roots } = resolveContextRoots(document, contextSelector);
    assert.strictEqual(ctxSelector, null, JSON.stringify(contextSelector));
    assert.deepStrictEqual(roots, [document.documentElement]);
  }
});

test('resolveContextRoots: a single selector resolves to its matches', () => {
  const document = docFrom(PAGE);
  const { ctxSelector, roots } = resolveContextRoots(document, '  #main  ');

  assert.strictEqual(ctxSelector, '#main');
  assert.deepStrictEqual(roots, [document.getElementById('main')]);
});

test('resolveContextRoots: a selector matching several elements keeps them all, in document order', () => {
  const document = docFrom(PAGE);
  const { roots } = resolveContextRoots(document, 'p');

  assert.deepStrictEqual(
    roots.map((el) => el.id),
    ['p1', 'p2']
  );
});

test('resolveContextRoots: an array of selectors resolves in the order given, deduped', () => {
  const document = docFrom(PAGE);
  const { ctxSelector, roots } = resolveContextRoots(document, ['  #aside  ', '#main', '#aside']);

  assert.deepStrictEqual(
    ctxSelector,
    ['#aside', '#main', '#aside'],
    'the normalized selector list is reported back as given -- only the roots are deduped'
  );
  assert.deepStrictEqual(
    roots.map((el) => el.id),
    ['aside', 'main'],
    'resolution order, not document order -- and never the same element twice'
  );
});

test('resolveContextRoots: an array with only blanks in it is the same as no selector', () => {
  const document = docFrom(PAGE);
  const { ctxSelector, roots } = resolveContextRoots(document, ['', '   ']);

  assert.strictEqual(ctxSelector, null);
  assert.deepStrictEqual(roots, [document.documentElement]);
});

// Read as no scope, any of these scanned the whole page (#126).
test('resolveContextRoots: a scope that is not a selector throws a coded error naming it', () => {
  const document = docFrom(PAGE);
  const main = document.getElementById('main');
  const cases = [
    [
      main,
      /^contextSelector must be a CSS selector or an array of them, not an element \(<main>\)\. Pass a selector that matches it, such as "main"\.$/
    ],
    [document.querySelectorAll('main'), /not a NodeList\./],
    [document.getElementsByTagName('main'), /not an HTMLCollection\./],
    [
      { include: ['#main'], exclude: ['#aside'] },
      /not an \{ include, exclude \} object\. Pass the selectors to include as contextSelector, and those to leave out as engineOptions\.excludeSelectors\.$/
    ],
    [{ include: ['#main'] }, /not an \{ include, exclude \} object/],
    [{}, /not an object\./],
    [5, /not the number 5\./],
    [true, /not true\./],
    [() => '#main', /not a function\./],
    [[5], /^contextSelector\[0\] must be a CSS selector, not the number 5\.$/],
    [['#main', null], /^contextSelector\[1\] must be a CSS selector, not null\.$/],
    [[main], /^contextSelector\[0\] must be a CSS selector, not an element \(<main>\)\.$/],
    [[['#main']], /^contextSelector\[0\] must be a CSS selector, not an array\.$/]
  ];
  for (const [value, message] of cases) {
    assert.throws(
      () => resolveContextRoots(document, value),
      (err) => err.code === 'INVALID_CONTEXT_SELECTOR' && message.test(err.message),
      String(message)
    );
  }
});

test('resolveContextRoots: a selector that matches nothing resolves to no roots', () => {
  const document = docFrom(PAGE);
  const { ctxSelector, roots, unmatchedSelectors } = resolveContextRoots(document, '#nothing-here');

  assert.strictEqual(ctxSelector, '#nothing-here', 'the requested scope is still reported back');
  assert.deepStrictEqual(roots, [], 'never widened to the whole document');
  assert.deepStrictEqual(unmatchedSelectors, ['#nothing-here']);
});

test('resolveContextRoots: an array names each selector that matched nothing', () => {
  const document = docFrom(PAGE);
  const { roots, unmatchedSelectors } = resolveContextRoots(document, ['#main', '#gone', '.none']);

  assert.deepStrictEqual(
    roots.map((el) => el.id),
    ['main']
  );
  assert.deepStrictEqual(unmatchedSelectors, ['#gone', '.none']);
});

test('resolveContextRoots: an unparseable selector throws a coded error', () => {
  const document = docFrom(PAGE);

  for (const contextSelector of ['>>> not a selector', ['#main', '>>> not a selector']]) {
    assert.throws(
      () => resolveContextRoots(document, contextSelector),
      (err) =>
        err.code === 'INVALID_CONTEXT_SELECTOR' &&
        err.selector === '>>> not a selector' &&
        /^contextSelector: ">>> not a selector" is not a valid CSS selector\.$/.test(err.message),
      JSON.stringify(contextSelector)
    );
  }
});

test('resolveContextRoots: no selector reports no unmatched selectors', () => {
  assert.deepStrictEqual(resolveContextRoots(docFrom(PAGE), null).unmatchedSelectors, []);
});

test('resolveContextRoots: a document with no elements at all resolves to no roots', () => {
  const { window } = new JSDOM('', { url: 'https://example.test/' });
  const empty = window.document.implementation.createDocument(null, null, null);

  assert.strictEqual(empty.documentElement, null);
  assert.deepStrictEqual(resolveContextRoots(empty, null).roots, []);
  assert.deepStrictEqual(resolveContextRoots(empty, '#main').roots, []);
});
