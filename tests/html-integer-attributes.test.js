'use strict';

// Integer attributes read with HTML's rules for parsing integers, against
// what Chromium does with a value out of range (round 11, D10):
// - tabindex: outside the 32-bit range, ignored as if missing;
// - <select size>: up to 4294967295 drawn as given, a larger one ignored;
// - colspan and rowspan: clamped to 1000 and 65534, a negative value is 1;
// - aria-level: outside the 32-bit range, Chromium exposes level 1, as for
//   0; the heading rules ignore it, as they ignore 0 and values above 9.
// Each group runs a rule under jsdom and in Chromium, and checks Chromium's
// own reading.

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { createDomHelpers } = require('../src/core/dom-helpers.js');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');
const { chromium, executablePath, skip } = require('./helpers/chromium');
const { addBundle } = require('./helpers/browserBundle');

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

const LINES = '<p>Line of text.</p>'.repeat(10);
// [value, focusable in Chromium, scrollable-region-focusable's outcome]
const TABINDEX = [
  ['2147483647', true, 'notApplicable'],
  ['2147483648', false, 'cantTell'],
  ['-2147483648', true, 'cantTell'],
  ['-2147483649', false, 'cantTell'],
  ['99999999999999999999', false, 'cantTell']
];
// The box, and a plain element with the same tabindex for Chromium's own
// focus (a scrolling box takes focus in Chromium whatever its tabindex).
const tabindexBox = (v) =>
  `<div id="t" style="overflow:auto;height:40px" tabindex="${v}">${LINES}</div><span id="f" tabindex="${v}">x</span>`;

// [value, Chromium's role, aria-allowed-attr's outcome on aria-multiselectable]
const SIZE = [
  ['1', 'combobox', 'cantTell'],
  ['2', 'listbox', 'pass'],
  ['2147483647', 'listbox', 'pass'],
  ['2147483648', 'listbox', 'pass'],
  ['4294967295', 'listbox', 'pass'],
  ['4294967296', 'combobox', 'cantTell'],
  ['-2', 'combobox', 'cantTell']
];
const sizeSelect = (v) =>
  `<label>Pick <select id="t" size="${v}" aria-multiselectable="true"><option>a</option><option>b</option></select></label>`;

// [attr, value, the cell's span in Chromium, td-has-header's outcome]
const SPANS = [
  ['colspan', '1000', 1000, 'notApplicable'],
  ['colspan', '1001', 1000, 'notApplicable'],
  ['colspan', '4294967296', 1000, 'notApplicable'],
  ['colspan', '0', 1, 'pass'],
  ['colspan', '-1', 1, 'pass'],
  ['colspan', 'x', 1, 'pass'],
  ['rowspan', '65534', 65534, 'notApplicable'],
  ['rowspan', '65535', 65534, 'notApplicable'],
  ['rowspan', '4294967296', 65534, 'notApplicable'],
  ['rowspan', '0', 0, 'notApplicable'],
  ['rowspan', '-1', 1, 'pass'],
  ['rowspan', 'x', 1, 'pass']
];
const spanTable = (attr, v) =>
  `<table><tr><th>A</th><th>B</th><th>C</th></tr><tr><td id="t" ${attr}="${v}">1</td><td>2</td><td>3</td></tr><tr><td>4</td><td>5</td><td>6</td></tr></table>`;

// [value, Chromium's level for an <h3>, page-has-heading-one's outcome]
const LEVEL = [
  ['1', 1, 'pass'],
  ['10', 3, 'cantTell'],
  ['2147483647', 3, 'cantTell'],
  ['2147483648', 1, 'cantTell'],
  ['0', 1, 'cantTell']
];
const levelHeading = (v) => `<h3 id="t" aria-level="${v}">Title</h3><p>Text.</p>`;

function jsdomOutcome(html, ruleId) {
  return runa11yCoreOnHtml(html, { runOnly: [ruleId] }).checksResults.find(
    (c) => c.ruleId === ruleId
  ).outcome;
}

