'use strict';

/**
 * A selector built from an attribute value or an id names its element
 * whatever the value holds: a control character is escaped as CSS reads it
 * back ("\a " for a newline), and a value no selector can name exactly (a
 * NUL or a lone surrogate, which CSS reads as U+FFFD) gives way to another
 * anchor or the element's path. Checked with the page's own
 * querySelectorAll, in jsdom and in Chromium.
 *
 * The Chromium test is skipped when Playwright or its Chromium build is not
 * installed. Set CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { createDomHelpers } = require('../../src/core/dom-helpers.js');
const { chromium, executablePath, skip } = require('../helpers/chromium');
const { addBundle } = require('../helpers/browserBundle');

// Values for each attribute a selector anchors on, one element each.
const VALUES = [
  'new\nline',
  'tab\there',
  'carriage\rreturn',
  'form\ffeed',
  'bell\u0007',
  'delete\u007f',
  'quote"and\\backslash',
  '\ntrailing\n',
  'nul\u0000inside',
  'lone \ud800 high',
  'lone \udc00 low',
  'pair 😀 ok',
  'ends with high \ud800'
];
const ATTRS = ['id', 'data-testid', 'name', 'aria-label'];

// Builds the elements in `document`, one per attribute and value, each in
// a wrapper of its own so that a path is needed where no anchor can be
// used: an empty button, which button-name-present fails, or for
// aria-label a link whose text the label doesn't contain, which
// label-in-name fails.
function populate(document, values, attrs) {
  const out = [];
  const main = document.createElement('main');
  document.body.appendChild(main);
  for (const attr of attrs) {
    values.forEach((value, i) => {
      const wrap = document.createElement('div');
      const el = document.createElement(attr === 'aria-label' ? 'a' : 'button');
      if (attr === 'aria-label') {
        el.setAttribute('href', '#');
        el.textContent = 'zz';
      }
      el.setAttribute(attr, value);
      wrap.appendChild(el);
      main.appendChild(wrap);
      out.push({ el, label: `${attr} #${i}` });
    });
  }
  // role and aria-label together.
  const span = document.createElement('span');
  span.setAttribute('role', 'link');
  span.setAttribute('tabindex', '0');
  span.setAttribute('aria-label', 'two\nlines');
  span.textContent = 'zz';
  main.appendChild(span);
  out.push({ el: span, label: 'role + aria-label' });
  return out;
}

test('every selector built from an unusual value finds its element, in jsdom', () => {
  const { window } = new JSDOM('<!doctype html><html><body></body></html>', {
    pretendToBeVisual: true
  });
  const { document } = window;
  const elements = populate(document, VALUES, ATTRS);
  const helpers = createDomHelpers({ window, document, root: document });
  const wrong = [];
  for (const { el, label } of elements) {
    const selector = helpers.buildSelector(el);
    let found;
    try {
      found = [...document.querySelectorAll(selector)];
    } catch (e) {
      wrong.push(`${label}: ${JSON.stringify(selector)} does not parse (${e.message})`);
      continue;
    }
    if (found.length !== 1 || found[0] !== el)
      wrong.push(`${label}: ${JSON.stringify(selector)} finds ${found.length}`);
  }
  assert.deepEqual(wrong, []);
});

test('an attribute value with a newline is escaped, not dropped', () => {
  const { window } = new JSDOM('<!doctype html><html><body><a href="/">x</a></body></html>');
  const { document } = window;
  const a = document.querySelector('a');
  a.setAttribute('aria-label', 'new\nline');
  const helpers = createDomHelpers({ window, document, root: document });
  assert.equal(helpers.buildSelector(a), 'a[aria-label="new\\a line"]');
});

test(
  'every selector built from an unusual value finds its element, in Chromium',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    const page = await browser.newPage();
    await page.setContent(
      '<!doctype html><html lang="en"><head><title>t</title></head><body></body></html>'
    );
    await page.evaluate(
      ({ values, attrs, src }) => new Function('return ' + src)()(document, values, attrs).length,
      { values: VALUES, attrs: ATTRS, src: populate.toString() }
    );
    await addBundle(page);
    const got = await page.evaluate(() => {
      const result = window.a11ycore.runa11yCoreInPage(null, null, {}, [
        'button-name-present',
        'label-in-name'
      ]);
      const wrong = [];
      const named = new Set();
      for (const c of result.checksResults) {
        for (const o of c.occurrences || []) {
          if (!o.selector) continue;
          let found;
          try {
            found = document.querySelectorAll(o.selector);
          } catch {
            wrong.push(`${c.ruleId}: ${JSON.stringify(o.selector)} does not parse`);
            continue;
          }
          if (found.length === 1) named.add(found[0]);
          else wrong.push(`${c.ruleId}: ${JSON.stringify(o.selector)} finds ${found.length}`);
        }
      }
      return { wrong, named: named.size };
    });
    await page.close();
    assert.deepEqual(got.wrong, []);
    assert.equal(got.named, VALUES.length * ATTRS.length + 1);
  }
);
