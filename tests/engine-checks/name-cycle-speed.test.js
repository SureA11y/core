'use strict';

// A label that names an svg inside it, through an aria-labelledby that also
// lists a control the same label names, is a cycle: working out the svg's
// name re-entered the label's, and each level branched again, thousands of
// walks for a few elements (1 s each in jsdom, 16 s on a fuzz page). An
// element met again while its own text is being worked out gives no text,
// as accname visits a node once; the names don't change.

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../../src/testing.js');

const CYCLE = (i) =>
  `<label id="L${i}">Hello<span id="A${i}"><textarea role="document"></textarea></span>` +
  `<svg aria-labelledby="L${i} A${i}">x</svg></label>`;

test('a label naming an svg inside it is worked out quickly, with the same names', () => {
  const page =
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
    [0, 1, 2, 3].map(CYCLE).join('') +
    '</main></body></html>';
  const started = Date.now();
  const result = runa11yCoreOnHtml(page, {
    runOnly: ['svg-text-alternative-present', 'svg-text-alternative-quality'],
    entryPointParity: false
  });
  const ms = Date.now() - started;
  assert.ok(ms < 2500, `${ms} ms`);
  assert.deepEqual(
    result.checksResults.map((c) => [c.ruleId, c.outcome, c.occurrences.length]),
    [
      ['svg-text-alternative-present', 'pass', 0],
      ['svg-text-alternative-quality', 'cantTell', 4]
    ]
  );
});
