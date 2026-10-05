'use strict';

/**
 * Unit tests for helpers.getTextAlternativeSignal and
 * helpers.describeTextAlternativeSignal, which img-alt-quality,
 * area-alt-quality and input-image-alt-quality share. The rule tests run them
 * through their fixtures; the edges of the helpers' own contract are pinned
 * here: empty text, an element with no src, an element with no language, and
 * the message each signal gets.
 */

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');

const { createDomHelpers } = require('../../src/core/dom-helpers.js');

function setup(html) {
  const { window } = new JSDOM(html, { url: 'https://example.test/' });
  const { document } = window;
  return { helpers: createDomHelpers({ window, document, root: document }), document };
}

test('getTextAlternativeSignal: empty or missing text has no signal', () => {
  const { helpers, document } = setup('<img id="i" src="IMG_1234.jpg">');
  const el = document.getElementById('i');
  for (const text of [null, undefined, '', '   ']) {
    assert.strictEqual(helpers.getTextAlternativeSignal(el, text), null, JSON.stringify(text));
  }
});

test('getTextAlternativeSignal: an element without src is judged on its text alone', () => {
  const { helpers, document } = setup(
    '<map name="m"><area id="a" href="/x" alt="x"></map><p id="p">x</p>'
  );
  const area = document.getElementById('a');
  assert.deepStrictEqual(helpers.getTextAlternativeSignal(area, 'map_02.png'), {
    altSignal: 'file-name'
  });
  assert.strictEqual(helpers.getTextAlternativeSignal(area, 'Opening hours'), null);
  assert.strictEqual(helpers.getTextAlternativeSignal(null, 'Opening hours'), null);
  assert.deepStrictEqual(helpers.getTextAlternativeSignal(null, 'TBD'), {
    altSignal: 'placeholder'
  });
});

test('getTextAlternativeSignal: the element’s own file name counts only when it looks like one', () => {
  const { helpers, document } = setup(
    '<img id="a" src="/i/hero_banner_v2.webp"><img id="b" src="/i/search.svg"><img id="c" src="/i/photo%20one.JPG">'
  );
  const signal = (id, text) => helpers.getTextAlternativeSignal(document.getElementById(id), text);
  assert.deepStrictEqual(signal('a', 'hero_banner_v2'), { altSignal: 'file-name' });
  assert.strictEqual(signal('b', 'Search'), null);
  assert.deepStrictEqual(signal('c', 'photo one.jpg'), { altSignal: 'file-name' });
});

test('describeTextAlternativeSignal: every signal has a message naming the element', () => {
  const { helpers } = setup('<p>x</p>');
  for (const altSignal of ['file-name', 'url', 'placeholder', 'redundant-prefix', 'too-long']) {
    const signal =
      altSignal === 'too-long' ? { altSignal, length: 200, limit: 150 } : { altSignal };
    const m = helpers.describeTextAlternativeSignal(signal, 'area');
    assert.ok(m.summary.startsWith('The text alternative of this <area>'), m.summary);
    assert.ok(!m.summary.includes('{{'), m.summary);
    assert.match(m.i18n.summaryKey, /^textAlternative_summary_cantTell[A-Z]/);
    assert.strictEqual(m.i18n.hintKey, m.i18n.summaryKey.replace('_summary_', '_hint_'), altSignal);
    assert.strictEqual(m.i18n.params.element, 'area');
    if (altSignal === 'too-long') {
      assert.strictEqual(m.i18n.params.length, 200);
      assert.ok(m.summary.includes('200 characters'), m.summary);
    }
  }
  assert.strictEqual(helpers.describeTextAlternativeSignal(null, 'img'), null);
  assert.strictEqual(helpers.describeTextAlternativeSignal({ altSignal: 'other' }, 'img'), null);
});
