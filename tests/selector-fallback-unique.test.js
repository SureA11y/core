'use strict';

// An occurrence's selector names the reported element. Under jsdom, the
// selector engine didn't confirm some paths (an SVG element's camelCase
// name lowercased, foreignObject as foreignobject; an escaped backslash in an
// id), and the fallback then used the element's id although another element
// shared it, or a bare tag: two duplicate ids got the same `#dup`, which
// names the first. Paths now keep a foreign element's name as written, and
// the fallback stands in only when it names the element alone.

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { runa11yCoreOnDom } = require('../src/testing.js');

for (const [name, body] of [
  [
    'inside an SVG foreignObject',
    '<svg><foreignObject><p id="dup">a</p><p id="dup">b</p></foreignObject></svg>'
  ],
  ['under an id with a backslash', '<div id="a\\b"><h5 id="dup">H</h5><p id="dup">x</p></div>']
]) {
  test(`each duplicate id's selector names its own element, ${name}`, () => {
    const dom = new JSDOM(
      `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`
    );
    const result = runa11yCoreOnDom(dom, {
      runOnly: ['duplicate-id'],
      entryPointParity: false,
      engineOptions: { wcagVersion: '2.1' }
    });
    const occurrences = result.checksResults[0].occurrences;
    assert.equal(occurrences.length, 2);
    const doc = dom.window.document;
    const named = occurrences.map((o) => doc.querySelector(o.selector));
    assert.ok(named.every(Boolean), JSON.stringify(occurrences.map((o) => o.selector)));
    assert.notEqual(named[0], named[1]);
    for (const [i, o] of occurrences.entries()) assert.equal(named[i].outerHTML, o.html);
  });
}
