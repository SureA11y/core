'use strict';

/**
 * @surea11y/core/testing scans a page through both entry points and asserts
 * they agree. jsdom keeps an element's computed style once read, and the
 * copy it gives back loses a longhand that overrides a shorthand from a
 * lower origin, so the second scan of the same DOM read
 * `background-image: none` where the first read the image, and the helpers
 * threw "entry points disagree" on a page they scan correctly. The second
 * scan reads a parse of its own (runa11yCoreOnHtml), or the same DOM with
 * jsdom's cache cleared (runa11yCoreOnDom).
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml, runa11yCoreOnDom, createDom } = require('../src/testing.js');

const HTML =
  '<!doctype html><html lang=en><head><title>t</title><style>*{color:#777;background:#888}</style></head>' +
  '<body><main><p style="background-image:url(hero.png)">Hello</p></main></body></html>';
const RULES = ['contrast-computable', 'contrast-minimum'];

const outcomes = (result) =>
  Object.fromEntries(result.checksResults.map((c) => [c.ruleId, c.outcome]));

test('runa11yCoreOnHtml: both entry points read text over an image as one', () => {
  const result = runa11yCoreOnHtml(HTML, { runOnly: RULES });
  assert.equal(outcomes(result)['contrast-computable'], 'cantTell');
});

test('runa11yCoreOnDom: both entry points read text over an image as one', () => {
  const dom = createDom(HTML);
  try {
    const result = runa11yCoreOnDom(dom, { runOnly: RULES });
    assert.equal(outcomes(result)['contrast-computable'], 'cantTell');
    // The DOM is left as it was.
    assert.equal(
      dom.window.document.documentElement.outerHTML,
      createDom(HTML).window.document.documentElement.outerHTML
    );
  } finally {
    dom.window.close();
  }
});
