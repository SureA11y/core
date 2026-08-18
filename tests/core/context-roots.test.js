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
 * the comma-separated string, the array form, an unparseable selector and a
 * document with no elements to fall back to are all pinned here instead.
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
  const { ctxSelector, roots } = resolveContextRoots(document, ['', '   ', null, 42]);

  assert.strictEqual(ctxSelector, null);
  assert.deepStrictEqual(roots, [document.documentElement]);
});

test('resolveContextRoots: a selector that matches nothing falls back to the whole document', () => {
  const document = docFrom(PAGE);
  const { ctxSelector, roots } = resolveContextRoots(document, '#nothing-here');

  assert.strictEqual(ctxSelector, '#nothing-here', 'the requested scope is still reported back');
  assert.deepStrictEqual(roots, [document.documentElement]);
});

test('resolveContextRoots: an unparseable selector is skipped rather than thrown on', () => {
  const document = docFrom(PAGE);

  const { roots } = resolveContextRoots(document, ['>>> not a selector', '#main']);
  assert.deepStrictEqual(
    roots.map((el) => el.id),
    ['main'],
    'the valid selector in the list still resolves'
  );

  assert.deepStrictEqual(
    resolveContextRoots(document, '>>> not a selector').roots,
    [document.documentElement],
    'an unparseable selector alone falls back to the whole document'
  );
});

test('resolveContextRoots: a document with no elements at all resolves to no roots', () => {
  const { window } = new JSDOM('', { url: 'https://example.test/' });
  const empty = window.document.implementation.createDocument(null, null, null);

  assert.strictEqual(empty.documentElement, null);
  assert.deepStrictEqual(resolveContextRoots(empty, null).roots, []);
  assert.deepStrictEqual(resolveContextRoots(empty, '#main').roots, []);
});
