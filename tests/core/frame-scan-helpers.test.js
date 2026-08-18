'use strict';

/**
 * Unit tests for the two pieces of src/core/frame-scan.js that stand on their
 * own: frame discovery and frame URL resolution.
 *
 * runa11yCoreAcrossFrames/a11yCoreEnableFrameResponder in the same module
 * reference the engine internals their generated IIFE supplies (runCore,
 * CHECK_DEFS, ...), so they are covered from the browser instead --
 * tests/core/frame-scan.test.js drives them through the real generated chunk
 * across a real origin boundary. findChildFrameElements and
 * getFrameElementUrl have no such dependency, and their interesting cases
 * are the ones a live page makes hard to stage: a root that cannot be
 * queried, a selector engine that throws, a frame whose contentWindow is
 * walled off cross-origin.
 */

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');

const { findChildFrameElements, getFrameElementUrl } = require('../../src/core/frame-scan.js');

function domFrom(html) {
  return new JSDOM(html, { url: 'https://example.test/' }).window.document;
}

test('findChildFrameElements collects <iframe> and <frame> in document order', () => {
  const document = domFrom(`<!doctype html><html><body>
    <iframe id="a"></iframe>
    <div><iframe id="b"></iframe></div>
    <iframe id="c"></iframe>
  </body></html>`);

  const found = findChildFrameElements([document]);
  assert.deepStrictEqual(
    found.map((el) => el.id),
    ['a', 'b', 'c']
  );
});

test('findChildFrameElements ignores everything that is not a frame', () => {
  const document = domFrom(`<!doctype html><html><body>
    <object data="x.pdf"></object>
    <embed src="x.swf">
    <img src="x.png">
  </body></html>`);

  assert.deepStrictEqual(findChildFrameElements([document]), []);
});

test('findChildFrameElements de-duplicates frames shared by overlapping roots', () => {
  const document = domFrom(`<!doctype html><html><body>
    <section id="outer"><div id="inner"><iframe id="shared"></iframe></div></section>
    <iframe id="only-in-document"></iframe>
  </body></html>`);

  const outer = document.getElementById('outer');
  const inner = document.getElementById('inner');

  const found = findChildFrameElements([document, outer, inner]);
  assert.deepStrictEqual(
    found.map((el) => el.id),
    ['shared', 'only-in-document'],
    'expected each frame exactly once, in the order the first root reached it'
  );
});

test('findChildFrameElements skips roots it cannot query', () => {
  const document = domFrom('<!doctype html><html><body><iframe id="a"></iframe></body></html>');
  const textNode = document.createTextNode('not queryable');

  const found = findChildFrameElements([null, undefined, textNode, {}, 'a string', document]);
  assert.deepStrictEqual(
    found.map((el) => el.id),
    ['a']
  );
});

test('findChildFrameElements treats a throwing root as having no frames', () => {
  const document = domFrom('<!doctype html><html><body><iframe id="a"></iframe></body></html>');
  const hostile = {
    querySelectorAll() {
      throw new Error('selector engine exploded');
    }
  };

  const found = findChildFrameElements([hostile, document]);
  assert.deepStrictEqual(
    found.map((el) => el.id),
    ['a']
  );
});

test('findChildFrameElements returns nothing for no roots at all', () => {
  assert.deepStrictEqual(findChildFrameElements([]), []);
});

test('getFrameElementUrl prefers the live contentWindow location', () => {
  const document = domFrom('<!doctype html><html><body></body></html>');
  const el = document.createElement('iframe');
  el.setAttribute('src', '/authored.html');
  Object.defineProperty(el, 'contentWindow', {
    value: { location: { href: 'https://child.test/live.html' } }
  });

  assert.strictEqual(getFrameElementUrl(el), 'https://child.test/live.html');
});

test('getFrameElementUrl falls back to src when contentWindow is walled off', () => {
  const document = domFrom('<!doctype html><html><body></body></html>');
  const el = document.createElement('iframe');
  el.setAttribute('src', 'https://cross.test/embed.html');
  Object.defineProperty(el, 'contentWindow', {
    get() {
      // What reading a cross-origin frame's location actually does.
      throw new Error('SecurityError: blocked a frame from accessing a cross-origin frame');
    }
  });

  assert.strictEqual(getFrameElementUrl(el), 'https://cross.test/embed.html');
});

test('getFrameElementUrl falls back to src when the frame has not loaded a document yet', () => {
  const document = domFrom('<!doctype html><html><body></body></html>');
  const el = document.createElement('iframe');
  el.setAttribute('src', 'https://cross.test/pending.html');
  Object.defineProperty(el, 'contentWindow', { value: null });

  assert.strictEqual(getFrameElementUrl(el), 'https://cross.test/pending.html');
});

test('getFrameElementUrl falls back to src when contentWindow has no usable href', () => {
  const document = domFrom('<!doctype html><html><body></body></html>');

  for (const contentWindow of [{}, { location: null }, { location: { href: '' } }]) {
    const el = document.createElement('iframe');
    el.setAttribute('src', 'https://cross.test/embed.html');
    Object.defineProperty(el, 'contentWindow', { value: contentWindow });
    assert.strictEqual(getFrameElementUrl(el), 'https://cross.test/embed.html');
  }
});

test('getFrameElementUrl returns null for a srcless frame', () => {
  const document = domFrom('<!doctype html><html><body><iframe id="a"></iframe></body></html>');
  const el = document.getElementById('a');
  Object.defineProperty(el, 'contentWindow', { value: null });

  assert.strictEqual(getFrameElementUrl(el), null);
});

test('getFrameElementUrl returns null for something that is not an element', () => {
  assert.strictEqual(getFrameElementUrl({}), null);
  assert.strictEqual(getFrameElementUrl({ contentWindow: null }), null);
});
