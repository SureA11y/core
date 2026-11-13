'use strict';

// helpers.runMemo(name): a WeakMap for one scan, the same for every rule that
// asks for that name, and a new one in the next scan. target-size-minimum and
// its variant target-size-enhanced keep their measurements of a target there,
// so the second rule of a scan reads them instead of measuring again.

const test = require('node:test');
const assert = require('node:assert/strict');

const { createDom, runa11yCoreOnDom } = require('../helpers/runa11yCoreOnHtml');
const { patchTargetSizeEnv } = require('../helpers/patchTargetSizeEnv');

const RULES = ['target-size-minimum', 'target-size-enhanced'];
const html = `<!doctype html><html><body>
  <button id="a" data-rect="100,100,30,30">A</button>
  <button id="b" data-rect="130,110,10,10">B</button>
</body></html>`;

const memos = (dom) => {
  const shared = dom.window.__a11ycoreSharedCache;
  const out = {};
  for (const [k, v] of Object.entries((shared && shared.dom) || {})) {
    if (k.startsWith('rules:')) out[k] = v;
  }
  return out;
};

test('runMemo gives the rules of one scan one map per name, and the next scan new ones', () => {
  const dom = createDom(html);
  patchTargetSizeEnv(dom);
  const a = dom.window.document.getElementById('a');

  runa11yCoreOnDom(dom, { engineOptions: { rules: RULES } });
  const first = memos(dom);
  const measure = first['rules:target-size-minimum:measure'];
  assert.ok(measure instanceof dom.window.WeakMap || measure instanceof WeakMap, 'a WeakMap');
  // Both rules measured A; it is kept once, under the base rule's name.
  assert.ok(measure.has(a), 'the measurement of A is kept');
  assert.deepEqual(
    Object.keys(first).filter((k) => k.includes('target-size-enhanced')),
    [],
    'the variant uses the base rule names'
  );

  runa11yCoreOnDom(dom, { engineOptions: { rules: RULES } });
  const second = memos(dom)['rules:target-size-minimum:measure'];
  assert.ok(second && second !== measure, 'the next scan starts a new map');
});
