'use strict';

// A selector a rule builds from an id by hand is escaped as CSS reads it,
// so it names the element it was built from: an id that opens with a digit,
// or holds a dot or a colon, is no CSS identifier as written, and '#' + id
// either doesn't parse or names another element. An id no selector can name
// (one holding a NUL or a lone surrogate, which CSS reads as U+FFFD) gives
// way to another anchor.

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { createDomHelpers } = require('../../src/core/dom-helpers.js');
const { createDom, runa11yCoreOnDom } = require('../helpers/runa11yCoreOnHtml');
const { patchTargetSizeEnv } = require('../helpers/patchTargetSizeEnv');
const targetSize = require('../../src/checks/automatic/target-size-minimum.js');

const ODD_IDS = ['1abc', 'a.b', 'md:x', '-2', 'q"x'];

test('helpers.cssEscape escapes as CSS.escape does, with or without CSS.escape', () => {
  const dom = new JSDOM('<!doctype html><body></body>');
  const { window } = dom;
  const helpers = createDomHelpers({ window, document: window.document, root: window.document });
  assert.equal(helpers.cssEscape('1abc'), '\\31 abc');
  assert.equal(helpers.cssEscape('a.b'), 'a\\.b');
  assert.equal(helpers.cssEscape('-2'), '-\\32 ');
  assert.equal(helpers.cssEscape('-'), '\\-');
  assert.equal(helpers.cssEscape('a\nb'), 'a\\a b');
  assert.equal(helpers.cssEscape('a\u0000b'), 'a�b');
  for (const id of ODD_IDS) {
    const el = window.document.body.appendChild(window.document.createElement('i'));
    el.id = id;
    assert.equal(window.document.querySelector('#' + helpers.cssEscape(id)), el, id);
  }
});

for (const ruleId of ['contrast-minimum', 'contrast-enhanced']) {
  test(`${ruleId}: details.node.selector names the element its id belongs to`, () => {
    const spans = ODD_IDS.map(
      (id, i) => `<p><span id='${id}' style="color:#999">Low contrast ${i}</span></p>`
    ).join('');
    const dom = createDom(
      `<!doctype html><html lang="en"><head><title>t</title></head><body style="background:#fff">${spans}` +
        // A second element with the id: '#id' would name the first.
        `<p id="dup">x</p><p><span id="lone" style="color:#999">Lone surrogate</span></p></body></html>`
    );
    const { document } = dom.window;
    document.getElementById('lone').id = 'lone\ud800x';
    const result = runa11yCoreOnDom(dom, { engineOptions: { rules: [ruleId] } });
    const check = result.checksResults.find((c) => c.ruleId === ruleId);
    const seen = new Map();
    for (const occ of check.occurrences) {
      const node = occ.data && occ.data.details && occ.data.details.node;
      if (!node) continue;
      const el = document.querySelector(occ.selector);
      seen.set(el.id, node.selector);
    }
    for (const id of ODD_IDS) {
      assert.ok(seen.has(id), `${id} is reported`);
      assert.equal(document.querySelector(seen.get(id)), document.getElementById(id), id);
    }
    // No selector names this id: none is given rather than one naming nothing.
    assert.equal(seen.get('lone\ud800x'), '');
  });
}

test("target-size-minimum: without the engine's selector builder, conflictWith escapes the id", () => {
  const dom = createDom(
    `<!doctype html><html><body>
      <button id="small" data-rect="10,10,10,10">Small</button>
      <button id="1.big" data-rect="20,10,30,30">Big</button>
    </body></html>`
  );
  patchTargetSizeEnv(dom);
  const { window } = dom;
  const { document } = window;
  const real = createDomHelpers({ window, document, root: document });
  const helpers = Object.create(real);
  helpers.buildSelector = undefined;
  const out = targetSize.runInPage({
    document,
    window,
    root: [document],
    rule: { ruleId: 'target-size-minimum' },
    config: undefined,
    helpers,
    engineOptions: {},
    inputs: {}
  });
  const occ = out.occurrences.find((o) => o.data && o.data.details && o.data.details.conflictWith);
  assert.ok(occ, 'a spacing conflict is reported');
  assert.equal(occ.data.details.conflictWith, '#\\31 \\.big');
  assert.equal(
    document.querySelector(occ.data.details.conflictWith),
    document.getElementById('1.big')
  );
});
