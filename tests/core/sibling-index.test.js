'use strict';

/**
 * Selectors and structural paths need an element's position among its
 * siblings. Counting the siblings for every occurrence made a rule that
 * reports thousands of siblings quadratic: link-in-text-block on 10,000
 * paragraphs with a color-only link each took 2.4s in Chromium, against
 * 0.7s now. A parent's children are indexed once per run, and indexed again
 * when the engine itself inserts an element first or last, as
 * text-spacing-content-loss does with its style sheet in <head>.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { createDomHelpers } = require('../../src/core/dom-helpers.js');
const { createDom, runa11yCoreOnDom } = require('../helpers/runa11yCoreOnHtml');

function helpersFor(html) {
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  const { window } = dom;
  const { document } = window;
  return { document, helpers: createDomHelpers({ window, document, root: document }) };
}

test('sibling index: selectors and paths match counting each time', () => {
  const { document, helpers } = helpersFor(
    '<!doctype html><html><body><main><p>a</p><div>b</div><p>c</p><span>d</span><p>e</p></main></body></html>'
  );
  const main = document.querySelector('main');
  for (let el = main.firstElementChild, i = 0; el; el = el.nextElementSibling, i++) {
    const path = helpers.buildStructuralPath(el);
    assert.equal(path[path.length - 1], i);
    const selector = helpers.buildSelector(el);
    assert.equal(document.querySelector(selector), el, selector);
  }
  assert.match(helpers.buildSelector(main.children[2]), /p:nth-of-type\(2\)$/);
  assert.match(
    helpers.buildSelector(main.children[1]),
    /> div$/,
    'a tag of its own needs no index'
  );
});

test('sibling index: an element inserted first or last is seen', () => {
  const { document, helpers } = helpersFor(
    '<!doctype html><html><head><title>t</title></head><body><p>a</p><p>b</p></body></html>'
  );
  const title = document.querySelector('title');
  const b = document.querySelectorAll('p')[1];
  assert.deepEqual(helpers.buildStructuralPath(title), [0, 0]);
  assert.deepEqual(helpers.buildStructuralPath(b), [1, 1]);

  const sheet = document.createElement('style');
  document.head.insertBefore(sheet, document.head.firstChild);
  assert.deepEqual(helpers.buildStructuralPath(title), [0, 1]);
  sheet.remove();
  assert.deepEqual(helpers.buildStructuralPath(title), [0, 0]);

  const probe = document.createElement('p');
  document.body.appendChild(probe);
  assert.deepEqual(helpers.buildStructuralPath(probe), [1, 2]);
  assert.ok(helpers.buildSelector(probe).endsWith('p:nth-of-type(3)'));
});

test('sibling index: reporting many siblings reads each sibling a bounded number of times', () => {
  // Every <img> is a finding with a selector and a structural path. The
  // engine's own reads of sibling links grow with the images, not their
  // square; jsdom's own reads, matching selectors, are not counted.
  const N = 400;
  const dom = createDom(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${'<img src="x.png">'.repeat(N)}</main></body></html>`
  );
  const main = dom.window.document.querySelector('main');
  const proto = dom.window.Element.prototype;
  const props = ['previousElementSibling', 'nextElementSibling'];
  const originals = props.map((name) => [name, Object.getOwnPropertyDescriptor(proto, name)]);
  let reads = 0;
  for (const [name, desc] of originals) {
    Object.defineProperty(proto, name, {
      configurable: true,
      get() {
        if (this.parentNode === main) {
          const caller = String(new Error().stack).split('\n')[2] || '';
          if (!caller.includes('node_modules')) reads++;
        }
        return desc.get.call(this);
      }
    });
  }
  try {
    const result = runa11yCoreOnDom(dom, { runOnly: ['img-alt-present'], entryPointParity: false });
    assert.equal(result.checksResults[0].occurrences.length, N);
  } finally {
    for (const [name, desc] of originals) Object.defineProperty(proto, name, desc);
  }
  assert.ok(reads < N * 20, `${reads} sibling reads for ${N} findings`);
});
