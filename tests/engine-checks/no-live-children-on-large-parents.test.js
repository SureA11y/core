'use strict';

/**
 * In jsdom, an element's `children` collection stays live once read, and
 * every later change under that element rebuilds it. Read on a parent with
 * thousands of children, it made a scan slow and closing the scanned
 * document quadratic (20,000 nodes: 7.3s to close after region alone, 38ms
 * without). Walks use firstElementChild / nextElementSibling instead; this
 * guards against a rule or helper reading `children` on a large parent
 * again.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { createDom, runa11yCoreOnDom } = require('../helpers/runa11yCoreOnHtml');

const LARGE = 200;

test('a full scan never reads children on a parent with many children', () => {
  const rows = '<div>Row</div>'.repeat(LARGE + 50);
  const dom = createDom(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main>Content</main>${rows}<ul>${'<li>Item</li>'.repeat(LARGE + 50)}</ul></body></html>`
  );
  const proto = dom.window.Element.prototype;
  const desc = Object.getOwnPropertyDescriptor(proto, 'children');
  assert.ok(desc && desc.get, 'jsdom defines children as a getter on Element');
  const readers = [];
  Object.defineProperty(proto, 'children', {
    configurable: true,
    get() {
      if (this.childElementCount > LARGE) readers.push(this.localName);
      return desc.get.call(this);
    }
  });

  const result = runa11yCoreOnDom(dom, { entryPointParity: false });
  assert.ok(result.checksResults.length > 100, 'every default rule ran');
  assert.deepEqual(readers, []);
});
