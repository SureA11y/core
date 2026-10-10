'use strict';

// jsdom can't compute the style of a formula: reading the style of <math>,
// or a property of an element inside it, throws, and which one throws
// changes as the page is read. Without a layout, an element of a formula
// takes the style of the element around the formula, so no rule errors and
// two scans of one page agree. Rules read styles through
// ctx.helpers.computedStyle, which seven rules asked for and didn't find.

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../../src/testing.js');

const page = (body) =>
  `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;

// The audit's pages (CO-3), each of which made rules error.
const FORMULAS = [
  '<math><mn><mi></mi></mn></math>',
  '<math><mtext><nav></nav></mtext></math>',
  '<math><mn><object></object></mn></math>',
  '<math><mfrac lang=" "><mn><semantics></semantics></mn></mfrac></math>',
  '<main><p>The area is <math><mi>x</mi><mo>=</mo><mn>2</mn></math>.</p></main>'
];

test('no rule errors on an element inside a formula, and two scans agree', () => {
  for (const body of FORMULAS) {
    const first = runa11yCoreOnHtml(page(body));
    const second = runa11yCoreOnHtml(page(body));
    assert.deepEqual(
      first.checksResults.filter((c) => c.error).map((c) => `${c.ruleId}: ${c.error}`),
      [],
      body
    );
    const outcomes = (r) => r.checksResults.map((c) => [c.ruleId, c.outcome, c.occurrences.length]);
    assert.deepEqual(outcomes(second), outcomes(first), body);
  }
});

test('an element of a formula takes the style of the element around it', () => {
  const rule = {
    id: 'acme-style',
    meta: { title: 'Reads a style' },
    runInPage(ctx) {
      const cs = ctx.helpers.computedStyle(ctx.document.querySelector('mi'));
      const around = ctx.helpers.computedStyle(ctx.document.querySelector('p'));
      return {
        outcome: cs.color === around.color && cs.display === around.display ? 'pass' : 'fail',
        occurrences: []
      };
    }
  };
  const result = runa11yCoreOnHtml(
    page('<p style="color: rgb(1, 2, 3)"><math><mi>x</mi></math></p>'),
    { runOnly: ['acme-style'], engineOptions: { customRules: [rule] } }
  );
  assert.equal(result.checksResults[0].outcome, 'pass', result.checksResults[0].error);
});

// A browser computes a formula's style, and it is read as any other.
let chromium = null;
try {
  ({ chromium } = require('playwright'));
} catch {}

test(
  'in Chromium, an element of a formula has its own style',
  { skip: chromium ? false : 'playwright not installed' },
  async (t) => {
    const fs = require('node:fs');
    const path = require('node:path');
    const browser = await chromium.launch();
    t.after(() => browser.close());
    const p = await browser.newPage();
    await p.setContent(
      page(
        '<p style="color: rgb(1, 2, 3)"><math style="color: rgb(200, 0, 0)"><mi>x</mi></math></p>'
      )
    );
    await p.addScriptTag({
      content: fs.readFileSync(path.join(__dirname, '../../surea11y.browser.js'), 'utf8')
    });
    const color = await p.evaluate(() => {
      const rule = {
        id: 'acme-style',
        meta: { title: 'Reads a style' },
        runInPage:
          'function (ctx) { return { outcome: "pass", occurrences: [], data: { color: ctx.helpers.computedStyle(ctx.document.querySelector("mi")).color } }; }'
      };
      const r = window.a11ycore.runa11yCoreInPage(null, null, { customRules: [rule] }, [
        'acme-style'
      ]);
      return r.checksResults[0].data && r.checksResults[0].data.color;
    });
    assert.equal(color, 'rgb(200, 0, 0)');
  }
);
