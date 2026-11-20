'use strict';

/**
 * jsdom resolves an inherited value an element doesn't declare by recursing
 * into its parent's. Read first on an element a couple of thousand levels
 * deep, it ran out of stack or not depending on how much stack the caller
 * had used, so link-in-text-block asked about a link (ENGINE_EXCEPTION)
 * from one entry point, or in the first scan of a process, and passed it
 * from the other. Each read is now made with the elements above resolved
 * first, so both entry points, and every scan, read the same style.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { createDom, runa11yCoreOnDom } = require('../helpers/runDomRulesOnHtml.js');

function deepPage(depth) {
  const dom = createDom(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main id="m"></main></body></html>'
  );
  const { document } = dom.window;
  let cur = document.getElementById('m');
  for (let i = 0; i < depth; i++) {
    const span = document.createElement('span');
    span.appendChild(document.createTextNode('w' + i + ' '));
    cur.appendChild(span);
    cur = span;
  }
  const a = document.createElement('a');
  a.href = '/x';
  a.textContent = 'link';
  cur.appendChild(a);
  return dom;
}

test('a link 2,000 levels deep is judged alike from both entry points, every scan', () => {
  for (let run = 0; run < 2; run++) {
    // runa11yCoreOnDom scans in page and then in Node, and fails on any
    // difference between the two.
    const result = runa11yCoreOnDom(deepPage(2000), { runOnly: ['link-in-text-block'] });
    const check = result.checksResults.find((c) => c.ruleId === 'link-in-text-block');
    const codes = check.occurrences.map(
      (o) => o.data && o.data.details && o.data.details.reasonCode
    );
    assert.ok(!codes.includes('ENGINE_EXCEPTION'), `run ${run}: ${check.outcome} ${codes}`);
  }
});