function helpersFor(html) {
  const { window } = new JSDOM(`<!doctype html><html><body>${html}</body></html>`);
  const helpers = createDomHelpers({ window, document: window.document, root: window.document });
  return { helpers, el: window.document.getElementById('t') };
}

test('tabindex out of the 32-bit range is ignored (jsdom)', () => {
  for (const [v, focusable, outcome] of TABINDEX) {
    const { helpers, el } = helpersFor(tabindexBox(v));
    assert.equal(helpers.getFocusableInfo(el).focusable, focusable, v);
    assert.equal(jsdomOutcome(page(tabindexBox(v)), 'scrollable-region-focusable'), outcome, v);
  }
});

test('<select size> up to 4294967295 makes a list box (jsdom)', () => {
  for (const [v, role, outcome] of SIZE) {
    const { helpers, el } = helpersFor(sizeSelect(v));
    assert.equal(helpers.getRoleInfo(el).role, role, v);
    assert.equal(jsdomOutcome(page(sizeSelect(v)), 'aria-allowed-attr'), outcome, v);
  }
});

test('colspan and rowspan are clamped, a negative one is 1 (jsdom)', () => {
  for (const [attr, v, span, outcome] of SPANS) {
    const { helpers, el } = helpersFor(spanTable(attr, v));
    assert.equal(helpers.tableCellSpanOf(el, attr), span, `${attr}=${v}`);
    assert.equal(jsdomOutcome(page(spanTable(attr, v)), 'td-has-header'), outcome, `${attr}=${v}`);
  }
});

test('aria-level out of range is ignored by the heading rules (jsdom)', () => {
  for (const [v, , outcome] of LEVEL) {
    assert.equal(jsdomOutcome(page(levelHeading(v)), 'page-has-heading-one'), outcome, v);
  }
});

test('each group in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const pg = await browser.newPage();
  const cdp = await pg.context().newCDPSession(pg);
  async function run(html, ruleId) {
    await pg.setContent(page(html));
    await addBundle(pg);
    return pg.evaluate(
      (id) =>
        window.a11ycore
          .runa11yCoreInPage(null, null, {}, [id])
          .checksResults.find((c) => c.ruleId === id).outcome,
      ruleId
    );
  }
  // The role or level Chromium's accessibility tree gives #t.
  async function axOf(prop) {
    const { root } = await cdp.send('DOM.getDocument');
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '#t' });
    const { nodes } = await cdp.send('Accessibility.getPartialAXTree', {
      nodeId,
      fetchRelatives: false
    });
    if (prop === 'role') return nodes[0].role.value;
    const p = (nodes[0].properties || []).find((x) => x.name === prop);
    return p ? p.value.value : null;
  }

  await t.test('tabindex', async () => {
    for (const [v, focusable, outcome] of TABINDEX) {
      assert.equal(await run(tabindexBox(v), 'scrollable-region-focusable'), outcome, v);
      const focused = await pg.evaluate(() => {
        const el = document.getElementById('f');
        el.focus();
        return document.activeElement === el;
      });
      assert.equal(focused, focusable, v);
    }
  });

  await t.test('<select size>', async () => {
    for (const [v, role, outcome] of SIZE) {
      assert.equal(await run(sizeSelect(v), 'aria-allowed-attr'), outcome, v);
      assert.equal(await axOf('role'), role, v);
    }
  });

  await t.test('colspan and rowspan', async () => {
    for (const [attr, v, span, outcome] of SPANS) {
      assert.equal(await run(spanTable(attr, v), 'td-has-header'), outcome, `${attr}=${v}`);
      const got = await pg.evaluate(
        (a) => document.getElementById('t')[a === 'colspan' ? 'colSpan' : 'rowSpan'],
        attr
      );
      assert.equal(got, span, `${attr}=${v}`);
    }
  });

  await t.test('aria-level', async () => {
    for (const [v, level, outcome] of LEVEL) {
      assert.equal(await run(levelHeading(v), 'page-has-heading-one'), outcome, v);
      assert.equal(await axOf('level'), level, v);
    }
  });
});
