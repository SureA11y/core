'use strict';

// A label that names an svg inside it, through an aria-labelledby that also
// lists a control the same label names, is a cycle: working out the svg's
// name re-entered the label's, and each level branched again, thousands of
// walks for a few elements (1 s each in jsdom, 16 s on a fuzz page). An
// element met again while its own text is being worked out gives no text,
// as accname visits a node once; the names don't change.

const test = require('node:test');
const assert = require('node:assert/strict');

const { JSDOM } = require('jsdom');
const { runa11yCoreOnDom } = require('../../src/testing.js');

const CYCLE = (i) =>
  `<label id="L${i}">Hello<span id="A${i}"><textarea role="document"></textarea></span>` +
  `<svg aria-labelledby="L${i} A${i}">x</svg></label>`;

const RUN_ONLY = ['svg-text-alternative-present', 'svg-text-alternative-quality'];

// Scans a page of n such labels, and counts the attributes read: the work
// grows with the page, where the old walk grew with every level it branched.
// Counted rather than timed, so the test doesn't flake under load.
function scan(n) {
  const dom = new JSDOM(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
      Array.from({ length: n }, (_, i) => CYCLE(i)).join('') +
      '</main></body></html>'
  );
  const proto = dom.window.Element.prototype;
  const getAttribute = proto.getAttribute;
  let reads = 0;
  proto.getAttribute = function (...args) {
    reads++;
    return getAttribute.apply(this, args);
  };
  const result = runa11yCoreOnDom(dom, { runOnly: RUN_ONLY, entryPointParity: false });
  return { result, reads };
}

test('a label naming an svg inside it is worked out in work linear in the page, with the same names', () => {
  const four = scan(4);
  const eight = scan(8);
  assert.ok(eight.reads <= four.reads * 2.5, `${four.reads} reads for 4, ${eight.reads} for 8`);
  assert.deepEqual(
    four.result.checksResults.map((c) => [c.ruleId, c.outcome, c.occurrences.length]),
    [
      ['svg-text-alternative-present', 'pass', 0],
      ['svg-text-alternative-quality', 'cantTell', 4]
    ]
  );
});
