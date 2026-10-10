'use strict';

/**
 * An occurrence's selector climbs 20 steps at most. Two elements deeper
 * than that, with no unique anchor on the way and the same last 20 steps,
 * shared one selector, which resolved to the first of them for both. The
 * path now goes on up when its 20 steps are shared, until it names its
 * element alone; a deep element whose 20 steps are its own keeps them.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { createDom, runa11yCoreOnDom } = require('../src/testing.js');

const nest = (depth, inner) => '<div>'.repeat(depth) + inner + '</div>'.repeat(depth);

function scan(body) {
  const dom = createDom(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`
  );
  const r = runa11yCoreOnDom(dom, { runOnly: ['button-name-present'] });
  const c = r.checksResults.find((x) => x.ruleId === 'button-name-present');
  return { doc: dom.window.document, occurrences: c.occurrences };
}

test('two deep elements sharing their last 20 steps get selectors of their own', () => {
  const { doc, occurrences } = scan(
    `<section>${nest(30, '<button></button>')}</section><article>${nest(30, '<button></button>')}</article>`
  );
  const buttons = [...doc.querySelectorAll('button')];
  assert.equal(occurrences.length, 2);
  occurrences.forEach((o, i) => {
    const found = doc.querySelectorAll(o.selector);
    assert.equal(found.length, 1, o.selector);
    assert.equal(found[0], buttons[i]);
  });
});

test('a deep element whose last 20 steps are its own keeps a 20-step selector', () => {
  const { doc, occurrences } = scan(nest(30, '<button></button>'));
  assert.equal(occurrences.length, 1);
  const { selector } = occurrences[0];
  assert.equal(selector.split(' > ').length, 20);
  assert.equal(doc.querySelectorAll(selector).length, 1);
});
