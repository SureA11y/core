'use strict';

// Browsers give button, input, select and textarea `text-shadow: none`, so
// a shadow on a label around a button doesn't reach the button's text.
// jsdom's computed text-shadow for them depends on what was read before:
// the first read of the button gave no shadow and a later one the label's,
// so a second scan of the same DOM left the button's text out of
// contrast-minimum, which the first had passed. Under jsdom a form
// control's shadow is now the one the page's own rules give it, the same
// on every scan, as Chromium computes it. Round 8, RO-3.

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const core = require('../../src/core.js');

const RULES = { includeRuleIds: ['contrast-minimum', 'contrast-computable'] };

function scanTwice(html) {
  const dom = new JSDOM(html, { url: 'https://example.test/', pretendToBeVisual: true });
  const saved = { window: global.window, document: global.document };
  global.window = dom.window;
  global.document = dom.window.document;
  try {
    const scan = () => {
      const r = core.runDomRulesInPage(dom.window.location.href, null, {}, RULES);
      return Object.fromEntries(
        r.checksResults.map((c) => [c.ruleId, `${c.outcome}/${c.occurrences.length}`])
      );
    };
    return [scan(), scan()];
  } finally {
    global.window = saved.window;
    global.document = saved.document;
    dom.window.close();
  }
}

const page = (head, body) =>
  `<!DOCTYPE html><html lang="en"><head><title>t</title>${head}</head><body><main>${body}</main></body></html>`;

test('contrast: a button in a label with a text-shadow is measured the same on every scan', () => {
  const [first, second] = scanTwice(
    page('', '<label style="text-shadow:0 0 2px #000">then<button>x</button></label>')
  );
  assert.deepEqual(second, first);
  // The button's text is measured (its shadow is none, as in Chromium); the
  // label's own text is asked about for its shadow.
  assert.equal(first['contrast-minimum'], 'pass/1');
  assert.equal(first['contrast-computable'], 'cantTell/1');
});

test("contrast: a form control's own text-shadow, or one it inherits by rule, still counts", () => {
  for (const html of [
    page('', '<button style="text-shadow:0 0 2px #000">x</button>'),
    page(
      '<style>button{text-shadow:inherit}</style>',
      '<label style="text-shadow:0 0 2px #000">then<button>x</button></label>'
    ),
    page('<style>*{text-shadow:0 0 1px red}</style>', '<button>x</button>')
  ]) {
    const [first, second] = scanTwice(html);
    assert.deepEqual(second, first, html);
    assert.equal(first['contrast-minimum'], 'notApplicable/0', html);
  }
});
