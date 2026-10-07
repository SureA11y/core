'use strict';

// Which frames a cross-frame scan reaches, and how a custom rule travels to
// them. See tests/engine-checks/frame-scan-reach-chromium.test.js for the
// same in a real browser.

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');

const { findChildFrameElements, engineOptionsForFrames } = require('../../src/core/frame-scan.js');

test('frames in open shadow roots, and a scope that is a frame, are found', () => {
  const { window } = new JSDOM(
    '<!doctype html><body><iframe id="a"></iframe><div id="host"></div><iframe id="b"></iframe></body>'
  );
  const { document } = window;
  document.getElementById('host').attachShadow({ mode: 'open' }).innerHTML =
    '<div><iframe id="c"></iframe></div>';
  const ids = (els) => els.map((el) => el.id);
  assert.deepStrictEqual(ids(findChildFrameElements([document])), ['a', 'b', 'c']);
  assert.deepStrictEqual(ids(findChildFrameElements([document.getElementById('b')])), ['b']);
});

test('custom rules go to child frames as source', () => {
  const run = function () {
    return { outcome: 'pass', occurrences: [] };
  };
  const out = engineOptionsForFrames({
    locale: 'en',
    customRules: [
      { id: 'x', runInPage: run, applicability: () => true },
      { id: 'y', runInPage: 'f' }
    ]
  });
  assert.strictEqual(out.locale, 'en');
  assert.strictEqual(out.customRules[0].runInPage, run.toString());
  assert.strictEqual(out.customRules[0].applicability, '() => true');
  assert.strictEqual(out.customRules[1].runInPage, 'f');
  assert.doesNotThrow(() => structuredClone(out));
  const plain = { locale: 'en' };
  assert.strictEqual(engineOptionsForFrames(plain), plain);
});
